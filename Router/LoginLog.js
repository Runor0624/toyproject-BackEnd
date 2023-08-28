// User Login Log Infomation
const express           = require('express')
const {connection}      = require('../DB/DB')
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

module.exports = router