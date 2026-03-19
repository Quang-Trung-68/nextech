require('./src/configs/server.config'); // loads dotenv
const cloudinary = require('./src/utils/cloudinary');

cloudinary.api.ping(function(error, result) {
  if (error) {
    console.error("Cloudinary connection error:", error);
  } else {
    console.log("Cloudinary connection success:", result);
  }
});
