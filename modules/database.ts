import mysql, { RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';

// dotenv
dotenv.config();

//MongoDB Atlas Setting
// const dbURL = 'mongodb+srv://' + process.env.DB_ID + ':' + process.env.DB_PW + process.env.DB_URL;

// const { MongoClient, ServerApiVersion } = require('mongodb');
// let AtlasDB;
// const client = new MongoClient(dbURL, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//   AtlasDB = client.db('project1');
// });

interface UserSQLTable extends RowDataPacket {
  user_serial?: number,
  id?: string,
  money?: number
}

interface BoardSQLTable extends RowDataPacket {
  board_serial?: number,
  user_serial?: number,
  user_id?: string,
  title?: string,
  content?: string,
  date?: string
}

interface CommentSQLTable extends RowDataPacket {
  comment_serial?: number,
  user_serial?: number,
  user_id?: string,
  board_serial?: number,
  content?: string,
  date?: string,
  reply?: number | boolean
}

interface CoinSQLTable extends RowDataPacket {
  coin_serial?: number,
  user_serial?: number,
  market?: string,
  price?: number,
  amount?: number
}

const mySQLPool = mysql.createPool({
  host: process.env.MYSQL_URL,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PW,
  database: 'blog',
});

export { mySQLPool, UserSQLTable, BoardSQLTable, CommentSQLTable, CoinSQLTable };