// Базовые типы для приложения
export interface User {
  id: string
  email: string
  name?: string | null
  role: string
  avatar?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Course {
  id: string
  title: string
  description?: string | null
  slug: string
  direction: string
  level: string
  price?: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Module {
  id: string
  title: string
  description?: string | null
  order: number
  courseId: string
  createdAt: Date
  updatedAt: Date
}

export interface Lesson {
  id: string
  title: string
  content?: string | null
  videoUrl?: string | null
  duration?: number | null
  order: number
  moduleId: string
  createdAt: Date
  updatedAt: Date
}

export interface Assignment {
  id: string
  title: string
  description?: string | null
  dueDate?: Date | null
  moduleId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Submission {
  id: string
  userId: string
  assignmentId: string
  content?: string | null
  fileUrl?: string | null
  score?: number | null
  feedback?: string | null
  submittedAt: Date
  gradedAt?: Date | null
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  status: string
  enrolledAt: Date
}

export interface Message {
  id: string
  content: string
  userId: string
  courseId?: string | null
  createdAt: Date
}

export interface Achievement {
  id: string
  userId: string
  type: string
  title: string
  description?: string | null
  earnedAt: Date
}

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
export interface ApiResponse<T = unknown> {
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
