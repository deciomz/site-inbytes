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

## Indexação Google — versão de 9 de novembro de 2026

As páginas atuais usam URLs próprias (sem fragmentos #), HTML com conteúdo pré-gerado, título e descrição por página e canonical. Sitemap em /sitemap.xml, robots.txt em /robots.txt. Os botões PT/EN continuam a traduzir o conteúdo no navegador; não existem URLs inglesas separadas nem hreflang nesta versão.

Para alterações ao conteúdo ou ao menu, editar public/app.js, public/routes.js e/ou src/shell.html, atualizar as traduções em public/i18n.js e executar localmente:

```bash
node scripts/build-pages.mjs
```

O gerador usa só módulos integrados do Node, sem dependências, e verifica as 17 páginas e as referências internas. Node não é necessário no VPS: publicar os ficheiros HTML já gerados.

Por decisão do proprietário, não manter nem redirecionar as URLs antigas do WordPress. O Nginx deve continuar com try_files $uri $uri/ =404, sem encaminhar qualquer URL inexistente para a página inicial. Não substituir a configuração HTTPS atual pelo exemplo HTTP do repositório. Não criar regras globais de redirecionamento para a homepage.

Depois da publicação: limpar a cache do Cloudflare, confirmar 200 nas páginas novas e sitemap, e 404 nos endereços antigos removidos (por exemplo /contact/ e /e-cadastro/). Enviar sitemap.xml na propriedade inbytes.co.mz do Search Console e pedir indexação das páginas principais. O Google gere a escolha dos sitelinks e o prazo da atualização; o sitemap não impõe os atalhos apresentados. Os pedidos e verificações no Search Console ainda não foram realizados.
