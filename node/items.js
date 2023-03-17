const fs = require('fs/promises');
const getItem = require('./pageItem');
const data = require('../dist/root.json');
const chalk = require('chalk');
const wait = require('./wait');

(async () => {
  const keys = Object.keys(data.content);
  console.log('keys.length', keys.length);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const section = data.content[key];

    for (let u = 0; u < section.items.length; u++) {
      const item = section.items[u];
      const itemData = await getItem(item);
    }

    // Hack to get around session lock.
    console.log(chalk.yellow(`Finished ${section.name} in ${section.parent}`));
    await wait(5e3);
  }
})();
