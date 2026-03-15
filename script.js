/**
 * BELIZE RDT - SINCRONIZAÇÃO VIA JSON (v9.0)
 * O sistema lê o arquivo 'tarefas.json' do servidor toda vez que abre.
 */

const MY_PHONE = "5513996305218";
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

// 1. CARREGAR DADOS DO GITHUB
async function carregarDados() {
    try {
        const response = await fetch('tarefas.json?nocache=' + Date.now());
        const data = await response.json();
        App.db.tasks = data.tasks;
        console.log("Dados sincronizados com o GitHub.");
    } catch (e) {
        console.warn("Usando dados locais (erro ao buscar JSON).");
    }
}

// 2. INICIALIZAÇÃO
window.onload = async () => {
    await carregarDados();
    if (localStorage.getItem('belize_theme') === 'dark') document.body.classList.add('dark-mode');
};

// 3. LOGIN (Mantido)
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

// 4. MÓDULOS DE RENDERIZAÇÃO
function renderWorkerTasks() {
    const list = document.getElementById('worker-task-list');
    document.getElementById('display-worker-name').innerText = App.db.team[App.user].name;
    const tasks = App.db.tasks.filter(t => t.workerId === App.user && t.date === App.selectedDate);

    list.innerHTML = tasks.length ? tasks.map(t => `
        <div class="card">
            <h3>${t.desc}</h3>
            <p>Status: <b>${t.status}</b></p>
        </div>
    `).join('') : '<div class="card">Nenhuma tarefa para hoje.</div>';
}

function initAdmin() {
    const sel = document.getElementById('assign-to');
    sel.innerHTML = Object.keys(App.db.team).filter(k => k !== 'admin').map(k => `<option value="${k}">${App.db.team[k].name}</option>`).join('');
}