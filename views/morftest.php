<?php if (!defined('APPLICATION')) exit();?>

<h1><?php echo Gdn::Translate('Upload File') ?></h1>

<?php echo $this->Form->Open(array('enctype' => 'multipart/form-data')) ?>
<?php echo $this->Form->Errors() ?>

<ul class="LoadUpForm">


<li>
<?php echo $this->Form->Label('Choose file', 'File');
echo $this->Form->UploadBox('File');
?>

</li>

	
</ul>
<?php echo $this->Form->Button('Upload') ?>



<?php echo $this->Form->Close() ?>