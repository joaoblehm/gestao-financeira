// ============================================================================
// MÓDULO DE CONTAS DA CASA - house.js
// ============================================================================

/**
 * Renderiza a aba de Contas da Casa:
 * - Filtra e exibe os lançamentos pertencentes às categorias "Contas de Casa" e "Outros" para o mês ativo.
 * - Exibe a data real do lançamento em vez de "Data Base".
 */
function renderHouseView() {
    const selectedMonth = (typeof getSelectedMonth === 'function') ? getSelectedMonth() : (document.getElementById('globalMonth')?.value || 'Novembro/2026');
    let projectedItems = getProjectedItems();
    
    let houseItems = projectedItems.filter(i => i.month === selectedMonth && (i.category === 'Contas de Casa' || i.category === 'Outros'));

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

        tr.innerHTML = `
            <td class="py-3 px-4 text-xs text-slate-400">${item.month}</td>
            <td class="py-3 px-4 text-xs font-medium text-indigo-300">${itemDate}</td>
            <td class="py-3 px-4 font-medium text-white">${item.desc}</td>
            <td class="py-3 px-4"><span class="badge-categoria ${catClass}">${item.category}</span></td>
            <td class="py-3 px-4 text-right font-semibold text-white">R$ ${Number(item.amount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="py-3 px-4 text-center">
                <button onclick="togglePaidStatus(${item.parentId}, '${item.month}')" class="px-2.5 py-1 rounded-full text-xs font-medium transition ${item.paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                    ${item.paid ? 'Pago' : 'Pendente'}
                </button>
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
