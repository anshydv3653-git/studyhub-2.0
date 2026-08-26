// ===================== SUPABASE CONFIG =====================
const SUPABASE_URL = "https://qijdyaorbvbvuumzdxdu.supabase.co";
const SUPABASE_KEY = "sb_publishable_jRJUeUmDJ9CMONA75QCCCQ_2aCizXnE";
let sb = null;
try { sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch(e) { console.error('Supabase init error', e); }

// ===================== STATE =====================
let currentClass = null, currentSubject = null, currentChapter = null;
let currentUser = null, currentProfile = null;
let chatChannel = null;

// ===================== NAV / SCROLL =====================
const nav = document.getElementById('nav');
const prog = document.getElementById('progress');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  prog.style.width = (h > 0 ? (y/h)*100 : 0) + '%';
  nav.classList.toggle('scrolled', y > 20);
}, {passive:true});

document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// ===================== NAVIGATION =====================
function navigate(page, data) {
  // Protected pages
  if ((page === 'dashboard' || page === 'chat') && !currentUser) {
    showAuthOverlay();
    return;
  }
  // Untrack presence when leaving chat
  if (page !== 'chat' && chatChannel) {
    chatChannel.untrack();
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  document.getElementById('navLinks').classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});

  if (page === 'home') loadHome();
  if (page === 'chapters' && data) loadChapters(data);
  if (page === 'detail' && data) loadDetail(data);
  if (page === 'dashboard') loadDashboard();
  if (page === 'chat') initChat();
}

// ===================== TILT EFFECT =====================
function initTilt() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.tilt, .class-card, .subject-card, .chapter-item').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--rx', ((0.5-py)*6).toFixed(2)+'deg');
      card.style.setProperty('--ry', ((px-0.5)*8).toFixed(2)+'deg');
      card.style.setProperty('--gx', (px*100).toFixed(1)+'%');
      card.style.setProperty('--gy', (py*100).toFixed(1)+'%');
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx','0deg');
      card.style.setProperty('--ry','0deg');
    });
  });
}

// ===================== HOME PAGE =====================
async function loadHome() {
  const grid = document.getElementById('homeSubjects');
  if (!sb) { grid.innerHTML = '<div class="empty"><div class="em-icon">⚠️</div><p>Supabase not connected</p></div>'; return; }
  try {
    const { data: classes, error: classErr } = await sb.from('classes').select('*');
    if (classErr) throw classErr;
    let class10 = null;
    if (classes) {
      class10 = classes.find(c => { const n = (c.name||'').toLowerCase(); return n.includes('10') || n === 'class 10'; });
    }
    if (!class10) { grid.innerHTML = '<div class="empty"><div class="em-icon">📭</div><p>Class 10 not found in database.</p></div>'; return; }

    const { data: subjects, error: subErr } = await sb.from('subject').select('*').eq('class_id', class10.id).order('name');
    if (subErr) throw subErr;
    if (!subjects || !subjects.length) { grid.innerHTML = '<div class="empty"><div class="em-icon">📭</div><p>No subjects found for Class 10 yet.</p></div>'; return; }

    const icons = {mathematics:'📐',maths:'📐',math:'📐',science:'🔬',english:'📖',hindi:'📝','social science':'🌍',sst:'🌍','social studies':'🌍',physics:'⚛️',chemistry:'🧪',biology:'🧬',computer:'💻',sanskrit:'📜',history:'🏛️',geography:'🗺️',civics:'⚖️',economics:'📊'};
    const gradients = ['linear-gradient(135deg,#f43f5e,#e11d48)','linear-gradient(135deg,#8b5cf6,#6d28d9)','linear-gradient(135deg,#0ea5e9,#0284c7)','linear-gradient(135deg,#f59e0b,#d97706)','linear-gradient(135deg,#10b981,#059669)','linear-gradient(135deg,#ec4899,#db2777)','linear-gradient(135deg,#6366f1,#4f46e5)','linear-gradient(135deg,#14b8a6,#0d9488)'];
    const cn = class10.name, ci = class10.id;

    grid.innerHTML = subjects.map((s, i) => {
      const icon = icons[s.name.toLowerCase()] || '📘';
      return `<div class="subject-card" onclick="navigate('chapters',{subjectId:${s.id},subjectName:'${esc(s.name)}',className:'${esc(cn)}',classId:${ci}})"><div class="sc-top" style="background:${gradients[i%8]}"><span class="sc-icon">${icon}</span></div><div class="sc-body"><h3>${s.name}</h3><div class="sc-arrow"><span>View Chapters</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div></div></div>`;
    }).join('')
    // Extra external link cards (Class 10 only)
    + `<a class="subject-card" href="https://physicswallahx.vercel.app/batch/67790151518b938bc630052d" target="_blank" rel="noopener noreferrer"><div class="sc-top" style="background:linear-gradient(135deg,#6366f1,#4f46e5)"><span class="sc-icon">🎥</span></div><div class="sc-body"><h3>PW Udaan Batch Free</h3><div class="sc-arrow"><span>Open Lectures</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg></div></div></a>`
    + `<a class="subject-card" href="https://vidyaverse-nt.vercel.app/course/176" target="_blank" rel="noopener noreferrer"><div class="sc-top" style="background:linear-gradient(135deg,#f59e0b,#d97706)"><span class="sc-icon">🏆</span></div><div class="sc-body"><h3>NextToppers</h3><div class="sc-arrow"><span>Open Course</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg></div></div></a>`;
  } catch(e) {
    console.error(e);
    grid.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>Error: ${e.message}</p></div>`;
  }
}

function esc(s) { return (s||'').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

// ===================== CHAPTERS =====================
async function loadChapters({subjectId, subjectName, className, classId}) {
  currentSubject = {id: subjectId, name: subjectName};
  currentClass = {id: classId, name: className};
  const list = document.getElementById('chapterList');
  document.getElementById('chapterCrumbs').innerHTML = `<a onclick="navigate('home')">Home</a><span class="sep">→</span><a onclick="navigate('home')">Class 10</a><span class="sep">→</span><span class="cur">${subjectName}</span>`;
  document.getElementById('chapterTitle').textContent = subjectName;
  if (!sb) { list.innerHTML = '<div class="empty"><div class="em-icon">⚠️</div><p>Not connected</p></div>'; return; }
  try {
    const { data, error } = await sb.from('chapters').select('*').eq('subject_id', subjectId).order('id');
    if (error) throw error;
    if (!data || !data.length) { list.innerHTML = '<div class="empty"><div class="em-icon">📭</div><p>No chapters found</p></div>'; return; }
    list.innerHTML = data.map((ch, i) => `<div class="chapter-item" onclick="navigate('detail',{chapterId:${ch.id},chapterName:\`${ch.name.replace(/`/g,'\\`')}\`,subjectName:'${esc(subjectName)}',subjectId:${subjectId},className:'${esc(className)}',classId:${classId}})"><span class="ci-num">${i+1}</span><span class="ci-name">${ch.name}</span><span class="ci-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></div>`).join('');
    initTilt();
    // Load free lectures for this subject
    loadLectures(subjectId);
  } catch(e) { list.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>${e.message}</p></div>`; }
}

// ===================== FREE LECTURES SIDEBAR =====================
async function loadLectures(subjectId) {
  const sidebar = document.getElementById('lecturesSidebar');
  const list = document.getElementById('lecturesList');
  if (!sidebar || !list || !sb) return;

  try {
    const { data, error } = await sb.from('nexttopper_lecture_free').select('*').eq('subject_id', subjectId).order('id');
    if (error) throw error;

    if (!data || !data.length) {
      sidebar.style.display = 'none';
      return;
    }

    sidebar.style.display = 'block';
    list.innerHTML = data.map(lec => `<a class="lecture-item" href="${lec.link}" target="_blank" rel="noopener noreferrer">
      <span class="li-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
      <span class="li-title">${lec.title || 'Untitled Lecture'}</span>
      <svg class="li-ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
    </a>`).join('');
  } catch(e) {
    sidebar.style.display = 'none';
  }
}

// ===================== CHAPTER DETAIL =====================
async function loadDetail({chapterId, chapterName, subjectName, subjectId, className, classId}) {
  currentChapter = {id: chapterId, name: chapterName};
  currentSubject = {id: subjectId, name: subjectName};
  currentClass = {id: classId, name: className};
  document.getElementById('detailCrumbs').innerHTML = `<a onclick="navigate('home')">Home</a><span class="sep">→</span><a onclick="navigate('home')">Class 10</a><span class="sep">→</span><a onclick="navigate('chapters',{subjectId:${subjectId},subjectName:'${esc(subjectName)}',className:'${esc(className)}',classId:${classId}})">${subjectName}</a><span class="sep">→</span><span class="cur">${chapterName}</span>`;
  document.getElementById('detailTitle').textContent = chapterName;
  switchTab('notes');
  loadNotes(chapterId);
  loadPractice(chapterId);
  loadPYQs(chapterId);
  loadNCERT(chapterId);
  loadDiagrams(chapterId);
}

function switchTab(tab) {
  document.querySelectorAll('.ch-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
}

// ===================== PROGRESS TRACKING =====================
async function trackProgress(contentType, contentId, chapterId) {
  if (!currentUser || !sb) return;
  try {
    await sb.from('student_progress').upsert(
      { student_id: currentUser.id, content_type: contentType, content_id: contentId, chapter_id: chapterId },
      { onConflict: 'student_id,content_type,content_id' }
    );
  } catch(e) { /* silent */ }
}

// ===================== NOTES =====================
async function loadNotes(chapterId) {
  const panel = document.getElementById('panel-notes');
  panel.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading notes...</p></div>';
  if (!sb) { panel.innerHTML = '<div class="empty"><div class="em-icon">⚠️</div><p>Not connected</p></div>'; return; }
  try {
    const [notesRes, diagRes] = await Promise.all([
      sb.from('notes').select('*').eq('chapter_id', chapterId).order('id'),
      sb.from('diagrams').select('*').eq('chapter_id', chapterId)
    ]);
    if (notesRes.error) throw notesRes.error;
    const notes = notesRes.data || [], diagrams = diagRes.data || [];
    if (!notes.length) { panel.innerHTML = '<div class="empty"><div class="em-icon">📝</div><p>No notes available yet</p></div>'; return; }
    panel.innerHTML = notes.map((n, i) => `<div class="note-card"><div class="note-head" onclick="toggleNote(this,${n.id},${chapterId})"><span class="nh-num">${i+1}</span><span class="nh-title">${n.title || 'Note '+(i+1)}</span><svg class="nh-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div><div class="note-body"><div class="note-content">${n.fully_explained_notes || n.content || '<em>No content</em>'}</div>${diagrams.length ? `<div class="note-diagrams"><h4>Diagrams</h4><div class="diag-grid">${diagrams.map(d => `<div class="diag-card" onclick="openDiagram('${esc(d.title)}',\`${(d.svg_code||'').replace(/`/g,'\\`')}\`)">${d.svg_code||''}<p>${d.title||''}</p>${d.is_animated?'<span class="anim-badge">✨ Animated</span>':''}</div>`).join('')}</div></div>` : ''}</div></div>`).join('');
  } catch(e) { panel.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>${e.message}</p></div>`; }
}

let _openedNotes = new Set();
function toggleNote(head, noteId, chapterId) {
  head.classList.toggle('open');
  head.nextElementSibling.classList.toggle('open');
  if (head.classList.contains('open') && !_openedNotes.has(noteId)) {
    _openedNotes.add(noteId);
    trackProgress('notes', noteId, chapterId);
  }
}

// ===================== PRACTICE =====================
let quizState = { questions: [], idx: 0, score: 0, selected: null, answered: false };

async function loadPractice(chapterId) {
  const panel = document.getElementById('panel-practice');
  panel.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading questions...</p></div>';
  if (!sb) { panel.innerHTML = '<div class="empty"><div class="em-icon">⚠️</div><p>Not connected</p></div>'; return; }
  try {
    const { data, error } = await sb.from('questions').select('*').eq('chapter_id', chapterId).order('id');
    if (error) throw error;
    if (!data || !data.length) { panel.innerHTML = '<div class="empty"><div class="em-icon">❓</div><p>No practice questions yet</p></div>'; return; }
    quizState = { questions: data, idx: 0, score: 0, selected: null, answered: false, chapterId };
    renderQuiz(panel);
  } catch(e) { panel.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>${e.message}</p></div>`; }
}

function renderQuiz(panel) {
  const { questions, idx, score } = quizState;
  if (idx >= questions.length) {
    const pct = Math.round((score/questions.length)*100);
    panel.innerHTML = `<div class="quiz-wrap"><div class="quiz-card"><div class="quiz-result"><div class="qr-ring" style="--pct:${pct}%"><b>${score}/${questions.length}</b></div><h2 style="font-size:1.5rem;font-weight:800;margin:10px 0">${pct>=70?'🎉 Excellent!':pct>=40?'💪 Good effort!':'📚 Keep studying!'}</h2><p style="color:var(--muted);margin-bottom:20px">You scored ${pct}%</p><button class="btn btn-primary btn-sm" onclick="quizState.idx=0;quizState.score=0;renderQuiz(document.getElementById('panel-practice'))">Retake Quiz</button></div></div></div>`;
    return;
  }
  const q = questions[idx], opts = Array.isArray(q.options) ? q.options : [], progress = (idx/questions.length)*100;
  panel.innerHTML = `<div class="quiz-wrap"><div class="quiz-progress"><div class="qp-info"><span>Question ${idx+1} of ${questions.length}</span><span>Score: ${score}</span></div><div class="qp-bar"><div class="qp-fill" style="width:${progress}%"></div></div></div><div class="quiz-card"><p class="qq">${q.question}</p><div class="q-opts">${opts.map((o,i) => { const label = typeof o === 'string' ? o : (o.text||o.label||JSON.stringify(o)); return `<button class="q-opt" data-idx="${i}" data-val="${label.replace(/"/g,'&quot;')}" onclick="selectQuizOpt(this)"><span class="ol">${String.fromCharCode(65+i)}</span><span>${label}</span></button>`; }).join('')}</div><div class="quiz-fb" id="quizFb"></div><div class="quiz-actions"><button class="btn btn-primary btn-sm" id="quizCheck" onclick="checkQuizAnswer()">Check Answer</button><button class="btn btn-glass btn-sm" id="quizNext" style="display:none" onclick="nextQuizQuestion()">Next →</button></div></div></div>`;
}

function selectQuizOpt(btn) {
  if (quizState.answered) return;
  quizState.selected = btn.dataset.val;
  document.querySelectorAll('.q-opt').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

function checkQuizAnswer() {
  if (!quizState.selected) { const fb = document.getElementById('quizFb'); fb.className = 'quiz-fb show err'; fb.innerHTML = '<b>Please select an option</b>'; return; }
  quizState.answered = true;
  const q = quizState.questions[quizState.idx], correct = q.correct_answer, isCorrect = quizState.selected === correct;
  if (isCorrect) quizState.score++;
  trackProgress('questions', q.id, quizState.chapterId);
  document.querySelectorAll('.q-opt').forEach(b => { b.disabled = true; if (b.dataset.val === correct) b.classList.add('ok'); else if (b.classList.contains('sel')) b.classList.add('bad'); });
  const fb = document.getElementById('quizFb');
  fb.className = 'quiz-fb show ' + (isCorrect ? 'ok' : 'err');
  fb.innerHTML = `<b>${isCorrect?'✅ Correct!':'❌ Incorrect'}</b>${q.explanation?'<br>'+q.explanation:''}`;
  document.getElementById('quizCheck').style.display = 'none';
  document.getElementById('quizNext').style.display = '';
}

function nextQuizQuestion() { quizState.idx++; quizState.selected = null; quizState.answered = false; renderQuiz(document.getElementById('panel-practice')); }

// ===================== PYQS =====================
async function loadPYQs(chapterId) {
  const panel = document.getElementById('panel-pyqs');
  panel.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading PYQs...</p></div>';
  if (!sb) { panel.innerHTML = '<div class="empty"><div class="em-icon">⚠️</div><p>Not connected</p></div>'; return; }
  try {
    const { data, error } = await sb.from('pyqs').select('*').eq('chapter_id', chapterId).order('year', {ascending:false});
    if (error) throw error;
    if (!data || !data.length) { panel.innerHTML = '<div class="empty"><div class="em-icon">📋</div><p>No PYQs available yet</p></div>'; return; }
    const years = [...new Set(data.map(p => p.year).filter(Boolean))], boards = [...new Set(data.map(p => p.board_year).filter(Boolean))];
    panel.innerHTML = `<div class="filter-bar"><select id="pyqYear" onchange="filterPYQs()"><option value="all">All Years</option>${years.map(y => `<option value="${y}">${y}</option>`).join('')}</select><select id="pyqBoard" onchange="filterPYQs()"><option value="all">All Boards</option>${boards.map(b => `<option value="${b}">${b}</option>`).join('')}</select><span class="fcount" id="pyqCount">${data.length} questions</span></div><div id="pyqList">${renderPYQItems(data, chapterId)}</div>`;
    panel._data = data; panel._chId = chapterId;
  } catch(e) { panel.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>${e.message}</p></div>`; }
}

function renderPYQItems(items, chId) {
  return items.map(p => `<div class="acc-item"><div class="acc-head" onclick="toggleAcc(this,${p.id},${chId||0})"><div class="ah-tags">${p.year?`<span class="ah-tag year">${p.year}</span>`:''}${p.board_year?`<span class="ah-tag board">${p.board_year}</span>`:''}</div><span class="ah-q">${p.question}</span><svg class="ah-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div><div class="acc-body">${p.correct_answer?`<div class="acc-answer"><span class="label">Answer</span>${p.correct_answer}</div>`:'<p style="color:var(--muted);padding:12px 0">Answer not available</p>'}</div></div>`).join('');
}

function filterPYQs() {
  const panel = document.getElementById('panel-pyqs'), data = panel._data;
  const year = document.getElementById('pyqYear').value, board = document.getElementById('pyqBoard').value;
  const filtered = data.filter(p => { if (year!=='all' && p.year!=year) return false; if (board!=='all' && p.board_year!==board) return false; return true; });
  document.getElementById('pyqList').innerHTML = renderPYQItems(filtered, panel._chId);
  document.getElementById('pyqCount').textContent = filtered.length + ' questions';
}

// ===================== NCERT =====================
async function loadNCERT(chapterId) {
  const panel = document.getElementById('panel-ncert');
  panel.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading NCERT questions...</p></div>';
  if (!sb) { panel.innerHTML = '<div class="empty"><div class="em-icon">⚠️</div><p>Not connected</p></div>'; return; }
  try {
    const { data, error } = await sb.from('ncert_textbook_questions').select('*').eq('chapter_id', chapterId).order('section').order('question_number');
    if (error) throw error;
    if (!data || !data.length) { panel.innerHTML = '<div class="empty"><div class="em-icon">📚</div><p>No NCERT questions yet</p></div>'; return; }
    const sections = [...new Set(data.map(q => q.section).filter(Boolean))];
    panel.innerHTML = `${sections.length>1?`<div class="filter-bar"><select id="ncertSec" onchange="filterNCERT()"><option value="all">All Sections</option>${sections.map(s => `<option value="${s}">${s}</option>`).join('')}</select><span class="fcount" id="ncertCount">${data.length} questions</span></div>`:''}<div id="ncertList">${renderNCERTItems(data, chapterId)}</div>`;
    panel._data = data; panel._chId = chapterId;
  } catch(e) { panel.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>${e.message}</p></div>`; }
}

function renderNCERTItems(items, chId) {
  return items.map(q => `<div class="acc-item"><div class="acc-head" onclick="toggleAcc(this,${q.id},${chId||0},'ncert_textbook_questions')"><div class="ah-tags"><span class="ah-tag qnum">Q${q.question_number||'?'}</span>${q.section?`<span class="ah-tag sec">${q.section}</span>`:''}</div><span class="ah-q">${q.question}</span><svg class="ah-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div><div class="acc-body">${q.answer?`<div class="acc-answer"><span class="label">Answer</span>${q.answer}</div>`:'<p style="color:var(--muted);padding:12px 0">Answer not available</p>'}</div></div>`).join('');
}

function filterNCERT() {
  const panel = document.getElementById('panel-ncert'), data = panel._data, sec = document.getElementById('ncertSec').value;
  const filtered = sec === 'all' ? data : data.filter(q => q.section === sec);
  document.getElementById('ncertList').innerHTML = renderNCERTItems(filtered, panel._chId);
  document.getElementById('ncertCount').textContent = filtered.length + ' questions';
}

// ===================== DIAGRAMS =====================
async function loadDiagrams(chapterId) {
  const panel = document.getElementById('panel-diagrams');
  panel.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading diagrams...</p></div>';
  if (!sb) { panel.innerHTML = '<div class="empty"><div class="em-icon">⚠️</div><p>Not connected</p></div>'; return; }
  try {
    const { data, error } = await sb.from('diagrams').select('*').eq('chapter_id', chapterId).order('id');
    if (error) throw error;
    if (!data || !data.length) { panel.innerHTML = '<div class="empty"><div class="em-icon">🎨</div><p>No diagrams available yet</p></div>'; return; }
    panel.innerHTML = `<div class="diag-gallery">${data.map(d => `<div class="gallery-card" onclick="openDiagram('${esc(d.title)}',\`${(d.svg_code||'').replace(/`/g,'\\`')}\`);trackProgress('diagrams',${d.id},${chapterId})"><div class="gc-art">${d.svg_code||''}</div><div class="gc-body"><h4>${d.title||d.diagram_key||'Untitled'}</h4>${d.is_animated?'<span class="anim-badge">✨ Animated</span>':''}</div></div>`).join('')}</div>`;
  } catch(e) { panel.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>${e.message}</p></div>`; }
}

// ===================== ACCORDION =====================
let _openedAcc = new Set();
function toggleAcc(head, id, chId, type) {
  head.classList.toggle('open');
  head.nextElementSibling.classList.toggle('open');
  const key = (type||'pyqs') + '_' + id;
  if (head.classList.contains('open') && !_openedAcc.has(key)) {
    _openedAcc.add(key);
    if (id && chId) trackProgress(type || 'pyqs', id, chId);
  }
}

// ===================== DIAGRAM MODAL =====================
function openDiagram(title, svg) {
  document.getElementById('modalTitle').textContent = title || 'Diagram';
  document.getElementById('modalBody').innerHTML = svg || '';
  document.getElementById('modal').classList.add('show');
}
function closeModal(e) {
  if (e && e.target !== document.getElementById('modal')) return;
  document.getElementById('modal').classList.remove('show');
}

// ===================== AUTH SYSTEM =====================
function showAuthOverlay(mode) {
  const overlay = document.getElementById('authOverlay');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  switchAuthMode(mode || 'login');
}

function hideAuthOverlay() {
  document.getElementById('authOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

function switchAuthMode(mode) {
  const isSignup = mode === 'signup';
  const isOnboard = mode === 'onboard';
  document.getElementById('authLoginForm').style.display = (!isSignup && !isOnboard) ? 'flex' : 'none';
  document.getElementById('authSignupForm').style.display = (isSignup && !isOnboard) ? 'flex' : 'none';
  document.getElementById('authOnboardForm').style.display = isOnboard ? 'flex' : 'none';
  document.getElementById('authMsg').className = 'auth-msg';
  document.getElementById('authMsg').innerHTML = '';

  if (isOnboard) {
    document.getElementById('authTitle').textContent = 'Complete Your Profile';
    document.getElementById('authSubtitle').textContent = 'Just a couple of details so we can personalise your experience.';
    loadClassDropdown(); // Dynamically load classes from DB
  } else if (isSignup) {
    document.getElementById('authTitle').textContent = 'Welcome to StudyHub 2.0';
    document.getElementById('authSubtitle').textContent = 'Create your free account and start studying smarter!';
  } else {
    document.getElementById('authTitle').textContent = 'Welcome to StudyHub 2.0';
    document.getElementById('authSubtitle').textContent = 'Best of luck — score 100 out of 100 in your Boards 2027! 🎯';
  }
}

// Dynamically load classes from database into onboarding dropdown
async function loadClassDropdown() {
  const select = document.getElementById('onboardClass');
  if (!sb || !select) return;
  try {
    const { data, error } = await sb.from('classes').select('id, name').order('id');
    if (error || !data || !data.length) return; // Keep hardcoded fallback
    // Override with actual database data
    select.innerHTML = '<option value="">Select your class</option>';
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;  // Use actual DB id (1,2,3,4)
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  } catch(e) { /* silent — hardcoded values will work as fallback */ }
}

function showAuthMsg(text, type) {
  const msg = document.getElementById('authMsg');
  msg.className = 'auth-msg show ' + type;
  msg.innerHTML = text;
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showAuthMsg('Please fill in all fields.', 'err'); return; }
  if (!sb) { showAuthMsg('⚠️ Connection error.', 'err'); return; }
  try {
    showAuthMsg('⏳ Signing in...', 'ok');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Check if profile exists
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    if (!profile) {
      switchAuthMode('onboard');
    }
    // onAuthStateChange will handle the rest
  } catch(e) { showAuthMsg('❌ ' + e.message, 'err'); }
}

async function loginWithGoogle() {
  if (!sb) { showAuthMsg('⚠️ Connection error. Please refresh and try again.', 'err'); return; }
  try {
    showAuthMsg('⏳ Redirecting to Google...', 'ok');
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    // Browser will redirect to Google — no further code needed here
  } catch(e) { showAuthMsg('❌ Google sign-in failed: ' + e.message, 'err'); }
}

async function doSignup() {
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  if (!email || !password) { showAuthMsg('Please fill in all fields.', 'err'); return; }
  if (password.length < 6) { showAuthMsg('Password must be at least 6 characters.', 'err'); return; }
  if (!sb) { showAuthMsg('⚠️ Connection error.', 'err'); return; }
  try {
    showAuthMsg('⏳ Creating account...', 'ok');
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session) {
      switchAuthMode('onboard');
    } else {
      showAuthMsg('✅ Account created! Please check your email to confirm, then log in.', 'ok');
      setTimeout(() => switchAuthMode('login'), 2000);
    }
  } catch(e) { showAuthMsg('❌ ' + e.message, 'err'); }
}

async function doOnboard() {
  const name = document.getElementById('onboardName').value.trim();
  const classId = parseInt(document.getElementById('onboardClass').value);
  if (!name) { showAuthMsg('Please enter your name.', 'err'); return; }
  if (!classId) { showAuthMsg('Please select your class.', 'err'); return; }
  if (!sb || !currentUser) { showAuthMsg('⚠️ Session error.', 'err'); return; }
  try {
    showAuthMsg('⏳ Saving profile...', 'ok');
    const { error } = await sb.from('profiles').insert({ id: currentUser.id, name, class_id: classId });
    if (error) throw error;
    currentProfile = { id: currentUser.id, name, class_id: classId };
    hideAuthOverlay();
    updateNavbarForUser();
  } catch(e) { showAuthMsg('❌ ' + e.message, 'err'); }
}

async function logoutUser() {
  if (!sb) return;
  try {
    if (chatChannel) {
      chatChannel.untrack();
      sb.removeChannel(chatChannel);
      chatChannel = null;
    }
    onlineUsers = {};
    await sb.auth.signOut();
    currentUser = null; currentProfile = null;
    updateNavbarForUser();
    navigate('home');
    showAuthOverlay();
  } catch(e) { console.error('Logout error:', e); }
}

function updateNavbarForUser() {
  const menu = document.getElementById('userMenu');
  const loginBtn = document.getElementById('navLoginBtn');
  if (!currentUser || !currentProfile) {
    menu.style.display = 'none';
    if (loginBtn) loginBtn.style.display = '';
    return;
  }
  menu.style.display = 'flex';
  if (loginBtn) loginBtn.style.display = 'none';
  document.getElementById('userName').textContent = currentProfile.name;
  const avatarEl = document.getElementById('userAvatar');
  avatarEl.innerHTML = currentProfile.name.charAt(0).toUpperCase();
}

// Auth state listener
if (sb) {
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      currentUser = session.user;
      // Check profile
      const { data: profile } = await sb.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
      if (profile) {
        currentProfile = profile;
        hideAuthOverlay();
        updateNavbarForUser();
      } else {
        switchAuthMode('onboard');
      }
    } else if (event === 'SIGNED_OUT') {
      currentUser = null; currentProfile = null;
      updateNavbarForUser();
    }
  });

  // Check initial session
  sb.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      currentUser = session.user;
      const { data: profile } = await sb.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
      if (profile) {
        currentProfile = profile;
        updateNavbarForUser();
      } else {
        showAuthOverlay('onboard');
      }
    } else {
      showAuthOverlay('login');
    }
  });
}

// ===================== DASHBOARD =====================
async function loadDashboard() {
  const panel = document.getElementById('dashContent');
  if (!currentUser || !currentProfile) { panel.innerHTML = '<div class="empty"><p>Please log in to view your dashboard.</p></div>'; return; }
  panel.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading dashboard...</p></div>';

  document.getElementById('dashName').textContent = currentProfile.name;

  // Show admin panel if founder
  if (isFounder()) {
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminPanel();
  } else {
    document.getElementById('adminPanel').style.display = 'none';
  }

  try {
    const { data: progress, error } = await sb.from('student_progress')
      .select('*, chapters(name, subject:subject_id(name))')
      .eq('student_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const items = progress || [];
    // Stats
    const notes = items.filter(i => i.content_type === 'notes').length;
    const questions = items.filter(i => i.content_type === 'questions').length;
    const pyqs = items.filter(i => i.content_type === 'pyqs').length;
    const ncert = items.filter(i => i.content_type === 'ncert_textbook_questions').length;
    const diagrams = items.filter(i => i.content_type === 'diagrams').length;

    let html = `<div class="dash-grid">
      <div class="dash-stat"><div class="ds-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div><div class="ds-num">${notes}</div><div class="ds-label">Notes Read</div></div>
      <div class="dash-stat"><div class="ds-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></div><div class="ds-num">${questions}</div><div class="ds-label">Questions Attempted</div></div>
      <div class="dash-stat"><div class="ds-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></div><div class="ds-num">${pyqs}</div><div class="ds-label">PYQs Solved</div></div>
      <div class="dash-stat"><div class="ds-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div><div class="ds-num">${ncert}</div><div class="ds-label">NCERT Questions</div></div>
      <div class="dash-stat"><div class="ds-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></div><div class="ds-num">${diagrams}</div><div class="ds-label">Diagrams Viewed</div></div>
    </div>`;

    // Recent activity
    if (items.length) {
      html += '<div class="dash-section"><h3>Recent Activity</h3><div class="dash-list">';
      const recent = items.slice(0, 20);
      recent.forEach(item => {
        const chapterName = item.chapters?.name || 'Unknown Chapter';
        const subjectName = item.chapters?.subject?.name || '';
        const date = new Date(item.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
        html += `<div class="dash-item"><span class="di-type">${item.content_type.replace('_',' ')}</span><span class="di-name">${subjectName ? subjectName + ' — ' : ''}${chapterName}</span><span class="di-date">${date}</span></div>`;
      });
      html += '</div></div>';
    } else {
      html += '<div class="empty"><div class="em-icon">📊</div><p>No activity yet. Start studying to see your progress here!</p></div>';
    }

    panel.innerHTML = html;
  } catch(e) {
    panel.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>${e.message}</p></div>`;
  }
}

// ===================== ADMIN PANEL =====================
let allStudents = [];
let blockedIds = new Set();

async function loadAdminPanel() {
  if (!isFounder() || !sb) return;
  try {
    const { data: students, error: stuErr } = await sb.from('profiles').select('*, classes(name)').order('name');
    if (stuErr) throw stuErr;
    allStudents = students || [];

    const { data: blocked, error: blkErr } = await sb.from('blocked_users').select('*');
    if (blkErr) throw blkErr;
    blockedIds = new Set((blocked || []).map(b => b.student_id));

    renderAdminStudents(allStudents);
    renderAdminBlocked(blocked || []);
  } catch(e) {
    document.getElementById('adminStudentList').innerHTML = '<p class="admin-empty">Error: ' + e.message + '</p>';
  }
}

function renderAdminStudents(students) {
  const list = document.getElementById('adminStudentList');
  if (!students.length) { list.innerHTML = '<p class="admin-empty">No students found</p>'; return; }
  list.innerHTML = students.map(s => {
    const isBlk = blockedIds.has(s.id);
    const isSelf = s.id === currentUser.id;
    const initial = (s.name || '?').charAt(0).toUpperCase();
    const className = s.classes?.name || 'Class ' + (s.class_id || '?');
    return '<div class="admin-user-row' + (isBlk ? ' blocked' : '') + '">' +
      '<span class="au-avatar">' + initial + '</span>' +
      '<div class="au-info"><div class="au-name">' + (s.name || 'Unknown') + (isSelf ? ' (you)' : '') + '</div>' +
      '<div class="au-meta">' + s.id.substring(0,8) + '...</div></div>' +
      '<span class="au-class">' + className + '</span>' +
      (isSelf ? '' : (isBlk
        ? '<button class="admin-btn unblock" onclick="unblockUser(\'' + s.id + '\',\'' + esc(s.name) + '\')">Unblock</button>'
        : '<button class="admin-btn block" onclick="blockUser(\'' + s.id + '\',\'' + esc(s.name) + '\')">Block</button>'
      )) + '</div>';
  }).join('');
}

function renderAdminBlocked(blocked) {
  const list = document.getElementById('adminBlockedList');
  if (!blocked.length) { list.innerHTML = '<p class="admin-empty">No blocked users ✅</p>'; return; }
  list.innerHTML = blocked.map(b => '<div class="admin-user-row blocked">' +
    '<span class="au-avatar" style="background:#fef2f2;color:#dc2626">🚫</span>' +
    '<div class="au-info"><div class="au-name">' + (b.name || 'Unknown') + '</div>' +
    '<div class="au-meta">Blocked on ' + new Date(b.blocked_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) + '</div></div>' +
    '<button class="admin-btn unblock" onclick="unblockUser(\'' + b.student_id + '\',\'' + esc(b.name) + '\')">Unblock</button>' +
    '</div>').join('');
}

function filterAdminStudents() {
  const q = document.getElementById('adminSearch').value.toLowerCase().trim();
  const filtered = q ? allStudents.filter(s => (s.name || '').toLowerCase().includes(q)) : allStudents;
  renderAdminStudents(filtered);
}

async function blockUser(studentId, name) {
  if (!isFounder() || !sb) return;
  if (!confirm('Block "' + name + '" from the chat?')) return;
  try {
    const { error } = await sb.from('blocked_users').insert({ student_id: studentId, name: name, reason: 'Inappropriate behaviour' });
    if (error) throw error;
    blockedIds.add(studentId);
    loadAdminPanel();
  } catch(e) { alert('Error blocking user: ' + e.message); }
}

async function unblockUser(studentId, name) {
  if (!isFounder() || !sb) return;
  if (!confirm('Unblock "' + name + '"?')) return;
  try {
    const { error } = await sb.from('blocked_users').delete().eq('student_id', studentId);
    if (error) throw error;
    blockedIds.delete(studentId);
    loadAdminPanel();
  } catch(e) { alert('Error unblocking user: ' + e.message); }
}

// ===================== CHAT =====================
let onlineUsers = {};
let isBlocked = false;
const FOUNDER_EMAIL = 'sparkai.automation@gmail.com';

function isFounder() {
  return currentUser && currentUser.email && currentUser.email.toLowerCase() === FOUNDER_EMAIL;
}

async function checkIfBlocked() {
  if (!currentUser || !sb) return false;
  try {
    const { data } = await sb.from('blocked_users').select('*').eq('student_id', currentUser.id).maybeSingle();
    return !!data;
  } catch(e) { return false; }
}

async function initChat() {
  if (!currentUser || !currentProfile || !sb) return;

  // Check if user is blocked
  isBlocked = await checkIfBlocked();
  const blockedView = document.getElementById('chatBlockedView');
  const chatWrap = document.getElementById('chatWrap');

  if (isBlocked && !isFounder()) {
    blockedView.style.display = 'block';
    chatWrap.style.display = 'none';
    return;
  }

  blockedView.style.display = 'none';
  chatWrap.style.display = 'flex';

  const feed = document.getElementById('chatFeed');
  feed.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading chat...</p></div>';

  // Load existing messages
  sb.from('chat_messages').select('*').order('created_at', { ascending: true }).limit(100)
    .then(({ data, error }) => {
      if (error) throw error;
      renderChatMessages(data || []);
      // Subscribe to realtime + presence
      if (chatChannel) sb.removeChannel(chatChannel);
      chatChannel = sb.channel('chat-room', { config: { presence: { key: currentUser.id } } })
        // New messages
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          appendChatBubble(payload.new);
        })
        // Presence events
        .on('presence', { event: 'sync' }, () => {
          const state = chatChannel.presenceState();
          onlineUsers = {};
          for (const [id, presences] of Object.entries(state)) {
            if (presences.length > 0) {
              onlineUsers[id] = presences[0].name || 'Student';
            }
          }
          renderOnlineUsers();
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (newPresences.length > 0) {
            onlineUsers[key] = newPresences[0].name || 'Student';
            renderOnlineUsers();
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          delete onlineUsers[key];
          renderOnlineUsers();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Track our presence
            chatChannel.track({
              user_id: currentUser.id,
              name: currentProfile.name,
              online_at: new Date().toISOString()
            });
          }
        });
    })
    .catch(e => { feed.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>${e.message}</p></div>`; });
}

function renderOnlineUsers() {
  const countEl = document.getElementById('chatOnlineCount');
  const listEl = document.getElementById('chatOnlineList');
  const ids = Object.keys(onlineUsers);
  countEl.textContent = ids.length;

  listEl.innerHTML = ids.map(id => {
    const name = onlineUsers[id];
    const isSelf = id === currentUser.id;
    return `<span class="chat-online-user${isSelf ? ' self' : ''}">${name}${isSelf ? ' (you)' : ''}</span>`;
  }).join('');
}

function toggleOnlineList() {
  const panel = document.getElementById('chatOnlinePanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function renderChatMessages(messages) {
  const feed = document.getElementById('chatFeed');
  if (!messages.length) {
    feed.innerHTML = '<div class="chat-empty"><div class="ce-icon">👋</div><p>Say hi to your fellow students!</p></div>';
    return;
  }
  feed.innerHTML = '';
  messages.forEach(m => appendChatBubble(m, false));
  feed.scrollTop = feed.scrollHeight;
}

function appendChatBubble(msg, scroll) {
  const feed = document.getElementById('chatFeed');
  // Remove empty state
  const empty = feed.querySelector('.chat-empty');
  if (empty) empty.remove();

  const isSelf = msg.student_id === currentUser.id;
  const time = new Date(msg.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  const div = document.createElement('div');
  div.className = 'chat-bubble ' + (isSelf ? 'self' : 'other');
  div.innerHTML = `<span class="cb-name">${msg.name || 'Student'}</span>${escapeHtml(msg.message)}<div class="cb-time">${time}</div>`;
  feed.appendChild(div);
  if (scroll !== false) feed.scrollTop = feed.scrollHeight;
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg || !currentUser || !currentProfile) return;
  if (msg.length > 500) { alert('Message too long (max 500 characters).'); return; }
  input.value = '';
  try {
    const { error } = await sb.from('chat_messages').insert({
      student_id: currentUser.id,
      name: currentProfile.name,
      message: msg
    });
    if (error) throw error;
  } catch(e) { console.error('Chat send error:', e); }
}

// ===================== NOTICE MODAL =====================
function showNoticeModal() { document.getElementById('noticeModal').classList.add('show'); }
function dismissNoticeModal() {
  document.getElementById('noticeModal').classList.remove('show');
  try { sessionStorage.setItem('studyhub_notice_dismissed', '1'); } catch(e) {}
}
try {
  if (sessionStorage.getItem('studyhub_notice_dismissed') !== '1') {
    setTimeout(showNoticeModal, 1200);
  }
} catch(e) { setTimeout(showNoticeModal, 1200); }

// ===================== KEY HANDLERS =====================
document.getElementById('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); } });
document.getElementById('loginEmail').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doLogin(); } });
document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doLogin(); } });

// ===================== INIT =====================
loadHome();
