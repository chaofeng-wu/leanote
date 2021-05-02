

define('constants',[], function() {
    var constants = {};
    constants.EDITOR_DEFAULT_PADDING = 5;
    constants.fontSize = 14;
    constants.fontFamily = "Menlo, 'Ubuntu Mono', Consolas, 'Courier New',  'Hiragino Sans GB', 'WenQuanYi Micro Hei', 'Microsoft Yahei', sans-serif;";
    return constants;
});

define('utils',[
    "underscore",
    "crel",
    "xregexp",
    // "stacktrace",
    // "FileSaver",
], function(_, crel, XRegExp) {

    var utils = {};

    // Return a parameter from the URL
    utils.getURLParameter = function(name) {
        // Parameter can be either a search parameter (&name=...) or a hash fragment parameter (#!name=...)
        var regex = new RegExp("(?:\\?|\\#\\!|&)" + name + "=(.+?)(?:&|\\#|$)");
        try {
            return decodeURIComponent(regex.exec(location.search + location.hash)[1]);
        }
        catch(e) {
            return undefined;
        }
    };

    // Transform a selector into a jQuery object
    function jqElt(element) {
        if(_.isString(element)) {
            return $(element);
        }
        return element;
    }

    // For input control
    function inputError(element, event) {
        if(event !== undefined) {
            element.stop(true, true).addClass("error").delay(1000).switchClass("error");
            event.stopPropagation();
        }
    }

    // Return input value
    utils.getInputValue = function(element) {
        element = jqElt(element);
        return element.val();
    };

    // Set input value
    utils.setInputValue = function(element, value) {
        element = jqElt(element);
        element.val(value);
    };

    // Return input text value
    utils.getInputTextValue = function(element, event, validationRegex) {
        element = jqElt(element);
        var value = element.val();
        if(value === undefined) {
            inputError(element, event);
            return undefined;
        }
        // trim
        value = utils.trim(value);
        if((value.length === 0) || (validationRegex !== undefined && !value.match(validationRegex))) {
            inputError(element, event);
            return undefined;
        }
        return value;
    };

    // Return input integer value
    utils.getInputIntValue = function(element, event, min, max) {
        element = jqElt(element);
        var value = utils.getInputTextValue(element, event);
        if(value === undefined) {
            return undefined;
        }
        value = parseInt(value, 10);
        if(isNaN(value) || (min !== undefined && value < min) || (max !== undefined && value > max)) {
            inputError(element, event);
            return undefined;
        }
        return value;
    };

    // Return input value and check that it's a valid RegExp
    utils.getInputRegExpValue = function(element, event) {
        element = jqElt(element);
        var value = utils.getInputTextValue(element, event);
        if(value === undefined) {
            return undefined;
        }
        try {
            new RegExp(value);
        }
        catch(e) {
            inputError(element, event);
            return undefined;
        }
        return value;
    };

    // Return input value and check that it's a valid JavaScript object
    utils.getInputJsValue = function(element, event) {
        element = jqElt(element);
        var value = utils.getInputTextValue(element, event);
        if(value === undefined) {
            return undefined;
        }
        try {
            /*jshint evil:true */
            eval("var test=" + value);
            /*jshint evil:false */
        }
        catch(e) {
            inputError(element, event);
            return undefined;
        }
        return value;
    };

    // Return checkbox boolean value
    utils.getInputChecked = function(element) {
        element = jqElt(element);
        return element.prop("checked");
    };

    // Set checkbox state
    utils.setInputChecked = function(element, checked) {
        element = jqElt(element);
        element.prop("checked", checked).change();
    };

    // Get radio button value
    utils.getInputRadio = function(name) {
        return $("input:radio[name=" + name + "]:checked").prop("value");
    };

    // Set radio button value
    utils.setInputRadio = function(name, value) {
        $("input:radio[name=" + name + "][value=" + value + "]").prop("checked", true).change();
    };

    // Reset input control in all modals
    utils.resetModalInputs = function() {
        $(".modal input[type=text]:not([disabled]), .modal input[type=password], .modal textarea").val("");
        $(".modal input[type=checkbox]").prop("checked", false).change();
    };

    // Basic trim function
    utils.trim = function(str) {
        return $.trim(str);
    };

    // Slug function
    var nonWordChars = XRegExp('[^\\p{L}\\p{N}-]', 'g');
    utils.slugify = function(text) {
        return text.toLowerCase().replace(/\s/g, '-') // Replace spaces with -
        .replace(nonWordChars, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
    };

    // Check an URL
    utils.checkUrl = function(url, addSlash) {
        if(!url) {
            return url;
        }
        if(url.indexOf("http") !== 0) {
            url = "http://" + url;
        }
        if(addSlash && url.indexOf("/", url.length - 1) === -1) {
            url += "/";
        }
        return url;
    };

    
    utils.randomString = function() {
        return _.random(4294967296).toString(36);
    };

    // Time shared by others modules
    utils.updateCurrentTime = function() {
        utils.currentTime = new Date().getTime();
    };
    utils.updateCurrentTime();

    // Serialize sync/publish attributes and store it in the storage
    utils.storeAttributes = function(attributes) {
    };

    // Retrieve/parse an index array from storage
    utils.retrieveIndexArray = function(storeIndex) {
    };

    // Append an index to an array in storage
    utils.appendIndexToArray = function(storeIndex, index) {
    };

    // Remove an index from an array in storage
    utils.removeIndexFromArray = function(storeIndex, index) {
    };

    // Retrieve/parse an object from storage. Returns undefined if error.
    utils.retrieveIgnoreError = function(storeIndex) {
    };

    var eventList = [];
    utils.logValue = function(value) {
    };
    utils.logStackTrace = function() {
    };
    utils.formatEventList = function() {
        var result = [];
        _.each(eventList, function(event) {
            result.push("\n");
            if(_.isString(event)) {
                result.push(event);
            }
            else if(_.isArray(event)) {
                result.push(event[5] || "");
                result.push(event[6] || "");
            }
        });
        return result.join("");
    };

    return utils;
});

define('classes/Extension',[],function() {
    
    function Extension(extensionId, extensionName, isOptional, disableInViewer, disableInLight) {
        this.extensionId = extensionId;
        this.extensionName = extensionName;
        this.isOptional = isOptional;
        this.disableInViewer = disableInViewer;
        this.disableInLight = disableInLight;
    }
    
    return Extension;
});
define('settings',[
], function () {
    var settings = {
        layoutOrientation: "horizontal",
        lazyRendering: true,
        editorFontFamily: 'Menlo, Consolas, "Courier New", Courier, monospace',
        editorFontSize: 13,
        shortcuts: {},
        extensionSettings: {}
    };
    return settings;
});

/*globals Markdown */
define('extensions/markdownExtra',[
    "underscore",
    "utils",
    "classes/Extension",
    'google-code-prettify',
    // 'highlightjs',
    'pagedown-extra',
], function(_, utils, Extension, prettify) {

    var markdownExtra = new Extension("markdownExtra", "Markdown Extra", true);
    markdownExtra.defaultConfig = {
        extensions: [
            "fenced_code_gfm",
            "tables",
            "def_list",
            "attr_list",
            "footnotes",
            // smartypants不要, 因为它把'和"转成了中文引号, --转成了一个–
            // "smartypants", // https://daringfireball.net/projects/smartypants/
            /*s
            SmartyPants is a free web publishing plug-in for Movable Type, Blosxom, and BBEdit that easily translates plain ASCII punctuation characters into “smart” typographic punctuation HTML entities.
SmartyPants can perform the following transformations:

Straight quotes ( " and ' ) into “curly” quote HTML entities
Backticks-style quotes (``like this'') into “curly” quote HTML entities
Dashes (“--” and “---”) into en- and em-dash entities
Three consecutive dots (“...”) into an ellipsis entity
This means you can write, edit, and save your posts using plain old ASCII straight quotes, plain dashes, and plain dots, but your published posts (and final HTML output) will appear with smart quotes, em-dashes, and proper ellipses.

SmartyPants is a combination plug-in — a single plug-in file that works with Movable Type, Blosxom, and BBEdit. It can also be used from a Unix-style command-line.

SmartyPants does not modify characters within <pre>, <code>, <kbd>, or <script> tag blocks. Typically, these tags are used to display text where smart quotes and other “smart punctuation” would not be appropriate, such as source code or example markup.
             */
            "strikethrough",
            "newlines",
        ],
        intraword: true,
        comments: true,
        highlighter: "prettify"
    };

    var eventMgr;
    markdownExtra.onEventMgrCreated = function(eventMgrParameter) {
        eventMgr = eventMgrParameter;
    };

    function onToggleMode(editor) {
        // 不能加linenums, 加了后, uml不能显示
        // 但是, 有人说没有行号了, 很不好
        // 怎么办
        editor.hooks.chain("onPreviewRefresh", function () {
            $('#preview-contents pre code').each(function () {
                var classes = $(this).attr('class');
                if (classes != 'language-flow' && classes != 'language-sequence') {
                    $(this).parent().addClass('prettyprint linenums'); 
                }
            });
            prettify.prettyPrint();
        });
    }

    markdownExtra.onToggleMode = onToggleMode;

    markdownExtra.onPagedownConfigure = function(editor) {
        var converter = editor.getConverter();
        if(markdownExtra.config.intraword === true) {
            var converterOptions = {
                _DoItalicsAndBold: function(text) {
                    text = text.replace(/([^\w*]|^)(\*\*|__)(?=\S)(.+?[*_]*)(?=\S)\2(?=[^\w*]|$)/g, "$1<strong>$3</strong>");
                    text = text.replace(/([^\w*]|^)(\*|_)(?=\S)(.+?)(?=\S)\2(?=[^\w*]|$)/g, "$1<em>$3</em>");
                    return text;
                }
            };
            converter.setOptions(converterOptions);
        }
        if(markdownExtra.config.comments === true) {
            converter.hooks.chain("postConversion", function(text) {
                return text.replace(/<!--.*?-->/g, function(wholeMatch) {
                    return wholeMatch.replace(/^<!---(.+?)-?-->$/, ' <span class="comment label label-danger">$1</span> ');
                });
            });
        }
        
        var extraOptions = {
            extensions: markdownExtra.config.extensions
        };
      
        extraOptions.highlighter = "prettify";
        
        onToggleMode(editor);

        Markdown.Extra.init(converter, extraOptions);
    };

    return markdownExtra;
});
define('libs/mathjax_init',[
    "settings", "underscore",
], function(settings/*, mathjaxConfigJS*/) {
    var script = document.createElement('script');
    script.type = 'text/x-mathjax-config';
    var mathjaxConfigJS = 'MathJax.Hub.Config({\n\tskipStartupTypeset: true,\n    "HTML-CSS": {\n        preferredFont: "TeX",\n        availableFonts: [\n            "STIX",\n            "TeX"\n        ],\n        linebreaks: {\n            automatic: true\n        },\n        EqnChunk: 10,\n        imageFont: null\n    },\n    tex2jax: <%= tex2jax || \'{ inlineMath: [["$","$"],["\\\\\\\\\\\\\\\\(","\\\\\\\\\\\\\\\\)"]], displayMath: [["$$","$$"],["\\\\\\\\[","\\\\\\\\]"]], processEscapes: true }\' %>,\n    TeX: $.extend({\n        noUndefined: {\n            attributes: {\n                mathcolor: "red",\n                mathbackground: "#FFEEEE",\n                mathsize: "90%"\n            }\n        },\n        Safe: {\n            allow: {\n                URLs: "safe",\n                classes: "safe",\n                cssIDs: "safe",\n                styles: "safe",\n                fontsize: "all"\n            }\n        }\n    }, <%= tex %>),\n    messageStyle: "none"\n});\n';
    script.innerHTML = _.template(mathjaxConfigJS, {
        tex: settings.extensionSettings.mathJax ? settings.extensionSettings.mathJax.tex : 'undefined',
        tex2jax: settings.extensionSettings.mathJax ? settings.extensionSettings.mathJax.tex2jax : undefined
    });
    document.getElementsByTagName('head')[0].appendChild(script);
});
/*defines MathJax */
define('extensions/mathJax',[
    "utils",
    "classes/Extension",
    "mathjax",
], function(utils, Extension) {
	
	var mathJax = new Extension("mathJax", "MathJax", true);
    mathJax.defaultConfig = {
        tex: "{}",
        tex2jax: '{ inlineMath: [["$","$"],["\\\\\\\\(","\\\\\\\\)"]], displayMath: [["$$","$$"],["\\\\[","\\\\]"]], processEscapes: true }'
    };
    
    /*jshint ignore:start */
    mathJax.onPagedownConfigure = function(editorObject) {
        t = document.getElementById("preview-contents");

        var converter = editorObject.getConverter();
        converter.hooks.chain("preConversion", p);
        converter.hooks.chain("postConversion", d);
    };
    
    var afterRefreshCallback;
    mathJax.onAsyncPreview = function(callback) {
        afterRefreshCallback = callback;
        j();
    };
    
    // From math.stackexchange.com...

    function b(a, f, b) {
        var c = k.slice(a, f + 1).join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        for (h.Browser.isMSIE && (c = c.replace(/(%[^\n]*)\n/g, "$1<br/>\n")); f > a; )
            k[f] = "", f--;
        k[a] = "@@" + m.length + "@@";
        b && (c = b(c));
        m.push(c);
        i = o = l = null
    }
    function p(a) {
        i = o = l = null;
        m = [];
        var f;
        /`/.test(a) ? (a = a.replace(/~/g, "~T").replace(/(^|[^\\])(`+)([^\n]*?[^`\n])\2(?!`)/gm, function(a) {
            return a.replace(/\$/g, "~D")
        }), f = function(a) {
            return a.replace(/~([TD])/g, 
            function(a, c) {
                return {T: "~",D: "$"}[c]
            })
        }) : f = function(a) {
            return a
        };
        k = r(a.replace(/\r\n?/g, "\n"), u);
        for (var a = 1, d = k.length; a < d; a += 2) {
            var c = k[a];
            "@" === c.charAt(0) ? (k[a] = "@@" + m.length + "@@", m.push(c)) : i ? c === o ? n ? l = a : b(i, a, f) : c.match(/\n.*\n/) ? (l && (a = l, b(i, a, f)), i = o = l = null, n = 0) : "{" === c ? n++ : "}" === c && n && n-- : c === s || "$$" === c ? (i = a, o = c, n = 0) : "begin" === c.substr(1, 5) && (i = a, o = "\\end" + c.substr(6), n = 0)
        }
        l && b(i, l, f);
        return f(k.join(""))
    }
    function d(a) {
        a = a.replace(/@@(\d+)@@/g, function(a, b) {
            return m[b]
        });
        m = null;
        return a
    }
    function e() {
        q = !1;
        h.cancelTypeset = !1;
        h.Queue(["Typeset", h, t])
        h.Queue(afterRefreshCallback); //benweet
    }
    function j() {
        !q && /*benweet (we need to call our afterRefreshCallback) g &&*/ (q = !0, h.Cancel(), h.Queue(e))
    }
    var g = !1, q = !1, t = null, s = "$", k, i, o, l, n, m, h = MathJax.Hub;
    h.Queue(function() {
        g = !0;
        h.processUpdateTime = 50;
        h.Config({"HTML-CSS": {EqnChunk: 10,EqnChunkFactor: 1},SVG: {EqnChunk: 10,EqnChunkFactor: 1}})
    });
    var u = /(\$\$?|\\(?:begin|end)\{[a-z]*\*?\}|\\[\\{}$]|[{}]|(?:\n\s*)+|@@\d+@@)/i, r;
    r = 3 === "aba".split(/(b)/).length ? function(a, f) {
        return a.split(f)
    } : function(a, f) {
        var b = [], c;
        if (!f.global) {
            c = f.toString();
            var d = "";
            c = c.replace(/^\/(.*)\/([im]*)$/, function(a, c, b) {
                d = b;
                return c
            });
            f = RegExp(c, d + "g")
        }
        for (var e = f.lastIndex = 0; c = f.exec(a); )
            b.push(a.substring(e, c.index)), b.push.apply(b, c.slice(1)), e = c.index + c[0].length;
        b.push(a.substring(e));
        return b
    };
    
    (function() {
        var b = MathJax.Hub;
        if (!b.Cancel) {
            b.cancelTypeset = !1;
            b.Register.StartupHook("HTML-CSS Jax Config", function() {
                var d = MathJax.OutputJax["HTML-CSS"], e = d.Translate;
                d.Augment({Translate: function(j, g) {
                        if (b.cancelTypeset || g.cancelled)
                            throw Error("MathJax Canceled");
                        return e.call(d, j, g)
                    }})
            });
            b.Register.StartupHook("SVG Jax Config", function() {
                var d = MathJax.OutputJax.SVG, e = d.Translate;
                d.Augment({Translate: function(j, g) {
                        if (b.cancelTypeset || g.cancelled)
                            throw Error("MathJax Canceled");
                        return e.call(d, 
                        j, g)
                    }})
            });
            b.Register.StartupHook("TeX Jax Config", function() {
                var d = MathJax.InputJax.TeX, e = d.Translate;
                d.Augment({Translate: function(j, g) {
                        if (b.cancelTypeset || g.cancelled)
                            throw Error("MathJax Canceled");
                        return e.call(d, j, g)
                    }})
            });
            var p = b.processError;
            b.processError = function(d, e, j) {
                if ("MathJax Canceled" !== d.message)
                    return p.call(b, d, e, j);
                MathJax.Message.Clear(0, 0);
                e.jaxIDs = [];
                e.jax = {};
                e.scripts = [];
                e.i = e.j = 0;
                e.cancelled = !0;
                return null
            };
            b.Cancel = function() {
                this.cancelTypeset = !0
            }
        }
    })();
    /*jshint ignore:end */

	return mathJax;
});
define('extensions/markdownSectionParser',[
    "underscore",
    "extensions/markdownExtra",
    "extensions/mathJax",
    "classes/Extension",
], function(_, markdownExtra, mathJax, Extension) {

    var markdownSectionParser = new Extension("markdownSectionParser", "Markdown section parser");

    var eventMgr;
    markdownSectionParser.onEventMgrCreated = function(eventMgrParameter) {
        eventMgr = eventMgrParameter;
    };

    markdownSectionParser.onPagedownConfigure = function(editor) {
        
        // Build a regexp to look for section delimiters
        var regexp = '^.+[ \\t]*\\n=+[ \\t]*\\n+|^.+[ \\t]*\\n-+[ \\t]*\\n+|^\\#{1,6}[ \\t]*.+?[ \\t]*\\#*\\n+'; // Title delimiters
        if(markdownExtra.enabled) {
            if(_.some(markdownExtra.config.extensions, function(extension) {
                return extension == "fenced_code_gfm";
            })) {
                regexp = '^```.*\\n[\\s\\S]*?\\n```|' + regexp; // Fenced block delimiters
            }
        }

        // TODO 代码```
        // regexp = '^```$|' + regexp;

        if(mathJax.enabled) {
            // Math delimiter has to follow 1 empty line to be considered as a section delimiter
            regexp = '^[ \\t]*\\n\\$\\$[\\s\\S]*?\\$\\$|' + regexp; // $$ math block delimiters
            regexp = '^[ \\t]*\\n\\\\\\\\[[\\s\\S]*?\\\\\\\\]|' + regexp; // \\[ \\] math block delimiters
            regexp = '^[ \\t]*\\n\\\\?\\\\begin\\{[a-z]*\\*?\\}[\\s\\S]*?\\\\end\\{[a-z]*\\*?\\}|' + regexp; // \\begin{...} \\end{...} math block delimiters
        }
        regexp = new RegExp(regexp, 'gm');
        
        var converter = editor.getConverter();
        converter.hooks.chain("preConversion", function(text) {
            // console.log('preConversion');
            // console.log(text);
            eventMgr.previewStartTime = new Date();
            var tmpText = text + "\n\n";
            function addSection(startOffset, endOffset) {
                var sectionText = tmpText.substring(offset, endOffset);
                sectionList.push({
                    text: sectionText,
                    textWithDelimiter: '\n<div class="se-section-delimiter"></div>\n\n' + sectionText + '\n'
                });
            }
            var sectionList = [], offset = 0;
            // Look for delimiters
            tmpText.replace(regexp, function(match, matchOffset) {
                // Create a new section with the text preceding the delimiter
                addSection(offset, matchOffset);
                offset = matchOffset;
            });
            // Last section
            addSection(offset, text.length);
            eventMgr.onSectionsCreated(sectionList);
            return _.reduce(sectionList, function(result, section) {
                return result + section.textWithDelimiter;
            }, '');
        });
    };

    return markdownSectionParser;
});
define('extensions/partialRendering',[
    "underscore",
    "crel",
    "extensions/markdownExtra",
    "classes/Extension"
], function(_, crel, markdownExtra, Extension, partialRenderingSettingsBlockHTML) {

    var partialRendering = new Extension("partialRendering", "Partial Rendering", true);

    var converter;
    var sectionCounter = 0;
    var sectionList = [];
    var linkDefinition;
    var sectionsToRemove = [];
    var modifiedSections = [];
    var insertBeforeSection;
    var fileChanged = false;
    function updateSectionList(newSectionList, newLinkDefinition) {
        modifiedSections = [];
        sectionsToRemove = [];
        insertBeforeSection = undefined;

        // Render everything if file or linkDefinition changed
        if(fileChanged === true || linkDefinition != newLinkDefinition) {
            fileChanged = false;
            linkDefinition = newLinkDefinition;
            sectionsToRemove = sectionList;
            sectionList = newSectionList;
            modifiedSections = newSectionList;
            return;
        }

        // Find modified section starting from top
        var leftIndex = sectionList.length;
        _.some(sectionList, function(section, index) {
            if(index >= newSectionList.length || section.text != newSectionList[index].text) {
                leftIndex = index;
                return true;
            }
        });
        
        // Find modified section starting from bottom
        var rightIndex = -sectionList.length;
        _.some(sectionList.slice().reverse(), function(section, index) {
            if(index >= newSectionList.length || section.text != newSectionList[newSectionList.length - index - 1].text) {
                rightIndex = -index;
                return true;
            }
        });
        
        if(leftIndex - rightIndex > sectionList.length) {
            // Prevent overlap
            rightIndex = leftIndex - sectionList.length;
        }

        // Create an array composed of left unmodified, modified, right
        // unmodified sections
        var leftSections = sectionList.slice(0, leftIndex);
        modifiedSections = newSectionList.slice(leftIndex, newSectionList.length + rightIndex);
        var rightSections = sectionList.slice(sectionList.length + rightIndex, sectionList.length);
        insertBeforeSection = _.first(rightSections);
        sectionsToRemove = sectionList.slice(leftIndex, sectionList.length + rightIndex);
        sectionList = leftSections.concat(modifiedSections).concat(rightSections);
    }
    
    var doFootnotes = false;
    var hasFootnotes = false;
    partialRendering.onSectionsCreated = function(sectionListParam) {

        var newSectionList = [];
        var newLinkDefinition = '\n';
        hasFootnotes = false;
        _.each(sectionListParam, function(section) {
            var text = section.textWithDelimiter + '\n';

            // Strip footnotes
            if(doFootnotes) {
                text = text.replace(/^```.*\n[\s\S]*?\n```|\n[ ]{0,3}\[\^(.+?)\]\:[ \t]*\n?([\s\S]*?)\n{1,2}((?=\n[ ]{0,3}\S)|$)/gm, function(wholeMatch, footnote) {
                    if(footnote) {
                        hasFootnotes = true;
                        newLinkDefinition += wholeMatch.replace(/^\s*\n/gm, '') + '\n';
                        return "";
                    }
                    return wholeMatch;
                });
            }

            // Strip link definitions
            text = text.replace(/^```.*\n[\s\S]*?\n```|^[ ]{0,3}\[(.+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?(?=\s|$)[ \t]*\n?[ \t]*((\n*)["(](.+?)[")][ \t]*)?(?:\n+)/gm, function(wholeMatch, link) {
                if(link) {
                    newLinkDefinition += wholeMatch.replace(/^\s*\n/gm, '') + '\n';
                    return "";
                }
                return wholeMatch;
            });

            // Add section to the newSectionList
            newSectionList.push({
                id: ++sectionCounter,
                text: text + '\n'
            });
        });

        updateSectionList(newSectionList, newLinkDefinition);
    };

    var footnoteMap = {};
    // Store one footnote elt in the footnote map
    function storeFootnote(footnoteElt) {
        var id = footnoteElt.id.substring(3);
        footnoteMap[id] = footnoteElt;
    }
    
    var footnoteContainerElt;
    var previewContentsElt;
    function refreshSections() {

        // Remove outdated sections
        _.each(sectionsToRemove, function(section) {
            var sectionElt = document.getElementById("wmd-preview-section-" + section.id);
            previewContentsElt.removeChild(sectionElt);
        });
        
        var wmdPreviewElt = document.getElementById("wmd-preview");
        var childNode = wmdPreviewElt.firstChild;
        function createSectionElt(section) {
            var sectionElt = crel('div', {
                id: 'wmd-preview-section-' + section.id,
                class: 'wmd-preview-section preview-content'
            });
            var isNextDelimiter = false;
            while (childNode) {
                var nextNode = childNode.nextSibling;
                if(isNextDelimiter === true && childNode.tagName == 'DIV' && childNode.className == 'se-section-delimiter') {
                    // Stop when encountered the next delimiter
                    break;
                }
                isNextDelimiter = true;
                if(childNode.tagName == 'DIV' && childNode.className == 'footnotes') {
                    _.each(childNode.querySelectorAll("ol > li"), storeFootnote);
                }
                else {
                    sectionElt.appendChild(childNode);
                }
                childNode = nextNode;
            }
            return sectionElt;
        }

        var newSectionEltList = document.createDocumentFragment();
        _.each(modifiedSections, function(section) {
            newSectionEltList.appendChild(createSectionElt(section));
        });
        wmdPreviewElt.innerHTML = '';
        var insertBeforeElt = footnoteContainerElt;
        if(insertBeforeSection !== undefined) {
            insertBeforeElt = document.getElementById("wmd-preview-section-" + insertBeforeSection.id);
        }
        previewContentsElt.insertBefore(newSectionEltList, insertBeforeElt);

        // Rewrite footnotes in the footer and update footnote numbers
        footnoteContainerElt.innerHTML = '';
        var usedFootnoteIds = [];
        if(hasFootnotes === true) {
            var footnoteElts = crel('ol');
            _.each(previewContentsElt.querySelectorAll('a.footnote'), function(elt, index) {
                elt.textContent = index + 1;
                var id = elt.id.substring(6);
                usedFootnoteIds.push(id);
                footnoteElts.appendChild(footnoteMap[id].cloneNode(true));
            });
            if(usedFootnoteIds.length > 0) {
                // Append the whole footnotes at the end of the document
                footnoteContainerElt.appendChild(crel('div', {
                    class: 'footnotes'
                }, crel('hr'), footnoteElts));
            }
            // Keep used footnotes only in our map
            footnoteMap = _.pick(footnoteMap, usedFootnoteIds);
        }
    }

    // 初始化时, toggleMode时
    function onPagedownConfigure(editor) {
        converter = editor.getConverter();
        converter.hooks.chain("preConversion", function() {
            var result = _.map(modifiedSections, function(section) {
                return section.text;
            });
            result.push(linkDefinition + "\n\n");
            return result.join("");
        });
        editor.hooks.chain("onPreviewRefresh", function() {
            refreshSections();
        });
    }

    partialRendering.onPagedownConfigure = onPagedownConfigure;
    partialRendering.onToggleMode = onPagedownConfigure;

    partialRendering.onInit = function() {
        if(markdownExtra.enabled) {
            if(_.some(markdownExtra.config.extensions, function(extension) {
                return extension == "footnotes";
            })) {
                doFootnotes = true;
            }
        }
    };
    
    partialRendering.onReady = function() {
        footnoteContainerElt = crel('div', {
            id: 'wmd-preview-section-footnotes',
            class: 'preview-content'
        });
        previewContentsElt = document.getElementById("preview-contents");
        previewContentsElt.appendChild(footnoteContainerElt);
    };

    partialRendering.onFileSelected = function() {
        fileChanged = true;
    };

    return partialRendering;
});
define('extensions/umlDiagrams',[
	'require',
	// "jquery",
	"underscore",
	"utils",
	"classes/Extension",
	'crel'
	// ', Diagram', // 如果加了这两个, 338 KB, 不加, 207KB
	// 'flow-chart'
], function(require, _, utils, Extension, crel
	// ,Diagram, 
	// flowChart
	) {

	var umlDiagrams = new Extension("umlDiagrams", "UML Diagrams", true);
	// umlDiagrams.settingsBlock = umlDiagramsSettingsBlockHTML;
	umlDiagrams.defaultConfig = {
		flowchartOptions: [
			'{',
			'   "line-width": 2,',
			'   "font-family": "sans-serif",',
			'   "font-weight": "normal"',
			'}'
		].join('\n')
	};

	var previewContentsElt = document.getElementById('preview-contents');
	function renderFlow() {
		var flows = previewContentsElt.querySelectorAll('.prettyprint > .language-flow');
		if (!flows || flows.length == 0) {
			return;
		}
		// console.log('flows')
		require(['flow-chart'], function (flowChart) {
			_.each(flows, function(elt) {
				try {
					var chart = flowChart.parse(elt.textContent);
					var preElt = elt.parentNode;
					var containerElt = crel('div', {
						class: 'flow-chart'
					});
					preElt.parentNode.replaceChild(containerElt, preElt);
					chart.drawSVG(containerElt, JSON.parse(umlDiagrams.config.flowchartOptions));
				}
				catch(e) {
					console.error(e);
				}
			});
		});
	}
	function renderSequence() {
		var ses = previewContentsElt.querySelectorAll('.prettyprint > .language-sequence');
		if (!ses || ses.length == 0) {
			return;
		}
		require(['Diagram'], function (Diagram) {
			_.each(ses, function(elt) {
				try {
					var diagram = Diagram.parse(elt.textContent);
					var preElt = elt.parentNode;
					var containerElt = crel('div', {
						class: 'sequence-diagram'
					});
					preElt.parentNode.replaceChild(containerElt, preElt);
					diagram.drawSVG(containerElt, {
						theme: 'simple'
					});

				}
				catch(e) {
					console.error(e);
				}
			});
		});
	}

	function renderFlow() {
		var flows = previewContentsElt.querySelectorAll('.prettyprint > .language-flow');
		if (!flows || flows.length == 0) {
			return;
		}
		// console.log('flows')
		require(['flow-chart'], function (flowChart) {
			_.each(flows, function(elt) {
				try {
					var chart = flowChart.parse(elt.textContent);
					var preElt = elt.parentNode;
					var containerElt = crel('div', {
						class: 'flow-chart'
					});
					preElt.parentNode.replaceChild(containerElt, preElt);
					chart.drawSVG(containerElt, JSON.parse(umlDiagrams.config.flowchartOptions));
				}
				catch(e) {
					console.error(e);
				}
			});
		});
	}

	function onToggleMode(editor) {
		editor.hooks.chain("onPreviewRefresh", function() {
			renderSequence();
			renderFlow();
		});
	}

	umlDiagrams.onPagedownConfigure = onToggleMode;
	umlDiagrams.onToggleMode = onToggleMode;

	return umlDiagrams;
});

define('extensions/toc',[
    "underscore",
    "utils",
    "classes/Extension",
], function(_, utils, Extension) {

    var toc = new Extension("toc", "Table of Contents", true);
    toc.defaultConfig = {
        marker: "\\[(TOC|toc)\\]",
        maxDepth: 6,
        button: true,
    };

    // toc.onLoadSettings = function() {
    //     utils.setInputValue("#input-toc-marker", toc.config.marker);
    //     utils.setInputValue("#input-toc-maxdepth", toc.config.maxDepth);
    //     utils.setInputChecked("#input-toc-button", toc.config.button);
    // };

    // toc.onSaveSettings = function(newConfig, event) {
    //     newConfig.marker = utils.getInputRegExpValue("#input-toc-marker", event);
    //     newConfig.maxDepth = utils.getInputIntValue("#input-toc-maxdepth");
    //     newConfig.button = utils.getInputChecked("#input-toc-button");
    // };

    /*
    toc.onCreatePreviewButton = function() {
        if(toc.config.button) {
            return buttonTocHTML;
        }
    };
    */

    // TOC element description
    function TocElement(tagName, anchor, text) {
        this.tagName = tagName;
        this.anchor = anchor;
        this.text = text;
        this.children = [];
    }
    TocElement.prototype.childrenToString = function() {
        if(this.children.length === 0) {
            return "";
        }
        var result = "<ul>\n";
        _.each(this.children, function(child) {
            result += child.toString();
        });
        result += "</ul>\n";
        return result;
    };
    TocElement.prototype.toString = function() {
        var result = "<li>";
        if(this.anchor && this.text) {
            result += '<a href="#' + this.anchor + '">' + this.text + '</a>';
        }
        result += this.childrenToString() + "</li>\n";
        return result;
    };

    // Transform flat list of TocElement into a tree
    function groupTags(array, level) {
        level = level || 1;
        var tagName = "H" + level;
        var result = [];

        var currentElement;
        function pushCurrentElement() {
            if(currentElement !== undefined) {
                if(currentElement.children.length > 0) {
                    currentElement.children = groupTags(currentElement.children, level + 1);
                }
                result.push(currentElement);
            }
        }

        _.each(array, function(element) {
            if(element.tagName != tagName) {
                if(level !== toc.config.maxDepth) {
                    if(currentElement === undefined) {
                        currentElement = new TocElement();
                    }
                    currentElement.children.push(element);
                }
            }
            else {
                pushCurrentElement();
                currentElement = element;
            }
        });
        pushCurrentElement();
        return result;
    }

    // Build the TOC
    var previewContentsElt;
    function buildToc() {
        var anchorList = {};
        function createAnchor(element) {
            var id = element.id || utils.slugify(element.textContent) || 'title';
            var anchor = id;
            var index = 0;
            while (_.has(anchorList, anchor)) {
                anchor = id + "-" + (++index);
            }
            anchorList[anchor] = true;
            // Update the id of the element
            element.id = anchor;
            return anchor;
        }

        var elementList = [];
        _.each(previewContentsElt.querySelectorAll('h1, h2, h3, h4, h5, h6'), function(elt) {
            elementList.push(new TocElement(elt.tagName, createAnchor(elt), elt.textContent));
        });
        elementList = groupTags(elementList);
        return '<div class="toc">\n<ul>\n' + elementList.join("") + '</ul>\n</div>\n';
    }

    toc.onPagedownConfigure = function(editor) {
        previewContentsElt = document.getElementById('preview-contents');
        var tocExp = new RegExp("^" + toc.config.marker + "$");
        // Run TOC generation when conversion is finished directly on HTML
        editor.hooks.chain("onPreviewRefresh", function() {
            var tocEltList = document.querySelectorAll('.table-of-contents, .toc');
            var htmlToc = buildToc();
            // Replace toc paragraphs
            _.each(previewContentsElt.getElementsByTagName('p'), function(elt) {
                if(tocExp.test(elt.innerHTML)) {
                    elt.innerHTML = htmlToc;
                }
            });
            // Add toc in the TOC button 
            _.each(tocEltList, function(elt) {
                elt.innerHTML = htmlToc;
            });

            $("#leanoteNavContentMd").height("auto"); // auto
            try {
                if(!$(htmlToc).text()) {
                    $("#leanoteNavContentMd").html("&nbsp; &nbsp; Nothing...");
                }
            } catch(e) {}
            // 这里, resize Height
            var curH = $("#leanoteNavContentMd").height();
            var pH = $("#mdEditor").height()-100;
            if(curH > pH) {
                $("#leanoteNavContentMd").height(pH);
            }
        });
    };

    toc.onReady = function() {
        // $('.extension-preview-buttons .table-of-contents').on('click', 'a', function(evt) {
        //     evt.preventDefault();
        // });
    };

    return toc;
});

define('extensions/emailConverter',[
    "classes/Extension",
], function(Extension) {
    var emailConverter = new Extension("emailConverter", "Markdown Email", true);
    emailConverter.onPagedownConfigure = function(editor) {
        editor.getConverter().hooks.chain("postConversion", function(text) {
            return text.replace(/<(mailto\:)?([^\s>]+@[^\s>]+\.\S+?)>/g, function(match, mailto, email) {
                return '<a href="mailto:' + email + '">' + email + '</a>';
            });
        });
    };

    return emailConverter;
});

define('extensions/todoList',[
    "classes/Extension",
], function(Extension) {
    var todoList = new Extension("todoList", "Markdown todoList", true);
    todoList.onPagedownConfigure = function(editor) {
        editor.getConverter().hooks.chain("postConversion", function(text) {
            return text.replace(/<li>(<p>)?\[([ xX]?)\] /g, function(matched, p, b) {
                p || (p = '');
                return !(b == 'x' || b == 'X') ? '<li class="m-todo-item m-todo-empty">' + p + '<input type="checkbox" /> ' : '<li class="m-todo-item m-todo-done">' + p + '<input type="checkbox" checked /> '
            });
        });
    };
    return todoList;
});

/**
scrollLink原理

1) preview分出一个个section
2) Md text通过这些section一个个取高度, 成mdSection
3) 将mdSection和previewSection建立映射
4) 滚动时, 通过scollTop()得到section的位置, 到另一边的section得到另一方scrollTop(), 滚动之

注意要点:
light下得到左侧的mdSection是通过helper, 每一个section的文字设到helper容器内得到高度. 所以helper的样式要和wmd-input的样式要一模一样, 不然就会有误差!!

 */
define('extensions/scrollLink',[
    // "jquery",
    "underscore",
    "classes/Extension",
    // "text!html/scrollLinkSettingsBlock.html"
], function(_, Extension) {

    var scrollLink = new Extension("scrollLink", "Scroll Link", true, true);

    var aceEditor;
    scrollLink.onAceCreated = function(aceEditorParam) {
        aceEditor = aceEditorParam;
    };

    var sectionList;
    scrollLink.onSectionsCreated = function(sectionListParam) {
        sectionList = sectionListParam;
    };

    var offsetBegin = 0;
    scrollLink.onMarkdownTrim = function(offsetBeginParam) {
        offsetBegin = offsetBeginParam;
    };

    var $textareaElt;
    var $textareaHelperElt;
    var $previewElt;
    var mdSectionList = [];
    var htmlSectionList = [];
    var lastEditorScrollTop;
    var lastPreviewScrollTop;
    var buildSections = _.debounce(function() {

        mdSectionList = [];
        var mdTextOffset = 0;
        var mdSectionOffset = 0;
        var firstSectionOffset = offsetBegin;
        var padding = 0;
        function addTextareaSection(sectionText) {
            var sectionHeight = padding;
            if(sectionText !== undefined) {
                var textNode = document.createTextNode(sectionText);
                $textareaHelperElt.empty().append(textNode);
                sectionHeight += $textareaHelperElt.prop('scrollHeight');
            }
            var newSectionOffset = mdSectionOffset + sectionHeight;
            mdSectionList.push({
                startOffset: mdSectionOffset,
                endOffset: newSectionOffset,
                height: sectionHeight
            });
            mdSectionOffset = newSectionOffset;
        }
        if(window.lightMode) {
            // Special treatment for light mode
            $textareaHelperElt.innerWidth($textareaElt.innerWidth());
            _.each(sectionList, function(section, index) {
                var sectionText = section.text;
                if(index !== sectionList.length - 1) {
                    if(sectionText.length === 0) {
                        sectionText = undefined;
                    }
                }
                else {
                    if(/\n$/.test(sectionText)) {
                        // Need to add a line break to take into account a final empty line
                        sectionText += '\n';
                    }
                }
                addTextareaSection(sectionText);
            });

            // Apply a coef to manage divergence in some browsers
            var theoricalHeight = _.last(mdSectionList).endOffset;
            var realHeight = $textareaElt[0].scrollHeight;
            var coef = realHeight/theoricalHeight;
            mdSectionList = _.map(mdSectionList, function(mdSection) {
                return {
                    startOffset: mdSection.startOffset * coef,
                    endOffset: mdSection.endOffset * coef,
                    height: mdSection.height * coef,
                };
            });
        }
        else {
            // Everything's much simpler with ACE
            _.each(sectionList, function(section) {
                mdTextOffset += section.text.length + firstSectionOffset;
                firstSectionOffset = 0;
                var documentPosition = aceEditor.session.doc.indexToPosition(mdTextOffset);
                var screenPosition = aceEditor.session.documentToScreenPosition(documentPosition.row, documentPosition.column);
                var newSectionOffset = screenPosition.row * aceEditor.renderer.lineHeight;
                var sectionHeight = newSectionOffset - mdSectionOffset;
                mdSectionList.push({
                    startOffset: mdSectionOffset,
                    endOffset: newSectionOffset,
                    height: sectionHeight
                });
                mdSectionOffset = newSectionOffset;
            });
        }

        // Try to find corresponding sections in the preview
        htmlSectionList = [];
        var htmlSectionOffset;
        var previewScrollTop = $previewElt.scrollTop();
        $previewElt.find(".preview-content > .se-section-delimiter").each(function() {
            if(htmlSectionOffset === undefined) {
                // Force start to 0 for the first section
                htmlSectionOffset = 0;
                return;
            }
            var $delimiterElt = $(this);
            // Consider div scroll position
            var newSectionOffset = $delimiterElt.position().top + previewScrollTop;
            htmlSectionList.push({
                startOffset: htmlSectionOffset,
                endOffset: newSectionOffset,
                height: newSectionOffset - htmlSectionOffset
            });
            htmlSectionOffset = newSectionOffset;
        });
        // Last section
        var scrollHeight = $previewElt.prop('scrollHeight');
        htmlSectionList.push({
            startOffset: htmlSectionOffset,
            endOffset: scrollHeight,
            height: scrollHeight - htmlSectionOffset
        });

        // apply Scroll Link (-10 to have a gap > 9px)
        lastEditorScrollTop = -10;
        lastPreviewScrollTop = -10;
        doScrollLink();
    }, 500);

    function getDestScrollTop(srcScrollTop, srcSectionList, destSectionList) {
        // Find the section corresponding to the offset
        var sectionIndex;
        var srcSection = _.find(srcSectionList, function(section, index) {
            sectionIndex = index;
            return srcScrollTop < section.endOffset;
        });
        if(srcSection === undefined) {
            // Something wrong in the algorithm...
            return;
        }
        var posInSection = (srcScrollTop - srcSection.startOffset) / (srcSection.height || 1);
        var destSection = destSectionList[sectionIndex];
        return destSection.startOffset + destSection.height * posInSection;
    }

    var isScrollEditor = false;
    var isScrollPreview = false;
    var isEditorMoving = false;
    var isPreviewMoving = false;
    var scrollingHelper = $('<div>');
    var doScrollLink = _.throttle(function() {
        if(mdSectionList.length === 0 || mdSectionList.length !== htmlSectionList.length) {
            // Delay
            doScrollLink();
            return;
        }
        var editorScrollTop = window.lightMode ? $textareaElt.scrollTop() : aceEditor.renderer.getScrollTop();
        editorScrollTop < 0 && (editorScrollTop = 0);
        var previewScrollTop = $previewElt.scrollTop();
        
        var destScrollTop;
        // Perform the animation if diff > 9px
        if(isScrollEditor === true) {
            if(Math.abs(editorScrollTop - lastEditorScrollTop) <= 9) {
                return;
            }
            isScrollEditor = false;
            // Animate the preview
            lastEditorScrollTop = editorScrollTop;
            destScrollTop = getDestScrollTop(editorScrollTop, mdSectionList, htmlSectionList);
            destScrollTop = _.min([
                destScrollTop,
                $previewElt.prop('scrollHeight') - $previewElt.outerHeight()
            ]);
            if(Math.abs(destScrollTop - previewScrollTop) <= 9) {
                // Skip the animation if diff is <= 9
                lastPreviewScrollTop = previewScrollTop;
                return;
            }
            scrollingHelper.stop('scrollLinkFx', true).css('value', 0).animate({
                value: destScrollTop - previewScrollTop
            }, {
                easing: 'linear',
                duration: 200,
                queue: 'scrollLinkFx',
                step: function(now) {
                    isPreviewMoving = true;
                    lastPreviewScrollTop = previewScrollTop + now;
                    $previewElt.scrollTop(lastPreviewScrollTop);
                },
                done: function() {
                    _.defer(function() {
                        isPreviewMoving = false;
                    });
                },
            }).dequeue('scrollLinkFx');
        }
        else if(isScrollPreview === true) {
            if(Math.abs(previewScrollTop - lastPreviewScrollTop) <= 9) {
                return;
            }
            isScrollPreview = false;
            // Animate the editor
            lastPreviewScrollTop = previewScrollTop;
            destScrollTop = getDestScrollTop(previewScrollTop, htmlSectionList, mdSectionList);
            if(window.lightMode) {
                destScrollTop = _.min([
                    destScrollTop,
                    $textareaElt.prop('scrollHeight') - $textareaElt.outerHeight()
                ]);
            }
            else {
                destScrollTop = _.min([
                    destScrollTop,
                    aceEditor.session.getScreenLength() * aceEditor.renderer.lineHeight + aceEditor.renderer.scrollMargin.bottom - aceEditor.renderer.$size.scrollerHeight
                ]);
                // If negative, set it to zero
                destScrollTop < 0 && (destScrollTop = 0);
            }
            if(Math.abs(destScrollTop - editorScrollTop) <= 9) {
                // Skip the animation if diff is <= 9
                lastEditorScrollTop = editorScrollTop;
                return;
            }
            scrollingHelper.stop('scrollLinkFx', true).css('value', 0).animate({
                value: destScrollTop - editorScrollTop
            }, {
                easing: 'linear',
                duration: 200,
                queue: 'scrollLinkFx',
                step: function(now) {
                    isEditorMoving = true;
                    lastEditorScrollTop = editorScrollTop + now;
                    window.lightMode || aceEditor.session.setScrollTop(lastEditorScrollTop);
                    window.lightMode && $textareaElt.scrollTop(lastEditorScrollTop);
                },
                done: function() {
                    _.defer(function() {
                        isEditorMoving = false;
                    });
                },
            }).dequeue('scrollLinkFx');
        }
    }, 100);

    scrollLink.onLayoutResize = function() {
        isScrollEditor = true;
        buildSections();
    };

    scrollLink.onFileClosed = function() {
        mdSectionList = [];
    };

    function initScrollEvent () {

    }

    // 切换编辑模式时
    var onToggleMode = function (isOnToggleMode) {
        $previewElt = $(".preview-container");
        $textareaElt = $("#wmd-input");
        // This helper is used to measure sections height in light mode
        $textareaHelperElt = $('.textarea-helper');

        $previewElt.scroll(function() {
            if(isPreviewMoving === false && scrollAdjust === false) {
                isScrollPreview = true;
                isScrollEditor = false;
                doScrollLink();
            }
            scrollAdjust = false;
        });
        var handleEditorScroll = function() {
            if(isEditorMoving === false) {
                isScrollEditor = true;
                isScrollPreview = false;
                doScrollLink();
            }
        };

        // editor 滚动时操作
        var timeout = isOnToggleMode ? 500 : 0;
        setTimeout(function () {
            if(window.lightMode) {
                $textareaElt.scroll(handleEditorScroll);
            }
            else {
                aceEditor.session.on("changeScrollTop", handleEditorScroll);
            }
        }, timeout);
    };

    scrollLink.onToggleMode = function () {
        $previewElt = $(".preview-container");
        $textareaElt = $("#wmd-input");
        $textareaHelperElt = $('.textarea-helper');

        buildSections();

        // 可以不要这一段
        // isScrollPreview = true;
        // isScrollEditor = false;
        // doScrollLink();

        // console.log('-----------------')
        onToggleMode(true);

        // 左侧滚动到之前的位置
        // $previewElt.scrollTop($previewElt.scrollTop());
    };

    var scrollAdjust = false;
    scrollLink.onReady = function() {
        $previewElt = $(".preview-container");
        $textareaElt = $("#wmd-input");
        // This helper is used to measure sections height in light mode
        $textareaHelperElt = $('.textarea-helper');

        onToggleMode();

        // 添加目录, 两种目录
        // Reimplement anchor scrolling to work without preview
        $('.extension-preview-buttons .table-of-contents, #preview-contents').on('click', 'a', function(evt) {
            var id = this.hash;
            if (!id) {
                return;
            }
            evt.preventDefault();
            var anchorElt = $('#preview-contents ' + decodeURIComponent(id));
            if(!anchorElt.length) {
                return;
            }
            var previewScrollTop = anchorElt[0].getBoundingClientRect().top - $previewElt.get(0).getBoundingClientRect().top + $previewElt.scrollTop();
            var editorScrollTop = getDestScrollTop(previewScrollTop, htmlSectionList, mdSectionList);

            $previewElt.scrollTop(previewScrollTop);
            window.lightMode || aceEditor.session.setScrollTop(editorScrollTop);
            window.lightMode && $textareaElt.scrollTop(editorScrollTop);
        });
    };

    var $previewContentsElt;
    scrollLink.onPagedownConfigure = function(editor) {
        $previewContentsElt = $("#preview-contents");
        editor.getConverter().hooks.chain("postConversion", function(text) {
            // To avoid losing scrolling position before elements are fully
            // loaded
            $previewContentsElt.height($previewContentsElt.height());
            return text;
        });
    };

    scrollLink.onPreviewFinished = function() {
        // Now set the correct height
        var previousHeight = $previewContentsElt.height();
        $previewContentsElt.height("auto");
        var newHeight = $previewContentsElt.height();
        isScrollEditor = true;
        if(newHeight < previousHeight) {
            // We expect a scroll adjustment
            scrollAdjust = true;
        }
        buildSections();
    };

    return scrollLink;
});

define('extensions/htmlSanitizer',[
	// "jquery",
	"underscore",
	"utils",
	"classes/Extension",
	// "ext!html/htmlSanitizerSettingsBlock.html"
], function(_, utils, Extension) {

	var htmlSanitizer = new Extension("htmlSanitizer", "HTML Sanitizer", true);
	// htmlSanitizer.settingsBlock = htmlSanitizerSettingsBlockHTML;

	var buf;
	htmlSanitizer.onPagedownConfigure = function(editor) {
		var converter = editor.getConverter();
		converter.hooks.chain("postConversion", function(html) {
			buf = [];
			html.split('<div class="se-preview-section-delimiter"></div>').forEach(function(sectionHtml) {
				htmlParser(sectionHtml, htmlSanitizeWriter(buf
					/*, function(uri, isImage) {
					return !/^unsafe/.test(sanitizeUri(uri, isImage));
				}*/));
				buf.push('<div class="se-preview-section-delimiter"></div>');
			});
			return buf.slice(0, -1).join('');
		});
	};

	/**
	 * @license AngularJS v1.2.16
	 * (c) 2010-2014 Google, Inc. http://angularjs.org
	 * License: MIT
	 */

	// var aHrefSanitizationWhitelist = /^\s*(https?|ftp|mailto|tel|file):/,
		// imgSrcSanitizationWhitelist = /^\s*(https?|ftp|file|leanote):|data:image\//;
	/*
	var urlResolve = (function() {
		var urlParsingNode = document.createElement("a");
		return function urlResolve(url) {
			var href = url;

			if (utils.msie) {
				// Normalize before parse.  Refer Implementation Notes on why this is
				// done in two steps on IE.
				urlParsingNode.setAttribute("href", href);
				href = urlParsingNode.href;
			}

			urlParsingNode.setAttribute('href', href);

			// urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
			return {
				href: urlParsingNode.href,
				protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
				host: urlParsingNode.host,
				search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
				hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
				hostname: urlParsingNode.hostname,
				port: urlParsingNode.port,
				pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
					urlParsingNode.pathname : '/' + urlParsingNode.pathname
			};
		};
	})();

	function sanitizeUri(uri, isImage) {
		var regex = isImage ? imgSrcSanitizationWhitelist : aHrefSanitizationWhitelist;
		var normalizedVal;
		normalizedVal = urlResolve(uri).href;
		if(normalizedVal !== '' && !normalizedVal.match(regex)) {
			return 'unsafe:' + normalizedVal;
		}
	}
	*/

	// Regular Expressions for parsing tags and attributes
	var START_TAG_REGEXP =
			/^<\s*([\w:-]+)((?:\s+[\w:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*>/,
		END_TAG_REGEXP = /^<\s*\/\s*([\w:-]+)[^>]*>/,
		ATTR_REGEXP = /([\w:-]+)(?:\s*=\s*(?:(?:"((?:[^"])*)")|(?:'((?:[^'])*)')|([^>\s]+)))?/g,
		BEGIN_TAG_REGEXP = /^</,
		BEGING_END_TAGE_REGEXP = /^<\s*\//,
		COMMENT_REGEXP = /<!--(.*?)-->/g,
		DOCTYPE_REGEXP = /<!DOCTYPE([^>]*?)>/i,
		CDATA_REGEXP = /<!\[CDATA\[(.*?)]]>/g,
		// Match everything outside of normal chars and " (quote character)
		NON_ALPHANUMERIC_REGEXP = /([^\#-~| |!])/g;

	function makeMap(str) {
		var obj = {}, items = str.split(','), i;
		for(i = 0; i < items.length; i++) {
			obj[items[i]] = true;
		}
		return obj;
	}

	// Good source of info about elements and attributes
	// http://dev.w3.org/html5/spec/Overview.html#semantics
	// http://simon.html5.org/html-elements

	// Safe Void Elements - HTML5
	// http://dev.w3.org/html5/spec/Overview.html#void-elements
	var voidElements = makeMap("area,br,col,hr,img,wbr");

	// Elements that you can, intentionally, leave open (and which close themselves)
	// http://dev.w3.org/html5/spec/Overview.html#optional-tags
	var optionalEndTagBlockElements = makeMap("colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr"),
		optionalEndTagInlineElements = makeMap("rp,rt"),
		optionalEndTagElements = _.extend({},
			optionalEndTagInlineElements,
			optionalEndTagBlockElements);

	// 允许的elements
	// Safe Block Elements - HTML5
	var blockElements = _.extend({}, optionalEndTagBlockElements, makeMap("address,article," +
		"aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5," +
		"h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,script,section,table,ul,embed,iframe"));

	// Inline Elements - HTML5
	var inlineElements = _.extend({}, optionalEndTagInlineElements, makeMap("a,abbr,acronym,b," +
		"bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s," +
		"samp,small,span,strike,strong,sub,sup,time,tt,u,var,input"));

	// Special Elements (can contain anything)
	// var specialElements = makeMap("script,style"); //  style为什么需要, 是因为表格style="align:left"
	var specialElements = makeMap("script"); //  style为什么需要, 是因为表格style="align:left"

	// benweet: Add iframe
	// blockElements.iframe = true;

	var validElements = _.extend({},
		voidElements,
		blockElements,
		inlineElements,
		optionalEndTagElements);

	//Attributes that have href and hence need to be sanitized
	var uriAttrs = makeMap("background,cite,href,longdesc,src,usemap");
	var validAttrs = _.extend({}, uriAttrs, makeMap(
			'abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
			'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,' +
			'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,' +
			'scope,scrolling,shape,size,span,start,summary,target,title,type,' +
			'valign,value,vspace,width,checked,style')); // style为什么需要, 是因为表格style="align:left"

	// benweet: Add id and allowfullscreen (YouTube iframe)
	validAttrs.id = true;
	validAttrs.allowfullscreen = true;

	/*
	 * HTML Parser By Misko Hevery (misko@hevery.com)
	 * based on:  HTML Parser By John Resig (ejohn.org)
	 * Original code by Erik Arvidsson, Mozilla Public License
	 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
	 *
	 * // Use like so:
	 * htmlParser(htmlString, {
	 *     start: function(tag, attrs, unary) {},
	 *     end: function(tag) {},
	 *     chars: function(text) {},
	 *     comment: function(text) {}
	 * });
	 *
	 */
	/* jshint -W083 */
	function htmlParser(html, handler) {
		var index, chars, match, stack = [], last = html;
		stack.last = function() {
			return stack[ stack.length - 1 ];
		};

		function parseStartTag(tag, tagName, rest, unary) {
			tagName = tagName && tagName.toLowerCase();
			if(blockElements[ tagName ]) {
				while(stack.last() && inlineElements[ stack.last() ]) {
					parseEndTag("", stack.last());
				}
			}

			if(optionalEndTagElements[ tagName ] && stack.last() == tagName) {
				parseEndTag("", tagName);
			}

			unary = voidElements[ tagName ] || !!unary;

			if(!unary) {
				stack.push(tagName);
			}

			var attrs = {};

			rest.replace(ATTR_REGEXP,
				function(match, name, doubleQuotedValue, singleQuotedValue, unquotedValue) {
					var value = doubleQuotedValue ||
						singleQuotedValue ||
						unquotedValue ||
						'';

					attrs[name] = decodeEntities(value);
				});
			if(handler.start) {
				handler.start(tagName, attrs, unary);
			}
		}

		function parseEndTag(tag, tagName) {
			var pos = 0, i;
			tagName = tagName && tagName.toLowerCase();
			if(tagName) {
				// Find the closest opened tag of the same type
				for(pos = stack.length - 1; pos >= 0; pos--) {
					if(stack[ pos ] == tagName) {
						break;
					}
				}
			}

			if(pos >= 0) {
				// Close all the open elements, up the stack
				for(i = stack.length - 1; i >= pos; i--) {
					if(handler.end) {
						handler.end(stack[ i ]);
					}
				}

				// Remove the open elements from the stack
				stack.length = pos;
			}
		}

		while(html) {
			chars = true;

			// Make sure we're not in a script or style element
			if(!stack.last() || !specialElements[ stack.last() ]) {

				// Comment
				if(html.indexOf("<!--") === 0) {
					// comments containing -- are not allowed unless they terminate the comment
					index = html.indexOf("--", 4);

					if(index >= 0 && html.lastIndexOf("-->", index) === index) {
						if(handler.comment) {
							handler.comment(html.substring(4, index));
						}
						html = html.substring(index + 3);
						chars = false;
					}
					// DOCTYPE
				} else if(DOCTYPE_REGEXP.test(html)) {
					match = html.match(DOCTYPE_REGEXP);

					if(match) {
						html = html.replace(match[0], '');
						chars = false;
					}
					// end tag
				} else if(BEGING_END_TAGE_REGEXP.test(html)) {
					match = html.match(END_TAG_REGEXP);

					if(match) {
						html = html.substring(match[0].length);
						match[0].replace(END_TAG_REGEXP, parseEndTag);
						chars = false;
					}

					// start tag
				} else if(BEGIN_TAG_REGEXP.test(html)) {
					match = html.match(START_TAG_REGEXP);

					if(match) {
						html = html.substring(match[0].length);
						match[0].replace(START_TAG_REGEXP, parseStartTag);
						chars = false;
					}
				}

				if(chars) {
					index = html.indexOf("<");

					var text = index < 0 ? html : html.substring(0, index);
					html = index < 0 ? "" : html.substring(index);

					if(handler.chars) {
						handler.chars(decodeEntities(text));
					}
				}

			} else {
				html = html.replace(new RegExp("(.*)<\\s*\\/\\s*" + stack.last() + "[^>]*>", 'i'),
					function(all, text) {
						text = text.replace(COMMENT_REGEXP, "$1").replace(CDATA_REGEXP, "$1");

						if(handler.chars) {
							handler.chars(decodeEntities(text));
						}

						return "";
					});

				parseEndTag("", stack.last());
			}

			if(html == last) {
				//throw new Error("The sanitizer was unable to parse the following block of html: " + html);
				stack.reverse();
				return stack.forEach(function(tag) {
					buf.push('</');
					buf.push(tag);
					buf.push('>');
				});
			}
			last = html;
		}

		// Clean up any remaining tags
		parseEndTag();
	}

	var hiddenPre = document.createElement("pre");
	var spaceRe = /^(\s*)([\s\S]*?)(\s*)$/;

	/**
	 * decodes all entities into regular string
	 * @param value
	 * @returns {string} A string with decoded entities.
	 */
	function decodeEntities(value) {
		if(!value) {
			return '';
		}

		// Note: IE8 does not preserve spaces at the start/end of innerHTML
		// so we must capture them and reattach them afterward
		var parts = spaceRe.exec(value);
		var spaceBefore = parts[1];
		var spaceAfter = parts[3];
		var content = parts[2];
		if(content) {
			hiddenPre.innerHTML = content.replace(/</g, "&lt;");
			// innerText depends on styling as it doesn't display hidden elements.
			// Therefore, it's better to use textContent not to cause unnecessary
			// reflows. However, IE<9 don't support textContent so the innerText
			// fallback is necessary.
			content = 'textContent' in hiddenPre ?
				hiddenPre.textContent : hiddenPre.innerText;
		}
		return spaceBefore + content + spaceAfter;
	}

	/**
	 * Escapes all potentially dangerous characters, so that the
	 * resulting string can be safely inserted into attribute or
	 * element text.
	 * @param value
	 * @returns {string} escaped text
	 */
	function encodeEntities(value) {
		return value.
			replace(/&/g, '&amp;').
			replace(NON_ALPHANUMERIC_REGEXP, function(value) {
				return '&#' + value.charCodeAt(0) + ';';
			}).
			replace(/</g, '&lt;').
			replace(/>/g, '&gt;');
	}


	/**
	 * create an HTML/XML writer which writes to buffer
	 * @param {Array} buf use buf.jain('') to get out sanitized html string
	 * @returns {object} in the form of {
	 *     start: function(tag, attrs, unary) {},
	 *     end: function(tag) {},
	 *     chars: function(text) {},
	 *     comment: function(text) {}
	 * }
	 */
	function htmlSanitizeWriter(buf /* , uriValidator */ ) {
		var ignore = false;
		var out = _.bind(buf.push, buf);
		return {
			start: function(tag, attrs, unary) {
				tag = tag && tag.toLowerCase();
				if(!ignore && specialElements[tag]) {
					ignore = tag;
				}
				if(!ignore && validElements[tag] === true) {
					out('<');
					out(tag);
					_.forEach(attrs, function(value, key) {
						var lkey = key && key.toLowerCase();
						// var isImage = (tag === 'img' && lkey === 'src') || (lkey === 'background');
						if(validAttrs[lkey] === true &&
							(uriAttrs[lkey] !== true || true/* || uriValidator(value, isImage) */)) {
							out(' ');
							out(key);
							out('="');
							out(encodeEntities(value));
							out('"');
						}
					});
					out(unary ? '/>' : '>');
				}
			},
			end: function(tag) {
				tag = tag && tag.toLowerCase();
				if(!ignore && validElements[tag] === true) {
					out('</');
					out(tag);
					out('>');
				}
				if(tag == ignore) {
					ignore = false;
				}
			},
			chars: function(chars) {
				if(!ignore) {
					out(encodeEntities(chars));
				}
			},
			comment: function(comment) {
				if(!ignore) {
					out('<!--');
					out(encodeEntities(comment));
					out('-->');
				}
			}
		};
	}

	return htmlSanitizer;
});

define('eventMgr',[
    // "jquery",
    "underscore",
    "crel",
    "utils",
    "classes/Extension",
    "settings",
    // "text!html/settingsExtensionsAccordion.html",
    // "extensions/yamlFrontMatterParser",
    "extensions/markdownSectionParser",
    "extensions/partialRendering",
    // "extensions/buttonMarkdownSyntax",
    // "extensions/googleAnalytics",
    // "extensions/twitter",
    // "extensions/dialogAbout",
    // "extensions/dialogManagePublication",
    // "extensions/dialogManageSynchronization",
    // "extensions/dialogManageSharing",
    // "extensions/dialogOpenHarddrive",
    // "extensions/documentTitle",
    // "extensions/documentSelector",
    // "extensions/documentPanel",
    // "extensions/documentManager",
    // "extensions/workingIndicator",
    // "extensions/notifications",
    "extensions/umlDiagrams",
    "extensions/markdownExtra",
    "extensions/toc",
    "extensions/mathJax",
    "extensions/emailConverter",
    "extensions/todoList",
    "extensions/scrollLink",
    "extensions/htmlSanitizer",
    // "extensions/buttonFocusMode",
    // "extensions/buttonSync",
    // "extensions/buttonPublish",
    // "extensions/buttonStat",
    // "extensions/buttonHtmlCode",
    // "extensions/buttonViewer",
    // "extensions/welcomeTour",
    // "extensions/spellCheck",
    // "extensions/userCustom",
    // "bootstrap",
    "jquery-waitforimages"
], function(_, crel, utils, Extension, settings, settingsExtensionsAccordionHTML) {

    var eventMgr = {};

    // Create a list of extensions from module arguments
    var extensionList = _.chain(arguments).map(function(argument) {
        return argument instanceof Extension && argument;
    }).compact().value();

    // Configure extensions
    var extensionSettings = settings.extensionSettings || {};
    _.each(extensionList, function(extension) {
        // Set the extension.config attribute from settings or default
        // configuration
        extension.config = _.extend({}, extension.defaultConfig, extensionSettings[extension.extensionId]);
        if(window.viewerMode === true && extension.disableInViewer === true) {
            // Skip enabling the extension if we are in the viewer and extension
            // doesn't support it
            extension.enabled = false;
        }
        else if(window.lightMode === true && extension.disableInLight === true) {
            // Same for light mode
            extension.enabled = false;
        }
        else {
            // Enable the extension if it's not optional or it has not been
            // disabled by the user
            extension.enabled = !extension.isOptional || extension.config.enabled === undefined || extension.config.enabled === true;
        }
    });

    // Returns all listeners with the specified name that are implemented in the
    // enabled extensions
    function getExtensionListenerList(eventName) {
        return _.chain(extensionList).map(function(extension) {
            return extension.enabled && extension[eventName];
        }).compact().value();
    }

    // Returns a function that calls every listeners with the specified name
    // from all enabled extensions
    var eventListenerListMap = {};
    function createEventHook(eventName) {
        eventListenerListMap[eventName] = getExtensionListenerList(eventName);
        return function() {
            var eventArguments = arguments;
            _.each(eventListenerListMap[eventName], function(listener) {
                // Use try/catch in case userCustom listener contains error
                try {
                    listener.apply(null, eventArguments);
                }
                catch(e) {
                    console.error(_.isObject(e) ? e.stack : e);
                }
            });
        };
    }

    // Declare an event Hook in the eventMgr that we can fire using eventMgr.eventName()
    function addEventHook(eventName) {
        eventMgr[eventName] = createEventHook(eventName);
    }

    // Used by external modules (not extensions) to listen to events
    eventMgr.addListener = function(eventName, listener) {
        try {
            eventListenerListMap[eventName].push(listener);
        }
        catch(e) {
            console.error('No event listener called ' + eventName);
        }
    };

    // Call every onInit listeners (enabled extensions only)
    createEventHook("onInit")();

    // Load/Save extension config from/to settings
    eventMgr.onLoadSettings = function() {
        _.each(extensionList, function(extension) {
            var isChecked = !extension.isOptional || extension.config.enabled === undefined || extension.config.enabled === true;
            utils.setInputChecked("#input-enable-extension-" + extension.extensionId, isChecked);
            // Special case for Markdown Extra and MathJax
            if(extension.extensionId == 'markdownExtra') {
                utils.setInputChecked("#input-settings-markdown-extra", isChecked);
            }
            else if(extension.extensionId == 'mathJax') {
                utils.setInputChecked("#input-settings-mathjax", isChecked);
            }
            var onLoadSettingsListener = extension.onLoadSettings;
            onLoadSettingsListener && onLoadSettingsListener();
        });
    };
    eventMgr.onSaveSettings = function(newExtensionSettings, event) {
        _.each(extensionList, function(extension) {
            if(window.lightMode === true && extension.disableInLight === true) {
                newExtensionSettings[extension.extensionId] = extension.config;
                return;
            }
            var newExtensionConfig = _.extend({}, extension.defaultConfig);
            newExtensionConfig.enabled = utils.getInputChecked("#input-enable-extension-" + extension.extensionId);
            var isChecked;
            // Special case for Markdown Extra and MathJax
            if(extension.extensionId == 'markdownExtra') {
                isChecked = utils.getInputChecked("#input-settings-markdown-extra");
                if(isChecked != extension.enabled) {
                    newExtensionConfig.enabled = isChecked;
                }
            }
            else if(extension.extensionId == 'mathJax') {
                isChecked = utils.getInputChecked("#input-settings-mathjax");
                if(isChecked != extension.enabled) {
                    newExtensionConfig.enabled = isChecked;
                }
            }
            var onSaveSettingsListener = extension.onSaveSettings;
            onSaveSettingsListener && onSaveSettingsListener(newExtensionConfig, event);
            newExtensionSettings[extension.extensionId] = newExtensionConfig;
        });
    };

    addEventHook("onMessage");
    addEventHook("onError");
    // addEventHook("onOfflineChanged");
    // addEventHook("onUserActive");
    // addEventHook("onAsyncRunning");
    addEventHook("onPeriodicRun");

    // To access modules that are loaded after extensions
    addEventHook("onFileMgrCreated");
    addEventHook("onSynchronizerCreated");
    addEventHook("onPublisherCreated");
    addEventHook("onEventMgrCreated");

    // Operations on files
    addEventHook("onFileCreated");
    addEventHook("onFileDeleted");
    addEventHook("onFileSelected");
    addEventHook("onFileOpen");
    addEventHook("onFileClosed");
    addEventHook("onContentChanged");

    addEventHook('onToggleMode');
    // addEventHook("onTitleChanged");

    // Operations on folders
    // addEventHook("onFoldersChanged");

    // Sync events
    // addEventHook("onSyncRunning");
    // addEventHook("onSyncSuccess");
    // addEventHook("onSyncImportSuccess");
    // addEventHook("onSyncExportSuccess");
    // addEventHook("onSyncRemoved");

    // Publish events
    // addEventHook("onPublishRunning");
    // addEventHook("onPublishSuccess");
    // addEventHook("onNewPublishSuccess");
    // addEventHook("onPublishRemoved");

    // Operations on Layout
    addEventHook("onLayoutConfigure");
    addEventHook("onLayoutCreated");
    addEventHook("onLayoutResize");

    // Operations on PageDown
    addEventHook("onPagedownConfigure");
    addEventHook("onSectionsCreated");
    addEventHook("onMarkdownTrim");

    // Operation on ACE
    addEventHook("onAceCreated");
    
    // Refresh twitter buttons
    // addEventHook("onTweet");
    

    var onPreviewFinished = createEventHook("onPreviewFinished");
    var onAsyncPreviewListenerList = getExtensionListenerList("onAsyncPreview");
    var previewContentsElt;
    var $previewContentsElt;
    eventMgr.onAsyncPreview = function() {
        function recursiveCall(callbackList) {
            var callback = callbackList.length ? callbackList.shift() : function() {
                _.defer(function() {
                    var html = "";
                    _.each(previewContentsElt.children, function(elt) {
                        html += elt.innerHTML;
                    });
                    html = html.replace(/^<div class="se-section-delimiter"><\/div>\n\n/gm, '');
                    var htmlWithComments = utils.trim(html);
                    var htmlWithoutComments = htmlWithComments.replace(/ <span class="comment label label-danger">.*?<\/span> /g, '');
                    onPreviewFinished(htmlWithComments, htmlWithoutComments);
                });
            };
            callback(function() {
                recursiveCall(callbackList);
            });
        }
        recursiveCall(onAsyncPreviewListenerList.concat([function(callback) {
            // We assume some images are loading asynchronously after the preview
            $previewContentsElt.waitForImages(callback);
        }]));
    };

    var onReady = createEventHook("onReady");
    eventMgr.onReady = function() {
        previewContentsElt = document.getElementById('preview-contents');
        $previewContentsElt = $(previewContentsElt);

        // Create a button from an extension listener
        var createBtn = function(listener) {
            var buttonGrpElt = crel('div', {
                class: 'btn-group'
            });
            var btnElt = listener();
            if(_.isString(btnElt)) {
                buttonGrpElt.innerHTML = btnElt;
            }
            else if(_.isElement(btnElt)) {
                buttonGrpElt.appendChild(btnElt);
            }
            return buttonGrpElt;
        };

        if(window.viewerMode === false) {
            // // Create accordion in settings dialog
            // var accordionHtml = _.chain(extensionList).sortBy(function(extension) {
            //     return extension.extensionName.toLowerCase();
            // }).reduce(function(html, extension) {
            //     return html + (extension.settingsBlock && !(window.lightMode === true && extension.disableInLight === true) ? _.template(settingsExtensionsAccordionHTML, {
            //         extensionId: extension.extensionId,
            //         extensionName: extension.extensionName,
            //         isOptional: extension.isOptional,
            //         settingsBlock: extension.settingsBlock
            //     }) : "");
            // }, "").value();
            // document.querySelector('.accordion-extensions').innerHTML = accordionHtml;
            
            // // Create extension buttons
            // logger.log("onCreateButton");
            // var onCreateButtonListenerList = getExtensionListenerList("onCreateButton");
            // var extensionButtonsFragment = document.createDocumentFragment();
            // _.each(onCreateButtonListenerList, function(listener) {
            //     extensionButtonsFragment.appendChild(createBtn(listener));
            // });
            // document.querySelector('.extension-buttons').appendChild(extensionButtonsFragment);

            // Create extension editor buttons
            // logger.log("onCreateEditorButton");
            var onCreateEditorButtonListenerList = getExtensionListenerList("onCreateEditorButton");
            var extensionEditorButtonsFragment = document.createDocumentFragment();
            _.each(onCreateEditorButtonListenerList, function(listener) {
                extensionEditorButtonsFragment.appendChild(createBtn(listener));
            });
            // var editorButtonsElt = document.querySelector('.extension-editor-buttons');
            // editorButtonsElt.appendChild(extensionEditorButtonsFragment);
        }

        // Create extension preview buttons
        // logger.log("onCreatePreviewButton");
        var onCreatePreviewButtonListenerList = getExtensionListenerList("onCreatePreviewButton");
        var extensionPreviewButtonsFragment = document.createDocumentFragment();
        _.each(onCreatePreviewButtonListenerList, function(listener) {
            extensionPreviewButtonsFragment.appendChild(createBtn(listener));
        });
        var previewButtonsElt = document.querySelector('.extension-preview-buttons');
        previewButtonsElt.appendChild(extensionPreviewButtonsFragment);

        // A bit of jQuery...
        var $previewButtonsElt = $(previewButtonsElt);
        var previewButtonsWidth = $previewButtonsElt.width();
        $previewButtonsElt.find('.btn-group').each(function() {
            var $btnGroupElt = $(this);
            // Align dropdown to the left of the screen
            $btnGroupElt.find('.dropdown-menu').css({
                right: -previewButtonsWidth + $btnGroupElt.width() + $btnGroupElt.position().left
            });
        });
        
        // Call onReady listeners
        onReady();
    };

    // For extensions that need to call other extensions
    eventMgr.onEventMgrCreated(eventMgr);
    return eventMgr;
});
define('shortcutMgr',[
    "underscore",
    "eventMgr",
    "utils",
], function(_, eventMgr, utils, settingsShortcutEntryHTML) {

    var shortcutMgr = {};

    var shortcuts = {
        'bold': {
            title: 'Strong',
            defaultKey: {
                win: 'Ctrl-B',
                mac: 'Command-B|Ctrl-B',
            },
            isPageDown: true
        },
        'italic': {
            title: 'Emphasis',
            defaultKey: {
                win: 'Ctrl-I',
                mac: 'Command-I|Ctrl-I',
            },
            isPageDown: true
        },
        'link': {
            title: 'Hyperlink',
            defaultKey: {
                win: 'Ctrl-L',
                mac: 'Command-L|Ctrl-L',
            },
            isPageDown: true
        },
        'quote': {
            title: 'Blockquote',
            defaultKey: {
                win: 'Ctrl-Q',
                mac: 'Command-Q|Ctrl-Q',
            },
            isPageDown: true
        },
        'code': {
            title: 'Code Sample',
            defaultKey: {
                win: 'Ctrl-K',
                mac: 'Command-K|Ctrl-K',
            },
            isPageDown: true
        },
        'image': {
            title: 'Image',
            defaultKey: {
                win: 'Ctrl-G',
                mac: 'Command-G|Ctrl-G',
            },
            isPageDown: true
        },
        'olist': {
            title: 'Numbered List',
            defaultKey: {
                win: 'Ctrl-O',
                mac: 'Command-O|Ctrl-O',
            },
            isPageDown: true
        },
        'ulist': {
            title: 'Bulleted List',
            defaultKey: {
                win: 'Ctrl-U',
                mac: 'Command-U|Ctrl-U',
            },
            isPageDown: true
        },
        'heading': {
            title: 'Heading',
            defaultKey: {
                win: 'Ctrl-H',
                mac: 'Command-H|Ctrl-H',
            },
            isPageDown: true
        },
        'hr': {
            title: 'Horizontal Rule',
            defaultKey: {
                win: 'Ctrl-R',
                mac: 'Command-R|Ctrl-R',
            },
            isPageDown: true
        },
        'undo': {
            title: 'Undo',
            defaultKey: {
                win: 'Ctrl-Z',
                mac: 'Command-Z',
            },
            exec: function(editor) {
                editor.undo();
            },
            isPageDown: true
        },
        'redo': {
            title: 'Redo',
            defaultKey: {
                win: 'Ctrl-Y|Ctrl-Shift-Z',
                mac: 'Command-Y|Command-Shift-Z',
            },
            exec: function(editor) {
                editor.redo();
            },
            isPageDown: true
        },
        'selectall': {
            title: 'Select All',
            defaultKey: {
                win: 'Ctrl-A',
                mac: 'Command-A',
            },
            exec: function(editor) {
                editor.selectAll();
            },
            readOnly: true
        },
        'removeline': {
            title: 'Remove Line',
            defaultKey: {
                win: 'Ctrl-D',
                mac: 'Command-D',
            },
            exec: function(editor) {
                editor.removeLines();
            },
            multiSelectAction: "forEachLine"
        },
        'duplicateSelection': {
            title: 'Duplicate Selection',
            defaultKey: {
                win: 'Ctrl-Shift-D',
                mac: 'Command-Shift-D',
            },
            exec: function(editor) {
                editor.duplicateSelection();
            },
            multiSelectAction: "forEach"
        },
        'sortlines': {
            title: 'Sort Lines',
            defaultKey: {
                win: 'Ctrl-Alt-S',
                mac: 'Command-Alt-S',
            },
            exec: function(editor) {
                editor.sortLines();
            },
            multiSelectAction: "forEachLine"
        },
        'modifyNumberUp': {
            title: 'Number Up',
            defaultKey: {
                win: 'Ctrl-Shift-Up',
                mac: 'Alt-Shift-Up',
            },
            exec: function(editor) {
                editor.modifyNumber(1);
            },
            multiSelectAction: "forEach"
        },
        'modifyNumberDown': {
            title: 'Number Down',
            defaultKey: {
                win: 'Ctrl-Shift-Down',
                mac: 'Alt-Shift-Down',
            },
            exec: function(editor) {
                editor.modifyNumber(-1);
            },
            multiSelectAction: "forEach"
        },
        'find': {
            title: 'Find',
            defaultKey: {
                win: 'Ctrl-F',
                mac: 'Command-F',
            },
            exec: function(editor) {
                var config = ace.require("ace/config");
                config.loadModule("ace/ext/searchbox", function(e) {
                    e.Search(editor);
                });
            },
            readOnly: true
        },
        'replace': {
            title: 'Replace',
            defaultKey: {
                win: 'Ctrl-Shift-F',
                mac: 'Command-Option-F',
            },
            exec: function(editor) {
                var config = require("ace/config");
                config.loadModule("ace/ext/searchbox", function(e) {
                    e.Search(editor, true);
                });
            },
            readOnly: true
        },
        'findnext': {
            title: 'Find Next',
            defaultKey: {
                win: 'Ctrl-P',
                mac: 'Command-P',
            },
            exec: function(editor) {
                editor.findNext();
            },
            readOnly: true
        },
        'findprevious': {
            title: 'Find Previous',
            defaultKey: {
                win: 'Ctrl-Shift-P',
                mac: 'Command-Shift-P',
            },
            exec: function(editor) {
                editor.findPrevious();
            },
            readOnly: true
        },
        'togglerecording': {
            title: 'Toggle Recording',
            defaultKey: {
                win: 'Ctrl-Alt-E',
                mac: 'Command-Option-E',
            },
            exec: function(editor) {
                editor.commands.toggleRecording(editor);
            },
            readOnly: true
        },
        'replaymacro': {
            title: 'Replay Macro',
            defaultKey: {
                win: 'Ctrl-Shift-E',
                mac: 'Command-Shift-E',
            },
            exec: function(editor) {
                editor.commands.replay(editor);
            },
            readOnly: true
        },
    };

    _.each(shortcuts, function(shortcut, key) {
        shortcut.name = key;
        shortcut.bindKey = shortcut.defaultKey;
    });

    shortcutMgr.configureAce = function(aceEditor) {
        _.each(shortcuts, function(shortcut) {
            shortcut.exec && aceEditor.commands.addCommand(_.pick(shortcut, 'name', 'bindKey', 'exec', 'readOnly', 'multiSelectAction'));
        });
    };
    
    shortcutMgr.getPagedownKeyStrokes = function() {
        return _.chain(shortcuts).where({
            isPageDown: true
        }).map(function(shortcut) {
            return [shortcut.name, shortcut.bindKey];
        }).object().value();
    };

    return shortcutMgr;
});

/**
 * 已知BUG:
 * 从light切换到normal, 快捷键没用了
 *
 */

/*globals Markdown, requirejs */
define('core',[
    "underscore",
    "crel",
    // "ace",
    "constants",
    "utils",
    // "settings",
    "eventMgr",
    "shortcutMgr",
    'pagedown-ace',
    'pagedown-light',
    // 'libs/ace_mode',
    // 'ace/requirejs/text!ace/css/editor.css',
    // 'ace/requirejs/text!ace/theme/textmate.css',
    // 'ace/ext/spellcheck',
    // 'ace/ext/searchbox'
], function(_, crel, 
    // ace, 
    constants, utils, eventMgr, shortcutMgr) {

    var core = {};

    window['MD'] = {'eventMgr': eventMgr};

    var insertLinkO = $('<div class="modal fade modal-insert-link"><div class="modal-dialog"><div class="modal-content">'
            + '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'
            + '<h4 class="modal-title">' + getMsg('Hyperlink') + '</h4></div>'
            + '<div class="modal-body"><p>' + getMsg('Please provide the link URL and an optional title') + ':</p>'
            + '<div class="input-group"><span class="input-group-addon"><i class="fa fa-link"></i></span><input id="input-insert-link" type="text" class="col-sm-5 form-control" placeholder="http://example.com  ' + getMsg('optional title') + '"></div></div><div class="modal-footer"><a href="#" class="btn btn-default" data-dismiss="modal">' + getMsg('Cancel') + '</a> <a href="#" class="btn btn-primary action-insert-link" data-dismiss="modal">' + getMsg('OK') + '</a></div></div></div></div>');

    var actionInsertLinkO = insertLinkO.find('.action-insert-link');

    // Create ACE editor
    var aceEditor;
    function createAceEditor() {
        aceEditor = ace.edit("wmd-input");
        MD.aceEditor = aceEditor;
        // aceEditor.setOption("spellcheck", true);

        // vim
        // aceEditor.setKeyboardHandler("ace/keyboard/vim");

        aceEditor.renderer.setShowGutter(false);
        aceEditor.renderer.setPrintMarginColumn(false);
        aceEditor.renderer.setPadding(constants.EDITOR_DEFAULT_PADDING);
        aceEditor.session.setUseWrapMode(true);
        aceEditor.session.setNewLineMode("unix");
        // aceEditor.session.setMode("libs/ace_mode");
        aceEditor.session.setMode("ace/mode/ace_mode");

        aceEditor.session.$selectLongWords = true;

        // Make bold titles...
        (function(self) {
            function checkLine(currentLine) {
                var line = self.lines[currentLine];
                if(line.length !== 0) {
                    if(line[0].type.indexOf("markup.heading.multi") === 0) {
                        _.each(self.lines[currentLine - 1], function(previousLineObject) {
                            previousLineObject.type = "markup.heading.prev.multi";
                        });
                    }
                }
            }
            function customWorker() {
                // Duplicate from background_tokenizer.js
                if(!self.running) {
                    return;
                }

                var workerStart = new Date();
                var currentLine = self.currentLine;
                var endLine = -1;
                var doc = self.doc;

                while (self.lines[currentLine]) {
                    currentLine++;
                }

                var startLine = currentLine;

                var len = doc.getLength();
                var processedLines = 0;
                self.running = false;
                while (currentLine < len) {
                    self.$tokenizeRow(currentLine);
                    endLine = currentLine;
                    do {
                        checkLine(currentLine); // benweet
                        currentLine++;
                    } while (self.lines[currentLine]);

                    // only check every 5 lines
                    processedLines++;
                    if((processedLines % 5 === 0) && (new Date() - workerStart) > 20) {
                        self.running = setTimeout(customWorker, 20); // benweet
                        self.currentLine = currentLine;
                        return;
                    }
                }
                self.currentLine = currentLine;

                if(startLine <= endLine) {
                    self.fireUpdateEvent(startLine, endLine);
                }
            }
            self.$worker = function() {
                self.lines.splice(0, self.lines.length);
                self.states.splice(0, self.states.length);
                self.currentLine = 0;
                customWorker();
            };

        })(aceEditor.session.bgTokenizer);

        shortcutMgr.configureAce(aceEditor);
        eventMgr.onAceCreated(aceEditor);
    }

    // Create the layout
    var $editorButtonsElt;

    var $navbarElt;
    var $leftBtnElts;
    var $rightBtnElts;
    var $leftBtnDropdown;
    var $rightBtnDropdown;

    // Create the PageDown editor
    var editor;
    var $editorElt;
    var fileDesc;
    var documentContent;
    // var UndoManager = require("ace/undomanager").UndoManager;
    var previewWrapper;

    var converter;

    var lightEditor;

    var $mdKeyboardMode;

    core._resetToolBar = function () {
        /*
        <ul class="nav left-buttons">
                <li class="wmd-button-group1 btn-group"></li>
            </ul>
            <ul class="nav left-buttons">
                <li class="wmd-button-group2 btn-group"></li>
            </ul>
            <ul class="nav left-buttons">
                <li class="wmd-button-group3 btn-group"></li>
            </ul>
            <ul class="nav left-buttons">
                <li class="wmd-button-group4 btn-group"></li>
            </ul>
             <ul class="nav left-buttons">
                <li class="wmd-button-group6 btn-group">
                  <li class="wmd-button btn btn-success" id="wmd-help-button" title="Markdown syntax" style="left: 0px; display: none;"><span style="display: none; background-position: 0px 0px;"></span><i class="fa fa-question-circle"></i></li>
                </li>
            </ul>
         */
        $('#wmd-button-row').remove();
        $('#wmd-button-bar .wmd-button-bar-inner').html('<ul class="nav left-buttons"><li class="wmd-button-group1 btn-group"></li></ul><ul class="nav left-buttons"><li class="wmd-button-group2 btn-group"></li></ul><ul class="nav left-buttons"><li class="wmd-button-group3 btn-group"></li></ul><ul class="nav left-buttons"><li class="wmd-button-group4 btn-group"></li></ul><ul class="nav left-buttons"><li class="wmd-button-group6 btn-group"></li><li class="wmd-button btn btn-success" id="wmd-help-button" title="' + getMsg('Markdown syntax') +'" style="left:0;display:none"><span style="display:none;background-position:0 0"></span><i class="fa fa-question-circle"></i></li></ul>');
    };

    core._setEditorHook = function () {
        // Custom insert link dialog
        editor.hooks.set("insertLinkDialog", function(callback) {
            core.insertLinkCallback = callback;
            utils.resetModalInputs();
            insertLinkO.modal();
            return true;
        });
        // Custom insert image dialog
        editor.hooks.set("insertImageDialog", function(callback) {
            core.insertLinkCallback = callback;
            if(core.catchModal) {
                return true;
            }
            utils.resetModalInputs();
            var ifr = $("#leauiIfrForMD");
            if(!ifr.attr('src')) {
                ifr.attr('src', '/album/index?md=1');
            }
            $(".modal-insert-image").modal();
            return true;
        });

        editor.hooks.chain("onPreviewRefresh", eventMgr.onAsyncPreview);
    };

    // 行
    core._moveCursorTo = function (row, column) {
        if (!window.lightMode) {
            aceEditor.moveCursorTo(row, column);
            return;
        }

        // 得到offset
        var offset = core._getTextareaCursorOffset(row, column);

        $('#wmd-input').get(0).setSelectionRange(offset, offset);
        $('#wmd-input').focus();
    };

    // 得到文本编辑器的位置
    // 返回 {row: 0, column: 0}
    core._getTextareaCusorPosition = function () {
        var offset = $('#wmd-input').get(0).selectionStart;
        if (offset == 0) {
            return {row: 0, column: 0};
        }
        var content = MD.getContent() || '';
        var contentArr = content.split('\n');
        var to = 0;
        var row = 0;
        var column = 0;
        for (var row = 0; row < contentArr.length; ++row) {
            var line = contentArr[row];
            
            if (offset <= line.length) {
                column = offset;
                break;
            }
            else {
                offset -= line.length;
            }

            // 下一行\n
            offset--;
        }
        return {row: row, column: column};
    };

    // 通过row, column 得到offset
    core._getTextareaCursorOffset = function (row, column) {
        var offset = 0;
         // 得到offset
        var content = MD.getContent();
        var contentArr = content.split('\n');
        var offset = 0;
        for (var i = 0; i < contentArr.length && i < row; ++i) {
            offset += contentArr[i].length + 1;  // \n 算1个
        }
        offset += column;
        return offset + 1;
    }

    // 切换到轻量编辑器
    core.initLightEditor = function () {
        if (window.lightMode) {
            return;
        }

        var scrollTop;
        var pos;
        if (aceEditor) {
            scrollTop = aceEditor.renderer.getScrollTop();
            pos = aceEditor.getCursorPosition();
        }
        else {
            scrollTop = 0;
            pos = 0;
        }
        var content = MD.getContent();

        core._resetToolBar();
        aceEditor && aceEditor.destroy();

        // In light mode, we replace ACE with a textarea
        $('#wmd-input').replaceWith(function() {
            return $('<textarea id="wmd-input" class="ace_editor ace-tm wmd-textarea">').addClass(this.className).addClass('form-control');
        });

        core._pre();

        // unbind all event
        // $editorElt.off();

        editor = new Markdown.EditorLight(converter);

        core._setEditorHook();

        editor.run(previewWrapper);

        core._setToolBars();

        $editorElt.val(content);

        window.lightMode = true;
        aceEditor = null;
        MD.clearUndo();
        eventMgr.onToggleMode(editor);
        core._moveCursorTo(pos.row, pos.column);
        $editorElt.focus();
        $('#wmd-input').scrollTop(scrollTop);

        // 设置API
        // MD.insertLink = editor.insertLink;
    };

    // 切换到Ace编辑器
    core.initAceEditor = function () {
        if (!window.lightMode) {
            return;
        }
        var scrollTop = $('#wmd-input').scrollTop(); // : 
        var pos = core._getTextareaCusorPosition();
        // console.log(pos);
        var content = MD.getContent();

        core._resetToolBar();
        aceEditor && aceEditor.destroy();

        $('#wmd-input').replaceWith(function () {
            return '<pre id="wmd-input" class="form-control"><div id="wmd-input-sub" class="editor-content mousetrap" contenteditable=true></div><div class="editor-margin"></div></pre>';
        });

        core._pre();

        // ACE editor
        createAceEditor();
        // Editor's element
        $editorElt.find('.ace_content').css({
            "background-size": "64px " + Math.round(constants.fontSize * (20 / 12)) + "px",
        });

        // unbind all event
        // $editorElt.off();

        editor = new Markdown.Editor(converter, undefined, {
            keyStrokes: shortcutMgr.getPagedownKeyStrokes()
        });

        core._setEditorHook();
        editor.run(aceEditor, previewWrapper);

        core._setToolBars();

        aceEditor.setValue(content, -1);
        window.lightMode = false;
        MD.clearUndo();

        eventMgr.onToggleMode(editor);
        core._moveCursorTo(pos.row, pos.column);
        aceEditor.focus();
        aceEditor.session.setScrollTop(scrollTop);

        // 设置API
        // MD.insertLink = editor.insertLink;
    };

    core._initMarkdownConvert = function () {
        // Create the converter and the editor
        converter = new Markdown.Converter();
        var options = {
            _DoItalicsAndBold: function(text) {
                // Restore original markdown implementation
                text = text.replace(/(\*\*|__)(?=\S)(.+?[*_]*)(?=\S)\1/g,
                "<strong>$2</strong>");
                text = text.replace(/(\*|_)(?=\S)(.+?)(?=\S)\1/g,
                "<em>$2</em>");
                return text;
            }
        };
        converter.setOptions(options);

        return converter;
    }

    // 初始化
    core.initEditor = function(fileDescParam) {
        if(fileDesc !== undefined) {
            eventMgr.onFileClosed(fileDesc);
        }
        if (!fileDescParam) {
            fileDescParam = {content: ""};
        }
        fileDesc = fileDescParam;
        documentContent = undefined;
        var initDocumentContent = fileDesc.content;

        if(!window.lightMode) {
            aceEditor.setValue(initDocumentContent, -1);
            // 重新设置undo manage
            // aceEditor.getSession().setUndoManager(new ace.UndoManager());
        }
        else {
            $editorElt.val(initDocumentContent);
        }

        // If the editor is already created
        if(editor !== undefined) {
            if(!window.lightMode) {
                aceEditor && fileDesc.editorSelectRange && aceEditor.selection.setSelectionRange(fileDesc.editorSelectRange);
            }
            // aceEditor ? aceEditor.focus() : $editorElt.focus();
            editor.refreshPreview();

            MD.$editorElt = $editorElt;

            // 滚动到最顶部, 不然ace editor有问题
            if(window.lightMode) {
                $editorElt.scrollTop(0);
            }
            else {
                _.defer(function() {
                    aceEditor.renderer.scrollToY(0);
                });
            }
            return;
        }

        var $previewContainerElt = $(".preview-container");

        /*
        if(window.lightMode) {
            // Store editor scrollTop on scroll event
            $editorElt.scroll(function() {
                if(documentContent !== undefined) {
                    fileDesc.editorScrollTop = $(this).scrollTop();
                }
            });
            // Store editor selection on change
            $editorElt.bind("keyup mouseup", function() {
                if(documentContent !== undefined) {
                    fileDesc.editorStart = this.selectionStart;
                    fileDesc.editorEnd = this.selectionEnd;
                }
            });
        }
        else {
            // Store editor scrollTop on scroll event
            var saveScroll = _.debounce(function() {
                if(documentContent !== undefined) {
                    fileDesc.editorScrollTop = aceEditor.renderer.getScrollTop();
                }
            }, 100);
            aceEditor.session.on('changeScrollTop', saveScroll);
            // Store editor selection on change
            var saveSelection = _.debounce(function() {
                if(documentContent !== undefined) {
                    fileDesc.editorSelectRange = aceEditor.getSelectionRange();
                }
            }, 100);
            aceEditor.session.selection.on('changeSelection', saveSelection);
            aceEditor.session.selection.on('changeCursor', saveSelection);
        }
        // Store preview scrollTop on scroll event
        $previewContainerElt.scroll(function() {
            if(documentContent !== undefined) {
                fileDesc.previewScrollTop = $previewContainerElt.scrollTop();
            }
        });
        */

        if(window.lightMode) {
            editor = new Markdown.EditorLight(converter);
        }
        else {
            editor = new Markdown.Editor(converter, undefined, {
                keyStrokes: shortcutMgr.getPagedownKeyStrokes()
            });
        }

        // editor['eventMgr'] = eventMgr;

        core._setEditorHook();

        function checkDocumentChanges() {
            var newDocumentContent = $editorElt.val();
            if(!window.lightMode && aceEditor) {
                newDocumentContent = aceEditor.getValue();
            }
            if(documentContent !== undefined && documentContent != newDocumentContent) {
                fileDesc.content = newDocumentContent;
                eventMgr.onContentChanged(fileDesc);
            }
            documentContent = newDocumentContent;
        }
        previewWrapper = function(makePreview) {
            var debouncedMakePreview = _.debounce(makePreview, 500);
            return function() {
                if(documentContent === undefined) {
                    makePreview();

                    eventMgr.onFileOpen(fileDesc);
                    $previewContainerElt.scrollTop(fileDesc.previewScrollTop);
                    if(window.lightMode) {
                        $editorElt.scrollTop(fileDesc.editorScrollTop);
                    }
                    else {
                        _.defer(function() {
                            aceEditor.renderer.scrollToY(fileDesc.editorScrollTop);
                        });
                    }
                }
                else {
                    debouncedMakePreview();
                }
                checkDocumentChanges();
            };
        };

        eventMgr.onPagedownConfigure(editor);
        
        if(window.lightMode) {
            editor.run(previewWrapper);
            editor.undoManager.reinit(initDocumentContent, fileDesc.editorStart, fileDesc.editorEnd, fileDesc.editorScrollTop);
        }
        else {
            editor.run(aceEditor, previewWrapper);
            fileDesc.editorSelectRange && aceEditor.selection.setSelectionRange(fileDesc.editorSelectRange);
        }
    };

    // 工具栏按钮
    core._setToolBars = function () {
        // Hide default buttons
        $(".wmd-button-row li").addClass("btn btn-success").css("left", 0).find("span").hide();

        // Add customized buttons
        var $btnGroupElt = $('.wmd-button-group1');

        $("#wmd-bold-button").append($('<i class="fa fa-bold">')).appendTo($btnGroupElt);
        $("#wmd-italic-button").append($('<i class="fa fa-italic">')).appendTo($btnGroupElt);
        $btnGroupElt = $('.wmd-button-group2');
        $("#wmd-link-button").append($('<i class="fa fa-link">')).appendTo($btnGroupElt);
        $("#wmd-quote-button").append($('<i class="fa fa-quote-left">')).appendTo($btnGroupElt);
        $("#wmd-code-button").append($('<i class="fa fa-code">')).appendTo($btnGroupElt);
        $("#wmd-image-button").append($('<i class="fa fa-picture-o">')).appendTo($btnGroupElt);
        $btnGroupElt = $('.wmd-button-group3');
        $("#wmd-olist-button").append($('<i class="fa fa-list-ol">')).appendTo($btnGroupElt);
        $("#wmd-ulist-button").append($('<i class="fa fa-list-ul">')).appendTo($btnGroupElt);
        $("#wmd-heading-button").append($('<i class="fa fa-header">')).appendTo($btnGroupElt);
        $("#wmd-hr-button").append($('<i class="fa fa-ellipsis-h">')).appendTo($btnGroupElt);
        // $btnGroupElt = $('.wmd-button-group4');
        $("#wmd-undo-button").append($('<i class="fa fa-undo">')).appendTo($btnGroupElt);
        $("#wmd-redo-button").append($('<i class="fa fa-repeat">')).appendTo($btnGroupElt);

        core._initModeToolbar();
    };

    core.setMDApi = function () {
        //==============
        // MD API start

        // 设置API
        // MD.insertLink = editor.insertLink;

        MD.focus = function () {
            !window.lightMode ? aceEditor.focus() : $('#wmd-input').focus();
        };
        MD.setContent = function (content) {
            var desc = {
                content: content
            }
            // Notify extensions
            // eventMgr.onFileSelected(desc);

            // Refresh the editor (even if it's the same file)
            core.initEditor(desc);
        };
        // 初始化, 避免卡死
        MD.setContent("");
        MD.getContent = function () {
            if(!window.lightMode) {
                return aceEditor.getValue();
            }
            return $('#wmd-input').val();
            // return $editorElt.val(); // 有延迟?
        };
        

        /*
        if (!window.lightMode) {
            MD.aceEditor = aceEditor;
        }
        */

        // 重新refresh preview
        MD.onResize = function () {
            eventMgr.onLayoutResize();
        };

        // aceEditor resize
        MD.resize = function () {
            if (!window.lightMode) {
                aceEditor.resize();
            }
        };

        MD.clearUndo = function () {
            if(window.lightMode) {
                editor.undoManager.reinit();
            }
            else {
                aceEditor.getSession().setUndoManager(new ace.UndoManager());
            }
            // 重新设置undo, redo button是否可用状态
            editor.uiManager.setUndoRedoButtonStates();
        };

        MD.toggleToAce = function () {
            core.initAceEditor();
        };

        // 切换成light模式
        MD.toggleToLight = function () {
            core.initLightEditor();
        };

        // 以下一行是为了i18n能分析到
        // getMsg('Light') getMsg('Normal')
        MD.setModeName = function(mode) {
            if (mode === 'textarea') {
                mode = 'Normal';
            }
            var msg = getMsg(mode);
            $mdKeyboardMode.html(msg);
        };

        MD.changeAceKeyboardMode = function(mode, modeName) {
            // 保存之
            localS.set(localSModeKey, mode);

            // 之前是lightMode
            if (window.lightMode) {
                // 要切换成ace
                if (mode != 'light') {
                    core.initAceEditor();
                    if (!MD.defaultKeyboardMode) {
                        MD.defaultKeyboardMode = aceEditor.getKeyboardHandler();
                    }
                }
                // 还是ligth, 则返回
                else {
                    return;
                }
            }
            // 当前是ace
            else {
                // 如果mode是light, 则切换之, 否则
                if (mode == 'light') {
                    core.initLightEditor();
                    return;
                }
            }

            // ace切换成其它模式

            if (mode != 'vim' && mode != 'emacs') {
                aceEditor.setKeyboardHandler(MD.defaultKeyboardMode);
                // shortcutMgr.configureAce(aceEditor);
            }
            else {
                aceEditor.setKeyboardHandler("ace/keyboard/" + mode);
            }

            // if (mode != 'light') {
            //     aceEditor.focus();
            // }
        };

        // MD API end
        //==============
    };

    core._initModeToolbar = function () {
        // 可以切换
        if (!window.lightModeForce) {
            $('.wmd-button-group4').html(['<div class="btn-group">',
                    '<button type="button" class="wmd-button btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="' + getMsg('Edit mode') + '">',
                      '<i class="fa fa-gear"></i> <i id="md-keyboard-mode"></i>',
                    '</button>',
                    '<ul class="dropdown-menu wmd-mode">',
                      '<li><a href="#" data-mode="Normal"><i class="fa fa-check"></i> ' + getMsg('Normal mode') + '</a></li>',
                      '<li><a href="#" data-mode="Vim"><i class="fa"></i> ' + getMsg('Vim mode') + '</a></li>',
                      '<li><a href="#" data-mode="Emacs"><i class="fa"></i> ' + getMsg('Emacs mode') + '</a></li>',
                      '<li role="separator" class="divider"></li>',
                      '<li><a href="#" data-mode="Light"><i class="fa"></i> ' + getMsg('Light editor') + '</a></li>',
                    '</ul>',
                  '</div>'].join(''));

            $("#wmd-help-button").show();
            $mdKeyboardMode = $('#md-keyboard-mode');
            
            // 编辑模式选择
            $('.wmd-mode a').click(function () {
                var $this = $(this);
                var mode = $this.data('mode');
                MD.changeAceKeyboardMode(mode.toLowerCase(), mode);
                MD.setModeName(mode);

                // 切换后可能会重绘html, 所以这里重新获取
                $('.wmd-mode').find('i').removeClass('fa-check');
                $('.wmd-mode a[data-mode="' + mode + '"]').find('i').addClass('fa-check');
            });

            if (!window.LEA 
                || (window.LEA 
                    && window.LEA.canSetMDModeFromStorage 
                    && window.LEA.canSetMDModeFromStorage())) {
                var aceMode = localS.get(localSModeKey);
                if (!aceMode) {
                    return;
                }
                var aceModeUpper = aceMode[0].toUpperCase() + aceMode.substr(1);
                $('.wmd-mode i').removeClass('fa-check');
                $('.wmd-mode a[data-mode="' + aceModeUpper + '"] i').addClass('fa-check');

                MD.setModeName(aceModeUpper);
            }
        }
    };

    core._pre = function () {
        $editorElt = $("#wmd-input, .textarea-helper").css({
            // Apply editor font
            "font-family": constants.fontFamily,
            "font-size": constants.fontSize + "px",
            "line-height": Math.round(constants.fontSize * (20 / 12)) + "px"
        });
    };

    // Initialize multiple things and then fire eventMgr.onReady
    var isDocumentPanelShown = false;
    var isMenuPanelShown = false;
    core.onReady = function() {
        $navbarElt = $('.navbar');
        $leftBtnElts = $navbarElt.find('.left-buttons');
        $rightBtnElts = $navbarElt.find('.right-buttons');
        $leftBtnDropdown = $navbarElt.find('.left-buttons-dropdown');
        $rightBtnDropdown = $navbarElt.find('.right-buttons-dropdown');

        // Editor
        if(window.lightMode) {
            // In light mode, we replace ACE with a textarea
            $('#wmd-input').replaceWith(function() {
                return $('<textarea id="wmd-input" class="ace_editor ace-tm wmd-textarea">').addClass(this.className).addClass('form-control');
            });
        }

        core._pre();

        if(!window.lightMode) {
            // ACE editor
            createAceEditor();

            // Editor's element
            $editorElt.find('.ace_content').css({
                "background-size": "64px " + Math.round(constants.fontSize * (20 / 12)) + "px",
            });
        }

        eventMgr.onReady();
        core._initMarkdownConvert();
        core.initEditor();
        core.setMDApi();
        core._setToolBars();

        // 默认Ace编辑模式
        if (!window.lightMode) {
            MD.defaultKeyboardMode = aceEditor.getKeyboardHandler();
        }
        // 初始时
        // 是否可以从storage中设置md mode
        if (!window.LEA 
            || (window.LEA 
                && window.LEA.canSetMDModeFromStorage 
                && window.LEA.canSetMDModeFromStorage())) {
            var aceMode = localS.get(localSModeKey);
            if (!window.lightMode && aceMode) {
                var aceModeUpper = aceMode[0].toUpperCase() + aceMode.substr(1);
                MD.changeAceKeyboardMode(aceMode, aceModeUpper);
            }
        }
    };

    // Other initialization that are not prioritary
    eventMgr.addListener("onReady", function() {

        $(document.body).on('shown.bs.modal', '.modal', function() {
            var $elt = $(this);
            setTimeout(function() {
                // When modal opens focus on the first button
                $elt.find('.btn:first').focus();
                // Or on the first link if any
                $elt.find('button:first').focus();
                // Or on the first input if any
                $elt.find("input:enabled:visible:first").focus();
            }, 50);
        }).on('hidden.bs.modal', '.modal', function() {
            // Focus on the editor when modal is gone
            // editor.focus();
            // Revert to current theme when settings modal is closed
            // applyTheme(window.theme);
        }).on('keypress', '.modal', function(e) {
            // Handle enter key in modals
            if(e.which == 13 && !$(e.target).is("textarea")) {
                $(this).find(".modal-footer a:last").click();
            }
        });
       
        // Click events on "insert link" and "insert image" dialog buttons
        actionInsertLinkO.click(function(e) {
            var value = utils.getInputTextValue($("#input-insert-link"), e);
            if(value !== undefined) {
                var arr = value.split(' ');
                var text = '';
                var link = arr[0];
                if (arr.length > 1) {
                    arr.shift();
                    text = $.trim(arr.join(' '));
                }
                if (link && link.indexOf('://') < 0) {
                    link = "http://" + link;
                }
                core.insertLinkCallback(link, text);
                core.insertLinkCallback = undefined;
            }
        });
        // 插入图片
        $(".action-insert-image").click(function() {
            // 得到图片链接或图片
            /*
            https://github.com/leanote/leanote/issues/171
            同遇到了网页编辑markdown时不能添加图片的问题。
            可以上传图片，但是按下“插入图片”按钮之后，编辑器中没有加入![...](...)
            我的控制台有这样的错误： TypeError: document.mdImageManager is undefined
            */
            // mdImageManager是iframe的name, mdGetImgSrc是iframe内的全局方法
            // var value = document.mdImageManager.mdGetImgSrc();
            var value = document.getElementById('leauiIfrForMD').contentWindow.mdGetImgSrc();
            if(value) {
                core.insertLinkCallback(value);
                core.insertLinkCallback = undefined;
            }
        });

        // Hide events on "insert link" and "insert image" dialogs
        insertLinkO.on('hidden.bs.modal', function() {
            if(core.insertLinkCallback !== undefined) {
                core.insertLinkCallback(null);
                core.insertLinkCallback = undefined;
            }
        });

        // Avoid dropdown panels to close on click
        $("div.dropdown-menu").click(function(e) {
            e.stopPropagation();
        });

        // 弹框显示markdown语法
        $('#wmd-button-bar').on('click', '#wmd-help-button', function() {
            window.open("http://leanote.leanote.com/post/Leanote-Markdown-Manual");
        });
    });

    return core;
});

// RequireJS configuration
/*global requirejs */
requirejs.config({
    waitSeconds: 0,
    packages: [
    ],
    paths: {
        underscore: 'js/libs/underscore/underscore',
        crel: 'js/libs/crel/crel',
        mathjax: 'js/libs/mathjax/MathJax.js?a=1&config=TeX-AMS_HTML',
        'google-code-prettify': 'js/libs/code-prettify/src/prettify',
        'jquery-waitforimages': 'js/libs/waitForImages/dist/jquery.waitforimages',
        'pagedown-ace': 'js/libs-modified/pagedown-ace/Markdown.Editor',
        'pagedown-light': 'js/libs-modified/pagedown-ace/Markdown.Editor.light',
        'pagedown-extra': 'js/libs/pagedown-extra/Markdown.Extra',
        xregexp: 'js/libs/xregexp/xregexp-all',
       
        // 以下, 异步加载, 不常用
        Diagram: 'js/libs/js-sequence-diagrams/build/sequence-diagram-min',
        'diagram-grammar': 'js/libs-modified/diagram-grammar/diagram-grammar',
        raphael: 'js/libs/raphael/raphael-min',
        'flow-chart': 'js/libs/flowchart/release/flowchart.amd-1.3.3.min'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        mathjax: [
            'libs/mathjax_init'
        ],
        'pagedown-extra': [
            'pagedown-ace'
        ],
        'pagedown-ace': [
            'js/libs-modified/pagedown-ace/Markdown.Converter'
        ],
        'pagedown-light': [
            'js/libs-modified/pagedown-ace/Markdown.Converter'
        ],
        'flow-chart': [
            'raphael'
        ],
        'diagram-grammar': [
            'underscore'
        ],
        Diagram: [
            'raphael',
            'diagram-grammar'
        ]
    }
});

// 本地缓存
var localS = {
    get: function(key) {
        if (localStorage) {
            return localStorage.getItem(key);
        }
        return;
    },
    set: function(key, value) {
        value += '';
        if (localStorage) {
            localStorage.setItem(key, value);
        }
    }
};
var localSModeKey = 'LeaMdAceMode';

// Viewer mode is deduced from the body class
window.viewerMode = false;

// Light mode is for mobile or viewer
window.lightModeForce = window.viewerMode || /_light_/.test(localStorage.mode) || /(\?|&)light($|&)/.test(location.search) || (function(a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
        return true;
    }
})(navigator.userAgent || navigator.vendor || window.opera);
// 是否是强制lightMode
if (window.lightModeForce) {
    window.lightMode = true;
}
else {
    var mode = localS.get(localSModeKey);
    if (mode === 'light') {
        window.lightMode = true;
    }
}

// window.lightMode = true;

// Keep the theme in a global variable
window.theme = localStorage.themeV3 || 'default';
var themeModule = "less!themes/default";

require(["core", "eventMgr"
    // , themeModule
    ],
    function(core, eventMgr) {

    $(function() {
        core.onReady();
    });
});

define("main", function(){});
