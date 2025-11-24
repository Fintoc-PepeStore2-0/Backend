CREATE TYPE "Role" AS ENUM ('client', 'admin');
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'succeeded', 'failed');

CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'client',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Product" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "description" TEXT,
    "price" INTEGER NOT NULL CHECK ("price" >= 0),
    "stock" INTEGER NOT NULL CHECK ("stock" >= 0),
    "image" TEXT
);

CREATE TABLE "Cart" (
    "id" SERIAL PRIMARY KEY,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "userId" INTEGER NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "CartItem" (
    "id" SERIAL PRIMARY KEY,
    "quantity" INTEGER NOT NULL CHECK ("quantity" > 0),
    "cartId" INTEGER NOT NULL REFERENCES "Cart"("id") ON DELETE CASCADE,
    "productId" INTEGER NOT NULL REFERENCES "Product"("id")
);

CREATE UNIQUE INDEX "cart_product_unique" ON "CartItem" ("cartId", "productId");

CREATE TABLE "Order" (
    "id" SERIAL PRIMARY KEY,
    "fintocIntentId" VARCHAR(255) NOT NULL UNIQUE,
    "amount" INTEGER NOT NULL CHECK ("amount" >= 0),
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
);

