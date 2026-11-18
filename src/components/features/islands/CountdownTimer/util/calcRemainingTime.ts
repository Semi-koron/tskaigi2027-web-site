import type { RemainingTime } from "../types/TimeUnit";

export const calcRemainingTime = (diffMs: number): RemainingTime => {
  const ms = Math.max(0, diffMs);
  return {
    days: Math.floor(ms / (1000 * 60 * 60 * 24)),
    hours: Math.floor((ms / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((ms / 1000 / 60) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
};
