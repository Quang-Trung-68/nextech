/* eslint-disable no-console */
/**
 * Seed 2 danh mục (upsert) + 20 bài viết PUBLISHED mới mỗi lần chạy.
 * Slug luôn unique (có mã lô) — không xóa bài cũ, không trùng slug.
 *
 * Chạy local:  npm run db:seed:demo-posts   (từ thư mục backend)
 * Docker:      xem prisma/SEED_POST.md
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = require('../src/utils/prisma');
const { calculateReadTime, generateExcerpt } = require('../src/utils/postHelpers');

const CATEGORIES = [
  { name: 'Công nghệ & Xu hướng', slug: 'cong-nghe-xu-huong' },
  { name: 'Hướng dẫn & Tips', slug: 'huong-dan-tips' },
];

const TITLES_CAT1 = [
  'AI trong phát triển phần mềm năm 2026',
  'Chip Snapdragon mới: điểm nhấn cho flagship Android',
  'Bảo mật ứng dụng web: OWASP và thực tiễn',
  'Cloud-native: Kubernetes còn cần thiết không?',
  'Trí tuệ nhân tạo tạo sinh và bản quyền nội dung',
  'So sánh React Server Components và SPA truyền thống',
  'Edge computing và CDN: giảm độ trễ toàn cầu',
  'Thị trường smartphone Việt Nam: xu hướng quý gần đây',
  'Màn hình OLED vs Mini-LED: lựa chọn cho laptop',
  'Pin và sạc nhanh: chuẩn USB-C thống nhất',
];

const TITLES_CAT2 = [
  'Bắt đầu với TypeScript cho người quen JavaScript',
  'CSS Grid và Flexbox: khi nào dùng cái nào?',
  'Git workflow cho nhóm nhỏ: trunk-based đơn giản',
  'Viết API REST sạch: mã lỗi và versioning',
  'Tối ưu Core Web Vitals cho trang bán hàng',
  'Docker Compose cho môi trường dev fullstack',
  'Prisma migrate an toàn trên production',
  'React Query: cache và đồng bộ server state',
  'Accessibility cơ bản: ARIA và bàn phím',
  'Viết test E2E với Playwright: pattern tối thiểu',
];

function buildHtmlParagraphs(topic) {
  return `
<p><strong>${topic}</strong> — đây là đoạn mở bài mẫu dùng cho môi trường dev. Nội dung được tạo tự động, không mang tính tư vấn chuyên sâu.</p>
<p>Đoạn thứ hai mô tả thêm ngữ cảnh và lý do chủ đề này đáng chú ý trong bối cảnh công nghệ hiện tại. Bạn có thể chỉnh sửa hoặc xóa sau khi seed.</p>
<h2>Điểm chính</h2>
<p>Danh sách gợi ý: (1) thử nghiệm trên staging; (2) đo hiệu năng trước khi tối ưu; (3) ghi chú thay đổi schema khi triển khai.</p>
<p>Kết luận ngắn: seed giúp kiểm tra giao diện tin tức, phân trang và SEO cơ bản trên NexTech.</p>
`.trim();
}

/** Mã lô unique mỗi lần chạy — dùng slug + phân biệt tiêu đề trong admin. */
function makeRunId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    throw new Error(
      'Không tìm thấy user ADMIN. Chạy trước: npm run db:seed (hoặc tạo admin thủ công).',
    );
  }

  const cats = [];
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug },
      update: { name: c.name },
    });
    cats.push(row);
    console.log(`[seed_post] Danh mục: ${row.name} (id=${row.id})`);
  }

  const runId = makeRunId();
  const baseTs = Date.now();
  let n = 0;

  for (let i = 0; i < TITLES_CAT1.length; i += 1) {
    const baseTitle = TITLES_CAT1[i];
    const title = `${baseTitle} [${runId}]`;
    const slug = `nex-seed-${runId}-c1-${i + 1}`;
    const html = buildHtmlParagraphs(baseTitle);
    const readTime = calculateReadTime(html);
    const excerpt = generateExcerpt(html, 280);
    const publishedAt = new Date(baseTs - (n + 1) * 3600_000);

    await prisma.post.create({
      data: {
        title,
        slug,
        content: html,
        excerpt,
        coverImage: `https://picsum.photos/seed/${runId}${n}/800/450`,
        status: 'PUBLISHED',
        readTime,
        publishedAt,
        viewCount: (n % 7) * 12 + 3,
        authorId: admin.id,
        categoryId: cats[0].id,
      },
    });
    n += 1;
    console.log(`[seed_post] + ${slug}`);
  }

  for (let i = 0; i < TITLES_CAT2.length; i += 1) {
    const baseTitle = TITLES_CAT2[i];
    const title = `${baseTitle} [${runId}]`;
    const slug = `nex-seed-${runId}-c2-${i + 1}`;
    const html = buildHtmlParagraphs(baseTitle);
    const readTime = calculateReadTime(html);
    const excerpt = generateExcerpt(html, 280);
    const publishedAt = new Date(baseTs - (n + 1) * 3600_000);

    await prisma.post.create({
      data: {
        title,
        slug,
        content: html,
        excerpt,
        coverImage: `https://picsum.photos/seed/${runId}${n}/800/450`,
        status: 'PUBLISHED',
        readTime,
        publishedAt,
        viewCount: (n % 5) * 15 + 1,
        authorId: admin.id,
        categoryId: cats[1].id,
      },
    });
    n += 1;
    console.log(`[seed_post] + ${slug}`);
  }

  console.log(`[seed_post] Hoàn tất: 20 bài mới (lô ${runId}). Bài cũ được giữ nguyên.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
