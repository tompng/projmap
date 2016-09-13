var projector={L: 2.21, Y: 0.2}
var camera={position: {x: 1, y: 0.5, z: 0.3}, rotation: {x: 0.1, y: -0.1, z: 0.2}, L: 2.18}

var forceOption={
  projL: false,
  projY: false,
  camL: 2.18,//MBP camera
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

var cst=cost(ans=[Math.sqrt(projector.L-1),projector.Y,Math.sqrt(camera.L-1),
  camera.position.y,camera.position.z,
  camera.rotation.x,camera.rotation.y,camera.rotation.z,
])
console.error(cst)

//xx+5xx+10xy+5yy
//6xx+10xy+5yy
//x: 12x+10y
//y: 10x+10y
//xx: 12
//yy: 10
//xy: 10

function fastSolve(func, args){
  for(var i=0;i<10000;i++){
    var df=[]
    var ddf=[]
    var delta=0.00000001
    var c0=func(args)
    var cost=c0
    for(var j=0;j<args.length;j++){
      var tmp=args.concat()
      var tj=tmp[j],cplus=0,cminus=0
      tmp[j]=tj+delta
      cplus=func(tmp)
      tmp[j]=tj-delta
      cminus=func(tmp)
      df[j]=(cplus-cminus)/delta/2
      ddf[j]=[]
      for(var k=0;k<args.length;k++){
        if(j==k)ddf[j][k]=(cplus+cminus-2*c0)/delta/delta
        else{
          var tk=tmp[k]
          var djksum=0;
          tmp[j]=tj+delta;tmp[k]=tk+delta;
          djksum+=func(tmp)
          tmp[j]=tj-delta;tmp[k]=tk-delta;
          djksum+=func(tmp)
          tmp[j]=tj+delta;tmp[k]=tk-delta;
          djksum-=func(tmp)
          tmp[j]=tj-delta;tmp[k]=tk+delta;
          djksum-=func(tmp)
          ddf[j][k]=djksum/4/delta/delta
        }
      }
    }
    var dnewton = solveMatrix(ddf,df.concat())
    var ntmp=args.map(function(v,i){return v-dnewton[i]})
    var ncost = func(ntmp)
    if(ncost<cost){
      console.log('newton', ncost)
      cost=ncost
      args=ntmp
    }else{
      var d2sum=0
      df.forEach(function(d){d2sum+=d*d})
      var dlen=Math.sqrt(d2sum)
      var d=delta
      var processed=false
      while(true){
        var tmp = args.map(function(v,i){return v-d*df[i]/dlen})
        var gcost = func(tmp)
        if(gcost>=cost)break
        processed=true
        cost=gcost
        args=tmp
        d*=2
      }
      if(!processed){console.error('failed');break}
      console.error('grad', cost)
    }
    if(cost<1e-10){console.log('END:',cost);break;}
  }
  return args
}

out=fastSolve(cost, [0,0,0,0,0,0,0,0].map(function(){
  return 0.1*(2*Math.random()-1)
}))
console.log(ans)
console.log(out.map(function(a){return parseFloat(a.toFixed(4))}))

function cost(args){
  args = new ArgsSlicer(args)
  var projector = {L: 1+Math.pow(args.slice(),2), Y: args.slice()}
  var camera = {
    L: 1+Math.pow(args.slice(),2),
    position: {
      x: answer.camera.position.x,
      y: args.slice(),
      z: args.slice()
    },
    rotation: args.slice(['x','y','z'])
  }
  var costs = 0
  if(forceOption.projL){
    var projL=forceOption.projL==true?answer.projector.L:forceOption.projL
    costs+=Math.pow(projector.L-projL,2)
  }
  if(forceOption.projY){
    var projY=forceOption.projY==true?answer.projector.Y:forceOption.projY
    costs+=Math.pow(projector.L-projY,2)
  }
  if(forceOption.camL){
    var camL=forceOption.camL==true?answer.camera.L:forceOption.camL
    costs+=Math.pow(camera.L-camL,2)
  }
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

function solveMatrix(matrix,val){
  var size=matrix.length;
  for(var i=0;i<size;i++){
    for(var j=i+1;j<size;j++){
      var s=matrix[j][i]/matrix[i][i];
      for(var k=i+1;k<size;k++){
        matrix[j][k]-=s*matrix[i][k];
      }
      val[j]-=s*val[i];
    }
  }
  var out=[];
  for(var i=size-1;i>=0;i--){
    out[i]=val[i]/matrix[i][i];
    for(var j=i-1;j>=0;j--){
      var s=matrix[j][i]/matrix[i][i]
      val[j]-=s*val[i];
    }
  }
  return out;
}
