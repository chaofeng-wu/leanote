//----------------
// 拖拉改变变宽度
var Resize = {
	lineMove: false,
	mdLineMove: false,
	target: null,
	
	leftNotebook: $("#leftNotebook"),
	notebookSplitter: $("#notebookSplitter"),
	noteList: $("#noteList"),
	noteAndEditor: $("#noteAndEditor"),
	noteSplitter: $("#noteSplitter"),
	note: $("#note"),
	body: $("body"),
	leftColumn: $("#left-column"),
	rightColumn: $("#right-column"), // $("#preview-panel"), // 
	mdSplitter: $("#mdSplitter2"),
	
	init: function() {
		var self = this;
		self.initEvent();
	},
	
	initEvent: function() {
		var self = this;
		
		// 鼠标点下
		$(".noteSplit").bind("mousedown", function(event) {
			event.preventDefault(); // 防止选择文本
			self.lineMove = true;
			$(this).css("background-color", "#ccc");
			self.target = $(this).attr("id");
			// 防止iframe捕获不了事件
			$("#noteMask").css("z-index", 99999); // .css("background-color", // "#ccc");
		});
		
		// 鼠标点下
		self.mdSplitter.bind("mousedown", function(event) {
			event.preventDefault(); // 防止选择文本
			if($(this).hasClass('open')) {
				self.mdLineMove = true;
			}
			// $(this).css("background-color", "#ccc");
		});
		
		// 鼠标移动时
		self.body.bind("mousemove", function(event) {
			if(self.lineMove) { // 如果没有这个if会导致不能选择文本
				event.preventDefault();
				self.resize3Columns(event);
			} else if(self.mdLineMove) {
				event.preventDefault();
				self.resizeMdColumns(event);
			}
		});	

		// 鼠标放开, 结束
		self.body.bind("mouseup", function(event) {
			self.stopResize();
			// 取消遮罩
			$("#noteMask").css("z-index", -1);
		});
		
		// 瞬间
		var everLeftWidth;
		$('.layout-toggler-preview').click(function() {
			var $t = $(this);
			var $p = self.leftColumn.parent();
			// 是开的
			if($t.hasClass('open')) {
				var totalWidth = $p.width();
				var minRightWidth = 22;
				var leftWidth = totalWidth - minRightWidth;
				everLeftWidth = self.leftColumn.width();
				self.leftColumn.width(leftWidth);
				self.rightColumn.css('left', 'auto').width(minRightWidth);
				
				// 禁止split
				$t.removeClass('open');//.addClass('close');
				self.rightColumn.find('.layout-resizer').removeClass('open');
				$('.preview-container').hide();

				if(MD) {
					MD.resize();
				}
			} else {
				$t.addClass('open');
				self.rightColumn.find('.layout-resizer').addClass('open');
				self.leftColumn.width(everLeftWidth);
				$('.preview-container').show();
				self.rightColumn.css('left', everLeftWidth).width('auto');
				
				if(MD) { 
					MD.resize();
				}
			}
		});
	},
	// 停止, 保存数据
	stopResize: function() {
		var self = this;
		if(self.lineMove || self.mdLineMove) {
			// ajax保存
			ajaxGet("/user/updateColumnWidth", {mdEditorWidth: UserInfo.MdEditorWidth, notebookWidth: UserInfo.NotebookWidth, noteListWidth: UserInfo.NoteListWidth}, function() {
			});
		}
		self.lineMove = false;
		self.mdLineMove = false;
		$(".noteSplit").css("background", "none");
		self.mdSplitter.css("background", "none");
	},
	
	// 最终调用该方法
	set3ColumnsWidth: function(notebookWidth, noteListWidth) {
		var self = this;
		if(notebookWidth < 150 || noteListWidth < 100) {
			return;
		}
		var noteWidth = self.body.width() - notebookWidth - noteListWidth;
		if(noteWidth < 400) {
			return;
		}
		
		self.leftNotebook.width(notebookWidth);
		self.notebookSplitter.css("left", notebookWidth);
		
		self.noteAndEditor.css("left", notebookWidth);
		self.noteList.width(noteListWidth);
		self.noteSplitter.css("left", noteListWidth);
		self.note.css("left", noteListWidth);
		
		UserInfo.NotebookWidth = notebookWidth;
		UserInfo.NoteListWidth = noteListWidth;
	},
	resize3Columns: function(event, isFromeIfr) {
		var self = this;
		if (isFromeIfr) {
			event.clientX += self.body.width() - self.note.width();
		}
		
		var notebookWidth, noteListWidth;
		if(self.lineMove) {
			if (self.target == "notebookSplitter") {
				notebookWidth = event.clientX;
				noteListWidth = self.noteList.width();
				self.set3ColumnsWidth(notebookWidth, noteListWidth);
			} else {
				notebookWidth = self.leftNotebook.width();
				noteListWidth = event.clientX - notebookWidth;
				self.set3ColumnsWidth(notebookWidth, noteListWidth);
			}
	
			Editor.resizeEditor();
		}
	},

	resizeMDInterval: null,
	// mdeditor
	resizeMdColumns: function(event) {
		var self = this;
		if (self.mdLineMove) {
			var mdEditorWidth = event.clientX - self.leftColumn.offset().left; // self.leftNotebook.width() - self.noteList.width();
			self.setMdColumnWidth(mdEditorWidth);

			clearInterval(self.resizeMDInterval);

			self.resizeMDInterval = setTimeout(function () {
				MD.resize && MD.resize();
			}, 50);
		}
	},
	// 设置宽度
	setMdColumnWidth: function(mdEditorWidth) { 
		var self = this;
		var allWidth = $('#note').width();
		if(mdEditorWidth > 100 && mdEditorWidth < allWidth - 80) {
			UserInfo.MdEditorWidth = mdEditorWidth;
			self.leftColumn.width(mdEditorWidth);
			self.rightColumn.css("left", mdEditorWidth);
			// self.mdSplitter.css("left", mdEditorWidth);
		}

		// 这样, scrollPreview 才会到正确的位置
		if(MD) {
			MD.onResize();
		}
	}
}

Resize.init();
Resize.set3ColumnsWidth(UserInfo.NotebookWidth, UserInfo.NoteListWidth);
Resize.setMdColumnWidth(UserInfo.MdEditorWidth);