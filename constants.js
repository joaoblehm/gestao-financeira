// --- GERADOR DINÂMICO DE 1 ANO DE MESES A PARTIR DO CALENDÁRIO ATUAL ---
function generateMonthsList() {
    let list = [];
    let date = new Date(); // Pega a data atual do sistema (Novembro/2026)
    
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Gera 12 meses a partir do mês atual
    for (let i = 0; i < 12; i++) {
        let m = date.getMonth();
        let y = date.getFullYear();
        list.push(`${monthNames[m]}/${y}`);
        date.setMonth(date.getMonth() + 1);
    }
    return list;
}

const monthsList = generateMonthsList();

// Função para popular automaticamente todos os selects de meses da aplicação
function populateMonthDropdowns() {
    const selectIds = ['globalMonth', 'expMonth', 'salaryMonth'];
    
    selectIds.forEach(id => {
        let select = document.getElementById(id);
        if (!select) return;
        
        let currentValue = select.value;
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