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
  if (moduleSlug === 'crm') {
    return <CRMModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'pm' || moduleSlug === 'project-management') {
    return <ProjectManagementModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'invoices') {
    return <InvoicesModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'email-marketing') {
    return <EmailMarketingModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'lead-generation') {
    return <LeadGenerationModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'appointment-booking') {
    return <AppointmentBookingModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'forms') {
    return <FormsModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'popup-builder') {
    return <PopupBuilderModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'quiz-builder') {
    return <QuizBuilderModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'url-shortener') {
    return <UrlShortenerModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'qr-code-generator') {
    return <QrCodeGeneratorModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'link-in-bio') {
    return <LinkInBioModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'digital-business-cards') {
    return <DigitalBusinessCardsModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'ad-campaign-manager') {
    return <AdCampaignManagerModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'customer-segmentation') {
    return <CustomerSegmentationModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'push-notification-marketing') {
    return <PushNotificationMarketingModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'referral-program') {
    return <ReferralProgramModule goHome={goHome} showToast={() => {}} />;
  }
  if (moduleSlug === 'gdpr') {
    return <GdprModule goHome={goHome} />;
  }
  if (moduleSlug === 'dunning') {
    return <DunningModule goHome={goHome} />;
  }
  if (moduleSlug === 'contracts') {
    return <ContractsModule goHome={goHome} />;
  }
  if (moduleSlug === 'feature-flags') {
    return <FeatureFlagsModule goHome={goHome} />;
  }
  if (moduleSlug === 'custom-fields' || moduleSlug === 'custom-fields-engine') {
    return <CustomFieldsModule goHome={goHome} />;
  }
  if (moduleSlug === 'payroll') {
    return <PayrollModule goHome={goHome} />;
  }
  if (moduleSlug === 'expenses') {
    return <ExpensesModule goHome={goHome} />;
  }
  if (moduleSlug === 'accounting') {
    return <AccountingModule goHome={goHome} />;
  }
  if (moduleSlug === 'quotations') {
    return <QuotationsModule goHome={goHome} />;
  }

  // Grouped modules
  if (
    moduleSlug === 'learning-management-system' ||
    moduleSlug === 'school-management' ||
    moduleSlug === 'cbt-platform' ||
    moduleSlug === 'assignments' ||
    moduleSlug === 'student-portal' ||
    moduleSlug === 'parent-portal' ||
    moduleSlug === 'teacher-portal' ||
    moduleSlug === 'certificates'
  ) {
    return <EducationModule goHome={goHome} />;
  }

  if (
    moduleSlug === 'order-management' ||
    moduleSlug === 'marketplace' ||
    moduleSlug === 'subscriptions' ||
    moduleSlug === 'pos' ||
    moduleSlug === 'coupons' ||
    moduleSlug === 'digital-products' ||
    moduleSlug === 'delivery-tracking'
  ) {
    return <CommerceModule goHome={goHome} />;
  }

  if (moduleSlug === 'help-desk') {
    return <HelpdeskModule goHome={goHome} />;
  }

  if (
    moduleSlug.startsWith('seo-') ||
    moduleSlug === 'keyword-research' ||
    moduleSlug === 'rank-tracking' ||
    moduleSlug === 'backlink-monitoring' ||
    moduleSlug === 'schema-generator' ||
    moduleSlug === 'sitemap-generator' ||
    moduleSlug === 'meta-generator' ||
    moduleSlug === 'robots-generator' ||
    moduleSlug === 'seo-audit' ||
    moduleSlug === 'accessibility-wcag-audit-tool' ||
    moduleSlug === 'page-speed-core-web-vitals-monitor' ||
    moduleSlug === 'sem-ad-campaign-bid-roas-tracker' ||
    moduleSlug === 'ai-seo-content-optimizer'
  ) {
    return <SeoModule goHome={goHome} />;
  }

  // Catch-all
  return <GenericModule moduleSlug={moduleSlug} goHome={goHome} categories={categories} />;
}
