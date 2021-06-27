
NoteList = {};
NoteList.itemIsBlog = '<div class="item-blog"><i class="fa fa-bold" title="blog"></i></div><div class="item-setting"><i class="fa fa-cog" title="setting"></i></div>';
// for render
NoteList.itemTplNoImg = '<li href="#" class="item ?" data-seq="?" noteId="?">'
NoteList.itemTplNoImg += NoteList.itemIsBlog +'<div class="item-desc"><p class="item-title">?</p><p class="item-info"><i class="fa fa-book"></i> <span class="note-notebook">?</span> <i class="fa fa-clock-o"></i> <span class="updated-time">?</span></p><p class="desc">?</p></div></li>';

// 有image
NoteList.itemTpl = '<li href="#" class="item ? item-image" data-seq="?" noteId="?"><div class="item-thumb" style=""><img src="?"/></div>'
NoteList.itemTpl +=NoteList.itemIsBlog + '<div class="item-desc" style=""><p class="item-title">?</p><p class="item-info"><i class="fa fa-book"></i> <span class="note-notebook">?</span> <i class="fa fa-clock-o"></i> <span class="updated-time">?</span></p><p class="desc">?</p></div></li>';

// for new
NoteList.newItemTpl = '<li href="#" class="item item-active ?" data-seq="?" fromUserId="?" noteId="?">'
NoteList.newItemTpl += NoteList.itemIsBlog + '<div class="item-desc" style="right: 0px;"><p class="item-title">?</p><p class="item-info"><i class="fa fa-book"></i> <span class="note-notebook">?</span> <i class="fa fa-clock-o"></i> <span class="updated-time">?</span></p><p class="desc">?</p></div></li>';

NoteList.noteItemListO = $("#noteItemList");


// called by Notebook
// render 所有notes, 和第一个note的content
NoteList.renderNotesAndFirstOneContent = function(ret) {
	// 错误的ret是一个Object
	if(!isArray(ret)) {
		return;
	}

	// note 导航
	NoteList.renderNotes(ret, false, false);
	// 渲染第一个
	if(!isEmpty(ret[0])) {
		Note.changeNoteForPjax(ret[0].NoteId, true, false);
	} else {
	}
}

NoteList._seqForNew = 0;
NoteList.clearSeqForNew = function () {
	this._seqForNew = 0;
};
NoteList.newNoteSeq = function () {
	return --this._seqForNew;
};
// 这里如果notes过多>100个将会很慢!!, 使用setTimeout来分解
NoteList.renderNotesC = 0;
NoteList.renderNotes = function(notes, forNewNote) {
	var renderNotesC = ++NoteList.renderNotesC;

	this.clearSeqForNew();
	NoteList.batch.reset();

	
	// 手机端不用
	// slimScroll使得手机端滚动不流畅
	if(!LEA.isMobile && !Mobile.isMobile()) {
		$("#noteItemList").slimScroll({ scrollTo: '0px', height: "100%", onlyScrollBar: true});
	}

	if(!notes || typeof notes != "object" || notes.length <= 0) {
		// 如果没有, 那么是不是应该hide editor?
		if(!forNewNote) {
			Note.showEditorMask();
		}
		return;
	}
	Note.hideEditorMask();
	// 新建笔记时会先创建一个新笔记, 所以不能清空
	if(forNewNote == undefined) {
		forNewNote = false;
	}
	if(!forNewNote) {
		NoteList.noteItemListO.html(""); // 清空
	}
	
	// 20个一次
	var len = notes.length;
	var c = Math.ceil(len/20);
	
	NoteList._renderNotes(notes, forNewNote, 1);
	
	for(var i = 1; i < c; ++i) {
		setTimeout(
			(function(i) {
				// 防止还没渲染完就点击另一个notebook了
				return function() {
					if(renderNotesC == NoteList.renderNotesC) {
						NoteList._renderNotes(notes, forNewNote, i+1);
					}
				}
			})(i), i*2000);
	}
};
NoteList._renderNotes = function(notes, forNewNote, tang) { // 第几趟
	var len = notes.length;
	for(var i = (tang-1)*20; i < len && i < tang*20; ++i) {
		var note = notes[i];
		note.Title = trimTitle(note.Title);

		// 笔记作者不是我, 则是共享过来的
		var classes = 'item-my';
		if(!forNewNote && i == 0) {
			classes += " item-active";
		}

		var tmp;
		if(note.ImgSrc) {
			tmp = tt(NoteList.itemTpl, classes, i, note.NoteId, note.ImgSrc, note.Title, Cache.getNotebookTitleById(note.NotebookId), goNowToDatetime(note.UpdatedTime), note.Desc);
		} else {
			tmp = tt(NoteList.itemTplNoImg, classes, i, note.NoteId, note.Title, Cache.getNotebookTitleById(note.NotebookId), goNowToDatetime(note.UpdatedTime), note.Desc);
		}
		tmp = $(tmp);
		if(!note.IsBlog) {
			tmp.removeClass('item-b');
		} else {
			tmp.addClass('item-b');
		}
		NoteList.noteItemListO.append(tmp);
	}
};

// Notebook调用
NoteList.contextmenu = null;
NoteList.notebooksCopy = []; // share会用到
NoteList.initContextmenu = function() {
	var self = NoteList;
	if(NoteList.contextmenu) {
		NoteList.contextmenu.destroy();
	}
	// 得到可移动的notebook
	var notebooks = Notebook.everNotebooks;
	var mc = self.getContextNotebooks(notebooks);
	
	var notebooksMove = mc[0];
	var notebooksCopy = mc[1];
	self.notebooksCopy = mc[2];
	
	//---------------------
	// context menu
	//---------------------
	var noteListMenu = {
		width: 180, 
		items: [
			{ text: getMsg("publicAsBlog"), alias: 'set2Blog', faIcon: "fa-bold", action: NoteList.setNote2Blog },
			{ text: getMsg("cancelPublic"), alias: 'unset2Blog', faIcon: "fa-undo", action: NoteList.unsetNote2Blog },
			{ type: "splitLine" },
			// { text: "分享到社区", alias: 'html2Image', icon: "", action: Note.html2Image},
			{ text: getMsg("exportPdf"), alias: 'exportPDF', faIcon: "fa-file-pdf-o", action: NoteList.exportPDF},
			{ type: "splitLine" },
			{ text: getMsg("delete"), icon: "", faIcon: "fa-trash-o", action: NoteList.deleteNote },
			{ text: getMsg("move"), alias: "move", faIcon: "fa-arrow-right",
				type: "group", 
				width: 180, 
				items: notebooksMove
			},
			{ text: getMsg("copy"), alias: "copy", icon:"", faIcon: "fa-copy",
				type: "group", 
				width: 180, 
				items: notebooksCopy
			}
		], 
		onShow: applyrule,
		onContextMenu: beforeContextMenu,
		
		parent: "#noteItemList",
		children: ".item-my",
	}

	function applyrule(menu) {
		var noteId = $(this).attr("noteId");

		// 要disable的items
		var items = [];

		// 批量模式下不能分享, 导出pdf
		if (NoteList.inBatch) {
			items.push('exportPDF');

			// 如果在trash下
			if(Notebook.curActiveNotebookIsTrash()) {
				items.push("unset2Blog");
				items.push("set2Blog");
				items.push("copy");
			}
		} else {
			var note = Cache.getNote(noteId);
			if(!note) {
				return;
			}

			// 如果是trash, 什么都不能做
			if(note.IsTrash || Notebook.curActiveNotebookIsTrash()) {
				items.push("unset2Blog");
				items.push("set2Blog");
				items.push("copy");
			} else {
				if(!note.IsBlog) {
					items.push("unset2Blog");
				} else {
					items.push("set2Blog");
				}

				// 移动与复制不能是本notebook下
				var notebookTitle = Cache.getNotebookTitleById(note.NotebookId);
				items.push("move." + notebookTitle);
				items.push("copy." + notebookTitle);
			}
		}
		// console.log(items);

		// diable 这里
        menu.applyrule({
        	name: "target..",
            disable: true,
            items: items
        });
	}

	function beforeContextMenu() {
	    return this.id != "target3";
	}
	
	NoteList.contextmenu = $("#noteItemList .item-my").contextmenu(noteListMenu);
};

// 这里速度不慢, 很快
NoteList.getContextNotebooks = function(notebooks) {
	var moves = [];
	var copys = [];
	var copys2 = [];
	for(var i in notebooks) {
		var notebook = notebooks[i];
		var move = {text: notebook.Title, notebookId: notebook.NotebookId, action: NoteList.moveNote}
		var copy = {text: notebook.Title, notebookId: notebook.NotebookId, action: NoteList.copyNote}
		if(!isEmpty(notebook.Subs)) {
			var mc = NoteList.getContextNotebooks(notebook.Subs);
			move.items = mc[0];
			copy.items = mc[1];
			copy2.items = mc[2];
			move.type = "group";
			move.width = 150;
			copy.type = "group";
			copy.width = 150;
			copy2.type = "group";
			copy2.width = 150;
		}
		moves.push(move);
		copys.push(copy);
		copys2.push(copy2);
	}
	return [moves, copys, copys2];
};

NoteList.$itemList = $('#noteItemList');
NoteList.getTargetById = function(noteId) {
	return this.$itemList.find('li[noteId="' + noteId + '"]');
};
//----------
//设为blog/unset
NoteList.setNote2Blog = function(target) {
	NoteList._setBlog(target, true);
};
NoteList.unsetNote2Blog = function(target) {
	NoteList._setBlog(target, false);
};
NoteList._setBlog = function(target, isBlog) {
	// 批量操作
	var noteIds;
	if (NoteList.inBatch) {
		noteIds = NoteList.getBatchNoteIds();
	}
	else {
		noteIds = [$(target).attr("noteId")];
	}
	ajaxPost("/note/setNote2Blog", {noteIds: noteIds, isBlog: isBlog}, function(ret) {
		if(ret) {
			for (var i = 0; i < noteIds.length; ++i) {
				var noteId = noteIds[i];
				var $t = NoteList.getTargetById(noteId);
				if(isBlog) {
					$t.addClass('item-b');
				} else {
					$t.removeClass('item-b');
				}
				Cache.setNoteContent({NoteId: noteId, IsBlog: isBlog}); // 不清空NotesByNotebookId缓存
			}
		}
	});
};

// 导出成PDF
NoteList.exportPDF = function(target) {
	var noteId = $(target).attr("noteId");
	$('<form target="mdImageManager" action="/note/exportPdf" method="GET"><input name="noteId" value="' + noteId + '"/></form>').appendTo('body').submit().remove();
};

// 删除笔记
// 1. 先隐藏, 成功后再移除DOM
// 2. ajax之 noteId
// Share.deleteSharedNote调用
NoteList.deleteNote = function(target, contextmenuItem) {
	var me = NoteList;

	var noteIds;
	if (NoteList.inBatch) {
		noteIds = NoteList.getBatchNoteIds();
	}
	else {
		noteIds = [$(target).attr('noteId')];
	}
	if (isEmpty(noteIds)) {
		return;
	}

	// 如果删除的是已选中的, 赶紧设置curNoteId = null
	if(noteIds.length == 1 && $(target).hasClass("item-active")) {
		// 不保存
		Cache.clearCurNoteId();
		// 清空信息
		Note.clearNoteInfo();
	}

	var $actives;
	if(noteIds.length == 1) {
		$actives = $(target);
	}
	else {
		$actives = NoteList.$itemList.find('.item-active');
	}

	// 1
	$actives.hide();
	// 2
	ajaxPost('/note/deleteNote', {noteIds: noteIds}, function(ret) {
		if(ret) {
			NoteList.changeToNextSkipNotes(noteIds);
			$actives.remove();

			// 删除缓存
			for (var i = 0; i < noteIds.length; ++i) {
				var noteId = noteIds[i];
				var note = Cache.getNote(noteId);
				if (note) {
					// 减少数量
					Notebook.minusNotebookNumberNotes(note.NotebookId);
					Cache.deleteNote(noteId);
					NoteList.renderNotesAndFirstOneContent(note);
				}
			}
		}
	});

	NoteList.batch.reset();
};

// 移动
NoteList.moveNote = function(target, data) {
	// 批量操作
	var noteIds;
	if (NoteList.inBatch) {
		noteIds = NoteList.getBatchNoteIds();
	}
	else {
		noteIds = [$(target).attr('noteId')];
	}

	// 当前在该笔记本下
	var toNotebookId = data.notebookId;
	if (Notebook.getCurNotebookId() == toNotebookId) {
		return;
	}

	if (noteIds.length == 1) {
		var note = Cache.getNote(noteIds[0]);
		if(!note.IsTrash && note.NotebookId == toNotebookId) {
			return;
		}
	}
	
	ajaxPost("/note/moveNote", {noteIds: noteIds, notebookId: toNotebookId}, function(ret) {
		if(ret) {

			for (var i = 0; i < noteIds.length; ++i) {
				var noteId = noteIds[i];
				var note = Cache.getNote(noteId);
				if (note) {
					// 修改笔记数量
					if (note.NotebookId != toNotebookId) {
						Notebook.incrNotebookNumberNotes(toNotebookId);
						if (!note.IsTrash) {
							Notebook.minusNotebookNumberNotes(note.NotebookId);
						}
					}
					else if (note.IsTrash) {
						Notebook.incrNotebookNumberNotes(note.NotebookId);
					}

					// Note.clearCacheByNotebookId(note.NotebookId);

					// 设置缓存
					note.NotebookId = toNotebookId;
					note.IsTrash = false;
					note.UpdatedTime = new Date();
					Cache.setNoteContent(note);
				}
			}

			var $actives;
			if(noteIds.length == 1) {
				$actives = target;
			}
			else {
				$actives = NoteList.$itemList.find('.item-active');
			}
			// 不在all下, 就删除之
			if(!Notebook.curActiveNotebookIsAll()) {
				NoteList.changeToNextSkipNotes(noteIds);
				$actives.remove();
			}
			// 在all下, 不要删除
			else {
				// 不移动, 那么要改变其notebook title
				$actives.find(".note-notebook").html(Cache.getNotebookTitleById(toNotebookId));

				Note.changeNote($actives.eq(0).attr('noteId'));
			}
		}
	});

	// 重置, 因为可能移动后笔记下没笔记了
	Note.batch.reset();
};

// 复制
// data是自动传来的, 是contextmenu数据 
NoteList.copyNote = function(target, data) {
	var me = Note;

	var toNotebookId = data.notebookId;
	var noteIds;
	if (NoteList.inBatch) {
		noteIds = me.getBatchNoteIds();
	}
	else {
		noteIds = [$(target).attr('noteId')];
	}

	// 得到需要复制的
	var needNoteIds = [];
	for (var i = 0; i < noteIds.length; ++i) {
		var noteId = noteIds[i];
		var note = me.getNote(noteId);
		if (note) {
			// trash不能复制, 不能复制给自己
			if (note.IsTrash || note.NotebookId == toNotebookId) {
				continue;
			}
			needNoteIds.push(noteId);
		}
	}
	if (needNoteIds.length == 0) {
		return;
	}

	var url = "/note/copyNote";
	var data = {noteIds: needNoteIds, notebookId: toNotebookId};

	ajaxPost(url, data, function(ret) {
		if(reIsOk(ret)) {
			var notes = ret.Item;
			if (isEmpty(notes)) {
				return;
			}

			// 重新清空cache 之后的
			Note.clearCacheByNotebookId(toNotebookId);
			for (var i = 0; i < notes.length; ++i) {
				var note = notes[i];
				if (!note.NoteId) {
					continue;
				}
				// 改变缓存, 添加之
				Cache.setNoteContent(note);

				// 增加数量
				Notebook.incrNotebookNumberNotes(toNotebookId)
			}
		}
	});
};


// 点击notebook时调用, 渲染第一个笔记
NoteList.contentAjax = null;
NoteList.contentAjaxSeq = 1;
NoteList.changeNote = function(selectNoteId, needSaveChanged, callback) {
	if (!selectNoteId) {
		return;
	}

	// 0
	var target = NoteList.getTargetById(selectNoteId);
	Note.selectTarget(target);
	
	// 2. 设空, 防止在内容得到之前又发生保存
	Cache.clearCurNoteId();
	
	// 2 得到现在的
	// ajax之
	var cacheNote = Cache.getNote(selectNoteId);
	if (!cacheNote) {
		return;
	}
	
	// 这里要切换编辑器
	switchEditor(cacheNote.IsMarkdown);

	// 发送事件
	LEA.trigger('noteChanged', cacheNote);
	
	Attach.renderNoteAttachNum(selectNoteId, true);
	
	NoteList.contentAjaxSeq++;
	var seq = NoteList.contentAjaxSeq;

	function setContent(ret, seq2) {
		Note.contentAjax = null;
		if(seq2 != NoteList.contentAjaxSeq) {
			return;
		}
		Cache.setNoteContent(ret, false);

		// 把其它信息也带上
		ret = Cache.getNote(selectNoteId)
		Note.renderNoteContent(ret);
		
		Note.hideContentLoading();
		
		callback && callback(ret);
	}
	
	if(cacheNote.Content) {
		setContent(cacheNote, seq);
		return;
	}

	var url = "/note/getNoteContent";
	var param = {noteId: selectNoteId};
	
	Note.showContentLoading();
	if(Note.contentAjax != null) {
		Note.contentAjax.abort();
	}
	Note.contentAjax = ajaxGet(url, param, (function (seq2) {
		return function (ret) {
			// 因为之前Content内的IsBlog和Note的IsBlog不同步, 所以去掉Content中的IsBlog
			delete ret['IsBlog'];
			setContent(ret, seq2);
		}
	})(seq));
};

// 要删除noteIds, 找下一个可以的
NoteList.changeToNextSkipNotes = function(noteIds) {
	if (isEmpty(noteIds)) {
		return;
	}

	// 全删除了
	if (NoteList.$itemList.find('li').length == noteIds.length) {
		Note.showEditorMask();
		return;
	}

	// 如果只有一个笔记, 且当前活跃的又不是要删除的, 则不用change
	if (noteIds.length == 1) {
		var $actives = NoteList.$itemList.find('.item-active');
		if ($actives.length == 1 && $actives.attr('noteId') != noteIds[0]) {
			return;
		}
	}

	var $start = NoteList.getTargetById(noteIds[0]);
	var $next = $start.next();
	var i = 1;
	var len = noteIds.length;
	var find = false;
	while($next.length) {
		// 超出了noteIds
		if (i >= len) {
			find = true;
			break;
		}
		// 不在删除的列表中
		if ($next.attr('noteId') != NoteList.getTargetById(noteIds[i]).attr('noteId')) {
			find = true;
			break;
		}

		$next = $next.next();
		i++;
	}

	// 找不到, 证明是要到前一个了
	if (!find) {
		$next = $start.prev();
	}

	if ($next) {
		NoteList.changeNote($next.attr("noteId"));
	}
};


// 批量操作
NoteList.inBatch = false;
NoteList.getBatchNoteIds = function () {
	var noteIds = [];
	var items = NoteList.$itemList.find('.item-active');
	for (var i = 0; i < items.length; ++i) {
		noteIds.push(items.eq(i).attr('noteId'));
	}
	return noteIds;
};
NoteList.batch = {
	$noteItemList: $("#noteItemList"),
	
	cancelInBatch: function () {
		NoteList.inBatch = false;
		this.$body.removeClass('batch');
	},
	setInBatch: function () {
		NoteList.inBatch = true;
		this.$body.addClass('batch');
	},

	// 是否是多选, 至少选了2个
	isInBatch: function () {
		var me = this;
		var items = me.$noteItemList.find('.item-active');
		if (items.length >= 2) {
			return true;
		}
		return false;
	},

	// 得到开始的笔记
	_startNoteO: null, // 开始选择的笔记
	getStartNoteO: function () {
		var me = this;
		if (!me._startNoteO) {
			me._startNoteO = me.getCurSelected();
		}
		return me._startNoteO;
	},

	// 清空以start开头已选择的
	// 用于shift
	_selectByStart: {}, // start.NoteId => [target1, target2]
	clearByStart: function (noteId) {
		var me = this;
		if (!noteId) {
			return;
		}
		var targets = this._selectByStart[noteId];
		if (isEmpty(targets)) {
			return;
		}
		for(var i = 0; i < targets.length; ++i) {
			me.clearTarget(targets[i]);
		}
	},
	selectTo: function ($to) {
		var $start = this.getStartNoteO();
		if (!$start) {
			alert('nono start');
		}

		var startSeq = +$start.data('seq');
		var toSeq = +$to.data('seq');

		var $start2, $to2, startSeq2, toSeq2;
		if (startSeq < toSeq) {
			$start2 = $start;
			$to2 = $to;
			startSeq2 = startSeq;
			toSeq2 = toSeq;
		}
		else {
			$start2 = $to;
			$to2 = $start;
			startSeq2 = toSeq;
			toSeq2 = startSeq;
		}

		// 先清空之
		// 清空以$start为首的, 已选的笔记
		var startNoteId = $start.attr('noteId');
		this.clearByStart(startNoteId);

		var $now = $start2;
		this._selectByStart[startNoteId] = [];
		for (var i = startSeq2; i <= toSeq2; ++i) {
			this.selectTarget($now);
			this._selectByStart[startNoteId].push($now);
			$now = $now.next();
		}
	},

	selectAll: function () {
		this.$noteItemList.find('li').addClass('item-active');
	},

	clearAllSelect: function () {
		Note.clearSelect();
	},

	selectTarget: function ($target) {
		if ($target) {
			$target.addClass('item-active');
		}
	},
	clearTarget: function ($target) {
		if ($target) {
			$target.removeClass('item-active');
		}
	},

	// multi操作
	// 选择之某一
	// 如果之前已选择了, 则取消选择
	select: function ($target) {
		var me = this;
		// 之前已选中
		if ($target.hasClass('item-active')) {
			var isInBatch = this.isInBatch();
			if (isInBatch) {
				$target.removeClass('item-active');
			}
		}
		else {
			me._startNoteO = $target;
			this.selectTarget($target);
		}
	},

	// 得到当前选中的元素
	getCurSelected: function () {
		return this.$noteItemList.find('.item-active');
	},

	// 当重新render后
	reset: function () {
		this.cancelInBatch();
		this._selectByStart = {};
		this._startMove = false;
		this._startNoteO = null;
		this.clearRender();
	},

	// 可以多选
	canBatch: function () {
		return !LEA.em.isWritingMode;
	},

	init: function() {
		var me = this;
		me.$noteItemList.on("click", ".item", function(e) {
			var $this = $(this);
			var noteId = $this.attr("noteId");
			if(!noteId) {
				return;
			}

			var isMulti = false;
			var isConti= false;
			if (me.canBatch()) {
				if (e.shiftKey) {
					isConti = true;
				}
				else {
					isMulti = e.metaKey || e.ctrlKey;
				}
			}

			//----------
			// 多选操作
			//----------
			if (isMulti || isConti) {
				Note.curChangedSaveIt();
			}

			// 多选
			if (isMulti) {
				me.select($this);
				
			// 连续选
			} else if (isConti) {
				// 选择 开始位置到结束位置
				// 当前点击的是结束位置
				me.selectTo($this);
			}

			//---------
			// 单选
			//---------

			// 否则, 不是多选, 清空item-active
			else {
				Note.selectTarget($this);
			}

			me.finalFix();
		});
		
		//----------

		// 鼠标拖动开始
		me._startMove = false;
		me.$noteItemList.on("mousedown", ".item", function(e) {
			if (!me.canBatch()) {
				return;
			}

			// 右键
			if (me.isContextMenu(e)) {
				return;
			}

			if (!me._startMove && (e.metaKey || e.ctrlKey || e.shiftKey)) {
				return;
			}

			me._startNoteO = $(this);
			me._startMove = true;
		});

		// 鼠标正在拖动
		me.$noteItemList.on("mousemove", ".item", function(e) {
			if (me.canBatch() && me._startMove) {

				Note.curChangedSaveIt();

				me.clearAllSelect();

				me.selectTo($(this));

				me.finalFix(true);
			}
		});

		var $body = $('body');
		$body.on('mouseup', function() {
			me._startMove = false;
		});

		// ctrl + all
		$body.keydown(function (e) {
			if (e.target && e.target.nodeName === 'BODY') {
				if ((e.ctrlKey || e.metaKey) && e.which === 65) {
					e.preventDefault();

					if(me.canBatch()) {
						Note.curChangedSaveIt();

						me.selectAll();
						me.finalFix();
					}
				}
			}
		});

		// 不让拖动
		me.$noteItemList.on("dragstart", function(e) {
	    	e.preventDefault();
	    	e.stopPropagation();
    	});

		me.initContextmenu();
	},

	initContextmenu: function () {
		var me = this;

		me.$batchMask.on('contextmenu', function (e) {
			e.preventDefault();
			NoteList.contextmenu.showMenu(e);
		});

		me.$batchMask.find('.batch-info .fa').click(function (e) {
			e.preventDefault();
			e.pageX -= 90;
			e.pageY += 10;

			// 这导致其它dropdown不能隐藏
			e.stopPropagation();
			// 所以
			$(document).click();
			NoteList.contextmenu.showMenu(e);
		});
	},

	$body: $('body'),
	finalFix: function (isMove) {
		var me = this;
		// 选择了几个? 如果 >= 2则是批量操作
		if (me.isInBatch()) {
			// 清空当前笔记, 不让自动保存
			Cache.clearCurNoteId();
			me.renderBatchNotes();
			me.setInBatch();

		// 单个处理
		} else {
			me.clearRender();
			me.cancelInBatch();

			// 为什么还要得到当前选中的, 因为有可能是取消选择
			// 得到当前选中的
			var $target = me.getCurSelected();
			if ($target) {
				var noteId = $target.attr('noteId');

				if (!isMove) {
					me._startNoteO = $target;
				}

				// 手机端处理
				Mobile.changeNote(noteId);
				// 当前的和所选的是一个, 不改变
				if(Cache.curNoteId != noteId) {
					// 不用重定向到notebook
					Note.changeNoteForPjax(noteId, true, false);
				}
			}
		}
	},

	// 判断是否是右击
	isContextMenu: function(evt) {
		if((evt.which != undefined && evt.which==1) || evt.button == 1)
			return false;
		else if((evt.which != undefined && evt.which == 3) || evt.button == 2)
			return true;
		return false;
	},

	//==========
	_notes: {},
	clearRender: function () {
		this._notes = {};
		this.$batchCtn.html('');
		this.hideMask();
	},
	showMask: function () {
		this.$batchMask.css({'z-index': 99}).show();
	},
	hideMask: function () {
		this.$batchMask.css({'z-index': -2}).hide();
	},
	renderBatchNotes: function () {
		var me = this;
		me.showMask();

		var selectedTargets = me.$noteItemList.find('.item-active');
		me.$batchNum.html(selectedTargets.length);

		var ids = {};
		for (var i = 0; i < selectedTargets.length; ++i) {
			var noteId = selectedTargets.eq(i).attr('noteId');
			me.addTo(noteId);
			ids[noteId] = 1;
		}
		for (var noteId in me._notes) {
			if (!ids[noteId]) {
				var $tmp = me._notes[noteId];
				$tmp.css({'margin-left': '-800px'/*, 'margin-top': '100px'*/});
				setTimeout(function() {
					$tmp.remove();
				}, 500);
				delete me._notes[noteId];
			}
		}
	},
	$batchMask: $('#batchMask'),
	$batchCtn: $('#batchCtn'),
	$batchNum: $('#batchMask .batch-info span'),
	_i: 1,
	getRotate: function () {
		var me = this;
		var time = me._i++;
		var e =  time % 2 === 0 ? 1 : -1;
		var rotate = e * Math.random() * 70;
		var margins = [0, 10, 20, 30, 40];
		var margin = e * margins[time % 5] * 3;
		// if (e < 0) {
			margin -= 80;
		// }
		return [e * Math.random() * 30, margin];
	},
	addTo: function(noteId) {
		var me = this;
		if (me._notes[noteId]) {
			return;
		}
		var note = Cache.getCurNote(noteId);
		var title = note.Title || getMsg('unTitled');
		var desc = note.Desc || '...';
		var $note = $('<div class="batch-note"><div class="title">' + title + '</div><div class="content">' + desc + '</div></div>');
		me._notes[noteId] = $note;
		var rotate = me.getRotate();
		me.$batchCtn.append($note);
		setTimeout(function () {
			$note.css({transform: 'rotate(' + rotate[0] + 'deg)', 'margin-left': rotate[1] + 'px'});
		});
	}
};

/**
 * 切换视图
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
 NoteList.toggleView = function (e) {
	var view;
	if (typeof e == 'object' && e) {
		view = $(e.target).data('view');
	}
	else {
		view = e;
	}
	if (!view) {
		view = 'snippet';
	}
	if (view == 'list') {
		$('#noteItemList').addClass('list');
	}
	else {
		$('#noteItemList').removeClass('list');
	}
	localStorage.setItem('viewStyle', view);
	$('.view-style').removeClass('checked');
	$('.view-' + view).addClass('checked');
};

// 更改信息到左侧
// 定时更改 当前正在编辑的信息到左侧导航
// 或change select. 之前的note, 已经改变了
NoteList.renderChangedNote = function(note) {
	if(!note) {
		return;
	}
	
	// 找到左侧相应的note
	var $leftNoteNav = $(tt('[noteId="?"]', note.NoteId));
	if(note.Title) {
		$leftNoteNav.find(".item-title").html(trimTitle(note.Title));
	}
	if(note.Desc) {
		$leftNoteNav.find(".desc").html(trimTitle(note.Desc));
	}
	if(note.ImgSrc) {
		$thumb = $leftNoteNav.find(".item-thumb");
		// 有可能之前没有图片
		if($thumb.length > 0) {
			$thumb.find("img").attr("src", note.ImgSrc);
		} else {
			$leftNoteNav.append(tt('<div class="item-thumb" style=""><img src="?"></div>', note.ImgSrc));
			$leftNoteNav.addClass("item-image");
		}
		$leftNoteNav.find(".item-desc").removeAttr("style");
	} else if(note.ImgSrc == "") {
		$leftNoteNav.find(".item-thumb").remove(); // 以前有, 现在没有了
		$leftNoteNav.removeClass("item-image");
	}
};


$(function() {
	NoteList.batch.init();
	// blog
	NoteList.$itemList.on("click", ".item-blog", function(e) {
		e.preventDefault();
		// 这导致其它dropdown不能隐藏
		e.stopPropagation();
		// 所以
		$(document).click();

		// 得到ID
		var noteId = $(this).parent().attr('noteId');
		var note = Cache.getCurNote(noteId);
		if (note) {
			window.open(Note.getPostUrl(note));
		}
	});

	// note setting
	NoteList.$itemList.on("click", ".item-my .item-setting", function(e) {
		e.preventDefault();

		// 这导致其它dropdown不能隐藏
		e.stopPropagation();
		// 所以
		$(document).click();

		var $p = $(this).parent();
		NoteList.contextmenu.showMenu(e, $p);
	});

	var view = localStorage.getItem('viewStyle');
	NoteList.toggleView(view);
	// view 切换
	$('.view-style').click(function (e) {
		NoteList.toggleView(e);
	});
	$('.sorter-style').click(function (e) {
		NoteList.setNotesSorter(e);
	});
});
