$(document).ready(function(){
	
	if (typeof($.livequery) != 'function') return;
	
	// 1. Input datetime
	var JsDateTimeLoading = false;
	var input = document.createElement("input");
	var Inputs = {
		"date": {ifFormat: "%Y-%m-%d", button: ".next()"},
		"datetime": {ifFormat: "%Y-%m-%d %H:%M", showsTime: true, button: ".next()"}
	};
	
	function SetInputs(){
		$.each(Inputs, function(Attribute, settings){
			if(typeof(Calendar) == 'function'){
				settings.firstDay = Calendar._FD || 1;
			}
			input.setAttribute("type", Attribute);
			if (input.type != "text") return;
			
			// No native date picker support :(
			$("input[type='"+Attribute+"']").livequery(function(){
				if (!$.isFunction($.fn.dynDateTime)) return LoadJsCalendar();
				$(this).each(function(index, node){
					if($(node).data('datetime') != null) return;
					$(node).attr('autocomplete', 'off').data('datetime', true);
					$('<button class="Button DateBoxPicker" title="Choose date...">...</button>')
						.insertAfter(node);
					$(document.createTextNode(" ")).insertAfter(node);
					$(node).dynDateTime(settings);
				});
			});
		});
	}

	// TODO: LazyLoad Calendar
	function LoadJsCalendar(){
		if(JsDateTimeLoading) return;
		JsDateTimeLoading = true;
		var jsdatetime = gdn.definition('JsDateTime');
		$('head').append('<link rel="stylesheet" type="text/css" href="'+jsdatetime + '/skins/aqua/theme.css" media="screen" />');
		$.getScript(jsdatetime + '/jquery.dynDateTime.pack.js');
		var LangFile = jsdatetime + '/lang/' + gdn.definition('JsDateTimeLanguage');
		$.getScript(LangFile, SetInputs);
	}
	
	SetInputs();
	
	
	// 24 Mar 2011 upload box
	var init_upload_input = function(){
		var inputfile = this;
		if ($(inputfile).data('loaded')) return;
		$(inputfile).data('loaded', true);
		var filter = $(inputfile).attr('id').replace('UploadBoxFile', '');
		filter = 'input[id^="'+filter+'"]';
		var form = $(inputfile).parents('form')[0];
		var uploadto = $(form).find('input[name$=UploadTo]').val(); // TODO: fix uploadto var
		$(form).fileUpload({
			namespace: 'FileUpload'+ Math.floor(Math.random() * 99999999),
			fileInputFilter: filter,
			dragDropSupport: false,
			initUpload: function(event, files, index, xhr, uploadSettings, Callback){
				//console.log('initUpload', arguments);
				Callback();
			},
			onProgress: function(event, files, index, xhr, handler){
				//console.log(event, files, index, xhr, handler);
				if (handler.progressbar) {
					handler.progressbar.progressbar('value', parseInt(event.loaded / event.total * 100, 10));
				}
			},
			url: receivefileurl + '?UploadTo=' + uploadto + '&DeliveryType=BOOL&DeliveryMethod=JSON'
		});
	}
	
	var uploadwebroot = gdn.definition('WebRoot') + 'plugins/Morf/blueimp-jquery-file-upload';
	var receivefileurl = gdn.url('plugin/receiveuploadfile');
	var jsfiles = [];
	jsfiles[jsfiles.length] = uploadwebroot+'/jquery.fileupload.js';
	jsfiles[jsfiles.length] = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/jquery-ui.min.js';
	jsfiles[jsfiles.length] = uploadwebroot+'/jquery.fileupload-ui.js';
	LazyLoad.js(jsfiles, function(){
		$('input[name$=UploadBoxFile]').livequery(init_upload_input);
	});
	

	
	
	// 3. placeholder
	if (typeof($.placeHeld) == 'function') {
		$("input[placeholder]").placeHeld();
		//console.log($.placeHeld.clearPlace);
	}
	

	
});