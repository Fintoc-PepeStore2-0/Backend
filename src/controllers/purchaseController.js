const prisma = require('../config/prisma');
const { createPaymentIntent, getPaymentIntent } = require('../services/fintocService');

const getCartAmount = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
  if (!cart || cart.items.length === 0) {
    return 0;
  }

  return cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
};

const startPurchase = async (req, res) => {
  const userId = req.user.id;
  try {
    const amount = await getCartAmount(userId);
    if (amount <= 0) {
      return res.status(400).json({ message: 'Tu carrito está vacío' });
    }

    const paymentIntent = await createPaymentIntent({
      amount,
      recipientAccountId: process.env.FINTOC_RECIPIENT_ACCOUNT_ID,
      returnUrl: process.env.FINTOC_RETURN_URL,
      description: `Orden de compra usuario ${userId}`,
    });

    await prisma.order.create({
      data: {
        userId,
        fintocIntentId: paymentIntent.id,
        amount,
        status: 'pending',
      },
    });

    return res.status(201).json({ paymentIntent });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al iniciar pago', error);
    const status = error.status || 500;
    const message = error.message || 'Error al iniciar pago';
    return res.status(status).json({ message, details: error.details });
  }
};

const mapOrderStatus = (fintocStatus) => {
  if (fintocStatus === 'succeeded') return 'succeeded';
  if (fintocStatus === 'failed') return 'failed';
  return 'pending';
};

const getPurchaseStatus = async (req, res) => {
  const { intentId } = req.params;
  try {
    const paymentIntent = await getPaymentIntent(intentId);
    const mappedStatus = mapOrderStatus(paymentIntent.status);

    const existingOrder = await prisma.order.findUnique({
      where: { fintocIntentId: intentId },
      select: { id: true, userId: true, amount: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Orden no encontrada para ese intentId' });
    }

    const updatedOrder = await prisma.order.update({
      where: { fintocIntentId: intentId },
      data: { status: mappedStatus },
      select: { id: true, userId: true, amount: true },
    });

    return res.json({
      order: updatedOrder,
      status: mappedStatus,
      fintocStatus: paymentIntent.status,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al validar pago', error);
    const status = error.status || 500;
    const message = error.message || 'Error al validar pago';
    return res.status(status).json({ message, details: error.details });
  }
};

module.exports = {
  startPurchase,
  getPurchaseStatus,
};

