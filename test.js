var libProjection = require('./projection')
calcCamera = libProjection.calcCamera
calcDepth = libProjection.calcDepth
vecLinearAdd = libProjection.vecLinearAdd
eulerRot = libProjection.eulerRot

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

var ans=[Math.sqrt(projector.L-1),projector.Y,Math.sqrt(camera.L-1),
  camera.position.y,camera.position.z,
  camera.rotation.x,camera.rotation.y,camera.rotation.z,
]
function merge(a,b){
  var out={}
  for(var i in a)out[i]=a[i]
  for(var i in b)out[i]=b[i]
  return out
}
console.log(ans.map(function(a){return parseFloat(a.toFixed(4))}))
out = calcCamera(points, forceOption)
out[0]=Math.abs(out[0]);out[2]=Math.abs(out[2]);
console.log(out.map(function(a){return parseFloat(a.toFixed(4))}))

calcDepth(points, out)


require('fs').readFile('./data.json', function(err, json){
  var map = JSON.parse(json)
  var points = []
  for(var i=0;i<map.length;i++)for(var j=0;j<map[i].length;j++){
    if(map[i][j])points.push(map[i][j])
  }
  function sample(array, n){
    var arr=[]
    array.forEach(function(v, i){
      var size=array.length-i
      var num=n-arr.length
      if(Math.random()<num/size)arr.push(v)
    })
    return arr
  }

  out = calcCamera(sample(points, 32), merge(forceOption, {loop: 500}))
  out = calcCamera(sample(points, 256), merge(forceOption, {initial: out, loop: 100}))
  out[0]=Math.abs(out[0]);out[2]=Math.abs(out[2])
  calcDepth(points, out)


  out2=libProjection.invFill(map,100)
  for(var y=0;y<map[0].length;y+=2){
    var s='';
    function mediun(x,y){
      var l=[]
      var p=map[x][y]
      if(!p)return 0
      var arr=[p.estimated.projectorDepth,
      ((map[x-1]||l)[y-1]||p).estimated.projectorDepth,
      ((map[x+1]||l)[y-1]||p).estimated.projectorDepth,
      ((map[x-1]||l)[y+1]||p).estimated.projectorDepth,
      ((map[x+1]||l)[y+1]||p).estimated.projectorDepth,
      ((map[x-1]||l)[y]||p).estimated.projectorDepth,
      ((map[x+1]||l)[y]||p).estimated.projectorDepth,
      ((map[x]||l)[y-1]||p).estimated.projectorDepth,
      ((map[x]||l)[y+1]||p).estimated.projectorDepth]
      return arr.sort(function(a,b){a=a-b;return a>0?1:a<0?-1:0})[4]
    }
    for(var x=0;x<map.length;x++){
      var pu=map[x][y],pd=map[x][y+1]
      var u=pu&&Math.sin(10*pu.estimated.projectorDepth)>0?1:0
      var d=pd&&Math.sin(10*pd.estimated.projectorDepth)>0?1:0
      u=Math.sin(20*mediun(x,y))>0?1:0
      d=Math.sin(20*mediun(x,y+1))>0?1:0
      u=Math.sin(80*out2[x][y])>0?1:0
      d=Math.sin(80*out2[x][y+1])>0?1:0
      s+=' v^8'[2*u+d]
    }
    console.log(s)
  }

  console.log(out.map(function(a){return parseFloat(a.toFixed(4))}))
});


//[ 1.6011, 0.7635, 1.0863, 0.8708, 1.1560, -0.0079, 0.0258, 0.0151 ]
//[ 1.5960, 0.7851, 1.0863, 0.8663, 1.1341, -0.0096, 0.0306, 0.0152 ]
//[ 1.6078, 0.7566, 1.0863, 0.8793, 1.1431, -0.0074, 0.0232, 0.0154 ]
//[ 1.5964, 0.7581, 1.0863, 0.8552, 1.1785, -0.0080, 0.0264, 0.0155 ]
//[ projL,  projY,  camL,   camY,   camZ,   rot1,    rot2,   rot3   ]
