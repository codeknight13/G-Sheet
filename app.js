const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path'); // Used to find absolute path in any OS
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

app.set('view engine', 'ejs'); // Setting the templating engine

app.set('views', 'views'); // Not required to set if named views

app.use(bodyParser.urlencoded({ // Used for text-only data, Cannot be used to parse binary data like image
  extended: false
}));

app.get('/', (req, res, next) => {
  res.render('home');
})

app.post('/post-data', (req, res, next) => {
  const gsapi = google.sheets({
    version: 'v4',
    auth: client
  })
  const opt = {
    spreadsheetId: '1KYJRhh_sOtyOqgBpnF7qoCGHVTAJdyxeltRZ41z-Qvo',
    range: 'A1:B5'
  }
  gsapi.spreadsheets.values.get(opt)
    .then(result => {
      console.log(result);
    })
  console.log("request received", req.body.email);
  return res.redirect('/');
})

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log('Server Started');
})