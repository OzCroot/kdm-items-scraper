const fs = require('fs/promises');
const { existsSync } = require('fs');
const getItem = require('./pageItem');
const data = require('../dist/root.json');
const chalk = require('chalk');
const wait = require('./wait');

const content = { ...data.content };

(async () => {
  const keys = Object.keys(content);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const section = content[key];

    for (let u = 0; u < section.items.length; u++) {
      const item = section.items[u];
      const itemData = await getItem(item);
      section.items[u] = { ...item, ...itemData };
      console.log(chalk.grey(`${item.name} scraped.`));
    }

    // Hack to get around session lock.
    console.log(chalk.green(`Completed ${section.name} in ${section.parent}`));
    await wait(5e3);
  }

  if (!existsSync('./dist')) {
    await fs.mkdir('./dist');
  }

  await fs.writeFile(
    './dist/items.json',
    JSON.stringify(content, null, 2),
    'utf-8'
  );
  console.log('items.json created');
})();
