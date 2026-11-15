# ShopEasy

ShopEasy is a demo pharmacy and wellness store. Browse the 16-product catalog and adjust cart quantities on the cards or product pages. Guest checkout records contact and delivery details with the order in MongoDB. Admins can manage inventory, upload product photos, and view order details.

## Live links

- [ShopEasy storefront](https://shopeasy-hr4a.onrender.com/)
- [ShopEasy backend API](https://shopeasy-api-6ikd.onrender.com/api/products)

## Run locally on Windows

Install **JDK 21**, **Maven 3.9+**, **Node.js 22.12+ or 24 LTS**, and **Git**. Use MongoDB Atlas or a local MongoDB replica set for checkout. Verify your tools in PowerShell.

```powershell
java -version
mvn -v
node -v
npm -v
git --version
```

### 1. Choose a database

**Atlas.**. Create a database user for `shopeasy_dev` and allow your current IP. Use that user's Atlas URI in `backend/.env`.

**Local replica set.** Start Docker Desktop, then run these commands in PowerShell. Run the first two only on initial setup. On later visits, use `docker start shopeasy-mongo-rs`.

```powershell
docker run --name shopeasy-mongo-rs -p 127.0.0.1:27017:27017 -v shopeasy-replica-data:/data/db -d mongo:8.0 --replSet shopeasy-rs --bind_ip_all
docker exec shopeasy-mongo-rs mongosh --quiet --eval "rs.initiate({_id:'shopeasy-rs',members:[{_id:0,host:'localhost:27017'}]})"
docker exec shopeasy-mongo-rs mongosh --quiet --eval "db.hello().isWritablePrimary"
```

If the init command cannot connect yet, wait for MongoDB to start and run it again. Once the last command prints `true`, use the connection string from `backend/.env.example`. The replica set lets MongoDB commit an order and its stock deductions together. A standalone MongoDB instance can serve the catalog and inventory, while checkout requires a replica set.

### 2. Start Spring Boot on 8081

Open PowerShell in the extracted `ShopEasy` folder.

```powershell
Set-Location backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Set `MONGODB_URI` for your database and choose an `ADMIN_USERNAME` and `ADMIN_PASSWORD`. The local password minimum defaults to **six characters**. Set `ADMIN_JWT_SECRET` to any nonblank text you choose. The development profile derives the signing key when your value is shorter than 32 UTF-8 bytes.

Save `KEY=value` lines without wrapping quotes. Spring reads the file from the backend working directory in the development profile. Earlier PowerShell `$env:` assignments override matching file values. Open a fresh shell if those settings were session-only, or remove specific overrides.

```powershell
Remove-Item Env:PORT,Env:SPRING_PROFILES_ACTIVE,Env:MONGODB_URI,Env:MONGODB_DATABASE,Env:ADMIN_USERNAME,Env:ADMIN_PASSWORD,Env:ADMIN_PASSWORD_MIN_LENGTH,Env:ADMIN_JWT_SECRET,Env:PUBLIC_API_URL -ErrorAction SilentlyContinue
mvn spring-boot:run
```

In another terminal, verify health and the first eight products.

```powershell
Invoke-RestMethod 'http://localhost:8081/actuator/health'
Invoke-RestMethod 'http://localhost:8081/api/products?page=0&size=8'
```

Expected on a fresh database are health `UP`, eight items on page zero, and 16 total. The seed runs at startup when the product collection is empty. Set `SEED_SAMPLE_DATA=false` to start with an empty catalog.

### 3. Start Vite on 5173

In a second PowerShell terminal, from the extracted `ShopEasy` folder, run the following.

```powershell
Set-Location frontend
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm ci
npm run dev
```

Open [ShopEasy locally](http://localhost:5173). Click **Admin** and use the credentials from the backend file. The browser keeps the admin token in memory for up to 30 minutes, so refreshing the admin page requires sign-in again. The cart persists on refresh. If a checkout response is lost, return to checkout in the same tab and click **Retry order** to recover the confirmation using the saved request.

To reset the admin password, edit `ADMIN_PASSWORD` in the backend file, clear any shell override, stop the backend with Ctrl+C, and start it again. Change `ADMIN_JWT_SECRET` as well if you want to revoke tokens already issued. On Render, update secrets in the API service's **Environment** tab and redeploy.

## Configuration

| Variable | Purpose |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` by default locally and `prod` on Render. |
| `MONGODB_URI` | Atlas driver URI or a local replica set URI. |
| `MONGODB_DATABASE` | Defaults to `shopeasy_dev` in dev and `shopeasy_prod` in prod. |
| `PORT` | Local Spring Boot default is `8081`. Render supplies the service port. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Single admin account. BCrypt limits a password to 72 UTF-8 bytes. |
| `ADMIN_PASSWORD_MIN_LENGTH` | Defaults to `6` in dev and `12` in prod. Use a strong, unique production password. |
| `ADMIN_JWT_SECRET` | Nonblank text in dev. Use a private random signing secret of at least 32 UTF-8 bytes in production. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins with scheme and optional port. Dev allows the two loopback origins on port 5173. |
| `PUBLIC_API_URL` | Origin for seeded image URLs. Defaults to the local backend origin in dev and `RENDER_EXTERNAL_URL` in prod. |
| `SEED_SAMPLE_DATA` | Defaults to `true`. Runs when the product collection is empty. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Server-side credentials for optional signed image uploads. |
| `VITE_API_URL` | Public API origin for React, such as `http://localhost:8081`. Vite reads it when starting or building. |

The sample products come with images served by Spring at `/catalog/`. The admin form accepts existing HTTP(S) image URLs and uploads JPG, PNG, or WebP files up to 5 MB. To enable the picker for uploads, enter the three Cloudinary settings in the backend file and restart Spring. The selected file is previewed immediately and uploaded when you save. Spring returns the resulting HTTPS delivery URL.

## API

Send `Authorization: Bearer <accessToken>` for admin operations. The login response includes the token and its lifetime in seconds.

| Method | Path | Success |
|---|---|---|
| GET | `/actuator/health` | `200`, database-aware health |
| GET | `/api/products` | `200`, active catalog |
| GET | `/api/products/categories` | `200`, distinct active categories |
| GET | `/api/products/{id}` | `200`, active product |
| POST | `/api/admin/login` | `200`, signed admin token |
| GET | `/api/admin/products` | `200`, inventory including hidden products |
| POST | `/api/products` | `201`, admin creates product |
| PUT | `/api/products/{id}` | `200`, admin updates product |
| DELETE | `/api/products/{id}` | `204`, admin deletes product |
| POST | `/api/admin/images` | `201`, admin uploads multipart `file` and receives `imageUrl` |
| POST | `/api/orders` | `201`, guest places order |
| GET | `/api/admin/orders` | `200`, admin order history and item snapshots |

**Catalog.** Combine any of `search`, `category`, `minPrice`, `maxPrice`, and `sort`. Search matches a literal name substring and category matches exactly, both case-insensitively. Price bounds are inclusive. Price filters and sorts use the **original** price. Sort values are `price_asc`, `price_desc`, `rating`, and `newest`. MongoDB uses the ID as a stable tiebreaker.

```text
GET /api/products?search=vitamin&category=Vitamins&minPrice=300&maxPrice=600&sort=price_asc&page=0&size=8
```

With no page parameters the catalog returns its original array. Supply `page` or `size` to receive an object with `items`, `page`, `size`, `total`, `totalPages`, and `hasNext`. Pages start at zero, sizes range from 1 to 100, and the catalog defaults to 8 when only the page is specified. Orders always return a page and default to 10 records. Use valid values for `page` and `size` even when the requested page is empty.

**Product create or update body**

```json
{
  "name": "Travel First Aid Kit",
  "description": "A compact kit with gauze, bandages, and wipes.",
  "category": "First Aid",
  "brand": "CareKit",
  "price": 499.99,
  "discountPercent": 15,
  "stock": 12,
  "imageUrl": "http://localhost:8081/catalog/adhesive-bandages.webp",
  "rating": 4.5,
  "active": true
}
```

The response includes the generated ID, an original price of `499.99`, a discounted price of `424.99`, and `createdAt`. Price is rounded half-up to two decimals. Omitting `active` on creation defaults it to true. Edits preserve the creation timestamp and the current visibility when `active` is omitted.

**Checkout body**

Use an active product ID from the catalog and the `discountedPrice` from the response. Send a fresh UUID as the `Idempotency-Key` HTTP header for each new checkout. Retry an uncertain request with the same key and body.

```json
{
  "customerName": "Demo Shopper",
  "email": "shopper@example.com",
  "phone": "+91 00000 12345",
  "deliveryAddress": {
    "line1": "24 Demo Lane",
    "line2": "Unit 2",
    "city": "Sample City",
    "state": "Delhi",
    "postalCode": "110001",
    "country": "India"
  },
  "items": [
    {
      "productId": "65537abc2d3d9c57d572b512",
      "quantity": 2,
      "expectedUnitPrice": 424.99
    }
  ]
}
```

A new order requires a phone number and delivery address. The phone number can contain 7 to 15 digits, and `line2` is optional. A successful checkout returns the order reference, contact and delivery details, item snapshots, and total. An identical retry returns the saved confirmation, including for orders placed before delivery details were added. A price or stock change returns `409` and requires a cart review. Keep order requests to 100 distinct products. The demo ends at order confirmation.

**Error example**

```json
{
  "timestamp": "2026-11-15T10:30:00Z",
  "status": 400,
  "message": "Check the highlighted fields.",
  "fieldErrors": {
    "stock": "must be greater than or equal to 0"
  }
}
```

Missing or invalid admin credentials return `401`. Insufficient authority returns `403`, and missing products return `404`. Uploads can return `413` for oversized files, `502` for a provider failure, and `503` when Cloudinary settings are missing.

## Build and test the apps

In the backend folder, run `mvn clean package` and start the result with `java -jar target/shopeasy-api.jar`. In the frontend folder, run `npm ci`, `npm run lint`, and `npm run build`. To open the built site locally, stop the Vite dev server and run `npm run preview`.

Import both files in [postman/](postman/), select **ShopEasy Local**, and enter your admin username and password. Use a seeded development database. The runner signs in, tests catalog filters and pagination, places and retries an order with a temporary product, and checks the saved order before deleting that product. The demo order stays in history. To try uploading, set `runUpload=true`, choose a file in the upload request's **Body** tab, and send it with an active admin token.
