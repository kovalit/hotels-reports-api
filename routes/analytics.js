const express = require("express")
const router = express.Router()

// Main analytics endpoint
router.get("/booking-analytics", async (req, res) => {
  try {
    const { startDate, endDate, key } = req.query

    // Validation
    if (!startDate || !endDate || !key) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["startDate", "endDate", "key"],
        received: { startDate, endDate, key },
      })
    }

    // Validate key is one of the allowed values
    const allowedKeys = [
      "open_booking_module",
      "select_room",
      "select_rateplan",
      "select_services",
      "registration",
      "booking",
      "pay",
    ]

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({
        error: "Invalid key parameter",
        allowed: allowedKeys,
        received: key,
      })
    }

    // Parse dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
        message: "Dates must be in ISO 8601 format (YYYY-MM-DD)",
      })
    }

    if (start > end) {
      return res.status(400).json({
        error: "Invalid date range",
        message: "startDate must be before or equal to endDate",
      })
    }

    // Get database from app locals
    const db = req.app.locals.db
    const collection = db.collection(req.app.locals.collectionName)

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          datetime: {
            $gte: start,
            $lte: end,
          },
          [key]: true,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$datetime" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]

    // Execute aggregation
    const results = await collection.aggregate(pipeline).toArray()

    // Calculate total
    const total = results.reduce((sum, item) => sum + item.count, 0)

    const distribution = results.map((item) => ({
      count: item.count,
      date: item._id,
    }))

    res.json({
      key,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      total,
      distribution,
    })
  } catch (error) {
    console.error("Error processing request:", error)
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    })
  }
})

// Test endpoint with mock data
router.get("/booking-analytics/test", (req, res) => {
  res.json({
    key: "open_booking_module",
    dateRange: {
      start: "2024-01-01",
      end: "2024-01-07",
    },
    total: 150,
    distribution: [
      { count: 20, date: "2024-01-01" },
      { count: 25, date: "2024-01-02" },
      { count: 18, date: "2024-01-03" },
      { count: 22, date: "2024-01-04" },
      { count: 30, date: "2024-01-05" },
      { count: 15, date: "2024-01-06" },
      { count: 20, date: "2024-01-07" },
    ],
  })
})

// Booking funnel summary endpoint - returns counts for all keys
router.get("/booking-funnel-summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["startDate", "endDate"],
        received: { startDate, endDate },
      })
    }

    // Parse dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
        message: "Dates must be in ISO 8601 format (YYYY-MM-DD)",
      })
    }

    if (start > end) {
      return res.status(400).json({
        error: "Invalid date range",
        message: "startDate must be before or equal to endDate",
      })
    }

    // Get database from app locals
    const db = req.app.locals.db
    const collection = db.collection(req.app.locals.collectionName)

    const pipeline = [
      {
        $match: {
          datetime: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $facet: {
          total: [{ $count: "count" }],
          open_booking_module: [{ $match: { open_booking_module: true } }, { $count: "count" }],
          select_room: [{ $match: { select_room: true } }, { $count: "count" }],
          select_rateplan: [{ $match: { select_rateplan: true } }, { $count: "count" }],
          select_services: [{ $match: { select_services: true } }, { $count: "count" }],
          registration: [{ $match: { registration: true } }, { $count: "count" }],
          booking: [{ $match: { booking: true } }, { $count: "count" }],
          pay: [{ $match: { pay: true } }, { $count: "count" }],
          amount: [{ $match: { pay: true } }, { $group: { _id: null, total: { $sum: "$amount" } } }],
          amount_rooms: [{ $group: { _id: null, total: { $sum: "$amount_rooms" } } }],
          amount_services: [{ $group: { _id: null, total: { $sum: "$amount_services" } } }],
        },
      },
    ]

    // Execute aggregation
    const results = await collection.aggregate(pipeline).toArray()
    const data = results[0]

    const response = {
      total: data.total[0]?.count || 0,
      open_booking_module: data.open_booking_module[0]?.count || 0,
      select_room: data.select_room[0]?.count || 0,
      select_rateplan: data.select_rateplan[0]?.count || 0,
      select_services: data.select_services[0]?.count || 0,
      registration: data.registration[0]?.count || 0,
      booking: data.booking[0]?.count || 0,
      pay: data.pay[0]?.count || 0,
      amount: data.amount[0]?.total || 0,
      amount_rooms: data.amount_rooms[0]?.total || 0,
      amount_services: data.amount_services[0]?.total || 0,
    }

    res.json(response)
  } catch (error) {
    console.error("Error processing request:", error)
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    })
  }
})

router.get("/booking-funnel-summary/test", (req, res) => {
  res.json({
    total: 1000,
    open_booking_module: 900,
    select_room: 800,
    select_rateplan: 700,
    select_services: 600,
    registration: 500,
    booking: 400,
    pay: 200,
    amount: 50000,
    amount_rooms: 35000,
    amount_services: 15000,
  })
})

// Services summary endpoint - returns unique services with count and total price
router.get("/services-summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["startDate", "endDate"],
        received: { startDate, endDate },
      })
    }

    // Parse dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
        message: "Dates must be in ISO 8601 format (YYYY-MM-DD)",
      })
    }

    if (start > end) {
      return res.status(400).json({
        error: "Invalid date range",
        message: "startDate must be before or equal to endDate",
      })
    }

    // Get database from app locals
    const db = req.app.locals.db
    const collection = db.collection(req.app.locals.collectionName)

    // Build aggregation pipeline to unwind services and group by service id
    const pipeline = [
      {
        $match: {
          datetime: {
            $gte: start,
            $lte: end,
          },
          services: { $exists: true, $ne: [] },
        },
      },
      {
        $unwind: "$services",
      },
      {
        $group: {
          _id: "$services.id",
          label: { $first: "$services.label" },
          count: { $sum: 1 },
          amount_price: { $sum: "$services.price" },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          label: 1,
          count: 1,
          amount_price: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]

    // Execute aggregation
    const results = await collection.aggregate(pipeline).toArray()

    res.json(results)
  } catch (error) {
    console.error("Error processing request:", error)
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    })
  }
})

// Test endpoint for services summary
router.get("/services-summary/test", (req, res) => {
  res.json([
    {
      id: "1022502793808216065",
      label: "Stress Control Program (2 visits)",
      count: 15,
      amount_price: 120000,
    },
    {
      id: "1022502793808216066",
      label: "Massage Therapy Session",
      count: 10,
      amount_price: 50000,
    },
    {
      id: "1022502793808216067",
      label: "Yoga Class Package",
      count: 8,
      amount_price: 32000,
    },
  ])
})

module.exports = router
