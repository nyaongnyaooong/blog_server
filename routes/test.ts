import express from 'express';
import mysql, { RowDataPacket } from 'mysql2/promise';

interface User {
  user_serial: number;
  // Add other properties from the 'user' table here
}

const app = express();

const mySQLPool = mysql.createPool({
  host: process.env.MYSQL_URL,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PW,
  database: 'blog',
});

app.get('/', async (req, res) => {
  const mySQL = await mySQLPool.getConnection();

  try {
    const [rows] = await mySQL.query<User[]>(
      `
      SELECT *
      FROM user
      WHERE id='test'
    `
    );

    const userSerial = rows[0].user_serial;
    console.log('User Serial:', userSerial);

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred' });
  } finally {
    mySQL.release();
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});