'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PublicHeader } from './PublicHeader'
import { AppHeader } from './AppHeader'

export function DynamicHeader() {
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Показываем заглушку на сервере для предотвращения несоответствия гидратации
  if (!isClient) {
    return <PublicHeader />
  }

  // Приложение (дашборд + админ-панель) - все маршруты начинающиеся с /app
  if (pathname.startsWith('/app')) {
    return <AppHeader />
  }

  // Страницы приложения без префикса /app (для совместимости)
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/dashboard/assignments') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/lectures') ||
    pathname.startsWith('/checklist') ||
    (pathname.startsWith('/courses/') && pathname.split('/').length > 2) // Детальные страницы курсов
  ) {
    return <AppHeader />
  }

  // Публичные страницы (главная, о нас, контакты, список курсов)
  return <PublicHeader />
}
