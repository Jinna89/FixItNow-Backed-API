const { z } = require('zod');

const serviceSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  title: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive('Price must be greater than 0'),
  durationMins: z.coerce.number().int().positive().optional(),
  location: z.string().max(150).optional(),
});

const technicianProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.coerce.number().int().min(0).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  location: z.string().max(150).optional(),
  isAvailable: z.boolean().optional(),
});

const availabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        date: z.coerce.date(),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be HH:mm'),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be HH:mm'),
      })
    )
    .min(1, 'At least one slot is required'),
});

const reviewSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5),
  comment: z.string().max(1000).optional(),
});

const categorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
});

const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'BANNED']),
});

module.exports = {
  serviceSchema,
  technicianProfileSchema,
  availabilitySchema,
  reviewSchema,
  categorySchema,
  userStatusSchema,
};

export {};
