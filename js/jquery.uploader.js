// jQuery HTML5 Uploader 1.0 (2 Nov 2011) 
// Requires XMLHttpRequest 2
// Supports: IE 10+, Firefox 4+, Chrome 12+, Safari 5+, Opera 12+

new function($) {
	
	var UploadedFilesIndex;
	var UploadedFilesLength;
	
	var UploadSession = function(Length) {
		UploadedFilesIndex = [];
		UploadedFilesLength = Length;
	}
	
	var Defaults = {
		Name: "File",
		PostUrl: "upload.php",
		DeliveryType: 'DATA',
		DeliveryMethod: 'JSON',
		ServerReadyStateChange: false,
		BeforeSend: false,
		ServerComplete: false,
		ServerCompleteAll: false,
		PostData: { }
	};
	
	var FalseFunction = function() {
		return false;
	}
	
	
	$.fn.Uploader = function(Options) {

		var Settings = $.extend({ }, Defaults, Options);
		
		var FileHandler = function(MyFile, Index) {
			
			var XHR = new XMLHttpRequest();
			var EventArguments = {XHR: XHR, File: MyFile, Index: Index};
			var Handlers = "Abort Error Load LoadEnd LoadStart Progress".split(" ");
			var FR = new FileReader();
			var LoweredEventName;
			var EventName;
			var N;
			
			for (N = Handlers.length - 1; N >= 0; N--) {
				EventName = "Client" + Handlers[N];
				if (typeof(Settings[EventName]) == 'function') {
					LoweredEventName = Handlers[N].toLowerCase();
					FR[LoweredEventName] = function(Event) {
						EventArguments.Event = Event;
						Settings[EventName](EventArguments);
					}
				}
			}
			FR.readAsDataURL(MyFile);
			for (N = Handlers.length - 1; N >= 0; N--) {
				EventName = "Server" + Handlers[N];
				if (typeof Settings[EventName] == 'function') {
					LoweredEventName = Handlers[N].toLowerCase();
					XHR.upload[LoweredEventName] = function(Event) {
						EventArguments.Event = Event;
						Settings[EventName](EventArguments);
					}
				}
			}
			
			var StateChangeHandler = function(Event) {
				EventArguments.Event = Event;
				if (Settings.ServerReadyStateChange) Settings.ServerReadyStateChange(EventArguments);
				if (XHR.readyState == 4) {
					if (Settings.DeliveryMethod == 'JSON') EventArguments.Json = $.parseJSON(XHR.responseText);
					if (Settings.ServerComplete) Settings.ServerComplete(EventArguments);
					UploadedFilesIndex.push(Index);
					if (UploadedFilesLength == UploadedFilesIndex.length) {
						if (Settings.ServerCompleteAll) Settings.ServerCompleteAll(EventArguments);
					}
				}
			};

			XHR.onreadystatechange = function(Event) {
				try {
					StateChangeHandler(Event);
				} catch (Exception) {
					if (typeof console.log != 'undefined') console.log(Ex);
					else alert(Ex);
					throw Ex;
				}
				
			}
			
			XHR.open("POST", Settings.PostUrl, true);
			var FD = new FormData();
			for (var i in Settings.PostData) FD.append(i, Settings.PostData[i]);
			FD.append('DeliveryType', Settings.DeliveryType);
			FD.append('DeliveryMethod', Settings.DeliveryMethod);
			if (typeof Settings.Debug != 'undefined' && Settings.Debug) FD.append('Debug', 1);
			FD.append(Settings.Name, MyFile);
			if (Settings.BeforeSend) Settings.BeforeSend(EventArguments);
			XHR.send(FD);
		};
		
		var BindFile = function() {
			$(this).bind("change", function(){
				var Length = this.files.length;
				UploadSession(Length);
				for (var i = 0; i < Length; i++) FileHandler(this.files[i], i);
			});
		}
		
		var BindDrop = function() {
			$(this).bind("dragenter dragover", FalseFunction);
			$(this).bind("drop", function(e) {
				var files = e.originalEvent.dataTransfer.files;
				UploadSession(files.length);
				for (var i = 0; i < files.length; i++) FileHandler(files[i], i);
				return false;
			});
		}
		
		this.each(function() {
			if ($(this).is("[type=file]")) return BindFile.call(this);
			BindDrop.call(this);
		});
		
		return this;
	};
}(jQuery);