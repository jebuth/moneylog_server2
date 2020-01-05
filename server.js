const express = require('express');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const port = 3000;

const app = express();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.appdata'];
var jwt_client = null;

// =============================================================================
// load client secrets form a local file
fs.readFile('./private/moneylog-server.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content));
  });

  // get JWT
function authorize(credentials) {
    const {client_email, private_key} = credentials;
    jwt_client = new google.auth.JWT(
        client_email, null, private_key, SCOPES); 

}
// =============================================================================

//make appoint dmv 25th

app.listen(port, '192.168.1.4', function(){
   console.log("Server is running on port: " + port);
});

app.get('/categories', function (req, res) {

    console.log('/categories-------------------------------------')
    var sheets = google.sheets({version: 'v4', auth: jwt_client });

    var request = {
        spreadsheetId: req.query.ssid,
        range: 'B3:F17',
    };

    // use spreaddsheets.get to get sheets in spreadsheet
    sheets.spreadsheets.values.get(request, function(err, response){
        if(err){
            console.log(err);
            return;
        }
        
        let categories = [];
        response.data.values.forEach(function (element){
            categories.push({expenses: element[0], _chk2m: element[3]});  
        });

        //console.log(categories);
        res.send(categories);
        //console.log(categories)
        
    });
});

app.post('/update', function (req, res) {
    console.log('/update-------------------------------------')
    let ssid= req.query.ssid;
    let amount = req.query.amount;
    let description = req.query.description;
    let category = req.query.category;

    console.log('incoming request');
    console.log(ssid)

    var request = {
        spreadsheetId: ssid,
        range: 'Transactions!B2:E2', // rethink
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            values: [
                [new Date().toLocaleDateString("en-US"), amount, description, category]
            ],    
        }
    }

    var sheets = google.sheets({version: 'v4', auth: jwt_client });
    sheets.spreadsheets.values.append(request, function(err, response){
        if(err){
            console.log(err);
            res.send(err);
            return;
        }
        console.log(response.data)
        res.sendStatus(200);
    });
});

app.post('/new', function (req, res) {
    console.log('/new---------------------------------------------')
    var drive = google.drive({version:'v3', auth: jwt_client});
    
    let name = req.query.name;
    let parentId = req.query.id;

    console.log('name: ' + name);
    console.log('parentId: ' + parentId);

    var body = {
        name: name,
        parents: [parentId],
        //parents: ['1ZhGurkvsyVjyQGXykvrvL7S2vdzLOg1I'],
    }

    drive.files.copy({
        //fileId: '1bgaMnhclbYBTGooqJGHFetJ1ljC5R3qnRbF8KY4jdA4', // _template,
        fileId: '1755dA88nwBlJfKrQIClTJvGrXHRy_Hd4Hyt-NuMGcwE', // dev,
        requestBody: body
    },  function(err, response){
        if(err){
            console.log(err.status);
            res.send(err);
            return;
        }
        res.send(response.status);
    });
});

// google drive on rn
// create sheet => passes folder id: 1ZhGurkvsyVjyQGXykvrvL7S2vdzLOg1I