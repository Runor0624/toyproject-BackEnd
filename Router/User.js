// 회원가입 등 사용자와 관련된 API를 작성합니다.
const express           = require('express')
const {connection}      = require('../DB/DB')
const joi               = require('joi')
const bcrypt            = require('bcrypt')
const requestIp         = require('request-ip')
const JWT               = require('jsonwebtoken')
const LoginverifyToken  = require('../middleware/jwt')
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
          "CREATE TABLE IF NOT EXISTS user (id INT AUTO_INCREMENT PRIMARY KEY, userId VARCHAR(50) NOT NULL, password VARCHAR(200) NOT NULL, nickname VARCHAR(20) NOT NULL, audit VARCHAR(5) NOT NULL, address VARCHAR(100) NOT NULL, addressDetail VARCHAR(100) NOT NULL,  createDate DATETIME DEFAULT CURRENT_TIMESTAMP, updateDate DATETIME ON UPDATE CURRENT_TIMESTAMP)",
          (error) => {
          if (error) {
            console.error(error.message);
          } else {
            console.log("이미 그 테이블은 존재합니다.");
          }
        }
      );
    }
}); // 테이블이 없으면 테이블을 생성, 테이블이 이미 생성되어 있으면 관련 메시지를 console.log로 출력

router.post('/signup', (req,res,next) => {
    const userId        = req.body.userId // 사용자가 로그인시 입력할 ID
    const password      = req.body.password; // 사용자의 비밀번호
    const nickname      = req.body.nickname; // 사용자의 닉네임
    const audit         = req.body.audit; // 사용자의 권한 값 (일반, 관리자)
    const address       = req.body.address; // 사용자의 주소
    const addressDetail = req.body.addressDetail  // 사용자의 상세 주소

    if (!userId  || !password || !nickname || !audit || !address || !addressDetail ) {
        res.status(404).send("누락된 값이 있어요!!")
    } else {
        connection.query('select * from user WHERE userId = ? OR nickname = ?', [userId, nickname], (error, results)  => {
            if (error) {
                return next(error);
            }
        
            if (results.length > 0) {
                const existingUser = results.find(user => user.userId === userId); // results에서 보관하는 user.userId와 userId가 동일 할 경우 에러로 간주
                const existingNickname = results.find(user => user.nickname === nickname);

                if (existingUser) {
                    return res.status(400).send({ message: "이미 가입된 사용자입니다!" });
                }

                if (existingNickname) {
                    return res.status(400).send({ message: "이미 사용 중인 닉네임입니다!" });
                }
            } // 중복 관련 필터링

            const schema = joi.object().keys({
                userId: joi.string().min(4).required(), // userId는 최소 4자 이상이며 필수 값이어야한다.
                password: joi.string().min(5).required(), // 비밀번호는 최소 5자 이상이며 필수 값이어야한다.
                audit : joi.number().min(2).required(),
                nickname: joi.string().min(3).required(),
                address: joi.string().min(2).required(),
                addressDetail: joi.string().min(5).required()
            })

            const validation = schema.validate({ userId, password, audit, nickname, address, addressDetail })

            if (validation.error) {
                return res.status(400).send({ message: validation.error.details[0].message });
            }

            bcrypt.hash(password, 13, (error, hash) => {
                if (error) {
                    return next(error);
                }

                const sql = "INSERT INTO user (userId, password, audit, nickname, address, addressDetail) VALUES (?,?,?,?,?,?)"

                connection.query(sql, [userId, hash, audit, nickname, address, addressDetail], (error) => {
                    if (error) {
                        return next(error)
                    }
                    res.status(200).send({ message: "회원가입 성공" });
                })
            })
        })
    }
}) // 회원가입 코드

router.post('/login', (req,res,next) => {
    const userId   = req.body.userId
    const password = req.body.password
    
    const sql      = "select * from user WHERE userId = ?"
    connection.query(sql, [userId], (error, results) => {
        if (error) {
            return next(error);
        }

        if (results.length === 0) {
            return res.status(401).send({ message: "로그인 정보가 잘못되었어요! 다시 확인하세요." });
        }

        const user = results[0]

        bcrypt.compare(password, user.password, (error, Match) => {
            if (error) {
                return next(error);
            }

            if (!Match) {
                return res.status(401).send({ message: "로그인 정보가 잘못되었어요! 다시 확인하세요." });
            }

            const abos = JWT.sign({
                audit: user.audit,
                id: user.id,
                userId: user.userId,
                exp: Math.floor(Date.now() / 1000) + (60 * 60)
            }, process.env.COOKIE_SECRET);

            const ips = requestIp.getClientIp(req, true).replace(/^.*:/,'') || requestIp.getClientIp(req);
            const params = [ips, user.userId];
            const LoginlogQuery = 'INSERT INTO loginlogs (ip, userId) values (?,?)';
            connection.query(LoginlogQuery, params, (LoginlogErr, LoginlogResult) => {
            if (LoginlogErr) {
                return next(LoginlogErr);
            }

        res.cookie(process.env.COOKIE_SECRET, abos, {httpOnly:true ,maxAge: 1000 * 60 * 60 }); // 쿠키에 토큰 저장
        res.status(200).send({ message: "로그인 성공", token: abos });
        });
        })
    })
}) // 로그인 코드

router.get('/logout', (req, res) => {
    res.clearCookie(process.env.COOKIE_SECRET);
    res.status(200).send({ message: "로그아웃 성공" });
});
 // 로그아웃 관련 코드

router.get('/detail/:id',LoginverifyToken, (req,res) => {
    const sql = 'select id, userId, nickname, audit, address, addressDetail, createDate, updateDate from user where id = ?'
    const params = [req.params.id]

    connection.query(sql, params, function(err, result) {
        if(err) throw err;
        return res.send(result)
    })
}) // 사용자 마이페이지 API - 해당 사용자의 정보 조회

router.get('/admins/all', AuditPermission(process.env.ADMINAUDIT), (req,res) => {
    const page      = req.query.page  || 1  // 페이지 기본값 : 1
    const itemPage  = req.query.limit || 30 // 페이지 당 데이터 수량 제한 : 30
    const offset    = (page - 1) * itemPage
    const sort      = req.query.sort  || 'desc' // 정렬 관련 (기본값 : 내림차 순)

    const orderBy   = sort === 'asc' ? "ASC" : "DESC"
    const sql       = `select id, userId, nickname, audit, address, addressDetail, createDate, updateDate from user ORDER BY createDate ${orderBy} LIMIT ${itemPage} OFFSET ${offset}`
    connection.query(sql, function(err, result) {
        if(err) throw err;
        return res.send(result)
    })
}) // 관리자 페이지 API : 전체 사용자 명단 조회

router.post('/info/:userId', AuditPermission(process.env.ADMINAUDIT), (req,res,next) => {
    const {userId} = req.params;
    const sql = `select id, userId, nickname, audit, address, addressDetail, createDate, updateDate from user where userId LIKE ?`
  
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