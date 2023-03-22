const puppeteer = require('puppeteer');
const config = require('./config');

module.exports = async function root() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(config.rootUrl, { waitUntil: 'domcontentloaded' });

  const data = await page.evaluate(() => {
    const start = document.querySelector('#List_of_Gear');
    const title = start.parentElement;
    let nextChild = title;
    const content = {};
    const order = [];
    const failedSections = [];
    const failedItems = [];

    // currentParent is the `h3` tag.
    let currentParent = null;
    // currentSection is the `h4` tag.
    let currentSection = null;

    while ((nextChild = nextChild.nextElementSibling)) {
      switch (nextChild.tagName.toLowerCase()) {
        case 'h3': {
          order.push(nextChild.innerText);
          currentParent = nextChild;
          break;
        }
        case 'h4': {
          content[nextChild.innerText] = {
            name: nextChild.innerText,
            parent: currentParent.innerText,
            items: [],
          };
          currentSection = nextChild;
          break;
        }
        case 'ul': {
          const node = content[currentSection.innerText];
          if (node) {
            node.items = Array.from(nextChild.querySelectorAll('li')).map(
              (li) => {
                const link = li.querySelector('a') ?? null;
                return {
                  name: li.innerText,
                  link: link ? link.href : null,
                  image: null,
                  description: [],
                  keywords: [],
                  specialRules: [],
                  crafting: {
                    description: null,
                    required: null,
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
              }
            );
          }
          break;
        }
        default: {
          console.log('?');
          break;
        }
      }
    }

    return { content, order };
  });

  await browser.close();

  return data;
};
