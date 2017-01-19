/**
 * description   : 招商银行活动爬虫
 * author        : allenxing
 */
let cheerio = require('cheerio');
let superagent = require('superagent');
let db = require('./db.js');
let config = require('./config.js').cmbc;
let crwaler = () => {
	console.log('cmbc crawler begin..............');
	config.citycode.forEach((city, index) => {
		console.log('http://best.cmbchina.com/Shop/Search.aspx?class=&subclass=&regionid=&ccid=&keyword=&pageno=1&citycode=' + city)
			//列表页
		superagent.get('http://best.cmbchina.com/Shop/Search.aspx?class=&subclass=&regionid=&ccid=&keyword=&pageno=1&citycode=' + city)
			.end(function(err, res) {
				if (res.ok) {
					let $ = cheerio.load(res.text);
					$('.page_item').each(function() {
						//详情页
						superagent.get('http://best.cmbchina.com' + $(this).find('.shopname').attr('href'))
							.end(function(err, res) {
								if (res.ok) {
									let $ = cheerio.load(res.text);
									/**
									 * _id
									 * name
									 * tel
									 * address
									 * date
									 * desp
									 * bank
									 * img
									 */
									let id = 'cmbc_' + $('#merchantID').val();
									let item = {
										_id: id,
										shopname: $('.content_detail').eq(0).find('.title').text(),
										tel: $('.content_detail').eq(0).find('tr').eq(0).find('td').eq(1).text(),
										address: $('.content_detail').eq(0).find('tr').eq(1).find('td').eq(1).text().replace('查看地图>>', ''),
										date: $('.content_detail').eq(0).find('tr').eq(3).find('td').eq(1).text().replace(/\s+/g, ''),
										desp: $('.content_detail').eq(1).find('tr').eq(1).find('td').eq(1).text(),
										img: $('#slidesMain').find('img').eq(0).attr('src'),
										bank: 'cmbc',
										city: city
									}

									console.log(item);
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
							});
					})
				} else {
					console.log('Oh no! error ' + res.text);
				}
			})
	})
}
module.exports = {
	run: crwaler
}