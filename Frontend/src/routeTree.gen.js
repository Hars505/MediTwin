/* eslint-disable */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root';
import { Route as WhatifRouteImport } from './routes/whatif';
import { Route as TwinRouteImport } from './routes/twin';
import { Route as ServicesRouteImport } from './routes/services';
import { Route as ReportsRouteImport } from './routes/reports';
import { Route as RegisterRouteImport } from './routes/register';
import { Route as ProfileRouteImport } from './routes/profile';
import { Route as OnboardingRouteImport } from './routes/onboarding';
import { Route as LoginRouteImport } from './routes/login';
import { Route as LifestyleRouteImport } from './routes/lifestyle';
import { Route as DoctorRouteImport } from './routes/doctor';
import { Route as DashboardRouteImport } from './routes/dashboard';
import { Route as ContactRouteImport } from './routes/contact';
import { Route as ChatbotRouteImport } from './routes/chatbot';
import { Route as AboutRouteImport } from './routes/about';
import { Route as IndexRouteImport } from './routes/index';
import { Route as AdminMlRouteImport } from './routes/admin/ml';

const WhatifRoute = WhatifRouteImport.update({
  id: '/whatif',
  path: '/whatif',
  getParentRoute: () => rootRouteImport,
});
const TwinRoute = TwinRouteImport.update({
  id: '/twin',
  path: '/twin',
  getParentRoute: () => rootRouteImport,
});
const ServicesRoute = ServicesRouteImport.update({
  id: '/services',
  path: '/services',
  getParentRoute: () => rootRouteImport,
});
const ReportsRoute = ReportsRouteImport.update({
  id: '/reports',
  path: '/reports',
  getParentRoute: () => rootRouteImport,
});
const RegisterRoute = RegisterRouteImport.update({
  id: '/register',
  path: '/register',
  getParentRoute: () => rootRouteImport,
});
const ProfileRoute = ProfileRouteImport.update({
  id: '/profile',
  path: '/profile',
  getParentRoute: () => rootRouteImport,
});
const OnboardingRoute = OnboardingRouteImport.update({
  id: '/onboarding',
  path: '/onboarding',
  getParentRoute: () => rootRouteImport,
});
const LoginRoute = LoginRouteImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRouteImport,
});
const LifestyleRoute = LifestyleRouteImport.update({
  id: '/lifestyle',
  path: '/lifestyle',
  getParentRoute: () => rootRouteImport,
});
const DoctorRoute = DoctorRouteImport.update({
  id: '/doctor',
  path: '/doctor',
  getParentRoute: () => rootRouteImport,
});
const DashboardRoute = DashboardRouteImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => rootRouteImport,
});
const ContactRoute = ContactRouteImport.update({
  id: '/contact',
  path: '/contact',
  getParentRoute: () => rootRouteImport,
});
const ChatbotRoute = ChatbotRouteImport.update({
  id: '/chatbot',
  path: '/chatbot',
  getParentRoute: () => rootRouteImport,
});
const AboutRoute = AboutRouteImport.update({
  id: '/about',
  path: '/about',
  getParentRoute: () => rootRouteImport,
});
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
});
const AdminMlRoute = AdminMlRouteImport.update({
  id: '/admin/ml',
  path: '/admin/ml',
  getParentRoute: () => rootRouteImport,
});

const rootRouteChildren = {
  IndexRoute: IndexRoute,
  AboutRoute: AboutRoute,
  ChatbotRoute: ChatbotRoute,
  ContactRoute: ContactRoute,
  DashboardRoute: DashboardRoute,
  DoctorRoute: DoctorRoute,
  LifestyleRoute: LifestyleRoute,
  LoginRoute: LoginRoute,
  OnboardingRoute: OnboardingRoute,
  ProfileRoute: ProfileRoute,
  RegisterRoute: RegisterRoute,
  ReportsRoute: ReportsRoute,
  ServicesRoute: ServicesRoute,
  TwinRoute: TwinRoute,
  WhatifRoute: WhatifRoute,
  AdminMlRoute: AdminMlRoute,
};
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes();
