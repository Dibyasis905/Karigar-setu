# KarigarSetu — UI + Database/Backend Update

This version keeps the original React/Vite UI and connects the main prototype flows to an Express + MongoDB Atlas backend.

## Architecture

React/Vite UI → REST API (Express) → Mongoose → MongoDB Atlas

Collections:
- users
- artisans
- products
- orders

## 1. MongoDB Atlas

Create a MongoDB Atlas cluster and a database user. Copy the Node.js driver connection string.

In `backend-api/.env`, set:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/karigarsetu?retryWrites=true&w=majority
JWT_SECRET=use_a_long_random_secret
CLIENT_ORIGIN=http://localhost:8443,http://localhost:5173
```

Do not commit `.env` or share the password.

## 2. Start backend

Open a terminal in `backend-api`:

```bash
npm install
npm run dev
```

Test:
- `http://localhost:5000/`
- `http://localhost:5000/api/health`

The health endpoint reports whether MongoDB is connected.

## 3. Optional demo data

To create the demo buyer, artisan, artisan profile, and sample products:

```bash
npm run seed
```

Demo logins:
- buyer@karigarsetu.demo / Demo@12345
- artisan@karigarsetu.demo / Demo@12345
- admin@karigarsetu.demo / Demo@12345

The seed script clears the demo collections first, so use it only on a test database.

## 4. Start frontend

Open another terminal in the project root:

```bash
npm install
npm run dev
```

The frontend uses `http://localhost:5000/api` by default. To override it, create a root `.env` with:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 5. Database-backed demo flow

1. Landing screen shows the current database connection status.
2. Login uses JWT authentication against MongoDB-backed users.
3. Artisan dashboard loads products from MongoDB.
4. AI-generated listing can be approved and saved as a product document.
5. Marketplace loads products from MongoDB and category/search filters use API queries.
6. Product details are loaded by product ID from MongoDB.
7. Cart is kept in browser storage until checkout.
8. Checkout posts an order to the Express API; order and stock changes are stored in MongoDB.
9. Order success/tracking reads the created database order.
10. Artisan Orders reads orders involving the artisan's products and can advance order status.

## Important note

The AI/CV stage in this prototype remains a UI simulation. The database integration begins when the generated listing is approved and continues through products, users, and orders.
