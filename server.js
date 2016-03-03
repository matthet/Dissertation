
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
divider = "--------------------------"
fs.writeFile(filepath , 'Rumour Output \n' + divider + '\n', function(err) {
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

  q = "iwatch2";

  client.get('search/tweets', {q: q, count: 100}, function(error, tweets, response){
    match_count = 0;

    for (i = 0; i < tweets.statuses.length; i++) {
      tweet_text = JSON.stringify(tweets.statuses[i].text);

      tweet_number = match_count + 1;
        tweet_string = tweet_number + '.\n' + divider + '\n' + parseTweet(tweets.statuses[i]);

        fs.appendFile(filepath, tweet_string, function (err) {
          if(err) {
            return console.log(err);
          }

        console.log("tweet added to Output.txt!");
        });
        match_count += 1;
      
      // if ((tweet_text.search(/apple/i)) != -1 && (tweet_text.search(/march 18th/i)) != -1){
      //   tweet_number = match_count + 1;
      //   tweet_string = tweet_number + '.\n' + divider + '\n' + parseTweet(tweets.statuses[i]);

      //   fs.appendFile(filepath, tweet_string, function (err) {
      //     if(err) {
      //       return console.log(err);
      //     }

      //   console.log("tweet added to Output.txt!");
      //   });
      //   match_count += 1;
      // }
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

  // Impact features
  tweet_location = tweet.place ? JSON.stringify(tweet.place.full_name) : tweet.place;
  tweet_createdAt = JSON.stringify(tweet.created_at);
  entities_hashtags = JSON.stringify(tweet.entities.hashtags);
  entities_urls = JSON.stringify(tweet.entities.urls);
  entities_user_mentions = JSON.stringify(tweet.entities.user_mentions);
  entities_media = tweet.entities.media ? JSON.stringify(tweet.entities.media[0].media_url) : tweet.entities.media;
  question_mark = tweet_text.indexOf('?') > -1 ? true : false;
  smiling_emoticon = tweet_text.indexOf(':)') > -1 ? true : false;
  favorite_count = JSON.stringify(tweet.favorite_count);
  retweet_count = JSON.stringify(tweet.retweet_count);
  default_profile = JSON.stringify(tweet.user.default_profile);
  default_profile_image = JSON.stringify(tweet.user.default_profile_image);
  user_createdAt = JSON.stringify(tweet.user.created_at);
  followers_count = JSON.stringify(tweet.user.followers_count);
  friends_count = JSON.stringify(tweet.user.friends_count);
  statuses_count = JSON.stringify(tweet.user.statuses_count);
  account_location = JSON.stringify(tweet.user.location);
  account_verified = JSON.stringify(tweet.user.verified);

  tweet_string = 'ID: ' + tweet_id + '\n' + 
                 'Text:' + tweet_text + '\n' + 
                 'Tweet Location: ' + tweet_location + '\n' + 
                 'Tweet Created At: ' + tweet_createdAt + '\n' + 
                 'Hashtags: ' + entities_hashtags + '\n' + 
                 'URLs: ' + entities_urls + '\n' +
                 'User Mentions: ' + entities_user_mentions + '\n' + 
                 'Media: ' + entities_media + '\n' + 
                 'Question Mark: ' + question_mark + '\n' + 
                 'Smiling Emoticon: ' + smiling_emoticon + '\n' + 
                 'Favorite Count: ' + favorite_count + '\n' + 
                 'Retweet Count: ' + retweet_count + '\n' + 
                 'Default Profile: ' + default_profile + '\n' +
                 'Default Profile Image: ' + default_profile_image + '\n' + 
                 'User Created At: ' + user_createdAt + '\n' + 
                 'Followers Count: ' + followers_count + '\n' + 
                 'Friends Count: ' + friends_count + '\n' +
                 'Statuses Count: ' + statuses_count + '\n' + 
                 'Account Location: ' + account_location + '\n' + 
                 'Account Verified: ' + account_verified + '\n' + 
                 divider + '\n';

  return (tweet_string);
}

// Start the Web Server on port 3000
var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Server app listening at http://localhost:%s', port);
});