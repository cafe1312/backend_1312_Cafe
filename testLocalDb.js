const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allCompleted = await prisma.order.findMany({
    where: { status: 'COMPLETED' },
    select: { totalAmount: true }
  });
  const total = allCompleted.reduce((sum, o) => sum + o.totalAmount, 0);
  console.log("Local Completed Orders Sum:", total);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
