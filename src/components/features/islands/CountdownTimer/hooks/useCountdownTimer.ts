import { useEffect, useState } from "react";
import type { TimeUnit } from "../types/TimeUnit";
import { calcRemainingTime } from "../util/calcRemainingTime";

const targetTime = Date.parse("2027-05-21T00:00:00+09:00");

export const useCountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<Record<TimeUnit["key"], number>>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = Math.max(0, targetTime - now.getTime());

      setTimeLeft(calcRemainingTime(difference));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    timeLeft,
  };
};
