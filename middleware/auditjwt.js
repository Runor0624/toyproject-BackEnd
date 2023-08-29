// 권한 별 구분하기 위한 미들웨어
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
dotenv.config()

function AuditPermission(requiredAudit) {
    return (req, res, next) => {
      const token = req.headers.authorization;
  
      if (!token) {
        return res.status(401).send({ message: "인증되지 않은 사용자입니다." });
      }
  
      jwt.verify(token.split(' ')[1], process.env.COOKIE_SECRET, (error, decoded) => {
        if (error) {
          return res.status(401).send({ message: "유효하지 않은 토큰입니다." });
        }
        
        const userAudit = decoded.audit;
     
        if (JSON.stringify(userAudit) !== JSON.stringify(requiredAudit)) {
          return res.status(403).send({ message: "권한이 없습니다." });
        }
  
        req.user = decoded;
        next();
      });
    };
  }
  
  module.exports = AuditPermission;
  