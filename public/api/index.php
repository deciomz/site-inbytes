<?php
declare(strict_types=1);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function remotePost(string $url, array $headers, string $body): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => false]);
    $result = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($result === false) throw new RuntimeException('remote_service_unavailable');
    return [$code, json_decode($result, true, 32, JSON_THROW_ON_ERROR)];
}
function rateLimit(string $file, string $key): bool {
    $handle = fopen($file, 'c+');
    if ($handle === false) throw new RuntimeException('rate_storage_unavailable');
    try {
        if (!flock($handle, LOCK_EX)) throw new RuntimeException('rate_lock_failed');
        $raw = stream_get_contents($handle);
        $state = $raw === '' ? [] : json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        $now = time();
        foreach ($state as $k => $v) if ($v['end'] <= $now) unset($state[$k]);
        foreach (['global' => 60, $key => 5] as $k => $limit) {
            $state[$k] ??= ['n' => 0, 'end' => $now + 3600];
            if ($state[$k]['n'] >= $limit) return false;
        }
        $state['global']['n']++; $state[$key]['n']++;
        $encoded = json_encode($state, JSON_THROW_ON_ERROR);
        rewind($handle); ftruncate($handle, 0);
        if (fwrite($handle, $encoded) !== strlen($encoded)) throw new RuntimeException('rate_write_failed');
        fflush($handle);
        return true;
    } finally { flock($handle, LOCK_UN); fclose($handle); }
}
try {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($path, ['/api/contact', '/api/contact-config'], true)) respond(404, ['error' => 'Não encontrado.']);
    $file = '/etc/inbytes/contact.php';
    if (!is_readable($file)) respond(503, ['error' => 'Formulário ainda não configurado. Contacte info@inbytes.co.mz.']);
    $config = require $file;
    foreach (['resend_api_key','mail_from','mail_to','turnstile_site_key','turnstile_secret'] as $key) {
        if (empty($config[$key]) || $config[$key] === 'SUBSTITUIR') respond(503, ['error' => 'Formulário ainda não configurado.']);
    }
    if ($path === '/api/contact-config') {
        if ($method !== 'GET') respond(405, ['error' => 'Método não permitido.']);
        respond(200, ['siteKey' => $config['turnstile_site_key']]);
    }
    if ($method !== 'POST') respond(405, ['error' => 'Método não permitido.']);
    if (!in_array($_SERVER['HTTP_ORIGIN'] ?? '', $config['allowed_origins'], true)) respond(403, ['error' => 'Origem não permitida.']);
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) respond(415, ['error' => 'Formato inválido.']);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 16000) respond(413, ['error' => 'Mensagem demasiado longa.']);
    $raw = file_get_contents('php://input', false, null, 0, 16001);
    if ($raw === false || strlen($raw) > 16000) respond(413, ['error' => 'Mensagem demasiado longa.']);
    try { $data = json_decode($raw, true, 16, JSON_THROW_ON_ERROR); }
    catch (JsonException) { respond(400, ['error' => 'Pedido inválido.']); }
    if (!is_array($data)) respond(400, ['error' => 'Pedido inválido.']);
    $str = static fn(string $key): string => is_string($data[$key] ?? null) ? trim($data[$key]) : '';
    $nome = $str('nome'); $email = $str('email'); $empresa = $str('empresa');
    $mensagem = $str('mensagem'); $token = $str('token');
    if ($str('website') !== '') respond(400, ['error' => 'Não foi possível validar o pedido.']);
    $len = static fn(string $s): int => preg_match_all('/./us', $s) ?: 0;
    if ($len($nome) < 2 || $len($nome) > 120 || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)
        || preg_match('/[\r\n]/', $nome.$email.$empresa) || $len($empresa) > 160 || $len($mensagem) < 10
        || $len($mensagem) > 6000 || $token === '' || strlen($token) > 2048) respond(400, ['error' => 'Verifique o nome, email e mensagem (10 a 6000 caracteres).']);
    if (!function_exists('curl_init')) throw new RuntimeException('curl_extension_required');
    if (!rateLimit($config['rate_file'], hash('sha256', strtolower($email)))) respond(429, ['error' => 'Muitos pedidos. Tente mais tarde.']);
    [$code, $check] = remotePost('https://challenges.cloudflare.com/turnstile/v0/siteverify', ['Content-Type: application/x-www-form-urlencoded'], http_build_query(['secret' => $config['turnstile_secret'], 'response' => $token]));
    $hosts = array_map(static fn(string $origin): string => (string)parse_url($origin, PHP_URL_HOST), $config['allowed_origins']);
    if ($code !== 200) respond(503, ['error' => 'Verificação temporariamente indisponível.']);
    if (empty($check['success']) || ($check['action'] ?? '') !== 'contact' || !in_array($check['hostname'] ?? '', $hosts, true)) respond(400, ['error' => 'Validação antispam inválida ou expirada. Tente novamente.']);
    [$code, $sent] = remotePost('https://api.resend.com/emails', ['Content-Type: application/json', 'Authorization: Bearer '.$config['resend_api_key'], 'Idempotency-Key: '.bin2hex(random_bytes(16))], json_encode([
        'from' => $config['mail_from'], 'to' => [$config['mail_to']], 'reply_to' => $email,
        'subject' => 'Novo contacto pelo website Inbytes',
        'text' => "Nome: $nome\nEmail: $email\nOrganização: $empresa\n\n$mensagem",
    ], JSON_THROW_ON_ERROR));
    if ($code < 200 || $code >= 300 || empty($sent['id'])) {
        error_log('inbytes_mail_provider_rejected status='.$code);
        respond(502, ['error' => 'Não foi possível enviar. Tente novamente ou contacte-nos por telefone.']);
    }
    respond(200, ['ok' => true, 'message' => 'Mensagem aceite para envio. Obrigado pelo contacto!']);
} catch (Throwable $e) {
    error_log('inbytes_contact_failed type='.get_class($e));
    respond(503, ['error' => 'Serviço temporariamente indisponível. Tente novamente ou contacte info@inbytes.co.mz.']);
}
