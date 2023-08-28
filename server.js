/* 필요한 패키지 Import */
import express          from 'express'
import session          from 'express-session'
import RateLimit        from 'express-rate-limit'
import dotenv           from 'dotenv'
import cors             from 'cors'
import cookieParser     from 'cookie-parser'
import morgan           from 'morgan'
/* 필요한 패키지 Import */

/* Routing - import 부분 */

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


app.set('PORT', process.env.PORT || 8095)

const corsOptions = {
    origin: ["*"], // 이후 수정 예정
    credentials: true
}

app.use(cors(corsOptions))

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

app.get('/', (req,res) => res.send('hello express!'))

app.listen(app.get('PORT'), () => {
    console.log(app.get("PORT"), "포트로 서버 가동")
}) 