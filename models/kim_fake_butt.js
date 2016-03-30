var mongoose = require('mongoose');

module.exports = mongoose.model('kim_fake_butt_tweets',{
	id: String,
	text: String,
	impact_score: String,
	favorite_count: String,
	retweet_count: String,
	tweet_location: String,
	tweet_createdAt: String,
	entities_hashtags: String,
	entities_urls: String,
	entities_user_mentions: String,
	entities_media: String,
	word_retweet: String,
	all_caps: String,
	question_mark: String,
	exclamation_mark: String,
	quote: String,
	smiling_emoticon: String,
	default_profile: String,
	default_profile_image: String,
	user_createdAt: String,
	followers_count: String,
	friends_count: String,
	statuses_count: String,
	account_location: String,
	account_verified: String
});