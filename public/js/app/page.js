// 主页渲染
//-------------

function sendLog (key, value) {
	if (!key) {
		return;
	}
	if (!value) {
		value = '';
	}
	ajaxGet('/index/log', {key: key, value: value});
}


function initSlimScroll() {
	if(Mobile.isMobile()) {
		return;
	}
	$("#notebook").slimScroll({
	    height: "100%", // $("#leftNotebook").height()+"px"
	});
	$("#noteItemList").slimScroll({
	    height: "100%", // ($("#leftNotebook").height()-42)+"px"
	});
	/*
	$("#wmd-input").slimScroll({
	    height: "100%", // $("#wmd-input").height()+"px"
	});
	$("#wmd-input").css("width", "100%");
	*/
	
	$("#wmd-panel-preview").slimScroll({
	    height: "100%", // $("#wmd-panel-preview").height()+"px"
	});
	
	$("#wmd-panel-preview").css("width", "100%");
}

//-----------
// 初始化编辑器
function initEditor() {
	// editor
	// toolbar 下拉扩展, 也要resizeEditor
	var mceToobarEverHeight = 0;
	$("#moreBtn").click(function() {
		saveBookmark();
		var $editor = $('#editor');
		if($editor.hasClass('all-tool')) {
			$editor.removeClass('all-tool');
		} else {
			$editor.addClass('all-tool');
		}

		restoreBookmark();
	});

	// 初始化编辑器
	tinymce.init({
		inline: true,
		theme: 'leanote',
		valid_children: "+pre[div|#text|p|span|textarea|i|b|strong]", // ace
		/*
		protect: [
	        /\<\/?(if|endif)\>/g, // Protect <if> & </endif>
	        /\<xsl\:[^>]+\>/g, // Protect <xsl:...>
	        // /<pre.*?>.*?<\/pre>/g, // Protect <pre ></pre>
	        // /<p.*?>.*?<\/p>/g, // Protect <pre ></pre>
	        // /<\?php.*?\?>/g // Protect php code
	    ],
	    */
		setup: function(ed) {
			ed.on('keydown', function(e) {
				// 如果是readony, 则不能做任何操作
				var num = e.which ? e.which : e.keyCode;
				// 如果是readony, 则不能做任何操作, 除了复制
				if(Note.readOnly && !((e.ctrlKey || e.metaKey) && num == 67)) {
					e.preventDefault();
					return;
				}

				// 当输入的时候, 把当前raw删除掉
				LeaAce.removeCurToggleRaw();
			});
			
			// 为了把下拉菜单关闭
			/*
	        ed.on("click", function(e) {
	          // $("body").trigger("click");
	          // console.log(tinymce.activeEditor.selection.getNode());
	        });
	        */
	        
	        // electron下有问题, Ace剪切导致行数减少, #16
			ed.on('cut', function(e) {
				if($(e.target).hasClass('ace_text-input')) {
					e.preventDefault();
					return;
				}
			});
		},
		
		// fix TinyMCE Removes site base url
		// http://stackoverflow.com/questions/3360084/tinymce-removes-site-base-urls
		convert_urls: false, // true会将url变成../api/
		relative_urls: true,
		remove_script_host:false,
		
		selector : "#editorContent",
		
		// content_css 不再需要
		// content_css : [LEA.sPath + "/css/editor/editor.css"], // .concat(em.getWritingCss()),
		skin : "custom",
		language: LEA.locale, // 语言
		plugins : [
				"autolink link leaui_image leaui_mindmap lists hr", "paste",
				"searchreplace leanote_nav leanote_code tabfocus",
				"table textcolor", "leaui_drawio" ], // nonbreaking directionality charmap
		toolbar1 : "formatselect | forecolor backcolor | bold italic underline strikethrough | leaui_image leaui_mindmap leaui_drawio | leanote_code leanote_inline_code | bullist numlist | alignleft aligncenter alignright alignjustify",
		toolbar2 : "outdent indent blockquote | link unlink | table | hr removeformat | subscript superscript | searchreplace | pastetext | leanote_ace_pre | fontselect fontsizeselect",

		// 使用tab键: http://www.tinymce.com/wiki.php/Plugin3x:nonbreaking
		// http://stackoverflow.com/questions/13543220/tiny-mce-how-to-allow-people-to-indent
		// nonbreaking_force_tab : true,
		
		menubar : false,
		toolbar_items_size : 'small',
		statusbar : false,
		url_converter: false,
		font_formats : "Arial=arial,helvetica,sans-serif;"
				+ "Arial Black=arial black,avant garde;"
				+ "Times New Roman=times new roman,times;"
				+ "Courier New=courier new,courier;"
				+ "Tahoma=tahoma,arial,helvetica,sans-serif;"
				+ "Verdana=verdana,geneva;" + "宋体=SimSun;"
				+ "新宋体=NSimSun;" + "黑体=SimHei;"
				+ "微软雅黑=Microsoft YaHei",
		block_formats : "Header 1=h1;Header 2=h2;Header 3=h3;Header 4=h4;Paragraph=p",
		/*
		codemirror: {
		    indentOnInit: true, // Whether or not to indent code on init. 
		    path: 'CodeMirror', // Path to CodeMirror distribution
		    config: {           // CodeMirror config object
		       //mode: 'application/x-httpd-php',
		       lineNumbers: true
		    },
		    jsFiles: [          // Additional JS files to load
		       // 'mode/clike/clike.js',
		       //'mode/php/php.js'
		    ]
		  },
		  */
		  // This option specifies whether data:url images (inline images) should be removed or not from the pasted contents. 
		  // Setting this to "true" will allow the pasted images, and setting this to "false" will disallow pasted images.  
		  // For example, Firefox enables you to paste images directly into any contentEditable field. This is normally not something people want, so this option is "false" by default.
		  paste_data_images: true
	});
	
	// 刷新时保存 参考autosave插件
	window.onbeforeunload = function(e) {
		if (LEA.isLogout) {
			return;
		}
    	Note.curChangedSaveIt(true, null, {refresh: true});
	}

	// 全局快捷键
	// ctrl + s 保存
	// ctrl+e 切换只读与可写
	$('body').on('keydown', function (e) {
		var num = e.which ? e.which : e.keyCode;
		var ctrlOrMetaKey = e.ctrlKey || e.metaKey;
	    if(ctrlOrMetaKey) {
			// 保存
		    if (num == 83 ) { // ctrl + s or command + s
		    	Note.curChangedSaveIt(true, null, {ctrls: true});
		    	e.preventDefault();
		    	return false;
		    }
		    else if (num == 69) { // e
		    	Note.toggleWriteableAndReadOnly();
		    	e.preventDefault();
		    	return false;
		    }
	    }
	});
}

//-----------------------
// 导航
var random = 1;
function scrollTo(self, tagName, text) {
	var iframe = $("#editorContent"); // .contents();
	var target = iframe.find(tagName + ":contains(" + text + ")");
	random++;
	
	// 找到是第几个
	// 在nav是第几个
	var navs = $('#leanoteNavContent [data-a="' + tagName + '-' + encodeURI(text) + '"]');
//	alert('#leanoteNavContent [data-a="' + tagName + '-' + encodeURI(text) + '"]')
	var len = navs.size();
	for(var i = 0; i < len; ++i) {
		if(navs[i] == self) {
			break;
		}
	}
	
	if (target.size() >= i+1) {
		target = target.eq(i);
		// 之前插入, 防止多行定位不准
		// log(target.scrollTop());
		var top = iframe.scrollTop() - iframe.offset().top + target.offset().top; // 相对于iframe的位置
		// var nowTop = iframe.scrollTop();
		// log(nowTop);
		// log(top);
		// iframe.scrollTop(top);
		iframe.animate({scrollTop: top}, 300); // 有问题
		
		/*
		var d = 200; // 时间间隔
		for(var i = 0; i < d; i++) {
			setTimeout(
			(function(top) {
				return function() {
					iframe.scrollTop(top);
				}
			})(nowTop + 1.0*i*(top-nowTop)/d), i);
		}
		// 最后必然执行
		setTimeout(function() {
			iframe.scrollTop(top);
		}, d+5);
		*/
		return;
	}
}

function hideMask () {
	$("#mainMask").html("");
	$("#mainMask").hide(100);
}

//--------------
// 调用之
// $(function() {
	LEA.s3 = new Date();
	console.log('initing...');
	
	// 窗口缩放时
	$(window).resize(function() {
		Mobile.isMobile();
		resizeEditor();
	});
	
	// 初始化编辑器
	initEditor();

	// 左侧, folder 展开与关闭
	$(".folderHeader").click(function() {
		var body = $(this).next();
		var p = $(this).parent();
		if (!body.is(":hidden")) {
			$(".folderNote").removeClass("opened").addClass("closed");
//					body.hide();
			p.removeClass("opened").addClass("closed");
			$(this).find(".fa-angle-down").removeClass("fa-angle-down").addClass("fa-angle-right");
		} else {
			$(".folderNote").removeClass("opened").addClass("closed");
//					body.show();
			p.removeClass("closed").addClass("opened");
			$(this).find(".fa-angle-right").removeClass("fa-angle-right").addClass("fa-angle-down");
		}
	});
	
	// 导航隐藏与显示
	$(".leanoteNav h1").on("click", function(e) {
		var $leanoteNav = $(this).closest('.leanoteNav');
		if (!$leanoteNav.hasClass("unfolder")) {
			$leanoteNav.addClass("unfolder");
		} else {
			$leanoteNav.removeClass("unfolder");
		}
	});
	
	// 邮箱验证
	$("#wrongEmail").click(function() {
		openSetInfoDialog(1);
	});
	
	$("#setTheme").click(function() {
		showDialog2("#setThemeDialog", {title: "主题设置", postShow: function() {
			if (!UserInfo.Theme) {
				UserInfo.Theme = "default";
			}
			$("#themeForm input[value='" + UserInfo.Theme + "']").attr("checked", true);
		}});
	});
	
	//---------
	// 主题
	$("#themeForm").on("click", "input", function(e) {
		var val = $(this).val();
		var preHref = $("#themeLink").attr("href"); // default.css?id=7
		var arr = preHref.split('=');
		var id = 1;
		if (arr.length == 2) {
			id = arr[1];
		}
		$("#themeLink").attr("href", LEA.sPath + "/css/theme/" + val + ".css?id=" + id);
		ajaxPost("/user/updateTheme", {theme: val}, function(re) {
			if(reIsOk(re)) {
				UserInfo.Theme = val
			}
		});
	});

	// 禁止双击选中文字
	$("#notebook, #newMyNote, #myProfile, #topNav, #notesAndSort", "#leanoteNavTrigger").bind("selectstart", function(e) {
		e.preventDefault();
		return false;
	});
	
	// 左侧隐藏或展示
	function updateLeftIsMin(is) {
		ajaxGet("/user/updateLeftIsMin", {leftIsMin: is})
	}

	// 最小化左侧
	var $page = $('#page');
	function minLeft(save) {
		$page.addClass('mini-left');
		if(save) {
			updateLeftIsMin(true);
		}
	}

	// 展开右侧
	function maxLeft(save) {
		$page.removeClass('mini-left');
		$("#noteAndEditor").css("left", UserInfo.NotebookWidth);
		$("#leftNotebook").width(UserInfo.NotebookWidth);
		if(save) {
			updateLeftIsMin(false);
		}
	}
	
	$("#leftSwitcher2").on('click', function() {
		maxLeft(true);
	});
	$("#leftSwitcher").click('click', function() {
		if(Mobile.switchPage()) {
			minLeft(true);
		}
	});
	
	// 得到最大dropdown高度
	// 废弃
	function getMaxDropdownHeight(obj) {
		var offset = $(obj).offset();
		var maxHeight = $(document).height()-offset.top;
		maxHeight -= 70;
		if(maxHeight < 0) {
			maxHeight = 0;
		}	
		
		var preHeight = $(obj).find("ul").height();
		return preHeight < maxHeight ? preHeight : maxHeight;
	}
	
	// mini版
	// 点击展开
	$("#notebookMin div.minContainer").click(function() {
		var target = $(this).attr("target");
		maxLeft(true);
		if(target == "#notebookList") {
			if($("#myNotebooks").hasClass("closed")) {
				$("#myNotebooks .folderHeader").trigger("click");
			}
		} else if(target == "#tagNav") {
			if($("#myTag").hasClass("closed")) {
				$("#myTag .folderHeader").trigger("click");
			}
		} else {
			if($("#myShareNotebooks").hasClass("closed")) {
				$("#myShareNotebooks .folderHeader").trigger("click");
			}
		}
	});
	
	//------------------------
	// 界面设置, 左侧是否是隐藏的
	UserInfo.NotebookWidth = UserInfo.NotebookWidth || $("#notebook").width();
	UserInfo.NoteListWidth = UserInfo.NoteListWidth || $("#noteList").width();
	
	Resize.init();
	Resize.set3ColumnsWidth(UserInfo.NotebookWidth, UserInfo.NoteListWidth);
	Resize.setMdColumnWidth(UserInfo.MdEditorWidth);
	
	if (!Mobile.isMobile()) {
		if (UserInfo.LeftIsMin) {
			minLeft(false);
		}
		else {
			maxLeft(false);
		}
	}
	else {
		maxLeft(false);
	}
	
	// end
	// 开始时显示loading......
	// 隐藏mask
	// hideMask();
	
	// 4/25 防止dropdown太高
	// dropdown
	$('.dropdown').on('shown.bs.dropdown', function () {
		var $ul = $(this).find("ul");
		// $ul.css("max-height", getMaxDropdownHeight(this));
	});
	
	// 编辑器模式
	em.init();
	
	// 手机端?
	Mobile.init();
//});

//------------
// pjax
//------------
var Pjax = {
	init: function() {
		var me = this;
		// 当history改变时
		window.addEventListener('popstate', function(evt){
			var state = evt.state;
			if(!state) {
				return;
			}
			document.title = state.title || "Untitled";
			log("pop");
			me.changeNotebookAndNote(state.noteId);
		}, false);
		
		// ie9
		if(!history.pushState) {
			$(window).on("hashchange", function() {
				var noteId = getHash("noteId");;
				if(noteId) {
					me.changeNotebookAndNote(noteId);
				}
			});
		}
	},
	// pjax调用
	// popstate事件发生时, 转换到noteId下, 此时要转换notebookId
	changeNotebookAndNote: function(noteId) {
		var note = SharedData.getNote(noteId);
		if(!note) {
			return;
		}
		var isShare = note.Perm != undefined;
		
		var notebookId = note.NotebookId;
		// 如果是在当前notebook下, 就不要转换notebook了
		if(Notebook.curNotebookId == notebookId) {
			// 不push state
			Note.changeNoteForPjax(noteId, false);
			return;
		}
		
		// 自己的
		if(!isShare) {
			// 先切换到notebook下, 得到notes列表, 再changeNote
			Notebook.changeNotebook(notebookId, function(notes) {
				NoteList.renderNotes(notes);
				// 不push state
				Note.changeNoteForPjax(noteId, false, true);
			});
		// 共享笔记
		} else {
			Share.changeNotebook(note.UserId, notebookId, function(notes) {
				NoteList.renderNotes(notes);
				// 不push state
				Note.changeNoteForPjax(noteId, false, true);
			});
		}
	},
		
	// ajax后调用
	changeNote: function(noteInfo) {
		var me = this;
		var noteId = noteInfo.NoteId;
		var title = noteInfo.Title;
		var url = '/note/' + noteId;
		if (location.href.indexOf('?online') > 0) {
			url += '?online=' + /online=([0-9])/.exec(location.href)[1];
		}
		if(location.hash) {
			url += location.hash;
		}
		// 如果支持pushState
		if(history.pushState) {
			var state=({
				url: url,
				noteId: noteId,
				title: title,
			});
			history.pushState(state, title, url);
			document.title = title || 'Untitled';
		// 不支持, 则用hash
		} else {
			setHash("noteId", noteId);
		}
	}
};
$(function() {
	Pjax.init();
});

function initLeanoteIfrPlugin () {
	// 如果在iframe下, 很可能是嵌入了leanote
	if (self != window.parent) {
		LEA.topInfo = {};
		// 收到消息
		window.addEventListener('message', function(e) {
			console.log('child 收到消息: ')
			console.log(e.data);
			LEA.topInfo = e.data || {};
			LEA.topInfo.got = true;
		}, false);
		if (window.parent.postMessage) {
			window.parent.postMessage('leanote', '*');
		}
	}
}

// 通过src得到note
function getNoteBySrc(src, callback) {
	ajaxGet('/note/getNoteAndContentBySrc', {src: src}, function (ret) {
		if (ret && ret.Ok) {
			var data = ret.Item;
			if (data) {
				var noteInfo = data.NoteInfo;
				var contentInfo = data.NoteContentInfo;
				for (var i in contentInfo) {
					noteInfo[i] = contentInfo[i];
				}
				callback(noteInfo);
			}
			else {
				callback();
			}
		}
		else {
			callback();
		}
	});
}

// 得到top的info's src
var _topInfoStart = (new Date()).getTime();
function getTopInfoSrc (callback) {
	if (LEA.topInfo.got) {
		return callback(LEA.topInfo.src);
	}
	else {
		// 超过1000ms, 不行
		if ((new Date()).getTime() - _topInfoStart > 2000) {
			return callback();
		}
		setTimeout(function () {
			getTopInfoSrc(callback);
		}, 10);
	}
}

// note.html调用
// 实始化页面
function initPage() {
	initLeanoteIfrPlugin();
	if (LEA.topInfo) {
		getTopInfoSrc(function (src) {
			if (src) {
				getNoteBySrc (src, function (srcNote) {
					_initPage(srcNote, true);
				});
			} else {
				_initPage(false, true);
			}
		});
	}
	else {
		_initPage();
	}
}

function _initPage(srcNote, isTop) {
	if (srcNote) {
		curNoteId = srcNote.NoteId;
		curNotebookId = srcNote.NotebookId;
		noteContentJson = srcNote; // 当前笔记变成我的
	}
	else if(isTop) {
		curNoteId = null;
	}

	Notebook.renderNotebooks(notebooks);
	Share.renderShareNotebooks(sharedUserInfos, shareNotebooks);
	
	// 如果初始打开的是共享的笔记
	// 那么定位到我的笔记
	if(curSharedNoteNotebookId) {
		Share.firstRenderShareNote(curSharedUserId, curSharedNoteNotebookId, curNoteId);
	// 初始打开的是我的笔记
	} else {
		SharedData.initAllNotesList(notes);
		// 判断srcNote是否在notes中
		var isExists = false;
		if (isTop && srcNote && notes) {
			for (var i = 0; i < notes.length; ++i) {
				var note = notes[i];
				if (note.NoteId === srcNote.NoteId) {
					isExists = true;
					notes.splice(i, 1);
					notes.unshift(srcNote);
					break;
				}
			}
			if (!isExists) {
				notes.unshift(srcNote);
			}
		}

		NoteList.renderNotes(notes);

		if(curNoteId) {
			// 指定某个note时才target notebook, /note定位到最新
			// ie10&+要setTimeout
			setTimeout(function() {
				Note.changeNoteForPjax(curNoteId, true, curNotebookId);
				if (isTop) {
					Note.toggleWriteable();
					setTimeout(function () {
						Note.toggleWriteable();
					}, 100);
					// 如果是markdown
					setTimeout(function () {
						Note.toggleWriteable();
					}, 1000);
				}
			});
			if(!curNotebookId) {
				Notebook.selectNotebook($(tt('#notebook [notebookId="?"]', Notebook.allNotebookId)));
			}
		}
	}

	// 指定笔记, 也要保存最新笔记
	if(latestNotes.length > 0) {
		for(var i = 0; i < latestNotes.length; ++i) {
			SharedData.setNoteContent(latestNotes[i]);
		}
	}
	
	Tag.renderTagNav(tagsJson);
	// init notebook后才调用
	initSlimScroll();

	LeaAce.handleEvent();

	// 如果是插件, 则切换到编辑页, 并切换到写作模式
	if (isTop) {
		Mobile.toEditor();

		// 如果没有, 则新建之
		if (!srcNote) {
			Note.newNote();
			Note.toggleWriteable(true);
			setTimeout(function () {
				Note.toggleWriteable(true);
			}, 100);
			// 如果是markdown
			setTimeout(function () {
				Note.toggleWriteable(true);
			}, 1000);
		}
	}

	hideMask();
}