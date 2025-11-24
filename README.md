# API E-commerce Hackathon

API REST construida con Node.js, Express y PostgreSQL para gestionar usuarios, productos, carritos y el flujo de pago con Fintoc.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Configuración

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `env.example` a `.env` y ajusta los valores según tu entorno. (El archivo ejemplo ya incluye las llaves de prueba solicitadas.)

3. Crea la base de datos `ecommerce_db` y corre las migraciones Prisma:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Opcional: genera el cliente de Prisma (lo incluye el paso anterior, pero puedes forzarlo cuando cambies el esquema):

   ```bash
   npx prisma generate
   ```

5. Ejecuta el servidor:

   ```bash
   npm run dev
   ```

## Endpoints principales

- `POST /api/auth/register` – Registro (rol `client` por defecto).
- `POST /api/auth/login` – Login + JWT.
- `GET /api/products` – Listado público de productos.
- `GET /api/products/:productId/stock` – Stock disponible (total, reservado, disponible).
- `GET /api/cart` – Obtiene o crea el carrito del usuario autenticado.
- `POST /api/cart/items` – Agrega productos al carrito.
- `PUT /api/cart/items/:itemId` – Actualiza la cantidad (0 elimina).
- `DELETE /api/cart/items/:itemId` – Elimina el item del carrito.
- `POST /api/purchase/start` – Crea un Checkout Session y retorna `session_token` + `publicKey`.
- `GET /api/purchase/status/:sessionId` – Consulta y sincroniza el estado del Checkout Session.

Todas las rutas bajo `/api/cart` y `/api/purchase` requieren un header `Authorization: Bearer <token>`.

## Notas

- Prisma administra el esquema y genera las migraciones en `prisma/migrations`.
- La integración con Fintoc usa el SDK oficial (`fintoc`). Configura `FINTOC_SECRET_KEY`, `FINTOC_PUBLIC_KEY`, `FINTOC_CURRENCY`, `FINTOC_SUCCESS_URL`, `FINTOC_CANCEL_URL` y `FINTOC_RETURN_URL`.
- `POST /api/purchase/start` responde con `{ checkoutSession, publicKey }`. Usa `checkoutSession.session_token` + `publicKey` para inicializar el widget en tu frontend.
- Las contraseñas se almacenan con `bcryptjs`.
- El middleware `authenticateJWT` protege rutas y `authorizeRole` permite futuras restricciones.
- Para poblar productos de ejemplo usa `npm run seed:products` después de aplicar las migraciones (lee `productos.json`).
