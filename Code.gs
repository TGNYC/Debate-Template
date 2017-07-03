//New Additions:
// - auto sidebar fix
// - document stats in the Tools menu
// - added ability to set insertion points in speech docs!
// - added ability to select a document as the current speech doc
//   (visual bug: if an open doc becomes a speech doc, or if an open speech doc becomes a regular doc, the send to speech / set insertion button
//                will have the wrong text but will work correctly)

var CLEAR = "CLEAR";
var EMPHASIS = "EMPHASIS";
var UNDERLINE = "UNDERLINE";
var CITE = "CITE";

var TAG = "TAG";
var BLOCK = "BLOCK";
var HAT = "HAT";
var POCKET = "POCKET";

var HIGHLIGHT = "HIGHLIGHT";

function onInstall() {
  onOpen();
}

function onOpen() {
  
  var sideBarMenuText = "Show Sidebar";
  if(getAutoShowSidebar()) {
    try {
      refreshSidebar();
    }
    catch(e) {
      sideBarMenuText += " (Auto)";
    }
  }
  
  var ui = DocumentApp.getUi();
  ui.createAddonMenu()
       
      .addItem('Condense', 'condense')
      .addItem('Pocket', 'pocket')
      .addItem('Hat', 'hat')
      .addItem('Block', 'block')
      .addItem('Tag', 'tag')
      .addItem('Cite', 'cite')
      .addItem('Underline', 'underline')
      .addItem('Emphasis', 'emphasis')
      .addItem('Highlight', 'highlight')
      .addItem('Clear', 'clear')
      .addItem('Shrink', 'shrink')
      .addSeparator()
      .addItem('Open Speech', 'openSpeechDoc')
      .addItem('New Speech', 'newSpeechDoc')
      .addItem('Send to Speech / Set Insertion Point', 'sendToSpeechDoc')
      .addItem('Mark Speech', 'mark')
      .addItem('Choose Speech', 'chooseSpeechDoc')
      .addSeparator()
      .addSubMenu(ui.createMenu("Tools")
                  .addItem('Create Cites Doc', 'createCitesDoc')
                  .addItem('Create Wiki Doc', 'createWikiDoc')
                  .addItem('Standardize Highlighting', 'standardizeHighlighting') 
                  .addItem('Analyze Speech Doc', 'analyzeSpeech')
                 )
      .addItem(sideBarMenuText, 'refreshSidebar') 
      .addItem('Preferences', 'preferences')  
      .addToUi();
    
  
  var body = DocumentApp.getActiveDocument().getBody();
  setupAttributes(body);
    
}

//return true if the active doc is the current speech doc
function isSpeechDoc() {
  var doc = currentSpeechDoc();
  if(doc === null)
    return false;
    
  return DocumentApp.getActiveDocument().getId() === doc.getId();
}

function clearInsertionPoint() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty("insertionAtElement");
  userProperties.deleteProperty("insertionOffSet");
}

function setInsertionPoint(elem, offset) {
  
    var userProperties = PropertiesService.getUserProperties();
    var body = currentSpeechDoc().getBody();
        
    var spot = 0;
    
    while(elem.getParent().getType() != DocumentApp.ElementType.BODY_SECTION) {
      elem = elem.getParent();
    }
    
    spot = body.getChildIndex(elem);
    
    userProperties.setProperty("insertionAtElement", spot); 
    userProperties.setProperty("insertionOffSet", offset + ""); 
}

function getInsertionPoint() {
  var userProperties = PropertiesService.getUserProperties();
  var ici = userProperties.getProperty("insertionAtElement");
  var ioffset = userProperties.getProperty("insertionOffSet");

  if(ici === null || ioffset === null) {
    //DocumentApp.getUi().alert("Null properties");
    return null;
  }
  
  var doc = currentSpeechDoc();
  if(doc === null)
    return;
  
  if(ici >= doc.getBody().getNumChildren()) {
    //DocumentApp.getUi().alert("Element not found");
    clearInsertionPoint();
    return null;
  }
  
  var child = doc.getBody().getChild(ici);
  
  return doc.newPosition(child, ioffset);
}

function analyzeSpeech() {
  var cards = countCards();
  var characters = speechCharacterCount();
  var charPerWord = charactersPerWord();
  var wpm = wordsPerMinute();
  var seconds = (60.0 * characters) / (charPerWord * wpm);
  
  var time = "";
  if(seconds < 60)
    time = Math.ceil(seconds) + " seconds";
  else
    time = Math.floor(seconds / 60) + " minutes and " + Math.ceil(seconds % 60) + " seconds";
  
  var output = HtmlService.createHtmlOutput('<link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons1.css"> <script>function update() {var cards = parseInt(document.getElementById("cardCount").innerText); var characters = parseInt(document.getElementById("characters").innerText); var charPerWord = parseInt(document.getElementById("lettersPerWord").value); var wpm = parseInt(document.getElementById("wordsPerMinute").value); var seconds = (60.0 * characters) / (charPerWord * wpm); var time = ""; if(seconds < 60) time = Math.ceil(seconds) + " seconds"; else time = Math.floor(seconds / 60) + " minutes and " + Math.ceil(seconds % 60) + " seconds"; document.getElementById("time").innerHTML = time; google.script.run.setWordsPerMinute(wpm); google.script.run.setCharactersPerWord(charPerWord); } </script> <b>Card Count: <span id="cardCount">' + cards + '</span></b><br> <b>Character Count: <span id="characters">' + characters + '</span></b> (tags, cites, and highlighted characters)<br><br> <b>Estimated Speech Time: <span id="time">' + time + '</span></b> <div><label for="lettersPerWord">Average Letters Per Word: </label><input type="number" id="lettersPerWord" value="' + charPerWord + '"></div> <div><label for="wordsPerMinute">Average Words Per Minute: </label><input type="number" id="wordsPerMinute" value="' + wpm + '"></div><button class="action" onclick="update();">Update Time Estimate</button><div class="bottom"><button class="action" onclick="google.script.host.close()">Close</button></div>').setSandboxMode(HtmlService.SandboxMode.IFRAME);
  DocumentApp.getUi().showModelessDialog(output, "Speech Doc Analysis");
}

function wordsPerMinute() {
  var userProperties = PropertiesService.getUserProperties();
  var wpm = userProperties.getProperty("wordsPerMinute");
    
  if(wpm !== null) {
    return parseInt(wpm);
  }
  
  return 350;
}

function setWordsPerMinute(wpm) {
  PropertiesService.getUserProperties().setProperty("wordsPerMinute", wpm)
}

function charactersPerWord() {
  var userProperties = PropertiesService.getUserProperties();
  var cpw = userProperties.getProperty("charactersPerWord");
  
  if(cpw !== null) {
    return parseInt(cpw);
  }
  
  return 5;
}

function setCharactersPerWord(cpw) {
  PropertiesService.getUserProperties().setProperty("charactersPerWord", cpw)
}

function countCards() {
  var body = DocumentApp.getActiveDocument().getBody();
  var count = 0;
  var tagQueued = false;
  
  for(var i = 0; i < body.getNumChildren() - 1; i++) {
    
    var child = body.getChild(i);
    var head = child.asParagraph().getHeading();
    var rank = headingRank(head); //-1 or 0 are just text
    
    //tag
    if(rank == 1) {
      tagQueued = true;
    }
    else if(rank < 1 && tagQueued) { //text
      if(child.asText().getText().trim().length > 0) {
        count++;
        tagQueued = false;
      }
    }
    else {
      tagQueued = false;
    }
    
  }
  return count;
}

function speechCharacterCount() {
  var body = DocumentApp.getActiveDocument().getBody();
  var count = 0;
  
  for(var i = 0; i < body.getNumChildren(); i++) {
    
    var child = body.getChild(i);
    var head = child.asParagraph().getHeading();
    var rank = headingRank(head); //-1 or 0 are just text
    
    //tag
    if(rank == 1) {
      count += child.asText().getText().replace(/ /g,'').length;
    }
    else if(rank < 1) { //text - need to check if cite or highlighted
      var text = child.asText();
      var str = text.getText();
      
       var indices = text.getTextAttributeIndices();
       indices.push(str.length-1);
    
      for(var pos = 0; pos < indices.length-1; pos++) {
        var j = indices[pos];
        var e = indices[pos+1];
      
        var charCode = str.charCodeAt(j);
        var back = text.getBackgroundColor(j);

        if(back != "#FFFFFF" && back != null)
          count += str.substring(j, e).replace(/ /g,'').length;
        else if(text.isBold(j) && text.isUnderline(j) && text.getFontSize(j) == 13 && text.getFontFamily(j) == "Calibri")
          count += str.substring(j, e).replace(/ /g,'').length;
      }
    }
  }
  
  return count;
}

//need to have this open the cites doc that is created
function createCitesDoc() {
  var doc = DocumentApp.create(DocumentApp.getActiveDocument().getName() + " Cites");
  setupAttributes(doc.getBody());
  
  //move to the speeches folder
  var folderID = getSpeechDocFolderID();
  if(folderID != null) {
    var file = DriveApp.getFileById(doc.getId());
    var folder = DriveApp.getFolderById(folderID);
    folder.addFile(file);
    
  }
  
  var body = DocumentApp.getActiveDocument().getBody();
  var count = body.getNumChildren();
  
  var run = 0;
  
  for(var i = 0; i < count; i++) {
    var child = body.getChild(i);
    var head = child.asParagraph().getHeading();
    var rank = headingRank(head); //-1 or 0 are just text
    
    if(rank <= 0) {
      
      var text = child.asText().getText();
      if(text.length !== 0) {
        
        if(run === 0)
          doc.getBody().appendParagraph(child.copy());
        else if(run === 1) {
          //only want a part of this text
          
          var clone;
          if(text.length > 224) {
            var clone = child.copy();
            clone.asText().deleteText(112, text.length - 1).setBackgroundColor("#FFFFFF");
            doc.getBody().appendParagraph(clone);
            doc.getBody().appendParagraph("...AND...");
            
            clone = child.copy();
            clone.asText().deleteText(0, text.length - 1 - 112).setBackgroundColor("#FFFFFF");
            doc.getBody().appendParagraph(clone);
          }
          else
            doc.getBody().appendParagraph(child.asText().copy());
          
          doc.getBody().appendParagraph("");
        }
        
        run++;
      }
      
    }
    else {
      doc.getBody().appendParagraph(child.copy());
      run = 0;
    }
  }
  
  var output = HtmlService.createHtmlOutput('<script>window.open("' + doc.getUrl() + '"); google.script.host.close();</script>').setSandboxMode(HtmlService.SandboxMode.IFRAME);
  DocumentApp.getUi().showModelessDialog(output, "Opening");
}

function createWikiDoc() {
  var doc = DocumentApp.create(DocumentApp.getActiveDocument().getName() + " Wiki");
  
  //move to the speeches folder
  var folderID = getSpeechDocFolderID();
  if(folderID != null) {
    var file = DriveApp.getFileById(doc.getId());
    var folder = DriveApp.getFolderById(folderID);
    folder.addFile(file);
    
  }
  
  var body = DocumentApp.getActiveDocument().getBody();
  var count = body.getNumChildren();
  
  var run = 0;
  
  for(var i = 0; i < count; i++) {
    var child = body.getChild(i);
    var head = child.asParagraph().getHeading();
    var rank = headingRank(head);
    
    if(rank <= 0) {
      
      var text = child.asText().getText();
      if(text.length !== 0) {
        
        if(run === 0)
          doc.getBody().appendParagraph(text);
        else if(run === 1) {
          //only want a part of this text
          
          if(text.length > 224) {
            doc.getBody().appendParagraph(text.substring(0, 112));
            doc.getBody().appendParagraph("...AND...");            
            doc.getBody().appendParagraph(text.substring(text.length-1-112));
          }
          else
            doc.getBody().appendParagraph(text);
          
          doc.getBody().appendParagraph("");
          doc.getBody().appendParagraph("");
        }
        
        run++;
      }
      
    }
    else {
      //rank = 1 => 4, 2 => 3...
      
      var equalsChars = 5 - rank;
      
      var stripped = child.copy().asText().getText();
      
      for(var j = 0; j < equalsChars; j++) {
        stripped = "=" + stripped + "=";
      }
      
      doc.getBody().appendParagraph(stripped);
      
      if(rank != 1) {
        doc.getBody().appendParagraph("");
        doc.getBody().appendParagraph("");
      }
      
      run = 0;
    }
  }
  
  var output = HtmlService.createHtmlOutput('<script>window.open("' + doc.getUrl() + '"); google.script.host.close();</script>').setSandboxMode(HtmlService.SandboxMode.IFRAME);
  DocumentApp.getUi().showModelessDialog(output, "Opening");
}

function mark() {
  var cursor = DocumentApp.getActiveDocument().getCursor();
  if(cursor != null) {
    DocumentApp.getActiveDocument().addBookmark(cursor);
  }
}

function standardizeHighlighting() {
  var body = DocumentApp.getActiveDocument().getBody();
  var highlightColor = getHighlightColor();

  for(var i = 0; i < body.getNumChildren(); i++) {
    
    var child = body.getChild(i);
    var text = child.asText();
    
    var indices = text.getTextAttributeIndices();
    
    for(var pos = 0; pos < indices.length; pos++) {
      var start = indices[pos];
      var end;
      
      if(pos < indices.length - 1)
        end = indices[pos+1];
      else
        end = text.getText().length;
      
      var background = text.getBackgroundColor(start);
      
      if(background != null) {
        text.setBackgroundColor(start, end-1, highlightColor);
      }
    }
  }
    
}


function setupAttributes(body) {
  //regular text
  var attributes = body.getHeadingAttributes(DocumentApp.ParagraphHeading.NORMAL);
  attributes[DocumentApp.Attribute.FONT_FAMILY] = 'Calibri';
  attributes[DocumentApp.Attribute.FONT_SIZE] = 11;
  body.setHeadingAttributes(DocumentApp.ParagraphHeading.NORMAL, attributes);
  
  //tag
  attributes = body.getHeadingAttributes(DocumentApp.ParagraphHeading.HEADING4);
  attributes[DocumentApp.Attribute.FONT_FAMILY] = 'Calibri';
  attributes[DocumentApp.Attribute.FONT_SIZE] = 13;
  attributes[DocumentApp.Attribute.BOLD] = true;
  attributes[DocumentApp.Attribute.UNDERLINE] = false;
  attributes[DocumentApp.Attribute.FOREGROUND_COLOR] = "#000000";
  body.setHeadingAttributes(DocumentApp.ParagraphHeading.HEADING4, attributes);  
  
  //block
  attributes = body.getHeadingAttributes(DocumentApp.ParagraphHeading.HEADING3);
  attributes[DocumentApp.Attribute.FONT_FAMILY] = 'Calibri';
  attributes[DocumentApp.Attribute.FONT_SIZE] = 16;
  attributes[DocumentApp.Attribute.BOLD] = true;
  attributes[DocumentApp.Attribute.UNDERLINE] = true;
  body.setHeadingAttributes(DocumentApp.ParagraphHeading.HEADING3, attributes);  
  
  //hat
  attributes = body.getHeadingAttributes(DocumentApp.ParagraphHeading.HEADING2);
  attributes[DocumentApp.Attribute.FONT_FAMILY] = 'Calibri';
  attributes[DocumentApp.Attribute.FONT_SIZE] = 22;
  attributes[DocumentApp.Attribute.BOLD] = true;
  attributes[DocumentApp.Attribute.UNDERLINE] = true;
  body.setHeadingAttributes(DocumentApp.ParagraphHeading.HEADING2, attributes);
  
  //pocket
  attributes = body.getHeadingAttributes(DocumentApp.ParagraphHeading.HEADING1);
  attributes[DocumentApp.Attribute.FONT_FAMILY] = 'Calibri';
  attributes[DocumentApp.Attribute.FONT_SIZE] = 26;
  attributes[DocumentApp.Attribute.BOLD] = true;
  attributes[DocumentApp.Attribute.UNDERLINE] = true;
  body.setHeadingAttributes(DocumentApp.ParagraphHeading.HEADING1, attributes);
}

function getAutoShowSidebar() {
  var userProperties = PropertiesService.getUserProperties();
  var result = userProperties.getProperty("AUTO_SHOW_SIDEBAR");
  
  if(result == null)
    return false;
  return result === "true";
}

function setAutoShowSidebar(checked) {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty("AUTO_SHOW_SIDEBAR", checked);
}

function getHighlightColor() {
  var userProperties = PropertiesService.getUserProperties();
  var color = userProperties.getProperty("HIGHLIGHT_COLOR");
  
  if(color == null)
    return "#00FF00";
  return color;
}

function setHighlightColor(color) {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty("HIGHLIGHT_COLOR", color);
}

function setSpeechDocFolder(id) {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty("SPEECH_DOC_FOLDER", id);
}

function getSpeechDocFolderID() {
  var userProperties = PropertiesService.getUserProperties();
  var id = userProperties.getProperty("SPEECH_DOC_FOLDER");
  return id;
}

function getSpeechDocFolderHTML() {
  var id = getSpeechDocFolderID();
  if(id == null) {
    return "No folder has been selected";
  }
 
  var folder = DriveApp.getFolderById(id);
  return  '<a href="' + folder.getUrl() + '">' + folder.getName() + '</a>';
}

function preferences() {
  var html = HtmlService.createHtmlOutputFromFile('Preferences')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setWidth(300)
      .setHeight(200);
  DocumentApp.getUi()
      .showModalDialog(html, 'Debate Preferences');
}

function getOAuthToken() {
  DriveApp.getRootFolder();
  return ScriptApp.getOAuthToken();
}

function chooseSpeechDoc() {
  var html = HtmlService.createHtmlOutputFromFile('ChooseSpeechDoc')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setWidth(500)
      .setHeight(350);
  DocumentApp.getUi()
      .showModalDialog(html, 'Choose a Speech Doc');
}

function getSpeechDocHTML() {
  var userProperties = PropertiesService.getUserProperties();
  var id = userProperties.getProperty("CURRENT_SPEECH_DOC");
  if(id == null) {
    return "No file has been selected";
  }
 
  var file = DriveApp.getFolderById(id);
  return  '<a href="' + file.getUrl() + '">' + file.getName() + '</a>';
}

function setSpeechDocID(id) {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty("CURRENT_SPEECH_DOC", id);
}

function openSpeechDoc() {
  var url = currentSpeechDocURL();
  if(url == null) {
    DocumentApp.getUi().alert("You have to create a speech document first!");
    return;
  }
  
  var output = HtmlService.createHtmlOutput('<script>window.open("' + url + '"); google.script.host.close();</script>').setSandboxMode(HtmlService.SandboxMode.IFRAME);
  DocumentApp.getUi().showModelessDialog(output, "Opening");
}

function newSpeechDoc() {
  
  var url = createSpeechDoc();
  
  if(url !== null) {
    clearInsertionPoint();
    openSpeechDoc();
  }
}

function createSpeechDoc() {
  
  var response = DocumentApp.getUi().prompt("Name your speech");
  
  if (response.getSelectedButton() == DocumentApp.getUi().Button.OK) {
  
    var speech = response.getResponseText();
    
    var doc = DocumentApp.create(speech);
    setupAttributes(doc.getBody());
    
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty("CURRENT_SPEECH_DOC", doc.getId());
    
    var folderID = getSpeechDocFolderID();
    if(folderID != null) {
      var file = DriveApp.getFileById(doc.getId());
      var folder = DriveApp.getFolderById(folderID);
      folder.addFile(file);
      
    }
    
    return currentSpeechDoc().getUrl();
  }
  
  return null;
}

function currentSpeechDoc() {
  var userProperties = PropertiesService.getUserProperties();
  var id = userProperties.getProperty("CURRENT_SPEECH_DOC");
  
  if(id != null) {
    return DocumentApp.openById(id);
  }
  
  return null;
}

function currentSpeechDocURL() {
  var doc = currentSpeechDoc();
  if(doc != null)
    return doc.getUrl();
  return null;
}

function headingRank(head) {
  if(head == DocumentApp.ParagraphHeading.NORMAL)
    return 0;
  else if(head == DocumentApp.ParagraphHeading.HEADING4)
    return 1;
  else if(head == DocumentApp.ParagraphHeading.HEADING3)
    return 2;
  else if(head == DocumentApp.ParagraphHeading.HEADING2)
    return 3;
  else if(head == DocumentApp.ParagraphHeading.HEADING1)
    return 4;
  return -1;
}

function sendToSpeechDoc() { 
    
  var cursor = DocumentApp.getActiveDocument().getCursor();
  
  if(isSpeechDoc()) {
    setInsertionPoint(cursor.getElement(), cursor.getOffset());
    return;
  }

  var speechDoc = currentSpeechDoc();
  if(speechDoc == null) {
    DocumentApp.getUi().alert("You have to create a speech document first!");
    return;
  }
  
  var speechBody = speechDoc.getBody();
  
  var shouldRemoveFirst = false;
  if(speechBody.getText() == "") {
    shouldRemoveFirst = true;
  }
  
  if(cursor != null)
  {
    
    var element = cursor.getElement();
    element = element.getParent();
    
    //can't convert the body section
    if(element.getType() === DocumentApp.ElementType.BODY_SECTION) {
        if(element.asBody().getNumChildren() > 0)
          element = element.asBody().getChild(0);
        else
          return;
    }
    var paragraphHeading = headingRank(element.asParagraph().getHeading());
    
    
    var body = DocumentApp.getActiveDocument().getBody();
    var index = body.getChildIndex(element);
   
    sendElementToSpeechDoc(element.copy());
    
    index++;
    while(index < body.getNumChildren()) {
    
      var nextChild = body.getChild(index);
      
      var head = nextChild.asParagraph().getHeading();
    
      if(headingRank(head) < paragraphHeading) {
        sendElementToSpeechDoc(nextChild.copy());
      }
      else
        break;
      
      index++;
    }
  }
  else {
    var range = DocumentApp.getActiveDocument().getSelection();
    var rangeElements = range.getRangeElements();
    for(var i = 0; i < rangeElements.length; i++) {
      var rangeElement = rangeElements[i];
      var element = rangeElement.getElement();
      
      if(rangeElement.isPartial()) {
        var par = element.getParent().copy();
        var el = par.asText();
        el.deleteText(rangeElement.getEndOffsetInclusive()+1, element.asText().getText().length-1);
        el.deleteText(0, rangeElement.getStartOffset()-1);
        sendElementToSpeechDoc(par);
      }
      else {
        sendElementToSpeechDoc(element.copy());
      }
    }
  }
  
  if(shouldRemoveFirst) {
    speechBody.removeChild(speechBody.getChild(0));
  }
}

function sendElementToSpeechDoc(elem) {
  
  var doc = currentSpeechDoc();
  var body = doc.getBody();
  
  //need to insertion point code...
  var point = getInsertionPoint();
  
  //just add to the end
  if(point === null)
    body.appendParagraph(elem);
  else {
    
    var insertInto = point.getElement();
    var insertIntoChildIndex = body.getChildIndex(insertInto);
    var insertIntoLoc = point.getOffset();
    var insertIntoType = insertInto.getType();
    
    //do the insert
    var par;
    if(insertIntoLoc === 0) { 
      body.insertParagraph(insertIntoChildIndex, elem); 
      
      if(!elem.isAtDocumentEnd()) setInsertionPoint(body.getChild(insertIntoChildIndex), 1);
    }
    else {
      body.insertParagraph(insertIntoChildIndex+1, elem);
      if(!elem.isAtDocumentEnd()) setInsertionPoint(body.getChild(insertIntoChildIndex+1), 1);
    }
  }
}

var destinationSize = 11;

function shrink() {
  
  //need to find first non-speech part and take its font-size - we'll base the rest of the shrink on that:
  //>8 => 8
  //5-8 => 4-7
  //<4 => 11
  
  var rangeBuilder = DocumentApp.getActiveDocument().newRange();
  destinationSize = 11;
  
  var cursor = DocumentApp.getActiveDocument().getCursor();
  if(cursor != null) {
    var element = cursor.getElement();
    fastShrinkElement(element, rangeBuilder);
  }
  else {
     var range = DocumentApp.getActiveDocument().getSelection();
     var rangeElements = range.getRangeElements();
    
     var i = 0;
     var rangeElement = rangeElements[i];
     var element = rangeElement.getElement();
              
     fastShrinkElement(element, rangeBuilder);
      
  }
  
  var rangeElements = rangeBuilder.getRangeElements();
  DocumentApp.getActiveDocument().setSelection(rangeBuilder.build());
  
  var targetSize;
  if(destinationSize > 8)
    targetSize = 8;
  else if(destinationSize > 4)
    targetSize = destinationSize-1;
  else
    targetSize = 11;
  for(var i = 0; i < rangeElements.length; i++) {
      var rangeElement = rangeElements[i];
      var element = rangeElement.getElement();
      var text = element.asText();
    
      text.setFontSize(rangeElement.getStartOffset(), rangeElement.getEndOffsetInclusive(), targetSize);
  }
  
}

function fastShrinkElement(element, rangeBuilder) {
  var parent;
  if(element.getType() == DocumentApp.ElementType.PARAGRAPH) {
    parent = element;
  }
  else {
    parent = element.getParent();
  }  
  
  var ph = parent.asParagraph().getHeading();
  
  var text = element.asText();
  
  var indices = text.getTextAttributeIndices();
  
  if(indices.length == 0)
    indices.push(0);
  
  for(var pos = 0; pos < indices.length; pos++) {
     var i = indices[pos];
     if(!((text.getFontSize(i) == 11 || ph == DocumentApp.ParagraphHeading.NORMAL) && text.isUnderline(i))) {
        
        var fontSize = text.getFontSize(i);
        if(fontSize == null && ph == DocumentApp.ParagraphHeading.NORMAL)
          fontSize = 11;
       
        if(rangeBuilder.getRangeElements().length == 0) {
          destinationSize = fontSize;
        }
       
        var end = text.getText().length-1;
        if(pos != indices.length-1)
          end = indices[pos+1];
        rangeBuilder.addElement(text, i, end);
     }
  }
}


function condense() {
  var cursor = DocumentApp.getActiveDocument().getCursor();
  if(cursor == null) {
    
    var range = DocumentApp.getActiveDocument().getSelection();
    var rangeElements = range.getRangeElements();
    
    if(rangeElements.length > 1) {
      var rangeElement = rangeElements[0];
      var element = rangeElement.getElement();
      element.asText().appendText(" ");
    }
    
    for(var i = 1; i < rangeElements.length; i++) {
      var rangeElement = rangeElements[i];
      var element = rangeElement.getElement();
      element.asText().appendText(" ");
      
      if(element.getType() === DocumentApp.ElementType.PARAGRAPH)
        element.merge();
      else
        element.getParent().asParagraph().merge();
    }
  }
}

function clear() {
  applyFormat(CLEAR);
}

function underline() {
  applyFormat(UNDERLINE);
}

function emphasis() {
  applyFormat(EMPHASIS);
}

function highlight() {
  applyFormat(HIGHLIGHT)
}

function tag() {
  applyHeader(TAG);
}

function block() {
  applyHeader(BLOCK);
}

function hat() {
  applyHeader(HAT);
}

function pocket() {
  applyHeader(POCKET);
}

function cite() {
  applyFormat(CITE);
}

function applyHeader(header) {
  var cursor = DocumentApp.getActiveDocument().getCursor();
  if(cursor != null) {
    var element = cursor.getElement();
    
    if(header === TAG)
      tagElement(element);
    else if(header === BLOCK)
      blockElement(element);
    else if(header === HAT)
      hatElement(element);
    else if(header === POCKET)
      pocketElement(element);
  }
  else {
    var range = DocumentApp.getActiveDocument().getSelection();
    var rangeElements = range.getRangeElements();
    
    for(var i = 0; i < rangeElements.length; i++) {
      var rangeElement = rangeElements[i];
      var element = rangeElement.getElement();
      
      if(header === TAG)
        tagElement(element);
      else if(header === BLOCK)
        blockElement(element);
      else if(header === HAT)
        hatElement(element);
      else if(header === POCKET)
        pocketElement(element);
    }
  }
}

function tagElement(element) {
  var text = element.editAsText();
    
  while(element.getType() != DocumentApp.ElementType.PARAGRAPH) {
    var next = element.getParent();
    if(next == null) {
      //never found a paragraph...
      return;
    }
    else {
      element = next;
    }
  }
  
  element = element.asParagraph();
  element.setHeading(DocumentApp.ParagraphHeading.HEADING4);
  element.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
  text.setFontFamily("Calibri").setFontSize(13).setBold(true).setUnderline(false).setForegroundColor("#000000");
}

function blockElement(element) {

    var text = element.editAsText();
    
    while(element.getType() != DocumentApp.ElementType.PARAGRAPH) {
      var next = element.getParent();
      if(next == null) {
        //never found a paragraph...
        return;
      }
      else {
        element = next;
      }
    }
    
    element = element.asParagraph();
    element.setHeading(DocumentApp.ParagraphHeading.HEADING3);
    element.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    text.setFontFamily("Calibri").setFontSize(16).setBold(true).setUnderline(true);
}

function hatElement(element) {
    var text = element.editAsText();
    
    while(element.getType() != DocumentApp.ElementType.PARAGRAPH) {
      var next = element.getParent();
      if(next == null) {
        //never found a paragraph...
        return;
      }
      else {
        element = next;
      }
    }
    
    element = element.asParagraph();
    element.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    element.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    text.setFontFamily("Calibri").setFontSize(22).setBold(true).setUnderline(true);
}

function pocketElement(element) {

    var text = element.editAsText();
    
    while(element.getType() != DocumentApp.ElementType.PARAGRAPH) {
      var next = element.getParent();
      if(next == null) {
        //never found a paragraph...
        return;
      }
      else {
        element = next;
      }
    }
    
    element = element.asParagraph();
    element.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    element.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    text.setFontFamily("Calibri").setFontSize(26).setBold(true).setUnderline(false);
}

function applyFormat(format) {
  
  
  var body = DocumentApp.getActiveDocument().getBody();
  var cursor = DocumentApp.getActiveDocument().getCursor();
  
  if(cursor != null) {
    var element = cursor.getElement();
        
    if(element.getType() == DocumentApp.ElementType.TEXT) {
      
      if(format === CLEAR && element.getParent().getType() == DocumentApp.ElementType.PARAGRAPH) {
        //reset defaults for a paragraph
        clearParagraph(element.getParent().asParagraph());
      }
      
      //set the defaults for only the text surrounding the cursor
      formatTextAtPosition(format, element.asText(), cursor.getOffset());
    }
    else if(element.getType() == DocumentApp.ElementType.PARAGRAPH) {
      
      //just set the defaults for this paragraph
      if(format === CLEAR)
        clearParagraph(element.asParagraph());
      
      //if we have no children, then clear the whole paragraph
      if(element.asParagraph().getNumChildren() == 0) {  
        formatText(format, element.asParagraph().editAsText());
      }
      else {
        var child = element.asParagraph().getChild(0);
        if(child.getType() == DocumentApp.ElementType.TEXT)
          formatTextAtPosition(format, child, cursor.getOffset());
      }
      
    }
    else if(element.getType() == DocumentApp.ElementType.LIST_ITEM) {
      
      var listItem = element.asListItem();
      var pos = indexOfChild(body, listItem);
      
      body.insertParagraph(pos, listItem.getText());
      
      //now to set defaults for this paragprah
      if(format === CLEAR)
        clearParagraph(body.getChild(pos).asParagraph());
      
      listItem.removeFromParent();
    }
    else {
      //try to clear it as text?
      if(format === CLEAR && element.getParent().getType() == DocumentApp.ElementType.PARAGRAPH) {
        //reset defaults for a paragraph
        clearParagraph(element.getParent().asParagraph());
      }
      
      //set the defaults for only the text surrounding the cursor
      formatTextAtPosition(format, element.asText(), cursor.getOffset());
    }
  }
  else {
    var range = DocumentApp.getActiveDocument().getSelection();
    var rangeElements = range.getRangeElements();
    
    Logger.log(rangeElements.length);
    
    for(var i = 0; i < rangeElements.length; i++) {
      
      var rangeElement = rangeElements[i];
      var element = rangeElement.getElement();
      var text = element.asText();
      
      if(rangeElement.isPartial()) {
        var start = rangeElement.getStartOffset();
        var end = rangeElement.getEndOffsetInclusive();
        formatTextInRange(format, text, start, end);
      }
      else {
        formatText(format, text);
      }
    }
                
  }
}

function formatText(format,text) {
  if(format === CLEAR) {
    text.setBackgroundColor(null);
    text.setBold(null);
    text.setFontFamily("Calibri");
    text.setFontSize(11);
    text.setForegroundColor(null);
    text.setItalic(null);
    text.setLinkUrl(null);
    text.setStrikethrough(null);
    text.setTextAlignment(DocumentApp.TextAlignment.NORMAL);
    text.setUnderline(null);
  }
  else if(format === EMPHASIS) {
    text.setBold(true);
    text.setUnderline(true);
    text.setFontSize(11);
    text.setFontFamily("Calibri");
  }
  else if(format === CITE) {
    text.setBold(true);
    text.setUnderline(false);
    text.setFontSize(13);
    text.setFontFamily("Calibri");
  }
  else if(format === HIGHLIGHT) {
    text.setBackgroundColor(getHighlightColor());
  }
  else if(format === UNDERLINE) {
    text.setUnderline(true);
  }
}

function formatTextAtPosition(format, text, pos) {
  var str = text.getText();
  var lo = pos;
  var hi = pos;
  
  while(lo > 0 && !isWhiteSpace(str.substring(lo-1, lo))) {
    lo--;
  }
  
  while(hi+1 < str.length && !isWhiteSpace(str.substring(hi+1, hi+2))) {
    hi++;
  }
  
  formatTextInRange(format, text, lo, hi);
}

function formatTextInRange(format, text, lo, hi) {
    
  if(format === CLEAR) {
    text.setBackgroundColor(lo, hi, null);
    text.setBold(lo, hi, null);
    text.setFontFamily(lo, hi, "Calibri");
    text.setFontSize(lo, hi, 11);
    text.setForegroundColor(lo, hi, null);
    text.setItalic(lo, hi, null);
    text.setLinkUrl(lo, hi, null);
    text.setStrikethrough(lo, hi, null);
    text.setTextAlignment(lo, hi, DocumentApp.TextAlignment.NORMAL);
    text.setUnderline(lo, hi, null);
  }
  else if(format === EMPHASIS) {
    text.setBold(lo, hi, true);
    text.setUnderline(lo, hi, true);
    text.setFontSize(lo, hi, 11);
    text.setFontFamily(lo, hi, "Calibri");
  }
  else if(format === CITE) {
    text.setBold(lo, hi, true);
    text.setUnderline(lo, hi, false);
    text.setFontSize(lo, hi, 13);
    text.setFontFamily(lo, hi, "Calibri");
  }
  else if(format === HIGHLIGHT) {
    text.setBackgroundColor(lo, hi, getHighlightColor());
  }
  else if(format === UNDERLINE) {
    text.setUnderline(lo, hi, true);
  }
}

function clearParagraph(par) {

  par.setIndentEnd(null);
  par.setIndentFirstLine(null);
  par.setIndentStart(null);
  par.setLeftToRight(true);
  par.setLineSpacing(null);
  par.setLinkUrl(null);
  par.setSpacingAfter(null);
  par.setSpacingBefore(null);
  par.setTextAlignment(DocumentApp.TextAlignment.NORMAL);
  par.setHeading(DocumentApp.ParagraphHeading.NORMAL);
}

function isWhiteSpace(letter) {
  
  return letter === '\n' || letter === ' ' || letter === '\t' || letter === '\r' || letter === '\v';
  
}

function indexOfChild(parent, child) {
  var count = parent.getNumChildren();
  for(var i = 0; i < count; i++) {
    if(isSameElement(parent.getChild(i), child))
      return i;
  }
  return -1;
}

function bodyPath(el, path) {
  path = path? path: [];
  var parent = el.getParent();
  var index = parent.getChildIndex(el);
  path.push(index);
  var parentType = parent.getType();
  if (parentType !== DocumentApp.ElementType.BODY_SECTION) {
    path = bodyPath(parent, path);
  } else {
    return path;
  };
  return path;
}

function isSameElement(element1, element2) {
  var path1 = bodyPath(element1);
  var path2 = bodyPath(element2);
  if (path1.length == path2.length) {
    for (var i=0; i<path1.length; i++) {
      if (path1[i] !== path2[i]) {
        return false;
      };
    };
  } else {
    return false;
  };
  return true;
}

function refreshSidebar() {
  
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle('Debate Tools')
      .setWidth(100);
  
  DocumentApp.getUi().showSidebar(html);
}
