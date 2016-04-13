
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
var soros_ferguson = require('./models/soros_ferguson');
var splenda_unsafe = require('./models/splenda_unsafe');
var gilt_shot = require('./models/gilt_shot');
var obama_pay_increase = require('./models/obama_pay_increase');
var ford_trump = require('./models/ford_trump');
var spaceballs_sequel = require('./models/spaceballs_sequel');
var khloe_father = require('./models/khloe_father');
var kim_doppelganger = require('./models/kim_doppelganger');
var rob_blac = require('./models/rob_blac');
var jenner_lips = require('./models/kylie_jenner_lips');
var evans_arrested = require('./models/evans_arrested');
var kim_divorce = require('./models/kim_divorce');

var Rumour = require('./models/jenner_pregnant');

var ss = require('simple-statistics');

// // Connect to DB
mongoose.connect(dbConfig.url);

// Server config
var app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded 
app.use(cookieParser());

// Render the static files in the public directory from the root
app.use('/', express.static('public'));

var client = new Twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});

// ------------------------------------------- APP functions ------------------------------------------------------------//

// Stats: Impact and Followers 

app.get('/impact', function(req, res) {

  model = './models/' + req.query.rumour;
  collection = require(model);

  totalMeanImpactAndFollowers(collection, function(impact_stats) {
    textBasedFeatureAnalysis(collection, function(text_stats) {
      accountBasedFeatureAnalysis(collection, function(account_stats) {
        to_send = JSON.parse(impact_stats).concat(JSON.parse(text_stats));
        to_send = to_send.concat(JSON.parse(account_stats));
        res.send(to_send);
        console.log("Stats sent!");
      });
    });
  });
});

// Stats: Text Based Features

app.get('/text', function(req, res) {
  textBasedFeatureAnalysis(function(text_stats) {
    res.send(JSON.parse(text_stats));
    console.log("Text stats sent!");
  });
});

// Stats: Account Based Features

app.get('/account', function(req, res) {
  accountBasedFeatureAnalysis(function(account_stats) {
    res.send(JSON.parse(account_stats));
    console.log("Account stats sent!");
  });
});

// Search API.

app.get('/search', function(req, res) {
  q = "starbucks";

  findLowestID(function(lowest_id) {
    client.get('search/tweets', {q: q, exclude: 'retweets', max_id: lowest_id, count: 100}, function(error, tweets, response){
      tweets_received = tweets.statuses.length;
      console.log('Tweets received: ' + tweets_received);
      res.send(tweets_received.toString());

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

// -------------------------------------------- DB functions ------------------------------------------------------------//

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

    if ((tweet_text.search(/starbucks/i))){
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

function selectCollection(rumour) {
  var collection;

  if (rumour == "kim_divorce"){
    collection = kim_divorce;
  }
  return collection;
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

function totalMeanImpactAndFollowers(collection, callback) {
  impact_set = [];
  followers_set = [];
  total_impact = 0;
  total_followers = 0;
  j = 0;
  result = [];

  collection.find({}, 'impact_score followers_count', function (err, dataset) {
    for(i = 0; i < dataset.length; i++) { 

      impact_score = parseFloat(dataset[i].impact_score);

      if (isNaN(impact_score)) {
        impact_set[j] = 0;
        total_impact += 0;
      } else {
        impact_set[j] = impact_score;
        total_impact += impact_score;
      }

      num_followers = parseFloat(dataset[i].followers_count);
      followers_set[j] = num_followers;
      total_followers += num_followers;
      j += 1;
    }

    total_impact = 'TOTAL IMPACT: ' + total_impact.toFixed(2);
    total_followers = 'TOTAL FOLLOWERS: ' + total_followers.toFixed(2);
    mean_impact = 'MEAN IMPACT: ' + ss.mean(impact_set).toFixed(2);
    mean_followers = 'MEAN FOLLOWERS: ' + ss.mean(followers_set).toFixed(2);

    result.push({total_impact});
    result.push({total_followers});
    result.push({mean_impact});
    result.push({mean_followers});

    callback(JSON.stringify(result));
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
      tweets += ((i+1) + '. ' + dataset[i].text.substring(1, (dataset[i].text.length -1)) + '\n\n');
    }

    writeToFile("tweet_texts", tweets);
  });
}

// Extract the text based feature data of all tweets in rumour set and write analysis to file.

function textBasedFeatureAnalysis(collection, callback) {
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

  result = [];

  collection.find({}, 
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
          tweet_lengths[i] = parseFloat(dataset[i].text.length) - 2; // don't count \" characters present due to saving as string in DB
        }

        total_pop = 'TOTAL POPULATION: ' + dataset.length;
        num_hashtags = 'HASHTAGS: ' + have_hashtags;
        num_media = 'MEDIA: ' + have_media;
        num_urls = 'URLS: ' + have_urls;
        num_mentions = 'USER MENTIONS: ' + have_user_mentions;
        num_retweet = 'WORD RETWEET: ' + have_word_retweet;
        num_caps = 'ALL CAPS: ' + have_all_caps;
        num_q = 'QUESTION MARK: ' + have_question_mark;
        num_e = 'EXPLANATION MARK: ' + have_explanation_mark;
        num_quote = 'QUOTE: ' + have_quote;
        num_smile = 'SMILING EMOTICON: ' + have_smiling_emoticon;
        av_length = 'AVERAGE TWEET LENGTH: ' + ss.mean(tweet_lengths).toFixed(2);

        // textBased = 
        // writeToFile("text_based_features", textBased);

        result.push({total_pop});
        result.push({num_hashtags});
        result.push({num_media});
        result.push({num_urls});
        result.push({num_mentions});
        result.push({num_retweet});
        result.push({num_caps});
        result.push({num_q});
        result.push({num_e});
        result.push({num_quote});
        result.push({num_smile});
        result.push({av_length});

        callback(JSON.stringify(result));
  });
}

// Extract the account based feature data of all tweets in rumour set and write analysis to file.

function accountBasedFeatureAnalysis(collection, callback) {
  accountBased = '';
  total_account_created_years = [];
  total_followers_count = [];
  total_friends_count = [];
  total_statuses_count = [];
  total_default_profiles = 0;
  total_default_profos = 0;
  total_verified_accounts = 0;

  result = [];

  collection.find({}, 
    'user_createdAt followers_count friends_count statuses_count account_verified default_profile default_profile_image', 
      function (err, dataset) {
        for(i = 0; i < dataset.length; i++) {
          total_account_created_years[i] = parseFloat(dataset[i].user_createdAt.substring(27, 31));
          total_followers_count[i] = parseFloat(dataset[i].followers_count);
          total_friends_count[i] = parseFloat(dataset[i].friends_count);
          total_statuses_count[i] = parseFloat(dataset[i].statuses_count);
          if (dataset[i].default_profile == 'true') { total_default_profiles += 1; }
          if (dataset[i].default_profile_image == 'true') { total_default_profos += 1; }
          if (dataset[i].account_verified == 'true') { total_verified_accounts += 1; }
        }

        total_pop = 'TOTAL POPULATION: ' + dataset.length;
        av_accYear = 'Av. account creation year: ' + Math.round(ss.mean(total_account_created_years));
        av_followers = 'Av. followers count: ' + ss.mean(total_followers_count).toFixed(2);
        av_friends = 'Av. friends count: ' + ss.mean(total_friends_count).toFixed(2);
        av_statuses = 'Av. statuses count: ' + ss.mean(total_statuses_count).toFixed(2);
        num_defPro = 'Num. default profiles: ' + total_default_profiles; 
        num_defAv = 'Num. default avatars: ' + total_default_profos; 
        num_ver = 'Num. verified accounts in set: ' + total_verified_accounts; 

        //accountBased = 
        // writeToFile("account_based_features", accountBased); 

        result.push({total_pop});
        result.push({av_accYear});
        result.push({av_followers});
        result.push({av_friends});
        result.push({av_statuses});
        result.push({num_defPro});
        result.push({num_defAv});
        result.push({num_ver});

        callback(JSON.stringify(result));
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

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});