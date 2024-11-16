export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.message = `[@VGuard/Validator]: ${message}`;
        this.name = "ValidationError";
    }
}

export class KnownError extends EvalError {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = "KnownError";
    }
}