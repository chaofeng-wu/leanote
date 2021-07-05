/*
 * @Author: Ethan Wu
 * @Date: 2021-06-26 15:00:01
 * @LastEditTime: 2021-07-05 14:51:53
 * @FilePath: /leanote/public/js/app/main.js
 */

/*
用来做页面初始化的，整理一下整个note的逻辑
*/

function hideMask () {
	$("#mainMask").html("");
	$("#mainMask").hide(100);
}

function initActionListeners() {
    // 窗口缩放时
	$(window).resize(function() {
		Mobile.isMobile();
		Editor.resizeEditor();
	});
	

	// 左侧, folder 展开与关闭
	$(".folderHeader").click(function() {
		var body = $(this).next();
		var p = $(this).parent();
		if (!body.is(":hidden")) {
			$(".folderNote").removeClass("opened").addClass("closed");
//					body.hide();
			p.removeClass("opened").addClass("closed");
			$(this).find(".fa-angle-down").removeClass("fa-angle-down").addClass("fa-angle-right");
		} else {
			$(".folderNote").removeClass("opened").addClass("closed");
//					body.show();
			p.removeClass("closed").addClass("opened");
			$(this).find(".fa-angle-right").removeClass("fa-angle-right").addClass("fa-angle-down");
		}
	});
	
	// 导航隐藏与显示
	$(".leanoteNav h1").on("click", function(e) {
		var $leanoteNav = $(this).closest('.leanoteNav');
		if (!$leanoteNav.hasClass("unfolder")) {
			$leanoteNav.addClass("unfolder");
		} else {
			$leanoteNav.removeClass("unfolder");
		}
	});
	
	// 邮箱验证
	$("#wrongEmail").click(function() {
		openSetInfoDialog(1);
	});
	
	$("#setTheme").click(function() {
		showDialog2("#setThemeDialog", {title: "主题设置", postShow: function() {
			if (!UserInfo.Theme) {
				UserInfo.Theme = "default";
			}
			$("#themeForm input[value='" + UserInfo.Theme + "']").attr("checked", true);
		}});
	});
	
	//---------
	// 主题
	$("#themeForm").on("click", "input", function(e) {
		var val = $(this).val();
		var preHref = $("#themeLink").attr("href"); // default.css?id=7
		var arr = preHref.split('=');
		var id = 1;
		if (arr.length == 2) {
			id = arr[1];
		}
		$("#themeLink").attr("href", LEA.sPath + "/css/theme/" + val + ".css?id=" + id);
		Net.ajaxPost("/user/updateTheme", {theme: val}, function(re) {
			if(reIsOk(re)) {
				UserInfo.Theme = val
			}
		});
	});

	// 禁止双击选中文字
	$("#notebook, #newMyNote, #myProfile, #topNav, #notesAndSort", "#leanoteNavTrigger").bind("selectstart", function(e) {
		e.preventDefault();
		return false;
	});
	
	// 左侧隐藏或展示
	function updateLeftIsMin(is) {
		Net.ajaxGet("/user/updateLeftIsMin", {leftIsMin: is})
	}

	// 最小化左侧
	var $page = $('#page');
	function minLeft(save) {
		$page.addClass('mini-left');
		if(save) {
			updateLeftIsMin(true);
		}
	}

	// 展开右侧
	function maxLeft(save) {
		$page.removeClass('mini-left');
		$("#noteAndEditor").css("left", UserInfo.NotebookWidth);
		$("#leftNotebook").width(UserInfo.NotebookWidth);
		if(save) {
			updateLeftIsMin(false);
		}
	}
	
	$("#leftSwitcher2").on('click', function() {
		maxLeft(true);
		Editor.resizeEditor();
	});
	$("#leftSwitcher").click('click', function() {
		if(Mobile.switchPage()) {
			minLeft(true);
			Editor.resizeEditor();
		}
	});
	
	// 得到最大dropdown高度
	// 废弃
	function getMaxDropdownHeight(obj) {
		var offset = $(obj).offset();
		var maxHeight = $(document).height()-offset.top;
		maxHeight -= 70;
		if(maxHeight < 0) {
			maxHeight = 0;
		}	
		
		var preHeight = $(obj).find("ul").height();
		return preHeight < maxHeight ? preHeight : maxHeight;
	}
	
	// mini版
	// 点击展开
	$("#notebookMin div.minContainer").click(function() {
		var target = $(this).attr("target");
		maxLeft(true);
		if(target == "#notebookList") {
			if($("#myNotebooks").hasClass("closed")) {
				$("#myNotebooks .folderHeader").trigger("click");
			}
		} else if(target == "#tagNav") {
			if($("#myTag").hasClass("closed")) {
				$("#myTag .folderHeader").trigger("click");
			}
		} else {
			if($("#myShareNotebooks").hasClass("closed")) {
				$("#myShareNotebooks .folderHeader").trigger("click");
			}
		}
	});
	
	//------------------------
	// 界面设置, 左侧是否是隐藏的
	UserInfo.NotebookWidth = UserInfo.NotebookWidth || $("#notebook").width();
	UserInfo.NoteListWidth = UserInfo.NoteListWidth || $("#noteList").width();
	
	if (!Mobile.isMobile()) {
		if (UserInfo.LeftIsMin) {
			minLeft(false);
		}
		else {
			maxLeft(false);
		}
	}
	else {
		maxLeft(false);
	}
	
	// 4/25 防止dropdown太高
	// dropdown
	$('.dropdown').on('shown.bs.dropdown', function () {
		var $ul = $(this).find("ul");
		// $ul.css("max-height", getMaxDropdownHeight(this));
	});
}

function init(){
    //对Notebook进行渲染
    Notebook.renderNotebooks(notebooks);

    //缓存当前Notebook下的所有notes
    Cache.initCachedNote(notes);

    //渲染笔记列表
    NoteList.renderNotesAndFirstOneContent(notes);

    //缓存最近的50本笔记
    if(latestNotes.length > 0) {
		for(var i = 0; i < latestNotes.length; ++i) {
			Cache.setNoteContent(latestNotes[i]);
		}
	}

    //渲染标签
    Tag.renderTagNav(tagsJson);

    // init notebook后才调用，初始化Notelist滚动条
	initSlimScroll();
    hideMask();
    
    initActionListeners();
}

