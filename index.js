const fs = require('fs');
const https = require('https');
const fetchTimeline = require('fetch-timeline');
const { WebClient } = require('@slack/web-api');

require('dotenv').config();

const token = process.env.SLACK_TOKEN;
const slack = new WebClient(token);

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
let seenNew = false;

const stream = fetchTimeline(params, opts);

stream.on('data', (tweet, index) => {
    // only care about new tweets with attached media
    if (!seen.includes(tweet.id) && tweet.extended_entities.media) {
        console.log(`New tweet ${tweet.id}`);
        seen.push(tweet.id);
        seenNew = true;

        // loop through all media
        tweet.extended_entities.media.forEach((media) => {
            if (media.type == 'video') {
                // get max bitrate video
                let videoUrl =  media.video_info.variants
                    .filter(v => v.content_type == 'video/mp4')
                    .sort((a, b) => b.bitrate > a.bitrate)[0].url;

                console.log(`Found video: ${videoUrl}`);
                https.get(videoUrl, (res) => {
                    const data = [];
                    res.on('data', c => data.push(c));

                    res.on('end', async () => {
                        console.log('Uploading video to Slack');
                        await slack.files.upload({
                            file:     Buffer.concat(data),
                            filename: 'video.mp4',
                            channels: process.env.SLACK_CHANNEL,
                        });
                    });
                });
            }
        });
    }
});

stream.on('info', () => {
    if (seenNew) {
        console.log('Saving list of tweets seen so far');
        fs.writeFileSync(seenFile, seen.join('\n'));
    }
});
