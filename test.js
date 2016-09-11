forceOption={
  projL: true,
  projY: false,
  camL: true,
}

function vecLinearAdd(a,va,b,vb){
  return {
    x: a*va.x+b*vb.x,
    y: a*va.y+b*vb.y,
    z: a*va.z+b*vb.z
  }
}
function eulerRot(v,rot){
  var cx=Math.cos(rot.x), sx=Math.sin(rot.x)
  var cy=Math.cos(rot.y), sy=Math.sin(rot.y)
  var cz=Math.cos(rot.z), sz=Math.sin(rot.z)
  var vx={x: v.x, y: v.y*cx-v.z*sx, z: v.y*sx+v.z*cx}
  var vy={x: vx.x*cy-vx.z*sy, y: vx.y, z: vx.x*sy+vx.z*cy}
  return {x: vy.x*cz-vy.y*sz, y: vy.x*sz+vy.y*cz, z: vy.z}
}
function vecDot(a,b){
  return a.x*b.x+a.y*b.y+(a.z*b.z||0)
}
function vecCross(a,b){
  return {
    x: a.y*b.z-a.z*b.y,
    y: a.z*b.x-a.x*b.z,
    z: a.x*b.y-a.y*b.x
  }
}
function reverseEulerRot(v,rot){
  var cx=Math.cos(rot.x), sx=Math.sin(rot.x)
  var cy=Math.cos(rot.y), sy=Math.sin(rot.y)
  var cz=Math.cos(rot.z), sz=Math.sin(rot.z)
  var vz={x: v.x*cz+v.y*sz, y: -v.x*sz+v.y*cz, z: v.z}
  var vy={x: vz.x*cy+vz.z*sy, y: vz.y, z: -vz.x*sy+vz.z*cy}
  return {x: vy.x, y: vy.y*cx+vy.z*sx, z: -vy.y*sx+vy.z*cx}
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

var projector={L: 1, Y: 0.1}
var numCameras = 1
var camera={position: {x: 1, y: 0.5, z: 0.3}, rotation: {x: 0.1, y: -0.1, z: 0.2}, L: 1}

var points = itemPoints.map(function(p){
  cproj = cameraProjection(camera, p)
  return {
    position: p,
    camera: {x: cproj.x/cproj.z*camera.L, y: cproj.y/cproj.z*camera.L},
    projector: {x: p.x/p.z*projector.L, y: p.y/p.z*projector.L+projector.Y}
  }
})

function ArgsSlicer(args){
  this.index = 0
  this.length = args.length
  this.slice = function(keys){
    var self = this
    var out
    if(keys == undefined){
      return args[this.index++]
    }if(typeof keys == 'number'){
      out = []
      for(var i=0;i<keys;i++)out[i]=args[this.index++]
    }else{
      out = {}
      keys.forEach(function(key){out[key]=args[self.index++]})
    }
    return out
  }
}

var answer = {
  projector: projector,
  camera: camera,
  points: points
}

var cst=cost(ans=[projector.L-1,projector.Y,camera.L-1,
  camera.position.x,camera.position.y,camera.position.z,
  camera.rotation.x,camera.rotation.y,camera.rotation.z,
])
console.error(cst)

function solve(args){
  var cst = cost(args)||Infinity
  if(forceOption.projL)args[0]=answer.projector.L-1
  if(forceOption.projY)args[1]=answer.projector.Y
  if(forceOption.camL)args[2]=answer.camera.L-1
  args[3]=answer.camera.position.x
  for(var i=0;i<10000;i++){
    var d=[],d2=0
    var c0=cost(args)
    for(var j=0;j<args.length;j++){
      var tmp=args.concat()
      tmp[j]+=0.000000000001
      d[j]=cost(tmp)-c0
      d2+=d[j]*d[j]
    }
    var dlen=Math.sqrt(d2)
    d=d.map(function(v){return v/dlen})
    var delta = 0.000000000001
    var a0=args.concat()
    while(true){
      var tmp=a0.map(function(v,i){return v-delta*d[i]})
      var c = cost(tmp)
      if(c>cst)break;
      cst=c;
      args=tmp;
      delta*=2;
    }
    console.error(cst)
  }
  return args
}

out=solve([0,0,0,0,0,0,0,0,0].map(function(){
  return 0.1*(2*Math.random()-1)
}))
console.log(ans)
console.log(out.map(function(a){return parseFloat(a.toFixed(4))}))

function cost(args){
  args = new ArgsSlicer(args)
  var projector = {L: 1+args.slice(), Y: args.slice()}
  var positionKey = ['x', 'y', 'z']
  var camera = {
    L: 1+args.slice(),
    position: args.slice(positionKey),
    rotation: args.slice(positionKey)
  }
  if(forceOption.projL)projector.L=answer.projector.L
  if(forceOption.projY)projector.Y=answer.projector.Y
  if(forceOption.camL)camera.L=answer.camera.L
  camera.position.x=answer.camera.position.x
  var costs = 0
  points.forEach(function(p){
    var pvec = {
      x: p.projector.x/projector.L,
      y: (p.projector.y-projector.Y)/projector.L,
      z: 1
    }
    var cpos = camera.position
    var cvec = reverseEulerRot({
      x: p.camera.x/camera.L,
      y: p.camera.y/camera.L,
      z: 1
    },camera.rotation)
    var a=pvec,b=camera.position,c=cvec;
    var aa=vecDot(a,a),bb=vecDot(b,b),cc=vecDot(c,c)
    var ab=vecDot(a,b),bc=vecDot(b,c),ac=vecDot(a,c)
    //min |a*s-(b+c*t)|
    // var D=aa*cc-ac*ac
    // var sD=ac*bc-cc*ab
    // var tD=-ac*ab+aa*bc
    // var minDiffD = ab*sD-bc*tD+bb*D
    // costs += minDiffD

    var cross = vecCross(b,c)
    var dot= vecDot(cross, a)
    costs += dot*dot
  })
  return costs;
}
