import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import './Profile.css';

const DEFAULT_NOTIFICATIONS = [
  { id: 'monthly_reminder', label: 'Monthly deposit reminders', desc: 'Get reminded when your deposit is due', enabled: true },
  { id: 'milestone_alerts', label: 'Milestone achievements', desc: 'Celebrate when you hit 25%, 50%, 75%', enabled: true },
  { id: 'streak_alerts', label: 'Streak notifications', desc: "Don't break your saving streak!", enabled: false },
  { id: 'price_alerts', label: 'Price change alerts', desc: 'Know if your locked price changes in market', enabled: true },
];

export default function Profile() {
  const { user, goals, totalSaved, completedGoals, logout } = useApp();
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  const totalGoals = goals.length;
  const totalRewardEarned = goals
    .filter(g => g.status === 'completed')
    .reduce((s, g) => s + g.reward.amount, 0);
  const activeGoalsCount = goals.filter(g => g.status === 'active').length;

  const toggleNotif = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
  };

  const handleSaveName = () => {
    if (editName.trim()) {
      // In a real app, would update user in context
      setEditing(false);
    }
  };

  const tierLevel =
    (user?.consistencyScore || 0) >= 90 ? 'Elite' :
    (user?.consistencyScore || 0) >= 70 ? 'Pro' :
    (user?.consistencyScore || 0) >= 40 ? 'Saver' : 'Beginner';

  const tierColors = { 'Beginner': '#8FA898', 'Saver': '#FFB340', 'Pro': '#00FF94', 'Elite': '#B6FF00' };
  const tierColor = tierColors[tierLevel];

  return (
    <div className="page page-content">
      {/* Header */}
      <div className="profile-header animate-fade-in">
        <h1>Profile & Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      <div className="profile-grid">
        {/* LEFT COLUMN */}
        <div className="profile-left">
          {/* User Card */}
          <div className="user-card card animate-fade-in delay-1">
            <div className="user-avatar-large">{user?.avatar || 'U'}</div>
            
            {editing ? (
              <div className="edit-name-wrap">
                <input
                  className="input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  id="edit-name-input"
                  placeholder="Your full name"
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveName} id="save-name">Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setEditName(user?.name || ''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="user-name">{user?.name || 'Dreamer'}</div>
                <div className="user-email">{user?.email || ''}</div>
                <div className="user-tier-badge" style={{ '--tier-color': tierColor }}>
                  ✦ {tierLevel} Saver
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} id="edit-name-btn">
                  ✏️ Edit Name
                </button>
              </>
            )}
            <div className="user-joined">Member since {formatDate(user?.joinedAt || new Date().toISOString())}</div>
          </div>

          {/* Stats Summary */}
          <div className="profile-stats card animate-fade-in delay-2">
            <div className="profile-stats-header">📊 Your Journey</div>
            {[
              { label: 'Total Saved', value: formatCurrency(totalSaved), icon: '💰' },
              { label: 'Total Goals', value: totalGoals, icon: '🎯' },
              { label: 'Active Goals', value: activeGoalsCount, icon: '⚡' },
              { label: 'Completed Goals', value: completedGoals, icon: '✅' },
              { label: 'Rewards Earned', value: formatCurrency(totalRewardEarned), icon: '🎁' },
              { label: 'Day Streak', value: `${user?.streak || 0} days 🔥`, icon: '🔥' },
              { label: 'Consistency Score', value: `${user?.consistencyScore || 0}%`, icon: '📈' },
            ].map(s => (
              <div key={s.label} className="profile-stat-row">
                <span className="profile-stat-icon">{s.icon}</span>
                <span className="profile-stat-label">{s.label}</span>
                <span className="profile-stat-val">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="profile-right">

          {/* About */}
          <div className="card animate-fade-in delay-2">
            <h4 style={{ marginBottom: 16 }}>About SOONER</h4>
            <div className="about-list">
              <div className="about-row">
                <span className="about-icon">🔐</span>
                <div>
                  <div className="about-label">Price Protection</div>
                  <div className="about-desc">Your locked price never increases, guaranteed.</div>
                </div>
              </div>
              <div className="about-row">
                <span className="about-icon">🎁</span>
                <div>
                  <div className="about-label">Completion Rewards</div>
                  <div className="about-desc">Earn 2–8% cashback when you complete a goal.</div>
                </div>
              </div>
              <div className="about-row">
                <span className="about-icon">📊</span>
                <div>
                  <div className="about-label">Milestone Bonuses</div>
                  <div className="about-desc">Hit 25%, 50%, 75% to unlock cascading rewards.</div>
                </div>
              </div>
              <div className="about-row">
                <span className="about-icon">🛡️</span>
                <div>
                  <div className="about-label">No Debt. Ever.</div>
                  <div className="about-desc">SOONER is anti-BNPL — save first, own SOONER.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="card animate-fade-in delay-3">
            <h4 style={{ marginBottom: 16 }}>Notification Preferences</h4>
            {notifications.map(n => (
              <div key={n.id} className="notif-row">
                <div className="notif-info">
                  <div className="notif-label">{n.label}</div>
                  <div className="notif-desc">{n.desc}</div>
                </div>
                <button
                  className={`toggle ${n.enabled ? 'on' : 'off'}`}
                  onClick={() => toggleNotif(n.id)}
                  id={`toggle-${n.id}`}
                  type="button"
                  aria-label={`${n.label}: ${n.enabled ? 'on' : 'off'}`}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            ))}
          </div>

          {/* Account / Danger Zone */}
          <div className="card danger-zone animate-fade-in delay-4">
            <h4>Account</h4>
            <p style={{ fontSize: '0.82rem', marginBottom: 16, color: 'var(--text-muted)' }}>
              Signing out keeps all your goals and data saved locally in this browser.
            </p>
            <button className="btn btn-secondary danger-outline" onClick={logout} id="logout-btn" type="button">
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
