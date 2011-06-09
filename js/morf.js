$(document).ready(function(){
	if (typeof($.livequery) != 'function') return;
	var WebRoot = gdn.definition('WebRoot');
	
	// 27 Apr 2011. Input datetime
	var calendarloaded = 0;
	var dyndtwebroot = gdn.combinePaths(WebRoot, 'plugins/Morf/vendors/jquery.dynDateTime');
	var input = document.createElement("input");
	
	var makeinputcalendar = function(element, settings){
		if (element.type != "text") return;
		if (calendarloaded == 0) {
			calendarloaded = 1;
			LazyLoad.css(dyndtwebroot+'/skins/aqua/theme.css');
			var files = [dyndtwebroot+'/jquery.dynDateTime.pack.js', dyndtwebroot+'/lang/'+gdn.definition('CalendarLanguage')];
			LazyLoad.js(files, function(){
				calendarloaded = 2;
			});
		}
		
		if (calendarloaded != 2) {
			setTimeout(makeinputcalendar, 10, element, settings);
			return;
		}
		
		// make sure that Calendar is loaded
		if (typeof(Calendar) != 'function') throw new Error("Calendar not loaded.");
		settings.firstDay = Calendar._FD || 1;
		if($(element).data('datetime') != null) return;
		$(element).attr('autocomplete', 'off').data('datetime', true);
		$('<button class="Button DateBoxPicker" title="Choose date...">...</button>').insertAfter(element);
		$(document.createTextNode(" ")).insertAfter(element);
		$(element).dynDateTime(settings);
	};
	
	$("input[type=date]").livequery(function(){
		makeinputcalendar(this, {ifFormat: "%Y-%m-%d", button: ".next()"});
	});
	
	$("input[type=datetime]").livequery(function(){
		makeinputcalendar(this, {ifFormat: "%Y-%m-%d %H:%M", showsTime: true, button: ".next()"});
	});
	
	// 24 Mar 2011 upload box
	var dot_progress = function(inputtextbox) {
		if ($(inputtextbox).data('inprogress')) return;
		var dots = $(inputtextbox).val() + '.';
		if (dots.length > 10) dots = '.';
		$(inputtextbox).val(dots);
		setTimeout(dot_progress, 250, inputtextbox);
	};
	
	var init_upload_input = function(inputfile){
		if ($(inputfile).data('loaded')) return;
		if (loaded_fileupload == 0) {
			loaded_fileupload = 1;
			var files = [uploadwebroot+'/jquery.fileupload.js'];
			//files[files.length] = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/jquery-ui.min.js';
			files[files.length] = uploadwebroot+'/jquery.fileupload-ui.js';
			LazyLoad.js(files, function(){
				loaded_fileupload = 2;
			});
		}
		if (loaded_fileupload != 2) {
			setTimeout(init_upload_input, 10, inputfile);
			return;
		}
		
		$(inputfile).data('loaded', true);
		var filter = $(inputfile).attr('id').replace('UploadBoxFile', '');
		var inputtextbox = $('#'+filter)[0];
		var form = $(inputfile).parents('form')[0];
		var uploadto = $('#'+filter+'UploadTo', form).val();
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
	}
	
	var uploadboxfile_count = 1;
	var uploadwebroot = gdn.combinePaths(WebRoot, 'plugins/Morf/vendors/jquery-file-upload');
	var receivefileurl = gdn.url('plugin/receiveuploadfile');
	var loaded_fileupload = 0;
	
	$('input[name$=UploadBoxFile]').livequery(function(){
		init_upload_input(this);
	});

	// 25 mar 2011 (https://developer.mozilla.org/en/DOM/File)
/*	$('a.UploadDBox').each(function(index, element){
		$(element).click(function(e){
			var inputfile = $(this).prev('input:file');
			inputfile.click();
			e.preventDefault();
		});
	});*/

	
	// 3. placeholder
	if (typeof($.placeHeld) == 'function') {
		$("input[placeholder]").placeHeld();
		//console.log($.placeHeld.clearPlace);
	}
	

	
});