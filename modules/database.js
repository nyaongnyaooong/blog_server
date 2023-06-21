"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mySQLPool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
// dotenv
dotenv_1.default.config();
const mySQLPool = promise_1.default.createPool({
    host: process.env.MYSQL_URL,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PW,
    database: 'coin_trade',
    multipleStatements: true
});
exports.mySQLPool = mySQLPool;
