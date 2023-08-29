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
  const page      = req.query.page  || 1  // 페이지 기본값 : 1
  const itemPage  = req.query.limit || 30 // 페이지 당 데이터 수량 제한 : 30
  const offset    = (page - 1) * itemPage
  const sort      = req.query.sort  || 'desc' // 정렬 관련 (기본값 : 내림차 순)

  const orderBy   = sort === 'asc' ? "ASC" : "DESC"
  const sql = `select * from loginlogs ORDER BY createDate ${orderBy} LIMIT ${itemPage} OFFSET ${offset}`
  connection.query(sql, function(err, result) {
      return res.send(result);
  })
}) // LoginLog 전체 조회 : 관리자용

router.post('/:userId', AuditPermission(process.env.ADMINAUDIT), (req,res,next) => {
  const {userId} = req.params;
  const sql = `select * from loginlogs where userId LIKE ?`

  connection.query(sql, [`%${userId}%`], function (err, result) {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }

    if (result.length === 0) {
      return res.status(400).send('일치하는 데이터가 없어요!');
    }

    return res.send(result);
  })
}) // userId 기준 검색 하도록 추가 

module.exports = router