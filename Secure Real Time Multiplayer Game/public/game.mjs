import { dimensions, arena } from "./gameCanvas.mjs";
import Player from "./Player.mjs";
import Collectible from "./Collectible.mjs";

//helpers & defaults
const socket = io();
const movementKeys = ["w", "a", "s", "d"];
let allPlayers = [];
let speed = 10;
let collectibleBuffer = dimensions.buffer;

const randomCoordinate = (min, max) => {
  return Math.floor(Math.random() * max) + min;
};
const localPlayer = new Player({
  x: randomCoordinate(dimensions.minX, dimensions.maxX - speed),
  y: randomCoordinate(dimensions.minY, dimensions.maxY - speed),
  score: 0,
  id: Date.now(),
});
let goal = new Collectible({
  x: randomCoordinate(dimensions.minX, dimensions.maxX - collectibleBuffer),
  y: randomCoordinate(dimensions.minY, dimensions.maxY - collectibleBuffer),
  id: Date.now(),
});

// attach event listener for controls
document.addEventListener("keypress", function (event) {
  if (movementKeys.includes(event.key)) {
    window.requestAnimationFrame(updateGame);
    localPlayer.movePlayer(event.key, speed);
    socket.emit("updateServerPlayers", { allPlayers, localPlayer, goal });
  }
});

// when new player connects
socket.on("connected", (connected) => {
  window.requestAnimationFrame(updateGame);
  socket.emit("init", { allPlayers, localPlayer, goal });
  console.log(`${connected.msg}, Currently ${connected.connections} player(s)`);
});

// when a player updates server-side
socket.on("updateClientPlayers", (data) => {
  allPlayers = data.allPlayers;
  goal = new Collectible(data.goal);
  window.requestAnimationFrame(updateGame);
});

// when a player disconnects
socket.on("disconnected", (connected) => {
  console.log(`${connected.msg}, Currently ${connected.connections} player(s)`);
});

const updateGame = () => {
  //erase
  arena.clearCanvas();

  //set background
  arena.drawCanvas();

  // Controls text
  arena.drawHeading();

  //add collectible
  goal.draw();

  // add players
  allPlayers.forEach((player) => {
    const p = new Player(player);
    if (p.id === localPlayer.id) p.local = true; // make local player unique
    p.draw();
  });

  // detect collision
  if (localPlayer.collision(goal)) {
    const winningPlayer = allPlayers.findIndex((p) => p.id == localPlayer.id);
    allPlayers[winningPlayer].score = localPlayer.score;
    const randX = randomCoordinate(
      dimensions.minX,
      dimensions.maxX - collectibleBuffer
    );
    const randY = randomCoordinate(
      dimensions.minY,
      dimensions.maxY - collectibleBuffer
    );

    goal = new Collectible({
      x: randX > dimensions.maxX ? dimensions.maxX - collectibleBuffer : randX,
      y: randY > dimensions.maxY ? dimensions.maxY - collectibleBuffer : randY,
      id: Date.now(),
    });
    localPlayer.calculateRank(allPlayers);
    socket.emit("updateServerPlayers", { allPlayers, localPlayer, goal });
  }

  localPlayer.calculateRank(allPlayers);
};