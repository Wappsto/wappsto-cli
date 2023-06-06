const Wappsto = require('wappsto-wapp');
const Parser = require('rss-parser');
const dayjs = require('dayjs');

let storage;
/**@type {Wappsto.Network} */
let theNetwork;

const networkName = "RSS Feed"
// const syncTimeOutMs = 1000*60*60*24; // Every Day.
const syncTimeOutMs = 1000*60*60; // Every hour.

const CMD_LIST = Object.freeze({
  add: 'add',
  delete: 'delete',
});

const STATUS_CMD = Object.freeze({
  ok: 'ok',
  error: 'error',
});

/**
 * @typedef feedObject
 * @type {Object}
 * @property {string} name The Name of the Feed.
 * @property {string} url The url of the Feed.
 */

// ////////////////////////////////////////////////////////////////////////////
//                                Feed Functions
// ////////////////////////////////////////////////////////////////////////////

/**
 * @typedef RSSItem
 * @type {Object}
 * @property {string} title
 * @property {string} link
 * @property {string} author
 * @property {string} id
 * @property {string} content
 * @property {string} isoDate
 */

/**
 * Add all given feed items to the given Wappsto Device.
 * @param {[RSSItem]} feedItem The list of all feed items to be updated.
 * @param {Wappsto.Device} feedDevice The Device for which the feed items are added.
 * @param {Wappsto.Value} titleValue The value to add the title to.
 */
async function addFeedToWappsto(feedItem, feedDevice, titleValue) {
  const { title, link, author, isoDate, id } = feedItem;

  console.log('Adding feed:', id, '-', title);

  titleValue.report(title, isoDate);

  const authorValue = await feedDevice.createValue({
    name: 'Author', permission: 'r',
    template: Wappsto.ValueTemplate.STRING,
  });
  authorValue.report(author, isoDate);

  const linkValue = await feedDevice.createValue({
    name: 'Link', permission: 'r',
    template: Wappsto.ValueTemplate.STRING,
  });
  linkValue.report(link, isoDate);
}

/**
 * Check if the feed works, if so return the title of the feed.
 * @param {string} feedUrl The Url of the feed.
 * @returns {Promise<string>}
 */
async function checkFeed(feedUrl) {
  const parser = new Parser();
  const feed = await parser.parseURL(feedUrl);
  return feed.title;
}

/**
 * Add the given feed to the system to be updated in the future.
 * @param {string} feedUrl The Url of the feed.
 * @returns  {Promise<Boolean>} False if the feed was not added.
 */
async function addFeed(feedUrl) {
  /**@type {[feedObject]} */
  const feedList = storage.get('feeds');

  const feedName = await checkFeed(feedUrl);
  if(!feedName) return false;

  /**@type {feedObject} */
  const newFeed = {
    name: feedName,
    url: feedUrl
  }
  feedList.push(newFeed);
  console.log(feedList);
  await storage.set('feeds', feedList);
  updateFeed(newFeed.url);
  return true;
}

/**
 * Remove the Feed from future updates, & wappsto.
 * @param {string} feedUrl The Url of the feed.
 */
async function removeFeed(feedUrl) {
  /**@type {[feedObject]} */
  const feedList = storage.get('feeds');
  const newFeedList = feedList.filter((el) => el.url !== feedUrl);
  await storage.set('feeds', newFeedList);

  const feedTitle = await checkFeed(feedUrl);

  const feedDevice = await theNetwork.createDevice({
    name: feedTitle,
    communication: feedUrl,
  });
  await feedDevice.delete();
}

/**
 * Update the given feed, for which the url contain.
 * @param {string} feedUrl The Url for the given feed.
 */
async function updateFeed(feedUrl){
  const parser = new Parser();
  const feed = await parser.parseURL(feedUrl);

  const feedDevice = await theNetwork.createDevice({
    name: feed.title,
    communication: feedUrl,
  });

  const titleValue = await feedDevice.createValue({
    name: 'Title', permission: 'r',
    template: Wappsto.ValueTemplate.STRING,
  });

  const lastUpdate = dayjs(titleValue.getReportTimestamp());
  const newFeed = feed.items.filter(
    (f) => dayjs(f.isoDate).diff(lastUpdate) > 0
  ).sort( // Sort so the newest are added last.
    (a,b) => dayjs(a.isoDate).diff(dayjs(b.isoDate))
  );

  for (const feedItem of newFeed){
    await addFeedToWappsto(feedItem, feedDevice, titleValue);
  };
}

// ////////////////////////////////////////////////////////////////////////////
//                                Core Functions
// ////////////////////////////////////////////////////////////////////////////

/**
 * The SubRoutine that ensures that all feeds are updated.
 */
async function subroutine() {
  /**@type {[feedObject]} */
  const feedList = storage.get('feeds');

  feedList.forEach((el) =>{
    updateFeed(el.url);
  });
}

// ////////////////////////////////////////////////////////////////////////////
//                               Handle Command
// ////////////////////////////////////////////////////////////////////////////

/**
 * @typedef eventReturn
 * @type {object}
 * @property {keyof STATUS_CMD} status
 * @property {string} [reason] - Only if error.
 * @property {any} [value] - Only If ok.
 */

/**
 * Generate a Task Failed reply.
 * @param {string} reason - The Reason the failure.
 * @returns {eventReturn}
 */
function errorReply(reason) {
  return { status: STATUS_CMD.error, reason };
}

/**
 * @typedef eventData
 * @type {object}
 * @property {keyof CMD_LIST} cmd - The task to be executed.
 * @property {string} data - The Url from where the session are retrieved.
 */

/**
 * @param {eventData} eventData
 * @returns {Promise<eventReturn>}
 */
async function handleCommand(eventData) {
  console.log({ eventData });

  if (!('cmd' in eventData)) return errorReply('Command not found.');

  if (eventData.cmd === CMD_LIST.add) {
    const feedAdded = await addFeed(eventData.data);
    if (!feedAdded) return errorReply('Feed not found!');
    return { status: STATUS_CMD.ok };
  };

  if (eventData.cmd === CMD_LIST.delete) {
    await removeFeed(eventData.data);
    return { status: STATUS_CMD.ok };
  };

  return errorReply('Unknown command.');
}

// ////////////////////////////////////////////////////////////////////////////
//                              Main Function
// ////////////////////////////////////////////////////////////////////////////

(async () => {
  console.log("RSS Feed Setup Started!");
  storage = await Wappsto.wappStorage();
  if (storage.get('feeds') === undefined) storage.set('feeds', []);

  theNetwork = await Wappsto.createNetwork({
    name: networkName,
    description: 'The RSS Feed collection.',
  });

  setInterval(subroutine, syncTimeOutMs);
  Wappsto.fromForeground(handleCommand);
  console.log("RSS Feed Setup Done!");
})();
