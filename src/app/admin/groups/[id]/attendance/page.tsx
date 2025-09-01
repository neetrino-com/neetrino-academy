'use client'

import AttendanceJournal from '@/components/admin/AttendanceJournal'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function GroupAttendancePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const groupId = params?.id as string

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={() => router.push('/admin/groups')}
          className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" /> Назад к группам
        </button>
      </div>
      <AttendanceJournal groupId={groupId} />
    </div>
  )
}


