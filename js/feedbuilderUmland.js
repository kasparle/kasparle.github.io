const list = document.getElementById('news-list');
const details = document.getElementById('details');
const feedButtons = document.querySelectorAll('.feed-menu button');
const feedLogo = document.getElementById('feed-logo');
let currentActiveLi = null;

function absolutize(href) {
  if (!href) return null;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  return new URL(href, 'https://www.leine-on.de').href;
}

// Logo-Pfade je Feed
const feedLogos = {
  "haz.de": "img/Logos/01_logo_HAZ.png",
  "leine-on.de": "img/Logos/14_logo_LeineOn.png",
  "con-nect.de": "img/Logos/13_logo_CON.png",
  "garbsen-city-news.de": "img/Logos/15_logo_GCN.png",
  "altkreisblitz.de": "img/Logos/16_logo_Altkreisblitz.jpg",
  "neustaedter-zeitung.de": "img/Logos/17_logo_Neustaedter_Zeitung.png",
  "default": "img/Anzeigerhochhaus.png"
};

function updateLogo(feedUrl) {
  let logoPath = feedLogos.default;
  for (const key in feedLogos) {
    if (feedUrl.includes(key)) {
      logoPath = feedLogos[key];
      break;
    }
  }
  feedLogo.src = logoPath;
}

// Helfer: Listeneintrag mit Responsive-Logik
function renderListItem(title, description, pubDate, link) {
  const li = document.createElement('li');
  li.textContent = title;

  li.addEventListener('click', () => {
    if (window.innerWidth <= 912) {
  const existing = li.querySelector(".dropdown-details");
  if (existing) {
    existing.classList.remove("show");
    setTimeout(() => existing.remove(), 300); // nach Animation entfernen
    li.classList.remove("active");
    return;
  }
  document.querySelectorAll("#news-list li .dropdown-details").forEach(el => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  });
  document.querySelectorAll("#news-list li").forEach(el => el.classList.remove("active"));

  li.classList.add("active");
  const dropdown = document.createElement("div");
  dropdown.className = "dropdown-details";
  dropdown.innerHTML = `
    <h3><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
    <p>${description}</p>
    <p class="pubdate">${pubDate}</p>
  `;
  li.appendChild(dropdown);

  // kleine Pause, dann .show aktivieren → Animation läuft
  requestAnimationFrame(() => dropdown.classList.add("show"));

    } else {
      // Desktop: rechte Spalte
      if (currentActiveLi) currentActiveLi.classList.remove('active');
      li.classList.add('active');
      currentActiveLi = li;

      details.innerHTML = `
        <div class="text-box">
          <h2><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h2>
          <p>${description}</p>
          <p class="pubdate">${pubDate}</p>
        </div>
      `;
    }
  });

  return li;
}

async function loadFeed(feedUrl) {
  const isHaz = feedUrl.includes("haz.de");
  const isLeineOn = feedUrl.includes("leine-on.de");
  const isCON = feedUrl.includes("con-nect.de");
    
 // Logo aktualisieren
  updateLogo(feedUrl);

  const proxyUrl = (isHaz || isLeineOn || isCON)
    ? 'https://api.allorigins.win/get?url=' + encodeURIComponent(feedUrl)
    : 'https://api.allorigins.win/raw?url=' + encodeURIComponent(feedUrl);

  list.innerHTML = '<li class="placeholder">⏳ Lade Feed...</li>';
  details.innerHTML = '<p class="placeholder">Wähle eine Überschrift, um die Beschreibung zu sehen.</p>';
  currentActiveLi = null;


  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Fehler beim Abrufen des Feeds');

    const data = (isHaz || isLeineOn || isCON) ? await response.json() : null;
    const content = (isHaz || isLeineOn || isCON) ? data.contents : await response.text();

    // 👉 Leine-On und CON behandeln
    if (isLeineOn || isCON) {
      const doc = new DOMParser().parseFromString(content, 'text/html');
      let items = Array.from(doc.querySelectorAll('.result-list-item'));

      if (items.length === 0) {
        list.innerHTML = '<li class="placeholder">Keine News gefunden.</li>';
        return;
      }

      list.innerHTML = '';
      items.slice(0, 10).forEach(item => {
        const titleEl = item.querySelector('span.result-title a');
        const linkEl = item.querySelector('span.result-title a[href]');
        const descriptionEl = item.querySelector('span.result-teaser');
        const dateEl = item.querySelector('.add-info');

        if (titleEl && dateEl) {
          const link = linkEl ? absolutize(linkEl.getAttribute('href')) : feedUrl;
          const title = titleEl.textContent.trim();
          const description = descriptionEl?.textContent.trim() || '';
          const pubDate = dateEl.textContent.trim();
          list.appendChild(renderListItem(title, description, pubDate, link));
        }
      });
      return; // frühzeitig raus, da Leine-On oder CON verarbeitet wurde
    }


    // 👉 HAZ + normale RSS-Feeds behandeln
         
      const xml = new DOMParser().parseFromString(content, 'application/xml');
    let items = Array.from(xml.querySelectorAll('item'));

    if (isHaz) {
      items = items.filter(item => {
        const link = item.querySelector("link")?.textContent || "";
        return link.includes("www.haz.de/lokales/umland");
      });

      items.sort((a, b) => {
        return new Date(b.querySelector("pubDate")?.textContent || 0) -
               new Date(a.querySelector("pubDate")?.textContent || 0);
      });

      items = items.slice(0, 10);
    }

    if (items.length === 0) {
      list.innerHTML = '<li class="placeholder">Keine Elemente im Feed gefunden.</li>';
      return;
    }

    list.innerHTML = "";

    items.forEach(item => {
      const title = item.querySelector('title')?.textContent || 'Ohne Titel';
      const description = item.querySelector('description')?.textContent || 'Ohne Beschreibung';
      const pubDate = item.querySelector('pubDate')?.textContent || 'Datum nicht bekannt';
      const link = item.querySelector('link')?.textContent || '#';
      list.appendChild(renderListItem(title, description, pubDate, link));
    });

  } catch (err) {
    list.innerHTML = '<li class="placeholder">Fehler beim Laden des Feeds.</li>';
    details.innerHTML = `<p class="placeholder">Fehler: ${err.message}</p>`;
    console.error(err);
  }
}

// Feed-Auswahl
feedButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    feedButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadFeed(btn.dataset.feed);
  });
});

// Standard-Feed beim Start laden
loadFeed(feedButtons[0].dataset.feed);
