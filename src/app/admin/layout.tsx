import { ReactNode } from 'react'
import { AdminLayout } from '@/components/layouts/AdminLayout'

export default function AdminLayoutWrapper({
  children,
}: {
  children: ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
