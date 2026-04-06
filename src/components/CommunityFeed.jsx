import { useState, useEffect } from 'react';
import './CommunityFeed.css';

const MOCK_EVENTS = [
  { user: 'Ankita M.', action: 'unlocked an iPhone 15 Pro', emoji: '📱', time: 'Just now' },
  { user: 'Rahul S.', action: 'started saving for a MacBook', emoji: '💻', time: '2m ago' },
  { user: 'Priya K.', action: 'hit a 30-day streak', emoji: '🔥', time: '5m ago' },
  { user: 'Vikram D.', action: 'locked a price on a PS5', emoji: '🎮', time: '12m ago' },
  { user: 'Sneha R.', action: 'unlocked an iPad Air', emoji: '📱', time: '1hr ago' },
];

export default function CommunityFeed() {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % events.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [events.length]);

  return (
    <div className="community-feed-container">
      <div className="cf-badge">Live</div>
      <div className="cf-event-carousel animate-fade-in" key={activeIndex}>
        <div className="cf-emoji">{events[activeIndex].emoji}</div>
        <div className="cf-text">
          <span className="cf-user">{events[activeIndex].user}</span> {events[activeIndex].action}
        </div>
        <div className="cf-time">{events[activeIndex].time}</div>
      </div>
    </div>
  );
}
