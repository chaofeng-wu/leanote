/**
 * leaui drawio plugin
 * copyright leaui
 * leaui.com
 */
 var LEAUI_DRAWIO = {};
tinymce.PluginManager.add('leaui_drawio', function(editor, url) {
    
    function showDialog() {
        var dom = editor.dom;

        var content = editor.selection.getContent();
        // get images and attrs
        var p = /<img.*?\/>/g;
        var images = content.match(p);
        var newNode = document.createElement("p");
        LEAUI_DRAWIO = {};
        for(var i in images) {
            newNode.innerHTML = images[i];
            var imgElm = newNode.firstChild;
            if(imgElm && imgElm.nodeName == "IMG") {
                LEAUI_DRAWIO.imageData = dom.getAttrib(imgElm, 'src');
                break;
            }
        }

        function GetTheHtml(){
            // var lang = editor.settings.language;
            var u = url + '/localstorage.html';
            var html = '<iframe id="leauiMindMapIfr" src="'+ u + '" frameborder="0"></iframe>';
            return html;
        }

        var w = window.innerWidth - 10;
        var h = window.innerHeight - 150;

        win = editor.windowManager.open({
            title: "Darwio",
            width : w,
            height : h,
            html: GetTheHtml(),
            buttons: [
                {
                    text: 'Cancel',
                    onclick: function() {
                        this.parent().parent().close();
                    }
                },
                {
                text: 'Insert',
                subtype: 'primary',
                onclick: function(e) {
                    var me = this;

                    var img = '<img src="' + LEAUI_DRAWIO.imageData + '"\'>';
                    editor.insertContent(img);

                    me.parent().parent().close();
                    return;
                }
                }]
        });
    }
    
    editor.addButton('leaui_drawio', {
        image: url + '/icon.svg',
        tooltip: 'Insert/edit drawio',
        onclick: showDialog,
        stateSelector: 'img[data-drawio-image]'
    });
});
