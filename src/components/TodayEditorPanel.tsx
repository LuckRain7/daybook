import type { DiaryEntry } from "../types";
import { MarkdownEditor } from "./MarkdownEditor";

type TodayEditorPanelProps = {
    todayEntry: DiaryEntry;
    isLoading: boolean;
    isSaving: boolean;
    statusMessage: string;
    errorMessage: string;
    onContentChange: (value: string) => void;
    onNoteChange: (value: string) => void;
    onSave: () => void;
};

export function TodayEditorPanel({
    todayEntry,
    isLoading,
    isSaving,
    statusMessage,
    errorMessage,
    onContentChange,
    onNoteChange,
    onSave,
}: TodayEditorPanelProps) {
    return (
        <article className="panel panel-editor">
            <div className="panel-header">
                <div>
                    <p className="panel-kicker">今日编辑</p>
                    <h2>新建或更新今天的日记</h2>
                </div>
                <span className="badge">仅限今天</span>
            </div>

            {isLoading ? (
                <p className="muted">正在加载今天的内容...</p>
            ) : (
                <>
                    <div className="field">
                        <span>日记内容</span>
                        <div className="editor-wrapper">
                            <MarkdownEditor
                                value={todayEntry.content}
                                onChange={onContentChange}
                                placeholder="写下今天发生的事、想法，或者一句不想忘记的话。"
                            />
                        </div>
                    </div>

                    <div className="field">
                        <span>备注</span>
                        <div className="editor-wrapper">
                            <MarkdownEditor
                                value={todayEntry.note}
                                onChange={onNoteChange}
                                placeholder="给今天的日记补充一个备注。"
                            />
                        </div>
                    </div>

                    <button
                        className="primary-button"
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "保存中..." : "保存今天的日记"}
                    </button>
                </>
            )}

            {statusMessage ? <p className="status success">{statusMessage}</p> : null}
            {errorMessage ? <p className="status error">{errorMessage}</p> : null}
        </article>
    );
}
