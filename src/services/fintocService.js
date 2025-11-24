const { Fintoc } = require('fintoc');

let client;

const getClient = () => {
  if (client) {
    return client;
  }

  if (!process.env.FINTOC_SECRET_KEY) {
    throw new Error('FINTOC_SECRET_KEY no está configurada');
  }

  client = new Fintoc(process.env.FINTOC_SECRET_KEY);
  return client;
};

const wrapError = (error) => {
  const err = new Error(error?.message || 'Error al comunicarse con Fintoc');
  err.status = error?.statusCode || error?.status || 500;
  err.details = error;
  return err;
};

const createCheckoutSession = async ({
  amount,
  currency,
  customerEmail,
  successUrl,
  cancelUrl,
  metadata,
}) => {
  const payload = {
    amount,
    currency,
    customer_email: customerEmail,
  };

  if (successUrl) {
    payload.success_url = successUrl;
  }
  if (cancelUrl) {
    payload.cancel_url = cancelUrl;
  }
  if (metadata) {
    payload.metadata = metadata;
  }

  try {
    return await getClient().checkoutSessions.create(payload);
  } catch (error) {
    throw wrapError(error);
  }
};

const getCheckoutSession = async (sessionId) => {
  try {
    return await getClient().checkoutSessions.get(sessionId);
  } catch (error) {
    throw wrapError(error);
  }
};

module.exports = {
  createCheckoutSession,
  getCheckoutSession,
};

