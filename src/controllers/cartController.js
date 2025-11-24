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

const loadCartItemForUser = async (cartItemId, userId) => prisma.cartItem.findFirst({
  where: {
    id: cartItemId,
    cart: {
      userId,
    },
  },
  include: {
    product: true,
    cart: true,
  },
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

    const currentQuantity = currentItem?.quantity || 0;
    const available = product.stock - currentQuantity;

    if (available <= 0) {
      return res.status(400).json({ message: 'No quedan unidades disponibles para este producto' });
    }

    if (parsedQuantity > available) {
      return res.status(400).json({
        message: `Solo puedes agregar hasta ${available} unidad(es) adicionales`,
      });
    }

    const desiredQuantity = currentQuantity + parsedQuantity;


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
  updateCartItem: async (req, res) => {
    const cartItemId = Number(req.params.itemId);
    const { quantity } = req.body || {};
    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
      return res.status(400).json({ message: 'itemId inválido' });
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: 'quantity debe ser un entero >= 0' });
    }

    try {
      const item = await loadCartItemForUser(cartItemId, req.user.id);
      if (!item) {
        return res.status(404).json({ message: 'Item no encontrado en tu carrito' });
      }

      if (parsedQuantity === 0) {
        await prisma.cartItem.delete({ where: { id: cartItemId } });
      } else {
        if (parsedQuantity > item.product.stock) {
          return res.status(400).json({ message: 'No hay stock suficiente para esa cantidad' });
        }

        await prisma.cartItem.update({
          where: { id: cartItemId },
          data: { quantity: parsedQuantity },
        });
      }

      const cartWithItems = await ensureCartWithItems(req.user.id);
      return res.json({
        cartId: cartWithItems.id,
        items: formatCartItems(cartWithItems.items),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al actualizar item del carrito', error);
      return res.status(500).json({ message: 'Error al actualizar item del carrito' });
    }
  },
  removeCartItem: async (req, res) => {
    const cartItemId = Number(req.params.itemId);

    if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
      return res.status(400).json({ message: 'itemId inválido' });
    }

    try {
      const item = await loadCartItemForUser(cartItemId, req.user.id);
      if (!item) {
        return res.status(404).json({ message: 'Item no encontrado en tu carrito' });
      }

      await prisma.cartItem.delete({ where: { id: cartItemId } });

      const cartWithItems = await ensureCartWithItems(req.user.id);
      return res.json({
        cartId: cartWithItems.id,
        items: formatCartItems(cartWithItems.items),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al eliminar item del carrito', error);
      return res.status(500).json({ message: 'Error al eliminar item del carrito' });
    }
  },
};

