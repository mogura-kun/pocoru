import { useState, useEffect, useRef } from "react";

const SUPA_URL = "https://zchzntvqitytoolehdba.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaHpudHZxaXR5dG9vbGVoZGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDczNDgsImV4cCI6MjA5MjMyMzM0OH0.TXIX1eRw5jSDIyVNGGbC0yMb6ZgGZBFUsdPZRgr4MrE";
const AUTH_URL = `${SUPA_URL}/auth/v1`;
const APP_URL  = "https://discover-app-psi.vercel.app";
const font     = "'Hiragino Maru Gothic Pro','Noto Sans JP',sans-serif";

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

async function uploadPhoto(dataUrl, token){
  const commaIdx=dataUrl.indexOf(",");
  const meta=dataUrl.slice(0,commaIdx);
  const mimeMatch=meta.match(/data:([^;,]+)/);
  const mime=mimeMatch?mimeMatch[1]:"image/jpeg";
  const binary=atob(dataUrl.slice(commaIdx+1));
  const arr=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)arr[i]=binary.charCodeAt(i);
  const blob=new Blob([arr],{type:mime});
  const ext=mime==="image/png"?"png":"jpg";
  const path=`${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const up=await fetch(`${SUPA_URL}/storage/v1/object/photos/${path}`,{
    method:"POST",
    headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${token||SUPA_KEY}`,"Content-Type":mime,"x-upsert":"true"},
    body:blob,
  });
  if(!up.ok)throw new Error(await up.text());
  return `${SUPA_URL}/storage/v1/object/public/photos/${path}`;
}

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

function useLeaflet(cb){
  useEffect(()=>{
    if(window.L){cb();return;}
    const css=document.createElement("link");css.rel="stylesheet";css.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(css);
    const js=document.createElement("script");js.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";js.onload=cb;document.head.appendChild(js);
  },[]);
}

const CATEGORIES=[
  {value:"flower", label:"花",     defaultColor:"#e06080"},
  {value:"bird",   label:"鳥",     defaultColor:"#4a9cc7"},
  {value:"fish",   label:"魚",     defaultColor:"#3ab8a0"},
  {value:"cloud",  label:"雲",     defaultColor:"#7ab0d4"},
  {value:"plane",  label:"飛行機", defaultColor:"#8b7cc8"},
  {value:"music",  label:"音符",   defaultColor:"#9b72cc"},
  {value:"sparkle",label:"きらめき",defaultColor:"#f5b942"},
  {value:"bread",  label:"パン",   defaultColor:"#c9813a"},
];
const CAT=Object.fromEntries(CATEGORIES.map(c=>[c.value,c]));
const cl=v=>CAT[v]?.label||"その他";
const getDefaultColor=v=>CAT[v]?.defaultColor||"#7a8a6a";
function getColor(d){return(d?.emoji&&d.emoji.startsWith("#"))?d.emoji:getDefaultColor(d?.category);}
function getBg(color){
  const r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);
  return`rgba(${r},${g},${b},0.13)`;
}

// 改良済みモチーフSVG
const MOTIF_SVG={
  flower:`<ellipse cx="12" cy="6" rx="2.2" ry="3.8"/><ellipse cx="12" cy="6" rx="2.2" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="6" rx="2.2" ry="3.8" transform="rotate(120 12 12)"/><ellipse cx="12" cy="6" rx="2.2" ry="3.8" transform="rotate(180 12 12)"/><ellipse cx="12" cy="6" rx="2.2" ry="3.8" transform="rotate(240 12 12)"/><ellipse cx="12" cy="6" rx="2.2" ry="3.8" transform="rotate(300 12 12)"/><circle cx="12" cy="12" r="3.8"/>`,
  bird:`<path d="M12 7C9.5 7 7 8 5 10C6.5 9.5 8 9.5 9.5 10.5C8 10.5 6.5 11.5 6 13C7.5 12 9.5 12 11 13C10.5 14.5 10.5 16 11.5 17L12 15.5L12.5 17C13.5 16 13.5 14.5 13 13C14.5 12 16.5 12 18 13C17.5 11.5 16 10.5 14.5 10.5C16 9.5 17.5 9.5 19 10C17 8 14.5 7 12 7Z"/>`,
  fish:`<ellipse cx="10" cy="12" rx="6.5" ry="4"/><path d="M16.5 12L22 8.5V15.5Z"/><circle cx="8" cy="11" r="1" fill="white"/>`,
  cloud:`<path d="M18 17H6C4.1 17 2.5 15.4 2.5 13.5C2.5 11.8 3.7 10.3 5.4 10C5.1 9.4 5 8.7 5 8C5 5.5 7 3.5 9.5 3.5C10.9 3.5 12.2 4.1 13.1 5.1C13.6 4.9 14.3 4.7 15 4.7C17.5 4.7 19.5 6.7 19.5 9.2C19.5 9.4 19.5 9.6 19.4 9.7C20.7 10.2 21.5 11.4 21.5 12.8C21.5 15.1 19.9 17 18 17Z"/>`,
  plane:`<path d="M22 12L4 5L8 12L4 19L22 12Z"/>`,
  music:`<path d="M9 17C9 18.7 7.7 20 6 20C4.3 20 3 18.7 3 17C3 15.3 4.3 14 6 14C6.8 14 7.5 14.3 8 14.8V6L20 3V13C20 14.7 18.7 16 17 16C15.3 16 14 14.7 14 13C14 11.3 15.3 10 17 10C17.8 10 18.5 10.3 19 10.8V5.8L9 8.1V17Z"/>`,
  sparkle:`<path d="M12 2L13.8 9L21 11L13.8 13L12 20L10.2 13L3 11L10.2 9Z"/><path d="M19 2L19.8 4.8L22.5 5.5L19.8 6.2L19 9L18.2 6.2L15.5 5.5L18.2 4.8Z"/>`,
  bread:`<path d="M4.5 12C4.5 8 7.8 5.5 12 5.5C16.2 5.5 19.5 8 19.5 12C19.5 14.5 18 16.5 15.5 17.5L12 18.5L8.5 17.5C6 16.5 4.5 14.5 4.5 12Z"/><path d="M8.5 10C9.5 8.8 10.7 8.2 12 8.2C13.3 8.2 14.5 8.8 15.5 10" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`,
};

function MotifIcon({motif,color,size=24,shadow=false}){
  const s=MOTIF_SVG[motif]||MOTIF_SVG.sparkle;
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{filter:shadow?`drop-shadow(0 2px 4px ${color}88)`:"none",flexShrink:0,display:"block"}} dangerouslySetInnerHTML={{__html:s}}/>
  );
}

const WEATHERS=[
  {value:"sunny",emoji:"☀️"},{value:"cloudy",emoji:"☁️"},{value:"rainy",emoji:"🌧️"},
  {value:"snowy",emoji:"❄️"},{value:"windy",emoji:"🌬️"},{value:"rainbow",emoji:"🌈"},
];
function haversine(la1,lo1,la2,lo2){const d=(v)=>v*Math.PI/180;const a=Math.sin(d(la2-la1)/2)**2+Math.cos(d(la1))*Math.cos(d(la2))*Math.sin(d(lo2-lo1)/2)**2;return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function jitter(v){return v+(Math.random()-0.5)*0.00009;}
function roundTimeStr(date){const d=date instanceof Date?date:new Date(date);if(isNaN(d))return"";const h=d.getHours(),m=d.getMinutes(),rm=m<30?0:30;return`${String(h).padStart(2,"0")}:${String(rm).padStart(2,"0")}ごろ`;}

function Polaroid({photo,emoji,category,rotate=0,small=false}){
  const w=small?100:155,h=small?82:125;
  const color=emoji&&emoji.startsWith("#")?emoji:getDefaultColor(category);
  return(
    <div style={{display:"inline-block",background:"white",padding:small?"6px 6px 22px":"10px 10px 36px",boxShadow:"0 4px 18px rgba(0,0,0,0.18)",borderRadius:2,transform:`rotate(${rotate}deg)`}}>
      {photo?<img src={photo} alt="" style={{width:w,height:h,objectFit:"cover",display:"block"}}/>
        :<div style={{width:w,height:h,background:getBg(color),display:"flex",alignItems:"center",justifyContent:"center"}}><MotifIcon motif={category} color={color} size={small?36:56} shadow/></div>}
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

// PinEditMap: lat/lng props 変更で地図が動くよう修正
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

  // 検索で lat/lng が変わったら地図・ピンを更新
  const prevLatRef=useRef(lat);
  const prevLngRef=useRef(lng);
  useEffect(()=>{
    if(!iRef.current||!mkRef.current)return;
    if(lat===prevLatRef.current&&lng===prevLngRef.current)return;
    prevLatRef.current=lat;
    prevLngRef.current=lng;
    mkRef.current.setLatLng([lat,lng]);
    iRef.current.setView([lat,lng],15,{animate:true});
  },[lat,lng]);

  return(
    <div style={{borderRadius:12,overflow:"hidden",height:160,position:"relative"}}>
      <div ref={mRef} style={{width:"100%",height:"100%"}}/>
      {!rdy&&<div style={{position:"absolute",inset:0,background:"#f0f7e8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#8ab060",fontFamily:font}}>読み込み中…</div>}
    </div>
  );
}

// LiveMap: 地図ピンは吹き出しなし・モチーフをそのまま表示
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
      const op=Math.max(0.3,1-(age/(7*24*3600000))*0.7);
      const color=getColor(d);
      const svgInner=MOTIF_SVG[d.category]||MOTIF_SVG.sparkle;
      // 吹き出しなし・モチーフをそのまま表示
      const icon=L.divIcon({
        className:"",
        html:`<div style="opacity:${op};width:44px;height:44px;display:flex;align-items:center;justify-content:center"><svg width="38" height="38" viewBox="0 0 24 24" fill="${color}" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.45))">${svgInner}</svg></div>`,
        iconSize:[44,44],
        iconAnchor:[22,22],
      });
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

// スライドメニュー更新: タイムライン/思い出/マイページ
function SlideMenu({open,onClose,onSetTab,onOpenProfile,onSignOut,onCaptureLater,userName,avatarUrl}){
  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200}}/>}
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:260,background:"#faf7f2",zIndex:201,transform:open?"translateX(0)":"translateX(100%)",transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"52px 20px 16px",borderBottom:"1px solid #eee8e0",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:"50%",overflow:"hidden",background:"#e8f5e3",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {avatarUrl?<img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:22}}>👤</span>}
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:800,fontFamily:font}}>{userName||"ゲスト"}</div>
            <div style={{fontSize:11,color:"#6db85c",fontFamily:font}}>pocoru</div>
          </div>
        </div>
        <div style={{flex:1,padding:"8px 0",overflowY:"auto"}}>
          {[
            {emoji:"🗒️",label:"タイムライン",sub:"近くの発見 1週間",action:()=>{onClose();onSetTab(1);}},
            {emoji:"📖",label:"思い出",sub:"自分の発見・永久保存",action:()=>{onClose();onSetTab(2);}},
            {emoji:"👤",label:"マイページ",sub:"他の人から見た自分",action:()=>{onClose();onOpenProfile();}},
            {emoji:"🕐",label:"後から投稿",sub:"日時・場所を指定して投稿",action:()=>{onClose();onCaptureLater();}},
          ].map((m,i)=>(
            <button key={i} onClick={m.action||onClose} style={{width:"100%",padding:"13px 20px",border:"none",background:"transparent",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:font}}>
              <span style={{fontSize:18}}>{m.emoji}</span>
              <div><div style={{fontSize:13,fontWeight:600,color:"#3a3028"}}>{m.label}</div>{m.sub&&<div style={{fontSize:11,color:"#aaa",marginTop:1}}>{m.sub}</div>}</div>
            </button>
          ))}
        </div>
        <div style={{padding:"14px 20px",paddingBottom:"max(14px,env(safe-area-inset-bottom))",borderTop:"1px solid #eee8e0",display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={onSignOut} style={{width:"100%",padding:"10px 0",borderRadius:13,border:"1px solid #fca5a5",background:"white",color:"#ef4444",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:font}}>ログアウト</button>
          <button onClick={onClose} style={{width:"100%",padding:"11px 0",borderRadius:13,border:"none",background:"#6db85c",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:font}}>閉じる</button>
        </div>
      </div>
    </>
  );
}

function DetailModal({item,isOwn,onClose,onHeart,myHearts,onUpdate,onDelete,onViewUser}){
  const already=myHearts.includes(item.id);
  const age=Date.now()-new Date(item.posted_at).getTime();
  const timeStr=item.custom_time?`${new Date(item.custom_time).toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"})} ${roundTimeStr(new Date(item.custom_time))}`:roundTimeStr(new Date(item.posted_at));
  const op=Math.max(0.3,1-(age/(7*24*3600000))*0.7);
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
            <div style={{width:44,height:44,borderRadius:13,background:getBg(getColor(item)),display:"flex",alignItems:"center",justifyContent:"center",opacity:op}}><MotifIcon motif={item.category} color={getColor(item)} size={24} shadow/></div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:getColor(item),fontFamily:font}}>{cl(item.category)}</div>
              <div style={{fontSize:11,color:"#bbb",fontFamily:font}}>{timeStr}{wEmoji&&<span style={{marginLeft:5}}>{wEmoji}</span>}</div>
              {item.user_name&&!isOwn&&(
                <button onClick={()=>{onClose();onViewUser(item.user_id,item.user_name);}} style={{border:"none",background:"none",cursor:"pointer",fontSize:11,color:"#6db85c",fontFamily:font,padding:0,marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                  {item.user_avatar?<img src={item.user_avatar} alt="" style={{width:16,height:16,borderRadius:"50%",objectFit:"cover"}}/>:<span>👤</span>}
                  {item.user_name}
                </button>
              )}
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {isOwn&&<button onClick={()=>setShowEdit(!showEdit)} style={{padding:"5px 10px",borderRadius:9,border:`1px solid ${showEdit?"#6db85c":"#ddd"}`,background:showEdit?"#e8f5e3":"white",color:showEdit?"#6db85c":"#888",fontSize:12,cursor:"pointer",fontFamily:font}}>✏️</button>}
            {isOwn&&<button onClick={()=>{if(window.confirm("この投稿を削除しますか？"))onDelete(item.id);}} style={{padding:"5px 10px",borderRadius:9,border:"1px solid #fca5a5",background:"white",color:"#ef4444",fontSize:12,cursor:"pointer",fontFamily:font}}>🗑️</button>}
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
        <div style={{background:getBg(getColor(item)),borderRadius:13,padding:"11px 13px",marginBottom:16,borderLeft:`4px solid ${getColor(item)}`}}>
          <div style={{fontSize:10,color:getColor(item),fontWeight:700,letterSpacing:1,marginBottom:3,fontFamily:font}}>✦ ひとこと</div>
          <p style={{margin:0,fontSize:13,lineHeight:1.7,color:"#3a3028",fontStyle:"italic",fontFamily:font}}>{item.ai_msg}</p>
        </div>
        <button onClick={()=>!already&&onHeart(item.id)} style={{width:"100%",padding:"14px 0",borderRadius:16,border:"none",cursor:already?"default":"pointer",background:already?"#fde8ef":"white",boxShadow:already?"0 0 0 2px #e06080 inset":"0 2px 12px rgba(0,0,0,0.1)",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <span style={{fontSize:26,transform:already?"scale(1.2)":"scale(1)",transition:"transform 0.2s"}}>{already?"❤️":"🤍"}</span>
          <div style={{textAlign:"left"}}><div style={{fontSize:14,fontWeight:700,color:already?"#e06080":"#888",fontFamily:font}}>{already?"ありがとう":"いいね"}</div><div style={{fontSize:11,color:"#bbb",fontFamily:font}}>{item.hearts||0}人が共感</div></div>
        </button>
      </div>
    </div>
  );
}

function WeatherPanel({userLocation,onPost,onClose}){
  const [sel,setSel]=useState(null);
  const [photo,setPhoto]=useState(null);
  const [posting,setPosting]=useState(false);
  const cameraRef=useRef(null);
  const albumRef=useRef(null);
  function handlePhoto(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhoto(ev.target.result);r.readAsDataURL(f);}
  async function post(){
    if(!sel)return;setPosting(true);
    try{
      const lat=userLocation?.lat?jitter(userLocation.lat):null;
      const lng=userLocation?.lng?jitter(userLocation.lng):null;
      let photoUrl=null;
      if(photo)photoUrl=await uploadPhoto(photo,null);
      await supa("weather_reports",{method:"POST",prefer:"return=minimal",body:JSON.stringify({weather:sel,lat,lng,photo:photoUrl})});
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
              <button onClick={()=>cameraRef.current?.click()} style={{flex:1,padding:"9px 0",borderRadius:10,border:"1.5px dashed #c8e0b8",background:"#f4faf0",color:"#6db85c",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:font}}>📷 カメラ</button>
              <button onClick={()=>albumRef.current?.click()} style={{flex:1,padding:"9px 0",borderRadius:10,border:"1.5px dashed #c8e0b8",background:"#f4faf0",color:"#6db85c",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:font}}>🖼️ アルバム</button>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:"none"}}/>
              <input ref={albumRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
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

// ProfileModal: アバター設定・フォロー一覧・コルクボード表示
function ProfileModal({myUserId,myUserName,myAvatar,targetUserId,targetUserName,discoveries,token,onClose,onViewUser}){
  const isMe=!targetUserId||targetUserId===myUserId;
  const userId=isMe?myUserId:targetUserId;
  const userName=isMe?myUserName:targetUserName;
  const [editName,setEditName]=useState(myUserName||"");
  const [savingName,setSavingName]=useState(false);
  const [avatarUrl,setAvatarUrl]=useState(isMe?myAvatar:null);
  const avatarInputRef=useRef(null);
  const [followers,setFollowers]=useState([]);
  const [following,setFollowing]=useState([]);
  const [isFollowing,setIsFollowing]=useState(false);
  const [loadingFollow,setLoadingFollow]=useState(false);
  const [showFollowList,setShowFollowList]=useState(null); // null|'followers'|'following'
  const [followUsers,setFollowUsers]=useState([]);
  const stickyColors=["yellow","pink","blue","green","orange"];

  useEffect(()=>{
    if(!userId)return;
    supa(`follows?following_id=eq.${userId}`).then(d=>setFollowers(d||[])).catch(()=>{});
    supa(`follows?follower_id=eq.${userId}`).then(d=>setFollowing(d||[])).catch(()=>{});
    if(!isMe&&myUserId)supa(`follows?follower_id=eq.${myUserId}&following_id=eq.${userId}`).then(d=>setIsFollowing((d||[]).length>0)).catch(()=>{});
    if(!isMe)supa(`users?id=eq.${userId}&select=avatar_url`).then(d=>{if(d&&d[0]?.avatar_url)setAvatarUrl(d[0].avatar_url);}).catch(()=>{});
  },[userId]);

  async function loadFollowUsers(type){
    const list=type==='followers'?followers:following;
    const ids=list.map(f=>type==='followers'?f.follower_id:f.following_id).filter(Boolean);
    if(ids.length===0){setFollowUsers([]);setShowFollowList(type);return;}
    try{
      const data=await supa(`users?id=in.(${ids.join(',')})&select=id,name,avatar_url`);
      setFollowUsers(data||[]);
    }catch{setFollowUsers([]);}
    setShowFollowList(type);
  }

  async function toggleFollow(){
    if(!myUserId||loadingFollow)return;setLoadingFollow(true);
    try{
      if(isFollowing){await supa(`follows?follower_id=eq.${myUserId}&following_id=eq.${userId}`,{method:"DELETE",prefer:"return=minimal"},token);setIsFollowing(false);}
      else{await supa("follows",{method:"POST",prefer:"return=minimal",body:JSON.stringify({follower_id:myUserId,following_id:userId})},token);setIsFollowing(true);}
    }catch(e){alert(e.message);}
    setLoadingFollow(false);
  }

  async function saveName(){
    if(!editName.trim()||!myUserId)return;setSavingName(true);
    try{
      await supa(`users?id=eq.${myUserId}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({name:editName.trim()})},token);
      lsSet("userName",editName.trim());
    }catch(e){alert(e.message);}
    setSavingName(false);
  }

  async function handleAvatarUpload(e){
    const f=e.target.files?.[0];if(!f)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      try{
        const url=await uploadPhoto(ev.target.result,token);
        await supa(`users?id=eq.${myUserId}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({avatar_url:url})},token);
        setAvatarUrl(url);
        lsSet("myAvatar",url);
      }catch(e){alert("アバター更新失敗: "+e.message);}
    };
    reader.readAsDataURL(f);
  }

  const userDisc=discoveries.filter(d=>d.user_id===userId);

  if(showFollowList){
    return(
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#faf7f2",borderRadius:"28px 28px 0 0",padding:"22px 20px 48px",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",animation:"slideUp 0.35s ease",maxHeight:"90dvh",overflowY:"auto"}}>
          <div style={{width:40,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={()=>setShowFollowList(null)} style={{border:"none",background:"none",cursor:"pointer",fontSize:13,color:"#6db85c",fontWeight:700,fontFamily:font,padding:0}}>‹ 戻る</button>
            <div style={{fontSize:15,fontWeight:800,fontFamily:font}}>{showFollowList==='followers'?'フォロワー':'フォロー中'} {followUsers.length}人</div>
          </div>
          {followUsers.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#ccc",fontFamily:font,fontSize:13}}>まだいません</div>}
          {followUsers.map(u=>(
            <button key={u.id} onClick={()=>{onClose();onViewUser(u.id,u.name);}} style={{width:"100%",padding:"12px 16px",border:"none",background:"white",borderRadius:12,marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",fontFamily:font}}>
              <div style={{width:40,height:40,borderRadius:"50%",overflow:"hidden",background:"#e8f5e3",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {u.avatar_url?<img src={u.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:20}}>👤</span>}
              </div>
              <span style={{fontSize:14,fontWeight:600,color:"#3a3028"}}>{u.name}</span>
              <span style={{marginLeft:"auto",fontSize:12,color:"#6db85c"}}>›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#faf7f2",borderRadius:"28px 28px 0 0",padding:"22px 20px 0",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",animation:"slideUp 0.35s ease",maxHeight:"90dvh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 16px"}}/>
        {/* ヘッダー */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {/* アバター */}
            <div style={{position:"relative"}}>
              <div style={{width:60,height:60,borderRadius:"50%",overflow:"hidden",background:"#e8f5e3",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:isMe?"pointer":"default",border:"2.5px solid #6db85c"}} onClick={()=>isMe&&avatarInputRef.current?.click()}>
                {avatarUrl?<img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:28}}>👤</span>}
              </div>
              {isMe&&<div style={{position:"absolute",bottom:0,right:0,width:20,height:20,background:"#6db85c",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:11}} onClick={()=>avatarInputRef.current?.click()}>✏️</div>}
              {isMe&&<input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:"none"}}/>}
            </div>
            <div>
              <div style={{fontSize:18,fontWeight:800,fontFamily:font}}>{isMe?"マイページ":userName}</div>
              <div style={{display:"flex",gap:12,marginTop:4}}>
                <button onClick={()=>loadFollowUsers('following')} style={{border:"none",background:"none",cursor:"pointer",fontSize:12,color:"#3a3028",fontFamily:font,padding:0}}>フォロー <span style={{fontWeight:700,color:"#6db85c"}}>{following.length}</span></button>
                <button onClick={()=>loadFollowUsers('followers')} style={{border:"none",background:"none",cursor:"pointer",fontSize:12,color:"#3a3028",fontFamily:font,padding:0}}>フォロワー <span style={{fontWeight:700,color:"#6db85c"}}>{followers.length}</span></button>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            {!isMe&&myUserId&&<button onClick={toggleFollow} disabled={loadingFollow} style={{padding:"7px 14px",borderRadius:11,border:"none",cursor:"pointer",background:isFollowing?"#fde8ef":"#6db85c",color:isFollowing?"#e06080":"white",fontSize:12,fontWeight:700,fontFamily:font}}>{loadingFollow?"…":isFollowing?"フォロー中":"フォロー"}</button>}
            <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#eee8e0",color:"#aaa",fontSize:13,cursor:"pointer"}}>×</button>
          </div>
        </div>
        {/* 名前編集(自分のみ) */}
        {isMe&&(
          <div style={{background:"white",borderRadius:13,padding:12,marginBottom:13,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#6db85c",marginBottom:7,fontFamily:font}}>名前を変更</div>
            <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="名前" style={{width:"100%",padding:"8px 11px",borderRadius:9,border:"1px solid #e8e0d8",fontSize:13,fontFamily:font,outline:"none",boxSizing:"border-box",marginBottom:7}}/>
            <button onClick={saveName} disabled={savingName} style={{width:"100%",padding:"8px 0",borderRadius:9,border:"none",background:"#6db85c",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:font}}>{savingName?"保存中…":"保存"}</button>
          </div>
        )}
        {/* 投稿数バッジ */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"0 2px"}}>
          <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:2,fontFamily:font}}>発見 {userDisc.length}件</div>
          {isMe&&<div style={{fontSize:10,background:"#e8f5e3",color:"#6db85c",padding:"2px 8px",borderRadius:8,fontWeight:700,fontFamily:font}}>永久保存</div>}
        </div>
        {/* コルクボード */}
        <div style={{background:"#c8a882",padding:"12px 8px 48px",minHeight:200,marginLeft:-20,marginRight:-20}}>
          {userDisc.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.7)"}}><div style={{fontSize:32,marginBottom:8}}>🌱</div><div style={{fontSize:13,fontFamily:font}}>まだ投稿がありません</div></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px 12px"}}>
            {userDisc.map((d,i)=>{
              const rot=[2,-3,1,-2,3,-1][i%6];
              const sRot=[-2,3,-1,2,-3,1][i%6];
              return(
                <div key={d.id} style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:10,position:"relative"}}>
                  <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:12,height:18,zIndex:2,display:"flex",gap:2}}>
                    <div style={{width:5,height:18,background:"#7a6040",borderRadius:"2px 2px 3px 3px",boxShadow:"1px 1px 2px rgba(0,0,0,0.3)"}}/>
                    <div style={{width:5,height:18,background:"#7a6040",borderRadius:"2px 2px 3px 3px",boxShadow:"1px 1px 2px rgba(0,0,0,0.3)"}}/>
                  </div>
                  <div style={{transform:`rotate(${rot}deg)`,transformOrigin:"top center",filter:"drop-shadow(2px 4px 8px rgba(0,0,0,0.25))"}}>
                    <Polaroid photo={d.photo} emoji={d.emoji} category={d.category}/>
                  </div>
                  {d.note&&d.note!=="📷"&&(
                    <div style={{transform:`rotate(${sRot}deg)`,marginTop:-8,width:"90%"}}>
                      <StickyNote text={d.note} colorKey={stickyColors[i%stickyColors.length]}/>
                    </div>
                  )}
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.8)",marginTop:4,fontFamily:font,textAlign:"center"}}>❤️{d.hearts||0}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// PhotoEditor: フィルターをピクセル操作で確実に適用
function applyPixelFilters(ctx, W, H, brt, ctr, sat){
  if(brt===100&&ctr===100&&sat===100)return;
  try{
    const id=ctx.getImageData(0,0,W,H);
    const d=id.data;
    const bl=brt/100;
    const ct=ctr/100;
    const st=sat/100;
    for(let i=0;i<d.length;i+=4){
      let r=d[i]*bl,g=d[i+1]*bl,b=d[i+2]*bl;
      r=(r-128)*ct+128;g=(g-128)*ct+128;b=(b-128)*ct+128;
      const gray=0.299*r+0.587*g+0.114*b;
      r=gray+(r-gray)*st;g=gray+(g-gray)*st;b=gray+(b-gray)*st;
      d[i]=Math.max(0,Math.min(255,Math.round(r)));
      d[i+1]=Math.max(0,Math.min(255,Math.round(g)));
      d[i+2]=Math.max(0,Math.min(255,Math.round(b)));
    }
    ctx.putImageData(id,0,0);
  }catch(e){console.warn("pixel filter error",e);}
}

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
  const cssFilter=`brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;

  useEffect(()=>{
    if(tab!=="crop")return;
    const canvas=canvasRef.current;if(!canvas)return;
    const img=imgRef.current;
    const draw=()=>{
      const W=canvas.width,H=canvas.height;
      const ctx=canvas.getContext("2d");
      ctx.clearRect(0,0,W,H);
      ctx.drawImage(img,0,0,W,H);
      // ピクセル操作でフィルター適用
      applyPixelFilters(ctx,W,H,brightness,contrast,saturate);
      const cx=crop.x*W,cy=crop.y*H,cw=crop.w*W,ch=crop.h*H;
      ctx.fillStyle="rgba(0,0,0,0.45)";
      ctx.fillRect(0,0,W,cy);ctx.fillRect(0,cy+ch,W,H-(cy+ch));ctx.fillRect(0,cy,cx,ch);ctx.fillRect(cx+cw,cy,W-(cx+cw),ch);
      ctx.strokeStyle="white";ctx.lineWidth=2;ctx.strokeRect(cx,cy,cw,ch);
      [1/3,2/3].forEach(t=>{ctx.strokeStyle="rgba(255,255,255,0.4)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+cw*t,cy);ctx.lineTo(cx+cw*t,cy+ch);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy+ch*t);ctx.lineTo(cx+cw,cy+ch*t);ctx.stroke();});
      [[cx,cy],[cx+cw,cy],[cx,cy+ch],[cx+cw,cy+ch]].forEach(([hx,hy])=>{ctx.fillStyle="white";ctx.fillRect(hx-5,hy-5,10,10);});
    };
    if(img.src!==photo){img.onload=draw;img.src=photo;}else draw();
  },[tab,crop,brightness,contrast,saturate,photo]);

  function getPos(e){const c=canvasRef.current,r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height,t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*sx/c.width,y:(t.clientY-r.top)*sy/c.height};}
  function onCropStart(e){e.preventDefault();const{x,y}=getPos(e);const{x:cx,y:cy,w:cw,h:ch}=crop,th=0.06;let handle=null;if(Math.abs(x-cx)<th&&Math.abs(y-cy)<th)handle="tl";else if(Math.abs(x-(cx+cw))<th&&Math.abs(y-cy)<th)handle="tr";else if(Math.abs(x-cx)<th&&Math.abs(y-(cy+ch))<th)handle="bl";else if(Math.abs(x-(cx+cw))<th&&Math.abs(y-(cy+ch))<th)handle="br";else if(x>cx&&x<cx+cw&&y>cy&&y<cy+ch)handle="move";if(handle)dragging.current={handle,startX:x,startY:y,startCrop:{...crop}};}
  function onCropMove(e){e.preventDefault();if(!dragging.current)return;const{x,y}=getPos(e);const{handle,startX,startY,startCrop:sc}=dragging.current;const dx=x-startX,dy=y-startY,min=0.1;let{x:nx,y:ny,w:nw,h:nh}={...sc};if(handle==="move"){nx=Math.max(0,Math.min(1-nw,sc.x+dx));ny=Math.max(0,Math.min(1-nh,sc.y+dy));}else if(handle==="tl"){nx=Math.max(0,Math.min(sc.x+sc.w-min,sc.x+dx));ny=Math.max(0,Math.min(sc.y+sc.h-min,sc.y+dy));nw=sc.x+sc.w-nx;nh=sc.y+sc.h-ny;}else if(handle==="tr"){ny=Math.max(0,Math.min(sc.y+sc.h-min,sc.y+dy));nw=Math.max(min,Math.min(1-sc.x,sc.w+dx));nh=sc.y+sc.h-ny;}else if(handle==="bl"){nx=Math.max(0,Math.min(sc.x+sc.w-min,sc.x+dx));nw=sc.x+sc.w-nx;nh=Math.max(min,Math.min(1-sc.y,sc.h+dy));}else if(handle==="br"){nw=Math.max(min,Math.min(1-sc.x,sc.w+dx));nh=Math.max(min,Math.min(1-sc.y,sc.h+dy));}setCrop({x:nx,y:ny,w:nw,h:nh});}
  function onCropEnd(){dragging.current=null;}

  function handleSave(){
    function draw(img){
      const sw=img.naturalWidth||300,sh=img.naturalHeight||240;
      const cw=Math.round(crop.w*sw)||300,ch=Math.round(crop.h*sh)||240;
      const off=document.createElement("canvas");
      off.width=cw;off.height=ch;
      const ctx=off.getContext("2d");
      ctx.drawImage(img,Math.round(crop.x*sw),Math.round(crop.y*sh),cw,ch,0,0,cw,ch);
      // ピクセル操作でフィルターを確実に適用
      applyPixelFilters(ctx,cw,ch,brightness,contrast,saturate);
      onSave({brightness,contrast,saturate,rotate,croppedPhoto:off.toDataURL("image/jpeg",0.92)});
    }
    const img=new window.Image();
    let done=false;
    img.onload=()=>{if(!done){done=true;draw(img);}};
    img.src=photo;
    if(img.complete&&img.naturalWidth>0&&!done){done=true;draw(img);}
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
                <img src={photo} alt="" style={{width:150,height:120,objectFit:"cover",display:"block",filter:cssFilter}}/>
              </div>
            </div>
            {[{label:"☀️ 明るさ",val:brightness,set:setBrightness,min:50,max:200},{label:"◑ コントラスト",val:contrast,set:setContrast,min:50,max:200},{label:"🎨 彩度",val:saturate,set:setSaturate,min:0,max:200},{label:"↻ 傾き",val:rotate+10,set:v=>setRotate(v-10),min:0,max:20}].map(s=>(
              <div key={s.label} style={{marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:11,color:"#888",fontFamily:font}}>{s.label}</span><span style={{fontSize:10,color:"#bbb",fontFamily:font}}>{s.val}</span></div>
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

function LocationSearch({onSelect}){
  const [q,setQ]=useState("");
  const [results,setResults]=useState([]);
  const [loading,setLoading]=useState(false);
  async function search(){
    if(!q.trim())return;
    setLoading(true);
    try{
      const res=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=ja`);
      const data=await res.json();
      setResults(data||[]);
    }catch{}
    setLoading(false);
  }
  return(
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",gap:6}}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="場所を検索（例：新宿駅）" style={{flex:1,padding:"7px 10px",borderRadius:9,border:"1px solid #e8e0d8",fontSize:12,fontFamily:font,outline:"none"}}/>
        <button onClick={search} disabled={loading} style={{padding:"7px 12px",borderRadius:9,border:"none",background:"#6db85c",color:"white",fontSize:12,cursor:"pointer",fontFamily:font,flexShrink:0}}>{loading?"…":"検索"}</button>
      </div>
      {results.length>0&&(
        <div style={{background:"white",borderRadius:9,border:"1px solid #e8e0d8",marginTop:4,maxHeight:140,overflowY:"auto"}}>
          {results.map((r,i)=>(
            <button key={i} onClick={()=>{onSelect(parseFloat(r.lat),parseFloat(r.lon));setResults([]);setQ(r.display_name.split(",")[0]);}} style={{width:"100%",padding:"8px 10px",border:"none",background:"transparent",textAlign:"left",cursor:"pointer",fontSize:11,fontFamily:font,borderBottom:i<results.length-1?"1px solid #f0e8e0":"none",color:"#3a3028"}}>
              📍 {r.display_name.split(",").slice(0,3).join(", ")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// CaptureModal: カメラ/アルバム別input・モチーフ文字なし大きく・色選択ダイアログ
function CaptureModal({userLocation,locStatus,onClose,onSave,laterMode=false}){
  const [note,setNote]=useState("");
  const [category,setCategory]=useState("flower");
  const [color,setColor]=useState("#e06080");
  const [photo,setPhoto]=useState(null);
  const [photoEdit,setPhotoEdit]=useState(null);
  const [showEditor,setShowEditor]=useState(false);
  const [loading,setLoading]=useState(false);
  const [laterTime,setLaterTime]=useState("");
  const [laterLat,setLaterLat]=useState(userLocation?.lat||null);
  const [laterLng,setLaterLng]=useState(userLocation?.lng||null);
  const cameraRef=useRef(null);
  const albumRef=useRef(null);
  const colorInputRef=useRef(null);

  function handleCat(v){setCategory(v);setColor(CAT[v]?.defaultColor||"#7a8a6a");}
  function handlePhoto(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setPhoto(ev.target.result);setShowEditor(true);};r.readAsDataURL(f);}

  async function handleSave(){
    if(!note.trim()&&!photo)return;
    setLoading(true);
    const lat=laterMode?laterLat:(userLocation?.lat?jitter(userLocation.lat):null);
    const lng=laterMode?laterLng:(userLocation?.lng?jitter(userLocation.lng):null);
    await onSave({note:note||"📷",category,emoji:color,photo:photoEdit?.croppedPhoto||photo,photoEdit,weather:null,lat,lng,customTime:laterMode&&laterTime?laterTime:null});
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
        {!laterMode&&<div style={{display:"flex",alignItems:"center",gap:7,marginBottom:11,padding:"5px 10px",borderRadius:8,background:locBadge.bg}}>
          <span style={{fontSize:11,color:locBadge.color,fontWeight:700,fontFamily:font}}>📍 {locBadge.text}</span>
          {locStatus==="ok"&&userLocation&&<span style={{fontSize:10,color:"#aaa",marginLeft:"auto",fontFamily:font}}>±{Math.round(userLocation.accuracy||0)}m</span>}
        </div>}
        {laterMode&&<>
          <div style={{marginBottom:11}}>
            <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>📅 日時を指定</div>
            <input type="datetime-local" value={laterTime} onChange={e=>setLaterTime(e.target.value)} style={{width:"100%",padding:"8px 11px",borderRadius:10,border:"1px solid #e8e0d8",fontSize:12,fontFamily:font,outline:"none",boxSizing:"border-box",color:"#3a3028"}}/>
          </div>
          <div style={{marginBottom:11}}>
            <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>📍 場所を指定</div>
            <LocationSearch onSelect={(la,lo)=>{setLaterLat(la);setLaterLng(lo);}}/>
            <PinEditMap lat={laterLat||35.6812} lng={laterLng||139.7671} onMove={(la,lo)=>{setLaterLat(la);setLaterLng(lo);}}/>
          </div>
        </>}
        {/* カメラ/アルバム: 別々のinputで確実に動作 */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:"none"}}/>
        <input ref={albumRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
        <div style={{marginBottom:11}}>
          {photo
            ?<div style={{position:"relative",display:"flex",justifyContent:"center"}}>
                <div style={{background:"white",padding:"7px 7px 24px",boxShadow:"0 4px 16px rgba(0,0,0,0.18)",borderRadius:2,transform:`rotate(${photoEdit?.rotate||0}deg)`}}>
                  <img src={photoEdit?.croppedPhoto||photo} alt="" style={{width:150,height:120,objectFit:"cover",display:"block"}}/>
                </div>
                <div style={{position:"absolute",top:4,right:4,display:"flex",gap:4}}>
                  <button onClick={()=>setShowEditor(true)} style={{padding:"3px 7px",borderRadius:7,border:"none",background:"rgba(0,0,0,0.55)",color:"white",fontSize:11,cursor:"pointer"}}>✏️</button>
                  <button onClick={()=>{setPhoto(null);setPhotoEdit(null);}} style={{width:22,height:22,borderRadius:"50%",border:"none",background:"rgba(0,0,0,0.5)",color:"white",fontSize:11,cursor:"pointer"}}>×</button>
                </div>
              </div>
            :<div style={{display:"flex",gap:8}}>
              <button onClick={()=>cameraRef.current?.click()} style={{flex:1,padding:"14px 0",borderRadius:12,border:"1.5px dashed #c8e0b8",background:"#f4faf0",color:"#6db85c",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:font}}>📷 カメラ</button>
              <button onClick={()=>albumRef.current?.click()} style={{flex:1,padding:"14px 0",borderRadius:12,border:"1.5px dashed #c8e0b8",background:"#f4faf0",color:"#6db85c",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:font}}>🖼️ アルバム</button>
            </div>
          }
        </div>
        {/* モチーフ: 文字なし・アイコン大きく */}
        <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:font}}>モチーフ</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
          {CATEGORIES.map(c=>{
            const sel=category===c.value;
            const col=sel?color:c.defaultColor;
            return(
              <button key={c.value} onClick={()=>handleCat(c.value)} style={{padding:"12px 4px",borderRadius:12,border:"none",cursor:"pointer",background:sel?getBg(color):"white",boxShadow:sel?`0 0 0 2.5px ${color}`:"0 1px 4px rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <MotifIcon motif={c.value} color={col} size={28} shadow={sel}/>
              </button>
            );
          })}
        </div>
        {/* 色選択: ダイアログ形式ボタン */}
        <div style={{marginBottom:11}}>
          <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>モチーフカラー</div>
          <button onClick={()=>colorInputRef.current?.click()} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #e8e0d8",background:"white",display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontFamily:font}}>
            <div style={{width:30,height:30,borderRadius:8,background:color,flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}/>
            <span style={{fontSize:12,color:"#888"}}>🎨 色を選ぶ</span>
            <div style={{marginLeft:"auto",fontSize:11,color:"#bbb",fontFamily:"monospace"}}>{color}</div>
          </button>
          <input ref={colorInputRef} type="color" value={color} onChange={e=>setColor(e.target.value)} style={{position:"absolute",opacity:0,width:0,height:0,pointerEvents:"none"}}/>
        </div>
        <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>ひとこと（写真のみでもOK）</div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="何を見つけた？感じた？（省略可）" rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:12,border:"1.5px solid #e8e0d8",background:"white",color:"#3a3028",fontSize:13,resize:"none",boxSizing:"border-box",outline:"none",fontFamily:font,lineHeight:1.6}}/>
        <button onClick={handleSave} disabled={loading||(!note.trim()&&!photo)} style={{width:"100%",padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",background:loading?"#a8d898":(!note.trim()&&!photo)?"#c8e0b8":"#6db85c",color:"white",fontSize:14,fontWeight:800,fontFamily:font,marginTop:10}}>
          {loading?"投稿中…":"みんなに届ける 🌱"}
        </button>
      </div>
    </div>
  );
}

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

// ── コルクボードグリッド共通コンポーネント
function CorkBoard({items,onItemClick,showUser=false}){
  const stickyColors=["yellow","pink","blue","green","orange"];
  if(items.length===0)return(
    <div style={{textAlign:"center",padding:"50px 0",color:"rgba(255,255,255,0.7)"}}>
      <div style={{fontSize:36,marginBottom:10}}>🌱</div>
      <div style={{fontSize:13,fontFamily:font}}>まだ投稿がありません</div>
    </div>
  );
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px 12px"}}>
      {items.map((d,i)=>{
        const rot=[2,-3,1,-2,3,-1][i%6];
        const sRot=[-2,3,-1,2,-3,1][i%6];
        return(
          <div key={d.id} onClick={()=>onItemClick(d)} style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:10,position:"relative"}}>
            <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:12,height:18,zIndex:2,display:"flex",gap:2}}>
              <div style={{width:5,height:18,background:"#7a6040",borderRadius:"2px 2px 3px 3px",boxShadow:"1px 1px 2px rgba(0,0,0,0.3)"}}/>
              <div style={{width:5,height:18,background:"#7a6040",borderRadius:"2px 2px 3px 3px",boxShadow:"1px 1px 2px rgba(0,0,0,0.3)"}}/>
            </div>
            <div style={{transform:`rotate(${rot}deg)`,transformOrigin:"top center",filter:"drop-shadow(2px 4px 8px rgba(0,0,0,0.25))"}}>
              <Polaroid photo={d.photo} emoji={d.emoji} category={d.category}/>
            </div>
            {d.note&&d.note!=="📷"&&(
              <div style={{transform:`rotate(${sRot}deg)`,marginTop:-8,width:"90%"}}>
                <StickyNote text={d.note} colorKey={stickyColors[i%stickyColors.length]}/>
              </div>
            )}
            <div style={{fontSize:9,color:"rgba(255,255,255,0.8)",marginTop:4,fontFamily:font,textAlign:"center",display:"flex",alignItems:"center",gap:4}}>
              {showUser&&d.user_name&&<span style={{opacity:0.9}}>{d.user_name}</span>}
              <span>❤️{d.hearts||0}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main App
export default function App(){
  const [tab,setTab]               = useState(0);
  const [discoveries,setDiscoveries]   = useState([]);
  const [myDiscoveries,setMyDiscoveries] = useState([]);
  const [weatherReports,setWeatherReports] = useState([]);
  const [selected,setSelected]     = useState(null);
  const [showCapture,setShowCapture] = useState(false);
  const [showCaptureLater,setShowCaptureLater] = useState(false);
  const [showWeatherPanel,setShowWeatherPanel] = useState(false);
  const [showProfile,setShowProfile] = useState(false);
  const [profileTarget,setProfileTarget] = useState({id:null,name:null});
  const [myHearts,setMyHearts]     = useState(()=>lsGet("myHearts",[]));
  const [myUserId,setMyUserId]     = useState(null);
  const [myUserName,setMyUserName] = useState("");
  const [myAvatar,setMyAvatar]     = useState(()=>lsGet("myAvatar",null));
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
            await supa(`users?id=eq.${user.id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({name})},at).catch(()=>{});
            await supa("users",{method:"POST",prefer:"return=minimal",body:JSON.stringify({id:user.id,name})},at).catch(()=>{});
            // アバター取得
            const udata=await supa(`users?id=eq.${user.id}&select=avatar_url`,{},at).catch(()=>null);
            if(udata&&udata[0]?.avatar_url){setMyAvatar(udata[0].avatar_url);lsSet("myAvatar",udata[0].avatar_url);}
          }catch(e){console.error(e);}
          window.history.replaceState(null,"",window.location.pathname);
        }
        setAuthReady(true);return;
      }
      const stored=getSession();
      if(stored){
        if(stored.expires_at&&Date.now()>stored.expires_at-300000){
          const refreshed=await refreshToken(stored.refresh_token);
          if(refreshed){
            saveSession(refreshed);sessionRef.current=refreshed;
            const u=refreshed.user;setMyUserId(u.id);setMyUserName(lsGet("userName",u.user_metadata?.full_name||"旅人"));
            setMyAvatar(lsGet("myAvatar",null));
          }else{saveSession(null);}
        }else{
          sessionRef.current=stored;const u=stored.user;
          setMyUserId(u.id);setMyUserName(lsGet("userName",u.user_metadata?.full_name||"旅人"));
          setMyAvatar(lsGet("myAvatar",null));
        }
      }
      setAuthReady(true);
    }
    init();
  },[]);

  // アバター更新の反映
  useEffect(()=>{
    if(myAvatar)lsSet("myAvatar",myAvatar);
  },[myAvatar]);

  // データ取得: 7日間
  async function fetchAll(){
    try{
      const since=new Date(Date.now()-7*24*3600000).toISOString();
      const data=await supa(`discoveries?posted_at=gte.${since}&order=posted_at.desc&limit=300&select=id,note,category,emoji,photo,weather,lat,lng,ai_msg,hearts,user_id,user_name,user_avatar,custom_time,posted_at`);
      setDiscoveries(data||[]);
    }catch(e){console.error(e);}
  }
  async function fetchMy(uid){
    try{
      const data=await supa(`discoveries?user_id=eq.${uid}&order=posted_at.desc&limit=500&select=id,note,category,emoji,photo,weather,lat,lng,ai_msg,hearts,user_id,user_name,user_avatar,custom_time,posted_at`);
      setMyDiscoveries(data||[]);
    }catch(e){console.error(e);}
  }
  async function fetchWeather(){
    try{
      const since=new Date(Date.now()-3*3600000).toISOString();
      const data=await supa(`weather_reports?posted_at=gte.${since}&order=posted_at.desc&limit=50&select=id,weather,lat,lng,posted_at`);
      setWeatherReports(data||[]);
    }catch{}
  }
  useEffect(()=>{
    if(!authReady)return;
    fetchAll();fetchWeather();
    if(myUserId)fetchMy(myUserId);
    const t1=setInterval(fetchAll,180000),t2=setInterval(fetchWeather,300000);
    return()=>{clearInterval(t1);clearInterval(t2);};
  },[authReady,myUserId]);

  // 5km圏内フィルタ
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
    try{const cur=discoveries.find(d=>d.id===id);await supa(`discoveries?id=eq.${id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({hearts:(cur?.hearts||0)+1})});}catch{}
  }

  async function handleUpdate(id,updates){
    try{
      await supa(`discoveries?id=eq.${id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify(updates)});
      setDiscoveries(prev=>prev.map(d=>d.id===id?{...d,...updates}:d));
      setMyDiscoveries(prev=>prev.map(d=>d.id===id?{...d,...updates}:d));
      if(selected?.id===id)setSelected(s=>({...s,...updates}));
    }catch(e){alert("保存失敗: "+e.message);}
  }

  async function handleDelete(id){
    try{
      await supa(`discoveries?id=eq.${id}`,{method:"DELETE",prefer:"return=minimal"});
      setDiscoveries(prev=>prev.filter(d=>d.id!==id));
      setMyDiscoveries(prev=>prev.filter(d=>d.id!==id));
      setSelected(null);
    }catch(e){alert("削除失敗: "+e.message);}
  }

  async function handleSave({note,category,emoji,photo,photoEdit,weather,lat,lng,customTime}){
    let msg="素敵な発見！今日が少し特別な日になりましたね。";
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`「${cl(category)}」について面白い豆知識・雑学・またはクスっとするギャグを1〜2文で日本語で。友達トーンで。${note!=="📷"?"発見:"+note+"。":""}前置きや締め不要。`}]})});
      const data=await res.json();if(data.content?.[0]?.text)msg=data.content[0].text;
    }catch{}
    try{
      const token=sessionRef.current?.access_token||null;
      const finalPhoto=photoEdit?.croppedPhoto||photo||null;
      let photoUrl=null;
      if(finalPhoto)photoUrl=await uploadPhoto(finalPhoto,token);
      const row={note:note||"📷",category,emoji,photo:photoUrl,weather:weather||null,lat:lat||null,lng:lng||null,ai_msg:msg,hearts:0,user_id:myUserId||null,user_name:myUserName||null,user_avatar:myAvatar||null,custom_time:customTime||null};
      const saved=await supa("discoveries",{method:"POST",prefer:"return=representation",body:JSON.stringify(row)},token);
      const entry=Array.isArray(saved)?saved[0]:saved;
      setDiscoveries(prev=>[entry,...prev]);
      setMyDiscoveries(prev=>[entry,...prev]);
      setShowCapture(false);
      setShowCaptureLater(false);
      setAiMsg(msg);setShowAI(true);
    }catch(e){alert("投稿失敗: "+e.message);setShowCapture(false);}
  }

  async function handleSignOut(){
    await googleLogout(sessionRef.current?.access_token);
    setMyUserId(null);setMyUserName("");
    window.location.reload();
  }

  if(!authReady){
    return(
      <div style={{minHeight:"100dvh",background:"#faf7f2",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,fontFamily:font}}>
        <div style={{fontSize:44}}>🌱</div>
        <div style={{fontSize:12,color:"#aaa"}}>読み込み中…</div>
      </div>
    );
  }
  if(!myUserId)return <LoginScreen/>;

  // タイムライン: 1週間・5km圏内・カテゴリフィルタ
  const timelineItems=nearby.filter(d=>visibleCats.includes(d.category));
  // 思い出: 自分の全投稿・カテゴリフィルタ
  const memoryItems=myDiscoveries.filter(d=>visibleCats.includes(d.category));

  const TABS=["ホーム","タイムライン","思い出"];
  const stickyColors=["yellow","pink","blue","green","orange"];

  return(
    <div style={{height:"100dvh",background:"#faf7f2",fontFamily:font,color:"#3a3028",display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto",overflow:"hidden"}}>

      <SlideMenu open={menuOpen} onClose={()=>setMenuOpen(false)}
        onSetTab={setTab} onOpenProfile={()=>{setProfileTarget({id:null,name:null});setShowProfile(true);}}
        onSignOut={handleSignOut} onCaptureLater={()=>setShowCaptureLater(true)}
        userName={myUserName} avatarUrl={myAvatar}/>

      {/* ホームタブ */}
      {tab===0&&(
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:"100dvh",display:"flex",flexDirection:"column",zIndex:10,background:"#faf7f2"}}>
          {/* 上バー */}
          <div style={{flexShrink:0,paddingTop:"env(safe-area-inset-top,44px)",background:"rgba(250,247,242,0.98)",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 16px 0"}}>
              <div style={{fontSize:15,fontWeight:800,color:"#3a3028"}}>🌱 今日の発見</div>
              <button onClick={()=>setMenuOpen(true)} style={{border:"none",background:"none",cursor:"pointer",fontSize:22,color:"#3a3028",padding:"2px 0",lineHeight:1}}>≡</button>
            </div>
            <div style={{display:"flex",gap:6,padding:"6px 12px 10px",overflowX:"auto"}}>
              {CATEGORIES.map(c=>{const on=visibleCats.includes(c.value);return(
                <button key={c.value} onClick={()=>toggleCat(c.value)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,border:"none",cursor:"pointer",background:on?getBg(c.defaultColor):"#ede8e0",color:on?c.defaultColor:"#aaa",fontWeight:on?700:400,fontSize:12,fontFamily:font,opacity:on?1:0.7,boxShadow:on?`0 0 0 1.5px ${c.defaultColor}40`:"none",transition:"all 0.15s"}}>
                  <MotifIcon motif={c.value} color={on?c.defaultColor:"#aaa"} size={14}/><span>{c.label}</span>
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
          {/* 下バー: タイムライン + 投稿ボタン */}
          <div style={{flexShrink:0,background:"rgba(250,247,242,0.98)",borderTop:"1px solid rgba(0,0,0,0.08)",display:"flex",alignItems:"center",padding:`10px 24px env(safe-area-inset-bottom,16px)`}}>
            <button onClick={()=>setTab(1)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,border:"none",background:"none",cursor:"pointer",color:"#888"}}>
              <span style={{fontSize:18}}>🗒️</span>
              <span style={{fontSize:10,fontWeight:500,fontFamily:font}}>タイムライン</span>
            </button>
            <button onClick={()=>setShowCapture(true)} style={{width:52,height:52,borderRadius:"50%",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#7dcc6a,#5aaa48)",color:"white",fontSize:26,fontWeight:700,boxShadow:"0 4px 16px rgba(109,184,92,0.45)",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:"auto"}}>+</button>
          </div>
        </div>
      )}

      {/* タイムライン・思い出タブ */}
      {tab!==0&&(
        <>
          <div style={{position:"sticky",top:0,zIndex:30,background:"white",borderBottom:"1px solid #eee8e0"}}>
            <div style={{padding:"50px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={()=>setTab(0)} style={{display:"flex",alignItems:"center",gap:4,border:"none",background:"none",cursor:"pointer",fontSize:13,color:"#6db85c",fontWeight:700,padding:0,fontFamily:font}}>‹ 地図</button>
              <div style={{fontSize:17,fontWeight:800}}>{TABS[tab]}</div>
              <button onClick={()=>setMenuOpen(true)} style={{width:32,height:32,borderRadius:9,border:"none",background:"#f5f0ea",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>≡</button>
            </div>
            {/* カテゴリフィルタ */}
            <div style={{display:"flex",gap:5,padding:"0 12px 10px",overflowX:"auto"}}>
              {CATEGORIES.map(c=>{const on=visibleCats.includes(c.value);return <button key={c.value} onClick={()=>toggleCat(c.value)} style={{flexShrink:0,width:30,height:30,borderRadius:9,border:"none",cursor:"pointer",background:on?"white":"rgba(0,0,0,0.06)",opacity:on?1:0.5,boxShadow:on?"0 1px 4px rgba(0,0,0,0.12)":"none",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center"}}><MotifIcon motif={c.value} color={on?c.defaultColor:"#aaa"} size={16}/></button>;})}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",paddingBottom:80,minHeight:0}}>

            {/* タイムライン: 1週間・近くの全投稿 */}
            {tab===1&&(
              <div style={{background:"#c8a882",minHeight:"100%",padding:"10px 8px 80px"}}>
                {timelineItems.length===0&&(
                  <div style={{textAlign:"center",padding:"50px 0",color:"rgba(255,255,255,0.7)"}}><div style={{fontSize:36,marginBottom:10}}>🌱</div><div style={{fontSize:13,fontFamily:font}}>近くの発見はまだありません</div></div>
                )}
                <CorkBoard items={timelineItems} onItemClick={setSelected} showUser={true}/>
              </div>
            )}

            {/* 思い出: 自分の全投稿・永久保存 */}
            {tab===2&&(
              <div style={{background:"#c8a882",minHeight:"100%",padding:"10px 8px 80px"}}>
                {memoryItems.length===0&&(
                  <div style={{textAlign:"center",padding:"50px 0",color:"rgba(255,255,255,0.7)"}}><div style={{fontSize:36,marginBottom:10}}>📷</div><div style={{fontSize:13,fontFamily:font}}>まだ投稿がありません</div></div>
                )}
                <CorkBoard items={memoryItems} onItemClick={setSelected} showUser={false}/>
              </div>
            )}
          </div>
          {!showCapture&&!showAI&&!selected&&!showWeatherPanel&&!showProfile&&(
            <button onClick={()=>setShowCapture(true)} style={{position:"fixed",bottom:"calc(env(safe-area-inset-bottom,0px) + 22px)",right:18,width:52,height:52,borderRadius:"50%",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#7dcc6a,#5aaa48)",color:"white",fontSize:24,fontWeight:700,boxShadow:"0 4px 16px rgba(109,184,92,0.45)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          )}
        </>
      )}

      {/* モーダル */}
      {selected&&<DetailModal item={selected} isOwn={myDiscoveries.some(d=>d.id===selected.id)} onClose={()=>setSelected(null)} onHeart={handleHeart} myHearts={myHearts} onUpdate={handleUpdate} onDelete={handleDelete} onViewUser={(id,name)=>{setSelected(null);setProfileTarget({id,name});setShowProfile(true);}}/>}
      {showWeatherPanel&&<WeatherPanel userLocation={userLocation} onPost={()=>{fetchWeather();setShowWeatherPanel(false);}} onClose={()=>setShowWeatherPanel(false)}/>}
      {showProfile&&<ProfileModal
        key={profileTarget.id||'me'}
        myUserId={myUserId} myUserName={myUserName} myAvatar={myAvatar}
        targetUserId={profileTarget.id} targetUserName={profileTarget.name}
        discoveries={[...discoveries,...myDiscoveries.filter(d=>!discoveries.find(x=>x.id===d.id))]}
        token={sessionRef.current?.access_token}
        onClose={()=>setShowProfile(false)}
        onViewUser={(id,name)=>{setProfileTarget({id,name});}}
      />}
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
      {showCaptureLater&&<CaptureModal userLocation={userLocation} locStatus={locStatus} laterMode onClose={()=>setShowCaptureLater(false)} onSave={handleSave}/>}

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
