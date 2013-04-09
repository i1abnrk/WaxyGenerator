//playtestpre.js the pre-browserify version of playtest.js
var createGame = require('voxel-engine')
var texturePath = require('painterly-textures')(__dirname)
var terrain = require('./waxy')
 generator = terrain.iterate
var game = createGame({
  texturePath: texturePath,
  generate: generator,
  texturePath: texturePath,
  materials: ['grass', 'dirt', 'grass_dirt', 'obsidian', 'whitewool', 'brick'],
  cubeSize: 25,
  chunkSize: 32,
  chunkDistance: 2,
  startingPosition: [0, 1000, 0],
  worldOrigin: [0,0,0]
})
var container = document.body
game.appendTo(container)
game.setupPointerLock(container)
