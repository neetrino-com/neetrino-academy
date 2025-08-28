import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AppAdminPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Только преподаватели и админы могут видеть админ-панель
  if (session.user.role === 'STUDENT') {
    redirect('/app/dashboard')
  }

  // Перенаправляем на существующую админ-панель
  redirect('/admin')
}
