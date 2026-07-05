// No SMS/WhatsApp gateway is configured yet (no Twilio/Termii/WhatsApp
// Business API credentials in .env). Rather than silently marking messages
// "sent" when nothing was actually dispatched, sends fall back to a clearly
// flagged "simulated" mode — mirrors the ANTHROPIC_API_KEY fallback pattern
// used by aiDocumentsController. Once real credentials are added here, wire
// the actual provider call in place of the simulated branch below.
function smsProviderConfigured() {
  return Boolean(process.env.SMS_PROVIDER_API_KEY);
}

function whatsappProviderConfigured() {
  return Boolean(process.env.WHATSAPP_BUSINESS_API_TOKEN);
}

module.exports = { smsProviderConfigured, whatsappProviderConfigured };
