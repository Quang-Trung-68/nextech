import { useQuery } from '@tanstack/react-query';
import {
  newsListQueryOptions,
  newsDetailQueryOptions,
  newsCategoriesQueryOptions,
  relatedPostsQueryOptions,
  adminNewsListQueryOptions,
  adminNewsDetailQueryOptions,
} from '../api';

export function useNewsList(params) {
  return useQuery(newsListQueryOptions(params));
}

export function useNewsDetail(slug) {
  return useQuery(newsDetailQueryOptions(slug));
}

export function useNewsCategories() {
  return useQuery(newsCategoriesQueryOptions());
}

export function useRelatedPosts(slug) {
  return useQuery(relatedPostsQueryOptions(slug));
}

export function useAdminNewsList(params) {
  return useQuery(adminNewsListQueryOptions(params));
}

export function useAdminNewsDetail(id) {
  return useQuery(adminNewsDetailQueryOptions(id));
}
