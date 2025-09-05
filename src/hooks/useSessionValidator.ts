'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SessionValidatorOptions {
  checkInterval?: number // миллисекунды
  onSessionInvalid?: () => void
  disabled?: boolean
  pageType?: 'admin' | 'student' | 'public' // тип страницы для оптимизации
}

export function useSessionValidator(options: SessionValidatorOptions = {}) {
  const { 
    checkInterval = 600000, // 10 минут по умолчанию
    onSessionInvalid,
    disabled = false,
    pageType = 'student'
  } = options
  
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const lastCheckRef = useRef<number>(0)
  const cacheRef = useRef<{ valid: boolean; timestamp: number } | null>(null)
  const activityTimeoutRef = useRef<NodeJS.Timeout>()
  const lastActivityRef = useRef<number>(0)

  const validateSession = useCallback(async (forceCheck = false): Promise<boolean> => {
    if (!session?.user?.id || status !== 'authenticated') {
      return true // Не валидируем если нет сессии
    }

    const now = Date.now()
    
    // Проверяем кэш (действителен 3 минуты)
    if (!forceCheck && cacheRef.current && (now - cacheRef.current.timestamp) < 180000) {
      return cacheRef.current.valid
    }

    // Минимум 30 секунд между проверками (увеличили с 10 сек)
    if (!forceCheck && now - lastCheckRef.current < 30000) {
      return cacheRef.current?.valid ?? true
    }

    try {
      setIsValidating(true)
      lastCheckRef.current = now

      console.log('[SessionValidator] Checking session validity...')

      // Проверяем через API существование пользователя
      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session.user.id,
          timestamp: now 
        })
      })

      if (!response.ok) {
        console.log('[SessionValidator] Session validation failed')
        cacheRef.current = { valid: false, timestamp: now }
        return false
      }

      const data = await response.json()
      
      if (!data.valid) {
        console.log('[SessionValidator] Session is invalid:', data.reason)
        cacheRef.current = { valid: false, timestamp: now }
        return false
      }

      console.log('[SessionValidator] Session is valid')
      cacheRef.current = { valid: true, timestamp: now }
      return true

    } catch (error) {
      console.error('[SessionValidator] Error validating session:', error)
      return cacheRef.current?.valid ?? true // В случае ошибки используем кэш
    } finally {
      setIsValidating(false)
    }
  }, [session, status])

  const handleInvalidSession = async () => {
    console.log('[SessionValidator] Handling invalid session - signing out')
    
    // Вызываем пользовательский обработчик
    if (onSessionInvalid) {
      onSessionInvalid()
    } else {
      // По умолчанию - разлогиниваем и редиректим
      await signOut({ redirect: false })
      router.push('/login?reason=session_invalid')
    }
  }

  // Отслеживание активности пользователя
  const handleUserActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now

    // Очищаем предыдущий таймаут
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current)
    }

    // Проверяем сессию через 2 минуты после последней активности
    activityTimeoutRef.current = setTimeout(() => {
      if (pageType === 'admin' || pageType === 'student') {
        validateSession(true) // Принудительная проверка
      }
    }, 120000) // 2 минуты
  }, [pageType, validateSession])

  useEffect(() => {
    if (disabled || status !== 'authenticated' || !session?.user?.id) {
      return
    }

    // Определяем интервал в зависимости от типа страницы
    const getCheckInterval = () => {
      switch (pageType) {
        case 'admin': return 300000 // 5 минут для админки
        case 'student': return 600000 // 10 минут для студентов
        case 'public': return 0 // не проверяем публичные страницы
        default: return checkInterval
      }
    }

    const interval = getCheckInterval()

    // Немедленная проверка при загрузке
    validateSession().then(isValid => {
      if (!isValid) {
        handleInvalidSession()
      }
    })

    // Периодическая проверка только если интервал > 0
    if (interval > 0) {
      intervalRef.current = setInterval(async () => {
        const isValid = await validateSession()
        if (!isValid) {
          handleInvalidSession()
        }
      }, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session, status, disabled, checkInterval, pageType, validateSession])

  // Проверка при фокусе окна (пользователь вернулся к вкладке)
  useEffect(() => {
    if (disabled || status !== 'authenticated') return

    const handleFocus = () => {
      validateSession().then(isValid => {
        if (!isValid) {
          handleInvalidSession()
        }
      })
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [session, status, disabled, validateSession])

  // Отслеживание активности пользователя
  useEffect(() => {
    if (disabled || status !== 'authenticated' || pageType === 'public') return

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
    }
  }, [disabled, status, pageType, handleUserActivity])

  return {
    isValidating,
    validateSession,
    isAuthenticated: status === 'authenticated' && !!session?.user
  }
}
