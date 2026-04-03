import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  newsDetailQueryOptions,
  relatedPostsQueryOptions,
  newsCategoriesQueryOptions,
} from "@/features/news/api";
import { ArticleCard } from "@/features/news/components/ArticleCard";
import { NewsCategorySidebar } from "@/features/news/components/NewsCategorySidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, BookOpen } from "lucide-react";
import usePageTitle from "@/hooks/usePageTitle";
import { estimateReadingMinutesFromHtml } from "@/features/news/utils/readingTime";

function formatNewsDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function NewsDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const {
    data: post,
    isLoading,
    isError,
    error,
  } = useQuery(newsDetailQueryOptions(slug));
  const { data: related = [] } = useQuery(relatedPostsQueryOptions(slug));
  const { data: categories = [], isLoading: catLoading } = useQuery(
    newsCategoriesQueryOptions(),
  );

  usePageTitle(post?.title ? `${post.title} | Tin tức` : "Tin tức | NexTech");

  const tags = post?.tags?.map((t) => t.tag).filter(Boolean) ?? [];

  const readMinutes = post?.content
    ? estimateReadingMinutesFromHtml(post.content)
    : 1;

  const setCategory = (catSlug) => {
    if (catSlug) {
      navigate(`/news?category=${encodeURIComponent(catSlug)}`);
    } else {
      navigate("/news");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center pt-8">
        <Loader2 className="animate-spin text-apple-blue" size={36} />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 text-center">
        <p className="text-destructive mb-4">
          {error?.response?.status === 404
            ? "Không tìm thấy bài viết."
            : "Lỗi tải bài viết."}
        </p>
        <Button asChild variant="outline">
          <Link to="/news">Về trang Tin tức</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pb-16 pt-4 sm:pt-10">
      <div className="flex flex-col lg:flex-row gap-8">
        <NewsCategorySidebar
          categories={categories}
          categorySlug={post.category?.slug ?? ""}
          onSelectCategory={setCategory}
          isLoading={catLoading}
        />

        <article className="flex-1 min-w-0 lg:w-[75%]">
          <div
            className={
              post.coverImage
                ? "flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start mb-8"
                : "mb-8"
            }
          >
            <header className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 gap-y-2 mb-4">
                {post.category && (
                  <Badge variant="secondary">{post.category.name}</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {formatNewsDate(post.publishedAt)}
                </span>
                <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                  <Eye size={14} />
                  {post.viewCount ?? 0} lượt xem
                </span>
                <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                  <BookOpen size={14} />
                  {readMinutes} phút đọc
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {post.title}
              </h1>
              {post.author?.name && (
                <p className="mt-4 text-muted-foreground">
                  <span className="text-sm">Tác giả: </span>
                  <span className="font-medium text-foreground">
                    {post.author.name}
                  </span>
                </p>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/news?tag=${encodeURIComponent(tag.slug)}`}
                      className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-foreground"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </header>

            {post.coverImage && (
              <div className="shrink-0 w-full lg:w-[min(42%,340px)] lg:max-w-[340px]">
                <div className="rounded-lg overflow-hidden bg-muted border border-border shadow-sm aspect-[4/3] lg:aspect-[4/3]">
                  <img
                    src={post.coverImage}
                    alt=""
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            )}
          </div>

          <div
            className="news-rich-body prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-apple-blue prose-img:rounded-lg prose-img:border prose-img:border-border"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {related.length > 0 && (
            <section className="mt-16 pt-10 border-t border-border">
              <h2 className="text-xl font-bold mb-6">Bài viết liên quan</h2>
              <div className="flex flex-col gap-4">
                {related.map((p) => (
                  <ArticleCard key={p.id} post={p} className="w-full" />
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </div>
  );
}
