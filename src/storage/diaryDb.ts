import type { DiaryEntry } from "../types";

const DB_NAME = "diary-notebook";
const STORE_NAME = "entries";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error("无法打开 IndexedDB"));
        };

        request.onupgradeneeded = () => {
            const database = request.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: "date" });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };
    });
}

export async function getEntryByDate(date: string): Promise<DiaryEntry | null> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(date);

        request.onerror = () => {
            reject(new Error("读取日记失败"));
        };

        request.onsuccess = () => {
            resolve((request.result as DiaryEntry | undefined) ?? null);
        };

        transaction.oncomplete = () => {
            database.close();
        };
    });
}

export async function saveTodayEntry(entry: DiaryEntry): Promise<void> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        store.put(entry);

        transaction.onerror = () => {
            reject(new Error("保存日记失败"));
        };

        transaction.oncomplete = () => {
            database.close();
            resolve();
        };
    });
}

export async function getAllEntries(): Promise<DiaryEntry[]> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => {
            reject(new Error("导出日记失败"));
        };

        request.onsuccess = () => {
            const entries = (request.result as DiaryEntry[]).sort((a, b) =>
                a.date.localeCompare(b.date),
            );
            resolve(entries);
        };

        transaction.oncomplete = () => {
            database.close();
        };
    });
}

export async function replaceAllEntries(entries: DiaryEntry[]): Promise<void> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const clearRequest = store.clear();

        clearRequest.onerror = () => {
            reject(new Error("导入前清空旧数据失败"));
        };

        clearRequest.onsuccess = () => {
            for (const entry of entries) {
                store.put(entry);
            }
        };

        transaction.onerror = () => {
            reject(new Error("导入日记失败"));
        };

        transaction.oncomplete = () => {
            database.close();
            resolve();
        };
    });
}
