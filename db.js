// db.js - Shared IndexedDB Manager for VSTEP Writing Mock Tests
const VstepWritingDB = {
    dbName: "VstepWritingMockDB",
    dbVersion: 1,
    db: null,

    // Initialize Database
    init() {
        return new Promise((resolve, reject) => {
            if (this.db) return resolve(this.db);

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("sessions")) {
                    db.createObjectStore("sessions", { keyPath: "testId" });
                }
                if (!db.objectStoreNames.contains("history")) {
                    db.createObjectStore("history", { keyPath: "id", autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject(event.target.error);
            };
        });
    },

    // --- Active Sessions Operations (Autosave) ---
    async saveSession(testId, sessionData) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("sessions", "readwrite");
            const store = transaction.objectStore("sessions");
            const data = {
                testId: parseInt(testId),
                ...sessionData,
                lastUpdated: Date.now()
            };
            const request = store.put(data);

            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async getSession(testId) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("sessions", "readonly");
            const store = transaction.objectStore("sessions");
            const request = store.get(parseInt(testId));

            request.onsuccess = (e) => resolve(e.target.result || null);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async deleteSession(testId) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("sessions", "readwrite");
            const store = transaction.objectStore("sessions");
            const request = store.delete(parseInt(testId));

            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    // --- Completed History Operations ---
    async saveHistory(testId, studentName, task1Text, task2Text, task1Words, task2Words) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("history", "readwrite");
            const store = transaction.objectStore("history");
            
            // Format date string: HH:MM DD/MM/YYYY
            const now = new Date();
            const dateStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

            const data = {
                id: Date.now(),
                testId: parseInt(testId),
                studentName: studentName || "Học viên",
                dateStr: dateStr,
                task1Text: task1Text || "",
                task2Text: task2Text || "",
                task1Words: task1Words || 0,
                task2Words: task2Words || 0,
                teacherComment1: "",
                teacherComment2: ""
            };
            const request = store.add(data);

            request.onsuccess = (e) => resolve(e.target.result || data.id);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async getAllHistory() {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("history", "readonly");
            const store = transaction.objectStore("history");
            const request = store.getAll();

            request.onsuccess = (e) => {
                // Sort history in reverse chronological order (newest first)
                const results = e.target.result || [];
                results.sort((a, b) => b.id - a.id);
                resolve(results);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async deleteHistoryItem(id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("history", "readwrite");
            const store = transaction.objectStore("history");
            const request = store.delete(parseInt(id));

            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async updateHistoryItem(id, updatedFields) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("history", "readwrite");
            const store = transaction.objectStore("history");
            const getRequest = store.get(parseInt(id));
            
            getRequest.onsuccess = (e) => {
                const data = e.target.result;
                if (!data) {
                    reject(new Error("Không tìm thấy bản ghi lịch sử tương ứng."));
                    return;
                }
                const updatedData = { ...data, ...updatedFields };
                const putRequest = store.put(updatedData);
                putRequest.onsuccess = () => resolve(true);
                putRequest.onerror = (err) => reject(err.target.error);
            };
            getRequest.onerror = (err) => reject(err.target.error);
        });
    }
};
