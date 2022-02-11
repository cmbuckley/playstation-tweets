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

const seenFile = __dirname + '/seen.txt';
const seen = fs.readFileSync(seenFile, {
    encoding: 'utf-8',
    flag: 'a+',
}).split('\n').filter(Boolean).map(n => parseInt(n, 10));

// update the link in the text
function linkify(text, item, link) {
    return text.slice(0, item.indices[0]) + (link || '') + text.slice(item.indices[1]);
}

// replace hashtags and urls in the tweet text with the extended form
// also removes media links (for a video tweet this is a preview image)
function tweetText(tweet) {
    let entities = [];

    ['hashtags', 'urls', 'media'].forEach(type => {
        tweet.entities[type].forEach(entity => {
            entities.push({
                index: entity.indices[0],
                entity, type
            });
        });
    });

    // replace latest entity first to maintain earlier indices
    return entities.sort((a, b) => b.index - a.index).reduce((text, {entity, type}) => {
        return linkify(text, entity, {
            hashtags: `<https://twitter.com/hashtag/${entity.text}|#${entity.text}>`,
            urls:     `<${entity.expanded_url}|${entity.display_url}>`,
        }[type]);
    }, tweet.text);
}

console.log('Initialising fetch loop');

setInterval(() => {
    let seenNew = false;

    fetchTimeline(params, opts).on('data', tweet => {
        // only care about new tweets with attached media
        if (!seen.includes(tweet.id)) {
            console.log(`New tweet ${tweet.id}`);
            seen.push(tweet.id);
            seenNew = true;

            if (tweet.extended_entities && tweet.extended_entities.media) {
                console.log('Tweet contains media; checking for videos');

                // loop through all media
                tweet.extended_entities.media.forEach(media => {
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
                                    file:            Buffer.concat(data),
                                    filename:        'video.mp4',
                                    channels:        process.env.SLACK_CHANNEL,
                                    initial_comment: tweetText(tweet),
                                });
                            });
                        });
                    }
                });
            }
        }
    }).on('info', () => {
        if (seenNew) {
            console.log('Saving list of tweets seen so far');
            fs.writeFileSync(seenFile, seen.join('\n'));
        }
    }).on('error', (e) => {
        console.error('Fetch timeline error: ' + e);
    });
}, 5000);
