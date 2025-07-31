const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
require("dotenv").config({ path: "../.env", override: true });

const app = express();

const allowedOrigins = ["*",
  "https://notification-slave-frontend-web.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001"
];

// ✅ Middleware for CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

app.use(bodyParser.json());
let client;
let tokensCollection;

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("❌ MONGO_URI is missing in environment variables");
  }
  if (!client) {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("notificationApp");
    tokensCollection = db.collection("tokens");
    console.log("✅ MongoDB Connected");
  }
}

// ✅ Test route
app.get('/', async (req, res) => {
  try {
    await connectDB();
    res.send('✅ Welcome to the Notification API — MongoDB Connected!');
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Save FCM token
app.post('/save-token', async (req, res) => {
  try {
    await connectDB();
    const { name, token } = req.body;
    if (!token || !name) {
      return res.status(400).json({ error: "Name and token required" });
    }

    await tokensCollection.updateOne(
      { token },
      { $set: { name, token, createdAt: new Date() } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving token:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Local dev only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Local server running on http://localhost:${PORT}`);
  });
}

// ✅ Export for Vercel
module.exports = app;
