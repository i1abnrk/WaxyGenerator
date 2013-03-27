const TEMP_MAP_PROP = 'temperature'
const TERR_MAP_PROP = 'terrain'
const GRND_MAP_PROP = 'grounded'

//A wrapper class for an int triple
var Point = (function(dimensions) {
  //validate(this, 'Point')
  this.x = dimensions.x || 0
  this.y = dimensions.y || 0
  this.z = dimensions.z || 0
  this.translate = function(delta) {
    //validate(delta, 'Point')
    var dx=delta.x || 0
    var dy=delta.y || 0
    var dz=delta.z || 0
    return new Point({x:this.x + dx, y:this.y + dy, z:this.z + dz})
  }
})//end Point

//A center point with neighbors tree
var ConnectedPoint = (function(dimensions){
  //can be created by a Point or anonymous x,y,z triplet
  //noargs is center = Point(0,0,0)
  this.center = new Point({x: dimensions.x, y:dimensions.y, z:dimensions.z})
  //validate(this.center, 'Point')
  //six sticky facets
  this.north = this.center.translate({z:1})
  this.south = this.center.translate({z:-1})
  this.east = this.center.translate({x:1})
  this.west = this.center.translate({x:-1})
  this.above = this.center.translate({y:1})
  this.below = this.center.translate({y:-1})
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
var BoundingBox = (function(dimensions) {
  //console.log('BoundingBox')
  //validate(dimensions[0], 'Point')
  //validate(dimensions[1], 'Point')
  if(dimensions.length === 1) {
    dimensions[1] = new Point()
  }
  this.lowerBound = new Point(dimensions[0])
  this.upperBound = new Point(dimensions[0].translate(dimensions[1]))

  this.width = dimensions[1].x
  this.depth = dimensions[1].y
  this.height = dimensions[1].z

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

//simulated annealing
var WaxyGenerator = (function(opts) {
  console.log("WG.this")
  var initialTemp = opts.initialTemp || 1.0
  var fillPercent = opts.fillPercent || 0.35
  var conductivity = opts.conductivity || 0.04
  var freezing = opts.freezing || 0.1
  var floorTemp = opts.floorTemp || 0.0
  var bounds = opts.bounds || new BoundingBox([new Point({x:0,y:0,z:0}), 
      new Point({x:80,y:80,z:80})]);
  //each property in propertyList has its own map data
  var propertyList = opts.propertyList || 
      [new MapProperty({key:TERR_MAP_PROP, type:'int', defaultValue:0}),
      new MapProperty({key:TEMP_MAP_PROP, type:'double', defaultValue:freezing}), 
      new MapProperty({key:'grounded', type:'boolean', defaultValue:false})]
  var materials = opts.materials || ['grass', 'dirt', 'grass_dirt', 'obsidian', 'whitewool', 'brick']
  //map of data
  data = new MapData(bounds, propertyList)
  //create a drop sheet
  var sheetMaker= new DropSheet({width:bounds.width, depth:bounds.depth, rate:fillPercent})
  //a sudden death time index, based on z-height and conductivity
  //console.log('WG.bounds.height: ' + bounds.height)
  //console.log('initialTemp: ' + initialTemp)
  //console.log('conductivity: ' + conductivity)
  var suddenDeath = bounds.height + Math.floor(initialTemp / conductivity)

  //a drop is grounded if it is recursively connected to the floor and freezing
  //uses a recursion trick, pass empty brackets {} for searchedR on first call
  //the search can return a false negative (fuzzy logic)
  var grounded = function (x,y,z,searchedR) {
    //console.log('WG.grounded')
    if(y===0) {
      data.data[x,y,z,2] = true
      return true
    }
    if(data.map(x,y,z,GRND_MAP_PROP)) {return true;}
    if(!data.isEmpty(x,y,z) && data.tempMap(x,y,z) <= freezing) { 
     //don't search the same spot twice
      var searched = (searchedR.length>0)?searchedR:{}
      var neighbors = new ConnectedPoint({x:x, y:y, z:z})
      var branch
      for(facet in neighbors.facets) {
        branch = neighbors.facets[facet]
        if(searched.indexOf(branch) < 0) {
          searched.push(branch)
          var isG = grounded(branch.x, branch.y, branch.z, searched)
          data.data[branch.x, branch.y, branch.z, 2] = isG
        }
      }
    }
    return false 
  }//end grounded

  //todo: simulate annealing
  //simulate a drop forge
  var calcTemp = function(drop, location){
    //console.log('WG.calcTemp')
    if(location.y === 0){return floorTemp}
    var tree = new ConnectedPoint(location)
    var oldTemp = data.tempMap(tree.center.x, tree.center.y, tree.center.z)
    var sumTemps = 0.0
    var branch
    for(facet in tree.facets) {
      branch = tree.facets[facet]
      if(bounds.contains(branch)) {
        if(data.isEmpty(branch.x, branch.y, branch.z)) {
          sumTemps = sumTemps + freezing
		} else {
          sumTemps = sumTemps + data.map(branch.x, branch.y, branch.z, TEMP_MAP_PROP)
		}
	  } else {
        sumTemps = sumTemps + freezing
	  }
    }
    var meanTemp = sumTemps / tree.facets.length
    var nextTemp = oldTemp + (conductivity * (meanTemp - oldTemp))
    data.data[tree.center.x, tree.center.y, tree.center.z,
        data.propKeys.indexOf(TEMP_MAP_PROP)] = nextTemp
  }//end calcTemp

  var updateTemperatures = function() {
    //console.log('WG.updateTemperatures')
    var bbIter = bounds.iterator()
    var nextPoint
    var nextDrop
    var nextTemp
    for(;bbIter.hasNext();) {
      nextPoint = bbIter.next()
      nextTemp = data.tempMap(nextPoint.x, nextPoint.y, nextPoint.z)
      if(data.isEmpty(nextPoint.x, nextPoint.y, nextPoint.z)){
         nextTemp = freezing
      } else {
        nextDrop = data.terrainMap(nextPoint.x, nextPoint.y, nextPoint.z)
        calcTemp(nextDrop,nextPoint)
      }
    }
  }//end updateT
  
  var move = function(spot, direction) {
    //console.log('WG.move')
    //validate(spot)
    cspot = new ConnectedPoint(spot)
    var newSpot
    var terrain = data.terrainMap(spot.x,spot.y,spot.z)
    var temperature = data.tempMap(spot.x,spot.y,spot.z)
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
    data.data[newSpot.x,newSpot.y,newSpot.z,data.propKeys.indexOf(TERR_MAP_PROP)]=terrain
    data.data[newSpot.x,newSpot.y,newSpot.z,data.propKeys.indexOf(TEMP_MAP_PROP)]=temperature
    data.data[newSpot.x,newSpot.y,newSpot.z,data.propKeys.indexOf(GRND_MAP_PROP)] = grounded(newSpot)
    data.data[spot.x,spot.y,spot.z,data.propKeys.indexOf(TERR_MAP_PROP)]=0
    data.data[spot.x,spot.y,spot.z,data.propKeys.indexOf(TEMP_MAP_PROP)]=freezing
    data.data[spot.x,spot.y,spot.z,data.propKeys.indexOf(GRND_MAP_PROP)]=false
  }

  var moveDrops = function() {
    //console.log('WG.moveDrops')
    var bbIter = bounds.iterator()
    var spot
    for(;bbIter.hasNext();) {
      spot = bbIter.next()
      //!isEmpty === isTerrain
      if(!data.isEmpty(spot.x, spot.y, spot.z)) {
        var temperature = data.tempMap(spot.x, spot.y, spot.z)
        //don't move if freezing and grounded
        if(temperature >= freezing || !grounded(spot.x, spot.y, spot.z, {})) {
          var terrain = data.terrainMap(spot.x, spot.y, spot.z)
          var neighbors = new ConnectedPoint(spot).facets
          var kinetic = Math.min(Math.random() * (temperature/freezing), 1.0)
          if(data.isEmpty(neighbors.below)) { move(spot,0) }
          else {
            if(kinetic>=0.9) {
              var counter = Array()
              if(data.isEmpty(neighbors.north))counter.push(neighbors.north)
              if(data.isEmpty(neighbors.south))counter.push(neighbors.south)
              if(data.isEmpty(neighbors.east))counter.push(neighbors.east)
              if(data.isEmpty(neighbors.west))counter.push(neighbors.west)
              if(counter.length>0){
                var pick = Math.random() * counter.length + 1
                move(spot, neighbors.facets.indexOf(counter[pick]))
              }
            } else { if(kinetic>=0.99 && data.isEmpty(neighbors.above)){
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
          data.data[x,bounds.height,z,data.propKeys.indexOf(TERR_MAP_PROP)] = nextTT
          data.data[x,bounds.height,z,data.propKeys.indexOf(TEMP_MAP_PROP)] = initialTemp
        }
      }
    }
  }//end addSheet

  this.generate = function() {
    console.log('WG.generate')
	//main loop
    for(var i = 0; i <= suddenDeath; i++){
      console.log('t='+i+'/'+suddenDeath)
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

var generator = new WaxyGenerator(
  {initialTemp:1.0, fillPercent: 0.35, conductivity: 0.04, freezing: 0.1,
    floorTemp:0.0, bounds: new BoundingBox([new Point({x:0,y:0,z:0}),
        new Point({x:80,y:80,z:80})]),
    materials:['grass', 'dirt', 'grass_dirt', 'obsidian', 'whitewool', 'brick'],
    propertyList: [new MapProperty({key:TERR_MAP_PROP, type:'int', defaultValue: 0}),
      new MapProperty({key: TEMP_MAP_PROP, type:'double', defaultValue: 0.1}), 
      new MapProperty({key:'grounded', type:'boolean', defaultValue: false})]
  })
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
generator.generate()
