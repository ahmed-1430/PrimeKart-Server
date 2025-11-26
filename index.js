const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

//  Environment Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

//  MongoDB Setup
let db, usersCollection, productsCollection;

async function connectDB() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db("primekartDB");
        usersCollection = db.collection("users");
        productsCollection = db.collection("products");
        ordersCollection = db.collection("orders");

        console.log(" MongoDB Connected Successfully");
    } catch (error) {
        console.error(" MongoDB Connection Failed:", error);
    }
}
connectDB();

//  Root Route
app.get("/", (req, res) => {
    res.send(" PrimeKart Server is Running......");
});


//  Register User
app.post("/users/register", async (req, res) => {
    const { name, email, password } = req.body;

    const exists = await usersCollection.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    await usersCollection.insertOne({ name, email, password });
    res.json({ message: "✅ User Registered Successfully" });
});


//  Login User
app.post("/users/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await usersCollection.findOne({ email, password });
    if (!user) return res.status(401).json({ message: "Invalid Credentials" });

    res.json({
        message: " Login Successful",
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    });
});


// UPDATE USER PROFILE DATA
app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedData }
        );

        res.json({ message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});





//  PRODUCT ROUTES


//  Add Product
app.post("/api/products", async (req, res) => {
    const product = req.body;
    const result = await productsCollection.insertOne(product);

    res.json({
        message: "Product Added Successfully",
        productId: result.insertedId
    });
});


//  Get All Products
app.get("/api/products", async (req, res) => {
    const products = await productsCollection.find().toArray();
    res.json(products);
});


//  Get Product By ID
app.get("/api/products/:id", async (req, res) => {
    const id = req.params.id;

    const product = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!product) return res.status(404).json({ message: "Product Not Found" });

    res.json(product);
});


//  Delete Product
app.delete("/products/:id", async (req, res) => {
    const id = req.params.id;

    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Product Not Found" });
    }

    res.json({ message: " Product Deleted Successfully" });
});

// POST ORDER TO DB
app.post("/api/orders", async (req, res) => {
    const { userId, customer, items, total, address } = req.body;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: Login required to place order" });
    }

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
    }

    const orderData = {
        userId,
        customer,
        items,
        total,
        address,
        status: "Pending",
        createdAt: new Date()
    };

    const result = await ordersCollection.insertOne(orderData);

    res.json({
        message: "Order Placed Successfully",
        orderId: result.insertedId
    });
});


// GET ORDERS BY USER EMAIL OR ID FOR USER'S ORDER
app.get("/api/orders/:email", async (req, res) => {
    try {
        const email = req.params.email;

        // QUERY CORRECT FIELD
        const orders = await ordersCollection
            .find({ "customer.email": email })
            .sort({ createdAt: -1 })
            .toArray();

        console.log("Fetched Orders:", orders); // DEBUG

        res.json(orders);
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ message: "Server error" });
    }
});


//  ALL ORDER FROM DB FOR ADMIN DASHBOARD ONLY - IMPLEMENT IT NEXT-----
app.get("/api/orders", async (req, res) => {
    const orders = await ordersCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();

    res.json(orders);
});





//  SERVER START
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});
