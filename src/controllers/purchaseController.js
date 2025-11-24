const prisma = require('../config/prisma');
const {
  createCheckoutSession,
  getCheckoutSession,
} = require('../services/fintocService');

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !user.email) {
      return res.status(400).json({ message: 'El usuario no tiene un email configurado' });
    }

    const currency = (process.env.FINTOC_CURRENCY || 'CLP').toUpperCase();

    const provisionalOrder = await prisma.order.create({
      data: {
        userId,
        amount,
        currency,
        status: 'pending',
      },
    });

    const checkoutSession = await createCheckoutSession({
      amount,
      currency,
      customerEmail: user.email,
      successUrl: process.env.FINTOC_SUCCESS_URL || process.env.FINTOC_RETURN_URL,
      cancelUrl: process.env.FINTOC_CANCEL_URL || process.env.FINTOC_RETURN_URL,
      metadata: {
        order_id: `#${provisionalOrder.id}`,
        order_db_id: provisionalOrder.id,
        user_id: userId,
      },
    });

    await prisma.order.update({
      where: { id: provisionalOrder.id },
      data: {
        fintocSessionId: checkoutSession.id,
        sessionToken: checkoutSession.session_token,
      },
    });

    return res.status(201).json({
      checkoutSession,
      publicKey: process.env.FINTOC_PUBLIC_KEY,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al iniciar pago', error);
    const status = error.status || 500;
    const message = error.message || 'Error al iniciar pago';
    return res.status(status).json({ message, details: error.details });
  }
};

const mapSessionToOrderStatus = (session) => {
  const sessionStatus = session?.status;
  const paymentStatus = session?.payment_intent?.status;

  if (paymentStatus === 'succeeded' || sessionStatus === 'finished') {
    return 'succeeded';
  }

  if (paymentStatus === 'failed' || sessionStatus === 'failed' || sessionStatus === 'expired') {
    return 'failed';
  }

  return 'pending';
};

const getPurchaseStatus = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const checkoutSession = await getCheckoutSession(sessionId);

    const existingOrder = await prisma.order.findUnique({
      where: { fintocSessionId: sessionId },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        fintocPaymentIntentId: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Orden no encontrada para ese sessionId' });
    }

    const mappedStatus = mapSessionToOrderStatus(checkoutSession);

    const updatedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        status: mappedStatus,
        fintocPaymentIntentId: checkoutSession.payment_intent?.id || existingOrder.fintocPaymentIntentId,
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        currency: true,
        fintocSessionId: true,
      },
    });

    return res.json({
      order: updatedOrder,
      status: mappedStatus,
      checkoutSession,
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

