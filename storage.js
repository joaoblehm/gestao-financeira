// ============================================================================
// MÓDULO DE PERSISTÊNCIA EM NUVEM (SUPABASE) - storage.js
// ============================================================================

// 🔑 CREDENCIAIS DO SUPABASE (Certifique-se de preencher com as suas chaves reais do projeto)
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co'; 
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_PUBLICA_AQUI';

let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.warn("Erro ao inicializar Supabase:", e);
    }
}

/**
 * Carrega todos os dados diretamente do Supabase (nuvem). 
 * Se falhar ou estiver offline, usa o cache local como segurança.
 */
async function loadData() {
    try {
        if (supabaseClient) {
            let { data, error } = await supabaseClient
                .from('app_data')
                .select('*')
                .eq('id', 'user_session_v1')
                .single();

            if (data && data.payload) {
                window.cards = data.payload.cards || [];
                window.expenses = data.payload.expenses || [];
                window.salaryConfigs = data.payload.salaryConfigs || [];
                window.extraIncomes = data.payload.extraIncomes || [];
                
                // Salva cópia local para cache instantâneo
                localStorage.setItem('srin_cards', JSON.stringify(window.cards));
                localStorage.setItem('srin_expenses', JSON.stringify(window.expenses));
                localStorage.setItem('srin_salary', JSON.stringify(window.salaryConfigs));
                localStorage.setItem('srin_incomes', JSON.stringify(window.extraIncomes));
                return;
            }
        }
    } catch (err) {
        console.warn("Aviso: Não foi possível carregar do Supabase, a usar dados locais.", err);
    }

    // Fallback local caso haja falha de rede
    try {
        let localCards = localStorage.getItem('srin_cards');
        let localExpenses = localStorage.getItem('srin_expenses');
        let localSalary = localStorage.getItem('srin_salary');
        let localIncomes = localStorage.getItem('srin_incomes');

        if (localCards) window.cards = JSON.parse(localCards);
        if (localExpenses) window.expenses = JSON.parse(localExpenses);
        if (localSalary) window.salaryConfigs = JSON.parse(localSalary);
        if (localIncomes) window.extraIncomes = JSON.parse(localIncomes);
    } catch (e) {
        console.error("Erro ao carregar do localStorage:", e);
    }
}

/**
 * Salva localmente e sincroniza automaticamente com a nuvem (Supabase).
 */
function saveData() {
    try {
        if (typeof cards !== 'undefined') localStorage.setItem('srin_cards', JSON.stringify(cards));
        if (typeof expenses !== 'undefined') localStorage.setItem('srin_expenses', JSON.stringify(expenses));
        if (typeof salaryConfigs !== 'undefined') localStorage.setItem('srin_salary', JSON.stringify(salaryConfigs));
        if (typeof extraIncomes !== 'undefined') localStorage.setItem('srin_incomes', JSON.stringify(extraIncomes));

        // Envia para a nuvem em background
        syncToSupabase();
    } catch (err) {
        console.error("Erro ao salvar dados:", err);
    }
}

/**
 * Envia o payload unificado para a tabela 'app_data' no Supabase.
 */
async function syncToSupabase() {
    if (!supabaseClient) return;
    try {
        const payload = {
            cards: window.cards || [],
            expenses: window.expenses || [],
            salaryConfigs: window.salaryConfigs || [],
            extraIncomes: window.extraIncomes || [],
            updated_at: new Date().toISOString()
        };

        let { error } = await supabaseClient
            .from('app_data')
            .upsert({ id: 'user_session_v1', payload: payload });

        if (error) {
            console.error("Erro no upsert do Supabase:", error);
        }
    } catch (err) {
        console.warn("Erro na sincronização com o Supabase:", err);
    }
}

/**
 * Exporta backup em JSON (opcional, caso queira guardar uma cópia física).
 */
function exportBackup() {
    try {
        const backupData = {
            version: "2.5",
            exportDate: new Date().toISOString(),
            cards: window.cards || [],
            expenses: window.expenses || [],
            salaryConfigs: window.salaryConfigs || [],
            extraIncomes: window.extraIncomes || []
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `gestao_financeira_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        if (typeof showToast === 'function') showToast("Backup exportado com sucesso!", "success");
    } catch (err) {
        console.error("Erro ao exportar backup:", err);
    }
}

/**
 * Importa um ficheiro de backup e envia de imediato para a nuvem.
 */
function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsedData = JSON.parse(e.target.result);
            if (!parsedData || typeof parsedData !== 'object') throw new Error("Ficheiro inválido.");

            if (Array.isArray(parsedData.expenses)) {
                window.expenses = parsedData.expenses;
            }
            if (Array.isArray(parsedData.salaryConfigs)) window.salaryConfigs = parsedData.salaryConfigs;
            if (Array.isArray(parsedData.extraIncomes)) window.extraIncomes = parsedData.extraIncomes;
            if (Array.isArray(parsedData.cards) && parsedData.cards.length > 0) window.cards = parsedData.cards;

            saveData(); // Salva localmente e envia para o Supabase

            if (typeof renderApp === 'function') renderApp();
            if (typeof loadSalaryConfig === 'function') loadSalaryConfig();
            
            event.target.value = '';
            if (typeof showToast === 'function') showToast("Dados importados e sincronizados com a nuvem!", "success");
        } catch (err) {
            console.error("Erro ao importar:", err);
            if (typeof showToast === 'function') showToast("Erro ao importar backup.", "error");
        }
    };
    reader.readAsText(file);
}

function confirmClearAllData() {
    let doClear = () => {
        window.expenses = [];
        window.cards = [];
        window.salaryConfigs = [];
        window.extraIncomes = [];
        saveData(); // Atualiza na nuvem limpando os dados
        if (typeof renderApp === 'function') renderApp();
        if (typeof showToast === 'function') showToast("Todos os registros foram apagados.", "success");
    };

    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Deseja realmente apagar TODOS os registros da nuvem?', doClear);
    } else {
        if (confirm('Deseja apagar TODOS os registros da nuvem?')) doClear();
    }
}

// ================= EXPOSIÇÃO GLOBAL =================
window.loadData = loadData;
window.saveData = saveData;
window.exportBackup = exportBackup;
window.importBackup = importBackup;
window.confirmClearAllData = confirmClearAllData;
