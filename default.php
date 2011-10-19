<?php if(!defined('APPLICATION')) exit();

$PluginInfo['Morf'] = array(
	'Name' => 'Morf',
	'Description' => 'Extended form class.',
	'Version' => '1.3.0',
	'Date' => '19 May 2011',
	'Updated' => 'Autumn 2011',
	'Author' => 'Frostbite',
	'AuthorUrl' => 'http://www.malevolence2007.com',
	'RequiredPlugins' => array('UsefulFunctions' => '>=3.5'),
	'RegisterPermissions' => array('Plugins.Morf.Upload.Allow'),
	'License' => 'Liandri License'
);

class MorfPlugin extends Gdn_Plugin {
	
	public function PluginController_MorfTest_Create($Sender) {
		$Sender->Permission('Garden.Admin.Only');
		$Sender->Form = Gdn::Factory('Form', 'Client');
		$Sender->View = $this->GetView('morftest.php');
		$Sender->Render();
	}
	
	public function Gdn_Form_UploadBox_Create($Form) {
		$FieldName =& $Form->EventArguments[0];
		$Attributes =& $Form->EventArguments[1];

		$Result = $Form->TextBox($FieldName, $Attributes);
		
		$Folder = GetValue('Folder', $Attributes, '', True);
		$AddYear = GetValue('AddYear', $Attributes, '', True);
		$AddMonth = GetValue('AddMonth', $Attributes, '', True);
		
		if (!$Folder) {
			$Folder = GetValue('UploadTo', $Attributes, '', True);
			if (Debug() && $Folder) trigger_error("You should use 'Folder' instead of 'UploadTo'", E_USER_DEPRECATED);
		}
		
		if (CheckPermission('Plugins.Morf.Upload.Allow')) {
			$Data = compact('Folder', 'AddYear', 'AddMonth');
			$Result .= $Form->Hidden($FieldName.'UploadBox', array('value' => json_encode($Data)));
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
	
	protected static function HasPermission($User) {
		$Permissions = GetValue('Permissions', $User);
		$User = (object)$User;
		$Session = Gdn::Session();
		$SessionUser = $Session->User;
		$Session->User = $User;
		$Result = $Session->CheckPermission('Plugins.Morf.Upload.Allow');
		$Session->User = $SessionUser;
		return $Result;
	}
	
	public function PluginController_ReceiveUpload_Create($Sender) {
		$IncomingTransientKey = GetPostValue('TransientKey');
		$IncomingUserID = GetPostValue('SessionUserID');
		$Folder = GetPostValue('Folder');
		$User = Gdn::UserModel()->GetID($IncomingUserID);
		$UserTransientKey = GetValueR('Attributes.TransientKey', $User);
		
		if (!($IncomingTransientKey && $IncomingTransientKey == $UserTransientKey)) throw PermissionException();
		if (!self::HasPermission($User)) throw PermissionException();
		
		$Folder = trim($Folder, '/\\');
		if (substr($Folder, 0, 7) == 'uploads') $Folder = trim(substr($Folder, 7), '/\\');
		if (!$Folder || $Folder == 'false') {
			$Folder = 'i';
			$_POST['AddYear'] = 1;
			$_POST['AddMonth'] = 1;
		}
		
		if (GetPostValue('Debug')) file_put_contents(__DIR__.'/post_'.rand(0, 99999).'.txt', var_export($_POST, True));

		//$TargetFolder = PATH_UPLOADS . DS . $Folder;
		$TargetFolder = 'uploads' . DS . $Folder;
		if (GetPostValue('AddYear')) $TargetFolder .= DS . date('Y'); 
		if (GetPostValue('AddMonth')) $TargetFolder .= DS . date('m');
		
		$Result = UploadFile($TargetFolder, 'File', array('WebTarget' => True));
		//if (strpos(PATH_UPLOADS, PATH_ROOT) === 0) $Result = substr($Result, strlen(PATH_ROOT));
		echo $Result;
	}
	
	public function Base_Render_Before($Sender) {
		if (property_exists($Sender, 'Form') && $Sender->DeliveryType() == DELIVERY_TYPE_ALL) {
			$Sender->AddCssFile('plugins/Morf/design/morf.css');
			$Sender->AddJsFile('plugins/Morf/js/jquery.placeheld.js');
			$Sender->AddJsFile('plugins/Morf/vendors/dowhen/jquery.dowhen.min.js');
			$Language = ArrayValue(0, explode('-', Gdn::Locale()->Current()));
			foreach (array($Language, 'en') as $Language) {
				$LanguageJsFile = 'vendors/jquery.dynDateTime/lang/calendar-'.$Language.'.js';
				if (file_exists(Gdn_Plugin::GetResource($LanguageJsFile))) {
					$Sender->AddDefinition('CalendarLanguage', $Language);
					break;
				}
			}
			$Sender->AddJsFile('plugins/Morf/js/morf.js');
			$Sender->AddDefinition('SessionUserID', Gdn::Session()->UserID);
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




