# Booking Analytics API

An Express-based MongoDB API for retrieving booking funnel analytics data.

## Features

- RESTful API for booking funnel analytics
- Date range filtering
- Daily distribution aggregation
- Docker containerization support
- Health check endpoint
- Graceful shutdown handling

## Quick Start

### Local Development

1. **Install dependencies:**
\`\`\`bash
npm install
\`\`\`

2. **Configure environment variables:**
\`\`\`bash
cp .env.example .env
# Edit .env and update MONGODB_URI with your MongoDB connection string
\`\`\`

3. **Start the server:**
\`\`\`bash
npm run dev
\`\`\`

The API will be available at `http://localhost:3000`

### Docker Deployment

#### Option 1: Docker only (use your own MongoDB)

\`\`\`bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run
\`\`\`

#### Option 2: Docker Compose (includes MongoDB)

\`\`\`bash
# Start both API and MongoDB
npm run docker:compose

# Stop services
npm run docker:compose:down
\`\`\`

Docker Compose will start:
- API server on `http://localhost:3000`
- MongoDB on `localhost:27017`

## API Endpoints

### Health Check

**GET** `/health`

Returns server status.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2025-01-23T10:30:00.000Z"
}
\`\`\`

### Booking Analytics

**GET** `/api/booking-analytics`

Retrieves booking analytics data for a specific funnel step within a date range.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | Yes | Start date in ISO format (YYYY-MM-DD) |
| `endDate` | string | Yes | End date in ISO format (YYYY-MM-DD) |
| `key` | string | Yes | Funnel step to analyze |

**Valid Keys:**
- `open_booking_module`
- `select_room`
- `select_rateplan`
- `select_services`
- `registration`
- `booking`
- `pay`

**Example Request:**
\`\`\`bash
curl "http://localhost:3000/api/booking-analytics?startDate=2024-01-01&endDate=2024-01-31&key=booking"
\`\`\`

**Example Response:**
\`\`\`json
{
  "key": "booking",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "total": 150,
  "distribution": [
    { "date": "2024-01-01", "count": 25 },
    { "date": "2024-01-02", "count": 30 },
    { "date": "2024-01-03", "count": 45 },
    { "date": "2024-01-04", "count": 50 }
  ]
}
\`\`\`

### Test Endpoint

**GET** `/api/booking-analytics/test`

Returns mock data to demonstrate the expected response format.

## Error Responses

### 400 Bad Request
Missing or invalid parameters:
\`\`\`json
{
  "error": "Missing required parameters",
  "required": ["startDate", "endDate", "key"],
  "received": { "startDate": "2024-01-01", "endDate": null, "key": "booking" }
}
\`\`\`

### 404 Not Found
Invalid route:
\`\`\`json
{
  "error": "Not found",
  "message": "Route GET /invalid not found"
}
\`\`\`

### 500 Internal Server Error
Database or server errors:
\`\`\`json
{
  "error": "Internal server error",
  "message": "Connection to MongoDB failed"
}
\`\`\`

## Database Schema

The API expects a MongoDB collection named `booking_funnel` with documents in the following format:

\`\`\`javascript
{
  "_id": ObjectId("..."),
  "date": ISODate("2024-01-01T00:00:00.000Z"),
  "open_booking_module": true,
  "select_room": true,
  "select_rateplan": false,
  "select_services": false,
  "registration": false,
  "booking": false,
  "pay": false
}
\`\`\`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/booking_db` |
| `PORT` | Server port | `3000` |

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container
- `npm run docker:compose` - Start with Docker Compose
- `npm run docker:compose:down` - Stop Docker Compose services

## Production Deployment

1. Build the Docker image:
\`\`\`bash
docker build -t booking-api .
\`\`\`

2. Run with environment variables:
\`\`\`bash
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://your-mongo-host:27017/booking_db \
  booking-api
\`\`\`

## License

MIT
