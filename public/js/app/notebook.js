// <li role="presentation"><a role="menuitem" tabindex="-1" href="#">CSS</a></li>	
Notebook.notebookNavForListNote = ""; // html 为了note list上面和新建时的ul
Notebook.notebookNavForNewNote = ""; // html 为了note list上面和新建时的ul

// 笔记本的笔记数量更新
Notebook._updateNotebookNumberNotes = function(notebookId, n) {
	var self = this;
	var notebook = Cache.getNotebookById(notebookId);
	if(!notebook) {
		return;
	}
	notebook.NumberNotes += n;
	if(notebook.NumberNotes < 0) {
		notebook.NumberNotes = 0;
	}
	$("#numberNotes_" + notebookId).html(notebook.NumberNotes);
};
// addNote, copyNote, moveNote
Notebook.incrNotebookNumberNotes = function(notebookId) {
	var self = this;
	self._updateNotebookNumberNotes(notebookId, 1);
};
// moteNote, deleteNote
Notebook.minusNotebookNumberNotes = function(notebookId) {
	var self = this;
	self._updateNotebookNumberNotes(notebookId, -1);
};

/**
 * 我的notebooks
<ul class="folderBody" id="notebookList">
	<li><a class="active">所有</a></li>
	<li><a class="active">Hadoop</a></li>
	<li><a>August 13, 2013</a></li>
</ul>
 */
 
Notebook.getTreeSetting = function(isSearch){ 
	var noSearch = !isSearch;
	
	var self = this;
	// 添加自定义dom
	function addDiyDom(treeId, treeNode) {
		var spaceWidth = 5;
		var switchObj = $("#" + treeId + " #" + treeNode.tId + "_switch"),
		icoObj = $("#" + treeId + " #" + treeNode.tId + "_ico");
		switchObj.remove();
		icoObj.before(switchObj);
	
		if(!Cache.isLatestNotebookId(treeNode.NotebookId) && !Cache.isTrashNotebookId(treeNode.NotebookId)) {
			icoObj.after($('<span class="notebook-number-notes" id="numberNotes_' + treeNode.NotebookId + '">' + (treeNode.NumberNotes || 0) + '</span>'));
			icoObj.after($('<span class="fa notebook-setting" title="setting"></span>'));
		}
		if (treeNode.level > 1) {
			var spaceStr = "<span style='display: inline-block;width:" + (spaceWidth * treeNode.level)+ "px'></span>";
			switchObj.before(spaceStr);
		}
	}
	// 拖拽
	function beforeDrag(treeId, treeNodes) {
		for (var i=0,l=treeNodes.length; i<l; i++) {
			if (treeNodes[i].drag === false) {
				return false;
			}
		}
		return true;
	}
	function beforeDrop(treeId, treeNodes, targetNode, moveType) {
		return targetNode ? targetNode.drop !== false : true;
	}
	function onDrop(e, treeId, treeNodes, targetNode, moveType) {
		var treeNode = treeNodes[0];
		// 搜索不能drag
		if(!targetNode) {
			return;
		}
		var parentNode;
		var treeObj = self.tree;
		var ajaxData = {curNotebookId: treeNode.NotebookId};
		
		// 成为子节点, 那么只需要得到targetNode下所有的子结点即可
		if(moveType == "inner") {
			parentNode = targetNode;
		} else {
			parentNode = targetNode.getParentNode();
		}
		
		// 在targetNode之前或之后, 
		// 那么: 1) 需要将该parentNode下所有的node重新排序即可; 2) treeNodes[0]为parentNode的子
		if(!parentNode) {
			var nodes = treeObj.getNodes(); // 得到所有nodes
		} else {
			ajaxData.parentNotebookId = parentNode.NotebookId;
			var nextLevel = parentNode.level+1;
			function filter(node) {
				return node.level == nextLevel;
			}
			var nodes = treeObj.getNodesByFilter(filter, false, parentNode);
		}
		
		ajaxData.siblings = [];
		for(var i in nodes) {
			var notebookId = nodes[i].NotebookId;
			if(!Cache.isLatestNotebookId(notebookId) && !Cache.isTrashNotebookId(notebookId)) {
				ajaxData.siblings.push(notebookId);
			}
		}
		
		ajaxPost("/notebook/dragNotebooks", {data: JSON.stringify(ajaxData)});
		
		// 这里慢!
		setTimeout(function() {
			Notebook.changeNav();
		}, 100);
	}

	var onClick =  function(e, treeId, treeNode) {
		var notebookId = treeNode.NotebookId;
		Notebook.changeNotebook(notebookId);
	};
	var onDblClick = function(e) {
		var notebookId = $(e.target).attr("notebookId");
		if(!Cache.isLatestNotebookId(notebookId) && !Cache.isTrashNotebookId(notebookId)) {
			self.updateNotebookTitle(e.target);
		}
	}
	
	var setting = {
		view: {
			showLine: false,
			showIcon: false,
			selectedMulti: false,
			dblClickExpand: false,
			addDiyDom: addDiyDom
		},
		data: {
			key: {
				name: "Title",
				children: "Subs",
			}
		},
		edit: {
			enable: true,
			showRemoveBtn: false,
			showRenameBtn: false,
			drag: {
				isMove: noSearch,
				prev: noSearch,
				inner: noSearch,
				next: noSearch
			}
		},
		callback: {
			beforeDrag: beforeDrag,
			beforeDrop: beforeDrop,
			onDrop: onDrop,
			onClick: onClick,
			onDblClick: onDblClick,
			beforeRename: function(treeId, treeNode, newName, isCancel) {
				if(newName == "") {
					if(treeNode.IsNew) {
						// 删除之
						self.tree.removeNode(treeNode);
						return true;
					}
					return false;
				}
				if(treeNode.Title == newName) {
					return true;
				}
				
				// 如果是新添加的
				if(treeNode.IsNew) {
					var parentNode = treeNode.getParentNode();
					var parentNotebookId = parentNode ? parentNode.NotebookId : "";
					
					self.doAddNotebook(treeNode.NotebookId, newName, parentNotebookId);
				} else {
					self.doUpdateNotebookTitle(treeNode.NotebookId, newName);
				}
				return true;
			}
		}
	};
	
	// 搜索不能拖拽
	if(isSearch) {
	}
	
	return setting;
}

Notebook.renderNotebooks = function(notebooks) {
	var self = this;

	if(!notebooks || typeof notebooks != "object" || notebooks.length < 0) {
		notebooks = [];
	}
	
	// title可能有<script>
	for(var i = 0, len = notebooks.length; i < len; ++i) {
		var notebook = notebooks[i];
		notebook.Title = trimTitle(notebook.Title);
	}
	
	notebooks = [{NotebookId: Cache.latestNotesNotebookId, Title: getMsg("all"), drop:false, drag: false}].concat(notebooks);
	notebooks.push({NotebookId: Cache.trashNotebookId, Title: getMsg("trash"), drop:false, drag: false});
	Cache.notebooksList = notebooks; // 缓存之
	
	self.tree = $.fn.zTree.init($("#notebookList"), self.getTreeSetting(), notebooks);
	
	// 展开/折叠图标
	var $notebookList = $("#notebookList");
	$notebookList.hover(function () {
		if(!$(this).hasClass("showIcon")) {
			$(this).addClass("showIcon");
		}
	}, function() {
		$(this).removeClass("showIcon");
	});
			
	// 缓存所有notebooks信息
	if(!isEmpty(notebooks)) {
		Cache.curNotebookId = notebooks[0].NotebookId;
		Cache.addNotebooksToNotebooksDict(notebooks);
	}
	
	// 渲染nav
	Notebook.renderNav();
	
	// 渲染第一个notebook作为当前
	Notebook.changeNotebookNavForNewNote(notebooks[0].NotebookId);
}

// 展开到笔记本
Notebook.expandNotebookTo = function(notebookId) {
	var me = this;
	var selected = false;
	var tree = me.tree;

	if(!tree) {
		return;
	}
	var curNode = tree.getNodeByTId(notebookId);
	if(!curNode) {
		return;
	}
	while(true) {
		var pNode = curNode.getParentNode();
		if(pNode) {
			tree.expandNode(pNode, true);
			if(!selected) {
				Notebook.changeNotebookNav(notebookId);
				selected = true;
			}
			curNode = pNode;
		} else {
			if(!selected) {
				Notebook.changeNotebookNav(notebookId);
			}
			break;
		}
	}
};

// RenderNotebooks调用, 
// nav 为了新建, 快速选择, 移动笔记
// 这些在添加,修改,删除notebooks都要变动!!!
Notebook.renderNav = function(nav) {
	var self = this;
	self.changeNav();
};

// 搜索notebook
Notebook.searchNotebookForAddNote = function(key) {
	var self = this;
	if(key) {
		var notebooks = self.tree.getNodesByParamFuzzy("Title", key);
		notebooks = notebooks || [];
		// 过滤下, 把new, trash过滤掉
		var notebooks2 = [];
		for(var i in notebooks) {
			var notebookId = notebooks[i].NotebookId;
			if(!Cache.isLatestNotebookId(notebookId) && !Cache.isTrashNotebookId(notebookId)) {
				notebooks2.push(notebooks[i]);
			}
		}
	}
};

// 搜索notebook
Notebook.searchNotebookForList = function(key) {
	var self = this;
	var $search = $("#notebookListForSearch");
	var $notebookList = $("#notebookList");
	if(key) {
		$search.show();
		$notebookList.hide();
		
		var notebooks = self.tree.getNodesByParamFuzzy("Title", key);
		log('search');
		log(notebooks);
		if(isEmpty(notebooks)) {
			$search.html("");
		} else {
			var setting = self.getTreeSetting(true);
			self.tree2 = $.fn.zTree.init($search, setting, notebooks);
		}
	} else {
		self.tree2 = null;
		$search.hide();
		$notebookList.show();
	}
};

Notebook.changeNav = function() {
	// 移动, 复制重新来, 因为nav变了, 移动至-----的notebook导航也变了
	NoteList.initContextmenu();
};

// 左侧导航, 选中某个notebook
Notebook.selectNotebook = function(target) {
	$(".notebook-item").removeClass("curSelectedNode");
	$(target).addClass("curSelectedNode");
};

// 新建笔记导航
Notebook.changeNotebookNavForNewNote = function(notebookId, title) {
	// 没有notebookId, 则选择第1个notebook
	// 第一个是全部笔记
	if(!notebookId || !title) {
		var notebook = Cache.notebooksList[0];
		notebookId = notebook.NotebookId;
		title = notebook.Title;
	}

	if(!Cache.isLatestNotebookId(notebookId) && !Cache.isTrashNotebookId(notebookId)) {
		$("#curNotebookForNewNote").html(title).attr("notebookId", notebookId);
	} else if(!$("#curNotebookForNewNote").attr("notebookId")) {
		// 但又没有一个笔记, 默认选第一个吧
		// 这里很可能会死循环, 万一用户没有其它笔记呢?
		// 服务端肯定要在新建一个用户时给他创建一个默认笔记本的
		if(Cache.notebooksList.length > 2) {
			var notebook = Cache.notebooksList[1];
			notebookId = notebook.NotebookId;
			title = notebook.Title;
			Notebook.changeNotebookNavForNewNote(notebookId, title);
		}
	}
};

// 改变导航, 两处
// 单击左侧, 单击新建下拉时调用
// 1 选中左侧导航, 
// 2 notelist上面 >
// 3 新建笔记 - js >
// 转成我的nav <-> 共享
Notebook.toggleToMyNav = function(userId, notebookId) {
	$("#myNotebookNavForListNav").show();
	
	$("#newMyNote").show();
	
	// 搜索tag隐藏
	$("#tagSearch").hide();
};
Notebook.changeNotebookNav = function(notebookId) {
	Notebook.curNotebookId = notebookId;
	Notebook.toggleToMyNav();
	
	// 1 改变当前的notebook
	Notebook.selectNotebook($(tt('#notebook [notebookId="?"]', notebookId)));
	
	var notebook = Cache.notebooksDict[notebookId];
	
	if(!notebook) {
		return;
	}
	
	// 2
	$("#curNotebookForListNote").html(notebook.Title);
	
	// 3
	Notebook.changeNotebookNavForNewNote(notebookId, notebook.Title);
}

// 当前选中的笔记本是否是"所有"
// called by Note
Notebook.curActiveNotebookIsAll = function() {
	return Cache.isLatestNotebookId($("#notebookList .curSelectedNode").attr("notebookId"));
};
Notebook.curActiveNotebookIsTrash = function() {
	return Cache.isTrashNotebookId($("#notebookList .curSelectedNode").attr("notebookId"));
};

// 改变笔记本
// 0. 改变样式
// 1. 改变note, 此时需要先保存
// 2. ajax得到该notebook下的所有note
// 3. 使用Note.RederNotes()
// callback Pjax, 当popstate时调用
Notebook.changeNotebookSeq = 1;
Notebook.changeNotebook = function(notebookId, callback) {
	var me = this;
	Notebook.changeNotebookNav(notebookId);
	
	Notebook.curNotebookId = notebookId;
		
	// 1
	Note.curChangedSaveIt();
	
	// 2 先清空所有
	Note.clearAll();
	
	var url = "/note/listNotes/";
	var param = {notebookId: notebookId};
	
	// 废纸篓
	if(Cache.isTrashNotebookId(notebookId)) {
		url = "/note/listTrashNotes";
		param = {};
	} else if(Cache.isLatestNotebookId(notebookId)) {
		param = {};
		// 得到全部的...
		cacheNotes = Cache.getNotesByNotebookId();
		// 数量一致
		if(!isEmpty(cacheNotes)) { 
			if(callback) {
				callback(cacheNotes);
			} else {
				NoteList.renderNotesAndFirstOneContent(cacheNotes, true);
			}
			return;
		} 
	} else {
		cacheNotes = Cache.getNotesByNotebookId(notebookId);
		var notebook = Cache.notebooksDict[notebookId];
		var len = cacheNotes ? cacheNotes.length : 0;
		// alert( notebook.NumberNotes + " " + len);
		if(len == notebook.NumberNotes) { 
			if(callback) {
				callback(cacheNotes);
			} else {
				NoteList.renderNotesAndFirstOneContent(cacheNotes, true);
			}
			return;
		} else {
			// Note.clearCacheByNotebookId(notebookId);
			log('数量不一致');
		}
	}
	
	// 2 得到笔记本
	// 这里可以缓存起来, note按notebookId缓存
	// 这里可能点击过快导致前面点击的后来才返回
	me.showNoteAndEditorLoading();
	me.changeNotebookSeq++;
	(function(seq) {
		ajaxGet(url, param, function(cacheNotes) { 
			// 后面点击过快, 之前的结果不要了
			if(seq != me.changeNotebookSeq) {
				log("notebook changed too fast!");
				log(cacheNotes);
				return;
			}
			if(callback) {
				callback(cacheNotes);
			} else {

				NoteList.renderNotesAndFirstOneContent(cacheNotes, false);
			}
			me.hideNoteAndEditorLoading();
		});
	})(me.changeNotebookSeq);
}

// 笔记列表与编辑器的mask loading
Notebook.showNoteAndEditorLoading = function() {
	$("#noteAndEditorMask").show();
};
Notebook.hideNoteAndEditorLoading = function() {
	$("#noteAndEditorMask").hide();
};

// 是否是当前选中的notebookId
// 还包括共享
// called by Note
Notebook.isCurNotebook = function(notebookId) {
	return $(tt('#notebookList [notebookId="?"]', notebookId)).attr("class") == "active";
}

// 改变nav, 为了新建note
// called by Note
Notebook.changeNotebookForNewNote = function(notebookId) {
	// 废纸篓
	if(Cache.isTrashNotebookId(notebookId) || Cache.isLatestNotebookId(notebookId)) {
		return;
	}
	
	Notebook.changeNotebookNav(notebookId, true);
	Notebook.curNotebookId = notebookId;
	
	var url = "/note/listNotes/";
	var param = {notebookId: notebookId};
		
	// 2 得到笔记本
	// 这里可以缓存起来, note按notebookId缓存
	ajaxGet(url, param, function(ret) {
		// note 导航
		NoteList.renderNotes(ret, true);
	});
};


//-----------------------------
// 设为blog/unset
Notebook.setNotebook2Blog = function(target) {
	var notebookId = $(target).attr("notebookId");
	var notebook = Cache.notebooksDict[notebookId];
	var isBlog = true;
	if(notebook.IsBlog != undefined) {
		isBlog = !notebook.IsBlog;
	}
	
	// 那么, 如果当前是该notebook下, 重新渲染之
	if(Notebook.curNotebookId == notebookId) {
		if(isBlog) {
			$('.item').addClass('item-b');
		} else {
			$('.item').removeClass('item-b');
		}
	// 如果当前在所有笔记本下
	} else if(Notebook.curNotebookId == Notebook.allNotebookId){
		$("#noteItemList .item").each(function(){
			var noteId = $(this).attr("noteId");
			var note = Cache.getNote(noteId);
			if(note.NotebookId == notebookId) {
				if (isBlog) {
					$(this).addClass('item-b');
				}
				else {
					$(this).removeClass('item-b');
				}
			}
		});
	}
	ajaxPost("/notebook/setNotebook2Blog", {notebookId: notebookId, isBlog: isBlog}, function(ret) {
		if(ret) {
			// 这里要设置notebook下的note的blog状态
			Note.setAllNoteBlogStatus(notebookId, isBlog);
			Cache.setNotebook({NotebookId: notebookId, IsBlog: isBlog});
		}
	});
}

// 添加, 修改完后都要对notebook的列表重新计算 TODO

// 修改笔记本标题
Notebook.updateNotebookTitle = function(target) {
	var self = Notebook;
	var notebookId = $(target).attr("notebookId");
	
	if(self.tree2) {
		self.tree2.editName(self.tree2.getNodeByTId(notebookId));
	} else {
		self.tree.editName(self.tree.getNodeByTId(notebookId));
	}
}
Notebook.doUpdateNotebookTitle = function(notebookId, newTitle) {
	var self = Notebook;
	ajaxPost("/notebook/updateNotebookTitle", {notebookId: notebookId, title: newTitle}, function(ret) {
		// 修改缓存
		Cache.notebooksDict[notebookId].Title = newTitle;
		// 改变nav
		Notebook.changeNav();
		
		// 同步
		if(self.tree2) {
			var notebook = self.tree.getNodeByTId(notebookId);
			notebook.Title = newTitle;
			self.tree.updateNode(notebook);
		}
	});
}

//-----------
// 添加笔记本
// 1 确保是展开的
// 2 在所有后面添加<li></li>
Notebook.addNotebookSeq = 1; // inputId
Notebook.addNotebook = function() {
	var self = Notebook;
	if($("#myNotebooks").hasClass("closed")) {
		$("#myNotebooks .folderHeader").trigger("click");
	}
	
	// 添加并修改
	self.tree.addNodes(null, {Title: "", NotebookId: getObjectId(), IsNew: true}, true, true);
}

// rename 调用
Notebook.doAddNotebook = function(notebookId, title, parentNotebookId) {
	var self = Notebook;
	ajaxPost("/notebook/addNotebook", {notebookId: notebookId, title: title, parentNotebookId: parentNotebookId}, function(ret) {
		if(ret.NotebookId) {
			Cache.notebooksDict[ret.NotebookId] = ret;
			var notebook = self.tree.getNodeByTId(notebookId);
			$.extend(notebook, ret);
			notebook.IsNew = false;
			
			// 选中之
			Notebook.changeNotebook(notebookId);
			
			// 改变nav
			Notebook.changeNav();
		}
	});
}

//-------------
// 添加子笔记本
Notebook.addChildNotebook = function(target) {
	var self = Notebook;
	if($("#myNotebooks").hasClass("closed")) {
		$("#myNotebooks .folderHeader").trigger("click");
	}
	
	var notebookId = $(target).attr("notebookId");
	
	// 添加并修改
	self.tree.addNodes(self.tree.getNodeByTId(notebookId), {Title: "", NotebookId: getObjectId(), IsNew: true}, false, true);
}

//-------------
// 删除
Notebook.deleteNotebook = function(target) {
	var self = Notebook;
	
	var notebookId = $(target).attr("notebookId");
	if(!notebookId) {
		return;
	}
	
	ajaxGet("/notebook/deleteNotebook", {notebookId: notebookId}, function(ret) {
		if(ret.Ok) {
			/*
			$(target).parent().remove();
			*/
			self.tree.removeNode(self.tree.getNodeByTId(notebookId));
			if(self.tree2) {
				self.tree2.removeNode(self.tree2.getNodeByTId(notebookId));
			}
			delete Cache.notebooksDict[notebookId];
			
			// 改变nav
			Notebook.changeNav();
		} else {
			alert(ret.Msg);
		}
	});
}

$(function() {
	//-------------------
	// 点击notebook
	/*
	$("#myNotebooks").on("click", "ul.folderBody li a", function() {
		var notebookId = $(this).attr("notebookId");
		Notebook.changeNotebook(notebookId);
	});
	*/
	// min
	$("#minNotebookList").on("click", "li", function() {
		var notebookId = $(this).find("a").attr("notebookId");
		Notebook.changeNotebook(notebookId);
	});
	
	// 修改笔记本标题, blur后修改标题之
	/*
	enterBlur("#notebookList", "input#editNotebookTitle");
	$("#notebookList").on("blur", "input#editNotebookTitle", Notebook.doUpdateNotebookTitle);
	*/
	
	//-------------------
	// 右键菜单
	var notebookListMenu = {
		width: 180, 
		items: [
			{ type: "splitLine" },
			{ text: getMsg("publicAsBlog"), alias: 'set2Blog', faIcon: "fa-bold", action: Notebook.setNotebook2Blog },
			{ text: getMsg("cancelPublic"), alias: 'unset2Blog',faIcon: "fa-undo", action: Notebook.setNotebook2Blog }, // Unset
			{ type: "splitLine" },
			{ text: getMsg("addChildNotebook"), faIcon: "fa-sitemap", action: Notebook.addChildNotebook },
			{ text: getMsg("rename"), faIcon: "fa-pencil", action: Notebook.updateNotebookTitle },
			{ text: getMsg("delete"), icon: "", alias: 'delete', faIcon: "fa-trash-o", action: Notebook.deleteNotebook }
		],
		onShow: applyrule,
    	onContextMenu: beforeContextMenu,
    	parent: "#notebookList ",
    	children: "li a"
	}
	
	// for search
	var notebookListMenu2 = {
		width: 180, 
		items: [
			{ text: getMsg("publicAsBlog"), alias: 'set2Blog', faIcon: "fa-bold", action: Notebook.setNotebook2Blog },
			{ text: getMsg("cancelPublic"), alias: 'unset2Blog',faIcon: "fa-undo", action: Notebook.setNotebook2Blog }, // Unset
			{ type: "splitLine" },
			{ text: getMsg("rename"), icon: "", action: Notebook.updateNotebookTitle },
			{ text: getMsg("delete"), icon: "", alias: 'delete', faIcon: "fa-trash-o", action: Notebook.deleteNotebook }
		],
		onShow: applyrule,
    	onContextMenu: beforeContextMenu,
    	parent: "#notebookListForSearch ",
    	children: "li a"
	}
	
	function applyrule(menu) {
		var notebookId = $(this).attr("notebookId");
		var notebook = Cache.notebooksDict[notebookId];
		if(!notebook) {
			return;
		}
		// disabled的items
		var items = [];
		// 是否已公开为blog
		if(!notebook.IsBlog) {
			items.push("unset2Blog");
		} else {
			items.push("set2Blog");
		}
		// 是否还有笔记
		if(Cache.notebookHasNotes(notebookId)) {
			items.push("delete");
		}
        menu.applyrule({
        	name: "target2",
            disable: true,
            items: items
        });
	}
	// 哪个不能
	function beforeContextMenu() {
		var notebookId = $(this).attr("notebookId");
		return !Cache.isTrashNotebookId(notebookId) && !Cache.isLatestNotebookId(notebookId);
	}
	
	Notebook.contextmenu = $("#notebookList li a").contextmenu(notebookListMenu);
	
	Notebook.contextmenuSearch = $("#notebookListForSearch li a").contextmenu(notebookListMenu2);
	
	// 添加笔记本
	$("#addNotebookPlus").click(function(e) {
		e.stopPropagation();
		Notebook.addNotebook();
	});
	
	// notebook setting
	$("#notebookList").on("click", ".notebook-setting", function(e) {
		e.preventDefault();
		e.stopPropagation();
		var $p = $(this).parent();
		Notebook.contextmenu.showMenu(e, $p);
	});
	$("#notebookListForSearch").on("click", ".notebook-setting", function(e) {
		e.preventDefault();
		e.stopPropagation();
		var $p = $(this).parent();
		Notebook.contextmenuSearch.showMenu(e, $p);
	});
});
