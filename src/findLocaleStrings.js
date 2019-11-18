import {defaultLocaleResolver} from './defaultLocaleResolver.js';
import {promiseChainForValues} from './promiseChainForValues.js';

/**
* @callback LocaleMatcher
* @param {string} locale The failed locale
* @returns {string|Promise<string>} The new locale to check
*/

/**
* @typedef {PlainObject} LocaleObjectInfo
* @property {LocaleObject} strings The successfully retrieved locale strings
* @property {string} locale The successfully resolved locale
*/

/**
 * @param {PlainObject} [cfg={}]
 * @param {string[]} [cfg.locales=navigator.languages] BCP-47 language strings
 * @param {string[]} [cfg.defaultLocales=['en-US']]
 * @param {string} [cfg.localesBasePath='.']
 * @param {LocaleResolver} [cfg.localeResolver=defaultLocaleResolver]
 * @param {"lookup"|LocaleMatcher} [cfg.localeMatcher]
 * @returns {Promise<LocaleObjectInfo>}
 */
export const findLocaleStrings = async ({
  locales = navigator.languages,
  defaultLocales = ['en-US'],
  localeResolver = defaultLocaleResolver,
  localesBasePath = '.',
  localeMatcher = 'lookup'
} = {}) => {
  /**
   * @callback getLocale
   * @throws {SyntaxError|TypeError|Error}
   * @param {string} locale
   * @returns {Promise<LocaleObjectInfo>}
   */
  async function getLocale (locale) {
    if (typeof locale !== 'string') {
      throw new TypeError('Non-string locale type');
    }
    const url = localeResolver(localesBasePath, locale);
    if (typeof url !== 'string') {
      throw new TypeError(
        '`localeResolver` expected to resolve to (URL) string.'
      );
    }
    try {
      const resp = await fetch(url);
      if (resp.status === 404) {
        // Don't allow browser (tested in Firefox) to continue
        //  and give `SyntaxError` with missing file or we won't be
        //  able to try without the hyphen
        throw new Error('Trying again');
      }
      const strings = await (resp.json());
      return {
        locale,
        strings
      };
    } catch (err) {
      if (err.name === 'SyntaxError') {
        throw err;
      }
      const newLocale = await localeMatcher(locale);
      return getLocale(newLocale);
    }
  }
  if (localeMatcher === 'lookup') {
    localeMatcher = function (locale) {
      if (!locale.includes('-')) {
        throw new Error('Locale not available');
      }
      // Try without hyphen ("lookup" algorithm: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl )
      return locale.replace(/-.*$/u, '');
    };
  } else if (typeof localeMatcher !== 'function') {
    throw new TypeError('`localeMatcher` must be "lookup" or a function!');
  }
  // eslint-disable-next-line no-return-await
  return await promiseChainForValues(
    [...locales, ...defaultLocales],
    getLocale,
    'No matching locale found!'
  );
};