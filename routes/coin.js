"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../modules/database");
const router = express_1.default.Router();
class CustomError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CustomError';
    }
}
/*
  Variables
*/
// KRW 전체 마켓 정보
const gMarket = [];
// KRW 전체 마켓 이름 정보
const gMarketName = {};
// 전체 마켓에 대한 Ticker
let gTicker = [];
// 코인 ticker 데이터 request 함수
const getTicker = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 마켓 정보를 불러옴
        const res1 = yield axios_1.default.request({
            method: 'get',
            url: "https://api.upbit.com/v1/market/all?isDetails=false",
            headers: {
                accept: "application/json"
            }
        });
        // 전체 마켓 이름을 string
        let krwMrkStr = '';
        res1.data.forEach(elm => {
            if (elm.market.includes('KRW')) {
                gMarketName[elm.market] = elm.korean_name;
                gMarket.push(elm);
                krwMrkStr += krwMrkStr ? ', ' + elm.market : elm.market;
            }
        });
        setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            const res2 = yield axios_1.default.request({
                method: 'get',
                url: "https://api.upbit.com/v1/ticker?markets=" + krwMrkStr,
                headers: {
                    accept: "application/json"
                }
            });
            gTicker = res2.data;
        }), 1000);
    }
    catch (err) {
        console.log(err);
    }
});
getTicker();
router.use((req, res, next) => {
    if (gMarketName)
        req.marketName = gMarketName;
    next();
});
// 코인 마켓 데이터 및 티커 데이터 api
router.get('/coin/data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const resData = {
        market: gMarket,
        ticker: gTicker
    };
    res.send(resData);
}));
// 유저 코인 정보 - 모든 마켓
router.get('/user/coin/all', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const mySQL = yield database_1.mySQLPool.getConnection();
    try {
        const { serial: userSerial, id: userID } = req.user;
        // 유저 검증 미들웨어 문제
        if (!req.user || !userID)
            throw new Error('유저 검증에 문제가 있습니다');
        // 로그인하지 않음
        if (!userSerial || userID === 'anonymous')
            throw new CustomError('로그인 정보가 없습니다');
        yield mySQL.beginTransaction();
        // 요청한 마켓의 유저 코인정보
        const [resSQL1] = yield mySQL.query(`SELECT *
      FROM coin
      WHERE user_serial=${userSerial}`);
        res.send({
            result: {
                ticker: gMarket,
                data: resSQL1
            },
            error: false,
        });
    }
    catch (err) {
        yield mySQL.rollback();
        let errMessage = '알 수 없는 오류입니다';
        let statusCode = 400;
        if (err instanceof CustomError) {
            if (err.message === '로그인 정보가 없습니다')
                statusCode = 401;
            errMessage = err.message;
        }
        else {
            console.log(err);
            statusCode = 500;
        }
        res.status(statusCode).send({
            result: false,
            error: errMessage
        });
    }
    finally {
        mySQL.release();
    }
}));
// 유저 코인 정보
router.get('/user/coin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const mySQL = yield database_1.mySQLPool.getConnection();
    try {
        const { serial: userSerial, id: userID } = req.user;
        // 유저 검증 미들웨어 문제
        if (!req.user || !userID)
            throw new Error('유저 검증에 문제가 있습니다');
        // 로그인하지 않음
        if (!userSerial || userID === 'anonymous')
            throw new CustomError('로그인 정보가 없습니다');
        const { market: reqMarket } = req.query;
        // 쿼리값이 없음
        if (!reqMarket)
            throw new CustomError('잘못된 요청입니다');
        yield mySQL.beginTransaction();
        // 요청한 마켓의 유저 코인정보
        const [resSQL1] = yield mySQL.query(`SELECT market, price, amount
      FROM coin
      WHERE user_serial=${userSerial}`);
        // 요청한 유저의 거래 히스토리
        const [resSQL2] = yield mySQL.query(`SELECT *
      FROM trade
      WHERE user_serial=${req.user.serial} AND market='${reqMarket}'
      ORDER BY trade_serial DESC
      LIMIT 5`);
        res.send({
            result: {
                coin: resSQL1,
                history: resSQL2
            },
            error: false,
        });
    }
    catch (err) {
        yield mySQL.rollback();
        let errMessage = '알 수 없는 오류입니다';
        let statusCode = 400;
        if (err instanceof CustomError) {
            if (err.message === '로그인 정보가 없습니다')
                statusCode = 200;
            errMessage = err.message;
        }
        else {
            console.log(err);
            statusCode = 500;
        }
        res.status(statusCode).send({
            result: false,
            error: errMessage
        });
    }
    finally {
        mySQL.release();
    }
}));
// 코인 모의 거래 요청
router.post('/user/coin/trade', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const mySQL = yield database_1.mySQLPool.getConnection();
    try {
        const { request: reqType, market: reqMarketCode } = req.body;
        const reqAmount = Number(req.body.amount);
        // 요청값이 없거나 타입에 문제가 있음
        if (typeof reqType !== 'string' || typeof reqMarketCode !== 'string' || typeof reqAmount !== 'number')
            throw new Error('01');
        const { serial: userSerial, id: userID } = req.user;
        // 유저 검증 미들웨어 문제
        if (!req.user || !userID)
            throw new Error('유저 검증에 문제가 있습니다');
        // 로그인하지 않음
        if (!userSerial || userID === 'anonymous')
            throw new CustomError('로그인 정보가 없습니다');
        let reqMarketTicker = null;
        for (let i = 0; i < gTicker.length; i++) {
            if (gTicker[i].market === reqMarketCode) {
                reqMarketTicker = gTicker[i];
                break;
            }
        }
        // 요청한 마켓과 일치하는 ticker 데이터를 찾을 수 없음
        if (!reqMarketTicker)
            throw new Error('ticker 데이터가 없음');
        // 요청한 마켓의 현재가
        const { trade_price: reqMarketPrice } = reqMarketTicker;
        yield mySQL.beginTransaction();
        // 유저의 코인 자산 불러오기
        const [resSQL1] = yield mySQL.query(`SELECT *
      FROM coin
      WHERE user_serial=${userSerial}`);
        // 유저 자산 배열 중 요청 코인 index 찾기
        const marketIndex = resSQL1.findIndex((e) => {
            return e.market === reqMarketCode;
        });
        // 유저의 요청한 코인 소유 자산
        const reqMarketAsset = { market: reqMarketCode, price: 0, amount: 0 };
        if (marketIndex > -1) {
            reqMarketAsset.price = resSQL1[marketIndex].price || 0;
            reqMarketAsset.amount = resSQL1[marketIndex].amount || 0;
        }
        // 유저의 원화 자산 index
        const krwIndex = resSQL1.findIndex((e) => {
            return e.market === 'KRW';
        });
        // 유저의 원화 자산
        const krwAsset = { market: 'KRW', price: 1, amount: 0 };
        if (krwIndex > -1)
            krwAsset.amount = resSQL1[krwIndex].amount || 0;
        if (reqType === 'buy') { // 구매요청이면
            // 요청한 코인 수량 및 평단가 반영
            const totalReqPrice = reqMarketPrice * reqAmount;
            reqMarketAsset.price = (reqMarketAsset.amount * reqMarketAsset.price + totalReqPrice) / (reqMarketAsset.amount + reqAmount);
            reqMarketAsset.amount = reqMarketAsset.amount + reqAmount;
            krwAsset.amount = krwAsset.amount - totalReqPrice;
        }
        else if (req.body.request === 'sell') { // 판매요청이면
            // 보유수량보다 더 많은 수량을 판매 요청함
            if (reqMarketAsset.amount < reqAmount)
                throw new CustomError('판매 요청한 코인 수량이 보유한 수량보다 많습니다');
            // 요청한 코인 수량 및 평단가 반영
            const totalReqPrice = reqMarketPrice * reqAmount;
            const totalMarketAsset = reqMarketAsset.amount * reqMarketAsset.price;
            if (reqMarketAsset.amount === reqAmount)
                reqMarketAsset.price = 0;
            else
                reqMarketAsset.price = (totalMarketAsset - totalReqPrice) / (reqMarketAsset.amount - reqAmount);
            reqMarketAsset.amount = reqMarketAsset.amount - reqAmount;
            krwAsset.amount = krwAsset.amount + totalReqPrice;
        }
        else {
            // 요청타입에 문제가 있음 - buy/sell 중 하나가 아님
            throw new Error('요청 타입에 문제가 있습니다');
        }
        // 보유 코인 및 원화 수정
        yield mySQL.query(`
      INSERT INTO coin(user_serial, market, price, amount)
      VALUES
        (${userSerial}, '${reqMarketCode}', ${reqMarketAsset.price}, ${reqMarketAsset.amount}),
        (${userSerial}, 'KRW', 1, ${krwAsset.amount})
      ON DUPLICATE KEY UPDATE 
        price=VALUES(price), 
        amount=VALUES(amount)`);
        // DB 추가 실패
        // if (!('affectedRows' in resSQL2) || !resSQL2.affectedRows) throw new Error('');
        // 매매 히스토리 기록
        const tradeType = reqType === 'buy' ? true : false;
        yield mySQL.query(`INSERT INTO trade(user_serial, market, trading, amount, price, date)
      VALUES(${userSerial}, '${reqMarketCode}', ${tradeType}, ${reqAmount}, ${reqMarketPrice} , NOW())`);
        // DB 추가 실패
        // if (!('affectedRows' in resSQL3) || !resSQL3.affectedRows) throw new Error('06');
        const [resSQL4] = yield mySQL.query(`SELECT *
      FROM coin
      WHERE user_serial=${userSerial}`);
        yield mySQL.commit();
        res.send({
            result: resSQL4,
            error: false,
        });
    }
    catch (err) {
        yield mySQL.rollback();
        let errMessage = '알 수 없는 오류입니다';
        let statusCode = 400;
        if (err instanceof CustomError) {
            if (err.message === '로그인 정보가 없습니다')
                statusCode = 401;
            errMessage = err.message;
        }
        else {
            console.log(err);
            statusCode = 500;
        }
        res.status(statusCode).send({
            result: false,
            error: errMessage
        });
    }
    finally {
        mySQL.release();
    }
}));
module.exports = router;
