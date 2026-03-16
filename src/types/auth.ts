/**
 * @module Auth Types
 * @description DTO и интерфейсы для аутентификации
 */

export interface IUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}
