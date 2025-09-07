'use client'

import AttendanceJournal from '@/components/admin/AttendanceJournal'
import { useParams } from 'next/navigation'

export default function GroupAttendancePage() {
  const params = useParams<{ id: string }>()
  const groupId = params?.id as string

  return <AttendanceJournal groupId={groupId} />
}


