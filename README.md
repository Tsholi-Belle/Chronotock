# ChronoTrack — Multi-App Work & Timesheet Tracker

**ChronoTrack** is an intelligent desktop and web work-tracking application built specifically for generating clean, consolidated timesheet records from your everyday multi-app workflow.

---

## 🌟 Why ChronoTrack?

Instead of constantly stopping to manually log 10 minutes in VS Code, 5 minutes in Chrome, 15 minutes in Slack, and 20 minutes in Figma:
1. **Track Any App**: Add any application to your tracked catalog (VS Code, Chrome, Figma, Slack, Terminal, Notion, Zoom, Xcode, Blender, Word, Excel, Linear, etc.).
2. **Smart Session Consolidation**: Automatically merges fragmented switches into unified timesheet work blocks with intelligent time rounding (5m, 15m, 30m, 1h, or exact).
3. **Auto-Categorization Rules**: Regex and substring rules automatically map window titles and URLs to Clients, Projects, and Billing categories.
4. **1-Click Timesheet Export**: Generate records formatted for direct input into Jira, Workday, Clockify, Harvest, Toggl, or export to CSV, Excel, Markdown, and JSON.
5. **Interactive Day Timeline**: Visual 24-hour chronological timeline of your entire day's focus blocks and app usage.
6. **macOS Background Daemon**: Companion script that polls native active windows and frontmost applications via AppleScript / JXA.

---

## 🚀 Getting Started

### 1. Start the Web Dashboard
```bash
cd /Users/kgomotsolekganyane/.gemini/antigravity/scratch/timesheet-app
npm run dev
```
Open **http://localhost:5173** in your browser.

### 2. (Optional) Run the macOS Native Window Tracker Daemon
To automatically detect your active frontmost application and window titles:
```bash
# Terminal 1: Start API server
npm run server

# Terminal 2: Start macOS active window daemon
npm run tracker
```

---

## 📁 Key Features & Capabilities

- **Consolidated Timesheet View**: Group entries by Project, Client, Date, or App; filter by billable status; customize duration rounding.
- **Visual 24-Hour Timeline**: Hover to inspect exact start/end times, window titles, and app breakdown percentages.
- **Tracked Apps Catalog**: Enable/disable applications, add custom process names and accent colors, set default project mappings.
- **Rules Engine**: "If window title contains *'acme-checkout'* &rarr; Project: ACME Payment Revamp (Billable)".
- **Analytics & Reporting**: Billable efficiency ratio, continuous focus session averages, app time distribution charts.
- **Data Persistence & Backups**: Full JSON import/export and local storage persistence.
