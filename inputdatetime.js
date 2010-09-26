$(document).ready(function(){
	
	if(typeof($.livequery) != 'function') return;
	var JsDateTimeLoading = false;
	var i = document.createElement("input");
	var Inputs = {
		"date": {ifFormat: "%Y-%m-%d"},
		"datetime": {ifFormat: "%Y-%m-%d %H:%M", showsTime: true},
	};

	function SetInputs(){
		$.each(Inputs, function(Attribute, settings){
			if(typeof(Calendar) == 'function'){
				settings.firstDay = Calendar._FD || 1;
			}
			i.setAttribute("type", Attribute);
			if (i.type != "text") return;
			// No native date picker support :(
			$("input[type='"+Attribute+"']").livequery(function(){
				if(!$.isFunction($.fn.dynDateTime)) return LoadJsCalendar();
				$(this).each(function(index, node){
					if($(node).data('datetime') != null) return;
					$(node).attr('autocomplete', 'off').data('datetime', true);
					$(node).dynDateTime(settings);
				});
			});
		});
	}

	function LoadJsCalendar(){
		if(JsDateTimeLoading) return;
		JsDateTimeLoading = true;
		var jsdatetime = gdn.definition('JsDateTime');
		$('head').append('<link rel="stylesheet" type="text/css" href="'+jsdatetime + 'skins/aqua/theme.css" media="screen" />');
		//$.getScript(jsdatetime + 'jquery.dynDateTime.js');
		$.getScript(jsdatetime + 'jquery.dynDateTime.pack.js');
		$.getScript(gdn.definition('JsDateTimeLanguage'), SetInputs);
	}
	
	SetInputs();
	
});