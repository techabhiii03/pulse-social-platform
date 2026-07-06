import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);
    try {
      const { data } = await api.get('/posts/feed');
      setPosts(data.posts);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('text', text);
      if (file) formData.append('media', file);
      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPosts((prev) => [data.post, ...prev]);
      setText('');
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      <form onSubmit={handlePost} className="bg-panel border border-line rounded-2xl p-4">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-panel2 border border-line flex items-center justify-center text-xs font-semibold shrink-0">
            {user.username[0]?.toUpperCase()}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's happening?"
            rows={2}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted resize-none"
          />
        </div>

        {preview && (
          <div className="relative mt-2 ml-12">
            {file.type.startsWith('video') ? (
              <video src={preview} className="rounded-xl max-h-64 border border-line" controls />
            ) : (
              <img src={preview} alt="preview" className="rounded-xl max-h-64 border border-line" />
            )}
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="absolute top-2 right-2 bg-ink/70 rounded-full p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 ml-12">
          <label className="cursor-pointer text-muted hover:text-accent transition">
            <ImageIcon size={18} />
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
          </label>
          <button
            disabled={posting || (!text.trim() && !file)}
            className="bg-accent text-ink text-sm font-semibold rounded-full px-4 py-1.5 hover:opacity-90 transition disabled:opacity-40"
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>

      {loading && <p className="text-center text-muted text-sm py-8">Loading feed…</p>}

      {!loading && posts.length === 0 && (
        <div className="text-center text-muted text-sm py-12 border border-dashed border-line rounded-2xl">
          Your feed is quiet. Follow people or share your first post.
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
