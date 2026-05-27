/* Pāli Learning Lab · 20.55 分板块体验优化版
   纯 HTML/CSS/JS；无构建、无 service worker；GitHub Pages 可直接部署。
*/
const VERSION = '20.55 分板块体验优化版';
const FILE = {
  grammarIndex: 'grammar-index.json',
  manifest: 'grammar-lesson-manifest.json',
  moduleIndex: 'module-index.json',
  moduleDirectory: 'grammar-module-directory.json',
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
const EXERCISE_SESSION_KEY='pll_exercise_session_v1';
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
function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'})}
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
  renderPage(page,params).then(scrollToTop).catch(showError);
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
  if(page==='readingMethod') return renderAcademicSubpage('阅读方法','method');
  if(page==='citationGuide') return renderAcademicSubpage('引用规范','citation');
  if(page==='meaningObservation') return renderAcademicSubpage('词义观察','meaning');
  if(page==='recordTemplate') return renderAcademicSubpage('原文记录模板','record');
  if(page==='readingTasks') return renderAcademicSubpage('阅读小任务','tasks');
  if(page==='readingPitfalls') return renderAcademicSubpage('阅读误区','pitfalls');
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
${homeCard('阅读方法','从原文、翻译、语法标注到阅读记录。','readingMethod')}
${homeCard('引用规范','DN、MN、SN、AN、Dhp 等常用略号与引用原则。','citationGuide')}
${homeCard('词义观察','从词典义进入搭配、语境和佛典义。','meaningObservation')}
${homeCard('原文记录模板','原文、翻译、语法、位置和备注分栏记录。','recordTemplate')}
${homeCard('阅读小任务','适合初学者的短句阅读任务。','readingTasks')}
${homeCard('阅读误区','避免只看译文、忽略词形和出处。','readingPitfalls')}
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
function exerciseIsRelevantToLesson(lesson,ex){
  if(!lesson||!ex) return true;
  const fs=exampleFocusSets(lesson);
  if(!fs) return true;
  const blob=[ex.question,ex.answer,ex.explanation,...(ex.options||[])].join(' ');
  const hasAlien=fs.alien.some(t=>blob.includes(t));
  const hasFocus=fs.focus.some(t=>blob.includes(t));
  return !hasAlien || hasFocus;
}
async function loadLessonExercises(id,lesson=null){
  const ex=await loadData('exercise').catch(()=>[]);
  const items=(ex||[]).filter(x=>Number(x.lesson_id)===Number(id));
  return lesson ? items.filter(x=>exerciseIsRelevantToLesson(lesson,x)) : items;
}
function isGenericPedagogyLine(x){
  const s=String(x||'').trim();
  return !s || /本课目标|学习目标/.test(s)
    || /不要求|不需要|只要求|无需|后续再|以后再/.test(s)
    || /避免只背中文意思|只背中文意思|不看本课形式|只观察中文翻译|提前做完整句子分析/.test(s)
    || /遇到不确定|结合教材|老师讲解|词典复核|按语境判断/.test(s);
}
function cleanGoalList(lesson){
  const arr=[];
  (lesson.learning_goals||[]).forEach(x=>arr.push(x));
  (lesson.minimal_mastery||[]).forEach(x=>arr.push(x));
  const cleaned=dedupe(arr.map(x=>String(x).trim()).filter(x=>!isGenericPedagogyLine(x)));
  return cleaned.slice(0,3);
}
const ABBRS=[
 ['n.','noun，名词','noun','/naʊn/'],['v.','verb，动词','verb','/vɝːb/'],['pron.','pronoun，代词','pronoun','/ˈproʊnaʊn/'],['adj.','adjective，形容词','adjective','/ˈædʒɪktɪv/'],['adv.','adverb，副词','adverb','/ˈædvɝːb/'],['ind.','indeclinable，不变词','indeclinable','/ˌɪndɪˈklaɪnəbəl/'],['num.','numeral，数词','numeral','/ˈnuːmərəl/'],
 ['m.','masculine，阳性','masculine','/ˈmæskjəlɪn/'],['f.','feminine，阴性','feminine','/ˈfemənɪn/'],['sg.','singular，单数','singular','/ˈsɪŋɡjələr/'],['pl.','plural，复数','plural','/ˈplʊrəl/'],
 ['nom.','nominative，主格','nominative','/ˈnɑːmɪnətɪv/'],['acc.','accusative，宾格','accusative','/əˈkjuːzətɪv/'],['ins.','instrumental，工具格','instrumental','/ˌɪnstrəˈmentəl/'],['dat.','dative，与格','dative','/ˈdeɪtɪv/'],['abl.','ablative，从格','ablative','/ˈæblətɪv/'],['gen.','genitive，属格','genitive','/ˈdʒenətɪv/'],['loc.','locative，处格','locative','/ˈlɑːkətɪv/'],['voc.','vocative，呼格','vocative','/ˈvɑːkətɪv/'],
 ['prs.','present，现在时','present','/ˈprezənt/'],['fut.','future，将来时','future','/ˈfjuːtʃər/'],['aor.','aorist，不定过去时','aorist','/ˈeɪərɪst/'],['impf.','imperfect，未完成过去时','imperfect','/ɪmˈpɝːfɪkt/'],['perf.','perfect，完成时','perfect','/ˈpɝːfɪkt/'],
 ['indic.','indicative，陈述语气','indicative','/ɪnˈdɪkətɪv/'],['imp.','imperative，命令语气','imperative','/ɪmˈperətɪv/'],['opt.','optative，祈愿语气/可能语气','optative','/ˈɑːptətɪv/'],['cond.','conditional，条件语气','conditional','/kənˈdɪʃənəl/'],
 ['act.','active，主动语态','active','/ˈæktɪv/'],['mid.','middle，中间语态','middle','/ˈmɪdəl/'],['pass.','passive，被动语态','passive','/ˈpæsɪv/'],
 ['1sg','first person singular，第一人称单数','first person singular',''],['2sg','second person singular，第二人称单数','second person singular',''],['3sg','third person singular，第三人称单数','third person singular',''],['1pl','first person plural，第一人称复数','first person plural',''],['2pl','second person plural，第二人称复数','second person plural',''],['3pl','third person plural，第三人称复数','third person plural',''],
 ['inf.','infinitive，不定式','infinitive','/ɪnˈfɪnətɪv/'],['ger.','gerund / absolutive，连续体/绝对分词','gerund / absolutive','/ˈdʒerənd/'],['pr.p.','present participle，现在分词','present participle','/ˈprezənt ˈpɑːrtɪsɪpəl/'],['p.p.','past participle，过去分词','past participle','/pæst ˈpɑːrtɪsɪpəl/'],['f.p.p.','future passive participle，将来被动分词','future passive participle','/ˈfjuːtʃər ˈpæsɪv ˈpɑːrtɪsɪpəl/']
];
function abbrHTML(lesson){
  const blob=JSON.stringify(lesson);
  const hits=ABBRS.filter(a=>blob.includes(a[0]));
  if(!hits.length) return '';
  const body=`<div class="abbr-list">${hits.map(a=>`<div class="abbr-line">${a[0]} = ${a[2]}，${a[1].split('，')[1]||''}</div>`).join('')}</div>`;
  return `<section class="card compact"><details class="abbr-details"><summary>语法标注</summary>${body}</details></section>`;
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
const PALI_SMALL=new Set(['ca','na','mā','vā','va','kho','iti','atha','eva','api','pana','ce','hi']);
const GRAMMAR_WORD_BLACKLIST=new Set(['sg','pl','nom','acc','gen','dat','loc','ins','abl','voc','prs','pres','indic','act','mid','pass','m','f','n','nt','ger','inf','pp','fpp','pr','ind','root','html','css','json','lesson','module','grammar','pali','review','learning','lab','note','table','data','true','false','id','title','summary','text','card','chunk','file','ipa','the','and','or','to','of','in','for','with']);
const PALI_LEXICON={
  Buddha:{pos:'noun',gender:'m.',meaning:'佛；觉者'},Dhamma:{pos:'noun',gender:'m.',meaning:'法；教法'},Saṅgha:{pos:'noun',gender:'m.',meaning:'僧伽；僧团'},Bhagavā:{pos:'noun',gender:'m.',meaning:'世尊'},Tathāgata:{pos:'noun',gender:'m.',meaning:'如来'},Brahmā:{pos:'noun',gender:'m.',meaning:'梵天'},
  dhamma:{pos:'noun',gender:'m.',meaning:'法；教法；现象'},bhikkhu:{pos:'noun',gender:'m.',meaning:'比丘'},vihāra:{pos:'noun',gender:'m.',meaning:'寺院；住处'},purisa:{pos:'noun',gender:'m.',meaning:'人；男子'},sāvaka:{pos:'noun',gender:'m.',meaning:'弟子；声闻'},gāma:{pos:'noun',gender:'m.',meaning:'村庄'},patta:{pos:'noun',gender:'m.',meaning:'钵'},sadda:{pos:'noun',gender:'m.',meaning:'声音'},samaya:{pos:'noun',gender:'m.',meaning:'时间；时候'},attha:{pos:'noun',gender:'m.',meaning:'意义；利益；目的'},kāya:{pos:'noun',gender:'m.',meaning:'身；身体'},loka:{pos:'noun',gender:'m.',meaning:'世间；世界'},
  citta:{pos:'noun',gender:'n.',meaning:'心；心识'},phala:{pos:'noun',gender:'n.',meaning:'果；结果'},rūpa:{pos:'noun',gender:'n.',meaning:'色；形态'},kamma:{pos:'noun',gender:'n.',meaning:'业；行为'},saraṇa:{pos:'noun',gender:'n.',meaning:'皈依处；庇护'},cetiya:{pos:'noun',gender:'n.',meaning:'塔庙；圣迹'},sutta:{pos:'noun',gender:'n.',meaning:'经；经文'},dukkha:{pos:'noun',gender:'n.',meaning:'苦；不圆满'},nāma:{pos:'noun',gender:'n.',meaning:'名；名称'},mana:{pos:'noun',gender:'n.',meaning:'意；心'},
  paññā:{pos:'noun',gender:'f.',meaning:'智慧'},itthi:{pos:'noun',gender:'f.',meaning:'女子'},Sāvatthī:{pos:'noun',gender:'f.',meaning:'舍卫城'},vibhatti:{pos:'noun',gender:'f.',meaning:'词尾变化；格变化'},gāthā:{pos:'noun',gender:'f.',meaning:'偈颂'},bhūmi:{pos:'noun',gender:'f.',meaning:'地；层级'},
  gacchati:{pos:'verb',root:'√gam',meaning:'去；行走'},āgacchati:{pos:'verb',root:'√gam',meaning:'来；到来'},deseti:{pos:'verb',root:'√dis',meaning:'说示；开示；教导'},suṇāti:{pos:'verb',root:'√su',meaning:'听；听闻'},hoti:{pos:'verb',root:'√bhū',meaning:'是；成为；存在'},bhavati:{pos:'verb',root:'√bhū',meaning:'成为；存在；发生'},karoti:{pos:'verb',root:'√kar',meaning:'做；作'},vasati:{pos:'verb',root:'√vas',meaning:'住；居住'},viharati:{pos:'verb',root:'√har',meaning:'住；停留；安住'},passati:{pos:'verb',root:'√pass',meaning:'看见；观察'},labhati:{pos:'verb',root:'√labh',meaning:'得到；获得'},icchati:{pos:'verb',root:'√is',meaning:'想要；希望'},vandati:{pos:'verb',root:'√vand',meaning:'礼敬；敬礼'},pasīdati:{pos:'verb',root:'√sad',meaning:'欢喜；生信；澄净'},patati:{pos:'verb',root:'√pat',meaning:'落下；掉落'},āroceti:{pos:'verb',root:'√ruc',meaning:'告知；报告'},pavisati:{pos:'verb',root:'√vis',meaning:'进入'},dadāti:{pos:'verb',root:'√dā',meaning:'给；给予'},vadati:{pos:'verb',root:'√vad',meaning:'说'},āha:{pos:'verb',root:'√ah',meaning:'说；说道'},avoca:{pos:'verb',root:'√vac',meaning:'说了'},
  ca:{pos:'other',grammar:'ind.',meaning:'和；并且；也'},vā:{pos:'other',grammar:'ind.',meaning:'或者'},na:{pos:'other',grammar:'ind.',meaning:'不；非'},mā:{pos:'other',grammar:'ind.',meaning:'不要；勿'},kho:{pos:'other',grammar:'ind.',meaning:'确实；于是；常不直译'},atha:{pos:'other',grammar:'ind.',meaning:'于是；然后'},eva:{pos:'other',grammar:'ind.',meaning:'正是；唯有；即'},api:{pos:'other',grammar:'ind.',meaning:'也；甚至'},pana:{pos:'other',grammar:'ind.',meaning:'又；而；于是'},ce:{pos:'other',grammar:'ind.',meaning:'如果'},hi:{pos:'other',grammar:'ind.',meaning:'因为；确实'},so:{pos:'pron',grammar:'pron.',meaning:'他；那'},te:{pos:'pron',grammar:'pron.',meaning:'他们；那些'},yo:{pos:'pron',grammar:'pron.',meaning:'谁；凡是……者'},me:{pos:'pron',grammar:'pron.',meaning:'我的；于我；由我'},taṃ:{pos:'pron',grammar:'pron.',meaning:'那个；它；他'}
};
const VERB_3SG_MAP={
  gacchati:'gacchati',gacchāmi:'gacchati',gacchasi:'gacchati',gacchanti:'gacchati',gacchatha:'gacchati',gacchāma:'gacchati',gaccha:'gacchati',gacchatu:'gacchati',gaccheyya:'gacchati',gaccheyyuṃ:'gacchati',gamissati:'gacchati',gamissāmi:'gacchati',agamāsi:'gacchati',agamaṃ:'gacchati',gantuṃ:'gacchati',gantvā:'gacchati',gacchanto:'gacchati',gacchantī:'gacchati',gata:'gacchati',
  āgacchati:'āgacchati',āgacchanti:'āgacchati',āgacchāmi:'āgacchati',āgantuṃ:'āgacchati',āgantvā:'āgacchati',
  suṇāti:'suṇāti',suṇāmi:'suṇāti',suṇanti:'suṇāti',suṇātha:'suṇāti',sotuṃ:'suṇāti',sutvā:'suṇāti',suta:'suṇāti',
  deseti:'deseti',desenti:'deseti',desetuṃ:'deseti',desetvā:'deseti',desessati:'deseti',
  karoti:'karoti',karomi:'karoti',karonti:'karoti',kareyya:'karoti',akāsi:'karoti',kātuṃ:'karoti',kattum:'karoti',katvā:'karoti',kata:'karoti',kattabba:'karoti',karaṇīya:'karoti',
  hoti:'hoti',honti:'hoti',ahosi:'hoti',bhavati:'bhavati',bhavissati:'bhavati',bhavituṃ:'bhavati',
  labhati:'labhati',labhanti:'labhati',labhāmi:'labhati',labhate:'labhati',
  vasati:'vasati',vasanti:'vasati',viharati:'viharati',viharanti:'viharati',passati:'passati',passāmi:'passati',passanti:'passati',patati:'patati',patanti:'patati',icchati:'icchati',icchāmi:'icchati',vandati:'vandati',vandāmi:'vandati',pasīdati:'pasīdati',āroceti:'āroceti',pavisati:'pavisati',dadāti:'dadāti',vadati:'vadati',āha:'āha',avoca:'avoca'
};
function tokenizePali(s){return dedupe(String(s||'').match(/[A-Za-zĀāĪīŪūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ]+/g)||[])}
function normalizePaliToken(tok){return String(tok||'').trim().replace(/[“”"'.,;:!?，。；：！？()（）\[\]{}<>]/g,'')}
function lexemeKey(form){return String(form||'').toLowerCase().normalize('NFC')}
function canonicalLexeme(form){
  form=normalizePaliToken(form);
  if(PALI_LEXICON[form]) return form;
  const low=form.toLowerCase();
  if(PALI_LEXICON[low]) return low;
  return form;
}
function inferGenderFromGrammar(grammar){
  const g=String(grammar||'');
  if(/\bm\.\s*sg|阳性|m\.sg|m\./.test(g)) return 'm.';
  if(/\bf\.\s*sg|阴性|f\.sg|f\./.test(g)) return 'f.';
  if(/\bn\.\s*sg|nt\.|中性|n\.sg|n\./.test(g)) return 'n.';
  return '';
}
function genderCn(g){return g==='m.'?'阳性名词':g==='f.'?'阴性名词':g==='n.'?'中性名词':'名词'}
function lemmaNoun(tok){
  tok=canonicalLexeme(normalizePaliToken(tok));
  if(!tok||tok.length<2) return '';
  const lex=PALI_LEXICON[tok]; if(lex?.pos==='noun') return tok;
  if(tok.endsWith('ssa')) return canonicalLexeme(tok.slice(0,-3));
  if(tok.endsWith('ena')) return canonicalLexeme(tok.slice(0,-3)+'a');
  if(tok.endsWith('āyaṃ')) return canonicalLexeme(tok.slice(0,-4)+'ā');
  if(tok.endsWith('āya')) return canonicalLexeme(tok.slice(0,-3)+'ā');
  if(tok.endsWith('ānaṃ')) return canonicalLexeme(tok.slice(0,-4)+'a');
  if(tok.endsWith('āhi')||tok.endsWith('ābhi')) return canonicalLexeme(tok.slice(0,-3)+'ā');
  if(tok.endsWith('ehi')||tok.endsWith('ebhi')) return canonicalLexeme(tok.slice(0,-3)+'a');
  if(tok.endsWith('esu') && tok.length>5) return canonicalLexeme(tok.slice(0,-3)+'a');
  if(tok.endsWith('e') && tok.length>4) return canonicalLexeme(tok.slice(0,-1)+'a');
  if(tok.endsWith('o') && tok.length>3) return canonicalLexeme(tok.slice(0,-1)+'a');
  if(tok.endsWith('aṃ') && tok.length>3) return canonicalLexeme(tok.slice(0,-2)+'a');
  if(tok.endsWith('ā') && PALI_LEXICON[tok]?.pos==='noun') return tok;
  if(tok.endsWith('ṃ') && tok.length>3) return canonicalLexeme(tok.slice(0,-1));
  return canonicalLexeme(tok);
}
function tokenDataLookup(raw, canonical){
  const tokenData=cache.get(FILE.token[0]+'::'+FILE.token[1])||{};
  return tokenData[raw]||tokenData[canonical]||tokenData[String(raw||'').toLowerCase()]||tokenData[String(canonical||'').toLowerCase()]||null;
}
function meaningFromAnalysis(item, fallback){
  const m=item?.analyses?.find(a=>a.meaning)?.meaning || '';
  return m || fallback || '';
}
function canonicalVerb(tok){
  tok=normalizePaliToken(tok); if(!tok) return '';
  if(VERB_3SG_MAP[tok]) return VERB_3SG_MAP[tok];
  if(/ti$/i.test(tok) && tok.toLowerCase()!=='iti' && tok.toLowerCase()!=='ti') return tok;
  return '';
}
function grammarForVerb(v){
  const lex=PALI_LEXICON[v]||{};
  return lex.root||'';
}
function grammarForNoun(lemma,item){
  const lex=PALI_LEXICON[lemma]||{};
  return lex.gender||inferGenderFromGrammar(item?.analyses?.find(a=>a.grammar)?.grammar||'');
}
function classifyToken(tok){
  tok=canonicalLexeme(normalizePaliToken(tok));
  if(!tok || tok.length<2) return null;
  const low=tok.toLowerCase().replace(/\.$/,'');
  if(tok.length===1 || tok==='ti' || low==='ti' || GRAMMAR_WORD_BLACKLIST.has(low)) return null;
  if(tok.length<=3 && !PALI_SMALL.has(tok) && !PALI_LEXICON[tok]) return null;
  if(/^[A-Z]{2,}$/.test(tok)) return null;
  const v=canonicalVerb(tok);
  if(v && PALI_LEXICON[v]?.pos==='verb'){
    const item=tokenDataLookup(tok,v);
    return {form:v,type:'verb',grammar:grammarForVerb(v),meaning:PALI_LEXICON[v]?.meaning||meaningFromAnalysis(item,'常用动词；需结合巴利词典复核')};
  }
  if(PALI_LEXICON[tok]?.pos==='pron'){
    const item=tokenDataLookup(tok,tok); const lex=PALI_LEXICON[tok]||{};
    return {form:tok,type:'pronoun',grammar:'pron.',meaning:lex.meaning||meaningFromAnalysis(item,'代词；按语境判断')};
  }
  if(PALI_LEXICON[tok]?.pos==='adj'){
    const item=tokenDataLookup(tok,tok); const lex=PALI_LEXICON[tok]||{};
    return {form:tok,type:'adjective',grammar:'adj.',meaning:lex.meaning||meaningFromAnalysis(item,'形容词；按语境判断')};
  }
  if(PALI_SMALL.has(tok) || PALI_LEXICON[tok]?.pos==='other'){
    const item=tokenDataLookup(tok,tok); const lex=PALI_LEXICON[tok]||{};
    return {form:tok,type:'other',grammar:lex.grammar||'ind.',meaning:lex.meaning||meaningFromAnalysis(item,'小词；按语境判断')};
  }
  const lemma=lemmaNoun(tok);
  if(!lemma || lemma.length<2 || (lemma.length<=3 && !PALI_LEXICON[lemma])) return null;
  const item=tokenDataLookup(tok,lemma); const lex=PALI_LEXICON[lemma]||{};
  const g=grammarForNoun(lemma,item);
  const hasNounEvidence=lex.pos==='noun' || g;
  if(!hasNounEvidence || !g) return null;
  return {form:lemma,type:'noun',grammar:g,meaning:lex.meaning||meaningFromAnalysis(item,'名词；需结合巴利词典复核')};
}
async function vocabHTML(lesson,exercises){
  await loadData('token').catch(()=>null);
  const parts=[];
  (lesson.examples||[]).forEach(e=>parts.push(e.pali,e.note,e.grammar_note));
  (lesson.table||[]).flat().forEach(x=>parts.push(x));
  (exercises||[]).slice(0,40).forEach(e=>parts.push(e.question,e.answer,...(e.options||[]),e.explanation));
  const tokens=dedupe(parts.flatMap(tokenizePali));
  const map=new Map();
  tokens.map(classifyToken).filter(Boolean).forEach(v=>{const k=lexemeKey(v.form); if(!map.has(k)) map.set(k,v)});
  const order={verb:1,noun:2,pronoun:3,adjective:4,other:5};
  let rows=[...map.values()].sort((a,b)=>(order[a.type]-order[b.type])||a.form.localeCompare(b.form)).slice(0,24);
  if(!rows.length) return '';
  const table=`<div class="table-wrap"><table class="vocab-table"><thead><tr><th>词形</th><th>语法信息</th><th>基本义</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${text(r.form)}</td><td>${text(r.grammar)}</td><td>${text(r.meaning)}</td></tr>`).join('')}</tbody></table></div>`;
  const body=rows.length>8?`<details class="vocab-details"><summary>本节单词（${rows.length} 个，点击展开）</summary>${table}</details>`:table;
  return `<section class="card compact"><div class="section-title"><h3>本节单词</h3></div>${body}</section>`;
}
function exampleFocusSets(lesson){
  const title=String(lesson.title||'');
  if(/-a 尾中性名词|中性名词/.test(title)) return {focus:['citta','phala','rūpa','kamma','saraṇa'], alien:['Buddho','Buddhena','Buddhassa','paññā','paññaṃ','paññāya']};
  if(/-a 尾阳性名词|阳性名词/.test(title)) return {focus:['Buddha','Buddho','Buddhaṃ','dhamma','dhammaṃ','purisa','loka'], alien:['paññā','paññaṃ','phala','phalaṃ','rūpa','rūpaṃ']};
  if(/-ā 尾阴性名词|阴性名词/.test(title)) return {focus:['paññā','paññaṃ','paññāya','gāthā','itthi','bhūmi'], alien:['Buddho','Buddhaṃ','phala','phalaṃ','rūpa','rūpaṃ']};
  return null;
}
function relevantExamples(lesson){
  const examples=lesson.examples||[];
  const fs=exampleFocusSets(lesson);
  if(!fs) return examples;
  const kept=examples.filter(e=>{
    const blob=[e.pali,e.cn,e.natural_cn,e.note,e.grammar_note].join(' ');
    const hasFocus=fs.focus.some(t=>blob.includes(t));
    const hasAlien=fs.alien.some(t=>blob.includes(t));
    return hasFocus || !hasAlien;
  });
  return kept.length ? kept : examples;
}
function normalizeGrammarLine(line){
  return String(line||'')
    .replace(/\b(prs|fut|aor|impf|perf)\.ind\./g, '$1.indic.')
    .replace(/陈述·主动·/g, '陈述语气·主动语态·')
    .replace(/陈述·被动·/g, '陈述语气·被动语态·')
    .replace(/陈述·中间·/g, '陈述语气·中间语态·')
    .replace(/陈述·主动\)/g, '陈述语气·主动语态）')
    .replace(/陈述·被动\)/g, '陈述语气·被动语态）')
    .replace(/不定过去·陈述语气/g, '不定过去时·陈述语气')
    .replace(/，/g, ', ')
    .replace(/\s+/g,' ')
    .trim();
}
function examplesHTML(lesson){
  const items=relevantExamples(lesson).map(e=>{
    const parse=normalizeGrammarLine(e.grammar_note||e.note||'');
    return `<div class="example"><div class="pali">${text(e.pali||'')}</div><div class="translation"><strong>翻译：</strong>${text(e.natural_cn||e.cn||'')}</div>${parse?`<div class="note"><strong>语法解析：</strong>${text(parse)}</div>`:''}</div>`;
  }).join('');
  return items?`<section class="card compact"><div class="section-title"><h3>例句</h3></div>${items}</section>`:'';
}
function tableHTML(lesson){
  if(!lesson.table?.length) return '';
  return `<section class="card compact"><div class="section-title"><h3>形式与结构</h3></div><div class="table-wrap"><table>${lesson.table.map(row=>`<tr>${row.map(c=>`<td>${text(c)}</td>`).join('')}</tr>`).join('')}</table></div></section>`;
}
function lessonSpecificGrammarNotes(lesson){
  const title=String(lesson.title||'');
  const cat=String(lesson.category||'');
  const notes=[];
  if(/-a 尾中性名词|中性名词/.test(title)){
    notes.push('-a 尾中性名词的核心特点是单数主格和宾格常同形，如 phalaṃ 既可能作主语，也可能作宾语，必须结合动词判断句法功能。');
    notes.push('复数主格/宾格通常用 -āni，如 phalāni、cittāni、rūpāni。');
    notes.push('属格单数常用 -assa，如 phalassa，可表示“……的”或限定关系。');
  } else if(/-a 尾阳性名词|阳性名词/.test(title)){
    notes.push('-a 尾阳性名词常见单数主格为 -o，宾格为 -aṃ，属格为 -assa。');
    notes.push('主格通常作主语，宾格通常作动作对象；不要只凭词序判断句法功能。');
    notes.push('学习这一类名词时，应把词干、词尾和句中功能一起观察。');
  } else if(/-ā 尾阴性名词|阴性名词/.test(title)){
    notes.push('-ā 尾阴性名词常见单数主格为 -ā，宾格为 -aṃ，工具/与格/属格可见 -āya。');
    notes.push('阴性名词的词尾变化不能套用 -a 尾阳性名词表。');
    notes.push('分析例句时先确定该名词在句中是主语、宾语还是修饰/限定成分。');
  } else if(/现在时|vattamānā/.test(title)){
    notes.push('现在时常表示当前动作、习惯动作或一般事实。');
    notes.push('主动现在时要同时观察词干和人称数词尾，如 -ti、-anti、-mi、-ma。');
    notes.push('动词语法解析采用“时态.语气.语态.人称数”的顺序，如 prs.indic.act.3sg。');
  } else if(/inf\.|不定式/.test(title)){
    notes.push('inf. 通常表示目的或动作内容，常见词尾为 -tuṃ、-ituṃ、-etuṃ。');
    notes.push('inf. 不是限定动词，本身不标出人称和数。');
    notes.push('判断 inf. 时要看它与主句动词的关系，如“为了……”“想要……”。');
  } else if(/ger\.|连续体|absolutive/.test(title)){
    notes.push('ger. 常表示先行动作，可译为“……之后”。');
    notes.push('常见形式包括 -tvā、-itvā、-tvāna、-ya。');
    notes.push('ger. 不带人称数，通常依附主句限定动词来构成动作顺序。');
  } else if(/主格|nominative/.test(title)){
    notes.push('主格常作主语，也可用于名词性表语。');
    notes.push('巴利语不能只靠词序判断主语，应结合词尾和限定动词。');
    notes.push('中性名词主格可能与宾格同形，必须结合句法功能判断。');
  } else if(/宾格|accusative/.test(title)){
    notes.push('宾格常表示动作对象，也可表示方向、时间范围或空间范围。');
    notes.push('看到 -ṃ 不能机械判断为宾格，因为中性名词主格也可能同形。');
    notes.push('分析时先找限定动词，再看该名词是否受动词支配。');
  } else if(/工具格|instrumental/.test(title)){
    notes.push('工具格常表示工具、方式、伴随，也可表示被动结构中的施事。');
    notes.push('常见译法包括“以、用、由、与……一起”。');
    notes.push('工具格要结合动词语义判断，不宜只用一个中文词硬套。');
  } else if(/属格|genitive/.test(title)){
    notes.push('属格常表示所属、关系、来源或部分整体。');
    notes.push('属格与与格常有同形形式，需要结合上下文判断。');
    notes.push('属格短语通常修饰名词，不一定是句子核心论元。');
  } else if(/处格|locative/.test(title)){
    notes.push('处格常表示地点、时间或范围，可译为“在……中/于……”。');
    notes.push('处格通常不是动作对象，应与宾格区分。');
    notes.push('地点处格常与 vasati、viharati 等动词同现。');
  } else if(/na：|mā：|否定/.test(title)){
    notes.push('na 是普通否定，常否定动词、形容词或判断。');
    notes.push('mā 多用于禁止、劝止，通常译为“不要、勿”。');
    notes.push('分析否定句时，要先判断否定词作用于哪个动词或判断。');
  } else if(/ca：|vā：|iti|ti：|不变词|ind\./.test(title)||cat==='ind.'){
    notes.push('ind. 只表示 indeclinable“不变词”，不能用来表示陈述语气。');
    notes.push('不变词本身不变格，但常决定并列、选择、否定、引语或语气功能。');
    notes.push('ti 只有明确作引语标记时才作为独立不变词分析，不能把动词词尾 -ti 误认为 ti。');
  }
  return notes;
}
function cleanExplanationList(lesson){
  const arr=[...lessonSpecificGrammarNotes(lesson),...(lesson.explanation||[])];
  return dedupe(arr.map(x=>String(x).trim()).filter(x=>x && !isGenericPedagogyLine(x))).slice(0,7);
}
function explanationHTML(lesson){
  const arr=cleanExplanationList(lesson);
  return arr.length?`<section class="card compact"><div class="section-title"><h3>语法说明</h3></div><ol>${arr.map(x=>`<li>${text(x)}</li>`).join('')}</ol></section>`:'';
}
function isGenericMistakeLine(x){
  const s=String(x||'').trim();
  return isGenericPedagogyLine(s)
    || /不要只按中文意思|只按中文意思|看到相似词形|先拆词干和词尾/.test(s)
    || /词形、格位、动词形式和句法功能结合/.test(s);
}
function mistakesHTML(lesson){
  const arr=dedupe((lesson.common_mistakes||[]).map(x=>String(x).trim()).filter(x=>x && !isGenericMistakeLine(x))).slice(0,3);
  return arr.length?`<section class="card compact"><div class="section-title"><h3>常见误判</h3></div><ul>${arr.map(x=>`<li>${text(x)}</li>`).join('')}</ul></section>`:'';
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
  const exercises=await loadLessonExercises(id,lesson).catch(()=>[]);
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
let currentExercises=[], exerciseIndex=0, selectedChoice='', currentExerciseMeta={};
function savedExerciseSession(){try{return JSON.parse(localStorage.getItem(EXERCISE_SESSION_KEY)||'null')}catch{return null}}
function saveExerciseSession(){try{if(currentExercises.length)localStorage.setItem(EXERCISE_SESSION_KEY,JSON.stringify({items:currentExercises,index:exerciseIndex,meta:currentExerciseMeta,selectedChoice,saved_at:new Date().toISOString()}))}catch{}}
function clearExerciseSession(){try{localStorage.removeItem(EXERCISE_SESSION_KEY)}catch{}}
async function renderExerciseCenter(){
  const [ex,grammar]=await Promise.all([loadData('exercise'),loadData('grammarIndex')]);
  const modules=dedupe(grammar.map(l=>l.module));
  const lessons=sortLessons(grammar);
  const saved=savedExerciseSession();
  app.innerHTML=`${navControls()}<section class="card"><h2>课程练习</h2><p class="muted">按模块或具体课程抽题。练习题进入本页后才加载。</p>${saved?.items?.length?`<div class="notice"><strong>检测到未完成练习：</strong>已做到第 ${(saved.index||0)+1}/${saved.items.length} 题。<div class="button-row"><button class="primary" data-action="continueExercise">继续上次练习</button><button data-action="clearExerciseSession">清除上次练习</button></div></div>`:''}<label>选择模块</label><select id="exerciseModule"><option value="全部">全部</option>${modules.map(m=>`<option>${text(m)}</option>`).join('')}</select><label>选择课程</label><select id="exerciseLesson"><option value="全部">全部课程</option>${lessons.map(l=>`<option value="${l.id}">${text(l.lesson_number||l.id)}. ${text(l.title)}</option>`).join('')}</select><label>抽题数量</label><select id="exerciseCount"><option>10</option><option>20</option><option>50</option></select><button class="primary" data-action="startExercise">开始练习</button><div id="exerciseArea"></div></section>`;
}
function startExercise(items,meta={}){
  currentExercises=[...items].sort(()=>Math.random()-.5); exerciseIndex=0; selectedChoice=''; currentExerciseMeta=meta; saveExerciseSession(); renderExerciseQuestion();
}
function continueExercise(){
  const saved=savedExerciseSession();
  if(!saved?.items?.length){alert('没有可继续的练习。');return;}
  currentExercises=saved.items; exerciseIndex=Math.min(saved.index||0,currentExercises.length-1); selectedChoice=saved.selectedChoice||''; currentExerciseMeta=saved.meta||{}; renderExerciseQuestion();
}
function renderExerciseQuestion(){
  const area=$('#exerciseArea'); if(!area)return;
  if(!currentExercises.length){area.innerHTML='<p class="muted">当前没有练习题。</p>';return;}
  if(exerciseIndex>=currentExercises.length){clearExerciseSession(); area.innerHTML='<div class="exercise-box"><h3>本轮完成</h3><button class="primary" data-page="wrong">查看错题</button></div>';return;}
  saveExerciseSession();
  const ex=currentExercises[exerciseIndex];
  const options=ex.type==='choice'?(ex.options||[]).map(o=>`<button class="option" data-choice="${text(o)}">${text(o)}</button>`).join(''):`<input id="inputAnswer" placeholder="请输入答案">`;
  area.innerHTML=`<div class="exercise-box"><p class="muted">题目 ${exerciseIndex+1}/${currentExercises.length}｜${text(ex.module||'')}｜${text(ex.lesson_title||'')}</p><h3>${text(ex.question)}</h3>${options}<div class="button-row"><button class="primary" data-action="submitExercise">提交答案</button><button data-action="nextExercise">下一题</button><button class="secondary" data-action="exitExercise">暂时退出</button></div><div id="exerciseFeedback"></div></div>`;
}
function submitExercise(){
  const ex=currentExercises[exerciseIndex]; if(!ex)return;
  const ans=ex.type==='choice'?selectedChoice:($('#inputAnswer')?.value||'');
  if(!String(ans).trim()){alert('请先作答。');return;}
  const good=normalizeAnswer(ans)===normalizeAnswer(ex.answer);
  const wrong=wrongMap();
  if(good) delete wrong[ex.id]; else wrong[ex.id]={...ex,user_answer:ans,wrong_at:new Date().toISOString()};
  saveWrong(wrong); saveExerciseSession();
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
  <div class="entry-card clickable" data-training="reading"><h3>阅读分析</h3><p class="muted">短句阅读、佛典句式和结构判断。</p></div>
  <div class="entry-card clickable" data-training="input"><h3>输入生成</h3><p class="muted">只练需要手动输入答案的题目。</p></div>
  </div><div id="trainingArea"></div></section>`;
}
async function startTraining(kind){
  const ex=await loadData('exercise');
  const rules={
    case:/格|主格|宾格|工具格|处格|属格|与格|从格|呼格|名词/,
    verb:/动词|现在时|将来时|过去|命令|祈愿|人称|词尾|语态/,
    nonfinite:/inf\.|ger\.|分词|gantuṃ|gantvā|sotuṃ|sutvā|p\.p\./,
    particle:/ind\.|na|mā|ca|vā|eva|iti|否定|并列|选择|引语/,
    sentence:/句子|主语|宾语|限定动词|结构/,
    reading:/阅读|佛典|句式|翻译|结构|原文/,
    input:/输入|填写|写出|生成|拼写/
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
  if(['tokens','full'].includes(step)) html+=`<div class="table-wrap"><table class="token-table"><tr><th>词形</th><th>语法信息</th><th>句中功能</th><th>意义</th></tr>${(item.tokens||[]).map(t=>`<tr><td>${text(t.form)}</td><td>${text(normalizeGrammarLine(t.grammar))}</td><td>${text(t.role)}</td><td>${text(t.meaning)}</td></tr>`).join('')}</table></div>`;
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
  panel.innerHTML=`<div class="result-card"><h3>${text(item.form||word)}</h3>${(item.analyses||[]).map(a=>`<p><strong>语法信息：</strong>${text(normalizeGrammarLine(a.grammar))}<br><strong>句中功能：</strong>${text(a.role)}<br><strong>意义：</strong>${text(a.meaning)}</p>`).join('')}${(item.examples||[]).slice(0,4).map(e=>`<div class="example"><div class="pali">${text(e.sentence)}</div><div>翻译：${text(e.translation||'')}</div><div class="note">${text(e.tip||'')}</div></div>`).join('')}</div>`;
}
async function renderTerminology(query=''){
  const data=await loadData('terminology');
  const cats=dedupe(data.map(t=>t.cat||t.category||'其他'));
  app.innerHTML=`${navControls()}<section class="card"><h2>术语库</h2><input id="termSearch" value="${text(query)}" placeholder="搜索 case、nominative、主格、vibhatti"><select id="termCat"><option value="全部">全部</option>${cats.map(c=>`<option>${text(c)}</option>`).join('')}</select><div id="termList" class="result-list"></div></section>`;
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
async function renderAcademicSubpage(title,type){
  const data=await loadData('academic');
  const method=data.method||[], citation=data.citation?.principles||[];
  let html='';
  if(type==='method') html=method.map(m=>`<div class="result-card"><h3>${text(m.title)}</h3><p>${text(m.goal||'')}</p><ol>${(m.steps||[]).map(s=>`<li>${text(s)}</li>`).join('')}</ol></div>`).join('');
  if(type==='citation') html=`<div class="result-card"><h3>常见略号</h3><p>DN = Dīgha-nikāya；MN = Majjhima-nikāya；SN = Saṃyutta-nikāya；AN = Aṅguttara-nikāya；Dhp = Dhammapada。</p></div>`+citation.map(c=>`<div class="result-card"><h3>${text(c.title)}</h3><p>${text(c.content)}</p></div>`).join('');
  if(type==='meaning') html=`<div class="result-card"><h3>从词进入上下文</h3><p>先还原词典形，再观察词形、搭配、句中功能和当前语境义。不要只背一个中文义项。</p></div>`+method.filter(m=>/词|context|上下文|语境/.test([m.title,m.goal].join(' '))).map(m=>`<div class="result-card"><h3>${text(m.title)}</h3><p>${text(m.goal||'')}</p><ol>${(m.steps||[]).map(s=>`<li>${text(s)}</li>`).join('')}</ol></div>`).join('');
  if(type==='record') html=`<div class="result-card"><h3>原文记录模板</h3><div class="table-wrap"><table><tr><th>原文</th><th>翻译</th><th>语法标注</th><th>位置</th><th>阅读备注</th></tr><tr><td>Ekaṃ samayaṃ...</td><td>一时……</td><td>时间宾格、处格、限定动词</td><td>DN/MN/SN/AN/Dhp 等</td><td>说明为什么记录这一句</td></tr></table></div></div>`;
  if(type==='tasks') html=`<div class="result-card"><h3>阅读小任务</h3><ol><li>选择一句短句，先抄原文。</li><li>标出限定动词。</li><li>找主语、宾语和格位成分。</li><li>写自然翻译。</li><li>记录来源和阅读提醒。</li></ol></div>`;
  if(type==='pitfalls') html=`<div class="result-card"><h3>阅读误区</h3><ul><li>只看中文译文，不保存巴利原文。</li><li>只背词典义，不观察搭配和格位。</li><li>忽略 iti / ti、ca、kho、pana 等结构信号。</li><li>不记录出处，导致后续无法复核。</li></ul></div>`;
  app.innerHTML=`${navControls('<button data-page="buddhist">模块页</button>')}<section class="card"><h2>${text(title)}</h2><div class="result-list">${html||'<p class="muted">暂无内容。</p>'}</div></section>`;
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
  box.innerHTML=group('课程',course,x=>`<div class="result-card clickable" data-lesson="${x.id}"><h3>${text(x.lesson_number||x.id)}. ${text(x.title)}</h3><p>${text(x.summary||'')}</p></div>`)+group('句子分析',sentence,x=>`<div class="result-card"><h3>${text(x.sentence)}</h3><p>${text(x.translation)}</p></div>`)+group('术语库',term,x=>`<div class="result-card clickable" data-term-query="${text(x.en||x.cn)}"><h3>${text(x.en||x.cn)} ${x.ipa?`<span class="ipa-inline">${text(x.ipa)}</span>`:''}</h3><p>${text(x.cn||x.simple_explanation||x.note||'')}</p></div>`)+group('佛典阅读',buddhist,x=>`<div class="result-card"><h3>${text(x.title||x.pali||x.id)}</h3><p>${text(x.structure||x.basic||x.natural||'')}</p></div>`)+group('词形分析',tokenKeys,k=>`<div class="result-card clickable" data-lookup-word="${text(k)}"><h3>${text(k)}</h3><p>${text(tokens[k]?.analyses?.[0]?.meaning||'')}</p></div>`);
}


/* 20.55 分板块体验优化：查词、句子分析、术语库、搜索、练习反馈与页面体验。 */
function dictionarySiteCards(sites){
  const extras=[
    {name:'Digital Pāli Dictionary (DPD)',url:'https://dpdict.net/',level:'词形与构词',best_for:'查词形、构词、派生和英文义项，适合进阶复核。',note:'适合复核词根、词类和复合词。'},
    {name:'SuttaCentral Dictionary',url:'https://suttacentral.net/define',level:'经文语境',best_for:'结合 SuttaCentral 语境查常用词。',note:'适合从词义回到经文语境。'},
    {name:'PTS Pāli-English Dictionary',url:'https://dsal.uchicago.edu/dictionaries/pali/',level:'传统巴英',best_for:'复核传统巴英词典义项。',note:'适合作为严谨复核来源。'},
    {name:'Wisdom Library',url:'https://www.wisdomlib.org/definition/',level:'补充参考',best_for:'补充梵巴佛教词汇解释。',note:'需与 Pāli 专门词典交叉核对。'}
  ];
  const all=[...(sites||[]),...extras];
  const seen=new Set();
  return all.filter(s=>{const k=(s.name||s.url||'').toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true;})
    .map(s=>`<div class="entry-card dict-site"><h3>${text(s.name)}</h3><p class="pill">${text(s.level||'词典')}</p><p>${text(s.best_for||'')}</p><p class="muted">${text(s.note||'')}</p><a class="btn primary" href="${text(s.url)}" target="_blank" rel="noopener">打开词典</a></div>`).join('');
}
function cautiousShortWordMessage(word){
  const w=String(word||'').trim().toLowerCase();
  if(w==='ti') return 'ti 只有明确作为独立引语标记时才解释为 ind.；如果只是动词词尾 -ti，不作为独立单词处理。请结合完整句子判断。';
  if(w.length<=3 && !PALI_SMALL.has(w) && !PALI_LEXICON[word] && !PALI_LEXICON[w]) return '该形式很短，可能是词尾、连读片段或未收录词形。请结合完整句子和外部词典复核。';
  return '';
}
function guessDictionaryForm(word,item=null){
  const raw=normalizePaliToken(word);
  if(!raw) return '';
  if(PALI_LEXICON[raw]) return raw;
  if(PALI_LEXICON[raw.toLowerCase()]) return raw.toLowerCase();
  const v=canonicalVerb(raw); if(v) return v;
  const n=lemmaNoun(raw); if(n && (PALI_LEXICON[n] || item)) return n;
  if(item?.form) return item.form;
  return raw;
}
function lookupItemFromTokens(tokens,word){
  const raw=String(word||'').trim();
  const low=raw.toLowerCase();
  const lemma=guessDictionaryForm(raw);
  return tokens[raw]||tokens[low]||tokens[lemma]||tokens[String(lemma||'').toLowerCase()]||null;
}
function lookupSummary(word,tokens){
  const item=lookupItemFromTokens(tokens,word);
  const lemma=guessDictionaryForm(word,item);
  const lex=PALI_LEXICON[lemma]||PALI_LEXICON[String(lemma).toLowerCase()]||{};
  const cautious=cautiousShortWordMessage(word);
  const analyses=item?.analyses||[];
  let confidence='需复核';
  if(item) confidence='高：来自本站词形/例句库';
  else if(lex.pos) confidence='中：根据内置基础词表推断';
  const basic = analyses[0]?.meaning || lex.meaning || (cautious?'需结合句子判断':'未收录，建议查外部词典');
  return {item,lemma,lex,analyses,cautious,confidence,basic};
}
async function renderDictionary(initial=''){
  const [sites,tokens]=await Promise.all([loadData('dictionary'),loadData('token')]);
  const history=lookupHistory();
  app.innerHTML=`${navControls()}<section class="card"><h2>查词</h2><p class="muted">本站提供初步词形线索，正式释义请结合巴利词典和原文语境复核。</p><input id="lookupInput" value="${text(initial)}" placeholder="输入巴利语词形，如 dhammaṃ、Buddho、gacchati"><div class="button-row"><button class="primary" data-action="analyzeToken">分析词形</button><button data-action="clearLookup">清空</button></div><div class="quick-row"><span class="muted">常用示例：</span>${['dhammaṃ','Buddho','gacchati','gantuṃ','gantvā','ca','iti'].map(w=>`<button class="small-chip" data-lookup-word="${w}">${w}</button>`).join('')}</div><div id="tokenPanel"></div></section>
  <section class="card"><h2>短句辅助分析</h2><p class="muted">输入短句后，本站会用已收录词形给出初步线索；未收录词形请继续查外部词典。</p><input id="sentenceLookupInput" placeholder="例如 Buddho dhammaṃ deseti."><button class="primary" data-action="runSentenceLookup">分析短句</button><div id="sentenceLookupPanel"></div></section>
  <section class="card"><h2>外部词典入口</h2><div class="grid">${dictionarySiteCards(sites)}</div></section>
  <section class="card"><h2>查询历史</h2><div class="button-row"><button data-action="clearLookupHistory">清空历史</button></div><div class="quick-row">${history.map(w=>`<button class="concept-btn" data-lookup-word="${text(w)}">${text(w)}</button>`).join('')||'<p class="muted">暂无历史。</p>'}</div></section>`;
  const inp=$('#lookupInput'); inp?.addEventListener('keydown',e=>{if(e.key==='Enter') analyzeToken()});
  if(initial) analyzeToken();
}
function analyzeToken(){
  const word=($('#lookupInput')?.value||'').trim(); const panel=$('#tokenPanel'); if(!panel)return;
  if(!word){panel.innerHTML='<p class="muted">请输入要分析的词形。</p>';return;}
  addLookupHistory(word); const tokens=cache.get(FILE.token[0]+'::'+FILE.token[1])||{}; const s=lookupSummary(word,tokens);
  const analysisBlock=s.analyses.length ? s.analyses.slice(0,4).map(a=>`<div class="lookup-row"><strong>${text(normalizeGrammarLine(a.grammar))}</strong><span>${text(a.role||'')}</span><span>${text(a.meaning||'')}</span></div>`).join('') : `<p>${text(s.lex.pos?((s.lex.pos==='verb'?'动词':s.lex.pos==='noun'?'名词':s.lex.pos)+'；'+(s.lex.gender||s.lex.root||'')):'本站暂未收录明确词形分析。')}</p>`;
  const examples=s.item?.examples?.slice(0,3).map(e=>`<div class="example"><div class="pali">${text(e.sentence)}</div><div>翻译：${text(e.translation||'')}</div><div class="note">${text(e.tip||'')}</div></div>`).join('')||'';
  panel.innerHTML=`<div class="lookup-card"><h3>查询词：${text(word)}</h3>${s.cautious?`<div class="notice">${text(s.cautious)}</div>`:''}<section class="lookup-layer"><h4>第一层：本站初步判断</h4>${analysisBlock}<p><strong>可信度：</strong>${text(s.confidence)}</p></section><section class="lookup-layer"><h4>第二层：可能词典形</h4><p class="lemma-box">${text(s.lemma||word)}</p><p><strong>常见基本义：</strong>${text(s.basic)}</p></section><section class="lookup-layer"><h4>第三层：外部词典复核</h4><p class="muted">建议复制词典形，到 DPD、SuttaCentral、PTS 或 dictionary.sutta.org 中复核具体语境义。</p></section>${examples?`<section class="lookup-layer"><h4>本站例句</h4>${examples}</section>`:''}</div>`;
}
function runSentenceLookup(){
  const s=($('#sentenceLookupInput')?.value||'').trim(); const panel=$('#sentenceLookupPanel'); if(!panel)return;
  if(!s){panel.innerHTML='<p class="muted">请输入一个短句。</p>';return;}
  const tokens=cache.get(FILE.token[0]+'::'+FILE.token[1])||{};
  const rows=tokenizePali(s).map(w=>{const r=lookupSummary(w,tokens); const a=r.analyses[0]; return `<tr><td>${text(w)}</td><td>${text(r.lemma||'')}</td><td>${text(a?normalizeGrammarLine(a.grammar):(r.lex.root||r.lex.gender||''))}</td><td>${text(a?.role||'')}</td><td>${text(a?.meaning||r.basic)}</td></tr>`}).join('');
  panel.innerHTML=`<div class="table-wrap"><table><tr><th>词形</th><th>可能词典形</th><th>语法线索</th><th>句中功能</th><th>基本义</th></tr>${rows}</table></div>`;
}
async function renderSentencePage(priority=''){
  const data=await loadData('sentence');
  const levels=dedupe(data.map(x=>x.level));
  const prios=dedupe(data.map(x=>x.practice_priority||'综合挑战'));
  app.innerHTML=`${navControls()}<section class="card"><h2>句子分析训练</h2><div class="notice"><strong>分析顺序：</strong>先找限定动词 → 找主语 → 找宾语/补足成分 → 看格位成分 → 处理不变词、分词、从句。</div><div class="grid four"><div class="stat"><strong>${data.length}</strong><span>句子总数</span></div><div class="stat"><strong>${Object.values(sentenceStatusMap()).filter(x=>x==='已掌握').length}</strong><span>已掌握</span></div><div class="stat"><strong>${Object.values(sentenceStatusMap()).filter(x=>x==='需复习').length}</strong><span>需复习</span></div><div class="stat"><strong id="sentenceFilteredCount">0</strong><span>当前筛选</span></div></div><label>训练层级</label><select id="sentencePriority"><option value="全部">全部</option>${prios.map(p=>`<option ${p===priority?'selected':''}>${text(p)}</option>`).join('')}</select><label>难度</label><select id="sentenceLevel"><option value="全部">全部</option>${levels.map(l=>`<option>${text(l)}</option>`).join('')}</select><label>选择句子</label><select id="sentenceSelect"></select><div id="sentenceCard"></div></section>`;
  refreshSentenceSelect();
}
function renderSentenceCard(step){
  const item=currentSentence(), box=$('#sentenceCard'); if(!box)return;
  if(!item){box.innerHTML='<p class="muted">当前筛选下没有句子。</p>';return;}
  let html=`<div class="sentence-card"><p class="pill">${text(item.level)}</p><p class="sentence-main">${text(item.sentence)}</p><div class="button-row"><button data-sentence-step="translation">第一步：看翻译</button><button data-sentence-step="tokens">第二步：看词形</button><button data-sentence-step="structure">第三步：看结构</button><button class="primary" data-sentence-step="full">第四步：看完整解析</button></div>`;
  if(['translation','tokens','structure','full'].includes(step)) html+=`<p><strong>翻译：</strong>${text(item.translation)}</p>`;
  if(['tokens','full'].includes(step)) html+=`<div class="table-wrap"><table class="token-table"><tr><th>词形</th><th>语法信息</th><th>句中功能</th><th>意义</th></tr>${(item.tokens||[]).map(t=>`<tr><td>${text(t.form)}</td><td>${text(normalizeGrammarLine(t.grammar))}</td><td>${text(t.role)}</td><td>${text(t.meaning)}</td></tr>`).join('')}</table></div>`;
  if(['structure','full'].includes(step)) html+=`<p><strong>结构：</strong>${text(item.structure)}</p><p class="note"><strong>分析提示：</strong>${text(item.tip||'先找限定动词，再判断名词格位与句中功能。')}</p>`;
  if(step==='full') html+=`<div class="notice"><strong>完整解析：</strong>${text(item.analysis_level||item.training_goal||'按词形、句法功能和整体结构合成句意。')}</div><p><strong>相关语法点：</strong>${(item.related||[]).map(x=>`<button class="concept-btn" data-search-query="${text(x)}">${text(x)}</button>`).join('')}</p>`;
  html+=`<div class="button-row"><button class="success" data-sentence-status="已掌握">标记已掌握</button><button class="danger" data-sentence-status="需复习">标记需复习</button><button data-action="nextSentence">下一句</button></div></div>`;
  box.innerHTML=html;
}
async function renderTerminology(query=''){
  const data=await loadData('terminology');
  const cats=dedupe(data.map(t=>t.cat||t.category||'其他'));
  app.innerHTML=`${navControls()}<section class="card"><h2>术语库</h2><div class="grid three"><div class="stat"><strong>${data.length}</strong><span>术语总数</span></div><div class="stat"><strong id="termCount">0</strong><span>当前显示</span></div><div class="stat"><strong>${cats.length}</strong><span>分类</span></div></div><input id="termSearch" value="${text(query)}" placeholder="搜索 case、nominative、主格、vibhatti"><select id="termCat"><option value="全部">全部</option>${cats.map(c=>`<option>${text(c)}</option>`).join('')}</select><div id="termList" class="result-list"></div></section>`;
  function draw(){const q=($('#termSearch').value||'').toLowerCase(); const cat=$('#termCat').value; const items=data.filter(t=>{const blob=[t.en,t.cn,t.pali,t.note,t.simple_explanation,t.cat,t.category].join(' ').toLowerCase(); return (cat==='全部'||(t.cat||t.category)===cat)&&(!q||blob.includes(q))}); const count=$('#termCount'); if(count) count.textContent=items.length; $('#termList').innerHTML=items.map(t=>`<div class="term-card"><h3>${text(t.en||t.cn||'')} ${t.ipa?`<span class="ipa-inline">${text(t.ipa)}</span>`:''}</h3><p><strong>${text(t.cn||'')}</strong>${t.pali?`｜巴利对应：${text(t.pali)}`:''}</p><p>${text(t.simple_explanation||t.note||'')}</p>${(t.contrast_examples||[]).slice(0,2).map(e=>`<div class="example"><strong>${text(e.label||'')}</strong>：${text(e.form||'')}<br><span class="note">${text(e.meaning||'')}</span></div>`).join('')}</div>`).join('')||'<p class="muted">没有找到相关术语。</p>'}
  draw(); $('#termSearch').addEventListener('input',draw); $('#termCat').addEventListener('change',draw);
}
async function drawSearch(q){
  q=String(q||'').trim().toLowerCase(); const box=$('#searchResults'); if(!box)return;
  if(!q){box.innerHTML='<p class="muted">输入关键词后显示搜索结果。</p>';return;}
  box.innerHTML='<div class="loading">正在加载，请稍候……</div>';
  const [sidx,sent,terms,reading,bg,tokens,patterns,confusions]=await Promise.all([loadData('search'),loadData('sentence'),loadData('terminology'),loadData('buddhistReading'),loadData('buddhistBackground'),loadData('token'),loadData('patterns'),loadData('confusion')]);
  const course=sidx.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,10);
  const sentence=sent.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,10);
  const term=terms.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,10);
  const buddhist=[...reading,...(bg.concepts||[])].filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,10);
  const tokenKeys=Object.keys(tokens).filter(k=>JSON.stringify(tokens[k]).toLowerCase().includes(q)||k.toLowerCase().includes(q)).slice(0,10);
  const pats=patterns.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,8);
  const conf=confusions.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,8);
  function group(title,items,render){return `<section class="card compact"><h3>${title}</h3><div class="result-list">${items.length?items.map(render).join(''):'<p class="muted">没有结果。</p>'}</div></section>`}
  box.innerHTML=group('课程',course,x=>`<div class="result-card clickable" data-lesson="${x.id}"><h3>【课程】${text(x.lesson_number||x.id)}. ${text(x.title)}</h3><p>${text(x.summary||'')}</p></div>`)+group('句子分析',sentence,x=>`<div class="result-card clickable" data-page="sentence"><h3>【句子】${text(x.sentence)}</h3><p>${text(x.translation)}</p></div>`)+group('术语库',term,x=>`<div class="result-card clickable" data-term-query="${text(x.en||x.cn)}"><h3>【术语】${text(x.en||x.cn)} ${x.ipa?`<span class="ipa-inline">${text(x.ipa)}</span>`:''}</h3><p>${text(x.cn||x.simple_explanation||x.note||'')}</p></div>`)+group('佛典阅读',buddhist,x=>`<div class="result-card clickable" data-page="buddhist"><h3>【佛典】${text(x.title||x.pali||x.id)}</h3><p>${text(x.structure||x.basic||x.natural||'')}</p></div>`)+group('词形分析',tokenKeys,k=>`<div class="result-card clickable" data-lookup-word="${text(k)}"><h3>【词形】${text(k)}</h3><p>${text(tokens[k]?.analyses?.[0]?.meaning||'')}</p></div>`)+group('句型模板',pats,x=>`<div class="result-card clickable" data-page="patterns"><h3>【句型】${text(x.title)}</h3><p>${text(x.formula||x.function||'')}</p></div>`)+group('易混概念',conf,x=>`<div class="result-card clickable" data-page="confusion"><h3>【易混】${text(x.title)}</h3><p>${text(x.core||'')}</p></div>`);
}

// Global event handling: centralized click delegation for all pages.
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
    if(a==='top') scrollToTop();
    if(a==='prev') goPrev();
    if(a==='startExercise'){
      const ex=await loadData('exercise');
      const mod=$('#exerciseModule')?.value||'全部';
      const lesson=$('#exerciseLesson')?.value||'全部';
      const n=Number($('#exerciseCount')?.value||10);
      let items=ex.filter(x=>(mod==='全部'||x.module===mod)&&(lesson==='全部'||Number(x.lesson_id)===Number(lesson))).slice(0,800);
      if(lesson!=='全部'){const detail=await getLessonDetail(Number(lesson)); items=items.filter(x=>exerciseIsRelevantToLesson(detail,x));}
      startExercise(items.sort(()=>Math.random()-.5).slice(0,n),{module:mod,lesson});
    }
    if(a==='continueExercise') continueExercise();
    if(a==='clearExerciseSession'){clearExerciseSession();renderExerciseCenter();}
    if(a==='exitExercise'){saveExerciseSession();renderExerciseCenter();}
    if(a==='submitExercise') submitExercise();
    if(a==='nextExercise'){exerciseIndex++; saveExerciseSession(); renderExerciseQuestion();}
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
  const startLesson=e.target.closest('[data-start-lesson-exercise]'); if(startLesson){const detail=await getLessonDetail(currentLessonId); const items=await loadLessonExercises(currentLessonId,detail); navigate('exercise',{},true); setTimeout(()=>startExercise(items,{source:'lesson',lessonId:currentLessonId}),100);return;}
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
window.addEventListener('DOMContentLoaded',()=>{ if(app && !app.innerHTML.trim()) app.innerHTML='<div class="card loading">正在加载，请稍候……</div>'; navigate('home',{},false); });

// 20.55 additional actions for dictionary and lookup history.
document.addEventListener('click', (e)=>{
  const a=e.target.closest('[data-action]')?.dataset.action;
  if(a==='clearLookupHistory'){
    saveLookupHistory([]);
    renderDictionary($('#lookupInput')?.value||'');
  }
  if(a==='runSentenceLookup') runSentenceLookup();
});
