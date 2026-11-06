// ============================================================================
// INICIALIZAÇÃO DA APLICAÇÃO & NAVEGAÇÃO - app.js
// ============================================================================

window.expenses = window.expenses || [];
window.cards = window.cards || [];
window.salaryConfigs = window.salaryConfigs || [];
window.extraIncomes = window.extraIncomes || [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega os dados do localStorage/Supabase
    loadData();
    
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
        // Define o mês inicial utilizando a função global do calendário ou o primeiro da lista
        let initialMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : monthsList[0];
        globalMonth.value = initialMonth;
        
        // Garante que o texto do botão do calendário reflete o mês inicial correto
        let monthTextEl = document.getElementById('globalMonthText');
        if (monthTextEl) {
            monthTextEl.innerText = initialMonth;
        }
    }
    
    // 3. Renderiza o aplicativo completo
    renderApp();
    if (typeof loadSalaryConfig === 'function') loadSalaryConfig();
    
    // Força a renderização inicial dos ícones
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ================= NAVEGAÇÃO ENTRE ABAS =================
function switchTab(tabName) {
    // Esconde todas as abas
    let tabs = ['tabDashboard', 'tabCards', 'tabHouse', 'tabSalary'];
    tabs.forEach(t => {
        let el = document.getElementById(t);
        if (el) el.classList.add('hidden');
    });

    // Exibe a aba selecionada
    let targetTab = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (targetTab) targetTab.classList.remove('hidden');

    // Ajusta o seletor global de categorias do topo dependendo da aba ativa
    let filterCatSelect = document.getElementById('filterCategory');
    if (filterCatSelect) {
        if (tabName.toLowerCase() === 'salary' || tabName === 'Salary') {
            // Opções exclusivas para a aba de Salário
            filterCatSelect.innerHTML = `
                <option value="">Todas as Entradas</option>
                <option value="Salário">Salário</option>
                <option value="Renda Extra">Renda Extra</option>
            `;
        } else {
            // Opções normais de despesas para o Dashboard, Cartões e Casa
            filterCatSelect.innerHTML = `
                <option value="">Todas</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Mercado">Mercado</option>
                <option value="Contas de Casa">Contas de Casa</option>
                <option value="Assinaturas">Assinaturas</option>
            `;
        }
    }

    // Executa inicializações específicas da aba se existirem
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

    // Garante que os cartões são atualizados com a nova lógica de limite disponível
    if (typeof renderCards === 'function') {
        renderCards();
    }

    // Se estiver na aba de salário, renderiza as entradas
    if (typeof renderIncomesList === 'function') {
        renderIncomesList();
    }
};

// Garante o carregamento dos ícones do Lucide assim que a janela estiver totalmente carregada
window.addEventListener('load', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Checagens de segurança adicionais para injetar os ícones sem falhas
setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 100);
setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 500);
setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 1000);
