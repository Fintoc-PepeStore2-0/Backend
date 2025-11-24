const axios = require('axios');

const FINTOC_API_BASE = 'https://api.fintoc.com/v1';

const fintocClient = axios.create({
  baseURL: FINTOC_API_BASE,
  headers: {
    Authorization: `Bearer ${process.env.FINTOC_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

const handleFintocError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || 'Error en la llamada a Fintoc';
    const err = new Error(message);
    err.status = status;
    err.details = data;
    throw err;
  }
  throw error;
};

const createPaymentIntent = async ({ amount, recipientAccountId, returnUrl, description }) => {
  try {
    const response = await fintocClient.post('/payment_intents', {
      amount,
      recipient_account_id: recipientAccountId,
      return_url: returnUrl,
      description,
    });
    return response.data;
  } catch (error) {
    handleFintocError(error);
    return null;
  }
};

const getPaymentIntent = async (intentId) => {
  try {
    const response = await fintocClient.get(`/payment_intents/${intentId}`);
    return response.data;
  } catch (error) {
    handleFintocError(error);
    return null;
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentIntent,
};

