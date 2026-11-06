// ============================================================================
// MÓDULO DE INICIALIZAÇÃO DA APLICAÇÃO & NAVEGAÇÃO - app.js
// ============================================================================

window.expenses = window.expenses || [];
window.cards = window.cards || [];
window.salaryConfigs = window.salaryConfigs || [];
window.extraIncomes = window.extraIncomes || [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Aguarda OBRIGATORIAMENTE o carregamento completo dos dados da nuvem (Supabase)
    if (typeof loadData === 'function') {
        await loadData();
    }
    
    // 2. Sincroniza o seletor de mês global com o calendário estilo Windows se disponível
    let globalMonth = document.getElementById('globalMonth');
    if (globalMonth && typeof monthsList !== 'undefined' && monthsList.length > 0) {
        globalMonth.innerHTML = '';
        monthsList.forEach(m => {
            let opt = document.createElement('option');
            opt.value = m;
            opt.innerText = m;
            globalMonth.appendChild(opt);
        });
        let initialMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : monthsList[0];
        globalMonth.value = initialMonth;
        
        let monthTextEl = document.getElementById('globalMonthText');
        if (monthTextEl) {
            monthTextEl.innerText = initialMonth;
        }
    }
    
    // 3. Renderiza o aplicativo completo com os dados já presentes em memória
    if (typeof renderApp === 'function') {
        renderApp();
    }
    if (typeof loadSalaryConfig === 'function') {
        loadSalaryConfig();
    }
    
    // Força uma nova verificação imediata para garantir que o dashboard puxou os totais
    setTimeout(() => {
        if (typeof renderApp === 'function') renderApp();
    }, 50);

    // Força a renderização inicial dos ícones
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ================= NAVEGAÇÃO ENTRE ABAS =================
function switchTab(tabName, clickedElement = null) {
    // Esconde todas as abas
    let tabs = ['tabDashboard', 'tabCards', 'tabHouse', 'tabSalary'];
    tabs.forEach(t => {
        let el = document.getElementById(t);
        if (el) el.classList.add('hidden');
    });

    // Exibe a aba selecionada
    let targetTab = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (targetTab) targetTab.classList.remove('hidden');

    // Remove a classe 'active' de todos os botões de navegação do topo e aplica no clicado
    const navButtons = document.querySelectorAll('header button, .nav-tabs button, .tabs-container button');
    navButtons.forEach(btn => btn.classList.remove('active'));

    // Se o elemento foi passado diretamente ou via event, marca como ativo
    let activeBtn = clickedElement || (event && event.currentTarget);
    if (activeBtn) {
        activeBtn.classList.add('active');
    } else {
        // Fallback: tenta encontrar o botão pelo nome da aba correspondente
        navButtons.forEach(btn => {
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').toLowerCase().includes(tabName.toLowerCase())) {
                btn.classList.add('active');
            }
        });
    }

    // Ajusta o seletor global de categorias do topo dependendo da aba ativa
    let filterCatSelect = document.getElementById('filterCategory');
    if (filterCatSelect) {
        if (tabName.toLowerCase() === 'salary' || tabName === 'Salary') {
            filterCatSelect.innerHTML = `
                <option value="">Todas as Entradas</option>
                <option value="Salário">Salário</option>
                <option value="Renda Extra">Renda Extra</option>
            `;
        } else {
            filterCatSelect.innerHTML = `
                <option value="">Todas</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Mercado">Mercado</option>
                <option value="Contas de Casa">Contas de Casa</option>
                <option value="Assinaturas">Assinaturas</option>
            `;
        }
    }

    if ((tabName.toLowerCase() === 'salary' || tabName === 'Salary') && typeof initSalaryTab === 'function') {
        initSalaryTab();
    }

    if (typeof renderApp === 'function') {
        renderApp();
    }
}

/**
 * Atualiza automaticamente a tela e a aba ativa no momento em tempo real.
 */
function refreshActiveView() {
    let dashTab = document.getElementById('tabDashboard');
    let cardsTab = document.getElementById('tabCards');
    let houseTab = document.getElementById('tabHouse');
    let salaryTab = document.getElementById('tabSalary');

    if (dashTab && !dashTab.classList.contains('hidden') && typeof renderDashboard === 'function') {
        renderDashboard();
    }
    if (cardsTab && !cardsTab.classList.contains('hidden') && typeof renderCardsView === 'function') {
        renderCardsView();
    }
    if (houseTab && !houseTab.classList.contains('hidden') && typeof renderHouseView === 'function') {
        renderHouseView();
    }
    if (salaryTab && !salaryTab.classList.contains('hidden')) {
        if (typeof initSalaryTab === 'function') initSalaryTab();
        else if (typeof loadSalaryConfig === 'function') loadSalaryConfig();
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Sobrescreve o renderApp global para atualizar a aba ativa instantaneamente
window.renderApp = function() {
    refreshActiveView();

    if (typeof renderCards === 'function') {
        renderCards();
    }

    if (typeof renderIncomesList === 'function') {
        renderIncomesList();
    }
};

window.addEventListener('load', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 100);
setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 500);
setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 1000);
