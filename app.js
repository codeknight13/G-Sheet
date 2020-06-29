const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const filePath = path.join(
  path.dirname(process.mainModule.filename),
  'writeHead.json'
)

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

app.get('/', (req, res, next) => {
  res.render('home');
})

app.post('/post-data', async (req, res, next) => {
  const gsapi = google.sheets({
    version: 'v4',
    auth: client
  })

  fs.readFile(filePath, async (err, fileContent) => {
    if (err) {
      return res.render('500');
    }
    const {
      headCount
    } = JSON.parse(fileContent);
    const input = [];
    for (let key in req.body) {
      input.push(req.body[key]);
    }
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
    fs.writeFile(filePath, JSON.stringify({
      headCount: headCount + 1
    }), err => {
      console.log(err);
    });

    let transporter = nodemailer.createTransport({
      service: 'yahoo',
      host: 'smtp.mail.yahoo.com',
      port: 465,
      secure: false,
      auth: {
        user: 'Vikram_Lilhore@yahoo.com',
        pass: process.env.pass_new
      }
    });
    
    let mailOptions = {
      from: 'Vikram_Lilhore@yahoo.com',
      to: req.body.email,
      subject: 'You Entered Some Data',
      html: `
      <h2>Hey ${req.body.email}</h2>
      <p>You Entered Some Data in <a href="https://docs.google.com/spreadsheets/d/1KYJRhh_sOtyOqgBpnF7qoCGHVTAJdyxeltRZ41z-Qvo/edit#gid=0">Sheet</a></p>
      `
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log('error occ', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    return res.redirect('/');
  });
})

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log('Server Started');
})