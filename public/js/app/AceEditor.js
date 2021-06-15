//----------
// aceEditor
LeaAce = {
	// aceEditorID
	_aceId: 0,
	// {id=>ace}
	_aceEditors: {},
	_isInit: false,
	_canAce: false,
	isAce: true, // 切换pre, 默认是true
	disableAddHistory: function() {
		tinymce.activeEditor.undoManager.setCanAdd(false);
	},
	resetAddHistory: function() {
		tinymce.activeEditor.undoManager.setCanAdd(true);
	},
	canAce: function() {
		if(this._isInit) {
			return this._canAce;
		}
		if(getVendorPrefix() == "webkit" && !Mobile.isMobile()) {
			this._canAce = true;
		} else {
			this._canAce = false;
		}
		this._isInit = true;
		return this._canAce;
	},
	canAndIsAce: function() {
		return this.canAce() && this.isAce;
	},
	getAceId: function () {
		this.aceId++;
		return "leanote_ace_" + (new Date()).getTime() + "_" + this._aceId;
	},
	initAce: function(id, val, force) {
		var me = this;
		if(!force && !me.canAndIsAce()) {
			return;
		}
		var $pre = $('#' + id);
		if($pre.length == 0) {
			return;
		}
		var rawCode = $pre.html(); // 原生code
		try {
			me.disableAddHistory();
			
			// 本身就有格式的, 防止之前有格式的显示为<span>(ace下)
			var classes = $pre.attr('class') || '';
			var isHtml = classes.indexOf('brush:html') != -1;
			if($pre.attr('style') || 
				(!isHtml && $pre.html().indexOf('<style>') != -1)) { // 如果是html就不用考虑了, 因为html格式的支持有style
				$pre.html($pre.text());
			}
			$pre.find('.toggle-raw').remove();
			var preHtml = $pre.html();

			$pre.removeClass('ace-to-pre');
			$pre.attr("contenteditable", false); // ? 避免tinymce编辑
			var aceEditor = ace.edit(id);

			aceEditor.container.style.lineHeight = 1.5;
			aceEditor.setTheme("ace/theme/tomorrow");

			var brush = me.getPreBrush($pre);
			var b = "";
			if(brush) {
				try {
					b = brush.split(':')[1];
				} catch(e) {}
			}
			if (!b || b === 'false') {
				b = 'javascript';
			}
			
			aceEditor.session.setMode("ace/mode/" + b);
			aceEditor.session.setOption("useWorker", false); // 不用语法检查
			// retina
			if(window.devicePixelRatio == 2) {
				aceEditor.setFontSize("12px");
			}
			else {
				aceEditor.setFontSize("14px");
			}
			aceEditor.getSession().setUseWorker(false); // 不用语法检查
			aceEditor.setOption("showInvisibles", false); // 不显示空格, 没用
			aceEditor.setShowInvisibles(false); // OK 不显示空格
			aceEditor.setOption("wrap", "free");
			aceEditor.setShowInvisibles(false);
			
			aceEditor.setReadOnly(Note.readOnly);
			
			aceEditor.setAutoScrollEditorIntoView(true);
			aceEditor.setOption("maxLines", 10000);
			aceEditor.commands.addCommand({
			    name: "undo",
			    bindKey: {win: "Ctrl-z", mac: "Command-z"},
			    exec: function(editor) {
			    	var undoManager = editor.getSession().getUndoManager();
			    	if(undoManager.hasUndo()){ 
			    		undoManager.undo();
			    	} else {
			    		undoManager.reset();
			    		tinymce.activeEditor.undoManager.undo();
			    	}
			    }
			});
			this._aceEditors[id] = aceEditor;
			if(val) {
				aceEditor.setValue(val);
				// 不要选择代码
				// TODO
			} else {
				// 防止 <pre><div>xx</div></pre> 这里的<div>消失
				// preHtml = preHtml.replace('/&nbsp;/g', ' '); // 以前是把' ' 全换成了&nbsp;
				// aceEditor.setValue(preHtml);
				// 全不选
				// aceEditor.selection.clearSelection();
			}

			// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
			// "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
			me.resetAddHistory();
			return aceEditor;
		} catch(e) {
			// 当有错误时, 会有XXXXX的形式, 此时不要ace, 直接原生的!!!
			console.error('ace error!!!!');
			console.error(e);
			$pre.attr("contenteditable", true);
			$pre.removeClass('ace-tomorrow ace_editor ace-tm');
			$pre.html(rawCode);
			me.resetAddHistory();
		}
	},
	clearIntervalForInitAce: null,
	initAceFromContent: function(editor) {
		if(!this.canAndIsAce()) {
			var content = $(editor.getBody());
			content.find('pre').removeClass('ace_editor');
			return;
		}
		var me = this;
		// 延迟
		if(this.clearIntervalForInitAce) {
			clearInterval(this.clearIntervalForInitAce);
		}
		this.clearIntervalForInitAce = setTimeout(function() {
			var content = $(editor.getBody());
			var pres = content.find('pre');
			for(var i = 0 ; i < pres.length; ++i) {
				var pre = pres.eq(i);
				
				var aceAndNode = me.isInAce(pre);
				if(aceAndNode) {
					if(isAceError(aceAndNode[0].getValue())) {
						console.error('之前有些没有destroy掉');
					}
					else {
						break;
					}
				}
				
				setTimeout((function(pre) {
					return function() {
						pre.find('.toggle-raw').remove();
						var value = pre.html();
						value = value.replace(/ /g, "&nbsp;").replace(/\<br *\/*\>/gi,"\n").replace(/</g, '&lt;').replace(/>/g, '&gt;');
						pre.html(value);
						var id = pre.attr('id');
						if(!id) {
							id = me.getAceId();
							pre.attr('id', id);
						}
						me.initAce(id);
					}
				})(pre));
			}
		}, 10);
	},

	allToPre: function(editor) {
		if(!this.canAndIsAce()) {
			return;
		}
		var me = this;
		// 延迟
		if(me.clearIntervalForInitAce) {
			clearInterval(me.clearIntervalForInitAce);
		}
		me.clearIntervalForInitAce = setTimeout(function() {
			var content = $(editor.getBody());
			var pres = content.find('pre');
			for(var i = 0 ; i < pres.length; ++i) {
				var pre = pres.eq(i);
				setTimeout((function(pre) {
					return function() {
						me.aceToPre(pre);
					}
				})(pre));
			}
		}, 10);
	},

	undo: function(editor) {
		if(!this.canAndIsAce()) {
			return;
		}
		var me = this;
		// 延迟
		if(this.clearIntervalForInitAce) {
			clearInterval(this.clearIntervalForInitAce);
		}
		this.clearIntervalForInitAce = setTimeout(function() {
			var content = $(editor.getBody());
			var pres = content.find('pre');
			for(var i = 0 ; i < pres.length; ++i) {
				var pre = pres.eq(i);
				setTimeout((function(pre) {
					return function() {
						var value = pre.html();
						var id = pre.attr('id');
						var aceEditor = me.getAce(id);
						if(aceEditor) {
							var value = aceEditor.getValue();
							aceEditor.destroy();
							var aceEditor = me.initAce(id, value);
							// 全不选
							aceEditor.selection.clearSelection();
						} else {
							value = value.replace(/ /g, "&nbsp;").replace(/\<br *\/*\>/gi,"\n");
							pre.html(value);
							var id = pre.attr('id');
							if(!id) {
								id = me.getAceId();
								pre.attr('id', id);
							}
							me.initAce(id);
						}
					}
				})(pre));
			}
		}, 10);
	},
	destroyAceFromContent: function(everContent) {
		if(!this.canAce()) {
			return;
		}
		var pres = everContent.find('pre');
		for(var i = 0 ; i < pres.length; ++i) {
			var id = pres.eq(i).attr('id');
			var aceEditorAndPre = this.getAce(id);
			if(aceEditorAndPre) {
				aceEditorAndPre.destroy();
				this._aceEditors[id] = null;
			}
		}
	},
	getAce: function(id) {
		if(!this.canAce()) {
			return;
		}
		return this._aceEditors[id];
	},
	setAceReadOnly: function(pre, readOnly) {
		var me = this;
		if(typeof pre == 'object') {
			var id = pre.attr('id');
		}
		else {
			var id = pre;
		}
		var ace = me.getAce(id);
		if(ace) {
			ace.setReadOnly(readOnly);
		}
	},
	// 当前焦点是否在aceEditor中
	nowIsInAce: function () {
		if(!this.canAce()) {
			return;
		}
		
		var node = tinymce.activeEditor.selection.getNode();
		// log("now...");
		// log(node);
		return this.isInAce(node);

	},
	nowIsInPre: function(){
		var node = tinymce.activeEditor.selection.getNode();
		// log("now...");
		// log(node);
		return this.isInPre(node);
	},
	isInPre: function(node) {
		var $node = $(node);
		var node = $node.get(0);
		if(node.nodeName == "PRE") {
			return true;
		} else {
			// 找到父是pre
			$pre = $node.closest("pre");
			if($pre.length == 0) {
				return false;
			}
			return true;
		}
	},
	// 是否在node内
	isInAce: function(node) {
		if(!this.canAce()) {
			return;
		}
		var $node = $(node);
		var node = $node.get(0);
		if(node.nodeName == "PRE") {
			// $node.data('brush', brush);
			var id = $node.attr('id');
			var aceEditor = this.getAce(id);
			if(aceEditor) {
				return [aceEditor, $node];
			}
			return false;
		} else {
			// 找到父是pre
			$pre = $node.closest("pre");
			if($pre.length == 0) {
				return false;
			}
			return this.isInAce($pre);
		}
		return false;
	},
	getPreBrush: function (node) {
		var $pre = $(node);
		var classes = $pre.attr('class');
		if(!classes) {
			return '';
		}
		var m = classes.match(/brush:[^ ]*/);
		var everBrush = "";
		if(m && m.length > 0) {
			everBrush = m[0];
		}	
		return everBrush;
	},
	// pre转换成ace
	preToAce: function (pre, force) {
		if(!force && !this.canAce()) {
			return;
		}
		var $pre = $(pre);
		var id = this.getAceId();
		$pre.attr('id', id);
		var editor = this.initAce(id, "", true);
		if(editor) {
			editor.focus();
		}
	},
	aceToPre: function(pre, isFocus) {
		var me = this;
		var $pre = $(pre);
		// 转成pre
		var aceEditorAndPre = me.isInAce($pre);
		if(aceEditorAndPre) {
			var aceEditor = aceEditorAndPre[0];
			var $pre = aceEditorAndPre[1];
			var value = aceEditor.getValue();
			// 表示有错
			if(isAceError(value)) {
				value = $pre.html();
			}
			value = value.replace(/</g, '&lt').replace(/>/g, '&gt');
			// var id = getAceId();
			var replacePre = $('<pre class="' + $pre.attr('class') + ' ace-to-pre">' + value + "</pre>");
			$pre.replaceWith(replacePre);
			aceEditor.destroy();
			me._aceEditors[$pre.attr('id')] = null;
			// log($replacePre);
			if(isFocus) {
				setTimeout(function() {
					var tinymceEditor = tinymce.activeEditor;
					var selection = tinymceEditor.selection;
					var rng = selection.getRng();
					// rng.setStart(replacePre.get(0), 1);
					// rng.setEnd(replacePre.get(0), 9);
					rng.selectNode(replacePre.get(0));
					// selection.setRng(rng);
					// replacePre.focus();
					tinymceEditor.focus();
					replacePre.trigger("click");
					replacePre.html(value + " ");
					// log(">>>>>>>>>>>>>>")
				}, 0);
			}
		}
	},
	// 当删除了pre时, 也要删除toggle raw
	removeAllToggleRaw: function () {
		$('#editorContent .toggle-raw').remove();
	},
	removeCurToggleRaw: function() {
		if(this.curToggleRaw) {
			try {
				this.curToggleRaw.remove();
			}
			catch(e){}
		}
	},
	curToggleRaw: null,
	// 转换raw <-> code
	handleEvent: function () {
		if(!this.canAce()) {
			return;
		}
		var me = this;
		$("#editorContent").on('mouseenter', 'pre', function(e) {
			// log('in');
			// log($(this));
			var $t = $(this);
			$raw = $t.find('.toggle-raw');
			if($raw.length == 0) {
				var curToggleRaw = $('<div class="toggle-raw" title="Toggle code with raw html"><input type="checkbox" /></div>');
				$t.append(curToggleRaw);
				me.curToggleRaw = curToggleRaw;
			}
			$input = $t.find('.toggle-raw input');
			if(LeaAce.isInAce($t)) {
				$input.prop('checked', true);
			} else {
				$input.prop('checked', false);
			}
		});
		$("#editorContent").on('mouseleave', 'pre', function(){
			var $raw = $(this).find('.toggle-raw');
			$raw.remove();
		});
		$("#editorContent").on('change', '.toggle-raw input', function(){
			var checked = $(this).prop('checked');
			var $pre = $(this).closest('pre');
			if (checked) {
				// 转成ace
				me.preToAce($pre, true);
			} else {
				me.aceToPre($pre, true);
			}
		});

		// 当ace里没有内容时, 连续删除则把ace remove掉
		// keydown的delete事件没有
		var lastDeleteTime;
		$("#editorContent").on('keyup', 'pre',  function(e) {
			var keyCode = e.keyCode;
			// console.log('keyup');
			if(keyCode == 8 || keyCode == 46) { // BackSpace || Delete
				// console.log('delete');
				if(!lastDeleteTime) {
					lastDeleteTime = (new Date()).getTime();
				}
				else {
					var now = (new Date()).getTime();
					if(now - lastDeleteTime < 300) { // 间隔时间很短
						var inAce = me.isInAce($(this))
						if(inAce && !inAce[0].getValue()) {
							// console.log('destroy');
							inAce[0].destroy();
							$(this).remove();
							return;
						}
					}
					lastDeleteTime = now;
				}
				// console.log($(this));
			}
		});
	}
};