const { getSiteConfig } = require("./utils/site");

const site = getSiteConfig();

App({
  globalData: {
    brandName: site.brandName,
    servicePhone: site.contact.phone
  },

  onLaunch() {}
});
