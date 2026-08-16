import { PrismaClient, Role, EventType, ReservationMode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Idempotente: usa upsert por email/id fixo, então rodar várias vezes
// não duplica os dados de teste exigidos pela avaliação.
async function main() {
  const passwordHash = await bcrypt.hash("senha123", 10);

  const organizer = await prisma.user.upsert({
    where: { email: "organizador@teste.com" },
    update: {},
    create: {
      name: "Organizador Teste",
      email: "organizador@teste.com",
      passwordHash,
      role: Role.ORGANIZER,
    },
  });

  const client1 = await prisma.user.upsert({
    where: { email: "cliente1@teste.com" },
    update: {},
    create: {
      name: "Cliente Um",
      email: "cliente1@teste.com",
      passwordHash,
      role: Role.CLIENT,
    },
  });

  await prisma.user.upsert({
    where: { email: "cliente2@teste.com" },
    update: {},
    create: {
      name: "Cliente Dois",
      email: "cliente2@teste.com",
      passwordHash,
      role: Role.CLIENT,
    },
  });

  await prisma.user.upsert({
    where: { email: "portaria@teste.com" },
    update: {},
    create: {
      name: "Usuário Portaria",
      email: "portaria@teste.com",
      passwordHash,
      role: Role.GATE,
    },
  });

  const event = await prisma.event.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Show de Teste — Banda Exemplo",
      type: EventType.SHOW,
      description: "Evento semeado para fins de avaliação do desafio.",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // daqui a 30 dias
      location: "Arena Exemplo, Rio de Janeiro",
      capacity: 100,
      price: 150.0,
      reservationMode: ReservationMode.QUANTITY,
      organizerId: organizer.id,
    },
  });

  console.log("Seed concluído:");
  console.log({ organizer: organizer.email, client1: client1.email, event: event.title });
}

main()
  .catch((error) => {
    console.error("Erro ao rodar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
