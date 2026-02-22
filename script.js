/**
 * BELIZE RDT - ESTABILIDADE TOTAL v8.0
 * Solução definitiva para sincronização de tarefas.
 */

// 1. Configurações Globais
const MY_PHONE = "5513996305218";
const DB_NAME = "belize_final_v8"; // Reset para garantir limpeza de erros

// 2. Estado do Sistema
const App = {
    user: null,
    selectedDate: null,
    db: JSON.parse(localStorage.getItem(DB_NAME)) || {
        team: {
            "lucas": { name: "Lucas", pass: "123" },
            "gamarra": { name: "Gamarra", pass: "123" },
            "mateus": { name: "Mateus", pass: "123" },
            "luis": { name: "Luis", pass: "123" }
        },
        tasks: []
    }
};

// 3. Funções de Data (À prova de falhas)
function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
App.selectedDate = getTodayStr();

function save() { localStorage.setItem(DB_NAME, JSON.stringify(App.db)); }

// 4. Funções de Interface (Abertas para o HTML)
window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('belize_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
};

window.handleLogin = function() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;

    if (u === 'admin' && p === 'admbelize2026') {
        showScreen('admin-panel');
        initAdmin();
    } else if (App.db.team[u] && App.db.team[u].pass === p) {
        App.user = u;
        showScreen('worker-panel');
        renderWorkerTasks();
    } else {
        alert("Usuário ou senha inválidos.");
    }
};

function showScreen(id) {
    document.querySelectorAll('#login-screen, #admin-panel, #worker-panel').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// 5. Módulo Administrativo
function initAdmin() {
    const sel = document.getElementById('assign-to');
    sel.innerHTML = Object.keys(App.db.team).map(k => `<option value="${k}">${App.db.team[k].name}</option>`).join('');
    renderCalendar();
    renderAdminTasks();
}

window.createTask = function() {
    const worker = document.getElementById('assign-to').value;
    const desc = document.getElementById('task-desc').value.trim();
    if (!desc) return alert("Escreva a tarefa.");

    App.db.tasks.push({
        id: Date.now(),
        workerId: worker, // ID fixo
        date: App.selectedDate, // Data fixa
        desc: desc,
        status: 'Pendente',
        start: null,
        end: null,
        photo: null
    });

    save();
    renderAdminTasks();
    document.getElementById('task-desc').value = "";
    alert("Tarefa enviada!");
};

function renderAdminTasks() {
    const container = document.getElementById('worker-accordion');
    container.innerHTML = '';

    Object.keys(App.db.team).forEach(key => {
        const tasks = App.db.tasks.filter(t => t.workerId === key && t.date === App.selectedDate);
        const html = tasks.map(t => `
            <div class="task-item" style="border-left:4px solid ${t.status === 'Concluída' ? 'green' : 'orange'}">
                <b>${t.desc}</b> | <small>${t.status}</small>
                ${t.photo ? `<br><img src="${t.photo}" style="width:60px; border-radius:4px">` : ''}
            </div>
        `).join('') || '<p style="font-size:11px; color:gray">Nenhuma tarefa.</p>';

        container.innerHTML += `
            <div class="worker-card">
                <div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">${App.db.team[key].name} ▾</div>
                <div class="worker-content hidden">${html}</div>
            </div>`;
    });
}

// 6. Módulo Funcionário (Onde estava o erro)
function renderWorkerTasks() {
    const hoje = getTodayStr(); // Busca a data idêntica ao Admin
    const tasks = App.db.tasks.filter(t => t.workerId === App.user && t.date === hoje);
    const list = document.getElementById('worker-task-list');
    document.getElementById('display-worker-name').innerText = App.db.team[App.user].name;

    if (tasks.length === 0) {
        list.innerHTML = `<div class="card">Nenhuma tarefa para hoje (${hoje.split('-').reverse().join('/')})</div>`;
        return;
    }

    list.innerHTML = tasks.map(t => `
        <div class="card">
            <h3>${t.desc}</h3>
            <p>Status: <b>${t.status}</b></p>
            ${t.status === 'Pendente' ? `<button class="btn-adm" onclick="updateStatus(${t.id}, 'Em Andamento')">▶ INICIAR</button>` : ''}
            ${t.status === 'Em Andamento' ? `
                <input type="file" id="f-${t.id}" accept="image/*" capture="camera" style="margin-top:10px">
                <button class="btn-success" onclick="finishTask(${t.id})">✅ CONCLUIR</button>
            ` : ''}
            ${t.status === 'Concluída' ? '✅ Finalizado' : ''}
        </div>
    `).join('');
}

window.updateStatus = function(id, status) {
    const t = App.db.tasks.find(x => x.id === id);
    if(t) {
        t.status = status;
        t.start = new Date().toLocaleTimeString();
        save();
        renderWorkerTasks();
    }
};

window.finishTask = function(id) {
    const t = App.db.tasks.find(x => x.id === id);
    const file = document.getElementById(`f-${id}`).files[0];
    if(!file) return alert("Tire uma foto para concluir!");

    const reader = new FileReader();
    reader.onload = function(e) {
        t.photo = e.target.result;
        t.status = 'Concluída';
        t.end = new Date().toLocaleTimeString();
        save();
        renderWorkerTasks();
    };
    reader.readAsDataURL(file);
};

// 7. Calendário e Relatório
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const d = new Date();
    let html = `<div class="calendar-grid">`;
    for(let i=1; i<=31; i++) { // Simplificado para teste
        const day = String(i).padStart(2,'0');
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${day}`;
        html += `<div class="cal-day ${dateStr === App.selectedDate ? 'selected-day' : ''}" onclick="selectDate('${dateStr}')">${i}</div>`;
    }
    container.innerHTML = html + `</div>`;
}

window.selectDate = function(date) { App.selectedDate = date; renderCalendar(); renderAdminTasks(); };

window.generateReport = function() {
    const tasks = App.db.tasks.filter(t => t.date === App.selectedDate);
    let r = `📋 *RELATÓRIO BELIZE RDT*\nData: ${App.selectedDate}\n`;
    Object.keys(App.db.team).forEach(k => {
        const tk = tasks.filter(t => t.workerId === k);
        if(tk.length) {
            r += `\n👤 *${App.db.team[k].name}*\n`;
            tk.forEach(t => r += `${t.status === 'Concluída' ? '✅' : '⏳'} ${t.desc}\n`);
        }
    });
    document.getElementById('report-text').value = r;
    document.getElementById('report-area').classList.remove('hidden');
};

window.sendAndClear = function() {
    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(document.getElementById('report-text').value)}`);
};

// Iniciar Tema
if (localStorage.getItem('belize_theme') === 'dark') document.body.classList.add('dark-mode');