"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var v1_1 = require("uuid/v1");
/**
 * API Key metadata
 *
 * @export
 * @class APIKeyInfo
 */
var APIKeyInfo = /** @class */ (function () {
    function APIKeyInfo() {
        this.isActive = true;
    }
    return APIKeyInfo;
}());
exports.APIKeyInfo = APIKeyInfo;
/**
 * The current status type of an API key
 *
 * @export
 * @enum {number}
 */
var KeyStatus;
(function (KeyStatus) {
    KeyStatus[KeyStatus["DoesNotExist"] = 0] = "DoesNotExist";
    KeyStatus[KeyStatus["Inactive"] = 1] = "Inactive";
    KeyStatus[KeyStatus["Expired"] = 2] = "Expired";
    KeyStatus[KeyStatus["Valid"] = 3] = "Valid";
})(KeyStatus = exports.KeyStatus || (exports.KeyStatus = {}));
var APIKEYS_PREFIX = 'APIKeys';
/**
 * Manages the set of api keys and their associated metadata, using the given configuration storage as storage.
 *
 * @export
 * @class APIKeyManager
 */
var APIKeyManager = /** @class */ (function () {
    /**
     *Creates an instance of APIKeyManager.
     * @param {IConfigurationStore} config The configuration store to use for storing registered api key information
     * @param {string} [requestHeaderKey='X-APIKEY'] The header element to look for the api key
     * @memberof APIKeyManager
     */
    function APIKeyManager(config, requestHeaderKey) {
        if (requestHeaderKey === void 0) { requestHeaderKey = 'x-api-key'; }
        this.config = config;
        this.requestHeaderKey = requestHeaderKey;
    }
    /**
     * Check that the request has an existing api key registered
     *
     * @param {Request} request
     * @returns {Promise<APIKeyInfo>}
     * @memberof APIKeyManager
     */
    APIKeyManager.prototype.withExistingKey = function (request) {
        var _this = this;
        var key = request && request.headers && request.headers[this.requestHeaderKey];
        if (key)
            return this.getKeyInfo(key.trim()).then(function (keyInfo) {
                if (_this.status(keyInfo) !== KeyStatus.DoesNotExist)
                    return keyInfo;
                throw new Error('API Key does not exist');
            });
        throw new Error('API key was not specified in request header');
    };
    /**
     * Check that the request has a valid api key registered
     *
     * @param {Request} request
     * @returns {Promise<APIKeyInfo>}
     * @memberof APIKeyManager
     */
    APIKeyManager.prototype.withValidKey = function (request) {
        var _this = this;
        return this.withExistingKey(request).then(function (keyInfo) {
            if (_this.status(keyInfo) === KeyStatus.Valid)
                return keyInfo;
            throw new Error('API key is invalid');
        });
    };
    /**
     * Generates and returns a unique api key
     *
     * @returns {string}
     * @memberof APIKeyManager
     */
    APIKeyManager.prototype.generateNewKey = function () {
        return v1_1.default();
    };
    /**
     * Insert or updates an api key along with its associated metadata
     *
     * @param {string} key
     * @param {APIKeyInfo} info
     * @returns {Promise<void>}
     * @memberof APIKeyManager
     */
    APIKeyManager.prototype.upsert = function (key, info) {
        return this.config.setGlobalData(this.getDBKey(key), info).then(function () {
            return;
        });
    };
    /**
     * Removes an api key
     *
     * @param {string} key
     * @returns {Promise<void>}
     * @memberof APIKeyManager
     */
    APIKeyManager.prototype.delete = function (key) {
        return this.config.setGlobalData(this.getDBKey(key), {}).then(function () {
            return;
        });
    };
    /**
     * Return the status of the given api key
     *
     * @param {string} key
     * @returns {Promise<KeyStatus>}
     * @memberof APIKeyManager
     */
    APIKeyManager.prototype.status = function (info) {
        if (info && info.issuee) {
            if (!info.isActive)
                return KeyStatus.Inactive;
            if (info.expiryDate && info.expiryDate < new Date())
                return KeyStatus.Expired;
            return KeyStatus.Valid;
        }
        return KeyStatus.DoesNotExist;
    };
    /**
     * Retrieves the meta data for a given api key
     *
     * @private
     * @param {string} key
     * @returns {Promise<APIKeyInfo>}
     * @memberof APIKeyManager
     */
    APIKeyManager.prototype.getKeyInfo = function (key) {
        return this.config.getGlobalData(this.getDBKey(key));
    };
    APIKeyManager.prototype.getDBKey = function (key) {
        return APIKEYS_PREFIX + "/" + key;
    };
    return APIKeyManager;
}());
exports.APIKeyManager = APIKeyManager;
