function Var(value,d,dd){
  this.value = value;
  this.d = {}
  this.dd = {};
  for(var i in d)this.d[i]=d[i];
  for(var i in dd)this.dd[i]=dd[i];
}
Var.dkeys=function(a,b,func){
  var keys={};
  for(var i in a.d)keys[i]=true;
  for(var i in b.d)keys[i]=true;
  for(var i in keys)func(i);
}
Var.prototype = {
  setD: function(i,val){this.d[i]=val;},
  getD: function(i){return this.d[i]||0;},
  getDD: function(i,j){return this.dd[i<j?i+'_'+j:j+'_'+i]||0;},
  setDD: function(i,j,val){
    this.dd[i<j?i+'_'+j:j+'_'+i]=val;
  },
  dup: function(){
    return new Var(this.value, this.d, this.dd);
  },
  scale: function(scale){
    var out = this.dup();
    out.value*=scale;
    for(var i in out.d)out.d[i]*=scale;
    for(var i in out.dd)out.dd[i]*=scale;
    return out;
  },
  add: function(m){
    var out=this.dup();
    if(typeof(m)=='number'){
      out.value+=m;
      return out;
    }
    out.value+=m.value;
    for(var i in m.d)out.d[i]=(out.d[i]||0)+m.d[i];
    for(var i in m.dd)out.dd[i]=(out.dd[i]||0)+m.dd[i];
    return out;
  },
  sub: function(m){
    if(typeof(m)=='number')return this.add(-m);
    return this.add(m.scale(-1));
  },
  mult: function(m){
    if(typeof(m)=='number')return this.scale(m);
    var out=new Var(this.value*m.value);
    var self=this;
    Var.dkeys(self,m,function(i){
      out.d[i]=self.getD(i)*m.value+self.value*m.getD(i);
    })
    Var.dkeys(self,m,function(i){
      Var.dkeys(self,m,function(j){
        var dd=(
          +self.getDD(i,j)*m.value
          +self.getD(i)*m.getD(j)
          +self.getD(j)*m.getD(i)
          +self.value*m.getDD(i,j)
        );
        out.setDD(i,j,dd);
      })
    })
    return out;
  },
  div:function(m){
    if(typeof(m)=='number')return this.scale(1/m);
    var out=new Var(this.value/m.value);
    var self=this;
    Var.dkeys(self,m,function(i){
      out.d[i]=self.getD(i)/m.value-self.value*m.getD(i)/m.value/m.value;
    })
    Var.dkeys(self,m,function(i){
      Var.dkeys(self,m,function(j){
        var dd=(
          +self.getDD(i,j)/m.value
          -self.getD(i)*m.getD(j)/m.value/m.value
          -self.getD(j)*m.getD(i)/m.value/m.value
          -self.value*m.getDD(i,j)/m.value/m.value
          +2*self.value*m.getD(i)*m.getD(j)/m.value/m.value/m.value
        );
        out.setDD(i,j,dd);
      })
    })
    return out;
  },
  sin: function(){
    return this.func(
      Math.sin,
      Math.cos,
      function(x){return -Math.sin(x)}
    )
  },
  cos: function(){
    return this.func(
      Math.cos,
      function(x){return -Math.sin(x)},
      function(x){return -Math.cos(x)}
    )
  },
  exp: function(){
    return this.func(Math.exp,Math.exp,Math.exp);
  },
  sqrt: function(){
    return this.pow(0.5);
  },
  pow: function(v){
    return this.func(
      function(x){return Math.pow(x,v)},
      function(x){return v*Math.pow(x,v-1)},
      function(x){return v*(v-1)*Math.pow(x,v-2)}
    )
  },
  func:function(f,df,ddf){
    var fval=f(this.value);
    var dfval=df(this.value);
    var ddfval=ddf(this.value);
    var out=new Var(fval);
    for(var i in this.d){
      out.d[i]=this.d[i]*dfval;
    }
    for(var i in this.d)for(var j in this.d){
      var dd=this.getDD(i,j)*dfval+this.getD(i)*this.getD(j)*ddfval;
      out.setDD(i,j,dd);
    }
    return out;
  }
}
var Solver={index:0}
Solver.var=function(val){
  var index=Solver.index++;
  var m = new Var(val||0);
  m.setD(index,1);
  m.index=index;
  return m;
}
Solver.const=function(val){
  return new Var(val);
}
Solver.minimizeWithRandomStartpoint=function(num,range,expfunc){
  var initials=Solver.randomSearchMinimize(num,range,expfunc);
  return Solver.minimize(initials,expfunc);
}
Solver.randomSearchMinimize=function(num,range,expfunc){
  var mins=[],min=null;
  for(var n=0;n<10000;n++){
    var vars=[];
    for(var i=0;i<num;i++)vars[i]=Solver.const(range*(2*Math.random()-1));
    var exp=expfunc(vars);
    if(min==null||exp.value<min){
      mins=vars;
      min=exp.value;
      console.log('rsearch',min);
    }
  }
  return mins.map(function(m){return m.value});
}
Solver.maximize=function(initials, expfunc, N, M, NC, NCMIN){
  return Solver.minimize(initials, function(args){return expfunc(args).scale(-1)}, N, M, NC, NCMIN)
}
Solver.minimize=function(initials, expfunc, N, M, NC, NCMIN){
  N=N||100;M=M||10
  NC=NC||10;
  NCMIN=NCMIN||2;
  var nc=0;
  var d=1;
  var values=initials;
  var vars=initials.map(function(x){return Solver.var(x)});
  for(var n=0;n<N;n++){
    var vars2 = vars.map(function(x){return Solver.var(x.value)})
    var exp = expfunc(vars2);
    var newtonable=true;
    for(var i in exp.d){
      if(exp.getDD(i,i)<=0)newtonable=false;
    }
    if(newtonable){
      Solver.solveNewton(exp,vars2);
      var exp2 = expfunc(vars2);
      if(exp2.value<exp.value){
        console.log('newton', exp2.value)
        vars=vars2;
        if(nc++==NC)break;
        continue;
      }else{
        console.log('newton failed')
      }
    }
    var exp = expfunc(vars);
    var linearvar=Solver.var(0);
    var linearexp=expfunc(hoge=vars.map(function(v){
      return linearvar.mult(exp.getD(v.index)).add(v.value)
    }));
    if(linearexp.getDD(linearvar.index,linearvar.index)>0){
      Solver.solveNewton(linearexp,[linearvar]);
      var exp2=expfunc(vars.map(function(v){
        return linearvar.mult(exp.getD(v.index)).add(v.value)
      }));
      if(exp2.value<exp.value){
        console.log('newton1D',exp2.value);
        vars=vars.map(function(v){
          return Solver.var(v.value+linearvar.value*exp.getD(v.index))
        })
        continue;
      }else{
        console.log('newton1D faild');
      }
    }
    var vec = Object.keys(exp.d).map(function(key){return -exp.getD(key)});
    for(var m=0;m<M;m++){
      var vars2=[];
      for(var i in vars){
        vars2[i]=new Solver.var(vars[i].value+vec[i]*d);
      }
      exp2=expfunc(vars2);
      if(exp2.value<exp.value){
        console.log('rand',m,d, exp2.value);
        vars=vars2;
        d*=4;
        break;
      }else{
        d/=2;
      }
    }
    if(m==M){
      console.log('failed');
      if(nc>=NCMIN)break;
    }
  }
  console.log(exp);
  return vars.map(function(v){return v.value});
}
Solver.solveNewton=function(exp,variables){
  var size=variables.length;
  var val=[];
  for(var i=0;i<size;i++){
    var v=variables[i]
    val[i]=exp.getD(v.index);
  }
  var matrix=[];
  for(var i=0;i<size;i++){
    matrix[i]=[];
    for(var j=0;j<size;j++){
      matrix[i][j]=exp.getDD(variables[i].index,variables[j].index);
    }
  }
  var d=Solver.solveMatrix(matrix, val);
  for(var i=0;i<size;i++){
    variables[i].value -= d[i];
  }
}
Solver.solveMatrix=function(matrix,val){
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
Solver.initials=function(n,r){
  r=r||1;
  var out=[];
  for(var i=0;i<n;i++){
    out[i]=r*(2*Math.random()-1)
  }
  return out;
}

try{
  module.exports=Solver;
}catch(e){}

(function(){
  Solver=require('./solver.js')
  var vals=[3,2,2,1,3];
  out=Solver.maximize(vals,function(vars){
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
    sum=xx.add(yy).add(zz).add(uu).add(vv)
    exp=sum.scale(-1).exp().scale(-1);
    return exp;
  },500)
  console.log(out)
})
