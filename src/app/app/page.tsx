import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AppPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Перенаправляем пользователя в зависимости от роли
  if (session.user.role === 'STUDENT') {
    redirect('/app/dashboard')
  } else if (session.user.role === 'TEACHER' || session.user.role === 'ADMIN') {
    redirect('/app/admin')
  }

  // Fallback
  redirect('/dashboard')
}
