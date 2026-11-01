/* Draws print-ready business cards (3.5 x 2 in @ 300 dpi) and the QR image */
const FONT='"Bricolage Grotesque","Manrope",system-ui,sans-serif',FONT2='"Manrope",system-ui,sans-serif';
const _ic={};
function loadImg(src,cors){const k=(cors?"c:":"n:")+src;return _ic[k]||(_ic[k]=new Promise(res=>{const i=new Image();if(cors)i.crossOrigin="anonymous";i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src}))}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function fit(x,t,w){t=String(t||"");if(x.measureText(t).width<=w)return t;while(t.length>1&&x.measureText(t+"…").width>w)t=t.slice(0,-1);return t+"…"}
function wrap(x,t,w,max){const words=String(t||"").split(/\s+/),lines=[];let cur="";for(const wd of words){const n=cur?cur+" "+wd:wd;if(x.measureText(n).width>w&&cur){lines.push(cur);cur=wd}else cur=n}if(cur)lines.push(cur);return lines.slice(0,max)}
function paintBg(x,th,W,H){const g=x.createLinearGradient(0,0,W,H);th.bg.forEach((c,i)=>g.addColorStop(i/(th.bg.length-1),c));x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle=th.bar?"rgba(37,99,255,.07)":"rgba(255,255,255,.10)";x.beginPath();x.arc(W-60,40,230,0,7);x.fill();
  x.fillStyle=th.bar?"rgba(255,77,157,.08)":"rgba(255,255,255,.07)";x.beginPath();x.arc(120,H+40,190,0,7);x.fill()}
/* Brand logos for the downloadable card. Real logos come from the Simple Icons set on jsDelivr (which allows
   drawing into a canvas). If a logo can't load, a coloured brand badge is drawn instead, so it never looks blank. */
const BRAND={"Instagram":["instagram","E4405F"],"WhatsApp":["whatsapp","25D366"],"Facebook":["facebook","0866FF"],"Messenger":["messenger","0084FF"],"X (Twitter)":["x","000000"],
"TikTok":["tiktok","000000"],"Snapchat":["snapchat","FFFC00"],"LinkedIn":["linkedin","0A66C2"],"Telegram":["telegram","26A5E4"],"YouTube":["youtube","FF0000"],"YouTube Music":["youtubemusic","FF0000"],
"Threads":["threads","000000"],"Pinterest":["pinterest","BD081C"],"Reddit":["reddit","FF4500"],"Tumblr":["tumblr","36465D"],"Medium":["medium","000000"],"Substack":["substack","FF6719"],
"Twitch":["twitch","9146FF"],"Discord":["discord","5865F2"],"Slack":["slack","4A154B"],"Signal":["signal","3A76F0"],"Viber":["viber","7360F2"],"Skype":["skype","00AFF0"],"Zoom":["zoom","0B5CFF"],
"Mastodon":["mastodon","6364FF"],"Bluesky":["bluesky","0285FF"],"LINE":["line","00C300"],"KakaoTalk":["kakaotalk","FFCD00"],"Naver":["naver","03C75A"],"WeChat":["wechat","07C160"],
"Weibo":["sinaweibo","E6162D"],"QQ":["tencentqq","EB1923"],"Bilibili":["bilibili","00A1D6"],"Zhihu":["zhihu","0084FF"],"VK":["vk","0077FF"],"GitHub":["github","181717"],"GitLab":["gitlab","FC6D26"],
"Stack Overflow":["stackoverflow","F58025"],"Kaggle":["kaggle","20BEFF"],"Hugging Face":["huggingface","FFD21E"],"LeetCode":["leetcode","FFA116"],"CodePen":["codepen","000000"],"Figma":["figma","F24E1E"],
"Behance":["behance","1769FF"],"Dribbble":["dribbble","EA4C89"],"ArtStation":["artstation","13AFF0"],"DeviantArt":["deviantart","05CC47"],"Flickr":["flickr","0063DC"],"Vimeo":["vimeo","1AB7EA"],
"Notion":["notion","000000"],"Calendly":["calendly","006BFF"],"WordPress":["wordpress","21759B"],"Blogger":["blogger","FF5722"],"Shopify":["shopify","7AB55C"],"Patreon":["patreon","FF424D"],
"Ko-fi":["kofi","FF6433"],"Buy Me a Coffee":["buymeacoffee","FFDD00"],"Upwork":["upwork","6FDA44"],"Fiverr":["fiverr","1DBF73"],"Spotify":["spotify","1ED760"],"Apple Music":["applemusic","FA243C"],
"SoundCloud":["soundcloud","FF3300"],"Deezer":["deezer","A238FF"],"TIDAL":["tidal","000000"],"Bandcamp":["bandcamp","629AA9"],"Amazon":["amazon","FF9900"],"eBay":["ebay","E53238"],"Etsy":["etsy","F1641E"],
"AliExpress":["aliexpress","FF4747"],"Alibaba":["alibabadotcom","FF6A00"],"Airbnb":["airbnb","FF5A5F"],"Uber":["uber","000000"],"Strava":["strava","FC4C02"],"Steam":["steam","000000"],
"PlayStation":["playstation","003791"],"Xbox":["xbox","107C10"],"Roblox":["roblox","000000"],"PayPal":["paypal","003087"],"Cash App":["cashapp","00C244"],"Venmo":["venmo","3D95CE"],"Stripe":["stripe","635BFF"],
"Gmail":["gmail","EA4335"],"Outlook":["microsoftoutlook","0078D4"],"Proton Mail":["protonmail","6D4AFF"],"Google Maps":["googlemaps","4285F4"]};
const _svg={};
function brandSvg(slug,fill){const k=slug+fill;return _svg[k]||(_svg[k]=(async()=>{try{
  const r=await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@11/icons/${slug}.svg`);if(!r.ok)return null;let t=await r.text();if(!t.includes("<svg"))return null;
  t=t.replace("<svg ",`<svg width="256" height="256" fill="${fill}" `);return await loadImg("data:image/svg+xml;charset=utf-8,"+encodeURIComponent(t),false)}catch(e){return null}})())}
async function iconFor(name,detail){const p=findPlatform(name);if(p&&p[4])return{emoji:p[4]};
  const br=p&&BRAND[p[0]],hex=br?"#"+br[1]:null,bright=hex?_lum(hex)>.5:false;
  if(br){const img=await brandSvg(br[0],bright?"#111111":hex);if(img)return{img,tile:bright?hex:null}}
  const dom=p?p[2]:(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(String(name).trim())?String(name).trim().toLowerCase():hostOf(detail));
  if(dom){const i=await loadImg(`https://www.google.com/s2/favicons?domain=${dom}&sz=128`,true);if(i)return{img:i}}
  const l=(String(name).trim()[0]||"?").toUpperCase(),L=/[\p{L}\p{N}]/u.test(l)?l:"•";
  if(br)return{letter:L,tile:hex,ink:bright?"#111111":"#ffffff"};
  return{letter:L}}
function drawIcon(x,ic,a,b,s,th){x.fillStyle=ic.tile||th.tile;rr(x,a,b,s,s,s*.28);x.fill();
  if(ic.img){const p=s*.2;x.drawImage(ic.img,a+p,b+p,s-2*p,s-2*p)}
  else if(ic.emoji){x.font=`${s*.55}px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif`;x.textAlign="center";x.textBaseline="middle";x.fillStyle="#000";x.fillText(ic.emoji,a+s/2,b+s/2+2);x.textBaseline="alphabetic";x.textAlign="left"}
  else{x.font=`800 ${s*.5}px ${FONT}`;x.textAlign="center";x.textBaseline="middle";x.fillStyle=ic.ink||th.tileInk;x.fillText(ic.letter,a+s/2,b+s/2+2);x.textBaseline="alphabetic";x.textAlign="left"}}
async function footerPill(x,W,H,th,right){const m=await loadImg("logo-mark.png");
  x.fillStyle="rgba(255,255,255,.96)";rr(x,40,H-78,262,56,28);x.fill();
  if(th.bar){x.strokeStyle="#d4e1ff";x.lineWidth=2;x.stroke()}
  let a=58;if(m){const h=40,w=h*m.naturalWidth/m.naturalHeight;x.drawImage(m,a,H-70,w,h);a+=w+10}
  x.fillStyle="#0f3a63";x.font=`800 25px ${FONT}`;x.textAlign="left";x.fillText("R E A C H",a,H-42);
  if(right){x.font=`700 21px ${FONT2}`;x.fillStyle=th.sub;x.textAlign="right";x.fillText(right,W-50,H-42);x.textAlign="left"}}
function mkCanvas(W,H){const c=document.createElement("canvas");c.width=W;c.height=H;return c}
async function fontsReady(){try{await Promise.all([document.fonts.load('800 40px "Bricolage Grotesque"'),document.fonts.load('700 24px "Manrope"')])}catch(e){}}

async function drawFront(card){await fontsReady();
  const th=cardTheme(card),W=1050,H=600,c=mkCanvas(W,H),x=c.getContext("2d");paintBg(x,th,W,H);
  const photo=safeImg(card.photo)?await loadImg(card.photo):null,logoI=safeImg(card.companyLogo)?await loadImg(card.companyLogo):null;
  let tx=60;
  if(photo){x.save();x.beginPath();x.arc(135,121,75,0,7);x.clip();x.drawImage(photo,60,46,150,150);x.restore();x.strokeStyle=th.bar?"#2563ff":"rgba(255,255,255,.8)";x.lineWidth=5;x.beginPath();x.arc(135,121,75,0,7);x.stroke();tx=240}
  const tw=(logoI?W-60-190-30:W-60)-tx;
  x.textAlign="left";x.fillStyle=th.ink;x.font=`800 56px ${FONT}`;x.fillText(fit(x,card.name,tw),tx,100);
  let y=146;x.font=`700 30px ${FONT2}`;x.fillStyle=th.sub;
  const role=card.title||(!card.company?card.bio:"");if(role){x.fillText(fit(x,role,tw),tx,y);y+=42}
  if(card.company){x.font=`800 29px ${FONT}`;x.fillStyle=th.accent;x.fillText(fit(x,card.company,tw),tx,y);y+=40}
  if(!card.title&&card.company&&card.bio&&y<200){x.font=`600 24px ${FONT2}`;x.fillStyle=th.sub;x.fillText(fit(x,card.bio,tw),tx,y)}
  if(logoI){x.fillStyle="#ffffff";rr(x,W-60-190,40,190,190,30);x.fill();if(th.bar){x.strokeStyle="#d4e1ff";x.lineWidth=2;x.stroke()}
    const k=Math.min(160/logoI.width,160/logoI.height),w=logoI.width*k,h=logoI.height*k;x.drawImage(logoI,W-60-190+(190-w)/2,40+(190-h)/2,w,h)}
  x.strokeStyle=th.line;x.lineWidth=2;x.beginPath();x.moveTo(60,252);x.lineTo(W-60,252);x.stroke();
  const all=contactLines(card),items=(Array.isArray(card.frontPick)?all.filter(l=>card.frontPick.includes(l.key)):all).slice(0,8),per=Math.max(1,Math.ceil(items.length/2)),icons=await Promise.all(items.map(i=>iconFor(i.logoName||i.name,i.value)));
  items.forEach((it,i)=>{const col=Math.floor(i/per),row=i%per,a=60+col*490,b=278+row*62,ic=icons[i].emoji||icons[i].img||icons[i].letter?icons[i]:{letter:"•"};
    if(it.icon)ic.emoji=it.icon;drawIcon(x,ic,a,b,46,th);x.fillStyle=th.ink;x.font=`700 26px ${FONT2}`;x.textAlign="left";x.fillText(fit(x,it.value,490-46-26-10),a+60,b+32)});
  if(!items.length){x.fillStyle=th.sub;x.font=`700 26px ${FONT2}`;x.fillText("Scan the QR code on the back to connect.",60,310)}
  await footerPill(x,W,H,th,"Scan the QR on the back");
  if(th.bar){x.fillStyle=th.barColor;x.fillRect(0,H-10,W,10)}
  return c}

function makeQr(url,size=340,ink="#0a2a55"){const d=document.createElement("div");d.style.cssText="position:fixed;left:-9999px;top:0";document.body.appendChild(d);
  new QRCode(d,{text:url,width:size,height:size,colorDark:ink,colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});
  const src=d.querySelector("canvas"),o=mkCanvas(size,size);o.getContext("2d").drawImage(src,0,0,size,size);d.remove();return o}

async function drawBack(card,url){await fontsReady();
  const th=cardTheme(card),W=1050,H=600,c=mkCanvas(W,H),x=c.getContext("2d");paintBg(x,th,W,H);
  x.fillStyle="#fff";rr(x,70,80,390,390,34);x.fill();if(th.bar){x.strokeStyle="#d4e1ff";x.lineWidth=2;x.stroke()}
  x.drawImage(makeQr(url,350,th.qr),90,100,350,350);
  x.textAlign="left";x.fillStyle=th.ink;x.font=`800 54px ${FONT}`;let y=150;
  wrap(x,card.name,470,2).forEach(l=>{x.fillText(l,520,y);y+=62});
  x.font=`700 28px ${FONT2}`;x.fillStyle=th.sub;const role=[card.title,card.company].filter(Boolean).join(" · ");if(role){wrap(x,role,470,2).forEach(l=>{x.fillText(l,520,y);y+=36})}
  y+=24;x.fillStyle=th.accent;x.font=`800 32px ${FONT}`;wrap(x,"Scan to see how you can reach me",460,3).forEach(l=>{x.fillText(l,520,y);y+=42});
  await footerPill(x,W,H,th,"");return c}

async function drawQrCard(card,url){await fontsReady();
  const W=900,H=1160,c=mkCanvas(W,H),x=c.getContext("2d");x.fillStyle="#ffffff";x.fillRect(0,0,W,H);
  const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,"#1d4ed8");g.addColorStop(.5,"#2f7bff");g.addColorStop(1,"#ff4d9d");x.fillStyle=g;x.fillRect(0,0,W,16);x.fillRect(0,H-16,W,16);
  x.textAlign="center";x.fillStyle="#0f3a63";x.font=`800 64px ${FONT}`;let y=130;
  wrap(x,card.name,780,2).forEach(l=>{x.fillText(l,W/2,y);y+=72});
  const role=[card.title,card.company].filter(Boolean).join(" · ");if(role){x.font=`700 30px ${FONT2}`;x.fillStyle="#5a6a98";x.fillText(fit(x,role,780),W/2,y-4);y+=42}
  const top=Math.max(y+10,230),S=600;x.fillStyle=g;rr(x,(W-S-40)/2,top,S+40,S+40,44);x.fill();x.fillStyle="#fff";rr(x,(W-S-40)/2+10,top+10,S+20,S+20,36);x.fill();
  x.drawImage(makeQr(url,S,"#0a2a55"),(W-S)/2,top+20,S,S);
  const cy=top+S+110;x.fillStyle="#0f3a63";x.font=`800 38px ${FONT}`;x.fillText("Scan to see how you can reach me",W/2,cy);
  const m=await loadImg("logo-mark.png");x.font=`800 40px ${FONT}`;const t="R E A C H",tw=x.measureText(t).width,h=62,w=m?h*m.naturalWidth/m.naturalHeight:0,sx=(W-(w+14+tw))/2,by=Math.min(cy+60,H-110);
  if(m)x.drawImage(m,sx,by,w,h);x.textAlign="left";x.fillStyle="#0f3a63";x.fillText(t,sx+w+14,by+46);return c}

function downloadCanvas(c,name){c.toBlob(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)},"image/png")}
