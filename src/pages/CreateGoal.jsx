import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PRODUCTS, TIMELINES, formatCurrency, calcMonthly, calcReward } from '../utils/helpers';
import './CreateGoal.css';

const CATEGORIES = ['All', ...new Set(PRODUCTS.map(p => p.category))];

export default function CreateGoal() {
  const { createGoal } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [customPrice, setCustomPrice] = useState('');
  const [timeline, setTimeline] = useState(6);
  const [customProduct, setCustomProduct] = useState('');
  const [customProductPrice, setCustomProductPrice] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [fetchingLive, setFetchingLive] = useState(false);

  const filtered = useMemo(() => PRODUCTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCat;
  }), [search, categoryFilter]);

  const targetPrice = selected
    ? (customPrice ? parseInt(customPrice) || 0 : selected.price)
    : 0;

  const monthly = targetPrice ? calcMonthly(targetPrice, timeline) : 0;
  const reward = targetPrice ? calcReward(targetPrice, timeline) : { pct: 0, amount: 0 };

  const handleSelectProduct = (product) => {
    setSelected(product);
    setCustomPrice('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCustom = () => {
    if (!customProduct.trim() || !customProductPrice) return;
    const product = {
      id: 'custom_' + Date.now(),
      name: customProduct.trim(),
      emoji: '🎯',
      color: '#00FF94',
      price: parseInt(customProductPrice) || 0,
      category: 'Custom',
    };
    setSelected(product);
    setCustomPrice(customProductPrice);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFetchLivePrice = async () => {
    if (!liveUrl) return;
    setFetchingLive(true);
    
    let finalTitle = 'Custom Product';
    let finalPrice = 0;
    let scrapeSuccess = false;

    // 1. Multi-Proxy Waterfall: Amazon aggressively blocks IPs. 
    // We cycle through 4 distinct proxy architectures until one bypasses the firewall.
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(liveUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(liveUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(liveUrl)}`,
      `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(liveUrl)}`
    ];

    for (const proxy of proxies) {
      if (scrapeSuccess) break;
      try {
        const res = await fetch(proxy, { headers: { 'Accept': 'text/html' }});
        if (!res.ok) continue;
        
        const html = await res.text();
        
        // Check if Amazon intercepted the proxy
        if (!html || html.includes('captcha') || html.includes('Robot Check') || html.includes('Enter the characters you see below')) {
          continue; // Blocked. Try next proxy.
        }

        // --- SUCCESS! Extract Data ---
        // Parse Title
        const titleMatch = html.match(/<title>(.*?)<\/title>/) || html.match(/<meta property="og:title" content="(.*?)"/);
        if (titleMatch) {
          finalTitle = titleMatch[1].replace(/Amazon\.in: Buy |Amazon\.in: | - online at best prices.*|Buy .*? Online at Best Prices.*/ig, '').trim();
        }

        // Parse Price
        const amazonPriceMatch = html.match(/class="a-price-whole">([^<]+)<\/span>/);
        if (amazonPriceMatch) {
          finalPrice = parseInt(amazonPriceMatch[1].replace(/,/g, ''));
        } else {
          const inrMatch = html.match(/₹([0-9,]+)/);
          if (inrMatch) finalPrice = parseInt(inrMatch[1].replace(/,/g, ''));
        }

        if (finalPrice > 0 && finalTitle !== 'Custom Product') {
          scrapeSuccess = true;
        }

      } catch (err) {
        // Network error for this proxy, continue to next
        continue;
      }
    }

    // 2. Failsafe Fallback if ALL 4 Proxies are blocked by Amazon
    if (!scrapeSuccess) {
      console.warn("All 4 scraping proxies were blocked by Amazon firewalls. Falling back to Unblockable URL Extraction.");
      alert("Amazon blocked our auto-scanners! We extracted the product name for you, but please enter the exact price safely below.");
      try {
        const urlObj = new URL(liveUrl);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        let rawProductName = pathSegments[0]; 
        if (rawProductName && rawProductName.length > 3) {
          finalTitle = rawProductName.replace(/-|\+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
      } catch (e) {
        // Ignored
      }
      finalPrice = ''; // Leave blank for the user to type
    }

    const realProduct = {
      id: 'live_' + Date.now(),
      name: finalTitle.length > 50 ? finalTitle.substring(0, 47) + '...' : finalTitle,
      emoji: '🛒',
      color: '#111111',
      price: finalPrice > 500000 ? 500000 : finalPrice,
      category: 'Live Pricing',
    };
    
    setSelected(realProduct);
    setCustomPrice(finalPrice.toString());
    setFetchingLive(false);
    setLiveUrl('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreate = async () => {
    if (!targetPrice || targetPrice < 100) return;
    const product = selected || { id: 'custom', name: customProduct, emoji: '🎯', color: '#00FF94' };
    const goal = await createGoal({ product, targetPrice, timeline });
    if (goal && goal.id) {
      navigate(`/goal/${goal.id}`);
    }
  };

  const goBack = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page page-content">
      <div className="create-goal-wrap">
        {/* Header */}
        <div className="create-header animate-fade-in">
          <h1>Create a Goal</h1>
          <p>Pick your dream product and set your saving plan</p>
        </div>

        {/* Step indicator */}
        <div className="step-indicator animate-fade-in delay-1">
          <div className="step-line" />
          {[
            { n: 1, label: 'Choose Product' },
            { n: 2, label: 'Set Timeline' },
            { n: 3, label: 'Review' },
          ].map(({ n, label }) => (
            <div key={n} className={`step-item`}>
              <div className={`step-dot ${step >= n ? 'active' : ''} ${step > n ? 'done' : ''}`}>
                {step > n ? '✓' : n}
              </div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>

        {/* ===== STEP 1: Product Selection ===== */}
        {step === 1 && (
          <div className="step-panel animate-fade-in">
            <h3 className="step-title">What do you want to save for?</h3>

            {/* Live Pricing Flow */}
            <div className="live-pricing-box" style={{ 
              background: 'linear-gradient(135deg, rgba(0,119,255,0.05), rgba(0,229,255,0.05))', 
              padding: '28px', 
              borderRadius: '24px', 
              border: '1.5px solid rgba(0,119,255,0.2)', 
              marginBottom: '32px',
              boxShadow: '0 16px 32px rgba(0,119,255,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.8rem' }}>✨</span>
                <label className="custom-label" style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  Auto-Fetch Live Price
                </label>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.6 }}>
                Paste any <strong>Amazon</strong> or <strong>Flipkart</strong> URL. Our AI engines will instantly extract the live market price and lock it in.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <input 
                  type="url" 
                  className="input" 
                  placeholder="Paste URL here..." 
                  value={liveUrl}
                  onChange={e => setLiveUrl(e.target.value)}
                  style={{ flex: 1, padding: '16px 20px', borderRadius: '16px', fontSize: '0.95rem', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.02)' }}
                />
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleFetchLivePrice}
                  disabled={!liveUrl || fetchingLive}
                  style={{ whiteSpace: 'nowrap', padding: '0 28px', borderRadius: '16px', fontWeight: 800 }}
                >
                  {fetchingLive ? 'Analyzing...' : 'Fetch Price →'}
                </button>
              </div>
              {fetchingLive && (
                <div style={{ marginTop: '16px', fontSize: '0.78rem', color: '#0077FF', fontWeight: 'bold', animation: 'pulse-glow 1s infinite' }}>
                  Bypassing security and scanning product data...
                </div>
              )}
            </div>

            <div className="divider" style={{ margin: '0 0 24px 0' }}><span>OR SELECT PRESET</span></div>

            {/* Search */}
            <div className="search-row">
              <input
                className="input goal-search"
                placeholder="🔍  Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="goal-search"
              />
            </div>

            {/* Category Filter */}
            <div className="category-chips">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-chip ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="product-grid">
              {filtered.length === 0 ? (
                <div className="product-empty">
                  <span>🔍</span>
                  <p>No products match "{search}"</p>
                </div>
              ) : (
                filtered.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`product-tile ${selected?.id === p.id ? 'selected' : ''}`}
                    onClick={() => handleSelectProduct(p)}
                    style={{ '--product-color': p.color }}
                    id={`product-${p.id}`}
                  >
                    <span className="product-tile-emoji">{p.emoji}</span>
                    <span className="product-tile-name">{p.name}</span>
                    <span className="product-tile-price">{formatCurrency(p.price)}</span>
                    <span className="product-tile-cat">{p.category}</span>
                  </button>
                ))
              )}
            </div>

            {/* Custom Entry */}
            <div className="custom-product-section">
              <div className="divider" />
              <p className="custom-label">✏️ Or add a custom product</p>
              <div className="custom-inputs">
                <input
                  className="input"
                  placeholder="Product name (e.g. Sony WH-1000XM5)"
                  value={customProduct}
                  onChange={e => setCustomProduct(e.target.value)}
                  id="custom-product-name"
                />
                <input
                  className="input"
                  type="number"
                  placeholder="Price in ₹"
                  value={customProductPrice}
                  onChange={e => setCustomProductPrice(e.target.value)}
                  id="custom-product-price"
                  min="100"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={!customProduct.trim() || !customProductPrice}
                  onClick={handleCustom}
                  id="custom-product-btn"
                >
                  Use Custom →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Price & Timeline ===== */}
        {step === 2 && selected && (
          <div className="step-panel animate-fade-in">
            <div className="selected-product-banner">
              <span className="selected-emoji">{selected.emoji}</span>
              <div className="selected-info">
                <div className="selected-name">{selected.name}</div>
                <div className="selected-cat">{selected.category || 'Custom'}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={goBack}>
                ← Change
              </button>
            </div>

            {/* Target Price */}
            <div className="form-group">
              <label htmlFor="goal-target-price">Target Price (₹)</label>
              <input
                className="input"
                type="number"
                id="goal-target-price"
                value={customPrice || (selected.price > 0 ? selected.price : '')}
                onChange={e => setCustomPrice(e.target.value)}
                placeholder="Enter amount in ₹"
                min="100"
              />
              {selected.price > 0 && !customPrice && (
                <span className="price-hint">Market price: {formatCurrency(selected.price)} · You can adjust above</span>
              )}
            </div>

            {/* Timeline Slider */}
            <div className="timeline-section">
              <label>Saving Period — <strong style={{ color: 'var(--accent-start)' }}>{timeline} months</strong></label>
              <div className="timeline-chips">
                {TIMELINES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`timeline-chip ${timeline === t ? 'active' : ''}`}
                    onClick={() => setTimeline(t)}
                    id={`timeline-${t}`}
                  >
                    {t}m
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="3" max="24" step="3"
                value={timeline}
                onChange={e => setTimeline(parseInt(e.target.value))}
                className="timeline-slider"
                id="timeline-slider"
              />
            </div>

            {targetPrice > 0 && (
              <div className="plan-preview">
                <div className="plan-preview-title">📋 Your Saving Plan</div>
                <div className="plan-row">
                  <span>Monthly Save</span>
                  <span className="plan-val gradient-text" style={{ fontSize: '1.2rem' }}>{formatCurrency(monthly)}</span>
                </div>
                <div className="plan-row">
                  <span>Total Amount</span>
                  <span className="plan-val">{formatCurrency(targetPrice)}</span>
                </div>
                <div className="plan-row">
                  <span>Price Locked At</span>
                  <span className="plan-val">🔐 {formatCurrency(targetPrice)}</span>
                </div>
                <div className="plan-row highlight">
                  <span>Completion Reward</span>
                  <span className="plan-val reward-text">+{reward.pct}% = {formatCurrency(reward.amount)}</span>
                </div>
                <div className="plan-row">
                  <span>Final Price (after reward)</span>
                  <span className="plan-val" style={{ color: 'var(--accent-start)', fontWeight: 800 }}>
                    {formatCurrency(targetPrice - reward.amount)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary btn-lg step-next"
              onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={!targetPrice || targetPrice < 100}
              id="step2-next"
            >
              Review Plan →
            </button>
          </div>
        )}

        {/* ===== STEP 3: Confirm ===== */}
        {step === 3 && selected && (
          <div className="step-panel animate-fade-in">
            <h3 className="step-title">Review Your Goal 🎯</h3>

            <div className="review-card card card-glow">
              <div className="review-hero">
                <span className="review-emoji">{selected.emoji}</span>
                <div>
                  <div className="review-name">{selected.name}</div>
                  <div className="review-price gradient-text">{formatCurrency(targetPrice)}</div>
                </div>
              </div>

              <div className="divider" />

              <div className="review-rows">
                <div className="review-row">
                  <span>Duration</span><span>{timeline} months</span>
                </div>
                <div className="review-row">
                  <span>Monthly Saving</span>
                  <span className="green">{formatCurrency(monthly)}</span>
                </div>
                <div className="review-row">
                  <span>Price Locked</span>
                  <span>🔐 Yes — guaranteed</span>
                </div>
                <div className="review-row">
                  <span>Milestone Rewards</span>
                  <span>At 25%, 50%, 75%</span>
                </div>
                <div className="review-row big">
                  <span>Completion Reward</span>
                  <span className="green">+{reward.pct}% = {formatCurrency(reward.amount)}</span>
                </div>
                <div className="review-row big" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <span style={{ fontWeight: 800 }}>You Pay (Final)</span>
                  <span style={{ color: 'var(--accent-start)', fontWeight: 900, fontSize: '1.1rem' }}>
                    {formatCurrency(targetPrice - reward.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="ai-tip">
              💡 <strong>AI Tip:</strong> Save <strong>{formatCurrency(Math.ceil(monthly * 1.2))}</strong>/month and complete
              your goal <strong>{Math.max(1, Math.ceil(timeline * 0.2))} month{Math.ceil(timeline * 0.2) > 1 ? 's' : ''} early!</strong>
            </div>

            <div className="review-ctas">
              <button type="button" className="btn btn-ghost" onClick={goBack}>← Back</button>
              <button
                id="create-goal-btn"
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleCreate}
              >
                🚀 Start Saving!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
