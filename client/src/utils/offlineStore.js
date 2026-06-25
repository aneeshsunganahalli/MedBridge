// IndexedDB backed offline storage for medical snapshot
// Includes local Web Crypto API encryption (AES-GCM) so data isn't in plain text on disk.

const DB_NAME = 'MedBridgeOffline';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
const KEY_NAME = 'encryption_key';

// -- IndexedDB Helpers --
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function getFromDB(key) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function putInDB(key, value) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

function deleteFromDB(key) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

// -- Crypto Helpers --
async function getOrGenerateKey() {
  let storedKey = await getFromDB(KEY_NAME);
  if (!storedKey) {
    storedKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    await putInDB(KEY_NAME, storedKey);
  }
  return storedKey;
}

async function encryptData(data) {
  const key = await getOrGenerateKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return { iv, encryptedBuffer };
}

async function decryptData(iv, encryptedBuffer) {
  const key = await getOrGenerateKey();
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBuffer
  );
  const decoded = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decoded);
}

// -- Public API --

export async function saveSnapshot(patientData) {
  try {
    const payload = {
      data: patientData,
      timestamp: new Date().toISOString()
    };
    const encrypted = await encryptData(payload);
    await putInDB('current_snapshot', encrypted);
    return true;
  } catch (error) {
    console.error('Failed to save offline snapshot:', error);
    return false;
  }
}

export async function loadSnapshot() {
  try {
    const encrypted = await getFromDB('current_snapshot');
    if (!encrypted) return null;
    const decrypted = await decryptData(encrypted.iv, encrypted.encryptedBuffer);
    return decrypted;
  } catch (error) {
    console.error('Failed to load offline snapshot:', error);
    return null;
  }
}

export async function clearSnapshot() {
  try {
    await deleteFromDB('current_snapshot');
    await deleteFromDB(KEY_NAME);
  } catch (error) {
    console.error('Failed to clear offline snapshot:', error);
  }
}

export function isOffline() {
  return !navigator.onLine;
}
