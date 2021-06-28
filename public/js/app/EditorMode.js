
//----------------------
// 编辑器模式
function editorMode() {
	this.writingHash = "writing";
	this.normalHash = "normal";
	this.isWritingMode = location.hash.indexOf(this.writingHash) >= 0;
	this.toggleA = null;
}

editorMode.prototype.toggleAText = function(isWriting) {
	var self = this;
	setTimeout(function() {
		var toggleA = $(".toggle-editor-mode a");
		var toggleSpan = $(".toggle-editor-mode span");
		if(isWriting) {
			toggleA.attr("href", "#" + self.normalHash);
			toggleSpan.text(getMsg("normalMode"));
		} else {
			toggleA.attr("href", "#" + self.writingHash);
			toggleSpan.text(getMsg("writingMode"));
		}	
	}, 0);
}
editorMode.prototype.isWriting = function(hash) {
	if(!hash) {
		hash = location.hash;
	}
	return hash.indexOf(this.writingHash) >= 0
}
editorMode.prototype.init = function() {
	this.$themeLink = $("#themeLink");
	this.changeMode(this.isWritingMode);
	var self = this;
	$(".toggle-editor-mode").click(function(e) {
		e.preventDefault();
		saveBookmark();
		var $a = $(this).find("a");
		var isWriting = self.isWriting($a.attr("href"));
		self.changeMode(isWriting);
		// 
		if(isWriting) {
			setHash("m", self.writingHash);
		} else {
			setHash("m", self.normalHash);
		}
		
		restoreBookmark();
	});
}
// 改变模式
editorMode.prototype.changeMode = function(isWritingMode) {
	this.toggleAText(isWritingMode);
	if(isWritingMode) {
		this.writtingMode();
	} else {
		this.normalMode();
	}
};

editorMode.prototype.resizeEditor = function() {
	// css还没渲染完
	setTimeout(function() {
		resizeEditor();
	}, 10);
	setTimeout(function() {
		resizeEditor();
	}, 20);
	setTimeout(function() {
		resizeEditor();
	}, 500);
}
editorMode.prototype.normalMode = function() {
	// 最开始的时候就调用?
	/*
	var $c = $("#editorContent_ifr").contents();
	$c.contents().find("#writtingMode").remove();
	$c.contents().find('link[href$="editor-writting-mode.css"]').remove();
	*/

	$("#noteItemListWrap, #notesAndSort").show();
	$("#noteList").unbind("mouseenter").unbind("mouseleave"); 
	
	var theme = UserInfo.Theme || "default";
	theme += ".css";
	var $themeLink = $("#themeLink");
	// 如果之前不是normal才换
	if(this.$themeLink.attr('href').indexOf('writting-overwrite.css') != -1) {
		this.$themeLink.attr("href", LEA.sPath + "/css/theme/" + theme);
	}
	
	$("#noteList").width(UserInfo.NoteListWidth);
	$("#note").css("left", UserInfo.NoteListWidth);

	this.isWritingMode = false;
	this.resizeEditor();
};

editorMode.prototype.writtingMode = function() {
	if (Note.inBatch) {
		return;
	}
	if(this.$themeLink.attr('href').indexOf('writting-overwrite.css') == -1) {
		this.$themeLink.attr("href", LEA.sPath + "/css/theme/writting-overwrite.css");
	}

	/*
	setTimeout(function() {
		var $c = $("#editorContent_ifr").contents();
		$c.contents().find("head").append('<link type="text/css" rel="stylesheet" href="/css/editor/editor-writting-mode.css" id="writtingMode">');
	}, 0);
	*/
		
	$("#noteItemListWrap, #notesAndSort").fadeOut();
	$("#noteList").hover(function() {
		$("#noteItemListWrap, #notesAndSort").fadeIn();
	}, function() {
		$("#noteItemListWrap, #notesAndSort").fadeOut();
	});
	
	// 点击扩展会使html的height生成, 切换后会覆盖css文件的
	// $("#mceToolbar").css("height", "40px");
	
	//$("#pageInner").addClass("animated fadeInUp");

	this.resizeEditor();
	
	$("#noteList").width(250);
	$("#note").css("left", 0);
	
	// 切换到写模式
	Note.toggleWriteable();

	this.isWritingMode = true;
};

editorMode.prototype.getWritingCss = function() {
	if(this.isWritingMode) {
		return ["/css/editor/editor-writting-mode.css"];
	}
	return [];
}
var editorMode = new editorMode();
LEA.editorMode = editorMode;
editorMode.init();