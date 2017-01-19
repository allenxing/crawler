/**
 * description   : 建设银行爬虫
 * author        : allenxing
 */
let cheerio = require('cheerio');
let superagent = require('superagent');
let db = require('./db.js');
let config = require('./config.js').ccb;