var menuItemElements = {};

var addOnMenu = null;
var menu = null;

var menuMap = {};
menuMap["Condense"] = {accel:"F3", keycode:114, cntrlKey:false, found:false};
menuMap["Pocket"] = {accel:"F4", keycode:115, cntrlKey:false, found:false};
menuMap["Hat"] = {accel:"F5", keycode:116, cntrlKey:false, found:false};
menuMap["Block"] = {accel:"F6", keycode:117, cntrlKey:false, found:false};
menuMap["Tag"] = {accel:"F7", keycode:118, cntrlKey:false, found:false};
menuMap["Cite"] = {accel:"F8", keycode:119, cntrlKey:false, found:false};
menuMap["Underline"] = {accel:"F9", keycode:120, cntrlKey:false, found:false};
menuMap["Emphasis"] = {accel:"F10", keycode:121, cntrlKey:false, found:false};
menuMap["Highlight"] = {accel:"F11", keycode:122, cntrlKey:false, found:false};
menuMap["Clear"] = {accel:"F12", keycode:123, cntrlKey:false, found:false};
menuMap["Shrink"] = {accel:"Cntrl+8", keycode:56, cntrlKey:true, found:false};

//these are duplicated because I changed the name of the menus
menuMap["Send to Speech"] = {accel:"~", keycode:192, cntrlKey:false, found:false, fullScreen:false};
menuMap["Send to Speech / Set Insertion Point"] = {accel:"~", keycode:192, cntrlKey:false, found:false, fullScreen:false};
menuMap["Mark"] = {accel:"~", keycode:192, cntrlKey:false, found:false, fullScreen:true};
menuMap["Mark Speech"] = {accel:"~", keycode:192, cntrlKey:false, found:false, fullScreen:true};

//used for a hack that allows you to select a menu item twice in a row
menuMap["Preferences"] = {accel:"", keycode:-1, cntrlKey:false, found:false, fullScreen:false};

var attemptCounter = 30;

function load() {
    findAddOnMenu();
    listenForNavItems();
}

function findAddOnMenu() {
    var targets = document.getElementsByClassName("goog-control");
    
    var foundMenu = false;
    for(var i = 0; i < targets.length; i++) {
        if(targets[i].innerText.indexOf("Add-ons") == 0) {
            foundMenu = true;
            addOnMenu = targets[i];
        }
    }
    
    if(!foundMenu) {
        if(attemptCounter === 0) {
            console.log("Couldn't find add-on menu!");
            return;
        }
        
        setTimeout(findAddOnMenu, 1000);
        console.log("Finding Add-On Menu...");
        attemptCounter--;
    }
    else {
    
        findDebateMenu();
    }
}

function findDebateMenu() {
    var targets = document.getElementsByClassName("goog-menuitem-content");
    
    var foundMenu = false;
    for(var i = 0; i < targets.length; i++) {
        if(targets[i].innerText.indexOf("Debate Template") == 0) {
            foundMenu = true;
            menu = targets[i].parentElement;
        }
    }
    
    if(!foundMenu) {
        
        if(attemptCounter === 0) {
            console.log("Couldn't find debate menu!");
            return;
        }
        
        setTimeout(findDebateMenu, 1000);
        console.log("Finding Debate Menu...");
        attemptCounter--;
    }
    else {
        setupKeyEvents();
        
        var evObj = document.createEvent('Events');
        evObj.initEvent('mousedown', true, false);
        addOnMenu.dispatchEvent(evObj);
        
        evObj = document.createEvent('Events');
        evObj.initEvent('mousedown', true, false);
        menu.dispatchEvent(evObj);
        
        evObj = document.createEvent('Events');
        evObj.initEvent('mouseup', true, false);
        menu.dispatchEvent(evObj);

        var menuItems = document.getElementsByClassName("goog-menuitem-content");
        for(i = 0; i < menuItems.length; i++) {
        
            if(menuItems[i].innerText === "Show Sidebar (Auto)") {
                        
                evObj = document.createEvent('Events');
                evObj.initEvent('mousedown', true, false);
                addOnMenu.dispatchEvent(evObj);
                
                evObj = document.createEvent('Events');
                evObj.initEvent('mousedown', true, false);
                menu.dispatchEvent(evObj);
                
                evObj = document.createEvent('Events');
                evObj.initEvent('mousedown', true, false);
                menuItems[i].dispatchEvent(evObj);
                
                evObj = document.createEvent('Events');
                evObj.initEvent('mouseup', true, false);
                menuItems[i].dispatchEvent(evObj);
            }
        
            if(menuItems[i].innerText === "Help")
                break;
        
            if(menuItems[i].innerText in menuMap) {
            
                var menuInfo = menuMap[menuItems[i].innerText];
 
                menuItemElements[menuItems[i].innerText] = menuItems[i].parentElement;
                    
                var span = document.createElement("span");
                span.setAttribute("class", "goog-menuitem-accel");
                span.setAttribute("aria-label", "shortcut " + menuInfo.accel);
                span.setAttribute("style", "-webkit-user-select: none;");
                span.innerHTML = menuInfo.accel;
                menuItems[i].appendChild(span);
                
                menuInfo.found = true;
            }
        }
        
        if(!attachedContextualMenu) {
            attachContextalMenu();
        }
        
        evObj = document.createEvent('Events');
        evObj.initEvent('mousedown', true, false);
        addOnMenu.dispatchEvent(evObj);
    }
}

function setupKeyEvents() {
    var targets = document.getElementsByClassName("docs-texteventtarget-iframe");
    
    if(targets.length === 0) {
        console.log("Couldn't find text area...");
        return;
    }
    
    var target = targets[0];
    
    target.contentDocument.childNodes[0].addEventListener("keydown", function(event) {
       var full = isFullScreen();
        //try to do page up, down in reading mode
       if(full) {
            var change = 0;
            if(event.keyCode == 38) change = -window.innerHeight + 30;
            else if(event.keyCode == 40) change = window.innerHeight - 30;
            //don't allow anything besides ~ (marks) and esc (end read mode)
            else if(event.keyCode != 192 && event.keyCode != 27) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return false;
            }
            
            if(change !== 0) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                
                var editor = document.getElementsByClassName("kix-appview-editor")[0];
                var top = editor.scrollTop;
                if(top === null)
                    top = 0;
                else
                    top = parseInt(top);
                    
                editor.scrollTop = top+change;
                console.log("scroll");
                
                return false;
            }
        } 
    });
    
    target.contentDocument.addEventListener("keydown", function(event) {
        var full = isFullScreen();
        var selectedMenu = null;
        
        /*if(event.keyCode == 192) {
            if(!full) selectedMenu = "Send to Speech";
            else selectedMenu = "Mark";
        }
        else if(event.keyCode == 114) selectedMenu = "Condense";
        else if(event.keyCode == 115) selectedMenu = "Pocket";
        else if(event.keyCode == 116) selectedMenu = "Hat";
        else if(event.keyCode == 117) selectedMenu = "Block";
        else if(event.keyCode == 118) selectedMenu = "Tag";
        else if(event.keyCode == 119) selectedMenu = "Cite";
        else if(event.keyCode == 120) selectedMenu = "Underline";
        else if(event.keyCode == 121) selectedMenu = "Emphasis";
        else if(event.keyCode == 122) selectedMenu = "Highlight";
        else if(event.keyCode == 123) selectedMenu = "Clear";
        else if(event.keyCode == 56 && event.ctrlKey) selectedMenu = "Shrink";*/
        
        for(key in menuMap) {
            value = menuMap[key];
            if(value.found) {
                if(event.keyCode == value.keycode && value.cntrlKey == event.ctrlKey) {
                    if(value.fullScreen === undefined || full === value.fullScreen) {
                        selectedMenu = key;
                        break;
                    }
                }
            }
        }
        
        console.log(selectedMenu);
        
        if(selectedMenu !== null) {
            //make chrome ignore this key event
            event.preventDefault();
            
            //open the debate menu
            var evObj = document.createEvent('Events');
            evObj.initEvent('mousedown', true, false);
            menu.dispatchEvent(evObj);
            
            //hack - same menu can't be selected twice in a row
            //solution - partially select Preferences menu (has no hotkey)
            evObj = document.createEvent('Events');
            evObj.initEvent('mousedown', true, false);
            menuItemElements["Preferences"].dispatchEvent(evObj);
            
            //now actually select the menu we want
            evObj = document.createEvent('Events');
            evObj.initEvent('mousedown', true, false);
            menuItemElements[selectedMenu].dispatchEvent(evObj);
            
            evObj = document.createEvent('Events');
            evObj.initEvent('mouseup', true, false);
            menuItemElements[selectedMenu].dispatchEvent(evObj);
        }        
        
    } , false);
}

function isFullScreen() {
    var elem = document.getElementById("docs-menubars");
    return elem.style.display == "none";
}

var dc = "data-collapsed";
var fixDelay = 0;
var attachedContextualMenu = false;

function attachContextalMenu() {
    console.log("attaching");
    context.attach('.navigation-widget-container', [
                        {text: 'Show Top Level', action: function(e){
                            e.preventDefault();
                            
                            showAtLevel(1);
                        }},
                        {text: 'Show 1st and 2nd Levels', action: function(e){
                            e.preventDefault();
                            
                            showAtLevel(2);
                        }},
                        {text: 'Show 1st, 2nd and 3rd Levels', action: function(e){
                            e.preventDefault();
                            
                            showAtLevel(3);
                        }},
                        {text: 'Show All Levels', action: function(e){ //nothing is hidden!
                            e.preventDefault();
                            
                            showAtLevel(4);
                        }},
                        {text: 'Refresh Outline', action: function(e){ //nothing is hidden!
                            e.preventDefault();
                            
                            fixNavMap();
                        }}
                    ]);
}

function listenForNavItems() {

   $(document).on('DOMNodeInserted', function(e) {
    if((' ' + e.target.className + ' ').indexOf(' navigation-widget-container ') >= 0) {
        attachedContextualMenu = true;
        attachContextalMenu();
    }
    else if ((' ' + e.target.className + ' ').indexOf(' navigation-item-content ') >= 0) {
        
        //annoying that we need to wait till the last one is loaded
        fixDelay++;
        if(fixDelay == 1) {
            setTimeout(fixNavMap, 100);
        }
        
        
    }
    else if ((' ' + e.target.className + ' ').indexOf(' navigation-item ') >= 0) {
        
        e.target.setAttribute(dc, "false");
        
        if(e.target.getAttribute("aria-label") === null)
            e.target = e.target.parentElement;
            
        var myLevel = parseInt(e.target.getAttribute("aria-label").slice(-1));
        var previousElem = e.target.previousElementSibling;
       
        while(previousElem !== null && (' ' +previousElem.className + ' ').indexOf(" navigation-item ") >= 0) {
            var theirLevel = parseInt(previousElem.getAttribute("aria-label").slice(-1));
            
            if(theirLevel > myLevel) {
                var collapsed = previousElem.getAttribute(dc) == "true";
                var hidden = previousElem.style.display == 'none';
                if(hidden || collapsed) {
                    e.target.style.display = 'none';
                }
                break;
            }
            
            previousElem = previousElem.previousElementSibling;
        }
        
        if(navItemIsImmediateChild(e.target)) {
            e.target.previousElementSibling.childNodes[0].className = removeArrowClasses(e.target.previousElementSibling.childNodes[0].className);
            e.target.previousElementSibling.childNodes[0].className += e.target.previousElementSibling.getAttribute(dc) == "true" ? " collapsed-menu" : " expanded-menu";
        }
        else {
            e.target.previousElementSibling.childNodes[0].className += " empty-menu";
        }
        
        fixNavMap();
        
        e.target.addEventListener("mousedown", function() {
            var current = e.target;
            var currentLevel = parseInt(current.getAttribute("aria-label").slice(-1));
            var collapsed = current.getAttribute(dc) == "true";

            e.target.setAttribute(dc, collapsed ? "false" : "true");
            e.target.childNodes[0].className = removeArrowClasses(e.target.childNodes[0].className);
            
            if(navItemHasChildren(e.target))
                e.target.childNodes[0].className += collapsed ? " expanded-menu" : " collapsed-menu";
            else
                e.target.childNodes[0].className += " empty-menu";
            
            var levs = [];
            var coll = [];
            levs.push(currentLevel);
            coll.push(!collapsed);
            
            while(levs.length !== 0) {

               var next = current.nextElementSibling;
               if(next !== null) {

                 var nextLevel = parseInt(next.getAttribute("aria-label").slice(-1));

                 while(levs.length !== 0 && levs[levs.length-1] >= nextLevel) {
                    levs.pop();
                    coll.pop();
                 }                    

                 var hide = levs.length !== 0 && coll[coll.length-1];
                 
                 next.style.display = hide  ? 'none' : 'block';

                 levs.push(nextLevel);
                 coll.push(hide || next.getAttribute(dc) == "true");

                 current = next;
             
               }
               else break;
            }
        });
    }
  });
}

function fixNavMap() {
    //wait some more
    if(fixDelay > 0) {
        fixDelay = 0;
        setTimeout(fixNavMap, 100);
        return;
    }

    var items = document.getElementsByClassName("navigation-item");
    
    var root = {value:"root", children:[], parent: null, level:-1};
    var lastNode = root;
    
    for(var i = 0; i < items.length; i++) {
        var item = items[i];
        var level = levelOfNavItem(item);
        
        while(level <= lastNode.level) {
            lastNode = lastNode.parent;
        }
        
        var newNode = {value:item, children:[], parent: lastNode, level:level};
        lastNode.children.push(newNode);
        lastNode = newNode;
    }
    
    for(var i = 0; i < root.children.length; i++)
        processMap(root.children[i]);
}

function processMap(theRoot) {

    var item = theRoot.value;
    var collapsed = item.getAttribute(dc) == "true";
    var children = theRoot.children.length;
    
    item.childNodes[0].className = removeArrowClasses(item.childNodes[0].className);
    
    //no children
    if(children == 0) {
        item.childNodes[0].className += " empty-menu";
        if(collapsed) {
            collapsed = false;
            item.setAttribute(dc, "false");
        }
    }
    //children
    else {
        item.childNodes[0].className += !collapsed ? " expanded-menu" : " collapsed-menu";
    }
    
    if(theRoot.parent.level == -1) { //don't hide top level stuff
        item.style.display = "block";
    }
    else {
        if( theRoot.parent.value.style.display == "none" ||
            theRoot.parent.value.getAttribute(dc) == "true" ) {
            item.style.display = "none";
        }
        else {
            item.style.display = "block";
        }
    }
    
    for(var i = 0; i < theRoot.children.length; i++)
        processMap(theRoot.children[i]);
}


function removeArrowClasses(string) {
    var pad = ' ' + string + ' ';
    
    var keys = [' expanded-menu ', ' collapsed-menu ', ' empty-menu '];
    
    for(var i = 0; i < keys.length; i++) {
        var pos = pad.indexOf(keys[i]);
        if(pos >= 0) {
            pad = pad.substring(0, pos) + pad.substring(pos + keys[i].length - 1);
        }
    }
    
    return pad.trim();
}

function showAtLevel(base) {
    var lowestLevel = 4;
    var items = document.getElementsByClassName("navigation-item");
    
    var onARoll = true;
    
    for(var i = 0; i < items.length; i++) {
        var level = parseInt(items[i].getAttribute("aria-label").slice(-1));
        
        items[i].childNodes[0].className = removeArrowClasses(items[i].childNodes[0].className);
        var collapsed = true;
        
        if(level <= lowestLevel || level <= base) {
        
            if(level == base || (onARoll && level > base))
                items[i].setAttribute(dc, true);
            else {
                items[i].setAttribute(dc, false);
                collapsed = false;
                onARoll = false;
            }
            
            items[i].style.display = 'block';
        }
        else {
            items[i].setAttribute(dc, true);
            items[i].style.display = 'none';
        }
        
        if(navItemHasChildren(items[i]))
            items[i].childNodes[0].className += !collapsed ? " expanded-menu" : " collapsed-menu";
        else
            items[i].childNodes[0].className += " empty-menu";
        
        if(level < lowestLevel)
            lowestLevel = level;
    }
}

function levelOfNavItemContent(cont) {
    var className = cont.className;
    var find = "navigation-item-content navigation-item-level-";
    var pos = className.indexOf(find);
    var level = className.substring(pos + find.length, pos + find.length + 1);
    return parseInt(level);
}

function levelOfNavItem(item) {
    return parseInt(item.getAttribute("aria-label").slice(-1));
}

function navItemHasChildren(item) {
    var nextSib = item.nextElementSibling;
    
    if(nextSib === null)
        return false;
    
    var currentLevel = parseInt(item.getAttribute("aria-label").slice(-1));
    var nextLevel = parseInt(nextSib.getAttribute("aria-label").slice(-1));
    
    return nextLevel > currentLevel;
}

function navItemIsImmediateChild(item) {
    var prevSib = item.previousElementSibling;
    
    if(prevSib == null || (' ' + prevSib.className + ' ').indexOf(" navigation-item ") < 0)
        return false;
    
    var currentLevel = parseInt(item.getAttribute("aria-label").slice(-1));
    var prevLevel = parseInt(prevSib.getAttribute("aria-label").slice(-1));
    
    return prevLevel < currentLevel;
}


/* 
 * Context.js
 * Copyright Jacob Kelley
 * MIT License
 */

var context = context || (function () {
    
	var options = {
		fadeSpeed: 100,
		filter: function ($obj) {
			// Modify $obj, Do not return
		},
		above: 'auto',
		preventDoubleContext: true,
		compress: false
	};

	function initialize(opts) {
		
		options = $.extend({}, options, opts);
		
		$(document).on('click', 'html', function () {
			$('.dropdown-context').fadeOut(options.fadeSpeed, function(){
				$('.dropdown-context').css({display:''}).find('.drop-left').removeClass('drop-left');
			});
		});
		if(options.preventDoubleContext){
			$(document).on('contextmenu', '.dropdown-context', function (e) {
				e.preventDefault();
			});
		}
		$(document).on('mouseenter', '.dropdown-submenu', function(){
			var $sub = $(this).find('.dropdown-context-sub:first'),
				subWidth = $sub.width(),
				subLeft = $sub.offset().left,
				collision = (subWidth+subLeft) > window.innerWidth;
			if(collision){
				$sub.addClass('drop-left');
			}
		});
		
	}

	function updateOptions(opts){
		options = $.extend({}, options, opts);
	}

	function buildMenu(data, id, subMenu) {
		var subClass = (subMenu) ? ' dropdown-context-sub' : '',
			compressed = options.compress ? ' compressed-context' : '',
			$menu = $('<ul class="dropdown-menu dropdown-context' + subClass + compressed+'" id="dropdown-' + id + '"></ul>');
        var i = 0, linkTarget = '';
        for(i; i<data.length; i++) {
        	if (typeof data[i].divider !== 'undefined') {
				$menu.append('<li class="divider"></li>');
			} else if (typeof data[i].header !== 'undefined') {
				$menu.append('<li class="nav-header">' + data[i].header + '</li>');
			} else {
				if (typeof data[i].href == 'undefined') {
					data[i].href = '#';
				}
				if (typeof data[i].target !== 'undefined') {
					linkTarget = ' target="'+data[i].target+'"';
				}
				if (typeof data[i].subMenu !== 'undefined') {
					$sub = ('<li class="dropdown-submenu"><a tabindex="-1" href="' + data[i].href + '">' + data[i].text + '</a></li>');
				} else {
					$sub = $('<li><a tabindex="-1" href="' + data[i].href + '"'+linkTarget+'>' + data[i].text + '</a></li>');
				}
				if (typeof data[i].action !== 'undefined') {
					var actiond = new Date(),
						actionID = 'event-' + actiond.getTime() * Math.floor(Math.random()*100000),
						eventAction = data[i].action;
					$sub.find('a').attr('id', actionID);
					$('#' + actionID).addClass('context-event');
					$(document).on('click', '#' + actionID, eventAction);
				}
				$menu.append($sub);
				if (typeof data[i].subMenu != 'undefined') {
					var subMenuData = buildMenu(data[i].subMenu, id, true);
					$menu.find('li:last').append(subMenuData);
				}
			}
			if (typeof options.filter == 'function') {
				options.filter($menu.find('li:last'));
			}
		}
		return $menu;
	}

	function addContext(selector, data) {
		
		var d = new Date(),
			id = d.getTime(),
			$menu = buildMenu(data, id);
			
		$('body').append($menu);
		
		
		$(document).on('contextmenu', selector, function (e) {
			e.preventDefault();
			e.stopPropagation();
			
			$('.dropdown-context:not(.dropdown-context-sub)').hide();
			
			$dd = $('#dropdown-' + id);
			if (typeof options.above == 'boolean' && options.above) {
				$dd.addClass('dropdown-context-up').css({
					top: e.pageY - 20 - $('#dropdown-' + id).height(),
					left: e.pageX - 13
				}).fadeIn(options.fadeSpeed);
			} else if (typeof options.above == 'string' && options.above == 'auto') {
				$dd.removeClass('dropdown-context-up');
				var autoH = $dd.height() + 12;
				if ((e.pageY + autoH) > $('html').height()) {
					$dd.addClass('dropdown-context-up').css({
						top: e.pageY - 20 - autoH,
						left: e.pageX - 13
					}).fadeIn(options.fadeSpeed);
				} else {
					$dd.css({
						top: e.pageY + 10,
						left: e.pageX - 13
					}).fadeIn(options.fadeSpeed);
				}
			}
		});
	}
	
	function destroyContext(selector) {
		$(document).off('contextmenu', selector).off('click', '.context-event');
	}
	
	return {
		init: initialize,
		settings: updateOptions,
		attach: addContext,
		destroy: destroyContext
	};
})();


$(document).ready(function(){
    context.init({preventDoubleContext: false});
    
    
});
