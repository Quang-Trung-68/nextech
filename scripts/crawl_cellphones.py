#!/usr/bin/env python3
"""
Crawl sản phẩm từ cellphones.com.vn.

Mặc định dùng HTTP (urllib) — nhanh; JSON-LD nằm trong HTML tĩnh.
Chỉ cần Playwright nếu bật --playwright (chậm, cài browser).

Mục tiêu: 5 danh mục × 5 hãng × N SP/hãng. Mặc định N=5 → 125 SP.

Fields gần với backend/prisma Product + Brand + ProductImage:
  name, slug, description, price, salePrice, stock, category, brandName, brandSlug,
  imageUrl, images, rating, numReviews, specs (dict), originalPrice, discountPercent, discount

Máy tính bảng: listing đúng là https://cellphones.com.vn/tablet/{hãng}.html
(không dùng may-tinh-bang/{hãng}.html — server trả 404).

Chạy (chỉ cần Python 3, không bắt buộc Playwright):
  python3 scripts/crawl_cellphones.py -o products.json -n 5

Tùy chọn delay (mặc định 1–2s giữa mỗi request):
  python3 scripts/crawl_cellphones.py --delay-min 0.5 --delay-max 1

Playwright (chậm, cần cài):
  uv pip install playwright && python -m playwright install chromium
  python3 scripts/crawl_cellphones.py --playwright
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable
from urllib.parse import urlparse
from urllib.error import HTTPError, URLError
import urllib.request

# --- Cấu hình crawl (có thể ghi đè bằng CLI) ---
# 5 danh mục × 5 hãng × 5 SP = 125. Với 10 SP/hãng → 250 tổng.
DEFAULT_PRODUCTS_PER_COMBO = 5

# (nhãn JSON category → key nội bộ cho URL listing)
CATEGORIES: list[tuple[str, str]] = [
    ("điện thoại", "mobile"),
    ("laptop", "laptop"),
    ("tai nghe", "tai-nghe"),
    ("phụ kiện", "phu-kien"),
    ("máy tính bảng", "tablet"),
]

# Thử theo thứ tự; bỏ qua hãng không có SP, lấy đủ 5 hãng/category.
BRAND_SLUG_CANDIDATES: list[str] = [
    "apple",
    "samsung",
    "xiaomi",
    "oppo",
    "realme",
    "asus",
    "lenovo",
    "sony",
    "vivo",
    "jbl",
    "anker",
    "dell",
    "hp",
    "msi",
    "acer",
    "lg",
    "honor",
    "tecno",
    "nokia",
    "belkin",
    "philips",
]

# Slug trang danh mục / link nhiễu trong footer (không phải trang sản phẩm).
NAV_SLUG_BLOCKLIST: set[str] = {
    "mobile",
    "tablet",
    "laptop",
    # Máy in / thiết bị văn phòng hay lẫn trong HTML listing tablet
    "may-in",
    "may-photocopy",
    "may-chieu",
    "phu-kien",
    "thiet-bi-am-thanh",
    "do-choi-cong-nghe",
    "hang-cu",
    "danh-sach-khuyen-mai",
    "sforum",
    "may-tinh-de-ban",
    "man-hinh",
    "tivi",
    "dien-may",
    "do-gia-dung",
    "flycam",
    "may-anh",
    "tu-lanh",
    "tu-dong",
}


def brand_listing_url(category_key: str, brand_slug: str) -> str:
    if category_key == "mobile":
        return f"https://cellphones.com.vn/mobile/{brand_slug}.html"
    if category_key == "laptop":
        return f"https://cellphones.com.vn/laptop/{brand_slug}.html"
    if category_key == "tai-nghe":
        return f"https://cellphones.com.vn/thiet-bi-am-thanh/tai-nghe/{brand_slug}.html"
    if category_key == "phu-kien":
        return f"https://cellphones.com.vn/phu-kien/{brand_slug}.html"
    # Không dùng may-tinh-bang/{brand}.html — site trả 404. Đúng: /tablet/{brand}.html
    if category_key == "tablet":
        return f"https://cellphones.com.vn/tablet/{brand_slug}.html"
    raise ValueError(category_key)


UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def fetch_html(url: str, *, timeout: int = 45) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")


def make_delay(delay_min: float, delay_max: float) -> Callable[[], None]:
    def _delay() -> None:
        time.sleep(random.uniform(delay_min, delay_max))

    return _delay


def parse_vnd_amounts(html: str) -> list[int]:
    out: list[int] = []
    for m in re.finditer(r"(\d[\d\.]*)\s*(?:₫|đ)\b", html):
        raw = m.group(1).replace(".", "")
        try:
            v = int(raw)
        except ValueError:
            continue
        if v >= 10_000:
            out.append(v)
    return out


def slug_from_product_url(url: str) -> str | None:
    try:
        path = urlparse(url).path.strip("/")
        if not path.endswith(".html"):
            return None
        seg = path.split("/")[-1]
        if not seg.endswith(".html"):
            return None
        return seg[:-5]
    except Exception:
        return None


def extract_product_urls_from_html(html: str) -> list[str]:
    found = re.findall(
        r'https://cellphones\.com\.vn/([a-z0-9\-]+)\.html',
        html,
        flags=re.IGNORECASE,
    )
    urls: list[str] = []
    seen: set[str] = set()
    for slug in found:
        s = slug.lower()
        if s in NAV_SLUG_BLOCKLIST:
            continue
        if len(s) < 6:
            continue
        url = f"https://cellphones.com.vn/{s}.html"
        if url not in seen:
            seen.add(url)
            urls.append(url)
    return urls


def _is_noise_non_tablet_slug(slug: str) -> bool:
    """Loại slug lẫn từ footer / SP khác (điện thoại, máy in...) trên trang tablet."""
    s = slug.lower()
    if s.startswith("iphone"):
        return True
    if s.startswith("macbook") or s.startswith("imac"):
        return True
    if s.startswith("airpods") or "apple-watch" in s or s.startswith("apple-watch"):
        return True
    if s.startswith("samsung-galaxy-s") or s.startswith("samsung-galaxy-z") or s.startswith("samsung-galaxy-a"):
        # Điện thoại Samsung, không phải Tab
        if "tab" not in s:
            return True
    return False


def prioritize_tablet_product_urls(urls: list[str]) -> list[str]:
    """Lọc + sắp xếp URL listing tablet: bỏ iPhone/MacBook lẫn trong HTML; ưu tiên may-tinh-bang-*, iPad..."""

    def score(slug: str) -> tuple[int, str]:
        s = slug.lower()
        if s.startswith("may-tinh-bang-"):
            return (0, s)
        if s.startswith("ipad") or s.startswith("apple-ipad"):
            return (1, s)
        if "galaxy-tab" in s or "matepad" in s or "redmi-pad" in s or "poco-pad" in s:
            return (2, s)
        if s.startswith("masstel-tab"):
            return (3, s)
        if "tab-" in s and ("lenovo" in s or "nubia" in s):
            return (4, s)
        return (8, s)

    scored: list[tuple[tuple[int, str], str]] = []
    for u in urls:
        ps = slug_from_product_url(u)
        if not ps or _is_noise_non_tablet_slug(ps):
            continue
        scored.append((score(ps), u))
    scored.sort(key=lambda x: (x[0][0], x[0][1]))
    return [u for _, u in scored]


def parse_product_ld_json(html: str) -> dict[str, Any] | None:
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
        if isinstance(data, dict) and data.get("@type") == "Product":
            return data
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and item.get("@type") == "Product":
                    return item
    return None


def ld_to_product_record(
    ld: dict[str, Any],
    page_url: str,
    category_label: str,
    html: str,
) -> dict[str, Any]:
    name = ld.get("name") or ""
    slug = (ld.get("sku") or ld.get("mpn") or "") or (slug_from_product_url(page_url) or "")
    desc = ld.get("description") or ""
    image = ld.get("image")
    if isinstance(image, list):
        image = image[0] if image else ""
    image_url = image if isinstance(image, str) else ""

    offers = ld.get("offers") or {}
    if isinstance(offers, list) and offers:
        offers = offers[0]
    price_str = offers.get("price") if isinstance(offers, dict) else None
    try:
        offer_price = float(price_str) if price_str is not None else 0.0
    except (TypeError, ValueError):
        offer_price = 0.0

    specs: dict[str, str] = {}
    for p in ld.get("additionalProperty") or []:
        if not isinstance(p, dict):
            continue
        k = p.get("name")
        v = p.get("value")
        if isinstance(k, str) and v is not None:
            specs[k] = str(v)

    brand_name = ""
    b = ld.get("brand")
    if isinstance(b, dict):
        brand_name = str(b.get("name") or "")

    rating = 0.0
    nr = 0
    ar = ld.get("aggregateRating")
    if isinstance(ar, dict):
        try:
            rating = float(ar.get("ratingValue") or 0)
        except (TypeError, ValueError):
            rating = 0.0
        try:
            nr = int(ar.get("reviewCount") or 0)
        except (TypeError, ValueError):
            nr = 0

    amounts = parse_vnd_amounts(html)
    selling = offer_price
    if selling <= 0 and amounts:
        selling = float(min(amounts))

    higher = [a for a in amounts if a > selling] if selling > 0 else []
    list_price = float(max(higher)) if higher else None
    discount_pct: float | None = None
    if list_price is not None and selling > 0:
        discount_pct = round((list_price - selling) / list_price * 100, 2)

    # Khớp API (product.validation): price = giá niêm yết; salePrice < price khi KM.
    if list_price is not None and selling > 0 and list_price > selling:
        db_price = list_price
        db_sale = selling
    else:
        db_price = selling
        db_sale = None

    record: dict[str, Any] = {
        "name": name,
        "slug": slug,
        "description": desc,
        "price": db_price,
        "salePrice": db_sale,
        "originalPrice": list_price,
        "discountPercent": discount_pct,
        "discount": discount_pct,
        "imageUrl": image_url,
        "images": [image_url] if image_url else [],
        "category": category_label,
        "brandName": brand_name,
        "brandSlug": re.sub(r"[^a-z0-9]+", "-", brand_name.lower()).strip("-") if brand_name else "",
        "specs": specs,
        "rating": rating,
        "numReviews": nr,
        "stock": 10,
        "sourceUrl": page_url,
    }
    return record


@dataclass
class CrawlState:
    seen_slugs: set[str] = field(default_factory=set)
    products: list[dict[str, Any]] = field(default_factory=list)


def scroll_collect_html(page: Any, url: str, max_scrolls: int = 3) -> str:
    page.goto(url, wait_until="domcontentloaded", timeout=60_000)
    try:
        page.wait_for_load_state("networkidle", timeout=15_000)
    except Exception:
        page.wait_for_timeout(1200)
    html = page.content()
    prev = ""
    for _ in range(max_scrolls):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(400)
        html = page.content()
        if html == prev:
            break
        prev = html
    return html


def discover_brands_for_category(
    category_key: str,
    fetch_listing_html: Callable[[str], str],
) -> list[str]:
    chosen: list[str] = []
    for slug in BRAND_SLUG_CANDIDATES:
        if len(chosen) >= 5:
            break
        url = brand_listing_url(category_key, slug)
        try:
            html = fetch_listing_html(url)
        except (HTTPError, URLError, TimeoutError, OSError, RuntimeError) as e:
            print(f"[warn] {url}: {e}", file=sys.stderr)
            continue
        if not html.strip():
            continue
        if len(extract_product_urls_from_html(html)) == 0:
            continue
        chosen.append(slug)
    return chosen


def crawl(
    products_per_combo: int,
    *,
    use_playwright: bool,
    delay_min: float,
    delay_max: float,
) -> tuple[list[dict[str, Any]], bool]:
    state = CrawlState()
    delay_after = make_delay(delay_min, delay_max)
    interrupted = False

    def fetch_after_delay(url: str) -> str:
        try:
            return fetch_html(url)
        finally:
            delay_after()

    def process_product_page(
        purl: str,
        category_label: str,
        brand_slug: str,
        ps: str,
    ) -> None:
        try:
            phtml = fetch_after_delay(purl)
        except (HTTPError, URLError, TimeoutError, OSError) as e:
            print(f"[warn] product {purl}: {e}", file=sys.stderr)
            return
        ld = parse_product_ld_json(phtml)
        if not ld:
            print(f"[warn] không có JSON-LD Product: {purl}", file=sys.stderr)
            return
        rec = ld_to_product_record(ld, purl, category_label, phtml)
        if not rec.get("slug"):
            rec["slug"] = ps
        if not rec.get("brandName"):
            rec["brandName"] = brand_slug.replace("-", " ").title()
            rec["brandSlug"] = brand_slug
        state.seen_slugs.add(rec["slug"])
        state.products.append(rec)

    try:
        if use_playwright:
            try:
                from playwright.sync_api import sync_playwright
            except ImportError:
                print(
                    "Cần: uv pip install playwright && python -m playwright install chromium",
                    file=sys.stderr,
                )
                raise
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(user_agent=UA, locale="vi-VN")
                page = context.new_page()

                def fetch_listing_pw(url: str) -> str:
                    try:
                        return scroll_collect_html(page, url, max_scrolls=3)
                    finally:
                        delay_after()

                for category_label, category_key in CATEGORIES:
                    brands = discover_brands_for_category(category_key, fetch_listing_pw)
                    if len(brands) < 5:
                        print(
                            f"[warn] {category_label}: chỉ tìm được {len(brands)} hãng có SP.",
                            file=sys.stderr,
                        )
                    for brand_slug in brands:
                        list_url = brand_listing_url(category_key, brand_slug)
                        try:
                            html = fetch_listing_pw(list_url)
                        except Exception as e:
                            print(f"[warn] listing {list_url}: {e}", file=sys.stderr)
                            continue
                        product_urls = extract_product_urls_from_html(html)
                        if category_key == "tablet":
                            product_urls = prioritize_tablet_product_urls(product_urls)
                        taken = 0
                        for purl in product_urls:
                            if taken >= products_per_combo:
                                break
                            ps = slug_from_product_url(purl)
                            if not ps or ps in state.seen_slugs:
                                continue
                            process_product_page(purl, category_label, brand_slug, ps)
                            taken += 1
                browser.close()
        else:
            for category_label, category_key in CATEGORIES:
                brands = discover_brands_for_category(category_key, fetch_after_delay)
                if len(brands) < 5:
                    print(
                        f"[warn] {category_label}: chỉ tìm được {len(brands)} hãng có SP.",
                        file=sys.stderr,
                    )
                for brand_slug in brands:
                    list_url = brand_listing_url(category_key, brand_slug)
                    try:
                        html = fetch_after_delay(list_url)
                    except (HTTPError, URLError, TimeoutError, OSError) as e:
                        print(f"[warn] listing {list_url}: {e}", file=sys.stderr)
                        continue
                    product_urls = extract_product_urls_from_html(html)
                    if category_key == "tablet":
                        product_urls = prioritize_tablet_product_urls(product_urls)
                    taken = 0
                    for purl in product_urls:
                        if taken >= products_per_combo:
                            break
                        ps = slug_from_product_url(purl)
                        if not ps or ps in state.seen_slugs:
                            continue
                        process_product_page(purl, category_label, brand_slug, ps)
                        taken += 1
    except KeyboardInterrupt:
        interrupted = True
        print("\nĐã dừng (Ctrl+C) — ghi phần đã crawl.", file=sys.stderr)

    return state.products, interrupted


def main() -> None:
    ap = argparse.ArgumentParser(description="Crawl cellphones.com.vn → products.json")
    ap.add_argument(
        "-o",
        "--output",
        default="products.json",
        help="Đường dẫn file JSON đầu ra (mặc định: products.json)",
    )
    ap.add_argument(
        "-n",
        "--products-per-combo",
        type=int,
        default=DEFAULT_PRODUCTS_PER_COMBO,
        metavar="N",
        help="Số SP mỗi (danh mục, hãng). Mặc định 5 → 125 SP tổng (5×5×5).",
    )
    ap.add_argument(
        "--playwright",
        action="store_true",
        help="Dùng Chromium cho trang listing (chậm). Mặc định chỉ HTTP — đủ JSON-LD.",
    )
    ap.add_argument(
        "--delay-min",
        type=float,
        default=1.0,
        metavar="SEC",
        help="Delay tối thiểu giữa các request (mặc định 1)",
    )
    ap.add_argument(
        "--delay-max",
        type=float,
        default=2.0,
        metavar="SEC",
        help="Delay tối đa giữa các request (mặc định 2)",
    )
    args = ap.parse_args()
    if args.delay_min > args.delay_max:
        ap.error("--delay-min không được lớn hơn --delay-max")
    products, interrupted = crawl(
        args.products_per_combo,
        use_playwright=args.playwright,
        delay_min=args.delay_min,
        delay_max=args.delay_max,
    )
    payload = {
        "meta": {
            "source": "https://cellphones.com.vn",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "productsPerCombo": args.products_per_combo,
            "transport": "playwright" if args.playwright else "http",
            "delaySeconds": [args.delay_min, args.delay_max],
            "interrupted": interrupted,
            "categories": [c[0] for c in CATEGORIES],
            "totalProducts": len(products),
            "note": (
                "API create product: price = giá niêm yết; salePrice < price khi KM (product.validation). "
                "Brand: brandName/brandSlug. Ảnh: images[] / imageUrl → ProductImage."
            ),
        },
        "products": products,
    }
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Đã ghi {len(products)} sản phẩm → {args.output}")


if __name__ == "__main__":
    main()
