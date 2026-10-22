const { isPaid, getLicenseStatus } = require('./license');
const { FREE_ENTITLEMENTS, PAID_ENTITLEMENTS } = require('./entitlements-defs');

const getEntitlements = () => {
  const paid = isPaid();
  return {
    ...(paid ? PAID_ENTITLEMENTS : FREE_ENTITLEMENTS),
    license: getLicenseStatus(),
  };
};

const requirePaid = (featureKey) => {
  const entitlements = getEntitlements();
  if (entitlements[featureKey]) return { ok: true, entitlements };
  return {
    ok: false,
    error: 'Deze functie is beschikbaar in de betaalde versie. Activeer een licentiesleutel onder Voorkeuren → Licentie.',
    entitlements,
  };
};

module.exports = {
  FREE_ENTITLEMENTS,
  PAID_ENTITLEMENTS,
  getEntitlements,
  requirePaid,
};
