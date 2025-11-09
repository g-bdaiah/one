import React, { useState, useEffect } from 'react';
import { Search, User, Package, Clock, CheckCircle, AlertCircle, MapPin, Phone, MessageCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { beneficiaryAuthService } from '../services/beneficiaryAuthService';
import { packagesService } from '../services/supabaseRealService';
import { Button, Input, Card, Modal } from './ui';
import type { Database } from '../types/database';

type Beneficiary = Database['public']['Tables']['beneficiaries']['Row'];
type PackageType = Database['public']['Tables']['packages']['Row'];

interface BeneficiaryPortalState {
  step: 'search' | 'create_pin' | 'login' | 'verify_otp' | 'dashboard' | 'register';
  beneficiary: Beneficiary | null;
  authData: any | null;
  packages: PackageType[];
  isLoading: boolean;
  error: string;
}

export default function BeneficiaryPortal({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<BeneficiaryPortalState>({
    step: 'search',
    beneficiary: null,
    authData: null,
    packages: [],
    isLoading: false,
    error: ''
  });

  const [nationalId, setNationalId] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otp, setOtp] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'packages'>('info');
  const [packageFilter, setPackageFilter] = useState<'all' | 'delivered' | 'current' | 'future'>('all');
  const [features, setFeatures] = useState<any>({
    otp_verification: false,
    password_recovery: false,
    support_phone: '+970599505699'
  });

  useEffect(() => {
    loadSystemFeatures();
  }, []);

  const loadSystemFeatures = async () => {
    try {
      const allFeatures = await beneficiaryAuthService.getAllSystemFeatures();
      const featuresMap: any = {};
      allFeatures.forEach(f => {
        featuresMap[f.feature_key] = f.is_enabled;
        if (f.settings?.support_phone) {
          featuresMap.support_phone = f.settings.support_phone;
        }
      });
      setFeatures(featuresMap);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const handleSearch = async () => {
    if (!beneficiaryAuthService.validateNationalId(nationalId)) {
      setState(prev => ({ ...prev, error: 'رقم الهوية يجب أن يتكون من 9 أرقام' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const beneficiary = await beneficiaryAuthService.searchByNationalId(nationalId);

      if (!beneficiary) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          step: 'register',
          error: ''
        }));
        return;
      }

      const authData = await beneficiaryAuthService.getAuthByNationalId(nationalId);

      if (!authData) {
        setState(prev => ({
          ...prev,
          beneficiary,
          step: 'create_pin',
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          beneficiary,
          authData,
          step: 'login',
          isLoading: false
        }));
      }

      await beneficiaryAuthService.logActivity(
        `بحث عن مستفيد برقم هوية: ${nationalId}`,
        beneficiary?.name || 'غير معروف',
        'beneficiary',
        'review',
        beneficiary?.id
      );
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'حدث خطأ أثناء البحث'
      }));
    }
  };

  const handleCreatePin = async () => {
    if (!beneficiaryAuthService.validatePIN(pin)) {
      setState(prev => ({ ...prev, error: 'كلمة المرور يجب أن تتكون من 6 أرقام' }));
      return;
    }

    if (pin !== confirmPin) {
      setState(prev => ({ ...prev, error: 'كلمة المرور غير متطابقة' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      if (!state.beneficiary) throw new Error('No beneficiary data');

      const passwordHash = beneficiaryAuthService.hashPassword(pin);
      const authData = await beneficiaryAuthService.createAuth(
        state.beneficiary.id,
        nationalId,
        passwordHash
      );

      if (features.otp_verification) {
        const otpCode = await beneficiaryAuthService.generateOTP(state.beneficiary.id, 'registration');
        console.log('OTP Code:', otpCode);

        setState(prev => ({
          ...prev,
          authData,
          step: 'verify_otp',
          isLoading: false,
          error: 'تم إرسال رمز التحقق عبر واتساب'
        }));
      } else {
        await loadDashboardData(state.beneficiary.id);
        setState(prev => ({
          ...prev,
          authData,
          step: 'dashboard',
          isLoading: false
        }));
      }

      await beneficiaryAuthService.logActivity(
        'إنشاء كلمة مرور جديدة',
        state.beneficiary.name,
        'beneficiary',
        'create',
        state.beneficiary.id
      );
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'حدث خطأ أثناء إنشاء كلمة المرور'
      }));
    }
  };

  const handleLogin = async () => {
    if (!beneficiaryAuthService.validatePIN(pin)) {
      setState(prev => ({ ...prev, error: 'كلمة المرور يجب أن تتكون من 6 أرقام' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const passwordHash = beneficiaryAuthService.hashPassword(pin);
      const result = await beneficiaryAuthService.verifyPassword(nationalId, passwordHash);

      if (!result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.message || 'كلمة المرور غير صحيحة'
        }));
        return;
      }

      if (!state.beneficiary) throw new Error('No beneficiary data');

      await loadDashboardData(state.beneficiary.id);
      setState(prev => ({
        ...prev,
        authData: result.auth,
        step: 'dashboard',
        isLoading: false,
        error: ''
      }));

      await beneficiaryAuthService.logActivity(
        'تسجيل دخول ناجح',
        state.beneficiary.name,
        'beneficiary',
        'review',
        state.beneficiary.id
      );
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'حدث خطأ أثناء تسجيل الدخول'
      }));
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setState(prev => ({ ...prev, error: 'رمز التحقق يجب أن يتكون من 6 أرقام' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      if (!state.beneficiary) throw new Error('No beneficiary data');

      const isValid = await beneficiaryAuthService.verifyOTP(
        state.beneficiary.id,
        otp,
        'registration'
      );

      if (!isValid) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
        }));
        return;
      }

      await loadDashboardData(state.beneficiary.id);
      setState(prev => ({
        ...prev,
        step: 'dashboard',
        isLoading: false,
        error: ''
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'حدث خطأ أثناء التحقق'
      }));
    }
  };

  const loadDashboardData = async (beneficiaryId: string) => {
    try {
      const packages = await packagesService.getByBeneficiary(beneficiaryId);
      setState(prev => ({ ...prev, packages }));
      await beneficiaryAuthService.updateBeneficiaryPortalAccess(beneficiaryId);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleWhatsAppSupport = () => {
    const phone = features.support_phone || '+970599505699';
    const message = encodeURIComponent('مرحباً، أحتاج مساعدة في بوابة المستفيدين');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleShareLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Location shared:', { latitude, longitude });

          if (state.beneficiary) {
            try {
              await beneficiaryAuthService.logActivity(
                `مشاركة الموقع: ${latitude}, ${longitude}`,
                state.beneficiary.name,
                'beneficiary',
                'update',
                state.beneficiary.id
              );
              alert('تم مشاركة موقعك بنجاح');
            } catch (error) {
              console.error('Error logging location:', error);
            }
          }
        },
        (error) => {
          alert('لم نتمكن من الحصول على موقعك. يرجى التأكد من السماح بالوصول للموقع.');
        }
      );
    } else {
      alert('متصفحك لا يدعم خاصية تحديد الموقع');
    }
  };

  const getFilteredPackages = () => {
    if (packageFilter === 'all') return state.packages;
    if (packageFilter === 'delivered') {
      return state.packages.filter(p => p.status === 'delivered');
    }
    if (packageFilter === 'current') {
      return state.packages.filter(p => ['assigned', 'in_delivery'].includes(p.status));
    }
    if (packageFilter === 'future') {
      return state.packages.filter(p => p.status === 'pending' && p.scheduled_delivery_date);
    }
    return state.packages;
  };

  const renderSearchStep = () => (
    <Card className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          بوابة المستفيدين
        </h2>
        <p className="text-gray-600">
          ابحث عن بياناتك باستخدام رقم الهوية الوطني
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رقم الهوية الوطني (9 أرقام)
          </label>
          <Input
            type="text"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="123456789"
            maxLength={9}
            dir="ltr"
          />
        </div>

        {state.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{state.error}</span>
          </div>
        )}

        <Button
          onClick={handleSearch}
          disabled={nationalId.length !== 9 || state.isLoading}
          className="w-full"
        >
          {state.isLoading ? 'جارٍ البحث...' : 'بحث'}
        </Button>

        <div className="text-center">
          <button
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    </Card>
  );

  const renderCreatePinStep = () => (
    <Card className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          مرحباً {state.beneficiary?.name}
        </h2>
        <p className="text-gray-600">
          هذه أول زيارة لك. يرجى إنشاء كلمة مرور مكونة من 6 أرقام
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            كلمة المرور (6 أرقام)
          </label>
          <div className="relative">
            <Input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              maxLength={6}
              dir="ltr"
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
            تأكيد كلمة المرور
          </label>
          <Input
            type={showPin ? 'text' : 'password'}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            maxLength={6}
            dir="ltr"
          />
        </div>

        {state.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{state.error}</span>
          </div>
        )}

        <Button
          onClick={handleCreatePin}
          disabled={pin.length !== 6 || confirmPin.length !== 6 || state.isLoading}
          className="w-full"
        >
          {state.isLoading ? 'جارٍ الإنشاء...' : 'إنشاء كلمة المرور'}
        </Button>
      </div>
    </Card>
  );

  const renderLoginStep = () => (
    <Card className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          مرحباً {state.beneficiary?.name}
        </h2>
        <p className="text-gray-600">
          يرجى إدخال كلمة المرور للدخول
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            كلمة المرور (6 أرقام)
          </label>
          <div className="relative">
            <Input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              maxLength={6}
              dir="ltr"
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

        {state.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{state.error}</span>
          </div>
        )}

        <Button
          onClick={handleLogin}
          disabled={pin.length !== 6 || state.isLoading}
          className="w-full"
        >
          {state.isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
        </Button>

        <div className="flex justify-between text-sm">
          {features.password_recovery && (
            <button className="text-blue-600 hover:text-blue-700">
              نسيت كلمة المرور؟
            </button>
          )}
          <button
            onClick={handleWhatsAppSupport}
            className="text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            <MessageCircle className="w-4 h-4" />
            دعم واتساب
          </button>
        </div>
      </div>
    </Card>
  );

  const renderVerifyOTPStep = () => (
    <Card className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          التحقق من الهوية
        </h2>
        <p className="text-gray-600">
          تم إرسال رمز التحقق عبر واتساب. يرجى إدخاله هنا
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رمز التحقق (6 أرقام)
          </label>
          <Input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            dir="ltr"
          />
        </div>

        {state.error && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-orange-700">{state.error}</span>
          </div>
        )}

        <Button
          onClick={handleVerifyOTP}
          disabled={otp.length !== 6 || state.isLoading}
          className="w-full"
        >
          {state.isLoading ? 'جارٍ التحقق...' : 'تحقق'}
        </Button>

        <div className="text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700">
            إعادة إرسال الرمز
          </button>
        </div>
      </div>
    </Card>
  );

  const renderDashboard = () => {
    const filteredPackages = getFilteredPackages();

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{state.beneficiary?.name}</h2>
                <p className="text-sm text-gray-600">رقم الهوية: {state.beneficiary?.national_id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShareLocation}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="مشاركة الموقع"
              >
                <MapPin className="w-5 h-5" />
              </button>
              <button
                onClick={handleWhatsAppSupport}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                title="تواصل عبر واتساب"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              معلوماتي
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'packages'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              الطرود ({state.packages.length})
            </button>
          </div>
        </div>

        {activeTab === 'info' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">البيانات الشخصية</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل
                </label>
                <p className="text-gray-900">{state.beneficiary?.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف
                </label>
                <p className="text-gray-900">{state.beneficiary?.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  العنوان
                </label>
                <p className="text-gray-900">{state.beneficiary?.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الحالة
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  state.beneficiary?.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {state.beneficiary?.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setPackageFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  packageFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الكل ({state.packages.length})
              </button>
              <button
                onClick={() => setPackageFilter('delivered')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  packageFilter === 'delivered'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                المستلمة
              </button>
              <button
                onClick={() => setPackageFilter('current')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  packageFilter === 'current'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الحالية
              </button>
              <button
                onClick={() => setPackageFilter('future')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  packageFilter === 'future'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                القادمة
              </button>
            </div>

            {filteredPackages.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">لا توجد طرود في هذه الفئة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPackages.map((pkg) => (
                  <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{pkg.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            pkg.status === 'delivered'
                              ? 'bg-green-100 text-green-700'
                              : pkg.status === 'in_delivery'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {pkg.status === 'delivered' && <CheckCircle className="w-3 h-3" />}
                            {pkg.status === 'in_delivery' && <Clock className="w-3 h-3" />}
                            {pkg.status === 'pending' && <Package className="w-3 h-3" />}
                            {pkg.status === 'delivered' ? 'تم التسليم' :
                             pkg.status === 'in_delivery' ? 'قيد التوصيل' :
                             'قادم'}
                          </span>
                          {pkg.scheduled_delivery_date && (
                            <span className="text-xs text-gray-600">
                              التسليم المتوقع: {new Date(pkg.scheduled_delivery_date).toLocaleDateString('ar-EG')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  };

  const renderRegisterStep = () => (
    <Card className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          غير مسجل
        </h2>
        <p className="text-gray-600">
          رقم الهوية {nationalId} غير موجود في قاعدة البيانات
        </p>
      </div>

      <div className="space-y-4">
        <Button onClick={() => console.log('Register new beneficiary')} className="w-full">
          تسجيل جديد
        </Button>

        <div className="text-center">
          <button
            onClick={() => setState(prev => ({ ...prev, step: 'search', error: '', nationalId: '' }))}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            العودة للبحث
          </button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="container mx-auto">
        {state.step === 'search' && renderSearchStep()}
        {state.step === 'create_pin' && renderCreatePinStep()}
        {state.step === 'login' && renderLoginStep()}
        {state.step === 'verify_otp' && renderVerifyOTPStep()}
        {state.step === 'dashboard' && renderDashboard()}
        {state.step === 'register' && renderRegisterStep()}
      </div>
    </div>
  );
}
