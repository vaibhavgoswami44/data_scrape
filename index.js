const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver'); // 🔄 Used to zip files

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for Lazada
app.use(cors({
  origin: 'https://www.lazada.vn'
}));

// Setup upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'pages'),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Load Excel
const excelFilePath = 'data.xlsx';
let workbook = xlsx.readFile(excelFilePath);
let sheetName = workbook.SheetNames[0];
let worksheet = workbook.Sheets[sheetName];
let data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

let currentIndex = 1; // skip header

// Serve next task
app.get('/get-task', (req, res) => {
  while (currentIndex < data.length) {
    const [number, url, id, status] = data[currentIndex];
    if (id && url && number && status !== 'done') {
      return res.json({ url, id });
    }
    currentIndex++;
  }

  // When done, respond with done and download links
  return res.json({
    done: true,
    zipUrl: `/download/pages.zip`,
    excelUrl: `/download/data.xlsx`
  });
});

// Upload HTML page and mark done
app.post('/submit-task', upload.single('file'), (req, res) => {
  const id = req.body.id;
  const file = req.file;

  if (!id || !file) {
    return res.status(400).json({ error: 'Missing ID or file' });
  }

  // Mark row done
  const row = data.findIndex(row => row[2] === id);
  if (row !== -1) {
    data[row][3] = 'done';
    const updatedSheet = xlsx.utils.aoa_to_sheet(data);
    workbook.Sheets[sheetName] = updatedSheet;
    xlsx.writeFile(workbook, excelFilePath);
  }

  res.json({ success: true });
});

// Download updated Excel or zipped HTMLs
app.get('/download/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, fileName === 'data.xlsx' ? 'data.xlsx' : 'pages.zip');

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.download(filePath);
});

// Auto-create zip of all pages
function createZipArchive() {
  const zipPath = path.join(__dirname, 'pages.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip');

  output.on('close', () => console.log(`📦 ZIP created: ${archive.pointer()} total bytes`));
  archive.on('error', err => { throw err; });

  archive.pipe(output);
  archive.directory('pages/', false);
  archive.finalize();
}

// 🧹 Optional: create the zip when server starts or when you want
app.get('/generate-zip', (req, res) => {
  createZipArchive();
  res.send('Zip created.');
});

// Ensure folders exist
if (!fs.existsSync('pages')) fs.mkdirSync('pages');

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
