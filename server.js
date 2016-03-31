
// NPM Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var Twitter = require('twitter');
var cookieParser = require('cookie-parser');
var http = require('http');
var fs = require('fs');

var dbConfig = require('./db');
var mongoose = require('mongoose');

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
var khloe_father = require('./models/khloe_father');
var kim_doppelganger = require('./models/kim_doppelganger');
var rob_blac = require('./models/rob_blac');
var jenner_lips = require('./models/kylie_jenner_lips');
var evans_arrested = require('./models/evans_arrested');
var poppins_sequel = require('./models/mary_poppins_sequel');
var kim_butt = require('./models/kim_fake_butt');
var kim_divorce = require('./models/kim_divorce');
var gunz_vasectomy = require('./models/gunz_vasectomy');

var Rumour = require('./models/mary_poppins_sequel');

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

textBasedFeatureAnalysis();

// Search API.

app.get('/search', function(req, res) {
  q = "peter gunz vasectomy";
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

    if ((tweet_text.search(/peter gunz/i)) && (tweet_text.search(/vasectomy/i))){
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
  stats = '';

  mean = ss.mean(sample_set);
  median = ss.median(sample_set);
  variance = ss.variance(sample_set);
  standardDev = ss.standardDeviation(sample_set);

  stats += 'MEAN: ' + mean + '\n';
  stats += 'MEDIAN: ' + median + '\n';
  stats += 'variance: ' + variance + '\n';
  stats += 'standardDeviation: ' + standardDev + '\n';

  return (stats);
}

// T-test: A two-sample location test of the null hypothesis such that the means of two populations are equal.
// Interested in finding statistical significance in rumour datasets.

function tTest() {
  sample_size = 40;
  output = 'Rumour A: kim_divorce, Rumour B: rob_blac\nSample Size: ' + sample_size + '\n\n' ;

  retrieveFromDB(kim_divorce, sample_size, function(sample_set0) {
    retrieveFromDB(rob_blac, sample_size, function(sample_set1) {
      tValue = ss.tTestTwoSample(sample_set0[1], sample_set1[1], 0);

      output += 'A indices: ' + sample_set0[0] + '\nB indices: ' + sample_set1[0] + '\n\n';
      output += 'T-value: ' + tValue + '\n\n';
      output += 'Rumour A Stats: \nImpact Scores: \n' + basicStats(sample_set0[1]) + '\n\nFollower Counts: \n' + basicStats(sample_set0[2]);
      output += '\n\nRumour B Stats: \nImpact Scores: \n' + basicStats(sample_set1[1]) + '\n\nFollower Counts: \n' + basicStats(sample_set1[2]); 

      writeToFile("output.txt", output);
    });
  });
}

// Find mean impact score and followers count of complete rumour set excluding verified accounts

function totalMeanImpactAndFollowers() {
  impact_set = [];
  followers_set = [];
  verified_count = 0;
  j = 0;

  Rumour.find({}, 'impact_score followers_count account_verified', function (err, dataset) {
    for(i = 0; i < dataset.length; i++) { 
      verified = dataset[i].account_verified;

      if (verified == 'true') { 
        verified_count += 1;
      } else {
        impact_score = parseFloat(dataset[i].impact_score);

        if (isNaN(impact_score)) {
          impact_set[j] = 0;
        } else {
          impact_set[j] = impact_score;
        }

        followers_set[j] = parseFloat(dataset[i].followers_count);
        j += 1;
      }
    }

    console.log('No. Verified Accounts: ' + verified_count);
    console.log('MEAN IMPACT: ' + ss.mean(impact_set));
    console.log('MEAN FOLLOWERS: ' + ss.mean(followers_set));
  });
}

// Return the impact scores of sample_size documents from database

function retrieveFromDB(collection, sample_size, callback) {
  randomIndices = [];
  random_sample = [];
  rand_impact_scores = [];
  rand_follower_counts = [];
  j = 0;

  collection.find({}, 'impact_score followers_count', function (err, dataset) {
    
    // Select unique, random indices to pull random tweets from rumour set.
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

    for(i = 0; i < randomIndices.length; i++) {
      verified = dataset[i].account_verified;

      if (verified == 'true') { 
        console.log('excluded verified');
      } else {
        score = parseFloat(dataset[randomIndices[i]].impact_score);

        if (isNaN(score)) {
          rand_impact_scores[j] = 0;
        } else {
          rand_impact_scores[j] = score;
        }

        rand_follower_counts[j] = parseFloat(dataset[randomIndices[i]].followers_count);
        j += 1;
      }
    }

    random_sample = [randomIndices, rand_impact_scores, rand_follower_counts];

    callback(random_sample);
  });
}

// ------------------------------------------- Feature analysis -----------------------------------------------------------//

// Extract the text of all tweets in rumour set and write to file.

function readTweetText() {
  tweets = '';

  Rumour.find({}, 'text', function (err, dataset) {
    for(i = 0; i < dataset.length; i++) {
      tweets += ((i+1) + '. ' + dataset[i].text + '\n\n');
    }

    writeToFile("tweet_texts", tweets);
  });
}

// Extract the text based feature data of all tweets in rumour set and write analysis to file.

function textBasedFeatureAnalysis() {
  have_hashtags = 0;
  have_media = 0;
  have_urls = 0;
  have_user_mentions = 0;
  have_word_retweet = 0;
  have_all_caps = 0;
  have_question_mark = 0;
  have_explanation_mark = 0
  have_quote = 0;
  have_smiling_emoticon = 0;
  tweet_lengths = [];

  textBased = '';

  Rumour.find({}, 
    'text entities_hashtags entities_media entities_urls entities_user_mentions word_retweet all_caps question_mark explanation_mark quote smiling_emoticon', 
      function (err, dataset) {

        for(i = 0; i < dataset.length; i++) {
          if (dataset[i].entities_hashtags == 'true') { have_hashtags += 1; }
          if (dataset[i].entities_media == 'true') { have_media += 1; }
          if (dataset[i].entities_urls == 'true') { have_urls += 1; }
          if (dataset[i].entities_user_mentions == 'true') { have_user_mentions += 1; }
          if (dataset[i].word_retweet == 'true') { have_word_retweet += 1; }
          if (dataset[i].all_caps == 'true') { have_all_caps += 1; }
          if (dataset[i].question_mark == 'true') { have_question_mark += 1; }
          if (dataset[i].explanation_mark == 'true') { have_explanation_mark += 1; }
          if (dataset[i].quote == 'true') { have_quote += 1; }
          if (dataset[i].smiling_emoticon == 'true') { have_smiling_emoticon += 1; }
          tweet_lengths[i] = parseFloat(dataset[i].text.length);
        }

        textBased = 'TOTAL POPULATION: ' + dataset.length + '\n' +
                    'HASHTAGS: ' + have_hashtags + '\n' +
                    'MEDIA: ' + have_media + '\n' +
                    'URLS: ' + have_urls + '\n' +
                    'USER MENTIONS: ' + have_user_mentions + '\n' +
                    'WORD RETWEET: ' + have_word_retweet + '\n' +
                    'ALL CAPS: ' + have_all_caps + '\n' +
                    'QUESTION MARK: ' + have_question_mark + '\n' +
                    'EXPLANATION MARK: ' + have_explanation_mark + '\n' +
                    'QUOTE: ' + have_quote + '\n' +
                    'SMILING EMOTICON: ' + have_smiling_emoticon + '\n' + 
                    'AVERAGE TWEET LENGTH: ' + ss.mean(tweet_lengths);

        writeToFile("text_based_features", textBased);
  });
}

// ------------------------------------------- Helper Functions -----------------------------------------------------------//

function writeToFile(file_name, output) {
  fs.writeFile(file_name, output, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
  });
}

// Start the Web Server on port 3000.

// var server = app.listen(3000, function() {
//   var host = server.address().address;
//   var port = server.address().port;

//   console.log('Server app listening at http://localhost:%s', port);
// });