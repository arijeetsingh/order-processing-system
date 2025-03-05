This project simulates a real-world e-commerce order processing system with asynchronous message queues (Kafka), caching (Redis), and a database (MongoDB) to handle large-scale order requests efficiently. Below is a step-by-step breakdown of the entire user journey and system flow.

User Journey Overview
User Places an Order → API stores it in MongoDB and pushes it to Kafka.
Kafka Queues the Order → The order message is placed in a Kafka topic.
Consumer Processes the Order → Worker reads the order from Kafka, updates MongoDB, and caches it in Redis.
User Checks Order Status → API first checks Redis (for fast response). If not found, it queries MongoDB and caches it.
System Ensures Efficiency → Cached data prevents redundant database queries, Kafka ensures scalability.


End-to-End System Flow
Step 1: User Places an Order
📍 Action: A user makes a POST request to the API to place an order.

📄 Request (to /order)

json
Copy
Edit
{
  "product": "Laptop",
  "quantity": 1
}
🔹 What happens?
✅ Order is saved in MongoDB.
✅ Order is published to Kafka (order-topic).
✅ API responds with the order details & ID.

Step 2: Kafka Message Queue Receives the Order
📍 Action: Kafka receives the order message in the order-topic.

🔹 What happens?
✅ The message is stored in Kafka until a consumer processes it.
✅ Kafka ensures fault tolerance (if the consumer fails, the order is still there).

Step 3: Background Worker (Consumer) Processes the Order
📍 Action: A Kafka consumer listens for new messages in order-topic.

🔹 What happens?
✅ Consumer picks up the order and updates MongoDB status → "processing".
✅ Simulates order processing time (setTimeout).
✅ Updates the order status to "completed" in MongoDB.
✅ Caches the processed order in Redis (order:12345 for 1 hour).

Step 4: User Checks Order Status
📍 Action: User makes a GET request to check their order status.

📄 Request (to /order/:id)

sh
Copy
Edit
curl -X GET http://localhost:4000/order/12345
🔹 What happens?
✅ Step 1: Check Redis Cache

If order is found in Redis, return it instantly (low latency).
If not found, move to Step 2.
✅ Step 2: Query MongoDB

Fetch order from MongoDB.
Store it in Redis for future requests (cache for 1 hour).
Return response to the user.
📄 Response Example

json
Copy
Edit
{
  "id": "12345",
  "product": "Laptop",
  "quantity": 1,
  "status": "completed"
}
🚀 Benefit: Users get their order status quickly without querying MongoDB every time.

🔹 Why This System is Scalable & Efficient?
Kafka Ensures Asynchronous Processing

Orders are queued, and processing happens in the background.
Even if the worker crashes, Kafka retains messages.
Redis Provides Fast Caching

Frequently accessed orders are served from cache (milliseconds).
Reduces MongoDB load.
MongoDB Stores Permanent Data

Serves as the source of truth.
Orders remain stored even if Redis cache expires.
🎯 Final User Flow Summary
✅ User places an order (POST /order)
✅ API saves it in MongoDB & publishes to Kafka
✅ Kafka holds the order until a worker picks it up
✅ Worker processes order, updates MongoDB, caches in Redis
✅ User checks order status (GET /order/:id)
✅ Fast response from Redis or fallback to MongoDB

🚀 Want to Improve Further?
Some possible enhancements:
🔹 Retry Logic → If an order fails, Kafka can retry processing.
🔹 Notifications → Send email/SMS alerts when order is completed.
🔹 Distributed Processing → Deploy multiple Kafka consumers for high traffic.
