import type { ChangeEvent, RefObject } from "react";
import type { Theme } from "../types";

type SettingsModalProps = {
    isImporting: boolean;
    isExporting: boolean;
    fileInputRef: RefObject<HTMLInputElement>;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    onClose: () => void;
    onExport: () => void;
    onImportClick: () => void;
    onImport: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export function SettingsModal({
    isImporting,
    isExporting,
    fileInputRef,
    theme,
    onThemeChange,
    onClose,
    onExport,
    onImportClick,
    onImport,
}: SettingsModalProps) {
    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
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
                        <h2>偏好与数据</h2>
                    </div>
                    <button
                        type="button"
                        className="close-button"
                        onClick={onClose}
                        aria-label="关闭设置"
                    >
                        ×
                    </button>
                </div>

                <div className="theme-section">
                    <h3>主题风格</h3>
                    <div className="theme-options">
                        <button
                            type="button"
                            className={`theme-option${theme === "classic" ? " active" : ""}`}
                            onClick={() => onThemeChange("classic")}
                        >
                            <span className="theme-swatch classic" />
                            古风水墨
                        </button>
                        <button
                            type="button"
                            className={`theme-option${theme === "dark" ? " active" : ""}`}
                            onClick={() => onThemeChange("dark")}
                        >
                            <span className="theme-swatch dark" />
                            暗黑模式
                        </button>
                        <button
                            type="button"
                            className={`theme-option${theme === "cyber" ? " active" : ""}`}
                            onClick={() => onThemeChange("cyber")}
                        >
                            <span className="theme-swatch cyber" />
                            赛博科技
                        </button>
                        <button
                            type="button"
                            className={`theme-option${theme === "hacker" ? " active" : ""}`}
                            onClick={() => onThemeChange("hacker")}
                        >
                            <span className="theme-swatch hacker" />
                            黑客终端
                        </button>
                    </div>
                </div>

                <p className="settings-copy">
                    导出会下载当前浏览器中的全部日记。导入会用备份文件覆盖当前本地数据。
                </p>

                <div className="settings-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onExport}
                        disabled={isExporting || isImporting}
                    >
                        {isExporting ? "导出中..." : "导出数据"}
                    </button>
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onImportClick}
                        disabled={isExporting || isImporting}
                    >
                        {isImporting ? "导入中..." : "导入数据"}
                    </button>
                    <input
                        ref={fileInputRef}
                        className="hidden-input"
                        type="file"
                        accept="application/json"
                        onChange={onImport}
                    />
                </div>
            </section>
        </div>
    );
}
