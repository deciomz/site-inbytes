# Pacote Nginx + PHP-FPM

Este pacote substitui o pacote Docker/Node. Use public/ em /var/www/inbytes.co.mz/public.
Não copie config/ para a pasta pública.

A configuração de exemplo do backend destina-se a /etc/inbytes/contact.php (root:www-data, modo 640). Preencheremos as chaves Resend e Turnstile em conjunto numa etapa posterior. O backend permanece indisponível até ser configurado; não simula envio bem-sucedido.

O ficheiro de limites destina-se a /var/lib/inbytes/contact-rate.json; crie a pasta /var/lib/inbytes com proprietário www-data e modo 750. O utilizador do pool PHP-FPM precisa de ler a configuração e escrever nessa pasta. O exemplo assume www-data; confirmar no servidor antes de definir permissões.

Requer PHP 8.1+ com cURL, JSON e acesso HTTPS aos serviços Resend/Cloudflare. Utiliza o socket php8.5-fpm.sock observado no servidor. Controlo de limites por ficheiro com flock: 5 pedidos/hora por email e 60/hora no total. Não guarda o conteúdo das mensagens no servidor.

inbytes.nginx.conf é uma proposta inicial HTTP para o novo domínio. Não substitui configurações dos sites existentes. Antes da ativação, verificar configurações existentes, executar php -l nos ficheiros PHP e nginx -t. O HTTPS/Cloudflare e as caixas Bluehost serão tratados em etapas separadas.

Verificações locais: sintaxe JavaScript verificada; estrutura do ZIP verificada. PHP não disponível no computador de preparação; validação php -l e teste real de envio pendentes no VPS. Os testes anteriores em Node não validam este backend PHP.
