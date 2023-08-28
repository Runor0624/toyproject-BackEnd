import express          from 'express'
import session          from 'express-session'
import dotenv           from 'dotenv'
import cors             from 'cors'
import cookieParser     from 'cookie-parser'


/* Routing */

/* Routing */

dotenv.config()

const app = express()

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