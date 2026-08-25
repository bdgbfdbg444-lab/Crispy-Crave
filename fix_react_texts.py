import json

path = r'src\pages\MyAccountPage.jsx'

with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

reps = {
    'O-O3O O"US': 'حسابي',
    'OU,U. O U,UO OU? OUSO OO-USO-': 'رقم الموبايل غير صحيح',
    'OU,U. O U,UO OU? OU^ UU,U.Oc O U,U.OU^O OUSO OO-USO-Oc': 'رقم الموبايل أو كلمة المرور غير صحيحة',
    'O-O_O OrOO OOU+O O O U,OO3OUSU,: ': 'حدث خطأ أثناء التسجيل: ',
    'UOO  O U,OU,U. U.O3OU, U.O3O"U,O U< U,O-O3O O" OOrO': 'هذا الرقم مسجل مسبقاً لحساب آخر',
    'U?O\'U, OO3OUSU, O U,O_OrU^U, O"OU^OU,': 'فشل تسجيل الدخول بجوجل',
    'OU,U. O U,U.U^O"O USU,': 'رقم الموبايل',
    'OO OUS O U,OO-U,U,...': 'جاري التحقق...',
    'U.OO O"O1Oc': 'متابعة',
    'OU^': 'أو',
    'OO3OUSU, O U,O_OrU^U, O"O O3OOrO_O U. Google': 'تسجيل الدخول باستخدام Google',
    'OUU,O U< O"U U.OO_O_O U<': 'أهلاً بك مجدداً',
    'UU,U.Oc O U,U.OU^O': 'كلمة المرور',
    'OO OUS O U,O_OrU^U,...': 'جاري تسجيل الدخول...',
    'OO3OUSU, O U,O_OrU^U,': 'تسجيل الدخول',
    'O U,OOU^O1 U^OOUSUSO O U,OU,U.': 'الرجوع وتغيير الرقم',
    'U+O3USO UU,U.Oc O U,U.OU^OOY': 'نسيت كلمة المرور؟',
    'OUU.U, O"USO U+O OU U,OU+O\'O O O U,O-O3O O"': 'أكمل بياناتك لإنشاء الحساب',
    'O U,O O3U. O"O U,UO U.U,': 'الاسم بالكامل',
    'U.OO U,: OO-U.O_ U.O-U.O_': 'مثال: احمد محمد',
    'O U,O1U+U^O U+': 'العنوان',
    'O OrOUSO OUS': 'اختياري',
    'U.OO U,: O\'O OO1 O U,U+USU,OO O1U.O OOc 5': 'مثال: شارع النيل، عمارة 5',
    'O U,O"OUSO_ O U,OU,UOOU^U+US': 'البريد الإلكتروني',
    '6 OO-OU? O1U,U% O U,OU,U,': '6 أحرف على الأقل',
    'OO OUS O U,OO3OUSU,...': 'جاري التسجيل...',
    'OU+O\'O O O-O3O O"': 'إنشاء حساب',
    'OrOU^Oc OOrUSOOc U,OUU.O U, OO3OUSU, OU^OU,': 'خطوة أخيرة لإكمال تسجيل الدخول',
    'OO1USUSU+ UU,U.Oc U.OU^O': 'تعيين كلمة مرور',
    'U.OU,U^O"': 'مطلوب',
    'O\'O OO1OO O1U.O OOc...': 'شارع، عمارة...',
    'OO OUS O U,O-U?O,...': 'جاري الحفظ...',
    'O-U?O, U^OUU.O U,': 'حفظ ومتابعة',
    'O U,OO3U.': 'الاسم',
    'O-U?O,': 'حفظ',
    'O-OrO-O OU,O1U^O O': 'حذف العنوان',
    'O1U.USU, OU^OU,': 'عميل جوجل',
    'OOUSUSO OU,U. O U,U.U^O"O USU,': 'تغيير رقم الموبايل',
    'OOU^O1': 'رجوع',
    'OO"O U^OUU.O U,': 'متابعة'
}

# Add the ones with O instead of O
reps2 = {}
for k, v in reps.items():
    reps2[k.replace('O', 'O')] = v

reps.update(reps2)

# Also hardcode some that I saw:
reps['OU,U. O U,UO OU? OUSO OO-USO-Oc'] = 'رقم الموبايل أو كلمة المرور غير صحيحة'
reps['OU,U. O U,U.U^O"O USU,'] = 'رقم الموبايل'
reps['U.OO O"O1Oc'] = 'متابعة'
reps['OU^'] = 'أو'
reps['OO3OUSU, O U,O_OrU^U, O"O O3OOrO_O U. Google'] = 'تسجيل الدخول باستخدام Google'
reps['OUU,O U< O"U U.OO_O_O U<'] = 'أهلاً بك مجدداً'
reps['UU,U.Oc O U,U.OU^O'] = 'كلمة المرور'
reps['OO OUS O U,O_OrU^U,...'] = 'جاري تسجيل الدخول...'
reps['OO3OUSU, O U,O_OrU^U,'] = 'تسجيل الدخول'
reps['OOUSUSO OU,U. O U,U.U^O"O USU,'] = 'تغيير رقم الموبايل'
reps['U+O3USO UU,U.Oc O U,U.OU^OOY'] = 'نسيت كلمة المرور؟'
reps['OUU.U, O"USO U+O OU U,OU+O\'O O O U,O-O3O O"'] = 'أكمل بياناتك لإنشاء الحساب'
reps['O U,O O3U. O"O U,UO U.U,'] = 'الاسم بالكامل'
reps['U.OO U,: OO-U.O_ U.O-U.O_'] = 'مثال: احمد محمد'
reps['O U,O1U+U^O U+'] = 'العنوان'
reps['O OrOUSO OUS'] = 'اختياري'
reps['U.OO U,: O\'O OO1 O U,U+USU,OO O1U.O OOc 5'] = 'مثال: شارع النيل، عمارة 5'
reps['O U,O"OUSO_ O U,OU,UOOU^U+US'] = 'البريد الإلكتروني'
reps['6 OO-OU? O1U,U% O U,OU,U,'] = '6 أحرف على الأقل'
reps['OO OUS O U,OO3OUSU,...'] = 'جاري التسجيل...'
reps['OU+O\'O O O-O3O O"'] = 'إنشاء حساب'
reps['OOU^O1'] = 'الرجوع وتغيير الرقم'
reps['OrOU^Oc OOrUSOOc U,OUU.O U, OO3OUSU, OU^OU,'] = 'خطوة أخيرة لإكمال تسجيل الدخول'
reps['OO1USUSU+ UU,U.Oc U.OU^O'] = 'تعيين كلمة مرور'
reps['U.OU,U^O"'] = 'مطلوب'
reps['O\'O OO1OO O1U.O OOc...'] = 'شارع، عمارة...'
reps['OO OUS O U,O-U?O,...'] = 'جاري الحفظ...'
reps['O-U?O, U^OUU.O U,'] = 'حفظ ومتابعة'
reps['O1OOO U<OO U,O  USU^OO_ O"OUSO_ OU,UOOU^U+US OU,USU,US U.OOO"O O"UOO  O U,OO3O O". USOOU% O U,OU^O OU, U.O1 O U,U.OO1U. U,O O3OO1O O_Oc UU,U.Oc O U,U.OO^O.'] = 'تم إرسال رابط إعادة تعيين كلمة المرور.'
reps['OU,U. O U,UO OU? OUSO U.O3OU, U,O_USU+O .'] = 'رقم الموبايل غير مسجل لدينا.'
reps['O-O_O OrOO OOU+O O U.O-O U^U,Oc O O3OO1O O_Oc UU,U.Oc O U,U.OU^O.'] = 'حدث خطأ أثناء محاولة إرسال رابط إعادة تعيين كلمة المرور.'
reps['OO"O U^OUU.O U,'] = 'حفظ ومتابعة'
reps['OO OUS O U,OO"O...'] = 'جاري الحفظ...'

for k, v in reps.items():
    c = c.replace(k, v)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
