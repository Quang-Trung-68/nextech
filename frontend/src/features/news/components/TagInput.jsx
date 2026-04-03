import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

function normalizeTagName(name) {
  return String(name || '').trim().toLowerCase();
}

const MAX_CHIPS = 10;
const MAX_LABEL = 20;

/**
 * @typedef {{ selectedIds: number[], newNames: string[] }} TagSelection
 * @param {{
 *   value: TagSelection
 *   onChange: (v: TagSelection) => void
 *   allTags: { id: number; name: string; slug?: string }[]
 *   placeholder?: string
 *   disabled?: boolean
 * }} props
 */
export function TagInput({ value, onChange, allTags = [], placeholder = 'Thêm tag…', disabled }) {
  const { selectedIds = [], newNames = [] } = value || {};
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const totalCount = selectedIds.length + newNames.length;
  const atCap = totalCount >= MAX_CHIPS;

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const existingById = useMemo(() => {
    const m = new Map();
    allTags.forEach((t) => m.set(t.id, t));
    return m;
  }, [allTags]);

  const filteredTags = useMemo(() => {
    const q = normalizeTagName(inputValue);
    if (!q) return [];
    return allTags.filter((t) => {
      if (selectedIdSet.has(t.id)) return false;
      return t.name.toLowerCase().includes(q);
    });
  }, [allTags, inputValue, selectedIdSet]);

  const exactExistingMatch = useMemo(() => {
    const q = normalizeTagName(inputValue);
    if (!q) return null;
    return allTags.find((t) => normalizeTagName(t.name) === q) ?? null;
  }, [allTags, inputValue]);

  const canCreateNew =
    !exactExistingMatch &&
    normalizeTagName(inputValue).length >= 1 &&
    !newNames.some((n) => normalizeTagName(n) === normalizeTagName(inputValue));

  const dropdownItems = useMemo(() => {
    const items = [];
    filteredTags.slice(0, 8).forEach((t) => {
      items.push({ type: 'existing', tag: t });
    });
    if (canCreateNew) {
      items.push({ type: 'create', label: inputValue.trim() });
    }
    return items;
  }, [filteredTags, canCreateNew, inputValue]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!containerRef.current?.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const commitSelection = useCallback(
    (next) => {
      onChange(next);
      setInputValue('');
      setIsOpen(false);
    },
    [onChange]
  );

  const addExistingId = useCallback(
    (id) => {
      if (atCap || selectedIdSet.has(id)) return;
      commitSelection({ selectedIds: [...selectedIds, id], newNames });
    },
    [atCap, selectedIdSet, selectedIds, newNames, commitSelection]
  );

  const addNewName = useCallback(
    (raw) => {
      const name = normalizeTagName(raw);
      if (!name || atCap) return;
      if (newNames.some((n) => normalizeTagName(n) === name)) return;
      const existing = allTags.find((t) => normalizeTagName(t.name) === name);
      if (existing) {
        addExistingId(existing.id);
        return;
      }
      commitSelection({ selectedIds, newNames: [...newNames, name] });
    },
    [atCap, newNames, allTags, selectedIds, commitSelection, addExistingId]
  );

  const removeExisting = (id) => {
    onChange({ selectedIds: selectedIds.filter((x) => x !== id), newNames });
  };

  const removeNew = (name) => {
    onChange({ selectedIds, newNames: newNames.filter((n) => n !== name) });
  };

  const processToken = useCallback(
    (token) => {
      const t = token.trim();
      if (!t || atCap) return;
      const norm = normalizeTagName(t);
      const existing = allTags.find((x) => normalizeTagName(x.name) === norm);
      if (existing) {
        if (!selectedIdSet.has(existing.id) && selectedIds.length + newNames.length < MAX_CHIPS) {
          onChange({
            selectedIds: [...selectedIds, existing.id],
            newNames,
          });
        }
        return;
      }
      if (newNames.some((n) => normalizeTagName(n) === norm)) return;
      if (selectedIds.length + newNames.length >= MAX_CHIPS) return;
      onChange({ selectedIds, newNames: [...newNames, norm] });
    },
    [allTags, atCap, selectedIdSet, selectedIds, newNames, onChange]
  );

  const onPaste = (e) => {
    const text = e.clipboardData?.getData('text');
    if (!text || !text.includes(',')) return;
    e.preventDefault();
    text.split(',').forEach(processToken);
    setInputValue('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Backspace' && !inputValue && (selectedIds.length > 0 || newNames.length > 0)) {
      e.preventDefault();
      if (newNames.length > 0) {
        removeNew(newNames[newNames.length - 1]);
      } else {
        removeExisting(selectedIds[selectedIds.length - 1]);
      }
      return;
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIndex((i) => {
        const max = Math.max(0, dropdownItems.length - 1);
        return Math.min(i + 1, max);
      });
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isOpen || dropdownItems.length === 0) {
        if (exactExistingMatch) addExistingId(exactExistingMatch.id);
        else if (canCreateNew) addNewName(inputValue);
        return;
      }
      const item = dropdownItems[highlightIndex];
      if (!item) return;
      if (item.type === 'existing') addExistingId(item.tag.id);
      else addNewName(item.label);
    }
  };

  const truncate = (s) => (s.length > MAX_LABEL ? `${s.slice(0, MAX_LABEL)}…` : s);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={cn(
          'flex flex-wrap gap-1.5 min-h-10 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm',
          'ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'opacity-50 pointer-events-none'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedIds.map((id) => {
          const tag = existingById.get(id);
          const label = tag?.name ?? `#${id}`;
          return (
            <span
              key={`id-${id}`}
              title={label}
              className="inline-flex items-center gap-1 max-w-[140px] rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              <span className="truncate">{truncate(label)}</span>
              <button
                type="button"
                className="shrink-0 rounded hover:bg-secondary-foreground/20 p-0.5"
                onClick={(ev) => {
                  ev.stopPropagation();
                  removeExisting(id);
                }}
                aria-label={`Xóa ${label}`}
              >
                ✕
              </button>
            </span>
          );
        })}
        {newNames.map((n) => (
          <span
            key={`new-${n}`}
            title={n}
            className="inline-flex items-center gap-1 max-w-[140px] rounded-md border border-dashed border-muted-foreground px-2 py-0.5 text-xs text-muted-foreground"
          >
            <span className="text-[10px]">+</span>
            <span className="truncate">{truncate(n)}</span>
            <button
              type="button"
              className="shrink-0 rounded hover:bg-muted p-0.5"
              onClick={(ev) => {
                ev.stopPropagation();
                removeNew(n);
              }}
              aria-label={`Xóa ${n}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground py-0.5"
          placeholder={atCap ? '' : placeholder}
          value={inputValue}
          disabled={disabled || atCap}
          onChange={(e) => {
            setInputValue(e.target.value);
            setHighlightIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
        />
      </div>

      {atCap && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Tối đa {MAX_CHIPS} tags.</p>
      )}

      {isOpen && !atCap && dropdownItems.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg"
          role="listbox"
        >
          {dropdownItems.map((item, idx) => (
            <li key={item.type === 'existing' ? `e-${item.tag.id}` : `c-${item.label}`}>
              <button
                type="button"
                role="option"
                aria-selected={idx === highlightIndex}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                  idx === highlightIndex && 'bg-accent'
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (item.type === 'existing') addExistingId(item.tag.id);
                  else addNewName(item.label);
                }}
              >
                {item.type === 'existing' ? (
                  item.tag.name
                ) : (
                  <>
                    + Tạo tag mới: &quot;{item.label.trim()}&quot;
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
