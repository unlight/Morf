<?php if (!defined('APPLICATION')) exit();?>

<h1><?php echo Gdn::Translate('Upload File') ?></h1>

<?php 

//$this->Form->AddHidden('FileUploadTo', 'test');
echo $this->Form->Open(array('enctype' => 'multipart/form-data')) ?>
<?php echo $this->Form->Errors() ?>

<ul class="LoadUpForm">


<li>
<?php 
//echo $this->Form->Label('Choose file', 'File');
// array('To' => 'uploads/salesoutlet/exhibition')
//echo $this->Form->UploadBox('File', array('UploadTo' => '/test'));
?>

</li>

<li>
<?php echo $this->Form->Label('Choose C file', 'File');
// array('To' => 'uploads/salesoutlet/exhibition')
//echo $this->Form->UploadCBox('File', array('UploadTo' => '/test1'));
echo $this->Form->UploadBox('File', array('UploadTo' => '/test1'));
?>

</li>

<li>
<?php 
echo $this->Form->Label('Choose A file', 'File');
// array('To' => 'uploads/salesoutlet/exhibition')
//echo $this->Form->UploadDBox('DMoz', array('UploadTo' => '/test'));
?>

</li>

<li>
<?php 
	echo $this->Form->Label('Result', 'MyResult');
	echo $this->Form->TextBox('MyResult', array('value' => 1));
?>
</li>

<li>
<?php echo $this->Form->Label('Choose', 'File');
echo $this->Form->UploadBox('ZFile', array('UploadTo' => '/test2'));
?>

</li>
	
</ul>
<?php echo $this->Form->Button('Upload') ?>



<?php echo $this->Form->Close() ?>