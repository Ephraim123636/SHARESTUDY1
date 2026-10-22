<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../02.Login-Register/forgot-password.html');
    exit;
}

$token = $_POST['token'] ?? '';
$password = $_POST['password'] ?? '';
$confirmation = $_POST['confirm_password'] ?? '';

if (!preg_match('/^[a-f0-9]{64}$/i', $token) || strlen($password) < 8 || $password !== $confirmation) {
    header('Location: ../02.Login-Register/reset-password.html?error=invalid');
    exit;
}

try {
    $pdo->beginTransaction();
    $lookup = $pdo->prepare(
        'SELECT id, user_id
         FROM password_resets
         WHERE token_hash = ?
           AND used_at IS NULL
           AND expires_at > UTC_TIMESTAMP()
           AND user_id IS NOT NULL
         LIMIT 1
         FOR UPDATE'
    );
    $lookup->execute([hash('sha256', $token)]);
    $reset = $lookup->fetch(PDO::FETCH_ASSOC);
    if (!$reset) {
        $pdo->rollBack();
        header('Location: ../02.Login-Register/reset-password.html?error=expired');
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    if ($passwordHash === false) {
        throw new RuntimeException('Could not hash the new password.');
    }

    $updateUser = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $updateUser->execute([$passwordHash, (int) $reset['user_id']]);
    if ($updateUser->rowCount() !== 1) {
        throw new RuntimeException('The account for this reset link no longer exists.');
    }

    $consume = $pdo->prepare(
        'UPDATE password_resets
         SET used_at = UTC_TIMESTAMP()
         WHERE user_id = ? AND used_at IS NULL'
    );
    $consume->execute([(int) $reset['user_id']]);
    $pdo->commit();

    header('Location: ../02.Login-Register/login.html?password_reset=1');
    exit;
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('ShareStudy password reset completion error: ' . $e->getMessage());
    header('Location: ../02.Login-Register/reset-password.html?error=server');
    exit;
}
