const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

async function getOwnTechnicianProfile(userId) {
  const profile = await prisma.technicianProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, 'Technician profile not found');
  return profile;
}

/** PUT /api/technician/profile */
const updateProfile = asyncHandler(async (req, res) => {
  const profile = await getOwnTechnicianProfile(req.user.id);

  const updated = await prisma.technicianProfile.update({
    where: { id: profile.id },
    data: req.body,
  });

  return sendSuccess(res, { message: 'Profile updated', data: updated });
});

/** POST /api/technician/services — create a service offering */
const createService = asyncHandler(async (req, res) => {
  const profile = await getOwnTechnicianProfile(req.user.id);

  const category = await prisma.category.findUnique({ where: { id: req.body.categoryId } });
  if (!category) throw new ApiError(404, 'Category not found');

  const service = await prisma.service.create({
    data: { ...req.body, technicianId: profile.id },
  });

  return sendSuccess(res, { statusCode: 201, message: 'Service created', data: service });
});

/** PUT /api/technician/services/:id */
const updateService = asyncHandler(async (req, res) => {
  const profile = await getOwnTechnicianProfile(req.user.id);

  const service = await prisma.service.findUnique({ where: { id: req.params.id } });
  if (!service || service.technicianId !== profile.id) {
    throw new ApiError(404, 'Service not found');
  }

  const updated = await prisma.service.update({
    where: { id: req.params.id },
    data: req.body,
  });

  return sendSuccess(res, { message: 'Service updated', data: updated });
});

/** PUT /api/technician/availability — set availability slots */
const updateAvailability = asyncHandler(async (req, res) => {
  const profile = await getOwnTechnicianProfile(req.user.id);
  const { slots } = req.body;

  const created = await prisma.$transaction(
    slots.map((slot) =>
      prisma.availability.upsert({
        where: {
          technicianId_date_startTime: {
            technicianId: profile.id,
            date: slot.date,
            startTime: slot.startTime,
          },
        },
        update: { endTime: slot.endTime },
        create: { ...slot, technicianId: profile.id },
      })
    )
  );

  return sendSuccess(res, { message: 'Availability updated', data: created });
});

/** GET /api/technician/bookings — technician's own bookings */
const getOwnBookings = asyncHandler(async (req, res) => {
  const profile = await getOwnTechnicianProfile(req.user.id);
  const { status } = req.query;

  const bookings = await prisma.booking.findMany({
    where: { technicianId: profile.id, ...(status && { status }) },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      service: true,
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return sendSuccess(res, { message: 'Bookings fetched', data: bookings });
});

/** PATCH /api/technician/bookings/:id — accept/decline/progress/complete */
const updateBookingStatus = asyncHandler(async (req, res) => {
  const profile = await getOwnTechnicianProfile(req.user.id);
  const { status, cancelReason } = req.body;

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking || booking.technicianId !== profile.id) {
    throw new ApiError(404, 'Booking not found');
  }

  const allowedTransitions = {
    REQUESTED: ['ACCEPTED', 'DECLINED'],
    ACCEPTED: ['CANCELLED'],
    PAID: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED'],
  };

  const allowedNext = allowedTransitions[booking.status] || [];
  if (!allowedNext.includes(status)) {
    throw new ApiError(
      400,
      `Cannot transition booking from ${booking.status} to ${status}`
    );
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status, ...(cancelReason && { cancelReason }) },
  });

  return sendSuccess(res, { message: `Booking marked as ${status}`, data: updated });
});

module.exports = {
  updateProfile,
  createService,
  updateService,
  updateAvailability,
  getOwnBookings,
  updateBookingStatus,
};

export {};
