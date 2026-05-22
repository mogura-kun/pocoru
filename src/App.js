import { useState, useEffect, useRef } from "react";

const SUPA_URL = process.env.REACT_APP_SUPA_URL;
const SUPA_KEY = process.env.REACT_APP_SUPA_KEY;
const AUTH_URL = `${SUPA_URL}/auth/v1`;
const APP_URL    = window.location.origin;
const font       = "'Hiragino Maru Gothic Pro','Noto Sans JP',sans-serif";

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
  try{const res=await fetch(`${AUTH_URL}/token?grant_type=refresh_token`,{method:"POST",headers:{"apikey":SUPA_KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:rt})});if(!res.ok)return null;return await res.json();}catch{return null;}
}
async function getValidToken(sessionRef){
  const sess=sessionRef.current;
  if(!sess)return null;
  if(sess.expires_at&&Date.now()>sess.expires_at-60000){
    const refreshed=await refreshToken(sess.refresh_token);
    if(refreshed){saveSession(refreshed);sessionRef.current=refreshed;return refreshed.access_token;}
    return null;
  }
  return sess.access_token;
}
function googleLogin(){window.location.href=`${AUTH_URL}/authorize?provider=google&redirect_to=${encodeURIComponent(APP_URL)}`;}
async function googleLogout(token){try{await fetch(`${AUTH_URL}/logout`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${token}`}});}catch{}saveSession(null);}

function useLeaflet(cb){
  useEffect(()=>{
    if(window.L){cb();return;}
    const css=document.createElement("link");css.rel="stylesheet";css.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(css);
    const js=document.createElement("script");js.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";js.onload=cb;document.head.appendChild(js);
  },[]);
}

const FALLBACKS={
  flower:["植物って、雨の後に一番きれいに輝くんだそうです🌱","花が咲く瞬間、一秒一秒ちゃんと違う顔をしているんだって！","花の香りは虫への手紙。今日は特別な手紙が届いたのかも🌸"],
  bird:["鳥たちは地球の磁場を感じて方向を知るんだとか。羨ましい！","鳥のさえずりには方言があるらしい。近所の鳥と遠くの鳥、話が通じるのかな🐦","鳥は恐竜の子孫。そう思うと少し見え方が変わりますね"],
  fish:["水の中の世界も、きっと賑やかなんだろうな🐟","魚は寝るとき目を開けたまま。ずっと見張ってるみたい👀","川や海を泳ぐ姿、何万年も変わってないんだろうな"],
  cloud:["同じ形の雲は二度と現れない。今この瞬間だけの空模様✨","雲1つの重さは約500トンとも。空って重い！","雲を見上げる時間、なんか贅沢ですよね☁️"],
  plane:["空の青さは光の散乱で生まれる。つまり空自体に色はない、らしい🌀","飛行機雲は湿度が高いと長く残る。天気予報になるかも？","空を見上げる癖、いいと思います✈️"],
  music:["音楽を聴くと脳内でドーパミンが出るらしい。最高の薬かも！","好きな曲で鳥肌が立つ人、全体の65%だそう。感受性の証拠✨","メロディは記憶と直結している。この曲、いつまでも覚えてそう🎵"],
  sparkle:["アイデアはリラックスしているときに一番降ってくるらしい💡","ひらめきの瞬間、脳のガンマ波が急上昇するんだって！","小さな気づきが、大きな発見につながることがある🌟"],
  bread:["世界で一番古いパンは約1万4千年前のもの。人類とパンの歴史は深い🍞","食べることで幸せを感じるのは、本能レベルで正しいことらしい！","おいしいものの前では、みんな正直になれる気がする😊"],
  _:["こういう小さな気づき、積み重なると人生豊かになりそう✨","日常の中にある宝物、ちゃんと見つけましたね🌱","今日も街があなたに話しかけてきましたね☀️","見過ごしそうなものを、ちゃんとキャッチしましたね👀","なんかいいですね、こういうの🌿"],
};
function getFallback(category){const arr=FALLBACKS[category]||FALLBACKS._;const h=(category||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)+new Date().getHours();return arr[Math.abs(h)%arr.length];}

const CATEGORIES=[
  {value:"flower", label:"植物",   defaultColor:"#d4848a"},
  {value:"bird",   label:"いきもの", defaultColor:"#6aaac6"},
  {value:"fish",   label:"さかな",   defaultColor:"#5ab5a2"},
  {value:"cloud",  label:"雲",       defaultColor:"#88b4d0"},
  {value:"plane",  label:"空",       defaultColor:"#9486c0"},
  {value:"music",  label:"気分",     defaultColor:"#a580c4"},
  {value:"sparkle",label:"ひらめき", defaultColor:"#e8bb50"},
  {value:"bread",  label:"たべもの", defaultColor:"#c28848"},
];
const CAT=Object.fromEntries(CATEGORIES.map(c=>[c.value,c]));
const cl=v=>CAT[v]?.label||"その他";
const getDefaultColor=v=>CAT[v]?.defaultColor||"#7a8a6a";
function getColor(d){return(d?.emoji&&d.emoji.startsWith("#"))?d.emoji:getDefaultColor(d?.category);}
function getBg(color){const r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);return`rgba(${r},${g},${b},0.13)`;}
function itemRot(id){const s=String(id||"");let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;const rots=[-5,-4,-3,-2,2,3,4,5];return rots[Math.abs(h)%rots.length];}
function stickyRot(id){const s=String(id||"");let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;const rots=[-4,-3,-2,2,3,4];return rots[Math.abs(h)%rots.length];}

const MOTIF_SVG={
  flower:{vb:"-80 -80 960 937",d:`<path d="M673.83,629.658c47.145-11.243,83.608-52.58,89.155-102.376c6.19-55.87-35.738-121.946-127.759-140.17c-8.56-1.695-17.185-3.16-25.811-4.379c8.412-1.25,16.791-2.649,25.103-4.296c92.087-18.256,133.982-84.365,127.743-140.17c-5.647-51.13-43.854-93.666-92.911-103.478c-8.691-1.728-17.334-2.616-25.597-2.616c-4.017,0-7.918,0.214-11.606,0.576c1.119-10.932,0.725-23.312-2.074-37.204c-9.778-49.055-52.348-87.296-103.512-92.992c-3.538-0.394-7.193-0.608-10.913-0.608c-51.641,0-111.644,39.706-129.223,128.367c-1.399,6.98-2.618,14.027-3.688,21.088c-1.086-6.799-2.255-13.614-3.589-20.38C361.57,42.372,301.599,2.668,249.926,2.668c-3.72,0-7.374,0.197-10.914,0.592c-51.162,5.664-93.698,43.903-103.51,92.96c-2.765,13.893-3.161,26.288-2.042,37.202c-3.735-0.362-7.589-0.576-11.671-0.576c-8.247,0-16.84,0.888-25.531,2.618c-49.089,9.844-87.296,52.38-92.958,103.478c-6.223,55.853,35.672,121.915,127.759,140.219c6.732,1.316,13.497,2.503,20.297,3.539c-7.047,1.071-14.027,2.288-21.022,3.687C38.312,404.676-3.566,470.753,2.591,526.559c5.645,51.13,43.852,93.666,92.941,103.51c8.708,1.727,17.302,2.633,25.533,2.633c4.049,0,7.951-0.229,11.671-0.592c-1.104,10.93-0.742,23.309,2.041,37.203c9.811,49.022,52.347,87.263,103.511,92.96c3.555,0.394,7.21,0.608,10.93,0.608c51.657,0,111.644-39.706,129.223-128.401c1.647-8.297,3.029-16.66,4.297-24.988c1.219,8.592,2.683,17.186,4.362,25.713c17.614,88.646,77.584,128.35,129.224,128.35c3.72,0,7.374-0.214,10.946-0.609c51.098-5.662,93.668-43.854,103.527-92.942c0.346-1.777,0.346-3.292,0.626-5.02c48.183,77.04,112.335,110.145,112.335,110.145L798,684.014C745.06,672.014,704.76,651.93,673.83,629.658z"/>`},
  bird:{vb:"0 0 1280 1076",d:`<g transform="translate(0,1076) scale(0.1,-0.1)"><path d="M4413 10717 c-150 -237 -166 -534 -43 -782 44 -90 138 -212 224 -293 31 -29 56 -55 56 -58 0 -15 -326 165 -439 243 -35 24 -67 41 -72 36 -18 -18 -59 -165 -70 -252 -41 -303 109 -600 401 -794 47 -32 82 -57 78 -57 -17 0 -173 67 -294 126 -73 35 -134 64 -137 64 -15 0 -32 -141 -31 -260 0 -154 15 -223 71 -335 48 -95 90 -151 178 -233 l75 -70 -14 -64 c-63 -281 11 -545 210 -744 l71 -72 -201 -6 c-111 -3 -383 -10 -606 -16 -784 -21 -1620 -58 -2500 -111 -119 -8 -353 -9 -655 -6 -416 6 -533 11 -677 32 l-38 5 0 -62 c1 -155 78 -380 187 -545 21 -32 72 -93 113 -137 122 -127 242 -204 417 -266 l105 -37 -58 -11 c-81 -16 -220 -32 -271 -32 -23 0 -44 -4 -47 -9 -9 -14 50 -184 95 -273 59 -117 110 -189 203 -286 76 -79 190 -164 284 -211 56 -29 217 -81 248 -81 43 0 25 -18 -24 -25 -78 -10 -78 -10 -19 -131 191 -388 553 -624 956 -624 l87 0 24 -42 c127 -232 355 -421 605 -501 122 -40 196 -50 358 -51 l148 -1 58 -70 c140 -171 334 -294 549 -350 83 -22 232 -38 312 -33 39 2 70 3 70 2 0 -3 -336 -252 -517 -383 -79 -57 -141 -107 -138 -111 6 -10 -740 -453 -1360 -807 -642 -367 -1139 -634 -1339 -720 -62 -26 -100 -48 -98 -55 6 -21 70 -95 115 -132 57 -46 148 -91 227 -111 49 -13 95 -16 191 -13 l126 4 -86 -53 c-47 -29 -105 -63 -128 -75 -24 -13 -43 -26 -43 -30 0 -11 123 -99 180 -128 115 -58 192 -75 340 -75 96 1 152 6 195 18 33 9 71 20 85 23 26 7 -156 -146 -284 -239 l-69 -51 29 -24 c39 -33 136 -78 209 -97 86 -24 239 -21 340 5 99 25 258 102 345 166 l65 47 -71 -79 c-40 -43 -115 -121 -168 -172 l-96 -93 33 -19 c50 -31 135 -60 222 -77 233 -45 483 41 712 242 247 219 722 924 1216 1805 69 124 130 232 135 240 8 13 14 13 53 -2 324 -123 422 -159 584 -213 531 -178 1017 -288 1545 -352 208 -25 801 -25 980 0 602 85 1072 280 1512 628 137 109 400 374 524 529 406 508 670 1004 1174 2210 212 507 317 749 400 927 l59 128 558 27 c307 15 575 27 597 27 35 1 37 3 25 18 -8 9 -43 35 -79 58 -217 141 -541 251 -1118 382 -32 8 -35 12 -71 118 -119 349 -323 610 -581 740 -229 116 -526 138 -847 64 -372 -85 -816 -308 -1289 -646 l-71 -51 -51 72 c-159 230 -391 476 -782 830 -723 655 -1619 1412 -2485 2101 -345 274 -671 561 -873 768 l-93 95 -26 -41z"/></g>`},
  fish:{vb:"0 0 512 512",d:`<path d="M508.727,159.883c-14.908-8.942-74.31,45.732-91.456,68.595c-57.163-34.302-108.602-57.164-108.602-57.164s22.862-100.025-8.578-94.318c-28.638,5.212-81.664,42.558-125.749,77.172C100.033,174.176,10.164,225.086,0,274.201c28.577,94.318,191.489,140.042,288.66,160.05c47.831,9.852,20.009-57.155,20.009-57.155s51.439-22.87,108.602-57.163c17.147,22.862,76.548,77.536,91.456,68.594c14.293-8.577-22.862-114.326-22.862-114.326S523.02,168.461,508.727,159.883z M101.69,279.265c-13.027,0-23.582-10.555-23.582-23.582c0-13.018,10.555-23.573,23.582-23.573c13.018,0,23.573,10.555,23.573,23.573C125.263,268.71,114.708,279.265,101.69,279.265z"/>`},
  cloud:{vb:"0 0 24 24",d:`<path d="M18 17H6C4.1 17 2.5 15.4 2.5 13.5C2.5 11.8 3.7 10.3 5.4 10C5.1 9.4 5 8.7 5 8C5 5.5 7 3.5 9.5 3.5C10.9 3.5 12.2 4.1 13.1 5.1C13.6 4.9 14.3 4.7 15 4.7C17.5 4.7 19.5 6.7 19.5 9.2C19.5 9.4 19.5 9.6 19.4 9.7C20.7 10.2 21.5 11.4 21.5 12.8C21.5 15.1 19.9 17 18 17Z"/>`},
  plane:{vb:"0 0 512 512",d:`<path d="M507.068,194.059c-5.3-6.143-13.759-8.507-21.481-6.013l-59.859,17.264c-11.406,3.695-23.81,2.792-34.574-2.507l-68.887-33.742l61.093-80.864c4.682-4.847,5.584-12.261,2.139-18.095c-3.422-5.809-10.336-8.638-16.848-6.903L247.486,116.32l23.597,11.572l-16.23,8.115l-24.69-12.095L124.278,72.015C65.799,43.262,18.154,52.695,3.16,83.208c-14.994,30.522,26.591,49.402,57.102,64.395l105.696,52.041l54.749,242.78c1.877,8.982,10.003,15.28,19.224,14.828c9.172-0.464,16.633-7.509,17.632-16.669l33.956-179.158l73.569,36.226c47.073,21.732,97.259,19.64,112.253-10.86l32.579-70.61C513.507,208.911,512.39,200.19,507.068,194.059z"/>`},
  music:{vb:"-80 -80 940 960",d:`<path d="M255.447,87.821v15.548v158.935V458.57c0,30.926-21.925,57.567-52.303,63.364c-18.009,3.437-38.91,8.083-59.752,14.16C45.667,564.587-1.471,622.874,2.143,695.156c4.581,91.628,110.58,114.227,192.282,98.007c81.703-16.22,140.141-84.263,140.141-165.622c0-23.039,0-231.275,0-378.228l364.451-59.839v209.07c0,30.927-21.925,57.567-52.303,63.364c-18.01,3.437-38.91,8.083-59.752,14.16c-97.725,28.493-144.862,86.78-141.248,159.062c4.581,91.628,110.579,114.228,192.282,98.008c81.703-16.22,140.141-84.264,140.141-165.623c0-23.717,0-243.687,0-391.032c0-76.307,0-133.141,0-133.141V2L255.447,87.821z"/>`},
  sparkle:{vb:"0 0 141.732 141.731",d:`<path fill-rule="evenodd" clip-rule="evenodd" d="M57.63,12.055c-3.686,0-5.434,29.27-10.868,34.706c-5.437,5.434-34.707,7.183-34.707,10.869c0,3.685,29.27,5.431,34.707,10.868c5.434,5.434,7.183,34.704,10.868,34.704s5.431-29.271,10.868-34.704c5.434-5.437,34.704-7.183,34.704-10.868c0-3.686-29.27-5.435-34.704-10.869C63.061,41.325,61.315,12.055,57.63,12.055z M105.306,80.935c-1.971,0-2.904,15.651-5.813,18.558c-2.907,2.909-18.558,3.843-18.558,5.813s15.65,2.904,18.558,5.813c2.909,2.906,3.843,18.558,5.813,18.558s2.904-15.651,5.813-18.558c2.906-2.909,18.559-3.843,18.559-5.813s-15.652-2.904-18.559-5.813C108.21,96.586,107.277,80.935,105.306,80.935z"/>`},
  bread:{vb:"0 0 500 500",d:`<path d="M366,210.1c0-18.3,15.5-20.6,15.5-47.6c0-47.3-45.2-76.6-118-76.6c-45.5,0-80.2,11.5-99.9,31.6l-26.9,26.9c-11.8,12.1-18.2,27.3-18.2,45.1c0,17.6,6.6,27.7,13.3,36.6c2.7,3.6,4.9,8,0.3,13.8l-0.1,0.2c-7.1,9.2-13.5,19.5-13.5,45v129h236.1l27-27v-129C381.5,227.3,366,228.2,366,210.1z M332.5,387.1v5h-5H145.5h-5v-5v-102c0-20,4.3-25.6,8.9-31.5l0.1-0.2c9.9-12.7,9.8-27.6-0.2-40.7c-6.1-8-8.8-13.3-8.8-23.3c0-17.3,8.9-30.9,26.4-40.5c16.8-9.1,41.5-14.2,69.6-14.2s52.8,5,69.6,14.2c17.5,9.5,26.4,23.1,26.4,40.5c0,10-2.7,15.2-8.8,23.3c-10,13.1-10,27.9-0.2,40.7l0.1,0.2c4.6,5.9,8.9,11.4,8.9,31.5V387.1z"/>`},
};

function MotifIcon({motif,color,size=24,shadow=false}){
  const m=MOTIF_SVG[motif]||MOTIF_SVG.sparkle;
  return <svg width={size} height={size} viewBox={m.vb} fill={color} style={{filter:shadow?`drop-shadow(0 2px 4px ${color}88)`:"none",flexShrink:0,display:"block"}} dangerouslySetInnerHTML={{__html:m.d}}/>;
}

const WEATHERS=[
  {value:"sunny",emoji:"☀️"},{value:"cloudy",emoji:"☁️"},{value:"rainy",emoji:"🌧️"},
  {value:"snowy",emoji:"❄️"},{value:"windy",emoji:"🌬️"},{value:"rainbow",emoji:"🌈"},
];
const MOOD_COLORS=[
  {mood:"🌸 やさしい", colors:["#ffb3c1","#ffc8dd","#d4848a","#ff6b9d","#c9184a"]},
  {mood:"☀️ 明るい",   colors:["#ffdd57","#ffd166","#f5b942","#ff9f1c","#f48c06"]},
  {mood:"🌿 自然",     colors:["#83b195","#52b788","#40916c","#3ab8a0","#74c69d"]},
  {mood:"🌊 爽やか",   colors:["#4a9cc7","#48cae4","#0096c7","#7ab0d4","#00b4d8"]},
  {mood:"🌙 落ち着く", colors:["#8b7cc8","#9b72cc","#6930c3","#5e60ce","#4361ee"]},
  {mood:"🔥 元気",     colors:["#e63946","#e07840","#f4a261","#ff6b35","#ff9f1c"]},
  {mood:"🤍 シンプル", colors:["#f5f5f5","#cccccc","#888888","#444444","#111111"]},
];

function haversine(la1,lo1,la2,lo2){const d=v=>v*Math.PI/180;const a=Math.sin(d(la2-la1)/2)**2+Math.cos(d(la1))*Math.cos(d(la2))*Math.sin(d(lo2-lo1)/2)**2;return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function jitter(v){return v+(Math.random()-0.5)*0.00009;}
function roundTimeStr(date){const d=date instanceof Date?date:new Date(date);if(isNaN(d))return"";const h=d.getHours(),m=d.getMinutes(),rm=m<30?0:30;return`${String(h).padStart(2,"0")}:${String(rm).padStart(2,"0")}ごろ`;}
function todayStr(){return new Date().toISOString().slice(0,10);}

function Polaroid({photo,emoji,category,rotate=0,small=false,note="",userName=""}){
  const w=small?100:155,h=small?82:125;
  const color=emoji&&emoji.startsWith("#")?emoji:getDefaultColor(category);
  const hasNote=note&&note!=="📷";
  return(
    <div style={{display:"inline-block",background:"white",padding:small?"16px 6px 6px":"18px 10px 6px",boxShadow:"0 3px 12px rgba(0,0,0,0.10)",borderRadius:2,transform:`rotate(${rotate}deg)`,position:"relative"}}>
      {userName&&<div style={{position:"absolute",top:3,left:5,fontSize:7,color:"#b0a49a",fontFamily:font,maxWidth:w*0.9,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userName}</div>}
      <div style={{position:"relative",width:w,height:h}}>
        {photo?<img src={photo} alt="" style={{width:w,height:h,objectFit:"cover",display:"block"}}/>
          :<div style={{width:w,height:h,background:getBg(color),display:"flex",alignItems:"center",justifyContent:"center"}}><MotifIcon motif={category} color={color} size={small?36:56} shadow/></div>}
      </div>
      <div style={{minHeight:small?18:28,paddingTop:4,width:w}}>
        {hasNote&&<div style={{fontSize:small?8:9,color:"#888",fontFamily:font,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{note}</div>}
      </div>
    </div>
  );
}
function StickyNote({text,colorKey="yellow",rotate=0}){
  const C={yellow:"#fef08a",pink:"#fda4af",blue:"#bae6fd",green:"#bbf7d0",orange:"#fed7aa"};
  return(
    <div style={{background:C[colorKey]||"#fef08a",padding:"12px 14px",minHeight:60,boxShadow:"2px 3px 6px rgba(0,0,0,0.09)",transform:`rotate(${rotate}deg)`,fontFamily:font,fontSize:13,lineHeight:1.7,color:"#3a3028",borderRadius:2,position:"relative"}}>
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:22,height:5,background:"rgba(0,0,0,0.08)",borderRadius:"0 0 4px 4px"}}/>
      {text}
    </div>
  );
}

function MoodColorPicker({color,onChange,onClose}){
  function h2hsl(hex){
    const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;
    if(max===min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}
    return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];
  }
  function hsl2hex(h,s,l){
    s/=100;l/=100;const a=s*Math.min(l,1-l);
    const f=n=>{const k=(n+h/30)%12;const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c).toString(16).padStart(2,'0');};
    return`#${f(0)}${f(8)}${f(4)}`;
  }
  const init=color&&color.startsWith('#')?h2hsl(color):[210,80,55];
  const [hue,setHue]=useState(init[0]);
  const [lit,setLit]=useState(Math.max(0,Math.min(100,init[2])));
  const sat=85,sz=220,rad=sz/2-14;
  const ix=sz/2+rad*Math.sin(hue*Math.PI/180);
  const iy=sz/2-rad*Math.cos(hue*Math.PI/180);
  const cur=hsl2hex(hue,sat,lit);
  const wheelRef=useRef(null);
  function getHue(e){
    const rect=wheelRef.current.getBoundingClientRect();
    const cx=rect.width/2,cy=rect.height/2;
    const pt=e.touches?e.touches[0]:e;
    const x=pt.clientX-rect.left-cx,y=pt.clientY-rect.top-cy;
    return((Math.atan2(x,-y)*180/Math.PI)+360)%360;
  }
  function onWheel(e){e.preventDefault();const h=Math.round(getHue(e));setHue(h);onChange(hsl2hex(h,sat,lit));}
  const stops=Array.from({length:37},(_,i)=>`hsl(${i*10},${sat}%,${lit}%)`).join(',');
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#f4f6f3",borderRadius:"24px 24px 0 0",padding:"24px 20px 44px",animation:"slideUp 0.3s ease"}}>
        <div style={{width:36,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontSize:14,fontWeight:800,fontFamily:font}}>🎨 色を選ぶ</div>
          <button onClick={onClose} style={{width:26,height:26,borderRadius:"50%",border:"none",background:"#e8e0d8",color:"#aaa",fontSize:13,cursor:"pointer"}}>×</button>
        </div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:22}}>
          <div ref={wheelRef} style={{position:"relative",width:sz,height:sz,borderRadius:"50%",background:`conic-gradient(from 0deg,${stops})`,cursor:"crosshair",touchAction:"none",userSelect:"none",boxShadow:"0 4px 20px rgba(0,0,0,0.12)"}}
            onMouseDown={onWheel} onMouseMove={e=>e.buttons&&onWheel(e)}
            onTouchStart={onWheel} onTouchMove={onWheel}
          >
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:66,height:66,borderRadius:"50%",background:"white",boxShadow:"0 0 0 2px rgba(0,0,0,0.06)"}}/>
            <div style={{position:"absolute",left:ix-12,top:iy-12,width:24,height:24,borderRadius:"50%",background:cur,border:"3px solid white",boxShadow:"0 0 0 1.5px rgba(0,0,0,0.15),0 2px 8px rgba(0,0,0,0.3)",pointerEvents:"none"}}/>
          </div>
        </div>
        <div style={{padding:"0 4px",marginBottom:20}}>
          <div style={{fontSize:10,color:"#aaa",fontWeight:700,letterSpacing:1,marginBottom:8,fontFamily:font}}>明度</div>
          <div style={{position:"relative",height:22,display:"flex",alignItems:"center"}}>
            <div style={{position:"absolute",width:"100%",height:14,borderRadius:7,background:`linear-gradient(to right,#000,hsl(${hue},${sat}%,50%),#fff)`,boxShadow:"inset 0 1px 3px rgba(0,0,0,0.15)"}}/>
            <input type="range" min={0} max={100} value={lit} onChange={e=>{const l=Number(e.target.value);setLit(l);onChange(hsl2hex(hue,sat,l));}} style={{position:"relative",width:"100%",margin:0,cursor:"pointer",accentColor:cur,zIndex:1,background:"transparent",height:22}}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"0 4px"}}>
          <div style={{width:44,height:44,borderRadius:12,background:cur,boxShadow:"0 2px 10px rgba(0,0,0,0.18)",flexShrink:0}}/>
          <div style={{flex:1,fontSize:11,color:"#bbb",fontFamily:"monospace"}}>{cur}</div>
          <button onClick={onClose} style={{padding:"11px 22px",borderRadius:12,border:"none",background:"#83b195",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:font}}>決定</button>
        </div>
      </div>
    </div>
  );
}

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
  const prevLat=useRef(lat),prevLng=useRef(lng);
  useEffect(()=>{
    if(!iRef.current||!mkRef.current)return;
    if(lat===prevLat.current&&lng===prevLng.current)return;
    prevLat.current=lat;prevLng.current=lng;
    mkRef.current.setLatLng([lat,lng]);
    iRef.current.setView([lat,lng],15,{animate:true});
  },[lat,lng]);
  return(
    <div style={{borderRadius:12,overflow:"hidden",height:160,position:"relative"}}>
      <div ref={mRef} style={{width:"100%",height:"100%"}}/>
      {!rdy&&<div style={{position:"absolute",inset:0,background:"#ecf0e8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#9ab076",fontFamily:font}}>読み込み中…</div>}
    </div>
  );
}

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
    uCi.current=null;
    uMk.current=L.marker([lat,lng],{icon:L.divIcon({className:"mk-wrap",html:`<div style="position:relative;width:56px;height:56px"><div style="position:absolute;inset:6px;border-radius:50%;background:#83b195;filter:blur(16px);opacity:0.27"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="font-size:22px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">📍</div></div></div>`,iconSize:[56,56],iconAnchor:[28,28]})}).addTo(iRef.current);
  },[rdy,userLocation]);
  useEffect(()=>{
    if(!rdy||!iRef.current)return;
    const L=window.L;
    dMk.current.forEach(m=>m.remove());dMk.current=[];
    const mapOneWeekAgo=Date.now()-7*24*3600*1000;
    discoveries.filter(d=>d.lat&&d.lng&&visibleCats.includes(d.category)&&new Date(d.custom_time||d.posted_at).getTime()>=mapOneWeekAgo).forEach(d=>{
      const age=Date.now()-new Date(d.custom_time||d.posted_at).getTime();
      const op=Math.max(0.3,1-(age/(7*24*3600000))*0.7);
      const color=getColor(d);
      const m=MOTIF_SVG[d.category]||MOTIF_SVG.sparkle;
      const sz=80,iconOp=Math.max(0,(op-0.3)/0.7).toFixed(3);
      const r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);
      const icon=L.divIcon({className:"",html:`<div style="position:relative;width:120px;height:120px;display:flex;align-items:center;justify-content:center"><div style="position:absolute;width:120px;height:120px;border-radius:50%;background:rgba(${r},${g},${b},0.08);filter:blur(24px);mix-blend-mode:screen;animation:auraExpand 1.5s ease-out forwards"></div><div style="position:relative;z-index:2;opacity:${iconOp}"><svg width="34" height="34" viewBox="${m.vb}" fill="${color}">${m.d}</svg></div></div>`,iconSize:[120,120],iconAnchor:[60,60]});
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
      <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.35)",pointerEvents:"none",zIndex:1}}/>
      {!rdy&&<div style={{position:"absolute",inset:0,background:"#ecf0e8",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}><div style={{fontSize:32}}>🗺️</div><div style={{fontSize:12,color:"#9ab076",fontFamily:font}}>地図を読み込み中…</div></div>}
    </div>
  );
}

function UserSearchModal({onClose,onViewUser,myUserName,myUserCode}){
  const [showMyId,setShowMyId]=useState(false);
  const [copied,setCopied]=useState(false);
  const [query,setQuery]=useState("");
  const [result,setResult]=useState(null);
  const [searching,setSearching]=useState(false);
  const [notFound,setNotFound]=useState(false);
  const [postCount,setPostCount]=useState(0);

  const myCode=myUserCode||lsGet("userCode",null);
  const myFullId=myUserName&&myCode?`${myUserName}#${myCode}`:null;

  function copyId(){
    if(!myFullId)return;
    const doFallback=()=>{try{const el=document.createElement("textarea");el.value=myFullId;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{}};
    if(navigator.clipboard?.writeText){navigator.clipboard.writeText(myFullId).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(doFallback);}
    else doFallback();
  }

  async function handleSearch(){
    const t=query.trim();
    const hi=t.lastIndexOf("#");
    if(hi===-1||!t.slice(0,hi).trim()||!t.slice(hi+1).trim())return;
    const name=t.slice(0,hi).trim(),code=t.slice(hi+1).trim();
    setSearching(true);setResult(null);setNotFound(false);
    try{
      const data=await supa(`users?name=eq.${encodeURIComponent(name)}&user_code=eq.${code}&select=id,name,bio,avatar_url`);
      if(data&&data.length>0){
        const u=data[0];
        const posts=await supa(`discoveries?user_id=eq.${u.id}&select=id`);
        setPostCount((posts||[]).length);
        setResult(u);
      }else setNotFound(true);
    }catch{setNotFound(true);}
    setSearching(false);
  }

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.5)",zIndex:210,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#f4f6f3",borderRadius:"28px 28px 0 0",padding:"20px 20px 0",boxShadow:"0 -6px 30px rgba(0,0,0,0.10)",animation:"slideUp 0.3s ease",maxHeight:"85dvh",display:"flex",flexDirection:"column"}}>
        <div style={{width:40,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontSize:15,fontWeight:800,fontFamily:font,marginBottom:14}}>🔍 ユーザーを探す</div>
        {/* 自分のIDエリア */}
        <div style={{background:"#e8f4ec",borderRadius:12,padding:"12px 14px",marginBottom:14,flexShrink:0}}>
          <div style={{fontSize:11,color:"#83b195",fontWeight:700,marginBottom:6,fontFamily:font}}>自分のID</div>
          {!showMyId
            ?<button onClick={()=>setShowMyId(true)} style={{border:"none",background:"rgba(131,177,149,0.18)",borderRadius:8,padding:"6px 12px",fontSize:12,color:"#83b195",fontWeight:700,cursor:"pointer",fontFamily:font}}>自分のIDを見る 👁</button>
            :<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              <div style={{fontSize:17,fontWeight:800,color:"#3a3028",fontFamily:font,letterSpacing:0.5}}>{myFullId||"取得中…"}</div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={copyId} style={{border:"none",background:"rgba(131,177,149,0.2)",borderRadius:8,padding:"4px 9px",fontSize:11,color:"#83b195",fontWeight:700,cursor:"pointer",fontFamily:font}}>{copied?"済 ✓":"📋 コピー"}</button>
                <button onClick={()=>setShowMyId(false)} style={{border:"none",background:"rgba(0,0,0,0.07)",borderRadius:8,padding:"4px 9px",fontSize:11,color:"#888",cursor:"pointer",fontFamily:font}}>隠す</button>
              </div>
            </div>
          }
        </div>
        <div style={{height:1,background:"#e8e0d8",marginBottom:14,flexShrink:0}}/>
        {/* 検索エリア */}
        <div style={{fontSize:12,color:"#aaa",marginBottom:8,fontFamily:font,flexShrink:0}}>友達のID（ユーザーネーム#番号）を入力</div>
        <div style={{display:"flex",gap:8,marginBottom:12,flexShrink:0}}>
          <input value={query} onChange={e=>{setQuery(e.target.value);setResult(null);setNotFound(false);}}
            onKeyDown={e=>e.key==="Enter"&&handleSearch()}
            placeholder="例：もぐらくん#4829"
            style={{flex:1,padding:"10px 12px",borderRadius:12,border:"1.5px solid #e8e0d8",fontSize:13,fontFamily:font,outline:"none",background:"white",boxSizing:"border-box"}}/>
          <button onClick={handleSearch} style={{padding:"10px 16px",borderRadius:12,border:"none",background:"#83b195",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:font,flexShrink:0}}>検索</button>
        </div>
        <div style={{overflowY:"auto",flex:1,paddingBottom:"max(24px,env(safe-area-inset-bottom))"}}>
          {searching&&<div style={{textAlign:"center",padding:"24px 0",color:"#bbb",fontFamily:font,fontSize:13}}>検索中…</div>}
          {notFound&&<div style={{textAlign:"center",padding:"30px 0",color:"#ccc",fontFamily:font,fontSize:13}}>見つかりませんでした</div>}
          {!searching&&!notFound&&!result&&<div style={{textAlign:"center",padding:"24px 0",color:"#ddd",fontFamily:font,fontSize:12}}>名前#番号の形式で入力してください</div>}
          {result&&(
            <button onClick={()=>{onClose();onViewUser(result.id,result.name);}}
              style={{width:"100%",padding:"14px",border:"none",background:"white",borderRadius:14,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:font,boxShadow:"0 2px 8px rgba(0,0,0,0.07)",boxSizing:"border-box"}}>
              <div style={{width:48,height:48,borderRadius:"50%",overflow:"hidden",background:"#e5ede0",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {result.avatar_url?<img src={result.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:22}}>👤</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:"#3a3028"}}>{result.name}</div>
                {result.bio&&<div style={{fontSize:11,color:"#aaa",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{result.bio}</div>}
                <div style={{fontSize:10,color:"#83b195",marginTop:3}}>発見 {postCount}件</div>
              </div>
              <span style={{fontSize:13,color:"#ccc",flexShrink:0}}>›</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SlideMenu({open,onClose,onSetTab,onOpenProfile,onSignOut,onCaptureLater,onViewUser,userName,avatarUrl,myUserCode}){
  const [showUserSearch,setShowUserSearch]=useState(false);
  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200}}/>}
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:260,background:"#f4f6f3",zIndex:201,transform:open?"translateX(0)":"translateX(100%)",transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)",boxShadow:"-3px 0 20px rgba(0,0,0,0.09)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"52px 20px 16px",borderBottom:"1px solid #e8e0d8",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:"50%",overflow:"hidden",background:"#e5ede0",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {avatarUrl?<img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:22}}>👤</span>}
          </div>
          <div><div style={{fontSize:16,fontWeight:800,fontFamily:font}}>{userName||"ゲスト"}</div><div style={{fontSize:11,color:"#83b195",fontFamily:font}}>pocoru</div></div>
        </div>
        <div style={{flex:1,padding:"8px 0",overflowY:"auto"}}>
          {[
            {emoji:"🕐",label:"後から投稿",sub:"日時・場所を指定して投稿",action:()=>{onClose();onCaptureLater();}},
            {emoji:"📖",label:"思い出",sub:"自分の発見・永久保存",action:()=>{onClose();onSetTab(2);}},
            {emoji:"👤",label:"マイページ",sub:"他の人から見た自分",action:()=>{onClose();onOpenProfile();}},
            {emoji:"🔍",label:"ユーザーを探す",sub:"ユーザーネームで検索",action:()=>setShowUserSearch(true)},
          ].map((m,i)=>(
            <button key={i} onClick={m.action||onClose} style={{width:"100%",padding:"13px 20px",border:"none",background:"transparent",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:font}}>
              <span style={{fontSize:18}}>{m.emoji}</span>
              <div><div style={{fontSize:13,fontWeight:600,color:"#3a3028"}}>{m.label}</div>{m.sub&&<div style={{fontSize:11,color:"#aaa",marginTop:1}}>{m.sub}</div>}</div>
            </button>
          ))}
        </div>
        <div style={{padding:"14px 20px",paddingBottom:"max(14px,env(safe-area-inset-bottom))",borderTop:"1px solid #e8e0d8",display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={onSignOut} style={{width:"100%",padding:"10px 0",borderRadius:13,border:"1px solid #fca5a5",background:"white",color:"#ef4444",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:font}}>ログアウト</button>
          <button onClick={onClose} style={{width:"100%",padding:"11px 0",borderRadius:13,border:"none",background:"#83b195",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:font}}>閉じる</button>
        </div>
      </div>
      {showUserSearch&&<UserSearchModal onClose={()=>setShowUserSearch(false)} onViewUser={(id,name)=>{setShowUserSearch(false);onClose();onViewUser(id,name);}} myUserName={userName} myUserCode={myUserCode}/>}
    </>
  );
}

// 詳細モーダル: z-index 350でProfileModalより上に表示、写真大きく
function DetailModal({item,isOwn,onClose,onHeart,myHearts,onUpdate,onDelete,onViewUser,onEdit}){
  const already=myHearts.includes(item.id);
  const timeStr=item.custom_time?`${new Date(item.custom_time).toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"})} ${roundTimeStr(new Date(item.custom_time))}`:roundTimeStr(new Date(item.posted_at));
  const wEmoji=WEATHERS.find(w=>w.value===item.weather)?.emoji;
  const color=getColor(item);
  const [flipped,setFlipped]=useState(false);
  const [deepMsg,setDeepMsg]=useState("");
  const [loadingDeep,setLoadingDeep]=useState(false);
  const stickyKeys=["yellow","pink","blue","green","orange"];
  const stickyKey=stickyKeys[Math.abs((item.id||"").charCodeAt?.(0)||0)%5];
  const stickyBg={yellow:"#fef08a",pink:"#fda4af",blue:"#bae6fd",green:"#bbf7d0",orange:"#fed7aa"}[stickyKey]||"#fef08a";

  async function handleFlip(){
    setFlipped(true);
    if(!deepMsg&&!loadingDeep){
      setLoadingDeep(true);
      try{
        const prompt=`「${item.ai_msg}」という内容についてもっと詳しく教えてください。同じ${cl(item.category)}に関する話題で、この内容の続きや背景・面白いエピソードを3〜4文で深掘りしてください。友達に話すような軽いトーンで。前置き不要。`;
        const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.REACT_APP_GEMINI_KEY}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
        if(!response.ok)throw new Error("API error");
        const data=await response.json();
        const text=data.candidates?.[0]?.content?.parts?.[0]?.text;
        setDeepMsg(text||getFallback(item.category));
      }catch(e){
        setDeepMsg(getFallback(item.category));
      }finally{
        setLoadingDeep(false);
      }
    }
  }

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.5)",zIndex:350,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#f4f6f3",borderRadius:"28px 28px 0 0",padding:"22px 20px 48px",boxShadow:"0 -6px 30px rgba(0,0,0,0.10)",animation:"slideUp 0.3s ease",maxHeight:"90dvh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 18px"}}/>
        {/* ヘッダー */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:getBg(color),display:"flex",alignItems:"center",justifyContent:"center"}}><MotifIcon motif={item.category} color={color} size={22} shadow/></div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:color,fontFamily:font}}>{item.user_name||cl(item.category)}</div>
              <div style={{fontSize:11,color:"#bbb",fontFamily:font}}>{timeStr}{wEmoji&&<span style={{marginLeft:5}}>{wEmoji}</span>}</div>
              {item.user_name&&!isOwn&&(
                <button onClick={()=>{onClose();onViewUser(item.user_id,item.user_name);}} style={{border:"none",background:"none",cursor:"pointer",fontSize:11,color:"#83b195",fontFamily:font,padding:0,marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                  {item.user_avatar?<img src={item.user_avatar} alt="" style={{width:14,height:14,borderRadius:"50%",objectFit:"cover"}}/>:<span>👤</span>}
                  {item.user_name}
                </button>
              )}
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {isOwn&&<button onClick={()=>{onClose();onEdit(item);}} style={{padding:"5px 10px",borderRadius:9,border:"1px solid #ddd",background:"white",color:"#888",fontSize:12,cursor:"pointer",fontFamily:font}}>✏️ 編集</button>}
            {isOwn&&<button onClick={()=>{if(window.confirm("この投稿を削除しますか？"))onDelete(item.id);}} style={{padding:"5px 10px",borderRadius:9,border:"1px solid #fca5a5",background:"white",color:"#ef4444",fontSize:12,cursor:"pointer",fontFamily:font}}>🗑️</button>}
            <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#e8e0d8",color:"#aaa",fontSize:14,cursor:"pointer"}}>×</button>
          </div>
        </div>
        {/* ポラロイド */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
          <Polaroid photo={item.photo} emoji={item.emoji} category={item.category} note={item.note} rotate={itemRot(item.id)}/>
        </div>
        {/* 付箋（2枚重ね・めくりアニメーション） */}
        {item.ai_msg&&(
          <div style={{position:"relative",marginBottom:24,cursor:flipped?"default":"pointer"}}
            onClick={()=>{if(!flipped)handleFlip();}}>
            {/* 下の付箋（深掘り内容） */}
            <div style={{
              position:"absolute",top:8,left:4,right:-4,
              background:"#bae6fd",
              borderRadius:4,padding:"16px 14px 12px",minHeight:80,
              boxShadow:"2px 3px 8px rgba(0,0,0,0.09)",
              fontFamily:font,fontSize:13,lineHeight:1.7,color:"#3a3028",
              zIndex:1,
            }}>
              {loadingDeep
                ?<p style={{margin:"0 0 8px 0",color:"#888"}}>読み込み中…</p>
                :<p style={{margin:"0 0 8px 0"}}>{deepMsg||"　"}</p>
              }
              {flipped&&(
                <button onClick={e=>{e.stopPropagation();setFlipped(false);}}
                  style={{fontSize:11,color:"#aaa",border:"none",background:"none",cursor:"pointer",marginTop:4,padding:0,fontFamily:font}}>
                  ‹ 戻る
                </button>
              )}
            </div>
            {/* 上の付箋（AIコメント・めくれて消える） */}
            <div style={{
              position:"relative",zIndex:2,
              background:stickyBg,
              padding:"16px 14px 12px",
              boxShadow:"2px 3px 6px rgba(0,0,0,0.09)",
              fontFamily:font,fontSize:13,lineHeight:1.7,color:"#3a3028",borderRadius:2,
              transition:"transform 0.5s ease, opacity 0.4s ease",
              transform:flipped?"translateY(-18px) rotate(-2deg)":"translateY(0) rotate(0deg)",
              opacity:flipped?0:1,
              pointerEvents:flipped?"none":"auto",
            }}>
              <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:22,height:5,background:"rgba(0,0,0,0.08)",borderRadius:"0 0 4px 4px"}}/>
              <p style={{margin:"0 0 8px 0"}}>{item.ai_msg}</p>
              <div style={{textAlign:"right",fontSize:11,color:"#aaa"}}>めくる ›</div>
            </div>
          </div>
        )}
        {/* いいね */}
        <div style={{textAlign:"right",marginTop:4}}>
          <button onClick={()=>onHeart(item.id)} style={{border:"none",background:"none",cursor:"pointer",fontSize:12,color:already?"#d4848a":"#ccc",fontFamily:font,padding:"4px 8px",letterSpacing:1,transition:"color 0.2s"}}>
            ♥ {item.hearts||0}
          </button>
        </div>
      </div>
    </div>
  );
}

function applyPixelFilters(ctx,W,H,brt,ctr,sat){
  if(brt===100&&ctr===100&&sat===100)return;
  try{
    const id=ctx.getImageData(0,0,W,H);const d=id.data;const bl=brt/100,ct=ctr/100,st=sat/100;
    for(let i=0;i<d.length;i+=4){
      let r=d[i]*bl,g=d[i+1]*bl,b=d[i+2]*bl;
      r=(r-128)*ct+128;g=(g-128)*ct+128;b=(b-128)*ct+128;
      const gray=0.299*r+0.587*g+0.114*b;
      r=gray+(r-gray)*st;g=gray+(g-gray)*st;b=gray+(b-gray)*st;
      d[i]=Math.max(0,Math.min(255,Math.round(r)));d[i+1]=Math.max(0,Math.min(255,Math.round(g)));d[i+2]=Math.max(0,Math.min(255,Math.round(b)));
    }
    ctx.putImageData(id,0,0);
  }catch(e){console.warn(e);}
}

function PhotoEditor({photo,onSave,onClose}){
  const [tab,setTab]=useState("adjust");
  const [brightness,setBrightness]=useState(100);
  const [contrast,setContrast]=useState(100);
  const [saturate,setSaturate]=useState(100);
  const [rotate,setRotate]=useState(0);
  const [crop,setCrop]=useState({x:0,y:0,w:1,h:1});
  const canvasRef=useRef(null),dragging=useRef(null),imgRef=useRef(new window.Image());
  const cssFilter=`brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
  useEffect(()=>{
    if(tab!=="crop")return;
    const canvas=canvasRef.current;if(!canvas)return;
    const img=imgRef.current;
    const draw=()=>{
      const W=canvas.width,H=canvas.height,ctx=canvas.getContext("2d");
      ctx.clearRect(0,0,W,H);ctx.drawImage(img,0,0,W,H);
      applyPixelFilters(ctx,W,H,brightness,contrast,saturate);
      const cx=crop.x*W,cy=crop.y*H,cw=crop.w*W,ch=crop.h*H;
      ctx.fillStyle="rgba(0,0,0,0.45)";ctx.fillRect(0,0,W,cy);ctx.fillRect(0,cy+ch,W,H-(cy+ch));ctx.fillRect(0,cy,cx,ch);ctx.fillRect(cx+cw,cy,W-(cx+cw),ch);
      ctx.strokeStyle="white";ctx.lineWidth=2;ctx.strokeRect(cx,cy,cw,ch);
      [1/3,2/3].forEach(t=>{ctx.strokeStyle="rgba(255,255,255,0.4)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+cw*t,cy);ctx.lineTo(cx+cw*t,cy+ch);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy+ch*t);ctx.lineTo(cx+cw,cy+ch*t);ctx.stroke();});
      [[cx,cy],[cx+cw,cy],[cx,cy+ch],[cx+cw,cy+ch]].forEach(([hx,hy])=>{ctx.shadowColor="rgba(0,0,0,0.3)";ctx.shadowBlur=4;ctx.fillStyle="white";ctx.fillRect(hx-10,hy-10,20,20);ctx.shadowBlur=0;});
    };
    if(img.src!==photo){img.onload=draw;img.src=photo;}else draw();
  },[tab,crop,brightness,contrast,saturate,photo]);
  function getPos(e){const c=canvasRef.current,r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height,t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*sx/c.width,y:(t.clientY-r.top)*sy/c.height};}
  function onCropStart(e){e.preventDefault();const{x,y}=getPos(e);const{x:cx,y:cy,w:cw,h:ch}=crop,th=0.12;let handle=null;if(Math.abs(x-cx)<th&&Math.abs(y-cy)<th)handle="tl";else if(Math.abs(x-(cx+cw))<th&&Math.abs(y-cy)<th)handle="tr";else if(Math.abs(x-cx)<th&&Math.abs(y-(cy+ch))<th)handle="bl";else if(Math.abs(x-(cx+cw))<th&&Math.abs(y-(cy+ch))<th)handle="br";else if(x>cx&&x<cx+cw&&y>cy&&y<cy+ch)handle="move";if(handle)dragging.current={handle,startX:x,startY:y,startCrop:{...crop}};}
  function onCropMove(e){e.preventDefault();if(!dragging.current)return;const{x,y}=getPos(e);const{handle,startX,startY,startCrop:sc}=dragging.current;const dx=x-startX,dy=y-startY,min=0.1;let{x:nx,y:ny,w:nw,h:nh}={...sc};if(handle==="move"){nx=Math.max(0,Math.min(1-nw,sc.x+dx));ny=Math.max(0,Math.min(1-nh,sc.y+dy));}else if(handle==="tl"){nx=Math.max(0,Math.min(sc.x+sc.w-min,sc.x+dx));ny=Math.max(0,Math.min(sc.y+sc.h-min,sc.y+dy));nw=sc.x+sc.w-nx;nh=sc.y+sc.h-ny;}else if(handle==="tr"){ny=Math.max(0,Math.min(sc.y+sc.h-min,sc.y+dy));nw=Math.max(min,Math.min(1-sc.x,sc.w+dx));nh=sc.y+sc.h-ny;}else if(handle==="bl"){nx=Math.max(0,Math.min(sc.x+sc.w-min,sc.x+dx));nw=sc.x+sc.w-nx;nh=Math.max(min,Math.min(1-sc.y,sc.h+dy));}else if(handle==="br"){nw=Math.max(min,Math.min(1-sc.x,sc.w+dx));nh=Math.max(min,Math.min(1-sc.y,sc.h+dy));}setCrop({x:nx,y:ny,w:nw,h:nh});}
  function onCropEnd(){dragging.current=null;}
  function handleSave(){
    function draw(img){
      const sw=img.naturalWidth||300,sh=img.naturalHeight||240,cw=Math.round(crop.w*sw)||300,ch=Math.round(crop.h*sh)||240;
      const off=document.createElement("canvas");off.width=cw;off.height=ch;
      const ctx=off.getContext("2d");ctx.drawImage(img,Math.round(crop.x*sw),Math.round(crop.y*sh),cw,ch,0,0,cw,ch);
      applyPixelFilters(ctx,cw,ch,brightness,contrast,saturate);
      onSave({brightness,contrast,saturate,rotate,croppedPhoto:off.toDataURL("image/jpeg",0.92)});
    }
    const img=new window.Image();let done=false;
    img.onload=()=>{if(!done){done=true;draw(img);}};img.src=photo;
    if(img.complete&&img.naturalWidth>0&&!done){done=true;draw(img);}
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"white",borderRadius:20,padding:18,width:"100%",maxWidth:400,maxHeight:"90dvh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:800,fontFamily:font}}>写真を編集</div>
          <button onClick={onClose} style={{width:26,height:26,borderRadius:"50%",border:"none",background:"#e8e0d8",color:"#aaa",fontSize:13,cursor:"pointer"}}>×</button>
        </div>
        <div style={{display:"flex",background:"#ede8e1",borderRadius:10,padding:3,marginBottom:13}}>
          {[{v:"adjust",label:"✨ 加工"},{v:"crop",label:"✂️ トリミング"}].map(t=>(
            <button key={t.v} onClick={()=>setTab(t.v)} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",cursor:"pointer",background:tab===t.v?"white":"transparent",color:tab===t.v?"#3a3028":"#aaa",fontSize:12,fontWeight:tab===t.v?700:400,fontFamily:font}}>{t.label}</button>
          ))}
        </div>
        {tab==="adjust"&&(
          <>
            <div style={{display:"flex",justifyContent:"center",marginBottom:13}}>
              <div style={{background:"white",padding:"7px 7px 24px",boxShadow:"0 3px 12px rgba(0,0,0,0.10)",borderRadius:2}}>
                <img src={photo} alt="" style={{width:150,height:120,objectFit:"cover",display:"block",filter:cssFilter}}/>
              </div>
            </div>
            {[{label:"☀️ 明るさ",val:brightness,set:setBrightness,min:50,max:200},{label:"◑ コントラスト",val:contrast,set:setContrast,min:50,max:200},{label:"🎨 彩度",val:saturate,set:setSaturate,min:0,max:200}].map(s=>(
              <div key={s.label} style={{marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:11,color:"#888",fontFamily:font}}>{s.label}</span><span style={{fontSize:10,color:"#bbb",fontFamily:font}}>{s.val}</span></div>
                <input type="range" min={s.min} max={s.max} value={s.val} onChange={e=>s.set(Number(e.target.value))} style={{width:"100%",accentColor:"#83b195",height:36,padding:"8px 0",cursor:"pointer",touchAction:"manipulation",display:"block"}}/>
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
          <button onClick={handleSave} style={{flex:2,padding:"10px 0",borderRadius:10,border:"none",background:"#83b195",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:font}}>決定 ✓</button>
        </div>
      </div>
    </div>
  );
}

function LocationSearch({onSelect}){
  const [q,setQ]=useState("");const [results,setResults]=useState([]);const [loading,setLoading]=useState(false);
  async function search(){if(!q.trim())return;setLoading(true);try{const res=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=ja`);const data=await res.json();setResults(data||[]);}catch{}setLoading(false);}
  return(
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",gap:6}}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="場所を検索（例：新宿駅）" style={{flex:1,padding:"7px 10px",borderRadius:9,border:"1px solid #e8e0d8",fontSize:12,fontFamily:font,outline:"none"}}/>
        <button onClick={search} disabled={loading} style={{padding:"7px 12px",borderRadius:9,border:"none",background:"#83b195",color:"white",fontSize:12,cursor:"pointer",fontFamily:font,flexShrink:0}}>{loading?"…":"検索"}</button>
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

// 共通投稿フォーム（新規投稿・後から投稿・編集で共用）
function PostForm({initialData={}, laterMode=false, userLocation, locStatus, onSave, onClose, onDelete, saveLabel="みんなに届ける 🌱", title="発見を記録する ✨"}){
  const [note,setNote]=useState(initialData.note&&initialData.note!=="📷"?initialData.note:"");
  const [category,setCategory]=useState(initialData.category||"flower");
  const [color,setColor]=useState((initialData.emoji&&initialData.emoji.startsWith("#"))?initialData.emoji:getDefaultColor(initialData.category||"flower"));
  const [photo,setPhoto]=useState(initialData.photo||null);
  const [photoEdit,setPhotoEdit]=useState(null);
  const [showEditor,setShowEditor]=useState(!!(initialData.photo&&initialData.photo.startsWith("data:")));
  const [showMoodPicker,setShowMoodPicker]=useState(false);
  const [loading,setLoading]=useState(false);
  const [laterTime,setLaterTime]=useState(initialData.custom_time||initialData.posted_at||"");
  const [laterLat,setLaterLat]=useState(initialData.lat||userLocation?.lat||35.6812);
  const [laterLng,setLaterLng]=useState(initialData.lng||userLocation?.lng||139.7671);
  const [noLoc,setNoLoc]=useState(false);
  const cameraRef=useRef(null),albumRef=useRef(null);
  const isEdit=!!initialData.id;

  function handleCat(v){setCategory(v);setColor(CAT[v]?.defaultColor||"#7a8a6a");}
  function handlePhoto(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setPhoto(ev.target.result);setShowEditor(true);};r.readAsDataURL(f);}

  async function handleSave(){
    if(!note.trim()&&!photo)return;
    setLoading(true);
    const lat=laterMode?(noLoc?null:laterLat):(userLocation?.lat?jitter(userLocation.lat):null);
    const lng=laterMode?(noLoc?null:laterLng):(userLocation?.lng?jitter(userLocation.lng):null);
    await onSave({note:note||"📷",category,emoji:color,photo:photoEdit?.croppedPhoto||photo,photoEdit,lat,lng,customTime:(laterMode&&laterTime)?laterTime:null});
    setLoading(false);
  }

  const locBadge=locStatus==="ok"?{bg:"#e5ede0",color:"#83b195",text:`GPS（${roundTimeStr(new Date())}）`}:locStatus==="loading"?{bg:"#fff8e8",color:"#c9a836",text:"取得中"}:{bg:"#fdeee7",color:"#d97041",text:"オフ"};
  const stickyColors=["yellow","pink","blue","green","orange"];

  if(showEditor&&photo&&photo.startsWith("data:"))return <PhotoEditor photo={photo} onSave={edit=>{setPhotoEdit(edit);setShowEditor(false);}} onClose={()=>setShowEditor(false)}/>;
  if(showMoodPicker)return <MoodColorPicker color={color} onChange={setColor} onClose={()=>setShowMoodPicker(false)}/>;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.6)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div style={{width:"100%",maxWidth:430,margin:"0 auto",padding:"18px 18px 36px",background:"#f4f6f3",borderRadius:"28px 28px 0 0",animation:"slideUp 0.3s ease",maxHeight:"92dvh",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"12px 0 13px"}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:800,fontFamily:font}}>{title}</h3>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {isEdit&&onDelete&&<button onClick={()=>{if(window.confirm("この投稿を削除しますか？"))onDelete(initialData.id);}} style={{padding:"5px 10px",borderRadius:9,border:"1px solid #fca5a5",background:"white",color:"#ef4444",fontSize:12,cursor:"pointer",fontFamily:font}}>🗑️</button>}
            <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#e8e0d8",color:"#aaa",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>
        {!laterMode&&!isEdit&&<div style={{display:"flex",alignItems:"center",gap:7,marginBottom:11,padding:"5px 10px",borderRadius:8,background:locBadge.bg}}>
          <span style={{fontSize:11,color:locBadge.color,fontWeight:700,fontFamily:font}}>📍 {locBadge.text}</span>
          {locStatus==="ok"&&userLocation&&<span style={{fontSize:10,color:"#aaa",marginLeft:"auto",fontFamily:font}}>±{Math.round(userLocation.accuracy||0)}m</span>}
        </div>}
        {(laterMode||isEdit)&&<>
          <div style={{marginBottom:11}}>
            <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>📅 日時を指定</div>
            <input type="datetime-local" value={laterTime} onChange={e=>setLaterTime(e.target.value)} style={{width:"100%",padding:"8px 11px",borderRadius:10,border:"1px solid #e8e0d8",fontSize:12,fontFamily:font,outline:"none",boxSizing:"border-box",color:"#3a3028"}}/>
          </div>
          <div style={{marginBottom:11}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:8}}>
              <input type="checkbox" checked={noLoc} onChange={e=>setNoLoc(e.target.checked)} style={{width:16,height:16,cursor:"pointer",accentColor:"#83b195"}}/>
              <span style={{fontSize:12,color:"#888",fontFamily:font}}>📍 場所を指定しない</span>
            </label>
            {!noLoc&&<>
              <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>📍 場所を指定</div>
              <LocationSearch onSelect={(la,lo)=>{setLaterLat(la);setLaterLng(lo);}}/>
              <PinEditMap lat={laterLat||35.6812} lng={laterLng||139.7671} onMove={(la,lo)=>{setLaterLat(la);setLaterLng(lo);}}/>
            </>}
          </div>
        </>}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:"none"}}/>
        <input ref={albumRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
        <div style={{marginBottom:11}}>
          {photo
            ?<div style={{position:"relative",display:"flex",justifyContent:"center"}}>
                <div style={{background:"white",padding:"7px 7px 24px",boxShadow:"0 3px 12px rgba(0,0,0,0.10)",borderRadius:2}}>
                  <img src={photoEdit?.croppedPhoto||photo} alt="" style={{width:150,height:120,objectFit:"cover",display:"block"}}/>
                </div>
                <div style={{position:"absolute",top:4,right:4,display:"flex",gap:4}}>
                  <button onClick={()=>{if(photo.startsWith("data:"))setShowEditor(true);}} style={{padding:"3px 7px",borderRadius:7,border:"none",background:"rgba(0,0,0,0.55)",color:"white",fontSize:11,cursor:"pointer"}}>✏️</button>
                  <button onClick={()=>{setPhoto(null);setPhotoEdit(null);}} style={{width:22,height:22,borderRadius:"50%",border:"none",background:"rgba(0,0,0,0.5)",color:"white",fontSize:11,cursor:"pointer"}}>×</button>
                </div>
              </div>
            :<div style={{display:"flex",gap:8}}>
              <button onClick={()=>cameraRef.current?.click()} style={{flex:1,padding:"14px 0",borderRadius:12,border:"1.5px dashed #c0d4af",background:"#eef5eb",color:"#83b195",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:font}}>📷 カメラ</button>
              <button onClick={()=>albumRef.current?.click()} style={{flex:1,padding:"14px 0",borderRadius:12,border:"1.5px dashed #c0d4af",background:"#eef5eb",color:"#83b195",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:font}}>🖼️ アルバム</button>
            </div>
          }
        </div>
        <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:font}}>モチーフ</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
          {CATEGORIES.map(c=>{const sel=category===c.value;const col=sel?color:c.defaultColor;return(
            <button key={c.value} onClick={()=>handleCat(c.value)} style={{padding:"10px 4px",borderRadius:12,border:"none",cursor:"pointer",background:sel?getBg(color):"white",boxShadow:sel?`0 0 0 2.5px ${color}`:"0 1px 4px rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
              <MotifIcon motif={c.value} color={sel?"#3a3028":"#bbb"} size={24}/>
              <span style={{fontSize:10,color:sel?"#3a3028":"#bbb",fontWeight:sel?700:400,fontFamily:font,lineHeight:1}}>{c.label}</span>
            </button>
          );})}
        </div>
        <div style={{marginBottom:11}}>
          <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>モチーフカラー</div>
          <button onClick={()=>setShowMoodPicker(true)} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #e8e0d8",background:"white",display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontFamily:font}}>
            <div style={{width:30,height:30,borderRadius:8,background:color,flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}/>
            <span style={{fontSize:12,color:"#888"}}>🎨 今の気分で色を選ぶ</span>
            <div style={{marginLeft:"auto",fontSize:10,color:"#bbb",fontFamily:"monospace"}}>{color}</div>
          </button>
        </div>
        <div style={{fontSize:10,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:5,fontFamily:font}}>ひとこと（写真のみでもOK）</div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="何を見つけた？感じた？（省略可）" rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:12,border:"1.5px solid #e8e0d8",background:"white",color:"#3a3028",fontSize:13,resize:"none",boxSizing:"border-box",outline:"none",fontFamily:font,lineHeight:1.6}}/>
        <button onClick={handleSave} disabled={loading||(!note.trim()&&!photo)} style={{width:"100%",padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",background:loading?"#b8cab0":(!note.trim()&&!photo)?"#c0d4af":"#83b195",color:"white",fontSize:14,fontWeight:800,fontFamily:font,marginTop:10}}>
          {loading?"保存中…":saveLabel}
        </button>
      </div>
    </div>
  );
}

function WeatherPanel({userLocation,onPost,onClose}){
  const [sel,setSel]=useState(null);const [photo,setPhoto]=useState(null);const [posting,setPosting]=useState(false);
  const cameraRef=useRef(null),albumRef=useRef(null);
  function handlePhoto(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhoto(ev.target.result);r.readAsDataURL(f);}
  async function post(){if(!sel)return;setPosting(true);try{const lat=userLocation?.lat?jitter(userLocation.lat):null,lng=userLocation?.lng?jitter(userLocation.lng):null;let photoUrl=null;if(photo)photoUrl=await uploadPhoto(photo,null);await supa("weather_reports",{method:"POST",prefer:"return=minimal",body:JSON.stringify({weather:sel,lat,lng,photo:photoUrl})});onPost();}catch(e){alert("投稿失敗: "+e.message);}setPosting(false);}
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:250,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#f4f6f3",borderRadius:"24px 24px 0 0",padding:"20px 20px 40px",animation:"slideUp 0.3s ease"}}>
        <div style={{width:36,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:800,fontFamily:font}}>今の天気を共有 ☀️</div>
          <button onClick={onClose} style={{width:26,height:26,borderRadius:"50%",border:"none",background:"#e8e0d8",color:"#aaa",fontSize:13,cursor:"pointer"}}>×</button>
        </div>
        <div style={{display:"flex",gap:7,justifyContent:"center",marginBottom:14}}>
          {WEATHERS.map(w=><button key={w.value} onClick={()=>setSel(w.value)} style={{width:42,height:42,borderRadius:12,border:"none",cursor:"pointer",fontSize:20,background:sel===w.value?"#e5ede0":"white",boxShadow:sel===w.value?"0 0 0 2.5px #83b195":"0 1px 4px rgba(0,0,0,0.1)"}}>{w.emoji}</button>)}
        </div>
        <div style={{marginBottom:12}}>
          {photo?<div style={{position:"relative"}}><img src={photo} alt="" style={{width:"100%",height:100,objectFit:"cover",borderRadius:10}}/><button onClick={()=>setPhoto(null)} style={{position:"absolute",top:4,right:4,width:22,height:22,borderRadius:"50%",border:"none",background:"rgba(0,0,0,0.5)",color:"white",fontSize:11,cursor:"pointer"}}>×</button></div>
            :<div style={{display:"flex",gap:7}}>
              <button onClick={()=>cameraRef.current?.click()} style={{flex:1,padding:"9px 0",borderRadius:10,border:"1.5px dashed #c0d4af",background:"#eef5eb",color:"#83b195",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:font}}>📷 カメラ</button>
              <button onClick={()=>albumRef.current?.click()} style={{flex:1,padding:"9px 0",borderRadius:10,border:"1.5px dashed #c0d4af",background:"#eef5eb",color:"#83b195",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:font}}>🖼️ アルバム</button>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:"none"}}/>
              <input ref={albumRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
            </div>}
        </div>
        <button onClick={post} disabled={!sel||posting} style={{width:"100%",padding:"11px 0",borderRadius:12,border:"none",background:sel&&!posting?"#83b195":"#c0d4af",color:"white",fontSize:13,fontWeight:700,cursor:sel?"pointer":"default",fontFamily:font}}>{posting?"送信中…":`${sel?WEATHERS.find(w=>w.value===sel)?.emoji:""} 地図に表示する`}</button>
      </div>
    </div>
  );
}

// ProfileModal: 名前・自己紹介・フォロー一覧ナビ・コルクボード
function ProfileModal({myUserId,myUserName,myAvatar,targetUserId,targetUserName,discoveries,token,onClose,onViewUser,onItemClick}){
  const isMe=!targetUserId||targetUserId===myUserId;
  const userId=isMe?myUserId:targetUserId;
  const userName=isMe?myUserName:targetUserName;
  const [editName,setEditName]=useState(myUserName||"");
  const [bio,setBio]=useState("");
  const [savingName,setSavingName]=useState(false);
  const [editMode,setEditMode]=useState(false);
  const [avatarUrl,setAvatarUrl]=useState(isMe?myAvatar:null);
  const avatarInputRef=useRef(null);
  const [followers,setFollowers]=useState([]);
  const [following,setFollowing]=useState([]);
  const [isFollowing,setIsFollowing]=useState(false);
  const [loadingFollow,setLoadingFollow]=useState(false);
  const [showFollowList,setShowFollowList]=useState(null);
  const [followUsers,setFollowUsers]=useState([]);
  const stickyColors=["yellow","pink","blue","green","orange"];

  useEffect(()=>{
    if(!userId)return;
    supa(`follows?following_id=eq.${userId}`).then(d=>setFollowers(d||[])).catch(()=>{});
    supa(`follows?follower_id=eq.${userId}`).then(d=>setFollowing(d||[])).catch(()=>{});
    if(!isMe&&myUserId)supa(`follows?follower_id=eq.${myUserId}&following_id=eq.${userId}`).then(d=>setIsFollowing((d||[]).length>0)).catch(()=>{});
    supa(`users?id=eq.${userId}&select=name,avatar_url,bio`).then(d=>{
      if(d&&d[0]){
        if(!isMe&&d[0].avatar_url)setAvatarUrl(d[0].avatar_url);
        if(d[0].bio)setBio(d[0].bio);
        if(isMe&&d[0].name)setEditName(d[0].name);
      }
    }).catch(()=>{});
  },[userId]);

  async function loadFollowUsers(type){
    const list=type==='followers'?followers:following;
    const ids=list.map(f=>type==='followers'?f.follower_id:f.following_id).filter(Boolean);
    setFollowUsers([]);setShowFollowList(type);
    if(!ids.length)return;
    try{const data=await supa(`users?id=in.(${ids.join(',')})&select=id,name,avatar_url`);setFollowUsers(data||[]);}catch{}
  }

  async function toggleFollow(){
    if(!myUserId||loadingFollow)return;setLoadingFollow(true);
    try{if(isFollowing){await supa(`follows?follower_id=eq.${myUserId}&following_id=eq.${userId}`,{method:"DELETE",prefer:"return=minimal"},token);setIsFollowing(false);}else{await supa("follows",{method:"POST",prefer:"return=minimal",body:JSON.stringify({follower_id:myUserId,following_id:userId})},token);setIsFollowing(true);}}
    catch(e){alert(e.message);}setLoadingFollow(false);
  }

  async function saveName(){
    if(!editName.trim()||!myUserId)return;setSavingName(true);
    try{await supa(`users?id=eq.${myUserId}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({name:editName.trim(),bio:bio})},token);lsSet("userName",editName.trim());}
    catch(e){alert(e.message);}setSavingName(false);
  }

  async function handleAvatarUpload(e){
    const f=e.target.files?.[0];if(!f)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      try{const url=await uploadPhoto(ev.target.result,token);await supa(`users?id=eq.${myUserId}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({avatar_url:url})},token);setAvatarUrl(url);lsSet("myAvatar",url);}
      catch(e){alert("アバター更新失敗: "+e.message);}
    };reader.readAsDataURL(f);
  }

  const userDisc=discoveries.filter(d=>d.user_id===userId).sort((a,b)=>new Date(b.custom_time||b.posted_at)-new Date(a.custom_time||a.posted_at));

  if(showFollowList){
    return(
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#f4f6f3",borderRadius:"28px 28px 0 0",padding:"22px 20px 48px",boxShadow:"0 -6px 30px rgba(0,0,0,0.10)",animation:"slideUp 0.35s ease",maxHeight:"90dvh",overflowY:"auto"}}>
          <div style={{width:40,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={()=>setShowFollowList(null)} style={{border:"none",background:"none",cursor:"pointer",fontSize:13,color:"#83b195",fontWeight:700,fontFamily:font,padding:0}}>‹ 戻る</button>
            <div style={{fontSize:15,fontWeight:800,fontFamily:font}}>{showFollowList==='followers'?'フォロワー':'フォロー中'} {followUsers.length}人</div>
          </div>
          {followUsers.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#ccc",fontFamily:font,fontSize:13}}>まだいません</div>}
          {followUsers.map(u=>(
            <button key={u.id} onClick={()=>{setShowFollowList(null);onViewUser(u.id,u.name);}} style={{width:"100%",padding:"12px 16px",border:"none",background:"white",borderRadius:12,marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",fontFamily:font}}>
              <div style={{width:40,height:40,borderRadius:"50%",overflow:"hidden",background:"#e5ede0",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {u.avatar_url?<img src={u.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:20}}>👤</span>}
              </div>
              <span style={{fontSize:14,fontWeight:600,color:"#3a3028"}}>{u.name}</span>
              <span style={{marginLeft:"auto",fontSize:12,color:"#83b195"}}>›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#f4f6f3",borderRadius:"28px 28px 0 0",padding:"22px 20px 0",boxShadow:"0 -6px 30px rgba(0,0,0,0.10)",animation:"slideUp 0.35s ease",maxHeight:"90dvh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:"#e0d8d0",borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{position:"relative"}}>
              <div style={{width:60,height:60,borderRadius:"50%",overflow:"hidden",background:"#e5ede0",display:"flex",alignItems:"center",justifyContent:"center",cursor:isMe?"pointer":"default",border:"2.5px solid #83b195"}} onClick={()=>isMe&&avatarInputRef.current?.click()}>
                {avatarUrl?<img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:28}}>👤</span>}
              </div>
              {isMe&&<div style={{position:"absolute",bottom:0,right:0,width:20,height:20,background:"#83b195",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:11}} onClick={()=>avatarInputRef.current?.click()}>✏️</div>}
              {isMe&&<input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:"none"}}/>}
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:18,fontWeight:800,fontFamily:font}}>{userName||"ゲスト"}</div>
                {isMe&&!editMode&&<button onClick={()=>{setEditName(myUserName||"");setEditMode(true);}} style={{fontSize:11,color:"#8aaa7a",border:"1px solid #8aaa7a",borderRadius:8,padding:"3px 8px",background:"white",cursor:"pointer",fontFamily:font,fontWeight:600,flexShrink:0}}>編集 ✏️</button>}
              </div>
              <div style={{display:"flex",gap:12,marginTop:4}}>
                <button onClick={()=>loadFollowUsers('following')} style={{border:"none",background:"none",cursor:"pointer",fontSize:12,color:"#3a3028",fontFamily:font,padding:0}}>フォロー <span style={{fontWeight:700,color:"#83b195"}}>{following.length}</span></button>
                <button onClick={()=>loadFollowUsers('followers')} style={{border:"none",background:"none",cursor:"pointer",fontSize:12,color:"#3a3028",fontFamily:font,padding:0}}>フォロワー <span style={{fontWeight:700,color:"#83b195"}}>{followers.length}</span></button>
              </div>
              {bio&&<p style={{margin:"6px 0 0",fontSize:12,color:"#888",fontFamily:font,lineHeight:1.5}}>{bio}</p>}
            </div>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            {!isMe&&myUserId&&<button onClick={toggleFollow} disabled={loadingFollow} style={{padding:"7px 14px",borderRadius:11,border:"none",cursor:"pointer",background:isFollowing?"#f4e0e2":"#83b195",color:isFollowing?"#d4848a":"white",fontSize:12,fontWeight:700,fontFamily:font}}>{loadingFollow?"…":isFollowing?"フォロー中":"フォロー"}</button>}
            <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#e8e0d8",color:"#aaa",fontSize:13,cursor:"pointer"}}>×</button>
          </div>
        </div>
        {isMe&&editMode&&(
          <div style={{background:"white",borderRadius:13,padding:12,marginBottom:13,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#83b195",marginBottom:7,fontFamily:font}}>プロフィール編集</div>
            <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="名前" style={{width:"100%",padding:"8px 11px",borderRadius:9,border:"1px solid #e8e0d8",fontSize:13,fontFamily:font,outline:"none",boxSizing:"border-box",marginBottom:7}}/>
            <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="自己紹介（省略可）" rows={2} style={{width:"100%",padding:"8px 11px",borderRadius:9,border:"1px solid #e8e0d8",fontSize:12,fontFamily:font,outline:"none",boxSizing:"border-box",resize:"none",lineHeight:1.6,marginBottom:7}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditMode(false)} style={{flex:1,padding:"8px 0",borderRadius:9,border:"1.5px solid #e8e0d8",background:"white",color:"#aaa",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:font}}>キャンセル</button>
              <button onClick={async()=>{await saveName();setEditMode(false);}} disabled={savingName} style={{flex:2,padding:"8px 0",borderRadius:9,border:"none",background:"#83b195",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:font}}>{savingName?"保存中…":"保存"}</button>
            </div>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"0 2px"}}>
          <div style={{fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:2,fontFamily:font}}>発見 {userDisc.length}件</div>
          {isMe&&<div style={{fontSize:10,background:"#e5ede0",color:"#83b195",padding:"2px 8px",borderRadius:8,fontWeight:700,fontFamily:font}}>永久保存</div>}
        </div>
        <div style={{background:"#e3927d",padding:"12px 8px 48px",minHeight:200,marginLeft:-20,marginRight:-20}}>
          {userDisc.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(100,80,80,0.6)"}}><div style={{fontSize:32,marginBottom:8}}>🌱</div><div style={{fontSize:13,fontFamily:font}}>まだ投稿がありません</div></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px 12px"}}>
            {userDisc.map((d,i)=>{
              const rot=itemRot(d.id),sRot=stickyRot(d.id);
              return(
                <div key={d.id} onClick={()=>onItemClick&&onItemClick(d)} style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:10,position:"relative"}}>
                  <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:12,height:18,zIndex:2,display:"flex",gap:2}}>
                    <div style={{width:5,height:18,background:"#7a6040",borderRadius:"2px 2px 3px 3px",boxShadow:"1px 1px 2px rgba(0,0,0,0.3)"}}/>
                    <div style={{width:5,height:18,background:"#7a6040",borderRadius:"2px 2px 3px 3px",boxShadow:"1px 1px 2px rgba(0,0,0,0.3)"}}/>
                  </div>
                  <div style={{transform:`rotate(${rot}deg)`,transformOrigin:"top center",filter:"drop-shadow(2px 4px 8px rgba(0,0,0,0.25))"}}>
                    <Polaroid photo={d.photo} emoji={d.emoji} category={d.category} note={d.note}/>
                  </div>
                  {d.ai_msg&&<div style={{transform:`rotate(${sRot}deg)`,marginTop:-8,width:"90%"}}><StickyNote text={d.ai_msg} colorKey={stickyColors[i%stickyColors.length]}/></div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen(){
  return(
    <div style={{minHeight:"100dvh",background:"#f4f6f3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:font,padding:32}}>
      <div style={{fontSize:52,marginBottom:16}}>🌱</div>
      <h1 style={{fontSize:22,fontWeight:800,color:"#3a3028",margin:"0 0 8px",textAlign:"center"}}>今日の小さな発見</h1>
      <p style={{fontSize:13,color:"#aaa",margin:"0 0 44px",textAlign:"center",lineHeight:1.8}}>あなたの街の小さな発見を<br/>半径5kmの誰かと共有しよう</p>
      <button onClick={googleLogin} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 24px",borderRadius:16,border:"1.5px solid #e8e0d8",background:"white",cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",fontSize:14,fontWeight:700,color:"#3a3028",fontFamily:font,width:"100%",maxWidth:280,justifyContent:"center"}}>
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Googleでログイン
      </button>
    </div>
  );
}

function CorkBoard({items,onItemClick,showUser=false}){
  const stickyColors=["yellow","pink","blue","green","orange"];
  if(items.length===0)return <div style={{textAlign:"center",padding:"50px 0",color:"rgba(255,255,255,0.7)"}}><div style={{fontSize:36,marginBottom:10}}>🌱</div><div style={{fontSize:13,fontFamily:font}}>まだ投稿がありません</div></div>;
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px 12px"}}>
      {items.map((d,i)=>{
        const rot=itemRot(d.id),sRot=stickyRot(d.id);
        return(
          <div key={d.id} onClick={()=>onItemClick(d)} style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:10,position:"relative"}}>
            <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:12,height:18,zIndex:2,display:"flex",gap:2}}>
              <div style={{width:5,height:18,background:"#7a6040",borderRadius:"2px 2px 3px 3px",boxShadow:"1px 1px 2px rgba(0,0,0,0.3)"}}/>
              <div style={{width:5,height:18,background:"#7a6040",borderRadius:"2px 2px 3px 3px",boxShadow:"1px 1px 2px rgba(0,0,0,0.3)"}}/>
            </div>
            <div style={{transform:`rotate(${rot}deg)`,transformOrigin:"top center",filter:"drop-shadow(2px 4px 8px rgba(0,0,0,0.25))"}}>
              <Polaroid photo={d.photo} emoji={d.emoji} category={d.category} note={d.note} userName={showUser?d.user_name:""}/>
            </div>
            {d.ai_msg&&<div style={{transform:`rotate(${sRot}deg)`,marginTop:-8,width:"90%"}}><StickyNote text={d.ai_msg} colorKey={stickyColors[i%stickyColors.length]}/></div>}
          </div>
        );
      })}
    </div>
  );
}

const SEL_FIELDS="id,note,category,emoji,photo,weather,lat,lng,ai_msg,hearts,user_id,user_name,user_avatar,custom_time,posted_at";

export default function App(){
  const [tab,setTab]=useState(0);
  const [discoveries,setDiscoveries]=useState([]);
  const [followingPosts,setFollowingPosts]=useState([]);
  const [myDiscoveries,setMyDiscoveries]=useState([]);
  const [weatherReports,setWeatherReports]=useState([]);
  const [selected,setSelected]=useState(null);
  const [editTarget,setEditTarget]=useState(null);
  const [showCapture,setShowCapture]=useState(false);
  const [showCaptureLater,setShowCaptureLater]=useState(false);
  const [initialPhoto,setInitialPhoto]=useState(null);
  const globalCameraRef=useRef(null);
  const [showWeatherPanel,setShowWeatherPanel]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [profileTarget,setProfileTarget]=useState({id:null,name:null});
  const [myHearts,setMyHearts]=useState(()=>lsGet("myHearts",[]));
  const [myUserId,setMyUserId]=useState(null);
  const [myUserName,setMyUserName]=useState("");
  const [myAvatar,setMyAvatar]=useState(()=>lsGet("myAvatar",null));
  const [myUserCode,setMyUserCode]=useState(()=>lsGet("userCode",null));
  const [authReady,setAuthReady]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [showAI,setShowAI]=useState(false);
  const [aiMsg,setAiMsg]=useState("");
  const [userLocation,setUserLocation]=useState(null);
  const [locStatus,setLocStatus]=useState("idle");
  const [visibleCats,setVisibleCats]=useState(CATEGORIES.map(c=>c.value));
  const watchIdRef=useRef(null),centerMeRef=useRef(null),sessionRef=useRef(null),lastPostRef=useRef(0);

  useEffect(()=>{
    if(!navigator.geolocation){setLocStatus("denied");return;}
    setLocStatus("loading");
    watchIdRef.current=navigator.geolocation.watchPosition(
      pos=>{setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy});setLocStatus("ok");},
      ()=>setLocStatus("denied"),{enableHighAccuracy:true,maximumAge:5000,timeout:15000}
    );
    return()=>{if(watchIdRef.current!=null)navigator.geolocation.clearWatch(watchIdRef.current);};
  },[]);

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
            const udata=await supa(`users?id=eq.${user.id}&select=avatar_url,user_code`,{},at).catch(()=>null);
            if(udata&&udata[0]){
              if(udata[0].avatar_url){setMyAvatar(udata[0].avatar_url);lsSet("myAvatar",udata[0].avatar_url);}
              if(udata[0].user_code){setMyUserCode(udata[0].user_code);lsSet("userCode",udata[0].user_code);}
              else{const code=String(Math.floor(100000+Math.random()*900000));await supa(`users?id=eq.${user.id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({user_code:code})},at).catch(()=>{});setMyUserCode(code);lsSet("userCode",code);}
            }
          }catch(e){console.error(e);}
          window.history.replaceState(null,"",window.location.pathname);
        }
        setAuthReady(true);return;
      }
      const stored=getSession();
      if(stored){
        if(stored.expires_at&&Date.now()>stored.expires_at-300000){
          const refreshed=await refreshToken(stored.refresh_token);
          if(refreshed){saveSession(refreshed);sessionRef.current=refreshed;const u=refreshed.user;setMyUserId(u.id);setMyUserName(lsGet("userName",u.user_metadata?.full_name||"旅人"));setMyAvatar(lsGet("myAvatar",null));}
          else saveSession(null);
        }else{sessionRef.current=stored;const u=stored.user;setMyUserId(u.id);setMyUserName(lsGet("userName",u.user_metadata?.full_name||"旅人"));setMyAvatar(lsGet("myAvatar",null));}
      }
      setAuthReady(true);
    }
    init();
  },[]);

  useEffect(()=>{
    if(!myUserId||myUserCode)return;
    const tok=sessionRef.current?.access_token;
    if(!tok)return;
    (async()=>{
      try{
        const data=await supa(`users?id=eq.${myUserId}&select=user_code`,{},tok);
        if(data&&data[0]?.user_code){setMyUserCode(data[0].user_code);lsSet("userCode",data[0].user_code);}
        else{const code=String(Math.floor(100000+Math.random()*900000));await supa(`users?id=eq.${myUserId}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({user_code:code})},tok).catch(()=>{});setMyUserCode(code);lsSet("userCode",code);}
      }catch{}
    })();
  },[myUserId]);

  async function fetchAll(){
    try{
      const since=new Date(Date.now()-7*24*3600000).toISOString();
      const data=await supa(`discoveries?posted_at=gte.${since}&order=posted_at.desc&limit=300&select=${SEL_FIELDS}`);
      setDiscoveries(data||[]);
    }catch(e){console.error(e);}
  }
  async function fetchFollowingPosts(uid){
    try{
      const follows=await supa(`follows?follower_id=eq.${uid}&select=following_id`);
      const ids=(follows||[]).map(f=>f.following_id).filter(Boolean);
      if(!ids.length){setFollowingPosts([]);return;}
      const since=new Date(Date.now()-7*24*3600000).toISOString();
      const data=await supa(`discoveries?user_id=in.(${ids.join(',')})&posted_at=gte.${since}&order=posted_at.desc&limit=200&select=${SEL_FIELDS}`);
      setFollowingPosts(data||[]);
    }catch{setFollowingPosts([]);}
  }
  async function fetchMy(uid){
    try{
      const data=await supa(`discoveries?user_id=eq.${uid}&order=posted_at.desc&limit=500&select=${SEL_FIELDS}`);
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
    if(myUserId){fetchMy(myUserId);fetchFollowingPosts(myUserId);}
    const t1=setInterval(fetchAll,180000),t2=setInterval(fetchWeather,300000);
    return()=>{clearInterval(t1);clearInterval(t2);};
  },[authReady,myUserId]);

  const nearby=discoveries.filter(d=>{if(!d.lat||!d.lng)return false;if(!userLocation)return true;return haversine(userLocation.lat,userLocation.lng,d.lat,d.lng)<=5;});
  function toggleCat(v){const all=CATEGORIES.map(c=>c.value);setVisibleCats(prev=>{if(prev.length===all.length)return[v];if(prev.includes(v)){const next=prev.filter(x=>x!==v);return next.length===0?all:next;}return[...prev,v];});}

  async function handleHeart(id){
    const already=myHearts.includes(id);
    const updated=already?myHearts.filter(x=>x!==id):[...myHearts,id];
    setMyHearts(updated);lsSet("myHearts",updated);
    const delta=already?-1:1;
    const upd=prev=>prev.map(d=>d.id===id?{...d,hearts:Math.max(0,(d.hearts||0)+delta)}:d);
    setDiscoveries(upd);setFollowingPosts(upd);
    if(selected?.id===id)setSelected(s=>({...s,hearts:Math.max(0,(s.hearts||0)+delta)}));
    try{const cur=[...discoveries,...followingPosts,...myDiscoveries].find(d=>d.id===id);await supa(`discoveries?id=eq.${id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({hearts:Math.max(0,(cur?.hearts||0)+delta)})});}catch{}
  }

  async function handleUpdate(id,updates){
    try{
      await supa(`discoveries?id=eq.${id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify(updates)});
      const upd=d=>d.id===id?{...d,...updates}:d;
      setDiscoveries(prev=>prev.map(upd));setFollowingPosts(prev=>prev.map(upd));setMyDiscoveries(prev=>prev.map(upd));
      if(selected?.id===id)setSelected(s=>({...s,...updates}));
    }catch(e){alert("保存失敗: "+e.message);}
  }

  async function handleDelete(id){
    try{
      await supa(`discoveries?id=eq.${id}`,{method:"DELETE",prefer:"return=minimal"});
      const flt=prev=>prev.filter(d=>d.id!==id);
      setDiscoveries(flt);setFollowingPosts(flt);setMyDiscoveries(flt);
      setSelected(null);setEditTarget(null);
    }catch(e){alert("削除失敗: "+e.message);}
  }

  async function handleSave({note,category,emoji,photo,photoEdit,lat,lng,customTime}){
    const now=Date.now();
    if(now-lastPostRef.current<10000){alert(`続けて投稿するには${Math.ceil((10000-(now-lastPostRef.current))/1000)}秒待ってください`);return;}
    lastPostRef.current=now;
    let msg=getFallback(category);
    try{
      const prompt=`「${cl(category)}」に関連した面白い豆知識・雑学、またはクスっとするギャグを1〜2文で日本語で返して。友達に話すような軽いトーンで。${note&&note!=="📷"?`発見メモ:「${note}」。`:""}前置きや締めの言葉は不要。`;
      const geminiUrl=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.REACT_APP_GEMINI_KEY}`;
      const geminiBody=JSON.stringify({contents:[{parts:[{text:prompt}]}]});
      let response;
      for(let attempt=0;attempt<2;attempt++){
        if(attempt>0)await new Promise(r=>setTimeout(r,3000));
        response=await fetch(geminiUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:geminiBody});
        if(response.status!==429)break;
      }
      if(!response.ok)throw new Error(`HTTP error! status: ${response.status}`);
      const data=await response.json();
      const aiText=data.candidates?.[0]?.content?.parts?.[0]?.text;
      if(aiText)msg=aiText.trim();
    }catch(error){console.error("Gemini API Error:",error.message);}
    try{
      const token=await getValidToken(sessionRef);
      const finalPhoto=photoEdit?.croppedPhoto||photo||null;
      let photoUrl=null;if(finalPhoto)photoUrl=await uploadPhoto(finalPhoto,token);
      const row={note:note||"📷",category,emoji,photo:photoUrl,lat:lat||null,lng:lng||null,ai_msg:msg,hearts:0,user_id:myUserId||null,user_name:myUserName||null,user_avatar:myAvatar||null,custom_time:customTime||null};
      const saved=await supa("discoveries",{method:"POST",prefer:"return=representation",body:JSON.stringify(row)},token);
      const entry=Array.isArray(saved)?saved[0]:saved;
      setDiscoveries(prev=>[entry,...prev]);setMyDiscoveries(prev=>[entry,...prev]);
      setShowCapture(false);setShowCaptureLater(false);setAiMsg(msg);setShowAI(true);
    }catch(e){alert("投稿失敗: "+e.message);setShowCapture(false);}
  }

  async function handleEditSave({note,category,emoji,photo,photoEdit,lat,lng,customTime}){
    if(!editTarget)return;
    const token=await getValidToken(sessionRef);
    let photoUrl=editTarget.photo;
    const finalPhoto=photoEdit?.croppedPhoto||photo;
    if(finalPhoto&&finalPhoto.startsWith("data:")){
      try{photoUrl=await uploadPhoto(finalPhoto,token);}catch(e){alert("写真アップロード失敗");return;}
    }else if(finalPhoto&&finalPhoto.startsWith("https://")){photoUrl=finalPhoto;}
    else if(!finalPhoto){photoUrl=null;}
    await handleUpdate(editTarget.id,{note:note||"📷",category,emoji,photo:photoUrl,custom_time:customTime||null,lat:lat||null,lng:lng||null});
    setEditTarget(null);
  }

  async function handleSignOut(){await googleLogout(sessionRef.current?.access_token);setMyUserId(null);setMyUserName("");window.location.reload();}

  if(!authReady)return <div style={{minHeight:"100dvh",background:"#f4f6f3",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,fontFamily:font}}><div style={{fontSize:44}}>🌱</div><div style={{fontSize:12,color:"#aaa"}}>読み込み中…</div></div>;
  if(!myUserId)return <LoginScreen/>;

  // タイムライン: 5km圏内 + フォローユーザーの投稿（重複排除・時系列・1週間以内）
  const oneWeekAgo=Date.now()-7*24*3600*1000;
  const timelineItems=[
    ...nearby,
    ...followingPosts.filter(d=>!nearby.find(n=>n.id===d.id)),
  ].filter(d=>visibleCats.includes(d.category)&&new Date(d.custom_time||d.posted_at).getTime()>=oneWeekAgo).sort((a,b)=>new Date(b.custom_time||b.posted_at)-new Date(a.custom_time||a.posted_at));
  const memoryItems=myDiscoveries.filter(d=>visibleCats.includes(d.category)).sort((a,b)=>new Date(b.custom_time||b.posted_at)-new Date(a.custom_time||a.posted_at));
  const TABS=["ホーム","タイムライン","思い出"];

  return(
    <div style={{height:"100dvh",background:"#f4f6f3",fontFamily:font,color:"#3a3028",display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto",overflow:"hidden"}}>
      <SlideMenu open={menuOpen} onClose={()=>setMenuOpen(false)} onSetTab={setTab}
        onOpenProfile={()=>{setProfileTarget({id:null,name:null});setShowProfile(true);}}
        onSignOut={handleSignOut} onCaptureLater={()=>setShowCaptureLater(true)}
        onViewUser={(id,name)=>{setProfileTarget({id,name});setShowProfile(true);}}
        userName={myUserName} avatarUrl={myAvatar} myUserCode={myUserCode}/>

      {tab===0&&(
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:"100dvh",display:"flex",flexDirection:"column",zIndex:10,background:"#f4f6f3"}}>
          <div style={{flexShrink:0,paddingTop:"env(safe-area-inset-top,44px)",background:"#f4f6f3",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 16px 0"}}>
              <div style={{fontSize:15,fontWeight:800,color:"#3a3028"}}>🌱 今日の発見</div>
              <button onClick={()=>setMenuOpen(true)} style={{border:"none",background:"none",cursor:"pointer",fontSize:22,color:"#3a3028",padding:"2px 0",lineHeight:1}}>≡</button>
            </div>
            <div style={{display:"flex",gap:6,padding:"6px 12px 10px",overflowX:"auto"}}>
              {CATEGORIES.map(c=>{const on=visibleCats.includes(c.value);return(
                <button key={c.value} onClick={()=>toggleCat(c.value)} style={{flexShrink:0,width:36,height:36,border:"none",cursor:"pointer",background:"none",display:"flex",alignItems:"center",justifyContent:"center",opacity:on?1:0.25,transition:"opacity 0.15s",padding:0}}>
                  <MotifIcon motif={c.value} color="#a09888" size={28}/>
                </button>
              );})}
            </div>
          </div>
          <div style={{flex:1,position:"relative",overflow:"hidden",minHeight:0}}>
            <LiveMap discoveries={discoveries} weatherReports={weatherReports} userLocation={userLocation} visibleCats={visibleCats} onPinClick={setSelected} centerMeRef={centerMeRef}/>
            <div style={{position:"absolute",top:10,right:10,display:"flex",flexDirection:"column",gap:7,zIndex:1000}}>
              {locStatus==="ok"&&<button onClick={()=>centerMeRef.current&&centerMeRef.current()} style={{width:38,height:38,borderRadius:"50%",border:"none",cursor:"pointer",background:"white",boxShadow:"0 2px 10px rgba(0,0,0,0.22)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>📍</button>}
              <button onClick={()=>setShowWeatherPanel(true)} style={{width:38,height:38,borderRadius:"50%",border:"none",cursor:"pointer",background:"white",boxShadow:"0 2px 10px rgba(0,0,0,0.22)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>☀️</button>
            </div>
            {nearby.length>0&&<div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",zIndex:1000,background:"rgba(255,252,245,0.95)",borderRadius:16,padding:"5px 14px",boxShadow:"0 2px 10px rgba(0,0,0,0.1)",fontSize:11,color:"#83b195",fontWeight:700,whiteSpace:"nowrap"}}>👥 半径5km内に{nearby.length}件</div>}
          </div>
          <div style={{flexShrink:0,background:"#f4f6f3",borderTop:"1px solid rgba(0,0,0,0.08)",display:"flex",alignItems:"center",padding:`10px 24px env(safe-area-inset-bottom,16px)`}}>
            <button onClick={()=>setTab(1)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,border:"none",background:"none",cursor:"pointer",color:"#888"}}>
              <span style={{fontSize:18}}>🗒️</span>
              <span style={{fontSize:10,fontWeight:500,fontFamily:font}}>タイムライン</span>
            </button>
            <button onClick={()=>globalCameraRef.current?.click()} style={{width:52,height:52,borderRadius:"50%",border:"none",cursor:"pointer",background:"#83b195",color:"white",fontSize:26,fontWeight:700,boxShadow:"0 4px 16px rgba(131,177,149,0.45)",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:"auto"}}>+</button>
          </div>
        </div>
      )}

      {tab!==0&&(
        <>
          <div style={{position:"sticky",top:0,zIndex:30,background:"#f4f6f3",borderBottom:"1px solid #e8e0d8"}}>
            <div style={{padding:"50px 16px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={()=>setTab(0)} style={{display:"flex",alignItems:"center",gap:4,border:"none",background:"none",cursor:"pointer",fontSize:13,color:"#83b195",fontWeight:700,padding:0,fontFamily:font}}>‹ 地図</button>
              <div style={{fontSize:17,fontWeight:800}}>{TABS[tab]}</div>
              <button onClick={()=>setMenuOpen(true)} style={{width:32,height:32,borderRadius:9,border:"none",background:"#f0ebe5",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>≡</button>
            </div>
            <div style={{display:"flex",gap:6,padding:"0 12px 10px",overflowX:"auto"}}>
              {CATEGORIES.map(c=>{const on=visibleCats.includes(c.value);return <button key={c.value} onClick={()=>toggleCat(c.value)} style={{flexShrink:0,width:36,height:36,border:"none",cursor:"pointer",background:"none",display:"flex",alignItems:"center",justifyContent:"center",opacity:on?1:0.25,transition:"opacity 0.15s",padding:0}}><MotifIcon motif={c.value} color="#a09888" size={28}/></button>;})}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",paddingBottom:80,minHeight:0}}>
            {tab===1&&<div style={{background:"#7db9e3",minHeight:"100%",padding:"10px 8px 80px"}}><CorkBoard items={timelineItems} onItemClick={setSelected} showUser={true}/></div>}
            {tab===2&&<div style={{background:"#99d0bc",minHeight:"100%",padding:"10px 8px 80px"}}><CorkBoard items={memoryItems} onItemClick={setSelected} showUser={false}/></div>}
          </div>
          {!showCapture&&!showAI&&!selected&&!showWeatherPanel&&!showProfile&&!editTarget&&(
            <button onClick={()=>globalCameraRef.current?.click()} style={{position:"fixed",bottom:"calc(env(safe-area-inset-bottom,0px) + 22px)",right:18,width:52,height:52,borderRadius:"50%",border:"none",cursor:"pointer",background:"#83b195",color:"white",fontSize:24,fontWeight:700,boxShadow:"0 4px 16px rgba(131,177,149,0.45)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          )}
        </>
      )}

      {selected&&<DetailModal item={selected} isOwn={myDiscoveries.some(d=>d.id===selected.id)} onClose={()=>setSelected(null)} onHeart={handleHeart} myHearts={myHearts} onUpdate={handleUpdate} onDelete={(id)=>{handleDelete(id);}} onViewUser={(id,name)=>{setSelected(null);setProfileTarget({id,name});setShowProfile(true);}} onEdit={(item)=>{setSelected(null);setEditTarget(item);}}/>}
      {editTarget&&<PostForm initialData={editTarget} laterMode={true} userLocation={userLocation} locStatus={locStatus} onSave={handleEditSave} onClose={()=>setEditTarget(null)} onDelete={(id)=>{handleDelete(id);}} saveLabel="変更を保存 ✓" title="投稿を編集する ✏️"/>}
      {showWeatherPanel&&<WeatherPanel userLocation={userLocation} onPost={()=>{fetchWeather();setShowWeatherPanel(false);}} onClose={()=>setShowWeatherPanel(false)}/>}
      {showProfile&&<ProfileModal key={profileTarget.id||'me'} myUserId={myUserId} myUserName={myUserName} myAvatar={myAvatar} targetUserId={profileTarget.id} targetUserName={profileTarget.name} discoveries={[...discoveries,...myDiscoveries.filter(d=>!discoveries.find(x=>x.id===d.id))]} token={sessionRef.current?.access_token} onClose={()=>setShowProfile(false)} onViewUser={(id,name)=>{setProfileTarget({id,name});}} onItemClick={setSelected}/>}
      {showAI&&(
        <div onClick={()=>setShowAI(false)} style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",padding:"26px 22px 46px",background:"#f4f6f3",borderRadius:"28px 28px 0 0",animation:"slideUp 0.4s ease"}}>
            <div style={{fontSize:28,textAlign:"center",marginBottom:10}}>🌱</div>
            <p style={{margin:"0 0 6px",fontSize:12,color:"#aaa",textAlign:"center",fontFamily:font}}>半径5kmの誰かに届きました</p>
            <p style={{margin:"0 0 20px",fontSize:14,lineHeight:1.8,textAlign:"center",color:"#3a3028",fontStyle:"italic",fontFamily:font}}>{aiMsg}</p>
            <button onClick={()=>{setShowAI(false);setTab(0);}} style={{width:"100%",padding:"13px 0",borderRadius:14,border:"none",cursor:"pointer",background:"#83b195",color:"white",fontSize:14,fontWeight:700,fontFamily:font}}>地図で見る 📍</button>
          </div>
        </div>
      )}
      <input ref={globalCameraRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setInitialPhoto(ev.target.result);setShowCapture(true);};r.readAsDataURL(f);e.target.value="";}}/>
      {showCapture&&<PostForm initialData={initialPhoto?{photo:initialPhoto}:{}} userLocation={userLocation} locStatus={locStatus} onSave={handleSave} onClose={()=>{setShowCapture(false);setInitialPhoto(null);}}/>}
      {showCaptureLater&&<PostForm laterMode userLocation={userLocation} locStatus={locStatus} onSave={handleSave} onClose={()=>setShowCaptureLater(false)} title="後から投稿する 🕐"/>}
      <style>{`@keyframes slideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes auraExpand{from{transform:scale(0.3);opacity:0}to{transform:scale(1);opacity:0.3}}.leaflet-container{font-family:${font}!important}.leaflet-control-attribution{font-size:9px!important}.leaflet-top,.leaflet-bottom{z-index:400!important}.leaflet-pane{z-index:300!important}`}</style>
    </div>
  );
}
