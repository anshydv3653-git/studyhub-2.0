// ===================== SITE CONFIG =====================
const SITE_URL = "https://studyhub-2-0-five.vercel.app"; // Base URL for StudyHub 2.0 & Spark AI by Ansh

// ===================== SUPABASE CONFIG =====================
const SUPABASE_URL = "https://qijdyaorbvbvuumzdxdu.supabase.co";
const SUPABASE_KEY = "sb_publishable_jRJUeUmDJ9CMONA75QCCCQ_2aCizXnE";
let sb = (window.StudyHubAuth && window.StudyHubAuth.getClient()) || (window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null);

// ===================== STATE =====================
let currentClass = null, currentSubject = null, currentChapter = null;
let currentUser = (window.StudyHubAuth && window.StudyHubAuth.getCurrentUser()) || null;
let currentProfile = (window.StudyHubAuth && window.StudyHubAuth.getCurrentProfile()) || null;
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
  // Only community chat requires immediate login popup
  if (page === 'chat' && !currentUser) {
    showAuthOverlay('login');
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

    // Filter out specific English and Hindi textbooks (keep only main subjects)
    const excludedSubjects = ['english first flight', 'english footprint', 'hindi kshitiz', 'hindi kritika', 'first flight', 'footprint', 'kshitiz', 'kritika'];
    const filteredSubjects = subjects.filter(s => {
      const name = s.name.toLowerCase();
      return !excludedSubjects.some(excluded => name.includes(excluded));
    });

    grid.innerHTML = filteredSubjects.map((s, i) => {
      const icon = icons[s.name.toLowerCase()] || '📘';
      return `<div class="subject-card" onclick="navigate('chapters',{subjectId:${s.id},subjectName:'${esc(s.name)}',className:'${esc(cn)}',classId:${ci}})"><div class="sc-top" style="background:${gradients[i%8]}"><span class="sc-icon">${icon}</span></div><div class="sc-body"><h3>${s.name}</h3><div class="sc-arrow"><span>View Chapters</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div></div></div>`;
    }).join('')
    // Extra external link card (Class 10 only)
    + `<a class="subject-card" href="https://vidya-verse.ai.studio/" target="_blank" rel="noopener noreferrer"><div class="sc-top" style="background:linear-gradient(135deg,#f43f5e,#8b5cf6)"><span class="sc-icon">🎯</span></div><div class="sc-body"><h3>PW and Next Toppers And KGS Paid Batches Free</h3><div class="sc-arrow"><span>Open Batches</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg></div></div></a>`;
  } catch(e) {
    console.error('loadHome error:', e);
    grid.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>Failed to load subjects: ${e.message || 'Network error'}</p><button class="btn btn-primary" onclick="loadHome()" style="margin-top:12px">Retry</button></div>`;
  }
}

function esc(s) { return (s||'').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

// ===================== CHAPTERS =====================
async function loadChapters(subjectData = {}) {
  const { subjectId, subjectName = 'Chapters', className = 'Class 10', classId = 2 } = subjectData;
  const numId = parseInt(subjectId, 10);
  const list = document.getElementById('chapterList');

  if (!numId || isNaN(numId)) {
    if (list) {
      list.innerHTML = '<div class="empty"><div class="em-icon">⚠️</div><p>Invalid subject selected.</p><button class="btn btn-primary" onclick="navigate(\'home\')" style="margin-top:12px">Back to Home</button></div>';
    }
    return;
  }

  currentSubject = {id: numId, name: subjectName};
  currentClass = {id: classId, name: className};
  document.getElementById('chapterCrumbs').innerHTML = `<a onclick="navigate('home')">Home</a><span class="sep">→</span><a onclick="navigate('home')">Class 10</a><span class="sep">→</span><span class="cur">${subjectName}</span>`;
  document.getElementById('chapterTitle').textContent = subjectName;

  if (!sb) { list.innerHTML = '<div class="empty"><div class="em-icon">⚠️</div><p>Not connected</p></div>'; return; }
  try {
    const { data, error } = await sb.from('chapters').select('*').eq('subject_id', numId).order('id');
    if (error) throw error;
    if (!data || !data.length) { list.innerHTML = '<div class="empty"><div class="em-icon">📭</div><p>No chapters found for this subject yet.</p></div>'; return; }
    list.innerHTML = data.map((ch, i) => `<div class="chapter-item" onclick="navigate('detail',{chapterId:${ch.id},chapterName:\`${ch.name.replace(/`/g,'\\`')}\`,subjectName:'${esc(subjectName)}',subjectId:${numId},className:'${esc(className)}',classId:${classId}})"><span class="ci-num">${i+1}</span><span class="ci-name">${ch.name}</span><span class="ci-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></div>`).join('');
    initTilt();
    // Load free lectures for this subject
    loadLectures(numId);
  } catch(e) {
    console.error('loadChapters error:', e);
    list.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>Could not load chapters: ${e.message}</p><button class="btn btn-primary" onclick="loadChapters({subjectId:${numId},subjectName:'${esc(subjectName)}',className:'${esc(className)}',classId:${classId}})" style="margin-top:12px">Retry</button></div>`;
  }
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
    panel.innerHTML = notes.map((n, i) => `<div class="note-card"><div class="note-head" onclick="toggleNote(this,${n.id},${chapterId})"><span class="nh-num">${i+1}</span><span class="nh-title">${n.title || 'Note '+(i+1)}</span><button class="nh-download" title="Download PDF" onclick="event.stopPropagation(); downloadNotePDF(this,'${esc(n.title || 'Note '+(i+1))}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></svg></button><svg class="nh-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div><div class="note-body"><div class="note-content">${n.fully_explained_notes || n.content || '<em>No content</em>'}</div>${diagrams.length ? `<div class="note-diagrams"><h4>Diagrams</h4><div class="diag-grid">${diagrams.map(d => `<div class="diag-card" onclick="openDiagram('${esc(d.title)}',\`${(d.svg_code||'').replace(/`/g,'\\`')}\`)">${d.svg_code||''}<p>${d.title||''}</p>${d.is_animated?'<span class="anim-badge">✨ Animated</span>':''}</div>`).join('')}</div></div>` : ''}</div></div>`).join('');
  } catch(e) { panel.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>${e.message}</p></div>`; }
}

// Download a single note as a PDF, using the note's own rendered HTML content
function downloadNotePDF(btn, title) {
  const card = btn.closest('.note-card');
  const content = card.querySelector('.note-content');
  if (!content) return;
  const original = btn.innerHTML;
  btn.innerHTML = '<span class="nh-download-spinner"></span>';
  btn.disabled = true;
  const filename = (title || 'notes').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') + '.pdf';
  const opt = {
    margin: 10,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  html2pdf().set(opt).from(content).save().then(() => {
    btn.innerHTML = original;
    btn.disabled = false;
  }).catch((err) => {
    console.error('PDF download failed', err);
    btn.innerHTML = original;
    btn.disabled = false;
    alert('PDF download failed, please try again.');
  });
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

// ===================== AUTH SYSTEM INTEGRATION =====================

// Global UI Form Handlers
async function handleLoginSubmit() {
  const emailInput = document.getElementById('loginEmail');
  const pwdInput = document.getElementById('loginPassword');
  const btn = document.getElementById('loginSubmitBtn');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = pwdInput ? pwdInput.value : '';

  if (!email || !password) {
    StudyHubAuth.showAuthMessage('Please fill in both email and password.', 'err');
    return;
  }

  if (btn) { btn.disabled = true; btn.classList.add('loading'); }
  StudyHubAuth.showAuthMessage('⏳ Signing in...', 'ok');

  try {
    await StudyHubAuth.signInEmail(email, password);
    StudyHubAuth.showAuthMessage('✅ Signed in successfully!', 'ok');
    StudyHubAuth.hideAuthModal();
  } catch (err) {
    StudyHubAuth.showAuthMessage('❌ ' + err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
  }
}

async function handleSignupSubmit() {
  const emailInput = document.getElementById('signupEmail');
  const pwdInput = document.getElementById('signupPassword');
  const btn = document.getElementById('signupSubmitBtn');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = pwdInput ? pwdInput.value : '';

  if (!email || !password) {
    StudyHubAuth.showAuthMessage('Please fill in all fields.', 'err');
    return;
  }
  if (password.length < 8) {
    StudyHubAuth.showAuthMessage('Password must be at least 8 characters long.', 'err');
    return;
  }

  if (btn) { btn.disabled = true; btn.classList.add('loading'); }
  StudyHubAuth.showAuthMessage('⏳ Creating account...', 'ok');

  try {
    const data = await StudyHubAuth.signUpEmail(email, password);
    if (data && data.session) {
      StudyHubAuth.showAuthMessage('✅ Account created! Welcome!', 'ok');
    } else {
      StudyHubAuth.showAuthMessage('📧 Confirmation link sent! Please check your email inbox to verify your account.', 'ok');
      setTimeout(() => StudyHubAuth.switchMode('login'), 3500);
    }
  } catch (err) {
    StudyHubAuth.showAuthMessage('❌ ' + err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
  }
}

async function handleGoogleAuth() {
  const btn = document.getElementById('googleLoginBtn');
  const signupBtn = document.getElementById('googleSignupBtn');
  if (btn) btn.disabled = true;
  if (signupBtn) signupBtn.disabled = true;
  StudyHubAuth.showAuthMessage('⏳ Connecting with Google...', 'ok');

  try {
    await StudyHubAuth.signInGoogle();
  } catch (err) {
    StudyHubAuth.showAuthMessage('❌ ' + err.message, 'err');
    if (btn) btn.disabled = false;
    if (signupBtn) signupBtn.disabled = false;
  }
}

async function handleForgotSubmit() {
  const emailInput = document.getElementById('forgotEmail');
  const btn = document.getElementById('forgotSubmitBtn');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    StudyHubAuth.showAuthMessage('Please enter your email address.', 'err');
    return;
  }

  if (btn) { btn.disabled = true; btn.classList.add('loading'); }
  StudyHubAuth.showAuthMessage('⏳ Sending reset link...', 'ok');

  try {
    await StudyHubAuth.sendPasswordReset(email);
    StudyHubAuth.showAuthMessage('✅ Reset link sent! Please check your email inbox.', 'ok');
  } catch (err) {
    StudyHubAuth.showAuthMessage('❌ ' + err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
  }
}

async function handleResetSubmit() {
  const pwdInput = document.getElementById('resetPassword');
  const btn = document.getElementById('resetSubmitBtn');
  const newPassword = pwdInput ? pwdInput.value : '';

  if (!newPassword || newPassword.length < 8) {
    StudyHubAuth.showAuthMessage('Password must be at least 8 characters long.', 'err');
    return;
  }

  if (btn) { btn.disabled = true; btn.classList.add('loading'); }
  StudyHubAuth.showAuthMessage('⏳ Updating password...', 'ok');

  try {
    await StudyHubAuth.updatePassword(newPassword);
    StudyHubAuth.showAuthMessage('✅ Password updated successfully! Redirecting to login...', 'ok');
    setTimeout(() => {
      StudyHubAuth.switchMode('login');
    }, 1500);
  } catch (err) {
    StudyHubAuth.showAuthMessage('❌ ' + err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
  }
}

async function handleOnboardSubmit() {
  const nameInput = document.getElementById('onboardName');
  const classInput = document.getElementById('onboardClass');
  const btn = document.getElementById('onboardSubmitBtn');
  const name = nameInput ? nameInput.value.trim() : '';
  const classId = classInput ? classInput.value : '';

  if (!name) {
    StudyHubAuth.showAuthMessage('Please enter your full name.', 'err');
    return;
  }
  if (!classId) {
    StudyHubAuth.showAuthMessage('Please select your class.', 'err');
    return;
  }

  if (btn) { btn.disabled = true; btn.classList.add('loading'); }
  StudyHubAuth.showAuthMessage('⏳ Saving your profile...', 'ok');

  try {
    await StudyHubAuth.saveProfileOnboard(name, classId);
    StudyHubAuth.showAuthMessage('🎉 Welcome to StudyHub 2.0!', 'ok');
    setTimeout(() => {
      StudyHubAuth.hideAuthModal();
      updateNavbarForUser();
    }, 800);
  } catch (err) {
    StudyHubAuth.showAuthMessage('❌ ' + err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
  }
}

async function logoutUser() {
  try {
    if (chatChannel && sb) {
      chatChannel.untrack();
      sb.removeChannel(chatChannel);
      chatChannel = null;
    }
    onlineUsers = {};
    if (window.StudyHubAuth) {
      await window.StudyHubAuth.signOut();
    }
    currentUser = null;
    currentProfile = null;
    updateNavbarForUser();
    navigate('home');
    showToast('You have been signed out.');
  } catch (e) {
    console.error('Logout error:', e);
  }
}

// Backwards compatibility wrappers
function showAuthOverlay(mode) { if (window.StudyHubAuth) StudyHubAuth.showAuthModal(mode); }
function hideAuthOverlay() { if (window.StudyHubAuth) StudyHubAuth.hideAuthModal(); }
function switchAuthMode(mode) { if (window.StudyHubAuth) StudyHubAuth.switchMode(mode); }
function loginWithGoogle() { handleGoogleAuth(); }
function doLogin() { handleLoginSubmit(); }
function doSignup() { handleSignupSubmit(); }
function doOnboard() { handleOnboardSubmit(); }
function showAuthMsg(text, type) { if (window.StudyHubAuth) StudyHubAuth.showAuthMessage(text, type); }

function updateNavbarForUser() {
  const menu = document.getElementById('userMenu');
  const loginBtn = document.getElementById('navLoginBtn');
  const user = window.StudyHubAuth ? StudyHubAuth.getCurrentUser() : currentUser;
  const profile = window.StudyHubAuth ? StudyHubAuth.getCurrentProfile() : currentProfile;

  currentUser = user;
  currentProfile = profile;

  if (!user || !profile) {
    if (menu) menu.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    return;
  }

  if (menu) menu.style.display = 'flex';
  if (loginBtn) loginBtn.style.display = 'none';
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = profile.name || 'Student';
  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl) avatarEl.innerHTML = (profile.name || 'S').charAt(0).toUpperCase();
}

// Connect single auth listener from StudyHubAuth
if (window.StudyHubAuth) {
  StudyHubAuth.onAuthChange((event, session, user, profile) => {
    currentUser = user;
    currentProfile = profile;
    updateNavbarForUser();

    const activePage = document.querySelector('.page.active');
    const pageId = activePage?.id?.replace('page-', '');

    if (pageId === 'dashboard') {
      loadDashboard();
    } else if (pageId === 'chat' && user) {
      initChat();
    }
  });
}

// ===================== TOAST NOTIFICATIONS =====================
function showToast(msg, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 320);
  }, 3200);
}

// Indian Standard Time (IST) Date helper - strictly YYYY-MM-DD
function getTodayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// Helper to get authenticated student ID
async function getAuthStudentId() {
  if (currentUser?.id) return currentUser.id;
  const { data: { user } } = await sb.auth.getUser();
  return user?.id || null;
}

// Tracker State
window.trackerState = {
  tab: 'today', // 'today' | 'subjects' | 'progress' | 'settings'
  activeSubjectId: null,
  overview: null
};

function handleTrackerError(err, defaultMsg = 'Something went wrong. Please try again.') {
  console.error('Tracker error:', err);
  if (err?.code === '23505') {
    showToast('You already have this subject.', 'error');
  } else if (err?.code === '42501' || err?.message?.includes('JWT') || err?.status === 401) {
    showToast('Session expired, please log in again.', 'error');
    showAuthOverlay('login');
  } else {
    showToast(err?.message || defaultMsg, 'error');
  }
}

// ===================== DASHBOARD / PERSONAL STUDY TRACKER =====================
async function loadDashboard() {
  const panel = document.getElementById('dashContent');
  if (!panel) return;

  if (!currentUser || !currentProfile) {
    document.getElementById('dashName').textContent = 'Guest Learner';
    document.getElementById('adminPanel').style.display = 'none';

    panel.innerHTML = `
      <div style="max-width:820px;margin:0 auto">
        <div class="tracker-metrics-grid">
          <div class="tracker-card">
            <div class="tracker-card-head">
              <span class="tracker-card-title">Daily Study Goal</span>
              <span class="tracker-card-icon" style="background:#fef2f2;color:#e11d48">🎯</span>
            </div>
            <div class="goal-ring-container">
              <svg class="goal-ring-svg" viewBox="0 0 80 80">
                <circle class="goal-ring-bg" cx="40" cy="40" r="32"/>
                <circle class="goal-ring-fill" cx="40" cy="40" r="32" stroke-dasharray="201.06" stroke-dashoffset="0"/>
              </svg>
              <div class="goal-ring-text-group">
                <div class="goal-ring-primary">180 <span style="font-size:1rem;font-weight:600;color:var(--muted)">/ 180m</span></div>
                <div class="goal-ring-sub">100% of daily goal</div>
                <div class="goal-reached-tag">🎉 Goal Reached!</div>
              </div>
            </div>
          </div>

          <div class="tracker-card">
            <div class="tracker-card-head">
              <span class="tracker-card-title">Consistency Streak</span>
              <span class="tracker-card-icon" style="background:#fff7ed;color:#f97316">🔥</span>
            </div>
            <div style="font-size:2rem;font-weight:900;color:var(--ink);letter-spacing:-.02em;line-height:1.1">
              7 <span style="font-size:1.1rem;font-weight:700;color:var(--muted)">days</span>
            </div>
            <p style="font-size:.84rem;color:var(--muted);margin-top:8px">Track study sessions daily to build your board streak.</p>
          </div>

          <div class="tracker-card">
            <div class="tracker-card-head">
              <span class="tracker-card-title">Exam Target</span>
              <span class="tracker-card-icon" style="background:#f0fdf4;color:#16a34a">📅</span>
            </div>
            <div style="font-size:2rem;font-weight:900;color:var(--ink);letter-spacing:-.02em;line-height:1.1">
              Boards 2027
            </div>
            <p style="font-size:.84rem;color:var(--muted);margin-top:8px">Countdown to CBSE Class 10 board exams.</p>
          </div>
        </div>

        <div style="background:linear-gradient(135deg, rgba(225,29,72,0.08), rgba(244,63,94,0.03)); border:1px solid rgba(225,29,72,0.25); border-radius:var(--r-lg); padding:32px 24px; text-align:center; margin-top:24px; box-shadow:var(--shadow-sm)">
          <div style="font-size:2.4rem;margin-bottom:10px">🎯</div>
          <h3 style="font-size:1.35rem;font-weight:900;color:var(--ink);margin-bottom:8px">Your Personal Study Tracker</h3>
          <p style="color:var(--ink-2);font-size:.95rem;max-width:540px;margin:0 auto 20px;line-height:1.6">
            Log your study minutes, set custom subjects (Maths, Science, English, SST), tick tasks as you finish them, and track your consistency streak.
          </p>
          <button onclick="showAuthOverlay('login')" class="tracker-btn-primary" style="padding:14px 32px;font-size:1rem">
            Sign In / Sign Up to Start Tracking 🚀
          </button>
        </div>
      </div>
    `;
    return;
  }

  panel.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading your study tracker...</p></div>';

  document.getElementById('dashName').textContent = currentProfile.name;

  // Show admin panel if founder
  if (isFounder()) {
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminPanel();
  } else {
    document.getElementById('adminPanel').style.display = 'none';
  }

  await refreshTracker();
}

async function refreshTracker(keepSubjectView = true) {
  const panel = document.getElementById('dashContent');
  if (!panel || !currentUser) return;

  try {
    const { data: overview, error } = await sb.rpc('study_tracker_overview');
    if (error) throw error;
    window.trackerState.overview = overview;

    if (!overview || !overview.has_settings) {
      renderTrackerOnboarding(panel);
    } else {
      if (!keepSubjectView) {
        window.trackerState.activeSubjectId = null;
      }
      renderTrackerMain(panel, overview);
    }
  } catch(e) {
    console.error('Study tracker overview error:', e);
    panel.innerHTML = `<div class="empty"><div class="em-icon">⚠️</div><p>${e.message || 'Failed to load study tracker.'}</p><button class="btn btn-primary" style="margin-top:14px" onclick="loadDashboard()">Retry</button></div>`;
  }
}

// ---------- ONBOARDING ----------
function renderTrackerOnboarding(panel) {
  panel.innerHTML = `
    <div style="max-width:680px;margin:0 auto;background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);padding:clamp(22px,4vw,36px);box-shadow:var(--shadow-md)">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:2.8rem;margin-bottom:8px">🎯</div>
        <h3 style="font-size:1.45rem;font-weight:900;letter-spacing:-.02em;margin-bottom:6px">Set Up Your Personal Study Tracker</h3>
        <p style="color:var(--muted);font-size:.92rem;line-height:1.5">Take control of your CBSE Class 10 preparation. Choose your daily target, exam date, and add your subjects to get started.</p>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Daily Study Goal (0.5 to 16 Hours)</label>
        <div style="display:flex;align-items:center;gap:16px;background:var(--rose-50);padding:14px 18px;border-radius:var(--r-sm);border:1px solid rgba(225,29,72,.15)">
          <input type="range" id="onboardDailyGoal" min="0.5" max="16" step="0.5" value="3" style="flex:1" oninput="document.getElementById('onboardGoalVal').textContent = this.value + ' hrs/day'">
          <span id="onboardGoalVal" style="font-size:1.15rem;font-weight:900;color:var(--rose-700);min-width:100px;text-align:right">3 hrs/day</span>
        </div>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Target Exam Date (Optional)</label>
        <input type="date" id="onboardTargetDate" class="tracker-form-input" min="${getTodayIST()}">
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Select Your Subjects</label>
        <p style="font-size:.82rem;color:var(--muted);margin-bottom:10px">Click chips to pick subjects (or add your own below):</p>
        <div class="tracker-chips-group" id="onboardSubjectChips">
          <button type="button" class="tracker-chip active" data-sub="Mathematics" data-color="#3b82f6">Maths</button>
          <button type="button" class="tracker-chip active" data-sub="Science" data-color="#10b981">Science</button>
          <button type="button" class="tracker-chip active" data-sub="Social Science" data-color="#f59e0b">Social Science</button>
          <button type="button" class="tracker-chip active" data-sub="English" data-color="#8b5cf6">English</button>
          <button type="button" class="tracker-chip active" data-sub="Hindi" data-color="#ec4899">Hindi</button>
        </div>
      </div>

      <div class="tracker-form-group" style="margin-top:20px;border-top:1px dashed var(--line);padding-top:18px">
        <label class="tracker-form-label">Add Custom Subject (Optional)</label>
        <div style="display:flex;gap:10px">
          <input type="text" id="onboardCustomSub" class="tracker-form-input" placeholder="e.g. Information Technology, Computer Apps" maxlength="60">
          <input type="color" id="onboardCustomColor" value="#e11d48" style="width:48px;height:46px;border:none;border-radius:10px;cursor:pointer;padding:0">
        </div>
      </div>

      <button class="tracker-btn-primary" style="width:100%;justify-content:center;margin-top:24px;padding:15px;font-size:1rem" onclick="saveTrackerOnboarding()">
        Save & Start Tracking 🚀
      </button>
    </div>
  `;

  panel.querySelectorAll('#onboardSubjectChips .tracker-chip').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
}

async function saveTrackerOnboarding() {
  const goalHours = parseFloat(document.getElementById('onboardDailyGoal')?.value || '3');
  const targetDate = document.getElementById('onboardTargetDate')?.value || null;
  const customSubName = (document.getElementById('onboardCustomSub')?.value || '').trim();
  const customColor = document.getElementById('onboardCustomColor')?.value || '#e11d48';

  const activeChips = Array.from(document.querySelectorAll('#onboardSubjectChips .tracker-chip.active'));
  const subjectsToCreate = activeChips.map(c => ({
    name: c.getAttribute('data-sub'),
    color: c.getAttribute('data-color') || '#e11d48'
  }));

  if (customSubName) {
    subjectsToCreate.push({ name: customSubName, color: customColor });
  }

  try {
    const studentId = await getAuthStudentId();
    if (!studentId) {
      showAuthOverlay('login');
      return;
    }

    // 1. Upsert student_study_settings
    const { error: setErr } = await sb.from('student_study_settings').upsert({
      student_id: studentId,
      daily_hours: goalHours,
      target_date: targetDate
    }, { onConflict: 'student_id' });
    if (setErr) throw setErr;

    // 2. Insert subjects
    for (const sub of subjectsToCreate) {
      await sb.from('student_subjects').insert({
        student_id: studentId,
        name: sub.name,
        color: sub.color,
        weekly_target_hours: 5
      });
    }

    showToast('Personal tracker setup complete! 🎯', 'success');
    await refreshTracker();
  } catch(err) {
    handleTrackerError(err, 'Failed to save tracker setup.');
  }
}

// ---------- MAIN TRACKER UI ----------
function renderTrackerMain(panel, overview) {
  const tab = window.trackerState.tab;

  let navHtml = `
    <div class="tracker-nav-wrap">
      <button class="tracker-tab-btn ${tab === 'today' && !window.trackerState.activeSubjectId ? 'active' : ''}" onclick="switchTrackerTab('today')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Today
        ${overview.tasks_due_today > 0 ? `<span class="tracker-tab-badge">${overview.tasks_due_today}</span>` : ''}
      </button>
      <button class="tracker-tab-btn ${tab === 'subjects' || window.trackerState.activeSubjectId ? 'active' : ''}" onclick="switchTrackerTab('subjects')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        My Subjects
        <span class="tracker-tab-badge">${overview.subjects?.length || 0}</span>
      </button>
      <button class="tracker-tab-btn ${tab === 'progress' && !window.trackerState.activeSubjectId ? 'active' : ''}" onclick="switchTrackerTab('progress')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        7-Day Progress
      </button>
      <button class="tracker-tab-btn ${tab === 'settings' && !window.trackerState.activeSubjectId ? 'active' : ''}" onclick="switchTrackerTab('settings')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Goal & Settings
      </button>
    </div>
    <div id="trackerTabBody"></div>
  `;

  panel.innerHTML = navHtml;
  renderActiveTrackerTab();
}

function switchTrackerTab(tab) {
  window.trackerState.tab = tab;
  window.trackerState.activeSubjectId = null;
  const panel = document.getElementById('dashContent');
  if (panel && window.trackerState.overview) {
    renderTrackerMain(panel, window.trackerState.overview);
  }
}

async function renderActiveTrackerTab() {
  const container = document.getElementById('trackerTabBody');
  if (!container) return;

  const overview = window.trackerState.overview;
  if (!overview) return;

  if (window.trackerState.activeSubjectId) {
    renderSubjectDetailView(container, window.trackerState.activeSubjectId);
    return;
  }

  const tab = window.trackerState.tab;
  if (tab === 'today') {
    await renderTrackerTodayView(container, overview);
  } else if (tab === 'subjects') {
    renderTrackerSubjectsView(container, overview);
  } else if (tab === 'progress') {
    await renderTrackerProgressView(container, overview);
  } else if (tab === 'settings') {
    renderTrackerSettingsView(container, overview);
  }
}

// ---------- TAB 1: TODAY VIEW ----------
async function renderTrackerTodayView(container, overview) {
  const todayMins = overview.today_minutes || 0;
  const goalMins = overview.daily_goal_minutes || 180;
  const percent = Math.min(100, Math.round((todayMins / goalMins) * 100));
  const circ = 201.06; // 2 * PI * 32
  const offset = circ - (circ * Math.min(100, percent)) / 100;

  let topCardsHtml = `
    <div class="tracker-metrics-grid">
      <!-- Goal Ring -->
      <div class="tracker-card">
        <div class="tracker-card-head">
          <span class="tracker-card-title">Daily Study Goal</span>
          <span class="tracker-card-icon" style="background:#fef2f2;color:#e11d48">🎯</span>
        </div>
        <div class="goal-ring-container">
          <svg class="goal-ring-svg" viewBox="0 0 80 80">
            <circle class="goal-ring-bg" cx="40" cy="40" r="32"/>
            <circle class="goal-ring-fill" cx="40" cy="40" r="32" stroke-dasharray="201.06" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="goal-ring-text-group">
            <div class="goal-ring-primary">${todayMins} <span style="font-size:1rem;font-weight:600;color:var(--muted)">/ ${goalMins}m</span></div>
            <div class="goal-ring-sub">${percent}% of daily goal</div>
            ${overview.goal_reached ? `<div class="goal-reached-tag">🎉 Goal Reached!</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Streak -->
      <div class="tracker-card">
        <div class="tracker-card-head">
          <span class="tracker-card-title">Consistency Streak</span>
          <span class="tracker-card-icon" style="background:#fff7ed;color:#f97316">🔥</span>
        </div>
        <div style="font-size:2rem;font-weight:900;color:var(--ink);letter-spacing:-.02em;line-height:1.1">
          ${overview.streak_days || 0} <span style="font-size:1.1rem;font-weight:700;color:var(--muted)">${overview.streak_days === 1 ? 'day' : 'days'}</span>
        </div>
        <p style="font-size:.84rem;color:var(--muted);margin-top:8px">Log study time every day to keep your streak alive!</p>
      </div>

      <!-- Target Exam Date -->
      <div class="tracker-card">
        <div class="tracker-card-head">
          <span class="tracker-card-title">Exam Target</span>
          <span class="tracker-card-icon" style="background:#f0fdf4;color:#16a34a">📅</span>
        </div>
        ${overview.target_date ? `
          <div style="font-size:2rem;font-weight:900;color:var(--ink);letter-spacing:-.02em;line-height:1.1">
            ${overview.days_left !== null ? overview.days_left : '0'} <span style="font-size:1.1rem;font-weight:700;color:var(--muted)">days left</span>
          </div>
          <p style="font-size:.84rem;color:var(--muted);margin-top:8px">Target: <b>${overview.target_date}</b></p>
        ` : `
          <div style="font-size:1.05rem;font-weight:700;color:var(--ink-2);margin-top:6px">No exam date set</div>
          <p style="font-size:.84rem;color:var(--muted);margin-top:8px"><a onclick="switchTrackerTab('settings')" style="color:var(--rose-700);cursor:pointer;font-weight:700">Set exam date →</a></p>
        `}
      </div>
    </div>

    <!-- Action Bar -->
    <div class="tracker-action-bar">
      <button class="tracker-btn-primary" onclick="openLogTimeModal()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Log Study Time
      </button>
      <button class="tracker-btn-glass" onclick="openTaskModal()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Task
      </button>
    </div>
  `;

  container.innerHTML = topCardsHtml + `<div id="todayTasksContainer"><div class="loading"><div class="spinner"></div><p>Loading today's tasks...</p></div></div>`;

  // Fetch tasks due today and overdue tasks
  try {
    const todayIST = getTodayIST();
    const studentId = await getAuthStudentId();

    const { data: dueTasks, error: dueErr } = await sb.from('student_tasks')
      .select('*, student_subjects(name, color)')
      .eq('student_id', studentId)
      .eq('due_date', todayIST)
      .order('is_done', { ascending: true })
      .order('sort_order', { ascending: true });
    if (dueErr) throw dueErr;

    const { data: overdueTasks, error: overErr } = await sb.from('student_tasks')
      .select('*, student_subjects(name, color)')
      .eq('student_id', studentId)
      .lt('due_date', todayIST)
      .eq('is_done', false)
      .order('due_date', { ascending: true });
    if (overErr) throw overErr;

    let tasksHtml = '';

    // Overdue Section
    if (overdueTasks && overdueTasks.length > 0) {
      tasksHtml += `
        <div class="tracker-section" style="background:#fff1f2;border:1px solid #fecdd3;border-radius:var(--r-md);padding:18px">
          <div class="tracker-section-head" style="margin-bottom:12px">
            <h4 class="tracker-section-title" style="color:#e11d48">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Overdue Tasks (${overdueTasks.length})
            </h4>
          </div>
          <div class="tracker-tasks-list">
            ${overdueTasks.map(t => renderTaskRow(t, true)).join('')}
          </div>
        </div>
      `;
    }

    // Today Tasks Section
    tasksHtml += `
      <div class="tracker-section">
        <div class="tracker-section-head">
          <h4 class="tracker-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Tasks Due Today (${(dueTasks || []).length})
          </h4>
        </div>
        ${dueTasks && dueTasks.length > 0 ? `
          <div class="tracker-tasks-list">
            ${dueTasks.map(t => renderTaskRow(t, false)).join('')}
          </div>
        ` : `
          <div class="empty" style="padding:28px 20px">
            <p>No tasks scheduled for today. Take a break or add a new task!</p>
          </div>
        `}
      </div>
    `;

    const tasksTarget = document.getElementById('todayTasksContainer');
    if (tasksTarget) tasksTarget.innerHTML = tasksHtml;
  } catch(err) {
    console.error('Failed to load tasks:', err);
    const tasksTarget = document.getElementById('todayTasksContainer');
    if (tasksTarget) tasksTarget.innerHTML = `<p style="color:var(--muted);font-size:.88rem">Could not load tasks.</p>`;
  }
}

function renderTaskRow(task, isOverdue = false) {
  const sub = task.student_subjects || { name: 'General', color: '#e11d48' };
  return `
    <div class="tracker-task-item ${task.is_done ? 'is-done' : ''}" id="task-row-${task.id}">
      <button type="button" class="tracker-checkbox ${task.is_done ? 'checked' : ''}" id="task-cb-${task.id}" onclick="toggleTaskDone('${task.id}', ${task.is_done ? 'true' : 'false'})" aria-label="Toggle task status">
        ${task.is_done ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      </button>
      <div class="task-title-text" id="task-title-${task.id}">${escapeHtml(task.title)}</div>
      <span class="task-subject-tag" style="background:${sub.color || '#e11d48'}">${escapeHtml(sub.name)}</span>
      ${task.est_minutes ? `<span class="task-meta-tag">⏱️ ${task.est_minutes}m</span>` : ''}
      ${isOverdue && task.due_date ? `<span class="task-meta-tag overdue">Due ${task.due_date}</span>` : ''}
    </div>
  `;
}

// Optimistic task toggling
async function toggleTaskDone(taskId, currentStatus) {
  const newStatus = !currentStatus;
  const row = document.getElementById(`task-row-${taskId}`);
  const cb = document.getElementById(`task-cb-${taskId}`);

  // 1. Optimistic DOM update
  if (row) row.classList.toggle('is-done', newStatus);
  if (cb) {
    cb.classList.toggle('checked', newStatus);
    cb.innerHTML = newStatus ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>' : '';
    cb.setAttribute('onclick', `toggleTaskDone('${taskId}', ${newStatus})`);
  }

  try {
    const studentId = await getAuthStudentId();
    const { error } = await sb.from('student_tasks')
      .update({ is_done: newStatus })
      .eq('id', taskId)
      .eq('student_id', studentId);
    if (error) throw error;

    // Refresh overview data in background without tearing down UI
    const { data: newOverview } = await sb.rpc('study_tracker_overview');
    if (newOverview) window.trackerState.overview = newOverview;
  } catch(err) {
    // Rollback
    if (row) row.classList.toggle('is-done', currentStatus);
    if (cb) {
      cb.classList.toggle('checked', currentStatus);
      cb.innerHTML = currentStatus ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>' : '';
      cb.setAttribute('onclick', `toggleTaskDone('${taskId}', ${currentStatus})`);
    }
    handleTrackerError(err, 'Failed to update task.');
  }
}

// ---------- TAB 2: SUBJECTS VIEW ----------
function renderTrackerSubjectsView(container, overview) {
  const subjects = overview.subjects || [];

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h3 style="font-size:1.3rem;font-weight:800;letter-spacing:-.015em;color:var(--ink)">My Subjects</h3>
        <p style="font-size:.85rem;color:var(--muted)">Manage your subjects, set weekly study targets, and organize tasks.</p>
      </div>
      <button class="tracker-btn-primary" onclick="openSubjectModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Subject
      </button>
    </div>

    ${subjects.length > 0 ? `
      <div class="tracker-subjects-grid">
        ${subjects.map(s => {
          const totalTasks = s.tasks_total || 0;
          const doneTasks = s.tasks_done || 0;
          const taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
          const minsWeek = s.minutes_this_week || 0;
          const targetMins = s.weekly_target_hours ? s.weekly_target_hours * 60 : null;

          return `
            <div class="subject-card" style="border-top-color:${s.color || '#e11d48'}" onclick="openSubjectDetail('${s.id}')">
              <div class="subject-card-top">
                <div>
                  <h4 class="subject-card-title">${escapeHtml(s.name)}</h4>
                  <div style="font-size:.78rem;font-weight:700;color:var(--muted);margin-top:2px">
                    ${s.minutes_total || 0} mins studied total
                  </div>
                </div>
                <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
                  <button class="task-icon-btn" title="Edit Subject" onclick="openSubjectModal('${s.id}', '${escapeHtml(s.name)}', '${s.color}', ${s.weekly_target_hours || 0})">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  <button class="task-icon-btn" title="Archive Subject" onclick="archiveSubject('${s.id}', true)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect width="22" height="5" x="1" y="3"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  </button>
                  <button class="task-icon-btn delete" title="Delete Subject" onclick="confirmDeleteSubject('${s.id}', '${escapeHtml(s.name)}')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              <div class="subject-progress-wrap">
                <div style="display:flex;justify-content:space-between;font-size:.76rem;font-weight:700;color:var(--muted)">
                  <span>Tasks: ${doneTasks} / ${totalTasks}</span>
                  <span>${taskPct}%</span>
                </div>
                <div class="subject-progress-bar">
                  <div class="subject-progress-fill" style="width:${taskPct}%;background:${s.color || '#e11d48'}"></div>
                </div>
              </div>

              <div class="subject-card-footer">
                <span>⏱️ This week: <b>${minsWeek}m</b> ${targetMins ? `/ ${targetMins}m` : ''}</span>
                <span style="color:var(--rose-700)">Open →</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="empty">
        <p>You have no active subjects. Add one to start organizing your study!</p>
      </div>
    `}

    <!-- Archived Subjects Section -->
    <div style="margin-top:36px;border-top:1px solid var(--line);padding-top:20px">
      <button class="tracker-btn-glass" style="font-size:.82rem;padding:6px 14px" onclick="loadArchivedSubjects(this)">
        Show Archived Subjects
      </button>
      <div id="archivedSubjectsList" style="display:none;margin-top:14px"></div>
    </div>
  `;

  container.innerHTML = html;
}

function openSubjectDetail(subjectId) {
  window.trackerState.activeSubjectId = subjectId;
  const container = document.getElementById('trackerTabBody');
  if (container) {
    renderSubjectDetailView(container, subjectId);
  }
}

// ---------- SUBJECT DETAIL VIEW ----------
async function renderSubjectDetailView(container, subjectId) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading subject details...</p></div>';

  try {
    const studentId = await getAuthStudentId();

    const { data: subject, error: subErr } = await sb.from('student_subjects')
      .select('*')
      .eq('id', subjectId)
      .eq('student_id', studentId)
      .single();
    if (subErr) throw subErr;

    const { data: tasks, error: tErr } = await sb.from('student_tasks')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('student_id', studentId)
      .order('is_done', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (tErr) throw tErr;

    const { data: sessions, error: sErr } = await sb.from('study_sessions')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('student_id', studentId)
      .order('session_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);
    if (sErr) throw sErr;

    const totalMins = (sessions || []).reduce((acc, s) => acc + (s.minutes || 0), 0);
    const doneTasks = (tasks || []).filter(t => t.is_done).length;

    let html = `
      <div style="margin-bottom:24px">
        <button class="tracker-btn-glass" style="font-size:.84rem;padding:7px 16px;margin-bottom:16px" onclick="switchTrackerTab('subjects')">
          ← Back to All Subjects
        </button>

        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:var(--r-md);padding:20px;border-left:6px solid ${subject.color || '#e11d48'}">
          <div>
            <h3 style="font-size:1.4rem;font-weight:900;letter-spacing:-.02em;color:var(--ink)">${escapeHtml(subject.name)}</h3>
            <p style="font-size:.86rem;color:var(--muted);margin-top:2px">
              ${totalMins} minutes studied · ${doneTasks} of ${(tasks || []).length} tasks completed
            </p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="tracker-btn-primary" onclick="openLogTimeModal('${subject.id}')">
              ⏱️ Log Study Time
            </button>
            <button class="tracker-btn-glass" onclick="openTaskModal('${subject.id}')">
              + Add Task
            </button>
          </div>
        </div>
      </div>

      <!-- Tasks Section -->
      <div class="tracker-section">
        <div class="tracker-section-head">
          <h4 class="tracker-section-title">Tasks (${(tasks || []).length})</h4>
          <button class="tracker-btn-glass" style="font-size:.78rem;padding:5px 12px" onclick="openTaskModal('${subject.id}')">+ New Task</button>
        </div>
        ${tasks && tasks.length > 0 ? `
          <div class="tracker-tasks-list">
            ${tasks.map((t, idx) => `
              <div class="tracker-task-item ${t.is_done ? 'is-done' : ''}" id="task-row-${t.id}">
                <button type="button" class="tracker-checkbox ${t.is_done ? 'checked' : ''}" id="task-cb-${t.id}" onclick="toggleTaskDone('${t.id}', ${t.is_done ? 'true' : 'false'})">
                  ${t.is_done ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                </button>
                <div class="task-title-text" id="task-title-${t.id}">${escapeHtml(t.title)}</div>
                ${t.est_minutes ? `<span class="task-meta-tag">⏱️ ${t.est_minutes}m</span>` : ''}
                ${t.due_date ? `<span class="task-meta-tag ${t.due_date < getTodayIST() && !t.is_done ? 'overdue' : ''}">Due ${t.due_date}</span>` : ''}
                <div class="task-actions-group">
                  ${idx > 0 ? `<button class="task-icon-btn" title="Move Up" onclick="reorderTask('${t.id}', '${tasks[idx-1].id}', ${t.sort_order || 0}, ${tasks[idx-1].sort_order || 0}, '${subject.id}')">▲</button>` : ''}
                  ${idx < tasks.length - 1 ? `<button class="task-icon-btn" title="Move Down" onclick="reorderTask('${t.id}', '${tasks[idx+1].id}', ${t.sort_order || 0}, ${tasks[idx+1].sort_order || 0}, '${subject.id}')">▼</button>` : ''}
                  <button class="task-icon-btn" title="Edit Task" onclick="openTaskModal('${subject.id}', '${t.id}', '${escapeHtml(t.title)}', '${t.due_date || ''}', ${t.est_minutes || ''})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  <button class="task-icon-btn delete" title="Delete Task" onclick="deleteTask('${t.id}', '${subject.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty" style="padding:24px"><p>No tasks yet for this subject. Add your first task above!</p></div>
        `}
      </div>

      <!-- Recent Sessions Section (Last 30) -->
      <div class="tracker-section" style="margin-top:32px">
        <div class="tracker-section-head">
          <h4 class="tracker-section-title">Recent Study Sessions (Last 30)</h4>
        </div>
        ${sessions && sessions.length > 0 ? `
          <div class="tracker-tasks-list">
            ${sessions.map(s => `
              <div class="tracker-task-item" style="justify-content:space-between">
                <div>
                  <div style="font-weight:700;color:var(--ink);font-size:.92rem">
                    ⏱️ <b>${s.minutes} minutes</b> on ${s.session_date}
                  </div>
                  ${s.note ? `<div style="font-size:.82rem;color:var(--muted);margin-top:3px">${escapeHtml(s.note)}</div>` : ''}
                </div>
                <button class="task-icon-btn delete" title="Delete session" onclick="deleteStudySession('${s.id}', '${subject.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty" style="padding:24px"><p>No study sessions logged for this subject yet.</p></div>
        `}
      </div>
    `;

    container.innerHTML = html;
  } catch(err) {
    handleTrackerError(err, 'Failed to load subject details.');
  }
}

// Reordering tasks via sort_order
async function reorderTask(taskIdA, taskIdB, orderA, orderB, subjectId) {
  try {
    const studentId = await getAuthStudentId();
    // Swap order values
    const newOrderA = orderB || 1;
    const newOrderB = orderA || 0;

    await sb.from('student_tasks').update({ sort_order: newOrderA }).eq('id', taskIdA).eq('student_id', studentId);
    await sb.from('student_tasks').update({ sort_order: newOrderB }).eq('id', taskIdB).eq('student_id', studentId);

    const container = document.getElementById('trackerTabBody');
    if (container) renderSubjectDetailView(container, subjectId);
  } catch(err) {
    handleTrackerError(err, 'Could not reorder tasks.');
  }
}

async function deleteTask(taskId, subjectId) {
  if (!confirm('Are you sure you want to delete this task? (Your logged study sessions will be kept).')) return;
  try {
    const studentId = await getAuthStudentId();
    const { error } = await sb.from('student_tasks').delete().eq('id', taskId).eq('student_id', studentId);
    if (error) throw error;
    showToast('Task deleted.', 'info');
    await refreshTracker();
    const container = document.getElementById('trackerTabBody');
    if (container) renderSubjectDetailView(container, subjectId);
  } catch(err) {
    handleTrackerError(err, 'Could not delete task.');
  }
}

async function deleteStudySession(sessionId, subjectId) {
  if (!confirm('Delete this study session?')) return;
  try {
    const studentId = await getAuthStudentId();
    const { error } = await sb.from('study_sessions').delete().eq('id', sessionId).eq('student_id', studentId);
    if (error) throw error;
    showToast('Session deleted.', 'info');
    await refreshTracker();
    const container = document.getElementById('trackerTabBody');
    if (container) renderSubjectDetailView(container, subjectId);
  } catch(err) {
    handleTrackerError(err, 'Could not delete study session.');
  }
}

// ---------- TAB 3: 7-DAY PROGRESS & CHARTS ----------
async function renderTrackerProgressView(container, overview) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Calculating 7-day progress...</p></div>';

  try {
    const studentId = await getAuthStudentId();

    const { data: sessions, error } = await sb.from('study_sessions')
      .select('minutes, session_date, subject_id, student_subjects(name, color)')
      .eq('student_id', studentId)
      .order('session_date', { ascending: false })
      .limit(200);
    if (error) throw error;

    // Group last 7 days in Indian Standard Time (IST)
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const dayLabel = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric' });
      days.push({ date: dateStr, label: dayLabel, minutes: 0 });
    }

    (sessions || []).forEach(s => {
      const match = days.find(d => d.date === s.session_date);
      if (match) {
        match.minutes += (s.minutes || 0);
      }
    });

    const maxMins = Math.max(...days.map(d => d.minutes), 60);

    // Per subject totals
    const subTotals = {};
    (sessions || []).forEach(s => {
      const subName = s.student_subjects?.name || 'General';
      const color = s.student_subjects?.color || '#e11d48';
      if (!subTotals[subName]) subTotals[subName] = { minutes: 0, color };
      subTotals[subName].minutes += (s.minutes || 0);
    });

    let html = `
      <div style="margin-bottom:28px">
        <h3 style="font-size:1.3rem;font-weight:800;letter-spacing:-.015em;color:var(--ink)">7-Day Study Progress</h3>
        <p style="font-size:.85rem;color:var(--muted)">Your daily study minutes over the last 7 calendar days.</p>
      </div>

      <div class="tracker-card" style="padding:24px 20px 16px;margin-bottom:28px">
        <div class="tracker-chart-container">
          ${days.map(d => {
            const barH = Math.max(4, Math.round((d.minutes / maxMins) * 120));
            return `
              <div class="chart-bar-col">
                <span class="chart-bar-value">${d.minutes > 0 ? d.minutes + 'm' : ''}</span>
                <div class="chart-bar-pill" style="height:${barH}px"></div>
                <span class="chart-bar-label">${d.label}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Per Subject Totals -->
      <div class="tracker-section">
        <h4 class="tracker-section-title" style="margin-bottom:14px">Total Time Per Subject</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">
          ${Object.entries(subTotals).length > 0 ? Object.entries(subTotals).map(([name, data]) => `
            <div class="tracker-card" style="padding:16px 18px;border-left:4px solid ${data.color}">
              <div style="font-size:.88rem;font-weight:800;color:var(--ink)">${escapeHtml(name)}</div>
              <div style="font-size:1.3rem;font-weight:900;color:var(--rose-700);margin-top:4px">
                ${data.minutes} <span style="font-size:.82rem;font-weight:600;color:var(--muted)">minutes</span>
              </div>
            </div>
          `).join('') : '<p style="color:var(--muted);font-size:.88rem">No sessions logged yet.</p>'}
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch(err) {
    handleTrackerError(err, 'Failed to calculate progress chart.');
  }
}

// ---------- TAB 4: SETTINGS VIEW ----------
function renderTrackerSettingsView(container, overview) {
  const dailyHours = overview.daily_goal_minutes ? (overview.daily_goal_minutes / 60) : 3;

  container.innerHTML = `
    <div style="max-width:640px;background:var(--card);border:1px solid var(--line);border-radius:var(--r-md);padding:clamp(20px,4vw,32px);box-shadow:var(--shadow-sm)">
      <h3 style="font-size:1.25rem;font-weight:800;letter-spacing:-.015em;color:var(--ink);margin-bottom:6px">Study Goals & Target Settings</h3>
      <p style="font-size:.85rem;color:var(--muted);margin-bottom:24px">Adjust your daily study target or change your board exam date.</p>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Daily Study Target (Hours)</label>
        <div style="display:flex;align-items:center;gap:16px;background:var(--rose-50);padding:14px 18px;border-radius:var(--r-sm);border:1px solid rgba(225,29,72,.15)">
          <input type="range" id="settingsDailyHours" min="0.5" max="16" step="0.5" value="${dailyHours}" style="flex:1" oninput="document.getElementById('settingsHoursVal').textContent = this.value + ' hrs/day'">
          <span id="settingsHoursVal" style="font-size:1.15rem;font-weight:900;color:var(--rose-700);min-width:100px;text-align:right">${dailyHours} hrs/day</span>
        </div>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Target Exam Date</label>
        <div style="display:flex;gap:10px">
          <input type="date" id="settingsTargetDate" class="tracker-form-input" value="${overview.target_date || ''}" min="${getTodayIST()}">
          <button type="button" class="tracker-btn-glass" onclick="document.getElementById('settingsTargetDate').value = ''" style="white-space:nowrap;padding:10px 14px">Clear Date</button>
        </div>
      </div>

      <button class="tracker-btn-primary" style="margin-top:20px;padding:12px 28px" onclick="saveTrackerSettings()">
        Save Settings
      </button>
    </div>
  `;
}

async function saveTrackerSettings() {
  const hours = parseFloat(document.getElementById('settingsDailyHours')?.value || '3');
  const targetDate = document.getElementById('settingsTargetDate')?.value || null;

  try {
    const studentId = await getAuthStudentId();
    const { error } = await sb.from('student_study_settings').upsert({
      student_id: studentId,
      daily_hours: hours,
      target_date: targetDate
    }, { onConflict: 'student_id' });
    if (error) throw error;

    showToast('Goals updated successfully! 🎯', 'success');
    await refreshTracker();
  } catch(err) {
    handleTrackerError(err, 'Failed to update settings.');
  }
}

// ---------- TRACKER MODALS ----------
function closeTrackerModal() {
  const modal = document.getElementById('trackerModalOverlay');
  if (modal) modal.remove();
}

// Log Study Time Modal
async function openLogTimeModal(preselectSubjectId = null) {
  closeTrackerModal();
  const overview = window.trackerState.overview;
  const subjects = overview?.subjects || [];

  if (subjects.length === 0) {
    showToast('Please add a subject before logging study time.', 'info');
    openSubjectModal();
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'trackerModalOverlay';
  modal.className = 'tracker-modal-overlay';
  modal.onclick = (e) => { if (e.target === modal) closeTrackerModal(); };

  modal.innerHTML = `
    <div class="tracker-modal-card">
      <div class="tracker-modal-header">
        <h3 class="tracker-modal-title">⏱️ Log Study Time</h3>
        <button class="tracker-modal-close" onclick="closeTrackerModal()">&times;</button>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Subject</label>
        <select id="logModalSubject" class="tracker-form-select" onchange="loadTasksForLogModal(this.value)">
          ${subjects.map(s => `<option value="${s.id}" ${s.id === preselectSubjectId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Related Task (Optional)</label>
        <select id="logModalTask" class="tracker-form-select">
          <option value="">-- No specific task --</option>
        </select>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Study Duration (Minutes)</label>
        <input type="number" id="logModalMinutes" class="tracker-form-input" min="1" max="1440" value="30">
        <div class="tracker-chips-group">
          <button type="button" class="tracker-chip" onclick="document.getElementById('logModalMinutes').value = 15">15m</button>
          <button type="button" class="tracker-chip" onclick="document.getElementById('logModalMinutes').value = 30">30m</button>
          <button type="button" class="tracker-chip" onclick="document.getElementById('logModalMinutes').value = 45">45m</button>
          <button type="button" class="tracker-chip" onclick="document.getElementById('logModalMinutes').value = 60">60m</button>
        </div>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Date (IST)</label>
        <input type="date" id="logModalDate" class="tracker-form-input" value="${getTodayIST()}">
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Notes (Optional)</label>
        <input type="text" id="logModalNote" class="tracker-form-input" placeholder="e.g. Completed Light reflection NCERT Q&A" maxlength="500">
      </div>

      <button class="tracker-btn-primary" style="width:100%;justify-content:center;padding:13px" onclick="submitLogStudyTime()">
        Save Study Session
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  const initSubId = preselectSubjectId || subjects[0]?.id;
  if (initSubId) loadTasksForLogModal(initSubId);
}

async function loadTasksForLogModal(subjectId) {
  const taskSelect = document.getElementById('logModalTask');
  if (!taskSelect) return;
  try {
    const studentId = await getAuthStudentId();
    const { data: tasks } = await sb.from('student_tasks')
      .select('id, title')
      .eq('subject_id', subjectId)
      .eq('student_id', studentId)
      .eq('is_done', false);
    
    taskSelect.innerHTML = '<option value="">-- No specific task --</option>' + 
      (tasks || []).map(t => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join('');
  } catch(e) { /* silent */ }
}

async function submitLogStudyTime() {
  const subjectId = document.getElementById('logModalSubject')?.value;
  const taskId = document.getElementById('logModalTask')?.value || null;
  const minutes = parseInt(document.getElementById('logModalMinutes')?.value || '0', 10);
  const sessionDate = document.getElementById('logModalDate')?.value || getTodayIST();
  const note = (document.getElementById('logModalNote')?.value || '').trim();

  if (!subjectId) { showToast('Please select a subject.', 'error'); return; }
  if (!minutes || minutes <= 0 || minutes > 1440) { showToast('Please enter valid minutes (1 to 1440).', 'error'); return; }

  try {
    const studentId = await getAuthStudentId();
    const { error } = await sb.from('study_sessions').insert({
      student_id: studentId,
      subject_id: subjectId,
      task_id: taskId,
      session_date: sessionDate,
      minutes: minutes,
      note: note || null
    });
    if (error) throw error;

    showToast(`Logged ${minutes} minutes of study! ⏱️`, 'success');
    closeTrackerModal();
    await refreshTracker();
  } catch(err) {
    handleTrackerError(err, 'Failed to log study session.');
  }
}

// Add/Edit Task Modal
function openTaskModal(preselectSubjectId = null, taskId = null, currentTitle = '', currentDue = '', currentEst = '') {
  closeTrackerModal();
  const overview = window.trackerState.overview;
  const subjects = overview?.subjects || [];

  if (subjects.length === 0) {
    showToast('Please add a subject before creating a task.', 'info');
    openSubjectModal();
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'trackerModalOverlay';
  modal.className = 'tracker-modal-overlay';
  modal.onclick = (e) => { if (e.target === modal) closeTrackerModal(); };

  modal.innerHTML = `
    <div class="tracker-modal-card">
      <div class="tracker-modal-header">
        <h3 class="tracker-modal-title">${taskId ? 'Edit Task' : '+ Add Task'}</h3>
        <button class="tracker-modal-close" onclick="closeTrackerModal()">&times;</button>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Subject</label>
        <select id="taskModalSubject" class="tracker-form-select">
          ${subjects.map(s => `<option value="${s.id}" ${s.id === preselectSubjectId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Task Title</label>
        <input type="text" id="taskModalTitle" class="tracker-form-input" placeholder="e.g. Read Life Processes Notes, Solve Ex 3.2" maxlength="200" value="${currentTitle}">
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Due Date (Optional)</label>
        <input type="date" id="taskModalDue" class="tracker-form-input" value="${currentDue}">
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Estimated Minutes (Optional)</label>
        <input type="number" id="taskModalEst" class="tracker-form-input" min="1" max="1440" placeholder="e.g. 45" value="${currentEst}">
      </div>

      <button class="tracker-btn-primary" style="width:100%;justify-content:center;padding:13px" onclick="submitTaskModal('${taskId || ''}', '${preselectSubjectId || ''}')">
        ${taskId ? 'Update Task' : 'Create Task'}
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

async function submitTaskModal(taskId, returnSubjectId) {
  const subjectId = document.getElementById('taskModalSubject')?.value;
  const title = (document.getElementById('taskModalTitle')?.value || '').trim();
  const dueDate = document.getElementById('taskModalDue')?.value || null;
  const estMins = parseInt(document.getElementById('taskModalEst')?.value || '0', 10) || null;

  if (!title) { showToast('Please enter a task title.', 'error'); return; }
  if (!subjectId) { showToast('Please select a subject.', 'error'); return; }

  try {
    const studentId = await getAuthStudentId();
    if (taskId) {
      const { error } = await sb.from('student_tasks').update({
        subject_id: subjectId,
        title: title,
        due_date: dueDate,
        est_minutes: estMins
      }).eq('id', taskId).eq('student_id', studentId);
      if (error) throw error;
      showToast('Task updated.', 'success');
    } else {
      const { error } = await sb.from('student_tasks').insert({
        student_id: studentId,
        subject_id: subjectId,
        title: title,
        due_date: dueDate,
        est_minutes: estMins,
        is_done: false
      });
      if (error) throw error;
      showToast('Task created! 📝', 'success');
    }

    closeTrackerModal();
    await refreshTracker();
    if (returnSubjectId || window.trackerState.activeSubjectId) {
      const container = document.getElementById('trackerTabBody');
      if (container) renderSubjectDetailView(container, returnSubjectId || window.trackerState.activeSubjectId);
    }
  } catch(err) {
    handleTrackerError(err, 'Failed to save task.');
  }
}

// Add/Edit Subject Modal
function openSubjectModal(subjectId = null, currentName = '', currentColor = '#e11d48', currentWeeklyHours = 0) {
  closeTrackerModal();
  const modal = document.createElement('div');
  modal.id = 'trackerModalOverlay';
  modal.className = 'tracker-modal-overlay';
  modal.onclick = (e) => { if (e.target === modal) closeTrackerModal(); };

  modal.innerHTML = `
    <div class="tracker-modal-card">
      <div class="tracker-modal-header">
        <h3 class="tracker-modal-title">${subjectId ? 'Edit Subject' : '+ Add Subject'}</h3>
        <button class="tracker-modal-close" onclick="closeTrackerModal()">&times;</button>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Subject Name</label>
        <input type="text" id="subModalName" class="tracker-form-input" placeholder="e.g. Physics, Chemistry, French" maxlength="60" value="${currentName}">
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Subject Color</label>
        <div style="display:flex;align-items:center;gap:12px">
          <input type="color" id="subModalColor" value="${currentColor}" style="width:52px;height:44px;border:none;border-radius:10px;cursor:pointer;padding:0">
          <div class="tracker-chips-group" style="margin:0">
            <button type="button" class="tracker-chip" style="background:#3b82f6;color:#fff" onclick="document.getElementById('subModalColor').value='#3b82f6'">Blue</button>
            <button type="button" class="tracker-chip" style="background:#10b981;color:#fff" onclick="document.getElementById('subModalColor').value='#10b981'">Green</button>
            <button type="button" class="tracker-chip" style="background:#f59e0b;color:#fff" onclick="document.getElementById('subModalColor').value='#f59e0b'">Amber</button>
            <button type="button" class="tracker-chip" style="background:#8b5cf6;color:#fff" onclick="document.getElementById('subModalColor').value='#8b5cf6'">Purple</button>
            <button type="button" class="tracker-chip" style="background:#ec4899;color:#fff" onclick="document.getElementById('subModalColor').value='#ec4899'">Pink</button>
          </div>
        </div>
      </div>

      <div class="tracker-form-group">
        <label class="tracker-form-label">Weekly Target Hours (Optional, 0-168)</label>
        <input type="number" id="subModalTarget" class="tracker-form-input" min="0" max="168" step="0.5" placeholder="e.g. 5" value="${currentWeeklyHours || ''}">
      </div>

      <button class="tracker-btn-primary" style="width:100%;justify-content:center;padding:13px" onclick="submitSubjectModal('${subjectId || ''}')">
        ${subjectId ? 'Update Subject' : 'Add Subject'}
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

async function submitSubjectModal(subjectId) {
  const name = (document.getElementById('subModalName')?.value || '').trim();
  const color = document.getElementById('subModalColor')?.value || '#e11d48';
  const targetHrs = parseFloat(document.getElementById('subModalTarget')?.value || '0') || null;

  if (!name) { showToast('Please enter a subject name.', 'error'); return; }

  try {
    const studentId = await getAuthStudentId();
    if (subjectId) {
      const { error } = await sb.from('student_subjects').update({
        name: name,
        color: color,
        weekly_target_hours: targetHrs
      }).eq('id', subjectId).eq('student_id', studentId);
      if (error) throw error;
      showToast('Subject updated.', 'success');
    } else {
      const { error } = await sb.from('student_subjects').insert({
        student_id: studentId,
        name: name,
        color: color,
        weekly_target_hours: targetHrs
      });
      if (error) throw error;
      showToast('Subject added! 📚', 'success');
    }

    closeTrackerModal();
    await refreshTracker();
  } catch(err) {
    handleTrackerError(err, 'Failed to save subject.');
  }
}

async function archiveSubject(subjectId, status) {
  try {
    const studentId = await getAuthStudentId();
    const { error } = await sb.from('student_subjects')
      .update({ is_archived: status })
      .eq('id', subjectId)
      .eq('student_id', studentId);
    if (error) throw error;

    showToast(status ? 'Subject archived.' : 'Subject restored.', 'info');
    await refreshTracker(false);
  } catch(err) {
    handleTrackerError(err, 'Failed to update subject archive status.');
  }
}

async function confirmDeleteSubject(subjectId, subjectName) {
  if (!confirm(`Permanently delete "${subjectName}"?\n\nDeleting this subject will also delete all of its tasks and study sessions.\n(Tip: You can Archive it instead to preserve your history).`)) return;

  try {
    const studentId = await getAuthStudentId();
    const { error } = await sb.from('student_subjects')
      .delete()
      .eq('id', subjectId)
      .eq('student_id', studentId);
    if (error) throw error;

    showToast(`Subject "${subjectName}" deleted.`, 'info');
    await refreshTracker(false);
  } catch(err) {
    handleTrackerError(err, 'Failed to delete subject.');
  }
}

async function loadArchivedSubjects(btn) {
  const list = document.getElementById('archivedSubjectsList');
  if (!list) return;

  if (list.style.display === 'block') {
    list.style.display = 'none';
    btn.textContent = 'Show Archived Subjects';
    return;
  }

  list.style.display = 'block';
  list.innerHTML = '<p style="color:var(--muted);font-size:.82rem">Loading archived subjects...</p>';
  btn.textContent = 'Hide Archived Subjects';

  try {
    const studentId = await getAuthStudentId();
    const { data: archived, error } = await sb.from('student_subjects')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_archived', true)
      .order('name');
    if (error) throw error;

    if (!archived || archived.length === 0) {
      list.innerHTML = '<p style="color:var(--muted);font-size:.82rem">No archived subjects.</p>';
      return;
    }

    list.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px">
        ${archived.map(s => `
          <div class="tracker-task-item" style="justify-content:space-between">
            <span style="font-weight:700;color:var(--ink)">${escapeHtml(s.name)}</span>
            <button class="tracker-btn-glass" style="font-size:.78rem;padding:4px 10px" onclick="archiveSubject('${s.id}', false)">Restore</button>
          </div>
        `).join('')}
      </div>
    `;
  } catch(err) {
    list.innerHTML = '<p style="color:var(--muted);font-size:.82rem">Could not load archived subjects.</p>';
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
const chatInputEl = document.getElementById('chatInput');
if (chatInputEl) {
  chatInputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
}

// ===================== INIT =====================
async function bootApp() {
  // Check if running in embedded in-app browser (Instagram / WhatsApp)
  if (window.StudyHubAuth && window.StudyHubAuth.isInAppBrowser()) {
    const notice = document.getElementById('authInAppNotice');
    if (notice) notice.style.display = 'block';
  }

  // Resolve auth session first before loading data
  if (window.StudyHubAuth) {
    try {
      await window.StudyHubAuth.init();
    } catch (e) {
      console.warn('StudyHubAuth init warning:', e);
    }
  }

  const initPath = window.location.pathname.toLowerCase();
  const initHash = window.location.hash.toLowerCase();
  if (initPath.includes('tracker') || initPath.includes('dashboard') || initHash.includes('tracker') || initHash.includes('dashboard')) {
    navigate('dashboard');
  } else {
    loadHome();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
