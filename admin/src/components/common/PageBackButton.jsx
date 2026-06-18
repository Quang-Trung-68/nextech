import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PageBackButton = ({ className = '' }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={`flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] ${className}`}
      aria-label="Quay lại"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Trở lại</span>
    </button>
  );
};

export default PageBackButton;
