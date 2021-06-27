/*
 * @Author: Ethan Wu
 * @Date: 2021-06-27 17:18:43
 * @LastEditTime: 2021-06-27 17:34:14
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