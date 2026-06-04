/* ============================================================
   LISTA DE PRESENTES — APP.JS
   Integração com Google Apps Script como backend
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// ⚠️  CONFIGURAÇÃO: cole aqui a URL do seu Apps Script
//     (gerada no passo 5 do tutorial)
// ─────────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/SEU_ID_AQUI/exec';
// ─────────────────────────────────────────────────────────────

// Lista de presentes (fonte de verdade do lado cliente)
// O campo "reservedBy" virá do servidor; aqui só definimos os itens.
const GIFTS = [
  // COZINHA
  { id: 'c01',  name: 'Jogo de copos de vidro',             category: 'cozinha' },
  { id: 'c02',  name: 'Jarra de vidro',                     category: 'cozinha' },
  { id: 'c03',  name: 'Jogo de jarra e copos de vidro',     category: 'cozinha' },
  { id: 'c04',  name: 'Jogo de taças de vidro',             category: 'cozinha' },
  { id: 'c05',  name: 'Jogo de talheres branco',            category: 'cozinha' },
  { id: 'c06',  name: 'Garrafa de café branca',             category: 'cozinha' },
  { id: 'c07',  name: 'Jogo de jantar branco',              category: 'cozinha' },
  { id: 'c08',  name: 'Jogo de xícaras',                    category: 'cozinha' },
  { id: 'c09',  name: 'Kit de tigelas claras',              category: 'cozinha' },
  { id: 'c10',  name: 'Kit de vasilhas claras',             category: 'cozinha' },
  { id: 'c11',  name: 'Kit de utensílios de cozinha',       category: 'cozinha' },
  { id: 'c12',  name: 'Potes de vidro (arroz, café etc.)',  category: 'cozinha' },
  { id: 'c13',  name: 'Escorredor de louça inox',           category: 'cozinha' },
  { id: 'c14',  name: 'Jogo de panelas',                    category: 'cozinha' },
  { id: 'c15',  name: 'Forma de bolo grande',               category: 'cozinha' },
  { id: 'c16',  name: 'Forma de bolo média',                category: 'cozinha' },
  { id: 'c17',  name: 'Forma de bolo pequena',              category: 'cozinha' },
  { id: 'c18',  name: 'Porta-temperos de vidro',            category: 'cozinha' },
  { id: 'c19',  name: 'Jogo de sobremesa',                  category: 'cozinha' },
  { id: 'c20',  name: 'Boleira de vidro',                   category: 'cozinha' },
  { id: 'c21',  name: 'Jogo de tapetes para cozinha',       category: 'cozinha' },
  { id: 'c22',  name: 'Sanduicheira preta',                 category: 'cozinha' },
  { id: 'c23',  name: 'Batedeira preta',                    category: 'cozinha' },
  { id: 'c24',  name: 'Air Fryer preta',                    category: 'cozinha' },
  { id: 'c25',  name: 'Micro-ondas preto',                  category: 'cozinha' },
  { id: 'c26',  name: 'Jogo americano',                     category: 'cozinha' },
  { id: 'c27',  name: 'Liquidificador preto',               category: 'cozinha' },

  // QUARTO
  { id: 'q01',  name: 'Jogo de cama (1)',                   category: 'quarto' },
  { id: 'q02',  name: 'Jogo de cama (2)',                   category: 'quarto' },
  { id: 'q03',  name: 'Jogo de cama (3)',                   category: 'quarto' },
  { id: 'q04',  name: 'Edredom casal (1)',                  category: 'quarto' },
  { id: 'q05',  name: 'Edredom casal (2)',                  category: 'quarto' },
  { id: 'q06',  name: 'Ferro de passar',                    category: 'quarto' },

  // BANHEIRO
  { id: 'b01',  name: 'Jogo de tapete para banheiro',       category: 'banheiro' },
  { id: 'b02',  name: 'Jogo de toalhas (1)',                category: 'banheiro' },
  { id: 'b03',  name: 'Jogo de toalhas (2)',                category: 'banheiro' },
  { id: 'b04',  name: 'Lixeira inox',                       category: 'banheiro' },
  { id: 'b05',  name: 'Kit banheiro (porta-escova e sabonete)', category: 'banheiro' },
];

// Estado local
let reservations = {};   // { id: 'Nome do convidado' }
let selectedGift = null;
let activeCategory = 'all';

// ── DOM refs ──────────────────────────────────────────────────
const giftGrid      = document.getElementById('giftGrid');
const statusLoading = document.getElementById('statusLoading');
const statusCounts  = document.getElementById('statusCounts');
const countAvailable= document.getElementById('countAvailable');
const countReserved = document.getElementById('countReserved');
const filterBtns    = document.querySelectorAll('.filter-btn');

const modalOverlay  = document.getElementById('modalOverlay');
const modalItemName = document.getElementById('modalItemName');
const guestName     = document.getElementById('guestName');
const btnConfirm    = document.getElementById('btnConfirm');
const formError     = document.getElementById('formError');
const modalClose    = document.getElementById('modalClose');

const successOverlay= document.getElementById('successOverlay');
const successMsg    = document.getElementById('successMsg');
const btnSuccessClose = document.getElementById('btnSuccessClose');

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderGrid();
  fetchReservations();
  bindFilters();
  bindModal();
});

// ── Render grid ───────────────────────────────────────────────
function renderGrid() {
  giftGrid.innerHTML = '';
  GIFTS.forEach((gift, i) => {
    const card = document.createElement('div');
    card.className = 'gift-card';
    card.dataset.id = gift.id;
    card.dataset.category = gift.category;
    card.style.animationDelay = `${i * 18}ms`;
    card.innerHTML = buildCard(gift);
    giftGrid.appendChild(card);
  });
  applyFilter();
}

function buildCard(gift) {
  const reserved = reservations[gift.id];
  if (reserved) {
    return `
      <span class="card-category">${categoryLabel(gift.category)}</span>
      <p class="card-name">${gift.name}</p>
      <div class="card-reserved-badge">
        <span class="badge-label">Reservado</span>
        <span class="badge-name">${escHtml(reserved)}</span>
      </div>`;
  }
  return `
    <span class="card-category">${categoryLabel(gift.category)}</span>
    <p class="card-name">${gift.name}</p>
    <button class="btn-reserve" data-id="${gift.id}">Reservar</button>`;
}

function refreshCards() {
  document.querySelectorAll('.gift-card').forEach(card => {
    const id = card.dataset.id;
    const gift = GIFTS.find(g => g.id === id);
    if (!gift) return;
    card.innerHTML = buildCard(gift);
    card.classList.toggle('reserved', !!reservations[id]);
  });

  // re-bind reserve buttons
  document.querySelectorAll('.btn-reserve').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.id));
  });

  updateCounts();
  applyFilter();
}

function updateCounts() {
  const total   = GIFTS.length;
  const res     = Object.keys(reservations).length;
  countAvailable.textContent = total - res;
  countReserved.textContent  = res;
  statusLoading.style.display = 'none';
  statusCounts.style.display  = 'block';
}

// ── Category filter ───────────────────────────────────────────
function bindFilters() {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      applyFilter();
    });
  });
}

function applyFilter() {
  document.querySelectorAll('.gift-card').forEach(card => {
    const match = activeCategory === 'all' || card.dataset.category === activeCategory;
    card.classList.toggle('hidden', !match);
  });
}

// ── Modal ─────────────────────────────────────────────────────
function bindModal() {
  document.querySelectorAll('.btn-reserve').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.id));
  });

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  btnConfirm.addEventListener('click', handleConfirm);
  guestName.addEventListener('keydown', e => { if (e.key === 'Enter') handleConfirm(); });

  btnSuccessClose.addEventListener('click', () => {
    successOverlay.classList.remove('open');
    successOverlay.setAttribute('aria-hidden', 'true');
  });
  successOverlay.addEventListener('click', e => {
    if (e.target === successOverlay) {
      successOverlay.classList.remove('open');
      successOverlay.setAttribute('aria-hidden', 'true');
    }
  });
}

function openModal(id) {
  if (reservations[id]) return;
  selectedGift = GIFTS.find(g => g.id === id);
  if (!selectedGift) return;
  modalItemName.textContent = selectedGift.name;
  guestName.value = '';
  formError.textContent = '';
  btnConfirm.disabled = false;
  modalOverlay.classList.add('open');
  modalOverlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => guestName.focus(), 200);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  modalOverlay.setAttribute('aria-hidden', 'true');
  selectedGift = null;
}

// ── Confirm reservation ───────────────────────────────────────
async function handleConfirm() {
  const name = guestName.value.trim();
  if (!name) {
    formError.textContent = 'Por favor, informe seu nome.';
    guestName.focus();
    return;
  }
  if (name.length < 2) {
    formError.textContent = 'Nome muito curto.';
    return;
  }
  if (reservations[selectedGift.id]) {
    formError.textContent = 'Este presente já foi reservado.';
    return;
  }

  formError.textContent = '';
  btnConfirm.disabled = true;
  btnConfirm.textContent = 'Aguarde…';

  try {
    await saveReservation(selectedGift.id, selectedGift.name, name);
    reservations[selectedGift.id] = name;
    refreshCards();
    closeModal();
    showSuccess(selectedGift.name, name);
  } catch (err) {
    formError.textContent = 'Erro ao salvar. Tente novamente.';
    console.error(err);
  } finally {
    btnConfirm.disabled = false;
    btnConfirm.textContent = 'Confirmar reserva';
  }
}

function showSuccess(itemName, name) {
  successMsg.innerHTML = `<strong>${escHtml(name)}</strong>, sua reserva de<br><em>${escHtml(itemName)}</em><br>foi confirmada com sucesso.`;
  successOverlay.classList.add('open');
  successOverlay.setAttribute('aria-hidden', 'false');
}

// ── Google Apps Script integration ───────────────────────────

/** Busca todas as reservas já feitas na planilha */
async function fetchReservations() {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=list`);
    const data = await res.json();
    if (data.reservations) {
      reservations = {};
      data.reservations.forEach(r => {
        if (r.id && r.name) reservations[r.id] = r.name;
      });
    }
  } catch (err) {
    console.warn('Não foi possível carregar reservas:', err);
  }
  refreshCards();
}

/** Salva uma nova reserva na planilha */
async function saveReservation(id, itemName, guestNameValue) {
  const payload = { action: 'reserve', id, itemName, guestName: guestNameValue };
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Falha ao salvar.');
  return data;
}

// ── Helpers ───────────────────────────────────────────────────
function categoryLabel(cat) {
  return { cozinha: 'Cozinha', quarto: 'Quarto', banheiro: 'Banheiro' }[cat] || cat;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
