// Modified jQuery HTML5 Uploader 1.0b by http://www.igloolab.com/jquery-html5-uploader
// S (2 Nov 2011) 
// Requires XMLHttpRequest 2
// Supports: IE 10+, Firefox 4+, Chrome 12+, Safari 5+, Opera 12+

(function ($) {
	
	var UploadedFilesIndex;
	var UploadedFilesLength;
	
	var UploadSession = function(Length) {
		UploadedFilesIndex = [];
		UploadedFilesLength = Length;
	}
	
	$.fn.Uploader = function (Options) {

		var Settings = {
			PostData: { },
			DeliveryType: 'DATA',
			DeliveryMethod: 'JSON',
			onServerComplete: null,
			onServerCompleteAll: null,
			name: "uploadedFile",
			postUrl: "Upload.aspx",
			onClientAbort: null,
			onClientError: null,
			onClientLoad: null,
			onClientLoadEnd: null,
			onClientLoadStart: null,
			onClientProgress: null,
			onServerAbort: null,
			onServerError: null,
			onServerLoad: null,
			onServerLoadStart: null,
			onServerProgress: null,
			onServerReadyStateChange: null,
			BeforeSend: null
		};
		
		if (Options) $.extend(Settings, Options);

		return this.each(function (Options) {
			var $this = $(this);
			if ($this.is("[type='file']")) {
				$this.bind("change", function () {
					var files = this.files;
					UploadSession(files.length);
					for (var i = 0; i < files.length; i++) {
						FileHandler(files[i], i);
					}
				});
			} else {
				$this.bind("dragenter dragover", function () {
					return false;
				}).bind("drop", function (e) {
					var files = e.originalEvent.dataTransfer.files;
					UploadSession(files.length);
					for (var i = 0; i < files.length; i++) {
						FileHandler(files[i], i);
					}
					return false;
				});
			}
		});

		function FileHandler(file, Index) {
			var fileReader = new FileReader();
			var Handlers = "Abort Error Load LoadEnd LoadStart Progress".split(" ");
			for (N = Handlers.length - 1; N >= 0; N--) {
				var FileReaderHandlerName = "On" + Handlers[N].toLowerCase();
				var SettingsHandlerName = "OnClient" + Handlers[N];
				
				if (typeof Settings[EventName] == 'function' && typeof(Settings[EventName]) == 'function') {
					fileReader[LoweredEventName] = Settings[EventName];
				}
			}
			
			fileReader.onabort = function (e) {
				if (Settings.onClientAbort) {
					Settings.onClientAbort(e, file);
				}
			};
			fileReader.onerror = function (e) {
				if (Settings.onClientError) {
					Settings.onClientError(e, file);
				}
			};
			fileReader.onload = function (e) {
				if (Settings.onClientLoad) {
					Settings.onClientLoad(e, file);
				}
			};
			fileReader.onloadend = function (e) {
				if (Settings.onClientLoadEnd) {
					Settings.onClientLoadEnd(e, file);
				}
			};
			fileReader.onloadstart = function (e) {
				if (Settings.onClientLoadStart) {
					Settings.onClientLoadStart(e, file);
				}
			};
			fileReader.onprogress = function (e) {
				if (Settings.onClientProgress) {
					Settings.onClientProgress(e, file);
				}
			};
			
			fileReader.readAsDataURL(file);
			var xmlHttpRequest = new XMLHttpRequest();
			xmlHttpRequest.upload.onabort = function (e) {
				if (Settings.onServerAbort) {
					Settings.onServerAbort(e, file);
				}
			};
			xmlHttpRequest.upload.onerror = function (e) {
				if (Settings.onServerError) {
					Settings.onServerError(e, file);
				}
			};
			xmlHttpRequest.upload.onload = function (e) {
				if (Settings.onServerLoad) {
					Settings.onServerLoad(e, file);
				}
			};
			xmlHttpRequest.upload.onloadstart = function (e) {
				if (Settings.onServerLoadStart) {
					Settings.onServerLoadStart(e, file);
				}
			};
			xmlHttpRequest.upload.onprogress = function (e) {
				if (Settings.onServerProgress) {
					Settings.onServerProgress(e, file);
				}
			};
			xmlHttpRequest.onreadystatechange = function (e) {
				if (Settings.onServerReadyStateChange) {
					Settings.onServerReadyStateChange(xmlHttpRequest, e, file);
				}
				if (xmlHttpRequest.readyState == 4) {
                    var data;
                    if (Settings.DeliveryMethod == 'JSON') data = $.parseJSON(xmlHttpRequest.responseText);
					if (Settings.onServerComplete) Settings.onServerComplete(xmlHttpRequest, e, file, data, Index);
					UploadedFilesIndex.push(Index);
					if (UploadedFilesLength == UploadedFilesIndex.length) {
						if (Settings.onServerCompleteAll) Settings.onServerCompleteAll(xmlHttpRequest, e);
					}
				}
			};
			
			xmlHttpRequest.open("POST", Settings.postUrl, true);
            var formData = new FormData();
            for (var i in Settings.PostData) formData.append(i, Settings.PostData[i]);
            formData.append('DeliveryType', Settings.DeliveryType);
            formData.append('DeliveryMethod', Settings.DeliveryMethod);
            if (typeof Settings.debug != 'undefined' && Settings.debug) formData.append('Debug', 1);
            formData.append(Settings.name, file);
			if (Settings.BeforeSend) Settings.BeforeSend(xmlHttpRequest);
            xmlHttpRequest.send(formData);
		}
	};
})(jQuery);