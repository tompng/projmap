function MObj(value,d,dd){
  this.value = value;
  this.d = {}
  this.dd = {};
  for(var i in d)this.d[i]=d[i];
  for(var i in dd)this.dd[i]=dd[i];
}
MObj.dkeys=function(a,b,func){
  var keys={};
  for(var i in a.d)keys[i]=true;
  for(var i in b.d)keys[i]=true;
  for(var i in keys)func(i);
}
MObj.prototype = {
  setD: function(i,val){this.d[i]=val;},
  getD: function(i){return this.d[i]||0;},
  getDD: function(i,j){return this.dd[i<j?i+'_'+j:j+'_'+i]||0;},
  setDD: function(i,j,val){
    this.dd[i<j?i+'_'+j:j+'_'+i]=val;
  },
  dup: function(){
    return new MObj(this.value, this.d, this.dd);
  },
  scale: function(scale){
    var m = this.dup();
    m.value*=scale;
    for(var i in m.d)m.d[i]*=scale;
    for(var i in m.dd)m.dd[i]*=scale;
    return m;
  },
  addConst: function(v){
    var m=this.dup();
    m.value+=v;
    return m;
  },
  add: function(m){
    var out=this.dup();
    out.value+=m.value;
    for(var i in m.d)out.d[i]=(out.d[i]||0)+m.d[i];
    for(var i in m.dd)out.dd[i]=(out.dd[i]||0)+m.dd[i];
    return out;
  },
  mult: function(m){
    var out=new MObj(this.value*m.value);
    var self=this;
    MObj.dkeys(self,m,function(i){
      out.d[i]=self.getD(i)*m.value+self.value*m.getD(i);
    })
    MObj.dkeys(self,m,function(i){
      MObj.dkeys(self,m,function(j){
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
    var out=new MObj(this.value/m.value);
    var self=this;
    MObj.dkeys(self,m,function(i){
      out.d[i]=self.getD(i)/m.value-self.value*m.getD(i)/m.value/m.value;
    })
    MObj.dkeys(self,m,function(i){
      MObj.dkeys(self,m,function(j){
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
    var out=new MObj(fval);
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
MObj.index=0;
MObj.var=function(val){
  var index=MObj.index++;
  var m = new MObj(val||0);
  m.setD(index,1);
  m.index=index;
  return m;
}
MObj.solveNext=function(exp,variables){
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
  var d=MObj.solveMatrix(matrix, val);
  for(var i=0;i<size;i++){
    variables[i].value -= d[i];
  }
}
MObj.solveMatrix=function(matrix,val){
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

try{
  module.exports=MObj;
}catch(e){}

(function(){
  MObj=require('./mobj.js')
  x=MObj.var(1)
  y=MObj.var(2)
  for(var i=0;i<10;i++){
    xx=x.add(y.scale(-1))
    xx=xx.mult(xx)
    yy=y.add(x)
    yy=yy.mult(yy).mult(yy)
    exp=xx.add(yy.sin()).sqrt()
    MObj.solveNext(exp,[x,y])
  }
  [x,y]
})

