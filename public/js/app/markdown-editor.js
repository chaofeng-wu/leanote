/*
 * @Author: Ethan Wu
 * @Date: 2021-06-30 10:44:24
 * @LastEditTime: 2021-07-04 19:39:03
 * @FilePath: /leanote/public/js/app/markdown-editor.js
 */

var MarkdownEditor = editormd("editorMD", {
    mode                 : "gfm",          // gfm or markdown
    name                 : "",             // Form element name for post
    value                : "",             // value for CodeMirror, if mode not gfm/markdown
    theme                : "",             // Editor.md self themes, before v1.5.0 is CodeMirror theme, default empty
    editorTheme          : "default",      // Editor area, this is CodeMirror theme at v1.5.0
    previewTheme         : "",             // Preview area theme, default empty
    markdown             : "",             // Markdown source code
    appendMarkdown       : "",             // if in init textarea value not empty, append markdown to textarea
    width                : "100%",
    height               : "91%",
    path                 : "/js/libs/editor.md/lib/",       // Dependents module file directory
    pluginPath           : "",             // If this empty, default use settings.path + "../plugins/"
    delay                : 300,            // Delay parse markdown to html, Uint : ms
    autoLoadModules      : true,           // Automatic load dependent module files
    watch                : true,
    placeholder          : "Enjoy Markdown! coding now...",
    gotoLine             : true,           // Enable / disable goto a line
    codeFold             : true,
    autoHeight           : false,
    autoFocus            : true,           // Enable / disable auto focus editor left input area
    autoCloseTags        : true,
    searchReplace        : true,           // Enable / disable (CodeMirror) search and replace function
    syncScrolling        : true,           // options: true | false | "single", default true
    readOnly             : false,          // Enable / disable readonly mode
    tabSize              : 4,
    indentUnit           : 4,
    lineNumbers          : true,           // Display editor line numbers
    lineWrapping         : true,
    autoCloseBrackets    : true,
    showTrailingSpace    : true,
    matchBrackets        : true,
    indentWithTabs       : true,
    styleSelectedText    : true,
    matchWordHighlight   : true,           // options: true, false, "onselected"
    styleActiveLine      : true,           // Highlight the current line
    dialogLockScreen     : true,
    dialogShowMask       : true,
    dialogDraggable      : true,
    dialogMaskBgColor    : "#fff",
    dialogMaskOpacity    : 0.1,
    fontSize             : "13px",
    saveHTMLToTextarea   : false,          // If enable, Editor will create a <textarea name="{editor-id}-html-code"> tag save HTML code for form post to server-side.
    disabledKeyMaps      : ["Ctrl-V", "Win-A","Cmd-A"],
    
    onload               : function() { 
        this.setMarkdown(this.markdown);
        MarkdownEditor.previewing();
        MarkdownEditor.isPreviewing = true;
        MarkdownEditor.loaded = true;
        MarkdownEditor.resize();
        $(".editormd-preview").css({ "top": "0px"});
        $("#editorMD").keydown(function(e){
            // if ( e.keyCode === 86) {
            //     return false;
            // }
        });
        
    },
    onresize             : function() {},
    onchange             : function() {},
    onwatch              : null,
    onunwatch            : null,
    onpreviewing         : function() {},
    onpreviewed          : function() {
        MarkdownEditor.isPreviewing = false;
        LEA.readOnly = false;
    },
    onfullscreen         : function() {},
    onfullscreenExit     : function() {},
    onscroll             : function() {},
    onpreviewscroll      : function() {},
    
    imageUpload          : false,          // Enable/disable upload
    imageFormats         : ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
    imageUploadURL       : "",             // Upload url
    crossDomainUpload    : false,          // Enable/disable Cross-domain upload
    uploadCallbackURL    : "",             // Cross-domain upload callback url

    toc                  : true,           // Table of contents
    tocm                 : true,          // Using [TOCM], auto create ToC dropdown menu
    tocTitle             : "",             // for ToC dropdown menu button
    tocDropdown          : true,          // Enable/disable Table Of Contents dropdown menu
    tocContainer         : "",             // Custom Table Of Contents Container Selector
    tocStartLevel        : 1,              // Said from H1 to create ToC
    htmlDecode           : false,          // Open the HTML tag identification 
    pageBreak            : true,           // Enable parse page break [========]
    atLink               : true,           // for @link
    emailLink            : true,           // for email address auto link
    taskList             : true,          // Enable Github Flavored Markdown task lists
    emoji                : true,          // :emoji: , Support Github emoji, Twitter Emoji (Twemoji);
                                           // Support FontAwesome icon emoji :fa-xxx: > Using fontAwesome icon web fonts;
                                           // Support Editor.md logo icon emoji :editormd-logo: :editormd-logo-1x: > 1~8x;
    tex                  : true,          // TeX(LaTeX), based on KaTeX
    flowChart            : true,          // flowChart.js only support IE9+
    sequenceDiagram      : true,          // sequenceDiagram.js only support IE9+
    previewCodeHighlight : true,           // Enable / disable code highlight of editor preview area

    toolbar              : true,           // show or hide toolbar
    toolbarAutoFixed     : false,           // on window scroll auto fixed position
    toolbarIcons         : ["undo", "redo", "|", 
                            "mindmap","|",
                            "bold", "del", "italic", "quote", "ucwords", "uppercase", "lowercase", "|", 
                            "h1", "h2", "h3", "h4", "h5", "h6", "|", 
                            "list-ul", "list-ol", "hr", "|",
                            "link", "reference-link", "picture", "code", "preformatted-text", "code-block", "table", "datetime", "emoji", "html-entities", "pagebreak", "|",
                            "goto-line", "watch", "preview", "clear", "search", "|",
                            "help"],
    toolbarIconsClass : {
        mindmap : "fa-lightbulb",  // 指定一个FontAawsome的图标类
        picture : "fa-image"
    },
    toolbarIconTexts : {},

    // 用于增加自定义工具栏的功能，可以直接插入HTML标签，不使用默认的元素创建图标
    toolbarCustomIcons : {
        // filefar   : "<input type=\"file\" accept=\".md\" />",
        // faicon : "<i class=\"fa fa-star\" onclick=\"alert('faicon');\"></i>"
    },

    // 自定义工具栏按钮的事件处理
    toolbarHandlers : {
        /**
         * @param {Object}      cm         CodeMirror对象
         * @param {Object}      icon       图标按钮jQuery元素对象
         * @param {Object}      cursor     CodeMirror的光标对象，可获取光标所在行和位置
         * @param {String}      selection  编辑器选中的文本
         */
        mindmap : function(cm, icon, cursor, selection) {

            //var cursor    = cm.getCursor();     //获取当前光标对象，同cursor参数
            //var selection = cm.getSelection();  //获取当前选中的文本，同selection参数

            // 替换选中文本，如果没有选中文本，则直接插入
            // cm.replaceSelection("[" + selection + ":testIcon]");

            // // 如果当前没有选中的文本，将光标移到要输入的位置
            // if(selection === "") {
            //     cm.setCursor(cursor.line, cursor.ch + 1);
            // }

            // // this == 当前editormd实例
            // console.log("testIcon =>", this, cm, icon, cursor, selection);
            Mindmap.convertMarkdowmToMindmap();

        },
        picture : function(cm, icon, cursor, selection) {
            Dialog.showImageUploadDialog();
        }
    },

    lang : {
        toolbar : {
            mindmap : "思维导图",
        }
    }
});

MarkdownEditor.getEditorContent = function(){
    var content;
    if (MarkdownEditor) {
        content = MarkdownEditor.getMarkdown();
    }
    return content;
}

MarkdownEditor.setEditorContent = function(content,callback){
    if(!content) {
		content = "";
	}

    if(typeof MarkdownEditor != "undefined" && MarkdownEditor) {
        // editor未加载完成
        if (!MarkdownEditor.loaded) {
            MarkdownEditor.markdown = content;
        }else{
            MarkdownEditor.setMarkdown(content);
            MarkdownEditor.resize();
        }
        callback && callback();
    }
}

MarkdownEditor.isPreviewing = false; // 用来记录preview的状态
MarkdownEditor.toggleWriteable = function(){
    if (!MarkdownEditor.isPreviewing){
        return;
    }
    MarkdownEditor.previewing();
    LEA.readOnly = false;
    MarkdownEditor.isPreviewing = false;
    $('#infoToolbar').hide();
}
MarkdownEditor.loaded = false;

MarkdownEditor.toggleMdReadOnly = function(){
    if (MarkdownEditor.isPreviewing){
        $(".editormd-preview").css({ "top": "0px"});
        return;
    }
    if (MarkdownEditor.loaded) {
        MarkdownEditor.previewing();
        MarkdownEditor.isPreviewing = true;
    }
    var note = Cache.getCurNote();
    $('.info-toolbar').removeClass('invisible');
    $('.info-toolbar').show();
    $('#mdInfoToolbar .created-time').html(goNowToDatetime(note.CreatedTime));
	$('#mdInfoToolbar .updated-time').html(goNowToDatetime(note.UpdatedTime));
    $(".editormd-preview-close-btn").remove();
    $(".editormd-preview").css({ "top": "0px"});
    
}

MarkdownEditor.showEditor = function(){
    MarkdownEditor.show();
}

MarkdownEditor.hideEditor = function(){
    // 显示Editor
    MarkdownEditor.hide();
}

MarkdownEditor.insertAttachLink = function(link, title){
    if (MarkdownEditor.isPreviewing) {
        return;
    }
    MarkdownEditor.cm.replaceSelection("[" + title + "]("+link+")");
}

MarkdownEditor.insertImage = function(link, title, isUploaded){
    if (MarkdownEditor.isPreviewing) {
        return;
    }
    if (title === "") {
        title = "title";
    }
    if (isUploaded) {
        MarkdownEditor.insertValue("![" + title + "]("+link+")");
        return;
    }

    var picture=/(.jpg|.jpeg|.gif|.png|.bmp|.webp)$/;
    var cursor = MarkdownEditor.getCursor();
    var titleLength = title.length;
    var beginCursor = {line:cursor.line,ch:cursor.ch-titleLength};
    MarkdownEditor.setSelection(beginCursor,cursor);
    if (title.search(picture) > 0) {
        MarkdownEditor.replaceSelection("![" + title + "]("+link+")");
    }else{
        MarkdownEditor.replaceSelection("[" + title + "]("+link+")");
    }
}