'use client'

import { useState, useEffect } from 'react'

interface VideoPlayerProps {
  videoUrl: string
  title?: string
  className?: string
  onProgress?: (progress: number) => void
  onEnded?: () => void
}

export default function VideoPlayer({ 
  videoUrl, 
  title, 
  className = '',
  onProgress, // Эти пропсы пока не используются в iframe версии
  onEnded     // Эти пропсы пока не используются в iframe версии
}: VideoPlayerProps) {
  const [videoId, setVideoId] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isYouTube, setIsYouTube] = useState(false)

  useEffect(() => {
    console.log('🔍 VideoPlayer Debug:')
    console.log('  - videoUrl:', videoUrl)
    console.log('  - videoUrl type:', typeof videoUrl)
    console.log('  - videoUrl length:', videoUrl?.length)
    
    if (!videoUrl) {
      console.log('  ❌ No videoUrl provided')
      setError('URL видео не указан')
      return
    }
    
    const youtubePattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = videoUrl.match(youtubePattern)
    
    console.log('  - YouTube pattern match:', match)
    
    if (match) {
      const extractedId = match[1]
      console.log('  ✅ YouTube video ID extracted:', extractedId)
      setVideoId(extractedId)
      setIsYouTube(true)
      setError('')
    } else {
      console.log('  ❌ Not a valid YouTube URL')
      setError(`Поддерживаются только YouTube видео. Получен URL: ${videoUrl}`)
    }
  }, [videoUrl])

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-gray-600 mb-2">Ошибка загрузки видео</p>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-xs text-gray-400 mt-2">URL: {videoUrl}</p>
          <button 
            onClick={() => setError('')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  if (!videoId || !isYouTube) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка видео...</p>
          <p className="text-xs text-gray-400 mt-2">videoId: {videoId}</p>
          <p className="text-xs text-gray-400">isYouTube: {isYouTube.toString()}</p>
        </div>
      </div>
    )
  }

  // Улучшенные параметры для YouTube iframe
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=0&fs=1&iv_load_policy=3&cc_load_policy=0&origin=${encodeURIComponent(window.location.origin)}`
  console.log('🎥 Final embed URL:', embedUrl)

  return (
    <div className={`bg-black rounded-lg overflow-hidden ${className}`}>
      <div className="relative aspect-video">
        <iframe
          src={embedUrl}
          title={title || 'Видео урока'}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
      
      {title && (
        <div className="p-4 bg-white border-t">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
    </div>
  )
}
