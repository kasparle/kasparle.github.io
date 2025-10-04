// Sobald alles geladen ist
    window.addEventListener("load", () => {
      const loader = document.getElementById("loader-overlay");
      const content = document.getElementById("container");

      // Overlay ausblenden
      loader.classList.add("hidden");

      // Seite nach kurzer Verzögerung zeigen
      setTimeout(() => {
        content.style.display = "inline-flex";
      }, 600); // entspricht der transition-Dauer
    });
