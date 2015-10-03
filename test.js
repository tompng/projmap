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
var ini=[1,0,0,0,1,0,0,0,1,2,0.64,0.6001,0.48];
// ini=Solver.initials(13)
var out=Solver.minimize(ini, function(vars){
  var matrix=[[vars[0],vars[1],vars[2]],
              [vars[3],vars[4],vars[5]],
              [vars[6],vars[7],vars[8]]];
  var projL=vars[9]
  var P=[vars[10],vars[11],vars[12]];
  var sum=Solver.const(0);
  data.forEach(function(e){
    var c=[e.camera.x,e.camera.y,1];
    var Q=[
      matrix[0][0].mult(c[0]).add(matrix[0][1].mult(c[1])).add(matrix[0][2].mult(c[2])),
      matrix[1][0].mult(c[0]).add(matrix[1][1].mult(c[1])).add(matrix[1][2].mult(c[2])),
      matrix[2][0].mult(c[0]).add(matrix[2][1].mult(c[1])).add(matrix[2][2].mult(c[2]))
    ];
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
  return sum;
})



var matrix=[[out[0],out[1],out[2]],
            [out[3],out[4],out[5]],
            [out[6],out[7],out[8]]];
var p=[out[10],out[11],out[12]];
pr=Math.sqrt(p[0]*p[0]+p[1]*p[1]+p[2]*p[2]);
p[0]/=pr;p[1]/=pr;p[2]/=pr;
var projL=out[9];
console.log('aa');
console.log(projL, p ,matrix)
