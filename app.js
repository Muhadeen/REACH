let db,auth,user,udata,cards=[],cur=null,hits=null,mode="signup",pendingName="",signingUp=false,editing=null,fails=0,side="front",tab="links",newType="personal",rating=0,prTok=0;
const C=()=>cards.find(c=>c.id===cur)||cards[0];
const TYPE_ICON={personal:"🙂",business:"💼",other:"✨"};

/* ---------- landing decoration ---------- */
$("#m1").innerHTML=logo("Instagram",34)+"<div>Instagram<small>@ama.shoots</small></div>";
$("#m2").innerHTML=logo("WhatsApp",34)+"<div>WhatsApp<small>+233 24 000 0000</small></div>";
$("#m3").innerHTML=logo("LinkedIn",34)+"<div>LinkedIn<small>in/amamensah</small></div>";
["TikTok","Snapchat","YouTube","Telegram"].forEach((n,i)=>$("#f"+(i+1)).innerHTML=logo(n,58));
$("#fakeqr").innerHTML=Array.from({length:81},(_,i)=>{const r=Math.floor(i/9),c=i%9,corner=(r<3&&c<3)||(r<3&&c>5)||(r>5&&c<3);return `<i class="${corner||Math.random()>.52?"on":""}"></i>`}).join("");
$("#toTop").onclick=()=>{scrollTo({top:0,behavior:"smooth"});setTimeout(()=>$("#aName").focus(),500)};
$("#plist").innerHTML=P.map(p=>`<option value="${esc(p[0])}">`).join("");
$("#pLogo").innerHTML=logo("",56);
const QUICK=["Instagram","WhatsApp","Facebook","TikTok","Snapchat","LinkedIn","X","YouTube","Telegram","Phone","Email","Website"];
$("#quick").innerHTML=QUICK.map(n=>`<button type="button" class="q" data-n="${n}">${logo(n,50)}<span>${esc(displayName(n))}</span></button>`).join("");

function show(v){["boot","auth","landing","app"].forEach(x=>$("#"+x).classList.toggle("hide",x!==v&&!(x==="landing"&&v==="auth")));
  $("#logout").classList.toggle("hide",v!=="app");$("#fbTop").classList.toggle("hide",v!=="app")}

(async()=>{
  try{const f=await fb();db=f.db;auth=f.auth;await loadJs(QR_URL);await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{})}
  catch(e){$("#boot").innerHTML='<p class="err" style="text-align:center;margin-top:60px">Could not load. Check your internet and refresh.</p>';return}
  auth.onAuthStateChanged(onUser);
})();

/* ---------- account + data ---------- */
async function ensureUser(u,name){
  const ref=db.collection("users").doc(u.uid);let s=await ref.get();
  if(!s.exists){const n=name||u.displayName||(u.email||"").split("@")[0];await ref.set({name:n,createdAt:ts()});s=await ref.get()}
  udata=s.data();
  await db.collection("private").doc(u.uid).set({email:u.email,name:udata.name,createdAt:udata.createdAt||ts()},{merge:true});
}
async function loadCards(){
  const s=await db.collection("cards").where("owner","==",user.uid).get();
  cards=s.docs.map(d=>({id:d.id,...d.data()}));
  if(!cards.length){ // first card (also migrates an older single-card account)
    const c={owner:user.uid,type:"personal",label:"Personal",name:udata.name||"My name",title:"",bio:udata.bio||"",photo:udata.photo||"",platforms:udata.platforms||[],company:"",companyLogo:"",address:"",website:"",officePhone:"",businessWhatsApp:"",createdAt:ts(),updatedAt:ts()};
    await db.collection("cards").doc(user.uid).set(c);cards=[{id:user.uid,...c,createdAt:Date.now()}];
  }
  cards.sort((a,b)=>ms(a.createdAt)-ms(b.createdAt));resolveLogos(cards);
  if(!cur||!cards.some(c=>c.id===cur))cur=(cards.find(c=>!c.team)||cards[0]).id;
}
async function onUser(u){
  if(signingUp)return;
  if(!u){user=null;cards=[];hits=null;show("auth");return}
  user=u;
  try{await ensureUser(u,pendingName);await loadCards();renderAll();show("app");refreshInbox(true)}
  catch(e){console.error(e);show("auth");$("#authErr").className="err";$("#authErr").textContent="Signed in, but your card couldn't load. The database rules may not be published yet."}
}

/* ---------- sign up / log in ---------- */
function setMode(m){mode=m;$("#tSign").classList.toggle("on",m==="signup");$("#tLog").classList.toggle("on",m==="login");
  $("#nameBox").classList.toggle("hide",m!=="signup");$("#forgot").classList.toggle("hide",m!=="login");
  $("#authBtn").textContent=m==="signup"?"Create my card":"Log in";$("#aPw").autocomplete=m==="signup"?"new-password":"current-password";$("#authErr").textContent="";$("#authErr").className="err"}
$("#tSign").onclick=()=>setMode("signup");$("#tLog").onclick=()=>setMode("login");
$("#showPw").onclick=()=>{const i=$("#aPw"),s=i.type==="password";i.type=s?"text":"password";$("#showPw").textContent=s?"Hide":"Show"};
$("#authForm").onsubmit=async e=>{e.preventDefault();
  const name=$("#aName").value.trim(),email=$("#aEmail").value.trim().toLowerCase(),pw=$("#aPw").value,err=$("#authErr");err.className="err";err.textContent="";
  if(mode==="signup"&&!name)return err.textContent="Please enter your name.";
  if(!email)return err.textContent="Please enter your email.";
  if(!pw)return err.textContent="Please enter your password.";
  if(mode==="signup"&&pw.length<6)return err.textContent="Password must be at least 6 characters.";
  $("#authBtn").disabled=true;
  try{
    if(mode==="signup"){
      signingUp=true;
      const cred=await auth.createUserWithEmailAndPassword(email,pw);
      try{await ensureUser(cred.user,name)}catch(x){console.error(x)}
      await auth.signOut();signingUp=false;
      setMode("login");$("#aEmail").value=email;$("#aPw").value="";
      err.className="err ok";err.textContent="🎉 Account created! Now log in to continue.";
      $("#aPw").focus();
    }else await auth.signInWithEmailAndPassword(email,pw);
  }catch(x){signingUp=false;fails++;err.className="err";err.textContent=authMsg(x.code)+(mode==="login"&&fails>=3?" Forgot it? Tap “Forgot password?” below.":"");
    const b=$("#signbox");b.classList.remove("shake");void b.offsetWidth;b.classList.add("shake")}
  $("#authBtn").disabled=false};
$("#forgot").onclick=async()=>{const email=$("#aEmail").value.trim().toLowerCase(),err=$("#authErr");
  if(!email){err.className="err";return err.textContent="Type your email above first, then tap Forgot password."}
  try{await auth.sendPasswordResetEmail(email);err.className="err ok";err.textContent="If that email has an account, a reset link is on its way. It can take a few minutes, so check spam or junk too."}
  catch(x){err.className="err";err.textContent=x.code==="auth/invalid-email"?authMsg(x.code):x.code==="auth/too-many-requests"?"Too many requests. Please wait a few minutes.":"Couldn't send the email right now. Please try again."}};
$("#logout").onclick=()=>auth.signOut();

/* ---------- render ---------- */
function setAv(el,photo,name){el.innerHTML=safeImg(photo)?`<img src="${photo}" alt="">`:esc((name||"?")[0].toUpperCase())}
function renderAll(o={}){
  const c=C();
  setAv($("#avatar"),c.photo,c.name);$("#hiName").textContent="Hi, "+String(udata.name||c.name).split(" ")[0]+" 👋";
  $("#hiBio").textContent=cards.length>1?"Editing: "+(c.label||"Card"):(c.title||c.bio||"Add the ways people can reach you.");
  const own=cards.filter(k=>!k.team),teamN=cards.length-own.length,shown=own.concat(c.team?[c]:[]);
  $("#cardbar").innerHTML=shown.map(k=>`<button class="cp ${k.id===c.id?"on":""}" data-id="${k.id}">${k.team?"👥":TYPE_ICON[k.type]||"🙂"} ${esc(k.label||"Card")}</button>`).join("")+`<button class="cp" id="teamBtn">👥 Team (${teamN})</button><button class="cp add" id="newCardBtn">＋ New card</button>`;
  renderList();o.keepForm?renderDetailImages():renderDetails();renderShare();
  if(tab==="print")renderPrint();if(tab==="stats")renderStats();if(tab==="offer")renderOffer();
}
$("#cardbar").onclick=e=>{const b=e.target.closest("button");if(!b)return;if(b.id==="newCardBtn")return openNew();if(b.id==="teamBtn")return setTab("team");cur=b.dataset.id;editing=null;renderAll()};

function renderList(){const pl=C().platforms||[];$("#count").textContent=pl.length;
  $("#list").innerHTML=pl.length?pl.map(p=>p.id===editing?
   `<div class="row edit" data-id="${p.id}">${logo(p.name,44,p.detail)}<input data-f="name" value="${esc(p.name)}" list="plist"><input data-f="detail" value="${esc(p.detail)}"><button class="ic" data-act="save" title="Save">✓</button><button class="ic" data-act="cancel" title="Cancel">✕</button></div>`:
   `<div class="row" data-id="${p.id}">${logo(p.name,44,p.detail)}<div class="rt"><b>${esc(displayName(p.name))}</b><span>${esc(p.detail)}</span></div><div class="ra"><button class="ic" data-act="edit" title="Edit">✎</button><button class="ic danger" data-act="del" title="Delete">🗑</button></div></div>`
  ).join(""):'<div class="empty">Nothing here yet.<br>Add your first platform above 👆</div>'}

async function saveCard(patch,msg,o){const c=C();Object.assign(c,patch);
  try{await db.collection("cards").doc(c.id).update({...patch,updatedAt:ts()});toast(msg||"Saved ✓")}catch(e){console.error(e);toast("Couldn't save. Check your connection.")}
  renderAll(o)}

/* tabs */
$("#tabs").onclick=e=>{const b=e.target.closest("button");if(!b)return;setTab(b.dataset.t)};
function setTab(t){tab=t;$$("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.t===t));["links","details","offer","team","print","orders","inbox","stats"].forEach(k=>$("#pane-"+k).classList.toggle("hide",k!==t));
  if(t==="print")renderPrint();if(t==="orders")renderOrders();if(t==="stats")renderStats();if(t==="offer")renderOffer();if(t==="team")renderTeam();if(t==="inbox")refreshInbox()}

/* ---------- platforms ---------- */
$("#quick").onclick=e=>{const b=e.target.closest(".q");if(!b)return;$("#pName").value=displayName(b.dataset.n);$("#pName").oninput();$("#pDet").focus()};
$("#pName").oninput=()=>{const v=$("#pName").value;$("#pLogo").innerHTML=logo(v,56);$("#pDet").placeholder=v.trim()?hintFor(v):"@username or number";$$("#quick .q").forEach(q=>q.classList.toggle("on",!!v.trim()&&displayName(q.dataset.n)===displayName(v)))};
$("#addForm").onsubmit=async e=>{e.preventDefault();
  const name=$("#pName").value.trim(),detail=$("#pDet").value.trim(),err=$("#addErr");err.textContent="";
  if(!name)return err.textContent="Type a platform name, like Instagram.";
  if(!detail)return err.textContent="Add your username, number or link.";
  const pl=[...(C().platforms||[]),{id:Math.random().toString(36).slice(2,10),name:displayName(name),detail}];
  $("#pName").value="";$("#pDet").value="";$("#pName").oninput();
  await saveCard({platforms:pl},"Added ✓")};
$("#list").onclick=async e=>{const b=e.target.closest("[data-act]");if(!b)return;
  const row=b.closest(".row"),id=row.dataset.id,pl=[...(C().platforms||[])],i=pl.findIndex(p=>p.id===id),act=b.dataset.act;
  if(act==="edit"){editing=id;renderList()}
  else if(act==="cancel"){editing=null;renderList()}
  else if(act==="save"){const name=$('[data-f="name"]',row).value.trim(),detail=$('[data-f="detail"]',row).value.trim();
    if(!name||!detail)return toast("Both fields are needed");pl[i]={...pl[i],name:displayName(name),detail};editing=null;await saveCard({platforms:pl})}
  else if(act==="del"){if(!confirm("Delete "+displayName(pl[i].name)+"?"))return;pl.splice(i,1);await saveCard({platforms:pl},"Deleted")}};

/* ---------- details / photo / logo ---------- */
function renderDetails(){const c=C();
  $("#dLabel").value=c.label||"";$("#dType").value=c.type||"personal";$("#dName").value=c.name||"";$("#dTitle").value=c.title||"";$("#dBio").value=c.bio||"";$("#dAbout").value=c.about||"";$("#aboutCount").textContent=($("#dAbout").value.length)+" / 800";
  $("#dCompany").value=c.company||"";$("#dAddress").value=c.address||"";$("#dWeb").value=c.website||"";$("#dPhone").value=c.officePhone||"";$("#dWa").value=c.businessWhatsApp||"";
  $("#bizBox").classList.toggle("hide",($("#dType").value)==="personal");
  renderDetailImages()}
function renderDetailImages(){const c=C();
  setAv($("#pav"),c.photo,c.name);$("#rmPhoto").classList.toggle("hide",!safeImg(c.photo));
  $("#lav").innerHTML=safeImg(c.companyLogo)?`<img src="${c.companyLogo}" alt="">`:"🏢";$("#rmLogo").classList.toggle("hide",!safeImg(c.companyLogo));
  $("#delCard").classList.toggle("hide",cards.length<2)}
$("#dType").onchange=()=>$("#bizBox").classList.toggle("hide",$("#dType").value==="personal");
$("#saveDet").onclick=()=>{const name=$("#dName").value.trim();if(!name)return toast("Name on card can't be empty");
  saveCard({label:$("#dLabel").value.trim()||"Card",type:$("#dType").value,name,title:$("#dTitle").value.trim(),bio:$("#dBio").value.trim(),about:$("#dAbout").value.trim(),
    company:$("#dCompany").value.trim(),address:$("#dAddress").value.trim(),website:$("#dWeb").value.trim(),officePhone:$("#dPhone").value.trim(),businessWhatsApp:$("#dWa").value.trim()},"Details saved ✓")};
async function pickImage(input,opts,field){const f=input.files[0];input.value="";if(!f)return;
  try{const d=await imgToDataUrl(f,opts);if(d.length>420000)return toast("That image is too large. Try a smaller one.");await saveCard({[field]:d},"Saved ✓",{keepForm:true})}
  catch(e){toast("Couldn't read that image. Use a JPG or PNG.")}}
$("#upBtn").onclick=()=>$("#photoIn").click();$("#avatar").onclick=()=>{setTab("details");$("#photoIn").click()};
$("#photoIn").onchange=()=>pickImage($("#photoIn"),{max:320,square:true,q:.8},"photo");
$("#rmPhoto").onclick=()=>saveCard({photo:""},"Photo removed",{keepForm:true});
$("#logoBtn").onclick=()=>$("#logoIn").click();$("#logoIn").onchange=()=>pickImage($("#logoIn"),{max:360,square:false,png:true},"companyLogo");
$("#rmLogo").onclick=()=>saveCard({companyLogo:""},"Logo removed",{keepForm:true});

$("#delCard").onclick=async()=>{if(cards.length<2)return toast("You need at least one card.");const c=C();
  if(!confirm("Delete the card “"+(c.label||c.name)+"”? Its QR code will stop working."))return;
  try{await db.collection("cards").doc(c.id).delete();cards=cards.filter(k=>k.id!==c.id);cur=(cards.find(k=>!k.team)||cards[0]).id;hits=null;renderAll();toast("Card deleted")}catch(e){toast("Couldn't delete")}};

/* new card */
function openNew(){newType="personal";$$("#types button").forEach(b=>b.classList.toggle("on",b.dataset.t==="personal"));$("#nLabel").value="";$("#mNew").classList.remove("hide");$("#nLabel").focus()}
$("#types").onclick=e=>{const b=e.target.closest("button");if(!b)return;newType=b.dataset.t;$$("#types button").forEach(x=>x.classList.toggle("on",x===b))};
$("#nCancel").onclick=()=>$("#mNew").classList.add("hide");
$("#nCreate").onclick=async()=>{const base=C(),label=$("#nLabel").value.trim()||({personal:"Personal",business:"Business",other:"Card"}[newType]);
  const ref=db.collection("cards").doc(),card={owner:user.uid,type:newType,label,name:base.name,title:"",bio:"",photo:base.photo||"",platforms:[],company:"",companyLogo:"",address:"",website:"",officePhone:"",businessWhatsApp:""};
  $("#nCreate").disabled=true;
  try{await ref.set({...card,createdAt:ts(),updatedAt:ts()});cards.push({id:ref.id,...card,createdAt:Date.now()});cur=ref.id;$("#mNew").classList.add("hide");editing=null;
    setTab(newType==="personal"?"links":"details");renderAll();toast("New card created ✓")}
  catch(e){console.error(e);toast("Couldn't create the card")}
  $("#nCreate").disabled=false};

/* ---------- share + QR ---------- */
function renderShare(){const c=C(),link=cardUrl(c.id);$("#cardLink").value=link;$("#openCard").href=link;
  const q=$("#qr");q.innerHTML="";new QRCode(q,{text:cardUrl(c.id,"qr"),width:230,height:230,colorDark:"#0a2a55",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});
  if(navigator.share)$("#shareBtn").classList.remove("hide")}
$("#copyBtn").onclick=async()=>{try{await navigator.clipboard.writeText($("#cardLink").value)}catch(e){$("#cardLink").select();document.execCommand("copy")}toast("Link copied ✓")};
$("#shareBtn").onclick=()=>navigator.share({title:C().name+" on REACH",text:"My contact card",url:$("#cardLink").value}).catch(()=>{});
$("#dlQr").onclick=async()=>{const c=C();try{downloadCanvas(await drawQrCard(c,cardUrl(c.id,"qr")),safeName(c.name)+"-QR-REACH.png")}catch(e){console.error(e);toast("Couldn't create the image")}};

/* ---------- printable business card ---------- */
const PALETTE=["#2563ff","#0ea5e9","#0d9488","#16a34a","#d97706","#ea580c","#dc2626","#ec4899","#7c3aed","#0f3a63","#111827","#b45309"];
const frontSel=c=>Array.isArray(c.frontPick)?c.frontPick:contactLines(c).slice(0,8).map(l=>l.key);
function renderPrintControls(){const c=C(),custom=c.color&&!PALETTE.includes(c.color);
  $("#swatches").innerHTML=`<button type="button" class="sw ${!c.color?"on":""}" data-c="" title="Blue &amp; pink" style="background:linear-gradient(120deg,#1d4ed8,#ff4d9d)"></button>`+PALETTE.map(k=>`<button type="button" class="sw ${c.color===k?"on":""}" data-c="${k}" style="background:${k}" title="${k}"></button>`).join("")+
    `<label class="sw custom ${custom?"on":""}" title="Pick any colour">＋<input type="color" id="cCustom" value="${c.color||"#2563ff"}"></label>`;
  $$("#styles button").forEach(b=>b.classList.toggle("on",b.dataset.s===(c.cstyle||"gradient")));
  const lines=contactLines(c),pick=frontSel(c).filter(k=>lines.some(l=>l.key===k));
  $("#frontCount").textContent=pick.length+" / 8";
  $("#frontList").innerHTML=lines.length?lines.map(l=>`<label class="chk ${pick.includes(l.key)?"on":""}"><input type="checkbox" data-k="${esc(l.key)}" ${pick.includes(l.key)?"checked":""}>${l.icon?`<span class="logo" style="--s:26px">${l.icon}</span>`:logo(l.logoName||l.name,26,l.value)}<span class="t"><b>${esc(l.name)}</b> · ${esc(l.value)}</span></label>`).join(""):'<p class="hint">Add platforms or business details first, then choose what shows here.</p>'}
$("#swatches").onclick=e=>{const b=e.target.closest("button.sw");if(b)saveCard({color:b.dataset.c},"Colour saved ✓")};
$("#swatches").addEventListener("change",e=>{if(e.target.id==="cCustom")saveCard({color:e.target.value},"Colour saved ✓")});
$("#styles").onclick=e=>{const b=e.target.closest("button");if(b)saveCard({cstyle:b.dataset.s},"Style saved ✓")};
$("#frontList").onchange=e=>{const k=e.target.dataset.k;if(!k)return;const c=C(),lines=contactLines(c);let pick=frontSel(c).filter(x=>lines.some(l=>l.key===x));
  if(e.target.checked){if(pick.length>=8){e.target.checked=false;return toast("Up to 8 items fit on the front")}pick.push(k)}else pick=pick.filter(x=>x!==k);
  saveCard({frontPick:lines.map(l=>l.key).filter(x=>pick.includes(x))},"Front updated ✓")};
$("#fAll").onclick=()=>saveCard({frontPick:contactLines(C()).slice(0,8).map(l=>l.key)},"Front updated ✓");
$("#fNone").onclick=()=>saveCard({frontPick:[]},"Front cleared");
$("#sides").onclick=e=>{const b=e.target.closest("button");if(!b)return;side=b.dataset.s;$$("#sides button").forEach(x=>x.classList.toggle("on",x===b));renderPrint()};
let ordersAt=0;
async function freshOrders(){if(Date.now()-ordersAt>15000){try{await loadOrders();ordersAt=Date.now()}catch(e){}}}
const isPaidCard=c=>orders.some(o=>o.kind!=="plan"&&o.cardId===c.id&&["approved","printing","delivered"].includes(o.status));
async function cardCanvas(s){const c=C();await freshOrders();const wm=!isPaidCard(c);return s==="front"?drawFront(c,{watermark:wm}):drawBack(c,cardUrl(c.id,"qr"),{watermark:wm})}
function wmNote(){const c=C();$("#wmNote").className="note "+(isPaidCard(c)?"good":"info");$("#wmNote").innerHTML=isPaidCard(c)?"✅ Watermark removed. Your printed card order for this card was approved, so your downloads are clean.":"🔒 Downloads carry a REACH watermark until your printed card order is paid and approved. <a href=\"#\" id=\"wmGo\" style=\"font-weight:800;color:inherit;text-decoration:underline\">Order printed cards</a>"}
async function renderPrint(){renderPrintControls();const t=++prTok;try{const cv=await cardCanvas(side);if(t!==prTok)return;wmNote();const p=$("#bcPrev");p.getContext("2d").clearRect(0,0,1050,600);p.getContext("2d").drawImage(cv,0,0)}catch(e){console.error(e)}}
$("#wmNote").addEventListener("click",e=>{if(e.target.id==="wmGo"){e.preventDefault();setTab("orders")}});
$("#dlFront").onclick=async()=>{try{downloadCanvas(await cardCanvas("front"),safeName(C().name)+"-Business-Card-Front.png")}catch(e){toast("Couldn't create the card")}};
$("#dlBack").onclick=async()=>{try{downloadCanvas(await cardCanvas("back"),safeName(C().name)+"-Business-Card-Back.png")}catch(e){toast("Couldn't create the card")}};

/* ---------- analytics ---------- */
async function loadHits(force){if(hits&&!force)return;
  const s=await db.collection("hits").where("owner","==",user.uid).get();hits=s.docs.map(d=>{const v=d.data();return{...v,ts:ms(v.ts)||Date.now()}})}
async function renderStats(force){
  const sel=$("#aSel"),keep=sel.value;sel.innerHTML='<option value="all">All my cards</option>'+cards.map(c=>`<option value="${c.id}">${esc(c.label||c.name)}</option>`).join("");sel.value=cards.some(c=>c.id===keep)||keep==="all"?keep||"all":"all";
  $("#aBody").innerHTML='<div class="spin" style="margin:30px auto"></div>';
  try{await loadHits(force);const v=sel.value,h=v==="all"?hits:hits.filter(x=>x.card===v);$("#aBody").innerHTML=analyticsHtml(h)}
  catch(e){console.error(e);$("#aBody").innerHTML='<div class="empty">Couldn\'t load analytics. The database rules may need updating.</div>'}}
$("#aSel").onchange=()=>renderStats();$("#aRef").onclick=()=>renderStats(true);

/* ---------- feedback ---------- */
function openFb(){rating=0;$$("#stars button").forEach(b=>b.classList.remove("on"));$("#fMsg").value="";$("#fErr").textContent="";
  $("#fName").value=user?(udata&&udata.name)||"":"";$("#fEmail").value=user?user.email||"":"";$("#mFb").classList.remove("hide")}
$("#fbTop").onclick=openFb;$("#fbLink").onclick=openFb;$("#fCancel").onclick=()=>$("#mFb").classList.add("hide");
$("#stars").onclick=e=>{const b=e.target.closest("button");if(!b)return;rating=+b.dataset.n;$$("#stars button").forEach(x=>x.classList.toggle("on",+x.dataset.n<=rating))};
$("#fSend").onclick=async()=>{const msg=$("#fMsg").value.trim();if(!msg)return $("#fErr").textContent="Please write a short message.";
  $("#fSend").disabled=true;
  try{await db.collection("feedback").add({name:$("#fName").value.trim(),email:$("#fEmail").value.trim(),rating,message:msg,from:user?"app":"site",ts:ts()});$("#mFb").classList.add("hide");toast("Thank you for your feedback 💙")}
  catch(e){console.error(e);$("#fErr").textContent="Couldn't send. Please try again."}
  $("#fSend").disabled=false};
$$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.add("hide")}));

/* ---------- delete account ---------- */
$("#delAcc").onclick=async()=>{
  if(!confirm("Delete ALL your cards and your account permanently? This cannot be undone."))return;
  const pw=prompt("Enter your password to confirm:");if(!pw)return;
  try{
    await user.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email,pw));
    for(const c of cards)await db.collection("cards").doc(c.id).delete();
    await db.collection("users").doc(user.uid).delete();await db.collection("private").doc(user.uid).delete();await user.delete();toast("Account deleted");
  }catch(e){toast(e.code==="auth/invalid-credential"||e.code==="auth/wrong-password"?"Wrong password. Nothing was deleted.":"Couldn't delete. Try again.")}};

$("#dAbout").addEventListener("input",()=>$("#aboutCount").textContent=$("#dAbout").value.length+" / 800");

/* ---------- printed card orders ---------- */
let settings=null,orders=[],oQty=0,oMethod="delivery",proofs={};
async function loadOrders(){const s=await db.collection("orders").where("owner","==",user.uid).get();
  orders=s.docs.map(d=>({id:d.id,...d.data(),createdAt:ms(d.data().createdAt)})).sort((a,b)=>b.createdAt-a.createdAt)}
async function renderOrders(force){
  try{if(!settings||force)settings=await getSettings(db);await loadOrders()}
  catch(e){console.error(e);$("#ordList").innerHTML='<div class="empty">Couldn\'t load orders. The database rules may need updating.</div>';return}
  const open=settings.ordersOpen!==false;$("#ordPaused").classList.toggle("hide",open);$("#ordForm").classList.toggle("hide",!open);
  const sel=$("#oCard"),keep=sel.value;const opts=cards.filter(c=>!c.team||c.id===cur);sel.innerHTML=opts.map(c=>`<option value="${c.id}">${esc(c.label||c.name)} · ${esc(c.name)}</option>`).join("");sel.value=opts.some(c=>c.id===keep)?keep:C().id;
  if(!$("#oName").value)$("#oName").value=C().name||"";
  const tiers=[...(settings.tiers||[])].sort((a,b)=>a.qty-b.qty);
  $("#oQty").innerHTML=tiers.map(t=>`<button type="button" class="cp ${+oQty===+t.qty?"on":""}" data-q="${t.qty}">${t.qty} cards · ${money(t.price,settings.currency)}</button>`).join("");
  $("#oPickNote").textContent=settings.pickupNote||"";
  applyMethod();renderOrderSummary();drawOrderPreview();renderOrderList()}
async function drawOrderPreview(){const card=cards.find(c=>c.id===$("#oCard").value)||C();try{const cv=await drawFront(card,{watermark:true}),p=$("#oPrev").getContext("2d");p.clearRect(0,0,1050,600);p.drawImage(cv,0,0)}catch(e){}}
$("#oCard").onchange=drawOrderPreview;
function applyMethod(){$$("#oMethod button").forEach(b=>b.classList.toggle("on",b.dataset.m===oMethod));$("#oLoc").classList.toggle("hide",oMethod==="pickup");$("#oPickNote").classList.toggle("hide",oMethod!=="pickup"||!settings.pickupNote)}
$("#oMethod").onclick=e=>{const b=e.target.closest("button");if(!b)return;oMethod=b.dataset.m;applyMethod();renderOrderSummary()};
$("#oQty").onclick=e=>{const b=e.target.closest("button");if(!b)return;oQty=+b.dataset.q;$("#oQtyIn").value="";$$("#oQty .cp").forEach(x=>x.classList.toggle("on",x===b));renderOrderSummary()};
$("#oQtyIn").oninput=()=>{oQty=parseInt($("#oQtyIn").value,10)||0;$$("#oQty .cp").forEach(x=>x.classList.toggle("on",+x.dataset.q===oQty));renderOrderSummary()};
function renderOrderSummary(){const q=+oQty,cur=settings.currency,box=$("#oSum");
  if(!q){box.innerHTML="Choose how many cards you would like.";return}
  const pr=priceFor(settings,q,oMethod);
  if(!pr){box.innerHTML=`<div class="row2"><span>${q} cards</span><span>Price to be confirmed</span></div><p class="hint" style="margin:6px 0 0">We will set your total after you place the order, and you will see it here.</p>`;return}
  box.innerHTML=`<div class="row2"><span>${q} cards</span><span>${money(pr.cards,cur)}</span></div>`+(oMethod==="delivery"?`<div class="row2"><span>Delivery</span><span>${pr.fee?money(pr.fee,cur):"Free"}</span></div>`:"")+`<div class="row2 tot"><span>Total</span><span>${money(pr.total,cur)}</span></div>`}

$("#ordForm").onsubmit=async e=>{e.preventDefault();const err=$("#oErr");err.textContent="";
  const q=parseInt(oQty,10),name=$("#oName").value.trim(),phone=$("#oPhone").value.trim();
  if(!(q>=1&&q<=100000))return err.textContent="Choose or type how many cards you want.";
  if(!name)return err.textContent="Please enter your full name.";
  if(phone.replace(/[^\d]/g,"").length<9)return err.textContent="Please enter a phone number we can reach.";
  let loc={region:"",city:"",address:""};
  if(oMethod==="delivery"){loc={region:$("#oRegion").value.trim(),city:$("#oCity").value.trim(),address:$("#oAddr").value.trim()};if(!loc.region||!loc.city||!loc.address)return err.textContent="Please fill in your delivery region, city and address."}
  const card=cards.find(c=>c.id===$("#oCard").value)||C(),pr=priceFor(settings,q,oMethod);$("#oBtn").disabled=true;
  try{
    const ref=orderRef(),doc=db.collection("orders").doc();
    await doc.set({owner:user.uid,cardId:card.id,cardName:card.name,label:card.label||"",qty:q,method:oMethod,customer:{name,phone,email:user.email||""},location:loc,notes:$("#oNotes").value.trim(),
      amount:pr?pr.total:null,currency:settings.currency||"GHS",deliveryFee:pr?pr.fee:0,status:pr?"awaiting_payment":"awaiting_price",ref,createdAt:ts(),updatedAt:ts()});
    try{const f=await drawFront(card),b=await drawBack(card,cardUrl(card.id,"qr"));let fr=f.toDataURL("image/jpeg",.92),bk=b.toDataURL("image/jpeg",.92);
      if(dataUrlKB(fr)+dataUrlKB(bk)>600){fr=f.toDataURL("image/jpeg",.8);bk=b.toDataURL("image/jpeg",.8)}
      await db.collection("printFiles").doc(doc.id).set({owner:user.uid,front:fr,back:bk})}catch(x){console.error("print files",x)}
    toast("Order placed ✓ Now pay and upload your receipt");oQty=0;$("#oQtyIn").value="";$("#oNotes").value="";
    await renderOrders();$("#ordList").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(x){console.error(x);err.textContent="Couldn't place your order. Please try again."}
  $("#oBtn").disabled=false};

function acctRows(){const b=settings.bank||{},rows=[];
  if(b.accountNumber)rows.push(`<div class="acct"><div><small>Bank transfer</small><b>${esc(b.bankName||"Bank")}${b.branch?" · "+esc(b.branch):""}</b><br><b>${esc(b.accountNumber)}</b>${b.accountName?"<br><small>"+esc(b.accountName)+"</small>":""}</div><button class="btn ghost sm" data-copy="${esc(b.accountNumber)}" type="button">Copy</button></div>`);
  (settings.momo||[]).filter(m=>m.number).forEach(m=>rows.push(`<div class="acct"><div><small>Mobile money · ${esc(m.network||"")}</small><b>${esc(m.number)}</b>${m.name?"<br><small>"+esc(m.name)+"</small>":""}</div><button class="btn ghost sm" data-copy="${esc(m.number)}" type="button">Copy</button></div>`));
  return rows.join("")||'<p class="hint">Payment details will appear here.</p>'}
function payBox(o){return `<div class="paybox"><h3>Pay ${money(o.amount,o.currency)}</h3>
  <p class="hint" style="margin:0">Use this reference as the payment note: <b>${esc(o.ref)}</b> <button class="btn ghost sm" data-copy="${esc(o.ref)}" type="button">Copy</button></p>
  ${acctRows()}${settings.instructions?`<p class="hint" style="margin-top:10px">${esc(settings.instructions)}</p>`:""}
  <h3 style="margin-top:14px">Then upload your proof of payment</h3>
  <label style="margin-top:6px">Screenshot of your receipt</label><input type="file" class="pfile" accept="image/*"><div class="pprev"></div>
  <label>Transaction ID <span style="font-weight:600;color:var(--muted)">(from your confirmation message)</span></label><input class="ptxn" maxlength="40">
  <label>Name on the account or wallet you paid from</label><input class="ppayer" maxlength="60">
  <label>Note <span style="font-weight:600;color:var(--muted)">(optional)</span></label><input class="pnote" maxlength="120">
  <button class="btn accent block" data-act="submit" type="button" style="margin-top:12px">Submit proof of payment</button></div>`}
function orderHtml(o){const loc=o.method==="pickup"?"Pickup":[o.location&&o.location.address,o.location&&o.location.city,o.location&&o.location.region].filter(Boolean).join(", ");let body="";
  if(o.status==="awaiting_price")body='<div class="note info">We are setting your total. It will appear here shortly, then you can pay.</div>';
  else if(o.status==="awaiting_payment")body=payBox(o);
  else if(o.status==="rejected")body=`<div class="note bad">Your payment was not approved${o.rejectReason?": "+esc(o.rejectReason):""}. Please check and upload your receipt again.</div>`+payBox(o);
  else if(o.status==="payment_submitted")body='<div class="note info">We received your proof of payment and are checking it. The status will update here.</div>';
  else if(o.status==="approved")body=o.kind==="plan"?'<div class="note good">✅ Payment approved. Your REACH Pro plan is active.</div>':'<div class="note good">✅ Payment approved. Your cards will be printed soon.</div>';
  else if(o.status==="printing")body='<div class="note good">🖨️ Your cards are being printed.</div>';
  else if(o.status==="delivered")body='<div class="note good">📦 Done. Thank you for your order!</div>';
  const cancel=["awaiting_price","awaiting_payment","rejected"].includes(o.status)?'<button class="btn ghost sm" data-act="cancel" type="button" style="margin-top:12px;color:#d6204a">Cancel this order</button>':"";
  return `<div class="ord" data-id="${o.id}"><div class="oh"><b>${esc(o.ref)}</b>${stPill(o.status)}</div>
    <div class="kv">${o.kind==="plan"?`<span>Plan</span><b>REACH Pro</b><span>Period</span><b>${o.qty} month${o.qty>1?"s":""}</b>`:`<span>Card</span><b>${esc(o.cardName)}</b><span>Quantity</span><b>${o.qty}</b>`}<span>Total</span><b>${o.amount!=null?money(o.amount,o.currency):"To be confirmed"}</b>${o.kind==="plan"?"":`<span>${o.method==="pickup"?"Collect":"Deliver to"}</span><b>${esc(loc)}</b>`}<span>Placed</span><b>${when(o.createdAt)}</b></div>${body}${cancel}</div>`}
function renderOrderList(){$("#ordList").innerHTML=orders.length?orders.map(orderHtml).join(""):'<div class="empty">No orders yet. Your orders will appear here.</div>'}
$("#ordList").addEventListener("change",async e=>{if(!e.target.classList.contains("pfile"))return;const box=e.target.closest(".ord"),f=e.target.files[0];if(!f)return;
  try{const d=await imgToDataUrl(f,{max:1100,square:false,q:.72});if(dataUrlKB(d)>420)return toast("That image is too large. Try a smaller screenshot.");proofs[box.dataset.id]=d;$(".pprev",box).innerHTML=`<img class="thumb" src="${d}" alt="Receipt preview">`}
  catch(x){toast("Couldn't read that image. Use a JPG or PNG.")}});
$("#ordList").onclick=async e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.copy){try{await navigator.clipboard.writeText(b.dataset.copy)}catch(x){}return toast("Copied ✓")}
  const box=b.closest(".ord");if(!box)return;const id=box.dataset.id,act=b.dataset.act;
  if(act==="cancel"){if(!confirm("Cancel this order?"))return;try{await db.collection("orders").doc(id).update({status:"cancelled",updatedAt:ts()});await loadOrders();renderOrderList();toast("Order cancelled")}catch(x){toast("Couldn't cancel")}return}
  if(act==="submit"){const txn=$(".ptxn",box).value.trim(),payer=$(".ppayer",box).value.trim();
    if(!proofs[id])return toast("Please upload a screenshot of your payment");
    if(txn.length<4)return toast("Enter the transaction ID from your payment message");
    if(!payer)return toast("Enter the name on the account or wallet you paid from");
    b.disabled=true;
    try{await db.collection("orderFiles").doc(id).set({owner:user.uid,receipt:proofs[id]},{merge:true});
      await db.collection("orders").doc(id).update({status:"payment_submitted",txnId:txn,payerName:payer,payNote:$(".pnote",box).value.trim(),submittedAt:ts(),updatedAt:ts()});
      delete proofs[id];toast("Proof of payment sent ✓");await loadOrders();renderOrderList()}
    catch(x){console.error(x);toast("Couldn't send. Please try again.");b.disabled=false}}};


/* ================= "What we offer": plan, items, inbox ================= */
let plan=null,plansCfg=null,items=[],itEdit=null,itKind="product",itPhoto="",payMonths=1,inq=[];
const scOf=c=>c.showcase||{};
async function loadPlanData(force){if(!plansCfg||force)plansCfg=await getPlansCfg(db);
  try{const s=await db.collection("plans").doc(user.uid).get();plan=s.exists?s.data():null}catch(e){plan=null}}
async function loadItems(){const s=await db.collection("items").where("cardId","==",C().id).get();items=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order||0)-(b.order||0))}
async function renderOffer(){
  try{await loadPlanData();await loadItems()}catch(e){console.error(e);$("#planCard").innerHTML='<div class="note bad">Couldn\'t load this section. The database rules may need updating.</div>';return}
  const c=C(),sc=scOf(c);
  $("#scOn").checked=!!sc.on;$("#scTitle").value=sc.title||"";$("#scIntro").value=sc.intro||"";$("#introCount").textContent=($("#scIntro").value.length)+" / 1200";
  $("#scHours").value=sc.hours||"";$("#scAreas").value=sc.areas||"";
  const waDef=c.businessWhatsApp||((c.platforms||[]).find(p=>displayName(p.name)==="WhatsApp")||{}).detail||"",phDef=c.officePhone||((c.platforms||[]).find(p=>displayName(p.name)==="Phone")||{}).detail||"";
  $("#scWa").value=sc.wa||waDef;$("#scPhone").value=sc.phone||phDef;$("#scMsg").checked=sc.msg!==false;
  renderPlan();renderItems()}
$("#scIntro").addEventListener("input",()=>$("#introCount").textContent=$("#scIntro").value.length+" / 1200");
function renderPlan(){const st=planStatus(plan,plansCfg),L=plansCfg,box=$("#planCard"),n=items.length;
  const explain=`<details><summary>How the plan works</summary><p>• Turn on “What we offer” to start a free ${L.trialDays}-day trial. During the trial you can add up to ${L.paidLimit} items.<br>• After the trial, ${L.freeLimit} items stay visible on your card for free. You choose which ones. The rest are hidden, never deleted.<br>• REACH Pro shows up to ${L.paidLimit} items. You pay by bank or mobile money, upload your receipt and we approve it.<br>• If Pro runs out, everything stays visible for ${L.graceDays} more days so you can renew. After that, ${L.freeLimit} items stay visible and nothing is deleted.</p></details>`;
  const prices=(L.prices||[]).slice().sort((a,b)=>a.months-b.months);if(!prices.some(p=>p.months===payMonths)&&prices[0])payMonths=prices[0].months;
  const upg=prices.length?`<div class="prices" id="payChips">${prices.map(p=>`<button type="button" class="cp ${payMonths===p.months?"on":""}" data-m="${p.months}">${p.months} month${p.months>1?"s":""} · ${money(p.price,L.currency)}</button>`).join("")}</div><button class="btn" id="upgBtn" type="button">Upgrade to REACH Pro</button>`:"";
  let t="",h="",extra="";
  if(L.enabled===false){box.className="card plan free";box.innerHTML='<h2>Paused</h2><p>This section is paused for now. Please check back soon.</p>';return}
  if(st.state==="new"){t="Start your free trial";h=`Turn on “What we offer” below to start a free ${L.trialDays}-day trial with up to ${L.paidLimit} items.`}
  else if(st.state==="trial"){t=`Free trial: ${st.days} day${st.days===1?"":"s"} left`;h=`You can add up to ${L.paidLimit} items during the trial. On ${dateShort(st.until)}, ${L.freeLimit} items stay visible on your card unless you upgrade. Pick which ones below.`;extra=upg}
  else if(st.state==="pro"){t="REACH Pro is active";h=`Valid until ${dateShort(st.until)} (${st.days} day${st.days===1?"":"s"} left). You can show up to ${L.paidLimit} items.`;extra=upg?`<details><summary>Renew early</summary>${upg}</details>`:""}
  else if(st.state==="grace"){t="Your Pro plan has ended";h=`Your items stay visible for ${st.days} more day${st.days===1?"":"s"}. Renew to keep all ${n>L.freeLimit?n:L.paidLimit} items showing. After that, only ${L.freeLimit} stay visible. Nothing is deleted.`;extra=upg}
  else{t="Free plan";h=`${L.freeLimit} items stay visible on your card.${n>L.freeLimit?` You have ${n} items, so ${n-L.freeLimit} are hidden but safe. Upgrade to show them again.`:" Upgrade to show up to "+L.paidLimit+" items."}`;extra=upg}
  box.className="card plan "+st.state;box.innerHTML=`<h2>${t}</h2><p>${h}</p>${extra}${explain}`}
$("#planCard").addEventListener("click",async e=>{const c=e.target.closest(".cp[data-m]");if(c){payMonths=+c.dataset.m;$$("#payChips .cp").forEach(x=>x.classList.toggle("on",x===c));return}
  if(e.target.id!=="upgBtn")return;const L=plansCfg,p=(L.prices||[]).find(x=>x.months===payMonths);if(!p)return;
  try{await loadOrders();
    if(orders.some(o=>o.kind==="plan"&&["awaiting_payment","payment_submitted"].includes(o.status))){toast("You already have a plan payment in progress");return setTab("orders")}
    const ref=orderRef(),d=db.collection("orders").doc();
    await d.set({owner:user.uid,kind:"plan",months:p.months,qty:p.months,cardId:"",cardName:"REACH Pro",label:"",method:"digital",customer:{name:udata.name||C().name,phone:"",email:user.email||""},location:{region:"",city:"",address:""},notes:"",amount:p.price,currency:L.currency||"GHS",deliveryFee:0,status:"awaiting_payment",ref,createdAt:ts(),updatedAt:ts()});
    toast("Order created ✓ Now pay and upload your receipt");setTab("orders")}
  catch(x){console.error(x);toast("Couldn't create the order. Please try again.")}});

/* business description + contact settings */
$("#saveSc").onclick=async()=>{const on=$("#scOn").checked,c=C();
  if(on&&!plan){try{await db.collection("plans").doc(user.uid).set({owner:user.uid,trialStart:ts(),createdAt:ts()});await loadPlanData();toast(`Your ${plansCfg.trialDays}-day free trial has started 🎉`)}catch(x){console.error(x);toast("Couldn't start the trial. The database rules may need updating.");return}}
  await saveCard({showcase:{on,title:$("#scTitle").value.trim(),intro:$("#scIntro").value.trim(),hours:$("#scHours").value.trim(),areas:$("#scAreas").value.trim(),wa:$("#scWa").value.trim(),phone:$("#scPhone").value.trim(),msg:$("#scMsg").checked}},"Saved ✓");renderPlan()};

/* items */
function visibleIds(){const st=planStatus(plan,plansCfg);return new Set(pickVisible(items,st.limit).map(i=>i.id))}
function renderItems(){const st=planStatus(plan,plansCfg),L=plansCfg,vis=visibleIds(),cur=L.currency,keepN=items.filter(i=>i.keep).length;
  $("#itCount").textContent=items.length+" / "+st.limit;
  $("#itPriceBox").classList.toggle("hide",["contact","free"].includes($("#itPT").value));
  const needKeep=items.length>L.freeLimit;
  $("#itList").innerHTML=(needKeep?`<div class="note info">Choose which ${L.freeLimit} items stay visible on the free plan (${keepN} of ${L.freeLimit} picked). Tick “Keep visible”.</div>`:"")+
   (items.length?items.map((i,ix)=>`<div class="it ${vis.has(i.id)&&!i.adminHidden?"":"off"}" data-id="${i.id}">${safeImg(i.photo)?`<img class="th" src="${i.photo}" alt="">`:`<div class="nophoto">${i.kind==="service"?"🛠":"🛍"}</div>`}
     <div class="tx"><b>${esc(i.name)}</b><span>${i.kind==="service"?"Service":"Product"} · ${esc(itemPrice(i,cur))}</span>${i.adminHidden?'<span style="display:block;color:#be123c">Hidden by REACH admin</span>':vis.has(i.id)?"":'<span style="display:block">Hidden on your public card (over the limit)</span>'}</div>
     <div class="ra">${needKeep?`<label class="keep"><input type="checkbox" data-keep ${i.keep?"checked":""}>Keep visible</label>`:""}<button class="ic" data-up title="Move up" ${ix===0?"disabled":""}>↑</button><button class="ic" data-down title="Move down" ${ix===items.length-1?"disabled":""}>↓</button><button class="ic" data-edit title="Edit">✎</button><button class="ic danger" data-del title="Delete">🗑</button></div></div>`).join(""):'<div class="empty">No items yet. Add your first one above 👆</div>')}
$("#itPT").onchange=()=>$("#itPriceBox").classList.toggle("hide",["contact","free"].includes($("#itPT").value));
$("#itKind").onclick=e=>{const b=e.target.closest("button");if(!b)return;itKind=b.dataset.k;$$("#itKind button").forEach(x=>x.classList.toggle("on",x===b))};
$("#itPhotoBtn").onclick=()=>$("#itPhotoIn").click();
$("#itPhotoIn").onchange=async()=>{const f=$("#itPhotoIn").files[0];$("#itPhotoIn").value="";if(!f)return;
  try{const d=await imgToDataUrl(f,{max:800,square:false,q:.72});if(dataUrlKB(d)>300)return toast("That photo is too large. Try a smaller one.");itPhoto=d;setItPhoto()}catch(e){toast("Couldn't read that image. Use a JPG or PNG.")}};
function setItPhoto(){$("#itPhoto").innerHTML=itPhoto?`<img src="${itPhoto}" alt="">`:"📷";$("#itPhotoRm").classList.toggle("hide",!itPhoto)}
$("#itPhotoRm").onclick=()=>{itPhoto="";setItPhoto()};
function resetItForm(){itEdit=null;itKind="product";itPhoto="";$("#itName").value="";$("#itDesc").value="";$("#itPT").value="fixed";$("#itPrice").value="";$("#itErr").textContent="";$$("#itKind button").forEach(x=>x.classList.toggle("on",x.dataset.k==="product"));
  $("#itSave").textContent="Add item";$("#itCancel").classList.add("hide");setItPhoto();$("#itPriceBox").classList.remove("hide")}
$("#itCancel").onclick=resetItForm;
$("#itForm").onsubmit=async e=>{e.preventDefault();const err=$("#itErr");err.textContent="";const name=$("#itName").value.trim(),pt=$("#itPT").value,st=planStatus(plan,plansCfg);
  if(!name)return err.textContent="Please give the item a name.";
  const needPrice=["fixed","from"].includes(pt),price=needPrice?parseFloat($("#itPrice").value):0;
  if(needPrice&&!(price>=0))return err.textContent="Enter a price, or choose “Contact for price”.";
  if(!itEdit&&items.length>=st.limit)return err.textContent=st.state==="trial"||st.state==="pro"||st.state==="grace"?`You can add up to ${st.limit} items.`:`The free plan holds ${st.limit} items. Upgrade to add more.`;
  const data={name,desc:$("#itDesc").value.trim(),kind:itKind,priceType:pt,price,photo:itPhoto,updatedAt:ts()};
  $("#itSave").disabled=true;
  try{if(itEdit)await db.collection("items").doc(itEdit).update(data);
    else await db.collection("items").add({...data,owner:user.uid,cardId:C().id,order:(items.reduce((m,i)=>Math.max(m,i.order||0),0))+1,keep:false,adminHidden:false,createdAt:ts()});
    toast(itEdit?"Item saved ✓":"Item added ✓");resetItForm();await loadItems();renderItems()}
  catch(x){console.error(x);err.textContent="Couldn't save. Please try again."}
  $("#itSave").disabled=false};
$("#itList").onclick=async e=>{const b=e.target.closest("button");if(!b)return;const row=b.closest(".it"),id=row.dataset.id,i=items.findIndex(x=>x.id===id);
  if(b.hasAttribute("data-edit")){const it=items[i];itEdit=id;itKind=it.kind||"product";itPhoto=safeImg(it.photo);$("#itName").value=it.name||"";$("#itDesc").value=it.desc||"";$("#itPT").value=it.priceType||"fixed";$("#itPrice").value=it.price??"";
    $$("#itKind button").forEach(x=>x.classList.toggle("on",x.dataset.k===itKind));setItPhoto();$("#itSave").textContent="Save changes";$("#itCancel").classList.remove("hide");$("#itPriceBox").classList.toggle("hide",["contact","free"].includes(it.priceType));$("#itForm").scrollIntoView({behavior:"smooth",block:"center"});return}
  if(b.hasAttribute("data-del")){if(!confirm("Delete “"+items[i].name+"”?"))return;try{await db.collection("items").doc(id).delete();await loadItems();renderItems();toast("Deleted")}catch(x){toast("Couldn't delete")}return}
  const j2=b.hasAttribute("data-up")?i-1:b.hasAttribute("data-down")?i+1:-1;
  if(j2>=0&&j2<items.length){const a=items[i],c2=items[j2],oa=a.order||0,oc=c2.order||0;try{await db.collection("items").doc(a.id).update({order:oc===oa?oc+(j2>i?1:-1):oc});await db.collection("items").doc(c2.id).update({order:oa});await loadItems();renderItems()}catch(x){toast("Couldn't reorder")}}};
$("#itList").onchange=async e=>{if(!e.target.hasAttribute("data-keep"))return;const id=e.target.closest(".it").dataset.id,L=plansCfg;
  if(e.target.checked&&items.filter(i=>i.keep).length>=L.freeLimit){e.target.checked=false;return toast(`Only ${L.freeLimit} items can stay visible on the free plan`)}
  try{await db.collection("items").doc(id).update({keep:e.target.checked});await loadItems();renderItems()}catch(x){toast("Couldn't save")}};

/* inbox */
async function refreshInbox(quiet){try{const s=await db.collection("inquiries").where("owner","==",user.uid).get();inq=s.docs.map(d=>({id:d.id,...d.data(),ts:ms(d.data().ts)})).sort((a,b)=>b.ts-a.ts);renderInbox()}catch(e){if(!quiet)console.error(e)}}
function renderInbox(){const n=inq.filter(m=>m.status==="new").length;$("#inBadge").textContent=n?"("+n+")":"";$("#inCount").textContent=inq.length;
  $("#inList").innerHTML=inq.length?inq.map(m=>`<div class="msgc ${m.status==="new"?"new":""}" data-id="${m.id}"><div class="mh"><b>${esc(m.name)} ${m.status==="new"?'<span class="pill">New</span>':m.status==="reported"?'<span class="st red">Reported</span>':""}</b><span class="sub" style="font-size:.8rem;margin:0">${when(m.ts)}</span></div>
    ${m.itemName?`<div class="hint" style="margin:4px 0 0">About: ${esc(m.itemName)}</div>`:""}<p>${esc(m.message)}</p>
    <div class="btnrow" style="margin-top:10px"><a class="btn" style="padding:9px 14px" href="tel:${esc(String(m.phone).replace(/[^\d+]/g,""))}">📞 Call ${esc(m.phone)}</a><a class="btn ghost" style="padding:9px 14px" target="_blank" rel="noopener" href="${esc(waLink(m.phone,"Hi "+m.name.split(" ")[0]+", thanks for your message on REACH."))}">WhatsApp</a>
    ${m.status==="new"?'<button class="btn ghost sm" data-mk="read" type="button">Mark read</button>':""}${m.status!=="reported"?'<button class="btn ghost sm" data-mk="reported" type="button">Report spam</button>':""}<button class="btn ghost sm" data-mk="del" type="button" style="color:#d6204a">Delete</button></div></div>`).join(""):'<div class="empty">No messages yet. When someone messages you from your card, it appears here.</div>'}
$("#inList").onclick=async e=>{const b=e.target.closest("button[data-mk]");if(!b)return;const id=b.closest(".msgc").dataset.id,k=b.dataset.mk;
  try{if(k==="del"){if(!confirm("Delete this message?"))return;await db.collection("inquiries").doc(id).delete()}else await db.collection("inquiries").doc(id).update({status:k});await refreshInbox();if(k==="reported")toast("Reported. Thank you.")}catch(x){toast("Couldn't update")}};
