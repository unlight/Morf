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
					//console.log(node);
					$('<button class="Button DateBoxPicker" title="Choose date...">...</button>')
						.insertAfter(node);
					$(document.createTextNode(" ")).insertAfter(node);
					$(node).dynDateTime(settings);
				});
			});
		});
	}

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
	
	
	// 2. upload box
	
	var WaitingInputs = [];
	var ReceiveUploadFileURL = gdn.url('plugin/receiveuploadfile');
	var Form;
	var ScriptsLoading = false;

	function BindUpload(input){
		noswfupload.lang.removeFile = '';
		var wrap = noswfupload.wrap(input, 0);
		var LocalInput = input;
		var UploadBoxText = $(LocalInput).parents('li').find('.InputBox').first();
		//var label = $(LocalInput).parents('li').find('label[for='+UploadBoxText.attr('id')+']');
		//var up = $(LocalInput).parents('li').find('.noswfupload');
		//$('<span>', {'class': 'ChooseFile', html:'&uarr;'}).insertAfter(LocalInput);
		//$('<span>', {'class': 'ChooseFile'}).wrap(LocalInput);
		//$('<span>', {'class': 'ChooseFile', html:'&uarr;'}).prependTo(up);
		
		function DoUpload(){
			var file = wrap.files.shift();
			wrap.files = [file];
			var uploadto = $.param(Form.find('input[name$=UploadTo]').get());
			var url = ReceiveUploadFileURL + '?' + uploadto + '&DeliveryType=BOOL&DeliveryMethod=JSON';
			//console.log(uploadto, url);
			wrap.upload({
				url: url,
				onerror: function(){
					gdn.inform("WARNING: Unable to upload " + this.file.fileName, true);
				},
				onprogress: function(rpe, xhr){
					$(UploadBoxText).attr('disabled', 'disabled');
					var Sent = 0, Total = 0;
					if (this.file.fileSize !== -1) {
						Total = noswfupload.size(this.total);
						Sent = noswfupload.size(this.sent + rpe.loaded);
					} else {
						Sent = (this.sent / 100);
						Total = (this.total / 100);
					}
					$(UploadBoxText).val(sprintf('%s, uploading: %s / %s', this.file.fileName, Sent, Total));
				},
				onload: function(rpe, xhr){
					var self = this;
					eval("var File = " + xhr.responseText);
					if (File.Exception !== undefined) {
						gdn.inform(File.Exception, true);
					}
					$(UploadBoxText).val(File.RelativePath);
					var InputB = $(UploadBoxText).parent().find('.noswfupload > input[type=file]').first();
					//console.log(InputB, UploadBoxText);
					$(InputB).bind('change', DoUpload);
					$(UploadBoxText).removeAttr('disabled');
				}
			});
		}

		$(LocalInput).bind('change', DoUpload);
	}
	
	function BindAll() {
		for (var i = 0; i < WaitingInputs.length; i++) {
			//console.log(i + ' ' + WaitingInputs[i], $(WaitingInputs[i]));
			BindUpload(WaitingInputs[i]);
		}
		
		WaitingInputs.length = 0;
	}
	
	$('input[name$=UploadBoxFile]').livequery(function(){
		var InputFile = this;
		if ($(InputFile).parents().is('.noswfupload')) return;
		if (!Form) Form = $(InputFile).parents('form').first();
		//console.log(InputFile);
		
		if (ScriptsLoading == false) {
			ScriptsLoading = true;
			$.getScript(gdn.url('plugins/Morf/js/sprintf.js'), function(){
				$.getScript(gdn.url('plugins/Morf/noswfupload/noswfupload.min.js'), BindAll);
			});
		}
		
		if (typeof(noswfupload) == 'object') BindUpload(InputFile);
		else WaitingInputs[WaitingInputs.length] = InputFile;

	});
	
	
	// 3. placeholder
	if (typeof($.placeHeld) == 'function') {
		$("input[placeholder]").placeHeld();
		//console.log($.placeHeld.clearPlace);
	}
	

	
});