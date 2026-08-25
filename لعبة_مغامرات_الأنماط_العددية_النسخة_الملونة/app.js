(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const arDigits = '٠١٢٣٤٥٦٧٨٩';
  const toAr = n => String(n).replace(/\d/g, d => arDigits[d]);
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const shuffle = a => [...a].sort(()=>Math.random()-.5);

  const stages = [
    {id:1, rule:1,  start:2,  title:'خطوات صغيرة', char:'boy'},
    {id:2, rule:-1, start:12, title:'عودة للخلف', char:'girl'},
    {id:3, rule:2,  start:4,  title:'قفزتان معًا', char:'boy'},
    {id:4, rule:-2, start:20, title:'نقصان منتظم', char:'girl'},
    {id:5, rule:3,  start:3,  title:'مغامرة الثلاثات', char:'boy'},
    {id:6, rule:-3, start:27, title:'تحدي الرجوع', char:'girl'},
    {id:7, rule:5,  start:10, title:'نجوم الخمسات', char:'boy'},
    {id:8, rule:-5, start:40, title:'طريق الخمسات', char:'girl'},
    {id:9, rule:10, start:20, title:'قفزات العشرات', char:'boy'},
    {id:10,rule:-10,start:90, title:'عودة بالعشرات', char:'girl'},
    {id:11,rule:4,  start:8,  title:'تحدي الأربعات', char:'boy'},
    {id:12,rule:-4, start:48, title:'خبير الأنماط', char:'girl'}
  ];
  const STORE='patterns-adventure-v3';
  const state = Object.assign({points:0,coins:0,stars:0,maxUnlocked:1,stageStars:{},sound:true}, load());
  let currentStage=null,current=0,round=0,hearts=3,locked=false,stageErrors=0;
  const rounds=6;

  function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
  function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}}
  function show(id){$$('.screen').forEach(s=>s.classList.remove('active'));$('#'+id).classList.add('active');if(id==='stages') renderStages();updateStats();window.scrollTo({top:0,behavior:'smooth'});}
  function updateStats(){
    $('#globalPoints').textContent=toAr(state.points);$('#globalCoins').textContent=toAr(state.coins);$('#globalStars').textContent=toAr(state.stars);
    if($('#points')) $('#points').textContent=toAr(state.points); if($('#stars')) $('#stars').textContent=toAr(state.stars);
  }
  function renderStages(){
    const grid=$('#stageGrid');grid.innerHTML='';
    stages.forEach(s=>{
      const lockedStage=s.id>state.maxUnlocked;
      const stars=Number(state.stageStars[s.id]||0);
      const card=document.createElement('button');card.type='button';card.className='stage-card'+(lockedStage?' locked':'');card.disabled=lockedStage;
      card.innerHTML=`<span class="stage-num">${toAr(s.id)}</span><h3>${s.title}</h3><div class="rule-pill">القاعدة: ${ruleText(s.rule)}</div><div class="stars-row">${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}</div><img src="assets/${s.char}.png" alt="${s.char==='boy'?'طالب':'طالبة'} يقفز في المرحلة">${lockedStage?'<span class="lock">🔒</span>':''}`;
      card.addEventListener('click',()=>startStage(s.id));grid.appendChild(card);
    });
  }
  function ruleText(r){return `${r>0?'+':'−'}${toAr(Math.abs(r))}`}
  function startStage(id){
    currentStage=stages.find(s=>s.id===id)||stages[0];current=currentStage.start;round=0;hearts=3;stageErrors=0;locked=false;
    $('#actorImg').src=`assets/${currentStage.char}.png`;$('#modalChar').src=`assets/${currentStage.char}.png`;
    $('#levelLabel').textContent=`المستوى ${toAr(currentStage.id)}`;$('#ruleTitle').textContent=`القاعدة: ${ruleText(currentStage.rule)}`;
    updateHearts();$('#feedback').textContent='';$('#feedback').className='feedback';$('#progressBar').style.width='0%';
    show('game');nextRound(true);
  }
  function nextRound(initial=false){
    locked=false;const correct=current+currentStage.rule;
    $('#mission').textContent=`ابدأ من ${toAr(current)}، ثم ${currentStage.rule>0?'أضف':'اطرح'} ${toAr(Math.abs(currentStage.rule))} واقفز إلى العدد الصحيح.`;
    const choices=makeChoices(correct);const pads=$('#pads');pads.innerHTML='';
    choices.forEach(n=>{
      const b=document.createElement('button');b.type='button';b.className='pad-btn';b.setAttribute('aria-label',`العدد ${toAr(n)}`);b.innerHTML=`<span class="lily">${toAr(n)}</span>`;b.addEventListener('click',()=>choose(b,n,correct));pads.appendChild(b);
    });
    if(!initial){const actor=$('#actor');actor.classList.remove('jump');void actor.offsetWidth;}
  }
  function makeChoices(correct){
    const step=Math.abs(currentStage.rule);const set=new Set([correct]);
    const pool=[correct+step,correct-step,correct+1,correct-1,correct+step*2,correct-step*2,current+step,current-step];
    shuffle(pool).forEach(n=>{if(n>=0&&set.size<4)set.add(n)});
    while(set.size<4)set.add(Math.max(0,correct+Math.floor(Math.random()*11)-5));
    return shuffle([...set].slice(0,4));
  }
  function choose(btn,n,correct){
    if(locked)return;locked=true;
    if(n===correct){
      btn.classList.add('correct');state.points+=10;state.coins+=1;current=correct;round+=1;
      $('#feedback').textContent='أحسنت! قفزة صحيحة +١٠ نقاط ⭐';$('#feedback').className='feedback good';
      jumpActor(btn);starBurst(btn);tone(true);updateStats();save();$('#progressBar').style.width=`${round/rounds*100}%`;
      if(round>=rounds)setTimeout(winStage,850);else setTimeout(()=>nextRound(),720);
    } else {
      btn.classList.add('wrong');state.points=Math.max(0,state.points-5);hearts-=1;stageErrors+=1;updateHearts();tone(false);updateStats();save();
      $('#feedback').textContent='جرّب مرة أخرى؛ القفزة الخاطئة تخصم ٥ نقاط ومحاولة.';$('#feedback').className='feedback bad';
      const actor=$('#actor');actor.classList.remove('shake');void actor.offsetWidth;actor.classList.add('shake');
      setTimeout(()=>btn.classList.remove('wrong'),420);
      if(hearts<=0)setTimeout(failStage,550);else setTimeout(()=>locked=false,430);
    }
  }
  function updateHearts(){$('#hearts').textContent='❤️'.repeat(hearts)+'🤍'.repeat(3-hearts)}
  function jumpActor(btn){
    const actor=$('#actor'), zone=$('#waterZone'),zr=zone.getBoundingClientRect(),br=btn.getBoundingClientRect();
    const x=clamp(((br.left+br.width/2-zr.left)/zr.width)*100,10,90);actor.style.left=x+'%';actor.classList.remove('jump');void actor.offsetWidth;actor.classList.add('jump');
  }
  function starBurst(btn){
    const fx=$('#sparkles'),zone=$('#waterZone'),zr=zone.getBoundingClientRect(),br=btn.getBoundingClientRect();
    const x=br.left+br.width/2-zr.left,y=br.top-zr.top+25;
    for(let i=0;i<14;i++){
      const s=document.createElement('span');s.className='flying-star';s.textContent=i%4===0?'✨':'⭐';s.style.left=x+'px';s.style.top=y+'px';
      s.style.setProperty('--dx',`${Math.floor(Math.random()*320-160)}px`);s.style.setProperty('--dy',`${-90-Math.random()*260}px`);fx.appendChild(s);setTimeout(()=>s.remove(),1300);
    }
  }
  function winStage(){
    const earned=stageErrors===0?3:stageErrors<=2?2:1;const prev=Number(state.stageStars[currentStage.id]||0);const extra=Math.max(0,earned-prev);
    state.stageStars[currentStage.id]=Math.max(prev,earned);state.stars+=extra;state.coins+=earned*3;state.points+=earned*15;
    if(currentStage.id<stages.length)state.maxUnlocked=Math.max(state.maxUnlocked,currentStage.id+1);save();updateStats();
    $('#modalTitle').textContent='رائع! أكملت النمط!';$('#modalText').textContent=`أنهيت المستوى ${toAr(currentStage.id)} وحصلت على ${toAr(earned)} نجوم ومكافأة إضافية.`;$('#earnedStars').textContent='⭐'.repeat(earned)+'☆'.repeat(3-earned);$('#nextStageBtn').style.display=currentStage.id<stages.length?'inline-block':'none';
    modalStars();$('#modal').classList.remove('hidden');
  }
  function failStage(){
    $('#modalTitle').textContent='مغامر الرياضيات لا يستسلم!';$('#modalText').textContent='انتهت المحاولات. استخدم التلميح وفكر في مقدار الزيادة أو النقصان ثم جرّب من جديد.';$('#earnedStars').textContent='☆☆☆';$('#nextStageBtn').style.display='none';$('#modal').classList.remove('hidden');
  }
  function modalStars(){
    const fx=$('#modalStarsFx');fx.innerHTML='';for(let i=0;i<22;i++){const s=document.createElement('span');s.className='flying-star';s.textContent='⭐';s.style.left=(10+Math.random()*80)+'%';s.style.top=(55+Math.random()*35)+'%';s.style.setProperty('--dx',`${Math.random()*220-110}px`);s.style.setProperty('--dy',`${-120-Math.random()*250}px`);fx.appendChild(s)}
  }
  function hint(){
    const correct=current+currentStage.rule;$('#feedback').textContent=`💡 ${toAr(current)} ${currentStage.rule>0?'+':'−'} ${toAr(Math.abs(currentStage.rule))} = ؟  فكر في الناتج ثم اختر ورقة الزنبق.`;$('#feedback').className='feedback good';tone(true,440);
  }
  function tone(good,freq){if(!state.sound)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=freq||(good?680:190);g.gain.value=.0001;const t=c.currentTime;g.gain.exponentialRampToValueAtTime(.11,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.22);o.start(t);o.stop(t+.24)}catch{}}
  function toggleSound(){state.sound=!state.sound;$('#soundHomeBtn').textContent=state.sound?'🔊 المؤثرات':'🔇 المؤثرات';save()}

  $('#playBtn').addEventListener('click',()=>startStage(Math.min(state.maxUnlocked,stages.length)));
  $('#stageBtn').addEventListener('click',()=>show('stages'));$('#howBtn').addEventListener('click',()=>$('#helpModal').classList.remove('hidden'));$('#soundHomeBtn').addEventListener('click',toggleSound);
  $$('.homeBack').forEach(b=>b.addEventListener('click',()=>show('home')));$('#backStages').addEventListener('click',()=>show('stages'));$('#hintBtn').addEventListener('click',hint);$('#restartBtn').addEventListener('click',()=>startStage(currentStage.id));
  $('#closeHelp').addEventListener('click',()=>$('#helpModal').classList.add('hidden'));$('#helpModal').addEventListener('click',e=>{if(e.target===$('#helpModal'))$('#helpModal').classList.add('hidden')});
  $('#replayBtn').addEventListener('click',()=>{$('#modal').classList.add('hidden');startStage(currentStage.id)});$('#modalStagesBtn').addEventListener('click',()=>{$('#modal').classList.add('hidden');show('stages')});$('#nextStageBtn').addEventListener('click',()=>{$('#modal').classList.add('hidden');startStage(Math.min(stages.length,currentStage.id+1))});
  $('#soundHomeBtn').textContent=state.sound?'🔊 المؤثرات':'🔇 المؤثرات';
  if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
  updateStats();
})();
