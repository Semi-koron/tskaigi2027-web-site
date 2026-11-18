type DurationDesignator = "D" | "H" | "M" | "S";

export type TimeUnit = {
  key: string;
  label: string;
  designator: DurationDesignator;
};
