Author: Zakri M. Kneebone
License: CC BY-NC 3.0 (see http://creativecommons.org/licenses/by-nc/3.0/)
Project: WaxyGenerator (waxy.js)
Purpose: A 3D fractal generator designed to look like a melted wax sculpture and
to interface it with the voxel.js package.
Classes: Point, ConnectedPoint, BoundingBox, BoundingBox.Iterator,
MapData, WaxyGenerator
Point: a wrapper class for an x,y,z triple. Constructor takes arguments {x,y,z},
noargs produces Point(0,0,0)
ConnectedPoint: a Point with reference to 6 neighbors: above, below, north,
south, east and west. An enumeration of all 6 is returned with the facets() 
function
BoundingBox: a rectangular prism define by two corners, lowerBound and upperBound.
lowerBound and upperBound are both instances of Point, having x,y,z. Size methods
are available for width (x-axis), height (y-axis) and depth (z-axis). There are
two set logic methods: contains and intersects. contains returns true if all of
first parameter lies within bounds of the second parameter. Intersects returns
true if some or all of the first parameter lies within bounds of the second parameter.
contains and intersects also have one parameter method to compare the current
instance of the class.
BoundingBox.Iterator: an Iterator starting at lowerBound and proceeding through
each integer point until upperBound.
Design notes:
each spot has a temperature, the hotter it is, the less sticky it is.
each drop has a high initial temperature
the drop will heat up or cool down on contact with a spot
each spot has six neighbors, (above, below, north, south, east, west) 
the temperature of a spot is the mean temperature of the neighbors and itself
an empty spot has a temperature of freezing
if the drop is above freezing it will randomly move to an empty neighbor
if the drop hits the floor it will freeze instantly
if a drop freezes it will fall until a not empty spot is below it
a drop will move below 90%, nsew 9% (2.25% each), above (1%) while it is hot
constructed in a way that each property has its own map

NOUNS: spot, temperature, drop, high initial temperature, 
six neighbors (north, south, east, west, above, below), itself
mean temperature of neighbors, empty neighbor, floor

VERBS: has a temperature, is hot, is sticky, heat up or cool down on contact,
has neighbors, randomly move to an empty neighbor, freeze instantly

SPOT: temperature, six neighbors, empty, self

DROP: initial temperature, current temperature, current age, current spot,

FLOOR: z=0, temperature = FREEZING
Related research: thermal conductivity of air = 0.024 k - W/m*K
(Watts per meter-degree kelvin)
Diatomaceous earth (Sil-o-cel) 0.06
Paraffin Wax 0.25
http://www.engineeringtoolbox.com/thermal-conductivity-d_429.html
