const express = require("express");
const cors = require("cors");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// ✅ Allow requests from lazada.vn (CORS)
app.use(
  cors({
    origin: "https://www.lazada.vn",
  })
);

// 📁 Storage configuration for uploaded HTML files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "pages");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// 📄 Load Excel data
const excelFilePath = "data.xlsx";
let workbook = xlsx.readFile(excelFilePath);
let sheetName = workbook.SheetNames[0];
let worksheet = workbook.Sheets[sheetName];
let data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

let currentIndex = 1; // Skip header row
app.get("/", (req, res) => {
  res.json("hh");
});
// 🔍 Serve the next task
app.get("/get-task", (req, res) => {
  while (currentIndex < data.length) {
    const [number, url, id] = data[currentIndex];
    if (id && url && number && data[currentIndex][3] !== "done") {
      return res.json({ url, id });
    }
    currentIndex++;
  }
  return res.json({ done: true });
});

// 📤 Receive uploaded file and mark row as done
app.post("/submit-task", upload.single("file"), (req, res) => {
  const id = req.body.id;
  const file = req.file;

  if (!id || !file) {
    return res.status(400).json({ error: "Missing ID or file" });
  }

  // ✅ Mark row as done
  const row = data.findIndex((row) => row[2] === id);
  if (row !== -1) {
    data[row][3] = "done";
    const updatedSheet = xlsx.utils.aoa_to_sheet(data);
    workbook.Sheets[sheetName] = updatedSheet;
    xlsx.writeFile(workbook, excelFilePath);
  }

  res.json({ success: true });
});

// ✅ Make sure directories exist
if (!fs.existsSync("pages")) fs.mkdirSync("pages");

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
