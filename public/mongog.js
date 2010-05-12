Ext.override(Ext.tree.TreeNode, {
    removeAllChildren: function () {
	while (this.hasChildNodes()) {
	    this.removeChild(this.firstChild);
	}
	return this;
    },
    setIcon: function (icon) {
	this.getUI().setIcon(icon);
    },
    setIconCls: function (icon) {
	this.getUI().setIconCls(icon);
    }
});

Ext.override(Ext.tree.TreeNodeUI, {
    setIconCls: function (iconCls) {
	if (this.iconNode) {
	    Ext.fly(this.iconNode).replaceClass(this.node.attributes.iconCls, iconCls);
	}
	this.node.attributes.iconCls = iconCls;
    },
    setIcon: function (icon) {
	if (this.iconNode) {
	    this.iconNode.src = icon || this.emptyIcon;
	    Ext.fly(this.iconNode)[icon ? 'addClass' : 'removeClass']('x-tree-node-inline-icon');
	}
	this.node.attributes.icon = icon;
    }
});

Ext.override(Ext.Panel, {
    hideBbar: function () {
	if (!this.bbar) {
	    return;
	}
	this.bbar.setVisibilityMode(Ext.Element.DISPLAY);
	this.bbar.hide();
	this.getBottomToolbar().hide();
	this.syncSize();
	if (this.ownerCt) {
	    this.ownerCt.doLayout();
	}
    },
    showBbar: function () {
	if (!this.bbar) {
	    return;
	}
	this.bbar.setVisibilityMode(Ext.Element.DISPLAY);
	this.bbar.show();
	this.getBottomToolbar().show();
	this.syncSize();
	if (this.ownerCt) {
	    this.ownerCt.doLayout();
	}
    },
    toggleBbar: function() {
        if(!this.bbar) {
            return;
        }
        if(this.bbar.isVisible()) {
            this.hideBbar();
        } else {
            this.showBbar();
        }
    }
});

Ext.ux.iconCls = function () {
    var styleSheetId = 'styleSheetIconCls';
    var cssClasses = {};
    Ext.util.CSS.createStyleSheet('/* Ext.ux.iconCls */', styleSheetId);
    return {
	get: function (icon) {
	    if (!icon) {
		return null;
	    }
	    if (typeof cssClasses[icon] === 'undefined') {
		cssClasses[icon] = 'icon_' + Ext.id();
		var styleBody = '\n.' + cssClasses[icon] + ' { background-image: url(' + icon + ') !important; }';
		if (Ext.isIE) {
		    document.styleSheets[styleSheetId].cssText += styleBody;
		} else {
		    Ext.get(styleSheetId).dom.sheet.insertRule(styleBody, 0);
		}
	    }
	    return cssClasses[icon];
	}
    };
}();

String.space = function (len) {
    var t = [], i;
    for (i = 0; i < len; i++) {
	t.push(' ');
    }
    return t.join('');
};

function aboutWindow() {
    Ext.Msg.alert('Mongog','Based on code written by: <a href=mailto:turi.gabor@gmail.com>Gabor Turi</a>. <br><a href="http://jsonviewer.stack.hu/">http://jsonviewer.stack.hu/</a>');
}

Ext.onReady(function () {

    var tabCounter = 0;

    var mvQueryPanelModel = function() {
        return {
            query_name: null, //name of query. shows up in tab
            query_text: null, //text from query
            query_json: null, //encoded text
            collection_path: null, //path to collection query is run on
            result_text: null, //text returned by the query
            result_json: null, //encoded text returned by query
            coll_data_text: null,
            coll_data_json: null,
        };
    };



    var mongog = function () {
        
        var m_hQueries = new Array(); //hash of queries... one per tab
        var m_activeQueryPanel = null;
        
        
	var lastText = null;
	var task = null;
	var searchList = null;
	var searchIndex = null;
        var m_currentCollection = null;
	return {
            addQueryPanel: function(p) {
                m_hQueries[p.id] = mvQueryPanelModel();
                
            },
            deleteQueryPanel: function(p) {
                
                newArray = new Array();
                
                for(var key in m_hQueries) {
                    if(key != p.id) {
                        newArray[key] = m_hQueries[key];
                    }
                }
                m_hQueries = newArray;
            },
            setActiveQueryPanel: function(p) {
                this.m_activeQueryPanel = p;
            },
            getActiveQueryPanel: function() {
                return this.m_activeQueryPanel;
            },
            getActiveQueryModel: function() {
                return m_hQueries[this.getActiveQueryPanel().id];
            },
            onFetchCollectionData: function() {
                if(this.getActiveQueryPanel() && this.getCurrentCollection()) {
                    this.getActiveQueryPanel().infoTabPanel().setActiveTab(1);
                    this.fetchCollectionData();
                }
            },
            onFetchCollectionDataMaybe: function() {            //call onFetchCollectionData if Collection Tab active
                if(this.getActiveQueryPanel() && this.getCurrentCollection()) {
                    var active_id = this.getActiveQueryPanel().infoTabPanel().getActiveTab().id;
                    if(active_id == this.getActiveQueryPanel().infoTabPanel().dataPanel().id) {
                        this.onFetchCollectionData();
                    }
                }
            },
            onCollectionDataRequest: function(response) {
                var mod = this.getActiveQueryModel();
                var text = response.responseText;
                var json = this.check_text(text);
                if(json != null) {
                    mod.coll_data_text = text;
                    mod.coll_data_json = json;
                    panel = this.getActiveQueryPanel().infoTabPanel().dataPanel();
                    this.treebuild(panel,mod.coll_data_json);
                }
            },
            fetchCollectionData: function() {
                var p = this.getCurrentCollection();
                p.query = null;
                if(this.m_currentCollection) {

                    Ext.Ajax.request({
	                url: 'query',
	                params: p,
                        success: function(request,result) {
                            mongog.onCollectionDataRequest(request,result);
                        },
                        failure: function (response) {
                            Ext.Msg.alert('Server Error','A server-side error occurred executing the query');
                        }
                    });
                }
            },
            onQueryRequest: function(response) {
                var mod = this.getActiveQueryModel();
                var text = response.responseText;
                var json = this.check_text(text);
                if(json != null) {
                    mod.query_text = text;
                    mod.query_json = json;
                    panel = this.getActiveQueryPanel().infoTabPanel().resultPanel();
                    this.treebuild(panel,mod.query_json);
                }
            },
            fetchQueryData: function() {
                if(this.m_currentCollection) {                
                    p = this.getCurrentCollection();
                    
                    var query_txt = this.getActiveQueryPanel().editPanel().items.itemAt(0).getValue();
                    var query_json = this.check_text(query_txt);
                    if(query_json != null) {
                        p.query = Ext.util.JSON.encode(query_json);
                        Ext.Ajax.request({
	                    url: 'query',
	                    params: p,
                            success: function(request,result){
                                mongog.onQueryRequest(request,result);
                            },
                            failure: function (response) {
                                Ext.Msg.alert('Server Error','A server-side error occurred executing the query');
                            }
                        });
                    }
                }
            },
            runQuery: function() {
                if(this.getActiveQueryPanel() && this.getCurrentCollection()) {
                    this.getActiveQueryPanel().infoTabPanel().setActiveTab(0);
                    this.fetchQueryData();
                }
            },
            getQuery: function() {
	        var edit = Ext.getCmp('edit');
                var text = edit.getValue().split("\n").join(" ");
                
                var j = null;
                try {
                    j = Ext.util.JSON.decode(text);
                } catch(e) {
                    return "";
                }
                
                return Ext.util.JSON.encode(j);
            },
            check_text: function(txt) {
                var text = txt.split("\n").join(" ");
                var json = null;
		try {
		    json = Ext.util.JSON.decode(text);
		} catch (e) {
		    Ext.MessageBox.show({
			title: 'JSON error',
			msg: 'Invalid JSON',
			icon: Ext.MessageBox.ERROR,
			buttons: Ext.MessageBox.OK,
			closable: false
		    });
		    return null;
		}
                return json;
	    },
	    check: function () {
                this.check_text(this.getQuery());
            },
            setCurrentCollection: function(p) {
                this.m_currentCollection  = p;
            },
            getCurrentCollection: function() {
                return this.m_currentCollection;
            },
            getParams: function() {
                p = this.getCurrentCollection();
                p.query = this.getQuery();
                return p;
            },
	    treebuild: function (cmp,json) {
	        var resultTree = cmp;
                var root = resultTree.getRootNode();
		root.removeAllChildren();
		root.appendChild(this.json2leaf(json));
		root.setIcon(Ext.isArray(json) ? 'images/array.gif' : 'images/object.gif');

		root.expand.defer(50, root, [false, false]);
                root.item(0).expand(1);
	    },
	    gridbuild: function (node) {
		if (node.isLeaf()) {
		    node = node.parentNode;
		}
		if (!node.childNodes.length) {
		    node.expand(false, false);
		    node.collapse(false, false);
		}
		var source = {};
		for (var i = 0; i < node.childNodes.length; i++) {
		    var t = node.childNodes[i].text.indexOf(':');
		    if (t === -1) {
			source[node.childNodes[i].text] = '...';
		    } else {
			source[node.childNodes[i].text.substring(0, t)] = node.childNodes[i].text.substring(t + 1);
		    }
		}
	        var grid = Ext.getCmp('grid');
		grid.setSource(source);
	    },
	    json2leaf: function (json) {
		var ret = [];
		for (var i in json) {
		    if (json.hasOwnProperty(i)) {
			if (json[i] === null) {
			    ret.push({text: i + ' : null', leaf: true, icon: 'images/red.gif'});
			} else if (typeof json[i] === 'string') {
			    ret.push({text: i + ' : "' + json[i] + '"', leaf: true, icon: 'images/blue.gif'});
			} else if (typeof json[i] === 'number') {
			    ret.push({text: i + ' : ' + json[i], leaf: true, icon: 'images/green.gif'});
			} else if (typeof json[i] === 'boolean') {
			    ret.push({text: i + ' : ' + (json[i] ? 'true' : 'false'), leaf: true, icon: 'images/yellow.gif'});
			} else if (typeof json[i] === 'object') {
			    ret.push({text: i, children: this.json2leaf(json[i]), icon: Ext.isArray(json[i]) ? 'images/array.gif' : 'images/object.gif'});
			} else if (typeof json[i] === 'function') {
			    ret.push({text: i + ' : function', leaf: true, icon: 'images/red.gif'});
			}
		    }
		}
		return ret;
	    },
	    copyText: function () {
		if (!edit.getValue()) {
		    return;
		}
		Ext.ux.Clipboard.set(edit.getValue());
	    },
	    pasteText: function () {
		edit.setValue(Ext.ux.Clipboard.get());
	    },
	    searchStart: function () {
		if (!task) {
		    task = new Ext.util.DelayedTask(this.searchFn, this);
		}
		task.delay(150);
	    },
	    searchFn: function () {
	        var searchResultLabel = Ext.getCmp('searchResultLabel');
	        var searchTextField = Ext.getCmp('searchTextField');
		searchList = [];
		if (!searchTextField.getValue()) {
		    return;
		}
		this.searchInNode(root, searchTextField.getValue());
		if (searchList.length) {
		    searchResultLabel.setText('');
		    searchIndex = 0;
		    this.selectNode(searchList[searchIndex]);
		    searchTextField.focus();
		} else {
		    searchResultLabel.setText('Phrase not found!');
		}
	    },
	    searchInNode: function (node, text) {
		if (node.text.toUpperCase().indexOf(text.toUpperCase()) !== -1) {
		    searchList.push(node);
		    //return true;
		}
		var isExpanded = node.isExpanded();
		node.expand(false, false);
		for (var i = 0; i < node.childNodes.length; i++) {
		    if (this.searchInNode(node.childNodes[i], text)) {
			//return true;
		    }
		}
		if (!isExpanded) {
		    node.collapse(false, false);
		}
		//return false;
	    },
	    selectNode: function (node) {
                var root = resultTree.getRootNode();
		node.select();
		resultTree.fireEvent('click', node);
		while (node !== root) {
		    node = node.parentNode;
		    node.expand(false, false);
		}				
	    },
	    searchNext: function () {
		if (!searchList || !searchList.length) {
		    return;
		}
		searchIndex = (searchIndex + 1) % searchList.length;
		this.selectNode(searchList[searchIndex]);
	    },
	    searchPrevious: function () {
		if (!searchList || !searchList.length) {
		    return;
		}
		searchIndex = (searchIndex - 1 + searchList.length) % searchList.length;
		this.selectNode(searchList[searchIndex]);
	    },
	    toggleToolbar: function () {
		resultTree.toggleBbar();
	        if (resultTree.getBottomToolbar().isVisible()) {
	            var searchTextField = Ext.getCmp('searchTextField');
		    searchTextField.focus(true);
		}

	    },
	    format: function () {
		var text = edit.getValue().split("\n").join(" ");
		var t = [];
		var tab = 0;
		var inString = false;
		for (var i = 0, len = text.length; i < len; i++) {
		    var c = text.charAt(i);
		    if (inString && c === inString) {
			// TODO: \\"
			if (text.charAt(i - 1) !== '\\') {
			    inString = false;
			}
		    } else if (!inString && (c === '"' || c === "'")) {
			inString = c;
		    } else if (!inString && (c === ' ' || c === "\t")) {
			c = '';
		    } else if (!inString && c === ':') {
			c += ' ';
		    } else if (!inString && c === ',') {
			c += "\n" + String.space(tab * 2);
		    } else if (!inString && (c === '[' || c === '{')) {
			tab++;
			c += "\n" + String.space(tab * 2);
		    } else if (!inString && (c === ']' || c === '}')) {
			tab--;
			c = "\n" + String.space(tab * 2) + c;
		    }
		    t.push(c);
		}
		edit.setValue(t.join(''));
	    },
	    removeWhiteSpace: function () {
		var text = edit.getValue().split("\n").join(" ");
		var t = [];
		var inString = false;
		for (var i = 0, len = text.length; i < len; i++) {
		    var c = text.charAt(i);
		    if (inString && c === inString) {
			// TODO: \\"
			if (text.charAt(i - 1) !== '\\') {
			    inString = false;
			}
		    } else if (!inString && (c === '"' || c === "'")) {
			inString = c;
		    } else if (!inString && (c === ' ' || c === "\t")) {
			c = '';
		    }
		    t.push(c);
		}
		edit.setValue(t.join(''));
	    },
	    loadJson: function (url) {
		if (document.location.hash !== '#' + url) {
		    document.location.hash = url;
		}
		Ext.getBody().mask('Loading url: ' + url, 'x-mask-loading');
		Ext.Ajax.request({
		    url: 'readjson.php',
		    params: {
			url: url
		    },
		    success: function (response) {
			Ext.getCmp('edit').setValue(response.responseText);
			mongog.format();
			Ext.getBody().unmask();
		    },
		    failure: function (response) {
			Ext.getBody().unmask();
		    }
		});
	    }
	};
    }();



    var urlWindow = function () {
	var win = null;
	return {
	    init: function() {
		win = new Ext.Window({
		    title: document.title,
		    width: 400,
		    minWidth: 400,
		    height: 100,
		    minHeight: 100,
		    maxHeight: 100,
		    layout: 'form',
		    closeAction: 'hide',
		    bodyStyle: 'padding: 0',
		    border: false,
		    labelWidth: 25,
		    items: {
			xtype: 'textfield',
			fieldLabel: 'Url',
			value: 'http://',
			width: 350
		    },
		    buttonAlign: 'center',
		    buttons: [{
			text: 'Load JSON data!',
			handler: function () {
			    mongog.loadJson(win.items.get(0).getValue());
			    win.hide();
			}
		    }],
		    listeners: {
			resize: function (win, width, height) {
			    win.items.get(0).setWidth(width - 50);
			}
		    }
		});
	    },
	    show: function () {
		if (!win) {
		    this.init();
		}
		win.show();
	    }
	};
    }();


    
//    Ext.BLANK_IMAGE_URL = 'lib/extjs/images/default/s.gif';	
    Ext.QuickTips.init();

    var ctrlF = new Ext.KeyMap(document, [
        {
	    key: Ext.EventObject.F,
	    ctrl: true,
	    stopEvent: true,
	    fn: function () {
	        mongog.toggleToolbar();
	    }
        },
        {
	    key: Ext.EventObject.R,
	    ctrl: true,
	    stopEvent: true,
	    fn: function () {
                mongog.runQuery()
	    }        
        },
        {
	    key: Ext.EventObject.T,
	    ctrl: true,
	    stopEvent: true,
	    fn: function () {
                queryTabPanel.newTab();
	    }        
        },
    ]);
    

    function newPropertyGrid(idx) {
        return new Ext.grid.PropertyGrid({
	    id: 'grid'+idx,
	    region: 'east',
	    width: 300,
	    split: true,
	    listeners: {
	        beforeedit: function () {
	    	    return false;
	        }
	    },
	    selModel: new Ext.grid.RowSelectionModel(),
	    onRender: Ext.grid.PropertyGrid.superclass.onRender
        });
    }

    function newResultTreePanel(idx) {
        return new Ext.tree.TreePanel({
    	    id: 'resultTree'+idx,
            title:'Results',
            //    	xtype: 'treepanel',
    	    region: 'center',
            rootVisible: false,
	    loader: new Ext.tree.TreeLoader(),
	    lines: true, 
            root: new Ext.tree.TreeNode({text: 'JSON'}),
            autoScroll: true,
            trackMouseOver: false,
            listeners: {
                render: function (tree) {
        	    tree.getSelectionModel().on('selectionchange', function (tree, node) {
        	        mongog.gridbuild(node);
        	    });
                }
            },
            bbar: [
                'Search:',
                new Ext.form.TextField({
		    xtype: 'textfield',
		    id: 'searchTextField'
	        }),
	        new Ext.Button({
	            text: 'GO!',
	            handler:  function () {
	                mongog.searchStart();
	            }
	        }),
	        new Ext.form.Label({
	            id: 'searchResultLabel',
	            style: 'padding-left:10px;font-weight:bold'
	        }), {
	            iconCls: Ext.ux.iconCls.get('images/arrow_down.png'),
	            text: 'Next',
	            handler: function () {
	                mongog.searchNext();
	            }
	        }, {
	            iconCls: Ext.ux.iconCls.get('images/arrow_up.png'),
	            text: 'Previous',
	            handler: function () {
	                mongog.searchPrevious();
	            }
	        }
	    ]
        });
    }

 function newDataPanel(idx) {
        return new Ext.tree.TreePanel({
    	    id: 'dataPanel'+idx,
            layout: 'fit',
            title: 'Coll Data',
            rootVisible: false,
	    loader: new Ext.tree.TreeLoader(),
	    lines: true, 
            root: new Ext.tree.TreeNode({text: 'JSON'}),
            autoScroll: true,
            trackMouseOver: false,
            listeners: {
                activate: function(p) {
                    mongog.onFetchCollectionData();
                },
                render: function (tree) {
        	    tree.getSelectionModel().on('selectionchange', function (tree, node) {
        	        mongog.gridbuild(node);
        	    });
                }
            },
        });
    }

    var execQuery = function() {
        var myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Executing Query..."});
        myMask.show();
        Ext.Ajax.request({
	    url: 'query',
	    params: mongog.getParams(),
	    success: function ( response ) {
                mongog.check_text(response.responseText);
                myMask.hide();
	    },
            failure: function (response) {
                myMask.hide();
                Ext.Msg.alert('Error','I believe this just means no data came back. Need to look into it');

            }
        });

    };
    
    function newMongoQuery(p,s,f) {
        Ext.Ajax.request({
	    url: 'query',
	    params: p,
	    success: s,
            failure: function (response) {
                Ext.Msg.alert('fail','fail');
            }
        });
    }


    var dbPanel = {
        id: 'dbPanel',
        region: 'west',
        xtype: 'treepanel',
        rootVisible: false,
        autoScroll:true,
        animate:true,
        dataUrl: 'show_dbs',
        root: { 
            text: 'Hosts',
            id: 'source',
            expanded:true,
        },
        listeners: {
            click: function(node,e) {
                var parts = node.getPath('text').split('/');
                if(parts.length == 5) {
                    p = {}
                    p.host = parts[2];
                    p.db = parts[3];
                    p.coll = parts[4];
                    
                    mongog.setCurrentCollection(p);
                    mongog.onFetchCollectionDataMaybe();
                }
            },
            dblclick: function(node,e) {
                var parts = node.getPath('text').split('/');
                if(parts.length == 5) {
                    p = {}
                    p.host = parts[2];
                    p.db = parts[3];
                    p.coll = parts[4];
                    
                    mongog.setCurrentCollection(p);
                    mongog.onFetchCollectionData();
                }
            }
        },
        title: 'Database',
        width: '200',
        split: true
    };
   
    function newResultsPanel(idx){
        return new Ext.Panel({
	    id: 'resultsPanel'+idx,
	    layout: 'border',
	    title: 'Results',
	    items: [
                newResultTreePanel(idx), 
            ]
        });
    }
    
    // function newDataPanel(idx) {
    //     return new Ext.Panel({
    //         id: 'dataPanel'+idx,
    //         layout: 'fit',
    //         title: 'Coll Data',
    //         html: 'This tab will show you sample data from a collection'
    //     });
    // }

    function newStatsPanel(idx) {
        return new Ext.Panel({
            id: 'statsPanel'+idx,
            layout: 'fit',
            title: 'Statistics',
        html: 'This tab will give you statistics about the host,db,collection you click on. What should we put here???'
        });
    }

    function newInfoTabPanel(idx) {
        return new Ext.TabPanel({
            id: 'infoTabPanel'+idx,
            region: 'center',
            title: 'Info',
            activeTab: 0,
            items:[
                newResultTreePanel(idx),
                newDataPanel(idx),
                newStatsPanel(idx)
            ],
            resultPanel: function() {
                return this.items.itemAt(0);
            },
            dataPanel: function() {
                return this.items.itemAt(1);
            },
            statsPanel: function() {
                return this.items.itemAt(2);
            },
            listeners: {
            }
        });
    }

    function newEditPanel(idx) {
        return new Ext.Panel( {
	    id: 'editPanel'+idx,
            height: 200,
            split: true,
	    layout: 'fit',
            region: 'north',
	    tbar: [
	        // {text: 'Paste', handler: function () {
	        //     mongog.pasteText();
	        // }},
	        // {text: 'Copy', handler: function () {
	        //     mongog.copyText();
	        // }},
	        {text: 'Run Query', handler: function() { mongog.runQuery()}},
	        '-',
	        {text: 'Format', handler: function () {
		    mongog.format();
	        }},
                ' ',
	        {text: 'Remove white space', handler: function () {
		    mongog.removeWhiteSpace();
	        }},
	        '-',
	        // {text: 'Load JSON data', handler: function () {
	        //     urlWindow.show();
	        // }},
	        '->',
	        {text: 'About', handler: aboutWindow}
                
	    ],
	    items: new Ext.form.TextArea({
                id: 'edit'+idx,
	        style: 'font-family:monospace',
	        emptyText: 'Enter your query in JSON format here!',
	        selectOnFocus: true
            }),
            getQuery: function() {
                var rval = "";
                var edit = this.items
                if(edit) {
                    rval = edit.getValue();
                }
                Ext.Msg.alert("getQuery",rval);
                return rval;
            },
        
        });
    }
    

    function newQueryPanel(idx) {
        return new Ext.Panel( {
            id: 'queryPanel' +idx,
            layout: 'border',
	    title: 'Query',
            closable: true,
            items: [
                newEditPanel(idx),
                newInfoTabPanel(idx),
            ],
            editPanel: function() {
                return this.items.itemAt(0);
            },
            getQuery: function() {
                this.editPanel().items.itemAt(0).getValue()
            },
            infoTabPanel: function() {
                return this.items.itemAt(1);
            },
            listeners: {
                activate: function(p) {
                    mongog.setActiveQueryPanel(p);
                    
                },
                close: function(p) {
                    mongog.deleteQueryPanel(p);
                } 
            }
        });

    }
    
    var queryTabPanel = new Ext.TabPanel( {
        id: 'queryTabPanel',
        region: 'center',
        title: 'Query',
        activeTab: 0,
        newTab: function() {
            var count = this.items.length;
            var newPanel = newQueryPanel(tabCounter);
            tabCounter++;
            this.insert(count -1, newPanel);
            this.setActiveTab(count-1);
            mongog.addQueryPanel(newPanel);
        },
    });


    var adderPanel = new Ext.Panel({
        //Fake tab that puts a '+' sign on the tab-bar that will add new tabs
        id: 'adderPanel',
        title: '+',
        listeners: {
            activate: function(p) {
                queryTabPanel.newTab();
            }
        }
    });

    queryTabPanel.add(adderPanel);


    
    function viewJson() {
        mongog.check();
    }

    var vp = new Ext.Viewport({
	layout: 'border',
	items: [
            dbPanel,
            queryTabPanel,
        ]
    });

    if (document.location.hash && document.location.hash.length) {
	mongog.loadJson(document.location.hash.substring(1));
    }
});
