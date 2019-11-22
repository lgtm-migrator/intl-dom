import {parseJSONExtra} from './utils.js';

/* eslint-disable max-len */
/**
* @callback AllSubstitutionCallback
* @param {PlainObject} cfg
* @param {string|Node|number|Date|RelativeTimeInfo|ListInfo|NumberInfo|DateInfo} cfg.value Contains
*   the value returned by the individual substitution
* @param {string} cfg.arg See `cfg.arg` of {@link SubstitutionCallback}.
* @param {string} cfg.key The substitution key
* @returns {string|Element} The replacement text or element
*/
/* eslint-enable max-len */

/**
 * @type {AllSubstitutionCallback}
 */
export const defaultAllSubstitutions = ({value, arg, key, locale}) => {
  // Strings or DOM Nodes
  if (
    typeof value === 'string' || (value && typeof value === 'object' &&
    'nodeType' in value)
  ) {
    return value;
  }

  const applyArgs = ({type, options = opts, checkArgOptions = false}) => {
    if (typeof arg === 'string') {
      const [userType, extraArgs, argOptions] = arg.split('|');
      if (!extraArgs) {
        if (userType === type) {
          options = {};
        }
      } else if (
        userType === type &&
        (
          (!checkArgOptions) ||
          (checkArgOptions && argOptions)
        )
      ) {
        // Todo: Allow escaping and restoring of pipe symbol
        options = {
          ...options,
          ...parseJSONExtra(
            checkArgOptions && argOptions ? argOptions : extraArgs
          )
        };
      }
    }
    return options;
  };

  let opts, extraOpts;
  if (value && typeof value === 'object') {
    const singleKey = Object.keys(value)[0];
    if (['number', 'date', 'relative', 'list'].includes(singleKey)) {
      if (Array.isArray(value[singleKey])) {
        [value, opts, extraOpts] = value[singleKey];
      } else {
        value = value[singleKey];
      }

      if (singleKey === 'relative') {
        // The second argument actually contains the primary options, so swap
        [extraOpts, opts] = [opts, extraOpts];
        return new Intl.RelativeTimeFormat(
          locale, applyArgs({type: 'RELATIVE'})
        ).format(value, extraOpts);
      }

      // ListFormat (with Collator)
      if (singleKey === 'list') {
        value.sort(new Intl.Collator(
          locale,
          applyArgs({
            type: 'LIST', options: extraOpts, checkArgOptions: true
          })
        ).compare);
        return new Intl.ListFormat(
          locale, applyArgs({type: 'LIST'})
        ).format(value);
      }
      // Let `number` and `date` types drop through so their options
      //  can be applied
    }
  }

  // Numbers
  if (typeof value === 'number') {
    return new Intl.NumberFormat(
      locale,
      applyArgs({type: 'NUMBER'})
    ).format(value);
  }

  // Dates
  if (
    value && typeof value === 'object' &&
    typeof value.getTime === 'function'
  ) {
    return new Intl.DateTimeFormat(
      locale,
      applyArgs({type: 'DATETIME'})
    ).format(value);
  }

  // console.log('value', value);
  throw new TypeError('Unknown formatter');
};
