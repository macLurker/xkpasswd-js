/**
 * This is the main class that interfaces with the webapp
 *
 * @module XKPasswd
 */

import is from 'is-it-check';
import log from 'loglevel';

import {RandomBasic} from './randombasic.mjs';
import {Presets} from './presets.mjs';
import {DictionaryEN} from './dictionaryEN.mjs';
import {Statistics} from './statistics.mjs';

/**
 * Main class
 * @class XKPasswd
 */
class XKPasswd {
  #passwordCounter;

  #preset; // current preset
  #config; // config section of preset, convenience variable
  #rng; // random generator
  #statsClass; // Statistics class
  #dictionary; // current dictionary
  #stats; // current stats

  /**
   * constructor
   * @constructor
   */
  constructor() {
    this.#preset = new Presets();
    this.#config = this.#preset.config();
    this.#rng = new RandomBasic();
    this.#dictionary = new DictionaryEN();
    this.#statsClass = new Statistics(this.#config);
    this.#stats = {};

    // the number of passwords this instance has generated
    this.#passwordCounter = 0;
    log.setLevel('debug');
  }

  /**
   * Set a different preset to work with
   *
   * @param {any} preset
   *
   */
  setPreset(preset) {
    this.#preset = new Presets(preset);
    this.#config = this.#preset.config();
  }

  /**
   * Get the current preset
   *
   * @return {Preset} the current preset
   */
  getPreset() {
    return this.#preset;
  }

  /**
   * Get all available presets
   *
   * @return {array} keys - names of the Presets
   */
  getPresets() {
    return new Presets().getPresets();
  }

  /**
   * Generate the password(s) and stats
   *
   * @param {number} num - number of passwords to generate
   * @return {object} - contains the passwords and the stats
   */
  generatePassword(num) {
    const passwords = this.passwords(num);
    const stats = this.#statsClass.calculateStats();

    log.trace(`generatePassword.stats ${JSON.stringify(stats)}`);
    this.#stats = stats;

    return {
      passwords: passwords,
      stats: stats,
    };
  }

  /**
   * Return a password that adheres to the
   * chosen preset
   *
   * @return {string}
   */
  password() {
    let passwd = '';
    try {
      //
      // start by generating the needed parts of the password
      //
      log.trace('starting to generate random words');
      let words = this.__randomWords();
      log.trace(`got random words = ${words}`);

      words = this.__transformCase(words);
      words = this.__substituteCharacters(words);
      const separator = this.__separator();
      log.trace(`got separator = ${separator}`);

      const padChar = this.__paddingChar(separator);
      log.trace(`got padChar = ${padChar}`);

      //
      // Then assemble the finished password
      //

      // start with the words and the separator
      passwd = words.join(separator);
      log.trace(`assembled base password: ${passwd}`);

      // next add the numbers front and back

      passwd = this.__padWithDigits(passwd, separator);
      log.trace(`added random digits (as configured): ${passwd}`);

      // then finally add the padding characters

      switch (this.#config.padding_type) {
      case 'FIXED':
        // simple fixed padding
        passwd = this.__padWithChar(passwd, padChar);
        break;

      case 'ADAPTIVE':
        // adaptive padding
        passwd = this.__adaptivePadding(passwd, padChar,
          this.#config.pad_to_length);
        break;

      default:
        break;
      }
      log.trace(`added padding (as configured): ${passwd}`);

      // increment the passwords generated counter
      this.#passwordCounter++;

      // return the finished password
      return passwd;
    } catch (e) {
      log.error(
        `Failed to generate password with the following error: ${e}`,
      );
    };
  }

  /**
   * Generate the requested number of passwords
   * @param {number} num - the number of passwords requested
   * @return {array} - the array with num passwords
   */
  passwords(num) {
    if (is.undefined(num) || is.not.number(num) || num < 1) {
      num = 1;
    }
    const passwords = [];
    for (let i = 0; i < num ; i++) {
      passwords.push(this.password());
    }

    return passwords;
  }


  /**
   * Pad the password with padChar until the given length
   *
   * @param {string} passwd - password to be padded
   * @param {string} padChar - padding character
   * @param  {number} maxLen - max length of password
   * @return {string} - padded password
   *
   * @private
   */
  __adaptivePadding(passwd, padChar, maxLen) {
    const pwlen = passwd.length;
    padChar = (padChar.length === 0) ? ' ' : padChar;
    if (pwlen < maxLen) {
      // if the password is shorter than the target length, pad it out
      while (passwd.length < maxLen) {
        passwd += padChar;
      }
    } else if (pwlen > maxLen) {
      // if the password is too long, trim it
      passwd = passwd.substring(0, maxLen);
    }
    return passwd;
  }

  /**
   * Apply the case transform (if any) specified in the loaded config.
   *
   * Notes:
   * - The transformations applied are controlled by the case_transform
   *   config variable.
   * - Treat this as a private function
   *
   * @param {array} words - array of words to be transformed
   * @return {array} - array of transformed words
   * @throws exception when there is a problem
   */
  __transformCase(words) {
    // validate args
    if (is.undefined(words) || is.not.array(words)) {
      throw new Error('parameter words is not an array');
    }

    const transformation = this.#config.case_transform;
    log.trace(`__transformCase: ${transformation} on ${words}`);

    switch (transformation) {
    case 'NONE':
      // nothing to do, just return
      return words;

    case 'UPPER':
      return words.map((el) => el = el.toUpperCase());

    case 'LOWER':
      return words.map((el) => el = el.toLowerCase());

    case 'CAPITALISE':
      return words.map( (el) => el = this.toTitleCase(el));

    case 'INVERT':
      // return words in uppercase but first letter is lowercase
      return words.map((el) =>
        el = el.toUpperCase().
          replaceAll(/(?:^|\s|-)\S/g, (x) => x.toLowerCase()));

    case 'ALTERNATE':
      return words.map((el, index) =>
        el = ((index % 2) === 0) ? el.toLowerCase() : el.toUpperCase(),
      );

    case 'RANDOM':
      return words.map((el) =>
        el = (this.#rng.toss()) ? el.toLowerCase() : el.toUpperCase(),
      );

    default:
      return words;
    }
  };

  /**
   * Turn the string into a title case
   * @param {string} str - string to be converted
   * @return {string} - converted string
   */
  toTitleCase(str) {
    return str.toLowerCase().
      replaceAll(/(?:^|\s|-)\S/g, (x) => x.toUpperCase());
  }

  /**
   * Generate a list of random words
   * based on the loaded dictionary
   *
   * Notes: The number of words generated is determined by the num_words
   *        config key.
   *
   * @return {Array} - list of words
   *
   * @private
   */
  __randomWords() {

    const numWords = this.#config.num_words;
    const maxDict = this.#dictionary.getLength();

    log.trace(`__randomwords, mindict: ${this.#dictionary.getMinWordLength()}
    maxdict: ${this.#dictionary.getMaxWordLength()}`);
    // get the minimum of the 2 input variables and the longest dictionary word
    let minLength = Math.min(this.#config.word_length_min, this.#config.word_length_max, this.#dictionary.getMaxWordLength());

    // get the maximum of the 2 input variables and the shortest dictionary word
    let maxLength = Math.max(this.#config.word_length_min, this.#config.word_length_max, this.#dictionary.getMinWordLength());

    minLength = Math.max(minLength, this.#dictionary.getMinWordLength());
    maxLength = Math.min(maxLength, this.#dictionary.getMaxWordLength());

    log.trace(`about to generate ${numWords} words ${minLength} - ${maxLength}`);

    const list = [];
    for (let i = 0; i < numWords; i++) {
      let word = '';
      do {
        word = this.#dictionary.word(this.#rng.randomInt(maxDict));
      }
      while (word.length < minLength || word.length > maxLength );
      list.push(word);
    };
    return list;
  }

  /**
   * Get the separator character to use based on the loaded config.
   *
   * Notes: The character returned is controlled by the config variable
   *  `separator_character`
   *
   * @return {string} separator (could be an empty string)
   *
   * @private
   */
  __separator() {
    // figure out the separator character
    const sep = this.#config.separator_character;

    if (sep === 'NONE') {
      return '';
    }
    if (sep === 'RANDOM') {
      const alphabet = this.#preset.getSeparatorAlphabet();
      return this.#rng.randomChar(alphabet);
    }
    if (sep.length > 1) {
      return '';
    }
    return sep;
  }

  /**
   * Return the padding character based on the loaded config.
   *
   * Notes:
   *  The character returned is determined by a combination of the
   *  padding_type & padding_character config variables.
   *
   * @param {string} separator -
   *  the separator character being used to generate the password
   * @return {string} the padding character, could be an empty string
   *
   * @private
   */
  __paddingChar(separator) {
    if (is.undefined(separator)) {
      separator = '';
    }

    log.trace(`__paddingChar: ${this.#config.padding_character}`);
    switch (this.#config.padding_character) {
    case undefined:
    case 'NONE':
      return '';
    case 'SEPARATOR':
      return separator;
    case 'RANDOM':
      const alphabet = this.#preset.getPaddingAlphabet();
      return this.#rng.randomChar(alphabet);
    default:
      if (this.#config.padding_character.length > 1) {
        return '';
      }
      return this.#config.padding_character;
    }
  }


  /**
   * Substitute characters
   *
   * TODO - should this be implemented? there is no config option for it
   * @param {any} words
   * @return {any}
   */
  __substituteCharacters(words) {
    return words;
  }

  /**
   * Pad the password with random digits
   *
   * @param {any} passwd
   * @param {any} separator
   * @return {any} - the padded password
   */
  __padWithDigits(passwd, separator) {
    if (this.#config.padding_digits_before > 0) {
      passwd = this.#rng.randomDigits(this.#config.padding_digits_before) +
        separator + passwd;
    }
    if (this.#config.padding_digits_after > 0) {
      passwd = passwd + separator +
        this.#rng.randomDigits(this.#config.padding_digits_after);
    }
    return passwd;
  }

  /**
   * Pad the password with pad character
   *
   * @param {any} passwd
   * @param {any} padChar
   * @return {any} - the padded password
   */
  __padWithChar(passwd, padChar) {
    if (this.#config.padding_characters_before > 0) {
      for (let c = 1; c <= this.#config.padding_characters_before; c++) {
        passwd = padChar + passwd;
      }
    }
    if (this.#config.padding_characters_after > 0) {
      for (let c = 1; c <= this.#config.padding_characters_after; c++) {
        passwd += padChar;
      }
    }
    return passwd;
  }
}

export {XKPasswd};
