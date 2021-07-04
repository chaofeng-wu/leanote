/*
 * @Author: Ethan Wu
 * @Date: 2021-07-04 09:47:38
 * @LastEditTime: 2021-07-04 12:36:11
 * @FilePath: /leanote/public/js/app/image-upload.js
 */
Dialog = {};

Dialog.showImageUploadDialog = function() {
    function GetTheHtml(){
        var html = '<iframe id="imageUploadIfr" src="/album/index'+ '?' + new Date().getTime() + '" frameborder="0" style="width:100%; height:100%"></iframe>';
        return html;
    }
    var w = $(document).width() - 10;
    if(w > 805) {
        w = 805;
    }
    var h = $(document).height() - 100;
    if(h > 365) {
        h = 410;
    }
    // var w = window.innerWidth * 0.9;
    // var h = window.innerHeight * 0.8;
    jsPanel.ziBase = 600;
    var uploadPanel = jsPanel.create({
        id: 'uploadPanel',
        theme: 'primary',
        headerTitle: 'Image',
        contentSize: {
            width:  w,
            height: h
        },
        contentOverflow: 'hidden',
        content: GetTheHtml(),
        panelSize: {
            width:  w,
            height: h
        },
        headerControls: {
            minimize: 'remove',
            smallify: 'remove'
        },
        footerToolbar: '<button type="button" id="imageInsertButton" style="background-color:#01599D; border-radius: 5px; color:white">插入</button>',
        position: 'center 50 50',
        onbeforeclose: function(panel, closedByUser) {
            // convertJsonToNote();
            return true;
        },
        onbeforeminimize: function(panel, closedByUser) {
            // convertJsonToNote();
            return true;
        },
        onbeforesmallify: function(panel, closedByUser) {
            // convertJsonToNote();
            return true;
        },
        onbeforenormalize: function(panel, closedByUser) {
            // renderNoteChangeToMindmap();
            return true;
        },
        onbeforeunsmallify: function(panel, closedByUser) {
            // renderNoteChangeToMindmap();
            return true;
        },
        onbeforemaximize: function(panel, closedByUser) {
            // renderNoteChangeToMindmap();
            return true;
        },
        onclosed: function(panel, closedByUser) {
            // $("#minmap").css("pointer-events", "auto");
        }
    });

    //当url改变时, 得到图片的大小
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

    $('#imageInsertButton').click(function(){
        var _iframe = document.getElementById('imageUploadIfr').contentWindow;
        var _div =_iframe.document.getElementById('preview');
        var ii = _div.childNodes; 
        //console.log(ii);
        var datas = [];
        for(var i = 0; i < ii.length; ++i) {
            var e = ii[i]; 
            //console.log(e);
            // 有些没有image
            if(e.firstChild && e.firstChild.nodeName == "IMG") {
                var img = e.firstChild;
                var d = {};
                d.src = img.getAttribute("src");
                d.width = img.getAttribute("data-width");
                d.height = img.getAttribute("data-height");
                d.title = img.getAttribute("data-title");

                datas.push(d);
            }
        };

        for(var i in datas) {
            var data = datas[i];
            if (LEA.isM) {
                MarkdownEditor.insertImage(data.src,data.title,true);
            }
        } // end for
        
        uploadPanel.close();
    });
}