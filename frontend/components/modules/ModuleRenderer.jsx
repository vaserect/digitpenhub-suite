'use client';

import CRMModule from './CRM';
import ProjectManagementModule from './ProjectManagement';
import InvoicesModule from './Invoices';
import EmailMarketingModule from './EmailMarketing';
import LeadGenerationModule from './LeadGeneration';
import AppointmentBookingModule from './AppointmentBooking';
import FormsModule from './Forms';
import PopupBuilderModule from './PopupBuilder';
import QuizBuilderModule from './QuizBuilder';
import UrlShortenerModule from './UrlShortener';
import QrCodeGeneratorModule from './QrCodeGenerator';
import LinkInBioModule from './LinkInBio';
import DigitalBusinessCardsModule from './DigitalBusinessCards';
import AdCampaignManagerModule from './AdCampaignManager';
import CustomerSegmentationModule from './CustomerSegmentation';
import PushNotificationMarketingModule from './PushNotificationMarketing';
import ReferralProgramModule from './ReferralProgram';
import GdprModule from './GdprModule';
import DunningModule from './DunningModule';
import ContractsModule from './ContractsModule';
import FeatureFlagsModule from './FeatureFlagsModule';
import CustomFieldsModule from './CustomFieldsModule';
import GenericModule from './GenericModule';
import SettingsModule from './SettingsModule';
import PlatformCoreModule from './PlatformCoreModule';
import AiModule from './AiModule';
import SeoModule from './SeoModule';
import EducationModule from './EducationModule';
import CommerceModule from './CommerceModule';
import HelpdeskModule from './HelpdeskModule';
import PayrollModule from './PayrollModule';
import ExpensesModule from './ExpensesModule';
import AccountingModule from './AccountingModule';
import QuotationsModule from './QuotationsModule';

export default function ModuleRenderer({ moduleSlug, goHome, categories }) {
  // Normalize slug from catch-all route patterns:
  //   'modules/ai-writer' → 'ai-writer'
  //   'ai/writer' → 'ai-writer'
  const slug = moduleSlug
    .replace(/^modules\//, '')
    .replace(/\//g, '-');

  if (slug === 'crm') {
    return <CRMModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'pm' || slug === 'project-management') {
    return <ProjectManagementModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'invoices') {
    return <InvoicesModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'email-marketing') {
    return <EmailMarketingModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'lead-generation') {
    return <LeadGenerationModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'appointment-booking') {
    return <AppointmentBookingModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'forms') {
    return <FormsModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'popup-builder') {
    return <PopupBuilderModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'quiz-builder') {
    return <QuizBuilderModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'url-shortener') {
    return <UrlShortenerModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'qr-code-generator') {
    return <QrCodeGeneratorModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'link-in-bio') {
    return <LinkInBioModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'digital-business-cards') {
    return <DigitalBusinessCardsModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'ad-campaign-manager') {
    return <AdCampaignManagerModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'customer-segmentation') {
    return <CustomerSegmentationModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'push-notification-marketing') {
    return <PushNotificationMarketingModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'referral-program') {
    return <ReferralProgramModule goHome={goHome} showToast={() => {}} />;
  }
  if (slug === 'gdpr') {
    return <GdprModule goHome={goHome} />;
  }
  if (slug === 'dunning') {
    return <DunningModule goHome={goHome} />;
  }
  if (slug === 'contracts') {
    return <ContractsModule goHome={goHome} />;
  }
  if (slug === 'feature-flags') {
    return <FeatureFlagsModule goHome={goHome} />;
  }
  if (slug === 'custom-fields' || slug === 'custom-fields-engine') {
    return <CustomFieldsModule goHome={goHome} />;
  }
  if (slug === 'payroll') {
    return <PayrollModule goHome={goHome} />;
  }
  if (slug === 'expenses') {
    return <ExpensesModule goHome={goHome} />;
  }
  if (slug === 'accounting') {
    return <AccountingModule goHome={goHome} />;
  }
  if (slug === 'quotations') {
    return <QuotationsModule goHome={goHome} />;
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
    return <EducationModule goHome={goHome} />;
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
    return <CommerceModule goHome={goHome} />;
  }

  if (slug === 'help-desk') {
    return <HelpdeskModule goHome={goHome} />;
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
    return <SeoModule goHome={goHome} />;
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
    return <AiModule goHome={goHome} />;
  }

  if (slug === 'integrations') {
    return <IntegrationsModule goHome={goHome} />;
  }

  // Catch-all
  return <GenericModule moduleSlug={moduleSlug} goHome={goHome} categories={categories} />;
}
