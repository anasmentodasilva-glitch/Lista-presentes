// =============================================
// CONFIGURAÇÃO — cole aqui a URL do Apps Script
// =============================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwusrNIlbd-0lr7ecYeeZVasrC-an_WKI4M7zXr5YbgXGcyisJiZqVh0wtZjwlIDoDcEA/exec";

// =============================================
// LISTA DE PRESENTES
// (a fonte de verdade sobre os nomes dos itens)
// =============================================
const GIFT_CATEGORIES = [
  {
    icon: "🍽️",
    name: "Cozinha",
    items: [
      "Jogo de copos de vidro",
      "Jarra de vidro",
      "Jogo de jarra e copos de vidro",
      "Jogo de taças de vidro",
      "Jogo de talheres branco",
      "Garrafa de café branca",
      "Jogo de jantar branco",
      "Jogo de xícaras",
      "Kit de tigelas claras",
      "Kit de vasilhas claras",
      "Kit de utensílios de cozinha",
      "Potes de vidro para arroz, café e mantimentos",
      "Escorredor de louça inox",
      "Jogo de panelas",
      "Forma de bolo grande",
      "Forma de bolo média",
      "Forma de bolo pequena",
      "Porta-temperos de vidro",
      "Jogo de sobremesa",
      "Boleira de vidro",
      "Jogo de tapetes para cozinha",
      "Sanduicheira preta",
      "Batedeira preta",
      "Air Fryer preta",
      "Micro-ondas preto",
      "Jogo americano",
      "Liquidificador preto",
    ],
  },
  {
    icon: "🛏️",
    name: "Quarto",
    items: [
      "Jogo de cama (1)",
      "Jogo de cama (2)",
      "Jogo de cama (3)",
      "Edredom casal (1)",
      "Edredom casal (2)",
      "Ferro de passar",
    ],
  },
  {
    icon: "🚿",
    name: "Banheiro",
    items: [
      "Jogo de tapete para banheiro",
      "Jogo de toalhas (1)",
      "Jogo de toalhas (2)",
      "Lixeira inox",
      "Kit banheiro (porta escova de dentes e sabonete líquido)",
    ],
  },
];

// =============================================
// ESTADO DA APLICAÇÃO
// =============================================
let reservations = {}; // { "Nome do item": "Nome do convidado" }
let selectedItem = null;

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  loadReservations();

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-confirm").addEventListener("click", confirmReservation);
  document.getElementById("success-close").addEventListener("click", closeSuccess);

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });

  document.getElementById("guest-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirmReservation();
  });
});

// =============================================
// CARREGAR RESERVAS DA PLANILHA
// =============================================
async function loadReservations() {
  const overlay = document.getElementById("loading-overlay");

  try {
    const response = await fetch(
      `${APPS_SCRIPT_URL}?action=getReservations`,
      { method: "GET" }
    );
    const data = await response.json();

    if (data.success) {
      reservations = data.reservations || {};
    }
  } catch (err) {
    console.error("Erro ao carregar reservas:", err);
    // Continua mesmo com erro — mostra itens sem reserva
  }

  renderPage();

  overlay.classList.add("fade-out");
  setTimeout(() => overlay.remove(), 400);
}

// =============================================
// RENDERIZAR PÁGINA
// =============================================
function renderPage() {
  const main = document.getElementById("main-content");
  main.innerHTML = "";

  GIFT_CATEGORIES.forEach((category, catIndex) => {
    const section = document.createElement("section");
    section.classList.add("category-section");
    section.style.animationDelay = `${catIndex * 0.08}s`;

    section.innerHTML = `
      <div class="category-header">
        <span class="category-icon">${category.icon}</span>
        <h2 class="category-title">${category.name}</h2>
        <div class="category-divider"></div>
      </div>
      <div class="items-grid" id="grid-${catIndex}"></div>
    `;

    main.appendChild(section);

    const grid = section.querySelector(`#grid-${catIndex}`);
    category.items.forEach((itemName) => {
      grid.appendChild(createItemCard(itemName));
    });
  });
}

// =============================================
// CRIAR CARD
// =============================================
function createItemCard(itemName) {
  const card = document.createElement("div");
  card.classList.add("item-card");

  const reservedBy = reservations[itemName];

  if (reservedBy) {
    card.classList.add("reserved");
    card.innerHTML = `
      <p class="item-name">${itemName}</p>
      <span class="reserved-badge">Reservado</span>
      <p class="reserved-by">${reservedBy}</p>
    `;
  } else {
    card.innerHTML = `
      <p class="item-name">${itemName}</p>
      <button class="btn-reserve" data-item="${escapeHtml(itemName)}">Reservar</button>
    `;
    card.querySelector(".btn-reserve").addEventListener("click", () => openModal(itemName));
  }

  return card;
}

// =============================================
// MODAL — ABRIR / FECHAR
// =============================================
function openModal(itemName) {
  selectedItem = itemName;
  document.getElementById("modal-item-name").textContent = itemName;
  document.getElementById("guest-name").value = "";
  document.getElementById("modal-error").classList.add("hidden");
  document.getElementById("modal-confirm").disabled = false;
  document.getElementById("modal-overlay").classList.remove("hidden");
  setTimeout(() => document.getElementById("guest-name").focus(), 100);
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  selectedItem = null;
}

// =============================================
// CONFIRMAR RESERVA
// =============================================
async function confirmReservation() {
  const nameInput = document.getElementById("guest-name");
  const name = nameInput.value.trim();
  const errorEl = document.getElementById("modal-error");
  const confirmBtn = document.getElementById("modal-confirm");

  if (!name) {
    errorEl.textContent = "Por favor, informe seu nome.";
    errorEl.classList.remove("hidden");
    nameInput.focus();
    return;
  }

  if (!selectedItem) return;

  // Verifica se foi reservado enquanto o modal estava aberto
  if (reservations[selectedItem]) {
    errorEl.textContent = "Este item acabou de ser reservado por outra pessoa.";
    errorEl.classList.remove("hidden");
    closeModal();
    renderPage();
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Salvando…";

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "reserve",
        item: selectedItem,
        name: name,
      }),
    });

    const data = await response.json();

    if (data.success) {
      reservations[selectedItem] = name;
      closeModal();
      renderPage();
      showSuccess(selectedItem, name);
    } else if (data.alreadyReserved) {
      reservations[selectedItem] = data.reservedBy || "alguém";
      closeModal();
      renderPage();
      errorEl.textContent = "Este item já foi reservado.";
      // Não exibimos mais o modal de erro, apenas atualizamos a lista
    } else {
      errorEl.textContent = "Ocorreu um erro. Tente novamente.";
      errorEl.classList.remove("hidden");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirmar reserva";
    }
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Sem conexão. Verifique sua internet e tente novamente.";
    errorEl.classList.remove("hidden");
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirmar reserva";
  }
}

// =============================================
// MODAL DE SUCESSO
// =============================================
function showSuccess(itemName, guestName) {
  document.getElementById("success-message").textContent =
    `${guestName}, obrigada por escolher "${itemName}". Sua reserva foi registrada com carinho.`;
  document.getElementById("success-overlay").classList.remove("hidden");
}

function closeSuccess() {
  document.getElementById("success-overlay").classList.add("hidden");
}

// =============================================
// UTILITÁRIO
// =============================================
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
