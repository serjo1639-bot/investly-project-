/**
 * api.js — Data layer for Investly
 *
 * Architecture
 * ────────────
 * Every exported object (projectsAPI, authAPI, …) has the same dual-mode
 * pattern:
 *
 *   if (shouldUseMock())  → return local mock data (with artificial delay)
 *   else                  → call the real server via apiRequest()
 *
 * This means the UI works identically with or without a backend.
 * To switch to a real server: set useMockApi = false in app.json / .env.
 *
 * Key helpers
 * ───────────
 *   normalizeProject  — maps any server shape to the canonical project object
 *   mergeProjects     — merges two project arrays, primary wins per-field
 *   getDefaultImage   — deterministic image assignment by project ID
 *   resolveProjectImage — turns any image value into a valid <Image source>
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, apiRequest, apiUpload, setAuthToken } from './backendConfig';

// ─── Image assets ─────────────────────────────────────────────────────────────
// All project photos are bundled locally for offline/mock use.
// require() returns a numeric ID that React Native's Image component resolves.
const projectImages = {
  '1':  require('../assets/119761-OPOT89-151.jpg'),
  '2':  require('../assets/3573406.jpg'),
  '3':  require('../assets/3834682.jpg'),
  '4':  require('../assets/4991053.jpg'),
  '5':  require('../assets/4077322_a979_4.webp'),  // kept in projectImages but excluded from pool
  '6':  require('../assets/36f9c6e9b15c1104375ee7aef7c5ec81.jpg'),
  '7':  require('../assets/d7750cc26559c2db3a7398d97cac3405.jpg'),
  '8':  require('../assets/a23d9c6840ad1b3432d73437bd7aa3e1.jpg'),
  '9':  require('../assets/review-best-udemy-courses.jpg'),
  '10': require('../assets/61_Best-Udemy-Alternatives-For-Instructors-ONLINE-COURSE-MARKETPLACES.jpg'),
};

const LOCAL_PROJECTS_KEY = 'local_owner_projects';
const DEFAULT_CURRENCY = 'LYD';

// IMAGE_POOL — images used for automatic assignment when a project has no explicit image.
// Image 5 (.webp) is excluded: React Native's static bundler may blank it on some iOS builds.
const IMAGE_POOL = [
  projectImages['1'], projectImages['2'], projectImages['3'], projectImages['4'],
  projectImages['6'], projectImages['7'], projectImages['8'],
  projectImages['9'], projectImages['10'],
];

export const DEFAULT_PROJECT_IMAGE = projectImages['1'];

// ─── getDefaultImage ──────────────────────────────────────────────────────────
/**
 * Returns a deterministic image from IMAGE_POOL based on the project id.
 *
 * Why deterministic?
 *   We want the same project to always show the same image — even after the
 *   app restarts — without storing the image choice in the database.
 *
 * How it works:
 *   1. Strip all non-digit characters from the id string
 *   2. Parse to an integer n (default 0 on failure)
 *   3. Use n % pool.length as the index  →  cycles through the pool
 *
 * Example: id="proj_007" → digits="007" → n=7 → index = 7 % 7 = 0
 */
const getDefaultImage = (id) => {
  const n = Math.abs(parseInt(String(id || '0').replace(/\D/g, ''), 10) || 0);
  return IMAGE_POOL[n % IMAGE_POOL.length];
};

// ─── Mock categories ──────────────────────────────────────────────────────────
export const MOCK_CATEGORIES = [
  { id: 'tech',       labelAr: 'تقنية',          labelEn: 'Technology',      icon: 'hardware-chip-outline' },
  { id: 'energy',     labelAr: 'طاقة متجددة',    labelEn: 'Renewable Energy', icon: 'flash-outline' },
  { id: 'agri',       labelAr: 'زراعة',           labelEn: 'Agriculture',      icon: 'leaf-outline' },
  { id: 'health',     labelAr: 'صحة',             labelEn: 'Health',           icon: 'medkit-outline' },
  { id: 'edu',        labelAr: 'تعليم',           labelEn: 'Education',        icon: 'school-outline' },
  { id: 'realestate', labelAr: 'عقارات',          labelEn: 'Real Estate',      icon: 'business-outline' },
];

// ─── Mock project data ────────────────────────────────────────────────────────
// 8 tech projects covering diverse Libyan cities.
// These are the data shown when useMockApi = true (no server needed).
const mockProjects = [
  {
    id: '1',
    titleAr: 'منصة تقنية متقدمة',
    titleEn: 'Advanced Tech Platform',
    cityAr: 'طرابلس', cityEn: 'Tripoli',
    descriptionAr: 'منصة تقنية مبتكرة تهدف لتطوير حلول برمجية متكاملة للشركات الليبية.',
    descriptionEn: 'An innovative tech platform delivering integrated software solutions for Libyan businesses.',
    image: projectImages['1'],
    goal: 50000, raised: 25000, status: 'active',
    reference: 'PRJ-001', category: 'tech',
    categoryAr: 'تقنية', categoryEn: 'Technology',
    minInvestment: 5, currencyCode: DEFAULT_CURRENCY, progress: 50,
    investorsCount: 14, viewsCount: 238,
    founderName: 'أحمد الورفلي', founderEmail: 'ahmed@tech.ly',
  },
  {
    id: '2',
    titleAr: 'تطبيق الذكاء الاصطناعي للأعمال',
    titleEn: 'AI Business Intelligence App',
    cityAr: 'بنغازي', cityEn: 'Benghazi',
    descriptionAr: 'تطبيق متكامل يعتمد الذكاء الاصطناعي لتحليل البيانات ودعم قرارات الأعمال.',
    descriptionEn: 'An integrated AI app for business data analytics and decision support.',
    image: projectImages['2'],
    goal: 100000, raised: 45000, status: 'active',
    reference: 'PRJ-002', category: 'tech',
    categoryAr: 'تقنية', categoryEn: 'Technology',
    minInvestment: 10, currencyCode: DEFAULT_CURRENCY, progress: 45,
    investorsCount: 7, viewsCount: 181,
    founderName: 'سراج شليق', founderEmail: 'seraj@ai.ly',
  },
  {
    id: '3',
    titleAr: 'منصة التعليم الذكي',
    titleEn: 'Smart Education Platform',
    cityAr: 'مصراتة', cityEn: 'Misrata',
    descriptionAr: 'منصة تعليمية تستخدم تقنيات التعلم الآلي لتوفير تجربة مخصصة لكل طالب.',
    descriptionEn: 'An e-learning platform using ML to deliver personalised experiences.',
    image: projectImages['3'],
    goal: 75000, raised: 30000, status: 'active',
    reference: 'PRJ-003', category: 'tech',
    categoryAr: 'تقنية', categoryEn: 'Technology',
    minInvestment: 5, currencyCode: DEFAULT_CURRENCY, progress: 40,
    investorsCount: 9, viewsCount: 154,
    founderName: 'محمد سوان', founderEmail: 'mohammed@edu.ly',
  },
  {
    id: '4',
    titleAr: 'نظام إدارة سلسلة التوريد',
    titleEn: 'Supply Chain Management System',
    cityAr: 'الزاوية', cityEn: 'Zawiya',
    descriptionAr: 'نظام رقمي متكامل لإدارة سلاسل التوريد وتتبع الشحنات في الوقت الفعلي.',
    descriptionEn: 'A digital platform for end-to-end supply chain and real-time shipment tracking.',
    image: projectImages['4'],
    goal: 60000, raised: 42000, status: 'active',
    reference: 'PRJ-004', category: 'tech',
    categoryAr: 'تقنية', categoryEn: 'Technology',
    minInvestment: 8, currencyCode: DEFAULT_CURRENCY, progress: 70,
    investorsCount: 11, viewsCount: 97,
    founderName: 'علي الفيتوري', founderEmail: 'ali@supply.ly',
  },
  {
    id: '5',
    titleAr: 'تطبيق الصحة الرقمية',
    titleEn: 'Digital Health App',
    cityAr: 'سبها', cityEn: 'Sabha',
    descriptionAr: 'تطبيق صحي يربط المرضى بالأطباء ويوفر استشارات طبية عن بُعد بتقنية عالية.',
    descriptionEn: 'A healthtech app connecting patients with doctors for remote consultations.',
    image: projectImages['9'],
    goal: 80000, raised: 16000, status: 'active',
    reference: 'PRJ-005', category: 'tech',
    categoryAr: 'تقنية', categoryEn: 'Technology',
    minInvestment: 10, currencyCode: DEFAULT_CURRENCY, progress: 20,
    investorsCount: 5, viewsCount: 63,
    founderName: 'سلمى المنتصر', founderEmail: 'salma@health.ly',
  },
  {
    id: '6',
    titleAr: 'منصة التجارة الإلكترونية المحلية',
    titleEn: 'Local E-Commerce Platform',
    cityAr: 'طرابلس', cityEn: 'Tripoli',
    descriptionAr: 'منصة تجارة إلكترونية مخصصة للسوق الليبي مع دعم الدفع المحلي.',
    descriptionEn: 'An e-commerce platform built for the Libyan market with local payment support.',
    image: projectImages['6'],
    goal: 120000, raised: 96000, status: 'active',
    reference: 'PRJ-006', category: 'tech',
    categoryAr: 'تقنية', categoryEn: 'Technology',
    minInvestment: 15, currencyCode: DEFAULT_CURRENCY, progress: 80,
    investorsCount: 22, viewsCount: 412,
    founderName: 'يوسف الطاهر', founderEmail: 'yousef@ecom.ly',
  },
  {
    id: '7',
    titleAr: 'نظام الأمن السيبراني',
    titleEn: 'Cybersecurity Platform',
    cityAr: 'بنغازي', cityEn: 'Benghazi',
    descriptionAr: 'منصة أمن سيبراني للشركات والمؤسسات لحماية البيانات ومنع الاختراقات.',
    descriptionEn: 'A cybersecurity platform protecting corporate data from breaches and threats.',
    image: projectImages['7'],
    goal: 90000, raised: 18000, status: 'active',
    reference: 'PRJ-007', category: 'tech',
    categoryAr: 'تقنية', categoryEn: 'Technology',
    minInvestment: 20, currencyCode: DEFAULT_CURRENCY, progress: 20,
    investorsCount: 4, viewsCount: 88,
    founderName: 'خالد بوعجيلة', founderEmail: 'khaled@cyber.ly',
  },
  {
    id: '8',
    titleAr: 'تطبيق المدفوعات الرقمية',
    titleEn: 'Digital Payments App',
    cityAr: 'مصراتة', cityEn: 'Misrata',
    descriptionAr: 'تطبيق مدفوعات رقمية يتيح التحويل الفوري والدفع الإلكتروني داخل ليبيا.',
    descriptionEn: 'A digital wallet enabling instant transfers and e-payments across Libya.',
    image: projectImages['8'],
    goal: 200000, raised: 110000, status: 'active',
    reference: 'PRJ-008', category: 'tech',
    categoryAr: 'تقنية', categoryEn: 'Technology',
    minInvestment: 25, currencyCode: DEFAULT_CURRENCY, progress: 55,
    investorsCount: 31, viewsCount: 620,
    founderName: 'رنا القذافي', founderEmail: 'rana@pay.ly',
  },
];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

/** Returns true when mock mode is active (reads the live config value). */
const shouldUseMock = () => API_CONFIG.useMockApi;

/** Simulate network latency in mock mode so loading states are exercised. */
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── resolveUserRole ──────────────────────────────────────────────────────────
/**
 * Normalise any role string coming from the server to one of the recognised
 * app roles.  'project_manager' is accepted as an alias for 'owner'.
 * Unknown or missing roles become 'guest'.
 */
export const resolveUserRole = (value) => {
  if (value === 'owner' || value === 'project_manager') return 'owner';
  if (value === 'investor' || value === 'admin') return value;
  return 'guest';
};

// ─── normalizeProject ─────────────────────────────────────────────────────────
/**
 * Converts any server response shape into the canonical project object used
 * throughout the app.
 *
 * لماذا هذه الدالة مهمة جداً؟
 * ────────────────────────────
 * المشكلة: الخادم قد يرسل البيانات بـ naming conventions مختلفة:
 *   - server 1: { id, title, titleAr, titleEn }
 *   - server 2: { _id, title_ar, title_en }
 *   - server 3: { id, labelAr, labelEn }
 * 
 * الحل: normalizeProject يوحد كل هذه التنسيقات إلى شكل واحد موثوق
 * بحيث باقي الكود لا يضطر للتحقق من تنسيقات مختلفة في كل مكان
 * 
 * الخطوات:
 * 1. تحاول الحقول المحتملة بـ ترتيب أولويات (الأول موجود ≈ استخدمه)
 * 2. تحول كل الأرقام إلى Number() لتجنب مقارنات string في العمليات الحسابية
 * 3. الصور لديها fallback chain: explicit → deterministic from pool
 * 
 * مثال:
 *   Input:  { _id: '123', title_ar: 'اسم', titleEn: 'Name', goal: '50000' }
 *   Output: { id: '123', titleAr: 'اسم', titleEn: 'Name', goal: 50000, ... }
 * 
 * Image fallback chain:
 *   project.image (explicit) → getDefaultImage(id) (deterministic from pool)
 *
 * All numeric fields are coerced with Number() to avoid string/number bugs
 * when doing math with raised/goal later.
 */
export const normalizeProject = (project = {}) => ({
  id:          project.id    || project._id,
  titleAr:     project.titleAr       || project.title_ar       || project.title || '',
  titleEn:     project.titleEn       || project.title_en       || project.title || '',
  title:       project.titleAr       || project.title_ar       || project.titleEn || project.title_en || project.title || '',
  descriptionAr: project.descriptionAr || project.description_ar || project.description || '',
  descriptionEn: project.descriptionEn || project.description_en || project.description || '',
  description:   project.descriptionAr || project.description_ar || project.descriptionEn || project.description_en || project.description || '',
  category:    project.category      || project.category_id,
  categoryAr:  project.categoryAr    || project.category_ar    || project.classificationAr || '',
  categoryEn:  project.categoryEn    || project.category_en    || project.classificationEn || '',
  cityAr:      project.cityAr        || project.city_ar        || project.city || '',
  cityEn:      project.cityEn        || project.city_en        || project.city || '',
  city:        project.cityAr        || project.city_ar        || project.cityEn || project.city_en || project.city || '',
  // Use the explicit image if present; otherwise assign one deterministically
  image:       project.image         || getDefaultImage(project.id || project._id),
  goal:        Number(project.goal   || project.fundingGoal    || 0),
  raised:      Number(project.raised || project.currentFunding || 0),
  minInvestment: Number(project.minInvestment || project.min_investment || 5),
  maxInvestment: Number(project.maxInvestment || project.max_investment || 0),
  currencyCode: project.currencyCode || project.currency_code  || DEFAULT_CURRENCY,
  status:      project.status        || 'pending',
  reference:   project.reference     || project.ref            || null,
  ownerId:     project.ownerId       || project.owner_id,
  ownerName:   project.ownerName     || project.owner_name     || null,
  ownerCompanyName: project.ownerCompanyName || project.owner_company_name || project.companyName || null,
  progress:    Number(project.progress || project.progress_pct || 0),
  duration:    Number(project.duration || 0),
  startDate:   project.startDate     || project.start_date,
  endDate:     project.endDate       || project.end_date,
  teamSize:    Number(project.teamSize || project.team_size    || 0),
  website:     project.website       || null,
  founderName: project.founderName   || project.founder_name   || '',
  founderEmail: project.founderEmail || project.founder_email  || '',
  founderPhone: project.founderPhone || project.founder_phone  || '',
  investorsCount: Number(project.investorsCount || project.investors_count || 0),
  viewsCount:     Number(project.viewsCount     || project.views_count     || 0),
  createdAt:   project.createdAt     || project.created_at,
  updatedAt:   project.updatedAt     || project.updated_at,
});

// ─── Local project persistence (AsyncStorage) ─────────────────────────────────

/** Load and normalise all projects saved locally by this device's owner. */
const loadLocalProjects = async () => {
  try {
    const raw    = await AsyncStorage.getItem(LOCAL_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeProject) : [];
  } catch {
    return [];
  }
};

/** Persist the given project array to AsyncStorage. */
const saveLocalProjects = async (projects = []) => {
  try {
    await AsyncStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  } catch {}
};

// ─── mergeProjects ────────────────────────────────────────────────────────────
/**
 * Merges two project arrays into one, deduplicating by id.
 *
 * Strategy — "primary wins":
 *   1. Seed a Map with `secondary` projects
 *   2. Overlay `primary` projects field-by-field
 *   3. For each field, keep the primary value only if it is a real value
 *      (not undefined / null / empty-string).
 *
 * Why the `typeof value === 'number'` guard?
 *   Image require() values are numbers (e.g. 3, 17, 42).
 *   The number 0 is falsy in JS, so without this guard `value !== ''`
 *   would silently drop image IDs equal to 0, causing blank images.
 *
 * The resulting array is sorted newest-first by createdAt.
 *
 * @param {Array} primary   - Takes precedence when both arrays have the same id
 * @param {Array} secondary - Falls back to these values when primary field is empty
 */
const mergeProjects = (primary = [], secondary = []) => {
  const map = new Map();

  // Load secondary first so primary can overwrite
  [...secondary, ...primary].forEach((project) => {
    const normalized = normalizeProject(project);
    if (!normalized?.id) return;

    const previous = map.get(normalized.id) || {};
    const next     = { ...previous };

    Object.entries(normalized).forEach(([key, value]) => {
      // Accept numbers (includes 0 for image require IDs), real strings, and objects
      const isValid = value !== undefined && value !== null && value !== '';
      if (isValid || typeof value === 'number') {
        next[key] = value;
      }
    });

    map.set(normalized.id, next);
  });

  return Array.from(map.values()).sort((a, b) => {
    const left  = new Date(b.createdAt || 0).getTime();
    const right = new Date(a.createdAt || 0).getTime();
    return left - right;
  });
};

// ─── buildLocalProject ────────────────────────────────────────────────────────
/**
 * Creates a locally-stored draft when a project owner submits a new project
 * while offline or when the server hasn't responded yet.
 * The id starts with "local_" so the server can detect unsynchronised records.
 */
const buildLocalProject = (ownerId, projectData = {}) => {
  const timestamp  = new Date().toISOString();
  const tempId     = `local_${Date.now()}`;
  const safeGoal   = Number(projectData.fundingGoal || projectData.goal || 0);
  const safeRaised = Number(projectData.raised || 0);

  return normalizeProject({
    id:               tempId,
    ownerId,
    ownerName:        projectData.ownerName        || projectData.founderName    || 'Project Owner',
    ownerCompanyName: projectData.ownerCompanyName || projectData.companyName    || null,
    titleAr:          projectData.titleAr,
    titleEn:          projectData.titleEn          || projectData.titleAr,
    descriptionAr:    projectData.descriptionAr,
    descriptionEn:    projectData.descriptionEn    || projectData.descriptionAr,
    cityAr:           projectData.cityAr,
    cityEn:           projectData.cityEn           || projectData.cityAr,
    category:         projectData.category,
    image:            projectData.image            || projectData.imageUri       || DEFAULT_PROJECT_IMAGE,
    goal:             safeGoal,
    raised:           safeRaised,
    minInvestment:    Number(projectData.minInvestment || 5),
    maxInvestment:    Number(projectData.maxInvestment || 0),
    currencyCode:     DEFAULT_CURRENCY,
    duration:         Number(projectData.duration  || projectData.durationDays  || 0),
    founderName:      projectData.founderName      || projectData.ownerName      || '',
    founderEmail:     projectData.founderEmail     || '',
    founderPhone:     projectData.founderPhone     || '',
    teamSize:         Number(projectData.teamSize  || 0),
    website:          projectData.website          || null,
    status:           'pending',
    reference:        `LOCAL-${Date.now()}`,
    investorsCount:   0,
    viewsCount:       0,
    progress:         safeGoal > 0 ? Math.round((safeRaised / safeGoal) * 100) : 0,
    createdAt:        timestamp,
    updatedAt:        timestamp,
  });
};

/** Insert or update a single project in local storage (merge strategy). */
const upsertLocalProject = async (project) => {
  const localProjects = await loadLocalProjects();
  const merged        = mergeProjects([project], localProjects);
  await saveLocalProjects(merged);
  return normalizeProject(project);
};

// ─── recordProjectView ────────────────────────────────────────────────────────
/**
 * Increments the view counter.
 * Real backend: POST /projects/:id/views  (fire-and-forget, non-blocking)
 * Mock / offline: update local AsyncStorage cache only.
 */
export const recordProjectView = async (projectId) => {
  if (!projectId) return;

  // Hit the real API endpoint (non-blocking — never fails the caller)
  if (!shouldUseMock()) {
    apiRequest({
      path:   API_CONFIG.endpoints.projects.recordView(projectId),
      method: 'POST',
    }).catch(() => {});  // silently ignore — view tracking is non-critical
  }

  // Also update local cache so OwnerDashboard reads reflect the increment offline
  const localProjects = await loadLocalProjects();
  const exists = localProjects.some((p) => p.id === projectId);

  const updated = exists
    ? localProjects.map((p) =>
        p.id === projectId
          ? { ...p, viewsCount: Number(p.viewsCount || 0) + 1, updatedAt: new Date().toISOString() }
          : p
      )
    : [
        ...localProjects,
        normalizeProject({
          id:             projectId,
          viewsCount:     1,
          investorsCount: 0,
          createdAt:      new Date().toISOString(),
          updatedAt:      new Date().toISOString(),
        }),
      ];

  await saveLocalProjects(updated);
};

// ─── resolveProjectImage ──────────────────────────────────────────────────────
/**
 * Converts any image value to a valid React Native <Image> source prop.
 *
 *   number  → require() result (local bundle asset) — pass through as-is
 *   string  → treat as a remote URI   { uri: '...' }
 *   object with .uri → remote URI object — pass through
 *   anything else → fallback to DEFAULT_PROJECT_IMAGE
 */
export const resolveProjectImage = (image) => {
  if (typeof image === 'number')                          return image;
  if (typeof image === 'string' && image.trim())          return { uri: image };
  if (image && typeof image === 'object' && image.uri)    return { uri: image.uri };
  return DEFAULT_PROJECT_IMAGE;
};

// ─── Payload / session mappers ────────────────────────────────────────────────

/**
 * Build a contribution draft object to be placed in the cart.
 * Ensures the amount is at least the project's minimum investment.
 */
export const createContributionDraft = (project, amount) => {
  const normalized  = normalizeProject(project);
  const safeAmount  = Math.max(normalized.minInvestment, Number(amount || normalized.minInvestment));

  return {
    projectId:  normalized.id,
    projectRef: normalized.reference || null,
    titleAr:    normalized.titleAr   || normalized.title || '',
    titleEn:    normalized.titleEn   || normalized.title || '',
    amount:     safeAmount,
    currency:   normalized.currencyCode,
    minAmount:  normalized.minInvestment,
    status:     'pending',
  };
};

/**
 * Build the payload sent to POST /investments/checkout.
 * Each cart item becomes one contribution entry.
 */
export const buildInvestmentPayload = (items = []) => ({
  currency: DEFAULT_CURRENCY,
  contributions: items.map((item) => ({
    projectId:     item.project.id,
    reference:     item.project.reference || null,
    amount:        Number(item.amount),
    currency:      item.currency || item.project.currencyCode || DEFAULT_CURRENCY,
    paymentMethod: 'wallet',
  })),
});

/**
 * Map any raw user/session object from the server into the canonical user shape.
 * memberId is derived from the last 8 digits of the phone number when not provided.
 */
export const mapAuthSession = (data = {}) => {
  const role = resolveUserRole(data.role || data.userType || data.user_role || data.userTypeId);

  return {
    id:                 data.id           || data.userId      || data.phone || '1',
    name:               data.name         || data.fullName    || '',
    phone:              data.phone        || '',
    email:              data.email        || '',
    role,
    age:                data.age          ? Number(data.age) : null,
    gender:             data.gender       || null,
    location:           data.location     || null,
    passportUrl:        data.passportUrl  || data.passport_url || null,
    memberId:           data.memberId,
    walletBalance:      Number(data.walletBalance       ?? data.wallet_balance      ?? 0),
    totalTopups:        Number(data.totalTopups         ?? data.total_topups        ?? 0),
    contributionTotal:  Number(data.contributionTotal   ?? data.totalInvested       ?? 0),
    contributionsCount: Number(data.contributionsCount  ?? 0),
    projectsCount:      Number(data.projectsCount       ?? (role === 'owner' ? 1 : 0)),
    companyName:        data.companyName  || '',
    bio:                data.bio          || '',
    token:              data.token        || null,
  };
};

/** Shape the payload for POST /auth/verify-otp. */
export const mapLoginPayload = ({ phone, otp, role }) => ({
  phone,
  otp,
  role: resolveUserRole(role),
});

/** Shape the payload for POST /auth/register. */
export const mapRegisterPayload = (data = {}) => ({
  name:          data.name,
  phone:         data.phone,
  email:         data.email       || null,
  role:          resolveUserRole(data.role),
  age:           data.age         ? Number(data.age) : null,
  gender:        data.gender      || null,
  location:      data.location    || null,
  passportUrl:   data.passportUrl || null,
  companyName:   data.companyName || null,
  password:      data.password,
  termsAccepted: Boolean(data.termsAccepted),
});

/** Shape the payload for POST /projects (create project). */
export const mapProjectSubmissionPayload = (projectData = {}) => ({
  titleAr:       projectData.titleAr,
  titleEn:       projectData.titleEn,
  category:      projectData.category,
  cityAr:        projectData.cityAr,
  cityEn:        projectData.cityEn   || projectData.cityAr,
  fundingGoal:   Number(projectData.fundingGoal),
  minInvestment: Number(projectData.minInvestment || 5),
  maxInvestment: projectData.maxInvestment ? Number(projectData.maxInvestment) : null,
  duration:      Number(projectData.duration || projectData.durationDays || 0),
  descriptionAr: projectData.descriptionAr,
  descriptionEn: projectData.descriptionEn,
  founderName:   projectData.founderName,
  founderEmail:  projectData.founderEmail,
  founderPhone:  projectData.founderPhone,
  teamSize:      Number(projectData.teamSize || 0),
  website:       projectData.website || null,
  image:         projectData.image   || null,
});

/** Extract the data payload from a server response, with a safe fallback. */
const extractData = (response, fallback = []) => response?.data ?? response ?? fallback;

/**
 * Filter a project array by category and/or search query.
 * Extracted to avoid duplicating this logic in both mock and real API paths.
 */
const filterBySearchAndCategory = (projects, { category, search } = {}) =>
  projects.filter((project) => {
    if (category && category !== 'all' && project.category !== category) return false;
    if (!search) return true;
    const haystack = [project.titleAr, project.titleEn, project.cityAr, project.cityEn]
      .join(' ')
      .toLowerCase();
    return haystack.includes(String(search).toLowerCase());
  });

// ─── projectsAPI ──────────────────────────────────────────────────────────────
/**
 * All project-related API calls.
 *
 * getFeatured — carousel data on HomeScreen (mock: all 8 projects)
 * getAll      — filtered list for ProjectsScreen (mock: filter by category/search)
 * getCategories — category chips (mock: MOCK_CATEGORIES + "All")
 *
 * In all cases local projects (added by the owner on this device) are merged
 * on top so they appear immediately without waiting for server sync.
 */
export const projectsAPI = {
  getFeatured: async () => {
    if (shouldUseMock()) {
      await delay();
      const localProjects = await loadLocalProjects();
      return mergeProjects(localProjects, mockProjects.map(normalizeProject));
    }
    const data          = await apiRequest({ path: API_CONFIG.endpoints.projects.featured });
    const localProjects = await loadLocalProjects();
    return mergeProjects(localProjects, extractData(data).map(normalizeProject));
  },

  getAll: async ({ category, search } = {}) => {
    const filters = { category, search };

    if (shouldUseMock()) {
      await delay();
      const filtered      = filterBySearchAndCategory(mockProjects, filters);
      const localProjects = filterBySearchAndCategory(await loadLocalProjects(), filters);
      return { data: mergeProjects(localProjects, filtered.map(normalizeProject)) };
    }

    const data          = await apiRequest({
      path:  API_CONFIG.endpoints.projects.list,
      query: { category, search },
    });
    const localProjects = filterBySearchAndCategory(await loadLocalProjects(), filters);
    return { data: mergeProjects(localProjects, extractData(data).map(normalizeProject)) };
  },

  getCategories: async () => {
    if (shouldUseMock()) {
      return [{ id: 'all', labelAr: 'الكل', labelEn: 'All' }, ...MOCK_CATEGORIES];
    }
    const data = await apiRequest({ path: API_CONFIG.endpoints.projects.categories });
    return extractData(data);
  },
};

// ─── authAPI ──────────────────────────────────────────────────────────────────
export const authAPI = {
  sendOTP: async (phone) => {
    if (shouldUseMock()) {
      await delay();
      return { success: true, phone, code: '123456' };  // OTP printed in mock response for dev testing
    }
    return apiRequest({
      path:   API_CONFIG.endpoints.auth.sendOtp,
      method: 'POST',
      body:   { phone },
    });
  },

  verifyOTP: async ({ phone, otp, role }) => {
    const payload = mapLoginPayload({ phone, otp, role });
    if (shouldUseMock()) {
      await delay();
      const user = mapAuthSession({
        id:   '1',
        phone,
        role: payload.role,
        name: payload.role === 'owner' ? 'مدير مشروع' : 'مستثمر',
      });
      return { success: true, token: 'mock-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.verifyOtp,
      method: 'POST',
      body:   payload,
    });
    if (response?.token) setAuthToken(response.token);
    return response;
  },

  /** Quick login by phone only — no OTP or password required (dev / demo shortcut). */
  loginSimple: async (phone) => {
    if (shouldUseMock()) {
      await delay();
      const user = mapAuthSession({
        id:   '1',
        phone,
        role: 'investor',
        name: 'مستخدم تجريبي',
      });
      return { success: true, token: 'mock-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.loginSimple,
      method: 'POST',
      body:   { phone },
    });
    if (response?.token) setAuthToken(response.token);
    return response;
  },

  login: async ({ phone, password, role }) => {
    const payload = { phone, password, role: resolveUserRole(role) };
    if (shouldUseMock()) {
      await delay();
      const user = mapAuthSession({
        id:   '1',
        phone,
        role: payload.role,
        name: payload.role === 'owner' ? 'مدير مشروع' : 'مستخدم تجريبي',
      });
      return { success: true, token: 'mock-token', refreshToken: 'mock-refresh-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.login,
      method: 'POST',
      body:   payload,
    });
    if (response?.token) setAuthToken(response.token);
    return response;
  },

  register: async (data) => {
    const payload = mapRegisterPayload(data);
    if (shouldUseMock()) {
      await delay(800);
      const user = mapAuthSession(payload);
      return { success: true, token: 'mock-token', refreshToken: 'mock-refresh-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.register,
      method: 'POST',
      body:   payload,
    });
    if (response?.token) setAuthToken(response.token);
    return response;
  },

  getProfile: async () => {
    if (shouldUseMock()) {
      await delay();
      return mapAuthSession({ id: '1', phone: '+218XXXXXXXXX', name: 'مستخدم تجريبي', role: 'investor' });
    }
    const response = await apiRequest({ path: API_CONFIG.endpoints.auth.profile });
    return extractData(response, {});
  },

  /** Remove the in-memory token (does NOT clear AsyncStorage — call sessionManager for that). */
  clearSession: () => setAuthToken(null),

  logout: async () => {
    if (shouldUseMock()) {
      await delay();
      return { success: true };
    }
    return apiRequest({ path: API_CONFIG.endpoints.auth.logout, method: 'POST' });
  },

  refreshToken: async (refreshToken) => {
    if (shouldUseMock()) {
      await delay();
      const token = 'mock-token';
      setAuthToken(token);
      return { success: true, token };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.refreshToken,
      method: 'POST',
      body:   { refreshToken },
    });
    if (response?.token) setAuthToken(response.token);
    return response;
  },

  /** Email + password login — same session shape as phone login. */
  loginWithEmail: async ({ email, password, role }) => {
    const payload = { email: email.trim().toLowerCase(), password, role: resolveUserRole(role) };
    if (shouldUseMock()) {
      await delay();
      const user = mapAuthSession({
        id:    '1',
        email: payload.email,
        role:  payload.role,
        name:  payload.role === 'owner' ? 'مدير مشروع' : 'مستخدم تجريبي',
      });
      return { success: true, token: 'mock-token', refreshToken: 'mock-refresh-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.loginEmail,
      method: 'POST',
      body:   payload,
    });
    if (response?.token) setAuthToken(response.token);
    return response;
  },

  /**
   * Step 1 of password reset — send a 6-digit code to the user's email.
   * Backend: POST /auth/forgot-password  { email }
   */
  forgotPassword: async (email) => {
    if (shouldUseMock()) {
      await delay(600);
      return { success: true, message: 'Reset code sent (mock code: 123456)' };
    }
    return apiRequest({
      path:   API_CONFIG.endpoints.auth.forgotPassword,
      method: 'POST',
      body:   { email: email.trim().toLowerCase() },
    });
  },

  /**
   * Step 2 — verify the 6-digit code the user received by email.
   * Backend: POST /auth/verify-reset-code  { email, code }
   * Returns: { success, resetToken } — the token is stored and used in step 3.
   */
  verifyResetCode: async ({ email, code }) => {
    if (shouldUseMock()) {
      await delay(500);
      // Mock accepts any 6-digit code
      if (String(code).length !== 6) throw new Error('Invalid code');
      return { success: true, resetToken: 'mock-reset-token' };
    }
    return apiRequest({
      path:   API_CONFIG.endpoints.auth.verifyResetCode,
      method: 'POST',
      body:   { email: email.trim().toLowerCase(), code: String(code) },
    });
  },

  /**
   * Step 3 — set the new password.
   * Backend: POST /auth/reset-password  { email, code, newPassword }
   * On success the backend may return a full session (token + user) so the
   * caller can auto-login without a second request.
   */
  resetPassword: async ({ email, code, newPassword }) => {
    if (shouldUseMock()) {
      await delay(600);
      const user = mapAuthSession({
        id:   '1',
        email: email.trim().toLowerCase(),
        role: 'investor',
        name: 'مستخدم',
      });
      return { success: true, token: 'mock-token', refreshToken: 'mock-refresh-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.resetPassword,
      method: 'POST',
      body:   { email: email.trim().toLowerCase(), code: String(code), newPassword },
    });
    if (response?.token) setAuthToken(response.token);
    return response;
  },
};

// ─── usersAPI ─────────────────────────────────────────────────────────────────
export const usersAPI = {
  getById: async (userId) => {
    if (shouldUseMock()) {
      await delay();
      return { data: mapAuthSession({ id: userId, name: 'مستخدم تجريبي', phone: '+218XXXXXXXXX' }) };
    }
    const response = await apiRequest({ path: API_CONFIG.endpoints.users.details(userId) });
    return { data: mapAuthSession(extractData(response, {})) };
  },

  update: async (userId, userData) => {
    if (shouldUseMock()) {
      await delay();
      return { data: mapAuthSession({ id: userId, phone: '+218XXXXXXXXX', ...userData }) };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.users.details(userId),
      method: 'PUT',
      body:   userData,
    });
    return { data: mapAuthSession(extractData(response, {})) };
  },
};

// ─── ownerAPI ─────────────────────────────────────────────────────────────────
export const ownerAPI = {
  getProjects: async (ownerId) => {
    if (shouldUseMock()) {
      await delay();
      const localProjects = (await loadLocalProjects()).filter((p) => p.ownerId === ownerId);
      return {
        data: mergeProjects(
          localProjects,
          mockProjects.map((p) => normalizeProject({ ...p, ownerId, investorsCount: 0, returns: 0 })),
        ),
      };
    }
    const response      = await apiRequest({ path: API_CONFIG.endpoints.owners.projects(ownerId) });
    const localProjects = (await loadLocalProjects()).filter((p) => p.ownerId === ownerId);
    return { data: mergeProjects(localProjects, extractData(response).map(normalizeProject)) };
  },

  createProject: async (ownerId, projectData) => {
    const payload    = mapProjectSubmissionPayload(projectData);
    const localDraft = buildLocalProject(ownerId, projectData);

    if (shouldUseMock()) {
      await delay(900);
      const newProject = normalizeProject({
        ...localDraft,
        ...payload,
        id:         `proj_${Date.now()}`,
        ownerId,
        status:     'pending',
        reference:  `PRJ-${Date.now()}`,
        raised:     0,
        progress:   0,
        createdAt:  new Date().toISOString(),
      });
      // Saving to AsyncStorage is enough — getFeatured/getAll merge local projects on top
      await upsertLocalProject(newProject);
      return { success: true, project: newProject };
    }

    const response    = await apiRequest({
      path:   API_CONFIG.endpoints.projects.submit,
      method: 'POST',
      body:   payload,
    });
    const mergedProject = normalizeProject({
      ...localDraft,
      ...(response?.project || response?.data || {}),
      image:   response?.project?.image || payload.image || localDraft.image,
      ownerId,
    });
    await upsertLocalProject(mergedProject);
    return { success: response?.success ?? true, project: mergedProject };
  },
};

// ─── investmentAPI ────────────────────────────────────────────────────────────
export const investmentAPI = {
  confirmInvestment: async (payload) => {
    if (shouldUseMock()) {
      await delay();
      return { success: true, paymentId: `PAY-${Date.now()}`, received: payload };
    }
    return apiRequest({
      path:   API_CONFIG.endpoints.investments.confirm,
      method: 'POST',
      body:   payload,
    });
  },

  getWallet: async () => {
    if (shouldUseMock()) {
      await delay();
      return { data: { balance: 0, totalTopups: 0, totalInvested: 0, transactions: [] } };
    }
    return apiRequest({ path: API_CONFIG.endpoints.investments.wallet });
  },

  getFundingOptions: async () => {
    if (shouldUseMock()) {
      await delay();
      return {
        data: {
          methods: [
            { id: 'wallet',       nameAr: 'محفظة Investly', nameEn: 'Investly Wallet', type: 'wallet',  icon: 'wallet-outline' },
            { id: 'recharge_card', nameAr: 'بطاقة تعبئة',   nameEn: 'Recharge Card',   type: 'voucher', icon: 'card-outline' },
          ],
          rechargeCards: [
            { id: 'mock-100',     paymentMethodId: 'recharge_card', code: 'INV-LYD-100-0001',     labelAr: 'بطاقة تعبئة 100 دينار ليبي',     labelEn: 'LYD 100 Recharge Card',     amount: 100,     currency: DEFAULT_CURRENCY },
            { id: 'mock-500',     paymentMethodId: 'recharge_card', code: 'INV-LYD-500-0001',     labelAr: 'بطاقة تعبئة 500 دينار ليبي',     labelEn: 'LYD 500 Recharge Card',     amount: 500,     currency: DEFAULT_CURRENCY },
            { id: 'mock-1000',    paymentMethodId: 'recharge_card', code: 'INV-LYD-1000-0001',    labelAr: 'بطاقة تعبئة 1000 دينار ليبي',    labelEn: 'LYD 1000 Recharge Card',    amount: 1000,    currency: DEFAULT_CURRENCY },
            { id: 'mock-100000',  paymentMethodId: 'recharge_card', code: 'INV-LYD-100000-0001',  labelAr: 'بطاقة تعبئة 100000 دينار ليبي',  labelEn: 'LYD 100000 Recharge Card',  amount: 100000,  currency: DEFAULT_CURRENCY },
            { id: 'mock-1000000', paymentMethodId: 'recharge_card', code: 'INV-LYD-1000000-0001', labelAr: 'بطاقة تعبئة 1000000 دينار ليبي', labelEn: 'LYD 1000000 Recharge Card', amount: 1000000, currency: DEFAULT_CURRENCY },
          ],
        },
      };
    }
    return apiRequest({ path: API_CONFIG.endpoints.investments.fundingOptions });
  },

  redeemTopupCard: async (code) => {
    if (shouldUseMock()) {
      await delay();
      return { success: true, data: { balance: 1000, totalTopups: 1000 } };
    }
    return apiRequest({
      path:   API_CONFIG.endpoints.investments.redeemTopup,
      method: 'POST',
      body:   { code },
    });
  },
};

// ─── submitProjectAPI ─────────────────────────────────────────────────────────
/** Thin alias used by AddProjectScreen — delegates to ownerAPI.createProject. */
export const submitProjectAPI = {
  submit: async (projectData) => ownerAPI.createProject(projectData.ownerId, projectData),
};

// ─── mediaAPI ─────────────────────────────────────────────────────────────────
/**
 * Upload a single image file to the backend.
 *
 * fileAsset shape (from expo-image-picker):
 *   { uri: string, name: string, type: string }
 *
 * Mock mode: simulates an 800 ms upload and returns the local URI as the "url"
 * so the rest of the app can display it immediately without a real server.
 *
 * Real mode: POST multipart/form-data to /media/upload.
 * Expected server response: { url: string, mediaId: string }
 */
export const mediaAPI = {
  upload: async (fileAsset) => {
    if (shouldUseMock()) {
      await delay(800);
      return { success: true, url: fileAsset.uri, mediaId: `mock_media_${Date.now()}` };
    }
    const result = await apiUpload(API_CONFIG.endpoints.media.upload, fileAsset);
    // Normalise different server response shapes: { url } | { imageUrl } | { path } | { data.url }
    const url = result?.url || result?.imageUrl || result?.path || result?.data?.url || fileAsset.uri;
    return { success: true, url, mediaId: result?.mediaId || result?.id || null };
  },
};

// ─── notificationsAPI ─────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'investment',
    titleAr: 'تأكيد مساهمتك',
    titleEn: 'Investment Confirmed',
    messageAr: 'تمت معالجة مساهمتك في مشروع "منصة تقنية متقدمة" بنجاح.',
    messageEn: 'Your contribution to "Advanced Tech Platform" has been processed successfully.',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n2',
    type: 'project',
    titleAr: 'تحديث مشروع',
    titleEn: 'Project Update',
    messageAr: 'مشروع "تطبيق الذكاء الاصطناعي للأعمال" وصل إلى 50% من هدف التمويل.',
    messageEn: '"AI Business Intelligence App" reached 50% of its funding goal.',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n3',
    type: 'system',
    titleAr: 'مرحباً بك في Investly',
    titleEn: 'Welcome to Investly',
    messageAr: 'نحن سعداء بانضمامك. ابدأ باستكشاف المشاريع المتاحة والاستثمار بثقة.',
    messageEn: "We're happy to have you. Start exploring available projects and invest with confidence.",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const notificationsAPI = {
  getAll: async () => {
    if (shouldUseMock()) {
      await delay(400);
      return { data: MOCK_NOTIFICATIONS, unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length };
    }
    return apiRequest({ path: API_CONFIG.endpoints.notifications.list });
  },

  markAllAsRead: async () => {
    if (shouldUseMock()) {
      await delay(300);
      return { success: true };
    }
    return apiRequest({
      path:   API_CONFIG.endpoints.notifications?.readAll || '/notifications/read-all',
      method: 'POST',
    });
  },

  markAsRead: async (id) => {
    if (shouldUseMock()) {
      await delay(200);
      return { success: true };
    }
    return apiRequest({
      path:   `/notifications/${id}/read`,
      method: 'POST',
    });
  },
};

// ─── paymentsAPI ──────────────────────────────────────────────────────────────
/**
 * Payment operations for the PaymentsScreen and SecurePaymentScreen.
 *
 * getWallet       — fetch current wallet balance + deposit/withdrawal totals
 * getTransactions — paginated payment history with optional status filter
 * initiatePayment — submit a new card-based payment to the backend
 */
export const paymentsAPI = {
  getWallet: async () => {
    if (shouldUseMock()) {
      await delay();
      return { data: { balance: 12500, totalDeposits: 45000, totalWithdrawals: 32500 } };
    }
    return apiRequest({ path: API_CONFIG.endpoints.payments.wallet });
  },

  getTransactions: async ({ page = 1, status } = {}) => {
    if (shouldUseMock()) {
      await delay();
      const mockTx = [
        { id: 'tx1', titleAr: 'دفع استثمار - مشروع تقني', titleEn: 'Investment - Tech Platform', date: '2026-05-15', amount: 5000, status: 'completed', type: 'debit' },
        { id: 'tx2', titleAr: 'إيداع محفظة', titleEn: 'Wallet Deposit', date: '2026-05-10', amount: 10000, status: 'completed', type: 'credit' },
        { id: 'tx3', titleAr: 'دفع استثمار - طاقة شمسية', titleEn: 'Investment - Solar Energy', date: '2026-05-08', amount: 3000, status: 'pending', type: 'debit' },
        { id: 'tx4', titleAr: 'استرجاع دفعة', titleEn: 'Payment Refund', date: '2026-04-28', amount: 1500, status: 'refunded', type: 'credit' },
        { id: 'tx5', titleAr: 'دفع فاشل', titleEn: 'Failed Payment', date: '2026-04-20', amount: 2000, status: 'failed', type: 'debit' },
      ];
      if (status) return { data: mockTx.filter((t) => t.status === status) };
      return { data: mockTx };
    }
    return apiRequest({ path: API_CONFIG.endpoints.payments.history, query: { page, status } });
  },

  initiatePayment: async (data) => {
    if (shouldUseMock()) {
      await delay(1200);
      return { success: true, transactionId: `TXN-${Date.now()}`, status: 'pending', message: 'Payment submitted successfully' };
    }
    return apiRequest({ path: API_CONFIG.endpoints.payments.initiate, method: 'POST', body: data });
  },
};
