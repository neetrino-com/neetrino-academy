import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12)

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STUDENT"
      }
    })

    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        message: "Пользователь успешно зарегистрирован",
        user: userWithoutPassword 
      },
      { status: 201 }
    )
         } catch (error) {
         if (error instanceof z.ZodError) {
           return NextResponse.json(
             { error: "Неверные данные", details: error.errors },
             { status: 400 }
           )
         }

    console.error("Registration error:", error)
    
    // Более подробная обработка ошибок
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Внутренняя ошибка сервера" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
