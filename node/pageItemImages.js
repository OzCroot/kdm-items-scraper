const chalk = require('chalk');
const puppeteer = require('puppeteer');
const config = require('./config');
const fs = require('fs/promises');
const { existsSync } = require('fs');
const regex =
  /(?=.*kingdomdeath\/images)(?!.*Site-logo)([A-Za-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))/;

module.exports = async function item(item) {
  console.log(chalk.yellow(`Scraping: ${item.name}`) + ` - ${item.link}`);
  if (item.link === null) return {};

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // page.on('request', (request) => {
  //   if (request.isInterceptResolutionHandled()) return;

  //   const matches = regex.exec(request.url());
  //   const slashCount = ((request.url() || '').match(/\//g) || []).length;

  //   if (matches || slashCount === 4) request.continue();
  //   else request.abort();
  // });

  // page.on('response', async (response) => {
  //   const matches = regex.exec(response.url());
  //   if (matches) {
  //     const filename = /(\w+)(\.\w+)+(?!.*(\w+)(\.\w+)+)/.exec(response.url());
  //     const buffer = await response.buffer();

  //     if (!existsSync('./dist/images')) {
  //       await fs.mkdir('./dist/images');
  //     }

  //     try {
  //       await fs.writeFile(`./dist/images/${filename[0]}`, buffer, {
  //         flag: 'wx',
  //       });
  //       console.log(chalk.green(`File saved: ${filename[0]}`));
  //     } catch (err) {
  //       console.log(chalk.gray(`File exists: ${filename[0]}`));
  //     }
  //   }
  // });

  // await page.setRequestInterception(true);
  await page.goto(item.link, { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    const body = document.querySelector('.mw-parser-output');
    const aside = document.querySelector('.portable-infobox');
    const toc = document.querySelector('#toc');
    let cost = document.querySelector('#Cost');

    if (cost) {
      // #Cost is the span inside the <h3>
      cost = cost.parentElement;
    }

    const item = {
      image: null,
      description: [],
      keywords: [],
      specialRules: [],
      crafting: {
        description: null,
        cost: [],
      },
      defence: {
        location: null,
        armor: null,
      },
      stats: {
        speed: null,
        accuracy: null,
        strength: null,
      },
      links: {
        top: null,
        right: null,
        bottom: null,
        left: null,
      },
    };

    if (toc) {
      const el = toc.previousElementSibling;
      if (el && el.tagName.toLowerCase() === 'p') {
        item.info = el.innerText.replace(/\n/g, '');
      } else item.info = null;
    }

    if (body) {
      const titles = [...body.querySelectorAll('h2')];
      titles.forEach((el) => {
        switch (el.innerText) {
          case 'Card Text': {
            let nextEl = el.nextElementSibling;
            while (nextEl && nextEl.tagName.toLowerCase() !== 'h2') {
              item.description.push(nextEl.innerText.replace(/\n/g, ''));
              nextEl = nextEl.nextElementSibling;
            }
            break;
          }
          case 'Crafting Requirements': {
            let nextEl = el.nextElementSibling;

            if (nextEl) {
              item.crafting.description = nextEl.innerText.replace(/\n/g, '');
            }

            if (cost) {
              const p = cost.nextElementSibling;
              const ul = p.nextElementSibling;
              if (p.tagName.toLowerCase() === 'p') {
                item.crafting.required = p.innerText.trim();
              } else if (p.tagName.toLowerCase() === 'ul') {
                const lis = [...p.querySelectorAll('li')];
                lis.forEach((li) => {
                  item.crafting.cost.push(li.innerText.trim());
                });
              }
              if (ul && ul.tagName.toLowerCase() === 'ul') {
                const lis = [...ul.querySelectorAll('li')];
                lis.forEach((li) => {
                  item.crafting.cost.push(li.innerText.trim());
                });
              }
            }

            break;
          }
        }
      });
    }

    // Sidebar exists
    if (aside) {
      const link = aside.querySelector('.image-thumbnail');
      const statsGroup = aside.querySelector('.pi-horizontal-group');
      const accordionGroups = [...aside.querySelectorAll('.pi-item')];
      const hitLocation = aside.querySelector('[data-source="hit_location"]');
      const armorRating = aside.querySelector('[data-source="armor_rating"]');

      if (link && link.href) {
        const filename = /(\w+)(\.\w+)+(?!.*(\w+)(\.\w+)+)/.exec(link.href);
        const url =
          /(?=.*kingdomdeath\/images)(?!.*Site-logo)([A-Za-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))/.exec(
            link.href
          );
        item.image = {
          web: url[0] ?? null,
          src: filename[0],
        };
      }

      if (hitLocation) {
        const img = hitLocation.querySelector('[data-image-name]');
        const val = img ? img.dataset.imageName ?? null : null;
        if (val) {
          item.defence.location = val.replace('Icon.png', '').trim();
        }
      }

      if (armorRating) {
        item.defence.armor = armorRating
          .querySelector('.pi-data-value')
          .innerText.trim();
      }

      if (statsGroup) {
        const stats = [...statsGroup.querySelectorAll('td')];
        item.stats.speed = stats[0].innerText;
        item.stats.accuracy = stats[1].innerText;
        item.stats.strength = stats[2].innerText;
      }

      if (accordionGroups.length) {
        accordionGroups.forEach((group) => {
          const header = group.querySelector('h2.pi-header');
          if (!header) return;

          switch (header.innerText) {
            case 'Affinity Bonus': {
              break;
            }
            case 'Keywords and Special Rules': {
              const keywords = header.nextElementSibling;
              const rules = keywords ? keywords.nextElementSibling : null;

              if (keywords) {
                const el = keywords.querySelector('.pi-data-value');
                item.keywords = el
                  ? el.innerText.split(',').map((s) => s.trim())
                  : [];
              }

              if (rules) {
                const el = rules.querySelector('.pi-data-value');
                item.specialRules = el
                  ? el.innerText.split(',').map((s) => s.trim())
                  : [];
                // ? el.innerText.split('\n').map((s) => s.trim())
              }

              break;
            }
          }
        });
      }
    }

    return { item };
  });

  await browser.close();

  return data;
};
