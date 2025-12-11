(function() {
    'use strict';

    // ============================================
    // ВЕРСІЯ СКРИПТА
    // ============================================
    const scriptVersion = '4.0';
    console.log(`Popup Script Version: ${scriptVersion}`);

    // ============================================
    // КОНФІГУРАЦІЯ SUPABASE
    // ============================================
    // ВАЖЛИВО: Замініть на ваші дані з Supabase
    const SUPABASE_URL = 'https://makcazualfwdlmkiebnw.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ha2NhenVhbGZ3ZGxta2llYm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDkyOTEsImV4cCI6MjA4MTAyNTI5MX0.zsJL04dO1Kwf7BiXvSHFtnGkja_Ji64lhqDxiGJgdiw';

    // ============================================
    // ЗАВАНТАЖЕННЯ КОНФІГУРАЦІЇ З SUPABASE
    // ============================================
    async function loadConfig() {
        try {
            const currentDomain = window.location.hostname;
            
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/sites?domain=eq.${currentDomain}&enabled=eq.true&select=*`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data && data.length > 0) {
                // Конвертуємо snake_case з PostgreSQL в camelCase для зручності
                const site = data[0];
                return {
                    popupTitle: site.popup_title,
                    popupText: site.popup_text,
                    popupTitleColor: site.popup_title_color,
                    popupTextColor: site.popup_text_color,
                    buttonText: site.button_text,
                    buttonColor: site.button_color,
                    buttonTextColor: site.button_text_color,
                    buttonHoverColor: site.button_hover_color,
                    closeBtnColor: site.close_btn_color,
                    formBackgroundColor: site.form_background_color,
                    imageUrl: site.image_url,
                    thankYouTitle: site.thank_you_title,
                    thankYouText: site.thank_you_text,
                    popupDelaySeconds: site.popup_delay_seconds,
                    cookieExpirationDays: site.cookie_expiration_days,
                    privacyText: site.privacy_text,
                    privacyTextColor: site.privacy_text_color
                };
            } else {
                console.warn('No popup configuration found for this domain');
                return null;
            }
        } catch (error) {
            console.error('Error loading popup config:', error);
            return null;
        }
    }

    // ============================================
    // GOOGLE ANALYTICS 4 EVENTS
    // ============================================
    function pushToDataLayer(eventName, eventParams = {}) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': eventName,
            ...eventParams
        });
        console.log(`GA4 Event: ${eventName}`, eventParams);
    }

    // ============================================
    // COOKIE ФУНКЦІЇ
    // ============================================
    function setCookie(name, value, days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    }

    function getCookie(name) {
        return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
    }

    // ============================================
    // ВІДПРАВКА ДАНИХ НА СЕРВЕР
    // ============================================
    async function submitEmail(email, scriptUrl) {
        try {
            const response = await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });
            return true;
        } catch (error) {
            console.error('Error submitting email:', error);
            return false;
        }
    }

    // ============================================
    // СТВОРЕННЯ POPUP
    // ============================================
    function createPopup(config) {
        // Стилі
        const styles = `
            <style>
                .popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 999999;
                    animation: fadeIn 0.3s ease-in;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .popup-container {
                    background: #fff;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                    position: relative;
                    animation: slideUp 0.4s ease-out;
                }

                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .close-btn {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: ${config.closeBtnColor || '#999'};
                    z-index: 10;
                    padding: 10px;
                    line-height: 1;
                    transition: color 0.2s;
                }

                .close-btn:hover {
                    color: #000;
                }

                .popup-header {
                    width: 100%;
                    overflow: hidden;
                }

                .popup-header-image {
                    width: 100%;
                    height: auto;
                    display: block;
                    object-fit: cover;
                }

                .popup-body {
                    padding: 40px 30px;
                    text-align: center;
                    background: ${config.formBackgroundColor || '#F4F1ED'};
                }

                .popup-body h2 {
                    font-size: 38px;
                    font-weight: 700;
                    color: ${config.popupTitleColor || '#1a202c'};
                    margin: 0 0 10px 0;
                }

                .popup-body p {
                    font-size: 16px;
                    color: ${config.popupTextColor || '#4a5568'};
                    margin: 0 0 30px 0;
                }

                #subscription-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                #email-input {
                    padding: 15px;
                    font-size: 16px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    outline: none;
                    transition: border-color 0.3s;
                }

                #email-input:focus {
                    border-color: ${config.buttonColor || '#4A5568'};
                }

                #submit-button {
                    padding: 15px;
                    font-size: 18px;
                    font-weight: 600;
                    background: ${config.buttonColor || '#4A5568'};
                    color: ${config.buttonTextColor || '#FFFFFF'};
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                #submit-button:hover {
                    background: ${config.buttonHoverColor || '#2D3748'};
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                #submit-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                #thank-you-message h2 {
                    font-size: 32px;
                    margin-bottom: 15px;
                }

                #thank-you-message p {
                    font-size: 18px;
                }

                @media (max-width: 600px) {
                    .popup-container {
                        width: 95%;
                    }

                    .popup-body {
                        padding: 30px 20px;
                    }

                    .popup-body h2 {
                        font-size: 28px;
                    }

                    .popup-body p {
                        font-size: 14px;
                    }
                }
            </style>
        `;

        // HTML структура
        const popupHTML = `
            <div class="popup-container">
                <span class="close-btn">&times;</span>
                <div class="popup-header">
                    ${config.imageUrl ? `<img src="${config.imageUrl}" class="popup-header-image" alt="">` : ''}
                </div>
                <div class="popup-body">
                    <div id="form-container">
                        <h2>${config.popupTitle || 'Subscribe'}</h2>
                        <p>${config.popupText || 'Get the latest updates'}</p>
                        <form id="subscription-form">
                            <input 
                                type="email" 
                                id="email-input" 
                                name="email" 
                                autocomplete="email" 
                                placeholder="Email" 
                                required
                            >
                            <button type="submit" id="submit-button">${config.buttonText || 'Subscribe'}</button>
                        </form>
                        ${config.privacyText ? `
                            <p style="font-size: 11px; color: ${config.privacyTextColor || '#999'}; margin-top: 12px; line-height: 1.3;">
                                ${config.privacyText}
                            </p>
                        ` : ''}
                        <div id="recaptcha-container"></div>
                    </div>
                    <div id="thank-you-message" style="display: none;">
                        <h2>${config.thankYouTitle || 'Thank You!'}</h2>
                        <p>${config.thankYouText || 'You have successfully subscribed.'}</p>
                    </div>
                </div>
            </div>
        `;

        // Створюємо overlay
        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        overlay.innerHTML = styles + popupHTML;
        document.body.appendChild(overlay);

        // Подія показу попапу
        pushToDataLayer('popup_view');

        // Закриття попапу
        const closeBtn = overlay.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            overlay.remove();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Обробка форми
        const form = overlay.querySelector('#subscription-form');
        const emailInput = overlay.querySelector('#email-input');
        const submitButton = overlay.querySelector('#submit-button');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = emailInput.value.trim();

            if (!email) return;

            // Подія відправки
            pushToDataLayer('popup_submit', { email_domain: email.split('@')[1] });

            // Блокуємо кнопку
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            // Відправка на сервер (Google Apps Script залишився той самий)
            const scriptUrl = window.ml && window.ml.q && window.ml.q[0] && window.ml.q[0][1];
            
            if (scriptUrl) {
                await submitEmail(email, scriptUrl);
            }

            // Подія конверсії
            pushToDataLayer('generate_lead', { 
                email_domain: email.split('@')[1],
                source: 'popup'
            });

            // Показуємо thank you
            overlay.querySelector('#form-container').style.display = 'none';
            overlay.querySelector('#thank-you-message').style.display = 'block';

            // Встановлюємо cookie
            setCookie('popup_shown', 'true', config.cookieExpirationDays || 90);

            // Закриваємо через 3 секунди
            setTimeout(() => {
                overlay.remove();
            }, 3000);
        });
    }

    // ============================================
    // ІНІЦІАЛІЗАЦІЯ
    // ============================================
    async function init() {
        // Перевіряємо cookie
        if (getCookie('popup_shown')) {
            console.log('Popup already shown to this user');
            return;
        }

        // Завантажуємо конфігурацію
        const config = await loadConfig();

        if (!config) {
            console.log('No popup configuration available');
            return;
        }

        // Показуємо попап з затримкою
        const delay = (config.popupDelaySeconds || 10) * 1000;
        
        setTimeout(() => {
            createPopup(config);
        }, delay);
    }

    // Запускаємо після завантаження DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
