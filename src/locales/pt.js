export default {
    accepted: "O campo :attribute deve ser aceito.",
    date: "O campo deve ser uma data válida.",
    url: "O campo deve ser uma URL válida.",
    ip: "O campo deve ser um endereço IP válido.",
    uuid: "O campo deve ser um UUID válido.",
    integer: "O campo deve ser um número inteiro.",
    alpha_spaces: "O campo só pode conter letras e espaços.",
    timezone: "O campo deve ser um fuso horário válido.",
    credit_card: "O campo deve ser um número de cartão de crédito válido.",
    phone: "O campo deve ser um número de telefone válido.",
    contains: "O campo deve conter :value.",
    not_contains: "O campo não deve conter :value.",
    min: {
        numeric: "O valor deve ser no mínimo :min.",
        string: "O texto deve ter no mínimo :min caracteres.",
        array: "O array deve ter no mínimo :min itens.",
        file: "O arquivo deve ter no mínimo :min bytes.",
        files: "Os arquivos devem ter no mínimo :min bytes.",
    },
    unique: "O valor deve ser único.",
    exists: "O valor deve existir no conjunto de dados.",
    max: {
        numeric: "O valor não pode ser maior que :max.",
        string: "O texto não pode ter mais que :max caracteres.",
        array: "O array não pode ter mais que :max itens.",
        file: "O arquivo não pode ser maior que :max bytes.",
        files: "Os arquivos não podem ser maiores que :max bytes.",
    },
    image: "O campo :attribute deve ser uma imagem.",
    video: "O campo :attribute deve ser um vídeo.",
    audio: "O campo :attribute deve ser um áudio.",
    digits: "O campo :attribute deve ter :digits dígitos.",
    file: "O campo :attribute deve ser um arquivo.",
    files: "É necessário selecionar pelo menos um arquivo no campo :attribute.",
    filled: "O campo :attribute deve ter um valor.",
    mimes: "O campo :attribute deve ser um arquivo do tipo: :values.",
    mimetypes: "O campo :attribute deve ser um arquivo do tipo: :values.",
    gt: {
        numeric: "O valor deve ser maior que :gt.",
        string: "O texto deve ter mais de :gt caracteres.",
        array: "O array deve ter mais de :gt itens.",
        file: "O arquivo deve ter mais de :gt bytes.",
        files: "Os arquivos devem ter mais de :gt bytes.",
    },
    lt: {
        numeric: "O valor deve ser menor que :lt.",
        string: "O texto deve ter menos de :lt caracteres.",
        array: "O array deve ter menos de :lt itens.",
        file: "O arquivo deve ter menos de :lt bytes.",
        files: "Os arquivos devem ter menos de :lt bytes.",
    },
    gte: {
        numeric: "O valor deve ser maior ou igual a :gte.",
        string: "O texto deve ter no mínimo :gte caracteres.",
        array: "O array deve ter no mínimo :gte itens.",
        file: "O arquivo deve ter no mínimo :gte bytes.",
        files: "Os arquivos devem ter no mínimo :gte bytes.",
    },
    lte: {
        numeric: "O valor deve ser menor ou igual a :lte.",
        string: "O texto deve ter no máximo :lte caracteres.",
        array: "O array deve ter no máximo :lte itens.",
        file: "O arquivo deve ter no máximo :lte bytes.",
        files: "Os arquivos devem ter no máximo :lte bytes.",
    },
    alpha: "O campo só pode conter letras.",
    alpha_: "O campo só pode conter letras e sublinhados.",
    alpha_dash: "O campo só pode conter letras, números, traços e sublinhados.",
    alpha_num: "O campo só pode conter letras e números.",
    boolean: "O campo deve ser verdadeiro ou falso.",
    confirmed: "A confirmação do campo não confere.",
    between: {
        numeric: "O valor deve estar entre :min e :max.",
        string: "O texto deve ter entre :min e :max caracteres.",
        array: "O array deve ter entre :min e :max itens.",
        file: "O arquivo deve ter entre :min e :max bytes.",
        files: "Os arquivos devem ter entre :min e :max bytes.",
    },
    password: {
        length: "A senha deve ter no mínimo :length caracteres.",
        letters: "A senha deve conter pelo menos uma letra.",
        mixed: "A senha deve conter pelo menos uma letra maiúscula e uma minúscula.",
        numbers: "A senha deve conter pelo menos um número.",
        symbols: "A senha deve conter pelo menos um símbolo.",
        uncompromised: "A senha escolhida foi encontrada em um vazamento de dados. Escolha uma senha diferente.",
    },
    email: "O campo deve ser um endereço de e-mail válido.",
    in_array: "O valor do campo deve ser um dos seguintes: :values.",
    in: "O valor do campo deve ser um dos seguintes: :values.",
    regex: "O formato do campo é inválido.",
    same: "O campo deve corresponder ao campo :other.",
    ends_with: "O campo deve terminar com um dos seguintes: :values.",
    starts_with: "O campo deve começar com um dos seguintes: :values.",
    not_in: "O valor do campo não deve ser um dos seguintes: :values.",
    required_if: "O campo é obrigatório quando :other é :value.",
    required: "O campo é obrigatório.",
    uppercase: "O campo deve estar em letras maiúsculas.",
    lowercase: "O campo deve estar em letras minúsculas.",
    url: "O campo deve ser uma URL válida.",
    uuid: "O campo deve ser um UUID válido.",
    range: "O valor deve estar entre :min e :max.",
    multiple_of: "O valor deve ser um múltiplo de :number.",
    active_url: "O campo :attribute não é uma URL válida.",
    numeric: "O campo :attribute deve ser um número.",
    pattern: "O formato esperado é :pattern",
    required_unless: "O campo :attribute é obrigatório, a menos que :other esteja em :values.",
    required_with: "O campo :attribute é obrigatório quando :values está presente.",
    required_with_all: "O campo :attribute é obrigatório quando :values estão presentes.",
    required_without: "O campo :attribute é obrigatório quando :values não está presente.",
    required_without_all: "O campo :attribute é obrigatório quando nenhum de :values estão presentes.",
    after: 'O campo :attribute deve ser uma data após :date.',
    before: 'O campo :attribute deve ser uma data antes de :date.',
};