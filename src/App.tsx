import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { HistoryPanel } from "./components/HistoryPanel";
import { SettingsModal } from "./components/SettingsModal";
import { TodayEditorPanel } from "./components/TodayEditorPanel";
import {
    getAllEntries,
    getEntryByDate,
    replaceAllEntries,
    saveTodayEntry,
} from "./storage/diaryDb";
import type { DiaryEntry, Theme } from "./types";
import { formatDateLabel, getLocalDateString } from "./utils/date";

const today = getLocalDateString();
const THEME_KEY = "daybook-theme";

function getInitialTheme(): Theme {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "classic" || saved === "dark" || saved === "cyber" || saved === "hacker") return saved;
    return "classic";
}

// Apply theme immediately to avoid flash
document.documentElement.setAttribute("data-theme", getInitialTheme());

function createEmptyEntry(date: string): DiaryEntry {
    return {
        date,
        content: "",
        note: "",
        updatedAt: "",
    };
}

export default function App() {
    const fileInputRef = useRef<HTMLInputElement>(null);
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
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    function handleThemeChange(newTheme: Theme) {
        setTheme(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    }

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
                <SettingsModal
                    isImporting={isImporting}
                    isExporting={isExporting}
                    fileInputRef={fileInputRef}
                    theme={theme}
                    onThemeChange={handleThemeChange}
                    onClose={() => setIsSettingsOpen(false)}
                    onExport={handleExport}
                    onImportClick={handleImportClick}
                    onImport={handleImport}
                />
            ) : null}

            <section className="content-grid">
                <TodayEditorPanel
                    todayEntry={todayEntry}
                    isLoading={isLoadingToday}
                    isSaving={isSaving}
                    statusMessage={statusMessage}
                    errorMessage={errorMessage}
                    onContentChange={(value) =>
                        setTodayEntry((current) => ({
                            ...current,
                            content: value,
                        }))
                    }
                    onNoteChange={(value) =>
                        setTodayEntry((current) => ({
                            ...current,
                            note: value,
                        }))
                    }
                    onSave={handleSave}
                />

                <HistoryPanel
                    today={today}
                    selectedDate={selectedDate}
                    selectedEntry={selectedEntry}
                    isLoading={isLoadingHistory}
                    onSelectedDateChange={setSelectedDate}
                />
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
