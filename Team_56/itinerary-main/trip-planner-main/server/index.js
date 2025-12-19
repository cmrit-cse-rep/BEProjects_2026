const express = require("express");
const path = require("path");
const cors = require("cors");
const { spawn } = require("child_process");
require("dotenv").config();
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const bucketListRoutes = require("./routes/bucketList");
const connectDB = require("./config/db");

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/bucketList", bucketListRoutes);
app.use("/api/user", userRoutes);

// POST route to generate itinerary
app.post("/generate-itinerary", (req, res) => {
  const { source, destination, start_date, end_date, budget } = req.body;

  // Validate request body
  if (!source || !destination || !start_date || !end_date || !budget) {
    return res.status(400).json({ error: "Please provide all required fields!" });
  }

  // Spawn Python process to call the itinerary generation script
  const pythonProcess = spawn("python", [
    "app.py", 
    source, 
    destination, 
    start_date, 
    end_date, 
    budget
  ]);

  let result = "";

  pythonProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("Python error:", data.toString());
    res.status(500).json({ error: "Error generating itinerary." });
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      try {
        const itinerary = JSON.parse(result);
        res.json({ itinerary });
      } catch (error) {
        res.status(500).json({ error: "Error parsing Python response." });
      }
    } else {
      console.error(`Python process exited with code ${code}`);
      res.status(500).json({ error: "Python process failed." });
    }
  });
});

// Serve Frontend
// app.use(express.static(path.join(__dirname, "../client/build")));

//app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "../", "client", "build", "index.html"));
// });

const server = app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free the port or use a different one.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});

