'use client';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  size?: 'default' | 'large';
}

export default function SearchBar({ placeholder = 'Search counties by name or state...', size = 'default' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/directory?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full" role="search" aria-label="Search counties">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${size === 'large' ? 'h-5 w-5' : 'h-4 w-4'}`} aria-hidden="true" />
      <label htmlFor="county-search" className="sr-only">Search counties by name or state</label>
      <input
        id="county-search"
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${size === 'large' ? 'py-3.5 pl-11 pr-4 text-base' : 'py-2 pl-9 pr-3 text-sm'}`}
      />
    </form>
  );
}
