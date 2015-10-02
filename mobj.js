function MObj(size,value,d,dd){
  this.value = value;
  this.size=size;
  this.d = {}
  this.dd = {};
  for(var i in d)this.d[i]=d[i];
  for(var i in dd)this.dd[i]=dd[i];
}
MObj.prototype = {
  setD: function(i,val){
    this.d[i]=val;
  },
  getD: function(i){return this.d[i]||0;},
  getDD: function(i,j){return this.dd[i*this.size+j]||0;},
  setDD: function(i,j,val){
    this.dd[i*this.size+j]=this.dd[j*this.size+i]=val;
  },
  dup: function(){
    return new MObj(this.size, this.value, this.d, this.dd);
  },
  scale: function(scale){
    var m = this.dup();
    m.value*=scale;
    for(i in m.d)m.d[i]*=scale;
    for(i in m.dd)m.dd[i]*=scale;
    return m;
  },
  addConst: function(v){
    var m=this.dup();
    m.value+=v;
    return m;
  }
}
MObj.add=function(a,b){
  var m=a.dup();
  m.value+=b.value;
  for(var i in b.d)m.d[i]=(m.d[i]||0)+b.d[i];
  for(var i in b.dd)m.dd[i]=(m.dd[i]||0)+b.dd[i];
}
MObj.dkeys=function(a,b,func){
  var keys={};
  for(i in a.d)keys[i]=true;
  for(i in b.d)keys[i]=true;
  for(i in keys)func(i);
}
MObj.mult=function(a,b){
  var m=MObj(a.value*b.value,a.size);
  MObj.dkeys(a,b,function(i){
    m.d[i]=a.getD(i)*b.value+a.value*b.getD(i);
  })
  MObj.dkeys(a,b,function(i){
    MObj.dkeys(a,b,function(j){
      var dd=(
        +a.getDD(i,j)*b.value
        +a.getD(i)*b.getD(j)
        +a.getD(j)*b.getD(i)
        +a.value*b.getDD(i,j)
      );
      m.setDD(i,j,dd);
    })
  })
  return m;
}
MObj.div=function(a,b){
  var m=MObj(a.value/b.value,a.size);
  MObj.dkeys(a,b,function(i){
    m.d[i]=a.getD(i)/b.value-a.value*b.getD(i)/b.value/b.value;
  })
  MObj.dkeys(a,b,function(i){
    MObj.dkeys(a,b,function(j){
      var dd=(
        +a.getDD(i,j)/b.value
        -a.getD(i)*b.getD(j)/b.value/b.value
        -a.getD(j)*b.getD(i)/b.value/b.value
        -a.value*b.getDD(i,j)/b.value/b.value
        +2*a.value*b.getD(i)*b.getD(j)/b.value/b.value/b.value
      );
      m.setDD(i,j,dd);
    })
  })
  return m;
}
MObj.var=function(size, i, val){
  var m = new MObj(size, val);
  m.setD(i,1);
  return m;
}
