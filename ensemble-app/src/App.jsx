import { useState, useEffect, useRef } from "react";

const G = {
  bg:"#0B0A07", card:"#111008", cardHover:"#161409",
  border:"#221E12", borderLight:"#332D1A",
  gold:"#C8A84A", goldDim:"#866E2E", goldFaint:"#2E2610",
  cream:"#EAE0C8", creamDim:"#9A9078", creamFaint:"#2E2C20",
  red:"#C05040", redFaint:"#2E1410",
  green:"#5A9060", greenFaint:"#142018",
  blue:"#4A7898", blueFaint:"#0E1E28",
  purple:"#8A6AAA", purpleFaint:"#1E1428",
  text:"#D4C8B0", textDim:"#7A7060", textFaint:"#2E2C20",
};

const DEFAULT_MEMBERS = ["Alex","Bea","Chris","Dana","Eve","Felix"];
const STORE_KEY   = "ensemble_concerts_v3";
const USERS_KEY   = "ensemble_users_v1";
const MEMBERS_KEY = "ensemble_members_v1";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${G.bg};-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:${G.bg}}::-webkit-scrollbar-thumb{background:${G.border};border-radius:2px}
input,textarea,select{font-family:'Jost',sans-serif}
input::placeholder,textarea::placeholder{color:${G.textFaint}}
input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.4)}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.fadeUp{animation:fadeUp .3s ease both}
.card-hover{transition:border-color .2s,box-shadow .2s}
.card-hover:hover{border-color:${G.borderLight}!important;box-shadow:0 6px 32px rgba(0,0,0,.55)!important}
.btn-t{transition:all .15s;cursor:pointer}
.btn-t:hover{filter:brightness(1.18)}
select option{background:#1A1608}
`;

// ── Storage ──────────────────────────────────────────────────────────────────
async function loadStore(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
async function saveStore(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ── Seed ─────────────────────────────────────────────────────────────────────
const SEED = [
  { id:"c1", status:"approved", title:"Brahms & Beethoven", conductor:"Hans Graf",
    soloists:[{name:"Yuja Wang",role:"Piano"}],
    date:"2025-05-16", time:"19:30", venue:"Esplanade Concert Hall", city:"Singapore",
    url:"https://sso.org.sg", detailUrl:"",
    program:["Brahms: Piano Concerto No. 2","Beethoven: Symphony No. 7"],
    tiers:[{label:"Cat 1",price:98},{label:"Cat 2",price:78},{label:"Cat 3",price:55},{label:"Cat 4",price:38}],
    submittedBy:"Chris", notes:"", interest:{}, purchases:{}, paidStatus:{} },
  { id:"c2", status:"approved", title:"Mahler Fifth", conductor:"Joshua Tan",
    soloists:[],
    date:"2025-06-07", time:"19:30", venue:"Esplanade Concert Hall", city:"Singapore",
    url:"", detailUrl:"",
    program:["Mahler: Symphony No. 5"],
    tiers:[{label:"Cat 1",price:105},{label:"Cat 2",price:85},{label:"Cat 3",price:62},{label:"Cat 4",price:42}],
    submittedBy:"Bea", notes:"", interest:{}, purchases:{}, paidStatus:{} },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);
const ACCENT = ["#C8A84A","#7A9E6A","#6A8AB0","#A87A5A","#9A6A8A","#7A8A9A"];
const avatarColor = n => ACCENT[n.charCodeAt(0) % ACCENT.length];
const fmtDate = d => {
  if (!d) return "";
  try { return new Date(d+"T12:00:00").toLocaleDateString("en-SG",{weekday:"short",day:"numeric",month:"short",year:"numeric"}); }
  catch { return d; }
};

// ── Primitives ────────────────────────────────────────────────────────────────
function Avatar({name,size=26}) {
  return <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:avatarColor(name),
    display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,
    fontFamily:"'Playfair Display',serif",fontWeight:500,color:"#0B0A07"}}>{name[0]}</div>;
}
function Pill({label,variant="dim"}) {
  const V={dim:{bg:G.creamFaint,c:G.creamDim,b:G.borderLight},gold:{bg:G.goldFaint,c:G.gold,b:G.goldDim},
    green:{bg:G.greenFaint,c:G.green,b:"#1E4020"},red:{bg:G.redFaint,c:G.red,b:"#4A1810"},
    blue:{bg:G.blueFaint,c:G.blue,b:"#1A3040"},pending:{bg:"#1E1A08",c:"#A08020",b:"#3E3010"}};
  const s=V[variant]||V.dim;
  return <span style={{fontSize:10,letterSpacing:1.8,textTransform:"uppercase",fontFamily:"'Jost',sans-serif",
    fontWeight:500,background:s.bg,color:s.c,border:`1px solid ${s.b}`,padding:"2px 8px",borderRadius:2}}>{label}</span>;
}
function Btn({children,onClick,variant="primary",size="md",disabled=false,style:sx={}}) {
  const SZ={sm:{fontSize:10,padding:"5px 12px"},md:{fontSize:11,padding:"7px 18px"},lg:{fontSize:12,padding:"10px 26px"}};
  const V={primary:{background:G.gold,color:"#0B0A07",border:"none"},
    ghost:{background:"none",color:G.gold,border:`1px solid ${G.goldDim}`},
    ghostDim:{background:"none",color:G.textDim,border:`1px solid ${G.border}`},
    danger:{background:"none",color:G.red,border:`1px solid #4A1810`},
    success:{background:G.greenFaint,color:G.green,border:`1px solid #1E4020`},
    blue:{background:G.blueFaint,color:G.blue,border:`1px solid #1A3040`}};
  return <button className="btn-t" onClick={disabled?undefined:onClick} style={{
    ...SZ[size],...(V[variant]||V.primary),borderRadius:2,cursor:disabled?"not-allowed":"pointer",
    fontFamily:"'Jost',sans-serif",fontWeight:400,letterSpacing:".1em",textTransform:"uppercase",
    opacity:disabled?.45:1,...sx}}>{children}</button>;
}
function Inp({value,onChange,placeholder,type="text",disabled=false}) {
  const [f,setF]=useState(false);
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    disabled={disabled} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{width:"100%",background:G.bg,border:`1px solid ${f?G.goldDim:G.border}`,color:G.text,
      borderRadius:2,padding:"7px 11px",fontSize:13,outline:"none",fontFamily:"'Jost',sans-serif",
      transition:"border-color .2s",opacity:disabled?.5:1}}/>;
}
function Textarea({value,onChange,placeholder,rows=3}) {
  const [f,setF]=useState(false);
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{width:"100%",background:G.bg,border:`1px solid ${f?G.goldDim:G.border}`,color:G.text,
      borderRadius:2,padding:"7px 11px",fontSize:13,outline:"none",resize:"vertical",
      fontFamily:"'Jost',sans-serif",transition:"border-color .2s"}}/>;
}
function Modal({title,subtitle,children,onClose,wide=false,maxW}) {
  return <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,
    background:"rgba(0,0,0,.82)",zIndex:500,display:"flex",alignItems:"center",
    justifyContent:"center",padding:20}}>
    <div className="fadeUp" style={{background:G.card,border:`1px solid ${G.borderLight}`,borderRadius:3,
      width:"100%",maxWidth:maxW||( wide?720:500),maxHeight:"94vh",overflowY:"auto",padding:"24px 24px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontSize:18,fontFamily:"'Playfair Display',serif",color:G.cream}}>{title}</div>
          {subtitle&&<div style={{fontSize:12,color:G.textDim,marginTop:3}}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:G.textDim,fontSize:22,
          cursor:"pointer",lineHeight:1,padding:"0 4px",marginLeft:16,flexShrink:0}}>×</button>
      </div>
      {children}
    </div>
  </div>;
}
function SecLabel({children,mt=0}) {
  return <div style={{fontSize:10,letterSpacing:2.5,color:G.textFaint,textTransform:"uppercase",
    fontFamily:"'Jost',sans-serif",marginBottom:7,marginTop:mt}}>{children}</div>;
}
function EmptyState({label}) {
  return <div style={{textAlign:"center",padding:"64px 20px",color:G.textFaint}}>
    <div style={{fontSize:34,marginBottom:10,fontFamily:"'Playfair Display',serif",fontStyle:"italic"}}>𝄞</div>
    <div style={{fontSize:13}}>{label}</div>
  </div>;
}
function CalBtn({concert:c}) {
  const go=()=>{
    if(!c.date) return;
    const [yr,mo,dy]=c.date.split("-");
    const [hh,mm]=(c.time||"19:30").split(":").map(Number);
    const f=(y,m,d,h,n)=>`${y}${m}${d}T${String(h).padStart(2,"0")}${String(n).padStart(2,"0")}00`;
    const url=`https://calendar.google.com/calendar/render?action=TEMPLATE`
      +`&text=${encodeURIComponent("🎼 "+c.title)}`
      +`&dates=${f(yr,mo,dy,hh,mm)}/${f(yr,mo,dy,hh+2,mm)}`
      +`&location=${encodeURIComponent([c.venue,c.city].filter(Boolean).join(", "))}`
      +`&details=${encodeURIComponent([...(c.soloists||[]).map(s=>`${s.name} (${s.role})`),...(c.program||[])].join("\n"))}`;
    window.open(url,"_blank");
  };
  return <Btn size="sm" variant="ghostDim" onClick={go} style={{whiteSpace:"nowrap"}}>📅 Calendar</Btn>;
}

// ── Soloists editor ───────────────────────────────────────────────────────────
function SoloistsEditor({soloists,onChange}) {
  const add=()=>onChange([...soloists,{name:"",role:""}]);
  const rm=i=>onChange(soloists.filter((_,j)=>j!==i));
  const upd=(i,k,v)=>onChange(soloists.map((s,j)=>j===i?{...s,[k]:v}:s));
  return <div>
    {soloists.map((s,i)=>(
      <div key={i} style={{display:"flex",gap:8,marginBottom:7,alignItems:"center"}}>
        <div style={{flex:2}}><Inp value={s.name} onChange={v=>upd(i,"name",v)} placeholder="Name"/></div>
        <div style={{flex:1}}><Inp value={s.role} onChange={v=>upd(i,"role",v)} placeholder="Instrument / Voice"/></div>
        <button onClick={()=>rm(i)} style={{background:"none",border:"none",color:G.textDim,
          cursor:"pointer",fontSize:18,padding:"0 4px",lineHeight:1,flexShrink:0}}>×</button>
      </div>
    ))}
    <button onClick={add} style={{background:"none",border:`1px dashed ${G.border}`,color:G.textDim,
      borderRadius:2,padding:"5px 14px",cursor:"pointer",fontSize:10,fontFamily:"'Jost',sans-serif",
      letterSpacing:".1em",textTransform:"uppercase",transition:"border-color .2s"}}
      onMouseEnter={e=>e.target.style.borderColor=G.borderLight}
      onMouseLeave={e=>e.target.style.borderColor=G.border}>
      + Add Soloist
    </button>
  </div>;
}

// ── Bulk import modal ─────────────────────────────────────────────────────────
const SSO_2026_27 = [{"title":"TwoSet Violin × SSO: Sacrilegious Games","conductor":"Joshua Tan","soloists":[{"name":"Brett Yang","role":"Violin"},{"name":"Eddy Chen","role":"Violin"}],"date":"2026-07-02","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["TwoSet Violin: Sacrilegious Games Tour — classical music & comedy"],"tiers":[{"label":"Cat 1","price":238},{"label":"Cat 2","price":198},{"label":"Cat 3","price":158},{"label":"Cat 4","price":128}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Pops. Cat1+Meet&Greet $288. Cat5:$98"},{"title":"TwoSet Violin × SSO: Sacrilegious Games","conductor":"Joshua Tan","soloists":[{"name":"Brett Yang","role":"Violin"},{"name":"Eddy Chen","role":"Violin"}],"date":"2026-07-03","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["TwoSet Violin: Sacrilegious Games Tour — classical music & comedy"],"tiers":[{"label":"Cat 1","price":238},{"label":"Cat 2","price":198},{"label":"Cat 3","price":158},{"label":"Cat 4","price":128}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Pops. Cat1+Meet&Greet $288. Cat5:$98"},{"title":"Gil Shaham & Akira Eguchi – Beethoven Violin Sonatas 1, 2, 3 & 9","conductor":"","soloists":[{"name":"Gil Shaham","role":"Violin"},{"name":"Akira Eguchi","role":"Piano"}],"date":"2026-07-10","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Beethoven: Violin Sonata No. 1 in D major, Op. 12 No. 1","Beethoven: Violin Sonata No. 2 in A major, Op. 12 No. 2","Beethoven: Violin Sonata No. 3 in E-flat major, Op. 12 No. 3","Beethoven: Violin Sonata No. 9 'Kreutzer', Op. 47"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":80},{"label":"Cat 3","price":60},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Recital. Concert bundles available. Cat5:$30, Cat6:$20"},{"title":"Gil Shaham & Akira Eguchi – Beethoven Violin Sonatas 4, 5 & 10","conductor":"","soloists":[{"name":"Gil Shaham","role":"Violin"},{"name":"Akira Eguchi","role":"Piano"}],"date":"2026-07-11","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Beethoven: Violin Sonata No. 4 in A minor, Op. 23","Beethoven: Violin Sonata No. 5 'Spring', Op. 24","Beethoven: Violin Sonata No. 10 in G major, Op. 96"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":80},{"label":"Cat 3","price":60},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Recital. Concert bundles available. Cat5:$30, Cat6:$20"},{"title":"Gil Shaham & Akira Eguchi – Beethoven Violin Sonatas 6, 7 & 8","conductor":"","soloists":[{"name":"Gil Shaham","role":"Violin"},{"name":"Akira Eguchi","role":"Piano"}],"date":"2026-07-12","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Beethoven: Violin Sonata No. 6 in A major, Op. 30 No. 1","Beethoven: Violin Sonata No. 7 in C minor, Op. 30 No. 2","Beethoven: Violin Sonata No. 8 in G major, Op. 30 No. 3"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":80},{"label":"Cat 3","price":60},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Recital. Concert bundles available. Cat5:$30, Cat6:$20"},{"title":"Hannu Lintu Inaugural: Gil Shaham & Mahler 5","conductor":"Hannu Lintu","soloists":[{"name":"Gil Shaham","role":"Violin"}],"date":"2026-07-17","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Tan Chan Boon: Apres l'Odyssee (SSO Commission, World Premiere)","Mason Bates: Nomad Concerto","Mahler: Symphony No. 5"],"tiers":[{"label":"Cat 1","price":138},{"label":"Cat 2","price":108},{"label":"Cat 3","price":78},{"label":"Cat 4","price":58}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Gala. Concert bundles available. Cat5:$38, Cat6:$28"},{"title":"Hannu Lintu Inaugural: Gil Shaham & Mahler 5","conductor":"Hannu Lintu","soloists":[{"name":"Gil Shaham","role":"Violin"}],"date":"2026-07-18","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Tan Chan Boon: Apres l'Odyssee (SSO Commission, World Premiere)","Mason Bates: Nomad Concerto","Mahler: Symphony No. 5"],"tiers":[{"label":"Cat 1","price":138},{"label":"Cat 2","price":108},{"label":"Cat 3","price":78},{"label":"Cat 4","price":58}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Gala. Concert bundles available. Cat5:$38, Cat6:$28"},{"title":"Hannu Lintu Inaugural: Zarathustra & Bluebeard's Castle","conductor":"Hannu Lintu","soloists":[{"name":"Shenyang","role":"Bass-Baritone"},{"name":"Jennifer Johnston","role":"Mezzo-Soprano"}],"date":"2026-07-24","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["R. Strauss: Also sprach Zarathustra","Bartok: Duke Bluebeard's Castle (staged opera)"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Concert bundles available. Cat5:$30, Cat6:$15"},{"title":"SSO Organ Series: Music for a While","conductor":"","soloists":[{"name":"Loraine Muthiah","role":"Organ"},{"name":"Boey Jir Shin","role":"Harpsichord"}],"date":"2026-07-26","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Bennet, Blow, Byrd, Tallis: choral works","Purcell: Music for a While","Richardson, Philips: keyboard works","Gibbons: Magnificat, Nunc Dimittis, Hosanna"],"tiers":[{"label":"Cat 1","price":30},{"label":"Cat 2","price":20},{"label":"Cat 3","price":10}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Organ Series. Members of Singapore Symphony Chorus."},{"title":"SSO Lunchtime Concert","conductor":"Nathanael Iselin","soloists":[],"date":"2026-07-29","time":"12:30","venue":"Victoria Concert Hall","city":"Singapore","program":[],"tiers":[],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Free community concert"},{"title":"Symphony in the Gardens","conductor":"Nathanael Iselin","soloists":[],"date":"2026-08-01","time":"18:00","venue":"Shaw Foundation Symphony Stage, Singapore Botanic Gardens","city":"Singapore","program":[],"tiers":[],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Free outdoor community concert. Singapore Botanic Gardens."},{"title":"Marc-Andre Hamelin & Sebastian Weigle – Brahms Piano Concerto 2","conductor":"Sebastian Weigle","soloists":[{"name":"Marc-Andre Hamelin","role":"Piano"}],"date":"2026-08-06","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Brahms: Piano Concerto No. 2 in B-flat major, Op. 83","Dvorak: Symphony No. 7 in D minor, Op. 70"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Cat5:$30, Cat6:$15"},{"title":"SSO Chamber: Trout Quintet & Brahms with Marc-Andre Hamelin","conductor":"","soloists":[{"name":"Marc-Andre Hamelin","role":"Piano"}],"date":"2026-08-08","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Brahms: Horn Trio in E-flat major, Op. 40","Schubert: Piano Quintet in A major, D. 667 'Trout'"],"tiers":[{"label":"Cat 1","price":50},{"label":"Cat 2","price":40},{"label":"Cat 3","price":30},{"label":"Cat 4","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Chamber Series. Cat1:$50, Cat2:$40, Cat3:$30, Cat4:$20"},{"title":"SSO National Day Concert","conductor":"Lien Boon Hua","soloists":[{"name":"Kevin Loh","role":"Guitar"},{"name":"Jonathan Ngeow","role":"Ruan"},{"name":"Linying","role":"Vocalist"}],"date":"2026-08-15","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Low Peng Guan: A Singapore Suite (NDC 2026 Prize, Premiere)","Sulwyn Lok: New commission (Premiere); Kelly Tang: Three Symphonic Movements (Premiere)","Germaine Goh: New commission (Premiere)","Tsao Chieh: Finale from Singapore Symphonic Suite"],"tiers":[{"label":"Cat 1","price":75},{"label":"Cat 2","price":55},{"label":"Cat 3","price":40},{"label":"Cat 4","price":30}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"National Day Concert. Concert bundles available. Livestreamed. Cat5:$15"},{"title":"Agape – The Human Connection (Apsaras Dance Co.)","conductor":"Joshua Tan","soloists":[],"date":"2026-08-21","time":"20:00","venue":"Esplanade Theatre","city":"Singapore","program":["Agape — multidisciplinary Indian classical dance & orchestra production"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":80},{"label":"Cat 3","price":60},{"label":"Cat 4","price":45}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Apsaras Dance Company x Musicians of the SSO. Concert bundles available. Cat5:$30"},{"title":"Agape – The Human Connection (Apsaras Dance Co.)","conductor":"Joshua Tan","soloists":[],"date":"2026-08-22","time":"20:00","venue":"Esplanade Theatre","city":"Singapore","program":["Agape — multidisciplinary Indian classical dance & orchestra production"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":80},{"label":"Cat 3","price":60},{"label":"Cat 4","price":45}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Apsaras Dance Company x Musicians of the SSO. Concert bundles available. Cat5:$30"},{"title":"SSO Chamber: The Palace Rhapsody","conductor":"Ivan Meylemans","soloists":[{"name":"Jamshid Saydikarimov","role":"Cello"}],"date":"2026-08-21","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Ron Nelson: Resonances I (arr. Meylemans, Singapore Premiere)","Einojuhani Rautavaara: A Requiem in Our Time, Op. 3 (Singapore Premiere)","Aulis Sallinen: The Palace Rhapsody (Singapore Premiere)","Friedrich Gulda: Concerto for Cello and Wind Orchestra, Op. 129"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30},{"label":"Cat 3","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Chamber Series. Winds and Percussion of the SSO."},{"title":"SSO Chamber: Grieg & Tchaikovsky – Suite & Souvenir","conductor":"","soloists":[{"name":"Andrew Beer","role":"Violin/Leader"}],"date":"2026-08-27","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Grieg: Holberg Suite","Tchaikovsky: Souvenir de Florence"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30},{"label":"Cat 3","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Chamber Series. Strings of the SSO."},{"title":"SNYO x SSO: Jurassic Park In Concert","conductor":"Joshua Tan","soloists":[],"date":"2026-08-28","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["John Williams: Jurassic Park (1993) – film screening with live orchestra"],"tiers":[{"label":"Cat 1","price":88},{"label":"Cat 2","price":68},{"label":"Cat 3","price":48},{"label":"Cat 4","price":38}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SNYO x SSO. Cat5:$28. 4+ tickets 20% off Cat1-3"},{"title":"SSO Concerts for Children: Little Red Riding Hood","conductor":"Nathanael Iselin","soloists":[],"date":"2026-09-05","time":"11:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Roald Dahl's Little Red Riding Hood – theatre & orchestra (Dandi Productions)"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Concerts for Children. Also 5 Sep 2pm & 6 Sep 11am. Ages 5+. Relaxed environment. Concert bundles."},{"title":"SSO Concerts for Children: Little Red Riding Hood","conductor":"Nathanael Iselin","soloists":[],"date":"2026-09-06","time":"11:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Roald Dahl's Little Red Riding Hood – theatre & orchestra (Dandi Productions)"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Concerts for Children. Also 5 Sep 11am & 2pm. Ages 5+. Relaxed environment. Concert bundles."},{"title":"President's Young Performers Concert 2026","conductor":"Jason Lai","soloists":[{"name":"Shi Jia Ao","role":"Bassoon"},{"name":"Natasha Da Costa","role":"Soprano"},{"name":"Kaelyn Soh","role":"Violin"}],"date":"2026-09-12","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Vaughan Williams: Overture to The Wasps; Berwald: Konzertstuck for Bassoon Op. 21","Debussy: Clair de lune (orch. Caplet); Ravel: Sheherazade","Butterworth: The Banks of Green Willow","Korngold: Violin Concerto in D major, Op. 35"],"tiers":[{"label":"Cat 1","price":75},{"label":"Cat 2","price":55},{"label":"Cat 3","price":40},{"label":"Cat 4","price":30}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"President's Young Performers Concert. Cat5:$15"},{"title":"Vasily Petrenko & Gautier Capucon – Saint-Saens & Shostakovich","conductor":"Vasily Petrenko","soloists":[{"name":"Gautier Capucon","role":"Cello"}],"date":"2026-09-18","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Part: Our Garden – Cantata for Children's Chorus and Orchestra","Saint-Saens: Cello Concerto No. 1 in A minor, Op. 33","Shostakovich: Symphony No. 4 in C minor, Op. 43"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. SSO Children's Choir. Cat5:$30, Cat6:$15"},{"title":"Vasily Petrenko & Gautier Capucon – Saint-Saens & Shostakovich","conductor":"Vasily Petrenko","soloists":[{"name":"Gautier Capucon","role":"Cello"}],"date":"2026-09-19","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Part: Our Garden – Cantata for Children's Chorus and Orchestra","Saint-Saens: Cello Concerto No. 1 in A minor, Op. 33","Shostakovich: Symphony No. 4 in C minor, Op. 43"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. SSO Children's Choir. Cat5:$30, Cat6:$15"},{"title":"Augustin Hadelich & Pierre Bleuse – Tchaikovsky Violin Concerto","conductor":"Pierre Bleuse","soloists":[{"name":"Augustin Hadelich","role":"Violin"}],"date":"2026-09-25","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Zechariah Goh: Dream(e)scapes (SSO Commission)","Tchaikovsky: Violin Concerto in D major, Op. 35","Bartok: The Miraculous Mandarin – Suite","Ravel: Daphnis et Chloe – Suite No. 2"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Concert bundles available. Cat5:$30, Cat6:$15"},{"title":"Augustin Hadelich & Pierre Bleuse – Tchaikovsky Violin Concerto","conductor":"Pierre Bleuse","soloists":[{"name":"Augustin Hadelich","role":"Violin"}],"date":"2026-09-26","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Zechariah Goh: Dream(e)scapes (SSO Commission)","Tchaikovsky: Violin Concerto in D major, Op. 35","Bartok: The Miraculous Mandarin – Suite","Ravel: Daphnis et Chloe – Suite No. 2"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Concert bundles available. Cat5:$30, Cat6:$15"},{"title":"Augustin Hadelich in Recital – Sheer Virtuosity","conductor":"","soloists":[{"name":"Augustin Hadelich","role":"Violin"}],"date":"2026-09-27","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Telemann: Fantasia No. 5; Coleridge-Taylor Perkinson: Blue/s Forms","Ysaye: Sonata No. 5 in G major, Op. 27","Telemann: Fantasia No. 8; Paganini: Caprices Nos. 19, 6, 16","J.S. Bach: Partita No. 2 in D minor, BWV 1004"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":80},{"label":"Cat 3","price":60},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Recital. Concert bundles available. Cat5:$30, Cat6:$20"},{"title":"SSO Babies' Proms","conductor":"Leonard Tan","soloists":[{"name":"William Ledbetter","role":"Presenter"}],"date":"2026-10-02","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Interactive family concert – discover the orchestra and its instruments"],"tiers":[{"label":"Cat 1","price":45},{"label":"Cat 2","price":35}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Babies' Proms. Also 3 Oct 11am & 2pm. Ages 6 and below. Free for children under 2."},{"title":"SSO Babies' Proms","conductor":"Leonard Tan","soloists":[{"name":"William Ledbetter","role":"Presenter"}],"date":"2026-10-03","time":"11:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Interactive family concert – discover the orchestra and its instruments"],"tiers":[{"label":"Cat 1","price":45},{"label":"Cat 2","price":35}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Babies' Proms. Also 3 Oct 2pm. Ages 6 and below. Free for children under 2."},{"title":"Pre-Tour Concert: Chloe Chua & Hannu Lintu – Mendelssohn & Mahler 1","conductor":"Hannu Lintu","soloists":[{"name":"Chloe Chua","role":"Violin"}],"date":"2026-10-08","time":"19:30","venue":"University Cultural Centre, NUS","city":"Singapore","program":["Wang Chenwei: The Sisters' Islands","Mendelssohn: Violin Concerto in E minor, Op. 64","Mahler: Symphony No. 1 'Titan'"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30},{"label":"Cat 3","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Pre-Tour Concert. Ahead of SSO China Tour 2026."},{"title":"Pre-Tour Concert: Mozart Sinfonia Concertante & Mahler's Titan","conductor":"Hannu Lintu","soloists":[{"name":"Chloe Chua","role":"Violin"},{"name":"He Ziyu","role":"Viola"}],"date":"2026-10-09","time":"19:30","venue":"University Cultural Centre, NUS","city":"Singapore","program":["Mozart: Sinfonia Concertante for Violin, Viola and Orchestra, K. 364","Mahler: Symphony No. 1 'Titan'"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30},{"label":"Cat 3","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Pre-Tour Concert. Ahead of SSO China Tour 2026."},{"title":"SSO @ Woodlands Hospital","conductor":"","soloists":[],"date":"2026-10-23","time":"19:30","venue":"Woodlands Hospital","city":"Singapore","program":[],"tiers":[],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Free community concert. Musicians of the SSO."},{"title":"SSO Organ Series: Phantoms and Organs","conductor":"","soloists":[{"name":"Phoon Yu","role":"Organ"}],"date":"2026-11-01","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Mendelssohn: Organ Sonata No. 6 (excerpt); Vierne: Fantomes","Bach: Prelude and Fugue in F minor, BWV 534","Phoon Yu: What the Next-door Neighbour Saw","Mendelssohn: Allegro molto from Organ Sonata No. 1"],"tiers":[{"label":"Cat 1","price":30},{"label":"Cat 2","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Organ Series. 4+ tickets 15% off Cat 1."},{"title":"Sibelius & Wagner – Finlandia & Gotterdammerung","conductor":"Pietari Inkinen","soloists":[{"name":"Johanna Rusanen","role":"Soprano"}],"date":"2026-11-06","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Sibelius: Finlandia (with chorus); songs for soprano and orchestra","Sibelius: Lemminkäinen's Return","Wagner (arr. Inkinen): Scenes from Gotterdammerung incl. Funeral March & Immolation Scene"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. SSO Chorus & Youth Choir. Cat5:$30, Cat6:$15"},{"title":"SSO Concerts for Children: Family Film Favourites","conductor":"Nathanael Iselin","soloists":[{"name":"Alasdair Malloy","role":"Presenter"}],"date":"2026-11-14","time":"11:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Music from Star Wars, Harry Potter, Encanto and more"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Concerts for Children. Also 14 Nov 2pm & 15 Nov 11am. Ages 5+. Relaxed environment. Concert bundles."},{"title":"SSO Concerts for Children: Family Film Favourites","conductor":"Nathanael Iselin","soloists":[{"name":"Alasdair Malloy","role":"Presenter"}],"date":"2026-11-15","time":"11:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Music from Star Wars, Harry Potter, Encanto and more"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Concerts for Children. Also 14 Nov 11am & 2pm. Ages 5+. Relaxed environment. Concert bundles."},{"title":"SSO Chamber: Schubert's Octet with Paul Huang","conductor":"","soloists":[{"name":"Paul Huang","role":"Violin"}],"date":"2026-11-19","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Schubert: Octet in F major, D. 803"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30},{"label":"Cat 3","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Chamber Series. Musicians of the SSO."},{"title":"Lio Kuokman & Paul Huang – Dvorak Violin Concerto & Beethoven 7","conductor":"Lio Kuokman","soloists":[{"name":"Paul Huang","role":"Violin"}],"date":"2026-11-20","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Unsuk Chin: subito con forza","Dvorak: Violin Concerto in A minor, Op. 53","Beethoven: Symphony No. 7 in A major, Op. 92"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Cat5:$30, Cat6:$15"},{"title":"Lio Kuokman & Paul Huang – Dvorak Violin Concerto & Beethoven 7","conductor":"Lio Kuokman","soloists":[{"name":"Paul Huang","role":"Violin"}],"date":"2026-11-21","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Unsuk Chin: subito con forza","Dvorak: Violin Concerto in A minor, Op. 53","Beethoven: Symphony No. 7 in A major, Op. 92"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Cat5:$30, Cat6:$15"},{"title":"Hannu Lintu & Simone Lamsma – John Adams Violin Concerto","conductor":"Hannu Lintu","soloists":[{"name":"Simone Lamsma","role":"Violin"}],"date":"2026-11-27","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Copland: Appalachian Spring – Suite for Full Orchestra","John Adams: Violin Concerto","Schumann: Symphony No. 4 in D minor, Op. 120"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Cat5:$30, Cat6:$15"},{"title":"Hannu Lintu & Simone Lamsma – John Adams Violin Concerto","conductor":"Hannu Lintu","soloists":[{"name":"Simone Lamsma","role":"Violin"}],"date":"2026-11-28","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Copland: Appalachian Spring – Suite for Full Orchestra","John Adams: Violin Concerto","Schumann: Symphony No. 4 in D minor, Op. 120"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Cat5:$30, Cat6:$15"},{"title":"Hannu Lintu & Steven Isserlis – Schubert & Schumann Unfinished","conductor":"Hannu Lintu","soloists":[{"name":"Steven Isserlis","role":"Cello"}],"date":"2026-12-04","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Schubert: Symphony No. 8 in B minor, D. 759 'Unfinished'","Schumann: Cello Concerto in A minor, Op. 129","Schubert/Berio: Rendering"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Dedicated to late Maestro Choo Hoey. Cat5:$30, Cat6:$15"},{"title":"Hannu Lintu & Steven Isserlis – Schubert & Schumann Unfinished","conductor":"Hannu Lintu","soloists":[{"name":"Steven Isserlis","role":"Cello"}],"date":"2026-12-05","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Schubert: Symphony No. 8 in B minor, D. 759 'Unfinished'","Schumann: Cello Concerto in A minor, Op. 129","Schubert/Berio: Rendering"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Dedicated to late Maestro Choo Hoey. Cat5:$30, Cat6:$15"},{"title":"SSO Christmas Concert 2026","conductor":"Nathanael Iselin","soloists":[],"date":"2026-12-11","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Tchaikovsky: Selections from The Nutcracker (incl. complete Act 2)","Rutter: Gloria","Christmas favourites (singalong)"],"tiers":[{"label":"Cat 1","price":228},{"label":"Cat 2","price":168},{"label":"Cat 3","price":108},{"label":"Cat 4","price":88}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Christmas Concert. SSO Choruses. Cat5:$68, Cat6:$48. Livestreamed."},{"title":"SSO Christmas Concert 2026","conductor":"Nathanael Iselin","soloists":[],"date":"2026-12-12","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Tchaikovsky: Selections from The Nutcracker (incl. complete Act 2)","Rutter: Gloria","Christmas favourites (singalong)"],"tiers":[{"label":"Cat 1","price":228},{"label":"Cat 2","price":168},{"label":"Cat 3","price":108},{"label":"Cat 4","price":88}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Christmas Concert. SSO Choruses. Cat5:$68, Cat6:$48. Livestreamed."},{"title":"SSO Pops: On My Own – Nathania Ong with the SSO","conductor":"Joshua Tan","soloists":[{"name":"Nathania Ong","role":"Vocalist"},{"name":"Preston Lim","role":"Vocalist"},{"name":"Vanessa Kee","role":"Vocalist"}],"date":"2026-12-17","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Songs from Les Miserables, Frozen, Wicked and more","Musical Theatre, Broadway & Disney favourites"],"tiers":[{"label":"Cat 1","price":148},{"label":"Cat 2","price":118},{"label":"Cat 3","price":88},{"label":"Cat 4","price":68}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Pops. 4+ tickets 20% off Cat1-4. Cat5:$48, Cat6:$28"},{"title":"SSO Pops: On My Own – Nathania Ong with the SSO","conductor":"Joshua Tan","soloists":[{"name":"Nathania Ong","role":"Vocalist"},{"name":"Preston Lim","role":"Vocalist"},{"name":"Vanessa Kee","role":"Vocalist"}],"date":"2026-12-18","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Songs from Les Miserables, Frozen, Wicked and more","Musical Theatre, Broadway & Disney favourites"],"tiers":[{"label":"Cat 1","price":148},{"label":"Cat 2","price":118},{"label":"Cat 3","price":88},{"label":"Cat 4","price":68}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Pops. 4+ tickets 20% off Cat1-4. Cat5:$48, Cat6:$28"},{"title":"Hannu Lintu & Inmo Yang – Sibelius Violin Concerto","conductor":"Hannu Lintu","soloists":[{"name":"Inmo Yang","role":"Violin"}],"date":"2027-01-08","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Lera Auerbach: Icarus (Singapore Premiere)","Sibelius: Violin Concerto in D minor, Op. 47","Tchaikovsky: Romeo & Juliet Fantasy Overture","Scriabin: The Poem of Ecstasy, Op. 54"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Cat5:$30, Cat6:$15"},{"title":"Hannu Lintu & Inmo Yang – Sibelius Violin Concerto","conductor":"Hannu Lintu","soloists":[{"name":"Inmo Yang","role":"Violin"}],"date":"2027-01-09","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Lera Auerbach: Icarus (Singapore Premiere)","Sibelius: Violin Concerto in D minor, Op. 47","Tchaikovsky: Romeo & Juliet Fantasy Overture","Scriabin: The Poem of Ecstasy, Op. 54"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Cat5:$30, Cat6:$15"},{"title":"Haochen Zhang & Hannu Lintu – Prokofiev Piano Concerto 2","conductor":"Hannu Lintu","soloists":[{"name":"Haochen Zhang","role":"Piano"}],"date":"2027-01-15","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Donghoon Shin: Upon His Ghostly Solitude (Singapore Premiere)","Prokofiev: Piano Concerto No. 2 in G minor, Op. 16","Stravinsky: Song of the Nightingale","John Adams: Slonimsky's Earbox (Singapore Premiere)"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Cat5:$30, Cat6:$15"},{"title":"Lan Shui & Liao Chang Yong – Songs of a Wayfarer","conductor":"Lan Shui","soloists":[{"name":"Liao Chang Yong","role":"Baritone"}],"date":"2027-01-29","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Dvorak: Carnival Overture","Mahler: Songs of a Wayfarer","Brahms: Piano Quartet No. 1 (orch. Schoenberg)"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Conductor Laureate homecoming. Dedicated to late Dr Goh Keng Swee. Cat5:$30, Cat6:$15"},{"title":"SSO Chamber: Lan Shui conducts Stravinsky, Schoenberg & Mozart","conductor":"Lan Shui","soloists":[],"date":"2027-01-31","time":"16:00","venue":"School of the Arts (SOTA) Concert Hall","city":"Singapore","program":["Stravinsky: Dumbarton Oaks","Schoenberg: Chamber Symphony No. 1","Mozart: Symphony No. 38 'Prague', K. 504"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30},{"label":"Cat 3","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Chamber Series. Musicians of the SSO."},{"title":"Symphony in the Gardens","conductor":"","soloists":[],"date":"2027-02-20","time":"18:00","venue":"Shaw Foundation Symphony Stage, Singapore Botanic Gardens","city":"Singapore","program":[],"tiers":[],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Free outdoor community concert. Singapore Botanic Gardens."},{"title":"Francois Leleux – Mozart, Prokofiev & Brahms","conductor":"Francois Leleux","soloists":[{"name":"Francois Leleux","role":"Oboe"}],"date":"2027-02-27","time":"19:30","venue":"Yong Siew Toh Conservatory Concert Hall","city":"Singapore","program":["Prokofiev: Symphony No. 1 'Classical', Op. 25","Mozart: Oboe Concerto in C major, K. 314","Brahms: Symphony No. 1 in C minor, Op. 68"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. 27 Feb at YST 7.30pm; 28 Feb at SOTA 4pm. SSO debut. Cat5:$30, Cat6:$15"},{"title":"Francois Leleux – Mozart, Prokofiev & Brahms","conductor":"Francois Leleux","soloists":[{"name":"Francois Leleux","role":"Oboe"}],"date":"2027-02-28","time":"16:00","venue":"School of the Arts (SOTA) Concert Hall","city":"Singapore","program":["Prokofiev: Symphony No. 1 'Classical', Op. 25","Mozart: Oboe Concerto in C major, K. 314","Brahms: Symphony No. 1 in C minor, Op. 68"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. 27 Feb at YST 7.30pm; 28 Feb at SOTA 4pm. SSO debut. Cat5:$30, Cat6:$15"},{"title":"Hans Graf & Benjamin Schmid – Prokofiev, Paganini & Pines of Rome","conductor":"Hans Graf","soloists":[{"name":"Benjamin Schmid","role":"Violin"}],"date":"2027-03-05","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Hindemith: Symphony: Mathis der Maler","Prokofiev: Violin Concerto No. 1 in D major, Op. 19","Kreisler: Violin Concerto in One Movement (after Paganini)","Respighi: Pines of Rome"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Conductor Laureate homecoming. Cat5:$30, Cat6:$15"},{"title":"Hans Graf & Benjamin Schmid – Prokofiev, Paganini & Pines of Rome","conductor":"Hans Graf","soloists":[{"name":"Benjamin Schmid","role":"Violin"}],"date":"2027-03-06","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Hindemith: Symphony: Mathis der Maler","Prokofiev: Violin Concerto No. 1 in D major, Op. 19","Kreisler: Violin Concerto in One Movement (after Paganini)","Respighi: Pines of Rome"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Conductor Laureate homecoming. Cat5:$30, Cat6:$15"},{"title":"SSO Organ Series: The Hebrides – Martin Schmeding Organ Recital","conductor":"","soloists":[{"name":"Martin Schmeding","role":"Organ"}],"date":"2027-03-07","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Mendelssohn: The Hebrides (arr. Schmeding); Bach: Fantasia & Fugue in G minor, BWV 542","Jehan Alain: Deuxieme Fantaisie; Beethoven: Fantasia in G minor, Op. 77","Sigfrid Karg-Elert: The Soul of the Lake; Stanford: Fantasia & Toccata in D minor, Op. 57","Max Reger: Choral Fantasy on Halleluja!"],"tiers":[{"label":"Cat 1","price":10}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Organ Series. Single ticket: $10."},{"title":"Markus Stenz & Vadym Kholodenko – Schumann & Bruckner 7","conductor":"Markus Stenz","soloists":[{"name":"Vadym Kholodenko","role":"Piano"}],"date":"2027-03-12","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Schumann: Piano Concerto in A minor, Op. 54","Bruckner: Symphony No. 7 in E major, WAB 107"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Van Cliburn Gold Medallist. Cat5:$30, Cat6:$15"},{"title":"SSO Concerts for Children: A Magical Musical Meander","conductor":"Joshua Tan","soloists":[{"name":"Harry Wong","role":"Magician"}],"date":"2027-03-20","time":"11:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Orchestral music of fantasy & whimsy – interactive concert with magic"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Concerts for Children. Also 20 Mar 2pm & 21 Mar 11am. Ages 5+. Relaxed environment. Concert bundles."},{"title":"SSO Concerts for Children: A Magical Musical Meander","conductor":"Joshua Tan","soloists":[{"name":"Harry Wong","role":"Magician"}],"date":"2027-03-21","time":"11:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Orchestral music of fantasy & whimsy – interactive concert with magic"],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Concerts for Children. Also 20 Mar 11am & 2pm. Ages 5+. Relaxed environment. Concert bundles."},{"title":"Hannu Lintu & Qin Li-Wei – Don Quixote & Brahms 2","conductor":"Hannu Lintu","soloists":[{"name":"Qin Li-Wei","role":"Cello"},{"name":"Manchin Zhang","role":"Viola"}],"date":"2027-03-26","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Beethoven: The Consecration of the House, Op. 124","R. Strauss: Don Quixote","Brahms: Symphony No. 2 in D major, Op. 73"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Beethoven bicentenary. Cat5:$30, Cat6:$15"},{"title":"SSO Chamber: Tchaikovsky & Schumann Quartets","conductor":"","soloists":[],"date":"2027-03-28","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Tchaikovsky: String Quartet No. 1 in D major, Op. 11","Schumann: Piano Quartet in E-flat major, Op. 47"],"tiers":[{"label":"Cat 1","price":30},{"label":"Cat 2","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Chamber Series. Musicians of the SSO. 25% concession."},{"title":"Clara Jumi Kang & Mark Wigglesworth – Beethoven 5","conductor":"Mark Wigglesworth","soloists":[{"name":"Clara Jumi Kang","role":"Violin"}],"date":"2027-04-02","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Mahler: What the Wild Flowers Tell Me (arr. Britten, Singapore Premiere)","Britten: Violin Concerto, Op. 15","Beethoven: Symphony No. 5 in C minor, Op. 67"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. SSO debut of Clara Jumi Kang. Cat5:$30, Cat6:$15"},{"title":"Clara Jumi Kang & Mark Wigglesworth – Beethoven 5","conductor":"Mark Wigglesworth","soloists":[{"name":"Clara Jumi Kang","role":"Violin"}],"date":"2027-04-03","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Mahler: What the Wild Flowers Tell Me (arr. Britten, Singapore Premiere)","Britten: Violin Concerto, Op. 15","Beethoven: Symphony No. 5 in C minor, Op. 67"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Saturday Afternoon Concert – starts 4pm. Cat5:$30, Cat6:$15"},{"title":"Gabor Takacs-Nagy – Bartok Viola Concerto & Beethoven Pastoral","conductor":"Gabor Takacs-Nagy","soloists":[{"name":"Mate Szucs","role":"Viola"}],"date":"2027-04-09","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Haydn: Symphony No. 101 'The Clock'","Bartok: Viola Concerto","Beethoven: Symphony No. 6 'Pastoral', Op. 68"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Cat5:$30, Cat6:$15"},{"title":"Gabor Takacs-Nagy – Bartok Viola Concerto & Beethoven Pastoral","conductor":"Gabor Takacs-Nagy","soloists":[{"name":"Mate Szucs","role":"Viola"}],"date":"2027-04-10","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Haydn: Symphony No. 101 'The Clock'","Bartok: Viola Concerto","Beethoven: Symphony No. 6 'Pastoral', Op. 68"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Saturday Afternoon Concert – starts 4pm. Cat5:$30, Cat6:$15"},{"title":"SSO Gala: Marin Alsop & James Ehnes – Elgar Violin Concerto","conductor":"Marin Alsop","soloists":[{"name":"James Ehnes","role":"Violin"}],"date":"2027-04-16","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["John Adams: The Rock You Stand On (Asian Premiere)","Barber: Symphony No. 1, Op. 9","Elgar: Violin Concerto in B minor, Op. 61"],"tiers":[{"label":"Cat 1","price":138},{"label":"Cat 2","price":108},{"label":"Cat 3","price":78},{"label":"Cat 4","price":58}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Gala. Singapore debut of Marin Alsop. Cat5:$38, Cat6:$28"},{"title":"SSO Gala: Marin Alsop & James Ehnes – Elgar Violin Concerto","conductor":"Marin Alsop","soloists":[{"name":"James Ehnes","role":"Violin"}],"date":"2027-04-17","time":"16:00","venue":"Esplanade Concert Hall","city":"Singapore","program":["John Adams: The Rock You Stand On (Asian Premiere)","Barber: Symphony No. 1, Op. 9","Elgar: Violin Concerto in B minor, Op. 61"],"tiers":[{"label":"Cat 1","price":138},{"label":"Cat 2","price":108},{"label":"Cat 3","price":78},{"label":"Cat 4","price":58}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Gala. Saturday Afternoon Concert – starts 4pm. Cat5:$38, Cat6:$28"},{"title":"Stefan Dohr & Dinis Sousa – Strauss Horn Concerto 2 & Schumann Spring","conductor":"Dinis Sousa","soloists":[{"name":"Stefan Dohr","role":"Horn"}],"date":"2027-04-23","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Brahms: Tragic Overture","R. Strauss: Horn Concerto No. 2 in E-flat major","Schumann: Symphony No. 1 'Spring', Op. 38"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Berlin Philharmonic Principal Horn. Cat5:$30, Cat6:$15"},{"title":"Stefan Dohr & Dinis Sousa – Strauss Horn Concerto 2 & Schumann Spring","conductor":"Dinis Sousa","soloists":[{"name":"Stefan Dohr","role":"Horn"}],"date":"2027-04-24","time":"16:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Brahms: Tragic Overture","R. Strauss: Horn Concerto No. 2 in E-flat major","Schumann: Symphony No. 1 'Spring', Op. 38"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. Saturday Afternoon Concert – starts 4pm. Cat5:$30, Cat6:$15"},{"title":"SSO Gala: Verdi's Requiem – Theatre of Eternity","conductor":"Hannu Lintu","soloists":[{"name":"Iwona Sobotka","role":"Soprano"},{"name":"Olesya Petrova","role":"Mezzo-Soprano"},{"name":"Joshua Guerrero","role":"Tenor"}],"date":"2027-04-29","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Verdi: Messa da Requiem"],"tiers":[{"label":"Cat 1","price":138},{"label":"Cat 2","price":108},{"label":"Cat 3","price":78},{"label":"Cat 4","price":58}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Gala. Also bass Alexander Vinogradov. SSO Chorus, Youth Choir & Symphonia Choralis. Cat5:$38, Cat6:$28"},{"title":"SSO Gala: Verdi's Requiem – Theatre of Eternity","conductor":"Hannu Lintu","soloists":[{"name":"Iwona Sobotka","role":"Soprano"},{"name":"Olesya Petrova","role":"Mezzo-Soprano"},{"name":"Joshua Guerrero","role":"Tenor"}],"date":"2027-04-30","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["Verdi: Messa da Requiem"],"tiers":[{"label":"Cat 1","price":138},{"label":"Cat 2","price":108},{"label":"Cat 3","price":78},{"label":"Cat 4","price":58}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Gala. Also bass Alexander Vinogradov. SSO Chorus, Youth Choir & Symphonia Choralis. Cat5:$38, Cat6:$28"},{"title":"Nobuyuki Tsujii & Hannu Lintu – Rachmaninoff Piano Concerto 3","conductor":"Hannu Lintu","soloists":[{"name":"Nobuyuki Tsujii","role":"Piano"}],"date":"2027-05-06","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["John Adams: Harmonielehre (Singapore Premiere)","Rachmaninoff: Piano Concerto No. 3 in D minor, Op. 30"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. SSO debut of Nobuyuki Tsujii. Cat5:$30, Cat6:$15"},{"title":"Nobuyuki Tsujii & Hannu Lintu – Rachmaninoff Piano Concerto 3","conductor":"Hannu Lintu","soloists":[{"name":"Nobuyuki Tsujii","role":"Piano"}],"date":"2027-05-07","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["John Adams: Harmonielehre (Singapore Premiere)","Rachmaninoff: Piano Concerto No. 3 in D minor, Op. 30"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. SSO debut of Nobuyuki Tsujii. Cat5:$30, Cat6:$15"},{"title":"SSO Mother's Day Concert","conductor":"Hannu Lintu","soloists":[],"date":"2027-05-09","time":"18:00","venue":"Shaw Foundation Symphony Stage, Singapore Botanic Gardens","city":"Singapore","program":[],"tiers":[],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Free outdoor community concert. Singapore Botanic Gardens."},{"title":"Jean-Efflam Bavouzet & Umberto Clerici – Beethoven Piano Concerto 3","conductor":"Umberto Clerici","soloists":[{"name":"Jean-Efflam Bavouzet","role":"Piano"}],"date":"2027-05-13","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Schubert: Rosamunde Overture","Beethoven: Piano Concerto No. 3 in C minor, Op. 37","Mendelssohn: Symphony No. 3 'Scottish', Op. 56"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. SSO debut of Umberto Clerici. Cat5:$30, Cat6:$15"},{"title":"Jean-Efflam Bavouzet & Umberto Clerici – Beethoven Piano Concerto 3","conductor":"Umberto Clerici","soloists":[{"name":"Jean-Efflam Bavouzet","role":"Piano"}],"date":"2027-05-14","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":["Schubert: Rosamunde Overture","Beethoven: Piano Concerto No. 3 in C minor, Op. 37","Mendelssohn: Symphony No. 3 'Scottish', Op. 56"],"tiers":[{"label":"Cat 1","price":100},{"label":"Cat 2","price":75},{"label":"Cat 3","price":55},{"label":"Cat 4","price":40}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Subscription Concert. SSO debut of Umberto Clerici. Cat5:$30, Cat6:$15"},{"title":"SSO Chamber: Divertissement","conductor":"","soloists":[],"date":"2027-05-16","time":"19:30","venue":"Esplanade Black Room","city":"Singapore","program":["Mozart: Eine kleine Nachtmusik & Horn Quintet, K. 407 (selected mvts)","Brahms: Clarinet Quintet in B minor, Op. 115","Jean Francaix: Divertissement for Bassoon and String Quintet","Beethoven: Septet in E-flat major, Op. 20"],"tiers":[{"label":"Cat 1","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Chamber Series. Esplanade Black Room. Single ticket: $20. 20% concession."},{"title":"SSO Pops: Kapustin, Gershwin & E.T. – Rhapsody in Blue","conductor":"Joshua Tan","soloists":[{"name":"Frank Dupree","role":"Piano"},{"name":"Obi Jenne","role":"Drums"}],"date":"2027-05-20","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["John Williams: E.T. The Extra-Terrestrial – Symphonic Suite","Nikolai Kapustin: Piano Concerto No. 2, Op. 14 (Singapore Premiere)","George Gershwin: Rhapsody in Blue","Kevin Puts: Concerto for Orchestra (Singapore Premiere)"],"tiers":[{"label":"Cat 1","price":128},{"label":"Cat 2","price":98},{"label":"Cat 3","price":68},{"label":"Cat 4","price":48}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Pops. 4+ tickets 20% off Cat1-4. Cat5:$38, Cat6:$28"},{"title":"SSO Pops: Kapustin, Gershwin & E.T. – Rhapsody in Blue","conductor":"Joshua Tan","soloists":[{"name":"Frank Dupree","role":"Piano"},{"name":"Obi Jenne","role":"Drums"}],"date":"2027-05-21","time":"19:30","venue":"Esplanade Concert Hall","city":"Singapore","program":["John Williams: E.T. The Extra-Terrestrial – Symphonic Suite","Nikolai Kapustin: Piano Concerto No. 2, Op. 14 (Singapore Premiere)","George Gershwin: Rhapsody in Blue","Kevin Puts: Concerto for Orchestra (Singapore Premiere)"],"tiers":[{"label":"Cat 1","price":128},{"label":"Cat 2","price":98},{"label":"Cat 3","price":68},{"label":"Cat 4","price":48}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Pops. 4+ tickets 20% off Cat1-4. Cat5:$38, Cat6:$28"},{"title":"SSO Chamber: Music for VIPs","conductor":"","soloists":[],"date":"2027-05-30","time":"15:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Haydn: String Quartet No. 3 'Emperor' (selected mvts)","Mozart: String Quartet No. 23, K. 590 'Prussian No. 3' (selected mvts)","Beethoven: String Quartet No. 11, Op. 95 'Serioso' (selected mvts)"],"tiers":[{"label":"Cat 1","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Chamber Series. Part of SSO Open House 2027. Single ticket: $20. 25% concession."},{"title":"SSO Open House 2027","conductor":"","soloists":[],"date":"2027-05-30","time":"09:00","venue":"Victoria Concert Hall","city":"Singapore","program":["Family musical activities in and around Victoria Concert Hall"],"tiers":[],"url":"https://www.sso.org.sg","detailUrl":"","notes":"Free family open house event. 9am to 6pm."},{"title":"SSO Organ Series: Pipe Organ Pocket Musical","conductor":"","soloists":[{"name":"Koh Jia Hwei","role":"Organ"}],"date":"2027-06-05","time":"19:30","venue":"Victoria Concert Hall","city":"Singapore","program":[],"tiers":[{"label":"Cat 1","price":40},{"label":"Cat 2","price":30},{"label":"Cat 3","price":20}],"url":"https://www.sso.org.sg","detailUrl":"","notes":"SSO Organ Series. Cat1:$40, Cat2:$30, Cat3:$20. 25% concession Cat2-3."}];

function BulkImportModal({onClose,onAdd,isAdmin}) {
  const STEPS={INPUT:"input",LOADING:"loading",REVIEW:"review",DONE:"done"};
  const [step,setStep]=useState(STEPS.INPUT);
  const [inputMode,setInputMode]=useState("file");
  const [pasteText,setPasteText]=useState("");
  const [fileName,setFileName]=useState("");
  const [progress,setProgress]=useState({msg:"",pct:0});
  const [error,setError]=useState("");
  const [items,setItems]=useState([]);
  const [selected,setSelected]=useState({});
  const [expanded,setExpanded]=useState({});
  const fileRef=useRef();

  const loadXLSX=()=>new Promise((resolve,reject)=>{
    if(window.XLSX){resolve(window.XLSX);return;}
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload=()=>resolve(window.XLSX);
    s.onerror=()=>reject(new Error("Could not load spreadsheet library"));
    document.head.appendChild(s);
  });

  const handleFile=async(file)=>{
    setError("");setFileName(file.name);
    try{
      const XLSX=await loadXLSX();
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:"array"});
      const sheetName=wb.SheetNames.find(n=>n!=="Instructions")||wb.SheetNames[0];
      const raw=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{defval:""});
      const rows=raw.filter(r=>{const t=String(r["Concert Title"]||r["title"]||"").trim();return t&&!t.toLowerCase().startsWith("required")&&t.length>0;});
      if(!rows.length) throw new Error("No concert rows found. Check the file uses the Ensemble template columns.");
      buildItems(xlsxRowsToConcerts(rows));
    }catch(e){setError(e.message);setFileName("");}
  };

  const xlsxRowsToConcerts=rows=>rows.map(r=>{
    const g=(...keys)=>{for(const k of keys){const v=r[k];if(v!==undefined&&v!=="")return String(v).trim();}return "";};
    const soloists=[1,2,3].map(n=>({name:g(`Soloist ${n} \u2014 Name`,`soloist_${n}_name`),role:g(`Soloist ${n} \u2014 Instrument`,`soloist_${n}_role`)})).filter(s=>s.name);
    const program=[1,2,3,4].map(n=>g(`Programme \u2014 Work ${n}`,`program_${n}`)).filter(Boolean);
    const tiers=[1,2,3,4].map(n=>({label:g(`Ticket Cat ${n} \u2014 Label`,`tier_${n}_label`),price:parseInt(g(`Ticket Cat ${n} \u2014 Price ($)`,`tier_${n}_price`))||0})).filter(t=>t.label&&t.price>0);
    let date=g("Date (YYYY-MM-DD)","date","Date");
    if(/^\d{5}$/.test(date)){const d=new Date(Math.round((parseFloat(date)-25569)*86400*1000));date=d.toISOString().slice(0,10);}
    else if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)){const[d,m,y]=date.split("/");date=`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;}
    return{title:g("Concert Title","title"),conductor:g("Conductor","conductor"),soloists,date,time:g("Time (HH:MM)","time","Time")||"19:30",venue:g("Venue","venue"),city:g("City","city"),detailUrl:g("Concert Detail URL","detailUrl","detail_url"),url:g("Ticketing URL","ticketing_url","url"),program,tiers,notes:g("Notes","notes")};
  });

  const extractFromText=async text=>{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,
        system:`Extract concert listings from text. Return ONLY a raw JSON array where each element has: title, conductor, soloists (array of {name,role}), date (YYYY-MM-DD or ""), time (HH:MM 24h), venue, city, detailUrl, program (array of strings), tiers (array of {label,price}), notes. Extract ALL concerts. List every named soloist.`,
        messages:[{role:"user",content:`Extract all concerts from this text:\n\n${text.slice(0,18000)}`}]})});
    const d=await res.json();
    if(d.error)throw new Error(d.error.message||"Claude API error");
    const raw=d.content?.[0]?.text||"[]";
    let p=JSON.parse(raw.replace(/```json|```/g,"").trim());
    if(!Array.isArray(p))p=[p];
    return p;
  };

  const buildItems=concerts=>{
    const editable=concerts.map(c=>({...c,_id:uid(),
      _programText:(c.program||[]).join("\n"),
      _tiersText:(c.tiers||[]).length>0?c.tiers.map(t=>`${t.label}, ${t.price}`).join("\n"):"Cat 1, 98\nCat 2, 78\nCat 3, 55\nCat 4, 38",
      soloists:c.soloists||[]}));
    const sel={};editable.forEach(c=>sel[c._id]=true);
    setItems(editable);setSelected(sel);setStep(STEPS.REVIEW);
  };

  const runImport=async()=>{
    if(inputMode==="paste"&&!pasteText.trim()){setError("Please paste some text first.");return;}
    setStep(STEPS.LOADING);setProgress({msg:"Sending to Claude…",pct:30});
    try{
      const raw=await extractFromText(pasteText);
      setProgress({msg:`Found ${raw.length} concerts`,pct:100});
      if(!raw.length)throw new Error("No concerts found.");
      buildItems(raw);
    }catch(e){setError(e.message||"Import failed.");setStep(STEPS.INPUT);}
  };

  const parseTiers=raw=>raw.split("\n").map(l=>{const[label,...rest]=l.split(",");const price=parseInt(rest.join("").trim());return{label:label?.trim()||"",price:price||0};}).filter(t=>t.label&&t.price>0);
  const updateItem=(id,key,val)=>setItems(prev=>prev.map(c=>c._id===id?{...c,[key]:val}:c));
  const selectedCount=Object.values(selected).filter(Boolean).length;
  const toggleAll=()=>{const allOn=items.every(c=>selected[c._id]);const s={};items.forEach(c=>s[c._id]=!allOn);setSelected(s);};
  const handleAdd=()=>{
    const toAdd=items.filter(c=>selected[c._id]).map(c=>({title:c.title,conductor:c.conductor||"",soloists:c.soloists||[],date:c.date||"",time:c.time||"19:30",venue:c.venue||"",city:c.city||"",url:c.url||"",detailUrl:c.detailUrl||"",program:c._programText.split("\n").map(s=>s.trim()).filter(Boolean),tiers:parseTiers(c._tiersText),notes:c.notes||""}));
    onAdd(toAdd);setStep(STEPS.DONE);
  };

  // ── Input step ──
  if(step===STEPS.INPUT) return(
    <Modal title="Bulk Import" subtitle="Import a full season in one go." onClose={onClose} wide>
      <div style={{display:"flex",gap:2,marginBottom:20,borderBottom:`1px solid ${G.border}`,paddingBottom:12}}>
        {[["file","Upload File"],["paste","Paste Text"]].map(([k,l])=>(
          <button key={k} onClick={()=>{setInputMode(k);setError("");}} style={{background:"none",border:"none",
            padding:"5px 16px",color:inputMode===k?G.gold:G.textDim,
            borderBottom:inputMode===k?`2px solid ${G.gold}`:"2px solid transparent",
            fontSize:11,letterSpacing:".1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>{l}</button>
        ))}
      </div>

      {inputMode==="file"&&<div>
        <div style={{fontSize:13,color:G.textDim,marginBottom:14,lineHeight:1.7}}>
          Upload your filled Ensemble template (<span style={{color:G.creamDim}}>.xlsx or .csv</span>), or load the SSO 2026/27 season directly below.
        </div>
        <div onClick={()=>fileRef.current?.click()}
          onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=G.gold;}}
          onDragLeave={e=>e.currentTarget.style.borderColor=G.border}
          onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor=G.border;const f=e.dataTransfer.files[0];if(f)handleFile(f);}}
          style={{border:`2px dashed ${fileName?G.goldDim:G.border}`,borderRadius:3,padding:"24px 20px",
            textAlign:"center",cursor:"pointer",marginBottom:14,transition:"border-color .2s",background:fileName?G.goldFaint:G.bg}}>
          <div style={{fontSize:22,marginBottom:8}}>{fileName?"📊":"📁"}</div>
          {fileName
            ?<div style={{fontSize:13,color:G.gold}}>{fileName}</div>
            :<div><div style={{fontSize:13,color:G.creamDim,marginBottom:4}}>Drop file here, or click to browse</div>
              <div style={{fontSize:11,color:G.textDim}}>.xlsx or .csv · Ensemble template format</div></div>}
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
        <div style={{padding:"12px 14px",background:"#0F0E08",border:`1px solid ${G.border}`,borderRadius:2,marginBottom:4}}>
          <div style={{fontSize:12,color:G.creamDim,marginBottom:8,fontWeight:500}}>SSO 2026/27 already scraped</div>
          <div style={{fontSize:12,color:G.textDim,marginBottom:10}}>All 84 concerts are ready to review — no upload needed.</div>
          <Btn variant="ghost" size="sm" onClick={()=>buildItems(SSO_2026_27)}>Load SSO 2026/27 Season (84 concerts) →</Btn>
        </div>
      </div>}

      {inputMode==="paste"&&<div>
        <div style={{fontSize:13,color:G.textDim,marginBottom:12,lineHeight:1.6}}>
          Copy the full text of a concert listing page and paste below. Claude will extract all concerts.
        </div>
        <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} rows={11}
          placeholder="Paste page text here…"
          style={{width:"100%",background:G.bg,border:`1px solid ${G.border}`,color:G.text,borderRadius:2,
            padding:"9px 12px",fontSize:12,outline:"none",resize:"vertical",fontFamily:"'Jost',sans-serif",
            lineHeight:1.6,marginBottom:8}}/>
      </div>}

      {error&&<div style={{marginTop:10,fontSize:12,color:G.red,padding:"7px 12px",background:G.redFaint,borderRadius:2,border:`1px solid #4A1810`}}>{error}</div>}
      <div style={{marginTop:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Btn variant="ghostDim" size="sm" onClick={onClose}>Cancel</Btn>
        {inputMode==="paste"&&<Btn variant="primary" onClick={runImport} disabled={!pasteText.trim()}>Extract from Text</Btn>}
      </div>
    </Modal>
  );

  if(step===STEPS.LOADING) return(
    <Modal title="Importing…" onClose={onClose} wide>
      <div style={{padding:"32px 0",textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:20,animation:"spin 2s linear infinite",display:"inline-block"}}>◎</div>
        <div style={{fontSize:14,color:G.cream,marginBottom:10}}>{progress.msg}</div>
        <div style={{height:2,background:G.border,borderRadius:2,maxWidth:300,margin:"0 auto"}}>
          <div style={{height:"100%",background:G.gold,borderRadius:2,width:`${progress.pct}%`,transition:"width .6s ease"}}/>
        </div>
      </div>
    </Modal>
  );

  if(step===STEPS.DONE) return(
    <Modal title="Import Complete" onClose={onClose} wide>
      <div style={{padding:"28px 0",textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:12}}>✓</div>
        <div style={{fontSize:15,color:G.cream,marginBottom:6}}>{selectedCount} concerts added</div>
        <div style={{fontSize:13,color:G.textDim,marginBottom:24}}>{isAdmin?"Live on the Concerts tab.":"Submitted for organiser approval."}</div>
        <Btn onClick={onClose} variant="ghost">Close</Btn>
      </div>
    </Modal>
  );

  // ── Review step ──
  return(
    <Modal title="Review Extracted Concerts"
      subtitle={`${items.length} concerts found · ${selectedCount} selected · Review and edit before adding`}
      onClose={onClose} maxW={820}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${G.border}`}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={toggleAll} style={{background:"none",border:"none",cursor:"pointer",
            display:"flex",alignItems:"center",gap:6,color:G.textDim,fontSize:11,
            fontFamily:"'Jost',sans-serif",letterSpacing:".08em",textTransform:"uppercase"}}>
            <div style={{width:16,height:16,border:`1px solid ${G.borderLight}`,borderRadius:2,
              background:items.every(c=>selected[c._id])?G.gold:"none",flexShrink:0,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#0B0A07"}}>
              {items.every(c=>selected[c._id])?"✓":""}
            </div>
            {items.every(c=>selected[c._id])?"Deselect all":"Select all"}
          </button>
          <span style={{color:G.textFaint,fontSize:11}}>{selectedCount} of {items.length} selected</span>
        </div>
        <Btn variant="primary" disabled={selectedCount===0} onClick={handleAdd}>
          Add {selectedCount} Concert{selectedCount!==1?"s":""}
          {!isAdmin?" (pending approval)":""}
        </Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {items.map((c)=>{
          const isSelected=!!selected[c._id];
          const isOpen=!!expanded[c._id];
          return(
            <div key={c._id} style={{border:`1px solid ${isSelected?G.borderLight:G.border}`,borderRadius:3,
              background:isSelected?G.card:G.bg,opacity:isSelected?1:.55,transition:"all .2s"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px"}}>
                <button onClick={()=>setSelected(p=>({...p,[c._id]:!p[c._id]}))} style={{
                  width:18,height:18,border:`1px solid ${isSelected?G.gold:G.borderLight}`,borderRadius:2,
                  background:isSelected?G.gold:"none",flexShrink:0,cursor:"pointer",marginTop:2,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,
                  color:"#0B0A07",transition:"all .15s"}}>{isSelected?"✓":""}</button>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontSize:15,fontFamily:"'Playfair Display',serif",color:G.cream,lineHeight:1.3}}>
                      {c.title||<span style={{color:G.textFaint,fontStyle:"italic"}}>Untitled</span>}
                    </span>
                    {!c.date&&<Pill label="No date" variant="red"/>}
                  </div>
                  {c.soloists?.length>0&&(
                    <div style={{fontSize:11,marginBottom:3}}>
                      {c.soloists.map((s,i)=>(
                        <span key={i}>{i>0&&<span style={{color:G.border}}> · </span>}
                          <span style={{color:G.gold}}>{s.name}</span>
                          <span style={{color:G.textDim}}> {s.role}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{fontSize:11,color:G.textDim,display:"flex",flexWrap:"wrap",gap:8}}>
                    {c.conductor&&<span>cond. <span style={{color:G.creamDim}}>{c.conductor}</span></span>}
                    {c.date&&<span>{fmtDate(c.date)}</span>}
                    {c.time&&<span>{c.time.replace(":","h")}</span>}
                    {c.venue&&<span>{c.venue}{c.city&&`, ${c.city}`}</span>}
                  </div>
                  {c._programText&&(
                    <div style={{fontSize:11,color:G.textFaint,marginTop:4,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:420}}>
                      {c._programText.split("\n").slice(0,2).join(" · ")}
                      {c._programText.split("\n").length>2&&` +${c._programText.split("\n").length-2} more`}
                    </div>
                  )}
                  {c.notes&&<div style={{fontSize:11,color:G.textDim,marginTop:3,fontStyle:"italic"}}>{c.notes}</div>}
                </div>
                <button onClick={()=>setExpanded(p=>({...p,[c._id]:!p[c._id]}))} style={{
                  background:"none",border:`1px solid ${G.border}`,color:G.textDim,borderRadius:2,
                  padding:"4px 10px",cursor:"pointer",fontSize:10,fontFamily:"'Jost',sans-serif",
                  letterSpacing:".08em",textTransform:"uppercase",flexShrink:0,marginTop:1,
                  transition:"all .15s"}}>{isOpen?"▲ Close":"✎ Edit"}</button>
              </div>
              {isOpen&&(
                <div style={{padding:"0 14px 14px",borderTop:`1px solid ${G.border}`}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px",marginTop:14}}>
                    <div><SecLabel>Title</SecLabel><div style={{marginBottom:10}}><Inp value={c.title} onChange={v=>updateItem(c._id,"title",v)} placeholder="Concert title"/></div></div>
                    <div><SecLabel>Conductor</SecLabel><div style={{marginBottom:10}}><Inp value={c.conductor||""} onChange={v=>updateItem(c._id,"conductor",v)} placeholder="Conductor"/></div></div>
                    <div><SecLabel>Date</SecLabel><div style={{marginBottom:10}}><Inp type="date" value={c.date||""} onChange={v=>updateItem(c._id,"date",v)}/></div></div>
                    <div><SecLabel>Time</SecLabel><div style={{marginBottom:10}}><Inp value={c.time||""} onChange={v=>updateItem(c._id,"time",v)} placeholder="19:30"/></div></div>
                    <div><SecLabel>Venue</SecLabel><div style={{marginBottom:10}}><Inp value={c.venue||""} onChange={v=>updateItem(c._id,"venue",v)} placeholder="Venue"/></div></div>
                    <div><SecLabel>City</SecLabel><div style={{marginBottom:10}}><Inp value={c.city||""} onChange={v=>updateItem(c._id,"city",v)} placeholder="City"/></div></div>
                    <div><SecLabel>Detail URL</SecLabel><div style={{marginBottom:10}}><Inp value={c.detailUrl||""} onChange={v=>updateItem(c._id,"detailUrl",v)} placeholder="https://..."/></div></div>
                    <div><SecLabel>Notes</SecLabel><div style={{marginBottom:10}}><Inp value={c.notes||""} onChange={v=>updateItem(c._id,"notes",v)} placeholder="Any notes…"/></div></div>
                  </div>
                  <SecLabel>Soloists</SecLabel>
                  <div style={{marginBottom:12}}><SoloistsEditor soloists={c.soloists||[]} onChange={v=>updateItem(c._id,"soloists",v)}/></div>
                  <SecLabel>Programme (one work per line)</SecLabel>
                  <div style={{marginBottom:12}}><Textarea value={c._programText} onChange={v=>updateItem(c._id,"_programText",v)} rows={3} placeholder="Beethoven: Symphony No. 7…"/></div>
                  <SecLabel>Ticket Categories (Label, Price — one per line)</SecLabel>
                  <Textarea value={c._tiersText} onChange={v=>updateItem(c._id,"_tiersText",v)} rows={4} placeholder={"Cat 1, 98\nCat 2, 78\nCat 3, 55\nCat 4, 38"}/>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${G.border}`,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Btn variant="ghostDim" size="sm" onClick={onClose}>Cancel</Btn>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {!isAdmin&&<span style={{fontSize:11,color:G.textDim}}>Will be submitted for organiser approval</span>}
          <Btn variant="primary" disabled={selectedCount===0} onClick={handleAdd}>
            Add {selectedCount} Concert{selectedCount!==1?"s":""}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Single concert modal (add/edit) ───────────────────────────────────────────
function SingleConcertModal({onClose,onSubmit,isAdmin,editData=null}) {
  const [mode,setMode]=useState(editData?"manual":"url");
  const [url,setUrl]=useState("");
  const [scraping,setScraping]=useState(false);
  const [scrapeMsg,setScrapeMsg]=useState("");
  const blank={title:"",conductor:"",soloists:[],date:"",time:"19:30",venue:"",city:"",
    url:"",detailUrl:"",program:"",tiers:"Cat 1, 98\nCat 2, 78\nCat 3, 55\nCat 4, 38",notes:""};
  const [form,setForm]=useState(editData?{...editData,
    program:(editData.program||[]).join("\n"),
    tiers:(editData.tiers||[]).map(t=>`${t.label}, ${t.price}`).join("\n"),
  }:blank);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  const scrape=async()=>{
    if(!url.trim()){setScrapeMsg("Enter a URL first.");return;}
    setScraping(true);setScrapeMsg("");
    try {
      const proxy=`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const r=await fetch(proxy); const d=await r.json();
      const html=(d.contents||"").slice(0,14000);
      const api=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,
          system:`Extract a SINGLE concert from HTML. Return ONLY raw JSON with: title, conductor, soloists (array of {name,role}), date (YYYY-MM-DD), time (HH:MM 24h), venue, city, detailUrl, program (array), tiers (array of {label,price}), notes.`,
          messages:[{role:"user",content:`URL: ${url}\nHTML:\n${html}`}]})});
      const ad=await api.json();
      const raw=ad.content?.[0]?.text||"{}";
      const p=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setForm({title:p.title||"",conductor:p.conductor||"",soloists:p.soloists||[],
        date:p.date||"",time:p.time||"19:30",venue:p.venue||"",city:p.city||"",
        url,detailUrl:p.detailUrl||"",
        program:(p.program||[]).join("\n"),
        tiers:p.tiers?.length?p.tiers.map(t=>`${t.label}, ${t.price}`).join("\n"):"Cat 1, 98\nCat 2, 78\nCat 3, 55\nCat 4, 38",
        notes:p.notes||""});
      setMode("manual");
      if(!p.title) setScrapeMsg("Partially extracted — please review missing fields.");
    } catch { setScrapeMsg("Could not extract — please fill in manually."); setMode("manual"); }
    finally { setScraping(false); }
  };

  const parseTiers=raw=>raw.split("\n").map(l=>{
    const[label,...rest]=l.split(",");const price=parseInt(rest.join("").trim());
    return{label:label?.trim()||"",price:price||0};
  }).filter(t=>t.label&&t.price>0);

  const submit=()=>{
    if(!form.title||!form.date||!form.venue){alert("Title, date and venue are required.");return;}
    onSubmit({...form,program:form.program.split("\n").map(s=>s.trim()).filter(Boolean),tiers:parseTiers(form.tiers)});
  };

  return <Modal title={editData?"Edit Concert":"Add Single Concert"} onClose={onClose} wide>
    {!editData&&<div style={{display:"flex",gap:2,marginBottom:20,borderBottom:`1px solid ${G.border}`,paddingBottom:12}}>
      {[["url","Import from URL"],["manual","Manual Entry"]].map(([k,l])=>(
        <button key={k} onClick={()=>setMode(k)} style={{background:"none",border:"none",padding:"5px 16px",
          color:mode===k?G.gold:G.textDim,borderBottom:mode===k?`2px solid ${G.gold}`:"2px solid transparent",
          fontSize:11,letterSpacing:".1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>{l}</button>
      ))}
    </div>}
    {mode==="url"&&<div>
      <div style={{fontSize:13,color:G.textDim,marginBottom:14,lineHeight:1.6}}>For a single concert page — use Bulk Import for season listings.</div>
      <div style={{display:"flex",gap:8}}>
        <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&scrape()}
          placeholder="https://..."
          style={{flex:1,background:G.bg,border:`1px solid ${G.border}`,color:G.text,
            borderRadius:2,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"'Jost',sans-serif"}}/>
        <Btn onClick={scrape} disabled={scraping}>
          {scraping?<><span style={{display:"inline-block",animation:"spin 1s linear infinite",marginRight:5}}>◌</span>Reading…</>:"Import"}
        </Btn>
      </div>
      {scrapeMsg&&<div style={{fontSize:12,color:G.red,marginTop:8}}>{scrapeMsg}</div>}
      <button onClick={()=>setMode("manual")} style={{background:"none",border:"none",color:G.textDim,
        fontSize:11,cursor:"pointer",textDecoration:"underline",fontFamily:"'Jost',sans-serif",marginTop:10}}>
        Enter manually →
      </button>
    </div>}
    {mode==="manual"&&<div>
      {form.url&&!editData&&<div style={{fontSize:11,color:G.blue,padding:"5px 10px",background:G.blueFaint,borderRadius:2,marginBottom:12}}>Imported from: {form.url}</div>}
      {scrapeMsg&&<div style={{fontSize:12,color:"#A08020",marginBottom:10,padding:"5px 10px",background:"#201808",borderRadius:2}}>{scrapeMsg}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <div style={{gridColumn:"1/-1",marginBottom:12}}>
          <SecLabel>Concert Title *</SecLabel><Inp value={form.title} onChange={v=>set("title",v)} placeholder="e.g. Brahms Violin Concerto"/>
        </div>
        <div style={{marginBottom:12}}><SecLabel>Conductor</SecLabel><Inp value={form.conductor} onChange={v=>set("conductor",v)} placeholder="e.g. Gustavo Dudamel"/></div>
        <div style={{marginBottom:12}}><SecLabel>Date *</SecLabel><Inp type="date" value={form.date} onChange={v=>set("date",v)}/></div>
        <div style={{marginBottom:12}}><SecLabel>Time</SecLabel><Inp value={form.time} onChange={v=>set("time",v)} placeholder="19:30"/></div>
        <div style={{marginBottom:12}}><SecLabel>Venue *</SecLabel><Inp value={form.venue} onChange={v=>set("venue",v)} placeholder="e.g. Esplanade Concert Hall"/></div>
        <div style={{marginBottom:12}}><SecLabel>City</SecLabel><Inp value={form.city} onChange={v=>set("city",v)} placeholder="e.g. Singapore"/></div>
        <div style={{marginBottom:12}}><SecLabel>Ticketing URL</SecLabel><Inp value={form.url} onChange={v=>set("url",v)} placeholder="https://..."/></div>
        <div style={{marginBottom:12}}><SecLabel>Detail Page URL</SecLabel><Inp value={form.detailUrl} onChange={v=>set("detailUrl",v)} placeholder="https://..."/></div>
      </div>
      <div style={{marginBottom:12}}><SecLabel>Soloists</SecLabel><SoloistsEditor soloists={form.soloists} onChange={v=>set("soloists",v)}/></div>
      <div style={{marginBottom:12}}><SecLabel>Programme (one work per line)</SecLabel><Textarea value={form.program} onChange={v=>set("program",v)} rows={3} placeholder={"Beethoven: Symphony No. 9\nBrahms: Violin Concerto"}/></div>
      <div style={{marginBottom:12}}><SecLabel>Ticket Categories (Label, Price — one per line)</SecLabel><Textarea value={form.tiers} onChange={v=>set("tiers",v)} rows={4} placeholder={"Cat 1, 98\nCat 2, 78\nCat 3, 55\nCat 4, 38"}/></div>
      <div style={{marginBottom:12}}><SecLabel>Notes</SecLabel><Textarea value={form.notes} onChange={v=>set("notes",v)} rows={2} placeholder="Any extra info…"/></div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:4}}>
        <Btn variant="ghostDim" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit}>{isAdmin?(editData?"Save Changes":"Add Concert"):"Submit for Approval"}</Btn>
      </div>
    </div>}
  </Modal>;
}

// ── Notify modal ──────────────────────────────────────────────────────────────
function NotifyModal({concert:c,currentUser,users,onClose}) {
  const [copied,setCopied]=useState(null);
  const owing=users.filter(f=>f!==currentUser&&c.purchases[f]&&!c.paidStatus[f]);
  const makeMsg=f=>{const p=c.purchases[f];
    return `Hi ${f}! 🎼\n\nJust a nudge — you owe ${currentUser} $${p?.price} for:\n*${c.title}*\n${fmtDate(c.date)} · ${c.venue}${c.city?`, ${c.city}`:""}${p?.tier?`\nTicket: ${p.tier}`:""}.\n\nThanks!`;};
  return <Modal title="Payment Notifications" onClose={onClose}>
    <div style={{fontSize:13,color:G.textDim,marginBottom:18}}>Copy a message for each friend who still owes you.</div>
    {owing.length===0&&<div style={{color:G.green,fontSize:13}}>✓ Everyone has paid.</div>}
    {owing.map(f=>{const msg=makeMsg(f);return <div key={f} style={{marginBottom:14,background:G.bg,
      border:`1px solid ${G.border}`,borderRadius:2,padding:"11px 13px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <Avatar name={f} size={20}/><span style={{flex:1,fontSize:12,color:G.cream}}>{f}</span>
        <span style={{fontSize:12,color:G.gold}}>${c.purchases[f]?.price}</span>
      </div>
      <pre style={{fontSize:11,color:G.textDim,whiteSpace:"pre-wrap",lineHeight:1.6,marginBottom:9,fontFamily:"'Jost',sans-serif"}}>{msg}</pre>
      <div style={{display:"flex",gap:6}}>
        <Btn size="sm" variant="ghost" onClick={()=>{navigator.clipboard.writeText(msg);setCopied(f);setTimeout(()=>setCopied(null),2000);}}>
          {copied===f?"✓ Copied":"Copy"}</Btn>
        <Btn size="sm" variant="success" onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank")}>WhatsApp</Btn>
        <Btn size="sm" variant="blue" onClick={()=>window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(msg)}`,"_blank")}>Telegram</Btn>
      </div>
    </div>;})}
  </Modal>;
}

// ── Buy modal ─────────────────────────────────────────────────────────────────
function BuyModal({concert:c,interested,users,onClose,onConfirm,currentUser}) {
  const[asgn,setAsgn]=useState(()=>{const a={};interested.forEach(f=>{a[f]={tier:c.tiers[1]?.label||c.tiers[0]?.label,price:c.tiers[1]?.price||c.tiers[0]?.price||0};});return a;});
  const setA=(f,tier)=>{const t=c.tiers.find(t=>t.label===tier);setAsgn(p=>({...p,[f]:{tier,price:t?.price||0}}));};
  const total=Object.values(asgn).reduce((s,a)=>s+a.price,0);
  return <Modal title="Record Ticket Purchase" onClose={onClose}>
    <div style={{fontSize:13,color:G.textDim,marginBottom:16,lineHeight:1.6}}>Assign the category for each person. They'll be notified of what they owe.</div>
    {interested.map(f=>(
      <div key={f} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:`1px solid ${G.border}`}}>
        <Avatar name={f} size={22}/><span style={{flex:1,fontSize:13,color:G.cream}}>{f}{f===currentUser&&<span style={{fontSize:10,color:G.textFaint}}> (you)</span>}</span>
        <select value={asgn[f]?.tier} onChange={e=>setA(f,e.target.value)} style={{background:G.bg,border:`1px solid ${G.borderLight}`,color:G.gold,borderRadius:2,padding:"4px 10px",fontSize:12,cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>
          {c.tiers.map(t=><option key={t.label} value={t.label}>{t.label} — ${t.price}</option>)}
        </select>
        <span style={{fontSize:12,color:G.cream,minWidth:40,textAlign:"right"}}>${asgn[f]?.price||0}</span>
      </div>
    ))}
    <div style={{marginTop:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{fontSize:14,color:G.cream}}>Total: <span style={{color:G.gold}}>${total}</span></div>
      <div style={{display:"flex",gap:8}}><Btn variant="ghostDim" size="sm" onClick={onClose}>Cancel</Btn><Btn variant="primary" size="sm" onClick={()=>onConfirm(asgn)}>Confirm</Btn></div>
    </div>
  </Modal>;
}

// ── Concert card ──────────────────────────────────────────────────────────────
function ConcertCard({concert:c,currentUser,users,expanded,onToggle,onInterest,onBuy,onMarkPaid,onEdit,onDelete}) {
  const[notifyOpen,setNotifyOpen]=useState(false);
  const interested=users.filter(u=>c.interest[u]);
  const isPurchased=!!c.purchases._buyer;
  const buyer=c.purchases._buyer;
  const amBuyer=buyer===currentUser;
  const myInterest=!!c.interest[currentUser];
  const myPurchase=c.purchases[currentUser];
  const amOwing=myPurchase&&!c.paidStatus[currentUser]&&!amBuyer;
  const owingFriends=amBuyer?users.filter(f=>f!==currentUser&&c.purchases[f]&&!c.paidStatus[f]):[];

  return <>
    <div className="card-hover fadeUp" style={{background:G.card,border:`1px solid ${expanded?G.borderLight:G.border}`,
      borderRadius:3,marginBottom:11,overflow:"hidden",boxShadow:expanded?"0 4px 24px rgba(0,0,0,.45)":"none"}}>
      {/* Row */}
      <div onClick={onToggle} style={{display:"flex",alignItems:"center",gap:12,padding:"15px 18px",cursor:"pointer",
        borderLeft:`3px solid ${isPurchased?G.green:myInterest?G.gold:G.border}`}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:4}}>
            <span style={{fontSize:16,fontFamily:"'Playfair Display',serif",color:G.cream}}>{c.title}</span>
            {isPurchased&&<Pill label="Purchased" variant="green"/>}
          </div>
          <div style={{fontSize:11,color:G.textDim,display:"flex",flexWrap:"wrap",gap:6,marginBottom:c.soloists?.length?4:0}}>
            {c.conductor&&<span>cond. <span style={{color:G.creamDim}}>{c.conductor}</span></span>}
            {c.conductor&&c.soloists?.length>0&&<span style={{color:G.border}}>·</span>}
            {c.soloists?.length>0&&c.soloists.map((s,i)=>(
              <span key={i}>{i>0&&<span style={{color:G.border}}> · </span>}
                <span style={{color:G.gold}}>{s.name}</span><span style={{color:G.textDim}}> {s.role}</span>
              </span>
            ))}
          </div>
          <div style={{fontSize:11,color:G.textDim}}>{fmtDate(c.date)}{c.time&&` · ${c.time.replace(":","h")}`}{c.venue&&` · ${c.venue}`}{c.city&&`, ${c.city}`}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <div style={{display:"flex"}}>{interested.slice(0,5).map((f,i)=>(
            <div key={f} style={{marginLeft:i>0?-7:0,position:"relative",zIndex:5-i}}><Avatar name={f} size={21}/></div>
          ))}</div>
          {interested.length>0&&<span style={{fontSize:10,color:G.textDim,marginLeft:4}}>{interested.length}</span>}
        </div>
        <Btn size="sm" variant={myInterest?"ghost":"ghostDim"} onClick={e=>{e.stopPropagation();onInterest();}}
          style={{borderColor:myInterest?G.gold:G.border,color:myInterest?G.gold:G.textDim,minWidth:68}}>
          {myInterest?"✓ Going":"Going?"}
        </Btn>
        <span style={{color:G.textFaint,fontSize:12,transform:expanded?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}>▾</span>
      </div>

      {/* Expanded */}
      {expanded&&<div style={{padding:"0 18px 18px",borderTop:`1px solid ${G.border}`}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginTop:16}}>
          <div>
            {c.soloists?.length>0&&<><SecLabel>Soloists</SecLabel>
              <div style={{marginBottom:14}}>
                {c.soloists.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",
                    background:G.bg,border:`1px solid ${G.border}`,borderRadius:2,marginBottom:5}}>
                    <div style={{width:3,height:22,background:G.gold,borderRadius:2,flexShrink:0}}/>
                    <div><div style={{fontSize:13,color:G.cream}}>{s.name}</div>
                      <div style={{fontSize:10,color:G.textDim}}>{s.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>}
            {c.program?.length>0&&<><SecLabel>Programme</SecLabel>
              <div style={{marginBottom:12}}>
                {c.program.map((p,i)=>(
                  <div key={i} style={{fontSize:12,color:G.creamDim,marginBottom:3,
                    paddingLeft:9,borderLeft:`1px solid ${G.goldFaint}`}}>{p}</div>
                ))}
              </div>
            </>}
            <SecLabel>Ticket Categories</SecLabel>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
              {c.tiers.map(t=>(
                <div key={t.label} style={{background:G.bg,border:`1px solid ${G.borderLight}`,
                  borderRadius:2,padding:"4px 11px",fontSize:12,color:G.cream}}>
                  <span style={{color:G.textDim}}>{t.label} · </span>${t.price}
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {c.detailUrl&&<a href={c.detailUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:G.blue,textDecoration:"none"}}>↗ Concert details</a>}
              {c.url&&<a href={c.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:G.blue,textDecoration:"none",opacity:.7}}>↗ Ticketing</a>}
            </div>
            {c.notes&&<div style={{marginTop:8,fontSize:11,color:G.textDim,fontStyle:"italic",borderLeft:`2px solid ${G.goldFaint}`,paddingLeft:8}}>{c.notes}</div>}
          </div>
          <div>
            <SecLabel>Attendees</SecLabel>
            {users.map(f=>{const going=!!c.interest[f];const purchased=c.purchases[f];const owes=purchased&&!c.paidStatus[f]&&f!==buyer;
              return <div key={f} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",
                borderBottom:`1px solid ${G.border}`,opacity:going?1:.3}}>
                <Avatar name={f} size={19}/>
                <span style={{flex:1,fontSize:12,color:going?G.cream:G.textDim}}>{f}{f===currentUser&&<span style={{fontSize:9,color:G.textFaint}}> (you)</span>}</span>
                {purchased&&<span style={{fontSize:10,color:G.gold}}>{purchased.tier} · ${purchased.price}</span>}
                {owes&&<Pill label="Owes" variant="red"/>}
                {purchased&&c.paidStatus[f]&&f!==buyer&&<Pill label="Paid" variant="green"/>}
                {f===buyer&&isPurchased&&<Pill label="Buyer" variant="gold"/>}
              </div>;})}
          </div>
        </div>
        <div style={{marginTop:16,paddingTop:12,borderTop:`1px solid ${G.border}`,
          display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {myPurchase&&<CalBtn concert={c}/>}
            {(c.submittedBy===currentUser||currentUser==="Chris")&&<Btn size="sm" variant="ghostDim" onClick={e=>{e.stopPropagation();onEdit();}}>Edit</Btn>}
            {currentUser==="Chris"&&<Btn size="sm" variant="danger" onClick={e=>{e.stopPropagation();onDelete();}}>Remove</Btn>}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            {amBuyer&&owingFriends.length>0&&<Btn size="sm" variant="blue" onClick={()=>setNotifyOpen(true)}>Notify {owingFriends.length} owing</Btn>}
            {amBuyer&&users.filter(f=>f!==currentUser&&c.purchases[f]&&!c.paidStatus[f]).map(f=>(
              <Btn key={f} size="sm" variant="success" onClick={()=>onMarkPaid(f)}>Mark {f} paid</Btn>
            ))}
            {!isPurchased&&interested.length>0&&<Btn size="sm" variant="primary" onClick={onBuy}>I Purchased the Tickets</Btn>}
          </div>
        </div>
        {amOwing&&<div style={{marginTop:10,padding:"9px 13px",borderRadius:2,background:G.redFaint,
          border:`1px solid #4A1810`,fontSize:13,color:G.red}}>
          💳 Please pay <strong>{buyer}</strong> <strong>${myPurchase.price}</strong> for your {myPurchase.tier} ticket.
        </div>}
      </div>}
    </div>
    {notifyOpen&&<NotifyModal concert={c} currentUser={currentUser} users={users} onClose={()=>setNotifyOpen(false)}/>}
  </>;
}

// ── Members modal ─────────────────────────────────────────────────────────────
function MembersModal({members,currentUser,onClose,onSave}) {
  const [list,setList]=useState([...members]);
  const [newName,setNewName]=useState("");
  const [focus,setFocus]=useState(false);
  const add=()=>{
    const n=newName.trim();
    if(!n||list.includes(n))return;
    setList(p=>[...p,n]);setNewName("");
  };
  const remove=i=>{
    if(list[i]===currentUser){alert("You can\'t remove yourself while logged in.");return;}
    setList(p=>p.filter((_,j)=>j!==i));
  };
  const move=(i,dir)=>{
    const l=[...list];const j=i+dir;
    if(j<0||j>=l.length)return;
    [l[i],l[j]]=[l[j],l[i]];setList(l);
  };
  return <Modal title="Group Members" subtitle="First member is the organiser (admin)." onClose={onClose}>
    <div style={{marginBottom:16}}>
      {list.map((name,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",
          borderBottom:`1px solid ${G.border}`}}>
          <Avatar name={name} size={22}/>
          <span style={{flex:1,fontSize:13,color:name===currentUser?G.gold:G.cream}}>
            {name}
            {i===0&&<span style={{fontSize:9,letterSpacing:1.5,color:G.goldDim,textTransform:"uppercase",marginLeft:8}}>organiser</span>}
            {name===currentUser&&i!==0&&<span style={{fontSize:9,color:G.textFaint,marginLeft:8}}>(you)</span>}
          </span>
          <button onClick={()=>move(i,-1)} disabled={i===0} style={{background:"none",border:"none",
            color:i===0?G.textFaint:G.textDim,cursor:i===0?"default":"pointer",fontSize:14,padding:"0 4px"}}>↑</button>
          <button onClick={()=>move(i,1)} disabled={i===list.length-1} style={{background:"none",border:"none",
            color:i===list.length-1?G.textFaint:G.textDim,cursor:i===list.length-1?"default":"pointer",fontSize:14,padding:"0 4px"}}>↓</button>
          <button onClick={()=>remove(i)} style={{background:"none",border:"none",color:G.red,
            cursor:"pointer",fontSize:16,padding:"0 4px",lineHeight:1}}>×</button>
        </div>
      ))}
    </div>
    <div style={{display:"flex",gap:8,marginBottom:20}}>
      <input value={newName} onChange={e=>setNewName(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&add()}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        placeholder="Add member name…"
        style={{flex:1,background:G.bg,border:`1px solid ${focus?G.goldDim:G.border}`,color:G.text,
          borderRadius:2,padding:"7px 11px",fontSize:13,outline:"none",fontFamily:"'Jost',sans-serif",
          transition:"border-color .2s"}}/>
      <Btn size="sm" variant="ghost" onClick={add} disabled={!newName.trim()}>Add</Btn>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{fontSize:11,color:G.textDim}}>{list.length} member{list.length!==1?"s":""}</div>
      <div style={{display:"flex",gap:8}}>
        <Btn variant="ghostDim" size="sm" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" size="sm" onClick={()=>onSave(list)} disabled={list.length===0}>Save</Btn>
      </div>
    </div>
  </Modal>;
}

// ── User picker ───────────────────────────────────────────────────────────────
function UserPicker({onSelect,members,onEditMembers}) {
  return <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <style>{css}</style>
    <div className="fadeUp" style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:10,letterSpacing:5,color:G.goldDim,fontFamily:"'Jost',sans-serif",marginBottom:8}}>ENSEMBLE</div>
      <div style={{fontSize:30,fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:G.cream,marginBottom:6}}>Concert Coordinator</div>
      <div style={{fontSize:14,color:G.textDim,fontFamily:"'Jost',sans-serif",marginBottom:36}}>Who are you?</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",maxWidth:380}}>
        {members.map(u=>(
          <button key={u} className="btn-t" onClick={()=>onSelect(u)} style={{display:"flex",alignItems:"center",
            gap:10,padding:"11px 18px",background:G.card,border:`1px solid ${G.border}`,borderRadius:3,
            cursor:"pointer",fontFamily:"'Jost',sans-serif",color:G.text,fontSize:13}}>
            <Avatar name={u} size={26}/>{u}
          </button>
        ))}
      </div>
      <button onClick={onEditMembers} style={{marginTop:24,background:"none",border:"none",
        color:G.textDim,fontSize:11,cursor:"pointer",fontFamily:"'Jost',sans-serif",
        letterSpacing:".1em",textTransform:"uppercase",textDecoration:"underline"}}>
        ✎ Edit group members
      </button>
    </div>
  </div>;
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const[currentUser,setCurrentUser]=useState(null);
  const[concerts,setConcerts]=useState(null);
  const[members,setMembers]=useState(DEFAULT_MEMBERS);
  const[tab,setTab]=useState("concerts");
  const[expandedId,setExpandedId]=useState(null);
  const[modal,setModal]=useState(null); // null | "add" | "bulk" | "edit" | "members"
  const[editTarget,setEditTarget]=useState(null);
  const[buyId,setBuyId]=useState(null);
  const[toast,setToast]=useState(null);

  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};

  useEffect(()=>{
    loadStore(STORE_KEY).then(d=>setConcerts(d||SEED));
    loadStore(USERS_KEY).then(d=>{if(d?.lastUser)setCurrentUser(d.lastUser);});
    loadStore(MEMBERS_KEY).then(d=>{if(d?.members?.length)setMembers(d.members);});
  },[]);
  useEffect(()=>{if(concerts!==null)saveStore(STORE_KEY,concerts);},[concerts]);
  useEffect(()=>{if(currentUser)saveStore(USERS_KEY,{lastUser:currentUser});},[currentUser]);
  useEffect(()=>{saveStore(MEMBERS_KEY,{members});},[members]);

  if(!currentUser) return <UserPicker onSelect={u=>setCurrentUser(u)} members={members} onEditMembers={()=>setModal("members")}/>;
  if(concerts===null) return <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",
    justifyContent:"center",color:G.textDim,fontFamily:"'Jost',sans-serif",fontSize:13}}>Loading…</div>;

  const isAdmin=currentUser===members[0];
  const approved=concerts.filter(c=>c.status==="approved");
  const pending=concerts.filter(c=>c.status==="pending");
  const myTickets=approved.filter(c=>c.interest[currentUser]||c.purchases[currentUser]||c.purchases._buyer===currentUser);

  const upd=fn=>setConcerts(prev=>prev.map(fn));
  const toggleInterest=cid=>upd(c=>c.id!==cid?c:{...c,interest:{...c.interest,[currentUser]:c.interest[currentUser]?undefined:true}});
  const markPaid=(cid,f)=>upd(c=>c.id!==cid?c:{...c,paidStatus:{...c.paidStatus,[f]:true}});
  const approve=cid=>upd(c=>c.id!==cid?c:{...c,status:"approved"});
  const reject=cid=>setConcerts(prev=>prev.filter(c=>c.id!==cid));

  const addOne=data=>{
    const n={...data,id:uid(),status:isAdmin?"approved":"pending",
      interest:{},purchases:{},paidStatus:{},submittedBy:currentUser};
    setConcerts(prev=>[...prev,n]);
    setModal(null);
    showToast(isAdmin?"Concert added.":"Submitted for approval.");
  };
  const addBulk=dataArr=>{
    const ns=dataArr.map(data=>({...data,id:uid(),status:isAdmin?"approved":"pending",
      interest:{},purchases:{},paidStatus:{},submittedBy:currentUser}));
    setConcerts(prev=>[...prev,...ns]);
    showToast(isAdmin?`${ns.length} concerts added.`:`${ns.length} concerts submitted for approval.`);
  };
  const saveEdit=data=>{
    upd(c=>c.id!==editTarget.id?c:{...c,...data});
    setEditTarget(null);setModal(null);
    showToast("Concert updated.");
  };
  const deleteConcert=cid=>{
    if(!window.confirm("Remove this concert?"))return;
    setConcerts(prev=>prev.filter(c=>c.id!==cid));
    setExpandedId(null);
    showToast("Concert removed.");
  };
  const recordPurchase=(cid,asgn)=>{
    upd(c=>c.id!==cid?c:{...c,purchases:{...c.purchases,...asgn,_buyer:currentUser}});
    setBuyId(null);
    showToast("Purchase recorded. Use 'Notify owing' to send payment reminders.");
  };

  const buyC=concerts.find(c=>c.id===buyId);
  const interested=buyC?members.filter(u=>buyC.interest[u]):[];

  return <div style={{minHeight:"100vh",background:G.bg,color:G.text,fontFamily:"'Jost',sans-serif"}}>
    <style>{css}</style>

    {/* Header */}
    <header style={{background:G.card,borderBottom:`1px solid ${G.border}`,padding:"0 26px",
      position:"sticky",top:0,zIndex:200,display:"flex",alignItems:"stretch",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:18}}>
        <div style={{padding:"15px 0",borderRight:`1px solid ${G.border}`,paddingRight:18}}>
          <div style={{fontSize:9,letterSpacing:5,color:G.goldDim,fontFamily:"'Jost',sans-serif",fontWeight:300}}>ENSEMBLE</div>
          <div style={{fontSize:18,fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:G.cream,lineHeight:1.1}}>Concert Coordinator</div>
        </div>
        <nav style={{display:"flex",height:"100%",gap:1}}>
          {[["concerts","Concerts"],["mytickets","My Tickets"],
            ...(isAdmin?[["pending",`Pending${pending.length?` (${pending.length})`:""}`]]:[])
          ].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{background:"none",border:"none",padding:"0 14px",
              color:tab===k?G.gold:G.textDim,borderBottom:tab===k?`2px solid ${G.gold}`:"2px solid transparent",
              fontSize:11,letterSpacing:".08em",textTransform:"uppercase",cursor:"pointer",
              fontFamily:"'Jost',sans-serif",fontWeight:tab===k?500:400}}>{l}</button>
          ))}
        </nav>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {/* Add buttons */}
        <div style={{display:"flex",gap:6}}>
          <Btn size="sm" variant="ghostDim" onClick={()=>setModal("bulk")}>⊞ Bulk Import</Btn>
          <Btn size="sm" variant="ghostDim" onClick={()=>setModal("members")}>👥 Members</Btn>
          <Btn size="sm" onClick={()=>setModal("add")}>+ Add Concert</Btn>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,paddingLeft:12,borderLeft:`1px solid ${G.border}`,
          cursor:"pointer"}} onClick={()=>{saveStore(USERS_KEY,{lastUser:null});setCurrentUser(null);}}>
          <Avatar name={currentUser} size={26}/>
          <div><div style={{fontSize:12,color:G.cream}}>{currentUser}</div>
            {isAdmin&&<div style={{fontSize:9,letterSpacing:1.5,color:G.goldDim,textTransform:"uppercase"}}>Organiser</div>}
          </div>
          <span style={{fontSize:9,color:G.textFaint}}>▾</span>
        </div>
      </div>
    </header>

    {/* Body */}
    <main style={{maxWidth:900,margin:"0 auto",padding:"30px 20px"}}>

      {tab==="concerts"&&<>
        <div style={{fontSize:13,color:G.textDim,marginBottom:24,paddingLeft:10,
          borderLeft:`2px solid ${G.goldFaint}`,lineHeight:1.6}}>
          Mark your interest. When tickets are purchased, you'll see exactly what you owe.
        </div>
        {approved.length===0&&<EmptyState label="No concerts yet. Use Bulk Import or Add Concert above."/>}
        {approved.map(c=>(
          <ConcertCard key={c.id} concert={c} currentUser={currentUser} users={members}
            expanded={expandedId===c.id}
            onToggle={()=>setExpandedId(expandedId===c.id?null:c.id)}
            onInterest={()=>toggleInterest(c.id)}
            onBuy={()=>setBuyId(c.id)}
            onMarkPaid={f=>markPaid(c.id,f)}
            onEdit={()=>{setEditTarget(c);setModal("edit");}}
            onDelete={()=>deleteConcert(c.id)}/>
        ))}
      </>}

      {tab==="mytickets"&&<>
        {myTickets.length===0&&<EmptyState label="No tickets yet. Mark your interest on the Concerts tab."/>}
        {myTickets.map(c=>{
          const myP=c.purchases[currentUser];
          const isBuyer=c.purchases._buyer===currentUser;
          const owingFriends=isBuyer?members.filter(f=>f!==currentUser&&c.purchases[f]&&!c.paidStatus[f]):[];
          return <MyTicketRow key={c.id} concert={c} currentUser={currentUser} users={members} myP={myP} isBuyer={isBuyer}
            owingFriends={owingFriends} onMarkPaid={f=>markPaid(c.id,f)}/>;
        })}
      </>}

      {tab==="pending"&&isAdmin&&<>
        <div style={{fontSize:13,color:G.textDim,marginBottom:20,lineHeight:1.6}}>Review before they go live.</div>
        {pending.length===0&&<EmptyState label="No pending submissions."/>}
        {pending.map(c=>(
          <div key={c.id} className="card-hover fadeUp" style={{background:G.card,border:`1px solid ${G.border}`,
            borderRadius:3,marginBottom:10,padding:"14px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontSize:16,fontFamily:"'Playfair Display',serif",color:G.cream}}>{c.title}</span>
                  <Pill label="Pending" variant="pending"/>
                </div>
                {c.soloists?.length>0&&<div style={{fontSize:11,color:G.gold,marginBottom:3}}>
                  {c.soloists.map(s=>`${s.name} (${s.role})`).join(" · ")}</div>}
                <div style={{fontSize:11,color:G.textDim,marginBottom:4}}>{fmtDate(c.date)} · {c.venue}{c.city&&`, ${c.city}`}</div>
                <div style={{fontSize:11,color:G.textDim}}>By <span style={{color:G.cream}}>{c.submittedBy}</span></div>
                {c.program?.length>0&&<div style={{fontSize:11,color:G.textFaint,marginTop:5}}>
                  {c.program.slice(0,2).join(" · ")}{c.program.length>2&&` +${c.program.length-2}`}</div>}
                <div style={{marginTop:6,display:"flex",gap:5,flexWrap:"wrap"}}>
                  {c.tiers.map(t=><Pill key={t.label} label={`${t.label} $${t.price}`}/>)}
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <Btn variant="ghost" size="sm" onClick={()=>approve(c.id)}>Approve</Btn>
                <Btn variant="danger" size="sm" onClick={()=>reject(c.id)}>Reject</Btn>
              </div>
            </div>
          </div>
        ))}
      </>}
    </main>

    {/* Modals */}
    {modal==="members"&&<MembersModal members={members} currentUser={currentUser} onClose={()=>setModal(null)} onSave={m=>{setMembers(m);setModal(null);showToast("Group members updated.");}} />}
    {modal==="bulk"&&<BulkImportModal onClose={()=>setModal(null)} onAdd={addBulk} isAdmin={isAdmin}/>}
    {modal==="add"&&<SingleConcertModal onClose={()=>setModal(null)} onSubmit={addOne} isAdmin={isAdmin}/>}
    {modal==="edit"&&editTarget&&<SingleConcertModal onClose={()=>{setModal(null);setEditTarget(null);}} onSubmit={saveEdit} isAdmin={isAdmin} editData={editTarget}/>}
    {buyId&&buyC&&<BuyModal concert={buyC} interested={interested} users={members} onClose={()=>setBuyId(null)} onConfirm={asgn=>recordPurchase(buyId,asgn)} currentUser={currentUser}/>}

    {/* Toast */}
    {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
      background:G.card,border:`1px solid ${toast.type==="err"?G.red:G.borderLight}`,
      padding:"10px 20px",borderRadius:3,fontSize:13,color:toast.type==="err"?G.red:G.cream,
      boxShadow:"0 8px 32px rgba(0,0,0,.7)",zIndex:999,animation:"fadeUp .25s ease",
      whiteSpace:"nowrap"}}>{toast.msg}</div>}
  </div>;
}

function MyTicketRow({concert:c,currentUser,users,myP,isBuyer,owingFriends,onMarkPaid}) {
  const[notifyOpen,setNotifyOpen]=useState(false);
  const amOwing=myP&&!c.paidStatus[currentUser]&&!isBuyer;
  return <>
    <div className="card-hover fadeUp" style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:3,
      marginBottom:10,padding:"14px 18px",borderLeft:`3px solid ${amOwing?G.red:G.green}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontFamily:"'Playfair Display',serif",color:G.cream,marginBottom:4}}>{c.title}</div>
          {c.soloists?.length>0&&<div style={{fontSize:11,color:G.gold,marginBottom:3}}>{c.soloists.map(s=>s.name).join(" · ")}</div>}
          <div style={{fontSize:11,color:G.textDim,marginBottom:6}}>{fmtDate(c.date)} · {c.venue}{c.city&&`, ${c.city}`}</div>
          {myP&&<div style={{fontSize:12}}><span style={{color:G.textDim}}>Ticket: </span>
            <span style={{color:G.gold}}>{myP.tier} — ${myP.price}</span>
            {amOwing&&<span style={{color:G.red,marginLeft:10}}>· Owe {c.purchases._buyer} ${myP.price}</span>}
            {c.paidStatus[currentUser]&&!isBuyer&&<span style={{color:G.green,marginLeft:10}}>· Paid ✓</span>}
          </div>}
          {isBuyer&&owingFriends.length>0&&<div style={{fontSize:12,color:G.gold,marginTop:3}}>
            {owingFriends.length} still owe you · ${owingFriends.reduce((s,f)=>s+(c.purchases[f]?.price||0),0)}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
          {myP&&<CalBtn concert={c}/>}
          {isBuyer&&owingFriends.length>0&&<Btn size="sm" variant="blue" onClick={()=>setNotifyOpen(true)}>Notify owing</Btn>}
        </div>
      </div>
      {isBuyer&&owingFriends.length>0&&<div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
        {owingFriends.map(f=>(
          <Btn key={f} size="sm" variant="success" onClick={()=>onMarkPaid(f)}>Mark {f} paid · ${c.purchases[f]?.price}</Btn>
        ))}
      </div>}
    </div>
    {notifyOpen&&<NotifyModal concert={c} currentUser={currentUser} users={users} onClose={()=>setNotifyOpen(false)}/>}
  </>;
}
