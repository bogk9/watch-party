const express = require('express');
const path = require('path');
const publicPath = path.join(__dirname, '.', 'public');
const http = require('http');
const stdin = process.openStdin();
const chatServer = require('./chatserver.js');

const app = express();


// Serves static website files
app.use(express.static(publicPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
 });


// Creates instance of chat server

var server = app.listen(process.env.PORT || 3102, function() {
    console.log('io server listening: ', server.address())
});

chatServer(server);


