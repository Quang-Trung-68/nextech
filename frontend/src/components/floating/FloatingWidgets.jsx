// src/components/floating/FloatingWidgets.jsx
import { useLocation } from 'react-router-dom';
import ScrollToTopButton from './ScrollToTopButton';
import SupportWidget from './SupportWidget';

export default function FloatingWidgets() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <ScrollToTopButton />
      <SupportWidget />
    </>
  );
}
