/*
 * @Author: Ethan Wu
 * @Date: 2021-06-26 16:53:10
 * @LastEditTime: 2021-06-27 16:11:52
 * @FilePath: /leanote/public/js/app/cache.js
 */

/*
用来缓存所有的note数据
*/

var Cache = {};

//缓存的数据
Cache.curNoteId = "";
Cache.curNotebookId = "";

Cache.latestNotesNotebookId = "0";
Cache.trashNotebookId = "-1";



/*
采用了两种数据结构存储notebook
数组：保证notebook的顺序
字典：用来真正的存储notebok数据，便于操作
*/
Cache.notebooksList = []; //num ==> notebook
Cache.notebooksDict = {}; //notebookId ==> notebook

/*
{
    noteId1:note1,
    noteId2:note2,
    ...
}
*/
Cache.cachedNotes = {};

//对缓存数据的操作

//------------------------------------------
//对note进行操作
//------------------------------------------
Cache.getCurNoteId = function(){
    return this.curNoteId;
}

Cache.setCurNoteId = function(noteId){
    this.curNoteId = noteId;
}

Cache.clearCurNoteId = function(){
    this.curNoteId = null;
}

Cache.getCurNote = function(){
    return this.cachedNotes[this.curNoteId];
}

// 由content生成desc
// 换行不要替换
Cache.genDescFromContent = function(content) {
	if(!content) {
		return "";
	}
	
	// 留空格
	content = content.replace(/<br \/>/g," ");
	content = content.replace(/<\/p>/g," ");
	content = content.replace(/<\/div>/g," ");

	// 将html tags全部删除
	content = content.replace(/<\/?[^>]+(>|$)/g, "");
	content = $.trim(content);
	// pre下text()会将&lt; => < &gt; => >
	content = content.replace(/</g, "&lt;");
	content = content.replace(/>/g, "&gt;");

	if(content.length < 300) {
		return content;
	}
	return content.substring(0, 300);
}

// 得到摘要
Cache.genAbstractFromContent = function(content, len) {
	if(!content) {
		return "";
	}
	if(len == undefined) {
		len = 1000;
	}
	if(content.length < len) {
		return content;
	}
	var isCode = false;
	var isHTML = false;
	var n = 0;
	var result = "";
	var maxLen = len;
	for(var i = 0; i < content.length; ++i) {
		var temp = content[i]
		if (temp == '<') {
			isCode = true
		} else if (temp == '&') {
			isHTML = true
		} else if (temp == '>' && isCode) {
			n = n - 1
			isCode = false
		} else if (temp == ';' && isHTML) {
			isHTML = false
		}
		if (!isCode && !isHTML) {
			n = n + 1
		}
		result += temp
		if (n >= maxLen) {
			break
		}
	}
	
	var d = document.createElement("div");
    d.innerHTML = result
    return d.innerHTML;
};

//获取图片
Cache.getImgSrcFromContent = function(content) {
	if(!content) {
		return "";
	}
	var imgs = $(content).find("img");
	for(var i in imgs) {
		var src = imgs.eq(i).attr("src");
		if(src) {
			return src;
		}
	}
	return "";
};

Cache.initCachedNote = function(notes){
    for(var i = 0;i<notes.length; ++i){
		var note = notes[i];
		Cache.cachedNotes[note.NoteId] = note;
	}
}

Cache.getCurSortType = function () {
	var sortBy = "UpdatedTime";
    var isAsc = false; // 默认是降序
    var sorterType = localStorage.getItem('sorterType');
    // console.log(sorterType);
    if (sorterType) {
    	switch(sorterType) {
    		case 'dateCreatedASC':
    			sortBy = 'CreatedTime';
    			isAsc = true;
    			break;
    		case 'dateCreatedDESC':
    			sortBy = 'CreatedTime';
    			isAsc = false;
    			break;
    		case 'dateUpdatedASC':
    			sortBy = 'UpdatedTime';
    			isAsc = true;
    			break;
    		case 'dateUpdatedDESC':
    			sortBy = 'UpdatedTime';
    			isAsc = false;
    			break;
    		case 'titleASC':
    			sortBy = 'Title';
    			isAsc = true;
    			break;
    		case 'titleDESC':
    			sortBy = 'Title';
    			isAsc = false;
    			break;
    	}
    }
    return {sortBy: sortBy, isAsc:isAsc};
};

//按某种类型对notes进行排序
Cache.sortNotesByType = function(notes){
	if (!notes) {
		return;
	}

	var sorterAndOrder = Cache.getCurSortType();
    var sortBy = sorterAndOrder.sortBy;
    var isAsc = sorterAndOrder.isAsc;

	// 排序之
    notes.sort(function(a, b) {
        var t1 = a[sortBy];
        var t2 = b[sortBy];

        if (isAsc) {
            if (t1 < t2) {
                return -1;
            } else if (t1 > t2) {
                return 1;
            }
        } else {
            if (t1 < t2) {
                return 1;
            } else if (t1 > t2) {
                return -1;
            }
        }
        return 0;
    });
}

Cache.getNotesByNotebookId = function(notebookId){
    var notes = [];

    for(var key in this.cachedNotes){
        var note = this.cachedNotes[key];
        if (!notebookId) {
            notes.push(note);
        }else if (note.NotebookId === notebookId) {
            notes.push(note);
        }
    }
    Cache.sortNotesByType(notes);
    return notes;
}

Cache.addNewNote = function(note){
    if (this.cachedNotes.hasOwnProperty(note.NoteId)) {
        return;
    }
    this.cachedNotes[note.NoteId] = note;
}

Cache.getNote = function(noteId){
    return this.cachedNotes[noteId];
}

Cache.setNoteContent = function(content){
    if (!this.cachedNotes[content.NoteId]) {
        this.addNewNote(content);
    }else{
        $.extend(this.cachedNotes[content.NoteId], content);
    }
}

Cache.notebookHasNotes = function(notebookId) {
	var notes = Cache.getNotesByNotebookId(notebookId);
	return notes.length > 0;
};

//------------------------------------------
//对notebook进行操作
//------------------------------------------
Cache.getCurNotebookId = function(){
    return this.curNotebookId;
}

Cache.setCurNotebookId = function(notebookId){
    this.curNotebookId = notebookId;
}

/**
 * @description: 获取当前的notebook
 * @param {*}
 * @return {*}
 */
Cache.getCurNotebook = function(){
    return this.notebooksDict[this.curNotebookId];
}

/**
 * @description: 通过notebookId获取notebook
 * @param {*} notebookId 
 * @return {*}
 */
Cache.getNotebookById = function(notebookId){
    return this.notebooksDict[notebookId];
}

Cache.getNotebookTitleById = function(notebookId){
    var notebook = this.getNotebookById(notebookId);
    if (notebook) {
        return notebook.Title;
    }else{
        return "unknow";
    }
}

/**
 * @description: 更新notebook，如果没有的话就新增，有的话就更新数据
 * @param {*}
 * @return {*}
 */
Cache.setNotebook = function(notebook){
    var notebookId = notebook.NotebookId;
	if(!notebookId) {
		return;
	}
	if(!this.notebooksDict[notebookId]) {
		this.notebooksDict[notebookId] = {};
	}
	$.extend(this.notebooksDict[notebookId], notebook);
}

Cache.curNotebookIsTrashOrLatest = function() {
    return this.curNotebookId === this.trashNotebookId || this.curNotebookId === this.latestNotesNotebookId;
}

/**
 * @description: 把list里面的数据导入到dict
 * @param {*} notebooks : num ==> notebook
 * @return {*}
 */
Cache.addNotebooksToNotebooksDict = function(notebooks){
    for(var i in notebooks) {
		var notebook = notebooks[i];
		this.notebooksDict[notebook.NotebookId] = notebook;
		if(notebook.Subs && notebook.Subs.length > 0) {
			this.addNotebooksToNotebooksDict(notebook.Subs);
		}
	}
}

Cache.isLatestNotebookId = function(notebookId){
    return notebookId === this.latestNotesNotebookId;
}

Cache.isTrashNotebookId = function(notebookId){
    return notebookId === this.trashNotebookId;
}
