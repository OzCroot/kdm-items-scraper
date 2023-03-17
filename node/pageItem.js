const chalk = require('chalk');
const puppeteer = require('puppeteer');
const config = require('./config');
const fs = require('fs/promises');
const { existsSync } = require('fs');

module.exports = async function item(item) {
  console.log(`Scraping: ${item.name} - ${item.link}`);
  if (item.link === null) return {};

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const regex =
    /(?=.*kingdomdeath\/images)(?!.*Site-logo)([A-Za-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))/;

  page.on('request', (request) => {
    if (request.isInterceptResolutionHandled()) return;

    const matches = regex.exec(request.url());
    const slashCount = ((request.url() || '').match(/\//g) || []).length;

    if (matches || slashCount === 4) request.continue();
    else request.abort();
  });

  page.on('response', async (response) => {
    const matches = regex.exec(response.url());
    if (matches) {
      const filename = /(\w+)(\.\w+)+(?!.*(\w+)(\.\w+)+)/.exec(response.url());
      const buffer = await response.buffer();
      /**
       * [
       *  'Bug_Trap.png',
       *  'Bug_Trap',
       *  '.png',
       * ]
       */

      if (!existsSync('./dist/images')) {
        await fs.mkdir('./dist/images');
      }

      try {
        await fs.writeFile(`./dist/images/${filename[0]}`, buffer, {
          flag: 'wx',
        });
        console.log(chalk.green(`File saved: ${filename[0]}`));
      } catch (err) {
        console.log(chalk.gray(`File exists: ${filename[0]}`));
      }
    }
  });

  await page.setRequestInterception(true);
  await page.goto(item.link, { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    const aside = document.querySelector('.portable-infobox');
    let link = null;
    let url = null;

    if (aside) {
      link = aside.querySelector('.image-thumbnail');
      // console.log(link.href);
      // url = images.find((response) => response.url() === link.href);
    }

    return { url: 123 };
  });

  await browser.close();

  return data;
};
