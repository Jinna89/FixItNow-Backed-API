const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { sendSuccess } = require('./utils/apiResponse');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for SSLCommerz form-encoded callbacks
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.get('/', (req, res) => {
  sendSuccess(res, { message: 'FixItNow API is running 🔧' });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

export {};
