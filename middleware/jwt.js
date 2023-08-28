const jwt = require('jsonwebtoken');

function LoginverifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ message: "인증되지 않은 사용자입니다." });
    }

    jwt.verify(token.split(' ')[1], process.env.COOKIE_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ message: "유효하지 않은 토큰입니다." });
        }
        req.user = decoded;
        next();
    });
}

module.exports = LoginverifyToken;
