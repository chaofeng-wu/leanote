/*
 * @Author: Ethan Wu
 * @Date: 2021-06-26 15:14:06
 * @LastEditTime: 2021-06-28 17:07:36
 * @FilePath: /leanote/public/js/app/LEA.js
 */

//-------------
// 全局事件机制

var LEA = {
	_eventCallbacks: {},
	_listen: function(type, callback) {
        var callbacks = this._eventCallbacks[type] || (this._eventCallbacks[type] = []);
        callbacks.push(callback);
    },
    // on('a b', function(params) {})
    on: function(name, callback) {
        var names = name.split(/\s+/);
        for (var i = 0; i < names.length; ++i) {
        	this._listen(names[i], callback);
        }
        return this;
    },
    // off('a b', function(params) {})
    off: function(name, callback) {
        var types = name.split(/\s+/);
        var i, j, callbacks, removeIndex;
        for (i = 0; i < types.length; i++) {
            callbacks = this._eventCallbacks[types[i].toLowerCase()];
            if (callbacks) {
                removeIndex = null;
                for (j = 0; j < callbacks.length; j++) {
                    if (callbacks[j] == callback) {
                        removeIndex = j;
                    }
                }
                if (removeIndex !== null) {
                    callbacks.splice(removeIndex, 1);
                }
            }
        }
    },
    // LEA.trigger('a', {});
    trigger: function(type, params) {
        var callbacks = this._eventCallbacks[type] || [];
        if (callbacks.length === 0) {
            return;
        }
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i].call(this, params);
        }
    }
};

LEA.s3 = new Date();