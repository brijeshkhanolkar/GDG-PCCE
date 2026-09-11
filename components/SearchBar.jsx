'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar({ caseIds = [] }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim().length > 0) {
      const filtered = caseIds
        .filter(id => id.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      // If the query exactly matches a case ID, navigate directly
      // Otherwise, try the first suggestion
      const target = caseIds.find(id => id.toLowerCase() === trimmed.toLowerCase())
        || (suggestions.length > 0 ? suggestions[0] : trimmed);
      router.push(`/case/${encodeURIComponent(target)}`);
    }
  };

  const handleSuggestionClick = (caseId) => {
    setQuery(caseId);
    setSuggestions([]);
    router.push(`/case/${encodeURIComponent(caseId)}`);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <span className="block text-steel-grey font-mono text-[10px] tracking-label uppercase mb-3">
        Enter Docket Reference
      </span>
      
      <form onSubmit={handleSubmit} className="flex items-stretch gap-0 relative">
        <div className="relative flex-grow">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="NYR-00001"
            className="w-full bg-[#0E0E10] text-off-white placeholder-steel-grey/50 px-5 py-3.5 outline-none border border-hairline-light focus:border-gold transition-colors duration-200 font-mono text-sm tracking-wide"
          />
          
          {/* Suggestions Dropdown */}
          {isFocused && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-[#0E0E10] border border-hairline-light border-t-0 z-50">
              {suggestions.map((id) => (
                <li 
                  key={id}
                  onClick={() => handleSuggestionClick(id)}
                  className="px-5 py-3 cursor-pointer hover:bg-surface-high text-off-white font-mono text-sm border-b border-hairline last:border-b-0 transition-colors duration-150 flex items-center gap-3"
                >
                  <span className="text-gold">{id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <button
          type="submit"
          className="bg-gold hover:bg-off-white text-charcoal font-mono text-xs tracking-label uppercase px-6 py-3.5 transition-colors duration-200 border border-gold hover:border-off-white flex items-center gap-2 whitespace-nowrap"
        >
          Track a Case
        </button>
      </form>

      {/* Ref indicator */}
      {query && (
        <span className="font-mono text-[10px] text-dim-grey mt-2 block">
          Ref: {query}
        </span>
      )}
    </div>
  );
}
