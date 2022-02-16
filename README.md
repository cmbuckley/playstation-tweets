# PlayStation Tweets

Grab photos/videos from a private Twitter account and share them on Slack.

Because this accesses a private account, the Twitter stream cannot be used, but instead it can poll the
[user_timeline](https://developer.twitter.com/en/docs/twitter-api/v1/tweets/timelines/api-reference/get-statuses-user_timeline)
API every 5 seconds, which is 180 requests in 15 min or 17,280 in 24 hours; well within the request limits.

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

Just relies on the [`files.upload`](https://api.slack.com/methods/files.upload) method to upload media directly,
but if more rich content is needed this would need to use a combination of the upload API with
[`files.sharedPublicURL`](https://api.slack.com/methods/files.sharedPublicURL) method
(see [this StackOverflow answer](https://stackoverflow.com/questions/58186399/how-to-create-a-slack-message-containing-an-uploaded-image)).

* `SLACK_TOKEN` - e.g. `'xoxb-XXX'`
* `SLACK_CHANNEL` - the bot must be a member of this channel
