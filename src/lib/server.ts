import { useSession } from "vinxi/http";
import { db } from "./db";
import { randomInt, hash } from 'crypto'

export function validateUsername(username: unknown) {
  if (typeof username !== "string" || username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
}

export function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}

export function hashPassword(password: string) {
  console.log(hash('sha256', password))
  return hash('sha256', password)
}

export async function login(username: string, password: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user || hashPassword(password) !== user.passwordHash) throw new Error("Invalid login");
  return user;
}

export async function logout() {
  const session = await getSession();
  await session.update(d => (d.userId = undefined));
}

export async function register(username: string, password: string) {
  const existingUser = await db.user.findUnique({ where: { username } });
  if (existingUser) throw new Error("User already exists");
  return db.user.create({
    data: { username: username, passwordHash: hashPassword(password) }
  });
}

export function getSession() {
  return useSession({
    password: process.env.SESSION_SECRET ?? "areallylongsecretthatyoushouldreplace"
  });
}

export function generateOTP() {
  const digits = '0123456789'
  let otp = ''

  for (let i = 0; i < 6; i++) {
    otp += digits[randomInt(0, digits.length)]
  }

  return otp
}
