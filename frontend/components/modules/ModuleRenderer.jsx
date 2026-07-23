'use client';

import { lazy, Suspense } from 'react';
import { SkeletonRows } from '../ui/Skeleton';

// Dynamic imports — each module is loaded only when its slug is matched.
// This drops ~300 kB from the initial bundle and enables per-route code splitting.
const CRMModule = lazy(() => import('./CRM'));
const ProjectManagementModule = lazy(() => import('./ProjectManagement'));
const InvoicesModule = lazy(() => import('./Invoices'));
const EmailMarketingModule = lazy(() => import('./EmailMarketing'));
const LeadGenerationModule = lazy(() => import('./LeadGeneration'));
const AppointmentBookingModule = lazy(() => import('./AppointmentBooking'));
const FormsModule = lazy(() => import('./Forms'));
const PopupBuilderModule = lazy(() => import('./PopupBuilder'));
const QuizBuilderModule = lazy(() => import('./QuizBuilder'));
const UrlShortenerModule = lazy(() => import('./UrlShortener'));
const QrCodeGeneratorModule = lazy(() => import('./QrCodeGenerator'));
const LinkInBioModule = lazy(() => import('./LinkInBio'));
const DigitalBusinessCardsModule = lazy(() => import('./DigitalBusinessCards'));
const AdCampaignManagerModule = lazy(() => import('./AdCampaignManager'));
const CustomerSegmentationModule = lazy(() => import('./CustomerSegmentation'));
const PushNotificationMarketingModule = lazy(() => import('./PushNotificationMarketing'));
const ReferralProgramModule = lazy(() => import('./ReferralProgram'));
const GdprModule = lazy(() => import('./GdprModule'));
const DunningModule = lazy(() => import('./DunningModule'));
const ContractsModule = lazy(() => import('./ContractsModule'));
const FeatureFlagsModule = lazy(() => import('./FeatureFlagsModule'));
const CustomFieldsModule = lazy(() => import('./CustomFieldsModule'));
const GenericModule = lazy(() => import('./GenericModule'));
const SettingsModule = lazy(() => import('./SettingsModule'));
const PlatformCoreModule = lazy(() => import('./PlatformCoreModule'));
const AiModule = lazy(() => import('./AiModule'));
const SeoModule = lazy(() => import('./SeoModule'));
const EducationModule = lazy(() => import('./EducationModule'));
const CommerceModule = lazy(() => import('./CommerceModule'));
const HelpdeskModule = lazy(() => import('./HelpdeskModule'));
const PayrollModule = lazy(() => import('./PayrollModule'));
const ExpensesModule = lazy(() => import('./ExpensesModule'));
const AccountingModule = lazy(() => import('./AccountingModule'));
const QuotationsModule = lazy(() => import('./QuotationsModule'));

function L({ children }) {
  return <Suspense fallback={<div className="panel"><SkeletonRows rows={5} /></div>}>{children}</Suspense>;
}

export default function ModuleRenderer({ moduleSlug, goHome, categories }) {
  // Normalize slug from catch-all route patterns:
  //   'modules/ai-writer' → 'ai-writer'
  //   'ai/writer' → 'ai-writer'
  const slug = moduleSlug
    .replace(/^modules\//, '')
    .replace(/\//g, '-');

  if (slug === 'crm') {
    return <L><CRMModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'pm' || slug === 'project-management') {
    return <L><ProjectManagementModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'invoices') {
    return <L><InvoicesModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'email-marketing') {
    return <L><EmailMarketingModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'lead-generation') {
    return <L><LeadGenerationModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'appointment-booking') {
    return <L><AppointmentBookingModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'forms') {
    return <L><FormsModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'popup-builder') {
    return <L><PopupBuilderModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'quiz-builder') {
    return <L><QuizBuilderModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'url-shortener') {
    return <L><UrlShortenerModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'qr-code-generator') {
    return <L><QrCodeGeneratorModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'link-in-bio') {
    return <L><LinkInBioModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'digital-business-cards') {
    return <L><DigitalBusinessCardsModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'ad-campaign-manager') {
    return <L><AdCampaignManagerModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'customer-segmentation') {
    return <L><CustomerSegmentationModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'push-notification-marketing') {
    return <L><PushNotificationMarketingModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'referral-program') {
    return <L><ReferralProgramModule goHome={goHome} showToast={() => {}} /></L>;
  }
  if (slug === 'gdpr') {
    return <L><GdprModule goHome={goHome} /></L>;
  }
  if (slug === 'dunning') {
    return <L><DunningModule goHome={goHome} /></L>;
  }
  if (slug === 'contracts') {
    return <L><ContractsModule goHome={goHome} /></L>;
  }
  if (slug === 'feature-flags') {
    return <L><FeatureFlagsModule goHome={goHome} /></L>;
  }
  if (slug === 'custom-fields' || slug === 'custom-fields-engine') {
    return <L><CustomFieldsModule goHome={goHome} /></L>;
  }
  if (slug === 'payroll') {
    return <L><PayrollModule goHome={goHome} /></L>;
  }
  if (slug === 'expenses') {
    return <L><ExpensesModule goHome={goHome} /></L>;
  }
  if (slug === 'accounting') {
    return <L><AccountingModule goHome={goHome} /></L>;
  }
  if (slug === 'quotations') {
    return <L><QuotationsModule goHome={goHome} /></L>;
  }

  // Grouped modules
  if (
    slug === 'learning-management-system' ||
    slug === 'school-management' ||
    slug === 'cbt-platform' ||
    slug === 'assignments' ||
    slug === 'student-portal' ||
    slug === 'parent-portal' ||
    slug === 'teacher-portal' ||
    slug === 'certificates'
  ) {
    return <L><EducationModule goHome={goHome} /></L>;
  }

  if (
    slug === 'order-management' ||
    slug === 'marketplace' ||
    slug === 'subscriptions' ||
    slug === 'pos' ||
    slug === 'coupons' ||
    slug === 'digital-products' ||
    slug === 'delivery-tracking'
  ) {
    return <L><CommerceModule goHome={goHome} /></L>;
  }

  if (slug === 'help-desk') {
    return <L><HelpdeskModule goHome={goHome} /></L>;
  }

  if (
    slug.startsWith('seo-') ||
    slug === 'keyword-research' ||
    slug === 'rank-tracking' ||
    slug === 'backlink-monitoring' ||
    slug === 'schema-generator' ||
    slug === 'sitemap-generator' ||
    slug === 'meta-generator' ||
    slug === 'robots-generator' ||
    slug === 'seo-audit' ||
    slug === 'accessibility-wcag-audit-tool' ||
    slug === 'page-speed-core-web-vitals-monitor' ||
    slug === 'sem-ad-campaign-bid-roas-tracker' ||
    slug === 'ai-seo-content-optimizer'
  ) {
    return <L><SeoModule goHome={goHome} /></L>;
  }

  // AI suite modules
  if (
    slug === 'ai-writer' ||
    slug === 'ai-email-assistant' ||
    slug === 'ai-proposal-generator' ||
    slug === 'ai-blog-generator' ||
    slug === 'ai-chatbot-builder' ||
    slug === 'ai-meeting-notes' ||
    slug === 'ai-knowledge-base' ||
    slug === 'ai-customer-support' ||
    slug === 'ai-translator'
  ) {
    return <L><AiModule goHome={goHome} /></L>;
  }

  if (slug === 'integrations') {
    return <L><IntegrationsModule goHome={goHome} /></L>;
  }

  // Catch-all
  return <L><GenericModule moduleSlug={moduleSlug} goHome={goHome} categories={categories} /></L>;
}
