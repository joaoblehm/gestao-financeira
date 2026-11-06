// ============================================================================
// MÓDULO DE PERSISTÊNCIA, SUPABASE E BACKUP - storage.js
// ============================================================================

// Configuração do Supabase (utiliza as variáveis globais do cliente)
const SUPABASE_URL = 'https://sua-url-aqui.supabase.co'; // Substitua pela sua URL se necessário
const SUPABASE_ANON_KEY = 'sua-chave-aqui'; // Substitua pela sua chave se necessário

let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.warn("Erro ao inicializar Supabase:", e);
    }
}

/**
 * Carrega todos os dados da aplicação (LocalStorage ou Supabase).
 */
function loadData() {
    try {
        // Tenta carregar do localStorage como base primária/rápida
        let localCards = localStorage.getItem('srin_cards');
        let localExpenses = localStorage.getItem('srin_expenses');
        let localSalary = localStorage.getItem('srin_salary');
        let localIncomes = localStorage.getItem('srin_incomes');

        if (localCards) window.cards = JSON.parse(localCards);
        if (localExpenses) window.expenses = JSON.parse(localExpenses);
        if (localSalary) window.salaryConfigs = JSON.parse(localSalary);
        if (localIncomes) window.extraIncomes = JSON.parse(localIncomes);

    } catch (err) {
        console.error("Erro ao carregar dados locais:", err);
    }
}

/**
 * Salva todos os dados da aplicação de forma persistente.
 */
function saveData() {
    try {
        if (typeof cards !== 'undefined') {
            localStorage.setItem('srin_cards', JSON.stringify(cards));
        }
        if (typeof expenses !== 'undefined') {
            localStorage.setItem('srin_expenses', JSON.stringify(expenses));
        }
        if (typeof salaryConfigs !== 'undefined') {
            localStorage.setItem('srin_salary', JSON.stringify(salaryConfigs));
        }
        if (typeof extraIncomes !== 'undefined') {
            localStorage.setItem('srin_incomes', JSON.stringify(extraIncomes));
        }

        // Se houver integração ativa com Supabase, sincroniza em background
        syncToSupabase();

    } catch (err) {
        console.error("Erro ao salvar dados:", err);
    }
}

/**
 * Sincroniza os dados com o Supabase (se configurado).
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

        // Exemplo de salvamento na tabela padrão do sistema
        await supabaseClient
            .from('app_data')
            .upsert({ id: 'user_session_v1', data: payload });
    } catch (err) {
        console.warn("Sincronização com Supabase em segundo plano falhou:", err);
    }
}

/**
 * Exporta todos os dados da aplicação em formato JSON para backup.
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

        if (typeof showToast === 'function') {
            showToast("Backup exportado com sucesso!", "success");
        }
    } catch (err) {
        console.error("Erro ao exportar backup:", err);
        if (typeof showToast === 'function') {
            showToast("Erro ao exportar backup.", "error");
        }
    }
}

/**
 * Importa um ficheiro de backup JSON, preservando os cartões de crédito configurados
 * e garantindo que os lançamentos importados recalculam as parcelas e datas de fechamento corretamente.
 * @param {Event} event - Evento de mudança do input file.
 */
function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const parsedData = JSON.parse(content);

            if (!parsedData || typeof parsedData !== 'object') {
                throw new Error("Formato de ficheiro inválido.");
            }

            // 1. Restaura os Lançamentos / Despesas garantindo normalização de data e mês
            if (Array.isArray(parsedData.expenses)) {
                window.expenses = parsedData.expenses.map(exp => {
                    // Garante que se vier sem data mas com startMonth, geramos uma data padrão compatível
                    if (!exp.date && exp.startMonth && typeof monthNameToDateInput === 'function') {
                        exp.date = monthNameToDateInput(exp.startMonth);
                    }
                    return exp;
                });
            }

            // 2. Restaura as Configurações de Salário e Rendas Extras
            if (Array.isArray(parsedData.salaryConfigs)) {
                window.salaryConfigs = parsedData.salaryConfigs;
            }
            if (Array.isArray(parsedData.extraIncomes)) {
                window.extraIncomes = parsedData.extraIncomes;
            }

            // 3. Restaura os Cartões preservando os limites e dias de fechamento originais
            if (Array.isArray(parsedData.cards) && parsedData.cards.length > 0) {
                window.cards = parsedData.cards;
            }

            // Salva de forma persistente (LocalStorage + Supabase)
            saveData();

            // Re-renderiza a aplicação inteira para atualizar a interface com os novos dados
            if (typeof renderApp === 'function') {
                renderApp();
            }
            if (typeof loadSalaryConfig === 'function') {
                loadSalaryConfig();
            }

            // Limpa o input file para permitir reimportar o mesmo ficheiro se necessário
            event.target.value = '';

            if (typeof showToast === 'function') {
                showToast("Backup importado com sucesso! Dados recalculados.", "success");
            } else {
                alert("Backup importado com sucesso!");
            }

        } catch (err) {
            console.error("Erro ao processar ficheiro de backup:", err);
            if (typeof showToast === 'function') {
                showToast("Erro ao importar backup: Ficheiro corrompido ou inválido.", "error");
            } else {
                alert("Erro ao importar backup: Ficheiro corrompido ou inválido.");
            }
        }
    };

    reader.readAsText(file);
}

/**
 * Limpa todos os dados da aplicação após confirmação.
 */
function confirmClearAllData() {
    let doClear = () => {
        window.expenses = [];
        window.cards = [];
        window.salaryConfigs = [];
        window.extraIncomes = [];
        saveData();
        if (typeof renderApp === 'function') renderApp();
        if (typeof showToast === 'function') {
            showToast("Todos os registros foram apagados.", "success");
        }
    };

    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Tem certeza absoluta que deseja apagar TODOS os registros do sistema?', doClear);
    } else {
        if (confirm('Tem certeza absoluta que deseja apagar TODOS os registros do sistema?')) {
            doClear();
        }
    }
}

// ================= EXPOSIÇÃO GLOBAL =================
window.loadData = loadData;
window.saveData = saveData;
window.exportBackup = exportBackup;
window.importBackup = importBackup;
window.confirmClearAllData = confirmClearAllData;
