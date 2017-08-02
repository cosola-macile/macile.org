import waypoints from 'waypoints';

export const StickyNav = {

  /**
   * Add the container and SVG spritesheet to the page
   * @param {string} spriteUrl - URL to a spritesheet
   * @returns {void}
  */
  init() {
    this.nav = document.getElementById('intern-nav')

    this.setWaypoints();

    console.log('waypoints activated')
  },

  /**
   * Create a container element to hold the spritesheet
   * @returns {void}
  */
  setWaypoints(){
    const waypoint = new Waypoint({
      element: document.getElementById('intern-nav'),

      handler: function(direction) {
        this.element.classList.toggle('is-sticky');
      }
    });
  },

};
