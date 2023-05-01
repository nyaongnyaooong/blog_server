const express = require('express');
const router = express.Router();
const path = require('path');
const { mySQLPool, AtlasDB } = require('../modules/db')

//dotenv
require('dotenv').config();



// 금액 충전
router.post('/user/charge', async (req, res) => {
  const mySQL = await mySQLPool.getConnection(async conn => conn);


  try {
    if (!req.user) throw new Error('로그인정보 없음');

    const query = `UPDATE user
    SET money=money+1000000, charge=charge+1
    WHERE id='${req.user.userid}'
    `
    const dbResult = await mySQL.query(query);

    res.send({
      result: dbResult,
      error: false,
    });
  } catch (error) {
    await mySQL.rollback();
    res.send({
      result: false,
      error: error,
    })
  }
});

// 금액 충전
router.post('/user/charge', async (req, res) => {
  const mySQL = await mySQLPool.getConnection(async conn => conn);


  try {
    if (!req.user) throw new Error('로그인정보 없음');


    const dbResult = await mySQL.query(
      `UPDATE user
      SET money=money+1000000, charge=charge+1
      WHERE id='${req.user.userid}'`
    );

    await mySQL.commit();

    res.send({
      result: dbResult,
      error: false,
    });
  } catch (error) {
    await mySQL.rollback();
    res.send({
      result: false,
      error: error,
    })
  } finally {
    mySQL.release();
  }
});

module.exports = router;