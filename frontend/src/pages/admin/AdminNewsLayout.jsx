import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

function isArticlesSection(pathname) {
  return (
    pathname === "/admin/news" ||
    pathname.startsWith("/admin/news/create") ||
    /^\/admin\/news\/\d+\/edit$/.test(pathname)
  );
}

function isCategoriesSection(pathname) {
  return pathname.startsWith("/admin/news/categories");
}

/**
 * Tab con: Bài viết | Danh mục — bọc các route /admin/news/*
 */
export default function AdminNewsLayout() {
  const { pathname } = useLocation();
  const tabBase = "px-3 py-1.5 rounded-md text-sm transition-colors";
  const tabActive = "bg-apple-blue text-white";
  const tabInactive = "bg-muted/60 hover:bg-muted text-foreground";

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex gap-2 border-b border-border pb-3">
        <Link
          to="/admin/news"
          className={cn(
            tabBase,
            "flex min-w-0 items-center justify-center text-center",
            isArticlesSection(pathname) ? tabActive : tabInactive,
          )}
        >
          Bài viết
        </Link>
        <Link
          to="/admin/news/categories"
          className={cn(
            tabBase,
            "flex min-w-0 items-center justify-center text-center",
            isCategoriesSection(pathname) ? tabActive : tabInactive,
          )}
        >
          Danh mục tin
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
