// Professional login and dashboard UI for Idle No More Desktop

const API_BASE = 'http://127.0.0.1:8000/api';

const app = document.getElementById('app');

function renderLogin(message = '') {
  app.innerHTML = `
    <div class="centered-card">
      <img src="idle-no-more-logo.png" alt="Idle No More Logo" class="logo" />
      <h1>Idle No More Desktop</h1>
      <form id="login-form" class="card">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" required autocomplete="username" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required autocomplete="current-password" />
        </div>
        <button type="submit" class="btn">Log In</button>
        <div class="form-message">${message}</div>
      </form>
    </div>
  `;
  document.getElementById('login-form').onsubmit = handleLogin;
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  try {
    const res = await fetch(`${API_BASE}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const data = await res.json();
      renderLogin(data.detail || 'Login failed.');
      return;
    }
    const data = await res.json();
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    fetchAndRenderDashboard(data.access);
  } catch (err) {
    renderLogin('Network error. Please try again.');
  }
}

async function fetchAndRenderDashboard(token) {
  try {
    const res = await fetch(`${API_BASE}/employees/me/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      renderLogin('Session expired. Please log in again.');
      return;
    }
    const data = await res.json();
    // Fetch projects for time logging panel
    const projects = await fetchUserProjects(token);
    renderDashboard(data, projects, token);
  } catch (err) {
    renderLogin('Network error. Please try again.');
  }
}

async function fetchUserProjects(token) {
  try {
    const res = await fetch(`${API_BASE}/employees/me/projects/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchTasksForProject(token, projectId) {
  try {
    const res = await fetch(`${API_BASE}/employees/me/tasks/?project_id=${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function renderDashboard(data, assignedProjects, token) {
  const { employee, projects, tasks } = data;
  // Default: select first project, then fetch its tasks
  let selectedProjectId = assignedProjects.length > 0 ? assignedProjects[0].id : null;
  let selectedTaskId = null;
  let currentTasks = [];

  app.innerHTML = `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <img src="idle-no-more-logo.png" alt="Idle No More Logo" class="logo large" />
          <div class="brand-title">IDLE NO MORE</div>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar">${employee.first_name ? employee.first_name[0] : employee.username[0]}</div>
          <div class="user-name">${employee.first_name || employee.username}</div>
          <div class="user-role">${employee.role}</div>
        </div>
        <button class="btn btn-logout" id="logout-btn">Log Out</button>
      </aside>
      <main class="dashboard-main">
        <div class="dashboard-header">
          <h2>Welcome, ${employee.first_name || employee.username}!</h2>
        </div>
        <div class="dashboard-content-flex">
          <div class="dashboard-cards dashboard-cards-vertical">
            <div class="card user-info gradient-card">
              <h3>User Details</h3>
              <p><strong>Username:</strong> ${employee.username}</p>
              <p><strong>Email:</strong> ${employee.email}</p>
              <p><strong>Status:</strong> ${employee.is_active ? 'Active' : 'Inactive'}</p>
            </div>
            <div class="card project-list gradient-card">
              <h3>Your Projects</h3>
              <ul class="simple-list">
                ${assignedProjects.length === 0 ? '<li>No projects assigned.</li>' : assignedProjects.map(p => `<li><span class='project-name'>${p.name}</span> <span class='project-people'>(${p.employees.length} people)</span></li>`).join('')}
              </ul>
            </div>
            <div class="card task-list gradient-card">
              <h3>Your Tasks</h3>
              <ul class="simple-list">
                ${tasks.length === 0 ? '<li>No tasks assigned.</li>' : tasks.map(t => `<li>${t.name}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="dashboard-timelog-panel card">
            <h3>Log Your Time</h3>
            <div class="form-group">
              <label for="timelog-project">Project</label>
              <select id="timelog-project" class="timelog-select">
                ${assignedProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="timelog-task">Task</label>
              <select id="timelog-task" class="timelog-select">
                <option value="">Select a project first</option>
              </select>
            </div>
            <button class="btn" id="start-timelog-btn">Start Logging Time</button>
          </div>
        </div>
      </main>
    </div>
  `;
  document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    renderLogin();
  };

  // Time logging panel logic
  const projectSelect = document.getElementById('timelog-project');
  const taskSelect = document.getElementById('timelog-task');
  if (projectSelect) {
    // On load, fetch tasks for first project
    if (selectedProjectId) {
      fetchTasksForProject(token, selectedProjectId).then(tasks => {
        currentTasks = tasks;
        updateTaskSelect(tasks);
      });
    }
    projectSelect.onchange = function () {
      selectedProjectId = this.value;
      fetchTasksForProject(token, selectedProjectId).then(tasks => {
        currentTasks = tasks;
        updateTaskSelect(tasks);
      });
    };
  }
  function updateTaskSelect(tasks) {
    if (!taskSelect) return;
    if (!tasks || tasks.length === 0) {
      taskSelect.innerHTML = '<option value="">No tasks for this project</option>';
      return;
    }
    taskSelect.innerHTML = tasks.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }
  document.getElementById('start-timelog-btn').onclick = function () {
    // Placeholder for time logging functionality
    alert('Time logging functionality coming soon!');
  };
}

// On load, check for token and try to fetch dashboard
const access = localStorage.getItem('access');
if (access) {
  fetchAndRenderDashboard(access);
} else {
  renderLogin();
} 