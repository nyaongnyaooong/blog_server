const express = require('express');
const router = express.Router();
const path = require('path');
const { mySQLPool, AtlasDB } = require('../modules/db')

//dotenv
require('dotenv').config();




module.exports = router;