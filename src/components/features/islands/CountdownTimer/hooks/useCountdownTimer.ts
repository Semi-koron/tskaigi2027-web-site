import { useEffect, useState } from "react";

const targetDate = import.meta.env.PUBLIC_COUNTDOWN_TARGET_DATE;

if (!targetDate?.trim()) {
  throw new Error("PUBLIC_COUNTDOWN_TARGET_DATE が設定されていません。");
}

const targetTime = Date.parse(targetDate);

if (Number.isNaN(targetTime)) {
  throw new Error(
    "PUBLIC_COUNTDOWN_TARGET_DATE に有効な日時を指定してください。",
  );
}

export const useCountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = Math.max(0, targetTime - now.getTime());

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
