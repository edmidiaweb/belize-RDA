/**
 * BELIZE RDT - GESTÃO DE MANUTENÇÃO
 * Versão: 7.0 (Profissional)
 * Foco: Estabilidade, Registo de Ponto e Prova Fotográfica
 */

// 1. Definições de Constantes
const MY_PHONE = "5513996305218";
const DB_NAME = "belize_rdt_v700"; // Salto de versão para limpar caches corrompidos

// 2. Estado Global
const state = {
    currentViewDate: new Date(),
    selectedDate: getTodayString(),
    currentUser: null,
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

// 3. Funções de Utilidade (Data e Persistência)
function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function saveDB() {
    localStorage.setItem(DB_NAME, JSON.stringify(state.db));
}

// 4. Gestão de Interface (Modo Noturno e Ecrãs)
window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('belize_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
};

function showScreen(id) {
    document.querySelectorAll('#login-screen, #admin-panel, #worker-panel').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// 5. Autenticação
window.handleLogin = function() {
    const user = document.getElementById('login-user').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;

    if (user === 'admin' && pass === 'admbelize2026') {
        initAdmin();
        return;
    }

    if (state.db.team[user] && state.db.team[user].pass === pass) {
        state.currentUser = user;
        initWorker();
    } else {
        alert("Credenciais inválidas. Verifique usuário e senha.");
    }
};

// 6. Módulo Administrativo
function initAdmin() {
    showScreen('admin-panel');
    const select = document.getElementById('assign-to');
    
    // Popula o Select com os nomes da equipe
    select.innerHTML = Object.keys(state.db.team).map(key => 
        `<option value="${key}">${state.db.team[key].name}</option>`
    ).join('');

    renderCalendar();
    renderAdminTasks();
}

window.createTask = function() {
    const workerId = document.getElementById('assign-to').value;
    const desc = document.getElementById('task-desc').value.trim();

    if (!desc) {
        alert("Por favor, descreva a atividade.");
        return;
    }

    state.db.tasks.push({
        id: Date.now(),
        workerId,
        date: state.selectedDate,
        desc,
        status: 'Pendente',
        startTime: null,
        endTime: null,
        photo: null
    });

    saveDB();
    renderAdminTasks();
    document.getElementById('task-desc').value = "";
};

function renderAdminTasks() {
    const container = document.getElementById('worker-accordion');
    container.innerHTML = '';

    Object.keys(state.db.team).forEach(key => {
        const workerTasks = state.db.tasks.filter(t => t.workerId === key && t.date === state.selectedDate);
        
        const taskHtml = workerTasks.map(t => `
            <div class="task-item" style="border-left: 3px solid ${t.status === 'Concluída' ? '#22c55e' : '#f59e0b'}">
                <strong>${t.desc}</strong><br>
                <small>⏱ ${t.startTime || '--'} | ${t.endTime || '--'}</small>
                ${t.photo ? `<br><img src="${t.photo}" class="thumbnail" onclick="window.open(this.src)">` : ''}
            </div>
        `).join('') || '<p class="empty-msg">Nenhuma tarefa agendada.</p>';

        container.innerHTML += `
            <div class="worker-card">
                <div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    ${state.db.team[key].name} <span>${workerTasks.length} tarefas</span>
                </div>
                <div class="worker-content hidden">${taskHtml}</div>
            </div>`;
    });
}

// 7. Módulo Funcionário (Fluxo de Trabalho)
function initWorker() {
    showScreen('worker-panel');
    document.getElementById('display-worker-name').innerText = state.db.team[state.currentUser].name;
    renderWorkerTasks();
}

function renderWorkerTasks() {
    const today = getTodayString();
    const tasks = state.db.tasks.filter(t => t.workerId === state.currentUser && t.date === today);
    const container = document.getElementById('worker-task-list');

    container.innerHTML = tasks.map(t => `
        <div class="card task-card">
            <h3>${t.desc}</h3>
            <div class="task-status">${t.status}</div>
            
            ${t.status === 'Pendente' ? 
                `<button class="btn-adm" onclick="updateTaskStatus(${t.id}, 'Em Andamento')">▶ INICIAR TRABALHO</button>` : ''}
            
            ${t.status === 'Em Andamento' ? `
                <div class="photo-upload">
                    <label>📸 Foto da Conclusão:</label>
                    <input type="file" id="file-${t.id}" accept="image/*" capture="camera">
                    <button class="btn-success" onclick="completeTask(${t.id})">✅ FINALIZAR SERVIÇO</button>
                </div>` : ''}
                
            ${t.status === 'Concluída' ? `<p class="done-msg">Concluído às ${t.endTime}</p>` : ''}
        </div>
    `).join('') || `<div class="card">Nenhuma atividade para hoje (${today.split('-').reverse().join('/')}).</div>`;
}

window.updateTaskStatus = function(id, status) {
    const task = state.db.tasks.find(t => t.id === id);
    if (task) {
        task.status = status;
        if (status === 'Em Andamento') task.startTime = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
        saveDB();
        renderWorkerTasks();
    }
};

window.completeTask = function(id) {
    const fileInput = document.getElementById(`file-${id}`);
    const task = state.db.tasks.find(t => t.id === id);

    if (!fileInput.files[0]) {
        alert("É obrigatório tirar uma foto do serviço finalizado.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        task.photo = e.target.result;
        task.status = 'Concluída';
        task.endTime = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
        saveDB();
        renderWorkerTasks();
    };
    reader.readAsDataURL(fileInput.files[0]);
};

// 8. Calendário Profissional
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const year = state.currentViewDate.getFullYear();
    const month = state.currentViewDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();

    let html = `<div class="cal-header">${state.currentViewDate.toLocaleDateString('pt-BR', {month:'long', year:'numeric'}).toUpperCase()}</div>`;
    html += `<div class="calendar-grid">`;

    for (let i = 1; i <= days; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        html += `<div class="cal-day ${dateStr === state.selectedDate ? 'selected-day' : ''}" onclick="selectDate('${dateStr}')">${i}</div>`;
    }
    container.innerHTML = html + `</div>`;
    document.getElementById('selected-date-label').innerText = "Agenda: " + state.selectedDate.split('-').reverse().join('/');
}

window.selectDate = function(date) {
    state.selectedDate = date;
    renderCalendar();
    renderAdminTasks();
};

window.changeMonth = function(dir) {
    state.currentViewDate.setMonth(state.currentViewDate.getMonth() + dir);
    renderCalendar();
};

// 9. Relatório WhatsApp Profissional
window.generateReport = function() {
    const tasks = state.db.tasks.filter(t => t.date === state.selectedDate);
    if (!tasks.length) return alert("Sem tarefas para relatar.");

    let r = `📋 *RELATÓRIO BELIZE RDT - ${state.selectedDate.split('-').reverse().join('/')}*\n`;
    
    Object.keys(state.db.team).forEach(key => {
        const workerTasks = tasks.filter(t => t.workerId === key);
        if (workerTasks.length) {
            r += `\n👤 *${state.db.team[key].name.toUpperCase()}*\n`;
            workerTasks.forEach(t => {
                const icon = t.status === 'Concluída' ? '✅' : '⏳';
                r += `${icon} ${t.desc} (${t.startTime || '--'} às ${t.endTime || '--'})\n`;
            });
        }
    });

    document.getElementById('report-text').value = r;
    document.getElementById('report-area').classList.remove('hidden');
};

window.sendAndClear = function() {
    const text = document.getElementById('report-text').value;
    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(text)}`, '_blank');
};

// Inicialização de Tema
if (localStorage.getItem('belize_theme') === 'dark') document.body.classList.add('dark-mode');