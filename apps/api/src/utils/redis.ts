
/**
 * Redis Search uses special characters (like -, :, @) as query operators.
 * If we are searching for a string that CONTAINS these characters (e.g., "Tex-Mex"),
 * we must escape them with a backslash, or Redis will throw a syntax error.
 */
export const escapeRedisTag = (value: string): string => {
    const redisReservedChars = /([\\{}[\]|<>:"'~\-@])/g;
    return value.replace(redisReservedChars, "\\$1");
};

/**
 * Escape text terms used in full-text query clauses (e.g. @name:term*).
 * This prevents special operators from breaking query syntax.
 */
export const escapeRedisText = (value: string): string => {
    const redisReservedChars = /([\\{}[\]|<>:"'~\-@()])/g;
    return value.replace(redisReservedChars, "\\$1");
};