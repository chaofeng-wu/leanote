/*
 * @Author: Ethan Wu
 * @Date: 2021-06-27 17:18:43
 * @LastEditTime: 2021-07-01 10:51:02
 * @FilePath: /leanote/public/js/app/net.js
 */
//管理网络请求，把所有的请求函数写在这个文件中方便管理

Net = {};

Net._ajax = function(type, url, param, successFunc, failureFunc, async) {
	// log("-------------------ajax:");
	// log(url);
	// log(param);
	if(typeof async == "undefined") {
		async = true;
	} else {
		async = false;
	}
	return $.ajax({
		type: type,
		url: url,
		data: param,
		async: async, // 是否异步
		success: function(ret) {
			Net._ajaxCallback(ret, successFunc, failureFunc);
		},
		error: function(ret) {
			Net._ajaxCallback(ret, successFunc, failureFunc);
		}
	});
}

// ajax请求返回结果后的操作
// 用于ajaxGet(), ajaxPost()
Net._ajaxCallback = function(ret, successFunc, failureFunc) {
	// 总会执行
	if(ret === true || ret == "true" || typeof ret == "object") {
		// 是否是NOTELOGIN
		if(ret && typeof ret == "object") {
			if(ret.Msg == "NOTLOGIN") {
				alert(getMsg("Please sign in firstly!"));
				return;
			}
		}
		if(typeof successFunc == "function") {
			successFunc(ret);
		}
	} else {
		if(typeof failureFunc == "function") {
			failureFunc(ret);
		} else {
			alert("error!")
		}
	}
}

/**
 * 发送post请求
 * @param url
 * @param param
 * @param successFunc
 * @param failureFunc
 * @param hasProgress
 * @param async 是否异步, 默认为true
 * @returns
 */
Net.ajaxPost = function(url, param, successFunc, failureFunc, async) {
	Net._ajax("POST", url, param, successFunc, failureFunc, async);
}

/**
 * 发送ajax get请求
 * @param url
 * @param param
 * @param successFunc
 * @param failureFunc
 * @param hasProgress
 * @param async 是否异步
 * @returns
 */
Net.ajaxGet = function(url, param, successFunc, failureFunc, async) {
	return Net._ajax("GET", url, param, successFunc, failureFunc, async);
}

/*
ajaxPostJson(
	"http://localhost:9000/notebook/index?i=100&name=life", 
	{Title: "you can",  UserId:"52a9e409f4ea49d6576fdbca", Subs:[{title: "xxxxx", Seq:11}, {title:"life..."}]}, 
	function(e) {
		log(e);
	});
*/
Net.ajaxPostJson = function(url, param, successFunc, failureFunc, async) {
	// log("-------------------ajaxPostJson:");
	// log(url);
	// log(param);
	
	// 默认是异步的
	if(typeof async == "undefined") {
		async = true;
	} else {
		async = false;
	}
	$.ajax({
	    url : url,
	    type : "POST",
	    contentType: "application/json; charset=utf-8",
	    datatype: "json",
	    async: async,
	    data : JSON.stringify(param),
	    success : function(ret, stats) {
			Net._ajaxCallback(ret, successFunc, failureFunc);
	    },
		error: function(ret) {
			Net._ajaxCallback(ret, successFunc, failureFunc);
		}
	});
}

//-------------------
// for leanote ajax

// post
// return {Ok, Msg, Data}
// btnId 是按钮包括#
Net.post = function(url, param, func, btnId) {
	var btnPreText;
	if(btnId) {
		$(btnId).button("loading"); // html("正在处理").addClass("disabled");
	}
	Net.ajaxPost(url, param, function(ret) {
		if(btnId) {
			$(btnId).button("reset");
		}
		if (typeof ret == "object") {
			if(typeof func == "function") {
				func(ret);
			}
		} else {
			alert("leanote出现了错误!");
		}
	});
}

//------------
// pjax
//------------
Net.Pjax = {
	init: function() {
		var me = this;
		// 当history改变时
		window.addEventListener('popstate', function(evt){
			var state = evt.state;
			if(!state) {
				return;
			}
			document.title = state.title || "Untitled";
			log("pop");
			me.changeNotebookAndNote(state.noteId);
		}, false);
		
		// ie9
		if(!history.pushState) {
			$(window).on("hashchange", function() {
				var noteId = getHash("noteId");;
				if(noteId) {
					me.changeNotebookAndNote(noteId);
				}
			});
		}
	},
	// pjax调用
	// popstate事件发生时, 转换到noteId下, 此时要转换notebookId
	changeNotebookAndNote: function(noteId) {
		var note = SharedData.getNote(noteId);
		if(!note) {
			return;
		}
		
		var notebookId = note.NotebookId;
		// 如果是在当前notebook下, 就不要转换notebook了
		if(Notebook.curNotebookId == notebookId) {
			// 不push state
			Note.changeNoteForPjax(noteId, false);
			return;
		}
		
		// 先切换到notebook下, 得到notes列表, 再changeNote
		Notebook.changeNotebook(notebookId, function(notes) {
			NoteList.renderNotes(notes);
			// 不push state
			Note.changeNoteForPjax(noteId, false, true);
		});
	},
		
	// ajax后调用
	changeNote: function(noteInfo) {
		var me = this;
		var noteId = noteInfo.NoteId;
		var title = noteInfo.Title;
		var url = '/note/' + noteId;
		if (location.href.indexOf('?online') > 0) {
			url += '?online=' + /online=([0-9])/.exec(location.href)[1];
		}
		if(location.hash) {
			url += location.hash;
		}
		// 如果支持pushState
		if(history.pushState) {
			var state=({
				url: url,
				noteId: noteId,
				title: title,
			});
			history.pushState(state, title, url);
			document.title = title || 'Untitled';
		// 不支持, 则用hash
		} else {
			setHash("noteId", noteId);
		}
	}
};
$(function() {
	Net.Pjax.init();
});