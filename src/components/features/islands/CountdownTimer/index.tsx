import { Divider } from "./Divider";
import { TimeLeft } from "./TimeLeft";
import { useCountdownTimer } from "./hooks/useCountdownTimer";
import styles from "./index.module.css";
import type { TimeUnit } from "./types/TimeUnit";

const TIME_UNITS = [
  { key: "days", label: "Days", designator: "D" },
  { key: "hours", label: "Hours", designator: "H" },
  { key: "minutes", label: "Minutes", designator: "M" },
  { key: "seconds", label: "Seconds", designator: "S" },
] as const satisfies readonly TimeUnit[];

export function CountdownTimer() {
  const { timeLeft } = useCountdownTimer();

  return (
    <div
      className={styles["timer"]}
      role="timer"
      aria-label="TSKaigi 2027開催までの残り時間"
    >
      <div className={styles["pink-glow"]} aria-hidden="true" />
      <div className={styles["blue-glow"]} aria-hidden="true" />
      <div className={styles["grid"]} aria-hidden="true" />
      <div className={styles["values"]}>
        {TIME_UNITS.map((unit, index) => (
          <div key={unit.key} className={styles["time-unit"]}>
            <TimeLeft timeUnit={unit} value={timeLeft[unit.key]} />
            {index < TIME_UNITS.length - 1 && <Divider />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CountdownTimer;
