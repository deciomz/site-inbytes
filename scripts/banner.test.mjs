import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const code=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
function harness(reduced=false){
 let clock=0,pending,delay,focused=false,keyboard=false,rootPresent=true,box={top:0,bottom:600,height:600};
 const image={complete:true};const listeners=new Map(),toggle={dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}},fill={style:{}},previous={},next={};
 const buttons=[0,1,2].map(i=>({dataset:{slide:String(i)}}));
 const root={isConnected:true,contains:()=>focused,getBoundingClientRect:()=>box,querySelector:selector=>({'.banner-toggle':toggle,'.banner-progress-fill':fill,'.banner-prev':previous,'.banner-next':next,'.hero-media img':image}[selector]||null),querySelectorAll:()=>buttons};
 const context={slide:0,bannerProjects:[1,2,3],heroPaused:undefined,heroTimer:null,heroCleanup:undefined,paintHero(){},bannerIcon:x=>x?'play':'pause',performance:{now:()=>clock},window:{matchMedia:()=>({matches:reduced}),siteTranslate:x=>x,innerHeight:800},document:{hidden:false,activeElement:{matches:()=>keyboard},querySelector:()=>rootPresent?root:null,addEventListener:(event,fn)=>listeners.set(event,fn),removeEventListener:event=>listeners.delete(event)},setTimeout:(fn,ms)=>{pending=fn;delay=ms;return 1;},clearTimeout:()=>{pending=null;}};
 vm.createContext(context);vm.runInContext(code.slice(code.indexOf('function setupHero(){'),code.indexOf('function fichaPage()')),context);vm.runInContext('setupHero()',context);
 return {context,root,toggle,buttons,previous,next,image,delay:()=>delay,progress:()=>Math.round((1-Number(fill.style.strokeDashoffset)/100)*1000000)/1000000,hasTimer:()=>!!pending,advance(ms){while(ms>0){const step=pending?Math.min(ms,delay):ms;clock+=step;ms-=step;if(pending){const fn=pending;pending=null;fn();}}},sleep(ms){clock+=ms;},visibility(hidden){context.document.hidden=hidden;listeners.get('visibilitychange')?.();},focus:v=>focused=v,keyboard:v=>keyboard=v,rect:v=>box=v,leaveRoute(){rootPresent=false;vm.runInContext('setupHero()',context);},listenerCount:()=>listeners.size};
}
test('full 10 seconds of visible reading time before advancing',()=>{const h=harness();h.advance(9900);assert.equal(h.context.slide,0);assert.equal(h.progress(),.99);h.advance(100);assert.equal(h.context.slide,1);assert.equal(h.progress(),0);h.advance(20000);assert.equal(h.context.slide,0);});
test('progress and slide use the same elapsed time',()=>{const h=harness();h.advance(5000);assert.equal(h.progress(),.5);assert.equal(h.context.slide,0);});
test('pause freezes progress and resume preserves remaining time',()=>{const h=harness();h.advance(6000);h.toggle.onclick();assert.equal(h.hasTimer(),false);assert.equal(h.progress(),.6);h.advance(12000);assert.equal(h.progress(),.6);h.toggle.onclick();h.advance(3900);assert.equal(h.context.slide,0);h.advance(100);assert.equal(h.context.slide,1);});
test('manual choice resets progress and gives a full interval',()=>{const h=harness();h.advance(9000);h.buttons[2].onclick();assert.equal(h.context.slide,2);assert.equal(h.progress(),0);h.advance(9900);assert.equal(h.context.slide,2);h.advance(100);assert.equal(h.context.slide,0);});
test('arrow navigation resets the countdown and wraps backwards',()=>{const h=harness();h.advance(4000);h.previous.onclick();assert.equal(h.context.slide,2);assert.equal(h.progress(),0);h.next.onclick();assert.equal(h.context.slide,0);});
test('manual navigation while paused stays paused',()=>{const h=harness();h.toggle.onclick();h.next.onclick();assert.equal(h.context.slide,1);assert.equal(h.progress(),0);assert.equal(h.hasTimer(),false);});
test('pointer focus does not block automatic rotation',()=>{const h=harness();h.focus(true);h.advance(10000);assert.equal(h.context.slide,1);});
test('keyboard focus suspends the clock',()=>{const h=harness();h.advance(3000);h.focus(true);h.keyboard(true);h.advance(20000);assert.equal(h.progress(),.3);h.keyboard(false);h.advance(7000);assert.equal(h.context.slide,1);});
test('background time is not charged after browser throttling',()=>{const h=harness();h.advance(5000);h.visibility(true);h.sleep(60000);h.visibility(false);h.advance(4900);assert.equal(h.context.slide,0);h.advance(100);assert.equal(h.context.slide,1);});
test('a small offscreen sliver does not consume reading time',()=>{const h=harness();h.rect({top:780,bottom:1000,height:220});h.advance(20000);assert.equal(h.progress(),0);h.rect({top:0,bottom:600,height:600});h.advance(10000);assert.equal(h.context.slide,1);});
test('leaving home cancels the timer and visibility listener',()=>{const h=harness();h.leaveRoute();assert.equal(h.hasTimer(),false);assert.equal(h.listenerCount(),0);});
test('reduced motion starts paused and can be resumed explicitly',()=>{const h=harness(true);assert.equal(h.hasTimer(),false);h.toggle.onclick();h.advance(10000);assert.equal(h.context.slide,1);});

test('reading time starts after the project image finishes loading',()=>{const h=harness();h.image.complete=false;h.advance(10000);assert.equal(h.progress(),0);h.image.complete=true;h.advance(9900);assert.equal(h.context.slide,0);h.advance(100);assert.equal(h.context.slide,1);});
