function resolv(mt){
    if(!mt){ return '[INFO]'}

    switch(mt){
        case 1: {
            return '[INFO]';
        }case 2: {
            return '[ERROR]';
        }
        case 3:{
            return '[WARNING]';
        }
        case 4:{
            return '[LOG]';
        }
        case 5:{
            return '[DEBUGGING]';
        }
        case 90:{
            return '[SECore]';
        }
        default:{
            return '[INFO]';
        }
    }
}

class Journal {
    static entries = [];
    static DB_KEY = 'journal_entries';

    static async add(message, type) {
        const id = this.generateUUID();
        this.entries.push({
            id,
            timestamp: new Date(),
            message,
            type: resolv(type)
        });
        await this.save();
    }

    static clear() {
        this.entries = [];
        this.save();
    }

    static getAll() {
        return this.entries;
    }

    static get(id) {
        return this.entries.find(entry => entry.id === id) || null;
    }

    static clearEntry(id) {
        const index = this.entries.findIndex(entry => entry.id === id);
        if (index !== -1) {
            this.entries.splice(index, 1);
            this.save();
        }
    }

    static print() {
        console.log(this.entries);
    }

    static async save() {
        try {
            localStorage.setItem(this.DB_KEY, JSON.stringify(this.entries));
        } catch (e) {
            console.warn('localStorage failed, using indexedDB');
            await this.saveToIndexedDB();
        }
    }

    static async saveToIndexedDB() {
        const db = await this.openDB();
        const tx = db.transaction('journal', 'readwrite');
        tx.objectStore('journal').clear();
        tx.objectStore('journal').add({ entries: this.entries });
    }

    static async load() {
        const stored = localStorage.getItem(this.DB_KEY);
        if (stored) {
            this.entries = JSON.parse(stored);
        } else {
            this.entries = await this.loadFromIndexedDB();
        }
    }

    static async loadFromIndexedDB() {
        const db = await this.openDB();
        const data = await db.transaction('journal').objectStore('journal').getAll();
        return data[0]?.entries || [];
    }

    static openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('CoreUIDB', 1);
            req.onupgradeneeded = () => req.result.createObjectStore('journal');
            req.onsuccess = () => resolve(req.result);
            req.onerror = reject;
        });
    }

    static generateUUID() {
        return crypto.randomUUID();
    }
}

export { Journal };