/**
 * Dummy/demo data seed script.
 *
 * IDs for the "primary" scenario (Karim Electricals / Farhan Ahmed / Ceiling
 * Fan Installation) intentionally match the default collection variables in
 * FixItNow.postman_collection.json (categoryId, technicianId, serviceId,
 * bookingId, userId) so the Postman requests work against real data with
 * zero manual variable editing.
 *
 * Run with: npm run seed
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Passw0rd!';

// ─────────────────────────────────────────────────────────────
// Fixed IDs — kept in sync with FixItNow.postman_collection.json
// ─────────────────────────────────────────────────────────────
const ADMIN_ID = '9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d';

const CAT_ELECTRICAL = '5c1a1e2a-9d3b-4a2f-8b3e-1a2b3c4d5e6f';
const CAT_PLUMBING = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const CAT_CLEANING = 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f';
const CAT_PAINTING = 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a';
const CAT_CARPENTRY = 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b';
const CAT_APPLIANCE = 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c';

const TECH_USER_1 = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'; // Karim Electricals
const TECH_PROFILE_1 = '7f2b3c4d-5e6f-4a1b-9c2d-3e4f5a6b7c8d';
const SERVICE_1 = '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f'; // Ceiling Fan Installation
const SLOT_1 = '8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d'; // booked -> BOOKING_1
const SLOT_1B = '9b0c1d2e-3f4a-4b5c-6d7e-8f9a0b1c2d3e'; // free

const TECH_USER_2 = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'; // Rahim Plumbing Works
const TECH_PROFILE_2 = 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f';
const SERVICE_2 = 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a'; // Pipe Leak Repair
const SLOT_2 = 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b';

const TECH_USER_3 = 'f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c'; // CleanPro Services
const TECH_PROFILE_3 = 'a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d';
const SERVICE_3 = 'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e'; // Deep Home Cleaning
const SLOT_3 = 'c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f';

const CUSTOMER_1 = '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e'; // Farhan Ahmed
const CUSTOMER_2 = 'd9e0f1a2-b3c4-4d5e-6f7a-8b9c0d1e2f3a'; // Nusrat Jahan
const CUSTOMER_3 = 'e0f1a2b3-c4d5-4e6f-7a8b-9c0d1e2f3a4b'; // Tanvir Hasan

const BOOKING_1 = '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a'; // ACCEPTED — ready for "Create Payment"
const BOOKING_2 = 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c'; // REQUESTED
const BOOKING_3 = 'a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d'; // DECLINED
const BOOKING_4 = 'b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e'; // IN_PROGRESS
const BOOKING_5 = '6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c'; // COMPLETED (+ review)
const BOOKING_6 = 'c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f'; // CANCELLED
const BOOKING_7 = 'd5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a'; // COMPLETED (+ review)
const BOOKING_8 = 'e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0b'; // PAID

const PAYMENT_5 = '5e6f7a8b-9c0d-4e1f-2a3b-4c5d6e7f8a9b';
const REVIEW_5 = '6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0d';

async function upsertUser(id: string, name: string, email: string, phone: string, role: Role) {
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: { id, name, phone, role, status: 'ACTIVE' },
    create: { id, name, email, phone, role, password: hashed, status: 'ACTIVE' },
  });
}

async function main() {
  // ── Admin ─────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@fixitnow.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      id: ADMIN_ID,
      name: process.env.ADMIN_NAME || 'FixItNow Admin',
      password: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      id: ADMIN_ID,
      name: process.env.ADMIN_NAME || 'FixItNow Admin',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Admin ready -> ${admin.email} / ${adminPassword}`);

  // ── Categories ────────────────────────────────────────
  const categories: [string, string, string][] = [
    [CAT_ELECTRICAL, 'Electrical', 'Wiring, fixtures, electrical repairs'],
    [CAT_PLUMBING, 'Plumbing', 'Pipe repairs, leak fixes, installations'],
    [CAT_CLEANING, 'Cleaning', 'Home and office cleaning services'],
    [CAT_PAINTING, 'Painting', 'Interior and exterior painting'],
    [CAT_CARPENTRY, 'Carpentry', 'Furniture repair and woodwork'],
    [CAT_APPLIANCE, 'Appliance Repair', 'Repair of home appliances'],
  ];
  for (const [id, name, description] of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { id, description },
      create: { id, name, description },
    });
  }
  console.log(`✅ Seeded ${categories.length} categories`);

  // ── Technicians ───────────────────────────────────────
  const karim = await upsertUser(TECH_USER_1, 'Karim Electricals', 'karim@example.com', '01822222222', 'TECHNICIAN');
  const rahim = await upsertUser(TECH_USER_2, 'Rahim Plumbing Works', 'rahim@example.com', '01833333333', 'TECHNICIAN');
  const cleanpro = await upsertUser(TECH_USER_3, 'CleanPro Services', 'cleanpro@example.com', '01844444444', 'TECHNICIAN');

  await prisma.technicianProfile.upsert({
    where: { userId: karim.id },
    update: {
      id: TECH_PROFILE_1,
      bio: '10 years of residential electrical work',
      skills: ['wiring', 'fixtures', 'panel upgrades'],
      experienceYears: 10, hourlyRate: 800, location: 'Dhaka',
      isAvailable: true,
    },
    create: {
      id: TECH_PROFILE_1, userId: karim.id,
      bio: '10 years of residential electrical work',
      skills: ['wiring', 'fixtures', 'panel upgrades'],
      experienceYears: 10, hourlyRate: 800, location: 'Dhaka',
      isAvailable: true,
    },
  });
  await prisma.technicianProfile.upsert({
    where: { userId: rahim.id },
    update: {
      id: TECH_PROFILE_2,
      bio: '7 years fixing leaks, pipe installs, and bathroom fittings',
      skills: ['leak repair', 'pipe fitting', 'drainage'],
      experienceYears: 7, hourlyRate: 650, location: 'Dhaka',
      isAvailable: true,
    },
    create: {
      id: TECH_PROFILE_2, userId: rahim.id,
      bio: '7 years fixing leaks, pipe installs, and bathroom fittings',
      skills: ['leak repair', 'pipe fitting', 'drainage'],
      experienceYears: 7, hourlyRate: 650, location: 'Dhaka',
      isAvailable: true,
    },
  });
  await prisma.technicianProfile.upsert({
    where: { userId: cleanpro.id },
    update: {
      id: TECH_PROFILE_3,
      bio: 'Professional home & office deep cleaning crew',
      skills: ['deep cleaning', 'sanitization', 'carpet cleaning'],
      experienceYears: 5, hourlyRate: 500, location: 'Chattogram',
      isAvailable: true,
    },
    create: {
      id: TECH_PROFILE_3, userId: cleanpro.id,
      bio: 'Professional home & office deep cleaning crew',
      skills: ['deep cleaning', 'sanitization', 'carpet cleaning'],
      experienceYears: 5, hourlyRate: 500, location: 'Chattogram',
      isAvailable: true,
    },
  });
  console.log('✅ Seeded 3 technician profiles');

  // ── Services ──────────────────────────────────────────
  await prisma.service.upsert({
    where: { id: SERVICE_1 },
    update: {
      technicianId: TECH_PROFILE_1, categoryId: CAT_ELECTRICAL,
      title: 'Ceiling Fan Installation',
      description: 'Installation of new ceiling fans, wiring included',
      price: 1200, durationMins: 90, location: 'Dhaka', isActive: true,
    },
    create: {
      id: SERVICE_1, technicianId: TECH_PROFILE_1, categoryId: CAT_ELECTRICAL,
      title: 'Ceiling Fan Installation',
      description: 'Installation of new ceiling fans, wiring included',
      price: 1200, durationMins: 90, location: 'Dhaka', isActive: true,
    },
  });
  await prisma.service.upsert({
    where: { id: SERVICE_2 },
    update: {
      technicianId: TECH_PROFILE_2, categoryId: CAT_PLUMBING,
      title: 'Pipe Leak Repair',
      description: 'Diagnose and repair leaking pipes under sinks or walls',
      price: 900, durationMins: 60, location: 'Dhaka', isActive: true,
    },
    create: {
      id: SERVICE_2, technicianId: TECH_PROFILE_2, categoryId: CAT_PLUMBING,
      title: 'Pipe Leak Repair',
      description: 'Diagnose and repair leaking pipes under sinks or walls',
      price: 900, durationMins: 60, location: 'Dhaka', isActive: true,
    },
  });
  await prisma.service.upsert({
    where: { id: SERVICE_3 },
    update: {
      technicianId: TECH_PROFILE_3, categoryId: CAT_CLEANING,
      title: 'Deep Home Cleaning',
      description: 'Full-home deep clean including kitchen and bathrooms',
      price: 2500, durationMins: 180, location: 'Chattogram', isActive: true,
    },
    create: {
      id: SERVICE_3, technicianId: TECH_PROFILE_3, categoryId: CAT_CLEANING,
      title: 'Deep Home Cleaning',
      description: 'Full-home deep clean including kitchen and bathrooms',
      price: 2500, durationMins: 180, location: 'Chattogram', isActive: true,
    },
  });
  console.log('✅ Seeded 3 services');

  // ── Availability slots ────────────────────────────────
  await prisma.availability.upsert({
    where: { id: SLOT_1 }, update: {},
    create: { id: SLOT_1, technicianId: TECH_PROFILE_1, date: new Date('2026-07-10'), startTime: '09:00', endTime: '11:00', isBooked: true },
  });
  await prisma.availability.upsert({
    where: { id: SLOT_1B }, update: {},
    create: { id: SLOT_1B, technicianId: TECH_PROFILE_1, date: new Date('2026-07-10'), startTime: '14:00', endTime: '16:00', isBooked: false },
  });
  await prisma.availability.upsert({
    where: { id: SLOT_2 }, update: {},
    create: { id: SLOT_2, technicianId: TECH_PROFILE_2, date: new Date('2026-07-11'), startTime: '10:00', endTime: '11:00', isBooked: false },
  });
  await prisma.availability.upsert({
    where: { id: SLOT_3 }, update: {},
    create: { id: SLOT_3, technicianId: TECH_PROFILE_3, date: new Date('2026-07-12'), startTime: '09:00', endTime: '12:00', isBooked: false },
  });
  console.log('✅ Seeded 4 availability slots');

  // ── Customers ─────────────────────────────────────────
  const farhan = await upsertUser(CUSTOMER_1, 'Farhan Ahmed', 'farhan@example.com', '01711111111', 'CUSTOMER');
  const nusrat = await upsertUser(CUSTOMER_2, 'Nusrat Jahan', 'nusrat@example.com', '01755555555', 'CUSTOMER');
  const tanvir = await upsertUser(CUSTOMER_3, 'Tanvir Hasan', 'tanvir@example.com', '01766666666', 'CUSTOMER');
  console.log('✅ Seeded 3 customers');

  // ── Bookings (covering every status) ─────────────────
  await prisma.booking.upsert({
    where: { id: BOOKING_1 }, update: {},
    create: {
      id: BOOKING_1, customerId: farhan.id, technicianId: TECH_PROFILE_1, serviceId: SERVICE_1,
      availabilityId: SLOT_1, scheduledAt: new Date('2026-07-10T10:00:00.000Z'),
      status: 'ACCEPTED', notes: 'Please bring your own ladder',
    },
  });
  await prisma.booking.upsert({
    where: { id: BOOKING_2 }, update: {},
    create: {
      id: BOOKING_2, customerId: nusrat.id, technicianId: TECH_PROFILE_2, serviceId: SERVICE_2,
      scheduledAt: new Date('2026-07-11T10:00:00.000Z'),
      status: 'REQUESTED', notes: 'Kitchen sink pipe leaking overnight',
    },
  });
  await prisma.booking.upsert({
    where: { id: BOOKING_3 }, update: {},
    create: {
      id: BOOKING_3, customerId: nusrat.id, technicianId: TECH_PROFILE_1, serviceId: SERVICE_1,
      scheduledAt: new Date('2026-07-09T10:00:00.000Z'),
      status: 'DECLINED', notes: 'Requested urgent same-day install',
    },
  });
  await prisma.booking.upsert({
    where: { id: BOOKING_4 }, update: {},
    create: {
      id: BOOKING_4, customerId: tanvir.id, technicianId: TECH_PROFILE_3, serviceId: SERVICE_3,
      scheduledAt: new Date('2026-07-08T09:00:00.000Z'),
      status: 'IN_PROGRESS', notes: 'Focus on kitchen and two bathrooms',
    },
  });
  await prisma.booking.upsert({
    where: { id: BOOKING_5 }, update: {},
    create: {
      id: BOOKING_5, customerId: tanvir.id, technicianId: TECH_PROFILE_3, serviceId: SERVICE_3,
      scheduledAt: new Date('2026-07-01T09:00:00.000Z'),
      status: 'COMPLETED', notes: 'Move-out deep clean',
    },
  });
  await prisma.booking.upsert({
    where: { id: BOOKING_6 }, update: {},
    create: {
      id: BOOKING_6, customerId: farhan.id, technicianId: TECH_PROFILE_2, serviceId: SERVICE_2,
      scheduledAt: new Date('2026-07-05T10:00:00.000Z'),
      status: 'CANCELLED', cancelReason: 'Change of plans', notes: 'Bathroom pipe check',
    },
  });
  await prisma.booking.upsert({
    where: { id: BOOKING_7 }, update: {},
    create: {
      id: BOOKING_7, customerId: nusrat.id, technicianId: TECH_PROFILE_1, serviceId: SERVICE_1,
      scheduledAt: new Date('2026-06-20T10:00:00.000Z'),
      status: 'COMPLETED', notes: 'Living room fan replacement',
    },
  });
  await prisma.booking.upsert({
    where: { id: BOOKING_8 }, update: {},
    create: {
      id: BOOKING_8, customerId: farhan.id, technicianId: TECH_PROFILE_3, serviceId: SERVICE_3,
      scheduledAt: new Date('2026-07-15T09:00:00.000Z'),
      status: 'PAID', notes: 'Pre-Eid full house cleaning',
    },
  });
  console.log('✅ Seeded 8 bookings (one per status, plus extras)');

  // ── Payments (for PAID / IN_PROGRESS / COMPLETED bookings) ──
  await prisma.payment.upsert({
    where: { bookingId: BOOKING_5 }, update: {},
    create: {
      id: PAYMENT_5, bookingId: BOOKING_5, userId: tanvir.id,
      transactionId: 'FIXITNOW-3f1e2d3c-4b5a-6978-8081-828384858687',
      amount: 2500, provider: 'SSLCOMMERZ', status: 'COMPLETED',
      method: 'VISA', paidAt: new Date('2026-07-01T08:30:00.000Z'),
    },
  });
  await prisma.payment.upsert({
    where: { bookingId: BOOKING_4 }, update: {},
    create: {
      bookingId: BOOKING_4, userId: tanvir.id,
      transactionId: 'FIXITNOW-a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      amount: 2500, provider: 'SSLCOMMERZ', status: 'COMPLETED',
      method: 'bKash', paidAt: new Date('2026-07-08T08:00:00.000Z'),
    },
  });
  await prisma.payment.upsert({
    where: { bookingId: BOOKING_7 }, update: {},
    create: {
      bookingId: BOOKING_7, userId: nusrat.id,
      transactionId: 'FIXITNOW-b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      amount: 1200, provider: 'SSLCOMMERZ', status: 'COMPLETED',
      method: 'Nagad', paidAt: new Date('2026-06-20T09:15:00.000Z'),
    },
  });
  await prisma.payment.upsert({
    where: { bookingId: BOOKING_8 }, update: {},
    create: {
      bookingId: BOOKING_8, userId: farhan.id,
      transactionId: 'FIXITNOW-c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      amount: 2500, provider: 'SSLCOMMERZ', status: 'COMPLETED',
      method: 'VISA', paidAt: new Date('2026-07-14T12:00:00.000Z'),
    },
  });
  console.log('✅ Seeded 4 payments');

  // ── Reviews (only for COMPLETED bookings) ────────────
  await prisma.review.upsert({
    where: { bookingId: BOOKING_5 }, update: {},
    create: {
      id: REVIEW_5, bookingId: BOOKING_5, customerId: tanvir.id, technicianId: TECH_PROFILE_3,
      rating: 5, comment: 'Fast, clean, and professional work!',
    },
  });
  await prisma.review.upsert({
    where: { bookingId: BOOKING_7 }, update: {},
    create: {
      bookingId: BOOKING_7, customerId: nusrat.id, technicianId: TECH_PROFILE_1,
      rating: 4, comment: 'Good job, arrived a bit late but work was solid.',
    },
  });
  console.log('✅ Seeded 2 reviews');

  // ── Recalculate aggregate ratings ────────────────────
  for (const techId of [TECH_PROFILE_1, TECH_PROFILE_3]) {
    const agg = await prisma.review.aggregate({
      where: { technicianId: techId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.technicianProfile.update({
      where: { id: techId },
      data: { avgRating: agg._avg.rating || 0, totalReviews: agg._count.rating },
    });
  }
  console.log('✅ Recalculated technician ratings');

  console.log('\n🎉 Seed complete. Demo login password for all technicians/customers: "Passw0rd!"');
  console.log('   Customers:   farhan@example.com | nusrat@example.com | tanvir@example.com');
  console.log('   Technicians: karim@example.com (Electrical) | rahim@example.com (Plumbing) | cleanpro@example.com (Cleaning)');
}

main()
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
