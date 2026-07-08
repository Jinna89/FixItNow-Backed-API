const { z } = require('zod');

const createBookingSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  availabilityId: z.string().uuid('Invalid availability slot ID').optional(),
  scheduledAt: z.coerce.date({ errorMap: () => ({ message: 'scheduledAt must be a valid date' }) }),
  notes: z.string().max(500).optional(),
});

const updateBookingStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid booking status transition' }),
  }),
  cancelReason: z.string().max(500).optional(),
});

module.exports = { createBookingSchema, updateBookingStatusSchema };

export {};
