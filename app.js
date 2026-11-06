window.expenses = window.expenses || [];
window.cards = window.cards || [];
window.salaryConfigs = window.salaryConfigs || [];
window.extraIncomes = window.extraIncomes || [];

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

function switchTab(tabName) {
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
