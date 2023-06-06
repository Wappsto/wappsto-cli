let storage;

const CMD_LIST = Object.freeze({
  add: 'add',
  delete: 'delete',
});

/**
 * @typedef feedObject
 * @type {Object}
 * @property {string} name The Name of the Feed.
 * @property {string} url The url of the Feed.
 */

/**
 * Create a container for the Feed name.
 * @param {string} name Name to be shown.
 * @param {string} url The Url to be shown when hovel over the name.
 * @returns {HTMLElement}
 */
function createNameContainer(name, url) {
  const nameContainer = document.createElement('div');
  nameContainer.style = "width: 90%; float: left; margin-top:15px";
  const nameText = document.createElement('h4');
  nameText.appendChild(toolTip(url, name));
  nameContainer.appendChild(nameText);
  return nameContainer
}

/**
 * Create a container for the Feed Delete button.
 * @param {string} delId The id for the element to be remove on button click.
 * @returns {HTMLElement}
 */
function createButtonContainer(delId) {
  const buttonObj = document.createElement('button');
  buttonObj.className = 'outline';
  buttonObj.innerHTML = 'Delete';
  buttonObj.id = `${delId}_delete`;
  buttonObj.onclick = () => {
    removeFeed(delId);
    document.getElementById(delId).remove();
  };
  const ButtonContainer = document.createElement('div');
  ButtonContainer.style = "margin-left: 10%";
  ButtonContainer.appendChild(buttonObj);
  return ButtonContainer;
}

/**
 * Create a Tooltop element.
 * @param {string} tip The ToolTop to be shown on hover.
 * @param {HTMLElement} child The Element to be added inside the Tooltip elemtent.
 * @returns {HTMLElement}
 */
function toolTip(tip, child){
  const emObj = document.createElement('em')
  emObj.setAttribute('data-tooltip', tip);
  emObj.innerHTML = child;
  return emObj;
}

/**
 * Send a Request to the Background service to remove the given RSS feed.
 * @param {string} feedName The Name of the feed to be removed.
 */
async function removeFeed(feedName) {
    /**@type {feedObject} */
  const feedObj = storage.get('feeds').find((el)=> el.name === feedName);
  await Wappsto.sendToBackground(
    { cmd: CMD_LIST.delete, data: feedObj.url },
  );
}
/**
 * Create the Feed HTML object, that are shown on the homepage.
 * @param {string} name The Name of the Feed.
 * @param {string} url The Url of the RSS Feed.
 * @returns {HTMLElement}
 */
function createFeedListObj(name, url) {
  const feedId = `${name}`
  const feedContainer = document.createElement('div');
  const nameContainer = createNameContainer(name, url);
  const ButtonContainer = createButtonContainer(feedId);

  feedContainer.id = feedId;
  feedContainer.style = "width: 100%; display: flex;";

  feedContainer.appendChild(nameContainer);
  feedContainer.appendChild(ButtonContainer);

  return feedContainer;
}

/**
 * Updated the HTML Feed List.
 */
async function updateFeedList() {
  const feedList = storage.get('feeds');
  // console.log(feedList);
  const feedListObj = document.getElementById('feedList');
  while (feedListObj.firstChild) {
    feedListObj.removeChild(feedListObj.firstChild);
  }
  // TODO: If Empty list, Write that instead!
  if (!feedList) return;
  feedList.forEach((el) => feedListObj.appendChild(
    createFeedListObj(el.name, el.url)
  ));
}

/**
 * Send a request to the background service to add a new RSS feed.
 * After which it refresh the HTML Feed List.
 */
async function addFeed() {
  const button = document.getElementById('addFeed');
  button.disabled = true;
  try{
    const rssFeedUri = document.getElementById('rssFeed').value;
    console.log('Adding Feed');
    const reply = await Wappsto.sendToBackground(
      { cmd: CMD_LIST.add, data: rssFeedUri },
    );
    console.log(reply);
    await updateFeedList();
  } finally {
    button.disabled = false;
  }
}

/**
 * The Function that setup everything on the page.
 */
async function start() {
  await Wappsto.waitForBackground(-1);
  storage = await Wappsto.wappStorage();
  storage.onChange(() => {});
  await updateFeedList();
  document.getElementById('addFeed').onclick = () => addFeed();
}
