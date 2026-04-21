import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';

const SUBJECT_COLORS = {
  Math: '#0058bd',
  Science: '#006b2b',
  History: '#795900',
  Medicine: '#EA4335',
  Language: '#a855f7',
  CS: '#2771df',
  Other: '#727785',
};

export default function ProgressAnalytics() {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState(null);
  const [mastery, setMastery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [o, a, m] = await Promise.all([
          api.get('/stats/overview'),
          api.get('/stats/activity'),
          api.get('/stats/mastery'),
        ]);
        setOverview(o.data);
        setActivity(a.data);
        setMastery(m.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface min-h-screen">
        <Navbar />
        <div className="py-20 text-center text-on-surface-variant">Loading your progress…</div>
      </div>
    );
  }

  // Compute cumulative mastery timeline
  let cumulative = 0;
  const masteryTimeline = (mastery || []).map((d) => {
    cumulative += d.count;
    return { date: d.date.slice(5), mastered: cumulative };
  });

  const weekData = activity?.days?.slice(-14).map((d) => ({
    date: d.date.slice(5),
    reviews: d.reviews,
    minutes: d.minutes,
  })) || [];

  const subjectPieData = activity?.subjectDistribution?.map((s) => ({
    name: s.subject,
    value: s.count,
  })) || [];

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />

      <header className="bg-bg-yellow py-10">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8">
          <h1 className="text-h2-section text-on-surface mb-2">Your progress</h1>
          <p className="text-on-surface-variant">
            See how your knowledge is growing over time.
          </p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 md:px-8 py-10 space-y-8">
        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="local_fire_department"
            label="Current streak"
            value={`${overview?.streak || 0} days`}
            bg="bg-bg-yellow"
            color="text-secondary"
            border="border-secondary-container"
          />
          <StatCard
            icon="check_circle"
            label="Cards mastered"
            value={overview?.masteredCount || 0}
            bg="bg-bg-green"
            color="text-tertiary"
            border="border-tertiary"
          />
          <StatCard
            icon="library_books"
            label="Active decks"
            value={overview?.deckCount || 0}
            bg="bg-bg-blue"
            color="text-primary"
            border="border-primary"
          />
          <StatCard
            icon="style"
            label="Total cards"
            value={overview?.cardCount || 0}
            bg="bg-white"
            color="text-on-surface"
            border="border-outline-variant"
          />
        </div>

        {/* Weekly activity */}
        <section className="bg-white rounded-xl shadow-card border border-border-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-h3-card text-xl">Reviews per day</h2>
              <p className="text-sm text-on-surface-variant">Last 14 days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{ fill: '#5F6368', fontSize: 12 }} />
                <YAxis tick={{ fill: '#5F6368', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e0e0e0', fontFamily: 'Lexend' }}
                />
                <Bar dataKey="reviews" fill="#0058bd" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mastery timeline */}
          <section className="bg-white rounded-xl shadow-card border border-border-subtle p-6">
            <h2 className="text-h3-card text-xl mb-1">Mastery growth</h2>
            <p className="text-sm text-on-surface-variant mb-4">Cumulative cards mastered</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={masteryTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" tick={{ fill: '#5F6368', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#5F6368', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e0e0e0', fontFamily: 'Lexend' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mastered"
                    stroke="#006b2b"
                    strokeWidth={3}
                    dot={{ fill: '#006b2b', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Subject distribution */}
          <section className="bg-white rounded-xl shadow-card border border-border-subtle p-6">
            <h2 className="text-h3-card text-xl mb-1">Cards by subject</h2>
            <p className="text-sm text-on-surface-variant mb-4">Where your study time lives</p>
            {subjectPieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-on-surface-variant">
                No cards yet.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      label={(e) => `${e.name}`}
                    >
                      {subjectPieData.map((entry) => (
                        <Cell key={entry.name} fill={SUBJECT_COLORS[entry.name] || '#727785'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e0e0e0', fontFamily: 'Lexend' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>

        {/* Breakdown */}
        <section className="bg-bg-blue rounded-xl p-6">
          <h2 className="text-h3-card text-xl mb-4">Card status breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            <StatusBar
              label="New"
              count={overview?.newCount || 0}
              total={overview?.cardCount || 1}
              color="bg-primary"
              text="text-primary"
            />
            <StatusBar
              label="Learning"
              count={overview?.learningCount || 0}
              total={overview?.cardCount || 1}
              color="bg-secondary-container"
              text="text-secondary"
            />
            <StatusBar
              label="Mastered"
              count={overview?.masteredCount || 0}
              total={overview?.cardCount || 1}
              color="bg-tertiary"
              text="text-tertiary"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, bg, color, border }) {
  return (
    <div className={`${bg} rounded-xl p-5 border-t-4 ${border} shadow-card`}>
      <span className={`material-symbols-outlined ${color} mb-2`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <p className={`text-stats-display ${color}`}>{value}</p>
      <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function StatusBar({ label, count, total, color, text }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <p className={`text-sm font-bold ${text}`}>{label}</p>
        <p className={`text-xl font-black ${text}`}>{count}</p>
      </div>
      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-on-surface-variant mt-1">{pct}% of all cards</p>
    </div>
  );
}
