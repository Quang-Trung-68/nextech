import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { getSlugByCategory } from '@/constants/category';
import { Loader2 } from 'lucide-react';

/**
 * /products/:categorySlug/:id — id là CUID: redirect tới /{type}/{slug}
 */
export default function LegacyProductDetailRedirect() {
  const { id } = useParams();
  const [target, setTarget] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axiosInstance.get(`/products/${id}`);
        const p = data?.product;
        if (!p?.slug || !p?.category) {
          setError(true);
          return;
        }
        const type = getSlugByCategory(p.category);
        if (!cancelled) setTarget(`/${type}/${p.slug}`);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return <Navigate to="/" replace />;
  }
  if (!target) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-apple-blue" />
      </div>
    );
  }
  return <Navigate to={target} replace />;
}
