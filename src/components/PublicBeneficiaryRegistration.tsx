import React, { useState } from 'react';
import {
  User, Phone, MapPin, Calendar, Shield, Save, X,
  AlertTriangle, CheckCircle, Briefcase, Heart, Eye, EyeOff
} from 'lucide-react';
import { beneficiaryAuthService } from '../services/beneficiaryAuthService';
import { Button, Card, Input } from './ui';

interface RegistrationFormData {
  name: string;
  fullName: string;
  nationalId: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  phone: string;
  detailedAddress: {
    governorate: string;
    city: string;
    district: string;
    street: string;
    additionalInfo: string;
  };
  profession: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  economicLevel: 'very_poor' | 'poor' | 'moderate' | 'good';
  membersCount: number;
  notes: string;
  pin: string;
  confirmPin: string;
}

interface PublicBeneficiaryRegistrationProps {
  nationalId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function PublicBeneficiaryRegistration({
  nationalId,
  onBack,
  onSuccess
}: PublicBeneficiaryRegistrationProps) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    fullName: '',
    nationalId: nationalId,
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    detailedAddress: {
      governorate: '',
      city: '',
      district: '',
      street: '',
      additionalInfo: ''
    },
    profession: '',
    maritalStatus: 'single',
    economicLevel: 'poor',
    membersCount: 1,
    notes: '',
    pin: '',
    confirmPin: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [currentStep, setCurrentStep] = useState<'personal' | 'address' | 'social' | 'password'>('personal');

  const governorates = ['غزة', 'خان يونس', 'الوسطى', 'شمال غزة', 'رفح'];
  const maritalStatusOptions = [
    { value: 'single', label: 'أعزب' },
    { value: 'married', label: 'متزوج' },
    { value: 'divorced', label: 'مطلق' },
    { value: 'widowed', label: 'أرمل' }
  ];
  const economicLevelOptions = [
    { value: 'very_poor', label: 'فقير جداً' },
    { value: 'poor', label: 'فقير' },
    { value: 'moderate', label: 'متوسط' },
    { value: 'good', label: 'ميسور' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDetailedAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      detailedAddress: {
        ...prev.detailedAddress,
        [field]: value
      }
    }));
  };

  const validatePersonalInfo = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    }
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'رقم الهوية مطلوب';
    } else if (!/^\d{9}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'رقم الهوية يجب أن يكون 9 أرقام';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'تاريخ الميلاد مطلوب';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^05\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddress = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.detailedAddress.governorate) {
      newErrors.governorate = 'المحافظة مطلوبة';
    }
    if (!formData.detailedAddress.city.trim()) {
      newErrors.city = 'المدينة مطلوبة';
    }
    if (!formData.detailedAddress.district.trim()) {
      newErrors.district = 'الحي مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSocialInfo = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.profession.trim()) {
      newErrors.profession = 'المهنة مطلوبة';
    }
    if (formData.membersCount < 1) {
      newErrors.membersCount = 'عدد أفراد الأسرة يجب أن يكون 1 على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!beneficiaryAuthService.validatePIN(formData.pin)) {
      newErrors.pin = 'كلمة المرور يجب أن تتكون من 6 أرقام';
    }
    if (formData.pin !== formData.confirmPin) {
      newErrors.confirmPin = 'كلمة المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    if (currentStep === 'personal') {
      isValid = validatePersonalInfo();
      if (isValid) setCurrentStep('address');
    } else if (currentStep === 'address') {
      isValid = validateAddress();
      if (isValid) setCurrentStep('social');
    } else if (currentStep === 'social') {
      isValid = validateSocialInfo();
      if (isValid) setCurrentStep('password');
    }
  };

  const handleBack = () => {
    if (currentStep === 'address') setCurrentStep('personal');
    else if (currentStep === 'social') setCurrentStep('address');
    else if (currentStep === 'password') setCurrentStep('social');
    else onBack();
  };

  const handleSubmit = async () => {
    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);
    setOperationError(null);

    try {
      const address = [
        formData.detailedAddress.governorate,
        formData.detailedAddress.city,
        formData.detailedAddress.district
      ].filter(Boolean).join(' - ');

      console.log('تسجيل مستفيد جديد:', {
        ...formData,
        address,
        password_created: true
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      await beneficiaryAuthService.logActivity(
        `تسجيل مستفيد جديد برقم هوية: ${formData.nationalId}`,
        formData.name,
        'beneficiary',
        'create',
        undefined,
        'تسجيل جديد من البوابة العامة',
        'public'
      );

      onSuccess();
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setOperationError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'personal', label: 'المعلومات الشخصية' },
      { key: 'address', label: 'العنوان' },
      { key: 'social', label: 'المعلومات الاجتماعية' },
      { key: 'password', label: 'كلمة المرور' }
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex-1 flex items-center">
              <div className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index <= currentIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          {steps.map((step, index) => (
            <div key={step.key} className={`flex-1 ${index < steps.length - 1 ? 'pl-4' : ''}`}>
              <p
                className={`text-sm ${
                  index <= currentIndex ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="الاسم الأول *"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="مثال: محمد"
          error={errors.name}
          required
        />

        <Input
          label="الاسم الكامل *"
          type="text"
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          placeholder="مثال: محمد أحمد عبدالله الغزاوي"
          error={errors.fullName}
          required
        />

        <Input
          label="رقم الهوية الوطنية *"
          type="text"
          value={formData.nationalId}
          onChange={(e) => handleInputChange('nationalId', e.target.value)}
          placeholder="مثال: 900123456"
          error={errors.nationalId}
          disabled
          required
        />

        <Input
          label="تاريخ الميلاد *"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          error={errors.dateOfBirth}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الجنس *
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>

        <Input
          label="رقم الهاتف *"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="مثال: 0591234567"
          error={errors.phone}
          required
        />
      </div>
    </div>
  );

  const renderAddressInfo = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المحافظة *
          </label>
          <select
            value={formData.detailedAddress.governorate}
            onChange={(e) => handleDetailedAddressChange('governorate', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">اختر المحافظة</option>
            {governorates.map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>
          {errors.governorate && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertTriangle className="w-4 h-4 ml-1" />
              {errors.governorate}
            </p>
          )}
        </div>

        <Input
          label="المدينة / المخيم *"
          type="text"
          value={formData.detailedAddress.city}
          onChange={(e) => handleDetailedAddressChange('city', e.target.value)}
          placeholder="مثال: خان يونس"
          error={errors.city}
          required
        />

        <Input
          label="الحي / المنطقة *"
          type="text"
          value={formData.detailedAddress.district}
          onChange={(e) => handleDetailedAddressChange('district', e.target.value)}
          placeholder="مثال: الكتيبة"
          error={errors.district}
          required
        />

        <Input
          label="الشارع"
          type="text"
          value={formData.detailedAddress.street}
          onChange={(e) => handleDetailedAddressChange('street', e.target.value)}
          placeholder="مثال: شارع الشهداء"
        />

        <div className="md:col-span-2">
          <Input
            label="معلومات إضافية عن العنوان"
            type="text"
            value={formData.detailedAddress.additionalInfo}
            onChange={(e) => handleDetailedAddressChange('additionalInfo', e.target.value)}
            placeholder="مثال: بجانب مسجد الكتيبة الكبير"
          />
        </div>
      </div>
    </div>
  );

  const renderSocialInfo = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="المهنة *"
          type="text"
          value={formData.profession}
          onChange={(e) => handleInputChange('profession', e.target.value)}
          placeholder="مثال: عامل بناء"
          error={errors.profession}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الحالة الاجتماعية *
          </label>
          <select
            value={formData.maritalStatus}
            onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {maritalStatusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المستوى الاقتصادي *
          </label>
          <select
            value={formData.economicLevel}
            onChange={(e) => handleInputChange('economicLevel', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {economicLevelOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            عدد أفراد الأسرة *
          </label>
          <input
            type="number"
            value={formData.membersCount}
            onChange={(e) => handleInputChange('membersCount', parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            min="1"
            max="20"
          />
          {errors.membersCount && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertTriangle className="w-4 h-4 ml-1" />
              {errors.membersCount}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات إضافية
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            rows={3}
            placeholder="أي معلومات إضافية تود إضافتها..."
          />
        </div>
      </div>
    </div>
  );

  const renderPasswordInfo = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">إنشاء كلمة مرور</p>
            <p>قم بإنشاء كلمة مرور مكونة من 6 أرقام لحماية حسابك. ستحتاجها لتسجيل الدخول وتحديث بياناتك مستقبلاً.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            كلمة المرور (6 أرقام) *
          </label>
          <div className="relative">
            <Input
              type={showPin ? 'text' : 'password'}
              value={formData.pin}
              onChange={(e) => handleInputChange('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              maxLength={6}
              dir="ltr"
              error={errors.pin}
              className="text-center text-2xl tracking-widest"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تأكيد كلمة المرور *
          </label>
          <Input
            type={showPin ? 'text' : 'password'}
            value={formData.confirmPin}
            onChange={(e) => handleInputChange('confirmPin', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            maxLength={6}
            dir="ltr"
            error={errors.confirmPin}
            className="text-center text-2xl tracking-widest"
          />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <p className="font-semibold mb-1">تذكير مهم:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>احفظ كلمة المرور في مكان آمن</li>
              <li>لا تشارك كلمة المرور مع أي شخص</li>
              <li>ستحتاجها لتسجيل الدخول مستقبلاً</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="text-center mb-8">
          <div className="bg-blue-100 p-4 rounded-xl w-fit mx-auto mb-4">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            تسجيل مستفيد جديد
          </h2>
          <p className="text-gray-600 mt-2">
            إضافة بياناتك إلى قاعدة البيانات
          </p>
        </div>

        {renderStepIndicator()}

        {operationError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 space-x-reverse">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">{operationError}</span>
          </div>
        )}

        <div className="mb-8">
          {currentStep === 'personal' && renderPersonalInfo()}
          {currentStep === 'address' && renderAddressInfo()}
          {currentStep === 'social' && renderSocialInfo()}
          {currentStep === 'password' && renderPasswordInfo()}
        </div>

        <div className="flex space-x-4 space-x-reverse justify-between">
          <Button
            variant="outline"
            icon={X}
            iconPosition="right"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            {currentStep === 'personal' ? 'إلغاء' : 'السابق'}
          </Button>

          {currentStep !== 'password' ? (
            <Button
              variant="primary"
              icon={CheckCircle}
              iconPosition="right"
              onClick={handleNext}
            >
              التالي
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={isSubmitting ? undefined : Save}
              iconPosition="right"
              onClick={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'جاري التسجيل...' : 'إتمام التسجيل'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
