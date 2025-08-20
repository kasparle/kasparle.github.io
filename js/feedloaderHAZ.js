async function loadFeed() {
      const url = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.haz.de/arc/outboundfeeds/rss/");
      try {
        const response = await fetch(url);
        const data = await response.json();
        const parser = new DOMParser();
        const xml = parser.parseFromString(data.contents, "application/xml");

        // Alle Items aus dem Feed holen
        const items = Array.from(xml.querySelectorAll("item"));

        // Nur Artikel mit "www.haz.de/lokales" im Link nehmen
        const filtered = items.filter(item => {
          const link = item.querySelector("link")?.textContent || "";
          return link.includes("www.haz.de/lokales");
        });

        // Nach Datum sortieren (neueste zuerst)
        filtered.sort((a, b) => {
          return new Date(b.querySelector("pubDate").textContent) - new Date(a.querySelector("pubDate").textContent);
        });

        // Die 5 neuesten nehmen
        const latest = filtered.slice(0, 5);

        // HTML-Ausgabe
        const list = document.getElementById("feedHAZ");
        latest.forEach(item => {
          const title = item.querySelector("title").textContent;
          const link = item.querySelector("link").textContent;
          const pubDate = new Date(item.querySelector("pubDate").textContent);

          const li = document.createElement("li");
          li.innerHTML = `
            <a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a>
            <br/><time datetime="${pubDate.toISOString()}">${pubDate.toLocaleString("de-DE")}</time>
          `;
          list.appendChild(li);
        });

      } catch (err) {
        console.error("Fehler beim Laden des Feeds:", err);
      }
    }

    loadFeed();