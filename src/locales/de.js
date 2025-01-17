export default {
    accepted: "Das Feld :attribute muss akzeptiert werden.",
    date: "Das Feld muss ein gültiges Datum sein.",
    url: "Das Feld muss eine gültige URL sein.",
    ip: "Das Feld muss eine gültige IP-Adresse sein.",
    uuid: "Das Feld muss eine gültige UUID sein.",
    integer: "Das Feld muss eine ganze Zahl sein.",
    alpha_spaces: "Das Feld darf nur Buchstaben und Leerzeichen enthalten.",
    timezone: "Das Feld muss eine gültige Zeitzone sein.",
    credit_card: "Das Feld muss eine gültige Kreditkartennummer sein.",
    phone: "Das Feld muss eine gültige Telefonnummer sein.",
    contains: "Das Feld muss :value enthalten.",
    not_contains: "Das Feld darf :value nicht enthalten.",
    min: {
        numeric: "Der Wert muss mindestens :min sein.",
        string: "Der Text muss mindestens :min Zeichen lang sein.",
        array: "Das Array muss mindestens :min Elemente enthalten.",
        file: "Die Datei muss mindestens :min Bytes groß sein.",
        files: "Die Dateien müssen mindestens :min Bytes groß sein.",
    },
    unique: "Der Wert muss eindeutig sein.",
    exists: "Der Wert muss im Datensatz vorhanden sein.",
    max: {
        numeric: "Der Wert darf nicht größer als :max sein.",
        string: "Der Text darf nicht länger als :max Zeichen sein.",
        array: "Das Array darf nicht mehr als :max Elemente enthalten.",
        file: "Die Datei darf nicht größer als :max Bytes sein.",
        files: "Die Dateien dürfen nicht größer als :max Bytes sein.",
    },
    image: "Das Feld :attribute muss ein Bild sein.",
    video: "Das Feld :attribute muss ein Video sein.",
    audio: "Das Feld :attribute muss eine Audiodatei sein.",
    digits: "Das Feld :attribute muss :digits Ziffern haben.",
    file: "Das Feld :attribute muss eine Datei sein.",
    files: "Das Feld :attribute erfordert mindestens eine Datei.",
    filled: "Das Feld :attribute muss einen Wert enthalten.",
    mimes: "Das Feld :attribute muss eine Datei des Typs sein: :values.",
    mimetypes: "Das Feld :attribute muss eine Datei des Typs sein: :values.",
    gt: {
        numeric: "Der Wert muss größer als :gt sein.",
        string: "Der Text muss länger als :gt Zeichen sein.",
        array: "Das Array muss mehr als :gt Elemente enthalten.",
        file: "Die Datei muss größer als :gt Bytes sein.",
        files: "Die Dateien müssen größer als :gt Bytes sein.",
    },
    lt: {
        numeric: "Der Wert muss kleiner als :lt sein.",
        string: "Der Text muss kürzer als :lt Zeichen sein.",
        array: "Das Array muss weniger als :lt Elemente enthalten.",
        file: "Die Datei muss kleiner als :lt Bytes sein.",
        files: "Die Dateien müssen kleiner als :lt Bytes sein.",
    },
    gte: {
        numeric: "Der Wert muss mindestens :gte sein.",
        string: "Der Text muss mindestens :gte Zeichen lang sein.",
        array: "Das Array muss mindestens :gte Elemente enthalten.",
        file: "Die Datei muss mindestens :gte Bytes groß sein.",
        files: "Die Dateien müssen mindestens :gte Bytes groß sein.",
    },
    lte: {
        numeric: "Der Wert darf höchstens :lte sein.",
        string: "Der Text darf höchstens :lte Zeichen lang sein.",
        array: "Das Array darf höchstens :lte Elemente enthalten.",
        file: "Die Datei darf höchstens :lte Bytes groß sein.",
        files: "Die Dateien dürfen höchstens :lte Bytes groß sein.",
    },
    alpha: "Das Feld darf nur Buchstaben enthalten.",
    alpha_: "Das Feld darf nur Buchstaben und Unterstriche enthalten.",
    alpha_dash: "Das Feld darf nur Buchstaben, Zahlen, Bindestriche und Unterstriche enthalten.",
    alpha_num: "Das Feld darf nur Buchstaben und Zahlen enthalten.",
    boolean: "Das Feld muss ein boolescher Wert sein.",
    confirmed: "Die Bestätigung des Feldes stimmt nicht überein.",
    between: {
        numeric: "Der Wert muss zwischen :min und :max liegen.",
        string: "Der Text muss zwischen :min und :max Zeichen lang sein.",
        array: "Das Array muss zwischen :min und :max Elemente enthalten.",
        file: "Die Datei muss zwischen :min und :max Bytes groß sein.",
        files: "Die Dateien müssen zwischen :min und :max Bytes groß sein.",
    },
    password: {
        length: "Das Passwort muss mindestens :length Zeichen lang sein.",
        letters: "Das Passwort muss mindestens einen Buchstaben enthalten.",
        mixed: "Das Passwort muss mindestens einen Groß- und einen Kleinbuchstaben enthalten.",
        numbers: "Das Passwort muss mindestens eine Zahl enthalten.",
        symbols: "Das Passwort muss mindestens ein Symbol enthalten.",
        uncompromised: "Das angegebene Passwort wurde in einer Datenpanne gefunden. Bitte wählen Sie ein anderes Passwort.",
    },
    email: "Das Feld muss eine gültige E-Mail-Adresse sein.",
    in_array: "Der Wert des Feldes muss einer der folgenden sein: :values.",
    in: "Der Wert des Feldes muss einer der folgenden sein: :values.",
    regex: "Das Format des Feldes ist ungültig.",
    same: "Das Feld muss mit dem Feld :other übereinstimmen.",
    ends_with: "Das Feld muss mit einem der folgenden enden: :values.",
    starts_with: "Das Feld muss mit einem der folgenden beginnen: :values.",
    not_in: "Der Wert des Feldes darf keiner der folgenden sein: :values.",
    required_if: "Das Feld ist erforderlich, wenn :other :value ist.",
    required: "Das Feld ist erforderlich.",
    uppercase: "Das Feld darf nur Großbuchstaben enthalten.",
    lowercase: "Das Feld darf nur Kleinbuchstaben enthalten.",
    url: "Das Feld muss eine gültige URL sein.",
    uuid: "Das Feld muss eine gültige UUID sein.",
    range: "Der Wert muss zwischen :min und :max liegen.",
    multiple_of: "Der Wert muss ein Vielfaches von :number sein.",
    active_url: "Das Feld :attribute ist keine gültige URL.",
    numeric: "Das Feld :attribute muss eine Zahl sein.",
    pattern: "Das erwartete Muster ist :pattern.",
    required_unless: "Das Feld :attribute ist erforderlich, es sei denn, :other befindet sich in :values.",
    required_with: "Das Feld :attribute ist erforderlich, wenn :values vorhanden ist.",
    required_with_all: "Das Feld :attribute ist erforderlich, wenn :values vorhanden sind.",
    required_without: "Das Feld :attribute ist erforderlich, wenn :values nicht vorhanden ist.",
    required_without_all: "Das Feld :attribute ist erforderlich, wenn keines der :values vorhanden ist.",
    after: "Das Feld :attribute muss ein Datum nach :date sein.",
    before: "Das Feld :attribute muss ein Datum vor :date sein.",
};