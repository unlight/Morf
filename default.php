<?php if(!defined('APPLICATION')) exit();

/* ==========================================================
FEATURES:
Some render improvements in form class. 
1) switched month and day menu in Date(); [REMOVED]
2) added id attribute to form errors (for future jquery plugins/effects);
3) allow intercept form enctype param (example: $Controller->Form->SetMultipart(), call it before render. Controller_Render_Before() is good place);
4) columned CheckBoxList().
5) HTML5 form input attributes

USAGE:
// HTML5 form input attributes
echo $this->Form->DateTimeBox('MyDate'); // Result: <input type="datetime" name="Form_MyDate" ...
echo $this->Form->DateBox('MyDate'); // Result: <input type="date" name="Form_MyDate" ...
echo $this->Form->TextBox('MyName', array('placeholder' => 'Enter your name here...'));
// Result: <input type="date" name="Form_MyDate" placeholder="Enter your name here...">

KNOWN ISSUES:
- No effect if form object was created directly by operator "new" (eg. $Form = new Gdn_Form).
- Use Gdn::Factory (or property (array) Uses in Gdn_Controller class)

TODO:
- settings / config

CHANGELOG:
0.01 (1 Sep 2009)
0.02 (15 Sep 2009)
0.03 (19 Sep 2009)
[new] plugin and form merged to one class
[add] added bInitialized
0.04 (30 Sep 2009)
[add] allow change form enctype (multipart/form-data)
0.05 (20 Nov 2009)
[add] CheckBoxList() (if list hast too many items it be three or four columned)
0.09 (27 Nov 2009)
[fix] fixed CheckBoxList() if ValueDataSet is not array
[fix] css fixes
1.1 (19 Jul 2010)
[new] emulate input[date], input[datetime] attributes http://www.miketaylr.com/code/input-type-attr.html
1.2 (22 Jul 2010)
[alt] better native date picker detection
1.3 (4 Aug 2010)
[alt] jscalendar replaced jquery.dynDateTime (same)
[fix] typo ValueField => FieldName
1.4 (14 Aug 2010)
- fixed first day of the week for my locale
*/

$PluginInfo['Morf'] = array(
	'Name' => 'Morf',
	'Description' => 'Extended form class.',
	'Version' => '1.4',
	'Date' => '14 Aug 2010',
	'Author' => 'Frostbite',
	'AuthorUrl' => 'http://www.malevolence2007.com',
	'License' => 'Liandri License'
);

$tmp = Gdn::FactoryOverwrite(True);
Gdn::FactoryInstall('Form', 'MorfForm', dirname(__FILE__) . DS. 'class.extendedform.php');
Gdn::FactoryOverwrite($tmp);
unset($tmp);


// morf ~ form ()
class MorfPlugin extends Gdn_Plugin {
	
	public function Base_Render_Before(&$Sender) {
		if(property_exists($Sender, 'Form') == False) return;
		$Sender->AddCssFile('plugins/Morf/morf.css');
		$WebRootPlugin = Gdn_Plugin::GetWebResource('');
		$Sender->AddDefinition('JsDateTime', $WebRootPlugin . 'jquery.dynDateTime/');
		
		$Sender->AddJsFile($WebRootPlugin.'inputdatetime.js');
		$Sender->AddJsFile($WebRootPlugin.'jquery.placeheld.js');
		
		$Language = ArrayValue(0, explode('-', Gdn::Locale()->Current()));
		foreach(array($Language, 'en') as $Language){
			$LanguageJsFile = 'jquery.dynDateTime/lang/calendar-'.$Language.'.js';
			if(file_exists(Gdn_Plugin::GetResource($LanguageJsFile))){
				$Sender->AddDefinition('JsDateTimeLanguage', $WebRootPlugin.$LanguageJsFile);
				break;
			}
		}
	

	}
	
	
	public function Setup() {
	}
	
}


















