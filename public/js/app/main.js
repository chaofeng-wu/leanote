/*
 * @Author: Ethan Wu
 * @Date: 2021-06-26 15:00:01
 * @LastEditTime: 2021-06-27 15:49:57
 * @FilePath: /leanote/public/js/app/main.js
 */

/*
用来做页面初始化的，整理一下整个note的逻辑
*/
function init(){
    //对Notebook进行渲染
    Notebook.renderNotebooks(notebooks);

    //缓存当前Notebook下的所有notes
    Cache.initCachedNote(notes);

    //渲染笔记列表
    NoteList.renderNotes(notes);

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
}

