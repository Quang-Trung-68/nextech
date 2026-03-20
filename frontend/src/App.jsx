import { Suspense } from 'react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import routes from '@/configs/routes.config';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ScrollToTop from '@/components/common/ScrollToTop';

function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<LoadingSkeleton />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
