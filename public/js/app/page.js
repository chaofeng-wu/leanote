/*
 * @Author: Ethan Wu
 * @Date: 2021-06-28 13:13:05
 * @LastEditTime: 2021-06-28 18:15:18
 * @FilePath: /leanote/public/js/app/page.js
 */

function sendLog (key, value) {
	if (!key) {
		return;
	}
	if (!value) {
		value = '';
	}
	ajaxGet('/index/log', {key: key, value: value});
}


function initSlimScroll() {
	if(Mobile.isMobile()) {
		return;
	}
	$("#notebook").slimScroll({
	    height: "100%", // $("#leftNotebook").height()+"px"
	});
	$("#noteItemList").slimScroll({
	    height: "100%", // ($("#leftNotebook").height()-42)+"px"
	});
	/*
	$("#wmd-input").slimScroll({
	    height: "100%", // $("#wmd-input").height()+"px"
	});
	$("#wmd-input").css("width", "100%");
	*/
	
	$("#wmd-panel-preview").slimScroll({
	    height: "100%", // $("#wmd-panel-preview").height()+"px"
	});
	
	$("#wmd-panel-preview").css("width", "100%");
}

//-----------------------
// 导航
var random = 1;
function scrollTo(self, tagName, text) {
	var iframe = $("#editorContent"); // .contents();
	var target = iframe.find(tagName + ":contains(" + text + ")");
	random++;
	
	// 找到是第几个
	// 在nav是第几个
	var navs = $('#leanoteNavContent [data-a="' + tagName + '-' + encodeURI(text) + '"]');
//	alert('#leanoteNavContent [data-a="' + tagName + '-' + encodeURI(text) + '"]')
	var len = navs.size();
	for(var i = 0; i < len; ++i) {
		if(navs[i] == self) {
			break;
		}
	}
	
	if (target.size() >= i+1) {
		target = target.eq(i);
		// 之前插入, 防止多行定位不准
		// log(target.scrollTop());
		var top = iframe.scrollTop() - iframe.offset().top + target.offset().top; // 相对于iframe的位置
		// var nowTop = iframe.scrollTop();
		// log(nowTop);
		// log(top);
		// iframe.scrollTop(top);
		iframe.animate({scrollTop: top}, 300); // 有问题
		
		/*
		var d = 200; // 时间间隔
		for(var i = 0; i < d; i++) {
			setTimeout(
			(function(top) {
				return function() {
					iframe.scrollTop(top);
				}
			})(nowTop + 1.0*i*(top-nowTop)/d), i);
		}
		// 最后必然执行
		setTimeout(function() {
			iframe.scrollTop(top);
		}, d+5);
		*/
		return;
	}
}
