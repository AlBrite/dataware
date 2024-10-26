export class ValidationError extends Error {
    constructor(message:string) {
        super(message);
        this.message = `[@VGuard/Validator]: ${message}`;
        this.name = "ValidationError";
    }
}

export class KnownError extends EvalError {
    constructor(message:string) {
        super(message);
        this.message = message;
        this.name = "KnownError";
    }
}