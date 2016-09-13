var libProjection = require('./projection')
calcCamera = libProjection.calcCamera;
vecLinearAdd = libProjection.vecLinearAdd;
eulerRot = libProjection.eulerRot;

var projector={L: 2.21, Y: 0.2}
var camera={position: {x: 1, y: 0.5, z: 0.3}, rotation: {x: 0.1, y: -0.1, z: 0.2}, L: 2.18}

var forceOption={
  projL: false,
  projY: false,
  camL: 2.18,//MBP camera
}


function cameraProjection(camera,point){
  var cp = vecLinearAdd(1, point, -1, camera.position)
  return eulerRot(cp, camera.rotation)
}

function seedRandom(){
  if(!seedRandom.seed)seedRandom.seed=1234.567;
  seedRandom.seed = Math.sin(seedRandom.seed+seedRandom.seed*seedRandom.seed)
  return 65536*(1+Math.sin(seedRandom.seed))%1
}
function genPoints(n){
  var points = []
  for(var i=0;i<n;i++){
    points.push({x: 2*seedRandom()-1, y: 2*seedRandom()-1, z: 4+2*seedRandom()})
  }
  return points
}
var itemPoints = genPoints(20)

var points = itemPoints.map(function(p){
  cproj = cameraProjection(camera, p)
  return {
    position: p,
    camera: {x: cproj.x/cproj.z*camera.L, y: cproj.y/cproj.z*camera.L},
    projector: {x: p.x/p.z*projector.L, y: p.y/p.z*projector.L+projector.Y}
  }
})

var answer = {
  projector: projector,
  camera: camera,
  points: points
}

var ans=[Math.sqrt(projector.L-1),projector.Y,Math.sqrt(camera.L-1),
  camera.position.y,camera.position.z,
  camera.rotation.x,camera.rotation.y,camera.rotation.z,
]

out = calcCamera(points, forceOption)
console.log(ans.map(function(a){return parseFloat(a.toFixed(4))}))
out[0]=Math.abs(out[0])
out[2]=Math.abs(out[2])
console.log(out.map(function(a){return parseFloat(a.toFixed(4))}))
