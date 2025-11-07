(function() {
    // Вбудовуємо CSS стилі прямо в JavaScript
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
            background-color: #007BFF; color: white; padding: 12px 20px;
            border: none; border-radius: 5px; cursor: pointer;
            width: 100%; font-size: 16px;
        }
        #subscription-form button:hover { background-color: #0056b3; }
    `;

    // ВИПРАВЛЕНО: HTML-структура без екранування символів
    const popupHTML = `
        <div class="popup-content">
            <div id="form-container">
                <span class="close-btn">&times;</span>
                <h2>Підпишіться на новини!</h2>
                <p>Отримуйте свіжі статті та оновлення першими.</p>
                <form id="subscription-form">
                    <input type="email" id="email-input" placeholder="Введіть ваш email" required>
                    <button type="submit">Підписатись</button>
                </form>
            </div>
            <div id="thank-you-message" style="display: none;">
                <h2>Дякуємо за підписку!</h2>
                <p>Ми раді бачити вас серед наших читачів.</p>
            </div>
        </div>
    `;

    document.addEventListener('DOMContentLoaded', function() {
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        const popup = document.createElement('div');
        popup.id = 'subscription-popup';
        popup.className = 'popup-overlay';
        popup.innerHTML = popupHTML;
        document.body.appendChild(popup);

        const form = document.getElementById('subscription-form');
        const closeBtn = popup.querySelector('.close-btn');
        const formContainer = document.getElementById('form-container');
        const thankYouMessage = document.getElementById('thank-you-message');

        const popupDelay = 15000;
        const cookieExpirationDays = 30;
        const googleScriptURL = 'https://script.google.com/macros/s/AKfycbyaRXwlI_0xnhCAXIRKM8an5MVlT48rA0nI74MDJkE5xqKBL9MiOtaMg30gmm6VjD_r/exec';

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
            // ВИПРАВЛЕНО: Умова циклу for
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }

        if (!getCookie(cookieName)) {
            setTimeout(() => popup.classList.add('visible'), popupDelay);
        }

        function closePopup() {
            popup.classList.remove('visible');
            setCookie(cookieName, 'true', cookieExpirationDays);
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email-input').value;

            fetch(googleScriptURL, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ 'email': email, 'site': currentSite })
            })
            .then(() => {
                formContainer.style.display = 'none';
                thankYouMessage.style.display = 'block';
                setTimeout(closePopup, 3000);
            })
            .catch(error => console.error('Error!', error.message));
        });

        closeBtn.addEventListener('click', closePopup);
    });

})();
