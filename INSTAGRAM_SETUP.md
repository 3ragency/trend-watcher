# Instagram Scraper Setup

## Настройка Instagram scraping через Instaloader

Этот проект использует [Instaloader](https://instaloader.github.io/) для прямого scrapping'а Instagram без использования платных API.

### Шаг 1: Установка зависимостей

```bash
# Создать виртуальное окружение Python
python3 -m venv venv

# Активировать виртуальное окружение  
source venv/bin/activate  # macOS/Linux
# или
venv\Scripts\activate  # Windows

# Установить Instaloader
pip install instaloader
```

### Шаг 2: Настройка credentials

Добавьте в файл `.env` credentials от Instagram аккаунта:

```bash
# Instagram (Instaloader)
INSTAGRAM_USERNAME="your_instagram_username"
INSTAGRAM_PASSWORD="your_instagram_password"
```

**Важно:**
- Используйте отдельный аккаунт для scraping (не ваш основной)
- Убедитесь, что у аккаунта нет 2FA (двухфакторной аутентификации)
- Instagram может временно заблокировать аккаунт при частых запросах

### Шаг 3: Тестирование

Протестируйте scraper напрямую:

```bash
./venv/bin/python3 scripts/instagram_scraper.py cristiano 5 "YOUR_USERNAME" "YOUR_PASSWORD"
```

Это должно вернуть JSON с данными профиля и 5 последних постов.

### Troubleshooting

**429 Too Many Requests**
- Instagram блокирует слишком частые запросы
- Используйте авторизацию через credentials
- Делайте небольшие паузы между запросами

**2FA Required**
- Отключите двухфакторную аутентификацию для аккаунта scraping
- Или используйте session file (см. документацию Instaloader)

**Login Failed**
- Проверьте правильность username/password
- Убедитесь, что аккаунт не заблокирован Instagram

## Альтернатива: Apify

Если Instaloader не работает, можно вернуться к Apify:

```bash
# В .env используйте:
APIFY_INSTAGRAM_ACTOR_ID="shu8hvrXbJbY3Eb9W"
# И закомментируйте INSTAGRAM_USERNAME и INSTAGRAM_PASSWORD
```
