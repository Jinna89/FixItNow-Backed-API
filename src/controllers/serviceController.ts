const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

/** GET /api/services — public, with filters */
const getServices = asyncHandler(async (req, res) => {
  const { categoryId, location, minPrice, maxPrice, minRating, search, page = 1, limit = 20 } = req.query;

  const where = {
    isActive: true,
    ...(categoryId && { categoryId }),
    ...(location && { location: { contains: location, mode: 'insensitive' } }),
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      },
    }),
    ...(minRating && { technician: { avgRating: { gte: Number(minRating) } } }),
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        category: true,
        technician: { include: { user: { select: { id: true, name: true } } } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.service.count({ where }),
  ]);

  return sendSuccess(res, {
    message: 'Services fetched',
    data: services,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  });
});

/** GET /api/technicians — public, with filters */
const getTechnicians = asyncHandler(async (req, res) => {
  const { location, minRating, skill, page = 1, limit = 20 } = req.query;

  const where = {
    ...(location && { location: { contains: location, mode: 'insensitive' } }),
    ...(minRating && { avgRating: { gte: Number(minRating) } }),
    ...(skill && { skills: { has: skill } }),
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [technicians, total] = await Promise.all([
    prisma.technicianProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        services: { where: { isActive: true } },
      },
      skip,
      take: Number(limit),
      orderBy: { avgRating: 'desc' },
    }),
    prisma.technicianProfile.count({ where }),
  ]);

  return sendSuccess(res, {
    message: 'Technicians fetched',
    data: technicians,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  });
});

/** GET /api/technicians/:id — public */
const getTechnicianById = asyncHandler(async (req, res) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      services: { where: { isActive: true }, include: { category: true } },
      reviews: {
        include: { customer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!technician) throw new ApiError(404, 'Technician not found');

  return sendSuccess(res, { message: 'Technician profile fetched', data: technician });
});

/** GET /api/categories — public */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return sendSuccess(res, { message: 'Categories fetched', data: categories });
});

module.exports = { getServices, getTechnicians, getTechnicianById, getCategories };

export {};
