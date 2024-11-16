import { ValidationError, KnownError } from "../exceptions";
import config from '../config';
import utils from "../utils";

const _keys = Object.keys(config.locales);
const system_locale = _keys.length > 0 ? _keys[0] : 'en';

const registers = {
    types: [
        "blob",
        "date",
        "datetime",
        "array",
        "object",
        "numeric",
        "integer",
        "string",
        "file",
        "files",
        "boolean",
        "url",
        "ip",
        "email",
        "uuid"
    ],
    stabilizers: ["trim", "capitalize", "format_date"],
    fillables: [
        "if_empty",
        "fill",
        "fillable",
        "nullable",
        "required",
        "required_if",
        "required_unless",
        "required_with",
        "required_with_all",
        "required_without",
        "required_without_all",
    ],
};


export class FormGuard {
    _hasFile = false;
    static locale_keys = _keys;
    static locale = system_locale;
    static _translations = {};
    static _fallback_messages;
    static _debug = false;
    static user_defined_messages = {};

    static registers = registers;

    constructor(data, rules = null, messages = {}, attributes = {}) {
        FormGuard.user_defined_messages;
        console.log('testing');
        this.setAttributes(attributes);
        this._errors = {};
        this._hasFile = false;
        FormGuard._translations = config.locales;
        FormGuard._debug = config.debug;
        
        this.loadFallbackMessages();
        this._file_patterns = utils.isPlainObject(config.file_patterns) ? config.file_patterns : {};
        FormGuard.user_defined_messages = {};

        this._skips = [];
        this._rules = {};

        this._data = { ...data };

        FormGuard.add(config.customRules);
        FormGuard.setMessages(messages);

        this.parseRules(rules);
    }

    init() {
        FormGuard.registers = {
            types: [
                "blob",
                "date",
                "datetime",
                "array",
                "object",
                "numeric",
                "integer",
                "string",
                "file",
                "files",
                "boolean",
            ],
            stabilizers: ["trim", "capitalize", "format_date"],
            fillables: [
                "if_empty",
                "fill",
                "fillable",
                "nullable",
                "required",
                "required_if",
                "required_unless",
                "required_with",
                "required_with_all",
                "required_without",
                "required_without_all",
            ],
        };
    

    }

    static log(type, ...args) {
        if (this._debug && console[type]) {
            console[type](...args);
        }
    }

    static setSystemMessages(messages, name) {
        this._translations = utils.castObject(this._translations);

        utils.forEach(this._translations, (messages, locale) => {
            delete this._translations[locale][name];
        })

        utils.forEach(messages, (message, key) => {
            const [message_key, locale] = this.getKeys(key);
            this._translations[locale] = {
                ...utils.castObject(this._translations[locale]),
                [message_key]:message
            }
        });
        this._fallback_messages = this._translations[FormGuard.locale]
    }

    static setMessages(messages) {

        this.user_defined_messages = utils.castObject(this.user_defined_messages);

        if (!utils.isPlainObject(messages)) {
            throw new ValidationError(
                `Default Messages must be an object, but ${
                    messages === null ? "NULL" : typeof messages
                } was provided`
            );
        }


        utils.forEach(messages, (default_message, attr) => {
            const [message_key, locale] = this.getKeys(attr);

            const fallback = message_key + "$" + system_locale;

            if (locale !== system_locale) {
                if (
                    utils.isUndefined(messages[fallback]) &&
                    utils.isUndefined(messages[message_key])
                ) {
                    const example = {
                        ...messages,
                        [message_key]: "This is an error Message",
                    };
                    this.log('warn', 
                        `Default message for "${message_key}" is missing. Defining message for ${message_key} will serve as fallback in case the user language is not available. So ensure it's written in english.\n\nExample:\n${JSON.stringify(
                            example
                        )}`
                    );
                }
            }
            if (
                !utils.isUndefined(default_message) &&
                !utils.isString(default_message)
            ) {
                throw new ValidationError(
                    `Default Message type for ${attr} is ${
                        default_message === null
                            ? "NULL"
                            : typeof default_message
                    }. But String was expected`
                );
            }

            this.user_defined_messages[locale] = {
                ...(utils.isPlainObject(this.user_defined_messages[locale])
                    ? this.user_defined_messages[locale]
                    : {}),
                [message_key]: default_message,
            };
        });
    }

    //name, password, letters
    //obj, attribute, rule, type
    //namePasswordLetters
    //namePasswordSymbols
    //namePassword

    getUserMessages({attribute, rule, type}, holder, defaultValue) {
        const holderArgs = [attribute, rule, holder].filter(arg => utils.isString(arg));
        const ruleArgs = [attribute, rule];

        const getValue = (key) => {
            const user_defined_messages = FormGuard.user_defined_messages[FormGuard.locale] || FormGuard.user_defined_messages.en;
            return user_defined_messages?.[key];
        };

        defaultValue = defaultValue||"validation."+rule;

        const matches = [
            this.snakeCase(...holderArgs),
            this.snakeCase(...ruleArgs),
            holderArgs.join('.'),
            ruleArgs.join('.')
        ]
        .map(result => getValue(result))
        .find(data => utils.isString(data));
        

        if (matches) {
            return matches;
        }
        else {
            const fallback = utils.objectGet(FormGuard._fallback_messages, rule);
            if (utils.isString(fallback)) {
                return fallback;
            }
            else if (utils.isPlainObject(fallback)) {
                return fallback[holder || type] || defaultValue;
            }

            return defaultValue;
        }
        
    }


    static setLocale(locale) { 
        FormGuard.locale = locale;
    }

   

    data(obj) {
        if (utils.isPlainObject(obj)) {
            this._data = obj;
        }
        return this;
    }

    all() {
        this._errors = {};
        this._skips = [];

        return new Promise(async (resolve, reject) => {
            for (const [attribute, data] of Object.entries(this._rules)) {
                for (const item of data) {
                    const { args, callback } = item;
                    await callback(...args);
                }
            }
            const errorKeys = Object.keys(this._errors);

            if (errorKeys.length > 0) {
                return reject(this._errors);
            }

            const entries = Object.entries(this._data).filter(
                ([key]) => !errorKeys.includes(key)
            );
            const validated = Object.fromEntries(entries);
            const formData = this.convertDataToFormData(validated);

            resolve({ validated, formData });
        });
    }
    clearAll() {
        this._errors = {};
    }

    only(attributes) {
        if (utils.isString(attributes)) {
            attributes = [attributes];
        }

        return new Promise(async (resolve, reject) => {
            let errors = {};
            let attrs = [];

            if (utils.isArray(attributes)) {
                attrs = attributes;
                const rules = Object.entries(this._rules).filter(
                    ([key]) => attrs.includes(key)
                );

                for (const [attribute, data] of rules) {
                    // reset errors
                    delete this._errors[attribute];

                    for (const item of data) {
                        const { args, callback } = item;
                        await callback(...args);
                    }
                }

                errors = Object.fromEntries(
                    Object.entries(this._errors).filter(([key]) =>
                        attrs.includes(key)
                    )
                );
            } else if (utils.isPlainObject(attributes)) {
                attrs = Object.keys(attributes);
                const rules = Object.entries(this._rules).filter(
                    ([key]) => attrs.includes(key)
                );

                for (const [attribute, data] of rules) {
                    delete this._errors[attribute];
                    if (attribute in attributes) {
                        this._data[attribute] = attributes[attribute];
                    }

                    for (const item of data) {
                        await item.callback(...item.args);
                    }
                }

                errors = Object.fromEntries(
                    Object.entries(this._errors).filter(([key]) =>
                        attrs.includes(key)
                    )
                );
            }

            if (Object.keys(errors).length > 0) {
                return reject(this._errors);
            }

            const entries = Object.entries(this._data).filter(([key]) =>
                attrs.includes(key)
            );
            const validated = Object.fromEntries(entries);
            const formData = this.convertDataToFormData(validated);

            resolve({ validated, formData });
        });
    }


    validate(attributes) {
        attributes = attributes || this.getData();
        
        if (utils.isString(attributes)) {
            attributes = {[attributes]:this._data[attributes]}
        }
            else if (!utils.isPlainObject(attributes)) {
                throw new ValidationError(
                    `Data should be an object`
                );
            }

            return new Promise(async (resolve, reject) => {
            try {
                let errors = {};
                let attrs = [];

                if (utils.isArray(attributes)) {
                    attrs = attributes;
                    const rules = Object.entries(this._rules).filter(
                        ([key]) => attrs.includes(key)
                    );
                    for (const [attribute, data] of rules) {
                        // reset errors
                        delete this._errors[attribute];

                        
                        for (const item of data) {
                            const { args, callback } = item;
                            await callback(...args);
                        }
                    }

                    errors = Object.fromEntries(
                        Object.entries(this._errors).filter(([key]) =>
                            attrs.includes(key)
                        )
                    );
                } else if (utils.isPlainObject(attributes)) {
                    attrs = Object.keys(attributes);
                    const rules = Object.entries(this._rules).filter(
                        ([key]) => attrs.includes(key)
                    );

                    for (const [attribute, data] of rules) {
                        delete this._errors[attribute];
                        if (attribute in attributes) {
                            this._data[attribute] = attributes[attribute];
                        }


                        for (const item of data) {
                            await item.callback(...item.args);
                        }
                    }

                    errors = Object.fromEntries(
                        Object.entries(this._errors).filter(([key]) =>
                            attrs.includes(key)
                        )
                    );
                }

                if (Object.keys(errors).length > 0) {
                    return reject(this._errors);
                }

                const entries = Object.entries(this._data).filter(([key]) =>
                    attrs.includes(key)
                );
                const validated = Object.fromEntries(entries);
                const formData = this.convertDataToFormData(validated);

                resolve({ validated, formData });
                } catch(e) {
                    FormGuard.log('error', e);

                    let errors = this._errors;
                    if (utils.isEmpty(errors)) {
                        errors = {error:'Failed to validate'};
                    }
                    
                    reject(errors);
                }
            });
    }

    static async make(data, rules = null, messages = {}, attributes = {}) {
        const validator = new FormGuard(data, rules, messages, attributes);

        return validator.validate();
    }

    successfully__passed__validation(obj) {
        if (this.skippedValidation(obj)) return;
        this.clearErrorMessage(obj);
        FormGuard.log('info', 'Successfully validated '+obj.attribute)
    }

    /**
     * TYPE RULES (types)
     *
     * @method blob
     * @method date
     * @method datetime
     * @method array
     * @method object
     * @method numeric
     * @method integer
     * @method string
     * @method file
     * @method files
     * @method boolean
     * @method email
     * @method uuid 
     * @method ip 
     * @method url
     *
     */

    async blob(obj) {
        const data = this.getData(obj);

        this.clearIF(utils.isBlob(data), obj)
    }

    async date(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;
        const date = new Date(data);
        const validated = !isNaN(date.getFullYear());

        if (validated) {
            this.setData(obj, utils.format_date(date, 'yyyy-mm-dd'));
        }

        this.clearIF(validated, obj);

    }

    async datetime(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;
        const date = new Date(data);
        const validated = !isNaN(date.getSeconds());

        if (validated) {
            this.setData(obj, utils.format_date(date, 'yyyy-mm-dd H:i:s'));
        }

        this.clearIF(validated, obj);

    }

    async time(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;
        const date = new Date(data);
        const validated = !isNaN(date.getHours());

        if (validated) {
            this.setData(obj, utils.format_date(date, 'H:i:s'));
        }

        this.clearIF(validated, obj);

    }


    async timestamp(obj) {
        let validated = false;
        try {
            const data = this.getData(obj);
            const time = Date.parse(data);
            validated = !isNaN(time);

            if (validated) {
                return this.setData(obj, time);
            }

        } catch(e) {};

        this.clearIF(
            validated,
            obj
        );
    }

    async array(obj) {
        if (this.skippedValidation(obj)) return;

        this.clearIF(utils.isArray(this.getData(obj)), obj);
        
    }

    async numeric(obj) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);
        const num = utils.isNumeric(data);

        this.clearIF(
            num,
            obj
        );
        if (num) {
            this.setData(obj, num);
        }

    }

    async integer(obj) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);
        const intData = utils.isInteger(data);

        this.clearIF(
            intData,
            obj
        );
        if (intData) {
            this.setData(obj, intData);
        }

    }

    async string(obj) {
        if (this.skippedValidation(obj)) return;
        let data = this.getData(obj);

        if (utils.isNumber(data)) {
            data = `${data}`;
        }

        this.clearIF(
            utils.isString(data),
            obj
        );
        this.setData(obj, data);
    }

    matchFile(file, types) {
        const matchPattern = (pattern) => {
            if (utils.isArray(file)) {
                return file.every((item) => pattern.test(item.type));
            } else if (utils.isFileList(file)) {
                return Array.from(file).every((item) =>
                    pattern.test(item.type)
                );
            } else if (utils.isFile(file)) {
                return pattern.test(file.type);
            }
            return false;
        };

        return types.some((type) => {
            const patterns = this._file_patterns[type];

            if (utils.isArray(patterns)) {
                return patterns.some((pattern) => {
                    return matchPattern(pattern);
                });
            } else if (utils.isRegExp(patterns)) {
                return matchPattern(patterns);
            }
            return false;
        });
    }

    async file(obj, ...types) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);
        const hasAttr = types[0] !== true;

        if (
            utils.isArray(data) &&
            data.length > 0 &&
            utils.isFile(data[data.length - 1])
        ) {
            const file = data[data.length - 1];

            if (hasAttr && !this.matchFile(data, types)) {
                return this.loadErrorMessage(
                    obj,
                    `File must be either ${utils.join(types, ", ", " or ")}`
                );
            }

            this.setData(obj, file);
        } else if (utils.isFile(data) || utils.isFileList(data)) {
            if (hasAttr && !this.matchFile(data, types)) {
                return this.loadErrorMessage(
                    obj,
                    `File must be either ${utils.join(types, ", ", " or ")}`
                );
            }

            if (utils.isFileList(data) && data.length > 0) {
                this.setData(obj, data[data.length - 1]);
            }
            return this.clearErrorMessage(obj);
        }

        this.loadErrorMessage(obj);
    }

    isFile(data) {
        if (utils.isFileList(data) || utils.isFile(data)) return true;
        else if (utils.isArray(data)) {
            return data.every((file) => utils.isFile(file));
        }
        return false;
    }

    async files(obj, ...types) {
        if (this.skippedValidation(obj)) return;
        let data = this.getData(obj);
        const hasAttr = types[0] !== true;

        if (utils.isFileList(data)) {
            data = Array.from(data);
        } else if (utils.isFile(data)) {
            data = [data];
        }
        this.setData(obj, data);

        if (this.isFile(data)) {
            if (hasAttr && !this.matchFile(data, types)) {
                return this.loadErrorMessage(
                    obj,
                    `File must be either ${utils.join(types, ", ", " or ")}`
                );
            }
            return this.clearErrorMessage(obj);
        }

        this.loadErrorMessage(obj);
    }

    async boolean(obj) {
        let value = this.getData(obj);
        if (!utils.isBoolean(value)) {
            this.loadErrorMessage(obj);
        }
    }

    
    async email(obj) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);
       
        this.clearIF(
            utils.isEmail(data),
            obj
        );
    }


    async uuid(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const validated = utils.isString(data) && utils.isUuid(data);

        this.clearIF(
            validated,
            obj
        );
       
    }

    async url(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;
        let validated = utils.isUrl(data);
        
        this.clearIF(
            validated,
            obj
        );

    }

    async ip(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;
        
        const validated = utils.isIpAddress(data);

        this.clearIF(
            validated,
            obj
        );
    }

    /**
     *
     * STABILIZERS
     * @method trim
     * @method capitalize
     * @method format_date
     * */
    async trim(obj) {
        const value = this.getData(obj);

        if (utils.isString(value)) {
            this.setData(obj, utils.trim(value));
        }
        else {
            this.setData(obj, utils.recursiveTrim(value));
        }
    }

    async capitalize(obj, type) {
        this.trim(obj);
        const value = this.getData(obj);

        if (value) {
            if (type === "all") this.setData(obj, value.toUpperCase());
            else if (type === "none") this.setData(obj, value.toLowerCase());
            else
                this.setData(
                    obj,
                    value.replace(/\b([a-z])/g, ($1) => $1.toUpperCase())
                );
        }
    }

    async format_date(obj, format) {
        if (!["date", "datetime", "time"].includes(obj.type)) {
            throw new ValidationError(
                "format_date after declaring date, datetime or time type"
            );
        }

        const formatted = utils.format_date(this.getData(obj), format, obj.type);
        if (formatted) {
            this.setData(obj, formatted);
        }
        
    }

    /**
     * FILLABLE RULES
     * @method fill
     * @method if_empty
     * @method fillable
     * @method nullable
     * @method required
     * @method required_if
     * @method required_unless
     * @method required_with
     * @method required_with_all
     * @method required_without
     * @method required_without_all
     */
    async fill(obj, initial) {
        const value = this.getData(obj);

        if (this.empty(value)) {
            this.setData(obj, initial);
        }
    }

    async if_empty(obj, initial) {
        if (!utils.isString(initial)) {
            throw new ValidationError("if_empty argument is not accepted");
        }

        const value = this.getData(obj);

        if (utils.isEmpty(value)) {
            this.setData(obj, initial);
        }
    }

    async filled(obj) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);

        const matcher = [
            data === undefined,
            data === null,
            data === "",
            utils.isArray(data) && data.length === 0,
            utils.isPlainObject(data) && data && Object.keys(data).length === 0,
        ];

        if (matcher.some((item) => item === true)) {
            this.loadErrorMessage(obj);
        }
    }

    async nullable(obj) {
        if (this.skippedValidation(obj)) return;

        if (!this.getData(obj)) {
            this.setData(obj, null);
            this.skipNextValidation(obj);
        }
    }

    async required(obj) {
        const data = this.getData(obj);
        if (
            (utils.isFile(data) && obj.type === "file") ||
            (utils.isFileList(data) && obj.type === "files")
        ) {
            return this.clearErrorMessage(obj);
        }

        const matcher = [
            data === undefined,
            data === null,
            data === "",
            utils.isArray(data) && data.length === 0,
            utils.isPlainObject(data) && Object.keys(data).length === 0,
        ];

        if (matcher.some((item) => item === true)) {
            this.loadErrorMessage(obj);
        }
    }

    async required_if(obj, other, value) {
        if (!this.getData(obj) && this._data[other] !== value) {
            this.loadErrorMessage({ ...obj, other, value });
        } else {
            this.clearErrorMessage(obj);
        }
    }

    async required_unless(obj, other, ...values) {
        const value = this.getData(obj);
        const otherValue = this._data[other];

        if (value && values.includes(otherValue)) {
            return this.clearErrorMessage(obj);
        }

        this.loadErrorMessage({ ...obj, other, values: values.join(",") });
    }

    async required_with(obj, ...values) {
        const required_files = [obj.attribute, ...values];
        const value = this.getData(obj);
        const valueData = required_files.map((item) => this._data[item]);

        if (value && valueData.some((item) => !this.empty(item))) {
            return this.clearErrorMessage(obj);
        }
        this.loadErrorMessage({ ...obj, values: values.join(",") });
    }

    async required_with_all(obj, ...values) {
        const required_files = [obj.attribute, ...values];
        const data = required_files.map((item) => this._data[item]);

        if (data.some((item) => this.empty(item))) {
            this.loadErrorMessage({ ...obj, values: values.join(",") });
        }
    }

    async required_without(obj, ...values) {
        const required_files = [obj.attribute, ...values];
        const data = required_files.map((item) => this._data[item]);

        if (data.every((item) => this.empty(item))) {
            this.loadErrorMessage({ ...obj, values: values.join(",") });
        }
    }

    async required_without_all(obj, ...values) {
        const value = this.getData(obj);
        const valudData = values.map((item) => this._data[item]);

        if (!value && valudData.some((item) => this.empty(item))) {
            this.loadErrorMessage({ ...obj, values: values.join(",") });
        }
    }

    /**
     * LAST ORDER RULES (validators)
     */

    /**
     *
     * Check if a field has been accepted
     *
     * @see filled
     *
     * term: 'accepted|...'
     *
     * or
     * term: {accepted: true, ...}
     *
     * or
     * term: ['accepted',...]
     */

    accepted(obj) {
        if (!this.getData(obj)) {
            this.loadErrorMessage(obj);
        }
    }

    /**
     *
     * Checks if the provided data has strong password features
     *
     * @usage
     * name: 'string|password|...'
     *
     * or
     * name: {string:true, password:true, ...}
     *
     * or
     * name: ['string', 'password', ...]
     */

    async password(obj) {
        const data = this.getData(obj) ?? "";
        const patterns = {
            letters: [/[a-zA-Z]/],
            mixed: [/[a-z]/, /[A-Z]/],
            numbers: [/[0-9]/],
            symbols: [/[!@#$^&*()_+<>?\/\\,.+|{}%-`~]/]
        };

        for(const [key, pattern] of Object.entries(patterns)) {
            if (pattern.some(p => !p.test(data))) {
                return this.loadErrorMessage(
                    obj,
                    this.getUserMessages(obj, key)
                )
            }
        }
        return this.clearErrorMessage(obj)

        if (!/[a-zA-Z]/.test(data)) {
            this.loadErrorMessage(
                obj,
                this.getUserMessages(obj, 'letters')
            );
        } else if (!/[a-z]/.test(data) || !/[A-Z]/.test(data)) {
            this.loadErrorMessage(
                obj,
                this.getUserMessages(obj, 'mixed')
            );
        } else if (!/[0-9]/.test(data)) {
            this.loadErrorMessage(
                obj,
                this.getUserMessages(obj, 'numbers')
            );
        } else if (!/[!@#$^&*()_+<>?\/\\,.+|{}%-`~]/.test(data)) {
            this.loadErrorMessage(
                obj,
                this.getUserMessages(obj, 'symbols')
            );
        } else if (data.length < 8) {
            this.loadErrorMessage(
                { ...obj, length: 8 },
                this.getUserMessages(obj, 'length')
            );
        }
    }

    /**
     *
     * Checks is a provided data has only alphabets
     *
     * @usage
     * name: 'string|alpha|...'
     *
     * or
     * name: {string:true, alpha:true, ...}
     *
     * or
     * name: ['string', 'alpha', ...]
     */

    alpha(obj) {
        if (this.skippedValidation(obj)) return;
        this.trim(obj);
        const data = this.getData(obj).toString();

        const pattern = /^[a-zA-Z]+$/;

        
        this.clearIF(utils.isString(data) && pattern.test(data), obj)
    }

    clearIF(validated, obj, errorMessage) {
        if (validated) {
            return this.clearErrorMessage(obj);
        }
        this.loadErrorMessage(obj, errorMessage);
    }

    /**
     *
     * Checks is a provided data has only alphabets and underscores
     *
     * @usage
     * name: 'string|alpha_underscore|...'
     *
     * or
     * name: {string:true, alpha_underscore:true, ...}
     *
     * or
     * name: ['string', 'alpha_underscore', ...]
     */

    alpha_underscore(obj) {
        if (this.skippedValidation(obj)) return;

        this.trim(obj);
        const data = this.getData(obj);
        
        this.clearIF(utils.isString(data) && /^[a-zA-Z_]+$/.test(data), obj)
    }

    /**
     *
     * Checks is a provided data has only alphabets and dashes
     *
     * @usage
     * name: 'string|alpha_dash|...'
     *
     * or
     * name: {string:true, alpha_dash:true, ...}
     *
     * or
     * name: ['string', 'alpha_dash', ...]
     */

    alpha_dash(obj) {
        if (this.skippedValidation(obj)) return;
        this.trim(obj);
        const data = this.getData(obj);

        this.clearIF(utils.isString(data) && /^[a-zA-Z0-9_-]+$/.test(data), obj)
    }

    /**
     *
     * Checks is a provided data has only alphabets and numbers
     *
     * @usage
     * name: 'string|alpha_num|...'
     *
     * or
     * name: {string:true, alpha_num:true, ...}
     *
     * or
     * name: ['string', 'alpha_num', ...]
     */

    alpha_num(obj) {
        if (this.skippedValidation(obj)) return;
        
        this.trim(obj);

        const data = this.getData(obj);

        this.clearIF(utils.isString(data) && /^[a-zA-Z0-9]+$/.test(data), obj)
    }

    /**
     *
     * Checks is a provided data has only alphabets and spaces
     *
     * @usage
     * name: 'string|alpha_spaces|...'
     *
     * or
     * name: {string:true, alpha_spaces:true, ...}
     *
     * or
     * name: ['string', 'alpha_spaces', ...]
     */

    alpha_spaces(obj) {
        if (this.skippedValidation(obj)) return;
       
        this.trim(obj);
        const data = this.getData(obj);

        this.clearIF(utils.isString(data) && /^[a-zA-Z\s]+$/.test(data), obj)
    }

    getSize(obj) {
        const data = this.getData(obj);

        if (obj.type === 'numeric') {
            return [data]; 
        }
        else if (obj.type === 'files') {
            return data.map(file => file.size);
        }
        else if (obj.type === 'file') {
            return [
                data.size
            ];
        }
        else if (obj.type === 'string' || obj.type === 'array') {
            return [
                data.length
            ];
        }
        return 0;
    }

    /**
     *
     * Ensures a value is between a minimum and maximum range.
     * Handles numeric, string, array, and file types
     *
     * @usage
     * age: 'between:18,45|...'
     *
     * or
     *
     * age: {between: [18, 45], ...}
     *
     * or
     * age: ['between:18,45', ...]
     */

    async between(obj, min, max) {
        if (this.skippedValidation(obj)) return;

        min = this.parseInt(min);
        max = this.parseInt(max);
        const data = this.getData(obj);

        min = Math.min(max, min);
        max = Math.max(max, min);

        const patterns = {
            numeric: (data) => data < min || data > max,
            string: (data) => data.length < min || data > max,
            array: (data) => data.length < min || data > max,
            files: (data) => data.some(file => file.size < min || file.size > max),
            file: (data) => data.size < min || data.size > max
        };

        const fnc = patterns[obj.type];
        let validated = false;

        if (utils.isFunction(fnc)) {
            validated = !fnc(data);
        }
        this.clearIF(
            validated, 
            {...obj, min, max},
            this.getUserMessages(obj)
        );

    }

    /**
     *
     * Validates if the value matches another field (commonly used for password confirmation)
     *
     * @usage
     * terms: 'confirmed|...'
     *
     * or
     * terms: {confirmed: true, ...}
     *
     * or
     * terms: ['confirmed', ...]
     */

    async confirmed(obj) {
        if (this.skippedValidation(obj)) return;
        let other = arguments.length > 1 ? arguments[1] : obj.attribute + '_confirmation';

        const validated = utils.isString(other) && this.getData(obj) === this._data[other];

        

        if (!validated) {
            this._skips.push(other);
            this._errors[other] = this.getUserMessages(obj);
        }
    }

    /**
     *
     * Checks if the value contains a specific substring
     *
     * @usage
     * name: 'contains:bright|...'
     *
     * or
     * name: {contains: 'bright', ...}
     *
     * or
     * name: ['contains:bright', ...]
     */

    

    async contains(obj, value) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);

        this.clearIF(
            utils.isString(data) && data.includes(value),
            obj
        );
    }

    /**
     *
     * Validates a credit card number using regex patterns for various card types (Visa, MasterCard, etc.)
     *
     * @param {*} obj
     * @returns
     */

    async credit_card(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const cardNumberRegex =
            /^4[0-9]{12}(?:[0-9]{3})?$|^5[1-5][0-9]{14}$|^3[47][0-9]{13}$|^3(?:0[0-5]|[68][0-9])[0-9]{11}$|^6(?:011|5[0-9]{2})[0-9]{12}$|^35(?:2[89]|[3-8][0-9])[0-9]{12}$|^(?:2131|1800|35[2-8][0-9])[0-9]{11}$/;

        this.clearIF(
            cardNumberRegex.test(data),
            obj
        );
    }

    /**
     *
     * Validates if a date is after a certain time (e.g., after:18years)
     *
     * @usage
     * birthdate: 'date|after:18years'
     *
     * or
     * birthdate: {date:true, after: '18years', ...}
     *
     * or
     * birthdate: ['date', 'before:18years', ....]
     */

    after(obj, after) {
        if (this.skippedValidation(obj)) return;
        const date = after;

        const current = Date.now();

        const mtch = date.match(
            /^(\d+)\s*(year|month|day|hour|minute|second|millisecond)(s)?$/
        );
        if (!mtch) {
            throw new ValidationError(
                `Invalid Validation Rule Syntax, usage example: ${obj.attribute}: 'date|after:18years`
            );
        }

        let value = Date.parse(this.getData(obj));
        let validated = false;
        if (!isNaN(value)) {
            // value = new Date(value);

            let [all, digits, text] = mtch;
            const timers = {
                year: 1000 * 60 * 60 * 24 * 365, // 1000 * 60*60*24*365
                month: 1000 * 60 * 60 * 24 * 7 * 4, // 1000 * 60 * 60 * 60 * 24 * 7 * 4
                week: 1000 * 60 * 60 * 24 * 7,
                day: 1000 * 60 * 60 * 24,
                hour: 1000 * 60 * 60,
                minute: 1000 * 60,
                second: 1000,
                millisecond: 1,
            };
            digits = parseInt(digits);

            if (text in timers) {
                const newTime = Math.floor((current - value) / timers[text]);
                validated = newTime >= digits
            }
        }
        this.clearIF(
            validated,
            { ...obj, after }
        );
    }

    /**
     *
     * Validates if a date is before a certain time (e.g., before:45years)
     *
     * @usage
     * birthdate: 'date|before:45years'
     *
     * or
     * birthdate: {date:true, before: '45years', ...}
     *
     * or
     * birthdate ['date', 'before:45years', ...]
     */

    async before(obj, before) {
        if (this.skippedValidation(obj)) return;
        const date = before;

        const current = Date.now();

        const mtch = date.match(
            /^(\d+)\s*(year|month|day|hour|minute|second|millisecond)(s)?$/
        );

        if (!mtch) {
            throw new ValidationError(
                `Invalid Validation Rule Syntax, usage example: ${obj.attribute}: 'date|before:45years`
            );
        }

        const value = Date.parse(this.getData(obj));
        let validated = false;

        if (!isNaN(value)) {
            let [all, digits, text] = mtch;
            const timers = {
                year: 1000 * 60 * 60 * 24 * 365,
                month: 1000 * 60 * 60 * 24 * 7 * 4,
                week: 1000 * 60 * 60 * 24 * 7,
                day: 1000 * 60 * 60 * 24,
                hour: 1000 * 60 * 60,
                minute: 1000 * 60,
                second: 1000,
                millisecond: 1,
            };
            digits = parseInt(digits);

            if (text in timers) {
                const newTime = Math.floor((value - current) / timers[text]);
                validated = newTime >= digits;
            }
        }

        this.clearIF(
            validated,
            { ...obj, before }
        );
    }


    /**
     *
     * Ensures the string ends with any of the specified values
     *
     */

    async ends_with(obj, ...values) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);
        const pattern = values.join("|") + "$";
        const regex = new RegExp(pattern);


        const validated = utils.isString(data) && regex.test(data);

        this.clearIF(
            validated,
            { ...obj, values: values.join(", ") }
        );
    }

    /**
     *
     * Checks if the value is within a specified set of values
     *
     * @see in_array
     */

    async in(obj, ...values) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);

        const validated = utils.isPlainObject(data) && values.some(item => item in data);

        this.clearIF(
            validated,
            { ...obj, values: values.join(", ") }
        );
    }


    async in_array(obj, ...values) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);

        const validated = utils.isString(data) && values.includes(data);

        this.clearIF(
            validated,
            { ...obj, values: values.join(", ") }
        );
    }

    

    /** */

    async json(obj) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);

        let validated = false;

        try {
            JSON.parse(data);
            validated = true;
        } catch (e) {
        }

        this.clearIF(
            validated,
            obj
        );
    }

    async lowercase(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const validated = utils.isString(data) && /^[a-z]+$/.test(data);

        this.clearIF(
            validated,
            obj
        );
    }





    async max(obj, max) {
        max = parseInt(max);
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        const patterns = {
            numeric: (data) => data >= max,
            string: (data) => data.length >= max,
            array: (data) => data.length >= max,
            files: (data) => data.some(file => file.size >= max),
            file: (data) => data.size >= max
        };

        const fnc = patterns[obj.type];
        let validated = false;

        if (utils.isFunction(fnc)) {
            validated = !fnc(data);
        }

        this.clearIF(
            validated, 
            {...obj, min, max},
            this.getUserMessages(obj)
        );

    }




    async mimes(obj, ...mimes) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        let error = false;

        switch (obj.type) {
            case "file":
                error = !mimes.includes(data.type);
                break;
            case "files":
                error = Array.from(data).some(
                    (file) => !mimes.includes(file.type)
                );
                break;
        }

        this.clearIF(
            !error,
            { ...obj, mimes: mimes.join(", ") }
        );

    }

    async min(obj, min) {
        if (this.skippedValidation(obj)) return;

        min = this.parseInt(min);
        const data = this.getData(obj);

        const patterns = {
            numeric: (data) => data < max,
            string: (data) => data.length < max,
            array: (data) => data.length < max,
            files: (data) => data.some(file => file.size < max),
            file: (data) => data.size < max
        };

        const fnc = patterns[obj.type];
        let validated = false;

        if (utils.isFunction(fnc)) {
            validated = !fnc(data);
        }

        this.clearIF(
            validated, 
            {...obj, min, max},
            this.getUserMessages(obj)
        );

    }

    async multiple_of(obj, number) {
        number = parseFloat(number);
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const validated = utils.isNumber(data) && data % number === 0;

        this.clearIF(
            validated,
            obj
        );
    }

    async not_contains(obj, value) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const validated = utils.isString(data) && !data.includes(value);

        this.clearIF(
            validated,
            obj
        );
    }

    async not_in(obj, ...values) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);

        const validate = utils.isPlainObject(data) && values.every(value => !(value in data))

        this.clearIF(
            validated,
            { ...obj, values: values.join(", ") }
        );

    }




    async phone(obj) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);

        const phoneRegex = /^\+?[1-9]\d{1,14}$/;

        this.clearIF(
            phoneRegex.test(data),
            obj
        );
    }



    async range(obj, min, max) {
        min = this.parseInt(min);
        max = this.parseInt(max);
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        const validated = utils.isNumber(data) && data >= min && data <= max;

        this.clearIF(
            validated,
            {...obj, min, max}
        );

    }


    async regex(obj, pattern) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);
        let validated = false;

        if (utils.isRegExp(pattern) || utils.isString(data)) {
            try {
                const regex = utils.isRegExp(pattern) ? pattern : new RegExp(pattern);

                validated = regex.test(data);
            } catch(e) {}
        }

        this.clearIF(
            validated,
            {...obj, pattern}
        );

    }

    async same(obj, other) {
        if (this.skippedValidation(obj)) return;

        this.clearIF(
            this.getData(obj) !== this._data[other],
            {...obj, other}
        );
    }




    async starts_with(obj, ...values) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);
        const pattern = "^" + values.join("|");
        let validated = false;

        try {
            const regex = new RegExp(pattern);
            validated = regex.test(data);
        } catch(e) {}

        this.clearIF(
            validated,
            { ...obj, values: values.join(", ") }
        );

    }




    async timezone(obj) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);

        const validTimezones = Intl.supportedValuesOf("timeZone");
        const validated = validTimezones.includes(data);

        this.clearIF(
            validated,
            obj
        );
    }

    async uppercase(obj) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);

        const validated = utils.isString(data) && /^[A-Z]+$/.test(data);

        this.clearIF(
            validated,
            obj
        );
    }

    


    async gt(obj, gt) {
        if (this.skippedValidation(obj)) return;
        gt = this.parseInt(gt, `gt argument expects a number but ${typeof gt} was provided`);
        const data = this.getData(obj);

        let error = false;
        switch (obj.type) {
            case "numeric":
                error = data <= gt;
                break;
            case "file":
                error = utils.isFile(data) ? 1 <= gt : data.length <= gt;
                break;
            case "string":
            case "array":
                error = data.length <= gt;
                break;
        }

        
        this.clearIF(
            !error,
            {...obj, gt},
            this.getUserMessages(obj)
        );

    }

    async gte(obj, gte) {
        gte = parseInt(gte);
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let error = false;
        switch (obj.type) {
            case "numeric":
                error = data < gte;
                break;
            case "file":
                error = utils.isFile(data) ? 1 < gte : data.length < gte;
                break;
            case "string":
            case "array":
                error = data.length < gte;
                break;
        }

        this.clearIF(
            !error,
            {...obj, gte},
            this.getUserMessages(obj)
        );
    }

    async lt(obj, lt) {
        lt = parseInt(lt);
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let error = false;
        switch (obj.type) {
            case "numeric":
                error = data >= lt;
                break;
            case "file":
                error = utils.isFile(data) ? 1 >= lt : data.length >= lt;
                break;
            case "string":
            case "array":
                error = data.length >= lt;
                break;
        }

        this.clearIF(
            !error,
            {...obj, lt},
            this.getUserMessages(obj)
        );
    }

    async lte(obj, lte) {
        lte = parseInt(lte);
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let error = false;
        switch (obj.type) {
            case "numeric":
                error = data > lte;
                break;
            case "file":
                error = utils.isFile(data) ? 1 > lte : data.length > lte;
                break;
            case "string":
            case "array":
                error = data.length > lte;
                break;
        }

        this.clearIF(
            !error,
            {...obj, lte},
            this.getUserMessages(obj)
        );
    }

    async active_url(obj) {
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let validated = utils.isString(data) && /^https?:\/\//.test(data);

        if (validated) {
            validated = false;
            try {
                await fetch(this.getData(obj));
                validated = true;
            } catch (e) {}
        }

        this.clearIF(
            validated, 
            obj
        );
    }

    parseInt(num, message) {
        if (utils.isNumber(num)) {
            return str;
        }

        const parsed = parseInt(num);

        if (isNaN(parsed)) {
            throw new ValidationError(
                message || `Number type was expected but ${typeof num} was provided`
            )
        }

        return parsed;
    }

    async digits(obj, digits) {
        digits = this.parseInt(digits);
        
        let data = `${this.getData(obj)}`;

        const validated = data.length === digits;
    
        this.clearIF(
            validated,
            obj
        );
    }

    
    async image(obj) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);

        const isImage = (type) => this._file_patterns.image.some(pattern => pattern.test(type));

        if (["file", "files"].includes(obj.type)) {
            const fileIsImage = utils.isFile(data) && isImage(data.type);
            const filesAreImage = utils.isArray(data) && data.every((item) => isImage(item.type));

            validated = fileIsImage || filesAreImage;
        }

        this.clearIF(
            validated,
            obj
        );
    }

    audio(obj) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);

        const isAudio = (type) => this._file_patterns.audio.some(pattern => pattern.test(type));

        if (["file", "files"].includes(obj.type)) {
            const fileIsAudio = utils.isFile(data) && isAudio(data.type);
            const filesAreAudio = utils.isArray(data) && data.every((item) => isAudio(item.type));

            validated = fileIsAudio || filesAreAudio;
        }

        this.clearIF(
            validated,
            obj
        );
    }

    async video(obj) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);

        const isVideo = (type) => this._file_patterns.video.some(pattern => pattern.test(type));

        if (["file", "files"].includes(obj.type)) {
            const fileIsVideo = utils.isFile(data) && isVideo(data.type);
            const filesAreVideo = utils.isArray(data) && data.every((item) => isVideo(item.type));

            validated = fileIsVideo || filesAreVideo;
        }

        this.clearIF(
            validated,
            obj
        );
    }




    async pattern(obj, pattern) {
        if (this.skippedValidation(obj)) return;

        const indicators = {
            z: /^[a-z]$/,
            Z: /^[A-Z]$/,
            a: /^[a-z]$/,
            A: /^[A-Z]$/,
            0: /^[0-9]$/,
            9: /^[0-9]$/,
            "*": /^[a-zA-Z0-9]$/,
        };

        let data = this.getData(obj);

        let validated = false;

        if (data) {
            const splitData = utils.trim(data.toString()).split("");
            const splitPattern = pattern.split("");

            if (splitPattern.length === splitData.length) {
                validated = splitPattern.every((pattern, i) => {
                    return (
                        (!indicators[pattern] && pattern === splitData[i]) ||
                        (indicators[pattern] &&
                            indicators[pattern].test(splitData[i]))
                    );
                });

                
            }
        }

        this.clearIF(
            validated,
            {...obj, pattern}
        )

    }

    

    hasFile() {
        return this._hasFile;
    }

    /**
     *
     * Converts regular data into FormData,
     * which is often required for file uploads
     * or sending data in POST requests
     *
     * @param {*} data
     * @returns
     */

    convertDataToFormData(data) {
        const formData = new FormData();

        utils.forEach(data, (value, key) => {
            if (utils.isFileList(value)) {
                this._hasFile = true;

                utils.forEach(Array.from(value), (file) => {
                    formData.append(`${key}[]`, file);
                });
            } else if (
                utils.isArray(value) &&
                value.every((file) => utils.isFile(file))
            ) {
                this._hasFile = true;
                value.forEach((file) => {
                    formData.append(`${key}[]`, file);
                });
            } else {
                if (utils.isFile(value)) {
                    this._hasFile = true;
                }
                formData.append(key, value);
            }
        });

        return formData;
    }

    /**
     *
     * Loops through the rules and applies the necessary validation for each attribute
     */

    parseRules(rules) {
        if (!utils.isPlainObject(rules)) {
            throw new TypeError("Argement 2 (rules) must be an object");
        }
        utils.forEach(rules, (rule, attribute) => {
            this.start({
                rule,
                attribute,
            });
        });
        
    }

    /**
     * Infers the type of the data (e.g., array, object, numeric, file, etc.)
     *
     * @param {*} data
     * @returns {String}
     */

    detectType(data) {
        if (utils.isArray(data)) return data.every(item => utils.isFile(item)) ? "files":"array";
        else if (utils.isBlob(data)) return "blob";
        else if (utils.isPlainObject(data)) return "object";
        else if (utils.isNumber(data)) return "numeric";
        else if (utils.isBoolean(data)) return "boolean";
        else if (utils.isFile(data)) return "file";
        else if (utils.isFileList(data)) return "files";
        else if (utils.isString(data)) return "string";
        else {
            const date = new Date(data);
            if (!isNaN(date.getFullYear())) return 'date';
            try {
                let d = JSON.parse(data);
                if (utils.isArray(d) || utils.isObject(d)) return 'json';
                return typeof d;
            } catch(e){}
        }
        return "any";
    }

    /**
     * Orders the properties of an array or object based on specified patterns.
     *
     * @param {Array|Object} input - The array or object to be categorized and ordered.
     * @param {Object} patterns - The patterns to categorize the properties.
     * @param {Object} defaults - The default values to ensure presence if necessary.
     * @returns {Array|Object} - A new array or object with properties ordered according to the patterns.
     */
    orderRules(attribute, input) {

        const order = utils.memorize(() => {
            const Pattern = (arr) => new RegExp(`^(${arr.join("|")})$`);
            const patterns = {
                types: Pattern(FormGuard.registers.types),
                stabilizers: Pattern(FormGuard.registers.stabilizers),
                fillables: Pattern(FormGuard.registers.fillables),
            };
    
    
            if (utils.isString(input)) {
                const rules = {};
                const split = input.split("|");
                split.forEach((item) => {
                    let [rule, args] = item.split(":");
                    args = !args ? true : args.split(",");
                    rules[rule] = args.length === 0 ? true : args;
                });
    
                return this.orderRules(attribute, rules);
            }
            else if (utils.isArray(input)) {
                if (input.some(item => utils.isString(item) && item.indexOf(':') > 0)) {
                    input = this.arrayToObject(input);
                }                        
            }


    
            const categorized = this.categorizeRules(input, patterns);
    
            const orderedRules = utils.isArray(input)
                ? this.createOrderedArray(categorized)
                : this.createOrderedObject(categorized, input);
    
    
            return orderedRules;
        }, attribute);
        return order();
        
    }

    arrayToObject(input) {
        const obj = {};

        input.forEach(item => {
            if (utils.isFunction(item)) {
            
                let name = item.name || 'anonymous';
                obj[name] = item;
            }
            else if (utils.isString(item)) {
                const splt = item.split(":");
                let name = splt[0];
                let args = true;

                if (splt.length > 1) {
                    args = splt[1].split(',').map(utils.normalize);
                }
                obj[name] = args;              
            }
        });
        return obj;
    }

    categorizeRules(input, patterns) {
        const categorized = {
            types: [],
            stabilizers: [],
            fillables: [],
            others: [],
        };

        (utils.isArray(input) ? input : Object.keys(input)).forEach((item) => {
            let matched = false;
            for (const [key, pattern] of Object.entries(patterns)) {
                if (item && pattern.test(item)) {
                    categorized[key].push(item);
                    matched = true;
                    break;
                }
            }
            if (!matched) categorized.others.push(item);
        });

        return categorized;
    }

    createOrderedArray(categorized) {
        let order = [];

        ["fillables", "types", "stabilizers"].forEach((key) => {
            if (categorized[key] && categorized[key].length > 0) {
                order.push(
                    key === "stabilizers"
                        ? categorized.stabilizers[0]
                        : categorized[key][0]
                );
            }
        });

        return [
            ...order,
            ...categorized.others,
            "successfully__passed__validation",
        ];
    }

    createOrderedObject(categorized, input) {
        const orders = {};

        ["fillables", "types", "stabilizers"].forEach((order) => {
            const item = categorized[order].map((key) => [
                key,
                input[key] || true,
            ]);

            if (item.length > 0) {
                Object.assign(
                    orders,
                    Object.fromEntries(
                        order === "stabilizers" ? item : [item[0]]
                    )
                );
            }
        });

        return {
            ...orders,
            ...Object.fromEntries(
                categorized.others.map((key) => [key, input[key]])
            ),
            successfully__passed__validation: true,
        };
    }

    appendRule(attribute, rule, callback, methodArgs) {
        const [method, arg] = methodArgs;
        const args = methodArgs;
        if (method === 'fill' && arg.length > 0) {
            return this.setData({attribute}, arg[0]);
        }
        if (!(attribute in this._rules)) {
            this._rules[attribute] = [];
        }
        if (rule.length === 0) {
            rule = "custom";
        }


        this._rules[attribute].push({
            rule,
            callback,
            methodArgs,
            args,
            arg
        });
    }

    /**
     * Starts the validation process for a given rule and attribute.
     *
     * @param {Object} config - Configuration object containing rule and attribute.
     * @param {string|Object} config.rule - Validation rule or rules to process.
     * @param {string} config.attribute - The attribute to validate.
     */

    start({ rule, attribute }) {
        const fail = (message) => {
            throw new KnownError(message);
        };

        rule = this.orderRules(attribute, rule);

        let type = this.inferType({ rule, attribute });

        const processItem = async (method, args) => {
            const fnc = utils.isFunction(method)
                ? method
                : utils.isFunction(args)
                ? args
                : false;

            if (["integer"].includes(type)) {
                type = "numeric";
            }

            return await this.enact({
                method,
                fnc,
                args,
                fail,
                attribute,
                type,
            });
        };

        if (utils.isArray(rule)) {
            for (const method of rule) {
                let rule = method;
                if (utils.isFunction(method)) {
                    rule = method.name;
                }
                this.appendRule(attribute, rule, processItem, [method]);
            }
        } else if (utils.isPlainObject(rule)) {
            for (const [method, args] of Object.entries(rule)) {
                if (utils.isFunction(args)) {
                    // FormGuard.addCustomRules({ [method]: args });
                }


                this.appendRule(attribute, method, processItem, [method, args]);
            }
        } else {
            throw new ValidationError("Failed to process validation rules");
        }
    }

    inferType(obj) {
        const types = FormGuard.registers.types;

        const matchedType = (
            utils.isArray(obj.rule) ? obj.rule : Object.keys(obj.rule)
        ).find((item) => types.includes(item));

        if (matchedType) {
            return matchedType;
        }
        const data = this.getData(obj);
        const isNumeric = utils.isNumeric(data);

        if (utils.isArray(data))
            return data.every((file) => utils.isFile(file)) ? "files" : "array";
        else if (utils.isPlainObject(data)) return "object";
        else if (isNumeric) {
            this.setData(obj, isNumeric);
            return "numeric";
        } else if (utils.isFile(data)) return "file";
        else if (utils.isFileList(data)) return "files";
        else if (utils.isString(data)) return "string";
        return "any";
    }

    async enact({ method, attribute, args, fnc, type, required, fail }) {
        let rule = method;

        if (utils.isString(method) && method.indexOf(":") >= 0) {
            [rule, args] = method.split(":");
            args = args.split(",");
        } else if (utils.isFunction(method)) {

            rule = method.name || 'anonymous';
        }


        let message = `validation.${
            rule || "custom" + (utils.isFunction(method) ? "Callback" : "Rule")
        }`;

        const errorMessage = (msg) => {
            if (!utils.isString(rule)) {
                return message;
            }
            return this.getUserMessages({attribute, type, rule}, null, msg || message);
        };

        let parameters = [];
        
        if (utils.isArray(args)) {
            parameters = args.map(utils.normalize);
        }

        const apply_callback = async (fnc, message) => {
            try {
                let response = await fnc({
                    query: this._data,
                    value: this._data[attribute],
                    parameters,
                    message,
                    type,
                    attribute,
                    fail,
                });


                if (utils.isPlainObject(response) && utils.isString(response[FormGuard.locale])) {
                    throw new KnownError(response[FormGuard.locale]);
                }

                else if (response === false || utils.isString(response)) {
                    throw new KnownError(response || errorMessage());
                }

                return response;
            } catch (err) {
                this._errors[attribute] = errorMessage();

                if (err instanceof KnownError) {
                    if (utils.isString(err.message)) {
                        this._errors[attribute] = errorMessage(err.message);
                    }
                    if (utils.isPlainObject(err.message) && utils.isString(err.message[FormGuard.locale])) {
                        this._errors[attribute] = errorMessage(err.message[FormGuard.locale]);
                    }
                }
                
                else if (err instanceof ValidationError) {
                    throw new ValidationError(err.message);
                } 
            }
        };

        try {
            if (utils.isFunction(fnc)) {
                if (this.skippedValidation({ attribute, required })) return;

                await apply_callback(fnc, message);
            } else if (rule && rule in this) {
                args = [
                    {
                        rule,
                        method: rule,
                        attribute,
                        type,
                        required,
                        fail,
                    },
                ].concat(args);
                const fun = this[rule];

                await fun.apply(this, args);

                // this[rule].apply(this, args);
            } else if (utils.isString(rule) && rule in FormGuard) {
                let matched = false;

                if (utils.isFunction(FormGuard[rule])) {
                    message = this.getUserMessages({attribute, rule, type});
                    
                    await apply_callback(FormGuard[rule], message);
                    matched = true;
                }
                if (!matched) {
                    FormGuard.log("warn", `Validation Rule "${rule}" is not valid`);
                }
            }
            else {
                FormGuard.log("warn", `Validation Rule "${rule}" is not defined`);

            }
        } catch (e) {
            if (FormGuard._debug) {
                console.error(e);
                throw e;
            }
            else {
                throw new ValidationError(
                    'An error occurred'
                );
            }
        }
    }

    

    skippedValidation(obj) {
        return (
            this._skips.includes(obj.attribute) ||
            // (!this.getData(obj) && !obj.required) ||
            obj.attribute in this._errors
        );
    }

    loadErrorMessage(obj, message) {

        
        if (!utils.isString(obj.rule)) {
            obj.rule = method;
        }

        if (!utils.isString(message)) {
            message = this.getUserMessages(obj);
        }
        

        this.skipNextValidation(obj);

        const attrs = {
            ...obj,
            attribute: this.getAttribute(obj.attribute),
        };
        message = message.replace(
            /:([a-zA-Z_]+)/g,
            (_, key) => attrs[key] || key
        );
        this._errors[obj.attribute] = message;
    }


    getData(obj) {
        if (!utils.isObject(obj)) {
            return this._data;
        }
        return this._data[obj.attribute];
    }

    setData(obj, value) {
        this._data[obj.attribute] = value;
    }
    removeData(obj) {
        delete this._data[obj.attribute];
    }

    skipNextValidation(obj) {
        this._skips.push(obj.attribute);
    }

    clearErrorMessage(obj) {
        if (this._errors[obj.attribute]) {
            delete this._errors[obj.attribute];
        }
    }

    hasError(obj) {
        return !!this._errors[obj.attribute];
    }

    /**
     * @param obj {Object}
     *
     * @usage
     * FormGuard.setAttributes({
     *    name: 'Full Name',
     *    email: 'Email Address'
     * });
     *
     * @returns void
     */

     static getKeys(thing){
        const pattern = /([^$]+)/g;
        const matched = thing.match(pattern);

        if (!matched || matched.length !== 2) {
            return [thing, system_locale];
        }
        return matched;
    }

    getAttribute(name) {
        if (utils.isPlainObject(this._attributes)) {
            const locale = this._attributes[FormGuard.locale];

            if (utils.isPlainObject(locale)) {
                return locale[name] || name;
            }
        }
        return name;
    }



    setAttributes(obj) {
        if (!utils.isObject(this._attributes)) {
            this._attributes = {};
        }

        if (utils.isObject(obj)) {
            obj = {
                ...(utils.isPlainObject(config.attributes) ? config.attributes : {}),
                ...obj 
            };
            utils.forEach(obj, (value, key) => {
                const [message_key, locale] = FormGuard.getKeys(key);
                this._attributes[locale] = {
                    ...(utils.isPlainObject(this._attributes[locale]) ? this._attributes[locale] : {}),
                    [message_key]: value
                };
            })
            
        }

        return this;
    }

    snakeCase(...args) {
        args = args.filter(arg => utils.isString(arg))
        
        return args
            .map((arg, i) =>
                i === 0
                    ? arg.toLowerCase()
                    : arg.charAt(0).toUpperCase() + arg.slice(1).toLowerCase()
            )
            .join("");
    }

    async empty(data) {
        const matcher = [
            data === undefined,
            data === null,
            utils.isString(data) && utils.trim(data) === "",
            utils.isArray(data) && data.length === 0,
            utils.isObject(data) && data && Object.keys(data).length === 0,
        ];

        return matcher.some((item) => item);
    }


    loadFallbackMessages(fallback_messages) {
        FormGuard._fallback_messages = FormGuard._translations[FormGuard.locale] || utils.castObject(fallback_messages, {});
    }
    
    static setPriority(name, priority) {
        const priors = {
            p1: 'fillables',
            p2: 'types',
            p3: 'stabilizers',
        }
        const priorities = ["fillables", "types", "stabilizers"];
        priority = utils.castNumber(priority, 4);

        this.resetPriority(name);
        const prior = `p${priority}`;


        if (priors[prior]) {
            const order = priors[prior];
            this.registers[order].push(name);

        }
    }

    static resetPriority(name) {
        
        for(const [registry, orders] of Object.entries(this.registers)) {
            const order = orders.indexOf(name);
            if (order >= 0) {
                this.registers[registry].splice(order, 1);
            }
        }
    }

    static remove(name) {
        this.resetPriority(name);

        if (name in this) {
            delete this[name];
        }
    }


    static add(custom_rules, options) {
        if (utils.isString(custom_rules)) {
            if (utils.isPlainObject(options)) {
                this.add({
                    [custom_rules]: options, 
                });
            }
            else if (utils.isFunction(options)) {
                this.add({
                    [custom_rules]: {
                        fn: options 
                    }
                });
                // this[custom_rules] = options;
            }
        }   

        else if (utils.isArray(custom_rules)) {
            utils.forEach(custom_rules, rules => {
                if (utils.isPlainObject(rules) && utils.isString(rules.name)) {
                    this.add({[rules.name]: rules})
                }
                else if (!utils.isPlainObject(rules)) {
                    this.log('warn', 'Rules should be an object');
                }
                else if (!utils.isString(rules.name)) {
                    this.log('warn', 'Rule name is missing');
                }
            });
        }

        else if (utils.isPlainObject(custom_rules)) {

            utils.forEach(custom_rules, (options, name) => {
                if (utils.isFunction(options)) {
                    this[name] = options;
                    return;
                }
                
                const fn = eval(`(function ${name}(data){return options.fn(data);})`)
                // const fn = options.fn;
                
                
                let messages = utils.isString(options.message) ? {[name]:options.message} : {};

                if (utils.isPlainObject(options.messages)) {
                    messages = {
                        ...(Object.fromEntries(
                            Object.entries(options.messages)
                                .map(([locale, message]) => [`${name}$${locale}`, message])
                        ))
                    }
                }
                
                
                if (utils.isFunction(fn)) {
                    this.setSystemMessages(messages, name);
                    this.setPriority(name, options.priority);
                    delete this[name];
                    this[name] = fn;
                }
                else {
                    this.log('warn', `${name} fn must be a function`);
                }
            })
            

        }

    }



    
}