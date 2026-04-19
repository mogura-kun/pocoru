import { useState, useEffect, useRef } from "react";

const SUPA_URL = "https://srkzjzgiejjoefaizsyo.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNya3pqemdpZWpqb2VmYWl6c3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Mzk5ODcsImV4cCI6MjA5MTMxNTk4N30.Y9pLGw2mDnq7sPpP-9JLvpTVtnzGdX4S8S3OoVdIccA";
const AUTH_URL = `${SUPA_URL}/auth/v1`;
const APP_URL  = "https://pocoru.vercel.app";
const font     = "'Hiragino Maru Gothic Pro','Noto Sans JP',sans-serif";

// ── Supabase REST ────────────────────────────────────────────────────────────
async function supa(path, opts={}, token=null){
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`,{
    headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${token||SUPA_KEY}`,"Content-Type":"application/json","Prefer":opts.prefer||""},
    ...opts,
  });
  if(res.status===204)return null;
  const t=await res.text();
  if(!res.ok)throw new Error(t);
  return t?JSON.parse(t):null;
}

// ── Auth helpers ─────────────────────────────────────────────────────────────
function getSession(){try{return JSON.parse(localStorage.getItem("sb_sess")||"null");}catch{return null;}}
function saveSession(s){if(s)localStorage.setItem("sb_sess",JSON.stringify(s));else localStorage.removeItem("sb_sess");}
function lsGet(k,d=null){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

async function refreshToken(rt){
  try{
    const res=await fetch(`${AUTH_URL}/token?grant_type=refresh_token`,{method:"POST",headers:{"apikey":SUPA_KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:rt})});
    if(!res.ok)return null;
    return await res.json();
  }catch{return null;}
}
function googleLogin(){
  const red=encodeURIComponent(APP_URL);
  window.location.href=`${AUTH_URL}/authorize?provider=google&redirect_to=${red}`;
}
async function googleLogout(token){
  try{await fetch(`${AUTH_URL}/logout`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${token}`}});}catch{}
  saveSession(null);
}

// ── Leaflet loader ───────────────────────────────────────────────────────────
function useLeaflet(cb){
  useEffect(()=>{
    if(window.L){cb();return;}
    const css=document.createElement("link");css.rel="stylesheet";css.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(css);
    const js=document.createElement("script");js.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";js.onload=cb;document.head.appendChild(js);
  },[]);
}

// ── 定数 ────────────────────────────────────────────────────────────────────
const CATEGORIES=[
  {value:"flower",emoji:"🌸",color:"#e06080",bg:"#fde8ef",label:"花"},
  {value:"bird",  emoji:"🐦",color:"#4a9cc7",bg:"#e5f3fb",label:"鳥"},
  {value:"fish",  emoji:"🐟",color:"#3ab8a0",bg:"#e0f7f3",label:"魚"},
  {value:"sound", emoji:"🎵",color:"#9b72cc",bg:"#f1ebfa",label:"音"},
  {value:"bread", emoji:"🍞",color:"#c9813a",bg:"#fdf0e0",label:"パン"},
  {value:"other", emoji:"✨",color:"#7a8a6a",bg:"#f0f2ec",label:"その他"},
];
const CAT=Object.fromEntries(CATEGORIES.map(c=>[c.value,c]));
const cc=v=>CAT[v]?.color||"#7a8a6a";
const cbg=v=>CAT[v]?.bg||"#f0f2ec";
const cl=v=>CAT[v]?.label||"その他";
const WEATHERS=[
  {value:"sunny",emoji:"☀️"},{value:"cloudy",emoji:"☁️"},{value:"rainy",emoji:"🌧️"},
  {value:"snowy",emoji:"❄️"},{value:"windy",emoji:"🌬️"},{value:"rainbow",emoji:"🌈"},
];
function haversine(la1,lo1,la2,lo2){const d=(v)=>v*Math.PI/180;const a=Math.sin(d(la2-la1)/2)**2+Math.cos(d(la1))*Math.cos(d(la2))*Math.sin(d(lo2-lo1)/2)**2;return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function jitter(v){return v+(Math.random()-0.5)*0.00009;}
function roundTimeStr(date){const d=date instanceof Date?date:new Date(date);if(isNaN(d))return"";const h=d.getHours(),m=d.getMinutes(),rm=m<30?0:30;return`${String(h).padStart(2,"0")}:${String(rm).padStart(2,"0")}ごろ`;}

// ── 小コンポーネント ─────────────────────────────────────────────────────────
function Polaroid({photo,emoji,category,rotate=0,small=false}){
  const w=small?100:155,h=small?82:125;
  return(
    <div style={{display:"inline-block",background:"white",padding:small?"6px 6px 22px":"10px 10px 36px",boxShadow:"0 4px 18px rgba(0,0,0,0.18)",borderRadius:2,transform:`rotate(${rotate}deg)`}}>
      {photo?<img src={photo} alt="" style={{width:w,height:h,objectFit:"cover",display:"block"}}/>
        :<div style={{width:w,height:h,background:cbg(category),display:"flex",alignItems:"center",justifyContent:"center",fontSize:small?28:44}}>{emoji}</div>}
    </div>
  );
}
function StickyNote({text,colorKey="yellow",rotate=0}){
  const C={yellow:"#fef08a",pink:"#fda4af",blue:"#bae6fd",green:"#bbf7d0",orange:"#fed7aa"};
  return(
    <div style={{background:C[colorKey]||"#fef08a",padding:"12px 14px",minHeight:60,boxShadow:"2px 3px 8px rgba(0,0,0,0.14)",transform:`rotate(${rotate}deg)`,fontFamily:font,fontSize:13,lineHeight:1.7,color:"#3a3028",borderRadius:2,position:"relative"}}>
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:22,height:5,background:"rgba(0,0,0,0.08)",borderRadius:"0 0 4px 4px"}}/>
      {text}
    </div>
  );
}

// ── PinEditMap ───────────────────────────────────────────────────────────────
function PinEditMap({lat,lng,onMove}){
  const mRef=useRef(null),iRef=useRef(null),mkRef=useRef(null);
  const [rdy,setRdy]=useState(false);
  useLeaflet(()=>setRdy(true));
  useEffect(()=>{
    if(!rdy||!mRef.current||iRef.current)return;
    const L=window.L;
    iRef.current=L.map(mRef.current,{zoomControl:true,attributionControl:false}).setView([lat||35.68,lng||139.77],15);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{subdomains:"abcd",maxZoom:19}).addTo(iRef.current);
    const icon=L.divIcon({className:"",html:`<div style="font-size:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">📍</div>`,iconSize:[26,26],iconAnchor:[13,24]});
    mkRef.current=L.marker([lat||35.68,lng||139.77],{icon,draggable:true}).addTo(iRef.current);
    mkRef.current.on("dragend",e=>{const p=e.target.getLatLng();onMove(p.lat,p.lng);});
    iRef.current.on("click",e=>{mkRef.current.setLatLng(e.latlng);onMove(e.latlng.lat,e.latlng.lng);});
  },[rdy]);
  return(
    <div style={{borderRadius:12,overflow:"hidden",height:160,position:"relative"}}>
      <div ref={mRef} style={{width:"100%",height:"100%"}}/>
      {!rdy&&<div style={{position:"absolute",inset:0,background:"#f0f7e8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#8ab060",fontFamily:font}}>読み込み中…</div>}
    </div>
  );
}

// ── LiveMap ──────────────────────────────────────────────────────────────────
function LiveMap({discoveries,weatherReports,userLocation,visibleCats,onPinClick,centerMeRef}){
  const mRef=useRef(null),iRef=useRef(null),dMk=useRef([]),uMk=useRef(null),uCi=useRef(null),wMk=useRef([]);
  const [rdy,setRdy]=useState(false);
  useLeaflet(()=>setRdy(true));
  useEffect(()=>{
    if(!rdy||!mRef.current||iRef.current)return;
    const L=window.L;
    iRef.current=L.map(mRef.current,{zoomControl:false,attributionControl:true}).setView(userLocation?[userLocation.lat,userLocation.lng]:[35.6812,139.7671],14);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{attribution:'&copy; OpenStreetMap &copy; CARTO',subdomains:"abcd",maxZoom:19}).addTo(iRef.current);
    L.control.zoom({position:"bottomright"}).addTo(iRef.current);
  },[rdy]);
  useEffect(()=>{
    if(!rdy||!iRef.current||!userLocation)return;
    const L=window.L,{lat,lng,accuracy}=userLocation;
    if(uCi.current)uCi.current.remove();if(uMk.current)uMk.current.remove();
    uCi.current=L.circle([lat,lng],{radius:accuracy||20,color:"#6db85c",fillColor:"#6db85c",fillOpacity:0.1,weight:1.5,dashArray:"4 4"}).addTo(iRef.current);
    uMk.current=L.marker([lat,lng],{icon:L.divIcon({className:"",html:`<div style="font-size:22px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35));transform:translateY(-8px)">📍</div>`,iconSize:[22,30],iconAnchor:[11,28]})}).addTo(iRef.current);
  },[rdy,userLocation]);
  useEffect(()=>{
    if(!rdy||!iRef.current)return;
    const L=window.L;
    dMk.current.forEach(m=>m.remove());dMk.current=[];
    discoveries.filter(d=>d.lat&&d.lng&&visibleCats.includes(d.category)).forEach(d=>{
      const age=Date.now()-new Date(d.posted_at).getTime();
      const op=Math.max(0.25,1-(age/(5*24*3600000))*0.75);
      const color=cc(d.category);
      const icon=L.divIcon({className:"",html:`<div style="opacity:${op};position:relative;width:44px;height:52px"><div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:40px;height:34px;background:white;border-radius:13px;border:2.5px solid ${color};box-shadow:0 3px 10px rgba(0,0,0,0.16);display:flex;align-items:center;justify-content:center;font-size:19px">${d.emoji}</div><div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color}"></div></div>`,iconSize:[44,52],iconAnchor:[22,52]});
      dMk.current.push(L.marker([d.lat,d.lng],{icon}).addTo(iRef.current).on("click",()=>onPinClick(d)));
    });
  },[rdy,discoveries,visibleCats,userLocation]);
  useEffect(()=>{
    if(!rdy||!iRef.current)return;
    const L=window.L;
    wMk.current.forEach(m=>m.remove());wMk.current=[];
    weatherReports.filter(w=>w.lat&&w.lng).forEach(w=>{
      const emoji=WEATHERS.find(x=>x.value===w.weather)?.emoji||"☀️";
      wMk.current.push(L.marker([w.lat,w.lng],{icon:L.divIcon({className:"",html:`<div style="font-size:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.18))">${emoji}</div>`,iconSize:[32,32],iconAnchor:[16,16]}),interactive:false}).addTo(iRef.current));
    });
  },[rdy,weatherReports]);
  const pannedRef=useRef(false);
  useEffect(()=>{if(!rdy||!iRef.current||!userLocation||pannedRef.current)return;iRef.current.setView([userLocation.lat,userLocation.lng],14,{animate:true});pannedRef.current=true;},[rdy,userLocation]);
  useEffect(()=>{if(rdy&&iRef.current&&centerMeRef)centerMeRef.current=()=>{if(userLocation)iRef.current.setView([userLocation.lat,userLocation.lng],14,{animate:true});};},[rdy,userLocation]);
  return(
    <div style={{width:"100%",height:"100%",position:"relative"}}>
      <div ref={mRef} style={{width:"100%",height:"100%"}}/>
      {!rdy&&<div style={{position:"absolute",inset:0,background:"#f0f7e8",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}><div style={{fontSize:32}}>🗺️</div><div style={{fontSize:12,color:"#8ab060",fontFamily:font}}>地図を読み込み中…</div></div>}
    </div>
  );
}

// ── SlideMenu ────────────────────────────────────────────────────────────────
function SlideMenu({open,onClose,myCount,nearbyCount,onSetTab,onOpenProfile,onSignOut,userName}){
  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200}}/>}
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:260,background:"#faf7f2",zIndex:201,transform:open?"translateX(0)":"translateX(100%)",transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"52px 20px 16px",borderBottom:"1px solid #eee8e0"}}>
          <div style={{fontSize:20,fontWeight:800,fontFamily:font}}>メニュー</div>
          <div style={{fontSize:11,color:"#6db85c",marginTop:3,fontFamily:font,fontWeight:600}}>👤 {userName||"ゲスト"}</div>
        </div>
        <div style={{flex:1,padding:"8px 0",overflowY:"auto"}}>
          {[
            {emoji:"🗺️",label:"ホーム",sub:"地図を見る",action:()=>{onClose();onSetTab(0);}},
            {emoji:"📋",label:"タイムライン",sub:`半径5km内 ${nearbyCount}件`,action:()=>{onClose();onSetTab(1);}},
            {emoji:"🗒️",label:"マイページ",sub:`自分の発見 ${myCount}件`,action:()=>{onClose();onOpenProfile();}},
            {emoji:"💡",label:"投稿は5日間表示",sub:"気軽に投稿してください"},
            {emoji:"❤️",label:"いいねは匿名です",sub:"誰かに届いています"},
            {emoji:"🚪",label:"ログアウト",sub:"Googleアカウントを切り替える",action:()=>{onClose();onSignOut();}},
          ].map((m,i)=>(
            <button key={i} onClick={m.action||onClose} style={{width:"100%",padding:"13px 20px",border:"none",background:"transparent",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:font}}>
              <span style={{fontSize:18}}>{m.emoji}</span>
              <div><div style={{fontSize:13,fontWeight:600,color:"#3a3028"}}>{m.label}</div>{m.sub&&<div style={{fontSize:11,color:"#aaa",marginTop:1}}>{m.sub}</div>}</div>
            </button>
          ))}
        </div>
        <div style={{padding:"14px 20px",paddingBottom:"max(14px,env(safe-area-inset-bottom))",borderTop:"1px solid #eee8e0"}}>
          <button onClick={onClose} style={{width:"100%",padding:"11px 0",borderRadius:13,border:"none",background:"#6db85c",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:font}}>閉じる</button>
        </div>
      </div>
    </>
  );
}

// ── DetailModal ──────────────────────────────────────────────────────────────
function DetailModal({item,isOwn,onClose,onHeart,myHearts,onUpdate,onViewUser}){
  const already=myHearts.includes(item.id);
  const age=Date.now()-new Date(item.posted_at).getTime();
  const hoursAgo=Math.floor(age/3600000);
  const timeStr=item.custom_time?`${new Date(item.custom_time).toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"})} ${roundTimeStr(new Date(item.custom_time))}`:roundTimeStr(new Date(item.posted_at));
  const op=Math.max(0.3,1-(age/(5*24*3600000))*0.7);
  const wEmoji=WEATHERS.find(w=>w.value===item.weather)?.emoji;
  const [showEdit,setShowEdit]=useState(false);
  const [editTime,setEditTime]=useState(item.custom_time||"");
  const [editLat,setEditLat]=useState(item.lat);
  const [editLng,setEditLng]=useState(item.lng);
  const [saving,setSaving]=useState(false);
  const colors=["yellow","pink","blue","green","orange"];
  async function saveEdit(){setSaving(true);await onUpdate(item.id,{custom_time:editTime||null,lat:editLat,lng:editLng});setSaving(false);setShowEdit(false);}
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#faf7f2",borderRadius:"28px 28px 0 0",padding:"22px 20px 48px",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",animation:"slideUp 0.3s ease",maxHeight:"90dvh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:44,height:44,borderRadius:13,background:cbg(item.category),display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,opacity:op}}>{item.emoji}</div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:cc(item.category),fontFamily:font}}>{cl(item.category)}</div>
              <div style={{fontSize:11,color:"#bbb",fontFamily:font}}>{timeStr}{wEmoji&&<span style={{marginLeft:5}}>{wEmoji}</span>}</div>
              {item.user_name&&!isOwn&&<button onClick={()=>{onClose();onViewUser(item.user_id,item.user_name);}} style={{border:"none",background:"none",cursor:"pointer",fontSize:11,color:"#6db85c",fontFamily:font,padding:0,marginTop:2}}>👤 {item.user_name}</button>}
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {isOwn&&<button onClick={()=>setShowEdit(!showEdit)} style={{padding:"5px 10px",borderRadius:9,border:`1px solid ${showEdit?"#6db85c":"#ddd"}`,background:showEdit?"#e8f5e3":"white",color:showEdit?"#6db85c":"#888",fontSize:12,cursor:"pointer",fontFamily:font}}>✏️</button>}
            <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#eee8e0",color:"#aaa",fontSize:14,cursor:"pointer"}}>×</button>
          </div>
        </div>
        {showEdit&&isOwn&&(
          <div style={{background:"white",borderRadius:14,padding:13,marginBottom:13,border:"1.5px solid #e8f5e3"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#6db85c",marginBottom:8,fontFamily:font}}>後付け編集</div>
            <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#bbb",marginBottom:4,fontFamily:font}}>投稿時間</div><input type="datetime-local" value={editTime} onChange={e=>setEditTime(e.target.value)} style={{width:"100%",padding:"8px 10px",borderRadius:9,border:"1px solid #e8e0d8",fontSize:12,fontFamily:font,outline:"none",boxSizing:"border-box",color:"#3a3028"}}/></div>
            <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#bbb",marginBottom:4,fontFamily:font}}>📍 場所</div><PinEditMap lat={editLat||35.68} lng={editLng||139.77} onMove={(la,lo)=>{setEditLat(la);setEditLng(lo);}}/></div>
            <button onClick={saveEdit} disabled={saving} style={{width:"100%",padding:"9px 0",borderRadius:9,border:"none",background:"#6db85c",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:font}}>{saving?"保存中…":"変更を保存 ✓"}</button>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"center",marginBottom:12,opacity:op}}><Polaroid photo={item.photo} emoji={item.emoji} category={item.category} rotate={-1.5}/></div>
        <div style={{marginBottom:12,opacity:op}}><StickyNote text={item.note} colorKey={colors[Math.abs((item.id||"").charCodeAt?.(0)||0)%5]} rotate={-1}/></div>
        <div style={{background:`${cbg(item.category)}cc`,borderRadius:13,padding:"11px 13px",marginBottom:16,borderLeft:`4px solid ${cc(item.category)}`}}>
          <div style={{fontSize:10,color:cc(item.category),fontWeight:700,letterSpacing:1,marginBottom:3,fontFamily:font}}>✦ ひとこと</div>
          <p style={{margin:0,fontSize:13,lineHeight:1.7,color:"#3a3028",fontStyle:"italic",fontFamily:font}}>{item.ai_msg}</p>
        </div>
        <button onClick={()=>!already&&onHeart(item.id)} style={{width:"100%",padding:"14px 0",borderRadius:16,border:"none",cursor:already?"default":"pointer",background:already?"#fde8ef":"white",boxShadow:already?"0 0 0 2px #e06080 inset":"0 2px 12px rgba(0,0,0,0.1)",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <span style={{fontSize:26,transform:already?"scale(1.2)":"scale(1)",transition:"transform 0.2s"}}>{already?"❤️":"🤍"}</span>
          <div style={{textAlign:"left"}}><div style={{fontSize:14,fontWeight:700,color:already?"#e06080":"#888",fontFamily:font}}>{already?"ありがとう":"いいね"}</div><div style={{fontSize:11,color:"#bbb",fontFamily:font}}>{item.hearts||0}人が共感</div></div>
        </button>
        <div style={{textAlign:"center",marginTop:10,fontSize:10,color:"#ccc",fontFamily:font}}>あと{Math.max(0,Math.ceil((5*24*3600000-age)/3600000))}時間で消えます</div>
      </div>
    </div>
  );
}

// ── WeatherPanel ─────────────────────────────────────────────────────────────
function WeatherPanel({userLocation,onPost,onClose}){
  const [sel,setSel]=useState(null);
  const [photo,setPhoto]=useState(null);
  const [posting,setPosting]=useState(false);
  const photoRef=useRef(null);
  function handlePhoto(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhoto(ev.target.result);r.readAsDataURL(f);}
  async function post(){
    if(!sel)return;setPosting(true);
    try{
      const lat=userLocation?.lat?jitter(userLocation.lat):null;
      const lng=userLocation?.lng?jitter(userLocation.lng):null;
      await supa("weather_reports",{method:"POST",prefer:"return=minimal",body:JSON.stringify({weather:sel,lat,lng,photo:photo||null})});
      onPost();
    }catch(e){alert("投稿失敗: "+e.message);}
    setPosting(false);
  }
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:250,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#faf7f2",borderRadius:"24px 24px 0 0",padding:"20px 20px 40px",animation:"slideUp 0.3s ease"}}>
        <div style={{width:36,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:800,fontFamily:font}}>今の天気を共有 ☀️</div>
          <button onClick={onClose} style={{width:26,height:26,borderRadius:"50%",border:"none",background:"#eee8e0",color:"#aaa",fontSize:13,cursor:"pointer"}}>×</button>
        </div>
        <div style={{display:"flex",gap:7,justifyContent:"center",marginBottom:14}}>
          {WEATHERS.map(w=><button key={w.value} onClick={()=>setSel(w.value)} style={{width:42,height:42,borderRadius:12,border:"none",cursor:"pointer",fontSize:20,background:sel===w.value?"#e8f5e3":"white",boxShadow:sel===w.value?"0 0 0 2.5px #6db85c":"0 1px 4px rgba(0,0,0,0.1)",transition:"all 0.15s"}}>{w.emoji}</button>)}
        </div>
        <div style={{marginBottom:12}}>
          {photo?<div style={{position:"relative"}}><img src={photo} alt="" style={{width:"100%",height:100,objectFit:"cover",borderRadius:10}}/><button onClick={()=>setPhoto(null)} style={{position:"absolute",top:4,right:4,width:22,height:22,borderRadius:"50%",border:"none",background:"rgba(0,0,0,0.5)",color:"white",fontSize:11,cursor:"pointer"}}>×</button></div>
            :<div style={{display:"flex",gap:7}}>
              <button onClick={()=>{photoRef.current.setAttribute("capture","environment");photoRef.current.click();}} style={{flex:1,padding:"9px 0",borderRadius:10,border:"1.5px dashed #c8e0b8",background:"#f4faf0",color:"#6db85c",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:font}}>📷 カメラ</button>
              <button onClick={()=>{photoRef.current.removeAttribute("capture");photoRef.current.click();}} style={{flex:1,padding:"9px 0",borderRadius:10,border:"1.5px dashed #c8e0b8",background:"#f4faf0",color:"#6db85c",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:font}}>🖼️ アルバム</button>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
            </div>
          }
        </div>
        <button onClick={post} disabled={!sel||posting} style={{width:"100%",padding:"11px 0",borderRadius:12,border:"none",background:sel&&!posting?"#6db85c":"#c8e0b8",color:"white",fontSize:13,fontWeight:700,cursor:sel?"pointer":"default",fontFamily:font}}>
          {posting?"送信中…":`${sel?WEATHERS.find(w=>w.value===sel)?.emoji:""} 地図に表示する`}
        </button>
      </div>
    </div>
  );
}

// ── ProfileModal ─────────────────────────────────────────────────────────────
function ProfileModal({myUserId,myUserName,targetUserId,targetUserName,discoveries,onClose}){
  const isMe=!targetUserId||targetUserId===myUserId;
  const userId=isMe?myUserId:targetUserId;
  const userName=isMe?myUserName:targetUserName;
  const [editName,setEditName]=useState(myUserName||"");
  const [savingName,setSavingName]=useState(false);
  const [followers,setFollowers]=useState([]);
  const [following,setFollowing]=useState([]);
  const [isFollowing,setIsFollowing]=useState(false);
  const [loadingFollow,setLoadingFollow]=useState(false);
  useEffect(()=>{
    if(!userId)return;
    supa(`follows?following_id=eq.${userId}`).then(d=>setFollowers(d||[])).catch(()=>{});
    supa(`follows?follower_id=eq.${userId}`).then(d=>setFollowing(d||[])).catch(()=>{});
    if(!isMe&&myUserId)supa(`follows?follower_id=eq.${myUserId}&following_id=eq.${userId}`).then(d=>setIsFollowing((d||[]).length>0)).catch(()=>{});
  },[userId]);
  async function toggleFollow(){
    if(!myUserId||loadingFollow)return;setLoadingFollow(true);
    try{
      if(isFollowing){await supa(`follows?follower_id=eq.${myUserId}&following_id=eq.${userId}`,{method:"DELETE",prefer:"return=minimal"});setIsFollowing(false);}
      else{await supa("follows",{method:"POST",prefer:"return=minimal",body:JSON.stringify({follower_id:myUserId,following_id:userId})});setIsFollowing(true);}
    }catch(e){alert(e.message);}
    setLoadingFollow(false);
  }
  async function saveName(){
    if(!editName.trim()||!myUserId)return;setSavingName(true);
    try{await supa(`users?id=eq.${myUserId}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({name:editName.trim()})});lsSet("userName",editName.trim());}
    catch(e){alert(e.message);}
    setSavingName(false);
  }
  const userDisc=discoveries.filter(d=>d.user_id===userId);
  const stickyColors=["yellow","pink","blue","green","orange"];
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#faf7f2",borderRadius:"28px 28px 0 0",padding:"22px 20px 48px",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",animation:"slideUp 0.35s ease",maxHeight:"90dvh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div><div style={{fontSize:18,fontWeight:800,fontFamily:font}}>🗒️ {isMe?"マイページ":userName}</div><div style={{fontSize:11,color:"#aaa",marginTop:3,fontFamily:font}}>フォロー {following.length}　フォロワー {followers.length}</div></div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            {!isMe&&myUserId&&<button onClick={toggleFollow} disabled={loadingFollow} style={{padding:"7px 14px",borderRadius:11,border:"none",cursor:"pointer",background:isFollowing?"#fde8ef":"#6db85c",color:isFollowing?"#e06080":"white",fontSize:12,fontWeight:700,fontFamily:font}}>{loadingFollow?"…":isFollowing?"フォロー中":"フォロー"}</button>}
            <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#eee8e0",color:"#aaa",fontSize:13,cursor:"pointer"}}>×</button>
          </div>
        </div>
        {isMe&&(
          <div style={{background:"white",borderRadius:13,padding:12,marginBottom:13,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#6db85c",marginBottom:7,fontFamily:font}}>プロフィール編集</div>
            <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="名前" style={{width:"100%",padding:"8px 11px",borderRadius:9,border:"1px solid #e8e0d8",fontSize:13,fontFamily:font,outline:"none",boxSizing:"border-box",marginBottom:7}}/>
            <button onClick={saveName} disabled={savingName} style={{width:"100%",padding:"8px 0",borderRadius:9,border:"none",background:"#6db85c",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:font}}>{savingName?"保存中…":"保存"}</button>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:2,fontFamily:font}}>過去の発見 {userDisc.length}件</div>
          {isMe&&<div style={{fontSize:10,background:"#e8f5e3",color:"#6db85c",padding:"2px 8px",borderRadius:8,fontWeight:700,fontFamily:font}}>永久保存</div>}
        </div>
        {userDisc.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:"#ccc",fontFamily:font,fontSize:12}}>まだ投稿がありません</div>}
        {userDisc.map((d,i)=>{
          const isEven=i%2===0;
          return(
            <div key={d.id} style={{marginBottom:18,display:"flex",flexDirection:isEven?"row":"row-reverse",alignItems:"flex-start",gap:10}}>
              <div style={{flexShrink:0}}><Polaroid photo={d.photo} emoji={d.emoji} category={d.category} small rotate={(i%3-1)*2}/></div>
              <div style={{flex:1,paddingTop:4}}><StickyNote text={d.note} colorKey={stickyColors[i%stickyColors.length]} rotate={(i%3-1)*1.5}/><div style={{fontSize:10,color:"#bbb",marginTop:5,paddingLeft:2,fontFamily:font}}>{roundTimeStr(new Date(d.posted_at))} · ❤️{d.hearts||0}</div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PhotoEditor ──────────────────────────────────────────────────────────────
function PhotoEditor({photo,onSave,onClose}){
  const [tab,setTab]=useState("adjust");
  const [brightness,setBrightness]=useState(100);
  const [contrast,setContrast]=useState(100);
  const [saturate,setSaturate]=useState(100);
  const [rotate,setRotate]=useState(0);
  const [crop,setCrop]=useState({x:0,y:0,w:1,h:1});
  const canvasRef=useRef(null);
  const dragging=useRef(null);
  const imgRef=useRef(new window.Image());
  const filter=`brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
  useEffect(()=>{
    if(tab!=="crop")return;
    const canvas=canvasRef.current;if(!canvas)return;
    const img=imgRef.current;
    const draw=()=>{
      const W=canvas.width,H=canvas.height;
      const ctx=canvas.getContext("2d");
      ctx.clearRect(0,0,W,H);ctx.filter=filter;ctx.drawImage(img,0,0,W,H);ctx.filter="none";
      const cx=crop.x*W,cy=crop.y*H,cw=crop.w*W,ch=crop.h*H;
      ctx.fillStyle="rgba(0,0,0,0.45)";
      ctx.fillRect(0,0,W,cy);ctx.fillRect(0,cy+ch,W,H-(cy+ch));ctx.fillRect(0,cy,cx,ch);ctx.fillRect(cx+cw,cy,W-(cx+cw),ch);
      ctx.strokeStyle="white";ctx.lineWidth=2;ctx.strokeRect(cx,cy,cw,ch);
      [1/3,2/3].forEach(t=>{ctx.strokeStyle="rgba(255,255,255,0.4)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+cw*t,cy);ctx.lineTo(cx+cw*t,cy+ch);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy+ch*t);ctx.lineTo(cx+cw,cy+ch*t);ctx.stroke();});
      [[cx,cy],[cx+cw,cy],[cx,cy+ch],[cx+cw,cy+ch]].forEach(([hx,hy])=>{ctx.fillStyle="white";ctx.fillRect(hx-5,hy-5,10,10);});
    };
    if(img.src!==photo){img.onload=draw;img.src=photo;}else draw();
  },[tab,crop,filter,photo]);
  function getPos(e){const c=canvasRef.current,r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height,t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*sx/c.width,y:(t.clientY-r.top)*sy/c.height};}
  function onCropStart(e){e.preventDefault();const{x,y}=getPos(e);const{x:cx,y:cy,w:cw,h:ch}=crop,th=0.06;let handle=null;if(Math.abs(x-cx)<th&&Math.abs(y-cy)<th)handle="tl";else if(Math.abs(x-(cx+cw))<th&&Math.abs(y-cy)<th)handle="tr";else if(Math.abs(x-cx)<th&&Math.abs(y-(cy+ch))<th)handle="bl";else if(Math.abs(x-(cx+cw))<th&&Math.abs(y-(cy+ch))<th)handle="br";else if(x>cx&&x<cx+cw&&y>cy&&y<cy+ch)handle="move";if(handle)dragging.current={handle,startX:x,startY:y,startCrop:{...crop}};}
  function onCropMove(e){e.preventDefault();if(!dragging.current)return;const{x,y}=getPos(e);const{handle,startX,startY,startCrop:sc}=dragging.current;const dx=x-startX,dy=y-startY,min=0.1;let{x:nx,y:ny,w:nw,h:nh}={...sc};if(handle==="move"){nx=Math.max(0,Math.min(1-nw,sc.x+dx));ny=Math.max(0,Math.min(1-nh,sc.y+dy));}else if(handle==="tl"){nx=Math.max(0,Math.min(sc.x+sc.w-min,sc.x+dx));ny=Math.max(0,Math.min(sc.y+sc.h-min,sc.y+dy));nw=sc.x+sc.w-nx;nh=sc.y+sc.h-ny;}else if(handle==="tr"){ny=Math.max(0,Math.min(sc.y+sc.h-min,sc.y+dy));nw=Math.max(min,Math.min(1-sc.x,sc.w+dx));nh=sc.y+sc.h-ny;}else if(handle==="bl"){nx=Math.max(0,Math.min(sc.x+sc.w-min,sc.x+dx));nw=sc.x+sc.w-nx;nh=Math.max(min,Math.min(1-sc.y,sc.h+dy));}else if(handle==="br"){nw=Math.max(min,Math.min(1-sc.x,sc.w+dx));nh=Math.max(min,Math.min(1-sc.y,sc.h+dy));}setCrop({x:nx,y:ny,w:nw,h:nh});}
  function onCropEnd(){dragging.current=null;}
  function handleSave(){
    const img=imgRef.current,off=document.createElement("canvas");
    const sw=img.naturalWidth,sh=img.naturalHeight,cw=Math.round(crop.w*sw),ch=Math.round(crop.h*sh);
    off.width=cw;off.height=ch;
    const ctx=off.getContext("2d");ctx.filter=filter;ctx.drawImage(img,crop.x*sw,crop.y*sh,cw,ch,0,0,cw,ch);
    onSave({brightness,contrast,saturate,rotate,croppedPhoto:off.toDataURL("image/jpeg",0.92)});
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"white",borderRadius:20,padding:18,width:"100%",maxWidth:400,maxHeight:"90dvh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:800,fontFamily:font}}>写真を編集</div>
          <button onClick={onClose} style={{width:26,height:26,borderRadius:"50%",border:"none",background:"#eee8e0",color:"#aaa",fontSize:13,cursor:"pointer"}}>×</button>
        </div>
        <div style={{display:"flex",background:"#f0ebe4",borderRadius:10,padding:3,marginBottom:13}}>
          {[{v:"adjust",label:"✨ 加工"},{v:"crop",label:"✂️ トリミング"}].map(t=>(
            <button key={t.v} onClick={()=>setTab(t.v)} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",cursor:"pointer",background:tab===t.v?"white":"transparent",color:tab===t.v?"#3a3028":"#aaa",fontSize:12,fontWeight:tab===t.v?700:400,fontFamily:font,transition:"all 0.15s"}}>{t.label}</button>
          ))}
        </div>
        {tab==="adjust"&&(
          <>
            <div style={{display:"flex",justifyContent:"center",marginBottom:13}}>
              <div style={{background:"white",padding:"7px 7px 24px",boxShadow:"0 4px 16px rgba(0,0,0,0.18)",borderRadius:2,transform:`rotate(${rotate}deg)`}}>
                <img src={photo} alt="" style={{width:150,height:120,objectFit:"cover",display:"block",filter}}/>
              </div>
            </div>
            {[{label:"☀️ 明るさ",val:brightness,set:setBrightness,min:50,max:200},{label:"◑ コントラスト",val:contrast,set:setContrast,min:50,max:200},{label:"🎨 彩度",val:saturate,set:setSaturate,min:0,max:200},{label:"↻ 傾き",val:rotate+10,set:v=>setRotate(v-10),min:0,max:20}].map(s=>(
              <div key={s.label} style={{marginBottom:9}}>
                <div style={{fontSize:11,color:"#888",marginBottom:2,fontFamily:font}}>{s.label}</div>
                <input type="range" min={s.min} max={s.max} value={s.val} onChange={e=>s.set(Number(e.target.value))} style={{width:"100%",accentColor:"#6db85c"}}/>
              </div>
            ))}
          </>
        )}
        {tab==="crop"&&(
          <>
            <div style={{fontSize:11,color:"#aaa",textAlign:"center",marginBottom:7,fontFamily:font}}>コーナーをドラッグして範囲を調整</div>
            <canvas ref={canvasRef} width={300} height={240} style={{width:"100%",maxWidth:300,height:"auto",borderRadius:8,touchAction:"none",cursor:"crosshair",display:"block",margin:"0 auto"}}
              onMouseDown={onCropStart} onMouseMove={onCropMove} onMouseUp={onCropEnd}
              onTouchStart={onCropStart} onTouchMove={onCropMove} onTouchEnd={onCropEnd}/>
            <button onClick={()=>setCrop({x:0,y:0,w:1,h:1})} style={{width:"100%",padding:"7px 0",borderRadius:9,border:"1px solid #eee",background:"white",fontSize:11,cursor:"pointer",fontFamily:font,color:"#888",marginTop:8}}>リセット</button>
          </>
        )}
        <div style={{display:"flex",gap:8,marginTop:13}}>
          <button onClick={onClose} style={{flex:1,padding:"10px 0",borderRadius:10,border:"1px solid #ddd",background:"white",fontSize:12,cursor:"pointer",fontFamily:font}}>戻る</button>
          <button onClick={handleSave} style={{flex:2,padding:"10px 0",borderRadius:10,border:"none",background:"#6db85c",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:font}}>決定 ✓</button>
        </div>
      </div>
    </div>
  );
}

// ── CaptureModal ─────────────────────────────────────────────────────────────
function CaptureModal({userLocation,locStatus,onClose,onSave}){
  const [mode,setMode]=useState("now");
  const [note,setNote]=useState("");
  const [category,setCategory]=useState("flower");
  const [emoji,setEmoji]=useState("🌸");
  const [photo,setPhoto]=useState(null);
  const [photoEdit,setPhotoEdit]=useState(null);
  const [showEditor,setShowEditor]=useState(false);
  const [weather,setWeather]=useState(null);
  const [laterTime,setLaterTime]=useState("");
  const [laterLat,setLaterLat]=useState(userLocation?.lat||null);
  const [laterLng,setLaterLng]=useState(userLocation?.lng||null);
  const [loading,setLoading]=useState(false);
  const photoRef=useRef(null);
  function handleCat(v){setCategory(v);setEmoji(CAT[v]?.emoji||"✨");}
  function handlePhoto(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setPhoto(ev.target.result);setShowEditor(true);};r.readAsDataURL(f);}
  async function handleSave(){
    if(!note.trim()&&!photo)return;
    setLoading(true);
    const isLater=mode==="later";
    const lat=isLater?laterLat:(userLocation?.lat?jitter(userLocation.lat):null);
    const lng=isLater?laterLng:(userLocation?.lng?jitter(userLocation.lng):null);
    await onSave({note:note||"📷",category,emoji,photo:photoEdit?.croppedPhoto||photo,photoEdit,weather:isLater?null:weather,lat,lng,customTime:isLater&&laterTime?laterTime:null});
    setLoading(false);
  }
  const locBadge=locStatus==="ok"?{bg:"#e8f5e3",color:"#6db85c",text:`GPS（${roundTimeStr(new Date())}）`}:locStatus==="loading"?{bg:"#fff8e8",color:"#c9a836",text:"取得中"}:{bg:"#fdeee7",color:"#d97041",text:"オフ"};
  if(showEditor&&photo)return <PhotoEditor photo={photo} onSave={edit=>{setPhotoEdit(edit);setShowEditor(false);}} onClose={()=>setShowEditor(false)}/>;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.6)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div style={{width:"100%",maxWidth:430,margin:"0 auto",padding:"18px 18px 36px",background:"#faf7f2",borderRadius:"28px 28px 0 0",animation:"slideUp 0.3s ease",maxHeight:"92dvh",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"12px 0 13px"}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:800,fontFamily:font}}>発見を記録する ✨</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#eee8e0",color:"#aaa",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{display:"flex",background:"#f0ebe4",borderRadius:11,padding:3,marginBottom:13}}>
          {[{v:"now",label:"📍 今すぐ"},{v:"later",label:"🕐 後から"}].map(m=>(
            <button key={m.v} onClick={()=>setMode(m.v)} style={{flex:1,padding:"7px 0",borderRadius:9,border:"none",cursor:"pointer",background:mode===m.v?"white":"transparent",color:mode===m.v?"#3a3028":"#aaa",fontSize:12,fontWeight:mode===m.v?700:400,fontFamily:font,transition:"all 0.15s"}}>{m.label}</button>
          ))}
        </div>
        {mode==="now"&&(
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:11,padding:"5px 10px",borderRadius:8,background:locBadge.bg}}>
            <span style={{fontSize:11,color:locBadge.color,fontWeight:700,fontFamily:font}}>📍 {locBadge.text}</span>
            {locStatus==="ok"&&userLocation&&<span style={{fontSize:10,color:"#aaa",marginLeft:"auto",fontFamily:font}}>±{Math.round(userLocation.accuracy||0)}m</span>}
          </div>
        )}
        {mode==="later"&&(
          <>
            <div style={{marginBottom:11}}>
              <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>📅 日時を指定</div>
              <input type="datetime-local" value={laterTime} onChange={e=>setLaterTime(e.target.value)} style={{width:"100%",padding:"8px 11px",borderRadius:10,border:"1px solid #e8e0d8",fontSize:12,fontFamily:font,outline:"none",boxSizing:"border-box",color:"#3a3028"}}/>
            </div>
            <div style={{marginBottom:11}}>
              <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>📍 場所を指定</div>
              <PinEditMap lat={laterLat||35.6812} lng={laterLng||139.7671} onMove={(la,lo)=>{setLaterLat(la);setLaterLng(lo);}}/>
            </div>
          </>
        )}
        <div style={{marginBottom:11}}>
          <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>写真</div>
          {photo
            ?<div style={{position:"relative",display:"flex",justifyContent:"center"}}>
                <div style={{background:"white",padding:"7px 7px 24px",boxShadow:"0 4px 16px rgba(0,0,0,0.18)",borderRadius:2,transform:`rotate(${photoEdit?.rotate||0}deg)`}}>
                  <img src={photoEdit?.croppedPhoto||photo} alt="" style={{width:150,height:120,objectFit:"cover",display:"block",filter:photoEdit?.croppedPhoto?"none":`brightness(${photoEdit?.brightness||100}%) contrast(${photoEdit?.contrast||100}%) saturate(${photoEdit?.saturate||100}%)`}}/>
                </div>
                <div style={{position:"absolute",top:4,right:4,display:"flex",gap:4}}>
                  <button onClick={()=>setShowEditor(true)} style={{padding:"3px 7px",borderRadius:7,border:"none",background:"rgba(0,0,0,0.55)",color:"white",fontSize:11,cursor:"pointer"}}>✏️</button>
                  <button onClick={()=>{setPhoto(null);setPhotoEdit(null);}} style={{width:22,height:22,borderRadius:"50%",border:"none",background:"rgba(0,0,0,0.5)",color:"white",fontSize:11,cursor:"pointer"}}>×</button>
                </div>
              </div>
            :<div style={{display:"flex",gap:7}}>
                <button onClick={()=>{photoRef.current.setAttribute("capture","environment");photoRef.current.click();}} style={{flex:1,padding:"10px 0",borderRadius:11,border:"1.5px dashed #c8e0b8",background:"#f4faf0",color:"#6db85c",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:font}}>📷 カメラ</button>
                <button onClick={()=>{photoRef.current.removeAttribute("capture");photoRef.current.click();}} style={{flex:1,padding:"10px 0",borderRadius:11,border:"1.5px dashed #c8e0b8",background:"#f4faf0",color:"#6db85c",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:font}}>🖼️ アルバム</button>
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
              </div>
          }
        </div>
        <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>ジャンル</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:11}}>
          {CATEGORIES.map(c=>(
            <button key={c.value} onClick={()=>handleCat(c.value)} style={{padding:"7px 4px",borderRadius:11,border:"none",cursor:"pointer",background:category===c.value?c.bg:"white",color:category===c.value?c.color:"#aaa",fontWeight:category===c.value?700:400,fontSize:11,fontFamily:font,boxShadow:category===c.value?`0 0 0 2px ${c.color}`:"0 1px 4px rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <span style={{fontSize:18}}>{c.emoji}</span>{c.label}
            </button>
          ))}
        </div>
        {mode==="now"&&(
          <div style={{marginBottom:11}}>
            <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>天気（任意）</div>
            <div style={{display:"flex",gap:5}}>
              {WEATHERS.map(w=><button key={w.value} onClick={()=>setWeather(weather===w.value?null:w.value)} style={{width:36,height:36,borderRadius:10,border:"none",cursor:"pointer",fontSize:17,background:weather===w.value?"#e8f5e3":"white",boxShadow:weather===w.value?"0 0 0 2px #6db85c":"0 1px 4px rgba(0,0,0,0.08)"}}>{w.emoji}</button>)}
            </div>
          </div>
        )}
        <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>ひとこと（写真のみでもOK）</div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="何を見つけた？感じた？（省略可）" rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:12,border:"1.5px solid #e8e0d8",background:"white",color:"#3a3028",fontSize:13,resize:"none",boxSizing:"border-box",outline:"none",fontFamily:font,lineHeight:1.6}}/>
        <button onClick={handleSave} disabled={loading||(!note.trim()&&!photo)} style={{width:"100%",padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",background:loading?"#a8d898":(!note.trim()&&!photo)?"#c8e0b8":"#6db85c",color:"white",fontSize:14,fontWeight:800,fontFamily:font,marginTop:10}}>
          {loading?"投稿中…":"みんなに届ける 🌱"}
        </button>
      </div>
    </div>
  );
}

// ── LoginScreen ──────────────────────────────────────────────────────────────
function LoginScreen(){
  return(
    <div style={{minHeight:"100dvh",background:"#faf7f2",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:font,padding:32}}>
      <div style={{fontSize:52,marginBottom:16}}>🌱</div>
      <h1 style={{fontSize:22,fontWeight:800,color:"#3a3028",margin:"0 0 8px",textAlign:"center"}}>今日の小さな発見</h1>
      <p style={{fontSize:13,color:"#aaa",margin:"0 0 44px",textAlign:"center",lineHeight:1.8}}>あなたの街の小さな発見を<br/>半径5kmの誰かと共有しよう</p>
      <button onClick={googleLogin} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 24px",borderRadius:16,border:"1.5px solid #e8e0d8",background:"white",cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",fontSize:14,fontWeight:700,color:"#3a3028",fontFamily:font,width:"100%",maxWidth:280,justifyContent:"center"}}>
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Googleでログイン
      </button>
      <p style={{fontSize:11,color:"#ccc",marginTop:20,textAlign:"center",lineHeight:1.7}}>別の端末でも同じアカウントで使えます</p>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]               = useState(0);
  const [discoveries,setDiscoveries]   = useState([]);
  const [myDiscoveries,setMyDiscoveries] = useState([]);
  const [weatherReports,setWeatherReports] = useState([]);
  const [selected,setSelected]     = useState(null);
  const [showCapture,setShowCapture] = useState(false);
  const [showWeatherPanel,setShowWeatherPanel] = useState(false);
  const [showProfile,setShowProfile] = useState(false);
  const [profileTarget,setProfileTarget] = useState({id:null,name:null});
  const [myHearts,setMyHearts]     = useState(()=>lsGet("myHearts",[]));
  const [myUserId,setMyUserId]     = useState(null);
  const [myUserName,setMyUserName] = useState("");
  const [authReady,setAuthReady]   = useState(false);
  const [menuOpen,setMenuOpen]     = useState(false);
  const [showAI,setShowAI]         = useState(false);
  const [aiMsg,setAiMsg]           = useState("");
  const [userLocation,setUserLocation] = useState(null);
  const [locStatus,setLocStatus]   = useState("idle");
  const [visibleCats,setVisibleCats] = useState(CATEGORIES.map(c=>c.value));
  const watchIdRef  = useRef(null);
  const centerMeRef = useRef(null);
  const sessionRef  = useRef(null);

  // GPS
  useEffect(()=>{
    if(!navigator.geolocation){setLocStatus("denied");return;}
    setLocStatus("loading");
    watchIdRef.current=navigator.geolocation.watchPosition(
      pos=>{setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy});setLocStatus("ok");},
      ()=>setLocStatus("denied"),
      {enableHighAccuracy:true,maximumAge:5000,timeout:15000}
    );
    return()=>{if(watchIdRef.current!=null)navigator.geolocation.clearWatch(watchIdRef.current);};
  },[]);

  // Auth init
  useEffect(()=>{
    async function init(){
      // URLにaccess_tokenがあればコールバック処理
      const hash=window.location.hash;
      if(hash&&hash.includes("access_token")){
        const p=new URLSearchParams(hash.replace("#","?"));
        const at=p.get("access_token"),rt=p.get("refresh_token"),ei=parseInt(p.get("expires_in")||"3600");
        if(at){
          try{
            const res=await fetch(`${AUTH_URL}/user`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${at}`}});
            const user=await res.json();
            const sess={access_token:at,refresh_token:rt,expires_at:Date.now()+ei*1000,user};
            saveSession(sess);sessionRef.current=sess;
            const name=user.user_metadata?.full_name||user.email?.split("@")[0]||"旅人";
            setMyUserId(user.id);setMyUserName(name);lsSet("userName",name);
            // usersテーブルupsert
            await supa(`users?id=eq.${user.id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({name})},at).catch(()=>{});
            await supa("users",{method:"POST",prefer:"return=minimal",body:JSON.stringify({id:user.id,name})},at).catch(()=>{});
          }catch(e){console.error(e);}
          window.history.replaceState(null,"",window.location.pathname);
        }
        setAuthReady(true);return;
      }
      // 保存済みセッション
      const stored=getSession();
      if(stored){
        if(stored.expires_at&&Date.now()>stored.expires_at-300000){
          const refreshed=await refreshToken(stored.refresh_token);
          if(refreshed){saveSession(refreshed);sessionRef.current=refreshed;const u=refreshed.user;setMyUserId(u.id);setMyUserName(lsGet("userName",u.user_metadata?.full_name||"旅人"));}
          else{saveSession(null);}
        }else{
          sessionRef.current=stored;const u=stored.user;setMyUserId(u.id);setMyUserName(lsGet("userName",u.user_metadata?.full_name||"旅人"));
        }
      }
      setAuthReady(true);
    }
    init();
  },[]);

  // データ取得
  async function fetchAll(){
    try{
      const token=sessionRef.current?.access_token;
      const since=new Date(Date.now()-5*24*3600000).toISOString();
      const data=await supa(`discoveries?posted_at=gte.${since}&order=posted_at.desc&limit=500`,{},token);
      setDiscoveries(data||[]);
    }catch(e){console.error(e);}
  }
  async function fetchMy(uid){
    try{
      const token=sessionRef.current?.access_token;
      const data=await supa(`discoveries?user_id=eq.${uid}&order=posted_at.desc&limit=1000`,{},token);
      setMyDiscoveries(data||[]);
    }catch(e){console.error(e);}
  }
  async function fetchWeather(){
    try{
      const token=sessionRef.current?.access_token;
      const since=new Date(Date.now()-3*3600000).toISOString();
      const data=await supa(`weather_reports?posted_at=gte.${since}&order=posted_at.desc&limit=50`,{},token);
      setWeatherReports(data||[]);
    }catch(e){}
  }
  useEffect(()=>{
    if(!authReady)return;
    fetchAll();fetchWeather();
    if(myUserId)fetchMy(myUserId);
    const t1=setInterval(fetchAll,30000),t2=setInterval(fetchWeather,300000);
    return()=>{clearInterval(t1);clearInterval(t2);};
  },[authReady,myUserId]);

  const nearby=discoveries.filter(d=>{
    if(!userLocation)return true;
    if(!d.lat||!d.lng)return true;
    return haversine(userLocation.lat,userLocation.lng,d.lat,d.lng)<=5;
  });

  function toggleCat(v){setVisibleCats(prev=>prev.includes(v)?prev.length>1?prev.filter(x=>x!==v):prev:[...prev,v]);}

  async function handleHeart(id){
    const updated=[...myHearts,id];setMyHearts(updated);lsSet("myHearts",updated);
    setDiscoveries(prev=>prev.map(d=>d.id===id?{...d,hearts:(d.hearts||0)+1}:d));
    if(selected?.id===id)setSelected(s=>({...s,hearts:(s.hearts||0)+1}));
    try{
      const token=sessionRef.current?.access_token;
      const cur=discoveries.find(d=>d.id===id);
      await supa(`discoveries?id=eq.${id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({hearts:(cur?.hearts||0)+1})},token);
    }catch{}
  }

  async function handleUpdate(id,updates){
    try{
      const token=sessionRef.current?.access_token;
      await supa(`discoveries?id=eq.${id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify(updates)},token);
      setDiscoveries(prev=>prev.map(d=>d.id===id?{...d,...updates}:d));
      setMyDiscoveries(prev=>prev.map(d=>d.id===id?{...d,...updates}:d));
      if(selected?.id===id)setSelected(s=>({...s,...updates}));
    }catch(e){alert("保存失敗: "+e.message);}
  }

  async function handleSave({note,category,emoji,photo,photoEdit,weather,lat,lng,customTime}){
    let msg="素敵な発見！今日が少し特別な日になりましたね。";
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`「${cl(category)}」について面白い豆知識・雑学・またはクスっとするギャグを1〜2文で日本語で。友達トーンで。${note!=="📷"?"発見:"+note+"。":""}前置きや締め不要。`}]})});
      const data=await res.json();if(data.content?.[0]?.text)msg=data.content[0].text;
    }catch{}
    try{
      const token=sessionRef.current?.access_token;
      const row={note:note||"📷",category,emoji,photo:photo||null,photo_edit:photoEdit||null,weather:weather||null,lat:lat||null,lng:lng||null,ai_msg:msg,hearts:0,user_id:myUserId||null,user_name:myUserName||null,custom_time:customTime||null};
      const saved=await supa("discoveries",{method:"POST",prefer:"return=representation",body:JSON.stringify(row)},token);
      const entry=Array.isArray(saved)?saved[0]:saved;
      setDiscoveries(prev=>[entry,...prev]);
      setMyDiscoveries(prev=>[entry,...prev]);
      setShowCapture(false);
      setAiMsg(msg);setShowAI(true);
    }catch(e){alert("投稿失敗: "+e.message);setShowCapture(false);}
  }

  async function handleSignOut(){
    await googleLogout(sessionRef.current?.access_token);
    setMyUserId(null);setMyUserName("");
    window.location.reload();
  }

  // ローディング
  if(!authReady){
    return(
      <div style={{minHeight:"100dvh",background:"#faf7f2",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,fontFamily:font}}>
        <div style={{fontSize:44}}>🌱</div>
        <div style={{fontSize:12,color:"#aaa"}}>読み込み中…</div>
      </div>
    );
  }
  // 未ログイン
  if(!myUserId)return <LoginScreen/>;

  const TABS=["ホーム","タイムライン","マイページ"];
  const stickyColors=["yellow","pink","blue","green","orange"];

  return(
    <div style={{background:"#faf7f2",fontFamily:font,color:"#3a3028"}}>

      <SlideMenu open={menuOpen} onClose={()=>setMenuOpen(false)} myCount={myDiscoveries.length} nearbyCount={nearby.length}
        onSetTab={setTab} onOpenProfile={()=>{setProfileTarget({id:null,name:null});setShowProfile(true);}}
        onSignOut={handleSignOut} userName={myUserName}/>

      {/* ホームタブ */}
      {tab===0&&<div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:"100dvh",display:"flex",flexDirection:"column",zIndex:10,background:"#faf7f2"}}>
          {/* 上バー */}
          <div style={{flexShrink:0,paddingTop:"env(safe-area-inset-top,44px)",background:"rgba(250,247,242,0.98)",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 16px 0"}}>
              <div style={{fontSize:15,fontWeight:800,color:"#3a3028"}}>🌱 今日の発見</div>
              <button onClick={()=>setMenuOpen(true)} style={{border:"none",background:"none",cursor:"pointer",fontSize:22,color:"#3a3028",padding:"2px 0",lineHeight:1}}>≡</button>
            </div>
            <div style={{display:"flex",gap:6,padding:"6px 12px 10px",overflowX:"auto"}}>
              {CATEGORIES.map(c=>{const on=visibleCats.includes(c.value);return(
                <button key={c.value} onClick={()=>toggleCat(c.value)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,border:"none",cursor:"pointer",background:on?c.bg:"#ede8e0",color:on?c.color:"#aaa",fontWeight:on?700:400,fontSize:12,fontFamily:font,opacity:on?1:0.7,boxShadow:on?`0 0 0 1.5px ${c.color}40`:"none",transition:"all 0.15s"}}>
                  <span style={{fontSize:14}}>{c.emoji}</span><span>{c.label}</span>
                </button>
              );})}
            </div>
          </div>
          {/* 地図 */}
          <div style={{flex:1,position:"relative",overflow:"hidden",minHeight:0}}>
            <LiveMap discoveries={discoveries} weatherReports={weatherReports} userLocation={userLocation} visibleCats={visibleCats} onPinClick={setSelected} centerMeRef={centerMeRef}/>
            <div style={{position:"absolute",top:10,right:10,display:"flex",flexDirection:"column",gap:7,zIndex:1000}}>
              {locStatus==="ok"&&<button onClick={()=>centerMeRef.current&&centerMeRef.current()} style={{width:38,height:38,borderRadius:"50%",border:"none",cursor:"pointer",background:"white",boxShadow:"0 2px 10px rgba(0,0,0,0.22)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>📍</button>}
              <button onClick={()=>setShowWeatherPanel(true)} style={{width:38,height:38,borderRadius:"50%",border:"none",cursor:"pointer",background:"white",boxShadow:"0 2px 10px rgba(0,0,0,0.22)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>☀️</button>
            </div>
            {nearby.length>0&&<div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",zIndex:1000,background:"rgba(255,252,245,0.95)",borderRadius:16,padding:"5px 14px",boxShadow:"0 2px 10px rgba(0,0,0,0.1)",fontSize:11,color:"#6db85c",fontWeight:700,whiteSpace:"nowrap"}}>👥 半径5km内に{nearby.length}件</div>}
          </div>
          {/* 下バー */}
          <div style={{flexShrink:0,background:"rgba(250,247,242,0.98)",borderTop:"1px solid rgba(0,0,0,0.08)",display:"flex",alignItems:"center",padding:`10px 24px env(safe-area-inset-bottom,16px)`}}>
            <button onClick={()=>setTab(1)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,border:"none",background:"none",cursor:"pointer",color:"#888"}}>
              <span style={{fontSize:18}}>📋</span>
              <span style={{fontSize:10,fontWeight:500,fontFamily:font}}>タイムライン</span>
            </button>
            <button onClick={()=>setShowCapture(true)} style={{width:52,height:52,borderRadius:"50%",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#7dcc6a,#5aaa48)",color:"white",fontSize:26,fontWeight:700,boxShadow:"0 4px 16px rgba(109,184,92,0.45)",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:"auto"}}>+</button>
          </div>
        </div>
      }

      {/* タイムライン・マイページ */}

      {tab!==0&&<div style={{position:"fixed",top:0,bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,display:"flex",flexDirection:"column",zIndex:10,background:"#faf7f2"}}>
          <div style={{flexShrink:0,paddingTop:"env(safe-area-inset-top,44px)",background:"white",borderBottom:"1px solid #eee8e0"}}>
            <div style={{padding:"6px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={()=>setTab(0)} style={{display:"flex",alignItems:"center",gap:4,border:"none",background:"none",cursor:"pointer",fontSize:13,color:"#6db85c",fontWeight:700,padding:0,fontFamily:font}}>‹ 地図</button>
              <div style={{fontSize:17,fontWeight:800}}>{TABS[tab]}</div>
              <button onClick={()=>setMenuOpen(true)} style={{width:32,height:32,borderRadius:9,border:"none",background:"#f5f0ea",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>≡</button>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",minHeight:0,paddingBottom:80}}>

            {/* タイムライン */}
            {tab===1&&(
              <div style={{padding:"10px 10px 20px"}}>
                <div style={{display:"flex",gap:5,marginBottom:10,overflowX:"auto",paddingBottom:3}}>
                  {CATEGORIES.map(c=>{const on=visibleCats.includes(c.value);return <button key={c.value} onClick={()=>toggleCat(c.value)} style={{flexShrink:0,width:28,height:28,borderRadius:8,border:"none",cursor:"pointer",background:on?"white":"#ede8e0",fontSize:14,opacity:on?1:0.4,boxShadow:on?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center"}}>{c.emoji}</button>;})}
                </div>
                {nearby.filter(d=>visibleCats.includes(d.category)).length===0&&(
                  <div style={{textAlign:"center",padding:"50px 0",color:"#bbb"}}><div style={{fontSize:36,marginBottom:10}}>🌱</div><div style={{fontSize:13,fontFamily:font}}>まだ投稿がありません</div></div>
                )}
                {nearby.filter(d=>visibleCats.includes(d.category)).map((d,i)=>{
                  const age=Date.now()-new Date(d.posted_at).getTime();
                  const op=Math.max(0.3,1-(age/(5*24*3600000))*0.7);
                  const timeAgo=roundTimeStr(new Date(d.posted_at));
                  const showW=d.weather&&age<10800000;
                  const wE=WEATHERS.find(w=>w.value===d.weather)?.emoji;
                  return(
                    <div key={d.id} onClick={()=>setSelected(d)} style={{display:"flex",gap:8,marginBottom:10,cursor:"pointer",opacity:op}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:20}}>
                        <div style={{width:9,height:9,borderRadius:"50%",background:cc(d.category),border:"2px solid white",boxShadow:`0 0 0 2px ${cc(d.category)}`,flexShrink:0,marginTop:12}}/>
                        {i<nearby.filter(x=>visibleCats.includes(x.category)).length-1&&<div style={{width:2,flex:1,background:"#eee8e0",marginTop:3}}/>}
                      </div>
                      <div style={{flex:1,background:"white",borderRadius:11,padding:"9px 11px",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",border:"1px solid #f0e8e0"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <div style={{display:"flex",alignItems:"center",gap:5}}>
                            <span style={{fontSize:16}}>{d.emoji}</span>
                            <span style={{fontSize:9,background:cbg(d.category),color:cc(d.category),padding:"2px 6px",borderRadius:6,fontWeight:700,fontFamily:font}}>{cl(d.category)}</span>
                            {showW&&<span style={{fontSize:11}}>{wE}</span>}
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:9,color:"#bbb",fontFamily:font}}>{timeAgo}</div>
                            {d.user_name&&<button onClick={e=>{e.stopPropagation();setProfileTarget({id:d.user_id,name:d.user_name});setShowProfile(true);}} style={{fontSize:9,color:"#6db85c",border:"none",background:"none",cursor:"pointer",fontFamily:font,padding:0}}>👤{d.user_name}</button>}
                          </div>
                        </div>
                        {d.photo&&<img src={d.photo} alt="" style={{width:"100%",height:72,objectFit:"cover",borderRadius:7,marginBottom:5}}/>}
                        <p style={{margin:"0 0 5px",fontSize:12,lineHeight:1.5,color:"#3a3028",fontFamily:font}}>{d.note}</p>
                        <div style={{fontSize:11,color:"#e06080",fontFamily:font}}>{myHearts.includes(d.id)?"❤️":"🤍"} {d.hearts||0}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* マイページ */}
            {tab===2&&(
              <div style={{padding:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  {[{label:"自分の発見",value:myDiscoveries.length,emoji:"✨",color:"#6db85c"},{label:"もらったいいね",value:myDiscoveries.reduce((s,d)=>s+(d.hearts||0),0),emoji:"❤️",color:"#e06080"}].map(s=>(
                    <div key={s.label} style={{background:"white",padding:"14px 8px",borderRadius:14,textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                      <div style={{fontSize:22,marginBottom:3}}>{s.emoji}</div>
                      <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>
                      <div style={{fontSize:10,color:"#bbb",marginTop:2,fontFamily:font}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>{setProfileTarget({id:null,name:null});setShowProfile(true);}} style={{width:"100%",padding:"11px 0",borderRadius:13,border:"1.5px solid #d8f0c8",background:"#f4faf0",color:"#6db85c",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:font,marginBottom:16}}>プロフィール編集・フォロー ›</button>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:2,fontFamily:font}}>過去の発見 {myDiscoveries.length}件</div>
                  <div style={{fontSize:10,background:"#e8f5e3",color:"#6db85c",padding:"2px 8px",borderRadius:8,fontWeight:700,fontFamily:font}}>永久保存</div>
                </div>
                {myDiscoveries.length===0&&<div style={{textAlign:"center",padding:"50px 0",color:"#bbb"}}><div style={{fontSize:36,marginBottom:10}}>📷</div><div style={{fontSize:13,fontFamily:font}}>まだ投稿がありません</div></div>}
                {myDiscoveries.map((d,i)=>{
                  const isEven=i%2===0,rot=(i%3-1)*2;
                  return(
                    <div key={d.id} onClick={()=>setSelected(d)} style={{marginBottom:22,cursor:"pointer",display:"flex",flexDirection:isEven?"row":"row-reverse",alignItems:"flex-start",gap:10}}>
                      <div style={{flexShrink:0}}><Polaroid photo={d.photo} emoji={d.emoji} category={d.category} rotate={rot}/></div>
                      <div style={{flex:1,paddingTop:4}}>
                        <StickyNote text={d.note} colorKey={stickyColors[i%stickyColors.length]} rotate={(i%3-1)*1.5}/>
                        <div style={{fontSize:10,color:"#bbb",marginTop:6,paddingLeft:2,fontFamily:font}}>{roundTimeStr(new Date(d.posted_at))} · ❤️{d.hearts||0}{d.weather&&" "+WEATHERS.find(w=>w.value===d.weather)?.emoji}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* FAB */}
          {!showCapture&&!showAI&&!selected&&!showWeatherPanel&&!showProfile&&(
            <button onClick={()=>setShowCapture(true)} style={{position:"fixed",bottom:"calc(env(safe-area-inset-bottom,0px) + 22px)",right:18,width:52,height:52,borderRadius:"50%",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#7dcc6a,#5aaa48)",color:"white",fontSize:24,fontWeight:700,boxShadow:"0 4px 16px rgba(109,184,92,0.45)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          )}
      </div>}

      {/* モーダル */}
      {selected&&<DetailModal item={selected} isOwn={myDiscoveries.some(d=>d.id===selected.id)} onClose={()=>setSelected(null)} onHeart={handleHeart} myHearts={myHearts} onUpdate={handleUpdate} onViewUser={(id,name)=>{setSelected(null);setProfileTarget({id,name});setShowProfile(true);}}/>}
      {showWeatherPanel&&<WeatherPanel userLocation={userLocation} onPost={()=>{fetchWeather();setShowWeatherPanel(false);}} onClose={()=>setShowWeatherPanel(false)}/>}
      {showProfile&&<ProfileModal myUserId={myUserId} myUserName={myUserName} targetUserId={profileTarget.id} targetUserName={profileTarget.name} discoveries={[...discoveries,...myDiscoveries.filter(d=>!discoveries.find(x=>x.id===d.id))]} onClose={()=>setShowProfile(false)}/>}
      {showAI&&(
        <div onClick={()=>setShowAI(false)} style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",padding:"26px 22px 46px",background:"#faf7f2",borderRadius:"28px 28px 0 0",animation:"slideUp 0.4s ease"}}>
            <div style={{fontSize:28,textAlign:"center",marginBottom:10}}>🌱</div>
            <p style={{margin:"0 0 6px",fontSize:12,color:"#aaa",textAlign:"center",fontFamily:font}}>半径5kmの誰かに届きました</p>
            <p style={{margin:"0 0 20px",fontSize:14,lineHeight:1.8,textAlign:"center",color:"#3a3028",fontStyle:"italic",fontFamily:font}}>{aiMsg}</p>
            <button onClick={()=>{setShowAI(false);setTab(0);}} style={{width:"100%",padding:"13px 0",borderRadius:14,border:"none",cursor:"pointer",background:"#6db85c",color:"white",fontSize:14,fontWeight:700,fontFamily:font}}>地図で見る 📍</button>
          </div>
        </div>
      )}
      {showCapture&&<CaptureModal userLocation={userLocation} locStatus={locStatus} onClose={()=>setShowCapture(false)} onSave={handleSave}/>}

      <style>{`
        @keyframes slideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}
        .leaflet-container{font-family:${font}!important}
        .leaflet-control-attribution{font-size:9px!important}
        .leaflet-control-zoom{margin-bottom:8px!important;margin-right:8px!important}
        .leaflet-top,.leaflet-bottom{z-index:400!important}
        .leaflet-pane{z-index:300!important}
      `}</style>
    </div>
  );
}
