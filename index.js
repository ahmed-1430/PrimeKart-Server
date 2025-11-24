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



//  SERVER START
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});
