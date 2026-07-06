import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PostCard({ post }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likes?.some((id) => id === user.id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);

  async function toggleLike() {
    setLiked((l) => !l);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked((l) => !l);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
    }
  }

  async function loadComments() {
    setShowComments((s) => !s);
    if (!comments) {
      const { data } = await api.get(`/posts/${post._id}/comments`);
      setComments(data.comments);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const { data } = await api.post(`/posts/${post._id}/comments`, { text: commentText });
    setComments((prev) => [...(prev || []), data.comment]);
    setCommentCount((c) => c + 1);
    setCommentText('');
  }

  return (
    <article className="bg-panel border border-line rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${post.author.username}`} className="w-9 h-9 rounded-full bg-panel2 border border-line flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt={post.author.username} className="w-full h-full object-cover" />
          ) : (
            post.author.username[0]?.toUpperCase()
          )}
        </Link>
        <div>
          <Link to={`/profile/${post.author.username}`} className="text-sm font-medium hover:text-accent transition">
            {post.author.displayName || post.author.username}
          </Link>
          <p className="text-xs text-muted">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
        </div>
      </div>

      {post.text && <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>}

      {post.mediaUrl && post.mediaType === 'image' && (
        <img src={post.mediaUrl} alt="" className="mt-3 rounded-xl w-full max-h-[480px] object-cover border border-line" />
      )}
      {post.mediaUrl && post.mediaType === 'video' && (
        <video src={post.mediaUrl} controls className="mt-3 rounded-xl w-full max-h-[480px] border border-line" />
      )}

      <div className="mt-3 flex items-center gap-4 text-muted">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition ${liked ? 'text-accent2' : 'hover:text-accent2'}`}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {likeCount}
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 text-sm hover:text-accent transition">
          <MessageSquare size={16} /> {commentCount}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-line space-y-3">
          {comments?.map((c) => (
            <div key={c._id} className="flex items-start gap-2 text-sm">
              <span className="font-medium">{c.author.displayName || c.author.username}</span>
              <span className="text-slate-300">{c.text}</span>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex items-center gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 bg-panel2 border border-line rounded-full px-3 py-1.5 text-sm outline-none focus:border-accent"
            />
            <button type="submit" className="p-2 rounded-full bg-accent text-ink hover:opacity-90 transition">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
