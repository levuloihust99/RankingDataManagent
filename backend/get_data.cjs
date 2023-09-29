var fs = require('fs/promises')
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://2wahtpgtmIHb:uepaQrM9deYLiF48fu8bwLdf@localhost:27021/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("rank-tmp");
  dbo.collection("ranking-samples").find({}).limit(100).toArray(async function(err, result) {
    if (err) throw err;
    await fs.writeFile("data/fakeData.json", JSON.stringify(result, null, 4))
    db.close();
  });
});