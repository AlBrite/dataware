

import type {
    ValidationDataType,
    ValidationRuleType,
    ValidationMessagesType,
    ValidationObjectContainerType,
    ValidationAttributesType,
    InnerCallbackType,
    ValidatorRuleChainType,
    BaseValidationRule,
    RuleCallbackType,
  } from "../../typescript/type";

  type AddCustomRuleTypes =  {
    fn({
      value, 
      fail,
      query,
      self,
      message,
      attribute
  } : InnerCallbackType): boolean,
    message?: string,
    messages?: {[x : string] : string},
    priority?: 1|2|3|4
  }


export declare class FormGuard {

    constructor(data: { [x: string]: string }, rules: ValidationRuleType, messages?: ValidationMessagesType, attributes?: ValidationAttributesType);

    private init() : void;

    private static log(type:string, ...argsl : any[]) : void;

    private static setSystemMessages(messages:Record<string, string>, name:string) : void;

    private static setMessages(messages:Record<string,string>) : never | void;

    private getUserMessages({attribute, rule, type}, holder, defaultValue) : any;

    private static setLocale(locale : string) : void;

    private data(obj) : any;

    private clearAll() : void;

    validate(attributes: Record<string, any> | undefined) : Promise<any>;

    static make(data: { [x: string]: string }, rules: ValidationRuleType, messages?: ValidationMessagesType, attributes?: ValidationAttributesType) : Promise<any>;

    private blob(obj : ValidationObjectContainerType) : void;

    private date(obj : ValidationObjectContainerType) : void;

    private datetime(obj : ValidationObjectContainerType) : void;

    private time(obj : ValidationObjectContainerType) : void;

    private timestamp(obj)  : void;

    private array(obj) : void;

    private numeric(obj)  : void;

    private integer(obj) : void;

    private string(obj) : void;

    private matchFile(file : any, types : any) : boolean;

    private file(obj, ...types) : any;

    private isFile(data) : boolean;

    private files(obj, ...types) : any;

    private boolean(obj) : any;

    private email(obj) : any;

    private uuid(obj) : any;

    private url(obj) : any;

    private ip(obj) : any;

    private trim(obj) : any;

    private capitalize(obj, type) : any;

    private format_date(obj, format) : any;

    private fill(obj, initial) : any;

    private if_empty(obj, initial) : any;

    private filled(obj) : any;

    private nullable(obj) : any;

    private required(obj) : any;

    private required_if(obj, other, value) : any;

    private required_unless(obj, other, ...values) : any;

    private required_with(obj, ...values) : any;

    private required_with_all(obj, ...values) :any;

    private required_without(obj, ...values) : any;

    private required_without_all(obj, ...values) : any;

    private accepted(obj) : any;

    private password(obj) : any;

    private alpha(obj) : any;

    private clearIF(validated, obj, errorMessage) : any;

    private alpha_underscore(obj) : any;

    private alpha_dash(obj) : any;

    private alpha_num(obj) : any;

    private alpha_spaces(obj) 

    private getSize(obj) : number;

    private between(obj, min, max) : any;

    private confirmed(obj)  : any;

    private contains(obj, value) : any;

    private credit_card(obj) : any;

    private after(obj, after) : any;

    private before(obj, before) : any;

    private ends_with(obj, ...values) : any;

    private in(obj, ...values) : any;

    private in_array(obj, ...values) : any;

    private json(obj) : any;

    private lowercase(obj) : any;

    private max(obj, max) : any;

    private mimes(obj, ...mimes) : any;

    private min(obj, min) : any;

    private multiple_of(obj, number) : any;

    private not_contains(obj, value) : any;

    private not_in(obj, ...values) : any;

    private phone(obj) : any;

    private range(obj, min, max) : any;

    private regex(obj, pattern) : any;

    private same(obj, other) : any;

    private starts_with(obj, ...values) : any;

    private timezone(obj) : any;

    private uppercase(obj) : any;

    private gt(obj, gt) : any;

    private gte(obj, gte) : any;

    private lt(obj, lt) : any;

    private lte(obj, lte) : any;

    private active_url(obj) : any;

    private parseInt(num, message) : any;

    private digits(obj, digits) : any;
    
    private image(obj) : any;

    private audio(obj) : any;

    private video(obj) : any;

    private pattern(obj, pattern) : any;


    hasFile() : boolean;

    private convertDataToFormData(data) 

    private parseRules(rules) : never;

    private detectType(data) : string;

    private orderRules(attribute, input) : any;

    private arrayToObject(input)  : any;

    private categorizeRules(input, patterns) : any;

    private createOrderedArray(categorized) : any;

    private createOrderedObject(categorized, input) : any;

    private appendRule(attribute, rule, callback, methodArgs) 

    private start({ rule, attribute }) : any;

    private inferType(obj) : any;

    private enact({ method, attribute, args, fnc, type, required, fail }) : any;

    private skippedValidation(obj) : any;

    private loadErrorMessage(obj, message) : any;

    private getData(obj) : any;

    private setData(obj, value) : any;

    private removeData(obj) : any;

    private skipNextValidation(obj) : any;

    private clearErrorMessage(obj) : any;

    private hasError(obj) : any;

    private static getKeys(thing)  : any;

    private getAttribute(name) : any;

    private setAttributes(obj) : any;

    private snakeCase(...args) : any;

    private empty(data) : any;

    private loadFallbackMessages(fallback_messages) : any;
    
    private static setPriority(name, priority) : any;

    private static resetPriority(name) : any;

    static remove(name) : any;

    static add(custom_rules : string|{[x : string] : AddCustomRuleTypes}, options? : AddCustomRuleTypes) : any;

    static defineForm(formID, rules, messages, attributes) : any;
    
}

// exist: {
        //     fn: async ({value}) => {
        //         try {
        //             const user = await fetch('/api/user_end_point', {
        //                 body: JSON.stringify({username: value})
        //             });
        //             return user;
        //         } catch(e) {}
        //     },
        //     message: 'User account already exists'
        // },

        // // add others

