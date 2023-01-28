require('dotenv').config();
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const POWDER_SOURCE = 'https://www.discoverchicopee.com/activity-report';
const SLACK_HOOK = process.env.SLACK_HOOK;

const keys = {
    'sr-status': 'Status',
    'sr-date': 'Date',
    'sr-surface-cond': 'Surface',
    'sr-freestyle': 'Tricky?',
    'sr-natural-snow': 'Natty',
    'sr-lifts-open': 'Lifts',
    'sr-trails-open': 'Hits',
    'sr-average-base': 'Base',
    'sr-snow-making': 'Blowing?'
};

const fetchPowderUpdate = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.goto(POWDER_SOURCE);
    await page.waitForNetworkIdle()
    const el = await page.waitForSelector('.snow-report')
    const elements = Object.keys(keys).map(key => {
        return el.$(`.${key} > span`)
            .then((keyEl) => {
                return keyEl.evaluate(el => el.textContent);
            });
    });

    const resolved = await Promise.all(elements);
    const classes = Object.keys(keys);
    return resolved.map((value, idx) => {
        return { key: classes[idx], text: value.replace(/\n/g, '').replace(/ /g, '') };
    });
}

const generateBlock = (stat) => ({
    "type": "section",
    "text": {
        "type": "mrkdwn",
        "text": `*${keys[stat.key]}* ${stat.text}`
    }
});

const statsToSlackBlocks = (stats) => {
    return {
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":snowflake: das powder update :snowflake: "
                }
            },
            ...stats.map(generateBlock)
        ]
    }
}

const sendUpdate = async (blocks) => {
    const res = await fetch(SLACK_HOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blocks),
      }).then((response) => response.status);
}


(async () => {
    const stats = await fetchPowderUpdate();
    const blocks = statsToSlackBlocks(stats);
    await sendUpdate(blocks);
    process.exit(0);
})();