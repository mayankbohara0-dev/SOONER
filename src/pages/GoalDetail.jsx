import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProgressRing from '../components/ProgressRing';
import ConfettiEffect from '../components/ConfettiEffect';
import { formatCurrency, formatDate, calcProgress, getMilestones, getNextMilestone, calcAITip } from '../utils/helpers';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './GoalDetail.css';

function getEmotionalProgress(progress, productName, paymentsLeft) {
  if (progress >= 100) return `🏆 You did it. ${productName} is yours.`;
  if (progress >= 90)  return `🏁 Almost there! Just ${paymentsLeft} payment${paymentsLeft !== 1 ? 's' : ''} away.`;
  if (progress >= 75)  return `⭐ ${progress}% done — the final stretch. Keep going!`;
  if (progress >= 50)  return `🚀 Halfway! ${paymentsLeft} more months and it's yours.`;
  if (progress >= 25)  return `🌱 ${progress}% saved with price locked. You're ahead of plan.`;
  return `💪 Solid start — your price is locked and can't go up.`;
}

function getFutureDate(endDate) {
  const d = new Date(endDate);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function GoalDetail() {
  const { id } = useParams();
  const { goals, makeDeposit, pauseGoal, deleteGoal, purchaseGoal } = useApp();
  const navigate = useNavigate();
  // deposit state managed separately below with impact preview

  const goal = goals.find(g => g.id === id);
  if (!goal) return (
    <div className="page page-content" style={{ textAlign: 'center', paddingTop: '120px' }}>
      <h2>Goal not found</h2>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
        Back to Dashboard
      </button>
    </div>
  );

  const progress = calcProgress(goal.savedAmount, goal.targetPrice);
  const milestones = getMilestones(progress);
  const nextMilestone = getNextMilestone(progress);
  const aiTip = calcAITip(goal);
  const isComplete = goal.status === 'completed' || goal.status === 'purchased';
  const isPurchased = goal.status === 'purchased';
  const paymentsLeft = Math.max(0, goal.timeline - goal.monthsCompleted);
  const emotionalLine = getEmotionalProgress(progress, goal.productName, paymentsLeft);
  const futureDate = getFutureDate(goal.endDate);

  const [depositAmt, setDepositAmt] = useState('');
  const [depositImpact, setDepositImpact] = useState(null);

  const onDepositAmtChange = (val) => {
    setDepositAmt(val);
    if (!val || isNaN(val) || parseInt(val) < 1) { setDepositImpact(null); return; }
    const newTotal = goal.savedAmount + parseInt(val);
    const newPct = Math.min(100, Math.round((newTotal / goal.targetPrice) * 100));
    const delta = newPct - progress;
    setDepositImpact({ newPct, delta });
  };

  const chartData = goal.history.map((amt, i) => ({
    month: `M${i + 1}`,
    saved: goal.history.slice(0, i + 1).reduce((s, a) => s + a, 0),
    target: goal.targetPrice,
  }));

  const handleDeposit = () => {
    if (!depositAmt || isNaN(depositAmt)) return;
    makeDeposit(goal.id, parseInt(depositAmt));
    setDepositAmt('');
    setDepositImpact(null);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${goal.productName}"? This cannot be undone.`)) {
      deleteGoal(goal.id);
      navigate('/dashboard');
    }
  };



  return (
    <div className="page page-content">
      <ConfettiEffect trigger={goal.status === 'completed' && !isPurchased} />

      {/* Header */}
      <div className="detail-header animate-fade-in">
        <button className="btn btn-ghost btn-sm back-btn" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
        <div className="detail-actions">
          {!isComplete && (
            <>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => pauseGoal(goal.id)} id="pause-goal">
                {goal.status === 'paused' ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm danger-btn" onClick={handleDelete} id="delete-goal">
                🗑 Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <div className={`detail-hero-card card animate-fade-in delay-1 ${isComplete ? 'card-glow' : ''}`}
        style={{ '--product-color': goal.productColor }}>

        {/* Emotional progress line */}
        <div className="detail-emotional-line">{emotionalLine}</div>

        <div className="detail-hero-top">
          <div className="detail-emoji">{goal.productEmoji}</div>
          <div className="detail-hero-info">
            <div className="detail-product-name">{goal.productName}</div>
            <div className="detail-badges">
              {goal.priceLocked && <span className="badge badge-accent">🔐 Locked at {formatCurrency(goal.lockedPrice)}</span>}
              <span className={`badge ${isPurchased ? 'badge-accent' : isComplete ? 'badge-success' : goal.status === 'paused' ? 'badge-warning' : 'badge-accent'}`}>
                {isPurchased ? '🛍️ Purchased!' : isComplete ? '✅ Complete!' : goal.status === 'paused' ? '⏸ Paused' : '🟢 Active'}
              </span>
            </div>
          </div>
          <ProgressRing progress={progress} size={90} />
        </div>

        {/* Stats Row */}
        <div className="detail-stats">
          <div className="detail-stat">
            <div className="detail-stat-val">{formatCurrency(goal.savedAmount)}</div>
            <div className="detail-stat-lbl">Saved</div>
          </div>
          <div className="detail-stat-divider" />
          <div className="detail-stat">
            <div className="detail-stat-val">{formatCurrency(goal.targetPrice)}</div>
            <div className="detail-stat-lbl">Target</div>
          </div>
          <div className="detail-stat-divider" />
          <div className="detail-stat">
            <div className="detail-stat-val">{formatCurrency(Math.max(0, goal.targetPrice - goal.savedAmount))}</div>
            <div className="detail-stat-lbl">Remaining</div>
          </div>
          <div className="detail-stat-divider" />
          <div className="detail-stat">
            <div className="detail-stat-val" style={{ color: 'var(--accent-start)' }}>
              +{goal.reward.pct}%
            </div>
            <div className="detail-stat-lbl">Reward</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-track" style={{ height: 8 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="detail-timeline">
          <span>Started {formatDate(goal.startDate)}</span>
          <span>{goal.monthsCompleted}/{goal.timeline} months done</span>
          <span>Ends {formatDate(goal.endDate)}</span>
        </div>

        {/* Future You */}
        {!isComplete && (
          <div className="future-you-card">
            <div className="future-you-icon">🔮</div>
            <div className="future-you-text">
              <div className="future-you-title">Future You</div>
              <div className="future-you-desc">
                On <strong>{futureDate}</strong>, you'll own the {goal.productName} — paid in full, no debt, no regret.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="detail-grid animate-fade-in delay-2">
        {/* LEFT: Chart */}
        <div className="detail-section">
          <div className="section-header">
            <span className="section-title">Saving History</span>
          </div>
          <div className="card detail-chart-card">
            {chartData.length === 0 ? (
              <div className="chart-empty">No deposits yet. Make your first deposit!</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF94" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00FF94" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#4A5F52" fontSize={11} />
                  <YAxis stroke="#4A5F52" fontSize={11} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#111814', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, fontSize: 12 }}
                    formatter={(v) => [formatCurrency(v), 'Saved']}
                    labelStyle={{ color: '#8FA898' }}
                    itemStyle={{ color: '#00FF94' }}
                  />
                  <Area type="monotone" dataKey="saved" stroke="#00FF94" strokeWidth={2} fill="url(#chartGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* AI Tip */}
          <div className="ai-tip" style={{ marginTop: 16 }}>
            <div dangerouslySetInnerHTML={{ __html: aiTip.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>
        </div>

        {/* RIGHT: Milestones + Actions */}
        <div className="detail-section">
          <div className="section-header">
            <span className="section-title">Milestones</span>
          </div>
          <div className="card milestones-card">
            {[
              { pct: 25, label: 'Quarter Way', icon: '🌱', reward: '1% cashback' },
              { pct: 50, label: 'Halfway!', icon: '🚀', reward: '2% cashback' },
              { pct: 75, label: 'Almost There', icon: '⭐', reward: '3% cashback' },
              { pct: 100, label: 'Goal Complete!', icon: '🏆', reward: 'Full reward' },
            ].map(m => {
              const done = progress >= m.pct;
              return (
                <div key={m.pct} className={`milestone-row ${done ? 'done' : ''}`}>
                  <div className={`milestone-circle ${done ? 'done' : m.pct === nextMilestone ? 'next' : ''}`}>
                    {done ? '✓' : m.icon}
                  </div>
                  <div className="milestone-info">
                     <div className="milestone-label">{m.label}</div>
                    <div className="milestone-reward">{m.reward}</div>
                  </div>
                  <div className="milestone-pct">{m.pct}%</div>
                </div>
              );
            })}
          </div>

          {/* Deposit */}
          {!isComplete && goal.status !== 'paused' && (
            <div className="deposit-section card" style={{ marginTop: 16 }}>
              <h4>Add Money 💰</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Monthly target: <strong>{formatCurrency(goal.monthlyAmount)}</strong>
              </p>
              <div className="deposit-quick">
                {[goal.monthlyAmount, Math.round(goal.monthlyAmount * 0.5), Math.round(goal.monthlyAmount * 1.5)].filter(v => v > 0).map(a => (
                  <button type="button" key={a} className={`deposit-quick-btn ${depositAmt === String(a) ? 'active' : ''}`}
                    onClick={() => onDepositAmtChange(String(a))} id={`quick-${a}`}>
                    ₹{a.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
              <input
                className="input"
                type="number"
                placeholder="Enter amount..."
                value={depositAmt}
                onChange={e => onDepositAmtChange(e.target.value)}
                id="detail-deposit-amt"
                min="1"
              />
              {depositImpact && (
                <div className={`detail-deposit-impact ${depositImpact.newPct >= 100 ? 'complete' : ''}`}>
                  {depositImpact.newPct >= 100
                    ? '🎉 This completes your goal!'
                    : `📈 Takes you to ${depositImpact.newPct}% (+${depositImpact.delta}%)`
                  }
                </div>
              )}
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={handleDeposit}
                disabled={!depositAmt || parseInt(depositAmt) < 1}
                id="detail-deposit-btn"
              >
                {depositImpact?.newPct >= 100
                  ? '🏆 Complete Goal!'
                  : `Add ${depositAmt ? formatCurrency(parseInt(depositAmt) || 0) : 'Amount'} →`
                }
              </button>
            </div>
          )}

          {/* Completion Card */}
          {isComplete && (
            <div className={`completion-reward-card card ${!isPurchased ? 'card-glow' : ''}`} style={{ marginTop: 16 }}>
              <div className="completion-top">{isPurchased ? '🛍️' : '🎉'}</div>
              <h3>{isPurchased ? 'Product Purchased!' : 'Goal Complete!'}</h3>
              <div className="reward-breakdown">
                <div className="reward-row">
                  <span>Original Price</span>
                  <span className="struck">{formatCurrency(goal.targetPrice)}</span>
                </div>
                <div className="reward-row">
                  <span>Your Reward</span>
                  <span style={{ color: 'var(--accent-start)' }}>- {formatCurrency(goal.reward.amount)}</span>
                </div>
                <div className="reward-row big">
                  <span>Final Price</span>
                  <span className="gradient-text">{formatCurrency(goal.targetPrice - goal.reward.amount)}</span>
                </div>
              </div>
              {!isPurchased && (
                <button type="button" className="btn btn-primary" style={{ width: '100%' }} id="unlock-purchase" onClick={() => {
                  purchaseGoal(goal.id);
                  alert('🛍 In a real integration, this redirects to the retailer. Simulated as Purchased!');
                }}>
                  🛍 Claim Your Reward & Buy →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
