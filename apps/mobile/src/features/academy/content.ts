import type { Language } from '@baitless/detector';

/** Text in every app language. */
type L = Record<Language, string>;

export type PracticeItem = {
  id: string;
  isScam: boolean;
  /** Who it seems to come from, as a phone would show it. */
  sender: string;
  text: L;
  /** Why it is (or is not) a scam, in one or two plain sentences. */
  tip: L;
};

export type BadgeId =
  'first_catch' | 'sharp_eye' | 'otp_safe' | 'link_checker' | 'offer_skeptic' | 'streak_3';

export type QuizId = 'otp' | 'links' | 'offers';

export type QuizQuestion = { prompt: L; options: L[]; answer: number; why: L };

export type Quiz = { id: QuizId; badge: BadgeId; questions: QuizQuestion[] };

/**
 * Practice messages, based on scams reported in Sri Lanka. Links and numbers are made up and use
 * endings real banks and companies do not use.
 */
export const PRACTICE: PracticeItem[] = [
  {
    id: 'bank-suspend',
    isScam: true,
    sender: 'BOC-Alert',
    text: {
      en: 'BOC: Your account will be suspended today. Update your details now at http://boc-lk-update.top and enter the OTP we send you.',
      si: 'BOC: ඔබේ ගිණුම අද අත්හිටුවනු ලැබේ. දැන්ම http://boc-lk-update.top හි ඔබේ විස්තර යාවත්කාලීන කර, අප එවන OTP අංකය ඇතුළත් කරන්න.',
      ta: 'BOC: உங்கள் கணக்கு இன்று இடைநிறுத்தப்படும். இப்போதே http://boc-lk-update.top இல் உங்கள் விவரங்களைப் புதுப்பித்து, நாங்கள் அனுப்பும் OTP-ஐ உள்ளிடவும்.',
    },
    tip: {
      en: 'Banks never ask you to type an OTP on a website from an SMS link. The real Bank of Ceylon site is boc.lk, not boc-lk-update.top.',
      si: 'SMS සබැඳියකින් යන වෙබ් අඩවියක OTP ඇතුළත් කරන්න බැංකු කිසිවිටෙක නොකියයි. ලංකා බැංකුවේ සැබෑ වෙබ් අඩවිය boc.lk මිස boc-lk-update.top නොවේ.',
      ta: 'SMS இணைப்பிலிருந்து திறக்கும் இணையதளத்தில் OTP-ஐ உள்ளிடுமாறு வங்கிகள் ஒருபோதும் கேட்காது. இலங்கை வங்கியின் உண்மையான தளம் boc.lk, boc-lk-update.top அல்ல.',
    },
  },
  {
    id: 'post-fee',
    isScam: true,
    sender: 'SLPost',
    text: {
      en: 'Sri Lanka Post: Your parcel is held at customs. Pay the Rs. 350 delivery fee within 24 hours: https://slpost-redelivery.xyz/pay',
      si: 'ශ්‍රී ලංකා තැපෑල: ඔබේ පාර්සලය රේගුවේ රඳවා ඇත. පැය 24ක් ඇතුළත රු. 350 බෙදාහැරීමේ ගාස්තුව ගෙවන්න: https://slpost-redelivery.xyz/pay',
      ta: 'இலங்கை அஞ்சல்: உங்கள் பார்சல் சுங்கத்தில் நிறுத்தப்பட்டுள்ளது. 24 மணி நேரத்திற்குள் ரூ. 350 விநியோகக் கட்டணத்தைச் செலுத்துங்கள்: https://slpost-redelivery.xyz/pay',
    },
    tip: {
      en: 'Post offices and couriers do not ask for small fees through SMS links. The small amount is bait to get your card details.',
      si: 'තැපැල් කාර්යාල සහ කුරියර් සේවා SMS සබැඳි හරහා කුඩා ගාස්තු ඉල්ලන්නේ නැත. කුඩා මුදල ඔබේ කාඩ්පත් විස්තර ලබා ගැනීමට ඇම පමණි.',
      ta: 'அஞ்சல் அலுவலகங்களும் கூரியர்களும் SMS இணைப்புகள் மூலம் சிறிய கட்டணங்களைக் கேட்பதில்லை. சிறிய தொகை உங்கள் அட்டை விவரங்களைப் பெறுவதற்கான தூண்டில் மட்டுமே.',
    },
  },
  {
    id: 'prize-tax',
    isScam: true,
    sender: '+94 77 123 4567',
    text: {
      en: 'Congratulations! Your number won Rs. 1,000,000 in the Dialog anniversary draw. Call 0771234567 and pay Rs. 5,000 tax to claim your prize.',
      si: 'සුබ පැතුම්! Dialog සංවත්සර දිනුම් ඇදීමෙන් ඔබේ අංකයට රු. 1,000,000ක් දිනා ඇත. ත්‍යාගය ලබා ගැනීමට 0771234567 අමතා රු. 5,000ක බද්දක් ගෙවන්න.',
      ta: 'வாழ்த்துக்கள்! Dialog ஆண்டு விழா குலுக்கலில் உங்கள் எண் ரூ. 1,000,000 வென்றுள்ளது. பரிசைப் பெற 0771234567-ஐ அழைத்து ரூ. 5,000 வரி செலுத்துங்கள்.',
    },
    tip: {
      en: 'You cannot win a draw you never entered, and real prizes never ask you to pay first.',
      si: 'ඔබ කිසිදා සහභාගී නොවූ දිනුම් ඇදීමක් දිනිය නොහැක. සැබෑ ත්‍යාග කිසිවිටෙක පළමුව මුදල් ගෙවන්න නොකියයි.',
      ta: 'நீங்கள் பங்கேற்காத குலுக்கலில் வெல்ல முடியாது. உண்மையான பரிசுகள் முதலில் பணம் செலுத்தச் சொல்வதில்லை.',
    },
  },
  {
    id: 'job-likes',
    isScam: true,
    sender: '+94 76 555 0199',
    text: {
      en: 'Part-time job! Earn Rs. 15,000 per day liking YouTube videos from home. Message us on WhatsApp: wa.me/94761234567 Limited places!',
      si: 'අර්ධකාලීන රැකියාවක්! නිවසේ සිට YouTube වීඩියෝ like කිරීමෙන් දිනකට රු. 15,000ක් උපයන්න. WhatsApp හරහා අපට පණිවිඩයක් එවන්න: wa.me/94761234567 ස්ථාන සීමිතයි!',
      ta: 'பகுதிநேர வேலை! வீட்டிலிருந்தே YouTube வீடியோக்களை லைக் செய்து நாளொன்றுக்கு ரூ. 15,000 சம்பாதியுங்கள். WhatsApp-இல் செய்தி அனுப்புங்கள்: wa.me/94761234567 இடங்கள் குறைவு!',
    },
    tip: {
      en: 'Big money for easy tasks is the hook. Later they ask you to deposit money to "unlock" your earnings, and it is gone.',
      si: 'පහසු වැඩට විශාල මුදලක් යනු ඇමයි. පසුව ඔබේ ඉපැයීම් "අගුළු හැරීමට" මුදල් තැන්පත් කරන්න කියයි, එවිට එය නැති වේ.',
      ta: 'எளிய வேலைக்கு அதிக பணம் என்பதுதான் தூண்டில். பின்னர் உங்கள் வருமானத்தை "திறக்க" பணம் வைப்பிலிடச் சொல்வார்கள், அது திரும்ப வராது.',
    },
  },
  {
    id: 'tax-refund',
    isScam: true,
    sender: 'IRD-LK',
    text: {
      en: 'Inland Revenue: You have a tax refund of Rs. 18,750. Enter your card details at http://ird-refund-lk.click to receive it today.',
      si: 'දේශීය ආදායම්: ඔබට රු. 18,750ක බදු ආපසු ගෙවීමක් ඇත. එය අදම ලබා ගැනීමට http://ird-refund-lk.click හි ඔබේ කාඩ්පත් විස්තර ඇතුළත් කරන්න.',
      ta: 'உள்நாட்டு இறைவரி: உங்களுக்கு ரூ. 18,750 வரி திருப்பிச் செலுத்துதல் உள்ளது. இன்றே பெற http://ird-refund-lk.click இல் உங்கள் அட்டை விவரங்களை உள்ளிடுங்கள்.',
    },
    tip: {
      en: 'Government offices never ask for your card details to pay you a refund.',
      si: 'ආපසු ගෙවීමක් කිරීමට රජයේ ආයතන කිසිවිටෙක ඔබේ කාඩ්පත් විස්තර ඉල්ලන්නේ නැත.',
      ta: 'பணத்தைத் திருப்பித் தர அரசு அலுவலகங்கள் ஒருபோதும் உங்கள் அட்டை விவரங்களைக் கேட்பதில்லை.',
    },
  },
  {
    id: 'new-number',
    isScam: true,
    sender: '+94 71 888 2041',
    text: {
      en: 'Amma, this is my new number, my phone broke. Please send Rs. 25,000 to this account urgently, I will explain later. BOC 8001234567',
      si: 'අම්මා, මේ මගේ අලුත් අංකය, මගේ ෆෝන් එක කැඩුණා. කරුණාකර ඉක්මනින් මේ ගිණුමට රු. 25,000ක් දාන්න, පස්සේ කියන්නම්. BOC 8001234567',
      ta: 'அம்மா, இது என் புதிய எண், என் போன் உடைந்துவிட்டது. தயவுசெய்து அவசரமாக இந்தக் கணக்கிற்கு ரூ. 25,000 அனுப்புங்கள், பிறகு சொல்கிறேன். BOC 8001234567',
    },
    tip: {
      en: 'A "new number" plus an urgent request for money is a classic trick. Call your child on their old number before sending anything.',
      si: '"අලුත් අංකයක්" සහ හදිසි මුදල් ඉල්ලීමක් යනු සුලබ උපක්‍රමයකි. කිසිවක් යැවීමට පෙර ඔබේ දරුවාගේ පැරණි අංකයට කතා කරන්න.',
      ta: '"புதிய எண்" மற்றும் அவசரப் பணக் கோரிக்கை என்பது பழைய தந்திரம். எதையும் அனுப்பும் முன் உங்கள் பிள்ளையின் பழைய எண்ணுக்கு அழைத்துப் பாருங்கள்.',
    },
  },
  {
    id: 'crypto-double',
    isScam: true,
    sender: 'LK Crypto Club',
    text: {
      en: 'Invest Rs. 50,000 and get Rs. 150,000 in 7 days! Guaranteed profit with our crypto trading team. Join now: t.me/lkcryptoprofit',
      si: 'රු. 50,000ක් ආයෝජනය කර දින 7කින් රු. 150,000ක් ලබා ගන්න! අපගේ ක්‍රිප්ටෝ වෙළඳ කණ්ඩායම සමඟ සහතික ලාභ. දැන්ම එක්වන්න: t.me/lkcryptoprofit',
      ta: 'ரூ. 50,000 முதலீடு செய்து 7 நாட்களில் ரூ. 150,000 பெறுங்கள்! எங்கள் கிரிப்டோ வர்த்தகக் குழுவுடன் உத்தரவாத லாபம். இப்போதே சேருங்கள்: t.me/lkcryptoprofit',
    },
    tip: {
      en: '"Guaranteed" high profit is always a lie. Early payouts come from newer victims until the scheme collapses.',
      si: '"සහතික" ඉහළ ලාභය සැමවිටම බොරුවකි. යෝජනා ක්‍රමය කඩා වැටෙන තුරු මුල් ගෙවීම් ලැබෙන්නේ අලුත් වින්දිතයින්ගෙනි.',
      ta: '"உத்தரவாத" அதிக லாபம் எப்போதும் பொய். திட்டம் சரியும் வரை ஆரம்பக் கொடுப்பனவுகள் புதிய பாதிக்கப்பட்டவர்களிடமிருந்தே வருகின்றன.',
    },
  },
  {
    id: 'real-otp',
    isScam: false,
    sender: 'COMBANK',
    text: {
      en: 'Your OTP for the online payment of Rs. 2,450.00 at DARAZ is 482913. Do not share this code with anyone, including bank staff.',
      si: 'DARAZ හි රු. 2,450.00 ඔන්ලයින් ගෙවීම සඳහා ඔබේ OTP අංකය 482913 වේ. බැංකු කාර්ය මණ්ඩලය ඇතුළු කිසිවෙකුටත් මෙම කේතය ලබා නොදෙන්න.',
      ta: 'DARAZ இல் ரூ. 2,450.00 ஆன்லைன் கட்டணத்திற்கான உங்கள் OTP 482913. வங்கி ஊழியர்கள் உட்பட யாருடனும் இந்தக் குறியீட்டைப் பகிர வேண்டாம்.',
    },
    tip: {
      en: 'This is a normal OTP: it comes right after you pay, has no link, and tells you never to share the code. Only type it into the payment you started.',
      si: 'මෙය සාමාන්‍ය OTP එකකි: ඔබ ගෙවූ වහාම ලැබේ, සබැඳියක් නැත, සහ කේතය කිසිවෙකුට නොදෙන්න කියයි. එය ඇතුළත් කරන්න ඔබ ආරම්භ කළ ගෙවීමට පමණි.',
      ta: 'இது சாதாரண OTP: நீங்கள் பணம் செலுத்தியதும் வருகிறது, இணைப்பு இல்லை, குறியீட்டைப் பகிர வேண்டாம் என்கிறது. நீங்கள் தொடங்கிய கட்டணத்தில் மட்டுமே அதை உள்ளிடுங்கள்.',
    },
  },
  {
    id: 'real-bill',
    isScam: false,
    sender: 'Dialog',
    text: {
      en: 'Dear customer, your Dialog bill of Rs. 1,240.50 is due on 25/11. Pay with the MyDialog app or at any Dialog outlet. Thank you.',
      si: 'හිතවත් පාරිභෝගිකය, ඔබේ රු. 1,240.50 Dialog බිල්පත 25/11 දිනට ගෙවිය යුතුය. MyDialog යෙදුමෙන් හෝ ඕනෑම Dialog ශාඛාවකින් ගෙවන්න. ස්තූතියි.',
      ta: 'அன்புள்ள வாடிக்கையாளரே, உங்கள் ரூ. 1,240.50 Dialog பில் 25/11 அன்று செலுத்த வேண்டும். MyDialog ஆப் மூலம் அல்லது எந்த Dialog கிளையிலும் செலுத்துங்கள். நன்றி.',
    },
    tip: {
      en: 'It sends you to the official app or a shop you know, not a link, and asks for no codes or card details.',
      si: 'එය ඔබව යොමු කරන්නේ නිල යෙදුමට හෝ ඔබ දන්නා ශාඛාවකට මිස සබැඳියකට නොවේ; කිසිදු කේතයක් හෝ කාඩ්පත් විස්තර ඉල්ලන්නේ නැත.',
      ta: 'இது இணைப்புக்கு அல்ல, அதிகாரப்பூர்வ ஆப் அல்லது உங்களுக்குத் தெரிந்த கிளைக்கே அனுப்புகிறது; எந்தக் குறியீடோ அட்டை விவரமோ கேட்கவில்லை.',
    },
  },
  {
    id: 'real-delivery',
    isScam: false,
    sender: 'Daraz',
    text: {
      en: 'Your Daraz order #4021187 has been shipped and will arrive in 2-3 days. You can track it in the Daraz app.',
      si: 'ඔබේ Daraz ඇණවුම #4021187 යවා ඇති අතර දින 2-3කින් ලැබෙනු ඇත. Daraz යෙදුමෙන් එය බලාගත හැක.',
      ta: 'உங்கள் Daraz ஆர்டர் #4021187 அனுப்பப்பட்டுள்ளது, 2-3 நாட்களில் வந்து சேரும். Daraz ஆப்பில் அதைக் கண்காணிக்கலாம்.',
    },
    tip: {
      en: 'No payment, no link and no rush. It points you to the app you already use for your order.',
      si: 'ගෙවීමක් නැත, සබැඳියක් නැත, හදිසියක් නැත. ඔබ දැනටමත් භාවිත කරන යෙදුමටම ඔබව යොමු කරයි.',
      ta: 'கட்டணம் இல்லை, இணைப்பு இல்லை, அவசரம் இல்லை. நீங்கள் ஏற்கனவே பயன்படுத்தும் ஆப்பையே காட்டுகிறது.',
    },
  },
];

export const QUIZZES: Quiz[] = [
  {
    id: 'otp',
    badge: 'otp_safe',
    questions: [
      {
        prompt: {
          en: 'Someone calls saying they are from your bank and asks for the OTP you just got. What do you do?',
          si: 'කෙනෙක් ඔබේ බැංකුවෙන් බව පවසමින් ඇමතුමක් දී, ඔබට දැන් ලැබුණු OTP අංකය ඉල්ලයි. ඔබ කරන්නේ කුමක්ද?',
          ta: 'உங்கள் வங்கியிலிருந்து அழைப்பதாகச் சொல்லி, இப்போது வந்த OTP-ஐ ஒருவர் கேட்கிறார். நீங்கள் என்ன செய்வீர்கள்?',
        },
        options: [
          {
            en: 'Give it, they are from the bank',
            si: 'එය දෙන්න, ඔවුන් බැංකුවෙන්',
            ta: 'கொடுங்கள், அவர்கள் வங்கியிலிருந்துதான்',
          },
          {
            en: 'Hang up and call the number on your card',
            si: 'ඇමතුම විසන්ධි කර ඔබේ කාඩ්පතේ ඇති අංකයට කතා කරන්න',
            ta: 'அழைப்பைத் துண்டித்து உங்கள் அட்டையில் உள்ள எண்ணை அழையுங்கள்',
          },
          {
            en: 'Give only half of the code',
            si: 'කේතයෙන් අඩක් පමණක් දෙන්න',
            ta: 'குறியீட்டில் பாதியை மட்டும் கொடுங்கள்',
          },
        ],
        answer: 1,
        why: {
          en: 'Banks never ask for your OTP. Anyone who asks for it is a scammer, even if they know your name.',
          si: 'බැංකු කිසිවිටෙක ඔබේ OTP අංකය ඉල්ලන්නේ නැත. ඔබේ නම දැන සිටියත්, එය ඉල්ලන ඕනෑම අයෙක් වංචාකරුවෙකි.',
          ta: 'வங்கிகள் ஒருபோதும் உங்கள் OTP-ஐக் கேட்பதில்லை. உங்கள் பெயர் தெரிந்திருந்தாலும், அதைக் கேட்பவர் மோசடிக்காரர்.',
        },
      },
      {
        prompt: {
          en: 'You get an OTP, but you did not try to pay or log in. What does it mean?',
          si: 'ඔබට OTP අංකයක් ලැබේ, නමුත් ඔබ ගෙවීමක් හෝ පිවිසීමක් කළේ නැත. එහි තේරුම කුමක්ද?',
          ta: 'உங்களுக்கு OTP வருகிறது, ஆனால் நீங்கள் பணம் செலுத்தவோ உள்நுழையவோ முயலவில்லை. இதன் அர்த்தம் என்ன?',
        },
        options: [
          {
            en: 'The bank made a mistake, so share it if someone asks',
            si: 'බැංකුව වැරැද්දක් කළා, කවුරුහරි ඉල්ලුවොත් දෙන්න',
            ta: 'வங்கி தவறு செய்துவிட்டது, யாராவது கேட்டால் பகிருங்கள்',
          },
          {
            en: 'Someone may be trying to get into your account: never share it, and call your bank',
            si: 'කෙනෙක් ඔබේ ගිණුමට ඇතුළු වීමට උත්සාහ කරනවා විය හැක: එය කිසිවිටෙක නොදී, බැංකුවට කතා කරන්න',
            ta: 'யாரோ உங்கள் கணக்கில் நுழைய முயற்சிக்கலாம்: ஒருபோதும் பகிராதீர்கள், வங்கியை அழையுங்கள்',
          },
          {
            en: 'You have won something',
            si: 'ඔබ යමක් දිනා ඇත',
            ta: 'நீங்கள் ஏதோ வென்றுள்ளீர்கள்',
          },
        ],
        answer: 1,
        why: {
          en: 'An OTP only approves something you started. If you did not start anything, someone else is using your details.',
          si: 'OTP එකක් අනුමත කරන්නේ ඔබ ආරම්භ කළ දෙයක් පමණි. ඔබ කිසිවක් ආරම්භ නොකළේ නම්, වෙනත් අයෙක් ඔබේ විස්තර භාවිත කරයි.',
          ta: 'OTP நீங்கள் தொடங்கியதை மட்டுமே அங்கீகரிக்கிறது. நீங்கள் எதையும் தொடங்கவில்லை என்றால், வேறொருவர் உங்கள் விவரங்களைப் பயன்படுத்துகிறார்.',
        },
      },
      {
        prompt: {
          en: 'A caller says your account is blocked and you must install an app like AnyDesk to fix it. What do you do?',
          si: 'ඔබේ ගිණුම අවහිර කර ඇති බවත්, එය නිවැරදි කිරීමට AnyDesk වැනි යෙදුමක් ස්ථාපනය කළ යුතු බවත් අමතන්නා පවසයි. ඔබ කරන්නේ කුමක්ද?',
          ta: 'உங்கள் கணக்கு முடக்கப்பட்டுள்ளது, சரிசெய்ய AnyDesk போன்ற ஆப்பை நிறுவ வேண்டும் என்று அழைப்பவர் சொல்கிறார். நீங்கள் என்ன செய்வீர்கள்?',
        },
        options: [
          {
            en: 'Install it quickly so the account is not closed',
            si: 'ගිණුම වැසී නොයන්න එය ඉක්මනින් ස්ථාපනය කරන්න',
            ta: 'கணக்கு மூடப்படாமல் இருக்க விரைவாக நிறுவுங்கள்',
          },
          {
            en: 'Refuse and hang up: these apps let them control your phone',
            si: 'ප්‍රතික්ෂේප කර ඇමතුම විසන්ධි කරන්න: මෙම යෙදුම් ඔවුන්ට ඔබේ දුරකථනය පාලනය කිරීමට ඉඩ දෙයි',
            ta: 'மறுத்து அழைப்பைத் துண்டியுங்கள்: இந்த ஆப்கள் உங்கள் போனை அவர்கள் கட்டுப்படுத்த அனுமதிக்கும்',
          },
          {
            en: 'Install it, but do not open your bank app',
            si: 'එය ස්ථාපනය කරන්න, නමුත් බැංකු යෙදුම විවෘත නොකරන්න',
            ta: 'நிறுவுங்கள், ஆனால் வங்கி ஆப்பைத் திறக்காதீர்கள்',
          },
        ],
        answer: 1,
        why: {
          en: 'Screen-sharing apps give scammers full control of your phone, including your bank app and your SMS codes.',
          si: 'තිර බෙදාගැනීමේ යෙදුම් ඔබේ බැංකු යෙදුම සහ SMS කේත ඇතුළුව ඔබේ දුරකථනයේ පූර්ණ පාලනය වංචාකරුවන්ට ලබා දෙයි.',
          ta: 'திரைப் பகிர்வு ஆப்கள் உங்கள் வங்கி ஆப் மற்றும் SMS குறியீடுகள் உட்பட உங்கள் போனின் முழுக் கட்டுப்பாட்டையும் மோசடிக்காரர்களுக்குத் தருகின்றன.',
        },
      },
      {
        prompt: {
          en: 'What should you do if you already shared an OTP or card details?',
          si: 'ඔබ දැනටමත් OTP අංකයක් හෝ කාඩ්පත් විස්තර ලබා දී ඇත්නම් කළ යුත්තේ කුමක්ද?',
          ta: 'நீங்கள் ஏற்கனவே OTP அல்லது அட்டை விவரங்களைப் பகிர்ந்திருந்தால் என்ன செய்ய வேண்டும்?',
        },
        options: [
          {
            en: 'Wait a few days to see if money goes missing',
            si: 'මුදල් අතුරුදන් වේදැයි දින කිහිපයක් බලා සිටින්න',
            ta: 'பணம் காணாமல் போகிறதா என்று சில நாட்கள் காத்திருங்கள்',
          },
          {
            en: 'Call your bank straight away to block the card, then report it to Sri Lanka CERT',
            si: 'කාඩ්පත අවහිර කිරීමට වහාම බැංකුවට කතා කර, පසුව ශ්‍රී ලංකා CERT වෙත වාර්තා කරන්න',
            ta: 'அட்டையை முடக்க உடனே வங்கியை அழைத்து, பின்னர் இலங்கை CERT-க்குப் புகாரளியுங்கள்',
          },
          {
            en: 'Reply to the scammer and ask for the money back',
            si: 'වංචාකරුට පිළිතුරු දී මුදල් ආපසු ඉල්ලන්න',
            ta: 'மோசடிக்காரருக்குப் பதிலளித்து பணத்தைத் திருப்பிக் கேளுங்கள்',
          },
        ],
        answer: 1,
        why: {
          en: 'Minutes matter. The bank can block the card and may stop a payment. Reporting helps warn others.',
          si: 'මිනිත්තු වැදගත්. බැංකුවට කාඩ්පත අවහිර කර ගෙවීමක් නැවැත්විය හැක. වාර්තා කිරීම අනෙක් අයට අනතුරු ඇඟවීමට උදවු වේ.',
          ta: 'நிமிடங்கள் முக்கியம். வங்கி அட்டையை முடக்கி, கட்டணத்தை நிறுத்தக்கூடும். புகாரளிப்பது மற்றவர்களை எச்சரிக்க உதவும்.',
        },
      },
    ],
  },
  {
    id: 'links',
    badge: 'link_checker',
    questions: [
      {
        prompt: {
          en: 'Which link is most likely the real Bank of Ceylon website?',
          si: 'ලංකා බැංකුවේ සැබෑ වෙබ් අඩවිය වීමට වැඩිම ඉඩ ඇත්තේ කුමන සබැඳියද?',
          ta: 'இலங்கை வங்கியின் உண்மையான இணையதளமாக இருக்க அதிக வாய்ப்புள்ள இணைப்பு எது?',
        },
        options: [
          { en: 'https://www.boc.lk', si: 'https://www.boc.lk', ta: 'https://www.boc.lk' },
          {
            en: 'http://boc-lk-update.top',
            si: 'http://boc-lk-update.top',
            ta: 'http://boc-lk-update.top',
          },
          {
            en: 'https://boc.verify-account.xyz',
            si: 'https://boc.verify-account.xyz',
            ta: 'https://boc.verify-account.xyz',
          },
        ],
        answer: 0,
        why: {
          en: 'Look at the name just before the ending. In boc.verify-account.xyz the real site is verify-account.xyz, not BOC.',
          si: 'අවසානයට පෙර ඇති නම බලන්න. boc.verify-account.xyz හි සැබෑ අඩවිය verify-account.xyz මිස BOC නොවේ.',
          ta: 'முடிவுக்கு முன் உள்ள பெயரைப் பாருங்கள். boc.verify-account.xyz இல் உண்மையான தளம் verify-account.xyz, BOC அல்ல.',
        },
      },
      {
        prompt: {
          en: 'A short link like bit.ly/abc123 comes in an SMS about your parcel. What is the safest move?',
          si: 'ඔබේ පාර්සලය ගැන SMS එකක bit.ly/abc123 වැනි කෙටි සබැඳියක් ලැබේ. ආරක්ෂිතම පියවර කුමක්ද?',
          ta: 'உங்கள் பார்சல் பற்றிய SMS-இல் bit.ly/abc123 போன்ற குறுகிய இணைப்பு வருகிறது. மிகவும் பாதுகாப்பான வழி எது?',
        },
        options: [
          {
            en: 'Tap it to see where it goes',
            si: 'එය කොහෙට යනවාදැයි බැලීමට ඔබන්න',
            ta: 'அது எங்கே போகிறது என்று பார்க்கத் தட்டுங்கள்',
          },
          {
            en: "Don't tap it; check the parcel in the courier's own app or website",
            si: 'එය නොඔබා, කුරියර් සේවයේම යෙදුමෙන් හෝ වෙබ් අඩවියෙන් පාර්සලය බලන්න',
            ta: 'தட்டாதீர்கள்; கூரியரின் சொந்த ஆப் அல்லது இணையதளத்தில் பார்சலைச் சரிபாருங்கள்',
          },
          {
            en: 'Forward it to friends and ask them',
            si: 'එය මිතුරන්ට යවා ඔවුන්ගෙන් අසන්න',
            ta: 'நண்பர்களுக்கு அனுப்பி அவர்களிடம் கேளுங்கள்',
          },
        ],
        answer: 1,
        why: {
          en: 'Short links hide where they really go. Go to the company yourself instead of following the link.',
          si: 'කෙටි සබැඳි සැබවින්ම යන තැන සඟවයි. සබැඳිය අනුගමනය කරනවා වෙනුවට ඔබම සමාගමට යන්න.',
          ta: 'குறுகிய இணைப்புகள் உண்மையில் எங்கே போகின்றன என்பதை மறைக்கின்றன. இணைப்பைப் பின்தொடராமல் நீங்களே நிறுவனத்திடம் செல்லுங்கள்.',
        },
      },
      {
        prompt: {
          en: "A website looks exactly like your bank's and has a padlock (https). Is it safe?",
          si: 'වෙබ් අඩවියක් ඔබේ බැංකුවේ අඩවිය මෙන්ම පෙනෙන අතර අගුලක් (https) ඇත. එය ආරක්ෂිතද?',
          ta: 'ஒரு இணையதளம் உங்கள் வங்கியின் தளம் போலவே தெரிகிறது, பூட்டு (https) உள்ளது. அது பாதுகாப்பானதா?',
        },
        options: [
          {
            en: 'Yes, the padlock means it is the bank',
            si: 'ඔව්, අගුලෙන් අදහස් වන්නේ එය බැංකුව බවයි',
            ta: 'ஆம், பூட்டு என்றால் அது வங்கிதான்',
          },
          {
            en: 'Not necessarily: scam sites have padlocks too, so check the address',
            si: 'අනිවාර්යයෙන්ම නොවේ: වංචා අඩවිවලටද අගුල් ඇත, ඒ නිසා ලිපිනය පරීක්ෂා කරන්න',
            ta: 'அவசியமில்லை: மோசடித் தளங்களிலும் பூட்டு இருக்கும், எனவே முகவரியைச் சரிபாருங்கள்',
          },
          {
            en: 'Yes, if the logo looks right',
            si: 'ඔව්, ලාංඡනය නිවැරදි ලෙස පෙනේ නම්',
            ta: 'ஆம், லோகோ சரியாக இருந்தால்',
          },
        ],
        answer: 1,
        why: {
          en: 'The padlock only means the connection is private, not that the site is honest. Logos are easy to copy.',
          si: 'අගුලෙන් අදහස් වන්නේ සම්බන්ධතාව පෞද්ගලික බව පමණි, අඩවිය අවංක බව නොවේ. ලාංඡන පිටපත් කිරීම පහසුයි.',
          ta: 'பூட்டு என்றால் இணைப்பு தனிப்பட்டது என்று மட்டுமே பொருள், தளம் நேர்மையானது என்று அல்ல. லோகோக்களை எளிதில் நகலெடுக்கலாம்.',
        },
      },
      {
        prompt: {
          en: 'What is a good habit before tapping a link you are not sure about?',
          si: 'ඔබට විශ්වාස නැති සබැඳියක් ඔබන්නට පෙර හොඳ පුරුද්දක් කුමක්ද?',
          ta: 'உறுதியில்லாத இணைப்பைத் தட்டும் முன் நல்ல பழக்கம் எது?',
        },
        options: [
          {
            en: 'Check it with Baitless first',
            si: 'පළමුව Baitless සමඟ එය පරීක්ෂා කරන්න',
            ta: 'முதலில் Baitless மூலம் சரிபாருங்கள்',
          },
          {
            en: 'Tap it once to test it',
            si: 'පරීක්ෂා කිරීමට එක් වරක් ඔබන්න',
            ta: 'சோதிக்க ஒருமுறை தட்டுங்கள்',
          },
          {
            en: 'Enter fake details to test it',
            si: 'පරීක්ෂා කිරීමට ව්‍යාජ විස්තර ඇතුළත් කරන්න',
            ta: 'சோதிக்கப் போலி விவரங்களை உள்ளிடுங்கள்',
          },
        ],
        answer: 0,
        why: {
          en: 'Opening a scam link can already be enough to put you at risk. Check first, tap later.',
          si: 'වංචා සබැඳියක් විවෘත කිරීමම ඔබව අවදානමට ලක් කිරීමට ප්‍රමාණවත් විය හැක. පළමුව පරීක්ෂා කරන්න, පසුව ඔබන්න.',
          ta: 'மோசடி இணைப்பைத் திறப்பதே உங்களை ஆபத்தில் ஆழ்த்தப் போதுமானதாக இருக்கலாம். முதலில் சரிபாருங்கள், பிறகு தட்டுங்கள்.',
        },
      },
    ],
  },
  {
    id: 'offers',
    badge: 'offer_skeptic',
    questions: [
      {
        prompt: {
          en: 'You "won" a lottery you never entered, and you must pay a fee to claim it. This is…',
          si: 'ඔබ කිසිදා සහභාගී නොවූ ලොතරැයියක් "දිනා" ඇති අතර, එය ලබා ගැනීමට ගාස්තුවක් ගෙවිය යුතුය. මෙය…',
          ta: 'நீங்கள் பங்கேற்காத லாட்டரியில் "வென்றுள்ளீர்கள்", அதைப் பெறக் கட்டணம் செலுத்த வேண்டும். இது…',
        },
        options: [
          { en: 'A scam', si: 'වංචාවකි', ta: 'ஒரு மோசடி' },
          { en: 'A lucky day', si: 'වාසනාවන්ත දිනයකි', ta: 'அதிர்ஷ்டமான நாள்' },
          { en: 'A normal tax rule', si: 'සාමාන්‍ය බදු නීතියකි', ta: 'சாதாரண வரி விதி' },
        ],
        answer: 0,
        why: {
          en: 'Real prizes do not ask winners to pay first. The "fee" is the scam.',
          si: 'සැබෑ ත්‍යාග ජයග්‍රාහකයින්ගෙන් පළමුව මුදල් ඉල්ලන්නේ නැත. "ගාස්තුව" යනු වංචාවයි.',
          ta: 'உண்மையான பரிசுகள் வெற்றியாளர்களிடம் முதலில் பணம் கேட்பதில்லை. "கட்டணம்" தான் மோசடி.',
        },
      },
      {
        prompt: {
          en: 'A job pays a lot for liking videos, but first you must deposit money to "unlock" your earnings. What is it?',
          si: 'වීඩියෝ like කිරීමට රැකියාවක් විශාල මුදලක් ගෙවයි, නමුත් ඔබේ ඉපැයීම් "අගුළු හැරීමට" පළමුව මුදල් තැන්පත් කළ යුතුය. මෙය කුමක්ද?',
          ta: 'வீடியோக்களை லைக் செய்யும் வேலை அதிக சம்பளம் தருகிறது, ஆனால் வருமானத்தை "திறக்க" முதலில் பணம் வைப்பிலிட வேண்டும். இது என்ன?',
        },
        options: [
          { en: 'A real job', si: 'සැබෑ රැකියාවකි', ta: 'உண்மையான வேலை' },
          {
            en: 'A task scam: you will lose the deposit',
            si: 'කාර්ය වංචාවකි: ඔබට තැන්පතුව අහිමි වේ',
            ta: 'பணி மோசடி: வைப்புத்தொகையை இழப்பீர்கள்',
          },
          { en: 'A bank rule', si: 'බැංකු නීතියකි', ta: 'வங்கி விதி' },
        ],
        answer: 1,
        why: {
          en: 'Real employers pay you. They never ask you to pay them to get your salary.',
          si: 'සැබෑ සේවා යෝජකයින් ඔබට ගෙවයි. ඔබේ වැටුප ලබා ගැනීමට ඔවුන්ට ගෙවන්න කියා කිසිවිටෙක නොකියයි.',
          ta: 'உண்மையான முதலாளிகள் உங்களுக்குப் பணம் தருகிறார்கள். சம்பளம் பெற அவர்களுக்குப் பணம் செலுத்தச் சொல்வதில்லை.',
        },
      },
      {
        prompt: {
          en: 'A "courier" SMS asks for a small Rs. 350 fee by link. Why do scammers ask for small amounts?',
          si: '"කුරියර්" SMS එකක් සබැඳියක් හරහා රු. 350ක කුඩා ගාස්තුවක් ඉල්ලයි. වංචාකරුවන් කුඩා මුදල් ඉල්ලන්නේ ඇයි?',
          ta: '"கூரியர்" SMS இணைப்பு மூலம் ரூ. 350 சிறிய கட்டணம் கேட்கிறது. மோசடிக்காரர்கள் ஏன் சிறிய தொகைகளைக் கேட்கிறார்கள்?',
        },
        options: [
          {
            en: 'Because the parcel is cheap',
            si: 'පාර්සලය ලාභ නිසා',
            ta: 'பார்சல் மலிவானது என்பதால்',
          },
          {
            en: 'To get your card details, then they take much more',
            si: 'ඔබේ කාඩ්පත් විස්තර ලබා ගැනීමට, පසුව ඔවුන් ඊට වඩා බොහෝ මුදලක් ගනී',
            ta: 'உங்கள் அட்டை விவரங்களைப் பெற, பின்னர் அதிகமாக எடுப்பார்கள்',
          },
          {
            en: 'It is the customs law',
            si: 'එය රේගු නීතියයි',
            ta: 'அது சுங்கச் சட்டம்',
          },
        ],
        answer: 1,
        why: {
          en: 'A small fee feels harmless, so people pay without thinking. The real target is your card number and OTP.',
          si: 'කුඩා ගාස්තුවක් හානිකර නොවන බව දැනෙන නිසා මිනිසුන් නොසිතා ගෙවයි. සැබෑ ඉලක්කය ඔබේ කාඩ්පත් අංකය සහ OTP අංකයයි.',
          ta: 'சிறிய கட்டணம் பாதிப்பில்லாதது போல் தோன்றுவதால் மக்கள் யோசிக்காமல் செலுத்துகிறார்கள். உண்மையான இலக்கு உங்கள் அட்டை எண்ணும் OTP-யும்.',
        },
      },
      {
        prompt: {
          en: 'Someone on social media offers to double your money in a week. What do you do?',
          si: 'සමාජ මාධ්‍යයේ කෙනෙක් සතියකින් ඔබේ මුදල් දෙගුණ කරන්නට යෝජනා කරයි. ඔබ කරන්නේ කුමක්ද?',
          ta: 'சமூக ஊடகத்தில் ஒருவர் ஒரு வாரத்தில் உங்கள் பணத்தை இரட்டிப்பாக்குவதாகச் சொல்கிறார். நீங்கள் என்ன செய்வீர்கள்?',
        },
        options: [
          {
            en: 'Send a small amount to test it',
            si: 'පරීක්ෂා කිරීමට කුඩා මුදලක් යවන්න',
            ta: 'சோதிக்கச் சிறிய தொகையை அனுப்புங்கள்',
          },
          {
            en: 'Ignore it and report it: guaranteed returns are a scam',
            si: 'එය නොසලකා වාර්තා කරන්න: සහතික ප්‍රතිලාභ වංචාවකි',
            ta: 'புறக்கணித்துப் புகாரளியுங்கள்: உத்தரவாத வருமானம் மோசடி',
          },
          {
            en: 'Ask them for screenshots of other people’s profits',
            si: 'අනෙක් අයගේ ලාභවල තිර රූ ඔවුන්ගෙන් ඉල්ලන්න',
            ta: 'மற்றவர்களின் லாபத்தின் ஸ்கிரீன்ஷாட்களைக் கேளுங்கள்',
          },
        ],
        answer: 1,
        why: {
          en: 'Small "test" payouts and fake screenshots are how they build trust before taking a large amount.',
          si: 'විශාල මුදලක් ගැනීමට පෙර විශ්වාසය ගොඩනගන්නේ කුඩා "පරීක්ෂණ" ගෙවීම් සහ ව්‍යාජ තිර රූ මගිනි.',
          ta: 'பெரிய தொகையை எடுப்பதற்கு முன் நம்பிக்கையை உருவாக்க சிறிய "சோதனை" கொடுப்பனவுகளையும் போலி ஸ்கிரீன்ஷாட்களையும் பயன்படுத்துகிறார்கள்.',
        },
      },
    ],
  },
];

export const findQuiz = (id: string) => QUIZZES.find((q) => q.id === id);
