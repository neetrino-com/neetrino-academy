import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const { id: courseId } = await params
    
    // Получаем пользователя по email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }
    
    const userId = user.id

    // Проверяем, существует ли курс
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Курс не найден" },
        { status: 404 }
      )
    }

    // Проверяем, не записан ли уже пользователь на курс
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Вы уже записаны на этот курс" },
        { status: 400 }
      )
    }

    // Создаем запись на курс
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE',
        paymentStatus: 'PENDING'
      },
      include: {
        course: {
          select: {
            title: true,
            description: true,
            paymentType: true,
            monthlyPrice: true,
            totalPrice: true,
            duration: true,
            durationUnit: true
          }
        }
      }
    })

    // Проверяем, нужна ли оплата
    const coursePrice = parseFloat(course.price?.toString() || '0')
    const needsPayment = coursePrice > 0

    if (needsPayment) {
      // Автоматически создаем платежи в зависимости от типа оплаты курса
      if (course.paymentType === 'ONE_TIME') {
        // Для разовой оплаты - создаем один платеж на полную стоимость
        await prisma.payment.create({
          data: {
            userId,
            courseId,
            amount: coursePrice,
            currency: course.currency || 'RUB',
            status: 'PENDING',
            paymentType: 'ONE_TIME',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней на оплату
            notes: 'Разовая оплата за весь курс'
          }
        })
      } else if (course.paymentType === 'MONTHLY') {
        // Для ежемесячной оплаты - создаем первый платеж
        const monthlyAmount = course.monthlyPrice || coursePrice
        const firstPayment = await prisma.payment.create({
          data: {
            userId,
            courseId,
            amount: monthlyAmount,
            currency: course.currency || 'RUB',
            status: 'PENDING',
            paymentType: 'MONTHLY',
            monthNumber: 1,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней на оплату
            notes: `Ежемесячный платеж 1/${course.duration || 1}`
          }
        })

        // Обновляем запись на курс с датой следующего платежа
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            nextPaymentDue: firstPayment.dueDate
          }
        })
      }
    } else {
      // Для бесплатных курсов - сразу активируем доступ
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          paymentStatus: 'COMPLETED'
        }
      })
    }

    return NextResponse.json({
      message: "Вы успешно записались на курс",
      enrollment,
      paymentRequired: needsPayment,
      paymentType: course.paymentType
    }, { status: 201 })
  } catch (error) {
    console.error("Error enrolling in course:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
