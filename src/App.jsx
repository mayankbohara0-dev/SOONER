import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import ToastContainer from './components/Toast';

// 🚀 PERFORMANCE: Code Splitting & Lazy Loading
// Generates separate JavaScript chunks for each page, massively reducing the initial LCP payload.
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateGoal = lazy(() => import('./pages/CreateGoal'));
const GoalDetail = lazy(() => import('./pages/GoalDetail'));
const Rewards = lazy(() => import('./pages/Rewards'));
const Profile = lazy(() => import('./pages/Profile'));
const BankLink = lazy(() => import('./pages/BankLink'));

import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("React Crash:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#ff4444', background: '#222', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>💥 App Crashed</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px', marginTop: '20px' }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useApp();
  if (loading) return <SessionLoader />;
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

function SessionLoader({ children }) {
  const { loading } = useApp();
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #0A1D5C 0%, #0353A4 50%, #0077FF 100%)',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: '2.5rem' }}>✦</div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.2)',
          borderTopColor: '#fff',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return children;
}

// Animate page transitions
function PageTransitionWrapper({ children }) {
  const location = useLocation();
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('page-enter');
    // force reflow
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [location.pathname]);

  return (
    <div ref={ref} className="page-transition-root">
      {children}
    </div>
  );
}

function AppRoutes() {
  const { isLoggedIn, loading } = useApp();

  return (
    <>
      <Navbar />
      <ToastContainer />
      <PageTransitionWrapper>
        <Suspense fallback={<div className="page-loader"><span className="spinner" /></div>}>
          <Routes>
            <Route path="/" element={
              loading ? <SessionLoader /> : (isLoggedIn ? <Navigate to="/dashboard" replace /> : <Landing />)
            } />
            <Route path="/auth"      element={<Auth />} />
            <Route path="/link-bank" element={<ProtectedRoute><BankLink /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create-goal" element={<ProtectedRoute><CreateGoal /></ProtectedRoute>} />
            <Route path="/goal/:id"  element={<ProtectedRoute><GoalDetail /></ProtectedRoute>} />
            <Route path="/rewards"   element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
            <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </PageTransitionWrapper>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
