/**
 * convert markdown to mindmap
 * copyright Chaofeng Wu
 */
Mindmap = {
    json: "",
    md:""
};
var LEAUI_MIND = {};
Mindmap.protocol = {
    LINE_ENDING_SPLITER :/\r\n|\r|\n/,
    EMPTY_LINE : '',
    NOTE_MARK_START : '<!--Note-->',
    NOTE_MARK_CLOSE : '<!--/Note-->',
    IMAGE_MARK_START : "\x3c!--Image--\x3e",
    IMAGE_MARK_CLOSE : "\x3c!--/Image--\x3e",
    lastPrefix :"",

    encode : function(json) {
        Mindmap.protocol.lastPrefix = "";
        return _build(json).join('\n');
    },

    _build : function(node) {
        var lines = [];
        var prefix = _getPrefix(node.data.prefix, lastPrefix)
        lines.push(prefix + " " + node.data.text + "\n");
    
        var note = node.data.note;
        if (note) {
            lines.push(Mindmap.protocol.EMPTY_LINE);
            lines.push(Mindmap.protocol.NOTE_MARK_START);
            lines.push(note);
            lines.push(Mindmap.protocol.NOTE_MARK_CLOSE);
            lines.push(Mindmap.protocol.EMPTY_LINE);
        }
        var image = node.data.image;
        if (image) {
            imageTitle = node.data.imageTitle;
            lines.push(Mindmap.protocol.EMPTY_LINE);
            lines.push(Mindmap.protocol.IMAGE_MARK_START);
            var imageSize = "\x3c!--" + JSON.stringify(node.data.imageSize) + "--\x3e" + "\n";
            lines.push(imageSize);
            var imageURL = "![" + imageTitle + "](" + image + ")" + "\n";
            lines.push(imageURL);
            lines.push(Mindmap.protocol.IMAGE_MARK_CLOSE);
            lines.push(Mindmap.protocol.EMPTY_LINE);
        }
    
        if (node.children) node.children.forEach(function(child) {
            Mindmap.protocol.lastPrefix = prefix;
            lines = lines.concat(_build(child));
        });
    
        return lines;
    },

    _build : function(node) {
        var lines = [];
        var prefix = Mindmap.protocol._getPrefix(node.data.prefix, Mindmap.protocol.lastPrefix)
        lines.push(prefix + " " + node.data.text + "\n");
    
        var note = node.data.note;
        if (note) {
            lines.push(Mindmap.protocol.EMPTY_LINE);
            lines.push(Mindmap.protocol.NOTE_MARK_START);
            lines.push(note);
            lines.push(Mindmap.protocol.NOTE_MARK_CLOSE);
            lines.push(Mindmap.protocol.EMPTY_LINE);
        }
        var image = node.data.image;
        if (image) {
            imageTitle = node.data.imageTitle;
            lines.push(Mindmap.protocol.EMPTY_LINE);
            lines.push(Mindmap.protocol.IMAGE_MARK_START);
            var imageSize = "\x3c!--" + JSON.stringify(node.data.imageSize) + "--\x3e" + "\n";
            lines.push(imageSize);
            var imageURL = "![" + imageTitle + "](" + image + ")" + "\n";
            lines.push(imageURL);
            lines.push(Mindmap.protocol.IMAGE_MARK_CLOSE);
            lines.push(Mindmap.protocol.EMPTY_LINE);
        }
    
        if (node.children) node.children.forEach(function(child) {
            Mindmap.protocol.lastPrefix = prefix;
            lines = lines.concat(_build(child));
        });
    
        return lines;
    },
    
    _getPrefix : function(curPrefix, lastPrefix){
        if(curPrefix) return curPrefix;
        if(!Mindmap.protocol.lastPrefix) return "#";
        if(/\*/.test(Mindmap.protocol.lastPrefix)){
            return "\t" + Mindmap.protocol.lastPrefix;
        }
        
        if(/#/.test(Mindmap.protocol.lastPrefix)){
            if(Mindmap.protocol.lastPrefix.length > 5){
                return "*";
            }else{
                return Mindmap.protocol.lastPrefix + "#";
            }
        }
    },
    
    decode : function (markdown) {
    
        var json, parentMap = {}, lines, line, lineInfo, level, node, parent, noteProgress, imageProgress, codeBlock;
    
        var imageUrl = "";
        // 一级标题转换 `{title}\n===` => `# {title}`
        markdown = markdown.replace(/^(.+)\n={3,}/, function($0, $1) {
            return '# ' + $1;
        });
    
        lines = markdown.split(Mindmap.protocol.LINE_ENDING_SPLITER);
    
        // 按行分析
        for (var i = 0; i < lines.length; i++) {
            line = lines[i];
    
            lineInfo = Mindmap.protocol._resolveLine(line);
    
            if ("* " === lineInfo.prefix || "- " === lineInfo.prefix) {
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
                if (node) Mindmap.protocol._pushNote(node, line);
                continue;
            }
    
            if (lineInfo.level > level + 1) {
                lineInfo.level = level + 1;
            }
    
            // 标题处理
            level = lineInfo.level;
            previousNodeLine = line;
            node = Mindmap.protocol._initNode(lineInfo.content, lineInfo.fullPrefix, parentMap[level - 1]);
            parentMap[level] = node;
        }
    
        Mindmap.protocol._cleanUp(parentMap[1]);
        return parentMap[1];
    },
    
    _initNode : function(text, prefix, parent) {
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
    },
    
    _pushNote : function(node, line) {
        node.data.note += line + '\n';
    },
    
    _resolveLine : function(line) {
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
                    noteStart: line == Mindmap.protocol.NOTE_MARK_START,
                    noteClose: line == Mindmap.protocol.NOTE_MARK_CLOSE,
                    imageStart: line == Mindmap.protocol.IMAGE_MARK_START,
                    imageClose: line == Mindmap.protocol.IMAGE_MARK_CLOSE,
                    codeBlock: /^\s*```/.test(line)
                };
            }
        }
    },
    
    _cleanUp : function(node) {
        if (!/\S/.test(node.data.note)) {
            node.data.note = null;
            delete node.data.note;
        } else {
            var notes = node.data.note.split('\n');
            while (notes.length && !/\S/.test(notes[0])) notes.shift();
            while (notes.length && !/\S/.test(notes[notes.length - 1])) notes.pop();
            node.data.note = notes.join('\n');
        }
        if (node.children) node.children.forEach(Mindmap.protocol._cleanUp);
    },
};

Mindmap.convertMarkdownToJson = function(){
    var content = Cache.getCurNote().Content;
    var json = Mindmap.protocol.decode(content);
    LEAUI_MIND.json = json;
    LEAUI_MIND.md = true;
}

Mindmap.convertJsonToMarkdown = function(){
    if (typeof km === "undefined") return;
    var json = km.exportJson();
    var markdown = encode(json);
    Editor.setContent(markdown,true);
}

Mindmap.convertMarkdowmToMindmap = function(){
    Mindmap.convertMarkdownToJson();
    Mindmap.showDialog();
}

Mindmap.renderNoteChangeToMindmap = function(){
    var content = Editor.getCurEditorContent();
    var json = decode(content);
    km.importJson(json);
}

Mindmap.showDialog = function() {
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
}