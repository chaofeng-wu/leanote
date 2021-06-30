/*
 * @Author: Ethan Wu
 * @Date: 2021-06-27 17:47:48
 * @LastEditTime: 2021-06-29 16:17:42
 * @FilePath: /leanote/public/js/app/editor.js
 */
Editor = {};

// 有tinymce得到的content有<html>包围
// 总会出现<p>&nbsp;<br></p>, 原因, setContent('<p><br data-mce-bogus="1" /></p>') 会设置成 <p> <br></p>
// 所以, 要在getContent时, 当是<p><br data-mce-bogus="1"></p>, 返回 <p><br/></p>
Editor.getEditorContent = function(isMarkdown) {
	var content = Editor._getEditorContent(isMarkdown);
	if (content === '<p><br data-mce-bogus="1"></p>') {
		return '<p><br></p>';
	}
	return content;
}
Editor._getEditorContent = function(isMarkdown) {
	if(!isMarkdown) {
		var editor = tinymce.activeEditor;
		if(editor) {
			var content = $(editor.getBody()).clone();
			// 删除toggle raw 
			content.find('.toggle-raw').remove();

			// single页面没有LeaAce
			if(window.LeaAce && LeaAce.getAce) {
				// 替换掉ace editor
				var pres = content.find('pre');
				for(var i = 0 ; i < pres.length; ++i) {
					var pre = pres.eq(i);
					var id = pre.attr('id');
					var aceEditor = LeaAce.getAce(id);
					if(aceEditor) {
						var val = aceEditor.getValue();
						// 表示有错
						if(LeaAce.isAceError(val)) {
							val = pre.html();
						}
						val = val.replace(/</g, '&lt').replace(/>/g, '&gt');
						pre.removeAttr('style', '').removeAttr('contenteditable').removeClass('ace_editor');
						pre.html(val);
					}
				}
			}
			
			// 去掉恶心的花瓣注入
			// <pinit></pinit>
			// 把最后的<script>..</script>全去掉
			content.find("pinit").remove();
			content.find(".thunderpin").remove();
			content.find(".pin").parent().remove();
			content = $(content).html();
			if(content) {
				while(true) {
					var lastEndScriptPos = content.lastIndexOf("</script>");
					if (lastEndScriptPos == -1) {
						return content;
					}
					var length = content.length;
					// 证明</script>在最后, 去除之
					if(length - 9 == lastEndScriptPos) {
						var lastScriptPos = content.lastIndexOf("<script ");
						if(lastScriptPos == -1) {
							lastScriptPos = content.lastIndexOf("<script>");
						}
						if(lastScriptPos != -1) {
							content = content.substring(0, lastScriptPos);
						} else {
							return content;
						}
					} else {
						// 不在最后, 返回
						return content;
					}
				}
			}
			return content;
		}
	} else {
		// return [$("#wmd-input").val(), $("#wmd-preview").html()]
		return [MD.getContent(), '<div>' + $("#preview-contents").html() + '</div>']
	}
}

//切换编辑器
Editor.switchEditor = function(isMarkdown) {
	LEA.isM = isMarkdown;
	// 富文本永远是2
	if(!isMarkdown) {
		$("#editor").show();
		$("#mdEditor").css("z-index", 1).hide();
		
		// 刚开始没有
		$("#leanoteNav").show();
	} else {
		$("#mdEditor").css("z-index", 3).show();
		
		$("#leanoteNav").hide();
	}
}

// editor 设置内容
// 可能是tinymce还没有渲染成功
var previewToken = "<div style='display: none'>FORTOKEN</div>"
var clearIntervalForSetContent;
Editor.setEditorContent = function(content, isMarkdown, preview, callback) {
	if(!content) {
		content = "";
	}
	if(clearIntervalForSetContent) {
		clearInterval(clearIntervalForSetContent);
	}
	if(!isMarkdown) {
		// 先destroy之前的ace
		/*
		if(typeof tinymce != "undefined" && tinymce.activeEditor) {
			var editor = tinymce.activeEditor;
			var everContent = $(editor.getBody());
			if(everContent) {
				LeaAce.destroyAceFromContent(everContent);
			}
		}
		*/
		// $("#editorContent").html(content);
		// 不能先setHtml, 因为在tinymce的setContent前要获取之前的content, destory ACE
		if(typeof tinymce != "undefined" && tinymce.activeEditor) {
			var editor = tinymce.activeEditor;
			editor.setContent(content);
			callback && callback();
			editor.undoManager.clear(); // 4-7修复BUG
		} else {
			// 等下再设置
			clearIntervalForSetContent = setTimeout(function() {
				Editor.setEditorContent(content, false, false, callback);
			}, 100);
		}
	} else {
	/*
		$("#wmd-input").val(content);
		$("#wmd-preview").html(""); // 防止先点有的, 再点tinymce再点没内容的
		if(!content || preview) { // 没有内容就不要解析了
			$("#wmd-preview").html(preview).css("height", "auto");
			if(ScrollLink) {
				ScrollLink.onPreviewFinished(); // 告诉scroll preview结束了
			}
		} else {
			// 还要清空preview
			if(MarkdownEditor) {
				$("#wmd-preview").html(previewToken + "<div style='text-align:center; padding: 10px 0;'><img src='http://leanote.com/images/loading-24.gif' /> 正在转换...</div>");
				MarkdownEditor.refreshPreview();
			} else {
				// 等下再设置
				clearIntervalForSetContent = setTimeout(function() {
					setEditorContent(content, true, preview);
				}, 200);
			}
		}
	*/
		if(MD) {
			MD.setContent(content);
			MD.clearUndo && MD.clearUndo();
			callback && callback();
		} else {
			clearIntervalForSetContent = setTimeout(function() {
				Editor.setEditorContent(content, true, false, callback);
			}, 100);
		}
	}
}

// preview是否为空
Editor.previewIsEmpty = function(preview) {
	if(!preview || preview.substr(0, previewToken.length) == previewToken) {
		return true;
	}
	return false;
}

//-----------------------------------------
Editor.resizeEditor = function(second) {
	LEA.isM && MD && MD.resize && MD.resize();
	return;
	var ifrParent = $("#editorContent_ifr").parent();
    ifrParent.css("overflow", "auto");
    var height = $("#editorContent").height();
    ifrParent.height(height);
    // log(height + '---------------------------------------')
    $("#editorContent_ifr").height(height);

    // life 12.9
    // inline editor
    // $("#editorContent").css("top", $("#mceToolbar").height());
    
    /*
    // 第一次时可能会被改变
    if(!second) {
		setTimeout(function() {
			resizeEditorHeight(true);
		}, 1000);
    }
    */
}

// 当前的note是否改变过了?
// 返回已改变的信息
// 这种改变主要包括content，tag，title
Editor.isNoteChanged = function(force, isRefreshOrCtrls) {

	var curNote = Cache.getCurNote(); 
	if (!curNote) {
		return false;
	}

	var tmpNote = {
		IsChanged: false, // 总的是否有改变
		IsNew: curNote.IsNew, // 是否是新添加的
		IsMarkdown: curNote.IsMarkdown, // 是否是markdown笔记
		FromUserId: curNote.FromUserId, // 是否是共享新建的
		NoteId: curNote.NoteId,
		NotebookId: curNote.NotebookId
	};

	// 收集当前信息, 与cache比对
	var title = $('#noteTitle').val();
	var tags = Tag.getTags();

	if (curNote.IsNew) {
		tmpNote.IsChanged = true;
		tmpNote.title = title;
	}

	if(curNote.Title != title) {
		tmpNote.IsChanged = true; // 本页使用用小写
		tmpNote.Title = title; // 要传到后台的用大写
	}
	
	if(!arrayEqual(curNote.Tags, tags)) {
		tmpNote.IsChanged = true;
		tmpNote.Tags = tags.join(","); // 为什么? 因为空数组不会传到后台
	}

	// 是否需要检查内容呢?

	var needCheckContent = false;
	if (curNote.IsNew || force || !Note.readOnly) {
		needCheckContent = true;
	}

	// 标题, 标签, 内容都没改变
	if (!tmpNote.IsChanged && !needCheckContent) {
		return false;
	}

	// 如果内容没改变
	if (!needCheckContent) {
		return tmpNote;
	}

	//===========
	// 内容的比较

	// 如果是markdown返回[content, preview]
	var contents = this.getEditorContent(curNote.IsMarkdown);
	var content, preview;
	if (isArray(contents)) {
		content = contents[0];
		preview = contents[1];
		// preview可能没来得到及解析
		if (content && Editor.previewIsEmpty(preview) && Converter) {
			preview = Converter.makeHtml(content);
		}
		if(!content) {
			preview = "";
		}
		curNote.Preview = preview; // 仅仅缓存在前台
	} else {
		content = contents;
	}

	// 如果是插件, 且没有改动任何地方
	if ( tmpNote.Src && !tmpNote.Tags && (!content || content == '<p><br></p>')) {
		// 如果不是手动ctrl+s, 则不保存
		if (!(isRefreshOrCtrls && isRefreshOrCtrls.ctrls)) {
			return false;
		}
	}
	
	if (tmpNote.Content != content) {
		tmpNote.IsChanged = true;
		tmpNote.Content = content;
		
		// 从html中得到...
		var c = preview || content;
		
		// 不是博客或没有自定义设置的
		if(!tmpNote.HasSelfDefined || !tmpNote.IsBlog) {
			tmpNote.Desc = Cache.genDescFromContent(c);
			tmpNote.ImgSrc = Cache.getImgSrcFromContent(c);
			tmpNote.Abstract = Cache.getImgSrcFromContent(c);
		}
	} else {
		log("text相同");
	}

	if (tmpNote.IsChanged) {
		return tmpNote;
	}
	return false;
};

Editor.getCurEditorContent = function(){
	var cacheNote = Cache.getCurNote(); 
	var contents = this.getEditorContent(cacheNote.IsMarkdown);
	return contents[0];
}

// 如果当前的改变了, 就保存它
// 以后要定时调用
// force , 默认是true, 表强校验内容
// 定时保存传false
Editor.saveNoteChange = function(force, callback, isRefreshOrCtrls) {
	// 如果当前没有笔记, 不保存
	// 或者是共享的只读笔记
	if(!Cache.curNoteId || Note.isReadOnly) {
		// log(!Note.curNoteId ? '无当前笔记' : '共享只读');
		return;
	}
	var updatedNote;
	try {
		updatedNote = Editor.isNoteChanged(force, isRefreshOrCtrls);
	} catch(e) {
		// console.error('获取当前改变的笔记错误!');
		callback && callback(false);
		return;
	}
	
	if(updatedNote && updatedNote.IsChanged) {

		Editor.saveChangeToServer(updatedNote, callback);

		return updatedNote;
	}
	else {
		log('无需保存');
	}

	return false;
};

Editor.saveChangeToServer = function(updatedNote, callback){
	log('需要保存...');
	// 把已改变的渲染到左边 item-list
	NoteList.renderChangedNote(updatedNote);
	delete updatedNote.IsChanged;
	
	// 保存之
	showMsg(getMsg("saving"));
	
	Net.ajaxPost("/note/updateNoteOrContent", updatedNote, function(ret) {

		if(updatedNote.IsNew) {
			// 缓存之, 后台得到其它信息
			ret.IsNew = false;
			Cache.setNoteContent(ret);

			// 新建笔记也要change history
			Net.Pjax.changeNote(ret);
		}
		callback && callback();
		showMsg(getMsg("saveSuccess"), 1000);
	});
	
	if(updatedNote['Tags'] != undefined && typeof updatedNote['Tags'] == 'string') {
		updatedNote['Tags'] = updatedNote['Tags'].split(',');
	}
	// 先缓存, 把markdown的preview也缓存起来
	Cache.setNoteContent(updatedNote);
	// 设置更新时间
	Cache.setNoteContent({"NoteId": updatedNote.NoteId, "UpdatedTime": (new Date()).format("yyyy-MM-ddThh:mm:ss.S")}, false);
}

// 保存mindmap中的更改
Editor.saveChangeInMindmap = function(markdown){
	var cacheNote = Cache.getCurNote(); 
	if (!cacheNote) {
		return;
	}

	if (cacheNote.Content === markdown) {
		return;
	}

	cacheNote.Content = markdown;
	// cacheNote.preview = Converter.makeHtml(markdown);
	Editor.setEditorContent(cacheNote.Content, cacheNote.IsMarkdown, cacheNote.Preview);

	var hasChanged = {
		hasChanged: true, // 总的是否有改变
		IsNew: cacheNote.IsNew, // 是否是新添加的
		IsMarkdown: cacheNote.IsMarkdown, // 是否是markdown笔记
		FromUserId: cacheNote.FromUserId, // 是否是共享新建的
		NoteId: cacheNote.NoteId,
		NotebookId: cacheNote.NotebookId,
		Content: markdown
	};
	Editor.saveChangeToServer(hasChanged);
}

//-----------
// 初始化编辑器
Editor.initEditor = function() {
	// editor
	// toolbar 下拉扩展, 也要resizeEditor
	var mceToobarEverHeight = 0;
	$("#moreBtn").click(function() {
		LEA.saveBookmark();
		var $editor = $('#editor');
		if($editor.hasClass('all-tool')) {
			$editor.removeClass('all-tool');
		} else {
			$editor.addClass('all-tool');
		}

		LEA.restoreBookmark();
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
    	Editor.saveNoteChange(true, null, {refresh: true});
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
		    	Editor.saveNoteChange(true, null, {ctrls: true});
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
};

// 初始化编辑器
Editor.initEditor();