/*
 * @Author: Ethan Wu
 * @Date: 2021-07-02 22:00:04
 * @LastEditTime: 2021-07-02 22:08:05
 * @FilePath: /leanote/public/js/app/note-info.js
 */

NoteInfo = {};
NoteInfo.tpl = ['<table>',
        '<tr><th>' + getMsg('Create Time') + '</th><td id="noteInfoCreatedTime"></td></tr>',
        '<tr><th>' + getMsg('Update Time') + '</th><td id="noteInfoUpdatedTime"></td></tr>',
        '<tr class="post-url-tr">',
            '<th>' +  getMsg('Post Url') + '</th>',
            '<td>',
                '<div class="post-url-wrap">',
                        '<span class="post-url-base">http://blog.leanote.com/life/post/</span><span><span class="post-url-text">life-life-life-a-leanote</span>',
                        '<input type="text" class="form-control">',
                        '</span>',
                        ' <a class="post-url-pencil" title="' + getMsg('update') + '"><i class="fa fa-pencil"></i></a>',
                    '</div>',
                '</td>',
            '</tr>',
        '</table>'].join('');
NoteInfo.$tpl = $(NoteInfo.tpl);

NoteInfo.$noteInfoCreatedTime = NoteInfo.$tpl.find('#noteInfoCreatedTime');
NoteInfo.$noteInfoUpdatedTime = NoteInfo.$tpl.find('#noteInfoUpdatedTime');
NoteInfo.$noteInfoPostUrl = NoteInfo.$tpl.find('#noteInfoPostUrl');

NoteInfo.$noteInfoPostUrlTr = NoteInfo.$tpl.find('.post-url-tr');
NoteInfo.$postUrlWrap = NoteInfo.$tpl.find('.post-url-wrap'); 
NoteInfo.$input = NoteInfo.$tpl.find('input');

NoteInfo.$postUrlBase = NoteInfo.$tpl.find('.post-url-base');
NoteInfo.$postUrlText = NoteInfo.$tpl.find('.post-url-text');

NoteInfo.$noteInfo = $('#noteInfo');

NoteInfo.note = null;

NoteInfo.bind = function () {
    $('#noteInfoDropdown').click(function () {
        NoteInfo.render();
    });

    NoteInfo.$tpl.find('.post-url-pencil').click(function () {
        NoteInfo.$postUrlWrap.addClass('post-url-edit');
        NoteInfo.$input.val(decodeURI(NoteInfo.note.UrlTitle));
        NoteInfo.$input.focus();
    });
    NoteInfo.$input.keydown(function (e) {
        if(e.keyCode === 13) {
            NoteInfo.$input.blur();
        }
    });
    NoteInfo.$input.blur(function () {
        NoteInfo.$postUrlWrap.removeClass('post-url-edit');

        var val = NoteInfo.$input.val();
        if (!val) {
            return;
        }

        Net.ajaxPost("/member/blog/updateBlogUrlTitle", {noteId: NoteInfo.note.NoteId, urlTitle: val}, function(re) {
            if(reIsOk(re)) {
                var encodedUrl = encodeURI(re.Item);
                NoteInfo.note.UrlTitle = encodedUrl;
                NoteInfo.$postUrlText.text(decodeURI(NoteInfo.note.UrlTitle));
            } else {
                alert(re.Msg || "error");
            }
        });
    });

    // 当笔记Change时, 重新render
    LEA.on('noteChanged', function (note) {
        NoteInfo.render(note);
    });
};

NoteInfo.getPostUrl = function (note) {
            return '';
};

NoteInfo.rendered= false;
NoteInfo.render = function (note) {
    if (!note) {
        note = Cache.getCurNote();
    }
    if (!note) {
        return;
    }
    NoteInfo.note = note;

    NoteInfo.$noteInfoCreatedTime.html(goNowToDatetime(note.CreatedTime));
    NoteInfo.$noteInfoUpdatedTime.html(goNowToDatetime(note.UpdatedTime));

    if (!note.IsBlog) {
        NoteInfo.$noteInfoPostUrlTr.addClass('hide');
    }
    else {
        NoteInfo.$noteInfoPostUrlTr.removeClass('hide');

        // post-url
        NoteInfo.$postUrlBase.text(UserInfo.PostUrl + '/');
        NoteInfo.$postUrlText.text(decodeURI(note.UrlTitle));
    }

    if (!NoteInfo.rendered) {
        NoteInfo.$noteInfo.html(NoteInfo.$tpl);
        NoteInfo.rendered = true;
    }
};

NoteInfo.init = function () {
    this.bind();
}

NoteInfo.init();