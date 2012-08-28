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
		return (typeof(Calendar) != 'undefined' && typeof(Calendar._FD) != 'undefined');
	}
	
	var makeinputcalendar = function(element, settings) {
		settings.displayArea = '.andSelf()';
		if (!calendarloading){
			calendarloading = true;
			addcssfile('/skins/aqua/theme.css', dyndtwebroot);
			IncludeJs([
				gdn.combinePaths(dyndtwebroot, '/jquery.dynDateTime.js'),
				gdn.combinePaths(dyndtwebroot, '/lang/calendar-'+gdn.definition('CalendarLanguage')+'.js')
			]);
		}
		$.doWhen(testcalendar, function(){
			settings.firstDay = (typeof Calendar._FD == 'undefined') ? 1 : Calendar._FD;
			if ($(element).data('datetime') != null) return;
			$(element).attr('autocomplete', 'off').data('datetime', true);
			$(element).dynDateTime(settings);
		});
	};
	
	$("input.InputBox.DateBox").livequery(function(){
		makeinputcalendar(this, {ifFormat: "%Y-%m-%d"});
	});
	
	$("input.InputBox.DateTimeBox").livequery(function(){
		makeinputcalendar(this, {ifFormat: "%Y-%m-%d %H:%M", showsTime: true});
	});
	
	
	// 2) 19 Oct 2011 (Uploadify)
	var UploadifyLoading = false;
	var TestUploadify = function() {
		return typeof($.fn.uploadify) == 'function';
	}
	var LoadUploadify = function() {
		if (UploadifyLoading) return;
		UploadifyLoading = true;
		IncludeJs( gdn.combinePaths(WebRoot, '/plugins/Morf/vendors/uploadify3/jquery.uploadify.js') );
	}
	
	var TransientKey = gdn.definition('TransientKey');
	var SessionUserID = gdn.definition('SessionUserID');

	$('input[id$=UploadBox]').livequery(function(){
		LoadUploadify();
		var Data = $.parseJSON($(this).val());
		var UploadFolder = $(this).val();
		var TextBox = $(this).prev();
		
		var TriggerId = TextBox.attr('id') + '_' + Math.floor(Math.random() * 999999);
		var TriggerHtml = '<span class="UploadBoxTrigger"><span style="display:inline" id="'+TriggerId+'"></span></span>';
		$(TextBox).after(TriggerHtml);
		
		Data['TransientKey'] = TransientKey;
		Data['SessionUserID'] = SessionUserID;
		//Data['Debug'] = 1;
		Data['Uploadify'] = 1;
		Data['DeliveryType'] = 'DATA';
		
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
			var Trigger = $('#'+TriggerId);
			Trigger.uploadify({
				//buttonText: '&#x2227;',
				buttonText: 'upload',
				checkExisting: false,
				cancelImage: '',
				height: 15,
				width: 45,
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
				},
				onUploadSuccess: function(file, data, response) {
					$(TextBox).val(data);
					SetPreviewScript(TextBox);
					TextBox.removeAttr('disabled');
				},
				onUploadError: function(file, dummy, errorCode, errorMsg) {
					gdn.informError(file.name + ': ' + errorMsg);
					$(Trigger).uploadifyCancel(TriggerId);
					$(Trigger).uploadifyClearQueue();
				}
			});
		};
		
		var onInit = function() {
			var textbox_height = $(TextBox).innerHeight();
			var $button = $('#'+TriggerId);
			var $uploadboxtrigger = $button.parent();
			var button_text_height = $uploadboxtrigger.innerHeight();
			var c = Math.ceil( (textbox_height - button_text_height) / 2 );
			$uploadboxtrigger.css('margin-top', c);
			var button_text_width = $uploadboxtrigger.width();
			$uploadboxtrigger.css('margin-left', - (button_text_width + (c * 0.5) ));
		};
		
		$.doWhen(TestUploadify, function(){
			SetUploadifyTrigger();
			onInit();
		});
		
	});
	
	// 3) placeholder
	if (typeof($.placeHeld) == 'function') {
		$("input[placeholder]").placeHeld();
		//console.log($.placeHeld.clearPlace);
	}
	
	// 4) Drag-n-drop upload to textbox
	if (typeof $.fn.Uploader == 'function') {
		var DragUploadSettings = {
			BeforeSend: function() {
				$(this.t).data('Selection', $(this.t).getSelection());
			},
			ServerComplete: function(EventArguments) {
				var XHR = EventArguments.XHR;
				var Data = EventArguments.Json;
				if (XHR.status != 200) return gdn.informError(XHR);
				var TextBox = this.t;
				var Range = $(TextBox).data('Selection');
				var TextVal = $(TextBox).val();
				var Prefix = (/\s/.test(TextVal.substr(Range.start - 1, 1))) ? "\n" : '';
				var NewText = TextVal.substr(0, Range.start)
					+ Prefix
					+ Data.Result
					+ TextVal.substr(Range.start);
				$(TextBox).val(NewText);
				$(TextBox).setCursorPosition(Range.start + Data.Result.length + 1);
			},
			//Debug: true,
			DeliveryType: 'DATA',
			DeliveryMethod: 'JSON',
			PostData: {Asset: 1},
			Name: 'File',
			PostUrl: gdn.url('/dashboard/plugin/receiveupload')
		};
		$('textarea.Uploader, input.Uploader').each(function(){
			DragUploadSettings.t = this;
			$(this).Uploader(DragUploadSettings);
		});
	}
	
});

// http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
new function($) {
	$.fn.setCursorPosition = function(pos) {
		if ($(this).get(0).setSelectionRange) {
			$(this).get(0).setSelectionRange(pos, pos);
		} else if ($(this).get(0).createTextRange) {
			var range = $(this).get(0).createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos);
			range.select();
		}
	}
}(jQuery);



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
