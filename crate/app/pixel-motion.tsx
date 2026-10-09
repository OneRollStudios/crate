// The pixel intro (first visit per session) and the masks for the pixel page
// transition. Both run as small inline scripts so they work before React loads,
// and neither delays the page: it renders underneath the whole time.

// Runs in <head> on every page load, before the first paint.
// 1. Decides whether this load shows the intro: first page of the session, and
//    no reduced motion. It marks <html data-intro> so the overlay paints at once.
// 2. Builds the pixel masks for the page transition (styles in globals.css): an
//    8x8 tile of 48px cells in a fixed shuffled order. The old page loses cells
//    in that order, they flash green, then the new page fills them in.
const headScript = `(function(){
var d=document.documentElement;
try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("crate-intro")){sessionStorage.setItem("crate-intro","1");d.setAttribute("data-intro","")}}catch(e){}
var n=8,c=48,o=[],i,j,t,s=7;
for(i=0;i<n*n;i++)o.push(i);
for(i=o.length-1;i>0;i--){s=(s*9301+49297)%233280;j=Math.floor(s/233280*(i+1));t=o[i];o[i]=o[j];o[j]=t}
function f(a,b){var p="";for(var k=a;k<b;k++)p+="M"+o[k]%n*c+" "+(o[k]/n|0)*c+"h"+c+"v"+c+"h-"+c+"z";return 'url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="'+n*c+'" height="'+n*c+'"><path d="'+p+'"/></svg>')+'")'}
var out="",inn="",x,step=n*n/8;
for(i=0;i<=10;i++){x=i*10+"%{-webkit-mask-image:";out+=x+f(Math.min(i,8)*step,n*n)+";mask-image:"+f(Math.min(i,8)*step,n*n)+"}";t=Math.max(0,Math.min(i-2,8))*step;inn+=x+f(0,t)+";mask-image:"+f(0,t)+"}"}
var st=document.createElement("style");st.textContent="@keyframes px-out{"+out+"}@keyframes px-in{"+inn+"}";document.head.appendChild(st);
})()`;

// Runs right after the overlay in <body>, only when the head script chose the
// intro. The "crate." wordmark assembles from square pixels while the page loads
// (fonts and first content). As soon as that's done, or 400ms after navigation
// start at the latest, the screen dissolves away in 48px cells over 450ms, so
// the intro never lasts much more than 850ms. No fixed delay.
const introScript = `(function(){
var d=document.documentElement;if(!d.hasAttribute("data-intro"))return;
var box=document.currentScript.previousElementSibling,cv=box.firstChild,x=cv.getContext("2d");if(!x){d.removeAttribute("data-intro");return}
var W=innerWidth,H=innerHeight;cv.width=W;cv.height=H;
var dark=matchMedia("(prefers-color-scheme: dark)").matches,bg=dark?"#0a0e1a":"#f6f4ed",ink=dark?"#f6f4ed":"#0a0e1a",dot=dark?"#d4ff3d":"#607913",lime="#d4ff3d";
var rows=["................#........","................#........",".###.#.##.###..###..##...","#....##......#..#..#..#..","#....#.....###..#..####..","#....#....#..#..#..#.....",".###.#.....###..##..###.o"];
var p=Math.max(8,Math.min(20,Math.floor(W*.75/25))),ox=Math.round((W-25*p)/2),oy=Math.round((H-7*p)/2),px=[],r,k,ch;
for(r=0;r<7;r++)for(k=0;k<25;k++){ch=rows[r][k];if(ch!==".")px.push({x:ox+k*p,y:oy+r*p,c:ch==="o"?dot:ink,t:Math.random()*220})}
var q=48,cells=[],cx,cy;for(cy=0;cy<H;cy+=q)for(cx=0;cx<W;cx+=q)cells.push({x:cx,y:cy,t:Math.random()*360});
var t0=performance.now(),go=0;
function start(){if(!go)go=performance.now()}
setTimeout(start,Math.max(0,400-t0));
function loaded(){requestAnimationFrame(function(){(document.fonts?document.fonts.ready:Promise.resolve()).then(start,start)})}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",loaded):loaded();
function draw(now){
var e=now-t0,i,a,v;
x.fillStyle=bg;x.fillRect(0,0,W,H);
for(i=0;i<px.length;i++){a=Math.min(1,Math.max(0,(e-px[i].t)/160));if(a>0){v=1-a;v=v*v*v;x.globalAlpha=a;x.fillStyle=px[i].c;x.fillRect(px[i].x,px[i].y-v*p*3,p-1,p-1)}}
x.globalAlpha=1;
if(go){var g=now-go;x.fillStyle=lime;for(i=0;i<cells.length;i++){a=g-cells[i].t;if(a>90)x.clearRect(cells[i].x,cells[i].y,q,q);else if(a>0)x.fillRect(cells[i].x,cells[i].y,q,q)}
if(g>450){d.removeAttribute("data-intro");cv.width=0;return}}
box.style.background="transparent";requestAnimationFrame(draw)}
requestAnimationFrame(draw);
})()`;

export function PixelHead() {
  return <script dangerouslySetInnerHTML={{ __html: headScript }} />;
}

export function PixelIntro() {
  return (
    <>
      <div className="px-intro" aria-hidden="true" suppressHydrationWarning><canvas suppressHydrationWarning /></div>
      <script dangerouslySetInnerHTML={{ __html: introScript }} />
    </>
  );
}
