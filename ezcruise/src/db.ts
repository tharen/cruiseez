import type { Setup, Species } from './types/api';

// 1. Define Store Name types for strict indexing
type StoreName = 'units' | 'setup';

const DB_NAME = "ez_cruise_db";
const DB_VERSION = 1;
let db: IDBDatabase;

export function uid(): string {
  return crypto.randomUUID();
}

/**
 * Initializes the IndexedDB instance and creates object stores if missing.
 */
export function openDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    
    req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const target = e.target as IDBOpenDBRequest;
      db = target.result;
      
      // Store for Unit objects (keyed by their uid)
      if (!db.objectStoreNames.contains("units")) {
        db.createObjectStore("units", { keyPath: "uid" });
      }
      // Store for general configuration/setup
      if (!db.objectStoreNames.contains('setup')) {
        db.createObjectStore('setup');
      }
    };

    req.onsuccess = (e: Event) => {
      const target = e.target as IDBOpenDBRequest;
      db = target.result;
      resolve();
    };

    req.onerror = (e: Event) => {
      const target = e.target as IDBOpenDBRequest;
      reject(target.error);
    };
  });
}

/**
 * Helper to create a transaction and access a specific object store.
 */
function tx(store: StoreName, mode: IDBTransactionMode = "readonly"): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store);
}

/**
 * Generic wrapper for IDBRequest to return a typed Promise.
 */
function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- CRUD Operations using api.ts interfaces ---

/** Retrieves a single record by its key */
export const dbGet = <T>(store: StoreName, key: IDBValidKey): Promise<T> => 
  idbRequest(tx(store).get(key));

/** Retrieves all records from a store (e.g., all Units) */
export const dbGetAll = <T>(store: StoreName): Promise<T[]> => 
  idbRequest(tx(store).getAll());

/** Updates or inserts a record */
export const dbPut = <T>(store: StoreName, val: T, key?: IDBValidKey): Promise<IDBValidKey> => 
  idbRequest(tx(store, "readwrite").put(val, key));

/** Adds a new record (fails if key exists) */
export const dbAdd = <T>(store: StoreName, val: T): Promise<IDBValidKey> => 
  idbRequest(tx(store, "readwrite").add(val));

/** Deletes a record by its key */
export const dbDel = (store: StoreName, key: IDBValidKey): Promise<undefined> => 
  idbRequest(tx(store, "readwrite").delete(key));

// --- Specific Implementations ---

/**
 * Standard debounce utility for high-frequency saves.
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Fetches the setup configuration using the Setup interface from api.ts
 */
export async function getSetup(): Promise<Setup | undefined> {
  return dbGet<Setup>('setup', 'config');
}

/**
 * Saves the setup configuration using the Setup interface from api.ts
 */
export async function saveSetup(setupData: Setup): Promise<IDBValidKey> {
  return dbPut<Setup>('setup', setupData, 'config');
}

// TODO: Put default species in a configuration location
export const defaultSpecies: Species[] = [
  {code:"DF", name:"Douglas-fir"    , bark:0.9},
  {code:'WH', name:'Western hemlock', bark:0.9},
  {code:'SS', name:'Sitka spruce'   , bark:0.9},
  {code:'NF', name:'Noble fir'      , bark:0.9},
  {code:'RA', name:'Red alder'      , bark:0.9},
  {code:'BM', name:'Bigleaf maple'  , bark:0.9},
  {code:'OC', name:'Other conifer'  , bark:0.9},
  {code:'OH', name:'Other hardwood' , bark:0.9},
];
