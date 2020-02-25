// We avoid the main file (polyfill) for pluralrules as it does not detect
// full support for `minimumFractionDigits` and reverts on Node 10 to its
// default incomplete support;
// The imperfect Node implementation will wrongly gives "one"
//  instead of "other" (as it should) for
//  `new Intl.PluralRules('en-US', {minimumFractionDigits: 1}).select(1)`.
// import 'intl-pluralrules';
import PluralRules from 'intl-pluralrules/plural-rules.mjs';
import 'intl-relative-time-format';
import 'intl-relative-time-format/locale-data/en-US.js';
import 'intl-list-format';
import 'intl-list-format/locale-data/en-US.js';

// Testing
import chai from 'chai';
import chaiDOM from 'chai-dom';
import chaiAsPromised from 'chai-as-promised';
// eslint-disable-next-line import/order
import fragmentHtml from '../browser/vendor/fragmentHtml.js';

import {JSDOM} from 'jsdom';
import fileFetch from 'file-fetch';

// Override to ensure we're testing with polyfill
Intl.PluralRules = PluralRules;

chai.use(chaiDOM);
chai.use(chaiAsPromised);
chai.use(fragmentHtml);

global.document = (new JSDOM()).window.document;
global.fetch = fileFetch;
global.setNavigatorLanguages = (languages) => {
  if (languages === false) {
    delete global.navigator;
    return;
  }
  global.navigator = {
    languages
  };
};

setTimeout(() => {
  // Make path resolutions consistent in Node with HTML
  if (typeof process !== 'undefined') {
    // eslint-disable-next-line global-require
    process.chdir(require('path').resolve(__dirname, '../browser'));
  }
  // Delayed mocha beginning for sake of `process.chdir` which cannot
  //  be added earlier or it will hide tests themselves
  run();
});
