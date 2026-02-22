// ================= CONFIGURAÇÕES =================
const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v650'; // Nova versão para garantir que o select e fotos funcionem

function getTodayString() {
    const agora = new Date();
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
}

let currentViewDate = new Date();
let selectedDate = getTodayString();
let currentUserKey = null;

// ================= BANCO DE DADOS =================
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

// ================= TEMA E INTERFACE =================
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('belize_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

if (localStorage.getItem('belize_theme') === 'dark') document.body.classList.add('dark-mode');

function showScreen(id) {
    ['login-screen', 'admin-panel', 'worker-panel'].forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// ================= LOGIN =================
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;

    if (u === 'admin' && p === 'admbelize2026') {
        showScreen('admin-panel');
        fillWorkerSelect(); // Preenche o select dos nomes
        renderCalendar();
        renderAdminUI();
        return;
    }

    if (db.team[u] && db.team[u].pass === p) {
        currentUserKey = u;
        showScreen('worker-panel');
        renderWorkerUI();
    } else {
        alert("Usuário ou senha incorretos.");
    }
}

// ================= ADMIN =================

// FUNÇÃO QUE ADICIONA OS NOMES AO SELECT
function fillWorkerSelect() {
    const sel = document.getElementById('assign-to');
    if (sel) {
        sel.innerHTML = Object.keys(db.team).map(k => 
            `<option value="${k}">${db.team[k].name}</option>`
        ).join('');
    }
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();

    let html = `<div class="cal-header">${currentViewDate.toLocaleDateString('pt-BR', {month:'long', year:'numeric'}).toUpperCase()}</div><div class="calendar-grid">`;
    for (let i = 1; i <= days; i++) {
        const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        html += `<div class="cal-day ${dStr === selectedDate ? 'selected-day' : ''}" onclick="selectDate('${dStr}')">${i}</div>`;
    }
    container.innerHTML = html + `</div>`;
    document.getElementById('selected-date-label').innerText = "Data: " + selectedDate.split('-').reverse().join('/');
}

function selectDate(date) { 
    selectedDate = date; 
    renderCalendar(); 
    renderAdminUI(); 
}

function createTask() {
    const worker = document.getElementById('assign-to').value;
    const desc = document.getElementById('task-desc').value.trim();
    if (!desc) return alert("Escreva a tarefa!");

    db.tasks.push({ 
        id: Date.now(), 
        workerId: worker, 
        date: selectedDate, 
        desc, 
        status: 'Pendente',
        start: null,
        end: null,
        photo: null 
    });
    save(); 
    renderAdminUI();
    document.getElementById('task-desc').value = "";
}

function renderAdminUI() {
    const acc = document.getElementById('worker-accordion');
    acc.innerHTML = '';

    for (let k in db.team) {
        const tasks = db.tasks.filter(t => t.workerId === k && t.date === selectedDate);
        const content = tasks.map(t => `
            <div class="task-item" style="border-left: 4px solid ${t.status === 'Concluída' ? '#22c55e' : '#f59e0b'}; margin-bottom: 8px; padding-left: 8px;">
                <b>${t.desc}</b><br>
                <small>Status: ${t.status}</small><br>
                <small>⏰ ${t.start || '--:--'} às ${t.end || '--:--'}</small>
                ${t.photo ? `<br><img src="${t.photo}" style="width:80px; border-radius:5px; margin-top:5px" onclick="window.open(this.src)">` : ''}
            </div>`).join('') || '<p style="font-size: 0.8rem; opacity: 0.6;">Sem atividades.</p>';
        
        acc.innerHTML += `
            <div class="worker-card">
                <div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">${db.team[k].name} ▾</div>
                <div class="worker-content hidden">${content}</div>
            </div>`;
    }
}

// ================= FUNCIONÁRIO =================
function renderWorkerUI() {
    const hoje = getTodayString();
    const tasks = db.tasks.filter(t => t.workerId === currentUserKey && t.date === hoje);
    const list = document.getElementById('worker-task-list');
    document.getElementById('display-worker-name').innerText = db.team[currentUserKey].name;

    list.innerHTML = tasks.map(t => `
        <div class="card">
            <h3>${t.desc}</h3>
            <p>Status: <b>${t.status}</b></p>
            ${t.status === 'Pendente' ? `<button class="btn-adm" onclick="startWork(${t.id})">▶ INICIAR SERVIÇO</button>` : ''}
            ${t.status === 'Em Andamento' ? `
                <div style="background: #f1f5f9; padding: 10px; border-radius: 10px; color: #1e293b">
                    <p>📸 Tire uma foto para finalizar:</p>
                    <input type="file" id="file-${t.id}" accept="image/*" capture="camera">
                    <button class="btn-success" style="margin-top:10px" onclick="finishWork(${t.id})">✅ FINALIZAR TUDO</button>
                </div>
            ` : ''}
            ${t.status === 'Concluída' ? '<p style="color:green">✅ Concluído às ' + t.end + '</p>' : ''}
        </div>`).join('') || `<div class="card">Nenhuma tarefa para hoje (${hoje.split('-').reverse().join('/')})</div>`;
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
            t.photo = e.target.result;
            t.status = 'Concluída';
            t.end = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
            save(); renderWorkerUI();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        alert("É obrigatório tirar a foto para concluir!");
    }
}

// ================= RELATÓRIO =================
function generateReport() {
    const tasks = db.tasks.filter(t => t.date === selectedDate);
    let r = `📋 *BELIZE RDT - ${selectedDate.split('-').reverse().join('/')}*\n`;
    Object.keys(db.team).forEach(k => {
        const wt = tasks.filter(t => t.workerId === k);
        if (wt.length) {
            r += `\n👤 *${db.team[k].name.toUpperCase()}*\n`;
            wt.forEach(t => {
                r += `${t.status === 'Concluída' ? '✅' : '⏳'} ${t.desc} (${t.start || '--'} - ${t.end || '--'})\n`;
            });
        }
    });
    document.getElementById('report-text').value = r;
    document.getElementById('report-area').classList.remove('hidden');
}

function sendAndClear() {
    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(document.getElementById('report-text').value)}`, '_blank');
}