const express             = require('express');
const {connection}        = require('../DB/DB')
const LoginverifyToken    = require('../middleware/jwt');
const upload              = require('../middleware/multer');
const dotenv              = require('dotenv');

dotenv.config()
const router = express.Router();


connection.getConnection((error) => {
    if (error) {
      console.error(error.message);
    } else {
      console.log("DB 연결 완료!");
  
      connection.query(
          "CREATE TABLE IF NOT EXISTS tests (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(255) NOT NULL,  description VARCHAR(255) NOT NULL, images VARCHAR(255) NOT NULL, createDate DATETIME DEFAULT CURRENT_TIMESTAMP, updateDate DATETIME ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES user(id))",
          (error) => {
          if (error) {
            console.error(error.message);
          } else {
            console.log("이미 그 테이블은 존재합니다.");
          }
        }
      );
    }
});

router.get('/', (req,res) => {
    const sql = 'select * from tests'
    connection.query(sql, function(err, result) {
        return res.send(result);
    })
})

router.post('/', LoginverifyToken, upload.single('images'), (req, res) => {
  const user = req.user;

  const { title, description } = req.body;
  const imageUrl1 = req.file.filename
  const insertQuery = 'INSERT INTO tests (user_id, title, description, images) VALUES (?, ?, ?, ?)';
  connection.query(insertQuery, [user.id, title, description, imageUrl1], (error, result) => {
      if (error) {
          console.error("DB Error:", error); // 서버 콘솔에 에러 메시지 표시
          return res.status(500).send({ message: "데이터 저장 중 에러가 발생했습니다.", error: error.message });
      }
      res.status(200).send({ message: "데이터 저장 성공" });
  });
});

module.exports = router