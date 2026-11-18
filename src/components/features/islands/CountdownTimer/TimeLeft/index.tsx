import styles from "./index.module.css";
import type { TimeUnit } from "./../types/TimeUnit";

type TimeLeftProps = {
  timeUnit: TimeUnit;
  value: number;
};

export function TimeLeft({ timeUnit, value }: TimeLeftProps) {
  const toDuration = (value: number, { designator }: TimeUnit) =>
    designator === "D" ? `P${value}D` : `PT${value}${designator}`;
  return (
    <div className={styles["time-left"]}>
      <time className={styles["value"]} dateTime={toDuration(value, timeUnit)}>
        {value}
      </time>
      <span className={styles["unit"]}>{timeUnit.label}</span>
    </div>
  );
}
