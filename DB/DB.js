const mysql        = require ('mysql2')
const dotenv       = require ('dotenv')

dotenv.config()

/* DB연결 시작 */
const connection = mysql.createPool({
 	host: process.env.DB_PRODUCTION_HOST,
 	user: process.env.DB_PRODUCTION_USERNAME,
 	password: process.env.DB_PRODUCTION_PASSWORD,
 	database: process.env.DB_PRODUCTION_DATABASE,
    port:process.env.DB_PRODUCTION_PORT
});
/* DB연결 종료 */

exports.connection = connection