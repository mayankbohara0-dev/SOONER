import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import GoalCard from '../components/GoalCard';
import { calcProgress } from '../utils/helpers';
import { isDuplicateTransaction } from '../utils/security';

describe('Phase 2 & 6: Functional & Boundary Conditions', () => {
  it('should calculate valid progress constraints', () => {
    // Tests functional boundaries for financial math
    const progressZero = calcProgress(0, 1000);
    expect(progressZero).toBe(0);

    const progressMid = calcProgress(500, 1000);
    expect(progressMid).toBe(50);

    // Bounding beyond 100%
    const progressExceed = calcProgress(1200, 1000);
    expect(progressExceed).toBe(100);
  });
});

describe('Phase 3: UI & User Flow Testing', () => {
  it('renders an active GoalCard correctly and handles deposits', () => {
    const mockGoal = {
      id: 'g1',
      productName: 'iPhone 15',
      productEmoji: '📱',
      targetPrice: 70000,
      savedAmount: 35000,
      timeline: 10,
      monthsCompleted: 5,
      monthlyAmount: 7000,
      status: 'active',
      reward: { pct: 5, amount: 3500 }
    };
    
    const onDepositMock = vi.fn();

    render(
      <BrowserRouter>
        <GoalCard goal={mockGoal} onDeposit={onDepositMock} onPurchase={vi.fn()} />
      </BrowserRouter>
    );
    
    // Phase 3 UI Verification
    expect(screen.getByText('iPhone 15')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
    
    // Simulate User Flow Action
    const depositBtn = screen.getByText(/Add/i);
    fireEvent.click(depositBtn);
    expect(onDepositMock).toHaveBeenCalledWith(mockGoal);
    expect(onDepositMock).toHaveBeenCalledTimes(1);
  });
  
  it('renders completed state properly and shows claim button', () => {
    const completedGoal = {
      id: 'g2',
      productName: 'MacBook',
      productEmoji: '💻',
      targetPrice: 100000,
      savedAmount: 100000,
      timeline: 10,
      monthsCompleted: 10,
      monthlyAmount: 10000,
      status: 'completed',
      reward: { pct: 5, amount: 5000 }
    };

    render(
      <BrowserRouter>
        <GoalCard goal={completedGoal} onDeposit={vi.fn()} onPurchase={vi.fn()} />
      </BrowserRouter>
    );

    // Validate that the "Add" button is replaced by "Claim"
    expect(screen.queryByText(/Add/i)).toBeNull();
    expect(screen.getByRole('button', { name: /Claim/i })).toBeTruthy();
  });
});

describe('Phase 8 & 10: Concurrency & Idempotency', () => {
  it('should utilize isDuplicateTransaction to block concurrent double-spends', () => {
    // Phase 8: Async transaction boundary checks
    const goalId = 'test-goal';
    const amount = 5000;
    
    const firstAttempt = isDuplicateTransaction(amount, goalId, 5000);
    expect(firstAttempt).toBe(false); // First one goes through

    const duplicateAttempt = isDuplicateTransaction(amount, goalId, 5000);
    expect(duplicateAttempt).toBe(true); // Second one is identically matched in window and blocked
  });
});
