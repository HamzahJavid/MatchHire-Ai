const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const resumeRoutes = require("./routes/resumeRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const mongoose = require("mongoose");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const jobRoutes = require("./routes/jobRoutes");
const swipeRoutes = require("./routes/swipeRoutes");
const matchRoutes = require("./routes/matchRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173", // your Vite dev port
    credentials: true
  }),
);
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/resume", resumeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/me", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/swipe", swipeRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/messages", messageRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return res
      .status(413)
      .json({ success: false, error: "File too large. Max 5MB." });
  res.status(500).json({ success: false, error: err.message });
});

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/matchhire";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Fix legacy swipe indexes
    try {
      const db = mongoose.connection.db;
      const swipesCollection = db.collection('swipes');

      // Drop old indexes that cause E11000 errors
      const indexes = await swipesCollection.listIndexes().toArray();
      const indexNames = indexes.map(idx => idx.name);

      if (indexNames.includes('swipedBy_1_job_1')) {
        await swipesCollection.dropIndex('swipedBy_1_job_1');
        console.log('✓ Dropped legacy swipedBy_1_job_1 index');
      }

      if (indexNames.includes('swipedBy_1_seekerProfile_1_hirerProfile_1')) {
        await swipesCollection.dropIndex('swipedBy_1_seekerProfile_1_hirerProfile_1');
        console.log('✓ Dropped legacy swipedBy_1_seekerProfile_1_hirerProfile_1 index');
      }

      // Rebuild indexes from schema definitions
      const Swipe = require('./models/Swipe');
      await Swipe.collection.dropIndexes();
      await Swipe.syncIndexes();
      console.log('✓ Rebuilt Swipe indexes');
    } catch (err) {
      console.warn('Index migration warning:', err.message);
    }

    app.listen(PORT, () =>
      console.log(`Resume parser running on http://localhost:${PORT}`),
    );
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
