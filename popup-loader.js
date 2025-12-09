(function() {
    if (!window.ml || !window.ml.q) {
        console.error('Popup loader not initialized.');
        return;
    }

    const scriptUrl = window.ml.q[0][1];

    fetch(`${scriptUrl}?action=getVersion`)
        .then(response => response.json())
        .then(data => {
            const version = data.scriptVersion || '3.0';
            
            // ⬇️ ЗМІНЕНО: Використовуємо ТЕГ замість query string
            const mainScriptUrl = `https://cdn.jsdelivr.net/gh/kairon27/subskription@${version}/popup-script.js`;
            
            console.log(`Loading popup script version: ${version}`);
            
            const script = document.createElement('script');
            script.src = mainScriptUrl;
            script.async = true;
            document.head.appendChild(script);
        })
        .catch(error => {
            console.error('Failed to load popup script version:', error);
            // Fallback: завантажуємо стабільну версію
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/gh/kairon27/subskription@3.0/popup-script.js';
            script.async = true;
            document.head.appendChild(script);
        });
})();
