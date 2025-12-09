(function() {
    if (!window.ml || !window.ml.q) {
        console.error('Popup loader not initialized.');
        return;
    }

    // Додаємо timestamp, щоб обійти кеш jsDelivr
    const timestamp = Date.now();
    const mainScriptUrl = `https://cdn.jsdelivr.net/gh/kairon27/subskription@main/popup-script.js?t=${timestamp}`;
    
    console.log('Loading popup script from @main with cache buster');
    
    const script = document.createElement('script');
    script.src = mainScriptUrl;
    script.async = true;
    document.head.appendChild(script);
})();
