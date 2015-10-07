'use strict'

var configuration = require("./config");
var AWS = require('aws-sdk');

AWS.config.apiVersions = {
  dynamodb: configuration.env.dynamo.version
};

AWS.config.update({
  accessKeyId: configuration.env.dynamo.accessKey,
  secretAccessKey: configuration.env.dynamo.secretKey,
  region: configuration.env.dynamo.region
});

var db = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

// Creating schema
exports.createSchema = function (callback) {
  var params;
  params = {
    TableName: 'asset_management',
    KeySchema: [ // The type of of schema.  Must start with a HASH type, with an optional second RANGE.
      { // Required HASH type attribute
        AttributeName: 'asset_id',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [ // The names and types of all primary and index key attributes only
      {
        AttributeName: 'asset_id',
        AttributeType: 'S' // (S | N | B) for string, number, binary
      },
      {
        AttributeName: 'hit_id',
        AttributeType: 'S' // (S | N | B) for string, number, binary
      },
      {
        AttributeName: 'status',
        AttributeType: 'N' // (S | N | B) for string, number, binary
      }

      // ... more attributes ...
    ],
    ProvisionedThroughput: { // required provisioned throughput for the table
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    GlobalSecondaryIndexes: [ // optional (list of GlobalSecondaryIndex)
      {
        IndexName: 'hit_id',
        KeySchema: [
          { // Required HASH type attribute
            AttributeName: 'hit_id',
            KeyType: 'HASH'
          }
        ],
        ProvisionedThroughput: { // throughput to provision to the index
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        Projection: { // attributes to project into the index
          ProjectionType: 'ALL' // (ALL | KEYS_ONLY | INCLUDE)
          // NonKeyAttributes: [ // required / allowed only for INCLUDE
          // 'hit_id'
          // ... more attribute names ...
          // ]
        }
      },
      {
        IndexName: 'status',
        KeySchema: [
          { // Required HASH type attribute
            AttributeName: 'status',
            KeyType: 'HASH'
          }
        ],
        ProvisionedThroughput: { // throughput to provision to the index
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        Projection: { // attributes to project into the index
          ProjectionType: 'ALL' // (ALL | KEYS_ONLY | INCLUDE)
          // NonKeyAttributes: [ // required / allowed only for INCLUDE
          //'status'
          // ... more attribute names ...
          //]
        }
      }

      // ... more global secondary indexes ...
    ]
  };

  db.createTable(params, function (err, data) {
    if (err) callback(err, null); // an error occurred
    else {
      callback(null, data);
    } // successful response
  });
}

// inserting values to table
exports.insertAssetArchive = function (data) {

  data.forEach(function (row){
    var params = {
      TableName: 'asset_management',
      Item: row,
      ReturnValues: 'NONE', // optional (NONE | ALL_OLD)
      ReturnConsumedCapacity: 'NONE', // optional (NONE | TOTAL | INDEXES)
      ReturnItemCollectionMetrics: 'NONE' // optional (NONE | SIZE)
    };

    docClient.put(params, function (err, data) {
      if (err) console.log(err); // an error occurred
      else console.log("inserted..."); // successful response
    });
  });
};

/* Fetching assets based on status and limit.
 function (db, status, limit, callback)
 db = aws-sdk dynamodb object
 status = current status of asset
 0 = not processed
 1 = request sent to mTurk
 2 = request received from mTurk
 3 = request updated in DAM
 limit = number of asset to query.
 callback = returned object.
 */
exports.getAssets = function (status, limit, callback) {
  var params = {
    TableName: 'asset_management',
    IndexName: 'status',
    KeyConditions: { // indexed attributes to query
      // must include the hash key value of the table or index
      // with 'EQ' operator
      'status': {
        ComparisonOperator: 'EQ', // (EQ | NE | IN | LE | LT | GE | GT | BETWEEN |
        //  NOT_NULL | NULL | CONTAINS | NOT_CONTAINS | BEGINS_WITH)
        AttributeValueList: [{N: status.toString()},]
      }
      // more key conditions ...
    },
    ScanIndexForward: true, // optional (true | false) defines direction of Query in the index
    Limit: limit, // optional (limit the number of items to evaluate)
    ConsistentRead: false, // optional (true | false)
    //Select: 'ALL_ATTRIBUTES', // optional (ALL_ATTRIBUTES | ALL_PROJECTED_ATTRIBUTES |
    //           SPECIFIC_ATTRIBUTES | COUNT)
    AttributesToGet: [ // optional (list of specific attribute names to return)
      'asset_id',
      'status',
      'asset_data',
      'response_data'
      // ... more attributes ...
    ],

    ReturnConsumedCapacity: 'NONE' // optional (NONE | TOTAL | INDEXES)
  };

  db.query(params, function (err, data) {
    if (err) callback(err, null); // an error occurred
    else {
      callback(null, data);
    } // successful response
  });
};


// Selecting asset_id based on hit_id.
exports.getAssetId = function (hit_id, callback) {
  var params = {
    TableName: 'asset_management',
    IndexName: 'hit_id',
    KeyConditions: { // indexed attributes to query
      // must include the hash key value of the table or index
      // with 'EQ' operator
      'hit_id': {
        ComparisonOperator: 'EQ', // (EQ | NE | IN | LE | LT | GE | GT | BETWEEN |
        //  NOT_NULL | NULL | CONTAINS | NOT_CONTAINS | BEGINS_WITH)
        AttributeValueList: [{S: hit_id.toString()}]
      }
      // more key conditions ...
    },
    ScanIndexForward: true, // optional (true | false) defines direction of Query in the index
    ConsistentRead: false, // optional (true | false)
    //Select: 'ALL_ATTRIBUTES', // optional (ALL_ATTRIBUTES | ALL_PROJECTED_ATTRIBUTES |
    //           SPECIFIC_ATTRIBUTES | COUNT)
    AttributesToGet: [ // optional (list of specific attribute names to return)
      'asset_id'
      // ... more attributes ...
    ],

    ReturnConsumedCapacity: 'NONE' // optional (NONE | TOTAL | INDEXES)
  };

  db.query(params, function (err, data) {
    if (err) callback(err, null); // an error occurred
    else {
      callback(null, data.Items);
    } // successful response
  });
};

// Updating Asset archive data.(first time).
exports.updateAssetArchive = function (asset_id, hit_id, status, callback) {
  var params = {
    TableName: 'asset_management',
    Key: { // The primary key of the item (a map of attribute name to AttributeValue)

      asset_id: {S: asset_id.toString()}
      // more attributes...
    },
    AttributeUpdates: { // The attributes to update (map of attribute name to AttributeValueUpdate)

      hit_id: {
        Action: 'PUT', // PUT (replace)
        // ADD (adds to number or set)
        // DELETE (delete attribute or remove from set)
        Value: {S: hit_id.toString()}
      },
      status: {
        Action: 'PUT', // PUT (replace)
        // ADD (adds to number or set)
        // DELETE (delete attribute or remove from set)
        Value: {N: status.toString()}
      }
      // more attribute updates: ...
    },

    ReturnValues: 'UPDATED_NEW', // optional (NONE | ALL_OLD | UPDATED_OLD | ALL_NEW | UPDATED_NEW)
    ReturnConsumedCapacity: 'NONE', // optional (NONE | TOTAL | INDEXES)
    ReturnItemCollectionMetrics: 'NONE' // optional (NONE | SIZE)
  };
  db.updateItem(params, function (err, data) {
    if (err) callback(err, null); // an error occurred
    else {
      callback(null, data);
    } // successful response
  });
};

//Updating assets(Final result from mturk).
exports.updateResponseData = function (asset_id, status, response, callback) {

  var params = {
    TableName: 'asset_management',
    Key: { // The primary key of the item (a map of attribute name to AttributeValue)

      asset_id: asset_id.toString()
      // more attributes...
    },
    AttributeUpdates: { // The attributes to update (map of attribute name to AttributeValueUpdate)
      status: {
        Action: 'PUT', // PUT (replace)
        // ADD (adds to number or set)
        // DELETE (delete attribute or remove from set)
        Value: status
      },
      response_data: {
        Action: 'PUT', // PUT (replace)
        // ADD (adds to number or set)
        // DELETE (delete attribute or remove from set)
        Value: response
      }
      // more attribute updates: ...
    },

    ReturnValues: 'NONE', // optional (NONE | ALL_OLD | UPDATED_OLD | ALL_NEW | UPDATED_NEW)
    ReturnConsumedCapacity: 'NONE', // optional (NONE | TOTAL | INDEXES)
    ReturnItemCollectionMetrics: 'NONE' // optional (NONE | SIZE)
  };
  docClient.update(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log(data);           // successful response
      callback(null);
    }
  });
};
