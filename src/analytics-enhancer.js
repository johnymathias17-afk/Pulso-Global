const KEY='vetor_global_analytics_v1'
function track(name, data={}){
  const event={name,data,path:location.pathname,ts:new Date().toISOString()}
  try{const current=JSON.parse(localStorage.getItem(KEY)||'[]');current.push(event);localStorage.setItem(KEY,JSON.stringify(current.slice(-200)))}catch{}
  window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:`vetor_${name}`,...data})
}
function run(){
  if(!window.__vetorAnalyticsBound){track('page_view',{page_title:document.title});window.__vetorAnalyticsBound=true}
  document.addEventListener('click',e=>{const el=e.target.closest('a,button');if(!el)return;const text=(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,120);if(!text)return;let type='interaction';if(/diario|newsletter|receber/i.test(text))type='newsletter_cta';else if(/pro/i.test(text))type='pro_interest';else if(/ler|noticia original|abrir/i.test(text))type='article_click';else if(/mercado|bitcoin|ethereum|dolar|ouro|ibovespa/i.test(text))type='market_interest';track(type,{label:text})},{passive:true})
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run()
