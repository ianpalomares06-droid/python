let notifiedEvents = JSON.parse(localStorage.getItem('notifiedEvents')) || {};
let events = JSON.parse(localStorage.getItem('events')) || [];
let weekOffset = 0;

function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('notifiedEvents', JSON.stringify(notifiedEvents));
}

function to12Hour(time) {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
}

function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = `Current Time: ${now.toLocaleString()}`;
}

// ----------------- Real-time Current Time Indicator -----------------
function updateCurrentTimeIndicator() {
    const table = document.querySelector('.schedule-table');
    if(!table) return;

    const oldIndicator = document.querySelector('.current-time-indicator');
    if(oldIndicator) oldIndicator.remove();

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours*60 + minutes;

    const rowHeight = 50;
    const rowIndex = Math.floor(totalMinutes / 30);
    const offset = totalMinutes % 30;

    const tableRows = table.rows;
    if(rowIndex + 1 >= tableRows.length) return;

    const row = tableRows[rowIndex + 1];
    const indicator = document.createElement('div');
    indicator.className = 'current-time-indicator';
    indicator.style.position = 'absolute';
    indicator.style.height = '2px';
    indicator.style.background = 'red';
    indicator.style.width = '100%';
    indicator.style.top = (offset/30*rowHeight)+'px';
    indicator.style.left = '0';

    row.style.position = 'relative';
    row.appendChild(indicator);
}
// -------------------------------------------------------------------

function checkNotifications() {
    const now = new Date();
    events.forEach(event => {
        const eventStart = new Date(event.date + 'T' + event.start);
        const diff = eventStart - now;
        const eventId = `${event.title}-${event.date}-${event.start}`;
        if (diff <= 30000 && diff >= -30000 && !notifiedEvents[eventId]) {
            if (Notification.permission === 'granted') {
                new Notification(`Upcoming Event: ${event.title}`, {
                    body: `Starts at ${event.start} on ${event.date}`
                });
                if (navigator.vibrate) navigator.vibrate([300,200,300]);
            }
            const sound = document.getElementById('notifySound');
            if (sound) { sound.currentTime = 0; sound.play().catch(()=>{}); }
            notifiedEvents[eventId] = true;
            localStorage.setItem('notifiedEvents', JSON.stringify(notifiedEvents));
        }
    });
}

function renderSchedule() {
    const scheduleDiv = document.getElementById('weeklySchedule');
    scheduleDiv.innerHTML = '';

    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset*7);

    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    const table = document.createElement('table');
    table.className='schedule-table';

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

    // Create one row per event
    events.forEach(event => {
        const eventDate = new Date(event.date);
        if(eventDate >= startOfWeek && eventDate < new Date(startOfWeek.getTime() + 7*24*60*60*1000)){
            const row = document.createElement('tr');

            // Time column shows start-end
            const timeCell = document.createElement('td');
            timeCell.className = 'time-cell';
            timeCell.textContent = `${event.start}-${event.end}`;
            row.appendChild(timeCell);

            // Add empty cells for 7 days
            for(let i=0; i<7; i++){
                const cell = document.createElement('td');
                cell.className = 'schedule-cell';
                row.appendChild(cell);
            }

            // Place event in the correct day column
            const dayIndex = Math.floor((eventDate - startOfWeek)/(24*60*60*1000));
            const eventCell = row.cells[dayIndex + 1]; // skip time column
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            eventDiv.innerHTML = `<strong>${event.title}</strong><br>${event.start}-${event.end}
                <button onclick="deleteEvent('${event.title}','${event.date}','${event.start}')">×</button>`;
            eventCell.appendChild(eventDiv);

            table.appendChild(row);
        }
    });

    scheduleDiv.appendChild(table);
}


function deleteEvent(title,date,start){
    const index=events.findIndex(e=>e.title===title && e.date===date && e.start===start);
    if(index!==-1){
        events.splice(index,1);
        saveEvents();
        renderSchedule();
    }
}

// Event form
document.getElementById('eventform').addEventListener('submit', function(e){
    e.preventDefault();
    const title=document.getElementById('eventTitle').value;
    const date=document.getElementById('eventDate').value;
    const start=document.getElementById('startTime').value;
    const end=document.getElementById('endTime').value;
    if(start>=end){ alert('End time must be after start time'); return; }

    const newEvent={title,date,start,end};
    events.push(newEvent);
    saveEvents();
    renderSchedule();
    document.getElementById('eventform').reset();
    document.getElementById('eventFormContainer').style.display='none';
});

if('Notification' in window) Notification.requestPermission();
updateTime();
setInterval(updateTime,60000);
setInterval(checkNotifications,60000);

document.getElementById('prevWeek').addEventListener('click',()=>{ weekOffset--; renderSchedule(); });
document.getElementById('nextWeek').addEventListener('click',()=>{ weekOffset++; renderSchedule(); });
document.getElementById('currentWeek').addEventListener('click',()=>{ weekOffset=0; renderSchedule(); });
document.getElementById('addEventBtn').addEventListener('click',()=>{
    const formContainer=document.getElementById('eventFormContainer');
    if(formContainer.style.display==='none'||formContainer.style.display===''){
        const today=new Date().toISOString().split('T')[0];
        document.getElementById('eventDate').value=today;
    }
    formContainer.style.display=(formContainer.style.display==='none'?'block':'none');
});
renderSchedule();
