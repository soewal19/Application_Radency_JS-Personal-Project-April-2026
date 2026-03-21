/**
 * @module Whitelist Configuration
 * @description Список разрешённых хостов для взаимодействия фронтенда и бэкэнда
 * Принцип безопасности: Zero Trust Network
 */

export const ALLOWED_ORIGINS: readonly string[] = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://events-app.example.com',
  'https://api.events-app.example.com',
  'https://application-frontend-fjji.onrender.com',
  'https://application-backend-54iw.onrender.com',
] as const;

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const isAllowedOrigin = (origin: string): boolean => {
  return ALLOWED_ORIGINS.includes(origin);
};
