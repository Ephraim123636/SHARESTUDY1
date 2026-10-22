
<?php
$host = getenv('SHARESTUDY_DB_HOST') ?: 'localhost';
$dbname = getenv('SHARESTUDY_DB_NAME') ?: 'studyshare';
$username = getenv('SHARESTUDY_DB_USER') ?: 'root';
$password = getenv('SHARESTUDY_DB_PASSWORD') ?: '';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $pdo->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    exit("Database connection failed. Check your XAMPP settings.");
}
?>
