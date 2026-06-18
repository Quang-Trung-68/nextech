import { useQuery } from '@tanstack/react-query';
import { adminBannersQueryOptions } from '../bannerAdmin.queries';

export function useBanners() {
  return useQuery(adminBannersQueryOptions());
}
