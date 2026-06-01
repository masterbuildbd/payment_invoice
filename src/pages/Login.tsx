import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';
import { useLanguage, Language } from '../lib/language';
import { Shield, Key, User as UserIcon, ArrowRight, Loader2, Eye, EyeOff, Lock, Globe, Phone, UserCheck, CreditCard, ChevronDown, CheckCircle } from 'lucide-react';
import { CompanySettings, User } from '../types';
import { getDocumentById, safeStringify } from '../lib/storage';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

const COUNTRY_CODES = [
  { code: '+880', label: 'BD', name: 'Bangladesh' },
  { code: '+966', label: 'SA', name: 'Saudi Arabia' },
  { code: '+971', label: 'AE', name: 'UAE' },
  { code: '+968', label: 'OM', name: 'Oman' },
  { code: '+974', label: 'QA', name: 'Qatar' },
  { code: '+965', label: 'KW', name: 'Kuwait' },
  { code: '+973', label: 'BH', name: 'Bahrain' },
  { code: '+1', label: 'US', name: 'USA' },
  { code: '+44', label: 'GB', name: 'UK' },
  { code: '+91', label: 'IN', name: 'India' },
  { code: '+92', label: 'PK', name: 'Pakistan' },
  { code: '+60', label: 'MY', name: 'Malaysia' },
  { code: '+65', label: 'SG', name: 'Singapore' },
  { code: '+39', label: 'IT', name: 'Italy' },
  { code: '+33', label: 'FR', name: 'France' },
  { code: '+49', label: 'DE', name: 'Germany' },
  { code: '+34', label: 'ES', name: 'Spain' },
  { code: '+61', label: 'AU', name: 'Australia' },
  { code: '+1', label: 'CA', name: 'Canada' },
  { code: '+81', label: 'JP', name: 'Japan' },
  { code: '+82', label: 'KR', name: 'South Korea' },
  { code: '+86', label: 'CN', name: 'China' },
  { code: '+7', label: 'RU', name: 'Russia' },
  { code: '+90', label: 'TR', name: 'Turkey' },
  { code: '+20', label: 'EG', name: 'Egypt' },
  { code: '+27', label: 'ZA', name: 'South Africa' },
  { code: '+55', label: 'BR', name: 'Brazil' },
  { code: '+52', label: 'MX', name: 'Mexico' },
  { code: '+54', label: 'AR', name: 'Argentina' },
  { code: '+31', label: 'NL', name: 'Netherlands' },
  { code: '+32', label: 'BE', name: 'Belgium' },
  { code: '+41', label: 'CH', name: 'Switzerland' },
  { code: '+46', label: 'SE', name: 'Sweden' },
  { code: '+47', label: 'NO', name: 'Norway' },
  { code: '+45', label: 'DK', name: 'Denmark' },
  { code: '+358', label: 'FI', name: 'Finland' },
  { code: '+353', label: 'IE', name: 'Ireland' },
  { code: '+351', label: 'PT', name: 'Portugal' },
  { code: '+30', label: 'GR', name: 'Greece' },
  { code: '+43', label: 'AT', name: 'Austria' },
  { code: '+48', label: 'PL', name: 'Poland' },
  { code: '+420', label: 'CZ', name: 'Czechia' },
  { code: '+36', label: 'HU', name: 'Hungary' },
  { code: '+40', label: 'RO', name: 'Romania' },
  { code: '+380', label: 'UA', name: 'Ukraine' },
  { code: '+62', label: 'ID', name: 'Indonesia' },
  { code: '+63', label: 'PH', name: 'Philippines' },
  { code: '+66', label: 'TH', name: 'Thailand' },
  { code: '+84', label: 'VN', name: 'Vietnam' },
  { code: '+94', label: 'LK', name: 'Sri Lanka' },
  { code: '+977', label: 'NP', name: 'Nepal' },
  { code: '+93', label: 'AF', name: 'Afghanistan' },
  { code: '+964', label: 'IQ', name: 'Iraq' },
  { code: '+98', label: 'IR', name: 'Iran' },
  { code: '+963', label: 'SY', name: 'Syria' },
  { code: '+962', label: 'JO', name: 'Jordan' },
  { code: '+961', label: 'LB', name: 'Lebanon' },
  { code: '+972', label: 'IL', name: 'Israel' },
  { code: '+967', label: 'YE', name: 'Yemen' },
  { code: '+212', label: 'MA', name: 'Morocco' },
  { code: '+213', label: 'DZ', name: 'Algeria' },
  { code: '+216', label: 'TN', name: 'Tunisia' },
  { code: '+218', label: 'LY', name: 'Libya' },
  { code: '+249', label: 'SD', name: 'Sudan' },
  { code: '+254', label: 'KE', name: 'Kenya' },
  { code: '+234', label: 'NG', name: 'Nigeria' },
  { code: '+233', label: 'GH', name: 'Ghana' },
  { code: '+251', label: 'ET', name: 'Ethiopia' },
  { code: '+255', label: 'TZ', name: 'Tanzania' },
  { code: '+256', label: 'UG', name: 'Uganda' },
  { code: '+260', label: 'ZM', name: 'Zambia' },
  { code: '+263', label: 'ZW', name: 'Zimbabwe' },
  { code: '+244', label: 'AO', name: 'Angola' },
  { code: '+258', label: 'MZ', name: 'Mozambique' },
  { code: '+221', label: 'SN', name: 'Senegal' },
  { code: '+225', label: 'CI', name: "Cote d'Ivoire" },
  { code: '+237', label: 'CM', name: 'Cameroon' },
  { code: '+264', label: 'NA', name: 'Namibia' },
  { code: '+267', label: 'BW', name: 'Botswana' },
  { code: '+230', label: 'MU', name: 'Mauritius' },
  { code: '+261', label: 'MG', name: 'Madagascar' },
  { code: '+56', label: 'CL', name: 'Chile' },
  { code: '+57', label: 'CO', name: 'Colombia' },
  { code: '+51', label: 'PE', name: 'Peru' },
  { code: '+58', label: 'VE', name: 'Venezuela' },
  { code: '+593', label: 'EC', name: 'Ecuador' },
  { code: '+595', label: 'PY', name: 'Paraguay' },
  { code: '+598', label: 'UY', name: 'Uruguay' },
  { code: '+502', label: 'GT', name: 'Guatemala' },
  { code: '+503', label: 'SV', name: 'El Salvador' },
  { code: '+504', label: 'HN', name: 'Honduras' },
  { code: '+505', label: 'NI', name: 'Nicaragua' },
  { code: '+506', label: 'CR', name: 'Costa Rica' },
  { code: '+507', label: 'PA', name: 'Panama' },
  { code: '+53', label: 'CU', name: 'Cuba' },
  { code: '+1', label: 'PR', name: 'Puerto Rico' },
  { code: '+1', label: 'JM', name: 'Jamaica' },
  { code: '+509', label: 'HT', name: 'Haiti' },
  { code: '+1', label: 'DO', name: 'Dominican Rep.' },
  { code: '+501', label: 'BZ', name: 'Belize' },
  { code: '+592', label: 'GY', name: 'Guyana' },
  { code: '+597', label: 'SR', name: 'Suriname' },
  { code: '+591', label: 'BO', name: 'Bolivia' },
  { code: '+64', label: 'NZ', name: 'New Zealand' },
  { code: '+679', label: 'FJ', name: 'Fiji' },
  { code: '+675', label: 'PG', name: 'Papua New Guinea' },
  { code: '+852', label: 'HK', name: 'Hong Kong' },
  { code: '+853', label: 'MO', name: 'Macau' },
  { code: '+886', label: 'TW', name: 'Taiwan' },
  { code: '+855', label: 'KH', name: 'Cambodia' },
  { code: '+856', label: 'LA', name: 'Laos' },
  { code: '+95', label: 'MM', name: 'Myanmar' },
  { code: '+976', label: 'MN', name: 'Mongolia' },
  { code: '+992', label: 'TJ', name: 'Tajikistan' },
  { code: '+993', label: 'TM', name: 'Turkmenistan' },
  { code: '+998', label: 'UZ', name: 'Uzbekistan' },
  { code: '+996', label: 'KG', name: 'Kyrgyzstan' },
  { code: '+994', label: 'AZ', name: 'Azerbaijan' },
  { code: '+995', label: 'GE', name: 'Georgia' },
  { code: '+374', label: 'AM', name: 'Armenia' },
  { code: '+355', label: 'AL', name: 'Albania' },
  { code: '+387', label: 'BA', name: 'Bosnia' },
  { code: '+389', label: 'MK', name: 'North Macedonia' },
  { code: '+382', label: 'ME', name: 'Montenegro' },
  { code: '+381', label: 'RS', name: 'Serbia' },
  { code: '+385', label: 'HR', name: 'Croatia' },
  { code: '+386', label: 'SI', name: 'Slovenia' },
  { code: '+359', label: 'BG', name: 'Bulgaria' },
  { code: '+421', label: 'SK', name: 'Slovakia' },
  { code: '+370', label: 'LT', name: 'Lithuania' },
  { code: '+371', label: 'LV', name: 'Latvia' },
  { code: '+372', label: 'EE', name: 'Estonia' },
  { code: '+375', label: 'BY', name: 'Belarus' },
  { code: '+373', label: 'MD', name: 'Moldova' },
  { code: '+354', label: 'IS', name: 'Iceland' },
  { code: '+352', label: 'LU', name: 'Luxembourg' },
  { code: '+356', label: 'MT', name: 'Malta' },
  { code: '+357', label: 'CY', name: 'Cyprus' },
  { code: '+376', label: 'AD', name: 'Andorra' },
  { code: '+377', label: 'MC', name: 'Monaco' },
  { code: '+378', label: 'SM', name: 'San Marino' },
  { code: '+423', label: 'LI', name: 'Liechtenstein' },
  { code: '+350', label: 'GI', name: 'Gibraltar' },
  { code: '+299', label: 'GL', name: 'Greenland' },
  { code: '+298', label: 'FO', name: 'Faroe Islands' },
  { code: '+262', label: 'RE', name: 'Reunion' },
  { code: '+269', label: 'KM', name: 'Comoros' },
  { code: '+238', label: 'CV', name: 'Cape Verde' },
  { code: '+239', label: 'ST', name: 'Sao Tome' },
  { code: '+240', label: 'GQ', name: 'Equatorial Guinea' },
  { code: '+241', label: 'GA', name: 'Gabon' },
  { code: '+242', label: 'CG', name: 'Congo' },
  { code: '+243', label: 'CD', name: 'DR Congo' },
  { code: '+245', label: 'GW', name: 'Guinea-Bissau' },
  { code: '+224', label: 'GN', name: 'Guinea' },
  { code: '+223', label: 'ML', name: 'Mali' },
  { code: '+222', label: 'MR', name: 'Mauritania' },
  { code: '+220', label: 'GM', name: 'Gambia' },
  { code: '+232', label: 'SL', name: 'Sierra Leone' },
  { code: '+231', label: 'LR', name: 'Liberia' },
  { code: '+228', label: 'TG', name: 'Togo' },
  { code: '+229', label: 'BJ', name: 'Benin' },
  { code: '+226', label: 'BF', name: 'Burkina Faso' },
  { code: '+227', label: 'NE', name: 'Niger' },
  { code: '+235', label: 'TD', name: 'Chad' },
  { code: '+236', label: 'CF', name: 'Central African Rep.' },
  { code: '+211', label: 'SS', name: 'South Sudan' },
  { code: '+250', label: 'RW', name: 'Rwanda' },
  { code: '+257', label: 'BI', name: 'Burundi' },
  { code: '+253', label: 'DJ', name: 'Djibouti' },
  { code: '+252', label: 'SO', name: 'Somalia' },
  { code: '+291', label: 'ER', name: 'Eritrea' },
  { code: '+248', label: 'SC', name: 'Seychelles' },
  { code: '+265', label: 'MW', name: 'Malawi' },
  { code: '+266', label: 'LS', name: 'Lesotho' },
  { code: '+268', label: 'SZ', name: 'Eswatini' },
  { code: '+297', label: 'AW', name: 'Aruba' },
  { code: '+599', label: 'CW', name: 'Curacao' },
  { code: '+1', label: 'BS', name: 'Bahamas' },
  { code: '+1', label: 'BB', name: 'Barbados' },
  { code: '+1', label: 'LC', name: 'Saint Lucia' },
  { code: '+1', label: 'GD', name: 'Grenada' },
  { code: '+1', label: 'DM', name: 'Dominica' },
  { code: '+1', label: 'KN', name: 'Saint Kitts' },
  { code: '+1', label: 'VC', name: 'Saint Vincent' },
  { code: '+1', label: 'AG', name: 'Antigua' },
  { code: '+1', label: 'TC', name: 'Turks & Caicos' },
  { code: '+1', label: 'VG', name: 'British Virgin Islands' },
  { code: '+1', label: 'KY', name: 'Cayman Islands' },
  { code: '+1', label: 'BM', name: 'Bermuda' },
  { code: '+682', label: 'CK', name: 'Cook Islands' },
  { code: '+685', label: 'WS', name: 'Samoa' },
  { code: '+676', label: 'TO', name: 'Tonga' },
  { code: '+678', label: 'VU', name: 'Vanuatu' },
  { code: '+677', label: 'SB', name: 'Solomon Islands' },
  { code: '+691', label: 'FM', name: 'Micronesia' },
  { code: '+692', label: 'MH', name: 'Marshall Islands' },
  { code: '+680', label: 'PW', name: 'Palau' },
  { code: '+686', label: 'KI', name: 'Kiribati' },
  { code: '+674', label: 'NR', name: 'Nauru' },
  { code: '+673', label: 'BN', name: 'Brunei' },
  { code: '+670', label: 'TL', name: 'East Timor' },
  { code: '+960', label: 'MV', name: 'Maldives' },
  { code: '+975', label: 'BT', name: 'Bhutan' },
  { code: '+970', label: 'PS', name: 'Palestine' },
];

const REGIONS = COUNTRY_CODES.map(c => c.name);

const PAYMENT_METHODS = [
  { id: 'bKash', name: 'bKash' },
  { id: 'Nagad', name: 'Nagad' },
  { id: 'Rocket', name: 'Rocket' },
  { id: 'Upay', name: 'Upay' },
  { id: 'Bank', name: 'Bank Transfer' },
  { id: 'Binance', name: 'Binance (USDT)' },
];

export function Login() {
  const { language: activeLang, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Custom View Mode: 'login' or 'register'
  const [viewMode, setViewMode] = useState<'login' | 'register'>('login');
  
  // Custom Registration inputs
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regCountryCode, setRegCountryCode] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRegion, setRegRegion] = useState('');
  const [regPaymentMethod, setRegPaymentMethod] = useState('bKash');
  const [regTransactionId, setRegTransactionId] = useState('');
  const [regAmountPaid, setRegAmountPaid] = useState('');
  const [regExpectedFee, setRegExpectedFee] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  const [branding, setBranding] = useState<Partial<CompanySettings>>({
    loginPageName: 'Master Terminal',
    loginPageLogoUrl: '',
    appVersion: '1.0'
  });
  
  const [fullSettings, setFullSettings] = useState<Partial<CompanySettings>>({});

  const languages = [
    { code: 'EN', label: 'English', flag: '🇺🇸' },
    { code: 'BN', label: 'Bangla', flag: '🇧🇩' },
    { code: 'UR', label: 'Urdu', flag: '🇵🇰' },
    { code: 'HI', label: 'Hindi', flag: '🇮🇳' },
  ];

  const { login, isSuccessTransition, successUsername } = useAuth();

  useEffect(() => {
    async function fetchBranding() {
      try {
        const settings = await getDocumentById<CompanySettings>('settings', 'global');
        if (settings) {
          setFullSettings(settings);
          setBranding({
            loginPageName: settings.loginPageName || 'Master Terminal',
            loginPageLogoUrl: settings.loginPageLogoUrl || '',
            appVersion: settings.appVersion || '1.0'
          });
        }
      } catch (e) {
        // Fallback to localStorage if Firestore fails (unauthorized)
        const saved = localStorage.getItem('company_settings');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setFullSettings(parsed);
            setBranding({
              loginPageName: parsed.loginPageName || 'Master Terminal',
              loginPageLogoUrl: parsed.loginPageLogoUrl || '',
              appVersion: parsed.appVersion || '1.0'
            });
          } catch (err) {}
        }
      }
    }
    fetchBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (!success) {
        setError('ভুল ইউজারনেম অথবা পাসওয়ার্ড দেওয়া হয়েছে! দয়া করে সঠিক মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন। (Incorrect Username or Password! Please provide correct login credentials.)');
      }
    } catch (err: any) {
      if (err.message === 'pending_approval') {
        setError('আপনার অ্যাকাউন্ট এখনো এডমিন এপ্রুভাল এর জন্য পেন্ডিং আছে। অনুগ্রহ করে এডমিনের অনুমোদনের জন্য অপেক্ষা করুন। (Your account is pending admin approval.)');
      } else if (err.message === 'rejected') {
        setError('আপনার অ্যাকাউন্ট অনুরোধটি বাতিল করা হয়েছে। নতুন রেজিস্ট্রেশন করুন বা এডমিনের সাথে যোগাযোগ করুন। (Your account request was rejected.)');
      } else if (err.message === 'invalid_credentials') {
        setError('ভুল ইউজারনেম অথবা পাসওয়ার্ড দেওয়া হয়েছে! দয়া করে সঠিক মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন। (Incorrect Username or Password! Please provide correct login credentials.)');
      } else {
        setError(t('unexpected_error') + " " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setRegSuccessMessage('');

    if (!regName || !regPassword || !regPhone || !regEmail || !regCountryCode || !regRegion) {
      setError('অনুগ্রহ করে সব প্রয়োজনীয় ঘর পূরণ করুন (নাম, পাসওয়ার্ড, দেশের কোড, মোবাইল নম্বর এবং অঞ্চল)।');
      setIsLoading(false);
      return;
    }

    let basePhone = regPhone.trim();
    if (basePhone.startsWith('0')) {
      basePhone = basePhone.substring(1);
    }
    const processedPhone = basePhone.startsWith('+') ? basePhone : regCountryCode + basePhone;
    const cleanEmail = regEmail.trim().toLowerCase();

    // 1. Prepare user document payload
    const regData = {
      name: regName,
      username: processedPhone, // Store phone number as login username
      password: regPassword,
      role: 'user', // Default customer role
      status: 'pending', // Awaiting admin approval
      price: 0,
      paidAmount: 0,
      dueAmount: 0,
      phone: processedPhone,
      countryCode: regCountryCode,
      whatsapp: processedPhone,
      email: cleanEmail,
      region: regRegion,
      paymentMethod: '',
      transactionId: '',
      createdAt: new Date().toISOString(),
      note: 'Customer self-registered from log-in terminal'
    };

    let savedToFirestore = false;
    let savedToLocal = false;

    // Timeout helper to prevent infinite loading state when database is unconfigured/offline
    const withTimeout = async <T,>(promise: Promise<T>, ms: number = 8550): Promise<T> => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database call timed out')), ms)
      );
      return Promise.race([promise, timeout]);
    };

    const isPlaceholderFirebase = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed');

    if (isPlaceholderFirebase) {
      console.warn('Firebase configuration is a placeholder. Skipping Firestore validation.');
    } else {
      try {
        const usersRef = collection(db, 'users');

        // 1. Verify unique phone number in Firestore
        const qPhone = query(usersRef, where('phone', '==', processedPhone));
        const phoneSnap = await withTimeout(getDocs(qPhone));

        if (!phoneSnap.empty) {
          setError('এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত হয়েছে। দয়া করে অন্য মোবাইল নম্বর ব্যবহার করুন। (This mobile number is already registered.)');
          setIsLoading(false);
          return;
        }

        // 2. Verify unique email in Firestore
        const qEmail = query(usersRef, where('email', '==', cleanEmail));
        const emailSnap = await withTimeout(getDocs(qEmail));

        if (!emailSnap.empty) {
          setError('এই ইমেইল ঠিকানাটি ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে অন্য ইমেইল ব্যবহার করুন। (This email address is already registered.)');
          setIsLoading(false);
          return;
        }

        // 3. Write payload directly to Firestore
        const usersSnap = await withTimeout(getDocs(collection(db, 'users')));
        if (usersSnap.empty) {
          regData.role = 'admin';
          regData.status = 'approved';
          regData.note = 'Initial database master admin account';
        }

        await withTimeout(addDoc(collection(db, 'users'), regData));
        savedToFirestore = true;
      } catch (err: any) {
        console.warn('Firestore write failed or timed out. Falling back to local offline user registration:', err instanceof Error ? err.message : String(err));
      }
    }

    // Synchronize with localStorage locally for offline fallback reference
    try {
      const localUsersStr = localStorage.getItem('local_users') || '[]';
      const localUsers = JSON.parse(localUsersStr);
      
      const existsInLocal = localUsers.some((u: any) => 
        (u.phone && u.phone.trim() === processedPhone) || 
        (u.email && u.email.trim().toLowerCase() === cleanEmail)
      );
      
      if (existsInLocal) {
        setError('এই মোবাইল নম্বর বা ইমেইল দিয়ে ইতিমধ্যেই একটি রেজিস্ট্রেশন আবেদন করা হয়েছে। অনুগ্রহ করে এডমিন অনুমোদনের জন্য অপেক্ষা করুন। (A registration request has already been submitted with this phone or email.)');
        setIsLoading(false);
        return;
      }

      const regDataWithId = {
        ...regData,
        id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
      };
      localUsers.push(regDataWithId);
      localStorage.setItem('local_users', safeStringify(localUsers));
      window.dispatchEvent(new Event('local_users_updated'));
      savedToLocal = true;
    } catch (e: any) {
      console.error('LocalStorage persist error:', e);
    }

    if (savedToFirestore || savedToLocal) {
      if (regData.role === 'admin') {
        setRegSuccessMessage('রেজিস্ট্রেশন এবং এপ্রুভাল সফল হয়েছে! আপনিই এই সিস্টেমের প্রথম মাস্টার এডমিন (Approved Admin)। পেজের ওপরে লগইন ট্যাবে গিয়ে আপনার মোবাইল নম্বর এবং পাসওয়ার্ড দিয়ে এখনই ইনস্ট্যান্টলি লগইন করতে পারেন!');
      } else {
        setRegSuccessMessage('রেজিস্ট্রেশন অত্যন্ত সফল হয়েছে! এডমিন ভেরিফাই করে আপনার অ্যাকাউন্ট ৫-১০ মিনিটে চালু করবে।');
      }
      
      // Clear registration credentials
      setRegName('');
      setRegUsername('');
      setRegPassword('');
      setRegPhone('');
      setRegWhatsapp('');
      setRegEmail('');
      setRegTransactionId('');
      setRegAmountPaid('');
      setRegExpectedFee('');
    } else {
      setError('রেজিস্ট্রেশন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-6 selection:bg-indigo-600 selection:text-white relative overflow-hidden font-sans">
      {/* Language Selector Top End */}
      <div className="absolute top-6 end-6 z-50">
        <div className="relative">
          <button 
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-all text-[11px] font-black uppercase tracking-wider text-slate-600"
          >
            <Globe size={14} className="text-indigo-600" />
            <span>{languages.find(l => l.code === activeLang)?.label}</span>
          </button>

          <AnimatePresence>
            {isLangOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsLangOpen(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-full end-0 mt-2 w-40 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 overflow-hidden"
                >
                  {languages.map((lang) => (
                    <button 
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code as Language);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-bold transition-colors ${activeLang === lang.code ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-xs">{lang.flag}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Futuristic Background Circles & Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-indigo-100 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-violet-100 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full ${viewMode === 'register' ? 'max-w-xl' : 'max-w-md'} relative z-10 transition-all duration-500`}
      >
        {/* Logo and Header Block */}
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-3 shadow-md overflow-hidden relative"
          >
            {branding.loginPageLogoUrl ? (
              <img src={branding.loginPageLogoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Shield size={26} strokeWidth={1.5} className="text-indigo-600" />
            )}
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-505"></div>
          </motion.div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1 uppercase">{branding.loginPageName}</h1>
          <p className="text-slate-500 font-bold text-xs tracking-wide">
            {viewMode === 'register' ? 'সিস্টেমে নতুন গ্রাহক নিবন্ধন করুন' : t('welcome_back')}
          </p>
        </div>

        {/* Central Auth Container */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-150 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/60 overflow-hidden relative">
          
          {/* Sign In vs Register Tabs */}
          <div className="flex border-b border-slate-100 pb-3 mb-6">
            <button 
              type="button" 
              onClick={() => { setViewMode('login'); setError(''); setRegSuccessMessage(''); }}
              className={`flex-1 text-center pb-2 text-xs md:text-sm font-black transition-all relative uppercase tracking-wider ${viewMode === 'login' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              লগইন (Sign In)
              {viewMode === 'login' && (
                <motion.div layoutId="active-tab-line" className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30" />
              )}
            </button>
            <button 
              type="button" 
              onClick={() => { setViewMode('register'); setError(''); setRegSuccessMessage(''); }}
              className={`flex-1 text-center pb-2 text-xs md:text-sm font-black transition-all relative uppercase tracking-wider ${viewMode === 'register' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              রেজিস্ট্রেশন (Register)
              {viewMode === 'register' && (
                <motion.div layoutId="active-tab-line" className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30" />
              )}
            </button>
          </div>

          {viewMode === 'login' ? (
            /* LOGIN FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 ms-1 uppercase tracking-widest">{t('username')}</label>
                <div className="relative group/input">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 ps-11 pe-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-[14px]"
                    placeholder={t('enter_username')}
                    autoComplete="off"
                    required
                  />
                  <UserIcon className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 ms-1 uppercase tracking-widest">{t('password')}</label>
                <div className="relative group/input">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 ps-11 pe-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-[14px]"
                    placeholder={t('enter_password')}
                    autoComplete="current-password"
                    required
                  />
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" size={16} />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Informative Incorrect User Alert banner */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 8 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center leading-relaxed space-y-1"
                >
                  <div className="flex items-center justify-center gap-1.5 text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <span className="uppercase text-[9px] font-black tracking-wider">ভুল তথ্য সনাক্তকরণ (Auth Failed)</span>
                  </div>
                  <p className="text-slate-700 font-semibold">{error}</p>
                </motion.div>
              )}

              <motion.button 
                type="submit" 
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="relative overflow-hidden w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-500 disabled:opacity-90 group shadow-lg shadow-indigo-150 uppercase tracking-widest text-xs mt-2 cursor-pointer"
              >
                {/* Animated shine line */}
                {!isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
                    initial={{ left: "-100%" }}
                    whileHover={{ left: "100%" }}
                    transition={{ duration: 0.75, ease: "easeOut" }}
                  />
                )}

                {isLoading ? (
                  <div className="flex items-center gap-2.5 py-0.5">
                    <span className="relative flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-white items-center justify-center shadow-xs">
                        <Loader2 className="animate-spin text-indigo-600" size={13} />
                      </span>
                    </span>
                    <motion.span 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] font-black tracking-widest text-indigo-50 font-sans"
                    >
                      ভেরিফাই করা হচ্ছে (Verifying...)
                    </motion.span>
                  </div>
                ) : (
                  <>
                    <span className="text-[13px]">{t('sign_in')}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}

                {/* Sweeping progress loading bar on bottom border */}
                {isLoading && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-[3.5px] bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
                  />
                )}
              </motion.button>

              <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-center space-y-3">
                <p className="text-[11px] text-indigo-900 font-semibold leading-relaxed">
                  নতুন গ্রাহক? উপরের <span className="text-indigo-600 font-bold">রেজিস্ট্রেশন (Register)</span> বাটনে ট্যাপ করে রেজিস্ট্রেশন আবেদন জমা দিন। এডমিন ভেরিফাই করে আপনার অ্যাকাউন্ট ৫ মিনিটের মধ্যে সচল করে দিবে।
                </p>
                <p className="text-[9px] text-indigo-600/60 font-mono mt-1">
                  (New User? Tap "Register" tab to request access. Admin approves instantly.)
                </p>
              </div>
            </form>
          ) : regSuccessMessage ? (
            /* DEDICATED MAJESTIC REGISTRATION SUCCESS PANEL */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center py-4"
            >
              <div className="relative mx-auto w-20 h-20">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-20 h-20 bg-emerald-50/50 border-2 border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-xl">
                  <CheckCircle size={42} className="stroke-[1.5] text-emerald-600" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-wide">রেজিস্ট্রেশন আবেদন সফল! (Submitted!)</h3>
                <p className="text-emerald-600 font-bold text-xs">আপনার অ্যাকাউন্টটি নিষ্ক্রিয় অবস্থায় পেন্ডিং আছে।</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-slate-700 text-xs leading-relaxed text-left space-y-2.5">
                <p className="font-semibold text-slate-800 text-center text-xs leading-relaxed">
                  {regSuccessMessage}
                </p>
                <div className="h-[1px] bg-slate-200/60"></div>
                <p className="text-[11px] text-slate-500 text-center leading-normal">
                  সিস্টেম আপনার আবেদনটি সফলভাবে নথিবদ্ধ করেছে। দ্রুত সক্রিয় করতে অনুগ্রহ করে আমাদের হেল্পলাইন বা হোয়াটসঅ্যাপে যোগাযোগ করতে পারেন।
                </p>
              </div>

              <div className="pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setViewMode('login');
                    setRegSuccessMessage('');
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  লগইন স্ক্রিনে যান (Return to Login)
                </button>
              </div>
            </motion.div>
          ) : (
            /* CUSTOMER REGISTRATION INPUTS FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center leading-relaxed"
                >
                  {error}
                </motion.div>
              )}

              {/* Grid Layout to minimize space and look premium */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 ms-1 uppercase tracking-wider">Full Name (সম্পূর্ণ নাম) *</label>
                  <input 
                    type="text" 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-[13px]"
                    placeholder="Enter Full Name"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-505 ms-1 uppercase tracking-wider">Password (পাসওয়ার্ড) *</label>
                  <div className="relative">
                    <input 
                      type={showRegPassword ? "text" : "password"} 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 ps-3.5 pe-10 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-[13px]"
                      placeholder="Create Secret Password"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                    >
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-505 ms-1 uppercase tracking-wider">Mobile/WhatsApp Number *</label>
                  <div className="flex gap-1.5">
                    <select 
                      value={regCountryCode} 
                      onChange={(e) => {
                        const code = e.target.value;
                        setRegCountryCode(code);
                        const match = COUNTRY_CODES.find(c => c.code === code);
                        if (match) {
                          setRegRegion(match.name);
                        } else {
                          setRegRegion('');
                        }
                      }}
                      className={`px-2 py-2.5 text-[11px] font-bold outline-none rounded-xl max-w-[100px] focus:border-indigo-600 transition-all ${
                        !regCountryCode 
                          ? 'bg-amber-50 border-2 border-amber-300 text-amber-900 animate-pulse' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800'
                      }`}
                      required
                    >
                      <option value="">Select Code *</option>
                      {COUNTRY_CODES.map(c => (
                        <option className="bg-white text-slate-800" key={`${c.code}-${c.label}`} value={c.code}>{c.label} ({c.code})</option>
                      ))}
                    </select>
                    <input 
                      type="tel" 
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-[13px]"
                      placeholder="e.g. 171234567"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-505 ms-1 uppercase tracking-wider">Email Address (ইমেইল) *</label>
                  <input 
                    type="email" 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-[13px]"
                    placeholder="e.g. user@gmail.com"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[10px] font-black text-slate-550 ms-1 uppercase tracking-wider">Region (দেশ/অঞ্চল) *</label>
                  <select 
                    value={regRegion} 
                    onChange={(e) => {
                      const region = e.target.value;
                      setRegRegion(region);
                      const match = COUNTRY_CODES.find(c => c.name === region);
                      if (match) {
                        setRegCountryCode(match.code);
                      } else {
                        setRegCountryCode('');
                      }
                    }}
                    className={`w-full py-2.5 px-3.5 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-semibold text-[13px] rounded-xl ${
                      !regRegion 
                        ? 'bg-amber-50 border-2 border-amber-300 text-amber-900 animate-pulse' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                    required
                  >
                    <option value="">Select Region (দেশ/অঞ্চল) *</option>
                    {REGIONS.map(r => (
                      <option className="bg-white text-slate-800" key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !regCountryCode || !regRegion || !regPhone.trim()}
                className="w-full mt-4 bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed group shadow-lg shadow-indigo-100 uppercase tracking-widest text-[11px] cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <span className="text-[12px]">নিবন্ধন জমা দিন (Register Request)</span>
                    <UserCheck size={16} />
                  </>
                )}
              </button>

              <div className="mt-3 bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
                  রেজিস্ট্রেশন সম্পন্ন হবার পর এডমিন আপনার আবেদনটি রিভিউ করে অনুমোদন করবে। এরপর আপনি লগইন করতে পারবেন।
                </p>
                <p className="text-[9px] text-amber-600/60 font-mono mt-1">
                  (After registration, the administrator will review and approve your account. Then you can log in.)
                </p>
              </div>
            </form>
          )}

        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6"
        >
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest opacity-50 font-mono">
            Master Intelligence System v{branding.appVersion} © 2026
          </p>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isSuccessTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white"
          >
            {/* Majestic Ambient light leaks in the modal background */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -20 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-10 md:p-12 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] max-w-sm w-full text-center border border-white/20 dark:border-slate-800/80 relative overflow-hidden"
            >
              {/* Premium Multi-Color Glow Top Ribbon */}
              <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 animate-gradient-xy" />
              
              {/* Concentric Pulsing Visual Rings around the Green Checkmark */}
              <div className="relative mx-auto w-28 h-28 mb-8 flex items-center justify-center">
                {/* Outermost dotted rotating ring */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/20 dark:border-emerald-400/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Middle pulsing ring */}
                <motion.div 
                  className="absolute w-24 h-24 rounded-full bg-emerald-500/5 dark:bg-emerald-400/5 border border-emerald-500/10 dark:border-emerald-400/10"
                  animate={{ scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Inner solid circular icon card */}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", damping: 14, stiffness: 220 }}
                  className="w-20 h-20 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/30 dark:to-slate-900 border-2 border-emerald-500/35 dark:border-emerald-400/30 rounded-full flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-xl shadow-emerald-500/10 relative z-10"
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M20 6 9 17l-5-5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
                    />
                  </motion.svg>
                </motion.div>
                
                {/* Fluid neon ripple effect */}
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '2.5s' }} />
              </div>

              {/* Title Section */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-widest uppercase rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AUTHENTICATION SUCCESSFUL
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  Welcome Back!
                </h2>
                
                <p className="text-slate-600 dark:text-slate-300 font-bold text-[15px] max-w-[260px] mx-auto truncate">
                  {successUsername || 'User'}
                </p>
              </motion.div>

              {/* Real-time Status Progress bar & Tickers */}
              <div className="mt-8 space-y-3.5">
                {/* Modern Loader Spinner with Glowing Ring */}
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                  <motion.div 
                    className="absolute inset-0 rounded-full border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent border-r-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <Shield size={16} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </div>

                {/* Secure Status Text Ticker that changes gracefully to keep user engaged */}
                <div className="h-10 flex flex-col items-center justify-center overflow-hidden">
                  <motion.div
                    animate={{ y: [0, -28, -56] }}
                    transition={{ 
                      repeat: Infinity, 
                      repeatType: "loop", 
                      duration: 4.5, 
                      ease: "easeInOut",
                      times: [0, 0.45, 0.9]
                    }}
                    className="space-y-4 text-center"
                  >
                    {/* Status Ticker 1 */}
                    <div className="h-5">
                      <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
                        নিরাপদ চ্যানেল স্থাপন করা হচ্ছে... (Establishing channel...)
                      </span>
                    </div>
                    {/* Status Ticker 2 */}
                    <div className="h-5">
                      <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400">
                        ক্রেডেনসিয়াল ভেরিফাই করা হয়েছে (Session verified)
                      </span>
                    </div>
                    {/* Status Ticker 3 */}
                    <div className="h-5">
                      <span className="text-[12px] font-bold text-emerald-650 dark:text-emerald-400">
                        ড্যাশবোর্ড প্রস্তুত করা হচ্ছে (Launching dashboard)
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
