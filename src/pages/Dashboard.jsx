import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import GoalCard from '../components/GoalCard';
import CommunityFeed from '../components/CommunityFeed';
import { formatCurrency, calcProgress } from '../utils/helpers';
import confetti from 'canvas-confetti';
import './Dashboard.css';

// Returns a motivational sentence based on progress to nearest completion
function getMotivationalLine(goals) {
  const active = goals.filter(g => g.status === 'active');
  if (active.length === 0) return null;
  // Pick the closest to completion
  const closest = active.reduce((best, g) => {
    const prog = calcProgress(g.savedAmount, g.targetPrice);
    const bestProg = calcProgress(best.savedAmount, best.targetPrice);
    return prog > bestProg ? g : best;
  }, active[0]);

  const progress = calcProgress(closest.savedAmount, closest.targetPrice);
  const paymentsLeft = Math.max(0, closest.timeline - closest.monthsCompleted);

  if (progress >= 90) return `Almost there! One last push for your ${closest.productName} 🏁`;
  if (progress >= 75) return `You're ${progress}% done. ${paymentsLeft} payments away from owning your ${closest.productName} 🔥`;
  if (progress >= 50) return `Halfway! ${paymentsLeft} more months and that ${closest.productEmoji} ${closest.productName} is yours.`;
  if (progress >= 25) return `${progress}% saved. Your price is locked — keep going! 🔐`;
  return `Great start! Save consistently and you'll own your ${closest.productName} ${paymentsLeft} months from now.`;
}

function getCashbackEarned(goals) {
  return goals
    .filter(g => g.status === 'completed' || g.status === 'purchased')
    .reduce((sum, g) => sum + g.reward.amount, 0);
}

const SUGGESTED_PRODUCTS = [
  { emoji: '📱', name: 'iPhone 16 Pro Max', price: '₹1,34,900', months: 12 },
  { emoji: '💻', name: 'MacBook Pro', price: '₹1,99,900', months: 18 },
  { emoji: '🎮', name: 'PlayStation 5', price: '₹54,990', months: 6 },
  { emoji: '👟', name: 'Air Jordan 1', price: '₹18,000', months: 3 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, goals, totalSaved, activeGoals, makeDeposit, purchaseGoal, addToast } = useApp();
  const [depositModal, setDepositModal] = useState(null);
  const [depositAmt, setDepositAmt] = useState('');
  const [depositImpact, setDepositImpact] = useState(null);

  const motivationalLine = getMotivationalLine(goals);
  const cashbackEarned = getCashbackEarned(goals);
  const isNewUser = goals.length === 0;

  // ===== FIREBASE PUSH NOTIFICATIONS =====
  useEffect(() => {
    import('../lib/firebase')
      .then(({ requestPushPermission, listenForMessages }) => {
        requestPushPermission().then(token => {
          if (token && user) {
            console.log("🔥 Access FCM Token inside Dashboard:", token);
            // In a real scenario, you'd save this to Supabase with upsertProfile()
          }
        });
        
        listenForMessages((payload) => {
           console.log('Firebase payload:', payload);
           addToast(`🔔 ${payload.notification?.title}: ${payload.notification?.body}`, 'info', 6000);
        });
      })
      .catch(e => console.log('Firebase not fully configured yet', e));
  }, [user, addToast]);

  // Calculate deposit impact in real time
  const onDepositAmtChange = (val) => {
    setDepositAmt(val);
    if (!depositModal || !val || isNaN(val) || parseInt(val) < 1) {
      setDepositImpact(null);
      return;
    }
    const newTotal = depositModal.savedAmount + parseInt(val);
    const newProgress = Math.min(100, Math.round((newTotal / depositModal.targetPrice) * 100));
    const oldProgress = calcProgress(depositModal.savedAmount, depositModal.targetPrice);
    setDepositImpact({ newProgress, delta: newProgress - oldProgress });
  };

  const handleDepositClick = () => {
    if (goals.length === 0) {
      navigate('/create-goal');
    } else {
      const activeGoal = goals.find(g => g.status === 'active') || goals[0];
      setDepositModal(activeGoal);
      setDepositAmt(String(activeGoal.monthlyAmount));
      onDepositAmtChange(String(activeGoal.monthlyAmount));
    }
  };

  const handleDeposit = (goal) => {
    setDepositModal(goal);
    setDepositAmt(String(goal.monthlyAmount));
    onDepositAmtChange(String(goal.monthlyAmount));
  };

  const confirmDeposit = () => {
    if (!depositAmt || isNaN(depositAmt) || parseInt(depositAmt) < 1) return;
    const amt = parseInt(depositAmt);

    const newSaved = depositModal.savedAmount + amt;
    if (newSaved >= depositModal.targetPrice) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0A1D5C', '#0077FF', '#00E5FF', '#00C9A7'],
      });
    }

    makeDeposit(depositModal.id, amt);
    setDepositModal(null);
    setDepositAmt('');
    setDepositImpact(null);
  };

  const quickAmounts = depositModal
    ? [
        depositModal.monthlyAmount,
        Math.round(depositModal.monthlyAmount * 0.5),
        Math.round(depositModal.monthlyAmount * 1.5),
        Math.round(depositModal.monthlyAmount * 2),
      ].filter((v, i, arr) => arr.indexOf(v) === i && v > 0)
    : [];

  return (
    <div className="dashboard-container">
      {/* ===== DARK UPPER ZONE ===== */}
      <div className="dashboard-dark-header">
        <div className="dashboard-nav-top">
          <div className="user-greeting-block">
            <div className="user-greeting-time">
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'},
            </div>
            <div className="user-greeting-name">
              {user?.name?.split(' ')[0] || 'Dreamer'} 👋
            </div>
          </div>
          <div className="nav-icons">
            <span className="icon" title="Notifications">🔔</span>
          </div>
        </div>

        <div className="balance-area">
          <div className="balance-label">Total Saved</div>
          <h1 className="massive-balance">{formatCurrency(totalSaved)}</h1>
          {cashbackEarned > 0 && (
            <div className="balance-cashback">
              🎁 +{formatCurrency(cashbackEarned)} cashback earned
            </div>
          )}
        </div>

        {/* Motivational line */}
        {motivationalLine && !isNewUser && (
          <div className="motivational-banner">
            {motivationalLine}
          </div>
        )}

        {/* Quick Stats */}
        {!isNewUser && (
          <div className="dash-stats-row">
            <div className="dash-stat-chip">
              <span className="dash-stat-val">{activeGoals}</span>
              <span className="dash-stat-lbl">Active Goals</span>
            </div>
            <div className="dash-stat-chip">
              <span className="dash-stat-val">{user?.streak || 0}</span>
              <span className="dash-stat-lbl">🔥 Streak</span>
            </div>
            <div className="dash-stat-chip">
              <span className="dash-stat-val">{user?.consistencyScore || 0}%</span>
              <span className="dash-stat-lbl">Consistency</span>
            </div>
          </div>
        )}

        {/* Quick Action Tiles */}
        <div className="quick-actions-bar">
          <Link to="/create-goal" className="action-tile hover-spring" id="action-new-goal">
            <div className="icon-box">＋</div>
            <span>GOAL</span>
          </Link>
          <div className="action-tile hover-spring" onClick={handleDepositClick} id="action-deposit">
            <div className="icon-box">↑</div>
            <span>ADD</span>
          </div>
          <Link to="/rewards" className="action-tile hover-spring" id="action-rewards">
            <div className="icon-box">🎁</div>
            <span>REWARDS</span>
          </Link>
          <Link to="/profile" className="action-tile hover-spring" id="action-profile">
            <div className="icon-box">👤</div>
            <span>PROFILE</span>
          </Link>
        </div>
      </div>

      {/* ===== LIGHT LOWER ZONE ===== */}
      <div className="dashboard-light-content">

        {isNewUser ? (
          /* ===== EMPTY STATE — EMOTIONAL ===== */
          <div className="empty-state">
            <div className="empty-illustration">
              <div className="empty-ring empty-ring-1" />
              <div className="empty-ring empty-ring-2" />
              <div className="empty-emoji">🎯</div>
            </div>
            <h2 className="empty-title">What do you want to own?</h2>
            <p className="empty-sub">
              Pick your dream. Lock today's price. Save your way there — no loans, no EMIs, no regret.
            </p>

            <div className="empty-suggestions">
              {SUGGESTED_PRODUCTS.map(p => (
                <Link
                  key={p.name}
                  to="/create-goal"
                  className="suggestion-chip"
                >
                  <span className="suggestion-emoji">{p.emoji}</span>
                  <div className="suggestion-info">
                    <div className="suggestion-name">{p.name}</div>
                    <div className="suggestion-meta">{p.price} · {p.months}mo plan</div>
                  </div>
                  <span className="suggestion-arrow">→</span>
                </Link>
              ))}
            </div>

            <Link to="/create-goal" className="btn btn-primary" style={{ marginTop: 8 }} id="create-first-goal">
              Start Your First Goal →
            </Link>

            <div className="empty-trust">
              🔐 Price locked the moment you start &nbsp;·&nbsp; 💸 Withdraw anytime
            </div>
          </div>
        ) : (
          <>
            <CommunityFeed />

            {goals.filter(g => g.status !== 'purchased').length > 0 && (
              <>
                <div className="transaction-header">
                  <h3>Your Goals</h3>
                  <span className="goals-count-badge">{goals.filter(g => g.status === 'active').length} active</span>
                </div>
                <div className="transaction-list">
                  {goals.filter(g => g.status !== 'purchased').map(goal => (
                    <GoalCard key={goal.id} goal={goal} onDeposit={handleDeposit} onPurchase={() => purchaseGoal(goal.id)} />
                  ))}
                </div>
              </>
            )}

            {goals.filter(g => g.status === 'purchased').length > 0 && (
              <div style={{ marginTop: '2.5rem' }}>
                <div className="transaction-header">
                  <h3>Owned 🏆</h3>
                  <span className="goals-count-badge success">{goals.filter(g => g.status === 'purchased').length} purchased</span>
                </div>
                <div className="transaction-list">
                  {goals.filter(g => g.status === 'purchased').map(goal => (
                    <GoalCard key={goal.id} goal={goal} onDeposit={() => {}} onPurchase={() => {}} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== UPI-STYLE DEPOSIT MODAL ===== */}
      {depositModal && (
        <div
          className="modal-overlay"
          style={{ alignItems: 'flex-end', padding: 0 }}
          onClick={() => { setDepositModal(null); setDepositAmt(''); setDepositImpact(null); }}
        >
          <div
            className="deposit-sheet animate-slide-up-fluid"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="sheet-handle" />

            {/* Header */}
            <div className="sheet-header">
              <div className="sheet-goal-info">
                <span className="sheet-emoji">{depositModal.productEmoji}</span>
                <div>
                  <div className="sheet-goal-name">{depositModal.productName}</div>
                  <div className="sheet-progress-text">
                    {calcProgress(depositModal.savedAmount, depositModal.targetPrice)}% saved
                    {depositImpact && ` → ${depositImpact.newProgress}% after this`}
                  </div>
                </div>
              </div>
            </div>

            {/* Big number input */}
            <div className="sheet-amount-row">
              <span className="sheet-currency">₹</span>
              <input
                type="number"
                value={depositAmt}
                onChange={e => onDepositAmtChange(e.target.value)}
                className="sheet-amount-input"
                placeholder="0"
                autoFocus
                min="1"
              />
            </div>

            {/* Impact message */}
            {depositImpact && (
              <div className={`sheet-impact ${depositImpact.newProgress >= 100 ? 'complete' : ''}`}>
                {depositImpact.newProgress >= 100
                  ? '🎉 This completes your goal!'
                  : `📈 Takes you to ${depositImpact.newProgress}% (+${depositImpact.delta}%)`}
              </div>
            )}

            {/* Quick amounts */}
            <div className="sheet-quick-amounts">
              {quickAmounts.map(a => (
                <button
                  key={a}
                  className={`sheet-quick-btn ${depositAmt === String(a) ? 'active' : ''}`}
                  onClick={() => onDepositAmtChange(String(a))}
                >
                  ₹{a.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {/* Pay button */}
            <button
              className="btn btn-primary sheet-pay-btn"
              onClick={confirmDeposit}
              disabled={!depositAmt || parseInt(depositAmt) < 1}
              id="confirm-deposit"
            >
              {depositImpact?.newProgress >= 100 ? '🏆 Complete Goal!' : `Add ₹${parseInt(depositAmt || 0).toLocaleString('en-IN')} →`}
            </button>

            <button
              className="btn btn-ghost sheet-cancel-btn"
              onClick={() => { setDepositModal(null); setDepositAmt(''); setDepositImpact(null); }}
            >
              Cancel
            </button>

            <div className="sheet-trust">
              🔐 Encrypted transaction &nbsp;·&nbsp; Logged with TX ID
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
