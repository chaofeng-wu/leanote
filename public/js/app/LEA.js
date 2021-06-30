/*
 * @Author: Ethan Wu
 * @Date: 2021-06-26 15:14:06
 * @LastEditTime: 2021-06-29 16:44:04
 * @FilePath: /leanote/public/js/app/LEA.js
 */

//-------------
// 全局事件机制

var LEA = {
    s3 : new Date(),
    editorStatus : true,
    isM : false,
    bookmark : null,
    hasBookmark : false,
    sPath : "/public",

    
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
    },
    isMarkdownEditor: function() {
        return LEA.isM;
    },
    saveBookmark: function() {
        try {
            LEA.bookmark = tinymce.activeEditor.selection.getBookmark(); // 光标, 为了处理后重新定位到那个位置
            // 如果之前没有focus, 则会在文档开头设置bookmark, 添加一行, 不行.
            // $p不是<p>, 很诡异
            // 6-5
            if(LEA.bookmark && LEA.bookmark.id) {
                var $ic = $($("#editorContent_ifr").contents());
                var $body = $ic.find("body");
                var $p = $body.children().eq(0);
                // 找到
                if($p.is("span")) {
                    var $children = $p;
                    var $c = $children.eq(0);
                    if($c.attr("id") == LEA.bookmark.id + "_start") {
                        LEA.hasBookmark = false;
                        $c.remove();
                    } else {
                        LEA.hasBookmark = true;
                    }
                } else if($p.is("p")) {
                    var $children = $p.children();
                    if($children.length == 1 && $.trim($p.text()) == "") {
                        var $c = $children.eq(0);
                        if($c.attr("id") == LEA.bookmark.id + "_start") {
                            LEA.hasBookmark = false;
                            $p.remove();
                        } else {
                            LEA.hasBookmark = true;
                        }
                    } else {
                        LEA.hasBookmark = true;
                    }
                }
            }
            
        } catch(e) {}
    },
    restoreBookmark: function() {
        try {
            if(LEA.hasBookmark) {
                // 必须要focus()!!!
                var editor = tinymce.activeEditor;
                editor.focus();
                editor.selection.moveToBookmark(LEA.bookmark);
            }
        } catch(e) {
        }
    }
};