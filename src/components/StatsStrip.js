import './StatsStrip.css';

const stats = [
  { label: '60+ Verified Top Prop Firms', icon: '🏆' },
  { label: '1000+ Challenges', icon: '⚡' },
  { label: '9500+ Real Trader Reviews', icon: '💬' },
  { label: '4M+ Monthly Website Views', icon: '👁️' },
];

export default function StatsStrip() {
  return (
    <div className="stats-strip container animate-fade">
      {stats.map((stat, i) => (
        <div key={stat.label} className="stat-badge glass" style={{ animationDelay: `${i * 0.1}s` }}>
          <span className="stat-icon">{stat.icon}</span>
          <span className="stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
