const { DynamicThreadPool } = require("poolifier");
const DOMAIN_URL = "https://sedna.com/";
const Queue = require("./queue.js");

const queue = new Queue();
/*
 * use Thread pool to manage worker/parser
 */
const pool = new DynamicThreadPool(5, 10, "./parser.js", {
  errorHandler: (e) => console.error(e),
  onlineHandler: () => console.log("worker is online"),
});

const page = {
  url: DOMAIN_URL,
  html: "",
  links: [],
  assets: [],
  status: 0,
  retry: 0,
};
// visited links in map holds all data
const visitedLinks = new Map();
const published = new Map();

/*
 * We subscribe to a very basic queue and pass data to fetchAndParse when we have new data
 */
queue.subscribe("urls", fetchAndParse);

//Publish fisrt page
queue.publish("urls", page);

// Checking queue and visited to understand that the threads done working
checkQueue();

/*
 * Main function send data to parser worker and publish new links
 * if we have HTTP 429 (Too Many Requests ) response, we send back to queue.
 */
function fetchAndParse(page) {
  published.set(page.url);
  pool.execute(page).then((res) => {
    if (res.status === 429) {
      queue.publish("urls", {
        url: res.url,
        html: "",
        links: [],
        assets: [],
        status: 0,
        retry: res.retry,
      });
    } else {
      visitedLinks.set(res.url, res);
      const filtered = res.links.filter((url) => !published.has(url));

      for (var i = 0; i < filtered.length; i++) {
        published.set(filtered[i]);
        queue.publish("urls", {
          url: filtered[i],
          html: "",
          links: [],
          assets: [],
          status: 0,
          retry: 0,
        });
      }
    }
  });
}
/*
 * check the queue size and when threads done print out and exit called
 */
async function checkQueue() {
  return new Promise((resolve) => {
    console.log("Queue size", published.size, " visited:", visitedLinks.size);
    if (published.size == visitedLinks.size) {
      console.log("Done");
      printAndExit();
    }
    setTimeout(checkQueue, 2000);
  });
}

function printAndExit() {
  console.log(
    "------------------------ %i visited --------------------------",
    visitedLinks.size
  );
  for (let [key, value] of visitedLinks.entries()) {
    console.log(
      "--------------------------------------------------------------"
    );
    console.log("Url : %s", key);
    console.log("--- links : %s", value.links);
    console.log("--- assets : %s", value.assets);
    console.log(
      "--------------------------------------------------------------"
    );
  }
  pool.destroy();
  process.exit();
}
