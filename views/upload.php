<?php if (!defined('APPLICATION')) exit();

$Session = Gdn::Session();
$UploadOK = $this->Form->IsPostBack() && $this->Form->ErrorCount() == 0;

?>

<h1><?php echo T('Upload File') ?></h1>

<?php 
echo $this->Form->Open(array('enctype' => 'multipart/form-data'));
echo $this->Form->Errors();
?>

<ul class="LoadUpForm">

<?php 
if ($UploadOK != False) {
	echo Wrap($this->Form->TextBox('RawData', array('Multiline' => True)), 'li');
	echo '<li>';
	echo $this->Form->CheckBox('WithDomain', T('With Domain'));
	echo $this->Form->CheckBox('AbsoluteURL', T('Absolute URL'));
	echo $this->Form->CheckBox('MakeMarkDownIDs', T('Markdown IDs'));
	echo '</li>';
}
?>

<li>
<?php 
echo $this->Form->Label('Choose File', 'File');
echo $this->Form->Input('Files[]', 'file', array('multiple' => 'multiple'));
?>
</li>

<li>
<?php if (isset($this->UploadTo)) {
	echo $this->Form->Label('Upload To', 'UploadTo');
	echo $this->Form->DropDown('UploadTo', $this->UploadTo, array('IncludeNull' => True));
}
?>
</li>

<li>
<strong><?php echo T('If File Exists') ?>:</strong>
<?php 
if($Session->CheckPermission('Plugins.Morf.Upload.Overwrite'))
	echo $this->Form->CheckBox('Overwrite', 'ToOverwrite');
?>
</li>

</ul>
<?php 
echo $this->Form->Button('Upload');
echo $this->Form->Close();
?>

