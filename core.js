/* Shared by index.html, card.html and admin.html */
const FIREBASE_CONFIG={apiKey:"AIzaSyBPCFXfjh-1BA6P1MecUPbAoeX02f_iBlo",authDomain:"date-planning-c57da.firebaseapp.com",projectId:"date-planning-c57da",appId:"1:926976322970:web:78d4756bc28a3bd1479e23"};
const ADMIN_EMAIL="mollyeen77@gmail.com";
const QR_URL="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
const XLSX_URL="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const loadJs=u=>new Promise((ok,no)=>{const s=document.createElement("script");s.src=u;s.onload=ok;s.onerror=()=>no(new Error("Could not load "+u));document.head.appendChild(s)});
let _fb=null;
function fb(){return _fb||(_fb=(async()=>{const b="https://www.gstatic.com/firebasejs/10.12.2/";
  for(const f of ["app","firestore","auth"])await loadJs(b+"firebase-"+f+"-compat.js");
  firebase.initializeApp(FIREBASE_CONFIG);return{db:firebase.firestore(),auth:firebase.auth()}})())}
const ts=()=>firebase.firestore.FieldValue.serverTimestamp();

function toast(m){let t=$("#toast");if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t)}
  t.textContent=m;t.className="show";clearTimeout(t._t);t._t=setTimeout(()=>t.className="",2600)}

function authMsg(c){return({
 "auth/invalid-credential":"That email or password is incorrect. Check both and try again.",
 "auth/wrong-password":"Wrong password. Try again, or reset it.",
 "auth/user-not-found":"No account found with that email.",
 "auth/invalid-email":"That email address doesn't look right.",
 "auth/email-already-in-use":"An account with this email already exists. Please log in instead.",
 "auth/weak-password":"Password is too weak. Use at least 6 characters.",
 "auth/missing-password":"Please enter your password.",
 "auth/too-many-requests":"Too many attempts. Wait a few minutes, or reset your password.",
 "auth/network-request-failed":"No internet connection."})[c]||"Something went wrong. Please try again."}

/* ---------- platforms: [display, aliases, domain (for logo), link builder, emoji-icon] ---------- */
const h=d=>d.trim().replace(/^@/,"").replace(/\s+/g,"");
const dg=d=>d.replace(/[^\d]/g,"");
const P=[
["Instagram",["instagram","insta","ig"],"instagram.com",d=>"https://instagram.com/"+h(d)],
["WhatsApp",["whatsapp","wa"],"whatsapp.com",d=>"https://wa.me/"+dg(d)],
["Facebook",["facebook","fb"],"facebook.com",d=>"https://facebook.com/"+h(d)],
["X (Twitter)",["x","twitter"],"x.com",d=>"https://x.com/"+h(d)],
["TikTok",["tiktok"],"tiktok.com",d=>"https://tiktok.com/@"+h(d)],
["Snapchat",["snapchat","snap"],"snapchat.com",d=>"https://snapchat.com/add/"+h(d)],
["LinkedIn",["linkedin"],"linkedin.com",d=>"https://linkedin.com/in/"+h(d)],
["Telegram",["telegram"],"telegram.org",d=>"https://t.me/"+h(d)],
["YouTube",["youtube","yt"],"youtube.com",d=>"https://youtube.com/@"+h(d)],
["GitHub",["github"],"github.com",d=>"https://github.com/"+h(d)],
["Threads",["threads"],"threads.net",d=>"https://threads.net/@"+h(d)],
["Pinterest",["pinterest"],"pinterest.com",d=>"https://pinterest.com/"+h(d)],
["Twitch",["twitch"],"twitch.tv",d=>"https://twitch.tv/"+h(d)],
["Discord",["discord"],"discord.com",null],
["Spotify",["spotify"],"spotify.com",null],
["SoundCloud",["soundcloud"],"soundcloud.com",d=>"https://soundcloud.com/"+h(d)],
["Reddit",["reddit"],"reddit.com",d=>"https://reddit.com/user/"+h(d)],
["Behance",["behance"],"behance.net",d=>"https://behance.net/"+h(d)],
["Dribbble",["dribbble"],"dribbble.com",d=>"https://dribbble.com/"+h(d)],
["Medium",["medium"],"medium.com",d=>"https://medium.com/@"+h(d)],
["Signal",["signal"],"signal.org",null],
["Viber",["viber"],"viber.com",null],
["WeChat",["wechat"],"wechat.com",null],
["Skype",["skype"],"skype.com",null],
["PayPal",["paypal"],"paypal.com",d=>"https://paypal.me/"+h(d)],
["Cash App",["cashapp","cash"],"cash.app",d=>"https://cash.app/$"+h(d).replace(/^\$/,"")],
["Gmail",["gmail"],"gmail.com",d=>"mailto:"+d.trim()],
["Email",["email","mail","emailaddress"],null,d=>"mailto:"+d.trim(),"✉️"],
["Phone",["phone","call","mobile","tel","telephone","number","phonenumber"],null,d=>"tel:"+d.replace(/[^\d+]/g,""),"📞"],
["Website",["website","site","portfolio","web","blog","link"],null,d=>/^https?:/i.test(d)?d.trim():"https://"+d.trim(),"🌐"],
["Address",["address","location","office"],null,d=>"https://www.google.com/maps/search/"+encodeURIComponent(d),"📍"]
];
function findPlatform(name){const k=norm(name);if(!k)return null;
  let p=P.find(p=>p[1].includes(k)||norm(p[0])===k);if(p)return p;
  if(k.length>=3)p=P.find(p=>[norm(p[0]),...p[1]].some(a=>a.length>=3&&a.startsWith(k)));
  return p||null}
const displayName=n=>{const p=findPlatform(n);return p?p[0]:String(n||"").trim()};
function logo(name,size=40){const p=findPlatform(name),l=(String(name||"").trim()[0]||"?").toUpperCase(),L=/[A-Z0-9]/.test(l)?l:"•";
  const o=`<span class="logo" style="--s:${size}px">`;
  if(p&&p[4])return o+p[4]+"</span>";
  let dom=p?p[2]:(/^[a-z0-9-]+\.[a-z.]{2,}$/i.test(String(name).trim())?String(name).trim().toLowerCase():null);
  if(dom)return o+`<img alt="" src="https://www.google.com/s2/favicons?domain=${dom}&sz=128" onerror="this.replaceWith(document.createTextNode('${L}'))"></span>`;
  return o+`<b>${L}</b></span>`}
function linkFor(name,detail){const d=String(detail||"").trim();if(!d)return null;
  if(/^https?:\/\//i.test(d))return d;
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d))return "mailto:"+d;
  const p=findPlatform(name);if(p&&p[3]&&!(p[0]==="Address"&&false))return p[3](d);
  if(/^[+\d][\d\s\-()]{6,}$/.test(d))return "tel:"+d.replace(/[^\d+]/g,"");
  if(/^[^\s]+\.[a-z]{2,}(\/\S*)?$/i.test(d))return "https://"+d;
  return null}
function hintFor(name){const p=findPlatform(name);if(!p)return "Username, number or link";
  if(["WhatsApp","Phone","Viber","Signal"].includes(p[0]))return "+233 24 000 0000";
  if(["Email","Gmail"].includes(p[0]))return "you@example.com";
  if(p[0]==="Website")return "www.yoursite.com";
  if(p[0]==="Address")return "Street, area, city";
  return "@username or profile link"}

/* ================= v2 additions ================= */
function cardUrl(id,src){return new URL("card.html?c="+encodeURIComponent(id)+(src?"&s="+src:""),location.href).href}
const safeImg=s=>/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(s||"")?s:"";
function vid(){try{let v=localStorage.getItem("reach_vid");if(!v){v=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("reach_vid",v)}return v}catch(e){return"anon"}}
function imgToDataUrl(file,o={}){const{max=320,square=true,png=false,q=.8}=o;
  return new Promise((ok,no)=>{const img=new Image(),u=URL.createObjectURL(file);
    img.onload=()=>{let sx=0,sy=0,sw=img.width,sh=img.height,dw,dh;
      if(square){const s=Math.min(sw,sh);sx=(sw-s)/2;sy=(sh-s)/2;sw=sh=s;dw=dh=max}
      else{const k=Math.min(1,max/Math.max(sw,sh));dw=Math.round(sw*k);dh=Math.round(sh*k)}
      const c=document.createElement("canvas");c.width=dw;c.height=dh;const x=c.getContext("2d");
      if(!png){x.fillStyle="#fff";x.fillRect(0,0,dw,dh)}
      x.drawImage(img,sx,sy,sw,sh,0,0,dw,dh);URL.revokeObjectURL(u);ok(c.toDataURL(png?"image/png":"image/jpeg",q))};
    img.onerror=()=>no(new Error("bad image"));img.src=u})}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function authReady(auth){return Promise.race([new Promise(r=>{const un=auth.onAuthStateChanged(u=>{un();r(u)})}),wait(2500).then(()=>null)])}
function safeName(s){return String(s||"card").trim().replace(/[^\w\-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"card"}
function when(t){return t?new Date(t).toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):""}
const ms=t=>t&&t.toMillis?t.toMillis():(typeof t==="number"?t:0);

/* every contact line a card can show, in display order */
function contactLines(card,{platforms=true}={}){const L=[];
  if(card.officePhone)L.push({kind:"Office phone",name:"Office phone",value:card.officePhone,href:"tel:"+card.officePhone.replace(/[^\d+]/g,""),icon:"📞"});
  if(card.businessWhatsApp)L.push({kind:"WhatsApp",name:"WhatsApp",value:card.businessWhatsApp,href:"https://wa.me/"+card.businessWhatsApp.replace(/[^\d]/g,""),logoName:"WhatsApp"});
  if(card.website)L.push({kind:"Website",name:"Website",value:card.website,href:/^https?:/i.test(card.website)?card.website:"https://"+card.website,icon:"🌐"});
  if(card.address)L.push({kind:"Address",name:"Address",value:card.address,href:"https://www.google.com/maps/search/"+encodeURIComponent(card.address),icon:"📍"});
  if(platforms)(card.platforms||[]).forEach(p=>L.push({kind:displayName(p.name),name:displayName(p.name),value:p.detail,href:linkFor(p.name,p.detail),logoName:p.name}));
  return L}

/* analytics block used by the user dashboard and the admin dashboard */
function analyticsHtml(h,opt={}){
  const views=h.filter(x=>x.type==="view"),clicks=h.filter(x=>x.type==="click");
  const uniq=new Set(views.map(x=>x.vid)).size,qr=views.filter(x=>x.src==="qr").length;
  const days=[],now=new Date();now.setHours(0,0,0,0);
  for(let i=29;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);days.push({t:d.getTime(),n:0})}
  views.forEach(v=>{const d=new Date(v.ts);d.setHours(0,0,0,0);const i=days.findIndex(x=>x.t===d.getTime());if(i>-1)days[i].n++});
  const mx=Math.max(1,...days.map(d=>d.n));
  const top={};clicks.forEach(c=>{const k=displayName(c.p||"?");top[k]=(top[k]||0)+1});
  const tops=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,6),tm=tops.length?tops[0][1]:1;
  let topCards="";
  if(opt.names){const cnt={};views.forEach(v=>cnt[v.card]=(cnt[v.card]||0)+1);
    const arr=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5);
    topCards=`<h3 class="ah">Most-viewed cards</h3>`+(arr.length?arr.map(([id,n])=>`<div class="bar"><span class="bl">${esc(opt.names[id]||"(deleted card)")}</span><i style="width:${Math.max(4,n/arr[0][1]*100)}%"></i><b>${n}</b></div>`).join(""):'<p class="sub">No views yet.</p>')}
  const fmt=t=>new Date(t).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
  return `<div class="atiles"><div class="at t1"><b>${views.length}</b><small>Total card views</small></div><div class="at t2"><b>${uniq}</b><small>Unique visitors</small></div><div class="at t3"><b>${qr}</b><small>QR scans</small></div><div class="at t4"><b>${clicks.length}</b><small>Platform clicks</small></div></div>
  <h3 class="ah">Views over time <span class="sub" style="font-size:.8rem">last 30 days</span></h3>
  <div class="chart">${days.map(d=>`<div class="col" title="${fmt(d.t)}: ${d.n} view${d.n===1?"":"s"}"><i style="height:${d.n?Math.max(6,d.n/mx*100):2}%" class="${d.n?"on":""}"></i></div>`).join("")}</div>
  <div class="axis"><span>${fmt(days[0].t)}</span><span>${fmt(days[14].t)}</span><span>${fmt(days[29].t)}</span></div>
  <h3 class="ah">Most-clicked platforms</h3>
  ${tops.length?tops.map(([n,c])=>`<div class="bar">${logo(n,30)}<span class="bl">${esc(n)}</span><i style="width:${Math.max(4,c/tm*100)}%"></i><b>${c}</b></div>`).join(""):'<p class="sub">No clicks yet. They appear when visitors tap a platform on your card.</p>'}
  ${topCards}`}
