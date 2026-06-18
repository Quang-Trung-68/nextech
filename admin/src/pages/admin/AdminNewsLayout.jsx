import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { adminPaths, isNewsSection, isNewsCategoriesSection } from "@/configs/adminPaths";

/**
 * Tab con: Bài viết | Danh mục — bọc các route /news/*
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
          to={adminPaths.news}
          className={cn(
            tabBase,
            "flex min-w-0 items-center justify-center text-center",
            isNewsSection(pathname) ? tabActive : tabInactive,
          )}
        >
          Bài viết
        </Link>
        <Link
          to={adminPaths.newsCategories}
          className={cn(
            tabBase,
            "flex min-w-0 items-center justify-center text-center",
            isNewsCategoriesSection(pathname) ? tabActive : tabInactive,
          )}
        >
          Danh mục tin
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
