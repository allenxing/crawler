let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let mongo = mongoose.connect('mongodb://localhost/bank');
let db = mongo.connection;
console.log('----------------------------------db----------------------------------')
db.on('open', function() {
	console.log('mongodb connected.......................');
});

db.on('error', function() {
	console.log('mongodb error.......................');
});
let BankSchema = new Schema({
	_id:{
		type: String
	},
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
	},
	bank:{
		type: String
	},
	city :{
		type : String
	},
	img: {
		type: String
	}
}, {
	safe: true
});
let UserSchema = new Schema({
	// _id:{
	// 	type: String
	// },
	username: {
		type: String
	},
	email: {
		type: String
	},
	city: {
		type: String
	},
	bank: {
		type: String
	},
	issubscribe: {
		type: Boolean
	}
}, {
	safe: true
});
/*let UserModel = mongoose.model('User', UserSchema)
let BankEntity = new UserModel({
	_id: 1,
	username: 333
})
BankEntity.save()*/
//exports.Bank = mongoose.model('Bank', BankSchema);
module.exports = {
	Bank: mongoose.model('Bank', BankSchema),
	User: mongoose.model('User', UserSchema)
}