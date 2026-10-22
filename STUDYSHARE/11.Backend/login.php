<?php
session_start();
require_once __DIR__ . '/db.php';

$projectPath = str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/11.Backend/login.php')));
$siteBasePath = $projectPath === '/' || $projectPath === '.' ? '' : rtrim($projectPath, '/');
$loginUrl = $siteBasePath . '/02.Login-Register/login.html';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . $loginUrl);
    exit;
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$accountType = $_POST['account_type'] ?? 'student';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '' || !in_array($accountType, ['student', 'admin'], true)) {
    header('Location: ' . $loginUrl . '?login_error=invalid');
    exit;
}

try {
    $stmt = $pdo->prepare(
        'SELECT id, full_name, email, password_hash, role
         FROM users
         WHERE email = :email
         LIMIT 1'
    );
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash']) || $user['role'] !== $accountType) {
        header('Location: ' . $loginUrl . '?login_error=credentials');
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['full_name'] = $user['full_name'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];

    if ($user['role'] === 'student' && ($_POST['next'] ?? '') === 'upload') {
        header('Location: ' . $siteBasePath . '/03.StudentDashboard/uploadmaterials.html');
        exit;
    }

    if (($_POST['next'] ?? '') === 'browse') {
        header('Location: ' . $siteBasePath . '/04.BrowseMaterials/browsematerials.html');
        exit;
    }

    if ($user['role'] === 'admin') {
        header('Location: ' . $siteBasePath . '/06.Admin/admin.html');
        exit;
    }

    header('Location: ' . $siteBasePath . '/03.StudentDashboard/dashboard.html');
    exit;
} catch (PDOException $e) {
    error_log('ShareStudy login error: ' . $e->getMessage());
    header('Location: ' . $loginUrl . '?login_error=server');
    exit;
}
