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
});

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
})

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
})

router.post('/logout', (req, res) => {
    const token = req.cookies[process.env.COOKIE_SECRET]; // 클라이언트에서 전달된 토큰

    if (!token) {
        return res.status(401).send({ message: "로그인되어 있지 않습니다." });
    }

    try {
        // 토큰을 해석하여 유저 정보 가져오기
        const decoded = JWT.verify(token, process.env.COOKIE_SECRET);

        // 토큰을 무효화시키기 위해 유효기간을 현재 시간으로 설정
        const abos = JWT.sign({
            audit: decoded.audit,
            id: decoded.id,
            userId: decoded.userId,
            exp: 0 // 현재 시간보다 이전이므로 유효하지 않은 토큰이 됨
        }, process.env.COOKIE_SECRET);

        // 브라우저에서 쿠키 제거
        res.cookie(process.env.COOKIE_SECRET, abos, { httpOnly: true, expires: new Date(0) });

        res.status(200).send({ message: "로그아웃 성공" });
    } catch (error) {
        // 토큰 해석 중 에러 발생 (만료된 토큰 등)
        res.status(401).send({ message: "유효하지 않은 토큰입니다." });
    }
});

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

// 이후 : 관리자 페이지 API -> 특정값 기준 검색하는 기능 추가.

module.exports = router