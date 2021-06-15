//--------------------------
// 手机端访问之
Mobile = {
	// 点击之笔记
	// 切换到编辑器模式
	noteO: $("#note"),
	bodyO: $("body"),
	setMenuO: $("#setMenu"),
	// 弃用, 统一使用Pjax
	hashChange: function() {
		var self = Mobile;
		var hash = location.hash;
		// noteId
		if(hash.indexOf("noteId") != -1) {
			self.toEditor(false);
			var noteId = hash.substr(8);
			NoteList.changeNote(noteId, false, false);
		} else {
			// 笔记本和笔记列表
			self.toNormal(false);
		}
	},
	init: function() {
		var self = this;
		self.isMobile();
		// $(window).on("hashchange", self.hashChange);
		// self.hashChange();
		/*
		$("#noteItemList").on("tap", ".item", function(event) {
			$(this).click();
		});
		$(document).on("swipeleft",function(e){
			e.stopPropagation();
			e.preventDefault();
			self.toEditor();
		});
		$(document).on("swiperight",function(e){
			e.stopPropagation();
			e.preventDefault();
			self.toNormal();
		});
		*/
	},
	isMobile: function() {
		var u = navigator.userAgent;
		LEA.isMobile = false;
		LEA.isMobile = /Mobile|Android|iPhone|iPad/i.test(u);
		LEA.isIpad =  /iPad/i.test(u);
		LEA.isIphone = /iPhone/i.test(u);
		if(!LEA.isMobile && $(document).width() <= 700){ 
			LEA.isMobile = true
		}
		return LEA.isMobile;
	},
	// 改变笔记, 此时切换到编辑器模式下
	// note.js click事件处理, 先切换到纯编辑器下, 再调用Note.changeNote()
	changeNote: function(noteId) {
		var self = this;
		if(!LEA.isMobile) {return true;}
		self.toEditor(true, noteId);
		return false;
	},
	
	toEditor: function(changeHash, noteId) {
		var self = this;
		self.bodyO.addClass("full-editor");
		self.noteO.addClass("editor-show");
		/*
		if(changeHash) {
			if(!noteId) {
				noteId = Note.curNoteId;
			}
			location.hash = "noteId=" + noteId;
		}
		*/
	},
	toNormal: function(changeHash) {
		var self = this;
		self.bodyO.removeClass("full-editor");
		self.noteO.removeClass("editor-show");
	
		/*
		if(changeHash) {
			location.hash = "notebookAndNote";
		}
		*/
	},
	switchPage: function() {
		var self = this;
		if(!LEA.isMobile || LEA.isIpad) {return true;}
		if(self.bodyO.hasClass("full-editor")) {
			self.toNormal(true);
		} else {
			self.toEditor(true);
		}
		return false;
	}
}