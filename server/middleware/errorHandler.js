// Centralized error handler. Multer and validation errors get friendlier messages.
function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already taken` });
  }
  if (err.message && err.message.includes('Unsupported file type')) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({ message: err.message || 'Server error' });
}

module.exports = errorHandler;
