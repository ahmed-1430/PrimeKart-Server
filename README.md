# PrimeKart Server 🚀

A production-ready **Node.js + Express + MongoDB backend** powering the PrimeKart eCommerce platform. This server provides secure authentication, product management, order processing, and admin-level analytics.

---

## 📌 Features

### 🔐 **Authentication System**

* JWT-based authentication
* Secure password hashing with **bcryptjs**
* Role-based access: **User / Admin**
* Login, Signup, Profile fetch

### 🛍️ **Product Management**

* Public product list & details
* Admin CRUD operations (Create, Update, Delete)
* Image support (Cloudinary-ready)

### 🧺 **Shopping Cart Flow**

* Add/remove/update cart items
* Stores cart data for authenticated users

### 📦 **Order Management**

* Users can place orders
* Users can view their orders
* Admin can manage all orders
* Order status updates

### 📊 **Admin Dashboard APIs**

* Total users
* Total orders
* Total products
* Revenue stats
* Recent transactions

---

## 📁 Folder Structure

```
PrimeKart-Server
│
├── config/          # DB connection, JWT, Cloudinary
├── controllers/     # Business logic handlers
├── middleware/      # Auth, validation, error handlers
├── models/          # Mongoose schemas
├── routes/          # API route definitions
├── .env.example     # Environment variables template
└── index.js        # App entry point
```

---

## 🛠️ Installation & Setup

### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/your-repo/PrimeKart-Server.git
cd PrimeKart-Server
```

### **2️⃣ Install Dependencies**

```bash
npm install
```

### **3️⃣ Create Environment Variables**

Create a `.env` file based on `.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### **4️⃣ Run the Server**

```bash
npm run dev
```

Server will run at: **[http://localhost:5000](http://localhost:5000)**

---

## 🔧 Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB + Mongoose**
* **JSON Web Tokens (JWT)**
* **bcryptjs**
* **Cloudinary (optional)**

---

## 📌 API Overview

### **Auth Routes**

* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET /api/auth/profile`

### **Product Routes**

* `GET /api/products`
* `GET /api/products/:id`
* `POST /api/products` *(admin)*
* `PUT /api/products/:id` *(admin)*
* `DELETE /api/products/:id` *(admin)*

### **Order Routes**

* `POST /api/orders` *(user)*
* `GET /api/orders/my-orders` *(user)*
* `GET /api/orders` *(admin)*

### **Admin Summary Route**

* `GET /api/admin/summary`

---

## 📌 Upcoming Features

* Advanced admin dashboard (graphs, analytics)
* Email notifications for orders
* Stock & inventory system
* Multi-vendor support
* Wishlist & reviews (frontend-ready)

---

## 👨‍💻 Author

**Ahmed**
*MERN Stack | Front-End Developer*
🔗 LinkedIn: [https://www.linkedin.com/in/ahmed1430/](https://www.linkedin.com/in/ahmed1430/)

---

If you'd like badges, endpoint tables, or more advanced API documentation (Swagger / Postman), just tell me!
