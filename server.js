const express = require("express")
const { MongoClient } = require("mongodb")
const cors = require("cors")
require("dotenv").config()

const analyticsRoutes = require("./routes/analytics")

const app = express()
const PORT = process.env.PORT || 3000

const DATABASE_NAME = "visitslogs"
const COLLECTION_NAME = "hotelsite"

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB connection
let db
let client

async function connectToDatabase() {
  if (db) return db

  try {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    db = client.db(DATABASE_NAME)

    app.locals.db = db
    app.locals.collectionName = COLLECTION_NAME

    console.log(`Connected to MongoDB - Database: ${DATABASE_NAME}`)
    return db
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

// Initialize database connection before starting server
connectToDatabase()

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use("/api", analyticsRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`API endpoint: http://localhost:${PORT}/api/booking-analytics`)
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing server...")
  if (client) {
    await client.close()
  }
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing server...")
  if (client) {
    await client.close()
  }
  process.exit(0)
})
