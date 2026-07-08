const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

/** POST /api/reviews — customer reviews a technician after job completion */
const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.customerId !== req.user.id) {
    throw new ApiError(403, 'You can only review your own bookings');
  }
  if (booking.status !== 'COMPLETED') {
    throw new ApiError(400, 'You can only review a booking after it is completed');
  }

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) throw new ApiError(409, 'You have already reviewed this booking');

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        bookingId,
        customerId: req.user.id,
        technicianId: booking.technicianId,
        rating,
        comment,
      },
    });

    // Recalculate the technician's aggregate rating
    const agg = await tx.review.aggregate({
      where: { technicianId: booking.technicianId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.technicianProfile.update({
      where: { id: booking.technicianId },
      data: {
        avgRating: agg._avg.rating || 0,
        totalReviews: agg._count.rating,
      },
    });

    return created;
  });

  return sendSuccess(res, { statusCode: 201, message: 'Review submitted', data: review });
});

module.exports = { createReview };

export {};
