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
function cardUrl(uid){return new URL("card.html?u="+encodeURIComponent(uid),location.href).href}
