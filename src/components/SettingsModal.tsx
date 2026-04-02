import type { ChangeEvent, RefObject } from "react";

type SettingsModalProps = {
    isImporting: boolean;
    isExporting: boolean;
    fileInputRef: RefObject<HTMLInputElement>;
    onClose: () => void;
    onExport: () => void;
    onImportClick: () => void;
    onImport: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export function SettingsModal({
    isImporting,
    isExporting,
    fileInputRef,
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
                        <h2>数据导入与导出</h2>
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
