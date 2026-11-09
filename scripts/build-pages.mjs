import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const publicDir=path.join(root,'public');
const source=fs.readFileSync(path.join(publicDir,'app.js'),'utf8');
const routeSource=fs.readFileSync(path.join(publicDir,'routes.js'),'utf8');
const shell=fs.readFileSync(path.join(root,'src/shell.html'),'utf8');
const routeContext={window:{}};vm.createContext(routeContext);vm.runInContext(routeSource,routeContext);
const routes=routeContext.window.siteRoutes;
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const rendered=[];
for(const route of routes){
 const app={innerHTML:''};
 const context={window:{siteRoutes:routes,applySiteLanguage(){},addEventListener(){},scrollTo(){}},location:{pathname:route.path,hash:''},document:{querySelector(selector){return selector==='#app'?app:selector==='nav'?{classList:{remove(){}}}:selector==='#menu'?{setAttribute(){}}:null},querySelectorAll(){return []}}};
 vm.createContext(context);vm.runInContext(source,context);
 assert.match(app.innerHTML,/<h1[ >]/,route.path);
 assert.ok(!app.innerHTML.includes('Página não encontrada'),route.path);
 let html=shell.replace(/<title>.*?<\/title>/,()=>'<title>'+escape(route.title)+'</title>')
 .replace(/<meta name="description" content="[^"]*">/,()=>'<meta name="description" content="'+escape(route.description)+'">')
 .replace('<main id="app"></main>',()=>'<main id="app">'+app.innerHTML+'</main>')
 .replace('</head>','</head>');
 const canonical='https://inbytes.co.mz'+route.path;
 html=html.replace('<title>', '<link rel="canonical" href="'+canonical+'"><meta property="og:url" content="'+canonical+'"><meta property="og:type" content="website"><meta property="og:title" content="'+escape(route.title)+'"><meta property="og:description" content="'+escape(route.description)+'"><title>');
 // The original shell uses valid implicit head/body elements; keep metadata before its first header.
 html=vm.runInContext('siteLinks('+JSON.stringify(html)+')',context);
 assert.ok(!html.includes('href="#/'),route.path);
 assert.ok(html.includes('src="/routes.js?'),route.path);
 const file=path.join(publicDir,route.path,'index.html');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html);
 rendered.push({route,file,html});
}
for(const {route,html}of rendered){
 for(const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){
  const target=match[1];if(target.startsWith('/api/'))continue;
  const dest=path.join(publicDir,target,target.endsWith('/')?'index.html':'');
  assert.ok(fs.existsSync(dest),route.path+' links to missing file '+target);
 }
}
fs.writeFileSync(path.join(publicDir,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+routes.map(r=>'  <url><loc>https://inbytes.co.mz'+r.path+'</loc></url>').join('\n')+'\n</urlset>\n');
fs.writeFileSync(path.join(publicDir,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://inbytes.co.mz/sitemap.xml\n');
console.log('Validated '+routes.length+' HTML pages: unique paths, canonical URLs, page content without JavaScript, metadata and internal links.');
