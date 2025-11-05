import { useState, useEffect } from 'react'
import * as db from './db'
import './App.css'

function App() {
  const [memos, setMemos] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  // 초기 로드
  useEffect(() => {
    loadMemos()
  }, [])

  // 다크 모드
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // PWA 설치 프롬프트
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const loadMemos = async () => {
    try {
      setIsLoading(true)
      const loadedMemos = await db.getAllMemos()
      setMemos(loadedMemos)
    } catch (err) {
      console.error('메모 로드 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const addMemo = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      alert('메모를 입력하세요!')
      return
    }

    try {
      const newMemo = {
        id: Date.now(),
        content: trimmed,
        createdAt: Date.now()
      }
      await db.addMemo(newMemo)
      setMemos([newMemo, ...memos])
      setInputValue('')
    } catch (err) {
      alert('메모 추가 실패!')
    }
  }

  const deleteMemo = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await db.deleteMemo(id)
      setMemos(memos.filter(m => m.id !== id))
    } catch (err) {
      alert('삭제 실패!')
    }
  }

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return '방금 전'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`
    return `${Math.floor(seconds / 86400)}일 전`
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 헤더 */}
      <header className="bg-indigo-600 dark:bg-indigo-900 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">📱 나의 첫 PWA v2</h1>
            <p className="text-sm text-indigo-200">메모를 작성해보세요</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            {showInstallButton && (
              <button
                onClick={handleInstall}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium"
              >
                ⬇️ 설치
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-2xl mx-auto p-4">
        {/* 입력 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="메모를 입력하세요..."
            className="w-full p-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-none"
            rows="3"
          />
          <button
            onClick={addMemo}
            className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium"
          >
            ➕ 메모 추가
          </button>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : memos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p>아직 메모가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memos.map((memo) => (
              <div
                key={memo.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition"
              >
                <div className="flex justify-between gap-3">
                  <p className="flex-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {memo.content}
                  </p>
                  <button
                    onClick={() => deleteMemo(memo.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-8 h-8 rounded-full"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {getTimeAgo(memo.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}

        {memos.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            총 {memos.length}개의 메모
          </p>
        )}
      </main>
    </div>
  )
}

export default App
