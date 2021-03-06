var express = require('express');
var krakenClient=require('kraken-api');
var http = require('http');
var app = express();
var bodyParser=require('body-parser');
var pg=require('pg');
const crypto = require('crypto');
var algorithm = 'aes-256-ctr';
function encrypt(text, password){
  var cipher = crypto.createCipher(algorithm,password);
  var crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}
function decrypt(text, password){
  var decipher = crypto.createDecipher(algorithm,password);
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('assets'));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.get('*', function(req, res){
  res.sendFile(__dirname +'/assets/index.html');
});
var connectionString='postgres://'+process.env.username+':'+process.env.password+'@localhost/kraken';

app.post('/settings', function(req, res){
  var client=new pg.Client(connectionString);
  client.connect(function(err){
    if(err){
      console.log(err);
    }
    var val='';
    var colName='';
    if(req.body.key){
      colName='key';
      val=encrypt(req.body.key, req.body.password);
    }
    else if(req.body.secret){
      colName='secret';
      val=encrypt(req.body.secret, req.body.password);
    }
    //var secret = encrypt(req.body.secret, req.body.password);
    client.query("UPDATE auth SET "+colName+"='"+key+"' WHERE username='"+req.body.username+"';", function(err, result){
      //console.log(result);
      if(err){
        console.log(err);
      }
      res.send(true);
      client.end();
    });

  });
});

app.post('/login', function(req, res){
  //console.log(req.body);
  var client=new pg.Client(connectionString);
  client.connect(function(err){
    if(err){
      console.log(err);
    }
    client.query("SELECT key, secret, password, numeraire FROM auth WHERE username='"+req.body.username+"';", function(err, result){
      //console.log(result);
      if(err){
        console.log(err);
      }
      else if(result.rowCount>0){
        if(result.rows[0].password===req.body.password){
          if(result.rows[0].key){
            res.send({key:decrypt(result.rows[0].key, req.body.password), secret:decrypt(result.rows[0].secret, req.body.password), numeraire:result.rows[0].numeraire});
          }
          else{
            res.send({key:'', secret:''});
          }
        }
        else{
          res.send({title:"Wrong Password!", message:"Enter correct password", url:'/login'});
        }
      }
      else{
          res.send({title:"New Account!", message:"Retype password to create account", url:'/register'});
      }
      client.end();
    });

  });
});
app.post('/register', function(req, res){
  var client=new pg.Client(connectionString);
  client.connect(function(err){
    if(err){
      console.log(err);
    }
    client.query("INSERT INTO auth (username, password) VALUES('"+req.body.username+"', '"+req.body.password+"');", function(err, result){
      if(err){
        console.log(err);
      }
      else{
        return true;
      }
      client.end();
    });
  });
});
app.post('/setNumeraire', function(req, res){
  var client=new pg.Client(connectionString);
  client.connect(function(err){
    if(err){
      console.log(err);
    }
    client.query("UPDATE auth SET numeraire='"+req.body.numeraire+"' WHERE username='"+req.body.username+"';", function(err, result){
      if(err){
        console.log(err);
      }
      else{
        return true;
      }
      client.end();
    });
  });
});
app.post('/getPrices', function(req, res){
  var kraken=new krakenClient();
  var assetPairs=req.body.assetPairs;
  var n=assetPairs.length;
  var totalReturn=0;
  var dataToReturn={};
  n=assetPairs.length;
  for(var i=0; i<n; ++i){
    kraken.api('Ticker', {pair:assetPairs[i]}, function(error, data){
      if(error){
        console.log(error);
        //n--;
        return;
      }
      totalReturn++;
      var key=Object.keys(data.result);
      dataToReturn[key[0]]=data.result[key[0]];
      if(totalReturn===n){
        res.send(dataToReturn);
      }
    });
  }
});
app.post('/getAssets', function(req, res){
  var kraken=new krakenClient();
  var totalNum=2;
  var currNum=0;
  var dataToReturn={};
  kraken.api('Assets', null, function(error, data){
    if(error){
      console.log(error);
      return res.send(false);
    }
    dataToReturn.assets=data.result;
    currNum++;
    if(currNum===totalNum){
      res.send(dataToReturn);
    }
  });
  kraken.api('AssetPairs', null, function(error, data){
    if(error){
      console.log(error);
      return res.send(false);
    }

    var n=data.result.length;
    dataToReturn.assetPairs={};
    for(key in data.result){
      if(key.indexOf('.')<0){
        dataToReturn.assetPairs[key]=data.result[key];
      }
    }
    currNum++;
    if(currNum===totalNum){
      res.send(dataToReturn);
    }
  });
});
app.post('/kraken', function(req, res){
  var kraken=new krakenClient(req.body.key, req.body.secret);
  kraken.api(req.body.rType, req.body.rData, function(error, data) {
    if(error){
      console.log(err);
      return res.send(false);
    }
    res.send(data.result);
  });
});
var server = http.createServer(app).listen(5000);
