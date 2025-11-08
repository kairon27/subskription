(function() {
    if (!window.ml || !window.ml.q) {
        console.error('Popup script loader not initialized.');
        return;
    }
    const scriptUrl = window.ml.q[0][1];

    function initializePopup(config) {
        // Версійність
        const scriptVersion = config.scriptVersion || '2.0';
        console.log(`Popup Script Version: ${scriptVersion}`);
        if (scriptVersion !== '2.1') {
            console.warn('You are using an outdated version of the popup script. Please clear CDN cache.');
        }

        // Оновлені стилі з !important для зображення
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
            .popup-overlay { /* ... (без змін) ... */ }
            .popup-container {
                background-color: ${config.formBackgroundColor || '#FFFFFF'};
                border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                width: 90%; max-width: 450px; font-family: 'Poppins', sans-serif;
                transform: scale(0.95); transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                overflow: hidden;
            }
            .popup-overlay.visible .popup-container { transform: scale(1); }
            
            /* --- КЛЮЧОВІ ЗМІНИ ТУТ --- */
            .popup-image {
                display: ${config.imageUrl ? 'block' : 'none'} !important;
                width: 100% !important;
                height: auto !important;
                max-width: 100% !important; /* Обнуляємо можливий max-width ззовні */
                margin: 0 !important; /* Обнуляємо можливі відступи */
                padding: 0 !important; /* Обнуляємо можливі падінги */
                border: none !important; /* Обнуляємо можливі рамки */
                box-shadow: none !important; /* Обнуляємо можливі тіні */
            }
            
            .popup-content { padding: 35px; box-sizing: border-box; position: relative; text-align: center; }
            .close-btn { /* ... (без змін) ... */ }
            .popup-content h2 { /* ... (без змін) ... */ }
            .popup-content p { /* ... (без змін) ... */ }
            #subscription-form { /* ... (без змін) ... */ }
            #email-input { /* ... (без змін) ... */ }
            #submit-button { /* ... (без змін) ... */ }
            #submit-button:disabled { /* ... (без змін) ... */ }
            #thank-you-message { /* ... (без змін) ... */ }

            @media (max-width: 480px) { /* ... (без змін) ... */ }
        `;

        const popupHTML = `
            <div class="popup-container">
                <img src="${config.imageUrl || ''}" class="popup-image" alt="Subscription offer">
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
                        <span class="close-btn">&times;</span>
                        <h2>${config.thankYouTitle}</h2>
                        <p>${config.thankYouText}</p>
                    </div>
                </div>
            </div>
        `;
        
        // --- Вся подальша логіка залишається без змін ---
        // (включаючи додавання стилів, HTML, обробники подій, функції cookie і т.д.)
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
        const closeButtons = popup.querySelectorAll('.close-btn');
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

        if (!getCookie(cookieName)) {
            setTimeout(() => popup.classList.add('visible'), popupDelay);
        }
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            submitButton.disabled = true;
            submitButton.innerText = 'Sending...';
            let country = 'Unknown';
            try {
                const geoResponse = await fetch('https://ipapi.co/json/');
                const geoData = await geoResponse.json();
                country = geoData.country_name || 'Unknown';
            } catch (geoError) {
                console.warn('Could not determine country:', geoError);
            }
            try {
                const email = document.getElementById('email-input').value;
                await fetch(scriptUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ email, site: currentSite, country })
                });
                formContainer.style.display = 'none';
                thankYouMessage.style.display = 'block';
                setTimeout(() => closePopup(true), thankYouDelay);
            } catch (error) {
                console.error('Error submitting form:', error);
                submitButton.disabled = false;
                submitButton.innerText = config.buttonText || 'Subscribe';
            }
        });

        closeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const isSubscribed = thankYouMessage.style.display === 'block';
                closePopup(isSubscribed);
            });
        });
    }

    const currentDomain = window.location.hostname;
    fetch(`${scriptUrl}?domain=${currentDomain}`)
        .then(response => response.json())
        .then(config => {
            if (config.error) throw new Error(config.error);
            config.scriptVersion = '2.1'; // Встановлюємо версію тут для наочності
            initializePopup(config);
        })
        .catch(error => console.error('Popup Script Initialization Error:', error.message));
})();
