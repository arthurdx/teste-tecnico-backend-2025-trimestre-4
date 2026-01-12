/**
 * Validates if a string is a valid 8-digit CEP
 * @param {string} cep 
 * @returns {boolean}
 */
const isValidCEP = (cep) => {
    return typeof cep === 'string' && /^\d{8}$/.test(cep);
};

/**
 * Validates the CEP range request
 * @param {string} start 
 * @param {string} end 
 * @param {number} maxRange 
 * @returns {{isValid: boolean, error?: string}}
 */
const validateCEPRange = (start, end) => {
    if (!isValidCEP(start) || !isValidCEP(end)) {
        return { isValid: false, error: 'Invalid CEP format. Expected 8 digits.' };
    }

    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);

    if (startNum > endNum) {
        return { isValid: false, error: 'cep_start must be less than or equal to cep_end.' };
    }
    return { isValid: true };
};

module.exports = {
    isValidCEP,
    validateCEPRange
};
