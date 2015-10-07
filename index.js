'use strict'

var mech_turk = require('./mechanical_turk');
var db = require('./dynamo_db');
var crontab = require('node-crontab');

var new_assets = [
  { // a map of attribute name to AttributeValue
    asset_id: "asset_id_13",
    hit_id: "0",
    created_date: Date.now(),
    status: 0,
    operation: "image_tagging",
    asset_data: {
      "name": "Asset 13",
      "contentUrl": "http://www.hdwallpapersimages.com/wp-content/uploads/2015/01/Nature-Beauty-Desktop-Images.jpg",
      "size": 300,
      "headline": "Asset 13",
      "description": "DAM assetUrl reference for the creator",
      "encodingFormat": 'jpeg'
    },
    source: "DAM",
    completed_date: "0",
    response_data: "0"
  },
  { // a map of attribute name to AttributeValue
    asset_id: "asset_id_14",
    hit_id: "0",
    created_date: Date.now(),
    status: 0,
    operation: "image_tagging",
    asset_data: {
      "name": "Asset 14",
      "contentUrl": "http://res.cloudinary.com/demo/image/upload/sample.jpg",
      "size": 300,
      "headline": "Asset 14",
      "description": "DAM assetUrl reference for the creator",
      "encodingFormat": 'jpeg'
    },
    source: "DAM",
    completed_date: "0",
    response_data: "0"
  }
];

//mech_turk.createHITs(json);

//mech_turk.completedHITs();

//mech_turk.listHITs();

//var jobId = crontab.scheduleJob("*/1 * * * *", function(){
//  var d = new Date();
//  console.log("It's been 1 minutes! @ " + d.getTime());
//});

function getNewAssetsIntoHITArchive() {
  // new_assets would have the data
  db.insertAssetArchive(new_assets);
}

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
      mech_turk.createHITs(input);
    });
  });
}

//getNewAssetsIntoHITArchive();

//createNewHITsFromHITArchive();

function sendUpdatedResult() {
  db.getAssets(2, 10, function (err, response) {
    if (err) throw err;
    response.Items.forEach(function (row) {
      //console.log(JSON.stringify(row));
      var input = [{
        "assetId": row.asset_id.S,
        "assetData": row.response_data.L
      }];
      console.log(input);
      db.updateResponseData(row.asset_id.S, 3, row.response_data.L, function(err, response) {
        if (err) throw err;
        console.log("Successfully updated the asset(" + row.asset_id.S + ")")
      })
    });
  });
}

//sendUpdatedResult();