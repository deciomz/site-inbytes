# Inbytes website

Website corporativo da Inbytes: HTML, CSS e JavaScript, com formulário PHP para Resend e Cloudflare Turnstile. Português e inglês, com preferência de idioma guardada no navegador.

## Estrutura

- `public/`: raiz pública do website; inclui a página `/caderneta/` e a API de contacto.
- `config/contact.example.php`: exemplo de configuração privada, para instalar em `/etc/inbytes/contact.php` no VPS. Não colocar na raiz pública.
- `inbytes.nginx.conf`: exemplo inicial HTTP para Nginx/PHP-FPM; o VPS já tem HTTPS instalado por Certbot. Não substituir a configuração HTTPS em produção por este exemplo.

## Produção

VPS Ubuntu, Nginx e PHP-FPM 8.5 com cURL e JSON. Raiz pública: `/var/www/inbytes.co.mz/public`. Configuração privada: `/etc/inbytes/contact.php`. Contadores antispam: `/var/lib/inbytes/contact-rate.json`. Não há Docker, Node em produção ou CMS. As caixas de email permanecem na Bluehost.

O domínio usa Cloudflare e certificado Let's Encrypt. O formulário foi testado pelo proprietário: envio real e Reply-To confirmados. As chaves de produção existem apenas no VPS e não estão neste repositório.

## Desenvolvimento

Esta pasta é a base oficial do projeto. A versão copiada inclui os botões PT/EN, a revisão de textos finais, a remoção de Moçambique do subtítulo e a correção da sobreposição do botão do banner.

Verificações de sintaxe:

```bash
node --check public/app.js
node --check public/i18n.js
php -l public/api/index.php
php -l config/contact.example.php
```

Node é usado apenas para verificações locais; não é necessário no VPS para este website. Para pré-visualização de layout pode usar `python -m http.server 8080 --directory public`; este servidor não executa PHP, pelo que o formulário exige Nginx/PHP-FPM e as chaves configuradas para funcionar.

Ao publicar, carregar apenas o conteúdo de `public/` para a raiz pública, manter permissões de pastas 755 e ficheiros 644 e limpar a cache dos ficheiros alterados no Cloudflare. Não copiar configurações de exemplo por cima dos segredos existentes.
