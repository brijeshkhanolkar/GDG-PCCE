'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar({ caseIds = [] }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const router = useRouter();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim().length > 0) {
      const filtered = caseIds
        .filter(id => id.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 6);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const navigateToCase = (caseId) => {
    setQuery(caseId);
    setSuggestions([]);
    setIsFocused(false);
    router.push(`/case/${encodeURIComponent(caseId)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // If a suggestion is highlighted, use that
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      navigateToCase(suggestions[selectedIndex]);
      return;
    }

    // Exact match or first suggestion or raw query
    const target = caseIds.find(id => id.toLowerCase() === trimmed.toLowerCase())
      || (suggestions.length > 0 ? suggestions[0] : trimmed);
    navigateToCase(target);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setTimeout(() => setSuggestions([]), 150);
    };
    if (isFocused) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isFocused]);

  return (
    <div className="relative w-full max-w-2xl">
      <span className="block text-steel-grey font-mono text-[10px] tracking-[0.14em] uppercase mb-3">
        Enter Docket Reference
      </span>
      
      <form onSubmit={handleSubmit} className="flex items-stretch gap-0 relative">
        <div className="relative flex-grow">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="NYR-00001"
            className="w-full bg-[#0E0E10] text-off-white placeholder-dim-grey px-5 py-3.5 outline-none border border-hairline-light focus:border-gold transition-colors duration-200 font-mono text-sm tracking-wide"
            autoComplete="off"
          />
          
          {/* Suggestions Dropdown */}
          {isFocused && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-[#0E0E10] border border-hairline-light border-t-0 z-50 max-h-64 overflow-y-auto">
              {suggestions.map((id, idx) => (
                <li 
                  key={id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateToCase(id);
                  }}
                  className={`px-5 py-3 cursor-pointer border-b border-hairline last:border-b-0 transition-colors duration-100 flex items-center justify-between ${
                    idx === selectedIndex
                      ? 'bg-surface-high text-gold'
                      : 'text-off-white hover:bg-surface-high hover:text-gold'
                  }`}
                >
                  <span className="font-mono text-sm">{id}</span>
                  <span className="font-mono text-[10px] text-dim-grey tracking-[0.14em] uppercase">
                    Track →
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <button
          type="submit"
          className="bg-gold hover:bg-off-white text-charcoal font-mono text-xs tracking-[0.14em] uppercase px-6 py-3.5 transition-colors duration-200 border border-gold hover:border-off-white flex items-center gap-2 whitespace-nowrap"
        >
          Track a Case
        </button>
      </form>

      {/* Reference line */}
      {query && (
        <span className="font-mono text-[10px] text-dim-grey mt-2 block tracking-wide">
          Ref: {query}
        </span>
      )}
    </div>
  );
}
