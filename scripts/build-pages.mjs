import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),publicDir=path.join(root,'public');
const source=fs.readFileSync(path.join(publicDir,'app.js'),'utf8');
const routeSource=fs.readFileSync(path.join(publicDir,'routes.js'),'utf8');
const shell=fs.readFileSync(path.join(root,'src/shell.html'),'utf8');
const routeContext={window:{}};vm.createContext(routeContext);vm.runInContext(routeSource,routeContext);
const routes=routeContext.window.siteRoutes;
assert.equal(new Set(routes.map(r=>r.path)).size,routes.length,'Duplicate route');
const languageContext={window:{},location:{pathname:'/'}};vm.createContext(languageContext);vm.runInContext(fs.readFileSync(path.join(publicDir,'i18n.js'),'utf8'),languageContext);
const english=vm.runInContext('english',languageContext);
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const rendered=[];
function translateHTML(html){
 let inScript=false;
 return html.split(/(<[^>]+>)/g).map(part=>{
  if(part.startsWith('<')){
   if(/^<(script|style)\b/i.test(part))inScript=true;
   if(/^<\/(script|style)/i.test(part))inScript=false;
   return part.replace(/\b(alt|aria-label|placeholder|title)="([^"]*)"/g,(_,attr,value)=>attr+'="'+escape(english(value))+'"');
  }
  if(inScript||!part.trim())return part;
  const trimmed=part.trim();return part.replace(trimmed,english(trimmed));
 }).join('');
}
for(const route of routes){
 const app={innerHTML:''};
 const context={URLSearchParams,window:{siteRoutes:routes,siteLanguage:'pt',applySiteLanguage(){},addEventListener(){},scrollTo(){}},location:{pathname:route.path,hash:'',search:''},document:{querySelector(selector){return selector==='#app'?app:selector==='nav'?{classList:{remove(){}}}:selector==='#menu'?{setAttribute(){}}:null},querySelectorAll(){return []}}};
 vm.createContext(context);vm.runInContext(source,context);
 assert.equal((app.innerHTML.match(/<h1[ >]/g)||[]).length,1,route.path+' must have one H1');
 assert.ok(!app.innerHTML.includes('Página não encontrada'),route.path);
 const body=vm.runInContext('siteLinks('+JSON.stringify(app.innerHTML)+')',context);
 for(const lang of ['pt','en']){
  const routePath=(lang==='en'?'/en':'')+route.path;
  const canonical='https://inbytes.co.mz'+routePath;
  const title=lang==='en'?english(route.title):route.title;
  const description=lang==='en'?english(route.description):route.description;
  let html=shell.replace('<main id="app"></main>',()=>'<main id="app">'+body+'</main>');
  html=vm.runInContext('siteLinks('+JSON.stringify(html)+')',context);
  if(lang==='en'){
   html=translateHTML(html).replace('lang="pt-MZ"','lang="en"')
    .replace(/href="\/(?!assets\/|api\/|en(?:\/|"))([^"]*)"/g,(_,url)=>'href="'+(/\.[a-z0-9]+(?:\?|$)/i.test(url)?'/':'/en/')+url+'"')
    .replace('data-language="pt" aria-label="Português" aria-pressed="true"','data-language="pt" aria-label="Português" aria-pressed="false"')
    .replace('data-language="en" aria-label="English" aria-pressed="false"','data-language="en" aria-label="English" aria-pressed="true"');
  }
  html=html.replace(/<title>.*?<\/title>/,()=>'<title>'+escape(title)+'</title>')
   .replace(/<meta name="description" content="[^"]*">/,()=>'<meta name="description" content="'+escape(description)+'">');
  const meta='<link rel="canonical" href="'+canonical+'"><link rel="alternate" hreflang="pt" href="https://inbytes.co.mz'+route.path+'"><link rel="alternate" hreflang="en" href="https://inbytes.co.mz/en'+route.path+'"><link rel="alternate" hreflang="x-default" href="https://inbytes.co.mz'+route.path+'"><meta property="og:url" content="'+canonical+'"><meta property="og:type" content="website"><meta property="og:title" content="'+escape(title)+'"><meta property="og:description" content="'+escape(description)+'">';
  html=html.replace('<title>',meta+'<title>');
  assert.ok(!html.includes('href="#/'),routePath);
  const file=path.join(publicDir,routePath,'index.html');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html);
  rendered.push({routePath,html});
 }
}
for(const {routePath,html}of rendered){
 for(const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){
  const target=match[1];if(target.startsWith('/api/'))continue;
  const dest=path.join(publicDir,target,target.endsWith('/')?'index.html':'');
  assert.ok(fs.existsSync(dest),routePath+' links to missing file '+target);
 }
}
const origin='https://inbytes.co.mz';
fs.writeFileSync(path.join(publicDir,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+routes.flatMap(r=>['pt','en'].map(lang=>'  <url><loc>'+origin+(lang==='en'?'/en':'')+r.path+'</loc><xhtml:link rel="alternate" hreflang="pt" href="'+origin+r.path+'"/><xhtml:link rel="alternate" hreflang="en" href="'+origin+'/en'+r.path+'"/></url>')).join('\n')+'\n</urlset>\n');
fs.writeFileSync(path.join(publicDir,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://inbytes.co.mz/sitemap.xml\n');
console.log('Validated '+rendered.length+' PT/EN pages: unique paths, one H1, canonical, hreflang, static content and internal links.');
