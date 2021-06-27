// 1. notebook change
// notebook一改变, 当前的肯定要保存, ajax是异步的. 此时先清空所有note信息. -> 得到该notebook的notes, 显示出来, 并选中第一个!
// 在这期间定时器还会保存, curNoteId还没换, 所以会清空curNoteId的content!!!

// 2. note change, save cur, 立即curNoteId = ""!!

// 3. 什么时候设置curNoteId? 是ajax得到内容之后设置

Note.isReadOnly = false;

// 当前的note是否改变过了?
// 返回已改变的信息
Note.curHasChanged = function(force, isRefreshOrCtrls) {

	var cacheNote = Cache.getCurNote(); 
	if (!cacheNote) {
		return false;
	}

	var hasChanged = {
		hasChanged: false, // 总的是否有改变
		IsNew: cacheNote.IsNew, // 是否是新添加的
		IsMarkdown: cacheNote.IsMarkdown, // 是否是markdown笔记
		FromUserId: cacheNote.FromUserId, // 是否是共享新建的
		NoteId: cacheNote.NoteId,
		NotebookId: cacheNote.NotebookId
	};

	// 收集当前信息, 与cache比对
	var title = $('#noteTitle').val();
	var tags = Tag.getTags();

	if (cacheNote.IsNew) {
		hasChanged.hasChanged = true;
		hasChanged.title = title;
		// 来源
		if (LEA.topInfo) {
			hasChanged.Src = LEA.topInfo.src;
		}
	}

	if(cacheNote.Title != title) {
		hasChanged.hasChanged = true; // 本页使用用小写
		hasChanged.Title = title; // 要传到后台的用大写
	}
	
	if(!arrayEqual(cacheNote.Tags, tags)) {
		hasChanged.hasChanged = true;
		hasChanged.Tags = tags.join(","); // 为什么? 因为空数组不会传到后台
	}

	// 是否需要检查内容呢?

	var needCheckContent = false;
	if (cacheNote.IsNew || force || !Note.readOnly) {
		needCheckContent = true;
	}

	// 标题, 标签, 内容都没改变
	if (!hasChanged.hasChanged && !needCheckContent) {
		return false;
	}

	if (!needCheckContent) {
		return hasChanged;
	}

	//===========
	// 内容的比较

	// 如果是markdown返回[content, preview]
	var contents = getEditorContent(cacheNote.IsMarkdown);
	var content, preview;
	if (isArray(contents)) {
		content = contents[0];
		preview = contents[1];
		// preview可能没来得到及解析
		if (content && previewIsEmpty(preview) && Converter) {
			preview = Converter.makeHtml(content);
		}
		if(!content) {
			preview = "";
		}
		cacheNote.Preview = preview; // 仅仅缓存在前台
	} else {
		content = contents;
	}

	// 如果是插件, 且没有改动任何地方
	if ( hasChanged.Src && LEA.topInfo && title === LEA.topInfo.title && !hasChanged.Tags &&
		(!content || content == '<p><br></p>')) {
		// 如果不是手动ctrl+s, 则不保存
		if (!(isRefreshOrCtrls && isRefreshOrCtrls.ctrls)) {
			return false;
		}
	}
	
	if (cacheNote.Content != content) {
		hasChanged.hasChanged = true;
		hasChanged.Content = content;
		
		// 从html中得到...
		var c = preview || content;
		
		// 不是博客或没有自定义设置的
		if(!cacheNote.HasSelfDefined || !cacheNote.IsBlog) {
			hasChanged.Desc = Cache.genDescFromContent(c);
			hasChanged.ImgSrc = Cache.getImgSrcFromContent(c);
			hasChanged.Abstract = Cache.getImgSrcFromContent(c);
		}
	} else {
		log("text相同");
	}

	if (hasChanged.hasChanged) {
		return hasChanged;
	}
	return false;
};

Note.getCurEditorContent = function(){
	var cacheNote = Cache.getCurNote(); 
	var contents = getEditorContent(cacheNote.IsMarkdown);
	return contents[0];
}

// 保存mindmap中的更改
Note.saveChangeInMindmap = function(markdown){
	var cacheNote = Cache.getCurNote(); 
	if (!cacheNote) {
		return;
	}

	if (cacheNote.Content === markdown) {
		return;
	}

	cacheNote.Content = markdown;
	// cacheNote.preview = Converter.makeHtml(markdown);
	setEditorContent(cacheNote.Content, cacheNote.IsMarkdown, cacheNote.Preview);

	var hasChanged = {
		hasChanged: true, // 总的是否有改变
		IsNew: cacheNote.IsNew, // 是否是新添加的
		IsMarkdown: cacheNote.IsMarkdown, // 是否是markdown笔记
		FromUserId: cacheNote.FromUserId, // 是否是共享新建的
		NoteId: cacheNote.NoteId,
		NotebookId: cacheNote.NotebookId,
		Content: markdown
	};
	Note.saveChange(hasChanged);
}


// 如果当前的改变了, 就保存它
// 以后要定时调用
// force , 默认是true, 表强校验内容
// 定时保存传false
Note.saveInProcess = {}; // noteId => bool, true表示该note正在保存到服务器, 服务器未响应
Note.curChangedSaveIt = function(force, callback, isRefreshOrCtrls) {
	// 如果当前没有笔记, 不保存
	// 或者是共享的只读笔记
	if(!Cache.curNoteId || Note.isReadOnly) {
		// log(!Note.curNoteId ? '无当前笔记' : '共享只读');
		return;
	}
	var hasChanged;
	try {
		hasChanged = Note.curHasChanged(force, isRefreshOrCtrls);
	} catch(e) {
		// console.error('获取当前改变的笔记错误!');
		callback && callback(false);
		return;
	}
	
	if(hasChanged && hasChanged.hasChanged) {

		Note.saveChange(hasChanged, callback);

		return hasChanged;
	}
	else {
		log('无需保存');
	}

	return false;
};

Note.saveChange = function(hasChanged, callback){
	var me = this;
	log('需要保存...');
	// 把已改变的渲染到左边 item-list
	NoteList.renderChangedNote(hasChanged);
	delete hasChanged.hasChanged;
	
	// 保存之
	showMsg(getMsg("saving"));
	
	me.saveInProcess[hasChanged.NoteId] = true;
	
	Net.ajaxPost("/note/updateNoteOrContent", hasChanged, function(ret) {
		me.saveInProcess[hasChanged.NoteId] = false;
		if(hasChanged.IsNew) {
			// 缓存之, 后台得到其它信息
			ret.IsNew = false;
			Cache.setNoteContent(ret);

			// 新建笔记也要change history
			Pjax.changeNote(ret);
		}
		callback && callback();
		showMsg(getMsg("saveSuccess"), 1000);
	});
	
	if(hasChanged['Tags'] != undefined && typeof hasChanged['Tags'] == 'string') {
		hasChanged['Tags'] = hasChanged['Tags'].split(',');
	}
	// 先缓存, 把markdown的preview也缓存起来
	Cache.setNoteContent(hasChanged);
	// 设置更新时间
	Cache.setNoteContent({"NoteId": hasChanged.NoteId, "UpdatedTime": (new Date()).format("yyyy-MM-ddThh:mm:ss.S")}, false);
}

// 样式
Note.clearSelect = function(target) {
	$(".item").removeClass("item-active");
};
Note.selectTarget = function(target) {
	this.clearSelect();
	$(target).addClass("item-active");

	// this.batch.reset();
};

// 改变note
// 可能改变的是share note
// 1. 保存之前的note
// 2. ajax得到现在的note
Note.showContentLoading = function() {
	$("#noteMaskForLoading").css("z-index", 11);
};
Note.hideContentLoading = function() {
	$("#noteMaskForLoading").css("z-index", -1);
};

Note.directToNote = function(noteId) {
	var $p = $("#noteItemList");
	var pHeight = $p.height();
	// 相对于父亲的位置
	var position = $("[noteId='" + noteId + "']").position();
	if (!position) {
		console.error('no position: ' + noteId);
		return;
	}
	var pTop = position.top;
	var scrollTop = $p.scrollTop();
	pTop += scrollTop;
	/*
	log("..");
	log(noteId);
	log(pTop + ' ' + pHeight + ' ' + scrollTop);
	*/
	
	// 当前的可视范围的元素位置是[scrollTop, pHeight + scrollTop]
	if(pTop >= scrollTop && pTop <= pHeight + scrollTop) {
	} else {
		var top = pTop;
		log("定位到特定note, 在可视范围内");
		// 手机不用slimScroll
		if(!LEA.isMobile && !Mobile.isMobile()) {
			$("#noteItemList").scrollTop(top);
			$("#noteItemList").slimScroll({ scrollTo: top + 'px', height: "100%", onlyScrollBar: true});
		} else {
		}
	}
};

// mustPush表示是否将状态push到state中, 默认为true
// 什么时候为false, 在popstate时
// needTargetNobook默认为false, 在点击notebook, renderfirst时为false
Note.changeNoteForPjax = function(noteId, mustPush, needTargetNotebook) {
	var me = this;
	var note = Cache.getNote(noteId);
	if(!note) {
		return;
	}
	if(needTargetNotebook == undefined) {
		needTargetNotebook = true;
	}
	NoteList.changeNote(noteId, true, function(note) {
		// push state
		if(mustPush == undefined) {
			mustPush = true;
		}
		if(mustPush) {
			Pjax.changeNote(note);
		}
		
		// popstate时虽然选中了note, 但位置可能不可见
		if(needTargetNotebook) {
			Note.directToNote(noteId);
		}
	});
	
	// 第一次render时定位到第一个笔记的notebook 12.06 life
	// 或通过pop时
	// 什么时候需要? 1. 第一次changeNote, 2. pop时, 只有当点击了notebook后才不要
	
	// 这里, 万一是共享笔记呢?
	// 切换到共享中
	if(needTargetNotebook) {
		if($("#myNotebooks").hasClass("closed")) {
			$("#myNotebooks .folderHeader").trigger("click");
		}
		// 如果是子笔记本, 那么要展开父笔记本
		Notebook.expandNotebookTo(note.NotebookId);
	}
};

// 清空右侧note信息, 可能是共享的, 
// 此时需要清空只读的, 且切换到note edit模式下
Note.clearNoteInfo = function() {
	Cache.clearCurNoteId();
	Tag.clearTags();
	$("#noteTitle").val("");
	setEditorContent("");
	
	// markdown editor
	/*
	$("#wmd-input").val("");
	$("#wmd-preview").html("");
	*/
	
	// 只隐藏即可
	$("#noteRead").hide();
};

// 清除noteList导航
Note.clearNoteList = function() {
	NoteList.noteItemListO.html(""); // 清空
};

// 清空所有, 在转换notebook时使用
Note.clearAll = function() {
	// 当前的笔记清空掉
	Cache.clearCurNoteId();
	
	Note.clearNoteInfo();
	Note.clearNoteList();
};

Note.renderNote = function(note) {
	if(!note) {
		return;
	}
	// title
	// 不要trim, 允许用<>
	$("#noteTitle").val(note.Title);
	
	// 当前正在编辑的
	// tags
	Tag.renderTags(note.Tags);
};

// render content
Note.renderNoteContent = function(content) {

	setEditorContent(content.Content, content.IsMarkdown, content.Preview, function() {
		Cache.setCurNoteId(content.NoteId);
		Note.toggleReadOnly();
	});

	// 只有在renderNoteContent时才设置curNoteId
	// Note.curNoteId = content.NoteId;
};

Note.showEditorMask = function() {
	$("#editorMask").css("z-index", 10).show();
	// 要判断是否是垃圾筒
	if(Cache.curNotebookIsTrashOrLatest()) {
		$("#editorMaskBtns").hide();
		$("#editorMaskBtnsEmpty").show();
	} else {
		$("#editorMaskBtns").show();
		$("#editorMaskBtnsEmpty").hide();
	}
};
Note.hideEditorMask = function() {
	$("#editorMask").css("z-index", -10).hide();
};

//更改notes的排序类型
var $sorterStyles = $('.sorter-style');
Note.checkSorter = function (sorterType) {
	// UC无痕浏览
	if (!sorterType) {
		sorterType = 'dateUpdatedDESC';
	}
	var $selected = $('.sorter-' + sorterType);
	if ($selected.is('.checked')) {
		return;
	}
	$sorterStyles.removeClass('checked');
	$selected.addClass('checked');
};
// 重新设置sorter, 此时要重新render
// sortType = dateCreatedASC dateCreatedDESC
Note.setNotesSorter = function (e) {
	var sorterType = $(e.currentTarget).data('sorter');
	if (!sorterType) {
		sorterType = 'dateUpdatedDESC';
	}
	localStorage.setItem("sorterType", sorterType);
	// alert(localStorage.getItem("sorterType"));
	Note.checkSorter(sorterType);

    // 如果当前是tagSearch, search, star 怎么办?
	// 重新Render
    if (Note._isTag || Note._isSearch) {
        // Note.renderNotesAndFirstOneContent(Note._everNotes, false);
    } else {
        // 其实这里也可以用Note._everNotes, 主要是为了缓存数据
        Notebook.changeNotebook(Notebook.curNotebookId);
    }
    // Note.renderNotesAndTargetNote(Note._everNotes, false, false);
	// Api.writeConfig(Config);
};



// 列表是
Note.listIsIn = function (isTag, isSearch) {
	this._isTag = isTag;
	this._isSearch = isSearch;
};

// 新建一个笔记
// 要切换到当前的notebook下去新建笔记
// isShare时fromUserId才有用
// 3.8 add isMarkdown
Note.newNote = function(notebookId, fromUserId, isMarkdown) {
	if (!notebookId) {
		notebookId = $("#curNotebookForNewNote").attr('notebookId');
	}

	// 切换编辑器
	switchEditor(isMarkdown);
	Note.hideEditorMask();

	// 防止从共享read only跳到添加
	Note.hideReadOnly();

	Timer.stopInterval();
	// 保存当前的笔记
	Note.curChangedSaveIt();

	NoteList.batch.reset();

	var note = {NoteId: getObjectId(), 
		Title: "", 
		Tags:[], 
		Content:"",
		NotebookId: notebookId, 
		IsNew: true, 
		FromUserId: fromUserId,
		IsMarkdown: isMarkdown,
		UpdatedTime: new Date(),
		CreatedTime: new Date()}; // 是新的
	if (LEA.topInfo && LEA.topInfo.title) {
		note.Title = LEA.topInfo.title;
	}

	// 添加到缓存中
	Cache.addNewNote(note);
	
	// 清空附件数
	Attach.clearNoteAttachNum();
	
	// 是否是为共享的notebook添加笔记, 如果是, 则还要记录fromUserId
	var newItem = "";
	
	var baseClasses = "item-my";
	
	var notebook = Cache.getNotebookById(notebookId);
	var notebookTitle = notebook ? notebook.Title : "";
	var curDate = getCurDate();
	
	newItem = tt(NoteList.newItemTpl, baseClasses, NoteList.newNoteSeq(), "", note.NoteId, note.Title, notebookTitle, curDate, "");
	
	// notebook是否是Blog
	newItem = $(newItem);
	if(!notebook.IsBlog) {
		newItem.removeClass('item-b');
	}
	else {
		newItem.addClass('item-b');
	}
	
	// 是否在当前notebook下, 不是则切换过去, 并得到该notebook下所有的notes, 追加到后面!
	if(!Notebook.isCurNotebook(notebookId)) {
		// 先清空所有
		Note.clearAll();
		
		// 插入到第一个位置
		NoteList.noteItemListO.prepend(newItem);
		
		// 改变为当前的notebookId
		// 会得到该notebookId的其它笔记
	} else {
		// 插入到第一个位置
		NoteList.noteItemListO.prepend(newItem);
	}

	Note.selectTarget($(tt('[noteId="?"]', note.NoteId)));

	$("#noteTitle").focus();
	
	Note.renderNote(note);
	Note.renderNoteContent(note);
	Cache.setCurrentNoteId(note.NoteId);

	// 更新数量
	Notebook.incrNotebookNumberNotes(notebookId)
	
	// 切换到写模式
	Note.toggleWriteable(true);
};

// 删除或移动笔记后, 渲染下一个或上一个
Note.changeToNext = function(target) {
	var $target = $(target);
	var next = $target.next();
	if(!next.length) {
		var prev = $target.prev();
		if(prev.length) {
			next = prev;
		} else {
			// 就它一个
			Note.showEditorMask();
			return;
		}
	}
	
	NoteList.changeNote(next.attr("noteId"));
};


// 下载
Note.download = function(url, params) {
	var inputs = '';
	for (var i in params) {
		inputs += '<input name="' + i + '" value="' + params[i] + '">';
	}
	$('<form target="mdImageManager" action="' + url + '" method="GET">' + inputs + '</form>').appendTo('body').submit().remove();
};



//--------------
// read only

Note.showReadOnly = function() {
	Note.isReadOnly = true;
	// $("#noteRead").show();
	
	$('#note').addClass('read-only');
};
Note.hideReadOnly = function() {
	Note.isReadOnly = false;
	$('#note').removeClass('read-only');
	$("#noteRead").hide();
};
// read only
Note.renderNoteReadOnly = function(note) {
	Note.showReadOnly();
	$("#noteReadTitle").html(note.Title || getMsg("unTitled"));
	
	Tag.renderReadOnlyTags(note.Tags);
	
	$("#noteReadCreatedTime").html(goNowToDatetime(note.CreatedTime));
	$("#noteReadUpdatedTime").html(goNowToDatetime(note.UpdatedTime));
};

//---------------------------
// 搜索
// 有点小复杂, 因为速度过快会导致没加载完, 然后就保存上一个 => 致使标题没有
// 为什么会标题没有?
Note.lastSearch = null;
Note.lastKey = null; // 判断是否与上一个相等, 相等就不查询, 如果是等了很久再按enter?
Note.lastSearchTime = new Date();
Note.isOver2Seconds = false;
Note.isSameSearch = function(key) {
	// 判断时间是否超过了1秒, 超过了就认为是不同的
	var now = new Date();
	var duration = now.getTime() - Note.lastSearchTime.getTime();
	Note.isOver2Seconds = duration > 2000 ? true : false;
	if(!Note.lastKey || Note.lastKey != key || duration > 1000) {
		Note.lastKey = key;
		Note.lastSearchTime = now;
		return false;
	}
	
	if(key == Note.lastKey) {
		return true;
	}
	
	Note.lastSearchTime = now;
	Note.lastKey = key;
	return false;
};

Note.searchNote = function() {
	var val = $("#searchNoteInput").val();
	if(!val) {
		// 定位到all
		Notebook.changeNotebook("0");
		return;
	}
	// 判断是否与上一个是相同的搜索, 是则不搜索
	if(Note.isSameSearch(val)) {
		return;
	}
	
	// 之前有, 还有结束的
	if(Note.lastSearch) {
		Note.lastSearch.abort();
	}
	
	// 步骤与tag的搜索一样 
	// 1
	Note.curChangedSaveIt();
	
	// 2 先清空所有
	Note.clearAll();
	
	// 发送请求之
	// 先取消上一个
	showLoading();
	Notebook.showNoteAndEditorLoading();

	Note.listIsIn(false, true);
	$("#tagSearch").hide();

	Note.lastSearch = $.post("/note/searchNote", {key: val}, function(notes) {
		hideLoading();
		Notebook.hideNoteAndEditorLoading();
		if(notes) {
			// 成功后设为空
			Note.lastSearch = null;
			// renderNotes只是note列表加载, 右侧笔记详情还没加载
			// 这个时候, 定位第一个, 保存之前的,
			// 	如果: 第一次搜索, renderNotes OK, 还没等到changeNote时
			//		第二次搜索来到, Note.curChangedSaveIt();
			//		导致没有标题了
			// 不是这个原因, 下面的Note.changeNote会导致保存
			
			// 设空, 防止发生上述情况
			// Note.clearCurNoteId();
			
			NoteList.renderNotes(notes);
			if(!isEmpty(notes)) {
				NoteList.changeNote(notes[0].NoteId, false/*, true || Note.isOver2Seconds*/); // isShare, needSaveChanged?, 超过2秒就要保存
			}
		} else {
			// abort的
		}
	});
	// Note.lastSearch.abort();
};

// 设置notebook的blog状态
// 当修改notebook是否是blog时调用
Note.setAllNoteBlogStatus = function(notebookId, isBlog) {
	if(!notebookId) {
		return;
	}
	var notes = Cache.getNotesByNotebookId(notebookId);
	if(!isArray(notes)) {
		return;
	}
	var len = notes.length;
	if(len == 0) {
		for(var i in Note.cache) {
			if(Note.cache[i].NotebookId == notebookId) {
				Note.cache[i].IsBlog = isBlog;
			}
		}
	} else {
		for(var i = 0; i < len; ++i) {
			notes[i].IsBlog = isBlog;
		}
	}
};

// 删除笔记标签
// item = {noteId => usn}
Note.deleteNoteTag = function(item, tag) {
	if(!item) {
		return;
	}
	for(var noteId in item) {
		var note = Cache.getNote(noteId);
		if(note) {
			note.Tags = note.Tags || [];
			for(var i in note.Tags) {
				if(note.Tags[i] == tag) {
					note.Tags.splice(i, 1);
					continue;
				}
			}
			// 如果当前笔记是展示的笔记, 则重新renderTags
			if(noteId == Note.curNoteId) {
				Tag.renderTags(note.Tags);
			}
		}
	}
};

// readonly
Note.readOnly = true; // 默认为false要好?
LEA.readOnly = true;
// 切换只读模式
Note.toggleReadOnly = function(needSave) {
	if(LEA.em && LEA.em.isWriting()) { // 写作模式下
		return Note.toggleWriteable();
	}

	var me = this;
	var note = Cache.getCurNote();

	// tinymce
	var $editor = $('#editor');
	$editor.addClass('read-only').removeClass('all-tool'); // 不要全部的

	// 不可写
	$('#editorContent').attr('contenteditable', false);

	// markdown
	$('#mdEditor').addClass('read-only');
	$('#note').addClass('read-only-editor');

	if(!note) {
		return;
	}
	
	$('.info-toolbar').removeClass('invisible');
	if(note.IsMarkdown) {
		$('#mdInfoToolbar .created-time').html(goNowToDatetime(note.CreatedTime));
		$('#mdInfoToolbar .updated-time').html(goNowToDatetime(note.UpdatedTime));
	}
	else {
		$('#infoToolbar .created-time').html(goNowToDatetime(note.CreatedTime));
		$('#infoToolbar .updated-time').html(goNowToDatetime(note.UpdatedTime));
	}
	
	// 保存之
	if (needSave) {
		Note.curChangedSaveIt();
	}
	
	Note.readOnly = true;
	LEA.readOnly = true;

	if(!note.IsMarkdown) {
		// 里面的pre也设为不可写
		$('#editorContent pre').each(function() {
			LeaAce.setAceReadOnly($(this), true);
		});
	}
};
// 切换到编辑模式
LEA.toggleWriteable = Note.toggleWriteable = function(isFromNewNote) {
	var me = Note;

	// $('#infoToolbar').hide();
	$('#editor').removeClass('read-only');
	$('#note').removeClass('read-only-editor');
	$('#editorContent').attr('contenteditable', true);

	// markdown
	$('#mdEditor').removeClass('read-only');

	var note = Cache.getCurNote();
	if(!note) {
		return;
	}

	Note.readOnly = false;
	LEA.readOnly = false;

	if(!note.IsMarkdown) {
		// 里面的pre也设为不可写
		$('#editorContent pre').each(function() {
			LeaAce.setAceReadOnly($(this), false);
		});
		isFromNewNote || tinymce.activeEditor.focus();
	}
	else {
		if(MD) {
			isFromNewNote || MD.focus();
			MD.onResize();
		}
	}
};

// page ctrl+e也会
Note.toggleWriteableAndReadOnly = function () {
	if (LEA.readOnly) {
		Note.toggleWriteable();
	}
	else {
		Note.toggleReadOnly(true);
	}
};

Note.getPostUrl = function (note) {
	var urlTitle = note.UrlTitle || note.NoteId;
	return UserInfo.PostUrl + '/' + urlTitle;
};




//------------------- 事件
$(function() {
	//-----------------
	// 点击笔记展示之
	// 避免iphone, ipad两次点击
	// http://stackoverflow.com/questions/3038898/ipad-iphone-hover-problem-causes-the-user-to-double-click-a-link
	$("#noteItemList").on("mouseenter", ".item", function(event) {
		if(LEA.isIpad || LEA.isIphone) {
			$(this).trigger("click");
		}
	});

	//------------------
	// 新建笔记
	// 1. 直接点击新建 OR
	// 2. 点击nav for new note
	$("#newNoteBtn, #editorMask .note").click(function() {
		var notebookId = $("#curNotebookForNewNote").attr('notebookId');
		Note.newNote(notebookId);
	});
	$("#newNoteMarkdownBtn, #editorMask .markdown").click(function() {
		var notebookId = $("#curNotebookForNewNote").attr('notebookId');
		Note.newNote(notebookId, false, "", true);
	});
	$("#searchNotebookForList").keyup(function() {
		var key = $(this).val();
		Notebook.searchNotebookForList(key);
	});

	// note title 里按tab, 切换到编辑区
	$('#noteTitle').on("keydown", function(e) {
		var keyCode = e.keyCode || e.witch;
		// tab
		if (keyCode == 9) {
			// 一举两得, 即切换到了writable, 又focus了
			Note.toggleWriteable();
			e.preventDefault();
		}
	});
	
	//---------------------------
	// 搜索, 按enter才搜索
	$("#searchNoteInput").on("keydown", function(e) {
		var keyCode = e.keyCode || e.witch;
		if(keyCode == 13 || keyCode == 108) {
			e.preventDefault();
			Note.searchNote();
			return false;
		}
	});
	
	$("#saveBtn").click(function() {
		// 只有在这里, 才会force
		Note.curChangedSaveIt(true);
	});

	// readony
	// 修改
	$('.toolbar-update').click(function() {
		Note.toggleWriteable();
	});
	$("#editBtn").click(function() {
		Note.toggleWriteableAndReadOnly();
	});

	//
	// 笔记内容里的链接跳转
	$('#editorContent').on('click', 'a', function (e) {
		if (Note.readOnly) {
			var href = $(this).attr('href');
			// 是一个hash
			if (href && href[0] == '#') {
				return;
			}
			e.preventDefault();
			window.open(href);
		}
	});
	$('#preview-contents').on('click', 'a', function (e) {
		var href = $(this).attr('href');
		// 是一个hash
		if (href && href[0] == '#') {
			return;
		}
		e.preventDefault();
		window.open(href);
	});

});

// 定时器启动
Timer.startInterval();