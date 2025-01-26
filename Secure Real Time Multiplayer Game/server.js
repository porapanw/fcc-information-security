require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// security
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const connections = [];
const io = socket(server);
let allPlayers = [];
let goal = {};

io.sockets.on("connection", (socket) => {
  connections.push(socket);
  io.emit("connected", {
    msg: `Connected ${socket.id}`,
    connections: connections.length
  });
  // add player to list of all Players
  socket.on("init", (data) => {
    data.localPlayer.socketId = socket.id;
    if ( !allPlayers.includes(allPlayers.find((player) => player.socketId === data.localPlayer.socketId))) return allPlayers.push(data.localPlayer);
  io.emit("updateClientPlayers", { allPlayers, goal });
  });

  socket.on("updateServerPlayers", (data) => {
    // update goal from client
    goal = data.goal;
    // get index of player who triggered update
    const player = allPlayers.findIndex((player) => player.id == data.localPlayer.id);
    // update player by index
    allPlayers[player].x = data.localPlayer.x;
    allPlayers[player].y = data.localPlayer.y;
    allPlayers[player].score = data.localPlayer.score;
    io.emit("updateClientPlayers", { allPlayers, goal });
  });

  // remove player from list of all players by associated the socket id
  socket.on("disconnect", () => {
    connections.splice(connections.indexOf(socket), 1);
    allPlayers = allPlayers.filter((player) => player.socketId !== socket.id);
    io.emit("updateClientPlayers", { allPlayers, goal });
    socket.broadcast.emit("disconnected", {
      msg: `${socket.id} disconnected`,
      connections: connections.length
    })
  })
});

module.exports = app; // For testing
