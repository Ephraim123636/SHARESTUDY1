<?php
declare(strict_types=1);

function flutterwaveConfiguration(bool $requirePublicKey = true): array
{
    $configuration = [
        'secret_key' => getenv('FLW_SECRET_KEY') ?: '',
        'secret_hash' => getenv('FLW_SECRET_HASH') ?: '',
        'public_key' => getenv('FLW_PUBLIC_KEY') ?: ''
    ];

    if ($configuration['secret_key'] === '' || $configuration['secret_hash'] === '' ||
        ($requirePublicKey && $configuration['public_key'] === '')) {
        throw new RuntimeException('Flutterwave is not configured. Set its API keys and webhook secret in the server environment.');
    }

    return $configuration;
}

function flutterwaveApiRequest(string $path, string $secretKey): array
{
    if (!function_exists('curl_init')) {
        throw new RuntimeException('PHP cURL is required for Flutterwave payment verification.');
    }

    $request = curl_init('https://api.flutterwave.com/v3/' . ltrim($path, '/'));
    curl_setopt_array($request, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $secretKey,
            'Accept: application/json'
        ],
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 25
    ]);

    $body = curl_exec($request);
    $status = (int) curl_getinfo($request, CURLINFO_HTTP_CODE);
    $curlError = curl_error($request);
    curl_close($request);

    if ($body === false) {
        throw new RuntimeException('Could not contact Flutterwave to verify the payment.');
    }

    $response = json_decode($body, true);
    if (!is_array($response) || $status < 200 || $status >= 300 || ($response['status'] ?? '') !== 'success') {
        error_log('ShareStudy Flutterwave verification failed. HTTP ' . $status . ($curlError !== '' ? ': ' . $curlError : ''));
        throw new RuntimeException('Flutterwave could not verify this payment. Please try again or contact support.');
    }

    return $response;
}

function verifyAndActivateFlutterwavePayment(
    PDO $pdo,
    string $transactionReference,
    string $transactionId,
    string $secretKey,
    ?int $userId = null
): array {
    if (!preg_match('/^[A-Za-z0-9_-]{1,80}$/', $transactionReference) ||
        !preg_match('/^[0-9]{1,30}$/', $transactionId)) {
        throw new InvalidArgumentException('Invalid Flutterwave transaction details.');
    }

    $sql = 'SELECT id,user_id,plan,amount,currency,status,transaction_id FROM subscriptions WHERE tx_ref=?';
    $parameters = [$transactionReference];
    if ($userId !== null) {
        $sql .= ' AND user_id=?';
        $parameters[] = $userId;
    }
    $statement = $pdo->prepare($sql);
    $statement->execute($parameters);
    $subscription = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$subscription) {
        throw new RuntimeException('Subscription payment was not found.');
    }

    if ($subscription['status'] === 'active') {
        if ((string) $subscription['transaction_id'] === $transactionId) {
            return ['ok' => true, 'message' => 'Your Premium subscription is active.'];
        }
        throw new RuntimeException('This subscription has already been paid.');
    }
    if ($subscription['status'] !== 'pending_payment') {
        throw new RuntimeException('This subscription payment is no longer pending.');
    }

    $response = flutterwaveApiRequest(
        'transactions/' . rawurlencode($transactionId) . '/verify',
        $secretKey
    );
    $transaction = $response['data'] ?? [];
    $expectedAmount = (float) $subscription['amount'];
    $paidAmount = (float) ($transaction['amount'] ?? 0);

    if (($transaction['status'] ?? '') !== 'successful' ||
        !hash_equals($transactionReference, (string) ($transaction['tx_ref'] ?? '')) ||
        strtoupper((string) ($transaction['currency'] ?? '')) !== strtoupper((string) $subscription['currency']) ||
        $paidAmount + 0.00001 < $expectedAmount) {
        throw new RuntimeException('Payment verification did not match the selected plan and amount.');
    }

    $pdo->beginTransaction();
    try {
        $lock = $pdo->prepare('SELECT status,transaction_id FROM subscriptions WHERE id=? FOR UPDATE');
        $lock->execute([(int) $subscription['id']]);
        $current = $lock->fetch(PDO::FETCH_ASSOC);
        if (!$current) {
            throw new RuntimeException('Subscription payment was not found.');
        }

        if ($current['status'] === 'active' && (string) $current['transaction_id'] === $transactionId) {
            $pdo->commit();
            return ['ok' => true, 'message' => 'Your Premium subscription is active.'];
        }
        if ($current['status'] !== 'pending_payment') {
            throw new RuntimeException('This subscription payment is no longer pending.');
        }

        $activate = $pdo->prepare(
            "UPDATE subscriptions
             SET status='active',
                 transaction_id=?,
                 paid_at=CURRENT_TIMESTAMP,
                 expires_at=CASE plan
                     WHEN 'monthly' THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH)
                     ELSE DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 6 MONTH)
                 END
             WHERE id=? AND status='pending_payment'"
        );
        $activate->execute([$transactionId, (int) $subscription['id']]);
        if ($activate->rowCount() !== 1) {
            throw new RuntimeException('Subscription could not be activated.');
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }

    return ['ok' => true, 'message' => 'Payment verified. Your Premium subscription is now active.'];
}
