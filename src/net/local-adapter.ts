
export function isWebPreview(engine: any): boolean {
  return !engine.wx;
}

type WatcherCallback = (snapshot: { docs: any[] }) => void;

export interface LocalCloud {
  add(collection: string, data: any): Promise<string | null>;
  getById<T>(collection: string, id: string): Promise<T | null>;
  get<T>(collection: string, query: { where?: any; orderBy?: { field: string; direction: 'asc' | 'desc' } }): Promise<T[]>;
  update(collection: string, id: string, data: any): Promise<boolean>;
  remove(collection: string, id: string): Promise<boolean>;
  watch(collection: string, filter: any, callback: WatcherCallback): { close(): void };
}

export interface LocalStorage {
  load<T>(key: string, defaultValue?: T): T | null;
  save(key: string, value: any): void;
}

class LocalCloudImpl implements LocalCloud {
  private data: Map<string, Map<string, any>> = new Map();
  private watchers: Set<{ collection: string; filter: any; callback: WatcherCallback }> = new Set();

  async add(collection: string, data: any): Promise<string | null> {
    if (!this.data.has(collection)) {
      this.data.set(collection, new Map());
    }
    const id = Math.random().toString(36).substring(2, 10);
    const doc = { ...data, _id: id };
    this.data.get(collection)!.set(id, doc);
    this.notifyWatchers(collection);
    return id;
  }

  async getById<T>(collection: string, id: string): Promise<T | null> {
    const col = this.data.get(collection);
    if (!col) return null;
    return (col.get(id) as T) || null;
  }

  async get<T>(collection: string, query: { where?: any; orderBy?: { field: string; direction: 'asc' | 'desc' } }): Promise<T[]> {
    const col = this.data.get(collection);
    if (!col) return [];
    
    let docs = Array.from(col.values());
    
    if (query.where) {
      docs = docs.filter(doc => {
        for (const key in query.where) {
          if (doc[key] !== query.where[key]) return false;
        }
        return true;
      });
    }
    
    if (query.orderBy) {
      const { field, direction } = query.orderBy;
      docs.sort((a, b) => {
        if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
        if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return docs as T[];
  }

  async update(collection: string, id: string, data: any): Promise<boolean> {
    const col = this.data.get(collection);
    if (!col || !col.has(id)) return false;
    
    const existing = col.get(id);
    col.set(id, { ...existing, ...data });
    this.notifyWatchers(collection);
    return true;
  }

  async remove(collection: string, id: string): Promise<boolean> {
    const col = this.data.get(collection);
    if (!col || !col.has(id)) return false;
    
    col.delete(id);
    this.notifyWatchers(collection);
    return true;
  }

  watch(collection: string, filter: any, callback: WatcherCallback): { close(): void } {
    const watcher = { collection, filter, callback };
    this.watchers.add(watcher);
    
    this.get(collection, { where: filter }).then(docs => {
      callback({ docs });
    });

    return {
      close: () => {
        this.watchers.delete(watcher);
      }
    };
  }

  private notifyWatchers(collection: string) {
    // Use setTimeout to defer notification, preventing synchronous cascades
    // that cause UI jank when toggle changes trigger immediate watcher callbacks
    setTimeout(() => {
      for (const watcher of this.watchers) {
        if (watcher.collection === collection) {
          this.get(collection, { where: watcher.filter }).then(docs => {
            watcher.callback({ docs });
          });
        }
      }
    }, 16);
  }
}

class LocalStorageImpl implements LocalStorage {
  private prefix = 'riskit_';

  load<T>(key: string, defaultValue?: T): T | null {
    if (typeof localStorage === 'undefined') return defaultValue ?? null;
    const val = localStorage.getItem(this.prefix + key);
    if (val === null) return defaultValue ?? null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  save(key: string, value: any): void {
    if (typeof localStorage === 'undefined') return;
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(this.prefix + key, val);
  }
}

const cloudInstance = new LocalCloudImpl();
const storageInstance = new LocalStorageImpl();

export function createLocalCloud(): LocalCloud {
  return cloudInstance;
}

export function createLocalStorage(): LocalStorage {
  return storageInstance;
}
