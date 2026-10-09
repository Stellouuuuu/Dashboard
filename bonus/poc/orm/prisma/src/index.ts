import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mock = { name: "city_temperature", config: JSON.stringify({ city: "Paris", unit: "C" }) };
console.log("Widget stored:", mock);

const inserted = await prisma.widget.create({ data: mock });
const reread = await prisma.widget.findUnique({ where: { id: inserted.id } });

console.log("Widget read back:", reread);

await prisma.$disconnect();
