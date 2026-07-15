# Project Specifications: Student Academic Companion (Academic.)

An all-in-one collaborative workspace and schedule optimizer designed for students. This application replaces fragmented resources (spreadsheets, file folders, calendar tools, chat apps) with a unified, offline-first dashboard.

---

## 1. Core Architecture & Tech Stack

- **Frontend Framework:** React 19 + Vite (JavaScript)
- **Styling System:** Vanilla CSS (no CSS frameworks)
- **Design Paradigm:** 
  - Color Surface (Light): `#E7E5E4` (Stone gray)
  - Color Surface (Dark): `##121212` 
  - Typography: `Space Mono` (Display & Body headers), `JetBrains Mono` (Metadata code blocks)
- **State & Database Layer:** firebase and firestore

---

## 2. Feature Specifications

### 2.1 Dashboard & Analytics (`Dashboard.jsx`)
- **Bevel Metrics Panel:** Tactile metrics counters showing total weekly study hours planned, total scheduled courses, and number of repository documents.
- **Study Distribution Chart:** Dynamic bar chart representing daily study routine hours (Monday through Sunday).
- **Study Group Ticker:** Sunk-in card list showing upcoming meeting details (time, course, room) for joined study circles.

### 2.2 Academic Timetable Manager (`Timetable.jsx`)
- **Calendar Panel:** Displays a listing of course schedules grouped by weekday.
- **Course Conflict Checker:** 
  - Validates potential schedule additions against existing course times.
  - Automatically raises a warning alert on overlap detection (based on day and start/end time intervals), blocking additions until fixed.

### 2.3 Smart Study Routine Planner (`Planner.jsx`)
- **Study Allocation Matrix:** Configures study hours target per course (e.g. 2h, 4h, 6h) and overall weekly target.
- **Preferred Days Checklist:** Toggles target days on which study blocks can be placed.
- **Interval-Packing Algorithm:**
  - Evaluates class schedule boundaries.
  - Automatically packs 2-hour study blocks into free slots (8:00 AM to 8:00 PM) on selected target days.
  - Avoids overlaps with both classes and previously scheduled study blocks.

### 2.4 Materials Repository (`Repository.jsx`)
- **Search & Course Filters:** Dynamic search bar (sunken well layout) and course filter dropdown menu.
- **Upload Utility:** Form to submit new notes, textbooks, or papers by course and format (PDF, PPTX, DOCX).
- **Download Tracking:** Mock download triggers that increment document download counts.

### 2.5 Collaborative Study Circles (`Groups.jsx`)
- **Group Registry Cards:** Lists study circles, courses, next meeting times, rooms, and enrolled member counts.
- **Join/Leave Switch:** Instant enrollment switch updating member metrics.
- **Add Group Form:** Upload tool to spawn new study group rooms.

---

## 3. Algorithmic Specifications

### 3.1 Interval Intersection Check (Clash Detector)
Checks if class $A$ overlaps with class $B$ on the same weekday:
$$\text{Overlap} \iff (\text{Day}_A = \text{Day}_B) \land (\text{Start}_A < \text{End}_B) \land (\text{Start}_B < \text{End}_A)$$
Operates in $O(N)$ against scheduled items, returning descriptive feedback showing where the collision occurred.

### 3.2 Interval-Packing Heuristic (Routine Builder)
Fills study gaps using greedy packing constraints:
1. Divide target days into 2-hour segments starting from `08:00` to `20:00`.
2. For each course, iteratively test segments:
   - Check if segment overlaps with a timetabled class.
   - Check if segment overlaps with an already scheduled study block.
3. If free, commit the segment as a study block for that course.
4. Stop when the target hour count or allocation limits are reached.

---

## 4. UI/UX & Tactile Physics Specs

### 4.1 Neumorphic Physics Rules
All elements use double shadows computed relative to their flat surface backgrounds:
- **Light Mode Surface (`#E7E5E4`):**
  - **Extruded (Out):** Top-Left shadow `#ffffff`, Bottom-Right shadow `#c5c3c2`
  - **Sunken (In):** Top-Left inset `#c5c3c2`, Bottom-Right inset `#ffffff`
- **Dark Mode Surface (`#1E202B`):**
  - **Extruded (Out):** Top-Left shadow `#2a2d3b`, Bottom-Right shadow `#12131b`
  - **Sunken (In):** Top-Left inset `#12131b`, Bottom-Right inset `#2a2d3b`

### 4.2 State Transitions
- **Button Hover:** Text colors transition to the primary accent color (`#006666` or `#2DD4BF`).
- **Button Active:** Box shadow switches from extruded to inset instantly on click, creating a physically clickable button press.
- **Focus Well:** Inset shadow depths double when form fields or inputs are focused.
