/**
 * @authoer gudehsiao#gmail.com
 * @copyright 2013-2014 gudehsiao#gmail.com
 * @note
 * this script is use to make javascript support hotkey,
 * target browsers are which support window.addEventListener
 * @allowkey
 * a-z A-Z 0-9 ! @ # $ % ^ & * ( ) _ + . ? , < > ' " ; : { } [ ] / \ +
 * @how2use
 *     window.onload = function () {
 *      var elem = document.getElementById('element-id-you-want-to-use-hotkey');
 *      var ht = new Hotkey({
 *          elem:elem,
 *          timeout:1000,
 *          onSuccess:function () {
 *              console.log('success');
 *          }
 *      });
 *
 *      ht.listen('t e s t');
 *      //or
 *      ht.listen(['t','e','s','t']);
 *  };
 *  @version 1.0.1
 *  @updated
 *  support control keys [ctrl] [shift] [alt]
 *  if you want your keys group contains one of above, you must notice the not control keys in
 *  your keys group will ignore case
 *  a-z up/down/left/right
 *
 *  for easy to use, when use control hotkey, will stop the default action of browser's
 *
 *  ht.listen(['ctrl','down']);
 *  //or
 *  ht.listen('ctrl down');
 *  //or
 *  ht.listen('ctrl shift down');
 */
(function () {
    var extend = function (to, from) {
        for (var p in from) {
            if (from.hasOwnProperty(p))
                to[p] = from[p];
        }
    };

    var type = function (object) {
        return Object.prototype.toString.apply(object).match(/\b\w+\b/g)[1].toLowerCase();
    };

    extend(type, {
        OBJECT:'object',
        FUNCTION:'function',
        ARRAY:'array',
        STRING:'string',
        NUMBER:'number',
        UNDEFINED:'Undefined',
        NULL:'null',
        BOOLEAN:'boolean'
    });

    var EventUtil = function (event) {
        this._event = event || window.event;
    };

    EventUtil.prototype.preventDefault = function () {
        if (this._event.preventDefault) {
            this._event.preventDefault();
        } else {
            this._event.returnValue = false;
        }
    };

    EventUtil.prototype.getKeyPressed = function () {
        var timeStamp = this._event.timeStamp || (new Date()).getTime();
        var code = this._event.keyCode || this._event.charCode;
        var value = String.fromCharCode(code);

        return { 'code':code, 'value':value, 'timeStamp':timeStamp };
    };

    var bind = function (elem, event, listener) {
        if (elem.addEventListener)
            elem.addEventListener(event, listener);
        return listener;
    };

    var unbind = function (elem, event, listener) {
        if (elem.removeEventListener)
            elem.removeEventListener(event, listener);
    };


    var Hotkey = function (config) {

        this._config = {
            elem:null,
            keyGroup:[],
            timeout:0,
            onSuccess:null,
            onDebug:null
        };

        this.init(config);

        this._controlKeys = ['ctrl', 'shift', 'alt'];

        this._directionKey = {
            up:38,
            down:40,
            left:37,
            right:39
        };

        this._useKeyDown = false;

        this._startTime = null;
        this._pressedKeys = [];

        this._currentKeyPressListener = null;
        this._currentKeyDownListener = null;
    };

    Hotkey.prototype.init = function (config) {

        var keyGroup = config['keyGroup'],
            elem = config['elem'],
            timeout = config['timeout'],
            onSuccess = config['onSuccess'],
            onDebug = config['onDebug'];

        this._setKeyGroup(keyGroup, true);

        if (elem && elem.getAttribute) {

            if (!elem.getAttribute('tabindex'))
                elem.setAttribute('tabindex', '0');

            this._config.elem = elem;
        } else {
            throw new Error('must provide HTMLElement');
        }

        if (timeout + 0 > 0)
            this._config.timeout = timeout;

        if (type(onSuccess) == type.FUNCTION)
            this._config.onSuccess = onSuccess;

        if (type(onDebug) == type.FUNCTION)
            this._config.onDebug = onDebug;

    };

    Hotkey.prototype._allowKey = function (key) {
        return /[a-zA-Z0-9!@#$%^&*()_+.?,<>'";:{}\[\]\/\\+]/.test(key);
    };

    Hotkey.prototype._allowKeys = function (keys, useControl) {
        useControl = useControl || false;

        if (!useControl) {
            var fn = function (key) {
                return this._allowKey(key);
            };

            return every(keys, fn, this);
        }

        if (indexOf(this._controlKeys, keys[0].toLowerCase()) == -1)
            return 'first one in your key group muse be control key!';

        for (var i = 0, len = keys.length; i < len; ++i) {
            if (indexOf(this._controlKeys, keys[i].toLowerCase()) == -1 && i != len - 1)
                return 'the not control key can only have one and must at the end of you key group!';
            if (!/[a-z]|up|down|left|right/.test(keys[i].toLowerCase()))
                return 'not control can only be [a-z] or up/down/left/right!';
        }

        return true;
    };

    Hotkey.prototype._resetCheck = function () {
        this._startTime = null;
        this._pressedKeys = [];
    };

    Hotkey.prototype._check = function (key, time) {
        var oKeyGroup = this._config.keyGroup,
            oLen = oKeyGroup.length,
            isSuccess = false,
            timeout = this._config.timeout,
            error = -1;

        if (this._startTime !== null && time - this._startTime >= timeout) {
            error = 0;
            this._resetCheck();
        }

        if (0 <= this._pressedKeys.length < oLen) {
            if (this._startTime === null)
                this._startTime = time;

            if (key === oKeyGroup[this._pressedKeys.length]) {
                this._pressedKeys.push(key);
            } else if (error == -1) {
                error = 1;
                this._resetCheck();
            }
        }

        if (this._pressedKeys.length == oLen) {
            isSuccess = true;
            this._resetCheck();
        }

        if (!!this._config.onDebug) {
            error = error == -1 ? 'no' : Hotkey.prototype._check._ERROR[error];
            this._config.onDebug.apply(null, [key, error]);
        }

        return isSuccess;
    };

    Hotkey.prototype._check4control = function (event) {
        event = event || window.event;
        var notCtrlKey = this._config.keyGroup[this._config.keyGroup.length - 1],
            ctrl = indexOf(this._config.keyGroup, 'ctrl') != -1,
            shift = indexOf(this._config.keyGroup, 'shift') != -1,
            alt = indexOf(this._config.keyGroup, 'alt') != -1,
            notCtrlKeyCode,
            keyCode = event.keyCode || event.charCode,
            isSuccess = false;

        notCtrlKeyCode = this._directionKey[notCtrlKey] || notCtrlKey.toUpperCase().charCodeAt(0);

        if (ctrl === event.ctrlKey && shift === event.shiftKey && alt === event.altKey && notCtrlKeyCode === keyCode)
            isSuccess = true;

        return isSuccess;
    };

    Hotkey.prototype._check._ERROR = ['timeout', 'type wrong'];

    Hotkey.prototype._onKeyPress = function (event) {
        var eventUtil = new EventUtil(event),
            keyPress = eventUtil.getKeyPressed(),
            key = keyPress.value,
            time = keyPress.timeStamp;

        if (this._check(key, time) && type(this._config.onSuccess) == type.FUNCTION)
            this._config.onSuccess();
    };

    Hotkey.prototype._bindKeyPress = function () {
        if (type(this._currentKeyPressListener) == type.FUNCTION) {
            unbind(this._config.elem, 'keypress', this._currentKeyPressListener);
        }

        var me = this;

        this._currentKeyPressListener = bind(this._config.elem, 'keypress', function () {
            me._onKeyPress.apply(me);
        });

    };

    Hotkey.prototype._onKeyDown = function (event) {
        var eventUtil = new EventUtil(event), stopDefault;

        if (this._check4control(event) && type(this._config.onSuccess) == type.FUNCTION) {
            stopDefault = this._config.onSuccess();

            if (type(stopDefault) != type.BOOLEAN)
                stopDefault = true;

            if (stopDefault)
                eventUtil.preventDefault();
        }
    };

    Hotkey.prototype._bindKeyDown = function () {
        if (type(this._currentKeyDownListener) == type.FUNCTION) {
            unbind(this._config.elem, 'keydown', this._currentKeyDownListener);
        }

        var me = this;

        this._currentKeyDownListener = bind(this._config.elem, 'keydown', function () {
            me._onKeyDown.apply(me);
        });
    };

    var every = function (array, testFunc, thisObj) {
        if (array.every)
            return array.every(testFunc, thisObj);

        var i = 0, len = array.length, flag = true;
        for (; i < len; ++i) {
            if (!testFunc.apply(thisObj, [array[i], i, array])) {
                flag = false;
                break;
            }
        }

        return flag;
    };

    var indexOf = function (array, target) {
        if (array.indexOf)
            return array.indexOf(target);

        var i = 0, len = array.length, index = -1;
        for (; i < len; ++i) {
            if (array[i] === target) {
                index = i;
                break;
            }
        }

        return index;
    };

    Hotkey.prototype._hasControlKey = function (keyGroup) {
        var i = 0, len = keyGroup.length, tmp, flag = false;

        for (; i < len; ++i) {
            tmp = keyGroup[i].toLowerCase();
            if (indexOf(this._controlKeys, tmp) != -1) {
                flag = true;
                break;
            }
        }

        return flag;
    };

    Hotkey.prototype._setKeyGroup = function (keyGroup, setAfter) {
        var typeStr = type(keyGroup), hasUnallowKey = false, allKeyAllow;

        if (typeStr == type.STRING || typeStr == type.ARRAY) {
            if (typeStr == type.STRING)
                keyGroup = keyGroup.replace(/\s{2,}/g, '').split(' ');

            if (this._hasControlKey(keyGroup)) {
                allKeyAllow = this._allowKeys(keyGroup, true);

                if (allKeyAllow === true) {

                    this._config.keyGroup = keyGroup.join(' ').toLowerCase().split(' ');
                    this._useKeyDown = true;

                } else {
                    hasUnallowKey = true;
                    throw new Error(allKeyAllow);
                }

            } else {
                if (this._allowKeys(keyGroup)) {
                    this._config.keyGroup = keyGroup;
                } else {
                    hasUnallowKey = true;
                }
            }

            if (hasUnallowKey)
                throw new Error('set a unallow key');
        } else if (!setAfter) {
            throw new Error('arg must be a String or Array');
        }
    };

    Hotkey.prototype.listen = function (keyGroup) {

        this._setKeyGroup(keyGroup);

        if (this._useKeyDown) {
            this._bindKeyDown();
        } else {
            this._bindKeyPress();
        }
    };

    window.Hotkey = Hotkey;
})();