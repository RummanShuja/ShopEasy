# ShopEasy

A pharmacy and wellness demo built with React + Vite, Spring Boot 3 / Java 21, MongoDB, and signed Cloudinary uploads. The storefront, customer accounts, persistent carts, checkout, order tracking, and admin workspace use the backend APIs.

## Live links

- [ShopEasy storefront](https://shopeasy-hr4a.onrender.com/)
- [ShopEasy backend API](https://shopeasy-api-6ikd.onrender.com/api/products)

## Local setup

Install JDK 21, Maven 3.9+, and Node.js 22.12+.

Use MongoDB Atlas or a local **replica set**. Checkout and order status changes use MongoDB transactions. If you already connect to Atlas, keep that connection and skip the Docker commands. For a new local Docker database:

```powershell
docker run --name shopeasy-mongo-rs -p 127.0.0.1:27017:27017 -v shopeasy-replica-data:/data/db -d mongo:8.0 --replSet shopeasy-rs --bind_ip_all
docker exec shopeasy-mongo-rs mongosh --quiet --eval "rs.initiate({_id:'shopeasy-rs',members:[{_id:0,host:'localhost:27017'}]})"
```

In a PowerShell terminal at the repository root, prepare the backend environment without overwriting an existing file:

```powershell
Set-Location backend
if (!(Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

Edit `backend/.env` and set the database URI, admin credentials, `ADMIN_JWT_SECRET`, and **`CUSTOMER_JWT_SECRET`**. Use separate private random signing keys; the customer key must contain at least 32 UTF-8 bytes. Each fresh checkout needs its own environment configuration because `.env` files are not included in Git.

Generate a random key in Windows PowerShell when configuring another environment:

```powershell
$signingBytes = New-Object byte[] 48
$keyGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$keyGenerator.GetBytes($signingBytes)
$keyGenerator.Dispose()
[Convert]::ToBase64String($signingBytes)
```

Start the API from `backend/`:

```powershell
mvn spring-boot:run
```

In a second PowerShell terminal at the repository root, prepare and start the frontend:

```powershell
Set-Location frontend
if (!(Test-Path -LiteralPath .env.local)) { Copy-Item -LiteralPath .env.example -Destination .env.local }
npm ci
npm run dev
```

The frontend example uses `VITE_API_URL=http://localhost:8081`. Keep it aligned with your local backend port and restart Vite after changing it.

Open `http://localhost:5173`. The API health check is `http://localhost:8081/actuator/health`. An empty product collection receives 16 sample products with bundled images. Seeding does not overwrite existing inventory.

Keep both PowerShell terminals open and use Ctrl+C in each to stop the apps. Once dependencies and environment files are configured, subsequent starts require `mvn spring-boot:run` in `backend/` and `npm run dev` in `frontend/`. If you chose the local Docker database, start its existing container with `docker start shopeasy-mongo-rs` first.

### Existing database index names

Startup reuses compatible indexes regardless of their names, including a unique customer email index named `email` rather than `email_1`. It still checks the index fields, uniqueness, TTL, and other constraints. No indexes or customer records are dropped.

If an older checkout exits with `IndexOptionsConflict: Index already exists with a different name: email` at `CustomerIndexes.run`, use the updated startup code and rerun `mvn spring-boot:run`. The preceding successful Atlas connection and `Tomcat started` lines do not mean startup completed: database initialization runs afterward and can shut the app down if it fails.

## Environment variables

| Variable | Purpose |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` locally; `prod` on Render. |
| `MONGODB_URI` | Atlas URI or local replica set URI. |
| `MONGODB_DATABASE` | Defaults to `shopeasy_dev` / `shopeasy_prod`. |
| `PORT` | API port; local default `8081`. Render supplies its port. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Existing single admin account. |
| `ADMIN_PASSWORD_MIN_LENGTH` | Default 6 in dev, 12 in prod. Passwords have a 72-byte BCrypt limit. |
| `ADMIN_JWT_SECRET` | Existing admin signing key; at least 32 UTF-8 bytes in production. |
| `CUSTOMER_JWT_SECRET` | Customer signing key; at least 32 UTF-8 bytes in every profile. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated exact frontend origins, including scheme and port. |
| `PUBLIC_API_URL` | Origin for seeded images; local backend origin by default. Production defaults to `RENDER_EXTERNAL_URL`. |
| `SEED_SAMPLE_DATA` | Defaults to `true`; seeds only an empty product collection. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Server-side settings for signed image uploads. Existing image URLs work without them. |
| `VITE_API_URL` | Public API origin, read when Vite starts or builds. |

Keep `.env` files private. Environment variables override values in the local backend file.

## Render services

Keep the existing separate frontend and backend services. The backend Dockerfile builds Java 21. Set `SPRING_PROFILES_ACTIVE=prod`, Atlas settings, both JWT signing keys, admin credentials, Cloudinary settings, and the exact frontend origin in `CORS_ALLOWED_ORIGINS` on the API service.

Build the frontend from `frontend/` using `npm ci && npm run build`, publish `dist/`, and set `VITE_API_URL` to the API HTTPS origin before building. Configure the static service's SPA rewrite `/*` → `/index.html` so product, account, tracking, and admin routes work after refresh.

The bearer-token flow does not depend on cookies or same-site domains. CORS permits `PATCH` for admin status updates. Adding `CUSTOMER_JWT_SECRET` is required before deploying the updated backend.

### Push changes and update the existing deployment

Run these commands from the repository root to update the existing GitHub repository on `main`:

```powershell
git status
git add .gitignore README.md backend frontend postman
git diff --cached --stat
git commit -m "Upgrade ShopEasy storefront, accounts, carts and order tracking"
git push origin main
```

For the first combined frontend/backend upgrade, temporarily disable auto-deploy on both existing Render services before pushing so you can deploy the backend first. Add the production `CUSTOMER_JWT_SECRET` in the backend service's Environment tab using **Save only**. Keep the existing production database URI/name and credentials, confirm the exact frontend HTTPS origin in `CORS_ALLOWED_ORIGINS`, and set the backend health-check path to `/actuator/health`.

Choose **Manual Deploy → Deploy latest commit** for the backend and wait for `/actuator/health` to report `UP`. Then deploy the frontend's latest commit with the API HTTPS origin in `VITE_API_URL`. Check Offers, customer sign-in, order tracking, and the admin editor. Re-enable automatic deployments after both services work.

Atlas data remains separate from Render deploys. The latest Offers, image-editor, and redirect fixes require no database migration. The account/tracking upgrade adds collections and optional order fields while keeping older guest orders readable. Startup reuses compatible existing indexes; it does not drop records or indexes. Back up production before the larger upgrade and use a separate development database for local testing. If deployment fails, check Render logs for missing environment variables, database connectivity, or incompatible indexes. Rolling back application code does not roll back Atlas data.

## Authentication and carts

Customer registration normalizes emails and enforces a unique MongoDB index. Passwords use BCrypt. Customer access JWTs last **15 minutes**, identify the customer and session, and carry customer scope. Active sessions are stored in MongoDB with a TTL index. Every authenticated request checks the session and expiry; server logout deletes the exact session, immediately rejecting that token.

The frontend stores the customer token in `sessionStorage` and restores it through `GET /api/customer/session` after a same-tab refresh. Expired or rejected sessions are cleared. Admin authentication remains separate and in memory, with its existing 30-minute lifetime.

Successful customer sign-in and registration open `/shop`. Customers can open My Orders from the account menu.

Guest carts retain the original `shopeasy-cart-v1` localStorage format. Customer carts are stored by verified customer ID in MongoDB. Login merges the guest cart once using a persisted merge ID, combines matching quantities, and clamps them to available stock. The guest cart clears only after success. Failed merges can be retried safely; switching accounts loads that account's cart.

Checkout saves delivery/contact information and purchase-time product snapshots. The server validates current stock and discounted prices and commits the order, stock deductions, and customer cart deductions together. Retries with the same UUID `Idempotency-Key` and body recover the same order without deducting stock again. A key cannot be replayed under another customer identity. Failed checkouts retain the cart.

Product details show **Go to Cart** beside the quantity controls whenever that product is in the cart. The button opens the cart drawer without navigating away and disappears when the product is removed. Cart quantities and the navbar badge share the same cart state for guests and signed-in customers.

The admin workspace has an overview at `/admin`, product CRUD and inventory at `/admin/products`, and searchable order management at `/admin/orders`. These screens use actual backend data and share the existing admin authorization; customers cannot access the admin APIs.

## API

Send `Authorization: Bearer <accessToken>` for protected requests. Customer and admin tokens cannot substitute for each other.

| Method | Path | Access |
|---|---|---|
| GET | `/actuator/health` | Public |
| GET | `/api/products`, `/api/products/{id}`, `/api/products/categories` | Public |
| POST | `/api/customer/register` | Public; `{ name, email, password }` |
| POST | `/api/customer/login` | Public; `{ email, password }` |
| GET | `/api/customer/session` | Customer; `{ id, name, email }` |
| POST | `/api/customer/logout` | Customer; returns 204 |
| GET | `/api/cart` | Customer |
| PUT | `/api/cart/items/{productId}` | Customer; `{ quantity }`; zero removes |
| POST | `/api/cart/merge` | Customer; `{ mergeId, items: [{ productId, quantity }] }` |
| POST | `/api/orders` | Guest or customer; requires `Idempotency-Key` |
| GET | `/api/orders`, `/api/orders/{orderId}` | Customer; own orders only |
| POST | `/api/admin/login` | Public; `{ username, password }` |
| GET | `/api/admin/products` | Admin; includes hidden inventory |
| POST | `/api/products` | Admin; creates product |
| PUT, DELETE | `/api/products/{id}` | Admin; edits/deletes product |
| POST | `/api/admin/images` | Admin; multipart `file`, returns `{ imageUrl }` |
| GET | `/api/admin/orders` | Admin; paginated, optional `search` and `status` |
| GET | `/api/admin/orders/stats` | Admin; actual counts by status |
| GET | `/api/admin/orders/{orderId}` | Admin; details and tracking history |
| PATCH | `/api/admin/orders/{orderId}/status` | Admin; `{ status, version, note? }` |

Registration/login return `{ accessToken, expiresIn, customer: { id, name, email } }`. Cart responses are `{ items: [{ product, quantity }], adjustments: [] }`.

Catalog filters: `search`, `category`, `minPrice`, `maxPrice`, `minRating` (0–5), `inStock=true`, `offersOnly=true`, and `sort` (`newest`, `rating`, `price_asc`, `price_desc`). Offers require `discountPercent > 0`; the database applies this filter before pagination and totals. Price filters/sorts use original prices. Search is a literal case-insensitive name substring. Supply `page` or `size` for a page response; without them the catalog preserves its original array response.

The admin image editor shows the current filename and a replacement file picker. The saved delivery URL stays internal to the form state. An optional **Use an image link instead** control accepts a replacement link without displaying the existing URL. Public product image addresses remain inspectable by the browser; Cloudinary credentials stay on the server.

Page responses contain `{ items, page, size, total, totalPages, hasNext }`. Pages are zero-based; sizes range from 1 to 100. Catalog pages default to 8 and order pages to 10, with stable ID tiebreakers.

Example checkout body:

```json
{
  "customerName": "Demo Shopper",
  "email": "shopper@example.com",
  "phone": "+91 98765 43210",
  "deliveryAddress": {
    "line1": "24 Demo Lane",
    "line2": "Unit 2",
    "city": "New Delhi",
    "state": "Delhi",
    "postalCode": "110001",
    "country": "India"
  },
  "items": [{ "productId": "<catalog-id>", "quantity": 2, "expectedUnitPrice": 279.20 }]
}
```

The idempotency key is a fresh UUID per new checkout. Retry uncertain requests with the same key and body. A changed price/stock returns 409 for cart review. Phone numbers contain 7–15 digits; `line2` is optional.

## Order tracking

Lifecycle: `PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`. Cancellation is allowed from pending, confirmed, or processing and returns purchased stock in the same transaction. Delivered and cancelled orders are terminal.

Every response includes the stable order `id`, current `status`, `statusHistory`, `version`, and permitted `allowedTransitions`. Submit that **exact order ID** in the status URL and its latest version in the body:

```http
PATCH /api/admin/orders/<order-id>/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{ "status": "SHIPPED", "version": 2, "note": "Order dispatched" }
```

The server verifies the transition and exact document version and appends a server-timestamped history event transactionally. A competing/stale update returns 409; fetch the current order before retrying. Customer list/detail requests enforce ownership using the JWT subject and return 404 for someone else's order.

Existing guest orders retain their IDs, fields, prices, and admin visibility. Legacy orders without status/history remain readable as pending with an empty recorded timeline. Customer tracking refreshes from the API; it does not invent delivery dates, locations, or time-driven progress.

Errors use `{ timestamp, status, message, fieldErrors }`: 400 validation, 401 missing/expired/revoked authentication, 403 wrong scope, 404 missing/unowned records, 409 stale cart/order state. Image uploads support JPG/PNG/WebP up to 5 MB; unavailable configuration returns 503 and provider failures return 502.

## Build

```powershell
# backend/
mvn package

# frontend/
npm run lint
npm run build
```

The backend build produces `backend/target/shopeasy-api.jar`; run it from `backend/` with `java -jar target/shopeasy-api.jar`. The frontend build produces `frontend/dist/`; run `npm run preview` from `frontend/` to preview it locally.

For manual API requests, import both files from `postman/`, select **ShopEasy Local**, and configure the environment for your local backend. The collection includes catalog filters, product CRUD, image uploads, guest checkout, customer accounts and carts, and order tracking. Use a development database for requests that create or change data.
