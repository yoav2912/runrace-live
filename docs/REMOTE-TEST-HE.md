# בדיקה מרחוק — אתה + חבר בכל הארץ

מדריך פשוט: **שרת בענן** + **QR לפתיחת האפליקציה**.

---

## חלק א — שרת בענן (פעם אחת, ~15 דקות)

### 1. העלה את הקוד ל-GitHub

אם עדיין אין repo:

```bash
cd "d:\אפלקציה ריצה"
git init
git add .
git commit -m "Initial commit"
```

צור repo ב-[github.com/new](https://github.com/new), ואז:

```bash
git remote add origin https://github.com/YOUR_USER/runrace-live.git
git branch -M main
git push -u origin main
```

### 2. Render.com — שרת + מסד נתונים

1. היכנס ל-[render.com](https://render.com) (חינמי, עם GitHub).
2. **New → Blueprint**.
3. חבר את ה-repo שלך — Render יזהה את `render.yaml`.
4. **Apply** — נוצרים:
   - `runrace-api` (השרת)
   - `runrace-db` (PostgreSQL)
5. חכה עד **Live** (ירוק).
6. העתק את כתובת השרת, למשל:  
   `https://runrace-api-xxxx.onrender.com`

### 3. בדיקה שהשרת חי

בדפדפן: `https://YOUR-URL.onrender.com/health`  
אמור להחזיר JSON תקין.

### 4. משתני סביבה ב-Render (אופציונלי)

ב-**runrace-api → Environment** הוסף (מהקובץ `apps/mobile/.env` שלך):

| Key | Value |
|-----|--------|
| `SUPABASE_URL` | כמו ב-mobile |
| `SUPABASE_ANON_KEY` | כמו ב-mobile |
| `SUPABASE_SERVICE_ROLE_KEY` | מ-Supabase → Settings → API |

(בלי זה חלק מה-auth עלול לא לעבוד — תלוי איך אתם מתחברים.)

---

## חלק ב — עדכון האפליקציה (אצלך ואצל החבר)

ערוך `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://runrace-api-xxxx.onrender.com
EXPO_PUBLIC_SOCKET_URL=https://runrace-api-xxxx.onrender.com
```

(החלף `xxxx` בכתובת האמיתית מ-Render.)

**שניכם** צריכים **אותם** ערכי Supabase ב-`.env` (כבר אצלך).

---

## חלק ג — פתיחת האפליקציה עם QR (פיתוח)

### אצלך (מפתח)

```bash
cd "d:\אפלקציה ריצה"
npm run build -w @runrace/shared
cd apps/mobile
npm run start:tunnel
```

יופיע **QR** בטרמינל / בדפדפן.

### אצל החבר

**אופציה A — QR + tunnel (אם עובד)**

1. מתקין **Expo Go** מהחנות.
2. סורק את ה-**QR** שלך.

אם tunnel נכשל (`failed to start tunnel`):

1. אצלך: `npx expo login` (חשבון Expo חינמי)
2. `npm install` בשורש הפרויקט
3. נסה שוב `npm run dev:mobile:tunnel`

**אופציה B — בלי tunnel (הכי אמין למרחוק)**

החבר מריץ את האפליקציה **על המחשב שלו** (אותו `.env` עם כתובת Render):

```bash
git clone https://github.com/yoav2912/runrace-live.git
cd runrace-live
npm install
# ערוך apps/mobile/.env — אותה כתובת Render כמו אצלך
npm run dev:mobile
```

שניכם מתחברים ל-**אותו שרת Render** — לא צריך QR ממך ולא tunnel.

### אצלך

גם אתה פותח עם **אותו QR** (Expo Go), לא רק החבר.

---

## חלק ד — מירוץ ביחד

1. שניכם **נרשמים / מתחברים** (Supabase).
2. **Matchmaking** → אותו מרחק (למשל 1K).
3. **Ready** → ספירה → ריצה.

השרת בענן מחבר ביניכם — **לא** תלוי ב-Wi‑Fi של הבית.

---

## בעיות נפוצות

| בעיה | פתרון |
|------|--------|
| "Network request failed" | בדוק `.env` — כתובת Render נכונה, השרת Live |
| השרת "נרדם" (תוכנית חינמית) | פתיחה ראשונה אחרי שעה — חכה 30–60 שנ׳ ונסה שוב |
| Expo לא נטען לחבר | `npm run start:tunnel` (לא `start` רגיל) |
| לא נכנסים למירוץ | שני משתמשים שונים, אותו מרחק, שרת Live |

---

## סיכום בשורה

1. GitHub → Render (Blueprint) → כתובת שרת  
2. `.env` עם כתובת השרת  
3. `npm run start:tunnel` → QR לשניכם  
4. Matchmaking וריצה
