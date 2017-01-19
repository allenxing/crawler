/**
 * description   : 建设银行爬虫
 * author        : allenxing
 */
let cheerio = require('cheerio');
let superagent = require('superagent');
let db = require('./db.js');
let config = require('./config.js').ccb;
let crwaler = () => {
	console.log('ccb crawler begin..............');
	config.citys.forEach((province, index) => {
		if (province.code != 1020) return;
		province.city.forEach((city, i) => {
			console.log(city.name)
			page(0, 10,province.code,city.code);
		})
	})
}
let page = (start, end,province,city) => {
	if(city != 210) return;
	superagent.get('http://creditcard.ccb.com/webtran/get_crd_info.gsp')
		.query({
			'card_province': province,
			'card_city': city,
			'startNum': start + 1,
			'endNum': end,
			'table_type': 2
		})
		.end(function(err, res) {
			if (res.ok) {
				let data = JSON.parse(res.text);
				console.log(JSON.parse(res.text).totalNum);
				if (data.obj) {
					page(start + end, end + config.step,province,city);
				}
			} else {
				console.log('Oh no! error ' + res.text);
			}
		})
}
module.exports = {
	run: crwaler
}