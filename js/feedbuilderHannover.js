const list = document.getElementById('news-list');
const details = document.getElementById('details');
const feedButtons = document.querySelectorAll('.feed-menu button');
const feedLogo = document.getElementById('feed-logo');
let currentActiveLi = null;

function absolutize(href) {
  if (!href) return null;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  return new URL(href, 'https://www.radio-hannover.de').href;
}

// Logos je Feed
const feedLogos = {
  "haz.de": "img/Logos/01_logo_HAZ.png",
  "neuepresse.de": "img/Logos/02_logo_NP.png",
  "ndr.de": "img/Logos/03_logo_NDR1NDS.svg",
  "sat1regional.de": "img/Logos/04_logo_dpa.png",
  "zeit.de": "img/Logos/05_logo_Die-Zeit_sw.webp",
  "t-online.de": "img/Logos/06_logo_t-online.png",
  "radio-hannover.de": "img/Logos/07_logo_Radio_Hannover.png",
  "fahrgastfernsehen.online": "img/Logos/08_logo_Fahrgastfernsehen.png",
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
      // Mobile Ansicht → Dropdown
      const existing = li.querySelector(".dropdown-details");
      if (existing) {
        existing.classList.remove("show");
        setTimeout(() => existing.remove(), 300);
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
      requestAnimationFrame(() => dropdown.classList.add("show"));
    } else {
      // Desktop → rechte Spalte
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

// 🔹 Dein Node.js-Server (z. B. Render, Railway, etc.)
const proxyBase = "http://localhost:3000/proxy?url=";

async function loadFeed(feedUrl) {
  const isHaz = feedUrl.includes("haz.de");
  const isFahrgastfernsehen = feedUrl.includes("api.fahrgastfernsehen.online");
  const isRadioHannover = feedUrl.includes("radio-hannover.de");

  updateLogo(feedUrl);

  const proxyUrl = proxyBase + encodeURIComponent(feedUrl);

  list.innerHTML = '<li class="placeholder">⏳ Lade Feed...</li>';
  details.innerHTML = '<p class="placeholder">Wähle eine Überschrift, um die Beschreibung zu sehen.</p>';
  currentActiveLi = null;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Fehler beim Abrufen des Feeds');

    const contentType = response.headers.get("content-type") || "";
    const textContent = await response.text();

    // 🔹 Radio Hannover
    if (isRadioHannover) {
      const doc = new DOMParser().parseFromString(textContent, 'text/html');
      const items = Array.from(doc.querySelectorAll('.latestnews-item'));
      list.innerHTML = "";
      items.slice(0, 10).forEach(item => {
        const title = item.querySelector('h6.newstitle span')?.textContent.trim() || "(kein Titel)";
        const linkEl = item.querySelector('a.hasTooltip, a.link_append, .newsintro a[href]');
        const link = linkEl ? absolutize(linkEl.getAttribute('href')) : feedUrl;
        const pubDate = item.querySelector('.detail_date .detail_data, .detail_data')?.textContent.trim() || "";
        const description = item.querySelector('.newsintro p')?.textContent.trim() || "Keine Beschreibung verfügbar.";
        list.appendChild(renderListItem(title, description, pubDate, link));
      });
      return;
    }

    // 🔹 Fahrgastfernsehen
    if (isFahrgastfernsehen) {
      const parsed = JSON.parse(textContent);
      let allEntries = [];
      if (Array.isArray(parsed)) {
        parsed.forEach(block => {
          if (block && Array.isArray(block.entries)) {
            block.entries.forEach(e => {
              e.__block = block;
              allEntries.push(e);
            });
          }
        });
      }
      let posts = allEntries.filter(e => e && e.type === "post");
      posts.sort((a, b) => new Date(b.publish_from) - new Date(a.publish_from));
      posts = posts.slice(0, 10);

      list.innerHTML = "";
      posts.forEach(post => {
        const title = post.title || "(ohne Titel)";
        const pubDate = post.publish_from || "";
        const id = String(post.id ?? post.extID ?? "");
        const link = `https://www.fahrgastfernsehen.city/beitrag/${id}`;
        let description = "Keine Beschreibung verfügbar.";
        if (Array.isArray(post.kacheln)) {
          const alt = post.kacheln.find(k => k?.text?.trim());
          if (alt) description = alt.text;
        }
        list.appendChild(renderListItem(title, description, pubDate, link));
      });
      return;
    }

    // 🔹 HAZ & normale RSS-Feeds
    const xml = new DOMParser().parseFromString(textContent, 'application/xml');
    let items = Array.from(xml.querySelectorAll('item'));
    if (isHaz) {
      items = items.filter(item => (item.querySelector("link")?.textContent || "").includes("hannover"));
      items.sort((a, b) => new Date(b.querySelector("pubDate")?.textContent || 0) - new Date(a.querySelector("pubDate")?.textContent || 0));
      items = items.slice(0, 10);
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

// Standard-Feed laden
loadFeed(feedButtons[0].dataset.feed);
