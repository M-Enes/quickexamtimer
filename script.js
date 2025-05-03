// DOM Elements
const countdownContainer = document.getElementById('countdown-container');
const selectionModal = document.getElementById('selection-modal');
const examCheckboxesContainer = document.getElementById('exam-checkboxes');
const saveSelectionBtn = document.getElementById('save-selection-btn');
// const fileImportInput = document.getElementById('import-file'); // REMOVED
const resetExamsBtn = document.getElementById('reset-exams-btn'); // Note: May need to re-assign if multiple exist
const jsonPasteArea = document.getElementById('json-paste-area');
const importPastedJsonBtn = document.getElementById('import-pasted-json-btn');
const llmPromptTextEl = document.getElementById('llm-prompt-text');
const copyPromptBtn = document.getElementById('copy-prompt-btn');
const showImportUiBtn = document.getElementById('show-import-ui-btn');
const importControlsDiv = document.querySelector('.import-controls'); // Get the div itself
const llmPromptSectionDiv = document.querySelector('.llm-prompt-section'); // Get the div itself

// Global variable to hold all fetched exams
let allExams = [];
let updateInterval = null;
const CUSTOM_EXAMS_KEY = 'customExamsData';
const SELECTED_EXAMS_KEY = 'selectedExams';

// Default exam data (embedded instead of fetching exams.json)
// const DEFAULT_EXAMS = [ ... ]; // REMOVED

const LLM_PROMPT = `
You are tasked with converting exam schedule information into a JSON format suitable for an exam countdown timer application.

Format the extracted information as a JSON array.

Each object in the JSON array represents a single exam and MUST have the following keys:
- "code": A string representing the course code (e.g., "CENG101"). Use "UNKNOWN_CODE" if not found.
- "name": A string representing the course name (e.g., "Introduction to Programming"). Use "UNKNOWN_NAME" if not found.
- "date": A string representing the exam date strictly in DD.MM.YYYY format (e.g., "21.05.2025").
- "time": A string representing the exam time strictly in HH:MM format using a 24-hour clock (e.g., "09:00" or "14:30").

Optionally, include this key if the information is available:
- "classes": A string representing the classroom(s) or location (e.g., "A101 / B203", "Online", or "N/A").

Important Rules:
- Extract information for ALL exams mentioned in the user's input.
- Ensure the date and time formats (DD.MM.YYYY and HH:MM) are followed exactly.
- If a date or time for a specific exam cannot be determined or formatted correctly, omit that specific exam entry from the final JSON, but include all others that are valid.
- The final output MUST be ONLY the JSON array itself, starting with \`[\` and ending with \`]\`. Do not include any introductory text, explanations, apologies, or markdown formatting like \\\`\\\`\\\`json.\n
Please find the user's exam schedule information below (either pasted directly or in an attached file):

--- START OF USER SCHEDULE ---

[ *** PASTE your exam schedule text/table here OR just ATTACH the file *** ]

--- END OF USER SCHEDULE ---

Generate the JSON array based on ALL the exam information provided and the rules above:
`;

// --- Date & Time Formatting ---
function parseDate(dateStr, timeStr) {
    const [day, month, year] = dateStr.split('.');
    const [hour, minute] = timeStr.split(':');
    return new Date(year, month - 1, day, hour, minute); // Month is 0-indexed
}

function formatTimeRemaining(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// --- Exam Selection & Persistence ---
function getSelectedExams() {
    const storedSelection = localStorage.getItem(SELECTED_EXAMS_KEY);
    return storedSelection ? JSON.parse(storedSelection) : null;
}

function saveSelectedExams(selectedCodes) {
    localStorage.setItem(SELECTED_EXAMS_KEY, JSON.stringify(selectedCodes));
}

function getCustomExams() {
    const storedCustom = localStorage.getItem(CUSTOM_EXAMS_KEY);
    return storedCustom ? JSON.parse(storedCustom) : null;
}

function saveCustomExams(examsData) {
    try {
        localStorage.setItem(CUSTOM_EXAMS_KEY, JSON.stringify(examsData));
        return true;
    } catch (error) {
        console.error("Error saving custom exams to localStorage:", error);
        alert("Could not save custom exams. LocalStorage might be full.");
        return false;
    }
}

function clearCustomExams() {
    localStorage.removeItem(CUSTOM_EXAMS_KEY);
    localStorage.removeItem(SELECTED_EXAMS_KEY);
    alert("Schedule cleared. Please import your exam schedule.");

    // Stop current timers
    if (updateInterval) clearInterval(updateInterval);
    countdownContainer.innerHTML = '<p>No schedule loaded. Please import your exams using the \'Manage Schedule / Import\' button.</p>';

    // Set exams to empty and ensure import UI is ready if needed
    allExams = [];
    // Do not automatically show selection modal here
    // Hide the import UI if it was open
    importControlsDiv.style.display = 'none'; 
    llmPromptSectionDiv.style.display = 'none';
}

// --- File Import Logic ---
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) {
        return; // No file selected
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            // Basic validation: check if it's an array
            if (!Array.isArray(importedData)) {
                throw new Error("Imported data is not a valid JSON array.");
            }
            // Deeper validation could be added here (check for required fields like code, name, date, time)
            const isValid = importedData.every(exam => 
                exam && typeof exam.code === 'string' && 
                typeof exam.name === 'string' && 
                typeof exam.date === 'string' && 
                typeof exam.time === 'string'
                // 'classes' field is optional
            );
            if (!isValid) {
                 throw new Error("Imported data contains invalid exam entries.");
            }

            if (saveCustomExams(importedData)) {
                alert(`Successfully imported ${importedData.length} exams. Please re-select your exams if needed.`);
                allExams = importedData;
                // Clear previous selection and force user to re-select from the new list
                localStorage.removeItem(SELECTED_EXAMS_KEY);
                if (updateInterval) clearInterval(updateInterval);
                showSelectionModal(); // Show modal with the new custom exams
            }
        } catch (error) {
            console.error("Failed to parse or validate imported file:", error);
            alert(`Error importing file: ${error.message}. Please ensure it's a valid JSON file with the correct format.`);
        }
        // Reset file input value so the same file can be re-selected if needed
        event.target.value = null; 
    };

    reader.onerror = function() {
        alert("Error reading file.");
         event.target.value = null; 
    };

    reader.readAsText(file);
}

// --- Paste Import Logic ---
function handlePasteImport() {
    let jsonString = jsonPasteArea.value.trim(); // Trim whitespace first
    if (!jsonString) {
        alert("Please paste the JSON data into the text area first.");
        return;
    }

    // Attempt to clean common LLM artifacts (markdown code blocks)
    if (jsonString.startsWith('```json') && jsonString.endsWith('```')) {
        console.log("Cleaning ```json markdown...");
        jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```') && jsonString.endsWith('```')) {
        console.log("Cleaning ``` markdown...");
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('`') && jsonString.endsWith('`')) {
        console.log("Cleaning single backticks...");
        jsonString = jsonString.substring(1, jsonString.length - 1).trim();
    }

    // Clean potential leading backslash (after markdown cleaning)
    if (jsonString.startsWith('\\')) { // Need to escape the backslash in the check
        console.log("Cleaning leading backslash...");
        jsonString = jsonString.substring(1);
    }

    // Ensure it looks like an array (basic check)
    if (!jsonString.startsWith('[') || !jsonString.endsWith(']')) {
        alert('Error: The pasted text does not appear to be a valid JSON array (must start with [ and end with ]). Please check the format.');
        return;
    }

    try {
        const importedData = JSON.parse(jsonString);
        // Basic validation (same as file import)
        if (!Array.isArray(importedData)) {
            throw new Error("Pasted data is not a valid JSON array.");
        }
        const isValid = importedData.every(exam =>
            exam && typeof exam.code === 'string' &&
            typeof exam.name === 'string' &&
            typeof exam.date === 'string' &&
            typeof exam.time === 'string'
            // 'classes' is optional
        );
         if (!isValid) {
             throw new Error("Pasted data contains invalid exam entries (missing code, name, date, or time).");
         }

        if (saveCustomExams(importedData)) {
            alert(`Successfully imported ${importedData.length} exams from pasted text. Please select your exams from the list.`);
            allExams = importedData;
            localStorage.removeItem(SELECTED_EXAMS_KEY);
            if (updateInterval) clearInterval(updateInterval);
            showSelectionModal();
            jsonPasteArea.value = ''; // Clear the text area
            // Hide the import UI after successful import
            importControlsDiv.style.display = 'none';
            llmPromptSectionDiv.style.display = 'none';
        } else {
             // saveCustomExams alerts if there's an issue
        }
    } catch (error) {
        console.error("Failed to parse or validate pasted JSON:", error);
        alert(`Error importing pasted data: ${error.message}. Please ensure it's valid JSON matching the required format.`);
    }
}

// --- UI Interaction ---
function showSelectionModal() {
    examCheckboxesContainer.innerHTML = ''; // Clear previous checkboxes
    const currentSelected = getSelectedExams() || []; // Get previously selected if any

    allExams
        .sort((a, b) => parseDate(a.date, a.time) - parseDate(b.date, b.time)) // Sort for display
        .forEach(exam => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = exam.code;
            checkbox.id = `checkbox-${exam.code}`;
            // Check if this exam was previously selected
            checkbox.checked = currentSelected.includes(exam.code);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${exam.code} - ${exam.name} (${exam.date})`));
            examCheckboxesContainer.appendChild(label);
    });
    selectionModal.style.display = 'block';
}

function handleSaveSelection() {
    const selectedCodes = [];
    const checkboxes = examCheckboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => selectedCodes.push(cb.value));
    saveSelectedExams(selectedCodes);
    selectionModal.style.display = 'none';
    renderCountdowns(); // Re-render with the new selection
    startTimerUpdates(); // Start or restart the timer updates
}

// --- Rendering ---
function renderCountdowns() {
    countdownContainer.innerHTML = ''; // Clear existing content
    const now = new Date();
    const selectedCodes = getSelectedExams();

    if (!selectedCodes) {
        // Should not happen if initialization logic is correct, but safeguard
        // Do not automatically show modal here, let the initialize logic handle it
        console.warn("RenderCountdowns called without selected exams.");
        return;
    }

    const selectedExamsData = allExams
        .filter(exam => selectedCodes.includes(exam.code))
        .sort((a, b) => parseDate(a.date, a.time) - parseDate(b.date, b.time));

    if (selectedExamsData.length === 0 && selectedCodes.length > 0) {
         // Selection exists, but no matching exams in current 'allExams' (could happen after import/reset)
         countdownContainer.innerHTML = '<p>Your selection doesn\'t match the current exam list. Please <a href="#" onclick="showSelectionModal(); return false;">update your selection</a> or <a href="#" onclick="clearCustomExams(); return false;">reset to default</a>.</p>';
         return;
    }
     if (selectedExamsData.length === 0 && selectedCodes.length === 0) {
         countdownContainer.innerHTML = '<p>No exams selected. Please <a href="#" onclick="showSelectionModal(); return false;">select your exams</a>.</p>';
         return;
    }

    selectedExamsData.forEach(exam => {
        const examDate = parseDate(exam.date, exam.time);
        const diff = examDate - now;
        const card = document.createElement('div');
        card.classList.add('exam-card');
        card.id = `card-${exam.code}`; // Add ID for easier update targeting

        const title = document.createElement('h2');
        title.textContent = `${exam.code} - ${exam.name}`;
        card.appendChild(title);

        const dateInfo = document.createElement('p');
        const formattedDate = examDate.toLocaleString('en-GB', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });
        dateInfo.textContent = `Date: ${formattedDate}`;
        card.appendChild(dateInfo);

        // Add Exam Classes info
        const classesInfo = document.createElement('p');
        classesInfo.classList.add('exam-classes');
        classesInfo.textContent = `Classes: ${exam.classes || 'N/A'}`;
        card.appendChild(classesInfo);

        const timerDisplay = document.createElement('p');
        timerDisplay.classList.add('countdown-timer');
        timerDisplay.id = `timer-${exam.code}`; // Simpler ID

        if (diff <= 0) {
            timerDisplay.textContent = "Exam time has passed.";
            timerDisplay.classList.add('passed');
        } else {
            timerDisplay.textContent = formatTimeRemaining(diff);
        }
        card.appendChild(timerDisplay);

        countdownContainer.appendChild(card);
    });
}

// --- Timer Update Logic ---
function updateTimers() {
    const now = new Date();
    const selectedCodes = getSelectedExams();
    if (!selectedCodes) return; // No selection, nothing to update

    selectedCodes.forEach(code => {
        const exam = allExams.find(e => e.code === code);
        if (!exam) return; // Exam not found in current data

        const timerElement = document.getElementById(`timer-${code}`);
        if (!timerElement) return; // Element not rendered

        const examDate = parseDate(exam.date, exam.time);
        const diff = examDate - now;

        if (diff > 0) {
            timerElement.textContent = formatTimeRemaining(diff);
        } else if (!timerElement.classList.contains('passed')) {
            timerElement.textContent = "Exam time has passed.";
            timerElement.classList.add('passed');
        }
    });
}

function startTimerUpdates() {
     if (updateInterval) {
         clearInterval(updateInterval);
     }
     const selectedCodes = getSelectedExams();
     // Only start interval if there are selected exams
     if (selectedCodes && selectedCodes.length > 0) {
        updateTimers(); // Update immediately
        updateInterval = setInterval(updateTimers, 1000);
     }
}

// --- Prompt Copy Logic ---
function copyPromptToClipboard() {
    navigator.clipboard.writeText(LLM_PROMPT)
        .then(() => {
            alert('LLM prompt copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy prompt: ', err);
            alert('Failed to copy prompt. You may need to copy it manually.');
        });
}

// --- Initialization ---
async function initialize() {
    // Populate the LLM prompt text area
    if (llmPromptTextEl) {
         llmPromptTextEl.textContent = LLM_PROMPT;
    }
    // Add event listeners
    showImportUiBtn.addEventListener('click', toggleImportUI);
    // Ensure correct reset button is targeted if multiple exist, assuming the one in import-controls is the relevant one now
    const resetButtonInImport = importControlsDiv.querySelector('#reset-exams-btn');
    if(resetButtonInImport) {
       resetButtonInImport.addEventListener('click', clearCustomExams);
    } else {
        console.warn("Could not find reset button inside import controls.");
        // Fallback or handle error if needed
    }
    importPastedJsonBtn.addEventListener('click', handlePasteImport);
    if (copyPromptBtn) {
        copyPromptBtn.addEventListener('click', copyPromptToClipboard);
    }

    try {
        // 1. Check for custom exams in localStorage
        const customExams = getCustomExams();
        if (customExams) {
            console.log("Using custom exams from localStorage.");
            allExams = customExams;
        } else {
            // 2. If no custom exams, start with an empty list and show import UI
            console.log("No custom exams found. Starting empty.");
            allExams = [];
            // Show a message prompting import
            countdownContainer.innerHTML = '<p>No schedule loaded. Please import your exams using the options below.</p>';
            // Automatically show the import UI
            toggleImportUI(); 
        }

        // 3. Check for saved selection (only relevant if custom exams were loaded)
        if (allExams.length > 0) {
             const selectedCodes = getSelectedExams();
             if (selectedCodes === null) {
                 // Custom data exists, but no selection made yet
                 showSelectionModal();
             } else {
                 // User has a saved selection for the loaded custom data
                 renderCountdowns();
                 startTimerUpdates();
             }
        }
        // Don't show modal or render if allExams is empty

        // Add event listener for the save button inside the modal
        saveSelectionBtn.addEventListener('click', handleSaveSelection);

    } catch (error) {
        // This catch block might now only catch errors during initialization logic itself,
        // not from fetching, unless other async operations are added.
        console.error('Failed to initialize application:', error);
        countdownContainer.innerHTML = '<p>Error initializing the application. Please check the console.</p>';
    }
}

// Start the application
initialize();

// --- UI Interaction ---
function toggleImportUI() {
    const isHidden = importControlsDiv.style.display === 'none';
    importControlsDiv.style.display = isHidden ? 'flex' : 'none'; // Use flex as defined in CSS
    llmPromptSectionDiv.style.display = isHidden ? 'block' : 'none'; // Use block for this section
}