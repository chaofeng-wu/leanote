/*
 * @Author: Ethan Wu
 * @Date: 2021-07-02 21:03:10
 * @LastEditTime: 2021-07-02 21:48:33
 * @FilePath: /leanote/public/js/app/history.js
 */

History = {};

History.tpl = ['<div class="modal fade history-modal" tabindex="-1" role="dialog" aria-hidden="true">',
            '<div class="modal-dialog modal-lg ">',
                '<div class="modal-content">',
                    '<div class="modal-header">',
                        '<h4 class="modal-title" class="modalTitle">' + + '</h4>',
                    '</div>',
                    '<div class="modal-body clearfix">',
                        '<div class="history-list-wrap pull-left">',
                            '<div class="history-list-header">' + getMsg('history') +' (<span class="history-num"></span>)</div>',
                            '<div class="history-list list-group"></div>',
                        '</div>',
                        '<div class="history-content-wrap pull-left">',
                            '<div class="history-content-header">',
                                '<a class="btn btn-primary back">' + getMsg('restoreFromThisVersion') + '</a>',
                                '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>',
                            '</div>',
                            '<div class="history-content"></div>',
                        '</div>',
                    '</div>',
                    '<div class="modal-footer hide">',
                        '<button type="button" class="btn btn-default" data-dismiss="modal">' + getMsg('close') + '</button>',
                    '</div>',
                '</div>',
            '</div>',
       '</div>'].join('');
History.$tpl = $(History.tpl);

History.$historyContent = History.$tpl.find('.history-content');
History.$historyList = History.$tpl.find('.history-list');
History.$historyNum = History.$tpl.find('.history-num');
History.note = null;
History.list = [];
History.curIndex = 0;
History.renderContent =function (i) {
    var content = History.list[i].Content;
    History.curIndex = i;

    var wrap = '<div>';
    var wrapEnd = '</div>';
    if (History.note.IsMarkdown) {
        wrap = '<pre>';
        wrapEnd = '</pre>';
        content = trimTitle(content) // for xss
    }
    History.$historyContent.html(wrap + content + wrapEnd);

    var as = History.$historyList.find('a');
    as.removeClass('active');
    as.eq(i).addClass('active');
};
History.render = function (list) {
    var navs = '';
    History.list = list;
    if (list) {
        for(var i = 0; i < list.length; ++i) {
            var content = list[i];
            navs += '<a class="list-group-item" data-index="' + i + '"><span class="badge">#' + (i+1)+ '</span>' + goNowToDatetime(content.UpdatedTime) + '</a>';
        }
    }
    History.$historyList.html(navs);

    History.renderContent(0);
    History.$historyNum.html(list.length);
    // show
    History.$tpl.modal({show: true});
};

History.bind = function () {
    $("#contentHistory").click(function() {
        History.getHistories();
    });

    History.$historyList.on('click', 'a', function () {
        var index = $(this).data('index');
        History.renderContent(index);
    });

    // 还原
    History.$tpl.find('.back').click(function() {
        if(confirm(getMsg("confirmBackup"))) {
            // 保存当前版本
            Editor.saveNoteChange(true);

            // 设置之
            note = Cache.getCurNote();
            Editor.setEditorContent(History.list[History.curIndex].Content, note.IsMarkdown);

            History.$tpl.modal('hide');
            // 保存
            Editor.saveNoteChange(true);
        }
    });
};

History.getHistories = function () {
    var note = Cache.getCurNote();
    History.note = note;
    Net.ajaxGet("/noteContentHistory/listHistories", {noteId: Cache.curNoteId}, function(re) {
        if(!isArray(re)) {
            alert(getMsg('noHistories'));
            return;
        }

        History.render(re);

        return;

        // 组装成一个tab
        var str = "<p>" + getMsg("historiesNum") + '</p><div id="historyList"><table class="table table-hover">';
        note = Note.cache[Note.curNoteId];
        var s = "div"
        if(note.IsMarkdown) {
            s = "pre";
        }
        for (i in re) {
            var content = re[i]
            content.Ab = Note.genAbstract(content.Content, 200);
            // 为什么不用tt(), 因为content可能含??
            str += '<tr><td seq="' +  i + '">#' + (i+1) +'<' + s + ' class="each-content">' + content.Ab + '</' + s + '> <div class="btns">' + getMsg("datetime") + ': <span class="label label-default">' + goNowToDatetime(content.UpdatedTime) + '</span> <button class="btn btn-default all">' + getMsg("unfold") + '</button> <button class="btn btn-primary back">' + getMsg('restoreFromThisVersion') + '</button></div></td></tr>';
        }
        str += "</table></div>";
        $content.html(str);
        $("#historyList .all").click(function() {
            $p = $(this).parent().parent();
            var seq = $p.attr("seq");
            var $c = $p.find(".each-content");
            var info = re[seq]; 
            if(!info.unfold) { // 默认是折叠的
                $(this).text(getMsg("fold")); // 折叠
                $c.html(info.Content);
                info.unfold = true;
            } else {
                $(this).text(getMsg("unfold")); // 展开
                $c.html(info.Ab);
                info.unfold = false
            }
        });

        
    });
};

History.init = function () {
    var me = this;
    History.bind();
}

History.init();