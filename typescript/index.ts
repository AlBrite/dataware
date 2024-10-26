import { default_messages } from "./messages";
import type {
    ValidationDataType,
    ValidationRuleType,
    ValidationMessagesType,
    ValidationObjectContainerType,
    ValidationAttributesType,
    ValidatorRuleChainType,
    BaseValidationRule,
    RuleCallbackType
} from "./type.ts";
import { ValidationError, KnownError } from "./exceptions";

const cache = new Map();

export class Validator {
    protected static default_messages: { [x: string]: any } =
        default_messages;
    private static _customValidators : {[x:string]: RuleCallbackType} = {}; 
    protected static registers: Record<string, any> = {
        types: [
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
    protected _errors: { [x: string]: string };
    protected _skips: string[];
    protected golden_rules: Record<
        string,
        Record<"rule" | "args" | "callback", any>[]
    >;
    protected _data: { [x: string]: any };
    protected _messages: ValidationMessagesType;
    protected _attributes: { [x: string]: string } = {};

    constructor(
        data: { [x: string]: string },
        rules?: ValidationRuleType,
        messages: ValidationMessagesType = {},
        attributes: ValidationAttributesType = {}
    ) {
        this.setAttributes(attributes);
        this._errors = {};

        this._skips = [];
        this.golden_rules = {};

        if (typeof rules !== "object") {
            throw "Argement 2 (rules) must be an object";
        }
        if (typeof messages !== "object" || messages === null) {
            messages = {};
        }

        this._data = { ...data };
        this._messages = messages;

        this.parseRules(rules);
    }

    all() {
        this._errors = {};

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

    only(attributes: string | string[] | { [x: string]: any }) {
        if (typeof attributes === "string") {
            attributes = [attributes];
        }

        return new Promise(async (resolve, reject) => {
            let errors = {};
            let attrs: string[] = [];

            if (Array.isArray(attributes)) {
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
            } else if (typeof attributes === "object" && attributes !== null) {
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

    static async make(
        data: { [x: string]: any },
        rules?: ValidationRuleType,
        messages: ValidationMessagesType = {},
        attributes: ValidationAttributesType = {}
    ) {
        const validator = new Validator(data, rules, messages, attributes);

        return validator.all();
    }

    successfully__passed__validation(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;
        this.clearError(obj);
    }

    /**
     * TYPE RULES (types)
     *
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

    async date(obj: ValidationObjectContainerType) {
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

    async datetime(obj: ValidationObjectContainerType) {
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

    async array(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        const message =
            this._messages[this.snakeCase(obj.attribute, "array")] ||
            this._messages[obj.attribute + ".array"] ||
            Validator.default_messages.array;

        if (!Array.isArray(this.getData(obj))) {
            return this.registerError(obj, message);
        }
        this.clearError(obj);
    }

    async numeric(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);
        const parsed = parseFloat(data);

        if (isNaN(parsed)) {
            return this.registerError(obj);
        }
        this.setData(obj, parsed);

        this.clearError(obj);
    }

    async integer(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);
        const parsed = parseInt(data);

        if (isNaN(parsed)) {
            return this.registerError(obj);
        }
        this.setData(obj, parsed);

        this.clearError(obj);
    }

    async string(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        if (typeof this.getData(obj) !== "string") {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async file(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        const data = this.getData(obj);

        if (
            Array.isArray(data) &&
            data.length > 0 &&
            data[data.length - 1] instanceof File
        ) {
            this.setData(obj, data[data.length - 1]);
        } else if (data instanceof File || data instanceof FileList) {
            if (data instanceof FileList && data.length > 0) {
                this.setData(obj, data[data.length - 1]);
            }
            return this.clearError(obj);
        }

        this.registerError(obj);
    }

    async files(obj: ValidationObjectContainerType) {
        const data: any = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        if (data instanceof File) {
            return this.setData(obj, [data]);
        } else if (Array.isArray(data)) {
            if (data.every((item) => item instanceof File)) {
                return this.clearError(obj);
            }
        } else if (data && data.length > 0 && data[0] instanceof FileList) {
            return this.clearError(obj);
        }

        this.registerError(obj);
    }

    async boolean(obj: ValidationObjectContainerType) {
        let value = this.getData(obj);
        if (typeof value === "string") {
            this.setData(obj, ["true", "1"].includes(value.toLowerCase()));
        } else if (typeof value !== "boolean") {
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
    async trim(obj: ValidationObjectContainerType) {
        const value = this._data[obj.attribute];

        if (typeof value === "string") {
            this.setData(obj, value.trim());
        }
    }

    async capitalize(obj: ValidationObjectContainerType, type: any) {
        this.trim(obj);
        const value = this._data[obj.attribute];

        if (value) {
            if (type === "all") this.setData(obj, value.toUpperCase());
            else if (type === "none") this.setData(obj, value.toLowerCase());
            else
                this.setData(
                    obj,
                    value.replace(/\b([a-z])/g, ($1: string) =>
                        $1.toUpperCase()
                    )
                );
        }
    }

    async format_date(obj: ValidationObjectContainerType, format: any) {
        if (!["date", "datetime", "time"].includes(obj.type)) {
            throw new ValidationError(
                "format_date after declaring date, datetime or time type"
            );
        }
        const placeholders: Record<string, string> = {
            date: "yyyy-mm-dd",
            datetime: "yyyy-mm-dd h:i:s a",
            time: "h:i:s a",
        };

        const type = obj.type;

        if (typeof format !== "string") {
            format = placeholders[obj.type];
        }

        if (obj.type !== "date") {
            this.date(obj);
        }

        const date = new Date(this.getData(obj));

        const padZero = (n: number) => (n < 10 ? `0${n}` : n);

        const yyyy = date.getFullYear();
        const mm = padZero(date.getMonth() + 1);
        const dd = padZero(date.getDate());
        const hours = date.getHours();
        let a = "am";
        let A = "AM";
        let h: string | number = hours;

        if (h > 12) {
            h -= 12;
            a = "pm";
            A = "PM";
        }
        h = padZero(h);
        const H = padZero(hours);
        const s = date.getSeconds();
        const pattern = /([a-zA-Z]+)/g;

        const dateObj: Record<string, any> = {
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

        const splitPlaceholder: any[] | null =
            placeholders[obj.type].match(pattern);

        const invalidFormats = m.filter(
            (item: string) =>
                (splitPlaceholder &&
                    !splitPlaceholder.includes(item.toLowerCase())) ||
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
            const formatted = format.replace(pattern, (_: string, $1: string) =>
                $1 in dateObj ? dateObj[$1] : $1
            );
            const matched = m.filter((item: string) => item in dateObj);

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
    async fill(obj: ValidationObjectContainerType, [initial]: [any]) {
        const value: any = this.getData(obj);

        if (this.empty(value)) {
            this.setData(obj, initial);
        }
    }

    async if_empty(obj: ValidationObjectContainerType, [initial]: [any]) {
        if (typeof initial !== "string") {
            throw new ValidationError("if_empty argument is not accepted");
        }

        const value = this.getData(obj);

        if (typeof value === "string" && value.trim() === "") {
            this.setData(obj, initial);
        }
    }

    async filled(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        const data = this._data[obj.attribute];

        const matcher = [
            data === undefined,
            data === null,
            data === "",
            Array.isArray(data) && data.length === 0,
            typeof data === "object" && data && Object.keys(data).length === 0,
        ];

        if (matcher.some((item) => item === true)) {
            this.registerError(obj);
        }
    }

    async nullable(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        if (!this.getData(obj) && !this._skips.includes(obj.attribute)) {
            this.setData(obj, null);
            this.skipNextValidation(obj);
        }
    }

    async required(obj: ValidationObjectContainerType) {
        const data = this._data[obj.attribute];

        const matcher = [
            data === undefined,
            data === null,
            data === "",
            Array.isArray(data) && data.length === 0,
            typeof data === "object" && Object.keys(data).length === 0,
        ];

        if (matcher.some((item) => item === true)) {
            this.registerError(obj);
        }
    }

    async required_if(
        obj: ValidationObjectContainerType,
        [other, value]: [other: string, value: any]
    ) {
        if (!this.getData(obj) && this._data[other] !== value) {
            this.registerError({ ...obj, other, value });
        } else {
            this.clearError(obj);
        }
    }

    async required_unless(
        obj: ValidationObjectContainerType,
        [other, ...values]: [string, any[]]
    ) {
        const value = this.getData(obj);
        const otherValue = this._data[other];

        if (value && values.includes(otherValue)) {
            return this.clearError(obj);
        }

        this.registerError({ ...obj, other, values: values.join(",") });
    }

    async required_with(
        obj: ValidationObjectContainerType,
        [...values]: [any]
    ) {
        const required_files = [obj.attribute, ...values];
        const value = this.getData(obj);
        const valueData = values.map((item) => this._data[item]);

        if (value && valueData.some((item) => !this.empty(item))) {
            return this.clearError(obj);
        }
        this.registerError({ ...obj, values: values.join(",") });
    }

    async required_with_all(
        obj: ValidationObjectContainerType,
        [...values]: [any]
    ) {
        const required_files = [obj.attribute, ...values];
        const data = required_files.map((item) => this._data[item]);

        if (data.some((item) => this.empty(item))) {
            this.registerError({ ...obj, values: values.join(",") });
        }
    }

    async required_without(
        obj: ValidationObjectContainerType,
        [...values]: [any]
    ) {
        const required_files = [obj.attribute, ...values];
        const data = required_files.map((item) => this._data[item]);

        if (data.every((item) => this.empty(item))) {
            this.registerError({ ...obj, values: values.join(",") });
        }
    }

    async required_without_all(
        obj: ValidationObjectContainerType,
        [...values]: [any]
    ) {
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

    accepted(obj: ValidationObjectContainerType) {
        if (!this._data[obj.attribute]) {
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

    async password(obj: ValidationObjectContainerType) {
        const data = this.getData(obj) ?? "";
       
        if (!/[a-zA-Z]/.test(data)) {
            this.registerError(
                obj,
                this._messages.passworLetters ||
                    this._messages.password ||
                    Validator.default_messages.password.letters
            );
        } else if (!/[a-z]/.test(data) || !/[A-Z]/.test(data)) {
            this.registerError(
                obj,
                this._messages.passwordMixed ||
                    this._messages.password ||
                    Validator.default_messages.password.mixed
            );
        } else if (!/[0-9]/.test(data) || !/[A-Z]/.test(data)) {
            this.registerError(
                obj,
                this._messages.passwordNumbers ||
                    this._messages.password ||
                    Validator.default_messages.password.numbers
            );
        } else if (!/[!@#$^&*()_+<>?\/\\,.+|{}%-`~]/.test(data)) {
            this.registerError(
                obj,
                this._messages.passwordSymbols ||
                    this._messages.password ||
                    Validator.default_messages.password.symbols
            );
        } else if (data.length < 8) {
            this.registerError(
                { ...obj, length: 8 },
                this._messages.passwordLength ||
                    this._messages.password ||
                    Validator.default_messages.password.length
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

    parseInt(num: string | number): number {
        if (typeof num === "string") {
            return parseInt(num);
        }
        return num;
    }


    alpha(
        obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;


        this.trim(obj);
        const data = this.getData(obj).toString();

        if (/^[a-zA-Z]+$/.test(data)) {
            
            return this.clearError(obj);
        }

        this.registerError(obj);
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

    alpha_underscore(
        obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        this.trim(obj);
        const data = this.getData(obj);

        const pattern = /^[a-zA-Z_]$/;

        if (pattern.test(data)) {

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

    alpha_dash(
        obj: ValidationObjectContainerType
    ) {
        if (this.skippedValidation(obj)) return;
       
        this.trim(obj);
        const data = this.getData(obj);

        const pattern = /^[a-zA-Z0-9_-]+$/;

        if (pattern.test(data)) {
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

    alpha_num(
        obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;
        this.trim(obj);

        const data = this.getData(obj);

        this.clearError(obj);

        const pattern = /^[a-zA-Z0-9]+$/;

        if (pattern.test(data)) {

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

    alpha_spaces(
        obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;
       
        this.trim(obj);
        const data = this.getData(obj);

        const pattern = /^[a-zA-Z\s]+$/;

        if (pattern.test(data)) {

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

    async between(
        obj: ValidationObjectContainerType,
        [min, max]: [string | number, string | number]
    ) {
        min = this.parseInt(min);
        max = this.parseInt(max);
        const data = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        min = Math.min(max, min);
        max = Math.max(max, min);

        let error = false;
        switch (obj.type) {
            case "numeric":
                const num = this.parseInt(data);
                error = num < min || num > max;
                break;
            case "string":
            case "array":
                error = data.length < min || data.length > max;
                break;
            case "file":
                if (typeof data === "object") {
                    const file = <Record<string, any>>data;

                    if (typeof file === "object" && file instanceof File) {
                        error = file.size < min || file.size > max;
                    } else if (file instanceof FileList) {
                        error = Array.from(file).some(
                            (file) => file.size < min || file.size > max
                        );
                    }
                }
                break;
        }

        if (error) {
            this.registerError(
                { ...obj, min, max },
                Validator.default_messages.between[obj.type]
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

    async confirmed(obj: ValidationObjectContainerType, other: string) {
        if (this.skippedValidation(obj)) return;

        other =
            typeof other === "string" ? other : obj.attribute + "_confirmation";

        if (this._data[obj.attribute] !== this._data[other]) {
            this._skips.push(other);

            let message =
                this._messages[this.snakeCase(obj.attribute, "confirmed")] ||
                this._messages[obj.attribute + ".confirmed"];

            if (typeof message !== "string") {
                message = Validator.default_messages.confirmed;
            }
            this._errors[other] =
                message || Validator.default_messages.confirmed;
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

    async contains(obj: ValidationObjectContainerType, [value]: [string]) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (typeof data !== "string" || !data.includes(value)) {
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

    async credit_card(obj: ValidationObjectContainerType) {
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

    after(obj: ValidationObjectContainerType, [after]: [string]) {
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
            return console.error(
                "Invalid Validation Rule Syntax, usage example: " +
                    obj.attribute +
                    ": 'date|after:18years'"
            );
        }

        let value = Date.parse(this._data[obj.attribute]);
        if (!isNaN(value)) {
            // value = new Date(value);

            let digits: string | number = mtch[1];
            let text = mtch[2];
            const timers: Record<string, number> = {
                year: 1000 * 60 * 60 * 24 * 365, // 1000 * 60*60*24*365
                month: 1000 * 60 * 60 * 24 * 7 * 4, // 1000 * 60 * 60 * 60 * 24 * 7 * 4
                week: 1000 * 60 * 60 * 24 * 7,
                day: 1000 * 60 * 60 * 24,
                hour: 1000 * 60 * 60,
                minute: 1000 * 60,
                second: 1000,
                millisecond: 1,
            };
            digits = this.parseInt(digits);

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

    async before(obj: ValidationObjectContainerType, [before]: [string]) {
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
            return console.error(
                "Invalid Validation Rule Syntax, usage example: " +
                    obj.attribute +
                    ": 'date|before:45years'"
            );
        }

        const value = Date.parse(this._data[obj.attribute]);
        if (!isNaN(value)) {
            let digits: number | string = mtch[1];
            let text: string = mtch[2];
            const timers: Record<string, any> = {
                year: 1000 * 60 * 60 * 24 * 365,
                month: 1000 * 60 * 60 * 24 * 7 * 4,
                week: 1000 * 60 * 60 * 24 * 7,
                day: 1000 * 60 * 60 * 24,
                hour: 1000 * 60 * 60,
                minute: 1000 * 60,
                second: 1000,
                millisecond: 1,
            };
            digits = this.parseInt(digits);

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

    async email(obj: ValidationObjectContainerType) {
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

    async ends_with(
        obj: ValidationObjectContainerType,
        ...values: string[] | number[]
    ) {
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

    async in(obj: ValidationObjectContainerType, ...values: string[]) {
        if (this.skippedValidation(obj)) return;

        if (!values.includes(this.getData(obj))) {
            this.registerError({ ...obj, values: values.join(", ") });
        } else {
            this.clearError(obj);
        }
    }

    async in_array(obj: ValidationObjectContainerType, ...values: any[]) {
        if (this.skippedValidation(obj)) return;

        if (!values.includes(this.getData(obj))) {
            this.registerError({ ...obj, values: values.join(", ") });
        } else {
            this.clearError(obj);
        }
    }

    /** */

    async json(obj: ValidationObjectContainerType) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        try {
            JSON.parse(data);
            this.clearError(obj);
        } catch (e) {
            this.registerError(obj);
        }
    }

    async lowercase(obj: ValidationObjectContainerType) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (typeof data !== "string" || !/^[a-z]+$/.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async max(obj: ValidationObjectContainerType, [max]: [string | number]) {
        max = this.parseInt(max);
        const data: any = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let error = false;
        switch (obj.type) {
            case "numeric":
                const num = this.parseInt(data);
                if (num) {
                    error = num >= max;
                }
                break;
            case "file":
                if (typeof data === "object" && data instanceof File) {
                    error = data.size >= max;
                }
                break;
            case "files":
                const file = <{ size: number }[]>data;
                error = Array.from(file).some((file) => file.size >= max);
                break;
            case "string":
            case "array":
                error = data.length >= max;
                break;
        }

        if (error) {
            this.registerError(
                { max, ...obj },
                Validator.default_messages.max[obj.type]
            );
        } else {
            this.clearError(obj);
        }
    }

    async mimes(obj: ValidationObjectContainerType, ...mimes: string[]) {
        const data: any = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        let error = false;

        switch (obj.type) {
            case "file":
                error = !mimes.includes(data.type);
                break;
            case "files":
                const files = <{ type: string }[]>data;
                error = Array.from(files).some(
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

    async min(obj: ValidationObjectContainerType, [min]: [string | number]) {
        min = this.parseInt(min);
        const data: any = this.getData(obj);

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
                const files = <{ size: number }[]>data;
                error = Array.from(files).some((file) => file.size < min);
                break;
            case "string":
            case "array":
                error = data.length < min;
                break;
        }

        if (error) {
            this.registerError(
                { ...obj, min },
                Validator.default_messages.min[obj.type]
            );
        } else {
            this.clearError(obj);
        }
    }

    async multiple_of(
        obj: ValidationObjectContainerType,
        [num]: [string | number]
    ) {
        num = this.parseInt(num);
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (typeof data === "number" && data % num !== 0) {
            this.registerError({ ...obj, num });
        } else {
            this.clearError(obj);
        }
    }

    async not_contains(obj: ValidationObjectContainerType, [value]: [string]) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (typeof data === "string" && data.includes(value)) {
            this.registerError({ ...obj, value });
        } else {
            this.clearError(obj);
        }
    }

    async not_in(obj: ValidationObjectContainerType, ...values: string[]) {
        if (this.skippedValidation(obj)) return;

        if (values.includes(this.getData(obj))) {
            this.registerError({ ...obj, values: values.join(", ") });
        } else {
            this.clearError(obj);
        }
    }

    async phone(obj: ValidationObjectContainerType) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async range(
        obj: ValidationObjectContainerType,
        [min, max]: [string | number, string | number]
    ) {
        min = this.parseInt(min);
        max = this.parseInt(max);
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (typeof data === "number") {
            if (data < min || data > max) {
                this.registerError({ ...obj, min, max });
            } else {
                this.clearError(obj);
            }
        } else {
            this.registerError({ ...obj, min, max });
        }
    }

    async regex(obj: ValidationObjectContainerType, regex: string | RegExp) {
        if (this.skippedValidation(obj)) return;
        const data = this.getData(obj);

        if (!(regex instanceof RegExp)) {
            if (typeof regex !== "string") {
                throw new ValidationError("Invalid Regular Expression");
            }
            regex = new RegExp(regex);
        }

        if (!data || !regex.test(data)) {
            this.registerError({ ...obj, regex });
        } else {
            this.clearError(obj);
        }
    }

    async same(obj: ValidationObjectContainerType, other: string) {
        if (this.skippedValidation(obj)) return;

        if (this.getData(obj) !== this._data[other]) {
            this.registerError({ ...obj, other });
        } else {
            this.clearError(obj);
        }
    }

    async starts_with(obj: ValidationObjectContainerType, ...values: string[]) {
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

    async uppercase(obj: ValidationObjectContainerType) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        if (typeof data !== "string" || !/^[A-Z]+$/.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async uuid(obj: ValidationObjectContainerType) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (typeof data !== "string" || !uuidRegex.test(data)) {
            this.registerError(obj);
        } else {
            this.clearError(obj);
        }
    }

    async url(obj: ValidationObjectContainerType) {
        const data = this.getData(obj);
        if (this.skippedValidation(obj)) return;

        try {
            new URL(data);
            this.clearError(obj);
        } catch (_) {
            this.registerError(obj);
        }
    }

    async ip(obj: ValidationObjectContainerType) {
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

    async gt(obj: ValidationObjectContainerType, gt: string | number) {
        gt = this.parseInt(gt);
        const data: any = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let error = false;
        switch (obj.type) {
            case "numeric":
                const num = <number>data;
                error = num <= gt;
                break;
            case "file":
                error = data instanceof File ? 1 <= gt : data.length <= gt;
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

    async gte(obj: ValidationObjectContainerType, gte: string | number) {
        gte = this.parseInt(gte);
        const data: any = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let error = false;
        switch (obj.type) {
            case "numeric":
                error = data < gte;
                break;
            case "file":
                error = data instanceof File ? 1 < gte : data.length < gte;
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

    async lt(obj: ValidationObjectContainerType, lt: string | any) {
        lt = this.parseInt(lt);
        const data: any = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let error = false;
        switch (obj.type) {
            case "numeric":
                error = data >= lt;
                break;
            case "file":
                error = data instanceof File ? 1 >= lt : data.length >= lt;
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

    async lte(obj: ValidationObjectContainerType, lte: string | number) {
        lte = this.parseInt(lte);
        const data: any = this.getData(obj);

        if (this.skippedValidation(obj)) return;

        let error = false;
        switch (obj.type) {
            case "numeric":
                error = data > lte;
                break;
            case "file":
                error = data instanceof File ? 1 > lte : data.length > lte;
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

    async active_url(obj: ValidationObjectContainerType) {
        try {
            await fetch(this._data[obj.attribute]);
        } catch (e) {
            this.registerError(obj);
        }
    }

    async digits(obj: ValidationObjectContainerType, digits: string | number) {
        digits = this.parseInt(digits);
        let data = `${this._data[obj.attribute]}`;

        if (!isNaN(digits) && data.length === digits) {
            return this.clearError(obj);
        }
        this.registerError({ ...obj, digits });
    }

    async image(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        // image formats
        const formats = ["image/jpg", "image/png", "image/gif", "image/jpeg"];
        const data: any = this._data[obj.attribute];

        if (["file", "files"].includes(obj.type)) {
            if (
                (Array.isArray(data) &&
                    data.every((item) => formats.includes(item.type))) ||
                (data instanceof File && formats.includes(data.type)) ||
                (data instanceof FileList &&
                    Array.from(data).every((file: { type: string }) =>
                        formats.includes(file.type)
                    ))
            ) {
                return this.clearError(obj);
            }
        }

        this.registerError(obj);
    }

    audio(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        // audio formats
        const formats = ["image/jpg", "image/png", "image/gif", "image/jpeg"];
        const data: any = this._data[obj.attribute];

        if (["file", "files"].includes(obj.type)) {
            if (
                (data instanceof File && formats.includes(data.type)) ||
                (data instanceof FileList &&
                    Array.from(data).every((file: { type: string }) =>
                        formats.includes(file.type)
                    ))
            ) {
                return this.clearError(obj);
            }
        }

        this.registerError(obj);
    }

    async video(obj: ValidationObjectContainerType) {
        if (this.skippedValidation(obj)) return;

        // video formats
        const formats = ["image/jpg", "image/png", "image/gif", "image/jpeg"];
        const data: any = this._data[obj.attribute];

        if (["file", "files"].includes(obj.type)) {
            if (
                (data instanceof File && formats.includes(data.type)) ||
                (data instanceof FileList &&
                    Array.from(data).every((file: { type: string }) =>
                        formats.includes(file.type)
                    ))
            ) {
                return this.clearError(obj);
            }
        }

        this.registerError(obj);
    }

    async pattern(obj: ValidationObjectContainerType, pattern: string) {
        if (this.skippedValidation(obj)) return;

        const indicators: Record<string, any> = {
            z: /^[a-z]$/,
            Z: /^[A-Z]$/,
            9: /^[0-9]$/,
            "*": /^[a-zA-Z0-9]$/,
        };

        let data = this.getData(obj);

        if (data) {
            const splitData = data.toString().trim().split("");
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

    static addCustomRules(
        rules: Record<string, RuleCallbackType>,
        messages: { [x: string]: string } = {},
        registry = null
    ) {
        let message;
        if (typeof messages !== "object" || messages === null) {
            throw new ValidationError(
                `Custom Messages must be an object but ${
                    messages === null ? "null" : typeof messages
                } was provided`
            );
        }
        if (typeof rules !== "object" && rules === null) {
            throw new ValidationError(
                `Custom validation Rules must be an object, but ${
                    rules === null ? "null" : typeof rules
                } provided`
            );
        }
        for (const [key, callback] of Object.entries(rules)) {
            if (typeof callback === "function") {
                const that: Record<string, any> = this;
                this._customValidators[key] = callback;

                if (
                    typeof registry === "string" &&
                    this.registers[registry]
                ) {
                    const entries = Object.entries(this.registers).map(
                        (reg, items: any) => [
                            reg,
                            items.filter((item: any) => key !== item),
                        ]
                    );
                    this.registers = Object.fromEntries(entries);

                    this.registers[registry].push(key);
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

    /**
     *
     * Converts regular data into FormData,
     * which is often required for file uploads
     * or sending data in POST requests
     *
     * @param {*} data
     * @returns
     */

    convertDataToFormData(data: { [x: string]: any }) {
        const formData = new FormData();

        for (const [key, value] of Object.entries(data)) {
            if (value instanceof FileList) {
                Array.from(value).forEach((file) => {
                    formData.append(`${key}[]`, file);
                });
            } else if (
                Array.isArray(value) &&
                value.every((file) => file instanceof File)
            ) {
                value.forEach((file) => {
                    formData.append(`${key}[]`, file);
                });
            } else {
                formData.append(key, value);
            }
        }
        return formData;
    }

    /**
     *
     * Loops through the rules and applies the necessary validation for each attribute
     */

    parseRules(rules: ValidationRuleType) {
        for (const [attribute, rule] of Object.entries(rules)) {
            this.start({
                rule,
                attribute,
            });
        }
    }

    /**
     * Infers the type of the data (e.g., array, object, numeric, file, etc.)
     *
     * @param {*} data
     * @returns
     */

    detectType(data: any) {
        if (data === null) return "any";
        else if (Array.isArray(data)) return "array";
        else if (typeof data === "object") return "object";
        else if (typeof data === "number") return "numeric";
        else if (data instanceof File) return "file";
        else if (data instanceof FileList) return "files";
        else if (typeof data === "string") return "string";
        return "any";
    }

    /**
     * Orders the properties of an array or object based on specified patterns.
     *
     * @param {Array|Object} input - The array or object to be categorized and ordered.
     * @returns {Array|Object} - A new array or object with properties ordered according to the patterns.
     */
    orderRules(
        input: { [x: string]: any } | string
    ): any[] | { [x: string]: any } | void {
        const Pattern = (arr: string[]) => new RegExp(`^(${arr.join("|")})$`);
        const patterns = {
            datatypes: Pattern(Validator.registers.types),
            sanitizers: Pattern(Validator.registers.sanitizers),
            fillables: Pattern(Validator.registers.fillables),
        };

        let cacheKey = input.toString();
        if (
            typeof input === "object" &&
            input !== null &&
            !Array.isArray(input)
        ) {
            cacheKey = Object.keys(input).join("_");
        }

        if (cacheKey && cache.has(cacheKey)) {
            const cached = cache.get(cacheKey);

            return cached;
        }

        if (typeof input === "string") {
            const rules: { [x: string]: any } = {};
            const split = input.split("|");
            split.forEach((item) => {
                const divide = item.split(":");
                let args: string[] | boolean;
                let rule = divide[0];

                args = divide.length > 1 ? divide[1].split(",") : true;
                rules[rule] = args;
            });
            return this.orderRules(rules);
        }
        if (typeof input !== "object" || input === null) {
            console.error("Input must be an array or an object");
            return;
        }
        if (Object.keys(input).length === 0) {
            console.error("Validation rule was not provided");
            return;
        }

        const categorized = this.categorizeRules(input, patterns);

        const orderedRules = Array.isArray(input)
            ? this.createOrderedArray(categorized)
            : this.createOrderedObject(categorized, input);

        if (cacheKey) {
            cache.set(cacheKey, orderedRules);
        }

        return orderedRules;
    }

    categorizeRules(
        input: { [x: string]: any },
        patterns: { [x: string]: any }
    ) {
        const categorized: { [x: string]: any[] } = {
            datatypes: [],
            sanitizers: [],
            fillables: [],
            others: [],
        };

        (Array.isArray(input) ? input : Object.keys(input)).forEach((item) => {
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

    createOrderedArray(categorized: { [x: string]: any[] }) {
        let order: string[] = [];

        ["datatypes", "sanitizers", "fillables"].forEach((key) => {
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

    createOrderedObject(
        categorized: { [x: string]: { [x: string]: any } },
        input: { [x: string]: any }
    ) {
        const orders = {};

        ["datatypes", "sanitizers", "fillables"].forEach((order) => {
            const item = categorized[order].map((key: string) => [
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
                categorized.others.map((key: string) => [key, input[key]])
            ),
            successfully__passed__validation: true,
        };
    }

    appendRule(
        attribute: string,
        rule: string,
        callback: (method: any, args: any) => void,
        args: any[]
    ) {
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

    start({ rule, attribute }: { rule: any; attribute: string }) {
        const fail = (message: any) => {
            throw new KnownError(message);
        };

        rule = this.orderRules(rule);

        const type = this.inferType({ rule, attribute });

        const processItem = async (method: any, args: any) => {
            const fnc =
                typeof method === "function"
                    ? method
                    : typeof args === "function"
                    ? args
                    : false;

            const law = {
                method,
                fnc,
                args,
                fail,
                attribute,
                type,
            };

            return await this.enact(law);
        };

        if (Array.isArray(rule)) {
            for (const method of rule) {
                let rule = method;
                if (typeof method === "function") {
                    rule = method.name;
                }
                this.appendRule(attribute, rule, processItem, [method]);
            }
        } else if (typeof rule === "object") {
            for (const [method, args] of Object.entries(rule)) {
                if (typeof args === "function") {
                    const callback = <RuleCallbackType>args;
                    Validator.addCustomRules({ [method]: callback });
                }

                this.appendRule(attribute, method, processItem, [method, args]);
            }
        } else {
            throw new ValidationError("Failed to process validation rules");
        }
    }

    inferType({rule, attribute}: {rule?:string, attribute:string}) {
        const types = Validator.registers.types;
        if (!rule) {
            return;
        }

        const matchedType = (
            Array.isArray(rule) ? rule : Object.keys(rule)
        ).find((item) => types.includes(item));

        if (matchedType) {
            return matchedType;
        }
        const data: any = this.getData({attribute});

        if (Array.isArray(data))
            return data.every((file) => file instanceof File)
                ? "files"
                : "array";
        else if (typeof data === "object" && data !== null) return "object";
        else if (typeof data === "number") return "numeric";
        else if (data instanceof File) return "file";
        else if (data instanceof FileList) return "files";
        else if (typeof data === "string") return "string";
        return "any";
    }

    async enact({
        method,
        attribute,
        args,
        fnc,
        type,
        required,
        fail,
    }: ValidationObjectContainerType) {
        let rule: BaseValidationRule | null = null;

        if (typeof method === "string") {
            rule = <BaseValidationRule>method;

            if (method.indexOf(":") >= 0) {
                const divide = method.split(":");
                args = [];
                rule = <BaseValidationRule>divide[0];

                if (divide.length > 1) {
                    args = args[1].split(",");
                }
            }
        } else if (typeof method === "function") {
            const func: { name: string } = method;
            rule = <BaseValidationRule>func.name;
        }

        let message = `validation.${
            rule ||
            "custom" + (typeof method === "function" ? "Callback" : "Rule")
        }`;

        const errorMessage = () => {
            if (typeof rule !== "string") {
                return message;
            }
            return (
                this._messages[this.snakeCase(attribute, rule)] ||
                this._messages[attribute + "." + rule] ||
                (typeof Validator.default_messages[rule] === "string"
                    ? Validator.default_messages[rule]
                    : message)
            );
        };

        const apply_callback = async (
            fnc: RuleCallbackType,
            message: string
        ) => {
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

                if (response === false || typeof response === "string") {
                    throw new KnownError(response || errorMessage());
                }
                return response;
            } catch (err) {
                this._errors[attribute] = message;

                if (
                    err instanceof KnownError &&
                    typeof err.message === "string"
                ) {
                    this._errors[attribute] = err.message;
                } else if (err instanceof ValidationError) {
                    throw new ValidationError(err.message);
                } else {
                    this._errors[attribute] = errorMessage();
                }
            }
        };

        try {
            if (typeof fnc === "function") {
                if (this.skippedValidation({ attribute, required })) return;

                await apply_callback(fnc, message);
            } else if (rule && rule in this) {
                const obj: ValidationObjectContainerType = {
                    rule: <BaseValidationRule>rule,
                    method: rule,
                    attribute,
                    type,
                    required,
                    fail,
                };

                const newargs : any[] = [
                    {
                        rule,
                        method: rule,
                        attribute,
                        type,
                        required,
                        fail,
                    }
                ];
                if (Array.isArray(args)) {
                    args.forEach(arg => {
                        newargs.push(arg);
                    })
                }

                const fun = this[rule];
                // if (!Array.isArray(args)) {
                //     args = [];
                // }
                // if (args) {
                //     await fun(obj, args.length === 1 ? '');
                // }
                // else if (!args) {
                //     await fun(obj, true);
                // }
                await fun.apply(this, obj, ...newargs);

                
            } else if (typeof rule === "string") {
                const fnc = rule;
                let matched = false;
                
                if (typeof Validator._customValidators[rule] === "function") {
                    message =
                        this._messages[this.snakeCase(attribute, rule)] ||
                        this._messages[attribute + "." + rule] ||
                        Validator.default_messages[rule] ||
                        "validation." + rule;

                    await apply_callback(Validator._customValidators[rule], message);
                    matched = true;
                }
                if (!matched) {
                    throw new ValidationError(`Validation Rule "${rule}" is not defined`);
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

    skippedValidation({
        attribute,
        required = false,
    }: {
        attribute: any;
        required?: boolean;
    }) {
        return (
            this._skips[attribute] ||
            (!this._data[attribute] && !required) ||
            attribute in this._errors
        );
    }

    registerError(
        obj: ValidationObjectContainerType & { [x: string]: any },
        message?: string
    ) {
        message =
            message ||
            this._messages[this.snakeCase(obj.attribute, obj.method)] ||
            this._messages[obj.attribute + "." + obj.method];

        this.skipNextValidation(obj);

        if (!message) {
            message = Validator.default_messages[obj.method];

            if (typeof message === "object") {
                message = message[obj.type];
            }
        }
        message = message || `validation.${obj.attribute}.${obj.method}`;

        const attr = this._attributes[obj.attribute] || obj.attribute;
        message = message.replace(/:([a-zA-Z_]+)/g, (_, key) => {
            if (obj[key]) {
                return attr[obj[key]] || obj[key];
            }

            return key;
        });
        this._errors[obj.attribute] = message;
    }

    getData({attribute}: {attribute: string}) {
        return this._data[attribute];
    }

    setData(obj: ValidationObjectContainerType, value: any) {
        this._data[obj.attribute] = value;
    }

    skipNextValidation(obj: ValidationObjectContainerType) {
        this._skips.push(obj.attribute);
    }

    clearError(obj: ValidationObjectContainerType) {
        if (this._errors[obj.attribute]) {
            delete this._errors[obj.attribute];
        }
    }

    /**
     * @param obj {Object}
     *
     * @usage
     * Validator.setAttributes({
     *    name: 'Full Name',
     *    email: 'Email Address'
     * });
     *
     * @returns void
     */

    setAttributes(obj: { [x: string]: any }) {
        if (typeof this._attributes !== "object" || this._attributes === null) {
            this._attributes = {
                name: "Full Name",
                email: "Email Address",
            };
        }

        if (typeof obj === "object" && obj !== null) {
            this._attributes = {
                ...this._attributes,
                ...obj,
            };
        }

        return this;
    }

    snakeCase(...args: string[]) {
        return args
            .map((arg, i) =>
                i === 0
                    ? arg.toLowerCase()
                    : arg.charAt(0).toUpperCase() + arg.slice(1).toLowerCase()
            )
            .join("");
    }

    empty(data: any) {
        const matcher = [
            data === undefined,
            data === null,
            typeof data === "string" && data.trim() === "",
            Array.isArray(data) && data.length === 0,
            typeof data === "object" && data && Object.keys(data).length === 0,
        ];

        return matcher.some((item) => item);
    }
}
