import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from './auth.module.scss';
import { IconButton } from './button';
import { Path } from '../constant';
import FGptPng from "../icons/fgpt.png";
import { useAccessStore } from '../store';
import Locale from '../locales';
import BotIcon from '../icons/bot.svg';
import VerificationCode from './VerificationCode'; // 导入 VerificationCode 组件
import { getClientConfig } from '../config/client';
import {showToast} from "./ui-lib";
import {Simulate} from "react-dom/test-utils";
import loadedData = Simulate.loadedData;
import API_BASE_URL from '../../config.ts';


export function AuthPage() {
    const [isLoading, setIsLoading] = useState(true);
    const accessStore = useAccessStore();
    const [isRegistering, setIsRegistering] = useState(false);
    const [verificationCode, setVerificationCode] = useState(''); // 添加 verificationCode 状态
    const [regPassword, setRegPassword] = useState('');
    const [inputVerificationCode, setInputVerificationCode] = useState('');
    const [regEmail, setRegEmail] = useState('');
    // 验证码的标识
    const [captchaCode, setCaptchaCode] = useState('');

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [emailError, setEmailError] = useState('');
    const [inputVerificationCodeError, setInputVerificationCodeError] = useState('');
    const [regPasswordError, setRegPasswordError] = useState('');
    const [regEmailError, setRegEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [isForgotPassword, setIsForgotPassword] = useState(false);
    // 修改密码
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotPasswordCode, setForgotPasswordCode] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');
    // 异常提示部分
    const [forgotNewPasswordError, setForgotNewPasswordError] = useState('');
    const [forgotPasswordCodeError, setForgotPasswordCodeError] = useState('');
    const [forgotEmailError, setForgotEmailError] = useState('');


    const login = (e?:any) => {
        e.preventDefault();
        // 校验输入框的内容
        if (loginEmail.length < 5 || loginEmail.length > 20) {
            setEmailError('请输入长度为 5 到 20 个字符的邮箱');
            return;
        }
        // 清除错误信息
        setEmailError('');

        // 校验输入框的内容
        if (loginPassword.length < 5 || loginPassword.length > 20) {
            setPasswordError('请输入长度为 5 到 20 个字符的密码');
            return;
        }
        // 清除错误信息
        setPasswordError('');

        setIsLoading(true);
        // 登录逻辑
        // 发起请求判断邮箱是否存在
        const loginResponse = fetch(`${API_BASE_URL}/v1/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account: loginEmail,
                password: loginPassword
            }),
        }) .then(response => response.json())
            .then(data => {
                if(data.success){
                    // 将获取到的 token 存入本地
                    accessStore.update(
                        (access) => (access.accessCode = data.data),
                    );
                    // 跳转到首页
                    window.location.href = '/';
                }else{
                    showToast(data.data)
                }
                setIsLoading(false);
            })


    }
        const register = () => {
            fetchVerificationCode()
            setIsRegistering(true);
        };

        const goLogin = () => {
            setIsRegistering(false);
            setIsForgotPassword(false);
        };

        const resetAccessCode = () => {
            // 重置访问代码
        };

        const handleSendVerificationCode = async () => {
            try {
                // 校验输入框的内容
                if (inputVerificationCode.length == 0) {
                    setInputVerificationCodeError('请输入验证码');
                    return;
                }
                // 清除错误信息
                setInputVerificationCodeError('');
                // 校验输入框的内容
                if (regEmail.length < 5 || loginEmail.length > 20) {
                    setRegEmailError('请输入长度为 5 到 20 个字符的邮箱');
                    return;
                }
                // 清除错误信息
                setRegEmailError('');
                // 校验输入框的内容
                console.log(regPasswordError)
                if (regPassword.length < 5 || regPassword.length > 20) {
                    setEmailError('请输入长度为 5 到 20 个字符的密码');
                    return;
                }
                // 清除错误信息
                setRegPasswordError('');
                // 发起请求判断邮箱是否存在
                const emailExistResponse = await fetch(`${API_BASE_URL}/v1/api/emailExist`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        account: regEmail,
                    }),
                });

                if (emailExistResponse.ok) {
                    const emailExistData = await emailExistResponse.json();

                    if (emailExistData.success) {
                        if (emailExistData.data) {
                            // 邮箱已存在，提示用户
                            showToast('邮箱已存在');
                        } else {
                            // 邮箱不存在，继续发起注册请求
                            const registerResponse = await fetch(`${API_BASE_URL}/v1/api/register`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    email: regEmail,
                                    password: regPassword,
                                    captchaCode: captchaCode,
                                    inputVerificationCode: inputVerificationCode
                                }),
                            });

                            if (registerResponse.ok) {
                                const registerData = await registerResponse.json();

                                if (registerData.success) {
                                    // 注册成功，提示用户
                                    showToast(registerData.data,undefined,3000);
                                    setTimeout(() => {
                                        window.location.href = '/';
                                    }, 3000);


                                } else {
                                    // 注册失败，提示用户
                                    showToast(registerData.data,undefined,3000);
                                }
                            } else {
                                // 注册请求失败，提示用户
                                showToast('注册请求失败，请稍后再试',undefined,3000);
                            }

                        }
                    } else {
                        // 请求失败，提示用户
                        showToast('请求失败，请稍后再试',undefined,3000);
                    }
                } else {
                    // 请求失败，提示用户
                    showToast('请求失败，请稍后再试',undefined,3000);
                }
            } catch (error) {
                // 请求失败，提示用户
                showToast('请求失败，请稍后再试',undefined,3000);
            }
        };


        async function fetchVerificationCode() {
            try {
                // 生成UUID作为token
                const token = uuidv4();
                setCaptchaCode(token)
                const response = await fetch(`${API_BASE_URL}/v1/api/captcha?captchaCode=` + token);

                if (response.ok) {
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);
                    setVerificationCode(imageUrl); // 将获取到的验证码图片 URL 存储在状态变量中
                } else {
                    console.error('Failed to fetch verification code:', response.status);
                }
            } catch (error) {
                console.error('Failed to fetch verification code:', error);
            }
        }

        useEffect(() => {;
        }, []);

    function goForgotPassword() {
        setIsForgotPassword(true)
        setIsRegistering(false)
    }

    // 修改密码请求
    function handleUpdatePassword() {
        // 校验输入框的内容
        if (forgotNewPassword.length < 5 || forgotNewPassword.length > 20) {
            setForgotNewPasswordError('请输入长度为 5 到 20 个字符的新密码');
            return;
        }
        // 清除错误信息
        setForgotNewPasswordError('');
        setIsLoading(true)
        // 发起修改密码的请求
        fetch(`${API_BASE_URL}/v1/api/updatePassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emailAddress: forgotEmail,
                newPassword: forgotNewPassword,
                verificationCode: forgotPasswordCode,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    // 修改密码成功，提示用户
                    showToast(data.data)
                    setIsRegistering(false);
                    setIsForgotPassword(false);
                } else {
                    // 修改密码失败，提示用户
                    showToast(data.data);
                }
            })
            .catch((error) => {
                // 请求失败，提示用户
                showToast('请求失败，请稍后再试', error);
            });
        setIsLoading(false)
    }


    // 修改密码发送验证码
    function forgotSendCode() {
        // 校验输入框的内容
        if (forgotEmail.length < 5 || forgotEmail.length > 20) {
            setForgotEmailError('请输入长度为 5 到 20 个字符的邮箱');
            return;
        }
        // 清除错误信息
        setForgotEmailError('');
        setIsLoading(true)
        // 发起发送验证码的请求
        fetch(`${API_BASE_URL}/v1/api/sendVerificationCode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emailAddress: forgotEmail,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    // 发送验证码成功，提示用户
                    showToast(data.data);
                } else {
                    // 发送验证码失败，提示用户
                    showToast(data.data);
                }
            })
            .catch((error) => {
                // 请求失败，提示用户
                showToast('请求失败，请稍后再试', error);
            });
        setIsLoading(false)
    }


    return (
            <div className={styles['auth-page']}>
                <div className={`no-dark ${styles['auth-logo']}`}>
                    <img src={FGptPng.src} width={60} height={60}/>
                </div>

                {isRegistering ? (
                    <>
                        <div className={styles['auth-title']}>{Locale.Auth.RegTitle}</div>
                        <div className={styles['auth-tips']}>{Locale.Auth.RegTips}</div>
                    </>
                ) : (
                    isForgotPassword ? (
                        <>
                            <div className={styles['auth-title']}>{Locale.Auth.ForgotPasswordTitle}</div>
                            <div className={styles['auth-tips']}>{Locale.Auth.ForgotPasswordTips}</div>
                        </>
                    ) : (
                        <>
                            <div className={styles['auth-title']}>{Locale.Auth.Title}</div>
                            <div className={styles['auth-tips']}>{Locale.Auth.Tips}</div>
                        </>
                    )
                )}

                {!isRegistering && !isForgotPassword && (
                    <>
                        <input
                            className={styles['auth-input']}
                            type="text"
                            autoComplete="off"
                            minLength={5}
                            maxLength={20}
                            placeholder="账号"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.currentTarget.value)}
                        />
                        {emailError && <p className={styles.error}>{emailError}</p>}
                        <input
                            className={styles['auth-input']}
                            type="password"
                            autoComplete="off"
                            minLength={5}
                            maxLength={20}
                            placeholder="密码"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.currentTarget.value)}
                        />
                        {passwordError && <p className={styles.error}>{passwordError}</p>}
                    </>
                )}

                {isRegistering && (
                    <>
                        <input
                            className={styles['auth-input']}
                            type="text"
                            autoComplete="off"
                            minLength={5}
                            maxLength={20}
                            placeholder="请输入邮箱"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.currentTarget.value)}
                        />
                        {regEmailError && <p className={styles.error}>{regEmailError}</p>}
                        <input
                            className={styles['auth-input']}
                            type="password"
                            autoComplete="off"
                            placeholder="请输入密码"
                            minLength={5}
                            maxLength={20}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.currentTarget.value)}
                        />
                        {regPasswordError && <p className={styles.error}>{regPasswordError}</p>}
                        <div className={styles['verification-code-wrapper']}>
                            {verificationCode && (
                                <img
                                    src={verificationCode}
                                    alt="Verification Code"
                                    onClick={fetchVerificationCode} // 添加点击事件处理程序
                                />
                            )}

                            <input
                                className={styles['auth-input-code']}
                                type="text"
                                autoComplete="off"
                                minLength={4}
                                maxLength={4}
                                placeholder="请输入验证码"
                                value={inputVerificationCode}
                                onChange={(e) => setInputVerificationCode(e.currentTarget.value)}
                            />

                        </div>
                        {inputVerificationCodeError && <p className={styles.error}>{inputVerificationCodeError}</p>}
                    </>
                )}


                {isForgotPassword && (
                    <>
                        <input
                            className={styles['auth-input']}
                            type="text"
                            autoComplete="off"
                            minLength={5}
                            maxLength={20}
                            placeholder="请输入邮箱"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.currentTarget.value)}
                        />
                        {forgotEmailError && <p className={styles.error}>{forgotEmailError}</p>}
                        <input
                            className={styles['auth-input']}
                            type="password"
                            autoComplete="off"
                            placeholder="请输入新密码"
                            minLength={5}
                            maxLength={20}
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.currentTarget.value)}
                        />
                        {forgotNewPasswordError && <p className={styles.error}>{forgotNewPasswordError}</p>}
                        <div className={styles.forgotForm}>
                            <input
                                className={styles.forgotFormVCode}
                                type="text"
                                autoComplete="off"
                                minLength={4}
                                maxLength={4}
                                placeholder="请输入验证码"
                                value={forgotPasswordCode}
                                onChange={(e) => setForgotPasswordCode(e.currentTarget.value)}
                            />

                            <IconButton
                                className={styles.forgotFormSendCode}
                                text="发送验证码"
                                type="primary"
                                onClick={forgotSendCode}
                            />
                        </div>
                        {forgotPasswordCodeError && <p className={styles.error}>{forgotPasswordCodeError}</p>}
                    </>
                )}

                <div className={styles['auth-actions']}>
                    {!isRegistering && !isForgotPassword && (
                        <IconButton text="登录" type="primary"
                                    className={styles.loginButton}
                                    onClick={login}/>
                    )}

                    {!isRegistering && !isForgotPassword && (
                        // <IconButton
                        //     className={styles.regButton}
                        //     text="去注册"
                        //     type="primary"
                        //     onClick={register}
                        // />
                        <div className={styles['reg-div']}>
                            <a href="#" className={styles.forgotpassword} onClick={register}>去注册</a>
                        </div>
                    )}

                    {isRegistering && (
                        <IconButton
                            className={styles.loginButton}
                            text="注册"
                            type="primary"
                            onClick={handleSendVerificationCode}
                        />
                    )}

                    {isRegistering && (
                        <div className={styles['forgot-div']}>
                            <a href="#" className={styles.forgotpassword} onClick={goLogin}>返回登录</a>
                        </div>
                    )}

                    {isForgotPassword && (
                        <IconButton
                            className={styles.forgotFormUpdateButton}
                            text="修改密码"
                            type="primary"
                            onClick={handleUpdatePassword}
                        />
                    )}

                    {!isRegistering && !isForgotPassword &&(
                        <div className={styles['forgot-div']}>
                            <a href="#" className={styles.forgotpassword} onClick={goForgotPassword}>忘记密码</a>
                        </div>
                    )}
                    {isForgotPassword &&(
                        <div className={styles['forgot-div']}>
                            <a href="#" className={styles.forgotpassword} onClick={goLogin}>返回登录</a>
                        </div>
                    )}
                </div>

            </div>
        );
    }

// 模拟登录请求
function simulateLoginRequest() {
    // 模拟登录请求的代码
}
