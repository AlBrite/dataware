export default {
    accepted: "Le champ :attribute doit être accepté.",
    date: "Le champ doit être une date valide.",
    url: "Le champ doit être une URL valide.",
    ip: "Le champ doit être une adresse IP valide.",
    uuid: "Le champ doit être un UUID valide.",
    integer: "Le champ doit être un entier.",
    alpha_spaces: "Le champ ne peut contenir que des lettres et des espaces.",
    timezone: "Le champ doit être un fuseau horaire valide.",
    credit_card: "Le champ doit être un numéro de carte de crédit valide.",
    phone: "Le champ doit être un numéro de téléphone valide.",
    contains: "Le champ doit contenir :value.",
    not_contains: "Le champ ne doit pas contenir :value.",
    min: {
        numeric: "La valeur doit être au moins :min.",
        string: "La longueur doit être d'au moins :min caractères.",
        array: "Le tableau doit avoir au moins :min éléments.",
        file: "La taille du fichier doit être d'au moins :min octets.",
        files: "Les tailles des fichiers doivent être d'au moins :min octets.",
    },
    unique: "La valeur doit être unique.",
    exists: "La valeur doit exister dans le jeu de données.",
    max: {
        numeric: "La valeur ne doit pas être supérieure à :max.",
        string: "La longueur ne doit pas dépasser :max caractères.",
        array: "Le tableau ne doit pas avoir plus de :max éléments.",
        file: "La taille du fichier ne doit pas dépasser :max octets.",
        files: "Les tailles des fichiers ne doivent pas dépasser :max octets.",
    },
    image: "Le champ :attribute doit être une image.",
    video: "Le champ :attribute doit être une vidéo.",
    audio: "Le champ :attribute doit être un fichier audio.",
    digits: "Le champ :attribute doit contenir :digits chiffres.",
    file: "Le champ :attribute doit être un fichier.",
    files: "Le champ :attribute doit contenir au moins un fichier.",
    filled: "Le champ :attribute doit avoir une valeur.",
    mimes: "Le champ :attribute doit être un fichier de type: :values.",
    mimetypes: "Le champ :attribute doit être un fichier de type: :values.",
    gt: {
        numeric: "La valeur doit être supérieure à :gt.",
        string: "La longueur doit être supérieure à :gt caractères.",
        array: "Le tableau doit avoir plus de :gt éléments.",
        file: "La taille du fichier doit être supérieure à :gt octets.",
        files: "Les tailles des fichiers doivent être supérieures à :gt octets.",
    },
    lt: {
        numeric: "La valeur doit être inférieure à :lt.",
        string: "La longueur doit être inférieure à :lt caractères.",
        array: "Le tableau doit avoir moins de :lt éléments.",
        file: "La taille du fichier doit être inférieure à :lt octets.",
        files: "Les tailles des fichiers doivent être inférieures à :lt octets.",
    },
    gte: {
        numeric: "La valeur doit être supérieure ou égale à :gte.",
        string: "La longueur doit être supérieure ou égale à :gte caractères.",
        array: "Le tableau doit avoir au moins :gte éléments.",
        file: "La taille du fichier doit être supérieure ou égale à :gte octets.",
        files: "Les tailles des fichiers doivent être supérieures ou égales à :gte octets.",
    },
    lte: {
        numeric: "La valeur doit être inférieure ou égale à :lte.",
        string: "La longueur doit être inférieure ou égale à :lte caractères.",
        array: "Le tableau doit avoir au plus :lte éléments.",
        file: "La taille du fichier doit être inférieure ou égale à :lte octets.",
        files: "Les tailles des fichiers doivent être inférieures ou égales à :lte octets.",
    },
    alpha: "Le champ ne peut contenir que des lettres.",
    alpha_: "Le champ ne peut contenir que des lettres et des tirets bas.",
    alpha_dash: "Le champ ne peut contenir que des lettres, des chiffres, des tirets et des tirets bas.",
    alpha_num: "Le champ ne peut contenir que des lettres et des chiffres.",
    boolean: "Le champ doit être une valeur booléenne.",
    confirmed: "La confirmation du champ ne correspond pas.",
    between: {
        numeric: "La valeur doit être entre :min et :max.",
                string: "La longueur doit être comprise entre :min et :max caractères.",
        array: "Le tableau doit contenir entre :min et :max éléments.",
        file: "La taille du fichier doit être comprise entre :min et :max octets.",
        files: "Les tailles des fichiers doivent être comprises entre :min et :max octets.",
    },
    password: {
        length: "Le mot de passe doit contenir au moins :length caractères.",
        letters: "Le mot de passe doit contenir au moins une lettre.",
        mixed: "Le mot de passe doit contenir au moins une majuscule et une minuscule.",
        numbers: "Le mot de passe doit contenir au moins un chiffre.",
        symbols: "Le mot de passe doit contenir au moins un symbole.",
        uncompromised: "Le mot de passe fourni a été trouvé dans une fuite de données. Veuillez en choisir un autre.",
    },
    email: "Le champ doit être une adresse e-mail valide.",
    in_array: "La valeur du champ doit être l'une des suivantes : :values.",
    in: "La valeur du champ doit être l'une des suivantes : :values.",
    regex: "Le format du champ est invalide.",
    same: "Le champ doit correspondre au champ :other.",
    ends_with: "Le champ doit se terminer par l'une des valeurs suivantes : :values.",
    starts_with: "Le champ doit commencer par l'une des valeurs suivantes : :values.",
    not_in: "La valeur du champ ne doit pas être l'une des suivantes : :values.",
    required_if: "Le champ est requis si :other est égal à :value.",
    required: "Le champ est requis.",
    uppercase: "Le champ ne peut contenir que des lettres majuscules.",
    lowercase: "Le champ ne peut contenir que des lettres minuscules.",
    url: "Le champ doit être une URL valide.",
    uuid: "Le champ doit être un UUID valide.",
    range: "La valeur doit être comprise entre :min et :max.",
    multiple_of: "La valeur doit être un multiple de :number.",
    active_url: "Le champ :attribute n'est pas une URL valide.",
    numeric: "Le champ :attribute doit être un nombre.",
    pattern: "Le modèle attendu est :pattern.",
    required_unless: "Le champ :attribute est requis à moins que :other ne soit dans :values.",
    required_with: "Le champ :attribute est requis lorsque :values est présent.",
    required_with_all: "Le champ :attribute est requis lorsque :values sont présents.",
    required_without: "Le champ :attribute est requis lorsque :values est absent.",
    required_without_all: "Le champ :attribute est requis lorsque aucun des :values n'est présent.",
    after: "Le champ :attribute doit être une date postérieure à :date.",
    before: "Le champ :attribute doit être une date antérieure à :date.",
};