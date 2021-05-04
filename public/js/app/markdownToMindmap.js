/**
 * convert markdown to mindmap
 * copyright Chaofeng Wu
 */

var LEAUI_MIND = {};
var markdownProtocol = {};

markdownProtocol.LINE_ENDING_SPLITER = /\r\n|\r|\n/;
markdownProtocol.EMPTY_LINE = '';
markdownProtocol.NOTE_MARK_START = '<!--Note-->';
markdownProtocol.NOTE_MARK_CLOSE = '<!--/Note-->';
markdownProtocol.IMAGE_MARK_START = "\x3c!--Image--\x3e";
markdownProtocol.IMAGE_MARK_CLOSE = "\x3c!--/Image--\x3e";
markdownProtocol.lastPrefix = "";

markdownProtocol.encode = function(json) {
    markdownProtocol.lastPrefix = "";
    return markdownProtocol._build(json).join('\n');
}

markdownProtocol._build = function(node) {
    var lines = [];
    var prefix = markdownProtocol._getPrefix(node.data.prefix, markdownProtocol.lastPrefix)
    lines.push(prefix + " " + node.data.text + "\n");

    var note = node.data.note;
    if (note) {
        lines.push(markdownProtocol.EMPTY_LINE);
        lines.push(markdownProtocol.NOTE_MARK_START);
        lines.push(note);
        lines.push(markdownProtocol.NOTE_MARK_CLOSE);
        lines.push(markdownProtocol.EMPTY_LINE);
    }
    var image = node.data.image;
    if (image) {
        imageTitle = node.data.imageTitle;
        lines.push(markdownProtocol.EMPTY_LINE);
        lines.push(markdownProtocol.IMAGE_MARK_START);
        var imageSize = "\x3c!--" + JSON.stringify(node.data.imageSize) + "--\x3e" + "\n";
        lines.push(imageSize);
        var imageURL = "![" + imageTitle + "](" + image + ")" + "\n";
        lines.push(imageURL);
        lines.push(markdownProtocol.IMAGE_MARK_CLOSE);
        lines.push(markdownProtocol.EMPTY_LINE);
    }

    if (node.children) node.children.forEach(function(child) {
        markdownProtocol.lastPrefix = prefix;
        lines = lines.concat(markdownProtocol._build(child));
    });

    return lines;
}

markdownProtocol._getPrefix = function(curPrefix, lastPrefix){
    if(curPrefix) return curPrefix;
    if(!lastPrefix) return "#";
    if(/\*/.test(lastPrefix)){
        return "\t" + lastPrefix;
    }
    
    if(/#/.test(lastPrefix)){
        if(lastPrefix.length > 5){
            return "*";
        }else{
            return lastPrefix + "#";
        }
    }
}

markdownProtocol.decode = function (markdown) {

    var json, parentMap = {}, lines, line, lineInfo, level, node, parent, noteProgress, imageProgress, codeBlock;

    var imageUrl = "";
    // 一级标题转换 `{title}\n===` => `# {title}`
    markdown = markdown.replace(/^(.+)\n={3,}/, function($0, $1) {
        return '# ' + $1;
    });

    lines = markdown.split(markdownProtocol.LINE_ENDING_SPLITER);

    // 按行分析
    for (var i = 0; i < lines.length; i++) {
        line = lines[i];

        lineInfo = markdownProtocol._resolveLine(line);

        if ("*" === lineInfo.prefix || "-" === lineInfo.prefix) {
            if (0 === i){
                lineInfo.level = 1;
            } else {
                var previousLineMatch = /^([\t ]*)(\*|\-)\s+(.*)$/.exec(previousNodeLine);
                if (!previousLineMatch) {
                    lineInfo.level = level + 1;
                }else{
                    var currentLineMatch = /^([\t ]*)(\*|\-)\s+(.*)$/.exec(line);
                    var previousPrefixLength = previousLineMatch[1].length;
                    var currentPrefixLength = currentLineMatch[1].length;
                    if (previousPrefixLength === currentPrefixLength) {
                        lineInfo.level = level;
                    } else if(previousPrefixLength > currentPrefixLength){
                        lineInfo.level = level - 1;
                    }else{
                        lineInfo.level = level + 1;
                    }
                }
            }
        }

        var image = "";
        var imageTitle = "";
        if (imageProgress) {
            if (lineInfo.imageClose) {
                var match = /\!\[(.*)\]\((.+)\)/.exec(imageUrl);
                if (match) {
                    imageTitle = match[1];
                    image = match[2];
                    node.data.image = image;
                    node.data.imageTitle = imageTitle;
                    imageUrl = "";
                }
                var match = /\<!--(.+\}$)-->/.exec(imageUrl);
                if(match){
                    node.data.imageSize = JSON.parse(match[1]);
                }else{
                    node.data.imageSize = {
                        width: 200,
                        height: 200
                    };
                }
                imageProgress = false;
            }else{
                imageUrl += line;
            }
            continue;
        } else if (lineInfo.imageStart) {
            imageProgress = true;
            continue;
        }

        // 备注标记处理
        if (lineInfo.noteClose) {
            noteProgress = false;
            continue;
        } else if (lineInfo.noteStart) {
            noteProgress = true;
            continue;
        }

        // 代码块处理
        codeBlock = lineInfo.codeBlock ? !codeBlock : codeBlock;

        // 备注条件：备注标签中，非标题定义，或标题越位
        if (noteProgress || codeBlock || !lineInfo.level) {
            if (node) markdownProtocol._pushNote(node, line);
            continue;
        }

        if (lineInfo.level > level + 1) {
            lineInfo.level = level + 1;
        }

        // 标题处理
        level = lineInfo.level;
        previousNodeLine = line;
        node = markdownProtocol._initNode(lineInfo.content, lineInfo.fullPrefix, parentMap[level - 1]);
        parentMap[level] = node;
    }

    markdownProtocol._cleanUp(parentMap[1]);
    return parentMap[1];
}

markdownProtocol._initNode = function(text, prefix, parent) {
    var node = {
        data: {
            text: text,
            note: "",
            prefix: prefix
        }
    };
    if (parent) {
        if (parent.children) parent.children.push(node);
        else parent.children = [node];
    }
    return node;
}

markdownProtocol._pushNote = function(node, line) {
    node.data.note += line + '\n';
}

markdownProtocol._resolveLine = function(line) {
    if ("#" === line[0]) {
        var match = /^(#+)?\s*(.*)$/.exec(line);
        return {
            level: match[1] && match[1].length || null,
            prefix: match[1],
            fullPrefix: match[1],
            content: match[2],
        };
    } else {
        var match = /^([\t ]*(\*|\-))\s+(.*)$/.exec(line);
        if (match){
            return {
                level: 0,
                prefix: match[2],
                fullPrefix: match[1],
                content: match[3],
            };
        }else{
            return {
                level: null,
                prefix: null,
                content: null,
                noteStart: line == markdownProtocol.NOTE_MARK_START,
                noteClose: line == markdownProtocol.NOTE_MARK_CLOSE,
                imageStart: line == markdownProtocol.IMAGE_MARK_START,
                imageClose: line == markdownProtocol.IMAGE_MARK_CLOSE,
                codeBlock: /^\s*```/.test(line)
            };
        }
    }
}

markdownProtocol._cleanUp = function(node) {
    if (!/\S/.test(node.data.note)) {
        node.data.note = null;
        delete node.data.note;
    } else {
        var notes = node.data.note.split('\n');
        while (notes.length && !/\S/.test(notes[0])) notes.shift();
        while (notes.length && !/\S/.test(notes[notes.length - 1])) notes.pop();
        node.data.note = notes.join('\n');
    }
    if (node.children) node.children.forEach(markdownProtocol._cleanUp);
}

markdownProtocol.convertNoteToJson = function(){
    var content = Note.getCurNote().Content;
    var json;
    if (content.length > 1) {
        json = markdownProtocol.decode(content);
    }
    LEAUI_MIND.json = json;
    LEAUI_MIND.md = true;
}

$("#minmap").click(function() {
    markdownProtocol.convertNoteToJson();
    showDialog();
    $(this).css("pointer-events", "none");
});

markdownProtocol.convertJsonToNote = function(){
    if (typeof km === "undefined") return;
    var json = km.exportJson();
    var markdown = markdownProtocol.encode(json);
    Note.saveChangeInMindmap(markdown);
}

markdownProtocol.renderNoteChangeToMindmap = function(){
    var content = Note.getCurEditorContent();
    var json = markdownProtocol.decode(content);
    km.importJson(json);
}

function showDialog() {
    function GetTheHtml(){
        var lang = "zh-cn";
        var url = '/js/libs-modified/tinymce/plugins/leaui_mindmap/mindmap/index.html?i=1';
        var html = '<iframe id="leauiMindMapIfr" src="'+ url + '?' + new Date().getTime() + '&lang=' + lang + '" frameborder="0" style="width: 100%; height: 100%;"></iframe>';
        return html;
    }
    var w = window.innerWidth * 0.9;
    var h = window.innerHeight * 0.8;
    jsPanel.ziBase = 600;
    jsPanel.create({
        theme: 'primary',
        headerTitle: 'Mind Map',
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
        position: 'center 50 50',
        onbeforeclose: function(panel, closedByUser) {
            markdownProtocol.convertJsonToNote();
            return true;
        },
        onbeforeminimize: function(panel, closedByUser) {
            markdownProtocol.convertJsonToNote();
            return true;
        },
        onbeforesmallify: function(panel, closedByUser) {
            markdownProtocol.convertJsonToNote();
            return true;
        },
        onbeforenormalize: function(panel, closedByUser) {
            markdownProtocol.renderNoteChangeToMindmap();
            return true;
        },
        onbeforeunsmallify: function(panel, closedByUser) {
            markdownProtocol.renderNoteChangeToMindmap();
            return true;
        },
        onbeforemaximize: function(panel, closedByUser) {
            markdownProtocol.renderNoteChangeToMindmap();
            return true;
        },
        onclosed: function(panel, closedByUser) {
            $("#minmap").css("pointer-events", "auto");
        }
    });
}