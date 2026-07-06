import { useEffect, useRef, useState } from 'react';
import { Bell, Heart, MessageSquare, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/axios.js';
import { useSocket } from '../context/SocketContext.jsx';

const ICONS = {
  like: <Heart size={14} className="text-accent2" />,
  comment: <MessageSquare size={14} className="text-accent" />,
  follow: <UserPlus size={14} className="text-accent" />,
};

const LABELS = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
};

export default function NotificationBell() {
  const { notifications, setNotifications } = useSocket();
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setInitial(data.notifications)).catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const combined = [...notifications, ...initial.filter((i) => !notifications.some((n) => n.id === i.id))];
  const unreadCount = combined.filter((n) => !n.read).length;

  async function handleOpen() {
    setOpen((o) => !o);
    if (unreadCount > 0) {
      await api.patch('/notifications/read-all').catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setInitial((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative p-2 rounded-lg hover:bg-panel2 text-muted hover:text-slate-100 transition">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent2" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-panel2 border border-line rounded-xl shadow-glow p-2">
          <p className="px-2 py-1.5 text-xs uppercase tracking-wider text-muted font-display">Notifications</p>
          {combined.length === 0 && <p className="px-3 py-6 text-sm text-muted text-center">Nothing yet — activity will show up here in real time.</p>}
          {combined.slice(0, 20).map((n) => (
            <div key={n.id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-ink/40">
              <div className="mt-0.5">{ICONS[n.type]}</div>
              <div className="text-sm leading-snug">
                <span className="font-medium">{n.actor?.displayName || n.actor?.username}</span>{' '}
                <span className="text-muted">{LABELS[n.type]}</span>
                <div className="text-xs text-muted mt-0.5">
                  {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : 'just now'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
