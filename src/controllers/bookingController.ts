const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

/** POST /api/bookings — customer creates a booking */
const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, availabilityId, scheduledAt, notes } = req.body;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) throw new ApiError(404, 'Service not found');

  if (availabilityId) {
    const slot = await prisma.availability.findUnique({ where: { id: availabilityId } });
    if (!slot || slot.technicianId !== service.technicianId) {
      throw new ApiError(404, 'Availability slot not found');
    }
    if (slot.isBooked) throw new ApiError(409, 'This time slot is already booked');
  }

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        customerId: req.user.id,
        technicianId: service.technicianId,
        serviceId,
        availabilityId,
        scheduledAt,
        notes,
        status: 'REQUESTED',
      },
      include: { service: true, technician: { include: { user: true } } },
    });

    if (availabilityId) {
      await tx.availability.update({
        where: { id: availabilityId },
        data: { isBooked: true },
      });
    }

    return created;
  });

  return sendSuccess(res, { statusCode: 201, message: 'Booking requested', data: booking });
});

/** GET /api/bookings — current customer's bookings */
const getMyBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const bookings = await prisma.booking.findMany({
    where: { customerId: req.user.id, ...(status && { status }) },
    include: {
      service: { include: { category: true } },
      technician: { include: { user: { select: { id: true, name: true, phone: true } } } },
      payment: true,
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return sendSuccess(res, { message: 'Bookings fetched', data: bookings });
});

/** GET /api/bookings/:id */
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      service: { include: { category: true } },
      technician: { include: { user: { select: { id: true, name: true, phone: true } } } },
      customer: { select: { id: true, name: true, phone: true, email: true } },
      payment: true,
      review: true,
    },
  });

  if (!booking) throw new ApiError(404, 'Booking not found');

  const technicianUser = await prisma.technicianProfile.findUnique({
    where: { id: booking.technicianId },
    select: { userId: true },
  });

  const isOwner =
    booking.customerId === req.user.id ||
    technicianUser?.userId === req.user.id ||
    req.user.role === 'ADMIN';

  if (!isOwner) throw new ApiError(403, 'You do not have access to this booking');

  return sendSuccess(res, { message: 'Booking fetched', data: booking });
});

/** PATCH /api/bookings/:id/cancel — customer cancels before IN_PROGRESS */
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.customerId !== req.user.id) {
    throw new ApiError(403, 'You can only cancel your own bookings');
  }

  const nonCancellable = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DECLINED'];
  if (nonCancellable.includes(booking.status)) {
    throw new ApiError(400, `Booking cannot be cancelled once it is ${booking.status}`);
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED', cancelReason: req.body.cancelReason || 'Cancelled by customer' },
  });

  return sendSuccess(res, { message: 'Booking cancelled', data: updated });
});

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking };

export {};
