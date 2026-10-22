
<?php
require_once __DIR__ . '/db.php';


$message = '';
 
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullname = trim($_POST['fullname'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $program = trim($_POST['program'] ?? '');
    $year = $_POST['year'] ?? '';
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm-password'] ?? '';

    $validYears = ['year-1', 'year-2', 'year-3', 'year-4'];

    if (
        $fullname === '' ||
        !filter_var($email, FILTER_VALIDATE_EMAIL) ||
        $program === '' ||
        !in_array($year, $validYears, true)
    ) {
        $message = 'Please enter valid registration details.';
    } elseif (strlen($password) < 8) {
        $message = 'Your password must contain at least 8 characters.';
    } elseif ($password !== $confirmPassword) {
        $message = 'Your passwords do not match.';
    } else {
        try {
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            $sql = "INSERT INTO users
                    (full_name, email, password_hash, role, program, year_of_study)
                    VALUES
                    (:fullname, :email, :password_hash, 'student', :program, :year)";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                ':fullname' => $fullname,
                ':email' => $email,
                ':password_hash' => $passwordHash,
                ':program' => $program,
                ':year' => $year
            ]);

            header('Location: ../02.Login-Register/login.html?registered=1');
            exit;

        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                $message = 'This email may already be registered.';
            } else {
                error_log($e->getMessage());
                $message = 'Registration failed. Please try again.';
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Result - ShareStudy</title>
</head>
<body>
    <h1>ShareStudy Registration</h1>
    <p><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></p>
    <p><a href="register.html">Return to registration</a></p>
</body>
</html>
