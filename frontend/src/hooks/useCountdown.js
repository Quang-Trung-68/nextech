export function calcTimeLeft(expiresAt) {
  if (!expiresAt) {
    return {
      isExpired: false,
      days: null,
      hours: null,
      minutes: null,
      seconds: null,
      totalMs: null,
    };
  }

  const target = new Date(expiresAt).getTime();
  const now = new Date().getTime();
  const totalMs = target - now;

  if (totalMs <= 0) {
    return {
      isExpired: true,
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
      totalMs: 0,
    };
  }

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / 1000 / 60) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);

  return {
    isExpired: false,
    days: days.toString(),
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    totalMs,
  };
}

import { useState, useEffect } from 'react';

export function useCountdown(expiresAt) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(expiresAt));

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(calcTimeLeft(null));
      return;
    }

    setTimeLeft(calcTimeLeft(expiresAt));

    const intervalId = setInterval(() => {
      const computed = calcTimeLeft(expiresAt);
      setTimeLeft(computed);

      if (computed.isExpired) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt]);

  return timeLeft;
}
