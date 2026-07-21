# Estudy Student Workspace 🎓

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

**Estudy** is a premium, high-fidelity academic companion and productivity workspace designed for university students. It serves as an all-in-one routine dashboard to organize lecture schedules, manage study files, search peer repositories, and take interactive AI-generated quizzes.

---

## ✨ Key Features

### 📂 Nested Course Workspaces
* **Subject Folders:** Access all your courses in a dedicated directory. Clicking on a course drills down into its specific routine workspace.
* **Consolidated Subtabs:** Each course contains nested subtabs for **Resources** (lecture slides, notes) and **Quizzes** (exam prep) specific to that subject.
* **Mutations:** Create or delete courses, assigning custom Course Codes, Titles, and Lecture Room locations.

### ⏱️ Persistent Study Stopwatch & Statistics
* **Reload-Safe Timer:** Replaced static values with a live learning stopwatch that tracks your active study sessions. It uses `localStorage` timestamps to resume ticking seamlessly across page reloads.
* **Dynamic Donut Charts:** Tracks logged daily study minutes and renders visual circular progress relative to your daily study targets.

### 📅 Smart Class & Task Scheduler
* **ICS Parser & Event Creator:** Upload `.ics` calendar files or manually input schedule items.
* **Routine Classifiers:** Toggle the "Is Class" checkbox on events. Weekly lectures automatically populate **Today's Classes** on your dashboard, while meetings or project check-ins flow into a 7-day chronological **Upcoming Tasks** feed.
* **Conflict Checks:** Built-in validation algorithm checks for time overlaps and alerts you to schedule clashes.

### ☁️ Supabase Storage Uploads (PDF, DOCX, Video)
* **Actual File Uploads:** Upload documents straight to your Supabase Storage bucket.
* **Auto-Size Computations:** Files sizes (`KB` / `MB`) are automatically calculated from selected file blobs.
* **Word Document Support:** Support for `.docx`/`.doc` file formats alongside PDF, image, and video resources, styled with custom Microsoft Word-themed icons.
* **Visibility Toggles:** Toggle files between "Private" or "Make visible to everyone" to manage sharing.

### 🤖 Prompt-Driven AI Quiz Generator
* **Gemini/ChatGPT Optimization:** Copies an optimized template prompt to clipboard. Paste this prompt along with your slides into an AI to generate a quiz matching our schema.
* **Instant MCQ Feedback:** Shuffles questions and option arrays dynamically. Selecting a choice provides immediate correct (green) or incorrect (red) indicator locks.
* **Theory Self-Grading:** Answers remain hidden until submission. Compares your input side-by-side with model solutions, allowing you to self-grade with "Correct" (1 pt) or "Incorrect" (0 pt) buttons.
* **Attempts History:** Saves results to the database and logs attempts chronologically below each quiz so you can track your progress.

### 🤝 Standalone Peers & Friends Network
* **Peers Tab:** Send friend requests to registered students. Incoming pending requests show badge notifications.
* **Shared Libraries:** Tapping an accepted friend displays their profile details and public resources. Click "Add to My Resources" to copy files into your repository folder.
* **Global Search:** Dedicated Global Search page lets you query all publicly shared study guides uploaded across the system.

### 📱 Responsive Mobile Layout & Design
* **Slide Drawer:** Fixed top header and hidden navigation sidebar that slides in on mobile viewports ($\le$ 768px).
* **Jet-Black Charcoal Theme:** Styled with a modern charcoal palette (`#09090B` background, `#121214` sidebar, `#18181B` cards, `#27272A` borders) and emerald green/sapphire blue accents.

---

## 🛠️ Technology Stack

* **Frontend:** React 18, Vite 8, Framer Motion (animations), Phosphor Icons
* **Backend:** Supabase (Auth, PostgreSQL Relational Database, Storage Buckets)

---

## 🚀 Setting Up the Project

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/estudy-workspace.git
cd estudy-workspace
npm install
```

### 2. Configure Environment Credentials (`.env`)
Create a `.env` file in the root of the project directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-string-here
```

### 3. Setup PostgreSQL Database Schema
Go to your **Supabase Dashboard > SQL Editor**, paste the SQL table definitions from `implementation_plan.md`, and click **Run**. This creates the `profiles`, `courses`, `schedule`, `files`, `quizzes`, `study_sessions`, `groups`, `friendships`, and `quiz_attempts` tables.

### 4. Create Storage Bucket
1. Go to your **Supabase Dashboard > Storage**.
2. Click **New Bucket**, name it **`resources`**, and toggle it to **Public**.
3. Run the following RLS Policies in the SQL Editor to authorize public uploads/downloads:
   ```sql
   create policy "Allow Public Downloads" on storage.objects for select using ( bucket_id = 'resources' );
   create policy "Allow Public Uploads" on storage.objects for insert with check ( bucket_id = 'resources' );
   create policy "Allow Public Deletes" on storage.objects for delete using ( bucket_id = 'resources' );
   ```

### 5. Launch the Application
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.
