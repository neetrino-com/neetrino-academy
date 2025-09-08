'use client'

import { useSessionValidator } from '@/hooks/useSessionValidator'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SessionGuardProps {
  children: React.ReactNode
}

export default function SessionGuard({ children }: SessionGuardProps) {
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Определяем тип страницы для оптимизации
  const getPageType = (): 'admin' | 'student' | 'public' => {
    if (!isClient) return 'public' // На сервере всегда считаем публичной страницей
    if (pathname.startsWith('/admin')) return 'admin'
    if (pathname.startsWith('/dashboard') || 
        pathname.startsWith('/assignments') ||
        pathname.startsWith('/calendar') ||
        pathname.startsWith('/courses') ||
        pathname.startsWith('/lectures')) return 'student'
    return 'public'
  }

  const pageType = getPageType()
  const shouldValidate = pageType !== 'public' && isClient

  const { isValidating } = useSessionValidator({
    disabled: !shouldValidate,
    pageType: pageType,
    onSessionInvalid: () => {
      // Показываем уведомление пользователю
      if (typeof window !== 'undefined') {
        console.log('[SessionGuard] Session invalidated - user will be redirected')
        
        // Можно показать toast или модалку
        alert('Ваша сессия недействительна. Вы будете перенаправлены на страницу входа.')
      }
    }
  })

  // Показываем индикатор загрузки при проверке сессии
  if (isValidating && shouldValidate) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-blue-100 border border-blue-300 text-blue-800 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Проверка сессии...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
