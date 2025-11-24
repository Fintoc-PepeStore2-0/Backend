const prisma = require('../config/prisma');

const formatCartItems = (items) => items.map((item) => ({
  id: item.id,
  quantity: item.quantity,
  product_id: item.product.id,
  name: item.product.name,
  price: item.product.price,
  stock: item.product.stock,
  image: item.product.image,
}));

const ensureCartWithItems = async (userId) => prisma.cart.upsert({
  where: { userId },
  update: {},
  create: { userId },
  include: {
    items: {
      include: {
        product: true,
      },
      orderBy: { id: 'asc' },
    },
  },
});

const ensureCart = async (userId) => prisma.cart.upsert({
  where: { userId },
  update: {},
  create: { userId },
});

const getCart = async (req, res) => {
  try {
    const cart = await ensureCartWithItems(req.user.id);
    return res.json({ cartId: cart.id, items: formatCartItems(cart.items) });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al obtener carrito', error);
    return res.status(500).json({ message: 'Error al obtener carrito' });
  }
};

const addCartItem = async (req, res) => {
  const { product_id: productId, quantity } = req.body;
  const parsedProductId = Number(productId);
  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedProductId) || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ message: 'product_id y quantity deben ser válidos' });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
      select: { id: true, stock: true },
    });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const cart = await ensureCart(req.user.id);
    const currentItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: parsedProductId,
        },
      },
      select: { id: true, quantity: true },
    });

    const desiredQuantity = currentItem
      ? currentItem.quantity + parsedQuantity
      : parsedQuantity;

    if (desiredQuantity > product.stock) {
      return res.status(400).json({ message: 'No hay stock suficiente para esa cantidad' });
    }

    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: parsedProductId,
        },
      },
      update: {
        quantity: desiredQuantity,
      },
      create: {
        cartId: cart.id,
        productId: parsedProductId,
        quantity: parsedQuantity,
      },
    });

    const cartWithItems = await ensureCartWithItems(req.user.id);
    return res.status(201).json({
      cartId: cartWithItems.id,
      items: formatCartItems(cartWithItems.items),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al agregar item al carrito', error);
    return res.status(500).json({ message: 'Error al agregar item al carrito' });
  }
};

module.exports = {
  getCart,
  addCartItem,
};

