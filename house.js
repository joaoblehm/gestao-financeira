// ============================================================================
// MÓDULO DE CONTAS DA CASA & DESPESAS - house.js (Profissional e Inteligente)
// ============================================================================

/**
 * Renderiza a aba de Contas da Casa e Outros:
 * - Aplica regras específicas por categoria (Conta Fixa, Empréstimo, Assinaturas e Outros).
 * - Exibe a data real do lançamento e o status inteligente de controle.
 */
function renderHouseView() {
    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');
    let projectedItems = getProjectedItems();
    
    // Filtra itens pertinentes a esta aba (Contas de Casa e Outros, além de subcategorias tratadas)
    let houseItems = projectedItems.filter(i => {
        let cat = (i.category || '').toLowerCase();
        return cat.includes('conta') || cat.includes('casa') || cat.includes('emprestimo') || cat.includes('assinatura') || cat.includes('outro');
    });

    const tbody = document.getElementById('houseTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (houseItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500">Nenhuma conta ou despesa registrada para ${selectedMonth}.</td></tr>`;
        return;
    }

    houseItems.forEach(item => {
        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        let catClass = (typeof getCategoryClass === 'function') ? getCategoryClass(item.category) : 'cat-outro';
        let itemDate = item.date || item.rawDate || 'Data Base';
        let categoryLower = (item.category || '').toLowerCase();

        // Identificação e regras visuais por tipo de categoria
        let badgeExtraHtml = '';
        let statusBadgeHtml = '';

        if (categoryLower.includes('fixa') || categoryLower.includes('contas de casa')) {
            // Conta Fixa: permanece pendente/visível até ser marcada como paga
            statusBadgeHtml = `
                <button onclick="togglePaidStatus(${item.parentId}, '${item.month}')" class="px-2.5 py-1 rounded-full text-xs font-medium transition ${item.paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                    ${item.paid ? 'Pago (Fixa)' : 'Pendente (Fixa)'}
                </button>
            `;
        } else if (categoryLower.includes('emprestimo')) {
            // Empréstimo: Guiado pela data de vencimento real
            badgeExtraHtml = `<div class="text-[10px] text-rose-400 font-semibold mt-0.5">Vencimento: ${itemDate}</div>`;
            statusBadgeHtml = `
                <button onclick="togglePaidStatus(${item.parentId}, '${item.month}')" class="px-2.5 py-1 rounded-full text-xs font-medium transition ${item.paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
                    ${item.paid ? 'Quitado' : 'Em Aberto'}
                </button>
            `;
        } else if (categoryLower.includes('assinatura')) {
            // Assinaturas: Controle de Ativa / Inativa
            let isAtivo = !item.inactive; // Se não estiver marcado como inativo, está ativo gerando custo
            badgeExtraHtml = `<div class="text-[10px] ${isAtivo ? 'text-indigo-400' : 'text-slate-500'} font-semibold mt-0.5">${isAtivo ? 'Assinatura Ativa' : 'Assinatura Inativa'}</div>`;
            statusBadgeHtml = `
                <button onclick="togglePaidStatus(${item.parentId}, '${item.month}')" class="px-2.5 py-1 rounded-full text-xs font-medium transition ${item.paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}">
                    ${item.paid ? 'Pago' : 'Cobrança do Mês'}
                </button>
            `;
        } else {
            // Outros / Padrão
            statusBadgeHtml = `
                <button onclick="togglePaidStatus(${item.parentId}, '${item.month}')" class="px-2.5 py-1 rounded-full text-xs font-medium transition ${item.paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                    ${item.paid ? 'Pago' : 'Pendente'}
                </button>
            `;
        }

        tr.innerHTML = `
            <td class="py-3 px-4 text-xs text-slate-400">${item.month}</td>
            <td class="py-3 px-4 text-xs font-medium text-indigo-300">
                ${itemDate}
                ${badgeExtraHtml}
            </td>
            <td class="py-3 px-4 font-medium text-white">${item.desc}</td>
            <td class="py-3 px-4"><span class="badge-categoria ${catClass}">${item.category}</span></td>
            <td class="py-3 px-4 text-right font-semibold text-white">R$ ${Number(item.amount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="py-3 px-4 text-center">
                ${statusBadgeHtml}
            </td>
            <td class="py-3 px-4 text-center flex items-center justify-center gap-1">
                <button onclick="editExpense(${item.parentId})" class="p-1 hover:text-indigo-400 text-slate-400 transition" title="Editar"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                <button onclick="deleteExpense(${item.parentId})" class="p-1 hover:text-rose-400 text-slate-400 transition" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ================= EXPOSIÇÃO GLOBAL =================
window.renderHouseView = renderHouseView;
