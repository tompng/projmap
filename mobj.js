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

module.exports=MObj;

(function(){
  MObj=require('./mobj.js')
  for(var i=0;i<1000;i++)MObj.var(3);
  x=MObj.var(-3)
  y=MObj.var(4)
  for(var i=0;i<10;i++){
    xy=x.mult(y)
    xx=x.mult(x)
    yy=y.mult(y)
    xz=x.addConst(-2);
    xz2=xz.mult(xz)
    xz4=xz2.mult(xz2)
    exp = xx.scale(3).add(yy.scale(2)).add(xy.scale(4)).add(x.scale(-4)).add(xz4)
    MObj.solveNext(exp,[x,y])
  }
  [x,y]
})


  