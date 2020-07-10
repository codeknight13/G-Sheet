const mongodb = require('mongodb');

const connectionURL = `mongodb+srv://${process.env.mongo_user}:${process.env.mongo_pass}@cluster0-jb1si.mongodb.net/${process.env.mongo_database}?retryWrites=true&w=majority`;

const shopConnectionURL = `mongodb+srv://${process.env.mongo_user}:${process.env.mongo_pass}@cluster0-jb1si.mongodb.net/${process.env.mongo_database}`;

const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (cb) => {
  // console.log('mongoConnect reached');
  MongoClient.connect(connectionURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(client => {
      // console.log('connection established successfully');
      _db = client.db('shop');
      cb();
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return error;
    })
}

const getDB = () => {
  if (_db) {
    return _db;
  }
  throw 'No database found';
};

const getConnectionString = () => {
  return shopConnectionURL;
}

exports.mongoConnect = mongoConnect;
exports.getDB = getDB;
exports.getConnectionString = getConnectionString;