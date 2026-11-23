import { useSyncExternalStore } from "react";
import { isSideEventClosed } from "../../../../utils/sideEvent";
import styles from "./index.module.css";

type ClosedBadgeProps = {
  /** 終了日時（ISO 8601） */
  finishedAt: string;
  /** ビルド時点で終了済みだったか．静的HTMLの出力とhydrationに使う */
  closedAtBuild: boolean;
};

// 現在時刻には変更を通知してくれる購読先がないので，購読では何もしない
const subscribe = () => () => {};

/**
 * サイトはビルド時にしか生成されないため，ビルド時の判定だけだと「終了済み」が古いまま残る．
 * ビルド時の判定で静的HTMLを出力し，hydration後に閲覧時の日時で判定し直す．
 */
const ClosedBadge = ({ finishedAt, closedAtBuild }: ClosedBadgeProps) => {
  const isClosed = useSyncExternalStore(
    subscribe,
    () => isSideEventClosed(finishedAt, new Date()),
    () => closedAtBuild,
  );

  if (!isClosed) {
    return null;
  }

  return <span className={styles["badge"]}>終了済み</span>;
};

export default ClosedBadge;
