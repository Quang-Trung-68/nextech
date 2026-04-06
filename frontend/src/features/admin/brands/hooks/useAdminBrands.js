import { useQuery } from '@tanstack/react-query';
import { adminBrandsQueryOptions } from '../brandAdmin.queries';

export function useAdminBrands() {
  return useQuery(adminBrandsQueryOptions());
}
