// admin-auth.js
class AdminAuth {
    constructor() {
        this.sessionKey = 'adminSession';
        this.validCredentials = {
            username: 'admin',
            password: 'admin123'
        };
        this.failedAttempts = {};
        this.maxAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 минут
    }

    validateSession() {
        const session = localStorage.getItem(this.sessionKey);
        if (!session) {
            return false;
        }

        try {
            const sessionData = JSON.parse(session);
            // Проверяем, не истекла ли сессия (24 часа)
            if (Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
                this.logout();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }

    login(username, password) {
        // Проверяем блокировку
        const securityCheck = this.checkLoginSecurity(username);
        if (!securityCheck.allowed) {
            return { 
                success: false, 
                message: securityCheck.reason,
                remainingTime: securityCheck.remainingTime
            };
        }

        if (username === this.validCredentials.username && 
            password === this.validCredentials.password) {
            
            // Сбрасываем счетчик неудачных попыток
            this.resetFailedAttempts(username);
            
            const sessionData = {
                username: username,
                timestamp: Date.now(),
                ip: this.getClientIP()
            };

            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            this.logLoginAttempt(username, true);
            return { success: true, message: 'Успешный вход' };
        } else {
            // Увеличиваем счетчик неудачных попыток
            this.recordFailedAttempt(username);
            this.logLoginAttempt(username, false);
            
            const attempts = this.getFailedAttempts(username);
            const remaining = this.maxAttempts - attempts;
            
            return { 
                success: false, 
                message: `Неверные учетные данные. Осталось попыток: ${remaining}`,
                attempts: attempts,
                maxAttempts: this.maxAttempts
            };
        }
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
        window.location.href = 'admin-login.html';
    }

    getClientIP() {
        // В реальном приложении здесь будет логика получения IP
        return 'local';
    }

    getSessionInfo() {
        const session = localStorage.getItem(this.sessionKey);
        if (session) {
            return JSON.parse(session);
        }
        return null;
    }

    // 🔐 Методы безопасности
    checkLoginSecurity(username) {
        const attempts = this.getFailedAttempts(username);
        const lastAttempt = this.getLastAttemptTime(username);
        
        // Проверяем блокировку
        if (attempts >= this.maxAttempts) {
            const timeSinceLastAttempt = Date.now() - lastAttempt;
            if (timeSinceLastAttempt < this.lockoutTime) {
                const remainingTime = Math.ceil((this.lockoutTime - timeSinceLastAttempt) / 1000 / 60);
                return {
                    allowed: false,
                    reason: `Аккаунт временно заблокирован. Попробуйте через ${remainingTime} минут.`,
                    remainingTime: remainingTime
                };
            } else {
                // Сбрасываем счетчик после истечения времени блокировки
                this.resetFailedAttempts(username);
            }
        }
        
        return {
            allowed: true,
            reason: '',
            remainingTime: 0
        };
    }

    recordFailedAttempt(username) {
        const now = Date.now();
        const attempts = this.getFailedAttempts(username) + 1;
        
        this.failedAttempts[username] = {
            count: attempts,
            lastAttempt: now,
            locked: attempts >= this.maxAttempts
        };
        
        // Сохраняем в localStorage
        localStorage.setItem('adminFailedAttempts', JSON.stringify(this.failedAttempts));
    }

    resetFailedAttempts(username) {
        if (this.failedAttempts[username]) {
            delete this.failedAttempts[username];
            localStorage.setItem('adminFailedAttempts', JSON.stringify(this.failedAttempts));
        }
    }

    getFailedAttempts(username) {
        if (!this.failedAttempts[username]) {
            return 0;
        }
        return this.failedAttempts[username].count || 0;
    }

    getLastAttemptTime(username) {
        if (!this.failedAttempts[username]) {
            return 0;
        }
        return this.failedAttempts[username].lastAttempt || 0;
    }

    // 🔐 Дополнительные методы безопасности
    validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
            requirements: {
                length: password.length >= minLength,
                upperCase: hasUpperCase,
                lowerCase: hasLowerCase,
                numbers: hasNumbers,
                specialChar: hasSpecialChar
            }
        };
    }

    // 🔐 Логирование попыток входа
    logLoginAttempt(username, success, ip = 'local') {
        const logEntry = {
            username: username,
            success: success,
            timestamp: new Date().toISOString(),
            ip: ip
        };

        // Сохраняем в localStorage (в реальном приложении - на сервер)
        const logs = JSON.parse(localStorage.getItem('adminLoginLogs') || '[]');
        logs.unshift(logEntry);
        
        // Сохраняем только последние 100 записей
        if (logs.length > 100) {
            logs.splice(100);
        }
        
        localStorage.setItem('adminLoginLogs', JSON.stringify(logs));
    }

    // 🔐 Инициализация данных безопасности при загрузке
    initSecurityData() {
        // Загружаем историю неудачных попыток из localStorage
        const storedAttempts = localStorage.getItem('adminFailedAttempts');
        if (storedAttempts) {
            this.failedAttempts = JSON.parse(storedAttempts);
        }
    }

    // 🔐 Получение статистики безопасности
    getSecurityStats() {
        const logs = JSON.parse(localStorage.getItem('adminLoginLogs') || '[]');
        const failedLogs = logs.filter(log => !log.success);
        const successfulLogs = logs.filter(log => log.success);
        
        return {
            totalAttempts: logs.length,
            failedAttempts: failedLogs.length,
            successfulAttempts: successfulLogs.length,
            lastAttempt: logs[0] || null,
            recentFailed: failedLogs.slice(0, 5)
        };
    }
}

// Создаем глобальный экземпляр и инициализируем
const adminAuth = new AdminAuth();
adminAuth.initSecurityData();