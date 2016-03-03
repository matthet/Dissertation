
// NPM Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var Twitter = require('twitter');
var cookieParser = require('cookie-parser');
var http = require('http');
var fs = require('fs');

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

filepath = "Output.txt";
tweet_divider = "--------------------------"
sub_div = "~~~~~"

fs.writeFile(filepath , 'Rumour Output \n' + tweet_divider + '\n', function(err) {
  if(err) {
    return console.log(err);
  }

  console.log("Output.txt was created!");
}); 

app.post('/tweet', function(req, res) {

  client.post('statuses/update', {status: 'Testing!'},  function(error, tweet, response){
    
    if(error) throw error;

    console.log(tweet);  // Tweet body. 
    console.log(response);  // Raw response object. 
  });  
});

// Search API

app.get('/search', function(req, res) {

  q = "apple march 18th";

  client.get('search/tweets', {q: q, count: 100}, function(error, tweets, response){
    match_count = 0;

    for (i = 0; i < tweets.statuses.length; i++) {
      tweet_text = JSON.stringify(tweets.statuses[i].text);
      
      if ((tweet_text.search(/apple/i)) != -1 && (tweet_text.search(/march 18th/i)) != -1){
        tweet_number = match_count + 1;
        tweet_string = tweet_number + '.\n' + tweet_divider + '\n' + parseTweet(tweets.statuses[i]);

        fs.appendFile(filepath, tweet_string, function (err) {
          if(err) {
            return console.log(err);
          }

        console.log("tweet added to Output.txt!");
        });
        match_count += 1;
      }
    }
  });
});

// Streaming API

app.get('/stream', function(req, res) {

  track = "apple march 18th";

  client.stream('statuses/filter', {track: track}, function(stream) {
    stream.on('data', function(tweet) {

      tweet_string = parseTweet(tweet);

      fs.appendFile(filepath, tweet_string, function (err) {
        if(err) {
          return console.log(err);
        }

        console.log("tweet added to Output.txt!");
      }); 
    });
 
    stream.on('error', function(error) {
      throw error;
    });
  });
});

// Parse relevant data including impact features from Tweet
function parseTweet(tweet) {

  tweet_id = JSON.stringify(tweet.id);
  tweet_text = JSON.stringify(tweet.text);

  // Impact / Engagement
  favorite_count = JSON.stringify(tweet.favorite_count);
  retweet_count = JSON.stringify(tweet.retweet_count);

  // Tweet features for analysis
  tweet_location = tweet.place ? JSON.stringify(tweet.place.full_name) : tweet.place;
  tweet_createdAt = JSON.stringify(tweet.created_at);
  entities_hashtags = JSON.stringify(tweet.entities.hashtags) == '[]' ? false : true;
  entities_urls = JSON.stringify(tweet.entities.urls) == '[]' ? false : true;
  entities_user_mentions = JSON.stringify(tweet.entities.user_mentions) == '[]' ? false : true;
  entities_media = tweet.entities.media ? true : false;
  word_retweet = tweet_text.search(/retweet/i) > -1 ? true : false;
  abbrev_RT = tweet_text.search(/RT/) > -1 ? true : false;
  question_mark = tweet_text.indexOf('?') > -1 ? true : false;
  explanation_mark = tweet_text.indexOf('!') > -1 ? true : false;
  quote = tweet.text.replace(/[^\""]/g, "").length == 2 ? true : false;
  smiling_emoticon = tweet_text.indexOf(':)') > -1 ? true : false;
  default_profile = JSON.stringify(tweet.user.default_profile);
  default_profile_image = JSON.stringify(tweet.user.default_profile_image);
  user_createdAt = JSON.stringify(tweet.user.created_at);
  followers_count = JSON.stringify(tweet.user.followers_count);
  friends_count = JSON.stringify(tweet.user.friends_count);
  statuses_count = JSON.stringify(tweet.user.statuses_count);
  account_location = JSON.stringify(tweet.user.location);
  account_verified = JSON.stringify(tweet.user.verified);

  tweet_string = 'ID: ' + tweet_id + '\n' + 
                 'Text: ' + tweet_text + '\n' + 
                 sub_div + '\n' +
                 'Favourite Count: ' + favorite_count + '\n' + 
                 'Retweet Count: ' + retweet_count + '\n' + 
                 sub_div + '\n' +
                 'Tweet Location: ' + tweet_location + '\n' + 
                 'Tweet Time: ' + tweet_createdAt + '\n' + 
                 'Tweet Length: ' + tweet.text.length + '\n' + 
                 'Hashtags: ' + entities_hashtags + '\n' + 
                 'URLs: ' + entities_urls + '\n' +
                 'User Mentions: ' + entities_user_mentions + '\n' + 
                 'Media: ' + entities_media + '\n' + 
                 '\'Retweet\': ' + word_retweet + '\n' + 
                 '\'RT\': ' + abbrev_RT + '\n' + 
                 'Question Mark: ' + question_mark + '\n' + 
                 'Explanation Mark: ' + explanation_mark + '\n' + 
                 'Quote: ' + quote + '\n' + 
                 'Smiling Emoticon: ' + smiling_emoticon + '\n' + 
                 'Default Profile: ' + default_profile + '\n' +
                 'Default Profile Image: ' + default_profile_image + '\n' + 
                 'User Created At: ' + user_createdAt + '\n' + 
                 'Followers Count: ' + followers_count + '\n' + 
                 'Friends Count: ' + friends_count + '\n' +
                 'Statuses Count: ' + statuses_count + '\n' + 
                 'Account Location: ' + account_location + '\n' + 
                 'Account Verified: ' + account_verified + '\n' + 
                 tweet_divider + '\n';

  return (tweet_string);
}

// Start the Web Server on port 3000
var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Server app listening at http://localhost:%s', port);
});