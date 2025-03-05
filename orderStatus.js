const express = require("express");
const mongoose = require("mongoose");
const redis = require("redis");

const app = express();
mongoose.connect("mongodb://localhost:27017/orders_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const orderSchema = new mongoose.Schema({
  product: String,
  quantity: Number,
  status: String,
});
const Order = mongoose.model("Order", orderSchema);

const redisClient = redis.createClient({ url: "redis://localhost:6379" });
redisClient.connect();

app.get("/order/:id", async (req, res) => {
  const orderId = req.params.id;
  const cachedOrder = await redisClient.get(`order:${orderId}`);

  if (cachedOrder) {
    return res.json(JSON.parse(cachedOrder));
    console.log("Getting cached response");
  }
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).send("Order not found");
  }
  await redisClient.setEx(`order:${orderId}`, 3600, JSON.stringify(order));
  res.json(order);
});

app.listen(4000, () => console.log("Order Status API running on port 4000"));
