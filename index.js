const fs = require('fs');
const fetchTimeline = require('fetch-timeline');
const { IncomingWebhook } = require('@slack/webhook');

require('dotenv').config();
const webhook = new IncomingWebhook(process.env.SLACK_URL);

const params = {
    screenName: process.env.TWITTER_ACCOUNT,
    count: 2,
};

const opts = {
    credentials: {
        consumerKey:       process.env.TWITTER_CONSUMER_KEY,
        consumerSecret:    process.env.TWITTER_CONSUMER_SECRET,

        // must be for a user that can see TWITTER_ACCOUNT's tweets
        accessToken:       process.env.TWITTER_ACCESS_TOKEN,
        accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    },
    limit: 10,
    limitDays: 7
};

// @todo failsafe if file not found
const seenFile = './seen.txt';
const seen = fs.readFileSync(seenFile, 'utf-8').split('\n').filter(Boolean).map(n => parseInt(n, 10));
const stream = fetchTimeline(params, opts);

stream.on('data', (tweet, index) => {
    // only care about new tweets with attached media
    if (!seen.includes(tweet.id) && tweet.extended_entities.media) {
        console.log(`New tweet ${tweet.id}`);
        seen.push(tweet.id);

        // loop through all media
        tweet.extended_entities.media.forEach((media) => {
            if (media.type == 'video') {
                // get max bitrate video
                let videoUrl =  media.video_info.variants
                    .filter(v => v.content_type == 'video/mp4')
                    .sort((a, b) => b.bitrate > a.bitrate)[0].url;

                console.log(`Found video: ${videoUrl}`);

                webhook.send({
                    text: videoUrl,
                });
            }
        });
    }
});

stream.on('info', () => {
    console.log('Saving list of tweets seen so far');
    fs.writeFileSync(seenFile, seen.join('\n'));
});
