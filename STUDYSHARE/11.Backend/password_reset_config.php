<?php
// Set SHARESTUDY_BASE_URL and SHARESTUDY_MAIL_FROM in the Apache environment.
// Configure PHP mail() with your SMTP relay in XAMPP's php.ini/sendmail.ini.
define('SHARESTUDY_BASE_URL', getenv('SHARESTUDY_BASE_URL') ?: 'http://localhost/STUDYSHARE');
define('SHARESTUDY_MAIL_FROM', getenv('SHARESTUDY_MAIL_FROM') ?: 'no-reply@localhost');

function send_password_reset_email(string $email, string $resetUrl): bool
{
    $from = getenv('SHARESTUDY_MAIL_FROM') ?: SHARESTUDY_MAIL_FROM;
    if (!filter_var($from, FILTER_VALIDATE_EMAIL)) {
        error_log('ShareStudy password reset email has an invalid sender address.');
        return false;
    }

    $subject = 'Reset your ShareStudy password';
    $message = "A password reset was requested for your ShareStudy account.\r\n\r\n"
        . "Use this one-time link within one hour:\r\n$resetUrl\r\n\r\n"
        . "If you did not request this, you can ignore this email.";
    $headers = "From: ShareStudy <$from>\r\n"
        . "Content-Type: text/plain; charset=UTF-8";

    return mail($email, $subject, $message, $headers);
}
