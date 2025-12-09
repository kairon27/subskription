(function() {
    // Перевіряємо, чи ініціалізовано завантажувач
    if (!window.ml || !window.ml.q) {
        console.error('Popup loader not initialized.');
        return;
    }

    // Завантажуємо основний скрипт з @main (оновлюється автоматично)
    const mainScriptUrl = 'https://cdn.jsdelivr.net/gh/kairon27/subskription@main/popup-script.js';
    
    console.log('Loading popup script from @main');
    
    const script = document.createElement('script');
    script.src = mainScriptUrl;
    script.async = true;
    document.head.appendChild(script);
})();
