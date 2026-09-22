/**
 * StudyHub 2.0 - Core Authentication Module (StudyHubAuth)
 * 
 * Features:
 * - Single Supabase client instance across the entire application (PKCE flow, auto token refresh)
 * - Single onAuthStateChange listener with deferred async calls (avoids token-refresh deadlocks)
 * - Clean OAuth redirect handling & URL sanitization (removes ?code= and #access_token)
 * - In-app browser detection (Instagram, WhatsApp webviews) for Google OAuth compatibility
 * - Robust profile fetching with auto-upsert fallback (eliminates 409 duplicate key errors)
 * - Full password recovery (resetPasswordForEmail & updateUser)
 * - Multi-tab synchronization and clean session termination
 */

(function (window) {
  'use strict';

  const SUPABASE_URL = "https://qijdyaorbvbvuumzdxdu.supabase.co";
  const SUPABASE_KEY = "sb_publishable_jRJUeUmDJ9CMONA75QCCCQ_2aCizXnE";

  let client = null;
  let currentUser = null;
  let currentProfile = null;
  let currentSession = null;
  let isInitialized = false;
  let initPromise = null;
  const authListeners = new Set();

  // Create single Supabase client instance
  function getClient() {
    if (!client) {
      if (!window.supabase) {
        console.error('StudyHubAuth: Supabase JS library not loaded.');
        return null;
      }
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
          storage: window.localStorage
        }
      });
    }
    return client;
  }

  // Map technical Supabase errors to friendly student-facing messages
  function mapAuthError(err) {
    if (!err) return 'An unexpected error occurred. Please try again.';
    const msg = (err.message || '').toLowerCase();
    const status = err.status || 0;

    if (!navigator.onLine || msg.includes('network') || msg.includes('failed to fetch')) {
      return 'You appear to be offline. Please check your internet connection.';
    }
    if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
      return 'Invalid email or password. Please verify your details.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please check your email inbox to confirm your account before logging in.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests') || status === 429) {
      return 'Too many login attempts. Please wait a minute and try again.';
    }
    if (msg.includes('user already registered') || msg.includes('already exists')) {
      return 'An account with this email already exists. Try signing in with Google or your password.';
    }
    if (msg.includes('password should be at least')) {
      return 'Password must be at least 8 characters long.';
    }
    if (msg.includes('flow state has expired') || msg.includes('invalid code')) {
      return 'Login link expired. Please sign in again.';
    }
    return err.message || 'Authentication error. Please try again.';
  }

  // Detect whether running in an embedded in-app browser (Instagram, WhatsApp, etc.)
  function isInAppBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    return /Instagram|FBAN|FBAV|WhatsApp|Line|Twitter|Snapchat/i.test(ua);
  }

  // Strip OAuth and PKCE query parameters from browser URL
  function cleanUrlParams() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('code') || url.searchParams.has('error') || url.searchParams.has('error_description')) {
        url.searchParams.delete('code');
        url.searchParams.delete('error');
        url.searchParams.delete('error_code');
        url.searchParams.delete('error_description');
        const cleanSearch = url.searchParams.toString();
        const newUrl = url.pathname + (cleanSearch ? '?' + cleanSearch : '') + url.hash;
        window.history.replaceState(null, document.title, newUrl);
      }
      if (window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('error='))) {
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
      }
    } catch (e) {
      console.warn('StudyHubAuth: Could not clean URL params', e);
    }
  }

  // Fetch or safely initialize profile without 409 unique constraint errors
  async function fetchOrCreateProfile(user) {
    if (!user || !client) return null;

    try {
      // 1. Try reading existing profile
      const { data: profile, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && profile) {
        return profile;
      }

      // 2. If profile not yet created by database trigger, upsert safely
      const defaultName = (
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user.email ? user.email.split('@')[0] : 'Student')
      ).trim();

      const { data: upserted, error: upsertErr } = await client
        .from('profiles')
        .upsert(
          {
            id: user.id,
            name: defaultName,
            class_id: null
          },
          { onConflict: 'id', ignoreDuplicates: false }
        )
        .select('*')
        .maybeSingle();

      if (upsertErr) {
        console.warn('StudyHubAuth: Profile upsert note:', upsertErr.message);
        // Fallback: minimal in-memory profile so user is never blocked from using the app
        return { id: user.id, name: defaultName, class_id: null };
      }

      return upserted || { id: user.id, name: defaultName, class_id: null };
    } catch (e) {
      console.error('StudyHubAuth: Error fetching profile:', e);
      const fallbackName = (user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Student')).trim();
      return { id: user.id, name: fallbackName, class_id: null };
    }
  }

  // Notify registered callbacks of auth state updates
  function notifyListeners(event, session) {
    authListeners.forEach(fn => {
      try {
        fn(event, session, currentUser, currentProfile);
      } catch (err) {
        console.error('StudyHubAuth listener error:', err);
      }
    });
  }

  // Handle auth changes outside the listener callback (deferred to prevent mutex deadlocks)
  async function handleAuthChange(event, session) {
    const sb = getClient();
    currentSession = session;
    currentUser = session?.user || null;

    if (currentUser) {
      // Parallel profile resolution with retry
      let profile = await fetchOrCreateProfile(currentUser);
      if (!profile || !profile.name) {
        // One retry after 400ms
        await new Promise(r => setTimeout(r, 400));
        profile = await fetchOrCreateProfile(currentUser);
      }
      currentProfile = profile;

      cleanUrlParams();

      // If user has no class assigned, open onboarding modal
      if (!currentProfile?.class_id) {
        showAuthModal('onboard');
      } else {
        hideAuthModal();
      }
    } else {
      currentProfile = null;
    }

    notifyListeners(event, session);

    // If event is PASSWORD_RECOVERY, open password reset form
    if (event === 'PASSWORD_RECOVERY') {
      showAuthModal('reset');
    }
  }

  // Initialize the auth system
  function init() {
    if (initPromise) return initPromise;

    initPromise = new Promise(async (resolve) => {
      const sb = getClient();
      if (!sb) {
        isInitialized = true;
        resolve(null);
        return;
      }

      // Check for OAuth error in URL hash or query
      const url = new URL(window.location.href);
      const oauthErrorDesc = url.searchParams.get('error_description') || url.searchParams.get('error');
      if (oauthErrorDesc) {
        console.warn('StudyHubAuth: OAuth error in URL:', oauthErrorDesc);
        cleanUrlParams();
      }

      // Exactly ONE onAuthStateChange listener
      sb.auth.onAuthStateChange((event, session) => {
        // ALWAYS defer async Supabase calls using setTimeout(0) to avoid mutex lockups
        setTimeout(() => {
          handleAuthChange(event, session);
        }, 0);
      });

      // Resolve initial session first without showing any login flash
      try {
        const { data: { session }, error } = await sb.auth.getSession();
        if (error) throw error;
        currentSession = session;
        currentUser = session?.user || null;

        if (currentUser) {
          currentProfile = await fetchOrCreateProfile(currentUser);
          cleanUrlParams();
          if (!currentProfile?.class_id) {
            showAuthModal('onboard');
          }
        }
      } catch (e) {
        console.warn('StudyHubAuth: Initial session check notice:', e);
      } finally {
        isInitialized = true;
        notifyListeners('INITIAL_SESSION', currentSession);
        resolve(currentUser);
      }
    });

    return initPromise;
  }

  // ===================== PUBLIC API =====================

  async function signInEmail(email, password) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase client not initialized');
    if (!email || !password) throw new Error('Please enter both email and password.');

    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      throw new Error(mapAuthError(error));
    }

    currentSession = data.session;
    currentUser = data.user;
    currentProfile = await fetchOrCreateProfile(currentUser);

    return { user: currentUser, profile: currentProfile, session: currentSession };
  }

  async function signUpEmail(email, password) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase client not initialized');
    if (!email || !password) throw new Error('Please enter both email and password.');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address.');
    }

    // Validate password length
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      throw new Error(mapAuthError(error));
    }

    return data;
  }

  async function signInGoogle() {
    const sb = getClient();
    if (!sb) throw new Error('Supabase client not initialized');

    if (isInAppBrowser()) {
      showToast('⚠️ Google Sign-In may be blocked by this app. Please tap ⋮ or ⋯ and select "Open in Browser" (Chrome or Safari).', 'err');
    }

    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      throw new Error(mapAuthError(error));
    }

    return data;
  }

  async function signOut() {
    const sb = getClient();
    if (!sb) return;

    try {
      await sb.auth.signOut();
    } catch (e) {
      console.warn('StudyHubAuth: Error during signOut:', e);
    } finally {
      currentUser = null;
      currentProfile = null;
      currentSession = null;
      notifyListeners('SIGNED_OUT', null);
    }
  }

  async function sendPasswordReset(email) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase client not initialized');
    if (!email) throw new Error('Please enter your registered email address.');

    const { data, error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin
    });

    if (error) {
      throw new Error(mapAuthError(error));
    }

    return data;
  }

  async function updatePassword(newPassword) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase client not initialized');
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const { data, error } = await sb.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(mapAuthError(error));
    }

    return data;
  }

  async function saveProfileOnboard(name, classId) {
    const sb = getClient();
    if (!sb || !currentUser) throw new Error('You must be signed in to complete profile.');
    if (!name || !name.trim()) throw new Error('Please enter your full name.');
    if (!classId) throw new Error('Please select your class.');

    const cleanName = name.trim();
    const cId = parseInt(classId, 10);

    const { data, error } = await sb
      .from('profiles')
      .upsert(
        {
          id: currentUser.id,
          name: cleanName,
          class_id: cId
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      throw new Error(mapAuthError(error));
    }

    currentProfile = data || { id: currentUser.id, name: cleanName, class_id: cId };
    notifyListeners('PROFILE_UPDATED', currentSession);
    return currentProfile;
  }

  function getCurrentUser() {
    return currentUser;
  }

  function getCurrentProfile() {
    return currentProfile;
  }

  function getSession() {
    return currentSession;
  }

  function onAuthChange(callback) {
    if (typeof callback === 'function') {
      authListeners.add(callback);
      // Immediately invoke with current state if initialized
      if (isInitialized) {
        try {
          callback(currentUser ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession, currentUser, currentProfile);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return () => authListeners.delete(callback);
  }

  // ===================== UI HELPERS =====================

  function showAuthModal(mode) {
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    switchMode(mode || 'login');
  }

  function hideAuthModal() {
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  function switchMode(mode) {
    const modes = ['login', 'signup', 'onboard', 'forgot', 'reset'];
    modes.forEach(m => {
      const el = document.getElementById('auth' + m.charAt(0).toUpperCase() + m.slice(1) + 'Form');
      if (el) el.style.display = (m === mode) ? 'flex' : 'none';
    });

    const msg = document.getElementById('authMsg');
    if (msg) {
      msg.className = 'auth-msg';
      msg.innerHTML = '';
    }

    const titleEl = document.getElementById('authTitle');
    const subEl = document.getElementById('authSubtitle');

    if (mode === 'onboard') {
      if (titleEl) titleEl.textContent = 'Complete Your Profile';
      if (subEl) subEl.textContent = 'Select your class to personalise your notes and study tracker.';
      loadClassOptions();
    } else if (mode === 'signup') {
      if (titleEl) titleEl.textContent = 'Welcome to StudyHub 2.0';
      if (subEl) subEl.textContent = 'Create your free student account and start studying smarter!';
    } else if (mode === 'forgot') {
      if (titleEl) titleEl.textContent = 'Reset Password';
      if (subEl) subEl.textContent = 'Enter your registered email and we will send you a reset link.';
    } else if (mode === 'reset') {
      if (titleEl) titleEl.textContent = 'Set New Password';
      if (subEl) subEl.textContent = 'Choose a strong new password (minimum 8 characters).';
    } else {
      if (titleEl) titleEl.textContent = 'Welcome to StudyHub 2.0';
      if (subEl) subEl.textContent = 'Best of luck — score 100 out of 100 in your Boards 2027! 🎯';
    }
  }

  function showAuthMessage(text, type) {
    const msg = document.getElementById('authMsg');
    if (!msg) return;
    msg.className = 'auth-msg show ' + (type || 'info');
    msg.innerHTML = text;
  }

  function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input || !btn) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    const eyeOpen = btn.querySelector('.eye-open');
    const eyeClosed = btn.querySelector('.eye-closed');
    if (eyeOpen && eyeClosed) {
      eyeOpen.style.display = isPassword ? 'none' : 'block';
      eyeClosed.style.display = isPassword ? 'block' : 'none';
    }
  }

  async function loadClassOptions() {
    const select = document.getElementById('onboardClass');
    if (!select || select.dataset.loaded === 'true') return;

    const sb = getClient();
    if (!sb) return;

    try {
      const { data, error } = await sb.from('classes').select('id, name').order('id');
      if (error || !data || !data.length) return;
      select.innerHTML = '<option value="">Select your class</option>';
      data.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name.charAt(0).toUpperCase() + c.name.slice(1);
        if (c.name.toLowerCase().includes('10')) opt.selected = true;
        select.appendChild(opt);
      });
      select.dataset.loaded = 'true';
    } catch (e) {
      // Keep hardcoded fallback in HTML
    }
  }

  function showToast(msg, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 320);
    }, 3500);
  }

  // Export to window
  window.StudyHubAuth = {
    init,
    getClient,
    signInEmail,
    signUpEmail,
    signInGoogle,
    signOut,
    sendPasswordReset,
    updatePassword,
    saveProfileOnboard,
    getCurrentUser,
    getCurrentProfile,
    getSession,
    onAuthChange,
    showAuthModal,
    hideAuthModal,
    switchMode,
    showAuthMessage,
    togglePasswordVisibility,
    showToast,
    isInAppBrowser
  };

})(window);
