function Var(min,max){
  this.min = min;
  this.max = max;
}
Var.prototype = {
  dup: function(){
    return new Var(this.min,this.max);
  },
  scale: function(scale){
    if(scale>0){
      return new Var(this.min*scale,this.max*scale);
    }else{
      return new Var(this.max*scale,this.min*scale);
    }
  },
  add: function(m){
    if(typeof(m)=='number'){
      return new Var(this.min+m,this.max+m);
    }else{
      return new Var(this.min+m.min,this.max+m.max);
    }
  },
  sub: function(m){
    if(typeof(m)=='number')return this.add(-m);
    return this.add(m.scale(-1));
  },
  mult: function(m){
    if(typeof(m)=='number')return this.scale(m);
    var vals=[this.min*m.min,this.max*m.max,this.min*m.min,this.max*m.max,this.min*m.max,this.max*m.min];
    return new Var(
      Math.min.apply(null,vals),
      Math.max.apply(null,vals)
    )
  },
  sin: function(){
    var l=this.max-this.min;
    if(l>2*Math.PI)return new Var(-1,1);
    var i1=Math.floor((this.min-Math.PI/2)/Math.PI);
    var i2=Math.floor((this.max-Math.PI/2)/Math.PI);
    var vals=[Math.sin(this.min),Math.sin(this.max)];
    if(i1==i2){
      vals.sort();
    }else{
      vals.push(Math.sin(i2*Math.PI+Math.PI/2));
      vals.sort();
    }
    return new Var(vals[0],vals[vals.length-1]);
  },
  cos: function(){
    var l=this.max-this.min;
    if(l>2*Math.PI)return new Var(-1,1);
    var i1=Math.floor(this.min/Math.PI);
    var i2=Math.floor(this.max/Math.PI);
    var vals=[Math.cos(this.min),Math.cos(this.max)];
    if(i1==i2){
      vals.sort();
    }else{
      vals.push(Math.cos(i2*Math.PI));
      vals.sort();
    }
    return new Var(vals[0],vals[vals.length-1]);
  },
  exp: function(){
    return new Var(Math.exp(this.min),Math.exp(this.max));
  },
  pow: function(n){
    if(n%2==1){
      return new Var(Math.pow(this.min,n),Math.pow(this.max,n));
    }else{
      if(this.min<0&&this.max>0){
        return new Var(0,Math.pow(Math.max(-this.min,this.max),n));
      }else{
        var a=Math.abs(this.min);
        var b=Math.abs(this.max);
        return new Var(Math.pow(a<b?a:b,n),Math.pow(a<b?b:a,n));
      }
    }
  },
}
var Solver={
  const: function(val){return new Var(val,val);},
  split: function(range,f){
    var size=1<<range.length;
    var outs=[];
    for(var i=0;i<size;i++){
      var r=[];
      for(var j=0;j<range.length;j++){
        var min=range[j].min,max=range[j].max;
        var c=(min+max)/2;
        if((i>>j)&1){
          r.push(new Var(min,c));
        }else{
          r.push(new Var(c,max));
        }
      }
      outs.push(r);
    }
    if(f)outs.forEach(function(r){f(r)});
    return outs;
  },
  minimize: function(range,func){
    var range=range.map(function(a){return new Var(a[0],a[1])});
    var exp = func(range);
    var hoges=[range];
    for(var i=0;i<10;i++){
      var tmps=[];
      hoges.forEach(function(range){
        Solver.split(range, function(subrange){
          tmps.push({range:subrange,exp:func(subrange)})
        })
      })
      tmps.sort(function(a,b){
        return a.exp.min<b.exp.min?-1:+1;
      })
      var max=tmps[0].exp.max;
      hoges = tmps.filter(function(tmp){
        return tmp.exp.min<=max
      }).map(function(tmp){
        return tmp.range
      });
      console.log(hoges.length, tmps[0].exp.min,max);
      if(hoges.length>2048){
        hoges = hoges.slice(0,2048);
      }
    }
    return hoges[0].map(function(v){
      return (v.min+v.max)/2
    });
  }
}

try{
  module.exports=Solver;
}catch(e){}
(function(){
  // Solver=require('./solver.js')
  out=Solver.minimize([[-1,1],[-1,1],[-1,1],[-1,1],[-1,1]],function(vars){
    var x=vars[0],y=vars[1],z=vars[2],u=vars[3],v=vars[4];
    x=x.add(0.6);
    y=y.add(0.3);
    z=z.add(-0.5);
    u=u.add(0.2);
    v=v.add(-0.4);
    xx=x.pow(2).scale(0.1);
    yy=y.pow(2).scale(0.2);
    zz=z.pow(2).scale(1.2);
    uu=u.pow(2).scale(0.5);
    vv=v.pow(2).scale(2.4);
    sum=xx.add(yy).add(zz).add(uu).add(vv)
    exp=sum.scale(-1).exp().scale(-1);
    return exp;
  });
  console.log(out)

})