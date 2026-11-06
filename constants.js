// ============================================================================
// CONSTANTES E GERAÇÃO DE MESES - constants.js
// ============================================================================

// --- GERADOR DINÂMICO DE HORIZONTE AMPLIADO (5 ANOS / 60 MESES) ---
function generateMonthsList() {
    let list = [];
    let date = new Date(2026, 10, 1); // Garante o ponto de partida base em Novembro/2026
    
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Gera 60 meses (5 anos) para suportar com folga compras parceladas longas (12x, 24x, etc.)
    for (let i = 0; i < 60; i++) {
        let m = date.getMonth();
        let y = date.getFullYear();
        list.push(`${monthNames[m]}/${y}`);
        date.setMonth(date.getMonth() + 1);
    }
    return list;
}

const monthsList = generateMonthsList();

/**
 * Função para popular automaticamente todos os selects de meses da aplicação
 */
function populateMonthDropdowns() {
    const selectIds = ['globalMonth', 'expMonth', 'salaryMonth'];
    
    selectIds.forEach(id => {
        let select = document.getElementById(id);
        if (!select) return;
        
        let currentValue = select.value || (typeof getSelectedMonth === 'function' ? getSelectedMonth() : 'Novembro/2026');
        select.innerHTML = '';
        
        monthsList.forEach(m => {
            let opt = document.createElement('option');
            opt.value = m;
            opt.innerText = m.replace('/', ' / ');
            select.appendChild(opt);
        });

        if (currentValue && monthsList.includes(currentValue)) {
            select.value = currentValue;
        }
    });
}

// Popula os selects assim que o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    populateMonthDropdowns();
});

// ================= EXPOSIÇÃO GLOBAL =================
window.monthsList = monthsList;
window.generateMonthsList = generateMonthsList;
window.populateMonthDropdowns = populateMonthDropdowns;
