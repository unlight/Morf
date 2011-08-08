<?php if(!defined('APPLICATION')) exit();

/* ==========================================================
FEATURES:
Some render improvements in form class. 
- id attribute to form errors (for future jquery plugins/effects);
- columned CheckBoxList()
- HTML5 form input attributes (date/datetime picker)
- allow strip long text values in dropdown menu
- UploadBox() method. AJAX uploader.

USAGE:
// HTML5 form input attributes
echo $this->Form->DateTimeBox('MyDate'); // Result: <input type="datetime" name="Form_MyDate" ...
echo $this->Form->DateBox('MyDate'); // Result: <input type="date" name="Form_MyDate" ...
echo $this->Form->TextBox('MyName', array('placeholder' => 'Enter your name here...'));
// Result: <input type="date" name="Form_MyDate" placeholder="Enter your name here...">

CONFIG:
$Configuration['Plugins']['Morf']['MaxLengthDropDownTextField']['Window'] = 55;
$Configuration['Plugins']['Morf']['MaxLengthDropDownTextField']['Default'] = 0;

KNOWN BUGS:
- Upload script doesn't work in opera

TODO:
- settings / config
*/

$PluginInfo['Morf'] = array(
	'Name' => 'Morf',
	'Description' => 'Extended form class.',
	'Version' => '1.20.2.0.18',
	'Date' => 'Summer 2011',
	'Author' => 'Frostbite',
	'AuthorUrl' => 'http://www.malevolence2007.com',
	'License' => 'Liandri License',
	'RegisterPermissions' => array('Plugins.Morf.Upload.Allow')
);

/*$Overwrite = Gdn::FactoryOverwrite(True);
Gdn::FactoryInstall('Form', 'MorfForm', dirname(__FILE__) . '/class.morfform.php');
Gdn::FactoryOverwrite($Overwrite);
unset($Overwrite);*/

class MorfPlugin extends Gdn_Plugin {
	
/*	public function PluginController_MorfTest_Create($Sender) {
		$Sender->Form = Gdn::Factory('Form', 'OnlineClient');
		$Sender->Form->UploadBox('csdsd', array('sadasd'));
		//d($Sender->Form);
		$Sender->View = $this->GetView('morftest.php');
		$Sender->Render();
	}*/
	
	public function Gdn_Form_UploadBox_Create($Form) {
		$FieldName =& $Form->EventArguments[0];
		$Attributes =& $Form->EventArguments[1];

		$Result = '';
		$UploadTo = GetValue('UploadTo', $Attributes, False, True);
		$Result .= $Form->TextBox($FieldName, $Attributes);
		if (CheckPermission('Plugins.Morf.Upload.Allow')) {
			$InputAttributes = array('size' => 1, 'title' => T('Choose file'));
			if ($UploadTo) {
				if (!GetValue($FieldName.'UploadTo', $Form->HiddenInputs))
					$Result .= $Form->Hidden($FieldName.'UploadTo', array('value' => $UploadTo));
			}
			$Result .= ' '.$Form->Input($FieldName.'UploadBoxFile', 'file', $InputAttributes);
		}
		return $Result;
	}
	
	public function Gdn_Form_DateBox_Create($Form) {
		
		$FieldName =& $Form->EventArguments[0];
		$Attributes =& $Form->EventArguments[1];

		$Class = ArrayValueI('class', $Attributes, False);
		if ($Class === False) $Attributes['class'] = 'InputBox'; // DateBox?
		return $Form->Input($FieldName, 'date', $Attributes);
	}
	
	public function Gdn_Form_DateTimeBox_Create($Form) {
		
		$FieldName =& $Form->EventArguments[0];
		$Attributes =& $Form->EventArguments[1];
		
		$Class = ArrayValueI('class', $Attributes, False);
		if ($Class === False) $Attributes['class'] = 'InputBox'; // DateBox?
		return $Form->Input($FieldName, 'datetime', $Attributes);
	}
	
	public function Gdn_Form_ClearErrors_Create($Form) {
		// BUG: _ValidationResults is protected
		$Form->_ValidationResults = array();
	}
	
	public function Gdn_Form_DropDown_Override($Form) {

		$FieldName =& $Form->EventArguments[0];
		$DataSet =& $Form->EventArguments[1];
		$Attributes =& $Form->EventArguments[2];
		
		//$ValueField = ArrayValueI('ValueField', $Attributes, 'value');
        $TextField = ArrayValueI('TextField', $Attributes, 'text');
		
		$MaxDropDownTextField = C('Plugins.Morf.MaxLengthDropDownTextField');
		if (GetIncomingValue('DeliveryType', DELIVERY_TYPE_ALL) != DELIVERY_TYPE_ALL) {
			$MaxTextLength = GetValue('Window', $MaxDropDownTextField);
		} else $MaxTextLength = GetValue('Default', $MaxDropDownTextField);
		if (is_numeric($MaxTextLength) && $MaxTextLength > 0) {
			if (is_object($DataSet)) {
				$TestValue = GetValue($TextField, $DataSet->FirstRow());
				if($TestValue !== False) foreach($DataSet->ResultObject() as $Data) {
					$S = SliceString(GetValue($TextField, $Data), $MaxTextLength);
					SetValue($TextField, $Data, $S);
				}
			} elseif (is_array($DataSet)) {
				// ResultSet is unexpected here
				foreach($DataSet as &$Value) {
					$Value = SliceString($Value, $MaxTextLength);
				}
			}
		}
		return $Form->DropDown($FieldName, $DataSet, $Attributes);
	}
	
	public static function CheckBoxLabelCallback($Full, $For, $ID, $FieldName) {
		static $Counter = 0;
		$Counter++;
		//if($For != $ID); // shouldn't happen
		$ForID = $FieldName.$Counter;
		return str_replace($ID, $ForID, $Full);
	}
	
	public function Gdn_Form_CheckBoxList_Override($Form) {
		
		$FieldName =& $Form->EventArguments[0];
		$DataSet =& $Form->EventArguments[1];
		$ValueDataSet =& $Form->EventArguments[2];
		$Attributes =& $Form->EventArguments[3];
		
		if (!is_object($DataSet) || $DataSet->NumRows() <= 5) {
			return $Form->CheckBoxList($FieldName, $DataSet, $ValueDataSet, $Attributes);
		}
		$CountItems = $DataSet->NumRows();
		
		$ValueField = ArrayValueI('ValueField', $Attributes, 'value');
		$TextField = ArrayValueI('TextField', $Attributes, 'text');
		$CountColumns = GetValue('Columns', $Attributes, 4, True);
		if (GetIncomingValue('DeliveryType', DELIVERY_TYPE_ALL) != DELIVERY_TYPE_ALL) $CountColumns -= 1;
		if ($CountColumns <= 0) $CountColumns = 1;
		
		$DataArray = ConsolidateArrayValuesByKey($DataSet->ResultArray(), $TextField, $ValueField);
		
		$InColumn = floor($CountItems / $CountColumns);
		$OffsetCheckboxCount = ($CountItems % $CountColumns);
		
		$Offset = 0;
		$Return = '';
		
		if (!$ValueDataSet) $ValueDataSet = array();
		
		while ($Offset < $CountItems) {
			$Length = $InColumn;
			if ($OffsetCheckboxCount > 0) {
				$OffsetCheckboxCount = $OffsetCheckboxCount - 1;
				$Length++;
			}
			$ColumnCheckboxArray = array_slice($DataArray, $Offset, $Length);
			$Offset += $Length;
			$Html = $Form->CheckBoxList($FieldName, $ColumnCheckboxArray, $ValueDataSet, $Attributes);
			$Html = preg_replace('/for\="('.$FieldName.'\d+)".*?\<input type\="checkbox" id\="('.$FieldName.'\d+)"/ies', 'self::CheckBoxLabelCallback("$0", "$1", "$2", "'.$FieldName.'")', $Html);
			$Return .= Wrap($Html, 'div', array('class' => 'MorfCheckBoxList Width1of'.$CountColumns));
			if ($Offset == $Length) $Length = $InColumn;
		}
		
		$Return = Wrap($Return, 'div');
		return $Return;
	}
	
/*	public function Gdn_Form_Errors_Override() {
		if (!(is_array($this->_ValidationResults) && count($this->_ValidationResults) > 0)) return '';
		$Return = '';
		foreach ($this->_ValidationResults as $FieldName => $Problems) {
			$Count = count($Problems);
			for ($i = 0; $i < $Count; ++$i) {
				$Error = sprintf(Gdn::Translate($Problems[$i]), Gdn::Translate($FieldName));
				$FieldName = $this->IDPrefix . Gdn_Format::AlphaNumeric(str_replace('.', '-dot-', $FieldName));
				$Return .= sprintf('<li id="%s">%s</li>', 'Error_'.$FieldName, $Error);
			}
		}
		$Return = Wrap(Wrap($Return, 'ul'), 'div', array('class' => 'Messages Errors'));
		return $Return;
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
			$Sender->AddJsFile('plugins/Morf/js/jquery.placeheld.js');		
			$Sender->AddJsFile('plugins/Morf/js/morf.js');
			$Language = ArrayValue(0, explode('-', Gdn::Locale()->Current()));
			foreach (array($Language, 'en') as $Language) {
				$LanguageJsFile = 'vendors/jquery.dynDateTime/lang/calendar-'.$Language.'.js';
				if (file_exists(Gdn_Plugin::GetResource($LanguageJsFile))) {
					$Sender->AddDefinition('CalendarLanguage', $Language);
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


















