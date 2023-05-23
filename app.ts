import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import methodOverride from 'method-override';
import axios from 'axios';
import cookieParser from 'cookie-parser';

import path from 'path';
import fs from 'fs';

const app = express();
app.set('port', 8080);


//dotenv
dotenv.config();
//body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//method override
app.use(methodOverride('_method'));
//cors
app.use(cors());
//cookie-parser
app.use(cookieParser(process.env.COOKIE_SECRET));

//static file
app.use(express.static('public'));

app.get("/", (req, res) => {
  res.send('testpage');
});

app.listen(app.get('port'), () => {
  console.log(`server is running on ${app.get('port')}`);
});


type Market = {
  market: string,
  korean_name: string,
  english_name: string,
  market_warning: string
}

type Ticker = {
  market: string,
  trade_date: string,
  trade_time: string,
  trade_date_kst: string,
  trade_time_kst: string,
  trade_timestamp: number,
  opening_price: number,
  high_price: number,
  low_price: number,
  trade_price: number,
  prev_closing_price: number,
  change: string,
  change_price: number,
  change_rate: number,
  signed_change_price: number,
  signed_change_rate: number,
  trade_volume: number,
  acc_trade_price: number,
  acc_trade_price_24h: number,
  acc_trade_volume: number,
  acc_trade_volume_24h: number,
  highest_52_week_price: number,
  highest_52_week_date: string,
  lowest_52_week_price: number,
  lowest_52_week_date: string,
  timestamp: number,
}
const gMarket: Market[] = [];
let gTicker: Ticker[] = [];

const getTicker: () => void = async () => {
  try {
    const res1 = await axios.request({
      method: 'get',
      url: "https://api.upbit.com/v1/market/all?isDetails=false",
      headers: {
        accept: "application/json"
      }
    });

    const allMarket: Market[] = res1.data;

    let krwMrkStr: string = '';
    allMarket.forEach(elm => {
      if (elm.market.includes('KRW')) {
        gMarket.push(elm)
        krwMrkStr += krwMrkStr ? ', ' + elm.market : elm.market;
      }
    });
    throw new Error('123')
    setInterval(async () => {
      const res2 = await axios.request({
        method: 'get',
        url: "https://api.upbit.com/v1/ticker?markets=" + krwMrkStr,
        headers: {
          accept: "application/json"
        }
      });
      gTicker = res2.data;
    }, 1000);

  } catch (error) {
    console.log(error)
  }
}
getTicker();

app.get('/coin/data', async (req, res) => {
  const resData = {
    market: gMarket,
    ticker: gTicker
  }
  res.send(resData);
});



app.get('/domain', (req, res) => {
  res.send(process.env.DOMAIN);
})