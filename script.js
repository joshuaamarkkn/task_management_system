// script.js
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let selectedTaskId = null;
let charts = {};

// Initialize drag and drop
const drake = dragula([
    document.querySelector('#todoBoard .task-list'),
    document.querySelector('#inProgressBoard .task-list'),
    document.querySelector('#doneBoard .task-list')
]);

drake.on('drop', function(el, target, source) {
    const taskId = el.getAttribute('data-id');
    const newStatus = target.parentElement.id.replace('Board', '');
    updateTaskStatus(taskId, newStatus);
    updateStats();
    updateTaskCounts();
    if (charts.distribution) updateCharts();
});

// Theme toggling
document.getElementById('themeToggle').addEventListener('click', function() {
    document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', document.body.dataset.theme);
});

// Load saved theme
document.body.dataset.theme = localStorage.getItem('theme') || 'light';

// Search and Filter Event Listeners
document.getElementById('searchInput').addEventListener('input', filterTasks);
document.getElementById('priorityFilter').addEventListener('change', filterTasks);
document.getElementById('dateFilter').addEventListener('change', filterTasks);

// Analytics Toggle
document.getElementById('toggleAnalytics').addEventListener('click', function() {
    const dashboard = document.getElementById('analyticsDashboard');
    dashboard.classList.toggle('hidden');
    if (!dashboard.classList.contains('hidden')) {
        initializeCharts();
    }
});

// Task Management Functions
function createTask(taskData) {
    const task = {
        id: Date.now().toString(),
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        status: 'todo',
        createdAt: new Date().toISOString(),
        notified: false,
        tags: taskData.tags ? taskData.tags.split(',').map(tag => tag.trim()) : [],
        timeEstimate: taskData.timeEstimate || 0,
        checklist: taskData.checklist || []
    };
    
    tasks.push(task);
    saveTasks();
    renderTask(task);
    updateStats();
    updateTaskCounts();
    if (charts.distribution) updateCharts();
    showNotification('Task created successfully', 'success');
    return task;
}

function renderTask(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.setAttribute('data-id', task.id);
    
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < new Date() && task.status !== 'done';
    
    taskElement.innerHTML = `
        <div class="task-header">
            <h3>${task.title}</h3>
            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
        </div>
        <p>${task.description}</p>
        ${task.tags.length > 0 ? `
        <div class="task-tags">
            ${task.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>` : ''}
        <div class="task-footer">
            <div class="task-date ${isOverdue ? 'overdue' : ''}">
                Due: ${dueDate.toLocaleString()}
            </div>
            ${task.timeEstimate ? `
            <div class="time-estimate">
                <span class="time-icon">⌛</span> ${task.timeEstimate}h
            </div>` : ''}
        </div>
    `;

    // Add context menu event listener
    taskElement.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showContextMenu(e, task.id);
    });

    // Add double-click to edit
    taskElement.addEventListener('dblclick', function() {
        editTask(task.id);
    });

    const targetBoard = document.querySelector(`#${task.status}Board .task-list`);
    targetBoard.appendChild(taskElement);
}

function filterTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const priorityFilter = document.getElementById('priorityFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                            task.description.toLowerCase().includes(searchTerm);
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesDate = checkDateFilter(task, dateFilter);

        return matchesSearch && matchesPriority && matchesDate;
    });

    refreshTasks(filteredTasks);
}

function checkDateFilter(task, filter) {
    const now = new Date();
    const taskDate = new Date(task.dueDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    switch (filter) {
        case 'all':
            return true;
        case 'today':
            return taskDate >= today && taskDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        case 'week':
            return taskDate >= today && taskDate <= weekFromNow;
        case 'overdue':
            return taskDate < now && task.status !== 'done';
        default:
            return true;
    }
}

function updateTaskStatus(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        saveTasks();
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    updateStats();
    updateTaskCounts();
    hideContextMenu();
    refreshTasks();
    if (charts.distribution) updateCharts();
    showNotification('Task deleted successfully', 'success');
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskDueDate').value = task.dueDate.slice(0, 16);
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskTags').value = task.tags.join(', ');
    document.getElementById('editTaskEstimate').value = task.timeEstimate;
    
    document.getElementById('editTaskModal').style.display = 'block';
    hideContextMenu();
}

function handleEditTask(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('editTaskId').value;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return;

    tasks[taskIndex] = {
        ...tasks[taskIndex],
        title: document.getElementById('editTaskTitle').value,
        description: document.getElementById('editTaskDescription').value,
        dueDate: document.getElementById('editTaskDueDate').value,
        priority: document.getElementById('editTaskPriority').value,
        tags: document.getElementById('editTaskTags').value.split(',').map(tag => tag.trim()),
        timeEstimate: document.getElementById('editTaskEstimate').value
    };

    saveTasks();
    closeEditTaskModal();
    refreshTasks();
    if (charts.distribution) updateCharts();
    showNotification('Task updated successfully', 'success');
}

function refreshTasks(filteredTaskList = tasks) {
    // Clear all task lists
    document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
    // Re-render all tasks
    filteredTaskList.forEach(task => renderTask(task));
    updateStats();
    updateTaskCounts();
}

function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('completionTrend').textContent = `${completionRate}% completion rate`;

    const upcomingDeadlines = tasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return dueDate > now && dueDate <= threeDaysFromNow && t.status !== 'done';
    });

    document.getElementById('upcomingDeadlines').textContent = upcomingDeadlines.length;
    if (upcomingDeadlines.length > 0) {
        const nextDeadline = new Date(Math.min(...upcomingDeadlines.map(t => new Date(t.dueDate))));
        document.getElementById('deadlineTrend').textContent = `Next: ${nextDeadline.toLocaleDateString()}`;
    } else {
        document.getElementById('deadlineTrend').textContent = 'No upcoming deadlines';
    }
}

function updateTaskCounts() {
    ['todo', 'inProgress', 'done'].forEach(status => {
        const count = tasks.filter(t => t.status === status).length;
        document.querySelector(`#${status}Board .task-count`).textContent = count;
    });
}

// Modal Functions
function openNewTaskModal() {
    document.getElementById('taskModal').style.display = 'block';
}

function closeNewTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('taskForm').reset();
}

function closeEditTaskModal() {
    document.getElementById('editTaskModal').style.display = 'none';
    document.getElementById('editTaskForm').reset();
}

function handleNewTask(event) {
    event.preventDefault();
    
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        dueDate: document.getElementById('taskDueDate').value,
        priority: document.getElementById('taskPriority').value,
        tags: document.getElementById('taskTags').value,
        timeEstimate: document.getElementById('taskEstimate').value
    };
    
    createTask(taskData);
    closeNewTaskModal();
}

// Context Menu Functions
function showContextMenu(e, taskId) {
    const menu = document.getElementById('taskContextMenu');
    selectedTaskId = taskId;
    
    menu.style.display = 'block';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    
    // Hide context menu when clicking outside
    document.addEventListener('click', hideContextMenu);
}

function hideContextMenu() {
    document.getElementById('taskContextMenu').style.display = 'none';
    document.removeEventListener('click', hideContextMenu);
}

// Notification Functions
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Charts Functions
function initializeCharts() {
    const distributionCtx = document.getElementById('taskDistributionChart').getContext('2d');
    const priorityCtx = document.getElementById('priorityChart').getContext('2d');
    const completionCtx = document.getElementById('completionTrendChart').getContext('2d');

    charts.distribution = new Chart(distributionCtx, {
        type: 'doughnut',
        data: getTaskDistributionData(),
        options: { responsive: true }
    });

    charts.priority = new Chart(priorityCtx, {
        type: 'bar',
        data: getPriorityData(),
        options: { responsive: true }
    });

    charts.completion = new Chart(completionCtx, {
        type: 'line',
        data: getCompletionTrendData(),
        options: { responsive: true }
    });
}

function updateCharts() {
    if (charts.distribution) {
        charts.distribution.data = getTaskDistributionData();
        charts.distribution.update();
    }
    if (charts.priority) {
        charts.priority.data = getPriorityData();
        charts.priority.update();
    }
    if (charts.completion) {
        charts.completion.data = getCompletionTrendData();
        charts.completion.update();
    }
}

function getTaskDistributionData() {
    return {
        labels: ['To Do', 'In Progress', 'Done'],
        datasets: [{
            data: [
                tasks.filter(t => t.status === 'todo').length,
                tasks.filter(t => t.status === 'inProgress').length,
                tasks.filter(t => t.status === 'done').length
            ],
            backgroundColor: ['#3b82f6', '#f59e0b', '#10b981']
        }]
    };
}

function getPriorityData() {
    return {
        labels: ['High', 'Medium', 'Low'],
        datasets: [{
            label: 'Tasks by Priority',
            data: [
                tasks.filter(t => t.priority === 'high').length,
                tasks.filter(t => t.priority === 'medium').length,
                tasks.filter(t => t.priority === 'low').length
            ],
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
        }]
    };
}

function getCompletionTrendData() {
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toLocaleDateString();
    }).reverse();

    return {
        labels: last7Days,
        datasets: [{
            label: 'Completed Tasks',
            data: last7Days.map(date => 
                tasks.filter(task => 
                    task.status === 'done' && 
                    new Date(task.dueDate).toLocaleDateString() === date
                ).length
            ),
            borderColor: '#3b82f6',
            tension: 0.1
        }]
    };
}

// Local Storage Functions
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Check for overdue tasks and upcoming deadlines
function checkDeadlines() {
    const now = new Date();
    tasks.forEach(task => {
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate - now;
        
        if (task.status !== 'done') {
            if (dueDate < now && !task.notified) {
                showNotification(`Task "${task.title}" is overdue!`, 'warning');
                task.notified = true;
            }
            //Check for upcoming deadlines (within next hour)
            else if (timeDiff > 0 && timeDiff <= 3600000 && !task.notified) {
                showNotification(`Task "${task.title}" is due in ${Math.round(timeDiff/60000)} minutes`, 'warning');
                task.notified = true;
            }
        }
    });
    saveTasks();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    refreshTasks();
    setInterval(checkDeadlines, 60000); // Check deadlines every minute
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Charts and Analytics Functions
function initializeCharts() {
    const theme = document.body.dataset.theme;
    const textColor = theme === 'dark' ? '#fff' : '#1f2937';

    // Task Distribution Chart
    const distributionCtx = document.getElementById('taskDistributionChart').getContext('2d');
    charts.distribution = new Chart(distributionCtx, {
        type: 'doughnut',
        data: getTaskDistributionData(),
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: textColor }
                }
            }
        }
    });

    // Priority Chart
    const priorityCtx = document.getElementById('priorityChart').getContext('2d');
    charts.priority = new Chart(priorityCtx, {
        type: 'bar',
        data: getPriorityData(),
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor }
                },
                x: {
                    ticks: { color: textColor }
                }
            }
        }
    });

    // Completion Trend Chart
    const trendCtx = document.getElementById('completionTrendChart').getContext('2d');
    charts.trend = new Chart(trendCtx, {
        type: 'line',
        data: getCompletionTrendData(),
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor }
                },
                x: {
                    ticks: { color: textColor }
                }
            }
        }
    });
}

function updateCharts() {
    if (charts.distribution) {
        charts.distribution.data = getTaskDistributionData();
        charts.distribution.update();
    }
    if (charts.priority) {
        charts.priority.data = getPriorityData();
        charts.priority.update();
    }
    if (charts.trend) {
        charts.trend.data = getCompletionTrendData();
        charts.trend.update();
    }
}

function getTaskDistributionData() {
    return {
        labels: ['To Do', 'In Progress', 'Done'],
        datasets: [{
            data: [
                tasks.filter(t => t.status === 'todo').length,
                tasks.filter(t => t.status === 'inProgress').length,
                tasks.filter(t => t.status === 'done').length
            ],
            backgroundColor: ['#3b82f6', '#f59e0b', '#10b981']
        }]
    };
}

function getPriorityData() {
    return {
        labels: ['High', 'Medium', 'Low'],
        datasets: [{
            label: 'Tasks by Priority',
            data: [
                tasks.filter(t => t.priority === 'high').length,
                tasks.filter(t => t.priority === 'medium').length,
                tasks.filter(t => t.priority === 'low').length
            ],
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
        }]
    };
}

function getCompletionTrendData() {
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toLocaleDateString();
    }).reverse();

    const completedCounts = last7Days.map(date => {
        return tasks.filter(task => 
            task.status === 'done' && 
            new Date(task.dueDate).toLocaleDateString() === date
        ).length;
    });

    return {
        labels: last7Days,
        datasets: [{
            label: 'Completed Tasks',
            data: completedCounts,
            borderColor: '#3b82f6',
            tension: 0.1
        }]
    };
}

// Local Storage Functions
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Duplicate task function
function duplicateTask(taskId) {
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    const duplicatedTask = {
        ...originalTask,
        id: Date.now().toString(),
        title: `Copy of ${originalTask.title}`,
        createdAt: new Date().toISOString(),
        notified: false
    };

    tasks.push(duplicatedTask);
    saveTasks();
    refreshTasks();
    showNotification('Task duplicated successfully', 'success');
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    document.body.dataset.theme = localStorage.getItem('theme') || 'light';
    refreshTasks();
    setInterval(checkDeadlines, 60000);
    if (!document.getElementById('analyticsDashboard').classList.contains('hidden')) {
        initializeCharts();
    }
});