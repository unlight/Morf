$(document).ready(function() {
	
	if (typeof($.livequery) != 'function') return;
	
	var WaitingInputs = [];
	var ReceiveUploadFileURL = gdn.url('plugin/receiveuploadfile');
	var Form;
	var ScriptsLoading = false;

	function BindUpload(input){
		noswfupload.lang.removeFile = '';
		var wrap = noswfupload.wrap(input, 0);
		var LocalInput = input;
		var UploadBoxText = $(LocalInput).parents('li').find('.InputBox').first();
		
		function DoUpload(){
			var file = wrap.files.shift();
			wrap.files = [file];
			wrap.upload({
				url: ReceiveUploadFileURL + '?' + $(Form).serialize() + '&DeliveryType=BOOL&DeliveryMethod=JSON',
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
					$(UploadBoxText).val(File.RelativePath);
					var InputB = $(UploadBoxText).next().find('input[type=file]').first();
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
		
		if (ScriptsLoading == false) {
			ScriptsLoading = true;
			$.getScript(gdn.url('plugins/Morf/sprintf.js'), function(){
				$.getScript(gdn.url('plugins/Morf/noswfupload/noswfupload.min.js'), BindAll);
			});
		}
		
		if (typeof(noswfupload) == 'object') BindUpload(InputFile);
		else WaitingInputs[WaitingInputs.length] = InputFile;

	});
	

	
});