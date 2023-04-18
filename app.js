var createError = require('http-errors');
var express = require('express');
var path = require('path');

// var logger = require('morgan');
// const nunjucks = require('nunjucks');
const axios = require('axios');
require('dotenv').config();
const mysql = require("mysql2/promise");

var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'njk');
// nunjucks.configure('views', { 
//   express: app,
//   watch: true,
// });



const getMarket = async () => {
  const config = {
    method: 'get',
    url: "https://api.upbit.com/v1/market/all?isDetails=false",
    hearder: {
      accept: "application/json"
    }
  }
  const { data } = await axios.request(config);
  let string = '';
  data.forEach(elm => {
    string += string ? ', ' + elm.market : elm.market;
  });
  data.allMarket = string;
  return data;
};

const getTicker = async (reqMarket) => {
  const config = {
    method: 'get',
    url: "https://api.upbit.com/v1/ticker?markets=" + reqMarket,
    hearder: {
      accept: "application/json"
    }
  };
  const { data } = await axios.request(config);
  return data;
};

const printTicker = async () => {
  try {
    const market = await getMarket();
    const mysqlDB = await mysql.createConnection({
      host: 'svc.sel3.cloudtype.app',
      port: '31665',
      user: "root",
      password: '1458369',
      database: "blog",
    });

    // const ticker = await getTicker(market.allMarket);
    // for(let i = 0; i < ticker.length; i++) {
    //   const { market } = ticker[i];
    //   const repMarket = market.replace(/-/g, '_')

    //   const queryString = `
    //   CREATE TABLE ${ repMarket } (
    //     date DATETIME NOT NULL,
    //     price VARCHAR(45) NOT NULL,
    //     PRIMARY KEY (date));
    //   `;
    //   const response = await mysqlDB.query(queryString);
    // }

    let lastTime = new Date().getTime();
    const interval = setInterval(async () => {
      const nowTime = new Date().getTime();
      const compareTime = (Math.floor(lastTime / 10000) + 1) * 10000;
      if (compareTime < nowTime) {
        lastTime = nowTime;
        const startTime = new Date();
        const ticker = await getTicker(market.allMarket);

        let queryString = 'INSERT INTO coin(market, price, date) VALUES';
        for (let i = 0; i < ticker.length; i++) {
          const { market, trade_price } = ticker[i];
          const repMarket = market.replace(/-/g, '_');

          queryString += i ?
            `, ('${repMarket}', '${trade_price}', NOW())` :
            `('${repMarket}', '${trade_price}', NOW())`;
        }
        queryString += ';';
        const response = await mysqlDB.query(queryString);

        const Time = new Date() - startTime;
        console.log(Time);
      }
    }, 100)

  } catch (error) {
    console.log(error);
    // console.log('sqldb 접속불가');

  }


}
printTicker();

// let lastTime = new Date();;
// setInterval(() => {
//   const nowTime = new Date();
//   const nowSec = nowTime.getSeconds();
//   const nowMilSec = nowTime.getMilliseconds();

//   const afterTime = nowTime.setSeconds(nowSec + 10)

//   const elapsed = nowTime - lastTime
//   lastTime = nowTime;
//   console.log(Math.floor(nowTime.getTime() / 10000), Math.floor(afterTime / 10000));
// }, 400)

let mysqlDB;

app.use(async (req, res, next) => {
  try {
    mysqlDB = await mysql.createConnection({
      host: 'svc.sel3.cloudtype.app',
      port: '31665',
      user: "root",
      password: '1458369',
      database: "blog",
    });
    next();
  } catch {
    console.log('sqldb 접속불가');
    next();
  }
});




// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));










app.use('/', indexRouter);
// app.use('/users', usersRouter);









// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;















// market: 'KRW-BTC',
// trade_date: '20230417',
// trade_time: '131839',
// trade_date_kst: '20230417',
// trade_time_kst: '221839',
// trade_timestamp: 1681737519482,
// opening_price: 39612000,
// high_price: 39673000,
// low_price: 38540000,
// trade_price: 38685000,
// prev_closing_price: 39607000,
// change: 'FALL',
// change_price: 922000,
// change_rate: 0.0232787134,
// signed_change_price: -922000,
// signed_change_rate: -0.0232787134,
// trade_volume: 0.00516996,
// acc_trade_price: 156602392900.84137,
// acc_trade_price_24h: 200017140205.17203,
// acc_trade_volume: 4007.04945898,
// acc_trade_volume_24h: 5099.99614325,
// highest_52_week_price: 53075000,
// highest_52_week_date: '2022-04-21',
// lowest_52_week_price: 20700000,
// lowest_52_week_date: '2022-12-30',
// timestamp: 1681737519538




