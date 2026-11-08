<?php
declare(strict_types=1);
// This file lives at /etc/inbytes/contact.php, never inside the public directory.
return [
    'resend_api_key' => 'SUBSTITUIR',
    'mail_from' => 'Inbytes Website <website@formularios.inbytes.co.mz>',
    'mail_to' => 'info@inbytes.co.mz',
    'turnstile_site_key' => 'SUBSTITUIR',
    'turnstile_secret' => 'SUBSTITUIR',
    'allowed_origins' => ['https://inbytes.co.mz', 'https://www.inbytes.co.mz'],
    'rate_file' => '/var/lib/inbytes/contact-rate.json',
];
