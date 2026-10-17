/**
 * Mada Marcenaria — Gerenciador de Químicos & Receitas
 * Lógica da Aplicação Tablet Industrial (1280x800)
 * Design System Compliance: Sem jargão, cores semânticas estritas, AppShell
 */

// Estado Global da Aplicação
const appState = {
  currentScreen: 'screen-auth',
  isOffline: false,
  selectedOperator: {
    name: 'Ana Souza',
    role: 'Operador(a) Líder PU',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
  },
  pinEntered: '',
  selectedEnvironment: 'Cozinha Gourmet',
  selectedOS: 'OS #8841',
  currentPieceLotIndex: 0,
  pieceLots: [
    { title: 'Portas Armários Superiores', qty: '8 Peças', substrate: 'MDF Naval 18mm', area: '4,20 m²', estVolume: '850 – 1.050 ml' },
    { title: 'Painéis Laterais de Gabinete', qty: '4 Peças', substrate: 'MDF Cru 25mm', area: '3,10 m²', estVolume: '620 – 780 ml' },
    { title: 'Frentes de Gavetões Gourmet', qty: '6 Peças', substrate: 'MDF Naval 18mm', area: '2,80 m²', estVolume: '560 – 700 ml' }
  ],
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
  },
  criticalJustification: null,
  supervisorPinValid: false,
  returnChecklist: {
    chk1: false,
    chk2: false,
    chk3: false
  }
};

// ==========================================================================
// 1. Navegação de Telas e AppShell
// ==========================================================================
function navigateTo(screenId) {
  const screens = document.querySelectorAll('.screen-view');
  screens.forEach(s => s.classList.remove('active'));

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
    showToast('Acesso do Supervisor Fábio concedido.', 'info');
  }
}

// Simulação de Queda de Rede / Servidor (StatusBanner)
function toggleNetworkConnection() {
  appState.isOffline = !appState.isOffline;
  const banner = document.getElementById('statusBannerOffline');
  const wifiBadge = document.getElementById('statusWifi');
  const serverBadge = document.getElementById('statusServer');
  const wifiLabel = document.getElementById('wifiLabel');
  const serverLabel = document.getElementById('serverLabel');
  const btnSubmit = document.getElementById('btnPinSubmit');
  const toggleLabel = document.getElementById('toggleNetworkLabel');

  if (appState.isOffline) {
    banner.classList.add('visible');
    wifiBadge.classList.add('is-offline');
    serverBadge.classList.add('is-offline');
    wifiLabel.textContent = 'Sem Wi-Fi';
    serverLabel.textContent = 'Servidor Offline';
    btnSubmit.disabled = true;
    toggleLabel.textContent = 'Restaurar Conexão';
    showToast('Atenção: Queda de conexão com o servidor local.', 'danger', 3500);
  } else {
    banner.classList.remove('visible');
    wifiBadge.classList.remove('is-offline');
    serverBadge.classList.remove('is-offline');
    wifiLabel.textContent = 'Wi-Fi Conectado';
    serverLabel.textContent = 'Servidor Ativo';
    btnSubmit.disabled = false;
    toggleLabel.textContent = 'Simular Offline';
    showToast('Conexão restabelecida com sucesso.', 'success', 3000);
  }
}

// ==========================================================================
// 2. Autenticação Rápida & PIN Pad (Tela 1)
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
      card.querySelector('.operator-status-label').textContent = 'Selecionado(a)';

      const name = card.dataset.name;
      const role = card.dataset.role;
      const photo = card.querySelector('.operator-photo').src;

      appState.selectedOperator = { name, role, avatar: photo };

      // Atualizar títulos do PIN, AppShell Header e Etiqueta
      document.getElementById('pinTargetName').textContent = `PIN de ${name}`;
      document.getElementById('dashOpName').textContent = name.split(' ')[0];
      document.getElementById('headerOpName').textContent = name;
      document.getElementById('headerOpRole').textContent = role;
      document.getElementById('headerOpAvatar').src = photo;
      const elStickerOp = document.getElementById('stickerOpName');
      if (elStickerOp) elStickerOp.textContent = name;

      clearPin();
    });
  });
}

function pressKey(num) {
  if (appState.isOffline) {
    showToast('Sistema offline. Entrada bloqueada.', 'danger');
    return;
  }

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
  const slotsContainer = document.getElementById('pinSlots');
  const len = appState.pinEntered.length;

  // Remover estados de erro prévios ao digitar
  slotsContainer.classList.remove('has-error');
  slots.forEach((slot, idx) => {
    slot.classList.remove('has-error');
    if (idx < len) {
      slot.classList.add('filled');
    } else {
      slot.classList.remove('filled');
    }
  });

  const hint = document.getElementById('pinHint');
  hint.className = 'pin-hint';

  if (len === 4) {
    hint.textContent = '✓ 4 dígitos inseridos • Toque em Entrar';
    hint.classList.add('hint-success');
  } else if (len > 0) {
    hint.textContent = `${len} de 4 dígitos inseridos`;
  } else {
    hint.textContent = 'Insira 4 dígitos';
  }
}

function triggerPinError() {
  const slotsContainer = document.getElementById('pinSlots');
  const slots = document.querySelectorAll('#pinSlots .pin-slot');
  const hint = document.getElementById('pinHint');

  slotsContainer.classList.add('has-error');
  slots.forEach(slot => slot.classList.add('has-error'));
  hint.textContent = 'PIN inválido. Tente novamente.';
  hint.className = 'pin-hint hint-error';

  setTimeout(() => {
    clearPin();
  }, 700);
}

function submitAuth() {
  if (appState.isOffline) {
    showToast('Ação indisponível: Servidor local offline.', 'danger');
    return;
  }

  if (appState.pinEntered.length < 4) {
    showToast('Por favor, digite os 4 dígitos do seu PIN.', 'warn');
    return;
  }

  // Demonstração de PIN inválido (caso digite '0000')
  if (appState.pinEntered === '0000') {
    triggerPinError();
    return;
  }

  // Autenticação bem-sucedida
  navigateTo('screen-dashboard');
  showToast(`Bem-vindo(a), ${appState.selectedOperator.name}! Conectado(a) com sucesso.`, 'success', 3000);
}

// ==========================================================================
// 3. Modais do Dashboard & Use Primeiro (Tela 2)
// ==========================================================================
function openUseFirstModal() {
  const modal = document.getElementById('modalUseFirst');
  if (modal) modal.classList.add('active');
}

function closeUseFirstModal() {
  const modal = document.getElementById('modalUseFirst');
  if (modal) modal.classList.remove('active');
}

// ==========================================================================
// 4. Ordem de Serviço & Ambientes (Tela 3)
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

  showToast(`Ambiente selecionado: ${envName} (${osCode})`, 'info', 2500);
}

function scanQrForOs() {
  showToast('📷 Lendo QR Code da ficha impressa...', 'info', 1200);
  setTimeout(() => {
    showToast('✓ Ordem de Serviço OS-8841-2026 vinculada!', 'success', 3000);
  }, 600);
}

function openChangeOsModal() {
  // Alternar entre duas Ordens de Serviço reais para demonstração
  if (appState.selectedOS.includes('8841')) {
    appState.selectedOS = 'OS #8850';
    document.getElementById('osClientName').textContent = 'Residência Morumbi — Bloco B';
    document.getElementById('osProjectName').textContent = 'Projeto Suíte Master • Código: OS-8850-2026';
    showToast('Ordem de Serviço alterada para OS-8850-2026.', 'info');
  } else {
    appState.selectedOS = 'OS #8841';
    document.getElementById('osClientName').textContent = 'João Mendonça Residencial';
    document.getElementById('osProjectName').textContent = 'Residência Alphaville — Bloco Social • Código: OS-8841-2026';
    showToast('Ordem de Serviço alterada para OS-8841-2026.', 'info');
  }
}

function changePieceLot() {
  appState.currentPieceLotIndex = (appState.currentPieceLotIndex + 1) % appState.pieceLots.length;
  const lot = appState.pieceLots[appState.currentPieceLotIndex];

  document.getElementById('pieceLotTitle').textContent = lot.title;
  document.getElementById('pieceLotQty').textContent = lot.qty;

  showToast(`Lote alterado: ${lot.title} (${lot.qty})`, 'info');
}

// Modal Cancelar Preparação
function openCancelPreparationModal() {
  const modal = document.getElementById('modalCancelPrep');
  if (modal) modal.classList.add('active');
}

function closeCancelPreparationModal() {
  const modal = document.getElementById('modalCancelPrep');
  if (modal) modal.classList.remove('active');
}

function confirmCancelPreparation() {
  closeCancelPreparationModal();
  showToast('Preparação cancelada. Nenhuma baixa realizada.', 'info');
  navigateTo('screen-dashboard');
}

// ==========================================================================
// 5. Calculadora da Receita Sayerlack (Tela 4)
// ==========================================================================
function setTotalVolume(vol) {
  appState.recipe.totalVolume = vol;
  recalculateRecipe();

  document.querySelectorAll('.preset-chip-btn').forEach(chip => {
    chip.classList.remove('active');
    const chipText = chip.textContent.replace(/\./g, '');
    if (chipText.includes(vol.toString())) {
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
  const displayVol = document.getElementById('displayTotalVolume');
  if (displayVol) displayVol.textContent = vol.toLocaleString('pt-BR');

  // 1. Base PU (50%)
  const volBase = Math.round(vol * appState.recipe.proportions.base);
  const weightBase = Math.round(volBase * appState.recipe.densities.base);
  const elVolBase = document.getElementById('volBase');
  const elWeightBase = document.getElementById('weightBase');
  if (elVolBase) elVolBase.textContent = `${volBase} ml`;
  if (elWeightBase) elWeightBase.textContent = `Peso: ${weightBase} g`;

  // 2. Catalisador (25%)
  const volCat = Math.round(vol * appState.recipe.proportions.catalisador);
  const weightCat = Math.round(volCat * appState.recipe.densities.catalisador);
  const elVolCat = document.getElementById('volCat');
  const elWeightCat = document.getElementById('weightCat');
  if (elVolCat) elVolCat.textContent = `${volCat} ml`;
  if (elWeightCat) elWeightCat.textContent = `Peso: ${weightCat} g`;

  // 3. Diluidor (20%)
  const volDil = Math.round(vol * appState.recipe.proportions.diluidor);
  const weightDil = Math.round(volDil * appState.recipe.densities.diluidor);
  const elVolDil = document.getElementById('volDil');
  const elWeightDil = document.getElementById('weightDil');
  if (elVolDil) elVolDil.textContent = `${volDil} ml`;
  if (elWeightDil) elWeightDil.textContent = `Peso: ${weightDil} g`;

  // 4. Retardador (5%)
  const volRet = Math.round(vol * appState.recipe.proportions.retardador);
  const weightRet = Math.round(volRet * appState.recipe.densities.retardador);
  const elVolRet = document.getElementById('volRet');
  const elWeightRet = document.getElementById('weightRet');
  if (elVolRet) elVolRet.textContent = `${volRet} ml`;
  if (elWeightRet) elWeightRet.textContent = `Peso: ${weightRet} g`;
}

function confirmRecipeWeighing() {
  showToast('✓ Proporções confirmadas na balança! Consumo registrado na OS.', 'success', 3000);
  navigateTo('screen-dashboard');
}

// ==========================================================================
// 6. Modal Crítico de Alerta de Excesso (Tela 5)
// ==========================================================================
function openAntiErrorModal() {
  const modal = document.getElementById('modalAntiError');
  if (modal) modal.classList.add('active');

  // Resetar seleções e inputs do modal
  appState.criticalJustification = null;
  appState.supervisorPinValid = false;
  document.querySelectorAll('.just-chip-btn').forEach(b => b.classList.remove('selected'));

  const supBox = document.getElementById('supervisorPinBox');
  if (supBox) supBox.classList.remove('visible');

  const supInput = document.getElementById('supervisorPinInput');
  if (supInput) supInput.value = '';

  const supFeedback = document.getElementById('supervisorPinFeedback');
  if (supFeedback) {
    supFeedback.textContent = 'Supervisor cadastrado: PIN 9999 ou 1234';
    supFeedback.style.color = 'var(--text-muted)';
  }

  const btnConfirm = document.getElementById('btnConfirmWaste');
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.title = 'Selecione um motivo antes de confirmar desperdício';
  }
}

function closeAntiErrorModal(action) {
  const modal = document.getElementById('modalAntiError');
  if (modal) modal.classList.remove('active');

  if (action === 'discard') {
    showToast('Medição descartada da balança. Balança re-tarada em zero.', 'info', 3000);
  }
}

function selectJustChipBtn(btn, reason) {
  document.querySelectorAll('.just-chip-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  appState.criticalJustification = reason;

  const supBox = document.getElementById('supervisorPinBox');
  const btnConfirm = document.getElementById('btnConfirmWaste');

  if (reason === 'supervisor') {
    if (supBox) {
      supBox.classList.add('visible');
      const input = document.getElementById('supervisorPinInput');
      if (input) input.focus();
    }
    // Permanece desabilitado até digitar PIN válido
    if (btnConfirm) {
      btnConfirm.disabled = !appState.supervisorPinValid;
      btnConfirm.title = appState.supervisorPinValid ? 'Segure por 1,5s para confirmar' : 'Digite o PIN do supervisor';
    }
  } else {
    if (supBox) supBox.classList.remove('visible');
    // Qualquer outro motivo habilita o botão de confirmação
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.title = 'Segure por 1,5s para confirmar desperdício e baixar estoque';
    }
  }
}

function handleSupervisorPinInput() {
  const input = document.getElementById('supervisorPinInput');
  const feedback = document.getElementById('supervisorPinFeedback');
  const btnConfirm = document.getElementById('btnConfirmWaste');
  if (!input || !feedback) return;

  const val = input.value.trim();
  if (val === '9999' || val === '1234') {
    appState.supervisorPinValid = true;
    feedback.textContent = '✓ Autorização confirmada pelo Supervisor Fábio';
    feedback.style.color = 'var(--ok)';
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.title = 'Segure por 1,5s para confirmar desperdício';
    }
  } else if (val.length === 4) {
    appState.supervisorPinValid = false;
    feedback.textContent = 'PIN inválido. Tente 9999 ou 1234.';
    feedback.style.color = 'var(--danger)';
    if (btnConfirm) btnConfirm.disabled = true;
  } else {
    appState.supervisorPinValid = false;
    feedback.textContent = 'Digite o PIN de 4 dígitos para autorizar';
    feedback.style.color = 'var(--text-muted)';
    if (btnConfirm) btnConfirm.disabled = true;
  }
}

function recalculateRecipeForExcess() {
  // Catalisador aumentou +200ml (250ml + 200ml = 450ml).
  // Para manter a proporção homologada de 25%:
  // Novo volume total da batelada = 450ml / 0.25 = 1.800ml
  setTotalVolume(1800);
  closeAntiErrorModal();
  showToast('✓ Receita recalculada para 1.800 ml: proporções químicas re-balanceadas!', 'success', 4000);
}

// ==========================================================================
// 7. Devolução de Sobras & Etiqueta (Tela 6)
// ==========================================================================
function adjustReturnVolume(delta) {
  const current = appState.returnSobra.volume;
  const newVol = Math.max(50, Math.min(appState.returnSobra.maxVolume, current + delta));
  appState.returnSobra.volume = newVol;

  const percent = Math.round((newVol / appState.returnSobra.maxVolume) * 100);

  const liquid = document.getElementById('bottleLiquid');
  if (liquid) liquid.style.height = `${percent}%`;
  const elVolText = document.getElementById('bottleVolText');
  if (elVolText) elVolText.textContent = `${newVol} ml`;
  const elReturnNumber = document.getElementById('returnVolNumber');
  if (elReturnNumber) elReturnNumber.textContent = newVol;

  const elStickerVol = document.getElementById('stickerVol');
  if (elStickerVol) elStickerVol.textContent = `${newVol} ml`;
}

function toggleChecklist(rowEl, checkId) {
  const isChecked = !rowEl.classList.contains('checked');
  if (isChecked) {
    rowEl.classList.add('checked');
  } else {
    rowEl.classList.remove('checked');
  }
  appState.returnChecklist[checkId] = isChecked;

  const allChecked = !!(appState.returnChecklist.chk1 &&
                        appState.returnChecklist.chk2 &&
                        appState.returnChecklist.chk3);

  const btnConfirm = document.getElementById('btnConfirmReturn');
  if (btnConfirm) {
    btnConfirm.disabled = !allChecked;
    btnConfirm.title = allChecked ? 'Toque para imprimir etiqueta e salvar sobra' : 'Marque os 3 itens do checklist antes de confirmar';
  }
}

function confirmReturnPrint() {
  const allChecked = !!(appState.returnChecklist.chk1 &&
                        appState.returnChecklist.chk2 &&
                        appState.returnChecklist.chk3);
  if (!allChecked) {
    showToast('Atenção: Marque todos os 3 itens do checklist de integridade.', 'warn');
    return;
  }

  showToast(`🖨️ Etiqueta de sobra impressa! ${appState.returnSobra.volume}ml devolvidos ao estoque.`, 'success', 3500);
  setTimeout(() => {
    navigateTo('screen-dashboard');
  }, 1200);
}

// ==========================================================================
// 8. Utilitários: Hold to Confirm (1,5s), Toast no Topo & Simulações
// ==========================================================================
function setupHoldToConfirm(btnId, barId, durationMs, onConfirm) {
  const btn = document.getElementById(btnId);
  const bar = document.getElementById(barId);
  if (!btn || !bar) return;

  let timer = null;

  function startHold(e) {
    if (btn.disabled) return;
    bar.style.transition = `width ${durationMs}ms linear`;
    bar.style.width = '100%';

    timer = setTimeout(() => {
      bar.style.transition = 'none';
      bar.style.width = '0%';
      timer = null;
      onConfirm();
    }, durationMs);
  }

  function cancelHold() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    bar.style.transition = 'width 0.15s ease-out';
    bar.style.width = '0%';
  }

  btn.addEventListener('pointerdown', startHold);
  btn.addEventListener('pointerup', cancelHold);
  btn.addEventListener('pointerleave', cancelHold);
  btn.addEventListener('pointercancel', cancelHold);
}

function simulateQRScan() {
  showToast('📷 Câmera do tablet ativa: Lendo QR Code...', 'info', 1000);
  setTimeout(() => {
    showToast('✓ Verniz PU Sayersystem Lote #SY-8821 identificado (Saldo: 400ml)', 'success', 3000);
    navigateTo('screen-recipe');
  }, 800);
}

function showToast(message, type = 'info', duration = 3000) {
  let toast = document.getElementById('appToast');
  if (!toast) return;

  const iconEl = document.getElementById('appToastIcon');
  const msgEl = document.getElementById('appToastMsg');

  // Definir Ícone e Classe por tipo
  toast.className = '';
  if (type === 'success') {
    toast.classList.add('toast-success');
    if (iconEl) iconEl.textContent = '✓';
  } else if (type === 'warn') {
    toast.classList.add('toast-warn');
    if (iconEl) iconEl.textContent = '⚠️';
  } else if (type === 'danger') {
    toast.classList.add('toast-danger');
    if (iconEl) iconEl.textContent = '🛑';
  } else {
    if (iconEl) iconEl.textContent = 'ℹ️';
  }

  if (msgEl) msgEl.textContent = message;

  toast.style.display = 'flex';
  toast.style.opacity = '1';

  clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 250);
  }, duration);
}

// ==========================================================================
// 9. Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupOperatorCards();
  recalculateRecipe();

  // Configurar HoldToConfirm para ações destrutivas (1,5s com barra animada)
  setupHoldToConfirm('btnConfirmWaste', 'holdBarWaste', 1500, () => {
    closeAntiErrorModal();
    showToast('🗑 Desperdício confirmado e registrado na OS (+200ml de catalisador).', 'warn', 3500);
    navigateTo('screen-dashboard');
  });

  setupHoldToConfirm('btnDiscardRefugo', 'holdBarRefugo', 1500, () => {
    showToast('🗑 Sobra de 400ml descartada como refugo químico.', 'danger', 3500);
    navigateTo('screen-dashboard');
  });
});
