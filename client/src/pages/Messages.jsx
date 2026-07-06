import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export default function Messages() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [peer, setPeer] = useState(null);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (userId) loadMessages(userId);
  }, [userId]);

  useEffect(() => {
    if (!socket) return;
    function onNewMessage(payload) {
      if (payload.conversationId === buildConversationId(user.id, userId)) {
        setMessages((prev) => [...prev, payload]);
      }
      loadConversations();
    }
    function onTyping({ senderId }) {
      if (senderId === userId) {
        setTyping(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTyping(false), 2000);
      }
    }
    socket.on('message:new', onNewMessage);
    socket.on('message:typing', onTyping);
    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:typing', onTyping);
    };
  }, [socket, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function buildConversationId(a, b) {
    return [a, b].sort().join('_');
  }

  async function loadConversations() {
    const { data } = await api.get('/messages/conversations');
    // Defensive: drop any conversation where the other user couldn't be
    // resolved (e.g. a stale record from earlier testing, or a deleted account).
    const clean = data.conversations.filter(
      (c) => c.lastMessage && c.lastMessage.sender && c.lastMessage.recipient
    );
    setConversations(clean);
  }

  async function loadMessages(otherId) {
    const { data } = await api.get(`/messages/${otherId}`);
    setMessages(data.messages);
    socket?.emit('message:read', { conversationId: buildConversationId(user.id, otherId) });

    const conv = conversations.find((c) => c._id === buildConversationId(user.id, otherId));
    if (conv && conv.lastMessage?.sender && conv.lastMessage?.recipient) {
      const other = conv.lastMessage.sender._id === user.id ? conv.lastMessage.recipient : conv.lastMessage.sender;
      setPeer(other);
    } else {
      setPeer(null);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !socket || !userId) return;
    socket.emit('message:send', { recipientId: userId, text }, (res) => {
      if (res?.ok) {
        setMessages((prev) => [...prev, res.message]);
        setText('');
      }
    });
  }

  function handleTyping() {
    socket?.emit('message:typing', { recipientId: userId });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-6rem)]">
      <aside className="bg-panel border border-line rounded-2xl overflow-y-auto">
        <p className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-display border-b border-line">Conversations</p>
        {conversations.length === 0 && <p className="px-4 py-6 text-sm text-muted">No conversations yet.</p>}
        {conversations.map((c) => {
          if (!c.lastMessage?.sender || !c.lastMessage?.recipient) return null;
          const other = c.lastMessage.sender._id === user.id ? c.lastMessage.recipient : c.lastMessage.sender;
          return (
            <button
              key={c._id}
              onClick={() => navigate(`/messages/${other._id}`)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-panel2 transition border-b border-line/50 ${
                userId === other._id ? 'bg-panel2' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-panel2 border border-line flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden">
                {other.avatarUrl ? <img src={other.avatarUrl} className="w-full h-full object-cover" /> : other.username[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{other.displayName || other.username}</p>
                <p className="text-xs text-muted truncate">{c.lastMessage.text}</p>
              </div>
              {c.unreadCount > 0 && <span className="ml-auto w-2 h-2 rounded-full bg-accent2 shrink-0" />}
            </button>
          );
        })}
      </aside>

      <section className="bg-panel border border-line rounded-2xl flex flex-col overflow-hidden">
        {!userId && (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">Select a conversation to start chatting.</div>
        )}

        {userId && (
          <>
            <div className="px-4 py-3 border-b border-line text-sm font-medium">
              {peer ? peer.displayName || peer.username : 'Chat'}
              {typing && <span className="text-xs text-muted ml-2">typing…</span>}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {messages.map((m) => {
                if (!m.sender) return null;
                const mine = (m.sender._id || m.sender) === user.id;
                return (
                  <div key={m.id || m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-accent text-ink' : 'bg-panel2 border border-line'}`}>
                      {m.text}
                      <div className={`text-[10px] mt-1 ${mine ? 'text-ink/60' : 'text-muted'}`}>
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-line flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message…"
                className="flex-1 bg-panel2 border border-line rounded-full px-4 py-2 text-sm outline-none focus:border-accent"
              />
              <button type="submit" className="p-2.5 rounded-full bg-accent text-ink hover:opacity-90 transition">
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
