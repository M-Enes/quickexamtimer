# Exam Countdown Timer

This is a simple static website to display countdown timers for your final exams.

## Features

*   Displays a list of exams with their dates and times.
*   Shows a live countdown for each upcoming exam.
*   Indicates when an exam time has passed.
*   Sorts exams by date.
*   Requires users to import an exam schedule (in JSON format) which is saved in the browser's `localStorage`.
*   Provides an LLM prompt to help users generate the required JSON from their schedule text.
*   Remembers the user's selection of exams.
*   Includes a default schedule embedded in the code.
*   Basic responsive design.

## Setup

1.  Clone or download this repository.
2.  Open the `index.html` file in your web browser.

## Usage

*   **Importing Your Schedule (Required on First Use):**
    1.  Click the "Manage Schedule / Import" button to reveal the import options.
    2.  If you have your exam schedule in text or table format, expand the "Need help creating the JSON file?" section.
    3.  Copy the provided LLM prompt.
    4.  Paste the prompt into an AI assistant (like ChatGPT, Gemini, Claude) and replace the placeholder `[ *** PASTE YOUR EXAM SCHEDULE TEXT OR TABLE HERE *** ]` with your schedule.
    5.  The AI should generate a JSON array. Copy *only* the JSON array (starting with `[` and ending with `]`).
    6.  Paste the copied JSON into the text area on the webpage labeled "Paste JSON here:".
    7.  Click "Import Pasted JSON".
    8.  If successful, you will be prompted to select which exams from your imported list you want to display.
*   **Viewing Countdowns:** Once imported and selected, the countdowns for your chosen exams will be displayed.
*   **Updating/Resetting:**
    *   To import a new schedule, click "Manage Schedule / Import" and repeat the import steps. This will replace the previously saved schedule.
    *   To clear the saved schedule completely, click "Manage Schedule / Import" and then "Reset to Default Schedule" (this button now clears the storage).
*   Your custom schedule and your selection are saved in your browser's `localStorage` and will be loaded automatically on future visits until cleared or replaced.
*   The required JSON format for each exam is: `{"code": "COURSE_CODE", "name": "Course Name", "date": "DD.MM.YYYY", "time": "HH:MM", "classes": "Optional Location"}`.
*   You can customize the visual appearance by editing the `style.css` file.

## Deployment to GitHub Pages

1.  Make sure your project files (`index.html`, `style.css`, `script.js`) are in a GitHub repository.
2.  Go to your repository settings on GitHub.
3.  Navigate to the "Pages" section in the left sidebar.
4.  Under "Build and deployment", select "Deploy from a branch" as the source.
5.  Choose the branch where your code is located (usually `main` or `master`).
6.  Select the `/(root)` folder.
7.  Click "Save".
8.  GitHub will build and deploy your site. It might take a few minutes. The URL for your live site will be displayed in the GitHub Pages settings once it's ready (usually `https://<your-username>.github.io/<repository-name>/`). 