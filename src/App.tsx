import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
    getAllEntries,
    getEntryByDate,
    replaceAllEntries,
    saveTodayEntry,
} from "./storage/diaryDb";
import type { DiaryEntry } from "./types";
import {
    formatDateLabel,
    formatDateTime,
    getLocalDateString,
} from "./utils/date";

const today = getLocalDateString();

function createEmptyEntry(date: string): DiaryEntry {
    return {
        date,
        content: "",
        note: "",
        updatedAt: "",
    };
}

export default function App() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [todayEntry, setTodayEntry] = useState<DiaryEntry>(
        createEmptyEntry(today),
    );
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
    const [isLoadingToday, setIsLoadingToday] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        void loadTodayEntry();
    }, []);

    useEffect(() => {
        void loadEntryForDate(selectedDate);
    }, [selectedDate]);

    async function loadTodayEntry() {
        setIsLoadingToday(true);
        setErrorMessage("");

        try {
            const entry = await getEntryByDate(today);
            setTodayEntry(entry ?? createEmptyEntry(today));
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "读取今天的日记失败",
            );
        } finally {
            setIsLoadingToday(false);
        }
    }

    async function loadEntryForDate(date: string) {
        setIsLoadingHistory(true);
        setErrorMessage("");

        try {
            const entry = await getEntryByDate(date);
            setSelectedEntry(entry);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "查找日记失败",
            );
        } finally {
            setIsLoadingHistory(false);
        }
    }

    async function handleSave() {
        setIsSaving(true);
        setErrorMessage("");
        setStatusMessage("");

        try {
            const entryToSave: DiaryEntry = {
                ...todayEntry,
                date: today,
                updatedAt: new Date().toISOString(),
            };

            await saveTodayEntry(entryToSave);
            setTodayEntry(entryToSave);
            setStatusMessage("今天的日记已保存到浏览器。");

            if (selectedDate === today) {
                setSelectedEntry(entryToSave);
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "保存失败",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleExport() {
        setIsExporting(true);
        setErrorMessage("");
        setStatusMessage("");

        try {
            const entries = await getAllEntries();
            const payload = {
                exportedAt: new Date().toISOString(),
                entries,
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `diary-backup-${today}.json`;
            link.click();
            URL.revokeObjectURL(url);
            setStatusMessage(`已导出 ${entries.length} 条日记数据。`);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "导出失败",
            );
        } finally {
            setIsExporting(false);
        }
    }

    function handleImportClick() {
        fileInputRef.current?.click();
    }

    async function handleImport(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setIsImporting(true);
        setErrorMessage("");
        setStatusMessage("");

        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as { entries?: unknown };
            const importedEntries = Array.isArray(parsed.entries)
                ? parsed.entries
                : null;

            if (!importedEntries) {
                throw new Error("导入文件格式不正确");
            }

            const normalizedEntries = importedEntries.map((entry) => {
                const item = entry as Partial<DiaryEntry>;

                if (
                    typeof item.date !== "string" ||
                    typeof item.content !== "string" ||
                    typeof item.note !== "string" ||
                    typeof item.updatedAt !== "string"
                ) {
                    throw new Error("导入文件包含无效日记数据");
                }

                return {
                    date: item.date,
                    content: item.content,
                    note: item.note,
                    updatedAt: item.updatedAt,
                };
            });

            await replaceAllEntries(normalizedEntries);
            await Promise.all([
                loadTodayEntry(),
                loadEntryForDate(selectedDate),
            ]);
            setStatusMessage(
                `导入完成，已恢复 ${normalizedEntries.length} 条日记。`,
            );
            setIsSettingsOpen(false);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "导入失败",
            );
        } finally {
            event.target.value = "";
            setIsImporting(false);
        }
    }

    return (
        <main className="page-shell">
            {isSettingsOpen ? (
                <div
                    className="modal-overlay"
                    onClick={() => setIsSettingsOpen(false)}
                    role="presentation"
                >
                    <section
                        className="settings-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="设置"
                    >
                        <div className="settings-modal-header">
                            <div>
                                <p className="panel-kicker">设置</p>
                                <h2>数据导入与导出</h2>
                            </div>
                            <button
                                type="button"
                                className="close-button"
                                onClick={() => setIsSettingsOpen(false)}
                                aria-label="关闭设置"
                            >
                                ×
                            </button>
                        </div>

                        <p className="settings-copy">
                            导出会下载当前浏览器中的全部日记。导入会用备份文件覆盖当前本地数据。
                        </p>

                        <div className="settings-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleExport}
                                disabled={isExporting || isImporting}
                            >
                                {isExporting ? "导出中..." : "导出数据"}
                            </button>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleImportClick}
                                disabled={isExporting || isImporting}
                            >
                                {isImporting ? "导入中..." : "导入数据"}
                            </button>
                            <input
                                ref={fileInputRef}
                                className="hidden-input"
                                type="file"
                                accept="application/json"
                                onChange={handleImport}
                            />
                        </div>
                    </section>
                </div>
            ) : null}

            <section className="content-grid">
                <article className="panel panel-editor">
                    <div className="panel-header">
                        <div>
                            <p className="panel-kicker">今日编辑</p>
                            <h2>新建或更新今天的日记</h2>
                        </div>
                        <span className="badge">仅限今天</span>
                    </div>

                    {isLoadingToday ? (
                        <p className="muted">正在加载今天的内容...</p>
                    ) : (
                        <>
                            <label className="field">
                                <span>日记内容</span>
                                <textarea
                                    value={todayEntry.content}
                                    onChange={(event) =>
                                        setTodayEntry((current) => ({
                                            ...current,
                                            content: event.target.value,
                                        }))
                                    }
                                    rows={12}
                                    placeholder="写下今天发生的事、想法，或者一句不想忘记的话。"
                                />
                            </label>

                            <label className="field">
                                <span>备注</span>
                                <textarea
                                    value={todayEntry.note}
                                    onChange={(event) =>
                                        setTodayEntry((current) => ({
                                            ...current,
                                            note: event.target.value,
                                        }))
                                    }
                                    rows={4}
                                    placeholder="给今天的日记补充一个备注。"
                                />
                            </label>

                            <button
                                className="primary-button"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? "保存中..." : "保存今天的日记"}
                            </button>
                        </>
                    )}

                    {statusMessage ? (
                        <p className="status success">{statusMessage}</p>
                    ) : null}
                    {errorMessage ? (
                        <p className="status error">{errorMessage}</p>
                    ) : null}
                </article>

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
                            onChange={(event) =>
                                setSelectedDate(event.target.value)
                            }
                        />
                    </label>

                    <div className="history-card">
                        <div className="history-meta">
                            <strong>{formatDateLabel(selectedDate)}</strong>
                            <span>
                                {selectedDate === today
                                    ? "今天可编辑"
                                    : "历史仅查看"}
                            </span>
                        </div>

                        {isLoadingHistory ? (
                            <p className="muted">正在读取这一天的日记...</p>
                        ) : null}

                        {!isLoadingHistory && !selectedEntry ? (
                            <p className="empty-state">该日期暂无日记记录。</p>
                        ) : null}

                        {!isLoadingHistory && selectedEntry ? (
                            <div className="entry-preview">
                                <section>
                                    <h3>正文</h3>
                                    <p>
                                        {selectedEntry.content ||
                                            "这一天保存了空白正文。"}
                                    </p>
                                </section>

                                <section>
                                    <h3>备注</h3>
                                    <p>
                                        {selectedEntry.note ||
                                            "这一天没有备注。"}
                                    </p>
                                </section>

                                <p className="updated-at">
                                    最后更新：
                                    {formatDateTime(selectedEntry.updatedAt)}
                                </p>
                            </div>
                        ) : null}
                    </div>
                </article>
            </section>

            <section className="hero-card">
                <div>
                    <p className="eyebrow">DIARY NOTEBOOK</p>
                    <h1>今天，写一点真正想留下的东西。</h1>
                    <p className="hero-copy">
                        你的日记和备注只保存在当前浏览器的 IndexedDB
                        中。今天可以编辑，历史可以按日期查看。
                    </p>
                </div>
                <div className="date-chip">{formatDateLabel(today)}</div>
            </section>

            <section className="page-toolbar">
                <button
                    type="button"
                    className="icon-button"
                    onClick={() => setIsSettingsOpen((current) => !current)}
                    aria-label="打开设置"
                    aria-expanded={isSettingsOpen}
                >
                    <span aria-hidden="true">⚙</span>
                </button>
            </section>
        </main>
    );
}
