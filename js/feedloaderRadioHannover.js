const SOURCE_URL = 'https://www.radio-hannover.de/aktuell/news';
// AllOrigins Proxy
const PROXY_URL = 'https://api.allorigins.win/get?url=' + encodeURIComponent(SOURCE_URL);

const feedContainer = document.getElementById('news-feed');

// Hilfsfunktion: relative zu absolut
function absolutize(href) {
  if (!href) return null;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  return new URL(href, 'https://www.radio-hannover.de').href;
}

async function loadNews() {
  try {
    const response = await fetch(PROXY_URL);
    const data = await response.json();
    const htmlText = data.contents;

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const items = Array.from(doc.querySelectorAll('.latestnews-item'));
    if (items.length === 0) {
      feedContainer.innerHTML = '<li>Keine News gefunden.</li>';
      return;
    }

    // Nur die ersten 5 Einträge
    items.slice(0, 5).forEach(item => {
      const titleEl = item.querySelector('h6.newstitle span');
      let linkEl    = item.querySelector('a.hasTooltip, a.link_append, .newsintro a[href]');
      const dateEl  = item.querySelector('.detail_date .detail_data, .detail_data');

      if (titleEl && dateEl) {
        let url;
        if (linkEl) {
          url = absolutize(linkEl.getAttribute('href'));
        } else {
          // Fallback: Haupt-News-Seite
          url = SOURCE_URL;
        }

        const li = document.createElement('li');
        li.innerHTML = `<a href="${url}" target="_blank" rel="noopener">
                          <strong>${titleEl.textContent.trim()}</strong>
                        </a> - <em>${dateEl.textContent.trim()}</em>`;
        feedContainer.appendChild(li);
      }
    });

  } catch (error) {
    console.error('Fehler beim Laden der News:', error);
    feedContainer.innerHTML = '<li>News konnten nicht geladen werden.</li>';
  }
}

loadNews();
