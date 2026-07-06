import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import api from '../api/axios.js';

export default function Discover() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(runSearch, 350); // debounce so we don't hit the API on every keystroke
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function runSearch() {
    setLoading(true);
    try {
      const { data } = await api.get('/users/search/query', { params: { q: query.trim() } });
      setResults(data.users);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollow(target) {
    setResults((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, isFollowing: !u.isFollowing } : u))
    );
    try {
      if (target.isFollowing) {
        await api.delete(`/users/${target.id}/follow`);
      } else {
        await api.post(`/users/${target.id}/follow`);
      }
    } catch {
      // revert on failure
      setResults((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, isFollowing: target.isFollowing } : u))
      );
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="font-display text-xl font-semibold mb-4">Discover people</h1>

      <div className="relative mb-5">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or name…"
          className="w-full bg-panel border border-line rounded-full pl-9 pr-4 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      {loading && <p className="text-center text-muted text-sm py-6">Searching…</p>}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-muted text-sm py-6">No users found matching "{query}".</p>
      )}

      {!loading && !searched && (
        <p className="text-center text-muted text-sm py-6">Start typing to find people to follow.</p>
      )}

      <div className="space-y-2">
        {results.map((u) => (
          <div key={u.id} className="bg-panel border border-line rounded-2xl p-3 flex items-center gap-3">
            <Link to={`/profile/${u.username}`} className="w-10 h-10 rounded-full bg-panel2 border border-line flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0">
              {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" alt={u.username} /> : u.username[0]?.toUpperCase()}
            </Link>
            <Link to={`/profile/${u.username}`} className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate hover:text-accent transition">{u.displayName}</p>
              <p className="text-xs text-muted truncate">@{u.username}</p>
            </Link>
            <button
              onClick={() => toggleFollow(u)}
              className={`text-xs font-semibold rounded-full px-3 py-1.5 shrink-0 transition ${
                u.isFollowing ? 'border border-line hover:bg-panel2' : 'bg-accent text-ink hover:opacity-90'
              }`}
            >
              {u.isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
