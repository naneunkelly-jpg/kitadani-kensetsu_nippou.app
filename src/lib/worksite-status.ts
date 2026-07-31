export const WORKSITE_STATUS_LABELS: Record<string, string> = {
  before_start: "開始前",
  in_progress: "施工中",
  completed: "完了",
  on_hold: "保留",
};

export const WORKSITE_STATUS_OPTIONS = Object.entries(WORKSITE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);
