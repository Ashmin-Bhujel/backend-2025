import multer from "multer";

// Configure disk storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, `${file.originalname}-${new Date.now()}`);
  },
});

export const upload = multer({ storage });
