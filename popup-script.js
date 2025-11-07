(function() {
    // Ця частина скрипта буде завантажена асинхронно.
    // Перевіряємо, чи ініціалізовано 'ml'
    if (!window.ml || !window.ml.q) {
        console.error('Popup script loader not initialized.');
        return;
    }

    // Отримуємо URL, переданий в ml('account', 'YOUR_SCRIPT_URL')
    const scriptUrl = window.ml.q[0][1]; 

    /**
     * Головна функція, яка створює та ініціалізує спливаючу форму.
     * @param {object} config - Об'єкт налаштувань, завантажений з Google Таблиці.
     */
    function initializePopup(config) {
        
        // 1. Оновлені стилі для дизайну з фоновим зображенням
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
            .popup-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.65);
                display: flex; justify-content: center; align-items: center; z-index: 2147483647;
                opacity: 0; visibility: hidden; transition: opacity 0.4s ease;
            }
            .popup-overlay.visible { opacity: 1; visibility: visible; }
            .popup-container {
                /* Застосовуємо колір фону та фонове зображення */
                background-color: ${config.formBackgroundColor || '#F8F5F0'};
                background-image: ${config.imageUrl ? `url('${config.imageUrl}')` : 'none'};
                background-size: cover;
                background-position: center;

                border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.25);
                width: 90%; max-width: 520px;
                font-family: 'Poppins', sans-serif;
                position: relative;
                transform: scale(0.95); transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
            }
            .popup-overlay.visible .popup-container { transform: scale(1); }
            .popup-content {
                padding: 45px; box-sizing: border-box; text-align: left;
            }
            .close-btn {
                position: absolute; top: 15px; right: 15px; font-size: 28px;
                color: #888; cursor: pointer; line-height: 1; font-weight: 300;
            }
            .popup-content h2 {
                font-size: 32px; font-weight: 700; color: #1a202c;
                margin: 0 0 10px 0; line-height: 1.2;
            }
            .popup-content p {
                font-size: 16px; color: #4a5568; margin: 0 0 30px 0;
            }
            #subscription-form { display: flex; }
            #email-input {
                flex-grow: 1; padding: 14px 18px; border: 1px solid #cbd5e0;
                border-radius: 6px 0 0 6px; font-size: 16px;
                box-sizing: border-box;
            }
            #email-input:focus { outline: none; border-color: #4A5568; }
            #submit-button {
                padding: 14px 28px; border: none; border-radius: 0 6px 6px 0;
                background-color: ${config.buttonColor || '#4A5568'};
                color: ${config.buttonTextColor || '#FFFFFF'};
                font-size: 16px; font-weight: 600; cursor: pointer;
                transition: background-color 0.2s;
            }
            #submit-button:hover { background-color: ${config.buttonHoverColor || '#2D3748'}; }
            #thank-you-message { text-align: left; }
        `;

        // 2. Оновлена (і спрощена) HTML-структура
        const popupHTML = `
            <div class="popup-container">
                <span class="close-btn">&times;</span>
                <div class="popup-content">
                    <div id="form-container">
                        <h2>${config.popupTitle}</h2>
                        <p>${config.popupText}</p>
                        <form id="subscription-form">
                            <input type="email" id="email-input" placeholder="Email" required>
                            <button type="submit" id="submit-button">${config.buttonText}</button>
                        </form>
                    </div>
                    <div id="thank-you-message" style="display: none;">
                        <h2>${config.thankYouTitle}</h2>
                        <p>${config.thankYouText}</p>
                    </div>
                </div>
            </div>
        `;

        // --- Вся подальша логіка залишається без змін ---

        // 3. Додаємо стилі та HTML на сторінку
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        const popup = document.createElement('div');
        popup.id = 'subscription-popup';
        popup.className = 'popup-overlay';
        popup.innerHTML = popupHTML;
        document.body.appendChild(popup);
        
        // 4. Отримуємо елементи та застосовуємо налаштування
        const form = document.getElementById('subscription-form');
        const closeBtn = popup.querySelector('.close-btn');
        const formContainer = document.getElementById('form-container');
        const thankYouMessage = document.getElementById('thank-you-message');

        const popupDelay = (parseInt(config.popupDelaySeconds, 10) || 10) * 1000;
        const cookieExpirationDays = parseInt(config.cookieExpirationDays, 10) || 90;
        const reminderCookieDays = parseInt(config.reminderCookieDays, 10);
        const currentSite = window.location.hostname;
        const cookieName = `subscriptionPopupShown_${currentSite}`;

        // Допоміжні функції для роботи з cookie (без змін)
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

        // 5. Логіка закриття та встановлення cookie (без змін)
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

        // Перевіряємо, чи потрібно показувати форму (без змін)
        if (!getCookie(cookieName)) {
            setTimeout(() => popup.classList.add('visible'), popupDelay);
        }
        
        // Обробка відправки форми (без змін)
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email-input').value;
            fetch(scriptUrl, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ 'email': email, 'site': currentSite })
            })
            .then(() => {
                formContainer.style.display = 'none';
                thankYouMessage.style.display = 'block';
                setTimeout(() => closePopup(true), 3000); 
            })
            .catch(error => console.error('Error submitting form:', error.message));
        });

        // Обробка закриття по кліку на хрестик (без змін)
        closeBtn.addEventListener('click', function() {
            closePopup(false); 
        });
    }

    // Головна точка входу (без змін)
    const currentDomain = window.location.hostname;
    fetch(`${scriptUrl}?domain=${currentDomain}`)
        .then(response => {
            if (!response.ok) throw new Error(`Network response error from config URL.`);
            return response.json();
        })
        .then(config => {
            if (config.error) throw new Error(config.error);
            initializePopup(config);
        })
        .catch(error => console.error('Popup Script Initialization Error:', error.message));
})();
