const root = require('./pageRoot');
const fs = require('fs/promises');

(async () => {
  const rootData = await root();

  await fs.mkdir('./dist');

  await fs.writeFile(
    './dist/root.json',
    JSON.stringify(rootData, null, 2),
    'utf-8'
  );
})();
