import 'regenerator-runtime/runtime.js';
import {
  promiseChainForValues,
  defaultLocaleResolver,
  getMessageForKeyByStyle,
  getStringFromMessageAndDefaults,
  getDOMForLocaleString,
  findLocaleStrings,
  i18n
} from '../dist/index.esm.js';

describe('API', function () {
  it('Should export functions', function () {
    expect(promiseChainForValues).to.be.a('function');
    expect(defaultLocaleResolver).to.be.a('function');
    expect(getMessageForKeyByStyle).to.be.a('function');
    expect(getStringFromMessageAndDefaults).to.be.a('function');
    expect(getDOMForLocaleString).to.be.a('function');
    expect(findLocaleStrings).to.be.a('function');
    expect(i18n).to.be.a('function');
  });
});

/* eslint-disable promise/avoid-new */
describe('promiseChainForValues', function () {
  it('Should throw with bad arguments', function () {
    expect(() => {
      promiseChainForValues('nonArrayValues', () => {
        // Empty
      });
    }).to.throw(
      TypeError,
      'The `values` argument to `promiseChainForValues` must be an array.'
    );

    expect(() => {
      promiseChainForValues(['ok'], 'notAFunction');
    }).to.throw(
      TypeError,
      'The `errBack` argument to `promiseChainForValues` must be a function.'
    );
  });
  it('Should properly resolve without any rejections', async function () {
    let errbackCount = 0;
    const val = await promiseChainForValues(['a', 'b', 'c'], (v) => {
      errbackCount++;
      return new Promise(function (resolve, reject) {
        setTimeout(() => {
          resolve(v);
        }, 100);
      });
    });
    expect(val).to.equal('a');
    expect(errbackCount, 'should short-circuit').to.equal(1);
  });
  it('Should properly accept rejection and continue', async function () {
    let errbackCount = 0;
    const val = await promiseChainForValues(['a', 'b', 'c'], (v) => {
      errbackCount++;
      return new Promise(function (resolve, reject) {
        if (v === 'a') {
          reject(new Error('missing'));
        }
        setTimeout(() => {
          resolve(v);
        }, 100);
      });
    });
    expect(val).to.equal('b');
    expect(errbackCount, 'should short-circuit').to.equal(2);
  });
  it(
    'Should properly accept multiple rejections and continue',
    async function () {
      let errbackCount = 0;
      const val = await promiseChainForValues(['a', 'b', 'c'], (v) => {
        errbackCount++;
        return new Promise(function (resolve, reject) {
          if (v === 'a' || v === 'b') {
            reject(new Error('missing'));
          }
          setTimeout(() => {
            resolve(v);
          }, 100);
        });
      });
      expect(val).to.equal('c');
      expect(errbackCount, 'should short-circuit').to.equal(3);
    }
  );
});
/* eslint-enable promise/avoid-new */

describe('defaultLocaleResolver', function () {
  it('Should resolve with no trailing slash base path', function () {
    const expected = '/base/path/_locales/en-US/messages.json';
    const locale = 'en-US';
    const localesBasePath = '/base/path';
    const path = defaultLocaleResolver(locale, localesBasePath);
    expect(path).to.equal(expected);
  });
  it('Should resolve with a trailing slash base path', function () {
    const expected = '/base/path/_locales/en-US/messages.json';
    const locale = 'en-US';
    const localesBasePath = '/base/path/';
    const path = defaultLocaleResolver(locale, localesBasePath);
    expect(path).to.equal(expected);
  });
});

describe('getMessageForKeyByStyle', function () {
  describe('Default style', function () {
    it('should process in rich style', function () {
      const func = getMessageForKeyByStyle();
      const localeObj = {
        key: {
          message: 'myKeyValue'
        }
      };
      expect(func(localeObj, 'key')).to.equal('myKeyValue');
      expect(func(localeObj, 'missingKey')).to.equal(false);
    });
  });
  describe('Function style', function () {
    it('should return function value', function () {
      const localeObj = {
        key: 'myKeyValue'
      };
      const func = getMessageForKeyByStyle({
        messageStyle (obj, key) {
          return obj[key] || false;
        }
      });
      expect(func(localeObj, 'key')).to.equal('myKeyValue');
      expect(func(localeObj, 'missingKey')).to.equal(false);
    });
  });
  describe('Explicit rich style', function () {
    it('should process in rich style', function () {
      const func = getMessageForKeyByStyle({
        messageStyle: 'rich'
      });
      const localeObj = {
        key: {
          message: 'myKeyValue'
        }
      };
      expect(func(localeObj, 'key')).to.equal('myKeyValue');
      expect(func(localeObj, 'missingKey')).to.equal(false);
    });
  });
  describe('plain style', function () {
    it('should process in plain style', function () {
      const func = getMessageForKeyByStyle({
        messageStyle: 'plain'
      });
      const localeObj = {
        key: 'myKeyValue'
      };
      expect(func(localeObj, 'key')).to.equal('myKeyValue');
      expect(func(localeObj, 'missingKey')).to.equal(false);
    });
  });
  describe('Bad style', function () {
    it('Should throw with an unknown style', function () {
      expect(() => {
        getMessageForKeyByStyle({
          messageStyle: 'badStyle'
        });
      }).to.throw(TypeError, 'Unknown `messageStyle` badStyle');
    });
  });
});

describe('getStringFromMessageAndDefaults', function () {
  it('should return a string message', function () {
    const string = getStringFromMessageAndDefaults({
      message: 'myKeyValue',
      key: 'myKey'
    });
    expect(string).to.equal('myKeyValue');
  });
  it(
    'should return a string message with defaults object present',
    function () {
      const string = getStringFromMessageAndDefaults({
        message: 'myKeyValue',
        key: 'myKey',
        defaults: {
          myKey: 'somethingElse'
        }
      });
      expect(string).to.equal('myKeyValue');
    }
  );
  it(
    'should return a string message with defaults false',
    function () {
      const string = getStringFromMessageAndDefaults({
        message: 'myKeyValue',
        key: 'myKey',
        defaults: false
      });
      expect(string).to.equal('myKeyValue');
    }
  );
  it('should return an empty string message', function () {
    const string = getStringFromMessageAndDefaults({
      message: '',
      key: 'myKey'
    });
    expect(string).to.equal('');
  });
  it('should return a string message with an empty string key', function () {
    const string = getStringFromMessageAndDefaults({
      message: 'myKeyValue',
      key: ''
    });
    expect(string).to.equal('myKeyValue');
  });
  it(
    'should throw with an undefined message and ' +
    'defaults set to `false`', function () {
      expect(() => {
        getStringFromMessageAndDefaults({
          message: undefined,
          key: 'myKey',
          defaults: false
        });
      }).to.throw(Error, 'Key value not found for key: (myKey)');
    }
  );
  it(
    'should throw with an undefined message and ' +
    'defaults set to non-false/non-object', function () {
      expect(() => {
        getStringFromMessageAndDefaults({
          message: undefined,
          key: 'myKey',
          defaults: null
        });
      }).to.throw(
        Error,
        'Default locale strings must resolve to `false` or an object!'
      );
    }
  );
  it(
    'should throw with an undefined message and ' +
    '`messageForKey` returning `false`', function () {
      expect(() => {
        getStringFromMessageAndDefaults({
          message: undefined,
          key: 'myKey',
          defaults: {},
          messageForKey (defaults, key) {
            return key in defaults ? String(defaults[key]) : false;
          }
        });
      }).to.throw(Error, 'Key value not found for key: (myKey)');
    }
  );
  it(
    'should throw with an undefined message and ' +
    '`messageStyle` `messageForKey` returning `false`', function () {
      expect(() => {
        getStringFromMessageAndDefaults({
          message: undefined,
          key: 'myKey',
          defaults: {
            anotherKey: {
              message: 'anotherKeyOk'
            }
          },
          messageStyle: 'rich'
        });
      }).to.throw(Error, 'Key value not found for key: (myKey)');
      expect(() => {
        getStringFromMessageAndDefaults({
          message: undefined,
          key: 'myKey',
          defaults: {
            myKey: {
              message: false
            }
          },
          messageStyle: 'rich'
        });
      }).to.throw(Error, 'Key value not found for key: (myKey)');
      expect(() => {
        getStringFromMessageAndDefaults({
          message: undefined,
          key: 'myKey',
          defaults: {
            myKey: false
          },
          messageStyle: 'plain'
        });
      }).to.throw(Error, 'Key value not found for key: (myKey)');
      expect(() => {
        getStringFromMessageAndDefaults({
          message: undefined,
          key: 'myKey',
          defaults: {
            myKey: {}
          },
          messageStyle: 'plain'
        });
      }).to.throw(Error, 'Key value not found for key: (myKey)');
      expect(() => {
        getStringFromMessageAndDefaults({
          message: undefined,
          key: 'myKey',
          defaults: {
            anotherKey: 'anotherKeyOk'
          },
          messageStyle: 'plain'
        });
      }).to.throw(Error, 'Key value not found for key: (myKey)');
    }
  );
  it(
    'should return a string message with a string key indicating a string ' +
    'on the `messageStyle` `messageForKey`', function () {
      let string = getStringFromMessageAndDefaults({
        message: undefined,
        key: 'myKey',
        defaults: {
          myKey: {
            message: 'myKeyValue'
          }
        },
        messageStyle: 'rich'
      });
      expect(string).to.equal('myKeyValue');

      string = getStringFromMessageAndDefaults({
        message: undefined,
        key: 'myKey',
        defaults: {
          myKey: 'myKeyValue'
        },
        messageStyle: 'plain'
      });
      expect(string).to.equal('myKeyValue');
    }
  );
  it(
    'should return a string message with a string key indicating a string ' +
    'on a `messageForKey` function', function () {
      const string = getStringFromMessageAndDefaults({
        message: undefined,
        key: 'myKey',
        defaults: {
          myKey: 'myKeyValue'
        },
        messageForKey (defaults, key) {
          return key in defaults ? String(defaults[key]) : false;
        }
      });
      expect(string).to.equal('myKeyValue');
    }
  );
});

describe('getDOMForLocaleString', function () {
  // Todo: add failing tests above for `getStringFromMessageAndDefaults` and
  //  `defaultLocaleResolver`

  // Todo
  // also test erring on empty string argument or empty non-object
  /*
  getDOMForLocaleString({});
  string,
  substitutions = false,
  dom = false,
  forceNodeReturn = false,
  throwOnMissingSuppliedFormatters = true,
  throwOnExtraSuppliedFormatters = true,
  bracketRegex = /(\\*)\{([^}]*?)(?:\|([^}]*))?\}/gu
  */
});

describe('findLocaleStrings', function () {
  // Todo; also test empty arguments
});

describe('i18n', function () {
  // Todo; also test empty arguments
});