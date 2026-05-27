/* Pāli Learning Lab · 20.74 练习题质量精修版L/CSS/JS；无构建、无 service worker；GitHub Pages 可直接部署。
*/
const VERSION = '20.74 练习题质量精修版';
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
const LAST_LESSON_KEY='pll_last_lesson_v1';
const PROGRESS_SCHEMA_VERSION='pll-progress-20.74';
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
  if(page==='diagnostics') return renderDiagnostics();
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
      <div class="button-row"><button data-page="diagnostics">系统检查 / 发布验收</button></div>
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
function exerciseBlob(ex){
  return [ex?.question,ex?.answer,ex?.explanation,ex?.feedback_hint,ex?.lesson_title,ex?.category,...(ex?.options||[])].join(' ');
}
function exerciseFocusRule(lesson){
  const title=String(lesson?.title||'');
  const category=String(lesson?.category||'');
  if(/-a 尾中性名词|中性名词/.test(title)) return {
    required:/phala|phalaṃ|phalāni|citta|cittaṃ|cittāni|rūpa|rūpaṃ|rūpāni|kamma|kammaṃ|saraṇa|saraṇaṃ|中性|主宾同形/,
    forbidden:/\bBuddh[oaāe]?\b|Buddho|Buddhaṃ|Buddhena|Buddhassa|paññā|paññaṃ|paññāya|阳性|阴性/
  };
  if(/-a 尾阳性名词|阳性名词/.test(title)) return {
    required:/Buddha|Buddho|Buddhaṃ|Buddhena|Buddhassa|dhamma|dhammaṃ|dhammassa|purisa|puriso|purisaṃ|loka|阳性/,
    forbidden:/paññā|paññaṃ|paññāya|phalaṃ|phalāni|rūpaṃ|rūpāni|cittaṃ|cittāni|阴性|中性/
  };
  if(/-ā 尾阴性名词|阴性名词/.test(title)) return {
    required:/paññā|paññaṃ|paññāya|saddhā|gāthā|bhikkhunī|itthi|bhūmi|阴性/,
    forbidden:/Buddho|Buddhaṃ|Buddhena|Buddhassa|phalaṃ|phalāni|rūpaṃ|rūpāni|阳性|中性/
  };
  if(/inf\.|不定式|infinitive/.test(title)) return {
    required:/-tuṃ|-ituṃ|-etuṃ|gantuṃ|kātuṃ|sotuṃ|bhavituṃ|desetuṃ|不定式|inf\./,
    forbidden:/gantvā|sutvā|katvā|ger\.|连续体/
  };
  if(/ger\.|absolutive|连续体/.test(title)) return {
    required:/-tvā|-tvāna|gantvā|sutvā|katvā|ñatvā|连续体|ger\./,
    forbidden:/gantuṃ|sotuṃ|kātuṃ|inf\.|不定式/
  };
  if(/\bna\b|普通否定/.test(title)) return {
    required:/\bna\b|普通否定|不去|不是|没有/,
    forbidden:/\bmā\b|禁止|不要|勿/
  };
  if(/\bmā\b|禁止否定/.test(title)) return {
    required:/\bmā\b|禁止|不要|勿/,
    forbidden:/普通否定/
  };
  if(/\bca\b|并列连接词/.test(title)) return {
    required:/\bca\b|并列|和|也/,
    forbidden:/\bvā\b|选择|或者/
  };
  if(/\bvā\b|选择连接词/.test(title)) return {
    required:/\bvā\b|选择|或者|或/,
    forbidden:/\bca\b|并列/
  };
  if(/主格|nominative/.test(title)) return {required:/主格|nom\.|主语|表语/, forbidden:null};
  if(/宾格|accusative/.test(title)) return {required:/宾格|acc\.|宾语|方向|范围/, forbidden:null};
  if(/工具格|instrumental/.test(title)) return {required:/工具格|ins\.|由|以|用|方式|手段/, forbidden:null};
  if(/处格|locative/.test(title)) return {required:/处格|loc\.|在|于|地点|时间/, forbidden:null};
  return null;
}
function exerciseIsRelevantToLesson(lesson,ex){
  if(!lesson||!ex) return true;
  if(Number(ex.lesson_id)===Number(lesson.id)) return true;
  const rule=exerciseFocusRule(lesson);
  if(!rule) return true;
  const blob=exerciseBlob(ex);
  if(rule.forbidden && rule.forbidden.test(blob) && !(rule.required && rule.required.test(blob))) return false;
  if(rule.required && !rule.required.test(blob)) return false;
  return true;
}
function rankExerciseForLesson(lesson,ex){
  let score=0;
  if(Number(ex.lesson_id)===Number(lesson?.id)) score+=100;
  const blob=exerciseBlob(ex);
  const rule=exerciseFocusRule(lesson);
  if(rule?.required && rule.required.test(blob)) score+=20;
  if(rule?.forbidden && rule.forbidden.test(blob)) score-=50;
  if(ex.explanation||ex.feedback_hint) score+=5;
  if(ex.type==='choice') score+=2;
  return score;
}
async function loadLessonExercises(id,lesson=null){
  const ex=await loadData('exercise').catch(()=>[]);
  const items=(ex||[]).filter(x=>Number(x.lesson_id)===Number(id));
  if(!lesson) return items;
  return items
    .filter(x=>exerciseIsRelevantToLesson(lesson,x))
    .sort((a,b)=>rankExerciseForLesson(lesson,b)-rankExerciseForLesson(lesson,a));
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
  return `<section class="card compact"><div class="section-title"><h3>练习</h3></div><p class="muted">本课已筛选出 ${exercises.length} 道相关练习。</p><button class="primary" data-start-lesson-exercise="1">开始本课练习</button></section>`;
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
  try{localStorage.setItem(LAST_LESSON_KEY,JSON.stringify({lessonId:currentLessonId,title:lesson.title||'',module:lesson.module||'',lesson_number:lesson.lesson_number||'',saved_at:new Date().toISOString()}));}catch{}
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
  currentExercises=[...items].map(x=>{const y={...x}; delete y._answered; delete y._result; delete y._user_answer; return y;}).sort(()=>Math.random()-.5);
  exerciseIndex=0; selectedChoice=''; currentExerciseMeta=meta; saveExerciseSession(); renderExerciseQuestion();
}
function continueExercise(){
  const saved=savedExerciseSession();
  if(!saved?.items?.length){alert('没有可继续的练习。');return;}
  currentExercises=saved.items; exerciseIndex=Math.min(saved.index||0,currentExercises.length-1); selectedChoice=saved.selectedChoice||''; currentExerciseMeta=saved.meta||{}; renderExerciseQuestion();
}
function exercisePoint(ex){
  const bits=[ex.lesson_title,ex.category,ex.layer_title,ex.module].filter(Boolean);
  return bits.length ? bits.join('｜') : '本题对应当前语法点。';
}
function renderExerciseQuestion(){
  const area=$('#exerciseArea'); if(!area)return;
  if(!currentExercises.length){area.innerHTML='<p class="muted">当前没有练习题。</p>';return;}
  if(exerciseIndex>=currentExercises.length){
    const total=currentExercises.length;
    const right=currentExercises.filter(x=>x._result==='right').length;
    const wrong=currentExercises.filter(x=>x._result==='wrong').length;
    const rate=total?Math.round(right*100/total):0;
    clearExerciseSession();
    area.innerHTML=`<div class="exercise-box"><h3>本轮完成</h3><p>总题数：${total}；正确：${right}；错误：${wrong}；正确率：${rate}%</p><div class="button-row"><button class="primary" data-page="wrong">查看错题</button><button data-action="startExercise">再练一轮</button></div></div>`;
    return;
  }
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
  ex._answered=true; ex._result=good?'right':'wrong'; ex._user_answer=ans;
  const wrong=wrongMap();
  if(good) delete wrong[ex.id]; else wrong[ex.id]={...ex,user_answer:ans,wrong_at:new Date().toISOString()};
  saveWrong(wrong); saveExerciseSession();
  const fb=$('#exerciseFeedback');
  fb.className='feedback '+(good?'good':'bad');
  const review=ex.lesson_id?`<button class="secondary" data-lesson="${Number(ex.lesson_id)}">回看本课</button>`:'';
  const why=text(ex.explanation||ex.feedback_hint||'本题用于检查当前语法点的形式识别与基本用法。');
  fb.innerHTML=`<strong>${good?'回答正确':'回答错误'}</strong>
    <p>你的答案：${text(ans)}</p>
    <p>正确答案：${text(ex.answer)}</p>
    <p><strong>本题考点：</strong>${text(exercisePoint(ex))}</p>
    <p><strong>为什么：</strong>${why}</p>
    ${review}`;
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
  const initial=text(query);
  app.innerHTML=`${navControls()}<section class="card terminology-page"><h2>术语库</h2><p class="muted">用于复习语法、语言学和佛典阅读概念。默认显示全部术语；可按中文、英文、巴利对应、缩略语或别名搜索。</p><div class="grid three"><div class="stat"><strong>${data.length}</strong><span>术语总数</span></div><div class="stat"><strong id="termCount">0</strong><span>当前显示</span></div><div class="stat"><strong>${cats.length}</strong><span>分类</span></div></div><div class="term-tools"><input id="termSearch" value="${initial}" placeholder="搜索：case、主格、vibhatti、关系代词、indic."><select id="termCat"><option value="全部">全部分类</option>${cats.map(c=>`<option>${text(c)}</option>`).join('')}</select><button id="termClear" type="button">清空</button></div><div id="termQuickCats" class="chip-row">${cats.map(c=>`<button class="mini-chip" data-term-cat="${text(c)}">${text(c)}</button>`).join('')}</div><div id="termHint" class="notice hidden"></div><div id="termList" class="result-list"></div></section>`;
  function blob(t){return [t.en,t.cn,t.pali,t.note,t.simple_explanation,t.cat,t.category,(t.aliases||[]).join(' '),(t.tags||[]).join(' '),(t.warning||''),(t.contrast_examples||[]).map(e=>[e.label,e.form,e.meaning].join(' ')).join(' ')].join(' ').toLowerCase()}
  function exact(t,q){q=String(q||'').trim().toLowerCase(); if(!q) return false; const vals=[t.en,t.cn,t.pali,...(t.aliases||[])].filter(Boolean).map(x=>String(x).toLowerCase()); return vals.some(v=>v===q || v.split(/[；;，,、/|]/).map(x=>x.trim()).includes(q));}
  function card(t,isExact){const ex=(t.contrast_examples||[]).slice(0,2).map(e=>`<div class="example term-example"><strong>${text(e.label||'例')}</strong>：${text(e.form||'')}<br><span class="note">${text(e.meaning||'')}</span></div>`).join(''); const aliases=(t.aliases||[]).slice(0,8).map(a=>`<span class="tag">${text(a)}</span>`).join(''); return `<div class="term-card ${isExact?'term-exact':''}"><div class="term-head"><h3>${text(t.en||t.cn||'')} ${t.ipa?`<span class="ipa-inline">${text(t.ipa)}</span>`:''}</h3>${isExact?'<span class="match-badge">定位匹配</span>':''}</div><p><strong>${text(t.cn||'')}</strong>${t.pali?`｜巴利对应：${text(t.pali)}`:''}</p>${aliases?`<p class="term-aliases"><strong>可搜索：</strong>${aliases}</p>`:''}<p>${text(t.simple_explanation||t.note||'')}</p>${t.note && t.simple_explanation && t.note!==t.simple_explanation?`<p class="muted">${text(t.note)}</p>`:''}${t.warning?`<div class="warning-block small-block"><strong>易混提醒：</strong>${text(t.warning)}</div>`:''}${ex}</div>`}
  function draw(){const q=($('#termSearch').value||'').trim().toLowerCase(); const cat=$('#termCat').value; let items=data.filter(t=>(cat==='全部'||(t.cat||t.category)===cat)&&(!q||blob(t).includes(q))); const exactItems=q?items.filter(t=>exact(t,q)):[]; if(exactItems.length){const rest=items.filter(t=>!exact(t,q)); items=[...exactItems,...rest];} const count=$('#termCount'); if(count) count.textContent=items.length; const hint=$('#termHint'); if(q){hint.classList.remove('hidden'); hint.innerHTML=exactItems.length?`已定位到 ${exactItems.length} 条精确匹配，并显示 ${items.length} 条相关结果。`:`未找到精确匹配，显示 ${items.length} 条相关结果。`; } else {hint.classList.add('hidden'); hint.innerHTML='';} $('#termList').innerHTML=items.length?items.map(t=>card(t, exact(t,q))).join(''):'<p class="muted">没有找到相关术语。可换用中文、英文、巴利对应或缩略语搜索。</p>'}
  draw();
  $('#termSearch').addEventListener('input',draw);
  $('#termCat').addEventListener('change',draw);
  $('#termClear').addEventListener('click',()=>{$('#termSearch').value=''; $('#termCat').value='全部'; draw();});
  $('#termQuickCats').addEventListener('click',e=>{const b=e.target.closest('[data-term-cat]'); if(!b)return; $('#termCat').value=b.dataset.termCat; draw();});
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


/* 20.74 练习题质量精修版语库、搜索、练习反馈与页面体验。 */
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

async function fetchText2060(path){
  const key='text::'+path;
  if(cache.has(key)) return cache.get(key);
  const res=await fetch(path+'?v='+encodeURIComponent(VERSION));
  if(!res.ok) throw new Error(path+' 未加载成功');
  const t=await res.text(); cache.set(key,t); return t;
}
function diagBadge2060(ok,warn=false){
  if(ok) return '<span class="diag-badge ok">通过</span>';
  return `<span class="diag-badge ${warn?'warn':'bad'}">${warn?'需核查':'异常'}</span>`;
}
function diagRow2060(name,ok,detail,warn=false){
  return `<tr><td>${text(name)}</td><td>${diagBadge2060(ok,warn)}</td><td>${detail||''}</td></tr>`;
}
function diagTable2060(title,rows){
  return `<section class="card"><h2>${text(title)}</h2><div class="table-wrap"><table class="diag-table"><tbody>${rows.join('')}</tbody></table></div></section>`;
}
function unique2060(arr){return [...new Set((arr||[]).filter(x=>x!==undefined&&x!==null&&x!==''))]}
async function renderDiagnostics(){
  setLoading();
  const rowsData=[], rowsRoute=[], rowsQuality=[], rowsFiles=[];
  const chunkFiles=Array.from({length:11},(_,i)=>`lesson-chunk-${String(i+1).padStart(2,'0')}.json`);
  const moduleFiles=Array.from({length:8},(_,i)=>`module-${String(i+1).padStart(2,'0')}-module.json`);
  const coreFiles=['index.html','app.js','style.css','cache-reset.html','grammar-index.json','grammar-lesson-manifest.json','grammar-module-directory.json','exercise-index.json','search-index.json','learning-routes-data.js','sentence-analysis-data.js','sentence-patterns-data.js','confusion-pairs-data.js','terminology-glossary-data.js','dictionary-sites-data.js','token-analysis-data.js','buddhist-reading-data.js','buddhist-background-data.js','academic-training-data.js','module-guides-data.js','linguistics-tips-data.js',...chunkFiles,...moduleFiles];
  const fileText={};
  let fileOk=0;
  for(const f of coreFiles){
    try{fileText[f]=await fetchText2060(f); fileOk++; rowsFiles.push(diagRow2060(f,true,'已加载'));}
    catch(e){rowsFiles.push(diagRow2060(f,false,text(e.message||e)));}
  }
  let grammar=[], exercise=[], routes=[], sentence=[], terms=[], tokens={}, manifest={}, moduleDir=[];
  let chunks=[], modules=[];
  try{grammar=await loadData('grammarIndex')}catch(e){}
  try{exercise=await loadData('exercise')}catch(e){}
  try{routes=await loadData('routes')}catch(e){}
  try{sentence=await loadData('sentence')}catch(e){}
  try{terms=await loadData('terminology')}catch(e){}
  try{tokens=await loadData('token')}catch(e){}
  try{manifest=await loadData('manifest')}catch(e){}
  try{moduleDir=await loadData('moduleDirectory')}catch(e){}
  for(const f of chunkFiles){try{chunks.push({file:f,data:await fetchJson(f)})}catch(e){chunks.push({file:f,data:null,error:e})}}
  for(const f of moduleFiles){try{modules.push({file:f,data:await fetchJson(f)})}catch(e){modules.push({file:f,data:null,error:e})}}
  const grammarIds=new Set(grammar.map(x=>String(x.id)));
  const detailLessons=chunks.flatMap(c=>Array.isArray(c.data)?c.data:[]);
  const detailIds=new Set(detailLessons.map(x=>String(x.id)));
  const manifestIds=new Set(Object.keys(manifest||{}).map(String));
  rowsData.push(diagRow2060('语法点数量', grammar.length===109, `当前：${grammar.length}；预期：109`, grammar.length!==109));
  rowsData.push(diagRow2060('课程详情数量', detailLessons.length>=109, `当前：${detailLessons.length}；预期：≥109`, detailLessons.length<109));
  rowsData.push(diagRow2060('lesson chunk 数量', chunks.filter(c=>Array.isArray(c.data)).length===11, `当前：${chunks.filter(c=>Array.isArray(c.data)).length}/11`));
  rowsData.push(diagRow2060('module 文件数量', modules.filter(m=>Array.isArray(m.data)).length===8, `当前：${modules.filter(m=>Array.isArray(m.data)).length}/8`));
  rowsData.push(diagRow2060('练习题数量', exercise.length>=1000, `当前：${exercise.length}；预期：约1004`, exercise.length<1000));
  rowsData.push(diagRow2060('术语库数量', terms.length>=120, `当前：${terms.length}；预期：约120`, terms.length<120));
  rowsData.push(diagRow2060('句子分析数量', sentence.length>=90, `当前：${sentence.length}；预期：约92`, sentence.length<90));
  rowsData.push(diagRow2060('词形分析数量', Object.keys(tokens||{}).length>=200, `当前：${Object.keys(tokens||{}).length}；预期：约200+`, Object.keys(tokens||{}).length<200));
  const missingDetail=[...grammarIds].filter(id=>!detailIds.has(id));
  rowsData.push(diagRow2060('课程索引与详情对应', missingDetail.length===0, missingDetail.length?`缺少详情：${missingDetail.slice(0,20).join(', ')}${missingDetail.length>20?'……':''}`:'全部课程在 chunk 中找到'));
  const manifestMissing=[...grammarIds].filter(id=>!manifestIds.has(id));
  rowsData.push(diagRow2060('课程 manifest 对应', manifestMissing.length===0, manifestMissing.length?`manifest 缺少：${manifestMissing.slice(0,20).join(', ')}${manifestMissing.length>20?'……':''}`:'全部课程有 manifest 记录'));
  const routeIds=[]; (routes||[]).forEach(r=>(r.steps||[]).forEach(s=>(s.lesson_ids||[]).forEach(id=>routeIds.push(String(id)))));
  const routeMissing=unique2060(routeIds).filter(id=>!grammarIds.has(id));
  rowsRoute.push(diagRow2060('学习路线 lesson_id', routeMissing.length===0, routeMissing.length?`找不到：${routeMissing.join(', ')}`:'全部路线课程可在 grammar-index 找到'));
  const exerciseIds=unique2060(exercise.map(x=>String(x.lesson_id||''))).filter(Boolean);
  const exerciseMissing=exerciseIds.filter(id=>!grammarIds.has(id));
  rowsRoute.push(diagRow2060('练习题 lesson_id', exerciseMissing.length===0, exerciseMissing.length?`找不到课程：${exerciseMissing.slice(0,30).join(', ')}${exerciseMissing.length>30?'……':''}`:'练习题 lesson_id 均可对应课程'));
  const moduleLessonIds=unique2060(modules.flatMap(m=>Array.isArray(m.data)?m.data.map(x=>String(x.id)):[]));
  const moduleMissing=moduleLessonIds.filter(id=>!grammarIds.has(id));
  rowsRoute.push(diagRow2060('模块课程 id', moduleMissing.length===0, moduleMissing.length?`模块中找不到课程：${moduleMissing.slice(0,30).join(', ')}`:'模块课程均可对应 grammar-index'));
  rowsRoute.push(diagRow2060('路线标签数量', Array.isArray(routes)&&routes.length>=4, `当前：${routes.length||0}；预期：零基础/动词/名词格位/句子分析等`, routes.length<4));
  const allText=Object.entries(fileText).map(([f,t])=>`\n/* ${f} */\n${t}`).join('\n');
  function countRe(re){return (allText.match(re)||[]).length}
  const badInd=countRe(/\b(?:prs|fut|aor|impf|perf)\.ind\./g);
  const multiRoot=countRe(/√[^\n;，。,）)]{1,30}\s*\/\s*[^\n;，。,）)]{1,30}/g);
  const rootReview=countRe(/词根需查词典复核|需查词典复核/g);
  const ipaPrompt=countRe(/点击查看\s*IPA|悬停查看\s*IPA|点击查观察\s*IPA/g);
  const noDetail=countRe(/暂无详细解释/g);
  const relatedBlock=countRe(/相关佛典阅读句式|相关学术训练|相关佛典背景/g);
  const routeNotFound=countRe(/语法点\s*\$?\{?\w*\}?\s*未找到|语法点 \d+ 未找到/g);
  rowsQuality.push(diagRow2060('陈述语气缩略语', badInd===0, badInd?`发现 ${badInd} 处 .ind. 风险写法；应使用 .indic.`:'未发现 .ind. 表示陈述语气'));
  rowsQuality.push(diagRow2060('多词根写法', multiRoot===0, multiRoot?`发现 ${multiRoot} 处疑似多词根/斜杠词根写法`:'未发现疑似 √.../... 多词根写法'));
  rowsQuality.push(diagRow2060('词根复核占位', rootReview===0, rootReview?`发现 ${rootReview} 处“需复核”类占位`:'未发现词根复核占位'));
  rowsQuality.push(diagRow2060('IPA 提示废话', ipaPrompt===0, ipaPrompt?`发现 ${ipaPrompt} 处“点击/悬停查看 IPA”`:'未发现 IPA 提示废话'));
  rowsQuality.push(diagRow2060('无效术语弹窗文案', noDetail===0, noDetail?`发现 ${noDetail} 处“暂无详细解释”`:'未发现无效术语弹窗文案'));
  rowsQuality.push(diagRow2060('课程页冗余相关区块', relatedBlock===0, relatedBlock?`发现 ${relatedBlock} 处相关佛典/学术区块文案`:'未发现课程页冗余相关区块文案'));
  rowsQuality.push(diagRow2060('路线未找到文案', routeNotFound===0, routeNotFound?`发现 ${routeNotFound} 处“语法点未找到”模板/残留；若只是诊断模板可忽略`:'未发现路线未找到残留'));
  const lessonsMissingExample=detailLessons.filter(l=>!(l.examples||[]).length).map(l=>`${l.id}:${l.title}`);
  const examplesNoCn=[]; const examplesNoParse=[];
  detailLessons.forEach(l=>(l.examples||[]).forEach((ex,i)=>{if(!ex.cn&&!ex.natural_cn&&!ex.translation) examplesNoCn.push(`${l.id}#${i+1}`); if(!ex.note&&!ex.grammar_note&&!ex.parse) examplesNoParse.push(`${l.id}#${i+1}`)}));
  rowsQuality.push(diagRow2060('课程例句覆盖', lessonsMissingExample.length===0, lessonsMissingExample.length?`无例句课程：${lessonsMissingExample.slice(0,20).join('；')}`:'所有课程详情均有例句', lessonsMissingExample.length>0));
  rowsQuality.push(diagRow2060('例句翻译字段', examplesNoCn.length===0, examplesNoCn.length?`缺翻译：${examplesNoCn.slice(0,30).join(', ')}${examplesNoCn.length>30?'……':''}`:'未发现缺翻译例句', examplesNoCn.length>0));
  rowsQuality.push(diagRow2060('例句语法解析字段', examplesNoParse.length===0, examplesNoParse.length?`缺解析：${examplesNoParse.slice(0,30).join(', ')}${examplesNoParse.length>30?'……':''}`:'未发现缺解析例句', examplesNoParse.length>0));
  const sentenceNoTokens=sentence.filter(x=>!(x.tokens||[]).length).map(x=>x.id||x.sentence);
  rowsQuality.push(diagRow2060('句子分析 tokens', sentenceNoTokens.length===0, sentenceNoTokens.length?`缺逐词分析：${sentenceNoTokens.slice(0,20).join(', ')}`:'句子分析均有 tokens', sentenceNoTokens.length>0));
  const summary=`<section class="card"><h1>系统检查 / 数据诊断</h1><p class="muted">本页用于发布前验收。它只读取文件并检查数据完整性、路由对应关系和常见旧问题残留，不修改任何学习数据。</p><div class="stats"><div class="stat"><strong>${fileOk}</strong><span>文件已加载</span></div><div class="stat"><strong>${grammar.length}</strong><span>语法点</span></div><div class="stat"><strong>${exercise.length}</strong><span>练习题</span></div><div class="stat"><strong>${sentence.length}</strong><span>句子分析</span></div></div></section>`;
  app.innerHTML=`${navControls()}${summary}${diagTable2060('一、数据规模核查',rowsData)}${diagTable2060('二、路由与 ID 对应核查',rowsRoute)}${diagTable2060('三、内容质量与旧问题残留核查',rowsQuality)}${diagTable2060('四、核心文件加载核查',rowsFiles)}<section class="card"><h2>验收提示</h2><ol><li>若“异常”出现在核心数量、路线、课程详情、句子分析、术语库，应先修数据。</li><li>若仅出现“语法点未找到”模板，但页面实际没有出现该错误，可视为低优先级。</li><li>发布前仍需人工点击：首页、零基础、模块、课程、练习、句子分析、查词、术语库、佛典阅读、搜索。</li></ol></section>`;
}



function releaseChecklist2069(){
  return `<section class="card release-checklist"><h2>版本发布流程</h2><p class="muted">本区用于每次上传 GitHub Pages 前后核查，避免“文件已上传但线上仍是旧版”“修一个坏三个”。</p>
  <div class="grid two"><div class="mini-card"><h3>发布前</h3><ol>
    <li>备份当前稳定版压缩包。</li>
    <li>确认本次只修改一个功能域，避免大范围改动。</li>
    <li>检查 <code>index.html</code>、<code>app.js</code>、<code>cache-reset.html</code>、<code>manifest.json</code> 版本号一致。</li>
    <li>本地打开 <code>index.html</code>，确认首页、模块学习、句子分析、查词、搜索能进入。</li>
    <li>运行“系统检查”，异常项先修复再上传。</li>
  </ol></div>
  <div class="mini-card"><h3>上传时</h3><ol>
    <li>解压上传包，不上传 zip 本身。</li>
    <li>打开解压文件夹，全选里面的文件，拖到 GitHub 根目录。</li>
    <li>确认根目录直接能看到 <code>index.html</code>、<code>app.js</code>、<code>.nojekyll</code>。</li>
    <li>Commit changes 后查看 Actions 最新一条。</li>
    <li>不要混传旧版本文件。</li>
  </ol></div>
  <div class="mini-card"><h3>发布后</h3><ol>
    <li>Actions 最新记录变绿。</li>
    <li>GitHub 根目录 <code>index.html</code> 搜当前版本号。</li>
    <li>GitHub 根目录 <code>app.js</code> 搜当前版本号。</li>
    <li>打开 <code>cache-reset.html</code> 清旧缓存。</li>
    <li>进入首页后 Ctrl+U 搜当前版本号。</li>
  </ol></div>
  <div class="mini-card"><h3>回归验收</h3><ol>
    <li>首页、零基础、模块学习、句子分析、佛典阅读、查词、搜索全部可进入。</li>
    <li>任意课程页显示学习目标、本节单词、语法标注、核心概念、例句和练习。</li>
    <li>术语库、句子分析、课程练习、专项强化、错题复习、学习进度均可打开。</li>
    <li>如果新增异常，立即回退到上一稳定包，不继续叠补丁。</li>
  </ol></div></div>
  <div class="notice"><strong>发布原则：</strong>小步修改、逐项验收、可回退；不要重新引入 service worker，不要上传旧版 <code>sw.js</code>。</div></section>`;
}

function safeJSONParse(raw,fallback){try{return JSON.parse(raw)||fallback}catch{return fallback}}
function localGet(key,fallback){return safeJSONParse(localStorage.getItem(key),fallback)}
function progressSnapshot(){
  return {
    schema: PROGRESS_SCHEMA_VERSION,
    app: 'Pāli Learning Lab',
    version: VERSION,
    exported_at: new Date().toISOString(),
    lessonStatus: localGet(LESSON_STATUS_KEY,{}),
    wrong: localGet(WRONG_KEY,{}),
    sentenceStatus: localGet(SENT_STATUS_KEY,{}),
    exerciseSession: localGet(EXERCISE_SESSION_KEY,null),
    lookupHistory: localGet(HISTORY_KEY,[]),
    lastLesson: localGet(LAST_LESSON_KEY,null)
  };
}
function progressSummaryHTML(snap,grammar=[],sentence=[]){
  const lessonVals=Object.values(snap.lessonStatus||{});
  const counts={已掌握:lessonVals.filter(x=>x==='已掌握').length,学习中:lessonVals.filter(x=>x==='学习中').length,需复习:lessonVals.filter(x=>x==='需复习').length};
  const sentVals=Object.values(snap.sentenceStatus||{});
  const sentCounts={已掌握:sentVals.filter(x=>x==='已掌握').length,需复习:sentVals.filter(x=>x==='需复习').length,未练:Math.max(0,(sentence.length||0)-sentVals.length)};
  const wrongCount=Object.keys(snap.wrong||{}).length;
  const ex=snap.exerciseSession;
  const exText=ex?.items?.length?`已保存练习：第 ${(ex.index||0)+1}/${ex.items.length} 题，保存于 ${new Date(ex.saved_at||Date.now()).toLocaleString()}`:'暂无未完成练习';
  const last=snap.lastLesson?.lessonId?`上次课程：${text(snap.lastLesson.lesson_number||snap.lastLesson.lessonId)}. ${text(snap.lastLesson.title||'')}（${text(snap.lastLesson.module||'')}）`:'暂无上次课程记录';
  return `<div class="stats"><div class="stat"><strong>${counts.已掌握}</strong><span>课程已掌握</span></div><div class="stat"><strong>${counts.学习中}</strong><span>课程学习中</span></div><div class="stat"><strong>${counts.需复习}</strong><span>课程需复习</span></div><div class="stat"><strong>${wrongCount}</strong><span>错题</span></div></div><div class="notice"><p>${last}</p><p>${text(exText)}</p><p>句子分析：已掌握 ${sentCounts.已掌握}，需复习 ${sentCounts.需复习}，未练约 ${sentCounts.未练}。</p></div>`;
}
async function renderProgress(){
  const [grammar,sentence]=await Promise.all([loadData('grammarIndex').catch(()=>[]),loadData('sentence').catch(()=>[])]);
  const snap=progressSnapshot();
  const json=JSON.stringify(snap,null,2);
  app.innerHTML=`${navControls()}<section class="card"><h2>学习进度备份</h2><p class="muted">本页只处理本机浏览器中的学习记录。导出文件可保存到电脑；换设备或清缓存前，请先导出。</p>${progressSummaryHTML(snap,grammar,sentence)}<div class="button-row"><button class="primary" data-action="copyProgress">复制备份</button><button data-action="downloadProgress">下载备份</button><button class="success" data-action="importProgress">导入备份</button><button class="danger" data-action="clearProgress">清空进度</button></div>${snap.lastLesson?.lessonId?`<button data-action="restoreLastLesson">继续上次课程</button>`:''}${snap.exerciseSession?.items?.length?`<button data-page="exercise">进入练习中心继续练习</button>`:''}<label>备份 JSON</label><textarea id="progressText" rows="16">${text(json)}</textarea></section><section class="card"><h3>导入说明</h3><ol><li>把备份 JSON 粘贴到文本框。</li><li>点击“导入备份”。</li><li>导入后会恢复课程状态、错题、句子分析状态、练习进度、查词历史和上次课程。</li></ol><p class="muted">不会上传到服务器，所有记录只保存在当前浏览器 localStorage。</p></section>`;
}
function importProgressFromText(){
  const raw=$('#progressText')?.value||'';
  const d=JSON.parse(raw);
  if(!d || typeof d!=='object') throw new Error('备份内容不是 JSON 对象');
  if(d.lessonStatus && typeof d.lessonStatus==='object') localStorage.setItem(LESSON_STATUS_KEY,JSON.stringify(d.lessonStatus));
  if(d.wrong && typeof d.wrong==='object') localStorage.setItem(WRONG_KEY,JSON.stringify(d.wrong));
  if(d.sentenceStatus && typeof d.sentenceStatus==='object') localStorage.setItem(SENT_STATUS_KEY,JSON.stringify(d.sentenceStatus));
  if('exerciseSession' in d){ if(d.exerciseSession) localStorage.setItem(EXERCISE_SESSION_KEY,JSON.stringify(d.exerciseSession)); else localStorage.removeItem(EXERCISE_SESSION_KEY); }
  if(Array.isArray(d.lookupHistory)) localStorage.setItem(HISTORY_KEY,JSON.stringify(d.lookupHistory.slice(0,20)));
  if(d.lastLesson && typeof d.lastLesson==='object') localStorage.setItem(LAST_LESSON_KEY,JSON.stringify(d.lastLesson));
}
function downloadProgressFile(){
  const raw=$('#progressText')?.value || JSON.stringify(progressSnapshot(),null,2);
  const blob=new Blob([raw],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='pali-learning-lab-progress-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function clearAllProgress(){
  [LESSON_STATUS_KEY,WRONG_KEY,SENT_STATUS_KEY,EXERCISE_SESSION_KEY,HISTORY_KEY,LAST_LESSON_KEY].forEach(k=>localStorage.removeItem(k));
}

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
      if(lesson!=='全部'){
        const detail=await getLessonDetail(Number(lesson));
        items=items.filter(x=>exerciseIsRelevantToLesson(detail,x)).sort((a,b)=>rankExerciseForLesson(detail,b)-rankExerciseForLesson(detail,a));
      }
      startExercise(items.slice(0,n),{module:mod,lesson});
    }
    if(a==='continueExercise') continueExercise();
    if(a==='clearExerciseSession'){clearExerciseSession();renderExerciseCenter();}
    if(a==='exitExercise'){saveExerciseSession();renderExerciseCenter();}
    if(a==='submitExercise') submitExercise();
    if(a==='nextExercise'){if(currentExercises[exerciseIndex]&&!currentExercises[exerciseIndex]._answered){alert('请先提交答案，再进入下一题。');return;} exerciseIndex++; selectedChoice=''; saveExerciseSession(); renderExerciseQuestion();}
    if(a==='analyzeToken') analyzeToken();
    if(a==='clearLookup'){$('#lookupInput').value='';$('#tokenPanel').innerHTML='';}
    if(a==='nextSentence'){const sel=$('#sentenceSelect'); if(sel&&sel.options.length){sel.selectedIndex=(sel.selectedIndex+1)%sel.options.length; renderSentenceCard('translation')}}
    if(a==='clearWrong'){if(confirm('确定清空错题吗？')){saveWrong({});renderWrong()}}
    if(a==='copyProgress'){navigator.clipboard?.writeText($('#progressText').value); alert('已复制备份。')}
    if(a==='downloadProgress') downloadProgressFile();
    if(a==='importProgress'){try{importProgressFromText(); alert('已导入学习进度。'); renderProgress();}catch(err){alert('导入失败：'+(err.message||'请检查 JSON 格式。'))}}
    if(a==='clearProgress'){if(confirm('确定清空课程状态、错题、句子分析状态、练习进度、查词历史和上次课程记录吗？')){clearAllProgress(); renderProgress();}}
    if(a==='restoreLastLesson'){const last=localGet(LAST_LESSON_KEY,null); if(last?.lessonId) navigate('lesson',{lessonId:Number(last.lessonId)}); else alert('暂无上次课程记录。')}
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

// 20.74 练习题质量精修版for dictionary and lookup history.
document.addEventListener('click', (e)=>{
  const a=e.target.closest('[data-action]')?.dataset.action;
  if(a==='clearLookupHistory'){
    saveLookupHistory([]);
    renderDictionary($('#lookupInput')?.value||'');
  }
  if(a==='runSentenceLookup') runSentenceLookup();
});


/* 20.74 练习题质量精修版加变音符号输入表，词典链接自动复制并尽量直达查询。 */
const DICT_QUERY_SITES_2056 = [
  {id:'sutta-dict', name:'巴利字典 Pāli Dictionary', level:'中文优先', best_for:'适合中文学习者快速查基本义。', url:'https://dictionary.sutta.org/', query:'https://dictionary.sutta.org/?q={q}'},
  {id:'dpd', name:'Digital Pāli Dictionary (DPD)', level:'词形与构词', best_for:'适合复核词根、词类、构词和英文义项。', url:'https://dpdict.net/', query:'https://dpdict.net/?q={q}'},
  {id:'suttacentral', name:'SuttaCentral Dictionary', level:'经文语境', best_for:'适合结合经文语境查看词义。', url:'https://suttacentral.net/define', query:'https://suttacentral.net/define/{q}'},
  {id:'pts', name:'PTS Pāli-English Dictionary', level:'传统巴英', best_for:'适合复核传统 PTS 巴英词典义项。', url:'https://dsal.uchicago.edu/dictionaries/pali/', query:'https://dsal.uchicago.edu/cgi-bin/app/pali_query.py?qs={q}&searchhws=yes'},
  {id:'wisdom', name:'Wisdom Library', level:'补充参考', best_for:'适合作为佛教术语和印度学词条的补充参考。', url:'https://www.wisdomlib.org/definition/', query:'https://www.wisdomlib.org/definition/{q}'}
];
const PALI_TYPE_HELPER_2056 = [
  ['aa','ā'], ['ii','ī'], ['uu','ū'], ['"n','ṅ'], ['.m','ṃ'], ['~n','ñ'], ['.t','ṭ'], ['.d','ḍ'], ['.n','ṇ'], ['.l','ḷ']
];
function currentLookupWord2056(){return ($('#lookupInput')?.value||'').trim();}
function insertPaliChar2056(ch){
  const input=$('#lookupInput'); if(!input) return;
  const start=input.selectionStart ?? input.value.length;
  const end=input.selectionEnd ?? input.value.length;
  input.value=input.value.slice(0,start)+ch+input.value.slice(end);
  input.focus();
  const pos=start+ch.length;
  try{input.setSelectionRange(pos,pos)}catch{}
}
function helperTable2056(){
  const head=PALI_TYPE_HELPER_2056.map(x=>`<th>${text(x[0])}</th>`).join('');
  const body=PALI_TYPE_HELPER_2056.map(x=>`<td><button class="char-btn" type="button" data-insert-char="${text(x[1])}">${text(x[1])}</button></td>`).join('');
  return `<div class="table-wrap pali-type-helper"><table><tr><th>Type</th>${head}</tr><tr><th>For</th>${body}</tr></table></div>`;
}
function dictCards2056(){
  return DICT_QUERY_SITES_2056.map(s=>`<div class="entry-card dict-site"><h3>${text(s.name)}</h3><p class="pill">${text(s.level)}</p><p>${text(s.best_for)}</p><a class="btn primary dict-query-link" href="${text(s.url)}" target="_blank" rel="noopener" data-dict-id="${text(s.id)}">复制并打开查询</a></div>`).join('');
}
async function openDictionaryQuery2056(link){
  const word=currentLookupWord2056();
  if(!word){alert('请先输入要查询的巴利语词形。'); return;}
  addLookupHistory(word);
  try{await navigator.clipboard?.writeText(word);}catch{}
  const site=DICT_QUERY_SITES_2056.find(x=>x.id===link.dataset.dictId);
  const q=encodeURIComponent(word);
  const url=(site?.query||site?.url||link.href).replace('{q}',q);
  window.open(url,'_blank','noopener');
  const status=$('#lookupStatus');
  if(status) status.innerHTML=`已复制：<strong>${text(word)}</strong>。已打开词典页面；若外部网站未自动带入查询词，请直接粘贴搜索。`;
}
async function renderDictionary(initial=''){
  const history=lookupHistory();
  app.innerHTML=`${navControls()}
  <section class="card"><h2>查词</h2><input id="lookupInput" value="${text(initial)}" placeholder="输入巴利语词形，如 dhammaṃ、Buddho、gacchati"><div class="button-row"><button data-action="clearLookup">清空输入</button><button data-action="clearLookupHistory">清空历史</button></div><h3>不方便打字的字母</h3>${helperTable2056()}<p id="lookupStatus" class="muted">输入词形后，点击下方词典链接；系统会先复制查询词，再打开对应词典页面。</p></section>
  <section class="card"><h2>词典入口</h2><div class="grid">${dictCards2056()}</div></section>
  <section class="card"><h2>查询历史</h2><div class="quick-row">${history.map(w=>`<button class="concept-btn" data-lookup-word="${text(w)}">${text(w)}</button>`).join('')||'<p class="muted">暂无历史。</p>'}</div></section>`;
  const inp=$('#lookupInput');
  inp?.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=document.querySelector('.dict-query-link'); if(first) openDictionaryQuery2056(first);}});
}
document.addEventListener('click',(e)=>{
  const ins=e.target.closest('[data-insert-char]');
  if(ins){insertPaliChar2056(ins.dataset.insertChar); return;}
  const dict=e.target.closest('[data-dict-id]');
  if(dict){e.preventDefault(); openDictionaryQuery2056(dict); return;}
});

/* 20.74 练习题质量精修版不做词形分析，只做字母输入、推荐词形、复制并打开词典。
   - 本节单词：名词类词语显示词典形/lemma，不显示主格形式；语法信息只显示性别，如 m. / f. / n.。
   - 本节单词：动词显示现在时第三人称单数形式；语法信息只显示可靠词根，如 √gam。
   - 分词、inf.、ger. 等若可确认，归并到对应现在时第三人称单数；无法确认则不收。
   - 例句语法解析按句中功能给单一格位；动词使用 indic. 表示陈述语气，ind. 仅表示不变词。 */

function stripDiacritics2057(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[ṃṁṅñṭḍṇḷ]/g, m=>({ṃ:'m',ṁ:'m',ṅ:'n',ñ:'n',ṭ:'t',ḍ:'d',ṇ:'n',ḷ:'l'}[m]||m)).toLowerCase();
}
function paliAsciiConvert2057(s){
  return String(s||'')
    .replace(/aa/g,'ā').replace(/ii/g,'ī').replace(/uu/g,'ū')
    .replace(/"n/g,'ṅ').replace(/\.m/g,'ṃ').replace(/~n/g,'ñ')
    .replace(/\.t/g,'ṭ').replace(/\.d/g,'ḍ').replace(/\.n/g,'ṇ').replace(/\.l/g,'ḷ');
}
function trustedDictionaryWords2057(){
  const base=Object.keys(PALI_LEXICON||{});
  const tokenData=cache.get(FILE.token[0]+'::'+FILE.token[1])||{};
  const extra=Object.keys(tokenData||{}).filter(w=>{
    const ww=normalizePaliToken(w); if(!ww||ww.length<3||ww.toLowerCase()==='ti') return false;
    if(GRAMMAR_WORD_BLACKLIST.has(ww.toLowerCase())) return false;
    return /[A-Za-zĀāĪīŪūṄṅÑñṬṭḌḍṆṇḶḷṂṃ]/.test(ww);
  });
  return dedupe([...base,...extra]).sort((a,b)=>a.localeCompare(b));
}
function editDistance2057(a,b){
  a=stripDiacritics2057(a); b=stripDiacritics2057(b);
  if(a===b) return 0;
  const m=a.length,n=b.length; if(!m) return n; if(!n) return m;
  const dp=Array.from({length:m+1},(_,i)=>[i]);
  for(let j=1;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return dp[m][n];
}
function suggestLookupWords2057(q,limit=12){
  q=String(q||'').trim();
  if(!q) return [];
  const converted=paliAsciiConvert2057(q);
  const qq=stripDiacritics2057(converted);
  const words=trustedDictionaryWords2057();
  const scored=[];
  for(const w of words){
    const sw=stripDiacritics2057(w);
    let score=99;
    if(w===converted) score=0;
    else if(sw===qq) score=1;
    else if(sw.startsWith(qq)) score=2;
    else if(sw.includes(qq) && qq.length>=3) score=4;
    else if(qq.length>=4){
      const d=editDistance2057(sw,qq); if(d<=2) score=8+d;
    }
    if(score<99) scored.push({w,score});
  }
  if(converted!==q && !scored.some(x=>x.w===converted)) scored.unshift({w:converted,score:0});
  return scored.sort((a,b)=>a.score-b.score||a.w.length-b.w.length||a.w.localeCompare(b.w)).slice(0,limit).map(x=>x.w);
}
function helperTable2056(){
  const head=PALI_TYPE_HELPER_2056.map(x=>`<th>${text(x[0])}</th>`).join('');
  const body=PALI_TYPE_HELPER_2056.map(x=>`<td><button class="char-btn" type="button" data-insert-char="${text(x[1])}">${text(x[1])}</button></td>`).join('');
  return `<div class="table-wrap pali-type-helper"><table><tr><th>Type</th>${head}</tr><tr><th>For</th>${body}</tr></table></div>`;
}
const DICT_QUERY_SITES_2057 = [
  {id:'dpd', name:'Digital Pāli Dictionary', hint:'词形、词根、构词、英文义项', query:'https://dpdict.net/?q={q}'},
  {id:'sutta-dict', name:'dictionary.sutta.org', hint:'中文学习者快速查义', query:'https://dictionary.sutta.org/?q={q}'},
  {id:'suttacentral', name:'SuttaCentral Dictionary', hint:'经文语境与常用词义', query:'https://suttacentral.net/define/{q}'},
  {id:'pts', name:'PTS Pāli-English Dictionary', hint:'传统巴英词典复核', query:'https://dsal.uchicago.edu/cgi-bin/app/pali_query.py?qs={q}&searchhws=yes'},
  {id:'wisdom', name:'Wisdom Library', hint:'佛教术语与补充参考', query:'https://www.wisdomlib.org/definition/{q}'}
];
function dictCards2056(){
  return DICT_QUERY_SITES_2057.map(s=>`<div class="entry-card dict-site"><h3>${text(s.name)}</h3><p class="muted">${text(s.hint)}</p><a class="btn primary dict-query-link" href="#" data-dict-id="${text(s.id)}">复制并打开查询</a></div>`).join('');
}
async function openDictionaryQuery2056(link){
  const input=$('#lookupInput');
  const word=(input?.value||'').trim();
  if(!word){alert('请先输入要查询的巴利语词形。'); return;}
  addLookupHistory(word);
  try{await navigator.clipboard?.writeText(word);}catch{}
  const site=DICT_QUERY_SITES_2057.find(x=>x.id===link.dataset.dictId);
  const q=encodeURIComponent(word);
  const url=(site?.query||'#').replace('{q}',q);
  window.open(url,'_blank','noopener');
  const status=$('#lookupStatus');
  if(status) status.innerHTML=`已复制：<strong>${text(word)}</strong>。已打开词典；若外部网站未自动查询，请直接粘贴。`;
}
function renderLookupSuggestions2057(){
  const box=$('#lookupSuggestBox'); if(!box) return;
  const q=$('#lookupInput')?.value||'';
  const list=suggestLookupWords2057(q,12);
  if(!q.trim()){box.innerHTML='<p class="muted">输入词形后显示推荐词形。</p>';return;}
  box.innerHTML=list.length?`<div class="quick-row">${list.map(w=>`<button class="small-chip" data-fill-lookup="${text(w)}">${text(w)}</button>`).join('')}</div>`:`<p class="muted">没有找到接近词形；可先用上方字母表输入变音符号，再到词典复核。</p>`;
}
async function renderDictionary(initial=''){
  const history=lookupHistory();
  app.innerHTML=`${navControls()}
  <section class="card dictionary-panel"><h2>查词</h2>
    <div class="lookup-layout">
      <div class="lookup-main">
        <label>输入巴利语词形</label>
        <input id="lookupInput" value="${text(initial)}" placeholder="例如 dhammaṃ、Buddho、gacchati">
        <div class="button-row"><button data-action="clearLookup">清空输入</button><button data-action="clearLookupHistory">清空历史</button></div>
        <h3>推荐词形</h3><div id="lookupSuggestBox" class="suggest-box"></div>
        <h3>不方便打字的字母</h3>${helperTable2056()}
        <p id="lookupStatus" class="muted">点击词典入口时，会先复制输入词，再打开对应词典。</p>
        <div id="tokenPanel" class="hidden"></div>
      </div>
      <aside class="lookup-side"><h3>常用示例</h3><div class="quick-row">${['dhammaṃ','Buddho','gacchati','gantuṃ','gantvā','phalaṃ','ca','iti'].map(w=>`<button class="small-chip" data-fill-lookup="${w}">${w}</button>`).join('')}</div></aside>
    </div>
  </section>
  <section class="card"><h2>词典入口</h2><div class="grid">${dictCards2056()}</div></section>
  <section class="card"><h2>查询历史</h2><div class="quick-row">${history.map(w=>`<button class="concept-btn" data-fill-lookup="${text(w)}">${text(w)}</button>`).join('')||'<p class="muted">暂无历史。</p>'}</div></section>`;
  const inp=$('#lookupInput');
  inp?.addEventListener('input',renderLookupSuggestions2057);
  inp?.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=document.querySelector('.dict-query-link'); if(first) openDictionaryQuery2056(first);}});
  renderLookupSuggestions2057();
}
function cleanLookupInput2057(){const inp=$('#lookupInput'); if(inp){inp.value=''; renderLookupSuggestions2057();} const p=$('#tokenPanel'); if(p) p.innerHTML='';}

document.addEventListener('click',(e)=>{
  const fill=e.target.closest('[data-fill-lookup]');
  if(fill){e.preventDefault(); const inp=$('#lookupInput'); if(inp){inp.value=fill.dataset.fillLookup; inp.focus(); renderLookupSuggestions2057();} return;}
});

function classifyToken(tok){
  tok=canonicalLexeme(normalizePaliToken(tok));
  if(!tok || tok.length<2) return null;
  const low=tok.toLowerCase().replace(/\.$/,'');
  if(tok.length===1 || low==='ti' || GRAMMAR_WORD_BLACKLIST.has(low)) return null;
  const trustedSmall=new Set(['ca','na','mā','vā','va','kho','iti','atha','eva','api','pana','ce','hi']);
  if(tok.length<=3 && !trustedSmall.has(tok) && !PALI_LEXICON[tok]) return null;
  if(/^[A-Z]{2,}$/.test(tok)) return null;
  const v=canonicalVerb(tok);
  if(v && PALI_LEXICON[v]?.pos==='verb'){
    const lex=PALI_LEXICON[v];
    return {form:v,type:'verb',grammar:lex.root||'',meaning:lex.meaning||''};
  }
  const lemma=lemmaNoun(tok);
  if(lemma && PALI_LEXICON[lemma]?.pos==='noun'){
    const lex=PALI_LEXICON[lemma];
    return {form:lemma,type:'noun',grammar:lex.gender||'',meaning:lex.meaning||''};
  }
  if(PALI_LEXICON[tok]?.pos==='pron') return {form:tok,type:'pronoun',grammar:'pron.',meaning:PALI_LEXICON[tok].meaning||''};
  if(PALI_LEXICON[tok]?.pos==='adj') return {form:tok,type:'adjective',grammar:'adj.',meaning:PALI_LEXICON[tok].meaning||''};
  if(PALI_LEXICON[tok]?.pos==='other') return {form:tok,type:'other',grammar:PALI_LEXICON[tok].grammar||'ind.',meaning:PALI_LEXICON[tok].meaning||''};
  return null;
}
function lemmaNoun(tok){
  tok=canonicalLexeme(normalizePaliToken(tok));
  if(!tok||tok.length<2) return '';
  if(PALI_LEXICON[tok]?.pos==='noun') return tok;
  const candidates=[];
  if(tok.endsWith('ssa')) candidates.push(tok.slice(0,-3));
  if(tok.endsWith('ena')) candidates.push(tok.slice(0,-3)+'a');
  if(tok.endsWith('āyaṃ')) candidates.push(tok.slice(0,-4)+'ā');
  if(tok.endsWith('āya')) candidates.push(tok.slice(0,-3)+'ā');
  if(tok.endsWith('ānaṃ')) candidates.push(tok.slice(0,-4)+'a');
  if(tok.endsWith('āhi')||tok.endsWith('ābhi')) candidates.push(tok.slice(0,-3)+'ā');
  if(tok.endsWith('ehi')||tok.endsWith('ebhi')) candidates.push(tok.slice(0,-3)+'a');
  if(tok.endsWith('esu') && tok.length>5) candidates.push(tok.slice(0,-3)+'a');
  if(tok.endsWith('āni') && tok.length>5) candidates.push(tok.slice(0,-3)+'a');
  if(tok.endsWith('e') && tok.length>4) candidates.push(tok.slice(0,-1)+'a');
  if(tok.endsWith('o') && tok.length>3) candidates.push(tok.slice(0,-1)+'a');
  if(tok.endsWith('aṃ') && tok.length>3) candidates.push(tok.slice(0,-2)+'a');
  if(tok.endsWith('ṃ') && tok.length>3) candidates.push(tok.slice(0,-1));
  for(const c of candidates.map(canonicalLexeme)) if(PALI_LEXICON[c]?.pos==='noun') return c;
  return '';
}
async function vocabHTML(lesson,exercises=[]){
  const parts=[lesson.title,lesson.summary,...(lesson.explanation||[])];
  (lesson.examples||[]).forEach(e=>parts.push(e.pali,e.cn,e.natural_cn,e.note,e.grammar_note));
  (lesson.table||[]).flat().forEach(x=>parts.push(x));
  (exercises||[]).slice(0,40).forEach(e=>parts.push(e.question,e.answer,...(e.options||[]),e.explanation));
  const tokens=dedupe(parts.flatMap(tokenizePali));
  const map=new Map();
  tokens.map(classifyToken).filter(Boolean).forEach(v=>{const k=v.type+'::'+lexemeKey(v.form); if(!map.has(k)) map.set(k,v)});
  const order={verb:1,noun:2,pronoun:3,adjective:4,other:5};
  const rows=[...map.values()].sort((a,b)=>(order[a.type]-order[b.type])||a.form.localeCompare(b.form)).slice(0,24);
  if(!rows.length) return '';
  const table=`<div class="table-wrap"><table class="vocab-table"><thead><tr><th>词形</th><th>语法信息</th><th>基本义</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${text(r.form)}</td><td>${text(r.grammar)}</td><td>${text(r.meaning)}</td></tr>`).join('')}</tbody></table></div>`;
  const body=rows.length>8?`<details class="vocab-details"><summary>本节单词（${rows.length} 个，点击展开）</summary>${table}</details>`:table;
  return `<section class="card compact"><div class="section-title"><h3>本节单词</h3></div>${body}</section>`;
}

function normalizeGrammarLine(line){
  return String(line||'')
    .replace(/\b(prs|fut|aor|impf|perf)\.ind\./g, '$1.indic.')
    .replace(/陈述·主动·/g, '陈述语气·主动语态·')
    .replace(/陈述·被动·/g, '陈述语气·被动语态·')
    .replace(/陈述·中间·/g, '陈述语气·中间语态·')
    .replace(/不定过去·陈述语气/g, '不定过去时·陈述语气')
    .replace(/，/g, ', ')
    .replace(/\s+/g,' ')
    .trim();
}
function finiteVerbGrammar2057(form){
  const f=normalizePaliToken(form); const v=canonicalVerb(f); if(!v||!PALI_LEXICON[v]) return '';
  const root=PALI_LEXICON[v].root||'';
  let tag='prs.indic.act.3sg', cn='现在时·陈述语气·主动语态·第三人称单数';
  if(/āmi$|mi$/.test(f)){tag='prs.indic.act.1sg';cn='现在时·陈述语气·主动语态·第一人称单数'}
  else if(/āma$|ma$/.test(f)){tag='prs.indic.act.1pl';cn='现在时·陈述语气·主动语态·第一人称复数'}
  else if(/si$/.test(f)){tag='prs.indic.act.2sg';cn='现在时·陈述语气·主动语态·第二人称单数'}
  else if(/tha$/.test(f)){tag='prs.indic.act.2pl';cn='现在时·陈述语气·主动语态·第二人称复数'}
  else if(/anti$|nti$/.test(f)){tag='prs.indic.act.3pl';cn='现在时·陈述语气·主动语态·第三人称复数'}
  if(/iss/.test(f)){tag=tag.replace('prs.','fut.');cn=cn.replace('现在时','将来时')}
  if(['agamāsi','agamaṃ','avoca','ahosi','akāsi'].includes(f)){tag='aor.indic.act.3sg';cn='不定过去时·陈述语气·主动语态·第三人称单数'}
  if(/tuṃ$/.test(f)) return `${f} < ${root}, inf.（不定式）`;
  if(/tvā$/.test(f)) return `${f} < ${root}, ger.（连续体）`;
  return `${f} < ${root}, ${tag}（${cn}）`;
}
function nounGrammarInSentence2057(form,tokens,idx){
  const raw=normalizePaliToken(form); const lemma=lemmaNoun(raw); if(!lemma||!PALI_LEXICON[lemma]) return '';
  const g=PALI_LEXICON[lemma].gender||'n.';
  const cn=g==='m.'?'阳性':g==='f.'?'阴性':'中性';
  let tag=''; let ccase='';
  if(/ssa$/i.test(raw)){tag=`${g}sg.gen`;ccase='属格'}
  else if(/ena$/i.test(raw)){tag=`${g}sg.ins`;ccase='工具格'}
  else if(/esu$/i.test(raw)){tag=`${g}pl.loc`;ccase='处格复数'}
  else if(/āni$/i.test(raw)){tag=`${g}pl.nom/acc`;ccase='复数·主格/宾格'}
  else if(/e$/i.test(raw)&&g==='m.'){tag=`${g}sg.loc`;ccase='处格'}
  else if(/o$/i.test(raw)&&g==='m.'){tag=`${g}sg.nom`;ccase='主格'}
  else if(/ṃ$/i.test(raw)||/aṃ$/i.test(raw)){
    const hasNomSubject=tokens.some((t,j)=>j!==idx && (/^(Ahaṃ|Tvaṃ|So|Te|Buddho|Bhikkhu)$/i.test(t)||(/o$/i.test(t)&&lemmaNoun(t))));
    const afterVerb=tokens.slice(idx+1).some(t=>canonicalVerb(t));
    const beforeVerb=tokens.slice(0,idx).some(t=>canonicalVerb(t));
    const isSubjectLike=afterVerb && !hasNomSubject;
    if(g==='n.' && isSubjectLike){tag=`${g}sg.nom`;ccase='主格'} else {tag=`${g}sg.acc`;ccase='宾格'}
  } else if(/ā$/i.test(raw)&&g==='f.'){tag=`${g}sg.nom`;ccase='主格'}
  else tag=`${g}`;
  return `${raw} < ${lemma}, ${tag}（${cn}${ccase?'·单数·'+ccase:''}）`.replace('复数·主格/宾格','复数·主格/宾格').replace('·单数·复数','·复数');
}
function pronGrammar2057(form){
  const f=normalizePaliToken(form);
  const map={Ahaṃ:'ahaṃ, pron.1sg.nom（代词·第一人称单数·主格）',ahaṃ:'ahaṃ, pron.1sg.nom（代词·第一人称单数·主格）',Tvaṃ:'tvaṃ, pron.2sg.nom（代词·第二人称单数·主格）',so:'ta, pron.m.sg.nom（代词·阳性·单数·主格）',So:'ta, pron.m.sg.nom（代词·阳性·单数·主格）',taṃ:'ta, pron.n.sg.acc（代词·中性·单数·宾格）',te:'ta, pron.m.pl.nom（代词·阳性·复数·主格）',Te:'ta, pron.m.pl.nom（代词·阳性·复数·主格）',me:'me, pron.1sg.gen/dat（代词·第一人称单数·属格/与格）'};
  return map[f]?`${f} < ${map[f]}`:'';
}
function parseSentenceTokens2057(pali){
  const toks=tokenizePali(pali); if(!toks.length) return '';
  const parts=[];
  toks.forEach((t,i)=>{
    const pron=pronGrammar2057(t); if(pron){parts.push(pron);return;}
    const vg=finiteVerbGrammar2057(t); if(vg){parts.push(vg);return;}
    const ng=nounGrammarInSentence2057(t,toks,i); if(ng){parts.push(ng);return;}
    const small=classifyToken(t); if(small&&small.type==='other') parts.push(`${small.form} < ${small.form}, ind.（不变词）`);
  });
  return parts.join('；');
}
function examplesHTML(lesson){
  const items=relevantExamples(lesson).map(e=>{
    let parse=parseSentenceTokens2057(e.pali||'') || normalizeGrammarLine(e.grammar_note||e.note||'');
    return `<div class="example"><div class="pali">${text(e.pali||'')}</div><div class="translation"><strong>翻译：</strong>${text(e.natural_cn||e.cn||'')}</div>${parse?`<div class="note"><strong>语法解析：</strong>${text(parse)}</div>`:''}</div>`;
  }).join('');
  return items?`<section class="card compact"><div class="section-title"><h3>例句</h3></div>${items}</section>`:'';
}


/* ===== 20.74 练习题质量精修版：全站词根白名单与句法功能修正 =====
   原则：词根只来自白名单；ind. 只表示不变词；indic. 表示陈述语气；
   名词/代词/形容词在句子中尽量给出确定格位，不机械显示 nom/acc 或 gen/dat。
*/
const PALI_ROOTS_2059 = {
  "deseti": "√dis",
  "desito": "√dis",
  "desīyati": "√dis",
  "desetuṃ": "√dis",
  "desetvā": "√dis",
  "suṇāti": "√su",
  "suṇanti": "√su",
  "suṇāmi": "√su",
  "suṇātha": "√su",
  "sotuṃ": "√su",
  "sutvā": "√su",
  "sutaṃ": "√su",
  "suta": "√su",
  "paccassosuṃ": "√su",
  "vandāmi": "√vand",
  "vandituṃ": "√vand",
  "vandati": "√vand",
  "vasati": "√vas",
  "vasanti": "√vas",
  "viharati": "√har",
  "viharanti": "√har",
  "āgacchati": "√gam",
  "āgacchanti": "√gam",
  "gacchati": "√gam",
  "gacchanti": "√gam",
  "gacchāmi": "√gam",
  "gacchasi": "√gam",
  "gaccha": "√gam",
  "gacchatu": "√gam",
  "gaccheyya": "√gam",
  "gantuṃ": "√gam",
  "gantvā": "√gam",
  "gacchanto": "√gam",
  "Gacchanto": "√gam",
  "Gacchantī": "√gam",
  "gata": "√gam",
  "agamāsi": "√gam",
  "agamaṃ": "√gam",
  "gamissati": "√gam",
  "pasīdati": "√sad",
  "pasīdanti": "√sad",
  "pasanno": "√sad",
  "uppajjati": "√pad",
  "pahīyati": "√hā",
  "virajjati": "√raj",
  "ādāya": "√dā",
  "dātuṃ": "√dā",
  "datvā": "√dā",
  "deti": "√dā",
  "dadāti": "√dā",
  "Dinnaṃ": "√dā",
  "dinnaṃ": "√dā",
  "passati": "√pass",
  "passāmi": "√pass",
  "passanti": "√pass",
  "Passantā": "√pass",
  "karoti": "√kar",
  "karotha": "√kar",
  "karosi": "√kar",
  "Kataṃ": "√kar",
  "kataṃ": "√kar",
  "Karaṇīyaṃ": "√kar",
  "karaṇīyaṃ": "√kar",
  "pahātabbo": "√hā",
  "sacchikātabbo": "√kar",
  "bhāvetabbo": "√bhū",
  "sikkhitabbā": "√sikkh",
  "nassati": "√nas",
  "hoti": "√bhū",
  "hontu": "√bhū",
  "atthi": "√as",
  "Natthi": "√as",
  "natthi": "√as",
  "āha": "√ah",
  "avoca": "√vac",
  "khādati": "√khād",
  "pivati": "√pā",
  "kīḷanti": "√kīḷ",
  "vaṭṭati": "√vaṭṭ",
  "sayati": "√sī",
  "Nisīditvā": "√sad",
  "nisīdati": "√sad",
  "Uṭṭhahitvā": "√ṭhā",
  "hasati": "√has",
  "tiṭṭhanti": "√ṭhā",
  "bhaṇa": "√bhaṇ",
  "vadati": "√vad",
  "jīvati": "√jīv",
  "sikkhati": "√sikkh",
  "vindati": "√vid",
  "pavisati": "√vis",
  "hanituṃ": "√han",
  "paṭipajjati": "√pad",
  "labhati": "√labh",
  "ñatvā": "√ñā",
  "pariññeyyaṃ": "√ñā",
  "sākacchanti": "√kath",
  "āmantesi": "√mant",
  "bhāsituṃ": "√bhās"
};
const VERB_GRAMMAR_2059 = {
  "deseti": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "desīyati": "prs.indic.pass.3sg（现在时·陈述语气·被动语态·第三人称单数）",
  "desito": "p.p.m.sg.nom（过去分词·阳性·单数·主格）",
  "suṇāti": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "suṇanti": "prs.indic.act.3pl（现在时·陈述语气·主动语态·第三人称复数）",
  "suṇāmi": "prs.indic.act.1sg（现在时·陈述语气·主动语态·第一人称单数）",
  "suṇātha": "imp.act.2pl（命令语气·主动语态·第二人称复数）",
  "sotuṃ": "inf.（不定式）",
  "sutvā": "ger.（连续体）",
  "sutaṃ": "p.p.n.sg.nom（过去分词·中性·单数·主格）",
  "paccassosuṃ": "aor.indic.act.3pl（不定过去时·陈述语气·主动语态·第三人称复数）",
  "vandāmi": "prs.indic.act.1sg（现在时·陈述语气·主动语态·第一人称单数）",
  "vandituṃ": "inf.（不定式）",
  "vasati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "vasanti": "prs.indic.act.3pl（现在时·陈述语气·主动语态·第三人称复数）",
  "viharati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "āgacchati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "gacchati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "gacchanti": "prs.indic.act.3pl（现在时·陈述语气·主动语态·第三人称复数）",
  "gacchāmi": "prs.indic.act.1sg（现在时·陈述语气·主动语态·第一人称单数）",
  "gacchasi": "prs.indic.act.2sg（现在时·陈述语气·主动语态·第二人称单数）",
  "gaccha": "imp.act.2sg（命令语气·主动语态·第二人称单数）",
  "gantuṃ": "inf.（不定式）",
  "gantvā": "ger.（连续体）",
  "Gacchanto": "pr.p.act.m.sg.nom（现在主动分词·阳性·单数·主格）",
  "Gacchantī": "pr.p.act.f.sg.nom（现在主动分词·阴性·单数·主格）",
  "pasīdati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "pasīdanti": "prs.indic.act.3pl（现在时·陈述语气·主动语态·第三人称复数）",
  "pasanno": "p.p.m.sg.nom（过去分词·阳性·单数·主格）",
  "uppajjati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "pahīyati": "prs.indic.pass.3sg（现在时·陈述语气·被动语态·第三人称单数）",
  "virajjati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "ādāya": "ger.（连续体）",
  "dātuṃ": "inf.（不定式）",
  "datvā": "ger.（连续体）",
  "deti": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "Dinnaṃ": "p.p.n.sg.nom（过去分词·中性·单数·主格）",
  "passati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "passāmi": "prs.indic.act.1sg（现在时·陈述语气·主动语态·第一人称单数）",
  "Passantā": "pr.p.act.m.pl.nom（现在主动分词·阳性·复数·主格）",
  "karoti": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "karotha": "imp.act.2pl（命令语气·主动语态·第二人称复数）",
  "karosi": "prs.indic.act.2sg（现在时·陈述语气·主动语态·第二人称单数）",
  "Kataṃ": "p.p.n.sg.nom（过去分词·中性·单数·主格）",
  "Karaṇīyaṃ": "f.p.p.n.sg.nom（将来被动分词·中性·单数·主格）",
  "pahātabbo": "f.p.p.m.sg.nom（将来被动分词·阳性·单数·主格）",
  "sacchikātabbo": "f.p.p.m.sg.nom（将来被动分词·阳性·单数·主格）",
  "bhāvetabbo": "f.p.p.m.sg.nom（将来被动分词·阳性·单数·主格）",
  "sikkhitabbā": "f.p.p.f.pl.nom（将来被动分词·阴性·复数·主格）",
  "nassati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "hoti": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "hontu": "imp.act.3pl（命令语气·主动语态·第三人称复数）",
  "atthi": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "Natthi": "na + atthi < √as, prs.indic.act.3sg（否定存在动词·现在时·陈述语气·主动语态·第三人称单数）",
  "āha": "aor.indic.act.3sg（不定过去时·陈述语气·主动语态·第三人称单数）",
  "avoca": "aor.indic.act.3sg（不定过去时·陈述语气·主动语态·第三人称单数）",
  "khādati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "pivati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "kīḷanti": "prs.indic.act.3pl（现在时·陈述语气·主动语态·第三人称复数）",
  "vaṭṭati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "sayati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "Nisīditvā": "ger.（连续体）",
  "nisīdati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "Uṭṭhahitvā": "ger.（连续体）",
  "hasati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "tiṭṭhanti": "prs.indic.act.3pl（现在时·陈述语气·主动语态·第三人称复数）",
  "bhaṇa": "imp.act.2sg（命令语气·主动语态·第二人称单数）",
  "vadati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "jīvati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "sikkhati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "vindati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "pavisati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "hanituṃ": "inf.（不定式）",
  "paṭipajjati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "labhati": "prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）",
  "ñatvā": "ger.（连续体）",
  "pariññeyyaṃ": "f.p.p.n.sg.nom（将来被动分词·中性·单数·主格）",
  "sākacchanti": "prs.indic.act.3pl（现在时·陈述语气·主动语态·第三人称复数）",
  "āmantesi": "aor.indic.act.3sg（不定过去时·陈述语气·主动语态·第三人称单数）",
  "bhāsituṃ": "inf.（不定式）"
};
Object.entries(PALI_ROOTS_2059).forEach(([form, root])=>{
  const canonical = VERB_3SG_MAP[form] || form;
  if(PALI_LEXICON[canonical] && PALI_LEXICON[canonical].pos==='verb') PALI_LEXICON[canonical].root = root;
  if(PALI_LEXICON[form] && PALI_LEXICON[form].pos==='verb') PALI_LEXICON[form].root = root;
});
Object.assign(VERB_3SG_MAP, {
  khādati:'khādati', pivati:'pivati', deti:'dadāti', kīḷanti:'kīḷati', kīḷati:'kīḷati',
  vaṭṭati:'vaṭṭati', sayati:'sayati', nisīdati:'nisīdati', Nisīditvā:'nisīdati',
  Uṭṭhahitvā:'tiṭṭhati', hasati:'hasati', tiṭṭhanti:'tiṭṭhati', bhaṇa:'bhaṇati', bhaṇati:'bhaṇati',
  jīvati:'jīvati', sikkhati:'sikkhati', vindati:'vindati', hanituṃ:'hanati', hanati:'hanati',
  paṭipajjati:'paṭipajjati', ñatvā:'jānāti', virajjati:'virajjati', sākacchanti:'sākacchati',
  āmantesi:'āmanteti', paccassosuṃ:'suṇāti', bhāsituṃ:'bhāsati', bhāsati:'bhāsati',
  pariññeyyaṃ:'jānāti', pahātabbo:'pajahati', sacchikātabbo:'sacchikaroti', bhāvetabbo:'bhāveti', sikkhitabbā:'sikkhati'
});
Object.assign(PALI_LEXICON, {
  khādati:{pos:'verb',root:'√khād',meaning:'吃'}, pivati:{pos:'verb',root:'√pā',meaning:'喝'}, dadāti:{pos:'verb',root:'√dā',meaning:'给；给予'}, deti:{pos:'verb',root:'√dā',meaning:'给；施与'},
  kīḷati:{pos:'verb',root:'√kīḷ',meaning:'玩耍'}, vaṭṭati:{pos:'verb',root:'√vaṭṭ',meaning:'适宜；应当'}, sayati:{pos:'verb',root:'√sī',meaning:'睡；躺卧'}, nisīdati:{pos:'verb',root:'√sad',meaning:'坐下'},
  tiṭṭhati:{pos:'verb',root:'√ṭhā',meaning:'站立；停住'}, hasati:{pos:'verb',root:'√has',meaning:'笑'}, bhaṇati:{pos:'verb',root:'√bhaṇ',meaning:'说'}, jīvati:{pos:'verb',root:'√jīv',meaning:'活；生活'},
  sikkhati:{pos:'verb',root:'√sikkh',meaning:'学习；训练'}, vindati:{pos:'verb',root:'√vid',meaning:'获得；经历'}, hanati:{pos:'verb',root:'√han',meaning:'杀害；击打'}, paṭipajjati:{pos:'verb',root:'√pad',meaning:'实践；行道'},
  virajjati:{pos:'verb',root:'√raj',meaning:'离染；厌离'}, sākacchati:{pos:'verb',root:'√kath',meaning:'讨论；交谈'}, āmanteti:{pos:'verb',root:'√mant',meaning:'召唤；告知'}, bhāsati:{pos:'verb',root:'√bhās',meaning:'说；讲'},
  jānāti:{pos:'verb',root:'√ñā',meaning:'知道；了知'}, pajahati:{pos:'verb',root:'√hā',meaning:'舍断；放弃'}, sacchikaroti:{pos:'verb',root:'√kar',meaning:'亲证；作证'}, bhāveti:{pos:'verb',root:'√bhū',meaning:'修习；培育'}
});
function normalizeGrammarLine(line){
  return String(line||'')
    .replace(/(prs|fut|aor|impf|perf)\.ind\./g, '$1.indic.')
    .replace(/陈述·主动·/g, '陈述语气·主动语态·')
    .replace(/陈述·被动·/g, '陈述语气·被动语态·')
    .replace(/陈述·中间·/g, '陈述语气·中间语态·')
    .replace(/命令·主动/g, '命令语气·主动语态')
    .replace(/不定过去·陈述语气/g, '不定过去时·陈述语气')
    .replace(/\s+/g,' ')
    .trim();
}
function finiteVerbGrammar2057(form){
  const f=normalizePaliToken(form);
  if(VERB_GRAMMAR_2059[f]){
    if(f==='Natthi') return VERB_GRAMMAR_2059[f];
    const root=PALI_ROOTS_2059[f] || PALI_ROOTS_2059[VERB_3SG_MAP[f]] || '';
    return root ? `${f} < ${root}, ${VERB_GRAMMAR_2059[f]}` : '';
  }
  const v=canonicalVerb(f); if(!v||!PALI_LEXICON[v]) return '';
  const root=PALI_LEXICON[v].root||''; if(!root) return '';
  return `${f} < ${root}, prs.indic.act.3sg（现在时·陈述语气·主动语态·第三人称单数）`;
}
function pronGrammar2057(form){
  const f=normalizePaliToken(form);
  const map={Ahaṃ:'ahaṃ, pron.1sg.nom（代词·第一人称单数·主格）',ahaṃ:'ahaṃ, pron.1sg.nom（代词·第一人称单数·主格）',Tvaṃ:'tvaṃ, pron.2sg.nom（代词·第二人称单数·主格）',so:'ta, pron.m.sg.nom（代词·阳性·单数·主格）',So:'ta, pron.m.sg.nom（代词·阳性·单数·主格）',taṃ:'ta, pron.n.sg.acc（代词·中性·单数·宾格）',te:'ta, pron.m.pl.nom（代词·阳性·复数·主格）',Te:'ta, pron.m.pl.nom（代词·阳性·复数·主格）',me:'ahaṃ, pron.1sg.dat（代词·第一人称单数·与格）',Yo:'yo, pron.m.sg.nom（关系代词·阳性·单数·主格）',yo:'yo, pron.m.sg.nom（关系代词·阳性·单数·主格）',Ye:'yo, pron.m.pl.nom（关系代词·阳性·复数·主格）',ye:'yo, pron.m.pl.nom（关系代词·阳性·复数·主格）'};
  return map[f]?`${f} < ${map[f]}`:'';
}
function nounGrammarInSentence2057(form,tokens,idx){
  const raw=normalizePaliToken(form); const lemma=lemmaNoun(raw); if(!lemma||!PALI_LEXICON[lemma]) return '';
  const g=PALI_LEXICON[lemma].gender||'n.'; const cn=g==='m.'?'阳性':g==='f.'?'阴性':'中性';
  const lower=raw.toLowerCase(); let tag='', ccase='', number='单数';
  if(/ssa$/i.test(raw)){tag=`${g}sg.gen`;ccase='属格'}
  else if(/ena$/i.test(raw)){tag=`${g}sg.ins`;ccase='工具格'}
  else if(/esu$/i.test(raw)){tag=`${g}pl.loc`;ccase='处格';number='复数'}
  else if(/ānaṃ$/i.test(raw)){tag=`${g}pl.gen`;ccase='属格';number='复数'}
  else if(/āni$/i.test(raw)){tag=`${g}pl.nom/acc`;return `${raw} < ${lemma}, ${tag}（${cn}·复数·主格/宾格）`}
  else if(/ū$/i.test(raw) && lemma==='bhikkhu'){
    const next=tokens.slice(idx+1).map(x=>normalizePaliToken(x));
    const before=tokens.slice(0,idx).map(x=>normalizePaliToken(x));
    const afterVerb=next.some(t=>canonicalVerb(t)); const beforeVerb=before.some(t=>canonicalVerb(t));
    const hasFiniteBefore=beforeVerb;
    const roleAcc=hasFiniteBefore || /^bhikkhū$/i.test(raw)&&next.some(t=>['āmantesi'].includes(t));
    tag=roleAcc?`${g}pl.acc`:`${g}pl.nom`; ccase=roleAcc?'宾格':'主格'; number='复数';
  }
  else if(/o$/i.test(raw)&&g==='m.'){tag=`${g}sg.nom`;ccase='主格'}
  else if(/ā$/i.test(raw)&&g==='f.'){tag=`${g}sg.nom`;ccase='主格'}
  else if(/e$/i.test(raw)&&g==='m.'){tag=`${g}sg.loc`;ccase='处格'}
  else if(/ṃ$/i.test(raw)||/aṃ$/i.test(raw)){
    const hasExplicitSubject=tokens.some((t,j)=>j!==idx && (/^(Ahaṃ|Tvaṃ|So|Te|Buddho|Bhikkhu|Bhagavā|Dārako|Itthī|Rājā|Attā)$/i.test(t)||(/o$/i.test(t)&&lemmaNoun(t))));
    const verbs=tokens.map(t=>normalizePaliToken(t)).filter(canonicalVerb);
    const afterVerb=tokens.slice(idx+1).some(t=>canonicalVerb(t));
    const beforeVerb=tokens.slice(0,idx).some(t=>canonicalVerb(t));
    const likelySubject=(g==='n.' && afterVerb && !hasExplicitSubject);
    tag=likelySubject?`${g}sg.nom`:`${g}sg.acc`; ccase=likelySubject?'主格':'宾格';
  } else return '';
  return `${raw} < ${lemma}, ${tag}（${cn}·${number}·${ccase}）`;
}
function parseSentenceTokens2057(pali){
  const toks=tokenizePali(pali); if(!toks.length) return '';
  const parts=[];
  toks.forEach((t,i)=>{
    const pron=pronGrammar2057(t); if(pron){parts.push(pron);return;}
    const vg=finiteVerbGrammar2057(t); if(vg){parts.push(vg);return;}
    if(normalizePaliToken(t)==='ceva'){parts.push('ceva < ca + eva, ind.（连读/合写；并列与强调）');return;}
    if(normalizePaliToken(t)==='Tepi'){parts.push('Tepi < te + api, pron.m.pl.nom + ind.（他们也）');return;}
    const ng=nounGrammarInSentence2057(t,toks,i); if(ng){parts.push(ng);return;}
    const small=classifyToken(t); if(small&&small.type==='other') parts.push(`${small.form} < ${small.form}, ind.（不变词）`);
  });
  return parts.join('；');
}


/* 20.74 练习题质量精修版：增强系统检查，不改动学习数据。 */
const DIAG_ROOT_WHITELIST_2061 = new Set([
  'gam','kar','bhū','as','su','dis','pass','vas','vand','khād','pat','ñā','vac','vad','labh','pac','dā','han','pucch','sikkh','jān','hū','des'
]);

function diagStatus2061(ok, warn=false){
  if(ok) return '通过';
  return warn ? '需核查' : '异常';
}
function diagLevel2061(ok, warn=false){
  if(ok) return 'ok';
  return warn ? 'warn' : 'bad';
}
function diagItem2061(section, name, ok, detail, fix='', warn=false){
  return {section, name, status:diagStatus2061(ok,warn), level:diagLevel2061(ok,warn), detail:String(detail||''), fix:String(fix||'')};
}
function diagBadgeFromLevel2061(level){
  if(level==='ok') return '<span class="diag-badge ok">通过</span>';
  if(level==='warn') return '<span class="diag-badge warn">需核查</span>';
  return '<span class="diag-badge bad">异常</span>';
}
function diagTable2061(title, items){
  const rows = items.map(it=>`<tr class="diag-row diag-${it.level}"><td>${text(it.name)}</td><td>${diagBadgeFromLevel2061(it.level)}</td><td>${text(it.detail)}</td><td>${text(it.fix||'—')}</td></tr>`).join('');
  return `<section class="card"><h2>${text(title)}</h2><div class="table-wrap"><table class="diag-table diag-table-wide"><thead><tr><th>检查项</th><th>状态</th><th>详情</th><th>处理建议</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
function diagPlainReport2061(report){
  const lines = [];
  lines.push(`Pāli Learning Lab ${VERSION} 系统检查报告`);
  lines.push(`生成时间：${new Date().toLocaleString()}`);
  lines.push('');
  lines.push(`总检查项：${report.items.length}`);
  lines.push(`通过：${report.counts.ok}`);
  lines.push(`需核查：${report.counts.warn}`);
  lines.push(`异常：${report.counts.bad}`);
  lines.push('');
  for(const section of report.sections){
    lines.push(`【${section}】`);
    report.items.filter(x=>x.section===section).forEach(x=>{
      lines.push(`- ${x.status}｜${x.name}：${x.detail}${x.fix?`；建议：${x.fix}`:''}`);
    });
    lines.push('');
  }
  return lines.join('\n');
}
function collectRootsFromText2061(allText){
  const roots = [];
  const re = /√([A-Za-zāīūṅñṭḍṇḷṃṁ]+)/g;
  let m; while((m=re.exec(allText))) roots.push(m[1]);
  return unique2060(roots);
}
function collectAmbiguousGrammar2061(sentence){
  const res=[];
  (sentence||[]).forEach(s=>{
    (s.tokens||[]).forEach(t=>{
      const g=String(t.grammar||'');
      if(/nom\/acc|acc\/nom|gen\/dat|dat\/gen|loc\/ins|ins\/loc/.test(g)){
        res.push(`${s.id||s.sentence||'句子'}：${t.form||''} ${g}`);
      }
    });
  });
  return res;
}
async function renderDiagnostics(){
  setLoading();
  const sections = ['数据规模', '文件加载', '路由与 ID', '内容质量', '语法标注与词根', '发布验收'];
  const items = [];
  const add = (section,name,ok,detail,fix='',warn=false)=>items.push(diagItem2061(section,name,ok,detail,fix,warn));

  const chunkFiles=Array.from({length:11},(_,i)=>`lesson-chunk-${String(i+1).padStart(2,'0')}.json`);
  const moduleFiles=Array.from({length:8},(_,i)=>`module-${String(i+1).padStart(2,'0')}-module.json`);
  const coreFiles=['index.html','app.js','style.css','cache-reset.html','grammar-index.json','grammar-lesson-manifest.json','grammar-module-directory.json','exercise-index.json','search-index.json','learning-routes-data.js','sentence-analysis-data.js','sentence-patterns-data.js','confusion-pairs-data.js','terminology-glossary-data.js','dictionary-sites-data.js','token-analysis-data.js','buddhist-reading-data.js','buddhist-background-data.js','academic-training-data.js','module-guides-data.js','linguistics-tips-data.js',...chunkFiles,...moduleFiles];
  const fileText={};
  let fileOk=0;
  for(const f of coreFiles){
    try{fileText[f]=await fetchText2060(f); fileOk++; add('文件加载',f,true,'已加载','');}
    catch(e){add('文件加载',f,false,text(e.message||e),'确认文件已上传到 GitHub 根目录，且文件名大小写完全一致。');}
  }

  let grammar=[], exercise=[], routes=[], sentence=[], terms=[], tokens={}, manifest={}, moduleDir=[];
  let chunks=[], modules=[];
  try{grammar=await loadData('grammarIndex')}catch(e){}
  try{exercise=await loadData('exercise')}catch(e){}
  try{routes=await loadData('routes')}catch(e){}
  try{sentence=await loadData('sentence')}catch(e){}
  try{terms=await loadData('terminology')}catch(e){}
  try{tokens=await loadData('token')}catch(e){}
  try{manifest=await loadData('manifest')}catch(e){}
  try{moduleDir=await loadData('moduleDirectory')}catch(e){}
  for(const f of chunkFiles){try{chunks.push({file:f,data:await fetchJson(f)})}catch(e){chunks.push({file:f,data:null,error:e})}}
  for(const f of moduleFiles){try{modules.push({file:f,data:await fetchJson(f)})}catch(e){modules.push({file:f,data:null,error:e})}}

  const grammarIds=new Set(grammar.map(x=>String(x.id)));
  const detailLessons=chunks.flatMap(c=>Array.isArray(c.data)?c.data:[]);
  const detailIds=new Set(detailLessons.map(x=>String(x.id)));
  const manifestIds=new Set(Object.keys(manifest||{}).map(String));
  const exerciseIds=unique2060(exercise.map(x=>String(x.lesson_id||''))).filter(Boolean);
  const moduleLessonIds=unique2060(modules.flatMap(m=>Array.isArray(m.data)?m.data.map(x=>String(x.id)):[]));

  add('数据规模','语法点数量', grammar.length===109, `当前：${grammar.length}；预期：109`, '若不为 109，检查 grammar-index.json 是否为完整版本。');
  add('数据规模','课程详情数量', detailLessons.length>=109, `当前：${detailLessons.length}；预期：≥109`, '检查 11 个 lesson-chunk 文件是否完整。', detailLessons.length!==109);
  add('数据规模','lesson chunk 数量', chunks.filter(c=>Array.isArray(c.data)).length===11, `当前：${chunks.filter(c=>Array.isArray(c.data)).length}/11`, '补齐缺失的 lesson-chunk-xx.json。');
  add('数据规模','module 文件数量', modules.filter(m=>Array.isArray(m.data)).length===8, `当前：${modules.filter(m=>Array.isArray(m.data)).length}/8`, '补齐 module-01-module.json 至 module-08-module.json。');
  add('数据规模','练习题数量', exercise.length>=1000, `当前：${exercise.length}；预期：约1004`, '检查 exercise-index.json 是否完整。', exercise.length>=900 && exercise.length<1000);
  add('数据规模','术语库数量', terms.length>=120, `当前：${terms.length}；预期：约120`, '检查 terminology-glossary-data.js 是否完整读取。', terms.length>=100 && terms.length<120);
  add('数据规模','句子分析数量', sentence.length>=90, `当前：${sentence.length}；预期：约92`, '检查 sentence-analysis-data.js 是否完整读取。', sentence.length>=80 && sentence.length<90);
  add('数据规模','词形分析数量', Object.keys(tokens||{}).length>=200, `当前：${Object.keys(tokens||{}).length}；预期：约200+`, '检查 token-analysis-data.js 是否完整读取。', Object.keys(tokens||{}).length>=150 && Object.keys(tokens||{}).length<200);

  const missingDetail=[...grammarIds].filter(id=>!detailIds.has(id));
  const manifestMissing=[...grammarIds].filter(id=>!manifestIds.has(id));
  const routeIds=[]; (routes||[]).forEach(r=>(r.steps||[]).forEach(s=>(s.lesson_ids||[]).forEach(id=>routeIds.push(String(id)))));
  const routeMissing=unique2060(routeIds).filter(id=>!grammarIds.has(id));
  const exerciseMissing=exerciseIds.filter(id=>!grammarIds.has(id));
  const moduleMissing=moduleLessonIds.filter(id=>!grammarIds.has(id));

  add('路由与 ID','课程索引与详情对应', missingDetail.length===0, missingDetail.length?`缺少详情：${missingDetail.slice(0,20).join(', ')}${missingDetail.length>20?'……':''}`:'全部课程在 chunk 中找到', '缺失详情会导致课程页打不开，应修对应 lesson-chunk。');
  add('路由与 ID','课程 manifest 对应', manifestMissing.length===0, manifestMissing.length?`manifest 缺少：${manifestMissing.slice(0,20).join(', ')}${manifestMissing.length>20?'……':''}`:'全部课程有 manifest 记录', 'manifest 缺失会导致点击课程无法定位 chunk。');
  add('路由与 ID','学习路线 lesson_id', routeMissing.length===0, routeMissing.length?`找不到：${routeMissing.join(', ')}`:'全部路线课程可在 grammar-index 找到', '修 learning-routes-data.js 中的 lesson_ids。');
  add('路由与 ID','练习题 lesson_id', exerciseMissing.length===0, exerciseMissing.length?`找不到课程：${exerciseMissing.slice(0,30).join(', ')}${exerciseMissing.length>30?'……':''}`:'练习题 lesson_id 均可对应课程', '修 exercise-index.json 中错误 lesson_id。', exerciseMissing.length>0);
  add('路由与 ID','模块课程 id', moduleMissing.length===0, moduleMissing.length?`模块中找不到课程：${moduleMissing.slice(0,30).join(', ')}`:'模块课程均可对应 grammar-index', '修 module-xx-module.json 中错误 id。');
  add('路由与 ID','路线标签数量', Array.isArray(routes)&&routes.length>=4, `当前：${routes.length||0}；预期：零基础/动词/名词格位/句子分析等`, '检查 learning-routes-data.js 是否包含专项路线。', routes.length>=1 && routes.length<4);

  const lessonsMissingExample=detailLessons.filter(l=>!(l.examples||[]).length).map(l=>`${l.id}:${l.title}`);
  const examplesNoCn=[]; const examplesNoParse=[];
  detailLessons.forEach(l=>(l.examples||[]).forEach((ex,i)=>{if(!ex.cn&&!ex.natural_cn&&!ex.translation) examplesNoCn.push(`${l.id}#${i+1}`); if(!ex.note&&!ex.grammar_note&&!ex.parse) examplesNoParse.push(`${l.id}#${i+1}`)}));
  const sentenceNoTokens=sentence.filter(x=>!(x.tokens||[]).length).map(x=>x.id||x.sentence);
  const ambiguous=collectAmbiguousGrammar2061(sentence);

  add('内容质量','课程例句覆盖', lessonsMissingExample.length===0, lessonsMissingExample.length?`无例句课程：${lessonsMissingExample.slice(0,20).join('；')}`:'所有课程详情均有例句', '逐课补充与本课内容高度相关的例句。', lessonsMissingExample.length>0);
  add('内容质量','例句翻译字段', examplesNoCn.length===0, examplesNoCn.length?`缺翻译：${examplesNoCn.slice(0,30).join(', ')}${examplesNoCn.length>30?'……':''}`:'未发现缺翻译例句', '补充翻译字段。', examplesNoCn.length>0);
  add('内容质量','例句语法解析字段', examplesNoParse.length===0, examplesNoParse.length?`缺解析：${examplesNoParse.slice(0,30).join(', ')}${examplesNoParse.length>30?'……':''}`:'未发现缺解析例句', '按“词形 < 词典形/词根, 略语（中文说明）”补充解析。', examplesNoParse.length>0);
  add('内容质量','句子分析 tokens', sentenceNoTokens.length===0, sentenceNoTokens.length?`缺逐词分析：${sentenceNoTokens.slice(0,20).join(', ')}`:'句子分析均有 tokens', '补齐 tokens，句子分析页才能分步显示。');
  add('内容质量','句子分析同形格位', ambiguous.length===0, ambiguous.length?`发现 ${ambiguous.length} 处 nom/acc 或 gen/dat 等并列格位：${ambiguous.slice(0,10).join('；')}${ambiguous.length>10?'……':''}`:'未发现明显并列格位残留', '逐句按句中功能落实为单一格位；确实无法判断时才保留并列。', ambiguous.length>0);

  const allText=Object.entries(fileText).map(([f,t])=>`\n/* ${f} */\n${t}`).join('\n');
  function countRe(re){return (allText.match(re)||[]).length}
  const badInd=countRe(/\b(?:prs|fut|aor|impf|perf)\.ind\./g);
  const multiRoot=countRe(/√[^\n;，。,）)]{1,30}\s*\/\s*[^\n;，。,）)]{1,30}/g);
  const rootReview=countRe(/词根需查词典复核|需查词典复核/g);
  const ipaPrompt=countRe(/点击查看\s*IPA|悬停查看\s*IPA|点击查观察\s*IPA/g);
  const noDetail=countRe(/暂无详细解释/g);
  const relatedBlock=countRe(/相关佛典阅读句式|相关学术训练|相关佛典背景/g);
  const routeNotFound=countRe(/语法点\s*\$?\{?\w*\}?\s*未找到|语法点 \d+ 未找到/g);
  const roots=collectRootsFromText2061(allText);
  const rootsNotWhite=roots.filter(r=>!DIAG_ROOT_WHITELIST_2061.has(r));

  add('语法标注与词根','陈述语气缩略语', badInd===0, badInd?`发现 ${badInd} 处 .ind. 风险写法；应使用 .indic.`:'未发现 .ind. 表示陈述语气', '统一：ind. 只表示不变词；indic. 表示陈述语气。');
  add('语法标注与词根','多词根写法', multiRoot===0, multiRoot?`发现 ${multiRoot} 处疑似多词根/斜杠词根写法`:'未发现疑似 √.../... 多词根写法', '每个动词只保留一个词典确认词根。');
  add('语法标注与词根','词根复核占位', rootReview===0, rootReview?`发现 ${rootReview} 处“需复核”类占位`:'未发现词根复核占位', '尽量以词典确认词根替换；无法确认时避免收录该词。');
  add('语法标注与词根','词根白名单覆盖', rootsNotWhite.length===0, rootsNotWhite.length?`需人工核查词根：${rootsNotWhite.slice(0,30).join(', ')}${rootsNotWhite.length>30?'……':''}`:`当前检测到 ${roots.length} 个词根，均在白名单内`, '这不是错误，只提示人工复核白名单外词根。', rootsNotWhite.length>0);

  add('发布验收','IPA 提示废话', ipaPrompt===0, ipaPrompt?`发现 ${ipaPrompt} 处“点击/悬停查看 IPA”`:'未发现 IPA 提示废话', '术语库直接显示 /.../，课程正文不做提示文案。');
  add('发布验收','无效术语弹窗文案', noDetail===0, noDetail?`发现 ${noDetail} 处“暂无详细解释”`:'未发现无效术语弹窗文案', '核心概念点击应直接进入术语库搜索。');
  add('发布验收','课程页冗余相关区块', relatedBlock===0, relatedBlock?`发现 ${relatedBlock} 处相关佛典/学术区块文案`:'未发现课程页冗余相关区块文案', '相关内容作为独立页面保留，不塞入课程底部。');
  add('发布验收','路线未找到文案', routeNotFound===0, routeNotFound?`发现 ${routeNotFound} 处“语法点未找到”模板/残留`:'未发现路线未找到残留', '若只是诊断模板可忽略；若页面实际出现，需修路线 lesson_id。', routeNotFound>0);

  const counts = {
    ok: items.filter(x=>x.level==='ok').length,
    warn: items.filter(x=>x.level==='warn').length,
    bad: items.filter(x=>x.level==='bad').length
  };
  const report = {version:VERSION, generatedAt:new Date().toISOString(), counts, sections, items};
  window.__PALI_DIAG_REPORT = report;
  const plain = diagPlainReport2061(report);

  const summary = `<section class="card"><h1>系统检查 / 数据诊断</h1><p class="muted">本页用于发布前验收。它只读取文件并检查数据完整性、路由对应关系、常见旧问题残留和高风险语法标注，不修改任何学习数据。</p>
    <div class="stats">
      <div class="stat"><strong>${counts.ok}</strong><span>通过</span></div>
      <div class="stat"><strong>${counts.warn}</strong><span>需核查</span></div>
      <div class="stat"><strong>${counts.bad}</strong><span>异常</span></div>
      <div class="stat"><strong>${fileOk}</strong><span>文件已加载</span></div>
    </div>
    <div class="button-row">
      <button data-action="copyDiag2061">复制检查报告</button>
      <button data-action="downloadDiag2061">下载检查报告</button>
    </div>
    <textarea id="diagReportText" class="diag-report-text" readonly>${text(plain)}</textarea>
  </section>`;

  app.innerHTML=`${navControls()}${summary}${diagTable2061('一、数据规模核查',items.filter(x=>x.section==='数据规模'))}${diagTable2061('二、文件加载核查',items.filter(x=>x.section==='文件加载'))}${diagTable2061('三、路由与 ID 对应核查',items.filter(x=>x.section==='路由与 ID'))}${diagTable2061('四、内容质量核查',items.filter(x=>x.section==='内容质量'))}${diagTable2061('五、语法标注与词根核查',items.filter(x=>x.section==='语法标注与词根'))}${diagTable2061('六、发布验收核查',items.filter(x=>x.section==='发布验收'))}${releaseChecklist2069()}<section class="card"><h2>下一步处理原则</h2><ol><li>若有“异常”，先修异常；异常通常会影响页面功能。</li><li>若是“需核查”，不一定影响运行，但涉及教学准确性，应人工复核。</li><li>修复后重新上传并再次运行本页，直到核心数据、路由检查和发布流程全部通过。</li></ol></section>`;
}


function releaseChecklist2069(){
  return `<section class="card release-checklist"><h2>版本发布流程</h2><p class="muted">本区用于每次上传 GitHub Pages 前后核查，避免“文件已上传但线上仍是旧版”“修一个坏三个”。</p>
  <div class="grid two"><div class="mini-card"><h3>发布前</h3><ol>
    <li>备份当前稳定版压缩包。</li>
    <li>确认本次只修改一个功能域，避免大范围改动。</li>
    <li>检查 <code>index.html</code>、<code>app.js</code>、<code>cache-reset.html</code>、<code>manifest.json</code> 版本号一致。</li>
    <li>本地打开 <code>index.html</code>，确认首页、模块学习、句子分析、查词、搜索能进入。</li>
    <li>运行“系统检查”，异常项先修复再上传。</li>
  </ol></div>
  <div class="mini-card"><h3>上传时</h3><ol>
    <li>解压上传包，不上传 zip 本身。</li>
    <li>打开解压文件夹，全选里面的文件，拖到 GitHub 根目录。</li>
    <li>确认根目录直接能看到 <code>index.html</code>、<code>app.js</code>、<code>.nojekyll</code>。</li>
    <li>Commit changes 后查看 Actions 最新一条。</li>
    <li>不要混传旧版本文件。</li>
  </ol></div>
  <div class="mini-card"><h3>发布后</h3><ol>
    <li>Actions 最新记录变绿。</li>
    <li>GitHub 根目录 <code>index.html</code> 搜当前版本号。</li>
    <li>GitHub 根目录 <code>app.js</code> 搜当前版本号。</li>
    <li>打开 <code>cache-reset.html</code> 清旧缓存。</li>
    <li>进入首页后 Ctrl+U 搜当前版本号。</li>
  </ol></div>
  <div class="mini-card"><h3>回归验收</h3><ol>
    <li>首页、零基础、模块学习、句子分析、佛典阅读、查词、搜索全部可进入。</li>
    <li>任意课程页显示学习目标、本节单词、语法标注、核心概念、例句和练习。</li>
    <li>术语库、句子分析、课程练习、专项强化、错题复习、学习进度均可打开。</li>
    <li>如果新增异常，立即回退到上一稳定包，不继续叠补丁。</li>
  </ol></div></div>
  <div class="notice"><strong>发布原则：</strong>小步修改、逐项验收、可回退；不要重新引入 service worker，不要上传旧版 <code>sw.js</code>。</div></section>`;
}

function safeJSONParse(raw,fallback){try{return JSON.parse(raw)||fallback}catch{return fallback}}
function localGet(key,fallback){return safeJSONParse(localStorage.getItem(key),fallback)}
function progressSnapshot(){
  return {
    schema: PROGRESS_SCHEMA_VERSION,
    app: 'Pāli Learning Lab',
    version: VERSION,
    exported_at: new Date().toISOString(),
    lessonStatus: localGet(LESSON_STATUS_KEY,{}),
    wrong: localGet(WRONG_KEY,{}),
    sentenceStatus: localGet(SENT_STATUS_KEY,{}),
    exerciseSession: localGet(EXERCISE_SESSION_KEY,null),
    lookupHistory: localGet(HISTORY_KEY,[]),
    lastLesson: localGet(LAST_LESSON_KEY,null)
  };
}
function progressSummaryHTML(snap,grammar=[],sentence=[]){
  const lessonVals=Object.values(snap.lessonStatus||{});
  const counts={已掌握:lessonVals.filter(x=>x==='已掌握').length,学习中:lessonVals.filter(x=>x==='学习中').length,需复习:lessonVals.filter(x=>x==='需复习').length};
  const sentVals=Object.values(snap.sentenceStatus||{});
  const sentCounts={已掌握:sentVals.filter(x=>x==='已掌握').length,需复习:sentVals.filter(x=>x==='需复习').length,未练:Math.max(0,(sentence.length||0)-sentVals.length)};
  const wrongCount=Object.keys(snap.wrong||{}).length;
  const ex=snap.exerciseSession;
  const exText=ex?.items?.length?`已保存练习：第 ${(ex.index||0)+1}/${ex.items.length} 题，保存于 ${new Date(ex.saved_at||Date.now()).toLocaleString()}`:'暂无未完成练习';
  const last=snap.lastLesson?.lessonId?`上次课程：${text(snap.lastLesson.lesson_number||snap.lastLesson.lessonId)}. ${text(snap.lastLesson.title||'')}（${text(snap.lastLesson.module||'')}）`:'暂无上次课程记录';
  return `<div class="stats"><div class="stat"><strong>${counts.已掌握}</strong><span>课程已掌握</span></div><div class="stat"><strong>${counts.学习中}</strong><span>课程学习中</span></div><div class="stat"><strong>${counts.需复习}</strong><span>课程需复习</span></div><div class="stat"><strong>${wrongCount}</strong><span>错题</span></div></div><div class="notice"><p>${last}</p><p>${text(exText)}</p><p>句子分析：已掌握 ${sentCounts.已掌握}，需复习 ${sentCounts.需复习}，未练约 ${sentCounts.未练}。</p></div>`;
}
async function renderProgress(){
  const [grammar,sentence]=await Promise.all([loadData('grammarIndex').catch(()=>[]),loadData('sentence').catch(()=>[])]);
  const snap=progressSnapshot();
  const json=JSON.stringify(snap,null,2);
  app.innerHTML=`${navControls()}<section class="card"><h2>学习进度备份</h2><p class="muted">本页只处理本机浏览器中的学习记录。导出文件可保存到电脑；换设备或清缓存前，请先导出。</p>${progressSummaryHTML(snap,grammar,sentence)}<div class="button-row"><button class="primary" data-action="copyProgress">复制备份</button><button data-action="downloadProgress">下载备份</button><button class="success" data-action="importProgress">导入备份</button><button class="danger" data-action="clearProgress">清空进度</button></div>${snap.lastLesson?.lessonId?`<button data-action="restoreLastLesson">继续上次课程</button>`:''}${snap.exerciseSession?.items?.length?`<button data-page="exercise">进入练习中心继续练习</button>`:''}<label>备份 JSON</label><textarea id="progressText" rows="16">${text(json)}</textarea></section><section class="card"><h3>导入说明</h3><ol><li>把备份 JSON 粘贴到文本框。</li><li>点击“导入备份”。</li><li>导入后会恢复课程状态、错题、句子分析状态、练习进度、查词历史和上次课程。</li></ol><p class="muted">不会上传到服务器，所有记录只保存在当前浏览器 localStorage。</p></section>`;
}
function importProgressFromText(){
  const raw=$('#progressText')?.value||'';
  const d=JSON.parse(raw);
  if(!d || typeof d!=='object') throw new Error('备份内容不是 JSON 对象');
  if(d.lessonStatus && typeof d.lessonStatus==='object') localStorage.setItem(LESSON_STATUS_KEY,JSON.stringify(d.lessonStatus));
  if(d.wrong && typeof d.wrong==='object') localStorage.setItem(WRONG_KEY,JSON.stringify(d.wrong));
  if(d.sentenceStatus && typeof d.sentenceStatus==='object') localStorage.setItem(SENT_STATUS_KEY,JSON.stringify(d.sentenceStatus));
  if('exerciseSession' in d){ if(d.exerciseSession) localStorage.setItem(EXERCISE_SESSION_KEY,JSON.stringify(d.exerciseSession)); else localStorage.removeItem(EXERCISE_SESSION_KEY); }
  if(Array.isArray(d.lookupHistory)) localStorage.setItem(HISTORY_KEY,JSON.stringify(d.lookupHistory.slice(0,20)));
  if(d.lastLesson && typeof d.lastLesson==='object') localStorage.setItem(LAST_LESSON_KEY,JSON.stringify(d.lastLesson));
}
function downloadProgressFile(){
  const raw=$('#progressText')?.value || JSON.stringify(progressSnapshot(),null,2);
  const blob=new Blob([raw],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='pali-learning-lab-progress-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function clearAllProgress(){
  [LESSON_STATUS_KEY,WRONG_KEY,SENT_STATUS_KEY,EXERCISE_SESSION_KEY,HISTORY_KEY,LAST_LESSON_KEY].forEach(k=>localStorage.removeItem(k));
}

document.addEventListener('click', async (e)=>{
  const action = e.target.closest('[data-action]')?.dataset.action;
  if(action==='copyDiag2061'){
    const txt = document.getElementById('diagReportText')?.value || diagPlainReport2061(window.__PALI_DIAG_REPORT||{items:[],counts:{ok:0,warn:0,bad:0},sections:[]});
    try{await navigator.clipboard.writeText(txt); alert('检查报告已复制。')}catch{alert('复制失败，请手动复制文本框内容。')}
  }
  if(action==='downloadDiag2061'){
    const txt = document.getElementById('diagReportText')?.value || '';
    const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pali-lab-diagnostics-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  }
});


/* ===== 20.74 练习题质量精修版：句子分析页重接管 ===== */
const SENT_LAST_KEY_2063 = 'pll_sentence_last_v2';
function sentenceLast2063(){try{return JSON.parse(localStorage.getItem(SENT_LAST_KEY_2063))||{}}catch{return {}}}
function saveSentenceLast2063(x){try{localStorage.setItem(SENT_LAST_KEY_2063,JSON.stringify(x||{}))}catch(e){}}
function sentenceAllTags2063(data){
  const tags=[];
  (data||[]).forEach(x=>(x.tags||[]).forEach(t=>{if(t&&!tags.includes(t))tags.push(t)}));
  return tags.sort((a,b)=>String(a).localeCompare(String(b),'zh-Hans-CN'));
}
function sentenceMeta2063(item){
  const st=sentenceStatusMap()[item.id]||'未练';
  const tags=(item.tags||[]).map(t=>`<span class="badge soft">${text(t)}</span>`).join('');
  return `<div class="sentence-meta"><span class="badge">${text(item.practice_priority||'综合训练')}</span><span class="badge ${st==='已掌握'?'ok':st==='需复习'?'warn':''}">${text(st)}</span>${tags}</div>`;
}
async function renderSentencePage(priority=''){
  const data=await loadData('sentence');
  const levels=dedupe(data.map(x=>x.level).filter(Boolean));
  const prios=dedupe(data.map(x=>x.practice_priority||'综合挑战').filter(Boolean));
  const tags=sentenceAllTags2063(data);
  const last=sentenceLast2063();
  const initPriority=priority || last.priority || '全部';
  app.innerHTML=`${navControls()}<section class="card sentence-workbench"><h2>句子分析训练</h2>
  <div class="notice"><strong>训练方法：</strong>先自己判断，再依次查看翻译、词形、结构和完整解析。分析顺序：找限定动词 → 找主语 → 找宾语/补足成分 → 看格位成分 → 处理不变词、分词、从句。</div>
  <div class="grid four"><div class="stat"><strong>${data.length}</strong><span>句子总数</span></div><div class="stat"><strong>${Object.values(sentenceStatusMap()).filter(x=>x==='已掌握').length}</strong><span>已掌握</span></div><div class="stat"><strong>${Object.values(sentenceStatusMap()).filter(x=>x==='需复习').length}</strong><span>需复习</span></div><div class="stat"><strong id="sentenceFilteredCount">0</strong><span>当前筛选</span></div></div>
  <div class="filter-grid sentence-filter-grid"><label>训练层级<select id="sentencePriority"><option value="全部">全部</option>${prios.map(p=>`<option value="${text(p)}" ${p===initPriority?'selected':''}>${text(p)}</option>`).join('')}</select></label>
  <label>难度<select id="sentenceLevel"><option value="全部">全部</option>${levels.map(l=>`<option value="${text(l)}" ${l===(last.level||'')?'selected':''}>${text(l)}</option>`).join('')}</select></label>
  <label>状态<select id="sentenceStatusFilter"><option value="全部">全部</option><option ${last.status==='未练'?'selected':''}>未练</option><option ${last.status==='已掌握'?'selected':''}>已掌握</option><option ${last.status==='需复习'?'selected':''}>需复习</option></select></label>
  <label>标签<select id="sentenceTag"><option value="全部">全部</option>${tags.map(t=>`<option value="${text(t)}" ${t===(last.tag||'')?'selected':''}>${text(t)}</option>`).join('')}</select></label></div>
  <label>关键词搜索<input id="sentenceSearch" value="${text(last.query||'')}" placeholder="搜索原句、翻译、结构、标签"></label>
  <label>选择句子<select id="sentenceSelect"></select></label>
  <div id="sentenceCard"></div></section>`;
  refreshSentenceSelect(last.sentenceId||'', last.step||'intro');
}
function filteredSentences(){
  const data=cache.get(FILE.sentence[0]+'::'+FILE.sentence[1])||[];
  const p=$('#sentencePriority')?.value||'全部', l=$('#sentenceLevel')?.value||'全部', st=$('#sentenceStatusFilter')?.value||'全部', tag=$('#sentenceTag')?.value||'全部', q=String($('#sentenceSearch')?.value||'').trim().toLowerCase();
  const statusMap=sentenceStatusMap();
  return data.filter(x=>{
    const s=statusMap[x.id]||'未练';
    const blob=[x.sentence,x.translation,x.structure,x.tip,x.training_goal,x.analysis_level,...(x.tags||[]),...(x.tokens||[]).flatMap(t=>[t.form,t.grammar,t.role,t.meaning])].join(' ').toLowerCase();
    return (p==='全部'||(x.practice_priority||'综合挑战')===p)
      && (l==='全部'||x.level===l)
      && (st==='全部'||s===st)
      && (tag==='全部'||(x.tags||[]).includes(tag))
      && (!q||blob.includes(q));
  }).sort((a,b)=>(a.priority_rank||99)-(b.priority_rank||99)||(a.recommended_order||999)-(b.recommended_order||999)||String(a.id).localeCompare(String(b.id)));
}
function refreshSentenceSelect(preferId='', step='intro'){
  const sel=$('#sentenceSelect'); if(!sel)return;
  const items=filteredSentences();
  const count=$('#sentenceFilteredCount'); if(count) count.textContent=items.length;
  sel.innerHTML=items.map((x,i)=>`<option value="${text(x.id)}">${i+1}. ${text(x.sentence)}（${sentenceStatusMap()[x.id]||'未练'}）</option>`).join('');
  if(preferId && items.some(x=>String(x.id)===String(preferId))) sel.value=preferId;
  renderSentenceCard(step||'intro');
}
function currentSentence(){const id=$('#sentenceSelect')?.value; return filteredSentences().find(x=>String(x.id)===String(id))||filteredSentences()[0]}
function sentenceTokenRows2063(item){
  const rows=(item.tokens||[]).map(t=>`<tr><td>${text(t.form)}</td><td>${text(normalizeGrammarLine(t.grammar))}</td><td>${text(t.role)}</td><td>${text(t.meaning)}</td></tr>`).join('');
  return rows || '<tr><td colspan="4" class="muted">本句暂缺逐词分析。</td></tr>';
}
function sentenceFullAnalysis2063(item){
  const checks=(item.self_check||[]).map(x=>`<li>${text(x)}</li>`).join('');
  const related=(item.related||[]).map(x=>`<button class="concept-btn" data-search-query="${text(x)}">${text(x)}</button>`).join('');
  return `<div class="notice"><strong>完整解析：</strong>${text(item.analysis_level||item.training_goal||'根据词形、句中功能和整体结构合成句意。')}</div>
  ${checks?`<div class="compact-block"><strong>自查问题：</strong><ol>${checks}</ol></div>`:''}
  ${related?`<p><strong>相关语法点：</strong>${related}</p>`:''}`;
}
function saveCurrentSentencePosition2063(step){
  const item=currentSentence();
  saveSentenceLast2063({
    sentenceId:item?.id||'',
    step:step||'intro',
    priority:$('#sentencePriority')?.value||'全部',
    level:$('#sentenceLevel')?.value||'全部',
    status:$('#sentenceStatusFilter')?.value||'全部',
    tag:$('#sentenceTag')?.value||'全部',
    query:$('#sentenceSearch')?.value||''
  });
}
function renderSentenceCard(step='intro'){
  const item=currentSentence(), box=$('#sentenceCard'); if(!box)return;
  if(!item){box.innerHTML='<p class="muted">当前筛选下没有句子。</p>';return;}
  saveCurrentSentencePosition2063(step);
  const showTranslation=['translation','tokens','structure','full'].includes(step);
  const showTokens=['tokens','full'].includes(step);
  const showStructure=['structure','full'].includes(step);
  const isFull=step==='full';
  let html=`<div class="sentence-card">${sentenceMeta2063(item)}<p class="sentence-main">${text(item.sentence)}</p>
  <div class="button-row sentence-step-row"><button class="${step==='intro'?'primary':''}" data-sentence-step="intro">我先自己分析</button><button class="${step==='translation'?'primary':''}" data-sentence-step="translation">第一步：看翻译</button><button class="${step==='tokens'?'primary':''}" data-sentence-step="tokens">第二步：看词形</button><button class="${step==='structure'?'primary':''}" data-sentence-step="structure">第三步：看结构</button><button class="${step==='full'?'primary':''}" data-sentence-step="full">第四步：看完整解析</button></div>`;
  if(step==='intro') html+=`<div class="notice"><strong>先自己分析：</strong>请先找限定动词，再判断主语、宾语或补足成分；遇到名词同形时，按句中功能判断格位。</div>`;
  if(showTranslation) html+=`<section class="sentence-step-panel"><h3>翻译</h3><p>${text(item.translation)}</p></section>`;
  if(showTokens) html+=`<section class="sentence-step-panel"><h3>词形</h3><div class="table-wrap"><table class="token-table"><tr><th>词形</th><th>语法信息</th><th>句中功能</th><th>意义</th></tr>${sentenceTokenRows2063(item)}</table></div></section>`;
  if(showStructure) html+=`<section class="sentence-step-panel"><h3>结构</h3><p>${text(item.structure||'')}</p><p class="note"><strong>分析提示：</strong>${text(item.tip||'先找限定动词，再判断名词格位与句中功能。')}</p></section>`;
  if(isFull) html+=`<section class="sentence-step-panel"><h3>完整解析</h3>${sentenceFullAnalysis2063(item)}</section>`;
  html+=`<div class="button-row"><button data-sentence-nav="prev">上一句</button><button data-sentence-nav="next">下一句</button></div><div class="button-row"><button class="success" data-sentence-status="已掌握">标记已掌握</button><button class="danger" data-sentence-status="需复习">标记需复习</button><button data-sentence-status="未练">标记未练</button></div></div>`;
  box.innerHTML=html;
}
function moveSentence2063(dir){
  const sel=$('#sentenceSelect'); if(!sel||!sel.options.length)return;
  sel.selectedIndex=(sel.selectedIndex + dir + sel.options.length) % sel.options.length;
  renderSentenceCard('intro');
}
document.addEventListener('click', function(e){
  const nav=e.target.closest('[data-sentence-nav]');
  if(nav){e.preventDefault(); e.stopImmediatePropagation(); moveSentence2063(nav.dataset.sentenceNav==='prev'?-1:1); return;}
}, true);
document.addEventListener('change', function(e){
  if(['sentencePriority','sentenceLevel','sentenceStatusFilter','sentenceTag'].includes(e.target?.id)){refreshSentenceSelect('', 'intro');}
  if(e.target?.id==='sentenceSelect'){renderSentenceCard('intro');}
});
document.addEventListener('input', function(e){
  if(e.target?.id==='sentenceSearch'){
    clearTimeout(window.__sentenceSearchTimer2063);
    window.__sentenceSearchTimer2063=setTimeout(()=>refreshSentenceSelect('', 'intro'),180);
  }
});

/* ===== 20.74 练习题质量精修版：课程练习体验重接管 ===== */
const EXERCISE_SESSION_KEY_2065 = 'pll_exercise_session_v2065';
function exerciseId2065(ex,idx){return String(ex?.id||`${ex?.lesson_id||'lesson'}_${idx}_${ex?.question||''}`).slice(0,180)}
function exerciseAnswers2065(){return Array.isArray(currentExerciseMeta?.answers)?currentExerciseMeta.answers:[]}
function exerciseStats2065(){
  const arr=exerciseAnswers2065();
  return {answered:arr.length, right:arr.filter(x=>x.correct).length, wrong:arr.filter(x=>x.correct===false).length};
}
function savedExerciseSession(){
  try{return JSON.parse(localStorage.getItem(EXERCISE_SESSION_KEY_2065)||localStorage.getItem(EXERCISE_SESSION_KEY)||'null')}catch{return null}
}
function saveExerciseSession(reason='auto'){
  try{
    if(!currentExercises?.length)return;
    const stats=exerciseStats2065();
    const payload={
      version:'20.65',
      items:currentExercises,
      index:Math.max(0,Math.min(exerciseIndex||0,currentExercises.length-1)),
      meta:{...(currentExerciseMeta||{}), stats, save_reason:reason},
      selectedChoice:selectedChoice||'',
      saved_at:new Date().toISOString()
    };
    localStorage.setItem(EXERCISE_SESSION_KEY_2065,JSON.stringify(payload));
    localStorage.setItem(EXERCISE_SESSION_KEY,JSON.stringify(payload));
  }catch(e){console.warn('保存练习进度失败',e)}
}
function clearExerciseSession(){try{localStorage.removeItem(EXERCISE_SESSION_KEY_2065);localStorage.removeItem(EXERCISE_SESSION_KEY)}catch{}}
function formatSavedTime2065(ts){try{return new Date(ts).toLocaleString('zh-CN',{hour12:false})}catch{return ''}}
function exerciseAnswered2065(ex){const id=exerciseId2065(ex,exerciseIndex);return exerciseAnswers2065().find(x=>x.id===id)}
function exerciseAnswerMatches2065(user,answer){
  const u=normalizeAnswer(user), a=normalizeAnswer(answer);
  if(u===a)return true;
  return String(answer||'').split(/\s*[/／;；,，、]\s*/).some(x=>normalizeAnswer(x)===u);
}
function exercisePoint2065(ex){
  const bits=[ex?.layer_title,ex?.category,ex?.lesson_title].filter(Boolean);
  return bits.length?bits.join('｜'):'本课核心知识点';
}
function exerciseFeedbackHTML2065(ex,record){
  const ok=!!record.correct;
  return `<div class="feedback ${ok?'good':'bad'}"><strong>${ok?'回答正确':'回答错误'}</strong>
  <p><strong>你的答案：</strong>${text(record.userAnswer)}</p>
  <p><strong>正确答案：</strong>${text(ex.answer)}</p>
  <p><strong>本题考点：</strong>${text(exercisePoint2065(ex))}</p>
  ${ex.explanation?`<p><strong>解析：</strong>${text(ex.explanation)}</p>`:''}
  ${ex.lesson_title?`<p class="muted">可回看课程：${text(ex.lesson_title)}</p>`:''}</div>`;
}
async function renderExerciseCenter(){
  const [ex,grammar]=await Promise.all([loadData('exercise'),loadData('grammarIndex')]);
  const modules=dedupe(grammar.map(l=>l.module));
  const lessons=sortLessons(grammar);
  const saved=savedExerciseSession();
  const savedStats=saved?.meta?.stats||{};
  app.innerHTML=`${navControls()}<section class="card"><h2>课程练习</h2><p class="muted">按模块或具体课程抽题。练习进度会自动保存，可以暂时退出后继续。</p>
  ${saved?.items?.length?`<div class="notice exercise-resume"><strong>检测到未完成练习</strong><p>进度：第 ${(saved.index||0)+1}/${saved.items.length} 题；已答 ${savedStats.answered||0} 题，正确 ${savedStats.right||0}，错误 ${savedStats.wrong||0}。${saved.saved_at?` 保存时间：${text(formatSavedTime2065(saved.saved_at))}`:''}</p><div class="button-row"><button class="primary" data-action="continueExercise">继续上次练习</button><button data-action="clearExerciseSession">清除上次练习</button></div></div>`:''}
  <label>选择模块</label><select id="exerciseModule"><option value="全部">全部</option>${modules.map(m=>`<option>${text(m)}</option>`).join('')}</select>
  <label>选择课程</label><select id="exerciseLesson"><option value="全部">全部课程</option>${lessons.map(l=>`<option value="${l.id}">${text(l.lesson_number||l.id)}. ${text(l.title)}</option>`).join('')}</select>
  <label>抽题数量</label><select id="exerciseCount"><option>10</option><option>20</option><option>50</option></select>
  <button class="primary" data-action="startExercise">开始练习</button><div id="exerciseArea"></div></section>`;
}
function startExercise(items,meta={}){
  currentExercises=[...(items||[])].filter(Boolean).sort(()=>Math.random()-.5);
  exerciseIndex=0; selectedChoice='';
  currentExerciseMeta={...meta, answers:[], started_at:new Date().toISOString(), stats:{answered:0,right:0,wrong:0}};
  saveExerciseSession('start'); renderExerciseQuestion();
}
function continueExercise(){
  const saved=savedExerciseSession();
  if(!saved?.items?.length){alert('没有可继续的练习。');return;}
  currentExercises=saved.items;
  exerciseIndex=Math.max(0,Math.min(saved.index||0,currentExercises.length-1));
  selectedChoice=saved.selectedChoice||'';
  currentExerciseMeta={...(saved.meta||{}), answers:Array.isArray(saved.meta?.answers)?saved.meta.answers:[]};
  renderExerciseQuestion();
}
function renderExerciseQuestion(){
  const area=$('#exerciseArea'); if(!area)return;
  if(!currentExercises.length){area.innerHTML='<p class="muted">当前没有练习题。</p>';return;}
  const stats=exerciseStats2065();
  if(exerciseIndex>=currentExercises.length){
    const total=currentExercises.length, rate=total?Math.round(stats.right/total*100):0;
    clearExerciseSession();
    area.innerHTML=`<div class="exercise-box"><h3>本轮完成</h3><p>共 ${total} 题；正确 ${stats.right}，错误 ${stats.wrong}，正确率 ${rate}%。</p><div class="button-row"><button class="primary" data-page="wrong">查看错题</button><button data-page="exercise">再练一轮</button></div></div>`;return;
  }
  saveExerciseSession('question');
  const ex=currentExercises[exerciseIndex];
  const record=exerciseAnswered2065(ex);
  const currentAns=record?.userAnswer || selectedChoice || '';
  const options=ex.type==='choice'?(ex.options||[]).map(o=>`<button class="option ${normalizeAnswer(o)===normalizeAnswer(currentAns)?'selected':''}" data-choice="${text(o)}">${text(o)}</button>`).join(''):`<input id="inputAnswer" placeholder="请输入答案" value="${record?text(record.userAnswer):''}">`;
  const nextBtn=record?`<button data-action="nextExercise">下一题</button>`:`<button class="secondary" type="button" disabled>答题后进入下一题</button>`;
  area.innerHTML=`<div class="exercise-box"><p class="muted">题目 ${exerciseIndex+1}/${currentExercises.length}｜已答 ${stats.answered}｜正确 ${stats.right}｜错误 ${stats.wrong}</p><p class="muted">${text(ex.module||'')}｜${text(ex.lesson_title||'')}</p><h3>${text(ex.question)}</h3>${options}<div class="button-row"><button class="primary" data-action="submitExercise">提交答案</button>${nextBtn}<button class="secondary" data-action="exitExercise">暂时退出</button></div><div id="exerciseFeedback">${record?exerciseFeedbackHTML2065(ex,record):''}</div></div>`;
}
function submitExercise(){
  const ex=currentExercises[exerciseIndex]; if(!ex)return;
  const ans=ex.type==='choice'?selectedChoice:($('#inputAnswer')?.value||'');
  if(!String(ans).trim()){alert('请先作答。');return;}
  const good=exerciseAnswerMatches2065(ans,ex.answer);
  const wrong=wrongMap();
  if(good) delete wrong[ex.id]; else wrong[ex.id]={...ex,user_answer:ans,wrong_at:new Date().toISOString()};
  saveWrong(wrong);
  const id=exerciseId2065(ex,exerciseIndex);
  const arr=exerciseAnswers2065().filter(x=>x.id!==id);
  const record={id,userAnswer:ans,correct:good,answered_at:new Date().toISOString(),question:ex.question,answer:ex.answer,lesson_id:ex.lesson_id,lesson_title:ex.lesson_title,module:ex.module};
  arr.push(record);
  currentExerciseMeta={...(currentExerciseMeta||{}),answers:arr,stats:null};
  saveExerciseSession('submit');
  const fb=$('#exerciseFeedback'); if(fb) fb.innerHTML=exerciseFeedbackHTML2065(ex,record);
  renderExerciseQuestion();
}

/* 20.65：拦截下一题，防止未提交答案时误跳。 */
document.addEventListener('click', function(e){
  const btn=e.target.closest('[data-action="nextExercise"]');
  if(!btn)return;
  const ex=currentExercises[exerciseIndex];
  if(ex && !exerciseAnswered2065(ex)){
    e.preventDefault(); e.stopImmediatePropagation(); alert('请先提交答案，再进入下一题。');
  }
}, true);

/* ===== 20.74 练习题质量精修版：统一搜索页面与分类结果 ===== */
function searchBlob2066(obj){
  try{return JSON.stringify(obj||{}).toLowerCase()}catch{return String(obj||'').toLowerCase()}
}
function searchSnippet2066(s, q, max=120){
  s=String(s||'').replace(/\s+/g,' ').trim();
  if(!s) return '';
  const low=s.toLowerCase(); const i=q?low.indexOf(String(q).toLowerCase()):-1;
  if(i<0) return text(s.slice(0,max));
  const start=Math.max(0,i-35), end=Math.min(s.length,i+max-35);
  return text((start?'…':'')+s.slice(start,end)+(end<s.length?'…':''));
}
function normalizeSearchQuery2066(q){return String(q||'').trim().toLowerCase()}
function group2066(title, items, render, hint=''){
  return `<section class="card compact search-group"><div class="search-group-head"><h3>${text(title)} <span class="count-pill">${items.length}</span></h3>${hint?`<span class="muted">${text(hint)}</span>`:''}</div><div class="result-list">${items.length?items.slice(0,20).map(render).join(''):'<p class="muted">没有结果。</p>'}</div>${items.length>20?`<p class="muted">仅显示前 20 条，请缩小关键词继续查找。</p>`:''}</section>`;
}
function lexiconSearchItems2066(q){
  const items=[];
  const lex=typeof PALI_LEXICON==='object'?PALI_LEXICON:{};
  Object.keys(lex).forEach(k=>{
    const v=lex[k]||{};
    const blob=[k,v.meaning,v.root,v.gender,v.pos,v.grammar].join(' ').toLowerCase();
    if(!q||blob.includes(q)) items.push({form:k,...v});
  });
  return items.slice(0,80);
}
function exerciseSearchItems2066(ex,q){
  return (ex||[]).filter(x=>searchBlob2066(x).includes(q)).slice(0,80);
}
async function renderSearch(query=''){
  app.innerHTML=`${navControls()}<section class="card search-page"><h2>全站搜索</h2><p class="muted">可搜索课程、本节单词、术语库、句子分析、句型模板、易混概念、佛典阅读、词形分析和练习题。</p><div class="searchbar"><input id="globalSearchInput" value="${text(query)}" placeholder="输入关键词，如 dhamma、主格、indic.、yo...so、佛典句式"><button class="primary" data-action="runGlobalSearch">搜索</button></div><div class="chip-row search-shortcuts"><button data-search-query="dhamma">dhamma</button><button data-search-query="主格">主格</button><button data-search-query="indic.">indic.</button><button data-search-query="yo...so">yo...so</button><button data-search-query="ger.">ger.</button><button data-search-query="佛典句式">佛典句式</button></div><div id="searchSummary" class="notice hidden"></div><div id="searchResults"></div></section>`;
  const run=()=>drawSearch(($('#globalSearchInput')?.value||'').trim());
  $('#globalSearchInput')?.addEventListener('input',()=>{clearTimeout(window.__globalSearchTimer2066); window.__globalSearchTimer2066=setTimeout(run,180)});
  if(query) await drawSearch(query); else $('#searchResults').innerHTML='<p class="muted">输入关键词后显示分类结果。</p>';
}
async function drawSearch(q){
  q=normalizeSearchQuery2066(q); const box=$('#searchResults'); if(!box) return;
  const summary=$('#searchSummary');
  if(!q){box.innerHTML='<p class="muted">输入关键词后显示分类结果。</p>'; if(summary) summary.classList.add('hidden'); return;}
  box.innerHTML='<div class="loading">正在加载，请稍候……</div>';
  try{
    const [sidx,sent,terms,reading,bg,tokens,patterns,confusions,exercises,academic]=await Promise.all([
      loadData('search').catch(()=>[]),
      loadData('sentence').catch(()=>[]),
      loadData('terminology').catch(()=>[]),
      loadData('buddhistReading').catch(()=>[]),
      loadData('buddhistBackground').catch(()=>({concepts:[]})),
      loadData('token').catch(()=>({})),
      loadData('patterns').catch(()=>[]),
      loadData('confusion').catch(()=>[]),
      loadData('exercise').catch(()=>[]),
      loadData('academic').catch(()=>[])
    ]);
    const course=(sidx||[]).filter(x=>searchBlob2066(x).includes(q));
    const vocab=lexiconSearchItems2066(q);
    const sentence=(sent||[]).filter(x=>searchBlob2066(x).includes(q));
    const term=(terms||[]).filter(x=>searchBlob2066(x).includes(q));
    const buddhist=[...(reading||[]),...((bg&&bg.concepts)||[]),...(academic||[])].filter(x=>searchBlob2066(x).includes(q));
    const tokenKeys=Object.keys(tokens||{}).filter(k=>k.toLowerCase().includes(q)||searchBlob2066(tokens[k]).includes(q));
    const pats=(patterns||[]).filter(x=>searchBlob2066(x).includes(q));
    const conf=(confusions||[]).filter(x=>searchBlob2066(x).includes(q));
    const exercise=exerciseSearchItems2066(exercises,q);
    const total=course.length+vocab.length+sentence.length+term.length+buddhist.length+tokenKeys.length+pats.length+conf.length+exercise.length;
    if(summary){summary.classList.remove('hidden'); summary.innerHTML=`关键词：<strong>${text(q)}</strong>；共找到 <strong>${total}</strong> 条分类结果。`}
    box.innerHTML=
      group2066('课程',course,x=>`<div class="result-card clickable" data-lesson="${x.id}"><h3>【课程】${text(x.lesson_number||x.id)}. ${text(x.title)}</h3><p>${searchSnippet2066(x.summary||x.search_text||'',q)}</p><p class="muted">${text(x.module||'')}｜${text(x.category||'')}</p></div>`)
      + group2066('本节单词 / 基础词表',vocab,x=>`<div class="result-card"><h3>【单词】${text(x.form)}</h3><p>${x.root?`词根：${text(x.root)}｜`:''}${x.gender?`性：${text(x.gender)}｜`:''}${x.grammar?`语法：${text(x.grammar)}｜`:''}基本义：${text(x.meaning||'')}</p></div>`)
      + group2066('句子分析',sentence,x=>`<div class="result-card clickable" data-page="sentence"><h3>【句子】${text(x.sentence)}</h3><p>${text(x.translation||'')}</p><p class="muted">${text(x.level||'')}｜${text(x.practice_priority||'')}</p></div>`)
      + group2066('术语库',term,x=>`<div class="result-card clickable" data-term-query="${text(x.en||x.cn||q)}"><h3>【术语】${text(x.en||x.cn)} ${x.ipa?`<span class="ipa-inline">${text(x.ipa)}</span>`:''}</h3><p><strong>${text(x.cn||'')}</strong>${x.pali?`｜${text(x.pali)}`:''}</p><p>${searchSnippet2066(x.simple_explanation||x.note||'',q)}</p></div>`)
      + group2066('佛典阅读',buddhist,x=>`<div class="result-card clickable" data-page="buddhist"><h3>【佛典】${text(x.title||x.pali||x.cn||x.id||'佛典阅读')}</h3><p>${searchSnippet2066(x.structure||x.basic||x.natural||x.note||x.summary||'',q)}</p></div>`)
      + group2066('词形分析',tokenKeys,x=>`<div class="result-card clickable" data-lookup-word="${text(x)}"><h3>【词形】${text(x)}</h3><p>${text((tokens[x]?.analyses||[])[0]?.meaning||'')}</p></div>`)
      + group2066('句型模板',pats,x=>`<div class="result-card clickable" data-page="patterns"><h3>【句型】${text(x.title)}</h3><p>${text(x.formula||x.function||'')}</p></div>`)
      + group2066('易混概念',conf,x=>`<div class="result-card clickable" data-page="confusion"><h3>【易混】${text(x.title)}</h3><p>${searchSnippet2066(x.core||x.tip||'',q)}</p></div>`)
      + group2066('练习题',exercise,x=>`<div class="result-card clickable" data-lesson="${x.lesson_id||''}"><h3>【练习】${text(x.question)}</h3><p>答案：${text(x.answer||'')} ${x.lesson_title?`｜课程：${text(x.lesson_title)}`:''}</p></div>`);
  }catch(e){console.error(e); box.innerHTML=`<div class="error">搜索加载失败：${text(e.message||e)}</div>`;}
}
/* 20.74：学习进度导入导出 */
document.addEventListener('click', function(e){
  const btn=e.target.closest('[data-action="runGlobalSearch"]');
  if(btn){e.preventDefault(); e.stopImmediatePropagation(); drawSearch(($('#globalSearchInput')?.value||'').trim());}
}, true);


/* ===== 20.74 练习题质量精修版：内容质量诊断重接管 ===== */
const DIAG_ROOT_WHITELIST_2070 = new Set([
  'gam','kar','bhū','as','su','dis','pass','vas','vand','khād','pat','ñā','vac','vad','labh','pac','dā','han','pucch','sikkh','jān','hū','des','ā','i','ñā','rudh','hā','har','sad','ṭhā','bhaj','likh','rakkh','pā','pī','sev','cint','man','sar','gah','gaṇh','āp','āpucch','muc','chid','bandh','sev','vad','brū'
]);
function uniq2070(arr){return Array.from(new Set((arr||[]).filter(x=>x!==undefined&&x!==null&&String(x).trim()!==''))).map(String)}
function stripHTML2070(s){return String(s||'').replace(/<[^>]+>/g,' ')}
function diagAllText2070(fileText){return Object.values(fileText||{}).join('\n')}
function textBlob2070(x){try{return JSON.stringify(x||{})}catch{return String(x||'')}}
function rootList2070(s){const out=[]; const re=/√\s*([A-Za-zāīūṅñṭḍṇḷṃṁ]+)/g; let m; while((m=re.exec(String(s||'')))) out.push(m[1]); return uniq2070(out)}
function multiRootHits2070(s){
  const hits=[]; const txt=String(s||'');
  const patterns=[/√[A-Za-zāīūṅñṭḍṇḷṃṁ]+\s*\/\s*[A-Za-zāīūṅñṭḍṇḷṃṁ]+/g,/√[A-Za-zāīūṅñṭḍṇḷṃṁ]+\s*[、，]\s*√?[A-Za-zāīūṅñṭḍṇḷṃṁ]+/g];
  patterns.forEach(re=>{let m; while((m=re.exec(txt))) hits.push(m[0])});
  return uniq2070(hits);
}
function grammarRiskHits2070(s){
  const txt=String(s||'');
  const risks=[];
  [/\bprs\.ind\.act\b/g,/\baor\.ind\.act\b/g,/\bfut\.ind\.act\b/g,/\bperf\.ind\.act\b/g,/\bind\.act\b/g,/\bind\.mid\b/g,/\bind\.pass\b/g].forEach(re=>{let m; while((m=re.exec(txt))) risks.push(m[0])});
  return uniq2070(risks);
}
function ambiguousCaseHits2070(sentence){
  const res=[];
  (sentence||[]).forEach(s=>{
    (s.tokens||[]).forEach(t=>{
      const g=String(t.grammar||'');
      if(/nom\s*\/\s*acc|acc\s*\/\s*nom|gen\s*\/\s*dat|dat\s*\/\s*gen|loc\s*\/\s*ins|ins\s*\/\s*loc/i.test(g)){
        res.push(`${s.id||s.sentence||'句子'}：${t.form||''} ${g}`);
      }
    });
  });
  return res;
}
function lessonExamples2070(lesson){return Array.isArray(lesson?.examples)?lesson.examples:[]}
function exampleText2070(ex){return [ex.pali,ex.cn,ex.natural_cn,ex.translation,ex.note,ex.grammar_note].map(x=>String(x||'')).join(' ')}
function isGoalNoise2070(s){return /不要求|不需要|只要求|本阶段|避免只背|不要只看中文|不要只背中文|先识别形式，再说明基本意义/.test(String(s||''))}
function classifyLessonType2070(title, category){
  const t=String(title||'')+' '+String(category||'');
  if(/中性名词|中性/.test(t)) return 'neuter';
  if(/阳性名词|阳性/.test(t)) return 'masculine';
  if(/阴性名词|阴性/.test(t)) return 'feminine';
  if(/inf\.|不定式/.test(t)) return 'inf';
  if(/ger\.|连续体|absolutive/.test(t)) return 'ger';
  if(/现在时|vattamānā/.test(t)) return 'presentVerb';
  if(/na：|普通否定/.test(t)) return 'na';
  if(/mā：|禁止否定/.test(t)) return 'maa';
  if(/ca：|并列/.test(t)) return 'ca';
  return '';
}
function irrelevantExampleHits2070(lessons){
  const hits=[];
  (lessons||[]).forEach(l=>{
    const typ=classifyLessonType2070(l.title,l.category);
    if(!typ) return;
    lessonExamples2070(l).forEach(ex=>{
      const txt=exampleText2070(ex);
      let bad=false, why='';
      if(typ==='neuter' && /\bBuddh(o|aṃ|ena|assa)\b|paññā|paññaṃ|paññāya/i.test(txt)){bad=true; why='中性名词课混入阳性/阴性核心例子';}
      if(typ==='masculine' && /phalaṃ|phalāni|paññā|paññaṃ|paññāya/i.test(txt)){bad=true; why='阳性名词课混入中性/阴性核心例子';}
      if(typ==='feminine' && /\bBuddh(o|aṃ|ena|assa)\b|phalaṃ|phalāni/i.test(txt)){bad=true; why='阴性名词课混入阳性/中性核心例子';}
      if(typ==='inf' && /gantvā|sutvā|katvā/i.test(txt)){bad=true; why='不定式课混入 ger. 核心例子';}
      if(typ==='ger' && /gantuṃ|sotuṃ|kātuṃ/i.test(txt)){bad=true; why='连续体课混入 inf. 核心例子';}
      if(bad) hits.push(`${l.lesson_number||l.id}. ${l.title}：${why}｜${String(ex.pali||'').slice(0,80)}`);
    });
  });
  return hits;
}
function exerciseRelevanceHits2070(exercises, grammarById){
  const hits=[];
  (exercises||[]).forEach(x=>{
    const lesson=grammarById.get(String(x.lesson_id||'')); if(!lesson) return;
    const typ=classifyLessonType2070(lesson.title, lesson.category);
    if(!typ) return;
    const txt=textBlob2070(x);
    let bad=false, why='';
    if(typ==='neuter' && /\bBuddh(o|aṃ|ena|assa)\b|paññā|paññaṃ|paññāya/i.test(txt)){bad=true; why='中性名词课练习疑似混入阳性/阴性核心题';}
    if(typ==='masculine' && /phalaṃ|phalāni|paññā|paññaṃ|paññāya/i.test(txt)){bad=true; why='阳性名词课练习疑似混入中性/阴性核心题';}
    if(typ==='feminine' && /\bBuddh(o|aṃ|ena|assa)\b|phalaṃ|phalāni/i.test(txt)){bad=true; why='阴性名词课练习疑似混入阳性/中性核心题';}
    if(typ==='inf' && /gantvā|sutvā|katvā/i.test(txt)){bad=true; why='inf. 课练习疑似混入 ger. 题';}
    if(typ==='ger' && /gantuṃ|sotuṃ|kātuṃ/i.test(txt)){bad=true; why='ger. 课练习疑似混入 inf. 题';}
    if(bad) hits.push(`${lesson.lesson_number||lesson.id}. ${lesson.title}｜${why}｜${String(x.question||x.id||'').slice(0,80)}`);
  });
  return hits;
}
function missingLessonQuality2070(lessons){
  const missing={goals:[], examples:[], vocabRisk:[], grammarNotes:[], mistakes:[], grammarExplain:[]};
  (lessons||[]).forEach(l=>{
    const label=`${l.lesson_number||l.id}. ${l.title}`;
    const goals=[...(l.learning_goals||[]),...(l.minimal_mastery||[])].filter(Boolean);
    if(!goals.length) missing.goals.push(label);
    if(goals.filter(x=>!isGoalNoise2070(x)).length===0 && goals.length) missing.goals.push(`${label}（目标多为空泛/无效表述）`);
    if(lessonExamples2070(l).length===0) missing.examples.push(label);
    lessonExamples2070(l).forEach(ex=>{
      if(!(ex.cn||ex.natural_cn||ex.translation)) missing.grammarNotes.push(`${label}：例句缺翻译 ${String(ex.pali||'').slice(0,60)}`);
      if(!(ex.grammar_note||ex.note)) missing.grammarNotes.push(`${label}：例句缺语法解析 ${String(ex.pali||'').slice(0,60)}`);
    });
    const mistakes=(l.common_mistakes||[]).filter(x=>!isGoalNoise2070(x));
    if((l.common_mistakes||[]).length && !mistakes.length) missing.mistakes.push(`${label}（常见误判过泛）`);
    const explanation=(Array.isArray(l.explanation)?l.explanation.join(' '):String(l.explanation||''));
    if(!explanation || explanation.length<40) missing.grammarExplain.push(label);
  });
  return missing;
}
function lexiconQuality2070(){
  const lex=typeof PALI_LEXICON==='object'?PALI_LEXICON:{};
  const badSingle=[], badShort=[], multiRoot=[], missingRoot=[];
  const allowShort=new Set(['ca','na','mā','vā','va','kho','iti','eva','api','atha','pana']);
  Object.keys(lex||{}).forEach(k=>{
    const key=String(k||'').trim(); if(!key) return;
    if(key.length===1) badSingle.push(key);
    if(key.length<=3 && !allowShort.has(key.toLowerCase()) && !/[āīūṅñṭḍṇḷṃ]/.test(key)) badShort.push(key);
    const r=String(lex[k]?.root||'');
    if(/\/|、|，| or | 或 /.test(r)) multiRoot.push(`${key}:${r}`);
    if((lex[k]?.pos==='v'||r) && lex[k]?.pos==='v' && !r) missingRoot.push(key);
  });
  return {badSingle:uniq2070(badSingle), badShort:uniq2070(badShort), multiRoot:uniq2070(multiRoot), missingRoot:uniq2070(missingRoot)};
}
function diagStatus2070(ok,warn=false){return ok?'通过':(warn?'需核查':'异常')}
function diagLevel2070(ok,warn=false){return ok?'ok':(warn?'warn':'bad')}
function diagItem2070(section,name,ok,detail,fix='',warn=false){return {section,name,status:diagStatus2070(ok,warn),level:diagLevel2070(ok,warn),detail:String(detail||''),fix:String(fix||'')}}
function diagBadge2070(level){return level==='ok'?'<span class="diag-badge ok">通过</span>':level==='warn'?'<span class="diag-badge warn">需核查</span>':'<span class="diag-badge bad">异常</span>'}
function diagTable2070(title,items){return `<section class="card"><h2>${text(title)}</h2><div class="table-wrap"><table class="diag-table diag-table-wide"><thead><tr><th>检查项</th><th>状态</th><th>详情</th><th>处理建议</th></tr></thead><tbody>${items.map(it=>`<tr class="diag-row diag-${it.level}"><td>${text(it.name)}</td><td>${diagBadge2070(it.level)}</td><td>${text(it.detail)}</td><td>${text(it.fix||'—')}</td></tr>`).join('')}</tbody></table></div></section>`}
function plainReport2070(report){
  const lines=[`Pāli Learning Lab ${VERSION} 内容质量检查报告`,`生成时间：${new Date().toLocaleString()}`,'',`总检查项：${report.items.length}`,`通过：${report.counts.ok}`,`需核查：${report.counts.warn}`,`异常：${report.counts.bad}`,''];
  report.sections.forEach(sec=>{lines.push(`【${sec}】`);report.items.filter(x=>x.section===sec).forEach(x=>lines.push(`- ${x.status}｜${x.name}：${x.detail}${x.fix?`；建议：${x.fix}`:''}`));lines.push('')});
  return lines.join('\n');
}
async function renderDiagnostics(){
  setLoading();
  const sections=['数据规模','文件加载','路由与 ID','内容质量','练习与例句相关性','语法标注与词根','本节单词质量','发布验收'];
  const items=[]; const add=(s,n,ok,d,f='',warn=false)=>items.push(diagItem2070(s,n,ok,d,f,warn));
  const chunkFiles=Array.from({length:11},(_,i)=>`lesson-chunk-${String(i+1).padStart(2,'0')}.json`);
  const moduleFiles=Array.from({length:8},(_,i)=>`module-${String(i+1).padStart(2,'0')}-module.json`);
  const coreFiles=['index.html','app.js','style.css','cache-reset.html','grammar-index.json','grammar-lesson-manifest.json','grammar-module-directory.json','exercise-index.json','search-index.json','learning-routes-data.js','sentence-analysis-data.js','sentence-patterns-data.js','confusion-pairs-data.js','terminology-glossary-data.js','dictionary-sites-data.js','token-analysis-data.js','buddhist-reading-data.js','buddhist-background-data.js','academic-training-data.js','module-guides-data.js','linguistics-tips-data.js',...chunkFiles,...moduleFiles];
  const fileText={}; let fileOk=0;
  for(const f of coreFiles){try{fileText[f]=await fetchText2060(f);fileOk++;add('文件加载',f,true,'已加载','')}catch(e){add('文件加载',f,false,text(e.message||e),'确认文件已上传到 GitHub 根目录，且文件名大小写完全一致。')}}
  let grammar=[],exercise=[],routes=[],sentence=[],terms=[],tokens={},manifest={},moduleDir=[]; let chunks=[],modules=[];
  try{grammar=await loadData('grammarIndex')}catch(e){}
  try{exercise=await loadData('exercise')}catch(e){}
  try{routes=await loadData('routes')}catch(e){}
  try{sentence=await loadData('sentence')}catch(e){}
  try{terms=await loadData('terminology')}catch(e){}
  try{tokens=await loadData('token')}catch(e){}
  try{manifest=await loadData('manifest')}catch(e){}
  try{moduleDir=await loadData('moduleDirectory')}catch(e){}
  for(const f of chunkFiles){try{chunks.push({file:f,data:await fetchJson(f)})}catch(e){chunks.push({file:f,data:null,error:e})}}
  for(const f of moduleFiles){try{modules.push({file:f,data:await fetchJson(f)})}catch(e){modules.push({file:f,data:null,error:e})}}
  const detailLessons=chunks.flatMap(c=>Array.isArray(c.data)?c.data:[]);
  const grammarIds=new Set(grammar.map(x=>String(x.id))); const detailIds=new Set(detailLessons.map(x=>String(x.id))); const manifestIds=new Set(Object.keys(manifest||{}).map(String));
  const grammarById=new Map(grammar.map(x=>[String(x.id),x]));
  const routeIds=[];(routes||[]).forEach(r=>(r.steps||[]).forEach(s=>(s.lesson_ids||[]).forEach(id=>routeIds.push(String(id)))));
  const exerciseIds=uniq2070(exercise.map(x=>String(x.lesson_id||''))).filter(Boolean);
  const moduleLessonIds=uniq2070(modules.flatMap(m=>Array.isArray(m.data)?m.data.map(x=>String(x.id)):[]));
  add('数据规模','语法点数量',grammar.length===109,`当前：${grammar.length}；预期：109`,'检查 grammar-index.json 是否完整。');
  add('数据规模','课程详情数量',detailLessons.length>=109,`当前：${detailLessons.length}；预期：≥109`,'检查 11 个 lesson-chunk 文件。', detailLessons.length!==109);
  add('数据规模','lesson chunk 数量',chunks.filter(c=>Array.isArray(c.data)).length===11,`当前：${chunks.filter(c=>Array.isArray(c.data)).length}/11`,'补齐缺失 lesson-chunk-xx.json。');
  add('数据规模','module 文件数量',modules.filter(m=>Array.isArray(m.data)).length===8,`当前：${modules.filter(m=>Array.isArray(m.data)).length}/8`,'补齐 module-01 至 module-08。');
  add('数据规模','练习题数量',exercise.length>=1000,`当前：${exercise.length}；预期：约1004`,'检查 exercise-index.json。',exercise.length>=900&&exercise.length<1000);
  add('数据规模','术语库数量',terms.length>=160,`当前：${terms.length}；预期：约160+`,'检查 terminology-glossary-data.js。',terms.length>=120&&terms.length<160);
  add('数据规模','句子分析数量',sentence.length>=90,`当前：${sentence.length}；预期：约92`,'检查 sentence-analysis-data.js。',sentence.length>=80&&sentence.length<90);
  add('数据规模','词形分析数量',Object.keys(tokens||{}).length>=200,`当前：${Object.keys(tokens||{}).length}；预期：约200+`,'检查 token-analysis-data.js。',Object.keys(tokens||{}).length>=150&&Object.keys(tokens||{}).length<200);
  const missingDetail=[...grammarIds].filter(id=>!detailIds.has(id));
  const manifestMissing=[...grammarIds].filter(id=>!manifestIds.has(id));
  const routeMissing=uniq2070(routeIds).filter(id=>!grammarIds.has(id));
  const exerciseMissing=exerciseIds.filter(id=>!grammarIds.has(id));
  const moduleMissing=moduleLessonIds.filter(id=>!grammarIds.has(id));
  add('路由与 ID','课程索引与详情对应',missingDetail.length===0,missingDetail.length?`缺少详情：${missingDetail.slice(0,30).join(', ')}`:'全部课程在 chunk 中找到','修对应 lesson-chunk。');
  add('路由与 ID','课程 manifest 对应',manifestMissing.length===0,manifestMissing.length?`manifest 缺少：${manifestMissing.slice(0,30).join(', ')}`:'全部课程有 manifest 记录','修 grammar-lesson-manifest.json。');
  add('路由与 ID','学习路线 lesson_id',routeMissing.length===0,routeMissing.length?`找不到：${routeMissing.join(', ')}`:'全部路线课程可找到','修 learning-routes-data.js。');
  add('路由与 ID','练习题 lesson_id',exerciseMissing.length===0,exerciseMissing.length?`找不到课程：${exerciseMissing.slice(0,30).join(', ')}`:'练习题 lesson_id 均可对应课程','修 exercise-index.json。',exerciseMissing.length>0);
  add('路由与 ID','模块课程 id',moduleMissing.length===0,moduleMissing.length?`模块中找不到课程：${moduleMissing.slice(0,30).join(', ')}`:'模块课程均可对应 grammar-index','修 module-xx-module.json。');
  const missing=missingLessonQuality2070(detailLessons);
  add('内容质量','课程学习目标',missing.goals.length===0,missing.goals.length?`缺失或空泛：${missing.goals.slice(0,30).join('；')}${missing.goals.length>30?'……':''}`:'课程均有较具体学习目标','学习目标最多 3 点，删除“不要求/不需要/只要求”等无效表述。',missing.goals.length>0);
  add('内容质量','课程例句',missing.examples.length===0,missing.examples.length?`缺例句：${missing.examples.slice(0,30).join('；')}${missing.examples.length>30?'……':''}`:'课程均有例句','为缺失课程补充与本课高度相关的例句。',missing.examples.length>0);
  add('内容质量','例句翻译与语法解析',missing.grammarNotes.length===0,missing.grammarNotes.length?`问题：${missing.grammarNotes.slice(0,30).join('；')}${missing.grammarNotes.length>30?'……':''}`:'例句均有翻译与解析字段','统一为：例句｜翻译｜语法解析。',missing.grammarNotes.length>0);
  add('内容质量','常见误判针对性',missing.mistakes.length===0,missing.mistakes.length?`疑似空泛：${missing.mistakes.slice(0,30).join('；')}${missing.mistakes.length>30?'……':''}`:'未发现明显空泛误判字段','常见误判最多 3 点，必须针对本课。',missing.mistakes.length>0);
  add('内容质量','语法说明长度',missing.grammarExplain.length===0,missing.grammarExplain.length?`说明过短/缺失：${missing.grammarExplain.slice(0,30).join('；')}${missing.grammarExplain.length>30?'……':''}`:'未发现明显缺失语法说明','每课语法说明建议 3—5 点，避免空话。',missing.grammarExplain.length>0);
  const irrelevant=irrelevantExampleHits2070(detailLessons); const exRel=exerciseRelevanceHits2070(exercise,grammarById);
  add('练习与例句相关性','错类例句初筛',irrelevant.length===0,irrelevant.length?`疑似错类：${irrelevant.slice(0,30).join('；')}${irrelevant.length>30?'……':''}`:'未发现重点规则下的明显错类例句','逐课人工核查例句是否围绕本课核心内容。',irrelevant.length>0);
  add('练习与例句相关性','练习题相关性初筛',exRel.length===0,exRel.length?`疑似不匹配：${exRel.slice(0,30).join('；')}${exRel.length>30?'……':''}`:'未发现重点规则下的明显不匹配练习','课程练习优先 lesson_id 精确匹配；补充题需关键词过滤。',exRel.length>0);
  const allText=diagAllText2070(fileText); const oldInd=grammarRiskHits2070(allText); const ambiguous=ambiguousCaseHits2070(sentence); const roots=rootList2070(allText); const rootsNotWhite=roots.filter(r=>!DIAG_ROOT_WHITELIST_2070.has(r)); const multiRoot=multiRootHits2070(allText); const rootNeed=(allText.match(/词根需查词典复核|需查词典复核|词根需复核/g)||[]).length;
  add('语法标注与词根','ind. / indic. 混用',oldInd.length===0,oldInd.length?`旧写法：${oldInd.join(', ')}`:'未发现 prs.ind.act / ind.act 等旧写法','陈述语气用 indic.；ind. 只表示不变词。');
  add('语法标注与词根','句子分析并列格位',ambiguous.length===0,ambiguous.length?`高风险：${ambiguous.slice(0,30).join('；')}${ambiguous.length>30?'……':''}`:'句子分析 tokens 未发现 nom/acc、gen/dat 等并列格位','按句中功能落实为确定格位；无法判断才保留并列。',ambiguous.length>0);
  add('语法标注与词根','多词根写法',multiRoot.length===0,multiRoot.length?`发现：${multiRoot.slice(0,30).join('；')}${multiRoot.length>30?'……':''}`:'未发现明显多词根写法','每个动词只给一个词典确认词根。');
  add('语法标注与词根','词根复核占位',rootNeed===0,rootNeed?`发现 ${rootNeed} 处“词根需复核”类占位`:'未发现词根复核占位','如果无法确认词根，应先查词典再进入正式版。',rootNeed>0);
  add('语法标注与词根','词根白名单外项目',rootsNotWhite.length===0,rootsNotWhite.length?`需人工核查：${rootsNotWhite.slice(0,40).join(', ')}${rootsNotWhite.length>40?'……':''}`:`检测到 ${roots.length} 个词根，均在白名单内`,'白名单外不一定错，但必须按词典核查。',rootsNotWhite.length>0);
  const lexQ=lexiconQuality2070();
  add('本节单词质量','单字母词',lexQ.badSingle.length===0,lexQ.badSingle.length?`发现：${lexQ.badSingle.join(', ')}`:'基础词表未发现单字母词','本节单词不收单字母。');
  add('本节单词质量','短词从严',lexQ.badShort.length===0,lexQ.badShort.length?`需核查短词：${lexQ.badShort.slice(0,40).join(', ')}`:'短词未发现明显风险','两三个字母仅保留 ca、na、mā、vā/va、kho、iti、eva、api 等确认词。',lexQ.badShort.length>0);
  add('本节单词质量','基础词表多词根',lexQ.multiRoot.length===0,lexQ.multiRoot.length?`发现：${lexQ.multiRoot.join('；')}`:'基础词表未发现多词根','词表每个动词只保留一个可靠词根。');
  add('本节单词质量','动词缺词根',lexQ.missingRoot.length===0,lexQ.missingRoot.length?`缺词根：${lexQ.missingRoot.slice(0,40).join(', ')}`:'基础词表动词均有词根','动词词根必须查词典确认后再显示。',lexQ.missingRoot.length>0);
  const ipaPrompt=(allText.match(/点击查看\s*IPA|悬停查看\s*IPA|查看 IPA/g)||[]).length; const noDetail=(allText.match(/暂无详细解释/g)||[]).length; const related=(allText.match(/相关佛典阅读句式|相关佛典背景|相关学术训练|相关易混概念|相关句型模板|相关术语/g)||[]).length; const routeNF=(allText.match(/语法点\s*\d+\s*未找到/g)||[]).length;
  add('发布验收','IPA 提示废话',ipaPrompt===0,ipaPrompt?`发现 ${ipaPrompt} 处提示文案`:'未发现 IPA 提示废话','术语库直接显示音标，不显示提示。');
  add('发布验收','无效术语弹窗文案',noDetail===0,noDetail?`发现 ${noDetail} 处“暂无详细解释”`:'未发现无效术语弹窗文案','核心概念点击进入术语库搜索。');
  add('发布验收','课程页冗余相关区块',related===0,related?`发现 ${related} 处相关区块文案`:'未发现课程页冗余相关区块文案','相关内容作为独立页面保留，不塞入课程底部。');
  add('发布验收','路线未找到残留',routeNF===0,routeNF?`发现 ${routeNF} 处“语法点未找到”残留`:'未发现路线未找到残留','若页面实际出现，修 learning-routes-data.js。',routeNF>0);
  const counts={ok:items.filter(x=>x.level==='ok').length,warn:items.filter(x=>x.level==='warn').length,bad:items.filter(x=>x.level==='bad').length}; const report={version:VERSION,generatedAt:new Date().toISOString(),counts,sections,items}; window.__PALI_DIAG_REPORT=report; const plain=plainReport2070(report);
  const priority=`<section class="card"><h2>内容质量优先处理顺序</h2><ol><li>先修异常项：文件缺失、课程无法对应、练习题 lesson_id 错误。</li><li>再修教学准确性：并列格位、ind./indic.、多词根、词根白名单外项目。</li><li>再修课程质量：缺例句、缺解析、目标空泛、常见误判空泛。</li><li>最后修体验问题：IPA 提示废话、冗余相关区块、路线残留文案。</li></ol></section>`;
  const summary=`<section class="card"><h1>系统检查 / 内容质量诊断</h1><p class="muted">20.74 增强版：除数据完整性和发布流程外，新增课程目标、例句、练习相关性、词根、缩略语、本节单词质量等检查。它只读取数据，不修改内容。</p><div class="stats"><div class="stat"><strong>${counts.ok}</strong><span>通过</span></div><div class="stat"><strong>${counts.warn}</strong><span>需核查</span></div><div class="stat"><strong>${counts.bad}</strong><span>异常</span></div><div class="stat"><strong>${fileOk}</strong><span>文件已加载</span></div></div><div class="button-row"><button data-action="copyDiag2061">复制检查报告</button><button data-action="downloadDiag2061">下载检查报告</button></div><textarea id="diagReportText" class="diag-report-text" readonly>${text(plain)}</textarea></section>`;
  app.innerHTML=`${navControls()}${summary}${diagTable2070('一、数据规模核查',items.filter(x=>x.section==='数据规模'))}${diagTable2070('二、文件加载核查',items.filter(x=>x.section==='文件加载'))}${diagTable2070('三、路由与 ID 对应核查',items.filter(x=>x.section==='路由与 ID'))}${diagTable2070('四、内容质量核查',items.filter(x=>x.section==='内容质量'))}${diagTable2070('五、练习与例句相关性核查',items.filter(x=>x.section==='练习与例句相关性'))}${diagTable2070('六、语法标注与词根核查',items.filter(x=>x.section==='语法标注与词根'))}${diagTable2070('七、本节单词质量核查',items.filter(x=>x.section==='本节单词质量'))}${diagTable2070('八、发布验收核查',items.filter(x=>x.section==='发布验收'))}${priority}${releaseChecklist2069()}`;
}


/* 20.74 练习题质量精修版：用受控词表生成“本节单词”，避免误抓、错还原、重复收录。 */
const PALI_CORE_EXTRA_2073 = {
  // 常见名词
  dāna:{pos:'noun',gender:'n.',meaning:'布施；给予'}, sīla:{pos:'noun',gender:'n.',meaning:'戒；德行'},
  nibbāna:{pos:'noun',gender:'n.',meaning:'涅槃'}, magga:{pos:'noun',gender:'m.',meaning:'道；道路'},
  ariyasāvaka:{pos:'noun',gender:'m.',meaning:'圣弟子'}, dāraka:{pos:'noun',gender:'m.',meaning:'男孩；童子'},
  vaṇṇa:{pos:'noun',gender:'m.',meaning:'颜色；形貌；种姓'}, ratti:{pos:'noun',gender:'f.',meaning:'夜；夜晚'},
  // 代词与形容词
  ahaṃ:{pos:'pron',grammar:'pron.1sg.nom',meaning:'我'}, mayaṃ:{pos:'pron',grammar:'pron.1pl.nom',meaning:'我们'},
  tvaṃ:{pos:'pron',grammar:'pron.2sg.nom',meaning:'你'}, tumhe:{pos:'pron',grammar:'pron.2pl.nom',meaning:'你们'},
  ta:{pos:'pron',grammar:'pron.',meaning:'他；那'}, añña:{pos:'adj',grammar:'adj.',meaning:'其他的；另一个'},
  mahā:{pos:'adj',grammar:'adj.',meaning:'大的；伟大的'}, sabba:{pos:'adj',grammar:'adj.',meaning:'一切的；所有的'},
  // 常见不变词
  iti:{pos:'other',grammar:'ind.',meaning:'如此；引语标记'}, ti:{pos:'other',grammar:'ind.',meaning:'引语标记'},
  yadā:{pos:'other',grammar:'ind.',meaning:'当……时'}, tadā:{pos:'other',grammar:'ind.',meaning:'那时'},
  yattha:{pos:'other',grammar:'ind.',meaning:'在何处；凡在……处'}, tattha:{pos:'other',grammar:'ind.',meaning:'在那里'},
  yathā:{pos:'other',grammar:'ind.',meaning:'如；怎样'}, tathā:{pos:'other',grammar:'ind.',meaning:'那样；如是'}
};
function coreLex2073(form){
  const f=normalizePaliToken(form||'').normalize('NFC');
  if(!f) return null;
  return PALI_LEXICON[f] || PALI_CORE_EXTRA_2073[f] || PALI_LEXICON[f.toLowerCase()] || PALI_CORE_EXTRA_2073[f.toLowerCase()] || null;
}
const VERB_3SG_MAP_2073 = {
  ...VERB_3SG_MAP,
  āgacchanto:'āgacchati', āgacchantī:'āgacchati', āgato:'āgacchati', āgata:'āgacchati',
  nisīdati:'nisīdati', nisinno:'nisīdati', nisinna:'nisīdati',
  rakkhati:'rakkhati', rakkhanto:'rakkhati',
  khādati:'khādati', khādāmi:'khādati',
  ñatvā:'jānāti', jānāti:'jānāti', jānanti:'jānāti',
  virajjati:'virajjati', nassati:'nassati', āmantesi:'āmanteti', āmanteti:'āmanteti',
  pacati:'pacati', pāceti:'pāceti', pācayati:'pāceti',
  gaṇhāti:'gaṇhāti', gaṇhāpeti:'gaṇhāpeti',
  jānāpeti:'jānāpeti'
};
const PALI_VERB_CORE_2073 = {
  gacchati:{root:'√gam',meaning:'去；行走'}, āgacchati:{root:'√gam',meaning:'来；到来'},
  deseti:{root:'√dis',meaning:'说示；开示；教导'}, suṇāti:{root:'√su',meaning:'听；听闻'},
  hoti:{root:'√bhū',meaning:'是；成为；存在'}, bhavati:{root:'√bhū',meaning:'成为；存在；发生'},
  karoti:{root:'√kar',meaning:'做；作'}, vasati:{root:'√vas',meaning:'住；居住'},
  viharati:{root:'√har',meaning:'住；停留；安住'}, passati:{root:'√pass',meaning:'看见；观察'},
  labhati:{root:'√labh',meaning:'得到；获得'}, icchati:{root:'√is',meaning:'想要；希望'},
  vandati:{root:'√vand',meaning:'礼敬；敬礼'}, pasīdati:{root:'√sad',meaning:'欢喜；生信；澄净'},
  patati:{root:'√pat',meaning:'落下；掉落'}, pavisati:{root:'√vis',meaning:'进入'},
  dadāti:{root:'√dā',meaning:'给；给予'}, vadati:{root:'√vad',meaning:'说'},
  āha:{root:'√ah',meaning:'说；说道'}, avoca:{root:'√vac',meaning:'说了'},
  nisīdati:{root:'√sad',meaning:'坐；坐下'}, rakkhati:{root:'√rakkh',meaning:'保护；守护'},
  khādati:{root:'√khād',meaning:'吃；咀嚼'}, jānāti:{root:'√ñā',meaning:'知道；认识'},
  virajjati:{root:'√raj',meaning:'离染；厌离'}, nassati:{root:'√nas',meaning:'消失；灭失'},
  āmanteti:{root:'√mant',meaning:'召唤；告知；招呼'}, pacati:{root:'√pac',meaning:'煮；烹调'},
  pāceti:{root:'√pac',meaning:'使煮；使烹调'}, gaṇhāti:{root:'√grah',meaning:'拿；取；把握'},
  gaṇhāpeti:{root:'√grah',meaning:'使拿；使取'}, jānāpeti:{root:'√ñā',meaning:'告知；使知道'}
};
function canonicalVerb2073(tok){
  tok=normalizePaliToken(tok);
  if(!tok || tok.toLowerCase()==='ti') return '';
  const v=VERB_3SG_MAP_2073[tok] || (PALI_VERB_CORE_2073[tok] ? tok : '');
  return PALI_VERB_CORE_2073[v] ? v : '';
}
function nounLemmaCandidates2073(tok){
  tok=normalizePaliToken(tok).normalize('NFC');
  const out=[tok, tok.toLowerCase()];
  const add=x=>{ if(x && !out.includes(x)) out.push(x); };
  // 常见名词变格还原；只有命中受控词表时才采用
  if(tok.endsWith('ssa')) add(tok.slice(0,-3));
  if(tok.endsWith('ena')) add(tok.slice(0,-3)+'a');
  if(tok.endsWith('asmiṃ')) add(tok.slice(0,-5)+'a');
  if(tok.endsWith('amhi')) add(tok.slice(0,-4)+'a');
  if(tok.endsWith('esu')) add(tok.slice(0,-3)+'a');
  if(tok.endsWith('ānaṃ')) add(tok.slice(0,-4)+'a');
  if(tok.endsWith('ehi')||tok.endsWith('ebhi')) add(tok.slice(0,-3)+'a');
  if(tok.endsWith('āya')) add(tok.slice(0,-3)+'ā');
  if(tok.endsWith('āyaṃ')) add(tok.slice(0,-4)+'ā');
  if(tok.endsWith('āhi')||tok.endsWith('ābhi')) add(tok.slice(0,-3)+'ā');
  if(tok.endsWith('āni')) add(tok.slice(0,-3)+'a');
  if(tok.endsWith('iyo')) add(tok.slice(0,-3)+'i');
  if(tok.endsWith('ina')) add(tok.slice(0,-3)+'i');
  if(tok.endsWith('unā')) add(tok.slice(0,-3)+'u');
  if(tok.endsWith('ūnaṃ')) add(tok.slice(0,-4)+'u');
  if(tok.endsWith('o')) add(tok.slice(0,-1)+'a');
  if(tok.endsWith('e')) add(tok.slice(0,-1)+'a');
  if(tok.endsWith('aṃ')) add(tok.slice(0,-2)+'a');
  if(tok.endsWith('ṃ')) add(tok.slice(0,-1));
  return out;
}
function canonicalNoun2073(tok){
  for(const c of nounLemmaCandidates2073(tok)){
    const lex=coreLex2073(c);
    if(lex && lex.pos==='noun') return normalizePaliToken(c);
  }
  return '';
}
function classifyToken(tok){
  tok=normalizePaliToken(tok);
  if(!tok || tok.length<2) return null;
  const low=tok.toLowerCase().replace(/\.$/,'');
  if(tok.length===1 || low==='ti' || GRAMMAR_WORD_BLACKLIST.has(low)) return null;
  if(tok.length<=3 && !['ca','na','mā','vā','va','kho','iti','eva','api','ce','hi','so','te','me'].includes(low)) return null;
  if(/^[A-Z]{2,}$/.test(tok)) return null;

  const v=canonicalVerb2073(tok);
  if(v){
    const lex=PALI_VERB_CORE_2073[v];
    return {form:v,type:'verb',grammar:lex.root,meaning:lex.meaning};
  }

  const n=canonicalNoun2073(tok);
  if(n){
    const lex=coreLex2073(n);
    return {form:n,type:'noun',grammar:lex.gender||'',meaning:lex.meaning||''};
  }

  const lex=coreLex2073(tok) || coreLex2073(low);
  if(lex && lex.pos==='pron') return {form:canonicalLexeme(tok),type:'pronoun',grammar:lex.grammar||'pron.',meaning:lex.meaning||''};
  if(lex && lex.pos==='adj') return {form:canonicalLexeme(tok),type:'adjective',grammar:lex.grammar||'adj.',meaning:lex.meaning||''};
  if(lex && lex.pos==='other') return {form:canonicalLexeme(tok),type:'other',grammar:lex.grammar||'ind.',meaning:lex.meaning||''};

  return null;
}
async function vocabHTML(lesson,exercises=[]){
  const parts=[];
  (lesson.examples||[]).forEach(e=>parts.push(e.pali,e.note,e.grammar_note));
  (lesson.table||[]).flat().forEach(x=>parts.push(x));
  (exercises||[]).slice(0,25).forEach(e=>parts.push(e.question,e.answer,...(e.options||[]),e.explanation));
  const tokens=dedupe(parts.flatMap(tokenizePali));
  const map=new Map();
  tokens.map(classifyToken).filter(Boolean).forEach(v=>{
    const k=v.type+'::'+lexemeKey(v.form);
    if(!map.has(k)) map.set(k,v);
  });
  const order={verb:1,noun:2,pronoun:3,adjective:4,other:5};
  const rows=[...map.values()]
    .filter(r=>r.form && r.meaning)
    .sort((a,b)=>(order[a.type]-order[b.type])||a.form.localeCompare(b.form))
    .slice(0,24);
  if(!rows.length) return '';
  const table=`<div class="table-wrap"><table class="vocab-table"><thead><tr><th>词形</th><th>语法信息</th><th>基本义</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${text(r.form)}</td><td>${text(r.grammar)}</td><td>${text(r.meaning)}</td></tr>`).join('')}</tbody></table></div>`;
  const body=rows.length>8?`<details class="vocab-details"><summary>本节单词（${rows.length} 个，点击展开）</summary>${table}</details>`:table;
  return `<section class="card compact"><div class="section-title"><h3>本节单词</h3></div>${body}</section>`;
}
