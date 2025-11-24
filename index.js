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
app.get("/products/:id", async (req, res) => {
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





//  SERVER START
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});
