/// <reference types="node" />
import 'dotenv/config'; // загружает переменные из .env в process.env

// Читает переменную окружения. Если её нет, сразу падает с понятным сообщением,
// а не подставляет undefined в запрос
export function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Переменная окружения ${name} не задана. Скопируйте .env.example в .env`);
  }
  return value;
}