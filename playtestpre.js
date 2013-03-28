var createGame = require('voxel-engine')
var texturePath = require('painterly-textures')(__dirname)
var terrain = include('./waxy')
var chunkData = generator([0,0,0], [32,32,32], iterate(x,y,z))
var game = createGame({texturePath: texturePath,
  generateVoxelChunk: generator,
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
