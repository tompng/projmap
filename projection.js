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

function fastSolve(func, args, loop){
  for(var i=0;i<(loop||1000);i++){
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
      // console.log('newton', ncost)
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
      if(!processed)for(var j=0;j<20;j++){
        d/=2;
        var tmp = args.map(function(v,i){return v-d*df[i]/dlen})
        var changed=false
        for(var k=0;k<args.length;k++){
          if(tmp[k]!=args[k])changed=true
        }
        if(!changed){break}
        var gcost = func(tmp)
        if(gcost>=cost)continue
        processed=true
        cost=gcost
        args=tmp
        break
      }
      if(!processed)break
      // console.log('grad  ', cost)
    }
  }
  console.log(i)
  return args
}
function calcDepth(points, data){
  args = new ArgsSlicer(data)
  var projector = {L: 1+Math.pow(args.slice(),2), Y: args.slice()}
  var camera = {
    L: 1+Math.pow(args.slice(),2),
    position: {
      x: 1,
      y: args.slice(),
      z: args.slice()
    },
    rotation: args.slice(['x','y','z'])
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
    // min |a*s-(b+c*t)|
    var D=aa*cc-ac*ac
    var s=(ab*cc-ac*bc)/D
    var t=(ab*ac-aa*bc)/D
    var ests = {x: a.x*s, y: a.y*s, z: a.z*s}
    var estt = {x: b.x+c.x*t, y: b.y+c.y*t, z: b.z+c.z*t}
    var errvec = vecLinearAdd(1, ests, -1, estt)
    p.estimated = {
      position: vecLinearAdd(0.5, ests, 0.5, estt),
      error: Math.sqrt(vecDot(errvec, errvec)),
      projectorDepth: s*Math.sqrt(aa),
      cameraDepth: t*Math.sqrt(cc)
    }
  })
}
function calcCamera(points, option){
  var initial = option.initial
  if(!initial){
    initial = [0,0,0,0,0,0,0,0].map(function(){
      return 0.1*(2*Math.random()-1)
    })
  }
  return fastSolve(cost, initial, option.loop)
  function cost(args){
    args = new ArgsSlicer(args)
    var projector = {L: 1+Math.pow(args.slice(),2), Y: args.slice()}
    var camera = {
      L: 1+Math.pow(args.slice(),2),
      position: {
        x: 1,
        y: args.slice(),
        z: args.slice()
      },
      rotation: args.slice(['x','y','z'])
    }
    var costs = 0
    if(option.projL||option.projL===0){
      costs+=Math.pow(projector.L-option.projL,2)
    }
    if(option.projY||option.projY===0){
      costs+=Math.pow(projector.L-option.projY,2)
    }
    if(option.camL||option.camL===0){
      costs+=Math.pow(camera.L-option.camL,2)
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
      var cross = vecCross(b,c)
      var dot= vecDot(cross, a)
      costs += dot*dot
    })
    return costs;
  }
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


function invFill(map, loop){
  var W=map.length
  var H=map[0].length
  var arr=[]
  var mask=[]
  for(var x=0;x<W;x++){
    arr[x]=[];mask[x]=[]
    for(var y=0;y<H;y++)arr[x][y]=mask[x][y]=0
  }
  map.forEach(function(line){line.forEach(function(p){
    if(!p)return
    var x=Math.round(W*p.projector.x/2+W/2)
    var y=Math.round(W*p.projector.y/2+H/2)
    if(!arr[x]||arr[x][y]===undefined)return
    mask[x][y]=arr[x][y]=p.estimated.projectorDepth
  })})
  for(var i=0;i<loop;i++){
    for(var x=0;x<W;x++)for(var y=0;y<H;y++){
      var coef1=0, coef2=0
      if(x==0||y==0||x==W-1||y==H-1){
        if(x==0){
          arr[x][y]=arr[x+1][y]
        }else if(x==W-1){
          arr[x][y]=arr[x-1][y]
        }else if(y==0){
          arr[x][y]=arr[x][y+1]
        }else if(y==H-1){
          arr[x][y]=arr[x][y-1]
        }
        continue
      }
      coef2=16
      coef1=-8*(arr[x-1][y]+arr[x+1][y]+arr[x][y-1]+arr[x][y+1])
      if(mask[x][y]){
        var k=i<loop/2?100:10
        coef2+=k
        coef1+=-2*k*mask[x][y]
      }
      arr[x][y]=-coef1/coef2/2
    }
  }
  return arr
}


try{
  module.exports = {
    calcCamera: calcCamera,
    invFill: invFill,
    calcDepth: calcDepth,
    vecLinearAdd: vecLinearAdd,
    eulerRot: eulerRot
  }
}catch(e){}
