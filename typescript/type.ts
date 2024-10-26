// Define the types for validation rules
export type BaseValidationRule =
    | "required"
    | "required_if"
    | "required_unless"
    | "required_with"
    | "required_with_all"
    | "required_without"
    | "required_without_all"
    | "trim"
    | "capitalize"
    | "filled"
    | "nullable"
    | "array"
    | "file"
    | "files"
    | "numeric"
    | "string"
    | "accepted"
    | "password"
    | "alpha"
    | "alpha_underscore"
    | "alpha_dash"
    | "alpha_num"
    | "alpha_spaces"
    | "between"
    | "boolean"
    | "confirmed"
    | "contains"
    | "credit_card"
    | "date"
    | "after"
    | "before"
    | "email"
    | "ends_with"
    | "in"
    | "in_array"
    | "json"
    | "lowercase"
    | "max"
    | "mimes"
    | "min"
    | "multiple_of"
    | "not_contains"
    | "not_in"
    | "phone"
    | "range"
    | "regex"
    | "same"
    | "starts_with"
    | "uppercase"
    | "uuid"
    | "url"
    | "ip"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "active_url"
    | "digits"
    | "image"
    | "audio"
    | "video"
    | "integer"
    | "pattern";

export type ValidationDataType =
    | "date"
    | "datetime"
    | "time"
    | "array"
    | "object"
    | "numeric"
    | "integer"
    | "string"
    | "file"
    | "files"
    | "boolean";

type FailCallbackType = (message: string) => void | never | string;

type dataRuleObjectTypes = {
    required: boolean;
    required_if: String[];
    required_unless: String[];
    required_with: String[];
    required_with_all: String[];
    required_without: String[];
    required_without_all: String[];
    trim: boolean;
    capitalize: boolean;
    filled: boolean;
    nullable: boolean;
    array: boolean;
    file: boolean;
    files: boolean;
    numeric: boolean;
    string: boolean;
    accepted: boolean;
    password: boolean;
    alpha: boolean;
    alpha_underscore: boolean;
    alpha_dash: boolean;
    alpha_num: boolean;
    alpha_spaces: boolean;
    between: Number[];
    boolean: boolean;
    confirmed: boolean;
    contains: string;
    credit_card: string;
    date: Date;
    after: string;
    before: string;
    date_format: string;
    email: boolean;
    ends_with: string;
    in: any[];
    in_array: any[];
    json: boolean;
    lowercase: boolean;
    max: number;
    mimes: String[];
    min: number;
    multiple_of: string;
    not_contains: string;
    not_in: any[];
    phone: boolean;
    range: Number[];
    regex: string;
    same: string;
    starts_with: string;
    timezone: string;
    uppercase: boolean;
    uuid: boolean;
    url: boolean;
    ip: boolean;
    gt: number;
    gte: number;
    lt: number;
    lte: number;
    active_url: boolean;
    digits: number;
    image: boolean;
    audio: boolean;
    video: boolean;
    integer: Boolean;
    pattern: string;
};

type dataRuleStringTypes = 
    | `required`
    | `required_if: ${string},${string}`
    | `required_unless: ${string},${string}`
    | `required_with: ${string},${string}`
    | `required_with_all: ${string},${string}`
    | `required_without: ${string},${string}`
    | `required_without_all: ${string},${string}`
    | `trim`
    | `capitalize`
    | `filled`
    | `nullable`
    | `array`
    | `file`
    | `files`
    | `numeric`
    | `string`
    | `accepted`
    | `password`
    | `alpha`
    | `alpha_underscore`
    | `alpha_dash`
    | `alpha_num`
    | `alpha_spaces`
    | `between: ${number},${number}`
    | `boolean`
    | `confirmed`
    | `contains: ${string}`
    | `credit_card: ${string}`
    | `date: ${string}`
    | `after: ${string}`
    | `before: ${string}`
    | `date_format: ${string}`
    | `email`
    | `ends_with: ${string}`
    | `in: ${string},${string}`
    | `in_array: ${string},${string}`
    | `json`
    | `lowercase`
    | `max: ${number}`
    | `mimes: ${string}`
    | `min: ${number}`
    | `multiple_of: ${string}`
    | `not_contains: ${string}`
    | `not_in: ${string},${string}`
    | `phone`
    | `range: ${number},${number}`
    | `regex: ${string}`
    | `same: ${string}`
    | `starts_with: ${string}`
    | `timezone: ${string}`
    | `uppercase`
    | `uuid`
    | `url`
    | `ip`
    | `gt: ${number}`
    | `gte: ${number}`
    | `lt: ${number}`
    | `lte: ${number}`
    | `active_url`
    | `digits: ${number}`
    | `image`
    | `audio`
    | `video`
    | `integer`
    | `pattern: ${string}`;

// Type for the validation rule as a string, array, or object
export type ValidationRuleType2 =
    | BaseValidationRule[]
    | `${BaseValidationRule}:${number}` // For rules with a numeric parameter
    | [BaseValidationRule] // For rules in an array
    | { [key in BaseValidationRule]: any }; // For rules in an object



export type InnerCallbackType = {
    value: any, 
    fail?: FailCallbackType,
    request?: {[x: string]:any},
    self?: {data: any, error: any},
    message?: string,
    attribute?: string
};

export type RuleCallbackType = (inner : InnerCallbackType) => any;

export type ValidationRuleType = {
    [key: string]:
        | string
        | RuleCallbackType
        | number
        | [dataRuleStringTypes]
        | dataRuleObjectTypes
        | { [key in BaseValidationRule] : any}
        | Array<dataRuleStringTypes | RuleCallbackType>;
};
// Type for validation messages
export type ValidationMessagesType = {
    [key: string]: string;
};

// Type for validation attributes
export type ValidationAttributesType = {
    [key: string]: string;
};

export type ValidatorRuleChainType = Record<string, { [x: string]: any }[]>;

// type RuleFailCallbackType = ({value:any, fail?})
export type ValidationObjectContainerType = {
    rule?: string,
    value?: any, 
    method:string, 
    attribute:string, 
    args?:string[], 
    fnc?:(message:any)=>void, 
    type:ValidationDataType, 
    required?:boolean, 
    fail?:FailCallbackType
}
