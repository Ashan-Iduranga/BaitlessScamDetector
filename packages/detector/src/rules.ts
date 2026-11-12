import type { ScamCategory } from './schema.ts';

/**
 * Text rules. Each rule has patterns in English, Singlish (romanised Sinhala), Sinhala and Tamil.
 * `weight` is the rule's evidence strength in 0..1; scores combine as independent evidence
 * (see score.ts). The UI shows `reason`, keyed by `id` for translation.
 *
 * Note: \b only knows ASCII letters, so Sinhala and Tamil patterns don't use it.
 */
export type TextRule = {
  id: string;
  weight: number;
  category?: ScamCategory;
  reason: string;
  patterns: RegExp[];
  /** Ignore a match preceded by "do not", "never", "don't" etc. (e.g. "do not share this code"). */
  negatable?: boolean;
};

export const TEXT_RULES: TextRule[] = [
  {
    id: 'urgency',
    weight: 0.25,
    reason: 'Pushes you to act fast',
    patterns: [
      /\b(within|in) (24|48|12|2) (hours|hrs|minutes|mins)\b/i,
      /\b(immediately|urgent(ly)?|act now|right now|asap|last chance|final (notice|warning)|today only|limited (time|slots|offer)|expires? (today|soon))\b/i,
      /\b(ikmanata|ikmanin|ikman(a)?|dan(ma)?ma|ada(ma)? athulatha)\b/i,
      /ඉක්මනින්|වහාම|පැය\s?\d+\s?ක්?\s?ඇතුළත|අද\s?දිනය?\s?ඇතුළත/,
      /உடனடியாக|உடனே|\d+\s?மணி நேரத்திற்குள்|இன்றே/,
    ],
  },
  {
    id: 'account_threat',
    weight: 0.35,
    category: 'bank',
    reason: 'Says your account will be blocked or closed',
    patterns: [
      /\b(account|card|sim|number|wallet)\b.{0,40}\b(blocked|suspended|locked|deactivated|disabled|closed|restricted|frozen|will be (blocked|suspended|deactivated|closed))\b/i,
      /\b(account|card|sim)\s?(eka)?\s?(block|lock|suspend)\s?(wela|karala|wenawa|venava)\b/i,
      /(ගිණුම|කාඩ්පත|සිම්).{0,30}(අත්හිටුවා|අවහිර|අක්‍රිය|වසා)/,
      /(கணக்கு|அட்டை|சிம்).{0,30}(முடக்க|தடை|நிறுத்த|மூட)/,
    ],
  },
  {
    id: 'credential_request',
    weight: 0.5,
    reason: 'Asks for your OTP, PIN, password or card details',
    negatable: true,
    patterns: [
      /\b(share|send|give|enter|read|tell|reply with|provide|confirm|type)\b.{0,30}\b(otp|pin|password|cvv|cvc|security code|verification code|6[- ]digit code|code|card (number|details)|nic( number)?|bank details)\b/i,
      // Code first, request after: "we sent you a code. Please read it to us".
      /\b(otp|pin|code)\b.{0,40}\b(read|tell|share|send|give)\b.{0,6}\b(it|them|to us|with us|back)\b/i,
      /\b(verify|update|confirm|validate)\b.{0,15}\b(your )?(details|account|identity|information|kyc)\b/i,
      /\b(otp|pin|code)\s?(eka|ekak)\s?(danna|denna|ewanna|evanna|kiyanna|send karanna)\b/i,
      /(OTP|මුරපදය|රහස් අංකය|කේතය|PIN).{0,20}(ලබා දෙන්න|එවන්න|කියන්න|ඇතුළත් කරන්න)/,
      /(විස්තර|තොරතුරු).{0,15}(තහවුරු|යාවත්කාලීන)/,
      /(OTP|கடவுச்சொல்|குறியீடு|PIN).{0,20}(அனுப்ப|சொல்ல|பகிர|உள்ளிட)/,
      /விவரங்களை.{0,15}(சரிபார்க்க|உறுதிப்படுத்த|புதுப்பிக்க)/,
    ],
  },
  {
    id: 'authority_impersonation',
    weight: 0.3,
    category: 'bank',
    reason: 'Claims to be from a bank, police or security team',
    patterns: [
      /\b(calling|call|message|writing) from (the |your )?(bank|police|cid|fraud|security|customs|telecom|central bank)\b/i,
      /\b(fraud|security|risk) (team|department|unit|division)\b/i,
      /බැංකුවෙන් කතා|පොලිසියෙන් කතා/,
      /வங்கியிலிருந்து அழைக்கிறோம்|காவல்துறையிலிருந்து/,
    ],
  },
  {
    id: 'prize',
    weight: 0.35,
    category: 'lottery_prize',
    reason: 'Claims you won a prize or gift',
    patterns: [
      /\b(congratulations|congrats|you (have )?won|winner|lucky draw|jackpot|prize|reward|cash gift|gift voucher|selected (to receive|as a winner))\b/i,
      /\b(gift|thyagay[ae]|thagga)\s?(ekak|eka)\b|\bdinala\b|\bdinuma\b/i,
      /සුබ පැතුම්|දිනා ඇත|දිනුම|ත්‍යාග|තෑග්ග/,
      /வாழ்த்துக்கள்|வென்றுள்ளீர்கள்|வென்றீர்கள்|பரிசு|அதிர்ஷ்ட/,
    ],
  },
  {
    id: 'fee_request',
    weight: 0.4,
    reason: 'Asks you to pay a fee or send money first',
    patterns: [
      /\b(processing|delivery|redelivery|clearance|customs|registration|activation|handling|release|tax) (fee|charge|payment)\b/i,
      /\bpay\b.{0,15}\b(rs\.?|lkr|rupees)\s?\d/i,
      /\b(reload|top[- ]?up)\b.{0,25}\b(rs\.?|lkr)?\s?\d+/i,
      /\b(salli|reload)\s?(ekak)?\s?(dannako|danna|ewanna|evanna|dala)\b|\baccount ekata\b.{0,20}\bdan/i,
      /ගාස්තු(වක්)?.{0,20}ගෙවන්න|මුදල්.{0,15}(එවන්න|බැර කරන්න|දමන්න)|රු\.?\s?[\d,]+.{0,15}ගෙවන්න/,
      /கட்டணம்.{0,20}செலுத்து|பணம்.{0,15}(அனுப்ப|செலுத்த)/,
    ],
  },
  {
    id: 'courier',
    weight: 0.15,
    category: 'courier',
    reason: 'Mentions a parcel or delivery problem',
    patterns: [
      /\b(parcel|package|shipment|delivery|courier|consignment)\b.{0,50}\b(failed|could not|unable|held|pending|incomplete|returned|on hold)\b/i,
      /\b(parcel|package|pakage)\s?(eka|ekak)\b/i,
      /පාර්සල|පැකේජ|බෙදා හැරීම/,
      /பார்சல்|பொதி|டெலிவரி/,
    ],
  },
  {
    id: 'job_offer',
    weight: 0.35,
    category: 'job',
    reason: 'Easy-money job offer',
    patterns: [
      /\b(part[- ]?time|work from home|online job|daily (income|earning|payment)|earn (up to )?(rs\.?|lkr|\$)\s?\d|no experience|like (videos|youtube|posts)|simple tasks?|task based)\b/i,
      /\b(gedara indan|gedara idan)\b.{0,20}\b(salli|income|job)\b/i,
      /නිවසේ සිට|අර්ධ කාලීන|දිනකට රු/,
      /வீட்டிலிருந்து|பகுதி நேர|தினமும் ரூ/,
    ],
  },
  {
    id: 'investment_promise',
    weight: 0.55,
    category: 'investment',
    reason: 'Promises guaranteed or very high returns',
    patterns: [
      /\b(guaranteed|risk[- ]free|100%)\b.{0,25}\b(return|profit|income|returns|back)\b|\bguaranteed\b/i,
      /\b(double|triple) your (money|investment)\b/i,
      /\bget\b.{0,25}\bback in \d+ (days|hours|weeks)\b/i,
      /\b\d{2,4}\s?% (profit|return|interest)\b/i,
      /සහතික.{0,10}(ලාභ|ප්‍රතිලාභ)|මුදල් දෙගුණ/,
      /உத்தரவாத.{0,10}(லாபம்|வருமானம்)|இரட்டிப்பு/,
    ],
  },
  {
    id: 'investment_topic',
    weight: 0.15,
    category: 'investment',
    reason: 'Talks about trading or investing',
    patterns: [
      /\b(invest(ment)?|trading|forex|crypto|bitcoin|usdt|binance|vip group|signals)\b/i,
      /ආයෝජන|වෙළඳාම/,
      /முதலீடு|வர்த்தகம்/,
    ],
  },
  {
    id: 'telecom_threat',
    weight: 0.3,
    category: 'telecom',
    reason: 'Says your SIM or connection will be cut off',
    patterns: [
      /\b(sim|connection|number|line)\b.{0,30}\b(deactivat|disconnect|block|suspend|terminat)/i,
      /\b(kyc|re-?registration|sim registration)\b/i,
    ],
  },
  {
    id: 'brand_mention',
    weight: 0.05,
    reason: 'Mentions a bank, telco or courier by name',
    patterns: [
      /\b(boc|bank of ceylon|people'?s bank|sampath|commercial bank|combank|hnb|hatton national|nsb|seylan|ndb|dfcc|dialog|mobitel|hutch|airtel|slt|sl ?post|daraz|cbsl|central bank)\b/i,
      /ලංකා බැංකුව|මහජන බැංකුව|ලංකා තැපැල/,
      /இலங்கை வங்கி|மக்கள் வங்கி/,
    ],
  },
  {
    id: 'government_benefit',
    weight: 0.3,
    category: 'government',
    reason: 'Promises a government payment or grant',
    patterns: [
      /\b(aswesuma|samurdhi|government (grant|payment|subsidy|aid|relief)|relief (fund|payment)|tax refund|welfare payment)\b/i,
      /අස්වැසුම|සමෘද්ධි|රජයේ.{0,10}(දීමනාව|ප්‍රදානය)/,
      /அஸ்வெசும|சமுர்த்தி|அரசாங்க.{0,10}(உதவி|மானியம்)/,
    ],
  },
  {
    id: 'family_impersonation',
    weight: 0.45,
    category: 'other',
    reason: 'Claims to be a family member using a new number',
    patterns: [
      /\b(this is my new number|my (old )?phone (is )?(broken|lost|damaged)|lost my phone|new number)\b/i,
      /\b(aluth|alut) number\b|\bphone (eka )?(kadila|nathi wela|nathiwela)\b/i,
      /අලුත් අංකය|ෆෝන් එක කැඩිලා|දුරකථනය නැති/,
      /புதிய எண்|போன் உடைந்து|தொலைபேசி தொலைந்து/,
    ],
  },
  {
    id: 'money_request',
    weight: 0.3,
    reason: 'Asks you to transfer money',
    patterns: [
      /\b(send|transfer|deposit)\b.{0,20}\b(rs\.?|lkr|money|amount|funds)\b/i,
      /\b(rs\.?|lkr)\s?[\d,]+\b.{0,30}\b(transfer|deposit|send)\b/i,
      /\b(salli|mudal)\b.{0,20}\b(dannako|danna|ewanna|evanna|transfer)\b/i,
    ],
  },
  {
    id: 'call_number',
    weight: 0.1,
    reason: 'Asks you to call or WhatsApp a number',
    patterns: [
      /\b(call|contact|whatsapp|sms|text|dial|ring)\b.{0,15}(\+?94|0)\s?7\d/i,
      /\b(call karanna|kathaa karanna)\b/i,
      /අමතන්න|ඇමතුමක්/,
      /அழைக்கவும்|தொடர்பு கொள்ள/,
    ],
  },
];

/** Signs a message is a normal service message. Each one lowers the final score. */
export type DampenerRule = { id: string; factor: number; patterns: RegExp[] };

export const DAMPENERS: DampenerRule[] = [
  {
    id: 'safety_warning',
    factor: 0.5,
    patterns: [
      /\b(do not|don't|never) (share|disclose|give)\b/i,
      /\b(we|bank) (will )?never ask\b/i,
      /බෙදා නොගන්න|කිසිවෙකුට ලබා නොදෙන්න/,
      /பகிர வேண்டாம்|யாருடனும் பகிர/,
    ],
  },
  {
    id: 'ignore_if_paid',
    factor: 0.7,
    patterns: [/\bignore if (already )?(paid|done)\b/i],
  },
];

const NEGATION = /\b(do not|don't|dont|never|not|no need to)\s+(\w+\s+){0,2}$/i;

export function isNegated(text: string, matchStart: number): boolean {
  return NEGATION.test(text.slice(Math.max(0, matchStart - 25), matchStart));
}
