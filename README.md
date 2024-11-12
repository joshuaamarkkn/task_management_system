Task Management System

A modern, interactive task management system built with vanilla JavaScript. Features a Kanban-style board with drag-and-drop functionality, advanced analytics, and real-time task tracking.

Features

Core Functionality
- 📋 Kanban board with drag-and-drop interface
- 📊 Real-time analytics dashboard
- 🌓 Light/dark theme toggle
- 🔔 Deadline notifications
- 🏷️ Task tagging and categorization
- 📈 Performance tracking

Task Management
- Create, edit, and delete tasks
- Drag-and-drop between status columns:
  - To Do
  - In Progress
  - Done
- Task properties include:
  - Title and description
  - Due date
  - Priority levels
  - Time estimates
  - Tags
  - Checklists

Advanced Features
- 🔍 Advanced filtering options:
  - Search by text
  - Filter by priority
  - Filter by date range
- 📈 Analytics Dashboard:
  - Task distribution chart
  - Priority breakdown
  - Completion trend analysis
- ⏰ Deadline tracking:
  - Overdue notifications
  - Upcoming deadline alerts
- 📊 Progress monitoring:
  - Completion rates
  - Task statistics
  - Performance trends

Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js for analytics
- Dragula.js for drag-and-drop
- Local Storage API

Screenshots



Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/task-management-system.git
```

2. Install dependencies (Chart.js and Dragula):
```html
<!-- Add to your HTML -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/dragula/3.7.3/dragula.min.js"></script>
```

3. Open `index.html` in your browser or use a local server.

Usage

Creating Tasks
1. Click "New Task" button
2. Fill in task details:
   - Title (required)
   - Description
   - Due date
   - Priority
   - Tags
   - Time estimate

Managing Tasks
- Drag and drop tasks between columns
- Double-click to edit
- Right-click for context menu:
  - Edit
  - Delete
  - Duplicate
  - Change status

Using Analytics
1. Click "Toggle Analytics" button
2. View:
   - Task distribution
   - Priority breakdown
   - Completion trends
3. Use insights for better task management

Code Structure

```javascript
// Core Functions
createTask()           // Create new tasks
updateTaskStatus()     // Update task status
deleteTask()           // Remove tasks
editTask()            // Modify existing tasks

// Analytics
initializeCharts()     // Set up analytics
updateCharts()        // Refresh statistics
getTaskDistribution() // Calculate task metrics

// UI Management
renderTask()          // Display task cards
updateStats()         // Update statistics
filterTasks()         // Apply filters
```

Features in Development

- [ ] Team collaboration
- [ ] Task comments
- [ ] File attachments
- [ ] Export/import data
- [ ] Email notifications
- [ ] Task dependencies
- [ ] Time tracking
- [ ] Custom board views

Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Acknowledgments

- Chart.js for visualization capabilities
- Dragula.js for drag-and-drop functionality
- Modern JavaScript features for state management
- Local Storage API for data persistence

Authors

joshuaamarkkn
itsmejoshua10@gmail.com

Project Status

This project is actively maintained and open for contributions.