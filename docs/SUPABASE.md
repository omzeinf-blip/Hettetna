# إعداد Supabase

## 1) المفاتيح (Keys)

من إعدادات مشروعك في Supabase (قسم **API Keys**) انسخ:

| المتغير | القيمة | ملاحظة |
|---|---|---|
| `SUPABASE_URL` | Project URL | عام |
| `SUPABASE_ANON_KEY` | المفتاح العام (publishable / anon) | آمن؛ الحماية بسياسات RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | المفتاح **السري** (secret / service role) | **سري جدًا**. يُوضع في إعدادات الاستضافة وملف `.env.local` فقط |

لا ترسل المفتاح السري في أي محادثة ولا تضعه في الكود. المشروع يقرؤه على الخادم فقط ولا يصل للمتصفح أبدًا (لأنه بدون البادئة `NEXT_PUBLIC_`).

## 2) تشغيل الـ Migration (يحتاج موافقتك)

الملف: `supabase/migrations/20261025030000_initial_schema.sql`

- **إضافي فقط**: ينشئ جداول جديدة ولا يحذف أو يعدّل أي بيانات.
- يتوقف بخطأ واضح إن وُجد أي جدول من جداوله مسبقًا (حتى لا يتعارض مع شيء موجود).
- ينشئ: `staff_profiles`, `properties`, `projects`, `inquiries`, `contact_settings`, `rate_limit_hits`، ودوال `is_staff()`/`is_admin()`، وسياسات RLS، ومخزن الصور `property-images`.

التشغيل: افتح **SQL Editor** في Supabase، الصق محتوى الملف، ثم **Run**. (أو اطلب من المساعد تطبيقه بعد موافقتك.)

## 3) إعداد المصادقة (Auth)

1. افتح إعدادات **Authentication** وعطّل خيار **Allow new users to sign up** (السماح بتسجيل مستخدمين جدد). بهذا لا يستطيع أحد من العامة إنشاء حساب.
2. لا حاجة لأي مزوّد دخول اجتماعي؛ المشروع يستخدم البريد وكلمة المرور فقط.

## 4) إنشاء أول مدير (بأمان)

1. من **Authentication → Users** اختر **Add user → Create new user**، أدخل البريد وكلمة مرور قوية، وفعّل **Auto Confirm User**.
2. افتح **SQL Editor** وشغّل محتوى `docs/first-admin.sql` بعد استبدال الاسم والبريد.
3. يجب أن تظهر النتيجة `INSERT 0 1`. إن ظهرت `INSERT 0 0` فالبريد غير مطابق.
4. سجّل الدخول من `/admin/login`.

> **مهم**: إنشاء حساب في Supabase **لا يمنح أي صلاحية**. الصلاحية تأتي فقط من وجود صف فعّال في جدول `staff_profiles`. لإضافة موظف لاحقًا: أنشئ مستخدمه ثم أضف صفًا بدور `agent` بنفس الطريقة. لإيقاف موظف اجعل `active = false`.

## 5) التحقق بعد التشغيل (قراءة فقط)

```sql
-- يجب أن تظهر 6 جداول وكلها rowsecurity = true
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;

-- السياسات المنشأة
select tablename, policyname, cmd, roles from pg_policies where schemaname in ('public','storage') order by 1,2;

-- مخزن الصور
select id, public, file_size_limit, allowed_mime_types from storage.buckets;
```

اختبارات الصلاحيات الكاملة في [SECURITY.md](SECURITY.md).

## نسخ احتياطي

فعّل النسخ الاحتياطي التلقائي من إعدادات Supabase (حسب خطتك) قبل إدخال بيانات حقيقية كثيرة.

---

**حالة مشروعك:** طُبّق الـ Migration على مشروع Supabase الخاص بك بتاريخ 2026-10-25 وتم التحقق منه (6 جداول، 20 سياسة، مخزن الصور). المتبقي لك: الخطوتان 3 و4 (تعطيل التسجيل العام وإنشاء أول مدير).
