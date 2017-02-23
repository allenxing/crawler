/**
 * description   : 建设银行爬虫
 * author        : allenxing
 */
let cheerio = require('cheerio');
let superagent = require('superagent');
let eventproxy = require('eventproxy');
let fs = require('fs')
let async = require('async');
let db = require('./db.js');
let citys = require('./config.js').ccb;
let ep = eventproxy();
let flUlrs = [];
let saveFirstErrorUrls = (url) => {
	fs.writeFile("firstErrorUrls.js", url + '\n', {
		flag: 'a'
	}, function(err) {
		if (!err)
			console.log("firstErrorUrls.js写入成功！")
	})
}
let saveSecondErrorUrls = (url) => {
	fs.writeFile("secondErrorUrls.js", url + '\n', {
		flag: 'a'
	}, function(err) {
		if (!err)
			console.log("secondErrorUrls.js写入成功！")
	})
}
let getDetails = (secondUrls) => {
	async.mapLimit(secondUrls, 100, function(it, callback) {
		superagent.get(it.url)
			.end((err, res) => {
				if (err) {
					callback(null, 'err')
					saveSecondErrorUrls(it.url)
				} else {
					if (res) {
						let $ = cheerio.load(res.text);
						let id = 'ccb_' + it.id;
						let item = {
							_id: id,
							shopname: $('.content-left').find('.thhd_head').text(),
							tel: $('.content-left').find('.content').find('p').eq(4).text().replace('商户电话：', ''),
							address: $('.content-left').find('.content').find('p').eq(5).text().replace('商户地址：', ''),
							date: $('.content-left').find('.content').find('p').eq(3).text().replace('截止时间：', ''),
							desp: $('.content-left').find('.content').find('p').eq(2).text().replace('优惠信息：', ''),
							img: 'http://creditcard.ccb.com/' + $('.content-left').find('.thhd_head').next().attr('src'),
							bank: 'ccb',
							bankname: '建设银行',
							city: it.city
						}
						console.log(item);
						db.Bank.findOneAndUpdate({
							_id: id
						}, item, function(err, doc) {
							if (doc === null) {
								db.Bank.create(item);
							}
						})
						callback(null, item)
					} else {
						callback(null, {})
						saveSecondErrorUrls(it.url)
					}
				}
			})

	}, function(err, result) {
		console.log('活动总数:', result.length);
		console.log('ccb crawler end..............');
	});
}
let fetchSecondUrl = (item, callback) => {
	superagent.get(item.url).end((err, resp) => {
		let arr = [];
		if (err) {
			callback(null, 'error');
			saveFirstErrorUrls(item.url)
		} else {
			if (resp) {
				if (resp.text.match('totalNum')) {
					resp.text.replace(/\"biz_id\"\:\"(\w+)\"/g, (a, biz_id) => {
						arr.push({
							url: 'http://creditcard.ccb.com/cn/creditcard/favorable/' + biz_id + '.html',
							city: item.city,
							id: biz_id
						});
					});
					callback(null, arr)
				} else {
					callback(null, arr)
					saveFirstErrorUrls(item.url)
				}
			} else {
				callback(null, url)
				saveFirstErrorUrls(item.url)
			}
		}
	})
}
let crwaler = () => {
	console.log('ccb crawler begin..............');
	citys.forEach((province, index) => {
		province.city.forEach((city, i) => {
			flUlrs.push({
				url: 'http://creditcard.ccb.com/webtran/get_crd_info.gsp' + '?card_province=' + province.code + '&card_city=' + city.code + '&table_type=2',
				city: city.name
			})
		})
	})
	console.log('一级url', flUlrs.length)
	async.mapLimit(flUlrs, 10, function(item, callback) {
		fetchSecondUrl(item, callback);
	}, function(err, result) {
		let secondUrls = [];
		result.forEach((it, index) => {
			secondUrls = secondUrls.concat(it)
		})
		console.log('二级url:', secondUrls.length);
		fs.writeFile("secondUrls.js", JSON.stringify(secondUrls), function(err) {
			if (!err)
				console.log("secondUrls.js写入成功！")
		})
		getDetails(secondUrls)
	});
}
module.exports = {
	run: crwaler
}