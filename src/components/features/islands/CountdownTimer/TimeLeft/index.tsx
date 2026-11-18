import styles from "./index.module.css";

type TimeLeftProps = {
  value: number;
  unit: string;
};

export function TimeLeft({ value, unit }: TimeLeftProps) {
  return (
    <div className={styles["time-left"]}>
      <time className={styles["value"]} dateTime={`PT${value}${unit[0]}`}>
        {value}
      </time>
      <span className={styles["unit"]}>{unit}</span>
    </div>
  );
}
