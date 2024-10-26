import { ValidationError, KnownError } from "../core/exceptions";
import { request } from "./request";
import utils from "./core/utils";
import config from "../core/config";
const retrieve = (resource_link) => {
    return new Promise((resolve, reject) => {
        import(resource_link)
            .then((res) => {
                resolve(res.default);
            })
            .catch(reject);
    });
};

window.utils = utils;

export class FormGuard {
    _hasFile = false;
    static translations = null;
    static locale = "en";
    static fallback_locale = "en";
    static default_messages = null;
    static locale_messages = {};
    cached = {};
    static file_patterns = {
        image: [/^image\/(png|gif|jpe?g)/],
        video: [/^video\/(.+?)/],
        pdf: [/application\/json/],
        document: [/application\/json/],
    };

    static registers = {
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
        sanitizers: ["trim", "capitalize", "format_date"],
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

    constructor(data, rules = null, messages = {}, attributes = {}) {
        this.setAttributes(attributes);
        this._errors = {};
        this._hasFile = false;
        this.cached = {};

        this._skips = [];
        this.golden_rules = {};

        if (!utils.isPlainObject(rules)) {
            throw "Argement 2 (rules) must be an object";
        }
        if (!utils.isPlainObject(messages)) {
            messages = {};
        }

        this._data = { ...data };

        this.setMessages(messages);
        this.processMessage();
        this.parseRules(rules);
    }

    setMessages(messages) {
        if (this.locale_messages) {
            return;
        }

        this.locale_messages = {};

        if (!utils.isPlainObject(messages)) {
            throw new ValidationError(
                `Default Messages must be an object, but ${
                    messages === null ? "NULL" : typeof messages
                } was provided`
            );
        }

        const getKeys = (thing) => {
            const pattern = /([^$]+)/g;
            const matched = thing.match(pattern);

            if (!matched || matched.length !== 2) {
                return [thing, "en"];
            }
            return matched;
        };

        utils.forEach(messages, (default_message, attr) => {
            const [message_key, locale] = getKeys(attr);

            const fallback = message_key + "$en";

            if (locale !== "en") {
                if (
                    utils.isUndefined(messages[fallback]) &&
                    utils.isUndefined(messages[message_key])
                ) {
                    const example = {
                        ...messages,
                        [message_key]: "This is an error Message",
                    };
                    console.warn(
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

            this.locale_messages[locale] = {
                ...(utils.isPlainObject(this.locale_messages[locale])
                    ? this.locale_messages[locale]
                    : {}),
                [message_key]: default_message,
            };
        });
    }

    static parseLocale(locale) {
        return locale.replace(/([^a-zA-Z0-9_]+)/, "_");
    }

    getMessages(key) {
        const locale = FormGuard.locale;
        let messages = FormGuard.translations[locale];

        if (!utils.isPlainObject(messages)) {
            messages = FormGuard.translations.en || {};
        }
        return messages[key] || FormGuard.translations?.en[key];
    }

    getDefaultMessage(...keys) {
        let default_messages = FormGuard.default_messages;
        let fallback_message =
            FormGuard.translations[FormGuard.fallback_locale];

        let message = utils.objectGet(default_messages, ...keys);

        if (!message) {
            message = utils.objectGet(fallback_message, ...keys);
        }

        return message;
    }

    static setLocale(locale, defaultLocale) {
        defaultLocale = defaultLocale || utils.global.navigator.language;

        if (!utils.isString(locale)) {
            locale = defaultLocale;
        }
        const parsedLocale = locale.replace(/([^a-zA-Z0-9_]+)/, "_");
        if (
            utils.isUndefined(translations[locale]) &&
            utils.isUndefined(translations[this.parseLocale(locale)])
        ) {
            locale = defaultLocale;
        }

        FormGuard.locale = locale;
    }

    async processMessage() {
        if (!utils.isPlainObject(FormGuard.translations)) {
            FormGuard.translations = {};
            try {
                FormGuard.fallback_locale = utils.isString(
                    config.fallback_locale
                )
                    ? config.fallback_locale
                    : "en";

                if (utils.isArray(config.locales)) {
                    config.locales.forEach(async (locale) => {
                        try {
                            const lang = await retrieve(
                                "./translations/" + locale
                            );
                            FormGuard.translations[locale] = lang;
                        } catch (e) {}
                    });
                }
            } catch (e) {
                FormGuard.fallback_locale = "en";
            }
        }

        if (FormGuard.default_messages) {
            return;
        }

        let locale = FormGuard.locale;

        if (!utils.isString(locale)) {
            locale = "en";
        }
        const parsedLocale = FormGuard.parseLocale(locale);

        if (
            utils.isUndefined(FormGuard.translations[locale]) &&
            utils.isUndefined(FormGuard.translations[parsedLocale])
        ) {
            locale = "en";
        } else if (!utils.isUndefined(FormGuard.translations[parsedLocale])) {
            locale = parsedLocale;
        }

        let trans = FormGuard.translations[locale];

        if (!utils.isPlainObject(trans)) {
            trans = {};
        }

        FormGuard.default_messages = trans;
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
            for (const [attribute, data] of Object.entries(this.golden_rules)) {
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
                const rules = Object.entries(this.golden_rules).filter(
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
                const rules = Object.entries(this.golden_rules).filter(
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

    static async make(data, rules = null, messages = {}, attributes = {}) {
        const validator = new FormGuard(data, rules, messages, attributes);

        return validator.all();
    }

    successfully__passed__validation(obj) {
        if (this.skippedValidation(obj)) return;
        this.clearError(obj);
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
     *
     */

    async blob(obj) {
        const data = this.getData(obj);
        if (!utils.isBlob(data)) {
            this.registerError(obj);
        }
    }

    async date(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;
        const date = new Date(data);

        if (isNaN(date.getFullYear())) {
            this.registerError(obj);
        } else {
            // this.setData(obj, new Date(date));
            this.clearError(obj);
        }
    }

    async datetime(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;
        const date = new Date(data);

        if (isNaN(date.getSeconds())) {
            this.registerError(obj);
        } else {
            // this.setData(obj, new Date(date));
            this.clearError(obj);
        }
    }

    async array(obj) {
        if (this.skippedValidation(obj)) return;

        if (!utils.isArray(this.getData(obj))) {
            return this.registerError(obj);
        }
        this.clearError(obj);
    }

    async numeric(obj) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);
        const num = utils.isNumeric(data);

        if (!num) {
            return this.registerError(obj);
        }
        this.setData(obj, num);

        this.clearError(obj);
    }

    async integer(obj) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);
        const intData = utils.isInteger(data);

        if (!intData) {
            return this.registerError(obj);
        }
        this.setData(obj, intData);

        this.clearError(obj);
    }

    async string(obj) {
        if (this.skippedValidation(obj)) return;

        if (!utils.isString(this.getData(obj))) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
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
            const patterns = FormGuard.file_patterns[type];

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
                return this.registerError(
                    obj,
                    `File must be either ${utils.join(types, ", ", " or ")}`
                );
            }

            this.setData(obj, file);
        } else if (utils.isFile(data) || utils.isFileList(data)) {
            if (hasAttr && !this.matchFile(data, types)) {
                return this.registerError(
                    obj,
                    `File must be either ${utils.join(types, ", ", " or ")}`
                );
            }

            if (utils.isFileList(data) && data.length > 0) {
                this.setData(obj, data[data.length - 1]);
            }
            return this.clearError(obj);
        }

        this.registerError(obj);
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
                return this.registerError(
                    obj,
                    `File must be either ${utils.join(types, ", ", " or ")}`
                );
            }
            return this.clearError(obj);
        }

        this.registerError(obj);
    }

    async boolean(obj) {
        let value = this.getData(obj);
        if (!utils.isBoolean(value)) {
            this.registerError(obj);
        }
    }

    /**
     *
     * SANITIZERS
     * @method trim
     * @method capitalize
     * @method format_date
     * */
    async trim(obj) {
        const value = this.getData(obj);

        if (utils.isString(value)) {
            this.setData(obj, utils.trim(value));
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
        const placeholders = {
            date: "yyyy-mm-dd",
            datetime: "yyyy-mm-dd h:i:s a",
            time: "h:i:s a",
        };

        if (!utils.isString(format)) {
            format = placeholders[obj.type];
        }

        if (obj.type !== "date") {
            this.date(obj);
        }

        const date = new Date(this.getData(obj));

        const padZero = (n) => (n < 10 ? `0${n}` : n);

        const yyyy = date.getFullYear();
        const mm = padZero(date.getMonth() + 1);
        const dd = padZero(date.getDate());
        const hours = date.getHours();
        let a = "am";
        let A = "AM";
        let h = hours;

        if (h > 12) {
            h -= 12;
            a = "pm";
            A = "PM";
        }
        h = padZero(h);
        const H = padZero(hours);
        const s = date.getSeconds();
        const pattern = /([a-zA-Z]+)/g;

        const dateObj = {
            yyyy,
            YYYY: yyyy,
            mm,
            MM: mm,
            s,
            S: s,
            h,
            H,
            a,
            A,
            dd,
            DD: dd,
        };

        const m = format.match(pattern);

        const splitPlaceholder = placeholders[obj.type].match(pattern);

        const invalidFormats = m.filter(
            (item) =>
                !splitPlaceholder.includes(item.toLowerCase()) ||
                !(item in dateObj)
        );

        if (invalidFormats.length > 0) {
            throw new ValidationError(
                `The format provided contains ${invalidFormats.join(
                    ","
                )} which is not supported. \nUse "${placeholders[obj.type]}"`
            );
        }

        if (m) {
            const formatted = format.replace(pattern, (_, $1) =>
                $1 in dateObj ? dateObj[$1] : $1
            );
            const matched = m.filter((item) => item in dateObj);

            if (matched.length === m.length) {
                this.setData(obj, formatted);
            }
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

        if (utils.isString(value) && utils.trim(value) === "") {
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
            this.registerError(obj);
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
            return this.clearError(obj);
        }

        const matcher = [
            data === undefined,
            data === null,
            data === "",
            utils.isArray(data) && data.length === 0,
            utils.isPlainObject(data) && Object.keys(data).length === 0,
        ];

        if (matcher.some((item) => item === true)) {
            this.registerError(obj);
        }
    }

    async required_if(obj, other, value) {
        if (!this.getData(obj) && this._data[other] !== value) {
            this.registerError({ ...obj, other, value });
        } else {
            this.clearError(obj);
        }
    }

    async required_unless(obj, other, ...values) {
        const value = this.getData(obj);
        const otherValue = this._data[other];

        if (value && values.includes(otherValue)) {
            return this.clearError(obj);
        }

        this.registerError({ ...obj, other, values: values.join(",") });
    }

    async required_with(obj, ...values) {
        const required_files = [obj.attribute, ...values];
        const value = this.getData(obj);
        const valueData = required_files.map((item) => this._data[item]);

        if (value && valueData.some((item) => !this.empty(item))) {
            return this.clearError(obj);
        }
        this.registerError({ ...obj, values: values.join(",") });
    }

    async required_with_all(obj, ...values) {
        const required_files = [obj.attribute, ...values];
        const data = required_files.map((item) => this._data[item]);

        if (data.some((item) => this.empty(item))) {
            this.registerError({ ...obj, values: values.join(",") });
        }
    }

    async required_without(obj, ...values) {
        const required_files = [obj.attribute, ...values];
        const data = required_files.map((item) => this._data[item]);

        if (data.every((item) => this.empty(item))) {
            this.registerError({ ...obj, values: values.join(",") });
        }
    }

    async required_without_all(obj, ...values) {
        const value = this.getData(obj);
        const valudData = values.map((item) => this._data[item]);

        if (!value && valudData.some((item) => this.empty(item))) {
            this.registerError({ ...obj, values: values.join(",") });
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
            this.registerError(obj);
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
        // const s

        if (!/[a-zA-Z]/.test(data)) {
            this.registerError(
                obj,
                this.getMessages("passwordLetters") ||
                    this.getMessages("password") ||
                    this.getDefaultMessage("password", "letters")
            );
        } else if (!/[a-z]/.test(data) || !/[A-Z]/.test(data)) {
            this.registerError(
                obj,
                this.getMessages("passwordMixed") ||
                    this.getMessages("password") ||
                    this.getDefaultMessage("password", "mixed")
            );
        } else if (!/[0-9]/.test(data) || !/[A-Z]/.test(data)) {
            this.registerError(
                obj,
                this.getMessages("passwordNumbers") ||
                    this.getMessages("password") ||
                    this.getDefaultMessage("password", "numbers")
            );
        } else if (!/[!@#$^&*()_+<>?\/\\,.+|{}%-`~]/.test(data)) {
            this.registerError(
                obj,
                this.getMessages("passwordSymbols") ||
                    this.getMessages("password") ||
                    this.getDefaultMessage("password", "symbols")
            );
        } else if (data.length < 8) {
            this.registerError(
                { ...obj, length: 8 },
                this.getMessages("passwordLength") ||
                    this.getMessages("password") ||
                    this.getDefaultMessage("password", "length")
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

    alpha(obj, min, max) {
        if (this.skippedValidation(obj)) return;
        const checkSize = parseInt(min);
        if (max === undefined) {
            [max, min] = [min, 3];
        }
        min = parseInt(min) || 3;
        max = parseInt(max) || 255;

        this.trim(obj);
        const data = this.getData(obj).toString();

        if (/^[a-zA-Z]+$/.test(data)) {
            if (checkSize && (data.length < min || data.length > max))
                return this.registerError(
                    {
                        ...obj,
                        min,
                        max,
                    },
                    this.getMessages(
                        this.snakeCase(obj.attribute, "between")
                    ) ||
                        this.getMessages(obj.attribute + ".between") ||
                        this.getDefaultMessage("between", "string")
                );
            return this.clearError(obj);
        }

        this.registerError(obj);
    }

    /**
     *
     * Checks is a provided data has only alphabets and underscores
     *
     * @usage
     * name: 'string|alpha_|...'
     *
     * or
     * name: {string:true, alpha_:true, ...}
     *
     * or
     * name: ['string', 'alpha_', ...]
     */

    alpha_(obj, min, max) {
        if (this.skippedValidation(obj)) return;

        const checkSize = parseInt(min);

        if (max === undefined) {
            [max, min] = [min, 3];
        }
        min = parseInt(min) || 3;
        max = parseInt(max) || 255;

        this.trim(obj);
        const data = this.getData(obj);

        const pattern = /^[a-zA-Z_]$/;

        if (pattern.test(data)) {
            if (checkSize && (data.length < min || data.length > max))
                return this.registerError(
                    {
                        ...obj,
                        min,
                        max,
                    },
                    this.getMessages(
                        this.snakeCase(obj.attribute, "between")
                    ) ||
                        this.getMessages(obj.attribute + ".between") ||
                        this.getDefaultMessage("between", "string")
                );

            return this.clearError(obj);
        }

        this.registerError(obj);
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

    alpha_dash(obj, min, max) {
        if (this.skippedValidation(obj)) return;
        const checkSize = parseInt(min);

        if (max === undefined) {
            [max, min] = [min, 3];
        }
        min = parseInt(min) || 3;
        max = parseInt(max) || 255;

        this.trim(obj);
        const data = this.getData(obj);

        const pattern = /^[a-zA-Z0-9_-]+$/;

        if (pattern.test(data)) {
            if (checkSize && (data.length < min || data.length > max))
                return this.registerError(
                    {
                        ...obj,
                        min,
                        max,
                    },
                    this.getMessages(
                        this.snakeCase(obj.attribute, "between")
                    ) ||
                        this.getMessages(obj.attribute + ".between") ||
                        this.getDefaultMessage("between", "string")
                );

            return this.clearError(obj);
        }

        this.registerError(obj);
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

    alpha_num(obj, min, max) {
        if (this.skippedValidation(obj)) return;
        const checkSize = parseInt(min);

        if (max === undefined) {
            [max, min] = [min, 3];
        }
        min = parseInt(min) || 3;
        max = parseInt(max) || 255;
        this.trim(obj);

        const data = this.getData(obj);

        this.clearError(obj);

        const pattern = /^[a-zA-Z0-9]+$/;

        if (pattern.test(data)) {
            if (checkSize && (data.length < min || data.length > max))
                return this.registerError(
                    {
                        ...obj,
                        min,
                        max,
                    },
                    this.getMessages(
                        this.snakeCase(obj.attribute, "between")
                    ) ||
                        this.getMessages(obj.attribute + ".between") ||
                        this.getDefaultMessage("between", "string")
                );

            return this.clearError(obj);
        }

        this.registerError(obj);
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

    alpha_spaces(obj, min, max) {
        if (this.skippedValidation(obj)) return;
        const checkSize = parseInt(min);

        if (max === undefined) {
            [max, min] = [min, 3];
        }
        min = parseInt(min) || 3;
        max = parseInt(max) || 255;

        max = parseInt(max);
        this.trim(obj);
        const data = this.getData(obj);

        const pattern = /^[a-zA-Z\s]+$/;

        if (pattern.test(data)) {
            if (checkSize && (data.length < min || data.length > max))
                return this.registerError(
                    {
                        ...obj,
                        min,
                        max,
                    },
                    this.getMessages(
                        this.snakeCase(obj.attribute, "between")
                    ) ||
                        this.getMessages(obj.attribute + ".between") ||
                        this.getDefaultMessage("between", "string")
                );

            return this.clearError(obj);
        }

        this.registerError(obj);
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
        min = parseInt(min);
        max = parseInt(max);
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        min = Math.min(max, min);
        max = Math.max(max, min);

        let error = false;
        switch (obj.type) {
            case "numeric":
                error = data < min || data > max;
                break;
            case "string":
            case "array":
                error = data.length < min || data.length > max;
                break;
            case "file":
                if (utils.isFile(data)) {
                    error = data.size < min || data.size > max;
                } else if (utils.isFileList(data)) {
                    error = Array.from(data).some(
                        (file) => file.size < min || file.size > max
                    );
                }
                break;
        }

        if (error) {
            this.registerError(
                { ...obj, min, max },
                this.getDefaultMessage("between", obj.type)
            );
        } else {
            this.clearError(obj);
        }
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

    async confirmed(obj, other) {
        if (this.skippedValidation(obj)) return;

        other = utils.isString(other) ? other : obj.attribute + "_confirmation";

        if (this.getData(obj) !== this._data[other]) {
            this._skips.push(other);

            let message =
                this.getMessages(this.snakeCase(obj.attribute, "confirmed")) ||
                this.getMessages(obj.attribute + ".confirmed");

            if (!utils.isString(message)) {
                message = this.getDefaultMessage("confirmed");
            }
            this._errors[other] =
                message || this.getDefaultMessage("confirmed");
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
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (!utils.isString(data) || !data.includes(value)) {
            this.registerError({ ...obj, value });
        } else {
            this.clearError(obj);
        }
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
        if (!cardNumberRegex.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
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
                if (newTime >= digits) return this.clearError(obj);
            }
        }
        this.registerError({ ...obj, after });
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
                if (newTime >= digits) return this.clearError(obj);
            }
        }
        this.registerError({ ...obj, before });
    }

    /**
     * Ensures that the provided data is a valid email address
     *
     * @usage
     * email: 'email|...'
     *
     * or
     * email: {email:true, }
     *
     * or
     * email: ['email', ...]
     */

    async email(obj) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);
        if (!/.+@.+\..+/.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    /**
     *
     * Ensures the string ends with any of the specified values
     *
     */

    async ends_with(obj, ...values) {
        const data = this.getData(obj);
        const pattern = values.join("|") + "$";
        const regex = new RegExp(pattern);

        if (this.skippedValidation(obj)) return;

        if (!data || !regex.test(data)) {
            this.registerError({ ...obj, values: values.join(", ") });
        } else {
            this.clearError(obj);
        }
    }

    /**
     *
     * Checks if the value is within a specified set of values
     *
     * @see in_array
     */

    async in(obj, ...values) {
        if (this.skippedValidation(obj)) return;

        if (!values.includes(this.getData(obj))) {
            this.registerError({ ...obj, values: values.join(", ") });
        } else {
            this.clearError(obj);
        }
    }

    async in_array(obj, ...values) {
        if (this.skippedValidation(obj)) return;

        if (!values.includes(this.getData(obj))) {
            this.registerError({ ...obj, values: values.join(", ") });
        } else {
            this.clearError(obj);
        }
    }

    /** */

    async json(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        try {
            JSON.parse(data);
            this.clearError(obj);
        } catch (e) {
            this.registerError(obj);
        }
    }

    async lowercase(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (!utils.isString(data) || !/^[a-z]+$/.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async max(obj, max) {
        max = parseInt(max);
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let error = false;
        switch (obj.type) {
            case "numeric":
                error = data >= max;
                break;
            case "file":
                error = data.size >= max;
                break;
            case "files":
                error = Array.from(data).some((file) => file.size >= max);
                break;
            case "string":
            case "array":
                error = data.length >= max;
                break;
        }

        if (error) {
            this.registerError(
                { max, ...obj },
                this.getDefaultMessage("max", obj.type)
            );
        } else {
            this.clearError(obj);
        }
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

        if (error) {
            this.registerError({ ...obj, mimes: mimes.join(", ") });
        } else {
            this.clearError(obj);
        }
    }

    async min(obj, min) {
        min = parseInt(min);
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let error = false;
        switch (obj.type) {
            case "numeric":
                error = data < min;
                break;
            case "file":
                error = data.size < min;
                break;
            case "files":
                error = Array.from(data).some((file) => file.size < min);
                break;
            case "string":
            case "array":
                error = data.length < min;
                break;
        }

        if (error) {
            this.registerError(
                { ...obj, min },
                this.getDefaultMessage("min", obj.type)
            );
        } else {
            this.clearError(obj);
        }
    }

    async multiple_of(obj, number) {
        number = parseFloat(number);
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (utils.isNumber(data) && data % number !== 0) {
            this.registerError({ ...obj, number });
        } else {
            this.clearError(obj);
        }
    }

    async not_contains(obj, value) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (utils.isString(data) && data.includes(value)) {
            this.registerError({ ...obj, value });
        } else {
            this.clearError(obj);
        }
    }

    async not_in(obj, ...values) {
        if (this.skippedValidation(obj)) return;

        if (values.includes(this.getData(obj))) {
            this.registerError({ ...obj, values: values.join(", ") });
        } else {
            this.clearError(obj);
        }
    }

    async phone(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async range(obj, min, max) {
        min = parseFloat(min);
        max = parseFloat(max);
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (utils.isNumber(data)) {
            if (data < min || data > max) {
                this.registerError({ ...obj, min, max });
            } else {
                this.clearError(obj);
            }
        } else {
            this.registerError({ ...obj, min, max });
        }
    }

    async regex(obj, pattern) {
        const data = this.getData(obj);
        const regex = new RegExp(pattern);

        if (this.skippedValidation(obj)) return;

        if (!data || !regex.test(data)) {
            this.registerError({ ...obj, pattern });
        } else {
            this.clearError(obj);
        }
    }

    async same(obj, other) {
        if (this.skippedValidation(obj)) return;

        if (this.getData(obj) !== this._data[other]) {
            this.registerError({ ...obj, other });
        } else {
            this.clearError(obj);
        }
    }

    async starts_with(obj, ...values) {
        const data = this.getData(obj);
        const pattern = "^" + values.join("|");
        const regex = new RegExp(pattern);

        if (this.skippedValidation(obj)) return;

        if (!data || !regex.test(data)) {
            this.registerError({ ...obj, values: values.join(", ") });
        } else {
            this.clearError(obj);
        }
    }

    async timezone(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const validTimezones = Intl.supportedValuesOf("timeZone");
        if (!validTimezones.includes(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async uppercase(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (!utils.isString(data) || !/^[A-Z]+$/.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async uuid(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!utils.isString(data) || !uuidRegex.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async url(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        try {
            new URL(data);
            this.clearError(obj);
        } catch (_) {
            this.registerError(obj);
        }
    }

    async ip(obj) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const ipRegex =
            /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async gt(obj, gt) {
        gt = parseInt(gt);
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

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

        if (error) {
            this.registerError({ ...obj, gt });
        } else {
            this.clearError(obj);
        }
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

        if (error) {
            this.registerError({ ...obj, gte });
        } else {
            this.clearError(obj);
        }
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

        if (error) {
            this.registerError({ ...obj, lt });
        } else {
            this.clearError(obj);
        }
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

        if (error) {
            this.registerError({ ...obj, lte });
        } else {
            this.clearError(obj);
        }
    }

    async active_url(obj) {
        try {
            await fetch(this.getData(obj));
        } catch (e) {
            this.registerError(obj);
        }
    }

    async digits(obj, digits) {
        digits = parseInt(digits);
        let data = `${this.getData(obj)}`;

        if (!isNaN(digits) && data.length === digits) {
            return this.clearError(obj);
        }
        this.registerError({ ...obj, digits });
    }

    async image(obj) {
        if (this.skippedValidation(obj)) return;

        // image formats
        const formats = ["image/jpg", "image/png", "image/gif", "image/jpeg"];
        const data = this.getData(obj);

        if (["file", "files"].includes(obj.type)) {
            if (
                (utils.isArray(data) &&
                    data.every((item) => formats.includes(item.type))) ||
                (utils.isFile(data) && formats.includes(data.type)) ||
                (utils.isFileList(data) &&
                    Array.from(data).every((file) =>
                        formats.includes(data.filesize)
                    ))
            ) {
                return this.clearError(obj);
            }
        }

        this.registerError(obj);
    }

    audio(obj) {
        if (this.skippedValidation(obj)) return;

        // audio formats
        const formats = ["image/jpg", "image/png", "image/gif", "image/jpeg"];
        const data = this.getData(obj);

        if (["file", "files"].includes(obj.type)) {
            if (
                (utils.isFile(data) && formats.includes(data.type)) ||
                (utils.isFileList(data) &&
                    Array.from(data).every((file) =>
                        formats.includes(data.filesize)
                    ))
            ) {
                return this.clearError(obj);
            }
        }

        this.registerError(obj);
    }

    async video(obj) {
        if (this.skippedValidation(obj)) return;

        // video formats
        const formats = ["image/jpg", "image/png", "image/gif", "image/jpeg"];
        const data = this.getData(obj);

        if (["file", "files"].includes(obj.type)) {
            if (
                (utils.isFile(data) && formats.includes(data.type)) ||
                (utils.isFileList(data) &&
                    Array.from(data).every((file) =>
                        formats.includes(data.filesize)
                    ))
            ) {
                return this.clearError(obj);
            }
        }

        this.registerError(obj);
    }

    async pattern(obj, pattern) {
        if (this.skippedValidation(obj)) return;

        const indicators = {
            z: /^[a-z]$/,
            Z: /^[A-Z]$/,
            9: /^[0-9]$/,
            "*": /^[a-zA-Z0-9]$/,
        };

        let data = this.getData(obj);

        if (data) {
            const splitData = utils.trim(data.toString()).split("");
            const splitPattern = pattern.split("");

            if (splitPattern.length === splitData.length) {
                const matchPattern = splitPattern.every((pattern, i) => {
                    return (
                        (!indicators[pattern] && pattern === splitData[i]) ||
                        (indicators[pattern] &&
                            indicators[pattern].test(splitData[i]))
                    );
                });

                if (matchPattern) {
                    return this.clearError(obj);
                }
            }
        }

        this.registerError({ ...obj, pattern });
    }

    /**
     *  ADD CUSTOM RULES
     * ---------------------------------
     *  addCustomRules({
     *      unique: ({value, fail}) => fail('not unique'),
     *      exists: ({value, fail}) => fail('not existing')
     *  })
     *
     **/

    static addCustomRules(rules, messages = {}, registry = null) {
        let message;
        if (!utils.isPlainObject(messages)) {
            throw new ValidationError(
                `Custom Messages must be an object but ${
                    messages === null ? "null" : typeof messages
                } was provided`
            );
        }
        if (!utils.isPlainObject(rules)) {
            throw new ValidationError(
                `Custom validation Rules must be an object, but ${
                    rules === null ? "null" : typeof rules
                } provided`
            );
        }
        for (const [key, callback] of Object.entries(rules)) {
            if (utils.isFunction(callback)) {
                this[key] = callback;

                if (utils.isString(registry) && FormGuard.registers[registry]) {
                    const entries = Object.entries(FormGuard.registers).map(
                        (reg, items) => [
                            reg,
                            items.filter((item) => key !== item),
                        ]
                    );
                    FormGuard.registers = Object.fromEntries(entries);

                    FormGuard.registers[registry].push(key);
                }

                if (messages[key]) {
                    this.default_messages[key] = messages[key];
                }
            } else {
                console.error(
                    `Custom Rule not added. The custom rule must be a function but ${typeof callback} provided`
                );
            }
        }

        return this;
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

        // for (const [key, value] of Object.entries(data)) {
        //     if (utils.isFileList(value)) {
        //         this._hasFile = true;
        //         Array.from(value).forEach((file) => {
        //             formData.append(`${key}[]`, file);
        //         });
        //     } else if (
        //         utils.isArray(value) &&
        //         value.every((file) => utils.isFile(file))
        //     ) {
        //         this._hasFile = true;
        //         value.forEach((file) => {
        //             formData.append(`${key}[]`, file);
        //         });
        //     } else {
        //         if (utils.isFile(value)) {
        //             this._hasFile = true;
        //         }
        //         formData.append(key, value);
        //     }
        // }
        return formData;
    }

    /**
     *
     * Loops through the rules and applies the necessary validation for each attribute
     */

    parseRules(rules) {
        utils.forEach(rules, (rule, attribute) => {
            this.start({
                rule,
                attribute,
            });
        });
        // for (const [attribute, rule] of Object.entries(rules)) {
        //     this.start({
        //         rule,
        //         attribute,
        //     });
        // }
    }

    /**
     * Infers the type of the data (e.g., array, object, numeric, file, etc.)
     *
     * @param {*} data
     * @returns
     */

    detectType(data) {
        if (utils.isArray(data)) return "array";
        else if (utils.isPlainObject(data)) return "object";
        else if (utils.isNumber(data)) return "numeric";
        else if (utils.isFile(data)) return "file";
        else if (utils.isFileList(data)) return "files";
        else if (utils.isString(data)) return "string";
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
        const Pattern = (arr) => new RegExp(`^(${arr.join("|")})$`);
        const patterns = {
            datatypes: Pattern(FormGuard.registers.types),
            sanitizers: Pattern(FormGuard.registers.sanitizers),
            fillables: Pattern(FormGuard.registers.fillables),
        };

        if (attribute in this.cached) {
            return this.cached[attribute];
        }

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

        if (!utils.isPlainObject(input)) {
            console.error("Input must be an array or an object");
            return;
        }
        if (Object.keys(input).length === 0) {
            console.error("Validation rule was not provided");
            return;
        }

        const categorized = this.categorizeRules(input, patterns);

        const orderedRules = utils.isArray(input)
            ? this.createOrderedArray(categorized)
            : this.createOrderedObject(categorized, input);

        this.cached[attribute] = orderedRules;

        return orderedRules;
    }

    categorizeRules(input, patterns) {
        const categorized = {
            datatypes: [],
            sanitizers: [],
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

        ["fillables", "datatypes", "sanitizers"].forEach((key) => {
            if (categorized[key] && categorized[key].length > 0) {
                order.push(
                    key === "sanitizers"
                        ? categorized.sanitizers[0]
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

        ["fillables", "datatypes", "sanitizers"].forEach((order) => {
            const item = categorized[order].map((key) => [
                key,
                input[key] || true,
            ]);

            if (item.length > 0) {
                Object.assign(
                    orders,
                    Object.fromEntries(
                        order === "sanitizers" ? item : [item[0]]
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

    appendRule(attribute, rule, callback, args) {
        if (!(attribute in this.golden_rules)) {
            this.golden_rules[attribute] = [];
        }
        if (rule.length === 0) {
            rule = "custom";
        }

        this.golden_rules[attribute].push({
            rule,
            callback,
            args,
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
                    this.addCustomRules({ [method]: args });
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
            rule = method.name;
        }

        let message = `validation.${
            rule || "custom" + (utils.isFunction(method) ? "Callback" : "Rule")
        }`;

        const errorMessage = () => {
            if (!utils.isString(rule)) {
                return message;
            }
            return (
                this.getMessages(this.snakeCase(attribute, rule)) ||
                this.getMessages(attribute + "." + rule) ||
                (utils.isString(this.getDefaultMessage(rule))
                    ? this.getDefaultMessage(rule)
                    : message)
            );
        };

        const apply_callback = async (fnc, message) => {
            try {
                const response = await fnc({
                    request: this._data,
                    self: {
                        data: this._data[attribute],
                        error: this._errors[attribute],
                    },
                    value: this._data[attribute],
                    message,
                    attribute,
                    fail,
                });

                if (response === false || utils.isString(response)) {
                    throw new KnownError(response || errorMessage());
                }
                return response;
            } catch (err) {
                this._errors[attribute] = message;

                if (utils.isKnownError(err) && utils.isString(err.message)) {
                    this._errors[attribute] = err.message;
                } else if (utils.isValidationError(err)) {
                    throw new ValidationError(err.message);
                } else {
                    this._errors[attribute] = errorMessage();
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
                    message =
                        this.getMessages(this.snakeCase(attribute, rule)) ||
                        this.getMessages(attribute + "." + rule) ||
                        this.getDefaultMessage(rule) ||
                        "validation." + rule;

                    await apply_callback(FormGuard[rule], message);
                    matched = true;
                }
                if (!matched) {
                    console.warn(`'Validation Rule "${rule}" is not valid`);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    initializeAttributes() {
        this._attributes = {
            email: "Email Address",
            phone: "Phone Number",
        };
    }

    skippedValidation(obj) {
        return (
            this._skips.includes(obj.attribute) ||
            // (!this.getData(obj) && !obj.required) ||
            obj.attribute in this._errors
        );
    }

    registerError(obj, message) {
        message =
            message ||
            this.getMessages(this.snakeCase(obj.attribute, obj.method)) ||
            this.getMessages(obj.attribute + "." + obj.method);

        this.skipNextValidation(obj);

        if (!message) {
            message = this.getDefaultMessage(obj.method);

            if (utils.isPlainObject(message)) {
                message = message[obj.type];
            }
        }
        message = message || `validation.${obj.attribute}.${obj.method}`;
        const attrs = {
            ...obj,
            attribute: this._attributes[obj.attribute] || obj.attribute,
        };
        message = message.replace(
            /:([a-zA-Z_]+)/g,
            (_, key) => attrs[key] || key
        );
        this._errors[obj.attribute] = message;
    }

    getData(obj) {
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

    clearError(obj) {
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

    setAttributes(obj) {
        if (!utils.isObject(this._attributes)) {
            this._attributes = {
                name: "Full Name",
                email: "Email Address",
            };
        }

        if (utils.isObject(obj)) {
            this._attributes = {
                ...this._attributes,
                ...obj,
            };
        }

        return this;
    }

    snakeCase(...args) {
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

    static defineForm(formID, rules, messages = {}, attributes = {}) {
        const form = document.querySelector(formID);

        if (!form || form.nodeName !== "FORM") {
            throw new TypeError(`Form with the Id ${formID} was not found`);
        }

        const inputs = form.querySelectorAll("[name]");
        const isInput = (tag) =>
            ["textarea", "input", "select"].includes(tag.toLowerCase());
        const button = form.querySelector(
            "button[type=submit],input[type=submit]"
        );
        const errors = form.querySelectorAll("[data-catch]");

        const data = {};

        const disableButton = (disable) => {
            if (button) {
                button.disabled = disable;
            }
        };

        const showErrors = (obj) => {
            if (errors) {
                errors.forEach((error) => {
                    const name = error.getAttribute("data-catch");
                    const input = form.querySelector(`[name='${name}']`);
                    if (input) {
                        input.classList.remove("invalid");
                    }
                    error.classList.remove("has-error");
                    error.textContent = "";
                });

                if (utils.isObject(obj)) {
                    for (const [key, value] of Object.entries(obj)) {
                        const error = form.querySelector(
                            `[data-catch="${key}"]`
                        );
                        const input = form.querySelector(`[name='${key}']`);

                        if (error) {
                            error.classList.add("has-error");
                            error.textContent = value;
                        }
                        if (input) {
                            input.classList.add("invalid");
                        }
                    }
                }
            }
        };

        let validator;

        const pushValue = async (input, dirty) => {
            const name = input.name;
            const value = input.type === "file" ? input.files : input.value;
            if (dirty) {
                input.classList.remove("dirty");
                input.classList.add("pristine");
            } else {
                input.classList.add("dirty");
                input.classList.remove("pristine");
            }

            data[name] = value;

            if (validator) {
                let valid = false;
                try {
                    const response = await validator.only({ [name]: value });
                    const error = form.querySelector(`[data-catch="${name}"]`);
                    if (error) {
                        error.classList.remove("has-error");
                        error.textContent = "";
                    }

                    disableButton(form.querySelector(".has-error[data-catch]"));

                    valid = true;
                } catch (errors) {
                    showErrors(errors);
                }
                input.classList.toggle("valid", valid);
                input.classList.toggle("invalid", !valid);
            }
        };

        inputs.forEach((input) => {
            if (isInput(input.nodeName)) {
                pushValue(input, true);

                input.addEventListener("input", (e) => pushValue(e.target));
            }
        });

        validator = new FormGuard(data, rules, messages, attributes);

        const validate = (callback, errorCallback) =>
            new Promise((resolve, reject) => {
                form.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    disableButton(true);
                    try {
                        const { validated, formData } = await FormGuard.make(
                            data,
                            rules,
                            messages,
                            attributes
                        );
                        let res = null;
                        try {
                            res = await callback({ validated, formData });
                        } catch (error) {
                            if (utils.isFunction(errorCallback)) {
                                return errorCallback(error);
                            }
                            return reject({
                                error,
                            });
                        }

                        if (
                            utils.isObject(res) &&
                            utils.isFunction(res.finally)
                        ) {
                            res.finally(() => {
                                disableButton(false);
                            });
                        } else {
                            disableButton(false);
                        }
                    } catch (e) {
                        showErrors(e);
                        disableButton(false);
                        if (utils.isFunction(errorCallback)) {
                            return errorCallback(e);
                        }
                        reject(e);
                    }
                });
            });

        const events = {
            submit: (callback, errorCallback) => {
                return new Promise((resolve, reject) => {
                    form.addEventListener("submit", async (e) => {
                        e.preventDefault();
                        disableButton(true, true);
                        try {
                            const { validated, formData } =
                                await FormGuard.make(
                                    data,
                                    rules,
                                    messages,
                                    attributes
                                );
                            let res = null;
                            try {
                                res = callback(validated, {
                                    formData,
                                    request,
                                });
                            } catch (error) {
                                if (utils.isFunction(errorCallback)) {
                                    return errorCallback(error);
                                }
                                return reject({
                                    error,
                                });
                            }

                            if (
                                utils.isObject(res) &&
                                utils.isFunction(res.finally)
                            ) {
                                res.finally(() => {
                                    disableButton(false);
                                });
                            } else {
                                disableButton(false);
                            }
                        } catch (e) {
                            showErrors(e);
                            if (utils.isFunction(errorCallback)) {
                                return errorCallback(e);
                            }
                            reject(e);
                        }
                    });
                });
            },
            submitted: (callback, errorCallback) =>
                validate(async ({ validated, formData }) => {
                    const method = (
                        form.getAttribute("method") || "post"
                    ).toUpperCase();
                    const url = form.getAttribute("action");

                    if (!url) {
                        throw new TypeError("URL is not defined");
                    } else if (!utils.isFunction(callback)) {
                        throw new TypeError(
                            "First Argument must be a function"
                        );
                    }
                    try {
                        if (["PUT", "GET"].includes(method)) {
                            formData = validated;
                        }
                        const req = request.http(method);
                        const res = await req(url, formData);

                        callback(res, request);
                    } catch (e) {
                        if (utils.isFunction(errorCallback)) {
                            return errorCallback(e);
                        }
                        throw e;
                    }
                }, errorCallback),
        };

        return {
            setAuth: function (token, type) {
                request.setAuth(token, type);
                return this;
            },
            setHeaders: function (headers, value) {
                request.setHeaders(headers, value);
                return this;
            },

            on: function (event, callback, errorCallback) {
                if (event in events) {
                    return events[event](callback, errorCallback);
                }
                throw new TypeError(`Event ${event} is not supported`);
            },
        };

        return (callback, errorCallback) =>
            new Promise((resolve, reject) => {
                form.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    disableButton(true, true);
                    try {
                        const { validated, formData } = await FormGuard.make(
                            data,
                            rules,
                            messages,
                            attributes
                        );
                        let res = null;
                        try {
                            res = callback(validated, formData);
                        } catch (error) {
                            if (utils.isFunction(errorCallback)) {
                                return errorCallback(error);
                            }
                            return reject({
                                error,
                            });
                        }

                        if (
                            utils.isObject(res) &&
                            utils.isFunction(res.finally)
                        ) {
                            res.finally(() => {
                                disableButton(false);
                            });
                        } else {
                            disableButton(false);
                        }
                    } catch (e) {
                        showErrors(e);
                        if (utils.isFunction(errorCallback)) {
                            return errorCallback(e);
                        }
                        reject(e);
                    }
                });
            });
    }
}

utils.global.FormGuard = FormGuard;
