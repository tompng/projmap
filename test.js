Solver=require('./range_solver.js');
points=[];
var projectorL=2;
for(var i=0;i<20;i++){
  var x=Math.random();
  var y=Math.random();
  var z=2+Math.random();
  points.push({x:x,y:y,z:z});
}
var PTH1=0.2
var PTH2=0.3
var CAMRA=0.1
var CAMRB=0.3
var CAMRC=0.5
var cameraPos={x:0.64,y:0.6,z:0.48};
cameraPos.x=Math.cos(PTH1)*Math.cos(PTH2);
cameraPos.y=Math.sin(PTH1)*Math.cos(PTH2);
cameraPos.z=Math.sin(PTH2);
var data = points.map(function(p){
  var cameraL=1
  var cam={
    x:p.x-cameraPos.x,
    y:p.y-cameraPos.y,
    z:p.z-cameraPos.z
  }
  cam={
    x:cam.x*Math.cos(CAMRA)+cam.y*Math.sin(CAMRA),
    y:-cam.x*Math.sin(CAMRA)+cam.y*Math.cos(CAMRA),
    z:cam.z
  }
  cam={
    x:cam.x*Math.cos(CAMRB)+cam.z*Math.sin(CAMRB),
    y:cam.y,
    z:-cam.x*Math.sin(CAMRB)+cam.z*Math.cos(CAMRB)
  }
  cam={
    x:cam.x,
    y:cam.y*Math.cos(CAMRC)+cam.z*Math.sin(CAMRC),
    z:-cam.y*Math.sin(CAMRC)+cam.z*Math.cos(CAMRC)
  }
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
var ini=[0.2,0.31,0.1,0.1,0];
var out=Solver.minimize([[0.15,0.25],[0.25,0.35],[-0.25,-0.15],[-0.25,-0.15],[-0.6,-0.5]], func=function(vars){
  var i=0;
  var projL=Solver.const(2);
  var camL=Solver.const(1);
  var pth1=vars[i++],pth2=vars[i++];
  var P=[pth1.cos().mult(pth2.cos()),pth1.sin().mult(pth2.cos()),pth2.sin()]
  var sum=Solver.const(0);
  var camA=vars[i++];
  var camB=vars[i++];
  var camC=vars[i++];
  data.forEach(function(e){
    var c=[e.camera.x,e.camera.y,camL];
    var Q=[Solver.const(e.camera.x),Solver.const(e.camera.y),camL];

    Q=[
      Q[0].mult(camA.cos()).add(Q[1].mult(camA.sin())),
      Q[1].mult(camA.cos()).sub(Q[0].mult(camA.sin())),
      Q[2]
    ]
    Q=[
      Q[0].mult(camB.cos()).add(Q[2].mult(camB.sin())),
      Q[1],
      Q[2].mult(camB.cos()).sub(Q[0].mult(camB.sin()))
    ]
    Q=[
      Q[0],
      Q[1].mult(camC.cos()).add(Q[2].mult(camC.sin())),
      Q[2].mult(camC.cos()).sub(Q[1].mult(camC.sin()))
    ]

    var R=[e.projector.x,e.projector.y,projL];
    var QxR=[
      Q[1].mult(R[2]).sub(Q[2].mult(R[1])),
      Q[2].mult(R[0]).sub(Q[0].mult(R[2])),
      Q[0].mult(R[1]).sub(Q[1].mult(R[0]))
    ];
    var QxR_P=QxR[0].mult(P[0]).add(QxR[1].mult(P[1])).add(QxR[2].mult(P[2]));
    var QxR2=QxR[0].mult(QxR[0]).add(QxR[1].mult(QxR[1])).add(QxR[2].mult(QxR[2]));
    sum=sum.add(QxR_P.mult(QxR_P));
  })
  return sum;
});

var i=0;
var projL=2;
var camL=1;
var pth1=out[i++];
var pth2=out[i++]
camA=out[i++];
camB=out[i++];
camC=out[i++];
console.log('aa');
console.log(2, 1, 0.2, 0.3, -0.23599, -0.21176, -0.54032);
console.log(projL,camL,pth1,pth2,camA,camB,camC);

