/* Shared by every page */
const FIREBASE_CONFIG={apiKey:"AIzaSyBPCFXfjh-1BA6P1MecUPbAoeX02f_iBlo",authDomain:"date-planning-c57da.firebaseapp.com",projectId:"date-planning-c57da",appId:"1:926976322970:web:78d4756bc28a3bd1479e23"};
const ADMIN_EMAIL="mollyeen77@gmail.com";
const QR_URL="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
const XLSX_URL="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
/* Shown on the Contact page. Fill in what you want people to see; leave "" to hide a line. */
const CONTACT={email:"",whatsapp:"",phone:"",address:"",hours:""};

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* works for every script: Latin, Arabic, Cyrillic, Chinese, Japanese, Korean, Hindi... */
const norm=s=>String(s||"").normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N}]/gu,"");
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

/* =====================================================================
   PLATFORMS: [display name, aliases (any language), logo domain, link template, emoji icon]
   Link templates: {u}=username  {n}=digits only  {d}=as typed  {tel}=phone  {web}  {map}
   ===================================================================== */
const h=d=>d.trim().replace(/^@/,"").replace(/\s+/g,"");
const dg=d=>d.replace(/[^\d]/g,"");
const RAW=[
["Instagram","insta,ig,instagram,インスタ,インスタグラム,إنستغرام,انستقرام,इंस्टाग्राम,인스타그램,инстаграм,инста","instagram.com","https://instagram.com/{u}"],
["WhatsApp","whatsapp,wa,whats,wasap,wsp,zap,whatsappbusiness,واتساب,واتس اب,व्हाट्सएप,व्हाट्सऐप,ワッツアップ,왓츠앱,ватсап,вацап","whatsapp.com","https://wa.me/{n}"],
["Facebook","fb,facebook,face,フェイスブック,فيسبوك,فايسبوك,फेसबुक,페이스북,фейсбук","facebook.com","https://facebook.com/{u}"],
["Messenger","messenger,fbmessenger,facebookmessenger","messenger.com","https://m.me/{u}"],
["X (Twitter)","x,twitter,tweet,ツイッター,تويتر,트위터,твиттер,推特","x.com","https://x.com/{u}"],
["TikTok","tiktok,tik tok,ticktock,ティックトック,تيك توك,틱톡,тикток","tiktok.com","https://tiktok.com/@{u}"],
["Snapchat","snapchat,snap,スナップチャット,سناب شات,سناب,스냅챗,снапчат","snapchat.com","https://snapchat.com/add/{u}"],
["LinkedIn","linkedin,linkdin,linkedln,リンクトイン,لينكد إن,링크드인,линкедин,领英","linkedin.com","https://linkedin.com/in/{u}"],
["Telegram","telegram,tg,テレグラム,تيليجرام,تلغرام,텔레그램,телеграм,电报","telegram.org","https://t.me/{u}"],
["YouTube","youtube,yt,ytb,ユーチューブ,يوتيوب,यूट्यूब,유튜브,ютуб,油管","youtube.com","https://youtube.com/@{u}"],
["YouTube Music","youtubemusic,ytmusic","music.youtube.com",null],
["Threads","threads","threads.net","https://threads.net/@{u}"],
["Pinterest","pinterest,pin,ピンタレスト,بينتريست,핀터레스트,пинтерест","pinterest.com","https://pinterest.com/{u}"],
["Reddit","reddit,レディット,ريديت,редит","reddit.com","https://reddit.com/user/{u}"],
["Tumblr","tumblr","tumblr.com","https://{u}.tumblr.com"],
["Quora","quora","quora.com",null],
["Medium","medium","medium.com","https://medium.com/@{u}"],
["Substack","substack","substack.com","https://{u}.substack.com"],
["Twitch","twitch,ツイッチ","twitch.tv","https://twitch.tv/{u}"],
["Discord","discord,ディスコード,ديسكورد,디스코드,дискорд","discord.com",null],
["Slack","slack,スラック","slack.com",null],
["Signal","signal,سيجنال","signal.org",null],
["Viber","viber,ヴァイバー,فايبر,вайбер","viber.com","viber://chat?number={n}"],
["Skype","skype,スカイプ,سكايب,скайп","skype.com","skype:{u}?chat"],
["Zoom","zoom,ズーム","zoom.us",null],
["Google Meet","googlemeet,meet","meet.google.com",null],
["Microsoft Teams","teams,microsoftteams,msteams","teams.microsoft.com",null],
["Clubhouse","clubhouse","clubhouse.com",null],
["Mastodon","mastodon","mastodon.social",null],
["Bluesky","bluesky,bsky","bsky.app","https://bsky.app/profile/{u}"],
["LinkedIn Learning","linkedinlearning","learning.linkedin.com",null],
["LINE","line,ライン,라인,لاين,лайн","line.me","https://line.me/ti/p/~{u}"],
["KakaoTalk","kakaotalk,kakao,카카오톡,카카오,カカオトーク","kakao.com",null],
["Naver","naver,네이버,ネイバー","naver.com",null],
["BAND","band,밴드","band.us",null],
["WeChat","wechat,weixin,微信,ウィーチャット,وي شات,위챗,вичат","wechat.com",null],
["Weibo","weibo,sinaweibo,微博,ウェイボー,웨이보","weibo.com",null],
["QQ","qq,腾讯qq","qq.com",null],
["Douyin","douyin,抖音,ドウイン","douyin.com",null],
["Xiaohongshu (RED)","xiaohongshu,rednote,小红书,シャオホンシュー","xiaohongshu.com",null],
["Bilibili","bilibili,哔哩哔哩,b站,ビリビリ,嗶哩嗶哩","bilibili.com",null],
["Zhihu","zhihu,知乎","zhihu.com",null],
["Douban","douban,豆瓣","douban.com",null],
["Baidu","baidu,百度,バイドゥ","baidu.com",null],
["Kuaishou","kuaishou,快手,kwai,クアイショウ","kuaishou.com",null],
["VK","vk,vkontakte,вк,вконтакте","vk.com","https://vk.com/{u}"],
["Odnoklassniki (OK)","ok,odnoklassniki,одноклассники","ok.ru",null],
["Yandex","yandex,яндекс","yandex.com",null],
["Zalo","zalo","zalo.me","https://zalo.me/{n}"],
["ShareChat","sharechat,शेयरचैट","sharechat.com",null],
["Truecaller","truecaller","truecaller.com",null],
["IMO","imo","imo.im",null],
["Tinder","tinder","tinder.com",null],
["Bumble","bumble","bumble.com",null],
["Badoo","badoo","badoo.com",null],
["GitHub","github,git,ギットハブ,гитхаб","github.com","https://github.com/{u}"],
["GitLab","gitlab","gitlab.com","https://gitlab.com/{u}"],
["Bitbucket","bitbucket","bitbucket.org","https://bitbucket.org/{u}"],
["Stack Overflow","stackoverflow,stack","stackoverflow.com",null],
["DEV","devto,dev.to","dev.to","https://dev.to/{u}"],
["Hashnode","hashnode","hashnode.com",null],
["Kaggle","kaggle","kaggle.com","https://kaggle.com/{u}"],
["Hugging Face","huggingface","huggingface.co","https://huggingface.co/{u}"],
["LeetCode","leetcode","leetcode.com",null],
["CodePen","codepen","codepen.io","https://codepen.io/{u}"],
["Figma","figma","figma.com",null],
["Behance","behance","behance.net","https://behance.net/{u}"],
["Dribbble","dribbble","dribbble.com","https://dribbble.com/{u}"],
["ArtStation","artstation","artstation.com","https://artstation.com/{u}"],
["DeviantArt","deviantart","deviantart.com","https://deviantart.com/{u}"],
["Pixiv","pixiv,ピクシブ","pixiv.net",null],
["500px","500px","500px.com",null],
["Flickr","flickr","flickr.com",null],
["Unsplash","unsplash","unsplash.com","https://unsplash.com/@{u}"],
["Vimeo","vimeo","vimeo.com","https://vimeo.com/{u}"],
["Dailymotion","dailymotion","dailymotion.com","https://dailymotion.com/{u}"],
["Notion","notion","notion.so",null],
["Canva","canva","canva.com",null],
["Calendly","calendly","calendly.com","https://calendly.com/{u}"],
["Cal.com","calcom","cal.com","https://cal.com/{u}"],
["Linktree","linktree,linktr,linktree","linktr.ee","https://linktr.ee/{u}"],
["Carrd","carrd","carrd.co",null],
["Wix","wix","wix.com",null],
["WordPress","wordpress,wp","wordpress.com",null],
["Blogger","blogger,blogspot","blogger.com",null],
["Shopify","shopify","shopify.com",null],
["Squarespace","squarespace","squarespace.com",null],
["Patreon","patreon","patreon.com","https://patreon.com/{u}"],
["Ko-fi","kofi","ko-fi.com","https://ko-fi.com/{u}"],
["Buy Me a Coffee","buymeacoffee,bmc","buymeacoffee.com","https://buymeacoffee.com/{u}"],
["Upwork","upwork","upwork.com",null],
["Fiverr","fiverr","fiverr.com","https://fiverr.com/{u}"],
["Freelancer","freelancer","freelancer.com",null],
["Toptal","toptal","toptal.com",null],
["Indeed","indeed","indeed.com",null],
["Glassdoor","glassdoor","glassdoor.com",null],
["XING","xing","xing.com",null],
["ResearchGate","researchgate","researchgate.net",null],
["ORCID","orcid","orcid.org","https://orcid.org/{u}"],
["Academia.edu","academia,academiaedu","academia.edu",null],
["Google Scholar","googlescholar,scholar","scholar.google.com",null],
["Coursera","coursera","coursera.org",null],
["Udemy","udemy","udemy.com",null],
["Khan Academy","khanacademy,khan","khanacademy.org",null],
["Spotify","spotify,スポティファイ,سبوتيفاي,스포티파이,спотифай","spotify.com",null],
["Apple Music","applemusic","music.apple.com",null],
["SoundCloud","soundcloud","soundcloud.com","https://soundcloud.com/{u}"],
["Deezer","deezer","deezer.com",null],
["TIDAL","tidal","tidal.com",null],
["Audiomack","audiomack","audiomack.com","https://audiomack.com/{u}"],
["Boomplay","boomplay","boomplay.com",null],
["Mdundo","mdundo","mdundo.com",null],
["Anghami","anghami,أنغامي","anghami.com",null],
["Bandcamp","bandcamp","bandcamp.com",null],
["JioSaavn","jiosaavn,saavn","jiosaavn.com",null],
["Gaana","gaana","gaana.com",null],
["JOOX","joox","joox.com",null],
["NetEase Music","netease,163music,网易云音乐,网易云","music.163.com",null],
["Amazon","amazon,アマゾン,أمازون,아마존,амазон,亚马逊","amazon.com",null],
["eBay","ebay,イーベイ","ebay.com",null],
["Etsy","etsy","etsy.com","https://etsy.com/shop/{u}"],
["AliExpress","aliexpress,速卖通,알리익스프레스,алиэкспресс","aliexpress.com",null],
["Alibaba","alibaba,阿里巴巴","alibaba.com",null],
["Taobao","taobao,淘宝","taobao.com",null],
["Jumia","jumia","jumia.com",null],
["Konga","konga","konga.com",null],
["Takealot","takealot","takealot.com",null],
["Shopee","shopee","shopee.com",null],
["Lazada","lazada","lazada.com",null],
["Tokopedia","tokopedia","tokopedia.com",null],
["Flipkart","flipkart,फ्लिपकार्ट","flipkart.com",null],
["OLX","olx","olx.com",null],
["Mercado Libre","mercadolibre,mercadolivre,meli","mercadolibre.com",null],
["Temu","temu","temu.com",null],
["SHEIN","shein","shein.com",null],
["Airbnb","airbnb","airbnb.com",null],
["Booking.com","booking,bookingcom","booking.com",null],
["Tripadvisor","tripadvisor","tripadvisor.com",null],
["Yelp","yelp","yelp.com",null],
["Foursquare","foursquare","foursquare.com",null],
["Uber","uber","uber.com",null],
["Bolt","bolt","bolt.eu",null],
["Google Maps","googlemaps,maps","maps.google.com",null],
["Google Business","googlebusiness,googlebusinessprofile,gmb","business.google.com",null],
["Steam","steam","steampowered.com","https://steamcommunity.com/id/{u}"],
["Epic Games","epicgames,epic","epicgames.com",null],
["PlayStation","playstation,psn,ps","playstation.com",null],
["Xbox","xbox","xbox.com",null],
["Nintendo","nintendo","nintendo.com",null],
["Roblox","roblox","roblox.com",null],
["Minecraft","minecraft","minecraft.net",null],
["EA","ea,eaapp,origin","ea.com",null],
["Strava","strava","strava.com",null],
["Fitbit","fitbit","fitbit.com",null],
["Goodreads","goodreads","goodreads.com",null],
["Letterboxd","letterboxd","letterboxd.com","https://letterboxd.com/{u}"],
["IMDb","imdb","imdb.com",null],
["PayPal","paypal,ペイパル,بايبال,пейпал","paypal.com","https://paypal.me/{u}"],
["Cash App","cashapp","cash.app","https://cash.app/${u}"],
["Venmo","venmo","venmo.com","https://venmo.com/u/{u}"],
["Zelle","zelle","zellepay.com",null],
["Wise","wise,transferwise","wise.com",null],
["Payoneer","payoneer","payoneer.com",null],
["Stripe","stripe","stripe.com",null],
["Revolut","revolut","revolut.com","https://revolut.me/{u}"],
["Alipay","alipay,支付宝,アリペイ","alipay.com",null],
["Paytm","paytm,पेटीएम","paytm.com",null],
["PhonePe","phonepe,फोनपे","phonepe.com",null],
["Google Pay","googlepay,gpay","pay.google.com",null],
["Paystack","paystack","paystack.com",null],
["Flutterwave","flutterwave","flutterwave.com",null],
["Western Union","westernunion","westernunion.com",null],
["MoneyGram","moneygram","moneygram.com",null],
["Binance","binance","binance.com",null],
["Coinbase","coinbase","coinbase.com",null],
["M-Pesa","mpesa,mpesaa","",null,"💰"],
["MTN MoMo","mtnmomo,momo,mtnmobilemoney,mtn","",null,"💰"],
["Telecel Cash","telecelcash,vodafonecash,telecel","",null,"💰"],
["AirtelTigo Money","airteltigomoney,airteltigo,airtelmoney","",null,"💰"],
["Mobile Money","mobilemoney,mm,orangemoney,wave","",null,"💰"],
["Gmail","gmail,googlemail,جيميل","gmail.com","mailto:{d}"],
["Outlook","outlook,hotmail","outlook.com","mailto:{d}"],
["Yahoo Mail","yahoo,yahoomail","yahoo.com","mailto:{d}"],
["Proton Mail","protonmail,proton","proton.me","mailto:{d}"],
["iCloud Mail","icloud","icloud.com","mailto:{d}"],
["Zoho Mail","zoho,zohomail","zoho.com","mailto:{d}"],
["Mail.ru","mailru","mail.ru","mailto:{d}"],
["Email","email,mail,emailaddress,courriel,correo,correio,邮箱,电子邮件,メール,البريد,почта,이메일","","mailto:{d}","✉️"],
["Phone","phone,call,mobile,tel,telephone,number,phonenumber,cell,celular,telefono,telefone,telefon,电话,電話,手机,هاتف,جوال,телефон,전화,फोन","","tel:{tel}","📞"],
["Website","website,site,portfolio,web,blog,link,url,webpage,sitio,网站,サイト,موقع,сайт,웹사이트","","{web}","🌐"],
["Address","address,location,office,adresse,direccion,地址,住所,عنوان,адрес,주소","","{map}","📍"],
["Fax","fax,факс,传真","","tel:{tel}","📠"]
];
const P=RAW.map(r=>{const[disp,al,dom,tpl,emo]=r,aliases=al.split(",");
  const keys=[...new Set([norm(disp),...aliases.map(norm)].filter(Boolean))];
  const fn=!tpl?null:tpl==="{web}"?(d=>/^https?:/i.test(d)?d.trim():"https://"+d.trim()):tpl==="{map}"?(d=>"https://www.google.com/maps/search/"+encodeURIComponent(d))
    :(d=>tpl.replace("{u}",()=>encodeURIComponent(h(d))).replace("{n}",()=>dg(d)).replace("{d}",()=>d.trim()).replace("{tel}",()=>d.replace(/[^\d+]/g,"")));
  const p=[disp,aliases,dom||null,fn,emo];p._keys=keys;return p});
const IDX=new Map();P.forEach(p=>p._keys.forEach(k=>{if(!IDX.has(k))IDX.set(k,p)}));
function lev(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){const cur=[i];let mn=i;for(let j=1;j<=b.length;j++){const v=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));cur.push(v);if(v<mn)mn=v}
    if(mn>max)return max+1;prev=cur}return prev[b.length]}
function findPlatform(name){const k=norm(name);if(!k)return null;
  let p=IDX.get(k);if(p)return p;
  if(k.length>=3){p=P.find(q=>q._keys.some(a=>a.length>=3&&a.startsWith(k)));if(p)return p}
  let best=null,bl=0;for(const q of P)for(const a of q._keys)if(a.length>=5&&k.includes(a)&&a.length>bl){best=q;bl=a.length}
  if(best)return best;
  if(k.length>=5){let bp=null,bd=9;for(const q of P)for(const a of q._keys){if(a.length<5)continue;const d=lev(k,a,2);if(d<bd){bd=d;bp=q}}
    if(bp&&bd<=(k.length>=8?2:1))return bp}
  return null}
const displayName=n=>{const p=findPlatform(n);return p?p[0]:String(n||"").trim()};
function hostOf(d){d=String(d||"").trim();if(!d||d.includes("@"))return null;let m=d.match(/^https?:\/\/([^\/\s?#]+)/i);if(!m)m=d.match(/^([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:[\/?#]|$)/i);
  if(!m)return null;const x=m[1].toLowerCase().replace(/^www\./,"");return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(x)?x:null}
/* logo: known platform -> its logo; unknown -> logo of the site in their link; otherwise a letter badge */
function logo(name,size=40,detail){const p=findPlatform(name),t=String(name||"").trim(),l=(t[0]||"?").toUpperCase(),L=/[\p{L}\p{N}]/u.test(l)?l:"•";
  const o=`<span class="logo" style="--s:${size}px">`;
  if(p&&p[4])return o+p[4]+"</span>";
  let dom=p?p[2]:(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(t)?t.toLowerCase():hostOf(detail));
  if(dom)return o+`<img alt="" src="https://www.google.com/s2/favicons?domain=${dom}&sz=128" onerror="this.replaceWith(document.createTextNode(this.dataset.l))" data-l="${esc(L)}"></span>`;
  return o+`<b>${esc(L)}</b></span>`}
function linkFor(name,detail){const d=String(detail||"").trim();if(!d)return null;
  if(/^https?:\/\//i.test(d))return d;
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d))return "mailto:"+d;
  const p=findPlatform(name);if(p&&p[3])return p[3](d);
  if(/^[+\d][\d\s\-()]{6,}$/.test(d))return "tel:"+d.replace(/[^\d+]/g,"");
  if(/^[^\s]+\.[a-z]{2,}(\/\S*)?$/i.test(d))return "https://"+d;
  return null}
function hintFor(name){const p=findPlatform(name);if(!p)return "Username, number or link";
  if(["WhatsApp","Phone","Viber","Signal","Zalo","Fax","M-Pesa","MTN MoMo","Telecel Cash","AirtelTigo Money","Mobile Money","Truecaller","IMO"].includes(p[0]))return "+233 24 000 0000";
  if(p[3]&&p[3].toString().includes("mailto:"))return "you@example.com";
  if(p[0]==="Website")return "www.yoursite.com";
  if(p[0]==="Address")return "Street, area, city";
  return "@username or profile link"}

/* ---------- misc helpers ---------- */
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

/* every contact line a card can show, in display order (each has a stable key) */
function contactLines(card,{platforms=true}={}){const L=[];
  if(card.officePhone)L.push({key:"officePhone",kind:"Office phone",name:"Office phone",value:card.officePhone,href:"tel:"+card.officePhone.replace(/[^\d+]/g,""),icon:"📞"});
  if(card.businessWhatsApp)L.push({key:"businessWhatsApp",kind:"WhatsApp",name:"WhatsApp",value:card.businessWhatsApp,href:"https://wa.me/"+card.businessWhatsApp.replace(/[^\d]/g,""),logoName:"WhatsApp"});
  if(card.website)L.push({key:"website",kind:"Website",name:"Website",value:card.website,href:/^https?:/i.test(card.website)?card.website:"https://"+card.website,icon:"🌐"});
  if(card.address)L.push({key:"address",kind:"Address",name:"Address",value:card.address,href:"https://www.google.com/maps/search/"+encodeURIComponent(card.address),icon:"📍"});
  if(platforms)(card.platforms||[]).forEach(p=>L.push({key:"p:"+p.id,kind:displayName(p.name),name:displayName(p.name),value:p.detail,href:linkFor(p.name,p.detail),logoName:p.name}));
  return L}

/* ---------- card colour themes (user picks a colour + style) ---------- */
function _hsl(hex){let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let H=0,S=0,l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;S=l>.5?d/(2-mx-mn):d/(mx+mn);H=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;H*=60}return[H,S*100,l*100]}
function _hex(H,S,L){H=((H%360)+360)%360;S=Math.max(0,Math.min(100,S))/100;L=Math.max(0,Math.min(100,L))/100;const a=S*Math.min(L,1-L),f=n=>{const k=(n+H/30)%12;return Math.round(255*(L-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,"0")};return"#"+f(0)+f(8)+f(4)}
function _lum(hex){const c=[1,3,5].map(i=>{const v=parseInt(hex.substr(i,2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function cardTheme(card){
  const base={ink:"#ffffff",sub:"rgba(255,255,255,.88)",tile:"#ffffff",tileInk:"#0f3a63",line:"rgba(255,255,255,.35)",accent:"#ffffff",qr:"#0a2a55",bar:false,barColor:"#ffffff"};
  const hex=/^#[0-9a-f]{6}$/i.test((card&&card.color)||"")?card.color.toLowerCase():null,st=(card&&card.cstyle)||"gradient";
  if(!hex)return{...base,bg:["#1d4ed8","#2f7bff","#ff4d9d"]};
  const[H,S,L]=_hsl(hex);
  if(st==="light"){const ink=_hex(H,Math.min(S,70),18);return{...base,bg:["#ffffff",_hex(H,Math.min(S,80),96)],ink,sub:_hex(H,Math.min(S,30),40),tile:_hex(H,Math.min(S,80),92),tileInk:ink,line:_hex(H,Math.min(S,60),85),accent:hex,qr:ink,bar:true,barColor:hex}}
  if(st==="dark"){return{...base,bg:[_hex(H,Math.min(S,60),12),_hex(H,Math.min(S,60),20)],accent:_hex(H,Math.max(S,60),72)}}
  const bg=st==="solid"?[hex,hex]:[_hex(H,S,Math.max(L-14,10)),hex,_hex(H+30,Math.min(100,S+5),Math.min(L+10,72))];
  if(_lum(hex)>.5){const ink="#0f2a4a";return{...base,bg,ink,sub:"rgba(15,42,74,.78)",tileInk:ink,line:"rgba(15,42,74,.25)",accent:ink,bar:true,barColor:ink}}
  return{...base,bg}}

/* ---------- analytics block (user + admin dashboards) ---------- */
function analyticsHtml(hh,opt={}){
  const views=hh.filter(x=>x.type==="view"),clicks=hh.filter(x=>x.type==="click");
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

/* ---------- site navigation + footer (About, How it works, FAQs, Contact) ---------- */
function buildNav(){const n=$("#nav");if(!n)return;const page=location.pathname.split("/").pop()||"index.html";
  const L=[["how-it-works.html","How it works"],["about.html","About"],["faq.html","FAQs"],["contact.html","Contact"]];
  n.innerHTML=L.map(([hh,t])=>`<a href="${hh}" class="${page===hh?"on":""}">${t}</a>`).join("");
  const b=$("#burger");if(b)b.onclick=()=>n.classList.toggle("open")}
function buildFoot(){const f=$("#foot");if(!f)return;
  f.innerHTML=`<nav class="fnav"><a href="./">Home</a><a href="how-it-works.html">How it works</a><a href="about.html">About</a><a href="faq.html">FAQs</a><a href="contact.html">Contact</a></nav>`}
document.addEventListener("DOMContentLoaded",()=>{buildNav();buildFoot()});
