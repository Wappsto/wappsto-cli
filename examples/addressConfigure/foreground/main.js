// eslint-disable-next-line no-unused-vars

/**@typedef {Wappsto.Value} */
let nameObj;
/**@typedef {Wappsto.Value} */
let streetObj;
/**@typedef {Wappsto.Value} */
let cityObj;
/**@typedef {Wappsto.Value} */
let postCodeObj;
/**@typedef {Wappsto.Value} */
let stateObj;
/**@typedef {Wappsto.Value} */
let countryObj;

/**
 * Show a popup with the given message.
 * @param {string} title The Title for the popup.
 * @param {string} text The Fill text for the popup.
 */
function popup(title, text) {
  const errorPopup = document.getElementById('error_popup');
  const errorTitle = document.getElementById('error_title');
  const errorText = document.getElementById('error_text');
  errorTitle.innerText = title;
  errorText.innerText = text;
  openModal(errorPopup);
}

/**
 * Create all the Wappsto values and address structure.
 */
async function setup() {
  const theNetwork = await Wappsto.createNetwork({name: 'Address Configure'});
  const theDevice = await theNetwork.createDevice({name: 'Address'});
  nameObj = await theDevice.createValue({
    name: 'Name',
    permission: 'r',
    template: Wappsto.ValueTemplate.ADDRESS_NAME,
  });
  streetObj = await theDevice.createValue({
    name: 'Street name & number',
    permission: 'r',
    template: Wappsto.ValueTemplate.STREET,
  });
  
  cityObj = await theDevice.createValue({
    name: 'City',
    permission: 'r',
    template: Wappsto.ValueTemplate.CITY,
  });
  
  postCodeObj = await theDevice.createValue({
    name: 'Postcode or ZIP code',
    permission: 'r',
    template: Wappsto.ValueTemplate.POSTCODE,
  });
  
  stateObj = await theDevice.createValue({
    name: 'State',
    permission: 'r',
    template: Wappsto.ValueTemplate.STRING,
  });
  
  countryObj = await theDevice.createValue({
    name: 'Country',
    permission: 'r',
    template: Wappsto.ValueTemplate.COUNTRY,
  });
}

/**
 * Load all address fields and fill out the form with them.
 */
function loadDefaultFieldValues() {
  setField('name',nameObj.getReportData());
  setField('street',streetObj.getReportData());
  setField('city',cityObj.getReportData());
  setField('postal',postCodeObj.getReportData());
  setField('state',stateObj.getReportData());
  setField('country',countryObj.getReportData());
}

/**
 * Report all the value to Wappsto.
 * @param {string} name
 * @param {string} street
 * @param {string} city
 * @param {string} postal
 * @param {string} state
 * @param {string} country
 */
async function updateWappstoAddressValues(name, street, city, postal, state, country) {
  nameObj.report(name);
  streetObj.report(street);
  cityObj.report(city);
  postCodeObj.report(postal);
  stateObj.report(state);
  countryObj.report(country);
}

/**
 * Set a new value for the given field.
 * @param {string} fieldName The Element Id
 * @param {any} value The new value for the Element.
 */
function setField(fieldName, value) {
  const field = document.getElementById(fieldName);
  if (!value) field.value = '';
  if (value === 'NA') field.value = '';
  if (value) field.value = value;
}

/**
 * Return the value for the given field if set. + Set the Aria-Invalid accordingly.
 * @param {String} fieldName The Element Id
 * @returns {string}
 */
function getField(fieldName) {
  const field = document.getElementById(fieldName);
  if (!field.value) {
    field.setAttribute('aria-invalid', 'true');
    throw new Error(`${fieldName} was not set.`);
  }
  field.setAttribute('aria-invalid', 'false');
  return field.value;
}

/**
 * Load & update the Address.
 */
async function submitEvent() {
  document.getElementById('submitAdr').disable = true;
  try{
    const name = getField('name');
    const street = getField('street');
    const city = getField('city');
    const postal = getField('postal');
    const state = getField('state');
    const country = getField('country');
    await updateWappstoAddressValues(name, street, city, postal, state, country);
  } finally {
    popup('Task complete', 'Your Address have been added to Wappsto!');
    document.getElementById('submitAdr').disable = false;
  }
}

async function start() {
  await setup();
  loadDefaultFieldValues();
  document.getElementById('submitAdr').onclick = submitEvent;
}
