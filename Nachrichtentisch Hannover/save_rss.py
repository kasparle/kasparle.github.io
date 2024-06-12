import requests

def save_rss_feed(url, file_path):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Überprüft, ob der Request erfolgreich war

        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(response.text)

        print(f"RSS-Feed erfolgreich in {file_path} gespeichert.")
    except requests.exceptions.RequestException as e:
        print(f"Fehler beim Abrufen des RSS-Feeds: {e}")

# Beispiel-URL eines RSS-Feeds und Pfad zur Speicherdestination
rss_feed_url = 'https://example.com/rss-feed-url'
save_path = '/path/to/save/rss_feed.xml'

save_rss_feed(rss_feed_url, save_path)
