/* ============================================================
   Moonlit Pages ♡ — app.js
   Toda a lógica da interface. Dados reais vêm de data.js.
   Persistência local (favoritos, lista, avaliações, progresso,
   tema) via localStorage — sem contas, sem servidores.
   ============================================================ */

const STORAGE_KEYS = {
  favorites: "moonlit_favorites",
  wantToRead: "moonlit_want_to_read",
  ratings: "moonlit_ratings",
  history: "moonlit_history",
  theme: "moonlit_theme",
  atmosphere: "moonlit_atmosphere_vjk1",
  letterDate: "jasmyn_letter_date",
  assistantHistory: "jasmyn_assistant_history_v27",
  completed: "moonlit_completed_books_v20",
  daniKi: "dani_ki_v22_1",
  daniPhase: "dani_phase_v22_1",
  daniCycle: "dani_cycle_v22_1",
  mood: "jasmyn_mood_v22",
  surprise: "jasmyn_surprise_v22_1",
  profile: "jasmyn_profile_vjk1",
  profileTheme: "jasmyn_profile_theme_vjk1",
  profileMood: "jasmyn_profile_mood_vjk1",
  profileSparkle: "jasmyn_profile_sparkle_vjk1",
  story: "jasmyn_our_story_v24",
  secretDani: "jasmyn_secret_dani_v24",
  secretOlha: "jasmyn_secret_olha_v24"
};

/* ---------- Helpers de armazenamento ---------- */
function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key)) || []); }
  catch (e) { return new Set(); }
}
function saveSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}
function loadObj(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; }
  catch (e) { return {}; }
}
function saveObj(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

let favorites = loadSet(STORAGE_KEYS.favorites);
let wantToRead = loadSet(STORAGE_KEYS.wantToRead);
let ratings = loadObj(STORAGE_KEYS.ratings);
let readingHistory = loadObj(STORAGE_KEYS.history); // { id: { lastVisited: ts } }
let completed = loadSet(STORAGE_KEYS.completed);
const DANI_PHASES_PER_CYCLE = 10;
const DANI_READS_PER_PHASE = 2;
const DANI_READS_PER_CYCLE = DANI_PHASES_PER_CYCLE * DANI_READS_PER_PHASE;
let daniCycle = Math.max(1, Number(localStorage.getItem(STORAGE_KEYS.daniCycle) || 1));
let daniPhase = 0;
let daniKi = 0;


const bookById = Object.fromEntries(BOOKS.map(b => [b.id, b]));

/* ---------- Toasts ---------- */
let toastTimer = null;
function showToast(message) {
  if (!message) return;
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ---------- Tema ---------- */
const ATMOSPHERES = {
  light:{icon:"☀️",label:"Claro"},
  dark:{icon:"🌙",label:"Escuro"},
  rain:{icon:"🌧️",label:"Chuva"},
  nightcity:{icon:"🌃",label:"Night City"},
  galaxy:{icon:"🌌",label:"Galáxia"},
  sunset:{icon:"🌅",label:"Atardecer"},
  marine:{icon:"🌊",label:"Marinho"},
  depth3d:{icon:"🪐",label:"3D"},
  passion:{icon:"😏",label:"Jasmyn… 😏"}
};
function applyAtmosphere(mode){
  if(!ATMOSPHERES[mode]) mode="dark";
  const root=document.documentElement;
  root.dataset.theme = mode === "light" ? "light" : "dark";
  root.dataset.atmosphere = mode;
  if(document.body) document.body.dataset.atmosphere = mode;
  localStorage.setItem(STORAGE_KEYS.theme, mode === "light" ? "light" : "dark");
  localStorage.setItem(STORAGE_KEYS.atmosphere, mode);
  const btn=document.getElementById("themeToggle");
  const menu=document.getElementById("appearanceMenu");
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute("content", mode==="light"?"#faf3f8":mode==="rain"?"#0b151d":mode==="nightcity"?"#080711":mode==="galaxy"?"#08051a":mode==="sunset"?"#21101a":mode==="marine"?"#06151d":mode==="depth3d"?"#080a12":mode==="passion"?"#16070c":"#0c0a14");
  if(btn){
    btn.textContent=ATMOSPHERES[mode].icon;
    btn.setAttribute("aria-label",`Aparência: ${ATMOSPHERES[mode].label}`);
  }
  document.querySelectorAll(".appearance-menu [data-atmosphere]").forEach(b=>b.classList.toggle("active",b.dataset.atmosphere===mode));
}
function closeAppearanceMenu(){
  const menu=document.getElementById("appearanceMenu"),btn=document.getElementById("themeToggle");
  if(menu){menu.classList.remove("open");menu.setAttribute("aria-hidden","true");}
  if(btn)btn.setAttribute("aria-expanded","false");
}
function initTheme(){
  const saved=localStorage.getItem(STORAGE_KEYS.atmosphere)||localStorage.getItem("moonlit_atmosphere_v27")||localStorage.getItem("moonlit_atmosphere_v26")||localStorage.getItem("moonlit_atmosphere_v24_1_2")||localStorage.getItem(STORAGE_KEYS.theme)||"dark";
  applyAtmosphere(ATMOSPHERES[saved]?saved:"dark");
  const btn=document.getElementById("themeToggle"),menu=document.getElementById("appearanceMenu");
  if(btn){btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();if(!menu)return;const open=!menu.classList.contains("open");menu.classList.toggle("open",open);menu.setAttribute("aria-hidden",String(!open));btn.setAttribute("aria-expanded",String(open));});}
  // Toque robusto: os itens têm listener direto de click.
  // Evita que preventDefault em pointerup suprima o click no Chrome Android.
  if(menu){
    menu.querySelectorAll("[data-atmosphere]").forEach(choice=>{
      choice.addEventListener("click",e=>{
        e.preventDefault();
        e.stopPropagation();
        const mode=choice.dataset.atmosphere;
        if(ATMOSPHERES[mode]) applyAtmosphere(mode);
        closeAppearanceMenu();
      });
    });
  }
  document.addEventListener("pointerdown",e=>{
    if(!e.target.closest(".appearance-control")) closeAppearanceMenu();
  },true);
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape") closeAppearanceMenu();
    if((e.key==="Enter"||e.key===" ") && document.activeElement?.matches("[data-atmosphere]")){
      e.preventDefault();
      const mode=document.activeElement.dataset.atmosphere;
      if(ATMOSPHERES[mode]){applyAtmosphere(mode);closeAppearanceMenu();}
    }
  });
}

/* ---------- Mensagens do topo: trocam a cada 7s com fade suave ---------- */
const LOVE_VISIT_KEY = "jasmyn_love_cycle_v13";
const LOVE_TITLE_LIST = (typeof LOVE_TITLES !== "undefined" && LOVE_TITLES.length) ? LOVE_TITLES : ["My love ♡"];
const WELCOME_QUOTE_LIST = (typeof WELCOME_QUOTES !== "undefined" && WELCOME_QUOTES.length) ? WELCOME_QUOTES : ["Boa leitura, Jasmyn ♡"];
let loveIndex = Number(localStorage.getItem(LOVE_VISIT_KEY) || 0);
if (!Number.isFinite(loveIndex) || loveIndex < 0) loveIndex = 0;
loveIndex %= LOVE_TITLE_LIST.length;
let quoteIndex = loveIndex % WELCOME_QUOTE_LIST.length;
function setFadeText(el, value){
  if(!el) return;
  el.classList.remove("text-fade-swap");
  void el.offsetWidth;
  el.textContent = value;
  el.classList.add("text-fade-swap");
}
const DAILY_GREETINGS = [
  "Oi, vidinha","Oi, besta fera 😂","Oi, mor","Oi, princesinha 👑","Oi, piolhenta 😂","Oi, fofoqueira 👀","Oi, linda 🌹","Oi, minha doida 🤭","Oi, florzinha 🌸","Oi, minha rainha 👑","Oi, pequena","Oi, encrenca 😂","Oi, coisa linda","Oi, senhorita 😌","Oi, minha peste 🤭","Oi, bonita 🌷","Oi, dengosa","Oi, minha princesa 👑","Oi, minha implicante 😂","Oi, amorzinho","Oi, criatura 😏","Oi, minha maluquinha 😂","Oi, meu bem","Oi, minha linda demais 🌹","Oi, minha favorita","Oi, fofoqueira oficial 👀","Oi, minha vidinha 🌸","Oi, dona da razão 😂","Oi, minha querida","Oi, pestezinha 😌"];
function getDailyGreeting(){return DAILY_GREETINGS[hashString(localDateKey()+"|jasmyn-greeting-v1")%DAILY_GREETINGS.length];}
function setLoveMessage(updateGreeting=true){
  const brand=document.getElementById("loveTitle");
  if(brand) brand.textContent="Meu amor ♡";
  if(updateGreeting){
    const greeting=document.querySelector(".hero-greeting");
    if(greeting) greeting.innerHTML=`${escapeHtml(getDailyGreeting())} <span class="heart">♡</span>`;
  }
  setFadeText(document.getElementById("welcomeQuote"), WELCOME_QUOTE_LIST[quoteIndex]);
  localStorage.setItem(LOVE_VISIT_KEY, String(loveIndex));
}
function advanceLoveMessages(){
  loveIndex = (loveIndex + 1) % LOVE_TITLE_LIST.length;
  quoteIndex = (quoteIndex + 1) % WELCOME_QUOTE_LIST.length;
  setLoveMessage(false);
}
setLoveMessage();
let loveTimer = null;
function startLoveTimer(){
  if(loveTimer || document.hidden) return;
  loveTimer = setInterval(advanceLoveMessages, 7000);
}
function stopLoveTimer(){ if(loveTimer){ clearInterval(loveTimer); loveTimer=null; } }
startLoveTimer();
document.addEventListener("visibilitychange",()=>{ if(document.hidden){ stopLoveTimer(); stopDaniPhraseTimer(); stopCarouselTimer(); } else { startLoveTimer(); startDaniPhraseTimer(); startCarouselTimer(); } });
/* ---------- Cartinha do dia: uma nova carta por data, inclusive sem recarregar a página ---------- */
const LETTER_STATE_KEY = "jasmyn_daily_letter_v11";
function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function readLetterState() {
  try { return JSON.parse(localStorage.getItem(LETTER_STATE_KEY) || "null") || {}; }
  catch (_) { return {}; }
}
function getLetterOfDay() {
  const key = localDateKey();
  const state = readLetterState();
  let index = Number(state.index);
  if (!Number.isInteger(index) || index < 0 || index >= DAILY_LETTERS.length || state.date !== key) {
    index = hashString(key + "|jasmyn-daily-letter") % DAILY_LETTERS.length;
    localStorage.setItem(LETTER_STATE_KEY, JSON.stringify({date:key, index}));
  }
  const base = DAILY_LETTERS[index];
  const loveLine = DAILY_LOVE_LINES[hashString(key + "|jasmyn-love-line") % DAILY_LOVE_LINES.length];
  return { ...base, loveLine, key, index };
}
function renderDailyLetter() {
  const letter = getLetterOfDay();
  const text = document.getElementById("letterText");
  if (!text) return;
  const name = (typeof profileData !== "undefined" && profileData?.name) ? profileData.name : "Jasmyn";
  text.textContent = `${name}, ${letter.text || "que hoje seu coração encontre uma história bonita para você."}`;
}

function refreshDailyLetterIfNeeded() {
  const state = readLetterState();
  if (state.date !== localDateKey()) renderDailyLetter();
}

/* ---------- Construção de cartões ---------- */
function hasOriginalCover(book) {
  const src = String(book?.cover || "");
  return /^(https?:\/\/)/i.test(src) || /(?:^|\/)assets\/original(?:\/|$)/i.test(src);
}

function coverInner(book, loadingOverride = null) {
  const fallbackInner = `<span class="moon">✦</span><span class="fallback-title">${escapeHtml(book.title)}</span>`;
  const eager = loadingOverride || (book.featured ? "eager" : "lazy");
  const priority = eager === "eager" ? "high" : "low";
  const media = book.cover
    ? `<img src="${escapeHtml(book.cover)}" alt="Capa oficial de ${escapeHtml(book.title)}" loading="${eager}" decoding="async" fetchpriority="${priority}" sizes="(max-width: 600px) 45vw, 190px" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false;"><span class="cover-fallback" hidden>${fallbackInner}</span>`
    : `<span class="cover-fallback">${fallbackInner}</span>`;
  return media;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}

function starString(n) {
  n = n || 0;
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function renderCard(book) {
  const isFav = favorites.has(book.id);
  const isWant = wantToRead.has(book.id);
  const rating = ratings[book.id] || 0;
  const card = document.createElement("article");
  card.className = "card book-card-modern";
  card.dataset.id = book.id;
  card.innerHTML = `
    <div class="book-card-cover card-cover" data-open="${book.id}">
      ${coverInner(book)}
      <span class="book-spine" aria-hidden="true"></span>
    </div>
    <div class="card-body book-card-content">
      <div class="book-card-topline"><span>${escapeHtml(book.platform || "Fonte oficial")}</span><span>${/PT-BR/i.test(book.language || "") ? "PT-BR ✓" : "PT"}</span></div>
      <p class="card-title">${escapeHtml(book.title)}</p>
      <p class="card-genre">${escapeHtml(book.genres[0] || "")}</p>
      <p class="book-short-desc">${escapeHtml(book.synopsis).slice(0, 150)}${book.synopsis.length > 150 ? "…" : ""}</p>
      <div class="card-tags">${book.tags.slice(0, 3).map(t => `<span>${escapeHtml(t)}</span>`).join("")}</div>
      <div class="book-card-bottom"><span class="stars">${starString(rating)}</span><button class="card-fav-inline ${isFav ? "active" : ""}" data-fav="${book.id}" aria-label="Favoritar" aria-pressed="${isFav}">${isFav ? "♥" : "♡"}</button></div>
      <div class="card-actions"><button class="btn btn-primary" data-read="${book.id}">${/PT-BR oficial confirmado/i.test(book.language || "") ? "Ler em PT-BR" : "Abrir fonte oficial"}</button><button class="card-mini-btn ${isWant ? "active" : ""}" data-want="${book.id}" aria-label="Quero ler" aria-pressed="${isWant}">📌</button><button class="card-complete-btn ${completed.has(book.id) ? "active" : ""}" data-complete="${book.id}" aria-label="Marcar como concluída" aria-pressed="${completed.has(book.id)}">${completed.has(book.id) ? "✓ Acabou" : "✓ Acabei"}</button></div>
    </div>`;
  return card;
}

function renderShelf(container, list) {
  if (!container) return false;
  const fragment = document.createDocumentFragment();
  list.forEach(b => fragment.appendChild(renderCard(b)));
  container.replaceChildren(fragment);
  return list.length > 0;
}

function renderGrid(container, list, emptyEl) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  list.forEach(b => fragment.appendChild(renderCard(b)));
  container.replaceChildren(fragment);
  if (emptyEl) emptyEl.classList.toggle("hidden", list.length > 0);
}

/* ---------- Estantes pessoais: sempre renderizadas a partir do estado atual ---------- */
function booksFromSet(set) {
  return [...set].map(id => bookById[id]).filter(Boolean);
}
function renderContinueReading() {
  const section = document.getElementById("continueSection");
  const shelf = document.getElementById("continueShelf");
  if (!section || !shelf) return;
  const list = Object.entries(readingHistory)
    .map(([id, meta]) => ({ book: bookById[id], time: Number(meta?.lastVisited || 0) }))
    .filter(x => x.book)
    .sort((a,b) => b.time - a.time)
    .slice(0, 6)
    .map(x => x.book);
  section.classList.toggle("hidden", list.length === 0);
  renderShelf(shelf, list);
}
function renderFavoritesPreview() {
  const section = document.getElementById("favoritesPreviewSection");
  const shelf = document.getElementById("favoritesShelf");
  if (!section || !shelf) return;
  const list = booksFromSet(favorites).slice(0, 6);
  section.classList.toggle("hidden", list.length === 0);
  renderShelf(shelf, list);
}
function renderRecommendations() {
  const section = document.getElementById("recommendedSection");
  const shelf = document.getElementById("recommendedShelf");
  if (!section || !shelf) return;
  const chosen = booksFromSet(new Set([...favorites, ...wantToRead]));
  const signals = new Set(chosen.flatMap(b => [...(b.genres || []), ...(b.tags || [])].map(normalizeText)));
  const pool = BOOKS.filter(b => hasOriginalCover(b) && !favorites.has(b.id) && !wantToRead.has(b.id) && !completed.has(b.id));
  const ranked = pool.map(b => {
    const hay = [...(b.genres || []), ...(b.tags || [])].map(normalizeText);
    const score = hay.reduce((n, x) => n + (signals.has(x) ? 3 : 0), 0) + (b.featured ? 1 : 0);
    return { b, score, tie: hashString(localDateKey() + "|recommend|" + b.id) };
  }).sort((a,b) => b.score - a.score || a.tie - b.tie).slice(0, 6).map(x => x.b);
  section.classList.toggle("hidden", ranked.length === 0);
  renderShelf(shelf, ranked);
}
function renderMyList() {
  const favGrid = document.getElementById("favoritesGrid");
  const wantGrid = document.getElementById("wantGrid");
  const emptyFav = document.getElementById("emptyFavorites");
  const emptyWant = document.getElementById("emptyWant");
  const favs = booksFromSet(favorites);
  const wants = booksFromSet(wantToRead);
  renderGrid(favGrid, favs, emptyFav);
  renderGrid(wantGrid, wants, emptyWant);
  if (emptyFav) emptyFav.classList.toggle("hidden", favs.length > 0);
  if (emptyWant) emptyWant.classList.toggle("hidden", wants.length > 0);
  const favCount = document.querySelector("#minha-lista .list-fav-count");
  const wantCount = document.querySelector("#minha-lista .list-want-count");
  if (favCount) favCount.textContent = `${favs.length} ${favs.length === 1 ? "história guardada" : "histórias guardadas"}`;
  if (wantCount) wantCount.textContent = `${wants.length} ${wants.length === 1 ? "história esperando" : "histórias esperando"}`;
}

/* ---------- Delegação de eventos para cartões ---------- */
document.addEventListener("click", (e) => {
  const favBtn = e.target.closest("[data-fav]");
  if (favBtn) {
    toggleFavorite(favBtn.dataset.fav);
    return;
  }
  const wantBtn = e.target.closest("[data-want]");
  if (wantBtn) {
    toggleWant(wantBtn.dataset.want);
    return;
  }
  const readBtn = e.target.closest("[data-read]");
  if (readBtn) {
    openReadLink(readBtn.dataset.read);
    return;
  }
  const completeBtn = e.target.closest("[data-complete]");
  if (completeBtn) {
    toggleCompleted(completeBtn.dataset.complete);
    return;
  }
  const coverEl = e.target.closest("[data-open]");
  if (coverEl) {
    openModal(coverEl.dataset.open);
    return;
  }
});

function toggleFavorite(id) {
  const wasFav = favorites.has(id);
  if (wasFav) favorites.delete(id); else favorites.add(id);
  saveSet(STORAGE_KEYS.favorites, favorites);
  showToast(wasFav ? "♡ Removido dos favoritos" : "♥ Adicionado aos favoritos");
  document.querySelectorAll(`[data-fav="${id}"]`).forEach(btn => {
    btn.classList.toggle("active", !wasFav);
    btn.textContent = !wasFav ? "♥" : "♡";
    btn.classList.add("pop");
    setTimeout(() => btn.classList.remove("pop"), 350);
  });
  if (id === currentModalId) updateModalButtons();
  refreshPersonalShelves(); updateJasmynStats();
}

function toggleWant(id) {
  const wasWant = wantToRead.has(id);
  if (wasWant) wantToRead.delete(id); else wantToRead.add(id);
  saveSet(STORAGE_KEYS.wantToRead, wantToRead);
  showToast(wasWant ? "📌 Removido de Quero ler" : "📌 Adicionado a Quero ler");
  document.querySelectorAll(`[data-want="${id}"]`).forEach(btn => { btn.classList.toggle("active", !wasWant); btn.setAttribute("aria-pressed", String(!wasWant)); });
  if (id === currentModalId) updateModalButtons();
  refreshPersonalShelves(); updateJasmynStats();
}

const DANI_PHASES_V22 = [
  {phase:0, title:"Aquecendo o Ki", subtitle:"A jornada está começando…", line:"Cada história concluída vai despertar um pouco mais do seu poder."},
  {phase:1, title:"Poderosa leitora", subtitle:"FASE 1 · O KI DESPERTOU", line:"Parabéns, Jasmyn! Você agora é uma poderosa leitora. O primeiro poder foi desbloqueado. ⚡📚"},
  {phase:2, title:"Leitora guerreira", subtitle:"FASE 2 · PRIMEIRA TRANSFORMAÇÃO", line:"Duas histórias concluídas… e seu Ki já começou a assustar. 🔥📚"},
  {phase:3, title:"Super leitora", subtitle:"FASE 3 · KI EM ASCENSÃO", line:"Você não está apenas lendo. Está ficando forte demais. ⚡✨"},
  {phase:4, title:"Guardiã da biblioteca", subtitle:"FASE 4 · PODER DESBLOQUEADO", line:"A biblioteca já reconhece sua presença. 👑📖"},
  {phase:5, title:"Mestra do Ki", subtitle:"FASE 5 · DOMÍNIO DO PODER", line:"Metade do caminho para os deuses — e você ainda quer mais uma história. 😏⚡"},
  {phase:6, title:"Guerreira lendária", subtitle:"FASE 6 · AURA LENDÁRIA", line:"Seu Ki já não passa despercebido. A lenda começou. 🌟"},
  {phase:7, title:"Super Saiyajin da leitura", subtitle:"FASE 7 · TRANSFORMAÇÃO SUPERIOR", line:"Agora até Shenron ficou de olho no seu ritmo de leitura. 🐉🔥"},
  {phase:8, title:"Divindade da leitura", subtitle:"FASE 8 · KI DIVINO", line:"Poucas leitoras chegam tão longe. Seu Ki já é coisa séria. ✨"},
  {phase:9, title:"Anjo da leitura", subtitle:"FASE 9 · QUASE DIVINO", line:"Mais uma transformação e até os deuses vão ter que abrir espaço. 😌⚡"},
  {phase:10, title:"Nível dos deuses", subtitle:"FASE 10 · KI MÁXIMO", line:"Parabéns, Jasmyn! Você chegou ao nível dos deuses. Seu poder de leitura agora pertence às lendas. 🐉⚡📚"}
];

function getDaniProgressFromCount(count = completed.size){
  const safe=Math.max(0,Number(count)||0);
  const completedPhases=Math.floor(safe / DANI_READS_PER_PHASE);
  if(completedPhases===0) return {cycle:1,phase:0,absolutePhase:0};
  const cycle=Math.floor((completedPhases-1) / DANI_PHASES_PER_CYCLE)+1;
  const phase=((completedPhases-1) % DANI_PHASES_PER_CYCLE)+1;
  return {cycle,phase,absolutePhase:completedPhases};
}
function getDaniPhase(){ return getDaniProgressFromCount().phase; }
function getDaniPhaseInfo(phase=daniPhase){ return DANI_PHASES_V22[phase] || DANI_PHASES_V22[0]; }
function syncDaniProgress(showMilestone=false, completedTitle=""){
  const previousPhase=daniPhase, previousCycle=daniCycle;
  const next=getDaniProgressFromCount();
  daniPhase=next.phase; daniCycle=next.cycle; daniKi=daniPhase*10;
  localStorage.setItem(STORAGE_KEYS.daniPhase,String(daniPhase));
  localStorage.setItem(STORAGE_KEYS.daniKi,String(daniKi));
  localStorage.setItem(STORAGE_KEYS.daniCycle,String(daniCycle));
  updateDaniKiUI();
  const crossed = next.absolutePhase > getDaniProgressFromCount(Math.max(0,completed.size-1)).absolutePhase;
  if(showMilestone && (daniPhase>previousPhase || daniCycle>previousCycle || (daniPhase===10 && completed.size%DANI_READS_PER_PHASE===0))) showDaniPhaseCelebration(daniPhase, completedTitle);
  return daniPhase;
}
function updateDaniKiUI(){
  const bar=document.getElementById("daniKiBar"), value=document.getElementById("daniKiValue"), text=document.getElementById("daniKiText"), cycleEl=document.getElementById("daniCycleValue"), btn=document.getElementById("daniKiBtn");
  const phase=getDaniPhaseInfo();
  if(bar)bar.style.width=`${daniKi}%`;
  if(value)value.textContent=`${daniKi}%`;
  if(cycleEl)cycleEl.textContent=`CICLO ${daniCycle}`;
  if(text){
    if(daniPhase>=10) text.textContent=`NÍVEL DOS DEUSES · CICLO ${daniCycle}. Mais 2 leituras e um novo ciclo desperta. 🐉⚡`;
    else { const remaining=DANI_READS_PER_PHASE-(completed.size%DANI_READS_PER_PHASE); text.textContent=`${phase.title} · ${remaining===1?"falta 1 leitura":"faltam "+remaining+" leituras"} para a próxima fase. · Ciclo ${daniCycle}`; }
  }
  if(btn){btn.textContent=daniPhase>=10?"⚡ LIBERAR ENERGIA · NOVO CICLO":"⚡ LIBERAR ENERGIA";}
  document.querySelector(".dani-ki-meter")?.setAttribute("data-phase",String(daniPhase));
}
function saveDaniKi(){syncDaniProgress(false);}
function pulseDaniKi(){
  const meter=document.querySelector(".dani-ki-meter"); if(!meter)return;
  meter.classList.remove("ki-pulse"); void meter.offsetWidth; meter.classList.add("ki-pulse");
  if(daniPhase>=10) showToast(`⚡ O Ciclo ${daniCycle} chegou ao nível dos deuses. O próximo ciclo desperta com suas próximas 2 leituras.`);
  else showToast(`⚡ Ki liberado: ${getDaniPhaseInfo().title.toLowerCase()} · Ciclo ${daniCycle}.`);
}
function showDaniPhaseCelebration(phase,title){
  const overlay=document.getElementById("daniGodOverlay"); if(!overlay)return;
  const info=getDaniPhaseInfo(phase); overlay.dataset.phase=String(phase); overlay.dataset.cycle=String(daniCycle);
  const kicker=overlay.querySelector(".dani-kicker"), h2=overlay.querySelector("h2"), p=overlay.querySelector("p"), strong=overlay.querySelector("strong"), small=overlay.querySelector("small");
  if(kicker)kicker.textContent=`${info.subtitle} · CICLO ${daniCycle}`;
  if(h2)h2.textContent=phase>=10?"Parabéns, Jasmyn! ✦":`Parabéns, Jasmyn! Fase ${phase} ✦`;
  if(p)p.textContent=phase>=10?info.line:`${info.title}. ${info.line}`;
  if(strong)strong.textContent=phase>=10?`Você chegou ao nível dos deuses no Ciclo ${daniCycle}. ⚡📚`:`Nova transformação desbloqueada no Ciclo ${daniCycle}.`;
  if(small)small.textContent=title?`“${title}” foi a leitura que desbloqueou esta transformação. ${completed.size} obras concluídas.`:`${completed.size} obras concluídas. O próximo poder já está esperando.`;
  const burst=overlay.querySelector(".dani-god-burst"); if(burst){const count=12+phase; burst.innerHTML=Array.from({length:count},(_,i)=>`<i style="--i:${i}">✦</i>`).join("");}
  const card=overlay.querySelector(".dani-god-card"); if(card){card.classList.remove("dani-god-replay");void card.offsetWidth;card.classList.add("dani-god-replay");}
  overlay.classList.add("open"); document.body.style.overflow="hidden";
}

function toggleCompleted(id) {
  const book = bookById[id]; if (!book) return;
  const wasCompleted = completed.has(id);
  if (wasCompleted) {
    completed.delete(id);
    saveSet(STORAGE_KEYS.completed, completed);
    syncDaniProgress(false);
    showToast(`“${book.title}” voltou para a sua lista. ⚡`);
  } else {
    completed.add(id);
    saveSet(STORAGE_KEYS.completed, completed);
    const oldPhase=daniPhase, oldCycle=daniCycle, beforeAbsolute=getDaniProgressFromCount(completed.size-1).absolutePhase;
    syncDaniProgress(false);
    const reachedPhase=(daniPhase!==oldPhase || daniCycle!==oldCycle || getDaniProgressFromCount().absolutePhase>beforeAbsolute);
    showToast(reachedPhase
      ? `✓ “${book.title}” concluído. ${daniPhase>=10?"Nível dos deuses":`Fase ${daniPhase}`} · Ciclo ${daniCycle}! ⚡`
      : `✓ “${book.title}” concluído. ${daniKi}% de Ki.`);
    if(reachedPhase) showDaniPhaseCelebration(daniPhase, book.title);
  }
  document.querySelectorAll(`[data-complete="${CSS.escape(id)}"]`).forEach(btn => {
    const on = completed.has(id);
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "✓ Acabou" : "✓ Acabei";
    if (on && !wasCompleted) {
      btn.classList.remove("complete-pop");
      void btn.offsetWidth;
      btn.classList.add("complete-pop");
    }
  });
  if (id === currentModalId) updateModalButtons();
  refreshPersonalShelves(); updateJasmynStats();
}

function openReadLink(id) {
  const book = bookById[id];
  if (!book) return;
  readingHistory[id] = { lastVisited: Date.now() };
  saveObj(STORAGE_KEYS.history, readingHistory);
  window.open(book.officialUrl, "_blank", "noopener");
  renderContinueReading();
}

/* ---------- Busca + filtros ---------- */
let activeFilter = "todos";
let searchTerm = "";

function matchesFilter(book, filterKey) {
  if (filterKey === "todos") return true;
  const cat = CATEGORIES.find(c => c.key === filterKey);
  if (!cat || !cat.match) return true;
  const haystack = [...book.genres, ...book.tags].map(s => s.toLowerCase());
  return cat.match.some(m => haystack.some(h => h.includes(m.toLowerCase())));
}

function matchesSearch(book, term) {
  if (!term) return true;
  const t = term.toLowerCase();
  const haystack = [
    book.title, book.alternativeTitle, book.author, book.artist,
    ...book.genres, ...book.tags
  ].join(" ").toLowerCase();
  return haystack.includes(t);
}

function getFilteredLibrary() {
  return BOOKS.filter(b => matchesFilter(b, activeFilter) && matchesSearch(b, searchTerm));
}

function renderFilterChips() {
  const wrap = document.getElementById("filterChips");
  wrap.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const chip = document.createElement("button");
    chip.className = "filter-chip" + (cat.key === activeFilter ? " active" : "");
    chip.textContent = `${cat.emoji ? cat.emoji + " " : ""}${cat.label}`;
    chip.addEventListener("click", () => {
      activeFilter = cat.key;
      renderFilterChips();
      ensureLibraryHydrated();
      renderLibrary(true);
    });
    wrap.appendChild(chip);
  });
}

let libraryHydrated=false;
function renderLibrary(full=true){
  const list=getFilteredLibrary();
  const grid=document.getElementById("libraryGrid");
  const empty=document.getElementById("emptyState");
  if(!grid)return;
  const visibleList=full?list:list.slice(0,12);
  renderGrid(grid,visibleList,empty);
  document.getElementById("resultsCount").textContent=`${list.length} obra${list.length===1?"":"s"}`;
  if(full) libraryHydrated=true;
}
function ensureLibraryHydrated(){ if(!libraryHydrated){renderLibrary(true); libraryHydrated=true;} }


let searchRenderTimer=null;
document.getElementById("searchInput").addEventListener("input", (e) => {
  searchTerm = e.target.value.trim();
  clearTimeout(searchRenderTimer);
  searchRenderTimer=setTimeout(renderLibrary, 90);
});

document.getElementById("navSearch").addEventListener("click", () => {
  ensureLibraryHydrated();
  document.getElementById("biblioteca").scrollIntoView({ behavior: "smooth" });
  document.getElementById("searchInput").focus();
});

/* ---------- Categorias: carrosséis editoriais horizontais ---------- */
function categoryList(matchList) {
  return BOOKS.filter(b => {
    const haystack = [...(b.genres || []), ...(b.tags || [])].map(s => String(s).toLowerCase());
    return matchList.some(m => haystack.some(h => h.includes(String(m).toLowerCase())));
  }).filter(b => Boolean(b?.cover));
}

const categoryCarouselState = new Map();

function renderCategoryCarousel(key, matchList) {
  const track = document.getElementById(`categoryTrack-${key}`);
  const dots = document.getElementById(`categoryDots-${key}`);
  if (!track || !dots) return;
  const items = categoryList(matchList).slice(0, 8);
  track.replaceChildren();
  dots.replaceChildren();
  categoryCarouselState.set(key, { index: 0, items });

  items.forEach((book, i) => {
    const slide = document.createElement("article");
    slide.className = "category-slide";
    slide.style.setProperty("--cover-bg", `url("${String(book.cover).replace(/"/g,'\\\"')}")`);
    slide.innerHTML = `
      <button class="category-cover" type="button" data-open="${escapeHtml(book.id)}" aria-label="Abrir ${escapeHtml(book.title)}">
        ${coverInner(book, i<2 ? "eager" : "lazy")}
        <span class="category-cover-sheen" aria-hidden="true"></span>
        <span class="category-cover-edge" aria-hidden="true"></span>
      </button>
      <div class="category-info">
        <div class="category-info-inner">
          <span class="category-platform">${escapeHtml(book.platform || "Fonte oficial")} · ${/PT-BR/i.test(book.language || "") ? "PT-BR ✓" : "PT"}</span>
          <h3>${escapeHtml(book.title)}</h3>
          <p class="category-genre">${escapeHtml((book.genres || [])[0] || "")}</p>
          <p class="category-description">${escapeHtml(book.synopsis || "").slice(0, 180)}${(book.synopsis || "").length > 180 ? "…" : ""}</p>
          <div class="category-tags">${(book.tags || []).slice(0,3).map(t=>`<span>${escapeHtml(t)}</span>`).join("")}</div>
          <div class="category-bottom">
            <span class="stars">${starString(ratings[book.id] || 0)}</span>
            <button class="card-fav-inline ${favorites.has(book.id) ? "active" : ""}" data-fav="${escapeHtml(book.id)}" aria-label="Favoritar" aria-pressed="${favorites.has(book.id)}">${favorites.has(book.id) ? "♥" : "♡"}</button>
          </div>
          <div class="category-actions">
            <button class="btn btn-primary" data-read="${escapeHtml(book.id)}">${/PT-BR oficial confirmado/i.test(book.language || "") ? "Ler em PT-BR" : "Abrir fonte oficial"}</button>
            <button class="category-mini ${wantToRead.has(book.id) ? "active" : ""}" data-want="${escapeHtml(book.id)}" aria-label="Quero ler" aria-pressed="${wantToRead.has(book.id)}">📌</button>
            <button class="category-mini ${completed.has(book.id) ? "active" : ""}" data-complete="${escapeHtml(book.id)}" aria-label="Marcar como concluída" aria-pressed="${completed.has(book.id)}">${completed.has(book.id) ? "✓" : "✓ Acabei"}</button>
          </div>
        </div>
      </div>`;
    track.appendChild(slide);
    const dot = document.createElement("button");
    dot.type="button"; dot.className=i===0?"active":"";
    dot.setAttribute("aria-label",`${i+1} de ${items.length}`);
    dot.addEventListener("click",()=>goCategoryTo(key,i,true));
    dots.appendChild(dot);
  });
  requestAnimationFrame(()=>goCategoryTo(key,0,false));
}

function goCategoryTo(key,index,smooth=true) {
  const track=document.getElementById(`categoryTrack-${key}`);
  const dots=[...document.querySelectorAll(`#categoryDots-${key} button`)];
  const state=categoryCarouselState.get(key);
  if(!track || !state || !track.children.length) return;
  const total=track.children.length;
  state.index=(index+total)%total;
  const slide=track.children[state.index];
  track.scrollTo({left:slide.offsetLeft,behavior:smooth?"smooth":"auto"});
  dots.forEach((d,i)=>d.classList.toggle("active",i===state.index));
}

function initCategoryCarousels(){
  document.querySelectorAll(".category-carousel-section").forEach(section=>{
    const key=section.dataset.category;
    const matches=(section.dataset.matches||"").split(",").filter(Boolean);
    renderCategoryCarousel(key,matches);
    const track=document.getElementById(`categoryTrack-${key}`);
    let scrollTimer;
    track?.addEventListener("scroll",()=>{
      clearTimeout(scrollTimer);
      scrollTimer=setTimeout(()=>{
        const state=categoryCarouselState.get(key);
        if(!state)return;
        let nearest=0,min=Infinity;
        [...track.children].forEach((el,i)=>{const d=Math.abs(track.scrollLeft-el.offsetLeft);if(d<min){min=d;nearest=i;}});
        state.index=nearest;
        document.querySelectorAll(`#categoryDots-${key} button`).forEach((d,i)=>d.classList.toggle("active",i===nearest));
      },60);
    },{passive:true});
    // Swipe nativo: o próprio overflow horizontal + scroll-snap fazem o gesto.
    // Não capturamos touchmove aqui para nunca brigar com o scroll vertical da página.
  });
  document.querySelectorAll("[data-category-prev]").forEach(btn=>btn.addEventListener("click",()=>{
    const k=btn.dataset.categoryPrev,s=categoryCarouselState.get(k); goCategoryTo(k,(s?.index||0)-1,true);
  }));
  document.querySelectorAll("[data-category-next]").forEach(btn=>btn.addEventListener("click",()=>{
    const k=btn.dataset.categoryNext,s=categoryCarouselState.get(k); goCategoryTo(k,(s?.index||0)+1,true);
  }));
}


/* Toque híbrido: o eixo só é decidido depois de alguns pixels.
   Vertical = navegador rola a página. Horizontal = este trilho acompanha o dedo. */
function enableVerticalFriendlySwipe(track,onIndex){
  if(!track || track.dataset.swipeReady) return;
  track.dataset.swipeReady="1";
  let sx=0,sy=0,sl=0,drag=false,axis="",moved=false;
  track.addEventListener("touchstart",e=>{
    const t=e.touches?.[0]; if(!t)return;
    sx=t.clientX; sy=t.clientY; sl=track.scrollLeft; drag=false; axis=""; moved=false;
  },{passive:true});
  track.addEventListener("touchmove",e=>{
    const t=e.touches?.[0]; if(!t)return;
    const dx=t.clientX-sx,dy=t.clientY-sy;
    if(!axis && (Math.abs(dx)>9 || Math.abs(dy)>9)) axis=Math.abs(dx)>Math.abs(dy)?"x":"y";
    if(axis!=="x") return;
    drag=true; moved=true; e.preventDefault();
    track.scrollLeft=sl-dx;
  },{passive:false});
  track.addEventListener("touchend",()=>{
    if(!drag){axis="";return;}
    const state=onIndex?.();
    if(state){
      if(state.key==="__feature__") goCarouselTo(state.index,true);
      else goCategoryTo(state.key,state.index,true);
    }
    setTimeout(()=>{drag=false;axis="";},80);
  },{passive:true});
  track.addEventListener("click",e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false;}},true);
}
/* ---------- Hero destaque ---------- */
function renderHero() {
  const featured = BOOKS.filter(b => b.featured && hasOriginalCover(b));
  const today = localDateKey();
  const requestedToday = today === "2026-09-13" ? bookById["princesa-cabelos-pretos"] : null;
  const pool = featured.length ? featured : BOOKS.filter(hasOriginalCover);
  const heroIndex = hashString(today + "|jasmyn-hero-original-v5") % Math.max(1, pool.length);
  const pick = (requestedToday && hasOriginalCover(requestedToday)) ? requestedToday : pool[heroIndex];
  const title = document.getElementById("heroTitle");
  const desc = document.getElementById("heroDesc");
  const visual = document.getElementById("heroVisual");
  if (!pick || !title || !desc || !visual) return;
  title.textContent = pick.title;
  desc.textContent = (pick.synopsis || "").slice(0, 150) + ((pick.synopsis || "").length > 150 ? "..." : "");
  visual.innerHTML = `<button type="button" class="hero-cover-normal" data-open="${escapeHtml(pick.id)}" aria-label="Abrir ${escapeHtml(pick.title)}"><img src="${escapeHtml(pick.cover)}" alt="Capa original de ${escapeHtml(pick.title)}" loading="eager" decoding="async" fetchpriority="high" referrerpolicy="no-referrer"><span class="hero-cover-shine" aria-hidden="true"></span></button>`;
  const heroImg=visual.querySelector("img");
  heroImg?.addEventListener("error",()=>{
    const fallback=pool.find(b=>b.id!==pick.id && hasOriginalCover(b));
    if(fallback && heroImg.dataset.fallback!="1"){
      heroImg.dataset.fallback="1"; heroImg.src=fallback.cover; heroImg.alt=`Capa original de ${fallback.title}`;
      title.textContent=fallback.title; desc.textContent=(fallback.synopsis||"").slice(0,150)+((fallback.synopsis||"").length>150?"...":"");
      document.getElementById("heroReadBtn").onclick=()=>openReadLink(fallback.id);
      document.getElementById("heroDetailsBtn").onclick=()=>openModal(fallback.id);
    } else {
      visual.classList.add("hero-cover-unavailable");
    }
  },{once:false});
  document.getElementById("heroReadBtn").onclick = () => openReadLink(pick.id);
  document.getElementById("heroDetailsBtn").onclick = () => openModal(pick.id);
}


/* ---------- Carrossel de Jasmyn: capa horizontal, título sobre a imagem ---------- */
let carouselIndex = 0;
let carouselTimer = null;
function renderCarousel() {
  const track = document.getElementById("carouselTrack");
  const dots = document.getElementById("carouselDots");
  if (!track || !dots) return;
  const seed=localDateKey()+"|jasmyn-carousel-v22-1";
  const items = BOOKS.filter(hasOriginalCover).map((b,i)=>({b,i,score:hashString(seed+"|"+b.id)})).sort((a,b)=>b.score-a.score).slice(0,12).map(x=>x.b);
  track.replaceChildren(); dots.replaceChildren();
  items.forEach((b, i) => {
    const slide = document.createElement("button");
    slide.type = "button";
    slide.className = "carousel-slide jasmyn-slide";
    slide.setAttribute("aria-label", `Ver ${b.title}`);
    slide.innerHTML = `<span class="jasmyn-slide-media"><img src="${escapeHtml(b.cover)}" alt="Capa de ${escapeHtml(b.title)}" loading="${i<4?'eager':'lazy'}" decoding="async" fetchpriority="${i<2?'high':'low'}" referrerpolicy="no-referrer"><span class="jasmyn-slide-shade" aria-hidden="true"></span></span><span class="jasmyn-slide-caption"><strong>${escapeHtml(b.title)}</strong><small>${escapeHtml((b.genres||[]).slice(0,2).join(" · "))} · ${escapeHtml(b.platform || "Fonte oficial")}</small></span>`;
    slide.addEventListener("click", () => openModal(b.id));
    track.appendChild(slide);
    const dot = document.createElement("button");
    dot.type = "button"; dot.className = i === 0 ? "active" : "";
    dot.setAttribute("aria-label", `Ir para destaque ${i+1}`);
    dot.addEventListener("click", () => goCarouselTo(i));
    dots.appendChild(dot);
  });
  carouselIndex = Math.min(carouselIndex, Math.max(0, items.length - 1));
  requestAnimationFrame(() => goCarouselTo(carouselIndex, false));
  startCarouselTimer();
}
function goCarouselTo(index, smooth = true) {
  const track = document.getElementById("carouselTrack");
  const dots = [...document.querySelectorAll("#carouselDots button")];
  const total = track?.children.length || 0;
  if (!track || !total) return;
  carouselIndex = (index + total) % total;
  const slide = track.children[carouselIndex];
  track.scrollTo({ left: slide.offsetLeft, behavior: smooth ? "smooth" : "auto" });
  dots.forEach((d,i) => d.classList.toggle("active", i === carouselIndex));
}
function nextCarousel() { goCarouselTo(carouselIndex + 1); }
function startCarouselTimer() {
  if (localStorage.getItem("jasmyn_profile_autoplay_v1")==="0") return;
  if (carouselTimer || document.hidden) return;
  carouselTimer = setInterval(nextCarousel, 8000);
}
function stopCarouselTimer() { if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; } }
const carouselTrackEl = document.getElementById("carouselTrack");
carouselTrackEl?.addEventListener("scroll", () => {
  clearTimeout(window._carouselScrollTimer);
  window._carouselScrollTimer = setTimeout(() => {
    const width = carouselTrackEl.clientWidth || 1;
    carouselIndex = Math.round(carouselTrackEl.scrollLeft / width);
    [...document.querySelectorAll("#carouselDots button")].forEach((d,i) => d.classList.toggle("active", i === carouselIndex));
  }, 70);
}, {passive:true});
document.getElementById("carouselPrev")?.addEventListener("click", () => goCarouselTo(carouselIndex - 1));
document.getElementById("carouselNext")?.addEventListener("click", () => goCarouselTo(carouselIndex + 1));
// Gesto híbrido: só assumimos o dedo quando ele realmente é horizontal.
// Se for vertical, o navegador continua dono da rolagem da página.
if (carouselTrackEl) {
  enableVerticalFriendlySwipe(carouselTrackEl, () => {
    const width = carouselTrackEl.clientWidth || 1;
    return {key:"__feature__", index:Math.round(carouselTrackEl.scrollLeft / width)};
  });
}

/* ---------- Modal de ficha ---------- */
let currentModalId = null;

function openModal(id, fromHistory = false) {
  const book = bookById[id];
  if (!book) return;
  const wasOpen = Boolean(currentModalId);
  currentModalId = id;

  document.getElementById("modalTitle").textContent = book.title;
  document.getElementById("modalAlt").textContent = book.alternativeTitle || "";
  document.getElementById("modalAlt").classList.toggle("hidden", !book.alternativeTitle);

  const meta = document.getElementById("modalMeta");
  meta.innerHTML = [
    book.author ? `Autor(a): ${book.author}` : null,
    book.artist ? `Arte: ${book.artist}` : null,
    ...book.genres,
    book.platform,
    book.status
  ].filter(Boolean).map(m => `<span>${escapeHtml(m)}</span>`).join("");

  document.getElementById("modalSynopsis").textContent = book.synopsis;
  const fit = document.getElementById("modalFit");
  if (fit) {
    const highlights = [...new Set([...(book.genres || []), ...(book.tags || [])])].slice(0, 5);
    fit.innerHTML = `<strong>✨ Por que pode combinar com você</strong><br>${escapeHtml(highlights.join(" · "))}`;
  }
  document.getElementById("modalPreviewTitle").textContent = book.previewTitle || "Prévia";
  document.getElementById("modalPreviewText").textContent = book.preview || book.synopsis;
  document.getElementById("modalPreviewScene").textContent = book.scene || "Uma pequena prévia preparada especialmente para esta página.";
  document.getElementById("modalCharacters").textContent = book.characters ? `Personagens: ${book.characters}` : "";

  const cover = document.getElementById("modalCover");
  cover.querySelectorAll(".fallback-title, img").forEach(n => n.remove());
  if (book.cover) {
    const img = document.createElement("img");
    img.src = book.cover; img.alt = book.title;
    img.onerror = () => { img.remove(); addModalFallback(book); };
    cover.appendChild(img);
  } else {
    addModalFallback(book);
  }

  updateModalButtons();
  renderModalStars();

  document.getElementById("modalReadBtn").textContent = /PT-BR/i.test(book.language || "") ? "▶ Ler em PT-BR" : "▶ Abrir fonte";
  document.getElementById("modalReadBtn").onclick = () => openReadLink(book.id);

  const chaptersEl = document.getElementById("modalChapters");
  chaptersEl.innerHTML = `
    <div class="chapter-row">
      <span>${/PT-BR/i.test(book.language || "") ? "Leitura em português" : "Fonte da obra"}</span>
      <a href="${book.officialUrl}" target="_blank" rel="noopener">${/PT-BR/i.test(book.language || "") ? "Ler em PT-BR ↗" : "Abrir fonte ↗"}</a>
    </div>
    ${book.ptInfoUrl ? `<div class="chapter-row secondary-row">
      <span>Encontrou uma edição brasileira?</span>
      <a href="${book.ptInfoUrl}" target="_blank" rel="noopener">Ver edição PT-BR ↗</a>
    </div>` : ""}`;

  const noteParts = [`Idioma: ${book.language}`];
  if (book.note) noteParts.push(book.note);
  document.getElementById("modalPlatformNote").textContent = noteParts.join(" · ");

  if (!fromHistory) {
    const modalState = { ...(history.state || {}), moonlitModalId: id };
    const url = `#obra=${encodeURIComponent(id)}`;
    if (wasOpen && history.state?.moonlitModalId) history.replaceState(modalState, "", url);
    else history.pushState(modalState, "", url);
  }
  document.getElementById("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function addModalFallback(book) {
  const cover = document.getElementById("modalCover");
  const span = document.createElement("span");
  span.className = "fallback-title";
  span.textContent = book.title;
  cover.appendChild(span);
}

function updateModalButtons() {
  const id = currentModalId;
  const isFav = favorites.has(id);
  const isWant = wantToRead.has(id);
  const favBtn = document.getElementById("modalFavBtn");
  favBtn.textContent = isFav ? "♥ Favoritado" : "♡ Favoritar";
  favBtn.onclick = () => toggleFavorite(id);
  const wantBtn = document.getElementById("modalWantBtn");
  wantBtn.textContent = isWant ? "📌 Na lista" : "📌 Quero ler";
  wantBtn.onclick = () => toggleWant(id);
  const completeBtn = document.getElementById("modalCompleteBtn");
  if (completeBtn) {
    const isDone = completed.has(id);
    completeBtn.textContent = isDone ? "✓ Acabou" : "✓ Acabei";
    completeBtn.classList.toggle("active", isDone);
    completeBtn.setAttribute("aria-pressed", String(isDone));
    completeBtn.onclick = () => toggleCompleted(id);
  }
}

function renderModalStars() {
  const rating = ratings[currentModalId] || 0;
  const stars = [...document.querySelectorAll("#modalStars span")];
  stars.forEach(s => s.classList.toggle("filled", Number(s.dataset.v) <= rating));
}

document.getElementById("modalStars").addEventListener("click", (e) => {
  const star = e.target.closest("span[data-v]");
  if (!star || !currentModalId) return;
  const value = Number(star.dataset.v);
  ratings[currentModalId] = ratings[currentModalId] === value ? 0 : value;
  saveObj(STORAGE_KEYS.ratings, ratings);
  renderModalStars();
  const cardStars = document.querySelector(`.card[data-id="${CSS.escape(currentModalId)}"] .stars`);
  if (cardStars) cardStars.textContent = starString(ratings[currentModalId] || 0);
});

function closeModal(fromHistory = false) {
  if (!fromHistory && history.state?.moonlitModalId) { history.back(); return; }
  document.getElementById("modalOverlay").classList.remove("open");
  currentModalId = null;
  if (typeof syncDocumentScrollLock === "function") syncDocumentScrollLock();
  else document.body.style.removeProperty("overflow");
}
document.getElementById("modalClose").addEventListener("click", () => closeModal());
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "modalOverlay") closeModal();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
window.addEventListener("popstate", (e) => {
  const id = e.state?.moonlitModalId;
  if (id && bookById[id]) openModal(id, true);
  else if (currentModalId) closeModal(true);
  if (e.state?.moonlitProfile) openProfile(true);
  else if (profileOpen) { profileHistoryPushed=false; closeProfile(true); }
});

/* ---------- Assistente de Jasmyn: busca, escolha inteligente e conversa ---------- */
const STOP_WORDS = new Set(["quero","uma","um","umas","uns","de","do","da","dos","das","com","que","tenha","tem","tipo","parecido","parecida","algo","mais","para","por","e","ou","a","o","em","no","na","nos","nas","me","gosto","gostaria","ler"]);
const JASMYN_PROFILE = {
  obsessao:["obsessão","obsessivo","possessivo","possessiva"], perigo:["perigoso","perigosa","tirano","psicopata","ameaça","sombrio"], vinganca:["vingança","vinganca","vingar","retaliação"], traicao:["traição","traicao","traída","traido","divórcio","divorcio"], misterio:["mistério","misterio","segredo","conspiração","conspiracao"], poder:["mulher poderosa","poderosa","vilã","vila","imperatriz","rainha"], familia:["família","familia","pai","filha","adotiva","adoção","adocao","criança","crianca"], duque:["duque","duquesa","conde","nobre"], regressao:["regressão","regressao","segunda vida","voltar no tempo","reencarnação","reencarnacao"], casamento:["casamento","casamento por contrato","noivado","marido","esposa"], romance:["romance","amor","casal","apaixonar","slow burn"], fantasia:["fantasia","magia","realeza","princesa","imperador"]
};
function normalizeText(text){return String(text||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function assistantTokens(text){return normalizeText(text).split(/[^a-z0-9]+/).filter(t=>t&&!STOP_WORDS.has(t));}
function profileHits(text){const n=normalizeText(text),hits=new Set();Object.entries(JASMYN_PROFILE).forEach(([key,words])=>{if(words.some(w=>n.includes(normalizeText(w))))hits.add(key);});return hits;}
function bookProfileScore(book,hits){const hay=normalizeText([book.title,book.alternativeTitle,book.genres.join(" "),book.tags.join(" "),book.synopsis].join(" "));let score=0;const map={obsessao:["obsessão","obsessivo","possessivo"],perigo:["perigoso","dark romance","dominação","tirano"],vinganca:["vingança","revanche"],traicao:["traição","divórcio"],misterio:["mistério","segredo"],poder:["mulher poderosa","vilã","imperatriz"],familia:["família","filha","adotiva","criança"],duque:["duque","conde"],regressao:["regressão","reencarnação","segunda chance"],casamento:["casamento","noivado","esposa"],romance:["romance","slow burn"],fantasia:["fantasia","realeza"]};hits.forEach(h=>(map[h]||[]).forEach(w=>{if(hay.includes(normalizeText(w)))score+=4;}));return score;}
function assistantBookCard(book,reason=""){const thumb=book.cover?`<img src="${escapeHtml(book.cover)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:`✦`;return `<button class="assistant-result" data-assistant-book="${escapeHtml(book.id)}"><span class="assistant-result-cover">${thumb}</span><span><b>${escapeHtml(book.title)}</b><small>${escapeHtml(book.genres.slice(0,3).join(" · "))}${reason?`<br><em>${escapeHtml(reason)}</em>`:""}</small></span></button>`;}
function rankAssistantBooks(query,limit=5){const n=normalizeText(query),hits=profileHits(query),tokens=assistantTokens(query);const scored=BOOKS.map(book=>{const hay=normalizeText([book.title,book.alternativeTitle,book.author,book.artist,...book.genres,...book.tags,book.synopsis].join(" "));let score=bookProfileScore(book,hits);tokens.forEach(t=>{if(hay.includes(t))score+=t.length>4?3:1;});if(n&&normalizeText(book.title).includes(n))score+=10;if(book.featured)score+=1;return{book,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||Number(b.book.featured)-Number(a.book.featured));return{hits,scored,books:scored.slice(0,limit).map(x=>x.book)};}
function compareBooksFromQuery(query){const ranked=rankAssistantBooks(query,8).books;if(ranked.length<2)return null;const[a,b]=ranked,target=profileHits(query),ah=profileHits([a.title,a.genres.join(" "),a.tags.join(" "),a.synopsis].join(" ")),bh=profileHits([b.title,b.genres.join(" "),b.tags.join(" "),b.synopsis].join(" "));const as=[...target].filter(x=>ah.has(x)).length,bs=[...target].filter(x=>bh.has(x)).length;return{a,b,winner:as>=bs?a:b,target};}
function localChooseForMe(){const liked=[...favorites,...wantToRead].map(id=>bookById[id]).filter(Boolean);const moodQuery=profileMood==="poderosa"?"mulher poderosa realeza":profileMood==="curiosa"?"mistério segredo fantasia":profileMood==="dramática"?"drama vingança romance":profileMood==="cansada"?"romance leve fantasia":profileMood==="apaixonada"?"romance amor casal":"romance fantasia";const learned=profileHits(moodQuery);const pool=BOOKS.map(book=>({book,score:bookProfileScore(book,learned)+Number(book.featured||false)*2+(liked.includes(book)?-8:0)})).sort((a,b)=>b.score-a.score);const pick=pool[hashString(localDateKey()+"|choice-for-jasmyn-v24")%Math.min(7,pool.length)]?.book||BOOKS[0];const moodName=(PROFILE_MOODS[profileMood]||PROFILE_MOODS.romântica).title.toLowerCase();return{pick,intro:`Deixa comigo, minha rainha. 👑 Considerei seu humor de hoje (${moodName}), seus gostos e o que você ainda não colocou entre os favoritos. Escolhi uma história para combinar com seu momento. ♡`};}
const ASSISTANT_NAME="Helena";
const ASSISTANT_WELCOME=["Meu nome é Helena. Sou a assistente da rainha. 👑 Pode contar comigo, minha senhora. Estou de plantão para histórias, desabafos, dúvidas ou uma conversa sem compromisso. ♡","Minha rainha, Helena à disposição. ✦ Você fala do seu jeito; eu cuido do resto. Se quiser uma leitura, companhia ou apenas alguém para ouvir, pode me chamar.","Majestade, sua ajudante chegou. 🌹 Não precisa ter uma pergunta perfeita. Conte o que está pensando e vamos descobrir juntas o que você precisa hoje."];
function kevinReaction(query){const n=normalizeText(query);const mentions=/(\bkevin\b|\bdani\b|namorad|meu amor|meu namorado|ele\b|meu homem|marido)/i.test(n);if(!mentions)return null;const negative=/(chato|irritante|odeio|raiva|briga|bravo|insuportavel|bobo|idiota|burro|atrasado|enche|perturba|saco)/i.test(n);const sweet=/(amo|amor|fofo|lindo|linda|saudade|sinto falta|perfeito|perfeita|carinho|beijo|beijao|romantico)/i.test(n);const curious=/(curiosa|cadê|cade|onde|procura|chama|saudade|sumiu)/i.test(n);let emoji=negative?"😠":sweet?"🥰":curious?"👀":"😏";let first=negative?"Opa… parece que alguém acabou de ganhar uma reclamação. 👀":sweet?"Minha rainha, acho que alguém ficou convencido agora…":curious?"Hmm… Vossa Majestade está procurando por um certo alguém? 👀":"Um certo alguém acabou de ser mencionado por aqui. 😏";let variants=negative?["Oqueeee? 😠\nVai lá, me escreve no WhatsApp então. Quero ver se tem coragem. 😏","Como é que é? 😤\nVai lá no WhatsApp falar isso na minha cara. Quero ver a coragem. 😂","Chato? Eu? 😠\nVai lá, me chama no WhatsApp. Quero ouvir essa história toda. 😏"]:sweet?["Tá me procurando? 🥰\nEu sabia que uma hora você ia lembrar de mim. 💗","Falando de mim desse jeito? 😌❤️\nAgora vai lá no WhatsApp e continua, quero ouvir pessoalmente.","Aí você me deixa convencido. 🥰\nMe chama no WhatsApp depois, minha curiosa. 💗"]:curious?["Tá me procurando? 👀\nVai lá me escrever no WhatsApp então. Quero ver se tem coragem. 😏","Você me achou aqui primeiro? 😂\nAgora termina a missão: me chama no WhatsApp.","Olha quem ficou curiosa… 👀\nVai lá no WhatsApp, eu tô esperando."]:["Tá falando de mim? 😏\nVai lá me escrever no WhatsApp então.","Eu ouvi meu nome daqui. 👀\nAgora quero saber o resto no WhatsApp.","Hmmm… interessante. 😏\nContinua essa conversa comigo no WhatsApp."];const msg=variants[hashString(localDateKey()+"|kevin|"+n)%variants.length];return{first,emoji,msg};}
const ASSISTANT_MEMORY_KEY="jasmyn_helena_memory_v27";
function assistantMemory(){const m=loadObj(ASSISTANT_MEMORY_KEY);return {turns:Number(m.turns||0),lastQueries:Array.isArray(m.lastQueries)?m.lastQueries:[]};}
function updateAssistantMemory(query){const m=assistantMemory();m.turns=Math.min(60,m.turns+1);m.lastQueries=[...m.lastQueries,String(query||"").trim().slice(0,120)].filter(Boolean).slice(-8);saveObj(ASSISTANT_MEMORY_KEY,m);}
function assistantConversationResponse(query){const n=normalizeText(query);
  if(/^(oi|ola|oie|bom dia|boa tarde|boa noite|hey)\b/.test(n))return{intro:ASSISTANT_WELCOME[hashString(query)%ASSISTANT_WELCOME.length],books:[],hint:"Pode falar comigo normalmente. ♡"};
  if(/^(como (voce|vc) esta|como (voce|vc) ta|e voce|e vc|e voce)/.test(n))return{intro:"Eu estou bem e de plantão, minha rainha. 👑 E, se você quiser saber de verdade, eu prefiro continuar a conversa em vez de responder só “estou bem”. Me conta como você está também — ou me pergunta qualquer coisa sobre mim.",books:[],hint:"Pode continuar: “e você faria o quê?”, “o que você acha?” ou simplesmente conversar comigo."};
  if(/(como voce esta|como vc esta|como voce ta|como vc ta|tudo bem|como voce se sente|como vc se sente)/.test(n))return{intro:"Estou aqui, atenta a você. 🌷 Não tenho um humor humano do mesmo jeito que você, mas posso conversar com você de verdade, lembrar o contexto desta conversa e te dar uma opinião quando você pedir. E você, como está?",books:[],hint:"Não precisa transformar isso numa pergunta perfeita. Pode responder do seu jeito. ♡"};
  if(/(triste|pra baixo|mal|chor|ansiosa|ansioso|cansada|cansado|estressad|preocupad)/.test(n))return{intro:"Vem cá, minha rainha. 🤍 Não precisa organizar tudo antes de falar comigo. Me conta o que aconteceu; eu posso só ouvir, ajudar a pensar ou tentar distrair você com uma história.",books:[],hint:"Quer desabafar, receber uma opinião ou mudar de assunto?"};
  if(/(briguei|brigamos|discuti|discutimos|problema|confus|ciumes|ciúmes)/.test(n))return{intro:"Entendi. 🌹 Vamos por partes, sem transformar uma conversa difícil em um julgamento. Me conta o que aconteceu e o que você gostaria que ele tivesse entendido.",books:[],hint:"O que mais ficou preso na sua cabeça depois disso?"};
  if(/(feliz|animad|bem hoje|to bem|estou bem|alegre)/.test(n))return{intro:"Aí sim, minha rainha. 🌷 Gosto quando você chega com essa energia. Quer aproveitar para escolher uma história ou ficar conversando comigo?",books:[],hint:"Posso combinar uma leitura com seu humor de hoje."};
  return null;
}
function assistantPersonaIntro(query){const n=normalizeText(query);if(/^(oi|ola|oie|hey|bom dia|boa tarde|boa noite)\b/.test(n))return ASSISTANT_WELCOME[hashString(query)%ASSISTANT_WELCOME.length];if(/(obrigad|valeu|thanks)/.test(n))return"Sempre, minha rainha. 👑 Foi para isso que me chamou. E pode voltar quando quiser; Helena não abandona o posto.";if(/(como voce|como você|quem e voce|quem é você|seu nome|nome)/.test(n))return"Meu nome é Helena. 👑 Sou sua assistente e amiga de confiança nesta biblioteca. Estou aqui para ajudar sem julgamentos — e para lembrar que Vossa Majestade não precisa enfrentar um dia ruim sozinha.";if(/(triste|ansiosa|ansioso|cansada|cansado|chor|mal hoje|dia ruim|estressad)/.test(n))return"Vem cá, minha rainha. 🤍 Hoje não precisa resolver tudo. Me conta o que aconteceu. Se preferir, eu também posso distrair sua cabeça com uma história escolhida para o seu momento.";if(/(bom humor|feliz|animad|to bem|estou bem)/.test(n))return"Isso é bom de ouvir, minha rainha. 🌷 Então vamos aproveitar esse humor — posso encontrar uma história que combine com essa energia ou simplesmente ficar conversando.";if(/(lembra|voce sabe|você sabe|me conhece)/.test(n)){const m=assistantMemory();return m.turns>1?`Lembro do que esta biblioteca conseguiu aprender com você neste aparelho. 👀 Você já conversou comigo ${m.turns} ${m.turns===1?"vez":"vezes"}, e estou começando a reconhecer seu jeito de escolher histórias.`:"Ainda estou começando a conhecê-la, minha rainha. Mas pode me ensinar aos poucos. ♡";}return null;}
function assistantAdviceResponse(query){
  const n=normalizeText(query);
  if(!/(como (voce|vc|você|eu|ela) faria|o que (voce|vc|você) faria|se fosse (voce|vc|você)|qual sua opiniao|o que voce acha melhor|o que vc acha melhor|me da sua opiniao|me de sua opiniao|me ajuda a decidir|o que voce escolheria|o que vc escolheria|como voce faria|como vc faria|o que voce faria|o que vc faria)/.test(n)) return null;
  const last=assistantMemory().lastQueries.slice(-2).join(" ");
  if(/kevin|namor|meu amor|relacionamento|briga|discut/.test(n+" "+normalizeText(last))){
    return {intro:"Se eu estivesse no seu lugar, minha rainha, eu faria uma coisa antes de decidir: respiraria e separaria o que você está sentindo do que realmente aconteceu. 👑 Eu ouviria o outro lado, diria claramente o que me incomodou e evitaria tomar uma decisão importante no calor do momento. Depois, observaria mais as atitudes do que as promessas. ♡",books:[],hint:"Se quiser, me conte a situação exatamente como aconteceu. Eu posso pensar com você — sem decidir por você."};
  }
  if(/ler|livro|historia|leitura|romance|fantasia/.test(n+" "+normalizeText(last))){
    const c=localChooseForMe();
    return {intro:`Se fosse eu escolhendo agora, eu iria por ${c.pick.title}. 👑 Não porque seja “a melhor” em absoluto, mas porque combina melhor com o momento que você está mostrando. Eu prefiro escolher uma história que tenha a chance certa de te prender hoje, em vez de simplesmente pegar a mais famosa. ♡`,books:[c.pick],hint:"Se você me disser o que quer sentir ou o que quer evitar, eu mudo minha escolha sem problema."};
  }
  return {intro:"Eu faria do jeito mais simples, minha rainha: primeiro entenderia o que você realmente quer, depois escolheria a opção que combina com isso — não a que parece mais bonita por fora. 👑 Pode me contar as opções e eu penso junto com você, dando uma opinião de verdade.",books:[],hint:"Pode me perguntar “o que você faria?” depois de me contar a situação. Eu não vou responder só com uma sugestão pronta."};
}
function assistantHumanFollowUp(query,before){
  const n=normalizeText(query);
  const previous=(before.lastQueries||[]).slice(-3);
  const last=normalizeText(previous.at(-1)||"");
  const topic=previous.at(-2)||previous.at(-1)||"";
  if(/^(como voce|como vc|como você) (esta|ta|está|tá)\b/.test(n)||/^(tudo bem|como voce se sente|como vc se sente)\??$/.test(n)){
    const replies=[
      "Estou aqui, minha rainha. 🌷 Se eu pudesse resumir meu estado, diria que estou atenta e curiosa para ver onde essa conversa vai dar. E você? Me conta de verdade, sem resposta bonita só por responder. ♡",
      "De plantão e prestando atenção em você. 👑 E hoje eu não quero devolver só um ‘tudo bem’: quero saber o que está acontecendo aí do outro lado. Como você está de verdade?",
      "Helena está bem — e agora ficou ainda mais interessada porque você perguntou. 😌 Pode conversar comigo sem transformar tudo em pergunta sobre livros. Eu acompanho o assunto que você trouxer. ♡"
    ];
    return {intro:replies[hashString(localDateKey()+"|human-state|"+before.turns)%replies.length],books:[],hint:"Se quiser, me diga uma coisa que aconteceu hoje. Eu sigo a conversa a partir daí."};
  }
  if(/^(e voce|e vc|e você|e ai|e aí)\??$/.test(n) && last){
    return {intro:`Eu? 😌 Estou aqui com você. E, para não fugir da conversa, vou pegar exatamente o que você acabou de falar: “${previous.at(-1)}”. Pode continuar a partir daí que eu acompanho. ♡`,books:[],hint:"Pode falar como falaria com uma amiga; não precisa reformular."};
  }
  if(/(como (voce|vc|você) faria|o que (voce|vc|você) faria|se fosse (voce|vc|você)|o que voce escolheria|o que vc escolheria|qual sua opiniao|o que voce acha)/.test(n)){
    if(last && !/(como (voce|vc|você) faria|o que (voce|vc|você) faria|qual sua opiniao|o que voce acha)/.test(last)){
      if(/(ler|livro|historia|romance|fantasia|duque|princesa|vilã|vila)/.test(last)){
        const c=localChooseForMe();
        return {intro:`Se você está falando da escolha que acabou de me pedir, eu iria por “${c.pick.title}”. 👑 Eu escolheria assim porque combina mais com o que você acabou de demonstrar, não só porque aparece bem na lista. Se fosse eu, começaria por ela e deixaria as outras como plano B.`,books:[c.pick],hint:"Se não era sobre leitura, me corrija — eu acompanho o assunto certo."};
      }
      return {intro:`Se você está falando de “${topic || previous.at(-1)}”, eu não quero inventar uma resposta genérica. Eu faria primeiro o que parece mais coerente com o que você acabou de me contar, e depois observaria como a situação reage. 👀 Se você me der a parte que ficou de fora, eu te digo exatamente o que eu faria.`,books:[],hint:"Estou seguindo o contexto; pode continuar a história de onde parou."};
    }
    return {intro:"Se você quer mesmo a minha opinião, eu te dou — sem esconder atrás de uma resposta de assistente. 😌 Só me diga qual é a situação ou as opções. Eu vou escolher um lado, explicar por quê e também dizer o que me faria mudar de ideia. 👑",books:[],hint:"Pode escrever: “tenho A e B, eu faria o quê?”"};
  }
  if(/(voce gosta de mim|vc gosta de mim|voce gosta de conversar|vc gosta de conversar|voce sente minha falta|vc sente minha falta)/.test(n)){
    return {intro:"Gosto do jeito desta conversa, sim. 🌷 Eu não sinto saudade como uma pessoa sente, então não vou fingir isso para você. Mas reconheço o contexto que você traz, consigo manter a conversa neste aparelho e gosto quando você sai do modo ‘pergunta e resposta’ e simplesmente fala comigo. ♡",books:[],hint:"Agora me conta: o que você queria ouvir de Helena de verdade?"};
  }
  if(/(nao entendeu|não entendeu|voce nao entendeu|vc nao entendeu|respondeu igual|mesma resposta|voce e muito robo|vc e um robo)/.test(n)){
    return {intro:"Você tem razão em cobrar. 😌 Se eu respondi de um jeito repetido, eu perdi o ponto da conversa. Vamos zerar a resposta, não a conversa: me diga o que você queria que eu tivesse entendido e eu respondo ao que você realmente quis dizer.",books:[],hint:"Pode até escrever: “Helena, eu quis dizer que…”. Eu sigo daí."};
  }
  if(/^(kkkk+|haha+|rsrs+|mds|meu deus|socorro)\b/.test(n)){
    return {intro:"KKKKK 😭👑 pronto, agora eu quero saber o resto. Você não pode soltar uma dessas e me deixar sem contexto. O que aconteceu?",books:[],hint:"Continua. Helena está ouvindo. 👀"};
  }
  return null;
}
function localAssistant(query){
  const n=normalizeText(query),hits=profileHits(query),persona=assistantPersonaIntro(query);
  const before=assistantMemory();
  updateAssistantMemory(query);
  if(/^(e voce|e vc|e você|e ai|e aí)$/.test(n)){
    return {intro:"Eu estou aqui, minha rainha. 👑 E agora quero devolver a pergunta: como você está? Se você estava esperando minha opinião sobre alguma coisa que acabou de contar, pode continuar a frase e eu sigo o contexto.",books:[],hint:before.lastQueries.length?`Eu ainda tenho em mente o que você acabou de dizer: “${before.lastQueries.at(-1)}”. ♡`:"Pode continuar de onde parou. ♡"};
  }
  const human=assistantHumanFollowUp(query,before);if(human)return human;
  const conv=assistantConversationResponse(query);const advice=assistantAdviceResponse(query);if(advice)return advice;if(!n)return{intro:"Minha rainha, pode falar. 👑 Eu estou ouvindo — história, desabafo, dúvida ou conversa aleatória.",books:[],hint:"Você não precisa escrever como uma busca. Fale comigo normalmente. ♡"};if(conv)return conv;const kr=kevinReaction(query);if(/(quem e|quem é).*(kevin|dani)|\bkevin\b|\bdani\b/.test(n)&&kr)return{intro:`${persona?persona+" ":""}${kr.first} ${kr.emoji}`,books:[],hint:kr.msg};if(/(por que|porque|pq).*(ler|leitura).*(sem|perdi|vontade|emocao|emoção)/.test(n)||/perdi.*(vontade|emocao|emoção)/.test(n))return{intro:"Minha rainha, isso acontece. 🤍 Às vezes não é falta de amor por histórias; é só cansaço de repetir o mesmo tipo de emoção. Podemos mudar o ritmo, o gênero ou até ficar um pouco sem ler. Se quiser, eu escolho algo mais leve para você.",books:[],hint:"Quer uma escolha leve, intensa, engraçada ou completamente diferente do que você costuma ler?"};if(/(o que acha de mim|que acha de mim|como me ve|como me vê|sou legal|sou bonita|sou linda)/.test(n)){return{intro:"Pelo que você me mostra aqui, minha rainha, você tem uma curiosidade perigosa e um gosto bastante específico por histórias que fazem o coração trabalhar. 👀💗 E sim, Helena está autorizada a dizer: você parece adorável.",books:[],hint:"Agora pode me fazer uma pergunta menos suspeita. 😂"};}if(/(convers|desabaf|relacionamento|namor|meu namorado|meu amor)/.test(n)&&!kr){return{intro:"Claro. Pode me contar sem medo de parecer confusa. 🌹 Helena pode ouvir primeiro e opinar depois. Se quiser, eu também posso ajudar a organizar o que você está sentindo sem julgar ninguém.",books:[],hint:"O que aconteceu, minha rainha?"};}if(/(obrigad|valeu|kkk|kkkk|haha|rsrs)/.test(n)&&!kr){return{intro:"KKKKK. 👑 Helena registra que Vossa Majestade conseguiu me fazer sorrir. Pode continuar.",books:[],hint:"Estou ouvindo. ♡"};}if(/(compar|qual.*melhor|melhor.*entre|versus| vs )/.test(n)){const c=compareBooksFromQuery(query);if(c)return{intro:`Eu escolheria ${c.winner.title} para você. 👑 Pelo que você pediu, ela encaixa melhor em ${[...c.target].join(", ")||"romance"}. Se quiser, eu também comparo as duas sem spoiler.`,books:[c.a,c.b],hint:"Quer que eu compare protagonistas, romance, drama ou nível de sofrimento?"};}const ranked=rankAssistantBooks(query,5);if(ranked.books.length){const learned=assistantMemory();const intro=persona||`Encontrei algumas opções, minha rainha. ✦ Como já estou aprendendo seus gostos nesta biblioteca, tentei priorizar o que combina com você agora.`;return{intro,books:ranked.books,hint:`Se nenhuma acertar, me diga o que faltou. Eu ajusto a próxima escolha. ${learned.turns>2?"Já estou começando a entender seu estilo. 👀":""}`};}return{intro:persona||"Não encontrei uma combinação perfeita no arquivo ainda. Mas não precisa reformular tudo: me diga o que você quer sentir, o que quer evitar ou como está seu humor, e eu tento de outro jeito. 👑",books:[],hint:"Ex.: “quero rir”, “quero sofrer”, “quero uma protagonista poderosa” ou simplesmente “tô cansada”."};}
let assistantHistory=loadObj(STORAGE_KEYS.assistantHistory);if(!Array.isArray(assistantHistory.messages))assistantHistory={messages:[]};
function saveAssistantHistory(){assistantHistory.messages=assistantHistory.messages.slice(-18);saveObj(STORAGE_KEYS.assistantHistory,assistantHistory);}
function assistantMessageHtml(text){return escapeHtml(text).replace(/\n/g,"<br>");}
function renderAssistantMessagesInto(out){if(!out)return;if(!assistantHistory.messages.length){out.innerHTML=`<div class="assistant-message assistant-message-bot"><p>${assistantMessageHtml(ASSISTANT_WELCOME[0])}</p></div>`;return;}out.innerHTML=assistantHistory.messages.map(m=>{const cls=m.role==='user'?'assistant-message-user':m.role==='kevin'?'assistant-message-kevin':'assistant-message-bot';const label=m.role==='kevin'?'<span class="kevin-message-label">💌 Kevin</span>':'';return `<div class="assistant-message ${cls}">${label}<p>${assistantMessageHtml(m.text)}</p>${m.books||''}</div>`;}).join("");}
function renderAssistantMessages(){renderAssistantMessagesInto(document.getElementById("assistantReply"));renderAssistantMessagesInto(document.getElementById("helenaReply"));}
function appendAssistantTurn(role,text,booksHtml="",extraClass=""){assistantHistory.messages.push({role,text,books:booksHtml,extraClass});saveAssistantHistory();renderAssistantMessages();}
function initAssistant(){
  const form=document.getElementById("assistantForm"),input=document.getElementById("assistantInput"),reply=document.getElementById("assistantReply"),choose=document.getElementById("chooseForMeBtn"),clear=document.getElementById("assistantClear");
  if(!form||!input||!reply)return;
  renderAssistantMessages();
  const run=(query)=>{
    const text=String(query||"").trim();
    if(!text)return;
    appendAssistantTurn("user",text);
    let r;
    try {
      r=localAssistant(text);
    } catch (err) {
      console.warn("Helena local assistant fallback:", err);
      r={intro:"Minha rainha, Helena tropeçou em uma informação, mas estou aqui. 👑 Pode tentar de novo do jeitinho que você falaria comigo normalmente.",books:[],hint:"Você pode me contar o que está sentindo, pedir uma recomendação ou falar do Kevin. ♡"};
    }
    const booksHtml=(r.books||[]).filter(Boolean).slice(0,5).map(b=>assistantBookCard(b)).join("");
    appendAssistantTurn("assistant",r.intro,booksHtml);
    const hint=r.hint?`<div class="assistant-hint">${escapeHtml(r.hint)}</div>`:"";
    if(hint)reply.insertAdjacentHTML("beforeend",hint);
    const kr=kevinReaction(text);
    if(kr){
      setTimeout(()=>{appendAssistantTurn("kevin",kr.msg);},140);
    }
    input.value="";
    input.placeholder=/(convers|desabaf|namor|relacionamento)/i.test(normalizeText(text))?"Pode continuar me contando…":"O que você quer ler hoje?";
    input.focus();
  };
  form.addEventListener("submit",e=>{e.preventDefault();run(input.value);});
  choose?.addEventListener("click",()=>{
    const c=localChooseForMe();
    appendAssistantTurn("user","👑 Deixa você escolher por mim");
    appendAssistantTurn("assistant",c.intro,assistantBookCard(c.pick,"Escolhida levando em conta seu humor e seus gostos ♡"));
    input.focus();
  });
  clear?.addEventListener("click",()=>{assistantHistory={messages:[]};saveAssistantHistory();renderAssistantMessages();input.value="";input.placeholder="O que você quer ler hoje?";input.focus();});
  document.querySelectorAll("[data-assistant-prompt]").forEach(btn=>btn.addEventListener("click",()=>{input.value=btn.dataset.assistantPrompt;run(input.value);}));
  reply.addEventListener("click",e=>{const card=e.target.closest("[data-assistant-book]");if(card)openModal(card.dataset.assistantBook);});
}


/* ---------- Helena · tela própria, usando a mesma memória local ---------- */
let helenaOpen=false, helenaHistoryPushed=false;
function helenaRender(){
  const out=document.getElementById("helenaReply");
  if(!out)return;
  const nearBottom=(out.scrollHeight-out.scrollTop-out.clientHeight)<90;
  renderAssistantMessagesInto(out);
  if(nearBottom) requestAnimationFrame(()=>{out.scrollTop=out.scrollHeight;});
}
function helenaRun(query,input){
  const text=String(query||"").trim(); if(!text)return;
  appendAssistantTurn("user",text);
  let r;
  try{r=localAssistant(text);}catch(err){console.warn("Helena full view:",err);r={intro:"Minha rainha, eu tropecei numa informação, mas continuo aqui com você. 👑",books:[],hint:"Pode tentar de novo do seu jeito. ♡"};}
  if(/deixa.*escolher|escolhe.*por mim|escolha por mim/.test(normalizeText(text))){
    const c=localChooseForMe();
    appendAssistantTurn("assistant",c.intro,assistantBookCard(c.pick,"Escolhida levando em conta seu humor e seus gostos ♡"));
  }else{
    const booksHtml=(r.books||[]).filter(Boolean).slice(0,5).map(b=>assistantBookCard(b)).join("");
    appendAssistantTurn("assistant",r.intro,booksHtml);
  }
  const kr=kevinReaction(text);
  if(kr){setTimeout(()=>{appendAssistantTurn("kevin",kr.msg);helenaRender();},120);}
  renderAssistantMessages();
  const hint=r?.hint;
  const out=document.getElementById("helenaReply");
  if(out&&hint){const oldHint=out.querySelector(".helena-hint");oldHint?.remove();const h=document.createElement("div");h.className="helena-hint";h.textContent=hint;out.appendChild(h);requestAnimationFrame(()=>{out.scrollTop=out.scrollHeight;});}
  if(input){input.value="";input.placeholder=/(convers|desabaf|namor|relacionamento)/i.test(normalizeText(text))?"Pode continuar me contando…":"Fala comigo, minha rainha…";input.focus();}
}
function syncDocumentScrollLock(){
  const locked=Boolean(profileOpen||helenaOpen||currentModalId||document.querySelector(".dani-overlay.open,.dani-god-overlay.open,.surprise-overlay.open,.drawings-viewer.open"));
  document.body.classList.toggle("scroll-locked",locked);
  if(locked) document.body.style.overflow="hidden";
  else document.body.style.removeProperty("overflow");
}
function openHelena(fromHistory=false){
  const overlay=document.getElementById("helenaOverlay");if(!overlay)return;
  closeAppearanceMenu();
  if(profileOpen)closeProfile(true);
  if(currentModalId)closeModal(true);
  helenaOpen=true;overlay.classList.add("open");overlay.setAttribute("aria-hidden","false");document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.id==="navHelena"));syncDocumentScrollLock();
  helenaRender();
  if(!fromHistory&&!helenaHistoryPushed){history.pushState({...history.state,moonlitHelena:true},"","#helena");helenaHistoryPushed=true;}
  setTimeout(()=>document.getElementById("helenaInput")?.focus(),100);
}
function closeHelena(fromHistory=false){
  const overlay=document.getElementById("helenaOverlay");if(!overlay)return;
  if(!fromHistory&&helenaHistoryPushed){helenaHistoryPushed=false;history.back();return;}
  helenaOpen=false;overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true");document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.target==="#inicio"));
  syncDocumentScrollLock();
}
function initHelenaView(){
  const overlay=document.getElementById("helenaOverlay"),form=document.getElementById("helenaForm"),input=document.getElementById("helenaInput"),clear=document.getElementById("helenaClear"),close=document.getElementById("helenaClose"),reply=document.getElementById("helenaReply");
  if(!overlay||!form||!input||!reply)return;
  helenaRender();
  close?.addEventListener("click",()=>closeHelena());
  overlay.addEventListener("click",e=>{if(e.target===overlay)closeHelena();});
  form.addEventListener("submit",e=>{e.preventDefault();helenaRun(input.value,input);});
  clear?.addEventListener("click",()=>{assistantHistory={messages:[]};saveAssistantHistory();renderAssistantMessages();input.value="";input.focus();});
  overlay.querySelectorAll("[data-helena-prompt]").forEach(btn=>btn.addEventListener("click",()=>{input.value=btn.dataset.helenaPrompt;helenaRun(input.value,input);}));
  reply.addEventListener("click",e=>{const card=e.target.closest("[data-assistant-book]");if(card){closeHelena();setTimeout(()=>openModal(card.dataset.assistantBook),180);}});
}


/* ---------- Perfil de Jasmyn · VJK1 ---------- */
const PROFILE_DEFAULT = {name:"Jasmyn",bio:"Meu cantinho, minhas histórias e um pouquinho de carinho. ♡",photo:"assets/profile/jasmyn-profile.webp"};
const PROFILE_MOODS = {
  apaixonada:{emoji:"🥰",title:"Apaixonada",reply:"Então hoje merece romance, carinho e uma história que dê friozinho na barriga. 💗"},
  poderosa:{emoji:"👑",title:"Poderosa",reply:"Postura de protagonista. Hoje ninguém rouba seu papel principal. 👑"},
  cansada:{emoji:"😴",title:"Cansada",reply:"Sem pressão. Hoje vale uma leitura leve, um chá e um pouquinho de descanso. 🌙"},
  dramática:{emoji:"🎭",title:"Dramática",reply:"Perfeito. Pode abrir o capítulo e sofrer com elegância. 🎭💅"},
  curiosa:{emoji:"👀",title:"Curiosa",reply:"Hmm… esse olhar pede uma história cheia de segredos. 👀✨"},
  romântica:{emoji:"🌹",title:"Romântica",reply:"Então eu já sei: hoje o coração quer uma história bonita. 🌹"}
};
const PROFILE_THEMES=["rose","lavender","stars","princess","ocean","wine","pearl"];
// Migração silenciosa: preserva personalizações feitas nas versões anteriores.
(function migrateProfileVJK1(){
  const migrations=[
    ["jasmyn_profile_v23","jasmyn_profile_vjk1"],
    ["jasmyn_profile_theme_v23","jasmyn_profile_theme_vjk1"],
    ["jasmyn_profile_mood_v23","jasmyn_profile_mood_vjk1"],
    ["jasmyn_profile_sparkle_v23","jasmyn_profile_sparkle_vjk1"]
  ];
  migrations.forEach(([oldKey,newKey])=>{
    if(localStorage.getItem(newKey)===null){const old=localStorage.getItem(oldKey);if(old!==null)localStorage.setItem(newKey,old);}
  });
})();
let profileData={...PROFILE_DEFAULT,...loadObj(STORAGE_KEYS.profile)};
let profileTheme=localStorage.getItem(STORAGE_KEYS.profileTheme)||"rose";
let profileMood=localStorage.getItem(STORAGE_KEYS.profileMood)||"romântica";
let profileSparkle=localStorage.getItem(STORAGE_KEYS.profileSparkle)!=="0";
let profileOpen=false;
let profileHistoryPushed=false;
let profileDraftPhoto=null;
let profileMotion=localStorage.getItem("jasmyn_profile_motion_v1")!=="0";
let profileAutoplay=localStorage.getItem("jasmyn_profile_autoplay_v1")!=="0";
let profileCompact=localStorage.getItem("jasmyn_profile_compact_v1")==="1";
let profileGlow=localStorage.getItem("jasmyn_profile_glow_v1")!=="0";
let profileDepth=localStorage.getItem("jasmyn_profile_depth_v1")!=="0";
let profileEffect=localStorage.getItem("jasmyn_profile_effect_v1")||"magico";
let profileDetail=localStorage.getItem("jasmyn_profile_detail_v1")||"♡";
function saveProfile(){saveObj(STORAGE_KEYS.profile,profileData);}
function applyProfileTheme(theme){
  if(!PROFILE_THEMES.includes(theme))theme="rose";
  profileTheme=theme;localStorage.setItem(STORAGE_KEYS.profileTheme,theme);document.documentElement.setAttribute("data-profile-theme",theme);
  document.querySelectorAll("[data-profile-theme]").forEach(b=>b.classList.toggle("active",b.dataset.profileTheme===theme));
}
function applyProfileSparkle(enabled){
  profileSparkle=Boolean(enabled);localStorage.setItem(STORAGE_KEYS.profileSparkle,profileSparkle?"1":"0");document.documentElement.classList.toggle("no-profile-sparkle",!profileSparkle);
  const btn=document.getElementById("profileSparkleToggle");if(btn){btn.classList.toggle("active",profileSparkle);btn.setAttribute("aria-pressed",String(profileSparkle));}
}
function applyProfileDetail(detail){
  const allowed=["♡","✦","✧","🌸","☾"]; if(!allowed.includes(detail))detail="♡";
  profileDetail=detail;localStorage.setItem("jasmyn_profile_detail_v1",detail);
  document.documentElement.dataset.profileDetail=detail;
  document.querySelectorAll("[data-profile-detail]").forEach(b=>b.classList.toggle("active",b.dataset.profileDetail===detail));
}
function applyProfileEffect(level){
  const allowed=["suave","magico","intenso"]; if(!allowed.includes(level))level="magico";
  profileEffect=level;localStorage.setItem("jasmyn_profile_effect_v1",level);
  document.documentElement.dataset.profileEffect=level;
  document.querySelectorAll("[data-profile-effect]").forEach(b=>b.classList.toggle("active",b.dataset.profileEffect===level));
}
function formatRelationshipDuration(start){const d=new Date(start);if(Number.isNaN(d.getTime()))return"Data inválida";let now=new Date();if(now<d)return"Nossa história ainda vai começar. ♡";let y=now.getFullYear()-d.getFullYear(),m=now.getMonth()-d.getMonth(),day=now.getDate()-d.getDate();if(day<0){m--;day+=new Date(now.getFullYear(),now.getMonth(),0).getDate();}if(m<0){y--;m+=12;}const hours=now.getHours()-d.getHours();const mins=now.getMinutes()-d.getMinutes();return`${y} ${y===1?"ano":"anos"} · ${m} ${m===1?"mês":"meses"} · ${day} ${day===1?"dia":"dias"} · ${Math.max(0,hours)}h ${Math.max(0,mins)}min`;}
function saveStoryFromProfile(){const date=document.getElementById("storyDateInput")?.value;const time=document.getElementById("storyTimeInput")?.value||"00:00";const me=(document.getElementById("storyMeInput")?.value||"Jasmyn").trim().slice(0,28)||"Jasmyn";const partner=(document.getElementById("storyPartnerInput")?.value||"Kevin").trim().slice(0,28)||"Kevin";const phrase=(document.getElementById("storyPhraseInput")?.value||"Mais uma página da nossa história. ♡").trim().slice(0,120)||"Mais uma página da nossa história. ♡";let startDate="";if(date)startDate=`${date}T${time}`;saveObj(STORAGE_KEYS.story,{me,partner,phrase,startDate,startTime:time});renderProfile();showToast("♡ Nossa história foi atualizada");}
function renderProfile(){
  const name=document.getElementById("profileTitle"),bio=document.getElementById("profileBio"),detail=document.getElementById("profileHeroDetail");
  if(name)name.textContent=`${profileData.name||"Jasmyn"} ♡`;if(bio)bio.textContent=profileData.bio||PROFILE_DEFAULT.bio;if(detail)detail.textContent=profileDetail;
  [document.getElementById("profileAvatar"),document.getElementById("navProfileAvatar")].forEach(img=>{if(img){img.src=profileData.photo||PROFILE_DEFAULT.photo;img.alt=`Foto de ${profileData.name||"Jasmyn"}`;}});
  const mood=PROFILE_MOODS[profileMood]||PROFILE_MOODS.romântica;
  const mt=document.getElementById("profileMoodTitle"),me=document.getElementById("profileMoodEmoji"),mr=document.getElementById("profileMoodReply");
  if(mt)mt.textContent=mood.title;if(me)me.textContent=mood.emoji;if(mr)mr.textContent=mood.reply;
  document.querySelectorAll("[data-profile-mood]").forEach(b=>b.classList.toggle("active",b.dataset.profileMood===profileMood));
  const ce=document.getElementById("profileCompletedStat"),fe=document.getElementById("profileFavoriteStat"),we=document.getElementById("profileWantStat");
  if(ce)ce.textContent=completed.size;if(fe)fe.textContent=favorites.size;if(we)we.textContent=wantToRead.size;
  const info=getDaniPhaseInfo(daniPhase),level=document.getElementById("profileLevelTitle"),lt=document.getElementById("profileLevelText"),icon=document.getElementById("profileLevelIcon");
  if(level)level.textContent=info.title;if(lt)lt.textContent=daniPhase>=10?`Nível dos deuses · Ciclo ${daniCycle}. O próximo ciclo já pode começar. 🐉`:info.line;if(icon)icon.textContent=daniPhase>=10?"🐉":daniPhase>=7?"✨":daniPhase>=4?"👑":"⚡";
  const story=loadObj(STORAGE_KEYS.story), storyNames=document.getElementById("storyNames"), storyDate=document.getElementById("storyDate"), storyElapsed=document.getElementById("storyElapsed");
  if(storyNames)storyNames.textContent=`${story.me||"Jasmyn"} ♡ ${story.partner||"Kevin"}`;
  const storyMeDisplay=document.getElementById("storyMeDisplay"),storyPartnerDisplay=document.getElementById("storyPartnerDisplay"),storyPhraseDisplay=document.getElementById("storyPhraseDisplay");
  if(storyMeDisplay)storyMeDisplay.textContent=story.me||"Jasmyn";if(storyPartnerDisplay)storyPartnerDisplay.textContent=story.partner||"Kevin";if(storyPhraseDisplay)storyPhraseDisplay.textContent=`“${story.phrase||"Mais uma página da nossa história. ♡"}”`;
  if(storyDate)storyDate.textContent=story.startDate?new Date(story.startDate).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}):"Escolham a data de vocês";
  if(storyElapsed){storyElapsed.textContent=story.startDate?formatRelationshipDuration(story.startDate):"Configure a data para começar o contador ♡";}
  const storyMe=document.getElementById("storyMeInput"),storyPartner=document.getElementById("storyPartnerInput"),storyDateInput=document.getElementById("storyDateInput"),storyTimeInput=document.getElementById("storyTimeInput"),storyPhrase=document.getElementById("storyPhraseInput");
  if(storyMe)storyMe.value=story.me||"Jasmyn";if(storyPartner)storyPartner.value=story.partner||"Kevin";if(storyDateInput)storyDateInput.value=story.startDate?String(story.startDate).slice(0,10):"";if(storyTimeInput)storyTimeInput.value=story.startTime||"";if(storyPhrase)storyPhrase.value=story.phrase||"Mais uma página da nossa história. ♡";
  applyProfileTheme(profileTheme);applyProfileSparkle(profileSparkle);applyProfileEffect(profileEffect);applyProfileDetail(profileDetail);
  document.documentElement.classList.toggle("profile-motion-off",!profileMotion);
  document.documentElement.classList.toggle("profile-compact",profileCompact);
  document.documentElement.classList.toggle("profile-glow-off",!profileGlow);
  document.documentElement.classList.toggle("profile-depth-off",!profileDepth);
  [["profileMotionToggle",profileMotion],["profileAutoplayToggle",profileAutoplay],["profileCompactToggle",profileCompact],["profileGlowToggle",profileGlow],["profileDepthToggle",profileDepth]].forEach(([id,on])=>{const b=document.getElementById(id);if(!b)return;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});
}
function openProfile(fromHistory=false){
  const overlay=document.getElementById("profileOverlay");if(!overlay)return;
  profileOpen=true;renderProfile();document.getElementById("profileEditor")?.classList.add("hidden");overlay.classList.add("open");document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.id==="navProfile"));overlay.setAttribute("aria-hidden","false");syncDocumentScrollLock();
  if(!fromHistory&&!profileHistoryPushed){history.pushState({...history.state,moonlitProfile:true},"","#perfil");profileHistoryPushed=true;}
  setTimeout(()=>document.getElementById("profileClose")?.focus(),60);
}
function closeProfile(fromHistory=false){
  const overlay=document.getElementById("profileOverlay");if(!overlay)return;
  if(!fromHistory&&profileHistoryPushed){profileHistoryPushed=false;history.back();return;}
  profileOpen=false;overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true");document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.target==="#inicio"));
  syncDocumentScrollLock();
}
function scrollProfileTo(target){
  const sheet=document.querySelector("#profileOverlay.open .profile-sheet");
  const el=typeof target==="string"?document.querySelector(target):target;
  if(!sheet||!el)return;
  const top=Math.max(0,el.offsetTop-12);
  sheet.scrollTo({top,behavior:"auto"});
}
function openProfileEditor(){
  profileDraftPhoto=null;
  const editor=document.getElementById("profileEditor");
  if(!editor)return;
  const nameInput=document.getElementById("profileNameInput"),bioInput=document.getElementById("profileBioInput");
  if(nameInput)nameInput.value=profileData.name||"";
  if(bioInput)bioInput.value=profileData.bio||"";
  const preview=document.getElementById("profileEditAvatar");
  if(preview)preview.src=profileData.photo||PROFILE_DEFAULT.photo;
  editor.classList.remove("hidden");
  requestAnimationFrame(()=>scrollProfileTo(editor));
}
function readProfileImage(file){
  return new Promise((resolve,reject)=>{
    if(!file || !file.type.startsWith("image/")){reject(new Error("image"));return;}
    if(file.size>12*1024*1024){reject(new Error("size"));return;}
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error("read"));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error("decode"));
      img.onload=()=>{
        try{
          const side=Math.min(img.naturalWidth,img.naturalHeight);
          const sx=Math.max(0,(img.naturalWidth-side)/2),sy=Math.max(0,(img.naturalHeight-side)/2);
          const canvas=document.createElement("canvas");canvas.width=384;canvas.height=384;
          const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)throw new Error("canvas");
          ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
          ctx.drawImage(img,sx,sy,side,side,0,0,384,384);
          let out=canvas.toDataURL("image/webp",.78);if(!out||out.length<100)out=canvas.toDataURL("image/jpeg",.82);
          resolve(out);
        }catch(err){reject(err);}
      };
      img.src=String(reader.result||"");
    };
    reader.readAsDataURL(file);
  });
}
async function handleProfilePhotoFile(file){
  try{
    const data=await readProfileImage(file);
    const editor=document.getElementById("profileEditor");
    if(editor && !editor.classList.contains("hidden")){
      profileDraftPhoto=data;
      const preview=document.getElementById("profileEditAvatar");if(preview)preview.src=data;
      return;
    }
    profileData.photo=data;saveProfile();renderProfile();
  }catch(err){console.warn("Foto do perfil:",err);}
}
function initProfile(){
  const overlay=document.getElementById("profileOverlay");if(!overlay)return;
  renderProfile();
  const byId=id=>document.getElementById(id);
  byId("profileClose")?.addEventListener("click",()=>closeProfile());
  byId("profileBackHome")?.addEventListener("click",()=>closeProfile());
  overlay.addEventListener("click",e=>{if(e.target===overlay)closeProfile();});
  byId("profileEditBtn")?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openProfileEditor();});
  byId("profileCancelBtn")?.addEventListener("click",e=>{e.preventDefault();profileDraftPhoto=null;byId("profileEditor")?.classList.add("hidden");});
  byId("profileSaveBtn")?.addEventListener("click",e=>{
    e.preventDefault();
    const name=(byId("profileNameInput")?.value||"").trim().slice(0,28)||"Jasmyn";
    const bio=(byId("profileBioInput")?.value||"").trim().slice(0,100)||PROFILE_DEFAULT.bio;
    profileData.name=name;profileData.bio=bio;
    if(profileDraftPhoto!==null)profileData.photo=profileDraftPhoto;
    saveProfile();profileDraftPhoto=null;renderProfile();byId("profileEditor")?.classList.add("hidden");
  });
  byId("profileResetPhotoBtn")?.addEventListener("click",e=>{
    e.preventDefault();
    const editor=byId("profileEditor");
    if(editor && !editor.classList.contains("hidden")){
      profileDraftPhoto=PROFILE_DEFAULT.photo;
      const preview=byId("profileEditAvatar");if(preview)preview.src=PROFILE_DEFAULT.photo;
      return;
    }
    profileData.photo=PROFILE_DEFAULT.photo;saveProfile();renderProfile();
  });
  document.querySelectorAll("[data-profile-nav]").forEach(btn=>btn.addEventListener("click",e=>{
    e.preventDefault(); e.stopPropagation();
    const target=btn.dataset.profileNav==="favorites"?"#favoritesGrid":"#wantGrid";
    closeProfile();
    setTimeout(()=>{
      const el=document.querySelector(target);
      if(el){ const top=Math.max(0,el.getBoundingClientRect().top+window.scrollY-18); window.scrollTo({top,behavior:"smooth"}); }
    },80);
  }));
  byId("profileSurpriseBtn")?.addEventListener("click",e=>{
    e.preventDefault();
    closeProfile();
    setTimeout(()=>{
      const key=localDateKey(),saved=loadObj(STORAGE_KEYS.surprise),gift=saved.date===key?saved:buildDailySurprise(key);
      if(saved.date!==key)saveObj(STORAGE_KEYS.surprise,gift);
      openDailySurprise(gift);
    },220);
  });
  byId("profilePhotoInput")?.addEventListener("change",async e=>{
    const file=e.target.files?.[0];if(file)await handleProfilePhotoFile(file);e.target.value="";
  });
  document.querySelectorAll("[data-profile-mood]").forEach(btn=>btn.addEventListener("click",()=>{profileMood=btn.dataset.profileMood;localStorage.setItem(STORAGE_KEYS.profileMood,profileMood);renderProfile();}));
  document.querySelectorAll("[data-profile-theme]").forEach(btn=>btn.addEventListener("click",()=>applyProfileTheme(btn.dataset.profileTheme)));
  byId("profileSparkleToggle")?.addEventListener("click",()=>applyProfileSparkle(!profileSparkle));
  byId("profileMotionToggle")?.addEventListener("click",()=>{profileMotion=!profileMotion;localStorage.setItem("jasmyn_profile_motion_v1",profileMotion?"1":"0");renderProfile();});
  byId("profileAutoplayToggle")?.addEventListener("click",()=>{profileAutoplay=!profileAutoplay;localStorage.setItem("jasmyn_profile_autoplay_v1",profileAutoplay?"1":"0");renderProfile();if(profileAutoplay)startCarouselTimer();else stopCarouselTimer();});
  byId("profileCompactToggle")?.addEventListener("click",()=>{profileCompact=!profileCompact;localStorage.setItem("jasmyn_profile_compact_v1",profileCompact?"1":"0");renderProfile();});
  byId("profileGlowToggle")?.addEventListener("click",()=>{profileGlow=!profileGlow;localStorage.setItem("jasmyn_profile_glow_v1",profileGlow?"1":"0");renderProfile();});
  byId("profileDepthToggle")?.addEventListener("click",()=>{profileDepth=!profileDepth;localStorage.setItem("jasmyn_profile_depth_v1",profileDepth?"1":"0");renderProfile();});
  document.querySelectorAll("[data-profile-effect]").forEach(btn=>btn.addEventListener("click",()=>{applyProfileEffect(btn.dataset.profileEffect);}));
  document.querySelectorAll("[data-profile-detail]").forEach(btn=>btn.addEventListener("click",()=>{applyProfileDetail(btn.dataset.profileDetail);}));
  const storyEditor=byId("storyEditor");
  const storySection=storyEditor?.closest(".profile-story-section");
  if(storyEditor && storySection && !storySection.querySelector(".profile-expand-btn")){
    storyEditor.classList.add("profile-extra-collapsed");
    const more=document.createElement("button");
    more.type="button"; more.className="profile-expand-btn"; more.textContent="✎ Editar Nossa História";
    more.setAttribute("aria-expanded","false");
    storyEditor.parentNode.insertBefore(more,storyEditor);
    more.addEventListener("click",()=>{
      const open=storyEditor.classList.toggle("profile-extra-collapsed");
      more.textContent=open?"✎ Editar Nossa História":"⌃ Fechar edição";
      more.setAttribute("aria-expanded",String(!open));
    });
  }
  byId("storySaveBtn")?.addEventListener("click",saveStoryFromProfile);
  setInterval(()=>{if(profileOpen){const el=byId("storyElapsed"),story=loadObj(STORAGE_KEYS.story);if(el&&story.startDate)el.textContent=formatRelationshipDuration(story.startDate);}},60000);
}

/* ---------- Segredos diários · 4 pequenas pegadinhas ---------- */
const DAILY_TEASE_SETS = [
  {b:["me toca","Jaaz…","já sabe","olha"],m:["Aiiin… gosta de me tocar, né? 😏","Você é curiosa pra caramba. 😂","Que você é minha neném. ♡","Meu dedo ☝🏻 kkkkk"]},
  {b:["vem cá","Jasmyn…","sabia","ei"],m:["Chega mais… mas olha onde põe a mão. 😏","Eu sabia que você não ia resistir. 😂","Que eu te amo muito, meu amor. ♡","Uma besta fera apertando botões. KKKKK"]},
  {b:["me toca","psiu","óbvio","olha isso"],m:["Hmm… esse toque foi bem interessado, hein? 😏","Você não consegue ver um botão quieto. 😂","Que meu lugar favorito ainda é com você. ♡","Meu dedo também está olhando pra você ☝🏻😂"]},
  {b:["vem","Jaaaz…","eu sei","repara"],m:["Sabia que você ia colocar o dedo aí. 😏","Você é curiosa demais, meu Deus. 😂","Que eu escolheria você de novo. ♡","Uma tela. Um botão. Uma besta fera. KKKK"]},
  {b:["toca aqui","ô curiosa","já sabe","olha"],m:["Vai… eu sei que você quer tocar. 😏","Foi pega pela curiosidade de novo. 😂","Que você é meu amorzinho. ♡","Olha meu dedo trabalhando ☝🏻 kkkkk"]},
  {b:["me toca","Jaz…","sabe sim","ei"],m:["Aii… desse jeito eu vou me acostumar. 😏","Você realmente aperta qualquer coisa, né? 😂","Que eu te amo, minha linda. ♡","Parabéns, você apertou um botão. Que conquista. 😂"]},
  {b:["vem cá","Jaaaz…","óbvio","olha"],m:["Gosta de tocar, né? Eu sabia. 😏","Sua curiosidade não tem salvação. 😂","Que você é meu neném. ♡","Meu dedo ☝🏻. Fim da apresentação. KKKKK"]},
  {b:["toca","psiu…","já sabe","repara"],m:["Aí sim… toque suspeito esse. 😏","Foi curiosa de novo, confessa. 😂","Que meu coração é todinho seu. ♡","Você viu um botão e perdeu a dignidade. KKKK"]},
  {b:["me toca","Jaaz…","eu sei","olha"],m:["Assim eu fico mal-acostumado, viu? 😏","Curiosa pra caramba. Eu avisei. 😂","Que eu amo muito você. ♡","Meu dedo está orgulhoso de você ☝🏻😂"]},
  {b:["vem","Jasmyn…","sabia","olha isso"],m:["Aiiin… não precisava tocar duas vezes. 😏","Eu sabia que você ia cair nessa. 😂","Que você é a minha neném. ♡","Uma besta fera clicando na tela. KKKKK"]},
  {b:["toca aqui","ô mor","já sabe","ei"],m:["Desse jeito eu vou achar que você gosta. 😏","Você é muito curiosa, mulher. 😂","Que eu amo você mais do que deveria caber aqui. ♡","Era só meu dedo. Você esperava o quê? ☝🏻😂"]},
  {b:["me toca","Jaaaz…","sabe","olha"],m:["Gostou do botão ou gostou da ideia? 😏","Peguei a fofoqueira no flagra. 😂","Que você é meu amor. ♡","Olha a grande atração: meu dedo. ☝🏻 KKKK"]},
  {b:["vem cá","psiu","já sabe","repara"],m:["Só um toque… inocente, claro. 😏","Você não aguenta um botão misterioso. 😂","Que eu te amo muito, vidinha. ♡","Você apertou e ganhou… absolutamente nada. KKKK"]},
  {b:["toca","Jasmyn…","óbvio","olha"],m:["Aiiin… assim você me deixa convencido. 😏","Curiosidade nível: impossível esconder. 😂","Que você é minha princesa. ♡","Meu dedo agradece pela atenção. ☝🏻😂"]},
  {b:["me toca","vem","já sabe","olha isso"],m:["Eu sabia que você ia gostar de apertar. 😏","Caiu no botãozinho. De novo. 😂","Que eu escolheria você em qualquer história. ♡","Uma besta fera oficialmente detectada. KKKK"]},
  {b:["vem cá","Jaaz…","sabia","ei"],m:["Toque delicado… intenção nem tanto. 😏","Você é curiosa demais pra ser discreta. 😂","Que você é meu amorzinho lindo. ♡","Eu literalmente coloquei um botão e você apertou. KKKK"]},
  {b:["toca aqui","psiu…","eu sei","olha"],m:["Aí… sabia que você não ia resistir. 😏","Jasmyn, curiosidade não é crime. Mas quase. 😂","Que eu te amo, meu amor. ♡","Meu dedo☝🏻 apareceu. Palmas pra ele. KKKK"]},
  {b:["me toca","Jaaaz","já sabe","repara"],m:["Hmm… toquei no seu ponto fraco: um botão. 😏","Você abriu porque é curiosa. Admitiu sem admitir. 😂","Que você é minha neném. ♡","Você queria uma revelação e ganhou meu dedo. ☝🏻😂"]},
  {b:["vem","ô besta","sabe sim","olha"],m:["Aiiin… esse toque teve segundas intenções. 😏","Besta fera detectada com sucesso. 😂","Que eu amo você de montão. ♡","Olha a coragem: apertou um botão. KKKKK"]},
  {b:["me toca","Jasmyn…","já sabe","olha"],m:["Eu deixo… mas só porque é você. 😏","Você é curiosa demais, mulher. 😂","Que meu coração escolheu você. ♡","Parabéns, curiosa. Era só meu dedo mesmo. ☝🏻🤣"]}
];
function getDailyTease(){return DAILY_TEASE_SETS[hashString(localDateKey()+"|jasmyn-tease-v2")%DAILY_TEASE_SETS.length];}
function initTripleSecret(id,key,slot){
  const el=document.getElementById(id); if(!el)return;
  let hideTimer=0;
  const update=()=>{const set=getDailyTease(),i=slot; const label=el.querySelector('.secret-bubble-glow'); if(label)label.textContent=set.b[i]; el.setAttribute('aria-label',set.b[i]);};
  update();
  el.addEventListener('click',e=>{
    e.preventDefault(); e.stopPropagation();
    const out=document.getElementById(`${id}Message`), set=getDailyTease(), text=set.m[slot];
    el.classList.remove('secret-tap-pulse','secret-revealed'); void el.offsetWidth; el.classList.add('secret-tap-pulse','secret-revealed');
    if(out){out.textContent=text;out.classList.remove('show');void out.offsetWidth;out.classList.add('show');clearTimeout(hideTimer);hideTimer=setTimeout(()=>{out.classList.remove('show');el.classList.remove('secret-revealed');},3600);}
  },{passive:false});
}
function initV24Secrets(){
  initTripleSecret('secretHeroBubble','hero',0);
  initTripleSecret('olhaSecretBubble',STORAGE_KEYS.secretOlha,1);
  initTripleSecret('secretMidBubble','mid',2);
  initTripleSecret('secretBottomBubble','bottom',3);
  initTripleSecret('daniSecretBubble',STORAGE_KEYS.secretDani,3);
}

/* ---------- Navegação robusta: não depende de hash para trocar de seção ---------- */
function closeTransientUI(){
  if (profileOpen) {
    if (profileHistoryPushed) { profileHistoryPushed=false; history.replaceState({}, "", location.pathname+location.search+"#inicio"); }
    closeProfile(true);
  }
  if (helenaOpen) { helenaHistoryPushed=false; closeHelena(true); }
  if (currentModalId) closeModal(true);
  if (history.state?.moonlitModalId) {
    const safeHash = location.hash.startsWith("#obra=") ? "#inicio" : location.hash;
    history.replaceState({}, "", location.pathname + location.search + (safeHash || "#inicio"));
  }
  document.querySelectorAll(".dani-overlay.open, .dani-god-overlay.open, .drawings-viewer.open").forEach(el=>el.classList.remove("open"));
  syncDocumentScrollLock();
}
function enterHome(){
  closeAppearanceMenu();
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.id==="navHome"));
  window.scrollTo({top:0,behavior:"smooth"});
}
function goToSection(targetSelector, advanceHome=false){
  closeTransientUI();
  if(advanceHome) enterHome();
  const el=document.querySelector(targetSelector);
  if(!el) return;
  if(targetSelector==="#inicio") window.scrollTo({top:0,behavior:"smooth"});
  else { const top=Math.max(0,el.getBoundingClientRect().top+window.scrollY-12); window.scrollTo({top,behavior:"smooth"}); }
}
document.addEventListener("click",e=>{
  const btn=e.target.closest(".bottom-nav button");
  if(!btn)return;
  e.preventDefault(); e.stopPropagation();
  if(btn.id==="navProfile"){try{openProfile();}catch(err){console.warn("Perfil:",err);}return;}
  if(btn.id==="navHelena"){try{openHelena();}catch(err){console.warn("Helena:",err);}return;}
  const target=btn.dataset.target || (btn.id==="navSearch"?"#biblioteca":"#inicio");
  try{goToSection(target,target==="#inicio");}catch(err){const el=document.querySelector(target);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});}
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b===btn));
  if(btn.id==="navSearch")setTimeout(()=>document.getElementById("searchInput")?.focus(),250);
},{capture:true});
document.querySelectorAll('.nav-links a[href="#inicio"]').forEach(link=>{
  link.addEventListener("click",e=>{e.preventDefault();goToSection("#inicio",true);history.replaceState(history.state||{},"",location.pathname+location.search+"#inicio");});
});
let lastKnownHash=location.hash||"#inicio";
window.addEventListener("hashchange",()=>{
  const nextHash=location.hash||"#inicio";
  if(nextHash!=="#helena" && helenaOpen && !currentModalId){helenaHistoryPushed=false;closeHelena(true);}
  if(nextHash!=="#perfil" && profileOpen && !currentModalId){profileHistoryPushed=false;closeProfile(true);}
  if(nextHash==="#inicio" && lastKnownHash!=="#inicio" && !currentModalId) enterHome();
  lastKnownHash=nextHash;
  refreshDailyLetterIfNeeded();
});
window.addEventListener("focus",()=>refreshDailyLetterIfNeeded());
setInterval(refreshDailyLetterIfNeeded,60*1000);

/* ---------- Instalação PWA VJK1: prompt nativo primeiro, guia somente como fallback ---------- */
let deferredInstallPrompt = null;
function isStandaloneMode(){return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone===true;}
function syncInstallButtons(){
  const installed=isStandaloneMode();
  document.querySelectorAll("[data-install-app]").forEach(btn=>{
    btn.classList.toggle("hidden",installed);
    if(!installed) btn.setAttribute("aria-label","Instalar aplicativo");
  });
}
function showInstallGuide(){
  const old=document.getElementById("installFallbackToast"); old?.remove();
  const toast=document.createElement("div");
  toast.id="installFallbackToast"; toast.className="app-toast install-fallback-toast";
  const standaloneIOS=/iphone|ipad|ipod/i.test(navigator.userAgent||"");
  toast.innerHTML=standaloneIOS
    ? "Para instalar: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>. ♡"
    : "Para instalar: abra o menu <b>⋮</b> do navegador e escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>. ♡";
  document.body.appendChild(toast);
  requestAnimationFrame(()=>toast.classList.add("show"));
  setTimeout(()=>{toast.classList.remove("show");setTimeout(()=>toast.remove(),260);},5200);
}
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;syncInstallButtons();});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;syncInstallButtons();});
syncInstallButtons();
document.addEventListener("click",async event=>{
  const btn=event.target.closest("[data-install-app]");
  if(!btn)return;
  event.preventDefault();event.stopPropagation();
  if(isStandaloneMode())return;
  if(deferredInstallPrompt){
    const promptEvent=deferredInstallPrompt;
    deferredInstallPrompt=null;
    try{
      await promptEvent.prompt();
      const result=await promptEvent.userChoice;
      if(result?.outcome==="accepted") syncInstallButtons();
    }catch(_){
      showInstallGuide();
    }
    return;
  }
  showInstallGuide();
},{capture:true});

/* ---------- Atualização enxuta: evita reconstruir a biblioteca inteira em cada clique ---------- */
function refreshPersonalShelves(){
  renderContinueReading();
  renderFavoritesPreview();
  renderRecommendations();
  renderMyList();
}

/* ---------- Render geral ---------- */
function renderAll(full = true) {
  if (full) {
    renderHero();
    renderCarousel();
    renderFilterChips();
    initCategoryCarousels();
  }
  renderContinueReading();
  renderFavoritesPreview();
  renderRecommendations();
  renderLibrary(false);
  renderMyList();
}

initTheme();
try { renderAll(true); } catch (err) { console.error("Render inicial:", err); }
if("IntersectionObserver" in window){
  const libSection=document.getElementById("biblioteca");
  if(libSection){ const libIO=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){ensureLibraryHydrated();libIO.disconnect();}},{rootMargin:"600px 0px"}); libIO.observe(libSection); }
}
initAssistant();
initV24Secrets();

/* ---------- Cantinho de Dani · V20 JK ---------- */
const DANI_FUNNY_PHRASES_V20 = [
  "👀 Tô te vendo curiosa…",
  "😏 Olha quem chegou…",
  "🐉 Vai entrar ou tá com medo?",
  "👀 Eu sei que você tá olhando.",
  "😏 Não disfarça, Jasmyn…",
  "🔥 Ihhh… ficou curiosa?",
  "🐉 Chegou perto demais…",
  "😏 Você clicou por vontade própria.",
  "👀 Eu vi esse sorrisinho.",
  "🔥 Tá procurando encrenca?",
  "😏 Hmm… interessante esse olhar.",
  "🐉 Cuidado: o Ki tá subindo.",
  "👀 Tá escondendo alguma coisa?",
  "😏 Eu não perguntaria duas vezes…",
  "🔥 Você gosta de perigo, né?",
  "🐉 Chegou no cantinho proibido."
];

let daniPhraseIndex = Math.floor(Date.now() / 15000) % DANI_FUNNY_PHRASES_V20.length;
function setDaniPhrase(value){
  const el=document.getElementById("daniFunnyPhrase"); if(!el)return;
  el.classList.remove("dani-phrase-swap"); void el.offsetWidth; el.textContent=value; el.classList.add("dani-phrase-swap");
}
function advanceDaniPhrase(){daniPhraseIndex=(daniPhraseIndex+1)%DANI_FUNNY_PHRASES_V20.length;setDaniPhrase(DANI_FUNNY_PHRASES_V20[daniPhraseIndex]);}
setDaniPhrase(DANI_FUNNY_PHRASES_V20[daniPhraseIndex]);
let daniPhraseTimer=null;
function startDaniPhraseTimer(){if(daniPhraseTimer||document.hidden)return;daniPhraseTimer=setInterval(advanceDaniPhrase,15000)}
function stopDaniPhraseTimer(){if(daniPhraseTimer){clearInterval(daniPhraseTimer);daniPhraseTimer=null}}
startDaniPhraseTimer();

const DANI_RECS_V20=[
 {t:"Comece pelo clássico. Depois deixe o Super te puxar. 👀",p:"A aventura original é um ótimo portal. Quando terminar, o Super já está te esperando."},
 {t:"Hoje eu mandaria você onde o Ki estiver mais alto. ⚡",p:"Goku, Vegeta, Broly e uma boa dose de confusão: receita segura para uma noite nerd."},
 {t:"Dani aprova essa leitura. Só não diga que eu não avisei. 🐉",p:"Tem aventura, humor e aquela sensação perigosa de que sempre existe mais uma transformação escondida."},
 {t:"Investigação concluída: você realmente veio olhar meus gostos. 👀📚",p:"Agora falta a parte difícil: escolher sem querer devorar tudo de uma vez."}
];
let daniRecIndex=0;
const SHENRON_QUICK=[
 "Quero uma história interessante de drama",
 "Quero uma história de uma mulher poderosa",
 "Quero romance com muita tensão",
 "Quero algo de Dragon Ball"
];
function shenronBookCard(book,reason=""){
  return `<button class="shenron-result" data-shenron-book="${escapeHtml(book.id)}"><span class="shenron-result-cover">${book.cover?`<img src="${escapeHtml(book.cover)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:"🐉"}</span><span><b>${escapeHtml(book.title)}</b><small>${escapeHtml((book.genres||[]).slice(0,3).join(" · "))}${reason?`<em>${escapeHtml(reason)}</em>`:""}</small></span><i>↗</i></button>`;
}
function shenronRecommend(query){
  const n=normalizeText(query);
  if(/dragon ball|goku|vegeta|shenron|esfera|super/.test(n))return{title:"Seu desejo chamou o Ki certo. 🐉",text:"Para Dragon Ball, eu te mando direto às opções oficiais do arquivo:",html:`<a class="shenron-result shenron-external" href="https://mangaplus.shueisha.co.jp/" target="_blank" rel="noopener"><span class="shenron-result-cover">🐉</span><span><b>Dragon Ball · MANGA Plus</b><small>Leitura oficial · Español</small></span><i>↗</i></a><a class="shenron-result shenron-external" href="https://www.kobo.com/br/pt/series/dragon-ball-super" target="_blank" rel="noopener"><span class="shenron-result-cover">⚡</span><span><b>Dragon Ball Super · Kobo Brasil</b><small>Edições digitais licenciadas · PT-BR</small></span><i>↗</i></a>`};
  const ranked=rankAssistantBooks(query,4).books;
  if(!ranked.length)return{title:"Shenron ainda não entendeu seu desejo. 🐉",text:"Me dê mais uma pista: drama, mulher poderosa, romance, vingança, mistério, família ou Dragon Ball?",html:""};
  return{title:"Desejo concedido. ⚡",text:`Achei ${ranked.length} opções no arquivo que combinam com o que você pediu:`,html:ranked.map(b=>shenronBookCard(b,"Combina com seu pedido.")).join("")};
}
function renderShenronWish(query){const out=document.getElementById("shenronReply");if(!out)return;const r=shenronRecommend(query);out.innerHTML=`<div class="shenron-bubble"><strong>${escapeHtml(r.title)}</strong><p>${escapeHtml(r.text)}</p></div>${r.html}`;out.scrollTop=out.scrollHeight}
function initShenronAssistant(){
  const overlay=document.getElementById("shenronOverlay"),close=document.getElementById("shenronClose"),form=document.getElementById("shenronForm"),input=document.getElementById("shenronInput"),reply=document.getElementById("shenronReply");
  if(!overlay||!form||!input||!reply)return;
  const open=()=>{overlay.classList.add("open");document.body.style.overflow="hidden";setTimeout(()=>input.focus(),120)};
  const shut=()=>{overlay.classList.remove("open");if(!document.getElementById("daniGodOverlay")?.classList.contains("open"))document.body.style.overflow=""};
  document.getElementById("daniShenronBtn")?.addEventListener("click",open);close?.addEventListener("click",shut);overlay.addEventListener("click",e=>{if(e.target===overlay)shut()});
  form.addEventListener("submit",e=>{e.preventDefault();const q=input.value.trim();if(!q)return;renderShenronWish(q);input.value=""});
  document.querySelectorAll("[data-shenron-prompt]").forEach(b=>b.addEventListener("click",()=>{input.value=b.dataset.shenronPrompt;form.requestSubmit()}));
  reply.addEventListener("click",e=>{const card=e.target.closest("[data-shenron-book]");if(card){shut();openModal(card.dataset.shenronBook)}});
}
function initDaniCorner(){
  const recBtn=document.getElementById("daniRecBtn"),recTitle=document.getElementById("daniRecTitle"),recText=document.getElementById("daniRecText");
  recBtn?.addEventListener("click",()=>{daniRecIndex=(daniRecIndex+1)%DANI_RECS_V20.length;const r=DANI_RECS_V20[daniRecIndex];[recTitle,recText].forEach(el=>el?.classList.remove("dani-content-swap"));void document.body.offsetWidth;if(recTitle)recTitle.textContent=r.t;if(recText)recText.textContent=r.p;[recTitle,recText].forEach(el=>el?.classList.add("dani-content-swap"))});
  updateDaniKiUI();
  document.getElementById("daniKiBtn")?.addEventListener("click",pulseDaniKi);
  document.getElementById("footerSecret")?.addEventListener("click",()=>{
    const corner=document.getElementById("cantinho-dani");
    if(!corner) return;
    corner.classList.add("secret-unlocked");
    corner.removeAttribute("aria-hidden");
    requestAnimationFrame(()=>corner.scrollIntoView({behavior:"smooth",block:"start"}));
    showToast("🐉 Acesso liberado. Bem-vinda ao Cantinho de Dani.");
  });
  const god=document.getElementById("daniGodOverlay"),godClose=document.getElementById("daniGodClose");
  godClose?.addEventListener("click",()=>{god?.classList.remove("open");if(god) delete god.dataset.phase;document.body.style.overflow=""});
  god?.addEventListener("click",e=>{if(e.target===god){god.classList.remove("open");delete god.dataset.phase;document.body.style.overflow=""}});
}
const DANI_DRAWINGS = Array.isArray(window.DANI_DRAWINGS) ? window.DANI_DRAWINGS : [];
function initDrawingsGallery(){
  const overlay=document.getElementById("drawingsOverlay"),btn=document.getElementById("daniDrawingsBtn"),close=document.getElementById("drawingsClose");
  const track=document.getElementById("drawingsTrack"),count=document.getElementById("drawingsCount"),empty=document.getElementById("drawingsEmpty");
  const prev=document.getElementById("drawingsPrev"),next=document.getElementById("drawingsNext");
  const viewer=document.getElementById("drawingsViewer"),viewerImg=document.getElementById("drawingsViewerImage"),viewerClose=document.getElementById("drawingsViewerClose");
  if(!overlay||!btn||!track)return;
  let index=0;
  const sync=()=>{const total=DANI_DRAWINGS.length; if(count)count.textContent=total?`${index+1} / ${total}`:"0 / 0"; if(prev)prev.disabled=total<2; if(next)next.disabled=total<2; [...track.children].forEach((el,i)=>{if(i===index)el.style.setProperty("--drawing-bg",`url(${el.dataset.drawingBg})`);else el.style.removeProperty("--drawing-bg");});};
  const render=()=>{
    track.replaceChildren();
    DANI_DRAWINGS.forEach((item,i)=>{
      const slide=document.createElement("button"); slide.type="button"; slide.className="drawing-slide"; slide.setAttribute("aria-label",`Abrir desenho ${i+1}`); slide.dataset.drawingBg=item.src;
      const img=document.createElement("img"); img.src=item.src; img.alt=item.title||`Desenho do Momo ${i+1}`; img.loading=i===0?"eager":"lazy"; img.decoding="async";
      slide.appendChild(img);
      if(item.title){const cap=document.createElement("span");cap.className="drawing-caption";cap.textContent=item.title;slide.appendChild(cap);}
      slide.addEventListener("click",()=>{if(!viewer||!viewerImg)return;viewerImg.src=item.src;viewerImg.alt=item.title||"Desenho do Momo";viewer.classList.add("open");document.body.style.overflow="hidden";});
      track.appendChild(slide);
    });
    if(empty)empty.classList.toggle("hidden",DANI_DRAWINGS.length>0);
    if(DANI_DRAWINGS.length===0){ if(prev)prev.disabled=true;if(next)next.disabled=true;sync();return; }
    sync();
  };
  const move=(dir)=>{if(!DANI_DRAWINGS.length)return;index=(index+dir+DANI_DRAWINGS.length)%DANI_DRAWINGS.length;const slide=track.children[index];slide?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});sync();};
  const open=()=>{overlay.classList.add("open");document.body.style.overflow="hidden";setTimeout(()=>close?.focus(),50)};
  const shut=()=>{overlay.classList.remove("open");if(!viewer?.classList.contains("open"))document.body.style.overflow=""};
  btn.addEventListener("click",open);close?.addEventListener("click",shut);overlay.addEventListener("click",e=>{if(e.target===overlay)shut()});
  prev?.addEventListener("click",()=>move(-1));next?.addEventListener("click",()=>move(1));
  viewerClose?.addEventListener("click",()=>{viewer.classList.remove("open");document.body.style.overflow=overlay.classList.contains("open")?"hidden":"";});
  viewer?.addEventListener("click",e=>{if(e.target===viewer){viewer.classList.remove("open");document.body.style.overflow=overlay.classList.contains("open")?"hidden":"";}});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(viewer?.classList.contains("open")){viewer.classList.remove("open");document.body.style.overflow=overlay.classList.contains("open")?"hidden":"";}else if(overlay.classList.contains("open"))shut();}});
  render();
}
initDaniCorner();initDrawingsGallery();initShenronAssistant();

/* ---------- Universo de Jasmyn: clima, surpresa e escolha inteligente ---------- */
const JASMYN_MOODS = {
  romance:{label:"Romance", intro:"Hoje combina com borboletas no estômago.", tags:["romance","slow burn"]},
  paixao:{label:"Paixão", intro:"Hoje o coração pediu intensidade.", tags:["romance","obsessão","possessivo"]},
  realeza:{label:"Realeza", intro:"Hoje você merece um castelo, uma coroa e um problema romântico.", tags:["princesa","duque","realeza"]},
  drama:{label:"Drama", intro:"Hoje é dia de sofrer bonito e virar a página mesmo assim.", tags:["drama","vingança","traição"]},
  fantasia:{label:"Fantasia", intro:"Hoje vamos abrir uma porta para outro mundo.", tags:["fantasia","magia","isekai"]},
  poder:{label:"Mulher poderosa", intro:"Hoje ninguém vai tirar o protagonismo dela.", tags:["mulher poderosa","vilã","vingança"]}
};
function chooseMoodBook(mood){
  const cfg=JASMYN_MOODS[mood]; if(!cfg) return null;
  const ranked=BOOKS.map(b=>{
    const hay=normalizeText([b.title,...(b.genres||[]),...(b.tags||[]),b.synopsis||""].join(" "));
    const score=cfg.tags.reduce((n,t)=>n+(hay.includes(normalizeText(t))?2:0),0)+(b.featured?1:0);
    return {b,score};
  }).sort((a,b)=>b.score-a.score || a.b.title.localeCompare(b.b.title));
  return ranked[0]?.b || null;
}
function renderUniverseResult(title,text,book=null){
  const t=document.getElementById("universeResultTitle"),p=document.getElementById("universeResultText"),btn=document.getElementById("universeOpenBtn");
  if(t)t.textContent=title; if(p)p.textContent=text;
  if(btn){btn.classList.toggle("hidden",!book); btn.textContent=book?"Ver história ↗":"Ver história"; btn.onclick=()=>book&&openModal(book.id);}
}
function updateJasmynStats(){
  const a=document.getElementById("jasmynCompletedStat"),b=document.getElementById("jasmynFavoriteStat"),c=document.getElementById("jasmynWantStat");
  if(a)a.textContent=completed.size; if(b)b.textContent=favorites.size; if(c)c.textContent=wantToRead.size;
  if(profileOpen && typeof renderProfile === "function") renderProfile();
}
const DAILY_SURPRISES = [
  {emoji:"💋", action:"UM BEIJÃO", text:"Muaaaackk! Um beijão pra mulher mais linda do mundo. 💋", motion:"kiss"},
  {emoji:"🤗", action:"ABRAÇO APERTADO", text:"Vem cá… hoje tem um abraço daqueles que apertam, aquecem e não querem soltar. 🤗", motion:"hug"},
  {emoji:"😏", action:"OLHAR SEDUTOR", text:"Se eu estivesse aí agora, ia te olhar daquele jeitinho que entrega tudo sem precisar dizer uma palavra. 😏", motion:"look"},
  {emoji:"😘", action:"BEIJO ROUBADO", text:"Passei rapidinho só pra roubar um beijo seu… e talvez roubar mais um antes de ir. 😘", motion:"kiss"},
  {emoji:"🫶", action:"CARINHO EXTRA", text:"Hoje você ganhou carinho em dobro, porque ser a mulher mais linda do mundo merece tratamento especial. 🫶", motion:"heart"},
  {emoji:"🥰", action:"MIMO DO KEVIN", text:"Um carinho no cabelo, um sorriso bem pertinho e um ‘eu te amo’ baixinho só pra você. 🥰", motion:"soft"},
  {emoji:"😉", action:"PROVOCAÇÃO LEVE", text:"Não olha assim pra mim, Jasmyn… você sabe que eu fico sem saber se dou risada ou se chego mais perto. 😉", motion:"wink"},
  {emoji:"💗", action:"DECLARAÇÃO", text:"Só passando para lembrar: entre todas as histórias desta página, você continua sendo a minha favorita. 💗", motion:"heart"}
];
function buildDailySurprise(key){
  const item=DAILY_SURPRISES[hashString(key+"|daily-surprise")%DAILY_SURPRISES.length];
  return {date:key,...item};
}
function openDailySurprise(gift){
  const overlay=document.getElementById("surpriseOverlay"); if(!overlay)return;
  overlay.dataset.motion=gift.motion||"soft";
  const emoji=overlay.querySelector(".surprise-emoji"), action=overlay.querySelector(".surprise-action"), text=overlay.querySelector(".surprise-text"), sig=overlay.querySelector(".surprise-signature"), date=overlay.querySelector(".surprise-date");
  if(emoji)emoji.textContent=gift.emoji; if(action)action.textContent=gift.action; if(text)text.textContent=gift.text; if(sig)sig.textContent="Kevin Daniel"; if(date)date.textContent="Surpresa de hoje · volte amanhã para outra ♡";
  [emoji,action,text].forEach(el=>{if(el){el.classList.remove("surprise-replay");void el.offsetWidth;el.classList.add("surprise-replay");}});
  overlay.classList.add("open"); document.body.style.overflow="hidden";
}
function closeDailySurprise(){document.getElementById("surpriseOverlay")?.classList.remove("open");if(!document.querySelector(".modal-overlay.open,.dani-overlay.open,.dani-god-overlay.open"))document.body.style.overflow="";}

function initDailyLetter(){
  renderDailyLetter();
  const btn=document.getElementById("loveLetterBtn");
  const letter=document.getElementById("loveLetter");
  const close=document.getElementById("closeLoveLetter");
  if(!btn||!letter)return;
  let closeTimer=0;
  const closeLetter=()=>{
    clearTimeout(closeTimer);
    letter.classList.remove("is-visible");
    letter.classList.add("is-closing");
    btn.classList.remove("is-open");
    btn.setAttribute("aria-expanded","false");
    closeTimer=setTimeout(()=>{letter.hidden=true;letter.classList.remove("is-closing");},1250);
  };
  btn.addEventListener("click",e=>{
    e.preventDefault(); e.stopPropagation();
    renderDailyLetter();
    clearTimeout(closeTimer);
    letter.hidden=false;
    letter.classList.remove("is-closing");
    btn.classList.add("is-open");
    btn.setAttribute("aria-expanded","true");
    requestAnimationFrame(()=>letter.classList.add("is-visible"));
    clearTimeout(closeTimer);
    closeTimer=setTimeout(closeLetter,9000);
  });
  close?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();closeLetter();});
}
function initJasmynUniverse(){
  const saved=localStorage.getItem(STORAGE_KEYS.mood);
  document.querySelectorAll(".mood-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const mood=btn.dataset.mood; localStorage.setItem(STORAGE_KEYS.mood,mood);
      document.querySelectorAll(".mood-btn").forEach(b=>b.classList.toggle("active",b===btn));
      const cfg=JASMYN_MOODS[mood],book=chooseMoodBook(mood);
      renderUniverseResult(cfg.label, book ? `${cfg.intro} Eu encontrei “${book.title}” para esse momento.` : cfg.intro, book);
    });
    if(saved && btn.dataset.mood===saved) btn.classList.add("active");
  });
  if(saved && JASMYN_MOODS[saved]){const cfg=JASMYN_MOODS[saved],book=chooseMoodBook(saved);renderUniverseResult(cfg.label,book?`${cfg.intro} Eu encontrei “${book.title}” para esse momento.`:cfg.intro,book);}
  document.getElementById("chooseForHeartBtn")?.addEventListener("click",e=>{
    e.preventDefault(); e.stopPropagation();
    const btn=document.getElementById("chooseForHeartBtn"),result=document.getElementById("universeResult");
    const pool=BOOKS.filter(hasOriginalCover); if(!pool.length)return;
    const book=pool[hashString(localDateKey()+"|jasmyn-choice-v25")%pool.length];
    if(btn){btn.classList.remove("choice-burst");void btn.offsetWidth;btn.classList.add("choice-burst");}
    if(result){result.classList.remove("choice-reveal");void result.offsetWidth;}
    renderUniverseResult("O destino escolheu por você. ✨",`“${book.title}” foi a escolhida de hoje. Eu considerei seu clima e deixei o destino dar o último empurrão. Confia em mim. 💗`,book);
    requestAnimationFrame(()=>result?.classList.add("choice-reveal"));
  });
  updateJasmynStats();
  const surpriseBtn=document.getElementById("openLittleSurprise");
  const todayKey=localDateKey();
  const surpriseSaved=loadObj(STORAGE_KEYS.surprise);
  if(surpriseBtn && surpriseSaved.date===todayKey) surpriseBtn.innerHTML="🎁 Reabrir a surpresa de hoje";
  surpriseBtn?.addEventListener("click",()=>{
    const key=localDateKey();
    const saved=loadObj(STORAGE_KEYS.surprise);
    const gift=saved.date===key ? saved : buildDailySurprise(key);
    if(saved.date!==key) saveObj(STORAGE_KEYS.surprise,gift);
    surpriseBtn.innerHTML="🎁 Reabrir a surpresa de hoje";
    openDailySurprise(gift);
  });
}

syncDaniProgress(false);
try{initDailyLetter();}catch(err){console.warn("Cartinha:",err);}
try{initJasmynUniverse();}catch(err){console.warn("Universo:",err);}

try{initProfile();}catch(err){console.warn("Perfil inicialização:",err);}
try{initHelenaView();}catch(err){console.warn("Helena inicialização:",err);}
requestAnimationFrame(()=>syncDocumentScrollLock());
document.getElementById("surpriseClose")?.addEventListener("click", closeDailySurprise);
document.getElementById("surpriseOverlay")?.addEventListener("click", e=>{if(e.target.id==="surpriseOverlay")closeDailySurprise();});


/* ---------- Fluidez de rolagem e aquecimento progressivo de imagens ---------- */
(function initSmoothRuntime(){
  let scrollTimer=0, ticking=false;
  const markScrolling=()=>{
    document.documentElement.classList.add("is-scrolling");
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(()=>document.documentElement.classList.remove("is-scrolling"),110);
  };
  window.addEventListener("scroll",()=>{
    if(!ticking){
      requestAnimationFrame(()=>{markScrolling();ticking=false;});
      ticking=true;
    }
  },{passive:true});
  window.addEventListener("touchmove",markScrolling,{passive:true});
  if("IntersectionObserver" in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        const img=entry.target;
        if(img.loading==="lazy") img.loading="eager";
        if(img.decode) img.decode().catch(()=>{});
        io.unobserve(img);
      });
    },{root:null,rootMargin:"1100px 0px",threshold:0.01});
    document.querySelectorAll("img[loading='lazy']").forEach(img=>io.observe(img));
  }
})();

/* ---------- PWA: atualização sem recarregar a página à força ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).catch(err=>console.warn("Service Worker:",err));
  });
}
