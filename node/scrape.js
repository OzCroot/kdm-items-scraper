const fs = require('fs/promises');
const { existsSync } = require('fs');
const root = require('./pageRoot');

(async () => {
  const rootData = await root();

  if (!existsSync('./dist')) {
    await fs.mkdir('./dist');
  }

  await fs.writeFile(
    './dist/root.json',
    JSON.stringify(rootData, null, 2),
    'utf-8'
  );
})();
