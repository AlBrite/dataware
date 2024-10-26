import utils from "../core/utils";
import cookie from "../core/cookie";
const authCookieName = "AUTH_TOKEN";
const xsrfCookieName = "XSRF-TOKEN";
const xsrfHeaderName = "X-XSRF-TOKEN";
const xcrf = cookie.read(xsrfCookieName);
const auth = cookie.read(authCookieName);
const authKey = "authorization";

const initialize = () => {
    if (!utils.isObject(utils.global)) {
        return;
    }
    const options = utils.global.__$formguard_request_options;
    utils.global.__$formguard_request_options = {
        "Content-Type": "application/json",
        Accept: "application/json",
        auths: {},
        ...(utils.isPlainObject(options) ? options : {}),
    };
};

initialize();

const setHeaders = (callback) => {
    if (!utils.isFunction(callback)) {
        throw new TypeError(
            `The first argument expects a function, but ${typeof callback} was provide`
        );
    }
    initialize();
    try {
        callback(utils.global.__$formguard_request_options);

        const replacements = {
            contentType: "Content-Type",
        };

        for (const [replace, replacement] of Object.entries(replacements)) {
            const data = utils.global.__$formguard_request_options[replace];
            if (!utils.isUndefined(data)) {
                utils.global.__$formguard_request_options[replacement] = data;
                delete utils.global.__$formguard_request_options[replace];
            }
        }
    } catch (e) {
        console.warn(e);
    }
};

const getHeaders = () => {
    initialize();
    const { auths, ...headers } = normalizeHeaders();

    return headers;
};

const normalizeHeaders = () => {
    if (utils.isPlainObject(utils?.global?.__$formguard_request_options)) {
        return utils.global.__$formguard_request_options;
    }
    return {};
};

const _setAuth = (tokenOrCallback, options) => {
    try {
        initialize();

        const config = {
            key: authKey,
            type: "Bearer",
            ...(utils.isPlainObject(options) ? options : {}),
        };

        let token;
        const parseBearer = (token) =>
            (!/\s*(Bearer|Basic)\s+([a-zA-Z0-9_]+)/.test(token)
                ? config.type + " "
                : "") + token;

        if (!utils.isString(config.key)) {
            throw new TypeError(
                `Second argument expects a string, but ${typeof config.key} was provided`
            );
        }

        if (utils.isString(tokenOrCallback)) {
            token = parseBearer(tokenOrCallback);
        } else if (utils.isFunction(tokenOrCallback)) {
            const resp = tokenOrCallback(cookie);

            if (utils.isString(resp)) {
                token = parseBearer(resp);
            }
        }
        if (token) {
            utils.global.__$formguard_request_options.auths[config.key] = token;
        }
    } catch (e) {
        console.warn(e);
    }
};

const setAuth = {
    bearer: (tokenOrCallback, key = authKey) =>
        _setAuth(tokenOrCallback, {
            key,
            type: "Bearer",
        }),
    basic: (tokenOrCallback, key = authKey) =>
        _setAuth(tokenOrCallback, {
            key,
            type: "Basic",
        }),
    set: _setAuth,
};

const clearAuth = (name) => {
    const headers = normalizeHeaders();

    if (utils.isString(name)) {
        throw new TypeError(
            `First Argument expects a string, while ${typeof name} was provided`
        );
    }

    if (
        utils.isPlainObject(headers.auths) &&
        utils.isString(headers.auths[name])
    ) {
        delete utils.global.__$formguard_request_options.auths[name];
    }
};

const getAuth = (name) => {
    initialize();
    const headers = normalizeHeaders();

    if (
        utils.isString(name) &&
        utils.isPlainObject(headers.auths) &&
        utils.isString(headers.auths[name])
    ) {
        return headers.auths[name];
    }
    return null;
};

const http = (method) => {
    if (!utils.isString(method)) {
        throw new TypeError("Method must be a string");
    }

    method = (method || "GET").toUpperCase();
    const validMethods = [
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS",
        "PATCH",
    ];

    if (!validMethods.includes(method)) {
        console.error(
            `Invalid method: ${method}. POST method was used instead`
        );
        method = "POST";
    }

    return async (url, data = null, options = {}) => {
        const defaults = {
            data,
            authKey,
            authType: "Bearer",
            contentType: "application/json",
            dataType: "json",
            headers: {},
            timeout: null,
            retryLimit: 3,
            maxDelay: 60000,
            onSuccess: null,
            onError: null,
            onFinish: null,
        };

        if (utils.isFunction(data)) {
            options = { onSuccess: data, data: null };
        } else if (utils.isFunction(options)) {
            options = { onSuccess: options };
        }
        if (!utils.isObject(options) || utils.isArray(options)) {
            throw new TypeError(
                "Second parameter expects either a function or an object"
            );
        }

        // Merge user options with defaults
        const config = {
            ...defaults,
            ...(utils.isObject(options) ? options : {}),
        };

        if (!url) throw new Error("URL is required");

        const fetchOptions = {
            method: method,
            credentials: "include",
            headers: {
                ...getHeaders(),
                ...config.headers,
                ...(utils.isFormData(config.data)
                    ? {}
                    : { "Content-Type": config.contentType }),
                "X-REQUESTED-WITH": "XMLHttpRequest",
            },
            body: null,
        };
        const csrfToken = cookie.read(xsrfCookieName);

        if (csrfToken && config.xsrfHeaderName) {
            fetchOptions.headers[xsrfHeaderName] = csrfToken;
        }

        const authToken = getAuth(config.authKey);

        if (authToken) {
            fetchOptions.headers.Authorization = authToken;
        }

        if (method === "GET" || method === "HEAD") {
            if (utils.isFormData(config.data))
                throw new Error(`Unsupported Data`);
            if (config.data)
                url += `?${new URLSearchParams(config.data).toString()}`;
        } else {
            fetchOptions.body = utils.isFormData(config.data)
                ? config.data
                : JSON.stringify(config.data);
        }

        console.log({ fetchOptions, data: config.data, url });

        const controller = new AbortController(); // To handle timeout
        let attempts = 0;

        const makeRequest = async (timeout) => {
            attempts++;
            let timeoutId;
            if (utils.isNumber(timeout)) {
                timeoutId = setTimeout(() => controller.abort(), timeout);
            }
            try {
                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal,
                });
                let responseData;

                // Handle different data types based on the expected response
                if (config.dataType === "json") {
                    responseData = await response.json().catch(() => ({}));
                } else if (config.dataType === "text") {
                    responseData = await response.text();
                } else if (config.dataType === "blob") {
                    responseData = await response.blob();
                } else {
                    console.error(`Unsupported dataType: ${config.dataType}`);
                    throw new Error(`Unsupported dataType: ${config.dataType}`);
                }
                console.error(responseData);

                if (!response.ok) {
                    if (
                        config.dataType === "json" &&
                        !utils.isPlainObject(responseData)
                    ) {
                        responseData = { error: "An error occur" };
                    }
                    if (utils.isFunction(config.onError)) {
                        return config.onError(responseData);
                    } else {
                        throw responseData;
                    }
                }

                if (
                    utils.isString(config.authKey) &&
                    utils.isObject(responseData) &&
                    utils.isString(responseData[config.authKey])
                ) {
                    cookie.write(
                        authCookieName,
                        config.authType + " " + responseData[config.authKey]
                    );
                }
                const setOptions = {
                    clearAuth,
                    cookie,
                    setAuth,
                };

                if (utils.isFunction(config.onSuccess))
                    return config.onSuccess(responseData, { ...setOptions });
                return responseData;
            } catch (error) {
                let errorMessage = error;
                console.error({ errorMessage });

                if (config.dataType === "json" && !utils.isPlainObject(error)) {
                    errorMessage = { message: "An Error occurred!" };
                }

                if (
                    utils.isObject(error) &&
                    !utils.isPlainObject(error) &&
                    error.name === "AbortError"
                ) {
                    if (error.message) {
                        errorMessage = error.message;

                        if (
                            config.dataType === "json" &&
                            !utils.isPlainObject(errorMessage)
                        ) {
                            errorMessage = { message: "An Error occured" };
                        }
                    }

                    if (config.retryLimit && attempts < config.retryLimit) {
                        console.warn(
                            `Request timed out. Retrying... (${attempts}/${config.retryLimit})`
                        );
                        let delay = timeout;

                        delay = Math.min(
                            config.timeout * 2 ** attempts,
                            config.maxDelay
                        );

                        return await makeRequest(delay);
                    } else if (config.retryLimit === null) {
                        const timeoutError = new Error("Request timed out");
                        if (utils.isFunction(config.onError)) {
                            return config.onError({
                                error: "Request timed out",
                            });
                        } else {
                            throw timeoutError;
                        }
                    } else {
                        const timeoutError = new Error(
                            "Request timed out after multiple attempts"
                        );
                        if (utils.isFunction(config.onError)) {
                            return config.onError({
                                error: "Request timed out after multiple attempts",
                            });
                        } else {
                            throw timeoutError;
                        }
                    }
                }

                if (utils.isFunction(config.onError)) {
                    return config.onError(errorMessage);
                }
                throw errorMessage;
            } finally {
                clearTimeout(timeoutId);
                if (utils.isFunction(config.onFinish)) config.onFinish();
            }
        };

        return await makeRequest();
    };
};

export const request = {
    setHeaders,
    clearAuth,
    setAuth,
    http,
    get: http("get"),
    post: http("post"),
    put: http("put"),
    head: http("head"),
    options: http("options"),
    delete: http("delete"),
    patch: http("patch"),
    global: utils.global,
};
