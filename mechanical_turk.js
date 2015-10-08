'use strict'

var configuration = require("./config");
var mturk  = require("./mturk/index")({creds: configuration.env.credentials, sandbox: configuration.env.sandbox});
var db = require('./dynamo_db');
var libxmljs = require("libxmljs");

exports.createHITType = function () {
  var hittype = {
    "Title" : "Describe an image by providing tags",
    "Description": "Please view and provide tags for an image",
    "AutoApprovalDelayInSeconds" : 60 * 60 * 24 * 30,
    "AssignmentDurationInSeconds" : 60 * 60 * 24,
    "Keywords" : "image, pradeep, tagging",
    "Reward" : [{
      "Amount": "0.00",
      "CurrencyCode": "USD"
    }]
  };
  mturk.RegisterHITType(hittype, function(err, response){
    if (err) throw err;
    console.log(response);
  });
}

exports.createHITs = function (data) {
  data.forEach( function(row){
    //console.log(row.assetId + " => " + row.assetData.contentUrl);
    var create_hit = {
      "HITTypeId" : "38MPDVA2YPC8Q178KG2Q9327UC4MGJ",
      "Question" : getQuestionForm(row.assetData.contentUrl),
      "MaxAssignments" : "1",
      "LifetimeInSeconds" : 60 * 60 * 24 * 7,
      "UniqueRequestToken" : row.assetId
    };

    mturk.CreateHIT(create_hit, function(err, response){
      if (err) throw err;
      //console.log(response);
      dbcallback('created', {HIT: response, ASSET_ID: row.assetId});
    });

  });
}

function getQuestionForm(image_url) {
  var question = "<QuestionForm xmlns=\"http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionForm.xsd\">";
  question += "<Overview>";
  question += "<Text>You must provide 3 tags for the main subject in this image.</Text><List><ListItem>Each tag must be a single word.</ListItem><ListItem>No tag can be longer than 25 characters.</ListItem><ListItem>The tags must describe the image, the contents of the image, or some relevant context.</ListItem></List><Binary><MimeType><Type>image</Type></MimeType><DataURL>" + image_url + "</DataURL><AltText>Image Tagging.</AltText></Binary>";
  question += "</Overview>";
  question += "<Question>";
  question += "<QuestionIdentifier>Tag 1:</QuestionIdentifier>";
  question += "<IsRequired>true</IsRequired>";
  question += "<QuestionContent><Text>Tag 1:</Text></QuestionContent>";
  question += "<AnswerSpecification><FreeTextAnswer><Constraints><Length maxLength='25' /></Constraints><NumberOfLinesSuggestion>1</NumberOfLinesSuggestion></FreeTextAnswer></AnswerSpecification>";
  question += "</Question>";
  question += "<Question>";
  question += "<QuestionIdentifier>Tag 2:</QuestionIdentifier>";
  question += "<IsRequired>true</IsRequired>";
  question += "<QuestionContent><Text>Tag 2:</Text></QuestionContent>";
  question += "<AnswerSpecification><FreeTextAnswer><Constraints><Length maxLength='25' /></Constraints><NumberOfLinesSuggestion>1</NumberOfLinesSuggestion></FreeTextAnswer></AnswerSpecification>";
  question += "</Question>";
  question += "<Question>";
  question += "<QuestionIdentifier>Tag 3:</QuestionIdentifier>";
  question += "<IsRequired>true</IsRequired>";
  question += "<QuestionContent><Text>Tag 3:</Text></QuestionContent>";
  question += "<AnswerSpecification><FreeTextAnswer><Constraints><Length maxLength='25' /></Constraints><NumberOfLinesSuggestion>1</NumberOfLinesSuggestion></FreeTextAnswer></AnswerSpecification>";
  question += "</Question>";
  question += "</QuestionForm>";
  return question;
}

function dbcallback (status, data) {
  console.log('calling the DB APIs as the HIT is ' + status + ' with following params.');console.log(data);

  switch (status) {
    case 'completed':
      db.getAssetId(data.HIT, function(err, response) {
        if (err) throw err;
          var asset_id = response[0].asset_id.S;
          db.updateResponseData(asset_id, 2, data.TAGS, function(err){
            if (err) throw err;
            console.log("Content(" + asset_id + ") successfully updated.");
            mturk.DisableHIT({HITId: data.HIT}, function(err, response){
              if (err) throw err;
              console.log("Successfully removed the HIT: " + response);
            });
          });
      });
      break;
    case 'created':
      db.updateAssetArchive(data.ASSET_ID, data.HIT, 1, function(err, response){
        if (err) throw err;
        console.log("Content(" + data.ASSET_ID + ") updated with HIT id(" + data.HIT + ").");
      });
      break;
  }
}

exports.completedHITs = function () {
  mturk.GetReviewableHITs({}, function(err, response){
    if (err) throw err;
    var count = parseInt(response.NumResults);
    if (count > 0) {
      var hits = [];

      console.log('There are ' + response.NumResults + ' HITs which are ready to be processed.');

      if (count === 1) {
        hits[0] = response.HIT;
      } else {
        hits = response.HIT;
      }
      hits.forEach( function(hit) {
        //console.log(hit.HITId);
        getHITResponse(hit.HITId);
      });
    } else {
      console.log('There are 0 HITs to be processed.')
    }
  });
}

function getHITResponse(hit_id) {
  mturk.GetAssignmentsForHIT({HITId: hit_id}, function(err, response){
    if (err) throw err;
    if (parseInt(response.NumResults) > 0) {
      var tags = [];
      var answer = response.Assignment.Answer;
      answer = answer.replace(/\n/g, '');

      var xmlDoc = libxmljs.parseXml(answer);
      // xpath queries
      var freeText = xmlDoc.find('//xmlns:FreeText', 'http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionFormAnswers.xsd');
      for (var index in freeText) {
        tags[index] = freeText[index].text();
      }
      //console.log(tags);
      dbcallback('completed', {HIT: hit_id, TAGS: tags});
    } else {
      console.log("The HIT(" + hit_id + ") is expired before completion.");
    }
  });
}

exports.listHITs = function () {
  mturk.SearchHITs({"PageSize": 100, "SortDirection": "Descending"}, function(err, response){
    if (err) throw err;
    console.log("Available HITs "+response.TotalNumResults);
    var count = parseInt(response.NumResults);
    if (count > 0) {
      var hits = [];
      if (count == 1) {
        hits[0] = response.HIT;
      } else {
        hits = response.HIT;
      }
      for(var key in hits) {
        console.log("HITID : " + hits[key].HITId + " Status : " + hits[key].HITStatus + " Expires: " + hits[key].Expiration + "Review Status : " + hits[key].HITReviewStatus);
      }
    }
  });
}

