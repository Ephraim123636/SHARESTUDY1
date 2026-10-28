<?php
$host = getenv('SHARESTUDY_DB_HOST') ?: 'localhost';
$port = getenv('SHARESTUDY_DB_PORT') ?: '3306';
$dbname = getenv('SHARESTUDY_DB_NAME') ?: 'studyshare';
$username = getenv('SHARESTUDY_DB_USER') ?: 'root';
$password = getenv('SHARESTUDY_DB_PASSWORD') ?: '';

$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];
if (getenv('SHARESTUDY_DB_SSL') === '1') {
    $options[PDO::MYSQL_ATTR_SSL_CA] = '/etc/ssl/certs/ca-certificates.crt';
    $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = getenv('SHARESTUDY_DB_SSL_VERIFY') !== '0';
}

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        $options
    );
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    exit("Database connection failed. Check the database settings.");
}
?>
