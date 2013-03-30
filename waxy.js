const TEMP_MAP_PROP = 'temperature'
const TERR_MAP_PROP = 'terrain'
const GRND_MAP_PROP = 'grounded'
const THERM_CON_AIR = 0.024
const THERM_CON_WAX = 0.25

//A wrapper class for an int triple
var Point = (function(dims) {
  //validate(this, 'Point')
  this.x = dims.x || 0
  this.y = dims.y || 0
  this.z = dims.z || 0
//streamline most used function
this.t=function(d){var x=(d.x||0)+this.x,y=(d.y||0)+this.y,z=(d.z||0)+this.z;return new Point(x,y,z)}
  this.translate = function(d) {
    //validate(delta, 'Point')
    return t(delta)
  }
})//end Point

//A center point with neighbors tree
var ConnectedPoint = (function(dimensions){
  //can be created by a Point or anonymous x,y,z triplet
  //noargs is center = Point(0,0,0)
  this.center = new Point({x: dimensions.x, y:dimensions.y, z:dimensions.z})
  //validate(this.center, 'Point')
  //six sticky facets
  this.north = this.center.t({z:1})
  this.south = this.center.t({z:-1})
  this.east = this.center.t({x:1})
  this.west = this.center.t({x:-1})
  this.above = this.center.t({y:1})
  this.below = this.center.t({y:-1})
  //enumeration
  this.facets = [this.below, this.north, this.south, this.east, this.west, 
      this.above]
  //for(facet in this.facets) {
  //  validate(facet, 'Point')
  //}
})//end ConnectedP
//TODO: debug flag w verbosity
//TODO: validate objects
//TODO: y=height, z=depth
//a working set, rectangular prism

var BoundingBox = (function(dims) {
  //console.log('BoundingBox')
  //validate(dimensions[0], 'Point')
  //validate(dimensions[1], 'Point')
  if(dims.length === 1) {
    dims[1] = new Point()
  }
  this.lowerBound = new Point(dims[0])
  this.upperBound = new Point(dims[0].t(dims[1]))

  this.width = dims[1].x
  this.depth = dims[1].y
  this.height = dims[1].z

  this.contains = function(other) {
    var bResult = false
    if(other.x !== 'undefined') {
      bResult = ((other.x >= this.lowerBound.x 
          && other.y >= this.lowerBound.y  
          && other.z >= this.lowerBound.z) 
        &&(other.x <= this.upperBound.x 
          && other.y <= this.upperBound.y
          && other.z <= this.upperBound.z))
    } else {
      bResult = ((other.lowerBound.x >= this.lowerBound.x 
          && other.lowerBound.y >= this.lowerBound.y  
          && other.lowerBound.z >= this.lowerBound.z) 
        &&(other.upperBound.x <= this.upperBound.x 
          && other.upperBound.y <= this.upperBound.y
          && other.upperBound.z <= this.upperBound.z))
    }
    return bResult
  }
  this.intersects = function(other) {
    var bResult = false
    if(other.x !== 'undefined') {
      bResult = ((other.x >= this.lowerBound.x 
          && other.y >= this.lowerBound.y  
          && other.z >= this.lowerBound.z) 
        ||(other.x <= this.upperBound.x 
          && other.y <= this.upperBound.y
          && other.z <= this.upperBound.z))
    } else {
      bResult = ((other.lowerBound.x >= this.lowerBound.x 
          && other.lowerBound.y >= this.lowerBound.y  
          && other.lowerBound.z >= this.lowerBound.z) 
        ||(other.upperBound.x <= this.upperBound.x 
          && other.upperBound.y <= this.upperBound.y
          && other.upperBound.z <= this.upperBound.z))
    }
    return bResult
  }
  this.iterator = function() { return new BoxIterator(this) }
})//end BoundingBox

var BoxIterator = (function(bounds) {
  //console.log('BoxIterator')
  //validate(bounds, 'BoundingBox')
  var index=0
  var myBounds=bounds
  var xMax=myBounds.upperBound.x
  var yMax=myBounds.upperBound.y
  var zMax=myBounds.upperBound.z
  var lastIndex=xMax*yMax*zMax
  this.hasNext=function() {
    //console.log('BoxIter.hasNext')
    return index<lastIndex
  }
  //fixme: does this do what it is supposed to?
  this.next=function() {
    //console.log('BoxIter.next')
    var nextX=index%(yMax*zMax)
    var nextY=Math.floor(index/(xMax*zMax))
    var nextZ=(index-(nextY*xMax*zMax))%xMax
    index++
    return new Point({x:nextX, y:nextY, z:nextZ})
  }
})//end Iterator

//args={key,type,defaultValue}
var MapProperty = (function(args) {
  this.key = args.key
  this.type = args.type
  this.defaultValue = args.defaultValue
})

//stores terrain value for each x,y,z in a working set (BoundingBox)
//each property in a list has a value for each node in working set
var MapData = (function(workingSet, properties) {
  //console.log('MapData')
  //validate(workingSet, 'BoundingBox')
  //TODO: validate String
  //for(prop in properties){
  //  validate(prop, 'String')
  //}
  var bounds = workingSet
  var props = properties
  var self = this

//init data with defaultValues
  this.data = []
  var bbIter = bounds.iterator()
  this.propKeys = Array()
  var spot
  var propCount = 0;
  for(prop in props) {
    this.propKeys[prop]=props[prop].key
    for(;bbIter.hasNext();) {
      spot = bbIter.next()
      this.data[spot.x,spot.y,spot.z,prop] = props[prop].defaultValue
    }
  }
  //make sure property name is spelled right
  this.map = function(x,y,z,key) {
    //assertContains(property, props)
    return this.data[x,y,z,this.propKeys.indexOf(key)]
  }
  this.terrainMap = function(x,y,z) {return this.map(x,y,z,TERR_MAP_PROP)}
  //!isEmpty equiv. isTerrain
  this.isEmpty = function(x,y,z) {return this.map(x,y,z,TERR_MAP_PROP)===0}
  this.tempMap = function(x,y,z){return this.map(x,y,z,TEMP_MAP_PROP)}
  
})//end MapData

//create a sheet of terrain drops
var DropSheet = (function(opts) {
  //console.log('DropSheet')
  var depth = opts.depth
  var width = opts.width
  var rate = opts.rate
  var drop = Array()
  this.generate = function() {
    //console.log('DropSheet.generate')
    for(var i = 0; i<depth * width; i++) {
      drop[i] = Math.random() <= rate
    }
    return drop
  }
})//end DropSheet

//TODO: if a drop freezes it will fall until a not empty spot is below it
//simulated annealing
WaxyGenerator = (function(opts) {
  console.log("WG.this")
  var self = this
  var initialTemp = opts.initialTemp || 1.0
  var fillPercent = opts.fillPercent || 0.35
  var conductAir = opts.conductAir || THERM_CON_AIR
  var conductWax = opts.conductWax || THERM_CON_WAX
  var freezing = opts.freezing || 0.1
  var floorTemp = opts.floorTemp || 0.0
  bounds = opts.bounds || new BoundingBox([new Point({x:0,y:0,z:0}), 
      new Point({x:80,y:80,z:80})]);

  //each property in propertyList has its own map data
  var propertyList = opts.propertyList || 
      [new MapProperty({key:TERR_MAP_PROP, type:'int', defaultValue:0}),
      new MapProperty({key:TEMP_MAP_PROP, type:'double', defaultValue:freezing}), 
      new MapProperty({key:'grounded', type:'boolean', defaultValue:false})]
  var materials = opts.materials || ['grass', 'dirt', 'grass_dirt', 'obsidian', 'whitewool', 'brick']

  //map of data
  self.data = new MapData(bounds, propertyList)

  //create a drop sheet
  var sheetMaker= new DropSheet({width:bounds.width, depth:bounds.depth, rate:fillPercent})

  //a sudden death time index, based on z-height and conductivity
  //console.log('WG.bounds.height: ' + bounds.height)
  //console.log('initialTemp: ' + initialTemp)
  //console.log('conductivity: ' + conductivity)
  var suddenDeath = (2 * bounds.height) + Math.floor(initialTemp / conductAir)

  //aliases suitable for dynamic list?
  var terrPropIndex = self.data.propKeys.indexOf(TERR_MAP_PROP)
  var tempPropIndex = self.data.propKeys.indexOf(TEMP_MAP_PROP)
  var grndPropIndex = self.data.propKeys.indexOf(GRND_MAP_PROP)

  //a drop is grounded if it is recursively connected to the floor and freezing
  //uses a recursion trick, pass empty brackets {} for searchedR on first call
  //the search can return a false negative (fuzzy logic)
  var grounded = function (x,y,z,searchedR) {
    //console.log('WG.grounded')
    if(y===0 && !self.data.isEmpty(x,y,z)) {
      //note: MapProperties.indexOf(ground_map_property) === 2
      self.data.data[x, y, z, grndPropIndex] = true
      return true
    }
    if(self.data.map(x, y, z, grndPropIndex)) {return true;}
    if(!self.data.isEmpty(x,y,z) && self.data.tempMap(x,y,z) <= freezing) { 
     //don't search the same spot twice
      var searched = (searchedR.length>0)?searchedR:{}
      var neighbors = new ConnectedPoint({x:x, y:y, z:z})
      var branch
      for(facet in neighbors.facets) {
        branch = neighbors.facets[facet]
        if(searched.indexOf(branch) < 0) {
          searched.push(branch)
          var isG = grounded(branch.x, branch.y, branch.z, searched)
          self.data.data[branch.x, branch.y, branch.z, grndPropIndex] = isG
        }
      }
    }
    return false 
  }//end grounded

  //todo: simulate annealing
  //simulate a drop forge
  var calcTemp = function(location, conductivity) {
    //console.log('WG.calcTemp')
    if(location.y === 0){return floorTemp}
    var tree = new ConnectedPoint(location)
    var oldTemp = self.data.map(tree.center.x, tree.center.y, tree.center.z, TEMP_MAP_PROP)
    var sumTemps = 0.0
    var branch
    for(facet in tree.facets) {
      branch = tree.facets[facet]
      if(bounds.contains(branch)) {
        sumTemps += self.data.map(branch.x, branch.y, branch.z, TEMP_MAP_PROP)
	  } else {
        //out of bounds=floorTemp
        sumTemps = sumTemps + floorTemp
	  }
    }
    var meanTemp = sumTemps / tree.facets.length
    var nextTemp = oldTemp + (conductivity * (meanTemp - oldTemp))
  }//end calcTemp

  var updateTemperatures = function() {
    //console.log('WG.updateTemperatures')
    var bbIter = bounds.iterator()
    var nextSpot
    var nextTemp
    var neighborTemp
    var myNewTemp
    for(;bbIter.hasNext();) {
      nextSpot = bbIter.next()
      nextTemp = self.data.map(nextSpot.x, nextSpot.y, nextSpot.z, TEMP_MAP_PROP)
      if(self.data.isEmpty(nextSpot.x, nextSpot.y, nextSpot.z)) {
         //air
         myConductivity = conductAir
      } else {
        //wax
        myConductivity = conductWax
      }
      myNewTemp = calcTemp(nextSpot, myConductivity)
      self.data.data[nextSpot.x, nextSpot.y, nextSpot.z, tempPropIndex] = myNewTemp
    }
  }//end updateT
  
  var move = function(spot, direction) {
    //console.log('WG.move')
    //validate(spot)
    cspot = new ConnectedPoint(spot)
    var newSpot
    var terrain = self.data.terrainMap(spot.x,spot.y,spot.z)
    var temperature = self.data.tempMap(spot.x,spot.y,spot.z)
    switch(direction) {
      case 1://north, z-1
        newSpot=cspot.north
        break;
      case 2://south, z+1
        newSpot=cspot.south
        break;
      case 3://east, x+1
        newSpot=cspot.east
        break;
      case 4://west, x-1
        newSpot=cspot.west
        break;
      case 5://above, y+1
        newSpot=cspot.above
        break;
      case 0://below, y-1
      default:
        newSpot=cspot.below      
    }
    //occupy newSpot and vacate spot
    self.data.data[newSpot.x,newSpot.y,newSpot.z, self.data.propKeys.indexOf(TERR_MAP_PROP)]=terrain
    self.data.data[newSpot.x,newSpot.y,newSpot.z, self.data.propKeys.indexOf(TEMP_MAP_PROP)]=temperature
    self.data.data[newSpot.x,newSpot.y,newSpot.z, self.data.propKeys.indexOf(GRND_MAP_PROP)] = grounded(newSpot)
    self.data.data[spot.x,spot.y,spot.z, self.data.propKeys.indexOf(TERR_MAP_PROP)]=0
    self.data.data[spot.x,spot.y,spot.z, self.data.propKeys.indexOf(TEMP_MAP_PROP)]=
        calcTemp(spot.x, spot.y, spot.z, conductAir)
    self.data.data[spot.x,spot.y,spot.z, self.data.propKeys.indexOf(GRND_MAP_PROP)]=false
  }

  var moveDrops = function() {
    //console.log('WG.moveDrops')
    var bbIter = bounds.iterator()
    var spot
    for(;bbIter.hasNext();) {
      spot = bbIter.next()
      //!isEmpty === isTerrain
      if(!self.data.isEmpty(spot.x, spot.y, spot.z)) {
        var temperature = self.data.map(spot.x, spot.y, spot.z, TEMP_MAP_PROP)
        //don't move if freezing and grounded
        if(temperature >= freezing || !grounded(spot.x, spot.y, spot.z, {})) {
          var terrain = self.data.map(spot.x, spot.y, spot.z, TERR_MAP_PROP)
          var neighbors = new ConnectedPoint(spot).facets
          var kinetic = Math.min(Math.random() * (temperature/freezing), 1.0)
          if(self.data.isEmpty(neighbors.below)) { move(spot,0) }
          else {
            if(kinetic>=0.9) {
              var counter = Array()
              if(self.data.isEmpty(neighbors.north))counter.push(neighbors.north)
              if(self.data.isEmpty(neighbors.south))counter.push(neighbors.south)
              if(self.data.isEmpty(neighbors.east))counter.push(neighbors.east)
              if(self.data.isEmpty(neighbors.west))counter.push(neighbors.west)
              if(counter.length>0){
                var pick = Math.random() * counter.length + 1
                move(spot, neighbors.facets.indexOf(counter[pick]))
              }
            } else { if(kinetic>=0.99 && self.data.isEmpty(neighbors.above)){
                move(spot,5)
              }
            }
          }
        }//if temp
      }
    }
  }//end moveDrops

  var addNextSheet = function() {
    //console.log('WG.addNextSheet')
    nextSheet=sheetMaker.generate()
    var index = 0;
    for(var x=0;x<bounds.width;x++){
      for(var z=0;z<bounds.depth;z++) {
        if(nextSheet[index++]) {
          var nextTT=Math.floor(Math.random()*materials.length)+1
          self.data.data[x,bounds.height,z, self.data.propKeys.indexOf(TERR_MAP_PROP)] = nextTT
          self.data.data[x,bounds.height,z, self.data.propKeys.indexOf(TEMP_MAP_PROP)] = initialTemp
        }
      }
    }
  }//end addSheet

  this.generate = function() {
    console.log('WG.generate')
	//main loop
    for(var i = 0; i <= suddenDeath; i++){
      console.log('t='+i+'/'+suddenDeath)
      //document.getElementById('output').innerHTML=('t='+i+'/'+suddenDeath)
      //update temperatures
      updateTemperatures()
      //move drops
      moveDrops()
	  //add next sheet
	  if(i < bounds.height) {
        addNextSheet()
      }
    }
    //clean up particles
  }//end generate
})//end Generator

//test suite
var validate = function(obj, type) {
  if (type = 'Point') {
    if(obj.x==='undefined') {
      console.log('undefined Point.x')
    }
    if(obj.x===NaN) {
      console.log('NaN Point.x')
    }
    if(obj.y==='undefined') {
      console.log('undefined Point.y')
    }
    if(obj.y===NaN) {
      console.log('NaN Point.y')
    }    
    if(obj.z==='undefined') {
      console.log('undefined Point.z')
    }
    if(obj.z===NaN) {
      console.log('NaN Point.z')
    }
  }
  if (type = 'BoundingBox') {
    validate(obj.upperBound, 'Point')
    validate(obj.lowerBound, 'Point')
  }
  if (type = 'String') {
    if(obj.toString=='') console.log('Empty property string')
  }
}

var assertContains = function(obj, array) {
  var test = array.indexOf(obj) >= 0
  if (!test) { console.log('Element ' +obj+ ' not defined in ' +array.join())}
}

this.generator = new WaxyGenerator({
    initialTemp:1.0, fillPercent: 0.1, conductAir: THERM_CON_AIR, 
    conductWax: THERM_CON_WAX, freezing: 0.1,
    floorTemp:0.0, bounds: new BoundingBox([new Point({x:0,y:0,z:0}),
        new Point({x:32,y:32,z:32})]),
    materials:['dirt', 'obsidian', 'whitewool', 'brick'],
    propertyList: [new MapProperty({key:TERR_MAP_PROP, type:'int', defaultValue: 0}),
        new MapProperty({key: TEMP_MAP_PROP, type:'double', defaultValue: 0.1}), 
        new MapProperty({key: GRND_MAP_PROP, type:'boolean', defaultValue: false})]
})

//data hook for voxel.js
this.iterate = function(x,y,z) {
  //generate a new chunk for each call
  this.generator.generate()
  //return the generated terrain map chunk
  return this.generator.data.map(x,y,z,TERR_MAP_PROP)
}

//this.generator.generate()
module.exports.iterate = this.iterate
