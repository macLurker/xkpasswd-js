import log from 'loglevel';

/**
 * This class handles the rendering of
 * and interaction with the settings
 *
 * @class SettingsView
 */
class SettingsView {
  /**
   * @private {number} aniTime - set time to show/hide elements
   */
  #aniTime = 250;

  /**
   * @constructor
   */
  constructor() {
    this.__togglePaddingType('NONE');
    this.__togglePaddingCharType('CHAR');
    this.__toggleSeparatorType('NONE');

    $('#padding_type').on('change', (e) => {
      this.__togglePaddingType(e);
    });
    $('#padding_char_type').on('change', (e) => {
      this.__togglePaddingCharType(e);
    });
    $('#separator_type').on('change', (e) => {
      this.__toggleSeparatorType(e);
    });
  };

  /**
   * Update the fields in the settings with
   * the contents of the current preset
   *
   * @param {object} preset - settings belonging by the current preset
   */
  renderSettings(preset) {
    // get the current preset
    const keys = Object.keys(preset);

    // update all fields
    keys.forEach((key) => {
      $(`#${key}`).val(preset[key]);
    });

    // hide everything that should not be visible
    this.__toggleSeparatorType(preset.separator_type);
    this.__togglePaddingType(preset.padding_type);
    this.__togglePaddingCharType(preset.padding_char_type);
  };

    /**
   * Bind the form to the event handler.
   *
   * A change in any field of the form will trigger the form
   * validation. If the field input is not valid, an error message will be shown
   * and the Generate button will be disabled.
   * If the field input is valid the modified settings will be saved and the
   * Generate button will be enabled.
   *
   * Save the modified settings to generate passwords
   * based on these new settings
   *
   * @param {Function} handle - pass control to the Controller
   */
  bindSaveSettings(handle) {

    /*
     * Check if the form is valid when the user has clicked away from
     * the form. This should help the user find the field with invalid input
     * if he/she has accidentally closed the accordion bar and the generate
     * button is disabled.
     * Opening the form and clicking in any field should reveal the error message
     * of the culprit.
     */
    $('form#passwordSettings').on('focusin', (e) => {
      const form = e.target.form;
      form.reportValidity();
    });

    /*
     * Set an event handler on a change in any field and if the input is
     * valid, process and save the settings.
     * This removes the need for a 'save' button.
     */
    $('form#passwordSettings').on('change', (e) => {
      e.preventDefault();
      e.stopPropagation(); // stop the event bubbling
      const form = e.target.form;

      log.trace('starting validity checks.');

      // check if the form is valid and if not, show the error message
      if (!form.reportValidity()) {

        // the form is not valid, so disable the Generate button
        $('#generate').addClass('disabled');
      }
      else {
        // the form is valid, so enable the Generate button
        $('#generate').removeClass('disabled');

        // get the form data and pass it on to the controller handle function
        const formData = new FormData(form);
        const data = {};
        [...formData.keys()].forEach((key) => {
          log.trace(`formData.key = ${key}`);
          const values = formData.getAll(key);
          data[key] = (values.length > 1) ? values : values.join();
        });

        log.trace(JSON.stringify(data));
        handle(data);
      }
    });
  }


  /**
     * Toggle visibility of separator type related
     * elements
     *
     * @private
     *
     * @param {Event | string } e - either the
     * event or the type value
     */
  __toggleSeparatorType = (e) => {
    const separatorType = (typeof e == 'string') ? e : $(e.target).val();
    log.trace(`__toggleCharSeparatorType: ${separatorType}`);
    switch (separatorType) {
    case 'NONE':
      $('label[for="separator_type_char"]').hide(this.#aniTime);
      $('#separator_type_char').hide(this.#aniTime);
      $('label[for="separator_alphabet"]').hide(this.#aniTime);
      $('#separator_alphabet').hide(this.#aniTime);
      break;

    case 'CHAR':
      $('label[for="separator_type_char"]').show(this.#aniTime);
      $('#separator_type_char').show(this.#aniTime);
      $('label[for="separator_alphabet"]').hide(this.#aniTime);
      $('#separator_alphabet').hide(this.#aniTime);
      break;

    case 'RANDOM':
      $('label[for="separator_type_char"]').hide(this.#aniTime);
      $('#separator_type_char').hide(this.#aniTime);
      $('label[for="separator_alphabet"]').show(this.#aniTime);
      $('#separator_alphabet').show(this.#aniTime);
      break;

    default:
      try {
        log.warn(`WARNING - Received invalid separator_character=
        ${separatorType}`);
      } catch (e) {};
      break;
    }
    if (typeof e != 'string') {
      e.stopPropagation();
    }
  };

  /**
     * Toggle visibility of padding type related
     * elements
     *
     * @private
     *
     * @param {Event | string } e - either the
     * event or the type value
     */
  __togglePaddingType = (e) => {
    const paddingType = (typeof e == 'string') ? e : $(e.target).val();
    log.trace(`__toggleCharPaddingType: ${paddingType}`);
    switch (paddingType) {
    case 'NONE':
      $('label[for="padding_characters_before"]').hide(this.#aniTime);
      $('#padding_characters_before').hide(this.#aniTime);
      $('label[for="padding_characters_after"]').hide(this.#aniTime);
      $('#padding_characters_after').hide(this.#aniTime);
      $('label[for="pad_to_length"]').hide(this.#aniTime);
      $('#pad_to_length').hide(this.#aniTime);
      $('div#padding_char_container').hide(this.#aniTime);
      break;

    case 'FIXED':
      $('label[for="padding_characters_before"]').show(this.#aniTime);
      $('#padding_characters_before').show(this.#aniTime);
      $('label[for="padding_characters_after"]').show(this.#aniTime);
      $('#padding_characters_after').show(this.#aniTime);
      $('label[for="pad_to_length"]').hide(this.#aniTime);
      $('#pad_to_length').hide(this.#aniTime);
      $('div#padding_char_container').show(this.#aniTime);
      break;

    case 'ADAPTIVE':
      $('label[for="padding_characters_before"]').hide(this.#aniTime);
      $('#padding_characters_before').hide(this.#aniTime);
      $('label[for="padding_characters_after"]').hide(this.#aniTime);
      $('#padding_characters_after').hide(this.#aniTime);
      $('label[for="pad_to_length"]').show(this.#aniTime);
      $('#pad_to_length').show(this.#aniTime);
      $('div#padding_char_container').show(this.#aniTime);
      break;

    default:
      try {
        log.warn(`WARNING - Received invalid padding_type=${paddingType}`);
      } catch (e) {};
      break;
    }
    if (typeof e != 'string') {
      e.stopPropagation();
    }
  };

  /**
     * Toggle visibility of padding type related
     * elements
     *
     * @private
     *
     * @param {Event | string } e - either the
     * event or the type value
     */
  __togglePaddingCharType = (e) => {
    const paddingType = (typeof e == 'string') ? e : $(e.target).val();
    if (typeof e != 'string') {
      e.stopPropagation();
    }
    log.trace(`__togglePaddingCharType: ${paddingType}`);

    switch (paddingType) {
    case 'CHAR':
      $('label[for="padding_char_type_char"]').show(this.#aniTime);
      $('#padding_char_type_char').show(this.#aniTime);
      $('label[for="padding_alphabet"]').hide(this.#aniTime);
      $('#padding_alphabet').hide(this.#aniTime);
      break;

    case 'RANDOM':
      $('label[for="padding_char_type_char"]').hide(this.#aniTime);
      $('#padding_char_type_char').hide(this.#aniTime);
      $('label[for="padding_alphabet"]').show(this.#aniTime);
      $('#padding_alphabet').show(this.#aniTime);
      break;

    case 'SEPARATOR':
      // only allow this option be selected
      // when there is a separator character,
      // if not, switch to single separator char
      if ($('#separator_type').val() == 'NONE') {
        $('#padding_char_type').val('CHAR');
        return;
      }
      // if it is OK to select this option, update the UI appropriately
      $('label[for="padding_char_type_char"]').hide(this.#aniTime);
      $('#padding_char_type_char').hide(this.#aniTime);
      $('label[for="padding_alphabet"]').hide(this.#aniTime);
      $('#padding_alphabet').hide(this.#aniTime);
      break;
    default:
      try {
        log.log(`WARNING - Received invalid padding_type=${paddingType}`);
      } catch (e) {};
      break;
    };
  };
};

export {SettingsView};
