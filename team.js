/* Team cards: create a card for every employee from a CSV or Excel file */
const JSZIP_URL="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
let tmChecked=[];
const HMAP={
 name:["name","fullname","employeename","employee","staffname"],
 title:["jobtitle","title","position","role","designation"],
 phone:["phone","mobile","tel","telephone","phonenumber","mobilenumber","cell","contact"],
 whatsapp:["whatsapp","whatsappnumber","wa"],
 email:["email","emailaddress","mail"],
 bio:["shortbio","bio","about","description"],
 linkedin:["linkedin"],instagram:["instagram","ig"],facebook:["facebook","fb"],x:["x","twitter","xtwitter"],tiktok:["tiktok"]};
const rid=()=>Math.random().toString(36).slice(2,10);
const csvq=v=>'"'+String(v??"").replace(/"/g,'""')+'"';

function parseCSV(text){text=String(text).replace(/^\ufeff/,"");
  const first=text.split(/\r?\n/)[0]||"",counts={",":0,";":0,"\t":0};let q=false;
  for(const ch of first){if(ch==='"')q=!q;else if(!q&&counts[ch]!==undefined)counts[ch]++}
  const delim=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0]||",";
  const rows=[];let row=[],f="",inq=false;
  for(let i=0;i<text.length;i++){const ch=text[i];
    if(inq){if(ch==='"'){if(text[i+1]==='"'){f+='"';i++}else inq=false}else f+=ch}
    else if(ch==='"')inq=true;
    else if(ch===delim){row.push(f);f=""}
    else if(ch==="\n"||ch==="\r"){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(f);rows.push(row);row=[];f=""}
    else f+=ch}
  if(f!==""||row.length){row.push(f);rows.push(row)}
  return rows.filter(r=>r.some(x=>String(x).trim()!==""))}

function rowsToPeople(rows){rows=rows.filter(r=>r.some(x=>String(x).trim()!==""));if(!rows.length)return{people:[],idx:{},unknown:[]};
  const hdr=rows[0].map(h=>norm(h)),idx={};
  hdr.forEach((h,i)=>{for(const k in HMAP){if(HMAP[k].includes(h)&&idx[k]===undefined){idx[k]=i;break}}});
  const used=new Set(Object.values(idx)),unknown=rows[0].filter((h,i)=>!used.has(i)&&String(h).trim());
  const people=rows.slice(1).map((r,n)=>{const o={_row:n+2};for(const k in idx)o[k]=String(r[idx[k]]??"").trim();return o});
  return{people,idx,unknown}}

const teamEmail=c=>{const p=(c.platforms||[]).find(x=>displayName(x.name)==="Email");return p?String(p.detail).toLowerCase():""};
function checkPeople(people){const seen=new Set(),existing=new Set(cards.filter(c=>c.team).map(teamEmail).filter(Boolean)),maxT=(plansCfg&&plansCfg.teamMax)||100;
  let room=Math.max(0,maxT-cards.filter(c=>c.team).length);
  return people.map(p=>{const issues=[];let skip=false;const em=(p.email||"").toLowerCase();
    if(!p.name||p.name.length<2){issues.push("Name missing");skip=true}
    if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))issues.push("Email looks wrong");
    if(p.phone&&dg(p.phone).length<7)issues.push("Phone looks short");
    if(!skip&&em&&seen.has(em)){issues.push("Duplicate email in file");skip=true}
    if(!skip&&em&&existing.has(em)){issues.push("Already a team card");skip=true}
    if(!skip&&room<=0){issues.push("Over the limit of "+maxT+" team cards");skip=true}
    if(!skip){room--;if(em)seen.add(em)}
    return{...p,issues,skip}})}

function teamPlatforms(p){const out=[],add=(n,d)=>{d=String(d||"").trim();if(d)out.push({id:rid(),name:displayName(n),detail:d})};
  add("Phone",p.phone);add("WhatsApp",p.whatsapp);add("Email",p.email);add("LinkedIn",p.linkedin);add("Instagram",p.instagram);add("Facebook",p.facebook);add("X (Twitter)",p.x);add("TikTok",p.tiktok);return out}

/* ---------- screen ---------- */
async function renderTeam(){
  if(!plansCfg){try{plansCfg=await getPlansCfg(db)}catch(e){plansCfg=DEFAULT_PLANS}}
  const off=plansCfg.enabled===false||plansCfg.teamEnabled===false;$("#tmOff").classList.toggle("hide",!off);$("#tmBody").classList.toggle("hide",off);if(off)$("#tmOff").textContent="Team cards are paused right now. Please check back soon.";
  const own=cards.filter(c=>!c.team),sel=$("#tmTpl"),keep=sel.value;
  sel.innerHTML=own.map(c=>`<option value="${c.id}">${esc(c.label||c.name)}${c.company?" · "+esc(c.company):""}</option>`).join("");
  sel.value=own.some(c=>c.id===keep)?keep:(own.find(c=>c.type==="business")||own[0]).id;tplNote();renderTeamList()}
function tplNote(){const c=cards.find(x=>x.id===$("#tmTpl").value),n=$("#tmTplNote");if(!c)return;
  const has=!!c.company;n.className="note "+(has?"good":"bad");
  n.innerHTML=has?`Template: <b>${esc(c.company)}</b>${safeImg(c.companyLogo)?" with logo":""}${c.color?` · colour ${esc(c.color)}`:" · default blue and pink"}`:"This card has no company name yet. Open its <b>Details</b> tab, switch the type to Business and fill in the company details, then come back."}
$("#tmTpl").onchange=tplNote;
$("#tmSample").onclick=()=>{const h=["Full name","Job title","Phone","WhatsApp","Email","LinkedIn","Instagram","Facebook","X (Twitter)","TikTok","Short bio"],
  ex=[["Ama Mensah","Marketing Manager","0241112222","0241112222","ama@yourcompany.com","in/amamensah","@amamensah","","","","Helping brands grow."],["Kofi Boateng","Sales Executive","0201234567","0201234567","kofi@yourcompany.com","","","","","",""]];
  const csv="\ufeff"+[h,...ex].map(r=>r.map(csvq).join(",")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="REACH-team-sample.csv";a.click()};

$("#tmFile").onchange=async()=>{const f=$("#tmFile").files[0];if(!f)return;const box=$("#tmPrev");box.innerHTML='<div class="spin" style="margin:20px auto"></div>';
  try{let rows;
    if(/\.(xlsx|xls)$/i.test(f.name)){if(!window.XLSX)await loadJs(XLSX_URL);const wb=XLSX.read(await f.arrayBuffer(),{type:"array"});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:"",raw:false})}
    else rows=parseCSV(await f.text());
    showTeamPreview(rows)}
  catch(e){console.error(e);box.innerHTML='<div class="note bad">Couldn\'t read that file. Use the sample file as a guide and save it as .xlsx or .csv.</div>'}};
function showTeamPreview(rows){const box=$("#tmPrev"),{people,idx,unknown}=rowsToPeople(rows);
  if(idx.name===undefined){box.innerHTML='<div class="note bad">I couldn\'t find a <b>Name</b> column. Please use the sample file so the columns match.</div>';return}
  if(!people.length){box.innerHTML='<div class="note bad">The file has a header but no employees in it.</div>';return}
  tmChecked=checkPeople(people);const ok=tmChecked.filter(p=>!p.skip).length,sk=tmChecked.length-ok;
  box.innerHTML=`<div class="note ${ok?"good":"bad"}" style="margin-top:14px"><b>${tmChecked.length}</b> row${tmChecked.length===1?"":"s"} found · <b>${ok}</b> ready${sk?` · <b>${sk}</b> will be skipped`:""}.${unknown.length?` Ignored columns: ${unknown.map(esc).join(", ")}.`:""}</div>
    <div class="tw"><table class="tbl"><thead><tr><th>Row</th><th>Name</th><th>Job title</th><th>Phone</th><th>Email</th><th>Check</th></tr></thead><tbody>${tmChecked.slice(0,150).map(p=>`<tr class="${p.skip?"skip":""}"><td>${p._row}</td><td>${esc(p.name||"")}</td><td>${esc(p.title||"")}</td><td>${esc(p.phone||"")}</td><td>${esc(p.email||"")}</td><td>${p.issues.length?(p.skip?"⛔ ":"⚠️ ")+esc(p.issues.join(", ")):"✅ Ready"}</td></tr>`).join("")}</tbody></table></div>
    ${tmChecked.length>150?`<p class="hint">Showing the first 150 rows.</p>`:""}
    <button class="btn accent block big" id="tmGo" type="button" ${ok?"":"disabled"}>Create ${ok} card${ok===1?"":"s"}</button>`;
  $("#tmGo").onclick=createTeam}
async function createTeam(){const tpl=cards.find(c=>c.id===$("#tmTpl").value),ready=tmChecked.filter(p=>!p.skip);if(!tpl||!ready.length)return;
  if(!confirm("Create "+ready.length+" card"+(ready.length===1?"":"s")+" using “"+(tpl.label||tpl.name)+"” as the template?"))return;
  const btn=$("#tmGo");btn.disabled=true;btn.textContent="Creating…";const batchId=Date.now().toString(36);
  try{for(let i=0;i<ready.length;i+=400){const b=db.batch();
      ready.slice(i,i+400).forEach(p=>{const ref=db.collection("cards").doc();
        b.set(ref,{owner:user.uid,type:"business",label:p.name.slice(0,30),name:p.name,title:p.title||"",bio:p.bio||"",about:"",photo:"",platforms:teamPlatforms(p),
          company:tpl.company||"",companyLogo:"",logoRef:safeImg(tpl.companyLogo)?tpl.id:"",address:tpl.address||"",website:tpl.website||"",officePhone:tpl.officePhone||"",businessWhatsApp:tpl.businessWhatsApp||"",
          color:tpl.color||"",cstyle:tpl.cstyle||"",team:true,teamBatch:batchId,createdAt:ts(),updatedAt:ts()})});
      await b.commit()}
    toast(ready.length+" team card"+(ready.length===1?"":"s")+" created ✓");$("#tmPrev").innerHTML="";$("#tmFile").value="";tmChecked=[];
    await loadCards();renderAll();renderTeam()}
  catch(e){console.error(e);toast("Couldn't create the cards. Please try again.");btn.disabled=false;btn.textContent="Try again"}}

/* ---------- team list ---------- */
function renderTeamList(){const t=cards.filter(c=>c.team),q=norm($("#tmSearch").value||"");$("#tmCount").textContent=t.length;
  const list=t.filter(c=>!q||norm(c.name+c.title+teamEmail(c)).includes(q));
  $("#tmDelAll").classList.toggle("hide",!t.length);
  $("#tmList").innerHTML=list.length?list.map(c=>`<div class="row" data-id="${c.id}"><span class="logo" style="--s:44px"><b>${esc((c.name||"?")[0].toUpperCase())}</b></span><div class="rt"><b>${esc(c.name)}</b><span>${esc([c.title,teamEmail(c)].filter(Boolean).join(" · "))}</span></div>
    <div class="ra"><button class="ic" data-a="qr" title="Download QR image">⬇</button><button class="ic" data-a="open" title="Preview card">↗</button><button class="ic" data-a="edit" title="Edit this card">✎</button><button class="ic danger" data-a="del" title="Delete">🗑</button></div></div>`).join(""):`<div class="empty">${t.length?"No one matches your search.":"No team cards yet. Upload a file above to create them."}</div>`}
$("#tmSearch").oninput=renderTeamList;
$("#tmList").onclick=async e=>{const b=e.target.closest("button[data-a]");if(!b)return;const id=b.closest(".row").dataset.id,c=cards.find(x=>x.id===id),a=b.dataset.a;if(!c)return;
  if(a==="edit"){cur=id;editing=null;setTab("details");renderAll();return}
  if(a==="open"){window.open(cardUrl(id),"_blank","noopener");return}
  if(a==="qr"){try{downloadCanvas(await drawQrCard(c,cardUrl(id,"qr")),safeName(c.name)+"-QR-REACH.png")}catch(x){toast("Couldn't create the image")}return}
  if(a==="del"){if(!confirm("Delete the card for "+c.name+"? Its QR code will stop working."))return;
    try{await db.collection("cards").doc(id).delete();cards=cards.filter(x=>x.id!==id);if(cur===id)cur=(cards.find(x=>!x.team)||cards[0]).id;renderAll();renderTeam();toast("Deleted")}catch(x){toast("Couldn't delete")}}};
$("#tmDelAll").onclick=async()=>{const t=cards.filter(c=>c.team);if(!t.length)return;
  if(!confirm("Delete ALL "+t.length+" team cards? Their QR codes will stop working. This cannot be undone."))return;
  try{for(let i=0;i<t.length;i+=400){const b=db.batch();t.slice(i,i+400).forEach(c=>b.delete(db.collection("cards").doc(c.id)));await b.commit()}
    cards=cards.filter(c=>!c.team);if(!cards.some(c=>c.id===cur))cur=cards[0].id;renderAll();renderTeam();toast("Team cards deleted")}catch(x){toast("Couldn't delete them all")}};

/* ---------- bulk downloads ---------- */
const toBlob=cv=>new Promise(r=>cv.toBlob(r,"image/png"));
async function zipTeam(kind){const t=cards.filter(c=>c.team);if(!t.length)return toast("No team cards yet");
  try{if(!window.JSZip)await loadJs(JSZIP_URL);await freshOrders();const zip=new JSZip();let i=0;
    for(const c of t){i++;toast("Preparing "+i+" of "+t.length+"…");const nm=String(i).padStart(2,"0")+"-"+safeName(c.name);
      if(kind==="qr")zip.file(nm+"-QR-REACH.png",await toBlob(await drawQrCard(c,cardUrl(c.id,"qr"))));
      else{const wm=!isPaidCard(c);zip.file(nm+"-front.png",await toBlob(await drawFront(c,{watermark:wm})));zip.file(nm+"-back.png",await toBlob(await drawBack(c,cardUrl(c.id,"qr"),{watermark:wm})))}}
    const blob=await zip.generateAsync({type:"blob"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="REACH-team-"+(kind==="qr"?"QR-codes":"card-previews")+".zip";a.click();toast("Download ready ✓")}
  catch(e){console.error(e);toast("Couldn't build the zip. Check your internet and try again.")}}
$("#tmZipQr").onclick=()=>zipTeam("qr");$("#tmZipCards").onclick=()=>zipTeam("cards");
$("#tmCsv").onclick=()=>{const t=cards.filter(c=>c.team);if(!t.length)return toast("No team cards yet");
  const ph=c=>((c.platforms||[]).find(p=>displayName(p.name)==="Phone")||{}).detail||"";
  const csv="\ufeff"+[["Name","Job title","Phone","Email","Card link"],...t.map(c=>[c.name,c.title||"",ph(c),teamEmail(c),cardUrl(c.id)])].map(r=>r.map(csvq).join(",")).join("\r\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="REACH-team-links.csv";a.click()};
