import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const EXAMPLES = [
  { emoji: '📱', name: 'iPhone 16 Pro Max', price: 134900, months: 12 },
  { emoji: '💻', name: 'MacBook Pro 14"', price: 199900, months: 18 },
  { emoji: '🎮', name: 'PlayStation 5', price: 54990, months: 6 },
  { emoji: '👟', name: 'Air Jordan 1', price: 18000, months: 3 },
  { emoji: '⌚', name: 'Apple Watch Ultra 2', price: 89900, months: 9 },
];

const TESTIMONIALS = [
  { text: "Got my PS5 three months early because of the Sooner cashback. Best decision ever.", author: "Rahul M.", role: "Student, Delhi" },
  { text: "I locked in the MacBook price in January — avoided the ₹8k hike in March. Genius.", author: "Sneha P.", role: "Designer, Bangalore" },
  { text: "The streak system actually made me save every month. Feels like Duolingo but for money.", author: "Karan T.", role: "Engineer, Mumbai" },
  { text: "Finally bought a premium watch without EMIs. Pure ownership from day one.", author: "Anjali S.", role: "Doctor, Pune" },
];

const PRODUCTS_TICKER = [
  '📱 iPhone 16 Pro Max', '💻 MacBook Pro', '🎮 PlayStation 5', '🎧 AirPods Pro',
  '👟 Air Jordan 1', '🏍️ Royal Enfield', '⌚ Apple Watch Ultra', '📺 Samsung QLED',
  '💨 Dyson Airwrap', '📸 GoPro Hero 13',
];

const PILLARS = [
  {
    icon: '🔐',
    title: 'Price Lock',
    desc: 'Lock today\'s price the moment you start saving. Price hike? Not your problem.',
    highlight: 'Beat inflation',
  },
  {
    icon: '🧠',
    title: 'Smart Plan',
    desc: 'We calculate the ideal monthly amount. You can pause, switch, or unlock early — always your choice.',
    highlight: 'AI-powered',
  },
  {
    icon: '🎁',
    title: 'Earn Rewards',
    desc: 'Hit milestones, unlock cashback. The longer you save, the more you earn — up to 8% back.',
    highlight: 'Up to 8% cashback',
  },
];

const SOCIAL_PROOF = [
  { count: '12,400+', label: 'Dreamers saving' },
  { count: '₹8.2 Cr', label: 'Saved collectively' },
  { count: '3,800+', label: 'Goals achieved' },
];

function emotionalText(months, monthly) {
  if (months <= 3) return `Just ${months} months to own it — that's ${monthly.toLocaleString('en-IN')}/month`;
  if (months <= 6) return `In ${months} months, this is yours. No EMI. No regret.`;
  return `${months} months of smart saving → own it outright, cheaper.`;
}

export default function Landing() {
  const [targetAmount, setTargetAmount] = useState(134900);
  const [months, setMonths] = useState(12);
  const [activeExample, setActiveExample] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const monthlySave = Math.round(targetAmount / months);
  const rewardPct = Math.min(8, 2 + Math.floor(months / 6));
  const totalRewards = Math.round(targetAmount * (rewardPct / 100));
  const finalPrice = targetAmount - totalRewards;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const selectExample = (ex) => {
    setActiveExample(EXAMPLES.indexOf(ex));
    setTargetAmount(ex.price);
    setMonths(ex.months);
  };

  return (
    <div className="landing">
      {/* ===== STICKY NAV ===== */}
      <nav className={`landing-sticky-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-brand">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10V90M10 50H90M22 22L78 78M22 78L78 22" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <span>SOONER</span>
        </div>
        <div className="nav-right">
          <Link to="/auth?mode=login" className="nav-login-link">Sign in</Link>
          <Link to="/auth?mode=signup" className="btn btn-white btn-sm nav-cta">Start Your Goal →</Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content animate-fade-in">
          <div className="hero-text-block">
            <div className="hero-pill">🔥 3,800+ goals achieved this month</div>
            <h1 className="hero-title">
              Lock your dream.<br />
              <span className="hero-title-accent">Own it sooner.</span>
            </h1>
            <p className="hero-sub">
              Pick what you want. Lock today's price. Save monthly and earn rewards.
              No EMIs. No debt. No regret.
            </p>
            <div className="hero-ctas">
              <Link to="/auth?mode=signup" className="btn btn-white btn-lg hero-cta-btn">
                Start Your First Goal →
              </Link>
              <Link to="/auth?mode=login" className="auth-link-text">
                Already saving? Sign in
              </Link>
            </div>
            <div className="hero-trust-row">
              <span>🔐 Bank-grade security</span>
              <span>💸 Withdraw anytime</span>
              <span>✅ No hidden fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LIGHT ZONE ===== */}
      <div className="landing-light">
        {/* Ticker */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {PRODUCTS_TICKER.map((item, i) => (
              <span className="ticker-item" key={`t1-${i}`}>{item}</span>
            ))}
            {PRODUCTS_TICKER.map((item, i) => (
              <span className="ticker-item" key={`t2-${i}`}>{item}</span>
            ))}
          </div>
        </div>

        {/* ===== 3 PILLARS ===== */}
        <section className="pillars-section">
          <div className="pillars-label">The SOONER System</div>
          <h2 className="section-title">Not just savings.<br />A system that wins.</h2>
          <p className="section-sub">
            Three pillars that turn "I wish I could afford this" into "I own this."
          </p>
          <div className="pillars-grid">
            {PILLARS.map((p, i) => (
              <div className="pillar-card" key={i}>
                <div className="pillar-icon">{p.icon}</div>
                <div className="pillar-highlight">{p.highlight}</div>
                <h3 className="pillar-title">{p.title}</h3>
                <p className="pillar-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== SAVINGS CALCULATOR ===== */}
        <section className="calculator-section">
          <div className="pillars-label">Interactive Calculator</div>
          <h2 className="section-title">See the math. Feel the difference.</h2>
          <p className="section-sub">
            Pick a real example, or drag the sliders. Watch how saving smart beats paying dumb.
          </p>

          {/* Quick examples */}
          <div className="example-chips">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex.name}
                className={`example-chip ${activeExample === i ? 'active' : ''}`}
                onClick={() => selectExample(ex)}
              >
                {ex.emoji} {ex.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="calculator-card">
            <div className="calc-inputs">
              <div className="calc-group">
                <label>Target Amount: <span>₹{targetAmount.toLocaleString('en-IN')}</span></label>
                <input
                  type="range"
                  min="10000"
                  max="250000"
                  step="5000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                />
              </div>
              <div className="calc-group">
                <label>Timeline: <span>{months} Months</span></label>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Emotional summary */}
            <div className="calc-emotional">
              💡 {emotionalText(months, monthlySave)}
            </div>

            <div className="calc-results">
              <div className="result-box">
                <span className="result-label">Monthly Save</span>
                <span className="result-value">₹{monthlySave.toLocaleString('en-IN')}<small>/mo</small></span>
              </div>
              <div className="result-box glow-box">
                <span className="result-label">Cashback Earned</span>
                <span className="result-value">₹{totalRewards.toLocaleString('en-IN')}</span>
              </div>
              <div className="result-box win-box">
                <span className="result-label">You Pay</span>
                <span className="result-value">₹{finalPrice.toLocaleString('en-IN')}</span>
                <span className="result-sub">instead of ₹{targetAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="calc-cta-row">
              <Link to="/auth?mode=signup" className="btn btn-primary">
                Lock This Price Now →
              </Link>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="timeline-section">
          <div className="pillars-label">How it Works</div>
          <h2 className="section-title">From "I want this" to "I own this."</h2>
          <p className="section-sub">Three steps. No debt. No stress.</p>

          <div className="timeline-grid">
            <div className="timeline-step">
              <div className="step-number">1</div>
              <div className="step-icon">💰</div>
              <h3 className="feature-title">Save Monthly</h3>
              <p className="feature-desc">We suggest the ideal amount. Pause anytime. Pay more to finish faster. Your money, your pace.</p>
            </div>
            <div className="timeline-step">
              <div className="step-number">2</div>
              <div className="step-icon">🎯</div>
              <h3 className="feature-title">Pick Your Goal</h3>
              <p className="feature-desc">Choose any product. The price gets locked the moment you start — even if it goes up tomorrow.</p>
            </div>
            <div className="timeline-step">
              <div className="step-number">3</div>
              <div className="step-icon">🎁</div>
              <h3 className="feature-title">Unlock & Own</h3>
              <p className="feature-desc">Hit your target, unlock up to 8% cashback, and buy the product at the price you locked. Cheaper than retail.</p>
            </div>
          </div>
        </section>

        {/* ===== TRUST SECTION ===== */}
        <section className="trust-section">
          <div className="trust-inner">
            <div className="trust-text">
              <div className="pillars-label">Security First</div>
              <h2 className="section-title" style={{ color: '#fff' }}>Your money is<br />always safe.</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 360, lineHeight: 1.7 }}>
                SOONER uses bank-grade security — the same standards as Google Pay and CRED.
                Your savings are yours, always.
              </p>
              <Link to="/auth?mode=signup" className="btn btn-white" style={{ marginTop: 24, display: 'inline-flex' }}>
                Start Saving Securely →
              </Link>
            </div>
            <div className="trust-badges-grid">
              {[
                { icon: '🔐', title: 'AES-256 Encrypted', desc: 'Bank-grade data protection' },
                { icon: '💸', title: 'Withdraw Anytime', desc: 'Your money, your control' },
                { icon: '📜', title: 'Transparent Ledger', desc: 'Every transaction logged' },
                { icon: '✅', title: 'No Hidden Fees', desc: 'What you see is what you pay' },
              ].map(b => (
                <div className="trust-badge-card" key={b.title}>
                  <div className="trust-badge-icon">{b.icon}</div>
                  <div>
                    <div className="trust-badge-title">{b.title}</div>
                    <div className="trust-badge-desc">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="testimonial-section">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="pillars-label">Real People</div>
            <h2 className="section-title">They saved. They own it.</h2>
          </div>
          <div className="testimonial-track">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div className="testimonial-card" key={i}>
                <div className="testimonial-stars">★★★★★</div>
                <p>"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.author[0]}</div>
                  <div>
                    <div className="testimonial-name">{t.author}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== SOCIAL PROOF ===== */}
        <section className="social-proof-section">
          <div className="social-grid">
            {SOCIAL_PROOF.map((proof, i) => (
              <div className="proof-card" key={i}>
                <div className="proof-count">{proof.count}</div>
                <div className="proof-label">{proof.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="final-cta-section">
          <div className="cta-card">
            <div className="cta-pill">Start free. No credit card.</div>
            <h2>The smartest way to buy<br />anything expensive.</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 420, margin: '12px auto 32px' }}>
              12,400+ people are already saving smarter. Lock your price today — before it goes up.
            </p>
            <Link to="/auth?mode=signup" className="btn btn-primary btn-lg">
              Lock Your Price Now →
            </Link>
            <div className="cta-trust">
              🔐 Encrypted &nbsp;·&nbsp; 💸 Withdraw anytime &nbsp;·&nbsp; ✅ No fees
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
