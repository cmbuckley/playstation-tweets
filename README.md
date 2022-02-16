# PlayStation Tweets

Grab photos/videos from a private Twitter account and share them on Slack.

Because this accesses a private account, the Twitter stream cannot be used, but instead it can poll the [user_timeline](https://developer.twitter.com/en/docs/twitter-api/v1/tweets/timelines/api-reference/get-statuses-user_timeline) API every 5 seconds.

## API Keys

Credentials should be placed in a `.env` file or in the environment as normal.

### Twitter

Sign up for the developer account and create a project here: https://developer.twitter.com/en/docs/twitter-api/getting-started/getting-access-to-the-twitter-api

* `TWITTER_ACCOUNT`
* `TWITTER_CONSUMER_KEY`
* `TWITTER_CONSUMER_SECRET`
* `TWITTER_ACCESS_TOKEN`
* `TWITTER_ACCESS_TOKEN_SECRET`

### Slack

* `SLACK_TOKEN` - e.g. `'xoxb-XXX'`
* `SLACK_CHANNEL` - the bot must be a member of this channel
