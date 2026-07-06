import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Feed from './pages/Feed.jsx';
import Profile from './pages/Profile.jsx';
import Messages from './pages/Messages.jsx';
import Analytics from './pages/Analytics.jsx';
import Discover from './pages/Discover.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <CenteredLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function CenteredLoader() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-accent pulse-live" />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <CenteredLoader />;

  return (
    <div className="min-h-screen bg-ink">
      {user && <Navbar />}
      <div className={user ? 'pt-16' : ''}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route path="/" element={<Protected><Feed /></Protected>} />
          <Route path="/discover" element={<Protected><Discover /></Protected>} />
          <Route path="/profile/:username" element={<Protected><Profile /></Protected>} />
          <Route path="/messages" element={<Protected><Messages /></Protected>} />
          <Route path="/messages/:userId" element={<Protected><Messages /></Protected>} />
          <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
