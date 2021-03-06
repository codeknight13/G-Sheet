const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongo = require('./database');
const mongodb = require('mongodb');

const {
  google
} = require('googleapis');

const keys = require('./keys.json');

const client = new google.auth.JWT( // json web token
  keys.client_email,
  null,
  keys.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

client.authorize((err, tokens) => {
  if (err) {
    console.log('sheet auth err', err);
    return;
  }
  console.log('success auth');
})

app.set('view engine', 'ejs');

app.set('views', 'views');

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.get('/', (req, res, next) => {
  res.render('home');
})

app.post('/post-data', async (req, res, next) => {
  const gsapi = google.sheets({
    version: 'v4',
    auth: client
  });
  const db = mongo.getDB();
  if (!db) {
    res.sendStatus(500);
  }
  const {
    _id,
    headCount
  } = await db
    .collection('mailmodo')
    .findOne()
    .then(result => {
      return result;
    })
    .catch(e => {
      console.log('error occured vikram: ', e);
    });
  const input = [];
  for (let key in req.body) {
    input.push(req.body[key]);
  }
  console.log(req.body);
  const data = [];
  data.push(input);
  const writeOpt = {
    spreadsheetId: '1KYJRhh_sOtyOqgBpnF7qoCGHVTAJdyxeltRZ41z-Qvo',
    range: 'A' + headCount,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: data
    }
  }
  const result = await gsapi.spreadsheets.values.update(writeOpt);
  console.log(result);
  // Updating the writeHead
  db
    .collection('mailmodo')
    .updateOne({
      _id: new mongodb.ObjectID(_id)
    }, {
      $set: {headCount: headCount+1}
    })

  let transporter = nodemailer.createTransport({
    service: 'yahoo',
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: false,
    auth: {
      user: 'vikram_lilhore13@yahoo.com',
      pass: process.env.pass_new
    }
  });

  let mailOptions = {
    from: 'vikram_lilhore13@yahoo.com',
    to: req.body.email,
    subject: 'You Entered Some Data',
    html: `
    <h2>Hey ${req.body.email}</h2>
    <p>You Entered Some Data in <a href="https://docs.google.com/spreadsheets/d/1KYJRhh_sOtyOqgBpnF7qoCGHVTAJdyxeltRZ41z-Qvo/edit#gid=0">Sheet</a></p>
    `
  };
  // enable the below comment to start sending the email and write html template in above mailOptions
  /* 
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('error occ', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  */
  res.sendStatus(200);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('Server Started');
  mongo.mongoConnect(() => {
    console.log('Connected to database');
  });
});