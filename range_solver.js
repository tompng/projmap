function Var(min,max,d){
  this.min = min;
  this.max = max;
  this.d = {};
  for(var i in d)this.d[i]=d[i];
}
Var.prototype = {
  addD: function(i,v){
    this.d[i]=(this.d[i]||0)+v;
  },
  dup: function(){
    return new Var(this.min,this.max,this.d);
  },
  recalcRange: function(){
    var dsum=0;
    for(var i in this.d)dsum+=Math.abs(this.d[i]);
    var min=this.min-dsum;
    var max=this.max-dsum;
    var range={};
    for(var i in this.d){
      var d=this.d[i];
      var r={min:0,max:1};
      if(d>0){
        r.max=Math.min(1,(max-min)/2/d);
      }else if(d<0){
        r.min=Math.max(0,1+(max-min)/2/d);
      }
      range[i]=r;
    }
    return range;
  },
  minrange: function(){
    var dsum=0;
    for(var i in this.d)dsum+=Math.abs(this.d[i]);
    return {min:this.min-dsum,max:this.max-dsum};
  },
  scale: function(scale){
    var out=this.dup();
    if(scale>0){
      out.min=this.min*scale;
      out.max=this.max*scale;
    }else{
      out.min=this.max*scale;
      out.max=this.min*scale;
    }
    for(var i in out.d)out.d[i]*=scale;
    return out;
  },
  add: function(m){
    var out=this.dup();
    if(typeof(m)=='number'){
      out.min+=m;out.max+=m;
    }else{
      out.min+=m.min;out.max+=m.max;
      for(i in m.d)out.addD(i,m.d[i])
    }
    return out;
  },
  sub: function(m){
    if(typeof(m)=='number')return this.add(-m);
    return this.add(m.scale(-1));
  },
  mult: function(m){
    if(typeof(m)=='number')return this.scale(m);
    var a=this,b=m;
    var aval=(a.min+a.max)/2,adif=(a.max-a.min)/2;
    var bval=(b.min+b.max)/2,bdif=(b.max-b.min)/2;
    //* (a.val+a.d・x+a.dif)(b.val+b.d・x+b.dif)
    var out=new Var(0,0);
    var val=0;
    var diff=0;
    //(b.val*a.d+a.val*b.d)・x
    for(var i in a.d)out.addD(i,a.d[i]*bval);
    for(var i in b.d)out.addD(i,b.d[i]*aval);

    var admax=0,bdmax=0,adsum=0,bdsum=0;
    for(var i in a.d){
      adsum+=Math.abs(a.d[i]);
      admax=Math.max(admax,Math.abs(a.d[i]));
    }
    for(var i in b.d){
      bdsum+=Math.abs(b.d[i]);
      bdmax=Math.max(bdmax,Math.abs(b.d[i]));
    }
    //(a.d・x)*b.dif+(b.d・x)*a.dif
    diff+=bdif*admax+adif*bdmax;
    //(a.val+a.dif)*(b.val+b.dif)
    var vals=[a.min*b.min,a.max*b.max,a.min*b.max,a.max*b.min];
    var valmin=Math.min.apply(null,vals);
    var valmax=Math.max.apply(null,vals);
    val+=(valmin+valmax)/2;
    diff+=(valmax-valmin)/2;
    //(a.d・x)*(b.d・x)
    for(var i in a.d){
      for(var j in b.d){
        var coef=a.d[i]*b.d[j];
        if(i==j){
          diff+=Math.abs(coef)/2;
          val+=coef/2;
        }else{
          diff+=Math.abs(coef);
        }
      }
    }

    out.min=val-diff;
    out.max=val+diff;
    return out;
  },
  sin: function(){
    var dsum=0;
    for(var i in this.d)dsum+=Math.abs(this.d[i]);
    var min=this.min-dsum,max=this.max+dsum;
    var l=max-min;
    if(l>2*Math.PI)return new Var(-1,1);
    var i1=Math.floor(this.min/Math.PI/2);
    var i2=Math.ceil(this.max/Math.PI/2);
    var minval=Math.sin(min),maxval=Math.sin(max);
    if(maxval==minval)return new Var(minval,maxval);
    var ygrad=(maxval-minval)/(max-min);
    var yconst=(minval*max-maxval*min)/(max-min);
    // sin(x)-yconst-ygrad*x;
    // cos(x)=ygrad;
    var ac=Math.acos(ygrad);
    var acvals=[];
    for(var i=i1;i<=i2;i++){
      var acplus=i*2*Math.PI+ac;
      var acminus=i*2*Math.PI-ac;
      if(min<acplus&&acplus<max)acvals.push(acplus);
      if(min<acminus&&acminus<max)acvals.push(acminus);
    }
    var difmax=0,difmin=0;
    acvals.forEach(function(x){
      var val=Math.sin(x)-yconst-ygrad*x;
      difmax=Math.max(difmax,val);
      difmin=Math.min(difmin,val);
    });
    // yconst+ygrad*x+(difmax~difmin)
    var out=this.mult(ygrad).add(yconst);
    out.min+=difmin;
    out.max+=difmax;
    return out;
  },
  cos: function(){
    return this.add(Math.PI/2).sin();
  }
}
var Solver={
  var: function(name,min,max){
    if(arguments.length==1){
      min=-1;max=1;
    }else if(arguments.length==2){
      max=min;
      min=-max;
    }
    var av=(min+max)/2;
    var v=new Var(av,av);
    v.addD(name,(max-min)/2);
    return v;
  },
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
          r.push({min:min,max:c});
        }else{
          r.push({min:c,max:max});
        }
      }
      outs.push(r);
    }
    if(f)outs.forEach(function(r){f(r)});
    return outs;
  },
  minimize: function(range,func){
    if(range[0].length)range=range.map(function(a){return {min:a[0],max:a[1]}});
    var evalrange=function(range){
      var vars=[];
      for(var i=0;i<range.length;i++){
        var r=range[i];
        var av=(r.min+r.max)/2;
        var dif=(r.max-r.min)/2;
        var v=new Var(av,av);
        v.addD(i,dif);
        vars[i]=v;
      }
      var y=func(vars);
      var rclip=y.recalcRange();
      var range2=[];
      for(var i=0;i<range.length;i++){
        var r=range[i];
        var rc=rclip[i];
        if(rc){
          range2[i]={
            min:r.min+(r.max-r.min)*rc.min,
            max:r.min+(r.max-r.min)*rc.max
          }
        }else{
          range2[i]=r;
        }
      }
      return {range: range2, exp: y.minrange()};
    }
    var exp = evalrange(range);
    var hoges=[range];
    for(var i=0;i<20;i++){
      var tmps=[];
      hoges.forEach(function(range){
        Solver.split(range, function(subrange){
          tmps.push(evalrange(subrange));
        })
      })
      tmps.sort(function(a,b){
        return a.exp.max<b.exp.max?-1:1
      })
      var max=tmps[0].exp.max;
      hoges = tmps.filter(function(tmp){
        return tmp.exp.min<=max
      }).map(function(tmp){
        return tmp.range
      });
      console.log(hoges.length,tmps.length,tmps[0].exp);
      console.log(hoges[0]);
      if(hoges.length>128){
        hoges = hoges.slice(0,128);
      }
    }
    return hoges[0].map(function(v){
      return (v.min+v.max)/2
    });
  }
}

try{
  Solver.Var=Var;
  module.exports=Solver;
}catch(e){}
(function(){
  // Solver=require('./range_solver.js')
  out=Solver.minimize([[-1,1],[-1,1],[-1,1],[-1,1],[-1,1]],function(vars){
    var x=vars[0],y=vars[1],z=vars[2],u=vars[3],v=vars[4];
    x=x.add(0.6);
    y=y.add(0.3);
    z=z.add(-0.5);
    u=u.add(0.2);
    v=v.add(-0.4);
    xx=x.mult(x).scale(0.1);
    yy=y.mult(y).scale(0.2);
    zz=z.mult(z).scale(1.2);
    uu=u.mult(u).scale(0.5);
    vv=v.mult(v).scale(2.4);
    sum=xx.add(yy).add(zz).add(uu).add(vv).cos().scale(-1)
    // return x.add(y).add(z).add(u).sub(v).add(sum);
    return sum;
  });
  console.log(out)
})()
