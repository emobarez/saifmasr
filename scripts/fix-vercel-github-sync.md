# إصلاح مشكلة عدم تحديث Vercel عند commit إلى GitHub

## الأسباب المحتملة:

### 1. **عدم تفعيل Git Integration:**
- المشروع مربوط بـ Vercel محلياً فقط
- لا يوجد webhook من GitHub إلى Vercel

### 2. **إعدادات الفرع غير صحيحة:**
- Vercel يراقب فرع مختلف عن master
- إعدادات production branch غير صحيحة

### 3. **مشاكل Webhook:**
- GitHub webhook تالف أو معطل
- مشاكل في إعدادات المستودع

## الحلول المرحلية:

### الحل الأول: إعادة ربط المشروع في Vercel Dashboard

1. **اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)**
2. **ابحث عن مشروع `saifmasr`**
3. **اذهب إلى Settings > Git**
4. **تأكد من أن المستودع مربوط بـ:**
   - Repository: `emobarez/saifmasr`
   - Branch: `master`
5. **إذا لم يكن مربوط، اضغط على "Connect Git Repository"**

### الحل الثاني: استخدام Vercel CLI لإعادة الربط

```bash
# إلغاء الربط الحالي
npx vercel remove saifmasr --yes

# إعادة الربط مع GitHub
npx vercel link

# عند السؤال، اختر:
# - Link to existing project: No
# - Project name: saifmasr
# - In which directory is your code located: ./
# - Want to modify these settings: No
```

### الحل الثالث: فحص GitHub Repository Settings

1. **اذهب إلى GitHub Repository: https://github.com/emobarez/saifmasr**
2. **Settings > Webhooks**
3. **تأكد من وجود webhook لـ Vercel**
4. **إذا لم يوجد، أعد ربط المشروع في Vercel**

### الحل الرابع: التحقق من إعدادات الفرع

```bash
# تأكد من أنك على الفرع الصحيح
git branch

# إذا كنت على فرع آخر، انتقل إلى master
git checkout master

# تأكد من أن master محدث
git pull origin master
```

## الحل السريع (مؤقت):

```bash
# في كل مرة تريد نشر التحديثات:
git add .
git commit -m "feat: Update [وصف التحديث]"
git push origin master
npx vercel --prod
```

## اختبار الحل:

1. **قم بتعديل بسيط في الكود**
2. **commit و push إلى GitHub:**
   ```bash
   git add .
   git commit -m "test: Check auto-deployment"
   git push origin master
   ```
3. **انتظر دقيقتين وتحقق من Vercel Dashboard**
4. **يجب أن ترى deployment جديد تلقائياً**

## معلومات المشروع الحالي:

- **Vercel Project ID:** `prj_FiRXNGgEauL7kbgexzBXKaGPeIVv`
- **GitHub Repository:** `https://github.com/emobarez/saifmasr`
- **Current Branch:** `master`
- **Last Manual Deployment:** https://saifmasr-brz7bov5s-essam-refats-projects.vercel.app

## للمساعدة الإضافية:

إذا استمرت المشكلة، تحقق من:
1. **Vercel Dashboard > Project Settings > Git**
2. **GitHub Repository Settings > Webhooks**
3. **Vercel Build Logs** للأخطاء

---

**ملاحظة:** الحل الأمثل هو إعادة ربط المشروع بـ GitHub في Vercel Dashboard لضمان التحديث التلقائي.