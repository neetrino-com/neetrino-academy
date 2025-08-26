import { User, Course, Module, Lesson, Assignment, Submission, Enrollment, Message, Achievement } from '@prisma/client'

// Расширенные типы с включенными связями
export type UserWithEnrollments = User & {
  enrollments: Enrollment[]
  achievements: Achievement[]
}

export type CourseWithModules = Course & {
  modules: Module[]
  enrollments: Enrollment[]
}

export type ModuleWithLessons = Module & {
  lessons: Lesson[]
  assignments: Assignment[]
}

export type LessonWithProgress = Lesson & {
  progress: {
    completed: boolean
    progress: number
  }[]
}

export type AssignmentWithSubmissions = Assignment & {
  submissions: Submission[]
}

// Типы для форм
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface CourseFormData {
  title: string
  description: string
  direction: 'WORDPRESS' | 'VIBE_CODING' | 'SHOPIFY'
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  price?: number
}

export interface ModuleFormData {
  title: string
  description: string
  order: number
}

export interface LessonFormData {
  title: string
  content: string
  videoUrl?: string
  duration?: number
  order: number
}

export interface AssignmentFormData {
  title: string
  description: string
  dueDate?: Date
}

// Типы для API ответов
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Типы для состояния приложения
export interface AppState {
  user: UserWithEnrollments | null
  currentCourse: CourseWithModules | null
  isLoading: boolean
  error: string | null
}

// Типы для навигации
export interface NavigationItem {
  title: string
  href: string
  icon?: string
  children?: NavigationItem[]
}

// Типы для дашборда
export interface DashboardStats {
  totalCourses: number
  enrolledCourses: number
  completedLessons: number
  totalLessons: number
  assignmentsSubmitted: number
  totalAssignments: number
  achievements: number
}

// Типы для прогресса
export interface ProgressData {
  courseId: string
  courseTitle: string
  progress: number
  completedLessons: number
  totalLessons: number
  lastActivity: Date
}
