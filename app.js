const VERSION="20.41";
let GRAMMAR=[],currentModule='',currentLesson=null,currentFilter='全部',lastView='homeView',cardItems=[],cardIndex=0,exerciseItems=[],exerciseIndex=0,selectedChoice='',exerciseStats={total:0,right:0,wrong:0};const WRONG_KEY='pali_grammar_wrong_exercises_v1',STATUS_KEY='pali_grammar_lesson_status_v2';const MODULE_ORDER=['使用说明','入门与发音','动词系统','名词变格','代词与形容词','分词与非限定动词','不变词与常用句式','句法与阅读','其他'];const TRAINING_PRESETS=[['case','格位识别专项','集中练习主格、宾格、工具格、处格、属格等。'],['verb','动词变位专项','集中练习现在时、将来时、过去时、命令语气等。'],['nonfinite','非限定动词专项','集中练习inf.、ger.、分词。'],['particles','ind.与句型专项','集中练习 na、mā、ca、vā、eva、iti 等。'],['reading','阅读分析专项','集中练习短句中的主语、宾语、动词和格位。'],['input','输入生成专项','只练需要手动输入答案的题目。']];function $(id){return document.getElementById(id)}function show(id){const el=$(id); if(el) el.classList.remove('hidden')}function hide(id){const el=$(id); if(el) el.classList.add('hidden')}function switchView(id){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));show(id);window.scrollTo({top:0,behavior:'smooth'})}function norm(t){return String(t||'').trim().replace(/\s+/g,' ').toLowerCase()}function strip(t){const m={ā:'a',ī:'i',ū:'u',ṅ:'n',ñ:'n',ṭ:'t',ḍ:'d',ṇ:'n',ḷ:'l',ṃ:'m',ṁ:'m'};return String(t||'').replace(/[āīūṅñṭḍṇḷṃṁ]/g,ch=>m[ch]||ch)}function ok(u,e){u=norm(u);e=norm(e);if(u===e)return true;let lu=strip(u),le=strip(e);if(lu===le)return true;return e.split(/\s*\/\s*|；|;|，|,|、/).some(x=>u===norm(x)||lu===strip(norm(x)))}function getW(){try{return JSON.parse(localStorage.getItem(WRONG_KEY))||{}}catch{return {}}}function saveW(r){localStorage.setItem(WRONG_KEY,JSON.stringify(r));stats()}function getS(){try{return JSON.parse(localStorage.getItem(STATUS_KEY))||{}}catch{return {}}}function saveS(s){localStorage.setItem(STATUS_KEY,JSON.stringify(s));stats()}function lstat(id){return getS()[id]||'未学'}function setLStat(id,s){let x=getS();x[id]=s;saveS(x);statusBtns();renderModules();if(currentModule)renderLessonList(currentModule)}function scls(s){return s==='已掌握'?'mastered':s==='学习中'?'learning':s==='需复习'?'review':''}function lessons(m){return m==='全部模块'?GRAMMAR:GRAMMAR.filter(x=>x.module===m)}function stats(){let total=GRAMMAR.reduce((a,l)=>a+(l.exercises||[]).length,0),s=getS(),master=GRAMMAR.filter(l=>s[l.id]==='已掌握').length;if($('totalLessons'))$('totalLessons').textContent=GRAMMAR.length;if($('totalExercises'))$('totalExercises').textContent=total;if($('masteredCount'))$('masteredCount').textContent=master;if($('wrongCount'))$('wrongCount').textContent=Object.keys(getW()).length}function progress(ls){let m=ls.filter(l=>lstat(l.id)==='已掌握').length,p=ls.length?Math.round(m/ls.length*100):0;return `<div class="progress-wrap"><div class="progress-bar" style="width:${p}%"></div></div><p class="muted">掌握进度：${m}/${ls.length}（${p}%）</p>`}function cardHTML(l){let s=lstat(l.id),n=(l.exercises||[]).length;return `<h3>${l.lesson_number||l.id}. ${l.title}</h3><div class="lesson-badges"><span class="badge ${scls(s)}">${s}</span><span class="badge">${l.category||''}</span><span class="badge">${n}题</span></div><p>${l.summary||''}</p>`}function renderModules(){let grids=[$('moduleGrid'),$('moduleGridPage')].filter(Boolean);grids.forEach(grid=>{grid.innerHTML='';MODULE_ORDER.forEach(m=>{let ls=lessons(m);if(!ls.length)return;let d=document.createElement('div');d.className='module-card';d.innerHTML=`<h3>${m}</h3><p class="muted">${ls.length} 个语法点</p>${progress(ls)}`;d.onclick=()=>openModule(m);grid.appendChild(d)})})}function renderLessonList(m){currentModule=m;let all=lessons(m),ls=all.filter(l=>currentFilter==='全部'||lstat(l.id)===currentFilter);$('moduleTitle').textContent=m;$('moduleSubtitle').textContent=`${all.length} 个语法点`;$('lessonList').innerHTML=ls.length?'':'<p class="muted">当前筛选下没有语法点。</p>';ls.forEach(l=>{let d=document.createElement('div');d.className='lesson-item';d.innerHTML=cardHTML(l);d.onclick=()=>openLesson(l.id);$('lessonList').appendChild(d)})}function openModule(m){lastView='lessonListView';currentFilter='全部';document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter==='全部'));renderLessonList(m);switchView('lessonListView')}function statusBtns(){if(!currentLesson)return;let s=lstat(currentLesson.id);document.querySelectorAll('.status-btn').forEach(b=>b.classList.toggle('active',b.dataset.status===s))}function openLesson(id){currentLesson=GRAMMAR.find(x=>x.id===id);if(!currentLesson)return;$('lessonModule').textContent=currentLesson.module||'';$('lessonTitle').textContent=currentLesson.title;$('lessonMeta').textContent=`${currentLesson.category||''}｜${currentLesson.difficulty||currentLesson.level||''}`;$('lessonSummary').textContent=currentLesson.summary||'';document.querySelectorAll('.high-risk-box,.content-tier-box,.minimal-mastery-box,.misjudge-box,.lesson-guide-box,.linked-confusion-box,.linked-pattern-box,.linked-buddhist-box,.linked-background-box,.linked-academic-box,.linked-term-box').forEach(x=>x.remove());let polish=contentPolishHTML(currentLesson)+linkedConfusionHTML(currentLesson)+linkedPatternHTML(currentLesson)+linkedBuddhistReadingHTML(currentLesson)+linkedBuddhistBackgroundHTML(currentLesson)+linkedAcademicTrainingHTML(currentLesson)+linkedTerminologyHTML(currentLesson)+lessonStudyGuideHTML(currentLesson);if(currentLesson.high_risk_note){polish+=`<div class="high-risk-box"><strong>进阶/需复核提示：</strong>${currentLesson.high_risk_note}<br><button class="feedback-mini-btn" onclick="copyCurrentLessonFeedback()">反馈本课问题</button></div>`}$('lessonSummary').insertAdjacentHTML('afterend',polish);let e=$('lessonExplanation');e.innerHTML='';(currentLesson.explanation||[]).forEach(x=>{let li=document.createElement('li');li.textContent=x;e.appendChild(li)});let mb=$('mistakeBlock'),ml=$('lessonMistakes');if(ml){ml.innerHTML='';if(currentLesson.common_mistakes&&currentLesson.common_mistakes.length){currentLesson.common_mistakes.forEach(x=>{let li=document.createElement('li');li.textContent=x;ml.appendChild(li)});show('mistakeBlock')}else hide('mistakeBlock')}let t=$('lessonTable');t.innerHTML='';(currentLesson.table||[]).forEach(r=>{let tr=document.createElement('tr');r.forEach(c=>{let td=document.createElement('td');td.textContent=c;tr.appendChild(td)});t.appendChild(tr)});let ex=$('lessonExamples');ex.innerHTML='';(currentLesson.examples||[]).forEach(a=>{let d=document.createElement('div');d.className='example';d.innerHTML=exampleHTML(a);ex.appendChild(d)});statusBtns();switchView('lessonView')}function allEx(m){return lessons(m).flatMap(l=>(l.exercises||[]).map(ex=>({...ex,lesson_id:l.id,lesson_title:l.title,module:l.module,category:l.category})))}function shuffle(a){return [...a].sort(()=>Math.random()-.5)}function startCards(cs){cardItems=cs||[];cardIndex=0;if(!cardItems.length)return alert('当前没有卡片。');show('cardPanel');hide('exercisePanel');renderCard()}function renderCard(){let c=cardItems[cardIndex];$('cardProgress').textContent=`卡片 ${cardIndex+1}/${cardItems.length}`;$('cardQuestion').textContent=c.q;$('cardAnswer').textContent=c.a;hide('cardAnswer');show('cardBeforeButtons');hide('cardAfterButtons')}function nextCard(){if(++cardIndex>=cardItems.length){alert('卡片复习完成。');hide('cardPanel')}else renderCard()}function startExercises(items,title='练习'){exerciseItems=items||[];exerciseIndex=0;selectedChoice='';exerciseStats={total:0,right:0,wrong:0};if(!exerciseItems.length)return alert('当前没有练习题。');show('exercisePanel');hide('cardPanel');$('exerciseModeTitle').textContent=title;renderExercise()}function renderExercise(){let ex=exerciseItems[exerciseIndex];selectedChoice='';$('exerciseProgress').textContent=`题目 ${exerciseIndex+1}/${exerciseItems.length}｜正确 ${exerciseStats.right}｜错误 ${exerciseStats.wrong}`;$('exerciseLessonLabel').textContent=`${ex.module||''}｜${ex.lesson_title||''}`;$('exerciseQuestion').textContent=ex.question;$('exerciseFeedback').innerHTML='';$('exerciseFeedback').className='answer-box hidden';hide('nextExerciseBtn');show('submitExerciseBtn');let opts=$('exerciseOptions'),inp=$('exerciseInput');opts.innerHTML='';inp.value='';if(ex.type==='choice'){hide('exerciseInput');hide('paliKeyboard');(ex.options||[]).forEach(o=>{let b=document.createElement('button');b.className='option-btn';b.textContent=o;b.onclick=()=>{selectedChoice=o;document.querySelectorAll('.option-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')};opts.appendChild(b)})}else{show('exerciseInput');show('paliKeyboard')}}function submitExercise(){let ex=exerciseItems[exerciseIndex],ua='';if(ex.type==='choice'){ua=selectedChoice;if(!ua)return alert('请先选择一个答案。')}else{ua=$('exerciseInput').value;if(!ua.trim())return alert('请先输入答案。')}let good=ok(ua,ex.answer);exerciseStats.total++;let w=getW();if(good){exerciseStats.right++;delete w[ex.id]}else{exerciseStats.wrong++;w[ex.id]={...ex,wrong_at:new Date().toISOString()}}saveW(w);$('exerciseFeedback').innerHTML=`<strong>${good?'回答正确 ✅':'回答错误 ❌'}</strong><p>你的答案：${ua}</p><p>标准答案：${ex.answer}</p><p>${ex.explanation||''}</p>`;$('exerciseFeedback').classList.remove('hidden');if(!good)$('exerciseFeedback').classList.add('incorrect');show('nextExerciseBtn');hide('submitExerciseBtn')}function nextEx(){if(++exerciseIndex>=exerciseItems.length){alert(`本轮练习完成：正确 ${exerciseStats.right}，错误 ${exerciseStats.wrong}`);hide('exercisePanel');renderWrong();stats()}else renderExercise()}function renderSelect(){let s=$('exerciseModuleSelect');s.innerHTML='<option value="全部模块">全部模块</option>';MODULE_ORDER.forEach(m=>{if(GRAMMAR.some(x=>x.module===m)){let o=document.createElement('option');o.value=m;o.textContent=m;s.appendChild(o)}})}function renderWrong(){let items=Object.values(getW()),box=$('wrongList');box.innerHTML=items.length?'':'<p class="muted">目前没有错题。</p>';items.forEach(it=>{let d=document.createElement('div');d.className='wrong-item';d.innerHTML=`<strong>${it.question}</strong><p class="muted">${it.module||''}｜${it.lesson_title||''}</p><p>答案：${it.answer}</p>`;box.appendChild(d)})}function search(q){let box=$('searchResults');q=String(q||'').trim().toLowerCase();box.innerHTML=q?'':'<p class="muted">输入关键词后显示搜索结果。</p>';if(!q)return;let res=GRAMMAR.filter(l=>[l.title,l.category,l.module,l.summary,...(l.explanation||[]),...(l.examples||[]).flatMap(e=>[e.pali,e.cn,e.note]),...(l.cards||[]).flatMap(c=>[c.q,c.a])].join(' ').toLowerCase().includes(q));if(!res.length){box.innerHTML='<p class="muted">没有找到相关语法点。</p>';return}res.forEach(l=>{let d=document.createElement('div');d.className='lesson-item';d.innerHTML=cardHTML(l);d.onclick=()=>{lastView='searchView';openLesson(l.id)};box.appendChild(d)})}function train(key){let all=GRAMMAR.flatMap(l=>(l.exercises||[]).map(ex=>({...ex,lesson_id:l.id,lesson_title:l.title,module:l.module,category:l.category})));let f=all;if(key==='input')f=all.filter(e=>e.type==='input');else if(key==='reading')f=all.filter(e=>e.lesson_id===75||e.category==='阅读训练');else if(key==='case')f=all.filter(e=>/格|主格|宾格|工具格|处格|属格|与格|从格|呼格/.test(e.question+e.explanation));else if(key==='verb')f=all.filter(e=>/动词|现在时|将来时|过去|命令|祈愿|条件式|使役|被动|人称|词尾/.test(e.question+e.explanation));else if(key==='nonfinite')f=all.filter(e=>/inf.|ger.|分词|gantvā|gantuṃ|katvā|kātuṃ|sutvā/.test(e.question+e.explanation));else if(key==='particles')f=all.filter(e=>/ind.|na|mā|ca|vā|eva|iti|ti|关联|引语|否定|并列|选择/.test(e.question+e.explanation));return f}function renderTraining(){let grid=$('trainingGrid');grid.innerHTML='';TRAINING_PRESETS.forEach(p=>{let count=train(p[0]).length,d=document.createElement('div');d.className='training-card';d.innerHTML=`<h3>${p[1]}</h3><p class="muted">${p[2]}</p><p class="muted">${count} 道题</p><button class="primary">开始专项强化</button>`;d.onclick=()=>startExercises(shuffle(train(p[0])).slice(0,20),p[1]);grid.appendChild(d)})}



const SENTENCE_STATUS_KEY="pali_sentence_analysis_status_v1";

function getSentenceStatuses(){
  try{return JSON.parse(localStorage.getItem(SENTENCE_STATUS_KEY))||{}}catch{return {}}
}
function saveSentenceStatuses(statuses){
  localStorage.setItem(SENTENCE_STATUS_KEY, JSON.stringify(statuses));
}
function sentenceStatus(id){
  return getSentenceStatuses()[id] || "未练";
}
function setSentenceStatus(id,status){
  const statuses=getSentenceStatuses();
  statuses[id]=status;
  saveSentenceStatuses(statuses);
  renderSentenceSelect(true);
  renderSentenceDashboard();
  renderSentenceCard("question");
}
function sentenceLevels(){
  return [...new Set((window.SENTENCE_ANALYSIS_DATA||[]).map(x=>x.level))];
}
function sentenceTags(){
  const tags=new Set(["全部"]);
  (window.SENTENCE_ANALYSIS_DATA||[]).forEach(x=>(x.tags||[]).forEach(t=>tags.add(t)));
  return [...tags];
}
function sentenceSources(){
  return ["全部", ...new Set((window.SENTENCE_ANALYSIS_DATA||[]).map(x=>x.source_type||"教学句"))];
}
function sentencePriorities(){
  return ["全部", ...new Set((window.SENTENCE_ANALYSIS_DATA||[]).map(x=>x.practice_priority||"综合挑战"))];
}
function sentenceStats(){
  const all=window.SENTENCE_ANALYSIS_DATA||[];
  const statuses=getSentenceStatuses();
  const mastered=all.filter(x=>statuses[x.id]==="已掌握").length;
  const review=all.filter(x=>statuses[x.id]==="需复习").length;
  const unpracticed=all.length-mastered-review;
  const current=filteredSentences(false).length;
  return {total:all.length, mastered, review, unpracticed, current};
}
function renderSentenceDashboard(){
  const box=$("sentenceDashboard");
  if(!box)return;
  const s=sentenceStats();
  box.innerHTML=`
    <div class="sentence-stat-card"><strong>${s.total}</strong><span>句子总数</span></div>
    <div class="sentence-stat-card"><strong>${s.mastered}</strong><span>已掌握</span></div>
    <div class="sentence-stat-card"><strong>${s.review}</strong><span>需复习</span></div>
    <div class="sentence-stat-card"><strong>${s.current}</strong><span>当前筛选</span></div>
  `;
}
function renderSentenceLevels(){
  const levelSel=$("sentenceLevelSelect"), tagSel=$("sentenceTagSelect"), sourceSel=$("sentenceSourceSelect"), prioritySel=$("sentencePrioritySelect");
  if(!levelSel)return;
  levelSel.innerHTML="";
  sentenceLevels().forEach(level=>{let o=document.createElement("option");o.value=level;o.textContent=level;levelSel.appendChild(o)});
  if(tagSel){
    tagSel.innerHTML="";
    sentenceTags().forEach(tag=>{let o=document.createElement("option");o.value=tag;o.textContent=tag;tagSel.appendChild(o)});
  }
  if(sourceSel){
    sourceSel.innerHTML="";
    sentenceSources().forEach(source=>{let o=document.createElement("option");o.value=source;o.textContent=source;sourceSel.appendChild(o)});
  }
  if(prioritySel){
    prioritySel.innerHTML="";
    sentencePriorities().forEach(p=>{let o=document.createElement("option");o.value=p;o.textContent=p;prioritySel.appendChild(o)});
  }
  renderSentenceSelect();
  renderSentenceDashboard();
}
function filteredSentences(applySort=true){
  const level=$("sentenceLevelSelect")?.value;
  const tag=$("sentenceTagSelect")?.value||"全部";
  const source=$("sentenceSourceSelect")?.value||"全部";
  const priority=$("sentencePrioritySelect")?.value||"全部";
  const status=$("sentenceStatusSelect")?.value||"全部";
  let items=(window.SENTENCE_ANALYSIS_DATA||[]).filter(x=>{
    const okLevel=!level||x.level===level;
    const okTag=tag==="全部"||(x.tags||[]).includes(tag);
    const okSource=source==="全部"||(x.source_type||"教学句")===source;
    const okPriority=priority==="全部"||(x.practice_priority||"综合挑战")===priority;
    const okStatus=status==="全部"||sentenceStatus(x.id)===status;
    return okLevel&&okTag&&okSource&&okPriority&&okStatus;
  });
  if(applySort){
    items=items.sort((a,b)=>(a.priority_rank||99)-(b.priority_rank||99)||(a.recommended_order||999)-(b.recommended_order||999));
  }
  return items;
}
function renderSentenceSelect(keepCurrent=false){
  const sentSel=$("sentenceSelect"); if(!sentSel)return;
  const oldValue=sentSel.value;
  const items=filteredSentences(); sentSel.innerHTML="";
  items.forEach(item=>{let o=document.createElement("option");o.value=item.id;o.textContent=`${item.sentence}（${sentenceStatus(item.id)}）`;sentSel.appendChild(o)});
  if(keepCurrent && oldValue){
    for(let i=0;i<sentSel.options.length;i++){
      if(sentSel.options[i].value===oldValue){sentSel.selectedIndex=i;break;}
    }
  }
  renderSentenceDashboard();
  renderSentenceCard("question");
}
function currentSentence(){
  const id=$("sentenceSelect")?.value;
  return (window.SENTENCE_ANALYSIS_DATA||[]).find(x=>x.id===id);
}
function relatedLessonButtonHTML(name){
  return `<button class="related-link-btn" data-related="${String(name).replace(/"/g,'&quot;')}">${name}</button>`;
}
function bindRelatedButtons(){
  document.querySelectorAll("[data-token-lookup]").forEach(btn=>{btn.onclick=()=>{ if(window.__paliLookupLinks176){window.__paliLookupLinks176.goLookupFromLesson176(btn.dataset.tokenLookup)}else lookupToken(btn.dataset.tokenLookup); }});
  document.querySelectorAll("[data-token-analyze]").forEach(btn=>{btn.onclick=()=>{switchView("dictionaryLookupView");renderDictionarySites();analyzePaliToken(btn.dataset.tokenAnalyze);}});
  document.querySelectorAll("[data-related]").forEach(btn=>{btn.onclick=()=>{
    const name=btn.dataset.related;
    const lesson=GRAMMAR.find(l=>l.title===name || (l.title||"").includes(name) || name.includes(l.title));
    if(lesson){openLesson(lesson.id)}
    else{switchView("searchView");$("searchInput").value=name;renderSearchResults(name)}
  }});
}
function sentenceStatusChipHTML(item){
  const s=sentenceStatus(item.id);
  const cls=s==="已掌握"?"mastered":(s==="需复习"?"review":"");
  return `<span class="sentence-status-chip ${cls}">状态：${s}</span>`;
}
function sentenceRouteAdvice(item){
  if(!item)return "";
  const p=item.practice_priority||"综合挑战";
  let advice="建议按顺序分析：先找限定动词，再找主语、宾语和结构信号。";
  if(p==="基础必练") advice="这是基础必练句，建议反复练到能不看提示完成分析。";
  if(p==="重点提高") advice="这是重点提高句，适合在掌握主宾动后练习格位、ger.或分词。";
  if(p==="结构专项") advice="这是结构专项句，重点观察ind.、否定、并列、选择或关联结构。";
  if(p==="综合挑战") advice="这是综合挑战句，需要综合判断格位、动词、分词和句间结构。";
  if(p==="进阶选练") advice="这是进阶选练句，涉及佛典公式、sandhi 或特殊词形，可先识别大意。";
  return `<div class="route-box"><strong>学习路线建议：</strong>${advice}</div>`;
}
function renderSentenceCard(mode="question"){
  const box=$("sentenceAnalysisCard"); if(!box)return;
  const item=currentSentence();
  if(!item){box.innerHTML='<p class="muted">当前筛选下没有句子，请更换筛选条件。</p>';return}
  const tagHTML=(item.tags||[]).map(t=>`<span class="tag-chip">${t}</span>`).join("");
  const stepMap={question:"第 1 步：先看原文",translation:"第 2 步：核对翻译",hint:"第 3 步：查看提示",analysis:"第 4 步：完整分析"};
  let html=`<p class="pill">${item.level}</p><p class="sentence-step-chip">${stepMap[mode]||stepMap.question}</p><p class="sentence-main">${item.sentence}</p>${sentenceStatusChipHTML(item)}<span class="source-chip">${item.source_type||"教学句"}</span><span class="source-chip">${item.practice_priority||"综合挑战"}</span><div>${tagHTML}</div><div class="training-goal-box"><strong>训练目标：</strong>${item.training_goal||"训练句子分析能力。"}</div>${sentenceRouteAdvice(item)}`;
  if(mode==="question"){
    html+=`<div class="analysis-tip"><strong>练习顺序：</strong>先不要看翻译，自己判断限定动词、主语、宾语或格位。</div><ol class="self-check-list">${(item.self_check||[]).map(q=>`<li>${q}</li>`).join("")}</ol>`;
  }
  if(mode==="translation"){
    html+=`<p class="sentence-translation"><strong>翻译：</strong>${item.translation}</p><div class="analysis-tip"><strong>下一步：</strong>对照翻译，重新判断哪些词承担主语、宾语、处所、工具或引语功能。</div><ol class="self-check-list">${(item.self_check||[]).map(q=>`<li>${q}</li>`).join("")}</ol>`;
  }
  if(mode==="hint"){
    html+=`<p class="sentence-translation"><strong>翻译：</strong>${item.translation}</p><h3>句法结构提示</h3><p>${item.structure}</p><ol class="self-check-list">${(item.self_check||[]).map(q=>`<li>${q}</li>`).join("")}</ol><div class="analysis-tip"><strong>易错提醒：</strong>${item.tip}</div>`;
  }
  if(mode==="analysis"){
    html+=`<p class="sentence-translation"><strong>翻译：</strong>${item.translation}</p><h3>句法结构</h3><p>${item.structure}</p><h3>逐词分析</h3><table class="token-table"><tr><td>词形</td><td>语法说明</td><td>句中功能</td><td>意义</td><td>查词</td></tr>`;
    item.tokens.forEach(t=>{html+=`<tr><td><strong>${t.form}</strong></td><td>${t.grammar}</td><td>${t.role}</td><td>${t.meaning}</td><td><button class="token-lookup-btn" data-token-lookup="${t.form}">查词</button><button class="token-analyze-btn" data-token-analyze="${t.form}">分析</button></td></tr>`});
    html+=`</table><div class="analysis-tip"><strong>易错提醒：</strong>${item.tip}</div><div class="confidence-box"><strong>解析级别：</strong>${item.analysis_level||"教学解析"}</div><div class="analysis-related"><strong>相关语法点：</strong><br>${(item.related||[]).map(relatedLessonButtonHTML).join("")}</div>`;
  }
  box.innerHTML=html; bindRelatedButtons();
}
function nextSentence(){
  const sentSel=$("sentenceSelect");
  if(!sentSel||sentSel.options.length===0)return;
  sentSel.selectedIndex=(sentSel.selectedIndex+1)%sentSel.options.length;
  renderSentenceCard("question");
}
function randomSentence(){
  const items=filteredSentences();
  if(!items.length)return;
  const item=items[Math.floor(Math.random()*items.length)];
  const sentSel=$("sentenceSelect");
  if(sentSel){
    for(let i=0;i<sentSel.options.length;i++){
      if(sentSel.options[i].value===item.id){sentSel.selectedIndex=i;break;}
    }
  }
  renderSentenceCard("question");
}
function startBasicSentenceRoute(){
  if($("sentencePrioritySelect"))$("sentencePrioritySelect").value="基础必练";
  if($("sentenceStatusSelect"))$("sentenceStatusSelect").value="未练";
  renderSentenceSelect();
}
function showReviewSentenceRoute(){
  if($("sentenceStatusSelect"))$("sentenceStatusSelect").value="需复习";
  renderSentenceSelect();
}
function resetSentenceFilters(){
  if($("sentenceTagSelect"))$("sentenceTagSelect").value="全部";
  if($("sentenceSourceSelect"))$("sentenceSourceSelect").value="全部";
  if($("sentencePrioritySelect"))$("sentencePrioritySelect").value="全部";
  if($("sentenceStatusSelect"))$("sentenceStatusSelect").value="全部";
  renderSentenceSelect();
}
function sentenceAnalysisText(item){
  if(!item)return "";
  const lines=[
    `【巴利语句子分析】`,
    `原句：${item.sentence}`,
    `翻译：${item.translation}`,
    `来源类型：${item.source_type||""}`,
    `训练层级：${item.practice_priority||""}`,
    `难点标签：${(item.tags||[]).join("；")}`,
    `句法结构：${item.structure}`,
    "",
    "逐词分析："
  ];
  (item.tokens||[]).forEach(t=>lines.push(`${t.form}\t${t.grammar}\t${t.role}\t${t.meaning}`));
  lines.push("", `易错提醒：${item.tip||""}`, `解析级别：${item.analysis_level||""}`, `相关语法点：${(item.related||[]).join("；")}`);
  return lines.join("\n");
}
async function copyCurrentSentenceAnalysis(){
  const item=currentSentence();
  const text=sentenceAnalysisText(item);
  try{
    await navigator.clipboard.writeText(text);
    alert("本句解析已复制。");
  }catch{
    alert("复制失败，可以手动选择页面内容复制。");
  }
}


function linguisticsCategories(){
  return ["全部", ...new Set((window.LINGUISTICS_TIPS||[]).map(x=>x.category))];
}
function renderLinguisticsCategories(){
  const sel=$("linguisticsCategorySelect");
  if(!sel)return;
  sel.innerHTML="";
  linguisticsCategories().forEach(c=>{let o=document.createElement("option");o.value=c;o.textContent=c;sel.appendChild(o)});
}
function renderLinguisticsTips(){
  const box=$("linguisticsTipsList");
  if(!box)return;
  const q=($("linguisticsSearchInput")?.value||"").trim().toLowerCase();
  const cat=$("linguisticsCategorySelect")?.value||"全部";
  const items=(window.LINGUISTICS_TIPS||[]).filter(t=>{
    const text=[t.title,t.category,t.summary,t.example,...(t.keywords||[]),...(t.related||[])].join(" ").toLowerCase();
    return (cat==="全部"||t.category===cat) && (!q||text.includes(q));
  });
  box.innerHTML=items.length?"":"<p class='muted'>没有找到相关概念。</p>";
  items.forEach(t=>{
    let div=document.createElement("div");
    div.className="tip-card";
    div.innerHTML=`<span class="tip-category">${t.category}</span><h3>${t.title}</h3><p>${t.summary}</p>`;
    div.onclick=()=>openTipModal(t.id);
    box.appendChild(div);
  });
}
function findTipByTitleOrKeyword(name){
  const n=String(name||"").toLowerCase();
  return (window.LINGUISTICS_TIPS||[]).find(t=>t.title===name || (t.keywords||[]).some(k=>String(k).toLowerCase()===n) || String(t.title).toLowerCase().includes(n));
}
function openTipModal(idOrName){
  const tip=(window.LINGUISTICS_TIPS||[]).find(t=>t.id===idOrName) || findTipByTitleOrKeyword(idOrName);
  if(!tip)return;
  const body=$("tipModalBody");
  body.innerHTML=`
    <span class="tip-category">${tip.category}</span>
    <h2>${tip.title}</h2>
    <p>${tip.summary}</p>
    <div class="tip-example"><strong>例子：</strong>${tip.example}</div>
    <p><strong>相关概念：</strong>${(tip.related||[]).map(x=>`<button class="tip-button" data-tip="${x}">${x}</button>`).join("")}</p>
  `;
  show("tipModal");
  document.querySelectorAll("[data-tip]").forEach(btn=>btn.onclick=()=>openTipModal(btn.dataset.tip));
}
function closeTipModal(){
  hide("tipModal");
}
function tipButtonsHTML(names){
  const buttons=[];
  names.forEach(name=>{
    const tip=findTipByTitleOrKeyword(name);
    if(tip && !buttons.some(b=>b.id===tip.id)){
      buttons.push(tip);
    }
  });
  if(!buttons.length)return "";
  return `<div class="tip-inline-box"><strong>相关语言学知识：</strong><br>${buttons.map(t=>`<button class="tip-button" data-tip="${t.id}">${t.title}</button>`).join("")}</div>`;
}
function inferTipNamesFromLesson(lesson){
  const text=[lesson.title,lesson.module,lesson.category,lesson.summary,...(lesson.explanation||[])].join(" ");
  const names=[];
  const rules=[
    ["主格","主格"],["宾格","宾格"],["工具格","工具格"],["与格","与格"],["从格","从格"],["属格","属格"],["处格","处格"],["呼格","呼格"],
    ["变格","格"],["格位","格"],["动词","限定动词"],["inf.","inf."],["ger.","ger."],["gerund","ger."],
    ["pr.p.","pr.p."],["p.p.","p.p."],["f.p.p.","f.p.p."],["分词","分词"],
    ["sandhi","sandhi 连读音变"],["连读","sandhi 连读音变"],["复合词","复合词"],["ind.","ind."],["否定","否定"],["ca","并列"],["vā","选择"],["yo","关系—指示结构"]
  ];
  rules.forEach(([key,val])=>{if(text.includes(key))names.push(val)});
  if(lesson.module==="名词变格")names.push("格","词干","词尾");
  if(lesson.module==="动词系统")names.push("限定动词","变位","词尾");
  if(lesson.module==="句法与阅读")names.push("句法学","主语","宾语","限定动词");
  return names;
}
function inferTipNamesFromSentence(item){
  const names=[];
  (item.tags||[]).forEach(tag=>{
    const map={
      "主宾动":["主语","宾语","限定动词"],
      "格位":["格"],
      "处格":["处格"],
      "工具格":["工具格"],
      "属格":["属格"],
      "与格/目的":["与格"],
      "inf.":["inf."],
      "ger.":["ger."],
      "pr.p.":["pr.p."],
      "p.p.":["p.p."],
      "f.p.p.":["f.p.p."],
      "ind./关联句":["ind."],
      "na/mā":["否定"],
      "ca/vā":["并列","选择"],
      "yo...so":["关系—指示结构"],
      "sandhi/复合词":["sandhi 连读音变","复合词"]
    };
    (map[tag]||[]).forEach(x=>names.push(x));
  });
  return names;
}
function bindTipButtons(){
  document.querySelectorAll("[data-tip]").forEach(btn=>btn.onclick=()=>openTipModal(btn.dataset.tip));
}


let currentRouteId = "zero";
function renderLearningRoutes(){
  const tabs=$("routeTabs"), content=$("routeContent");
  if(!tabs || !content)return;
  tabs.innerHTML="";
  (window.LEARNING_ROUTES||[]).forEach(route=>{
    const btn=document.createElement("button");
    btn.className="route-tab" + (route.id===currentRouteId ? " active" : "");
    btn.textContent=route.title;
    btn.onclick=()=>{currentRouteId=route.id;renderLearningRoutes();};
    tabs.appendChild(btn);
  });
  const route=(window.LEARNING_ROUTES||[]).find(r=>r.id===currentRouteId) || (window.LEARNING_ROUTES||[])[0];
  if(!route){content.innerHTML="<p class='muted'>暂无学习路线。</p>";return;}
  let html=`<h3>${route.title}</h3><p>${route.desc}</p>`;
  if(route.id==="zero"){
    html += `<div class="student-note"><strong>建议：</strong>零基础学生先按这一条路线走，不必一开始打开所有语法点。每一步学完后，做几道练习，再进入下一步。</div>`;
  }
  (route.steps||[]).forEach((step,idx)=>{
    html += `<div class="route-step"><h3>${idx+1}. ${step.title}</h3><p>${step.desc}</p><div class="route-lesson-list">`;
    (step.lesson_ids||[]).forEach(id=>{
      const lesson=GRAMMAR.find(l=>l.id===id);
      if(lesson){html += `<button class="route-lesson-btn" data-route-lesson="${id}">${lesson.lesson_number||""}. ${lesson.title}</button>`;}
    });
    if(step.sentence_priority){
      html += `<button class="route-sentence-btn" data-sentence-priority="${step.sentence_priority}">进入句子分析：${step.sentence_priority}</button>`;
    }
    html += `</div></div>`;
  });
  content.innerHTML=html;
  document.querySelectorAll("[data-route-lesson]").forEach(btn=>{btn.onclick=()=>openLesson(Number(btn.dataset.routeLesson));});
  document.querySelectorAll("[data-sentence-priority]").forEach(btn=>{
    btn.onclick=()=>{
      const p=btn.dataset.sentencePriority;
      switchView("sentenceAnalysisView");
      renderSentenceLevels();
      if($("sentencePrioritySelect"))$("sentencePrioritySelect").value=p;
      if($("sentenceStatusSelect"))$("sentenceStatusSelect").value="全部";
      renderSentenceSelect();
    };
  });
}



function renderSiteHealth(){
  const box=$("siteHealthPanel");
  if(!box)return;
  const checks=[
    ["grammar.json", typeof GRAMMAR!=="undefined" && Array.isArray(GRAMMAR)],
    ["sentence-analysis-data.js", !!window.SENTENCE_ANALYSIS_DATA],
    ["linguistics-tips-data.js", !!window.LINGUISTICS_TIPS],
    ["learning-routes-data.js", !!window.LEARNING_ROUTES],
    ["dictionary-sites-data.js", !!window.PALI_DICTIONARY_SITES],
    ["token-analysis-data.js",
    "module-guides-data.js",
    "confusion-pairs-data.js",
    "sentence-patterns-data.js",
    "buddhist-reading-data.js",
    "buddhist-background-data.js",
    "academic-training-data.js",
    "terminology-glossary-data.js", !!window.TOKEN_ANALYSIS_DATA]
  ];
  const bad=checks.filter(x=>!x[1]).map(x=>x[0]);
  box.innerHTML=bad.length?`<span class="site-health-bad">有文件未加载：</span>${bad.join("、")}`:`<span class="site-health-ok">网站文件加载正常。</span>`;
}

function renderVersionStatus(){
  const box=$("versionStatus");
  if(!box)return;
  box.textContent=`当前版本：Pāli Learning Lab ${VERSION}｜如果页面显示旧内容，请点击下方刷新缓存。`;
}

async function refreshSiteCache(){
  try{
    if("serviceWorker" in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      for(const reg of regs){await reg.update();}
    }
    if(window.caches){
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k.includes("pali")).map(k=>caches.delete(k)));
    }
    location.reload(true);
  }catch(e){
    location.reload(true);
  }
}

function checkRequiredFiles(){
  renderSiteHealth();
  const required=[
    "grammar-module-directory.json",
    "grammar-lesson-manifest.json",
    "exercise-index.json",
    "search-index.json",
    "sentence-analysis-data.js",
    "linguistics-tips-data.js",
    "learning-routes-data.js",
    "dictionary-sites-data.js",
    "token-analysis-data.js"
  ];
  const missing=[];
  /* grammar.json removed after split-lazy versions */
  if(!window.SENTENCE_ANALYSIS_DATA) missing.push("sentence-analysis-data.js");
  if(!window.LINGUISTICS_TIPS) missing.push("linguistics-tips-data.js");
  if(!window.LEARNING_ROUTES) missing.push("learning-routes-data.js");
  if(missing.length){
    alert("有文件没有加载成功：" + missing.join("、") + "。请确认 GitHub 已上传全部网站文件。");
  }
}


function renderDictionarySites(){
  const box=$("dictionarySiteList");
  if(!box)return;
  box.innerHTML="";
  (window.PALI_DICTIONARY_SITES||[]).forEach(site=>{
    const div=document.createElement("div");
    div.className="dictionary-card";
    div.innerHTML=`
      <span class="dict-level">${site.level}</span>
      <h3>${site.name}</h3>
      <p><strong>语言：</strong>${site.langs}</p>
      <p><strong>适合：</strong>${site.best_for}</p>
      <p class="muted">${site.note}</p>
      <button class="dict-open-btn" data-dict-url="${site.url}">打开网站</button>
    `;
    box.appendChild(div);
  });
  document.querySelectorAll("[data-dict-url]").forEach(btn=>{
    btn.onclick=()=>window.open(btn.dataset.dictUrl, "_blank", "noopener");
  });
}
async function copyLookupWord(){
  const word=($("paliLookupInput")?.value||"").trim();
  if(!word){
    alert("请先输入要查的巴利语词。");
    return;
  }
  try{
    await navigator.clipboard.writeText(word);
    alert("已复制：" + word);
  }catch{
    alert("复制失败，可以手动选中输入框内容复制。");
  }
}
function openPrimaryDictionary(){
  const word=($("paliLookupInput")?.value||"").trim();
  if(word){
    try{navigator.clipboard.writeText(word)}catch(e){}
  }
  const primary=(window.PALI_DICTIONARY_SITES||[]).find(x=>x.id==="sutta") || (window.PALI_DICTIONARY_SITES||[])[0];
  if(primary) window.open(primary.url, "_blank", "noopener");
}
function clearLookupWord(){
  if($("paliLookupInput"))$("paliLookupInput").value="";
}


const LOOKUP_HISTORY_KEY="pali_lookup_history_v1";

function cleanPaliLookupWord(word){
  return String(word||"").replace(/[“”"'.。,，;；:：!?？()（）]/g,"").trim();
}
function getLookupHistory(){
  try{return JSON.parse(localStorage.getItem(LOOKUP_HISTORY_KEY))||[]}catch{return []}
}
function saveLookupHistory(items){
  localStorage.setItem(LOOKUP_HISTORY_KEY, JSON.stringify(items.slice(0,20)));
}
function addLookupHistory(word){
  word=cleanPaliLookupWord(word);
  if(!word)return;
  const items=getLookupHistory().filter(x=>x!==word);
  items.unshift(word);
  saveLookupHistory(items);
  renderLookupHistory();
}
function renderLookupHistory(){
  const box=$("lookupHistoryBox");
  if(!box)return;
  const items=getLookupHistory();
  if(!items.length){
    box.innerHTML="<p class='muted'>最近查询词会显示在这里。</p>";
    return;
  }
  box.innerHTML="<strong>最近查询：</strong><br>" + items.map(w=>`<button class="lookup-chip" data-lookup-history="${w}">${w}</button>`).join("");
  document.querySelectorAll("[data-lookup-history]").forEach(btn=>{
    btn.onclick=()=>{
      if($("paliLookupInput"))$("paliLookupInput").value=btn.dataset.lookupHistory;
    };
  });
}
async function copyTextSilent(text){
  try{await navigator.clipboard.writeText(text);return true}catch{return false}
}
async function lookupToken(word){
  word=cleanPaliLookupWord(word);
  if(!word)return;
  addLookupHistory(word);
  await copyTextSilent(word);
  const primary=(window.PALI_DICTIONARY_SITES||[]).find(x=>x.id==="sutta") || (window.PALI_DICTIONARY_SITES||[])[0];
  if(primary){
    window.open(primary.url, "_blank", "noopener");
  }
}
async function copyExampleText(text){
  const ok=await copyTextSilent(text);
  alert(ok ? "已复制例子。" : "复制失败，可以手动选择复制。");
}



function normalizeTokenForAnalysis(word){
  return String(word||"").replace(/[“”"'.。,，;；:：!?？()（）]/g,"").trim();
}
function lemmaSuggestions(word){
  const w=normalizeTokenForAnalysis(word);
  const suggestions=[];
  function add(x,why){ if(x && x!==w && !suggestions.some(s=>s.form===x)) suggestions.push({form:x,why}); }
  if(!w)return suggestions;
  if(w.endsWith("ṃ")){
    add(w.slice(0,-1), "去掉词尾 -ṃ，可能还原为词干/词典形。");
    if(w.endsWith("aṃ")) add(w.slice(0,-2)+"a", "中性或阳性 -a 词干宾格/主宾同形，可尝试 -a 词典形。");
  }
  if(w.endsWith("ssa")) add(w.slice(0,-3), "去掉 -ssa，可能还原属格/与格单数的基础词形。");
  if(w.endsWith("ena")) add(w.slice(0,-3)+"a", "工具格 -ena 常对应 -a 词干。");
  if(w.endsWith("e")) add(w.slice(0,-1)+"a", "处格 -e 常对应 -a 词干。");
  if(w.endsWith("āya")) add(w.slice(0,-3)+"ā", "阴性 -ā 词干的工具格/与格/属格可能出现 -āya。");
  if(w.endsWith("āya")) add(w.slice(0,-3)+"a", "也可尝试相关 -a 词干，需结合词典确认。");
  if(w.endsWith("tuṃ")||w.endsWith("ituṃ")||w.endsWith("etuṃ")){
    add(w.replace(/ituṃ$|etuṃ$|tuṃ$/,"ti"), "inf.可尝试查询对应现在时形式。");
  }
  if(w.endsWith("tvā")||w.endsWith("itvā")){
    add(w.replace(/itvā$|tvā$/,"ti"), "ger.可尝试查询对应动词形式，但常需词典辅助。");
  }
  if(w.endsWith("nto")) add(w.slice(0,-3)+"ti", "pr.p.阳性sg.nom可尝试查询对应动词形式。");
  if(w.endsWith("ntī")) add(w.slice(0,-3)+"ti", "pr.p.阴性形式可尝试查询对应动词形式。");
  if(w.endsWith("tabbo")) add(w.slice(0,-5)+"ti", "f.p.p.可尝试查询相关动词形式。");
  if(w.endsWith("tabbaṃ")) add(w.slice(0,-6)+"ti", "f.p.p.可尝试查询相关动词形式。");
  if(w==="Buddhassa") add("Buddha", "Buddhassa 常是 Buddha 的属格/与格单数。");
  if(w==="dhammaṃ") add("dhamma", "dhammaṃ 常是 dhamma 的sg.acc。");
  if(w==="vihāre") add("vihāra", "vihāre 常是 vihāra 的sg.loc。");
  if(w==="gacchanto") add("gacchati", "gacchanto 是pr.p.，可查 gacchati。");
  if(w==="sutvā") add("suṇāti", "sutvā 与“听”相关，可查 suṇāti / suta 等。");
  return suggestions.slice(0,6);
}
function simpleTokenGuesses(word){
  const w=normalizeTokenForAnalysis(word);
  const guesses=[];
  if(!w)return guesses;
  if(w.endsWith("ṃ")) guesses.push({grammar:"可能是sg.acc，或 -a 尾中性主格/sg.acc",role:"需结合句子判断",meaning:"可尝试还原词干后查词"});
  if(w.endsWith("ssa")) guesses.push({grammar:"可能是属格/与格单数",role:"所属、关联、给予对象或持有者",meaning:"可尝试还原词典形"});
  if(w.endsWith("ena")) guesses.push({grammar:"可能是sg.ins",role:"工具、方式、施事",meaning:"可表示“用……、由……”"});
  if(w.endsWith("e")) guesses.push({grammar:"可能是sg.loc，或某些复数/动词形式",role:"地点、时间或范围；需结合句子判断",meaning:"不要只按一个词尾机械判断"});
  if(w.endsWith("āya")) guesses.push({grammar:"可能是 -ā 尾阴性工具格/与格/sg.gen",role:"工具、目的、所属等",meaning:"需结合句子判断"});
  if(w.endsWith("tuṃ")||w.endsWith("ituṃ")||w.endsWith("etuṃ")) guesses.push({grammar:"inf.可能性高",role:"目的或动作内容",meaning:"常译为“为了……”或补足动词意义"});
  if(w.endsWith("tvā")||w.endsWith("itvā")) guesses.push({grammar:"ger./独立式可能性高",role:"先行动作",meaning:"常译为“……之后”"});
  if(w.endsWith("nto")||w.endsWith("ntī")||w.endsWith("ntā")) guesses.push({grammar:"pr.p.可能性高",role:"修饰名词或表示伴随状态",meaning:"正在……的"});
  if(w.endsWith("tabbo")||w.endsWith("tabbaṃ")||w.endsWith("tabbā")||w.endsWith("eyyaṃ")) guesses.push({grammar:"可能是f.p.p.或相关应作形式",role:"谓语性成分或修饰语",meaning:"应被……、应当……"});
  if(w.endsWith("anti")) guesses.push({grammar:"可能是现在时第三人称复数动词",role:"限定动词",meaning:"他们……"});
  else if(w.endsWith("ti")) guesses.push({grammar:"可能是现在时第三人称单数动词",role:"限定动词",meaning:"他/她/它……"});
  if(w.endsWith("mi")) guesses.push({grammar:"可能是第一人称单数动词",role:"限定动词",meaning:"我……"});
  if(w.endsWith("si")) guesses.push({grammar:"可能是第二人称单数动词",role:"限定动词",meaning:"你……"});
  return guesses;
}
function renderLemmaSuggestions(raw){
  const suggestions=lemmaSuggestions(raw);
  if(!suggestions.length)return "";
  return `<div class="lemma-suggestion-box"><strong>建议尝试还原词典形：</strong><br>`+
    suggestions.map(s=>`<button class="lemma-chip" data-lemma="${s.form}">${s.form}</button><span class="muted">${s.why}</span><br>`).join("")+
    `</div>`;
}
function bindLemmaButtons(){
  document.querySelectorAll("[data-lemma]").forEach(btn=>{
    btn.onclick=()=>{
      if($("paliLookupInput"))$("paliLookupInput").value=btn.dataset.lemma;
      analyzePaliToken(btn.dataset.lemma);
    };
  });
}
function analyzePaliToken(word, targetId="tokenAnalysisPanel"){
  const panel=$(targetId);
  if(!panel)return;
  const selected=(window.getSelection?window.getSelection().toString():"");
  const raw=normalizeTokenForAnalysis(word || $("paliLookupInput")?.value || selected || "");
  if(!raw){panel.innerHTML='<div class="analysis-warning">请先输入或选中一个巴利语词。</div>';return;}
  if($("paliLookupInput"))$("paliLookupInput").value=raw;
  addLookupHistory(raw);
  const data=window.TOKEN_ANALYSIS_DATA||{};
  const item=data[raw]||data[raw.toLowerCase()];
  const guesses=simpleTokenGuesses(raw);
  let html=`<h3>词形分析：${raw}</h3>`;
  html+=renderLemmaSuggestions(raw);
  if(item){
    html+=`<div class="analysis-result-card"><h3>一、本站例子库已收录</h3>`;
    (item.analyses||[]).forEach(a=>{html+=`<p><strong>语法：</strong>${a.grammar}<br><strong>功能：</strong>${a.role}<br><strong>意义：</strong>${a.meaning}</p>`});
    if(item.examples&&item.examples.length){
      html+=`<strong>相关例子：</strong>`;
      item.examples.forEach(ex=>{html+=`<div class="analysis-example">${ex.sentence}<br>${ex.translation}<br><span class="muted">${ex.tip||""}</span></div>`});
    }
    html+=`</div>`;
  }else{
    html+=`<div class="analysis-warning"><h3>一、本站例子库未收录</h3>没有找到这个词形的已核校例子记录。请继续看规则提示，并建议查外部词典。</div>`;
  }
  if(guesses.length){
    html+=`<div class="analysis-warning"><h3>二、词尾规则提示</h3><strong>以下只是可能性，不是最终结论。</strong>`;
    guesses.forEach(g=>{html+=`<p><strong>可能语法：</strong>${g.grammar}<br><strong>可能功能：</strong>${g.role}<br><strong>提示：</strong>${g.meaning}</p>`});
    html+=`</div>`;
  }
  html+=`<div class="analysis-warning"><h3>三、下一步建议</h3><ol><li>先观察本站例子库是否有同形解析。</li><li>再观察词尾规则提示。</li><li>尝试还原词典形。</li><li>最后到外部词典交叉查询。</li></ol></div>`;
  
  panel.innerHTML=html;
  bindLemmaButtons();
}
function analyzeSelectedText(){analyzePaliToken(window.getSelection?window.getSelection().toString():"");}
function analyzeAndLookup(){
  const word=normalizeTokenForAnalysis($("paliLookupInput")?.value || (window.getSelection?window.getSelection().toString():""));
  analyzePaliToken(word);
  if(word)lookupToken(word);
}


function getAllPaliLocalStorage(){
  const data={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith("pali")) data[k]=localStorage.getItem(k);
  }
  return data;
}
function countObj(o){return o&&typeof o==="object"?Object.keys(o).length:0}
function renderProgressSummary(){
  const box=$("progressSummaryBox");
  if(!box)return;
  let lessons={}, wrong={}, sent={}, lookup=[];
  try{lessons=JSON.parse(localStorage.getItem(STATUS_KEY)||"{}")}catch{}
  try{wrong=JSON.parse(localStorage.getItem(WRONG_KEY)||"{}")}catch{}
  try{sent=JSON.parse(localStorage.getItem("pali_sentence_analysis_status_v1")||"{}")}catch{}
  try{lookup=JSON.parse(localStorage.getItem("pali_lookup_history_v1")||"[]")}catch{}
  const mastered=Object.values(lessons).filter(x=>x==="已掌握").length;
  const reviewLessons=Object.values(lessons).filter(x=>x==="需复习").length;
  const sentMastered=Object.values(sent).filter(x=>x==="已掌握").length;
  const sentReview=Object.values(sent).filter(x=>x==="需复习").length;
  box.innerHTML=`<strong>当前学习进度</strong><br>
    语法点已标记：${countObj(lessons)}｜已掌握：${mastered}｜需复习：${reviewLessons}<br>
    错题：${countObj(wrong)}<br>
    句子分析已标记：${countObj(sent)}｜已掌握：${sentMastered}｜需复习：${sentReview}<br>
    最近查词：${lookup.length}`;
  const fb=$("feedbackTemplateText");
  if(fb&&!fb.value) fb.value=makeFeedbackTemplate();
}
function exportProgress(){
  const payload={version:VERSION, exported_at:new Date().toISOString(), localStorage:getAllPaliLocalStorage()};
  const text=JSON.stringify(payload,null,2);
  if($("progressDataText"))$("progressDataText").value=text;
  navigator.clipboard?.writeText(text).then(()=>alert("学习进度已导出并复制。")).catch(()=>alert("学习进度已导出到文本框。"));
}
function importProgress(){
  const text=($("progressDataText")?.value||"").trim();
  if(!text)return alert("请先粘贴导出的学习进度 JSON。");
  try{
    const payload=JSON.parse(text);
    const data=payload.localStorage||payload;
    Object.keys(data).forEach(k=>{if(k.startsWith("pali"))localStorage.setItem(k,data[k])});
    alert("学习进度已导入。页面将重新加载。");
    location.reload();
  }catch(e){alert("导入失败：JSON 格式不正确。")}
}
function clearProgress(){
  if(!confirm("确定清空本浏览器中的学习状态、错题、句子标记和查词历史吗？"))return;
  Object.keys(localStorage).forEach(k=>{if(k.startsWith("pali"))localStorage.removeItem(k)});
  renderProgressSummary();stats();renderWrong();
  alert("已清空本地学习进度。");
}
function makeFeedbackTemplate(){
  const title=currentLesson?currentLesson.title:"";
  const selected=window.getSelection?window.getSelection().toString():"";
  return `【巴利语学习网站错误反馈】
版本：Pāli Learning Lab ${VERSION}
问题位置：${title||"请填写语法点/句子/查词页面"}
涉及内容：${selected||"请粘贴有问题的原文或截图说明"}
问题类型：语法错误 / 翻译问题 / 例子不自然 / 词形分析不准 / 页面功能问题
具体说明：
建议修改：`;
}
async function copyFeedbackTemplate(){
  const text=makeFeedbackTemplate();
  if($("feedbackTemplateText"))$("feedbackTemplateText").value=text;
  try{await navigator.clipboard.writeText(text);alert("反馈模板已复制。")}catch{alert("反馈模板已生成，请手动复制。")}
}
function copyCurrentLessonFeedback(){copyFeedbackTemplate();}



const TRIAL_TASK_KEY="pali_trial_tasks_v1";
const TRIAL_TASKS=[
  ["route","完成零基础路线第1步","进入“零基础路线”，打开“认识字母与转写”。"],
  ["lesson","学习1个语法点","打开任意一个语法点，阅读学习目标、说明、例子和易错点。"],
  ["exercise","完成10道练习","进入“课程练习”，完成一组10题练习。"],
  ["sentence","分析3个句子","进入“句子分析”，至少完成3个句子的“先自测—提示—完整分析”。"],
  ["lookup","查1个巴利语单词","进入“查巴利语单词”，输入并复制一个词，再打开巴利字典。"],
  ["token","分析1个词形","在查词页输入 dhammaṃ / Buddhassa / sutvā 等，点击“词形分析”。"],
  ["wrong","查看错题或需复习内容","进入“错题复习”或“句子分析→只观察需复习”。"],
  ["feedback","复制1次反馈模板","进入“学习进度备份”，复制错误反馈模板。"]
];
function getTrialTaskState(){
  try{return JSON.parse(localStorage.getItem(TRIAL_TASK_KEY))||{}}catch{return {}}
}
function saveTrialTaskState(s){
  localStorage.setItem(TRIAL_TASK_KEY,JSON.stringify(s));
}
function renderTrialTasks(){
  const list=$("trialTaskList"), summary=$("trialTaskSummary");
  if(!list||!summary)return;
  const state=getTrialTaskState();
  const done=TRIAL_TASKS.filter(t=>state[t[0]]).length;
  summary.innerHTML=`<strong>试用进度：</strong>${done}/${TRIAL_TASKS.length} 项已完成。`;
  list.innerHTML="";
  TRIAL_TASKS.forEach(([id,title,desc])=>{
    const div=document.createElement("div");
    div.className="trial-task";
    div.innerHTML=`<label><input type="checkbox" data-trial-task="${id}" ${state[id]?"checked":""}>${title}</label><small>${desc}</small>`;
    list.appendChild(div);
  });
  document.querySelectorAll("[data-trial-task]").forEach(ch=>{
    ch.onchange=()=>{
      const s=getTrialTaskState();
      s[ch.dataset.trialTask]=ch.checked;
      saveTrialTaskState(s);
      renderTrialTasks();
    };
  });
  const fb=$("trialFeedbackText");
  if(fb&&!fb.value)fb.value=makeTrialFeedback();
}
function resetTrialTasks(){
  localStorage.removeItem(TRIAL_TASK_KEY);
  if($("trialFeedbackText"))$("trialFeedbackText").value="";
  renderTrialTasks();
}
function makeTrialFeedback(){
  const state=getTrialTaskState();
  const done=TRIAL_TASKS.filter(t=>state[t[0]]).map(t=>t[1]);
  const undone=TRIAL_TASKS.filter(t=>!state[t[0]]).map(t=>t[1]);
  return `【巴利语学习网站试用反馈】
版本：Pāli Learning Lab ${VERSION}
已完成任务：${done.length?done.join("；"):"无"}
未完成任务：${undone.length?undone.join("；"):"无"}
使用设备：手机 / 电脑 / 平板
最容易使用的功能：
最不清楚的地方：
发现的错误或问题：
建议修改：`;
}
async function copyTrialFeedback(){
  const text=makeTrialFeedback();
  if($("trialFeedbackText"))$("trialFeedbackText").value=text;
  try{await navigator.clipboard.writeText(text);alert("试用反馈模板已复制。")}catch{alert("模板已生成，请手动复制。")}
}


function contentPolishHTML(lesson){
  if(!lesson)return "";
  let html="";
  if(lesson.study_tier){
    const cls=lesson.study_tier==="必学"?"tier-required":(lesson.study_tier==="进阶"?"tier-advanced":"tier-optional");
    html+=`<div class="content-tier-box ${cls}"><strong>学习层级：</strong>${lesson.study_tier}</div>`;
  }
  if(lesson.minimal_mastery&&lesson.minimal_mastery.length){
    html+=`<div class="minimal-mastery-box"><strong>本课最小掌握：</strong><ol>${lesson.minimal_mastery.map(x=>`<li>${x}</li>`).join("")}</ol></div>`;
  }
  const targeted=(lesson.common_misjudgments||[]).filter(r=>{
    const text=[r.wrong,r.right,r.note].join(" ");
    return !["本课只要求","后面才学习","权威核查","Pali Primer","Language Guide","不在本课要求范围"].some(w=>text.includes(w));
  }).slice(0,3);
  if(targeted.length){
    html+=`<div class="misjudge-box"><strong>本课常见误判：</strong><table><tr><td>容易误判</td><td>较稳妥判断</td><td>说明</td></tr>${targeted.map(r=>`<tr><td>${r.wrong}</td><td>${r.right}</td><td>${r.note}</td></tr>`).join("")}</table></div>`;
  }
  return html;
}
function exampleHTML(a){
  let html=`<div class="pali">${a.pali||""}</div>`;
  if(a.literal_cn||a.natural_cn||a.grammar_note){
    html+=`<div class="translation-layer">`;
    if(a.literal_cn)html+=`<p><strong>直译：</strong>${a.literal_cn}</p>`;
    if(a.natural_cn)html+=`<p><strong>翻译：</strong>${a.natural_cn}</p>`;
    if(a.grammar_note)html+=`<p><strong>语法说明：</strong>${a.grammar_note}</p>`;
    html+=`</div>`;
  }else{
    html+=`<div>${a.cn||""}</div><div class="muted">${a.note||""}</div>`;
  }
  return html;
}


function renderModuleGuides(){
  const box=$("moduleGuideList");
  if(!box)return;
  box.innerHTML="";
  (window.MODULE_GUIDES||[]).forEach(g=>{
    const div=document.createElement("div");
    div.className="module-guide-card";
    div.innerHTML=`
      <h3>${g.module}</h3>
      <p><strong>学习目标：</strong>${g.goal}</p>
      <p><strong>必会内容：</strong>${(g.must_know||[]).join("、")}</p>
      <p><strong>学习方法：</strong></p>
      <ol>${(g.how_to_learn||[]).map(x=>`<li>${x}</li>`).join("")}</ol>
      <div class="module-warning"><strong>提醒：</strong>${g.warning}</div>
      <button class="route-lesson-btn" data-module-guide-open="${g.module}">进入这个模块</button>
    `;
    box.appendChild(div);
  });
  document.querySelectorAll("[data-module-guide-open]").forEach(btn=>{
    btn.onclick=()=>{openModule(btn.dataset.moduleGuideOpen);};
  });
}
function lessonStudyGuideHTML(lesson){
  if(!lesson)return "";
  const prereq=[...(lesson.prerequisites||[])].filter(Boolean);
  const checks=[...(lesson.self_check_questions||[])].filter(Boolean);
  const next=lesson.next_step_advice||"";
  if(!prereq.length&&!checks.length&&!next)return "";
  let html=`<div class="lesson-guide-box compact-lesson-guide"><strong>学习提示：</strong>`;
  if(prereq.length){
    html+=`<div class="guide-subblock"><b>课前预备</b><ol>${prereq.map(x=>`<li>${x}</li>`).join("")}</ol></div>`;
  }
  if(checks.length){
    html+=`<div class="guide-subblock"><b>课后自检</b><ol>${checks.map(x=>`<li>${x}</li>`).join("")}</ol></div>`;
  }
  if(next){
    html+=`<div class="guide-subblock next-step"><b>下一步建议</b><p>${next}</p></div>`;
  }
  html+=`</div>`;
  return html;
}


function renderConfusionPairs(){
  const box=$("confusionPairsList");
  if(!box)return;
  const q=($("confusionSearchInput")?.value||"").trim().toLowerCase();
  const items=(window.CONFUSION_PAIRS||[]).filter(p=>{
    const text=[p.title,p.a,p.b,p.core,p.a_cue,p.b_cue,p.tip,...(p.examples||[]).map(e=>e.pali+" "+e.cn+" "+e.note)].join(" ").toLowerCase();
    return !q||text.includes(q);
  });
  box.innerHTML=items.length?"":"<p class='muted'>没有找到相关对照。</p>";
  items.forEach(p=>{
    const div=document.createElement("div");
    div.className="confusion-card";
    div.innerHTML=`
      <h3>${p.title}</h3>
      <p><strong>核心区别：</strong>${p.core}</p>
      <div class="confusion-two-col">
        <div><strong>${p.a}</strong><br><span>${p.a_cue}</span></div>
        <div><strong>${p.b}</strong><br><span>${p.b_cue}</span></div>
      </div>
      <div class="confusion-examples">
        ${(p.examples||[]).map(e=>`<div class="analysis-example"><strong>${e.pali}</strong><br>${e.cn}<br><span class="muted">${e.note}</span></div>`).join("")}
      </div>
      <div class="module-warning"><strong>学习提示：</strong>${p.tip}</div>
    `;
    box.appendChild(div);
  });
}
function linkedConfusionHTML(lesson){
  if(!lesson||!lesson.linked_confusions||!lesson.linked_confusions.length)return "";
  const pairs=(window.CONFUSION_PAIRS||[]).filter(p=>lesson.linked_confusions.includes(p.id));
  if(!pairs.length)return "";
  return `<div class="linked-confusion-box"><strong>相关易混概念：</strong><br>${pairs.map(p=>`<button class="confusion-link-btn" data-confusion-id="${p.id}">${p.title}</button>`).join("")}</div>`;
}
function bindConfusionButtons(){
  document.querySelectorAll("[data-confusion-id]").forEach(btn=>{
    btn.onclick=()=>{
      switchView("confusionPairsView");
      if($("confusionSearchInput"))$("confusionSearchInput").value=btn.textContent;
      renderConfusionPairs();
    };
  });
}


function renderSentencePatterns(){
  const box=$("sentencePatternList");
  if(!box)return;
  const q=($("patternSearchInput")?.value||"").trim().toLowerCase();
  const level=$("patternLevelSelect")?.value||"全部";
  const items=(window.SENTENCE_PATTERNS||[]).filter(p=>{
    const text=[p.title,p.level,p.formula,p.function,p.trap,...(p.signals||[]),...(p.examples||[]).map(e=>e.pali+" "+e.natural+" "+e.note)].join(" ").toLowerCase();
    return (level==="全部"||p.level===level)&&(!q||text.includes(q));
  });
  box.innerHTML=items.length?"":"<p class='muted'>没有找到相关句型。</p>";
  items.forEach(p=>{
    const div=document.createElement("div");
    div.className="pattern-card";
    div.innerHTML=`
      <span class="pattern-level ${p.level==='必学'?'tier-required':(p.level==='进阶'?'tier-advanced':'tier-optional')}">${p.level}</span>
      <h3>${p.title}</h3>
      <p><strong>句型公式：</strong>${p.formula}</p>
      <p><strong>功能：</strong>${p.function}</p>
      <p><strong>识别线索：</strong>${(p.signals||[]).join("；")}</p>
      <div class="pattern-steps"><strong>分析步骤：</strong><ol>${(p.steps||[]).map(x=>`<li>${x}</li>`).join("")}</ol></div>
      <div class="pattern-examples">${(p.examples||[]).map(e=>`
        <div class="analysis-example">
          <strong>${e.pali}</strong><br>
          <span><strong>直译：</strong>${e.literal}</span><br>
          <span><strong>翻译：</strong>${e.natural}</span><br>
          <span class="muted">${e.note}</span>
        </div>`).join("")}</div>
      <div class="module-warning"><strong>易错提醒：</strong>${p.trap}</div>
    `;
    box.appendChild(div);
  });
}
function linkedPatternHTML(lesson){
  if(!lesson||!lesson.linked_patterns||!lesson.linked_patterns.length)return "";
  const patterns=(window.SENTENCE_PATTERNS||[]).filter(p=>lesson.linked_patterns.includes(p.id));
  if(!patterns.length)return "";
  return `<div class="linked-pattern-box"><strong>相关句型模板：</strong><br>${patterns.map(p=>`<button class="pattern-link-btn" data-pattern-id="${p.id}">${p.title}</button>`).join("")}</div>`;
}
function bindPatternButtons(){
  document.querySelectorAll("[data-pattern-id]").forEach(btn=>{
    btn.onclick=()=>{
      const p=(window.SENTENCE_PATTERNS||[]).find(x=>x.id===btn.dataset.patternId);
      switchView("sentencePatternsView");
      if($("patternSearchInput"))$("patternSearchInput").value=p?p.title:btn.textContent;
      if($("patternLevelSelect"))$("patternLevelSelect").value="全部";
      renderSentencePatterns();
    };
  });
}


function buddhistReadingCategories(){
  return ["全部", ...new Set((window.BUDDHIST_READING_PATTERNS||[]).map(x=>x.category))];
}
function renderBuddhistReadingCategories(){
  const sel=$("buddhistReadingCategorySelect");
  if(!sel)return;
  sel.innerHTML="";
  buddhistReadingCategories().forEach(c=>{
    const o=document.createElement("option");
    o.value=c;o.textContent=c;sel.appendChild(o);
  });
}
function renderBuddhistReading(){
  const box=$("buddhistReadingList");
  if(!box)return;
  const q=($("buddhistReadingSearchInput")?.value||"").trim().toLowerCase();
  const cat=$("buddhistReadingCategorySelect")?.value||"全部";
  const level=$("buddhistReadingLevelSelect")?.value||"全部";
  const items=(window.BUDDHIST_READING_PATTERNS||[]).filter(p=>{
    const text=[p.title,p.category,p.level,p.formula,p.literal,p.natural,p.structure,p.warning,...(p.keywords||[]).map(k=>k.word+" "+k.note),...(p.related_grammar||[])].join(" ").toLowerCase();
    return (cat==="全部"||p.category===cat)&&(level==="全部"||p.level===level)&&(!q||text.includes(q));
  });
  box.innerHTML=items.length?"":"<p class='muted'>没有找到相关佛典句式。</p>";
  items.forEach(p=>{
    const div=document.createElement("div");
    div.className="buddhist-reading-card";
    div.innerHTML=`
      <span class="pattern-level ${p.level==='必学'?'tier-required':(p.level==='进阶'?'tier-advanced':'tier-optional')}">${p.level}</span>
      <span class="reading-category">${p.category}</span>
      <h3>${p.title}</h3>
      <p><strong>结构公式：</strong>${p.formula}</p>
      <div class="translation-layer">
        <p><strong>直译：</strong>${p.literal}</p>
        <p><strong>翻译：</strong>${p.natural}</p>
        <p><strong>结构说明：</strong>${p.structure}</p>
      </div>
      <div class="keyword-list"><strong>关键词：</strong><br>${(p.keywords||[]).map(k=>`<span class="keyword-chip">${k.word}：${k.note}</span>`).join("")}</div>
      <div class="module-warning"><strong>易错提醒：</strong>${p.warning}</div>
      <p><strong>相关语法点：</strong>${(p.related_grammar||[]).join("、")}</p>
    `;
    box.appendChild(div);
  });
}
function linkedBuddhistReadingHTML(lesson){
  if(!lesson||!lesson.linked_buddhist_reading||!lesson.linked_buddhist_reading.length)return "";
  const items=(window.BUDDHIST_READING_PATTERNS||[]).filter(p=>lesson.linked_buddhist_reading.includes(p.id));
  if(!items.length)return "";
  return `<div class="linked-buddhist-box"><strong>相关佛典阅读句式：</strong><br>${items.map(p=>`<button class="buddhist-link-btn" data-buddhist-id="${p.id}">${p.title}</button>`).join("")}</div>`;
}
function bindBuddhistButtons(){
  document.querySelectorAll("[data-buddhist-id]").forEach(btn=>{
    btn.onclick=()=>{
      const p=(window.BUDDHIST_READING_PATTERNS||[]).find(x=>x.id===btn.dataset.buddhistId);
      switchView("buddhistReadingView");
      renderBuddhistReadingCategories();
      if($("buddhistReadingSearchInput"))$("buddhistReadingSearchInput").value=p?p.title:btn.textContent;
      if($("buddhistReadingCategorySelect"))$("buddhistReadingCategorySelect").value="全部";
      if($("buddhistReadingLevelSelect"))$("buddhistReadingLevelSelect").value="全部";
      renderBuddhistReading();
    };
  });
}


let buddhistBackgroundTab="concepts";
function renderBuddhistBackground(tab){
  if(tab)buddhistBackgroundTab=tab;
  const box=$("buddhistBackgroundContent");
  if(!box)return;
  const data=window.BUDDHIST_BACKGROUND_DATA||{};
  const tabNow=buddhistBackgroundTab;
  document.querySelectorAll(".bg-tab").forEach(btn=>btn.classList.toggle("primary", btn.dataset.bgTab===tabNow));
  if(tabNow==="concepts"){
    box.innerHTML=`
      <h3>佛学概念小词典</h3>
      <p class="muted">只提供阅读入门所需的最小解释，避免展开复杂义理争论。</p>
      <label>搜索概念</label>
      <input id="conceptSearchInput" placeholder="例如 dhamma, dukkha, kamma, nibbāna, sati" />
      <label>选择类别</label>
      <select id="conceptCategorySelect"></select>
      <div id="conceptList" class="concept-list"></div>
    `;
    renderConceptCategories();
    renderConceptList();
    $("conceptSearchInput").oninput=renderConceptList;
    $("conceptCategorySelect").onchange=renderConceptList;
  }
  if(tabNow==="canon"){
    box.innerHTML=`<h3>巴利三藏结构与常见略号</h3><div class="canon-list">${(data.canon_structure||[]).map(sec=>`
      <div class="canon-card">
        <h3>${sec.title}</h3>
        <p>${sec.explanation}</p>
        <table><tr><td>略号/术语</td><td>名称</td><td>说明</td></tr>${(sec.items||[]).map(i=>`<tr><td><strong>${i.abbr}</strong></td><td>${i.name}</td><td>${i.note}</td></tr>`).join("")}</table>
      </div>`).join("")}</div>`;
  }
  if(tabNow==="refs"){
    box.innerHTML=`
      <h3>章节术语与引用格式</h3>
      <div class="canon-card">
        <h3>章节术语</h3>
        <table><tr><td>术语</td><td>常见汉译</td><td>说明</td></tr>${(data.reference_terms||[]).map(t=>`<tr><td><strong>${t.term}</strong></td><td>${t.cn}</td><td>${t.note}</td></tr>`).join("")}</table>
      </div>
      <div class="canon-card">
        <h3>引用格式怎么看</h3>
        <table><tr><td>格式</td><td>含义</td></tr>${(data.citation_examples||[]).map(r=>`<tr><td><strong>${r.ref}</strong></td><td>${r.meaning}</td></tr>`).join("")}</table>
      </div>`;
  }
  if(tabNow==="flow"){
    box.innerHTML=`<h3>佛经常见篇章结构</h3><p class="muted">并非每篇经都完整包含这些部分，但很多散文经会呈现类似推进方式。</p><div class="flow-list">${(data.sutta_flow||[]).map((s,idx)=>`
      <div class="flow-card">
        <span class="pattern-level tier-optional">${idx+1}</span>
        <h3>${s.stage}</h3>
        <p><strong>常见表达：</strong>${(s.patterns||[]).join("；")}</p>
        <p>${s.purpose}</p>
      </div>`).join("")}</div>`;
  }
}
function conceptCategories(){
  const data=window.BUDDHIST_BACKGROUND_DATA||{};
  return ["全部", ...new Set((data.concepts||[]).map(x=>x.category))];
}
function renderConceptCategories(){
  const sel=$("conceptCategorySelect");
  if(!sel)return;
  sel.innerHTML="";
  conceptCategories().forEach(c=>{
    const o=document.createElement("option");
    o.value=c;o.textContent=c;sel.appendChild(o);
  });
}
function renderConceptList(){
  const box=$("conceptList");
  if(!box)return;
  const data=window.BUDDHIST_BACKGROUND_DATA||{};
  const q=($("conceptSearchInput")?.value||"").trim().toLowerCase();
  const cat=$("conceptCategorySelect")?.value||"全部";
  const items=(data.concepts||[]).filter(c=>{
    const text=[c.pali,c.cn,c.en,c.category,c.basic,c.reading_tip,c.example,...(c.related||[])].join(" ").toLowerCase();
    return (cat==="全部"||c.category===cat)&&(!q||text.includes(q));
  });
  box.innerHTML=items.length?"":"<p class='muted'>没有找到相关概念。</p>";
  items.forEach(c=>{
    const div=document.createElement("div");
    div.className="concept-card";
    div.innerHTML=`
      <span class="pattern-level ${c.level==='必学'?'tier-required':(c.level==='进阶'?'tier-advanced':'tier-optional')}">${c.level}</span>
      <span class="reading-category">${c.category}</span>
      <h3>${c.pali} ｜ ${c.cn}</h3>
      <p><strong>英文参考：</strong>${c.en}</p>
      <p><strong>基础解释：</strong>${c.basic}</p>
      <p><strong>阅读提醒：</strong>${c.reading_tip}</p>
      <div class="analysis-example"><strong>例子：</strong>${c.example}</div>
      <p><strong>相关：</strong>${(c.related||[]).join("、")}</p>
    `;
    box.appendChild(div);
  });
}
function linkedBuddhistBackgroundHTML(lesson){
  if(!lesson||!lesson.linked_buddhist_background||!lesson.linked_buddhist_background.length)return "";
  const scope=[lesson.title,lesson.module,lesson.category,lesson.summary].join(" ");
  const relevant=["佛典","佛经","三藏","引用格式","篇章结构","原典引用"].some(k=>scope.includes(k));
  if(!relevant)return "";
  const labels={concepts:"佛学概念小词典",canon:"三藏结构与略号",refs:"章节术语与引用格式",flow:"佛经篇章结构"};
  return `<div class="linked-background-box"><strong>相关佛典背景知识：</strong><br>${lesson.linked_buddhist_background.map(k=>`<button class="background-link-btn" data-bg-open="${k}">${labels[k]||k}</button>`).join("")}</div>`;
}
function bindBackgroundButtons(){
  document.querySelectorAll("[data-bg-open]").forEach(btn=>{
    btn.onclick=()=>{switchView("buddhistBackgroundView");renderBuddhistBackground(btn.dataset.bgOpen);};
  });
}


let academicTrainingTab="method";
function renderAcademicTraining(tab){
  if(tab)academicTrainingTab=tab;
  const box=$("academicTrainingContent");
  if(!box)return;
  const data=window.ACADEMIC_TRAINING_DATA||{};
  const tabNow=academicTrainingTab;
  document.querySelectorAll(".academic-tab").forEach(btn=>btn.classList.toggle("primary", btn.dataset.academicTab===tabNow));

  if(tabNow==="method"){
    box.innerHTML=`<h3>原文阅读方法</h3><p class="muted">重点不是“看懂大意”，而是把原文处理成可阅读材料。</p>
    <div class="academic-list">${(data.method||[]).map(m=>`
      <div class="academic-card">
        <span class="pattern-level ${m.level==='必学'?'tier-required':'tier-optional'}">${m.level}</span>
        <h3>${m.title}</h3>
        <p><strong>训练目标：</strong>${m.goal}</p>
        <ol>${(m.steps||[]).map(s=>`<li>${s}</li>`).join("")}</ol>
        <div class="academic-example">
          <strong>示例记录</strong>
          <p><strong>原文：</strong>${m.example.source}</p>
          <p><strong>直译：</strong>${m.example.literal}</p>
          <p><strong>翻译：</strong>${m.example.natural}</p>
          <p><strong>语法点：</strong>${m.example.grammar}</p>
          <p><strong>阅读类型：</strong>${m.example.type}</p>
          <p><strong>阅读提醒：</strong>${m.example.research_note}</p>
        </div>
      </div>`).join("")}</div>`;
  }

  if(tabNow==="citation"){
    const c=data.citation||{};
    box.innerHTML=`<h3>原典引用与学术规范</h3>
    <div class="academic-list">${(c.principles||[]).map(p=>`
      <div class="academic-card"><h3>${p.title}</h3><p>${p.content}</p></div>`).join("")}</div>
    <div class="academic-card">
      <h3>常见引用格式</h3>
      <table><tr><td>格式</td><td>含义</td></tr>${(c.citation_examples||[]).map(e=>`<tr><td><strong>${e.format}</strong></td><td>${e.meaning}</td></tr>`).join("")}</table>
    </div>
    <div class="academic-card">
      <h3>材料记录模板</h3>
      <pre>${(c.record_template||[]).join("\\n")}</pre>
      <button class="secondary" onclick="copyAcademicTemplate('citation')">复制模板</button>
    </div>`;
  }

  if(tabNow==="vocabulary"){
    box.innerHTML=`<h3>巴利词义观察入门</h3><p class="muted">一个词的研究不能只靠词典义，要观察词形、搭配和上下文。</p>
    <div class="academic-list">${(data.vocabulary||[]).map(v=>`
      <div class="academic-card">
        <h3>${v.title}</h3>
        <div class="module-warning"><strong>核心提醒：</strong>${v.core_warning}</div>
        <ol>${(v.steps||[]).map(s=>`<li>${s}</li>`).join("")}</ol>
        <table><tr><td>例子</td><td>用法判断</td></tr>${(v.sample_records||[]).map(r=>`<tr><td>${r.pali}</td><td>${r.use}</td></tr>`).join("")}</table>
      </div>`).join("")}</div>`;
  }

  if(tabNow==="analysis"){
    const t=data.analysis_template||{};
    box.innerHTML=`<h3>${t.title}</h3>
    <div class="academic-card">
      <table><tr><td>项目</td><td>说明</td></tr>${(t.fields||[]).map(f=>`<tr><td><strong>${f.name}</strong></td><td>${f.tip}</td></tr>`).join("")}</table>
      <button class="secondary" onclick="copyAcademicTemplate('analysis')">复制原文记录模板</button>
    </div>
    <div class="academic-card">
      <h3>示例分析</h3>
      <p><strong>原文：</strong>${t.example.source}</p>
      <p><strong>词形分析：</strong>${t.example.word_form}</p>
      <p><strong>句法功能：</strong>${t.example.syntax}</p>
      <p><strong>语义结构：</strong>${t.example.semantic}</p>
      <p><strong>结构类型：</strong>${t.example.type}</p>
      <p><strong>翻译选择：</strong>${t.example.translation}</p>
      <p><strong>可能误判：</strong>${t.example.pitfall}</p>
      <p><strong>阅读价值：</strong>${t.example.research_value}</p>
    </div>`;
  }

  if(tabNow==="tasks"){
    box.innerHTML=`<h3>小型阅读任务</h3><p class="muted">任务型训练用于把语言学习推进到阅读能力训练。</p>
    <div class="academic-list">${(data.research_tasks||[]).map(t=>`
      <div class="academic-card">
        <span class="pattern-level ${t.level==='入门'?'tier-required':'tier-advanced'}">${t.level}</span>
        <h3>${t.title}</h3>
        <p><strong>任务目标：</strong>${t.goal}</p>
        <ol>${(t.steps||[]).map(s=>`<li>${s}</li>`).join("")}</ol>
        <div class="academic-output"><strong>提交形式：</strong>${t.output}</div>
      </div>`).join("")}</div>`;
  }

  if(tabNow==="pitfalls"){
    box.innerHTML=`<h3>阅读与引用常见误区</h3>
    <div class="academic-list">${(data.pitfalls||[]).map((p,i)=>`
      <div class="academic-card">
        <h3>${i+1}. ${p.title}</h3>
        <p><strong>修正方法：</strong>${p.fix}</p>
      </div>`).join("")}</div>`;
  }
}
function academicTemplateText(kind){
  const data=window.ACADEMIC_TRAINING_DATA||{};
  if(kind==="citation"){
    return (data.citation?.record_template||[]).join("\\n");
  }
  if(kind==="analysis"){
    const fields=data.analysis_template?.fields||[];
    return fields.map(f=>`${f.name}：`).join("\\n");
  }
  return "";
}
async function copyAcademicTemplate(kind){
  const text=academicTemplateText(kind);
  try{await navigator.clipboard.writeText(text);alert("模板已复制。")}catch{alert(text)}
}
function linkedAcademicTrainingHTML(lesson){
  if(!lesson||!lesson.linked_academic_training||!lesson.linked_academic_training.length)return "";
  const scope=[lesson.title,lesson.module,lesson.category,lesson.summary].join(" ");
  const relevant=["学术","研究","原典","引用规范","引用格式","词义观察","阅读材料"].some(k=>scope.includes(k));
  if(!relevant)return "";
  const labels={method:"原文阅读方法",citation:"原典引用规范",vocabulary:"巴利词义观察",analysis:"学术原文记录模板",tasks:"小型阅读任务",pitfalls:"阅读误区"};
  return `<div class="linked-academic-box"><strong>相关佛典阅读：</strong><br>${lesson.linked_academic_training.map(k=>`<button class="academic-link-btn" data-academic-open="${k}">${labels[k]||k}</button>`).join("")}</div>`;
}
function bindAcademicButtons(){
  document.querySelectorAll("[data-academic-open]").forEach(btn=>{
    btn.onclick=()=>{switchView("academicTrainingView");renderAcademicTraining(btn.dataset.academicOpen);};
  });
}


function termCategories(){
  return ["全部", ...new Set((window.TERMINOLOGY_GLOSSARY||[]).map(x=>x.cat))];
}
function renderTermCategories(){
  const sel=$("termCategorySelect");
  if(!sel)return;
  const old=sel.value||"全部";
  sel.innerHTML="";
  termCategories().forEach(c=>{
    const o=document.createElement("option");
    o.value=c;o.textContent=c;sel.appendChild(o);
  });
  if([...sel.options].some(o=>o.value===old))sel.value=old;
}
function renderTerminologyGlossary(){
  const box=$("termGlossaryList");
  if(!box)return;
  const q=($("termSearchInput")?.value||"").trim().toLowerCase();
  const cat=$("termCategorySelect")?.value||"全部";
  const items=(window.TERMINOLOGY_GLOSSARY||[]).filter(t=>{
    const text=[t.cat,t.en,t.ipa,t.cn,t.pali,t.note].join(" ").toLowerCase();
    return (cat==="全部"||t.cat===cat)&&(!q||text.includes(q));
  });
  box.innerHTML=items.length?"":"<p class='muted'>没有找到相关术语。</p>";
  items.forEach(t=>{
    const details=document.createElement("details");
    details.className="term-card";
    details.innerHTML=`
      <summary>
        <span class="term-en">${t.en}</span>
        <span class="term-cn">${t.cn}</span>
        <span class="term-cat">${t.cat}</span>
      </summary>
      <div class="term-detail">
        <p><strong>英文：</strong>${t.en} <span class="ipa">${t.ipa}</span></p>
        <p><strong>中文：</strong>${t.cn}</p>
        <p><strong>巴利/传统术语：</strong>${t.pali}</p>
        <p><strong>说明：</strong>${t.note}</p>
      </div>
    `;
    box.appendChild(details);
  });
}
function linkedTerminologyHTML(lesson){
  if(!lesson)return "";
  const text=[lesson.title,lesson.summary,lesson.module,lesson.category,...(lesson.explanation||[])].join(" ").toLowerCase();
  const terms=(window.TERMINOLOGY_GLOSSARY||[]).filter(t=>{
    const keys=[t.en.toLowerCase(),t.cn.toLowerCase(),String(t.pali||"").toLowerCase()];
    return keys.some(k=>k&&k.length>2&&text.includes(k));
  }).slice(0,6);
  if(!terms.length)return "";
  return `<div class="linked-term-box"><strong>相关术语：</strong><br>${terms.map(t=>`<button class="term-link-btn" data-term-open="${t.en}">${t.en} / ${t.cn}</button>`).join("")}</div>`;
}
function bindTermButtons(){
  document.querySelectorAll("[data-term-open]").forEach(btn=>{
    btn.onclick=()=>{
      switchView("terminologyGlossaryView");
      renderTermCategories();
      if($("termSearchInput"))$("termSearchInput").value=btn.dataset.termOpen;
      if($("termCategorySelect"))$("termCategorySelect").value="全部";
      renderTerminologyGlossary();
    };
  });
}

async function init(){
  GRAMMAR=[];
  renderModules();renderSelect();renderWrong();search('');renderTraining();stats();

  if(typeof renderSentenceLevels==="function")renderSentenceLevels();
  if(typeof renderLinguisticsCategories==="function")renderLinguisticsCategories();
  if(typeof renderLinguisticsTips==="function")renderLinguisticsTips();
  if(typeof renderLearningRoutes==="function")renderLearningRoutes();
  if(typeof renderDictionarySites==="function")renderDictionarySites();
  if(typeof renderLookupHistory==="function")renderLookupHistory();
  if(typeof renderSiteHealth==="function")renderSiteHealth();
  if(typeof renderVersionStatus==="function")renderVersionStatus();
  if(typeof renderProgressSummary==="function")renderProgressSummary();
  if(typeof renderModuleGuides==="function")renderModuleGuides();

  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{
    let a=b.dataset.action;
    if(a==='modules'){renderModules();switchView('moduleLearningView')}
    else if(a==='search')switchView('searchView');
    else if(a==='exercise')switchView('exerciseCenterView');
    else if(a==='training'){renderTraining();switchView('trainingView')}
    else if(a==='wrong'){renderWrong();switchView('wrongView')}
    else if(a==='learningRoute'){renderLearningRoutes();switchView('learningRouteView')}
    else if(a==='studentGuide')switchView('studentGuideView');
    else if(a==='dictionaryLookup'){renderDictionarySites();renderLookupHistory();switchView('dictionaryLookupView')}
    else if(a==='sentenceAnalysis'){renderSentenceLevels();switchView('sentenceAnalysisView')}
    else if(a==='sentencePatterns'){renderSentencePatterns();switchView('sentencePatternsView')}
    else if(a==='buddhistReading'){renderBuddhistReadingCategories();renderBuddhistReading();switchView('buddhistReadingView')}
    else if(a==='buddhistBackground'){renderBuddhistBackground('concepts');switchView('buddhistBackgroundView')}
    else if(a==='academicTraining'){renderAcademicTraining('method');switchView('academicTrainingView')}
    else if(a==='linguisticsTips'){renderLinguisticsCategories();renderLinguisticsTips();switchView('linguisticsTipsView')}
    else if(a==='terminologyGlossary'){renderTermCategories();renderTerminologyGlossary();switchView('terminologyGlossaryView')}
    else if(a==='learningProgress'){renderProgressSummary();switchView('learningProgressView')}
    else if(a==='moduleGuide'){renderModuleGuides();switchView('moduleGuideView')}
    else if(a==='confusionPairs'){renderConfusionPairs();switchView('confusionPairsView')}
    else if(a==='trialTasks'){renderTrialTasks();switchView('trialTasksView')}
    else if(a==='modules'){renderModules();switchView('moduleLearningView')}
    else switchView('homeView');
  });

  document.querySelectorAll('.back-home').forEach(b=>b.onclick=()=>switchView('homeView'));
  if($('backHomeFromListBtn'))$('backHomeFromListBtn').onclick=()=>switchView('homeView');
  if($('backToListBtn'))$('backToListBtn').onclick=()=>switchView(lastView==='searchView'?'searchView':'lessonListView');

  document.querySelectorAll('.status-btn').forEach(b=>b.onclick=()=>currentLesson&&setLStat(currentLesson.id,b.dataset.status));
  document.querySelectorAll('.filter-btn').forEach(b=>b.onclick=()=>{currentFilter=b.dataset.filter;document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderLessonList(currentModule)});
  if($('startCardsBtn'))$('startCardsBtn').onclick=()=>startCards(currentLesson.cards||[]);
  if($('showCardAnswerBtn'))$('showCardAnswerBtn').onclick=()=>{show('cardAnswer');hide('cardBeforeButtons');show('cardAfterButtons')};
  if($('cardKnowBtn'))$('cardKnowBtn').onclick=nextCard;
  if($('cardWrongBtn'))$('cardWrongBtn').onclick=nextCard;
  if($('exitCardsBtn'))$('exitCardsBtn').onclick=()=>hide('cardPanel');
  if($('startLessonExercisesBtn'))$('startLessonExercisesBtn').onclick=()=>startExercises((currentLesson.exercises||[]).map(ex=>({...ex,lesson_id:currentLesson.id,lesson_title:currentLesson.title,module:currentLesson.module})),'本课练习');
  if($('startMixedExercisesBtn'))$('startMixedExercisesBtn').onclick=()=>startExercises(shuffle(allEx($('exerciseModuleSelect').value)).slice(0,parseInt($('exerciseCountInput').value||'10')),'练习');
  if($('submitExerciseBtn'))$('submitExerciseBtn').onclick=submitExercise;
  if($('nextExerciseBtn'))$('nextExerciseBtn').onclick=nextEx;
  if($('exitExerciseBtn'))$('exitExerciseBtn').onclick=()=>hide('exercisePanel');
  document.querySelectorAll('#paliKeyboard button').forEach(b=>b.onclick=()=>{let i=$('exerciseInput'),ch=b.dataset.char,s=i.selectionStart||i.value.length,e=i.selectionEnd||i.value.length;i.value=i.value.slice(0,s)+ch+i.value.slice(e);i.focus();i.selectionStart=i.selectionEnd=s+ch.length});
  if($('startWrongBtn'))$('startWrongBtn').onclick=()=>startExercises(shuffle(Object.values(getW())),'错题复习');
  if($('clearWrongBtn'))$('clearWrongBtn').onclick=()=>{if(confirm('确定清空所有错题记录吗？')){saveW({});renderWrong()}};
  if($('searchInput'))$('searchInput').oninput=e=>search(e.target.value);

  if($('sentenceLevelSelect'))$('sentenceLevelSelect').onchange=renderSentenceSelect;
  if($('sentenceTagSelect'))$('sentenceTagSelect').onchange=renderSentenceSelect;
  if($('sentenceSourceSelect'))$('sentenceSourceSelect').onchange=renderSentenceSelect;
  if($('sentencePrioritySelect'))$('sentencePrioritySelect').onchange=renderSentenceSelect;
  if($('sentenceStatusSelect'))$('sentenceStatusSelect').onchange=renderSentenceSelect;
  if($('sentenceSelect'))$('sentenceSelect').onchange=()=>renderSentenceCard('question');
  if($('showSentenceTranslationBtn'))$('showSentenceTranslationBtn').onclick=()=>renderSentenceCard('translation');
  if($('showSentenceHintBtn'))$('showSentenceHintBtn').onclick=()=>renderSentenceCard('hint');
  if($('showSentenceAnalysisBtn'))$('showSentenceAnalysisBtn').onclick=()=>renderSentenceCard('analysis');
  if($('nextSentenceBtn'))$('nextSentenceBtn').onclick=nextSentence;
  if($('randomSentenceBtn'))$('randomSentenceBtn').onclick=randomSentence;
  if($('markSentenceMasteredBtn'))$('markSentenceMasteredBtn').onclick=()=>{const item=currentSentence();if(item){setSentenceStatus(item.id,'已掌握');renderSentenceSelect(true)}};
  if($('markSentenceReviewBtn'))$('markSentenceReviewBtn').onclick=()=>{const item=currentSentence();if(item){setSentenceStatus(item.id,'需复习');renderSentenceSelect(true)}};
  if($('copySentenceAnalysisBtn'))$('copySentenceAnalysisBtn').onclick=copyCurrentSentenceAnalysis;
  if($('startBasicSentenceBtn'))$('startBasicSentenceBtn').onclick=startBasicSentenceRoute;
  if($('showReviewSentenceBtn'))$('showReviewSentenceBtn').onclick=showReviewSentenceRoute;
  if($('resetSentenceFiltersBtn'))$('resetSentenceFiltersBtn').onclick=resetSentenceFilters;

  if($('linguisticsSearchInput'))$('linguisticsSearchInput').oninput=renderLinguisticsTips;
  if($('linguisticsCategorySelect'))$('linguisticsCategorySelect').onchange=renderLinguisticsTips;
  if($('closeTipModalBtn'))$('closeTipModalBtn').onclick=closeTipModal;

  if($('copyLookupWordBtn'))$('copyLookupWordBtn').onclick=copyLookupWord;
  if($('openPrimaryDictBtn'))$('openPrimaryDictBtn').onclick=openPrimaryDictionary;
  if($('clearLookupWordBtn'))$('clearLookupWordBtn').onclick=clearLookupWord;
  if($('analyzeLookupWordBtn'))$('analyzeLookupWordBtn').onclick=()=>analyzePaliToken();
  if($('selectedWordAnalyzeBtn'))$('selectedWordAnalyzeBtn').onclick=analyzeSelectedText;
  if($('openDictAfterAnalyzeBtn'))$('openDictAfterAnalyzeBtn').onclick=analyzeAndLookup;

  if($('refreshCacheBtn'))$('refreshCacheBtn').onclick=refreshSiteCache;
  if($('runSiteCheckBtn'))$('runSiteCheckBtn').onclick=()=>{renderSiteHealth();checkRequiredFiles();};

  if($('exportProgressBtn'))$('exportProgressBtn').onclick=exportProgress;
  if($('importProgressBtn'))$('importProgressBtn').onclick=importProgress;
  if($('clearProgressBtn'))$('clearProgressBtn').onclick=clearProgress;
  if($('copyFeedbackBtn'))$('copyFeedbackBtn').onclick=copyFeedbackTemplate;
  if($('resetTrialTasksBtn'))$('resetTrialTasksBtn').onclick=resetTrialTasks;
  if($('copyTrialFeedbackBtn'))$('copyTrialFeedbackBtn').onclick=copyTrialFeedback;
  if($('goTrialRouteBtn'))$('goTrialRouteBtn').onclick=()=>{renderLearningRoutes();switchView('learningRouteView')};

  /* 11.9：停止注册新的 Service Worker，避免旧缓存导致按钮失效。 */
}
init().catch(e=>{
  console.error(e);
  alert('加载失败：请确认 21 个网站文件都已上传，并清理旧缓存。错误：'+(e&&e.message?e.message:e));
});



async function forceClearAllCaches(){
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
    if(window.caches){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
    location.href='./index.html?v=20.41&cache=cleared&ts='+Date.now();
  }catch(e){
    alert('缓存清理失败，请手动 Ctrl+F5。'+e);
  }
}


/* ===== Pāli Learning Lab 13.1: consolidated interaction and terminology patch ===== */
(function(){
  const V="13.1";
  function byId(id){return document.getElementById(id);}
  function esc(s){return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
  function arr(name){try{const v=window[name]||(0,eval)(`typeof ${name}!=="undefined"?${name}:[]`);return Array.isArray(v)?v:[];}catch(e){return [];}}
  function obj(name){try{return window[name]||(0,eval)(`typeof ${name}!=="undefined"?${name}:{}`);}catch(e){return {};}}
  function grammarList(){try{return Array.isArray(GRAMMAR)?GRAMMAR:[];}catch(e){return [];}}
  function safeSwitch(id){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));const target=byId(id)||byId('homeView');if(target)target.classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});}
  function call(name,...args){try{const fn=window[name]||(0,eval)(`typeof ${name}!=="undefined"?${name}:undefined`);if(typeof fn==='function')return fn(...args);}catch(e){console.warn('调用失败',name,e);}}
  function textHas(x,q){return !q||JSON.stringify(x||{}).toLowerCase().includes(String(q).toLowerCase());}
  function optionize(sel,opts){if(!sel)return;const old=sel.value||'全部';sel.innerHTML=opts.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');if(opts.includes(old))sel.value=old;}
  function currentVisibleView(){const v=[...document.querySelectorAll('.view')].find(x=>!x.classList.contains('hidden'));return v?v.id:'homeView';}
  function homeJump(id){safeSwitch('homeView');setTimeout(()=>byId(id)?.scrollIntoView({behavior:'smooth',block:'start'}),80);}

  /* Lesson page: hard prev/next fix */
  function currentLessonObj(){
    if(window.__paliCurrentLessonId!=null){const hit=grammarList().find(x=>String(x.id)===String(window.__paliCurrentLessonId));if(hit)return hit;}
    try{if(typeof currentLesson!=='undefined'&&currentLesson&&currentLesson.id!=null)return currentLesson;}catch(e){}
    const title=(byId('lessonTitle')?.textContent||'').trim();
    return grammarList().find(x=>(x.title||'').trim()===title)||null;
  }
  function setCurrentLesson(id){window.__paliCurrentLessonId=id;try{if(typeof currentLesson!=='undefined')currentLesson=grammarList().find(x=>String(x.id)===String(id))||currentLesson;}catch(e){}}
  function updateLessonNav(){
    const g=grammarList(),l=currentLessonObj();const idx=l?g.findIndex(x=>String(x.id)===String(l.id)):-1;
    const p=byId('prevLessonBtn'),n=byId('nextLessonBtn');
    if(p){const ok=idx>0;p.disabled=false;p.classList.toggle('nav-disabled',!ok);p.dataset.disabled=ok?'0':'1';p.textContent=ok?`上一节：${g[idx-1].lesson_number||idx}`:'上一节';p.title=ok?g[idx-1].title:'';}
    if(n){const ok=idx>=0&&idx<g.length-1;n.disabled=false;n.classList.toggle('nav-disabled',!ok);n.dataset.disabled=ok?'0':'1';n.textContent=ok?`下一节：${g[idx+1].lesson_number||idx+2}`:'下一节';n.title=ok?g[idx+1].title:'';}
  }
  function openLessonHard(id){
    const l=grammarList().find(x=>String(x.id)===String(id));if(!l)return;
    setCurrentLesson(l.id);
    try{if(typeof openLesson==='function'){openLesson(l.id);setCurrentLesson(l.id);safeSwitch('lessonView');setTimeout(updateLessonNav,30);return;}}catch(e){console.warn('openLesson failed, fallback render',e);}
    if(byId('lessonModule'))byId('lessonModule').textContent=l.module||'';
    if(byId('lessonTitle'))byId('lessonTitle').textContent=l.title||'';
    if(byId('lessonMeta'))byId('lessonMeta').textContent=[l.category,l.difficulty||l.level].filter(Boolean).join('｜');
    if(byId('lessonSummary'))byId('lessonSummary').textContent=l.summary||'';
    if(byId('lessonExplanation'))byId('lessonExplanation').innerHTML=(l.explanation||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    if(byId('lessonMistakes'))byId('lessonMistakes').innerHTML=(l.common_mistakes||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    if(byId('mistakeBlock'))byId('mistakeBlock').classList.toggle('hidden',!(l.common_mistakes||[]).length);
    if(byId('lessonTable'))byId('lessonTable').innerHTML=(l.table||[]).map(r=>`<tr>${(r||[]).map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    if(byId('lessonExamples'))byId('lessonExamples').innerHTML=(l.examples||[]).map(e=>`<div class="example"><p class="pali">${esc(e.pali||'')}</p><p>${esc(e.cn||e.natural_cn||'')}</p><p class="muted">${esc(e.note||e.grammar_note||'')}</p></div>`).join('');
    safeSwitch('lessonView');updateLessonNav();
  }
  function jumpLesson(step){const g=grammarList(),l=currentLessonObj();const idx=l?g.findIndex(x=>String(x.id)===String(l.id)):-1;if(idx<0)return;const target=g[idx+step];if(target)openLessonHard(target.id);}
  const titleNodeObserver = new MutationObserver(()=>updateLessonNav());
  window.addEventListener('DOMContentLoaded',()=>{const t=byId('lessonTitle');if(t)titleNodeObserver.observe(t,{childList:true,characterData:true,subtree:true});updateLessonNav();});

  /* Routes */
  function lessonButton(id){const l=grammarList().find(x=>String(x.id)===String(id));return l?`<button class="route-lesson-jump" data-route-lesson="${esc(id)}">${esc(l.lesson_number||'')}. ${esc(l.title||'')}</button>`:'';}
  function renderRoutes(){const box=byId('learningRouteList')||byId('learningRouteContent')||byId('routeList');if(!box)return;const routes=arr('LEARNING_ROUTES');box.innerHTML=routes.length?routes.map(r=>`<div class="qa-route-card"><h3>${esc(r.title)}</h3><p class="muted">${esc(r.desc)}</p>${(r.steps||[]).map((s,i)=>`<div class="route-step-card"><div class="route-step-number">${i+1}</div><div><h4>${esc(s.title)}</h4><p>${esc(s.desc)}</p><div class="route-lesson-list">${(s.lesson_ids||[]).map(lessonButton).join('')}</div></div></div>`).join('')}</div>`).join(''):'<p class="muted">暂无学习路线。</p>';}
  window.renderLearningRoutes=renderRoutes;

  /* Search grammar */
  function simpleLessonCard(l){return `<h3>${esc(l.lesson_number)}. ${esc(l.title)}</h3><p class="muted">${esc(l.module)}｜${esc(l.category)}｜${esc(l.difficulty||l.level)}</p><p>${esc(l.summary)}</p>`;}
  function renderGrammarSearch(){const q=(byId('searchInput')?.value||'').trim().toLowerCase();const box=byId('searchResults');if(!box)return;const res=grammarList().filter(l=>textHas(l,q));box.innerHTML=res.length?'':'<p class="muted">没有找到相关语法点。</p>';res.forEach(l=>{const d=document.createElement('div');d.className='lesson-item';d.dataset.lessonId=l.id;d.innerHTML=simpleLessonCard(l);box.appendChild(d);});}

  /* Sentence analysis */
  let sentenceIndex=0;
  function sentenceData(){return arr('SENTENCE_ANALYSIS_DATA');}
  function sentenceStatusSafe(id){try{return sentenceStatus(id);}catch(e){return '未练';}}
  function renderSentenceFilters(){const data=sentenceData();optionize(byId('sentenceLevelSelect'),['全部',...new Set(data.map(x=>x.level).filter(Boolean))]);optionize(byId('sentencePrioritySelect'),['全部',...new Set(data.map(x=>x.practice_priority).filter(Boolean))]);optionize(byId('sentenceTagSelect'),['全部',...new Set(data.flatMap(x=>x.tags||[]).filter(Boolean))]);optionize(byId('sentenceSourceSelect'),['全部',...new Set(data.map(x=>x.source_type).filter(Boolean))]);}
  function sentenceFiltered(){const q=(byId('sentenceSearchInput')?.value||'').trim().toLowerCase();const level=byId('sentenceLevelSelect')?.value||'全部';const pri=byId('sentencePrioritySelect')?.value||'全部';const tag=byId('sentenceTagSelect')?.value||'全部';const source=byId('sentenceSourceSelect')?.value||'全部';const status=byId('sentenceStatusSelect')?.value||'全部';return sentenceData().filter(s=>textHas(s,q)&&(level==='全部'||s.level===level)&&(pri==='全部'||s.practice_priority===pri)&&(tag==='全部'||(s.tags||[]).includes(tag))&&(source==='全部'||s.source_type===source)&&(status==='全部'||sentenceStatusSafe(s.id)===status));}
  function renderSentenceSelect(){const list=sentenceFiltered();if(sentenceIndex>=list.length)sentenceIndex=0;const sel=byId('sentenceSelect');if(sel){sel.innerHTML=list.map((s,i)=>`<option value="${i}">${i+1}. ${esc(s.sentence)}｜${esc(s.translation)}｜${esc(s.practice_priority||'')}</option>`).join('');sel.value=String(sentenceIndex);}let wrap=byId('sentenceSelectList');if(!wrap&&sel){wrap=document.createElement('div');wrap.id='sentenceSelectList';wrap.className='sentence-select-list';sel.insertAdjacentElement('afterend',wrap);}if(wrap)wrap.innerHTML=list.map((s,i)=>`<button class="sentence-select-item ${i===sentenceIndex?'active':''}" data-sentence-index="${i}">${i+1}. ${esc(s.sentence)} <span class="muted">${esc(s.translation)}｜${esc(s.practice_priority||'')}</span></button>`).join('');renderSentenceCard('basic');}
  function renderSentenceCard(mode='basic'){const list=sentenceFiltered();const s=list[sentenceIndex];const box=byId('sentenceAnalysisCard');if(!box)return;if(!s){box.innerHTML='<p class="muted">没有符合条件的句子。</p>';return;}let html=`<div class="qa-full-card"><h3>${esc(s.sentence)}</h3><p><strong>译文：</strong>${esc(s.translation)}</p><p class="qa-meta">${esc(s.level)}｜${esc(s.practice_priority||'')}</p><p><strong>结构：</strong>${esc(s.structure||'')}</p>`;if(mode==='hint'||mode==='analysis')html+=`<p><strong>提示：</strong>${esc(s.tip||'')}</p>`;if(mode==='analysis')html+=`<table class="qa-table"><tr><th>词形</th><th>语法</th><th>作用</th><th>含义</th></tr>${(s.tokens||[]).map(t=>`<tr><td>${esc(t.form)}</td><td>${esc(t.grammar)}</td><td>${esc(t.role)}</td><td>${esc(t.meaning)}</td></tr>`).join('')}</table>`;html+='</div>';box.innerHTML=html;const dash=byId('sentenceDashboard');if(dash)dash.innerHTML=`<div class="version-status">当前显示：${list.length} 句｜总句库：${sentenceData().length} 句</div>`;}
  window.renderSentenceLevels=function(){renderSentenceFilters();renderSentenceSelect();};
  window.renderSentenceCard=renderSentenceCard;

  function fullExample(e){return `<div class="qa-example"><div class="pali">${esc(e.pali||e.source||'')}</div><div>${esc(e.cn||e.natural||e.natural_cn||e.meaning||'')}</div><div class="muted">${esc(e.note||e.grammar_note||e.use||'')}</div></div>`;}

  function renderConfusions(){const data=arr('CONFUSION_PAIRS'),q=(byId('confusionSearchInput')?.value||'').trim().toLowerCase(),box=(byId('confusionPairsList')||byId('confusionPairList'));if(!box)return;optionize(byId('confusionCategorySelect'),['全部',...new Set(data.map(x=>(x.title||'').split(' vs ')[0]||'其他'))]);const cat=byId('confusionCategorySelect')?.value||'全部';const items=data.filter(x=>(cat==='全部'||(x.title||'').startsWith(cat))&&textHas(x,q));box.innerHTML=items.length?items.map(x=>`<div class="qa-full-card"><h3>${esc(x.title)}</h3><p><strong>核心区别：</strong>${esc(x.core)}</p><table class="qa-table"><tr><th>${esc(x.a)}</th><td>${esc(x.a_cue)}</td></tr><tr><th>${esc(x.b)}</th><td>${esc(x.b_cue)}</td></tr></table>${(x.examples||[]).map(fullExample).join('')}<p><strong>提醒：</strong>${esc(x.tip)}</p></div>`).join(''):'<p class="muted">没有找到相关内容。</p>';}
  function renderPatterns(){const data=arr('SENTENCE_PATTERNS'),q=(byId('patternSearchInput')?.value||'').trim().toLowerCase(),level=byId('patternLevelSelect')?.value||'全部',box=byId('sentencePatternList');if(!box)return;const items=data.filter(x=>(level==='全部'||x.level===level)&&textHas(x,q));box.innerHTML=items.length?items.map(x=>`<div class="qa-full-card"><h3>${esc(x.title)}</h3><p class="qa-meta">${esc(x.level)}｜${esc(x.formula)}</p><p><strong>功能：</strong>${esc(x.function)}</p><p><strong>信号：</strong>${(x.signals||[]).map(esc).join('；')}</p><p><strong>步骤：</strong>${(x.steps||[]).map(esc).join(' → ')}</p>${(x.examples||[]).map(e=>`<div class="qa-example"><div class="pali">${esc(e.pali)}</div><div><strong>直译：</strong>${esc(e.literal||'')}</div><div><strong>翻译：</strong>${esc(e.natural||'')}</div><div class="muted">${esc(e.note||'')}</div></div>`).join('')}<p><strong>易错：</strong>${esc(x.trap||'')}</p></div>`).join(''):'<p class="muted">没有找到相关句型。</p>';}

  /* Linguistics tips: all content classified by category */
  function renderTips(){const data=arr('LINGUISTICS_TIPS'),q=(byId('linguisticsSearchInput')?.value||'').trim().toLowerCase(),box=(byId('linguisticsTipsList')||byId('linguisticsTipList'));if(!box)return;const cats=['全部',...new Set(data.map(x=>x.category||'其他'))];optionize(byId('linguisticsCategorySelect'),cats);const cat=byId('linguisticsCategorySelect')?.value||'全部';let items=data.filter(x=>(cat==='全部'||x.category===cat)&&textHas(x,q));if(!items.length){box.innerHTML='<p class="muted">没有找到相关内容。</p>';return;}const grouped={};items.forEach(x=>{const c=x.category||'其他';(grouped[c]||(grouped[c]=[])).push(x);});box.innerHTML=Object.entries(grouped).map(([c,rows])=>`<h3 class="qa-section-title">${esc(c)}</h3>${rows.map(x=>`<div class="qa-full-card"><h3>${esc(x.title)}</h3><p class="qa-meta">关键词：${(x.keywords||[]).map(esc).join('、')}</p><p>${esc(x.summary)}</p><div class="qa-example">${esc(x.example||'')}</div><p><strong>相关内容：</strong>${(x.related||[]).map(esc).join('、')}</p></div>`).join('')}`).join('');}
  function renderBuddhistReadingFull(){const data=arr('BUDDHIST_READING_PATTERNS'),q=(byId('buddhistReadingSearchInput')?.value||'').trim().toLowerCase(),box=byId('buddhistReadingList');if(!box)return;optionize(byId('buddhistReadingCategorySelect'),['全部',...new Set(data.map(x=>x.category).filter(Boolean))]);const cat=byId('buddhistReadingCategorySelect')?.value||'全部',level=byId('buddhistReadingLevelSelect')?.value||'全部';const items=data.filter(x=>(cat==='全部'||x.category===cat)&&(level==='全部'||x.level===level)&&textHas(x,q));box.innerHTML=items.length?items.map(x=>`<div class="qa-full-card"><h3>${esc(x.title)}</h3><p class="qa-meta">${esc(x.category)}｜${esc(x.level)}｜${esc(x.formula)}</p><p><strong>直译：</strong>${esc(x.literal)}</p><p><strong>翻译：</strong>${esc(x.natural)}</p><p><strong>结构：</strong>${esc(x.structure)}</p><table class="qa-table"><tr><th>关键词</th><th>说明</th></tr>${(x.keywords||[]).map(k=>`<tr><td>${esc(k.word)}</td><td>${esc(k.note)}</td></tr>`).join('')}</table><p><strong>提醒：</strong>${esc(x.warning)}</p></div>`).join(''):'<p class="muted">没有找到相关佛典句式。</p>';}

  /* Terminology: hide IPA visually, use title hover, allow phrase wrapping */
  function renderTerms(){const data=arr('TERMINOLOGY_GLOSSARY'),q=(byId('termSearchInput')?.value||'').trim().toLowerCase(),box=byId('termGlossaryList');if(!box)return;optionize(byId('termCategorySelect'),['全部',...new Set(data.map(x=>x.cat).filter(Boolean))]);const cat=byId('termCategorySelect')?.value||'全部';const items=data.filter(x=>(cat==='全部'||x.cat===cat)&&textHas(x,q));box.innerHTML=items.length?`<div class="term-count">共显示 <strong>${items.length}</strong> 条术语。英文术语下方虚线表示可悬浮查观察 IPA。</div><div class="term-table-wrap"><table class="term-table"><thead><tr><th>英文术语</th><th>中文</th><th>巴利 / 传统术语</th><th>类别</th><th>说明</th></tr></thead><tbody>${items.map(t=>`<tr><td class="term-en-cell"><span class="term-en-hover" title=" ${esc(t.ipa)}">${esc(t.en)}</span></td><td class="term-cn-cell">${esc(t.cn)}</td><td>${esc(t.pali)}</td><td><span class="term-cat">${esc(t.cat)}</span></td><td>${esc(t.note)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">没有找到相关术语。</p>';}

  function renderBackground(){const data=obj('BUDDHIST_BACKGROUND_DATA'),q=(byId('backgroundSearchInput')?.value||'').trim().toLowerCase(),box=byId('buddhistBackgroundContent');if(!box)return;optionize(byId('backgroundCategorySelect'),['全部','三藏结构与略号','佛学概念','章节术语','引用格式','佛经篇章结构']);const cat=byId('backgroundCategorySelect')?.value||'全部';const parts=[];function ok(section,x){return (cat==='全部'||cat===section)&&textHas(x,q);}
  if(cat==='全部'||cat==='三藏结构与略号'){const items=(data.canon_structure||[]).filter(x=>ok('三藏结构与略号',x));if(items.length)parts.push(`<h3 class="qa-section-title">三藏结构与略号</h3>`+items.map(x=>`<div class="qa-full-card"><h3>${esc(x.title)}</h3><p>${esc(x.explanation)}</p><table class="qa-table"><tr><th>略号/术语</th><th>名称</th><th>说明</th></tr>${(x.items||[]).map(i=>`<tr><td>${esc(i.abbr)}</td><td>${esc(i.name)}</td><td>${esc(i.note)}</td></tr>`).join('')}</table></div>`).join(''));}
  if(cat==='全部'||cat==='佛学概念'){const items=(data.concepts||[]).filter(x=>ok('佛学概念',x));if(items.length)parts.push(`<h3 class="qa-section-title">佛学概念</h3>`+items.map(x=>`<div class="qa-full-card"><h3>${esc(x.pali)}｜${esc(x.cn)}</h3><p class="qa-meta">${esc(x.category)}｜${esc(x.level)}｜${esc(x.en)}</p><p><strong>基础解释：</strong>${esc(x.basic)}</p><p><strong>阅读提醒：</strong>${esc(x.reading_tip)}</p><p><strong>例子：</strong>${esc(x.example)}</p></div>`).join(''));}
  if(cat==='全部'||cat==='章节术语'){const items=(data.reference_terms||[]).filter(x=>ok('章节术语',x));if(items.length)parts.push(`<h3 class="qa-section-title">章节术语</h3><table class="qa-table"><tr><th>术语</th><th>常见汉译</th><th>说明</th></tr>${items.map(x=>`<tr><td>${esc(x.term)}</td><td>${esc(x.cn)}</td><td>${esc(x.note)}</td></tr>`).join('')}</table>`);}
  if(cat==='全部'||cat==='引用格式'){const items=(data.citation_examples||[]).filter(x=>ok('引用格式',x));if(items.length)parts.push(`<h3 class="qa-section-title">引用格式</h3><table class="qa-table"><tr><th>格式</th><th>含义</th></tr>${items.map(x=>`<tr><td>${esc(x.ref)}</td><td>${esc(x.meaning)}</td></tr>`).join('')}</table>`);}
  if(cat==='全部'||cat==='佛经篇章结构'){const items=(data.sutta_flow||[]).filter(x=>ok('佛经篇章结构',x));if(items.length)parts.push(`<h3 class="qa-section-title">佛经篇章结构</h3>`+items.map(x=>`<div class="qa-full-card"><h3>${esc(x.stage)}</h3><p><strong>常见表达：</strong>${(x.patterns||[]).map(esc).join('；')}</p><p>${esc(x.purpose)}</p></div>`).join(''));}
  box.innerHTML=parts.join('')||'<p class="muted">没有找到相关背景知识。</p>';}
  function renderAcademic(){const data=obj('ACADEMIC_TRAINING_DATA'),q=(byId('academicSearchInput')?.value||'').trim().toLowerCase(),box=byId('academicTrainingContent');if(!box)return;optionize(byId('academicCategorySelect'),['全部','阅读方法','词义观察','原文记录模板','引用规范','阅读小任务','阅读误区']);const cat=byId('academicCategorySelect')?.value||'全部';const parts=[];function ok(section,x){return (cat==='全部'||cat===section)&&textHas(x,q);}
  if(cat==='全部'||cat==='阅读方法'){const items=(data.method||[]).filter(x=>ok('阅读方法',x));if(items.length)parts.push(`<h3 class="qa-section-title">阅读方法</h3>`+items.map(x=>`<div class="qa-full-card"><h3>${esc(x.title)}</h3><p class="qa-meta">${esc(x.level)}｜${esc(x.goal)}</p><ol>${(x.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`).join(''));}
  if(cat==='全部'||cat==='词义观察'){const items=(data.vocabulary||[]).filter(x=>ok('词义观察',x));if(items.length)parts.push(`<h3 class="qa-section-title">词义观察</h3>`+items.map(x=>`<div class="qa-full-card"><h3>${esc(x.title)}</h3><p>${esc(x.core_warning)}</p><ol>${(x.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`).join(''));}
  if(cat==='全部'||cat==='原文记录模板'){const t=data.analysis_template||{};if(ok('原文记录模板',t))parts.push(`<h3 class="qa-section-title">原文记录模板</h3><div class="qa-full-card"><h3>${esc(t.title)}</h3><table class="qa-table">${(t.fields||[]).map(f=>`<tr><th>${esc(f.name)}</th><td>${esc(f.tip)}</td></tr>`).join('')}</table></div>`);}
  if(cat==='全部'||cat==='引用规范'){const c=data.citation||{};if(ok('引用规范',c))parts.push(`<h3 class="qa-section-title">引用规范</h3>${(c.principles||[]).map(p=>`<div class="qa-full-card"><h3>${esc(p.title)}</h3><p>${esc(p.content)}</p></div>`).join('')}`);}
  if(cat==='全部'||cat==='阅读小任务'){const items=(data.research_tasks||[]).filter(x=>ok('阅读小任务',x));if(items.length)parts.push(`<h3 class="qa-section-title">阅读小任务</h3>`+items.map(x=>`<div class="qa-full-card"><h3>${esc(x.title)}</h3><p class="qa-meta">${esc(x.level)}｜${esc(x.goal)}</p><ol>${(x.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p><strong>提交形式：</strong>${esc(x.output)}</p></div>`).join(''));}
  if(cat==='全部'||cat==='阅读误区'){const items=(data.pitfalls||[]).filter(x=>ok('阅读误区',x));if(items.length)parts.push(`<h3 class="qa-section-title">阅读误区</h3>`+items.map((x,i)=>`<div class="qa-full-card"><h3>${i+1}. ${esc(x.title)}</h3><p>${esc(x.fix)}</p></div>`).join(''));}
  box.innerHTML=parts.join('')||'<p class="muted">没有找到相关佛典阅读内容。</p>';}
  function renderDict(){call('renderDictionarySites');call('renderLookupHistory');}
  function openDict(){let url='https://dictionary.sutta.org/';const sites=arr('PALI_DICTIONARY_SITES');if(sites.length)url=(sites.find(x=>x.id==='sutta')||sites[0]).url||url;window.open(url,'_blank','noopener');}

  /* Full-site search */
  function rawText(x){return JSON.stringify(x||{},null,2);}
  function norm(s){return String(s||'').toLowerCase();}
  function clipAround(text, terms, n=180){text=String(text||'').replace(/\s+/g,' ').trim();if(!text)return '';const lower=text.toLowerCase();let pos=-1;for(const t of terms){const p=lower.indexOf(t);if(p>=0){pos=p;break;}}if(pos<0)return text.length>n?text.slice(0,n)+'…':text;const start=Math.max(0,pos-Math.floor(n/3));const end=Math.min(text.length,start+n);return(start>0?'…':'')+text.slice(start,end)+(end<text.length?'…':'');}
  function highlight(s,terms){let out=esc(s);terms.filter(Boolean).slice(0,5).forEach(t=>{const safe=t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');try{out=out.replace(new RegExp(safe,'gi'),m=>`<mark>${m}</mark>`);}catch(e){}});return out;}
  function result(type,title,summary,target,query,id,meta,sourceObj){const full=rawText(sourceObj);return{type,title:title||'',summary:summary||'',target,query:query||'',id:id??'',meta:meta||'',fullText:full,text:norm([type,title,summary,target,query,id,meta,full].join(' '))};}
  function buildGlobalIndexFull(){const out=[];grammarList().forEach(l=>out.push(result('语法点',`${l.lesson_number||''}. ${l.title||''}`,l.summary||'','lesson',l.title||'',l.id,`${l.module||''}｜${l.category||''}｜${l.difficulty||l.level||''}`,l)));arr('SENTENCE_ANALYSIS_DATA').forEach(s=>out.push(result('句子分析',s.sentence||'',`${s.translation||''}｜${s.structure||''}`,'sentenceAnalysis',s.sentence||'',s.id,`${s.level||''}｜${s.practice_priority||''}`,s)));arr('CONFUSION_PAIRS').forEach(x=>out.push(result('易混概念',x.title||'',x.core||'','confusionPairs',x.title||'',x.id,`${x.a||''} / ${x.b||''}`,x)));arr('SENTENCE_PATTERNS').forEach(x=>out.push(result('句型模板',x.title||'',`${x.formula||''}｜${x.function||''}`,'sentencePatterns',x.title||'',x.id,x.level||'',x)));arr('LINGUISTICS_TIPS').forEach(x=>out.push(result('语言学小贴士',x.title||'',x.summary||'','linguisticsTips',x.title||'',x.id,x.category||'',x)));arr('BUDDHIST_READING_PATTERNS').forEach(x=>out.push(result('佛典阅读句式',x.title||'',`${x.natural||''}｜${x.structure||''}`,'buddhistReading',x.title||'',x.id,`${x.category||''}｜${x.level||''}`,x)));const bg=obj('BUDDHIST_BACKGROUND_DATA');Object.entries(bg).forEach(([section,val])=>{if(Array.isArray(val))val.forEach((x,i)=>out.push(result('佛典背景',x.title||x.pali||x.term||x.ref||x.stage||`背景知识 ${i+1}`,x.basic||x.explanation||x.note||x.meaning||x.purpose||'','buddhistBackground',x.title||x.pali||x.term||x.ref||x.stage||section,x.id||x.term||x.ref||i,section,x)));else if(val&&typeof val==='object')out.push(result('佛典背景',val.title||section,val.summary||val.explanation||'','buddhistBackground',section,section,section,val));});const ac=obj('ACADEMIC_TRAINING_DATA');Object.entries(ac).forEach(([section,val])=>{if(Array.isArray(val))val.forEach((x,i)=>out.push(result('佛典阅读',x.title||`佛典阅读 ${i+1}`,x.goal||x.core_warning||x.fix||x.output||'','academicTraining',x.title||section,x.id||i,section,x)));else if(val&&typeof val==='object')out.push(result('佛典阅读',val.title||section,val.summary||val.goal||'','academicTraining',val.title||section,section,section,val));});arr('TERMINOLOGY_GLOSSARY').forEach(x=>out.push(result('术语表',x.en||x.cn||'',`${x.ipa||''}｜${x.cn||''}｜${x.pali||''}｜${x.note||''}`,'terminologyGlossary',x.en||x.cn||x.pali||'',x.en||x.cn,x.cat||'',x)));arr('LEARNING_ROUTES').forEach(x=>out.push(result('学习路线',x.title||'',x.desc||'','learningRoute',x.title||'',x.id,'路线',x)));arr('PALI_DICTIONARY_SITES').forEach(x=>out.push(result('查词网站',x.name||'',`${x.langs||''}｜${x.best_for||''}｜${x.note||''}`,'dictionaryLookup',x.name||'',x.id,'词典',x)));return out;}
  function renderGlobalSearchFull(){const box=byId('globalSiteSearchResults'),input=byId('globalSiteSearchInput');if(!box||!input)return;const q=input.value.trim().toLowerCase();if(!q){box.innerHTML='<div class="global-search-empty">输入关键词后显示全站结果。支持搜索正文、例子、说明、练习、术语和数据内容。</div>';return;}const terms=q.split(/\s+/).filter(Boolean);const rows=buildGlobalIndexFull().map(r=>{let score=0;terms.forEach(t=>{if(norm(r.title).includes(t))score+=5;if(norm(r.meta).includes(t))score+=2;if(norm(r.summary).includes(t))score+=3;if(r.text.includes(t))score+=1;});return{...r,score};}).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||a.type.localeCompare(b.type)).slice(0,50);if(!rows.length){box.innerHTML='<div class="global-search-empty">没有找到相关内容。</div>';return;}box.innerHTML=rows.map(r=>{const snippet=clipAround([r.summary,r.fullText].join(' '),terms,200);return`<div class="global-result-card"><div class="global-result-meta"><span class="global-result-tag">${esc(r.type)}</span><span class="global-result-tag">${esc(r.meta||'')}</span></div><h3>${highlight(r.title,terms)}</h3><p>${highlight(snippet,terms)}</p><div class="global-result-source">检索范围：完整内容文本</div><button type="button" data-global-target="${esc(r.target)}" data-global-query="${esc(r.query||'')}" data-global-id="${esc(r.id||'')}">打开结果</button></div>`;}).join('');}
  function setValue(id,value){const el=byId(id);if(el){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));}}
  function openGlobalResult(target,query,id){if(target==='lesson'){openLessonHard(id);return;}const actionMap={sentenceAnalysis:'sentenceAnalysis',confusionPairs:'confusionPairs',sentencePatterns:'sentencePatterns',linguisticsTips:'linguisticsTips',buddhistReading:'buddhistReading',buddhistBackground:'buddhistBackground',academicTraining:'academicTraining',terminologyGlossary:'terminologyGlossary',learningRoute:'learningRoute',dictionaryLookup:'dictionaryLookup'};const act=actionMap[target];if(act){route(act);setTimeout(()=>{if(target==='sentenceAnalysis')setValue('sentenceSearchInput',query);if(target==='confusionPairs')setValue('confusionSearchInput',query);if(target==='sentencePatterns')setValue('patternSearchInput',query);if(target==='linguisticsTips')setValue('linguisticsSearchInput',query);if(target==='buddhistReading')setValue('buddhistReadingSearchInput',query);if(target==='buddhistBackground')setValue('backgroundSearchInput',query);if(target==='academicTraining')setValue('academicSearchInput',query);if(target==='terminologyGlossary')setValue('termSearchInput',query);if(target==='dictionaryLookup')setValue('paliLookupInput',query);},80);}}

  function route(action){if(action==='learningRoute'){safeSwitch('learningRouteView');renderRoutes();return;}if(action==='modules'){renderModules();safeSwitch('moduleLearningView');return;}if(action==='search'){safeSwitch('searchView');renderGrammarSearch();return;}if(action==='sentenceAnalysis'){safeSwitch('sentenceAnalysisView');renderSentenceFilters();renderSentenceSelect();return;}if(action==='confusionPairs'){safeSwitch('confusionPairsView');renderConfusions();return;}if(action==='sentencePatterns'){safeSwitch('sentencePatternsView');renderPatterns();return;}if(action==='linguisticsTips'){safeSwitch('linguisticsTipsView');renderTips();return;}if(action==='buddhistReading'){safeSwitch('buddhistReadingView');renderBuddhistReadingFull();return;}if(action==='buddhistBackground'){safeSwitch('buddhistBackgroundView');renderBackground();return;}if(action==='academicTraining'){safeSwitch('academicTrainingView');renderAcademic();return;}if(action==='terminologyGlossary'){safeSwitch('terminologyGlossaryView');renderTerms();return;}if(action==='dictionaryLookup'){safeSwitch('dictionaryLookupView');renderDict();return;}const map={studentGuide:'studentGuideView',exercise:'exerciseCenterView',training:'trainingView',wrong:'wrongView',learningProgress:'learningProgressView'};if(action==='training')call('renderTraining');if(action==='wrong')call('renderWrong');if(action==='learningProgress')call('renderProgressSummary');safeSwitch(map[action]||'homeView');}

  document.addEventListener('click',function(e){const home=e.target.closest('[data-home-jump]');if(home){e.preventDefault();e.stopImmediatePropagation();homeJump(home.dataset.homeJump);return;}const action=e.target.closest('[data-action]');if(action){e.preventDefault();e.stopImmediatePropagation();route(action.dataset.action);return;}if(e.target.closest('.back-home')){e.preventDefault();e.stopImmediatePropagation();safeSwitch('homeView');return;}const lesson=e.target.closest('[data-route-lesson],[data-lesson-id]');if(lesson){window.__paliLastView=currentVisibleView();e.preventDefault();e.stopImmediatePropagation();openLessonHard(lesson.dataset.routeLesson||lesson.dataset.lessonId);return;}const s=e.target.closest('[data-sentence-index]');if(s){e.preventDefault();e.stopImmediatePropagation();sentenceIndex=parseInt(s.dataset.sentenceIndex||'0');const sel=byId('sentenceSelect');if(sel)sel.value=String(sentenceIndex);renderSentenceSelect();return;}const bg=e.target.closest('[data-bg-open]');if(bg){e.preventDefault();e.stopImmediatePropagation();safeSwitch('buddhistBackgroundView');if(byId('backgroundSearchInput'))byId('backgroundSearchInput').value=bg.textContent.trim();renderBackground();return;}const ac=e.target.closest('[data-academic-open]');if(ac){e.preventDefault();e.stopImmediatePropagation();safeSwitch('academicTrainingView');if(byId('academicSearchInput'))byId('academicSearchInput').value=ac.textContent.trim();renderAcademic();return;}const dict=e.target.closest('[data-dict-url]');if(dict){e.preventDefault();e.stopImmediatePropagation();window.open(dict.dataset.dictUrl,'_blank','noopener');return;}const global=e.target.closest('[data-global-target]');if(global){e.preventDefault();e.stopImmediatePropagation();openGlobalResult(global.dataset.globalTarget,global.dataset.globalQuery,global.dataset.globalId);return;}const idb=e.target.closest('button[id],a[id]');if(!idb)return;const id=idb.id;if(id==='backToListBtn'){e.preventDefault();e.stopImmediatePropagation();const last=window.__paliLastView;if(last&&byId(last))safeSwitch(last);else safeSwitch('lessonListView');return;}if(id==='prevLessonBtn'){e.preventDefault();e.stopImmediatePropagation();if(idb.dataset.disabled!=='1')jumpLesson(-1);return;}if(id==='nextLessonBtn'){e.preventDefault();e.stopImmediatePropagation();if(idb.dataset.disabled!=='1')jumpLesson(1);return;}if(id==='startLessonExercisesBtn'){e.preventDefault();e.stopImmediatePropagation();try{const l=currentLessonObj();const items=((l&&l.exercises)||[]).map(ex=>({...ex,lesson_id:l.id,lesson_title:l.title,module:l.module}));startExercises(items,'本课练习');}catch(err){alert('练习打开失败：'+(err.message||err));}return;}if(id==='startMixedExercisesBtn'){e.preventDefault();e.stopImmediatePropagation();try{const mod=byId('exerciseModuleSelect')?.value||'入门与发音';const n=parseInt(byId('exerciseCountInput')?.value||'10');startExercises(shuffle(allEx(mod)).slice(0,n),'练习');}catch(err){alert('练习打开失败：'+(err.message||err));}return;}if(id==='showSentenceHintBtn'){e.preventDefault();e.stopImmediatePropagation();renderSentenceCard('hint');return;}if(id==='showSentenceAnalysisBtn'){e.preventDefault();e.stopImmediatePropagation();renderSentenceCard('analysis');return;}if(id==='nextSentenceBtn'){e.preventDefault();e.stopImmediatePropagation();const list=sentenceFiltered();if(list.length)sentenceIndex=(sentenceIndex+1)%list.length;renderSentenceSelect();return;}if(id==='randomSentenceBtn'){e.preventDefault();e.stopImmediatePropagation();const list=sentenceFiltered();if(list.length)sentenceIndex=Math.floor(Math.random()*list.length);renderSentenceSelect();return;}if(id==='openPrimaryDictBtn'){e.preventDefault();e.stopImmediatePropagation();openDict();return;}if(id==='copyLookupWordBtn'){e.preventDefault();e.stopImmediatePropagation();call('copyLookupWord');return;}if(id==='clearLookupWordBtn'){e.preventDefault();e.stopImmediatePropagation();if(byId('paliLookupInput'))byId('paliLookupInput').value='';return;}if(id==='analyzeLookupWordBtn'){e.preventDefault();e.stopImmediatePropagation();call('analyzePaliToken');return;}},true);

  document.addEventListener('input',function(e){const id=e.target.id;if(id==='searchInput')renderGrammarSearch();if(id==='sentenceSearchInput'){sentenceIndex=0;renderSentenceSelect();}if(id==='confusionSearchInput')renderConfusions();if(id==='patternSearchInput')renderPatterns();if(id==='linguisticsSearchInput')renderTips();if(id==='buddhistReadingSearchInput')renderBuddhistReadingFull();if(id==='backgroundSearchInput')renderBackground();if(id==='academicSearchInput')renderAcademic();if(id==='termSearchInput')renderTerms();if(id==='globalSiteSearchInput')renderGlobalSearchFull();},true);
  document.addEventListener('change',function(e){const id=e.target.id;if(['sentenceLevelSelect','sentencePrioritySelect','sentenceTagSelect','sentenceSourceSelect','sentenceStatusSelect'].includes(id)){sentenceIndex=0;renderSentenceSelect();}if(id==='sentenceSelect'){sentenceIndex=parseInt(e.target.value||'0');renderSentenceSelect();}if(id==='confusionCategorySelect')renderConfusions();if(id==='patternLevelSelect')renderPatterns();if(id==='linguisticsCategorySelect')renderTips();if(id==='buddhistReadingCategorySelect'||id==='buddhistReadingLevelSelect')renderBuddhistReadingFull();if(id==='backgroundCategorySelect')renderBackground();if(id==='academicCategorySelect')renderAcademic();if(id==='termCategorySelect')renderTerms();},true);

  window.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('button').forEach(b=>{if(!b.type)b.type='button';});const badge=document.querySelector('.visual-version-badge');if(badge)badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';updateLessonNav();renderGlobalSearchFull();});
  window.__paliQA={route,openLessonHard,jumpLesson,updateLessonNav,renderTips,renderTerms,renderGlobalSearchFull,buildGlobalIndexFull};
})();


/* ===== Pāli Learning Lab 13.2: dictionary enhancement patch ===== */
(function(){
  function byId(id){return document.getElementById(id);}
  function esc(s){return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
  function arr(name){try{const v=window[name]||(0,eval)(`typeof ${name}!=="undefined"?${name}:[]`);return Array.isArray(v)?v:[];}catch(e){return [];}}
  function obj(name){try{return window[name]||(0,eval)(`typeof ${name}!=="undefined"?${name}:{}`);}catch(e){return {};}}
  const PALI_LETTERS=['ā','ī','ū','ṅ','ñ','ṭ','ḍ','ṇ','ḷ','ṃ'];
  const VEL_MAP=[
    ['aa','ā'],['ii','ī'],['uu','ū'],['"n','ṅ'],['.m','ṃ'],['~n','ñ'],['.t','ṭ'],['.d','ḍ'],['.n','ṇ'],['.l','ḷ'],
    ['AA','Ā'],['II','Ī'],['UU','Ū'],['"N','Ṅ'],['.M','Ṃ'],['~N','Ñ'],['.T','Ṭ'],['.D','Ḍ'],['.N','Ṇ'],['.L','Ḷ']
  ];
  function copyText(text){
    if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text));
    return fallbackCopy(text);
  }
  function fallbackCopy(text){
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
  }
  function convertVelthuis(s){
    let out=String(s||'');
    // longer / special patterns first
    VEL_MAP.forEach(([a,b])=>{out=out.split(a).join(b);});
    return out;
  }
  function normPali(s){
    return String(s||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[āĀ]/g,'a').replace(/[īĪ]/g,'i').replace(/[ūŪ]/g,'u')
      .replace(/[ṅṄñÑṇṆ]/g,'n').replace(/[ṭṬ]/g,'t').replace(/[ḍḌ]/g,'d')
      .replace(/[ḷḶ]/g,'l').replace(/[ṃṁṂṀ]/g,'m')
      .replace(/[^a-zA-Z]/g,'').toLowerCase();
  }
  function levenshtein(a,b){
    a=normPali(a);b=normPali(b);
    const dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
    for(let i=0;i<=a.length;i++)dp[i][0]=i;
    for(let j=0;j<=b.length;j++)dp[0][j]=j;
    for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    return dp[a.length][b.length];
  }
  function collectCandidateWords(){
    const set=new Set();
    const tokenData=obj('TOKEN_ANALYSIS_DATA');
    Object.keys(tokenData||{}).forEach(k=>set.add(k));
    Object.values(tokenData||{}).forEach(v=>{if(v&&v.form)set.add(v.form);(v.examples||[]).forEach(e=>String(e.sentence||'').split(/\s+/).forEach(w=>set.add(w.replace(/[.,;:!?“”"']/g,''))))});
    arr('SENTENCE_ANALYSIS_DATA').forEach(s=>{
      String(s.sentence||'').split(/\s+/).forEach(w=>set.add(w.replace(/[.,;:!?“”"']/g,'')));
      (s.tokens||[]).forEach(t=>t.form&&set.add(t.form));
    });
    try{(Array.isArray(GRAMMAR)?GRAMMAR:[]).forEach(l=>(l.examples||[]).forEach(e=>String(e.pali||'').split(/\s+/).forEach(w=>set.add(w.replace(/[.,;:!?“”"']/g,'')))));}catch(e){}
    arr('TERMINOLOGY_GLOSSARY').forEach(t=>{String(t.pali||'').split(/[\s/;、]+/).forEach(w=>set.add(w.replace(/[.,;:!?“”"']/g,'')));});
    return [...set].filter(w=>w&&/[A-Za-zāīūṅñṭḍṇḷṃṁĀĪŪṄÑṬḌṆḶṂṀ]/.test(w)).slice(0,1500);
  }
  function fuzzyCandidates(q){
    q=String(q||'').trim();
    if(!q)return [];
    const converted=convertVelthuis(q);
    const nq=normPali(converted);
    if(!nq)return [];
    const candidates=collectCandidateWords();
    const rows=candidates.map(w=>{
      const nw=normPali(w);
      let score=999;
      if(w===q||w===converted)score=0;
      else if(nw===nq)score=1;
      else if(nw.startsWith(nq))score=2;
      else if(nw.includes(nq))score=3;
      else {
        const d=levenshtein(nw,nq);
        if(d<=Math.max(1,Math.floor(nq.length/4)))score=4+d;
      }
      return {w,score,nw};
    }).filter(x=>x.score<999)
      .sort((a,b)=>a.score-b.score||a.w.length-b.w.length||a.w.localeCompare(b.w))
      .filter((x,i,arr)=>arr.findIndex(y=>y.w===x.w)===i)
      .slice(0,16);
    return rows.map(x=>x.w);
  }
  function renderLetterButtons(){
    const box=byId('paliLetterButtons');
    if(!box)return;
    box.innerHTML=PALI_LETTERS.map(ch=>`<button type="button" class="letter-btn" data-copy-letter="${ch}" title="点击复制 ${ch}">${ch}</button>`).join('');
  }
  function renderFuzzySuggestions(){
    const box=byId('fuzzyLookupSuggestions');
    const input=byId('paliLookupInput');
    if(!box||!input)return;
    const q=input.value.trim();
    if(!q){box.innerHTML='';return;}
    const converted=convertVelthuis(q);
    const hits=fuzzyCandidates(q).filter(w=>w!==q);
    let html='';
    if(converted!==q){
      html+=`<div class="fuzzy-box"><strong>转写转换：</strong><div class="fuzzy-list"><button type="button" class="fuzzy-word-btn" data-fuzzy-word="${esc(converted)}">${esc(converted)}</button></div></div>`;
    }
    if(hits.length){
      html+=`<div class="fuzzy-box" style="margin-top:8px"><strong>可能要查的是：</strong><div class="fuzzy-list">${hits.map(w=>`<button type="button" class="fuzzy-word-btn" data-fuzzy-word="${esc(w)}">${esc(w)}</button>`).join('')}</div><div class="open-all-warning">已按“省略变音符号/点号”的方式匹配，例如 sangha 可提示 saṅgha，panna 可提示 paññā。</div></div>`;
    }
    box.innerHTML=html;
  }
  function renderDictionaryCardsEnhanced(){
    const box=byId('dictionarySiteList');
    if(!box)return;
    const sites=arr('PALI_DICTIONARY_SITES');
    if(!sites.length)return;
    box.innerHTML=sites.map(s=>`<div class="dictionary-card"><span class="dict-level">${esc(s.level||'')}</span><h3>${esc(s.name)}</h3><p><strong>语言：</strong>${esc(s.langs||'')}</p><p><strong>适合：</strong>${esc(s.best_for||'')}</p><p class="muted">${esc(s.note||'')}</p><button type="button" class="dict-open-btn" data-dict-url="${esc(s.url)}">打开网站</button></div>`).join('');
  }
  function setupDictionaryEnhanced(){
    renderLetterButtons();
    renderFuzzySuggestions();
    renderDictionaryCardsEnhanced();
  }
  function currentLookupWord(){
    return (byId('paliLookupInput')?.value||'').trim();
  }
  async function openAllDictionaries(){
    const word=currentLookupWord();
    if(word)await copyText(word);
    const sites=arr('PALI_DICTIONARY_SITES');
    if(!sites.length){alert('没有找到词典列表。');return;}
    sites.forEach(s=>window.open(s.url,'_blank','noopener'));
    const msg=word?`已复制“${word}”。如果浏览器拦截多个新窗口，请允许弹窗，或逐个打开词典。`:'已尝试打开全部词典。如果浏览器拦截多个新窗口，请允许弹窗。';
    const box=byId('fuzzyLookupSuggestions');
    if(box)box.insertAdjacentHTML('afterbegin',`<div class="fuzzy-box"><strong>打开全部词典：</strong><div class="open-all-warning">${esc(msg)}</div></div>`);
  }
  document.addEventListener('click',function(e){
    const letter=e.target.closest('[data-copy-letter]');
    if(letter){e.preventDefault();e.stopImmediatePropagation();copyText(letter.dataset.copyLetter);return;}
    const fuzzy=e.target.closest('[data-fuzzy-word]');
    if(fuzzy){e.preventDefault();e.stopImmediatePropagation();const input=byId('paliLookupInput');if(input){input.value=fuzzy.dataset.fuzzyWord;input.dispatchEvent(new Event('input',{bubbles:true}));}try{if(typeof analyzePaliToken==='function')analyzePaliToken(fuzzy.dataset.fuzzyWord);}catch(err){}return;}
    const idb=e.target.closest('button[id],a[id]');
    if(!idb)return;
  },true);
  document.addEventListener('input',function(e){
    if(e.target&&e.target.id==='paliLookupInput')renderFuzzySuggestions();
  },true);
  document.addEventListener('click',function(e){
    const action=e.target.closest('[data-action]');
    if(action&&action.dataset.action==='dictionaryLookup')setTimeout(setupDictionaryEnhanced,120);
  },true);
  window.addEventListener('DOMContentLoaded',setupDictionaryEnhanced);
  window.__paliDictionaryEnhanced={setupDictionaryEnhanced,renderFuzzySuggestions,fuzzyCandidates,convertVelthuis,openAllDictionaries};
})();


/* ===== Pāli Learning Lab 13.3: sandhi restoration in token analysis ===== */
(function(){
  function byId(id){return document.getElementById(id);}
  function esc(s){return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
  function normalizeToken(s){return String(s||'').trim().replace(/[，。；、,.!?;:”“"']/g,'');}
  function tokenData(){try{return window.TOKEN_ANALYSIS_DATA||{};}catch(e){return {};}}
  function lookupData(form){
    const data=tokenData();
    if(data[form])return data[form];
    const low=form.toLowerCase();
    if(data[low])return data[low];
    const hit=Object.keys(data).find(k=>k.toLowerCase()===low);
    return hit?data[hit]:null;
  }
  const COMMON = {
    "ca":[{grammar:"ind. / 连词", role:"并列、连接", meaning:"和、并且、也"}],
    "eva":[{grammar:"ind. / 强调词", role:"强调", meaning:"正是、就、仅仅"}],
    "na":[{grammar:"否定副词", role:"否定", meaning:"不、非"}],
    "mā":[{grammar:"禁止副词", role:"禁止", meaning:"不要、莫"}],
    "atthi":[{grammar:"动词，现在时第三人称单数", role:"谓语", meaning:"有、存在"}],
    "ahaṃ":[{grammar:"第一人称代词sg.nom", role:"主语", meaning:"我"}],
    "iti":[{grammar:"ind. / 引语标记", role:"标记所说、所想内容", meaning:"如此、这样说"}],
    "ti":[{grammar:"iti 的省略形 / 引语标记", role:"标记引语或想法", meaning:"如此、这样说"}],
    "pi":[{grammar:"ind.", role:"附加、让步或强调", meaning:"也、甚至、即使"}],
    "api":[{grammar:"ind.", role:"附加、让步或强调", meaning:"也、甚至、即使"}],
    "vā":[{grammar:"ind. / 选择连词", role:"选择", meaning:"或、或者"}],
    "hi":[{grammar:"ind.", role:"解释、强调", meaning:"因为、确实"}],
    "kho":[{grammar:"ind.", role:"强调、语气", meaning:"确实、于是"}],
    "me":[{grammar:"代词形式", role:"属格/与格等，需看上下文", meaning:"我的、给我"}],
    "te":[{grammar:"代词形式", role:"主格复数或属格/与格等，需看上下文", meaning:"他们 / 你的等"}]
  };
  function miniGrammar(form){
    const item=lookupData(form);
    const analyses=item?.analyses || COMMON[form] || COMMON[form.toLowerCase()] || [];
    if(!analyses.length)return "";
    return `<div class="sandhi-grammar-mini"><strong>${esc(form)}：</strong>` + analyses.slice(0,3).map(a=>`${esc(a.grammar||'')}；${esc(a.role||'')}；${esc(a.meaning||'')}`).join("<br>") + `</div>`;
  }
  function uniq(cands){
    const seen=new Set();
    return cands.filter(c=>{
      const key=(c.before||'')+'|'+(c.rule||'');
      if(seen.has(key))return false;
      seen.add(key);return true;
    });
  }
  function capLike(base, raw){
    if(!base)return base;
    if(/^[A-ZĀĪŪṄÑṬḌṆḶṂ]/.test(raw))return base.charAt(0).toUpperCase()+base.slice(1);
    return base;
  }
  function sandhiRestoreCandidates(raw){
    raw=normalizeToken(raw);
    if(!raw)return [];
    const c=[];
    const lower=raw.toLowerCase();

    const exact={
      "natthi":{before:"na + atthi", parts:["na","atthi"], rule:"元音相接与辅音加强：na + atthi → natthi。"},
      "n'atthi":{before:"na + atthi", parts:["na","atthi"], rule:"省音写法：n'atthi = na + atthi。"},
      "neva":{before:"na + eva", parts:["na","eva"], rule:"元音结合：na + eva → neva。"},
      "ceva":{before:"ca + eva", parts:["ca","eva"], rule:"元音结合：ca + eva → ceva。"},
      "tveva":{before:"tu + eva", parts:["tu","eva"], rule:"tu + eva 常合写为 tveva。"},
      "ti":{before:"iti", parts:["iti"], rule:"引语标记 iti 在佛典中常省作 ti。"},
      "sopi":{before:"so + api / so + pi", parts:["so","api","pi"], rule:"代词或小品词相接，可合写为 sopi。"},
      "tampi":{before:"taṃ + api / taṃ + pi", parts:["taṃ","api","pi"], rule:"taṃ 与 pi/api 连用时可合写。"},
      "ahañca":{before:"ahaṃ + ca", parts:["ahaṃ","ca"], rule:"ṃ 在 c 前常同化为 ñ：ahaṃ + ca → ahañca。"}
    };
    if(exact[lower])c.push({after:raw,...exact[lower], confidence:"常见固定形式"});

    // -ṃ + ca -> -ñca, e.g. dhammaṃ + ca -> dhammañca
    let m=raw.match(/^(.+?)ñca$/i);
    if(m){
      const stem=m[1];
      const base=capLike(stem+"ṃ", raw);
      c.push({after:raw,before:`${base} + ca`,parts:[base,"ca"],rule:"鼻音同化：词尾 ṃ 遇到 c，常写作 ñc；所以 -ñca 可还原为 -ṃ + ca。",confidence:"高"});
    }
    m=raw.match(/^(.+?)ñceva$/i);
    if(m){
      const stem=m[1];
      const base=capLike(stem+"ṃ", raw);
      c.push({after:raw,before:`${base} + ca + eva`,parts:[base,"ca","eva"],rule:"复合音变：-ṃ + ca + eva 可合写为 -ñceva。",confidence:"中高"});
    }
    // -ssa + eva -> -sseva, e.g. tassa + eva -> tasseva
    m=raw.match(/^(.+?)sseva$/i);
    if(m){
      const base=capLike(m[1]+"ssa", raw);
      c.push({after:raw,before:`${base} + eva`,parts:[base,"eva"],rule:"元音结合：-ssa + eva 常合写为 -sseva。",confidence:"中"});
    }
    // -aṃ + eva -> -ameva, e.g. dhammaṃ eva -> dhammameva; taṃ eva -> tameva
    m=raw.match(/^(.+?)meva$/i);
    if(m){
      const stem=m[1];
      if(stem.length>=1){
        const base1=capLike(stem+"ṃ", raw);
        c.push({after:raw,before:`${base1} + eva`,parts:[base1,"eva"],rule:"ṃ + eva 可表现为 meva；需结合词典判断是否真为音变。",confidence:"中"});
      }
    }
    // ca/vā/so + ahaṃ patterns with āhaṃ
    m=raw.match(/^(.+?)āhaṃ$/i);
    if(m){
      const stem=m[1];
      const candidates={"c":"ca","v":"vā","sv":"so"};
      if(candidates[stem.toLowerCase()]){
        const p=candidates[stem.toLowerCase()];
        c.push({after:raw,before:`${p} + ahaṃ`,parts:[p,"ahaṃ"],rule:"a/ā 与 ahaṃ 相接时可出现 āhaṃ 类合音。",confidence:"中"});
      }
    }
    // niggahīta assimilation before guttural/palatal/retroflex/dental/labial
    const assimilation=[
      ["ṅk","ṃ + k","ṃ 在 k 前同化为 ṅ"],
      ["ṅg","ṃ + g","ṃ 在 g 前同化为 ṅ"],
      ["ñc","ṃ + c","ṃ 在 c 前同化为 ñ"],
      ["ñj","ṃ + j","ṃ 在 j 前同化为 ñ"],
      ["ṇṭ","ṃ + ṭ","ṃ 在 ṭ 前同化为 ṇ"],
      ["ṇḍ","ṃ + ḍ","ṃ 在 ḍ 前同化为 ṇ"],
      ["nt","ṃ + t","ṃ 在 t 前可写作 n"],
      ["nd","ṃ + d","ṃ 在 d 前可写作 n"],
      ["mp","ṃ + p","ṃ 在 p 前可写作 m"],
      ["mb","ṃ + b","ṃ 在 b 前可写作 m"]
    ];
    assimilation.forEach(([seq,before,rule])=>{
      const idx=lower.indexOf(seq);
      if(idx>0){
        const left=raw.slice(0,idx);
        const right=raw.slice(idx+1); // keep second consonant onward
        c.push({after:raw,before:`${left}ṃ + ${right}`,parts:[`${left}ṃ`,right],rule:`鼻音同化线索：${rule}。这只是拆分提示，不一定表示该词必须拆成两个词。`,confidence:"低至中"});
      }
    });

    return uniq(c).slice(0,8);
  }
  function renderSandhiRestoration(raw){
    const cands=sandhiRestoreCandidates(raw);
    if(!cands.length)return "";
    return `<div class="sandhi-restore-box"><h3>可能的音变前词形</h3>
      <div class="sandhi-restore-note">以下是根据常见 sandhi / 音变规则给出的还原线索，不能替代词典和上下文判断。</div>
      ${cands.map(c=>`<div class="sandhi-candidate">
        <div class="sandhi-form-line"><span class="sandhi-after">${esc(c.after)}</span><span class="sandhi-arrow">←</span><span class="sandhi-before">${esc(c.before)}</span><span class="tag-chip">${esc(c.confidence||'可能')}</span></div>
        <div class="sandhi-rule">${esc(c.rule)}</div>
        <div class="sandhi-part-list">${(c.parts||[]).map(p=>`<button type="button" class="sandhi-part-btn" data-sandhi-part="${esc(p)}">${esc(p)}</button>`).join('')}</div>
        ${(c.parts||[]).map(miniGrammar).join('')}
      </div>`).join('')}
    </div>`;
  }
  const originalAnalyze = window.analyzePaliToken;
  window.analyzePaliToken = function(word, targetId="tokenAnalysisPanel"){
    if(typeof originalAnalyze === "function") originalAnalyze.call(window, word, targetId);
    const panel=byId(targetId);
    if(!panel)return;
    const selected=(window.getSelection?window.getSelection().toString():"");
    const raw=normalizeToken(word || byId("paliLookupInput")?.value || selected || "");
    const html=renderSandhiRestoration(raw);
    if(html && !panel.querySelector(".sandhi-restore-box")){
      const firstWarning=panel.querySelector(".analysis-warning, .analysis-result-card");
      if(firstWarning) firstWarning.insertAdjacentHTML("beforebegin", html);
      else panel.insertAdjacentHTML("beforeend", html);
    }
  };
  document.addEventListener("click",function(e){
    const btn=e.target.closest("[data-sandhi-part]");
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const part=btn.dataset.sandhiPart;
    const input=byId("paliLookupInput");
    if(input)input.value=part;
    window.analyzePaliToken(part);
  },true);
  window.__paliSandhiRestore={sandhiRestoreCandidates,renderSandhiRestoration};
})();
/* ===== Pāli Learning Lab 13.5: learning route final fix ===== */
(function(){
  let activeRouteId = 'zero';

  function byId(id){return document.getElementById(id);}
  function esc(s){return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
  function routes(){try{return Array.isArray(LEARNING_ROUTES)?LEARNING_ROUTES:[];}catch(e){return [];}}
  function grammarList(){try{return Array.isArray(GRAMMAR)?GRAMMAR:[];}catch(e){return [];}}
  function safeSwitch(id){
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    const target=byId(id)||byId('homeView');
    if(target)target.classList.remove('hidden');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function lessonById(id){
    return grammarList().find(x=>String(x.id)===String(id));
  }
  function lessonButton(id){
    const l=lessonById(id);
    if(!l){
      return `<span class="route-empty-note">语法点 ${esc(id)} 未找到</span>`;
    }
    return `<button type="button" class="route-lesson-jump" data-route-lesson="${esc(id)}">${esc(l.lesson_number||'')}. ${esc(l.title||'')}</button>`;
  }
  function renderRouteTabs(){
    const tabBox=byId('routeTabs');
    if(!tabBox)return;
    const rs=routes();
    if(!rs.length){
      tabBox.innerHTML='';
      return;
    }
    if(!rs.some(r=>r.id===activeRouteId))activeRouteId=rs[0].id;
    tabBox.innerHTML=rs.map(r=>`<button type="button" class="route-tab-btn ${r.id===activeRouteId?'active':''}" data-route-tab="${esc(r.id)}">${esc(r.title)}</button>`).join('');
  }
  function renderRouteContent(){
    const box=byId('routeContent') || byId('learningRouteContent') || byId('learningRouteList') || byId('routeList');
    if(!box)return;
    const rs=routes();
    if(!rs.length){
      box.innerHTML='<p class="route-empty-note">暂无学习路线。请确认 learning-routes-data.js 已上传。</p>';
      return;
    }
    const route=rs.find(r=>r.id===activeRouteId) || rs[0];
    activeRouteId=route.id;
    box.innerHTML=`<div class="route-full-card">
      <h3>${esc(route.title)}</h3>
      <p class="muted">${esc(route.desc||'')}</p>
      ${(route.steps||[]).map((step,i)=>`<div class="route-step-card">
        <div class="route-step-number">${i+1}</div>
        <div class="route-step-main">
          <h4>${esc(step.title||'')}</h4>
          <p>${esc(step.desc||'')}</p>
          <div class="route-lesson-list">${(step.lesson_ids||[]).map(lessonButton).join('')}</div>
        </div>
      </div>`).join('')}
    </div>`;
  }
  function renderLearningRoutesFinal(preferredId){
    if(preferredId)activeRouteId=preferredId;
    renderRouteTabs();
    renderRouteContent();
  }
  function setCurrentLesson(id){
    window.__paliCurrentLessonId=id;
    try{if(typeof currentLesson!=='undefined')currentLesson=lessonById(id)||currentLesson;}catch(e){}
  }
  function openLessonFromRoute(id){
    const l=lessonById(id);
    if(!l)return;
    window.__paliLastView='learningRouteView';
    setCurrentLesson(l.id);
    try{
      if(typeof openLesson==='function'){
        openLesson(l.id);
        setCurrentLesson(l.id);
        safeSwitch('lessonView');
        if(window.__paliQA&&typeof window.__paliQA.updateLessonNav==='function')setTimeout(window.__paliQA.updateLessonNav,30);
        return;
      }
    }catch(e){console.warn('openLesson failed from route', e);}
    if(byId('lessonTitle'))byId('lessonTitle').textContent=l.title||'';
    if(byId('lessonModule'))byId('lessonModule').textContent=l.module||'';
    if(byId('lessonMeta'))byId('lessonMeta').textContent=[l.category,l.difficulty||l.level].filter(Boolean).join('｜');
    if(byId('lessonSummary'))byId('lessonSummary').textContent=l.summary||'';
    if(byId('lessonExplanation'))byId('lessonExplanation').innerHTML=(l.explanation||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    if(byId('lessonExamples'))byId('lessonExamples').innerHTML=(l.examples||[]).map(e=>`<div class="example"><p class="pali">${esc(e.pali||'')}</p><p>${esc(e.cn||e.natural_cn||'')}</p><p class="muted">${esc(e.note||e.grammar_note||'')}</p></div>`).join('');
    safeSwitch('lessonView');
  }

  // 覆盖旧函数，避免旧函数只渲染一句话或找错容器
  window.renderLearningRoutes = renderLearningRoutesFinal;

  document.addEventListener('click',function(e){
    const action=e.target.closest('[data-action]');
    if(action && action.dataset.action==='learningRoute'){
      e.preventDefault();
      e.stopImmediatePropagation();
      safeSwitch('learningRouteView');
      setTimeout(()=>renderLearningRoutesFinal('zero'),0);
      return;
    }
    const tab=e.target.closest('[data-route-tab]');
    if(tab){
      e.preventDefault();
      e.stopImmediatePropagation();
      renderLearningRoutesFinal(tab.dataset.routeTab);
      return;
    }
    const lesson=e.target.closest('[data-route-lesson]');
    if(lesson){
      e.preventDefault();
      e.stopImmediatePropagation();
      openLessonFromRoute(lesson.dataset.routeLesson);
      return;
    }
  },true);

  window.addEventListener('DOMContentLoaded',function(){
    const badge=document.querySelector('.visual-version-badge');
    if(badge)badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';
    if(!byId('learningRouteView')?.classList.contains('hidden'))renderLearningRoutesFinal('zero');
  });

  window.__paliRouteFinal={renderLearningRoutesFinal,openLessonFromRoute};
})();
/* ===== Pāli Learning Lab 13.8: dictionary direct-search patch ===== */
(function(){
  const MAIN_DICTS = [
    {id:'sutta', name:'巴利字典', base:'https://dictionary.sutta.org/', url:function(w){return w ? 'https://dictionary.sutta.org/?q='+encodeURIComponent(w) : 'https://dictionary.sutta.org/';}},
    {id:'dpd', name:'DPD', base:'https://dpdict.net/', url:function(w){return w ? 'https://dpdict.net/?q='+encodeURIComponent(w) : 'https://dpdict.net/';}},
    {id:'pts', name:'PTS', base:'https://dsal.uchicago.edu/dictionaries/pali/', url:function(w){return w ? 'https://dsal.uchicago.edu/cgi-bin/app/pali_query.py?matchtype=exact&qs='+encodeURIComponent(w)+'&searchhws=yes' : 'https://dsal.uchicago.edu/dictionaries/pali/';}}
  ];
  function byId(id){return document.getElementById(id);}
  function word(){return (byId('paliLookupInput')?.value||'').trim();}
  function copyText(text){
    if(!text)return Promise.resolve();
    if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text));
    return fallbackCopy(text);
  }
  function fallbackCopy(text){
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
    return Promise.resolve();
  }
  function updateDirectLinks(){
    const w=word();
    const sutta=byId('directSuttaDictLink'), dpd=byId('directDpdDictLink'), pts=byId('directPtsDictLink');
    if(sutta)sutta.href=MAIN_DICTS[0].url(w);
    if(dpd)dpd.href=MAIN_DICTS[1].url(w);
    if(pts)pts.href=MAIN_DICTS[2].url(w);
  }
  function renderLetters(){
    const box=byId('paliLetterButtons');
    if(!box)return;
    const letters=['ā','ī','ū','ṅ','ñ','ṭ','ḍ','ṇ','ḷ','ṃ'];
    box.innerHTML=letters.map(ch=>`<button type="button" class="letter-btn" data-copy-letter="${ch}" title="点击复制 ${ch}">${ch}</button>`).join('');
  }
  function showNotice(msg){
    const box=byId('fuzzyLookupSuggestions');
    if(box)box.insertAdjacentHTML('afterbegin',`<div class="fuzzy-box"><strong>提示：</strong><div class="open-all-warning">${msg}</div></div>`);
  }
  function openPrimary(){
    const w=word();
    copyText(w);
    updateDirectLinks();
    window.open(MAIN_DICTS[0].url(w),'_blank','noopener');
    if(w)showNotice(`已复制“${w}”，并尝试在巴利字典中直接检索。若词典未自动填入，请粘贴搜索。`);
  }
  function openThree(){
    const w=word();
    copyText(w);
    updateDirectLinks();
    const urls=MAIN_DICTS.map(d=>d.url(w));
    let opened=0;
    urls.forEach(u=>{
      const win=window.open(u,'_blank','noopener');
      if(win)opened++;
    });
    if(opened<3){
      showNotice('浏览器可能拦截了多个窗口。上方三个词典链接已经带入搜索词，可逐个点击打开。');
    }else{
      showNotice(w ? `已复制“${w}”，并尝试打开三个词典直达检索页。` : '已尝试打开三个词典。');
    }
  }
  function clearAll(){
    const input=byId('paliLookupInput');
    if(input){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}
    const panel=byId('tokenAnalysisPanel'); if(panel)panel.innerHTML='';
    const sug=byId('fuzzyLookupSuggestions'); if(sug)sug.innerHTML='';
    updateDirectLinks();
  }
  function setup(){
    renderLetters();
    updateDirectLinks();
  }
  document.addEventListener('input',function(e){
    if(e.target&&e.target.id==='paliLookupInput')updateDirectLinks();
  },true);
  document.addEventListener('click',function(e){
    const letter=e.target.closest('[data-copy-letter]');
    if(letter){e.preventDefault();e.stopImmediatePropagation();copyText(letter.dataset.copyLetter);return;}
    const direct=e.target.closest('#directSuttaDictLink,#directDpdDictLink,#directPtsDictLink');
    if(direct){copyText(word());return;}
    const btn=e.target.closest('button[id],a[id]');
    if(!btn)return;
    if(btn.id==='openPrimaryDictBtn'){e.preventDefault();e.stopImmediatePropagation();openPrimary();return;}
    if(btn.id==='openAllDictsBtn'){e.preventDefault();e.stopImmediatePropagation();openThree();return;}
    if(btn.id==='clearLookupWordBtn'){e.preventDefault();e.stopImmediatePropagation();clearAll();return;}
  },true);
  window.addEventListener('DOMContentLoaded',function(){
    const badge=document.querySelector('.visual-version-badge');
    if(badge)badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';
    setup();
  });
  document.addEventListener('click',function(e){
    const action=e.target.closest('[data-action]');
    if(action&&action.dataset.action==='dictionaryLookup')setTimeout(setup,120);
  },true);
  window.__paliDictionaryDirect={MAIN_DICTS,updateDirectLinks,openPrimary,openThree,setup};
})();


/* ===== Pāli Learning Lab 14.2: navigation enhancement patch ===== */
(function(){
  function byId14(id){return document.getElementById(id);}
  window.__viewHistory = window.__viewHistory || [];
  if(typeof safeSwitch === "function" && !window.__safeSwitchPatched14){
    const __origSafeSwitch14 = safeSwitch;
    safeSwitch = function(id){
      try{
        const current = typeof currentVisibleView === "function" ? currentVisibleView() : null;
        if(current && current !== id){
          const stack = window.__viewHistory || (window.__viewHistory = []);
          if(!stack.length || stack[stack.length-1] !== current){
            stack.push(current);
            if(stack.length > 80) stack.shift();
          }
        }
      }catch(e){}
      return __origSafeSwitch14(id);
    };
    window.__safeSwitchPatched14 = true;
  }

  function goBackView14(){
    const stack = window.__viewHistory || [];
    while(stack.length){
      const prev = stack.pop();
      if(prev && document.getElementById(prev)){
        safeSwitch(prev);
        return;
      }
    }
    safeSwitch('homeView');
  }

  function updateBackTopBtn14(){
    const btn = byId14('globalBackToTopBtn');
    if(!btn) return;
    const view = typeof currentVisibleView === "function" ? currentVisibleView() : 'homeView';
    const shouldShow = window.scrollY > 260 && view !== 'homeView';
    btn.classList.toggle('show', !!shouldShow);
  }

  function syncBottomLessonNav14(){
    const topPrev = byId14('prevLessonBtn');
    const topNext = byId14('nextLessonBtn');
    const bottomPrev = byId14('prevLessonBottomBtn');
    const bottomNext = byId14('nextLessonBottomBtn');
    const bottomBack = byId14('lessonBackBottomBtn');
    const bottomHome = byId14('lessonHomeBottomBtn');
    if(bottomPrev && topPrev){
      bottomPrev.textContent = topPrev.textContent || '上一节';
      bottomPrev.title = topPrev.title || '';
      bottomPrev.disabled = !!topPrev.disabled || topPrev.classList.contains('nav-disabled');
      bottomPrev.classList.toggle('nav-disabled', bottomPrev.disabled);
    }
    if(bottomNext && topNext){
      bottomNext.textContent = topNext.textContent || '下一节';
      bottomNext.title = topNext.title || '';
      bottomNext.disabled = !!topNext.disabled || topNext.classList.contains('nav-disabled');
      bottomNext.classList.toggle('nav-disabled', bottomNext.disabled);
    }
    if(bottomBack){
      bottomBack.onclick = function(){ goBackView14(); };
    }
    if(bottomHome){
      bottomHome.onclick = function(){ safeSwitch('homeView'); };
    }
  }

  function bindBottomNav14(){
    const bottomPrev = byId14('prevLessonBottomBtn');
    const bottomNext = byId14('nextLessonBottomBtn');
    const bottomBack = byId14('lessonBackBottomBtn');
    const bottomHome = byId14('lessonHomeBottomBtn');
    if(bottomPrev && !bottomPrev.dataset.bound14){
      bottomPrev.dataset.bound14 = '1';
      bottomPrev.addEventListener('click', function(){
        if(this.disabled || this.classList.contains('nav-disabled')) return;
        if(typeof jumpLesson === "function") jumpLesson(-1);
      });
    }
    if(bottomNext && !bottomNext.dataset.bound14){
      bottomNext.dataset.bound14 = '1';
      bottomNext.addEventListener('click', function(){
        if(this.disabled || this.classList.contains('nav-disabled')) return;
        if(typeof jumpLesson === "function") jumpLesson(1);
      });
    }
    if(bottomBack && !bottomBack.dataset.bound14){
      bottomBack.dataset.bound14 = '1';
      bottomBack.addEventListener('click', function(){ goBackView14(); });
    }
    if(bottomHome && !bottomHome.dataset.bound14){
      bottomHome.dataset.bound14 = '1';
      bottomHome.addEventListener('click', function(){ safeSwitch('homeView'); });
    }
  }

  if(typeof updateLessonNav === "function" && !window.__lessonNavPatched14){
    const __origUpdateLessonNav14 = updateLessonNav;
    updateLessonNav = function(){
      const r = __origUpdateLessonNav14.apply(this, arguments);
      try{ bindBottomNav14(); syncBottomLessonNav14(); }catch(e){}
      return r;
    };
    window.__lessonNavPatched14 = true;
  }

  window.addEventListener('DOMContentLoaded', function(){
    const topBtn = byId14('globalBackToTopBtn');
    if(topBtn && !topBtn.dataset.bound14){
      topBtn.dataset.bound14 = '1';
      topBtn.addEventListener('click', function(){
        window.scrollTo({top:0, behavior:'smooth'});
      });
    }
    bindBottomNav14();
    syncBottomLessonNav14();
    updateBackTopBtn14();
  });
  window.addEventListener('scroll', updateBackTopBtn14, {passive:true});
  document.addEventListener('click', function(){ setTimeout(function(){ syncBottomLessonNav14(); updateBackTopBtn14(); }, 80); }, true);
  document.addEventListener('change', function(){ setTimeout(function(){ syncBottomLessonNav14(); updateBackTopBtn14(); }, 80); }, true);
  window.addEventListener('hashchange', function(){ setTimeout(updateBackTopBtn14, 80); });
})();


/* ===== Pāli Learning Lab 14.3: concept links and previous-parent navigation patch ===== */
(function(){
  const CONCEPTS = {
    "主语": {
      en:"subject",
      def:"句子中发出动作、承载状态或被说明的成分。巴利语中常由主格名词或代词承担，但主语也可能因上下文省略。",
      example:"Buddho dhammaṃ deseti. 其中 Buddho 是主语。",
      tip:"不要把中文译文中的第一个词机械当作主语；应看词形、格位和谓语关系。"
    },
    "宾语": {
      en:"object",
      def:"动作直接涉及的对象。巴利语中常由宾格表示，但并非所有宾格都只能翻译成中文宾语。",
      example:"dhammaṃ suṇāti 中 dhammaṃ 是宾语。",
      tip:"判断宾语时，要同时看动词语义和名词格位。"
    },
    "谓语": {
      en:"predicate",
      def:"说明主语动作、状态或存在的核心部分。巴利语中常由限定动词承担，也可能由系词省略后的名词或形容词结构承担。",
      example:"gacchati 可以作谓语，表示“去”。",
      tip:"不要只找中文里的“是”；巴利语很多句子没有显性系词。"
    },
    "格位": {
      en:"case",
      def:"名词、代词、形容词等通过词尾变化表示的句法关系，如主格、宾格、工具格、属格、处格等。",
      example:"Buddho 是主格，dhammaṃ 是宾格。",
      tip:"格位是巴利语阅读的核心。先判断词尾，再结合语义，不要只靠中文译文。"
    },
    "主格": {
      en:"nominative",
      def:"常用来标记主语或被说明对象的格位。",
      example:"Buddho 中 -o 常见于 a 尾m.sg.nom。",
      tip:"主格不等于所有句子的第一个词，要观察词尾和句法功能。"
    },
    "宾格": {
      en:"accusative",
      def:"常用来标记动作对象、方向目标或范围的格位。",
      example:"dhammaṃ 中 -aṃ 是 a 尾阳性/中性名词常见sg.acc形式。",
      tip:"宾格不总是中文宾语，也可能表示方向或时间范围。"
    },
    "工具格": {
      en:"instrumental",
      def:"常表示手段、工具、伴随、原因等关系。",
      example:"paññāya 可表示“以智慧、凭智慧”。",
      tip:"工具格不要只译成“用……”，还要观察上下文关系。"
    },
    "与格": {
      en:"dative",
      def:"常表示给予对象、目的、利益归向等。",
      example:"buddhassa 可在某些范畴中表示“给佛、为了佛”，需结合具体词形判断。",
      tip:"与格和属格在部分形式上可能相同，不能脱离上下文。"
    },
    "属格": {
      en:"genitive",
      def:"常表示所属、关联、范围等。",
      example:"buddhassa dhammo 可理解为“佛的法”。",
      tip:"属格不一定都是现代汉语“的”，也可能表示更宽泛的关系。"
    },
    "处格": {
      en:"locative",
      def:"常表示地点、范围、时间或语境。",
      example:"vihāre 可表示“在寺院中”。",
      tip:"处格不只表示地点，也可能表示“在某一方面/某种条件中”。"
    },
    "离格": {
      en:"ablative",
      def:"常表示从……离开、原因、来源、比较基点等。",
      example:"dukkhā 可表示“从苦、由于苦”等，需要观察语境。",
      tip:"离格的语义范围比中文“从”更宽。"
    },
    "呼格": {
      en:"vocative",
      def:"用于称呼对象。",
      example:"bhikkhave 是佛典中常见呼格，意为“诸比丘啊”。",
      tip:"呼格常出现在说法开头或对话中。"
    },
    "名词": {
      en:"noun",
      def:"表示人、事物、概念等的词类。巴利语名词通常要观察性、数、格。",
      example:"Buddha, dhamma, saṅgha 都可作为名词学习。",
      tip:"学习巴利名词时，不要只背词义，更要观察词干和词尾。"
    },
    "动词": {
      en:"verb",
      def:"表示动作、状态、发生、存在等的词类。巴利语动词通常体现人称、数、时态/语气等信息。",
      example:"gacchati 表示“他/她/它去”。",
      tip:"动词经常决定句子的基本结构。"
    },
    "词干": {
      en:"stem",
      def:"去掉屈折词尾后较稳定的词形基础。",
      example:"Buddha- 是 Buddha 相关变格形式的词干。",
      tip:"不要把词典形和所有变格形式混为一谈。"
    },
    "词尾": {
      en:"ending",
      def:"附在词干后，用来表示格、数、人称等语法信息的部分。",
      example:"Buddho 中 -o 可视为sg.nom词尾。",
      tip:"词尾是判断语法功能的重要线索。"
    },
    "变格": {
      en:"declension",
      def:"名词、代词、形容词等根据格、数、性发生的词形变化。",
      example:"Buddho, Buddhaṃ, Buddhena 属于同一名词的不同变格形式。",
      tip:"变格主要服务于句法关系判断。"
    },
    "变位": {
      en:"conjugation",
      def:"动词根据人称、数、时态、语气等发生的词形变化。",
      example:"gacchati, gacchanti 是动词的不同变位形式。",
      tip:"变位主要帮助判断谓语和主语关系。"
    },
    "ind.": {
      en:"indeclinable",
      def:"通常不随格、数、性等变化的词，如 ca、vā、eva、iti 等。",
      example:"ca 常表示“和、也”。",
      tip:"ind.小，但在佛典句式中很关键。"
    },
    "分词": {
      en:"participle",
      def:"带有动词性质又常具有形容词/名词功能的形式。",
      example:"gata 可表示“已去的”。",
      tip:"分词需要同时看动作意义和修饰/句法功能。"
    },
    "inf.": {
      en:"infinitive",
      def:"常表示目的、趋向或补足意义的非限定动词形式。",
      example:"kātuṃ 可表示“为了做、去做”。",
      tip:"inf.不是限定谓语，不能直接按一般动词变位理解。"
    },
    "ger.": {
      en:"absolutive / gerund",
      def:"表示先行动作或伴随动作的非限定形式。",
      example:"gantvā 可表示“去了以后”。",
      tip:"ger.常用于叙事链条中。"
    },
    "音变": {
      en:"sandhi / phonological change",
      def:"词与词或音节相接时发生的读音与书写变化。",
      example:"dhammaṃ + ca 可写作 dhammañca。",
      tip:"看到音变后词形时，要尝试还原音变前成分再查词典。"
    },
    "连声": {
      en:"sandhi",
      def:"相邻词或音节在连接处发生的音变现象。",
      example:"ca + eva → ceva。",
      tip:"连声还原是佛典阅读和查词的重要步骤。"
    },
    "阴性": {
      en:"feminine gender",
      def:"巴利语名词的语法性之一，不一定等同于自然性别。",
      example:"paññā 是常见阴性名词。",
      tip:"语法性影响变格形式。"
    },
    "阳性": {
      en:"masculine gender",
      def:"巴利语名词的语法性之一。",
      example:"Buddha 是常见 a 尾阳性名词。",
      tip:"a 尾阳性名词变格是入门重点。"
    },
    "中性": {
      en:"neuter gender",
      def:"巴利语名词的语法性之一。",
      example:"phala 是常见中性名词。",
      tip:"中性名词主格和宾格形式常相同。"
    },
    "单数": {
      en:"singular",
      def:"表示一个对象或单一概念的数。",
      example:"Buddho 是单数形式。",
      tip:"单数/复数会影响词尾和动词配合。"
    },
    "复数": {
      en:"plural",
      def:"表示多个对象的数。",
      example:"Buddhā 可为复数主格形式。",
      tip:"复数判断要观察词尾，不能只靠中文。"
    },
    "数": {
      en:"number",
      def:"表示单数或复数这一语法范畴。",
      example:"-ti 和 -anti 可以帮助区分数。",
      tip:"学习动词和名词时，都要同时观察数。"
    },
    "词根": {
      en:"root",
      def:"词汇最基本的意义核心；动词常由词根进一步形成词干。",
      example:"√gam 是“去”的词根。",
      tip:"词根帮助理解词义来源，词干帮助识别具体形式。"
    },
    "人称": {
      en:"person",
      def:"表示说话者、听话者或第三方的语法范畴。",
      example:"-mi、-si、-ti 常分别提示第一、第二、第三人称单数。",
      tip:"看动词时要把人称和数一起判断。"
    },
    "时态": {
      en:"tense",
      def:"表示动作时间或叙述关系的语法范畴。",
      example:"gacchati 表现在类，gacchissati 表将来类。",
      tip:"入门阶段先识别课程要求的形式，不要过早追求复杂分类。"
    },
    "语气": {
      en:"mood",
      def:"表示陈述、命令、可能、愿望等语法功能的范畴。",
      example:"gaccha 可作命令语气，gaccheyya 可作可能/祈愿语气。",
      tip:"语气体现说话者对动作的态度或功能。"
    },
    "语态": {
      en:"voice",
      def:"表示动作承担方式的语法范畴；入门时主要观察主动、中间、被动。",
      example:"gacchati（主动）、labhate（中间）、karīyati（被动）。",
      tip:"本课只要求识别语态差异，不要求深入历史分析。"
    }
  };
  const TERM_ALIASES = {
    "奪格":"离格",
    "夺格":"离格",
    "从格":"离格",
    "连音":"连声",
    "sandhi":"音变",
    "主宾动":"主语",
    "a 尾阳性名词":"阳性",
    "-a 尾阳性名词":"阳性",
    "时态/语气":"时态",
    "词根/词干":"词根"
  };

  function byId143(id){return document.getElementById(id);}
  function esc143(s){return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
  function getConceptKey(term){
    const raw=String(term||'').trim();
    return CONCEPTS[raw] ? raw : (TERM_ALIASES[raw] || raw);
  }
  function currentView143(){
    const v=[...document.querySelectorAll('.view')].find(x=>!x.classList.contains('hidden'));
    return v ? v.id : 'homeView';
  }

  window.__paliHistory143 = window.__paliHistory143 || [];
  window.__paliSuppressHistory143 = false;
  function recordHistory143(target){
    if(window.__paliSuppressHistory143) return;
    const cur=currentView143();
    if(cur && cur!==target){
      const stack=window.__paliHistory143;
      if(!stack.length || stack[stack.length-1]!==cur){
        stack.push(cur);
        if(stack.length>80) stack.shift();
      }
    }
  }
  function patchViewFunctions143(){
    if(typeof switchView==='function' && !window.__switchViewPatched143){
      const old=switchView;
      switchView=function(id){recordHistory143(id); return old(id);};
      window.__switchViewPatched143=true;
    }
    if(typeof safeSwitch==='function' && !window.__safeSwitchPatched143){
      const old=safeSwitch;
      safeSwitch=function(id){recordHistory143(id); return old(id);};
      window.__safeSwitchPatched143=true;
    }
  }
  function goView143(id){
    window.__paliSuppressHistory143=true;
    try{
      if(typeof safeSwitch==='function') safeSwitch(id);
      else if(typeof switchView==='function') switchView(id);
      else {
        document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
        byId143(id)?.classList.remove('hidden');
        window.scrollTo({top:0,behavior:'smooth'});
      }
    }finally{
      setTimeout(()=>{window.__paliSuppressHistory143=false;},0);
    }
  }
  function goPrevious143(){
    const stack=window.__paliHistory143;
    const cur=currentView143();
    while(stack.length){
      const prev=stack.pop();
      if(prev && prev!==cur && byId143(prev)){
        goView143(prev);
        return;
      }
    }
    goParent143();
  }
  function currentLesson143(){
    try{if(typeof currentLesson!=='undefined' && currentLesson && currentLesson.id!=null)return currentLesson;}catch(e){}
    if(window.__paliCurrentLessonId!=null){
      try{const hit=GRAMMAR.find(x=>String(x.id)===String(window.__paliCurrentLessonId));if(hit)return hit;}catch(e){}
    }
    const title=(byId143('lessonTitle')?.textContent||'').trim();
    try{return GRAMMAR.find(x=>(x.title||'').trim()===title)||null;}catch(e){return null;}
  }
  function goParent143(){
    const lesson=currentLesson143();
    if(lesson && lesson.module && typeof openModule==='function'){
      openModule(lesson.module);
    }else{
      goView143('lessonListView');
    }
  }
  function goHome143(){goView143('homeView');}

  function renderConcept143(term){
    const key=getConceptKey(term);
    const c=CONCEPTS[key];
    const title=byId143('conceptTitle');
    const body=byId143('conceptContent');
    if(!title||!body)return;
    if(!c){
      title.textContent=term;
      body.innerHTML=`<div class="concept-definition">暂未收录该术语的解释。可以先回到课程页继续学习。</div>`;
      return;
    }
    title.textContent=key;
    body.innerHTML=`
      <div class="concept-definition">
        <p><strong>英文：</strong>${esc143(c.en||'')}</p>
        <p><strong>解释：</strong>${esc143(c.def||'')}</p>
      </div>
      <table class="concept-table">
        <tr><th>例子</th><td>${esc143(c.example||'')}</td></tr>
        <tr><th>学习提醒</th><td>${esc143(c.tip||'')}</td></tr>
      </table>
      <div class="concept-tip">这是学习型解释，用于帮助理解课程内容；正式研究或论文写作时，仍要结合具体语境和专业语法书判断。</div>`;
  }
  function openConcept143(term){
    recordHistory143('conceptView');
    renderConcept143(term);
    goView143('conceptView');
  }

  function annotateTerms143(root){
    if(!root || root.dataset.termsAnnotated143==='1')return;
    const terms=[...new Set([...Object.keys(CONCEPTS),...Object.keys(TERM_ALIASES)])]
      .filter(t=>t.length>1)
      .sort((a,b)=>b.length-a.length);
    if(!terms.length)return;
    const re=new RegExp(terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const parent=node.parentElement;
        if(!parent || !node.nodeValue.trim())return NodeFilter.FILTER_REJECT;
        if(parent.closest('button,a,input,textarea,select,script,style,.concept-inline-link,.lesson-nav-row,.lesson-bottom-nav,.status-buttons'))return NodeFilter.FILTER_REJECT;
        if(!re.test(node.nodeValue)){re.lastIndex=0;return NodeFilter.FILTER_REJECT;}
        re.lastIndex=0;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const text=node.nodeValue;
      re.lastIndex=0;
      let last=0,m;
      const frag=document.createDocumentFragment();
      while((m=re.exec(text))){
        if(m.index>last)frag.appendChild(document.createTextNode(text.slice(last,m.index)));
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='concept-inline-link';
        btn.dataset.concept=m[0];
        btn.textContent=m[0];
        btn.title='查看概念解释：'+m[0];
        frag.appendChild(btn);
        last=m.index+m[0].length;
      }
      if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag,node);
    });
    root.dataset.termsAnnotated143='1';
  }
  function annotateCurrentLesson143(){
    const view=byId143('lessonView');
    if(!view || view.classList.contains('hidden'))return;
    const card=view.querySelector('.card');
    if(!card)return;
    card.dataset.termsAnnotated143='';
    annotateTerms143(card);
  }

  if(typeof openLesson==='function' && !window.__openLessonPatched143){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const r=oldOpenLesson(id);
      try{window.__paliCurrentLessonId=id;}catch(e){}
      setTimeout(annotateCurrentLesson143,80);
      return r;
    };
    window.__openLessonPatched143=true;
  }

  document.addEventListener('click',function(e){
    const concept=e.target.closest('[data-concept]');
    if(concept){
      e.preventDefault();
      e.stopImmediatePropagation();
      openConcept143(concept.dataset.concept);
      return;
    }
    const idb=e.target.closest('button[id],a[id]');
    if(!idb)return;
    if(['backToListBtn','lessonBackBottomBtn','conceptBackBtn'].includes(idb.id)){
      e.preventDefault();e.stopImmediatePropagation();goPrevious143();return;
    }
    if(['lessonParentTopBtn','lessonParentBottomBtn'].includes(idb.id)){
      e.preventDefault();e.stopImmediatePropagation();goParent143();return;
    }
    if(['conceptHomeBtn'].includes(idb.id)){
      e.preventDefault();e.stopImmediatePropagation();goHome143();return;
    }
  },true);

  window.addEventListener('DOMContentLoaded',function(){
    patchViewFunctions143();
    const badge=document.querySelector('.visual-version-badge');
    if(badge)badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';
    setTimeout(annotateCurrentLesson143,200);
  });
  document.addEventListener('click',function(){setTimeout(annotateCurrentLesson143,160);},true);

  window.__paliConceptNav143={openConcept143,goPrevious143,goParent143,annotateCurrentLesson143,CONCEPTS};
})();


/* ===== Pāli Learning Lab 14.4: bottom prev-next hard fix ===== */
(function(){
  function $(id){return document.getElementById(id);}
  function getGrammar144(){try{return Array.isArray(GRAMMAR)?GRAMMAR:[];}catch(e){return [];}}
  function currentLesson144(){
    try{
      if(typeof currentLesson !== "undefined" && currentLesson && currentLesson.id != null) return currentLesson;
    }catch(e){}
    if(window.__paliCurrentLessonId != null){
      const hit = getGrammar144().find(x => String(x.id) === String(window.__paliCurrentLessonId));
      if(hit) return hit;
    }
    const title = ($('lessonTitle')?.textContent || '').trim();
    if(title){
      const hit = getGrammar144().find(x => (x.title || '').trim() === title);
      if(hit) return hit;
    }
    return null;
  }
  function currentIndex144(){
    const l = currentLesson144();
    if(!l) return -1;
    return getGrammar144().findIndex(x => String(x.id) === String(l.id));
  }
  function openLesson144(id){
    const g = getGrammar144();
    const l = g.find(x => String(x.id) === String(id));
    if(!l) return;
    window.__paliCurrentLessonId = l.id;
    try{
      if(typeof currentLesson !== "undefined") currentLesson = l;
    }catch(e){}
    if(typeof openLesson === "function"){
      openLesson(l.id);
      window.__paliCurrentLessonId = l.id;
      try{ if(typeof currentLesson !== "undefined") currentLesson = l; }catch(e){}
    }
    const view = $('lessonView');
    if(view){
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      view.classList.remove('hidden');
      window.scrollTo({top:0, behavior:'smooth'});
    }
    setTimeout(syncBottomNav144, 80);
  }
  function jumpBottomLesson144(step){
    const g = getGrammar144();
    const idx = currentIndex144();
    if(idx < 0) return;
    const target = g[idx + step];
    if(target) openLesson144(target.id);
  }
  function syncBottomNav144(){
    const g = getGrammar144();
    const idx = currentIndex144();

    const topPrev = $('prevLessonBtn');
    const topNext = $('nextLessonBtn');
    const bottomPrev = $('prevLessonBottomBtn');
    const bottomNext = $('nextLessonBottomBtn');

    const hasPrev = idx > 0;
    const hasNext = idx >= 0 && idx < g.length - 1;

    if(bottomPrev){
      bottomPrev.disabled = false;
      bottomPrev.classList.toggle('nav-disabled', !hasPrev);
      bottomPrev.dataset.disabled = hasPrev ? '0' : '1';
      bottomPrev.textContent = hasPrev ? `上一节：${g[idx-1].lesson_number || idx}` : '上一节';
      bottomPrev.title = hasPrev ? (g[idx-1].title || '') : '';
    }
    if(bottomNext){
      bottomNext.disabled = false;
      bottomNext.classList.toggle('nav-disabled', !hasNext);
      bottomNext.dataset.disabled = hasNext ? '0' : '1';
      bottomNext.textContent = hasNext ? `下一节：${g[idx+1].lesson_number || idx+2}` : '下一节';
      bottomNext.title = hasNext ? (g[idx+1].title || '') : '';
    }

    // 同步顶部按钮状态，避免顶部和底部不一致
    if(topPrev){
      topPrev.disabled = false;
      topPrev.classList.toggle('nav-disabled', !hasPrev);
      topPrev.dataset.disabled = hasPrev ? '0' : '1';
      topPrev.textContent = hasPrev ? `上一节：${g[idx-1].lesson_number || idx}` : '上一节';
      topPrev.title = hasPrev ? (g[idx-1].title || '') : '';
    }
    if(topNext){
      topNext.disabled = false;
      topNext.classList.toggle('nav-disabled', !hasNext);
      topNext.dataset.disabled = hasNext ? '0' : '1';
      topNext.textContent = hasNext ? `下一节：${g[idx+1].lesson_number || idx+2}` : '下一节';
      topNext.title = hasNext ? (g[idx+1].title || '') : '';
    }
  }

  document.addEventListener('click', function(e){
    const prev = e.target.closest('#prevLessonBottomBtn');
    if(prev){
      e.preventDefault();
      e.stopImmediatePropagation();
      if(prev.dataset.disabled !== '1') jumpBottomLesson144(-1);
      return;
    }
    const next = e.target.closest('#nextLessonBottomBtn');
    if(next){
      e.preventDefault();
      e.stopImmediatePropagation();
      if(next.dataset.disabled !== '1') jumpBottomLesson144(1);
      return;
    }
  }, true);

  // 课程打开、顶部按钮点击、返回课程页后都重新同步底部按钮
  document.addEventListener('click', function(e){
    if(e.target.closest('[data-lesson-id], [data-route-lesson], #prevLessonBtn, #nextLessonBtn')){
      setTimeout(syncBottomNav144, 140);
    }
  }, true);
  window.addEventListener('DOMContentLoaded', function(){
    const badge=document.querySelector('.visual-version-badge');
    if(badge) badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';
    syncBottomNav144();
  });
  setInterval(function(){
    const lessonView = $('lessonView');
    if(lessonView && !lessonView.classList.contains('hidden')) syncBottomNav144();
  }, 1200);

  window.__paliBottomNavFix144 = {syncBottomNav144, jumpBottomLesson144, openLesson144};
})();


/* ===== Pāli Learning Lab 14.5: English IPA hover annotation ===== */
(function(){
  const IPA_MAP = {
    "Pāli Learning Lab":"/ˈpɑːli ˈlɜːrnɪŋ læb/",
    "Digital Pāḷi Dictionary":"/ˈdɪdʒɪtəl ˈpɑːli ˈdɪkʃəneri/",
    "Pali-English Dictionary":"/ˈpɑːli ˈɪŋɡlɪʃ ˈdɪkʃəneri/",
    "Pali Chinese Dictionary":"/ˈpɑːli ˌtʃaɪˈniːz ˈdɪkʃəneri/",
    "Pali Dictionary":"/ˈpɑːli ˈdɪkʃəneri/",
    "Pāḷi Dictionary":"/ˈpɑːli ˈdɪkʃəneri/",
    "Digital":"/ˈdɪdʒɪtəl/",
    "Dictionary":"/ˈdɪkʃəneri/",
    "English":"/ˈɪŋɡlɪʃ/",
    "Chinese":"/ˌtʃaɪˈniːz/",
    "Learning":"/ˈlɜːrnɪŋ/",
    "Lab":"/læb/",
    "Type":"/taɪp/",
    "For":"/fɔːr/",
    "IPA":"/ˌaɪ piː ˈeɪ/",
    "PTS":"/ˌpiː tiː ˈes/",
    "DPD":"/ˌdiː piː ˈdiː/",
    "Pali":"/ˈpɑːli/",
    "Pāli":"/ˈpɑːli/",
    "Pāḷi":"/ˈpɑːli/",

    "subject":"/ˈsʌbdʒɪkt/",
    "object":"/ˈɑːbdʒekt/",
    "predicate":"/ˈpredɪkət/",
    "case":"/keɪs/",
    "nominative":"/ˈnɑːmɪnətɪv/",
    "accusative":"/əˈkjuːzətɪv/",
    "instrumental":"/ˌɪnstrəˈmentəl/",
    "dative":"/ˈdeɪtɪv/",
    "genitive":"/ˈdʒenətɪv/",
    "locative":"/ˈlɑːkətɪv/",
    "ablative":"/ˈæblətɪv/",
    "vocative":"/ˈvɑːkətɪv/",
    "noun":"/naʊn/",
    "verb":"/vɜːrb/",
    "adjective":"/ˈædʒɪktɪv/",
    "adverb":"/ˈædvɜːrb/",
    "pronoun":"/ˈproʊnaʊn/",
    "participle":"/ˈpɑːrtɪsɪpəl/",
    "infinitive":"/ɪnˈfɪnətɪv/",
    "absolutive":"/ˈæbsəluːtɪv/",
    "gerund":"/ˈdʒerənd/",
    "declension":"/dɪˈklenʃən/",
    "conjugation":"/ˌkɑːndʒəˈɡeɪʃən/",
    "stem":"/stem/",
    "ending":"/ˈendɪŋ/",
    "singular":"/ˈsɪŋɡjələr/",
    "plural":"/ˈplʊrəl/",
    "masculine":"/ˈmæskjəlɪn/",
    "feminine":"/ˈfemənɪn/",
    "neuter":"/ˈnuːtər/",
    "gender":"/ˈdʒendər/",
    "number":"/ˈnʌmbər/",
    "person":"/ˈpɜːrsən/",
    "tense":"/tens/",
    "mood":"/muːd/",
    "voice":"/vɔɪs/",
    "active":"/ˈæktɪv/",
    "middle":"/ˈmɪdəl/",
    "passive":"/ˈpæsɪv/",
    "present":"/ˈprezənt/",
    "past":"/pæst/",
    "future":"/ˈfjuːtʃər/",
    "imperative":"/ɪmˈperətɪv/",
    "optative":"/ˈɑːptətɪv/",
    "aorist":"/ˈeɪərɪst/",
    "prefix":"/ˈpriːfɪks/",
    "suffix":"/ˈsʌfɪks/",
    "root":"/ruːt/",
    "sandhi":"/ˈsʌndhi/",
    "phonology":"/fəˈnɑːlədʒi/",
    "phonological":"/ˌfoʊnəˈlɑːdʒɪkəl/",
    "morphology":"/mɔːrˈfɑːlədʒi/",
    "morpheme":"/ˈmɔːrfiːm/",
    "syntax":"/ˈsɪntæks/",
    "semantic":"/sɪˈmæntɪk/",
    "semantics":"/sɪˈmæntɪks/",
    "grammar":"/ˈɡræmər/",
    "grammatical":"/ɡrəˈmætɪkəl/",
    "translation":"/trænzˈleɪʃən/",
    "literal":"/ˈlɪtərəl/",
    "natural":"/ˈnætʃərəl/",
    "meaning":"/ˈmiːnɪŋ/",
    "example":"/ɪɡˈzæmpəl/",
    "note":"/noʊt/",
    "formula":"/ˈfɔːrmjələ/",
    "function":"/ˈfʌŋkʃən/",
    "structure":"/ˈstrʌktʃər/",
    "pattern":"/ˈpætərn/",
    "source":"/sɔːrs/",
    "level":"/ˈlevəl/",
    "category":"/ˈkætəɡɔːri/",
    "analysis":"/əˈnæləsɪs/",
    "template":"/ˈtempleɪt/",
    "method":"/ˈmeθəd/",
    "citation":"/saɪˈteɪʃən/",
    "research":"/rɪˈsɜːrtʃ/",
    "training":"/ˈtreɪnɪŋ/",
    "concept":"/ˈkɑːnsept/",
    "terminology":"/ˌtɜːrmɪˈnɑːlədʒi/",
    "glossary":"/ˈɡlɑːsəri/",
    "route":"/ruːt/",
    "module":"/ˈmɑːdjuːl/",
    "lesson":"/ˈlesən/",
    "search":"/sɜːrtʃ/",
    "lookup":"/ˈlʊkʌp/",
    "dictionary":"/ˈdɪkʃəneri/",
    "word":"/wɜːrd/",
    "term":"/tɜːrm/",
    "text":"/tekst/",
    "script":"/skrɪpt/",
    "Sutta":"/ˈsʊtə/",
    "SuttaCentral":"/ˈsʊtə ˈsentrəl/",
    "Buddha":"/ˈbʊdə/",
    "Dhamma":"/ˈdɑːmə/",
    "Saṅgha":"/ˈsʌŋɡə/",
    "Buddhist":"/ˈbʊdɪst/",
    "Canon":"/ˈkænən/",
    "Sutta-piṭaka":"/ˈsʊtə ˈpɪtəkə/",
    "Vinaya":"/vɪˈnʌjə/",
    "Abhidhamma":"/ˌæbɪˈdʌmə/",
    "Nikāya":"/nɪˈkɑːjə/",
    "Dīgha":"/ˈdiːɡə/",
    "Majjhima":"/ˈmɑːdʒɪmə/",
    "Saṃyutta":"/səmˈjʊtə/",
    "Aṅguttara":"/ɑːŋˈɡʊtərə/",
    "Khuddaka":"/ˈkʊdəkə/"
  };

  const PHRASES = Object.keys(IPA_MAP).filter(k=>k.includes(" ")).sort((a,b)=>b.length-a.length);
  const WORDS = Object.keys(IPA_MAP).filter(k=>!k.includes(" ")).sort((a,b)=>b.length-a.length);
  const WORD_RE = new RegExp("\\b(" + WORDS.map(escapeRegExp145).join("|") + ")\\b", "gi");

  function escapeRegExp145(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
  function ipaFor145(token){
    return IPA_MAP[token] || IPA_MAP[token.toLowerCase()] || IPA_MAP[token.charAt(0).toUpperCase()+token.slice(1).toLowerCase()] || "";
  }
  function shouldSkip145(parent){
    if(!parent) return true;
    return !!parent.closest("script,style,input,textarea,select,button,.ipa-hover,.concept-inline-link,.letter-btn,.global-back-top-btn");
  }
  function wrapTextNode145(node){
    const parent=node.parentElement;
    if(shouldSkip145(parent)) return;
    const text=node.nodeValue;
    if(!/[A-Za-z]/.test(text)) return;

    // First handle multi-word phrases.
    let segments=[{text, wrapped:false}];
    PHRASES.forEach(phrase=>{
      const re=new RegExp(escapeRegExp145(phrase),"gi");
      const next=[];
      segments.forEach(seg=>{
        if(seg.wrapped){next.push(seg);return;}
        let last=0,m;
        while((m=re.exec(seg.text))){
          if(m.index>last) next.push({text:seg.text.slice(last,m.index), wrapped:false});
          next.push({text:m[0], wrapped:true, ipa:IPA_MAP[phrase], phrase:true});
          last=m.index+m[0].length;
        }
        if(last<seg.text.length) next.push({text:seg.text.slice(last), wrapped:false});
      });
      segments=next;
    });

    const frag=document.createDocumentFragment();
    segments.forEach(seg=>{
      if(seg.wrapped){
        const span=document.createElement("span");
        span.className="ipa-hover phrase";
        span.title=" "+seg.ipa;
        span.textContent=seg.text;
        frag.appendChild(span);
      }else{
        let s=seg.text, last=0, m;
        WORD_RE.lastIndex=0;
        while((m=WORD_RE.exec(s))){
          if(m.index>last) frag.appendChild(document.createTextNode(s.slice(last,m.index)));
          const ipa=ipaFor145(m[0]);
          if(ipa){
            const span=document.createElement("span");
            span.className="ipa-hover";
            span.title=" "+ipa;
            span.textContent=m[0];
            frag.appendChild(span);
          }else{
            frag.appendChild(document.createTextNode(m[0]));
          }
          last=m.index+m[0].length;
        }
        if(last<s.length) frag.appendChild(document.createTextNode(s.slice(last)));
      }
    });
    node.parentNode.replaceChild(frag,node);
  }
  function annotateIPA145(root){
    root=root||document.body;
    if(!root || root.dataset.ipaAnnotated145==="1") return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        if(!node.nodeValue || !/[A-Za-z]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        if(shouldSkip145(node.parentElement)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(wrapTextNode145);
    root.dataset.ipaAnnotated145="1";
  }
  function annotateVisibleIPA145(){
    document.querySelectorAll(".view:not(.hidden), .visual-version-badge, .hero-subnav, .global-back-top-btn").forEach(el=>{
      el.dataset.ipaAnnotated145="";
      annotateIPA145(el);
    });
  }
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
    setTimeout(annotateVisibleIPA145,200);
  });
  document.addEventListener("click",function(){setTimeout(annotateVisibleIPA145,220);},true);
  document.addEventListener("input",function(){setTimeout(annotateVisibleIPA145,220);},true);
  document.addEventListener("change",function(){setTimeout(annotateVisibleIPA145,220);},true);
  window.__paliIPA145={annotateIPA145,annotateVisibleIPA145,IPA_MAP};
})();


/* ===== Pāli Learning Lab 14.6: dictionary layout simplification patch ===== */
(function(){
  const MAIN_DICTS146 = [
    {id:'sutta', name:'巴利字典', url:function(w){return w ? 'https://dictionary.sutta.org/?q='+encodeURIComponent(w) : 'https://dictionary.sutta.org/';}},
    {id:'dpd', name:'DPD', url:function(w){return w ? 'https://dpdict.net/?q='+encodeURIComponent(w) : 'https://dpdict.net/';}},
    {id:'pts', name:'PTS', url:function(w){return w ? 'https://dsal.uchicago.edu/cgi-bin/app/pali_query.py?matchtype=exact&qs='+encodeURIComponent(w)+'&searchhws=yes' : 'https://dsal.uchicago.edu/dictionaries/pali/';}}
  ];
  function $(id){return document.getElementById(id);}
  function word146(){return ($('paliLookupInput')?.value || '').trim();}
  function copyText146(text){
    if(!text) return Promise.resolve();
    if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(()=>fallbackCopy146(text));
    return fallbackCopy146(text);
  }
  function fallbackCopy146(text){
    const ta=document.createElement('textarea');
    ta.value=text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return Promise.resolve();
  }
  function updateDirectLinks146(){
    const w=word146();
    const sutta=$('directSuttaDictLink'), dpd=$('directDpdDictLink'), pts=$('directPtsDictLink');
    if(sutta) sutta.href=MAIN_DICTS146[0].url(w);
    if(dpd) dpd.href=MAIN_DICTS146[1].url(w);
    if(pts) pts.href=MAIN_DICTS146[2].url(w);
  }
  function setup146(){
    const oldAll=$('openAllDictsBtn');
    if(oldAll) oldAll.remove();
    updateDirectLinks146();
  }
  document.addEventListener('input',function(e){
    if(e.target && e.target.id==='paliLookupInput') updateDirectLinks146();
  },true);
  document.addEventListener('click',function(e){
    const link=e.target.closest('#directSuttaDictLink,#directDpdDictLink,#directPtsDictLink');
    if(link){
      copyText146(word146());
      return;
    }
    const oldAll=e.target.closest('#openAllDictsBtn');
    if(oldAll){
      e.preventDefault();
      e.stopImmediatePropagation();
      oldAll.remove();
      return;
    }
  },true);
  window.addEventListener('DOMContentLoaded',function(){
    const badge=document.querySelector('.visual-version-badge');
    if(badge) badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';
    setup146();
  });
  document.addEventListener('click',function(e){
    const action=e.target.closest('[data-action]');
    if(action && action.dataset.action==='dictionaryLookup') setTimeout(setup146,120);
  },true);
  window.__paliDictionaryLayout146={updateDirectLinks146,MAIN_DICTS146};
})();


/* ===== Pāli Learning Lab 14.9: mobile IPA and responsive terminology patch ===== */
(function(){
  const IPA_MORE = {
    "Pāli Learning Lab":"/ˈpɑːli ˈlɜːrnɪŋ læb/",
    "Digital Pāḷi Dictionary":"/ˈdɪdʒɪtəl ˈpɑːli ˈdɪkʃəneri/",
    "Pali-English Dictionary":"/ˈpɑːli ˈɪŋɡlɪʃ ˈdɪkʃəneri/",
    "Pali Dictionary":"/ˈpɑːli ˈdɪkʃəneri/",
    "Pāḷi Dictionary":"/ˈpɑːli ˈdɪkʃəneri/",
    "Digital":"/ˈdɪdʒɪtəl/",
    "Dictionary":"/ˈdɪkʃəneri/",
    "English":"/ˈɪŋɡlɪʃ/",
    "Chinese":"/ˌtʃaɪˈniːz/",
    "Learning":"/ˈlɜːrnɪŋ/",
    "Lab":"/læb/",
    "Review":"/rɪˈvjuː/",
    "Grammar":"/ˈɡræmər/",
    "Pali":"/ˈpɑːli/",
    "Pāli":"/ˈpɑːli/",
    "Pāḷi":"/ˈpɑːli/",
    "IPA":"/ˌaɪ piː ˈeɪ/",
    "PTS":"/ˌpiː tiː ˈes/",
    "DPD":"/ˌdiː piː ˈdiː/",
    "VRI":"/ˌviː ɑːr ˈaɪ/",
    "Type":"/taɪp/",
    "For":"/fɔːr/",
    "Guide":"/ɡaɪd/",
    "Subject":"/ˈsʌbdʒɪkt/",
    "Object":"/ˈɑːbdʒekt/",
    "Predicate":"/ˈpredɪkət/",
    "Case":"/keɪs/",
    "Nominative":"/ˈnɑːmɪnətɪv/",
    "Accusative":"/əˈkjuːzətɪv/",
    "Genitive":"/ˈdʒenətɪv/",
    "Dative":"/ˈdeɪtɪv/",
    "Locative":"/ˈlɑːkətɪv/",
    "Instrumental":"/ˌɪnstrəˈmentəl/",
    "Ablative":"/ˈæblətɪv/",
    "Vocative":"/ˈvɑːkətɪv/",
    "Noun":"/naʊn/",
    "Verb":"/vɜːrb/",
    "Adjective":"/ˈædʒɪktɪv/",
    "Adverb":"/ˈædvɜːrb/",
    "Pronoun":"/ˈproʊnaʊn/",
    "Participle":"/ˈpɑːrtɪsɪpəl/",
    "Infinitive":"/ɪnˈfɪnətɪv/",
    "Gerund":"/ˈdʒerənd/",
    "Absolutive":"/ˈæbsəluːtɪv/",
    "Declension":"/dɪˈklenʃən/",
    "Conjugation":"/ˌkɑːndʒəˈɡeɪʃən/",
    "Stem":"/stem/",
    "Ending":"/ˈendɪŋ/",
    "Singular":"/ˈsɪŋɡjələr/",
    "Plural":"/ˈplʊrəl/",
    "Masculine":"/ˈmæskjəlɪn/",
    "Feminine":"/ˈfemənɪn/",
    "Neuter":"/ˈnuːtər/",
    "Gender":"/ˈdʒendər/",
    "Number":"/ˈnʌmbər/",
    "Person":"/ˈpɜːrsən/",
    "Tense":"/tens/",
    "Mood":"/muːd/",
    "Voice":"/vɔɪs/",
    "Active":"/ˈæktɪv/",
    "Middle":"/ˈmɪdəl/",
    "Passive":"/ˈpæsɪv/",
    "Present":"/ˈprezənt/",
    "Past":"/pæst/",
    "Future":"/ˈfjuːtʃər/",
    "Imperative":"/ɪmˈperətɪv/",
    "Optative":"/ˈɑːptətɪv/",
    "Aorist":"/ˈeɪərɪst/",
    "Prefix":"/ˈpriːfɪks/",
    "Suffix":"/ˈsʌfɪks/",
    "Root":"/ruːt/",
    "Sandhi":"/ˈsʌndhi/",
    "Phonology":"/fəˈnɑːlədʒi/",
    "Phonological":"/ˌfoʊnəˈlɑːdʒɪkəl/",
    "Morphology":"/mɔːrˈfɑːlədʒi/",
    "Morpheme":"/ˈmɔːrfiːm/",
    "Syntax":"/ˈsɪntæks/",
    "Semantic":"/sɪˈmæntɪk/",
    "Semantics":"/sɪˈmæntɪks/",
    "Grammatical":"/ɡrəˈmætɪkəl/",
    "Translation":"/trænzˈleɪʃən/",
    "Literal":"/ˈlɪtərəl/",
    "Natural":"/ˈnætʃərəl/",
    "Meaning":"/ˈmiːnɪŋ/",
    "Example":"/ɪɡˈzæmpəl/",
    "Note":"/noʊt/",
    "Formula":"/ˈfɔːrmjələ/",
    "Function":"/ˈfʌŋkʃən/",
    "Structure":"/ˈstrʌktʃər/",
    "Pattern":"/ˈpætərn/",
    "Source":"/sɔːrs/",
    "Level":"/ˈlevəl/",
    "Category":"/ˈkætəɡɔːri/",
    "Analysis":"/əˈnæləsɪs/",
    "Template":"/ˈtempleɪt/",
    "Method":"/ˈmeθəd/",
    "Citation":"/saɪˈteɪʃən/",
    "Research":"/rɪˈsɜːrtʃ/",
    "Training":"/ˈtreɪnɪŋ/",
    "Concept":"/ˈkɑːnsept/",
    "Terminology":"/ˌtɜːrmɪˈnɑːlədʒi/",
    "Glossary":"/ˈɡlɑːsəri/",
    "Route":"/ruːt/",
    "Module":"/ˈmɑːdjuːl/",
    "Lesson":"/ˈlesən/",
    "Search":"/sɜːrtʃ/",
    "Lookup":"/ˈlʊkʌp/",
    "Word":"/wɜːrd/",
    "Term":"/tɜːrm/",
    "Text":"/tekst/",
    "Script":"/skrɪpt/",
    "Buddha":"/ˈbʊdə/",
    "Dhamma":"/ˈdɑːmə/",
    "Saṅgha":"/ˈsʌŋɡə/",
    "Buddhist":"/ˈbʊdɪst/",
    "Canon":"/ˈkænən/",
    "Sutta":"/ˈsʊtə/",
    "SuttaCentral":"/ˈsʊtə ˈsentrəl/",
    "Vinaya":"/vɪˈnʌjə/",
    "Abhidhamma":"/ˌæbɪˈdʌmə/",
    "Nikāya":"/nɪˈkɑːjə/",
    "Dīgha":"/ˈdiːɡə/",
    "Majjhima":"/ˈmɑːdʒɪmə/",
    "Saṃyutta":"/səmˈjʊtə/",
    "Aṅguttara":"/ɑːŋˈɡʊtərə/",
    "Khuddaka":"/ˈkʊdəkə/"
  };
  const LETTER_IPA = {A:"eɪ",B:"biː",C:"siː",D:"diː",E:"iː",F:"ef",G:"dʒiː",H:"eɪtʃ",I:"aɪ",J:"dʒeɪ",K:"keɪ",L:"el",M:"em",N:"en",O:"oʊ",P:"piː",Q:"kjuː",R:"ɑːr",S:"es",T:"tiː",U:"juː",V:"viː",W:"ˈdʌbəljuː",X:"eks",Y:"waɪ",Z:"ziː"};
  function escape149(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
  function mergeGlossary149(){
    try{
      if(Array.isArray(TERMINOLOGY_GLOSSARY)){
        TERMINOLOGY_GLOSSARY.forEach(t=>{
          if(t.en && t.ipa) IPA_MORE[t.en]=t.ipa;
        });
      }
    }catch(e){}
  }
  function ipaFor149(token){
    mergeGlossary149();
    if(IPA_MORE[token]) return IPA_MORE[token];
    const cap=token.charAt(0).toUpperCase()+token.slice(1).toLowerCase();
    if(IPA_MORE[cap]) return IPA_MORE[cap];
    if(IPA_MORE[token.toLowerCase()]) return IPA_MORE[token.toLowerCase()];
    if(/^[A-Z]{2,6}$/.test(token)){
      return "/" + token.split("").map(ch=>LETTER_IPA[ch]||ch.toLowerCase()).join(" ") + "/";
    }
    return "";
  }
  function makeWordRE149(){
    mergeGlossary149();
    const words=Object.keys(IPA_MORE).filter(k=>!k.includes(" ")).sort((a,b)=>b.length-a.length);
    return new RegExp("\\b("+words.map(escape149).join("|")+")\\b","gi");
  }
  function shouldSkip149(parent){
    if(!parent) return true;
    return !!parent.closest("script,style,input,textarea,select,button,.ipa-hover,.concept-inline-link,.letter-btn,.global-back-top-btn");
  }
  function wrapNode149(node){
    const parent=node.parentElement;
    if(shouldSkip149(parent)) return;
    const text=node.nodeValue;
    if(!/[A-Za-z]/.test(text)) return;
    const wordRe=makeWordRE149();
    let last=0,m;
    const frag=document.createDocumentFragment();
    wordRe.lastIndex=0;
    while((m=wordRe.exec(text))){
      if(m.index>last) frag.appendChild(document.createTextNode(text.slice(last,m.index)));
      const ipa=ipaFor149(m[0]);
      if(ipa){
        const span=document.createElement("span");
        span.className="ipa-hover";
        span.dataset.ipa=ipa;
        span.title=" "+ipa;
        span.textContent=m[0];
        frag.appendChild(span);
      }else{
        frag.appendChild(document.createTextNode(m[0]));
      }
      last=m.index+m[0].length;
    }
    if(last<text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if(frag.childNodes.length>1) node.parentNode.replaceChild(frag,node);
  }
  function annotate149(root){
    root=root||document.body;
    // Convert existing 14.5 title-only spans into tap-friendly spans.
    root.querySelectorAll(".ipa-hover").forEach(el=>{
      if(!el.dataset.ipa){
        const title=el.getAttribute("title")||"";
        const m=title.match(/\s*(.+)$/);
        if(m) el.dataset.ipa=m[1].trim();
      }
    });
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        if(!node.nodeValue || !/[A-Za-z]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        if(shouldSkip149(node.parentElement)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(wrapNode149);
  }
  function annotateVisible149(){
    document.querySelectorAll(".view:not(.hidden), .visual-version-badge, .hero-subnav").forEach(annotate149);
  }
  function showIPAPopover149(target, clientX, clientY){
    const ipa=target.dataset.ipa || (target.title||"").replace(/^\s*/,"");
    if(!ipa) return;
    document.querySelectorAll(".ipa-touch-popover").forEach(x=>x.remove());
    const pop=document.createElement("div");
    pop.className="ipa-touch-popover";
    pop.innerHTML="<strong>"+target.textContent+"</strong><div> "+ipa+"</div><div class='ipa-pop-note'>点击页面其他位置关闭</div>";
    document.body.appendChild(pop);
    const rect=target.getBoundingClientRect();
    const x=clientX || rect.left + rect.width/2;
    const y=clientY || rect.bottom;
    const pw=pop.offsetWidth, ph=pop.offsetHeight;
    let left=Math.min(Math.max(12, x-pw/2), window.innerWidth-pw-12);
    let top=Math.min(Math.max(12, y+10), window.innerHeight-ph-12);
    pop.style.left=left+"px";
    pop.style.top=top+"px";
  }
  document.addEventListener("click",function(e){
    const target=e.target.closest(".ipa-hover");
    if(target && !target.closest("a,button")){
      e.preventDefault();
      e.stopImmediatePropagation();
      showIPAPopover149(target,e.clientX,e.clientY);
      return;
    }
    if(!e.target.closest(".ipa-touch-popover")){
      document.querySelectorAll(".ipa-touch-popover").forEach(x=>x.remove());
    }
  },true);
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
    setTimeout(annotateVisible149,350);
  });
  document.addEventListener("click",function(){setTimeout(annotateVisible149,260);},true);
  document.addEventListener("input",function(){setTimeout(annotateVisible149,260);},true);
  document.addEventListener("change",function(){setTimeout(annotateVisible149,260);},true);
  window.__paliIPA149={annotate149,annotateVisible149,ipaFor149,IPA_MORE};
})();


/* ===== Pāli Learning Lab 15.5: complete term explanation links ===== */
(function(){
  const EXTRA_CONCEPTS155 = {
    "形态学": {
      en: "morphology",
      def: "研究词的内部结构和词形变化。巴利语里，词根、词干、词尾、屈折、变格、变位等都属于形态学观察范围。",
      example: "Buddha → Buddho / Buddhaṃ / Buddhena，是名词词形变化；gacchati / gacchanti，是动词词形变化。",
      tip: "形态学帮助你先观察清“这个词是什么形式”，再进入句法功能判断。"
    },
    "词根": {
      en: "root",
      def: "词义和派生的基础成分，常用于说明一个词最核心的意义来源。动词和派生词分析中尤其重要。",
      example: "gam- 表示“去、行走”的词根，可见于 gacchati 等形式。",
      tip: "初学时不必强行追每个词根，但遇到动词和派生词时，词根能帮助理解词义网络。"
    },
    "词干": {
      en: "stem",
      def: "去掉具体屈折词尾后较稳定的词形基础。名词变格通常以词干为基础加不同词尾。",
      example: "Buddha- 是 Buddha 一类 a 尾阳性名词的词干。",
      tip: "词干不是完整句中一定出现的表层形式，而是分析词形时使用的基础形式。"
    },
    "词尾": {
      en: "ending",
      def: "附着在词干后、表示格、数、人称、时态等语法信息的成分。",
      example: "Buddho 中的 -o 可提示sg.nom；Buddhaṃ 中的 -aṃ 可提示sg.acc。",
      tip: "巴利语阅读中，词尾往往是判断句法功能的第一线索。"
    },
    "屈折": {
      en: "inflection",
      def: "词在不改变基本词汇意义的情况下，为表达语法关系而发生的形式变化。",
      example: "名词的变格、动词的变位都属于屈折。",
      tip: "屈折关注“语法形式变化”，不是另造一个新词。"
    },
    "变格": {
      en: "declension",
      def: "名词、代词、形容词等根据格、数、性发生的形式变化。",
      example: "Buddho / Buddhaṃ / Buddhena 是同一名词在不同格位中的形式。",
      tip: "变格主要服务于判断名词在句子中的关系。"
    },
    "变位": {
      en: "conjugation",
      def: "动词根据人称、数、时态、语气、语态等发生的形式变化。",
      example: "gacchati / gacchanti 表示动词在数或人称上的不同形式。",
      tip: "变位主要服务于判断谓语、主语配合和动作时间/语气。"
    },
    "句法学": {
      en: "syntax",
      def: "研究词与词如何组合成短语和句子，以及这些成分在句中承担什么功能。",
      example: "Buddho dhammaṃ deseti 中，Buddho 作主语，dhammaṃ 作宾语，deseti 作谓语。",
      tip: "句法学不是只观察词义，而是看词在句子结构中的位置和功能。"
    },
    "主语": {
      en: "subject",
      def: "句子中发出动作、承载状态或被说明的成分。巴利语中常由主格名词或代词承担。",
      example: "Buddho dhammaṃ deseti 中，Buddho 是主语。",
      tip: "不要把中文译文第一个词机械当作主语，要结合词尾和谓语关系判断。"
    },
    "宾语": {
      en: "object",
      def: "动作直接涉及的对象。巴利语中常由宾格表示。",
      example: "dhammaṃ suṇāti 中，dhammaṃ 是宾语。",
      tip: "宾格常作宾语，但宾格也可能表达方向、时间范围等。"
    },
    "谓语": {
      en: "predicate",
      def: "说明主语动作、状态或存在的核心部分，通常由动词或判断结构承担。",
      example: "deseti 是谓语，表示“说、开示”。",
      tip: "谓语是理解句子骨架的关键。"
    },
    "修饰语": {
      en: "modifier",
      def: "对名词、动词或整个成分进行限定、说明、补充的成分。",
      example: "形容词、属格短语、分词短语都可能作修饰语。",
      tip: "修饰语通常不是句子主干，但会影响语义理解。"
    },
    "状语": {
      en: "adverbial",
      def: "说明动作发生的时间、地点、方式、原因、条件等的成分。",
      example: "处格、工具格、离格等有时可形成状语关系。",
      tip: "状语不一定是副词，很多格位短语也能承担状语功能。"
    },
    "格语法": {
      en: "case grammar",
      def: "从格位和语义角色角度观察句子结构的方法。它关注名词成分与动作之间的关系。",
      example: "主格常关联施事或被说明对象，宾格常关联受事对象，工具格常关联手段。",
      tip: "格语法可以帮助理解格位和语义角色，但不能把格位功能和语义角色完全等同。"
    },
    "主格": {
      en: "nominative",
      def: "常用于标记主语或被说明对象的格位。",
      example: "Buddho 中 -o 常见于 a 尾m.sg.nom。",
      tip: "主格常作主语，但仍要结合谓语和语境判断。"
    },
    "宾格": {
      en: "accusative",
      def: "常用于标记动作对象、方向目标或范围。",
      example: "dhammaṃ 中 -aṃ 是常见sg.acc形式。",
      tip: "宾格不总是中文意义上的宾语。"
    },
    "工具格": {
      en: "instrumental",
      def: "常表示工具、手段、伴随、原因等关系。",
      example: "paññāya 可表示“以智慧、凭智慧”。",
      tip: "工具格不要只译成“用……”，要观察语义关系。"
    },
    "与格": {
      en: "dative",
      def: "常表示给予对象、目的、利益归向等关系。",
      example: "某些 -ssa 形式需结合上下文判断是属格还是与格。",
      tip: "与格和属格在部分词形上可能相同。"
    },
    "从格": {
      en: "ablative",
      def: "也称离格，常表示来源、离开、原因、比较基点等。",
      example: "dukkhā 可在语境中表示“从苦、由于苦”等关系。",
      tip: "从格的功能比中文“从……”更宽。"
    },
    "属格": {
      en: "genitive",
      def: "常表示所属、关联、范围等关系。",
      example: "buddhassa dhammo 可理解为“佛的法”。",
      tip: "属格不一定只能译成“的”。"
    },
    "处格": {
      en: "locative",
      def: "常表示地点、范围、时间或语境。",
      example: "vihāre 可表示“在寺院中”。",
      tip: "处格也可表示抽象范围。"
    },
    "呼格": {
      en: "vocative",
      def: "用于称呼对象。",
      example: "bhikkhave 是佛典中常见呼格，意为“诸比丘啊”。",
      tip: "呼格常见于佛典开头和对话场景。"
    },
    "动词系统": {
      en: "verbal system",
      def: "动词形式构成和功能的整体系统，包括限定动词、非限定动词、inf.、ger.、分词等。",
      example: "gacchati 是限定动词；gantvā 是ger.；gata 是分词。",
      tip: "学习动词系统时，要区分“能不能直接作谓语”。"
    },
    "动词": {
      en: "verb",
      def: "表示动作、状态、发生、存在等意义的词类。",
      example: "gacchati 表示“去”。",
      tip: "动词往往决定句子的核心结构。"
    },
    "限定动词": {
      en: "finite verb",
      def: "具有人称、数、时态或语气等限定信息，通常可以直接作句子的谓语。",
      example: "gacchati 是限定动词，可作谓语。",
      tip: "限定动词是找句子主干的关键。"
    },
    "非限定动词": {
      en: "non-finite verb",
      def: "不完全具有人称、数等限定信息，通常不能单独作完整谓语。",
      example: "inf.、ger.、分词都可属于非限定动词形式。",
      tip: "非限定动词常承担补充动作、修饰或连接叙事的功能。"
    },
    "inf.": {
      en: "infinitive",
      def: "常表示目的、趋向或补足意义的非限定动词形式。",
      example: "kātuṃ 可表示“为了做、去做”。",
      tip: "inf.不能直接按普通限定动词理解。"
    },
    "ger.": {
      en: "absolutive / gerund",
      def: "常表示先行动作、伴随动作或动作链条的非限定形式。",
      example: "gantvā 可表示“去了以后”。",
      tip: "佛典叙事中ger.很常见，用来串联动作。"
    },
    "分词": {
      en: "participle",
      def: "兼具动词意义和形容词/名词功能的形式。",
      example: "gata 可表示“已去的”。",
      tip: "分词要同时看动作意义和修饰功能。"
    },
    "音系": {
      en: "phonology",
      def: "研究一种语言中音位、音节、重音、长短元音、鼻音等声音系统。",
      example: "巴利语中长短元音差别会影响词形和读音。",
      tip: "音系知识有助于理解拼写、读音和音变。"
    },
    "音变": {
      en: "sound change / sandhi",
      def: "语音或拼写在相邻音节、词语连接时发生的变化。",
      example: "dhammaṃ + ca → dhammañca。",
      tip: "查词时遇到音变形式，要尝试还原音变前词形。"
    },
    "sandhi": {
      en: "sandhi",
      def: "连声或音变，指词与词、音节与音节连接处发生的音变。",
      example: "ca + eva → ceva。",
      tip: "sandhi 是巴利语查词和断句的重要难点。"
    },
    "同化": {
      en: "assimilation",
      def: "相邻音互相影响，使一个音变得接近另一个音的现象。",
      example: "ṃ 在 c 前可表现为 ñ，如 dhammaṃ + ca → dhammañca。",
      tip: "看到鼻音变化时，要考虑是否发生同化。"
    },
    "长短元音": {
      en: "vowel length",
      def: "元音长短的区别。巴利语中 a/ā、i/ī、u/ū 等长短差别具有辨义和构形作用。",
      example: "a 与 ā、i 与 ī、u 与 ū 在读音和词形上不同。",
      tip: "不要把 ā、ī、ū 当成普通 a、i、u 的装饰符号。"
    },
    "鼻音": {
      en: "nasal",
      def: "发音时气流经过鼻腔的音，如 ṅ、ñ、ṇ、n、m、ṃ 等。",
      example: "saṅgha 中 ṅ 是鼻音；dhammaṃ 中 ṃ 是鼻音标记。",
      tip: "鼻音常与同化和音变有关。"
    }
  };

  function esc155(s){return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
  function currentView155(){
    const v=[...document.querySelectorAll('.view')].find(x=>!x.classList.contains('hidden'));
    return v ? v.id : 'homeView';
  }
  function record155(target){
    try{
      const cur=currentView155();
      window.__paliHistory143 = window.__paliHistory143 || [];
      if(cur && cur!==target){
        const stack=window.__paliHistory143;
        if(!stack.length || stack[stack.length-1]!==cur){
          stack.push(cur);
          if(stack.length>80) stack.shift();
        }
      }
    }catch(e){}
  }
  function go155(id){
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    document.getElementById(id)?.classList.remove('hidden');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function openExtraConcept155(term){
    const c=EXTRA_CONCEPTS155[term];
    if(!c)return;
    const title=document.getElementById('conceptTitle');
    const body=document.getElementById('conceptContent');
    if(!title||!body)return;
    record155('conceptView');
    title.textContent=term;
    body.innerHTML=`
      <div class="concept-definition">
        <p><strong>英文：</strong>${esc155(c.en)}</p>
        <p><strong>解释：</strong>${esc155(c.def)}</p>
      </div>
      <table class="concept-table">
        <tr><th>例子</th><td>${esc155(c.example)}</td></tr>
        <tr><th>学习提醒</th><td>${esc155(c.tip)}</td></tr>
      </table>
      <div class="concept-tip">这是学习型解释，用于帮助理解课程内容；正式研究或论文写作时，仍要结合具体语境和专业语法书判断。</div>`;
    go155('conceptView');
  }
  function shouldSkip155(parent){
    if(!parent)return true;
    return !!parent.closest('script,style,input,textarea,select,button,a,.concept-inline-link,.concept-extra-link,.ipa-hover,.global-back-top-btn');
  }
  function annotateExtraTerms155(root){
    root=root||document.body;
    if(!root || root.dataset.extraTerms155==='1')return;
    const terms=Object.keys(EXTRA_CONCEPTS155).sort((a,b)=>b.length-a.length);
    const re=new RegExp(terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        if(!node.nodeValue || !node.nodeValue.trim())return NodeFilter.FILTER_REJECT;
        if(shouldSkip155(node.parentElement))return NodeFilter.FILTER_REJECT;
        re.lastIndex=0;
        return re.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const text=node.nodeValue;
      re.lastIndex=0;
      let last=0,m;
      const frag=document.createDocumentFragment();
      while((m=re.exec(text))){
        if(m.index>last)frag.appendChild(document.createTextNode(text.slice(last,m.index)));
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='concept-extra-link';
        btn.dataset.conceptExtra=m[0];
        btn.title='查看概念解释：'+m[0];
        btn.textContent=m[0];
        frag.appendChild(btn);
        last=m.index+m[0].length;
      }
      if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag,node);
    });
    root.dataset.extraTerms155='1';
  }
  function annotateVisible155(){
    document.querySelectorAll('.view:not(.hidden)').forEach(el=>{
      el.dataset.extraTerms155='';
      annotateExtraTerms155(el);
    });
  }
  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-concept-extra]');
    if(btn){
      e.preventDefault();
      e.stopImmediatePropagation();
      openExtraConcept155(btn.dataset.conceptExtra);
      return;
    }
  },true);
  window.addEventListener('DOMContentLoaded',function(){
    const badge=document.querySelector('.visual-version-badge');
    if(badge)badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';
    setTimeout(annotateVisible155,450);
  });
  document.addEventListener('click',function(){setTimeout(annotateVisible155,260);},true);
  document.addEventListener('change',function(){setTimeout(annotateVisible155,260);},true);
  window.__paliExtraConcepts155={EXTRA_CONCEPTS155,annotateVisible155,openExtraConcept155};
})();


/* ===== Pāli Learning Lab 15.6: 术语库 + 学习模块超链接 ===== */
(function(){
  function norm156(s){return String(s||'').trim().toLowerCase();}
  function splitCn156(s){return String(s||'').split(/[；;、，,\/]/).map(x=>x.trim()).filter(Boolean);}
  function glossaryItems156(){return window.TERMINOLOGY_GLOSSARY||[];}
  function findGlossary156(term){
    const q=norm156(term);
    if(!q) return null;
    return glossaryItems156().find(item=>{
      const cns=splitCn156(item.cn).map(norm156);
      return cns.includes(q) || norm156(item.en)===q || norm156(item.pali)===q;
    }) || glossaryItems156().find(item=>{
      const hay=[item.cn,item.en,item.pali,item.note].join(' ').toLowerCase();
      return hay.includes(q);
    }) || null;
  }
  function openGlossary156(term){
    const target=findGlossary156(term) || {en:term,cn:term,pali:'',note:''};
    if(typeof switchView==='function') switchView('terminologyGlossaryView');
    if(typeof renderTermCategories==='function') renderTermCategories();
    const input=document.getElementById('termSearchInput');
    const sel=document.getElementById('termCategorySelect');
    if(input) input.value = target.cn || target.en || term;
    if(sel) sel.value='全部';
    if(typeof renderTerminologyGlossary==='function') renderTerminologyGlossary();
    setTimeout(()=>{
      const details=[...document.querySelectorAll('#termGlossaryList details.term-card')];
      if(!details.length) return;
      let hit=details.find(d=>d.textContent.includes(target.cn||'') || d.textContent.toLowerCase().includes((target.en||'').toLowerCase()));
      if(!hit) hit=details[0];
      hit.open=true;
      hit.scrollIntoView({behavior:'smooth', block:'start'});
    }, 80);
  }
  function decorateTermButtons156(root){
    root = root || document.querySelector('#lessonView:not(.hidden) .card');
    if(!root) return;
    root.querySelectorAll('.concept-inline-link,.concept-extra-link').forEach(btn=>{
      const label=(btn.textContent||'').trim();
      const match=findGlossary156(label);
      if(match){
        btn.dataset.termGlossary = match.cn || match.en || label;
        btn.classList.add('term-direct-link');
        btn.title='打开术语库：'+(match.cn||match.en||label);
      }
    });
  }
  function addLessonGlossaryBox156(){
    const lessonView=document.getElementById('lessonView');
    if(!lessonView || lessonView.classList.contains('hidden')) return;
    const sum=document.getElementById('lessonSummary');
    if(!sum) return;
    lessonView.querySelectorAll('.lesson-term-library-box').forEach(x=>x.remove());
    const content=[
      document.getElementById('lessonTitle')?.textContent||'',
      sum.textContent||'',
      ...[...document.querySelectorAll('#lessonExplanation li')].map(x=>x.textContent||''),
      ...[...document.querySelectorAll('#lessonMistakes li')].map(x=>x.textContent||''),
      ...[...document.querySelectorAll('#lessonTable td')].map(x=>x.textContent||''),
      ...[...document.querySelectorAll('#lessonExamples')].map(x=>x.textContent||'')
    ].join(' ');
    const terms=glossaryItems156().filter(item=>{
      const keys=[item.cn,item.en,item.pali].filter(Boolean);
      return keys.some(k=>String(k).length>=2 && content.includes(k));
    });
    const uniq=[]; const seen=new Set();
    for(const t of terms){
      const key=t.cn+'|'+t.en;
      if(!seen.has(key)){ seen.add(key); uniq.push(t); }
      if(uniq.length>=10) break;
    }
    if(!uniq.length) return;
    const box=document.createElement('div');
    box.className='lesson-term-library-box linked-term-box';
    box.innerHTML='<strong>核心概念：</strong><br>'+uniq.map(t=>`<button class="term-link-btn" data-term-open="${(t.cn||t.en).replace(/"/g,'&quot;')}">${t.cn} / ${t.en}</button>`).join('');
    sum.insertAdjacentElement('afterend', box);
    if(typeof bindTermButtons==='function') bindTermButtons();
  }
  document.addEventListener('click', function(e){
    const btn=e.target.closest('[data-term-glossary]');
    if(btn){
      e.preventDefault();
      e.stopImmediatePropagation();
      openGlossary156(btn.dataset.termGlossary || btn.textContent || '');
    }
  }, true);
  document.addEventListener('click', function(){
    setTimeout(()=>{decorateTermButtons156(); addLessonGlossaryBox156();}, 120);
  }, true);
  window.addEventListener('DOMContentLoaded', function(){
    const badge=document.querySelector('.visual-version-badge');
    if(badge) badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';
    setTimeout(()=>{decorateTermButtons156(); addLessonGlossaryBox156();}, 500);
  });
  window.__termGlossary156={findGlossary156,openGlossary156,decorateTermButtons156,addLessonGlossaryBox156};
})();


/* ===== Pāli Learning Lab 15.8: comprehensive examples and full glossary links ===== */
(function(){
  function glossaryTerms158(){
    try{return (window.TERMINOLOGY_GLOSSARY||[]).flatMap(t=>String(t.cn||'').split(/[；;、，,\/]/).map(x=>({label:x.trim(), item:t}))).filter(x=>x.label.length>=2 || x.label==='数');}catch(e){return [];}
  }
  function findTerm158(label){
    const q=String(label||'').trim();
    return glossaryTerms158().find(x=>x.label===q)?.item || null;
  }
  function openTerm158(label){
    const item=findTerm158(label);
    if(typeof switchView==='function') switchView('terminologyGlossaryView');
    if(typeof renderTermCategories==='function') renderTermCategories();
    const input=document.getElementById('termSearchInput');
    const sel=document.getElementById('termCategorySelect');
    if(input) input.value = item ? item.cn.split(/[；;、，,\/]/)[0] : label;
    if(sel) sel.value='全部';
    if(typeof renderTerminologyGlossary==='function') renderTerminologyGlossary();
    setTimeout(()=>{
      const first=document.querySelector('#termGlossaryList details.term-card');
      if(first){first.open=true;first.scrollIntoView({behavior:'smooth',block:'start'});}
    },80);
  }
  function annotateGlossaryTerms158(root){
    root=root || document.querySelector('#lessonView:not(.hidden) .card');
    if(!root || root.dataset.glossaryTerms158==='1') return;
    const terms=glossaryTerms158().map(x=>x.label).filter(Boolean).sort((a,b)=>b.length-a.length);
    if(!terms.length)return;
    const re=new RegExp(terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const p=node.parentElement;
        if(!p || !node.nodeValue.trim())return NodeFilter.FILTER_REJECT;
        if(p.closest('script,style,input,textarea,select,button,a,.term-direct-link,.concept-inline-link,.concept-extra-link,.ipa-hover,.lesson-nav-row,.lesson-bottom-nav'))return NodeFilter.FILTER_REJECT;
        re.lastIndex=0;
        return re.test(node.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
      }
    });
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const text=node.nodeValue;
      re.lastIndex=0;
      let last=0,m;
      const frag=document.createDocumentFragment();
      while((m=re.exec(text))){
        if(m.index>last)frag.appendChild(document.createTextNode(text.slice(last,m.index)));
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='term-direct-link';
        btn.dataset.termGlossary=m[0];
        btn.title='打开术语库：'+m[0];
        btn.textContent=m[0];
        frag.appendChild(btn);
        last=m.index+m[0].length;
      }
      if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag,node);
    });
    root.dataset.glossaryTerms158='1';
  }
  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-term-glossary]');
    if(btn){
      e.preventDefault();e.stopImmediatePropagation();
      openTerm158(btn.dataset.termGlossary || btn.textContent);
    }
  },true);
  function run158(){
    const badge=document.querySelector('.visual-version-badge');
    if(badge)badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';
    const card=document.querySelector('#lessonView:not(.hidden) .card');
    if(card){card.dataset.glossaryTerms158='';annotateGlossaryTerms158(card);}
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(run158,500));
  document.addEventListener('click',()=>setTimeout(run158,220),true);
  document.addEventListener('change',()=>setTimeout(run158,220),true);
  window.__paliGlossaryLinks158={annotateGlossaryTerms158,openTerm158,findTerm158};
})();


/* ===== Pāli Learning Lab 15.9: verb overview full coverage badge ===== */
(function(){
  window.addEventListener('DOMContentLoaded',function(){
    const badge=document.querySelector('.visual-version-badge');
    if(badge) badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';
  });
})();


/* ===== Pāli Learning Lab 16.0: full chapter aligned examples badge ===== */
(function(){
  window.addEventListener('DOMContentLoaded',function(){
    const badge=document.querySelector('.visual-version-badge');
    if(badge) badge.textContent='Pāli Learning Lab · 20.41 最终显示修正版';
  });
})();


/* ===== Pāli Learning Lab 16.1: layered exercises + scoped confusions ===== */
(function(){
  function esc161(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function currentLesson161(){
    try{ if(typeof currentLesson !== "undefined" && currentLesson) return currentLesson; }catch(e){}
    return null;
  }
  function startLayeredPractice161(layerKey){
    const lesson=currentLesson161();
    if(!lesson)return;
    const layer=(lesson.layered_exercises||[]).find(x=>x.key===layerKey);
    if(!layer || !layer.items || !layer.items.length){
      alert("这一层暂时没有练习。");
      return;
    }
    const items=layer.items.map(x=>({...x, lesson_id:lesson.id, lesson_title:lesson.title, module:lesson.module, category:lesson.category}));
    if(typeof startExercises==="function") startExercises(items, `${lesson.title}｜${layer.title}`);
  }
  function renderLayeredExercises161(){
    const lesson=currentLesson161();
    const exBox=document.getElementById("lessonExamples");
    if(!lesson || !exBox)return;
    document.querySelectorAll(".layered-practice-box,.scoped-confusion-box").forEach(x=>x.remove());

    const confs=lesson.scoped_confusions||[];
    if(confs.length){
      const box=document.createElement("section");
      box.className="scoped-confusion-box mini-card";
      box.innerHTML=`<h3>易混点专项对照</h3>
        <p class="muted"></p>
        <div class="table-wrap"><table class="qa-table"><tr><th>容易混淆 A</th><th>容易混淆 B</th><th>看什么</th><th>范围</th></tr>
        ${confs.map(c=>`<tr><td>${esc161(c.left)}</td><td>${esc161(c.right)}</td><td>${esc161(c.focus)}</td><td>${esc161(c.learning_scope)}</td></tr>`).join("")}
        </table></div>`;
      exBox.insertAdjacentElement("afterend", box);
    }

    const layers=lesson.layered_exercises||[];
    if(layers.length){
      const box=document.createElement("section");
      box.className="layered-practice-box mini-card";
      box.innerHTML=`<h3>练习</h3>
        <p class="muted"></p>
        <div class="layered-practice-grid">
        ${layers.map(layer=>`<div class="layered-practice-card">
          <h4>${esc161(layer.title)}</h4>
          <p>${esc161(layer.desc||"")}</p>
          <p class="muted">${(layer.items||[]).length} 道题</p>
          <button class="primary small" data-layer-practice="${esc161(layer.key)}">开始这一层</button>
        </div>`).join("")}
        </div>`;
      const target=document.querySelector(".scoped-confusion-box") || exBox;
      target.insertAdjacentElement("afterend", box);
    }
  }
  document.addEventListener("click",function(e){
    const btn=e.target.closest("[data-layer-practice]");
    if(btn){
      e.preventDefault();
      e.stopImmediatePropagation();
      startLayeredPractice161(btn.dataset.layerPractice);
    }
  },true);

  if(typeof openLesson==="function" && !window.__openLessonLayered161){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(renderLayeredExercises161,80);
      return result;
    };
    window.__openLessonLayered161=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
    setTimeout(renderLayeredExercises161,300);
  });
  window.__layeredPractice161={renderLayeredExercises161,startLayeredPractice161};
})();


/* ===== Pāli Learning Lab 16.2: integrated learning points and form overview ===== */
(function(){
  function esc162(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function currentLesson162(){
    try{ if(typeof currentLesson !== "undefined" && currentLesson) return currentLesson; }catch(e){}
    return null;
  }
  function tableHTML162(rows){
    if(!rows || !rows.length)return "";
    return `<div class="table-wrap lecture-table-wrap"><table class="lecture-table-supplement">${
      rows.map((r,i)=>`<tr>${r.map(c=>i===0?`<th>${esc162(c)}</th>`:`<td>${esc162(c)}</td>`).join("")}</tr>`).join("")
    }</table></div>`;
  }
  function renderLectureSupplement162(){
    const lesson=currentLesson162();
    const summary=document.getElementById("lessonSummary");
    const table=document.getElementById("lessonTable");
    if(!lesson || !summary)return;
    document.querySelectorAll(".lecture-table-box").forEach(x=>x.remove());
    // 16.9: lecture_brief has been merged into 学习目标; no separate key point block.
    if(lesson.lecture_table_supplement && lesson.lecture_table_supplement.length){
      const box=document.createElement("section");
      box.className="lecture-table-box mini-card";
      box.innerHTML=`<h3>形式总览</h3>
        <p class="muted">把本课关键形式集中整理，便于对照记忆。</p>
        ${tableHTML162(lesson.lecture_table_supplement)}`;
      const anchor=document.querySelector("#lessonTable")?.closest(".table-wrap") || document.getElementById("lessonExamples");
      if(anchor) anchor.insertAdjacentElement("afterend", box);
    }
  }
  if(typeof openLesson==="function" && !window.__openLessonLecture162){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(renderLectureSupplement162,90);
      return result;
    };
    window.__openLessonLecture162=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
    setTimeout(renderLectureSupplement162,350);
  });
  window.__lectureSupplement162={renderLectureSupplement162};
})();


/* ===== Pāli Learning Lab 16.3: enhanced encyclopedia-style linguistic terminology ===== */
(function(){
  function esc163(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
  function contrastTable163(rows){
    if(!rows || !rows.length)return "";
    return `<div class="term-contrast-box">
      <strong>对照说明：</strong>
      <div class="table-wrap"><table class="term-contrast-table">
        <tr><th>语言/项目</th><th>形式</th><th>说明</th></tr>
        ${rows.map(r=>`<tr><td>${esc163(r.label)}</td><td>${esc163(r.form)}</td><td>${esc163(r.meaning)}</td></tr>`).join("")}
      </table></div>
    </div>`;
  }
  function renderTerminologyGlossary163(){
    const box=document.getElementById("termGlossaryList");
    if(!box)return;
    const q=(document.getElementById("termSearchInput")?.value||"").trim().toLowerCase();
    const cat=document.getElementById("termCategorySelect")?.value||"全部";
    const items=(window.TERMINOLOGY_GLOSSARY||[]).filter(t=>{
      const text=[t.cat,t.en,t.ipa,t.cn,t.pali,t.note,t.simple_explanation,JSON.stringify(t.contrast_examples||[])].join(" ").toLowerCase();
      return (cat==="全部"||t.cat===cat)&&(!q||text.includes(q));
    });
    box.innerHTML=items.length?"":"<p class='muted'>没有找到相关术语。</p>";
    items.forEach(t=>{
      const details=document.createElement("details");
      details.className="term-card";
      details.innerHTML=`
        <summary>
          <span class="term-en">${esc163(t.en)}</span>
          <span class="term-cn">${esc163(t.cn)}</span>
          <span class="term-cat">${esc163(t.cat)}</span>
        </summary>
        <div class="term-detail">
          <p><strong>英文：</strong>${esc163(t.en)} <span class="ipa">${esc163(t.ipa||"")}</span></p>
          <p><strong>中文：</strong>${esc163(t.cn)}</p>
          <p><strong>巴利/传统术语：</strong>${esc163(t.pali||"—")}</p>
          <p><strong>简明解释：</strong>${esc163(t.simple_explanation || t.note || "")}</p>
          ${t.note && t.note!==t.simple_explanation ? `<p><strong>学习提示：</strong>${esc163(t.note)}</p>` : ""}
          ${contrastTable163(t.contrast_examples)}
        </div>
      `;
      box.appendChild(details);
    });
  }
  // Override the previous renderer while preserving existing category/search controls.
  window.renderTerminologyGlossary = renderTerminologyGlossary163;
  if(typeof renderTerminologyGlossary !== "undefined"){
    try{ renderTerminologyGlossary = renderTerminologyGlossary163; }catch(e){}
  }
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
    setTimeout(()=>{try{renderTerminologyGlossary163()}catch(e){}},400);
  });
  window.__terminologyEnhanced163={renderTerminologyGlossary163};
})();


/* ===== Pāli Learning Lab 16.4: example granularity grouping ===== */
(function(){
  function kindOrder164(k){
    return {"词形例":1,"对照例":2,"短语例":3,"句子例":4,"格式例":5}[k]||9;
  }
  function kindDesc164(k){
    return {
      "词形例":"适合先观察字母、词形、词尾或读音符号。",
      "对照例":"适合比较变化前后或相近形式。",
      "短语例":"适合观察固定搭配或句式框架。",
      "句子例":"适合观察格位、句法功能和佛典阅读。",
      "格式例":"适合学术引用、查词流程或术语格式。"
    }[k]||"";
  }
  function renderGroupedExamples164(){
    const lesson = (typeof currentLesson!=="undefined") ? currentLesson : null;
    const box=document.getElementById("lessonExamples");
    if(!lesson || !box || !(lesson.examples||[]).length)return;
    const groups={};
    (lesson.examples||[]).forEach(e=>{
      const k=e.example_kind||"句子例";
      (groups[k]=groups[k]||[]).push(e);
    });
    box.innerHTML="";
    Object.keys(groups).sort((a,b)=>kindOrder164(a)-kindOrder164(b)).forEach(k=>{
      const sec=document.createElement("section");
      sec.className="example-kind-section";
      sec.innerHTML=`<h4>${k}</h4><p class="muted">${kindDesc164(k)}</p>`;
      groups[k].forEach(a=>{
        const d=document.createElement("div");
        d.className="example";
        if(typeof exampleHTML==="function") d.innerHTML=exampleHTML(a);
        else d.innerHTML=`<strong>${a.pali||""}</strong><p>${a.cn||""}</p><p class="muted">${a.note||""}</p>`;
        sec.appendChild(d);
      });
      box.appendChild(sec);
    });
  }
  if(typeof openLesson==="function" && !window.__exampleGranularity164){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(renderGroupedExamples164,110);
      return result;
    };
    window.__exampleGranularity164=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
    setTimeout(renderGroupedExamples164,400);
  });
  window.__exampleGranularity164={renderGroupedExamples164};
})();


/* ===== Pāli Learning Lab 16.5: example priority refinement ===== */
(function(){
  function kindOrder165(k){return {"词形例":1,"对照例":2,"短语例":3,"句子例":4,"格式例":5}[k]||9;}
  function priOrder165(p){return {"必看":1,"辅助":2,"扩展":3}[p]||9;}
  function priDesc165(p){return {
    "必看":"",
    "辅助":"",
    "扩展":""
  }[p]||"";}
  function kindDesc165(k){return {
    "词形例":"先观察字母、词形、词尾或读音符号。",
    "对照例":"比较变化前后或相近形式。",
    "短语例":"观察固定搭配或句式框架。",
    "句子例":"观察格位、句法功能和佛典阅读。",
    "格式例":"用于学术引用、查词流程或术语格式。"
  }[k]||"";}
  function renderRefinedExamples165(){
    const lesson=(typeof currentLesson!=="undefined")?currentLesson:null;
    const box=document.getElementById("lessonExamples");
    if(!lesson||!box||!(lesson.examples||[]).length)return;
    const byPri={};
    (lesson.examples||[]).forEach(e=>{
      const p=e.example_priority||"辅助";
      (byPri[p]=byPri[p]||[]).push(e);
    });
    box.innerHTML="";
    ["必看","辅助","扩展"].forEach(pri=>{
      const list=byPri[pri]||[];
      if(!list.length)return;
      const outer=document.createElement("section");
      outer.className=`example-priority-section priority-${pri}`;
      outer.innerHTML=`<h4>${pri}例子</h4><p class="muted">${priDesc165(pri)}</p>`;
      const byKind={};
      list.forEach(e=>{
        const k=e.example_kind||"句子例";
        (byKind[k]=byKind[k]||[]).push(e);
      });
      Object.keys(byKind).sort((a,b)=>kindOrder165(a)-kindOrder165(b)).forEach(kind=>{
        const inner=document.createElement("div");
        inner.className="example-kind-subsection";
        inner.innerHTML=`<div class="example-kind-title">${kind}<span>${kindDesc165(kind)}</span></div>`;
        byKind[kind].forEach(a=>{
          const d=document.createElement("div");
          d.className="example";
          if(typeof exampleHTML==="function") d.innerHTML=exampleHTML(a);
          else d.innerHTML=`<strong>${a.pali||""}</strong><p>${a.cn||""}</p><p class="muted">${a.note||""}</p>`;
          const tag=document.createElement("div");
          tag.className="example-priority-tag";
          tag.textContent=`${a.example_priority||pri} · ${a.example_kind||kind}`;
          d.prepend(tag);
          inner.appendChild(d);
        });
        outer.appendChild(inner);
      });
      box.appendChild(outer);
    });
  }
  if(typeof openLesson==="function" && !window.__examplePriority165){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(renderRefinedExamples165,130);
      return result;
    };
    window.__examplePriority165=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
    setTimeout(renderRefinedExamples165,450);
  });
  window.__examplePriority165={renderRefinedExamples165};
})();


/* ===== Pāli Learning Lab 16.6: integrated learning point wording cleanup ===== */
(function(){
  function cleanupIntegratedWording166(){
    
    document.querySelectorAll(".lecture-table-box h3").forEach(h=>h.textContent="形式总览");
    document.querySelectorAll(".lecture-brief-box .muted,.lecture-table-box .muted").forEach(p=>{
      const t=p.textContent||"";
      if(t.includes("讲义") || t.includes("原") || t.includes("补充") || t.includes("制作") || t.includes("参考老师")){
        p.remove();
      }
    });
    document.querySelectorAll(".lecture-table-box").forEach(box=>{
      box.classList.add("integrated-learning-section");
    });
  }
  if(typeof openLesson==="function" && !window.__integratedWording166){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(cleanupIntegratedWording166,180);
      return result;
    };
    window.__integratedWording166=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
    setTimeout(cleanupIntegratedWording166,500);
  });
  window.__integratedWording166={cleanupIntegratedWording166};
})();


/* ===== Pāli Learning Lab 16.7: collapse auxiliary and extension into more examples ===== */
(function(){
  function kindOrder167(k){
    return {"词形例":1,"对照例":2,"短语例":3,"句子例":4,"格式例":5}[k]||9;
  }
  function kindDesc167(k){
    return {
      "词形例":"先观察字母、词形、词尾或读音符号。",
      "对照例":"比较变化前后或相近形式。",
      "短语例":"观察固定搭配或句式框架。",
      "句子例":"观察格位、句法功能和佛典阅读。",
      "格式例":"用于学术引用、查词流程或术语格式。"
    }[k]||"";
  }
  function addExampleBlock167(container, examples){
    const byKind={};
    (examples||[]).forEach(e=>{
      const k=e.example_kind||"句子例";
      (byKind[k]=byKind[k]||[]).push(e);
    });
    Object.keys(byKind).sort((a,b)=>kindOrder167(a)-kindOrder167(b)).forEach(kind=>{
      const inner=document.createElement("div");
      inner.className="example-kind-subsection";
      inner.innerHTML=`<div class="example-kind-title">${kind}<span>${kindDesc167(kind)}</span></div>`;
      byKind[kind].forEach(a=>{
        const d=document.createElement("div");
        d.className="example";
        if(typeof exampleHTML==="function") d.innerHTML=exampleHTML(a);
        else d.innerHTML=`<strong>${a.pali||""}</strong><p>${a.cn||""}</p><p class="muted">${a.note||""}</p>`;
        const tag=document.createElement("div");
        tag.className="example-priority-tag";
        tag.textContent=`${a.example_priority||"例子"} · ${a.example_kind||kind}`;
        d.prepend(tag);
        inner.appendChild(d);
      });
      container.appendChild(inner);
    });
  }
  function renderMoreExamples167(){
    const lesson=(typeof currentLesson!=="undefined")?currentLesson:null;
    const box=document.getElementById("lessonExamples");
    if(!lesson||!box||!(lesson.examples||[]).length)return;

    const core=(lesson.examples||[]).filter(e=>(e.example_priority||"辅助")==="必看");
    const more=(lesson.examples||[]).filter(e=>(e.example_priority||"辅助")!=="必看");

    box.innerHTML="";

    const coreSec=document.createElement("section");
    coreSec.className="example-priority-section priority-必看";
    coreSec.innerHTML=`<h4>必看例子</h4><p class="muted"></p>`;
    addExampleBlock167(coreSec, core.length?core:(lesson.examples||[]).slice(0,3));
    box.appendChild(coreSec);

    if(more.length){
      const details=document.createElement("details");
      details.className="more-examples-details";
      details.innerHTML=`<summary>
        <span>更多例子</span>
        <small>辅助例子和扩展例子，共 ${more.length} 个</small>
      </summary>`;
      const body=document.createElement("div");
      body.className="more-examples-body";
      const hint=document.createElement("p");
      hint.className="muted";
      hint.textContent="";
      body.appendChild(hint);
      addExampleBlock167(body, more);
      details.appendChild(body);
      box.appendChild(details);
    }
  }
  if(typeof openLesson==="function" && !window.__moreExamples167){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(renderMoreExamples167,220);
      return result;
    };
    window.__moreExamples167=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
    setTimeout(renderMoreExamples167,650);
  });
  window.__moreExamples167={renderMoreExamples167};
})();


/* ===== Pāli Learning Lab 16.8: concise learning UI wording ===== */
(function(){
  function cleanupConcise168(){
    // Rename headings
    document.querySelectorAll(".layered-practice-box h3").forEach(h=>h.textContent="练习");
    document.querySelectorAll(".scoped-confusion-box h3").forEach(h=>h.textContent="易混点专项对照");
    
    document.querySelectorAll(".lecture-table-box h3").forEach(h=>h.textContent="形式总览");

    // Remove explanatory muted text inside these sections.
    document.querySelectorAll(".layered-practice-box > p.muted,.scoped-confusion-box > p.muted,.lecture-table-box > p.muted,.more-examples-body > p.muted").forEach(p=>p.remove());

    // Exercise cards: remove description paragraphs, keep title/count/button.
    document.querySelectorAll(".layered-practice-card p").forEach(p=>{
      const text=(p.textContent||"").trim();
      if(!/^\d+\s*道题$/.test(text)) p.remove();
    });

    // Easy-confusion table: remove range column if present.
    document.querySelectorAll(".scoped-confusion-box table").forEach(table=>{
      const rows=[...table.querySelectorAll("tr")];
      if(!rows.length)return;
      const heads=[...rows[0].children].map(x=>(x.textContent||"").trim());
      const idx=heads.findIndex(h=>h==="范围" || h==="学习范围");
      if(idx>=0){
        rows.forEach(r=>{
          if(r.children[idx]) r.children[idx].remove();
        });
      }
    });

    // Priority and more examples: concise labels only.
    document.querySelectorAll(".example-priority-section > p.muted").forEach(p=>p.remove());
    document.querySelectorAll(".more-examples-details > summary small").forEach(s=>{
      s.textContent=(s.textContent||"").replace("辅助例子和扩展例子，","");
    });

    // Remove old visible production wording anywhere in the active lesson page.
    const bad=[
      "本课内容",
      "前后对照",
      "学习资料",
      "仍以本页原有学习目标和表格为主",
      "识别与理解",
      "更多"
    ];
    document.querySelectorAll("#lessonView p,#lessonView td,#lessonView li,#lessonView small,#lessonView span").forEach(el=>{
      let t=el.textContent||"";
      if(bad.some(b=>t.includes(b))){
        el.textContent=t;
      }
    });
  }
  if(typeof openLesson==="function" && !window.__conciseWording168){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(cleanupConcise168,280);
      return result;
    };
    window.__conciseWording168=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
    setTimeout(cleanupConcise168,750);
  });
  window.__conciseWording168={cleanupConcise168};
})();


/* ===== Pāli Learning Lab 16.9: merge key points into learning explanation ===== */
(function(){
  function cleanupKeyPointBox169(){
    document.querySelectorAll(".lecture-brief-box").forEach(x=>x.remove());
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
  }
  if(typeof openLesson==="function" && !window.__mergeKeyPoints169){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(cleanupKeyPointBox169,320);
      return result;
    };
    window.__mergeKeyPoints169=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    setTimeout(cleanupKeyPointBox169,800);
  });
  window.__mergeKeyPoints169={cleanupKeyPointBox169};
})();


/* ===== Pāli Learning Lab 17.0: integrated lesson layout ===== */
(function(){
  function previousElementByText170(text){
    return [...document.querySelectorAll("#lessonView h3")].find(h=>(h.textContent||"").trim()===text);
  }
  function labelSections170(){
    const explanation=document.getElementById("lessonExplanation");
    if(explanation){
      const h=explanation.previousElementSibling;
      if(h && h.tagName==="H3") h.textContent="学习目标";
    }
    const table=document.getElementById("lessonTable");
    if(table){
      const wrap=table.closest(".table-wrap");
      const h=wrap?.previousElementSibling;
      if(h && h.tagName==="H3") h.textContent="形式与结构";
    }
    const examples=document.getElementById("lessonExamples");
    if(examples){
      const h=examples.previousElementSibling;
      if(h && h.tagName==="H3") h.textContent="例子";
    }
    const mistake=document.getElementById("mistakeBlock");
    if(mistake){
      const h=mistake.querySelector("h3");
      if(h) h.textContent="易错点";
    }
    document.querySelectorAll(".layered-practice-box h3").forEach(h=>h.textContent="练习");
    document.querySelectorAll(".lecture-table-box h3").forEach(h=>h.textContent="总览对照");
  }
  function mergeMinimalMastery170(){
    const explanation=document.getElementById("lessonExplanation");
    if(!explanation)return;
    document.querySelectorAll(".minimal-mastery-box").forEach(box=>{
      const items=[...box.querySelectorAll("li")].map(li=>(li.textContent||"").trim()).filter(Boolean);
      const existing=new Set([...explanation.querySelectorAll("li")].map(li=>(li.textContent||"").trim()));
      items.forEach(t=>{
        if(!existing.has(t)){
          const li=document.createElement("li");
          li.textContent=t;
          li.className="merged-minimal-mastery-item";
          explanation.appendChild(li);
          existing.add(t);
        }
      });
      box.remove();
    });
  }
  function mergeFormOverview170(){
    const table=document.getElementById("lessonTable");
    const mainWrap=table?.closest(".table-wrap");
    const formBox=document.querySelector(".lecture-table-box");
    if(!mainWrap||!formBox)return;
    formBox.classList.add("merged-form-overview");
    const h=formBox.querySelector("h3");
    if(h) h.textContent="总览对照";
    // Put the overview directly after the main table so it reads as one section.
    if(formBox.previousElementSibling!==mainWrap){
      mainWrap.insertAdjacentElement("afterend", formBox);
    }
  }
  function mergeErrorPoints170(){
    const mistake=document.getElementById("mistakeBlock");
    const examples=document.getElementById("lessonExamples");
    const confusion=document.querySelector(".scoped-confusion-box");
    if(!mistake && !confusion)return;

    const block=mistake || document.createElement("div");
    if(!mistake){
      block.id="mistakeBlock";
      block.innerHTML='<h3 class="lesson-section-title lesson-error-title">易错点</h3><ul id="lessonMistakes"></ul>';
      examples?.insertAdjacentElement("afterend", block);
    }
    block.classList.remove("hidden");
    block.classList.add("merged-error-section");
    const h=block.querySelector("h3");
    if(h) h.textContent="易错点";

    const ul=block.querySelector("#lessonMistakes");
    if(ul && ul.children.length){
      ul.classList.add("concept-mistake-list");
      if(!block.querySelector(".concept-mistake-subtitle")){
        const sub=document.createElement("div");
        sub.className="error-subtitle concept-mistake-subtitle";
        sub.textContent="概念误判";
        ul.insertAdjacentElement("beforebegin", sub);
      }
    }

    if(confusion){
      confusion.classList.add("merged-confusion-table");
      const ch=confusion.querySelector("h3");
      if(ch) ch.textContent="词形易混";
      confusion.querySelectorAll("p.muted").forEach(p=>p.remove());
      // Remove scope/range column if a previous version left one.
      confusion.querySelectorAll("table").forEach(table=>{
        const rows=[...table.querySelectorAll("tr")];
        if(!rows.length)return;
        const headers=[...rows[0].children].map(x=>(x.textContent||"").trim());
        const idx=headers.findIndex(x=>x==="范围"||x==="学习范围");
        if(idx>=0){
          rows.forEach(r=>{ if(r.children[idx]) r.children[idx].remove(); });
        }
      });
      block.appendChild(confusion);
    }

    // Place the whole error block after examples / more examples.
    const more=document.querySelector(".more-examples-details");
    const anchor=more || examples;
    if(anchor && block.previousElementSibling!==anchor){
      anchor.insertAdjacentElement("afterend", block);
    }
  }
  function movePractice170(){
    const practice=document.querySelector(".layered-practice-box");
    const error=document.getElementById("mistakeBlock");
    const examples=document.getElementById("lessonExamples");
    if(practice){
      practice.classList.add("integrated-practice-section");
      const h=practice.querySelector("h3");
      if(h) h.textContent="练习";
      practice.querySelectorAll("p.muted").forEach(p=>p.remove());
      const anchor=error && !error.classList.contains("hidden") ? error : (document.querySelector(".more-examples-details") || examples);
      if(anchor && practice.previousElementSibling!==anchor){
        anchor.insertAdjacentElement("afterend", practice);
      }
    }
    // Put the original button row after practice and simplify button labels.
    const row=document.querySelector("#lessonView .button-row");
    if(row){
      row.classList.add("lesson-action-row");
      row.querySelector("#startLessonExercisesBtn") && (row.querySelector("#startLessonExercisesBtn").textContent="练习");
      row.querySelector("#startCardsBtn") && (row.querySelector("#startCardsBtn").textContent="卡片复习");
      const anchor=practice || error || document.querySelector(".more-examples-details") || examples;
      if(anchor && row.previousElementSibling!==anchor){
        anchor.insertAdjacentElement("afterend", row);
      }
    }
  }
  function cleanupLessonLayoutText170(){
    const bad=[
      "先识别形式，再理解意思，最后把形式与规则对应起来。",
      "有余力时再观察，用于迁移和复习。",
      "只比较本课已经学到的内容；后面章节可以回头和前面内容对比。",
      "参考老师讲义压缩整理；仍以本页原有学习说明和表格为主。"
    ];
    document.querySelectorAll("#lessonView p,#lessonView small,#lessonView li,#lessonView td,#lessonView span").forEach(el=>{
      let t=el.textContent||"";
      bad.forEach(b=>{t=t.replace(b,"");});
      el.textContent=t.trim();
    });
  }
  function integrateLessonLayout170(){
    labelSections170();
    mergeMinimalMastery170();
    mergeFormOverview170();
    mergeErrorPoints170();
    movePractice170();
    cleanupLessonLayoutText170();
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
  }
  if(typeof openLesson==="function" && !window.__integratedLessonLayout170){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(integrateLessonLayout170,980);
      return result;
    };
    window.__integratedLessonLayout170=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    setTimeout(integrateLessonLayout170,1100);
  });
  window.__integratedLessonLayout170={integrateLessonLayout170};
})();


/* ===== Pāli Learning Lab 17.1: phonology lesson revision badge ===== */
(function(){
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
  });
})();


/* ===== Pāli Learning Lab 17.2: chapter table and example calibration badge ===== */
(function(){
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
  });
})();


/* ===== Pāli Learning Lab 17.3: calibrated exercises badge ===== */
(function(){
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
  });
})();


/* ===== Pāli Learning Lab 17.4: course loop summary and exercise feedback ===== */
(function(){
  function renderLessonSummary174(){
    const lesson=(typeof currentLesson!=="undefined")?currentLesson:null;
    if(!lesson || !lesson.lesson_summary || !lesson.lesson_summary.length)return;
    document.querySelectorAll(".lesson-summary-box-174").forEach(x=>x.remove());
    const box=document.createElement("section");
    box.className="lesson-summary-box-174 mini-card";
    box.innerHTML=`<h3>本课小结</h3><ol>${lesson.lesson_summary.slice(0,3).map(x=>`<li>${x}</li>`).join("")}</ol>`;
    const practice=document.querySelector(".layered-practice-box");
    const error=document.getElementById("mistakeBlock");
    const examples=document.querySelector(".more-examples-details") || document.getElementById("lessonExamples");
    const anchor=error && !error.classList.contains("hidden") ? error : examples;
    if(practice) practice.insertAdjacentElement("beforebegin", box);
    else if(anchor) anchor.insertAdjacentElement("afterend", box);
  }
  function improveFeedbackDisplay174(){
    if(typeof submitExercise==="function" && !window.__submitExerciseFeedback174){
      const oldSubmit=submitExercise;
      submitExercise=function(){
        const result=oldSubmit();
        setTimeout(()=>{
          const fb=document.getElementById("exerciseFeedback");
          if(!fb)return;
          fb.classList.add("calibrated-feedback");
        },30);
        return result;
      };
      window.__submitExerciseFeedback174=true;
    }
  }
  function run174(){
    renderLessonSummary174();
    improveFeedbackDisplay174();
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
  }
  if(typeof openLesson==="function" && !window.__courseLoop174){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(run174,1150);
      return result;
    };
    window.__courseLoop174=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    setTimeout(run174,1200);
  });
  window.__courseLoop174={run174,renderLessonSummary174};
})();


/* ===== Pāli Learning Lab 17.5: merge concept misjudgments into error points ===== */
(function(){
  function mergeMisjudgeBox175(){
    const mistake=document.getElementById("mistakeBlock");
    const list=document.getElementById("lessonMistakes");
    document.querySelectorAll(".misjudge-box").forEach(box=>{
      if(list){
        box.querySelectorAll("tr").forEach((tr,idx)=>{
          if(idx===0)return;
          const tds=[...tr.querySelectorAll("td")].map(td=>(td.textContent||"").trim()).filter(Boolean);
          if(tds.length){
            const li=document.createElement("li");
            li.textContent=tds.join("；");
            list.appendChild(li);
          }
        });
        if(mistake) mistake.classList.remove("hidden");
      }
      box.remove();
    });
    document.querySelectorAll("#mistakeBlock h3").forEach(h=>h.textContent="易错点");
    document.querySelectorAll(".concept-mistake-subtitle").forEach(x=>x.textContent="概念误判");
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
  }
  if(typeof openLesson==="function" && !window.__mergeMisjudge175){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(mergeMisjudgeBox175,1250);
      return result;
    };
    window.__mergeMisjudge175=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    setTimeout(mergeMisjudgeBox175,1300);
  });
  window.__mergeMisjudge175={mergeMisjudgeBox175};
})();





/* ===== Pāli Learning Lab 17.9: concise learning targets separated from explanation ===== */
(function(){
  function renderTargetsAndExplanation179(){
    const lesson=(typeof currentLesson!=="undefined")?currentLesson:null;
    if(!lesson)return;
    const exp=document.getElementById("lessonExplanation");
    if(!exp)return;
    const h=exp.previousElementSibling;
    if(h && h.tagName==="H3") h.textContent="学习目标";

    exp.innerHTML="";
    (lesson.learning_targets||[]).slice(0,3).forEach(x=>{
      const li=document.createElement("li");
      li.textContent=x;
      exp.appendChild(li);
    });

    document.querySelectorAll(".lesson-explanation-note-179").forEach(x=>x.remove());
    if(lesson.explanation && lesson.explanation.length){
      const box=document.createElement("section");
      box.className="lesson-explanation-note-179 mini-card";
      box.innerHTML=`<h3>学习说明</h3><ul>${lesson.explanation.slice(0,6).map(x=>`<li>${x}</li>`).join("")}</ul>`;
      exp.parentElement?.insertBefore(box, exp.parentElement.querySelector(".table-wrap")?.previousElementSibling || exp.nextSibling);
      const table=document.getElementById("lessonTable");
      const tableH=table?.closest(".table-wrap")?.previousElementSibling;
      if(tableH && tableH.tagName==="H3"){
        tableH.parentElement.insertBefore(box, tableH);
      }else{
        exp.insertAdjacentElement("afterend", box);
      }
    }
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
  }
  if(typeof openLesson==="function" && !window.__learningTargets179){
    const oldOpenLesson=openLesson;
    openLesson=function(id){
      const result=oldOpenLesson(id);
      setTimeout(renderTargetsAndExplanation179,1400);
      return result;
    };
    window.__learningTargets179=true;
  }
  window.addEventListener("DOMContentLoaded",function(){
    setTimeout(renderTargetsAndExplanation179,1600);
  });
  window.__learningTargets179={renderTargetsAndExplanation179};
})();


/* ===== Pāli Learning Lab 18.0: all chapter targets calibrated badge ===== */
(function(){
  window.addEventListener("DOMContentLoaded",function(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent="Pāli Learning Lab · 20.41 最终显示修正版";
  });
})();


/* ===== Pāli Learning Lab 18.4: global lesson vocabulary audit ===== */
(function(){
  const VERSION_LABEL_184 = "Pāli Learning Lab · 20.41 最终显示修正版";

  function esc184(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}

  function normalize184(s){
    return String(s||"")
      .replace(/只观察/g,"只观察")
      .replace(/先观察/g,"先观察")
      .replace(/再观察/g,"再观察")
      .replace(/要观察/g,"要观察")
      .replace(/([A-Za-zāīūṅñṭḍṇḷṃĀĪŪṄÑṬḌṆḶṂ]+ṃ?)\s*看\s*([^。；;，,\n]+)/g,"$1 重点观察 $2")
      .replace(/观察(?=\s*[A-Za-zāīūṅñṭḍṇḷṃĀĪŪṄÑṬḌṆḶṂ√\-\(\)])/g,"观察");
  }

  // 全章节单词表规则：
  // 1. 动词只列词典代表形，通常采用第三人称单数现在时；给词根和基本义。
  // 2. 名词列基本词形/词干，给性和基本义；不列所有变格形式。
  // 3. 代词、形容词、不变词单独分组。
  // 4. 不把动词词尾 ti、anti、mi、si、tha、ma 等误切成单词。
  // 5. 独立 iti 可入不变词；ti 默认不入本节单词，避免误把词尾 -ti 当引语标记。
  const LEXICON184 = [
    // verbs
    ["动词","gacchati","√gam","去",["gacchati","gacchanti","gacchasi","gacchatha","gacchāmi","gacchāma","gaccheyya","gaccheyyaṃ","gaccheyyuṃ","gacchissati","gamissati","gantuṃ","gantvā","gata","gacchanto","gacchantī","agacchi","agamāsi","agamiṃsu","agami"]],
    ["动词","deseti","√dis","说；开示",["deseti","desenti","desesi"]],
    ["动词","suṇāti","√su","听",["suṇāti","suṇanti","suṇāmi","sotuṃ","sutvā","sutaṃ","suta"]],
    ["动词","vandati","√vand","礼敬",["vandati","vandanti","vandāmi"]],
    ["动词","bhavati","√bhū","成为；存在",["bhavati","bhavanti","bhaveyya","bhavissati","hoti","honti","ahosi"]],
    ["动词","karoti","√kar","做",["karoti","karonti","karomi","karotha","karīyati","kātuṃ","katvā","kata","kataṃ","karaṇīyaṃ","kattabbaṃ"]],
    ["动词","labhati","√labh","得到",["labhati","labhanti","labhate","labhante","labhamāno"]],
    ["动词","atthi","√as","有；存在",["atthi","santi","natthi","asi","attha","asmi","amhi","asma","amha"]],
    ["动词","nisīdati","√sad","坐下",["nisīdati","nisīdi","nisīdanti"]],
    ["动词","vasati","√vas","住",["vasati","vasanti"]],
    ["动词","viharati","√har","住；停留",["viharati","viharanti"]],
    ["动词","āgacchati","√gam","来",["āgacchati","āgacchanti","āgacchāmi","āgantuṃ"]],
    ["动词","passati","√dis/pass","看见；理解",["passati","passanti","passāmi"]],
    ["动词","vadati","√vad","说",["vadati","vadanti","avoca","etadavoca"]],
    ["动词","dadāti","√dā","给",["dadāti","dadanti","deti","denti"]],
    ["动词","pavisati","√vis","进入",["pavisati","pavisanti","pavisitvā"]],
    ["动词","pacati","√pac","煮",["pacati","pacanti","pacāmi"]],
    ["动词","pivati","√pā","喝",["pivati","pivanti"]],
    ["动词","pasīdati","√sad / pasīd-","生信；欢喜",["pasīdati","pasīdanti"]],

    // nouns
    ["名词","Buddha","m.","佛",["Buddha","Buddho","Buddhaṃ","Buddhassa","Buddhena","Buddhe"]],
    ["名词","Dhamma","m.","法；教法",["Dhamma","Dhammo","Dhammaṃ","Dhammassa","Dhammena","dhamma","dhammo","dhammaṃ","dhammassa","dhammena"]],
    ["名词","Saṅgha","m.","僧团",["Saṅgha","Saṅgho","Saṅghaṃ","Saṅghassa","saṅgha","saṅgho","saṅghaṃ"]],
    ["名词","saraṇa","n.","皈依处",["saraṇa","saraṇaṃ"]],
    ["名词","bhikkhu","m.","比丘",["bhikkhu","Bhikkhu","bhikkhū","bhikkhuṃ","bhikkhussa"]],
    ["名词","phala","n.","果",["phala","phalaṃ","phalāni"]],
    ["名词","kamma","n.","业",["kamma","kammaṃ","kammassa"]],
    ["名词","purisa","m.","人；男子",["purisa","puriso","purisaṃ","purisassa"]],
    ["名词","deva","m.","天；天神",["deva","devo","devaṃ","devā"]],
    ["名词","rukkha","m.","树",["rukkha","rukkho","rukkhaṃ","rukkhe"]],
    ["名词","vihāra","m.","寺院",["vihāra","vihāro","vihāraṃ","vihāre"]],
    ["名词","gāma","m.","村庄",["gāma","gāmo","gāmaṃ","gāme"]],
    ["名词","patta","m.","钵",["patta","pattaṃ"]],
    ["名词","paññā","f.","智慧",["paññā","paññaṃ","paññāya"]],
    ["名词","sāvaka","m.","弟子；声闻",["sāvaka","sāvako","sāvakaṃ","sāvakassa"]],
    ["名词","samaya","m.","时候；时间",["samaya","samayaṃ","samayena"]],
    ["名词","Sāvatthī","f.","舍卫城",["Sāvatthī","Sāvatthiyaṃ"]],
    ["名词","Bhagavā","m.","世尊",["Bhagavā","Bhagavantaṃ","Bhagavato"]],
    ["名词","Tathāgata","m.","如来",["Tathāgata","Tathāgato","Tathāgataṃ"]],
    ["名词","citta","n.","心",["citta","cittaṃ"]],
    ["名词","sīla","n.","戒；德行",["sīla","sīlaṃ"]],
    ["名词","dāna","n.","布施",["dāna","dānaṃ"]],

    // pronouns/adjectives
    ["代词","ahaṃ","pron.1sg.nom","我",["ahaṃ","Ahaṃ"]],
    ["代词","tvaṃ","pron.2sg.nom","你",["tvaṃ"]],
    ["代词","so","pron.m.sg.nom","他；那个",["so","So"]],
    ["代词","te","pron.m.pl.nom","他们；那些",["te","Te"]],
    ["代词","ta","pron.","他/它；那个",["ta","taṃ","tassa","tena","tasmiṃ"]],
    ["代词","yo","pron.","谁；哪个；关系代词",["yo","yaṃ","yassa","yena","ye"]],
    ["代词","me","pron.","我；我的；于我",["me","mayā","mama","maṃ"]],
    ["形容词","sabba","adj.","一切；所有",["sabba","sabbe","sabbaṃ","sabbā"]],

    // indeclinables
    ["不变词","ca","ind.","和；也",["ca"]],
    ["不变词","vā","ind.","或者",["vā"]],
    ["不变词","eva","ind.","正是；即",["eva","ceva"]],
    ["不变词","iti","ind.","如此；引语标记",["iti","itipi"]],
    ["不变词","api","ind.","也；甚至",["api"]],
    ["不变词","na","ind.","不",["na"]],
    ["不变词","mā","ind.","不要；勿",["mā"]],
    ["不变词","kho","ind.","语气小品词",["kho"]],
    ["不变词","pana","ind.","又；而",["pana"]],
    ["不变词","atha","ind.","于是；然后",["atha","Atha"]],
    ["不变词","evaṃ","ind.","如是；这样",["evaṃ","Evaṃ"]],
    ["不变词","tadā","ind.","那时",["tadā"]],
    ["不变词","yadā","ind.","当……时",["yadā"]]
  ];

  const VARIANT184 = {};
  LEXICON184.forEach(([cat,form,info,meaning,variants])=>{
    const entry = {cat, form, info, meaning};
    (variants || [form]).forEach(v => VARIANT184[String(v).toLowerCase()] = entry);
    VARIANT184[String(form).toLowerCase()] = entry;
  });

  const SUFFIX_BLACKLIST184 = new Set([
    "ti","anti","mi","ma","si","tha","tuṃ","ṃ","m","sg","pl","nom","acc","ins","dat","abl","gen","loc","voc",
    "m","f","n","ind","indic","ger","inf","pr","p","act","mid","pass"
  ]);

  function extractWords184(text){
    const found = [];
    const seen = new Set();
    const re = /[A-ZĀĪŪṄÑṬḌṆḶA-Za-zāīūṅñṭḍṇḷṃ]+(?:ṃ|ṁ)?/g;
    let m;
    while((m = re.exec(String(text||"")))){
      const w = m[0];
      const low = w.toLowerCase();
      if(SUFFIX_BLACKLIST184.has(low)) continue;
      if(w.length < 2) continue;
      if(/^(Pali|Grammar|Review|Learning|Lab|Version|Sandhi|Lesson|Digital|Dictionary|English)$/i.test(w)) continue;
      if(!seen.has(w)){seen.add(w); found.push(w);}
    }
    return found;
  }

  function collectLessonText184(){
    if(typeof currentLesson === "undefined" || !currentLesson) return "";
    let text = "";
    (currentLesson.examples || []).forEach(e => { text += " " + (e.pali||"") + " " + (e.cn||""); });
    (currentLesson.exercises || []).slice(0,12).forEach(e => { text += " " + (e.question||"") + " " + (e.answer||""); });
    (currentLesson.table || []).forEach(row => { if(Array.isArray(row)) text += " " + row.join(" "); });
    return text;
  }

  function buildLessonVocabulary184(){
    if(typeof currentLesson === "undefined" || !currentLesson) return;
    document.querySelectorAll(".lesson-vocab-box-181,.lesson-vocab-box-183,.lesson-vocab-box-184").forEach(x => x.remove());

    const holder = document.getElementById("lessonSummary");
    if(!holder) return;

    const entryMap = new Map();
    extractWords184(collectLessonText184()).forEach(w => {
      const entry = VARIANT184[String(w).toLowerCase()];
      if(entry) entryMap.set(entry.form, entry);
    });

    const order = {"动词":1, "名词":2, "代词":3, "形容词":4, "不变词":5};
    const rows = [...entryMap.values()]
      .sort((a,b) => (order[a.cat]||9) - (order[b.cat]||9) || a.form.localeCompare(b.form))
      .slice(0, 18);

    if(!rows.length) return;

    const grouped = {};
    rows.forEach(r => (grouped[r.cat] ||= []).push(r));

    const body = Object.entries(grouped).map(([cat,items]) => `
      <div class="vocab-section-row">${esc184(cat)}</div>
      ${items.map(r => `<div class="vocab-form">${esc184(r.form)}</div><div>${esc184(r.info)}</div><div>${esc184(r.meaning)}</div>`).join("")}
    `).join("");

    const box = document.createElement("section");
    box.className = "lesson-vocab-box-184";
    box.innerHTML = `<h3>本节单词</h3>
      <p class="muted">动词只列第三人称单数代表形；名词列基本词形。按词类分组，先动词，后名词。</p>
      <div class="vocab-table-181 vocab-table-184">
        <div class="vocab-head">词形</div><div class="vocab-head">语法信息</div><div class="vocab-head">基本义</div>
        ${body}
      </div>`;
    holder.insertAdjacentElement("afterend", box);
  }

  function fixVisible184(root){
    root = root || document;
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_184;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        const p = node.parentElement;
        if(!p || p.closest("script,style,input,textarea,select")) return NodeFilter.FILTER_REJECT;
        return /( 看 |只观察|先观察|再观察|要观察)/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      const v = normalize184(n.nodeValue);
      if(v !== n.nodeValue) n.nodeValue = v;
    });
  }

  function apply184(){
    fixVisible184(document);
    buildLessonVocabulary184();
  }

  window.addEventListener("DOMContentLoaded", () => { setTimeout(apply184, 280); setTimeout(apply184, 1100); });
  document.addEventListener("click", () => setTimeout(apply184, 120), true);
  document.addEventListener("change", () => setTimeout(apply184, 120), true);


  window.__pali184 = {apply184, buildLessonVocabulary184};
})();


/* ===== Pāli Learning Lab 18.5: term link policy finalization ===== */
(function(){
  const VERSION_LABEL_185 = "Pāli Learning Lab · 20.41 最终显示修正版";

  const TERM_EXTRA_185 = [
    "主语","宾语","谓语","格位","主格","宾格","工具格","与格","从格","属格","处格","呼格",
    "动词","限定动词","非限定动词","词根","词干","词尾","人称","单数","复数","时态","语气","语态",
    "主动语态","中间语态","被动语态","名词","代词","形容词","不变词","不定式","连续体","分词",
    "现在分词","过去分词","将来被动分词","连音","音变","长元音","短元音","鼻音","句法","形态学"
  ];

  function esc185(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}

  function termCandidates185(){
    const out = [];
    try{
      (window.TERMINOLOGY_GLOSSARY || []).forEach(item=>{
        String(item.cn || "").split(/[；;、，,\/]/).forEach(t=>{
          t=t.trim();
          if(t && t.length>=2 && !/^[a-z]+\.$/i.test(t)) out.push(t);
        });
      });
    }catch(e){}
    TERM_EXTRA_185.forEach(t=>out.push(t));
    return [...new Set(out)].sort((a,b)=>b.length-a.length);
  }

  function findTerm185(term){
    const q = String(term||"").trim();
    try{
      return (window.TERMINOLOGY_GLOSSARY || []).find(item=>{
        const cnList = String(item.cn||"").split(/[；;、，,\/]/).map(x=>x.trim());
        return cnList.includes(q) || String(item.en||"").toLowerCase()===q.toLowerCase();
      }) || null;
    }catch(e){return null;}
  }

  function unwrap185(el){
    if(!el || !el.parentNode) return;
    el.parentNode.replaceChild(document.createTextNode(el.textContent || ""), el);
  }

  function removeLinksInCleanZones185(root){
    root = root || document;
    const zones = root.querySelectorAll([
      "table",
      "#lessonTable",
      ".example",
      ".example-card",
      ".example-box",
      ".pali",
      ".translation-layer",
      ".lesson-vocab-box-181",
      ".lesson-vocab-box-183",
      ".lesson-vocab-box-184",
      ".lesson-vocab-box-185",
      ".vocab-table-181",
      ".vocab-table-183",
      ".vocab-table-184",
      ".vocab-table-185"
    ].join(","));
    zones.forEach(zone=>{
      zone.querySelectorAll("a.term-once-link-185,button.term-once-link-185,.term-once-link-185,a.term-once-link-172,button.term-once-link-172,.term-once-link-172,.term-direct-link,.concept-inline-link,.concept-extra-link,.ipa-hover").forEach(unwrap185);
    });
  }

  function rawLessonText185(root){
    if(!root) return "";
    const clone = root.cloneNode(true);
    clone.querySelectorAll([
      "table",
      "#lessonTable",
      ".example",
      ".example-card",
      ".example-box",
      ".pali",
      ".translation-layer",
      ".lesson-vocab-box-181",
      ".lesson-vocab-box-183",
      ".lesson-vocab-box-184",
      ".lesson-vocab-box-185",
      ".lesson-term-box-185",
      ".lesson-nav-row",
      ".lesson-bottom-nav",
      "button",
      "a",
      "input",
      "select",
      "textarea",
      "script",
      "style"
    ].join(",")).forEach(x=>x.remove());
    return clone.textContent || "";
  }

  function buildTermBox185(root, terms){
    if(!root) return;
    root.querySelectorAll(".lesson-term-box-185").forEach(x=>x.remove());
    const summary = document.getElementById("lessonSummary");
    if(!summary || !terms.length) return;
    const box = document.createElement("section");
    box.className = "lesson-term-box-185";
    box.innerHTML = `<strong>核心概念：</strong> ${terms.slice(0,16).map(t=>`<button type="button" class="term-chip-185" data-term-card-185="${esc185(t)}">${esc185(t)}</button>`).join("")}`;
    summary.insertAdjacentElement("afterend", box);
  }

  function annotateOnce185(root, terms){
    if(!root || !terms.length) return;
    const used = new Set();
    const re = new RegExp(terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"), "g");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        const p = node.parentElement;
        if(!p || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if(p.closest([
          "table",
          "#lessonTable",
          ".example",
          ".example-card",
          ".example-box",
          ".pali",
          ".translation-layer",
          ".lesson-vocab-box-181",
          ".lesson-vocab-box-183",
          ".lesson-vocab-box-184",
          ".lesson-vocab-box-185",
          ".lesson-term-box-185",
          ".term-popover-185",
          ".lesson-nav-row",
          ".lesson-bottom-nav",
          "button",
          "a",
          "input",
          "select",
          "textarea",
          "script",
          "style"
        ].join(","))) return NodeFilter.FILTER_REJECT;
        re.lastIndex = 0;
        return re.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node=>{
      const text = node.nodeValue;
      re.lastIndex = 0;
      let last = 0, m;
      const frag = document.createDocumentFragment();
      while((m = re.exec(text))){
        const term = m[0];
        if(m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        if(!used.has(term)){
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "term-once-link-185";
          btn.dataset.termCard185 = term;
          btn.textContent = term;
          btn.title = "查看概念解释：" + term;
          frag.appendChild(btn);
          used.add(term);
        }else{
          frag.appendChild(document.createTextNode(term));
        }
        last = m.index + term.length;
      }
      if(last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function showTerm185(term, anchor){
    document.querySelectorAll(".term-popover-185").forEach(x=>x.remove());
    const item = findTerm185(term);
    const card = document.createElement("div");
    card.className = "term-popover-185";
    const cn = item?.cn || term;
    const en = item?.en || "";
    const ipa = item?.ipa || "";
    const pali = item?.pali || "";
    const cat = item?.cat || "";
    const note = item?.simple_explanation || item?.note || "暂无详细解释，可进入术语库继续查看。";
    card.innerHTML = `
      <h3>${esc185(term)}</h3>
      ${cat ? `<p><strong>分类：</strong>${esc185(cat)}</p>` : ""}
      ${en ? `<p><strong>英文：</strong>${esc185(en)}${ipa ? ` <span class="muted">${esc185(ipa)}</span>` : ""}</p>` : ""}
      ${cn && cn!==term ? `<p><strong>中文：</strong>${esc185(cn)}</p>` : ""}
      ${pali ? `<p><strong>巴利/传统术语：</strong>${esc185(pali)}</p>` : ""}
      <p>${esc185(note)}</p>
      <div class="term-actions"><button class="primary small" data-open-glossary-185="${esc185(term)}">进入术语库</button><button class="secondary small" data-close-term-popover-185="1">关闭</button></div>`;
    document.body.appendChild(card);
    const rect = anchor?.getBoundingClientRect?.() || {left:window.innerWidth/2, bottom:window.innerHeight/2, width:0};
    const width = card.offsetWidth, height = card.offsetHeight;
    let left = Math.min(Math.max(12, rect.left + rect.width/2 - width/2), window.innerWidth - width - 12);
    let top = Math.min(Math.max(12, rect.bottom + 10), window.innerHeight - height - 12);
    card.style.left = left + "px";
    card.style.top = top + "px";
  }

  function openGlossary185(term){
    document.querySelectorAll(".term-popover-185").forEach(x=>x.remove());
    if(typeof switchView === "function") switchView("terminologyGlossaryView");
    if(typeof renderTermCategories === "function") renderTermCategories();
    const input = document.getElementById("termSearchInput");
    const sel = document.getElementById("termCategorySelect");
    if(input) input.value = term;
    if(sel) sel.value = "全部";
    if(typeof renderTerminologyGlossary === "function") renderTerminologyGlossary();
    setTimeout(()=>{
      const first = document.querySelector("#termGlossaryList details.term-card");
      if(first){ first.open = true; first.scrollIntoView({behavior:"smooth", block:"start"}); }
    },80);
  }

  function apply185(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_185;
    const root = document.querySelector("#lessonView:not(.hidden) .card");
    if(!root) return;
    removeLinksInCleanZones185(root);
    root.querySelectorAll(".term-once-link-185").forEach(unwrap185);
    const text = rawLessonText185(root);
    const terms = termCandidates185().filter(t=>text.includes(t));
    buildTermBox185(root, terms);
    annotateOnce185(root, terms);
    removeLinksInCleanZones185(root);
  }

  document.addEventListener("click", function(e){
    const btn = e.target.closest("[data-term-card-185]");
    if(btn){
      e.preventDefault();
      e.stopImmediatePropagation();
      showTerm185(btn.dataset.termCard185, btn);
      return;
    }
    const open = e.target.closest("[data-open-glossary-185]");
    if(open){
      e.preventDefault();
      e.stopImmediatePropagation();
      openGlossary185(open.dataset.openGlossary185);
      return;
    }
    if(e.target.closest("[data-close-term-popover-185]")){
      e.preventDefault();
      e.stopImmediatePropagation();
      document.querySelectorAll(".term-popover-185").forEach(x=>x.remove());
      return;
    }
    if(!e.target.closest(".term-popover-185")){
      document.querySelectorAll(".term-popover-185").forEach(x=>x.remove());
    }
    setTimeout(apply185,130);
  }, true);

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(apply185,300);setTimeout(apply185,1200);});
  document.addEventListener("change",()=>setTimeout(apply185,130),true);
window.__pali185 = {apply185, removeLinksInCleanZones185};
})();


/* ===== Pāli Learning Lab 18.6: IPA display without label ===== */
(function(){
  const VERSION_LABEL_186 = "Pāli Learning Lab · 20.41 最终显示修正版";

  function cleanIpaLabel186(root){
    root = root || document;
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_186;

    // Remove visible labels like "" / "" / "" before actual phonetic strings.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        const p = node.parentElement;
        if(!p || p.closest("script,style,input,textarea,select")) return NodeFilter.FILTER_REJECT;
        return /(IPA|ipa|音标)\s*[：:]/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      n.nodeValue = n.nodeValue.replace(/\bIPA\s*[：:]\s*/g, "")
                               .replace(/\bipa\s*[：:]\s*/g, "")
                               .replace(/音标\s*[：:]\s*/g, "");
    });

    // In glossary and popovers, if a row starts with “IPA” in a strong label, remove the label but keep the phonetic value.
    root.querySelectorAll("strong").forEach(s => {
      const t = (s.textContent || "").trim();
      if(/^IPA[：:]?$|^ipa[：:]?$|^音标[：:]?$/.test(t)){
        s.remove();
      }
    });
  }

  // If older glossary renderers generate labels, post-clean them after every render/navigation.
  window.addEventListener("DOMContentLoaded", () => { setTimeout(()=>cleanIpaLabel186(document), 300); setTimeout(()=>cleanIpaLabel186(document), 1200); });
  document.addEventListener("click", () => setTimeout(()=>cleanIpaLabel186(document), 140), true);
  document.addEventListener("change", () => setTimeout(()=>cleanIpaLabel186(document), 140), true);
window.__pali186 = {cleanIpaLabel186};
})();


/* ===== Pāli Learning Lab 18.7: term and vocabulary experience refinement ===== */
(function(){
  const VERSION_LABEL_187 = "Pāli Learning Lab · 20.41 最终显示修正版";
  const CATEGORY_ORDER_187 = [
    "全部",
    "音系与转写",
    "词类与词形",
    "格与名词系统",
    "动词系统",
    "非限定动词",
    "句法分析",
    "佛典阅读术语",
    "学术阅读术语",
    "语法缩略语",
    "基础语法术语"
  ];

  function esc187(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}

  function findTerm187(term){
    const q = String(term||"").trim();
    try{
      return (window.TERMINOLOGY_GLOSSARY || []).find(item=>{
        const cnList = String(item.cn||"").split(/[；;、，,\/]/).map(x=>x.trim());
        return cnList.includes(q) || String(item.en||"").toLowerCase()===q.toLowerCase();
      }) || null;
    }catch(e){return null;}
  }

  function shortExplain187(item){
    const text = String(item?.simple_explanation || item?.note || "暂无详细解释，可进入术语库继续查看。").trim();
    // Keep only the first two short clauses/sentences for popup readability.
    const parts = text.split(/(?<=[。.!?？；;])/).filter(Boolean);
    let out = (parts.slice(0,2).join("") || text).trim();
    if(out.length > 90) out = out.slice(0,90) + "……";
    return out;
  }

  function extractExample187(item){
    const text = String(item?.note || item?.simple_explanation || "");
    const m = text.match(/例[：:]?\s*([^。；;\n]+)/);
    return m ? m[1].trim() : "";
  }

  function rewriteTermPopovers187(root){
    root = root || document;
    root.querySelectorAll(".term-popover-185,.term-popover-187").forEach(card=>{
      if(card.dataset.refined187 === "1") return;
      const h = card.querySelector("h3");
      const term = h ? h.textContent.trim() : "";
      if(!term) return;
      const item = findTerm187(term);
      if(!item) return;
      const en = item.en || "";
      const ipa = item.ipa || "";
      const pali = item.pali || "";
      const example = extractExample187(item);
      card.classList.add("term-popover-187");
      card.dataset.refined187 = "1";
      card.innerHTML = `
        <h3>${esc187(term)}</h3>
        ${en ? `<p class="term-en-line">${esc187(en)}${ipa ? ` <span class="ipa-only">${esc187(ipa)}</span>` : ""}</p>` : ""}
        ${pali ? `<p><strong>巴利/传统术语：</strong>${esc187(pali)}</p>` : ""}
        <p>${esc187(shortExplain187(item))}</p>
        ${example ? `<p><strong>例：</strong>${esc187(example)}</p>` : ""}
        <div class="term-actions">
          <button class="primary small" data-open-glossary-185="${esc187(term)}">进入术语库</button>
          <button class="secondary small" data-close-term-popover-185="1">关闭</button>
        </div>`;
    });
  }

  function normalizeCategoryOptions187(){
    const sel = document.getElementById("termCategorySelect");
    if(!sel || sel.dataset.normalized187 === "1") return;
    const existing = [...sel.options].map(o=>o.value || o.textContent.trim()).filter(Boolean);
    const merged = [...new Set([...CATEGORY_ORDER_187, ...existing])];
    sel.innerHTML = merged.map(v=>`<option value="${esc187(v)}">${esc187(v)}</option>`).join("");
    sel.dataset.normalized187 = "1";
  }

  // 本节词汇查词：统一入口，不让本节单词表每个词都变蓝。
  function addVocabLookupPanel187(){
    const boxes = document.querySelectorAll(".lesson-vocab-box-181,.lesson-vocab-box-183,.lesson-vocab-box-184,.lesson-vocab-box-185");
    boxes.forEach(box=>{
      if(box.querySelector(".vocab-lookup-panel-187")) return;
      const forms = [...box.querySelectorAll(".vocab-form")]
        .map(x=>x.textContent.trim())
        .filter(Boolean)
        .slice(0,12);
      if(!forms.length) return;
      const details = document.createElement("details");
      details.className = "vocab-lookup-panel-187";
      details.innerHTML = `<summary>本节词汇查词</summary>
        <p class="muted">需要查词时再展开。普通单词表保持干净，不逐词加链接。</p>
        <div class="lookup-chip-row-187">
          ${forms.map(f=>`<button type="button" class="lookup-chip-187" data-copy-vocab-187="${esc187(f)}">${esc187(f)}</button>`).join("")}
        </div>
        <p class="muted">点击词形可复制；再到“查词”页面或外部词典检索。</p>`;
      box.appendChild(details);
    });
  }

  function apply187(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_187;
    rewriteTermPopovers187(document);
    normalizeCategoryOptions187();
    addVocabLookupPanel187();
  }

  document.addEventListener("click", function(e){
    const chip = e.target.closest("[data-copy-vocab-187]");
    if(chip){
      e.preventDefault();
      e.stopPropagation();
      const word = chip.dataset.copyVocab187;
      navigator.clipboard?.writeText(word).then(()=>{
        chip.textContent = "已复制：" + word;
        setTimeout(()=>{chip.textContent = word;}, 900);
      }).catch(()=>{
        chip.textContent = word;
      });
      return;
    }
    setTimeout(apply187, 120);
  }, true);

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(apply187,320);setTimeout(apply187,1300);});
  document.addEventListener("change",()=>setTimeout(apply187,120),true);
window.__pali187 = {apply187, rewriteTermPopovers187, addVocabLookupPanel187};
})();


/* ===== Pāli Learning Lab 18.8: grammar note only, no duplicate example analysis ===== */
(function(){
  const VERSION_LABEL_188 = "Pāli Learning Lab · 20.41 最终显示修正版";

  const ANNOT188 = {
    "Buddho":"Buddho < Buddha, m.sg.nom",
    "Buddhaṃ":"Buddhaṃ < Buddha, m.sg.acc",
    "Dhammo":"Dhammo < Dhamma, m.sg.nom",
    "Dhammaṃ":"Dhammaṃ < Dhamma, m.sg.acc",
    "dhammaṃ":"dhammaṃ < dhamma, m.sg.acc",
    "Saṅgho":"Saṅgho < Saṅgha, m.sg.nom",
    "Saṅghaṃ":"Saṅghaṃ < Saṅgha, m.sg.acc",
    "saraṇaṃ":"saraṇaṃ < saraṇa, n.sg.acc",
    "gacchāmi":"gacchāmi < √gam, gaccha-, prs.indic.act.1sg",
    "gacchati":"gacchati < √gam, gaccha-, prs.indic.act.3sg",
    "gacchanti":"gacchanti < √gam, gaccha-, prs.indic.act.3pl",
    "gacchasi":"gacchasi < √gam, gaccha-, prs.indic.act.2sg",
    "gacchatha":"gacchatha < √gam, gaccha-, prs.indic.act.2pl",
    "gacchāma":"gacchāma < √gam, gaccha-, prs.indic.act.1pl",
    "atthi":"atthi < √as, prs.indic.act.3sg",
    "santi":"santi < √as, prs.indic.act.3pl",
    "natthi":"natthi < na + atthi",
    "Bhikkhu":"Bhikkhu < bhikkhu, m.sg.nom",
    "bhikkhu":"bhikkhu < bhikkhu, m.sg.nom",
    "deseti":"deseti < √dis, dese-, prs.indic.act.3sg",
    "suṇāti":"suṇāti < √su, suṇā-, prs.indic.act.3sg",
    "vandāmi":"vandāmi < √vand, vandā-, prs.indic.act.1sg",
    "gantuṃ":"gantuṃ < √gam, inf.",
    "gantvā":"gantvā < √gam, ger.",
    "sutvā":"sutvā < √su, ger.",
    "kataṃ":"kataṃ < √kar, p.p., n.sg.nom/acc",
    "gata":"gata < √gam, p.p.",
    "gacchanto":"gacchanto < √gam, pr.p.act., m.sg.nom",
    "labhamāno":"labhamāno < √labh, pr.p.mid., m.sg.nom",
    "karaṇīyaṃ":"karaṇīyaṃ < √kar, f.p.p., n.sg.nom/acc",
    "ca":"ca < ca, ind.",
    "eva":"eva < eva, ind.",
    "iti":"iti < iti, ind.",
    "api":"api < api, ind.",
    "na":"na < na, ind.",
    "so":"so < ta, pron.m.sg.nom",
    "So":"So < ta, pron.m.sg.nom",
    "te":"te < ta, pron.m.pl.nom",
    "Te":"Te < ta, pron.m.pl.nom",
    "ahaṃ":"ahaṃ < ahaṃ, pron.1sg.nom",
    "Ahaṃ":"Ahaṃ < ahaṃ, pron.1sg.nom"
  };

  function esc188(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}
  function words188(text){return String(text||"").match(/[A-ZĀĪŪṄÑṬḌṆḶA-Za-zāīūṅñṭḍṇḷṃ]+(?:ṃ|ṁ)?/g)||[];}
  function annotation188(pali){
    const seen=new Set(), out=[];
    words188(pali).forEach(w=>{
      if(ANNOT188[w] && !seen.has(w)){out.push(ANNOT188[w]);seen.add(w);}
    });
    return out.join("；");
  }

  function removeExampleAnalysis188(root){
    root=root||document;
    root.querySelectorAll(".example-analysis-181,.example-analysis-187,.example-analysis-188,details").forEach(el=>{
      const txt=(el.textContent||"");
      if(/标注分析|展开标注|标注分析/.test(txt)) el.remove();
    });
    [...root.querySelectorAll("*")].forEach(el=>{
      if((el.textContent||"").trim()==="展开标注分析" || (el.textContent||"").trim()==="标注分析") el.remove();
    });
  }

  function refineGrammarNotes188(){
    if(typeof currentLesson==="undefined" || !currentLesson) return;
    const examples = currentLesson.examples || [];
    const boxes = [...document.querySelectorAll(".example,.example-card,.example-box")];
    boxes.forEach((box,i)=>{
      const ex = examples[i];
      if(!ex || !ex.pali) return;
      const ann = annotation188(ex.pali);
      if(!ann) return;
      let labelNode = [...box.querySelectorAll("strong,b,.label,.muted")].find(x=>/语法说明|说明|解析/.test(x.textContent||""));
      // 找到原“语法说明/说明”区域，替换为标注式；找不到则追加。
      let target = null;
      if(labelNode){
        target = labelNode.closest("p,div,li") || labelNode.parentElement;
      }
      if(target){
        target.innerHTML = `<strong>语法说明：</strong><span class="grammar-annotation-188">${esc188(ann)}</span>`;
      }else if(!box.querySelector(".grammar-annotation-188")){
        const p=document.createElement("p");
        p.className="grammar-note-188";
        p.innerHTML=`<strong>语法说明：</strong><span class="grammar-annotation-188">${esc188(ann)}</span>`;
        box.appendChild(p);
      }
    });
  }

  function apply188(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent=VERSION_LABEL_188;
    removeExampleAnalysis188(document);
    refineGrammarNotes188();
  }

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(apply188,320);setTimeout(apply188,1200);});
  document.addEventListener("click",()=>setTimeout(apply188,140),true);
  document.addEventListener("change",()=>setTimeout(apply188,140),true);
  window.__pali188={apply188,removeExampleAnalysis188,refineGrammarNotes188};
})();


/* ===== Pāli Learning Lab 18.9: root label cleanup ===== */
(function(){
  const VERSION_LABEL_189 = "Pāli Learning Lab · 20.41 最终显示修正版";
  function cleanRootLabels189(root){
    root = root || document;
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_189;
    const pairs = [
      ["√dis"+"/"+"des","√dis"],
      ["√sad"+" / "+"nisīd-","√sad"],
      ["√gam"+" / "+"ā-gam","√gam"],
      ["√vis"+" / "+"pavis-","√vis"],
      ["√har"+" / "+"vihar-","√har"]
    ];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        const p = node.parentElement;
        if(!p || p.closest("script,style,input,textarea,select")) return NodeFilter.FILTER_REJECT;
        return pairs.some(([a])=>node.nodeValue.includes(a)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      let v = n.nodeValue;
      pairs.forEach(([a,b])=>{v = v.split(a).join(b);});
      n.nodeValue = v;
    });
  }
  window.addEventListener("DOMContentLoaded",()=>{setTimeout(()=>cleanRootLabels189(document),300);setTimeout(()=>cleanRootLabels189(document),1200);});
  document.addEventListener("click",()=>setTimeout(()=>cleanRootLabels189(document),120),true);
  document.addEventListener("change",()=>setTimeout(()=>cleanRootLabels189(document),120),true);
})();


/* ===== Pāli Learning Lab 19.0: global sync + bilingual grammar notes ===== */
(function(){
  const VERSION_LABEL_190 = "Pāli Learning Lab · 20.41 最终显示修正版";

  const CN190 = {
    "m.":"阳性","f.":"阴性","n.":"中性",
    "sg":"单数","pl":"复数",
    "nom":"主格","acc":"宾格","ins":"工具格","dat":"与格","abl":"从格","gen":"属格","loc":"处格","voc":"呼格",
    "prs":"现在时","fut":"将来时","aor":"不定过去","pst":"过去类","perf":"完成式",
    "indic":"陈述","imp":"命令","opt":"祈愿/可能","cond":"条件式",
    "act":"主动","mid":"中间语态","pass":"被动",
    "1sg":"第一人称单数","2sg":"第二人称单数","3sg":"第三人称单数",
    "1pl":"第一人称复数","2pl":"第二人称复数","3pl":"第三人称复数",
    "pron":"代词","adj":"形容词","ind.":"不变词",
    "inf.":"不定式","ger.":"连续体",
    "pr.p.act.":"现在主动分词","pr.p.mid.":"现在中间语态分词","pr.p.":"现在分词",
    "p.p.":"过去分词","f.p.p.":"将来被动分词"
  };

  const ANNOT190 = {
    "Buddho":"Buddho < Buddha, m.sg.nom",
    "Buddhaṃ":"Buddhaṃ < Buddha, m.sg.acc",
    "Dhammo":"Dhammo < Dhamma, m.sg.nom",
    "Dhammaṃ":"Dhammaṃ < Dhamma, m.sg.acc",
    "dhammaṃ":"dhammaṃ < dhamma, m.sg.acc",
    "Saṅgho":"Saṅgho < Saṅgha, m.sg.nom",
    "Saṅghaṃ":"Saṅghaṃ < Saṅgha, m.sg.acc",
    "saraṇaṃ":"saraṇaṃ < saraṇa, n.sg.acc",
    "gacchāmi":"gacchāmi < √gam, gaccha-, prs.indic.act.1sg",
    "gacchati":"gacchati < √gam, gaccha-, prs.indic.act.3sg",
    "gacchanti":"gacchanti < √gam, gaccha-, prs.indic.act.3pl",
    "gacchasi":"gacchasi < √gam, gaccha-, prs.indic.act.2sg",
    "gacchatha":"gacchatha < √gam, gaccha-, prs.indic.act.2pl",
    "gacchāma":"gacchāma < √gam, gaccha-, prs.indic.act.1pl",
    "atthi":"atthi < √as, prs.indic.act.3sg",
    "santi":"santi < √as, prs.indic.act.3pl",
    "natthi":"natthi < na + atthi",
    "Bhikkhu":"Bhikkhu < bhikkhu, m.sg.nom",
    "bhikkhu":"bhikkhu < bhikkhu, m.sg.nom",
    "deseti":"deseti < √dis, dese-, prs.indic.act.3sg",
    "suṇāti":"suṇāti < √su, suṇā-, prs.indic.act.3sg",
    "vandāmi":"vandāmi < √vand, vandā-, prs.indic.act.1sg",
    "gantuṃ":"gantuṃ < √gam, inf.",
    "gantvā":"gantvā < √gam, ger.",
    "sutvā":"sutvā < √su, ger.",
    "kataṃ":"kataṃ < √kar, p.p., n.sg.nom/acc",
    "gata":"gata < √gam, p.p.",
    "gacchanto":"gacchanto < √gam, pr.p.act., m.sg.nom",
    "labhamāno":"labhamāno < √labh, pr.p.mid., m.sg.nom",
    "karaṇīyaṃ":"karaṇīyaṃ < √kar, f.p.p., n.sg.nom/acc",
    "ca":"ca < ca, ind.",
    "eva":"eva < eva, ind.",
    "iti":"iti < iti, ind.",
    "api":"api < api, ind.",
    "na":"na < na, ind.",
    "so":"so < ta, pron.m.sg.nom",
    "So":"So < ta, pron.m.sg.nom",
    "te":"te < ta, pron.m.pl.nom",
    "Te":"Te < ta, pron.m.pl.nom",
    "ahaṃ":"ahaṃ < ahaṃ, pron.1sg.nom",
    "Ahaṃ":"Ahaṃ < ahaṃ, pron.1sg.nom"
  };

  function esc190(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}

  function expand190(tag){
    tag = String(tag||"").trim().replace(/,$/,"");
    if(CN190[tag]) return CN190[tag];
    let raw = tag.split(".").filter(Boolean);
    let out = [];
    raw.forEach(p=>{
      if(p==="m"||p==="f"||p==="n") out.push(CN190[p+"."]||p);
      else if(p.includes("/")) out.push(p.split("/").map(x=>CN190[x]||x).join("/"));
      else out.push(CN190[p]||p);
    });
    return out.join("·");
  }

  function bilingual190(line){
    if(!line || /（[^）]+）/.test(line)) return line;
    const m = String(line).match(/,\s*([^,，；;]+)$/);
    if(!m) return line;
    const tag = m[1].trim();
    if(!/(m\.|f\.|n\.|sg|pl|nom|acc|ins|dat|abl|gen|loc|voc|prs|fut|aor|indic|act|mid|pass|inf\.|ger\.|pr\.p|p\.p|f\.p\.p|ind\.|pron|adj|[123]sg|[123]pl)/.test(tag)) return line;
    const cn = expand190(tag);
    return cn && cn !== tag ? line + "（" + cn + "）" : line;
  }

  function words190(text){
    return String(text||"").match(/[A-ZĀĪŪṄÑṬḌṆḶA-Za-zāīūṅñṭḍṇḷṃ]+(?:ṃ|ṁ)?/g)||[];
  }

  function annotation190(pali){
    const seen = new Set(), out = [];
    words190(pali).forEach(w=>{
      if(ANNOT190[w] && !seen.has(w)){
        out.push(bilingual190(ANNOT190[w]));
        seen.add(w);
      }
    });
    return out.join("；");
  }

  function removeDuplicateAnalysis190(root){
    root = root || document;
    root.querySelectorAll(".example-analysis-181,.example-analysis-187,.example-analysis-188,details").forEach(el=>{
      const t = el.textContent || "";
      if(/重复分析|重复分析|展开分析|标注分析/.test(t)) el.remove();
    });
  }

  function cleanLabels190(root){
    root = root || document;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        const p = node.parentElement;
        if(!p || p.closest("script,style,input,textarea,select")) return NodeFilter.FILTER_REJECT;
        return /翻译|√dis\/des|√sad \/ nisīd-|√gam \/ ā-gam|√vis \/ pavis-|√har \/ vihar-/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      n.nodeValue = n.nodeValue
        .replace(/翻译/g,"翻译")
        .replace(/√dis\/des/g,"√dis")
        .replace(/√sad \/ nisīd-/g,"√sad")
        .replace(/√gam \/ ā-gam/g,"√gam")
        .replace(/√vis \/ pavis-/g,"√vis")
        .replace(/√har \/ vihar-/g,"√har");
    });
  }

  function refineGrammarNotes190(){
    if(typeof currentLesson === "undefined" || !currentLesson) return;
    const examples = currentLesson.examples || [];
    const boxes = [...document.querySelectorAll(".example,.example-card,.example-box")];
    boxes.forEach((box,i)=>{
      const ex = examples[i];
      if(!ex || !ex.pali) return;
      const ann = annotation190(ex.pali);
      if(!ann) return;

      let target = [...box.querySelectorAll("p,div,li")].find(el=>/语法说明|说明|解析/.test(el.textContent||""));
      if(target){
        target.innerHTML = `<strong>语法说明：</strong><span class="grammar-annotation-190">${esc190(ann)}</span>`;
      }else if(!box.querySelector(".grammar-annotation-190")){
        const p = document.createElement("p");
        p.className = "grammar-note-190";
        p.innerHTML = `<strong>语法说明：</strong><span class="grammar-annotation-190">${esc190(ann)}</span>`;
        box.appendChild(p);
      }
    });
  }

  function addAbbrevHelp190(){
    if(!document.querySelector("#lessonView:not(.hidden)") || document.querySelector(".abbrev-help-190")) return;
    const summary = document.getElementById("lessonSummary");
    if(!summary) return;
    const details = document.createElement("details");
    details.className = "abbrev-help-190";
    details.innerHTML = `<summary>标注缩略说明</summary>
      <div class="abbrev-grid-190">
        <span>m. 阳性</span><span>f. 阴性</span><span>n. 中性</span>
        <span>sg. 单数</span><span>pl. 复数</span>
        <span>nom 主格</span><span>acc 宾格</span><span>gen 属格</span><span>loc 处格</span>
        <span>prs 现在时</span><span>indic 陈述</span><span>act 主动</span><span>mid 中间语态</span><span>pass 被动</span>
        <span>inf. 不定式</span><span>ger. 连续体</span><span>ind. 不变词</span>
      </div>`;
    summary.insertAdjacentElement("afterend", details);
  }

  function apply190(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_190;
    removeDuplicateAnalysis190(document);
    cleanLabels190(document);
    refineGrammarNotes190();
    addAbbrevHelp190();
  }

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(apply190,320);setTimeout(apply190,1300);});
  document.addEventListener("click",()=>setTimeout(apply190,140),true);
  document.addEventListener("change",()=>setTimeout(apply190,140),true);

  window.__pali190 = {apply190, annotation190};
})();


/* ===== Pāli Learning Lab 19.1: usage cleanup ===== */
(function(){
  const VERSION_LABEL_191 = "Pāli Learning Lab · 20.41 最终显示修正版";
  const REMOVED_USAGE_IDS_191 = new Set([102,104,105,106,113,117]);
  const USAGE_IDS_191 = new Set([99,103,107,108,112,114]);

  function cleanupUsage191(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_191;

    try{
      if(Array.isArray(window.GRAMMAR)){
        window.GRAMMAR = window.GRAMMAR.filter(l => !REMOVED_USAGE_IDS_191.has(Number(l.id)));
        window.GRAMMAR.forEach(l=>{
          if(USAGE_IDS_191.has(Number(l.id)) || l.category === "学习说明"){
            l.module = "使用说明";
            l.category = "使用说明";
          }
          if(typeof l.title === "string"){
            l.title = l.title.replace(/使用说明/g,"使用说明")
                             .replace(/网站学习路径/g,"使用说明")
                             .replace(/易混概念对照：/g,"使用说明：易混概念对照")
                             .replace(/核心句型模板：/g,"使用说明：核心句型模板");
          }
        });
      }
    }catch(e){}

    if(!document.body) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        const p = node.parentElement;
        if(!p || p.closest("script,style,input,textarea,select")) return NodeFilter.FILTER_REJECT;
        return /使用说明|使用说明|使用任务|学习阶段说明|按学习阶段逐步掌握/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      n.nodeValue = n.nodeValue
        .replace(/使用说明/g,"使用说明")
        .replace(/使用说明/g,"使用说明")
        .replace(/使用任务/g,"")
        .replace(/按学习阶段逐步掌握/g,"按学习阶段逐步掌握")
        .replace(/学习阶段说明/g,"")
        .replace(/按学习阶段逐步掌握/g,"按学习阶段逐步掌握");
    });
  }

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(cleanupUsage191,260);setTimeout(cleanupUsage191,1100);});
  document.addEventListener("click",()=>setTimeout(cleanupUsage191,130),true);
  document.addEventListener("change",()=>setTimeout(cleanupUsage191,130),true);
})();


/* ===== Pāli Learning Lab 19.2: sentence analysis optimization ===== */
(function(){
  const VERSION_LABEL_192 = "Pāli Learning Lab · 20.41 最终显示修正版";

  const CN192 = {
    m:"阳性", f:"阴性", n:"中性", sg:"单数", pl:"复数",
    nom:"主格", acc:"宾格", ins:"工具格", dat:"与格", abl:"从格", gen:"属格", loc:"处格", voc:"呼格",
    prs:"现在时", fut:"将来时", aor:"不定过去", pst:"过去类", perf:"完成式",
    indic:"陈述", imp:"命令", opt:"祈愿/可能", cond:"条件式",
    act:"主动", mid:"中间语态", pass:"被动",
    "1sg":"第一人称单数", "2sg":"第二人称单数", "3sg":"第三人称单数",
    "1pl":"第一人称复数", "2pl":"第二人称复数", "3pl":"第三人称复数",
    pron:"代词", adj:"形容词", ind:"不变词", inf:"不定式", ger:"连续体",
    "pr.p.act":"现在主动分词", "pr.p.mid":"现在中间语态分词", "pr.p":"现在分词",
    "p.p":"过去分词", "f.p.p":"将来被动分词"
  };

  function esc192(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}
  function expandGrammar192(g){
    const raw = String(g||"").trim();
    if(!raw || /（.*）/.test(raw) || raw.includes("+") || /类|合写|连音|复合|词尾|尊称|数词/.test(raw)) return raw;
    const pieces = raw.split(".").filter(Boolean);
    if(!pieces.length) return raw;
    const out = pieces.map(p=>p.includes("/") ? p.split("/").map(x=>CN192[x]||x).join("/") : (CN192[p]||p)).join("·");
    return out && out !== raw ? `${raw}（${out}）` : raw;
  }

  function unifySentenceDisplay192(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent=VERSION_LABEL_192;

    const card=document.getElementById("sentenceAnalysisCard");
    if(!card) return;

    // Convert grammar cells to bilingual labels when the data has not already been updated.
    card.querySelectorAll(".token-table tr").forEach((tr,i)=>{
      const cells=tr.querySelectorAll("td");
      if(i===0){
        if(cells.length>=5){
          cells[4].remove();
          cells[0].textContent="词形";
          cells[1].textContent="语法说明";
          cells[2].textContent="句中功能";
          cells[3].textContent="意义";
        }
        return;
      }
      if(cells.length>=4){
        cells[1].textContent=expandGrammar192(cells[1].textContent);
      }
      // Remove per-token lookup/analyze column to keep table clean.
      if(cells.length>=5) cells[4].remove();
    });

    // Add one unified lookup panel under the table instead of per-token links.
    const table=card.querySelector(".token-table");
    if(table && !card.querySelector(".sentence-lookup-panel-192")){
      const forms=[...table.querySelectorAll("tr:not(:first-child) td:first-child")].map(td=>td.textContent.trim()).filter(Boolean);
      if(forms.length){
        const details=document.createElement("details");
        details.className="sentence-lookup-panel-192";
        details.innerHTML=`<summary>本句词汇查词</summary>
          <p class="muted">表格保持干净；需要查词时展开，点击词形复制。</p>
          <div class="sentence-lookup-row-192">${forms.map(f=>`<button type="button" class="lookup-chip-187" data-copy-vocab-187="${esc192(f)}">${esc192(f)}</button>`).join("")}</div>`;
        table.insertAdjacentElement("afterend",details);
      }
    }

    // Add a light level guidance block, once per card.
    if(!card.querySelector(".sentence-level-guide-192")){
      const level=card.querySelector(".pill")?.textContent||"";
      let msg="按当前层级目标练习，不提前要求后面内容。";
      if(level.includes("佛典公式")) msg="先整体识别公式句，再分析核心词形。";
      else if(level.includes("综合")) msg="综合运用动词、格位、非限定动词和结构信号。";
      else if(level.includes("进阶")) msg="遇到连音、合写或固定表达时，先还原结构，再分析词形。";
      const div=document.createElement("div");
      div.className="sentence-level-guide-192";
      div.innerHTML=`<strong>分层提醒：</strong>${esc192(msg)}`;
      card.appendChild(div);
    }
  }

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(unifySentenceDisplay192,320);setTimeout(unifySentenceDisplay192,1200);});
  document.addEventListener("click",()=>setTimeout(unifySentenceDisplay192,140),true);
  document.addEventListener("change",()=>setTimeout(unifySentenceDisplay192,140),true);
  window.__pali192={unifySentenceDisplay192, expandGrammar192};
})();


/* ===== Pāli Learning Lab 19.3: academic training and Tipitaka integration ===== */
(function(){
  const VERSION_LABEL_193 = "Pāli Learning Lab · 20.41 最终显示修正版";

  function applyAcademic193(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent=VERSION_LABEL_193;

    const acBox=document.getElementById("academicTrainingContent");
    const cat=document.getElementById("academicCategorySelect")?.value || "";
    const data=window.ACADEMIC_TRAINING_DATA || {};
    if(acBox && (cat==="全部" || cat==="引用规范") && data.citation && !acBox.querySelector(".citation-examples-193")){
      const examples=data.citation.citation_examples || [];
      const tpl=data.citation.record_template || [];
      const block=document.createElement("div");
      block.className="qa-full-card citation-examples-193";
      block.innerHTML=`<h3>常见引用格式</h3>
        <table class="qa-table"><tr><th>格式</th><th>含义</th></tr>${examples.map(e=>`<tr><td><strong>${e.format}</strong></td><td>${e.meaning}</td></tr>`).join("")}</table>
        <h3>材料记录模板</h3>
        <pre>${tpl.join("\n")}</pre>`;
      const title=[...acBox.querySelectorAll(".qa-section-title")].find(x=>x.textContent.includes("引用规范"));
      if(title){
        let insertAfter=title;
        while(insertAfter.nextElementSibling && insertAfter.nextElementSibling.classList.contains("qa-full-card")){
          insertAfter=insertAfter.nextElementSibling;
        }
        insertAfter.insertAdjacentElement("afterend", block);
      }else{
        acBox.appendChild(block);
      }
    }

    // Clarify placement in academic view.
    if(acBox && !acBox.querySelector(".academic-placement-note-193")){
      const note=document.createElement("div");
      note.className="module-warning academic-placement-note-193";
      note.innerHTML="<strong>学习位置：</strong>三藏层级介绍放在“佛典阅读背景知识—三藏结构与略号”；本页重点训练引用规范、材料记录和小型阅读任务。";
      acBox.prepend(note);
    }
  }

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(applyAcademic193,300);setTimeout(applyAcademic193,1200);});
  document.addEventListener("click",()=>setTimeout(applyAcademic193,140),true);
  document.addEventListener("change",()=>setTimeout(applyAcademic193,140),true);
  window.__pali193={applyAcademic193};
})();





/* ===== Pāli Learning Lab 19.7: distinguish sentence analysis and sentence patterns ===== */
(function(){
  const VERSION_LABEL_197 = "Pāli Learning Lab · 20.41 最终显示修正版";

  function apply197(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent=VERSION_LABEL_197;
    if(!document.body)return;

    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const p=node.parentElement;
        if(!p||p.closest("script,style,input,textarea,select"))return NodeFilter.FILTER_REJECT;
        return /ind\.与常用句式|ind\. 与常用句式|ind\.与关联句|句型模板(?!速查)|句子分析(?!训练)/.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      let v=n.nodeValue
        .replace(/ind\. ?与常用句式/g,"不变词与常用句式")
        .replace(/ind\. ?与关联句/g,"不变词与关联句");
      if(v.trim()==="句子分析") v="句子分析训练";
      if(v.trim()==="句型模板") v="句型模板速查";
      n.nodeValue=v;
    });

    // Add short distinction note to the language ability layer if missing.
    const languageLayer=document.getElementById("homeLanguageLayer");
    if(languageLayer && !document.querySelector(".sentence-pattern-distinction-197")){
      const note=document.createElement("p");
      note.className="muted home-tip sentence-pattern-distinction-197";
      note.textContent="句型模板用于快速认识常见结构；句子分析训练用于把模板应用到具体句子。二者不重复，前者偏速查，后者偏训练。";
      const grid=languageLayer.parentElement?.querySelector(".practice-grid");
      if(grid) grid.insertAdjacentElement("afterend",note);
    }
  }

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(apply197,300);setTimeout(apply197,1200);});
  document.addEventListener("click",()=>setTimeout(apply197,140),true);
  document.addEventListener("change",()=>setTimeout(apply197,140),true);
})();


/* ===== Pāli Learning Lab 19.8: practice naming and Buddhist terms ===== */
(function(){
  const VERSION_LABEL_198 = "Pāli Learning Lab · 20.41 最终显示修正版";

  function apply198(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent=VERSION_LABEL_198;
    if(!document.body)return;

    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const p=node.parentElement;
        if(!p||p.closest("script,style,input,textarea,select"))return NodeFilter.FILTER_REJECT;
        return /课程练习|专项强化/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      n.nodeValue=n.nodeValue
        .replace(/课程练习/g,"课程练习")
        .replace(/专项强化/g,"专项强化");
    });

    const languageLayer=document.getElementById("homeLanguageLayer");
    if(languageLayer && !document.querySelector(".practice-distinction-198")){
      const note=document.createElement("p");
      note.className="muted home-tip practice-distinction-198";
      note.textContent="课程练习跟着章节走，适合学完一节后随学随测；专项强化按能力点集中训练，适合查漏补缺。";
      const grid=languageLayer.parentElement?.querySelector(".practice-grid");
      if(grid) grid.insertAdjacentElement("afterend",note);
    }
  }

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(apply198,300);setTimeout(apply198,1200);});
  document.addEventListener("click",()=>setTimeout(apply198,140),true);
  document.addEventListener("change",()=>setTimeout(apply198,140),true);
})();


/* ===== Pāli Learning Lab 19.9: mobile layout and staged answers ===== */
(function(){
  const VERSION_LABEL_199 = "Pāli Learning Lab · 20.41 最终显示修正版";

  function apply199(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent=VERSION_LABEL_199;

    // If an older cached index lacks the translation button, insert it.
    const hintBtn=document.getElementById("showSentenceHintBtn");
    if(hintBtn && !document.getElementById("showSentenceTranslationBtn")){
      const btn=document.createElement("button");
      btn.id="showSentenceTranslationBtn";
      btn.className="secondary";
      btn.textContent="显示翻译";
      btn.onclick=()=>{ if(typeof renderSentenceCard==="function") renderSentenceCard("translation"); };
      hintBtn.insertAdjacentElement("beforebegin", btn);
      const row=hintBtn.closest(".button-row");
      if(row) row.classList.add("four-buttons");
    }

    // Keep old token lookup buttons out of narrow screens after 19.2 unified lookup panel.
    document.querySelectorAll(".token-table tr").forEach((tr,i)=>{
      const cells=tr.querySelectorAll("td");
      if(i===0 && cells.length>=5){cells[4].remove();}
      if(i>0 && cells.length>=5){cells[4].remove();}
    });
  }

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(apply199,300);setTimeout(apply199,1200);});
  document.addEventListener("click",()=>setTimeout(apply199,140),true);
  document.addEventListener("change",()=>setTimeout(apply199,140),true);
})();



/* ===== Pāli Learning Lab 20.1: module learning standalone page ===== */
(function(){
  const VERSION_LABEL_201 = "Pāli Learning Lab · 20.41 最终显示修正版";

  function ensureModulePage201(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent=VERSION_LABEL_201;

    // Create standalone module view if an old cached HTML lacks it.
    if(!document.getElementById("moduleLearningView")){
      const sec=document.createElement("section");
      sec.id="moduleLearningView";
      sec.className="view hidden";
      sec.innerHTML=`<section class="card">
        <button class="small secondary back-home">首页</button>
        <h2>模块学习</h2>
        <p class="muted">按语法模块进入课程。</p>
        <div id="moduleGridPage" class="module-grid"></div>
      </section>`;
      document.body.appendChild(sec);
    }

    // Hide old bottom module card if it still exists in cached HTML.
    const old=document.getElementById("moduleGridCard");
    if(old) old.style.display="none";

    // Ensure the page grid has cards.
    try{
      if(typeof renderModules==="function") renderModules();
    }catch(e){}
  }

  function goModulePage201(){
    ensureModulePage201();
    try{
      if(typeof safeSwitch==="function") safeSwitch("moduleLearningView");
      else if(typeof switchView==="function") switchView("moduleLearningView");
    }catch(e){}
  }

  // Capture module-learning button before old scroll-to-bottom handlers.
  document.addEventListener("click",function(e){
    const btn=e.target.closest('[data-action="modules"]');
    if(btn){
      e.preventDefault();
      e.stopImmediatePropagation();
      goModulePage201();
      return;
    }
  },true);

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(ensureModulePage201,300);setTimeout(ensureModulePage201,1200);});
  window.__paliModulePage201={ensureModulePage201,goModulePage201};
})();


/* ===== Pāli Learning Lab 20.2: page navigation and previous/back-to-top ===== */
(function(){
  const VERSION_LABEL_202 = "Pāli Learning Lab · 20.41 最终显示修正版";

  function visibleView202(){
    const views=[...document.querySelectorAll(".view")];
    const hit=views.find(v=>!v.classList.contains("hidden"));
    return hit ? hit.id : "homeView";
  }

  function enhanceSwitch202(){
    if(window.__paliSwitchEnhanced202) return;
    window.__paliNavStack202 = window.__paliNavStack202 || [];
    const patchOne = name => {
      if(typeof window[name] !== "function") return;
      const old = window[name];
      window[name] = function(id){
        try{
          const cur = visibleView202();
          if(cur && id && cur !== id){
            const stack = window.__paliNavStack202;
            if(!stack.length || stack[stack.length-1] !== cur) stack.push(cur);
            if(stack.length > 80) stack.shift();
          }
        }catch(e){}
        return old.apply(this, arguments);
      };
    };
    patchOne("safeSwitch");
    patchOne("switchView");
    window.__paliSwitchEnhanced202 = true;
  }

  function goPrevious202(){
    const stack = window.__paliNavStack202 || [];
    let target = null;
    while(stack.length && !target){
      const candidate = stack.pop();
      if(candidate && candidate !== visibleView202() && document.getElementById(candidate)) target = candidate;
    }
    if(!target) target = "homeView";
    try{
      if(typeof safeSwitch === "function") safeSwitch(target);
      else if(typeof switchView === "function") switchView(target);
    }catch(e){}
  }

  function insertNavButtons202(){
    const badge=document.querySelector(".visual-version-badge");
    if(badge) badge.textContent=VERSION_LABEL_202;

    document.querySelectorAll(".view:not(#homeView) > .card, .view:not(#homeView) > section.card").forEach(card=>{
      if(card.querySelector(".page-nav-bar-202")) return;
      const bar=document.createElement("div");
      bar.className="page-nav-bar-202";
      bar.innerHTML=`<button type="button" class="small secondary page-prev-202">前一页</button>`;
      card.insertAdjacentElement("afterbegin", bar);

      // Remove duplicate old back-home visual clutter only when it sits immediately after our bar.
      const old=bar.nextElementSibling;
      if(old && old.matches("button.back-home")){
        old.style.display="none";
      }
    });
  }

  function ensureTopButton202(){
    let btn=document.getElementById("backTopBtn202");
    if(!btn){
      btn=document.createElement("button");
      btn.id="backTopBtn202";
      btn.type="button";
      btn.textContent="返回顶部";
      btn.className="back-top-202";
      btn.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
      document.body.appendChild(btn);
    }
    const update=()=>{
      if(window.scrollY>480) btn.classList.add("show");
      else btn.classList.remove("show");
    };
    window.removeEventListener("scroll", window.__paliBackTopUpdate202 || (()=>{}));
    window.__paliBackTopUpdate202 = update;
    window.addEventListener("scroll", update, {passive:true});
    update();
  }

  function applyNavigation202(){
    enhanceSwitch202();
    insertNavButtons202();
    ensureTopButton202();
  }

  document.addEventListener("click",function(e){
    const prev=e.target.closest(".page-prev-202");
    if(prev){
      e.preventDefault();
      e.stopImmediatePropagation();
      goPrevious202();
      return;
    }

  },true);

  window.addEventListener("DOMContentLoaded",()=>{setTimeout(applyNavigation202,250);setTimeout(applyNavigation202,1200);});
  document.addEventListener("click",()=>setTimeout(applyNavigation202,150),true);
  document.addEventListener("change",()=>setTimeout(applyNavigation202,150),true);
  const mo202=new MutationObserver(()=>setTimeout(applyNavigation202,120));
  window.addEventListener("DOMContentLoaded",()=>{if(document.body)mo202.observe(document.body,{childList:true,subtree:true});});
  window.__paliNav202={goPrevious202,applyNavigation202};
})();


/* ===== Pāli Learning Lab 20.8: lesson Pali autolink intentionally disabled ===== */
(function(){
  window.__lessonPaliAutolinkPolicy208 = {
    enabledInLearningLessons: false,
    reason: "学习章节已有本节单词列表；不再给正文巴利语逐词加查词链接，以减少重复和提升速度。",
    stillAvailableIn: ["句子分析", "查词页面", "词形分析"]
  };
})();


/* ===== Pāli Learning Lab 20.13: three layer pages ===== */
(function(){
  const VERSION_LABEL_2013 = "Pāli Learning Lab · 20.41 最终显示修正版";

  function gotoLayer2013(action){
    const map = {
      startLayer: "startLayerView",
      languageLayer: "languageLayerView",
      researchLayer: "researchLayerView"
    };
    const id = map[action];
    if(!id) return false;
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2013;
    try{
      if(typeof safeSwitch === "function") safeSwitch(id);
      else if(typeof switchView === "function") switchView(id);
      else{
        document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
        document.getElementById(id)?.classList.remove("hidden");
      }
    }catch(e){}
    return true;
  }

  document.addEventListener("click", function(e){
    const btn = e.target.closest('[data-layer-action="startLayer"],[data-layer-action="languageLayer"],[data-layer-action="researchLayer"]');
    if(btn){
      e.preventDefault();
      e.stopImmediatePropagation();
      gotoLayer2013(btn.dataset.layerAction);
      return;
    }
  }, true);

  window.addEventListener("DOMContentLoaded", function(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2013;
  });

  window.__paliLayerPages2013 = {gotoLayer2013};
})();


/* ===== Pāli Learning Lab 20.14: robust three-layer entry click fix ===== */
(function(){
  const VERSION_LABEL_2014 = "Pāli Learning Lab · 20.41 最终显示修正版";
  function gotoLayer2014(action){
    const map = {
      startLayer: "startLayerView",
      languageLayer: "languageLayerView",
      researchLayer: "researchLayerView"
    };
    const id = map[action];
    if(!id) return false;
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2014;
    try{
      if(typeof safeSwitch === "function") safeSwitch(id);
      else if(typeof switchView === "function") switchView(id);
      else{
        document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
        document.getElementById(id)?.classList.remove("hidden");
        window.scrollTo({top:0,behavior:"instant"});
      }
    }catch(e){
      document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
      document.getElementById(id)?.classList.remove("hidden");
    }
    return true;
  }

  document.addEventListener("click", function(e){
    const btn = e.target.closest("[data-layer-action]");
    if(btn){
      const ok = gotoLayer2014(btn.dataset.layerAction);
      if(ok){
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      return;
    }
    // 兼容误缓存的旧 data-action 三层入口。
    const old = e.target.closest('[data-action="startLayer"],[data-action="languageLayer"],[data-action="researchLayer"]');
    if(old){
      const ok = gotoLayer2014(old.dataset.action);
      if(ok){
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      return;
    }
  }, true);

  window.addEventListener("DOMContentLoaded", function(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2014;
  });

  window.__paliLayerPages2014 = {gotoLayer2014};
})();


/* ===== Pāli Learning Lab 20.17: safe speed policy ===== */
(function(){
  window.__paliSafeSpeed2017 = {
    principle: "功能完整优先；不删除内容；只移除已被新版替代的旧词汇表脚本和旧MutationObserver。",
    lessonVocabularyProvider: "18.4 global lesson vocabulary audit",
    preserved: ["本节单词","核心概念","中文术语首链","英文音标","术语弹窗","查词","词形分析","句子分析四步","三层独立页面","前一页","回到顶部"]
  };
  window.addEventListener("DOMContentLoaded", function(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = "Pāli Learning Lab · 20.41 最终显示修正版";
  });
})();


/* ===== Pāli Learning Lab 20.18: data lazy loading ===== */
(function(){
  const VERSION_LABEL_2018 = "Pāli Learning Lab · 20.41 最终显示修正版";
  const DATA_2018 = {
    sentence: ["sentence-analysis-data.js", "SENTENCE_ANALYSIS_DATA"],
    linguistics: ["linguistics-tips-data.js", "LINGUISTICS_TIPS"],
    routes: ["learning-routes-data.js", "LEARNING_ROUTES"],
    dictionary: ["dictionary-sites-data.js", "PALI_DICTIONARY_SITES"],
    token: ["token-analysis-data.js", "TOKEN_ANALYSIS_DATA"],
    moduleGuides: ["module-guides-data.js", "MODULE_GUIDES"],
    confusions: ["confusion-pairs-data.js", "CONFUSION_PAIRS"],
    patterns: ["sentence-patterns-data.js", "SENTENCE_PATTERNS"],
    buddhistReading: ["buddhist-reading-data.js", "BUDDHIST_READING_PATTERNS"],
    buddhistBackground: ["buddhist-background-data.js", "BUDDHIST_BACKGROUND_DATA"],
    academic: ["academic-training-data.js", "ACADEMIC_TRAINING_DATA"],
    terminology: ["terminology-glossary-data.js", "TERMINOLOGY_GLOSSARY"]
  };
  const ACTION_DATA_2018 = {
    learningRoute: ["routes"],
    dictionaryLookup: ["dictionary", "token"],
    sentenceAnalysis: ["sentence"],
    sentencePatterns: ["patterns"],
    buddhistReading: ["buddhistReading"],
    buddhistBackground: ["buddhistBackground"],
    academicTraining: ["academic"],
    linguisticsTips: ["linguistics"],
    terminologyGlossary: ["terminology"],
    moduleGuide: ["moduleGuides"],
    confusionPairs: ["confusions"]
  };
  const LESSON_DATA_2018 = ["terminology", "confusions", "patterns", "buddhistReading", "buddhistBackground", "academic"];
  const loaded2018 = new Set();
  const loading2018 = {};

  function setBadge2018(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2018;
  }
  function hasGlobal2018(varName){
    try{
      if(window[varName]) return true;
      return Function("return typeof " + varName + " !== 'undefined'")();
    }catch(e){
      return false;
    }
  }
  function exposeGlobal2018(varName){
    try{
      if(!window[varName] && Function("return typeof " + varName + " !== 'undefined'")()){
        window[varName] = Function("return " + varName)();
      }
    }catch(e){}
  }
  function loadOne2018(key){
    const pair = DATA_2018[key];
    if(!pair) return Promise.resolve();
    const [file, varName] = pair;
    if(loaded2018.has(key) || hasGlobal2018(varName)){
      exposeGlobal2018(varName);
      loaded2018.add(key);
      return Promise.resolve();
    }
    if(loading2018[key]) return loading2018[key];

    loading2018[key] = new Promise((resolve, reject)=>{
      const s = document.createElement("script");
      s.src = file + "?v=20.41";
      s.onload = () => {
        exposeGlobal2018(varName);
        loaded2018.add(key);
        resolve();
      };
      s.onerror = () => reject(new Error("数据文件加载失败：" + file));
      document.head.appendChild(s);
    });
    return loading2018[key];
  }
  function ensureData2018(keys){
    return Promise.all((keys || []).map(loadOne2018)).then(()=>setBadge2018());
  }
  function goAction2018(action){
    if(action === "learningRoute"){
      const go = () => {
        if(typeof renderLearningRoutes === "function") renderLearningRoutes();
        if(typeof switchView === "function") switchView("learningRouteView");
      };
      if(window.__paliGrammarLazy2020?.ensureIndex) window.__paliGrammarLazy2020.ensureIndex().then(go);
      else go();
    }else if(action === "dictionaryLookup"){
      if(typeof renderDictionarySites === "function") renderDictionarySites();
      if(typeof renderLookupHistory === "function") renderLookupHistory();
      if(typeof switchView === "function") switchView("dictionaryLookupView");
    }else if(action === "sentenceAnalysis"){
      if(typeof renderSentenceLevels === "function") renderSentenceLevels();
      if(typeof switchView === "function") switchView("sentenceAnalysisView");
    }else if(action === "sentencePatterns"){
      if(typeof renderSentencePatterns === "function") renderSentencePatterns();
      if(typeof switchView === "function") switchView("sentencePatternsView");
    }else if(action === "buddhistReading"){
      if(typeof renderBuddhistReadingCategories === "function") renderBuddhistReadingCategories();
      if(typeof renderBuddhistReading === "function") renderBuddhistReading();
      if(typeof switchView === "function") switchView("buddhistReadingView");
    }else if(action === "buddhistBackground"){
      if(typeof renderBuddhistBackground === "function") renderBuddhistBackground("concepts");
      if(typeof switchView === "function") switchView("buddhistBackgroundView");
    }else if(action === "academicTraining"){
      if(typeof renderAcademicTraining === "function") renderAcademicTraining("method");
      if(typeof switchView === "function") switchView("academicTrainingView");
    }else if(action === "linguisticsTips"){
      if(typeof renderLinguisticsCategories === "function") renderLinguisticsCategories();
      if(typeof renderLinguisticsTips === "function") renderLinguisticsTips();
      if(typeof switchView === "function") switchView("linguisticsTipsView");
    }else if(action === "terminologyGlossary"){
      if(typeof renderTermCategories === "function") renderTermCategories();
      if(typeof renderTerminologyGlossary === "function") renderTerminologyGlossary();
      if(typeof switchView === "function") switchView("terminologyGlossaryView");
    }else if(action === "moduleGuide"){
      if(typeof renderModuleGuides === "function") renderModuleGuides();
      if(typeof switchView === "function") switchView("moduleGuideView");
    }else if(action === "confusionPairs"){
      if(typeof renderConfusionPairs === "function") renderConfusionPairs();
      if(typeof switchView === "function") switchView("confusionPairsView");
    }
  }

  // Intercept data-heavy pages before the old data-action onclick runs.
  document.addEventListener("click", function(e){
    const btn = e.target.closest("[data-action]");
    if(!btn) return;
    const action = btn.dataset.action;
    const keys = ACTION_DATA_2018[action];
    if(!keys) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    ensureData2018(keys).then(()=>goAction2018(action)).catch(err=>{
      console.error(err);
      alert(err.message || "页面数据加载失败，请刷新后重试。");
    });
  }, true);

  // Lesson pages need terminology and linked-resource data for 核心概念、概念首链、相关句式/背景.
  if(typeof openLesson === "function" && !window.__paliLazyOpenLesson2018){
    const oldOpenLesson = openLesson;
    openLesson = function(id){
      ensureData2018(LESSON_DATA_2018).then(()=>{
        oldOpenLesson(id);
        try{ if(window.__paliTermFirst2019?.annotate2019) setTimeout(window.__paliTermFirst2019.annotate2019, 120); }catch(e){}
      }).catch(err=>{
        console.error(err);
        oldOpenLesson(id);
      });
    };
    window.__paliLazyOpenLesson2018 = true;
  }

  // Keep health panel meaningful under lazy loading.
  window.__paliLazyData2018 = {
    ensureData2018,
    loaded: () => Array.from(loaded2018),
    map: DATA_2018,
    actionMap: ACTION_DATA_2018
  };

  window.addEventListener("DOMContentLoaded", function(){
    setBadge2018();
  });
})();


/* ===== Pāli Learning Lab 20.19: core lesson terminology first links only ===== */
(function(){
  const VERSION_LABEL_2019 = "Pāli Learning Lab · 20.41 最终显示修正版";

  // Basic high-frequency grammar labels should stay as plain text unless explicitly listed as this lesson's core term.
  const COMMON_SKIP_2019 = new Set([
    "名词","动词","形容词","代词","副词","格","性","数","单数","复数","主格","宾格","属格","与格","处格","工具格","从格",
    "阳性","阴性","中性","现在时","过去时","将来时","主动","被动","主语","宾语","谓语","词根","词干","词尾",
    "语法","句子","翻译","例句","术语"
  ]);

  function esc2019(s){
    return String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }
  function grammarList2019(){
    try{return Array.isArray(window.GRAMMAR) ? window.GRAMMAR : (typeof GRAMMAR !== "undefined" ? GRAMMAR : []);}catch(e){return [];}
  }
  function currentLesson2019(){
    try{
      if(typeof currentLesson !== "undefined" && currentLesson) return currentLesson;
    }catch(e){}
    const title = document.querySelector("#lessonTitle")?.textContent?.trim();
    if(!title) return null;
    return grammarList2019().find(l => String(l.title||"").trim() === title) || null;
  }
  function glossary2019(){
    const data = Array.isArray(window.TERMINOLOGY_GLOSSARY) ? window.TERMINOLOGY_GLOSSARY : [];
    const by = new Map();
    data.forEach(item => {
      const candidates = [item.cn, item.en, item.pali]
        .filter(Boolean)
        .flatMap(x => String(x).split(/[；;、,，/]/).map(s => s.trim()).filter(Boolean));
      candidates.forEach(c => {
        if(!by.has(c)) by.set(c, item);
      });
    });
    return {data, by};
  }
  function normalizeLabel2019(s){
    return String(s || "").replace(/[《》“”"'`]/g,"").trim();
  }
  function lessonCoreTerms2019(){
    const lesson = currentLesson2019();
    if(!lesson) return [];
    const {data, by} = glossary2019();
    const raw = [];
    ["linked_terminology", "core_terms", "lesson_terms", "terms", "terminology"].forEach(k => {
      const v = lesson[k];
      if(Array.isArray(v)) raw.push(...v);
      else if(typeof v === "string") raw.push(...v.split(/[；;、,，/]/));
    });

    // If no explicit lesson-level term list exists, use the rendered 核心概念 box only.
    const boxText = Array.from(document.querySelectorAll(".lesson-term-box-185,.lesson-term-library-box,.linked-term-box"))
      .map(x => x.textContent || "")
      .join("；");
    if(boxText){
      data.forEach(item => {
        const cn = normalizeLabel2019(item.cn || "");
        const en = normalizeLabel2019(item.en || "");
        const pali = normalizeLabel2019(item.pali || "");
        if(cn && boxText.includes(cn)) raw.push(cn);
        if(en && boxText.includes(en)) raw.push(en);
        if(pali && boxText.includes(pali)) raw.push(pali);
      });
    }

    const out = [];
    const seen = new Set();
    raw.map(normalizeLabel2019).filter(Boolean).forEach(label => {
      let item = by.get(label);
      if(!item){
        item = data.find(x => normalizeLabel2019(x.cn) === label || normalizeLabel2019(x.en) === label || normalizeLabel2019(x.pali) === label);
      }
      if(!item) return;
      const cn = normalizeLabel2019(item.cn || "");
      if(!cn || !/[\u4e00-\u9fff]/.test(cn)) return;
      // Skip overly broad basic words unless the exact explicit list contains them and there are few terms.
      if(COMMON_SKIP_2019.has(cn) && raw.length > 3) return;
      if(seen.has(cn)) return;
      seen.add(cn);
      out.push({...item, label: cn});
    });
    return out.sort((a,b) => b.label.length - a.label.length).slice(0, 8);
  }
  function remove2019(root){
    if(!root) return;
    root.querySelectorAll(".term-first-link-2019").forEach(el => el.replaceWith(document.createTextNode(el.textContent || "")));
    root.querySelectorAll(".term-popover-2019").forEach(el => el.remove());
  }
  function skip2019(el){
    if(!el || !el.closest) return true;
    return !!el.closest([
      "button","a","input","textarea","select","script","style",
      "table",".table-wrap","#lessonTable","#lessonExamples",".example",
      ".lesson-vocab-box-181",".lesson-vocab-box-183",".lesson-vocab-box-184",".lesson-vocab-box-185",
      ".lesson-term-box-185",".lesson-term-library-box",".linked-term-box",
      ".term-popover-2019",".term-popover-185",".term-popover-187",
      ".page-nav-bar-202",".lesson-nav-row",".button-row",".status-box"
    ].join(","));
  }
  function roots2019(){
    const card = document.querySelector("#lessonView:not(.hidden) .card");
    if(!card) return [];
    return [
      card.querySelector("#lessonSummary"),
      card.querySelector("#lessonExplanation"),
      card.querySelector("#mistakeBlock")
    ].filter(Boolean);
  }
  function split2019(text, terms, used){
    let pos = 0;
    const parts = [];
    while(pos < text.length){
      let hit = null, idx = -1;
      for(const item of terms){
        if(used.has(item.label)) continue;
        const i = text.indexOf(item.label, pos);
        if(i !== -1 && (idx === -1 || i < idx || (i === idx && item.label.length > hit.label.length))){
          hit = item; idx = i;
        }
      }
      if(!hit || idx === -1){
        parts.push({text:text.slice(pos)});
        break;
      }
      if(idx > pos) parts.push({text:text.slice(pos, idx)});
      parts.push({term:hit, text:hit.label});
      used.add(hit.label);
      pos = idx + hit.label.length;
    }
    return parts;
  }
  function annotate2019(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2019;
    const roots = roots2019();
    if(!roots.length) return;
    roots.forEach(remove2019);

    const terms = lessonCoreTerms2019();
    if(!terms.length) return;

    const used = new Set();
    roots.forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node){
          if(!node.nodeValue || !/[\u4e00-\u9fff]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
          if(skip2019(node.parentElement)) return NodeFilter.FILTER_REJECT;
          if(!terms.some(t => !used.has(t.label) && node.nodeValue.includes(t.label))) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const pieces = split2019(node.nodeValue, terms, used);
        if(!pieces.some(p => p.term)) return;
        const frag = document.createDocumentFragment();
        pieces.forEach(p => {
          if(!p.term){
            frag.appendChild(document.createTextNode(p.text));
          }else{
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "term-first-link-2019";
            btn.dataset.termFirst2019 = p.term.label;
            btn.textContent = p.text;
            btn.title = "点击查看本节核心概念解释";
            frag.appendChild(btn);
          }
        });
        node.replaceWith(frag);
      });
    });
  }
  function termItem2019(label){
    return lessonCoreTerms2019().find(x => x.label === label) ||
      (Array.isArray(window.TERMINOLOGY_GLOSSARY) ? window.TERMINOLOGY_GLOSSARY.find(x => normalizeLabel2019(x.cn) === label) : null);
  }
  function show2019(label, anchor){
    document.querySelectorAll(".term-popover-2019").forEach(x => x.remove());
    const item = termItem2019(label);
    if(!item) return;
    const pop = document.createElement("div");
    pop.className = "term-popover-2019";
    const ipa = item.ipa ? `<span class="ipa">${esc2019(item.ipa)}</span>` : "";
    pop.innerHTML = `<button type="button" class="term-popover-close-2019" data-close-term-popover-2019>×</button>
      <h3>${esc2019(item.cn || label)}</h3>
      <p class="qa-meta">${esc2019(item.cat || "")}${item.en ? "｜" + esc2019(item.en) : ""} ${ipa}</p>
      ${item.pali ? `<p><strong>Pāli：</strong>${esc2019(item.pali)}</p>` : ""}
      <p>${esc2019(item.simple_explanation || item.note || item.def || "")}</p>
      <button type="button" class="small secondary" data-open-glossary-2019="${esc2019(label)}">打开术语库</button>`;
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.left = Math.max(12, Math.min(r.left, window.innerWidth - 340)) + "px";
    pop.style.top = Math.min(window.innerHeight - 20, r.bottom + 8) + "px";
  }
  function openGlossary2019(label){
    document.querySelectorAll(".term-popover-2019").forEach(x => x.remove());
    try{
      if(typeof safeSwitch === "function") safeSwitch("terminologyGlossaryView");
      else if(typeof switchView === "function") switchView("terminologyGlossaryView");
      if(typeof renderTermCategories === "function") renderTermCategories();
      if(typeof renderTerminologyGlossary === "function") renderTerminologyGlossary();
      setTimeout(() => {
        const input = document.getElementById("termSearchInput");
        if(input){
          input.value = label;
          input.dispatchEvent(new Event("input", {bubbles:true}));
        }
      }, 120);
    }catch(e){}
  }

  document.addEventListener("click", function(e){
    const btn = e.target.closest("[data-term-first-2019]");
    if(btn){
      e.preventDefault();
      e.stopImmediatePropagation();
      show2019(btn.dataset.termFirst2019, btn);
      return;
    }
    const open = e.target.closest("[data-open-glossary-2019]");
    if(open){
      e.preventDefault();
      e.stopImmediatePropagation();
      openGlossary2019(open.dataset.openGlossary2019);
      return;
    }
    if(e.target.closest("[data-close-term-popover-2019]")){
      e.preventDefault();
      e.stopImmediatePropagation();
      document.querySelectorAll(".term-popover-2019").forEach(x => x.remove());
      return;
    }
    if(!e.target.closest(".term-popover-2019")){
      document.querySelectorAll(".term-popover-2019").forEach(x => x.remove());
    }
  }, true);

  if(typeof openLesson === "function" && !window.__paliTermFirst2019OpenHook){
    const oldOpenLesson = openLesson;
    openLesson = function(id){
      const result = oldOpenLesson(id);
      setTimeout(annotate2019, 260);
      return result;
    };
    window.__paliTermFirst2019OpenHook = true;
  }
  window.addEventListener("DOMContentLoaded", function(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2019;
    setTimeout(annotate2019, 600);
  });
  window.__paliTermFirst2019 = {annotate2019, lessonCoreTerms2019};
})();


/* ===== Pāli Learning Lab 20.20: grammar split lazy loading ===== */
(function(){
  const VERSION_LABEL_2020 = "Pāli Learning Lab · 20.41 最终显示修正版";
  const INDEX_URL_2020 = "grammar-index.json?v=20.41";
  const MANIFEST_URL_2020 = "grammar-lesson-manifest.json?v=20.41";
  const LESSON_BASE_2020 = "";
  let indexPromise2020 = null;
  let manifestPromise2020 = null;
  const lessonPromises2020 = {};

  function setBadge2020(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2020;
  }
  function esc2020(s){
    return String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }
  function getGrammar2020(){
    try{return Array.isArray(GRAMMAR) ? GRAMMAR : [];}catch(e){return [];}
  }
  function setGrammar2020(list){
    try{ GRAMMAR = list; }catch(e){ window.GRAMMAR = list; }
  }
  function findLessonIndex2020(id){
    const list = getGrammar2020();
    return list.findIndex(l => String(l.id) === String(id));
  }
  function replaceLesson2020(detail){
    const list = getGrammar2020();
    const idx = findLessonIndex2020(detail.id);
    const merged = Object.assign({}, idx >= 0 ? list[idx] : {}, detail, {__detailLoaded:true});
    if(idx >= 0) list[idx] = merged;
    else list.push(merged);
    setGrammar2020(list);
    return merged;
  }
  async function ensureIndex2020(){
    const existing = getGrammar2020();
    if(existing.length) return existing;
    if(!indexPromise2020){
      indexPromise2020 = fetch(INDEX_URL_2020, {cache:"no-store"})
        .then(r => {
          if(!r.ok) throw new Error("课程总索引加载失败");
          return r.json();
        })
        .then(list => {
          setGrammar2020(list);
          try{
            if(typeof renderSelect === "function") renderSelect();
            if(typeof stats === "function") stats();
          }catch(e){}
          setBadge2020();
          return list;
        });
    }
    return indexPromise2020;
  }
  async function manifest2020(){
    if(!manifestPromise2020){
      manifestPromise2020 = fetch(MANIFEST_URL_2020, {cache:"no-store"}).then(r=>{
        if(!r.ok) throw new Error("课程详情清单加载失败");
        return r.json();
      });
    }
    return manifestPromise2020;
  }
  async function ensureLesson2020(id){
    await ensureIndex2020();
    const list = getGrammar2020();
    const existing = list.find(l => String(l.id) === String(id));
    if(existing && existing.__detailLoaded) return existing;
    if(lessonPromises2020[id]) return lessonPromises2020[id];

    lessonPromises2020[id] = manifest2020().then(map => {
      const fname = map[String(id)];
      if(!fname) throw new Error("未找到课程详情：" + id);
      return fetch(LESSON_BASE_2020 + fname + "?v=20.41", {cache:"no-store"});
    }).then(r => {
      if(!r.ok) throw new Error("课程详情加载失败：" + id);
      return r.json();
    }).then(detail => {
      if(Array.isArray(detail)){
        detail.forEach(d => replaceLesson2020(d));
        const found = detail.find(d => String(d.id) === String(id));
        if(!found) throw new Error("课程详情块中未找到：" + id);
        return found;
      }
      return replaceLesson2020(detail);
    });

    return lessonPromises2020[id];
  }
  async function ensureModule2020(moduleName){
    // Module page needs the course index only. Lesson details are loaded per lesson.
    await ensureIndex2020();
    return getGrammar2020().filter(l => l.module === moduleName);
  }
  async function ensureAllIndex2020(){
    return ensureIndex2020();
  }

  // Override counters/search to work with the index.
  if(typeof stats === "function" && !window.__paliStats2020){
    stats = function(){
      const list = getGrammar2020();
      const total = list.reduce((a,l)=>a + ((l.exercises||[]).length || l.exercise_count || 0), 0);
      let s = {};
      try{s = JSON.parse(localStorage.getItem("pali_grammar_lesson_status_v2")) || {};}catch(e){}
      const master = list.filter(l => s[l.id] === "已掌握").length;
      const w = (()=>{try{return JSON.parse(localStorage.getItem("pali_grammar_wrong_exercises_v1"))||{}}catch(e){return {}}})();
      const t1=document.getElementById("totalLessons"), t2=document.getElementById("totalExercises"), t3=document.getElementById("masteredCount"), t4=document.getElementById("wrongCount");
      if(t1)t1.textContent=list.length;
      if(t2)t2.textContent=total;
      if(t3)t3.textContent=master;
      if(t4)t4.textContent=Object.keys(w).length;
    };
    window.__paliStats2020 = true;
  }
  if(typeof cardHTML === "function" && !window.__paliCardHTML2020){
    cardHTML = function(l){
      let s = (typeof lstat === "function") ? lstat(l.id) : "未学";
      const n = (l.exercises||[]).length || l.exercise_count || 0;
      const cls = (typeof scls === "function") ? scls(s) : "";
      return `<h3>${esc2020(l.lesson_number||l.id)}. ${esc2020(l.title)}</h3><div class="lesson-badges"><span class="badge ${cls}">${esc2020(s)}</span><span class="badge">${esc2020(l.category||"")}</span><span class="badge">${n}题</span></div><p>${esc2020(l.summary||"")}</p>`;
    };
    window.__paliCardHTML2020 = true;
  }
  if(typeof search === "function" && !window.__paliSearch2020){
    search = function(q){
      const box = document.getElementById("searchResults");
      if(!box) return;
      q = String(q||"").trim().toLowerCase();
      box.innerHTML = q ? "" : '<p class="muted">输入关键词后显示搜索结果。</p>';
      if(!q) return;
      const list = getGrammar2020();
      const res = list.filter(l => [l.title,l.category,l.module,l.summary,l.search_text].join(" ").toLowerCase().includes(q));
      if(!res.length){
        box.innerHTML='<p class="muted">没有找到相关内容。</p>';
        return;
      }
      res.forEach(l=>{
        const d = document.createElement("div");
        d.className = "lesson-item";
        d.innerHTML = cardHTML(l);
        d.onclick = () => { try{ lastView="searchView"; }catch(e){} openLesson(l.id); };
        box.appendChild(d);
      });
    };
    window.__paliSearch2020 = true;
  }

  // Lesson detail lazy load.
  if(typeof openLesson === "function" && !window.__paliLessonDetailLazy2020){
    const oldOpenLesson = openLesson;
    openLesson = function(id){
      ensureLesson2020(id).then(()=>oldOpenLesson(id)).catch(err=>{
        console.error(err);
        alert(err.message || "课程详情加载失败，请刷新后重试。");
      });
    };
    window.__paliLessonDetailLazy2020 = true;
  }
  if(typeof openModule === "function" && !window.__paliOpenModuleLazy2020){
    const oldOpenModule = openModule;
    openModule = function(moduleName){
      ensureModule2020(moduleName).then(()=>oldOpenModule(moduleName)).catch(err=>{
        console.error(err);
        alert(err.message || "模块课程加载失败，请刷新后重试。");
      });
    };
    window.__paliOpenModuleLazy2020 = true;
  }

  function goIndexAction2020(action){
    if(action === "modules"){
      renderModules();
      switchView("moduleLearningView");
    }else if(action === "search"){
      search("");
      switchView("searchView");
    }else if(action === "exercise"){
      if(typeof renderSelect === "function") renderSelect();
      switchView("exerciseCenterView");
    }else if(action === "training"){
      if(typeof renderTraining === "function") renderTraining();
      switchView("trainingView");
    }else if(action === "learningProgress"){
      if(typeof renderProgressSummary === "function") renderProgressSummary();
      switchView("learningProgressView");
    }
  }

  // Intercept index-dependent pages before old onclick runs.
  document.addEventListener("click", function(e){
    const btn = e.target.closest("[data-action]");
    if(!btn) return;
    const action = btn.dataset.action;
    if(!["learningProgress"].includes(action)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    ensureIndex2020().then(()=>goIndexAction2020(action)).catch(err=>{
      console.error(err);
      alert(err.message || "课程索引加载失败，请刷新后重试。");
    });
  }, true);

  // Mixed exercises need index exercises.
  window.addEventListener("DOMContentLoaded", function(){
    setBadge2020();
    const btn = document.getElementById("startMixedExercisesBtn");
    if(btn){
      btn.onclick = function(){
        ensureIndex2020().then(()=>{
          const moduleName = document.getElementById("exerciseModuleSelect")?.value || "全部模块";
          const count = parseInt(document.getElementById("exerciseCountInput")?.value || "10", 10);
          const items = (typeof allEx === "function") ? allEx(moduleName) : [];
          if(typeof startExercises === "function") startExercises((typeof shuffle === "function" ? shuffle(items) : items).slice(0, count), "练习");
        });
      };
    }
  });

  window.__paliGrammarLazy2020 = {
    ensureIndex: ensureIndex2020,
    ensureLesson: ensureLesson2020,
    ensureModule: ensureModule2020,
    loadedLessons: () => getGrammar2020().filter(l => l.__detailLoaded).map(l => l.id),
    indexLoaded: () => !!getGrammar2020().length
  };
})();


/* ===== Pāli Learning Lab 20.21: loading feedback for lazy data ===== */
(function(){
  const VERSION_LABEL_2021 = "Pāli Learning Lab · 20.41 最终显示修正版";
  let loadingCount2021 = 0;
  let hideTimer2021 = null;

  const messageByAction2021 = {
    modules: "正在加载，请稍候……",
    search: "正在加载，请稍候……",
    exercise: "正在加载，请稍候……",
    training: "正在加载，请稍候……",
    learningProgress: "正在加载，请稍候……",
    learningRoute: "正在加载，请稍候……",
    dictionaryLookup: "正在加载，请稍候……",
    sentenceAnalysis: "正在加载，请稍候……",
    sentencePatterns: "正在加载，请稍候……",
    buddhistReading: "正在加载，请稍候……",
    buddhistBackground: "正在加载，请稍候……",
    academicTraining: "正在加载，请稍候……",
    linguisticsTips: "正在加载，请稍候……",
    terminologyGlossary: "正在加载，请稍候……",
    moduleGuide: "正在加载，请稍候……",
    confusionPairs: "正在加载，请稍候……",
    wrong: "正在读取错题记录……"
  };

  function ensureBox2021(){
    let box = document.getElementById("globalLoadingBox2021");
    if(box) return box;
    box = document.createElement("div");
    box.id = "globalLoadingBox2021";
    box.className = "global-loading-box-2021 hidden";
    box.innerHTML = `
      <div class="global-loading-card-2021">
        <div class="global-loading-spinner-2021"></div>
        <div>
          <strong id="globalLoadingTitle2021">正在加载……</strong>
          <p id="globalLoadingText2021">请稍候。</p>
        </div>
      </div>`;
    document.body.appendChild(box);
    return box;
  }
  function setBadge2021(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2021;
  }
  function showLoading2021(message){
    setBadge2021();
    const box = ensureBox2021();
    const text = document.getElementById("globalLoadingText2021");
    if(text) text.textContent = message || "请稍候。";
    box.classList.remove("hidden");
    if(hideTimer2021) clearTimeout(hideTimer2021);
    // Safety fallback: even if an old loader does not emit completion, do not block the UI forever.
    hideTimer2021 = setTimeout(() => hideLoading2021(true), 6000);
  }
  function hideLoading2021(force){
    if(!force && loadingCount2021 > 0) return;
    loadingCount2021 = 0;
    const box = document.getElementById("globalLoadingBox2021");
    if(box) box.classList.add("hidden");
    if(hideTimer2021) clearTimeout(hideTimer2021);
    hideTimer2021 = null;
  }
  function begin2021(message){
    loadingCount2021 += 1;
    showLoading2021(message);
  }
  function end2021(){
    loadingCount2021 = Math.max(0, loadingCount2021 - 1);
    if(loadingCount2021 === 0) {
      setTimeout(() => hideLoading2021(true), 180);
    }
  }
  function dataMessageFromUrl2021(url){
    const s = String(url || "");
    if(s.includes("grammar-index.json")) return "正在加载，请稍候……";
    if(s.includes("grammar-lesson-manifest.json")) return "正在加载，请稍候……";
    if(s.includes("grammar-lessons/") || /lesson(?:-chunk)?-[^/]+\.json/.test(s)) return "正在加载，请稍候……";
    if(s.includes("sentence-analysis-data.js")) return "正在加载，请稍候……";
    if(s.includes("terminology-glossary-data.js")) return "正在加载，请稍候……";
    if(s.includes("token-analysis-data.js")) return "正在加载，请稍候……";
    if(s.includes("dictionary-sites-data.js")) return "正在加载，请稍候……";
    if(s.includes("buddhist-reading-data.js")) return "正在加载，请稍候……";
    if(s.includes("buddhist-background-data.js")) return "正在加载，请稍候……";
    if(s.includes("academic-training-data.js")) return "正在加载，请稍候……";
    if(s.includes("learning-routes-data.js")) return "正在加载，请稍候……";
    if(s.includes("confusion-pairs-data.js")) return "正在加载，请稍候……";
    if(s.includes("sentence-patterns-data.js")) return "正在加载，请稍候……";
    if(s.includes("linguistics-tips-data.js")) return "正在加载，请稍候……";
    if(s.includes("module-guides-data.js")) return "正在加载，请稍候……";
    return "";
  }

  // Show immediate feedback when the user clicks a lazy-loaded entry.
  document.addEventListener("click", function(e){
    const actionBtn = e.target.closest("[data-action]");
    if(actionBtn && messageByAction2021[actionBtn.dataset.action]){
      showLoading2021(messageByAction2021[actionBtn.dataset.action]);
      setTimeout(() => hideLoading2021(true), 2500);
      return;
    }
    const lessonItem = e.target.closest(".lesson-item");
    if(lessonItem && document.querySelector("#lessonListView:not(.hidden),#searchView:not(.hidden),#learningRouteView:not(.hidden)")){
      showLoading2021("正在加载，请稍候……");
      setTimeout(() => hideLoading2021(true), 2500);
      return;
    }
    const layerBtn = e.target.closest("[data-layer-action]");
    if(layerBtn){
      showLoading2021("正在加载，请稍候……");
      setTimeout(() => hideLoading2021(true), 800);
    }
  }, true);

  // Wrap fetch used by grammar index / lesson detail lazy loading.
  if(!window.__paliFetchLoading2021){
    const originalFetch = window.fetch;
    window.fetch = function(input, init){
      const url = typeof input === "string" ? input : (input && input.url) || "";
      const message = dataMessageFromUrl2021(url);
      if(message) begin2021(message);
      return originalFetch.apply(this, arguments)
        .then(res => {
          if(message && !res.ok) {
            const text = document.getElementById("globalLoadingText2021");
            if(text) text.textContent = "加载失败，请刷新后重试。";
          }
          return res;
        })
        .finally(() => {
          if(message) end2021();
        });
    };
    window.__paliFetchLoading2021 = true;
  }

  // Wrap dynamic <script> lazy loading used by non-grammar data files.
  if(!window.__paliScriptLoading2021){
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function(child){
      try{
        if(this === document.head && child && child.tagName === "SCRIPT" && child.src){
          const message = dataMessageFromUrl2021(child.src);
          if(message){
            begin2021(message);
            child.addEventListener("load", end2021, {once:true});
            child.addEventListener("error", function(){
              const text = document.getElementById("globalLoadingText2021");
              if(text) text.textContent = "数据文件加载失败，请刷新后重试。";
              end2021();
            }, {once:true});
          }
        }
      }catch(e){}
      return originalAppendChild.call(this, child);
    };
    window.__paliScriptLoading2021 = true;
  }

  window.addEventListener("DOMContentLoaded", function(){
    setBadge2021();
    ensureBox2021();
  });

  window.__paliLoading2021 = {show:showLoading2021, hide:()=>hideLoading2021(true), begin:begin2021, end:end2021};
})();


/* ===== Pāli Learning Lab 20.24: module index secondary lazy loading ===== */
(function(){
  const VERSION_LABEL_2022 = "Pāli Learning Lab · 20.41 最终显示修正版";
  const MODULE_DIRECTORY_URL_2022 = "grammar-module-directory.json?v=20.41";
  const MODULE_BASE_2022 = "";
  let directoryPromise2022 = null;
  let moduleDirectory2022 = null;
  const modulePromises2022 = {};

  function setBadge2022(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2022;
  }
  function esc2022(s){
    return String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }
  function getGrammar2022(){
    try{return Array.isArray(GRAMMAR) ? GRAMMAR : [];}catch(e){return [];}
  }
  function setGrammar2022(list){
    try{GRAMMAR = list;}catch(e){window.GRAMMAR = list;}
  }
  function mergeLessons2022(lessons){
    const list = getGrammar2022();
    const map = new Map(list.map(x => [String(x.id), x]));
    lessons.forEach(l => {
      const old = map.get(String(l.id)) || {};
      map.set(String(l.id), Object.assign({}, old, l));
    });
    setGrammar2022(Array.from(map.values()));
  }
  function status2022(id){
    try{
      const s = JSON.parse(localStorage.getItem("pali_grammar_lesson_status_v2")) || {};
      return s[id] || "未学";
    }catch(e){return "未学";}
  }
  function progressHTML2022(entry){
    const ids = entry.lesson_ids || [];
    const mastered = ids.filter(id => status2022(id) === "已掌握").length;
    const p = ids.length ? Math.round(mastered / ids.length * 100) : 0;
    return `<div class="progress-wrap"><div class="progress-bar" style="width:${p}%"></div></div><p class="muted">掌握进度：${mastered}/${ids.length}（${p}%）</p>`;
  }
  async function ensureModuleDirectory2022(){
    if(moduleDirectory2022) return moduleDirectory2022;
    if(!directoryPromise2022){
      directoryPromise2022 = fetch(MODULE_DIRECTORY_URL_2022, {cache:"no-store"})
        .then(r => {
          if(!r.ok) throw new Error("模块目录加载失败");
          return r.json();
        })
        .then(data => {
          moduleDirectory2022 = data;
          setBadge2022();
          return data;
        });
    }
    return directoryPromise2022;
  }
  async function ensureModuleIndex2022(moduleName){
    const dir = await ensureModuleDirectory2022();
    const entry = dir.find(x => x.module === moduleName);
    if(!entry) throw new Error("未找到模块：" + moduleName);
    if(modulePromises2022[moduleName]) return modulePromises2022[moduleName];

    modulePromises2022[moduleName] = fetch(MODULE_BASE_2022 + entry.file + "?v=20.41", {cache:"no-store"})
      .then(r => {
        if(!r.ok) throw new Error("本模块课程加载失败：" + moduleName);
        return r.json();
      })
      .then(lessons => {
        mergeLessons2022(lessons);
        setBadge2022();
        return lessons;
      });

    return modulePromises2022[moduleName];
  }
  function renderModules2022(){
    const grids = [document.getElementById("moduleGrid"), document.getElementById("moduleGridPage")].filter(Boolean);
    if(!grids.length) return;
    const render = (dir) => {
      grids.forEach(grid => {
        grid.innerHTML = "";
        dir.forEach(entry => {
          const d = document.createElement("div");
          d.className = "module-card";
          d.dataset.module = entry.module;
          d.innerHTML = `<h3>${esc2022(entry.module)}</h3>
            <p class="muted">${entry.lesson_count} 个语法点｜${entry.exercise_count || 0} 道练习</p>
            ${progressHTML2022(entry)}`;
          d.onclick = () => openModule(entry.module);
          grid.appendChild(d);
        });
      });
    };
    if(moduleDirectory2022) render(moduleDirectory2022);
    else {
      grids.forEach(grid => grid.innerHTML = '<p class="muted">正在加载，请稍候……</p>');
      ensureModuleDirectory2022().then(render).catch(err => {
        grids.forEach(grid => grid.innerHTML = `<p class="muted">模块目录加载失败：${esc2022(err.message || err)}</p>`);
      });
    }
  }

  // Override renderModules so module page can draw from a tiny directory instead of full grammar-index.
  if(!window.__paliRenderModules2022){
    renderModules = renderModules2022;
    window.__paliRenderModules2022 = true;
  }

  // Override openModule: load only this module's course index, not the full grammar-index.
  if(!window.__paliOpenModule2022){
    openModule = function(moduleName){
      ensureModuleIndex2022(moduleName).then(() => {
        try{currentModule = moduleName; currentFilter = "全部";}catch(e){}
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === "全部"));
        if(typeof renderLessonList === "function") renderLessonList(moduleName);
        if(typeof safeSwitch === "function") safeSwitch("lessonListView");
        else if(typeof switchView === "function") switchView("lessonListView");
      }).catch(err => {
        console.error(err);
        alert(err.message || "本模块课程加载失败，请刷新后重试。");
      });
    };
    window.__paliOpenModule2022 = true;
  }

  // Intercept module page entry before older onclick runs.
  document.addEventListener("click", function(e){
    const btn = e.target.closest('[data-action="modules"]');
    if(!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    ensureModuleDirectory2022().then(() => {
      renderModules2022();
      if(typeof safeSwitch === "function") safeSwitch("moduleLearningView");
      else if(typeof switchView === "function") switchView("moduleLearningView");
    }).catch(err => {
      console.error(err);
      alert(err.message || "模块目录加载失败，请刷新后重试。");
    });
  }, true);

  // Expose for diagnostics.
  window.__paliModuleLazy2022 = {
    ensureDirectory: ensureModuleDirectory2022,
    ensureModule: ensureModuleIndex2022,
    renderModules: renderModules2022,
    loadedModules: () => Object.keys(modulePromises2022),
    directoryLoaded: () => !!moduleDirectory2022
  };

  window.addEventListener("DOMContentLoaded", setBadge2022);
})();


/* ===== Pāli Learning Lab 20.24: exercise data separate lazy loading ===== */
(function(){
  const VERSION_LABEL_2023 = "Pāli Learning Lab · 20.41 最终显示修正版";
  const EXERCISE_URL_2023 = "exercise-index.json?v=20.41";
  let exercisePromise2023 = null;
  let exercises2023 = null;

  function setBadge2023(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2023;
  }
  function esc2023(s){
    return String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }
  function allExercises2023(){
    return Array.isArray(exercises2023) ? exercises2023 : [];
  }
  function ensureExercises2023(){
    if(exercises2023) return Promise.resolve(exercises2023);
    if(!exercisePromise2023){
      exercisePromise2023 = fetch(EXERCISE_URL_2023, {cache:"no-store"})
        .then(r => {
          if(!r.ok) throw new Error("练习数据加载失败");
          return r.json();
        })
        .then(data => {
          exercises2023 = data;
          window.EXERCISE_INDEX_2023 = data;
          setBadge2023();
          return data;
        });
    }
    return exercisePromise2023;
  }
  function moduleNames2023(){
    const names = new Set(["全部模块"]);
    allExercises2023().forEach(e => { if(e.module) names.add(e.module); });
    return Array.from(names);
  }

  if(!window.__paliExerciseFunctions2023){
    allEx = function(m){
      const list = allExercises2023();
      return m === "全部模块" ? list : list.filter(e => e.module === m);
    };
    train = function(key){
      let all = allExercises2023();
      let f = all;
      if(key === "input") f = all.filter(e => e.type === "input");
      else if(key === "reading") f = all.filter(e => e.lesson_id === 75 || e.category === "阅读训练");
      else if(key === "case") f = all.filter(e => /格|主格|宾格|工具格|处格|属格|与格|从格|呼格/.test((e.question||"") + (e.explanation||"")));
      else if(key === "verb") f = all.filter(e => /动词|现在时|将来时|过去|命令|祈愿|条件式|使役|被动|人称|词尾/.test((e.question||"") + (e.explanation||"")));
      else if(key === "nonfinite") f = all.filter(e => /inf\.|ger\.|分词|gantvā|gantuṃ|katvā|kātuṃ|sutvā/.test((e.question||"") + (e.explanation||"")));
      else if(key === "particles") f = all.filter(e => /ind\.|na|mā|ca|vā|eva|iti|ti|关联|引语|否定|并列|选择/.test((e.question||"") + (e.explanation||"")));
      return f;
    };
    renderSelect = function(){
      const s = document.getElementById("exerciseModuleSelect");
      if(!s) return;
      s.innerHTML = "";
      moduleNames2023().forEach(m => {
        const o = document.createElement("option");
        o.value = m;
        o.textContent = m;
        s.appendChild(o);
      });
    };
    renderTraining = function(){
      const grid = document.getElementById("trainingGrid");
      if(!grid) return;
      grid.innerHTML = "";
      (window.TRAINING_PRESETS || TRAINING_PRESETS || []).forEach(p => {
        const count = train(p[0]).length;
        const d = document.createElement("div");
        d.className = "training-card";
        d.innerHTML = `<h3>${esc2023(p[1])}</h3><p class="muted">${esc2023(p[2])}</p><p class="muted">${count} 道题</p><button class="primary">开始专项强化</button>`;
        d.onclick = () => startExercises((typeof shuffle === "function" ? shuffle(train(p[0])) : train(p[0])).slice(0,20), p[1]);
        grid.appendChild(d);
      });
    };
    window.__paliExerciseFunctions2023 = true;
  }

  function openExerciseCenter2023(){
    ensureExercises2023().then(() => {
      renderSelect();
      if(typeof switchView === "function") switchView("exerciseCenterView");
    }).catch(err => {
      console.error(err);
      alert(err.message || "练习数据加载失败，请刷新后重试。");
    });
  }
  function openTraining2023(){
    ensureExercises2023().then(() => {
      renderTraining();
      if(typeof switchView === "function") switchView("trainingView");
    }).catch(err => {
      console.error(err);
      alert(err.message || "专项训练数据加载失败，请刷新后重试。");
    });
  }

  document.addEventListener("click", function(e){
    const btn = e.target.closest("[data-action]");
    if(!btn) return;
    const action = btn.dataset.action;
    if(action !== "exercise" && action !== "training") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(action === "exercise") openExerciseCenter2023();
    else openTraining2023();
  }, true);

  window.addEventListener("DOMContentLoaded", function(){
    setBadge2023();
    const mixed = document.getElementById("startMixedExercisesBtn");
    if(mixed){
      mixed.onclick = function(){
        ensureExercises2023().then(() => {
          const moduleName = document.getElementById("exerciseModuleSelect")?.value || "全部模块";
          const count = parseInt(document.getElementById("exerciseCountInput")?.value || "10", 10);
          const items = allEx(moduleName);
          startExercises((typeof shuffle === "function" ? shuffle(items) : items).slice(0, count), "练习");
        });
      };
    }
    const lessonBtn = document.getElementById("startLessonExercisesBtn");
    if(lessonBtn){
      lessonBtn.onclick = function(){
        const lesson = (typeof currentLesson !== "undefined") ? currentLesson : null;
        if(!lesson) return;
        ensureExercises2023().then(() => {
          const items = allExercises2023().filter(e => String(e.lesson_id) === String(lesson.id));
          startExercises(items, "本课练习");
        });
      };
    }
  });

  window.__paliExerciseLazy2023 = {
    ensureExercises: ensureExercises2023,
    loaded: () => !!exercises2023,
    count: () => allExercises2023().length
  };
})();


/* ===== Pāli Learning Lab 20.24: independent search index lazy loading ===== */
(function(){
  const VERSION_LABEL_2024 = "Pāli Learning Lab · 20.41 最终显示修正版";
  const SEARCH_URL_2024 = "search-index.json?v=20.41";
  let searchPromise2024 = null;
  let searchIndex2024 = null;

  function setBadge2024(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2024;
  }
  function esc2024(s){
    return String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }
  function ensureSearchIndex2024(){
    if(searchIndex2024) return Promise.resolve(searchIndex2024);
    if(!searchPromise2024){
      searchPromise2024 = fetch(SEARCH_URL_2024, {cache:"no-store"})
        .then(r => {
          if(!r.ok) throw new Error("搜索索引加载失败");
          return r.json();
        })
        .then(data => {
          searchIndex2024 = data;
          window.SEARCH_INDEX_2024 = data;
          setBadge2024();
          return data;
        });
    }
    return searchPromise2024;
  }
  function resultCard2024(l){
    const n = l.exercise_count || 0;
    return `<h3>${esc2024(l.lesson_number||l.id)}. ${esc2024(l.title)}</h3>
      <div class="lesson-badges"><span class="badge">${esc2024(l.module||"")}</span><span class="badge">${esc2024(l.category||"")}</span><span class="badge">${n}题</span></div>
      <p>${esc2024(l.summary||"")}</p>`;
  }
  function runSearch2024(q){
    const box = document.getElementById("searchResults");
    if(!box) return;
    q = String(q||"").trim().toLowerCase();
    box.innerHTML = q ? "" : '<p class="muted">输入关键词后显示搜索结果。</p>';
    if(!q) return;
    const res = (searchIndex2024 || []).filter(l => [l.title,l.category,l.module,l.summary,l.search_text].join(" ").toLowerCase().includes(q));
    if(!res.length){
      box.innerHTML = '<p class="muted">没有找到相关内容。</p>';
      return;
    }
    res.forEach(l => {
      const d = document.createElement("div");
      d.className = "lesson-item";
      d.innerHTML = resultCard2024(l);
      d.onclick = () => { try{lastView="searchView";}catch(e){} openLesson(l.id); };
      box.appendChild(d);
    });
  }

  search = function(q){
    if(searchIndex2024) return runSearch2024(q);
    const box = document.getElementById("searchResults");
    if(box) box.innerHTML = '<p class="muted">正在加载，请稍候……</p>';
    ensureSearchIndex2024().then(() => runSearch2024(q)).catch(err => {
      console.error(err);
      if(box) box.innerHTML = `<p class="muted">搜索索引加载失败：${esc2024(err.message || err)}</p>`;
    });
  };

  document.addEventListener("click", function(e){
    const btn = e.target.closest('[data-action="search"]');
    if(!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    ensureSearchIndex2024().then(() => {
      runSearch2024("");
      if(typeof switchView === "function") switchView("searchView");
    }).catch(err => {
      console.error(err);
      alert(err.message || "搜索索引加载失败，请刷新后重试。");
    });
  }, true);

  window.addEventListener("DOMContentLoaded", function(){
    setBadge2024();
    const input = document.getElementById("searchInput");
    if(input){
      input.oninput = e => search(e.target.value);
    }
  });

  window.__paliSearchLazy2024 = {
    ensureSearchIndex: ensureSearchIndex2024,
    loaded: () => !!searchIndex2024,
    count: () => Array.isArray(searchIndex2024) ? searchIndex2024.length : 0
  };
})();


/* ===== Pāli Learning Lab 20.25: redundant compatibility cleanup ===== */
(function(){
  window.__paliCleanup2025 = {
    removed: ["grammar.json 兼容文件", "历史报告 txt 文件"],
    activeDataFiles: [
      "grammar-module-directory.json",
      "module-*.json",
      "grammar-lesson-manifest.json",
      "lesson-*.json",
      "exercise-index.json",
      "search-index.json"
    ],
    note: "首页不再加载完整 grammar.json；课程、练习、搜索均使用分片懒加载数据。"
  };
  window.addEventListener("DOMContentLoaded", function(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = "Pāli Learning Lab · 20.41 最终显示修正版";
  });
})();


/* ===== Pāli Learning Lab 20.26: grammar labels and core concepts separation ===== */
(function(){
  const VERSION_LABEL_2026 = "Pāli Learning Lab · 20.41 最终显示修正版";

  const ABBR_2026 = [
    ["f.p.p.", "将来被动分词"],
    ["pr.p.", "现在分词"],
    ["p.p.", "过去分词"],
    ["ger.", "连续体"],
    ["inf.", "不定式"],
    ["ind.", "不变词"],
    ["caus.", "使役"],
    ["pass.", "被动"],
    ["act.", "主动"],
    ["mid.", "中间语态"],
    ["med.", "中间语态"],
    ["n.", "中性；名词"],
    ["m.", "阳性"],
    ["f.", "阴性"],
    ["sg.", "单数"],
    ["pl.", "复数"],
    ["nom.", "主格"],
    ["acc.", "宾格"],
    ["gen.", "属格"],
    ["dat.", "与格"],
    ["ins.", "工具格"],
    ["loc.", "处格"],
    ["abl.", "从格"],
    ["voc.", "呼格"],
    ["prs.", "现在时"],
    ["fut.", "将来时"],
    ["aor.", "不定过去"],
    ["imp.", "命令式"],
    ["opt.", "祈愿式"],
    ["pron.", "代词"],
    ["adj.", "形容词"],
    ["adv.", "副词"]
  ];

  const BASIC_CONCEPT_SKIP_2026 = new Set([
    "名词","动词","形容词","代词","副词","格","性","数","单数","复数","主格","宾格","属格","与格","处格","工具格","从格","呼格",
    "阳性","阴性","中性","现在时","过去时","将来时","主动","被动","主语","宾语","谓语","词根","词干","词尾","人称","时态","语气","语态",
    "语法","句子","翻译","例句","术语","连音","音变","长元音","短元音","鼻音"
  ]);

  function setBadge2026(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = VERSION_LABEL_2026;
  }
  function esc2026(s){
    return String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }
  function lessonText2026(){
    const lesson = (function(){
      try{return typeof currentLesson !== "undefined" ? currentLesson : null;}catch(e){return null;}
    })();
    const bits = [];
    if(lesson){
      bits.push(lesson.title, lesson.summary);
      (lesson.explanation || []).forEach(x => bits.push(x));
      (lesson.examples || []).forEach(e => bits.push(e.grammar_note, e.note, e.pali, e.cn, e.natural_cn));
      (lesson.table || []).forEach(row => {
        if(Array.isArray(row)) bits.push(...row);
        else if(row && typeof row === "object") bits.push(...Object.values(row));
      });
    }
    const card = document.querySelector("#lessonView:not(.hidden) .card");
    if(card) bits.push(card.textContent || "");
    return bits.filter(Boolean).join(" ");
  }
  function usedAbbrs2026(){
    const text = lessonText2026();
    const found = [];
    ABBR_2026.forEach(([abbr, label]) => {
      const re = new RegExp("(^|[^A-Za-z])" + abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\.", "\\.") + "([^A-Za-z]|$)");
      if(re.test(text)) found.push([abbr, label]);
    });
    return found;
  }
  function renderGrammarLabels2026(){
    const lessonView = document.querySelector("#lessonView:not(.hidden)");
    if(!lessonView) return;
    lessonView.querySelectorAll(".grammar-label-box-2026").forEach(x => x.remove());
    const summary = document.getElementById("lessonSummary");
    if(!summary) return;

    const items = usedAbbrs2026();
    if(!items.length) return;

    const box = document.createElement("section");
    box.className = "grammar-label-box-2026";
    box.innerHTML = `<strong>语法标注：</strong> ${
      items.slice(0, 18).map(([abbr,label]) =>
        `<span class="grammar-label-chip-2026"><b>${esc2026(abbr)}</b>${esc2026(label)}</span>`
      ).join("")
    }`;
    summary.insertAdjacentElement("afterend", box);
  }
  function pruneCoreConcepts2026(){
    const lessonView = document.querySelector("#lessonView:not(.hidden)");
    if(!lessonView) return;

    lessonView.querySelectorAll(".lesson-term-box-185").forEach(box => {
      const strong = box.querySelector("strong");
      if(strong) strong.textContent = "核心概念：";
      box.querySelectorAll(".term-chip-185").forEach(btn => {
        const label = (btn.textContent || "").trim();
        if(BASIC_CONCEPT_SKIP_2026.has(label)) btn.remove();
      });
      if(!box.querySelector(".term-chip-185")) box.remove();
    });

    lessonView.querySelectorAll(".lesson-term-library-box,.linked-term-box").forEach(box => {
      const html = box.innerHTML;
      box.innerHTML = html.replace("核心概念：", "核心概念：").replace("核心概念：", "核心概念：");
      box.querySelectorAll("button.term-link-btn").forEach(btn => {
        const label = (btn.textContent || "").split("/")[0].trim();
        if(BASIC_CONCEPT_SKIP_2026.has(label)) btn.remove();
      });
      const hasButton = !!box.querySelector("button.term-link-btn");
      const text = (box.textContent || "").replace("核心概念：","").trim();
      if(!hasButton && !text) box.remove();
    });
  }
  function apply2026(){
    setBadge2026();
    renderGrammarLabels2026();
    pruneCoreConcepts2026();
  }

  if(typeof openLesson === "function" && !window.__paliLabelsConcepts2026OpenHook){
    const oldOpenLesson = openLesson;
    openLesson = function(id){
      const result = oldOpenLesson(id);
      setTimeout(apply2026, 320);
      setTimeout(apply2026, 900);
      return result;
    };
    window.__paliLabelsConcepts2026OpenHook = true;
  }

  document.addEventListener("click", function(){
    setTimeout(apply2026, 180);
  }, true);
  window.addEventListener("DOMContentLoaded", function(){
    setBadge2026();
    setTimeout(apply2026, 700);
  });

  window.__paliLabelsConcepts2026 = {
    apply: apply2026,
    renderGrammarLabels: renderGrammarLabels2026,
    pruneCoreConcepts: pruneCoreConcepts2026
  };
})();


/* ===== Pāli Learning Lab 20.27: flat upload without folders ===== */
(function(){
  window.__paliFlatUpload2027 = {
    removedFolders: ["grammar-lessons", "grammar-modules"],
    lessonBase: "root lesson-chunk-*.json",
    moduleBase: "root module-*.json",
    note: "为适配 GitHub 网页无法上传文件夹的情况，本版把课程详情和模块索引 JSON 全部放在根目录。"
  };
  window.addEventListener("DOMContentLoaded", function(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = "Pāli Learning Lab · 20.41 最终显示修正版";
  });
})();


/* ===== Pāli Learning Lab 20.28: lesson detail chunk lazy loading ===== */
(function(){
  window.__paliLessonChunks2028 = {
    mode: "课程详情分块懒加载",
    chunkCount: 11,
    chunkPattern: "lesson-chunk-*.json",
    note: "为减少 GitHub 网页上传文件数量，把 109 个 lesson-*.json 合并为 11 个 lesson-chunk-*.json；进入某课时只加载其所在分块。"
  };
  window.addEventListener("DOMContentLoaded", function(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = "Pāli Learning Lab · 20.41 最终显示修正版";
  });
})();


/* ===== Pāli Learning Lab 20.41: force final version label ===== */
(function(){
  const FINAL_LABEL = "Pāli Learning Lab · 20.41 最终显示修正版";
  function forceFinalVersion(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = FINAL_LABEL;
    document.documentElement.setAttribute("data-pali-version", "20.41");
  }
  window.addEventListener("DOMContentLoaded", forceFinalVersion);
  window.addEventListener("load", forceFinalVersion);
  setTimeout(forceFinalVersion, 500);
  setTimeout(forceFinalVersion, 1500);
  window.__paliForceVersion2029 = {version:"20.41", label:FINAL_LABEL, force:forceFinalVersion};
})();


/* ===== Pāli Learning Lab 20.41: final redeploy version label ===== */
(function(){
  const FINAL_LABEL = "Pāli Learning Lab · 20.41 最终显示修正版";
  function forceFinalVersion(){
    const badge = document.querySelector(".visual-version-badge");
    if(badge) badge.textContent = FINAL_LABEL;
    document.documentElement.setAttribute("data-pali-version", "20.41");
  }
  window.addEventListener("DOMContentLoaded", forceFinalVersion);
  window.addEventListener("load", forceFinalVersion);
  setTimeout(forceFinalVersion, 500);
  setTimeout(forceFinalVersion, 1500);
  window.__paliForceVersion2030 = {version:"20.41", label:FINAL_LABEL, force:forceFinalVersion};
})();


/* ===== Pāli Learning Lab 20.41 emergency responsiveness patch ===== */
(function(){
  window.PALI_SITE_VERSION="20.41";
  window.PALI_SITE_LABEL="Pāli Learning Lab · 20.41 最终显示修正版";
  function aliasGlobals(){try{if(!window.LEARNING_ROUTES && typeof LEARNING_ROUTES!=="undefined") window.LEARNING_ROUTES=LEARNING_ROUTES;}catch(e){}}
  function identity(){
    document.title="Pāli Learning Lab｜巴利语学习实验室";
    document.querySelectorAll('.eyebrow').forEach(el=>{el.textContent='Pāli Learning Lab';});
    const h1=document.querySelector('.hero h1'); if(h1) h1.textContent='📘 巴利语学习实验室';
    document.querySelectorAll('.visual-version-badge').forEach(el=>{el.textContent=window.PALI_SITE_LABEL;});
    document.documentElement.setAttribute('data-pali-version','20.41');
  }
  function safeRenderLearningRoutes(){
    aliasGlobals();
    if(typeof window.renderLearningRoutes==='function'){
      const old=window.renderLearningRoutes;
      window.renderLearningRoutes=function(){
        aliasGlobals();
        try{return old.apply(this,arguments);}catch(e){console.error(e);const c=document.getElementById('routeContent');if(c)c.innerHTML='<p class="muted">学习路线加载失败，请刷新缓存后重试。</p>';}
      };
    }
  }
  window.addEventListener('DOMContentLoaded',function(){aliasGlobals();identity();safeRenderLearningRoutes();setTimeout(identity,300);});
  window.addEventListener('load',function(){aliasGlobals();identity();});
})();


/* ===== Pāli Learning Lab 20.41: route lookup fix + remove inline Chinese term links ===== */
(function(){
  const VERSION_LABEL_2038 = "Pāli Learning Lab · 20.41 最终显示修正版";
  function byId(id){return document.getElementById(id);}
  function esc(s){return String(s ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
  function safeSwitch2038(id){
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    const target=byId(id)||byId('homeView');
    if(target) target.classList.remove('hidden');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function routes2038(){
    try{
      if(Array.isArray(window.LEARNING_ROUTES)) return window.LEARNING_ROUTES;
      if(typeof LEARNING_ROUTES !== 'undefined' && Array.isArray(LEARNING_ROUTES)) return LEARNING_ROUTES;
    }catch(e){}
    return [];
  }
  function grammar2038(){
    try{
      if(Array.isArray(GRAMMAR)) return GRAMMAR;
      if(Array.isArray(window.GRAMMAR)) return window.GRAMMAR;
    }catch(e){}
    return [];
  }
  async function ensureIndex2038(){
    if(grammar2038().length) return grammar2038();
    if(window.__paliGrammarLazy2020 && typeof window.__paliGrammarLazy2020.ensureIndex === 'function'){
      return window.__paliGrammarLazy2020.ensureIndex();
    }
    const r = await fetch('grammar-index.json?v=20.41',{cache:'no-store'});
    if(!r.ok) throw new Error('课程索引加载失败');
    const data = await r.json();
    try{GRAMMAR=data;}catch(e){window.GRAMMAR=data;}
    return data;
  }
  function lessonById2038(id){
    return grammar2038().find(l=>String(l.id)===String(id));
  }
  function lessonBtn2038(id){
    const l=lessonById2038(id);
    if(!l) return `<span class="route-empty-note">语法点 ${esc(id)} 正在加载</span>`;
    return `<button type="button" class="route-lesson-jump" data-route-lesson="${esc(id)}">${esc(l.lesson_number||'')}. ${esc(l.title||'')}</button>`;
  }
  let activeRoute2038='zero';
  function renderRoutes2038(preferred){
    if(preferred) activeRoute2038=preferred;
    const tabs=byId('routeTabs');
    const content=byId('routeContent')||byId('learningRouteContent')||byId('learningRouteList')||byId('routeList');
    const rs=routes2038();
    if(!content) return;
    if(!rs.length){
      if(tabs) tabs.innerHTML='';
      content.innerHTML='<p class="muted">暂无学习路线。请确认 learning-routes-data.js 已上传。</p>';
      return;
    }
    if(!rs.some(r=>r.id===activeRoute2038)) activeRoute2038=rs[0].id;
    const route=rs.find(r=>r.id===activeRoute2038)||rs[0];
    if(tabs){
      tabs.innerHTML=rs.map(r=>`<button type="button" class="route-tab ${r.id===route.id?'active':''}" data-route-tab-2038="${esc(r.id)}">${esc(r.title)}</button>`).join('');
    }
    content.innerHTML=`<div class="route-full-card"><h3>${esc(route.title)}</h3><p class="muted">${esc(route.desc||'')}</p>${(route.steps||[]).map((step,i)=>`<div class="route-step-card"><div class="route-step-number">${i+1}</div><div class="route-step-main"><h4>${esc(step.title||'')}</h4><p>${esc(step.desc||'')}</p><div class="route-lesson-list">${(step.lesson_ids||[]).map(lessonBtn2038).join('')}</div>${step.sentence_priority?`<button type="button" class="route-sentence-btn" data-sentence-priority="${esc(step.sentence_priority)}">进入句子分析：${esc(step.sentence_priority)}</button>`:''}</div></div>`).join('')}</div>`;
    cleanInlineTermLinks2038(content);
  }
  function openLearningRoute2038(routeId){
    safeSwitch2038('learningRouteView');
    const content=byId('routeContent');
    if(content) content.innerHTML='<p class="muted">正在加载课程索引，请稍候……</p>';
    ensureIndex2038().then(()=>{
      renderRoutes2038(routeId||activeRoute2038);
      setTimeout(()=>cleanInlineTermLinks2038(byId('learningRouteView')||document),80);
    }).catch(err=>{
      if(content) content.innerHTML='<p class="muted">学习路线加载失败：'+esc(err.message||err)+'</p>';
    });
  }
  function unwrap(el){
    if(!el || !el.parentNode) return;
    el.parentNode.replaceChild(document.createTextNode(el.textContent||''), el);
  }
  function cleanInlineTermLinks2038(root){
    root=root||document;
    const selectors=[
      '.concept-inline-link', '.concept-extra-link', '.term-direct-link',
      '.term-once-link-185', '.term-first-link-2019', '.term-once-link-172',
      '.ipa-hover', '.ipa-only', '[data-concept]', '[data-concept-extra]',
      '[data-term-first-2019]'
    ];
    const preserve='.lesson-term-box-185,.lesson-term-library-box,.linked-term-box,#termGlossaryList,.term-card,.concept-card,.route-lesson-list,.route-tabs,#routeTabs,.button-row,.status-buttons,.hero-subnav';
    root.querySelectorAll(selectors.join(',')).forEach(el=>{
      if(el.closest(preserve)) return;
      unwrap(el);
    });
    document.querySelectorAll('.term-popover-185,.term-popover-2019,.term-popover-187,.tip-modal').forEach(x=>x.remove());
  }
  function setVersion2038(){
    document.title='Pāli Learning Lab｜巴利语学习实验室';
    document.querySelectorAll('.visual-version-badge').forEach(b=>b.textContent=VERSION_LABEL_2038);
  }
  document.addEventListener('click',function(e){
    const action=e.target.closest('[data-action="learningRoute"]');
    if(action){
      e.preventDefault();e.stopImmediatePropagation();
      openLearningRoute2038('zero');
      return;
    }
    const tab=e.target.closest('[data-route-tab-2038]');
    if(tab){
      e.preventDefault();e.stopImmediatePropagation();
      activeRoute2038=tab.dataset.routeTab2038;
      renderRoutes2038(activeRoute2038);
      return;
    }
    const lesson=e.target.closest('[data-route-lesson]');
    if(lesson){
      e.preventDefault();e.stopImmediatePropagation();
      const id=lesson.dataset.routeLesson;
      ensureIndex2038().then(()=>{
        try{window.__paliLastView='learningRouteView';}catch(e){}
        if(typeof openLesson==='function') openLesson(id);
      });
      return;
    }
    setTimeout(()=>cleanInlineTermLinks2038(document.querySelector('.view:not(.hidden)')||document),260);
  },true);
  window.addEventListener('DOMContentLoaded',function(){
    setVersion2038();
    cleanInlineTermLinks2038(document);
    setTimeout(()=>cleanInlineTermLinks2038(document),700);
  });
  window.__paliRouteFix2038={openLearningRoute:openLearningRoute2038,renderRoutes:renderRoutes2038,cleanInlineTermLinks:cleanInlineTermLinks2038};
})();


/* ===== Pāli Learning Lab 20.41: integrated display cleanup + safe polish ===== */
(function(){
  const SITE_LABEL="Pāli Learning Lab · 20.41 最终显示修正版";
  const COURSE_FIELD_BLACKLIST=new Set([
    'target_cleanup_status','coverage_check_status','exercise_calibration_status','coverage_checklist','coverage_check_note','order_note','calibrated_version','exercise_source','example_coverage_note','visible','checked','__detailLoaded'
  ]);
  const TERM_BLACKLIST=new Set(['inf','inf.','ger','ger.','pr','p','f','pp','p.p','p.p.','f.p.p','sg','pl','nom','acc','ins','dat','abl','gen','loc','voc','prs','indic','act','mid','pass','m','f','n','json','lesson','module','id','true','false','null','undefined','Pāli','Learning','Lab','IPA']);
  function $(id){return document.getElementById(id)}
  function esc(s){return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function arr(name){try{return Array.isArray(window[name])?window[name]:[]}catch(e){return []}}
  function obj(name){try{return window[name] && typeof window[name]==='object'?window[name]:{}}catch(e){return {}}}
  function textHas(x,q){return !q || String(x||'').toLowerCase().includes(q.toLowerCase())}
  function setIdentity2039(){
    document.title='Pāli Learning Lab｜巴利语学习实验室';
    document.documentElement.setAttribute('data-pali-version','20.41');
    document.querySelectorAll('.eyebrow').forEach(el=>el.textContent='Pāli Learning Lab');
    const h1=document.querySelector('.hero h1'); if(h1) h1.textContent='📘 巴利语学习实验室';
    document.querySelectorAll('.visual-version-badge').forEach(el=>el.textContent=SITE_LABEL);
  }
  function unwrap(el){if(el&&el.parentNode)el.parentNode.replaceChild(document.createTextNode(el.textContent||''),el)}
  function cleanBadTexts2039(root=document){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){return /(点击查看\s*IPA|点击查观察\s*IPA|悬浮查观察\s*IPA|悬停查看|hover\s*IPA)/i.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{n.nodeValue=n.nodeValue.replace(/点击查看\s*IPA|点击查观察\s*IPA|悬浮查观察\s*IPA|悬停查看|hover\s*IPA/ig,'').replace(/英文术语下方虚线表示可[^。]*。?/g,'');});
  }
  function cleanInlineTermLinks2039(root=document){
    const preserve='.lesson-term-box-185,.lesson-term-library-box,.linked-term-box,#termGlossaryList,.term-card,.term-table,.concept-card,.core-concepts-2039,.related-term-box-2039,.route-lesson-list,.route-tabs,#routeTabs,.button-row,.status-buttons,.hero-subnav,.pali-keyboard';
    root.querySelectorAll('.concept-inline-link,.term-direct-link,.term-once-link-185,.term-first-link-2019,.term-once-link-172,.ipa-hover,.ipa-only,[data-concept],[data-concept-extra],[data-term-first-2019]').forEach(el=>{
      if(el.closest(preserve))return;
      unwrap(el);
    });
    document.querySelectorAll('.term-popover-185,.term-popover-2019,.term-popover-187,.ipa-popover,.ipa-mobile-popover').forEach(x=>x.remove());
    cleanBadTexts2039(root);
  }
  function termData2039(){return arr('TERMINOLOGY_GLOSSARY')}
  function findTerm2039(label){
    const q=String(label||'').trim().toLowerCase();
    if(!q)return null;
    return termData2039().find(t=>[t.en,t.cn,t.pali,t.cat].some(v=>String(v||'').toLowerCase()===q)) ||
      termData2039().find(t=>[t.en,t.cn,t.pali,t.note,t.simple_explanation].some(v=>String(v||'').toLowerCase().includes(q)));
  }
  function goTerm2039(label){
    const q=String(label||'').replace(/[，,。；;：:]/g,'').trim();
    if(typeof route==='function') route('terminologyGlossary'); else {document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));$('terminologyGlossaryView')?.classList.remove('hidden');}
    setTimeout(()=>{const input=$('termSearchInput');if(input){input.value=q; input.dispatchEvent(new Event('input',{bubbles:true}));}if(typeof renderTerms==='function')renderTerms();setTimeout(()=>{const first=document.querySelector('#termGlossaryList details,.term-card,#termGlossaryList tr:nth-child(2)'); if(first){first.scrollIntoView({behavior:'smooth',block:'center'}); if(first.tagName==='DETAILS') first.open=true;}},80);},80);
  }
  function renderTerms2039(){
    const data=termData2039(), box=$('termGlossaryList'); if(!box)return;
    const q=($('termSearchInput')?.value||'').trim().toLowerCase();
    const cats=['全部',...new Set(data.map(x=>x.cat).filter(Boolean))];
    const sel=$('termCategorySelect');
    if(sel && (!sel.options.length || sel.dataset.ready2039!=='1')){sel.innerHTML=cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');sel.dataset.ready2039='1';}
    const cat=sel?.value||'全部';
    const items=data.filter(t=>(cat==='全部'||t.cat===cat)&&(!q||[t.en,t.ipa,t.cn,t.pali,t.cat,t.note,t.simple_explanation].join(' ').toLowerCase().includes(q)));
    box.innerHTML=items.length?`<div class="term-count">共显示 <strong>${items.length}</strong> 条术语。</div>`+items.map(t=>`<details class="term-card" data-term-key="${esc(t.en||t.cn||'')}"><summary><span class="term-title-en">${esc(t.en||'')}</span>${t.ipa?`<span class="term-ipa">${esc(t.ipa)}</span>`:''}<span class="term-title-cn">${esc(t.cn||'')}</span></summary><div class="term-card-body">${t.pali?`<p><strong>巴利/传统术语：</strong>${esc(t.pali)}</p>`:''}${t.cat?`<p><strong>类别：</strong>${esc(t.cat)}</p>`:''}${t.note?`<p><strong>说明：</strong>${esc(t.note)}</p>`:''}${t.simple_explanation?`<p><strong>简单理解：</strong>${esc(t.simple_explanation)}</p>`:''}${Array.isArray(t.contrast_examples)&&t.contrast_examples.length?`<div class="term-examples"><strong>对比例子：</strong>${t.contrast_examples.map(e=>`<p><span class="term-example-label">${esc(e.label||'例')}</span> ${esc(e.form||'')}<br><span class="muted">${esc(e.meaning||'')}</span></p>`).join('')}</div>`:''}</div></details>`).join(''):'<p class="muted">没有找到相关术语。</p>';
  }
  function getLesson2039(){try{return currentLesson||null}catch(e){return null}}
  function extractConcepts2039(lesson){
    const src=[lesson?.title,lesson?.category,lesson?.module,lesson?.summary,...(lesson?.minimal_mastery||[]),...(lesson?.learning_goals||[])].join(' ');
    const seeds=['主格','宾格','工具格','与格','从格','属格','处格','呼格','格','变格','变位','限定动词','动词','不定式','连续体','分词','现在时','将来时','过去时','命令语气','祈愿语气','主动语态','中间语态','被动语态','sandhi','连读','复合词','词干','词尾','词根','ind.','否定','并列','选择','引语','句法','主语','宾语'];
    return [...new Set(seeds.filter(x=>src.includes(x)).slice(0,8))];
  }
  function extractVocab2039(lesson){
    const chunks=[];
    (lesson?.examples||[]).forEach(e=>chunks.push(e.pali||'',e.note||'',e.grammar_note||''));
    (lesson?.table||[]).forEach(row=>Array.isArray(row)&&row.forEach(c=>chunks.push(c)));
    (lesson?.cards||[]).forEach(c=>chunks.push(c.q||'',c.a||''));
    const text=chunks.join(' ');
    const re=/[A-Za-zĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ][A-Za-zĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ\.\-]*/g;
    const counts={}; let m;
    while((m=re.exec(text))){let w=m[0].replace(/[\.\-]+$/,''); if(w.length<2)continue; if(TERM_BLACKLIST.has(w)||TERM_BLACKLIST.has(w.toLowerCase()))continue; if(/^(m|f|n|sg|pl|nom|acc|gen|loc|dat|ins|abl|voc)$/i.test(w))continue; counts[w]=(counts[w]||0)+1;}
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,18).map(x=>x[0]);
  }
  function ensureBefore2039(id,className,title,html,beforeEl){
    let box=document.getElementById(id); if(!box){box=document.createElement('div');box.id=id;box.className=className; beforeEl?.parentNode?.insertBefore(box,beforeEl);} box.innerHTML=`<h3 class="lesson-section-title">${title}</h3>${html}`; return box;
  }
  function reorderLesson2039(){
    const lesson=getLesson2039(); if(!lesson || !$('lessonView'))return;
    cleanInlineTermLinks2039($('lessonView'));
    const card=$('lessonView')?.querySelector('.card'); if(!card)return;
    const summary=$('lessonSummary'), tableTitle=[...card.querySelectorAll('h3')].find(h=>h.textContent.includes('形式与结构'));
    const explanationTitle=$('lessonExplanation')?.previousElementSibling; if(explanationTitle) explanationTitle.textContent='重点说明';
    const goals=(lesson.minimal_mastery&&lesson.minimal_mastery.length?lesson.minimal_mastery:lesson.learning_goals)||[];
    if(goals.length) ensureBefore2039('lessonObjectives2039','lesson-objectives-2039','本课目标',`<ul>${goals.slice(0,6).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`, tableTitle||$('lessonExplanation'));
    const concepts=extractConcepts2039(lesson);
    if(concepts.length) ensureBefore2039('lessonConcepts2039','core-concepts-2039','核心概念',`<div class="concept-pill-row">${concepts.map(x=>`<button type="button" class="concept-pill" data-term-jump="${esc(x)}">${esc(x)}</button>`).join('')}</div>`, tableTitle||$('lessonExplanation'));
    const vocab=extractVocab2039(lesson);
    if(vocab.length) ensureBefore2039('lessonVocab2039','lesson-vocab-2039','本节单词',`<div class="vocab-chip-row">${vocab.map(w=>`<button type="button" class="vocab-chip" data-token-analyze="${esc(w)}">${esc(w)}</button>`).join('')}</div><p class="muted">自动提取自本课例句和表格；具体语法功能以句子分析和词典复核为准。</p>`, tableTitle||$('lessonExplanation'));
    const mistake=$('mistakeBlock'); const examples=$('lessonExamples'); if(mistake&&examples&&examples.parentNode){examples.parentNode.insertBefore(mistake, examples.nextSibling);}    
    const btnRow=card.querySelector('.button-row'); if(btnRow&&mistake&&mistake.parentNode){mistake.parentNode.insertBefore(btnRow,mistake.nextSibling);}    
    cleanInlineTermLinks2039(card);
  }
  function renderLessonList2039(m){
    try{currentModule=m;}catch(e){}
    const all=(m==='全部模块'?GRAMMAR:GRAMMAR.filter(x=>x.module===m)).slice().sort((a,b)=>(Number(a.lesson_number)||9999)-(Number(b.lesson_number)||9999)||(Number(a.id)||9999)-(Number(b.id)||9999));
    const filter=(typeof currentFilter!=='undefined'?currentFilter:'全部');
    const ls=all.filter(l=>filter==='全部'||(typeof lstat==='function'?lstat(l.id):'未学')===filter);
    if($('moduleTitle'))$('moduleTitle').textContent=m;
    if($('moduleSubtitle'))$('moduleSubtitle').textContent=`${all.length} 个语法点`;
    const list=$('lessonList'); if(!list)return;
    list.innerHTML=ls.length?'':'<p class="muted">当前筛选下没有语法点。</p>';
    ls.forEach(l=>{const d=document.createElement('div');d.className='lesson-item';d.innerHTML=typeof cardHTML==='function'?cardHTML(l):`<h3>${esc(l.lesson_number||l.id)}. ${esc(l.title||'')}</h3><p>${esc(l.summary||'')}</p>`;d.onclick=()=>{if(typeof openLesson==='function')openLesson(l.id)};list.appendChild(d);});
  }
  function renderClassifiedSearch2039(){
    const box=$('searchResults'), input=$('searchInput'); if(!box||!input)return;
    const q=input.value.trim().toLowerCase(); if(!q){box.innerHTML='<p class="muted">输入关键词后显示分类搜索结果。</p>';return;}
    const groups={课程:[],句子分析:[],术语:[],佛典阅读:[],词形分析:[]};
    (window.GRAMMAR||GRAMMAR||[]).forEach(l=>{const txt=[l.title,l.module,l.category,l.summary].join(' ').toLowerCase(); if(txt.includes(q))groups.课程.push({title:`${l.lesson_number||l.id}. ${l.title}`,desc:l.summary||'',open:()=>openLesson(l.id)});});
    arr('SENTENCE_ANALYSIS_DATA').forEach(s=>{const txt=[s.sentence,s.translation,s.structure,s.tags?.join(' ')].join(' ').toLowerCase(); if(txt.includes(q))groups.句子分析.push({title:s.sentence,desc:s.translation||s.structure||'',open:()=>{if(typeof route==='function')route('sentenceAnalysis');setTimeout(()=>{const si=$('sentenceSearchInput');if(si){si.value=s.sentence;si.dispatchEvent(new Event('input',{bubbles:true}));}},100);}});});
    termData2039().forEach(t=>{const txt=[t.en,t.ipa,t.cn,t.pali,t.note,t.simple_explanation].join(' ').toLowerCase(); if(txt.includes(q))groups.术语.push({title:[t.en,t.ipa,t.cn].filter(Boolean).join('｜'),desc:t.note||t.simple_explanation||'',open:()=>goTerm2039(t.en||t.cn)});});
    arr('BUDDHIST_READING_PATTERNS').forEach(x=>{const txt=[x.title,x.formula,x.natural,x.structure,x.warning].join(' ').toLowerCase(); if(txt.includes(q))groups.佛典阅读.push({title:x.title,desc:x.natural||x.structure||'',open:()=>{if(typeof route==='function')route('buddhistReading');}});});
    Object.keys(obj('TOKEN_ANALYSIS_DATA')).forEach(k=>{if(k.toLowerCase().includes(q)){const it=window.TOKEN_ANALYSIS_DATA[k];groups.词形分析.push({title:k,desc:(it.analyses||[]).map(a=>`${a.grammar} ${a.meaning}`).join('；'),open:()=>{if(typeof route==='function')route('dictionaryLookup');setTimeout(()=>{const inp=$('paliLookupInput');if(inp)inp.value=k;if(typeof analyzePaliToken==='function')analyzePaliToken(k);},100);}});}});
    const html=Object.entries(groups).filter(([_,items])=>items.length).map(([name,items])=>`<div class="search-group-2039"><h3>${name}</h3>${items.slice(0,10).map((r,i)=>`<div class="search-result-2039"><strong>${esc(r.title)}</strong><p class="muted">${esc(r.desc).slice(0,180)}</p><button type="button" data-search-group="${esc(name)}" data-search-index="${i}">打开</button></div>`).join('')}</div>`).join('');
    window.__searchGroups2039=groups;
    box.innerHTML=html||'<p class="muted">没有找到相关内容。</p>';
  }
  function patchGlobals2039(){
    window.renderTerms=renderTerms2039;
    window.renderLessonList=renderLessonList2039;
    const oldOpen=window.openLesson; if(typeof oldOpen==='function' && !oldOpen.__patched2039){
      window.openLesson=function(){const r=oldOpen.apply(this,arguments);setTimeout(reorderLesson2039,80);setTimeout(()=>cleanInlineTermLinks2039($('lessonView')||document),220);return r;};
      window.openLesson.__patched2039=true;
    }
    const oldRoute=window.route; if(typeof oldRoute==='function' && !oldRoute.__patched2039){
      window.route=function(action){const r=oldRoute.apply(this,arguments);setTimeout(()=>{if(action==='terminologyGlossary')renderTerms2039();if(action==='search')renderClassifiedSearch2039();cleanInlineTermLinks2039(document.querySelector('.view:not(.hidden)')||document);},120);return r;};
      window.route.__patched2039=true;
    }
  }
  document.addEventListener('click',function(e){
    const term=e.target.closest('[data-term-jump]'); if(term){e.preventDefault();e.stopImmediatePropagation();goTerm2039(term.dataset.termJump||term.textContent);return;}
    const btn=e.target.closest('[data-search-group]'); if(btn){const g=window.__searchGroups2039?.[btn.dataset.searchGroup]||[]; const item=g[Number(btn.dataset.searchIndex)||0]; if(item&&item.open){e.preventDefault();item.open();}}
    setTimeout(()=>cleanInlineTermLinks2039(document.querySelector('.view:not(.hidden)')||document),200);
  },true);
  document.addEventListener('input',function(e){if(e.target.id==='searchInput'){e.stopImmediatePropagation();renderClassifiedSearch2039();}},true);
  document.addEventListener('change',function(e){if(e.target.id==='termCategorySelect'){setTimeout(renderTerms2039,0);}},true);
  window.addEventListener('DOMContentLoaded',function(){setIdentity2039();patchGlobals2039();cleanInlineTermLinks2039(document);setTimeout(()=>{setIdentity2039();patchGlobals2039();cleanInlineTermLinks2039(document);},500);});
  window.addEventListener('load',function(){setIdentity2039();patchGlobals2039();cleanInlineTermLinks2039(document);});
  window.__paliIntegratedPolish2039={setIdentity2039,cleanInlineTermLinks2039,reorderLesson2039,renderTerms2039,renderClassifiedSearch2039,goTerm2039};
})();

/* ===== Pāli Learning Lab 20.41: integrated fix requested by user ===== */
(function(){
  const VERSION_2040 = "20.41";
  const LABEL_2040 = "Pāli Learning Lab · 20.41 最终显示修正版";
  const STOPWORDS_2040 = new Set([
    "a","an","and","or","the","to","from","of","in","on","with","by","for","as","is","are","be","was","were","not","no","yes",
    "case","nominative","accusative","instrumental","dative","ablative","genitive","locative","vocative","gender","number","singular","plural","masculine","feminine","neuter","root","stem","ending","suffix","prefix","voice","tense","mood","syntax","grammar","lesson","module","route","search","json","html","data","true","false","null","undefined",
    "inf","infinitive","ger","gerund","absolutive","pr","pp","participle","present","past","future","passive","active","middle","indicative","imperative","optative","causative","sandhi","ipa","pali","learning","lab",
    "sg","pl","nom","acc","ins","dat","abl","gen","loc","voc","prs","indic","act","mid","pass","m","f","n","id","cn","en","note","table","cards","examples"
  ]);
  function byId(id){return document.getElementById(id)}
  function esc(s){return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
  function safeArray(v){return Array.isArray(v)?v:[]}
  function scriptLoaded(src){return !![...document.scripts].find(s=>(s.getAttribute('src')||'').includes(src));}
  function loadScript2040(src){
    return new Promise((resolve,reject)=>{
      if(scriptLoaded(src.split('?')[0])) return resolve();
      const s=document.createElement('script');
      s.src=src+(src.includes('?')?'&':'?')+'v='+VERSION_2040+'&t='+Date.now();
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error('无法加载 '+src));
      document.head.appendChild(s);
    });
  }
  async function ensureGrammarIndex2040(){
    try{ if(Array.isArray(window.GRAMMAR) && window.GRAMMAR.length) return window.GRAMMAR; }catch(e){}
    try{ if(typeof GRAMMAR!=='undefined' && Array.isArray(GRAMMAR) && GRAMMAR.length){ window.GRAMMAR=GRAMMAR; return GRAMMAR; } }catch(e){}
    const res=await fetch('grammar-index.json?v='+VERSION_2040+'&t='+Date.now(),{cache:'no-store'});
    if(!res.ok) throw new Error('grammar-index.json 加载失败');
    const data=await res.json();
    window.GRAMMAR=data;
    try{ GRAMMAR=data; }catch(e){}
    if(typeof stats==='function') stats();
    return data;
  }
  async function ensureLearningRoutes2040(){
    if(Array.isArray(window.LEARNING_ROUTES) && window.LEARNING_ROUTES.length) return window.LEARNING_ROUTES;
    try{ if(typeof LEARNING_ROUTES!=='undefined' && Array.isArray(LEARNING_ROUTES)){window.LEARNING_ROUTES=LEARNING_ROUTES;return LEARNING_ROUTES;} }catch(e){}
    await loadScript2040('learning-routes-data.js');
    try{ if(!window.LEARNING_ROUTES && typeof LEARNING_ROUTES!=='undefined') window.LEARNING_ROUTES=LEARNING_ROUTES; }catch(e){}
    return window.LEARNING_ROUTES||[];
  }
  async function ensureTerms2040(){
    if(Array.isArray(window.TERMINOLOGY_GLOSSARY) && window.TERMINOLOGY_GLOSSARY.length) return window.TERMINOLOGY_GLOSSARY;
    try{ if(typeof TERMINOLOGY_GLOSSARY!=='undefined' && Array.isArray(TERMINOLOGY_GLOSSARY)){window.TERMINOLOGY_GLOSSARY=TERMINOLOGY_GLOSSARY;return TERMINOLOGY_GLOSSARY;} }catch(e){}
    try{ await loadScript2040('terminology-glossary-data.js'); }catch(e){}
    try{ if(!window.TERMINOLOGY_GLOSSARY && typeof TERMINOLOGY_GLOSSARY!=='undefined') window.TERMINOLOGY_GLOSSARY=TERMINOLOGY_GLOSSARY; }catch(e){}
    return window.TERMINOLOGY_GLOSSARY||[];
  }
  function setIdentity2040(){
    document.title='Pāli Learning Lab｜巴利语学习实验室';
    document.documentElement.setAttribute('data-pali-version',VERSION_2040);
    window.PALI_SITE_VERSION=VERSION_2040;
    window.PALI_SITE_LABEL=LABEL_2040;
    document.querySelectorAll('.eyebrow').forEach(el=>el.textContent='Pāli Learning Lab');
    const h1=document.querySelector('.hero h1'); if(h1) h1.textContent='📘 巴利语学习实验室';
    document.querySelectorAll('.visual-version-badge').forEach(el=>el.textContent=LABEL_2040);
  }
  function unwrap2040(el){ if(el && el.parentNode) el.parentNode.replaceChild(document.createTextNode(el.textContent||''),el); }
  function cleanupIPA2040(root=document){
    // Stop old IPA hover/click annotations. Keep IPA values directly displayed inside glossary cards.
    try{
      if(window.__paliIPA145){window.__paliIPA145.annotateIPA145=function(){};window.__paliIPA145.annotateVisibleIPA145=function(){};}
      if(window.__paliIPA149){window.__paliIPA149.annotate149=function(){};window.__paliIPA149.annotateVisible149=function(){};}
    }catch(e){}
    root.querySelectorAll('.ipa-hover,.ipa-touch-popover,.ipa-popover,.ipa-mobile-popover').forEach(el=>{
      if(el.classList && el.classList.contains('ipa-hover')) unwrap2040(el); else el.remove();
    });
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){return /(点击查看\s*IPA|点击查观察\s*IPA|悬停查看|hover\s*IPA|英文术语下方虚线)/i.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{n.nodeValue=n.nodeValue.replace(/点击查看\s*IPA|点击查观察\s*IPA|悬停查看|hover\s*IPA/ig,'').replace(/英文术语下方虚线[^。]*。?/g,'');});
  }
  function removeInlineTermLinks2040(root=document){
    const preserve='.core-term-box-2040,#termGlossaryList,.term-card,.term-table,.term-count,.hero-subnav,.route-tabs,#routeTabs,.route-lesson-list,.button-row,.pali-keyboard,.status-buttons';
    root.querySelectorAll('.concept-inline-link,.concept-extra-link,.term-direct-link,.term-once-link-185,.term-first-link-2019,.term-once-link-172,[data-concept],[data-concept-extra],[data-term-first-2019]').forEach(el=>{
      if(el.closest(preserve)) return;
      unwrap2040(el);
    });
    document.querySelectorAll('.term-popover-185,.term-popover-2019,.term-popover-187,.tip-modal').forEach(x=>x.remove());
    cleanupIPA2040(root);
  }
  function removeBuddhistRelated2040(root=document){
    root.querySelectorAll('.linked-buddhist-box,.linked-background-box,.linked-academic-box').forEach(x=>x.remove());
    [...root.querySelectorAll('div,section,aside')].forEach(el=>{
      const t=(el.textContent||'').trim();
      if(/^相关佛典阅读句式|^相关佛典阅读|^相关佛典背景|^相关学术训练/.test(t)) el.remove();
    });
  }
  function termCandidates2040(lesson){
    const text=[lesson?.title,lesson?.category,lesson?.module,lesson?.summary,...safeArray(lesson?.minimal_mastery),...safeArray(lesson?.learning_goals),...safeArray(lesson?.common_mistakes)].join(' ');
    const seeds=['格','主格','宾格','工具格','与格','从格','属格','处格','呼格','变格','变位','词根','词干','词尾','限定动词','动词','现在时','将来时','过去时','命令语气','祈愿语气','主动语态','中间语态','被动语态','不定式','连续体','分词','过去分词','未来被动分词','不变词','否定','并列','选择','引语','句法','主语','宾语','sandhi','连读音变','复合词','佛典公式句'];
    const out=[];
    seeds.forEach(s=>{ if(text.includes(s)) out.push(s); });
    safeArray(lesson?.linked_terminology).forEach(x=>out.push(x));
    safeArray(lesson?.related_terms).forEach(x=>out.push(x));
    return [...new Set(out)].slice(0,14);
  }
  function normalizeToken2040(w){return String(w||'').replace(/^[^A-Za-zĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ√]+|[^A-Za-zĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ]+$/g,'');}
  function addTokensFromString2040(str,score,map,strictPaliContext=false){
    str=String(str||'');
    const re=/[A-Za-zĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ√][A-Za-zĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ√\.\-]*/g;
    let m;
    while((m=re.exec(str))){
      let w=normalizeToken2040(m[0]); if(!w || w.length<2) continue;
      const lw=w.toLowerCase().replace(/\.$/,'');
      if(STOPWORDS_2040.has(lw) || STOPWORDS_2040.has(w)) continue;
      if(/\d/.test(w)) continue;
      if(/^(m|f|n|sg|pl|nom|acc|gen|loc|dat|ins|abl|voc|prs|act|mid|pass|indic)$/i.test(w)) continue;
      const hasDia=/[ĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ]/.test(w);
      const likelyPali = strictPaliContext || hasDia || /^(Buddh|Dhamm|Saṅgh|Bhikkh|Ahaṃ|Tvaṃ|Mayaṃ|Tumhe|Te|So|Taṃ|Eta|Yo|Yadā|Tadā|Evaṃ|Ekaṃ|Bhagav|gacch|dese|suṇ|vand|vas|vihar|kar|hoti|atthi|natthi|dhamma|buddha|saṅgha|saraṇa|citta|phala|rūpa|paññ|suta|gata|kata|kamma|dukkha|anicc|anatt|vihār|samay)/i.test(w);
      if(!likelyPali) continue;
      map[w]=(map[w]||0)+score;
    }
  }
  function extractVocab2040(lesson){
    const map={};
    safeArray(lesson?.examples).forEach(ex=>{
      addTokensFromString2040(ex.pali,8,map,true);
      addTokensFromString2040(ex.source,6,map,true);
      addTokensFromString2040(ex.formula,5,map,true);
      addTokensFromString2040(ex.note,2,map,false);
      addTokensFromString2040(ex.grammar_note,2,map,false);
    });
    safeArray(lesson?.table).forEach(row=>safeArray(row).forEach(cell=>addTokensFromString2040(cell,2,map,false)));
    safeArray(lesson?.cards).forEach(c=>{addTokensFromString2040(c.q,1,map,false);addTokensFromString2040(c.a,1,map,false);});
    [lesson?.title,lesson?.summary,...safeArray(lesson?.explanation)].forEach(s=>addTokensFromString2040(s,1,map,false));
    return Object.entries(map).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,24).map(x=>x[0]);
  }
  function findInsertionPoint2040(){
    return [...document.querySelectorAll('#lessonView h3')].find(h=>/重点说明|形式与结构/.test(h.textContent||'')) || byId('lessonExplanation') || byId('lessonTable');
  }
  function renderCoreTerms2040(lesson){
    const old=document.querySelectorAll('#lessonConcepts2039,#lessonConcepts2040,.linked-term-box,.lesson-term-box-185,.lesson-term-library-box,.related-term-box-2039,.core-concepts-2039');
    old.forEach(x=>x.remove());
    const terms=termCandidates2040(lesson); if(!terms.length) return;
    const box=document.createElement('div'); box.id='lessonConcepts2040'; box.className='core-term-box-2040';
    box.innerHTML=`<h3 class="lesson-section-title">核心概念与相关术语</h3><div class="term-chip-row-2040">${terms.map(t=>`<button type="button" class="term-chip-2040" data-term-jump-2040="${esc(t)}">${esc(t)}</button>`).join('')}</div><p class="muted">点击术语可直接进入术语库对应内容。</p>`;
    const point=findInsertionPoint2040(); if(point&&point.parentNode) point.parentNode.insertBefore(box,point); else byId('lessonView')?.querySelector('.card')?.appendChild(box);
  }
  function renderVocab2040(lesson){
    document.querySelectorAll('#lessonVocab2039,#lessonVocab2040,.lesson-vocab-2039').forEach(x=>x.remove());
    const vocab=extractVocab2040(lesson);
    const box=document.createElement('div'); box.id='lessonVocab2040'; box.className='lesson-vocab-2040';
    box.innerHTML=`<h3 class="lesson-section-title">本节单词</h3>${vocab.length?`<div class="vocab-chip-row-2040">${vocab.map(w=>`<span class="vocab-chip-plain">${esc(w)}</span>`).join('')}</div><p class="muted">本词表为自动提取，主要来自本课例句、表格和说明；不再逐词链接查词，以减少干扰。</p>`:`<p class="muted">本课未检出明确巴利语词形；请以本课核心概念和例句为主。</p>`}`;
    const point=findInsertionPoint2040(); if(point&&point.parentNode) point.parentNode.insertBefore(box,point); else byId('lessonView')?.querySelector('.card')?.appendChild(box);
  }
  function polishLesson2040(){
    let lesson=null; try{lesson=currentLesson||null;}catch(e){}
    if(!lesson || !byId('lessonView')) return;
    removeBuddhistRelated2040(byId('lessonView'));
    renderCoreTerms2040(lesson);
    renderVocab2040(lesson);
    removeInlineTermLinks2040(byId('lessonView'));
  }
  function getLessonById2040(id,grammar){
    id=String(id);
    return safeArray(grammar).find(l=>String(l.id)===id || String(l.lesson_number)===id);
  }
  function routeLessonButton2040(id,grammar){
    const l=getLessonById2040(id,grammar);
    if(!l) return `<span class="route-missing-2040">语法点 ${esc(id)}（索引加载中）</span>`;
    return `<button type="button" class="route-lesson-btn" data-route-lesson="${esc(l.id)}">${esc(l.lesson_number||l.id)}. ${esc(l.title||'语法点')}</button>`;
  }
  async function renderLearningRoutes2040(routeId){
    const tabs=byId('routeTabs'), content=byId('routeContent'); if(!content) return;
    content.innerHTML='<p class="muted">正在加载学习路线……</p>';
    let routes=[], grammar=[];
    try{ routes=await ensureLearningRoutes2040(); grammar=await ensureGrammarIndex2040(); }catch(e){content.innerHTML='<p class="muted">学习路线加载失败：'+esc(e.message||e)+'</p>';return;}
    if(!routes.length){content.innerHTML='<p class="muted">暂无学习路线。请确认 learning-routes-data.js 已上传。</p>';return;}
    let active=routeId || window.__activeRoute2040 || routes[0].id;
    if(!routes.some(r=>r.id===active)) active=routes[0].id;
    window.__activeRoute2040=active;
    const route=routes.find(r=>r.id===active)||routes[0];
    if(tabs){tabs.innerHTML=routes.map(r=>`<button type="button" class="route-tab ${r.id===active?'active':''}" data-route-tab-2040="${esc(r.id)}">${esc(r.title||r.id)}</button>`).join('');}
    content.innerHTML=`<div class="route-full-card"><h3>${esc(route.title||'学习路线')}</h3><p class="muted">${esc(route.desc||'')}</p>${safeArray(route.steps).map((step,i)=>`<div class="route-step-card"><div class="route-step-number">${i+1}</div><div class="route-step-main"><h4>${esc(step.title||'')}</h4><p>${esc(step.desc||'')}</p><div class="route-lesson-list">${safeArray(step.lesson_ids).map(id=>routeLessonButton2040(id,grammar)).join('')}</div>${step.sentence_priority?`<button type="button" class="route-sentence-btn" data-sentence-priority="${esc(step.sentence_priority)}">进入句子分析：${esc(step.sentence_priority)}</button>`:''}</div></div>`).join('')}</div>`;
    removeInlineTermLinks2040(content);
  }
  async function openLearningRoute2040(routeId='zero'){
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    byId('learningRouteView')?.classList.remove('hidden');
    window.scrollTo({top:0,behavior:'smooth'});
    await renderLearningRoutes2040(routeId);
  }
  async function goTerm2040(term){
    term=String(term||'').trim();
    await ensureTerms2040();
    if(typeof route==='function') route('terminologyGlossary');
    else {document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden')); byId('terminologyGlossaryView')?.classList.remove('hidden');}
    setTimeout(()=>{
      const input=byId('termSearchInput'); if(input){input.value=term; input.dispatchEvent(new Event('input',{bubbles:true}));}
      if(typeof renderTerms==='function') try{renderTerms();}catch(e){}
      setTimeout(()=>{const first=document.querySelector('#termGlossaryList details,#termGlossaryList .term-card,#termGlossaryList tr:nth-child(2)'); if(first){if(first.tagName==='DETAILS')first.open=true; first.scrollIntoView({behavior:'smooth',block:'center'});}},180);
    },120);
  }
  function patchGlobals2040(){
    window.renderLearningRoutes=renderLearningRoutes2040;
    window.__paliRenderLearningRoutes2040=renderLearningRoutes2040;
    const oldOpen=window.openLesson;
    if(typeof oldOpen==='function' && !oldOpen.__patched2040){
      window.openLesson=function(){const r=oldOpen.apply(this,arguments); setTimeout(polishLesson2040,80); setTimeout(polishLesson2040,260); return r;};
      window.openLesson.__patched2040=true;
    }
  }
  document.addEventListener('click',function(e){
    const lr=e.target.closest('[data-action="learningRoute"]');
    if(lr){e.preventDefault(); e.stopImmediatePropagation(); openLearningRoute2040('zero'); return;}
    const tab=e.target.closest('[data-route-tab-2040]');
    if(tab){e.preventDefault(); e.stopImmediatePropagation(); renderLearningRoutes2040(tab.dataset.routeTab2040); return;}
    const lesson=e.target.closest('[data-route-lesson]');
    if(lesson){e.preventDefault(); e.stopImmediatePropagation(); ensureGrammarIndex2040().then(()=>{try{window.__paliLastView='learningRouteView';}catch(err){} if(typeof openLesson==='function')openLesson(lesson.dataset.routeLesson);}); return;}
    const term=e.target.closest('[data-term-jump-2040], [data-term-jump]');
    if(term){e.preventDefault(); e.stopImmediatePropagation(); goTerm2040(term.dataset.termJump2040 || term.dataset.termJump || term.textContent); return;}
    setTimeout(()=>{removeInlineTermLinks2040(document.querySelector('.view:not(.hidden)')||document);removeBuddhistRelated2040(document.querySelector('.view:not(.hidden)')||document);},200);
  },true);
  function boot2040(){setIdentity2040(); patchGlobals2040(); cleanupIPA2040(document); removeInlineTermLinks2040(document); removeBuddhistRelated2040(document); setTimeout(()=>{setIdentity2040();patchGlobals2040();cleanupIPA2040(document);removeInlineTermLinks2040(document);},600);}
  window.addEventListener('DOMContentLoaded',boot2040);
  window.addEventListener('load',boot2040);
  setInterval(()=>{const v=document.querySelector('.view:not(.hidden)'); if(v){cleanupIPA2040(v); removeBuddhistRelated2040(v);}},1200);
  window.__paliFix2040={renderLearningRoutes2040,openLearningRoute2040,goTerm2040,polishLesson2040,extractVocab2040,cleanupIPA2040};
})();


/* ===== Pāli Learning Lab 20.41: final display, route, vocabulary and term fix ===== */
(function(){
  const VERSION_2041 = "20.41";
  const LABEL_2041 = "Pāli Learning Lab · 20.41 最终显示修正版";
  const FULL_INDEX_URL_2041 = "grammar-index.json?v=20.41&t=";
  const MANIFEST_URL_2041 = "grammar-lesson-manifest.json?v=20.41&t=";
  const ROUTE_URL_2041 = "learning-routes-data.js?v=20.41&t=";
  const TERM_URL_2041 = "terminology-glossary-data.js?v=20.41&t=";
  let fullIndexPromise2041=null, manifestPromise2041=null, routePromise2041=null, termPromise2041=null;

  function byId(id){return document.getElementById(id)}
  function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
  function arr(v){return Array.isArray(v)?v:[]}
  function setIdentity2041(){
    document.title="Pāli Learning Lab｜巴利语学习实验室";
    document.documentElement.setAttribute("data-pali-version",VERSION_2041);
    window.PALI_SITE_VERSION=VERSION_2041; window.PALI_SITE_LABEL=LABEL_2041;
    document.querySelectorAll(".eyebrow").forEach(el=>el.textContent="Pāli Learning Lab");
    const h1=document.querySelector(".hero h1"); if(h1)h1.textContent="📘 巴利语学习实验室";
    document.querySelectorAll(".visual-version-badge").forEach(el=>el.textContent=LABEL_2041);
  }
  function loadScriptOnce2041(src){
    return new Promise((resolve,reject)=>{
      const plain=src.split('?')[0];
      if([...document.scripts].some(s=>(s.getAttribute('src')||'').includes(plain))) return resolve();
      const s=document.createElement('script'); s.src=src+Date.now(); s.onload=resolve; s.onerror=()=>reject(new Error('无法加载 '+plain)); document.head.appendChild(s);
    });
  }
  async function ensureFullGrammar2041(force=false){
    const current = (typeof GRAMMAR!=="undefined" && Array.isArray(GRAMMAR)) ? GRAMMAR : (Array.isArray(window.GRAMMAR)?window.GRAMMAR:[]);
    // Full grammar-index has far more than a single module. If only a module subset is present, force full index.
    if(!force && Array.isArray(current) && current.length>=100){ window.GRAMMAR=current; return current; }
    if(!fullIndexPromise2041){
      fullIndexPromise2041=fetch(FULL_INDEX_URL_2041+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('grammar-index.json 加载失败');return r.json();}).then(data=>{
        window.GRAMMAR=data; try{GRAMMAR=data;}catch(e){}; if(typeof stats==='function')try{stats();}catch(e){}; return data;
      });
    }
    return fullIndexPromise2041;
  }
  async function ensureManifest2041(){
    if(!manifestPromise2041){manifestPromise2041=fetch(MANIFEST_URL_2041+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({}));}
    return manifestPromise2041;
  }
  async function ensureLessonDetail2041(id){
    const grammar=await ensureFullGrammar2041(false);
    const idx=grammar.findIndex(l=>String(l.id)===String(id)||String(l.lesson_number)===String(id));
    if(idx<0)return null;
    const cur=grammar[idx];
    if(cur && cur.__detailLoaded && Array.isArray(cur.examples)) return cur;
    const manifest=await ensureManifest2041();
    const fname=manifest[String(cur.id)]||manifest[String(id)];
    if(!fname) return cur;
    try{
      const list=await fetch(fname+'?v=20.41&t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():[]);
      const full=arr(list).find(l=>String(l.id)===String(cur.id));
      if(full){
        const merged={...cur,...full,__detailLoaded:true}; grammar[idx]=merged; window.GRAMMAR=grammar; try{GRAMMAR=grammar; currentLesson=merged;}catch(e){} return merged;
      }
    }catch(e){}
    return cur;
  }
  async function ensureRoutes2041(){
    if(Array.isArray(window.LEARNING_ROUTES)&&window.LEARNING_ROUTES.length)return window.LEARNING_ROUTES;
    try{if(typeof LEARNING_ROUTES!=='undefined'&&Array.isArray(LEARNING_ROUTES)){window.LEARNING_ROUTES=LEARNING_ROUTES;return LEARNING_ROUTES;}}catch(e){}
    if(!routePromise2041){routePromise2041=loadScriptOnce2041(ROUTE_URL_2041).then(()=>{try{if(!window.LEARNING_ROUTES&&typeof LEARNING_ROUTES!=='undefined')window.LEARNING_ROUTES=LEARNING_ROUTES;}catch(e){}; return window.LEARNING_ROUTES||[];});}
    return routePromise2041;
  }
  async function ensureTerms2041(){
    if(Array.isArray(window.TERMINOLOGY_GLOSSARY)&&window.TERMINOLOGY_GLOSSARY.length)return window.TERMINOLOGY_GLOSSARY;
    try{if(typeof TERMINOLOGY_GLOSSARY!=='undefined'&&Array.isArray(TERMINOLOGY_GLOSSARY)){window.TERMINOLOGY_GLOSSARY=TERMINOLOGY_GLOSSARY;return TERMINOLOGY_GLOSSARY;}}catch(e){}
    if(!termPromise2041){termPromise2041=loadScriptOnce2041(TERM_URL_2041).then(()=>{try{if(!window.TERMINOLOGY_GLOSSARY&&typeof TERMINOLOGY_GLOSSARY!=='undefined')window.TERMINOLOGY_GLOSSARY=TERMINOLOGY_GLOSSARY;}catch(e){}; return window.TERMINOLOGY_GLOSSARY||[];}).catch(()=>[]);}
    return termPromise2041;
  }

  function unwrap2041(el){if(el&&el.parentNode)el.parentNode.replaceChild(document.createTextNode(el.textContent||''),el)}
  function cleanupBadUI2041(root=document){
    setIdentity2041();
    // Disable old IPA annotators and remove visible/clickable IPA wrappers outside glossary data.
    try{ if(window.__paliIPA145){window.__paliIPA145.annotateIPA145=function(){};window.__paliIPA145.annotateVisibleIPA145=function(){}}; if(window.__paliIPA149){window.__paliIPA149.annotate149=function(){};window.__paliIPA149.annotateVisible149=function(){}}; }catch(e){}
    root.querySelectorAll('.ipa-hover').forEach(unwrap2041);
    root.querySelectorAll('.ipa-touch-popover,.ipa-popover,.ipa-mobile-popover,.term-popover-185,.term-popover-187,.term-popover-2019,.vocab-lookup-panel-187').forEach(x=>x.remove());
    // Remove old inline term links in lesson body; keep only our core term chips and glossary UI.
    const keep='.core-term-box-2041,#termGlossaryList,.term-card,.term-table,.term-chip-row-2041,.hero-subnav,#routeTabs,.route-lesson-list,.button-row';
    root.querySelectorAll('.term-once-link-185,.term-once-link-172,.term-first-link-2019,.term-direct-link,.concept-inline-link,.concept-extra-link,[data-term-card-185],[data-term-first-2019],[data-concept],[data-concept-extra]').forEach(el=>{if(!el.closest(keep))unwrap2041(el)});
    root.querySelectorAll('.linked-buddhist-box,.linked-background-box,.linked-academic-box').forEach(x=>x.remove());
    [...root.querySelectorAll('div,section,aside')].forEach(el=>{const t=(el.textContent||'').trim(); if(/^相关佛典阅读句式|^相关佛典阅读|^相关佛典背景|^相关学术训练/.test(t))el.remove();});
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){return /(点击查看\s*IPA|点击查观察\s*IPA|悬停查看|英文术语下方虚线)/i.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
    const nodes=[]; while(walker.nextNode())nodes.push(walker.currentNode); nodes.forEach(n=>{n.nodeValue=n.nodeValue.replace(/点击查看\s*IPA|点击查观察\s*IPA|悬停查看/ig,'').replace(/英文术语下方虚线[^。]*。?/g,'');});
  }

  const STOP2041=new Set('a an and or the to from of in on with by for as is are be was were case nominative accusative instrumental dative ablative genitive locative vocative gender number singular plural masculine feminine neuter root stem ending suffix prefix voice tense mood syntax grammar lesson module route search json html data true false null undefined inf infinitive ger gerund absolutive pr pp participle present past future passive active middle indicative imperative optative causative sandhi ipa pali learning lab sg pl nom acc ins dat abl gen loc voc prs indic act mid pass m f n id cn en note table cards examples'.split(' '));
  function normTok2041(w){return String(w||'').replace(/^[^A-Za-zĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ√]+|[^A-Za-zĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ]+$/g,'')}
  function addTok2041(str,map,score=1,strict=false){
    String(str||'').replace(/[A-Za-zĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ√][A-Za-zĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ√\.\-]*/g,m=>{
      const w=normTok2041(m); const lw=w.toLowerCase().replace(/\.$/,''); if(!w||w.length<2||STOP2041.has(lw)||/\d/.test(w))return '';
      const likely=strict||/[ĀĪŪāīūṄṅÑñṬṭḌḍṆṇḶḷṂṃṀṁ]/.test(w)||/^(Buddh|Dhamm|Saṅgh|Bhikkh|Ahaṃ|Tvaṃ|Mayaṃ|Tumhe|Te|So|Taṃ|Eta|Yo|Yadā|Tadā|Evaṃ|Ekaṃ|Bhagav|gacch|dese|suṇ|vand|vas|vihar|kar|hoti|atthi|natthi|dhamma|buddha|saṅgha|saraṇa|citta|phala|rūpa|paññ|suta|gata|kata|kamma|dukkha|anicc|anatt|vihār|samay|labh|kātu|gantu|sutv|gantv|puris|itth)/i.test(w);
      if(likely) map[w]=(map[w]||0)+score; return '';
    });
  }
  function vocab2041(lesson){
    const map={};
    arr(lesson.examples).forEach(ex=>{addTok2041(ex.pali,map,10,true);addTok2041(ex.source,map,8,true);addTok2041(ex.formula,map,6,true);addTok2041(ex.note,map,2,false);addTok2041(ex.grammar_note,map,2,false)});
    arr(lesson.table).forEach(row=>arr(row).forEach(c=>addTok2041(c,map,2,false)));
    arr(lesson.cards).forEach(c=>{addTok2041(c.q,map,1,false);addTok2041(c.a,map,1,false)});
    [lesson.title,lesson.summary,...arr(lesson.explanation),...arr(lesson.minimal_mastery)].forEach(s=>addTok2041(s,map,1,false));
    return Object.entries(map).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,28).map(x=>x[0]);
  }
  function terms2041(lesson){
    const text=[lesson.title,lesson.category,lesson.module,lesson.summary,...arr(lesson.minimal_mastery),...arr(lesson.learning_goals),...arr(lesson.common_mistakes),...arr(lesson.explanation)].join(' ');
    const seeds=['格','主格','宾格','工具格','与格','从格','属格','处格','呼格','变格','变位','词根','词干','词尾','限定动词','动词','现在时','将来时','过去时','命令语气','祈愿语气','主动语态','中间语态','被动语态','不定式','连续体','分词','过去分词','未来被动分词','不变词','否定','并列','选择','引语','句法','主语','宾语','sandhi','连读音变','复合词','佛典公式句'];
    return [...new Set(seeds.filter(s=>text.includes(s)).concat(arr(lesson.linked_terminology||[]),arr(lesson.related_terms||[])))].slice(0,16);
  }
  function insertionPoint2041(){return [...document.querySelectorAll('#lessonView h3')].find(h=>/重点说明|形式与结构|例句/.test(h.textContent||''))||byId('lessonExplanation')||byId('lessonTable')}
  function renderLessonExtras2041(lesson){
    const root=byId('lessonView'); if(!root||!lesson)return;
    root.querySelectorAll('#lessonConcepts2040,#lessonConcepts2041,#lessonVocab2040,#lessonVocab2041,.lesson-term-box-185,.lesson-vocab-box-181,.lesson-vocab-box-183,.lesson-vocab-box-184,.lesson-vocab-box-185,.core-term-box-2040').forEach(x=>x.remove());
    const point=insertionPoint2041(); const parent=point?.parentNode||root.querySelector('.card')||root;
    const termList=terms2041(lesson);
    if(termList.length){const b=document.createElement('section'); b.id='lessonConcepts2041'; b.className='core-term-box-2041'; b.innerHTML=`<h3 class="lesson-section-title">核心概念与相关术语</h3><div class="term-chip-row-2041">${termList.map(t=>`<button type="button" class="term-chip-2041" data-term-jump-2041="${esc(t)}">${esc(t)}</button>`).join('')}</div><p class="muted">点击术语可直接进入术语库对应内容。</p>`; parent.insertBefore(b,point||null);}
    const voc=vocab2041(lesson); const v=document.createElement('section'); v.id='lessonVocab2041'; v.className='lesson-vocab-2041'; v.innerHTML=`<h3 class="lesson-section-title">本节单词</h3>${voc.length?`<div class="vocab-chip-row-2041">${voc.map(w=>`<span class="vocab-chip-plain">${esc(w)}</span>`).join('')}</div><p class="muted">本词表为自动提取，主要来自本课例句、表格和说明；不提供本节词汇查询功能。</p>`:`<p class="muted">本课暂未检出明确巴利语词形；请以例句和表格为准。</p>`}`; parent.insertBefore(v,point||null);
    cleanupBadUI2041(root);
  }
  async function polishCurrentLesson2041(){let lesson=null; try{lesson=currentLesson||null}catch(e){}; if(!lesson)return; const full=await ensureLessonDetail2041(lesson.id||lesson.lesson_number); renderLessonExtras2041(full||lesson);}

  function routeBtn2041(id,grammar){const l=arr(grammar).find(x=>String(x.id)===String(id)||String(x.lesson_number)===String(id)); return l?`<button type="button" class="route-lesson-btn" data-route-lesson-2041="${esc(l.id)}">${esc(l.lesson_number||l.id)}. ${esc(l.title||'语法点')}</button>`:`<span class="route-missing-2041">语法点 ${esc(id)} 未找到</span>`;}
  async function renderRoutes2041(active){
    const content=byId('routeContent'); if(!content)return; content.innerHTML='<p class="muted">正在加载学习路线……</p>';
    const [routes,grammar]=await Promise.all([ensureRoutes2041(),ensureFullGrammar2041(true)]);
    if(!routes.length){content.innerHTML='<p class="muted">暂无学习路线。</p>';return;}
    active=active||window.__activeRoute2041||routes[0].id; if(!routes.some(r=>r.id===active))active=routes[0].id; window.__activeRoute2041=active;
    const tabs=byId('routeTabs'); if(tabs)tabs.innerHTML=routes.map(r=>`<button type="button" class="route-tab ${r.id===active?'active':''}" data-route-tab-2041="${esc(r.id)}">${esc(r.title||r.id)}</button>`).join('');
    const route=routes.find(r=>r.id===active)||routes[0];
    content.innerHTML=`<div class="route-full-card"><h3>${esc(route.title||'学习路线')}</h3><p class="muted">${esc(route.desc||'')}</p>${arr(route.steps).map((s,i)=>`<div class="route-step-card"><div class="route-step-number">${i+1}</div><div class="route-step-main"><h4>${esc(s.title||'')}</h4><p>${esc(s.desc||'')}</p><div class="route-lesson-list">${arr(s.lesson_ids).map(id=>routeBtn2041(id,grammar)).join('')}</div>${s.sentence_priority?`<button type="button" class="route-sentence-btn" data-sentence-priority="${esc(s.sentence_priority)}">进入句子分析：${esc(s.sentence_priority)}</button>`:''}</div></div>`).join('')}</div>`;
    cleanupBadUI2041(content);
  }
  async function openRoutes2041(active='zero'){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden')); byId('learningRouteView')?.classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'}); await renderRoutes2041(active);}
  async function goTerm2041(term){term=String(term||'').trim(); await ensureTerms2041(); document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden')); byId('terminologyGlossaryView')?.classList.remove('hidden'); try{if(typeof renderTermCategories==='function')renderTermCategories();}catch(e){}; setTimeout(()=>{const input=byId('termSearchInput'); if(input){input.value=term; input.dispatchEvent(new Event('input',{bubbles:true}));} try{if(typeof renderTerminologyGlossary==='function')renderTerminologyGlossary(); if(typeof renderTerms==='function')renderTerms();}catch(e){}; setTimeout(()=>{const first=document.querySelector('#termGlossaryList details,#termGlossaryList .term-card,#termGlossaryList tr:nth-child(2)'); if(first){if(first.tagName==='DETAILS')first.open=true; first.scrollIntoView({behavior:'smooth',block:'center'});}},180);},120);}

  const oldOpenLesson2041=window.openLesson;
  if(typeof oldOpenLesson2041==='function'&&!oldOpenLesson2041.__patched2041){window.openLesson=function(id){const r=oldOpenLesson2041.apply(this,arguments); setTimeout(polishCurrentLesson2041,120); setTimeout(polishCurrentLesson2041,500); return r;}; window.openLesson.__patched2041=true;}
  window.renderLearningRoutes=renderRoutes2041; window.__paliRenderLearningRoutes2041=renderRoutes2041; window.__paliFinal2041={ensureFullGrammar2041,ensureLessonDetail2041,renderRoutes2041,openRoutes2041,polishCurrentLesson2041,cleanupBadUI2041};

  document.addEventListener('click',function(e){
    const lr=e.target.closest('[data-action="learningRoute"]'); if(lr){e.preventDefault(); e.stopImmediatePropagation(); openRoutes2041('zero'); return;}
    const tab=e.target.closest('[data-route-tab-2041]'); if(tab){e.preventDefault(); e.stopImmediatePropagation(); renderRoutes2041(tab.dataset.routeTab2041); return;}
    const routeLesson=e.target.closest('[data-route-lesson-2041], .route-lesson-btn[data-route-lesson]'); if(routeLesson){e.preventDefault(); e.stopImmediatePropagation(); const id=routeLesson.dataset.routeLesson2041||routeLesson.dataset.routeLesson; ensureFullGrammar2041(true).then(()=>{if(typeof openLesson==='function')openLesson(id)}); return;}
    const term=e.target.closest('[data-term-jump-2041],[data-term-jump-2040],[data-term-jump]'); if(term){e.preventDefault(); e.stopImmediatePropagation(); goTerm2041(term.dataset.termJump2041||term.dataset.termJump2040||term.dataset.termJump||term.textContent); return;}
    setTimeout(()=>{cleanupBadUI2041(document.querySelector('.view:not(.hidden)')||document); if(!byId('lessonView')?.classList.contains('hidden'))polishCurrentLesson2041();},160);
  },true);

  function boot(){setIdentity2041(); cleanupBadUI2041(document); ensureFullGrammar2041(false).catch(()=>{}); setTimeout(()=>cleanupBadUI2041(document),400); setTimeout(()=>cleanupBadUI2041(document),1200);}
  window.addEventListener('DOMContentLoaded',boot); window.addEventListener('load',boot);
  const mo=new MutationObserver(()=>{clearTimeout(window.__paliCleanTimer2041); window.__paliCleanTimer2041=setTimeout(()=>cleanupBadUI2041(document.querySelector('.view:not(.hidden)')||document),80);});
  window.addEventListener('DOMContentLoaded',()=>{try{mo.observe(document.body,{childList:true,subtree:true});}catch(e){}});
  setInterval(()=>{setIdentity2041(); cleanupBadUI2041(document.querySelector('.view:not(.hidden)')||document);},1500);
})();
