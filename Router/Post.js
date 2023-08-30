// Community Post API 
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
          "CREATE TABLE IF NOT EXISTS post (id INT AUTO_INCREMENT PRIMARY KEY, userId INT, viewcount INT DEFAULT 0, createDate DATETIME DEFAULT CURRENT_TIMESTAMP, updateDate DATETIME ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (userId) REFERENCES user(id))",
          (error) => {
          if (error) {
            console.error(error.message);
          } else {
            console.log("이미 그 테이블은 존재합니다.");
          }
        }
      );
    }
}); // 테이블이 없으면 테이블을 생성, 테이블이 이미 생성되어 있으면 관련 메시지를 console.log로 출력 [수정 예정]

module.exports = router