const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI);
let tokensCollection;

client.connect().then(() => {
  const db = client.db("notificationApp");
  tokensCollection = db.collection("tokens");
  console.log("✅ MongoDB Connected");
});

// Save FCM token
app.post('/save-token', async (req, res) => {
  const { name, token } = req.body;
  if (!token || !name) return res.status(400).send({ error: "Name and token required" });

  await tokensCollection.updateOne(
    { token },
    { $set: { name, token, createdAt: new Date() } },
    { upsert: true }
  );

  res.send({ success: true });
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
