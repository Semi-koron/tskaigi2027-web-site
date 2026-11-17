import { Divider } from "./Divider";
import { TimeLeft } from "./TimeLeft";
import { useCountdownTimer } from "./hooks/useCountdownTimer";
import styles from "./index.module.css";

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
        <TimeLeft
          value={timeLeft.days}
          unit="Days"
          duration={`P${timeLeft.days}D`}
        />
        <Divider />
        <TimeLeft
          value={timeLeft.hours}
          unit="Hours"
          duration={`PT${timeLeft.hours}H`}
        />
        <Divider />
        <TimeLeft
          value={timeLeft.minutes}
          unit="Minutes"
          duration={`PT${timeLeft.minutes}M`}
        />
        <Divider />
        <TimeLeft
          value={timeLeft.seconds}
          unit="Seconds"
          duration={`PT${timeLeft.seconds}S`}
        />
      </div>
    </div>
  );
}

export default CountdownTimer;
