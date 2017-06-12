/**
 * @overview Base module to be imported as the foundation for all pages
 * @module js/Core.js
 * @todo Move `touch` class injection into function if we keep Feature.js
 * @todo Modularize the init() method
*/

import feature from 'feature';
import attachFastClick from 'fastclick';

export const Core = {

  init() {
    /**
     * Checks for browser support of the `touch-action` CSS property and if so,
     * adds a class to the body to prevent the 300ms delay on touch devices.
     * If the property isn't supported, the FastClick polyfill is instantiated.
    */
    if (`touchAction` in document.body.style) {
      document.body.classList.add(`no-touch-delay`);
    } else {
      attachFastClick(document.body);
    }

    /**
     * Checks if the user is on a touch device and if so, adds the `touch` class
     * to the HTML element. If not, the `no-touch` class is added.
    */
    if (feature.touch) {
      document.documentElement.classList.add(`touch`);
    } else {
      document.documentElement.classList.add(`no-touch`);
    }
  },
};
