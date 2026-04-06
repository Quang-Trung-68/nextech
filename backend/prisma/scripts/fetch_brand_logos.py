#!/usr/bin/env python3
"""
Gán trường "logo" trong brands.json.

Ưu tiên: SVG thương hiệu qua gói **simple-icons** (jsDelivr) — ổn định hơn Clearbit (đã ngừng).
Dự phòng: favicon Google (gstatic faviconV2) theo websiteUrl hoặc domain.

Mỗi phần tử nên có "slug" (khớp Simple Icons: apple, samsung, xiaomi, ...).
Nếu slug Simple Icons khác slug DB, đặt "simpleIconSlug" (vd: một số thương hiệu đặc biệt).

Trường "domain" / "simpleIconSlug" không ghi vào DB (seed_brands.js bỏ qua).

Chạy từ thư mục backend:
  python3 prisma/scripts/fetch_brand_logos.py
  python3 prisma/scripts/fetch_brand_logos.py --verify
  python3 prisma/scripts/fetch_brand_logos.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Ghim phiên bản để URL không đổi bất ngờ (cập nhật khi cần icon mới).
SIMPLE_ICONS_VERSION = "13.16.0"


def _request(url: str, method: str = "HEAD") -> tuple[int, str]:
    ctx = ssl.create_default_context()
    req = urllib.request.Request(
        url,
        method=method,
        headers={"User-Agent": "Mozilla/5.0 (compatible; NexTech-brand-logo-fetch/2.0)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            return r.getcode(), r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, url
    except Exception:
        return 0, url


def logo_simple_icons(icon_slug: str) -> str:
    """SVG từ simple-icons (danh sách slug: https://simpleicons.org/)."""
    icon = icon_slug.strip().lower().replace(" ", "")
    if not icon:
        return ""
    return (
        f"https://cdn.jsdelivr.net/npm/simple-icons@{SIMPLE_ICONS_VERSION}/icons/{icon}.svg"
    )


def logo_google_favicon(site_url: str, size: int = 128) -> str:
    """PNG favicon qua Google CDN (thường ổn định với domain chính thức)."""
    u = site_url.strip()
    if not u.startswith("http"):
        u = "https://" + u
    q = urllib.parse.quote(u, safe="")
    return (
        f"https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON"
        f"&fallback_opts=TYPE,SIZE,URL&url={q}&size={size}"
    )


def pick_logo(row: dict, verify: bool) -> tuple[str, str]:
    """
    Trả (url, nguồn mô tả).
    """
    icon_slug = row.get("simpleIconSlug") or row.get("slug")
    if not icon_slug:
        return "", "empty"

    primary = logo_simple_icons(str(icon_slug))
    if not verify:
        return primary, "simple-icons"

    code, _ = _request(primary, "HEAD")
    if 200 <= code < 400:
        return primary, "simple-icons"
    code2, _ = _request(primary, "GET")
    if 200 <= code2 < 400:
        return primary, "simple-icons"

    wu = row.get("websiteUrl")
    if wu and str(wu).strip():
        return logo_google_favicon(str(wu)), "google-favicon (fallback)"
    dom = row.get("domain")
    if dom and str(dom).strip():
        return logo_google_favicon(f"https://{str(dom).strip()}"), "google-favicon (fallback)"

    return primary, "simple-icons (unverified)"


def main() -> int:
    backend_root = Path(__file__).resolve().parents[2]
    default_json = backend_root / "prisma" / "seeds" / "data" / "brands.json"

    ap = argparse.ArgumentParser(
        description="Cập nhật logo (Simple Icons SVG + fallback favicon) trong brands.json"
    )
    ap.add_argument("--input", type=Path, default=default_json)
    ap.add_argument("--output", type=Path, default=None, help="Mặc định: ghi đè --input")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--verify",
        action="store_true",
        help="HEAD/GET kiểm tra SVG; nếu fail thì dùng favicon Google theo websiteUrl/domain.",
    )
    args = ap.parse_args()

    inp = args.input
    if not inp.is_file():
        print(f"Không tìm thấy file: {inp}", file=sys.stderr)
        return 1

    raw = json.loads(inp.read_text(encoding="utf-8"))
    rows = raw["brands"] if isinstance(raw, dict) and "brands" in raw else raw
    if not isinstance(rows, list):
        print('JSON phải là mảng hoặc { "brands": [...] }', file=sys.stderr)
        return 1

    out_rows = []
    for item in rows:
        if not isinstance(item, dict):
            continue
        row = dict(item)
        slug = row.get("slug", "?")
        old = row.get("logo")
        new_logo, src = pick_logo(row, verify=args.verify)
        if new_logo:
            row["logo"] = new_logo
            print(f"{slug}: {old!r} -> {new_logo!r}  [{src}]")
        else:
            print(f"{slug}: bỏ qua (thiếu slug/simpleIconSlug)", file=sys.stderr)
        out_rows.append(row)

    if isinstance(raw, dict) and "brands" in raw:
        out_doc = {**raw, "brands": out_rows}
    else:
        out_doc = out_rows

    out_path = args.output or inp
    if args.dry_run:
        print("\n(dry-run, không ghi file)")
        return 0

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out_doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nĐã ghi: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
