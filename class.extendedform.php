<?php

class MorfForm extends Gdn_Form {
	
	public function DateBox($FieldName, $Attributes = False) {
		$Class = ArrayValueI('class', $Attributes, False);
		if ($Class === False) $Attributes['class'] = 'InputBox'; // DateBox?
		return $this->Input($FieldName, 'date', $Attributes);
	}
	
	public function DateTimeBox($FieldName, $Attributes = False){
		$Class = ArrayValueI('class', $Attributes, False);
		if ($Class === False) $Attributes['class'] = 'InputBox'; // DateBox?
		return $this->Input($FieldName, 'datetime', $Attributes);
	}
	
	public $bMultipart = False;
	
	public function SetMultipart($Bool = True){
		$this->bMultipart = ForceBool($Bool);
	}
	
	public function Open($Attributes = False){
		if($this->bMultipart) $Attributes['enctype'] = 'multipart/form-data';
		return parent::Open($Attributes);
	}
	
	public function ClearErrors(){
		$this->_ValidationResults = array();
	}
	
	public function Errors(){
		if(!(is_array($this->_ValidationResults) && count($this->_ValidationResults) > 0)) return '';
		$Return = '';
		foreach($this->_ValidationResults as $FieldName => $Problems){
			$Count = count($Problems);
			for($i = 0; $i < $Count; ++$i){
				$Error = sprintf(Gdn::Translate($Problems[$i]), Gdn::Translate($FieldName));
				// fix me $FieldName = <general error>
				$FieldName = $this->IDPrefix . Gdn_Format::AlphaNumeric(str_replace('.', '-dot-', $FieldName));
				$Return .= sprintf('<li id="%s">%s</li>', 'Error_'.$FieldName, $Error);
			}
		}
		$Return = Wrap(Wrap($Return, 'ul'), 'div', array('class' => 'Messages Errors'));
		return $Return;
	}
	
	// HOLD
	/*public function Date($FieldName, $Attributes = False){
		$Date = parent::Date($FieldName, $Attributes);
		//d($Date);
		if(!preg_match_all('/\<select id\=.*?\<\/select\>/s', $Date, $Matches)) return $Date;
		List($Months, $Days) = $Matches[0];
		$Result = strtr($Date, array($Months => $Days, $Days => $Months));
		return $Result;
	}*/
	
	public static function CheckBoxLabelCallback($Full, $For, $ID, $FieldName){
		static $Counter = 0;
		$Counter++;
		//if($For != $ID); // shouldn't happen
		$ForID = $FieldName.$Counter;
		return str_replace($ID, $ForID, $Full);
	}
	
	public function CheckBoxList($FieldName, $DataSet, $ValueDataSet, $Attributes){
		if(!is_object($DataSet) || $DataSet->NumRows() <= 5){
			return parent::CheckBoxList($FieldName, $DataSet, $ValueDataSet, $Attributes);
		}
		$CountItems = $DataSet->NumRows();
		
		$ValueField = ArrayValueI('ValueField', $Attributes, 'value');
        $TextField = ArrayValueI('TextField', $Attributes, 'text');
		$CountColumns = GetValue('Columns', $Attributes, 4, True);
		if(GetIncomingValue('DeliveryType', DELIVERY_TYPE_ALL) != DELIVERY_TYPE_ALL) $CountColumns -= 1;
		
		// WORKS
		$DataArray = ConsolidateArrayValuesByKey($DataSet->ResultArray(), $TextField, $ValueField);
		// NOT WORKS
		//$DataArray = ConsolidateArrayValuesByKey($DataSet->ResultArray(), $ValueField, $TextField);
		
		$InColumn = Floor($CountItems / $CountColumns);
		$OffsetCheckboxCount = ($CountItems % $CountColumns);
		
		$Offset = 0;
		$Return = '';
		
		if(!$ValueDataSet) $ValueDataSet = array();
		
		while($Offset < $CountItems){
			$Length = $InColumn;
			if($OffsetCheckboxCount > 0){
				$OffsetCheckboxCount = $OffsetCheckboxCount - 1;
				$Length++;
			}
			$ColumnCheckboxArray = array_slice($DataArray, $Offset, $Length);
			$Offset += $Length;
			$Html = parent::CheckBoxList($FieldName, $ColumnCheckboxArray, $ValueDataSet, $Attributes);
			//$Html = preg_replace('/for\="('.$ValueField.'\d+)".*?\<input type\="checkbox" id\="('.$ValueField.'\d+)"/ies', 'self::CheckBoxLabelCallback("$0", "$1", "$2", "'.$ValueField.'")', $Html);
			$Html = preg_replace('/for\="('.$FieldName.'\d+)".*?\<input type\="checkbox" id\="('.$FieldName.'\d+)"/ies', 'self::CheckBoxLabelCallback("$0", "$1", "$2", "'.$FieldName.'")', $Html);
			$Return .= Wrap($Html, 'div', array('class' => 'MorfCheckBoxList Width1of'.$CountColumns));
			if($Offset == $Length) $Length = $InColumn;
		}
		$Return = Wrap($Return, 'div');
		return $Return;
	}

	

	
}