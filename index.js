'use strict'

var mech_turk = require('./mechanical_turk');
var db = require('./dynamo_db');
var crontab = require('node-crontab');
var http = require('http');
var urlencode = require('urlencode');

/*
 * Callback for injesting assets.
 */
function getNewAssetsIntoHITArchive() {
  var options = {
    host : 'localhost',
    port : 8888,
    method : 'GET',
    path: '/example/asset.php'
  };
  var result = http.request(options, function(response) {
    var str = '';

    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk;
    });

    //the whole response has been recieved, so we just print it out here
    response.on('end', function () {
      var new_assets = JSON.parse(str);
      new_assets.forEach(function(asset) {
        var input = [{
          asset_id: asset.id,
          hit_id: "0",
          created_date: Date.now(),
          status: 0,
          operation: "image_tagging",
          asset_data: {
            "name": asset.name,
            "contentUrl": asset.url,
            "size": 0,
            "headline": asset.headline,
            "description": asset.description,
            "encodingFormat": 'jpeg'
          },
          source: "DAM",
          completed_date: "0",
          response_data: "0"
        }];
        console.log(input);
        db.insertAssetArchive(input);
      });
    });
  }).end();
}

/*
 * Callback for creating mTurk Tasks.
 */
function createNewHITsFromHITArchive() {
  db.getAssets(0, 10, function (err, response) {
    if (err) throw err;
    response.Items.forEach(function (row) {
      var input = [{
        "assetId" : row.asset_id.S,
        "assetData" : {
          "headline" : row.asset_data.M.headline.S,
          "description" : row.asset_data.M.description.S,
          "name" : row.asset_data.M.name.S,
          "contentUrl" :  row.asset_data.M.contentUrl.S,
          "encodingFormat" : row.asset_data.M.encodingFormat.S,
          "size" : row.asset_data.M.size.N
        }
      }];
      //console.log(JSON.stringify(row));
      mech_turk.createHITs(input);
    });
  });
}

/*
 * Callback for updating the source with data.
 */
function sendUpdatedResult() {
  // Get all the assets which are completed from mTURK(status=2)
  db.getAssets(2, 10, function (err, response) {
    if (err) throw err;
    response.Items.forEach(function (row) {
      //console.log(JSON.stringify(row));
      // Get all the possible tags.
      var tags = [];
      for (var key in row.response_data.L) {
        tags[key] = row.response_data.L[key].S;
      }

      var options = {
        host : 'localhost',
        port : 8888,
        method : 'GET',
        path: '/example/asset_save.php?id='+ row.asset_id.S + '&tag=' + urlencode(tags)
      };
      //@TODO: Replace this with actual source
      //console.log(options);
      var result = http.request(options, function(result) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        result.on('data', function (chunk) { str += chunk; });

        result.on('end', function () {
          console.log(str);
          if (str == 1) {
            db.updateResponseData(row.asset_id.S, 3, tags, function (err) {
              if (err) throw err;
              console.log("Successfully updated the asset(" + row.asset_id.S + ")");
            });
          }
        });
      }).end();
    });
  });
}


// To list the created HITs.
//mech_turk.listHITs();


// To Insert in HIT Archive with assets which need to be tagged.
//getNewAssetsIntoHITArchive();


// To create mTurk tasks(HITs)
//createNewHITsFromHITArchive();


// To Update the tags in HIT Archive once the Task is completed.
//mech_turk.completedHITs();


// To Update the tags back to source
//sendUpdatedResult();


/*
 * Sample Cron setup.
 */
//var jobId = crontab.scheduleJob("*/1 * * * *", function(){
//  var d = new Date();
//  console.log("It's been 1 minutes! @ " + d.getTime());
//});
