const { Kafka } = require("kafkajs");
const mongoose = require("mongoose");
const redis = require("redis");

mongoose.connect("mongodb://localhost:27017/orders_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const orderSchema = new mongoose.Schema({
    product: String,
    quantity: Number,
    status: String
});

const Order = mongoose.model("Order", orderSchema);

const kafka = new Kafka({clientId: "order_worker", brokers: ["localhost:9092"]});
const consumer = kafka.consumer({groupId: "order-group"});

const redisClient = redis.createClient({ url: "redis://localhost:6379" });
redisClient.connect();

const processOrder = async (order) => {
    console.log("Processing order:", order._id);
    await Order.updateOne({_id: order._id}, {status: "processing"});

    //Simulating work
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await Order.updateOne({_id: order._id}, {status: "completed"});

    // cache for 1 hour
    await redisClient.setEx(`order:${order._id}`, 3600, JSON.stringify({ ...order, status: "completed" }));

    console.log("Order processed:", order._id);
}

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({topic: "order-topic"});

    await consumer.run({
        eachMessage: async({message}) => {
            const order = JSON.parse(message.value.toString());
            await processOrder(order);
        }
    })
}

run();

