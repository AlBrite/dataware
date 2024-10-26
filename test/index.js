import { FormGuard } from '../src/main';
// import { request } from "./request";

class Validator extends FormGuard {
    constructor(data, rules = null, messages = {}, attributes = {}) {
        super(data, rules, messages, attributes);
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