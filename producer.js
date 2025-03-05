const express = require("express");
const { Kafka } = require("kafkajs");
const mongoose = require("mongoose");
const redis = require("redis");

require("dotenv").config();

const app = express();
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/orders_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const orderSchema = new mongoose.Schema({
  product: String,
  quantity: Number,
  status: { type: String, default: "pending" },
});

const Order = mongoose.model("Order", orderSchema);

const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

const redisClient = redis.createClient({ url: "redis://localhost:6379" });
redisClient.connect();

app.post("/order", async (req, res) => {
  const { product, quantity } = req.body;
  const order = new Order({ product, quantity });
  await order.save();

  await producer.connect();
  await producer.send({
    topic: "order-topic",
    messages: [{ value: JSON.stringify(order) }],
  });

  res.status(200).send(order);
});

app.listen(3000, () => console.log("Producer API running on port 3000"));
