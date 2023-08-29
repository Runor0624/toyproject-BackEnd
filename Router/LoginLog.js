// User Login Log Infomation
// 이후 할일 : 특정 Audit 보유자만 get 하도록 수정, 페이징 추가
const express           = require('express')
const {connection}      = require('../DB/DB')
const AuditPermission   = require('../middleware/auditjwt')
const dotenv            = require('dotenv')

dotenv.config()

const router            = express.Router()

connection.getConnection((error) => {
    if (error) {
      console.error(error.message);
    } else {
      console.log("DB 연결 완료!");
  
      connection.query(
          "CREATE TABLE IF NOT EXISTS loginlogs (id INT AUTO_INCREMENT PRIMARY KEY, userId VARCHAR(50) NOT NULL, ip VARCHAR(255) NOT NULL,  createDate DATETIME DEFAULT CURRENT_TIMESTAMP, updateDate DATETIME ON UPDATE CURRENT_TIMESTAMP)",
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

router.get('/alls', AuditPermission(process.env.ADMINAUDIT), (req,res) => {
  const sql = 'select * from loginlogs'
  connection.query(sql, function(err, result) {
      return res.send(result);
  })
})

module.exports = router