import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Navbar.css';

// Nav items — all pointing to valid routes
const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Home',    icon: HomeIcon    },
  { path: '/rewards',     label: 'Rewards', icon: RewardIcon  },
  { path: '/create-goal', label: null,      icon: null, isFab: true },
  { path: '/profile',     label: 'Profile', icon: ProfileIcon },
  { path: '/create-goal', label: 'Add Goal', icon: GoalIcon   },
];

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}
        strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function RewardIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21L12 17.77L5.82 21L7 14.14L2 9.27L8.91 8.26L12 2Z"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}
        strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
      <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round"
      />
    </svg>
  );
}

function GoalIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="2"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
      <rect x="14" y="3" width="7" height="7" rx="2"
        stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0}
      />
      <rect x="3" y="14" width="7" height="7" rx="2"
        stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0}
      />
      <path d="M14 17.5H21M17.5 14V21" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round"/>
    </svg>
  );
}

export default function Navbar() {
  const { isLoggedIn } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [fabPressed, setFabPressed] = useState(false);
  
  // Auto-hiding logic has been disabled so the navbar remains permanently visible on mobile.

  // Hide on landing, auth, and link-bank pages + when not logged in
  const hiddenPaths = ['/', '/auth', '/link-bank'];
  if (hiddenPaths.includes(location.pathname) || !isLoggedIn) return null;

  const isActive = (item) => location.pathname === item.path;

  const handleFab = () => {
    setFabPressed(true);
    setTimeout(() => setFabPressed(false), 300);
    navigate('/create-goal');
  };

  return (
    <nav className={`bottom-nav ${visible ? 'visible' : 'hidden'}`} role="navigation" aria-label="Main navigation">
      <div className="bottom-nav-inner">
        {NAV_ITEMS.map((item, i) => {
          if (item.isFab) {
            return (
              <button
                key="fab"
                className={`nav-fab ${fabPressed ? 'fab-pressed' : ''}`}
                onClick={handleFab}
                aria-label="Create new goal"
                id="nav-fab-btn"
              >
                <div className="fab-glow" />
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            );
          }

          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={`${item.path}-${item.label}`}
              to={item.path}
              className={`nav-item ${active ? 'active' : ''}`}
              aria-label={item.label}
              id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <div className="nav-item-icon">
                <Icon active={active} />
                {active && <div className="nav-active-dot" />}
              </div>
              <span className="nav-item-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
