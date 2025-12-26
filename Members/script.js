function showDescription(id) {
                  document.querySelectorAll(".description").forEach(el => el.style.display = "none");
                  const targetDiv = document.querySelector(`.description#${id}`);
                  if (targetDiv) {
                      targetDiv.style.display = "flex";
                  }
                  // URL を更新
                  const url = new URL(window.location);
                  url.searchParams.set('description', id);
                  window.history.pushState({}, '', url);
              }

              const params = new URLSearchParams(window.location.search);
              const section = params.get("description");
              document.querySelectorAll(".description").forEach(el => el.style.display = "none");

              if (section) {
                  const targetDiv = document.querySelector(`.description#${section}`);
                  if (targetDiv) {
                      targetDiv.style.display = "flex";
                  }
              }
      function close() {
          document.querySelectorAll(".description").forEach(el => el.style.display = "none");
          // URL からパラメータを削除
          const url = new URL(window.location);
          url.searchParams.delete('description');
          window.history.pushState({}, '', url);
      }

      // ブラウザの戻る/進むボタンに対応
      window.addEventListener('popstate', function() {
          const params = new URLSearchParams(window.location.search);
          const section = params.get("description");
          document.querySelectorAll(".description").forEach(el => el.style.display = "none");
          if (section) {
              const targetDiv = document.querySelector(`.description#${section}`);
              if (targetDiv) {
                  targetDiv.style.display = "flex";
              }
          }
      });

      // Ensure clicking on the background closes the modal
      const descriptions = document.querySelectorAll(".description");
      descriptions.forEach(description => {
          description.addEventListener("click", (event) => {
              if (event.target === description) {
                  close();
              }
          });
      });