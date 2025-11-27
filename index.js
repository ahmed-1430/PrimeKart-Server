

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- ENV ---------------- */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
    console.error("ERROR: MONGO_URI missing");
    process.exit(1);
}
if (!JWT_SECRET) {
    console.error("ERROR: JWT_SECRET missing");
    process.exit(1);
}

/* ---------------- DATABASE ---------------- */
let db, usersCollection, productsCollection, ordersCollection;

async function connectDB() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db("primekartDB");
        usersCollection = db.collection("users");
        productsCollection = db.collection("products");
        ordersCollection = db.collection("orders");

        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB Error:", error);
        process.exit(1);
    }
}
connectDB();



// Create JWT — signs whatever payload you pass (make sure payload includes id & email)
function createToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Auth middleware
function verifyToken(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        if (!header.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // decoded should contain at least { id, email, role } if you created token correctly
        req.user = decoded;
        next();
    } catch (err) {
        console.warn("verifyToken error:", err && err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

// Admin check
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin role required" });
    }
    next();
}

// Async wrapper
const wrap = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/* ---------------- ROUTES ---------------- */

app.get("/", (req, res) => res.send("PrimeKart Server Running 🚀"));

/* -------- AUTH -------- */

// REGISTER
app.post(
    "/api/users/register",
    wrap(async (req, res) => {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ message: "Name, email, password required" });

        const exists = await usersCollection.findOne({ email: email.toLowerCase() });
        if (exists) return res.status(400).json({ message: "User already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const userDoc = {
            name,
            email: email.toLowerCase(),
            password: hashed,
            role: "user",
            createdAt: new Date(),
        };

        const result = await usersCollection.insertOne(userDoc);

        const user = {
            id: String(result.insertedId),
            name,
            email: email.toLowerCase(),
            role: "user",
        };

        const token = createToken(user);

        // Return user and token separately (consistent with login)
        return res.status(201).json({
            message: "User registered",
            user,
            token,
        });
    })
);

// LOGIN
app.post(
    "/api/users/login",
    wrap(async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: "Email and password required" });

        const user = await usersCollection.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: "Invalid credentials" });

        const safeUser = {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const token = createToken(safeUser);

        // Return user and token separately
        return res.json({
            message: "Login successful",
            user: safeUser,
            token,
        });
    })
);

// GET CURRENT USER
app.get(
    "/api/users/me",
    verifyToken,
    wrap(async (req, res) => {
        // req.user must be set by verifyToken and contain id
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }

        const user = await usersCollection.findOne(
            { _id: new ObjectId(req.user.id) },
            { projection: { password: 0 } }
        );

        if (!user) return res.status(404).json({ message: "User not found" });

        // Return user object directly (frontend can use res.data)
        return res.json({ ...user, id: String(user._id) });
    })
);

// UPDATE PROFILE
app.put(
    "/api/users/:id",
    verifyToken,
    wrap(async (req, res) => {
        const { id } = req.params;

        if (req.user.role !== "admin" && req.user.id !== id)
            return res.status(403).json({ message: "Not allowed" });

        const updates = { ...req.body };
        delete updates.role;
        delete updates.password;

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );

        if (!result.matchedCount)
            return res.status(404).json({ message: "User not found" });

        return res.json({ message: "Profile updated" });
    })
);

/* -------- PRODUCTS -------- */

// GET ALL
app.get(
    "/api/products",
    wrap(async (req, res) => {
        const products = await productsCollection.find().toArray();
        res.json(products);
    })
);

// GET ONE
app.get(
    "/api/products/:id",
    wrap(async (req, res) => {
        const { id } = req.params;
        if (!ObjectId.isValid(id))
            return res.status(400).json({ message: "Invalid product ID" });

        const product = await productsCollection.findOne({ _id: new ObjectId(id) });
        if (!product) return res.status(404).json({ message: "Product not found" });

        res.json(product);
    })
);

// CREATE (ADMIN)
app.post(
    "/api/admin/products",
    verifyToken,
    requireAdmin,
    wrap(async (req, res) => {
        const product = req.body;
        if (!product.title || !product.price)
            return res.status(400).json({ message: "title and price required" });

        const result = await productsCollection.insertOne({
            ...product,
            createdAt: new Date(),
        });

        res.status(201).json({ message: "Product added", id: result.insertedId });
    })
);

// ADMIN: UPDATE ORDER STATUS
app.put(
    "/api/admin/orders/:id",
    verifyToken,
    requireAdmin,
    wrap(async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        if (!status)
            return res.status(400).json({ message: "Status is required" });

        const result = await ordersCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { status } },
            { returnDocument: "after" }
        );

        if (!result)
            return res.status(404).json({ message: "Order not found" });

        return res.json(result);
    })
);


// DELETE (ADMIN)
app.delete(
    "/api/admin/products/:id",
    verifyToken,
    requireAdmin,
    wrap(async (req, res) => {
        const { id } = req.params;

        const result = await productsCollection.deleteOne({
            _id: new ObjectId(id),
        });

        if (!result.deletedCount)
            return res.status(404).json({ message: "Product not found" });

        res.json({ message: "Product deleted" });
    })
);

/* -------- ORDERS -------- */

// PLACE ORDER
app.post(
    "/api/orders",
    verifyToken,
    wrap(async (req, res) => {
        const { customer, items, total, address } = req.body;

        if (!items?.length)
            return res.status(400).json({ message: "Cart is empty" });

        const order = {
            userId: req.user.id,
            customer: {
                name: customer?.name || "",
                email: req.user.email,
                phone: customer?.phone || "",
            },
            items,
            total,
            address,
            status: "Pending",
            createdAt: new Date(),
        };

        const result = await ordersCollection.insertOne(order);

        return res.status(201).json({
            message: "Order placed",
            orderId: result.insertedId,
        });
    })
);

// GET USER ORDERS
app.get(
    "/api/orders/:email",
    verifyToken,
    wrap(async (req, res) => {
        // ensure token contains email
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }

        const tokenEmail = req.user.email;
        const { email } = req.params;

        if (tokenEmail !== email) {
            return res.status(403).json({ message: "Forbidden - Email mismatch" });
        }

        // Query orders by customer.email
        const orders = await ordersCollection.find({ "customer.email": email }).toArray();
        return res.json(orders);
    })
);

// ADMIN: ALL ORDERS
app.get(
    "/api/admin/orders",
    verifyToken,
    requireAdmin,
    wrap(async (req, res) => {
        const orders = await ordersCollection
            .find()
            .sort({ createdAt: -1 })
            .toArray();
        res.json(orders);
    })
);

// ADMIN: UPDATE STATUS
app.put(
    "/api/admin/orders/:id/status",
    verifyToken,
    requireAdmin,
    wrap(async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) return res.status(400).json({ message: "Status required" });

        const result = await ordersCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status } }
        );

        if (!result.matchedCount)
            return res.status(404).json({ message: "Order not found" });

        res.json({ message: "Order status updated" });
    })
);

/* -------- ADMIN SUMMARY -------- */
app.get(
    "/api/admin/summary",
    verifyToken,
    requireAdmin,
    wrap(async (req, res) => {
        const products = await productsCollection.countDocuments();
        const users = await usersCollection.countDocuments();
        const orders = await ordersCollection.find().toArray();

        res.json({
            products,
            users,
            orders: orders.length,
            pending: orders.filter((o) => o.status === "Pending").length,
            recentOrders: orders.slice(0, 6),
        });
    })
);

/* -------- ERROR HANDLING -------- */
app.use((err, req, res, next) => {
    console.error("🔥 SERVER ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
});

/* -------- START SERVER -------- */
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
