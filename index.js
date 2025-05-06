const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

// Setup
const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const uri =
  "mongodb+srv://vaibhavgoswami303:n39y7eAJEMwkDZvr@cluster0.qzvptyv.mongodb.net/test"; // Use 'test' database
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Schema and Model for 'products' collection
const productSchema = new mongoose.Schema({
  __EMPTY: Number,
  product_url: String,
  hashid: String,
  status: { type: String, default: "pending" },
});
const Product = mongoose.model("Product", productSchema, "products"); // Use 'products' collection
app.get("/", async (req, res) => {
  res.json({ status: "server is running" });
});
// API to get one pending task
app.get("/get-task", async (req, res) => {
  try {
    const task = await Product.findOneAndUpdate(
      { status: "pending" },
      { $set: { status: "working" } },
      { new: true }
    );

    if (!task) {
      return res.json({ done: true }); // No more tasks
    }

    res.json({
      done: false,
      _id: task._id,
      product_url: task.product_url,
      hashid: task.hashid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// API to update status from client (done or error)
app.post("/update-task", async (req, res) => {
  const { _id, status } = req.body;

  if (!["done", "error"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    // Update the status of the task based on _id
    await Product.findByIdAndUpdate(_id, { $set: { status } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
