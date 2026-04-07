#!/usr/bin/env python3
"""
Crawl bài viết từ Sforum (cellphones.com.vn/sforum) → posts.json.

- Listing: Playwright Chromium (headless), networkidle + optional scroll.
- Chi tiết bài: HTTP (SSR đầy đủ JSON-LD + content-detail).
- Delay 2–4s giữa mọi request (listing + từng bài), tuần tự.

Chạy:
  uv pip install playwright beautifulsoup4 && python -m playwright install chromium
  python3 scripts/crawl_sforum.py --posts-per-category 1
  python3 scripts/crawl_sforum.py -o posts.json
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import random
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

# --- Cấu hình category (theo spec) ---
CATEGORIES: list[dict[str, str]] = [
    {
        "slug": "tin-cong-nghe",
        "label": "Tin công nghệ",
        "url": "https://cellphones.com.vn/sforum/tin-cong-nghe",
    },
    {
        "slug": "tu-van",
        "label": "Tư vấn",
        "url": "https://cellphones.com.vn/sforum/tu-van",
    },
    {
        "slug": "tren-tay",
        "label": "Trên tay",
        "url": "https://cellphones.com.vn/sforum/tren-tay",
    },
    {
        "slug": "danh-gia",
        "label": "Đánh giá",
        "url": "https://cellphones.com.vn/sforum/danh-gia",
    },
    {
        "slug": "thu-thuat",
        "label": "Thủ thuật",
        "url": "https://cellphones.com.vn/sforum/thu-thuat",
    },
]

DEFAULT_POSTS_PER_CATEGORY = 10

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Slug đúng một segment /sforum/{slug} — không phải bài viết
NAV_SLUGS: set[str] = {
    "sforum",
    "tin-cong-nghe",
    "tu-van",
    "tren-tay",
    "danh-gia",
    "thu-thuat",
    "author",
    "tag",
    "gioi-thieu",
    "games",
    "khuyen-mai",
    "so-sanh",
    "manifest.json",
    "chinh-sach-bao-mat-thong-tin-nguoi-su-dung",
    "thoa-thuan-cung-cap-va-su-dung-dich-vu",
}

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("crawl_sforum")

# JS: thu thập bài theo thứ tự DOM, mỗi slug một lần
LISTING_EXTRACT_JS = """
() => {
  const NAV = new Set(%s);
  const base = "https://cellphones.com.vn";
  const out = [];
  const seen = new Set();

  const anchors = Array.from(document.querySelectorAll('a[href^="/sforum/"]'));
  for (const a of anchors) {
    const href = a.getAttribute("href") || "";
    const m = href.match(/^\\/sforum\\/([^/?#]+)\\/?$/);
    if (!m) continue;
    const slug = m[1];
    if (NAV.has(slug)) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    const card =
      a.closest(".swiper-slide") ||
      a.closest("div.relative.flex.items-start") ||
      a.closest("article") ||
      a.closest("div[class*=\\"relative\\"]") ||
      a.parentElement;

    let thumbnail = "";
    const img = card ? card.querySelector('img[src*="cdn-media.sforum.vn"]') : null;
    if (img) {
      thumbnail = img.getAttribute("src") || img.getAttribute("data-src") || "";
    }

    let title = "";
    const h = card ? card.querySelector("h2, h3") : null;
    if (h) title = (h.textContent || "").trim();
    if (!title) title = (a.textContent || "").trim();

    let excerpt = "";
    const ex = card
      ? card.querySelector("span.line-clamp-3") ||
        card.querySelector('span[class*="line-clamp-3"]') ||
        card.querySelector('span[class*="line-clamp"]')
      : null;
    if (ex) excerpt = (ex.textContent || "").replace(/\\s+/g, " ").trim();

    let dateStr = "";
    const txt = card ? card.textContent || "" : "";
    const dm = txt.match(/Ngày đăng\\s*(\\d{2}\\/\\d{2}\\/\\d{4}\\s+\\d{2}:\\d{2})/);
    if (dm) dateStr = dm[1];

    const path = href.split("?")[0];
    out.push({
      slug,
      sourceUrl: base + path,
      title,
      thumbnail,
      excerpt,
      dateStr,
    });
  }
  return out;
}
""" % (json.dumps(sorted(NAV_SLUGS)),)


def random_delay() -> float:
    return random.uniform(2.0, 4.0)


async def sleep_rate_limit() -> None:
    await asyncio.sleep(random_delay())


def fetch_html(url: str, *, timeout: int = 60) -> str:
    req = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")


def parse_article_ld_json(html: str) -> dict[str, Any] | None:
    """NewsArticle hoặc Article (một số trang thủ thuật/FAQ chỉ dùng Article)."""
    accepted = frozenset({"NewsArticle", "Article"})
    for m in re.finditer(
        r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
        html,
        re.DOTALL | re.IGNORECASE,
    ):
        raw = m.group(1).strip()
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and data.get("@type") in accepted:
            return data
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and item.get("@type") in accepted:
                    return item
    return None


def meta_og_image(html: str) -> str | None:
    m = re.search(
        r'<meta\s+property="og:image"\s+content="([^"]+)"',
        html,
        re.IGNORECASE,
    )
    return m.group(1) if m else None


def slug_from_source_url(url: str) -> str:
    path = urlparse(url).path.strip("/")
    parts = path.split("/")
    if len(parts) >= 2 and parts[0] == "sforum":
        return parts[1]
    return parts[-1] if parts else ""


def published_at_iso(ld: dict[str, Any]) -> str | None:
    """Giữ giờ theo chuỗi gốc (timezone offset), không đổi sang UTC."""
    raw = ld.get("datePublished") or ld.get("dateCreated")
    if not raw or not isinstance(raw, str):
        return None
    m = re.match(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})", raw.strip())
    return m.group(1) if m else None


def extract_content_detail_html(html: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    # class có thể là str hoặc list — dùng selector ổn định
    div = soup.select_one("div.content-detail")
    if not div:
        return None
    return clean_article_html(div)


def clean_article_html(soup_tag: Any) -> str:
    for bad in soup_tag.find_all(["script", "style", "iframe"]):
        bad.decompose()

    for el in soup_tag.find_all(True):
        classes = " ".join(el.get("class") or [])
        cid = (el.get("id") or "").lower()
        combined = (classes + " " + cid).lower()
        if any(
            x in combined
            for x in (
                "advertisement",
                "adsbygoogle",
                "sforum-ad",
                "banner-ad",
                "related-post",
                "relatedpost",
                "tin-lien-quan",
            )
        ):
            el.decompose()

    # Bỏ khối "Thẻ:" (đã tách sang field tags)
    for span in list(soup_tag.find_all("span")):
        text = (span.get_text() or "").strip()
        if text.startswith("Thẻ:") or text.replace(" ", "") == "Thẻ:":
            parent = span.parent
            if parent:
                parent.decompose()

    return str(soup_tag)


def extract_dedicated_tags(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    tags: list[str] = []
    for span in soup.find_all("span"):
        t = (span.get_text() or "").strip()
        if not (t.startswith("Thẻ:") or t.replace(" ", "") == "Thẻ:"):
            continue
        parent = span.parent
        if not parent:
            continue
        for a in parent.find_all("a", href=True):
            if a.get("target") == "_blank":
                continue
            href = a.get("href") or ""
            if "/sforum/tag/" not in href:
                continue
            name = (a.get_text() or "").strip()
            if name:
                tags.append(name)
    return tags


async def collect_listing_for_category(page: Any, category_url: str) -> list[dict[str, Any]]:
    await page.goto(category_url, wait_until="domcontentloaded", timeout=90_000)
    try:
        await page.wait_for_load_state("networkidle", timeout=45_000)
    except Exception:
        log.warning("networkidle timeout — tiếp tục với trạng thái hiện tại")
    prev_h = 0
    for i in range(24):
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(700)
        try:
            await page.wait_for_load_state("networkidle", timeout=18_000)
        except Exception:
            pass
        h = await page.evaluate("document.body.scrollHeight")
        if i > 2 and h == prev_h:
            break
        prev_h = h
    # Nút "Xem thêm" nạp thêm bài (ví dụ Trên tay: đủ 10+ link sau khi bấm)
    for _ in range(5):
        try:
            more = page.locator("text=Xem thêm").first
            if not await more.is_visible(timeout=1500):
                break
            await more.click(timeout=5000)
            await page.wait_for_timeout(1200)
            try:
                await page.wait_for_load_state("networkidle", timeout=25_000)
            except Exception:
                pass
        except Exception:
            break
    items = await page.evaluate(LISTING_EXTRACT_JS)
    if not isinstance(items, list):
        return []
    return items


def build_post_record(
    listing: dict[str, Any],
    category: dict[str, str],
    html: str,
) -> dict[str, Any]:
    ld = parse_article_ld_json(html)
    if not ld:
        raise ValueError("Không tìm thấy JSON-LD NewsArticle/Article")

    title = (ld.get("headline") or ld.get("name") or listing.get("title") or "").strip()
    if not title:
        raise ValueError("Thiếu title")

    author: str | None = None
    auth = ld.get("author")
    if isinstance(auth, dict):
        author = auth.get("name")
    elif isinstance(auth, str):
        author = auth

    thumb = meta_og_image(html) or (listing.get("thumbnail") or "").strip()
    if not thumb:
        img_ld = ld.get("image")
        if isinstance(img_ld, str):
            thumb = img_ld.strip()
        elif isinstance(img_ld, dict):
            thumb = (img_ld.get("url") or img_ld.get("@id") or "").strip()
        elif isinstance(img_ld, list) and img_ld:
            first = img_ld[0]
            if isinstance(first, str):
                thumb = first.strip()
            elif isinstance(first, dict):
                thumb = (first.get("url") or "").strip()
    if not thumb:
        raise ValueError("Thiếu thumbnail")

    content_html = extract_content_detail_html(html)
    if not content_html or not content_html.strip():
        raise ValueError("Thiếu content")

    excerpt = (listing.get("excerpt") or "").strip()
    tags = extract_dedicated_tags(html)

    published_at = published_at_iso(ld)
    if not published_at:
        raise ValueError("Không parse được publishedAt")

    slug = listing.get("slug") or slug_from_source_url(listing["sourceUrl"])

    return {
        "title": title,
        "slug": slug,
        "excerpt": excerpt,
        "thumbnail": thumb,
        "content": content_html,
        "publishedAt": published_at,
        "category": {"slug": category["slug"], "label": category["label"]},
        "tags": tags,
        "author": author,
        "sourceUrl": listing["sourceUrl"],
    }


async def run_crawl(posts_per_category: int, output_path: Path) -> tuple[list[dict[str, Any]], dict[str, int]]:
    seen_urls: set[str] = set()
    posts: list[dict[str, Any]] = []
    per_cat_counts: dict[str, int] = {c["slug"]: 0 for c in CATEGORIES}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=USER_AGENT,
            locale="vi-VN",
        )
        page = await context.new_page()

        try:
            for cat in CATEGORIES:
                log.info("Đang tải danh sách: %s (%s)", cat["label"], cat["url"])
                await sleep_rate_limit()
                try:
                    listing_items = await collect_listing_for_category(page, cat["url"])
                except Exception as e:
                    log.warning("Lỗi listing %s: %s — bỏ qua category", cat["url"], e)
                    continue

                for item in listing_items:
                    if per_cat_counts[cat["slug"]] >= posts_per_category:
                        break
                    url = item.get("sourceUrl")
                    if not url or url in seen_urls:
                        continue

                    n = per_cat_counts[cat["slug"]] + 1
                    slug = item.get("slug", "")
                    log.info("[%d/%d] Đang crawl: %s...", n, posts_per_category, slug)

                    try:
                        await sleep_rate_limit()
                        html = fetch_html(url)
                        rec = build_post_record(item, cat, html)
                        char_len = len(rec.get("content") or "")
                        log.info("✓ Xong: %s (%d ký tự)", rec["title"][:60], char_len)
                        posts.append(rec)
                        seen_urls.add(url)
                        per_cat_counts[cat["slug"]] += 1
                    except (HTTPError, URLError, OSError, ValueError) as e:
                        log.warning("Bỏ qua bài %s: %s", url, e)
                        continue
                    except Exception as e:
                        log.warning("Bỏ qua bài %s: %s", url, e)
                        continue
        finally:
            await browser.close()

    crawled_at = datetime.now(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%S")
    payload = {
        "crawledAt": crawled_at,
        "totalPosts": len(posts),
        "categories": [c["slug"] for c in CATEGORIES],
        "posts": posts,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return posts, per_cat_counts


def main() -> None:
    ap = argparse.ArgumentParser(description="Crawl Sforum → posts.json")
    ap.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "posts.json",
        help="File JSON đầu ra (mặc định: thư mục gốc project / posts.json)",
    )
    ap.add_argument(
        "-n",
        "--posts-per-category",
        type=int,
        default=DEFAULT_POSTS_PER_CATEGORY,
        metavar="N",
        help="Số bài mỗi category (mặc định 10 → 50 bài tổng)",
    )
    args = ap.parse_args()
    if args.posts_per_category < 1:
        ap.error("--posts-per-category phải >= 1")

    posts, per_cat = asyncio.run(run_crawl(args.posts_per_category, args.output))

    size_kb = args.output.stat().st_size / 1024 if args.output.exists() else 0
    print()
    print("   ✅ Crawl hoàn tất!")
    for c in CATEGORIES:
        got = per_cat.get(c["slug"], 0)
        print(f"   - {c['slug']}: {got}/{args.posts_per_category} bài")
    print(f"   - Tổng: {len(posts)} bài | File: {args.output} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
