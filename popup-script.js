(function() {
    if (!window.ml || !window.ml.q) {
        console.error('Popup script loader not initialized.');
        return;
    }
    const scriptUrl = window.ml.q[0][1];

    function initializePopup(config) {
        const scriptVersion = '2.3';
        console.log(`Popup Script Version: ${scriptVersion}`);

        // 1. Оновлені стилі для нового дизайну
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
                position: relative; /* Важливо для позиціонування хрестика */
                background-color: ${config.formBackgroundColor || '#FFFFFF'};
                border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                width: 90%; max-width: 480px; /* Трохи збільшимо ширину */
                font-family: 'Poppins', sans-serif;
                transform: scale(0.95); transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                overflow: hidden;
            }
            .popup-overlay.visible .popup-container { transform: scale(1); }
            
            .close-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                z-index: 10; /* Щоб був поверх картинки */
                font-size: 28px; color: #999; cursor: pointer; line-height: 1; font-weight: 300;
            }
            
            .popup-image {
                display: ${config.imageUrl ? 'block' : 'none'} !important;
                width: 100% !important; height: auto !important; max-width: 100% !important;
                margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important;
            }
            
            .popup-content {
                padding: 10px; /* Як ви і просили */
                padding-top: 25px; /* Додамо відступ зверху */
                padding-bottom: 30px; /* І знизу */
                box-sizing: border-box; text-align: center;
            }
            
            .popup-content h2 { font-size: 28px; font-weight: 700; color: #1a202c; margin: 0 0 10px 0; }
            .popup-content p { font-size: 16px; color: #4a5568; margin: 0 0 25px 0; }
            #subscription-form { display: flex; flex-direction: column; padding: 0 20px; }
            #email-input { width: 100%; padding: 14px 18px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 16px; margin-bottom: 10px; box-sizing: border-box; }
            #submit-button { width: 100%; padding: 14px 25px; border: none; border-radius: 6px; background-color: ${config.buttonColor || '#4A5568'}; color: ${config.buttonTextColor || '#FFFFFF'}; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
            #submit-button:disabled { background-color: #ccc; cursor: not-allowed; }
            #submit-button:hover:not(:disabled) { background-color: ${config.buttonHoverColor || '#2D3748'}; }
            #thank-you-message { text-align: center; }

            @media (max-width: 480px) {
                .popup-content { padding: 15px 10px 25px 10px; }
                .popup-content h2 { font-size: 24px; }
                #subscription-form { padding: 0 15px; }
            }
        `;

        // 2. Оновлена HTML-структура
        const popupHTML = `
            <div class="popup-container">
                <span class="close-btn">&times;</span>
                <img src="${config.imageUrl || ''}" class="popup-image" alt="">
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
        const closeButton = popup.querySelector('.close-btn'); // Тепер він один
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

        // Тепер один обробник для одного хрестика
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
