import { prisma } from "./lib/prisma.js";

async function checkStatus() {
  try {
    const email = await prisma.email.findUnique({
      where: {
        id: "cmvz7h9jn0003uk78270e0ooj",
      },
    });

    console.log("Email status:", email?.status);
    console.log("Sent at:", email?.sentAt);
    console.log("Attempts:", email?.attempts);
  } finally {
    await prisma.$disconnect();
  }
}

void checkStatus();