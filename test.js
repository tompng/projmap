Solver=require('./solver.js');
points=[];
var projectorL=2;
for(var i=0;i<20;i++){
  var x=Math.random();
  var y=Math.random();
  var z=2+Math.random();
  points.push({x:x,y:y,z:z});
}
var cameraPos={x:0.64,y:0.6,z:0.48};
var data = points.map(function(p){
  var cameraL=1
  var cam={
    x:p.x-cameraPos.x,
    y:p.y-cameraPos.y,
    z:p.z-cameraPos.z
  }
  // cam={
  //   x:cam.x*Math.cos(0.2)+cam.y*Math.sin(0.2),
  //   y:-cam.x*Math.sin(0.2)+cam.y*Math.cos(0.2),
  //   z:cam.z
  // }
  // cam={
  //   x:cam.x*Math.cos(0.3)+cam.z*Math.sin(0.3),
  //   y:cam.y,
  //   z:-cam.x*Math.sin(0.3)+cam.z*Math.cos(0.3)
  // }
  // cam={
  //   x:cam.x,
  //   y:cam.y*Math.cos(0.1)+cam.z*Math.sin(0.1),
  //   z:-cam.y*Math.sin(0.1)+cam.z*Math.cos(0.1)
  // }
  return {
    projector:{
      x:p.x/p.z*projectorL,
      y:p.y/p.z*projectorL
    },
    camera:{
      x:cam.x/cam.z*cameraL,
      y:cam.y/cam.z*cameraL
    }
  }
})


console.log(data)
var ini=[0,0];
// ini=Solver.initials(13)
var out=Solver.minimize(ini, function(vars){
  var projL=Solver.const(2)
  var cameraL=Solver.const(1);
  var pth1=vars[0],pth2=vars[1]
  var P=[pth1.cos().mult(pth2.cos()),pth1.sin().mult(pth2.cos()),pth2.sin()]
  // var P=[Solver.const(0.64),vars[0],vars[1]];
  var sum=Solver.const(0);
  data.forEach(function(e){
    var c=[e.camera.x,e.camera.y,cameraL];
    var Q=[Solver.const(e.camera.x),Solver.const(e.camera.y),cameraL];
    var R=[e.projector.x,e.projector.y,projL];

    var QxR=[
      Q[1].mult(R[2]).sub(Q[2].mult(R[1])),
      Q[2].mult(R[0]).sub(Q[0].mult(R[2])),
      Q[0].mult(R[1]).sub(Q[1].mult(R[0]))
    ];
    var QxR_P=QxR[0].mult(P[0]).add(QxR[1].mult(P[1])).add(QxR[2].mult(P[2]));
    var QxR2=QxR[0].mult(QxR[0]).add(QxR[1].mult(QxR[1])).add(QxR[2].mult(QxR[2]));
    var P2=P[0].mult(P[0]).add(P[1].mult(P[1])).add(P[2].mult(P[2]));
    sum=sum.add(QxR_P.mult(QxR_P).div(QxR2).div(P2));
  })
  var hoge=cameraL.mult(cameraL).add(projL.mult(projL)).add(1)
  return sum.mult(hoge);
})



var p=[Math.cos(out[0])*Math.cos(out[1]),Math.sin(out[0])*Math.cos(out[1]),Math.sin(out[1])]
console.log('aa');
console.log(p);
