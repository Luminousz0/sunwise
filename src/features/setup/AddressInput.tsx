import { useState, useRef, useEffect, useCallback } from 'react';
import { suggestAddresses, lookupAddress } from '@/lib/pdok';
import type { Address } from '@/types/household';

interface Props {
  value: Address | null;
  onChange: (address: Address) => void;
}

interface Suggestion {
  id: string;
  label: string;
}

export function AddressInput({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const docs = await suggestAddresses(q);
      setSuggestions(docs.map((d) => ({ id: d.id, label: d.weergavenaam })));
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 300);
  }

  async function handleSelect(suggestion: Suggestion) {
    setQuery(suggestion.label);
    setOpen(false);
    setSuggestions([]);
    try {
      const address = await lookupAddress(suggestion.id);
      onChange(address);
    } catch {
      // lookup failed — keep partial query visible
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Typ je adres..."
        className="w-full rounded-xl border border-line-2 bg-surface-2 px-4 py-3 text-sm text-ink-1 outline-none transition-colors focus:border-sun focus:ring-2 focus:ring-sun/20 placeholder:text-ink-3"
        autoComplete="off"
        aria-label="Adres"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {loading && (
        <div className="absolute right-3 top-3.5">
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-sun/50 border-t-transparent" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-xl border border-line bg-surface py-1 shadow-card"
        >
          {suggestions.map((s) => (
            <li
              key={s.id}
              role="option"
              aria-selected={false}
              onMouseDown={() => handleSelect(s)}
              className="cursor-pointer px-4 py-2.5 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink-1 active:bg-line"
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
