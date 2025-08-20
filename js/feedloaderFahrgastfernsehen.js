  (async function loadFeed() {
    const log = (msg) => {
      const el = document.getElementById('log');
      if (el) el.textContent += (el.textContent ? "\n" : "") + msg;
      console.log(msg);
    };

    const feedContainerFF = document.getElementById('rss-feed');
    if (!feedContainerFF) {
      console.error('#rss-feed nicht gefunden!');
      return;
    }

    const apiURL  = 'https://corsproxy.io/?' + encodeURIComponent('https://api.fahrgastfernsehen.online/wp-json/uestra/v9/entry/start/de');
    const siteURL = 'https://corsproxy.io/?' + encodeURIComponent('https://www.fahrgastfernsehen.city/');

    try {
      // 1) API laden
      const apiResp = await fetch(apiURL);
      const apiData = await apiResp.json();

      // entries einsammeln
      let allEntries = [];
      if (Array.isArray(apiData)) {
        apiData.forEach(block => {
          if (block && Array.isArray(block.entries)) allEntries.push(...block.entries);
        });
      } else if (apiData && Array.isArray(apiData.entries)) {
        allEntries = apiData.entries;
      }

      // nur Posts
      let posts = allEntries.filter(e => e && e.type === 'post' && (e.id || e.extID));
      if (!posts.length) {
        feedContainerFF.innerHTML = '<li>Keine Posts gefunden.</li>';
        return;
      }

      // sortieren + limitieren
      posts.sort((a,b) => new Date(b.publish_from) - new Date(a.publish_from));
      posts = posts.slice(0, 10);

      // 2) Startseite laden & Links extrahieren
      const siteResp = await fetch(siteURL);
      const siteHtml = await siteResp.text();
      const parser = new DOMParser();
      const siteDoc = parser.parseFromString(siteHtml, 'text/html');

      // Map: ID -> absoluter Link
      const linkById = new Map();
      siteDoc.querySelectorAll('a[href*="/beitrag/"]').forEach(a => {
        const rawHref = a.getAttribute('href') || '';
        const href = rawHref.startsWith('http')
          ? rawHref
          : 'https://www.fahrgastfernsehen.city' + rawHref;

        const m = href.match(/\/beitrag\/(\d+)(?:-|$)/);
        if (m && m[1]) linkById.set(m[1], href);
      });

      // 3) Ausgeben
      posts.forEach(post => {
        const id = String(post.id ?? post.extID ?? '');
        const title = post.title || '(ohne Titel)';
        const date  = post.publish_from || '';

        // Versuch: Link von Startseite
        let link = id && linkById.get(id);

        // Fallback: reine ID-Route (oft reicht /beitrag/<id>)
        if (!link && id) {
          link = `https://www.fahrgastfernsehen.city/beitrag/${id}`;
        }

        const li = document.createElement('li');
        li.innerHTML = link
          ? `<a href="${link}" target="_blank" rel="noopener"><strong>${title}</strong></a> – <em>${date}</em>`
          : `<strong>${title}</strong> – <em>${date}</em> <span style="color:#999">(kein Link gefunden)</span>`;
        feedContainerFF.appendChild(li);
      });

      if (!feedContainerFF.children.length) {
        feedContainerFF.innerHTML = '<li>Keine passenden Links gefunden.</li>';
      }
    } catch (err) {
      console.error(err);
      feedContainerFF.innerHTML = '<li>Feed konnte nicht geladen werden.</li>';
      log(String(err));
    }
  })();