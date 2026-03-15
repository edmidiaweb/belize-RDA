/**
 * BELIZE RDT - MODO TESTE (Sincronização Ativa)
 */

const GITHUB_CONFIG = {
    token: "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", // Gere um novo token no GitHub
    owner: "edmidiaweb",
    repo: "belize-RDA",
    path: "tarefas.json"
};

let App = {
    user: null,
    selectedDate: new Date().toISOString().split('T')[0],
    db: {
        team: {
            "admin": { name: "Administrador", pass: "admbelize2026" },
            "mateus": { name: "Mateus", pass: "123" },
            "luis": { name: "Luis", pass: "123" },
            "gamarra": { name: "Gamarra", pass: "123" },
            "lucas": { name: "Lucas", pass: "123" }
        },
        tasks: []
    }
};

// 3. CARREGAR DADOS DO GITHUB
async function carregarDados() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/${GITHUB_CONFIG.path}?t=${Date.now()}`);
        if (!response.ok) throw new Error("Erro ao buscar JSON");
        const data = await response.json();
        App.db.tasks = data.tasks;
    } catch (e) {
        console.error("Erro ao carregar do GitHub:", e);
    }
}

// 4. SALVAR NO GITHUB (API)
async function salvarTarefasNoGitHub() {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
    
    try {
        const getRes = await fetch(url, { headers: { 'Authorization': `token ${GITHUB_CONFIG.token}` } });
        const fileData = await getRes.json();
        const content = btoa(unescape(encodeURIComponent(JSON.stringify({ tasks: App.db.tasks }, null, 2))));
        
        const updateRes = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: "Atualização via painel",
                content: content,
                sha: fileData.sha
            })
        });

        if (updateRes.ok) alert("Sincronizado com sucesso!");
        else throw new Error("Falha na API");
    } catch (e) {
        alert("Erro no GitHub: " + e.message);
    }
}

// 5. LOGIN (Sem restrição de horário)
window.handleLogin = function() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;

    if (u === 'admin' && p === App.db.team.admin.pass) {
        showScreen('admin-panel');
        initAdmin();
    } else if (App.db.team[u] && App.db.team[u].pass === p) {
        App.user = u;
        showScreen('worker-panel');
        renderWorkerTasks();
    } else {
        alert("Usuário ou senha incorretos.");
    }
};

function showScreen(id) {
    document.querySelectorAll('#login-screen, #admin-panel, #worker-panel').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// 6. ADMINISTRADOR
window.initAdmin = function() {
    const sel = document.getElementById('assign-to');
    sel.innerHTML = Object.keys(App.db.team).filter(k => k !== 'admin').map(k => `<option value="${k}">${App.db.team[k].name}</option>`).join('');
    renderAdminTasks();
};

window.createTask = async function() {
    const worker = document.getElementById('assign-to').value;
    const desc = document.getElementById('task-desc').value.trim();
    if (!desc) return alert("Escreva a tarefa!");

    App.db.tasks.push({
        id: Date.now(),
        workerId: worker,
        date: App.selectedDate,
        desc: desc,
        status: 'Pendente'
    });

    await salvarTarefasNoGitHub();
    renderAdminTasks();
    document.getElementById('task-desc').value = "";
};

window.renderAdminTasks = function() {
    const container = document.getElementById('worker-accordion');
    if(!container) return;
    container.innerHTML = Object.keys(App.db.team).filter(k => k !== 'admin').map(key => {
        const tasks = App.db.tasks.filter(t => t.workerId === key);
        return `<div class="card"><b>${App.db.team[key].name}</b><br>${tasks.map(t => t.desc).join(', ')}</div>`;
    }).join('');
};

// 7. FUNCIONÁRIO (Sem restrição de horário)
window.renderWorkerTasks = function() {
    const list = document.getElementById('worker-task-list');
    if(!list) return;
    document.getElementById('display-worker-name').innerText = App.db.team[App.user].name;
    const tasks = App.db.tasks.filter(t => t.workerId === App.user);
    list.innerHTML = tasks.length > 0 ? tasks.map(t => `<div class="card">${t.desc} - ${t.status}</div>`).join('') : "Nenhuma tarefa pendente.";
};

// 8. INICIALIZAÇÃO
window.onload = async () => {
    await carregarDados();
    if (localStorage.getItem('belize_theme') === 'dark') document.body.classList.add('dark-mode');
};
