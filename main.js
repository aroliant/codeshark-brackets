/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, console */

define(function (require, exports, module) {
    "use strict";
    
	var CommandManager      = brackets.getModule("command/CommandManager"),
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager"),
        Menus               = brackets.getModule("command/Menus"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
		Dialogs				= brackets.getModule("widgets/Dialogs"),
		PreferencesManager	= brackets.getModule("preferences/PreferencesManager"),
		prefs				= PreferencesManager.getExtensionPrefs("CodeShark"),
        QuickOpen           = brackets.getModule("search/QuickOpen");
    
    var _commandList;
    var whichEditor;
	
	function init() {
				
		if (prefs.get("apikey")) {
			getProgramFromServer();
		} else {
			promptForApiKey();
		}
		
		
	}
	
    function promptForApiKey() {

        var dialog, codeSharkKey, $input, $okButton;

        dialog  = Dialogs.showModalDialog('DefaultDialogs', 'Enter your Code Shark api key:', '<input type="text" id="code-shark-key" name="code-shark" value="' + prefs.get("apikey") + '" style="width: 97.5%;"/>', [{ className: Dialogs.DIALOG_BTN_CLASS_PRIMARY + ' code-shark-ok', id: Dialogs.DIALOG_BTN_OK, text: 'Ok' }, { id: Dialogs.DIALOG_BTN_CANCEL, text: 'Cancel'}]);
        $input = $('#code-shark-key');
        $okButton = $('.code-shark-ok');
        $okButton.on('click', function (event) {
            if ($input.val()) {
                prefs.set("apikey", $input.val());
                prefs.save();
            }
        });
    }
	
	function getProgramFromServer() {
			
		_commandList = [];

		$.ajax({
			url: "https://api.codeshark.live/api/programs/",
			type: "POST",
			beforeSend: function (xhr) {
				xhr.setRequestHeader('X-API-Key', prefs.get("apikey"));
			},
			success: function (data, status) {

				if (status === "success") {

					for (var i = 0; i < data.programs.length; i++){
						_commandList.push({
							id: data.programs[i].program_id.toString(),
							name: data.programs[i].title
						});
					}

					getAllPrograms();
				}			   
			}
		});
		
    }
	
	function setupPreferences() {
       
		prefs.definePreference("apikey", "string", "");
        prefs.definePreference("ignore", "array", ["^/tmp/", "^/private/"]);
        if (prefs.getPreferenceLocation('ignore').scope === 'default') {
            prefs.set('ignore', prefs.get('ignore'));
            prefs.save();
        }
    }
	
    
	
	function done(){
		
	}
        
   
    function search(query, matcher) {
		
        query = query.substr(1); 
        
        var stringMatch = (matcher && matcher.match) ? matcher.match.bind(matcher) : QuickOpen.stringMatch;
        
        var filteredList = $.map(_commandList, function (commandInfo) {
            
            
            var searchResult = stringMatch(commandInfo.name, query);
            if (searchResult) {
                searchResult.id = commandInfo.id;
            }
            return searchResult;
        });
        
        QuickOpen.basicMatchSort(filteredList);

        return filteredList;
		
		
    }

    function match(query) {
        if (query.indexOf(">") === 0) {
            return true;
        }
    }

	
    function itemSelect(selectedItem) {
		
		var url = 'https://api.codeshark.live/api/program/';
      
		$.ajax({
			url: url.concat(selectedItem.id),
			type: "POST",
			beforeSend: function (xhr) {
				xhr.setRequestHeader('X-API-Key', prefs.get("apikey"));
			},
			success: function (data, status) {
				
				if(status == "success"){
										
					if (data.success == true){
						
						var editor = EditorManager.getFocusedEditor();
						if (editor) {
							var template = data.program.program;
							var inPos = editor.getCursorPos();
							editor.document.replaceRange(template,inPos);
						}
					}
					
				}			   
			}
		});
		
	
    }
    
    
    function resultFormatter(item) {
		
        var displayName = QuickOpen.highlightMatch(item);
		
		return "<li>" + displayName + "</li>";
    }
    
    
    QuickOpen.addQuickOpenPlugin(
        {
            name: "Programs",
            label: "Programs",  
            languageIds: [],  
            fileTypes:   [],  
            done: done,
            search: search,
            match: match,
            itemFocus: function () {},
            itemSelect: itemSelect,
            resultsFormatter: resultFormatter
        }
    );
    
    function getAllPrograms() {
		
        whichEditor = EditorManager.getFocusedEditor();
        
        QuickOpen.beginSearch(">");
    }
	
	

    
    var SEARCH_COMMAND_ID = "live.codeshark.plugin.searchPrograms";
    CommandManager.register("Search Code", SEARCH_COMMAND_ID, init);
    
    var menu = Menus.getMenu(Menus.AppMenuBar.FIND_MENU);
	
	menu.addMenuDivider(Menus.FIRST);
    menu.addMenuItem(SEARCH_COMMAND_ID, [
        {key: "Ctrl-Alt-1", displayKey: "Ctrl-Alt-1", platform: "win"},
        {key: "Ctrl-Cmd-1", displayKey: "Ctrl-Cmd-1", platform: "mac"}
    ], Menus.FIRST);

	
	
	var SEARCH_COMMAND = "live.codeshark.plugin.addApiKey";
    CommandManager.register("Add CodeShark API Key", SEARCH_COMMAND, promptForApiKey);
    
    var menu1 = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
	
	menu1.addMenuDivider(Menus.FIRST);
	menu1.addMenuItem(SEARCH_COMMAND, [
        {key: "Ctrl-Alt-2", displayKey: "Ctrl-Alt-2", platform: "win"},
        {key: "Ctrl-Cmd-2", displayKey: "Ctrl-Cmd-2", platform: "mac"}
    ], Menus.FIRST);
	
});
