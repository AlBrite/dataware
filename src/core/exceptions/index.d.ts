declare class ValidationError extends Error {
    constructor(message:string);
}

declare class KnownError extends EvalError {
    constructor(message:string);
}