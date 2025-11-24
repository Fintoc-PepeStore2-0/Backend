const prisma = require('../config/prisma');

const getProducts = async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'asc' },
    });
    return res.json({ products });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al obtener productos', error);
    return res.status(500).json({ message: 'Error al obtener productos' });
  }
};

module.exports = {
  getProducts,
};

