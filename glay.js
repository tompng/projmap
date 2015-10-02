<script>


function invcode_precalc(max){
  invcode.map=[];
  for(var i=0;i<=max;i++){
    invcode.map[code(i)]=i;
  }
}
function arr2D(w,h,v){
  var arr=[];
  for(var x=0;x<w;x++){
    arr[x]=[];
    for(var y=0;y<h;y++)arr[x][y]=v;
  }
  return arr;
}
function invcode(i){return invcode.map[i]}
function code(i){return i^(i>>1)}
invcode_precalc(8192);

function maxLevel(size){
  var maxlevel=0;
  while(1<<maxlevel<size)maxlevel++;
  return maxlevel;
}
function genCode(size,level){
  var out=[];
  for(var i=0;i<size;i++)out[i]=(code(i)>>level)&1
  return out;
}
function createCanvas(width,height){
  var canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  var g=canvas.context=canvas.getContext('2d');
  g.fillStyle='black';
  g.fillRect(0,0,width,height);
  return canvas;
}

function genCodeImage(width,height,axis,level,flip){
  var canvas=createCanvas(width,height);
  var g=canvas.context;
  g.fillStyle='white'
  if(axis=='x'){
    var code=genCode(width,level);
    for(var i=0;i<width;i++){
      if(code[i]^flip)g.fillRect(i,0,1,height);
    }
  }if(axis=='y'){
    var code=genCode(height,level);
    for(var i=0;i<height;i++){
      if(code[i]^flip)g.fillRect(0,i,width,1);
    }
  }
  return canvas;
}



function Calibrator(canvas,output){
  var wlevel=maxLevel(output.width);
  var hlevel=maxLevel(output.height);
  var xcode1=arr2D(canvas.width,canvas.height,0);
  var ycode1=arr2D(canvas.width,canvas.height,0);
  var xcode2=arr2D(canvas.width,canvas.height,0);
  var ycode2=arr2D(canvas.width,canvas.height,0);
  this.render=function(axis,level,flip){
    var cimg=genCodeImage(output.width,output.height,axis,level,flip);
    output.context.drawImage(cimg,0,0);
  }
  this.update=function(axis,level,flip){
    capture(canvas);
    var codes12=(axis=='x'?[xcode1,xcode2]:[ycode1,ycode2])
    var data=canvas.context.getImageData(0,0,canvas.width,canvas.height);
    var wsize=Math.floor(data.data.length/canvas.height);
    var csize=Math.floor(wsize/canvas.width)
    data.get=function(x,y){
      var val=0,index=y*wsize+csize*x;
      var r=data.data[index];
      var g=data.data[index+1];
      var b=data.data[index+2];
      return (r+g+b)/3;
    }
    if(flip){
      for(var x=0;x<canvas.width;x++)for(var y=0;y<canvas.height;y++){
        if(data.get(x,y)+0xff/8<prev.get(x,y))codes12[0][x][y]|=1<<level;
        if(data.get(x,y)>0xff/8+prev.get(x,y))codes12[1][x][y]|=1<<level;
      }
    }else{
      prev=data;
    }
  }
  var queue=[];
  for(var i=0;i<wlevel;i++){
    queue.push(['x',i,false]);
    queue.push(['x',i,true]);
  }
  for(var i=0;i<hlevel;i++){
    queue.push(['y',i,false]);
    queue.push(['y',i,true]);
  }

  this.queue=queue;
  var vcanvas;
  this.reverseRenderCam = function(){
    if(!vcanvas){
      vcanvas=createCanvas(canvas.width,canvas.height);
    }

    capture(vcanvas);
    var vdata=vcanvas.context.getImageData(0,0,canvas.width,canvas.height);
    var cdata=output.context.getImageData(0,0,canvas.width,canvas.height);
    for(var x=0;x<canvas.width;x++)for(var y=0;y<canvas.height;y++){
      var px=proj.x[x][y];
      var py=proj.y[x][y];
      for(var i=0;i<4;i++)cdata.data[4*(y*canvas.width+x)+i]=vdata.data[4*((py|0)*canvas.width+(px|0))+i];
      if(!proj.w[x][y]){
        for(var i=0;i<4;i++)cdata.data[4*(y*canvas.width+x)+i]=0;
      }
    }
    output.context.putImageData(cdata,0,0);
  }
  this.show=function(){
    var g=canvas.context;
    var canvas2=createCanvas(canvas.width,canvas.height);
    var g2=canvas2.context;g2.drawImage(canvas,0,1)
    for(var x=0;x<canvas.width;x++)for(var y=0;y<canvas.height;y++){
      var x1=invcode(xcode1[x][y]),x2=invcode(((1<<wlevel)-1)^xcode2[x][y])
      var y1=invcode(ycode1[x][y]),y2=invcode(((1<<hlevel)-1)^ycode2[x][y])
      if((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)>64)continue;
      var xx=(x1+x2)/2,yy=(y1+y2)/2;

      g.fillStyle='rgb('+Math.round(0xff*xx/canvas.width)+','+Math.round(0xff*yy/canvas.height)+','+0xff+')';
      g.fillRect(x,y,1,1)
      var color=1-Math.pow(Math.max((Math.cos(xx/2)+1)/2,(Math.cos(yy/2)+1)/2),10)
      var cff=Math.round(0xff*color);
      g2.fillStyle='rgb('+cff+','+cff+','+cff+')';
      g2.fillRect(x,y,1,1)
    }
    document.body.appendChild(canvas);
    document.body.appendChild(canvas2);
  }

  this.genInv=function(){
    var coord={
      x:arr2D(canvas.width,canvas.height,NaN),
      y:arr2D(canvas.width,canvas.height,NaN)
    };
    var proj={
      w:arr2D(output.width,output.height,0),
      x:arr2D(output.width,output.height,0),
      y:arr2D(output.width,output.height,0)
    }
    var tmp={
      x:arr2D(output.width,output.height,0),
      y:arr2D(output.width,output.height,0)
    }
    window.proj = proj;
    for(var x=0;x<canvas.width;x++)for(var y=0;y<canvas.height;y++){
      var x1=invcode(xcode1[x][y]),x2=invcode(((1<<wlevel)-1)^xcode2[x][y])
      var y1=invcode(ycode1[x][y]),y2=invcode(((1<<hlevel)-1)^ycode2[x][y])
      if((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)>64)continue;
      coord.x[x][y]=(x1+x2)/2;
      coord.y[x][y]=(y1+y2)/2;
    }
    function triangle(px1,py1,px2,py2,px3,py3){
      var cx1=coord.x[px1][py1],cy1=coord.y[px1][py1];
      var cx2=coord.x[px2][py2],cy2=coord.y[px2][py2];
      var cx3=coord.x[px3][py3],cy3=coord.y[px3][py3];
      var minx=Math.min(cx1,cx2,cx3);if(minx<0)minx=0
      var miny=Math.min(cy1,cy2,cy3);if(miny<0)miny=0;
      var maxx=Math.max(cx1,cx2,cx3);if(maxx>=output.width)maxx=output.width;
      var maxy=Math.max(cy1,cy2,cy3);if(maxy>=output.height)maxy=output.height;
      var dx2=cx2-cx1,dy2=cy2-cy1,dx3=cx3-cx1,dy3=cy3-cy1;
      for(var x=Math.floor(minx);x<maxx;x++)for(var y=Math.floor(miny);y<maxy;y++){
        var cx=x-cx1,cy=y-cy1;
        var cx=x-cx1,cy=y-cy1;
        var dd=dx2*dy3-dx3*dy2;
        s=(cx*dy3-cy*dx3)/dd;
        t=(cy*dx2-cx*dy2)/dd;
        if(0<=s&&0<=t&&s+t<=1){
          proj.w[x][y]=1;
          proj.x[x][y]=px1+(px2-px1)*s+(px3-px1)*t;
          proj.y[x][y]=py1+(py2-py1)*s+(py3-py1)*t;
        }
      }
    }
    function smooth(){
      for(var x=1;x<output.width-1;x++)for(var y=1;y<canvas.height-1;y++){
        tmp.x[x][y]=proj.x[x][y];
        tmp.y[x][y]=proj.y[x][y];
        if(!proj.w[x][y])continue;
        var wsum=proj.w[x-1][y]+proj.w[x+1][y]+proj.w[x][y-1]+proj.w[x][y+1]
        if(!wsum)continue;
        var sumx=(proj.x[x-1][y]*proj.w[x-1][y]+proj.x[x+1][y]*proj.w[x+1][y]+
                  proj.x[x][y-1]*proj.w[x][y-1]+proj.x[x][y+1]*proj.w[x][y+1])/wsum;
        var sumy=(proj.y[x-1][y]*proj.w[x-1][y]+proj.y[x+1][y]*proj.w[x+1][y]+
                  proj.y[x][y-1]*proj.w[x][y-1]+proj.y[x][y+1]*proj.w[x][y+1])/wsum;
        tmp.x[x][y]=proj.x[x][y]*0.5+0.5*sumx;
        tmp.y[x][y]=proj.y[x][y]*0.5+0.5*sumy;
      }
      for(var x=1;x<output.width-1;x++)for(var y=1;y<canvas.height-1;y++){
        proj.x[x][y]=tmp.x[x][y];
        proj.y[x][y]=tmp.y[x][y];
      }
    }
    for(var x=0;x<canvas.width-1;x++)for(var y=0;y<canvas.height-1;y++){
      if(isNaN(coord.x[x][y])||isNaN(coord.x[x+1][y+1]))continue;
      if(!isNaN(coord.x[x+1][y]))triangle(x,y,x+1,y,x+1,y+1);
      if(!isNaN(coord.x[x][y+1]))triangle(x,y,x+1,y+1,x,y+1);
    }
    for(var i=0;i<10;i++)smooth();
    var og=output.context;
    og.clearRect(0,0,output.width,output.height);
    for(var x=0;x<output.width;x++)for(var y=0;y<output.height;y++){
      if(!proj.w[x][y])continue;
      var px=proj.x[x][y];
      var py=proj.y[x][y];
      var color=1-Math.pow(Math.max((Math.cos(px)+1)/2,(Math.cos(py)+1)/2),10)
      var cff=Math.round(0xff*color);
      og.fillStyle='rgb('+cff+','+cff+','+cff+')';
      og.fillRect(x,y,1,1);
    }
  }
}



function videoStart(){
  navigator.webkitGetUserMedia({audio:true, video:true}, function(localMediaStream) {
    var video = document.createElement('video');
    video.src = window.webkitURL.createObjectURL(localMediaStream);
    video.play();
    window.video=video;
    window.capture=function(canvas){
      canvas.context.drawImage(video,0,0,canvas.width,canvas.height);
      return canvas;
    }
    calibrateStart();
  }, function(){
    console.log(arguments);
  });
}



var calibrator;
onload=function(){videoStart();}
function calibrateStart(){
  var canvas=createCanvas(640,480);
  window.canvas=canvas
  var output=createCanvas(640,480);
  window.output=output;
  output.style.width=innerWidth;
  output.style.height=innerHeight;
  calibrator=new Calibrator(canvas,output);
  document.body.appendChild(output)
  document.body.appendChild(canvas);
  document.body.appendChild(video);
  function render(){
    if(!calibrator.queue[0]){
      done();
      return;
    }
    calibrator.render.apply(calibrator,calibrator.queue[0]);
    setTimeout(update,500);
  }
  function update(){
    calibrator.update.apply(calibrator,calibrator.queue[0]);
    calibrator.queue.shift();
    render();
  }
  function done(){
    calibrator.show();
    calibrator.genInv();
    setTimeout(function(){
      var canvas2=createCanvas(640,480);
      canvas2.context.drawImage(video,0,0);
      document.body.appendChild(canvas2);
    },1000)
    setInterval(function(){
      calibrator.reverseRenderCam();
    },8)
  }
  document.body.onclick=function(){
    setTimeout(render,500);
    document.body.onclick=null;
  }
}

</script>
<body bgcolor=black style='margin:0;padding:0'>