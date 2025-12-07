# إصلاح مشكلة تحميل الملفات في Electron

## المشكلة
عند محاولة رفع ملف مودل (FBX/GLB) في تطبيق Electron، كان شريط التحميل يظهر بشكل لا نهائي ولا يتم تحميل الملف.

## السبب
1. `electron-adapter.js` كان يقرأ الملف من نظام الملفات ويضع البيانات في خاصية `file.data`
2. دوال التحميل في `main.js` كانت تحاول قراءة الملف مرة أخرى باستخدام `FileReader`
3. `FileReader` لا يعمل مع الملفات المُنشأة من Electron adapter لأنها ليست ملفات حقيقية من المتصفح

## الحل
تم تعديل جميع دوال تحميل الملفات للتحقق من وجود `file.data` أولاً:

### الملفات المعدلة:
1. **scripts/electron-adapter.js**
   - إضافة إدارة حالة loading في `setupFileInputAdapter`
   - إضافة/إزالة class "loading" من label عند فتح/إغلاق نافذة اختيار الملفات

2. **scripts/main.js**
   - `onSourceChange()` - تحميل المودل الأساسي
   - `onAnimationChange()` - تحميل ملفات الأنميشن
   - `onTextureChange()` - تحميل texture عادي
   - `onPackedTextureChange()` - تحميل packed ORM texture
   - `onPBRTextureChange()` - تحميل PBR textures

### منطق الإصلاح:
```javascript
// للملفات الثنائية (FBX/GLB)
let contents;
if(file.data) {
    // الملف محمّل من Electron adapter
    contents = file.data;
} else {
    // استخدام FileReader للمتصفح
    contents = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsArrayBuffer(file);
    });
}

// للصور (Textures)
let dataURL;
if(file.data) {
    // تحويل البيانات إلى data URL
    const blob = new Blob([file.data]);
    dataURL = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(blob);
    });
} else {
    // استخدام FileReader للمتصفح
    dataURL = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}
```

## النتيجة
- تحميل الملفات يعمل بشكل صحيح في Electron
- شريط التحميل يظهر ويختفي بشكل صحيح
- التطبيق يعمل بنفس الطريقة في المتصفح وElectron
