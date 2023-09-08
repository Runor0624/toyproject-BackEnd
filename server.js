/* 필요한 패키지 Import */
const express          = require ('express')
const session          = require ('express-session')
const RateLimit        = require ('express-rate-limit')
const dotenv           = require ('dotenv')
const cors             = require ('cors')
const cookieParser     = require ('cookie-parser')
const morgan           = require ('morgan')
const multer           = require('multer');
const path             = require('path')

/* 필요한 패키지 Import */

/* Routing - import 부분 */
const TestRouter       = require('./Router/Tests')
const PostRouter       = require('./Router/Post')
const NoticeRouter     = require('./Router/Notice')
const UserRouter       = require('./Router/User')
const LoginLogRouter   = require('./Router/LoginLog')
/* Routing */

dotenv.config()

const Limiter = RateLimit({
    windowMs: 60 * 1000,
    max: 500, // 1분당 API 요청 500회 이상일 경우
    handler(req,res) {
        res.status(this.statusCode).json({
            code: this.statusCode,
            message: "1분당 API 호출 횟수 초과!" // 얘를 출력하며 1분간 API 호출을 막음.
        })
    }
})

const app = express()

if(process.env.NODE_ENV === 'production') {
    app.use(morgan('combined')) // 배포 환경 : log에 IP를 남김
} else {
    app.use(morgan('dev')) // 개발환경 에서  console.log에 log 기록
}

const upload = multer({ dest: 'public/images/' });

app.set('PORT', process.env.PORT || 8095)

const corsOptions = {
    origin: ["*"], // 이후 수정 예정
    credentials: true
}

app.use(cors(corsOptions))
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,

    cookie: {
        secure: false
    }
}))

app.use('/test', Limiter, TestRouter)
app.use('/user', Limiter, UserRouter)
app.use('/logins', Limiter, LoginLogRouter)
app.use('/notice', Limiter, NoticeRouter)

app.listen(app.get('PORT'), () => {
    console.log(app.get("PORT"), "포트로 서버 가동")
}) 