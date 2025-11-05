// IndexedDB 헬퍼 함수들
const DB_NAME = 'MemoDB'
const DB_VERSION = 1
const STORE_NAME = 'memos'

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        console.log('✅ DB 생성 완료')
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      reject('DB 연결 실패: ' + event.target.error)
    }
  })
}

export const addMemo = async (memo) => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(memo)

    request.onsuccess = () => resolve(memo.id)
    request.onerror = (event) => reject(event.target.error)
    transaction.oncomplete = () => db.close()
  })
}

export const getAllMemos = async () => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = (event) => {
      const memos = event.target.result
      memos.sort((a, b) => b.createdAt - a.createdAt)
      resolve(memos)
    }
    request.onerror = (event) => reject(event.target.error)
    transaction.oncomplete = () => db.close()
  })
}

export const deleteMemo = async (id) => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = (event) => reject(event.target.error)
    transaction.oncomplete = () => db.close()
  })
}