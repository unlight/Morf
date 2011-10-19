$(document).ready(function(){
	if (typeof($.livequery) != 'function') return;
	var WebRoot = gdn.definition('WebRoot');
	var addcssfile = function(file, webroot) {
		var link = $('<link>', {rel: 'stylesheet', type: 'text/css', charset:'utf-8'});
		if (typeof(webroot) != 'undefined') file = gdn.combinePaths(webroot, file);
		$(link).attr('href', file);
		$('head').append(link);
	}
	
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
		
		Data['TransientKey'] = TransientKey;
		Data['SessionUserID'] = SessionUserID;
		//Data['Debug'] = 1;
		
		var SetUploadifyTrigger = function(){
			Trigger.uploadify({
				buttonText: '⇧',
				checkExisting: false,
				cancelImage: '',
				height: 22,
				width: 25,
				postData: Data,
				fileObjName: 'File',
				debug: true,
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
					//console.log(file);
				},
				onUploadComplete: function(file) {
					//console.log('onUploadComplete', file);
				},
				onUploadSuccess: function(file, data, response) {
					//console.log('onUploadSuccess', file, data, response);
					$(TextBox).val(data);
				},
				onUploadError: function(file, dummy, errorCode, errorMsg) {
					var ErrorMsg = file.name + ': ' + errorMsg;
					gdn.informError(ErrorMsg);
					$(Trigger).uploadifyCancel(TriggerId);
					$(Trigger).uploadifyClearQueue();
				}
			});
		}
		
		$.doWhen(TestUploadify, SetUploadifyTrigger);
		
	});
	
	// 24 Mar 2011 upload box
	
/*	var uploadboxfile_count = 1;
	var uploadwebroot = gdn.combinePaths(WebRoot, 'plugins/Morf/vendors/jquery-file-upload');
	var receivefileurl = gdn.url('plugin/receiveuploadfile');
	var loaded_fileupload = false;
	
	var dot_progress = function(inputtextbox) {
		if ($(inputtextbox).data('inprogress')) return;
		var dots = $(inputtextbox).val() + '.';
		if (dots.length > 10) dots = '.';
		$(inputtextbox).val(dots);
		setTimeout(dot_progress, 250, inputtextbox);
	};
	
	var init_upload_input = function(inputfile){
		if ($(inputfile).data('loaded')) return;
		if (!loaded_fileupload) {
			loaded_fileupload = true;
			IncludeJs( gdn.combinePaths(uploadwebroot, '/jquery.fileupload.js') );
			IncludeJs( gdn.combinePaths(uploadwebroot, '/jquery.fileupload-ui.js') );
		}
		
		$.doWhen(function(){
			return typeof($.fn.fileUploadUI) == 'function';
		}, function(){
			$(inputfile).data('loaded', true);
			var filter = $(inputfile).attr('id').replace('UploadBoxFile', '');
			var inputtextbox = $('#'+filter)[0];
			var form = $(inputfile).parents('form')[0];
			var uploadto = $('#'+filter+'UploadTo', form).val();
			if (!uploadto) {
				if (filter.indexOf('-dot-') > 0) {
					var uploadname = filter.split('-dot-')[1] +'UploadTo';
					uploadto = $('input[name$='+uploadname+']', form).val();
				}
			}
			
			$(form).fileUploadUI({
				url: receivefileurl + '?UploadTo=' + uploadto + '&DeliveryType=BOOL&DeliveryMethod=JSON',
				namespace: 'FileUpload'+ (uploadboxfile_count++),
				fileInputFilter: 'input[id^="'+filter+'"]',
				dragDropSupport: false,
				initUpload: function(event, files, index, xhr, uploadSettings, callback){
					$(inputtextbox).attr('disabled', 'disabled');
					$(inputtextbox).data('inprogress', false);
					dot_progress(inputtextbox, inputfile);
					callback(); // start upload
				},
				onLoad: function(e, files, index, xhr, handler){
					$(inputtextbox).data('inprogress', true);
					var result = handler.parseResponse(xhr);
					$(inputtextbox).val('').removeAttr('disabled');
					if (result.FormSaved == false) return gdn.inform(result.StatusMessage);
					if (result.File) {
						$(inputtextbox).val(result.File.RelativePath);
					}
				},
				formData: function (form) {
					return {};
				},
				onProgress: function(event, files, index, xhr, handler){
					$(inputtextbox).data('inprogress', true);
					var file = files[index];
					var percent = parseInt(event.loaded / event.total * 100, 10);
					var stringprogress = file.name + ' / ' + parseInt(event.loaded/1024) + 'K ('+percent+'%)';
					$(inputtextbox).val(stringprogress);
				}
			});
		});
	}
	
	$('input[name$=UploadBoxFile]').livequery(function(){
		init_upload_input(this);
	});*/

	// 25 mar 2011 (https://developer.mozilla.org/en/DOM/File)
/*	$('a.UploadDBox').each(function(index, element){
		$(element).click(function(e){
			var inputfile = $(this).prev('input:file');
			inputfile.click();
			e.preventDefault();
		});
	});*/

	
	// 3) placeholder
	if (typeof($.placeHeld) == 'function') {
		$("input[placeholder]").placeHeld();
		//console.log($.placeHeld.clearPlace);
	}
	

	
});