import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { securityLogger } from "@/lib/security-logger"
// import { User } from "@prisma/client" // Не используется

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          // Логируем попытку входа без учетных данных
          securityLogger.logLoginAttempt(
            credentials?.email || 'unknown',
            false,
            'Отсутствуют учетные данные',
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
          )
          return null
        }

        const email = credentials.email as string
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown'

        // Проверяем, не заблокирован ли IP
        if (securityLogger.isIPBlocked(ipAddress)) {
          securityLogger.logLoginAttempt(
            email,
            false,
            `IP заблокирован: ${ipAddress}`,
            ipAddress
          )
          return null
        }

        // Проверяем, не заблокирован ли пользователь
        if (securityLogger.isLoginBlocked(email)) {
          securityLogger.logLoginAttempt(
            email,
            false,
            'Превышен лимит попыток входа',
            ipAddress
          )
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: email
            }
          })

          if (!user || !user.password) {
            // Логируем неудачную попытку входа
            securityLogger.logLoginAttempt(
              email,
              false,
              'Пользователь не найден или пароль отсутствует',
              ipAddress
            )
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            // Логируем неудачную попытку входа
            securityLogger.logLoginAttempt(
              email,
              false,
              'Неверный пароль',
              ipAddress
            )
            return null
          }

          // Проверяем, активен ли пользователь
          if (!user.isActive) {
            securityLogger.logLoginAttempt(
              email,
              false,
              'Пользователь деактивирован',
              ipAddress
            )
            return null
          }

          // Логируем успешный вход
          securityLogger.logLoginAttempt(
            email,
            true,
            'Успешный вход в систему',
            ipAddress
          )

          // Обновляем время последнего входа
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          // Логируем ошибку при аутентификации
          securityLogger.logLoginAttempt(
            email,
            false,
            `Ошибка при аутентификации: ${error}`,
            ipAddress
          )
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // При входе устанавливаем базовые поля
      if (user) {
        token.role = (user as any).role
        token.id = (user as any).id
        return token
      }

      // На каждый запрос проверяем, существует ли пользователь и активен ли он
      try {
        if (token?.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, role: true, isActive: true }
          })

          // Если пользователь удалён или деактивирован — обнуляем токен
          if (!dbUser || !dbUser.isActive) {
            return {}
          }

          token.role = dbUser.role
        }
      } catch (e) {
        // В случае ошибки в БД считаем токен недействительным
        return {}
      }

      return token
    },
    async session({ session, token }) {
      // Если токен пустой/недействительный — сессии нет
      if (!token?.id) {
        return null as any
      }
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    },
    async signOut({ session, token }) {
      // Логируем выход из системы
      if (session?.user) {
        securityLogger.logEvent({
          eventType: 'LOGOUT',
          userId: session.user.id,
          userEmail: session.user.email || '',
          userRole: session.user.role || '',
          status: 'SUCCESS',
          details: 'Выход из системы',
          riskLevel: 'LOW'
        })
      }
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Дополнительное логирование при входе
      if (user && isNewUser) {
        securityLogger.logEvent({
          eventType: 'LOGIN_SUCCESS',
          userId: user.id,
          userEmail: user.email || '',
          userRole: user.role || '',
          status: 'SUCCESS',
          details: 'Первый вход нового пользователя',
          riskLevel: 'LOW'
        })
      }
    }
  }
})
