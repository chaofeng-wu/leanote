// CacheNote用来本地缓存所有的Note数据，并负责与Web数据库进行同步
SharedData = {};

SharedData.curNoteId = ""; //当前打开的note
SharedData.allNotesList = {}; //缓存所有的note

SharedData.cacheNoteBooks = {}; //缓存已有笔记的notebooks
SharedData.sortType = ["CreatedTime", "UpdatedTime", "Title"];
SharedData.curSortSelect = {
	sortType: "UpdatedTime",
	isAsc: false,
}
/*
Abstract: ""
AttachNum: 0
CommentNum: 0
Content: "<p>fsdadfdsg</p><p>sadgdsa</p><p>fdsafds</p><p>asgdfds</p>"
CreatedTime: "2021-06-12T14:53:21.085+08:00"
CreatedUserId: ""
Desc: "fsdadfdsg sadgdsa fdsafds asgdfds"
HasSelfDefined: false
ImgSrc: ""
IsBlog: false
IsDeleted: false
IsMarkdown: false
IsRecommend: false
IsTop: false
IsTrash: false
LikeNum: 0
NoteId: "60c459cdf6851c01c22dff79"
NotebookId: "540817e099c37b583c000002"
PublicTime: "2021-06-13T16:15:11.747+08:00"
ReadNum: 0
RecommendTime: "0001-01-01T00:00:00Z"
Src: ""
Tags: [""]
Title: "fewqtew"
UpdatedTime: "2021-06-13T21:56:12+08:00"
UpdatedUserId: "540817e099c37b583c000001"
UrlTitle: "1b92ba2ee188"
UserId: "540817e099c37b583c000001"
Usn: 200460
*/

SharedData.initAllNotesList = function(notes){
	for(var i = 0;i<notes.length; ++i){
		var note = notes[i];
		SharedData.allNotesList[note.NoteId] = note;
	}
	SharedData.initcacheNoteBooks();
	SharedData.updateCurSortType();
}

SharedData.updateCurSortType = function () {
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
    SharedData.curSortSelect.sortType = sortBy;
	SharedData.curSortSelect.isAsc = isAsc;
};

//对NoteBook中的note进行初始化
SharedData.initcacheNoteBooks = function(){

	var notes = Object.values(SharedData.allNotesList);

	for (var i = 0; i < SharedData.sortType.length; i++) {
		var sortType = SharedData.sortType[i];
		SharedData.sortNotesByType(notes,sortType);

		if (!SharedData.cacheNoteBooks[sortType]) {
			SharedData.cacheNoteBooks[sortType] = [];
		}
		
		//对note进行分类
		for (var j = 0; j < notes.length; j++) {
			var noteId = notes[j].NoteId;
			SharedData.cacheNoteBooks[sortType].push(noteId);
		}
	}
}


//获取已排序的notebook中的noteId
SharedData.getNotesByNotebookId = function(notebookId) {
	if(!notebookId) {
		notebookId = "all";
	}

	var sortType = SharedData.curSortSelect.sortType;
	var isAsc = SharedData.curSortSelect.isAsc;

	var notes = [];
	var sortedAllNotes = SharedData.cacheNoteBooks[sortType];

	for (var i = 0;i < sortedAllNotes.length; i++){
		var noteId = sortedAllNotes[i];
		if (notebookId === SharedData.allNotesList[noteId].NotebookId) {
			notes.push(SharedData.allNotesList[noteId]);
		}
	}

	if(isAsc){
		return notes;
	}else{
		return notes.reverse();
	}
}

SharedData.insertNoteTocacheNoteBooks = function(note){
	if (!note) {
		return;
	}
	
	for (var i = 0; i < SharedData.sortType.length; i++) {
		var sortType = SharedData.sortType[i];
		var insertPosition = SharedData.getInsertPositionByType(SharedData.cacheNoteBooks[sortType],sortType,note);
		SharedData.cacheNoteBooks[sortType].splice(insertPosition,0,note.NoteId);
	}
}

//从cacheNoteBooks中删除指定note
SharedData.deleteNoteIdInCacheNoteBooks = function(noteId){
	if (!noteId) {
		return;
	}

	for (var i = 0; i < SharedData.sortType.length; i++) {
		var sortType = SharedData.sortType[i];
		var index = SharedData.cacheNoteBooks[sortType].indexOf(noteId);
		noteIdList.splice(index,1);
	}
}

//按某种类型对notes进行排序
SharedData.sortNotesByType = function(notes, type){
	if (!notes || !type) {
		return;
	}


	// 排序之
	notes.sort(function(a, b) {
	    var t1 = a[type];
	    var t2 = b[type];
		
		if (t1 < t2) {
			return -1;
		} else if (t1 > t2) {
			return 1;
		}
	    return 0;
	});
}

//按排序类型获取插入位置
SharedData.getInsertPositionByType = function(notes, type, note){
	var allPosition = 0;
	var notebookPosition = 0;
	for (var i = 0; i < notes.length; i++) {
		var noteId = notes[i];
		if (SharedData.allNotesList[noteId][type]>note[type]) {
			break;
		}else{
			allPosition += 1;	
		}
	}
	return allPosition;
}

//添加新的note
SharedData.addNewNote = function(note){
	if (SharedData.allNotesList.hasOwnProperty(note.NoteId)) {
		return;
	}
	SharedData.allNotesList[note.NoteId] = note;
	SharedData.insertNoteTocacheNoteBooks(note);
}

//设置当前正在操作的noteId
SharedData.setCurrentNoteId = function(noteId){
	SharedData.curNoteId = noteId;
}

//清空note信息
SharedData.clearCurNoteId = function () {
	SharedData.curNoteId = null;
};

// 得到当前的笔记
SharedData.getCurNote = function() {
	if(SharedData.curNoteId == "") {
		return null;
	}
	return SharedData.allNotesList[SharedData.curNoteId];
};

//获取指定note
SharedData.getNote = function(noteId) {
	return SharedData.allNotesList[noteId];
};

//删除指定note
SharedData.deleteNote = function(noteId) {
	delete SharedData.allNotesList[noteId];
	
	SharedData.deleteNoteIdInCacheNoteBooks(noteId);
}

//改变note的某些属性值
SharedData.setNoteContent = function(content) {
	if(!SharedData.allNotesList[content.NoteId]) {
		SharedData.addNewNote(content);
   } else {
	   // console.log('pre');
	   // console.log(Note.cache[content.NoteId].IsBlog);
	   $.extend(SharedData.allNotesList[content.NoteId], content);
	   // console.log(Note.cache[content.NoteId].IsBlog);
   }
}

// notebook是否有notes
// called by Notebook
SharedData.notebookHasNotes = function(notebookId) {
	var notes = SharedData.getNotesByNotebookId(notebookId);
	return !isEmpty(notes);
};

//从cacheNoteBooks中的noteId转换为notes
SharedData.getNotesByCacheNoteIds = function(noteIds){
	var notes = [];
	for(var i=0;i<noteIds.length;i++){
		var id = noteIds[i];
		notes.push(SharedData.allNotesList[id]);
	}
	return notes;
}

//将更改保存到服务器
SharedData.saveNoteChangeToServer = function(params, callback){
	showMsg(getMsg("saving"));
/*
params的结构：
params{
	IsNew: true/false,
	IsMarkdown:
	FromUserId: 
	NoteId: 
	NotebookId: 

	Title: 
	Src: 
	Tags: 
	Desc:
	ImgSrc:
	IsBlog:
	Content:
	Abstract:
}
*/

	ajaxPost("/note/updateNoteOrContent", params, function(ret) {
		if(params.IsNew) {
			// 新建笔记也要change history
			Pjax.changeNote(ret);
		}
		callback && callback();
	});
}