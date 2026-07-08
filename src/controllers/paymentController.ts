const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');
const { initiatePayment, validatePayment } = require('../utils/sslcommerz');

/** POST /api/payments/create — customer initiates payment for an ACCEPTED booking */
const createPayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) throw new ApiError(400, 'bookingId is required');

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true, customer: true },
  });

  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.customerId !== req.user.id) {
    throw new ApiError(403, 'You can only pay for your own bookings');
  }
  if (booking.status !== 'ACCEPTED') {
    throw new ApiError(400, 'Payment can only be made for an ACCEPTED booking');
  }

  const existingPayment = await prisma.payment.findUnique({ where: { bookingId } });
  if (existingPayment && existingPayment.status === 'COMPLETED') {
    throw new ApiError(409, 'This booking has already been paid for');
  }

  const transactionId = `FIXITNOW-${uuidv4()}`;

  const gateway = await initiatePayment({
    transactionId,
    amount: booking.service.price,
    customerName: booking.customer.name,
    customerEmail: booking.customer.email,
    customerPhone: booking.customer.phone,
    productName: booking.service.title,
  });

  const payment = await prisma.payment.upsert({
    where: { bookingId },
    update: {
      transactionId,
      amount: booking.service.price,
      status: 'PENDING',
      provider: 'SSLCOMMERZ',
      rawResponse: gateway.raw,
    },
    create: {
      bookingId,
      userId: req.user.id,
      transactionId,
      amount: booking.service.price,
      provider: 'SSLCOMMERZ',
      status: 'PENDING',
      rawResponse: gateway.raw,
    },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Payment session created',
    data: {
      paymentId: payment.id,
      transactionId,
      gatewayPageURL: gateway.gatewayPageURL,
    },
  });
});

/** POST /api/payments/confirm — SSLCommerz IPN/callback confirms payment */
const confirmPayment = asyncHandler(async (req, res) => {
  // SSLCommerz sends val_id and tran_id via POST (IPN) or query string (redirect callbacks)
  const source = Object.keys(req.body || {}).length ? req.body : req.query;
  const { val_id: valId, tran_id: transactionId, status } = source;

  if (!transactionId) throw new ApiError(400, 'tran_id is required');

  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) throw new ApiError(404, 'Payment record not found for this transaction');

  if (status === 'fail' || status === 'cancel' || !valId) {
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });
    return sendSuccess(res, { message: 'Payment failed or cancelled', data: updated });
  }

  const validation = await validatePayment(valId);
  const isValid =
    validation.status === 'VALID' || validation.status === 'VALIDATED';

  if (!isValid) {
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', rawResponse: validation },
    });
    return sendSuccess(res, { message: 'Payment could not be validated', data: updated });
  }

  const [updatedPayment] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        method: validation.card_type || 'SSLCommerz',
        paidAt: new Date(),
        rawResponse: validation,
      },
    }),
    prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'PAID' },
    }),
  ]);

  return sendSuccess(res, { message: 'Payment confirmed', data: updatedPayment });
});

/** GET /api/payments — current user's payment history */
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.user.id },
    include: { booking: { include: { service: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, { message: 'Payment history fetched', data: payments });
});

/** GET /api/payments/:id */
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { booking: { include: { service: true } } },
  });
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.userId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'You do not have access to this payment');
  }
  return sendSuccess(res, { message: 'Payment fetched', data: payment });
});

module.exports = { createPayment, confirmPayment, getMyPayments, getPaymentById };

export {};
