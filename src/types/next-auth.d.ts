import 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    id: string
  }
  
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: string
    }
  }
}
