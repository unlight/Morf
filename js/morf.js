$(document).ready(function(){
	if (typeof($.livequery) != 'function') return;
	var WebRoot = gdn.definition('WebRoot');
	var addcssfile = function(file, webroot) {
		var link = $('<link>', {rel: 'stylesheet', type: 'text/css', charset:'utf-8'});
		if (typeof(webroot) != 'undefined') file = gdn.combinePaths(webroot, file);
		$(link).attr('href', file);
		$('head').append(link);
	}
	
	var GetExtension = function(Path) {
		var S = Path + '';
		return S.substr( S.lastIndexOf('.') + 1 );
	};
	
	var IncludeJs = function(files) {
		if (typeof(files) == 'string') files = [files];
		var onload;
		var script = document.createElement('script');
		var file = files.shift();
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('src', file);
		document.body.appendChild(script);
		if (files.length > 0) {
			onload = function() { IncludeJs(files); }
			script.onreadystatechange = onload;
			script.onload = onload;
		}
	}

	// 1) 27 Apr 2011. Input datetime
	var calendarloading = false;
	var calendarloaded = 0;
	var dyndtwebroot = gdn.combinePaths(WebRoot, 'plugins/Morf/vendors/jquery.dynDateTime');
	var input = document.createElement("input");
	
	var testcalendar = function() {
		return (typeof(Calendar) == 'function');
	}
	
	var makeinputcalendar = function(element, settings) {
		if (element.type != "text") {
			// Add reset button (beacuse it is gone in 11.50)
			if ($.browser.opera && $.browser.version >= 11.5) {
				$(document.createTextNode(" ")).insertAfter(element);
				$('<button class="Button">…</button>')
					.bind('click', function(){
						$(this).prev().val('');
						return false;
					})
					.insertAfter(element);
				
			}
			return;
		}
		if (!calendarloading){
			calendarloading = true;
			addcssfile('/skins/aqua/theme.css', dyndtwebroot);
			IncludeJs( gdn.combinePaths(dyndtwebroot, '/jquery.dynDateTime.pack.js') );
			IncludeJs( gdn.combinePaths(dyndtwebroot, '/lang/calendar-'+gdn.definition('CalendarLanguage')+'.js') );
		}
		$.doWhen(testcalendar, function(){
			settings.firstDay = Calendar._FD || 1;
			if ($(element).data('datetime') != null) return;
			$(element).attr('autocomplete', 'off').data('datetime', true);
			$('<button class="DateBoxPicker" title="Choose date…">…</button>').insertAfter(element);
			$(document.createTextNode(" ")).insertAfter(element);
			$(element).dynDateTime(settings);
		});
	};
	
	$("input[type=date]").livequery(function(){
		makeinputcalendar(this, {ifFormat: "%Y-%m-%d", button: ".next()"});
	});
	
	$("input[type=datetime]").livequery(function(){
		makeinputcalendar(this, {ifFormat: "%Y-%m-%d %H:%M", showsTime: true, button: ".next()"});
	});
	
	
	// 2) 19 Oct 2011 (Uploadify)
	var UploadifyLoading = false;
	var TestUploadify = function() {
		return typeof($.fn.uploadify) == 'function';
	}
	var LoadUploadify = function() {
		if (UploadifyLoading) return;
		UploadifyLoading = true;
		IncludeJs( gdn.combinePaths(WebRoot, '/plugins/Morf/vendors/uploadify3/jquery.uploadify.min.js') );
	}
	
	var TransientKey = gdn.definition('TransientKey');
	var SessionUserID = gdn.definition('SessionUserID');

	$('input[id$=UploadBox]').livequery(function(){
		LoadUploadify();
		var Data = $.parseJSON($(this).val());
		var UploadFolder = $(this).val();
		var TextBox = $(this).prev();
		
		var TriggerId = TextBox.attr('id') + '_' + Math.floor(Math.random() * 999999);
		var Trigger = $('<span>', {
			css: {display:'inline'},
			id: TriggerId
		});
		$(TextBox).after(Trigger);
		//this.filter(':linkingToImage(' + s.srcAttr + ')');
		
		Data['TransientKey'] = TransientKey;
		Data['SessionUserID'] = SessionUserID;
		//Data['Debug'] = 1;
		
		var SetPreviewScript = function(Item) {
			var Filepath = Item.val();
			var Extenstion = GetExtension(Filepath);
			var ImageExtenstions = "jpg|gif|jpeg|png|bmp".split('|');
			if (Extenstion && $.inArray(Extenstion, ImageExtenstions) != -1) {
				var DataSrc = gdn.combinePaths(WebRoot, Filepath);
				TextBox.attr('data-src', DataSrc);
				//console.log(DataSrc);
				var ContainerID = 'imgPreviewContainer';
				//$('#'+ContainerID).remove();
				$(Item).imgPreview({
					containerID: ContainerID,
					srcAttr: 'data-src',
					distanceFromCursor: {top:10, left:10},
					onLoad: function(){
						$(this).animate({opacity:1}, 'fast');
					},
					onShow: function(link){
						//console.log(link);
						//$(link).stop().animate({opacity:0.5});
						//$('img', this).stop().css({opacity:0});
					},
					onHide: function(link){
						//$(link).stop().animate({opacity:1});
					}
				});					
			}
		}
		
		SetPreviewScript(TextBox);
		
		var SetUploadifyTrigger = function(){
			Trigger.uploadify({
				buttonText: '⇧',
				checkExisting: false,
				cancelImage: '',
				height: 22,
				width: 20,
				postData: Data,
				fileObjName: 'File',
				debug: (typeof(Data['Debug']) != 'undefined'),
				expressInstall: null,
				swf: gdn.combinePaths(WebRoot, '/plugins/Morf/vendors/uploadify3/uploadify.swf'),
				uploader: gdn.url('/dashboard/plugin/receiveupload'),
				auto: true,
				onUploadProgress: function(file, fileBytesLoaded, fileTotalBytes) {
					$(TextBox).data('inprogress', true);
					var percent = parseInt(fileBytesLoaded / fileTotalBytes * 100, 10);
					var stringprogress = file.name + ' / ' + parseInt(fileBytesLoaded/1024) + 'K ('+percent+'%)';
					$(TextBox).val(stringprogress);
				},
				onUploadStart: function(file) {
					TextBox.attr('disabled', 'disabled');
				},
				onUploadComplete: function(file) {
					TextBox.removeAttr('disabled');
					//console.log('onUploadComplete', file);
				},
				onUploadSuccess: function(file, data, response) {
					//console.log('onUploadSuccess', file, data, response);
					$(TextBox).val(data);
					SetPreviewScript(TextBox);
				},
				onUploadError: function(file, dummy, errorCode, errorMsg) {
					gdn.informError(file.name + ': ' + errorMsg);
					$(Trigger).uploadifyCancel(TriggerId);
					$(Trigger).uploadifyClearQueue();
				}
			});
		}
		
		$.doWhen(TestUploadify, SetUploadifyTrigger);
		
	});
	
	// 3) placeholder
	if (typeof($.placeHeld) == 'function') {
		$("input[placeholder]").placeHeld();
		//console.log($.placeHeld.clearPlace);
	}
	

	
});



/*
 * imgPreview jQuery plugin
 * Copyright (c) 2009 James Padolsey
 * j@qd9.co.uk | http://james.padolsey.com
 * Dual licensed under MIT and GPL.
 * Updated: 09/02/09
 * @author James Padolsey
 * @version 0.22.1
 */

// Fixed by S

(function($){
    
    $.expr[':'].linkingToImage = function(elem, index, match){
        // This will return true if the specified attribute contains a valid link to an image:
        return !! ($(elem).attr(match[3]) && $(elem).attr(match[3]).match(/\.(gif|jpe?g|png|bmp)$/i));
    };
    
    $.fn.imgPreview = function(userDefinedSettings){
        
        var s = $.extend({
            
            /* DEFAULTS */
            
            // CSS to be applied to image:
            imgCSS: {},
            // Distance between cursor and preview:
            distanceFromCursor: {top:10, left:10},
            // Boolean, whether or not to preload images:
            preloadImages: true,
            // Callback: run when link is hovered: container is shown:
            onShow: function(){},
            // Callback: container is hidden:
            onHide: function(){},
            // Callback: Run when image within container has loaded:
            onLoad: function(){},
            // ID to give to container (for CSS styling):
            containerID: 'imgPreviewContainer',
            // Class to be given to container while image is loading:
            containerLoadingClass: 'loading',
            // Prefix (if using thumbnails), e.g. 'thumb_'
            thumbPrefix: '',
            // Where to retrieve the image from:
            srcAttr: 'href'
            
        }, userDefinedSettings);
		
		// Fixed by S
		var $container = $('#'+s.containerID);
		if ($container.length == 0) {
			$container = $('<div/>').attr('id', s.containerID)
							.append('<img/>').hide()
							.css('position','absolute')
							.appendTo('body');
		}
            
        var $img = $('img', $container).css(s.imgCSS),
        
        // Get all valid elements (linking to images / ATTR with image link):
        $collection = this.filter(':linkingToImage(' + s.srcAttr + ')');
        
        // Re-usable means to add prefix (from setting):
        function addPrefix(src) {
            return src.replace(/(\/?)([^\/]+)$/,'$1' + s.thumbPrefix + '$2');
        }
        
        if (s.preloadImages) {
            (function(i){
                var tempIMG = new Image(),
                    callee = arguments.callee;
                tempIMG.src = addPrefix($($collection[i]).attr(s.srcAttr));
                tempIMG.onload = function(){
                    $collection[i + 1] && callee(i + 1);
                };
            })(0);
        }
        
        $collection
            .mousemove(function(e){
                $container.css({
                    top: e.pageY + s.distanceFromCursor.top + 'px',
                    left: e.pageX + s.distanceFromCursor.left + 'px'
                });
                
            })
            .hover(function(){
                
                var link = this;
                $container
                    .addClass(s.containerLoadingClass)
                    .show();
                $img
                    .load(function(){
                        $container.removeClass(s.containerLoadingClass);
                        $img.show();
                        s.onLoad.call($img[0], link);
                    })
                    .attr( 'src' , addPrefix($(link).attr(s.srcAttr)) );
                s.onShow.call($container[0], link);
                
            }, function(){
                
                $container.hide();
                $img.unbind('load').attr('src','').hide();
                s.onHide.call($container[0], this);
                
            });
        
        // Return full selection, not $collection!
        return this;
        
    };
    
})(jQuery);



/*
 * doWhen jQuery plugin
 * Copyright 2011, Emmett Pickerel
 * Released under the MIT Licence.
 */

/* jQuery.doWhen(function(){
  return !!document.getElementById('myelement');
}, function(){
  document.getElementById('myelement').innerHTML = "I'm loaded"!
});
*/

!function($){
var defaults, tick, start;
defaults = {
  interval: 100
};
tick = function(iVars){
  if (iVars.test()) {
    clearInterval(iVars.iid);
    iVars.cb.call(iVars.context || window, iVars.data);
  }
};
start = function(iVars){
  iVars.iid = setInterval(function(){
    tick(iVars);
  }, iVars.interval);
};
$.doWhen = function(test, cb, cfg){
  start($.extend({
    test: test,
    cb: cb
  }, defaults, cfg));
};
}(jQuery);
