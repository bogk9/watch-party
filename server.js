const express = require('express');
const path = require('path');
const publicPath = path.join(__dirname, '.', 'public');
const http = require('http');
const stdin = process.openStdin();
const chatServer = require('./chatserver.js');

const app = express();


// Creates instance of chat server
chatServer(app);

// Serves static website files
app.use(express.static(publicPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
 });


