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
let config = require('./config.js').ccb;
let ep = eventproxy();
let flUlrs = [];
let crwaler = () => {
	console.log('ccb crawler begin..............');
	config.citys.forEach((province, index) => {
		if (province.code != 1020) return;
		province.city.forEach((city, i) => {
			console.log(city.name);
			flUlrs.push({
					url: 'http://creditcard.ccb.com/webtran/get_crd_info.gsp' + '?card_province=' + province.code + '&card_city=' + city.code + '&table_type=2',
					city: city.name
				})
				// page3(0, 10, province.code, city);
		})
	})
	console.log('一级url', flUlrs.length)
	async.mapLimit(flUlrs, 10000, function(item, callback) {
		fetchSecondUrl(item, callback);
	}, function(err, result) {
		console.log('=========== result: ===========');
		let secondUrls = [];
		result.forEach((it, index) => {
			secondUrls = secondUrls.concat(it)
		})
		console.log('二级url:', secondUrls.length);
		fs.writeFile("secondUrls.js", JSON.stringify(secondUrls), function(err) {
			if (!err)
				console.log("写入成功！")
		})
		getDetails(secondUrls)
	});
}

function getDetails(secondUrls) {
	async.mapLimit(secondUrls, 4000, function(it, callback) {
		superagent.get(it.url)
			.end((err, res) => {
				if(err){
					callback(err, 'error')
					return;
				}
				if (res.ok) {
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
							city: it.city
						}
						// console.log(item);
						/*														db.Bank.findOneAndUpdate({
																					_id: id
																				}, item, function(err, doc) {
																					if (doc === null) {
																						db.Bank.create(item);
																					}
																				})*/
					callback(null, item)
				} else {
					console.log('Oh no! error ' + res.text);
					callback(err, 'error')
					return;
				}
			})
	}, function(err, result) {
		console.log('活动数', result.length);
	});
}

function fetchSecondUrl(item, callback) {
	console.log(item.url)
	superagent.get(item.url).end((err, resp) => {
		let arr = [];
		if (resp.ok) {
			if (resp.text.match('totalNum')) {
				resp.text.replace(/\"biz_id\"\:\"(\w+)\"/g, (a, biz_id) => {
					arr.push({
						url: 'http://creditcard.ccb.com/cn/creditcard/favorable/' + biz_id + '.html',
						city: item.city,
						id: biz_id
					});
					// superagent.get('http://creditcard.ccb.com/cn/creditcard/favorable/' + biz_id + '.html')
					// 	.end((err, res) => {
					// 		if (res.ok) {
					// 			let $ = cheerio.load(res.text);
					// 			let id = 'ccb_' + biz_id;
					// 			let item = {
					// 				_id: id,
					// 				shopname: $('.content-left').find('.thhd_head').text(),
					// 				tel: $('.content-left').find('.content').find('p').eq(4).text().replace('商户电话：', ''),
					// 				address: $('.content-left').find('.content').find('p').eq(5).text().replace('商户地址：', ''),
					// 				date: $('.content-left').find('.content').find('p').eq(3).text().replace('截止时间：', ''),
					// 				desp: $('.content-left').find('.content').find('p').eq(2).text().replace('优惠信息：', ''),
					// 				img: 'http://creditcard.ccb.com/' + $('.content-left').find('.thhd_head').next().attr('src'),
					// 				bank: 'ccb',
					// 				city: city.name
					// 			}
					// 			console.log(item);
					// 			/*									db.Bank.findOneAndUpdate({
					// 													_id: id
					// 												}, item, function(err, doc) {
					// 													if (doc === null) {
					// 														db.Bank.create(item);
					// 													}
					// 												})*/
					// 		} else {
					// 			console.log('Oh no! error ' + res.text);
					// 		}
					// 	})
				});
				callback(null, arr)
			}
		} else {
			console.log('Oh no! error ' + resp.text);
			callback(err, url)
		}
	})
}
let page = (start, end, province, city) => {
	if (city.code != 1468) return;
	console.log(start + 1, end)
	console.log('http://creditcard.ccb.com/webtran/get_crd_info.gsp' + '?card_province=' + province + '&card_city=' + city.code + '&startNum=' + (start + 1) + '&endNum=' + end + '&table_type=2')
	superagent.get('http://creditcard.ccb.com/webtran/get_crd_info.gsp')
		.query({
			'card_province': province,
			'card_city': city.code,
			'startNum': start + 1,
			'endNum': end,
			'table_type': 2
		})
		.end((err, resp) => {
			if (resp.ok) {
				// console.log(res.text);
				//由于返回的部分数据有问题,导致不能转换成json,这里采用字符串匹配
				if (resp.text.match('totalNum')) {
					resp.text.replace(/\"biz_id\"\:\"(\w+)\"/g, (a, biz_id) => {
						superagent.get('http://creditcard.ccb.com/cn/creditcard/favorable/' + biz_id + '.html')
							.end((err, res) => {
								if (res.ok) {
									let $ = cheerio.load(res.text);
									let id = 'ccb_' + biz_id;
									let item = {
											_id: id,
											shopname: $('.content-left').find('.thhd_head').text(),
											tel: $('.content-left').find('.content').find('p').eq(4).text().replace('商户电话：', ''),
											address: $('.content-left').find('.content').find('p').eq(5).text().replace('商户地址：', ''),
											date: $('.content-left').find('.content').find('p').eq(3).text().replace('截止时间：', ''),
											desp: $('.content-left').find('.content').find('p').eq(2).text().replace('优惠信息：', ''),
											img: 'http://creditcard.ccb.com/' + $('.content-left').find('.thhd_head').next().attr('src'),
											bank: 'ccb',
											city: city.name
										}
										// console.log(item);
									db.Bank.findOneAndUpdate({
										_id: id
									}, item, function(err, doc) {
										if (doc === null) {
											db.Bank.create(item);
										}
									})
								} else {
									console.log('Oh no! error ' + res.text);
								}
							})
					});
					page(end, end + config.step, province, city);
				}
			} else {
				console.log('Oh no! error ' + resp.text);
			}
		})
}
let page1 = (start, end, province, city) => {
	// if (city.code != 1468) return;
	console.log(start + 1, end)
	console.log('http://creditcard.ccb.com/webtran/get_crd_info.gsp' + '?card_province=' + province + '&card_city=' + city.code + '&startNum=' + (start + 1) + '&endNum=' + end + '&table_type=2')
	request('http://creditcard.ccb.com/webtran/get_crd_info.gsp' + '?card_province=' + province + '&card_city=' + city.code + '&startNum=' + (start + 1) + '&endNum=' + end + '&table_type=2', function(error, response, body) {
		if (body.match('totalNum')) {
			body.replace(/\"biz_id\"\:\"(\w+)\"/g, (a, biz_id) => {
				request('http://creditcard.ccb.com/cn/creditcard/favorable/' + biz_id + '.html', function(error, response, body) {
					let $ = cheerio.load(body);
					let id = 'ccb_' + biz_id;
					let item = {
							_id: id,
							shopname: $('.content-left').find('.thhd_head').text(),
							tel: $('.content-left').find('.content').find('p').eq(4).text().replace('商户电话：', ''),
							address: $('.content-left').find('.content').find('p').eq(5).text().replace('商户地址：', ''),
							date: $('.content-left').find('.content').find('p').eq(3).text().replace('截止时间：', ''),
							desp: $('.content-left').find('.content').find('p').eq(2).text().replace('优惠信息：', ''),
							img: 'http://creditcard.ccb.com/' + $('.content-left').find('.thhd_head').next().attr('src'),
							bank: 'ccb',
							city: city.name
						}
						// console.log(item);
						/*db.Bank.findOneAndUpdate({
							_id: id
						}, item, function(err, doc) {
							if (doc === null) {
								db.Bank.create(item);
							}
						})*/
				})
			});
			page1(end, end + config.step, province, city);
		}
	})
}
let page3 = (a, b, province, city) => {
	superagent.get('http://creditcard.ccb.com/webtran/get_crd_info.gsp')
		.query({
			'card_province': province,
			'card_city': city.code,
			'table_type': 2
		})
		.end((err, resp) => {
			if (resp.ok) {
				if (resp.text.match('totalNum')) {
					resp.text.replace(/\"biz_id\"\:\"(\w+)\"/g, (a, biz_id) => {
						superagent.get('http://creditcard.ccb.com/cn/creditcard/favorable/' + biz_id + '.html')
							.end((err, res) => {
								if (res.ok) {
									let $ = cheerio.load(res.text);
									let id = 'ccb_' + biz_id;
									let item = {
										_id: id,
										shopname: $('.content-left').find('.thhd_head').text(),
										tel: $('.content-left').find('.content').find('p').eq(4).text().replace('商户电话：', ''),
										address: $('.content-left').find('.content').find('p').eq(5).text().replace('商户地址：', ''),
										date: $('.content-left').find('.content').find('p').eq(3).text().replace('截止时间：', ''),
										desp: $('.content-left').find('.content').find('p').eq(2).text().replace('优惠信息：', ''),
										img: 'http://creditcard.ccb.com/' + $('.content-left').find('.thhd_head').next().attr('src'),
										bank: 'ccb',
										city: city.name
									}
									console.log(item);
									/*									db.Bank.findOneAndUpdate({
																			_id: id
																		}, item, function(err, doc) {
																			if (doc === null) {
																				db.Bank.create(item);
																			}
																		})*/
								} else {
									console.log('Oh no! error ' + res.text);
								}
							})
					});
				}
			} else {
				console.log('Oh no! error ' + resp.text);
			}
		})
}
module.exports = {
	run: crwaler
}