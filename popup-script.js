(function() {
    // Ця частина скрипта буде завантажена асинхронно
    // Переконайтесь, що у вікні є об'єкт 'ml' та його черга 'q'
    if (!window.ml || !window.ml.q) {
        console.error('MailerLite Universal script not initialized.');
        return;
    }

    // Отримуємо account ID, який передали в ml('account', 'YOUR_SCRIPT_URL')
    const scriptUrl = window.ml.q[0][1]; 

    function initializePopup(config) {
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
            .popup-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6);
                display: flex; justify-content: center; align-items: center; z-index: 2147483647;
                opacity: 0; visibility: hidden; transition: opacity 0.4s ease;
            }
            .popup-overlay.visible { opacity: 1; visibility: visible; }
            .popup-container {
                background-color: ${config.formBackgroundColor || '#FFFFFF'};
                border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                width: 90%; max-width: 720px; display: flex;
                font-family: 'Poppins', sans-serif; overflow: hidden;
                transform: scale(0.95); transition: transform 0.4s ease;
            }
            .popup-overlay.visible .popup-container { transform: scale(1); }
            .popup-image {
                width: 40%; background-size: cover; background-position: center;
                display: ${config.imageUrl ? 'block' : 'none'};
            }
            .popup-content {
                width: ${config.imageUrl ? '60%' : '100%'};
                padding: 40px; box-sizing: border-box; position: relative;
                display: flex; flex-direction: column; justify-content: center;
            }
            .close-btn {
                position: absolute; top: 15px; right: 20px; font-size: 24px;
                color: #999; cursor: pointer;
            }
            .popup-content h2 {
                font-size: 28px; font-weight: 600; color: #333;
                margin: 0 0 10px 0; text-align: left;
            }
            .popup-content p {
                font-size: 16px; color: #666; margin: 0 0 25px 0; text-align: left;
            }
            #subscription-form { display: flex; }
            #email-input {
                flex-grow: 1; padding: 12px 15px; border: 1px solid #ccc;
                border-radius: 5px 0 0 5px; font-size: 16px;
            }
            #submit-button {
                padding: 12px 25px; border: none; border-radius: 0 5px 5px 0;
                background-color: ${config.buttonColor || '#4A5568'};
                color: ${config.buttonTextColor || '#FFFFFF'};
                font-size: 16px; font-weight: 600; cursor: pointer;
                transition: background-color 0.2s;
            }
            #submit-button:hover { background-color: ${config.buttonHoverColor || '#2D3748'}; }
            #thank-you-message { text-align: left; }

            @media (max-width: 600px) {
                .popup-container { flex-direction: column; max-width: 350px; }
                .popup-image { width: 100%; height: 150px; }
                .popup-content { width: 100%; padding: 30px; }
            }
        `;

        const popupHTML = `
            <div class="popup-container">
                <div class="popup-image" style="background-image: url('${config.imageUrl || ''}');"></div>
                <div class="popup-content">
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

        // Решта логіки без змін...
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        const popup = document.createElement('div');
        popup.id = 'subscription-popup';
        popup.className = 'popup-overlay';
        popup.innerHTML = popupHTML;
        document.body.appendChild(popup);
        
        // ... (вся логіка з getCookie, setCookie, closePopup, обробниками подій)
        const form = document.getElementById('subscription-form');
        const closeBtn = popup.querySelector('.close-btn');
        const formContainer = document.getElementById('form-container');
        const thankYouMessage = document.getElementById('thank-you-message');

        const popupDelay = (parseInt(config.popupDelaySeconds, 10) || 10) * 1000;
        const cookieExpirationDays = parseInt(config.cookieExpirationDays, 10) || 90;
        const reminderCookieDays = parseInt(config.reminderCookieDays, 10) || 7;
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
            const duration = isSubscribed ? cookieExpirationDays : reminderCookieDays;
            setCookie(cookieName, 'true', duration);
        }

        if (!getCookie(cookieName)) {
            setTimeout(() => popup.classList.add('visible'), popupDelay);
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email-input').value;
            fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
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

        closeBtn.addEventListener('click', function() {
            closePopup(false); 
        });
    }

    // Головна точка входу
    const currentDomain = window.location.hostname;
    fetch(`${scriptUrl}?domain=${currentDomain}`)
        .then(response => response.json())
        .then(config => {
            if (config.error) {
                throw new Error(config.error);
            }
            initializePopup(config);
        })
        .catch(error => console.error('Popup Script Error:', error.message));
})();
