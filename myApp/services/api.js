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
    title: 'منصة تقنية متقدمة',
    city: 'طرابلس',
    description: 'منصة تقنية مبتكرة تهدف لتطوير حلول برمجية متكاملة للشركات الليبية.',
    image: projectImages['1'],
    fundingGoal: 50000, currentAmount: 25000, status: 'active',
    reference: 'PRJ-001', category: 'tech',
    minInvestment: 5, currencyCode: DEFAULT_CURRENCY, progress: 50,
    investorsCount: 14, viewsCount: 238,
    founderName: 'أحمد الورفلي', founderEmail: 'ahmed@tech.ly',
  },
  {
    id: '2',
    title: 'تطبيق الذكاء الاصطناعي للأعمال',
    city: 'بنغازي',
    description: 'تطبيق متكامل يعتمد الذكاء الاصطناعي لتحليل البيانات ودعم قرارات الأعمال.',
    image: projectImages['2'],
    fundingGoal: 100000, currentAmount: 45000, status: 'active',
    reference: 'PRJ-002', category: 'tech',
    minInvestment: 10, currencyCode: DEFAULT_CURRENCY, progress: 45,
    investorsCount: 7, viewsCount: 181,
    founderName: 'سراج شليق', founderEmail: 'seraj@ai.ly',
  },
  {
    id: '3',
    title: 'منصة التعليم الذكي',
    city: 'مصراتة',
    description: 'منصة تعليمية تستخدم تقنيات التعلم الآلي لتوفير تجربة مخصصة لكل طالب.',
    image: projectImages['3'],
    fundingGoal: 75000, currentAmount: 30000, status: 'active',
    reference: 'PRJ-003', category: 'tech',
    minInvestment: 5, currencyCode: DEFAULT_CURRENCY, progress: 40,
    investorsCount: 9, viewsCount: 154,
    founderName: 'محمد سوان', founderEmail: 'mohammed@edu.ly',
  },
  {
    id: '4',
    title: 'نظام إدارة سلسلة التوريد',
    city: 'الزاوية',
    description: 'نظام رقمي متكامل لإدارة سلاسل التوريد وتتبع الشحنات في الوقت الفعلي.',
    image: projectImages['4'],
    fundingGoal: 60000, currentAmount: 42000, status: 'active',
    reference: 'PRJ-004', category: 'tech',
    minInvestment: 8, currencyCode: DEFAULT_CURRENCY, progress: 70,
    investorsCount: 11, viewsCount: 97,
    founderName: 'علي الفيتوري', founderEmail: 'ali@supply.ly',
  },
  {
    id: '5',
    title: 'تطبيق الصحة الرقمية',
    city: 'سبها',
    description: 'تطبيق صحي يربط المرضى بالأطباء ويوفر استشارات طبية عن بُعد بتقنية عالية.',
    image: projectImages['9'],
    fundingGoal: 80000, currentAmount: 16000, status: 'active',
    reference: 'PRJ-005', category: 'tech',
    minInvestment: 10, currencyCode: DEFAULT_CURRENCY, progress: 20,
    investorsCount: 5, viewsCount: 63,
    founderName: 'سلمى المنتصر', founderEmail: 'salma@health.ly',
  },
  {
    id: '6',
    title: 'منصة التجارة الإلكترونية المحلية',
    city: 'طرابلس',
    description: 'منصة تجارة إلكترونية مخصصة للسوق الليبي مع دعم الدفع المحلي.',
    image: projectImages['6'],
    fundingGoal: 120000, currentAmount: 96000, status: 'active',
    reference: 'PRJ-006', category: 'tech',
    minInvestment: 15, currencyCode: DEFAULT_CURRENCY, progress: 80,
    investorsCount: 22, viewsCount: 412,
    founderName: 'يوسف الطاهر', founderEmail: 'yousef@ecom.ly',
  },
  {
    id: '7',
    title: 'نظام الأمن السيبراني',
    city: 'بنغازي',
    description: 'منصة أمن سيبراني للشركات والمؤسسات لحماية البيانات ومنع الاختراقات.',
    image: projectImages['7'],
    fundingGoal: 90000, currentAmount: 18000, status: 'active',
    reference: 'PRJ-007', category: 'tech',
    minInvestment: 20, currencyCode: DEFAULT_CURRENCY, progress: 20,
    investorsCount: 4, viewsCount: 88,
    founderName: 'خالد بوعجيلة', founderEmail: 'khaled@cyber.ly',
  },
  {
    id: '8',
    title: 'تطبيق المدفوعات الرقمية',
    city: 'مصراتة',
    description: 'تطبيق مدفوعات رقمية يتيح التحويل الفوري والدفع الإلكتروني داخل ليبيا.',
    image: projectImages['8'],
    fundingGoal: 200000, currentAmount: 110000, status: 'active',
    reference: 'PRJ-008', category: 'tech',
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
 * Normalise any role string coming from the server to one of the three
 * recognised app roles.  Unknown or missing roles become 'guest'.
 */
export const resolveUserRole = (value) => {
  // Backend roles are stored as Admin / Investor / Entrepreneur / User.
  // Mobile screens use admin / investor / owner / guest, so this is the one
  // place where role names are translated between backend and app language.
  const roles = Array.isArray(value) ? value : [value];
  const normalizedRoles = roles
    .filter(Boolean)
    .map((role) => String(role).trim().toLowerCase());

  if (normalizedRoles.includes('admin')) return 'admin';
  if (normalizedRoles.includes('owner') || normalizedRoles.includes('entrepreneur')) return 'owner';
  if (normalizedRoles.includes('investor') || normalizedRoles.includes('user')) return 'investor';
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
export const normalizeProject = (project = {}) => {
  const rawId = project.id ?? project._id ?? project.projectId ?? project.project_id ?? '';
  const id = String(rawId);
  const title = project.title || project.titleAr || project.title_ar || project.titleEn || project.title_en || '';
  const description = project.description || project.descriptionAr || project.description_ar || project.descriptionEn || project.description_en || '';
  const fundingGoal = Number(project.fundingGoal ?? project.goal ?? project.funding_goal ?? 0);
  const currentAmount = Number(project.currentAmount ?? project.raised ?? project.currentFunding ?? project.current_amount ?? 0);
  const progress = Number(
    project.progress ?? project.progress_pct ?? project.fundingPercentage ??
    (fundingGoal > 0 ? Math.round((currentAmount / fundingGoal) * 100) : 0),
  );
  const explicitImage = project.image || project.imageUrl || project.image_url;
  const categoryId = project.categoryId ?? project.category_id ?? null;
  const category = project.category || project.categoryName || project.category_name || categoryId || '';
  const city = project.city || project.cityAr || project.city_ar || project.cityEn || project.city_en || '';

  return {
    id,
    projectId: rawId,
    title,
    titleAr: project.titleAr || project.title_ar || title,
    titleEn: project.titleEn || project.title_en || title,
    description,
    descriptionAr: project.descriptionAr || project.description_ar || description,
    descriptionEn: project.descriptionEn || project.description_en || description,
    category,
    categoryId,
    categoryAr: project.categoryAr || project.category_ar || category,
    categoryEn: project.categoryEn || project.category_en || category,
    city,
    cityAr: project.cityAr || project.city_ar || city,
    cityEn: project.cityEn || project.city_en || city,
    // Use the explicit backend/mobile image if present; otherwise assign one
    // deterministic bundled image so every project always renders.
    image: explicitImage || getDefaultImage(id),
    imageUrl: typeof explicitImage === 'string' ? explicitImage : null,
    fundingGoal,
    currentAmount,
    goal: fundingGoal,
    raised: currentAmount,
    minInvestment: Number(project.minInvestment ?? project.min_investment ?? 5),
    maxInvestment: Number(project.maxInvestment ?? project.max_investment ?? 0),
    currencyCode: project.currencyCode || project.currency_code || DEFAULT_CURRENCY,
    status: project.status || 'pending',
    reference: project.reference || project.ref || null,
    ownerId: project.ownerId ?? project.owner_id ?? project.creatorUserId ?? project.creator_user_id,
    ownerName: project.ownerName || project.owner_name || null,
    ownerCompanyName: project.ownerCompanyName || project.owner_company_name || project.companyName || null,
    progress,
    duration: Number(project.duration ?? project.durationDays ?? 0),
    startDate: project.startDate || project.start_date,
    endDate: project.endDate || project.end_date,
    teamSize: Number(project.teamSize ?? project.team_size ?? 0),
    website: project.website || null,
    founderName: project.founderName || project.founder_name || '',
    founderEmail: project.founderEmail || project.founder_email || '',
    founderPhone: project.founderPhone || project.founder_phone || '',
    investorsCount: Number(project.investorsCount ?? project.investors_count ?? 0),
    viewsCount: Number(project.viewsCount ?? project.views_count ?? 0),
    createdAt: project.createdAt || project.created_at,
    updatedAt: project.updatedAt || project.updated_at,
  };
};

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
  const safeRaised = Number(projectData.currentAmount || projectData.raised || 0);

  return normalizeProject({
    id:               tempId,
    ownerId,
    ownerName:        projectData.ownerName        || projectData.founderName    || 'Project Owner',
    ownerCompanyName: projectData.ownerCompanyName || projectData.companyName    || null,
    title:            projectData.title || projectData.titleAr,
    description:      projectData.description || projectData.descriptionAr,
    city:             projectData.city || projectData.cityAr,
    category:         projectData.category,
    image:            projectData.image            || projectData.imageUri       || DEFAULT_PROJECT_IMAGE,
    fundingGoal:      safeGoal,
    currentAmount:    safeRaised,
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
 * Build a contribution draft object used by save-for-later and investing flows.
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
 * Build the investment payload used by investmentAPI.confirmInvestment.
 * The API adapter sends each contribution through the backend's real two-step
 * flow: POST /investments, then POST /investments/{id}/confirm.
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

const splitName = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

/**
 * Map any raw user/session object from the server into the canonical user shape.
 * memberId is derived from the last 8 digits of the phone number when not provided.
 */
export const mapAuthSession = (data = {}) => {
  const fullName = data.name || data.fullName || data.full_name || '';
  const nameParts = splitName(fullName);
  const firstName = data.firstName || data.first_name || nameParts.firstName || '';
  const lastName = data.lastName || data.last_name || nameParts.lastName || '';
  const name = fullName || `${firstName} ${lastName}`.trim();
  const role        = resolveUserRole(data.roles || data.role || data.userType || data.user_role || data.userTypeId);
  const accountType = data.accountType || data.type || 'individual';

  return {
    id:                 data.id           || data.userId      || data.user_id || data.phone || '1',
    name:               name              || '',
    firstName,
    lastName,
    phone:              data.phone        || '',
    email:              data.email        || '',
    role,
    type:               accountType,
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
export const mapRegisterPayload = (data = {}) => {
  const nameParts = splitName(data.name);
  const firstName = data.firstName || nameParts.firstName;
  const lastName = data.lastName || nameParts.lastName;
  const role = resolveUserRole(data.role);
  const companyName = role === 'owner' || role === 'entrepreneur' || data.type === 'organization'
    ? (data.companyName || '').trim()
    : undefined;

  return {
  // The backend accepts both first/last and a combined name. Keeping both makes
  // registration work whether the screen sends one name field or separate ones.
  firstName,
  lastName,
  name:          data.name || `${firstName || ''} ${lastName || ''}`.trim(),
  phone:         data.phone,
  email:         data.email    || undefined,
  role,
  type:          data.type     || 'individual',
  companyName,
  bio:           data.bio          || undefined,
  password:      data.password,
  termsAccepted: Boolean(data.termsAccepted),
  };
};

const CATEGORY_ID_BY_KEY = {
  tech: 1,
  'TECH': 1,
  'TECH-SOFT': 2,
  'TECH-MOBILE': 3,
  'TECH-WEB': 4,
  'TECH-AI': 5,
  'TECH-CYBER': 6,
  'TECH-DATA': 7,
  'TECH-CLOUD': 8,
  'TECH-IOT': 9,
};

const resolveCategoryId = (category) => {
  if (category === undefined || category === null || category === '') return null;
  const numeric = Number(category);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const key = String(category).trim();
  return CATEGORY_ID_BY_KEY[key] || CATEGORY_ID_BY_KEY[key.toLowerCase()] || null;
};

const CATEGORY_LABELS_AR = {
  TECH: 'تقنية',
  'TECH-SOFT': 'برمجيات',
  'TECH-MOBILE': 'تطبيقات الهاتف',
  'TECH-WEB': 'تطوير الويب',
  'TECH-AI': 'ذكاء اصطناعي',
  'TECH-CYBER': 'أمن سيبراني',
  'TECH-DATA': 'علم البيانات',
  'TECH-CLOUD': 'حلول سحابية',
  'TECH-IOT': 'إنترنت الأشياء',
};

/** Convert backend category DTOs to the shape used by mobile category chips. */
const normalizeCategory = (category = {}) => {
  const techCode = category.techCode || category.tech_code || '';
  const id = category.categoryId ?? category.category_id ?? category.id ?? techCode;
  const name = category.name || category.labelEn || category.label || techCode;
  return {
    id,
    categoryId: Number(id) || null,
    key: techCode || String(id),
    labelAr: category.labelAr || category.label_ar || CATEGORY_LABELS_AR[techCode] || name,
    labelEn: category.labelEn || category.label_en || name,
    parentId: category.parentId ?? category.parent_id ?? null,
    techCode,
  };
};

/** Shape the payload for POST /projects (create project). */
export const mapProjectSubmissionPayload = (projectData = {}) => {
  const duration = Number(projectData.duration || projectData.durationDays || 30);
  const startDate = projectData.startDate || new Date().toISOString();
  const endDate = projectData.endDate || new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();
  const image = projectData.imageUrl || (typeof projectData.image === 'string' ? projectData.image : null);
  const fundingGoal = Number(projectData.fundingGoal);

  return {
    // The backend stores one title/description today, so Arabic is the source
    // of truth and English stays optional inside the mobile form only.
    title:         projectData.title || projectData.titleAr || projectData.titleEn,
    categoryId:    resolveCategoryId(projectData.categoryId ?? projectData.category),
    city:          projectData.city || projectData.cityAr || projectData.cityEn,
    fundingGoal,
    minInvestment: Number(projectData.minInvestment || 5),
    maxInvestment: projectData.maxInvestment ? Number(projectData.maxInvestment) : fundingGoal,
    equityOffered: Number(projectData.equityOffered || projectData.equity || 0),
    duration,
    startDate,
    endDate,
    description:   projectData.description || projectData.descriptionAr || projectData.descriptionEn,
    founderName:   projectData.founderName,
    founderEmail:  projectData.founderEmail,
    founderPhone:  projectData.founderPhone,
    teamSize:      Number(projectData.teamSize || 0),
    website:       projectData.website || null,
    imageUrl:      image,
  };
};

/** Extract the data payload from a server response, with a safe fallback. */
const extractData = (response, fallback = []) => {
  const payload = response?.data ?? response ?? fallback;
  if (payload?.items) return payload.items;
  return payload;
};

const extractPagination = (response) => {
  const payload = response?.data ?? response ?? {};
  return {
    items: payload.items || payload.data || [],
    total: payload.totalCount ?? payload.total ?? payload.items?.length ?? 0,
    page: payload.page ?? 1,
    pageSize: payload.pageSize ?? payload.items?.length ?? 0,
  };
};

const mapAuthResponse = (response, fallback = {}) => {
  const payload = response?.data ?? response ?? {};
  const token = payload.token || payload.accessToken || payload.access_token || null;
  const userPayload = payload.user || payload.data?.user || payload;
  const user = mapAuthSession({ ...fallback, ...userPayload, token });
  if (token) setAuthToken(token);
  return {
    success: payload.success ?? true,
    token,
    user,
    expiresAt: payload.expiresAt || payload.expires_at || null,
    message: payload.message,
  };
};

/**
 * Filter a project array by category and/or search query.
 * Extracted to avoid duplicating this logic in both mock and real API paths.
 */
const filterBySearchAndCategory = (projects, { category, search } = {}) =>
  projects.filter((project) => {
    if (category && category !== 'all' && project.category !== category) return false;
    if (!search) return true;
    const haystack = [project.title, project.city]
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
      query: { categoryId: resolveCategoryId(category), search },
    });
    const localProjects = filterBySearchAndCategory(await loadLocalProjects(), filters);
    const page = extractPagination(data);
    return {
      data: mergeProjects(localProjects, page.items.map(normalizeProject)),
      total: page.total + localProjects.length,
      page: page.page,
      pageSize: page.pageSize,
    };
  },

  getCategories: async () => {
    if (shouldUseMock()) {
      return [{ id: 'all', labelAr: 'الكل', labelEn: 'All' }, ...MOCK_CATEGORIES];
    }
    const data = await apiRequest({ path: API_CONFIG.endpoints.projects.categories });
    const categories = extractData(data).map(normalizeCategory);
    return [
      { id: 'all', labelAr: 'الكل', labelEn: 'All' },
      ...(categories.length ? categories : MOCK_CATEGORIES),
    ];
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
        type: payload.role === 'owner' ? 'organization' : 'individual',
        name: payload.role === 'owner' ? 'صاحب مشروع' : 'مستثمر',
      });
      return { success: true, token: 'mock-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.verifyOtp,
      method: 'POST',
      body:   payload,
    });
    return mapAuthResponse(response, payload);
  },

  /** Quick login by phone only — no OTP or password required (dev / demo shortcut). */
  loginSimple: async (phone) => {
    if (shouldUseMock()) {
      await delay();
      const user = mapAuthSession({
        id:   '1',
        phone,
        role: 'investor',
        type: 'individual',
        name: 'مستخدم تجريبي',
      });
      return { success: true, token: 'mock-token', user };
    }
    // The ASP.NET backend intentionally requires a password for real logins.
    // Keeping this explicit prevents accidental phone-only auth in production.
    throw new Error('Phone-only login is available in mock mode only. Use phone/email with password for the real backend.');
  },

  login: async ({ phone, password, role }) => {
    const payload = { phone, password, role: resolveUserRole(role) };
    if (shouldUseMock()) {
      await delay();
      const user = mapAuthSession({
        id:   '1',
        phone,
        role: payload.role,
        type: payload.role === 'owner' ? 'organization' : 'individual',
        name: payload.role === 'owner' ? 'صاحب مشروع' : 'مستخدم تجريبي',
      });
      return { success: true, token: 'mock-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.login,
      method: 'POST',
      body:   payload,
    });
    return mapAuthResponse(response, payload);
  },

  register: async (data) => {
    const payload = mapRegisterPayload(data);
    if (shouldUseMock()) {
      await delay();
      const user = mapAuthSession(payload);
      return { success: true, token: 'mock-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.register,
      method: 'POST',
      body:   payload,
    });
    return mapAuthResponse(response, payload);
  },

  getProfile: async () => {
    if (shouldUseMock()) {
      await delay();
      return mapAuthSession({ id: '1', phone: '+218XXXXXXXXX', name: 'مستخدم تجريبي', role: 'investor', type: 'individual' });
    }
    const response = await apiRequest({ path: API_CONFIG.endpoints.auth.profile });
    return mapAuthSession(extractData(response, {}));
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

  /** Email + password login — same session shape as phone login. */
  loginWithEmail: async ({ email, password, role }) => {
    const payload = { email: email.trim().toLowerCase(), password, role: resolveUserRole(role) };
    if (shouldUseMock()) {
      await delay();
      const user = mapAuthSession({
        id:   '1',
        email: payload.email,
        role: payload.role,
        type: payload.role === 'owner' ? 'organization' : 'individual',
        name: payload.role === 'owner' ? 'صاحب مشروع' : 'مستخدم تجريبي',
      });
      return { success: true, token: 'mock-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.loginEmail,
      method: 'POST',
      body:   payload,
    });
    return mapAuthResponse(response, payload);
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
        type: 'individual',
        name: 'مستخدم',
      });
      return { success: true, token: 'mock-token', user };
    }
    const response = await apiRequest({
      path:   API_CONFIG.endpoints.auth.resetPassword,
      method: 'POST',
      body:   { email: email.trim().toLowerCase(), code: String(code), newPassword },
    });
    return mapAuthResponse(response, { email });
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
const getStaticFundingOptions = () => ({
  data: {
    methods: [
      { id: 'wallet', nameAr: 'محفظة Investly', nameEn: 'Investly Wallet', type: 'wallet', icon: 'wallet-outline' },
      { id: 'recharge_card', nameAr: 'بطاقة تعبئة', nameEn: 'Recharge Card', type: 'voucher', icon: 'card-outline' },
    ],
    rechargeCards: [
      { id: 'mock-100', paymentMethodId: 'recharge_card', code: 'INV-LYD-100-0001', labelAr: 'بطاقة تعبئة 100 دينار ليبي', labelEn: 'LYD 100 Recharge Card', amount: 100, currency: DEFAULT_CURRENCY },
      { id: 'mock-500', paymentMethodId: 'recharge_card', code: 'INV-LYD-500-0001', labelAr: 'بطاقة تعبئة 500 دينار ليبي', labelEn: 'LYD 500 Recharge Card', amount: 500, currency: DEFAULT_CURRENCY },
      { id: 'mock-1000', paymentMethodId: 'recharge_card', code: 'INV-LYD-1000-0001', labelAr: 'بطاقة تعبئة 1000 دينار ليبي', labelEn: 'LYD 1000 Recharge Card', amount: 1000, currency: DEFAULT_CURRENCY },
      { id: 'mock-100000', paymentMethodId: 'recharge_card', code: 'INV-LYD-100000-0001', labelAr: 'بطاقة تعبئة 100000 دينار ليبي', labelEn: 'LYD 100000 Recharge Card', amount: 100000, currency: DEFAULT_CURRENCY },
      { id: 'mock-1000000', paymentMethodId: 'recharge_card', code: 'INV-LYD-1000000-0001', labelAr: 'بطاقة تعبئة 1000000 دينار ليبي', labelEn: 'LYD 1000000 Recharge Card', amount: 1000000, currency: DEFAULT_CURRENCY },
    ],
  },
});

export const investmentAPI = {
  confirmInvestment: async (payload) => {
    if (shouldUseMock()) {
      await delay();
      return { success: true, paymentId: `PAY-${Date.now()}`, received: payload };
    }

    const contributions = payload?.contributions || [];
    if (!contributions.length) {
      throw new Error('No investment contributions were provided.');
    }

    const confirmedInvestments = [];
    for (const contribution of contributions) {
      const projectId = Number(contribution.projectId);
      const amount = Number(contribution.amount);
      if (!Number.isFinite(projectId) || projectId <= 0) {
        throw new Error('This project must be synced with the backend before investing.');
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Investment amount must be greater than zero.');
      }

      // Backend flow: create a Pending investment first, then confirm it.
      // This keeps wallet locking/refunding logic inside the service layer.
      const created = await apiRequest({
        path:   API_CONFIG.endpoints.investments.create,
        method: 'POST',
        body:   { projectId, amount },
      });
      const createdInvestment = extractData(created, {});
      const investmentId = createdInvestment.investmentId || createdInvestment.id;
      if (!investmentId) {
        throw new Error('Backend did not return an investment id to confirm.');
      }

      const confirmed = await apiRequest({
        path:   API_CONFIG.endpoints.investments.confirm(investmentId),
        method: 'POST',
      });
      confirmedInvestments.push(extractData(confirmed, confirmed));
    }

    return {
      success: true,
      investments: confirmedInvestments,
      received: payload,
    };
  },

  getWallet: async () => {
    if (shouldUseMock()) {
      await delay();
      return { data: { balance: 0, totalTopups: 0, totalInvested: 0, transactions: [] } };
    }
    const walletResponse = await apiRequest({ path: API_CONFIG.endpoints.investments.wallet });
    const wallet = extractData(walletResponse, {});
    let transactions = [];

    try {
      const transactionResponse = await apiRequest({ path: API_CONFIG.endpoints.investments.transactions });
      transactions = extractData(transactionResponse, []).map((transaction) => ({
        id: transaction.id || transaction.transactionId,
        type: transaction.type || transaction.transactionType,
        amount: Number(transaction.amount || 0),
        direction: transaction.direction,
        status: transaction.status,
        createdAt: transaction.createdAt || transaction.created_at,
        description: transaction.description,
      }));
    } catch (error) {
      // Transactions are helpful for the wallet screen but should not block
      // showing the balance if only the history endpoint fails.
      transactions = [];
    }

    const totalTopups = transactions
      .filter((transaction) => String(transaction.type || '').toLowerCase().includes('deposit'))
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return {
      data: {
        ...wallet,
        balance: Number(wallet.balance ?? wallet.availableBalance ?? 0),
        availableBalance: Number(wallet.availableBalance ?? wallet.available_balance ?? wallet.balance ?? 0),
        lockedAmount: Number(wallet.lockedAmount ?? wallet.locked_amount ?? 0),
        totalTopups,
        totalInvested: Number(wallet.totalInvested ?? wallet.total_invested ?? 0),
        transactions,
      },
    };
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
    // Funding options are static in the current backend, so keep returning the
    // same local options in real mode instead of calling a non-existent route.
    return getStaticFundingOptions();
  },

  redeemTopupCard: async (code) => {
    // Extract amount from mock code format (e.g. INV-LYD-100-0001)
    let amount = 1000;
    if (code) {
      const match = code.match(/-(\d+)-/);
      if (match) amount = Number(match[1]);
    }

    if (shouldUseMock()) {
      await delay();
      // Fetch current mock balance from AsyncStorage to simulate realistic top-ups
      let currentBalance = 0;
      let currentTopups = 0;
      try {
        const stored = await AsyncStorage.getItem('user_data');
        if (stored) {
          const user = JSON.parse(stored);
          currentBalance = Number(user.walletBalance || 0);
          currentTopups = Number(user.totalTopups || 0);
        }
      } catch (e) {}

      return {
        success: true,
        data: {
          balance: currentBalance + amount,
          totalTopups: currentTopups + amount
        }
      };
    }

    const response = await apiRequest({
      path: API_CONFIG.endpoints.investments.redeemTopup,
      method: 'POST',
      body: { amount, referenceNo: code, description: 'Top-up card' },
    });
    return { success: true, data: extractData(response, response) };
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

let cachedNotificationIds = [];

const normalizeNotification = (notification = {}) => {
  const id = notification.id ?? notification.notificationId ?? notification.notification_id;
  const title = notification.title || '';
  const message = notification.message || '';

  return {
    id: String(id),
    notificationId: id,
    type: notification.type || notification.notificationType || 'system',
    title,
    titleAr: notification.titleAr || notification.title_ar || title,
    titleEn: notification.titleEn || notification.title_en || title,
    message,
    messageAr: notification.messageAr || notification.message_ar || message,
    messageEn: notification.messageEn || notification.message_en || message,
    isRead: Boolean(notification.isRead ?? notification.is_read),
    createdAt: notification.createdAt || notification.created_at,
    relatedEntityId: notification.relatedEntityId || notification.related_entity_id,
    relatedEntityType: notification.relatedEntityType || notification.related_entity_type,
  };
};

export const notificationsAPI = {
  getAll: async () => {
    if (shouldUseMock()) {
      await delay(400);
      const data = MOCK_NOTIFICATIONS.map(normalizeNotification);
      cachedNotificationIds = data.map((notification) => notification.notificationId);
      return { data, unreadCount: data.filter((n) => !n.isRead).length };
    }
    const response = await apiRequest({ path: API_CONFIG.endpoints.notifications?.list || '/notifications' });
    const payload = response?.data ?? response ?? {};
    const data = extractData(payload, []).map(normalizeNotification);
    cachedNotificationIds = data.map((notification) => notification.notificationId);
    return {
      data,
      unreadCount: payload.unreadCount ?? data.filter((notification) => !notification.isRead).length,
    };
  },

  markAllAsRead: async (ids = cachedNotificationIds) => {
    if (shouldUseMock()) {
      await delay(300);
      return { success: true };
    }
    const notificationIds = ids.map(Number).filter((id) => Number.isFinite(id));
    if (!notificationIds.length) return { success: true };
    return apiRequest({
      path:   API_CONFIG.endpoints.notifications?.markAllRead || API_CONFIG.endpoints.notifications?.markRead || '/notifications/mark-read',
      method: 'POST',
      body:   { notificationIds },
    });
  },

  markAsRead: async (id) => {
    if (shouldUseMock()) {
      await delay(200);
      return { success: true };
    }
    return apiRequest({
      path:   API_CONFIG.endpoints.notifications?.markRead || '/notifications/mark-read',
      method: 'POST',
      body:   { notificationIds: [Number(id)].filter((value) => Number.isFinite(value)) },
    });
  },
};
