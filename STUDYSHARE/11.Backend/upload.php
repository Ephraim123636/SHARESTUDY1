<?php
session_start();
require_once __DIR__.'/db.php';
function upload_page(){return (($_SESSION['role']??'')==='admin')?'../06.Admin/uploadmaterial.html':'../03.StudentDashboard/uploadmaterials.html';}
function fail($msg){header('Location: '.upload_page().'?upload_error='.urlencode($msg));exit;}
if($_SERVER['REQUEST_METHOD']!=='POST') {header('Location: '.upload_page());exit;}
if(empty($_SESSION['user_id'])) fail('Please log in before uploading.');
$title=trim($_POST['material-title']??'');$course=trim($_POST['course']??'');$year=trim($_POST['year']??'');$subject=trim($_POST['subject']??'');$type=trim($_POST['material-type']??'');$description=trim($_POST['description']??'');
$isPremium=0;
if($title===''||$course===''||$subject==='')fail('Complete all required fields.');
if(!in_array($type,['notes','past-papers','assignments'],true))fail('Choose a valid material type.');
if(!isset($_FILES['material-file'])||$_FILES['material-file']['error']!==UPLOAD_ERR_OK)fail('Choose a file to upload.');
$f=$_FILES['material-file'];if($f['size']>15*1024*1024)fail('File must be 15 MB or smaller.');
$ext=strtolower(pathinfo($f['name'],PATHINFO_EXTENSION));if(!in_array($ext,['pdf','doc','docx','ppt','pptx'],true))fail('Only PDF, DOC, DOCX, PPT and PPTX files are accepted.');
$dir=dirname(__DIR__).'/uploads';if(!is_dir($dir)&&!mkdir($dir,0755,true))fail('Could not create uploads folder.');$name=bin2hex(random_bytes(16)).'.'.$ext;if(!move_uploaded_file($f['tmp_name'],$dir.'/'.$name))fail('Could not save the uploaded file.');
$status=($_SESSION['role']??'')==='admin'?'approved':'pending';
try{$st=$pdo->prepare('INSERT INTO materials(title,description,course,subject,academic_year,material_type,is_premium,file_path,uploaded_by,status) VALUES(?,?,?,?,?,?,?,?,?,?)');$st->execute([$title,$description,$course,$subject,$year,$type,$isPremium,'../uploads/'.$name,(int)$_SESSION['user_id'],$status]);if($status==='approved'){header('Location: ../06.Admin/uploadmaterial.html?uploaded=1');}else{header('Location: ../03.StudentDashboard/myupload.html?uploaded=1');}exit;}catch(Throwable $e){@unlink($dir.'/'.$name);error_log($e->getMessage());fail('Database could not save this material.');}
