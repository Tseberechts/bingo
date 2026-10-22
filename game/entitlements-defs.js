const FREE_ENTITLEMENTS = Object.freeze({
  isPaid: false,
  customSponsors: false,
  customMainLogo: false,
  customBrandColors: false,
  multipleSaves: false,
  eveningReport: false,
  audienceWindow: false,
  maxSaveSlots: 1,
});

const PAID_ENTITLEMENTS = Object.freeze({
  isPaid: true,
  customSponsors: true,
  customMainLogo: true,
  customBrandColors: true,
  multipleSaves: true,
  eveningReport: true,
  audienceWindow: true,
  maxSaveSlots: Infinity,
});

module.exports = {
  FREE_ENTITLEMENTS,
  PAID_ENTITLEMENTS,
};
