let mongoose = require('mongoose');
let Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/bank');
mongoose.connection.on('open', function() {
	console.log('mongodb connected.......................');
});
mongoose.connection.on('error', function() {
	console.log('mongodb error.......................');
});
let BankSchema = new Schema({
	shopname: {
		type: String
	},
	tel: {
		type: String
	},
	address: {
		type: String
	},
	date: {
		type: String
	},
	desp: {
		type: String
	}
});
let BankModel = mongoose.model('Bank',BankSchema)
let BankEntity = new BankModel({
	shopname: 'test'
})
BankEntity.save()
/*let db = mongoose.createConnection('localhost','test')
db.on('open',function(){
	console.log('mongodb connected.......................');
});*/

module.exports = {
	
}