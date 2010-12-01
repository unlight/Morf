$(document).ready(function() {
	var UploadBox = $('input[name$=_UploadBoxFile]'), Url = gdn.url('plugins/Morf/noswfupload/noswfupload.min.js');
	if (UploadBox.length == 0) return;
	
	var UploadBoxDirectory = gdn.definition('UploadBoxDirectory', false);
	//if (!UploadBoxDirectory) return;
	//if (!UploadBoxDirectory) throw "Definition 'UploadBoxDirectory' not defined.";
	var NoSwfUploadFileReceiverURL = gdn.definition('NoSwfUploadFileReceiverURL', false);
	if (!NoSwfUploadFileReceiverURL) NoSwfUploadFileReceiverURL = 

	// TODO: Add by JS
	// TODO: Add definition CFG dir which we must upload to
	
	$.getScript(Url, function(){
		
		noswfupload.lang.removeFile = '';
		
		//noswfupload.css( gdn.url('plugins/Morf/noswfupload/css/noswfupload.css') );
		var input = UploadBox.get(0);
		var wrap = noswfupload.wrap(input, 1024 * 1024);
		
		var GoUpload = function(){
			var file = wrap.files.shift();
			wrap.files = [file];
			//console.log(wrap.files);
			//console.log(this.value, 'bind_change');
			//this.value = '';
			if(wrap.files.length) {
				wrap.upload({
					url: gdn.url('plugin/noswfuploadfilefilereceiver'),
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
						$('#Form_File').val(xhr.responseText);
						
						//console.log(xhr.responseText);
						//console.log('onload', self, rpe, xhr);
						$('.noswfupload :input').first().bind('change', GoUpload);
					}
				});
			} else noswfupload.text(wrap.dom.info, "No files selected");
			//return  noswfupload.event.stop(e);
		}
		
		$('.noswfupload :input').first().bind('change', GoUpload);
		
	});

	//noswfupload.css("css/noswfupload.css", "css/noswfupload-icons.css");
	
	
});