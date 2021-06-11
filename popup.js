/*=================================================================+
 |               Copyright (c) 2009 Oracle Corporation              |
 |                  Redwood Shores, California, USA                 |
 |                       All rights reserved.                       |
 +==================================================================+
 | FILENAME                                                         |
 |   popup.js                                                |
 |                                                                  |
 | HISTORY                                                          |
 |   31-DEC-2010 BMETIKAL  Created   
 |   28-MAR-2011 GURUVEN   Added processing icons for popup         |
 +==================================================================*/
 /* $Header: /fnddev/fnd/12.0/html/RCS/popup.js,v 120.12.12020000.72 2018/08/10 09:51:12 lmodugul ship $ */
 var ie5=document.all&&document.getElementById;
 var ns6=document.getElementById&&!document.all;
 var currentElement;
 var width = 500;
 var height = 300;
 var divid;
 var iframeid;
 var popupUrlId;
 var popupmodalDefault = false;
 var currentPopupObject;
 var detailsPopupURL;
 //bug 8526057
 var closeAnchorId;
 var keyPress = true;
 var tmr;
 var oldTitle=document.title;
 var t;
 var popupDiv;
 var parentOfPopupDiv;
 // bug 9255491
 // Object containing the initial state of the popup
 var initialPopupFormState;
 var popupFormName;
 var isParameterizedPopup = false;
 var newPopupState ;
 //ER 9406692:flexfields support in popup.
 var popupEnabledItemId;
 var hiddenPopupid;
 //This variable is introduced to stop opening of another popup when 
 //there user wants to retain exisitng popup with pending changes.
 var openPopup = true;
 
 var openPopupInCenter = false;
 
 /* Bug 13508598 - IOS - Hover Does not work out */
 /* All Hover actions on the item will be converted to click.
    Hover along with destination - First click will imitate hover 
    second click will fire href */
 var firstClickedElementID;
 var firstClikedElement;
 var savedLinkDest;
 var savedElementOnClick;
 var secondClikedElement;
 var secondClickedElementID;
 var twistedClick;
 var counter=0;
 var agentIOS = false;
 
 var DEFAULT_DIALOG_POPUP_ID ="defaultDialogPopup";
 var popupTitle;
 
 var savedDragPos
 var isPopupDrag = false;
 
 // check if we should detect the popup is dirty or not and show the warning message
 var ifWarnAboutChange = true;
 
 function initTablesInsidePopup(divid)
 {
      /* If the popup contains classic tables, the tables need to be 
 initialized
       * only when they are opened, they are not to be initialized on 
 load time
       */
      var ctListAttr = document.getElementById(divid).getAttribute('ctables');
      if(ctListAttr != null)
      {
        var ctList = ctListAttr.split(':');
        for(var i=0;i<ctList.length;i++)
        {
          if(ctList[i] == "") continue;
          else
          {
             var tableID = ctList[i];
             var tableContent = document.getElementById(tableID + ":Content");
             var verticalScrollEnabled = tableContent != null && tableContent.getAttribute('verticalscroll') != null && tableContent.getAttribute('verticalscroll') == "true";
             var contentDiv = document.getElementById('contentDiv:'+tableID);
             // If vertical scroll is enabled then set the height of content div and
             // set the view port height.
             if(verticalScrollEnabled)
             {
               scrollDiv = document.getElementById('scrollDiv:'+tableID);
               scrollToRow = parseInt(scrollDiv.getAttribute('scrolltorow'));
               var recordSize = parseInt(tableContent.getAttribute('records'));
               var ht = getTableHeight(tableContent,recordSize,document.getElementById("headerDiv:" + tableID) != null,scrollToRow,tableID,document.getElementById("headerDiv:" + tableID) != null);
               document.getElementById('contentDiv:'+tableID).style.height = ht + 'px';
               document.getElementById('viewPortHeight:' + tableID).value = contentDiv.style.height;
             }
             var method = "CTinitRichTableUI('" + tableID + "')";
             eval(method);
          }
        }
        CTaddEventToPPROnLoad();
      }
 
      /* If the popup contains advanced tables, the tables need to be 
 initialized
       * only when they are opened, they are not to be initialized on 
 load time
       */
      var atListAttr = document.getElementById(divid).getAttribute('atables');
      if(atListAttr != null)
      {
        var atList = atListAttr.split(':');
        for(var i=0;i<atList.length;i++)
        {
          if(atList[i] == "") continue;
          else
          {
             var tableID = atList[i];
             var tableContent = document.getElementById(tableID + ":Content");
             var verticalScrollEnabled = tableContent != null && tableContent.getAttribute('verticalscroll') != null && tableContent.getAttribute('verticalscroll') == "true";
             var contentDiv = document.getElementById('contentDiv:'+tableID);
             // If vertical scroll is enabled then set the height of content div and
             // set the view port height.
             if(verticalScrollEnabled)
             {
               scrollDiv = document.getElementById('scrollDiv:'+tableID);
               scrollToRow = parseInt(scrollDiv.getAttribute('scrolltorow'));
               var recordSize = parseInt(tableContent.getAttribute('records'));
               var ht = getTableHeight(tableContent,recordSize,document.getElementById("headerDiv:" + tableID) != null,scrollToRow,tableID,document.getElementById("headerDiv:" + tableID) != null);
               document.getElementById('contentDiv:'+tableID).style.height = ht + 'px';
               document.getElementById('viewPortHeight:' + tableID).value = contentDiv.style.height;
             }
             var method = "ATinitRichTableUI('" + tableID + "')";
             eval(method);
          }
        }
        ATaddEventToPPROnLoad();
      }
 }
 
 //show modal popup coverage
 function showModalWindow(isopen){
     var needmodalpopup = null;
     if(currentPopupObject && currentPopupObject.isModal!=null){
         needmodalpopup = currentPopupObject.isModal;
     }else{
     
         needmodalpopup = popupmodalDefault;
     }
     if(!needmodalpopup) 
          return;
          
     //fix 16591826, useing new resize function in oafcoreR122.js
     _adjustOverlaysize();
     
      if(isopen){
         pAttachEvent(document.getElementById('overlay'),["onclick","click"],pClickDocument,false);
              document.getElementById('overlay').style.display='';
            //  document.body.style.overflow = "hidden";
      }else{
              document.getElementById('overlay').style.display='none';
            //  document.body.style.overflow = 'auto';     
      }  
  
 }
 
 function createNewPopupObject(isModal,firesourceElement,popupId){
     var popupObject = new Object();
     popupObject["firesourceElement"] = firesourceElement;
     popupObject["popupId"] = popupId;
     if(isModal!=null)
     popupObject["isModal"] = isModal;
     return popupObject;
 }
 
 function getWindowSize(){
   var w = 630;var h = 460;
     //IE
     if(!window.innerWidth){
        if(!(document.documentElement.clientWidth == 0)){
            //strict mode
             w = document.documentElement.clientWidth;h = document.documentElement.clientHeight;
        } else{
            //quirks mode
            w = document.body.clientWidth;h = document.body.clientHeight;
        }
     } else {
            //w3c outerWidth/outerHeight is the size of window,bug 
            // innerWidth/innerHeight is the size of window content's area.
            //window.outer** is zero in ipad.22899419 
            w = (window.outerWidth != 0 && window.outerWidth<window.innerWidth)?window.outerWidth:window.innerWidth;
            h = (window.outerHeight !=0 && window.outerHeight<window.innerHeight)?window.outerHeight:window.innerHeight;
   }
     return {width:w,height:h};
 }
 
 var  POPUP_POSITION_DEFAULT = -1;
 var  POPUP_POSITION_CENTRE = 0;
 var  POPUP_POSITION_TOP_START = 1;
 var  POPUP_POSITION_TOP_END = 2; 
 var  POPUP_POSITION_BOTTOM_START = 3;
 var  POPUP_POSITION_BOTTOM_END = 4; 
 var  POPUP_POSITION_ABSOLUTE = 5;
 
 function decidePopupPosition(popupDiv,centre){
     var useCentrePostion = false;
     if(typeof(currentPopupObject.positionInfo)=='undefined')
     {
       if(centre)
         useCentrePostion = true;
       else return;
     }
     var scrollV = getScrollOfWindow();
      width=popupDiv.style.width;
      height=popupDiv.style.height;
     if(typeof(currentPopupObject.positionInfo)!='undefined')
     {
          //set popup on a position first,
         //it will set special position if needed.
          popupDiv.style.left = currentPopupObject.positionInfo.px +"px"; 
          popupDiv.style.top = currentPopupObject.positionInfo.py +"px"; 
     }
         //get page window size
         var windowSize = getWindowSize();
          //space between page margin, so, popup will not too close with page margin.
         var spacerValue = 15;
         //if having scroll bar, we need more spacer.
         if(scrollV.left!=0 || scrollV.top!=0){
            spacerValue = spacerValue+5;
         }
         
         //put popup in middle
         if(useCentrePostion || currentPopupObject.positionInfo.autoPosition ==POPUP_POSITION_CENTRE){
                popupDiv.style.left = scrollV.left + (windowSize.width-parseInt(width))/2 +"px";
                popupDiv.style.top = scrollV.top + (windowSize.height-parseInt(height))/2 +"px";
         }
         else if (currentPopupObject.positionInfo.autoPosition ==POPUP_POSITION_TOP_START){
                popupDiv.style.left = scrollV.left + spacerValue+"px";
                popupDiv.style.top = scrollV.top + spacerValue+"px";
         }
         else if(currentPopupObject.positionInfo.autoPosition ==POPUP_POSITION_TOP_END){
                popupDiv.style.left = scrollV.left + (windowSize.width-parseInt(width)-spacerValue) +"px";
                popupDiv.style.top = scrollV.top + spacerValue +"px";
         }
         else if (currentPopupObject.positionInfo.autoPosition ==POPUP_POSITION_BOTTOM_START){
                popupDiv.style.left = scrollV.left + spacerValue+"px";
                popupDiv.style.top = scrollV.top + (windowSize.height-parseInt(height)-spacerValue) +"px";
         }
         else if(currentPopupObject.positionInfo.autoPosition ==POPUP_POSITION_BOTTOM_END){
                popupDiv.style.left = scrollV.left + (windowSize.width-parseInt(width)-spacerValue) +"px";
                popupDiv.style.top = scrollV.top + (windowSize.height-parseInt(height)-spacerValue) +"px";
         }
         //in case the height is over than the browser height,just put the popup in the zero Y position.
         if(parseInt(popupDiv.style.top)<0)  popupDiv.style.top = "0px";
         if(parseInt(popupDiv.style.left)<0)  popupDiv.style.left = "0px";
 }
 
 function getScrollOfWindow()
 {
     var scrollTop =0;  var scrollLeft =0;
     if(typeof(window.pageYOffset) == 'number')
     {
         // DOM compliant, IE9+
         scrollTop = window.pageYOffset;
         scrollLeft = window.pageXOffset;
     }
     else
     {
        
         if(document.body)
         {
           
             if(document.body.scrollTop)
             scrollTop = document.body.scrollTop;
             if(document.body.scrollLeft)
             scrollLeft = document.body.scrollLeft;
         }
         
         //if upon way fail, then try below way to detect scroll value.
         if(document.documentElement)
         {
             // IE6+ standards compliant mode
             if(scrollTop==0 && document.documentElement.scrollTop)
             scrollTop = document.documentElement.scrollTop;
             if(scrollLeft==0 && document.documentElement.scrollLeft)
             scrollLeft = document.documentElement.scrollLeft;
         }
         
     }
     
     //Bug 18741639 - TST1224: CLICKING ON BUTTON IS NOT OPENING POPUP IN IE8 
     scrollLeft = (typeof(scrollLeft)) == "undefined"?0:scrollLeft;
     scrollTop = (typeof(scrollTop)) == "undefined"?0:scrollTop;
     
    //  return scrollTop;
      return {left:scrollLeft,top:scrollTop};
 }
  
 function initPopup(bean,popupId){
     var popupObject = createNewPopupObject(popupmodalDefault,bean,popupId);
 
     var arr =currentElement.split(":");
     var arrlength = arr.length;
     mydivid = "popup"+popupId;
     //bug21769617
     if(arrlength==3){
        mydivid = arr[0]+":"+mydivid+":"+arr[2];
     }
     
     //check and load popup position information
    // var positionInfo = document.getElementById("popupPositionInfo"+popupId);
    var popupB = document.getElementById(mydivid);
    if(popupB == null)
      popupB = document.getElementById("popup"+popupId);
    var popupdata = null;
    if(popupB!=null)
        popupdata = popupB.getAttribute("data");
 
     if(popupdata!=null){
          eval( "var CPopupPositionInfo="+popupdata);
          // assign position info to popup Object
          popupObject.positionInfo = CPopupPositionInfo;
     }
     //Bug 20769577
     var modalIndicator = popupB.getAttribute("ismodal"); 
     if("true" == modalIndicator)
     {
       popupObject["isModal"] = true;
     }
     //bug 20825297 
     currentPopupObject = popupObject;
     
 }
 
 
 function onclick_IOS(event,popupId,currentElement)
 {
   // This function will be called only in case of IOS.
   agentIOS = true;
   // When entering for the first time , save the element and its href.
  
   if(!event.target.id)
   {
     firstClickedElement = event.target.parentNode;
   }
   else
   {
     firstClickedElement = event.target;
   }
   //21761956
   if(savedElementOnClick!= undefined && firstClickedElement == savedElementOnClick){
     if("false" == popupDiv.getAttribute("aria-hidden") && counter == 0)
      counter++;
   }
   if(counter == 0)
   {
     firstClickedElementID = firstClickedElement.id;
     savedElementOnClick = document.getElementById(firstClickedElementID);
     savedLinkDest = firstClickedElement.href;
     // Since the href present always invokes the destination disable temporarily.
     firstClickedElement.href = "javascript:void(0)";
     counter++;
     showPopup(currentElement,popupId);
     return false;
   }
   else if(counter == 1)
   {
     if(!event.target.id)
     {
       secondClickedElement = event.target.parentNode;
     }
     else
     {
       secondClickedElement = event.target;
     }
     secondClickedElementID = secondClickedElement.id;
     if( firstClickedElementID == secondClickedElementID)
     {
       // Prev and current element are same.so close popup and invoke href.
       closeit();
       return true;
     }
     else
     {
       // Prev and current element are not the same.so clear all the var and
       // treat this as a fresh start.
       savedElementOnClick.href = savedLinkDest;
       counter = 0; 
       twistedClick = 1;
       firstClickedElement = null;
       secondClickedElement = null;
       savedLinkDest = null;
       savedElementOnClick = null;
       secondClickedElementID = null;
       firstClickedElementID = null;
       onclick_IOS(event,popupId,currentElement);
     }
   }
 }
 
 //This will get called on each ppr event so as to retain popup
 function showPopupOnPpr()
 {
         //8824028 -bmetikal
         if(divid != null){
           removeAndSetPopupDiv();
         }
         
         if(popupDiv != null && popupDiv.style.display != '' && !isParameterizedPopup)
           displayPopup();
 }
 //bug 9582958:bmetikal
 function showPopupWithFlex(popupEnabledItemId)
 {
     if(popupEnabledItemId != null)
     {
         hiddenPopupid = popupEnabledItemId.substr(popupEnabledItemId.indexOf("___")+3)
         popupEnabledItemId=popupEnabledItemId.substr(0,popupEnabledItemId.indexOf("___"))
     }
     currentElement=popupEnabledItemId;
     
     //we should using unique entrance to open popup, that is showPopup()
     //showPopupCommonCode(hiddenPopupid);
     var firesource = document.getElementById(popupEnabledItemId);
     var hPopup = document.getElementById(hiddenPopupid);
     if(firesource!=null && hPopup!=null)
       showPopup(firesource,hiddenPopupid);
     
 }
 //bug18317135:haiyunlin
 //20709830
 function saveCurrentElementId(sourceId) {
   if(sourceId == null) return;
   var hiddenInput = document.getElementById("openPopupSourceId");
   if(hiddenInput!= null)
   hiddenInput.value = sourceId; 
 }
 function removeCurrentElementId() { 
   var hiddenInput = document.getElementById("openPopupSourceId");
   if(hiddenInput!= null)
   hiddenInput.value = ""; 
 }
 
 function getScriptIDforPopupDisplay(bean,popupId,closing)
 {
   var beanElementID = closing ? currentPopupObject["firesourceElement"].id  : bean.id;
   var idTokens = beanElementID.split(':');
   var scriptVarID = (closing ? currentPopupObject["popupId"] : popupId) + '_displayed';
   
   if(idTokens.length == 3)
   {
     scriptVarID = idTokens[0] + '_oa_' + (closing ? currentPopupObject["popupId"] : popupId) + '_oa_' + idTokens[2] + '_displayed';
   }
   
   return scriptVarID;
 }
 
 function setHiddenValuesForPopupDisplay(eventVal, sourceVal, beanElementID)
 {
   document.getElementById('oaPopupValidateEvent').value = eventVal;
   document.getElementById('oaPopupValidateSource').value = sourceVal;
   document.getElementById('oaPopupValidateBeanId').value = beanElementID;
 
 }
 
 function showPopup(bean,popupId)
 {
     // 24578892: if couldn't find bean, get element of popupid
     if(bean == null && popupId != "")
     {
       bean = document.getElementById(popupId);
       openPopupInCenter = true;
     }
       
     if(bean.disabled) return;
     // If the bean should not be displayed on click, then
     // set the hidden values for the popup validate event 
     // and popup validate source and then return back.
     // PPR shall determine whether to open the popup or not.
     
     // Check if there is a hidden js variable for this popup bean.
     
     var scriptVarID = getScriptIDforPopupDisplay(bean,popupId,false);
     var varPresence = window[scriptVarID];
     
     if(scriptVarID != null && typeof(scriptVarID) != 'undefined' && typeof(varPresence) != 'undefined')
     {
       var boolVal = eval(scriptVarID);
       // Developer mentioned that the popup should not open.
       if(boolVal != null && !boolVal)
       {
         setHiddenValuesForPopupDisplay('true',popupId,bean.id);
         return;
       }
     }
     currentElement = bean.id;
     saveCurrentElementId(currentElement);
     //for skyros modal popup
     initPopup(bean,popupId);
 
     //required to close already open popup
     //bug 8721350-bmetikal
     if(divid != null)
     popupDiv = document.getElementById(divid);
     //we need to to call complete closeit method to close existing popup
     //previously we were just setting style:display to none
     //Bug 9941430 - decodeURI doesn't function in IE as message is escaped.So
     //Using unescape instead of decodeURI.
     if((popupDiv != null)&&(document.getElementById(closeAnchorId)!=null))
     eval(unescape(document.getElementById(closeAnchorId).href));
     
     if(openPopup)
     showPopupCommonCode(popupId);
 }
 function showPopupCommonCode(popupId)
 {
     popupEnabledItemId = document.getElementById("popupEnabledItemId");
     if(popupEnabledItemId != null)
     popupEnabledItemId.name="popupEnabledItemId"+currentElement+"___"+popupId; 
     
     var pprIframe= document.getElementById("_pprIFrame");
     var arr =currentElement.split(":");
     var arrlength = arr.length;
         
     divid = "popup"+popupId;
     iframeid="iframe"+popupId;
     popupUrlId="hiddenUrl"+popupId;
     //bug 8526057
     closeAnchorId="closeAnchor"+popupId;
     closeBarId = popupId;
     //add another condition: document.getElementById( divid+":"+arr[2] ) != null
     //the case only happen in table action,please see bug 18896410 and 18561942 
     //bug21769617
     if(arrlength==3 && document.getElementById(arr[0]+":"+divid + ":" + arr[2] ) != null){
       divid = arr[0]+":"+divid+":"+arr[2];
       iframeid=arr[0]+":"+iframeid+":"+arr[2];
       popupUrlId=arr[0]+":"+popupUrlId+":"+arr[2];
       //bug 8526057
       closeAnchorId=arr[0]+":"+closeAnchorId+":"+arr[2];
       closeBarId  =arr[0]+":"+ closeBarId +":"+arr[2]+":skyroscloseBar";
     } else {
       closeBarId += "skyroscloseBar";
     }
     
     if(document.getElementById(popupUrlId) != null)
       isParameterizedPopup = true;
     //To avoid redunndant call to document.getElementById started using popupDiv
     if(divid != null)
       popupDiv = document.getElementById(divid);
     //8824028 -bmetikal
     if(pprIframe){
       //28462290
       //Use addEventListener if it is available,else use the attachEvent method of IE
       if(pprIframe.addEventListener)
          pprIframe.addEventListener("load", showPopupOnPpr, false);         
       else if(pprIframe.attachEvent)
          pprIframe.attachEvent("onload", showPopupOnPpr);  
     }
     if(DEFAULT_DIALOG_POPUP_ID == popupId)
       popupDiv.isDialogPopup = true;
     popupDiv.closeBarId = closeBarId;
     //Bug 20769577
     popupDiv.isAutoResize = "true" == popupDiv.getAttribute('isautoresize');
 
     displayPopup(); 
     // bug 9255491
     // Save off the initial state of the embedded popup.
     if(!isParameterizedPopup)
     initialPopupFormState = getPopupFormState();
     initTablesInsidePopup(divid);
     //attach positionPopupDiv to onscroll/onresize
     _attachPopupPositionChangeEevnts();
 }
 // the method is use to postion popupDiv
 function positionPopupDiv(method){
     if(!popupDiv) return;
 
     var winW = 630, winH = 460;
     t = document.getElementById(currentElement);
     var windowSize = getWindowSize();
     var scroll = getScrollOfWindow();
     winW = windowSize.width;
     winH = windowSize.height;
     //21610649 the fifth position strategy.
     var centre =false;
      width=popupDiv.style.width;
      height=popupDiv.style.height;
      popupDiv.style.position= 'absolute';
      //bug 8843840 
      var xp = findPosLeftX(t);
      var yp = findPosTopY(t);
         var popupWinW =parseInt(xp)+parseInt(width);
         var popupWinH =parseInt(yp)+parseInt(height);
         
         //clear left margin 
         var showNotch =  popupDiv.getAttribute("shownotch") ; 
         popupDiv.style.marginLeft = "" ;
         // Bug 8716339: If bidi session, change the calculation of the popup left
         if (isBiDi())
         {
           if (parseInt(width) < xp || popupWinW > winW) //show popup on the left of fireing
           {
             if(parseInt(width) < xp+10)
             {
               popupDiv.style.left=(parseInt(xp)-(parseInt(width) /*- parseInt(t.offsetWidth) */ ))+"px"; // right
             }
             else
               centre = true;
             popupDiv.xDir = "right"; 
             if (showNotch) popupDiv.style.marginLeft = ( (parseInt(width) /2  + parseInt(t.offsetWidth) / 2 ))  + "px" ;
           }
           else //show popup on the right side of firing element 
           {
             popupDiv.style.left=(parseInt(xp)+20)+"px"; // left
             popupDiv.xDir = "left";
             if (showNotch) popupDiv.style.marginLeft = ( -20 - parseInt(width) /2 + parseInt(t.offsetWidth) / 2 ) + "px" ;  
           }
         }
         else 
         {
           if(popupWinW >winW+scroll.left && parseInt(width) < xp)
           {
             popupDiv.style.left=(parseInt(xp)-parseInt(width))+"px";//left
             popupDiv.xDir = "left";
             if (showNotch) popupDiv.style.marginLeft = ( (parseInt(width) /2 + parseInt(t.offsetWidth) / 2 ))  + "px" ;
           }
           else
           {
             if(popupWinW < winW+scroll.left)
             {
               popupDiv.style.left=(parseInt(xp)+20 )+"px";//right
             }
             else
              centre = true;
             popupDiv.xDir = "right";
             if (showNotch) popupDiv.style.marginLeft = ( -20 + parseInt(t.offsetWidth) / 2 - parseInt(width) /2 ) + "px" ;
           }
         }
         // End Bug 8716339
         popupDiv.removeAttribute("notchposition"); 
         if(popupWinH > winH && (parseInt(height)+15) < yp)
         {
           //Bug 19863053 - POPUP CAN NOT DISPLAYS IN TABLE WITH VERTICAL SCROLL BAR
           popupDiv.style.top=(parseInt(yp)-parseInt(height))+"px";//top
           popupDiv.yDir = "top";
           if (showNotch) popupDiv.setAttribute("notchposition", "bottom"); 
         }
         else
         {
           if(popupWinH < winH + scroll.top)
             //Bug 19863053 - POPUP CAN NOT DISPLAYS IN TABLE WITH VERTICAL SCROLL BAR
             popupDiv.style.top=yp+t.offsetHeight+"px";//bottom
           else
             centre = true;
           popupDiv.yDir = "bottom";
           if (showNotch) popupDiv.setAttribute("notchposition", "top");
         }
         //bug 24578892: if couldn't find the source button element
         // open the popup in center of page
         if(openPopupInCenter)
         {
           centre = openPopupInCenter;
           openPopupInCenter = false;
         }
           
         //bug 17443645 popup position control
         decidePopupPosition(popupDiv,centre);
         popupDiv.showInCentre = centre;
         //bug 21466778
         if (showNotch)
         {
            // use (findPosLeftX(popupDiv)) instead of popupDiv.style.left ,becuase (findPosLeftX(popupDiv)) return 0 when 
            //popup is invisiable.
            if(parseInt(popupDiv.style.left)+parseInt(popupDiv.style.marginLeft)<0)
            {
              popupDiv.style.marginLeft=0;
              popupDiv.setAttribute("notchposition",  popupDiv.getAttribute("notchposition")+"left");
            }
            else if(parseInt(popupDiv.style.left)+parseInt(popupDiv.style.marginLeft)+parseInt(popupDiv.style.width)>winW)
            {
              popupDiv.style.marginLeft=0;
              popupDiv.setAttribute("notchposition", popupDiv.getAttribute("notchposition")+"right");
            }
         }
         //ppr happens in table,would refresh the whole popup. keep the popup in the dragged position
         if(isPopupDrag && null != savedDragPos)
         {
           popupDiv.style.left =  savedDragPos["left"];
           popupDiv.style.top =  savedDragPos["top"];
           return;
         } 
         popupDiv.style.left =parseInt(popupDiv.style.left) - popupDiv.relativeParent.posLeftX+ _PX;
         popupDiv.style.top = parseInt(popupDiv.style.top) - popupDiv.relativeParent.posTopY+ _PX;
 
 }
 function supportMovePopup()
 {
   //ER9069270 popup can be move by dragging title bar area.
   //21073222 Bug 20977283 - IPAD-POPUPS ARE NOT MOVABLE IN IOS 8.3 / SAFARII 
   if(document.getElementById(closeBarId))
   {
     dragSource =document.getElementById(closeBarId);
     dragSource.setAttribute('oaondragstart','targetOnDragStart(popupDiv)');
     dragSource.setAttribute('oaondrag','targetOnDrag(popupDiv,params)');
     dragSource.setAttribute('oaondragend','targetOnDragStop(popupDiv)');
     dragSource.style.cursor = "move";
   }
 }
 //To avoid code redundency this is  commen mehtod for showpopup and showpopuponppr.
 function displayPopup()
 {
     supportMovePopup();
     movePopupOutOfTable();
     //ER 8844804 auto resize,move the popup out of the table at first.
     popupAutoResize();
     getRelativeParent(popupDiv);
 	
     var width=popupDiv.style.width;
     var height=popupDiv.style.height;
      
     if (!ie5&&!ns6)
         window.open("","","width=width,height=height,scrollbars=1")
     else
     {
       positionPopupDiv();
         popupDiv.style.display='';
         popupDiv.setAttribute("aria-hidden",false);
         popupDiv.style.width=initialwidth=parseInt(width)+"px";
         popupDiv.style.height=initialheight=parseInt(height)+"px";
         //bug 8774979
         //bug 8667442:malmishr
         var closeBarWidth=popupDiv.firstChild.style.width;
         if(document.getElementById("closeBar"))
             document.getElementById("closeBar").style.width=initialwidth=parseInt(closeBarWidth)+"px";
         //bug 8526057-bmetikal  
         if(keyPress == true)
           handleFocusInPopup();
         
         if(isParameterizedPopup)
         {
             //Bug 11844503 : Processing Icon For Popups
             //To show loading indicator only for parametrized popups.
             //The icon is displayed at the centre position of the popup window.
             //Bug 21200271: offsetWidth and offsetHeight include border and padding
             loadingIconLeft =  ( (2*parseInt(popupDiv.style.left))+parseInt(popupDiv.offsetWidth))/2;
             loadingIconTop =( (2*parseInt(popupDiv.style.top))+parseInt(popupDiv.offsetHeight))/2;
             
             // Bug 21200271: Need to adjust the position of loading icon according to the margin-left of popupDiv
             if(popupDiv.style.marginLeft != "" && popupDiv.style.marginLeft != "0px")
             {
                 loadingIconLeft += parseInt(popupDiv.style.marginLeft);
             }
             var skip = false;
             //Call the Processing Icon javascript API to render the icon.
             if(popupDiv.isAutoResize && undefined == currentPopupObject.positionInfo)
             {
               //115 and 32 is the widht and height of loading icon and the text.
               var position = _pGetPostionOfPopupDiv(115,32);
               loadingIconLeft = position.aimLeft+48;
               loadingIconTop =  position.aimTop+16;
               if(popupDiv.showInCentre)
               {
                 var currentEle = document.getElementById(currentElement);
                 loadingIconLeft = !isBiDi()?findPosLeftX(currentEle)+20+48:findPosLeftX(currentEle)-48
                 loadingIconTop = findPosTopY(currentEle)+t.offsetHeight+16;
                 CshowLoadingAt(loadingIconLeft,loadingIconTop);
                 skip = true;
               }
             }
             loadingIconLeft += popupDiv.relativeParent.posLeftX;
             loadingIconTop += popupDiv.relativeParent.posTopY
             if(!skip)CshowLoadingAt(loadingIconLeft,loadingIconTop);
              //Bug 19863053 - POPUP CAN NOT DISPLAYS IN TABLE WITH VERTICAL SCROLL BAR
             detailsPopupURL =document.getElementById(popupUrlId).value;
             document.getElementById(iframeid).src=detailsPopupURL;
         }
      popupDiv.showInCentre = undefined;   
      //skyros, modal popup support: show popup window as a modal window
      showModalWindow(true);
     }
 }
 
 function iecompattest(){
 return (!window.opera && document.compatMode && document.compatMode!="BackCompat")? document.documentElement : document.body
 }
 function getPopupFormName(popupIframeElement)
 {
   var innerForm;
   if(popupIframeElement) 
   { 
     var doc = popupIframeElement.contentWindow ? popupIframeElement.contentWindow.document :popupIframeElement.contentDocument;  
     if(doc) 
     { 
       var frames = doc.getElementsByTagName('frame');  
       if(frames.length) 
       { 
         var innerIframe = frames[0]; 
         var innerDoc = innerIframe.contentWindow ? innerIframe.contentWindow.document : innerIframe.contentDocument; 
         if(innerDoc) 
         { 
           innerForm = innerDoc.getElementById('DefaultFormName'); 
         } 
       } 
     }  
   }
   return innerForm;
 }
 function closeit(message){
     if(!popupDiv) return;
     
     var scriptVarID = getScriptIDforPopupDisplay(null,null,true);
     
     
     if(scriptVarID != null && window[scriptVarID] != null)
     {
       this[scriptVarID] = false;
       setHiddenValuesForPopupDisplay(null,null,null);
     }
     //bug 9551575:Fix to avoid 'UNDEFINED' message warning box.
     if(!message)
     {
     //bug 10160232 :Dest URI function set to the popup close button resulting in js errors.
     //Using unescape function instead of decodeURI.
     if(document.getElementById(closeAnchorId) != null)
      eval(unescape(document.getElementById(closeAnchorId).href));
     return;
     }
     
     //bug 9697550
     message=unescape(message);
     
     var popupIframe=window.top.document.getElementById(iframeid);
     //bug 9696833
     if(!popupIframe)
     popupIframe = document.getElementById(iframeid);
     popupFormName = getPopupFormName(popupIframe);
     // bug 9255491
     if(ifWarnAboutChange && isPopupDirty()){
         var confirmed = confirm(message);
         if(!confirmed)
         {
             openPopup= false;
             return;
         }
         if(!isParameterizedPopup)
         resetPopup();
     }
     
     //skyros, modal popup support: remove the modal cover.
     //bug 16752143, close modal layer should happen after the popup dirty check.  
     showModalWindow(false);
     movePopupBackToTable(popupDiv, popupIframe);
     
         keyPress = true;
         if(popupDiv != null)
         popupDiv.style.display="none";
         popupDiv.setAttribute("aria-hidden",true);
         isPopupDrag = false;
         savedDragPos = null;
         divid = null;
         popupDiv = null;
         isParameterizedPopup = false;
         openPopup = true;
         if(document.getElementById("popupEnabledItemId") != null)
         document.getElementById("popupEnabledItemId").value=null;
         popupEnabledItemId = null;
         hiddenPopupid= null;
         //bug 9005330:bmetikal
         if(document.getElementById(currentElement))
         document.getElementById(currentElement).focus();
         removeCurrentElementId();
         //bug 8883221:malmishr 
         //This is for Iframe not to show the old data while the iframe is loading.
         var popupIframe=window.top.document.getElementById(iframeid);
         //bug 9696833
         if(!popupIframe)
         popupIframe = document.getElementById(iframeid);
         if(popupIframe!=null){
           popupIframe.style.visibility="hidden";
         }
         if(agentIOS)
         {
           if(twistedClick == 1)
           {
             twistedClick = 0;
           }
           else
           {
             counter = 0;
             savedElementOnClick.href = savedLinkDest;
           }
         }
   var infotitleRegion =  document.getElementById('infotileContentRN');
   if(infotitleRegion)
     infotitleRegion.style.overflow=infotitleRegion.savedOverflow;
   var oafuserContent =  document.getElementById('oafusercontent');
   if(oafuserContent)
     oafuserContent.style.overflow= oafuserContent.savedOverflow;
 }
 /**
  * bug 8526117
  * Determines which key is pressed.  
  * Closes the popup if it is ESC key.
  * ESC=27,Enter=13, tab=9, space=32
  */
  function detectEventType(event)
  {
      if(window.event)
      event =  (window.event);
      var keyCode = event.which || event.keyCode;
      //Bug 9941430 : DecodeURI doesn't work with IE as message is escaped.
      //So using unescape instead of decodeURI.
         if(keyCode == 27){ // Capture Esc key
         
          //bug 12547470, if lov suggest table open, then it is surely opening inside the popup, 
          //because if one lov suggest table open outside the popup, after you open the popup, 
          //it surely will close outside suggest table first, so, here, we only check if suggest table open, then close it first.
           if(typeof(Loutp) != "undefined" && Loutp != null && Loutp.style.visibility!='hidden'){
                  //here, if lov suggest table is open, we do not close popup, let lov suggest function take care lov suggest table closing.
                  //  Loutp.style.visibility = 'hidden';
                    return;
           }
           //close popup
           if(!popupDiv.isDialogPopup)
             closeit(popupDiv.getAttribute('warnmsg'));
           
         } 
     //bug 21648144 
     if(keyCode == 117)//press F6
     {
       //F6 is the default key to shift focus between windows(frame)
       //prevent the defualt event of this Key inside the popup
       _menuCancelEvent(event);
       if(popupDiv.getAttribute('isModal')=="true") return;
       //shift the focus to the base page
       document.getElementById(currentElement).focus();
     }
     //37 left 38 up 39 right 40 down bug 22661773
     //return the if condition,please remove false after
     //figure out the solution.
     if(false && keyCode >= 37 && keyCode<=40)
     {
       //return when autoposition enable
       if(typeof(currentPopupObject.positionInfo)!="undefined") return;
       if(typeof(LoutputElement)!= "undefined")
       {
         //return when lookahead table coming
         var lookaheadTable = this.document.getElementById(LoutputElement);
         if (lookaheadTable.style.visibility=="visible") return;
       }
       var gap = (keyCode <= 38)?-5:5;
       if(keyCode%2 ==1)
         _pMoveTarget(popupDiv,{"move_left":parseInt(popupDiv.style.left)+gap})
       else
         _pMoveTarget(popupDiv,{"move_top":parseInt(popupDiv.style.top)+gap});
       isPopupDrag =true;
       savedDragPos={"top":popupDiv.style.top,"left":popupDiv.style.left};
       _menuCancelEvent(event);
     }
  
 }
 //21648144
 pAttachEvent(document,['onkeydown','keydown'],function(event){
     if(window.event)
       event =  (window.event);
     var keyCode = event.which || event.keyCode;
     if(keyCode == 117)//F6
     {
         if(popupDiv != undefined && popupDiv.style.display == "")
         {
             //when popup is open,press F6 to shift the focus back to the popup.
             elemPreventDefault(event);
             focusLoopForPopup(popupDiv.firstFocusableEle);
         }
     }
 },false);
 
 function resetPopup()
 {
     var formElem;
     var val;
     for (var key in initialPopupFormState)
     {
         //formElem = document.getElementById(key);
         //fix for bug 16904550 
         formElem = _findElementById(popupDiv,key);
         val = initialPopupFormState[key];
         if (newPopupState[key] != initialPopupFormState[key])
         setPopupFormElementValue(formElem, val);
     }
 }
 /**
  * Determines if the popup is dirty, returning true if
  * the popup is dirty.  
  *
  * @return true if the popup is dirty
  */
 function isPopupDirty()
 {
   var popupDirty    = false;
   // Get the current state of the form
     newPopupState = getPopupFormState();
     // Compare it to the old state
     for (var key in newPopupState)
     {
       if (newPopupState[key] != initialPopupFormState[key])
       {
         popupDirty = true;
         break;
       }
     }
   return popupDirty;
 }
 /**
  * Store the current value of all elements in a Popup.
  * Ignores all hidden fields.
  * @return the state
  */
   function getPopupFormState()
   {
     var state = new Object();
     var elms;
     if(isParameterizedPopup && popupFormName!=null)
       elms = popupFormName.elements;
     else
       elms = popupDiv.getElementsByTagName("*");
     var len = elms.length;
     for (var i = 0; i < len; i++)
     {
       var element = elms[i];
   //bug18449628 
       if (element && element.tagName != "IMG")
       {
         var name = element.name;
         if (name)
         {
           // Skip over hidden values
           var elmType = element.type;
           if (!elmType || (elmType != 'hidden'))
             state[name] = _getValue(element);
         }
       }
     }
     return state;
   }
   
 
 function findPosX(obj)
   {
     var curleft = 0;
     if (obj == null)
       return curleft;
       
     if (obj.offsetParent)
     {
       while (obj.offsetParent)
       {
 	curleft += obj.offsetLeft;
 	obj = obj.offsetParent;
       }
     }
     else if (obj.x)
       curleft += obj.x;
     return curleft;
   }
 
   function findPosY(obj)
   {
     var curtop = 0;
     if (obj == null)
       return curtop;
     
     if (obj.offsetParent)
     {
       curtop += obj.offsetHeight;
       while (obj.offsetParent)
       {
 	curtop += obj.offsetTop;
 	obj = obj.offsetParent;
       }
     }
     else if (obj.y)
     {
       curtop += obj.y;
       curtop += obj.height;
     }
     return curtop;
   }
 //return the top position of the obj against (0.0)
 //regardless the obj's position style.
 function findPosTopY(obj)
 {
   var curtop = 0;
   if (obj == null)
   return curtop;
   curtop =  obj.getBoundingClientRect().top ;
   var scrollTop = window.pageYOffset || document.body.scrollTop;
   curtop +=scrollTop;
 
   return curtop;
 }
 //return the left position of the obj against (0.0)
 //regardless the obj's position style.
 function findPosLeftX(obj)
 {
      var curleft = 0;
      if (obj == null)
        return curleft;
      curleft= obj.getBoundingClientRect().left ;
      var scrollLeft = window.pageXOffset || document.body.scrollLeft;
      curleft +=scrollLeft ; 
 
      return curleft;
 }
 //start bug 8667455  
 function checkMouseLeave (element, evt) {
   if (element.contains && evt.toElement) {
     return !element.contains(evt.toElement);
   }
   else if (evt.relatedTarget) {
     return !containsDOM(element, evt.relatedTarget);
   }
 }
 function containsDOM (container, containee) {
   var isParent = false;
   do {
     if ((isParent = container == containee))
       break;
     containee = containee.parentNode;
   }
   while (containee != null);
   return isParent;
 }
 //end bug 8667455
   function setPopupTimer(bean1,popupid1)
   {
     keyPress = false;
     var c1=function()
     {
       showPopup(bean1,popupid1);
     }
    
     tmr=setTimeout(c1,1500);
   }
   function clearPopupTimer()
   {
     clearTimeout(tmr);
     keyPress = true;
   }
   //Bug 	8431730:malmishr To set window title when the Parameterized Popup is invoked.
   function setTitle()
   {
     var newTitle=document.title;
     //Bug 11844503 : Processing Icon For Popups
     //Once the popup contents are fetched from the popup region for parametrized
     //popups this method is called on iframe onload event.
     //call the processing icon javascript API to hide the icon.
     ChideLoadingFrame();
     if(newTitle != oldTitle)
       document.title=oldTitle;
     //bug 8883221:malmishr 
     //This is for Iframe not to show the old data while the iframe is loading.
     if(divid != null)
     {
       var popupIframe=window.top.document.getElementById(iframeid);
       //bug 9696833
       if(!popupIframe)
       popupIframe = document.getElementById(iframeid);
       if(popupIframe!=null)
         popupIframe.style.visibility="visible";
       popupFormName = getPopupFormName(popupIframe);
       // bug 9255491
       // Save off the initial state of the parameterized popup form.
       initialPopupFormState = getPopupFormState();
     }      
     
   }
    
   // Bug 8546023 - tohkubo
   // Move back isBiDi to core library.
 
   //malmishr:bug 8711922
   function submitFormPgRefresh()
   {
     //bug 24574054 - FW PORT 24357962 
     //client side validation is set to  'off' for submit in popup for base page
     window.top.submitForm('DefaultFormName', 0, null);
     //bug 8883221:malmishr 
     //This is for Iframe not to show the old data while the iframe is loading.
     var popupIframe=window.top.document.getElementById(iframeid);
     //bug 9696833
     if(!popupIframe)
     popupIframe = document.getElementById(iframeid);
     if(popupIframe!=null)
       popupIframe.style.visibility="hidden"; 
   }
 
 /**
  * Sets the value of a form element.
  */
 function setPopupFormElementValue(formElement, value)
 {
   //bug 17016196, PPR happen in popup, it may remove the form value, so, add this check.  
   if(formElement==null) return;
  
   var shadowElem = formElement;
   var elementType = formElement.type
 
   // When we're dealing with an array of elements, find the
   // real element type by looking inside the array.
   if (!elementType && formElement.length)
   {
     for (var i = 0; i < formElement.length; i++)
     {
       elementType = formElement[i].type;
       if (elementType != (void 0))
       {
         shadowElem = formElement[i];
         break;
       }
     }
   }
   if (elementType == "checkbox")
   {
     formElement.checked=value;
   }
   else if (elementType.substring(0,6) == "select")
   {
     // no selected value
     if(value == "")
     {
       formElement.selectedIndex = -1;
       //formElement.selectedIndex = null;
     }
      // selectedIndex exists and non-negative
     else if(!isNaN(parseInt(value)))
     {
         // If there's no value, it could be for two reasons:
         //  (1) The user has only specified "text".
         //  (2) The user explicitly wanted "value" to be empty.
         // We can't really tell the difference between the two,
         // unless we assume that users will be consistent with
         // all options of a choice.  So, if _any_ option
         // has a value, assume this one was possibility (2)
       for (var i = 0; i < formElement.options.length; i++)
         {
           if (formElement.options[i].value == value)
           {
             formElement.selectedIndex = i;
             break;
           }
         }
         // OK, none had a value set - this is option (1) - default
         // the "value" to the "text"
         // formElement.selectedIndex = 0;
     }
     // value is index
     else
       formElement.selectedIndex = value;
   }
   else if (elementType == "radio")
   {
     // no selected value
     if(value == "")
     {
       formElement.checked = false;
     }
     else if (formElement.length)
     {
       for (var i = 0; i < formElement.length; i++)
       {
         // See above for why we check each element's type
         if (formElement[i].type == "radio" && formElement[i].value == value)
         {
           formElement[i].checked = true;
         }
       }
     }
     else
       formElement.checked = value;
   }
   else
   {
     formElement.value = value;
   }
 }
 
 //Bug 18403444 - TST1224:ATGUI:DUPLICATE TEXT "CONFIRMATION" IN CONFIRMATION DIALOG BOX 
 function removePopupCloseBar() { 
   //skyro
   var closeBarTag = document.getElementById(DEFAULT_DIALOG_POPUP_ID+"skyroscloseBar");
   //swan
   if(closeBarTag == null) closeBarTag = document.getElementById(DEFAULT_DIALOG_POPUP_ID+"closeBar"); 
   if(closeBarTag != null )
   closeBarTag.parentNode.removeChild(closeBarTag);
 }
 //invoke to show the dialog popup by haiyun.lin
 function showDialogPopups (){
   //Bug 18403444 
   removePopupCloseBar();
   showPopup(document.getElementById(DEFAULT_DIALOG_POPUP_ID),DEFAULT_DIALOG_POPUP_ID); 
 }
 
 function showDialogPopup (){
   var overylay =document.getElementById("overlay");
   if(overylay == null ) {
     //28462290
     if(this.addEventListener) 
       this.addEventListener("load", showDialogPopups, false);
     else if(this.attachEvent)
       this.attachEvent("onload", showDialogPopups);
   } else {
    showDialogPopups();
   }
 }
 
 function handleFocusInPopup()
 {
   var firstFocusableEle= _getFirstFocusable(popupDiv); 
   var lastFocusableEle = _getLastFocusable(popupDiv.firstChild);
   //21491883
   if(isParameterizedPopup)
   {
     var popupIframe = document.getElementById(iframeid);
     pAttachEvent(popupIframe,["onload","load"], function(){
       var popupIframe = document.getElementById(iframeid);
       if(!popupIframe || popupIframe.contentDocument.getElementsByTagName('frame').length == 0){
         //this happens when the popup is moved back to the table when closed.
         return;
       }
       var win =  popupIframe.contentDocument.getElementsByTagName('frame')[0].contentWindow;
       var doc = win.document;  
       if(!doc) return;
       pAttachEvent(win,['onkeydown','keydown'],detectEventType,false);
       //ppr happens. the focusable ele should be got refresh.
       pAttachEvent(doc.getElementById("_pprIFrame"),["onload","load"], refreshFirstAndLastFocusableEle,false);
       lastFocusableEle = _getLastFocusable(doc.body);
       if(document.getElementById(closeAnchorId))
         focusLoopForPopup(firstFocusableEle,lastFocusableEle);
       else //there is no 'X' btton
       {
         firstFocusableEle = _getFirstFocusable(doc.body); 
         focusLoopForPopup(firstFocusableEle,lastFocusableEle); 
       }
     },false);
     if(document.getElementById(closeAnchorId))
       focusLoopForPopup(firstFocusableEle);
   }
   else
     focusLoopForPopup(firstFocusableEle,lastFocusableEle);
   //ppr happens. the focusable ele should be got refresh.
   pAttachEvent(document.getElementById("_pprIFrame"),["onload","load"], refreshFirstAndLastFocusableEle,false);
 }
 //bug 17932434
 //bug 21491883
 //focus Loops for popup without title bar by haiyun.lin
 function focusLoopForPopup(firstFocusableEle,lastFocusableEle,shouldfocus){
   if(!firstFocusableEle) {
     //if there is no firstFocusableEle,ther must be no lastFocusableEle
     popupDiv.lastFocusableEle = undefined;
     popupDiv.firstFocusableEle = undefined;
     return;
   }
   //reset the onkeydown event
   if(popupDiv.firstFocusableEle && firstFocusableEle != popupDiv.firstFocusableEle)
     pRemoveEvent(popupDiv.firstFocusableEle,['onkeydown','keydown'],onKeyDown4FirstFocusableEle,false);
   if(lastFocusableEle)
   {
     popupDiv.lastFocusableEle=lastFocusableEle;
     pAttachEvent(firstFocusableEle,['onkeydown','keydown'],onKeyDown4FirstFocusableEle,false);
   }
   popupDiv.firstFocusableEle = firstFocusableEle;
   //the default value of shouldfocus should be undefined
   if(false != shouldfocus)firstFocusableEle.focus();
   var focusEnd = document.getElementById(popupDiv.id+"focusEnd"); 
   if(!focusEnd) {
     focusEnd = document.createElement("a");
     focusEnd.href="#";
     //Bug 18449799 - TST1224:ADA:HELPER ISSUES IN DIALOG POPUP 
     //add alt attribute to the link.
     focusEnd.setAttribute("alt","back");
     focusEnd.setAttribute("ID",popupDiv.id+"focusEnd");
     focusEnd.onfocus=function() {
       if(popupDiv.firstFocusableEle)
         popupDiv.firstFocusableEle.focus();
     }
     popupDiv.appendChild(focusEnd);
   }
 }
 function onKeyDown4FirstFocusableEle(event){
   if(window.event)
     event = window.event;
   var keyCode = event.which || event.keyCode;
   if(keyCode == 9) //tab
   {
     //bug 21647974
     if(event.shiftKey) { //shift+tab 
       if(popupDiv && popupDiv.lastFocusableEle)
       {
          //prevent the defualt event of this Key inside the popup
         _menuCancelEvent(event);
         popupDiv.lastFocusableEle.focus();
       }
     }
   } 
 }
 //the function should be call after the ppr done within the popup
 function refreshFirstAndLastFocusableEle()
 {
   if(popupDiv == null || popupDiv.style.display == "hidden") return;
   var firstFocusableEle = _getFirstFocusable(popupDiv); 
   var lastFocusableEle = _getLastFocusable(popupDiv.firstChild);
   if(isParameterizedPopup)
   {
    var popupIframe = document.getElementById(iframeid);
    if(!popupIframe || popupIframe.contentDocument.getElementsByTagName('frame').length == 0){
       return;
    }
    var doc = popupIframe.contentDocument.getElementsByTagName('frame')[0].contentDocument; 
    lastFocusableEle = _getLastFocusable(doc.body);
    if(!document.getElementById(closeAnchorId))//no 'x' icon
      firstFocusableEle = _getFirstFocusable(doc.body); 
   }
   focusLoopForPopup(firstFocusableEle,lastFocusableEle,false);
 }
 
 //bug 17894779 WARNING ABOUT CHANGES IN POP-UP WINDOW 
 //after click button in embedded/parameterized popup with ppr event;
 //a waring messag diaplays when close the popup;
 //we should refresh the popup state after ppr event;
 function refreshStateAfterPPR(win){
   if(!popupDiv)return;
   //here we mush refresh state only after pprIframe loaded; 
   var pprIframe= win.parent.document.getElementById("_pprIFrame"); 
   if(pprIframe != null) {
     popupDiv.refeshState = function(){
     //refresh the state of popup
     initialPopupFormState = getPopupFormState();
     //detect the event;
     pRemoveEvent(pprIframe,['onload','load'],popupDiv.refeshState,false);
     }
     //attach event;
     pAttachEvent(pprIframe,['onload','load'],popupDiv.refeshState,false);
   }
 }
 
 var _PX = "px";
 //ER resize the popup.
 function  popupAutoResize(){
   if(popupDiv == undefined || !popupDiv.isAutoResize) return;
   //bug 21275151 
   popupDiv.style.position= 'absolute';
   // hide the popupDiv
   popupDiv.savedZIndex = popupDiv.style.zIndex;
   popupDiv.style.zIndex = -10;
   popupDiv.style.display='';
   
   getRelativeParent(popupDiv);
   //when the param popup load done,popup get re-resiz.  
   if(isParameterizedPopup) {
     adjustDialogPopupWidth();
     pAttachEvent(document.getElementById(iframeid),["onload","load"], popupAutoResize4Param,false);
   }
   else{
     popupAutoResize4Emb();
     //register resize event on pprIframe to handle ppr event in embedded popup;
     pAttachEvent(top.document.getElementById("_pprIFrame"),["onload","load"], popupAutoResize4Emb,false);
   }
 }
 
 //resize the embedded popup base on the content
 function popupAutoResize4Emb(){ 
   if(popupDiv == null || popupDiv.style.display == "hidden") return;
   var contentDiv;
   //Bug 20428370 - NOTCH IS NOT SHOWING WHEN AUTORESIZE ENABLED
   if(document.getElementById(closeBarId) != null)
     contentDiv = _findNextElem(document.getElementById(closeBarId));
   else
     contentDiv = popupDiv.firstChild.firstChild;//21454014
   
   contentDiv.style.height = "";
   contentDiv.style.display="inline-block";
   
   //calculate the actual size
   //Bug 20157500 - EDGE OF POPUP CLIPS OFF THE POPUP CONTENT IN AUTO RESIZE MODE 
   var contentHeight = contentDiv.clientHeight;
   var contentWidth = contentDiv.scrollWidth > contentDiv.clientWidth?contentDiv.scrollWidth:contentDiv.clientWidth;
   //The auto resize functionality should ensure that the popup size should be 
   //atleast 10%px lesser than the browser boundary 20415059
   var windowSize = getWindowSize();
   if(contentWidth > windowSize.width) contentWidth = parseInt(windowSize.width*0.9); 
   if(contentHeight > windowSize.height) contentHeight = parseInt(windowSize.height*0.9)-50;
   
   contentDiv.style.height=contentHeight+_PX;
   contentDiv.style.display="";
   //browser use Math.round to calculate the the widht and height,which is not precision in chrome.
   //add 1 px
   var contentSize = _pGetContentSize(popupDiv,contentWidth+1,contentHeight+1);
   contentWidth = contentSize[0];
   contentHeight = contentSize[1];
   //get the final position[top,left] when popupDiv resize to the content size
   var postion = _pGetPostionOfPopupDiv(contentWidth,contentHeight);
   
   //change popupDiv position
   pChangePostion(popupDiv,postion.aimLeft,postion.aimTop);
   
   var popupWrapper = popupDiv.firstChild;  
   //resize the popup  
   pChangeSize(popupDiv,contentWidth,contentHeight);
   pChangeSize(popupWrapper,contentWidth,contentHeight);
   //still see the scroll bar in popupDIV RTL session, Bug 21384348
   //we caculated the size ,it's fine setting it to hidden.
   popupWrapper.style.overflow="hidden";
   popupDiv.style.zIndex = popupDiv.savedZIndex;
   popupDiv.savedZIndex = undefined;
   //if popup is dragged ,leave it in the same position.
   if(!isPopupDrag)  
     positionPopupDiv();
 }
 
 //resize the parameterized popup base on the content.
 function popupAutoResize4Param(lloutputVisi){
   if(popupDiv == null || popupDiv.style.display == "hidden") return;
   
   var popupIframe = document.getElementById(iframeid);
   var paramPopupframe = popupIframe.contentDocument.getElementsByTagName('frame')[0]
   var popupBody =paramPopupframe.contentDocument.body;
   var paramPopDoc =paramPopupframe.contentDocument.documentElement;
   popupBody.style.display="inline-block";
   
   var contentHeight = popupBody.clientHeight
   var contentWidth = popupBody.clientWidth
   //22621017 22622613 
   var savedOverflow = popupBody.style.overflow;
   popupBody.style.overflow="hidden";
   var widthGap = 0;
   if('visible' == lloutputVisi)
   {
     //21361323
     contentHeight = (popupBody.scrollHeight>paramPopDoc.scrollHeight?popupBody.scrollHeight:paramPopDoc.scrollHeight);
     contentWidth= (popupBody.scrollWidth>paramPopDoc.scrollWidth?popupBody.scrollWidth:paramPopDoc.scrollWidth) ;
   }
   //Bug 20452417:haiyulin Popup double scroll bar
   //bug 20900392 scroll bar issue
   var newHeight = contentHeight+5;
   contentWidth+=2;
   //The auto resize functionality should ensure that the popup size should be 
   //atleast 10%px lesser than the browser boundary 20415059
   var windowSize = getWindowSize();
   if(contentWidth > windowSize.width) contentWidth = parseInt(windowSize.width*0.9); 
   if(contentHeight > windowSize.height) newHeight =  parseInt(windowSize.height*0.9)-50;
   
   popupIframe.style.width = "100%";
   popupIframe.style.height = "100%";
   //popupContent div
   var popupContentDiv = popupIframe.parentNode;
   popupContentDiv.style.height = newHeight+_PX;
 
   var popupWrapper = popupDiv.firstChild;
   var contentPadding = getPadding(popupWrapper.lastChild);
   newHeight += contentPadding["paddingHeight"];
   contentWidth += contentPadding["paddingWidth"];
   
   //calculate the contentsize base on the title size
   var contentSize = _pGetContentSize(popupDiv,contentWidth,newHeight);
   contentWidth = contentSize[0];
   newHeight = contentSize[1];
   widthGap = contentWidth-parseInt(popupDiv.style.width);
   //resize the popupDiv
   pChangeSize(popupWrapper,contentWidth, newHeight);
   pChangeSize(popupDiv,contentWidth, newHeight);
   
   //get the final position[top,left] when popupDiv resize to the content size 
   var postion = _pGetPostionOfPopupDiv(contentWidth,newHeight);
   //change popupDiv position
   pChangePostion(popupDiv,postion.aimLeft,postion.aimTop);
   //Bug 21384348
   popupContentDiv.style.overflow="hidden";
   //we need to position popup agian after the size change.
   //if popup is dragged ,leave it in the same position.
   var lookaheadEvent = ('visible' == lloutputVisi || 'hidden' == lloutputVisi);
   if(!(isPopupDrag || lookaheadEvent))
     positionPopupDiv();
   //22570403 lookahead coming within the param popup
   else if(lookaheadEvent && isBiDi() && popupDiv.xDir =="right")
     popupDiv.style.left = (parseInt(popupDiv.style.left)-widthGap)+_PX
   
   //revert;
   popupDiv.style.zIndex = popupDiv.savedZIndex;
   popupDiv.savedZIndex = undefined;
   popupBody.style.overflow=savedOverflow;
  
   //register resize event on paramPopupframe to handle submit in popup.
   pAttachEvent(paramPopupframe,["onload","load"], popupAutoResize4Param,false);
       
   //register resize event on pprIframe within popup to handle ppr happens in popup.
   var pprIframe= paramPopupframe.contentDocument.getElementById("_pprIFrame");
   pAttachEvent(pprIframe,["onload","load"], popupAutoResize4Param,false);
   
 }
 
 function getPadding(ele)
 {
   var computedStyle = window.getComputedStyle(ele);
   var valueArr =[0,0,0,0];
   var keyArr = ["paddingTop","paddingBottom","paddingLeft","paddingRight"];
   for(var i=0 ; i<4 ; i++){
     value = parseInt(computedStyle[keyArr[i]]);
     valueArr[i]= (value == NaN) ? 0 : value;
   }
   return {
           "paddingHeight" : valueArr[0] + valueArr[1],
           "paddingWidth" : valueArr[2] +valueArr[3]
          }
 }
 //haiyun.x.lin
 function _pGetContentSize(popupDiv,contentWidth,contentHeight){
   if(popupDiv == null) return [contentWidth,contentHeight];
   
   var cloaseBar = document.getElementById(closeBarId);
   //Bug 20428370 - NOTCH IS NOT SHOWING WHEN AUTORESIZE ENABLED
   if(cloaseBar != null){
     contentHeight += cloaseBar.clientHeight;
     var titleBean  = cloaseBar.firstChild;
     if(titleBean && titleBean.nodeName == 'H1'){
       var titleWidth = titleBean.firstChild.clientWidth;
       if(titleWidth == 0) titleWidth = titleBean.firstChild.offsetWidth;
       //21515505 the contentWidth should be bigger than
       //the sum of title width and the width of close icon
       closeIconWidth = 0;
       if(document.getElementById(closeAnchorId))//6px gap(ui spec)
         closeIconWidth = document.getElementById(closeAnchorId).offsetWidth+6;
       titleWidth += closeIconWidth+getPadding(titleBean)["paddingWidth"];
       if(contentWidth < titleWidth) 
         contentWidth = titleWidth;
     }
   }
   return[contentWidth,contentHeight];
 }
 //change the bean's size(width, height)
 function pChangeSize(bean,aimWidth,aimHeight) {
   bean.style.width = aimWidth +_PX;
   bean.style.height = aimHeight + _PX; 
 }
 
 //change position of web element.
 function pChangePostion(bean,aimLeft,aimTop) 
 { 
    bean.style.left = aimLeft + _PX;
    bean.style.top = aimTop+ _PX; 
 }
 
 // get left pos and top pos of popup Div.
 // only for internal use.
 // the method returns an object like:
 // {"aimLeft":aimLeft,"aimTop":aimTop};
 function _pGetPostionOfPopupDiv(contentWidth,contentHeight){
     var aimLeft = parseInt(popupDiv.style.left);
     var aimTop = parseInt (popupDiv.style.top);
     var xDir = popupDiv.xDir;
     var yDir = popupDiv.yDir;
     if(isBiDi()){
       xDir == "left" ? xDir = "right" : xDir= "left";
     }
     if(xDir == 'left'){
      aimLeft += parseInt(popupDiv.style.width) - contentWidth;
     }
     if(yDir == 'top'){
       aimTop += parseInt(popupDiv.style.height) - contentHeight;
     } 
     return {"aimLeft":aimLeft,"aimTop":aimTop};
 }
 
 // attach event to web element;
 // note type should be an array. 
 // type[0] is used by attachEvent,type[1] is used by addEventListener
 function pAttachEvent(target,type,listener,useCapture){
   if(target != null){
     if(target.attachEvent) 
       target.attachEvent(type[0], listener); 
     else 
       target.addEventListener(type[1], listener, useCapture);
     }
 }
 
 // remvoe event from web element
 // note type should be an array. 
 // type[0] is used by attachEvent,type[1] is used by addEventListener
 function pRemoveEvent(target,type,listner,useCapature) {
   if(target.detachEvent) 
     target.detachEvent(type[0], listner); 
   else 
     target.removeEventListener([1], listner, useCapature);
 }
 
 var ele_x = 0;
 var ele_y = 0;
 function targetOnDragStart (dragTarget)
 {
   if(!dragTarget) return
   ele_x = dragTarget.offsetLeft;
   ele_y = dragTarget.offsetTop;
   var computedstyle = window.getComputedStyle(dragTarget);
   if("absolute" == computedstyle['position'])
   {
     getRelativeParent(dragTarget);
   }
 }
 function targetOnDrag (dragTarget,params)
 {
   if(!dragTarget) return;
   var move_left= params.distanceX + ele_x;
   var move_top = params.distanceY + ele_y;
   _pMoveTarget(dragTarget,{"move_left":move_left,"move_top":move_top})
 }
 function _pMoveTarget(target,targetPosition)
 {
   var move_left = targetPosition["move_left"];
   var move_top = targetPosition["move_top"];
   var move_left_limit = 0 ;
   var move_top_limit = 0;
   var move_bottom_limit = document.documentElement.scrollHeight - target.offsetHeight;
   var move_right_limit = document.documentElement.scrollWidth - target.offsetWidth;
   if(target.relativeParent)
   {//absolute position
     move_left_limit -= target.relativeParent.posLeftX;
     move_right_limit -= target.relativeParent.posLeftX;
     move_top_limit -= target.relativeParent.posTopY;
     move_bottom_limit -= target.relativeParent.posTopY;
   }
   var computedstyle = window.getComputedStyle(target);
   if (move_left != undefined &&( move_left > move_left_limit && move_left <= move_right_limit))
   {
     var marginLeft =computedstyle["margin-left"]?computedstyle["margin-left"]:computedstyle["marginLeft"];
     if(marginLeft)
       move_left -= parseInt(marginLeft) ;
     target.style.left = move_left +_PX;
   }
   if (move_top != undefined && (move_top > move_top_limit && move_top <= move_bottom_limit))
   {
     var marginTop =computedstyle["margin-top"]?computedstyle["margin-top"]:computedstyle["marginTop"];
     if(marginTop)
        move_top -= parseInt(marginTop);
     target.style.top = move_top + _PX;
   }     
 }
 
 function targetOnDragStop(dragTarget)
 {
   //bug 21056366
   if(dragTarget)
   {
     isPopupDrag =true;
     savedDragPos={"top":dragTarget.style.top,"left":dragTarget.style.left};
   }
 }
 
 //21360272 
 //19601339	Show bug	CLOSE READONLY POPUP WHEN CLICK OUTSIDE THE POPUP
 function pClickDocument (event) { 
 if (popupDiv && popupDiv.style.display == "" && popupDiv.getAttribute("readonly") ) 
 {
   //is this click outside of current popup? 
   var isinpopup = false ; 
   var item = event.target ; 
   //bug 20296615 R.TST1225: READONLY EMBEDDED POPUP NOT RENDERING IN IE9 
   //regression of bug19601339
   //current click event is triggered by popup src element,in IE,event.target is undefined,
   //we should use event.srcElement.
   if(_agent.isIE)
    item = event.srcElement
   while (item && !isinpopup) {
      isinpopup = item == popupDiv || top.currentPopupObject && item == top.currentPopupObject["firesourceElement"];   
      item = item.parentElement ;
   }
   isinpopup || closeit(popupDiv.getAttribute('warnmsg')); 
 }
 }
 (function () { 
 pAttachEvent(document,["onclick","click"],pClickDocument,false);
 }) (); 
 function _attachPopupPositionChangeEevnts(){
    //if current popup is dialog popup. need to resize the popup when window get resize.
   pAttachEvent(window,['onresize','resize'],function(){
     //adjust DialogPopup width before it get auto Resize
     if(popupDiv != undefined && popupDiv.isDialogPopup)
     {
       if(!_agent.isIpad && adjustDialogPopupWidth())
         popupAutoResize4Param();
       else
         positionPopupDiv();
     }
   },false);
     
 }
 //20161194: TST1225 WARNING POPUP RENDERING OUTSIDE THE PAGE AREA 
 //Mobile issue
 //support dialog popup adjust width base on the browser size
 function adjustDialogPopupWidth(){
   if(!popupDiv || !popupDiv.isDialogPopup) return false;
   
   var windowSize = getWindowSize();
   var windowWidth = windowSize.width;
   if(undefined == popupDiv.initWidth)
     popupDiv.initWidth = parseInt(popupDiv.style.width);
   var curWidth = adjustWidth = parseInt(popupDiv.style.width);
   var minWidth = 300; //dialog popup should have aleast 300px width
   if(windowWidth > curWidth && windowWidth < popupDiv.initWidth)
     return false;
   adjustWidth = windowWidth-80;
   if(adjustWidth < minWidth)
     adjustWidth = minWidth;
   else if (adjustWidth > popupDiv.initWidth)
     adjustWidth = popupDiv.initWidth;
   var popupIframe=top.document.getElementById(iframeid);
   popupDiv.style.width = adjustWidth + _PX;
   popupDiv.firstChild.style.width = adjustWidth + _PX;
   popupIframe.width = adjustWidth -(curWidth - parseInt(popupIframe.width));
   return true;
 }
 
 function movePopupOutOfTable(){
   if(popupDiv == null) return;
   var infotitleRegion =  document.getElementById('infotileContentRN');
   if(infotitleRegion)
   {
     infotitleRegion.savedOverflow = infotitleRegion.style.overflow;
     infotitleRegion.style.overflow='visible';
   }
   var oafuserContent =  document.getElementById('oafusercontent');
   if(oafuserContent)
   {
     oafuserContent.savedOverflow = oafuserContent.style.overflow;
     oafuserContent.style.overflow='visible';
   }
   var tableId = popupDiv.getAttribute('tableid');
   if(tableId != null)
   {
     //Bug 20460200 - MODAL POPUP IN TABLE IS NOT CLICKABLE
     //Get the content Div and if it is relatively positioned, remove it.
     //22661460 There is a style position:relative in div posrefdiv:tableid,
     //move the popup under table bean directly.
     var contentDiv = document.getElementById('contentDiv:'+tableId);
     var tableBean = document.getElementById(tableId);
     var surroundingDiv = document.getElementById('surroundingDiv:' + tableId);
     if(contentDiv != null && surroundingDiv != null && tableBean != null
        && contentDiv.style.position == 'relative')
     {
        parentOfPopupDiv = popupDiv.parentNode;
        parentOfPopupDiv.removeChild(popupDiv);
        tableBean.appendChild(popupDiv);
     }
   }
 }
 //An element with position: absolute; is positioned relative to the nearest
 //positioned ancestor (instead of positioned relative to the viewport, like fixed).
 //However; if an absolute positioned element has no positioned ancestors,
 //it uses the document body, and moves along with page scrolling.
 //bug 21658118 popup in detached table within a fixed-positioned div.
 function getRelativeParent(ele)
 {
   if(!ele) return;
   var relativeParent = document.body;
   var node = ele.parentNode;
   while(node && node != document.body)
   {
     var computedstyle = window.getComputedStyle(node); 
     if("relative" == computedstyle['position'] ||"fixed" == computedstyle['position'])
     {
       relativeParent= node; break;
     } 
     node = node.parentNode;
   }
   relativeParent.posLeftX =  findPosLeftX(relativeParent);
   relativeParent.posTopY =  findPosTopY(relativeParent);
   ele.relativeParent=relativeParent;
   return relativeParent;
 }
 
 function movePopupBackToTable(popupDiv, popupIframe)
 {
     if(shouldMovePopupBackToTable(popupDiv))
     {
       if(popupIframe)
       {
         popupIframe.src = "about:blank";
       }
       popupDiv.parentNode.removeChild(popupDiv);
       parentOfPopupDiv.appendChild(popupDiv);
       parentOfPopupDiv = null;
     }
 }
 
 //returns true if the popup is moved out of the table. bug 25821792
 function shouldMovePopupBackToTable(popupDiv)
 {
   var tableId = popupDiv.getAttribute('tableid');
   if(tableId != null)
   {
     var tableBean = document.getElementById(tableId);
     return tableBean == popupDiv.parentNode;
   }
   return false;
 }
 
 //bug 25821792
 function removeAndSetPopupDiv()
 {
   if(parentOfPopupDiv && !document.body.contains(parentOfPopupDiv))
   {
     //bug 26638045
     if(popupDiv && popupDiv.parentNode)
       popupDiv.parentNode.removeChild(popupDiv);
   }
   
   var popupDivs = document.querySelectorAll("[id='" + divid + "']");
   if(popupDivs.length > 1)
   {
     for(var i = popupDivs.length - 1; i > 0; i--)
     {
       popupDivs[i].parentNode.removeChild(popupDivs[i]);
     }
   }
   if(popupDivs.length > 0)
   {
     popupDiv = popupDivs[0];
   } 
 }
