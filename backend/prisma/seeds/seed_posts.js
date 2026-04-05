/* eslint-disable no-console */
/**
 * Seed bài viết từ posts.json — **xóa hết Post + Tag** trước, rồi tạo lại (không xóa Category).
 *
 * Điều kiện: đã có user ADMIN (npm run db:seed) và posts.json tồn tại.
 *
 * Chạy local:  cd backend && node prisma/seeds/seed_posts.js
 * Docker:      docker compose exec backend node prisma/seeds/seed_posts.js
 */
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const prisma = require('../../src/utils/prisma');
const { calculateReadTime, generateDeterministicTagSlug } = require('../../src/utils/postHelpers');

/**
 * Thứ tự ưu tiên: POSTS_JSON_PATH → prisma/seeds/data/posts.json → backend/posts.json →
 * repo root → cwd.
 */
function resolvePostsJsonPath() {
  const candidates = [
    process.env.POSTS_JSON_PATH,
    path.join(__dirname, 'data/posts.json'),
    path.join(__dirname, '../../posts.json'),
    path.join(__dirname, '../../../posts.json'),
    path.join(process.cwd(), 'posts.json'),
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const CATEGORY_MAP = {
  'tin-cong-nghe': 'Tin công nghệ',
  'tu-van': 'Tư vấn',
  'tren-tay': 'Trên tay',
  'danh-gia': 'Đánh giá',
  'thu-thuat': 'Thủ thuật',
};

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/**
 * Xóa toàn bộ bài viết và liên kết (post_tags cascade qua Post).
 * Xóa luôn bảng tags để seed tạo lại tag sạch (không xóa Category).
 */
async function wipePostRelatedData() {
  const postsDeleted = await prisma.post.deleteMany({});
  console.log(`🗑️  Đã xóa ${postsDeleted.count} bài viết (post_tags đi kèm).`);
  const tagsDeleted = await prisma.tag.deleteMany({});
  console.log(`🗑️  Đã xóa ${tagsDeleted.count} tag.`);
}

/**
 * @returns {Promise<Record<string, number>>}
 */
async function upsertCategories() {
  /** @type {Record<string, number>} */
  const idBySlug = {};
  for (const [slug, name] of Object.entries(CATEGORY_MAP)) {
    const row = await prisma.category.upsert({
      where: { slug },
      create: { name, slug },
      update: { name },
    });
    idBySlug[slug] = row.id;
    console.log(`[categories] ${slug} → id=${row.id}`);
  }
  return idBySlug;
}

/**
 * @param {string[]} tagNames
 */
async function ensureTags(tagNames) {
  const unique = [...new Set((tagNames || []).map((t) => String(t).trim()).filter(Boolean))];
  for (const name of unique) {
    const slug = generateDeterministicTagSlug(name);
    await prisma.tag.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
    });
  }
  return unique;
}

/**
 * Cắt plain text tối đa `maxLen` ký tự; nếu phải cắt thì thêm "..." (tổng độ dài ≤ maxLen).
 * @param {string} text
 * @param {number} maxLen
 * @returns {string | null}
 */
function excerptWithEllipsis(text, maxLen = 300) {
  const t = String(text || '').trim();
  if (!t) return null;
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 3).trimEnd()}...`;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {any} post
 * @param {Record<string, number>} catIdBySlug
 * @param {string} authorId
 */
function buildPostCreateData(post, catIdBySlug, authorId) {
  const catSlug = post.category && post.category.slug;
  const categoryId = catSlug != null ? catIdBySlug[catSlug] : undefined;
  if (categoryId == null) {
    throw new Error(`Không tìm thấy category cho slug: ${catSlug}`);
  }

  const excerptRaw = (post.excerpt || '').trim();
  let excerpt =
    excerptRaw.length > 0
      ? excerptWithEllipsis(excerptRaw, 300)
      : excerptWithEllipsis(stripHtml(post.content), 300);

  const tagNames = [...new Set((post.tags || []).map((t) => String(t).trim()).filter(Boolean))];
  const tagCreates = tagNames.map((name) => ({
    tag: { connect: { slug: generateDeterministicTagSlug(name) } },
  }));

  return {
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt,
    coverImage: post.thumbnail || null,
    status: 'PUBLISHED',
    readTime: calculateReadTime(post.content || ''),
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    viewCount: randInt(100, 5000),
    authorId,
    categoryId,
    ...(tagCreates.length
      ? {
          tags: {
            create: tagCreates,
          },
        }
      : {}),
  };
}

async function main() {
  const postsPath = resolvePostsJsonPath();
  if (!postsPath) {
    throw new Error(
      'Không tìm thấy posts.json. Đặt file tại prisma/seeds/data/posts.json hoặc set POSTS_JSON_PATH=...',
    );
  }
  console.log(`📄 Dùng: ${postsPath}`);

  const raw = fs.readFileSync(postsPath, 'utf-8');
  const data = JSON.parse(raw);
  const posts = Array.isArray(data.posts) ? data.posts : [];

  await wipePostRelatedData();

  console.log(`📚 Bắt đầu seed ${posts.length} bài viết từ posts.json...`);

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    throw new Error(
      'Không tìm thấy user ADMIN. Chạy trước: npm run db:seed (hoặc tạo admin thủ công).',
    );
  }

  const catIdBySlug = await upsertCategories();

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  /** @type {Record<string, number>} */
  const countByCat = {};
  Object.keys(CATEGORY_MAP).forEach((k) => {
    countByCat[k] = 0;
  });

  const seenSlugs = new Set();

  for (let i = 0; i < posts.length; i += 1) {
    const post = posts[i];
    const idx = i + 1;
    const slug = post && post.slug;

    if (!slug) {
      console.warn(`[${idx}/${posts.length}] ⚠ Bỏ qua: thiếu slug`);
      skipped += 1;
      continue;
    }

    if (seenSlugs.has(slug)) {
      console.warn(`[${idx}/${posts.length}] ⚠ Bỏ qua (trùng slug trong JSON): ${slug}`);
      skipped += 1;
      continue;
    }
    seenSlugs.add(slug);

    try {
      await ensureTags(post.tags || []);

      const createData = buildPostCreateData(post, catIdBySlug, admin.id);

      await prisma.post.upsert({
        where: { slug },
        update: {},
        create: createData,
      });

      const catSlug = post.category && post.category.slug;
      if (catSlug && countByCat[catSlug] != null) {
        countByCat[catSlug] += 1;
      }

      ok += 1;
      const catLabel = catSlug || '?';
      console.log(`[${idx}/${posts.length}] ✓ ${post.title.slice(0, 60)} (${catLabel})`);
    } catch (e) {
      failed += 1;
      console.warn(`[${idx}/${posts.length}] ✗ Lỗi ${slug}:`, e.message || e);
    }
  }

  const catSummary = Object.keys(CATEGORY_MAP)
    .map((s) => `${s}(${countByCat[s] || 0})`)
    .join(' ');

  console.log('');
  console.log('=== SEED SUMMARY ===');
  console.log(`✅ Thành công : ${ok}/${posts.length} bài`);
  console.log(`⚠️  Bỏ qua    : ${skipped} bài (trùng/thiếu dữ liệu)`);
  console.log(`✗ Lỗi       : ${failed} bài`);
  console.log(`📂 Categories : ${catSummary}`);
  console.log('✅ Seed posts hoàn tất!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
