const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const resumeRoutes = require("./routes/resumeRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173", // your Vite dev port
  }),
);
app.use(express.json());

app.use("/api/resume", resumeRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return res
      .status(413)
      .json({ success: false, error: "File too large. Max 5MB." });
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () =>
  console.log(`Resume parser running on http://localhost:${PORT}`),
);
