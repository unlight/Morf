<?php if(!defined('APPLICATION')) exit();

/* ==========================================================
FEATURES:
Some render improvements in form class. 
1) switched month and day menu in Date(); [REMOVED]
2) added id attribute to form errors (for future jquery plugins/effects);
3) allow intercept form enctype param (example: $Controller->Form->SetMultipart(), call it before render. Controller_Render_Before() is good place);
4) columned CheckBoxList().
5) HTML5 form input attributes (date/datetime picker)
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

*/

$PluginInfo['Morf'] = array(
	'Name' => 'Morf',
	'Description' => 'Extended form class.',
	'Version' => '1.10b',
	'Date' => 'Summer 2011',
	'Author' => 'Frostbite',
	'AuthorUrl' => 'http://www.malevolence2007.com',
	'License' => 'Liandri License',
	'RegisterPermissions' => array('Plugins.Morf.Upload.Allow')
);

$Overwrite = Gdn::FactoryOverwrite(True);
Gdn::FactoryInstall('Form', 'MorfForm', dirname(__FILE__) . '/class.morfform.php');
Gdn::FactoryOverwrite($Overwrite);
unset($Overwrite);

class MorfPlugin extends Gdn_Plugin {
	
/*	public function PluginController_MorfTest_Create($Sender) {
		$Sender->Form = Gdn::Factory('Form');
		$Sender->View = $this->GetView('morftest.php');
		$Sender->Render();
	}*/

	protected static function GenerateCleanTargetName($InputName, $TargetFolder = False, $Property = False) {
		if ($TargetFolder) {
			$TargetFolder = str_replace('..', '', $TargetFolder);
			$TargetFolder = trim($TargetFolder, '/\\');
		}
		if (!$TargetFolder) $TargetFolder = date('Y');
		$TargetFolder = CombinePaths(array(PATH_UPLOADS, $TargetFolder));
		if (!is_dir($TargetFolder)) mkdir($TargetFolder, 0777, True);
		$BaseName = $_FILES[$InputName]['name']; // file.ext
		$TmpFile = $_FILES[$InputName]['tmp_name'];
		$FileName = Gdn_Format::Clean(pathinfo($BaseName, 8)); // file
		$Extension = Gdn_Format::Clean(pathinfo($BaseName, 4)); // ext
		$Count = 0; 
		$RandSuffix = '';
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
	
	protected static function Upload($Controller, $TargetFolder) {
		$InputName = ArrayValue(0, array_keys($_FILES));
		$Upload = new Gdn_Upload();
		if ($InputName == False ) throw new Exception('No files.', 500);
		$TmpFile = $Upload->ValidateUpload($InputName, True);
		$File = self::GenerateCleanTargetName($InputName, $TargetFolder);
		if (move_uploaded_file($TmpFile, $File->TargetFile) || copy($TmpFile, $File->TargetFile)) {
			if (file_exists($TmpFile)) unlink($TmpFile);
			return $File;
		}
		throw new Exception('Error while uploading file.');
	}
	
	public function PluginController_ReceiveUploadFile_Create($Sender) {
		$Session = Gdn::Session();
		$Sender->Form = $Form = Gdn::Factory('Form');
		$Ex = False;
		if (!$Session->IsValid()) 
			$Ex = new Exception('Permission problem.', 500);
		elseif (!$Session->CheckPermission('Plugins.Morf.Upload.Allow')) 
			$Ex = new Exception('Permission problem.', 500);
		if ($Ex != False) $Form->AddError($Ex);
		
		if ($Form->ErrorCount() == 0) {
			$InputName = ArrayValue(0, array_keys($_FILES));
			$UploadToName = substr($InputName, 0, -strlen('UploadBoxFile')) . 'UploadTo';
			$DirectoryFound = False;
			if ($InputName && $UploadToName) foreach($_GET as $UploadToKey => $Directory) {
				if (preg_match('/'.$UploadToName.'$/', $UploadToKey)) {
					$DirectoryFound = True;
					break;
				}
			}
			if ($DirectoryFound == False) $Directory = GetIncomingValue('UploadTo');
			try {
				$File = self::Upload($Sender, $Directory);
				$Sender->SetJson('File', $File);
			} catch (Exception $Ex) {
				// if something was wrong ... should generate onerror event
				$Form->AddError($Ex);
			}
		}
		if ($Form->ErrorCount() > 0 && $Ex != False) $Sender->StatusMessage = $Ex->GetMessage();
		$Sender->Render();
	}
	
	public function Base_Render_Before(&$Sender) {
		if (property_exists($Sender, 'Form') == False) return;
		if ($Sender->DeliveryType() == DELIVERY_TYPE_ALL) {
			$Sender->AddCssFile('plugins/Morf/design/morf.css');
			$Sender->AddJsFile('plugins/Morf/vendors/lazyload/lazyload.js');
			$Sender->AddJsFile('plugins/Morf/js/jquery.placeheld.js');		
			$Sender->AddJsFile('plugins/Morf/js/morf.js');
			$Language = ArrayValue(0, explode('-', Gdn::Locale()->Current()));
			foreach (array($Language, 'en') as $Language) {
				$LanguageJsFile = 'vendors/jquery.dynDateTime/lang/calendar-'.$Language.'.js';
				if (file_exists(Gdn_Plugin::GetResource($LanguageJsFile))) {
					$Sender->AddDefinition('CalendarLanguage', 'calendar-'.$Language.'.js');
					break;
				}
			}
		}
	}
	
	// plugin/reenablemorf
	public function PluginController_ReEnableMorf_Create($Sender) {
		$Sender->Permission('Garden.Admin.Only');
		$Session = Gdn::Session();
		$TransientKey = $Session->TransientKey();
		RemoveFromConfig('EnabledPlugins.Morf');
		Redirect('settings/plugins/all/Morf/'.$TransientKey);
	}
	
	public function Structure() {
		$PermissionModel = Gdn::PermissionModel();
		$PermissionModel->Define('Plugins.Morf.Upload.Allow');
	}
	
	public function Setup() {
		$this->Structure();
	}
	
	
	
}


















