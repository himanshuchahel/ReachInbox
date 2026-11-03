
import { prisma } from "./lib/prisma.js";

async function getTestData() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        senders: {
          where: { isActive: true },
          select: {
            id: true,
            email: true,
          },
        },
      },
      take: 5,
    });

    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

void getTestData();
