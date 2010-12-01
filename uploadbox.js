$(document).ready(function() {
	var UploadBoxFile = $('input[name$=_UploadBoxFile]');
	if (UploadBoxFile.length == 0) return;
	var UploadBoxText = $(UploadBoxFile).prev();
	var NoSwfUploadFileReceiverURL = gdn.definition('NoSwfUploadFileReceiverURL', false);
	if (!NoSwfUploadFileReceiverURL) NoSwfUploadFileReceiverURL = gdn.url('plugin/noswfuploadfilefilereceiver');
	NoSwfUploadFileReceiverURL += '?DeliveryType=BOOL&DeliveryMethod=JSON';

	// TODO: Add by JS (or remove hidden)
	$.getScript( gdn.url('plugins/Morf/sprintf.js') );
	$.getScript(gdn.url('plugins/Morf/noswfupload/noswfupload.min.js'), function(){
		noswfupload.lang.removeFile = '';
		var input = UploadBoxFile.get(0);
		var wrap = noswfupload.wrap(input, 0);
		function DoUpload(){
			var file = wrap.files.shift();
			wrap.files = [file];
			wrap.upload({
				url: NoSwfUploadFileReceiverURL,
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
					//$(UploadBoxText).val(File.RelativePath);
					$('.noswfupload :input').first().bind('change', DoUpload);
					//$(UploadBoxText).removeAttr('disabled');
				}
			});
		}
		
		$('.noswfupload :input').first().bind('change', DoUpload);
		
	});

	
	
});