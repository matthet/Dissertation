
// NPM Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var Twitter = require('twitter');
var cookieParser = require('cookie-parser');
var http = require('http');
var fs = require('fs');

var dbConfig = require('./db');
var mongoose = require('mongoose');

var Notebook = require('./models/rumour_document');

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
  consumer_key: 'HlNfATf1c9krHIygrXWcP4iOx',
  consumer_secret: '9vBm0ArMCdZkLX8zd2dEvo9Z1BEJ587N5pAlsCfPEZPFr52N60',
  access_token_key: '4406506943-vbpupRIs13PnkvzJQcyDT77IMiKuyEuWZX0e6IY',
  access_token_secret: 'nXVGLvAlcPT5GNgEEDLe0yvFsXewBY7xZAd94yeDOw5ee'
});

app.post('/tweet', function(req, res) {

  client.post('statuses/update', {status: 'Testing!'},  function(error, tweet, response){
    
    if(error) throw error;

    console.log(tweet);  // Tweet body. 
    console.log(response);  // Raw response object. 
  });  
});

// Streaming API

app.get('/stream', function(req, res) {
  track = "apple march 18th";

  client.stream('statuses/filter', {track: track}, function(stream) {
    stream.on('data', function(tweet) {

      tweet_string = parseTweet(tweet);
      console.log(JSON.stringify(tweet));

      // fs.appendFile(filepath, tweet_string, function (err) {
      //   if (err) {
      //     return console.log(err);
      //   }

      //   console.log("tweet added to Output.txt!");
      // }); 
    });
 
    stream.on('error', function(error) {
      throw error;
    });
  });
});

// Initialise search, making first request to search API

app.get('/search', function(req, res) {
  q = "notebook sequel";
  run_number = 0;
  total_tweets = 0;

  for (i = run_number; i < 1; i++) {
    client.get('search/tweets', {q: q, exclude: 'retweets', count: 10}, function(error, tweets, response){
      tweets_received = tweets.statuses.length;
      console.log('Tweets received: ' + tweets_received);

      if (tweets_received != 0) {
        analyseRumourHits(tweets);
      }
    });
  }
});

// Find rumour hits from messages returned by the Search API.

function analyseRumourHits(tweets) {
  file_string = "";

  for (i = 0; i < tweets.statuses.length; i++) {
    tweet_text = JSON.stringify(tweets.statuses[i].text);

    if ((tweet_text.search(/notebook/i)) && (tweet_text.search(/sequel/i))){
      //duplicate = checkDatabase(tweets.statuses[i].id);

      Notebook.findOne({'id': tweets.statuses[i].id}, 'id text', function (err, duplicate) {
        if (err) return handleError(err);

        if (duplicate == null) {
          db_rumour = parseTweet(tweets.statuses[i]);
          addToDB(db_rumour);
        } else {
          console.log('duplicate tweet received');
        }
      })
    }
  }
}

// Parse relevant data including impact features from Tweet.

function parseTweet(tweet) {
  var rumour = new Notebook();

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
    console.log(rumour)
  });
}

// Start the Web Server on port 3000.

var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Server app listening at http://localhost:%s', port);
});