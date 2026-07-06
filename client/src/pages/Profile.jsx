import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, MessageCircle } from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';

export default function Profile() {
  const { username } = useParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const avatarInputRef = useRef(null);

  const isOwnProfile = username === user.username;

  useEffect(() => {
    loadProfile();
  }, [username]);

  async function loadProfile() {
    try {
      const { data } = await api.get(`/users/${username}`);
      setProfile(data.user);
      setIsFollowing(!!data.user.isFollowing);

      const { data: postsData } = await api.get('/posts');
      setPosts(postsData.posts.filter((p) => p.author.username === username));
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
    }
  }

  async function handleFollowToggle() {
    if (isFollowing) {
      await api.delete(`/users/${profile.id}/follow`);
      setProfile((p) => ({ ...p, followersCount: p.followersCount - 1 }));
    } else {
      await api.post(`/users/${profile.id}/follow`);
      setProfile((p) => ({ ...p, followersCount: p.followersCount + 1 }));
    }
    setIsFollowing((f) => !f);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setUser(data.user);
    setProfile(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  if (notFound) return <p className="text-center text-muted py-12">No user found with that username.</p>;
  if (!profile) return <p className="text-center text-muted py-12">Loading profile…</p>;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="bg-panel border border-line rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-panel2 border border-line flex items-center justify-center text-xl font-semibold overflow-hidden">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                profile.username[0]?.toUpperCase()
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-accent text-ink p-1.5 rounded-full"
              >
                <Camera size={12} />
              </button>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          {!isOwnProfile ? (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/messages/${profile.id}`)}
                className="p-2 rounded-lg border border-line hover:bg-panel2 transition"
              >
                <MessageCircle size={16} />
              </button>
              <button
                onClick={handleFollowToggle}
                className={`text-sm font-semibold rounded-full px-4 py-1.5 transition ${
                  isFollowing ? 'border border-line hover:bg-panel2' : 'bg-accent text-ink hover:opacity-90'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ) : null}
        </div>

        <h1 className="font-display text-xl font-semibold mt-3">{profile.displayName}</h1>
        <p className="text-muted text-sm">@{profile.username}</p>
        {profile.bio && <p className="text-sm mt-2 leading-relaxed">{profile.bio}</p>}

        <div className="flex gap-4 mt-4 text-sm">
          <span><strong>{profile.followersCount}</strong> <span className="text-muted">Followers</span></span>
          <span><strong>{profile.followingCount}</strong> <span className="text-muted">Following</span></span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {posts.length === 0 && <p className="text-center text-muted text-sm py-8">No posts yet.</p>}
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}
