const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');

/** GET /api/admin/users */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, status, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = { ...(role && { role }), ...(status && { status }) };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        status: true, createdAt: true,
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return sendSuccess(res, {
    message: 'Users fetched',
    data: users,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  });
});

/** PATCH /api/admin/users/:id — ban/unban */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'ADMIN') throw new ApiError(400, 'Cannot change status of an admin account');

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { status },
  });

  return sendSuccess(res, { message: `User ${status === 'BANNED' ? 'banned' : 'unbanned'}`, data: updated });
});

/** GET /api/admin/bookings */
const getAllBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = { ...(status && { status }) };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        technician: { include: { user: { select: { id: true, name: true, email: true } } } },
        service: true,
        payment: true,
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.count({ where }),
  ]);

  return sendSuccess(res, {
    message: 'All bookings fetched',
    data: bookings,
    meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  });
});

/** GET /api/admin/categories */
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return sendSuccess(res, { message: 'Categories fetched', data: categories });
});

/** POST /api/admin/categories */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw new ApiError(409, 'A category with this name already exists');

  const category = await prisma.category.create({ data: { name, description } });
  return sendSuccess(res, { statusCode: 201, message: 'Category created', data: category });
});

module.exports = { getAllUsers, updateUserStatus, getAllBookings, getAllCategories, createCategory };

export {};
