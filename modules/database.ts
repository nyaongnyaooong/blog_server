import mysql from 'mysql2/promise';

//MongoDB Atlas Setting
// const dbURL = 'mongodb+srv://' + process.env.DB_ID + ':' + process.env.DB_PW + process.env.DB_URL;

// const { MongoClient, ServerApiVersion } = require('mongodb');
// let AtlasDB;
// const client = new MongoClient(dbURL, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//   AtlasDB = client.db('project1');
// });

const mySQLPool = mysql.createPool({
  host: process.env.MYSQL_URL,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PW,
  database: 'blog',
});

export { mySQLPool };