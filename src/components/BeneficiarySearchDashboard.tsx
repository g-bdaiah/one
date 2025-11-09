import React, { useState } from 'react';
import {
  Search, User, Package, CheckCircle, Clock, AlertCircle,
  MapPin, Phone, Edit2, Save, Shield, Building2, Calendar,
  UserPlus, ArrowRight, Eye, EyeOff
} from 'lucide-react';
import { beneficiaryAuthService } from '../services/beneficiaryAuthService';
import { packagesService } from '../services/supabaseRealService';
import { Button, Input, Card } from './ui';
import PublicBeneficiaryRegistration from './PublicBeneficiaryRegistration';
import type { Database } from '../types/database';

type Beneficiary = Database['public']['Tables']['beneficiaries']['Row'];
type PackageType = Database['public']['Tables']['packages']['Row'];

type TabType = 'info' | 'status' | 'packages_received' | 'packages_coming' | 'organizations';

interface SearchState {
  step: 'search' | 'found' | 'not_found' | 'register';
  beneficiary: Beneficiary | null;
  packages: PackageType[];
  authExists: boolean;
  isLoading: boolean;
  error: string;
  success: string;
}

export default function BeneficiarySearchDashboard({ onBack }: { onBack: () => void }) {
  const [nationalId, setNationalId] = useState('');
  const [state, setState] = useState<SearchState>({
    step: 'search',
    beneficiary: null,
    packages: [],
    authExists: false,
    isLoading: false,
    error: '',
    success: ''
  });

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Beneficiary>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSearch = async () => {
    if (!beneficiaryAuthService.validateNationalId(nationalId)) {
      setState(prev => ({ ...prev, error: 'رقم الهوية يجب أن يتكون من 9 أرقام' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '', success: '' }));

    try {
      const beneficiary = await beneficiaryAuthService.searchByNationalId(nationalId);

      if (!beneficiary) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          step: 'not_found',
          beneficiary: null,
          packages: []
        }));
        return;
      }

      const authData = await beneficiaryAuthService.getAuthByNationalId(nationalId);
      const packages = await packagesService.getByBeneficiary(beneficiary.id);

      setState(prev => ({
        ...prev,
        isLoading: false,
        step: 'found',
        beneficiary,
        packages,
        authExists: !!authData
      }));

      await beneficiaryAuthService.logActivity(
        `بحث عن مستفيد برقم هوية: ${nationalId}`,
        beneficiary.name,
        'beneficiary',
        'review',
        beneficiary.id,
        'بحث من لوحة البحث الذكية',
        'public'
      );
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'حدث خطأ أثناء البحث'
      }));
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedData({
      phone: state.beneficiary?.phone,
      address: state.beneficiary?.address,
      detailed_address: state.beneficiary?.detailed_address
    });
  };

  const handleSaveWithPassword = () => {
    if (state.authExists) {
      handleSaveChanges();
    } else {
      setShowPasswordModal(true);
    }
  };

  const handleCreatePasswordAndSave = async () => {
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
      if (!state.beneficiary) throw new Error('لا توجد بيانات مستفيد');

      const passwordHash = beneficiaryAuthService.hashPassword(pin);
      await beneficiaryAuthService.createAuth(
        state.beneficiary.id,
        nationalId,
        passwordHash
      );

      await handleSaveChanges();

      setState(prev => ({
        ...prev,
        isLoading: false,
        authExists: true,
        success: 'تم إنشاء كلمة المرور وحفظ التغييرات بنجاح'
      }));

      setShowPasswordModal(false);
      setPin('');
      setConfirmPin('');

      await beneficiaryAuthService.logActivity(
        'إنشاء كلمة مرور وتحديث البيانات',
        state.beneficiary.name,
        'beneficiary',
        'create',
        state.beneficiary.id
      );

      setTimeout(() => setState(prev => ({ ...prev, success: '' })), 3000);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'حدث خطأ أثناء حفظ البيانات'
      }));
    }
  };

  const handleSaveChanges = async () => {
    try {
      setState(prev => ({
        ...prev,
        beneficiary: { ...prev.beneficiary!, ...editedData },
        success: 'تم حفظ التغييرات بنجاح'
      }));

      setIsEditing(false);
      setEditedData({});

      setTimeout(() => setState(prev => ({ ...prev, success: '' })), 3000);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'حدث خطأ أثناء حفظ التغييرات'
      }));
    }
  };

  const handleNewSearch = () => {
    setNationalId('');
    setState({
      step: 'search',
      beneficiary: null,
      packages: [],
      authExists: false,
      isLoading: false,
      error: '',
      success: ''
    });
    setActiveTab('info');
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      verified: { label: 'موثق', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getPackageStatusBadge = (status: string) => {
    const statusConfig: any = {
      delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      in_delivery: { label: 'قيد التوصيل', color: 'bg-orange-100 text-orange-700', icon: Clock },
      assigned: { label: 'جاري التحضير', color: 'bg-blue-100 text-blue-700', icon: Package },
      pending: { label: 'قيد الانتظار', color: 'bg-gray-100 text-gray-700', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const renderSearchStep = () => (
    <Card className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          بوابة المستفيدين
        </h2>
        <p className="text-lg text-gray-600">
          ابحث عن بياناتك باستخدام رقم الهوية الوطني
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            رقم الهوية الوطني (9 أرقام)
          </label>
          <div className="flex gap-3">
            <Input
              type="text"
              value={nationalId}
              onChange={(e) => {
                setNationalId(e.target.value.replace(/\D/g, '').slice(0, 9));
                setState(prev => ({ ...prev, error: '' }));
              }}
              onKeyPress={(e) => e.key === 'Enter' && nationalId.length === 9 && handleSearch()}
              placeholder="123456789"
              maxLength={9}
              dir="ltr"
              className="text-lg"
            />
            <Button
              onClick={handleSearch}
              disabled={nationalId.length !== 9 || state.isLoading}
              className="px-8"
            >
              {state.isLoading ? (
                <>
                  <Clock className="w-5 h-5 ml-2 animate-spin" />
                  جاري البحث...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 ml-2" />
                  بحث
                </>
              )}
            </Button>
          </div>
        </div>

        {state.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{state.error}</span>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            تعليمات البحث:
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>أدخل رقم هويتك الوطني المكون من 9 أرقام</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>اضغط على زر "بحث" أو اضغط Enter</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>ستظهر معلوماتك وحالة طرودك مباشرة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>يمكنك تحديث بياناتك بدون كلمة مرور</span>
            </li>
          </ul>
        </div>

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

  const renderFoundStep = () => {
    const { beneficiary, packages } = state;
    if (!beneficiary) return null;

    const packagesReceived = packages.filter(p => p.status === 'delivered');
    const packagesComing = packages.filter(p => ['pending', 'assigned', 'in_delivery'].includes(p.status));

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {state.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-green-700">{state.success}</span>
          </div>
        )}

        {state.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{state.error}</span>
          </div>
        )}

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                {beneficiary.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{beneficiary.name}</h2>
                <p className="text-gray-600">رقم الهوية: {beneficiary.national_id}</p>
              </div>
            </div>
            <Button onClick={handleNewSearch} variant="outline" size="sm">
              بحث جديد
            </Button>
          </div>

          <div className="flex gap-2 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 inline ml-2" />
              البيانات الشخصية
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'status'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4 inline ml-2" />
              حالة الحساب
            </button>
            <button
              onClick={() => setActiveTab('packages_received')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'packages_received'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline ml-2" />
              الطرود المستلمة ({packagesReceived.length})
            </button>
            <button
              onClick={() => setActiveTab('packages_coming')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'packages_coming'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 inline ml-2" />
              الطرود القادمة ({packagesComing.length})
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'organizations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4 inline ml-2" />
              المؤسسات
            </button>
          </div>

          <div>
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">المعلومات الأساسية</h3>
                  {!isEditing ? (
                    <Button onClick={handleStartEdit} variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 ml-2" />
                      تعديل البيانات
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveWithPassword} size="sm">
                        <Save className="w-4 h-4 ml-2" />
                        حفظ التغييرات
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedData({});
                        }}
                        variant="outline"
                        size="sm"
                      >
                        إلغاء
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                    <p className="text-gray-900 p-2 bg-gray-50 rounded">{beneficiary.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهوية</label>
                    <p className="text-gray-900 p-2 bg-gray-50 rounded">{beneficiary.national_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4 inline ml-1" />
                      رقم الهاتف
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedData.phone || ''}
                        onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                        placeholder="رقم الهاتف"
                      />
                    ) : (
                      <p className="text-gray-900 p-2 bg-gray-50 rounded">{beneficiary.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
                    <p className="text-gray-900 p-2 bg-gray-50 rounded">
                      {beneficiary.gender === 'male' ? 'ذكر' : 'أنثى'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 inline ml-1" />
                      العنوان
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedData.address || ''}
                        onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="العنوان"
                      />
                    ) : (
                      <p className="text-gray-900 p-2 bg-gray-50 rounded">{beneficiary.address}</p>
                    )}
                  </div>
                </div>

                {!state.authExists && !isEditing && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-700">
                        <p className="font-semibold mb-1">لم تقم بإنشاء كلمة مرور بعد</p>
                        <p>عند تحديث بياناتك للمرة الأولى، سيُطلب منك إنشاء كلمة مرور لحماية حسابك.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'status' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">حالة التوثيق</p>
                    <p className="text-sm text-gray-600">حالة التحقق من هويتك</p>
                  </div>
                  {getStatusBadge(beneficiary.identity_status)}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">حالة الأهلية</p>
                    <p className="text-sm text-gray-600">حالة استحقاقك للمساعدات</p>
                  </div>
                  {getStatusBadge(beneficiary.eligibility_status)}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">حالة الحساب</p>
                    <p className="text-sm text-gray-600">حالة نشاط حسابك</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${
                    beneficiary.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {beneficiary.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">كلمة المرور</p>
                    <p className="text-sm text-gray-600">حماية حسابك الشخصي</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${
                    state.authExists ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {state.authExists ? 'محمي بكلمة مرور' : 'غير محمي'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'packages_received' && (
              <div className="space-y-3">
                {packagesReceived.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">لم تستلم أي طرود بعد</p>
                  </div>
                ) : (
                  packagesReceived.map((pkg) => (
                    <div key={pkg.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{pkg.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                          {pkg.delivered_at && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                تاريخ الاستلام: {new Date(pkg.delivered_at).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        {getPackageStatusBadge(pkg.status)}
                      </div>
                      <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                        <span className="text-gray-600">القيمة: {pkg.value} ₪</span>
                        <span className="text-gray-600">الممول: {pkg.funder}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'packages_coming' && (
              <div className="space-y-3">
                {packagesComing.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">لا توجد طرود قادمة حالياً</p>
                  </div>
                ) : (
                  packagesComing.map((pkg) => (
                    <div key={pkg.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{pkg.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                        </div>
                        {getPackageStatusBadge(pkg.status)}
                      </div>
                      <div className="pt-3 border-t border-blue-200 flex items-center justify-between text-sm">
                        <span className="text-gray-600">القيمة: {pkg.value} ₪</span>
                        <span className="text-gray-600">الممول: {pkg.funder}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'organizations' && (
              <div className="space-y-4">
                {beneficiary.organization_id ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">مسجل لدى مؤسسة</p>
                        <p className="text-sm text-gray-600">معرف المؤسسة: {beneficiary.organization_id}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">غير مسجل لدى أي مؤسسة حالياً</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <div className="text-center">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  };

  const renderNotFoundStep = () => (
    <Card className="max-w-md mx-auto">
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          لا توجد بيانات
        </h3>
        <p className="text-gray-600 mb-6">
          رقم الهوية <span className="font-bold">{nationalId}</span> غير موجود في قاعدة البيانات
        </p>
        <div className="space-y-3">
          <Button onClick={() => setState(prev => ({ ...prev, step: 'register' }))} className="w-full">
            <UserPlus className="w-5 h-5 ml-2" />
            تسجيل مستفيد جديد
          </Button>
          <Button onClick={handleNewSearch} variant="outline" className="w-full">
            بحث مرة أخرى
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderRegisterStep = () => (
    <PublicBeneficiaryRegistration
      nationalId={nationalId}
      onBack={handleNewSearch}
      onSuccess={() => {
        setState(prev => ({
          ...prev,
          step: 'search',
          success: 'تم التسجيل بنجاح! يمكنك الآن البحث عن بياناتك'
        }));
        handleNewSearch();
      }}
    />
  );

  const renderPasswordModal = () => {
    if (!showPasswordModal) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />

        <div className="absolute inset-y-0 left-0 right-0 md:left-1/4 md:right-1/4 lg:left-1/3 lg:right-1/3">
          <div className="bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h1 className="text-xl font-bold text-gray-900">إنشاء كلمة مرور</h1>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  مرحباً {state.beneficiary?.name}
                </h2>
                <p className="text-gray-600">
                  لحفظ التغييرات، يرجى إنشاء كلمة مرور مكونة من 6 أرقام
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
                      onChange={(e) => {
                        setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setState(prev => ({ ...prev, error: '' }));
                      }}
                      placeholder="••••••"
                      maxLength={6}
                      dir="ltr"
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
                    تأكيد كلمة المرور
                  </label>
                  <Input
                    type={showPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => {
                      setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setState(prev => ({ ...prev, error: '' }));
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && pin.length === 6 && confirmPin.length === 6 && handleCreatePasswordAndSave()}
                    placeholder="••••••"
                    maxLength={6}
                    dir="ltr"
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                {state.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{state.error}</span>
                  </div>
                )}

                <Button
                  onClick={handleCreatePasswordAndSave}
                  disabled={pin.length !== 6 || confirmPin.length !== 6 || state.isLoading}
                  className="w-full"
                >
                  {state.isLoading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full ml-2"></div>
                      جارٍ الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 ml-2" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>نصيحة:</strong> احفظ كلمة المرور في مكان آمن. ستحتاجها لتسجيل الدخول وتحديث بياناتك مستقبلاً.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="container mx-auto">
        {state.step === 'search' && renderSearchStep()}
        {state.step === 'found' && renderFoundStep()}
        {state.step === 'not_found' && renderNotFoundStep()}
        {state.step === 'register' && renderRegisterStep()}
        {renderPasswordModal()}
      </div>
    </div>
  );
}
