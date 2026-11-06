// --- SISTEMA DE NOTIFICAÇÕES TOAST PROFISSIONAL ---
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    }

    let toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition transform translate-y-2 opacity-0 duration-300 border backdrop-blur-md`;

    let icon = '';
    if (type === 'success') {
        toast.className += ' bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-900/30';
        icon = '<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400 shrink-0"></i>';
    } else if (type === 'error') {
        toast.className += ' bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-900/30';
        icon = '<i data-lucide="alert-circle" class="w-5 h-5 text-rose-400 shrink-0"></i>';
    } else if (type === 'warning') {
        toast.className += ' bg-amber-950/90 border-amber-500/50 text-amber-100 shadow-amber-900/30';
        icon = '<i data-lucide="alert-triangle" class="w-5 h-5 text-amber-400 shrink-0"></i>';
    }

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// --- MODAL DE CONFIRMAÇÃO CUSTOMIZADO COM O LAYOUT DO SISTEMA ---
function showConfirmModal(message, onConfirm) {
    let existing = document.getElementById('customConfirmModal');
    if (existing) existing.remove();

    let modal = document.createElement('div');
    modal.id = 'customConfirmModal';
    modal.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50';
    
    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div class="flex items-center gap-3 text-amber-400">
                <i data-lucide="alert-triangle" class="w-6 h-6 shrink-0"></i>
                <h3 class="text-lg font-bold text-white">Confirmação de Ação</h3>
            </div>
            <p class="text-sm text-slate-300 leading-relaxed">${message}</p>
            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button id="okConfirmBtn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-600/20">Sim</button>
                <button id="cancelConfirmBtn" class="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-rose-600/20">Não</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    document.getElementById('cancelConfirmBtn').onclick = () => {
        modal.remove();
    };

    document.getElementById('okConfirmBtn').onclick = () => {
        modal.remove();
        onConfirm();
    };
}