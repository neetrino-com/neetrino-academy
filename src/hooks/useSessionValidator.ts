'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SessionValidatorOptions {
  checkInterval?: number // миллисекунды
  onSessionInvalid?: () => void
  disabled?: boolean
}

export function useSessionValidator(options: SessionValidatorOptions = {}) {
  const { 
    checkInterval = 30000, // 30 секунд
    onSessionInvalid,
    disabled = false 
  } = options
  
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const lastCheckRef = useRef<number>(0)

  const validateSession = async (): Promise<boolean> => {
    if (!session?.user?.id || status !== 'authenticated') {
      return true // Не валидируем если нет сессии
    }

    const now = Date.now()
    if (now - lastCheckRef.current < 10000) { // минимум 10 сек между проверками
      return true
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
        return false
      }

      const data = await response.json()
      
      if (!data.valid) {
        console.log('[SessionValidator] Session is invalid:', data.reason)
        return false
      }

      console.log('[SessionValidator] Session is valid')
      return true

    } catch (error) {
      console.error('[SessionValidator] Error validating session:', error)
      return true // В случае ошибки сети не разлогиниваем
    } finally {
      setIsValidating(false)
    }
  }

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

  useEffect(() => {
    if (disabled || status !== 'authenticated' || !session?.user?.id) {
      return
    }

    // Немедленная проверка при загрузке
    validateSession().then(isValid => {
      if (!isValid) {
        handleInvalidSession()
      }
    })

    // Периодическая проверка
    intervalRef.current = setInterval(async () => {
      const isValid = await validateSession()
      if (!isValid) {
        handleInvalidSession()
      }
    }, checkInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session, status, disabled, checkInterval])

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
  }, [session, status, disabled])

  return {
    isValidating,
    validateSession,
    isAuthenticated: status === 'authenticated' && !!session?.user
  }
}
