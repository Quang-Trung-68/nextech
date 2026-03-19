require('./src/configs/server.config'); // loads dotenv
const express = require('express');
const upload = require('./src/middleware/upload');
const app = express();

app.post('/test', upload.array('images', 5), (req, res) => {
  res.json({ success: true, files: req.files });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message, stack: err.stack });
});

app.listen(9876, () => {
  console.log('App running on 9876');
});
