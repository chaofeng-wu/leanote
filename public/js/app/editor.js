/*
 * @Author: Ethan Wu
 * @Date: 2021-06-27 17:47:48
 * @LastEditTime: 2021-06-27 18:37:30
 * @FilePath: /leanote/public/js/app/editor.js
 */
Editor = {};

// 有tinymce得到的content有<html>包围
// 总会出现<p>&nbsp;<br></p>, 原因, setContent('<p><br data-mce-bogus="1" /></p>') 会设置成 <p> <br></p>
// 所以, 要在getContent时, 当是<p><br data-mce-bogus="1"></p>, 返回 <p><br/></p>
function getEditorContent(isMarkdown) {
	var content = _getEditorContent(isMarkdown);
	if (content === '<p><br data-mce-bogus="1"></p>') {
		return '<p><br></p>';
	}
	return content;
}
function _getEditorContent(isMarkdown) {
	if(!isMarkdown) {
		var editor = tinymce.activeEditor;
		if(editor) {
			var content = $(editor.getBody()).clone();
			// 删除toggle raw 
			content.find('.toggle-raw').remove();

			// single页面没有LeaAce
			if(window.LeaAce && LeaAce.getAce) {
				// 替换掉ace editor
				var pres = content.find('pre');
				for(var i = 0 ; i < pres.length; ++i) {
					var pre = pres.eq(i);
					var id = pre.attr('id');
					var aceEditor = LeaAce.getAce(id);
					if(aceEditor) {
						var val = aceEditor.getValue();
						// 表示有错
						if(isAceError(val)) {
							val = pre.html();
						}
						val = val.replace(/</g, '&lt').replace(/>/g, '&gt');
						pre.removeAttr('style', '').removeAttr('contenteditable').removeClass('ace_editor');
						pre.html(val);
					}
				}
			}
			
			// 去掉恶心的花瓣注入
			// <pinit></pinit>
			// 把最后的<script>..</script>全去掉
			content.find("pinit").remove();
			content.find(".thunderpin").remove();
			content.find(".pin").parent().remove();
			content = $(content).html();
			if(content) {
				while(true) {
					var lastEndScriptPos = content.lastIndexOf("</script>");
					if (lastEndScriptPos == -1) {
						return content;
					}
					var length = content.length;
					// 证明</script>在最后, 去除之
					if(length - 9 == lastEndScriptPos) {
						var lastScriptPos = content.lastIndexOf("<script ");
						if(lastScriptPos == -1) {
							lastScriptPos = content.lastIndexOf("<script>");
						}
						if(lastScriptPos != -1) {
							content = content.substring(0, lastScriptPos);
						} else {
							return content;
						}
					} else {
						// 不在最后, 返回
						return content;
					}
				}
			}
			return content;
		}
	} else {
		// return [$("#wmd-input").val(), $("#wmd-preview").html()]
		return [MD.getContent(), '<div>' + $("#preview-contents").html() + '</div>']
	}
}

Editor.saveNoteChange = function(){
    var curNote = Cache.getCurNote();
    var content = getEditorContent(curNote.isMarkdown);
    if (curNote.Content === content) {
        return;
    }
    curNote.Content = content;
    //先将content的改变写入到本地缓存
    Cache.setNoteContent(content);
    //先将content的改变写入到server
    Editor.syncContentToServer(content);
}

Editor.syncContentToServer = function(content){
    var curNote = Cache.getCurNote();
    var updatedNote = {
        UserId: curNote.UserId,
        NoteId: curNote.NoteId, 
        Content: content
    };

    Net.ajaxPost("/note/updateNoteOrContent", updatedNote, function(ret) {
		showMsg(getMsg("saveSuccess"), 1000);
	});
}