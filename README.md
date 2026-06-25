# Google Cloud BigQuery Release Hub 🚀

A premium, glassmorphic web application built with **Python Flask** and vanilla **HTML5, CSS, and JavaScript** that aggregates, filters, and formats live BigQuery release notes from the official Google Cloud feeds.

---

## ✨ Features

*   🔄 **Live Feed Aggregation**: Dynamically fetches and parses the official BigQuery Atom release feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
*   🔍 **Keyword Search**: Instant search capability to filter updates by keywords in titles or description bodies.
*   🏷️ **Category Tags & Filtering**: Filter release notes instantly by type:
    *   `Feature` (Neon Cyan)
    *   `Changed` (Neon Amber)
    *   `Fixed` (Neon Emerald)
    *   `Deprecated` (Neon Rose)
    *   `Notice` (Neon Purple)
*   🐦 **Interactive X (Twitter) Composer**: Click any update to view its details and instantly share it on X/Twitter using the pre-composed Web Intent.
*   📋 **One-Click Share Copying**: Formats and copies updates to the clipboard with clean layout structures and immediate visual "Copied!" feedback.
*   💫 **Premium Aesthetics**: Features a dark slate responsive interface using Outfit and Plus Jakarta Sans fonts, subtle glow shadows, and a modern glassmorphic theme.

---

## 🛠️ Technology Stack

*   **Backend**: Python, Flask, Requests
*   **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Properties, Flexbox, CSS Grid), Vanilla ES6 JavaScript
*   **Fonts**: Outfit & Plus Jakarta Sans (via Google Fonts)

---

## 🚀 Getting Started

Follow these steps to run the application locally:

### 1. Prerequisites
Ensure you have Python 3.8+ installed on your machine.

### 2. Clone the Repository
```bash
git clone https://github.com/FahmidaAz/FahmidaAz-event-talks-app.git
cd FahmidaAz-event-talks-app
```

### 3. Install Dependencies
Install Flask and the Requests library using `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 4. Run the Application
Start the Flask development server:
```bash
python app.py
```

### 5. Open in Browser
Navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser.

---

## 📂 Project Structure

```text
├── static/
│   ├── css/
│   │   └── style.css      # Custom styling, glow utilities & transitions
│   └── js/
│       └── main.js        # Dynamic lists, search, filtering, and copy logic
├── templates/
│   └── index.html         # Main dashboard markup (Outfit & Plus Jakarta Sans)
├── .gitignore             # Standard Python git exclusions
├── app.py                 # Flask server and XML/Atom feed parser
├── requirements.txt       # Project python dependencies
└── README.md              # This file
```

---

## 📝 License
BigQuery Release Hub is open-source. Release note data is parsed directly from Google Cloud feeds.
