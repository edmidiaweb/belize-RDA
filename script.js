const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v600'; // Nova versão para suportar fotos e horários

function getTodayString() {
    const agora = new Date();
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
}

let db = JSON.parse(localStorage.getItem(DB_NAME)) || {
    team: {
        "lucas": { name: "Lucas", pass: "123" },
        "gamarra": { name: "Gamarra", pass: "123" },
        "mateus": { name: "Mateus", pass: "123" },
        "luis": { name: "Luis", pass: "123" }
    },
    tasks: []
};

const save = () => localStorage.setItem(DB_NAME, JSON.stringify(db));

// --- TEMA ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('belize_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// --- LOGIN ---
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;
    if (u === 'admin' && p === 'admbelize2026') { showScreen('admin-panel'); renderAdminUI(); return; }
    if (db.team[u] && db.team[u].pass === p) {
        window.currentUserKey = u;
        showScreen('worker-panel'); renderWorkerUI();
    } else alert("Acesso negado.");
}

function showScreen(id) {
    ['login-screen', 'admin-panel', 'worker-panel'].forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// --- ADMIN ---
function createTask() {
    const worker = document.getElementById('assign-to').value;
    const desc = document.getElementById('task-desc').value.trim();
    if (!desc) return;
    db.tasks.push({ 
        id: Date.now(), 
        workerId: worker, 
        date: getTodayString(), 
        desc, 
        status: 'Pendente',
        start: null,
        end: null,
        photo: null 
    });
    save(); renderAdminUI();
    document.getElementById('task-desc').value = "";
}

function renderAdminUI() {
    const acc = document.getElementById('worker-accordion');
    acc.innerHTML = '';
    const hoje = getTodayString();
    for (let k in db.team) {
        const tasks = db.tasks.filter(t => t.workerId === k && t.date === hoje);
        const content = tasks.map(t => `
            <div class="task-item">
                <b>${t.desc}</b><br>
                <small>Início: ${t.start || '--:--'} | Fim: ${t.end || '--:--'}</small><br>
                ${t.photo ? `<img src="${t.photo}" style="width:50px;border-radius:5px;margin-top:5px">` : ''}
            </div>`).join('') || 'Sem tarefas.';
        acc.innerHTML += `<div class="worker-card"><div class="worker-header">${db.team[k].name}</div><div class="worker-content">${content}</div></div>`;
    }
}

// --- FUNCIONÁRIO (A MÁGICA ACONTECE AQUI) ---
function renderWorkerUI() {
    const hoje = getTodayString();
    const tasks = db.tasks.filter(t => t.workerId === window.currentUserKey && t.date === hoje);
    const list = document.getElementById('worker-task-list');
    document.getElementById('display-worker-name').innerText = db.team[window.currentUserKey].name;

    list.innerHTML = tasks.map(t => `
        <div class="card">
            <h3>${t.desc}</h3>
            <p>Status: ${t.status}</p>
            ${t.status === 'Pendente' ? `<button class="btn-adm" onclick="startWork(${t.id})">▶ INICIAR TRABALHO</button>` : ''}
            ${t.status === 'Em Andamento' ? `
                <input type="file" id="file-${t.id}" accept="image/*" capture="camera" style="margin-bottom:10px">
                <button class="btn-success" onclick="finishWork(${t.id})">✅ FINALIZAR E ENVIAR FOTO</button>
            ` : ''}
            ${t.status === 'Concluída' ? '<span>✅ Finalizado às ' + t.end + '</span>' : ''}
        </div>`).join('') || '<p>Nenhuma tarefa para hoje.</p>';
}

function startWork(id) {
    const t = db.tasks.find(x => x.id === id);
    t.status = 'Em Andamento';
    t.start = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    save(); renderWorkerUI();
}

function finishWork(id) {
    const t = db.tasks.find(x => x.id === id);
    const fileInput = document.getElementById(`file-${id}`);
    
    if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            t.photo = e.target.result; // Salva a foto em Base64
            t.status = 'Concluída';
            t.end = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
            save(); renderWorkerUI();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        alert("Por favor, tire uma foto para finalizar o serviço!");
    }
}