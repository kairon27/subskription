(function() {
    if (!window.ml || !window.ml.q) {
        console.error('Popup script loader not initialized.');
        return;
    }
    const scriptUrl = window.ml.q[0][1];

    function initializePopup(config) {
        // 4. Версійність: виводимо версію в консоль
        console.log(`Popup Script Version: ${config.scriptVersion || '1.0'}`);

        // 1. Оновлені стилі для дизайну з картинкою зверху
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
            .popup-overlay { /* ... (без змін) ... */ }
            .popup-overlay.visible { /* ... (без змін) ... */ }
            .popup-container {
                background-color: ${config.formBackgroundColor || '#FFFFFF'};
                border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                width: 90%; max-width: 450px; font-family: 'Poppins', sans-serif;
                transform: scale(0.95); transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                overflow: hidden; /* Важливо, щоб картинка не вилазила за радіус */
            }
            .popup-overlay.visible .popup-container { transform: scale(1); }
            .popup-image {
                width: 100%; height: auto; display: ${config.imageUrl ? 'block' : 'none'};
            }
            .popup-content { padding: 35px; box-sizing: border-box; position: relative; text-align: center; }
            .close-btn { /* ... (без змін) ... */ }
            .popup-content h2 { font-size: 28px; font-weight: 700; color: #1a202c; margin: 0 0 10px 0; }
            .popup-content p { font-size: 16px; color: #4a5568; margin: 0 0 25px 0; }
            #subscription-form { display: flex; flex-direction: column; }
            #email-input { /* ... (без змін) ... */ }
            #submit-button {
                /* ... (стилі кнопки без змін) ... */
                transition: background-color 0.2s;
            }
            #submit-button:disabled { background-color: #ccc; cursor: not-allowed; } /* Стиль для заблокованої кнопки */
            #submit-button:hover { /* ... (без змін) ... */ }
            #thank-you-message { text-align: center; position: relative; } /* Додали position: relative */

            @media (max-width: 480px) {
                .popup-content { padding: 30px 25px; }
                .popup-content h2 { font-size: 24px; }
            }
        `;

        // HTML-структура (додаємо хрестик в блок подяки)
        const popupHTML = `
            <div class="popup-container">
                <img src="${config.imageUrl || ''}" class="popup-image" alt="">
                <div class="popup-content">
                    <div id="form-container">
                        <span class="close-btn">&times;</span>
                        <h2>${config.popupTitle}</h2>
                        <p>${config.popupText}</p>
                        <form id="subscription-form">
                            <input type="email" id="email-input" placeholder="Email" required>
                            <button type="submit" id="submit-button">${config.buttonText}</button>
                        </form>
                    </div>
                    <div id="thank-you-message" style="display: none;">
                        <span class="close-btn">&times;</span> <!-- Додали хрестик сюди -->
                        <h2>${config.thankYouTitle}</h2>
                        <p>${config.thankYouText}</p>
                    </div>
                </div>
            </div>
        `;
        
        // --- Подальша логіка з усіма змінами ---
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
        const popup = document.createElement('div');
        popup.id = 'subscription-popup';
        popup.className = 'popup-overlay';
        popup.innerHTML = popupHTML;
        document.body.appendChild(popup);

        const form = document.getElementById('subscription-form');
        const submitButton = document.getElementById('submit-button');
        const closeButtons = popup.querySelectorAll('.close-btn'); // Тепер їх два
        // ... (решта змінних)
        const formContainer = document.getElementById('form-container');
        const thankYouMessage = document.getElementById('thank-you-message');
        const popupDelay = (parseInt(config.popupDelaySeconds, 10) || 10) * 1000;
        const cookieExpirationDays = parseInt(config.cookieExpirationDays, 10) || 90;
        const reminderCookieDays = parseInt(config.reminderCookieDays, 10);
        const thankYouDelay = (parseInt(config.thankYouDelaySeconds, 10) || 3) * 1000;
        const currentSite = window.location.hostname;
        const cookieName = `subscriptionPopupShown_${currentSite}`;

        // ... (функції setCookie, getCookie без змін)
        function setCookie(name, value, days) {
            let expires = "";
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + (value || "") + expires + "; path=/";
        }
        function getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }

        // Логіка закриття (без змін)
        function closePopup(isSubscribed) {
            popup.classList.remove('visible');
            if (isSubscribed) {
                setCookie(cookieName, 'subscribed', cookieExpirationDays);
            } else {
                if (reminderCookieDays > 0) {
                    setCookie(cookieName, 'reminder', reminderCookieDays);
                }
            }
        }

        if (!getCookie(cookieName)) {
            setTimeout(() => popup.classList.add('visible'), popupDelay);
        }
        
        // Обробка відправки форми з усіма змінами
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            // 2. Блокуємо кнопку, щоб уникнути повторних кліків
            submitButton.disabled = true;
            submitButton.innerText = 'Sending...';

            const email = document.getElementById('email-input').value;
            let country = 'Unknown';

            try {
                // 3. Визначаємо країну
                const geoResponse = await fetch('https://ipapi.co/json/');
                const geoData = await geoResponse.json();
                country = geoData.country_name || 'Unknown';
            } catch (geoError) {
                console.warn('Could not determine country:', geoError);
            }

            try {
                const response = await fetch(scriptUrl, {
                    method: 'POST',
                    // mode: 'no-cors' НЕ працює з .json() відповіддю, треба CORS
                    // Оскільки ми контролюємо обидві сторони, можна налаштувати
                    // Але для простоти зараз залишимо як є, але без then()
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ email, site: currentSite, country })
                });

                // Показуємо подяку і закриваємо через N секунд
                formContainer.style.display = 'none';
                thankYouMessage.style.display = 'block';
                setTimeout(() => closePopup(true), thankYouDelay);

            } catch (error) {
                console.error('Error submitting form:', error);
                submitButton.disabled = false; // Розблоковуємо кнопку у разі помилки
                submitButton.innerText = config.buttonText || 'Subscribe';
            }
        });

        // Обробка закриття по кліку на будь-який хрестик
        closeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Перевіряємо, чи ми в блоці подяки
                const isSubscribed = thankYouMessage.style.display === 'block';
                closePopup(isSubscribed);
            });
        });
    }

    // Головна точка входу (без змін)
    const currentDomain = window.location.hostname;
    fetch(`${scriptUrl}?domain=${currentDomain}`)
        .then(response => response.json())
        .then(config => {
            if (config.error) throw new Error(config.error);
            initializePopup(config);
        })
        .catch(error => console.error('Popup Script Initialization Error:', error.message));
})();
