const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|webm/;

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: jpg, png, gif, webp, mp4, mov, webm'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

module.exports = upload;
