(function() {
    // Перевіряємо, чи ініціалізовано об'єкт-завантажувач
    if (!window.ml || !window.ml.q) {
        console.error('Popup script loader not initialized.');
        return;
    }
    // Отримуємо URL скрипта з конфігурації завантажувача
    const scriptUrl = window.ml.q[0][1];

    /**
     * Головна функція, яка створює та ініціалізує спливаючу форму.
     * @param {object} config - Об'єкт налаштувань, завантажений з Google Таблиці.
     */
    function initializePopup(config) {
        const scriptVersion = '3.10'; // Оновлено версію
        console.log(`Popup Script Version: ${scriptVersion}`);

        // --- Функція для DataLayer ---
        function pushToDataLayer(eventName) {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                'event': eventName,
                'popup_id': 'subscription_form_v1',
                'popup_title': config.popupTitle || 'Subscription'
            });
            console.log(`DataLayer Push: ${eventName}`); // Для перевірки в консолі
        }

        // Динамічні стилі для форми
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
            
            .popup-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.7); display: flex;
                justify-content: center; align-items: center; z-index: 2147483647;
                opacity: 0; visibility: hidden; transition: opacity 0.4s ease;
            }
            .popup-overlay.visible { opacity: 1; visibility: visible; }
            
            .popup-container {
                background-color: ${config.formBackgroundColor || '#F4F1ED'};
                border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                width: 90%; max-width: 780px;
                font-family: 'Poppins', sans-serif;
                transform: scale(0.95); transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                position: relative;
            }
            .popup-overlay.visible .popup-container { transform: scale(1); }
            
            .popup-header {
                padding: 20px 30px;
                display: ${config.imageUrl ? 'block' : 'none'};
            }
            .popup-header-image {
                width: 100%; height: auto;
            }

            .popup-body {
                padding: 10px 40px 40px 40px;
                text-align: center;
            }

            .close-btn {
                position: absolute; top: 5px; right: 5px;
                font-size: 28px; color: ${config.closeBtnColor || '#999'}; cursor: pointer; line-height: 1; font-weight: 300;
            }
            
            .popup-body h2 { font-size: 38px; font-weight: 700; color: ${config.popupTitleColor || '#1a202c'}; margin: 0 0 10px 0; }
            .popup-body p { font-size: 16px; color: ${config.popupTextColor || '#4a5568'}; margin: 0 0 30px 0; }

            #subscription-form { display: flex; margin-bottom: 20px; }
            #email-input { flex-grow: 1; padding: 16px 20px; border: 1px solid #dcdcdc; border-radius: 8px; font-size: 16px; }
            #submit-button { margin-left: 10px; padding: 16px 35px; border: none; border-radius: 8px; background-color: ${config.buttonColor || '#4A5568'}; color: ${config.buttonTextColor || '#FFFFFF'}; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
            #submit-button:disabled { background-color: #ccc; cursor: not-allowed; }
            #submit-button:hover:not(:disabled) { background-color: ${config.buttonHoverColor || '#2D3748'}; }
            
            #recaptcha-container {
                display: flex; justify-content: center;
            }

            #thank-you-message { text-align: center; }

            @media (max-width: 600px) {
                .popup-body { padding: 10px 25px 30px 25px; }
                .popup-body h2 { font-size: 28px; }
                #subscription-form { flex-direction: column; }
                #submit-button { margin-left: 0; margin-top: 10px; }
            }
        `;

        // HTML-структура форми (з правильними атрибутами для автозаповнення)
        const popupHTML = `
    <div class="popup-container">
        <span class="close-btn">&times;</span>
        <div class="popup-header">
            <img src="${config.imageUrl || ''}" class="popup-header-image" alt="">
        </div>
        <div class="popup-body">
            <div id="form-container">
                <h2>${config.popupTitle}</h2>
                <p>${config.popupText}</p>
                <form id="subscription-form">
                    <input 
                        type="email" 
                        id="email-input" 
                        name="email" 
                        autocomplete="email" 
                        placeholder="Email" 
                        required
                    >
                    <button type="submit" id="submit-button">${config.buttonText}</button>
                </form>
                
                <!-- ⬇️ ДОДАЄМО ЦЕЙ БЛОК ⬇️ -->
                ${config.privacyText ? `
                    <p style="font-size: 11px; color: ${config.privacyTextColor || '#666'}; margin-top: 12px; line-height: 1.3; text-align: center;">
                        ${config.privacyText}
                    </p>
                ` : ''}
                <!-- ⬆️ КІНЕЦЬ БЛОКУ ⬆️ -->
                
                <div id="recaptcha-container"></div>
            </div>
            <div id="thank-you-message" style="display: none;">
                <h2>${config.thankYouTitle}</h2>
                <p>${config.thankYouText}</p>
            </div>
        </div>
    </div>
`;

        
        // --- Подальша логіка ---
        
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
        const closeButton = popup.querySelector('.close-btn');
        const formContainer = document.getElementById('form-container');
        const thankYouMessage = document.getElementById('thank-you-message');
        
        const popupDelay = (parseInt(config.popupDelaySeconds, 10) || 10) * 1000;
        const cookieExpirationDays = parseInt(config.cookieExpirationDays, 10) || 90;
        const reminderCookieDays = parseInt(config.reminderCookieDays, 10);
        const thankYouDelay = (parseInt(config.thankYouDelaySeconds, 10) || 3) * 1000;
        const currentSite = window.location.hostname;
        const cookieName = `subscriptionPopupShown_${currentSite}`;

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

        // Перевірка та показ форми
        if (!getCookie(cookieName)) {
            setTimeout(() => {
                popup.classList.add('visible');
                // 1. DATALAYER: Подія показу форми
                pushToDataLayer('popup_view');
            }, popupDelay);
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 2. DATALAYER: Подія успішної відправки
            pushToDataLayer('popup_submit');

            submitButton.disabled = true;
            const email = document.getElementById('email-input').value;

            // Миттєво показуємо подяку
            formContainer.style.display = 'none';
            thankYouMessage.style.display = 'block';

            setTimeout(() => closePopup(true), thankYouDelay);

            // Асинхронно у фоні відправляємо дані
            (async () => {
                let country = 'Unknown';
                try {
                    const geoResponse = await fetch('https://ipapi.co/json/');
                    if (geoResponse.ok) {
                        const geoData = await geoResponse.json();
                        country = geoData.country_name || 'Unknown';
                    }
                } catch (geoError) {
                    console.warn('Could not determine country:', geoError);
                }

                try {
                    await fetch(scriptUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({ email, site: currentSite, country })
                    });
                } catch (error) {
                    console.error('Error submitting form data in the background:', error);
                }
            })();
        });

        closeButton.addEventListener('click', function() {
            const isSubscribed = thankYouMessage.style.display === 'block';
            closePopup(isSubscribed);
        });
    }

    const currentDomain = window.location.hostname;
    fetch(`${scriptUrl}?domain=${currentDomain}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok from config URL.`);
            }
            return response.json();
        })
        .then(config => {
            if (config.error) {
                throw new Error(config.error);
            }
            initializePopup(config);
        })
        .catch(error => console.error('Popup Script Initialization Error:', error.message));
})();
