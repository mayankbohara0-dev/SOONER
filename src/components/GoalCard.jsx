import { Link } from 'react-router-dom';
import { formatCurrency, calcProgress } from '../utils/helpers';
import './GoalCard.css';

function getMotivation(goal, progress) {
  const left = Math.max(0, goal.timeline - goal.monthsCompleted);
  if (progress >= 100) return { text: 'Goal complete! Claim your reward.', emoji: '🎉' };
  if (progress >= 75)  return { text: `${left} payments to go — almost there!`, emoji: '🏁' };
  if (progress >= 50)  return { text: `Halfway! ${left} more months to own it`, emoji: '🚀' };
  if (progress >= 25)  return { text: `${progress}% done. Price locked, you're safe`, emoji: '🔐' };
  return { text: `${left} payments away. Every rupee counts`, emoji: '💪' };
}

export default function GoalCard({ goal, onDeposit, onPurchase }) {
  const progress = calcProgress(goal.savedAmount, goal.targetPrice);
  const isComplete = goal.status === 'completed' || goal.status === 'purchased';
  const isPurchased = goal.status === 'purchased';
  const motivation = getMotivation(goal, progress);
  const paymentsLeft = Math.max(0, goal.timeline - goal.monthsCompleted);

  const statusClass  = isPurchased ? 'purchased' : isComplete ? 'complete' : goal.status === 'paused' ? 'paused' : 'active';
  const statusLabel  = isPurchased ? '🎉 Owned' : isComplete ? '✅ Ready to claim' : goal.status === 'paused' ? '⏸ Paused' : '🟢 Saving';

  return (
    <div className={`goal-card ${isComplete ? 'goal-card--complete' : ''} ${isPurchased ? 'goal-card--purchased' : ''}`}>
      <Link to={`/goal/${goal.id}`} className="goal-card-link">

        {/* ===== COMPACT HEADER ===== */}
        <div className="goal-card-header" style={{ '--product-color': goal.productColor || '#0077FF' }}>
          {/* Left: emoji bubble */}
          <div className="goal-card-emoji-bubble">
            <span className="goal-card-emoji">{goal.productEmoji}</span>
          </div>

          {/* Center: info */}
          <div className="goal-card-header-info">
            <div className="goal-card-name">{goal.productName}</div>
            {goal.priceLocked && !isPurchased && (
              <div className="goal-card-lock-row">
                <span className="lock-icon">🔐</span>
                <span className="lock-text">Locked at {formatCurrency(goal.lockedPrice)}</span>
              </div>
            )}
          </div>

          {/* Right: status pill */}
          <div className={`goal-card-status-pill ${statusClass}`}>{statusLabel}</div>
        </div>

        {/* ===== MOTIVATION LINE ===== */}
        <div className="goal-card-motivation">
          <span className="motivation-emoji">{motivation.emoji}</span>
          <span>{motivation.text}</span>
        </div>

        {/* ===== PROGRESS ===== */}
        <div className="goal-card-progress-wrap">
          <div className="goal-card-progress-track">
            <div className="goal-card-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="goal-card-progress-row">
            <span className="goal-card-saved">{formatCurrency(goal.savedAmount)}</span>
            <span className="goal-card-pct">{progress}%</span>
            <span className="goal-card-target">{formatCurrency(goal.targetPrice)}</span>
          </div>
        </div>

        {/* ===== STATS ROW ===== */}
        {!isPurchased && (
          <div className="goal-card-stats">
            <div className="goal-card-stat">
              <span className="stat-val">{formatCurrency(goal.monthlyAmount)}</span>
              <span className="stat-lbl">/month</span>
            </div>
            <div className="goal-card-stat-divider" />
            <div className="goal-card-stat">
              <span className="stat-val">{goal.reward.pct}%</span>
              <span className="stat-lbl">cashback</span>
            </div>
            <div className="goal-card-stat-divider" />
            <div className="goal-card-stat">
              <span className="stat-val">{paymentsLeft}</span>
              <span className="stat-lbl">months left</span>
            </div>
          </div>
        )}
      </Link>

      {/* ===== ACTION FOOTER ===== */}
      {!isPurchased && (
        <div className="goal-card-footer">
          {isComplete ? (
            <button
              className="btn btn-primary goal-card-action-btn complete-btn"
              onClick={(e) => { e.preventDefault(); onPurchase(goal); }}
            >
              🛍 Claim {formatCurrency(goal.reward.amount)} reward →
            </button>
          ) : goal.status === 'active' ? (
            <button
              className="goal-card-action-btn deposit-btn"
              onClick={(e) => { e.preventDefault(); onDeposit(goal); }}
            >
              <span className="deposit-btn-icon">＋</span>
              Add {formatCurrency(goal.monthlyAmount)}
            </button>
          ) : (
            <div className="goal-card-paused-note">Goal paused · tap to resume</div>
          )}
        </div>
      )}

      {isPurchased && (
        <div className="goal-card-purchased-banner">
          🎉 Owned · You saved {formatCurrency(goal.reward.amount)}
        </div>
      )}
    </div>
  );
}
