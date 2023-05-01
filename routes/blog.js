const router = require('express').Router({ mergeParams: true });
const path = require('path');
const { mySQLPool, AtlasDB } = require('../modules/db')

//MongoDB Atlas Setting
const dbURL = 'mongodb+srv://' + process.env.DB_ID + ':' + process.env.DB_PW + process.env.DB_URL;
const { MongoClient, ServerApiVersion } = require('mongodb');
let db;
MongoClient.connect(dbURL, (err, result) => {
  if (err) {
    return console.log(err);
  }
  db = result.db('project1');

});



// Main 블로그 Router
router.get('/blog/title', async (req, res) => {
  const mySQL = await mySQLPool.getConnection(async conn => conn);

  try {
    console.log('SQL Request - 블로그 타이틀 리스트 요청');
    const readReqQuery = `
    SELECT title, pTitle
    FROM blogtitle
    `;
    const [response] = await mySQL.query(readReqQuery);
    await mySQL.commit();

    res.send(response);
  } catch (error) {
    await mySQL.rollback();
    console.error(error)
  } finally {
    mySQL.release();
  }
});



router.get('/blog/:id', async (req, res) => {
  const result = await db.collection('blog').findOne({ _id: parseInt(req.params.id) });

  console.log(result)
  res.send(result);
});

router.get('/blog/add', async (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/blog/blogAdd.html'));

});

router.post('/blog/add/post', async (req, res) => {
  console.log('Create request');

  //counter collection에서 ID 찾기
  const getID = await db.collection('counter').findOne({ pw: '1234' });
  //counter collection ID 숫자증가
  const updateID = await db.collection('counter').updateOne({ pw: '1234' }, { $inc: { lastID: 1 } });
  console.log(getID)

  const { title, content } = req.body;

  const dbObject = {
    _id: parseInt(getID.lastBlogID) + 1,
    date: new Date,
    title: title,
    content: content,
    view: true,
  }

  const addDB = await db.collection('blog').insertOne(dbObject);
  res.redirect('/blog/add');
});









module.exports = router;