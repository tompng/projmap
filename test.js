Solver=require('./range_solver.js');
points=[];
var projectorL=2;
for(var i=0;i<40;i++){
  var x=Math.random();
  var y=Math.random();
  var z=2+Math.random();
  points.push({x:x,y:y,z:z});
}
var PTH1=0.2
var PTH2=0.3
var cameraPos={x:0.64,y:0.6,z:0.48};
cameraPos.x=Math.cos(PTH1)*Math.cos(PTH2);
cameraPos.y=Math.sin(PTH1)*Math.cos(PTH2);
cameraPos.z=Math.sin(PTH2);
function rand(x){return (x==undefined?1:x)*(2*Math.random()-1)}
var data = points.map(function(p){
  var cameraL=1
  var cam={
    x:p.x-cameraPos.x+rand(0.001),
    y:p.y-cameraPos.y+rand(0.001),
    z:p.z-cameraPos.z+rand(0.001)
  }
  return {
    projector:{
      x:p.x/p.z*projectorL,
      y:p.y/p.z*projectorL
    },
    camera:{
      x:cam.x/cam.z*cameraL,
      y:cam.y/cam.z*cameraL
    },
    point: p
  }
})

var out=Solver.minimize([[-1,1],[-1,1]], func=function(vars){
  var i=0;
  var projL=Solver.const(2);
  var camL=Solver.const(1)
  var pth1=vars[i++],pth2=vars[i++];
  var P=[pth1.cos().mult(pth2.cos()),pth1.sin().mult(pth2.cos()),pth2.sin()]
  var sum=Solver.const(0);
  var vecs = data.map(function(e){
    var c=[e.camera.x,e.camera.y,camL];
    var Q=[Solver.const(e.camera.x),Solver.const(e.camera.y),camL];
    var R=[e.projector.x,e.projector.y,projL];
    var QxR=[
      Q[1].mult(R[2]).sub(Q[2].mult(R[1])),
      Q[2].mult(R[0]).sub(Q[0].mult(R[2])),
      Q[0].mult(R[1]).sub(Q[1].mult(R[0]))
    ];
    var dot=QxR[0].mult(P[0]).add(QxR[1].mult(P[1])).add(QxR[2].mult(P[2]))
    sum=sum.add(dot.mult(dot));
    // return QxR;
  });
  return sum;
  var matrix=[[],[],[]];
  for(var i=0;i<3;i++)for(var j=0;j<3;j++){
    var sum=Solver.const(0);
    vecs.forEach(function(u){vecs.forEach(function(v){
      sum=sum.add(u[i].mult(v[i]));
    })})
    matrix[i][j]=sum;
  }



  return matrix[0][0].mult(matrix[1][1]).mult(matrix[2][2]).add(
         matrix[1][0].mult(matrix[2][1]).mult(matrix[0][2])).add(
         matrix[2][0].mult(matrix[0][1]).mult(matrix[1][2])).sub(
         matrix[0][0].mult(matrix[1][2]).mult(matrix[2][1])).sub(
         matrix[1][0].mult(matrix[2][2]).mult(matrix[0][1])).sub(
         matrix[2][0].mult(matrix[0][2]).mult(matrix[1][1]));

});

var i=0;
var projL=out[i++];
var camL=out[i++];
var pth1=out[i++];
var pth2=out[i++]
console.log('aa');
console.log(2, 1, 0.2, 0.3);
console.log(projL,camL,pth1,pth2);

