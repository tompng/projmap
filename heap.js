function Heap(){
  this.data=[];
}
Heap.prototype={
  push: function(val, obj){
    var i=this.data.length;
    var el={val:val,obj:obj};
    this.data.push(el);
    while(i>0){
      var p=Math.floor((i-1)/2);
      if(this.data[p].val<val)break;
      this.data[i]=this.data[p];
      this.data[p]=el;
      i=p;
    }
    return this;
  },
  pop: function(){
    if(this.data.length==0)return null;
    if(this.data.length==1)return this.data.pop();
    var el = this.data[0];
    var v=this.data[0]=this.data.pop();
    var i=0;
    while(true){
      var c1=2*i+1,c2=c1+1;
      if(c1>=this.data.length)break;
      var v1=this.data[c1],v2=this.data[c2];
      var c=c2<this.data.length&&v1.val>=v2.val?c2:c1;
      if(v.val<this.data[c].val)break;
      this.data[i]=this.data[c];
      this.data[c]=v;
      i=c;
    }
    return el;
  }
};
module.exports=Heap;
