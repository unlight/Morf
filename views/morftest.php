<?php if (!defined('APPLICATION')) exit();?>

<h1><?php echo Gdn::Translate('Upload File') ?></h1>

<?php 

echo $this->Form->Open(array('enctype' => 'multipart/form-data')) ?>
<?php echo $this->Form->Errors() ?>

<ul class="LoadUpForm">


<li>
<?php echo $this->Form->Label('Choose D file', 'FileD');
echo $this->Form->UploadBox('FileD', array('Folder' => '/w', 'value' => 'uploads/w/fireball.jpg'));
?>

</li>

<li>
<?php echo $this->Form->Label('Choose C file', 'File');
echo $this->Form->UploadBox('File', array('Folder' => '/test1', 'AddYear' => True));
?>

</li>

<li>
<?php 
	echo $this->Form->Label('Result', 'MyResult');
	echo $this->Form->TextBox('MyResult');
?>
</li>

<li>
<?php echo $this->Form->Label('Choose', 'File');
echo $this->Form->UploadBox('ZFile', array('Folder' => '/test2', 'value' => 'uploads/w/fireball.jpg'));
?>

</li>
	
</ul>
<?php echo $this->Form->Button('Upload') ?>



<?php echo $this->Form->Close() ?>