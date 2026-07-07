import{H as Ze,z as Je,t as u,q as t}from"./chunk-4N6VE7H7-MeczOpdo.js";import{ad as Xe,a9 as He,L as qe,_ as le,aa as et,I as tt,ae as rt}from"./ThreeViewer-q71IQWiO.js";import{m as it,e as nt,g as Ce,D as ot,a as at}from"./configurator-Bs0Bmczv.js";import"./index-CoSDG3-6.js";const j=560,V=j/800;function ce(p,f,x){var m;return x!=null&&x.has(p.id)?!1:(m=p.conditions)!=null&&m.length?p.conditions.every(w=>f[w.questionId]===w.value):!0}function E(p){const f=p.linkedLayerId,x=p.applyOn??[];return f?[f,...x]:x}const Le=`
  :root {
    --cf-bg: #f4f6fb;
    --cf-surface: #ffffff;
    --cf-border: #e8eaed;
    --cf-border-hover: #c4c9d4;
    --cf-accent: #5c6ac4;
    --cf-accent-dark: #3b4ab0;
    --cf-accent-light: #eef0fb;
    --cf-text: #1a1d23;
    --cf-text-sub: #6b7280;
    --cf-text-muted: #9ca3af;
    --cf-radius-sm: 6px;
    --cf-radius: 10px;
    --cf-radius-lg: 14px;
    --cf-shadow-sm: 0 1px 4px rgba(0,0,0,0.07);
    --cf-shadow: 0 4px 16px rgba(0,0,0,0.10);
    --cf-shadow-lg: 0 8px 32px rgba(0,0,0,0.14);
    --cf-transition: 0.15s ease;
    --cf-swatch-gap: 8px;
    --cf-global-text-color: var(--cf-text-muted);
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; }
  button { font-family: inherit; }
  input, select, textarea { font-family: inherit; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

  /* ── Layout classes ─────────────────── */
  .cf-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 320px 1fr;
    grid-template-rows: minmax(0, 1fr);
    overflow: hidden;
  }
  .cf-sidebar {
    height: 100%;
    border-right: 1px solid var(--cf-border);
    background: var(--cf-surface);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .cf-canvas-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--cf-bg);
    gap: 16px;
    padding: 24px;
    overflow: auto;
  }
  .cf-canvas-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    transform-origin: top center;
  }

  /* ── Mobile: image on top, tabs + options below ── */
  @media (max-width: 680px) {
    .cf-body {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .cf-canvas-area {
      order: 1;
      flex: 0 0 auto;
      height: 46vw;
      min-height: 190px;
      max-height: 46vh;
      padding: 8px;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      background: var(--cf-bg);
    }
    .cf-canvas-wrap { transform-origin: top center; }
    .cf-sidebar {
      order: 2;
      flex: 1;
      min-height: 0;
      border-right: none;
      border-top: 1px solid var(--cf-border);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .cf-mobile-tabs {
      display: flex;
      overflow-x: auto;
      scrollbar-width: none;
      border-bottom: 1px solid var(--cf-border);
      flex-shrink: 0;
      background: var(--cf-surface);
    }
    .cf-mobile-tabs::-webkit-scrollbar { display: none; }
    .cf-tab-btn {
      padding: 11px 14px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 11px;
      white-space: nowrap;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      flex-shrink: 0;
      transition: all 0.15s;
    }
  }

  .cf-swatch {
    transition: transform var(--cf-transition), box-shadow var(--cf-transition);
    cursor: pointer;
  }
  .cf-swatch:hover { transform: scale(1.08); box-shadow: 0 2px 8px rgba(0,0,0,0.18); }

  .cf-thumb-swatch {
    transition: transform var(--cf-transition), border-color var(--cf-transition);
    cursor: pointer;
  }
  .cf-thumb-swatch:hover { transform: scale(1.05); }

  .cf-pill-btn {
    transition: border-color var(--cf-transition), background var(--cf-transition), color var(--cf-transition);
  }
  .cf-pill-btn:hover:not(.active) {
    border-color: var(--cf-border-hover) !important;
    background: #f9fafb !important;
  }

  .cf-radio-label:hover:not(.active) {
    border-color: var(--cf-border-hover) !important;
    background: #f9fafb !important;
  }

  .cf-add-btn {
    background: linear-gradient(135deg, var(--cf-accent) 0%, var(--cf-accent-dark) 100%);
    transition: opacity var(--cf-transition), transform var(--cf-transition), box-shadow var(--cf-transition);
    box-shadow: 0 4px 14px rgba(92,106,196,0.4);
  }
  .cf-add-btn:hover { opacity: 0.93; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(92,106,196,0.5); }
  .cf-add-btn:active { transform: translateY(0); box-shadow: 0 2px 8px rgba(92,106,196,0.3); }

  @media (max-width: 680px) {
    .cf-add-btn {
      background: #111827;
      border-radius: 0 !important;
      box-shadow: none;
      padding: 17px 20px !important;
      font-size: 15px !important;
      letter-spacing: 0.04em;
    }
    .cf-add-btn:hover { box-shadow: none; transform: none; }
  }

  .cf-section-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--cf-global-text-color);
    margin-bottom: 10px;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  .cf-dropdown-menu { animation: fadeIn 0.12s ease; }
`;function st(p,f){const x=p.swatchShape==="circle"?"50%":p.swatchShape==="square"?"4px":"8px",m=p.swatchSize==="sm"?"28px":p.swatchSize==="md"?"36px":"46px",w=p.thumbnailShape==="circle"?"50%":p.thumbnailShape==="square"?"4px":"10px",S=p.thumbnailSize==="sm"?"44px":p.thumbnailSize==="md"?"56px":"70px",R=p.buttonRadius==="pill"?"50px":p.buttonRadius==="square"?"4px":"var(--cf-radius)";return`
    :root {
      --cf-accent: ${p.accentColor};
      --cf-accent-dark: ${ze(p.accentColor,-20)};
      --cf-accent-light: ${ze(p.accentColor,180)}22;
      --cf-swatch-size: ${m};
      --cf-swatch-radius: ${x};
      --cf-thumb-size: ${S};
      --cf-thumb-radius: ${w};
      --cf-btn-radius: ${R};
      --cf-swatch-gap: ${f.spaceBetweenOptions}px;
      --cf-global-text-color: ${f.globalTextColor};
      --cf-opt-pad-top: ${f.marginTop}px;
      --cf-opt-pad-right: ${f.marginRight}px;
      --cf-opt-pad-bottom: ${f.marginBottom}px;
      --cf-opt-pad-left: ${f.marginLeft}px;
      --cf-opt-field-left: ${f.optionFieldLeftMargin}px;
    }
    ${f.disableZoom?".cf-swatch:hover { transform: none !important; }":""}
    ${f.disableShadow?".cf-swatch { box-shadow: none !important; } .cf-thumb-swatch { box-shadow: none !important; }":""}
  `}function ze(p,f){const x=parseInt(p.replace("#",""),16),m=Math.max(0,Math.min(255,(x>>16)+f)),w=Math.max(0,Math.min(255,(x>>8&255)+f)),S=Math.max(0,Math.min(255,(x&255)+f));return"#"+[m,w,S].map(R=>R.toString(16).padStart(2,"0")).join("")}function lt({q:p,selectedVals:f,onToggle:x,onHoverImages:m}){const[w,S]=u.useState(!1),R=p.options.filter(g=>f.includes(g.value)),F=g=>{var k;return g.thumbnailUrl??((k=g.viewImages)==null?void 0:k.find(Boolean))??null};return t.jsxs("div",{style:{position:"relative"},children:[t.jsx("div",{className:"cf-section-label",children:p.name}),t.jsxs("button",{onClick:()=>S(g=>!g),style:{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 12px",border:"1px solid var(--cf-border)",borderRadius:"var(--cf-radius)",background:"var(--cf-surface)",cursor:"pointer",fontSize:13,textAlign:"left",boxShadow:"var(--cf-shadow-sm)",transition:"border-color var(--cf-transition)"},children:[R.length===0?t.jsx("span",{style:{color:"var(--cf-text-muted)",flex:1},children:"Select an option…"}):t.jsx("div",{style:{display:"flex",alignItems:"center",gap:6,flex:1,flexWrap:"wrap"},children:R.map(g=>{const k=F(g);return t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:5},children:[k&&t.jsx("img",{src:k,alt:g.label,style:{width:22,height:22,objectFit:"cover",borderRadius:4,border:"1px solid var(--cf-border)"}}),t.jsx("span",{style:{fontSize:13,color:"var(--cf-text)"},children:g.label})]},g.value)})}),t.jsx("svg",{width:"12",height:"12",viewBox:"0 0 12 12",fill:"none",style:{flexShrink:0,transform:w?"rotate(180deg)":"none",transition:"transform 0.15s"},children:t.jsx("path",{d:"M2 4l4 4 4-4",stroke:"var(--cf-text-muted)",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]}),w&&t.jsx("div",{style:{position:"fixed",inset:0,zIndex:98},onClick:()=>{S(!1),m==null||m(null)}}),w&&t.jsx("div",{className:"cf-dropdown-menu",style:{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:99,background:"var(--cf-surface)",border:"1px solid var(--cf-border)",borderRadius:"var(--cf-radius)",boxShadow:"var(--cf-shadow)",overflow:"hidden",maxHeight:240,overflowY:"auto"},children:p.options.map(g=>{var O;const k=F(g),T=f.includes(g.value),X=(O=g.viewImages)==null?void 0:O.some(Boolean);return t.jsxs("button",{onClick:()=>{x(g.value),p.multipleSelection||S(!1)},onMouseEnter:()=>X?m==null?void 0:m(g.viewImages):void 0,onMouseLeave:()=>m==null?void 0:m(null),style:{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",border:"none",cursor:"pointer",fontSize:13,background:T?"var(--cf-accent-light)":"var(--cf-surface)",textAlign:"left",borderBottom:"1px solid var(--cf-border)",color:T?"var(--cf-accent)":"var(--cf-text)"},children:[k?t.jsx("img",{src:k,alt:g.label,style:{width:36,height:36,objectFit:"cover",borderRadius:6,border:`2px solid ${T?"var(--cf-accent)":"var(--cf-border)"}`,flexShrink:0}}):t.jsx("span",{style:{width:36,height:36,background:"var(--cf-bg)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0},children:"🏔"}),t.jsx("span",{style:{flex:1,fontWeight:T?600:400},children:g.label}),T&&t.jsx("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",children:t.jsx("path",{d:"M2.5 7l3.5 3.5 5.5-6",stroke:"var(--cf-accent)",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})})]},g.value)})})]})}const xt=Ze(function(){var je,ke,Se;const{config:f,productName:x,configuratorStyle:m,modelMode:w,glbUrl:S,appSettings:R}=Je(),F={...ot,...R??{}},g={...at,swatchShape:F.swatchShape,swatchSize:F.swatchSize,...m??{}},k=st(g,F),[T,X]=u.useState(!1);u.useEffect(()=>{X(!0),window.parent.postMessage({type:"configurator:ready"},"*")},[]);const O=u.useRef(null),G=u.useRef(null),[H]=u.useState({}),q=u.useRef(null),[de,Re]=u.useState(1),N=(f==null?void 0:f.layers)??[],v=it(f==null?void 0:f.options,N),Te=((je=f==null?void 0:f.options)==null?void 0:je.logicRules)??[],L=((ke=f==null?void 0:f.options)==null?void 0:ke.numViews)??1,[y,D]=u.useState(0),[b,I]=u.useState(()=>{var n,r;const e={};for(const i of v){if(i.type==="thumbnail"&&i.displayType==="image"&&i.swatches.length>0&&(e[i.id]=i.swatches[0].value),i.type==="dropdown"&&i.defaultValue&&(e[i.id]=i.defaultValue),i.type==="radio"){const o=i.defaultValue||((n=i.options[0])==null?void 0:n.value);o&&(e[i.id]=o)}i.type==="checkbox"&&(e[i.id]=i.defaultChecked?"true":"false"),i.type==="label"&&((r=i.answers)!=null&&r.length)&&(e[i.id]=i.answers[0].value),i.type==="color"&&i.swatches.length>0&&(e[i.id]=i.swatches[0].value)}return e}),[Y,ee]=u.useState({}),[Me,fe]=u.useState(()=>{var n;const e={};for(const r of v){if(r.type!=="thumbnail"||r.displayType!=="image")continue;const i=E(r);if(!i.length||!r.swatches.length)continue;const o=r.swatches[0];if((n=o.viewImages)!=null&&n.length)for(const a of i)e[a]=o.viewImages.map(s=>s||"")}return e}),[Be,M]=u.useState(()=>{var n,r,i;const e={};for(const o of v){if(o.type==="dropdown"&&o.displayType==="image"){const a=o,s=a.defaultValue;if(!s)continue;const l=a.options.find(c=>c.value===s);(n=l==null?void 0:l.viewImages)!=null&&n.some(Boolean)&&(e[o.id]=l.viewImages)}if(o.type==="label"&&((r=o.answers)!=null&&r.length)){const a=o.answers[0];(i=a.viewImages)!=null&&i.some(Boolean)?e[o.id]=a.viewImages:a.imageUrl&&(e[o.id]=[a.imageUrl])}}return e}),[pe,te]=u.useState(null),[Q,re]=u.useState(()=>{var n;const e={};for(const r of v)if((r.type==="color"||r.type==="thumbnail")&&r.swatches.length>0){if(r.type==="thumbnail"&&r.displayType==="image"&&((n=r.swatches[0].viewImages)==null?void 0:n.some(Boolean)))continue;const o=r.swatches[0];if(!o.imageUrl)continue;const s=E(r).filter(l=>!v.some(c=>c.id===l&&c.type==="text"));for(const l of s)e[l]=o.imageUrl}return e}),[P,ue]=u.useState(()=>{const e={};for(const n of v)n.type==="text"&&(e[n.id]="");return e}),[he,xe]=u.useState(()=>{var n;const e={};for(const r of v)if((r.type==="color"||r.type==="thumbnail")&&r.swatches.length>0){if(r.type==="thumbnail"&&r.displayType==="image"&&((n=r.swatches[0].viewImages)==null?void 0:n.some(Boolean)))continue;const o=E(r);for(const a of o)v.some(s=>s.id===a&&s.type==="text")&&(e[a]=r.swatches[0].value)}return e}),[ge,Ae]=u.useState(()=>{const e={};for(const n of v)n.type==="text"&&(e[n.id]=n.defaultFontSize);return e}),[be,Ve]=u.useState(()=>{const e={};for(const n of v)n.type==="text"&&(e[n.id]=n.defaultFontFamily);return e}),[W,Fe]=u.useState({}),[ie,_]=u.useState(null),[We,ve]=u.useState([]),Ue=u.useMemo(()=>{const e=new Set(N.filter(r=>r.type==="glb-part").map(r=>r.id)),n={};for(const[r,i]of Object.entries(Y))e.has(r)&&(n[r]={...n[r],color:i});for(const[r,i]of Object.entries(Q))e.has(r)&&(n[r]={...n[r],textureUrl:i});return n},[N,Y,Q]),me=v.filter(e=>e.type==="group"),[$e,Ee]=u.useState(me.length>0?me[0].id:null),[U,Oe]=u.useState(!1),[Ne,De]=u.useState(null);u.useEffect(()=>{const e=()=>Oe(window.innerWidth<=680);return e(),window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)},[]),u.useEffect(()=>{const e=n=>{var i;if(!n.data||n.data.type!=="configurator:load-selections")return;const r=n.data.selections;if(r){if(r.selectedAnswers){I(r.selectedAnswers);const o={},a={};for(const s of v)if(s.type==="color"||s.type==="thumbnail"){const l=E(s);if(!l.length)continue;const c=r.selectedAnswers[s.id];if(c){const d=(i=s.swatches)==null?void 0:i.find(h=>h.value===c);for(const h of l)d!=null&&d.imageUrl&&(a[h]=d.imageUrl),o[h]=c}}Object.keys(o).length&&ee(s=>({...s,...o})),Object.keys(a).length&&re(s=>({...s,...a}))}r.textValues&&ue(r.textValues),r.textColors&&xe(r.textColors),r.textSizes&&Ae(r.textSizes),r.textFonts&&Ve(r.textFonts)}};return window.addEventListener("message",e),()=>window.removeEventListener("message",e)},[v]),u.useEffect(()=>{var n;if(!G.current)return;const e=ie?H[ie]:null;G.current.nodes(e?[e]:[]),(n=G.current.getLayer())==null||n.batchDraw()},[ie,H]),u.useEffect(()=>{if(!q.current)return;const e=new ResizeObserver(n=>{const{width:r,height:i}=n[0].contentRect,o=Math.min(r-48,i-56);Re(Math.min(1,Math.max(.3,o/j)))});return e.observe(q.current),()=>e.disconnect()},[]);const Pe=(e,n)=>{const r=v.find(a=>a.id===e),i=r==null?void 0:r.printAreas;if(i!=null&&i.length){const a=i[0].visibleViews[0];a&&D(Math.min(a-1,L-1))}const o=new FileReader;o.onload=()=>{const a=new window.Image;a.src=o.result,a.onload=()=>Fe({[e]:a})},o.readAsDataURL(n)},ye=(e,n,r)=>{I(a=>({...a,[e.id]:n}));const i=E(e);if(!i.length)return;if((e.displayType??"color")==="image"){const a=e.swatches.find(l=>l.value===n),s=((a==null?void 0:a.viewImages)??[]).map(l=>l||"");fe(l=>{const c={...l};for(const d of i)c[d]=s;return c}),ee(l=>{const c={...l};for(const d of i)delete c[d];return c}),re(l=>{const c={...l};for(const d of i)delete c[d];return c})}else{const a=i.filter(l=>v.some(c=>c.id===l&&c.type==="text")),s=i.filter(l=>!a.includes(l));a.length>0&&xe(l=>{const c={...l};for(const d of a)c[d]=n;return c}),fe(l=>{const c={...l};for(const d of s)delete c[d];return c}),ee(l=>{const c={...l};for(const d of s)c[d]=n;return c}),re(l=>{const c={...l};for(const d of s)r?c[d]=r:delete c[d];return c})}},_e=()=>{var i;const e={},n={};for(const o of v)if(o.type==="group")for(const a of o.childIds)n[a]=o.name;const r=o=>{const a=n[o.id];return a?`${a} - ${o.name}`:o.name};for(const o of v)if(ce(o,b,ne)){if(o.type==="color"||o.type==="thumbnail"){const a=b[o.id]||((i=o.swatches[0])==null?void 0:i.value);if(a){const s=o.swatches.find(l=>l.value===a);e[r(o)]=s?s.label:a}}else if(o.type==="text"){const a=P[o.id];a&&(e[r(o)]=a)}else if(o.type==="dropdown"){const a=o;if(a.multipleSelection){const s=(b[o.id]??"").split(",").filter(Boolean);if(s.length>0){const l=s.map(c=>{var d;return((d=a.options.find(h=>h.value===c))==null?void 0:d.label)??c});e[r(o)]=l.join(", ")}}else{const s=b[o.id];if(s){const l=a.options.find(c=>c.value===s);e[r(o)]=l?l.label:s}}}else if(o.type==="radio"){const a=b[o.id];if(a){const s=o.options.find(l=>l.value===a);e[r(o)]=s?s.label:a}}else if(o.type==="checkbox")e[r(o)]=b[o.id]==="true"?o.checkedLabel:o.uncheckedLabel;else if(o.type==="label"&&(o.answers??[]).length>0){const a=(b[o.id]??"").split(",").filter(Boolean);if(a.length>0){const s=a.map(l=>{var c;return((c=o.answers.find(d=>d.value===l))==null?void 0:c.label)??l});e[r(o)]=s.join(", ")}}}_(null),setTimeout(async()=>{var s;const o=(s=O.current)==null?void 0:s.toDataURL({pixelRatio:2});let a="";if(o)try{const c=await(await fetch("/upload-preview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({dataUrl:o})})).json();c.url&&(a=window.location.origin+c.url,e["Preview Image"]=a,e._preview=a)}catch{}window.parent.postMessage({type:"configurator:add-to-cart",properties:e,previewDataUrl:o,previewUrl:a,cartAction:F.cartAction,rawSelections:{selectedAnswers:b,textValues:P,textColors:he,textSizes:ge,textFonts:be}},"*")},80)},{hiddenQuestions:ne}=nt(Te,b),B=v.filter(e=>{var n,r;return!(!ce(e,b,ne)||(e.type==="radio"||e.type==="dropdown")&&!((n=e.options)!=null&&n.length)||(e.type==="color"||e.type==="thumbnail")&&!((r=e.swatches)!=null&&r.length))}),Ge=B.filter(e=>e.type==="text"&&e.displayType!=="none"),Ye=B.filter(e=>e.type==="file"),Qe=Object.fromEntries(v.map(e=>[e.id,e])),we=v.filter(e=>e.type==="group"),Ke=new Set(we.flatMap(e=>e.childIds)),oe=we.filter(e=>ce(e,b,ne)).map(e=>({group:e,children:e.childIds.map(n=>Qe[n]).filter(n=>!!n&&B.includes(n))})).filter(e=>e.children.length>0),ae=B.filter(e=>e.type!=="group"&&!Ke.has(e.id)),K=oe.length>0,se=K?oe.map(e=>({id:e.group.id,label:e.group.name})):ae.map(e=>({id:e.id,label:e.name})),$=Ne??((Se=se[0])==null?void 0:Se.id)??null;if(!f)return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:Le+k}),t.jsx("div",{style:{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--cf-bg)"},children:t.jsxs("div",{style:{textAlign:"center",padding:32},children:[t.jsx("div",{style:{fontSize:48,marginBottom:16},children:"🎨"}),t.jsx("p",{style:{color:"var(--cf-text-sub)",fontSize:15,fontWeight:500},children:"Configurator not set up for this product yet."})]})})]});const Z=(e,n)=>{if(e.type==="label"){const r=e.answers??[];if(r.length>0){const i=(b[e.id]??"").split(",").filter(Boolean),o=a=>{var s,l;if(e.multipleSelection){const c=i.includes(a)?i.filter(d=>d!==a):[...i,a];I(d=>({...d,[e.id]:c.join(",")}))}else{const c=i[0]===a?"":a;if(I(d=>({...d,[e.id]:c})),c){const d=(s=e.answers)==null?void 0:s.find(h=>h.value===c);(l=d==null?void 0:d.viewImages)!=null&&l.some(Boolean)?M(h=>({...h,[e.id]:d.viewImages})):d!=null&&d.imageUrl?M(h=>({...h,[e.id]:[d.imageUrl]})):M(h=>{const A={...h};return delete A[e.id],A})}else M(d=>{const h={...d};return delete h[e.id],h})}};return t.jsx(C,{label:e.name,isFirst:n===0,children:t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8},children:r.map(a=>{var c;const s=i.includes(a.value),l=(c=a.viewImages)==null?void 0:c.some(Boolean);return t.jsxs("button",{className:`cf-pill-btn${s?" active":""}`,onClick:()=>o(a.value),onMouseEnter:()=>l?te(a.viewImages):void 0,onMouseLeave:()=>te(null),style:ct(g.choiceStyle,s),children:[a.imageUrl&&t.jsx("img",{src:a.imageUrl,alt:a.label,style:{width:20,height:20,borderRadius:3,objectFit:"cover"}}),a.label]},a.value)})})},e.id)}return t.jsx(C,{label:e.name,isFirst:n===0,children:e.content&&t.jsx("p",{style:{fontSize:13,color:"var(--cf-text-sub)",lineHeight:1.6},children:e.content})},e.id)}if(e.type==="color"){const r=b[e.id];return t.jsx(C,{label:e.name,isFirst:n===0,children:t.jsx("div",{style:{display:"flex",gap:"var(--cf-swatch-gap)",flexWrap:"wrap"},children:e.swatches.map(i=>{const o=r===i.value;return t.jsx("button",{title:i.label,className:"cf-swatch",onClick:()=>ye(e,i.value,i.imageUrl),onMouseEnter:()=>{w&&ve(E(e))},onMouseLeave:()=>{w&&ve([])},style:{width:"var(--cf-swatch-size)",height:"var(--cf-swatch-size)",borderRadius:i.imageUrl?"var(--cf-swatch-radius, 8px)":"var(--cf-swatch-radius)",background:i.imageUrl?"none":i.value,backgroundImage:i.imageUrl?`url(${i.imageUrl})`:"none",backgroundSize:"cover",border:o?"3px solid var(--cf-accent)":"2px solid var(--cf-border)",outline:o?"3px solid var(--cf-accent-light)":"none",outlineOffset:1,cursor:"pointer",padding:0,overflow:"hidden",flexShrink:0}},i.value)})})},e.id)}if(e.type==="thumbnail"){const r=b[e.id];return t.jsx(C,{label:e.name,isFirst:n===0,children:t.jsx("div",{style:{display:"flex",gap:"var(--cf-swatch-gap)",flexWrap:"wrap"},children:e.swatches.map(i=>{const o=r===i.value;return t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:3},children:[t.jsx("button",{title:i.label,className:"cf-thumb-swatch",onClick:()=>ye(e,i.value,i.imageUrl),style:{width:"var(--cf-thumb-size)",height:"var(--cf-thumb-size)",borderRadius:"var(--cf-thumb-radius)",overflow:"hidden",padding:0,cursor:"pointer",border:o?"3px solid var(--cf-accent)":"2px solid var(--cf-border)",outline:o?"3px solid var(--cf-accent-light)":"none",outlineOffset:1,background:i.imageUrl?"none":i.value,boxShadow:o?"0 2px 8px var(--cf-accent-light)":"var(--cf-shadow-sm)",flexShrink:0},children:i.imageUrl?t.jsx("img",{src:i.imageUrl,alt:i.label,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}}):t.jsx("span",{style:{display:"block",width:"100%",height:"100%",background:i.value}})}),g.showLabels&&t.jsx("span",{style:{fontSize:10,color:o?"var(--cf-accent)":"var(--cf-text-muted)",textAlign:"center",maxWidth:"var(--cf-thumb-size)",display:"block",wordBreak:"break-word",fontWeight:o?600:400},children:i.label})]},i.value)})})},e.id)}if(e.type==="dropdown"){const r=e,i=r.displayType==="image",o=r.multipleSelection?(b[e.id]??"").split(",").filter(Boolean):[b[e.id]??""].filter(Boolean),a=s=>{var l,c;if(r.multipleSelection){const d=(b[e.id]??"").split(",").filter(Boolean),h=d.includes(s),A=h?d.filter(z=>z!==s):[...d,s];I(z=>({...z,[e.id]:A.join(",")}));const J=r.options.find(z=>z.value===s);!h&&((l=J==null?void 0:J.viewImages)!=null&&l.some(Boolean))?M(z=>({...z,[e.id]:J.viewImages})):h&&A.length===0&&M(z=>{const Ie={...z};return delete Ie[e.id],Ie})}else{I(h=>({...h,[e.id]:s}));const d=r.options.find(h=>h.value===s);(c=d==null?void 0:d.viewImages)!=null&&c.some(Boolean)?M(h=>({...h,[e.id]:d.viewImages})):M(h=>{const A={...h};return delete A[e.id],A})}};return i?t.jsx(C,{label:"",isFirst:n===0,children:t.jsx(lt,{q:r,selectedVals:o,onToggle:a,onHoverImages:te})},e.id):t.jsx(C,{label:e.name,isFirst:n===0,children:t.jsxs("div",{style:{position:"relative"},children:[t.jsxs("select",{value:b[e.id]||"",onChange:s=>I(l=>({...l,[e.id]:s.target.value})),style:{width:"100%",padding:"10px 36px 10px 12px",border:"1.5px solid var(--cf-border)",borderRadius:"var(--cf-radius)",fontSize:13,appearance:"none",background:"var(--cf-surface)",color:"var(--cf-text)",cursor:"pointer",boxShadow:"var(--cf-shadow-sm)",outline:"none"},children:[t.jsx("option",{value:"",children:"Select an option…"}),(e.options??[]).map(s=>t.jsx("option",{value:s.value,children:s.label},s.value))]}),t.jsx("svg",{width:"12",height:"12",viewBox:"0 0 12 12",fill:"none",style:{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"},children:t.jsx("path",{d:"M2 4l4 4 4-4",stroke:"var(--cf-text-muted)",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]})},e.id)}if(e.type==="radio")return t.jsx(C,{label:e.name,isFirst:n===0,children:t.jsx("div",{style:{display:"flex",flexDirection:"column",gap:8},children:(e.options??[]).map(r=>{const i=b[e.id]===r.value;return t.jsxs("label",{className:`cf-radio-label${i?" active":""}`,style:dt(g.choiceStyle,i),children:[g.choiceStyle!=="pill"&&t.jsx("div",{style:{width:18,height:18,borderRadius:"50%",flexShrink:0,border:`2px solid ${i?"var(--cf-accent)":"var(--cf-border)"}`,background:i?"var(--cf-accent)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all var(--cf-transition)"},children:i&&t.jsx("div",{style:{width:6,height:6,borderRadius:"50%",background:"#fff"}})}),t.jsx("input",{type:"radio",name:e.id,value:r.value,checked:i,onChange:()=>I(o=>({...o,[e.id]:r.value})),style:{display:"none"}}),t.jsx("span",{style:{fontSize:13,fontWeight:i?600:400,color:i?"var(--cf-accent)":"var(--cf-text)"},children:r.label})]},r.value)})})},e.id);if(e.type==="checkbox")return t.jsx(C,{label:"",isFirst:n===0,children:t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 12px",borderRadius:"var(--cf-radius)",border:"1.5px solid var(--cf-border)",background:"var(--cf-surface)",boxShadow:"var(--cf-shadow-sm)"},children:[t.jsx("div",{onClick:()=>I(r=>({...r,[e.id]:r[e.id]==="true"?"false":"true"})),style:{width:20,height:20,borderRadius:5,flexShrink:0,border:`2px solid ${b[e.id]==="true"?"var(--cf-accent)":"var(--cf-border)"}`,background:b[e.id]==="true"?"var(--cf-accent)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all var(--cf-transition)"},children:b[e.id]==="true"&&t.jsx("svg",{width:"10",height:"10",viewBox:"0 0 10 10",fill:"none",children:t.jsx("path",{d:"M1.5 5l2.5 2.5 5-5",stroke:"#fff",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})}),t.jsx("input",{type:"checkbox",checked:b[e.id]==="true",onChange:r=>I(i=>({...i,[e.id]:r.target.checked?"true":"false"})),style:{display:"none"}}),t.jsx("span",{style:{fontSize:13,fontWeight:500,color:"var(--cf-text)"},children:b[e.id]==="true"?e.checkedLabel:e.uncheckedLabel})]})},e.id);if(e.type==="text"){const r=e.maxChars??15,i=(P[e.id]??e.defaultText??"").length,o=i>=r,a=e.printArea;return t.jsx(C,{label:e.name,isFirst:n===0,children:t.jsxs("div",{style:{position:"relative"},children:[t.jsx("textarea",{value:P[e.id]??e.defaultText,onChange:s=>ue(l=>({...l,[e.id]:s.target.value})),placeholder:e.defaultText||"Enter text…",maxLength:r,rows:3,style:{width:"100%",padding:"10px 12px",border:"1.5px solid var(--cf-border)",borderRadius:"var(--cf-radius)",fontSize:13,boxSizing:"border-box",background:"var(--cf-surface)",color:"var(--cf-text)",outline:"none",boxShadow:"var(--cf-shadow-sm)",transition:"border-color var(--cf-transition)",resize:"vertical",fontFamily:"inherit",lineHeight:1.5},onFocus:s=>{var l;s.target.style.borderColor="var(--cf-accent)",((l=a==null?void 0:a.visibleViews)==null?void 0:l.length)>0&&D(Math.min(a.visibleViews[0]-1,L-1))},onBlur:s=>s.target.style.borderColor="var(--cf-border)"}),t.jsxs("span",{style:{position:"absolute",bottom:6,right:8,fontSize:11,color:o?"#ef4444":"var(--cf-text-muted)",fontWeight:o?600:400,pointerEvents:"none"},children:[i,"/",r]})]})},e.id)}return e.type==="file"?t.jsx(C,{label:e.name,isFirst:n===0,children:t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:10,padding:"12px",border:`2px dashed ${W[e.id]?"var(--cf-accent)":"var(--cf-border)"}`,borderRadius:"var(--cf-radius)",cursor:"pointer",background:W[e.id]?"var(--cf-accent-light)":"var(--cf-bg)",color:W[e.id]?"var(--cf-accent)":"var(--cf-text-sub)",fontSize:13,fontWeight:500,transition:"all var(--cf-transition)"},children:[t.jsx("div",{style:{width:36,height:36,borderRadius:8,background:W[e.id]?"var(--cf-accent)":"var(--cf-border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},children:t.jsx("svg",{width:"16",height:"16",viewBox:"0 0 16 16",fill:"none",children:t.jsx("path",{d:"M8 2v8M5 5l3-3 3 3M3 12h10",stroke:W[e.id]?"#fff":"var(--cf-text-sub)",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})}),t.jsx("span",{children:W[e.id]?"Image uploaded — change":"Upload your image"}),t.jsx("input",{type:"file",accept:"image/*",style:{display:"none"},onChange:r=>{var o;const i=(o=r.target.files)==null?void 0:o[0];i&&Pe(e.id,i)}})]})},e.id):null};return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:Le+k}),t.jsxs("div",{style:{position:"fixed",inset:0,display:"flex",flexDirection:"column",background:"var(--cf-bg)",overflow:"hidden"},children:[t.jsxs("div",{style:{padding:"0 20px",borderBottom:"1px solid var(--cf-border)",background:"linear-gradient(135deg, #f8f9ff 0%, var(--cf-surface) 100%)",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,flexShrink:0,boxShadow:"var(--cf-shadow-sm)"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[t.jsx("div",{style:{width:32,height:32,background:"linear-gradient(135deg, var(--cf-accent) 0%, var(--cf-accent-dark) 100%)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 6px rgba(92,106,196,0.35)",flexShrink:0},children:t.jsxs("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"white",strokeWidth:"2.2",children:[t.jsx("circle",{cx:"13.5",cy:"6.5",r:"2.5"}),t.jsx("path",{d:"M14.622 17.897L19.5 12.5 20 7l-5.5.5-4.897 4.878M8.891 12.84 4.5 17.5l-1 3.5 3.5-1 4.66-4.391"})]})}),t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:14,fontWeight:700,color:"var(--cf-text)",letterSpacing:"-0.01em",lineHeight:1.2},children:x}),t.jsx("div",{style:{fontSize:10,color:"var(--cf-text-muted)",fontWeight:500,marginTop:1},children:"Personalise your product"})]})]}),t.jsx("button",{onClick:()=>window.parent.postMessage({type:"configurator:close"},"*"),"aria-label":"Close configurator",style:{width:32,height:32,border:"1.5px solid var(--cf-border)",borderRadius:"50%",background:"var(--cf-surface)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background var(--cf-transition), border-color var(--cf-transition)"},onMouseEnter:e=>{e.currentTarget.style.background="#f3f4f6",e.currentTarget.style.borderColor="var(--cf-border-hover)"},onMouseLeave:e=>{e.currentTarget.style.background="var(--cf-surface)",e.currentTarget.style.borderColor="var(--cf-border)"},children:t.jsx("svg",{width:"12",height:"12",viewBox:"0 0 12 12",fill:"none",children:t.jsx("path",{d:"M1 1l10 10M11 1L1 11",stroke:"var(--cf-text)",strokeWidth:"1.8",strokeLinecap:"round"})})})]}),t.jsxs("div",{className:"cf-body",children:[t.jsxs("div",{className:"cf-sidebar",children:[U&&se.length>0&&t.jsx("div",{className:"cf-mobile-tabs",children:se.map(e=>t.jsx("button",{className:"cf-tab-btn",onClick:()=>De(e.id),style:{fontWeight:$===e.id?700:500,color:$===e.id?"var(--cf-accent)":"var(--cf-text-sub)",borderBottom:$===e.id?"2px solid var(--cf-accent)":"2px solid transparent"},children:e.label},e.id))}),t.jsxs("div",{style:{flex:1,minHeight:0,overflowY:"auto",padding:K?"0":"16px 16px 8px"},children:[B.length===0&&t.jsx("div",{style:{textAlign:"center",padding:"40px 0",color:"var(--cf-text-muted)"},children:t.jsx("p",{style:{fontSize:13},children:"No options configured."})}),K&&t.jsxs("div",{children:[oe.map(e=>{if(U)return $!==e.group.id?null:t.jsx("div",{style:{padding:"8px 16px 16px"},children:e.children.map((r,i)=>Z(r,i))},e.group.id);const n=$e===e.group.id;return t.jsxs("div",{style:{borderBottom:"1px solid var(--cf-border)"},children:[t.jsxs("button",{onClick:()=>Ee(n?null:e.group.id),style:{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",border:"none",background:n?"var(--cf-accent-light)":"var(--cf-surface)",cursor:"pointer",textAlign:"left",transition:"background var(--cf-transition)"},children:[t.jsx("span",{style:{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:n?"var(--cf-accent)":"var(--cf-text)"},children:e.group.name}),t.jsx("svg",{width:"12",height:"12",viewBox:"0 0 12 12",fill:"none",style:{transform:n?"rotate(180deg)":"none",transition:"transform 0.2s ease",flexShrink:0},children:t.jsx("path",{d:"M2 4l4 4 4-4",stroke:n?"var(--cf-accent)":"var(--cf-text-muted)",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round"})})]}),n&&t.jsx("div",{style:{padding:"8px 16px 16px",background:"var(--cf-surface)"},children:e.children.map((r,i)=>Z(r,i))})]},e.group.id)}),ae.length>0&&t.jsx("div",{style:{padding:"8px 16px 16px"},children:ae.map((e,n)=>Z(e,n))})]}),!K&&B.filter(e=>!U||!$||$===e.id).map((e,n)=>Z(e,n))]}),t.jsx("div",{style:{padding:U?"0":"14px 16px 16px",borderTop:U?"none":"1px solid var(--cf-border)",background:U?"transparent":"linear-gradient(180deg, var(--cf-surface) 0%, #f8f9ff 100%)",flexShrink:0},children:t.jsxs("button",{onClick:_e,className:"cf-add-btn",style:{width:"100%",padding:"15px 20px",color:"#fff",border:"none",borderRadius:"var(--cf-btn-radius, var(--cf-radius))",fontWeight:700,fontSize:14,cursor:"pointer",letterSpacing:"0.02em",display:"flex",alignItems:"center",justifyContent:"center",gap:9},children:[t.jsxs("svg",{width:"17",height:"17",viewBox:"0 0 16 16",fill:"none",children:[t.jsx("path",{d:"M1 1h2l2 8h7l1.5-5H5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"}),t.jsx("circle",{cx:"8",cy:"13.5",r:"1.5",fill:"currentColor"}),t.jsx("circle",{cx:"12",cy:"13.5",r:"1.5",fill:"currentColor"})]}),"Add to Cart"]})})]}),t.jsx("div",{ref:q,className:"cf-canvas-area",children:t.jsxs("div",{className:"cf-canvas-wrap",style:{transform:`scale(${de})`,marginBottom:-(j*(1-de))},children:[t.jsx("div",{onClick:e=>{e.target===e.currentTarget&&_(null)},style:{position:"relative"},children:T&&w&&S?t.jsx(Xe,{glbUrl:S,parts:N.filter(e=>e.type==="glb-part"),customizations:Ue,width:j,height:j,hoveredPartIds:We}):T&&t.jsx(He,{width:j,height:j,ref:O,onMouseDown:e=>{e.target===e.target.getStage()&&_(null)},style:{boxShadow:"0 12px 48px rgba(0,0,0,0.13), 0 2px 10px rgba(0,0,0,0.07)",borderRadius:14,background:"#fff",display:"block"},children:t.jsxs(qe,{children:[N.map(e=>{if(e.type==="glb-part")return null;const n=Me[e.id];let r;if(n){const i=n[y],o=Ce(e,y);r=i!=null&&i!==""?i:o||n.find(a=>a!==""&&a!=null)||""}else r=Ce(e,y);return t.jsx(le,{src:r,color:Y[e.id],textureUrl:Q[e.id],width:j,height:j},e.id)}),pe?(()=>{const e=pe[y]||"";return e?t.jsx(le,{src:e,width:j,height:j},"hover-bg"):null})():Object.entries(Be).filter(([e])=>B.some(n=>n.id===e)).map(([e,n])=>{const r=n[y]||"",i=B.some(o=>(o.type==="color"||o.type==="thumbnail")&&(o.applyOn??[]).includes(e));return r?t.jsx(le,{src:r,color:i?Y[e]:void 0,textureUrl:i?Q[e]:void 0,width:j,height:j},`q-bg-${e}`):null}),Ge.filter(e=>{const n=e.printArea;return!n||n.visibleViews.includes(y+1)}).map(e=>{const n=e.printArea;return t.jsx(et,{ref:r=>{r&&(H[e.id]=r)},text:P[e.id]??e.defaultText,x:((n==null?void 0:n.x)??e.position.x)*V,y:((n==null?void 0:n.y)??e.position.y)*V,rotation:(n==null?void 0:n.rotation)??e.rotation??0,width:n?n.width*V:void 0,fontSize:(ge[e.id]??e.defaultFontSize)*V,fontFamily:be[e.id]??e.defaultFontFamily,fill:he[e.id]??e.defaultColor,wrap:"word",draggable:!0,onClick:()=>_(e.id),onTap:()=>_(e.id)},e.id)}),Ye.filter(e=>{const n=e.printAreas;return!n||n.length===0?!0:n.some(r=>r.visibleViews.includes(y+1))}).map(e=>{var r,i;const n=W[e.id];return n?t.jsx(tt,{image:n,x:(((r=e.position)==null?void 0:r.x)??100)*V,y:(((i=e.position)==null?void 0:i.y)??100)*V,width:(e.defaultWidth??120)*V,height:(e.defaultHeight??120)*V,listening:!1},e.id):null}),t.jsx(rt,{ref:G,rotateEnabled:!0})]})})}),L>1&&t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12,background:"var(--cf-surface)",borderRadius:32,padding:"8px 14px",boxShadow:"var(--cf-shadow-sm)",border:"1px solid var(--cf-border)"},children:[t.jsx("button",{onClick:()=>D(e=>Math.max(0,e-1)),disabled:y===0,style:{width:30,height:30,borderRadius:"50%",border:`1.5px solid ${y===0?"var(--cf-border)":"var(--cf-border-hover)"}`,background:"transparent",cursor:y===0?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:y===0?.35:1,transition:"opacity var(--cf-transition)"},"aria-label":"Previous view",children:t.jsx("svg",{width:"12",height:"12",viewBox:"0 0 12 12",fill:"none",children:t.jsx("path",{d:"M8 2L4 6l4 4",stroke:"var(--cf-text)",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round"})})}),t.jsx("div",{style:{display:"flex",gap:6,alignItems:"center"},children:Array.from({length:L}).map((e,n)=>t.jsx("button",{onClick:()=>D(n),style:{width:n===y?24:8,height:8,borderRadius:4,background:n===y?"var(--cf-accent)":"var(--cf-border)",border:"none",cursor:"pointer",padding:0,transition:"width 0.2s ease, background 0.15s"},title:`View ${n+1}`},n))}),t.jsx("button",{onClick:()=>D(e=>Math.min(L-1,e+1)),disabled:y===L-1,style:{width:30,height:30,borderRadius:"50%",border:`1.5px solid ${y===L-1?"var(--cf-border)":"var(--cf-border-hover)"}`,background:"transparent",cursor:y===L-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:y===L-1?.35:1,transition:"opacity var(--cf-transition)"},"aria-label":"Next view",children:t.jsx("svg",{width:"12",height:"12",viewBox:"0 0 12 12",fill:"none",children:t.jsx("path",{d:"M4 2l4 4-4 4",stroke:"var(--cf-text)",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round"})})})]})]})})]})]})]})});function ct(p,f){const x={display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,fontWeight:f?600:500,color:f?"var(--cf-accent)":"var(--cf-text)",border:f?"2px solid var(--cf-accent)":"1.5px solid var(--cf-border)",background:f?"var(--cf-accent-light)":"var(--cf-surface)",transition:"all var(--cf-transition)"};return p==="pill"?{...x,padding:"8px 18px",borderRadius:20}:p==="card"?{...x,padding:"10px 16px",borderRadius:"var(--cf-radius)",width:"100%"}:{...x,padding:"9px 14px",borderRadius:"var(--cf-radius-sm)"}}function dt(p,f){const x={display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:f?"var(--cf-accent)":"var(--cf-text)",border:f?"2px solid var(--cf-accent)":"1.5px solid var(--cf-border)",background:f?"var(--cf-accent-light)":"var(--cf-surface)",transition:"all var(--cf-transition)"};return p==="pill"?{...x,padding:"8px 18px",borderRadius:20,display:"inline-flex",width:"auto"}:p==="card"?{...x,padding:"10px 16px",borderRadius:"var(--cf-radius)"}:{...x,padding:"9px 12px",borderRadius:"var(--cf-radius)"}}function C({label:p,children:f,isFirst:x}){return t.jsxs("div",{style:{paddingTop:x?4:18,paddingBottom:4,paddingLeft:"var(--cf-opt-field-left, 0px)",marginTop:"var(--cf-opt-pad-top, 0px)",marginBottom:"var(--cf-opt-pad-bottom, 0px)"},children:[p&&t.jsx("div",{className:"cf-section-label",children:p}),f]})}export{xt as default};
