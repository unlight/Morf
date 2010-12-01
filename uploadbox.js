$(document).ready(function() {
	var UploadBox = $('input[name$=_UploadBoxFile]'), Url = gdn.url('plugins/Morf/noswfupload/noswfupload.min.js');
	if (UploadBox.length == 0) return;
	
	var NoSwfUploadFileReceiverURL = gdn.definition('NoSwfUploadFileReceiverURL', false);
	if (!NoSwfUploadFileReceiverURL) NoSwfUploadFileReceiverURL = gdn.url('plugin/noswfuploadfilefilereceiver');
	NoSwfUploadFileReceiverURL += '?DeliveryType=BOOL&DeliveryMethod=JSON';

	// TODO: Add by JS
	
	$.getScript(Url, function(){
		noswfupload.lang.removeFile = '';
		var input = UploadBox.get(0);
		var wrap = noswfupload.wrap(input, 1024 * 1024);
		function DoUpload(){
			var file = wrap.files.shift();
			wrap.files = [file];
			wrap.upload({
				url: NoSwfUploadFileReceiverURL,
				onerror: function(){
					//console.log('onerror', arguments);
					noswfupload.text(this.dom.info, "WARNING: Unable to upload " + this.file.fileName);
				},
				onprogress: function(rpe, xhr){
					//console.log('rpe.simulation', rpe.simulation)
					//console.log('onprogress', this.file, rpe, xhr);
				},
				onload: function(rpe, xhr){
					var self = this;
					eval("var File = " + xhr.responseText);
					console.log(File);
					$('#Form_File').val(File.RelativePath);
					//console.log(xhr.responseText);
					//console.log('onload', self, rpe, xhr);
					$('.noswfupload :input').first().bind('change', DoUpload);
				}
			});
		}
		
		$('.noswfupload :input').first().bind('change', DoUpload);
		
	});

	
	
});