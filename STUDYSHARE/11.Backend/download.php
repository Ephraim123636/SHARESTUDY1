<?php
session_start();require_once __DIR__.'/db.php';
if(empty($_SESSION['user_id'])){header('Location: ../02.Login-Register/login.html');exit;}
$id=(int)($_GET['id']??0);$st=$pdo->prepare("SELECT id,title,file_path FROM materials WHERE id=? AND status='approved'");$st->execute([$id]);$m=$st->fetch(PDO::FETCH_ASSOC);if(!$m){http_response_code(404);exit('Material not found or not approved.');}
$uid=(int)$_SESSION['user_id'];$path=realpath(dirname(__DIR__).'/'.ltrim(str_replace('../','',$m['file_path']),'/'));
$root=realpath(dirname(__DIR__).'/uploads');if(!$path||!$root||strpos($path,$root.DIRECTORY_SEPARATOR)!==0||!is_file($path)){http_response_code(404);exit('File not found.');}
$st=$pdo->prepare('INSERT INTO downloads(user_id,material_id) VALUES(?,?)');$st->execute([$uid,$id]);
header('Content-Type: application/octet-stream');header('Content-Disposition: attachment; filename="'.basename($m['title']).'.'.pathinfo($path,PATHINFO_EXTENSION).'"');header('Content-Length: '.filesize($path));readfile($path);exit;
