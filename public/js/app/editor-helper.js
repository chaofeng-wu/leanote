/*
 * @Author: Ethan Wu
 * @Date: 2021-06-27 17:47:48
 * @LastEditTime: 2021-07-01 14:29:58
 * @FilePath: /leanote/public/js/app/editor-helper.js
 */
Editor = {};

// 有tinymce得到的content有<html>包围
// 总会出现<p>&nbsp;<br></p>, 原因, setContent('<p><br data-mce-bogus="1" /></p>') 会设置成 <p> <br></p>
// 所以, 要在getContent时, 当是<p><br data-mce-bogus="1"></p>, 返回 <p><br/></p>
Editor.getEditorContent = function(isMarkdown) {
	var content;
	if (!isMarkdown) {
		content = FullTextEditor.getEditorContent();
	}else {
		content = MarkdownEditor.getEditorContent();
	}
	return content;
}

//切换编辑器
Editor.switchEditor = function(isMarkdown) {
	//清理一下Markdown Editor里面的内容
	MarkdownEditor.setEditorContent("");
	
	LEA.isM = isMarkdown;
	// 富文本永远是2
	if(!isMarkdown) {
		$("#editor").show();
		MarkdownEditor.hide();
		
		// 刚开始没有
		$("#leanoteNav").show();
	} else {
		MarkdownEditor.show();
		
		$("#leanoteNav").hide();
	}
}

// editor 设置内容
// 可能是tinymce还没有渲染成功
Editor.setEditorContent = function(content, isMarkdown, preview, callback) {
	if(!content) {
		content = "";
	}
	if(clearIntervalForSetContent) {
		clearInterval(clearIntervalForSetContent);
	}
	if(!isMarkdown) {
		FullTextEditor.setEditorContent(content,callback);
	} else {
		MarkdownEditor.setEditorContent(content,callback);
	}
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
		NotebookId: curNote.NotebookId,
		Content: curNote.Content
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
	var content = this.getEditorContent(curNote.IsMarkdown);

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
		var c = content;
		
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
	var content = this.getEditorContent(cacheNote.IsMarkdown);
	return content;
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


Editor.toggleWriteable = function(isFromNewNote) {

	FullTextEditor.toggleWriteable(isFromNewNote);
	MarkdownEditor.toggleWriteable();
	$('#note').removeClass('read-only-editor');

	LEA.readOnly = false;
};


Editor.toggleReadOnly = function(needSave){
	if(LEA.editorMode && LEA.editorMode.isWriting()) { // 写作模式下
		return Editor.toggleWriteable();
	}
	FullTextEditor.toggleReadOnly();
	MarkdownEditor.toggleMdReadOnly();
	$('#note').addClass('read-only-editor');
	// 保存之
	if (needSave) {
		Editor.saveNoteChange();
	}
	
	LEA.readOnly = true;
}

LEA.toggleWriteable = Editor.toggleReadOnly;

Editor.toggleWriteableAndReadOnly = function(){
	if (LEA.readOnly) {
		Editor.toggleWriteable();
	}
	else {
		Editor.toggleReadOnly(true);
	}
}