import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

export default function ConfettiEffect({ trigger }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (trigger && !firedRef.current) {
      firedRef.current = true;
      const end = Date.now() + 3000;

      const colors = ['#00FF94', '#B6FF00', '#FFB340', '#5B9EFF', '#FF5B5B'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [trigger]);

  return null;
}
