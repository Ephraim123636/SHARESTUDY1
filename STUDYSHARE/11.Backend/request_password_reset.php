<?php
session_start();
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/password_reset_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../02.Login-Register/forgot-password.html');
    exit;
}

$email = trim($_POST['email'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ../02.Login-Register/forgot-password.html?error=invalid');
    exit;
}

try {
    $emailHash = hash('sha256', strtolower($email));
    $requesterHash = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $pdo->beginTransaction();

    $cleanup = $pdo->prepare(
        'DELETE FROM password_resets
         WHERE requested_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)'
    );
    $cleanup->execute();

    $requestCount = $pdo->prepare(
        'SELECT COUNT(*)
         FROM password_resets
         WHERE requester_hash = ?
           AND requested_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)'
    );
    $requestCount->execute([$requesterHash]);
    if ((int) $requestCount->fetchColumn() >= 5) {
        $pdo->commit();
        header('Location: ../02.Login-Register/forgot-password.html?sent=1');
        exit;
    }

    $recent = $pdo->prepare(
        'SELECT id
         FROM password_resets
         WHERE email_hash = ?
           AND requested_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 SECOND)
         LIMIT 1'
    );
    $recent->execute([$emailHash]);
    if ($recent->fetchColumn()) {
        $pdo->commit();
        header('Location: ../02.Login-Register/forgot-password.html?sent=1');
        exit;
    }

    $userQuery = $pdo->prepare('SELECT id, email FROM users WHERE email = ? LIMIT 1');
    $userQuery->execute([$email]);
    $user = $userQuery->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $invalidate = $pdo->prepare(
            'UPDATE password_resets
             SET used_at = UTC_TIMESTAMP()
             WHERE user_id = ? AND used_at IS NULL'
        );
        $invalidate->execute([(int) $user['id']]);
    }

    $token = $user ? bin2hex(random_bytes(32)) : null;
    $tokenHash = $token ? hash('sha256', $token) : null;
    $userId = $user ? (int) $user['id'] : null;

    $record = $pdo->prepare(
        'INSERT INTO password_resets (user_id, email_hash, requester_hash, token_hash, expires_at, requested_at)
         VALUES (?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR), UTC_TIMESTAMP())'
    );
    $record->execute([$userId, $emailHash, $requesterHash, $tokenHash]);
    $resetId = (int) $pdo->lastInsertId();
    $pdo->commit();

    if ($user && $token) {
        $baseUrl = rtrim(getenv('SHARESTUDY_BASE_URL') ?: SHARESTUDY_BASE_URL, '/');
        $resetUrl = $baseUrl . '/02.Login-Register/reset-password.html?token=' . rawurlencode($token);
        if (!send_password_reset_email($user['email'], $resetUrl)) {
            $delete = $pdo->prepare('DELETE FROM password_resets WHERE id = ?');
            $delete->execute([$resetId]);
            error_log('ShareStudy could not deliver a password reset email.');
        }
    }
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('ShareStudy password reset request error: ' . $e->getMessage());
    header('Location: ../02.Login-Register/forgot-password.html?error=server');
    exit;
}

header('Location: ../02.Login-Register/forgot-password.html?sent=1');
exit;
