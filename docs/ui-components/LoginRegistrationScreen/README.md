# LoginRegistrationScreen

A portable, split-screen authentication portal component featuring a left hero banner with branding/features and a right form panel supporting both password/passcode Login and user Registration views.

Staged in `docs/ui-components/LoginRegistrationScreen/` as part of the Antigravity component extraction workflow.

---

## Features

- **Split Screen Layout**: Desktop 50/50 hero panel and form panel with mobile layout adaptation.
- **Dual Form Mode**: Seamlessly switches between Sign-in and Account Creation forms.
- **Passcode & Password Login**: Toggleable sign-in mode (Email + Password vs. Email + 6-digit numeric passcode with validation check icon).
- **Cascading Region & Division Selection**: Optional dropdown filtering for regional organizational units.
- **Fully Configurable Branding**: Hero logos, title, title accent, subtitle, feature highlights, and footer notices are all driven by props.
- **Zero App Coupling**: Free of app-specific routers (`useNavigate`), state contexts (`useAuth`, `useApp`), API endpoints, or monorepo packages (`@project/shared`).

---

## Props API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `heroConfig` | `Object` | `{}` | Hero panel branding configuration (`backgroundImage`, `logos`, `title`, `titleAccent`, `subtitle`, `features`, `footerNotice`) |
| `authConfig` | `Object` | `{}` | Form titles, placeholders, and rules (`loginTitle`, `loginSubtitle`, `registerTitle`, `registerSubtitle`, `emailLabel`, `emailPlaceholder`, `allowPasscodeLogin`, `passcodeLength`) |
| `regions` | `Array` | `[]` | List of region items for registration (`{ id, name }`) |
| `divisions` | `Array` | `[]` | List of division items for registration (`{ id, region_id, name, office_name }`) |
| `initialIsRegistering` | `Boolean` | `false` | Initial view state (`true` for Registration, `false` for Sign-in) |
| `onLogin` | `Function` | `undefined` | Async callback `async ({ email, password, passcode, isPasscodeMode }) => void` |
| `onRegister` | `Function` | `undefined` | Async callback `async (formData) => void` |
| `onLoginSuccess` | `Function` | `undefined` | Callback invoked upon successful login |
| `onRegisterSuccess` | `Function` | `undefined` | Callback invoked upon successful registration |
| `onFetchRegionsDivisions` | `Function` | `undefined` | Async callback `async () => { regions, divisions }` for fetching dropdown options |
| `validateLogin` | `Function` | `undefined` | Custom validation function returning error message string or `null` |
| `validateRegister` | `Function` | `undefined` | Custom validation function returning error message string or `null` |
| `className` | `String` | `''` | Optional root CSS class |

---

## Usage Example

How another project (e.g. a hospital or corporate portal) consumes this component with different data:

```jsx
import React from 'react';
import { LoginRegistrationScreen } from './docs/ui-components/LoginRegistrationScreen';
import { Building2, ShieldCheck, HeartPulse } from 'lucide-react';

export const HealthPortalAuth = () => {
  const handleLogin = async ({ email, password, passcode, isPasscodeMode }) => {
    const endpoint = isPasscodeMode ? '/api/auth/passcode-login' : '/api/auth/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, passcode })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return await res.json();
  };

  const handleRegister = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (!res.ok) throw new Error('Registration failed');
    return await res.json();
  };

  return (
    <LoginRegistrationScreen
      heroConfig={{
        title: 'Welcome to',
        titleAccent: 'HealthCare Audit Portal',
        subtitle: 'Enterprise hospital operations & clinical auditing system.',
        features: [
          {
            icon: <HeartPulse size={20} />,
            title: 'Clinical Audit',
            description: 'Real-time patient safety and ward staffing analytics.'
          },
          {
            icon: <ShieldCheck size={20} />,
            title: 'HIPAA Compliant',
            description: 'Encrypted passcode verification and role-based access control.'
          }
        ],
        footerNotice: {
          icon: <Building2 size={20} />,
          title: 'Official Healthcare Systems Platform',
          subtitle: '© 2026 Bureau of Health Operations'
        }
      }}
      authConfig={{
        loginTitle: 'Member Sign In',
        emailLabel: 'Hospital Email',
        emailPlaceholder: 'doctor@hospital.org'
      }}
      onLogin={handleLogin}
      onRegister={handleRegister}
      onLoginSuccess={(user) => {
        window.location.href = '/dashboard';
      }}
    />
  );
};
```

---

## Generalization Report (What Changed)

### App-Specific Logic Removed:
1. **Routing & Navigation**: Removed `useNavigate()` hook from `react-router-dom`. Navigation after authentication is now controlled via `onLoginSuccess` and `onRegisterSuccess` props.
2. **Global Auth & App Contexts**: Removed `useAuth()` and `useApp()`. Replaced context actions (`login`, `register`, `resetThemeToLight`) with `onLogin` and `onRegister` async prop callbacks.
3. **Hardcoded API Call**: Removed `API.auth.getRegionsDivisions()` service call. Added `onFetchRegionsDivisions` prop and `regions`/`divisions` array props.
4. **Zod Schema Dependencies**: Removed direct dependency on `@project/shared` (`LoginSchema`, `RegisterSchema`). Validation logic is now handled internally with customizable `validateLogin` and `validateRegister` prop hooks.
5. **Hardcoded Branding & Asset Paths**: Converted static image references (`/deped_logo.png`, `/bagong_pilipinas.png`, etc.) and hardcoded Department of Education titles into `heroConfig` default prop values.

### Behavior & Interaction Preserved:
1. 50/50 desktop split hero layout with glassmorphic cards and background gradients.
2. Dynamic view state switching between Login and Registration forms.
3. Passcode toggle mode with 6-digit numeric input, digit counter, and emerald completion check icon.
4. Responsive cascading dropdown filters for organizational units (Region -> Division).
5. Explicit light color scheme isolation for form fields (`color-scheme: light`) to prevent dark mode styling conflicts.
