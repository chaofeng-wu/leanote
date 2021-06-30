// leanote 通用方法

//--------------
// 命名空间
//--------------

// 最上级变量
if(typeof LEA === 'undefined') {
	var LEA = {};
}
// var UserInfo = {}; // 博客有问题, 会覆盖
var Tag = {};
var Mobile = {}; // 手机端处理
var LeaAce = {};

// markdown
var Converter;
var MarkdownEditor;
var ScrollLink;
var MD;

//---------------------
// 公用方法

function trimLeft(str, substr) {
	if(!substr || substr == " ") {
		return $.trim(str);
	}
	while(str.indexOf(substr) == 0) {
		str = str.substring(substr.length);
	}
	return str;
}

function trimTitle(title) {
	if(!title || typeof title != 'string') {
		return '';
	}
	return title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	// return title.replace(/<.*?script.*?>/g, '');
};

function json(str) {
	return eval("(" + str + ")")
}

// '<div id="?" class="?" onclick="?">'
function t() {
	var args = arguments;
	if(args.length <= 1) {
		return args[0];
	}
	var text = args[0];
	if(!text) {
		return text;
	}
	
	// 先把所有的?替换成, 很有可能替换的值有?会造成循环,没有替换想要的
	var pattern = "LEAAEL"
	text = text.replace(/\?/g, pattern);
	
	// args[1] 替换第一个?
	for(var i = 1; i <= args.length; ++i) {
		text = text.replace(pattern, args[i]);
	}
	return text;
}
var tt = t; // 当slimscroll滑动时t被重新赋值了

// 判断数组是否相等
function arrayEqual(a, b) {
	a = a || [];
	b = b || [];
	return a.join(",") == b.join(",");
}

// 是否是数组
function isArray(obj) {  
	return Object.prototype.toString.call(obj) === '[object Array]';   
}

/**
 * 是否为空
 * 可判断任意类型，string array
 */
function isEmpty(obj) {
	if(!obj) {
		return true;
	}
	
	if(isArray(obj)) {
		if(obj.length == 0) {
			return true;
		}
	}
	
	return false;
}

//------------
//得到form的数据
//返回json
function getFormJsonData(formId) {
	var data = formArrDataToJson($('#' + formId).serializeArray());
	return data;
}

//$('#form').serializeArray()的数据[{name: a, value: b}, {name: "c[]", value: d}]
//转成{a:b}
function formArrDataToJson(arrData) {
	var datas = {};
	var arrObj= {}; // {a:[1, 2], b:[2, 3]};
	for(var i in arrData) {
		var attr = arrData[i].name;
		var value = arrData[i].value;
		// 判断是否是a[]形式
		if(attr.substring(attr.length-2, attr.length) == '[]') {
			attr = attr.substring(0, attr.length-2);
			if(arrObj[attr] == undefined) {
				arrObj[attr] = [value];
			} else {
				arrObj[attr].push(value);
			}
			continue;
		}
		
		datas[attr] = value;
	}
	
	return $.extend(datas, arrObj);
}

//将serialize的的form值转成json
function formSerializeDataToJson(formSerializeData) {
	var arr = formSerializeData.split("&");
	var datas = {};
	var arrObj= {}; // {a:[1, 2], b:[2, 3]};
	for(var i = 0; i < arr.length; ++i) {
		var each = arr[i].split("=");
		var attr = decodeURI(each[0]);
		var value = decodeURI(each[1]);
		// 判断是否是a[]形式
		if(attr.substring(attr.length-2, attr.length) == '[]') {
			attr = attr.substring(0, attr.length-2);
			if(arrObj[attr] == undefined) {
				arrObj[attr] = [value];
			} else {
				arrObj[attr].push(value);
			}
			continue;
		}
		datas[attr] = value;
	}
	
	return $.extend(datas, arrObj);
}

function findParents(target, selector) {
	if($(target).is(selector)) {
		return $(target);
	}
	var parents = $(target).parents();
	for(var i = 0; i < parents.length; ++i) {
		log(parents.eq(i))
		if(parents.eq(i).is(selector)) {
			return parents.seq(i);
		}
	}
	return null;
}

function getVendorPrefix() {
  // 使用body是为了避免在还需要传入元素
  var body = document.body || document.documentElement,
    style = body.style,
    vendor = ['webkit', 'khtml', 'moz', 'ms', 'o'],
    i = 0;
 
  while (i < vendor.length) {
    // 此处进行判断是否有对应的内核前缀
    if (typeof style[vendor[i] + 'Transition'] === 'string') {
      return vendor[i];
    }
    i++;
  }
}

//---------------
// notify
// 没用
$(function() {
	if($.pnotify) {
		$.pnotify.defaults.delay = 1000;
	}
})

function notifyInfo(text) {
	$.pnotify({
	    title: '通知',
	    text: text,
	    type: 'info',
	    styling: 'bootstrap'
	});
}
function notifyError(text) {
	$.pnotify.defaults.delay = 2000
	$.pnotify({
	    title: '通知',
	    text: text,
	    type: 'error',
	    styling: 'bootstrap'
	});
}
function notifySuccess(text) {
	$.pnotify({
	    title: '通知',
	    text: text,
	    type: 'success',
	    styling: 'bootstrap'
	});
}

// 对Date的扩展，将 Date 转化为指定格式的String   
//月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，   
//年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)   
//例子：   
//(new Date()).format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423   
//(new Date()).format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.format = function(fmt) { //author: meizz   
  var o = {   
    "M+" : this.getMonth()+1,                 //月份   
    "d+" : this.getDate(),                    //日   
    "h+" : this.getHours(),                   //小时   
    "m+" : this.getMinutes(),                 //分   
    "s+" : this.getSeconds(),                 //秒   
    "q+" : Math.floor((this.getMonth()+3)/3), //季度   
    "S"  : this.getMilliseconds()             //毫秒   
  };   
  if(/(y+)/.test(fmt))   
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));   
  for(var k in o)   
    if(new RegExp("("+ k +")").test(fmt))   
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
  return fmt; 
}

//2014-01-06T18:29:48.802+08:00
function goNowToDatetime(goNow) {
	if(!goNow) {
		return "";
	}
	if (typeof goNow == 'object') {
		try {
			return goNow.format("yyyy-M-d hh:mm:ss");
		} catch(e) {
			return getCurDate();
		}
	}
	return goNow.substr(0, 10) + " " + goNow.substr(11, 8);
}
function getCurDate() {
	return (new Date()).format("yyyy-M-d");
}

// 回车键的动作
function enter(parent, children, func) {
	if(!parent) {
		parent = "body";
	}
	$(parent).on("keydown", children, function(e) {
		if (e.keyCode == 13) {
			func.call(this);
		}
	});
}

// 回车则blue
function enterBlur(parent, children) {
	if(!parent) {
		parent = "body";
	}
	if(!children) {
		children = parent;
		parent = "body";
	}
	$(parent).on("keydown", children, function(e) {
		if (e.keyCode == 13) {
			$(this).trigger("blur");
		}
	});
}

// 生成mongodb ObjectId
function getObjectId() {
	return ObjectId();
}

//----------
// msg位置固定
function showMsg(msg, timeout) {
	$("#msg").html(msg);
	if(timeout) {
		setTimeout(function() {
			$("#msg").html("");
		}, timeout)
	}
}
function showMsg2(id, msg, timeout) {
	$(id).html(msg);
	if(timeout) {
		setTimeout(function() {
			$(id).html("");
		}, timeout)
	}
}

//--------------
// type == danger, success, warning
function showAlert(id, msg, type, id2Focus) {
	$(id).html(msg).removeClass("alert-danger").removeClass("alert-success").removeClass("alert-warning").addClass("alert-" + type).show();
	if(id2Focus) {
		$(id2Focus).focus();
	}
}
function hideAlert(id, timeout) {
	if(timeout) {
		setTimeout(function() {
			$(id).hide();
		}, timeout);
	} else {
		$(id).hide();
	}
}



// 是否是正确的email
function isEmail(email) {
	var myreg = /^([a-zA-Z0-9]+[_|\_|\.|\-]?)*[a-zA-Z0-9\-]+@([a-zA-Z0-9\-]+[_|\_|\.|\-]?)*[a-zA-Z0-9\-]+\.[0-9a-zA-Z]{2,3}$/;
	return myreg.test(email);
}

// 正确返回该email
function isEmailFromInput(inputId, msgId, selfBlankMsg, selfInvalidMsg) {
	var val = $(inputId).val();
	var msg = function() {};
	if(msgId) {
		msg = function(msgId, msg) {
			showAlert(msgId, msg, "danger", inputId);
		}
	}
	if(!val) {
		msg(msgId, selfBlankMsg || getMsg("inputEmail"));
	} else if(!isEmail(val)) {
		msg(msgId, selfInvalidMsg || getMsg("errorEmail"));
	} else {
		return val;
	}
}

// 复制文本
function initCopy(aId, postFunc) {
	// 定义一个新的复制对象
	var clip = new ZeroClipboard(document.getElementById(aId), {
	  moviePath: "/js/ZeroClipboard/ZeroClipboard.swf"
	});

	// 复制内容到剪贴板成功后的操作
	clip.on('complete', function(client, args) {
		postFunc(args);
	});   
}

// 注销, 先清空cookie
function setCookie(c_name, value, expiredays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + expiredays);
	document.cookie = c_name+ "=" + escape(value) + ((expiredays==null) ? "" : ";expires="+exdate.toGMTString()) + 'path=/';
	document.cookie = c_name+ "=" + escape(value) + ((expiredays==null) ? "" : ";expires="+exdate.toGMTString()) + 'path=/note';
}
function logout() {
	Note.curChangedSaveIt(true);
	LEA.isLogout = true;

	setCookie("LEANOTE_SESSION", '', -1);
	location.href = UrlPrefix + "/logout?id=1";
}

// 得到图片width, height, callback(ret); ret = {width:11, height:33}
function getImageSize(url, callback) {
	var img = document.createElement('img');

	function done(width, height) {
		img.parentNode.removeChild(img);
		callback({width: width, height: height});
	}

	img.onload = function() {
		done(img.clientWidth, img.clientHeight);
	};

	img.onerror = function() {
		done();
	};

	img.src = url;

	var style = img.style;
	style.visibility = 'hidden';
	style.position = 'fixed';
	style.bottom = style.left = 0;
	style.width = style.height = 'auto';

	document.body.appendChild(img);
}

// 插件中使用
function hiddenIframeBorder() {
	$('.mce-window iframe').attr("frameborder", "no").attr("scrolling", "no");
}

var email2LoginAddress = {
    'qq.com': 'http://mail.qq.com',
    'gmail.com': 'http://mail.google.com',
    'sina.com': 'http://mail.sina.com.cn',
    '163.com': 'http://mail.163.com',
    '126.com': 'http://mail.126.com',
    'yeah.net': 'http://www.yeah.net/',
    'sohu.com': 'http://mail.sohu.com/',
    'tom.com': 'http://mail.tom.com/',
    'sogou.com': 'http://mail.sogou.com/',
    '139.com': 'http://mail.10086.cn/',
    'hotmail.com': 'http://www.hotmail.com',
    'live.com': 'http://login.live.com/',
    'live.cn': 'http://login.live.cn/',
    'live.com.cn': 'http://login.live.com.cn',
    '189.com': 'http://webmail16.189.cn/webmail/',
    'yahoo.com.cn': 'http://mail.cn.yahoo.com/',
    'yahoo.cn': 'http://mail.cn.yahoo.com/',
    'eyou.com': 'http://www.eyou.com/',
    '21cn.com': 'http://mail.21cn.com/',
    '188.com': 'http://www.188.com/',
    'foxmail.com': 'http://mail.foxmail.com'
};

function getEmailLoginAddress(email) {
	if(!email) {
		return;
	}
	var arr = email.split('@');
	if(!arr || arr.length < 2) {
		return;
	}
    var addr = arr[1];
    return email2LoginAddress[addr] || "http://mail." + addr;
}

// 返回是否是re.Ok == true
function reIsOk(re) {
	return re && typeof re == "object" && re.Ok;
}

// 是否是手机浏览器
// var u = navigator.userAgent;
// LEA.isMobile = /Mobile|Android|iPhone/i.test(u);
// LEA.isMobile = u.indexOf('Android')>-1 || u.indexOf('Linux')>-1;
// LEA.isMobile = false;
//if($("body").width() < 600) {
//	location.href = "/mobile/index";
//}

// 表单验证
var vd = {
	isInt: function(o) {
	    var intPattern=/^0$|^[1-9]\d*$/; //整数的正则表达式
	    result=intPattern.test(o);
	    return result;
	},
	isNumeric: function(o) {
		return $.isNumeric(o);
	},
	isFloat: function(floatValue){
	    var floatPattern=/^0(\.\d+)?$|^[1-9]\d*(\.\d+)?$/; //小数的正则表达式
	    result=floatPattern.test(floatValue);
	    return result;
	},
	isEmail: function(emailValue){
	    var emailPattern=/^([a-zA-Z0-9]+[_|\_|\.|\-]?)*[a-zA-Z0-9\-]+@([a-zA-Z0-9\-]+[_|\_|\.|\-]?)*[a-zA-Z0-9\-]+\.[0-9a-zA-Z]{2,3}$/; //邮箱的正则表达式
	    result=emailPattern.test(emailValue);
	   
	    return result;
	},
	isBlank: function(o) { 
		return !$.trim(o);
	},
	has_special_chars: function(o) {
		return /['"#$%&\^<>\?*]/.test(o);
	},
	
	// life
	// 动态验证
	// rules = {max: function() {}};
	// <input data-rules='[{rule: 'requried', msg:"请填写标题"}]' data-msg_target="#msg"/>
	init: function(form, rule_funcs) {
		var get_val = function(target) {
			if(target.is(":checkbox")) {
				var name = target.attr('name');
				var val = $('input[name="' + name + '"]:checked').length;
				return val;
			} else if(target.is(":radio")) {
			} else {
				return target.val();
			}
		}
		var default_rule_funcs = {
			// 必须输入
			required: function(target) {
				return get_val(target);
			},
			// 最少
			min: function(target, rule) {
				var val = get_val(target);
				if(val === "" && !is_required(target)) {
					return true;
				}
				if(val < rule.data) {
					return false;
				}
				return true;
			},
			minLength: function(target, rule) {
				var val = get_val(target);
				if(val === "" && !is_required(target)) {
					return true;
				}
				if(val.length < rule.data) {
					return false;
				}
				return true;
			},
			email: function(target, rule) {
				var val = get_val(target);
				if(val === "" && !is_required(target)) {
					return true;
				}
				return vd.isEmail(val);
			},
			noSpecialChars: function(target) {
				var val = get_val(target);
				if(!val) {
					return true;
				}
				if(/[^0-9a-zzA-Z_\-]/.test(val)) {
					return false;
				}
				return true;
			},
			password: function(target, rule) {
				var val = get_val(target);
				if(val === "" && !is_required(target)) {
					return true;
				}
				return val.length >= 6
			},
			equalTo: function(target, rule) {
				var val = get_val(target);
				if(val === "" && !is_required(target)) {
					return true;
				}
				return $(rule.data).val() == val;
			}
		}
		rule_funcs = rule_funcs || {};
		rule_funcs = $.extend(default_rule_funcs, rule_funcs);
		var rules = {}; // name对应的
		var msg_targets = {};
		// 是否是必须输入的
		function is_required(target) { 
			var name = get_name(target);
			var rules = get_rules(target, name);
			var required_rule = rules[0];
			if(required_rule['rule'] == "required")  {
				return true;
			}
			return false;
		}
		// 先根据msg_target_name, 再根据name
		function get_rules(target, name) {
			if(!rules[name]) {
				rules[name] = eval("(" + target.data("rules") + ")");
			}
			return rules[name];
		}
		
		// 以name为索引, 如果多个input name一样, 但希望有不同的msg怎么办?
		// 添加data-u_name=""
		function get_msg_target(target, name) {
			if(!msg_targets[name]) {
				var t = target.data("msg_target");
				if(!t) {
					// 在其父下append一个
					var msg_o = $('<div class="help-block alert alert-warning" style="display: block;"></div>');
					target.parent().append(msg_o);
					msg_targets[name] = msg_o;
				} else {
					msg_targets[name] = $(t);
				}
			}
			
			return msg_targets[name];
		}
		function hide_msg(target, name) {
			var msgT = get_msg_target(target, name);
			// 之前是正确信息, 那么不隐藏
			if(!msgT.hasClass("alert-success")) {
				msgT.hide();
			}
		}
		function show_msg(target, name, msg, msgData) {
			var t = get_msg_target(target, name);
			t.html(getMsg(msg, msgData)).removeClass("hide alert-success").addClass("alert-danger").show();
		}
		
		// 验证前修改
		function pre_fix(target) {
			var fix_name = target.data("pre_fix");
			if(!fix_name) {
				return;
			}
			switch(fix_name) {
				case 'int': int_fix(target);
				break;
				case 'price': price_fix(target);
				break;
				case 'decimal': decimal_fix(target);
				break;
			}
		}
		
		// 验证各个rule
		// 正确返回true
		function apply_rules(target, name) {
			var rules = get_rules(target, name);
			
			// 是否有前置fix data-pre_fix
			pre_fix(target);
			
			if(!rules) {
				return true;
			}
			for(var i = 0; i < rules.length; ++i) {
				var rule = rules[i];
				var rule_func_name = rule.rule;
				var msg = rule.msg;
				var msgData = rule.msgData;
				if(!rule_funcs[rule_func_name](target, rule)) {
					show_msg(target, name, msg, msgData);
					return false;
				}
			}
			
			hide_msg(target, name);
			
			// 这里, 如果都正确, 是否有sufix验证其它的
			var post_rule = target.data('post_rule');
			if(post_rule) {
				setTimeout(function() {
					var post_target = $(post_rule);
					apply_rules(post_target, get_name(post_target));
				},0);
			}
			
			return true;
		}
		
		function focus_func(e) {
			var target = $(e.target);
			var name = get_name(target);
			// 验证如果有错误, 先隐藏
			hide_msg(target, name);
			
			// key up的时候pre_fix
			pre_fix(target);
		}
		function unfocus_func(e) {
			var target = $(e.target);
			var name = get_name(target);
			// 验证各个rule
			apply_rules(target, name);
		}
		
		// u_name是唯一名, msg, rule的索引
		function get_name(target) {
			return target.data('u_name') || target.attr("name") || target.attr("id");
		}
		
		var $allElems = $(form).find('[data-rules]');
		var $form = $(form);
		$form.on({
			keyup: function(e) {
				if(e.keyCode != 13) { // 不是enter
					focus_func(e)
				}
			},
			blur: unfocus_func,
		}, 'input[type="text"], input[type="password"]');
		$form.on({
			change: function(e) {
				if($(this).val()) {
					focus_func(e);
				} else {
					unfocus_func(e);
				}
			}
		}, 'select');
		$form.on({
			change: function(e) {
				unfocus_func(e);
			}
		}, 'input[type="checkbox"]');
		
		// 验证所有的
		this.valid = function() {
			var $ts = $allElems;
			var is_valid = true;
			for(var i = 0; i < $ts.length; ++i) {
				var target = $ts.eq(i);
				var name = get_name(target);
				// 验证各个rule
				if(!apply_rules(target, name)) {
					is_valid = false;
					target.focus();
					return false
				} else {
				}
			}
			return is_valid;
		}
		
		// 验证某一元素(s)
		// .num-in, #life
		this.validElement = function(targets) {
			var targets = $(targets);
			var ok = true;
			for(var i = 0; i < targets.length; ++i) {
				var target = targets.eq(i);
				var name = get_name(target);
				// 验证各个rule
				if(!apply_rules(target, name)) {
					ok = false;
				}
			}
			return ok;
		}
	}
};

// 返回hash的#a=1&b=3 返回{a:1, b:3}
function getHashObject() {
	var hash = location.hash; // #life	
	if(!hash) {
		return {};
	}
	var hashKV = hash.substr(1);
	var kvs = hashKV.split("&");
	var kvsObj = {};
	for(var i = 0; i < kvs.length; ++i) {
		var kv = kvs[i].split('=');
		if(kv.length == 2) {
			kvsObj[kv[0]] = kv[1];
		}
	}
	return kvsObj;
}
function getHash(key, value) {
	var kvs = getHashObject();
	return kvs[key];
}
function setHash(key, value) {
	var hash = location.hash; // #life	
	if(!hash) {
		location.href = "#" + key + "=" + value;
		return;
	}
	var kvs = getHashObject();
	kvs[key] = value;
	var str = "";
	for(var i in kvs) {
		if(kvs[i]) {
			if(str) {
				str += "&";
			}
			str += i + '=' + kvs[i];
		}
	}
	location.href = "#" + str;
}


//-----------
// dialog
//-----------
function showDialog(id, options) {
	$("#leanoteDialog #modalTitle").html(options.title);
	$("#leanoteDialog .modal-body").html($("#" + id + " .modal-body").html());
	$("#leanoteDialog .modal-footer").html($("#" + id + " .modal-footer").html());
	delete options.title;
	options.show = true;
	$("#leanoteDialog").modal(options);
}
function hideDialog(timeout) {
	if(!timeout) {
		timeout = 0;
	}
	setTimeout(function() {
		$("#leanoteDialog").modal('hide');
	}, timeout);
}

// 更通用
function closeDialog() {
	$(".modal").modal('hide');
}

// 原生的
function showDialog2(id, options) {
	options = options || {};
	options.show = true;
	$(id).modal(options);
}
function hideDialog2(id, timeout) {
	if(!timeout) {
		timeout = 0;
	}
	setTimeout(function() {
		$(id).modal('hide');
	}, timeout);
}

// 远程
function showDialogRemote(url, data) {
	data = data || {};
	url += "?";
	for(var i in data) {
		url += i + "=" + data[i] + "&";
	}
	$("#leanoteDialogRemote").modal({remote: url});
}

function hideDialogRemote(timeout) {
	if(timeout) {
		setTimeout(function() {
			$("#leanoteDialogRemote").modal('hide');
		}, timeout);
	} else {
		$("#leanoteDialogRemote").modal('hide');
	}
}