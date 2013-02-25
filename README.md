javascript-hotkey
=================


/*this script is use to make javascript support hotkey,
 *target browsers are which support window.addEventListener
 *allowkey
 *  a-z A-Z 0-9 ! @ # $ % ^ & * ( ) _ + . ? , < > ' " ; : { } [ ] / \ +
 *how2use
  window.onload = function () {
      var elem = document.getElementById('element-id-you-want-to-use-hotkey');
      var ht = new Hotkey({
          elem:elem,
          timeout:1000,
          onSuccess:function () {
              console.log('success');
          }
      });

      ht.listen('t e s t');
      //or
      ht.listen(['t','e','s','t']);
  };
