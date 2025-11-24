const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const { authenticateJWT } = require('./middleware/auth');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', authenticateJWT, cartRoutes);
app.use('/api/purchase', authenticateJWT, purchaseRoutes);

app.use((req, res, next) => {
  if (res.headersSent) {
    return next();
  }
  return res.status(404).json({ message: 'Ruta no encontrada' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('Error no controlado', err);
  return res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;

