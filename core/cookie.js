export default {
    write(name, value, expires, path, domain, secure) {
        let config = {
            expires: expires || Date.now() + (60 * 60 * 24 * 365),
            path,
            domain,
            secure,
        };

        if (typeof expires === 'object' && expires !== null && !Array.isArray(expires)) {
            config = {
                ...config, ...expires
            }
        }
        
        const cookie = [name + "=" + encodeURIComponent(value)];

        typeof config.expires === "number" &&
            cookie.push("expires=" + new Date(config.expires).toGMTString());

        typeof config.path === "string" && cookie.push("path=" + config.path);

        typeof config.domain === "string" && cookie.push("domain=" + config.domain);

        config.secure === true && cookie.push("secure");
        
        document.cookie = cookie.join("; ");

        return value;
    },


    read(name) {
        if (typeof name !== "string") return null;
        const match = document.cookie.match(
            new RegExp("(^|;\\s*)(" + name + ")=([^;]*)")
        );
        return match ? decodeURIComponent(match[3]) : null;
    },

    remove(name) {
        const value = this.read(name);

        if (value) {
            this.write(name, "", Date.now() - 86400000);
        }
        return value;
    },
};
