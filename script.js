const MY_PHONE = "5513996305218";
const ADMIN_PASS = "admbelize2026";
const DB_NAME = 'belize_rdt_v28';

// Inicialização de Dados
let db = JSON.parse(localStorage.getItem(DB_NAME)) || {
    admin: { pass: ADMIN_PASS },
    team: {
        "lucas": { name: "Lucas", pass: "123", tasks: [], weeklyCount: 0 },
        "gamarra": { name: "Gamarra", pass: "123", tasks: [], weeklyCount: 0 },
        "mateus": { name: "Mateus", pass: "123", tasks: [], weeklyCount: 0 },
        "luis": { name: "Luis", pass: "123", tasks: [], weeklyCount: 0 }
    }
};

let currentUserKey = null;
let currentPhotoBase64 = null;

function save() { localStorage.setItem(DB_NAME, JSON.stringify(db)); }
function getTime() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }

// Lógica de Reset de Domingo
function checkWeeklyReset() {
    const lastReset = localStorage.getItem('belize_last_reset');
    const agora = new Date();
    const dataHoje = agora.toISOString().split('T')[0];
    if (agora.getDay() === 0 && lastReset !== dataHoje) {
        for (let k in db.team) db.team[k].weeklyCount = 0;
        localStorage.setItem('belize_last_reset', dataHoje);
        save();
    }
}
checkWeeklyReset();

// Login
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;
    if(u === 'admin' && p === db.admin.pass) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        renderAdminUI();
        return;
    }
    if(db.team[u] && db.team[u].pass === p) {
        currentUserKey = u;
        document.getElementById('login-screen').classList.add('hidden');
        if(p === "123") document.getElementById('change-pass-screen').classList.remove('hidden');
        else showWorkerPanel();
    } else alert("Acesso negado.");
}

function finalizePassChange() {
    const p1 = document.getElementById('new-p1').value;
    if(p1.length < 3 || p1 === "123") return alert("Senha inválida.");
    db.team[currentUserKey].pass = p1;
    save(); showWorkerPanel();
}

// Painel Funcionário
function showWorkerPanel() {
    document.getElementById('change-pass-screen').classList.add('hidden');
    document.getElementById('worker-panel').classList.remove('hidden');
    document.getElementById('display-worker-name').innerText = db.team[currentUserKey].name;
    renderWorkerTasks();
}

function renderWorkerTasks() {
    const list = document.getElementById('worker-task-list');
    const activeArea = document.getElementById('active-task-area');
    list.innerHTML = ''; activeArea.innerHTML = '';
    const activeTask = db.team[currentUserKey].tasks.find(t => t.status === 'Em Andamento');

    if(activeTask) {
        activeArea.classList.remove('hidden');
        activeArea.innerHTML = `
            <div class="card" style="border: 2px solid var(--warning)">
                <p style="color:var(--warning); font-weight:bold; font-size:0.7rem">⚡ TAREFA ATIVA DESDE ${activeTask.start}</p>
                <h2 style="margin:5px 0">${activeTask.desc}</h2>
                <label class="btn-photo" style="display:block; text-align:center; padding:12px; border-radius:8px; cursor:pointer;">
                    📷 TIRAR FOTO DO SERVIÇO
                    <input type="file" accept="image/*" capture="environment" style="display:none" onchange="previewPhoto(event)">
                </label>
                <img id="img-preview" class="preview-img hidden">
                <textarea id="task-obs" placeholder="Observações do serviço..."></textarea>
                <button class="btn-success" onclick="finishTask(${activeTask.id})">FINALIZAR E ENVIAR</button>
            </div>`;
    } else {
        activeArea.classList.add('hidden');
        db.team[currentUserKey].tasks.filter(t => t.status === 'Pendente').forEach(t => {
            list.innerHTML += `<div class="card"><b>${t.desc}</b><button class="btn-adm" onclick="startTask(${t.id})" style="margin-top:10px">INICIAR AGORA</button></div>`;
        });
    }
}

function startTask(id) {
    const t = db.team[currentUserKey].tasks.find(x => x.id === id);
    t.status = 'Em Andamento'; t.start = getTime();
    save(); renderWorkerTasks();
}

function previewPhoto(e) {
    const reader = new FileReader();
    reader.onload = () => {
        currentPhotoBase64 = reader.result;
        document.getElementById('img-preview').src = reader.result;
        document.getElementById('img-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(e.target.files[0]);
}

function finishTask(id) {
    if(!currentPhotoBase64) return alert("A foto é obrigatória.");
    const t = db.team[currentUserKey].tasks.find(x => x.id === id);
    t.status = 'Concluída'; t.end = getTime(); t.photo = currentPhotoBase64;
    t.obs = document.getElementById('task-obs').value;
    db.team[currentUserKey].weeklyCount++;
    currentPhotoBase64 = null;
    save(); renderWorkerTasks();
    alert("Tarefa concluída!");
}

// Painel Admin
function renderAdminUI() {
    renderDashboard();
    const accordion = document.getElementById('worker-accordion');
    const select = document.getElementById('assign-to');
    accordion.innerHTML = ''; select.innerHTML = '';
    for(let k in db.team) {
        select.innerHTML += `<option value="${k}">${db.team[k].name}</option>`;
        let tasksHtml = '';
        db.team[k].tasks.forEach(t => {
            tasksHtml += `<div class="task-item">
                <span>${t.desc} <small>(${t.start || '--'}/${t.end || '--'})</small></span>
                <span class="status-badge" style="background:${t.status==='Concluída'?'#16a34a':(t.status==='Em Andamento'?'#d97706':'#94a3b8')}">${t.status}</span>
            </div>`;
        });
        accordion.innerHTML += `
            <div class="worker-card">
                <div class="worker-header" onclick="document.getElementById('c-${k}').classList.toggle('hidden')">
                    <span>👤 ${db.team[k].name}</span> <span>${db.team[k].tasks.length} ▼</span>
                </div>
                <div id="c-${k}" class="worker-content hidden">${tasksHtml || 'Sem tarefas'}</div>
            </div>`;
    }
}

function renderDashboard() {
    const container = document.getElementById('dashboard-stats');
    container.innerHTML = '';
    let max = Math.max(...Object.values(db.team).map(w => w.weeklyCount || 0), 5);
    for(let k in db.team) {
        const w = db.team[k];
        const percent = ((w.weeklyCount || 0) / max) * 100;
        container.innerHTML += `
            <div class="stat-row">
                <div class="stat-label"><span>${w.name}</span><span>${w.weeklyCount || 0}</span></div>
                <div class="progress-bg"><div class="progress-bar" style="width:${percent}%"></div></div>
            </div>`;
    }
    document.getElementById('week-info').innerText = "Reset automático todo Domingo às 00:00";
}

function createTask() {
    const k = document.getElementById('assign-to').value;
    const d = document.getElementById('task-desc').value;
    if(!d) return;
    db.team[k].tasks.push({ id: Date.now(), desc: d, status: 'Pendente', start: null, end: null, photo: null, obs: '' });
    save(); renderAdminUI(); document.getElementById('task-desc').value = "";
}

function generateReport() {
    let r = `📋 *BELIZE RDT - ${new Date().toLocaleDateString()}*\n`;
    for(let k in db.team) {
        const done = db.team[k].tasks.filter(t => t.status === 'Concluída');
        if(done.length) {
            r += `\n👤 *${db.team[k].name.toUpperCase()}*\n`;
            done.forEach(t => r += `✅ ${t.desc}\n⏰ ${t.start} às ${t.end}\n${t.obs ? '📝 Obs: '+t.obs+'\n' : ''}`);
        }
    }
    document.getElementById('report-text').value = r;
    document.getElementById('report-area').classList.remove('hidden');
}

function sendAndClear() {
    const txt = encodeURIComponent(document.getElementById('report-text').value);
    window.open(`https://wa.me/${MY_PHONE}?text=${txt}`, '_blank');
    for(let k in db.team) db.team[k].tasks = db.team[k].tasks.filter(t => t.status !== 'Concluída');
    save(); location.reload();
}