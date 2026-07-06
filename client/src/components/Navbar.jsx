import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, MessageCircle, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 inset-x-0 z-40 h-16 border-b border-line bg-panel/90 backdrop-blur">
      <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-accent pulse-live' : 'bg-muted'}`} />
          <span className="font-display font-semibold text-lg tracking-tight">Pulse</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/" className="p-2 rounded-lg hover:bg-panel2 text-muted hover:text-slate-100 transition">
            <Home size={20} />
          </Link>
          <Link to="/discover" className="p-2 rounded-lg hover:bg-panel2 text-muted hover:text-slate-100 transition">
            <Search size={20} />
          </Link>
          <Link to="/messages" className="p-2 rounded-lg hover:bg-panel2 text-muted hover:text-slate-100 transition">
            <MessageCircle size={20} />
          </Link>
          <Link to="/analytics" className="p-2 rounded-lg hover:bg-panel2 text-muted hover:text-slate-100 transition">
            <BarChart3 size={20} />
          </Link>
          <NotificationBell />
          <Link
            to={`/profile/${user.username}`}
            className="ml-2 w-8 h-8 rounded-full bg-panel2 border border-line flex items-center justify-center text-xs font-semibold overflow-hidden"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              user.username[0]?.toUpperCase()
            )}
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-2 rounded-lg hover:bg-panel2 text-muted hover:text-accent2 transition"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
