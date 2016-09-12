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
  var prevs=[];
  this.update=function(axis,level,flip,calc){
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
    prevs.push({flip:flip,data:data});

    if(calc){
      for(var x=0;x<canvas.width;x++)for(var y=0;y<canvas.height;y++){
        var sums={true:0,false:0};
        prevs.forEach(function(e){
          sums[e.flip]+=e.data.get(x,y)
        })
        if(sums.true+0xff/16<sums.false)codes12[0][x][y]|=1<<level;
        if(sums.false+0xff/16<sums.true)codes12[1][x][y]|=1<<level;
      }
      prevs=[];
    }
  }
  var queue=[];
  for(var i=0;i<wlevel;i++){
    queue.push(['x',i,false]);
    queue.push(['x',i,true]);
    queue.push(['x',i,false]);
    queue.push(['x',i,true,true]);
  }
  for(var i=0;i<hlevel;i++){
    queue.push(['y',i,false]);
    queue.push(['y',i,true]);
    queue.push(['y',i,false]);
    queue.push(['y',i,true,true]);
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
  this.mapping=function(){
    var map=[];
    var camL=2;
    var projL=2;
    for(var x=0;x<canvas.width;x++)for(var y=0;y<canvas.height;y++){
      var x1=invcode(xcode1[x][y]),x2=invcode(((1<<wlevel)-1)^xcode2[x][y])
      var y1=invcode(ycode1[x][y]),y2=invcode(((1<<hlevel)-1)^ycode2[x][y])
      if((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)>64){continue;}
      var xx=(x1+x2)/2,yy=(y1+y2)/2;
      var cam={
        x:(x-canvas.width/2)/canvas.width,
        y:(y-canvas.height/2)/canvas.width
      }
      var proj={
        x:(xx-canvas.width/2)/canvas.width,
        y:(yy-canvas.height/2)/canvas.width
      }
      var vec1={x:proj.x,y:proj.y-3/8,z:projL};
      var vec2={x:cam.x,y:cam.y,z:camL};
      var th=30*Math.PI/180;
      vec2={
        x:vec2.x*Math.cos(th)-vec2.z*Math.sin(th),
        y:vec2.y,
        z:vec2.z*Math.cos(th)+vec2.x*Math.sin(th)
      }

      var cpos={x:1,y:0,z:0};
      var a=Vector.dot(vec1,vec1);
      var b=-Vector.dot(vec1,vec2);
      var c=-Vector.dot(vec1,vec2);
      var d=Vector.dot(vec2,vec2);
      var p=Vector.dot(vec1,cpos);
      var q=-Vector.dot(vec2,cpos);
      var D=a*d-b*c;
      var pdepth=(p*d-b*q)/D
      var cdepth=(a*q-p*c)/D
      if(!map[x])map[x]=[]
      map[x][y]={
        camera: cam,
        projector: proj,
        depth: pdepth,
        cameraDepth: cdepth
      };
      // (v1*x+v2*y-cpos)2d=0
      // v1*v1*xx+v2*v2*yy+cpos*cpos -2v1v2xy-2v1cposx+v2cposy=0
      // v1v1x-v1v2y=v1cpos
      // -v1v2x+v2v2y=-v2cposy
    }
    return map;
  }
  this.smoothdepth=function(){
    if(this.smoothdepthmap)return this.smoothdepthmap;
    var map=this.mapping();
    var smoothed=[];
    var width=canvas.width,height=canvas.height;
    for(var x=0;x<width;x++)if(!smoothed[x])smoothed[x]=[];
    for(var x=0;x<width;x++)for(var y=0;y<height;y++){
      if(!map[x]||!map[x][y])continue;
      var m=map[x][y];
      var R=4;
      var px=Math.round(m.projector.x*width+width/2),py=Math.round(m.projector.y*width+height/2);
      for(var ix=-R;ix<=R;ix++)for(var iy=-R;iy<=R;iy++){
        var xx=px+ix,yy=py+iy;
        if(xx<0||yy<0||xx>=width||yy>=height)continue;
        var w=1-(ix*ix+iy*iy)/(R+1)/(R+1);
        if(w<0)continue;
        w*=w;
        if(!smoothed[xx][yy])smoothed[xx][yy]={w:0,s:0};
        smoothed[xx][yy].w+=w;
        smoothed[xx][yy].s+=w*m.depth;
      }
    }
    for(var x=0;x<width;x++)for(var y=0;y<height;y++){
      var s=smoothed[x][y];
      if(s){
        smoothed[x][y]=s.s/s.w;
      }
    }
    return this.smoothdepthmap=smoothed;
  }
  this.show=function(){
    var g=canvas.context;
    var canvas2=createCanvas(canvas.width,canvas.height);
    var g2=canvas2.context;g2.drawImage(canvas,0,1)
    for(var x=0;x<canvas.width;x++)for(var y=0;y<canvas.height;y++){
      var x1=invcode(xcode1[x][y]),x2=invcode(((1<<wlevel)-1)^xcode2[x][y])
      var y1=invcode(ycode1[x][y]),y2=invcode(((1<<hlevel)-1)^ycode2[x][y])
      if((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)>64){continue;}
      var xx=(x1+x2)/2,yy=(y1+y2)/2;
      g.fillStyle='rgb('+Math.round(0xff*xx/canvas.width)+','+Math.round(0xff*yy/canvas.height)+','+0xff+')';
      g.fillRect(x,y,1,1)
      var color=1-Math.pow(Math.max((Math.cos(xx/2)+1)/2,(Math.cos(yy/2)+1)/2),10)
      var cff=Math.round(0xff*color);
      g2.fillStyle='rgb('+cff+','+cff+','+cff+')';
      g2.fillRect(x,y,1,1)
    }
    canvas2.style.width=canvas2.style.height='100%'
    document.body.appendChild(canvas);
    document.body.appendChild(canvas2);

    var canvas3=createCanvas(canvas.width,canvas.height);
    var g3=canvas3.getContext('2d');
    var map=this.mapping();
    var depthmin,depthmax;
    var count=0;
    for(var x=0;x<canvas.width;x++)for(var y=0;y<canvas.height;y++){
      var m=map[x]&&map[x][y];
      if(!m)continue;
      if(!depthmin||m.depth<depthmin)depthmin=m.depth;
      if(!depthmax||depthmax<m.depth)depthmax=m.depth;
      count++;
    }
    console.error(depthmin,depthmax,count);
    var smoothed=this.smoothdepth();
    for(var x=0;x<canvas.width;x++)for(var y=0;y<canvas.height;y++){
      var depth=smoothed[x][y]
      if(!depth)continue;
      var r=Math.round(0xff*(depth-depthmin)/(depthmax-depthmin));
      var r=Math.round(0xff*(Math.cos(Math.PI*1/3+64*depth)+1)/2).toString(16);
      var g=Math.round(0xff*(Math.cos(Math.PI*3/3+64*depth)+1)/2).toString(16);
      var b=Math.round(0xff*(Math.cos(Math.PI*5/3+64*depth)+1)/2).toString(16);
      if(r.length==1)r='0'+r;
      if(g.length==1)g='0'+g;
      if(b.length==1)b='0'+b;
      g3.fillStyle='#'+r+g+b;
      g3.fillRect(x,y,1,1);
    }
    canvas3.style.width=canvas3.style.height='100%'
    document.body.appendChild(canvas3);
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
  var time=new Date();
  this.renderProjMap=function(){
    var func;
    var depth=this.smoothdepth();
    var t=(new Date()-time)/1000;
    if(mouse.x<-0.95){
      this.reverseRenderCam();
      return;
    }
    if(mouse.x>0.95){
      func=function(x,y){
        var d=depth[x][y];
        return [
          (Math.cos(128*d+Math.PI*0/3)+1)/2,
          (Math.cos(128*d+Math.PI*2/3)+1)/2,
          (Math.cos(128*d+Math.PI*4/3)+1)/2
        ]
      }
    }else{
      var mr=Math.sqrt(1+mouse.x*mouse.x+mouse.y*mouse.y);
      func=function(x,y){
        if(x==0||y==0||x>=canvas.width-1||y>=canvas.height-1)return;
        var dx=depth[x+1][y]-depth[x-1][y];
        var dy=depth[x][y+1]-depth[x][y-1];
        var dz=0.0001;
        var dr=Math.sqrt(dx*dx+dy*dy+dz*dz);
        var dot=(dx*mouse.x+dy*mouse.y+dz)/dr/mr;
        dot=dot+Math.sin(t+128*depth[x][y])/2;
        return [(Math.sin(3*dot+1)+1)/2,(Math.sin(5*dot+2)+1)/2,(Math.sin(7*dot+3)+1)/2];
      }
    }
    var cdata=output.context.getImageData(0,0,canvas.width,canvas.height);
    for(var x=0;x<canvas.width;x++)for(var y=0;y<canvas.height;y++){
      var col=func(x,y);
      var index=4*(y*canvas.width+x);
      if(col){
        cdata.data[index+0]=(col[0]||col.r)*0xff;
        cdata.data[index+1]=(col[1]||col.g)*0xff;
        cdata.data[index+2]=(col[2]||col.b)*0xff;
        cdata.data[index+3]=0xff;
      }else{
        for(var i=0;i<4;i++)cdata.data[index+i]=0;
      }
    }
    output.context.putImageData(cdata,0,0);
  }
}



function videoStart(){
  navigator.webkitGetUserMedia({audio:true, video:true}, function(localMediaStream) {
    var video = document.createElement('video');
    video.src = URL.createObjectURL(localMediaStream);
    video.volume=0;
    video.play();
    window.video=video;
    window.capture=function(canvas){
      canvas.context.drawImage(video,0,0,canvas.width,canvas.height);
      return canvas;
    }
    calibrateStart();
  }, function(){
    console.error(arguments);
  });
}



var calibrator;
onload=function(){videoStart();}
var interval=250;
function calibrateStart(){
  var canvas=createCanvas(640,480);
  window.canvas=canvas
  var output=createCanvas(640,480);
  output.style.width=output.style.height='100%'
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
    setTimeout(update,interval);
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
      canvas2.style.width=canvas2.style.height='100%'
      document.body.appendChild(canvas2);
    },1000)
    setInterval(function(){
      // calibrator.reverseRenderCam();
      calibrator.renderProjMap();
    },8)
  }
  window.mouse={x:0,y:0};
  document.body.onmousemove=function(e){
    window.mouse.x=2*e.pageX/innerWidth-1
    window.mouse.y=2*e.pageY/innerHeight-1
  }
  document.body.onclick=function(){
    setTimeout(render,interval);
    document.body.onclick=null;
  }
}
var Vector={
  dot: function(a,b){
    return a.x*b.x+a.y*b.y+a.z*b.z;
  }
}