let events = JSON.parse(localStorage.getItem('events')) || [];
let weekOffset = 0;

function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
}

function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = `Current Time: ${now.toLocaleString()}`;
}

function checkNotifications() {
    const now = new Date();
    events.forEach(event => {
        const eventStart = new Date(event.date + 'T' + event.start);
        const diff = eventStart - now;
        if (diff > 0 && diff <= 10 * 60 * 1000) { // 10 minutes before
            if (Notification.permission === 'granted') {
                new Notification(`Upcoming Event: ${event.title}`, {
                    body: `Starts at ${event.start} on ${event.date}`
                });
            }
        }
    });
}

function renderSchedule() {
    const scheduleDiv = document.getElementById('weeklySchedule');
    scheduleDiv.innerHTML = '';
    
    const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
    
    const table = document.createElement('table');
    table.className = 'schedule-table';
    
    // Get the start of the week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7); // Monday + offset
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Header row
    const headerRow = document.createElement('tr');
    const timeHeader = document.createElement('th');
    timeHeader.textContent = 'Time';
    headerRow.appendChild(timeHeader);
    days.forEach((day, index) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + index);
        const dateStr = dayDate.toISOString().split('T')[0];
        
        const th = document.createElement('th');
        th.textContent = `${day}\n${dateStr}`;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Time rows
    timeSlots.forEach((time, slotIndex) => {
        const row = document.createElement('tr');
        
        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.textContent = time;
        row.appendChild(timeCell);
        
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const cell = document.createElement('td');
            cell.className = 'schedule-cell';
            row.appendChild(cell);
        }
        
        table.appendChild(row);
    });
    
    // Events
    events.forEach(event => {
        const eventDate = new Date(event.date);
        if (eventDate >= startOfWeek && eventDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            const dayIndex = Math.floor((eventDate - startOfWeek) / (24 * 60 * 60 * 1000));
            
            const startSlotIndex = timeSlots.indexOf(event.start);
            const endSlotIndex = timeSlots.indexOf(event.end);
            
            if (startSlotIndex !== -1 && endSlotIndex !== -1) {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'event';
                
                // Check for conflicts
                const hasConflict = events.some(other => {
                    if (event === other || other.date !== event.date) return false;
                    const eventStart = new Date(event.date + 'T' + event.start);
                    const eventEnd = new Date(event.date + 'T' + event.end);
                    const otherStart = new Date(other.date + 'T' + other.start);
                    const otherEnd = new Date(other.date + 'T' + other.end);
                    return eventStart < otherEnd && eventEnd > otherStart;
                });
                
                if (hasConflict) {
                    eventDiv.classList.add('conflict');
                }
                
                eventDiv.innerHTML = `
                    <strong>${event.title}</strong><br>
                    ${event.start} - ${event.end}
                    ${hasConflict ? '<br><em style="color: red;">Conflict!</em>' : ''}
                    <button onclick="deleteEvent('${event.title}', '${event.date}', '${event.start}')">Delete</button>
                `;
                
                // Find the cell for start time
                const startRow = table.rows[startSlotIndex + 1]; // +1 for header
                const startCell = startRow.cells[dayIndex + 1]; // +1 for time column
                startCell.appendChild(eventDiv);
                
                // Span multiple rows if needed
                const rowSpan = endSlotIndex - startSlotIndex;
                if (rowSpan > 1) {
                    startCell.rowSpan = rowSpan;
                    // Remove extra cells from subsequent rows
                    for (let i = 1; i < rowSpan; i++) {
                        const spannedRow = table.rows[startSlotIndex + 1 + i];
                        spannedRow.deleteCell(dayIndex + 1);
                    }
                }
            }
        }
    });
    
    scheduleDiv.appendChild(table);
}

function deleteEvent(title, date, start) {
    const index = events.findIndex(event => event.title === title && event.date === date && event.start === start);
    if (index !== -1) {
        events.splice(index, 1);
        saveEvents();
        renderSchedule();
    }
}

document.getElementById('eventform').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;
    
    // Validate times
    if (start >= end) {
        alert('End time must be after start time.');
        return;
    }
    
    const newEvent = { title, date, start, end };
    
    // Check for conflicts
    const hasConflict = events.some(other => {
        if (newEvent.date !== other.date) return false;
        const newStart = new Date(newEvent.date + 'T' + newEvent.start);
        const newEnd = new Date(newEvent.date + 'T' + newEvent.end);
        const otherStart = new Date(other.date + 'T' + other.start);
        const otherEnd = new Date(other.date + 'T' + other.end);
        return newStart < otherEnd && newEnd > otherStart;
    });
    
    events.push(newEvent);
    saveEvents();
    renderSchedule();
    
    if (hasConflict) {
        if (Notification.permission === 'granted') {
            new Notification('Conflict Detected', {
                body: 'The new event conflicts with an existing one.'
            });
        } else {
            alert('Conflict detected! The new event overlaps with an existing one.');
        }
    }
    
    // Clear form
    document.getElementById('eventform').reset();
    
    // Hide form after adding
    document.getElementById('eventFormContainer').style.display = 'none';
});

// Initial setup
if ('Notification' in window) {
    Notification.requestPermission();
}

updateTime();
setInterval(updateTime, 1000);
setInterval(checkNotifications, 60000); // Check every minute

// Week navigation
document.getElementById('prevWeek').addEventListener('click', () => {
    weekOffset--;
    renderSchedule();
});

document.getElementById('nextWeek').addEventListener('click', () => {
    weekOffset++;
    renderSchedule();
});

document.getElementById('currentWeek').addEventListener('click', () => {
    weekOffset = 0;
    renderSchedule();
});

// Initial render
renderSchedule();

// Add event button
document.getElementById('addEventBtn').addEventListener('click', function() {
    const formContainer = document.getElementById('eventFormContainer');
    formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
});