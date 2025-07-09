# Quick Exam Timer

This is a simple static website to display countdown timers for your final exams.

## Features

*   Displays a list of exams with their dates and times.
*   Shows a live countdown for each upcoming exam.
*   Indicates when an exam time has passed.
*   Sorts exams by date.
*   Upload exam schedule files (PDF, PNG, JPEG) - automatically processed using AI
*   Saves imported schedule in the browser's `localStorage`.
*   Remembers the user's selection of exams.
*   Clean, modern UI with responsive design.

## Setup

1.  Clone or download this repository.
2.  Open the `index.html` file in your web browser.

## Usage

*   **Importing Your Schedule (Required on First Use):**
    1.  Click the "Manage Schedule / Import" button to reveal the import options.
    2.  Upload your exam schedule as a PDF, PNG, or JPEG file. The system will automatically extract and process the schedule information using AI.


*   **Viewing Countdowns:** Once imported and selected, the countdowns for your chosen exams will be displayed.
*   **Updating/Resetting:**
    *   To import a new schedule, click "Manage Schedule / Import" and repeat the import steps. This will replace the previously saved schedule.
    *   To clear the saved schedule completely, click "Manage Schedule / Import" and then "Remove all exams" (this button clears all stored data).
*   Your custom schedule and your selection are saved in your browser's `localStorage` and will be loaded automatically on future visits until cleared or replaced.

## Deployment to GitHub Pages

1.  Make sure your project files (`index.html`, `style.css`, `script.js`) are in a GitHub repository.
2.  Go to your repository settings on GitHub.
3.  Navigate to the "Pages" section in the left sidebar.
4.  Under "Build and deployment", select "Deploy from a branch" as the source.
5.  Choose the branch where your code is located (usually `main` or `master`).
6.  Select the `/(root)` folder.
7.  Click "Save".
8.  GitHub will build and deploy your site. It might take a few minutes. The URL for your live site will be displayed in the GitHub Pages settings once it's ready (usually `https://<your-username>.github.io/<repository-name>/`). 