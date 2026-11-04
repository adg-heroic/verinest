import { prisma } from "../config/database.js";

export function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: { account: true }
  });
}

export async function createUser({ name, email, passwordHash }) {
  return prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash
      }
    });

    await tx.account.create({
      data: { userId: user.id, balance: 0, currency: "USD" }
    });

    return user;
  });
}