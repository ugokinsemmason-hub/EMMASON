/* ╔══════════════════════════════════════════════════════╗
   ║  ETS Ugokins — IndexedDB Storage Layer               ║
   ║  Replaces localStorage for reliable mobile storage   ║
   ╚══════════════════════════════════════════════════════╝

   HOW IT WORKS:
   1. App starts → loads all data from IndexedDB into memory
   2. All READS use in-memory cache (instant, synchronous)
   3. All WRITES update memory AND save to IndexedDB
   4. First time only: migrates old localStorage data across
*/

const DB_NAME    = 'ets-ugokins-db';
const DB_VERSION = 1;
const STORE      = 'app-data';

/* ── In-memory cache (fast synchronous reads) ── */
const DB_CACHE = {
  stock_products: [],
  inv_records:    [],
  rcpt_records:   []
};

let _db = null;

/* ── Open IndexedDB ── */
function _openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'key' });
      }
    };

    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

/* ── Read one key from IndexedDB ── */
function _dbGet(key) {
  return new Promise((resolve, reject) => {
    const tx  = _db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror   = () => reject(req.error);
  });
}

/* ── Write one key to IndexedDB ── */
function _dbSet(key, value) {
  return new Promise((resolve, reject) => {
    const tx  = _db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/* ── Migrate old localStorage data (runs once) ── */
async function _migrateFromLocalStorage() {
  const keys = ['stock_products', 'inv_records', 'rcpt_records'];
  for (const key of keys) {
    const existing = await _dbGet(key);
    if (existing === null) {
      // Nothing in IndexedDB yet — check localStorage
      try {
        const old = localStorage.getItem(key);
        if (old) {
          const parsed = JSON.parse(old);
          await _dbSet(key, parsed);
          console.log(`Migrated ${key} from localStorage → IndexedDB`);
        }
      } catch (e) {
        console.warn(`Migration failed for ${key}:`, e);
      }
    }
  }
}

/* ── Load all data into memory cache ── */
async function _loadAllIntoCache() {
  const keys = ['stock_products', 'inv_records', 'rcpt_records'];
  for (const key of keys) {
    try {
      const val = await _dbGet(key);
      if (val !== null) {
        DB_CACHE[key] = Array.isArray(val) ? val : [];
      }
    } catch (e) {
      console.warn(`Failed to load ${key}:`, e);
      DB_CACHE[key] = [];
    }
  }
}

/* ── PUBLIC: Initialize DB (call once on startup) ── */
async function initDB() {
  try {
    _db = await _openDB();
    await _migrateFromLocalStorage();
    await _loadAllIntoCache();
    console.log('✅ IndexedDB ready. Data loaded into memory.');
  } catch (e) {
    console.error('IndexedDB failed, using memory only:', e);
  }
}

/* ── PUBLIC: Get data from cache (synchronous) ── */
function dbGetCached(key) {
  return DB_CACHE[key] || [];
}

/* ── PUBLIC: Save data to cache + IndexedDB ── */
function dbSave(key, value) {
  DB_CACHE[key] = value;
  if (_db) {
    _dbSet(key, value).catch(e => console.error(`dbSave failed for ${key}:`, e));
  }
}

/* ── DB_READY promise — app waits for this before rendering ── */
const DB_READY = initDB();