// Apex Density Planner - Application Script
// Adapted for Manipal Semester Tracking (System Date: 2026-07-13)

// ----------------------------------------------------
// 1. CONFIGURATION & CONSTANTS
// ----------------------------------------------------

const SYSTEM_TODAY = new Date();

const WEEKDAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

// Constrained Timeline: July 2026 to December 2027
const TIMELINE = [];
for (let y = 2026; y <= 2027; y++) {
  const startMonth = (y === 2026) ? 6 : 0; // July (6) for 2026
  const endMonth = (y === 2027) ? 11 : 11; // December (11) for 2027
  for (let m = startMonth; m <= endMonth; m++) {
    TIMELINE.push({ year: y, month: m });
  }
}

// ----------------------------------------------------
// 2. STATE MANAGEMENT & INITIALIZATION
// ----------------------------------------------------

let state = {
  selectedYear: 2026,
  selectedMonth: 6, // July
  habits: [],
  subjects: [],
  backlog: [],
  academicLinks: [],
  midsemDate: "",
  endsemDate: "",
  academicImages: [],
  trash: [],
  notepadPages: {
    pages: [],
    activePageId: ""
  }
};

// Seed Actual Semester Data (No Mock/Fake Placeholders)
const DEFAULT_HABITS = [
  { id: "h1", title: "Review Lecture Slides", schedule: "daily", customDays: [0, 1, 2, 3, 4, 5, 6], completions: {} },
  { id: "h2", title: "Practice Lab Exercises", schedule: "custom", customDays: [1, 2, 3, 4, 5], completions: {} },
  { id: "h3", title: "Study Machine Learning Labs", schedule: "custom", customDays: [1, 3, 5], completions: {} },
  { id: "h4", title: "Compiler Design Practice", schedule: "custom", customDays: [2, 4, 6], completions: {} }
];

const DEFAULT_SUBJECTS = [
  { id: "s1", title: "MGMT : ESSENTIALS OF MANAGEMENT", midsemPrep: 45, endsemPrep: 15, status: "in-progress", dueDate: "2026-09-10" },
  { id: "s2", title: "ALGO : DESIGN & ANALYSIS OF ALGORITHMS", midsemPrep: 60, endsemPrep: 25, status: "in-progress", dueDate: "2026-09-12" },
  { id: "s3", title: "CLD : CLOUD COMPUTING SYSTEM ARCHITECTURE", midsemPrep: 70, endsemPrep: 30, status: "in-progress", dueDate: "2026-09-13" },
  { id: "s4", title: "COMP : LANGUAGE PROCESSORS & COMPILER DESIGN", midsemPrep: 50, endsemPrep: 10, status: "in-progress", dueDate: "2026-09-14" },
  { id: "s5", title: "ARCH : PARALLEL COMPUTER ARCHITECTURE", midsemPrep: 30, endsemPrep: 5, status: "todo", dueDate: "2026-09-15" }
];

const DEFAULT_BACKLOG = [
  { id: "b1", title: "Personal Website Redesign", category: "Portfolio", status: "in-progress", progress: 65 },
  { id: "b2", title: "Core Server Development", category: "R&D", status: "not-started", progress: 0 }
];

const DEFAULT_LINKS = [
  { name: "STUDENT PORTAL (LMS)", url: "https://portal.office.com" },
  { name: "GRADES & RESULTS SHEET", url: "https://grades.university.edu" }
];

const DEFAULT_NOTES = {
  pages: [
    {
      id: "p1",
      title: "Overview",
      content: `// SEMESTER OVERVIEW\n// Track all study goals here.\n\n- Targets for Midsems:\n  * Focus on Machine Learning regression algorithms.\n  * Complete cloud computing AWS serverless modules.\n  * Memorize Essentials of Management definition frameworks.\n`
    },
    {
      id: "p2",
      title: "CSE 3125",
      content: `// CSE 3125 : MACHINE LEARNING NOTES\n\n- Key Topics:\n  * Supervised Learning: Linear/Logistic Regression, SVMs.\n  * Unsupervised Learning: K-Means, PCA.\n  * Evaluate performance using ROC/AUC and F1-Scores.\n`
    },
    {
      id: "p3",
      title: "CSE 3128",
      content: `// CSE 3128 : COMPILER DESIGN NOTES\n\n- Midsem focus:\n  * Regular Expressions to NFA/DFA mapping.\n  * Lexical analysis using Lex/Flex.\n  * Top-down LL(1) and bottom-up LR(1) parsing techniques.\n`
    }
  ],
  activePageId: "p1"
};

function loadState() {
  const local = localStorage.getItem('apex_manipal_state');
  if (local) {
    try {
      state = JSON.parse(local);
      ensureStateKeys();
      validateSelectedMonthRange();
    } catch (e) {
      console.error("Error reading localStorage, loading defaults.", e);
      loadDefaults();
    }
  } else {
    loadDefaults();
  }
}

async function loadStateFromServer() {
  try {
    const res = await fetch('/api/load');
    if (res.ok) {
      const data = await res.json();
      if (data && data.habits) {
        state = data;
        ensureStateKeys();
        validateSelectedMonthRange();
        renderAll();
        return;
      }
    }
  } catch (e) {
    console.warn("Could not load state from local server file, using localStorage cache.", e);
  }
}

function ensureStateKeys() {
  if (!state.habits) state.habits = [];
  if (!state.subjects) state.subjects = [];
  if (!state.backlog) state.backlog = [];
  if (!state.academicLinks) state.academicLinks = [];
  if (state.midsemDate === undefined) state.midsemDate = "";
  if (state.endsemDate === undefined) state.endsemDate = "";
  if (!state.academicImages) state.academicImages = [];
  if (!state.trash) state.trash = [];
  if (!state.notepadPages) {
    state.notepadPages = DEFAULT_NOTES;
  }
}

function validateSelectedMonthRange() {
  const isInTimeline = TIMELINE.some(t => t.year === state.selectedYear && t.month === state.selectedMonth);
  if (!isInTimeline) {
    state.selectedYear = 2026;
    state.selectedMonth = 6;
  }
}

function loadDefaults() {
  state.habits = DEFAULT_HABITS;
  state.subjects = DEFAULT_SUBJECTS;
  state.backlog = DEFAULT_BACKLOG;
  state.academicLinks = DEFAULT_LINKS;
  state.midsemDate = "";
  state.endsemDate = "";
  state.academicImages = [];
  state.trash = [];
  state.notepadPages = DEFAULT_NOTES;
  state.selectedYear = SYSTEM_TODAY.getFullYear();
  state.selectedMonth = SYSTEM_TODAY.getMonth();
  validateSelectedMonthRange();
  saveState();
}

function saveState() {
  const jsonStr = JSON.stringify(state);
  localStorage.setItem('apex_manipal_state', jsonStr);

  // Background backup to local data.json via server API
  fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: jsonStr
  }).catch(e => console.warn("Failed to backup state to local data.json server file.", e));
}

// ----------------------------------------------------
// 3. CALENDAR CALCULATIONS & SWIPE NAVIGATION
// ----------------------------------------------------

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getDayOfWeek(year, month, day) {
  return new Date(year, month, day).getDay();
}

function isSystemToday(year, month, day) {
  return year === SYSTEM_TODAY.getFullYear() &&
         month === SYSTEM_TODAY.getMonth() &&
         day === SYSTEM_TODAY.getDate();
}

function isPast(year, month, day) {
  const checkDate = new Date(year, month, day);
  const todayDate = new Date(SYSTEM_TODAY.getFullYear(), SYSTEM_TODAY.getMonth(), SYSTEM_TODAY.getDate());
  return checkDate < todayDate;
}

function formatDateKey(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

// Navigation between months in constrained timeline
function navigateTimeline(direction) {
  const currentIndex = TIMELINE.findIndex(t => t.year === state.selectedYear && t.month === state.selectedMonth);
  let nextIndex = currentIndex + direction;
  
  if (nextIndex >= 0 && nextIndex < TIMELINE.length) {
    state.selectedYear = TIMELINE[nextIndex].year;
    state.selectedMonth = TIMELINE[nextIndex].month;
    saveState();
    renderAll();
  }
}

// Swipe Gesture Detection
let touchStartX = 0;
let touchEndX = 0;

function setupSwipeGestures() {
  const container = document.getElementById('habit-scroll-container');
  if (!container) return;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
  }, { passive: true });
}

function handleSwipe() {
  const swipeThreshold = 60; // minimum swipe distance in pixels
  const diffX = touchEndX - touchStartX;

  if (diffX < -swipeThreshold) {
    // Swipe Left -> Go forward (Next Month)
    navigateTimeline(1);
  } else if (diffX > swipeThreshold) {
    // Swipe Right -> Go backward (Previous Month)
    navigateTimeline(-1);
  }
}

// ----------------------------------------------------
// 4. MULTI-TAB NOTEPAD MANAGEMENT
// ----------------------------------------------------

function renderNotepad() {
  const tabsContainer = document.getElementById('notepad-tabs-container');
  const textarea = document.getElementById('notepad-textarea');
  tabsContainer.innerHTML = '';

  const pages = state.notepadPages.pages;
  const activeId = state.notepadPages.activePageId;

  // Find active note page
  let activePage = pages.find(p => p.id === activeId);
  if (!activePage && pages.length > 0) {
    activePage = pages[0];
    state.notepadPages.activePageId = activePage.id;
  }

  pages.forEach(page => {
    const tabDiv = document.createElement('div');
    tabDiv.className = `notepad-tab ${page.id === activeId ? 'active' : ''}`;
    
    // Tab title text
    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-title-text';
    titleSpan.textContent = page.title;
    tabDiv.appendChild(titleSpan);

    // Edit button (✎) for active tab to rename it cleanly (bypasses dblclick race conditions)
    if (page.id === activeId) {
      const editBtn = document.createElement('button');
      editBtn.className = 'tab-edit-btn';
      editBtn.innerHTML = '✎';
      editBtn.title = "Rename page";
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent switching tab
        const newName = prompt("Rename note page:", page.title);
        if (newName && newName.trim()) {
          page.title = newName.trim();
          saveState();
          renderNotepad();
        }
      });
      tabDiv.appendChild(editBtn);
    }

    // Close button (only show if there is more than 1 tab)
    if (pages.length > 1) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close-btn';
      closeBtn.innerHTML = '✕';
      closeBtn.title = "Delete page";
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent selecting the deleted tab
        state.trash.push({
          id: "t_" + Date.now(),
          type: 'note',
          name: page.title,
          data: page,
          deletedAt: Date.now()
        });
        state.notepadPages.pages = pages.filter(p => p.id !== page.id);
        if (state.notepadPages.activePageId === page.id) {
          state.notepadPages.activePageId = state.notepadPages.pages[0].id;
        }
        saveState();
        renderNotepad();
        renderTrashBadge();
      });
      tabDiv.appendChild(closeBtn);
    }

    // Switch tab on click
    tabDiv.addEventListener('click', () => {
      state.notepadPages.activePageId = page.id;
      saveState();
      renderNotepad();
    });

    tabsContainer.appendChild(tabDiv);
  });

  // Display text content
  if (activePage) {
    textarea.value = activePage.content;
    textarea.disabled = false;
  } else {
    textarea.value = '';
    textarea.disabled = true;
  }
}

// ----------------------------------------------------
// 5. GRAPHICS & ANALYTICS DRAWING (Standard SVG)
// ----------------------------------------------------

function drawCharts() {
  drawAcademicProgressChart();
  drawHabitHistoryChart();
}

// Left Chart: Midsem & Endsem Progress bar graph
function drawAcademicProgressChart() {
  const svg = document.getElementById('academic-chart');
  svg.innerHTML = '';
  
  if (state.subjects.length === 0) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'var(--text-muted)');
    text.setAttribute('font-family', 'var(--font-mono)');
    text.setAttribute('font-size', '10px');
    text.textContent = 'NO SUBJECTS DETECTED FOR PLOTTING';
    svg.appendChild(text);
    return;
  }

  // Get container width
  const rect = svg.getBoundingClientRect();
  const width = rect.width || 450;
  const height = rect.height || 140;

  const leftMargin = 95;
  const rightMargin = 15;
  const chartWidth = width - leftMargin - rightMargin;
  const yPadding = 12;
  const barSpacing = (height - (yPadding * 2)) / state.subjects.length;

  // Draw Gridlines (25%, 50%, 75%, 100%)
  const percentages = [25, 50, 75, 100];
  percentages.forEach(p => {
    const x = leftMargin + (chartWidth * (p / 100));
    
    // Gridline
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x));
    line.setAttribute('y1', String(yPadding));
    line.setAttribute('x2', String(x));
    line.setAttribute('y2', String(height - yPadding));
    line.setAttribute('stroke', '#151515');
    line.setAttribute('stroke-dasharray', '2,2');
    svg.appendChild(line);

    // Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(height - 2));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'var(--text-muted)');
    text.setAttribute('font-family', 'var(--font-mono)');
    text.setAttribute('font-size', '8px');
    text.textContent = `${p}%`;
    svg.appendChild(text);
  });

  // Plot subject rows
  state.subjects.forEach((subject, idx) => {
    const yCenter = yPadding + (idx * barSpacing) + (barSpacing / 2);
    
    // Subject Code Label (first 8 chars e.g. "CSE 3125")
    const labelText = subject.title.split(':')[0].trim();
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(leftMargin - 8));
    text.setAttribute('y', String(yCenter + 3));
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('fill', 'var(--text-primary)');
    text.setAttribute('font-family', 'var(--font-mono)');
    text.setAttribute('font-size', '9px');
    text.textContent = labelText;
    svg.appendChild(text);

    // Bar dimensions
    const barHeight = 4;
    const midWidth = chartWidth * (subject.midsemPrep / 100);
    const endWidth = chartWidth * (subject.endsemPrep / 100);

    // 1. Midsem Bar (Cyan)
    const midBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    midBar.setAttribute('x', String(leftMargin));
    midBar.setAttribute('y', String(yCenter - barHeight - 1));
    midBar.setAttribute('width', String(Math.max(midWidth, 1)));
    midBar.setAttribute('height', String(barHeight));
    midBar.setAttribute('fill', 'var(--accent-cyan)');
    midBar.setAttribute('opacity', '0.85');
    svg.appendChild(midBar);

    // 2. Endsem Bar (Blue)
    const endBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    endBar.setAttribute('x', String(leftMargin));
    endBar.setAttribute('y', String(yCenter + 1));
    endBar.setAttribute('width', String(Math.max(endWidth, 1)));
    endBar.setAttribute('height', String(barHeight));
    endBar.setAttribute('fill', 'var(--accent-blue)');
    endBar.setAttribute('opacity', '0.85');
    svg.appendChild(endBar);

    // Prep text label removed as requested
  });
}

// Right Chart: Line graph representing current month's completions
function drawHabitHistoryChart() {
  const svg = document.getElementById('habits-chart');
  svg.innerHTML = '';

  const rect = svg.getBoundingClientRect();
  const width = rect.width || 450;
  const height = rect.height || 140;

  const daysInMonth = getDaysInMonth(state.selectedYear, state.selectedMonth);

  const leftMargin = 30;
  const rightMargin = 15;
  const topMargin = 15;
  const bottomMargin = 18;

  const chartWidth = width - leftMargin - rightMargin;
  const chartHeight = height - topMargin - bottomMargin;

  // Gridlines (Y-axis: 0%, 50%, 100%)
  const yLevels = [0, 50, 100];
  yLevels.forEach(lvl => {
    const y = topMargin + chartHeight * (1 - (lvl / 100));
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(leftMargin));
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(width - rightMargin));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', '#121212');
    svg.appendChild(line);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(leftMargin - 6));
    text.setAttribute('y', String(y + 3));
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('fill', 'var(--text-muted)');
    text.setAttribute('font-family', 'var(--font-mono)');
    text.setAttribute('font-size', '8px');
    text.textContent = `${lvl}%`;
    svg.appendChild(text);
  });

  // Compile daily averages
  const points = [];
  const maxDayToCheck = (state.selectedYear === SYSTEM_TODAY.getFullYear() && state.selectedMonth === SYSTEM_TODAY.getMonth())
    ? SYSTEM_TODAY.getDate()
    : daysInMonth;

  for (let d = 1; d <= daysInMonth; d++) {
    const x = leftMargin + ((d - 1) / (daysInMonth - 1)) * chartWidth;
    
    // Calculate rate
    let scheduledCount = 0;
    let completedCount = 0;
    
    state.habits.forEach(habit => {
      const dayOfWeek = getDayOfWeek(state.selectedYear, state.selectedMonth, d);
      const isScheduled = habit.schedule === 'daily' || habit.customDays.includes(dayOfWeek);
      if (isScheduled) {
        scheduledCount++;
        const dateKey = formatDateKey(state.selectedYear, state.selectedMonth, d);
        if (habit.completions[dateKey]) completedCount++;
      }
    });

    const completionRate = scheduledCount > 0 ? (completedCount / scheduledCount) : 0;
    const y = topMargin + chartHeight * (1 - completionRate);
    
    // Only plot points up to the current day for current month
    if (d <= maxDayToCheck) {
      points.push({ d, x, y, rate: completionRate });
    }
  }

  // Draw Line path
  if (points.length > 1) {
    let dVal = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      dVal += ` L ${points[i].x} ${points[i].y}`;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', dVal);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--accent-cyan)');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('filter', 'drop-shadow(0 0 3px rgba(0, 229, 255, 0.4))');
    svg.appendChild(path);
  }

  // Plot node circles for present points
  points.forEach(pt => {
    // Only show dots on specific key days or today to keep high-density view uncluttered
    const isToday = isSystemToday(state.selectedYear, state.selectedMonth, pt.d);
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(pt.x));
    circle.setAttribute('cy', String(pt.y));
    circle.setAttribute('r', isToday ? '3' : '1.5');
    circle.setAttribute('fill', isToday ? 'var(--accent-cyan)' : 'var(--accent-green)');
    
    if (isToday) {
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '0.5');
    }
    
    // Simple SVG tooltip
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `Day ${pt.d}: ${(pt.rate * 100).toFixed(0)}% completion`;
    circle.appendChild(title);

    svg.appendChild(circle);
  });

  // X Axis Day labels (1, 10, 20, 30 etc.)
  const labelDays = [1, 10, 20, daysInMonth];
  labelDays.forEach(d => {
    const x = leftMargin + ((d - 1) / (daysInMonth - 1)) * chartWidth;
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(height - 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'var(--text-muted)');
    text.setAttribute('font-family', 'var(--font-mono)');
    text.setAttribute('font-size', '8px');
    text.textContent = String(d).padStart(2, '0');
    svg.appendChild(text);
  });
}

// ----------------------------------------------------
// 6. GENERAL RENDERING PIPELINE
// ----------------------------------------------------

function renderAll() {
  renderDateDisplays();
  renderMonthStrip();
  renderHabitHeader();
  renderHabits();
  renderSubjects();
  renderBacklog();
  renderLinks();
  renderNotepad();
  renderScoreboard();
  calculateGlobalCompletion();
  drawCharts();
  renderExams();
  renderImages();
  renderTrashBadge();
}

function getDaysRemaining(targetDateStr) {
  if (!targetDateStr) return null;
  const parts = targetDateStr.split('-');
  if (parts.length !== 3) return null;
  // Parts: [DD, MM, YYYY]
  const target = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  const today = new Date(SYSTEM_TODAY.getFullYear(), SYSTEM_TODAY.getMonth(), SYSTEM_TODAY.getDate());
  const diff = target - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renderExams() {
  const display = document.getElementById('exam-dates-display');
  if (!display) return;
  display.innerHTML = '';

  const mRemaining = getDaysRemaining(state.midsemDate);
  const eRemaining = getDaysRemaining(state.endsemDate);

  // Midsem row styling
  const midDiv = document.createElement('div');
  midDiv.style.display = 'flex';
  midDiv.style.justifyContent = 'space-between';
  midDiv.style.padding = '4px 6px';
  midDiv.style.border = '1px solid #1a1a1a';
  midDiv.style.backgroundColor = '#030303';
  midDiv.style.borderRadius = '2px';

  const midTitle = document.createElement('span');
  midTitle.textContent = "MIDSEMS:";
  midTitle.style.color = 'var(--text-secondary)';

  const midVal = document.createElement('span');
  if (state.midsemDate) {
    if (mRemaining > 0) {
      midVal.innerHTML = `<span class="cyan-text">${state.midsemDate}</span> (In ${mRemaining}d)`;
    } else if (mRemaining === 0) {
      midVal.innerHTML = `<span class="cyan-text" style="font-weight: 700;">TODAY!</span>`;
    } else {
      midVal.innerHTML = `<span class="muted-text">Finished</span>`;
    }
  } else {
    midVal.textContent = "NOT SET";
    midVal.className = "muted-text";
  }
  midDiv.appendChild(midTitle);
  midDiv.appendChild(midVal);
  display.appendChild(midDiv);

  // Endsem row styling
  const endDiv = document.createElement('div');
  endDiv.style.display = 'flex';
  endDiv.style.justifyContent = 'space-between';
  endDiv.style.padding = '4px 6px';
  endDiv.style.border = '1px solid #1a1a1a';
  endDiv.style.backgroundColor = '#030303';
  endDiv.style.borderRadius = '2px';

  const endTitle = document.createElement('span');
  endTitle.textContent = "ENDSEMS:";
  endTitle.style.color = 'var(--text-secondary)';

  const endVal = document.createElement('span');
  if (state.endsemDate) {
    if (eRemaining > 0) {
      endVal.innerHTML = `<span class="blue-text">${state.endsemDate}</span> (In ${eRemaining}d)`;
    } else if (eRemaining === 0) {
      endVal.innerHTML = `<span class="blue-text" style="font-weight: 700;">TODAY!</span>`;
    } else {
      endVal.innerHTML = `<span class="muted-text">Finished</span>`;
    }
  } else {
    endVal.textContent = "NOT SET";
    endVal.className = "muted-text";
  }
  endDiv.appendChild(endTitle);
  endDiv.appendChild(endVal);
  display.appendChild(endDiv);

  // Stage message indicator
  const stageDiv = document.createElement('div');
  stageDiv.style.fontSize = '9px';
  stageDiv.style.color = 'var(--text-muted)';
  stageDiv.style.marginTop = '4px';
  stageDiv.style.textAlign = 'center';
  stageDiv.style.fontFamily = 'var(--font-mono)';

  if (state.midsemDate && mRemaining >= 0) {
    stageDiv.innerHTML = `STAGE: <span class="cyan-text" style="font-weight: 700;">MIDSEM PREP</span>`;
  } else if (state.endsemDate && eRemaining >= 0) {
    stageDiv.innerHTML = `STAGE: <span class="blue-text" style="font-weight: 700;">ENDSEM PREP</span>`;
  } else if (state.midsemDate || state.endsemDate) {
    stageDiv.innerHTML = `<span class="green-text" style="font-weight: 700;">ALL EXAMS COMPLETED!</span>`;
  } else {
    stageDiv.textContent = "Set dates to start countdowns.";
  }
  display.appendChild(stageDiv);
}

function renderImages() {
  const container = document.getElementById('timetable-images-container');
  if (!container) return;
  container.innerHTML = '';

  if (state.academicImages.length === 0) {
    container.innerHTML = `<span class="muted-text" style="font-size: 10px; font-style: italic; font-family: var(--font-mono);">No images uploaded.</span>`;
    return;
  }

  state.academicImages.forEach(img => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '42px';
    wrapper.style.height = '42px';
    wrapper.style.border = '1px solid var(--border-color)';
    wrapper.style.cursor = 'pointer';
    wrapper.style.flexShrink = '0';
    wrapper.style.borderRadius = '2px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.backgroundColor = '#000';

    const thumbnail = document.createElement('img');
    thumbnail.src = img.data;
    thumbnail.style.width = '100%';
    thumbnail.style.height = '100%';
    thumbnail.style.objectFit = 'cover';
    
    // Clicking thumbnail displays fullscreen view
    thumbnail.addEventListener('click', () => {
      const modal = document.getElementById('image-overlay-modal');
      const fullscreenImg = document.getElementById('fullscreen-image-view');
      fullscreenImg.src = img.data;
      modal.classList.remove('hidden');
    });
    wrapper.appendChild(thumbnail);

    // Delete thumbnail uploader
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '✕';
    delBtn.style.position = 'absolute';
    delBtn.style.top = '0';
    delBtn.style.right = '0';
    delBtn.style.width = '12px';
    delBtn.style.height = '12px';
    delBtn.style.background = 'rgba(0, 0, 0, 0.85)';
    delBtn.style.color = '#ff3333';
    delBtn.style.border = 'none';
    delBtn.style.fontSize = '8px';
    delBtn.style.fontWeight = 'bold';
    delBtn.style.cursor = 'pointer';
    delBtn.style.display = 'flex';
    delBtn.style.alignItems = 'center';
    delBtn.style.justifyContent = 'center';
    
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.trash.push({
        id: "t_" + Date.now(),
        type: 'image',
        name: img.name || 'timetable_image.png',
        data: img,
        deletedAt: Date.now()
      });
      state.academicImages = state.academicImages.filter(i => i.id !== img.id);
      saveState();
      renderImages();
      renderTrashBadge();
    });
    wrapper.appendChild(delBtn);
    container.appendChild(wrapper);
  });
}

function renderTrashBadge() {
  const badge = document.getElementById('trash-count');
  if (badge) badge.textContent = state.trash.length;
}

function renderTrash() {
  const container = document.getElementById('trash-list-container');
  if (!container) return;
  container.innerHTML = '';

  if (state.trash.length === 0) {
    container.innerHTML = `<span class="muted-text" style="font-style: italic; text-align: center; padding: 20px; font-family: var(--font-mono);">Recycle Bin is empty.</span>`;
    return;
  }

  state.trash.forEach(item => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.padding = '6px 8px';
    row.style.borderBottom = '1px solid #1a1a1a';
    row.style.backgroundColor = '#050505';
    row.style.borderRadius = '2px';
    row.style.marginBottom = '4px';

    const label = document.createElement('div');
    const timeStr = new Date(item.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    label.innerHTML = `[${item.type.toUpperCase()}] <span style="color: #eee; font-weight: 500;">${item.name}</span> <span style="font-size: 8px; color: var(--text-muted); margin-left: 6px;">(${timeStr})</span>`;

    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'action-btn-small';
    restoreBtn.textContent = 'RESTORE';
    restoreBtn.style.borderColor = 'var(--accent-green)';
    restoreBtn.style.color = 'var(--accent-green)';
    
    restoreBtn.addEventListener('click', () => {
      if (item.type === 'habit') {
        state.habits.push(item.data);
      } else if (item.type === 'subject') {
        state.subjects.push(item.data);
      } else if (item.type === 'project') {
        state.backlog.push(item.data);
      } else if (item.type === 'note') {
        state.notepadPages.pages.push(item.data);
      } else if (item.type === 'image') {
        state.academicImages.push(item.data);
      }

      state.trash = state.trash.filter(t => t.id !== item.id);
      saveState();
      renderAll();
      renderTrash();
    });

    row.appendChild(label);
    row.appendChild(restoreBtn);
    container.appendChild(row);
  });
}

function renderDateDisplays() {
  const monthSelect = document.getElementById('month-select');
  const yearSelect = document.getElementById('year-select');
  
  monthSelect.innerHTML = '';
  MONTHS_FULL.forEach((m, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = m;
    if (idx === state.selectedMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });

  yearSelect.innerHTML = '';
  [2026, 2027].forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === state.selectedYear) opt.selected = true;
    yearSelect.appendChild(opt);
  });

  // Header display
  const sysDateDisplay = document.getElementById('current-date-display');
  const yyyy = SYSTEM_TODAY.getFullYear();
  const mm = String(SYSTEM_TODAY.getMonth() + 1).padStart(2, '0');
  const dd = String(SYSTEM_TODAY.getDate()).padStart(2, '0');
  sysDateDisplay.textContent = `${dd}-${mm}-${yyyy}`;

  // Today shortcut badge next to the TODAY button
  const todayShortcut = document.getElementById('today-shortcut-display');
  if (todayShortcut) {
    const dName = WEEKDAYS_SHORT[SYSTEM_TODAY.getDay()];
    todayShortcut.textContent = `${dd} ${dName}`;
  }
}

function renderMonthStrip() {
  const container = document.getElementById('month-strip');
  container.innerHTML = '';

  TIMELINE.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'month-tab';
    if (item.year === state.selectedYear && item.month === state.selectedMonth) {
      btn.className += ' active';
    }
    const label = `${MONTHS_SHORT[item.month]} '${String(item.year).substring(2)}`;
    btn.textContent = label;

    btn.addEventListener('click', () => {
      state.selectedYear = item.year;
      state.selectedMonth = item.month;
      saveState();
      renderAll();
    });

    container.appendChild(btn);
  });
}

function renderHabitHeader() {
  const headerRow = document.getElementById('habit-header-row');
  headerRow.innerHTML = '';

  // Header 1: Title
  const thTitle = document.createElement('th');
  thTitle.className = 'habit-title-col';
  thTitle.textContent = 'HABIT DESCRIPTION';
  headerRow.appendChild(thTitle);

  // Header 2: Schedule
  const thSched = document.createElement('th');
  thSched.className = 'habit-sched-col';
  thSched.textContent = 'SCHEDULE';
  headerRow.appendChild(thSched);

  const daysInMonth = getDaysInMonth(state.selectedYear, state.selectedMonth);

  // Days 1 to 31 mapping
  for (let d = 1; d <= 31; d++) {
    const thDay = document.createElement('th');
    thDay.className = 'day-col';

    if (d <= daysInMonth) {
      const dayOfWeek = getDayOfWeek(state.selectedYear, state.selectedMonth, d);
      const dayName = WEEKDAYS_SHORT[dayOfWeek];
      thDay.innerHTML = `<span class="day-num">${String(d).padStart(2, '0')}</span>${dayName}`;
      if (isSystemToday(state.selectedYear, state.selectedMonth, d)) {
        thDay.classList.add('active-present-col');
      }
    } else {
      thDay.innerHTML = `<span class="day-num">${String(d).padStart(2, '0')}</span>--`;
      thDay.classList.add('blackout-state');
    }
    headerRow.appendChild(thDay);
  }

  // Delete
  const thDel = document.createElement('th');
  thDel.style.width = '30px';
  thDel.textContent = 'DEL';
  headerRow.appendChild(thDel);
}

function renderHabits() {
  const tbody = document.getElementById('habit-list-tbody');
  tbody.innerHTML = '';

  const badge = document.getElementById('habit-count-badge');
  badge.textContent = `${state.habits.length} Active`;

  if (state.habits.length === 0) {
    document.getElementById('no-habits-msg').classList.remove('hidden');
    document.getElementById('habit-table').classList.add('hidden');
    return;
  }
  document.getElementById('no-habits-msg').classList.add('hidden');
  document.getElementById('habit-table').classList.remove('hidden');

  const daysInMonth = getDaysInMonth(state.selectedYear, state.selectedMonth);

  state.habits.forEach(habit => {
    const tr = document.createElement('tr');
    tr.className = 'habit-row';

    // Description Input
    const tdTitle = document.createElement('td');
    tdTitle.className = 'habit-title-col';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'habit-name-input';
    input.value = habit.title;
    input.addEventListener('change', (e) => {
      habit.title = e.target.value;
      saveState();
      renderScoreboard();
    });
    tdTitle.appendChild(input);
    tr.appendChild(tdTitle);

    // Schedule Trigger
    const tdSched = document.createElement('td');
    tdSched.className = 'habit-sched-col';
    const schedBtn = document.createElement('button');
    schedBtn.className = 'sched-trigger-btn';
    
    if (habit.schedule === 'daily') {
      schedBtn.innerHTML = `<span>Daily</span> <span class="arrow">▼</span>`;
    } else {
      const daysAbbr = habit.customDays.map(d => WEEKDAYS_SHORT[d][0]).join(',');
      schedBtn.innerHTML = `<span class="cyan-text" style="font-size: 8px;">Cust: ${daysAbbr}</span> <span class="arrow">▼</span>`;
    }
    schedBtn.addEventListener('click', () => openScheduleModal(habit));
    tdSched.appendChild(schedBtn);
    tr.appendChild(tdSched);

    // Checkboxes
    for (let d = 1; d <= 31; d++) {
      const tdDay = document.createElement('td');
      tdDay.className = 'day-col';

      if (d > daysInMonth) {
        tdDay.classList.add('blackout-state');
        tr.appendChild(tdDay);
        continue;
      }

      const dayOfWeek = getDayOfWeek(state.selectedYear, state.selectedMonth, d);
      const dateKey = formatDateKey(state.selectedYear, state.selectedMonth, d);
      const isScheduled = habit.schedule === 'daily' || habit.customDays.includes(dayOfWeek);

      if (!isScheduled) {
        tdDay.classList.add('blackout-state');
      } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'habit-cell-wrapper';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'habit-checkbox';
        checkbox.checked = !!habit.completions[dateKey];

        if (isSystemToday(state.selectedYear, state.selectedMonth, d)) {
          tdDay.classList.add('active-present-col', 'active-present-cell');
          checkbox.disabled = false;
        } else if (isPast(state.selectedYear, state.selectedMonth, d)) {
          tdDay.classList.add('immutable-past');
          checkbox.disabled = true;
        } else {
          checkbox.disabled = true;
        }

        checkbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            habit.completions[dateKey] = true;
          } else {
            delete habit.completions[dateKey];
          }
          saveState();
          calculateGlobalCompletion();
          renderScoreboard();
          drawCharts();
        });

        wrapper.appendChild(checkbox);
        tdDay.appendChild(wrapper);
      }

      if (isSystemToday(state.selectedYear, state.selectedMonth, d)) {
        tdDay.classList.add('active-present-col');
      }
      tr.appendChild(tdDay);
    }

    // Delete
    const tdDel = document.createElement('td');
    tdDel.style.textAlign = 'center';
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-row-btn';
    delBtn.innerHTML = '✕';
    delBtn.addEventListener('click', () => {
      state.trash.push({
        id: "t_" + Date.now(),
        type: 'habit',
        name: habit.title || 'Untitled Habit',
        data: habit,
        deletedAt: Date.now()
      });
      state.habits = state.habits.filter(h => h.id !== habit.id);
      saveState();
      renderAll();
    });
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);

    tbody.appendChild(tr);
  });
}

function renderSubjects() {
  const tbody = document.getElementById('academic-list-tbody');
  tbody.innerHTML = '';

  const badge = document.getElementById('task-count-badge');
  badge.textContent = `${state.subjects.length} Subjects`;

  if (state.subjects.length === 0) {
    document.getElementById('no-tasks-msg').classList.remove('hidden');
    document.getElementById('academic-table').classList.add('hidden');
    return;
  }
  document.getElementById('no-tasks-msg').classList.add('hidden');
  document.getElementById('academic-table').classList.remove('hidden');

  state.subjects.forEach(subject => {
    const tr = document.createElement('tr');

    // 1. Subject description
    const tdTitle = document.createElement('td');
    const inputTitle = document.createElement('input');
    inputTitle.type = 'text';
    inputTitle.className = 'cell-input';
    inputTitle.value = subject.title;
    inputTitle.addEventListener('change', (e) => {
      subject.title = e.target.value;
      saveState();
      drawCharts();
    });
    tdTitle.appendChild(inputTitle);
    tr.appendChild(tdTitle);

    // 2. Midsem Prep Slider + Datepicker & Countdown
    const tdMid = document.createElement('td');
    const midWrapper = document.createElement('div');
    midWrapper.style.display = 'flex';
    midWrapper.style.flexDirection = 'column';
    midWrapper.style.gap = '4px';

    const midContainer = document.createElement('div');
    midContainer.className = 'progress-container';
    
    const midSlider = document.createElement('input');
    midSlider.type = 'range';
    midSlider.min = '0';
    midSlider.max = '100';
    midSlider.step = '5';
    midSlider.className = 'progress-slider';
    midSlider.value = subject.midsemPrep;
    
    const midLabel = document.createElement('span');
    midLabel.className = 'progress-value-label cyan-text';
    midLabel.textContent = `${subject.midsemPrep}%`;

    midSlider.addEventListener('input', (e) => {
      subject.midsemPrep = parseInt(e.target.value, 10);
      midLabel.textContent = `${subject.midsemPrep}%`;
      saveState();
      drawCharts();
    });

    midContainer.appendChild(midSlider);
    midContainer.appendChild(midLabel);
    midWrapper.appendChild(midContainer);

    // Midsem Date & Countdown Row
    const midDateRow = document.createElement('div');
    midDateRow.style.display = 'flex';
    midDateRow.style.justifyContent = 'space-between';
    midDateRow.style.alignItems = 'center';
    midDateRow.style.gap = '4px';
    midDateRow.style.padding = '0 2px';

    const midDateContainer = document.createElement('div');
    midDateContainer.style.display = 'flex';
    midDateContainer.style.alignItems = 'center';
    midDateContainer.style.gap = '2px';

    const midDateText = document.createElement('span');
    midDateText.textContent = subject.midsemDate || 'No Date';
    midDateText.style.fontFamily = 'var(--font-mono)';
    midDateText.style.fontSize = '9px';
    midDateText.style.color = subject.midsemDate ? 'var(--text-secondary)' : 'var(--text-muted)';

    const midEditBtn = document.createElement('button');
    midEditBtn.innerHTML = '✎';
    midEditBtn.style.background = 'transparent';
    midEditBtn.style.border = 'none';
    midEditBtn.style.color = 'var(--accent-cyan)';
    midEditBtn.style.fontSize = '10px';
    midEditBtn.style.cursor = 'pointer';
    midEditBtn.style.padding = '0 2px';
    midEditBtn.style.lineHeight = '1';
    
    midEditBtn.addEventListener('click', () => {
      const val = prompt(`Enter Midsem Exam Date for ${subject.title.split(':')[0]} (DD-MM-YYYY):`, subject.midsemDate || '');
      if (val !== null) {
        const cleaned = val.trim();
        if (cleaned === '' || /^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
          subject.midsemDate = cleaned;
          saveState();
          renderAll();
        } else {
          alert("Please enter a valid date in DD-MM-YYYY format (or leave blank to clear).");
        }
      }
    });

    midDateContainer.appendChild(midDateText);
    midDateContainer.appendChild(midEditBtn);

    const midBadge = document.createElement('span');
    midBadge.style.fontFamily = 'var(--font-mono)';
    midBadge.style.fontSize = '8px';
    const mRem = getDaysRemaining(subject.midsemDate);
    if (subject.midsemDate) {
      if (mRem > 0) {
        midBadge.textContent = `In ${mRem}d`;
        midBadge.style.color = 'var(--accent-cyan)';
      } else if (mRem === 0) {
        midBadge.textContent = `TODAY`;
        midBadge.style.color = 'var(--accent-cyan)';
        midBadge.style.fontWeight = 'bold';
      } else {
        midBadge.textContent = `Passed`;
        midBadge.style.color = 'var(--text-muted)';
      }
    } else {
      midBadge.textContent = `No Date`;
      midBadge.style.color = 'var(--text-muted)';
    }

    midDateRow.appendChild(midDateContainer);
    midDateRow.appendChild(midBadge);
    midWrapper.appendChild(midDateRow);
    tdMid.appendChild(midWrapper);
    tr.appendChild(tdMid);

    // 3. Endsem Prep Slider + Datepicker & Countdown
    const tdEnd = document.createElement('td');
    const endWrapper = document.createElement('div');
    endWrapper.style.display = 'flex';
    endWrapper.style.flexDirection = 'column';
    endWrapper.style.gap = '4px';

    const endContainer = document.createElement('div');
    endContainer.className = 'progress-container';
    
    const endSlider = document.createElement('input');
    endSlider.type = 'range';
    endSlider.min = '0';
    endSlider.max = '100';
    endSlider.step = '5';
    endSlider.className = 'progress-slider endsem-slider';
    endSlider.value = subject.endsemPrep;
    
    const endLabel = document.createElement('span');
    endLabel.className = 'progress-value-label blue-text';
    endLabel.textContent = `${subject.endsemPrep}%`;

    endSlider.addEventListener('input', (e) => {
      subject.endsemPrep = parseInt(e.target.value, 10);
      endLabel.textContent = `${subject.endsemPrep}%`;
      saveState();
      drawCharts();
    });

    endContainer.appendChild(endSlider);
    endContainer.appendChild(endLabel);
    endWrapper.appendChild(endContainer);

    // Endsem Date & Countdown Row
    const endDateRow = document.createElement('div');
    endDateRow.style.display = 'flex';
    endDateRow.style.justifyContent = 'space-between';
    endDateRow.style.alignItems = 'center';
    endDateRow.style.gap = '4px';
    endDateRow.style.padding = '0 2px';

    const endDateContainer = document.createElement('div');
    endDateContainer.style.display = 'flex';
    endDateContainer.style.alignItems = 'center';
    endDateContainer.style.gap = '2px';

    const endDateText = document.createElement('span');
    endDateText.textContent = subject.endsemDate || 'No Date';
    endDateText.style.fontFamily = 'var(--font-mono)';
    endDateText.style.fontSize = '9px';
    endDateText.style.color = subject.endsemDate ? 'var(--text-secondary)' : 'var(--text-muted)';

    const endEditBtn = document.createElement('button');
    endEditBtn.innerHTML = '✎';
    endEditBtn.style.background = 'transparent';
    endEditBtn.style.border = 'none';
    endEditBtn.style.color = 'var(--accent-blue)';
    endEditBtn.style.fontSize = '10px';
    endEditBtn.style.cursor = 'pointer';
    endEditBtn.style.padding = '0 2px';
    endEditBtn.style.lineHeight = '1';

    endEditBtn.addEventListener('click', () => {
      const val = prompt(`Enter Endsem Exam Date for ${subject.title.split(':')[0]} (DD-MM-YYYY):`, subject.endsemDate || '');
      if (val !== null) {
        const cleaned = val.trim();
        if (cleaned === '' || /^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
          subject.endsemDate = cleaned;
          saveState();
          renderAll();
        } else {
          alert("Please enter a valid date in DD-MM-YYYY format (or leave blank to clear).");
        }
      }
    });

    endDateContainer.appendChild(endDateText);
    endDateContainer.appendChild(endEditBtn);

    const endBadge = document.createElement('span');
    endBadge.style.fontFamily = 'var(--font-mono)';
    endBadge.style.fontSize = '8px';
    const eRem = getDaysRemaining(subject.endsemDate);
    if (subject.endsemDate) {
      if (eRem > 0) {
        endBadge.textContent = `In ${eRem}d`;
        endBadge.style.color = 'var(--accent-blue)';
      } else if (eRem === 0) {
        endBadge.textContent = `TODAY`;
        endBadge.style.color = 'var(--accent-blue)';
        endBadge.style.fontWeight = 'bold';
      } else {
        endBadge.textContent = `Passed`;
        endBadge.style.color = 'var(--text-muted)';
      }
    } else {
      endBadge.textContent = `No Date`;
      endBadge.style.color = 'var(--text-muted)';
    }

    endDateRow.appendChild(endDateContainer);
    endDateRow.appendChild(endBadge);
    endWrapper.appendChild(endDateRow);
    tdEnd.appendChild(endWrapper);
    tr.appendChild(tdEnd);

    // 4. Status
    const tdStatus = document.createElement('td');
    const select = document.createElement('select');
    select.className = `cell-select status-${subject.status}`;
    
    [
      { val: 'todo', label: 'TODO' },
      { val: 'in-progress', label: 'IN PROGRESS' },
      { val: 'completed', label: 'COMPLETED' },
      { val: 'blocked', label: 'BLOCKED' }
    ].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.val;
      opt.textContent = s.label;
      opt.selected = subject.status === s.val;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      subject.status = e.target.value;
      select.className = `cell-select status-${subject.status}`;
      saveState();
    });
    tdStatus.appendChild(select);
    tr.appendChild(tdStatus);

    // 5. Delete
    const tdDel = document.createElement('td');
    tdDel.style.textAlign = 'center';
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-row-btn';
    delBtn.innerHTML = '✕';
    delBtn.addEventListener('click', () => {
      state.trash.push({
        id: "t_" + Date.now(),
        type: 'subject',
        name: subject.title.split(':')[0],
        data: subject,
        deletedAt: Date.now()
      });
      state.subjects = state.subjects.filter(s => s.id !== subject.id);
      saveState();
      renderAll();
    });
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);

    tbody.appendChild(tr);
  });
}

function renderBacklog() {
  const tbody = document.getElementById('backlog-list-tbody');
  tbody.innerHTML = '';

  const badge = document.getElementById('backlog-count-badge');
  badge.textContent = `${state.backlog.length} Projects`;

  if (state.backlog.length === 0) {
    document.getElementById('no-backlog-msg').classList.remove('hidden');
    document.getElementById('backlog-table').classList.add('hidden');
    return;
  }
  document.getElementById('no-backlog-msg').classList.add('hidden');
  document.getElementById('backlog-table').classList.remove('hidden');

  state.backlog.forEach(item => {
    const tr = document.createElement('tr');

    const tdTitle = document.createElement('td');
    const inputTitle = document.createElement('input');
    inputTitle.type = 'text';
    inputTitle.className = 'cell-input';
    inputTitle.value = item.title;
    inputTitle.placeholder = "Enter project name...";
    inputTitle.addEventListener('change', (e) => {
      item.title = e.target.value;
      saveState();
    });
    tdTitle.appendChild(inputTitle);
    tr.appendChild(tdTitle);

    const tdCat = document.createElement('td');
    const inputCat = document.createElement('input');
    inputCat.type = 'text';
    inputCat.className = 'cell-input';
    inputCat.value = item.category;
    inputCat.placeholder = "Enter tech stack...";
    inputCat.addEventListener('change', (e) => {
      item.category = e.target.value;
      saveState();
    });
    tdCat.appendChild(inputCat);
    tr.appendChild(tdCat);

    const tdStatus = document.createElement('td');
    const select = document.createElement('select');
    select.className = `cell-select status-${item.status}`;
    
    [
      { val: 'not-started', label: 'NOT STARTED' },
      { val: 'in-progress', label: 'IN PROGRESS' },
      { val: 'completed', label: 'COMPLETED' },
      { val: 'blocked', label: 'BLOCKED' }
    ].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.val;
      opt.textContent = s.label;
      opt.selected = item.status === s.val;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      item.status = e.target.value;
      select.className = `cell-select status-${item.status}`;
      if (item.status === 'completed') item.progress = 100;
      else if (item.status === 'not-started') item.progress = 0;
      saveState();
      renderBacklog();
    });
    tdStatus.appendChild(select);
    tr.appendChild(tdStatus);

    const tdProg = document.createElement('td');
    const progContainer = document.createElement('div');
    progContainer.className = 'progress-container';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.className = 'progress-slider';
    slider.value = item.progress;
    
    const label = document.createElement('span');
    label.className = 'progress-value-label';
    label.textContent = `${item.progress}%`;

    slider.addEventListener('input', (e) => {
      item.progress = parseInt(e.target.value, 10);
      label.textContent = `${item.progress}%`;
      if (item.progress === 100 && item.status !== 'completed') {
        item.status = 'completed';
        select.className = 'cell-select status-completed';
        select.value = 'completed';
      } else if (item.progress > 0 && item.progress < 100 && item.status !== 'in-progress') {
        item.status = 'in-progress';
        select.className = 'cell-select status-in-progress';
        select.value = 'in-progress';
      }
      saveState();
    });

    slider.addEventListener('change', () => renderBacklog());

    progContainer.appendChild(slider);
    progContainer.appendChild(label);
    tdProg.appendChild(progContainer);
    tr.appendChild(tdProg);

    const tdDel = document.createElement('td');
    tdDel.style.textAlign = 'center';
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-row-btn';
    delBtn.innerHTML = '✕';
    delBtn.addEventListener('click', () => {
      state.trash.push({
        id: "t_" + Date.now(),
        type: 'project',
        name: item.title || 'Untitled Project',
        data: item,
        deletedAt: Date.now()
      });
      state.backlog = state.backlog.filter(b => b.id !== item.id);
      saveState();
      renderBacklog();
      renderTrashBadge();
    });
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);

    tbody.appendChild(tr);
  });
}

function renderLinks() {
  const container = document.getElementById('hub-links-container');
  container.innerHTML = '';

  state.academicLinks.forEach(link => {
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.className = 'hub-link';
    anchor.textContent = link.name;
    container.appendChild(anchor);
  });
}

// ----------------------------------------------------
// 7. STATS & SCOREBOARD calculations
// ----------------------------------------------------

function calculateHabitCompletion(habit, year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  let scheduledDaysCount = 0;
  let completedDaysCount = 0;

  const isCurrentMonth = (year === SYSTEM_TODAY.getFullYear() && month === SYSTEM_TODAY.getMonth());
  const maxDayToCheck = isCurrentMonth ? SYSTEM_TODAY.getDate() : daysInMonth;

  for (let d = 1; d <= maxDayToCheck; d++) {
    const dayOfWeek = getDayOfWeek(year, month, d);
    const isScheduled = habit.schedule === 'daily' || habit.customDays.includes(dayOfWeek);

    if (isScheduled) {
      scheduledDaysCount++;
      const dateKey = formatDateKey(year, month, d);
      if (habit.completions[dateKey]) {
        completedDaysCount++;
      }
    }
  }

  const rate = scheduledDaysCount > 0 ? (completedDaysCount / scheduledDaysCount) * 100 : 0.0;
  return {
    rate: parseFloat(rate.toFixed(1)),
    completed: completedDaysCount,
    scheduled: scheduledDaysCount
  };
}

function renderScoreboard() {
  const container = document.getElementById('scoreboard-container');
  container.innerHTML = '';

  if (state.habits.length === 0) {
    container.innerHTML = `<span class="muted-text" style="font-family: var(--font-mono); font-size: 11px; text-align: center; padding: 20px;">No habits tracked.</span>`;
    return;
  }

  const scores = state.habits.map(habit => {
    const metrics = calculateHabitCompletion(habit, state.selectedYear, state.selectedMonth);
    return {
      title: habit.title || 'Untitled',
      rate: metrics.rate,
      completed: metrics.completed,
      scheduled: metrics.scheduled
    };
  });

  scores.sort((a, b) => b.rate - a.rate);
  const top10 = scores.slice(0, 10);

  top10.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'scoreboard-item';

    const rank = document.createElement('div');
    rank.className = 'scoreboard-rank';
    rank.textContent = `#${idx + 1}`;

    const info = document.createElement('div');
    info.className = 'scoreboard-info';

    const title = document.createElement('div');
    title.className = 'scoreboard-title';
    title.textContent = item.title;

    const barBg = document.createElement('div');
    barBg.className = 'scoreboard-bar-bg';

    const barFill = document.createElement('div');
    barFill.className = 'scoreboard-bar-fill';
    barFill.style.width = `${item.rate}%`;
    
    if (item.rate < 30) barFill.style.backgroundColor = '#ff3333';
    else if (item.rate < 70) barFill.style.backgroundColor = 'var(--accent-cyan)';
    else barFill.style.backgroundColor = 'var(--accent-green)';

    barBg.appendChild(barFill);
    info.appendChild(title);
    info.appendChild(barBg);

    const pct = document.createElement('div');
    pct.className = 'scoreboard-pct';
    pct.textContent = `${item.rate}%`;

    div.appendChild(rank);
    div.appendChild(info);
    div.appendChild(pct);
    container.appendChild(div);
  });
}

function calculateGlobalCompletion() {
  const display = document.getElementById('global-completion-display');
  
  if (state.habits.length === 0) {
    display.textContent = '0.0%';
    return;
  }

  let totalScheduled = 0;
  let totalCompleted = 0;

  state.habits.forEach(habit => {
    const metrics = calculateHabitCompletion(habit, state.selectedYear, state.selectedMonth);
    totalScheduled += metrics.scheduled;
    totalCompleted += metrics.completed;
  });

  if (totalScheduled === 0) {
    display.textContent = '0.0%';
  } else {
    const globalRate = (totalCompleted / totalScheduled) * 100;
    display.textContent = `${globalRate.toFixed(1)}%`;
  }
}

// ----------------------------------------------------
// 8. ACTION HANDLERS & MODAL MANAGEMENT
// ----------------------------------------------------

let currentEditingHabit = null;

function openScheduleModal(habit) {
  currentEditingHabit = habit;
  const modal = document.getElementById('schedule-modal');
  document.getElementById('modal-habit-name').textContent = habit.title || 'Untitled Habit';

  const inputs = document.querySelectorAll('.day-select-input');
  inputs.forEach(input => {
    const val = parseInt(input.value, 10);
    input.checked = habit.customDays.includes(val);
  });

  let resetBtn = document.getElementById('modal-daily-reset-btn');
  if (!resetBtn) {
    resetBtn = document.createElement('button');
    resetBtn.id = 'modal-daily-reset-btn';
    resetBtn.className = 'action-btn-outline';
    resetBtn.style.marginTop = '12px';
    resetBtn.style.width = '100%';
    resetBtn.textContent = 'RESET TO DAILY SCHEDULE';
    resetBtn.addEventListener('click', () => {
      if (currentEditingHabit) {
        currentEditingHabit.schedule = 'daily';
        currentEditingHabit.customDays = [0, 1, 2, 3, 4, 5, 6];
        saveState();
        closeScheduleModal();
        renderAll();
      }
    });
    document.querySelector('#schedule-modal .modal-body').appendChild(resetBtn);
  }

  modal.classList.remove('hidden');
}

function closeScheduleModal() {
  document.getElementById('schedule-modal').classList.add('hidden');
  currentEditingHabit = null;
}

function saveScheduleConfiguration() {
  if (!currentEditingHabit) return;

  const inputs = document.querySelectorAll('.day-select-input');
  const selected = [];
  inputs.forEach(input => {
    if (input.checked) selected.push(parseInt(input.value, 10));
  });

  if (selected.length === 0) {
    alert("Please select at least one day.");
    return;
  }

  currentEditingHabit.schedule = 'custom';
  currentEditingHabit.customDays = selected.sort((a,b) => a-b);
  
  saveState();
  closeScheduleModal();
  renderAll();
}

function openLinksModal() {
  const modal = document.getElementById('links-modal');
  const list = document.getElementById('links-edit-list');
  list.innerHTML = '';
  state.academicLinks.forEach((link, idx) => addLinkEditRow(link.name, link.url, idx));
  modal.classList.remove('hidden');
}

function closeLinksModal() {
  document.getElementById('links-modal').classList.add('hidden');
}

function addLinkEditRow(name = '', url = '', index = null) {
  const list = document.getElementById('links-edit-list');
  const div = document.createElement('div');
  div.className = 'link-edit-row';

  const nInput = document.createElement('input');
  nInput.className = 'link-edit-name';
  nInput.value = name;
  nInput.placeholder = "Bookmark Title";

  const uInput = document.createElement('input');
  uInput.className = 'link-edit-url';
  uInput.value = url;
  uInput.placeholder = "https://...";

  const del = document.createElement('button');
  del.className = 'link-remove-btn';
  del.innerHTML = '✕';
  del.addEventListener('click', () => div.remove());

  div.appendChild(nInput);
  div.appendChild(uInput);
  div.appendChild(del);
  list.appendChild(div);
}

function saveLinksConfiguration() {
  const rows = document.querySelectorAll('.link-edit-row');
  const newLinks = [];
  rows.forEach(row => {
    const name = row.querySelector('.link-edit-name').value.trim();
    const url = row.querySelector('.link-edit-url').value.trim();
    if (name && url) newLinks.push({ name, url });
  });
  state.academicLinks = newLinks;
  saveState();
  closeLinksModal();
  renderLinks();
}

// ----------------------------------------------------
// 9. EVENT LISTENERS SETUP
// ----------------------------------------------------

function setupEventListeners() {
  // Calendar headers change
  document.getElementById('prev-month-btn').addEventListener('click', () => navigateTimeline(-1));
  document.getElementById('next-month-btn').addEventListener('click', () => navigateTimeline(1));

  document.getElementById('month-select').addEventListener('change', (e) => {
    state.selectedMonth = parseInt(e.target.value, 10);
    saveState();
    renderAll();
  });

  document.getElementById('year-select').addEventListener('change', (e) => {
    state.selectedYear = parseInt(e.target.value, 10);
    saveState();
    renderAll();
  });

  document.getElementById('today-btn').addEventListener('click', () => {
    state.selectedMonth = SYSTEM_TODAY.getMonth();
    state.selectedYear = SYSTEM_TODAY.getFullYear();
    validateSelectedMonthRange();
    saveState();
    renderAll();
  });

  // Adding Items
  document.getElementById('add-habit-btn').addEventListener('click', () => {
    const name = prompt("Enter habit title:");
    if (!name) return;
    state.habits.push({
      id: "h_" + Date.now(),
      title: name.trim(),
      schedule: "daily",
      customDays: [0, 1, 2, 3, 4, 5, 6],
      completions: {}
    });
    saveState();
    renderAll();
  });

  document.getElementById('add-task-btn').addEventListener('click', () => {
    const name = prompt("Enter subject title/code:");
    if (!name) return;
    state.subjects.push({
      id: "s_" + Date.now(),
      title: name.trim().toUpperCase(),
      midsemPrep: 0,
      endsemPrep: 0,
      status: "todo",
      dueDate: ""
    });
    saveState();
    renderAll();
  });

  document.getElementById('add-backlog-btn').addEventListener('click', () => {
    state.backlog.push({
      id: "b_" + Date.now(),
      title: "",
      category: "",
      status: "not-started",
      progress: 0
    });
    saveState();
    renderBacklog();
  });

  // Notepad specific handlers
  const textarea = document.getElementById('notepad-textarea');
  const saveIndicator = document.getElementById('notepad-save-indicator');
  let saveTimeout = null;

  textarea.addEventListener('input', (e) => {
    const activeId = state.notepadPages.activePageId;
    const activePage = state.notepadPages.pages.find(p => p.id === activeId);
    if (activePage) {
      activePage.content = e.target.value;
      saveState();

      saveIndicator.textContent = "SAVING...";
      saveIndicator.className = "save-indicator saving";

      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveIndicator.textContent = "AUTO-SAVED";
        setTimeout(() => saveIndicator.classList.remove('saving'), 800);
      }, 300);
    }
  });

  document.getElementById('add-note-tab-btn').addEventListener('click', () => {
    const newId = "p_" + Date.now();
    state.notepadPages.pages.push({
      id: newId,
      title: "New Note",
      content: ""
    });
    state.notepadPages.activePageId = newId;
    saveState();
    renderNotepad();
  });

  // Modal actions
  document.getElementById('close-modal-btn').addEventListener('click', closeScheduleModal);
  document.getElementById('save-schedule-btn').addEventListener('click', saveScheduleConfiguration);

  document.getElementById('edit-links-btn').addEventListener('click', openLinksModal);
  document.getElementById('close-links-modal-btn').addEventListener('click', closeLinksModal);
  document.getElementById('add-link-item-btn').addEventListener('click', () => addLinkEditRow());
  document.getElementById('save-links-btn').addEventListener('click', saveLinksConfiguration);

  // Exam scheduler configuration
  document.getElementById('edit-exams-btn').addEventListener('click', () => {
    const mid = prompt("Enter Midsem Start Date (DD-MM-YYYY):", state.midsemDate);
    const end = prompt("Enter Endsem Start Date (DD-MM-YYYY):", state.endsemDate);
    if (mid !== null) {
      const val = mid.trim();
      if (val === "" || /^\d{2}-\d{2}-\d{4}$/.test(val)) {
        state.midsemDate = val;
      } else {
        alert("Invalid format for Midsem. Use DD-MM-YYYY.");
      }
    }
    if (end !== null) {
      const val = end.trim();
      if (val === "" || /^\d{2}-\d{2}-\d{4}$/.test(val)) {
        state.endsemDate = val;
      } else {
        alert("Invalid format for Endsem. Use DD-MM-YYYY.");
      }
    }
    saveState();
    renderExams();
  });

  // Timetable image uploads
  const fileInput = document.getElementById('timetable-file-input');
  document.getElementById('upload-img-btn').addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) {
      alert("Image must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
      state.academicImages.push({
        id: "img_" + Date.now(),
        name: file.name,
        data: evt.target.result
      });
      saveState();
      renderImages();
    };
    reader.readAsDataURL(file);
    fileInput.value = ''; // clear input
  });

  // Recycle Bin modals
  document.getElementById('trash-btn').addEventListener('click', () => {
    renderTrash();
    document.getElementById('trash-modal').classList.remove('hidden');
  });

  document.getElementById('close-trash-modal-btn').addEventListener('click', () => {
    document.getElementById('trash-modal').classList.add('hidden');
  });

  // Fullscreen timetable modal
  document.getElementById('close-image-view-modal').addEventListener('click', () => {
    document.getElementById('image-overlay-modal').classList.add('hidden');
  });

  // Close modals on clicking overlay background
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeScheduleModal();
      closeLinksModal();
      document.getElementById('trash-modal').classList.add('hidden');
      document.getElementById('image-overlay-modal').classList.add('hidden');
    }
  });

  // Setup gestural swipes
  setupSwipeGestures();

  // Resize listener to scale charts
  window.addEventListener('resize', drawCharts);
}

// ----------------------------------------------------
// 10. APP BOOTSTRAP
// ----------------------------------------------------

window.addEventListener('DOMContentLoaded', async () => {
  loadState(); // Load cached localStorage immediately (cache-first)
  renderAll();
  setupEventListeners();

  // Keep background silent PowerShell server alive via dynamic heartbeats
  setInterval(() => {
    fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
  }, 3000);

  await loadStateFromServer(); // Fetch fresh data from local file on backend server
});
