// ============================================================================
// MÓDULO DE INICIALIZAÇÃO DA APLICAÇÃO, NAVEGAÇÃO, PAGINAÇÃO & RENDAS - app.js
// ============================================================================

window.expenses = window.expenses || [];
window.cards = window.cards || [];
window.salaryConfigs = window.salaryConfigs || [];
window.extraIncomes = window.extraIncomes || [];

// Variáveis globais para controlo da paginação (40 itens por página)
window.currentPage = 1;
window.itemsPerPage = 40;

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof loadData === 'function') {
        await loadData();
    }
    
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
    
    if (typeof renderApp === 'function') {
        renderApp();
    }
    if (typeof loadSalaryConfig === 'function') {
        loadSalaryConfig();
    }
    
    setTimeout(() => {
        if (typeof renderApp === 'function') renderApp();
    }, 50);

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ================= SISTEMA DE CATEGORIAS & PAGINAÇÃO =================

/**
 * Retorna a classe CSS correspondente à categoria para colorir os badges no dashboard
 */
function getCategoryClass(category) {
    if (!category) return 'cat-outro';
    let cat = category.toLowerCase();
    if (cat.includes('cartão') || cat.includes('credito')) return 'cat-cartao';
    if (cat.includes('mercado')) return 'cat-mercado';
    if (cat.includes('casa') || cat.includes('água') || cat.includes('luz')) return 'cat-casa';
    if (cat.includes('assinatura')) return 'cat-assinaturas';
    if (cat.includes('salário')) return 'cat-salario';
    if (cat.includes('extra')) return 'cat-extra';
    return 'cat-outro';
}

/**
 * Retorna os itens fatiados para a página atual (limite de 40 itens)
 */
function paginateItems(itemsArray) {
    let startIndex = (window.currentPage - 1) * window.itemsPerPage;
    let endIndex = startIndex + window.itemsPerPage;
    return itemsArray.slice(startIndex, endIndex);
}

/**
 * Renderiza os controlos de paginação (Anterior / Próxima) num contentor
 */
function renderPaginationControls(totalItems, containerId) {
    let totalPages = Math.ceil(totalItems / window.itemsPerPage);
    let container = document.getElementById(containerId);
    
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="flex justify-between items-center bg-[#0b132b] border border-slate-800 px-4 py-3 rounded-xl shadow-lg mt-4 w-full box-border">
            <button onclick="changePage(-1)" ${window.currentPage === 1 ? 'disabled class="opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700"' : 'class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"'} class="px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition">
                <i data-lucide="chevron-left" class="w-4 h-4"></i> Anterior
            </button>
            <span class="text-xs font-medium text-slate-400">
                Página <strong class="text-white">${window.currentPage}</strong> de <strong class="text-white">${totalPages}</strong> <span class="text-slate-500">(${totalItems} itens)</span>
            </span>
            <button onclick="changePage(1)" ${window.currentPage >= totalPages ? 'disabled class="opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700"' : 'class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"'} class="px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition">
                Próxima <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
        </div>
    `;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function changePage(direction) {
    window.currentPage += direction;
    if (typeof renderApp === 'function') renderApp();
}

// ================= LÓGICA DE PROPAGAÇÃO DE RENDAS / SALÁRIOS =================
/**
 * Retorna as rendas e salários ativos para o mês selecionado.
 * O valor mantém-se do mês lançado em diante até ser marcado como usado.
 */
function getActiveIncomesForMonth(targetMonth) {
    if (typeof extraIncomes === 'undefined' || !Array.isArray(extraIncomes)) return [];

    const monthOrder = {
        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
        'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
        'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
    };

    function parseMonthYear(mStr) {
        if (!mStr) return { monthNum: 1, year: 2026 };
        let parts = mStr.split('/');
        let mName = (parts[0] || '').trim();
        let year = parseInt(parts[1]) || 2026;
        return { monthNum: monthOrder[mName] || 1, year: year };
    }

    let target = parseMonthYear(targetMonth);
    let targetIndex = target.year * 12 + target.monthNum;

    let activeIncomes = [];

    extraIncomes.forEach(inc => {
        let incMonthStr = inc.month || targetMonth;
        let incDateParsed = parseMonthYear(incMonthStr);
        let incIndex = incDateParsed.year * 12 + incDateParsed.monthNum;

        // Só considera da data de lançamento em diante
        if (targetIndex >= incIndex) {
            let usedMonths = inc.usedMonths || {};
            let isUsedBeforeOrCurrent = false;

            // Verifica se foi marcado como usado em algum mês anterior ou igual ao alvo
            for (let mKey in usedMonths) {
                if (usedMonths[mKey] === true) {
                    let usedParsed = parseMonthYear(mKey);
                    let usedIndex = usedParsed.year * 12 + usedParsed.monthNum;
                    if (usedIndex <= targetIndex) {
                        isUsedBeforeOrCurrent = true;
                        break;
                    }
                }
            }

            // Se não foi usado ainda, propaga para o mês atual!
            if (!isUsedBeforeOrCurrent) {
                activeIncomes.push({
                    ...inc,
                    effectiveMonth: targetMonth
                });
            }
        }
    });

    return activeIncomes;
}

/**
 * Alterna o estado de uso de uma renda/salário num determinado mês
 */
function toggleIncomeUsed(incomeId, currentMonth) {
    if (typeof extraIncomes === 'undefined') return;
    let inc = extraIncomes.find(e => Number(e.id || e.parentId) === Number(incomeId));
    if (inc) {
        if (!inc.usedMonths) inc.usedMonths = {};
        inc.usedMonths[currentMonth] = !inc.usedMonths[currentMonth];
        if (typeof saveData === 'function') saveData();
        if (typeof renderApp === 'function') renderApp();
        if (typeof showToast === 'function') {
            showToast(inc.usedMonths[currentMonth] ? `Entrada marcada como usada em ${currentMonth}!` : `Entrada reativada.`, "success");
        }
    }
}

// ================= NAVEGAÇÃO ENTRE ABAS =================
function switchTab(tabName) {
    window.currentPage = 1;

    let tabs = ['tabDashboard', 'tabCards', 'tabHouse', 'tabSalary'];
    tabs.forEach(t => {
        let el = document.getElementById(t);
        if (el) el.classList.add('hidden');
    });

    let targetTab = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (targetTab) targetTab.classList.remove('hidden');

    const navButtons = document.querySelectorAll('header button, .nav-tabs button, .tabs-container button');
    navButtons.forEach(btn => btn.classList.remove('active'));

    navButtons.forEach(btn => {
        let onclickAttr = btn.getAttribute('onclick') || '';
        let btnText = btn.innerText || '';
        
        let match = false;
        if (tabName.toLowerCase() === 'dashboard' && (onclickAttr.includes('Dashboard') || btnText.includes('Painel'))) match = true;
        if (tabName.toLowerCase() === 'cards' && (onclickAttr.includes('Cards') || btnText.includes('Cartões'))) match = true;
        if (tabName.toLowerCase() === 'house' && (onclickAttr.includes('House') || btnText.includes('Contas'))) match = true;
        if (tabName.toLowerCase() === 'salary' && (onclickAttr.includes('Salary') || btnText.includes('Salário'))) match = true;

        if (match) {
            btn.classList.add('active');
        }
    });

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

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
                <option value="Outros">Outros</option>
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
