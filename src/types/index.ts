import { Role } from "@prisma/client"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  nom: string
  prenom?: string
}

export interface JwtPayload {
  id: string
  email: string
  role: Role
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}