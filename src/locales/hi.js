export default {
    accepted: "इस फ़ील्ड को स्वीकार करना आवश्यक है।",
    date: "फ़ील्ड एक मान्य दिनांक होना चाहिए।",
    url: "फ़ील्ड एक मान्य यूआरएल होना चाहिए।",
    ip: "फ़ील्ड एक मान्य आईपी पता होना चाहिए।",
    uuid: "फ़ील्ड एक मान्य यूयूआईडी होना चाहिए।",
    integer: "फ़ील्ड एक पूर्णांक होना चाहिए।",
    alpha_spaces: "फ़ील्ड में केवल अक्षर और स्पेस हो सकते हैं।",
    timezone: "फ़ील्ड एक मान्य समयक्षेत्र होना चाहिए।",
    credit_card: "फ़ील्ड एक मान्य क्रेडिट कार्ड नंबर होना चाहिए।",
    phone: "फ़ील्ड एक मान्य फ़ोन नंबर होना चाहिए।",
    contains: "फ़ील्ड में :value शामिल होना चाहिए।",
    not_contains: "फ़ील्ड में :value शामिल नहीं होना चाहिए।",
    min: {
        numeric: "मान कम से कम :min होना चाहिए।",
        string: "लंबाई कम से कम :min वर्ण होनी चाहिए।",
        array: "एरे में कम से कम :min आइटम होने चाहिए।",
        file: "फाइल का आकार कम से कम :min बाइट्स होना चाहिए।",
        files: "फाइलों का आकार कम से कम :min बाइट्स होना चाहिए।",
    },
    unique: "मान अद्वितीय होना चाहिए।",
    exists: "मान डेटासेट में मौजूद होना चाहिए।",
    max: {
        numeric: "मान :max से अधिक नहीं होना चाहिए।",
        string: "लंबाई :max वर्णों से अधिक नहीं होनी चाहिए।",
        array: "एरे में :max आइटम से अधिक नहीं हो सकते।",
        file: "फाइल का आकार :max बाइट्स से अधिक नहीं होना चाहिए।",
        files: "फाइलों का आकार :max बाइट्स से अधिक नहीं होना चाहिए।",
    },
    image: ":attribute एक इमेज होनी चाहिए।",
    video: ":attribute एक वीडियो होना चाहिए।",
    audio: ":attribute एक ऑडियो होना चाहिए।",
    digits: ":attribute :digits अंक होना चाहिए।",
    file: ":attribute एक फाइल होनी चाहिए।",
    files: ":attribute में कम से कम एक फाइल का चयन आवश्यक है।",
    filled: ":attribute में एक मान होना चाहिए।",
    mimes: ":attribute फ़ाइल प्रकार :values में से एक होनी चाहिए।",
    mimetypes: ":attribute फ़ाइल प्रकार :values में से एक होनी चाहिए।",
    gt: {
        numeric: "मान :gt से बड़ा होना चाहिए।",
        string: "लंबाई :gt वर्णों से अधिक होनी चाहिए।",
        array: "एरे में :gt आइटम से अधिक होने चाहिए।",
        file: "फाइल का आकार :gt बाइट्स से बड़ा होना चाहिए।",
        files: "फाइलों का आकार :gt बाइट्स से बड़ा होना चाहिए।",
    },
    lt: {
        numeric: "मान :lt से कम होना चाहिए।",
        string: "लंबाई :lt वर्णों से कम होनी चाहिए।",
        array: "एरे में :lt आइटम से कम होने चाहिए।",
        file: "फाइल का आकार :lt बाइट्स से कम होना चाहिए।",
        files: "फाइलों का आकार :lt बाइट्स से कम होना चाहिए।",
    },
    gte: {
        numeric: "मान :gte से अधिक या बराबर होना चाहिए।",
        string: "लंबाई :gte वर्णों से अधिक या बराबर होनी चाहिए।",
        array: "एरे में कम से कम :gte आइटम होने चाहिए।",
        file: "फाइल का आकार :gte बाइट्स से अधिक या बराबर होना चाहिए।",
        files: "फाइलों का आकार :gte बाइट्स से अधिक या बराबर होना चाहिए।",
    },
    lte: {
        numeric: "मान :lte से कम या बराबर होना चाहिए।",
        string: "लंबाई :lte वर्णों से कम या बराबर होनी चाहिए।",
        array: "एरे में अधिकतम :lte आइटम होने चाहिए।",
        file: "फाइल का आकार :lte बाइट्स से कम या बराबर होना चाहिए।",
        files: "फाइलों का आकार :lte बाइट्स से कम या बराबर होना चाहिए।",
    },
    alpha: "फ़ील्ड में केवल अक्षर हो सकते हैं।",
    alpha_: "फ़ील्ड में केवल अक्षर और अंडरस्कोर हो सकते हैं।",
    alpha_dash: "फ़ील्ड में केवल अक्षर, संख्याएँ, डैश और अंडरस्कोर हो सकते हैं।",
    alpha_num: "फ़ील्ड में केवल अक्षर और संख्याएँ हो सकती हैं।",
    boolean: "फ़ील्ड एक बूलियन मान होना चाहिए।",
    confirmed: "फ़ील्ड की पुष्टि मेल नहीं खाती।",
    between: {
        numeric: "मान :min और :max के बीच होना चाहिए।",
        string: "लंबाई :min और :max वर्णों के बीच होनी चाहिए।",
        array: "एरे में :min और :max आइटम होने चाहिए।",
        file: "फाइल का आकार :min और :max बाइट्स के बीच होना चाहिए।",
        files: "फाइलों का आकार :min और :max बाइट्स के बीच होना चाहिए।",
    },
    password: {
        length: "पासवर्ड कम से कम :length वर्ण लंबा होना चाहिए।",
        letters: "पासवर्ड में कम से कम एक अक्षर होना चाहिए।",
        mixed: "पासवर्ड में कम से कम एक बड़ा और एक छोटा अक्षर होना चाहिए।",
        numbers: "पासवर्ड में कम से कम एक संख्या होनी चाहिए।",
        symbols: "पासवर्ड में कम से कम एक प्रतीक होना चाहिए।",
        uncompromised: "दिया गया पासवर्ड डेटा लीक में पाया गया है। कृपया दूसरा पासवर्ड चुनें।",
    },
    email: "फ़ील्ड एक मान्य ई-मेल पता होना चाहिए।",
    in_array: "फ़ील्ड का मान निम्न में से एक होना चाहिए: :values।",
    in: "फ़ील्ड का मान निम्न में से एक होना चाहिए: :values।",
    regex: "फ़ील्ड का प्रारूप अमान्य है।",
    same: "फ़ील्ड को :other फ़ील्ड से मेल खाना चाहिए।",
    ends_with: "फ़ील्ड निम्न में से एक के साथ समाप्त होना चाहिए: :values।",
    starts_with: "फ़ील्ड निम्न में से एक से शुरू होना चाहिए: :values।",
    not_in: "फ़ील्ड का मान निम्न में से एक नहीं होना चाहिए: :values।",
    required_if: "यह फ़ील्ड आवश्यक है जब :other :value हो।",
    required: "यह फ़ील्ड आवश्यक है।",
    uppercase: "फ़ील्ड में केवल बड़े अक्षर होने चाहिए।",
    lowercase: "फ़ील्ड में केवल छोटे अक्षर होने चाहिए।",
    range: "मान :min और :max के बीच होना चाहिए।",
    multiple_of: "मान :number का गुणक होना चाहिए।",
    active_url: ":attribute एक मान्य यूआरएल नहीं है।",
    numeric: ":attribute एक संख्या होनी चाहिए।",
    pattern: "अपेक्षित पैटर्न :pattern है।",
    required_unless: ":attribute आवश्यक है जब तक :other में :values न हों।",
    required_with: ":attribute आवश्यक है जब :values मौजूद हो।",
    required_with_all: ":attribute आवश्यक है जब :values मौजूद हों।",
    required_without: ":attribute आवश्यक है जब :values मौजूद न हो।",
    required_without_all: ":attribute आवश्यक है जब :values में से कोई भी मौजूद न हो।",
    after: ":attribute की तिथि :date के बाद होनी चाहिए।",
    before: ":attribute की तिथि :date से पहले होनी चाहिए।",
};