import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Heart, MessageSquare, Users, FileText } from 'lucide-react';
import api from '../api/axios.js';

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-panel border border-line rounded-2xl p-4 flex items-center gap-3">
      <div className="p-2 rounded-xl bg-panel2 text-accent">{icon}</div>
      <div>
        <p className="text-2xl font-display font-semibold">{value}</p>
        <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/analytics/summary').then(({ data }) => setSummary(data));
  }, []);

  if (!summary) return <p className="text-center text-muted py-12">Loading analytics…</p>;

  const chartData = summary.dailyEngagement.map((d) => ({
    day: d._id.slice(5),
    likes: d.likes,
    comments: d.comments,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold">Engagement dashboard</h1>
        <p className="text-muted text-sm">
          A live view of how people interact with your content. {summary.cached && <span className="text-accent">(cached)</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<FileText size={18} />} label="Posts" value={summary.totals.posts} />
        <StatCard icon={<Heart size={18} />} label="Likes" value={summary.totals.likes} />
        <StatCard icon={<MessageSquare size={18} />} label="Comments" value={summary.totals.comments} />
        <StatCard icon={<Users size={18} />} label="Followers" value={summary.totals.followers} />
      </div>

      <div className="bg-panel border border-line rounded-2xl p-4">
        <h2 className="font-display text-sm font-semibold mb-4">Engagement over time</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#2e3146" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#8b8fa8" fontSize={12} />
            <YAxis stroke="#8b8fa8" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#1b1d29', border: '1px solid #2e3146', borderRadius: 8 }} />
            <Line type="monotone" dataKey="likes" stroke="#f472b6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="comments" stroke="#5eead4" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-panel border border-line rounded-2xl p-4">
        <h2 className="font-display text-sm font-semibold mb-3">Top performing posts</h2>
        {summary.topPosts.length === 0 && <p className="text-sm text-muted">No posts yet.</p>}
        <div className="space-y-2">
          {summary.topPosts.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm border-b border-line/50 pb-2 last:border-0">
              <span className="truncate mr-3">{p.text || '(media post)'}</span>
              <span className="text-muted shrink-0 flex items-center gap-3">
                <span className="flex items-center gap-1"><Heart size={12} /> {p.likeCount}</span>
                <span className="flex items-center gap-1"><MessageSquare size={12} /> {p.commentCount}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
