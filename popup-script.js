(function() {
    if (!window.ml || !window.ml.q) {
        console.error('Popup script loader not initialized.');
        return;
    }
    const scriptUrl = window.ml.q[0][1];

    function initializePopup(config) {
        const scriptVersion = '2.4';
        console.log(`Popup Script Version: ${scriptVersion}`);

        // 1. Оновлені стилі для двоколонкового макету
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
            
            .popup-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.65); display: flex;
                justify-content: center; align-items: center; z-index: 2147483647;
                opacity: 0; visibility: hidden; transition: opacity 0.4s ease;
            }
            .popup-overlay.visible { opacity: 1; visibility: visible; }
            
            .popup-container {
                display: flex; /* Головна зміна для двоколонкового макету */
                background-color: ${config.formBackgroundColor || '#FFFFFF'};
                border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                width: 90%; max-width: 780px; /* Ваша ширина */
                font-family: 'Poppins', sans-serif;
                transform: scale(0.95); transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                overflow: hidden;
            }
            .popup-overlay.visible .popup-container { transform: scale(1); }
            
            .popup-image-column {
                width: 45%; /* Ширина лівої колонки з картинкою */
                background-image: ${config.imageUrl ? `url('${config.imageUrl}')` : 'none'};
                background-size: cover;
                background-position: center;
                display: ${config.imageUrl ? 'block' : 'none'};
            }
            
            .popup-content-column {
                width: ${config.imageUrl ? '55%' : '100%'}; /* Права колонка займає решту місця */
                padding: 40px;
                box-sizing: border-box;
                position: relative;
                text-align: left;
            }

            .close-btn {
                position: absolute; top: 15px; right: 20px;
                font-size: 28px; color: #999; cursor: pointer; line-height: 1; font-weight: 300;
            }
            
            .popup-content-column h2 { font-size: 32px; font-weight: 700; color: #1a202c; margin: 0 0 10px 0; }
            .popup-content-column p { font-size: 16px; color: #4a5568; margin: 0 0 30px 0; }
            #subscription-form { display: flex; }
            #email-input { flex-grow: 1; padding: 14px 18px; border: 1px solid #cbd5e0; border-radius: 6px 0 0 6px; font-size: 16px; box-sizing: border-box; }
            #submit-button { padding: 14px 28px; border: none; border-radius: 0 6px 6px 0; background-color: ${config.buttonColor || '#4A5568'}; color: ${config.buttonTextColor || '#FFFFFF'}; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
            #submit-button:disabled { background-color: #ccc; cursor: not-allowed; }
            #submit-button:hover:not(:disabled) { background-color: ${config.buttonHoverColor || '#2D3748'}; }
            #thank-you-message { text-align: left; }

            /* Адаптація для мобільних */
            @media (max-width: 700px) {
                .popup-container { flex-direction: column; max-width: 400px; }
                .popup-image-column { width: 100%; height: 180px; }
                .popup-content-column { width: 100%; padding: 30px; text-align: center; }
                .popup-content-column h2 { font-size: 26px; }
                #subscription-form { flex-direction: column; }
                #email-input { border-radius: 6px; margin-bottom: 10px; }
                #submit-button { border-radius: 6px; }
            }
        `;

        // 2. Оновлена HTML-структура
        const popupHTML = `
            <div class="popup-container">
                <div class="popup-image-column"></div>
                <div class="popup-content-column">
                    <span class="close-btn">&times;</span>
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

        closeButton.addEventListener('click', function() {
            const isSubscribed = thankYouMessage.style.display === 'block';
            closePopup(isSubscribed);
        });
    }

    const currentDomain = window.location.hostname;
    fetch(`${scriptUrl}?domain=${currentDomain}`)
        .then(response => response.json())
        .then(config => {
            if (config.error) throw new Error(config.error);
            initializePopup(config);
        })
        .catch(error => console.error('Popup Script Initialization Error:', error.message));
})();
