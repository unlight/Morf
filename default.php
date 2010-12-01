<?php if(!defined('APPLICATION')) exit();

/* ==========================================================
FEATURES:
Some render improvements in form class. 
1) switched month and day menu in Date(); [REMOVED]
2) added id attribute to form errors (for future jquery plugins/effects);
3) allow intercept form enctype param (example: $Controller->Form->SetMultipart(), call it before render. Controller_Render_Before() is good place);
4) columned CheckBoxList().
5) HTML5 form input attributes
6) Allow strip long text values in dropdown menu
7) UploadBox() method. AJAX uploader.

USAGE:
// HTML5 form input attributes
echo $this->Form->DateTimeBox('MyDate'); // Result: <input type="datetime" name="Form_MyDate" ...
echo $this->Form->DateBox('MyDate'); // Result: <input type="date" name="Form_MyDate" ...
echo $this->Form->TextBox('MyName', array('placeholder' => 'Enter your name here...'));
// Result: <input type="date" name="Form_MyDate" placeholder="Enter your name here...">

CONFIG:
$Configuration['Plugins']['Morf']['MaxLengthDropDownTextField']['Window'] = 55;
$Configuration['Plugins']['Morf']['MaxLengthDropDownTextField']['Default'] = 0;

KNOWN ISSUES:
- No effect if form object was created directly by operator "new" (eg. $Form = new Gdn_Form).
- Use Gdn::Factory (or property (array) Uses in Gdn_Controller class)

TODO:
- settings / config

CHANGELOG:
1.5.0 (1 Dec 2010)
[new] added uploadbox() method http://code.google.com/p/noswfupload
1.4.2 (25 Sep 2010)
[fix] fixed js load of jscalendar
1.4.1 (22 Sep 2010)
[add] MaxLengthDropDownTextField
1.4 (14 Aug 2010)
- fixed first day of the week for my locale
1.3 (4 Aug 2010)
[alt] jscalendar replaced jquery.dynDateTime (same)
[fix] typo ValueField => FieldName
1.2 (22 Jul 2010)
[alt] better native date picker detection
1.1 (19 Jul 2010)
[new] emulate input[date], input[datetime] attributes http://www.miketaylr.com/code/input-type-attr.html
0.09 (27 Nov 2009)
[fix] fixed CheckBoxList() if ValueDataSet is not array
[fix] css fixes
0.05 (20 Nov 2009)
[add] CheckBoxList() (if list hast too many items it be three or four columned)
0.04 (30 Sep 2009)
[add] allow change form enctype (multipart/form-data)
0.03 (19 Sep 2009)
[new] plugin and form merged to one class
[add] added bInitialized
0.02 (15 Sep 2009)
0.01 (1 Sep 2009)
*/

$PluginInfo['Morf'] = array(
	'Name' => 'Morf',
	'Description' => 'Extended form class.',
	'Version' => '1.5.1',
	'Date' => '1 Dec 2010',
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
	
	public function PluginController_MorfTest_Create($Sender) {
		$Sender->Form = Gdn::Factory('Form');
		$Sender->View = $this->GetView('morftest.php');
		$Sender->Render();
	}

	public static function GenerateCleanTargetName($InputName, $TargetFolder = False, $Property = False) {
		if (!$TargetFolder) $TargetFolder = CombinePaths(array(PATH_UPLOADS, date('Y')));
		if (!is_dir($TargetFolder)) mkdir($TargetFolder, 0777, True);
		$BaseName = $_FILES[$InputName]['name']; // file.ext
		$TmpFile = $_FILES[$InputName]['tmp_name'];
		$FileName = Gdn_Format::Clean(pathinfo($BaseName, 8)); // file
		$Extension = Gdn_Format::Clean(pathinfo($BaseName, 4)); // ext
		$Count = 0; $RandSuffix = '';
		do {
			if (++$Count > 250) throw new Exception('Cannot generate unique name for file.');
			$TargetFile = $TargetFolder . '/' . $FileName . $RandSuffix . '.' . $Extension;
			$FileExists = file_exists($TargetFile);
			if ($FileExists && md5_file($TargetFile) == md5_file($TmpFile)) break;
			$RandSuffix = '-' . strtolower(RandomString(rand(1,3)));
		} while ($FileExists);
		$Result = new StdClass();
		$Result->TargetFile = $TargetFile;
		$Result->RelativePath = substr($TargetFile, strlen(PATH_ROOT)+1);
		$Result->WithDomain = Asset($Result->RelativePath, True);
		if ($Property !== False) $Result = GetValue($Property, $Result);
		return $Result;
	}
	
	// No swf upload
	public static function Upload($Controller, $TargetFolder) {
		if (isset($_GET['AjaxUploadFrame'])) return;
		require dirname(__FILE__).'/noswfupload/noswfupload.php';
		$InputName = ArrayValue(0, array_keys($_FILES));
		$Upload = new Gdn_Upload();
		try {
			if ($InputName == False ) throw new Exception('No files.', 500);
			$TmpFile = $Upload->ValidateUpload($InputName, True);
			$File = self::GenerateCleanTargetName($InputName, $TargetFolder);
			if (move_uploaded_file($TmpFile, $File->TargetFile) || copy($TmpFile, $File->TargetFile)) {
				if (file_exists($TmpFile)) unlink($TmpFile);
				echo json_encode($File);
			}
		} catch (Exception $Ex) { // if something was wrong ... should generate onerror event
			$Controller->RenderException($Ex);
		}
	}
	
	public function PluginController_NoSwfUploadFileFileReceiver_Create($Sender) {
		$Session = Gdn::Session();
		if (!$Session->IsValid()) {
			$Ex = new Exception('Not logged in.', 500);
			return $Sender->RenderException($Ex);
		}
		self::Upload($Sender, False);
	}
	
	public function Base_Render_Before(&$Sender) {
		if(property_exists($Sender, 'Form') == False) return;
		$Sender->AddCssFile('plugins/Morf/morf.css');
		$WebRootPlugin = Gdn_Plugin::GetWebResource('');
		$Sender->AddDefinition('JsDateTime', $WebRootPlugin . 'jquery.dynDateTime/');
		
		$Sender->AddJsFile($WebRootPlugin.'inputdatetime.js');
		$Sender->AddJsFile($WebRootPlugin.'jquery.placeheld.js');
		$Sender->AddJsFile($WebRootPlugin.'uploadbox.js');
		
		
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
		// Nothing to do
	}
	
}


















