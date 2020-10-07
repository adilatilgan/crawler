const { ThreadWorker } = require("poolifier");
const axios = require("axios");
const cheerio = require("cheerio");
const DOMAIN_URL = "https://sedna.com/";
let GRACE_PERIOD = 3000;

/*
 * Main Worker thread
 * I put a grace period to get rid of WAF errors or HTTP 429 (to many requests)
 */

async function fetchAndParse(page) {
  await wait(GRACE_PERIOD);
  return fetch(page)
    .then((page) => {
      if (page.status === 200) {
        return parseLinks(page);
      } else {
        return page;
      }
    })
    .then((page) => {
      if (page.status === 200) {
        return parseAssests(page);
      } else {
        return page;
      }
    });
}

async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetch(page) {
  const resp = await axios(page.url).catch((err) => {
    if (!err.response) {
      page.status = 429;
    } else {
      page.status = err.response.status;
    }
    page.html = "";
    return page;
  });

  page.html = resp.data;
  page.status = resp.status;
  page.retry = page.retry + 1;

  return page;
}

/*
 * Using cheerio to parse html pages and find links
 */
async function parseLinks(page) {
  if (page === undefined) {
    return;
  }

  try {
    const $ = cheerio.load(page.html);
    const links = $("a", page.html);

    for (var i = 0; i < links.length; i++) {
      if (links[i].attribs.href.startsWith("/")) {
        page.links.push(DOMAIN_URL + links[i].attribs.href.substring(1));
      } else if (links[i].attribs.href.startsWith(DOMAIN_URL)) {
        page.links.push(links[i].attribs.href);
      }
    }
  } catch (e) {
    console.log(e);
  }
  return page;
}
/*
 * Using cheerio to parse html pages and find assets
 * I only added images and I am not sure css and javascript files should we added
 */
async function parseAssests(page) {
  if (page === undefined) {
    return;
  }

  try {
    const $ = cheerio.load(page.html);
    const assets = $("img", page.hthml);
    for (var i = 0; i < assets.length; i++) {
      page.assets.push(assets[i].attribs["data-src"]);
    }
  } catch (e) {
    console.log(e);
  }

  return page;
}

module.exports = new ThreadWorker(fetchAndParse, {
  maxInactiveTime: 60000,
  async: true,
});
