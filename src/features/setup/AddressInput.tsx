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

  // close dropdown on outside click
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
        className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 placeholder:text-stone-400"
        autoComplete="off"
        aria-label="Adres"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {loading && (
        <div className="absolute right-3 top-3.5">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-transparent block" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-xl border border-amber-100 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s) => (
            <li
              key={s.id}
              role="option"
              aria-selected={false}
              onMouseDown={() => handleSelect(s)}
              className="cursor-pointer px-4 py-2.5 text-sm text-stone-700 hover:bg-amber-50 active:bg-amber-100"
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
