let http = require("http");
let cmbc = require("./cmbc.js");
let ccb = require("./ccb.js");
// http.createServer((request, response) => {
// 	response.writeHead(200, {
// 		"Content-Type": "text-plain"
// 	});
// 	response.write('Hello');
// 	response.end();
// }).listen(7000)
// cmbc.run();
ccb.run();
