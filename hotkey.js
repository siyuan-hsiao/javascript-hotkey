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
        NULL:'null'
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

    var Hotkey = function (config) {

        this._config = {
            elem:null,
            keyGroup:[],
            timeout:0,
            onSuccess:null,
            onDebug:null
        };

        this.init(config);

        this._binded = false;

        this._startTime = null;
        this._pressedKeys = [];
    };

    var bind = function (elem, event, listener) {
        if (elem.addEventListener)
            elem.addEventListener(event, listener);
    };

    Hotkey.prototype.init = function (config) {

        var keyGroup = config['keyGroup'],
            elem = config['elem'],
            timeout = config['timeout'],
            onSuccess = config['onSuccess'],
            onDebug = config['onDebug'];

        if (type(keyGroup) == type.ARRAY) {
            if (this._allowKeys(keyGroup)) {
                this._config.keyGroup = keyGroup;
            } else {
                throw new Error('set a unallow key');
            }
        }

        if (elem && elem.getAttribute) {

            if (!elem.getAttribute('tabindex'))
                elem.setAttribute('tabindex', '0');

            this._config.elem = elem;
        } else {
            throw new Error('must provider HTMLElement');
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

    Hotkey.prototype._allowKeys = function (keys) {
        return keys.every(this._allowKey);
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
        var me = this;
        this._binded = true;

        bind(this._config.elem, 'keypress', function () {
            me._onKeyPress.apply(me);
        });
    };

    Hotkey.prototype.listen = function (keyGroup) {

        var typeStr = type(keyGroup);

        if (typeStr == type.STRING || typeStr == type.ARRAY) {
            if (typeStr == type.STRING)
                keyGroup = keyGroup.replace(/\s{2,}/g, '').split(' ');

            if (this._allowKeys(keyGroup)) {
                this._config.keyGroup = keyGroup;
            } else {
                throw new Error('set a unallow key');
            }
        } else {
            throw new Error('arg must be a String or Array');
        }

        if (!this._binded)
            this._bindKeyPress();
    };

    window.Hotkey = Hotkey;
})();