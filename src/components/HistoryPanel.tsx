import type { DiaryEntry } from "../types";
import { formatDateLabel, formatDateTime } from "../utils/date";

type HistoryPanelProps = {
    today: string;
    selectedDate: string;
    selectedEntry: DiaryEntry | null;
    isLoading: boolean;
    onSelectedDateChange: (value: string) => void;
};

export function HistoryPanel({
    today,
    selectedDate,
    selectedEntry,
    isLoading,
    onSelectedDateChange,
}: HistoryPanelProps) {
    return (
        <article className="panel panel-history">
            <div className="panel-header">
                <div>
                    <p className="panel-kicker">按天查找</p>
                    <h2>查看历史日记</h2>
                </div>
            </div>

            <label className="field">
                <span>选择日期</span>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => onSelectedDateChange(event.target.value)}
                />
            </label>

            <div className="history-card">
                <div className="history-meta">
                    <strong>{formatDateLabel(selectedDate)}</strong>
                    <span>{selectedDate === today ? "今天可编辑" : "历史仅查看"}</span>
                </div>

                {isLoading ? <p className="muted">正在读取这一天的日记...</p> : null}

                {!isLoading && !selectedEntry ? (
                    <p className="empty-state">该日期暂无日记记录。</p>
                ) : null}

                {!isLoading && selectedEntry ? (
                    <div className="entry-preview">
                        <section>
                            <h3>正文</h3>
                            <p>{selectedEntry.content || "这一天保存了空白正文。"}</p>
                        </section>

                        <section>
                            <h3>备注</h3>
                            <p>{selectedEntry.note || "这一天没有备注。"}</p>
                        </section>

                        <p className="updated-at">
                            最后更新：
                            {formatDateTime(selectedEntry.updatedAt)}
                        </p>
                    </div>
                ) : null}
            </div>
        </article>
    );
}
