(function() {
    if (!window.ml || !window.ml.q) {
        console.error('Popup script loader not initialized.');
        return;
    }
    const scriptUrl = window.ml.q[0][1];

    function initializePopup(config) {
        const scriptVersion = '2.7';
        console.log(`Popup Script Version: ${scriptVersion}`);

        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
            
            .popup-overlay { /* ... (без змін) ... */ }
            .popup-overlay.visible { /* ... (без змін) ... */ }
            
            .popup-container {
                background-color: ${config.formBackgroundColor || '#FFFFFF'};
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                width: 90%;
                max-width: 480px;
                font-family: 'Poppins', sans-serif;
                transform: scale(0.95);
                transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                overflow: hidden; /* Важливо, щоб картинка мала заокруглені кути зверху */
                position: relative;
            }
            .popup-overlay.visible .popup-container { transform: scale(1); }
            
            .popup-image {
                display: ${config.imageUrl ? 'block' : 'none'};
                width: 100%;
                height: auto;
            }

            .popup-content {
                padding: 30px 35px;
                box-sizing: border-box;
                text-align: center;
            }
            
            .close-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                font-size: 28px;
                color: ${config.imageUrl ? '#FFFFFF' : '#999'}; /* Білий хрестик на картинці, сірий без неї */
                text-shadow: ${config.imageUrl ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'}; /* Тінь для кращої видимості */
                z-index: 10;
                cursor: pointer;
            }
            
            .popup-content h2 { font-size: 28px; font-weight: 700; color: #1a202c; margin: 0 0 10px 0; }
            .popup-content p { font-size: 16px; color: #4a5568; margin: 0 0 25px 0; }
            #subscription-form { display: flex; flex-direction: column; }
            #email-input { /* ... (без змін) ... */ }
            #submit-button { /* ... (без змін) ... */ }
            #submit-button:disabled { /* ... (без змін) ... */ }
            #submit-button:hover:not(:disabled) { /* ... (без змін) ... */ }
            #thank-you-message { text-align: center; }

            @media (max-width: 480px) {
                .popup-content { padding: 25px; }
                .popup-content h2 { font-size: 24px; }
            }
        `;

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
        // (Копіюємо всю логіку з попереднього кроку, вона правильна)
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

    // Головна точка входу скрипта
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
