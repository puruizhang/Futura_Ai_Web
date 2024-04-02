import React, { useEffect, useState } from 'react';
import styles from "./home.module.scss";
import { useAccessStore } from "../store";
import { useLocation } from "react-router-dom";
import API_BASE_URL from "../../config";
import {IconButton} from "./button";
import FGptPng from "../icons/fgpt.png";
import { Button, message, Space } from 'antd';

export function Active() {
    const [messageApi, contextHolder] = message.useMessage();
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation(); // 在组件的顶层作用域中使用 useLocation 钩子
    const accessStore = useAccessStore(); // 在组件的顶层作用域中使用 useAccessStore 钩子

    const activeUser = () =>{
        setIsLoading(false);
        // 获取 URL 上的参数
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('code');
        // 向后台发起请求，获取登录的 token
        // 这里可以使用 fetch 或其他库来发送请求
        // 假设请求返回的数据是一个对象 { token: 'your_token' }
        fetch(`${API_BASE_URL}/v1/api/activate?code=`+token)
            .then(response => response.json())
            .then(data => {
                if(!data.success){
                    message.error(data.data);
                    // 请求完成，loading 结束
                    setIsLoading(false);
                    return;
                }
                // 将获取到的 token 存入本地
                accessStore.update(
                    (access) => (access.accessCode = data.data),
                );
                // 请求完成，loading 结束
                setIsLoading(false);
                message.success('激活成功，页面即将自动跳转！');

                // 跳转到首页
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            })
            .catch(error => {
                console.error('Error:', error);
                // 处理错误情况
                messageApi.error('请求失败，请稍后再试！');
            });
    }

    useEffect(() => {

    }, []); // 在依赖数组中添加 location.search

    return (
        <div className={styles.buyContainer}>
            <div style={{textAlign: 'center'}}>
                <h1 style={{textAlign: 'center'}}>欢迎使用 Futura AI</h1>
                <img src={FGptPng.src}
                     style={{borderRadius: '20px',marginBottom: '20px'}}
                     width={50}
                     height={50}
                     alt="bot"
                />
            </div>

            <IconButton type="primary"
                        shadow={true}
                        className={styles.activeButton}
                        onClick={activeUser}
                        disabled={isLoading}
                        text={isLoading ? '激活中...' : '点击激活您的账号'}
            />
        </div>
    );
}
