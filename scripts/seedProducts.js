const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const mapProduct = (item) => ({
  name: item.name,
  category: item.category || null,
  description: item.description || null,
  price: Number(item.price_value),
  stock: Number(item.stock_units),
  image: item.image_url || null,
});

async function main() {
  const filePath = path.join(__dirname, '..', 'productos.json');
  const rawData = await fs.promises.readFile(filePath, 'utf-8');
  const products = JSON.parse(rawData);

  for (const product of products) {
    const data = mapProduct(product);

    await prisma.product.upsert({
      where: { name: data.name },
      update: data,
      create: data,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Se cargaron/actualizaron ${products.length} productos`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Error al sembrar productos', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

