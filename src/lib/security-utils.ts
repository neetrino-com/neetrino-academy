/**
 * Утилиты безопасности для валидации входных данных
 * Защита от XSS, инъекций и других атак
 */

/**
 * Очищает HTML-строку от потенциально опасных тегов и атрибутов
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  
  // Удаляем все HTML теги
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<input\b[^<]*>/gi, '')
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '')
    .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '')
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
    .replace(/<link\b[^<]*>/gi, '')
    .replace(/<meta\b[^<]*>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '')
}

/**
 * Валидирует email адрес
 */
export function validateEmail(email: string): boolean {
  if (!email) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Валидирует пароль на соответствие требованиям безопасности
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!password) {
    errors.push('Пароль обязателен')
    return { isValid: false, errors }
  }
  
  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну заглавную букву')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну строчную букву')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну цифру')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы один специальный символ')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Валидирует имя пользователя
 */
export function validateUsername(username: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!username) {
    errors.push('Имя пользователя обязательно')
    return { isValid: false, errors }
  }
  
  if (username.length < 3) {
    errors.push('Имя пользователя должно содержать минимум 3 символа')
  }
  
  if (username.length > 50) {
    errors.push('Имя пользователя не должно превышать 50 символов')
  }
  
  if (!/^[a-zA-Z0-9а-яА-Я_\-\s]+$/.test(username)) {
    errors.push('Имя пользователя может содержать только буквы, цифры, пробелы, дефисы и подчеркивания')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Валидирует URL
 */
export function validateUrl(url: string): boolean {
  if (!url) return false
  
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * Проверяет, не содержит ли строка SQL-инъекции
 */
export function containsSqlInjection(input: string): boolean {
  if (!input) return false
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\b\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"])/i,
    /(--|\/\*|\*\/)/,
    /(\b(WAITFOR|DELAY)\b)/i,
    /(\b(SLEEP|BENCHMARK)\b)/i
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Проверяет, не содержит ли строка XSS-атаки
 */
export function containsXSS(input: string): boolean {
  if (!input) return false
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /<iframe\b[^<]*>/gi,
    /<object\b[^<]*>/gi,
    /<embed\b[^<]*>/gi,
    /<form\b[^<]*>/gi,
    /<input\b[^<]*>/gi,
    /<textarea\b[^<]*>/gi,
    /<select\b[^<]*>/gi,
    /<button\b[^<]*>/gi
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Проверяет, не содержит ли строка команды для выполнения
 */
export function containsCommandInjection(input: string): boolean {
  if (!input) return false
  
  const commandPatterns = [
    /(\b(cmd|powershell|bash|sh|zsh|fish)\b)/i,
    /(\b(exec|eval|system|spawn|fork)\b)/i,
    /(\b(rm|del|remove|delete|format|fdisk)\b)/i,
    /(\b(net|netstat|ipconfig|ifconfig|route)\b)/i,
    /(\b(telnet|ssh|ftp|scp|rsync)\b)/i,
    /(\b(ping|traceroute|nslookup|dig)\b)/i,
    /(\b(wget|curl|lynx|links)\b)/i,
    /(\b(sudo|su|runas|psexec)\b)/i
  ]
  
  return commandPatterns.some(pattern => pattern.test(input))
}

/**
 * Полная валидация входных данных
 */
export function validateInput(input: string, options: {
  maxLength?: number
  minLength?: number
  allowHtml?: boolean
  allowSpecialChars?: boolean
  checkSqlInjection?: boolean
  checkXSS?: boolean
  checkCommandInjection?: boolean
} = {}): {
  isValid: boolean
  errors: string[]
  sanitized: string
} {
  const {
    maxLength = 1000,
    minLength = 1,
    allowHtml = false,
    allowSpecialChars = true,
    checkSqlInjection = true,
    checkXSS = true,
    checkCommandInjection = true
  } = options
  
  const errors: string[] = []
  let sanitized = input
  
  // Проверка длины
  if (input.length < minLength) {
    errors.push(`Минимальная длина: ${minLength} символов`)
  }
  
  if (input.length > maxLength) {
    errors.push(`Максимальная длина: ${maxLength} символов`)
  }
  
  // Проверка на SQL-инъекции
  if (checkSqlInjection && containsSqlInjection(input)) {
    errors.push('Обнаружена попытка SQL-инъекции')
  }
  
  // Проверка на XSS
  if (checkXSS && containsXSS(input)) {
    errors.push('Обнаружена попытка XSS-атаки')
  }
  
  // Проверка на выполнение команд
  if (checkCommandInjection && containsCommandInjection(input)) {
    errors.push('Обнаружена попытка выполнения команд')
  }
  
  // Очистка HTML
  if (!allowHtml) {
    sanitized = sanitizeHtml(input)
  }
  
  // Очистка специальных символов
  if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[!@#$%^&*(),.?":{}|<>]/g, '')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Генерирует безопасный токен
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Проверяет, не является ли IP-адрес подозрительным
 */
export function isSuspiciousIP(ip: string): boolean {
  if (!ip) return false
  
  // Проверяем на localhost и внутренние адреса
  const suspiciousPatterns = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^::1$/,
    /^fe80:/,
    /^fc00:/,
    /^fd00:/
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(ip))
}

/**
 * Проверяет User-Agent на подозрительность
 */
export function isSuspiciousUserAgent(userAgent: string): boolean {
  if (!userAgent) return false
  
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /php/i,
    /perl/i,
    /ruby/i,
    /go-http-client/i,
    /okhttp/i,
    /postman/i,
    /insomnia/i
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent))
}
