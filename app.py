import os
import re
import urllib.parse
from xml.etree import ElementTree
import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NAMESPACE = {"atom": "http://www.w3.org/2005/Atom"}

def parse_release_note_type(title, content):
    """Categorize the release note type based on keywords in title or content."""
    text_to_search = f"{title} {content}".lower()
    
    if "deprecated" in text_to_search or "deprecation" in text_to_search:
        return "Deprecated"
    elif "feature" in text_to_search or "new feature" in text_to_search:
        return "Feature"
    elif "fixed" in text_to_search or "fix" in text_to_search:
        return "Fixed"
    elif "changed" in text_to_search or "update" in text_to_search:
        return "Changed"
    elif "announcement" in text_to_search or "notice" in text_to_search:
        return "Notice"
    else:
        return "Update"

def clean_html_content(content_html):
    """Clean up and format HTML content from the feed to fit our UI design."""
    if not content_html:
        return ""
    # Standardize links to open in a new tab
    content_html = re.sub(r'<a\s+(href="[^"]+")', r'<a \1 target="_blank" rel="noopener noreferrer"', content_html)
    return content_html

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        # Parse Atom XML
        root = ElementTree.fromstring(response.content)
        entries = []
        
        for entry in root.findall("atom:entry", ATOM_NAMESPACE):
            id_val = entry.find("atom:id", ATOM_NAMESPACE)
            title_val = entry.find("atom:title", ATOM_NAMESPACE)
            updated_val = entry.find("atom:updated", ATOM_NAMESPACE)
            published_val = entry.find("atom:published", ATOM_NAMESPACE)
            content_val = entry.find("atom:content", ATOM_NAMESPACE)
            
            id_str = id_val.text if id_val is not None else ""
            title_str = title_val.text if title_val is not None else "Untitled Release"
            updated_str = updated_val.text if updated_val is not None else ""
            published_str = published_val.text if published_val is not None else ""
            
            # Content can be HTML
            content_str = content_val.text if content_val is not None else ""
            content_str = clean_html_content(content_str)
            
            # Parse type
            update_type = parse_release_note_type(title_str, content_str)
            
            # Make a tweet-friendly text snippet (plain text, max 200 chars)
            # Remove HTML tags for plain text snippet
            plain_text = re.sub(r'<[^>]*>', '', content_str)
            # Normalize whitespace
            plain_text = " ".join(plain_text.split())
            
            tweet_text = f"BigQuery Release ({update_type}): {title_str}\n\n{plain_text}"
            if len(tweet_text) > 230:
                tweet_text = tweet_text[:227] + "..."
            
            tweet_url = f"https://twitter.com/intent/tweet?text={urllib.parse.quote(tweet_text)}"
            
            entries.append({
                "id": id_str,
                "title": title_str,
                "updated": updated_str or published_str,
                "published": published_str,
                "content": content_str,
                "type": update_type,
                "plain_text": plain_text,
                "tweet_url": tweet_url
            })
            
        return jsonify({"success": True, "releases": entries})
        
    except Exception as e:
        app.logger.error(f"Error fetching release notes: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
