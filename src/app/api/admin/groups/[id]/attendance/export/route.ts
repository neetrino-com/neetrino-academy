import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { format, dateRange, events } = await request.json()

    // Получаем данные группы
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Получаем события с фильтрацией по дате
    let dateFilter = {}
    if (dateRange === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      dateFilter = { startDate: { gte: weekAgo } }
    } else if (dateRange === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      dateFilter = { startDate: { gte: monthAgo } }
    }

    const eventsData = await prisma.event.findMany({
      where: {
        groupId: id,
        ...dateFilter,
        ...(events && events.length > 0 ? { id: { in: events } } : {})
      },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    })

    if (format === 'csv') {
      // Генерируем CSV
      const csvHeaders = ['Студент', 'Email', 'Событие', 'Дата', 'Статус', 'Посещаемость (%)']
      const csvRows = []

      for (const student of group.students) {
        const totalEvents = eventsData.length
        let attendedCount = 0

        for (const event of eventsData) {
          const attendee = event.attendees.find(a => a.userId === student.user.id)
          const status = attendee?.status || 'PENDING'
          if (status === 'ATTENDED') attendedCount++

          csvRows.push([
            student.user.name,
            student.user.email,
            event.title,
            new Date(event.startDate).toLocaleDateString('ru-RU'),
            getStatusLabel(status),
            totalEvents > 0 ? Math.round((attendedCount / totalEvents) * 100) : 0
          ])
        }
      }

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="attendance_${group.name}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    if (format === 'pdf') {
      // Для PDF возвращаем JSON данные, которые можно обработать на клиенте
      const pdfData = {
        group: {
          name: group.name,
          totalStudents: group.students.length
        },
        events: eventsData.map(event => ({
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          attendees: event.attendees.map(attendee => ({
            studentName: attendee.user.name,
            studentEmail: attendee.user.email,
            status: attendee.status
          }))
        })),
        students: group.students.map(student => {
          const totalEvents = eventsData.length
          let attendedCount = 0

          eventsData.forEach(event => {
            const attendee = event.attendees.find(a => a.userId === student.user.id)
            if (attendee?.status === 'ATTENDED') attendedCount++
          })

          return {
            name: student.user.name,
            email: student.user.email,
            attendanceRate: totalEvents > 0 ? Math.round((attendedCount / totalEvents) * 100) : 0,
            attendedCount,
            totalEvents
          }
        })
      }

      return NextResponse.json(pdfData)
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting attendance data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'ATTENDED':
      return 'Присутствовал'
    case 'ABSENT':
      return 'Отсутствовал'
    case 'ATTENDING':
      return 'Планирует присутствовать'
    case 'NOT_ATTENDING':
      return 'Не планирует присутствовать'
    case 'MAYBE':
      return 'Возможно'
    default:
      return 'Не отмечено'
  }
}
