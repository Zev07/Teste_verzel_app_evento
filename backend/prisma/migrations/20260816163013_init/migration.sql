-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ORGANIZER', 'CLIENT', 'GATE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SHOW', 'MOVIE');

-- CreateEnum
CREATE TYPE "ReservationMode" AS ENUM ('QUANTITY', 'SEAT_MAP');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'PAID', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('VALID', 'USED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "external_id" TEXT,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "reservation_mode" "ReservationMode" NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "total_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "seat_id" TEXT,
    "qr_token" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'VALID',
    "used_at" TIMESTAMP(3),
    "validated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "method" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_shares" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "seats_event_id_label_key" ON "seats"("event_id", "label");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_seat_id_key" ON "tickets"("seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qr_token_key" ON "tickets"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reservation_id_key" ON "payments"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_shares_token_key" ON "ticket_shares"("token");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_shares" ADD CONSTRAINT "ticket_shares_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
