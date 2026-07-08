const fetch = require('node-fetch');

const IS_LIVE = process.env.SSLCOMMERZ_IS_LIVE === 'true';

const BASE_URL = IS_LIVE
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

const STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD;

type SslcommerzError = Error & {
  raw?: unknown;
};

/**
 * Initiates an SSLCommerz payment session.
 * Docs: https://developer.sslcommerz.com/doc/v4/
 */
async function initiatePayment({
  transactionId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress = 'N/A',
  productName = 'Home Service Booking',
}) {
  const params = new URLSearchParams({
    store_id: STORE_ID,
    store_passwd: STORE_PASSWORD,
    total_amount: String(amount),
    currency: 'BDT',
    tran_id: transactionId,
    success_url: process.env.SSLCOMMERZ_SUCCESS_URL,
    fail_url: process.env.SSLCOMMERZ_FAIL_URL,
    cancel_url: process.env.SSLCOMMERZ_CANCEL_URL,
    ipn_url: process.env.SSLCOMMERZ_IPN_URL,
    cus_name: customerName,
    cus_email: customerEmail,
    cus_add1: customerAddress,
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: customerPhone || '01700000000',
    shipping_method: 'NO',
    product_name: productName,
    product_category: 'Service',
    product_profile: 'general',
  });

  const response = await fetch(`${BASE_URL}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = await response.json();

  if (data.status !== 'SUCCESS') {
    const err: SslcommerzError = new Error(
      data.failedreason || 'Failed to initiate SSLCommerz session'
    );
    err.raw = data;
    throw err;
  }

  return {
    gatewayPageURL: data.GatewayPageURL,
    sessionKey: data.sessionkey,
    raw: data,
  };
}

/**
 * Validates a completed transaction with SSLCommerz's validation API.
 * Should be called from the IPN/confirm callback before marking a payment COMPLETED.
 */
async function validatePayment(valId) {
  const params = new URLSearchParams({
    val_id: valId,
    store_id: STORE_ID,
    store_passwd: STORE_PASSWORD,
    format: 'json',
  });

  const response = await fetch(
    `${BASE_URL}/validator/api/validationserverAPI.php?${params.toString()}`
  );
  const data = await response.json();
  return data;
}

module.exports = { initiatePayment, validatePayment };

export {};
