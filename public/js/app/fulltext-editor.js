/*
 * @Author: Ethan Wu
 * @Date: 2021-06-30 14:16:24
 * @LastEditTime: 2021-07-02 17:56:48
 * @FilePath: /leanote/public/js/app/fulltext-editor.js
 */

// 这个文件是用来管理富文本编辑器

FullTextEditor = {};

FullTextEditor.getEditorContent = function(){
    var editor = tinymce.activeEditor;
    if(!editor){
        return;
    }
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
    if (content === '<p><br data-mce-bogus="1"></p>') {
        content = '<p><br></p>';
    }
    return content;
}

var clearIntervalForSetContent;
FullTextEditor.setEditorContent = function(content,callback) {
    if(!content) {
		content = "";
	}

    if(clearIntervalForSetContent) {
		clearInterval(clearIntervalForSetContent);
	}
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
        setTimeout(function() {
            Editor.setEditorContent(content, false, false, callback);
        }, 100);
    }
}

//-----------
// 初始化编辑器
FullTextEditor.initEditor = function() {
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

FullTextEditor.toggleReadOnly = function(){
    // tinymce
	var $editor = $('#editor');
	$editor.addClass('read-only').removeClass('all-tool'); // 不要全部的

    // 不可写
	$('#editorContent').attr('contenteditable', false);

    $('.info-toolbar').removeClass('invisible');

	var note = Cache.getCurNote();

    $('#infoToolbar .created-time').html(goNowToDatetime(note.CreatedTime));
	$('#infoToolbar .updated-time').html(goNowToDatetime(note.UpdatedTime));

    // 里面的pre也设为不可写
    $('#editorContent pre').each(function() {
        LeaAce.setAceReadOnly($(this), true);
    });
}

FullTextEditor.toggleWriteable = function(isFromNewNote) {
    $('#infoToolbar').hide();
	$('#editor').removeClass('read-only');
	$('#editorContent').attr('contenteditable', true);

    // 里面的pre也设为不可写
    $('#editorContent pre').each(function() {
        LeaAce.setAceReadOnly($(this), false);
    });
    isFromNewNote || tinymce.activeEditor.focus();
}

FullTextEditor.showEditor = function() {
	$("#editor").show();
	// 刚开始没有
	$("#leanoteNav").show();
}

FullTextEditor.hideEditor = function() {
	$("#leanoteNav").hide();
	$("#editor").hide();
}

FullTextEditor.insertAttachLink = function(src){
    tinymce.activeEditor.insertContent(src);
}

FullTextEditor.initEditor();



