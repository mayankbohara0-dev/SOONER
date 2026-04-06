// ============================================
// SOONER — Utility Helpers
// ============================================

export const PRODUCTS = [
  {
    id: 'iphone16',
    name: 'iPhone 16 Pro Max',
    category: 'Smartphones',
    price: 134900,
    emoji: '📱',
    color: '#2196F3',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
  },
  {
    id: 'macbook',
    name: 'MacBook Pro 14"',
    category: 'Laptops',
    price: 199900,
    emoji: '💻',
    color: '#9C27B0',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
  },
  {
    id: 'ps5',
    name: 'PlayStation 5',
    category: 'Gaming',
    price: 54990,
    emoji: '🎮',
    color: '#3F51B5',
    image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&q=80',
  },
  {
    id: 'airpods',
    name: 'AirPods Pro 2',
    category: 'Audio',
    price: 24900,
    emoji: '🎧',
    color: '#00BCD4',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80',
  },
  {
    id: 'jordan1',
    name: 'Air Jordan 1 Retro',
    category: 'Sneakers',
    price: 18000,
    emoji: '👟',
    color: '#FF5722',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
  },
  {
    id: 're_classic',
    name: 'Royal Enfield Classic 350',
    category: 'Bikes',
    price: 195000,
    emoji: '🏍️',
    color: '#795548',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  },
  {
    id: 'dyson',
    name: 'Dyson Airwrap',
    category: 'Lifestyle',
    price: 45900,
    emoji: '💨',
    color: '#E91E63',
    image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&q=80',
  },
  {
    id: 'gopro',
    name: 'GoPro Hero 13',
    category: 'Cameras',
    price: 38000,
    emoji: '📸',
    color: '#009688',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80',
  },
  {
    id: 'samsung_tv',
    name: 'Samsung 65" QLED TV',
    category: 'Electronics',
    price: 129900,
    emoji: '📺',
    color: '#607D8B',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80',
  },
  {
    id: 'watch_ultra',
    name: 'Apple Watch Ultra 2',
    category: 'Wearables',
    price: 89900,
    emoji: '⌚',
    color: '#FF9800',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80',
  },
];

export const TIMELINES = [3, 6, 9, 12, 18, 24];

export const ACHIEVEMENTS = [
  { id: 'first_goal', title: 'Dreamer', desc: 'Created your first goal', icon: '🎯', unlocked: false },
  { id: 'first_deposit', title: 'First Step', desc: 'Made your first deposit', icon: '💰', unlocked: false },
  { id: 'streak_7', title: 'Week Warrior', desc: '7-day saving streak', icon: '🔥', unlocked: false },
  { id: 'streak_30', title: 'Month Master', desc: '30-day saving streak', icon: '⚡', unlocked: false },
  { id: 'milestone_25', title: 'Quarter Done', desc: 'Reached 25% on a goal', icon: '🌱', unlocked: false },
  { id: 'milestone_50', title: 'Halfway Hero', desc: 'Reached 50% on a goal', icon: '🚀', unlocked: false },
  { id: 'milestone_75', title: 'Almost There', desc: 'Reached 75% on a goal', icon: '⭐', unlocked: false },
  { id: 'goal_complete', title: 'Dream Achieved', desc: 'Completed a goal!', icon: '🏆', unlocked: false },
  { id: 'price_locked', title: 'Price Guardian', desc: 'Locked a product price', icon: '🔐', unlocked: false },
  { id: 'multi_goal', title: 'Multi-Dreamer', desc: 'Running 3+ active goals', icon: '✨', unlocked: false },
];

// ==================== FORMAT HELPERS ====================
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

// ==================== CALC HELPERS ====================
export const calcMonthly = (price, months) => Math.ceil(price / months);

export const calcProgress = (saved, target) => Math.min(100, Math.round((saved / target) * 100));

export const calcMonthsLeft = (target, saved, monthly) => {
  if (monthly === 0) return 0;
  const remaining = target - saved;
  return Math.ceil(remaining / monthly);
};

export const calcReward = (price, months) => {
  // Reward: 2-8% depending on timeline length
  const pct = Math.min(8, 2 + Math.floor(months / 6));
  return { pct, amount: Math.round(price * (pct / 100)) };
};

export const calcAITip = (goal) => {
  const { targetPrice, savedAmount, monthlyAmount, timeline } = goal;
  const remaining = targetPrice - savedAmount;
  const extraMonthly = Math.ceil(monthlyAmount * 0.2);
  const boosted = monthlyAmount + extraMonthly;
  const normalMonths = Math.ceil(remaining / monthlyAmount);
  const boostedMonths = Math.ceil(remaining / boosted);
  const saved = normalMonths - boostedMonths;
  if (saved >= 1) {
    return `💡 Save ${formatCurrency(extraMonthly)} more/month to finish **${saved} month${saved > 1 ? 's' : ''} earlier!**`;
  }
  return `🔥 You're on fire! Keep up this pace to stay on track.`;
};

// ==================== DATE HELPERS ====================
export const addMonths = (date, n) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d.toISOString();
};

export const today = () => new Date().toISOString();

export const generateId = () => Math.random().toString(36).substr(2, 9);

// ==================== MILESTONE CHECK ====================
export const getMilestones = (progress) => {
  const milestones = [
    { pct: 25, label: 'Quarter Way', icon: '🌱', reward: '1% cashback' },
    { pct: 50, label: 'Halfway!', icon: '🚀', reward: '2% cashback' },
    { pct: 75, label: 'Almost There!', icon: '⭐', reward: '3% cashback' },
    { pct: 100, label: 'Goal Complete!', icon: '🏆', reward: 'Full reward unlocked' },
  ];
  return milestones.filter(m => progress >= m.pct);
};

export const getNextMilestone = (progress) => {
  const milestones = [25, 50, 75, 100];
  return milestones.find(m => m > progress) || 100;
};
