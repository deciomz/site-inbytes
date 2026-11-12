# Inbytes website

Website corporativo da Inbytes: HTML, CSS e JavaScript, com formulário PHP para Resend e Cloudflare Turnstile. Português e inglês em endereços próprios, definidos pelo idioma da página.

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

As páginas atuais usam URLs próprias (sem fragmentos #), HTML com conteúdo pré-gerado, título e descrição por página e canonical. Sitemap em /sitemap.xml, robots.txt em /robots.txt. Desde a revisão de 12/11/2026, existe uma versão inglesa em /en/ com canonical e hreflang próprios.

Para alterações ao conteúdo ou ao menu, editar public/app.js, public/routes.js e/ou src/shell.html, atualizar as traduções em public/i18n.js e executar localmente:

```bash
node scripts/build-pages.mjs
```

O gerador usa só módulos integrados do Node, sem dependências, e verifica as páginas dos dois idiomas e as referências internas. Node não é necessário no VPS: publicar os ficheiros HTML já gerados.

Não recuperar as páginas antigas do WordPress. Em 11/11/2026, o proprietário pediu a correção de dois links antigos ainda apresentados no Google; apenas esses dois têm redirecionamentos permanentes preparados em deploy/google-links.conf para as páginas atuais de sistemas e websites. O Nginx deve continuar com try_files $uri $uri/ =404, sem encaminhar qualquer URL inexistente para a página inicial. Não substituir a configuração HTTPS atual pelo exemplo HTTP do repositório. Não criar regras globais de redirecionamento para a homepage.

Depois da publicação: limpar a cache do Cloudflare, confirmar 200 nas páginas novas e sitemap, e 404 nos endereços antigos removidos (por exemplo /contact/ e /e-cadastro/). Enviar sitemap.xml na propriedade inbytes.co.mz do Search Console e pedir indexação das páginas principais. O Google gere a escolha dos sitelinks e o prazo da atualização; o sitemap não impõe os atalhos apresentados. Os pedidos e verificações no Search Console ainda não foram realizados.

## Ficha em Dia

Página promocional em /ficha/, integrada a partir do ZIP fornecido pelo proprietário. Mantém o conteúdo e o preço de 3.500 MT por mês por escola, contratação possível de apenas um mês e contactos originais. Imagem em public/assets/ficha-familia.png e estilos isolados em public/ficha.css. Tradução PT/EN, cartão em Produtos e Sistemas e entrada no sitemap. Não contém formulário de inscrição nem recolha de dados de alunos.

Verificado localmente em 320, 390 e 1024 píxeis, em português e inglês, sem deslocamento horizontal. O endereço público só fica disponível depois do carregamento no VPS.


## Correção dos resultados Google — 11/11/2026

O seletor apresenta Português / English e usa data-nosnippet para excluir esse conteúdo dos excertos. Os títulos e H1 institucionais identificam a Inbytes. A escolha dos títulos e sitelinks continua a ser automática no Google. A alteração só chega à produção depois do upload; a apresentação na pesquisa depende de novo rastreio. Não aplicar noindex à página Sobre.

O ficheiro deploy/google-links.conf deve ser incluído no bloco server HTTPS existente, preservando o Certbot. Validar com nginx -t antes de recarregar. Não substituir o ficheiro de produção pelo exemplo HTTP. Os dois redirecionamentos 301 devem terminar nas páginas atuais com resposta 200, sem adicionar as URLs antigas ao sitemap.

## Conteúdo para posicionamento orgânico — 11/11/2026

Páginas atuais de websites, sistemas e apps: título e descrição próprios, H1 com o serviço, conteúdo específico, perguntas comerciais e contactos. Projetos de websites e sistemas ligam às respetivas páginas do portefólio; a página de apps não apresenta projetos móveis sem confirmação. Mantidas as URLs atuais e os dois redirecionamentos específicos já configurados no VPS. Sem publicidade paga ou serviços externos novos.

Após publicar, solicitar indexação das três páginas no Search Console. Acompanhar em Desempenho as consultas, impressões, cliques e páginas; comparar períodos antes de avaliar alterações. Perfil da Empresa no Google e referências reais de clientes são próximos passos gratuitos, a gerir pelo proprietário. Não comprar links ou inventar avaliações. Nenhuma alteração garante primeiro lugar.

Direção comercial revista pelo proprietário: os serviços dirigem-se a clientes sem limitação geográfica. Títulos, descrições, apresentação inicial e chamadas comerciais não restringem o mercado a Moçambique nem acrescentam slogans sobre atuação mundial. A origem da empresa, a sede e o contexto real de cada projeto continuam identificados quando relevantes.

## Revisão editorial e visual — 12/11/2026

Versão local para validação do proprietário. Abertura institucional, seleção de quatro projetos, banner móvel compacto com anterior/seguinte/pausa, contactos no menu móvel, cabeçalhos de projeto separados das capturas, âmbito de design e desenvolvimento confirmado, formulário com contexto e página de privacidade. Não publicar ecrãs privados do JMembros ou testemunhos. A página de IA descreve aplicações e critérios de avaliação, sem apresentar casos demonstráveis inexistentes.

Cada página tem uma versão inglesa em /en/, HTML traduzido, canonical próprio e alternates pt/en/x-default; o sitemap inclui os dois idiomas. O endereço define o idioma e o seletor preserva o assunto do contacto. Os caminhos portugueses existentes são mantidos, tal como os redirecionamentos Nginx específicos.

Pré-visualização: python -m http.server 4200 --bind 127.0.0.1 --directory public. Abrir http://127.0.0.1:4200/. Neste endereço o formulário valida os campos, mas não envia emails. Em produção mantém a API PHP existente e inclui o assunto no corpo da mensagem; não é necessário substituir a configuração privada. Testar o envio no VPS após uma eventual publicação.

Verificações: node scripts/build-pages.mjs; node --test scripts/*.test.mjs. Ainda sem publicação desta revisão no VPS e sem push solicitado para esta versão.

Abertura revista após feedback visual: imagem ampla, tipografia assimétrica sem palavras coloridas, chamada de contacto discreta e índice plano de três projetos. A captura do SINPOCAF mantém-se no índice; a imagem ferroviária de fundo é uma ilustração já existente, identificada no texto alternativo. Restantes páginas e banner de produtos preservados.
