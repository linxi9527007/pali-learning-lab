/* Pāli Learning Lab · 1.0 重建清爽版
   纯 HTML/CSS/JS；无构建、无 service worker；GitHub Pages 可直接部署。
*/
const VERSION = '1.0 重建清爽版';
const FILE = {
  grammarIndex: 'grammar-index.json',
  manifest: 'grammar-lesson-manifest.json',
  moduleIndex: 'module-index.json',
  exercise: 'exercise-index.json',
  search: 'search-index.json',
  routes: ['learning-routes-data.js','LEARNING_ROUTES'],
  terminology: ['terminology-glossary-data.js','TERMINOLOGY_GLOSSARY'],
  sentence: ['sentence-analysis-data.js','SENTENCE_ANALYSIS_DATA'],
  patterns: ['sentence-patterns-data.js','SENTENCE_PATTERNS'],
  confusion: ['confusion-pairs-data.js','CONFUSION_PAIRS'],
  dictionary: ['dictionary-sites-data.js','PALI_DICTIONARY_SITES'],
  token: ['token-analysis-data.js','TOKEN_ANALYSIS_DATA'],
  buddhistReading: ['buddhist-reading-data.js','BUDDHIST_READING_PATTERNS'],
  buddhistBackground: ['buddhist-background-data.js','BUDDHIST_BACKGROUND_DATA'],
  academic: ['academic-training-data.js','ACADEMIC_TRAINING_DATA'],
  moduleGuides: ['module-guides-data.js','MODULE_GUIDES'],
  linguistics: ['linguistics-tips-data.js','LINGUISTICS_TIPS']
};
const LESSON_STATUS_KEY='pll_lesson_status_v1';
const WRONG_KEY='pll_wrong_exercises_v1';
const SENT_STATUS_KEY='pll_sentence_status_v1';
const HISTORY_KEY='pll_lookup_history_v1';
const app = document.getElementById('app');
const cache = new Map();
let currentPage='home';
let currentLessonId=null;
let currentModule='';
let navStack=[];

function $(sel,root=document){return root.querySelector(sel)}
function $all(sel,root=document){return [...root.querySelectorAll(sel)]}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function text(s){return esc(String(s??''))}
function normalizeId(x){return String(x)}
function setLoading(){app.innerHTML='<div class="card loading">正在加载，请稍候……</div>'}
function showError(e){console.error(e);app.innerHTML=`<div class="error">页面加载失败。请确认相关文件已上传到根目录。<br>${esc(e.message||e)}</div>`}
function top(){window.scrollTo({top:0,behavior:'smooth'})}
function dedupe(arr){return [...new Set((arr||[]).filter(Boolean))]}
async function fetchJson(path){
  if(cache.has(path)) return cache.get(path);
  const res=await fetch(path+'?v='+encodeURIComponent(VERSION));
  if(!res.ok) throw new Error(path+' 未加载成功');
  const data=await res.json(); cache.set(path,data); return data;
}
function extractConstExpression(code,name){
  const m=code.match(new RegExp('(?:const|let|var)\\s+'+name+'\\s*='));
  if(!m) throw new Error('找不到 '+name);
  let i=m.index+m[0].length;
  while(/\s/.test(code[i])) i++;
  const start=i, open=code[i];
  if(!'[{'.includes(open)){
    const semi=code.indexOf(';',i); return code.slice(i, semi>0?semi:code.length);
  }
  const close=open==='['?']':'}';
  let depth=0, str='', escNext=false;
  for(;i<code.length;i++){
    const ch=code[i];
    if(str){
      if(escNext) escNext=false;
      else if(ch==='\\') escNext=true;
      else if(ch===str) str='';
    }else{
      if(ch==='"'||ch==="'"||ch==='`') str=ch;
      else if(ch===open) depth++;
      else if(ch===close){depth--; if(depth===0){return code.slice(start,i+1)}}
    }
  }
  throw new Error(name+' 解析失败');
}
async function loadConst(path,name){
  const key=path+'::'+name;
  if(cache.has(key)) return cache.get(key);
  const res=await fetch(path+'?v='+encodeURIComponent(VERSION));
  if(!res.ok) throw new Error(path+' 未加载成功');
  const code=await res.text();
  const expr=extractConstExpression(code,name);
  const data=(new Function('return ('+expr+');'))();
  cache.set(key,data); return data;
}
async function loadData(key){
  const entry=FILE[key];
  if(Array.isArray(entry)) return loadConst(entry[0],entry[1]);
  return fetchJson(entry);
}
function statusMap(){try{return JSON.parse(localStorage.getItem(LESSON_STATUS_KEY))||{}}catch{return {}}}
function saveStatus(m){localStorage.setItem(LESSON_STATUS_KEY,JSON.stringify(m))}
function lessonStatus(id){return statusMap()[id]||'未学'}
function setLessonStatus(id,s){const m=statusMap();m[id]=s;saveStatus(m); if(currentLessonId) renderLesson(currentLessonId)}
function wrongMap(){try{return JSON.parse(localStorage.getItem(WRONG_KEY))||{}}catch{return {}}}
function saveWrong(m){localStorage.setItem(WRONG_KEY,JSON.stringify(m))}
function sentenceStatusMap(){try{return JSON.parse(localStorage.getItem(SENT_STATUS_KEY))||{}}catch{return {}}}
function saveSentenceStatus(m){localStorage.setItem(SENT_STATUS_KEY,JSON.stringify(m))}
function lookupHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY))||[]}catch{return []}}
function saveLookupHistory(x){localStorage.setItem(HISTORY_KEY,JSON.stringify(x.slice(0,20)))}

function navigate(page,params={},push=true){
  app.onclick=null;
  if(push && currentPage){navStack.push({page:currentPage,params:{lessonId:currentLessonId,module:currentModule}})}
  currentPage=page;
  document.querySelectorAll('.top-nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  renderPage(page,params).then(top).catch(showError);
}
function goPrev(){const item=navStack.pop(); if(item) navigate(item.page,item.params,false); else navigate('home',{},false)}
async function renderPage(page,params={}){
  setLoading();
  if(page==='home') return renderHome();
  if(page==='start') return renderStart();
  if(page==='language') return renderLanguage();
  if(page==='buddhist') return renderBuddhistHome();
  if(page==='routes') return renderRoutes();
  if(page==='modules') return renderModules();
  if(page==='moduleLessons') return renderModuleLessons(params.module||currentModule);
  if(page==='lesson') return renderLesson(params.lessonId||currentLessonId);
  if(page==='exercise') return renderExerciseCenter();
  if(page==='training') return renderTraining();
  if(page==='sentence') return renderSentencePage(params.priority||'');
  if(page==='patterns') return renderPatterns();
  if(page==='confusion') return renderConfusion();
  if(page==='dictionary') return renderDictionary(params.word||'');
  if(page==='terminology') return renderTerminology(params.query||'');
  if(page==='linguistics') return renderLinguistics();
  if(page==='wrong') return renderWrong();
  if(page==='progress') return renderProgress();
  if(page==='search') return renderSearch(params.query||'');
  if(page==='buddhistBackground') return renderBuddhistBackground();
  if(page==='buddhistReading') return renderBuddhistReading();
  if(page==='academic') return renderAcademic();
  renderHome();
}
function navControls(extra=''){
  return `<div class="nav-row"><button data-action="prev">前一页</button>${extra}<button data-action="top">回到顶部</button></div>`;
}
function homeCard(title,desc,page){return `<div class="entry-card clickable" data-page="${page}"><h3>${title}</h3><p class="muted">${desc}</p></div>`}
async function renderHome(){
  const grammar=await loadData('grammarIndex');
  const lessonCount=grammar.length;
  const exerciseCount=grammar.reduce((a,l)=>a+(Number(l.exercise_count)||0),0);
  const mastered=Object.values(statusMap()).filter(x=>x==='已掌握').length;
  const wrong=Object.keys(wrongMap()).length;
  app.innerHTML=`
    <section class="stats">
      <div class="stat"><strong>${lessonCount}</strong><span>语法点</span></div>
      <div class="stat"><strong>${exerciseCount}</strong><span>练习题</span></div>
      <div class="stat"><strong>${mastered}</strong><span>已掌握</span></div>
      <div class="stat"><strong>${wrong}</strong><span>错题</span></div>
    </section>
    <section class="card">
      <h2>学习路径</h2>
      <p class="muted">按“基础入门—语言能力—佛典阅读”组织。先建立学习顺序，再进入语法、句子分析与阅读训练。</p>
      <div class="grid">
        ${homeCard('基础入门','零基础路线与使用说明。','start')}
        ${homeCard('语言能力','模块学习、练习、句子分析、查词与术语。','language')}
        ${homeCard('佛典阅读','三藏结构、佛典句式、阅读方法与引用规范。','buddhist')}
      </div>
    </section>
    <section class="card">
      <h2>今日学习建议</h2>
      <ol class="summary-list">
        <li>零基础先走“零基础路线”，不要一开始打开全部课程。</li>
        <li>每天完成 1 个语法点、若干练习和 1—3 条句子分析。</li>
        <li>遇到不懂的英文术语，可进入术语库；遇到巴利语词形，可进入查词。</li>
      </ol>
    </section>`;
}
function renderStart(){app.innerHTML=`${navControls()}<section class="card"><h2>基础入门</h2><div class="grid two">${homeCard('零基础路线','按步骤学习最必要的发音、动词、名词格位与句子分析。','routes')}<div class="entry-card clickable" data-page="moduleLessons" data-module="使用说明"><h3>使用说明</h3><p class="muted">了解怎么学、怎么练、怎么复习。</p></div></div></section>`}
function renderLanguage(){app.innerHTML=`${navControls()}<section class="card"><h2>语言能力</h2><div class="grid">
${homeCard('模块学习','按语法模块进入课程。','modules')}
${homeCard('课程练习','按课程或模块抽题。','exercise')}
${homeCard('专项强化','按能力点集中训练。','training')}
${homeCard('句子分析','按步骤分析真实句子。','sentence')}
${homeCard('句型模板','总结常见结构。','patterns')}
${homeCard('易混概念','辨析容易混淆的形式和功能。','confusion')}
${homeCard('查词','内置词形分析与外部词典入口。','dictionary')}
${homeCard('术语库','英文术语、IPA、中文解释与巴利对应。','terminology')}
${homeCard('语言小贴士','语言学和语法概念辅助解释。','linguistics')}
${homeCard('错题复习','复习本机保存的错题。','wrong')}
${homeCard('学习进度备份','导出或导入本机学习记录。','progress')}
</div></section>`}
function renderBuddhistHome(){app.innerHTML=`${navControls()}<section class="card"><h2>佛典阅读</h2><p class="muted">面向佛典原文阅读入门，不称“学术研究”。</p><div class="grid">
${homeCard('三藏结构与略号','Tipiṭaka、Vinaya、Sutta、Abhidhamma 与常见略号。','buddhistBackground')}
${homeCard('佛典句式','如是我闻、时间结构、引语结构等。','buddhistReading')}
${homeCard('阅读方法与引用','原文记录、词义观察、引用规范与阅读任务。','academic')}
</div></section>`}
function sortLessons(arr){return [...arr].sort((a,b)=>(Number(a.lesson_number)||999)-(Number(b.lesson_number)||999)||(Number(a.id)||0)-(Number(b.id)||0))}
async function renderRoutes(){
  const [routes,grammar]=await Promise.all([loadData('routes'),loadData('grammarIndex')]);
  const byId=new Map(grammar.map(l=>[Number(l.id),l]));
  let active=routes[0]?.id||'zero';
  function draw(){
    const route=routes.find(r=>r.id===active)||routes[0];
    const tabs=routes.map(r=>`<button class="${r.id===active?'active':''}" data-route-tab="${r.id}">${text(r.title)}</button>`).join('');
    const steps=(route.steps||[]).map((s,i)=>{
      const lessonBtns=(s.lesson_ids||[]).map(id=>{
        const l=byId.get(Number(id));
        if(!l) return `<span class="pill red">语法点 ${id} 未找到</span>`;
        return `<button class="secondary" data-lesson="${l.id}">${text(l.lesson_number||l.id)}. ${text(l.title)}</button>`;
      }).join('');
      const sent=s.sentence_priority?`<button class="primary" data-page="sentence" data-priority="${text(s.sentence_priority)}">进入句子分析：${text(s.sentence_priority)}</button>`:'';
      return `<div class="card compact"><h3>${i+1}. ${text(s.title)}</h3><p>${text(s.desc||'')}</p><div class="button-row">${lessonBtns}${sent}</div></div>`;
    }).join('');
    app.innerHTML=`${navControls()}<section class="card"><h2>零基础与专项路线</h2><div class="tabs">${tabs}</div><h3>${text(route.title)}</h3><p class="muted">${text(route.desc||'')}</p>${steps}</section>`;
  }
  draw();
  app.onclick=(e)=>{
    const tab=e.target.closest('[data-route-tab]');
    if(tab){active=tab.dataset.routeTab;draw();return;}
    const lesson=e.target.closest('[data-lesson]');
    if(lesson){navigate('lesson',{lessonId:Number(lesson.dataset.lesson)});return;}
    const sent=e.target.closest('[data-priority]');
    if(sent){navigate('sentence',{priority:sent.dataset.priority});return;}
  };
}
async function renderModules(){
  const grammar=await loadData('grammarIndex');
  const groups={};
  grammar.forEach(l=>{(groups[l.module||'其他'] ||= []).push(l)});
  const order=['使用说明','入门与发音','动词系统','名词变格','代词与形容词','分词与非限定动词','不变词与常用句式','句法与阅读','其他'];
  const cards=order.filter(m=>groups[m]?.length).map(m=>{
    const total=groups[m].length, mastered=groups[m].filter(l=>lessonStatus(l.id)==='已掌握').length;
    const pct=total?Math.round(mastered/total*100):0;
    return `<div class="module-card" data-module="${text(m)}"><h3>${text(m)}</h3><p class="muted">${total} 个语法点</p><div class="progressbar"><span style="width:${pct}%"></span></div><p class="muted">掌握进度：${mastered}/${total}</p></div>`;
  }).join('');
  app.innerHTML=`${navControls()}<section class="card"><h2>模块学习</h2><p class="muted">建议顺序：入门与发音 → 动词系统 → 名词变格 → 代词与形容词 → 分词与非限定动词 → 不变词与常用句式 → 句法与阅读。</p><div class="grid">${cards}</div></section>`;
}
async function renderModuleLessons(module){
  const grammar=await loadData('grammarIndex'); currentModule=module||currentModule||'入门与发音';
  const lessons=sortLessons(grammar.filter(l=>l.module===currentModule));
  const cards=lessons.map(l=>`<div class="lesson-card" data-lesson="${l.id}"><h3>${text(l.lesson_number||l.id)}. ${text(l.title)}</h3><p class="muted">${text(l.category||'')}｜${text(l.level||l.difficulty||'')}</p><p>${text(l.summary||'')}</p><span class="pill ${lessonStatus(l.id)==='已掌握'?'green':''}">${lessonStatus(l.id)}</span></div>`).join('') || '<p class="muted">暂无课程。</p>';
  app.innerHTML=`${navControls('<button data-page="modules">模块页</button>')}<section class="card"><h2>${text(currentModule)}</h2><div class="result-list">${cards}</div></section>`;
}
async function getLessonDetail(id){
  id=Number(id); const [grammar,manifest]=await Promise.all([loadData('grammarIndex'),loadData('manifest')]);
  const base=grammar.find(l=>Number(l.id)===id)||{};
  const file=manifest[String(id)]||manifest[id];
  if(!file) return base;
  const chunk=await fetchJson(file);
  const detail=(chunk||[]).find(l=>Number(l.id)===id)||{};
  return {...base,...detail};
}
async function loadLessonExercises(id){
  const ex=await loadData('exercise').catch(()=>[]);
  return (ex||[]).filter(x=>Number(x.lesson_id)===Number(id));
}
function cleanGoalList(lesson){
  const arr=[];
  (lesson.learning_goals||[]).forEach(x=>arr.push(x));
  (lesson.minimal_mastery||[]).forEach(x=>arr.push(x));
  return dedupe(arr.map(x=>String(x).trim()).filter(x=>x && !/本课目标|学习目标/.test(x))).slice(0,8);
}
const ABBRS=[
 ['n.','noun，名词','noun','/naʊn/'],['v.','verb，动词','verb','/vɝːb/'],['m.','masculine，阳性','masculine','/ˈmæskjəlɪn/'],['f.','feminine，阴性','feminine','/ˈfemənɪn/'],['sg.','singular，单数','singular','/ˈsɪŋɡjələr/'],['pl.','plural，复数','plural','/ˈplʊrəl/'],['nom.','nominative，主格','nominative','/ˈnɑːmɪnətɪv/'],['acc.','accusative，宾格','accusative','/əˈkjuːzətɪv/'],['gen.','genitive，属格','genitive','/ˈdʒenətɪv/'],['dat.','dative，与格','dative','/ˈdeɪtɪv/'],['loc.','locative，处格','locative','/ˈlɑːkətɪv/'],['ins.','instrumental，工具格','instrumental','/ˌɪnstrəˈmentəl/'],['abl.','ablative，从格','ablative','/ˈæblətɪv/'],['voc.','vocative，呼格','vocative','/ˈvɑːkətɪv/'],['ind.','indeclinable，不变词','indeclinable','/ˌɪndɪˈklaɪnəbəl/'],['ger.','gerund，连续体','gerund','/ˈdʒerənd/'],['inf.','infinitive，不定式','infinitive','/ɪnˈfɪnətɪv/'],['pr.p.','present participle，现在分词','present participle','/ˈprezənt ˈpɑːrtɪsɪpəl/'],['p.p.','past participle，过去分词','past participle','/pæst ˈpɑːrtɪsɪpəl/'],['f.p.p.','future passive participle，将来被动分词','future passive participle','/ˈfjuːtʃər ˈpæsɪv ˈpɑːrtɪsɪpəl/']
];
function abbrHTML(lesson){
  const blob=JSON.stringify(lesson);
  const hits=ABBRS.filter(a=>blob.includes(a[0]));
  if(!hits.length) return '';
  return `<section class="card compact"><div class="section-title"><h3>语法标注</h3></div><div class="abbr-list">${hits.map(a=>`<span class="abbr-chip">${a[0]} = <span class="ipa-term" data-ipa="${a[3]}">${a[2]}</span>，${a[1].split('，')[1]||''}</span>`).join('')}</div></section>`;
}
function inferConcepts(lesson){
  const textBlob=[lesson.title,lesson.category,lesson.summary,...(lesson.explanation||[]),...(lesson.common_mistakes||[])].join(' ');
  const generic=new Set(['名词','动词','格','单数','复数','主格','宾格','词根','词尾','主语','宾语','语法','句子']);
  const candidates=['非限定动词','连续体','不定式','分词','现在分词','过去分词','将来被动分词','关系句','引语结构','中间语态','被动语态','使役动词','连读音变','sandhi','绝对属格','处格','工具格','属格','与格','从格','呼格','不变词','否定词','关系代词','三宝','三藏','佛典公式句'];
  return candidates.filter(c=>textBlob.includes(c)||String(lesson.title||'').includes(c)).filter(c=>!generic.has(c)).slice(0,8);
}
function conceptsHTML(lesson){
  const cs=inferConcepts(lesson);
  if(!cs.length) return '';
  return `<section class="card compact"><div class="section-title"><h3>核心概念</h3></div><div>${cs.map(c=>`<button class="concept-btn" data-term-query="${text(c)}">${text(c)}</button>`).join('')}</div></section>`;
}
const PALI_SMALL=new Set(['ca','na','mā','iti','ti','vā','kho','so','te','yo','me','no','taṃ','atha','eva','api','pana']);
const MEANINGS={Buddha:'佛；觉者',Dhamma:'法；教法',Saṅgha:'僧伽；僧团',dhamma:'法；教法',bhikkhu:'比丘',vihāra:'寺院',citta:'心',phala:'果',rūpa:'色；形态',kamma:'业',saraṇa:'皈依；庇护',gāma:'村庄',patta:'钵',sadda:'声音',paññā:'智慧',purisa:'人',itthi:'女子',gacchati:'去',deseti:'说；开示',suṇāti:'听',hoti:'是；成为',karoti:'做',vasati:'住',viharati:'住；停留',passati:'看见',labhati:'得到',icchati:'想要',āgacchati:'来',vandati:'礼敬',pasīdati:'生信；欢喜'};
const ROOTS={gacchati:'√gam',āgacchati:'√gam',deseti:'√dis',suṇāti:'√su',hoti:'√bhū',karoti:'√kar',vasati:'√vas',viharati:'√har / vihar',passati:'√pass',labhati:'√labh',icchati:'√is',vandati:'√vand',pasīdati:'√sad'};
function tokenizePali(s){return dedupe(String(s||'').match(/[A-Za-zĀāĪīŪūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ]+/g)||[])}
function lemmaNoun(tok){
  if(tok.length<2) return '';
  if(tok.endsWith('ssa')) return tok.slice(0,-3)+'a';
  if(tok.endsWith('ena')) return tok.slice(0,-3)+'a';
  if(tok.endsWith('āya')) return tok.slice(0,-3)+'ā';
  if(tok.endsWith('āyaṃ')) return tok.slice(0,-4)+'ā';
  if(tok.endsWith('e') && tok.length>4) return tok.slice(0,-1)+'a';
  if(tok.endsWith('o') && tok.length>3) return tok.slice(0,-1)+'a';
  if(tok.endsWith('aṃ') && tok.length>3) return tok.slice(0,-2)+'a';
  if(tok.endsWith('ṃ') && tok.length>3) return tok.slice(0,-1);
  return tok;
}
function classifyToken(tok){
  if(!tok || tok.length<2) return null;
  if(tok.length<=3 && !PALI_SMALL.has(tok)) return null;
  if(/^[A-Z]{2,}$/.test(tok)) return null;
  if(['sg','pl','nom','acc','gen','dat','loc','ins','abl','voc','prs','indic','act','pass','json','lesson','html','css'].includes(tok.toLowerCase())) return null;
  if(/ti$/i.test(tok) && tok.toLowerCase()!=='iti'){
    return {form:tok, type:'verb', grammar:`v. 3sg${ROOTS[tok]?`；${ROOTS[tok]}`:''}`, meaning:MEANINGS[tok]||'动词；需结合词典确认'};
  }
  if(PALI_SMALL.has(tok)) return {form:tok,type:'other',grammar:'ind. / pron. 等；按语境判断',meaning:MEANINGS[tok]||'小词；按语境判断'};
  const lemma=lemmaNoun(tok);
  if(!lemma || lemma.length<2) return null;
  return {form:lemma,type:'noun',grammar:'n.；原形/词典形',meaning:MEANINGS[lemma]||'名词；需结合巴利词典确认'};
}
async function vocabHTML(lesson,exercises){
  const parts=[];
  (lesson.examples||[]).forEach(e=>parts.push(e.pali,e.note,e.grammar_note));
  (lesson.table||[]).flat().forEach(x=>parts.push(x));
  (exercises||[]).slice(0,30).forEach(e=>parts.push(e.question,e.answer,...(e.options||[])));
  const tokens=dedupe(parts.flatMap(tokenizePali));
  const map=new Map();
  tokens.map(classifyToken).filter(Boolean).forEach(v=>{if(!map.has(v.form)) map.set(v.form,v)});
  const order={verb:1,noun:2,other:3};
  let rows=[...map.values()].sort((a,b)=>(order[a.type]-order[b.type])||a.form.localeCompare(b.form)).slice(0,18);
  if(!rows.length) return '';
  const table=`<div class="table-wrap"><table class="vocab-table"><thead><tr><th>词形</th><th>语法信息</th><th>基本义</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${text(r.form)}</td><td>${text(r.grammar)}</td><td>${text(r.meaning)}</td></tr>`).join('')}</tbody></table></div>`;
  const body=rows.length>8?`<details class="vocab-details"><summary>本节单词（${rows.length} 个，点击展开）</summary>${table}</details>`:table;
  return `<section class="card compact"><div class="section-title"><h3>本节单词</h3></div>${body}</section>`;
}
function examplesHTML(lesson){
  const items=(lesson.examples||[]).map(e=>`<div class="example"><div class="pali">${text(e.pali||'')}</div><div class="translation"><strong>翻译：</strong>${text(e.natural_cn||e.cn||'')}</div>${e.note||e.grammar_note?`<div class="note">${text(e.note||e.grammar_note)}</div>`:''}</div>`).join('');
  return items?`<section class="card compact"><div class="section-title"><h3>例句</h3></div>${items}</section>`:'';
}
function tableHTML(lesson){
  if(!lesson.table?.length) return '';
  return `<section class="card compact"><div class="section-title"><h3>形式与结构</h3></div><div class="table-wrap"><table>${lesson.table.map(row=>`<tr>${row.map(c=>`<td>${text(c)}</td>`).join('')}</tr>`).join('')}</table></div></section>`;
}
function explanationHTML(lesson){
  const arr=lesson.explanation||[];
  return arr.length?`<section class="card compact"><div class="section-title"><h3>语法说明</h3></div><ol>${arr.map(x=>`<li>${text(x)}</li>`).join('')}</ol></section>`:'';
}
function mistakesHTML(lesson){
  const arr=lesson.common_mistakes||[];
  return arr.length?`<section class="card compact"><div class="section-title"><h3>常见误区</h3></div><ul>${arr.slice(0,8).map(x=>`<li>${text(x)}</li>`).join('')}</ul></section>`:'';
}
function exercisePreviewHTML(exercises){
  if(!exercises?.length) return '';
  return `<section class="card compact"><div class="section-title"><h3>练习</h3></div><p class="muted">本课共有 ${exercises.length} 道练习。</p><button class="primary" data-start-lesson-exercise="1">开始本课练习</button></section>`;
}
function lessonNav(id,grammar){
  const sorted=sortLessons(grammar.filter(l=>l.module===currentModule));
  const idx=sorted.findIndex(l=>Number(l.id)===Number(id));
  const prev=sorted[idx-1], next=sorted[idx+1];
  return `<div class="nav-row"><button data-action="prev">前一页</button><button data-page="moduleLessons" data-module="${text(currentModule)}">模块页</button>${prev?`<button data-lesson="${prev.id}">上一节</button>`:''}${next?`<button data-lesson="${next.id}">下一节</button>`:''}<button data-action="top">回到顶部</button></div>`;
}
async function renderLesson(id){
  currentLessonId=Number(id);
  const [lesson,grammar]=await Promise.all([getLessonDetail(id),loadData('grammarIndex')]);
  currentModule=lesson.module||currentModule;
  const exercises=await loadLessonExercises(id).catch(()=>[]);
  const goals=cleanGoalList(lesson);
  app.innerHTML=`${lessonNav(id,grammar)}<section class="card"><p class="pill">${text(lesson.module||'')}</p><h2>${text(lesson.lesson_number||lesson.id)}. ${text(lesson.title||'课程')}</h2><p class="muted">${text(lesson.category||'')}｜${text(lesson.level||lesson.difficulty||'')}</p><p>${text(lesson.summary||'')}</p><div class="button-row"><button class="${lessonStatus(id)==='学习中'?'primary':''}" data-set-status="学习中">标记学习中</button><button class="${lessonStatus(id)==='已掌握'?'success':''}" data-set-status="已掌握">标记已掌握</button><button class="${lessonStatus(id)==='需复习'?'danger':''}" data-set-status="需复习">标记需复习</button></div></section>
${goals.length?`<section class="card compact"><div class="section-title"><h3>学习目标</h3></div><ul>${goals.map(g=>`<li>${text(g)}</li>`).join('')}</ul></section>`:''}
${await vocabHTML(lesson,exercises)}
${abbrHTML(lesson)}
${conceptsHTML(lesson)}
${explanationHTML(lesson)}
${tableHTML(lesson)}
${examplesHTML(lesson)}
${exercisePreviewHTML(exercises)}
${mistakesHTML(lesson)}
${lessonNav(id,grammar)}`;
}
let currentExercises=[], exerciseIndex=0, selectedChoice='';
async function renderExerciseCenter(){
  const [ex,grammar]=await Promise.all([loadData('exercise'),loadData('grammarIndex')]);
  const modules=dedupe(grammar.map(l=>l.module));
  app.innerHTML=`${navControls()}<section class="card"><h2>课程练习</h2><p class="muted">按模块或课程抽题。练习题进入本页后才加载。</p><label>选择模块</label><select id="exerciseModule"><option value="全部">全部</option>${modules.map(m=>`<option>${text(m)}</option>`).join('')}</select><label>抽题数量</label><select id="exerciseCount"><option>10</option><option>20</option><option>50</option></select><button class="primary" data-action="startExercise">开始练习</button><div id="exerciseArea"></div></section>`;
}
function startExercise(items){
  currentExercises=[...items].sort(()=>Math.random()-.5); exerciseIndex=0; selectedChoice=''; renderExerciseQuestion();
}
function renderExerciseQuestion(){
  const area=$('#exerciseArea'); if(!area)return;
  if(!currentExercises.length){area.innerHTML='<p class="muted">当前没有练习题。</p>';return;}
  if(exerciseIndex>=currentExercises.length){area.innerHTML='<div class="exercise-box"><h3>本轮完成</h3><button class="primary" data-page="wrong">查看错题</button></div>';return;}
  const ex=currentExercises[exerciseIndex];
  const options=ex.type==='choice'?(ex.options||[]).map(o=>`<button class="option" data-choice="${text(o)}">${text(o)}</button>`).join(''):`<input id="inputAnswer" placeholder="请输入答案">`;
  area.innerHTML=`<div class="exercise-box"><p class="muted">题目 ${exerciseIndex+1}/${currentExercises.length}｜${text(ex.module||'')}｜${text(ex.lesson_title||'')}</p><h3>${text(ex.question)}</h3>${options}<div class="button-row"><button class="primary" data-action="submitExercise">提交答案</button><button data-action="nextExercise">下一题</button></div><div id="exerciseFeedback"></div></div>`;
}
function submitExercise(){
  const ex=currentExercises[exerciseIndex]; if(!ex)return;
  const ans=ex.type==='choice'?selectedChoice:($('#inputAnswer')?.value||'');
  if(!String(ans).trim()){alert('请先作答。');return;}
  const good=normalizeAnswer(ans)===normalizeAnswer(ex.answer);
  const wrong=wrongMap();
  if(good) delete wrong[ex.id]; else wrong[ex.id]={...ex,user_answer:ans,wrong_at:new Date().toISOString()};
  saveWrong(wrong);
  const fb=$('#exerciseFeedback');
  fb.className='feedback '+(good?'good':'bad');
  fb.innerHTML=`<strong>${good?'回答正确':'回答错误'}</strong><p>你的答案：${text(ans)}</p><p>标准答案：${text(ex.answer)}</p><p>${text(ex.explanation||'')}</p>`;
}
function normalizeAnswer(s){return String(s||'').trim().toLowerCase().replace(/\s+/g,' ')}
async function renderTraining(){
  app.innerHTML=`${navControls()}<section class="card"><h2>专项强化</h2><p class="muted">按能力点训练，不等同于课程练习。</p><div class="grid">
  <div class="entry-card clickable" data-training="case"><h3>名词格位</h3><p class="muted">主格、宾格、工具格、属格、处格等。</p></div>
  <div class="entry-card clickable" data-training="verb"><h3>动词系统</h3><p class="muted">现在时、将来时、命令语气、人称数等。</p></div>
  <div class="entry-card clickable" data-training="nonfinite"><h3>非限定动词</h3><p class="muted">inf.、ger.、分词。</p></div>
  <div class="entry-card clickable" data-training="particle"><h3>不变词</h3><p class="muted">na、mā、ca、vā、eva、iti 等。</p></div>
  <div class="entry-card clickable" data-training="sentence"><h3>句子分析</h3><p class="muted">主语、宾语、格位与结构信号。</p></div>
  </div><div id="trainingArea"></div></section>`;
}
async function startTraining(kind){
  const ex=await loadData('exercise');
  const rules={
    case:/格|主格|宾格|工具格|处格|属格|与格|从格|呼格|名词/,
    verb:/动词|现在时|将来时|过去|命令|祈愿|人称|词尾|语态/,
    nonfinite:/inf\.|ger\.|分词|gantuṃ|gantvā|sotuṃ|sutvā|p\.p\./,
    particle:/ind\.|na|mā|ca|vā|eva|iti|否定|并列|选择|引语/,
    sentence:/句子|主语|宾语|限定动词|阅读|结构/
  };
  const re=rules[kind]||/.*/;
  startExercise(ex.filter(e=>re.test([e.question,e.explanation,e.module,e.category,e.lesson_title].join(' '))).slice(0,50));
  const area=$('#trainingArea'); if(area) area.innerHTML='<div id="exerciseArea"></div>';
  renderExerciseQuestion();
}
async function renderSentencePage(priority=''){
  const data=await loadData('sentence');
  const levels=dedupe(data.map(x=>x.level));
  const prios=dedupe(data.map(x=>x.practice_priority||'综合挑战'));
  app.innerHTML=`${navControls()}<section class="card"><h2>句子分析训练</h2><p class="muted">句子分析训练真实句子结构，和“句型模板”分开。</p><div class="grid four"><div class="stat"><strong>${data.length}</strong><span>句子总数</span></div><div class="stat"><strong>${Object.values(sentenceStatusMap()).filter(x=>x==='已掌握').length}</strong><span>已掌握</span></div><div class="stat"><strong>${Object.values(sentenceStatusMap()).filter(x=>x==='需复习').length}</strong><span>需复习</span></div><div class="stat"><strong id="sentenceFilteredCount">0</strong><span>当前筛选</span></div></div><label>训练层级</label><select id="sentencePriority"><option value="全部">全部</option>${prios.map(p=>`<option ${p===priority?'selected':''}>${text(p)}</option>`).join('')}</select><label>难度</label><select id="sentenceLevel"><option value="全部">全部</option>${levels.map(l=>`<option>${text(l)}</option>`).join('')}</select><label>选择句子</label><select id="sentenceSelect"></select><div id="sentenceCard"></div></section>`;
  refreshSentenceSelect();
}
function filteredSentences(){
  const data=cache.get(FILE.sentence[0]+'::'+FILE.sentence[1])||[];
  const p=$('#sentencePriority')?.value||'全部', l=$('#sentenceLevel')?.value||'全部';
  return data.filter(x=>(p==='全部'||(x.practice_priority||'综合挑战')===p)&&(l==='全部'||x.level===l)).sort((a,b)=>(a.priority_rank||99)-(b.priority_rank||99)||(a.recommended_order||999)-(b.recommended_order||999));
}
function refreshSentenceSelect(){
  const sel=$('#sentenceSelect'); if(!sel)return;
  const items=filteredSentences(); $('#sentenceFilteredCount').textContent=items.length;
  sel.innerHTML=items.map(x=>`<option value="${text(x.id)}">${text(x.sentence)}（${sentenceStatusMap()[x.id]||'未练'}）</option>`).join('');
  renderSentenceCard('translation');
}
function currentSentence(){const id=$('#sentenceSelect')?.value; return filteredSentences().find(x=>x.id===id)||filteredSentences()[0]}
function renderSentenceCard(step){
  const item=currentSentence(), box=$('#sentenceCard'); if(!box)return;
  if(!item){box.innerHTML='<p class="muted">当前筛选下没有句子。</p>';return;}
  let html=`<div class="sentence-card"><p class="pill">${text(item.level)}</p><p class="sentence-main">${text(item.sentence)}</p><div class="button-row"><button data-sentence-step="translation">第一步：看翻译</button><button data-sentence-step="tokens">第二步：看词形</button><button data-sentence-step="structure">第三步：看结构</button><button class="primary" data-sentence-step="full">第四步：看完整解析</button></div>`;
  if(['translation','tokens','structure','full'].includes(step)) html+=`<p><strong>翻译：</strong>${text(item.translation)}</p>`;
  if(['tokens','full'].includes(step)) html+=`<div class="table-wrap"><table class="token-table"><tr><th>词形</th><th>语法信息</th><th>句中功能</th><th>意义</th></tr>${(item.tokens||[]).map(t=>`<tr><td>${text(t.form)}</td><td>${text(t.grammar)}</td><td>${text(t.role)}</td><td>${text(t.meaning)}</td></tr>`).join('')}</table></div>`;
  if(['structure','full'].includes(step)) html+=`<p><strong>结构：</strong>${text(item.structure)}</p><p class="note">${text(item.tip||'')}</p>`;
  if(step==='full') html+=`<p><strong>训练目标：</strong>${text(item.training_goal||'')}</p><p><strong>相关语法点：</strong>${(item.related||[]).map(x=>`<button class="concept-btn" data-search-query="${text(x)}">${text(x)}</button>`).join('')}</p>`;
  html+=`<div class="button-row"><button class="success" data-sentence-status="已掌握">标记已掌握</button><button class="danger" data-sentence-status="需复习">标记需复习</button><button data-action="nextSentence">下一句</button></div></div>`;
  box.innerHTML=html;
}
async function renderPatterns(){
  const data=await loadData('patterns');
  app.innerHTML=`${navControls()}<section class="card"><h2>句型模板</h2><input id="patternSearch" placeholder="搜索 inf.、ger.、yo、iti 等"><div id="patternList" class="result-list"></div></section>`;
  function draw(){const q=($('#patternSearch').value||'').toLowerCase();$('#patternList').innerHTML=data.filter(p=>!q||JSON.stringify(p).toLowerCase().includes(q)).map(p=>`<div class="result-card"><h3>${text(p.title)}</h3><p class="pill">${text(p.level||'')}</p><p><strong>公式：</strong>${text(p.formula||'')}</p><p>${text(p.function||'')}</p>${(p.examples||[]).slice(0,2).map(e=>`<div class="example"><div class="pali">${text(e.pali)}</div><div>翻译：${text(e.natural||e.literal||'')}</div><div class="note">${text(e.note||'')}</div></div>`).join('')}</div>`).join('')||'<p class="muted">没有结果。</p>'}
  draw(); $('#patternSearch').addEventListener('input',draw);
}
async function renderConfusion(){
  const data=await loadData('confusion');
  app.innerHTML=`${navControls()}<section class="card"><h2>易混概念</h2><div class="result-list">${data.map(x=>`<div class="result-card"><h3>${text(x.title)}</h3><p>${text(x.core||'')}</p><p><span class="pill">${text(x.a||'')}</span><span class="pill gold">${text(x.b||'')}</span></p>${(x.examples||[]).map(e=>`<div class="example"><div class="pali">${text(e.pali)}</div><div>翻译：${text(e.cn||'')}</div><div class="note">${text(e.note||'')}</div></div>`).join('')}</div>`).join('')}</div></section>`;
}
async function renderDictionary(initial=''){
  const [sites,tokens]=await Promise.all([loadData('dictionary'),loadData('token')]);
  const history=lookupHistory();
  app.innerHTML=`${navControls()}<section class="card"><h2>查词</h2><p class="muted">查词页面包括内置词形分析、外部词典入口、查询历史和常用词典说明。</p><input id="lookupInput" value="${text(initial)}" placeholder="输入巴利语词形，如 Buddho、dhammaṃ、gacchati"><div class="button-row"><button class="primary" data-action="analyzeToken">分析词形</button><button data-action="clearLookup">清空</button></div><div id="tokenPanel"></div><h3>外部词典入口</h3><div class="grid">${sites.map(s=>`<div class="entry-card"><h3>${text(s.name)}</h3><p class="pill">${text(s.level||'')}</p><p>${text(s.best_for||'')}</p><p class="muted">${text(s.note||'')}</p><a class="btn primary" href="${text(s.url)}" target="_blank" rel="noopener">打开</a></div>`).join('')}</div><h3>查询历史</h3><div>${history.map(w=>`<button class="concept-btn" data-lookup-word="${text(w)}">${text(w)}</button>`).join('')||'<p class="muted">暂无历史。</p>'}</div></section>`;
  if(initial) analyzeToken();
}
function addLookupHistory(word){word=String(word||'').trim(); if(!word)return; const h=lookupHistory().filter(x=>x!==word); h.unshift(word); saveLookupHistory(h)}
function analyzeToken(){
  const word=($('#lookupInput')?.value||'').trim(); const panel=$('#tokenPanel'); if(!panel)return;
  if(!word){panel.innerHTML='<p class="muted">请输入要分析的词形。</p>';return;}
  addLookupHistory(word); const data=cache.get(FILE.token[0]+'::'+FILE.token[1])||{}; const item=data[word]||data[word.toLowerCase()];
  if(!item){panel.innerHTML=`<div class="error">本站例子库未收录 ${text(word)}。可尝试还原词典形后查询外部词典。</div>`;return;}
  panel.innerHTML=`<div class="result-card"><h3>${text(item.form||word)}</h3>${(item.analyses||[]).map(a=>`<p><strong>语法信息：</strong>${text(a.grammar)}<br><strong>句中功能：</strong>${text(a.role)}<br><strong>意义：</strong>${text(a.meaning)}</p>`).join('')}${(item.examples||[]).slice(0,4).map(e=>`<div class="example"><div class="pali">${text(e.sentence)}</div><div>翻译：${text(e.translation||'')}</div><div class="note">${text(e.tip||'')}</div></div>`).join('')}</div>`;
}
async function renderTerminology(query=''){
  const data=await loadData('terminology');
  const cats=dedupe(data.map(t=>t.cat||t.category||'其他'));
  app.innerHTML=`${navControls()}<section class="card"><h2>术语库</h2><p class="muted">英文术语保留 IPA 音标；巴利语单词不加英语 IPA。</p><input id="termSearch" value="${text(query)}" placeholder="搜索 case、nominative、主格、vibhatti"><select id="termCat"><option value="全部">全部</option>${cats.map(c=>`<option>${text(c)}</option>`).join('')}</select><div id="termList" class="result-list"></div></section>`;
  function draw(){const q=($('#termSearch').value||'').toLowerCase(); const cat=$('#termCat').value; const items=data.filter(t=>{const blob=[t.en,t.cn,t.pali,t.note,t.simple_explanation,t.cat,t.category].join(' ').toLowerCase(); return (cat==='全部'||(t.cat||t.category)===cat)&&(!q||blob.includes(q))});$('#termList').innerHTML=items.map(t=>`<div class="term-card"><h3>${text(t.en||t.cn||'')} ${t.ipa?`<span class="ipa-inline">${text(t.ipa)}</span>`:''}</h3><p><strong>${text(t.cn||'')}</strong>${t.pali?`｜巴利对应：${text(t.pali)}`:''}</p><p>${text(t.simple_explanation||t.note||'')}</p>${(t.contrast_examples||[]).slice(0,2).map(e=>`<div class="example"><strong>${text(e.label||'')}</strong>：${text(e.form||'')}<br><span class="note">${text(e.meaning||'')}</span></div>`).join('')}</div>`).join('')||'<p class="muted">没有找到相关术语。</p>'}
  draw(); $('#termSearch').addEventListener('input',draw); $('#termCat').addEventListener('change',draw);
}
async function renderLinguistics(){
  const data=await loadData('linguistics');
  app.innerHTML=`${navControls()}<section class="card"><h2>语言小贴士</h2><input id="tipSearch" placeholder="搜索形态学、句法、词尾等"><div id="tipList" class="result-list"></div></section>`;
  function draw(){const q=($('#tipSearch').value||'').toLowerCase();$('#tipList').innerHTML=data.filter(t=>!q||JSON.stringify(t).toLowerCase().includes(q)).map(t=>`<div class="result-card"><h3>${text(t.title)}</h3><p class="pill">${text(t.category||'')}</p><p>${text(t.summary||'')}</p><div class="example">${text(t.example||'')}</div></div>`).join('')||'<p class="muted">没有结果。</p>'}
  draw(); $('#tipSearch').addEventListener('input',draw);
}
async function renderBuddhistBackground(){
  const data=await loadData('buddhistBackground');
  const concepts=data.concepts||[];
  app.innerHTML=`${navControls()}<section class="card"><h2>三藏结构与略号</h2><div class="result-list">
  <div class="result-card"><h3>核心结构</h3><ul><li><strong>Tipiṭaka</strong>：巴利三藏，总称佛教早期经典系统。</li><li><strong>Vinaya-piṭaka</strong>：律藏，主要保存僧团戒律与制度。</li><li><strong>Sutta-piṭaka</strong>：经藏，主要保存佛陀及弟子的教说。</li><li><strong>Abhidhamma-piṭaka</strong>：论藏，主要保存对法义的系统分析。</li><li><strong>Nikāya</strong>：经藏下的部类，如 Dīgha-nikāya、Majjhima-nikāya。</li></ul></div>
  <div class="result-card"><h3>常见略号</h3><p>DN = Dīgha-nikāya；MN = Majjhima-nikāya；SN = Saṃyutta-nikāya；AN = Aṅguttara-nikāya；Dhp = Dhammapada。</p></div>
  ${concepts.map(c=>`<div class="result-card"><h3>${text(c.pali||c.id)}｜${text(c.cn||'')}</h3><p>${text(c.basic||'')}</p><p class="note">阅读提醒：${text(c.reading_tip||'')}</p></div>`).join('')}
  </div></section>`;
}
async function renderBuddhistReading(){
  const data=await loadData('buddhistReading');
  app.innerHTML=`${navControls()}<section class="card"><h2>佛典句式</h2><div class="result-list">${data.map(p=>`<div class="result-card"><h3>${text(p.title)}</h3><p class="pill">${text(p.category||'')}</p><p><strong>结构：</strong>${text(p.formula||'')}</p><div class="example"><div class="pali">${text(p.title||'')}</div><div>翻译：${text(p.natural||'')}</div><div class="note">${text(p.structure||p.warning||'')}</div></div></div>`).join('')}</div></section>`;
}
async function renderAcademic(){
  const data=await loadData('academic');
  const method=data.method||[], citation=data.citation?.principles||[];
  app.innerHTML=`${navControls()}<section class="card"><h2>阅读方法与引用</h2><div class="grid two">${method.map(m=>`<div class="result-card"><h3>${text(m.title)}</h3><p>${text(m.goal||'')}</p><ol>${(m.steps||[]).map(s=>`<li>${text(s)}</li>`).join('')}</ol>${m.example?`<div class="example"><div class="pali">${text(m.example.source||'')}</div><div>翻译：${text(m.example.natural||m.example.literal||'')}</div><div class="note">${text(m.example.grammar||m.example.research_note||'')}</div></div>`:''}</div>`).join('')}</div><h3>引用规范</h3>${citation.map(c=>`<div class="result-card"><h3>${text(c.title)}</h3><p>${text(c.content)}</p></div>`).join('')}</section>`;
}
async function renderWrong(){
  const items=Object.values(wrongMap());
  app.innerHTML=`${navControls()}<section class="card"><h2>错题复习</h2><p class="muted">当前错题：${items.length} 道。</p><button class="danger" data-action="clearWrong">清空错题</button><div class="result-list">${items.map(x=>`<div class="result-card"><h3>${text(x.question)}</h3><p>答案：${text(x.answer)}</p><p class="muted">${text(x.module||'')}｜${text(x.lesson_title||'')}</p></div>`).join('')||'<p class="muted">目前没有错题。</p>'}</div></section>`;
}
function renderProgress(){
  const data={lessonStatus:statusMap(),wrong:wrongMap(),sentenceStatus:sentenceStatusMap(),lookupHistory:lookupHistory(),exportedAt:new Date().toISOString()};
  app.innerHTML=`${navControls()}<section class="card"><h2>学习进度备份</h2><p class="muted">学习进度保存在本机浏览器 localStorage 中。可复制导出，也可粘贴导入。</p><textarea id="progressText" rows="12">${text(JSON.stringify(data,null,2))}</textarea><div class="button-row"><button class="primary" data-action="copyProgress">复制备份</button><button data-action="importProgress">导入备份</button></div></section>`;
}
async function renderSearch(query=''){
  app.innerHTML=`${navControls()}<section class="card"><h2>全站搜索</h2><input id="searchInput" value="${text(query)}" placeholder="搜索语法点、本节单词、核心概念、句子分析、佛典阅读、查词相关内容"><div id="searchResults" class="search-groups"></div></section>`;
  const input=$('#searchInput'); input.addEventListener('input',()=>drawSearch(input.value)); drawSearch(input.value);
}
async function drawSearch(q){
  q=String(q||'').trim().toLowerCase(); const box=$('#searchResults'); if(!box)return;
  if(!q){box.innerHTML='<p class="muted">输入关键词后显示搜索结果。</p>';return;}
  box.innerHTML='<div class="loading">正在加载，请稍候……</div>';
  const [sidx,sent,terms,reading,bg,tokens]=await Promise.all([loadData('search'),loadData('sentence'),loadData('terminology'),loadData('buddhistReading'),loadData('buddhistBackground'),loadData('token')]);
  const course=sidx.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,10);
  const sentence=sent.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,10);
  const term=terms.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,10);
  const buddhist=[...reading,...(bg.concepts||[])].filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,10);
  const tokenKeys=Object.keys(tokens).filter(k=>k.toLowerCase().includes(q)).slice(0,10);
  function group(title,items,render){return `<section class="card compact"><h3>${title}</h3><div class="result-list">${items.length?items.map(render).join(''):'<p class="muted">没有结果。</p>'}</div></section>`}
  box.innerHTML=group('语法点',course,x=>`<div class="result-card clickable" data-lesson="${x.id}"><h3>${text(x.lesson_number||x.id)}. ${text(x.title)}</h3><p>${text(x.summary||'')}</p></div>`)+group('句子分析',sentence,x=>`<div class="result-card"><h3>${text(x.sentence)}</h3><p>${text(x.translation)}</p></div>`)+group('术语',term,x=>`<div class="result-card clickable" data-term-query="${text(x.en||x.cn)}"><h3>${text(x.en||x.cn)} ${x.ipa?`<span class="ipa-inline">${text(x.ipa)}</span>`:''}</h3><p>${text(x.cn||x.simple_explanation||x.note||'')}</p></div>`)+group('佛典阅读',buddhist,x=>`<div class="result-card"><h3>${text(x.title||x.pali||x.id)}</h3><p>${text(x.structure||x.basic||x.natural||'')}</p></div>`)+group('词形分析',tokenKeys,k=>`<div class="result-card clickable" data-lookup-word="${text(k)}"><h3>${text(k)}</h3><p>${text(tokens[k]?.analyses?.[0]?.meaning||'')}</p></div>`);
}
// Global event handling: one listener only.
document.addEventListener('click', async (e)=>{
  const nav=e.target.closest('[data-page]');
  if(nav){
    const page=nav.dataset.page;
    const params={};
    if(nav.dataset.module) params.module=nav.dataset.module;
    if(nav.dataset.priority) params.priority=nav.dataset.priority;
    navigate(page,params); return;
  }
  const module=e.target.closest('[data-module]'); if(module){navigate('moduleLessons',{module:module.dataset.module});return;}
  const lesson=e.target.closest('[data-lesson]'); if(lesson){navigate('lesson',{lessonId:Number(lesson.dataset.lesson)});return;}
  const action=e.target.closest('[data-action]');
  if(action){
    const a=action.dataset.action;
    if(a==='top') top();
    if(a==='prev') goPrev();
    if(a==='startExercise'){
      const ex=await loadData('exercise'); const mod=$('#exerciseModule')?.value||'全部'; const n=Number($('#exerciseCount')?.value||10); const items=ex.filter(x=>mod==='全部'||x.module===mod).slice(0,500); startExercise(items.sort(()=>Math.random()-.5).slice(0,n));
    }
    if(a==='submitExercise') submitExercise();
    if(a==='nextExercise'){exerciseIndex++; renderExerciseQuestion();}
    if(a==='analyzeToken') analyzeToken();
    if(a==='clearLookup'){$('#lookupInput').value='';$('#tokenPanel').innerHTML='';}
    if(a==='nextSentence'){const sel=$('#sentenceSelect'); if(sel&&sel.options.length){sel.selectedIndex=(sel.selectedIndex+1)%sel.options.length; renderSentenceCard('translation')}}
    if(a==='clearWrong'){if(confirm('确定清空错题吗？')){saveWrong({});renderWrong()}}
    if(a==='copyProgress'){navigator.clipboard?.writeText($('#progressText').value); alert('已复制备份。')}
    if(a==='importProgress'){try{const d=JSON.parse($('#progressText').value); if(d.lessonStatus) localStorage.setItem(LESSON_STATUS_KEY,JSON.stringify(d.lessonStatus)); if(d.wrong) localStorage.setItem(WRONG_KEY,JSON.stringify(d.wrong)); if(d.sentenceStatus) localStorage.setItem(SENT_STATUS_KEY,JSON.stringify(d.sentenceStatus)); alert('已导入。');}catch{alert('导入失败，请检查 JSON 格式。')}}
    return;
  }
  const choice=e.target.closest('[data-choice]'); if(choice){selectedChoice=choice.dataset.choice; $all('.option').forEach(x=>x.classList.remove('selected')); choice.classList.add('selected');return;}
  const setStatus=e.target.closest('[data-set-status]'); if(setStatus){setLessonStatus(currentLessonId,setStatus.dataset.setStatus);return;}
  const startLesson=e.target.closest('[data-start-lesson-exercise]'); if(startLesson){const items=await loadLessonExercises(currentLessonId); navigate('exercise',{},true); setTimeout(()=>startExercise(items),100);return;}
  const term=e.target.closest('[data-term-query]'); if(term){navigate('terminology',{query:term.dataset.termQuery});return;}
  const lookup=e.target.closest('[data-lookup-word]'); if(lookup){navigate('dictionary',{word:lookup.dataset.lookupWord});return;}
  const search=e.target.closest('[data-search-query]'); if(search){navigate('search',{query:search.dataset.searchQuery});return;}
  const sentStep=e.target.closest('[data-sentence-step]'); if(sentStep){renderSentenceCard(sentStep.dataset.sentenceStep);return;}
  const sentStatus=e.target.closest('[data-sentence-status]'); if(sentStatus){const item=currentSentence(); if(item){const m=sentenceStatusMap();m[item.id]=sentStatus.dataset.sentenceStatus;saveSentenceStatus(m);refreshSentenceSelect();}return;}
  const training=e.target.closest('[data-training]'); if(training){startTraining(training.dataset.training);return;}
});
document.addEventListener('change',(e)=>{
  if(e.target?.id==='sentencePriority'||e.target?.id==='sentenceLevel') refreshSentenceSelect();
  if(e.target?.id==='sentenceSelect') renderSentenceCard('translation');
});
document.addEventListener('click',(e)=>{
  const t=e.target.closest('.ipa-term'); if(t){t.classList.toggle('show-ipa')}
});
// Clean old service worker registration without registering a new one.
(async function cleanupOldSW(){try{if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations(); for(const r of regs) await r.unregister();}}catch(e){}})();
// Initial route
window.addEventListener('DOMContentLoaded',()=>navigate('home',{},false));
