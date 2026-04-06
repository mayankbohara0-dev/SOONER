import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { generateId, addMonths, today, ACHIEVEMENTS, calcProgress } from '../utils/helpers';
import {
  checkRateLimit, resetRateLimit, sanitizeInput,
  validateEmail, validatePassword, validateName,
  appendLedgerEntry, isDuplicateTransaction, getLedger,
  auditLog, detectSuspiciousActivity,
  startInactivityTimer, stopInactivityTimer,
} from '../utils/security';
import {
  supabase, sbSignUp, sbSignIn, sbSignOut,
  getProfile, upsertProfile,
  getGoals, createGoal as sbCreateGoal, updateGoal as sbUpdateGoal, deleteGoalById,
  addTransaction, logAuditEvent,
} from '../lib/supabase';

const AppContext = createContext(null);

// ─── map DB goal row → app shape ────────────────────────────
function rowToGoal(row) {
  return {
    id: row.id,
    userId: row.user_id,
    productName: row.product_name,
    productEmoji: row.product_emoji,
    productColor: row.product_color,
    targetPrice: Number(row.target_price),
    savedAmount: Number(row.saved_amount),
    monthlyAmount: Number(row.monthly_amount),
    timeline: row.timeline,
    monthsCompleted: row.months_completed,
    startDate: row.created_at?.slice(0, 10) || today(),
    endDate: addMonths(row.created_at?.slice(0, 10) || today(), row.timeline),
    priceLocked: row.price_locked,
    lockedPrice: Number(row.locked_price || row.target_price),
    status: row.status,
    reward: {
      pct: Number(row.reward_pct),
      amount: Number(row.reward_amount),
    },
    history: [],
  };
}

// ─── map app goal → DB shape ─────────────────────────────────
function goalToRow(goal, userId) {
  const rewardPct = Math.min(8, 2 + Math.floor(goal.timeline / 6));
  const rewardAmount = Math.round(goal.targetPrice * (rewardPct / 100));
  return {
    user_id: userId,
    product_name: goal.productName,
    product_emoji: goal.productEmoji,
    product_color: goal.productColor || '#0077FF',
    target_price: goal.targetPrice,
    saved_amount: 0,
    monthly_amount: Math.ceil(goal.targetPrice / goal.timeline),
    timeline: goal.timeline,
    months_completed: 0,
    price_locked: true,
    locked_price: goal.targetPrice,
    status: 'active',
    reward_pct: rewardPct,
    reward_amount: rewardAmount,
  };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const supabaseUid = useRef(null);
  const isFetchingData = useRef(null);
  // ══ Bootstrap: Native Event-Driven Auth ══════════════════════
  useEffect(() => {
    // Rely completely on Supabase's native event emitter to determine state,
    // handling slow cold-boots natively without relying on manual Promise timeouts.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (session?.user) {
            await loadUserData(session.user);
            setLoading(false); // <--- MUST drop spinner after data is loaded!
          } else {
            // User is legitimately logged out
            setUser(null);
            setGoals([]);
            setIsLoggedIn(false);
            supabaseUid.current = null;
            setLoading(false); // Drop spinner immediately
          }
        } 
        else if (event === 'SIGNED_OUT') {
          setUser(null);
          setGoals([]);
          setIsLoggedIn(false);
          supabaseUid.current = null;
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ══ Load profile + goals from Supabase ══════════════════════
  const loadUserData = (authUser) => {
    if (isFetchingData.current) return isFetchingData.current;

    isFetchingData.current = (async () => {
      supabaseUid.current = authUser.id;
      
      try {
        const [profileRes, goalsRes] = await Promise.all([
          getProfile(authUser.id),
          getGoals(authUser.id)
        ]);
        
        const profile = profileRes?.data;
        const goalRows = goalsRes?.data;

        const appUser = {
          id: authUser.id,
          email: authUser.email,
          name: profile?.name || authUser.user_metadata?.name || authUser.email.split('@')[0],
          avatar: (profile?.name || authUser.email).slice(0, 2).toUpperCase(),
          streak: profile?.streak || 0,
          consistencyScore: profile?.consistency_score || 0,
          achievements: profile?.achievements?.length
            ? profile.achievements
            : ACHIEVEMENTS.map(a => ({ ...a, unlocked: false, unlockedAt: null })),
        };
        
        setUser(appUser);
        setGoals((goalRows || []).map(rowToGoal));
        setIsLoggedIn(true);
      } catch (err) {
        console.error('loadUserData Failed:', err);
        // Do not kick the user out, but do unlock the mutex.
      } finally {
        setTimeout(() => { isFetchingData.current = null; }, 50);
      }
    })();

    return isFetchingData.current;
  };

  // ══ Inactivity logout ════════════════════════════════════════
  useEffect(() => {
    if (!isLoggedIn) return;
    startInactivityTimer(() => {
      addToast('👋 Logged out due to inactivity', 'info');
      logout();
    });
    return () => stopInactivityTimer();
  }, [isLoggedIn]);

  // ══ TOASTS ═══════════════════════════════════════════════════
  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ══ AUTH — Supabase ══════════════════════════════════════════

  const login = async (emailRaw, passwordRaw) => {
    const rl = checkRateLimit('login', 5, 60_000);
    if (!rl.allowed) return { success: false, error: `Too many attempts. Try again in ${rl.retryAfterSec}s.` };

    const email = sanitizeInput(emailRaw);
    if (!validateEmail(email)) return { success: false, error: 'Invalid email format.' };

    const { data, error } = await sbSignIn(email, passwordRaw);
    if (error) {
      auditLog('LOGIN_FAILED', { email, reason: error.message });
      if (error.message.includes('Invalid login')) return { success: false, error: 'Incorrect email or password.' };
      return { success: false, error: error.message };
    }

    resetRateLimit('login');
    await loadUserData(data.user);
    auditLog('LOGIN_SUCCESS', { userId: data.user.id, email });
    logAuditEvent(data.user.id, 'LOGIN_SUCCESS', { email });
    return { success: true };
  };

  const signup = async (nameRaw, emailRaw, passwordRaw) => {
    const rl = checkRateLimit('signup', 3, 60_000);
    if (!rl.allowed) return { success: false, error: `Too many signups. Try again in ${rl.retryAfterSec}s.` };

    const nameResult = validateName(nameRaw);
    if (!nameResult.valid) return { success: false, error: nameResult.error };

    const email = sanitizeInput(emailRaw);
    if (!validateEmail(email)) return { success: false, error: 'Invalid email format.' };

    const pwdResult = validatePassword(passwordRaw);
    if (!pwdResult.valid) return { success: false, error: pwdResult.errors[0] };

    const { data, error } = await sbSignUp(email, passwordRaw, nameResult.value);
    if (error) {
      if (error.message.includes('already registered')) return { success: false, error: 'An account with this email already exists.' };
      return { success: false, error: error.message };
    }

    // Profile row is auto-created by the DB trigger — just update the name
    if (data.user) {
      await upsertProfile({
        id: data.user.id,
        name: nameResult.value,
        email,
        achievements: ACHIEVEMENTS.map(a => ({ ...a, unlocked: false, unlockedAt: null })),
      });
      await loadUserData(data.user);
      logAuditEvent(data.user.id, 'SIGNUP_SUCCESS', { email });
    }

    return { success: true };
  };

  const logout = async () => {
    const uid = supabaseUid.current;
    auditLog('LOGOUT', { userId: uid });
    stopInactivityTimer();
    await sbSignOut();
    // onAuthStateChange handler clears state
  };

  // Demo login — still creates a real Supabase session
  const legacyLogin = async (name, email) => {
    const demoPassword = 'Demo@Sooner2024!';
    // Try sign in first; if fails, sign up
    const { error: signInErr } = await sbSignIn(email, demoPassword);
    if (signInErr) {
      await sbSignUp(email, demoPassword, name);
      await sbSignIn(email, demoPassword);
    }
  };

  const legacySignup = legacyLogin;

  // ══ GOALS ════════════════════════════════════════════════════

  const createGoal = async ({ product, targetPrice, timeline }) => {
    if (!user) return null;
    const uid = supabaseUid.current;
    const row = goalToRow({ productName: product.name, productEmoji: product.emoji, productColor: product.color, targetPrice, timeline }, uid);

    const { data, error } = await sbCreateGoal(row);
    if (error) { addToast('❌ Failed to create goal', 'error'); return null; }

    const goal = rowToGoal(data);
    setGoals(prev => {
      const next = [goal, ...prev];
      if (next.filter(g => g.status === 'active').length >= 3) unlockAchievementById('multi_goal');
      return next;
    });
    unlockAchievementById('first_goal');
    unlockAchievementById('price_locked');
    auditLog('GOAL_CREATED', { userId: uid, goalId: goal.id });
    logAuditEvent(uid, 'GOAL_CREATED', { goalId: goal.id, product: product.name });
    addToast(`🎯 Goal created! ${product.name} — Price locked at ₹${targetPrice.toLocaleString('en-IN')}`, 'success');
    return goal;
  };

  const makeDeposit = async (goalId, amount) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    const uid = supabaseUid.current;

    if (isDuplicateTransaction(amount, goalId)) {
      addToast('⚠️ Duplicate transaction blocked', 'error');
      return { success: false, error: 'Duplicate transaction' };
    }

    const rl = checkRateLimit(`deposit_${uid}`, 10, 60_000);
    if (!rl.allowed) {
      addToast(`⚠️ Slow down! Try again in ${rl.retryAfterSec}s`, 'error');
      return { success: false, error: 'Rate limited' };
    }

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return { success: false, error: 'Goal not found' };

    const newSaved = Math.min(goal.savedAmount + amount, goal.targetPrice);
    const progress = calcProgress(newSaved, goal.targetPrice);
    const oldProgress = calcProgress(goal.savedAmount, goal.targetPrice);
    const isComplete = newSaved >= goal.targetPrice;
    const newMonths = goal.monthsCompleted + 1;

    // Persist to Supabase
    const [{ error: goalErr }, { error: txErr }] = await Promise.all([
      sbUpdateGoal(goalId, {
        saved_amount: newSaved,
        months_completed: newMonths,
        status: isComplete ? 'completed' : 'active',
      }),
      addTransaction({
        user_id: uid,
        goal_id: goalId,
        type: 'deposit',
        amount,
        note: `Deposit for ${goal.productName}`,
        idempotency_key: `${uid}_${goalId}_${Date.now()}`,
      }),
    ]);

    if (goalErr) { addToast('❌ Deposit failed — please try again', 'error'); return { success: false }; }

    // Milestone toasts
    if (oldProgress < 25 && progress >= 25) { unlockAchievementById('milestone_25'); addToast('🌱 25% milestone! Cashback earned.', 'achievement'); }
    if (oldProgress < 50 && progress >= 50) { unlockAchievementById('milestone_50'); addToast('🚀 Halfway there! Bonus reward unlocked.', 'achievement'); }
    if (oldProgress < 75 && progress >= 75) { unlockAchievementById('milestone_75'); addToast('⭐ 75% done! Almost there!', 'achievement'); }
    if (isComplete) { unlockAchievementById('goal_complete'); addToast(`🏆 Goal complete! ${goal.productName} is yours!`, 'achievement'); }

    setGoals(prev => prev.map(g => g.id !== goalId ? g : {
      ...g, savedAmount: newSaved, monthsCompleted: newMonths,
      status: isComplete ? 'completed' : 'active',
      history: [...g.history, amount],
    }));

    unlockAchievementById('first_deposit');
    updateStreak();
    logAuditEvent(uid, 'DEPOSIT', { goalId, amount, progress });
    appendLedgerEntry({ type: 'DEPOSIT', userId: uid, goalId, amount, progress, status: 'success' });
    addToast(`Nice. You're closer 🔥 (₹${amount.toLocaleString('en-IN')} added)`, 'success');
    return { success: true };
  };

  const pauseGoal = async (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newStatus = goal.status === 'paused' ? 'active' : 'paused';
    await sbUpdateGoal(goalId, { status: newStatus });
    setGoals(prev => prev.map(g => g.id !== goalId ? g : { ...g, status: newStatus }));
    addToast(newStatus === 'paused' ? '⏸ Goal paused' : '▶ Goal resumed', 'info');
  };

  const deleteGoal = async (goalId) => {
    await deleteGoalById(goalId);
    setGoals(prev => prev.filter(g => g.id !== goalId));
    addToast('🗑 Goal deleted', 'error');
  };

  const purchaseGoal = async (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const uid = supabaseUid.current;

    await Promise.all([
      sbUpdateGoal(goalId, { status: 'purchased' }),
      addTransaction({ user_id: uid, goal_id: goalId, type: 'purchase', amount: goal.targetPrice, note: `Purchase: ${goal.productName}` }),
    ]);

    setGoals(prev => prev.map(g => g.id !== goalId ? g : { ...g, status: 'purchased' }));
    logAuditEvent(uid, 'PURCHASE', { goalId, productName: goal.productName });
    appendLedgerEntry({ type: 'PURCHASE', userId: uid, goalId, productName: goal.productName, rewardAmount: goal.reward.amount, status: 'success' });
    addToast(`🎉 Purchase Unlocked! You saved ₹${goal.reward.amount.toLocaleString('en-IN')}!`, 'success', 6000);
  };

  // ══ ACHIEVEMENTS ═════════════════════════════════════════════

  const unlockAchievementById = useCallback((id) => {
    setUser(prev => {
      if (!prev) return prev;
      const alreadyUnlocked = prev.achievements?.find(a => a.id === id)?.unlocked;
      if (alreadyUnlocked) return prev;
      const achievements = (prev.achievements || ACHIEVEMENTS).map(a =>
        a.id === id ? { ...a, unlocked: true, unlockedAt: today() } : a
      );
      const updated = { ...prev, achievements };
      // Persist achievement to Supabase (non-blocking)
      if (supabaseUid.current) {
        upsertProfile({ id: supabaseUid.current, name: prev.name, email: prev.email, achievements });
      }
      return updated;
    });
  }, []);

  const updateStreak = useCallback(() => {
    setUser(prev => {
      if (!prev) return prev;
      const newStreak = (prev.streak || 0) + 1;
      const newScore = Math.min(100, (prev.consistencyScore || 0) + 2);
      if (newStreak === 7)  { unlockAchievementById('streak_7');  addToast('🔥 7-day streak! Week Warrior!', 'achievement'); }
      if (newStreak === 30) { unlockAchievementById('streak_30'); addToast('⚡ 30-day streak! Month Master!', 'achievement'); }
      const updated = { ...prev, streak: newStreak, consistencyScore: newScore };
      if (supabaseUid.current) {
        upsertProfile({ id: supabaseUid.current, name: prev.name, email: prev.email, streak: newStreak, consistency_score: newScore });
      }
      return updated;
    });
  }, [unlockAchievementById]);

  // ══ COMPUTED ═════════════════════════════════════════════════
  const totalSaved = goals
    .filter(g => g.status !== 'completed' && g.status !== 'purchased')
    .reduce((s, g) => s + g.savedAmount, 0);
  const activeGoals    = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed' || g.status === 'purchased').length;

  return (
    <AppContext.Provider value={{
      user, isLoggedIn, loading,
      login, signup, logout, legacyLogin, legacySignup,
      goals, createGoal, makeDeposit, pauseGoal, deleteGoal, purchaseGoal,
      totalSaved, activeGoals, completedGoals,
      toasts, addToast, removeToast,
      getLedger,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
