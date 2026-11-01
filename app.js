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
  cards.sort((a,b)=>ms(a.createdAt)-ms(b.createdAt));
  if(!cur||!cards.some(c=>c.id===cur))cur=cards[0].id;
}
async function onUser(u){
  if(signingUp)return;
  if(!u){user=null;cards=[];hits=null;show("auth");return}
  user=u;
  try{await ensureUser(u,pendingName);await loadCards();renderAll();show("app")}
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
  $("#cardbar").innerHTML=cards.map(k=>`<button class="cp ${k.id===c.id?"on":""}" data-id="${k.id}">${TYPE_ICON[k.type]||"🙂"} ${esc(k.label||"Card")}</button>`).join("")+'<button class="cp add" id="newCardBtn">＋ New card</button>';
  renderList();o.keepForm?renderDetailImages():renderDetails();renderShare();
  if(tab==="print")renderPrint();if(tab==="stats")renderStats();
}
$("#cardbar").onclick=e=>{const b=e.target.closest("button");if(!b)return;if(b.id==="newCardBtn")return openNew();cur=b.dataset.id;editing=null;renderAll()};

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
function setTab(t){tab=t;$$("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.t===t));["links","details","print","stats"].forEach(k=>$("#pane-"+k).classList.toggle("hide",k!==t));
  if(t==="print")renderPrint();if(t==="stats")renderStats()}

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
  $("#dLabel").value=c.label||"";$("#dType").value=c.type||"personal";$("#dName").value=c.name||"";$("#dTitle").value=c.title||"";$("#dBio").value=c.bio||"";
  $("#dCompany").value=c.company||"";$("#dAddress").value=c.address||"";$("#dWeb").value=c.website||"";$("#dPhone").value=c.officePhone||"";$("#dWa").value=c.businessWhatsApp||"";
  $("#bizBox").classList.toggle("hide",($("#dType").value)==="personal");
  renderDetailImages()}
function renderDetailImages(){const c=C();
  setAv($("#pav"),c.photo,c.name);$("#rmPhoto").classList.toggle("hide",!safeImg(c.photo));
  $("#lav").innerHTML=safeImg(c.companyLogo)?`<img src="${c.companyLogo}" alt="">`:"🏢";$("#rmLogo").classList.toggle("hide",!safeImg(c.companyLogo));
  $("#delCard").classList.toggle("hide",cards.length<2)}
$("#dType").onchange=()=>$("#bizBox").classList.toggle("hide",$("#dType").value==="personal");
$("#saveDet").onclick=()=>{const name=$("#dName").value.trim();if(!name)return toast("Name on card can't be empty");
  saveCard({label:$("#dLabel").value.trim()||"Card",type:$("#dType").value,name,title:$("#dTitle").value.trim(),bio:$("#dBio").value.trim(),
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
  try{await db.collection("cards").doc(c.id).delete();cards=cards.filter(k=>k.id!==c.id);cur=cards[0].id;hits=null;renderAll();toast("Card deleted")}catch(e){toast("Couldn't delete")}};

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
async function cardCanvas(s){const c=C();return s==="front"?drawFront(c):drawBack(c,cardUrl(c.id,"qr"))}
async function renderPrint(){renderPrintControls();const t=++prTok;try{const cv=await cardCanvas(side);if(t!==prTok)return;const p=$("#bcPrev");p.getContext("2d").clearRect(0,0,1050,600);p.getContext("2d").drawImage(cv,0,0)}catch(e){console.error(e)}}
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
