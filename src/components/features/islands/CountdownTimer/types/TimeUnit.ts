type DurationDesignator = "D" | "H" | "M" | "S";

type TimeUnitKey = "days" | "hours" | "minutes" | "seconds";

export type TimeUnit = {
  key: TimeUnitKey;
  label: string;
  designator: DurationDesignator;
};

export type RemainingTime = Record<TimeUnit["key"], number>;
