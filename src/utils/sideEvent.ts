const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type SideEventDateLabel = {
  /** 例: "2/9" */
  monthDay: string;
  /** 例: "(月)" */
  weekday: string;
};

/**
 * 開催日（YYYY-MM-DD）を表示用の「月/日」と「(曜日)」に分ける．
 * ビルド環境のタイムゾーンに左右されないようUTCで曜日を求める．
 */
export const formatSideEventDate = (date: string): SideEventDateLabel => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error(
      `開催日はYYYY-MM-DD形式で指定してください: ${JSON.stringify(date)}`,
    );
  }
  const [year, month, day] = match.slice(1).map(Number) as [
    number,
    number,
    number,
  ];
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    throw new Error(`存在しない開催日です: ${JSON.stringify(date)}`);
  }
  return {
    monthDay: `${month}/${day}`,
    weekday: `(${WEEKDAYS[utcDate.getUTCDay()]})`,
  };
};

/** 終了日時（ISO 8601）を過ぎていれば終了済みとみなす． */
export const isSideEventClosed = (finishedAt: string, now: Date): boolean =>
  new Date(finishedAt).getTime() <= now.getTime();

/** 終了日時の新しい順に並べた新しい配列を返す． */
export const sortSideEventsByFinishedAtDesc = <
  T extends { finishedAt: string },
>(
  events: readonly T[],
): T[] =>
  [...events].sort(
    (a, b) =>
      new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime(),
  );
