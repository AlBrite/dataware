import utils from "../core/utils";
import cookie from "../core/cookie";

const authCookieName = "AUTH_TOKEN";
const xsrfCookieName = "XSRF-TOKEN";
const xsrfHeaderName = "X-XSRF-TOKEN";

export const request = (method) => {
    if (!utils.isString(method)) {
        throw new TypeError("Method must be a string");
    }

    method = (method || "GET").toUpperCase();
    const validMethods = ["GET", "HEAD", "POST", "PUT", "DELETE"];
    if (!validMethods.includes(method)) {
        console.error(
            `Invalid method: ${method}. POST method was used instead`
        );
        method = "POST";
    }

    return async (url, options) => {
        const defaults = {
            data: null,
            authType: "Bearer",
            authKey: null,
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

        if (utils.isFunction(options)) {
            options = { onSuccess: options };
        }
        if (!utils.isObject(options) || utils.isArray(options)) {
            throw new TypeError(
                "Second parameter expects either a function or an object"
            );
        }

        // Merge user options with defaults
        const config = { ...defaults, ...options };

        if (!url) throw new Error("URL is required");

        const fetchOptions = {
            method: method,
            credentials: "include",
            headers: {
                ...(utils.isFormData(config.data)
                    ? {}
                    : { "Content-Type": config.contentType }),
                ...config.headers,
                "X-REQUESTED-WITH": "XMLHttpRequest",
            },
            body: null,
        };
        const csrfToken = cookie.read(xsrfCookieName);
        const authToken = cookie.read(authCookieName);

        if (csrfToken && config.xsrfHeaderName) {
            fetchOptions.headers[xsrfHeaderName] = csrfToken;
        }
        if (authToken) {
            fetchOptions.headers.Authorization = authToken;
        }

        if (config.method === "GET" || config.method === "HEAD") {
            if (config.data instanceof FormData)
                throw new Error(`Unsupported Data`);
            if (config.data)
                url += `?${new URLSearchParams(config.data).toString()}`;
        } else {
            fetchOptions.body =
                config.data instanceof FormData
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
                        config.authCookieName,
                        config.authType + " " + responseData[config.authKey]
                    );
                }

                if (utils.isFunction(config.onSuccess))
                    return config.onSuccess(responseData, { ...setOptions });
                return responseData;
            } catch (error) {
                let errorMessage = error;

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

                        // if (config.timeout) {
                        delay = Math.min(
                            config.timeout * 2 ** attempts,
                            config.maxDelay
                        );
                        // }
                        return await makeRequest(delay);
                    } else if (config.retryLimit === null) {
                        const timeoutError = new Error("Request timed out");
                        if (typeof config.onError === "function") {
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
                        if (typeof config.onError === "function") {
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

const get = request("GET");
const post = request("POST");
const head = request("HEAD");
const options = request("OPTIONS");
const put = request("PUT");
const _delete = request("DELETE");
const _patch = request("PATCH");

export default {
    request,
    get,
    post,
    head,
    options,
    put,
    delete: _delete,
    patch: _patch,
};
