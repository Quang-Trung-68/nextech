import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { useNavigate } from 'react-router-dom';
import { getRecentSearches, saveRecentSearch, removeRecentSearch } from '@/utils/recentSearches';
import { Search, X, Clock, Loader2 } from 'lucide-react';

const QUICK_LINKS = ["iPhone 15 Pro Max", "MacBook Air M2", "iPad Pro", "AirPods Pro 2"];

const SearchDialog = ({ isOpen, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = setTimeout(() => {
      setRecentSearches(getRecentSearches());
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data: products = [], isFetching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () =>
      axiosInstance
        .get(`/products?search=${debouncedQuery}&limit=5`)
        .then((res) => {
          // Backend trả về res.data.products theo utils apiFeatures response format
          return res.data.products || res.data.data?.products || [];
        }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 30,
  });

  const handleSelectProduct = (productId) => {
    saveRecentSearch(inputValue.trim());
    onClose();
    navigate(`/products/all/${productId}`);
  };

  const handleQuickLink = (term) => {
    setInputValue(term);
  };

  const handleRemoveRecent = (e, term) => {
    e.stopPropagation(); // Ngừng lan truyền sự kiện click cho pill
    removeRecentSearch(term);
    setRecentSearches(getRecentSearches());
  };

  const renderContent = () => {
    if (inputValue !== '') {
      // Search Results
      if (debouncedQuery.length >= 2) {
        if (!isFetching && products.length === 0) {
          return (
            <div className="py-10 text-center text-gray-500">
              Không tìm thấy sản phẩm phù hợp
            </div>
          );
        }

        return (
          <div className="flex flex-col mt-4 divide-y divide-gray-100">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleSelectProduct(product.id)}
                className="flex flex-row items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 rounded-xl px-2 transition-colors"
              >
                <img
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/48'}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="font-medium truncate line-clamp-1">{product.name}</span>
                  <span className="text-xs text-gray-400 truncate">{product.category}</span>
                </div>
                <div className="font-semibold text-blue-600 flex-shrink-0 whitespace-nowrap">
                  {product.finalPrice ? product.finalPrice.toLocaleString('vi-VN') : product.price.toLocaleString('vi-VN')}₫
                </div>
              </div>
            ))}
          </div>
        );
      }
      return null;
    }

    // Default View: Recent Searches & Quick Links
    return (
      <div className="mt-8 flex flex-col gap-8">
        {recentSearches.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Tìm kiếm gần đây</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickLink(term)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2 text-sm"
                >
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{term}</span>
                  <div
                    onClick={(e) => handleRemoveRecent(e, term)}
                    className="p-0.5 ml-1 rounded-full hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
           <h3 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Liên kết nhanh</h3>
           <div className="flex flex-wrap gap-2">
             {QUICK_LINKS.map((link, idx) => (
               <button
                 key={idx}
                 onClick={() => handleQuickLink(link)}
                 className="border rounded-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
               >
                 {link}
               </button>
             ))}
           </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] backdrop-blur-sm bg-white/95 transition-opacity duration-200 flex flex-col">
      <div className="flex justify-end p-6">
        <button
          onClick={onClose}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="w-full max-w-3xl mx-auto px-6 mt-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 border-b pb-4">
          <Search className="w-7 h-7 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tìm kiếm sản phẩm, thương hiệu..."
            className="w-full bg-transparent text-2xl md:text-3xl font-medium outline-none placeholder:text-gray-300"
          />
          {isFetching && (
             <Loader2 className="w-6 h-6 text-blue-500 animate-spin flex-shrink-0" />
          )}
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default SearchDialog;
