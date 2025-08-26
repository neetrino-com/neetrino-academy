import { create } from 'zustand'
import { AppState, UserWithEnrollments, CourseWithModules } from '@/types'

interface AppStore extends AppState {
  // Actions
  setUser: (user: UserWithEnrollments | null) => void
  setCurrentCourse: (course: CourseWithModules | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  logout: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  user: null,
  currentCourse: null,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setCurrentCourse: (course) => set({ currentCourse: course }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  logout: () => set({ user: null, currentCourse: null, error: null }),
}))
