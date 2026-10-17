/**
 * Mada Marcenaria — Gerenciador de Químicos & Receitas
 * Lógica da Aplicação Web Tablet-First
 */

// Estado Global da Aplicação
const appState = {
  currentScreen: 'screen-auth',
  selectedOperator: {
    name: 'Ana Souza',
    role: 'Operadora Líder PU',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
  },
  pinEntered: '',
  selectedEnvironment: 'Cozinha Gourmet',
  selectedOS: 'OS #8841',
  recipe: {
    totalVolume: 1000, // em ml
    proportions: {
      base: 0.50,       // 50%
      catalisador: 0.25,// 25%
      diluidor: 0.20,   // 20%
      retardador: 0.05  // 5%
    },
    densities: {
      base: 1.25,
      catalisador: 1.04,
      diluidor: 0.90,
      retardador: 0.92
    }
  },
  returnSobra: {
    volume: 400, // em ml
    maxVolume: 1000
  }
};

// ==========================================================================
// 1. Navegação de Telas
// ==========================================================================
function navigateTo(screenId) {
  // Esconder todas as telas
  const screens = document.querySelectorAll('.screen-view');
  screens.forEach(s => s.classList.remove('active'));

  // Ativar a tela alvo
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    appState.currentScreen = screenId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function toggleSupervisorView() {
  if (appState.currentScreen === 'screen-manager') {
    navigateTo('screen-dashboard');
  } else {
    navigateTo('screen-manager');
    showToast('Acesso concedido: Centro de Controle do Supervisor Fábio.');
  }
}


// ==========================================================================
// 2. Autenticação e PIN Pad (Tela 1)
// ==========================================================================
function setupOperatorCards() {
  const cards = document.querySelectorAll('.operator-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => {
        c.classList.remove('selected');
        c.querySelector('.operator-status-label').textContent = 'Toque para selecionar';
      });

      card.classList.add('selected');
      card.querySelector('.operator-status-label').textContent = 'Selecionada';

      const name = card.dataset.name;
      const role = card.dataset.role;
      const photo = card.querySelector('.operator-photo').src;

      appState.selectedOperator = { name, role, avatar: photo };

      // Atualizar títulos do PIN e do Dashboard
      document.getElementById('pinTargetName').textContent = `PIN de ${name}`;
      document.getElementById('dashOpName').textContent = name.split(' ')[0];
      document.getElementById('dashOpFullName').textContent = name;
      document.getElementById('dashOpAvatar').src = photo;

      clearPin();
    });
  });
}

function pressKey(num) {
  if (appState.pinEntered.length < 4) {
    appState.pinEntered += num;
    updatePinDisplay();
  }
}

function clearPin() {
  appState.pinEntered = '';
  updatePinDisplay();
}

function backspacePin() {
  if (appState.pinEntered.length > 0) {
    appState.pinEntered = appState.pinEntered.slice(0, -1);
    updatePinDisplay();
  }
}

function updatePinDisplay() {
  const slots = document.querySelectorAll('#pinSlots .pin-slot');
  const len = appState.pinEntered.length;

  slots.forEach((slot, idx) => {
    if (idx < len) {
      slot.classList.add('filled');
    } else {
      slot.classList.remove('filled');
    }
  });

  const hint = document.getElementById('pinHint');
  if (len === 4) {
    hint.textContent = '✓ 4 de 4 dígitos inseridos • Toque em Entrar';
    hint.style.color = 'var(--success)';
  } else {
    hint.textContent = `${len} de 4 dígitos inseridos`;
    hint.style.color = 'var(--text-muted)';
  }
}

function submitAuth() {
  if (appState.pinEntered.length < 4) {
    showToast('Por favor, digite os 4 dígitos do seu PIN.');
    return;
  }
  showToast(`Bem-vinda(o), ${appState.selectedOperator.name}! Terminal assumido.`);
  navigateTo('screen-dashboard');
}

// ==========================================================================
// 3. Ordem de Serviço & Ambientes (Tela 3)
// ==========================================================================
function selectEnv(chipElement, envName, osCode) {
  document.querySelectorAll('.env-chip').forEach(c => {
    c.classList.remove('selected');
    const check = c.querySelector('.env-chip-header span:last-child');
    if (check && check.textContent === '✓') check.remove();
  });

  chipElement.classList.add('selected');
  const headerSpan = chipElement.querySelector('.env-chip-header');
  const checkMark = document.createElement('span');
  checkMark.textContent = '✓';
  headerSpan.appendChild(checkMark);

  appState.selectedEnvironment = envName;
  appState.selectedOS = osCode;

  showToast(`Ambiente selecionado: ${envName} (${osCode})`);
}

// ==========================================================================
// 4. Calculadora da Receita Sayerlack (Tela 4)
// ==========================================================================
function setTotalVolume(vol) {
  appState.recipe.totalVolume = vol;
  recalculateRecipe();

  // Atualizar botões de preset
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.classList.remove('active');
    if (chip.textContent.includes(vol.toString())) {
      chip.classList.add('active');
    }
  });
}

function adjustTotalVolume(delta) {
  const newVol = Math.max(200, appState.recipe.totalVolume + delta);
  setTotalVolume(newVol);
}

function recalculateRecipe() {
  const vol = appState.recipe.totalVolume;
  document.getElementById('displayTotalVolume').textContent = vol.toLocaleString('pt-BR');

  // 1. Base PU (50%)
  const volBase = Math.round(vol * appState.recipe.proportions.base);
  const weightBase = Math.round(volBase * appState.recipe.densities.base);
  document.getElementById('volBase').textContent = `${volBase} ml`;
  document.getElementById('weightBase').textContent = `Peso: ${weightBase} g`;

  // 2. Catalisador (25%)
  const volCat = Math.round(vol * appState.recipe.proportions.catalisador);
  const weightCat = Math.round(volCat * appState.recipe.densities.catalisador);
  document.getElementById('volCat').textContent = `${volCat} ml`;
  document.getElementById('weightCat').textContent = `Peso: ${weightCat} g`;

  // 3. Diluidor (20%)
  const volDil = Math.round(vol * appState.recipe.proportions.diluidor);
  const weightDil = Math.round(volDil * appState.recipe.densities.diluidor);
  document.getElementById('volDil').textContent = `${volDil} ml`;
  document.getElementById('weightDil').textContent = `Peso: ${weightDil} g`;

  // 4. Retardador (5%)
  const volRet = Math.round(vol * appState.recipe.proportions.retardador);
  const weightRet = Math.round(volRet * appState.recipe.densities.retardador);
  document.getElementById('volRet').textContent = `${volRet} ml`;
  document.getElementById('weightRet').textContent = `Peso: ${weightRet} g`;
}

function confirmRecipeWeighing() {
  showToast('✓ Proporções confirmadas na balança Mettler! Consumo registrado na OS.');
  navigateTo('screen-dashboard');
}

// ==========================================================================
// 5. Modal Alerta Anti-Erro (Tela 5)
// ==========================================================================
function openAntiErrorModal() {
  const modal = document.getElementById('modalAntiError');
  modal.style.display = 'flex';
}

function closeAntiErrorModal(action) {
  const modal = document.getElementById('modalAntiError');
  modal.style.display = 'none';

  if (action === 'discard') {
    showToast('Medição descartada. Balança re-tarada para nova pesagem correta.');
  } else if (action === 'confirm') {
    showToast('⚠ Desperdício de Catalisador registrado (+R$ 86,40 debitado da OS #8841).');
    navigateTo('screen-dashboard');
  }
}

function selectJustChip(chip) {
  document.querySelectorAll('.just-chip').forEach(c => {
    c.classList.remove('selected');
    const check = c.querySelector('span');
    if (check) check.remove();
  });

  chip.classList.add('selected');
  const span = document.createElement('span');
  span.textContent = '✓ ';
  chip.prepend(span);
}

// ==========================================================================
// 6. Devolução de Sobras & Etiqueta (Tela 6)
// ==========================================================================
function adjustReturnVolume(delta) {
  const current = appState.returnSobra.volume;
  const newVol = Math.max(50, Math.min(appState.returnSobra.maxVolume, current + delta));
  appState.returnSobra.volume = newVol;

  const percent = Math.round((newVol / appState.returnSobra.maxVolume) * 100);

  // Atualizar Frasco e Nível
  const liquid = document.getElementById('bottleLiquid');
  liquid.style.height = `${percent}%`;
  document.getElementById('bottleVolText').textContent = `${newVol} ml`;
  document.getElementById('returnVolNumber').textContent = newVol;

  // Atualizar Etiqueta Térmica
  const approxGrams = Math.round(newVol * 0.95);
  document.getElementById('stickerVol').textContent = `${newVol} ml`;
}

function confirmReturnPrint() {
  const chk1 = document.getElementById('chkContam').checked;
  const chk2 = document.getElementById('chkVedacao').checked;
  const chk3 = document.getElementById('chkPureza').checked;

  if (!chk1 || !chk2 || !chk3) {
    showToast('Atenção: Todos os 3 critérios de integridade química devem ser validados.');
    return;
  }

  showToast(`🖨️ Etiqueta de sobra impressa na Zebra ZT411! ${appState.returnSobra.volume}ml reintegrados ao estoque.`);
  setTimeout(() => {
    navigateTo('screen-dashboard');
  }, 1200);
}

// ==========================================================================
// 7. Simulações e Utilitários
// ==========================================================================
function simulateQRScan() {
  showToast('📷 Câmera do tablet ativa: Lendo QR Code da lata...');
  setTimeout(() => {
    showToast('✓ QR Code identificado: Verniz PU Sayerlack Lote #SY-8821 (Saldo: 400ml)');
    navigateTo('screen-recipe');
  }, 900);
}

function showToast(message) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.style.position = 'fixed';
    toast.style.bottom = '75px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#0f172a';
    toast.style.color = '#ffffff';
    toast.style.padding = '14px 24px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
    toast.style.fontSize = '0.92rem';
    toast.style.fontWeight = '700';
    toast.style.zIndex = '999';
    toast.style.transition = 'all 0.25s ease';
    toast.style.border = '1px solid #334155';
    toast.style.maxWidth = '90vw';
    toast.style.textAlign = 'center';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.display = 'block';

  clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 250);
  }, 3200);
}

// ==========================================================================
// Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupOperatorCards();
  recalculateRecipe();
});
