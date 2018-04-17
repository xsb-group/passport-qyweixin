'use strict';
/*
 * passport-hlg
 */

var util = require('util');
var passport = require('passport-strategy');
var request = require('request')

function HlgStrategy(options, verify) {
    options = options || {};
    this._baseUrl = options.url || 'https://qyapi.weixin.qq.com/cgi-bin/';
    if (!verify) {
        throw new TypeError('HlgStrategy required a verify callback');
    }

    if (typeof verify !== 'function') {
        throw new TypeError('_verify must be function');
    }
    options = options || {};

    this.name = 'qywixin';
    this._secretKey = options.secretKey;
    this._verify = verify;

    if (!options.redirectUrl) {
        throw new Error('redirectUrl required');
    }

    if (!options.agentID) {
        throw new Error('agentID required');
    }

    if (!options.appID) {
        throw new Error('appID required');
    }

    if (!options.state) {
        throw new Error('state required');
    }

    this._authorizationURL = `https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=${options.appID}&agentid=${options.agentID}&redirect_uri=${encodeURI(options.redirectUrl)}&state=${options.state}`
    this._getTokenAPI = `${this._baseUrl}/gettoken?corpid=${options.appID}&corpsecret=${this._secretKey}`;
    this._getProfileAPI = `${this._baseUrl}/user/getuserinfo?`;
    this._getUserDetailUrl = `${this._baseUrl}/user/getuserdetail?`;
    this._state = options.state || 'login';
    this._passReqToCallback = options.passReqToCallback || false;
    this._getuserdetail = options.getuserdetail || false

    passport.Strategy.call(this, options, verify);
}

/**
 * Inherit from 'passort.Strategy'
 */
util.inherits(HlgStrategy, passport.Strategy);

HlgStrategy.prototype.authenticate = function (req) {

    var state, code;
    if (req.query && req.query['state'] && req.query['code']) {
        state = req.query['state'];
        code = req.query['code']
    }
    // console.log('HlgStrategy: ' + token);
    if (!state && !code) {
        return this.redirect(this._authorizationURL);
    }
    if (state !== this._state) {
        this.fail(400);
    }
    var self = this;

    function verified(err, user, info) {
        if (err) {
            return self.error(err);
        }
        if (!user) {
            if (typeof info == 'string') {
                info = {
                    message: info
                }
            }
            info = info || {};
            return self.fail(400);
        }
        self.success(user, info);
    }
    // 获取accessToken
    request({
        uri: self._getTokenAPI,
        method: 'get'
    }, function (err, res) {
        let body = res.body;
        let result = JSON.parse(body);
        const accessToken = result.access_token
        if (err) {
            return self.fail(400);
        }
        if (res.statusCode === 200 && result.errcode === 0) {
            // 获取用户信息
            request({
                uri: `${self._getProfileAPI}access_token=${accessToken}&code=${code}`,
                method: 'GET'
            }, function (err, res) {
                if (err) {
                    return self.fail(400);
                }
                let body = res.body;
                let data = JSON.parse(body);
                if (res.statusCode == 200 && data.errcode === 0) {
                    if (!data.user_ticket) {
                        self.fail(400)
                        return;
                    }
                    if (self._getuserdetail) {
                        request.post( {
                            url: `${self._getUserDetailUrl}access_token=${accessToken}`,
                            method: "POST",
                            json: true,
                            headers: {
                                "content-type": "application/json",
                            },
                            body: JSON.stringify({
                                user_ticket: data.user_ticket
                            })
                        }, function (err, res) {
                            if (err) {
                                return self.fail(400);
                            }
                            let body = res.body;
                            let usreInfo = JSON.parse(body);
                            if (res.statusCode == 200 && data.errcode === 0) {
                                if (self._passReqToCallback) {
                                    self._verify(req, usreInfo, verified);
                                } else {
                                    self._verify(usreInfo, verified);
                                }
                            }
                        });
                    } else {
                        if (self._passReqToCallback) {
                            self._verify(req, data, verified);
                        } else {
                            self._verify(data, verified);
                        }
                    }
                }
                else {
                    self.fail(400);
                }
            });
        }
    })
};

/**
 * Expose `Strategy`.
 */
module.exports = HlgStrategy;
