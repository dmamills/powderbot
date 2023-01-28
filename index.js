require('dotenv').config();
const fetch = require('node-fetch');
const chicopee = require('./chicopee');
const SLACK_HOOK = process.env.SLACK_HOOK;

const sendUpdate = async (blocks) => {
    const res = await fetch(SLACK_HOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blocks),
      }).then((response) => response.status);
}

(async () => {
    const chicopeeBlocks = await chicopee();
    await sendUpdate(chicopeeBlocks);
    process.exit(0);
})();