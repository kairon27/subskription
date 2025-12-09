(function() {
    if (!window.ml || !window.ml.q) {
        console.error('Popup loader not initialized.');
        return;
    }

    // Просто завжди завантажуємо ОСТАННІЙ реліз (latest)
    const mainScriptUrl = 'https://cdn.jsdelivr.net/gh/kairon27/subskription@latest/popup-script.js';
    
    console.log('Loading latest popup script');
    
    const script = document.createElement('script');
    script.src = mainScriptUrl;
    script.async = true;
    document.head.appendChild(script);
})();
