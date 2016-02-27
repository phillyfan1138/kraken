var modalTrade={
  name:'modal',
  function:'closeModalTrade',
  id:'pwdModal',
  title:'',
  message:'',
  url:'',
  additionalOptions:''
}
var closeModalTrade=function(self){
  var elem=document.getElementById(self);
  var value=elem.value;
  console.log(elem);
  var label=elem.dataset.key;
  var node=document.getElementById(modal.id);
  node.close();
  node.remove();
  var data={};
  if(modal.additionalOptions){
    data=modal.additionalOptions;
  }
  if(login.key){
    data.key=login.key;
    data.secret=login.secret;
  }
  if(label){
    var labelBuy=document.getElementById('buycrypto').value;
    var pair=kraken.numeraire+labelBuy;
    var exchange=function(rate){return rate;}
    if(!kraken.assetPairs[pair]){
      pair=labelBuy+kraken.numeraire;
      exchange=function(rate){return 1/rate;}
    }
    if(!kraken.assetPairs[pair]){
      console.log("problem1");
    }
    else{
      value=kraken.assetPrices[pair].c[0];
      data[label]=exchange(value);
    }
  }
  data.username=login.username;
  //console.log(data);
  /*$.ajax({
    url:modal.url,
    type:'POST',
    data:data,
    success:function(data){
      var route = Path.match(Path.routes.current,true);
      route.run();
    }
  });
  return false;*/
}
