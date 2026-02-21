// --- LÓGICA DE TEMA (MODO NOTURNO) ---
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('belize_theme', isDark ? 'dark' : 'light');
}

// Verifica preferência ao carregar
(function initTheme() {
    const savedTheme = localStorage.getItem('belize_theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');
})();

const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v80';
let selectedDate = new Date().toISOString().split('T')[0];

let db = JSON.parse(localStorage.getItem(DB_NAME)) || {
    adminTasks: [],
    team: {
        "lucas": { name: "Lucas", pass: "123", tasks: [] },
        "gamarra": { name: "Gamarra", pass: "123", tasks: [] },
        "mateus": { name: "Mateus", pass: "123", tasks: [] },
        "luis": { name: "Luis", pass: "123", tasks: [] }
    }
};

const save = () => localStorage.setItem(DB_NAME, JSON.stringify(db));
const getNowTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// --- RENDERIZAÇÃO DO CALENDÁRIO ---
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    let html = `<div class="calendar-grid">`;
    for(let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const active = dateStr === selectedDate ? 'selected-day' : '';
        html += `<div class="cal-day ${active}" onclick="selectDate('${dateStr}')">${i}</div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
    document.getElementById('selected-date-label').innerText = `Data Selecionada: ${new Date(selectedDate + "T12:00:00").toLocaleDateString('pt-BR')}`;
}

function selectDate(date) {
    selectedDate = date;
    renderCalendar();
    renderAdminUI();
}

// --- LOGIN E NAVEGAÇÃO ---
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;

    if(u === 'admin' && p === 'admbelize2026') {
        showScreen('admin-panel');
        renderCalendar();
        renderAdminUI();
        return;
    }
    if(db.team[u] && db.team[u].pass === p) {
        window.currentUserKey = u;
        showScreen('worker-panel');
        renderWorkerUI();
    } else alert("Acesso inválido.");
}

function showScreen(id) {
    ['login-screen', 'admin-panel', 'worker-panel'].forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// --- ADMIN: REGISTRAR ATIVIDADE PRÓPRIA ---
function saveAdminTask() {
    const desc = document.getElementById('admin-task-desc').value;
    const obs = document.getElementById('admin-task-obs').value;
    const photoFile = document.getElementById('admin-photo-input').files[0];

    if(!desc) return alert("Descreva a atividade.");

    const execute = (img = null) => {
        db.adminTasks.push({
            id: Date.now(),
            date: selectedDate,
            desc: "ADMIN: " + desc,
            obs: obs,
            photo: img,
            time: getNowTime()
        });
        save();
        alert("Atividade registrada!");
        document.getElementById('admin-task-desc').value = "";
        document.getElementById('admin-task-obs').value = "";
        document.getElementById('admin-photo-input').value = "";
        renderAdminUI();
    };

    if(photoFile) {
        const reader = new FileReader();
        reader.onload = (e) => execute(e.target.result);
        reader.readAsDataURL(photoFile);
    } else execute();
}

// --- ADMIN: DASHBOARD ---
function renderAdminUI() {
    const accordion = document.getElementById('worker-accordion');
    accordion.innerHTML = '';
    document.getElementById('assign-to').innerHTML = Object.keys(db.team).map(k => `<option value="${k}">${db.team[k].name}</option>`).join('');

    const adminTasksHoje = db.adminTasks.filter(t => t.date === selectedDate);
    if(adminTasksHoje.length > 0) {
        let adminHtml = adminTasksHoje.map(t => `
            <div class="task-item" style="border-left: 3px solid var(--belize)">
                <div style="display:flex; justify-content:space-between">
                    <b>${t.desc}</b>
                    <small style="color:var(--belize)">ADMIN</small>
                </div>
                <small>Horário: ${t.time}</small>
                ${t.obs ? `<small><i>Obs: ${t.obs}</i></small>` : ''}
            </div>
        `).join('');
        
        accordion.innerHTML += `
            <div class="worker-card" style="border-color:var(--belize)">
                <div class="worker-header" style="background:var(--belize); color:white">
                    <span>👤 MINHAS ATIVIDADES</span>
                    <span>${adminTasksHoje.length} ▼</span>
                </div>
                <div class="worker-content hidden">${adminHtml}</div>
            </div>`;
    }

    for(let k in db.team) {
        const tasks = db.team[k].tasks.filter(t => t.date === selectedDate);
        let tasksHtml = tasks.map(t => `
            <div class="task-item">
                <div style="display:flex; justify-content:space-between">
                    <b>${t.desc}</b>
                    <small style="color:${t.status === 'Concluída' ? 'var(--success)' : 'var(--warning)'}">${t.status.toUpperCase()}</small>
                </div>
                <div style="font-size:0.7rem; margin-top:5px;">
                    Início: <b class="time-badge">${t.start || '--:--'}</b> | Fim: <b class="time-badge">${t.end || '--:--'}</b>
                </div>
                <div style="display:flex; gap:5px; margin-top:8px;">
                    <button class="btn-small" style="background:var(--warning); color:white" onclick="editTask('${k}', ${t.id})">EDITAR</button>
                    <button class="btn-small" style="background:var(--danger); color:white" onclick="deleteTask('${k}', ${t.id})">EXCLUIR</button>
                </div>
            </div>
        `).join('') || '<p style="padding:10px; font-size:0.7rem; opacity:0.6;">Sem atividades planejadas.</p>';

        accordion.innerHTML += `
            <div class="worker-card">
                <div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <span>👤 ${db.team[k].name}</span>
                    <span>${tasks.length} ▼</span>
                </div>
                <div class="worker-content hidden">${tasksHtml}</div>
            </div>`;
    }
}

// (Funções auxiliares: createTask, editTask, deleteTask, renderWorkerUI, startTask, finishTask permanecem seguindo o padrão anterior)

function createTask() {
    const k = document.getElementById('assign-to').value;
    const d = document.getElementById('task-desc').value;
    if(!d) return alert("Preencha a descrição.");
    db.team[k].tasks.push({ id: Date.now(), date: selectedDate, desc: d, status: 'Pendente', start: null, end: null, photo: null, obs: '' });
    save(); renderAdminUI();
    document.getElementById('task-desc').value = "";
}

function editTask(k, id) {
    const t = db.team[k].tasks.find(x => x.id === id);
    const n = prompt("Editar tarefa:", t.desc);
    if(n) { t.desc = n; save(); renderAdminUI(); }
}

function deleteTask(k, id) {
    if(confirm("Excluir tarefa?")) {
        db.team[k].tasks = db.team[k].tasks.filter(x => x.id !== id);
        save(); renderAdminUI();
    }
}

function renderWorkerUI() {
    const user = window.currentUserKey;
    document.getElementById('display-worker-name').innerText = db.team[user].name;
    const list = document.getElementById('worker-task-list');
    const activeArea = document.getElementById('active-task-area');
    const hoje = new Date().toISOString().split('T')[0];
    
    list.innerHTML = ''; 
    const tasksHoje = db.team[user].tasks.filter(t => t.date === hoje);
    const activeTask = tasksHoje.find(t => t.status === 'Em Andamento');

    if(activeTask) {
        activeArea.classList.remove('hidden');
        activeArea.innerHTML = `
            <div class="card" style="border: 2px solid var(--warning)">
                <small style="color:var(--warning)">ATIVIDADE ATIVA</small>
                <h3>${activeTask.desc}</h3>
                <input type="file" accept="image/*" capture="environment" id="photo-input">
                <textarea id="task-obs" placeholder="Alguma observação?"></textarea>
                <button class="btn-success" onclick="finishTask(${activeTask.id})">FINALIZAR AGORA</button>
            </div>`;
    } else {
        activeArea.classList.add('hidden');
        tasksHoje.filter(t => t.status === 'Pendente').forEach(t => {
            list.innerHTML += `<div class="card"><b>${t.desc}</b><button class="btn-adm" onclick="startTask(${t.id})" style="margin-top:10px">INICIAR SERVIÇO</button></div>`;
        });
        if(tasksHoje.length === 0) list.innerHTML = '<p style="text-align:center; opacity:0.5">Nenhuma tarefa para hoje.</p>';
    }
}

function startTask(id) {
    const t = db.team[window.currentUserKey].tasks.find(x => x.id === id);
    t.status = 'Em Andamento';
    t.start = getNowTime();
    save(); renderWorkerUI();
}

function finishTask(id) {
    const t = db.team[window.currentUserKey].tasks.find(x => x.id === id);
    const photoFile = document.getElementById('photo-input').files[0];
    const done = (img = null) => {
        t.status = 'Concluída'; t.end = getNowTime(); t.photo = img;
        t.obs = document.getElementById('task-obs').value;
        save(); alert("Tarefa concluída!"); renderWorkerUI();
    };
    if(photoFile) { const r = new FileReader(); r.onload = (e) => done(e.target.result); r.readAsDataURL(photoFile); } else done();
}

function generateReport() {
    let report = `📋 *BELIZE RDT - ${new Date(selectedDate + "T12:00:00").toLocaleDateString()}*\\n`;
    const adminDone = db.adminTasks.filter(t => t.date === selectedDate);
    if(adminDone.length) {
        report += `\\n👤 *ENCARREGADO (ADMIN)*\\n`;
        adminDone.forEach(t => report += `🛠️ ${t.desc.replace("ADMIN: ", "")}\\n⏱ ${t.time}\\n`);
    }
    for(let k in db.team) {
        const tasks = db.team[k].tasks.filter(t => t.date === selectedDate && t.status === 'Concluída');
        if(tasks.length) {
            report += `\\n👤 *${db.team[k].name.toUpperCase()}*\\n`;
            tasks.forEach(t => report += `✅ ${t.desc}\\n⏱ ${t.start} - ${t.end}\\n`);
        }
    }
    document.getElementById('report-text').value = report;
    document.getElementById('report-area').classList.remove('hidden');
}

function sendAndClear() {
    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(document.getElementById('report-text').value)}`, '_blank');
}