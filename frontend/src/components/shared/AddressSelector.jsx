import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import provinceData from '@/resources/addresses/province.json';
import wardData from '@/resources/addresses/ward.json';

const provinces = Object.values(provinceData).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
const wards = Object.values(wardData).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str.toLowerCase();
}

function Combobox({ value, options, onChange, placeholder, disabled, error }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const s = removeVietnameseTones(search);
    return options.filter(opt => removeVietnameseTones(opt.name_with_type).includes(s));
  }, [options, search]);

  const selectedOption = options.find(opt => opt.name === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background md:text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? 'border-destructive' : 'border-input'
        }`}
      >
        <span className={`truncate ${!selectedOption ? 'text-muted-foreground' : 'text-foreground'}`}>
          {selectedOption ? selectedOption.name_with_type : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-[100] top-0 left-0 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 origin-top">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              autoFocus
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
              }}
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto overflow-x-hidden p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm">Không tìm thấy.</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.code}
                  className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                    value === opt.name ? 'bg-accent text-accent-foreground' : ''
                  }`}
                  onClick={() => {
                    onChange(opt.name);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {value === opt.name && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  {opt.name_with_type}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AddressSelector({
  cityValue,
  wardValue,
  onCityChange,
  onWardChange,
  cityError,
  wardError,
  disabled
}) {
  const selectedProvince = provinces.find(p => p.name === cityValue);
  
  const availableWards = useMemo(() => {
    if (!selectedProvince) return [];
    return wards.filter(w => w.parent_code === selectedProvince.code);
  }, [selectedProvince]);

  const handleCityChange = (cityName) => {
    onCityChange(cityName);
    onWardChange(''); // reset ward when city changes
  };

  return (
    <>
      <div className="space-y-1 w-full flex flex-col justify-end">
        <label className="text-sm font-medium text-muted-foreground">Tỉnh/Thành phố <span className="text-destructive">*</span></label>
        <Combobox
          value={cityValue}
          options={provinces}
          onChange={handleCityChange}
          placeholder="Chọn Tỉnh/Thành phố..."
          disabled={disabled}
          error={cityError}
        />
        {cityError && <p className="text-xs text-destructive mt-1">{cityError}</p>}
      </div>

      <div className="space-y-1 w-full flex flex-col justify-end">
        <label className="text-sm font-medium text-muted-foreground">Xã/Phường <span className="text-destructive">*</span></label>
        <Combobox
          value={wardValue}
          options={availableWards}
          onChange={onWardChange}
          placeholder="Chọn Xã/Phường..."
          disabled={disabled || !selectedProvince}
          error={wardError}
        />
        {wardError && <p className="text-xs text-destructive mt-1">{wardError}</p>}
      </div>
    </>
  );
}
