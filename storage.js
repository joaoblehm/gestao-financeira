// ================= PERSISTÊNCIA NA NUVEM VIA SUPABASE & DADOS GLOBAIS =================

const SUPABASE_URL = 'https://tmffettfmigsgdonjuyz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dKkZ5FmlvJXrMqhDG-YTvg_rXBWdgsu';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis globais do sistema com dados padrão iniciais (caso a nuvem venha vazia)
window.cards = [
    { id: 1, name: 'Mercado Pago (João)', closingDay: 25, dueDay: 5, limit: 5000 },
    { id: 2, name: 'Nubank (João)', closingDay: 20, dueDay: 28, limit: 3000 },
    { id: 3, name: 'Nubank (Brenda)', closingDay: 20, dueDay: 28, limit: 3000 },
    { id: 4, name: 'Neon (Brenda)', closingDay: 10, dueDay: 17, limit: 2000 },
    { id: 5, name: 'Bradesco Amazon (João)', closingDay: 8, dueDay: 15, limit: 4000 }
];

// Configurado para iniciar vazio: só soma e exibe o que for efetivamente lançado
window.salaryConfigs = [];

window.extraIncomes = [];

window.expenses = [
    { id: 1, parentId: 101, startMonth: 'Dezembro/2026', desc: 'Netshoes', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 73.05, totalInst: 8, total: 73.05 * 8, paidMonths: {} },
    { id: 2, parentId: 102, startMonth: 'Novembro/2026', desc: 'Shopee', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 64.38, totalInst: 4, total: 64.38 * 4, paidMonths: {} },
    { id: 3, parentId: 103, startMonth: 'Novembro/2026', desc: 'Levi Strauss do Brasil', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 61.90, totalInst: 10, total: 61.90 * 10, paidMonths: {} },
    { id: 4, parentId: 104, startMonth: 'Novembro/2026', desc: 'Amazon', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 79.09, totalInst: 12, total: 79.09 * 12, paidMonths: {} },
    { id: 5, parentId: 105, startMonth: 'Outubro/2026', desc: 'Lojas Riachuelo', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 53.68, totalInst: 10, total: 53.68 * 10, paidMonths: {} },
    { id: 6, parentId: 106, startMonth: 'Setembro/2026', desc: 'Netshoes (Anterior)', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 117.20, totalInst: 10, total: 117.20 * 10, paidMonths: {} },
    { id: 7, parentId: 107, startMonth: 'Setembro/2026', desc: 'Panvel', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 37.98, totalInst: 5, total: 37.98 * 5, paidMonths: {} },
    { id: 8, parentId: 108, startMonth: 'Setembro/2026', desc: 'MLP * Época Cosméticos', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 126.32, totalInst: 10, total: 126.32 * 10, paidMonths: {} },
    { id: 9, parentId: 109, startMonth: 'Setembro/2026', desc: 'Airbnb', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 75.44, totalInst: 6, total: 75.44 * 6, paidMonths: {} },
    { id: 10, parentId: 110, startMonth: 'Setembro/2026', desc: 'Centauro', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 77.34, totalInst: 6, total: 77.34 * 6, paidMonths: {} },
    { id: 11, parentId: 111, startMonth: 'Setembro/2026', desc: 'Mercado Livre', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 69.38, totalInst: 18, total: 69.38 * 18, paidMonths: {} },
    { id: 12, parentId: 112, startMonth: 'Julho/2026', desc: 'PG * CONTAJA CONTA', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 140.33, totalInst: 12, total: 140.33 * 12, paidMonths: {} },
    { id: 13, parentId: 113, startMonth: 'Junho/2026', desc: 'Paquetá', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 149.99, totalInst: 10, total: 149.99 * 10, paidMonths: {} },
    { id: 14, parentId: 114, startMonth: 'Junho/2026', desc: 'Amazon (Antiga)', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 194.99, totalInst: 10, total: 194.99 * 10, paidMonths: {} },
    { id: 15, parentId: 115, startMonth: 'Junho/2026', desc: 'Mercado Livre (MercadoPago)', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 42.24, totalInst: 9, total: 42.24 * 9, paidMonths: {} },
    { id: 16, parentId: 116, startMonth: 'Junho/2026', desc: 'Netshoes (Antiga 2)', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 77.73, totalInst: 7, total: 77.73 * 7, paidMonths: {} },
    { id: 17, parentId: 117, startMonth: 'Maio/2026', desc: 'Shopee (Antiga)', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 51.39, totalInst: 9, total: 51.39 * 9, paidMonths: {} },
    { id: 18, parentId: 118, startMonth: 'Maio/2026', desc: 'Magazine Luiza', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 284.89, totalInst: 10, total: 284.89 * 10, paidMonths: {} },
    { id: 19, parentId: 119, startMonth: 'Julho/2026', desc: 'Centauro (2)', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 78.74, totalInst: 6, total: 78.74 * 6, paidMonths: {} },
    { id: 20, parentId: 120, startMonth: 'Dezembro/2026', desc: 'Wellhub', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 64.20, totalInst: 1, total: 64.20, paidMonths: {} },
    { id: 21, parentId: 121, startMonth: 'Dezembro/2026', desc: 'Wellhub (2)', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 64.20, totalInst: 1, total: 64.20, paidMonths: {} },
    { id: 22, parentId: 122, startMonth: 'Dezembro/2026', desc: 'Cestto Gravataí', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 110.60, totalInst: 1, total: 110.60, paidMonths: {} },
    { id: 23, parentId: 123, startMonth: 'Dezembro/2026', desc: 'Uber', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 8.96, totalInst: 1, total: 8.96, paidMonths: {} },
    { id: 24, parentId: 124, startMonth: 'Dezembro/2026', desc: '99 Ride', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 7.80, totalInst: 1, total: 7.80, paidMonths: {} },
    { id: 25, parentId: 125, startMonth: 'Dezembro/2026', desc: 'Margarete Solange de J', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 17.63, totalInst: 1, total: 17.63, paidMonths: {} },
    { id: 26, parentId: 126, startMonth: 'Dezembro/2026', desc: 'Uber (2)', category: 'Cartão de Crédito', card: 'Mercado Pago (João)', amount: 6.94, totalInst: 1, total: 6.94, paidMonths: {} }
];

/**
 * Carrega os dados diretamente do banco de dados seguro na nuvem (Supabase) ao iniciar.
 */
async function loadData() {
    try {
        let { data, error } = await supabaseClient
            .from('app_data')
            .select('*')
            .eq('id', 'user_session_v1')
            .single();

        if (data && data.payload) {
            window.cards = data.payload.cards || window.cards;
            window.salaryConfigs = data.payload.salaryConfigs || window.salaryConfigs;
            window.extraIncomes = data.payload.extraIncomes || window.extraIncomes;
            window.expenses = data.payload.expenses || window.expenses;
            console.log("Dados carregados com sucesso da nuvem!");
        } else {
            await saveDataToCloudDirect();
        }
    } catch (err) {
        console.error("Erro ao carregar dados da nuvem:", err);
    }

    if (typeof renderApp === 'function') renderApp();
    if (typeof loadSalaryConfig === 'function') loadSalaryConfig();
}

/**
 * Salva todos os estados atuais diretamente na tabela `app_data` do Supabase.
 */
async function saveData() {
    let payloadData = {
        cards: window.cards,
        salaryConfigs: window.salaryConfigs,
        extraIncomes: window.extraIncomes,
        expenses: window.expenses
    };

    try {
        let { error } = await supabaseClient
            .from('app_data')
            .upsert({ id: 'user_session_v1', payload: payloadData });

        if (error) {
            console.error("Erro ao salvar na nuvem:", error);
            if (typeof showToast === 'function') showToast("Erro ao sincronizar com a nuvem.", "error");
        } else {
            if (typeof showToast === 'function') showToast("Dados salvos na nuvem com segurança!", "success");
        }
    } catch (err) {
        console.error("Erro de conexão com o Supabase:", err);
    }

    if (typeof renderApp === 'function') {
        renderApp();
    }
}

async function saveDataToCloudDirect() {
    let payloadData = {
        cards: window.cards,
        salaryConfigs: window.salaryConfigs,
        extraIncomes: window.extraIncomes,
        expenses: window.expenses
    };
    await supabaseClient.from('app_data').upsert({ id: 'user_session_v1', payload: payloadData });
}

/**
 * Exporta um arquivo JSON contendo backup de todos os dados do sistema.
 */
function exportBackup() {
    let data = {
        cards: window.cards,
        salaryConfigs: window.salaryConfigs,
        extraIncomes: window.extraIncomes,
        expenses: window.expenses,
        exportDate: new Date().toISOString()
    };
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_gestao_financeira_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

/**
 * Importa dados de um arquivo JSON de backup pré-existente e envia para a nuvem.
 */
function importBackup(event) {
    let file = event.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function (e) {
        try {
            let json = JSON.parse(e.target.result);
            if (json.cards && json.expenses) {
                if (confirm("Deseja substituir todos os dados atuais pelo backup importado?")) {
                    window.cards = json.cards;
                    if (json.salaryConfigs) window.salaryConfigs = json.salaryConfigs;
                    if (json.extraIncomes) window.extraIncomes = json.extraIncomes;
                    window.expenses = json.expenses;
                    saveData();
                    if (typeof showToast === 'function') showToast("Backup importado com sucesso!", "success");
                    else alert("Backup importado com sucesso!");
                }
            } else {
                alert("Arquivo de backup inválido.");
            }
        } catch (err) {
            alert("Erro ao ler o arquivo JSON: " + err.message);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

/**
 * Confirma a exclusão de todos os registros de despesas do sistema.
 */
function confirmClearAllData() {
    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Tem certeza absoluta que deseja apagar TODOS os lançamentos e parcelas de todos os meses? Esta ação não pode ser desfeita.', () => {
            clearAllData();
        });
    } else {
        if (confirm('Tem certeza absoluta que deseja apagar TODOS os lançamentos de todos os meses?')) {
            clearAllData();
        }
    }
}

/**
 * Limpa todos os lançamentos do sistema e sincroniza com a nuvem.
 */
function clearAllData() {
    window.expenses = [];
    saveData();
    if (typeof showToast === 'function') {
        showToast("Todos os registros foram apagados com sucesso!", "success");
    } else {
        alert("Todos os registros foram apagados com sucesso!");
    }
}

// Inicialização automática ao carregar o documento
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
