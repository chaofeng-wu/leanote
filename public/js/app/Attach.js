// 附件
// 笔记的附件需要ajax获取
// 建一张附件表? attachId, noteId, 其它信息 
// note里有attach_nums字段记录个数
// [ok]
var Attach = {
	loadedNoteAttachs: {}, // noteId => [attch1Info, attach2Info...] // 按笔记
	attachsMap: {}, // attachId => attachInfo
	init: function() {
		var self = this;
		// 显示attachs
		$("#showAttach").click(function() {
			// self._bookmark = tinymce.activeEditor.selection.getBookmark();
			self.renderAttachs(Cache.curNoteId);
		});
		// 防止点击隐藏
		self.attachListO.click(function(e) {
			e.stopPropagation();
		});
		// 删除
		self.attachListO.on("click", ".delete-attach", function(e) {
			e.stopPropagation();
			var attachId = $(this).closest('li').data("id");
			var t = this;
			if(confirm(getMsg("Are you sure to delete it ?"))) {
				$(t).button("loading");
				Net.ajaxPost("/attach/deleteAttach", {attachId: attachId}, function(re) {
					$(t).button("reset");
					if(reIsOk(re)) {
						self.deleteAttach(attachId);
					} else {
						alert(re.Msg);
					}
				});
			}
		});
		// 下载
		self.attachListO.on("click", ".download-attach", function(e) {
			e.stopPropagation();
			var attachId = $(this).closest('li').data("id");
			Note.download("/attach/download", {attachId:attachId});
		});
		// 下载全部
		self.downloadAllBtnO.click(function() {
			Note.download("/attach/downloadAll", {noteId: Cache.curNoteId});
		});

		// make link
		self.attachListO.on("click", ".link-attach", function(e) {
			e.stopPropagation();
			var attachId = $(this).closest('li').data("id");
			var attach = self.attachsMap[attachId];
			var src = UrlPrefix + "/api/file/getAttach?fileId=" + attachId;
			// Note.toggleWriteable();
			if(LEA.isM) {
				Editor.insertAttachLink(src, attach.Title);
			} else {
				// tinymce.activeEditor.selection.moveToBookmark(self._bookmark);
				Editor.insertAttachLink('<a target="_blank" href="' + src + '">' + attach.Title + '</a>');
			}
		});

		// make all link
		/*
		self.linkAllBtnO.on("click",function(e) {
			e.stopPropagation();
			var note = Note.getCurNote();
			if(!note) {
				return;
			}
			var src = UrlPrefix +  "/attach/downloadAll?noteId=" + Note.curNoteId
			var title = note.Title ? note.Title + ".tar.gz" : "all.tar.gz";
			
			if(LEA.isMarkdownEditor() && MD) {
				MD.insertLink(src, title);
			} else {
				tinymce.activeEditor.insertContent('<a target="_blank" href="' + src + '">' + title + '</a>');
			}
		});
		*/
	},
	attachListO: $("#attachList"),
	attachNumO: $("#attachNum"),
	attachDropdownO: $("#attachDropdown"),
	downloadAllBtnO: $("#downloadAllBtn"),
	linkAllBtnO: $("#linkAllBtn"),
	// 添加笔记时
	clearNoteAttachNum: function() {
		var self = this;
		self.attachNumO.html("").hide();
	},
	renderNoteAttachNum: function(noteId, needHide) {
		var self = this;
		var note = Cache.getNote(noteId);
		if(note.AttachNum) {
			self.attachNumO.html("(" + note.AttachNum + ")").show();
			self.downloadAllBtnO.show();
			self.linkAllBtnO.show();
		} else {
			self.attachNumO.hide();
			self.downloadAllBtnO.hide();
			self.linkAllBtnO.hide();
		}
		
		// 隐藏掉
		if(needHide) {
			self.attachDropdownO.removeClass("open");
		}
	},
	_renderAttachs: function(attachs) {
		var self = this;
		// foreach 循环之
		/*
		<li class="clearfix">
			<div class="attach-title">leanote官abcefedafadfadfadfadfad方文档.doc</div>
			<div class="attach-process">
				<button class="btn btn-sm btn-warning">Delete</button>
				<button class="btn btn-sm btn-deafult">Download</button>
			</div>
		</li>
		*/
		var html = "";
		var attachNum = attachs.length;
		var titleDelete = getMsg('Delete');
		var titleDownload = getMsg('Download');
		var titleLink = getMsg('Insert link into content');
		for(var i = 0; i < attachNum; ++i) {
			var each = attachs[i];
			html += '<li class="clearfix" data-id="' + each.AttachId + '">' +
						'<div class="attach-title">' + each.Title + '</div>' + 
						'<div class="attach-process"> ' +
						'	  <button class="btn btn-sm btn-warning delete-attach" data-loading-text="..." title="' + titleDelete + '"><i class="fa fa-trash-o"></i></button> ' + 
						'	  <button type="button" class="btn btn-sm btn-primary download-attach" title="' + titleDownload + '"><i class="fa fa-download"></i></button> ' +
						'	  <button type="button" class="btn btn-sm btn-default link-attach" title="' + titleLink + '"><i class="fa fa-link"></i></button> ' +
						'</div>' + 
					'</li>';
			self.attachsMap[each.AttachId] = each;
		}
		self.attachListO.html(html);
		
		// 设置数量
		var note = Cache.getCurNote();
		if(note) {
			note.AttachNum = attachNum;
			self.renderNoteAttachNum(note.NoteId, false);
		}
	},
	// 渲染noteId的附件
	// 当点击"附件"时加载, 
	// TODO 判断是否已loaded
	_bookmark: null,
	renderAttachs: function(noteId) {
		var self = this;
		
		if(self.loadedNoteAttachs[noteId]) {
			self._renderAttachs(self.loadedNoteAttachs[noteId]);
			return;
		}
		// 显示loading
		self.attachListO.html('<li class="loading"><img src="/images/loading-24.gif"/></li>');
		// ajax获取noteAttachs
		Net.ajaxGet("/attach/getAttachs", {noteId: noteId}, function(ret) {
			var list = [];
			if(ret.Ok) {
				list = ret.List;
				if(!list) {
					list = [];
				}
			}
			// 添加到缓存中
			self.loadedNoteAttachs[noteId] = list;
			self._renderAttachs(list);
		});
	},
	// 添加附件, attachment_upload上传调用
	addAttach: function(attachInfo) {
		var self = this;
		if(!self.loadedNoteAttachs[attachInfo.NoteId]) {
			self.loadedNoteAttachs[attachInfo.NoteId] = [];
		}
		self.loadedNoteAttachs[attachInfo.NoteId].push(attachInfo);
		self.renderAttachs(attachInfo.NoteId);
	},
	// 删除
	deleteAttach: function(attachId) {
		var self = this;
		var noteId = Cache.curNoteId;
		var attachs = self.loadedNoteAttachs[noteId];
		for(var i = 0; i < attachs.length; ++i) {
			if(attachs[i].AttachId == attachId) {
				// 删除之, 并render之
				attachs.splice(i, 1);
				break;
			}
		}
		// self.loadedNoteAttachs[noteId] = attachs;
		self.renderAttachs(noteId);
	},
	
	// 下载
	downloadAttach: function(fileId) {
		var self = this;
	},
	downloadAll: function() {
	},

	// Helper function that formats the file sizes
    formatFileSize: function(bytes) {
        if (typeof bytes !== 'number') {
            return '';
        }
        if (bytes >= 1000000000) {
            return (bytes / 1000000000).toFixed(2) + ' GB';
        }
        if (bytes >= 1000000) {
            return (bytes / 1000000).toFixed(2) + ' MB';
        }
        return (bytes / 1000).toFixed(2) + ' KB';
    },

	setDropStyle: function(dropzoneId, formId) {
	    // drag css
	    var dropZone = $(dropzoneId);
		$(formId).bind('dragover', function (e) {
			e.preventDefault();
		    var timeout = window.dropZoneTimeoutAttach;
		    if(timeout) {
		        clearTimeout(timeout);
		    }
		    var found = false,
		        node = e.target;
		    do {
		        if (node === dropZone[0]) {
		            found = true;
		            break;
		        }
		        node = node.parentNode;
		    } while (node != null);
		    if (found) {
		        dropZone.addClass('hover');
		    } else {
		        dropZone.removeClass('hover');
		    }
		    window.dropZoneTimeoutAttach = setTimeout(function () {
		        window.dropZoneTimeoutAttach = null;
		        dropZone.removeClass('in hover');
		    }, 100);
		});
    },

	initUploader: function() {
	    $('.dropzone .btn-choose-file').click(function() {
	        $(this).parent().find('input').click();
	    });

		var $msg = $('#attachUploadMsg');
	    // Initialize the jQuery File Upload plugin
	    $('#uploadAttach').fileupload({
	        dataType: 'json',
	        pasteZone: '', // 不能通过paste来上传图片
	        // This element will accept file drag/drop uploading
	        dropZone: $('#dropAttach'),
	        formData: function(form) {
	        	return [{name: 'noteId', value: Cache.curNoteId}] // 传递笔记本过去
	        },
	        // This function is called when a file is added to the queue;
	        // either via the browse button, or via drag/drop:
	        add: function(e, data) {
	        	var note = Cache.getCurNote();
	        	if(!note || note.IsNew) {
	        		alert("This note hasn't saved, please save it firstly!")
	        		return;
	        	}

	            var tpl = $('<div class="alert alert-info"><img class="loader" src="/images/ajax-loader.gif"> <a class="close" data-dismiss="alert">×</a></div>');
	
	            // Append the file name and file size
	            tpl.append(data.files[0].name + ' <small>[<i>' + Attach.formatFileSize(data.files[0].size) + '</i>]</small>');
	
	            // Add the HTML to the UL element
	            $msg.html(tpl);
	            data.context = $msg;
	            
	            // 检查文件大小
	            var size = data.files[0].size;
	            var maxFileSize = +GlobalConfigs["uploadAttachSize"] || 100;
	            if(typeof size == 'number' && size > 1024 * 1024 * maxFileSize) {
	            	tpl.find("img").remove();
	            	tpl.removeClass("alert-info").addClass("alert-danger");
	            	tpl.append(" Warning: File size is bigger than " + maxFileSize + "M");
	            	setTimeout((function(tpl) {
	                	return function() {
		                	tpl.remove();
	                	}
	                })(tpl), 3000);
	            	return;
	            }
	            
	            // Automatically upload the file once it is added to the queue
	            var jqXHR;
	            setTimeout(function() {
		            jqXHR = data.submit();
	            }, 10);
	        },
	        /*
	        progress: function (e, data) {
	        },
	        */
	        done: function(e, data) {
	            if (data.result.Ok == true) {
	                data.context.html("");
	                Attach.addAttach(data.result.Item);
	            } else {
	                var re = data.result;
	                data.context.html("");
	                var tpl = $('<div class="alert alert-danger"><a class="close" data-dismiss="alert">×</a></div>');
	                tpl.append('<b>Error:</b> ' + data.files[0].name + ' <small>[<i>' + formatFileSize(data.files[0].size) + '</i>]</small> ' + data.result.Msg);
	                data.context.html(tpl);
	                setTimeout((function(tpl) {
	                	return function() {
		                	tpl.remove();
	                	}
	                })(tpl), 3000);
	            }
	            $("#uploadAttachMsg").scrollTop(1000);
	        },
	        fail: function(e, data) {
                data.context.html("");
	            var tpl = $('<div class="alert alert-danger"><a class="close" data-dismiss="alert">×</a></div>');
	            tpl.append('<b>Error:</b> ' + data.files[0].name + ' <small>[<i>' + formatFileSize(data.files[0].size) + '</i>]</small> ' + data.errorThrown);
	            data.context.html(tpl);
	            setTimeout((function(tpl) {
	                	return function() {
		                	tpl.remove();
	                	}
	                })(tpl), 3000);
	
	            $("#uploadAttachMsg").scrollTop(1000);
	        }
	    });
	}


};

// 附件初始化
Attach.init();
Attach.setDropStyle("#dropAttach", "#uploadAttach");
Attach.initUploader();