// 공지사항에서 사용하는 API 모음 입니다.
const express             = require('express');
const {connection}        = require('../DB/DB')
const AuditPermission     = require('../middleware/auditjwt')
const joi                 = require('joi')
const dotenv              = require('dotenv');

dotenv.config()
const router = express.Router();

connection.getConnection((error) => {
    if (error) {
      console.error(error.message);
    } else {
      console.log("DB 연결 완료!");
  
      connection.query(
          "CREATE TABLE IF NOT EXISTS notices (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(255) NOT NULL,  description VARCHAR(255) NOT NULL, category VARCHAR(255) NOT NULL, createDate DATETIME DEFAULT CURRENT_TIMESTAMP, updateDate DATETIME ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES user(id))",
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
    const page      = req.query.page  || 1  // 페이지 기본값 : 1
    const itemPage  = req.query.limit || 30 // 페이지 당 데이터 수량 제한 : 30
    const offset    = (page - 1) * itemPage
    const sort      = req.query.sort  || 'desc' // 정렬 관련 (기본값 : 내림차 순)
    const orderBy   = sort === 'asc' ? "ASC" : "DESC"

    const sql = `select * from notices ORDER BY createDate ${orderBy} LIMIT ${itemPage} OFFSET ${offset}`
    connection.query(sql, function(err, result) {
        return res.send(result)
    })
}) // 모든 사용자 : 공지사항 전체 조회

router.post('/', AuditPermission(process.env.ADMINAUDIT), (req,res) => {
  
    const { title, description, category } = req.body;
    const user = req.user;

    const user_id = user.id;

    const schema = joi.object().keys({
        user_id: joi.required(), // userId는 최소 4자 이상이며 필수 값이어야한다.
        title: joi.string().min(5).required(), 
        description : joi.string().min(2).required(),
        category: joi.string().min(3).required()
    })

    const validation = schema.validate({ user_id, title, description, category })

    if (validation.error) {
        return res.status(400).send({ message: validation.error.details[0].message });
    }

    const sql = 'INSERT INTO notices (user_id, title, description, category) values (?,?,?,?)'

    connection.query(sql, [user.id, title, description, category], (error, result) => {
        if (error) {
            console.error("DB Error:", error); // 서버 콘솔에 에러 메시지 표시
            return res.status(500).send({ message: "데이터 저장 중 에러가 발생했습니다.", error: error.message });
        }
        res.status(200).send({ message: "데이터 저장 성공" });
    })
}) // 관리자 한정 : 공지사항 작성

router.post('/info/:title', (req,res) => {
    const {title} = req.params;
    const sql = `select title, description, category from notices where title LIKE ?`
  
    connection.query(sql, [`%${title}%`], function (err, result) {
      if (err) {
        return res.status(500).send('Internal Server Error');
      }
  
      if (result.length === 0) {
        return res.status(400).send('일치하는 데이터가 없어요!');
      }
  
      return res.send(result);
    })
}) // 공지사항 제목 기준 검색하도록 추가 필요 권한 : 없음.

router.delete('/:id', (req, res) => {
    const Id = req.params.id;
  
    const sql = "DELETE FROM notices WHERE Id = ?";
    const params = [Id];
  
    connection.query(sql, params, function(err, result) {
      if (err) throw err;
    });
}); // 공지사항 삭제 (관리자용)
module.exports = router