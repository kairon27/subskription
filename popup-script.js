(function() {
    // Вставте сюди URL-адресу вашого веб-додатку Google Apps Script
    const googleScriptURL = 'https://script.google.com/macros/s/AKfycbwaFx7knHsKATLpNwQVoATYY3Mtq6XCu4mtVgSAP1GXVYhA1AEaqvXr15L5-tAreBLC/exec';

    /**
     * Головна функція, яка створює та ініціалізує спливаючу форму.
     * @param {object} config - Об'єкт налаштувань, завантажений з Google Таблиці.
     */
    function initializePopup(config) {
        
        // 1. Створюємо динамічні стилі на основі налаштувань
        const styles = `
            .popup-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.6); display: flex;
                justify-content: center; align-items: center; z-index: 1000;
                opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            .popup-overlay.visible {
                opacity: 1; visibility: visible;
            }
            .popup-content {
                background-color: #fff; padding: 30px; border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: 90%;
                max-width: 400px; text-align: center; position: relative;
                font-family: Arial, sans-serif; transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            .popup-overlay.visible .popup-content {
                transform: scale(1);
            }
            .popup-content h2 { margin-top: 0; color: #333; }
            .popup-content p { color: #666; }
            .close-btn {
                position: absolute; top: 10px; right: 15px; font-size: 28px;
                font-weight: bold; color: #aaa; cursor: pointer;
            }
            .close-btn:hover { color: #333; }
            #subscription-form input[type="email"] {
                width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ccc;
                border-radius: 5px; box-sizing: border-box;
            }
            #subscription-form button {
                background-color: ${config.buttonColor || '#007BFF'};
                color: ${config.buttonTextColor || '#FFFFFF'};
                padding: 12px 20px; border: none; border-radius: 5px;
                cursor: pointer; width: 100%; font-size: 16px;
                transition: background-color 0.2s ease;
            }
            #subscription-form button:hover {
                background-color: ${config.buttonHoverColor || '#0056b3'};
            }
        `;

        // 2. Створюємо HTML-структуру на основі налаштувань
        const popupHTML = `
            <div class="popup-content">
                <div id="form-container">
                    <span class="close-btn">&times;</span>
                    <h2>${config.popupTitle || 'Підпишіться на новини!'}</h2>
                    <p>${config.popupText || 'Отримуйте свіжі статті та оновлення першими.'}</p>
                    <form id="subscription-form">
                        <input type="email" id="email-input" placeholder="${config.inputPlaceholder || 'Введіть ваш email'}" required>
                        <button type="submit">${config.buttonText || 'Підписатись'}</button>
                    </form>
                </div>
                <div id="thank-you-message" style="display: none;">
                    <h2>${config.thankYouTitle || 'Дякуємо за підписку!'}</h2>
                    <p>${config.thankYouText || 'Ми раді бачити вас серед наших читачів.'}</p>
                </div>
            </div>
        `;

        // 3. Додаємо стилі та HTML на сторінку
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        const popup = document.createElement('div');
        popup.id = 'subscription-popup';
        popup.className = 'popup-overlay';
        popup.innerHTML = popupHTML;
        document.body.appendChild(popup);

        // 4. Отримуємо доступ до створених елементів
        const form = document.getElementById('subscription-form');
        const closeBtn = popup.querySelector('.close-btn');
        const formContainer = document.getElementById('form-container');
        const thankYouMessage = document.getElementById('thank-you-message');

        // 5. Застосовуємо налаштування та логіку
        const popupDelay = (parseInt(config.popupDelaySeconds, 10) || 15) * 1000;
        const cookieExpirationDays = parseInt(config.cookieExpirationDays, 10) || 30;
        const reminderCookieDays = parseInt(config.reminderCookieDays, 10) || 7;
        const currentSite = window.location.hostname;
        const cookieName = `subscriptionPopupShown_${currentSite}`;

        // Допоміжні функції для роботи з cookie
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

        // Функція закриття форми. Встановлює cookie на різний час.
        function closePopup(isSubscribed) {
            popup.classList.remove('visible');
            const duration = isSubscribed ? cookieExpirationDays : reminderCookieDays;
            setCookie(cookieName, 'true', duration);
        }

        // Перевіряємо, чи потрібно показувати форму
        if (!getCookie(cookieName)) {
            setTimeout(() => popup.classList.add('visible'), popupDelay);
        }
        
        // Обробка успішної відправки форми
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email-input').value;
            fetch(googleScriptURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ 'email': email, 'site': currentSite })
            })
            .then(() => {
                formContainer.style.display = 'none';
                thankYouMessage.style.display = 'block';
                // Закриваємо вікно і встановлюємо довгий cookie, бо користувач підписався
                setTimeout(() => closePopup(true), 3000); 
            })
            .catch(error => console.error('Error submitting form:', error.message));
        });

        // Обробка закриття по кліку на хрестик
        closeBtn.addEventListener('click', function() {
            // Закриваємо вікно і встановлюємо короткий cookie-нагадування
            closePopup(false); 
        });
    }

    // Головна точка входу: завантажуємо налаштування і запускаємо скрипт
    document.addEventListener('DOMContentLoaded', function() {
        fetch(googleScriptURL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(config => {
                const allowedDomains = (config.allowedDomains || "").split(',');
                const currentSite = window.location.hostname;
                // Перевіряємо, чи дозволено домен, перед тим як щось робити
                if (allowedDomains.includes(currentSite)) {
                    initializePopup(config);
                } else {
                    console.warn(`Subscription form is not authorized for domain: ${currentSite}`);
                }
            })
            .catch(error => console.error('Failed to load subscription form config:', error));
    });

})();
