import { useEffect, useState } from "react";

export const useCountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // TSKaigi 2027の開催日を固定値で設定
    const targetDate = new Date("2027-05-21T00:00:00+09:00");

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = Math.max(0, targetDate.getTime() - now.getTime());

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    timeLeft,
  };
};
