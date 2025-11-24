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
  getProductStock: async (req, res) => {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'productId inválido' });
    }

    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, stock: true },
      });

      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      const reserved = await prisma.cartItem.aggregate({
        where: { productId },
        _sum: { quantity: true },
      });

      const reservedQuantity = reserved._sum.quantity || 0;
      const available = Math.max(product.stock - reservedQuantity, 0);

      return res.json({
        productId: product.id,
        name: product.name,
        totalStock: product.stock,
        reserved: reservedQuantity,
        available,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al obtener stock del producto', error);
      return res.status(500).json({ message: 'Error al obtener stock del producto' });
    }
  },
};

