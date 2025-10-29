// admin-auth.js - Унифицированная система аутентификации
class AdminAuth {
    constructor() {
        this.SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 часа
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCKOUT_DURATION = 30 * 60 * 1000; // 30 минут
        this.init();
    }

    async init() {
        this.cleanExpiredData();
    }

    // 🔐 Аутентификация пользователя
    async authenticate(username, password) {
        try {
            // Проверка безопасности перед входом
            const securityCheck = this.checkLoginSecurity();
            if (!securityCheck.allowed) {
                throw new Error(securityCheck.message);
            }

            // Валидация входных данных
            if (!this.validateInput(username) || !this.validateInput(password)) {
                this.recordFailedAttempt();
                return false;
            }

            // Имитация проверки учетных данных (замените на реальный бэкенд)
            const isValid = await this.verifyCredentials(username, password);

            if (isValid) {
                this.createSession(username);
                this.clearSecurityData();
                return true;
            } else {
                this.recordFailedAttempt();
                return false;
            }

        } catch (error) {
            console.error('Auth error:', error);
            this.recordFailedAttempt();
            return false;
        }
    }

    // 🔐 Проверка учетных данных (тестовые данные)
    async verifyCredentials(username, password) {
        // Тестовые учетные данные для разработки
        const testCredentials = {
            'admin': 'admin123',
            'maf_admin': 'password'
        };

        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return testCredentials[username] === password;
    }

    // 🔐 Создание сессии
    createSession(username) {
        const session = {
            username: username,
            expires: Date.now() + this.SESSION_DURATION,
            createdAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
            lastActivity: Date.now()
        };

        localStorage.setItem('adminSession', JSON.stringify(session));
        this.logSecurityEvent('session_created', { user: username });
    }

    // 🔐 Проверка сессии
    validateSession() {
        try {
            const session = this.getSession();
            if (!session) return false;

            // Проверка срока действия
            if (Date.now() > session.expires) {
                this.clearSession();
                return false;
            }

            // Проверка активности (15 минут бездействия)
            if (Date.now() - session.lastActivity > 15 * 60 * 1000) {
                this.clearSession();
                return false;
            }

            // Обновляем время активности
            session.lastActivity = Date.now();
            localStorage.setItem('adminSession', JSON.stringify(session));

            return true;

        } catch (error) {
            this.clearSession();
            return false;
        }
    }

    // 🔐 Защита от brute-force
    checkLoginSecurity() {
        const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
        const lastAttempt = parseInt(localStorage.getItem('lastLoginAttempt') || '0');
        const blockUntil = parseInt(localStorage.getItem('blockUntil') || '0');

        // Сброс попыток через 15 минут
        if (Date.now() - lastAttempt > 15 * 60 * 1000) {
            localStorage.setItem('loginAttempts', '0');
        }

        // Проверка блокировки
        if (Date.now() < blockUntil) {
            const minutesLeft = Math.ceil((blockUntil - Date.now()) / (60 * 1000));
            return { 
                allowed: false, 
                message: `Слишком много попыток. Попробуйте через ${minutesLeft} минут.` 
            };
        }

        return { 
            allowed: attempts < this.MAX_LOGIN_ATTEMPTS,
            attemptsLeft: this.MAX_LOGIN_ATTEMPTS - attempts
        };
    }

    // 🔐 Запись неудачной попытки
    recordFailedAttempt() {
        const attempts = parseInt(localStorage.getItem('loginAttempts') || '0') + 1;
        localStorage.setItem('loginAttempts', attempts.toString());
        localStorage.setItem('lastLoginAttempt', Date.now().toString());

        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
            const blockUntil = Date.now() + this.LOCKOUT_DURATION;
            localStorage.setItem('blockUntil', blockUntil.toString());
            this.logSecurityEvent('account_blocked', { blockUntil });
        }
    }

    // 🔐 Валидация входных данных
    validateInput(input) {
        if (typeof input !== 'string') return false;
        if (input.length > 100) return false;
        if (/[<>{}]/.test(input)) return false;
        return true;
    }

    // 🔐 Получение сессии
    getSession() {
        try {
            return JSON.parse(localStorage.getItem('adminSession'));
        } catch (error) {
            return null;
        }
    }

    // 🔐 Очистка сессии
    clearSession() {
        localStorage.removeItem('adminSession');
        this.logSecurityEvent('session_cleared');
    }

    // 🔐 Очистка данных безопасности
    clearSecurityData() {
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastLoginAttempt');
        localStorage.removeItem('blockUntil');
    }

    // 🔐 Логирование событий
    logSecurityEvent(eventType, details = {}) {
        const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        logs.unshift({
            timestamp: new Date().toISOString(),
            event: eventType,
            details: details,
            userAgent: navigator.userAgent
        });

        if (logs.length > 100) logs.pop();
        localStorage.setItem('securityLogs', JSON.stringify(logs));
    }

    // 🔐 Очистка устаревших данных
    cleanExpiredData() {
        const blockUntil = parseInt(localStorage.getItem('blockUntil') || '0');
        if (blockUntil && Date.now() > blockUntil) {
            this.clearSecurityData();
        }
    }
}

// Инициализация
const adminAuth = new AdminAuth();