import styles from "./index.module.css";

type TimeLeftProps = {
  value: number;
  unit: string;
  duration: string;
};

export function TimeLeft({ value, unit, duration }: TimeLeftProps) {
  return (
    <div className={styles["time-left"]}>
      <time className={styles["value"]} dateTime={duration}>
        {value}
      </time>
      <span className={styles["unit"]}>{unit}</span>
    </div>
  );
}
