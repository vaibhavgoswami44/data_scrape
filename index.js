const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const workbookPath = 'data.xlsx';
let workbook = xlsx.readFile(workbookPath);
let sheet = workbook.Sheets[workbook.SheetNames[0]];

// Parse data
function getData() {
    return xlsx.utils.sheet_to_json(sheet, { range: 1, header: 1 });
}

// Get next task
app.get('/get-task', (req, res) => {
    const data = getData();
    for (let i = 0; i < data.length; i++) {
        const [number, url, id, status] = data[i];
        if (status !== 'done') {
            return res.json({ url, id, done: false });
        }
    }
    res.json({ done: true });
});

// Handle uploads
const upload = multer({ dest: 'uploads/' });
app.post('/submit-task', upload.single('file'), (req, res) => {
    const { id } = req.body;
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, 'pages', `${id}.html`);

    // Move file
    fs.renameSync(tempPath, targetPath);

    // Update Excel
    const data = getData();
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row[2] == id) {
            const cellRef = `D${i + 2}`;
            sheet[cellRef] = { t: 's', v: 'done' };
            xlsx.writeFile(workbook, workbookPath);
            break;
        }
    }

    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
