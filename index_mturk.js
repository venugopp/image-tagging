/**
 * Created by venugopp on 9/30/15.
 */

var config = require("./config.json");
var mturk  = require("./mturk/index")({creds: config.credentials, sandbox: config.sandbox});
var urlencode = require('urlencode');
var libxmljs = require("libxmljs");

/*
mturk.SearchHITs({"PageSize": 10, "SortDirection": "Descending"}, function(err, response){
  if (err) throw err;
  console.log("Search HIT "+response.TotalNumResults);console.log(response);
});
*/
/*
mturk.GetHIT({HITId: '32CAVSKPCEQA93EWI72S9AM22Z61UF'}, function(err, response){
  if (err) throw err;
  console.log(response);
});
*/
/*
mturk.ExtendHIT({HITId: '3WYZV0QBFJE335QJP964ZTYFIONXBL', ExpirationIncrementInSeconds: 60 * 60 * 24 * 7}, function(err, response){
  if (err) throw err;
  console.log(response);
});
*/
/*
mturk.DisableHIT({HITId: '3UUSLRKAUL423NICLSTC0K9RJLB7D8'}, function(err, response){
  if (err) throw err;
  console.log(response);
});
*/
/*
mturk.DisposeHIT({HITId: '3WYZV0QBFJE335QJP964ZTYFIONXBL'}, function(err, response){
  if (err) throw err;
  console.log(response);
});
*/
/*
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
*/
// "HITTypeId" : "3BH55VSCCHFMYCTC1XXKS0JTA5HBJN"
var create_hit = {
  "HITTypeId" : "38MPDVA2YPC8Q178KG2Q9327UC4MGJ",
  "Question" : getQuestionForm(),
  "MaxAssignments" : "1",
  "LifetimeInSeconds" : 60 * 60 * 24 * 7,
  "UniqueRequestToken" : "asset_id_4"
};

function getQuestionForm() {
  var question = "<QuestionForm xmlns=\"http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionForm.xsd\">";
  question += "<Overview>";
  question += "<Text>You must provide 3 tags for the main subject in this image.</Text><List><ListItem>Each tag must be a single word.</ListItem><ListItem>No tag can be longer than 25 characters.</ListItem><ListItem>The tags must describe the image, the contents of the image, or some relevant context.</ListItem></List><Binary><MimeType><Type>image</Type></MimeType><DataURL>http://res.cloudinary.com/demo/image/upload/sample.jpg</DataURL><AltText>Image Tagging.</AltText></Binary>";
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

/*
mturk.CreateHIT(create_hit, function(err, response){
  if (err) throw err;
  console.log(response);
});
*/
/*
mturk.GetReviewableHITs({}, function(err, response){
  if (err) throw err;
  console.log(response);
});
*/
/*
mturk.GetAssignmentsForHIT({HITId: '32CAVSKPCEQA93EWI72S9AM22Z61UF'}, function(err, response){
  if (err) throw err;
  console.log(response);
  var answer = response.Assignment.Answer;
  answer = answer.replace(/\n/g, '');

  var xmlDoc = libxmljs.parseXml(answer);
  // xpath queries
  var freeText = xmlDoc.get('//xmlns:FreeText', 'http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionFormAnswers.xsd');
  console.log("Result ::: " + freeText.text());
});
*/
/*
mturk.ApproveAssignment({AssignmentId: '3VZLGYJEYLB28MRSLPR9AV10LR3ZX2'}, function(err, response){
  if (err) throw err;
  console.log(response);
})
*/

var xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><QuestionFormAnswers xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionFormAnswers.xsd"><Answer><QuestionIdentifier>Tag 1:</QuestionIdentifier><FreeText>hit2_tag1</FreeText></Answer><Answer><QuestionIdentifier>Tag 2:</QuestionIdentifier><FreeText>hit2_tag2</FreeText></Answer><Answer><QuestionIdentifier>Tag 3:</QuestionIdentifier><FreeText>hit2_tag3</FreeText></Answer></QuestionFormAnswers>';
//var xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><QuestionFormAnswers><Answer><QuestionIdentifier>Tag 1:</QuestionIdentifier><FreeText>hit2_tag1</FreeText></Answer><Answer><QuestionIdentifier>Tag 2:</QuestionIdentifier><FreeText>hit2_tag2</FreeText></Answer><Answer><QuestionIdentifier>Tag 3:</QuestionIdentifier><FreeText>hit2_tag3</FreeText></Answer></QuestionFormAnswers>';
var xmlDoc = libxmljs.parseXml(xml);
// xpath queries
//var freeText = xmlDoc.get('//xmlns:FreeText', 'http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionFormAnswers.xsd');

var freeText = xmlDoc.find('//xmlns:FreeText', 'http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionFormAnswers.xsd')
for(var index in freeText) {
  console.log(freeText[index].text());
}
