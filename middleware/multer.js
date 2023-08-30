const multer = require("multer");
// Multer 관련 미들웨어 입니다.
const upload = multer({
    dest: 'public/images/',
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|PNG|JPEG|JPG|webp|WEBP)$/)) {
        return cb(new Error('JPG 등 이미지와 연관된 확장자만 사용이 가능합니다'));
      }
      cb(null, true);
    },
    limits: {
      fileSize: 1024 * 1024 // 1MB
    }
});

module.exports = upload
