import { useApp } from '../context/AppContext';
import { ACHIEVEMENTS, formatCurrency } from '../utils/helpers';
import './Rewards.css';

const TIERS = [
  { label: 'Beginner', min: 0,  color: '#94A3B8', icon: '🌱' },
  { label: 'Saver',    min: 40, color: '#F59E0B', icon: '💰' },
  { label: 'Pro',      min: 70, color: '#10B981', icon: '⚡' },
  { label: 'Elite',    min: 90, color: '#6366F1', icon: '👑' },
];

function getCurrentTier(score) {
  return [...TIERS].reverse().find(t => score >= t.min) || TIERS[0];
}

function XPBar({ score }) {
  const tier = getCurrentTier(score);
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  const pct = nextTier
    ? Math.round(((score - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-labels">
        <span className="xp-tier-current" style={{ color: tier.color }}>
          {tier.icon} {tier.label}
        </span>
        {nextTier && (
          <span className="xp-tier-next">Next: {nextTier.icon} {nextTier.label}</span>
        )}
      </div>
      <div className="xp-track">
        <div className="xp-fill" style={{ width: `${pct}%`, background: tier.color }} />
      </div>
      <div className="xp-score-text">{score}% consistency score</div>
    </div>
  );
}

export default function Rewards() {
  const { user, goals } = useApp();
  const achievements = user?.achievements || ACHIEVEMENTS;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completedGoals = goals.filter(g => g.status === 'completed' || g.status === 'purchased');
  const totalCashback = completedGoals.reduce((sum, g) => sum + (g.reward?.amount || 0), 0);
  const tier = getCurrentTier(user?.consistencyScore || 0);

  return (
    <div className="rewards-page page-content">

      {/* ===== HEADER HERO ===== */}
      <div className="rewards-hero">
        <div className="rewards-hero-bg" />
        <div className="rewards-hero-content">
          <div className="rewards-tier-badge" style={{ '--tier-color': tier.color }}>
            <span className="tier-icon">{tier.icon}</span>
            <span className="tier-name">{tier.label}</span>
          </div>
          <h1 className="rewards-hero-title">
            {unlockedCount} of {achievements.length}<br />
            <span>achievements unlocked</span>
          </h1>
          {totalCashback > 0 && (
            <div className="rewards-cashback-total">
              🎁 {formatCurrency(totalCashback)} total cashback earned
            </div>
          )}
        </div>
      </div>

      {/* ===== STREAK + CONSISTENCY ===== */}
      <div className="rewards-stats-grid">
        {/* Streak card */}
        <div className="streak-v2 animate-slide-right delay-1">
          <div className="streak-v2-top">
            <div className="streak-fire-wrap">
              <span className="streak-fire-emoji animate-fire-dance">🔥</span>
            </div>
            <div>
              <div className="streak-v2-num">{user?.streak || 0}</div>
              <div className="streak-v2-label">Day Streak</div>
            </div>
          </div>
          <div className="streak-week-dots">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div
                key={i}
                className={`streak-day-pill ${i < Math.min(7, user?.streak || 0) ? 'filled' : ''}`}
              >
                {d}
              </div>
            ))}
          </div>
          <p className="streak-tip">
            Keep saving daily to unlock bonus rewards and grow your streak!
          </p>
        </div>

        {/* Consistency card */}
        <div className="consistency-v2 animate-slide-right delay-2">
          <div className="consistency-header">
            <div className="consistency-label">Consistency Score</div>
            <div className="consistency-num" style={{ color: tier.color }}>
              {user?.consistencyScore || 0}<small>%</small>
            </div>
          </div>
          <XPBar score={user?.consistencyScore || 0} />
          <div className="tier-list">
            {TIERS.map(t => {
              const isActive = (user?.consistencyScore || 0) >= t.min;
              return (
                <div
                  key={t.label}
                  className={`tier-pill ${isActive ? 'active' : ''}`}
                  style={isActive ? { '--tc': t.color } : {}}
                >
                  {t.icon} {t.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== CASHBACK CARDS (completed goals) ===== */}
      {completedGoals.length > 0 && (
        <section className="rewards-section">
          <div className="rewards-section-label">💸 Cashback Earned</div>
          <div className="cashback-grid">
            {completedGoals.map(g => (
              <div key={g.id} className="cashback-card animate-fade-in">
                <div className="cashback-emoji-wrap">
                  <span className="cashback-emoji">{g.productEmoji}</span>
                  {g.status === 'purchased' && <div className="cashback-owned-badge">Owned</div>}
                </div>
                <div className="cashback-name">{g.productName}</div>
                <div className="cashback-amount">
                  +{formatCurrency(g.reward?.amount || 0)}
                </div>
                <div className="cashback-pct">{g.reward?.pct}% back</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== ACTIVE PROTECTIONS ===== */}
      <section className="rewards-section">
        <div className="rewards-section-label">🛡️ Active Protections</div>
        <div className="protections-list">
          {[
            { icon: '🔐', title: 'Price Lock Active', desc: 'Your prices are locked from the day you started.', color: '#0077FF' },
            { icon: '💸', title: 'Withdraw Anytime', desc: 'Your money is yours — exit anytime, no penalties.', color: '#10B981' },
            { icon: '📜', title: 'Immutable Ledger', desc: 'Every transaction is cryptographically secured.', color: '#6366F1' },
          ].map(p => (
            <div key={p.title} className="protection-card">
              <div className="protection-icon" style={{ background: `${p.color}18` }}>
                {p.icon}
              </div>
              <div className="protection-text">
                <div className="protection-title">{p.title}</div>
                <div className="protection-desc">{p.desc}</div>
              </div>
              <div className="protection-check" style={{ color: p.color }}>✓</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ACHIEVEMENTS ===== */}
      <section className="rewards-section">
        <div className="rewards-section-label">🏆 Achievements</div>
        <div className="achievements-v2-grid">
          {achievements.map((a, i) => (
            <div
              key={a.id}
              className={`achievement-v2 ${a.unlocked ? 'unlocked' : 'locked'} animate-fade-in delay-${(i % 4) + 1}`}
            >
              <div className={`achievement-v2-icon-wrap ${a.unlocked ? 'ach-glow' : ''}`}>
                <span className="achievement-v2-icon">{a.icon}</span>
                {a.unlocked && <div className="achievement-v2-check">✓</div>}
              </div>
              <div className="achievement-v2-info">
                <div className="achievement-v2-title">{a.title}</div>
                <div className="achievement-v2-desc">{a.desc}</div>
              </div>
              {!a.unlocked && <div className="achievement-lock-overlay">🔒</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
