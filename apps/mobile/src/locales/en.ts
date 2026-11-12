const en = {
  tabs: { scan: 'Scan', history: 'History', radar: 'Scam Radar', settings: 'Settings' },
  scan: {
    title: 'Check a message',
    intro:
      'Paste a message, link or phone number you are not sure about. We will tell you if it looks like a scam and why.',
    placeholder: 'Paste the message here',
    paste: 'Paste',
    screenshot: 'Screenshot',
    check: 'Check message',
    checking: 'Checking…',
    privacyNote:
      'Before checking, we hide your personal details (OTPs, account numbers, phone numbers).',
    readingImage: 'Reading the screenshot…',
    ocrNoText:
      'We could not read any text in that picture. Try a clearer screenshot, or copy and paste the message.',
    ocrFailed: 'Something went wrong reading the picture. Please paste the message instead.',
    clipboardEmpty: 'There is nothing copied yet. Copy the message first, then tap Paste.',
    online: {
      title: 'Read Sinhala or Tamil text?',
      body: 'Your phone can only read English letters in pictures. To read Sinhala or Tamil, the picture is sent to our online reader (Google Gemini). Personal details in the picture are NOT hidden, so crop out anything private first.',
      send: 'Send picture',
      useLocal: 'English only',
      cancel: 'Cancel',
      retry: 'Text looks wrong? Read it online',
      reading: 'Reading online…',
      failed: 'We could not read the picture online. Please copy and paste the message instead.',
      offline:
        'You are offline, so we could not read the picture. Please paste the message instead.',
      limited:
        'You have checked a lot of messages this hour. Please wait a little, or paste the message.',
      unavailable: 'Online reading is not set up yet. Please paste the message instead.',
    },
  },
  result: {
    title: 'Result',
    level: { safe: 'Looks safe', caution: 'Be careful', danger: 'Likely scam' },
    score: 'Risk score {{score}} out of 100',
    why: 'Why',
    whatToDo: 'What to do',
    yourMessage: 'Your message',
    offline: 'You are offline, so only the checks on your phone were used.',
    serverBusy: 'Our online check is busy, so only the checks on your phone were used.',
    noFlags: 'We did not find any common scam signs.',
    checkAnother: 'Check another message',
    reportButton: 'Report this scam',
    reported: 'You reported this. Thank you for warning others.',
    evidence: {
      community:
        'People in the Baitless community reported a link or number in this message as a scam',
      safeBrowsing: 'Google Safe Browsing lists a link in this message as dangerous',
    },
    notFound: 'This result is no longer saved.',
    sources: 'Checked with: {{list}}',
    sourceNames: {
      rules: 'scam patterns',
      ai: 'AI review',
      safeBrowsing: 'Google Safe Browsing',
      community: 'community reports',
    },
    action: {
      danger:
        'Do not reply, open links or share any OTP or PIN. If you are worried, call your bank on the number printed on your card.',
      caution:
        'Stop before you do anything. Check it yourself using an official phone number or website.',
      safe: 'We found no scam signs. Still, never share an OTP or PIN with anyone.',
    },
    category: {
      bank: 'Bank scam',
      lottery_prize: 'Prize or lottery scam',
      courier: 'Fake delivery',
      job: 'Job scam',
      investment: 'Investment scam',
      telecom: 'Telco scam',
      government: 'Fake government payment',
      romance: 'Romance scam',
      shopping: 'Shopping scam',
      other: 'Possible scam',
      none: '',
    },
  },
  report: {
    title: 'Report this scam',
    intro:
      'Your report warns other people. When 3 different people report the same link or number, everyone who checks it is warned.',
    shared: 'What will be added to the community list',
    phoneHashed: 'Sent as a secret code, not as the number.',
    confirmRule:
      'Only links and numbers are shared. Your message and your details stay on this phone.',
    nothingToShare:
      'This message has no links or phone numbers to add to the community list. You can still report it to the authorities below.',
    whatKind: 'What kind of scam is it?',
    send: 'Send report',
    thanks: 'Thank you. Your report was added to the community list.',
    error: {
      nothing_to_report: 'There is nothing in this message to report.',
      rate_limited: 'You have sent many reports this hour. Please try again later.',
      offline: 'You are offline. Connect to the internet and try again.',
      failed: 'Something went wrong. Please try again.',
    },
    authorities: 'Tell the authorities',
    lostMoney:
      'If you shared an OTP or PIN, or lost money, call your bank now on the number printed on your card.',
    certHelp:
      'Sri Lanka CERT takes scam reports through its website. We copy a summary for you to paste into its form.',
    openCert: 'Copy summary and open CERT form',
    shareText: 'Share the summary',
    callCert: 'Call Sri Lanka CERT ({{number}})',
  },
  reasons: {
    urgency: 'Pushes you to act fast',
    account_threat: 'Says your account will be blocked or closed',
    credential_request: 'Asks for your OTP, PIN, password or card details',
    authority_impersonation: 'Claims to be from a bank, police or security team',
    prize: 'Claims you won a prize or gift',
    fee_request: 'Asks you to pay a fee or send money first',
    courier: 'Mentions a parcel or delivery problem',
    job_offer: 'Easy-money job offer',
    investment_promise: 'Promises guaranteed or very high returns',
    investment_topic: 'Talks about trading or investing',
    telecom_threat: 'Says your SIM or connection will be cut off',
    brand_mention: 'Mentions a bank, telco or courier by name',
    government_benefit: 'Promises a government payment or grant',
    family_impersonation: 'Claims to be a family member using a new number',
    money_request: 'Asks you to transfer money',
    call_number: 'Asks you to call or WhatsApp a number',
    url_any: 'Contains a link',
    url_brand_lookalike: 'Link pretends to be a well-known company',
    url_ip_host: 'Link uses a raw IP address',
    url_punycode: 'Link uses look-alike letters',
    url_shortener: 'Link is shortened so you cannot see where it goes',
    url_risky_tld: 'Link uses a domain ending common in scams',
    url_no_https: 'Link is not secure (no https)',
    url_many_subdomains: 'Link has an unusually long address',
    url_messaging_link: 'Moves the chat to WhatsApp or Telegram',
  },
  history: {
    title: 'History',
    emptyTitle: 'No checks yet',
    emptyBody:
      'Messages you check are saved here on your phone, so you can look at them again later.',
    clear: 'Delete all',
    clearTitle: 'Delete all history?',
    clearBody: 'This removes every saved check from this phone. It cannot be undone.',
    cancel: 'Cancel',
    confirmDelete: 'Delete',
  },
  radar: {
    title: 'Scam Radar',
    comingTitle: 'Coming soon',
    comingBody:
      'Scams that other people in Sri Lanka report will show up here, so you can spot them early.',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    languageHint: 'Used for the app and for explanations.',
    privacyTitle: 'Your privacy',
    privacyBody:
      'Your history stays on this phone. When you check a message, personal details are hidden first, then the message is sent to our server for an AI review and a link safety check. We do not store the message. Sinhala or Tamil screenshots are sent as they are, and only when you agree.',
    deleteHistory: 'Delete history',
  },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Strings = Widen<typeof en>;
export default en;
