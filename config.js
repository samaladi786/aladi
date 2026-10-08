// config.js - മൾട്ടി-ഷോപ്പ് Supabase കോൺഫിഗറേഷൻ
window.SHOPS_CONFIG = [
  {
    id: 'shop1',
    name: 'NASSER BIN EID ALMAHMADI',
    url: 'https://elubqoicerkldrufqcbj.supabase.co',
    key: 'sb_publishable_zsEKreCmounELozZ5EQ3Lg_aXyut9EK'
  },
  {
    id: 'shop2',
    name: 'BOOFIYA',
    url: 'https://qkjcviszzdptssvpguwc.supabase.co',
    key: 'sb_publishable_J0Z4b7NoP3VuDKdbC0WeIg_OQAlpnLQ'
  }
];

// ഡിഫോൾട്ട് കോൺഫിഗറേഷൻ (മറ്റ് ഫയലുകൾക്ക് ആവശ്യമെങ്കിൽ ഉപയോഗിക്കാൻ)
window.GLOBAL_CONFIG = {
  supabaseUrl: 'https://elubqoicerkldrufqcbj.supabase.co',
  supabaseKey: 'sb_publishable_zsEKreCmounELozZ5EQ3Lg_aXyut9EK'
};

// സൗദി സമയം രാവിലെ 6:00 മണിക്ക് തീയതി മാറുന്ന ഫംഗ്ഷൻ (എല്ലാ ഫയലുകൾക്കും കോമൺ)
window.getSaudiBusinessDate = function() {
  const now = new Date();
  // സൗദി ടൈംസോണിൽ (Asia/Riyadh, UTC+3) സമയം കണക്കാക്കുന്നു
  const saudiTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Riyadh" });
  const saudiDate = new Date(saudiTimeStr);

  // രാവിലെ 6 മണിക്ക് മുമ്പാണെങ്കിൽ (00:00 മുതൽ 05:59 വരെ) തലേ ദിവസത്തെ തീയതി നൽകുന്നു
  if (saudiDate.getHours() < 6) {
    saudiDate.setDate(saudiDate.getDate() - 1);
  }

  const year = saudiDate.getFullYear();
  const month = String(saudiDate.getMonth() + 1).padStart(2, '0');
  const day = String(saudiDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
