ALTER TABLE "Order" RENAME COLUMN "fintocIntentId" TO "fintocSessionId";

ALTER TABLE "Order" RENAME CONSTRAINT "Order_fintocIntentId_key" TO "Order_fintocSessionId_key";

ALTER TABLE "Order"
ADD COLUMN "sessionToken" TEXT,
ADD COLUMN "fintocPaymentIntentId" VARCHAR(255),
ADD COLUMN "currency" VARCHAR(10) NOT NULL DEFAULT 'CLP';

CREATE UNIQUE INDEX "Order_fintocPaymentIntentId_key" ON "Order" ("fintocPaymentIntentId");

