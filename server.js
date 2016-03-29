
// NPM Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var Twitter = require('twitter');
var cookieParser = require('cookie-parser');
var http = require('http');
var fs = require('fs');

var dbConfig = require('./db');
var mongoose = require('mongoose');

var Rumour = require('./models/rumour_document');
var germany_pork = require('./models/germany_pork');
var notebook_sequel = require('./models/notebook_sequel');
var soros_ferguson = require('./models/soros_ferguson');
var splenda_unsafe = require('./models/splenda_unsafe');
var gilt_shot = require('./models/gilt_shot');
var nazi_submarine = require('./models/nazi_submarine');
var oprah_pregnant = require('./models/oprah_pregnant');
var trump_white_tshirts = require('./models/trump_white_tshirts');
var obama_pay_increase = require('./models/obama_pay_increase');
var ford_trump = require('./models/ford_trump');
var pawnstars_arrest = require('./models/pawnstars_arrest');
var manson_trump = require('./models/manson_trump');
var spaceballs_sequel = require('./models/spaceballs_sequel');
var singer_sonja = require('./models/singer_sonja');

var ss = require('simple-statistics');

// Connect to DB
mongoose.connect(dbConfig.url);

// Server config
var app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded 
app.use(cookieParser());

// Render the static files in the public directory from the root
// As with all web servers, index.html is the default file which will be served.
app.use('/', express.static('public'));

var client = new Twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});

tTest();

// Search API.

app.get('/search', function(req, res) {
  q = "bryan singer red sonja";
  run_number = 0;
  total_tweets = 0;

  findLowestID(function(lowest_id) {
    client.get('search/tweets', {q: q, exclude: 'retweets', max_id: lowest_id, count: 100}, function(error, tweets, response){
      tweets_received = tweets.statuses.length;
      console.log('Tweets received: ' + tweets_received);

      if (tweets_received != 0) {
        analyseRumourHits(tweets);
      }
    });
  });

  // findGreatestID(function(greatest_id) {
  //   client.get('search/tweets', {q: q, exclude: 'retweets', since_id: greatest_id, count: 100}, function(error, tweets, response){
  //     tweets_received = tweets.statuses.length;
  //     console.log('Tweets received: ' + tweets_received);

  //     if (tweets_received != 0) {
  //       analyseRumourHits(tweets);
  //     }
  //   });
  // });
});

// Scan database to find oldest tweet received.

function findLowestID(callback) {
  Rumour.find({}, 'id', function (err, tweet_ids) {
    lowest_id = '';
  
    if (tweet_ids.length > 0) {
      lowest_id = tweet_ids[0].id;

      for (i = 1; i < tweet_ids.length; i++) {
        if (tweet_ids[i].id.localeCompare(lowest_id) == -1){
          lowest_id = tweet_ids[i].id;
        }
      }
    }
    callback(lowest_id);
  });
}

// Scan database to find newest tweet received.

function findGreatestID(callback) {
  Rumour.find({}, 'id', function (err, tweet_ids) {
    greatest_id = '';
  
    if (tweet_ids.length > 0) {
      greatest_id = tweet_ids[0].id;

      for (i = 1; i < tweet_ids.length; i++) {
        if (tweet_ids[i].id.localeCompare(greatest_id) == 1){
          greatest_id = tweet_ids[i].id;
        }
      }
    }
    console.log(greatest_id);
    callback(greatest_id);
  });
}

// Find rumour hits from messages returned by the Search API.

function analyseRumourHits(tweets) {
  file_string = "";

  for (i = 0; i < tweets.statuses.length; i++) {
    tweet = tweets.statuses[i];
    tweet_text = JSON.stringify(tweet.text);

    if ((tweet_text.search(/bryan singer/i)) && (tweet_text.search(/red sonja/i))){
      checkDBandAdd(tweet);
    }
  }
}

// Check DB for tweet received to avoid storing duplicates.

function checkDBandAdd(tweet) {
  Rumour.findOne({'id': tweet.id}, function (err, duplicate) {
    if (err) return handleError(err);
    
    if (duplicate == null) {
      db_rumour = parseTweet(tweet);
      addToDB(db_rumour);
    } else {
      console.log('duplicate tweet received');
    }
  });
}

// Parse relevant data including impact features from Tweet.

function parseTweet(tweet) {
  var rumour = new Rumour();

  rumour.id = JSON.stringify(tweet.id);
  rumour.text = JSON.stringify(tweet.text);

  // Impact / Engagement
  rumour.impact_score = calculateImpact(tweet.favorite_count, tweet.retweet_count, tweet.user.followers_count);
  rumour.favorite_count = JSON.stringify(tweet.favorite_count);
  rumour.retweet_count = JSON.stringify(tweet.retweet_count);

  // Tweet features for analysis
  rumour.tweet_location = tweet.place ? JSON.stringify(tweet.place.full_name) : tweet.place;
  rumour.tweet_createdAt = JSON.stringify(tweet.created_at);
  rumour.entities_hashtags = JSON.stringify(tweet.entities.hashtags) == '[]' ? false : true;
  rumour.entities_urls = JSON.stringify(tweet.entities.urls) == '[]' ? false : true;
  rumour.entities_user_mentions = JSON.stringify(tweet.entities.user_mentions) == '[]' ? false : true;
  rumour.entities_media = tweet.entities.media ? true : false;
  rumour.word_retweet = tweet_text.search(/retweet/i) > -1 ? true : false;
  rumour.all_caps = tweet_text.localeCompare(tweet_text.toUpperCase()) == 0 ? true : false;
  rumour.question_mark = tweet_text.indexOf('?') > -1 ? true : false;
  rumour.explanation_mark = tweet_text.indexOf('!') > -1 ? true : false;
  rumour.quote = tweet.text.replace(/[^\""]/g, "").length == 2 ? true : false;
  rumour.smiling_emoticon = tweet_text.indexOf(':)') > -1 ? true : false;
  rumour.default_profile = JSON.stringify(tweet.user.default_profile);
  rumour.default_profile_image = JSON.stringify(tweet.user.default_profile_image);
  rumour.user_createdAt = JSON.stringify(tweet.user.created_at);
  rumour.followers_count = JSON.stringify(tweet.user.followers_count);
  rumour.friends_count = JSON.stringify(tweet.user.friends_count);
  rumour.statuses_count = JSON.stringify(tweet.user.statuses_count);
  rumour.account_location = JSON.stringify(tweet.user.location);
  rumour.account_verified = JSON.stringify(tweet.user.verified);

  return (rumour);
}

// Calculate impact score by user engagement measures.

function calculateImpact(favourites, retweets, followers) {
  engagements = ((retweets + favourites) / followers) * 100;
  return (engagements);
}

// Add rumour to Database.

function addToDB(rumour) {
  rumour.save(function(err, rumour) {
    if (err) return console.error(err);
    console.log('Tweet added to DB.')
  });
}

// ------------------------------------------- STATS functions ----------------------------------------------------------//

// Mean, median, variance, standard deviation.

function basicStats(sample_set) {

  mean = ss.mean(sample_set);
  median = ss.median(sample_set);
  variance = ss.variance(sample_set);
  standardDev = ss.standardDeviation(sample_set);

  console.log('MEAN:' + mean);
  console.log('MEDIAN:' + median);
  console.log('variance:' + variance);
  console.log('standardDeviation:' + standardDev);
}

// T-test: A two-sample location test of the null hypothesis such that the means of two populations are equal.
// Interested in finding statistical significance in rumour datasets.

function tTest() {
  sample_size = 40;

  retrieveFromDB(soros_ferguson, sample_size, function(sample_set0) {
    retrieveFromDB(spaceballs_sequel, sample_size, function(sample_set1) {
      tValue = ss.tTestTwoSample(sample_set0[1], sample_set1[1], 0);
      console.log(tValue);
    });
  });
}

// Find impact score data

// function statsImpact(collection, sample_size) {
//   findImpactScores(collection, sample_size, function(dataset) {
//     basicStats(sample_set);
//   });
// }

// // Find follower counts data

// function statsFollowers(collection, sample_size) {
//   findFollowerCounts(collection, sample_size, function(dataset) {
//     basicStats(sample_set);
//   });
// }

// Return the impact scores of sample_size documents from database

function retrieveFromDB(collection, sample_size, callback) {
  randomIndices = [];
  random_sample = [];
  rand_impact_scores = [];
  rand_follower_counts = [];

  collection.find({}, 'impact_score followers_count', function (err, dataset) {
    
    while(randomIndices.length < sample_size){
      randomnumber = Math.ceil(Math.random() * (dataset.length - 1))
      found = false;

      for(i = 0; i < randomIndices.length; i++) {
        if(randomIndices[i] == randomnumber) {
          found = true;
          break
        }
      }

      if(!found)randomIndices[randomIndices.length] = randomnumber;
    }

    console.log(randomIndices);

    for(i = 0; i < randomIndices.length; i++) {
      score = parseFloat(dataset[randomIndices[i]].impact_score);

      if (isNaN(score)) {
        rand_impact_scores[i] = 0;
      } else {
        rand_impact_scores[i] = score;
      }

      rand_follower_counts[i] = dataset[randomIndices[i]].followers_count;
    }

    random_sample = [randomIndices, rand_impact_scores, rand_follower_counts];

    callback(random_sample);
  });
}

// Generate unique, random indices

function randomIndices(sample_size, table_size) {
  arr = []

  while(arr.length < sample_size){
    randomnumber = Math.ceil(Math.random() * (table_size - 1))
    found = false;

    for(i = 0; i < arr.length; i++) {
      if(arr[i] == randomnumber) {
        found = true;
        break
      }
    }

    if(!found)arr[arr.length] = randomnumber;
  }

  return(arr);
}

// Start the Web Server on port 3000.

// var server = app.listen(3000, function() {
//   var host = server.address().address;
//   var port = server.address().port;

//   console.log('Server app listening at http://localhost:%s', port);
// });