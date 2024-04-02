"use client";

import {BuyPage} from "./buy";

require("../polyfill");

import React, { useState, useEffect } from "react";
import ImgCrop from 'antd-img-crop';
import styles from "./home.module.scss";
import HomeIcon from "../icons/home.svg";
import CloseIcon from "../icons/close.svg";
import LiaotianIcon from "../icons/聊天.svg";
import AppIcon from "../icons/首页.svg";
import DrawIcon from "../icons/huihua.svg";
import AIMusicIcon from "../icons/AI音乐.svg";
import WiritingIcon from "../icons/写作.svg";
import BotIcon from "../icons/bot.svg";
import NoticeIcon from "../icons/notice.svg";
import BotIconPng from "../icons/bot.png";
import FGpt from "../icons/fgpt.png";
import FGptPng from "../icons/router.svg";
import GPTZhuanPng from "../icons/gpt_zhuan.png";
import UptimeIcon from "../icons/uptime.svg";
import XiaoDianPng from "../icons/futura_dian.png";
import SubscribeIcon from "../icons/订阅.svg";
import SubscribePointIcon from "../icons/订阅积分.svg";
import ModelPriceIcon from "../icons/模型价格.svg";
import InstructionsIcon from "../icons/使用说明.svg";
import LoadingIcon from "../icons/three-dots.svg";
import BrainIcon from "../icons/积分.svg";
import {copyToClipboard, getCSSVar, useMobileScreen} from "../utils";
import DragIcon from "../icons/drag.svg";
import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";
import Locale, { getISOLang, getLang } from "../locales";
import data from './../data/prompt_zh.json';

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { api } from "../client/api";
import { useAccessStore } from "../store";
import {Input, ListItem, Modal, showConfirm, showModal, showPrompt, showToast} from "./ui-lib";
import {IconButton} from "./button";
import {Prompt, SearchService, usePromptStore} from "../store/prompt";
import {nanoid} from "nanoid";
import AddIcon from "../icons/add.svg";
import ClearIcon from "../icons/clear.svg";
import EditIcon from "../icons/edit.svg";
import EyeIcon from "../icons/eye.svg";
import CopyIcon from "../icons/copy.svg";
import ResetIcon from "../icons/reload.svg";
import Image from "next/image";
import API_BASE_URL from "../../config";
import {Drawing} from "./drawing";
import {show} from "cli-cursor";
import {Avatar, Button, Divider, GetProp, message, Spin, Upload, UploadFile, UploadProps} from "antd";
import {LoadingOutlined, PlusOutlined, UploadOutlined, UserOutlined} from "@ant-design/icons";
import {FileType} from "next/dist/lib/file-exists";
import Qrcode from "../icons/qrcode_for_gh_d07539c306c7_344.jpg";
import Wechat from "../icons/wechat.png";
import tr from "../locales/tr";
import {Writing} from "./writing";
import {Music} from "./music";

export function Loading(props: { noLogo?: boolean }) {
  return (
      <Spin tip="" size="large">
        <div className="content" />
      </Spin>
  );
}



const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const Active = dynamic(async () => (await import("./active")).Active, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

const PaginationTable = dynamic(async () => (await import("./paginationTable")).PaginationTable, {
  loading: () => <Loading noLogo />,
});


export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    // document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};



function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isMobileScreen = useMobileScreen();
  const shouldTightBorder = getClientConfig()?.isApp || (config.tightBorder && !isMobileScreen);
  const [currentPage, setCurrentPage] = useState("chat");
  const [userInfo, setUserInfo] = useState<{ userName: string, avatarUrl: string,email: string,openId: string } | null>(null);
  const accessStore = useAccessStore.getState();
  const [showLogoutButton, setShowLogoutButton] = useState(false);
  const [showModal, setShowModal] = useState(false); // 控制模态窗口的显示与隐藏
  const [inputValue, setInputValue] = useState(""); // 兑换码的输入值
  // 使用的限时免费的额度
  const [pointsBalanceTotal, setPointsBalanceTotal] = useState(0);

  const [isActiveStatuView, setIsActiveStatuView] = useState(false);
  // 公告
  const [showPrompt, setShowPrompt] = useState(true);

  const [showNavigation, setShowNavigation] = useState(false);

  const setModelhidden = () =>{
    setShowModal(false)
    setCurrentPage('chat')
  }



  const confirmExchange = () => {
    setIsExhangeCodeLoading(true)
    // 发起兑换
    fetch(`${API_BASE_URL}/v1/api/exchangeCode?code=`+inputValue, {
      method: 'GET',
      headers: {
        'Token': accessStore.accessCode,
      }
    })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showToast(data.data,undefined,5000)
            getPoint(true);
            setInputValue('')
          } else {
            showToast(data.data);
          }
          setIsExhangeCodeLoading(false)
        })
        .catch((error) => {
          // 请求失败，提示用户
          showToast('请求失败，请稍后再试', error);
        });
  }

  const handleMenuClick = (page: any) => {
    setCurrentPage(page);
  };

  const handleShowDismiss = () => {
    console.log('被点击了')
    setShowModal(true);
    setShowPrompt(true);
  };

  const handleDismiss = () => {
    setTimeout(() => {
      setShowPrompt(false);
      const currentDate = new Date().toLocaleDateString();
      localStorage.setItem('dismissedDate', currentDate);
    }, 500); // 延迟1秒执行
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('code');
    if(token){
      setIsActiveStatuView(true);
    }
    setShowModal(true);
    loadAsyncGoogleFont();
    const lastDismissedDate = localStorage.getItem('dismissedDate');
    const currentDate = new Date().toLocaleDateString();

    if (lastDismissedDate === currentDate) {
      setShowPrompt(false);
    }
  }, []);

  const handleMouseEnter = () => {
    setShowLogoutButton(true);
  };

  const handleMouseLeave = () => {
    setShowLogoutButton(false);
  };

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isUserInfoLoading, setIsUserInfoLoading] = useState(false);
  const [isExhangeCodeLoading, setIsExhangeCodeLoading] = useState(false);

  const [shuomingMarkdownContent, setShuomingMarkdownContent] = useState('');
  const [modelMarkdownContent, setModelMarkdownContent] = useState('');

  const [signToday, setSignToday] = useState(false);

  const [showBindWx, setShowBindWx] = useState(false);
  const [showBindEmail, setShowBindEmail] = useState(false);
  const [bindEmail, setBindEmail] = useState('');
  const [emailBindVCode, setEmailBindVCode] = useState('');
  
  const showBindWxConf = () =>{
    setShowBindWx(true);
    setShowBindEmail(false);
  }

  const showBindEmailConf = () =>{
    setShowBindWx(false);
    setShowBindEmail(true);
  }

  const [isEdituserInfo, setIsEdituserInfo] = useState(false);
  const updateConfig = config.update;
  const qqNumber = '854554762';
  const handleQQClick = () => {
    window.location.href = `https://wpa.qq.com/msgrd?v=3&uin=${qqNumber}&site=qq&menu=yes&jumpflag=1`;
  };

  function emailBindSendCode(): Promise<Response> {
    return new Promise((resolve, reject) => {
      // 发送验证码的逻辑
      // setEmailBindVCode(''); // 设置发送验证码的状态

      // 发起向后台的请求
      fetch(`${API_BASE_URL}/v1/api/bindUserEmailCodeSend`, {
        method: 'POST',
        headers: {
          Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: bindEmail,
        })
      })
          .then(response => response.json())
          .then(data => {
            // 处理响应数据
            if (!data.success) {
              message.error(data.data)
              return false;
            }
            message.success(data.data);
            return true;
          })
          .catch((error) => {
            // 处理错误
            console.error(error);
            message.error(error)
            return false;
          });
    });
  }


  // 签到操作
  const signClick = () => {
    // 发起向后台的请求
    fetch(`${API_BASE_URL}/v1/api/sign`, {
      method: 'POST',
      headers: {
        Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
        'Content-Type': 'application/json',
      },
    })
        .then(response => response.json())
        .then(data => {
          // 处理响应数据
          if(!data.success){
            message.error(data.data)
            return;
          }
          message.success(data.data);
          setSignToday(true);
        })
        .catch((error) => {
          // 处理错误
          console.error(error);
          message.error(error)
        });
  }

  const getSignTodayStatus = () => {
// 发起向后台的请求
    fetch(`${API_BASE_URL}/v1/api/signToDay`, {
      method: 'GET',
      headers: {
        Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
      },
    })
        .then(response => response.json())
        .then(data => {
          // 处理响应数据
          if(!data.success){
            message.error(data.data)
            return;
          }
          setSignToday(data.data);
        })
        .catch((error) => {
          // 处理错误
          console.error(error);
          message.error(error)
        });
  }

  const handleUserNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(event.currentTarget.value);
    setIsEdituserInfo(true);
  };

  const getRandomColor = () =>{
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }


  const handleSubmit = () => {
    if(!isEdituserInfo){
      return;
    }
    if (!userInfo) {
      showToast('数据异常，请刷新！')
      return;
    }
    setIsUserInfoLoading(true);
    // 发起向后台的请求
    fetch(`${API_BASE_URL}/v1/api/updateUserInfo`, {
      method: 'POST',
      headers: {
        Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 'userName':userName,'avatarUrl':userInfo.avatarUrl }),
    })
        .then(response => response.json())
        .then(data => {
          // 处理响应数据
          console.log(data)
          if(!data.success){
            showToast(data.data)
            return;
          }
          showToast(data.data);
          getUserInfo()
          setIsUserInfoLoading(false);
          setIsEdituserInfo(false);
        })
        .catch((error) => {
          // 处理错误
          console.error(error);
          setIsUserInfoLoading(false);
        });
  };

  const getPoint = (first:boolean) =>{
    if(accessStore.accessCode){
      fetch(`${API_BASE_URL}/v1/api/getUserPointsBalance`, {
        method: 'GET',
        headers: {
          Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
        },
      })
          .then(response => response.json())
          .then(data => {
            // 处理返回的用户信息数据
            if(data.success){
              setPointsBalanceTotal(data.data);
              // let timeoutId;
              // for(let i=0; i<data.data.pointsBalanceUseTotal; i++){
              //   timeoutId = setTimeout(() => {
              //
              //   }, 100);
              // }
              // clearTimeout(timeoutId);
              if(!first){
                showToast('刷新成功！')
              }
            }else{
              showToast('请求频繁,请稍后再试！')
            }
          })
          .catch(error => {
            console.error('Error:', error);
            // 处理错误情况
          });
    }
  }

  const formatNumber = (number:number) =>{
    if (number < 1000) {
      return number.toString();
    } else if (number < 10000) {
      return (number / 1000).toFixed(1) + "k";
    } else {
      return (number / 1000).toFixed(1) + "k";
    }
  }

  const getUserInfo = () =>{
    // 发送 GET 请求获取用户信息
    if(accessStore.accessCode){
      fetch(`${API_BASE_URL}/v1/api/getUserInfo`, {
        method: 'GET',
        headers: {
          Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
        },
      })
          .then(response => response.json())
          .then(data => {
            // 处理返回的用户信息数据
            if(data.success){
              setUserInfo(data.data);
              // updateConfig((config) => (config.avatar = userInfo?.avatarUrl));
              setUserName(data.data.userName)
            }else{
              showToast('请求频繁,请稍后再试！')
            }
          })
          .catch(error => {
            console.error('Error:', error);
            // 处理错误情况
          });
    }

  }
  // interface OSSDataType {
  //   dir: string;
  //   expire: string;
  //   host: string;
  //   accessId: string;
  //   policy: string;
  //   signature: string;
  // }
  //
  // interface AliyunOSSUploadProps {
  //   value?: UploadFile[];
  //   onChange?: (fileList: UploadFile[]) => void;
  // }
  //
  // const AliyunOSSUpload = ({ value, onChange }: AliyunOSSUploadProps) => {
  //   const [OSSData, setOSSData] = useState<OSSDataType>();
  //   const accessStore = useAccessStore.getState();
  //   // Mock get OSS api
  //   // https://help.aliyun.com/document_detail/31988.html
  //   // const mockGetOSSData = () => ({
  //   //     dir: 'user-dir/',
  //   //     expire: '1577811661',
  //   //     host: '//www.mocky.io/v2/5cc8019d300000980a055e76',
  //   //     accessId: 'c2hhb2RhaG9uZw==',
  //   //     policy: 'eGl4aWhhaGFrdWt1ZGFkYQ==',
  //   //     signature: 'ZGFob25nc2hhbw==',
  //   // });
  //
  //   const getOssToken = async () => {
  //     fetch(`${API_BASE_URL}/v1/api/oss/generateToken`, {
  //       method: 'GET',
  //       headers: {
  //         Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
  //       },
  //     })
  //         .then(response => response.json())
  //         .then(data => {
  //           // 处理返回的用户信息数据
  //           if(data.success){
  //             setOSSData(data.data);
  //           }else{
  //             showToast('请求频繁,请稍后再试！')
  //           }
  //         })
  //         .catch(error => {
  //           console.error('Error:', error);
  //           // 处理错误情况
  //         });
  //   }
  //
  //   useEffect(() => {
  //     getOssToken();
  //   }, []);
  //
  //   const handleChange: UploadProps['onChange'] = ({ fileList }) => {
  //     console.log('Aliyun OSS:', fileList);
  //     onChange?.([...fileList]);
  //   };
  //
  //   const onRemove = (file: UploadFile) => {
  //     const files = (value || []).filter((v) => v.url !== file.url);
  //
  //     if (onChange) {
  //       onChange(files);
  //     }
  //   };
  //
  //   const getExtraData: UploadProps['data'] = (file) => ({
  //     key: file.url,
  //     OSSAccessKeyId: OSSData?.accessId,
  //     policy: OSSData?.policy,
  //     Signature: OSSData?.signature,
  //   });
  //
  //   const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
  //     if (!OSSData) return false;
  //
  //     const expire = Number(OSSData.expire) * 1000;
  //
  //     if (expire < Date.now()) {
  //       await getOssToken();
  //     }
  //
  //     const suffix = file.name.slice(file.name.lastIndexOf('.'));
  //     const filename = Date.now() + suffix;
  //     // @ts-ignore
  //     file.url = OSSData.dir + filename;
  //
  //     return file;
  //   };
  //
  //   const uploadProps: UploadProps = {
  //     name: 'file',
  //     fileList: value,
  //     action: OSSData?.host,
  //     onChange: handleChange,
  //     onRemove,
  //     data: getExtraData,
  //     beforeUpload,
  //   };
  //
  //   return (
  //       // <Upload {...uploadProps}>
  //       //   <Button icon={<UploadOutlined />}>Click to Upload</Button>
  //       // </Upload>
  //
  //   <ImgCrop rotationSlider>
  //     <Upload {...uploadProps}
  //         name="avatar"
  //         listType="picture-circle"
  //         className="avatar-uploader"
  //         showUploadList={false}
  //     >
  //       <Avatar
  //           size={{ xs: 24, sm: 32, md: 40, lg: 64, xl: 64, xxl: 90 }}
  //           className={styles.userAvatar} src={<img src={userInfo?.avatarUrl || ''} alt="个人中心" />} />
  //     </Upload>
  //   </ImgCrop>
  //   );
  // };

  type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
  const uploadFileUrl = API_BASE_URL + '/v1/api/uploadAvatar';
  const getBase64 = (img: FileType, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result as string));
    reader.readAsDataURL(img);
  };
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();

  const handleChange: UploadProps['onChange'] = (info) => {
    console.log(info)
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      if(200 != info.file.response.code){
        // 提示上传失败
        showToast(info.file.response.message);
      }else{
        getUserInfo();
        // info.file.response.data;
      }
    }
  };
  const beforeUpload = (file: FileType) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('你只能上传 JPG/PNG 文件!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小需要小于 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  const [wxBindVCode, setWxBindVCode] = useState('');

  

  const emailBind = () =>{
    // 校验输入框的内容
    if (!bindEmail.length) {
      message.error('请输入邮箱');
      return;
    }
    if (!emailBindVCode.length) {
      message.error('请输入验证码');
      return;
    }
    const loginResponse = fetch(`${API_BASE_URL}/v1/api/emailBind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': accessStore.accessCode,
      },
      body: JSON.stringify({
        email: bindEmail,
        bindCode: emailBindVCode,
      }),
    }) .then(response => response.json())
        .then(data => {
          if(data.success){
            message.success(data.data)
            // 重新获取用户信息
            getUserInfo()
            setShowBindEmail(false);
          }else{
            message.error(data.data);
          }
        })
  }
  
  const wxBind = () =>{
    // 校验输入框的内容
    if (!wxBindVCode.length) {
      message.error('请输入验证码');
      return;
    }
    const loginResponse = fetch(`${API_BASE_URL}/v1/api/wxBind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': accessStore.accessCode,
      },
      body: JSON.stringify({
        bindCode: wxBindVCode,
      }),
    }) .then(response => response.json())
        .then(data => {
          if(data.success){
            message.success(data.data)
            // 重新获取用户信息
            getUserInfo()
            setShowBindWx(false);
          }else{
            message.error(data.data);
          }
        })
  }

  useEffect(() => {
    getSignTodayStatus();
    getUserInfo();
    getPoint(true);
    const readMarkdownFile = () => {
      try {
        fetch('https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_doc/%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E20240401.md')
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.text();
            })
            .then(data => {
              setShuomingMarkdownContent(data);
            })
            .catch(error => {
              console.error('Error fetching file:', error);
            });
        fetch('https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_doc/%E6%A8%A1%E5%9E%8B%E4%BB%B7%E6%A0%BC20240401.md')
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.text();
            })
            .then(data => {
              setModelMarkdownContent(data);
            })
            .catch(error => {
              console.error('Error fetching file:', error);
            });
      } catch (error) {
        console.error('Error reading Markdown file:', error);
      }
    };

    readMarkdownFile();

    // const intervalId = setInterval(() => {
    //   const startTime = performance.now();
    //   // 设置断点
    //   debugger;
    //   const currentTime = performance.now();
    //   // 设置一个阈值，例如100毫秒
    //   if (currentTime - startTime > 100) {
    //     window.location.href = 'about:blank';
    //   }
    // }, 100);
    //
    // return () => {
    //   clearInterval(intervalId);
    // };
  }, []);



  return (
    <div className={styles.mainContainer}>
      <div
          className={
            styles.container +
            ` ${shouldTightBorder ? styles["tight-container"] : styles.container} ""
              }`
          }
      >
        <div className={styles.menuContainer}>

          <div className={`${styles.menuLogo}`}>
            <FGptPng style={{cursor: 'pointer',width:'2em',height:'1.5em'}} onClick={() => setShowNavigation(!showNavigation)}/>
            { showNavigation && (
                <div className={styles.menuRouterText}>
                  <ul className={styles.menuRouterul}>
                    <li className={styles.menuRouterli}>
                      <a href='https://pay-chat.mafutura.top' target='_blank' className={styles.menu_menuRouterA}>
                        <img src={XiaoDianPng.src}
                             style={{maxWidth: '150px',
                               maxHeight: '45px',marginTop: '5px',border: '1px solid #f0f0f0' }}
                        />
                        <div style={{textAlign:'left',marginLeft:'10px'}}>
                          <div style={{boxSizing: 'border-box',
                            margin: 0,
                            padding: 0,
                            color: 'rgba(0, 0, 0, 0.88)',
                            fontSize: '14px',
                            lineHeight: '1.5714285714285714',
                            listStyle: 'none'}}>Futura 小店铺</div>
                          <span style={{color: 'rgba(0, 0, 0, 0.65)',
                            fontSize: '12px',
                            lineHeight: '20px'}}>快来看看，什么都有哦</span>
                        </div>

                      </a>

                    </li>
                    <li className={styles.menuRouterli}>
                      <a href='https://futura.bestzpr.cn' target='_blank' className={styles.menu_menuRouterA}>
                        <img src={FGpt.src}
                             style={{maxWidth: '150px',
                               maxHeight: '45px',marginTop: '5px',border: '1px solid #f0f0f0' }}
                        />
                        <div style={{textAlign:'left',marginLeft:'10px'}}>
                          <div style={{boxSizing: 'border-box',
                            margin: 0,
                            padding: 0,
                            color: 'rgba(0, 0, 0, 0.88)',
                            fontSize: '14px',
                            lineHeight: '1.5714285714285714',
                            listStyle: 'none'}}>Futura AI</div>
                          <span style={{color: 'rgba(0, 0, 0, 0.65)',
                            fontSize: '12px',
                            lineHeight: '20px'}}>通用AI大模型、绘画支持网站</span>
                        </div>

                      </a>

                    </li>


                  </ul>

                  <ul className={styles.menuRouterul}>
                    <li className={styles.menuRouterli}>
                      <a href='https://uptime.bestzpr.cn/status/futura' target='_blank' className={styles.menu_menuRouterA}>
                        {/*<img src={UptimeIcon.src}*/}
                        {/*     style={{maxWidth: '150px',*/}
                        {/*       maxHeight: '45px',marginTop: '5px',border: '1px solid #f0f0f0' }}*/}
                        {/*/>*/}
                        <UptimeIcon width='100px' style={{marginTop: '5px',border: '1px solid #f0f0f0'}}/>
                        <div style={{textAlign:'left',marginLeft:'10px'}}>
                          <div style={{boxSizing: 'border-box',
                            margin: 0,
                            padding: 0,
                            color: 'rgba(0, 0, 0, 0.88)',
                            fontSize: '14px',
                            lineHeight: '1.5714285714285714',
                            listStyle: 'none'}}>Futura 服务状态</div>
                          <span style={{color: 'rgba(0, 0, 0, 0.65)',
                            fontSize: '12px',
                            lineHeight: '20px'}}>服务监控</span>
                        </div>

                      </a>

                    </li>
                    <li className={styles.menuRouterli}>
                      <a href='https://ai-api.mafutura.top' target='_blank' className={styles.menu_menuRouterA}>
                        <img src={GPTZhuanPng.src}
                             style={{maxWidth: '150px',
                               maxHeight: '45px',marginTop: '5px',border: '1px solid #f0f0f0' }}
                        />
                        <div style={{textAlign:'left',marginLeft:'10px'}}>
                          <div style={{boxSizing: 'border-box',
                            margin: 0,
                            padding: 0,
                            color: 'rgba(0, 0, 0, 0.88)',
                            fontSize: '14px',
                            lineHeight: '1.5714285714285714',
                            listStyle: 'none'}}>Futura API接口</div>
                          <span style={{color: 'rgba(0, 0, 0, 0.65)',
                            fontSize: '12px',
                            lineHeight: '20px'}}>提供中转接口，个人开发者必备</span>
                        </div>

                      </a>

                    </li>
                  </ul>
                </div>
            )}


          </div>
          <div className={`${styles.menuA} ${currentPage === "home" ? styles.active : ""}`}>

            <a
                href="#"
                className={`${styles.menu_a}`}
                onClick={() => handleMenuClick("home")}
            >
              <AppIcon className={styles.menuLogoIcon}/>
              <div>首页</div>
            </a>
          </div>

          <a
              href="#"
              className={`${styles.menuA} ${currentPage === "chat" ? styles.active : ""}`}
              onClick={() => handleMenuClick("chat")}
          >
            <LiaotianIcon className={styles.menuLogoIcon}/>
            <div>聊天</div>
          </a>
          <a
              href="#"
              className={`${styles.menuA} ${currentPage === "draw" ? styles.active : ""}`}
              onClick={() => handleMenuClick("draw")}
          >
            <DrawIcon className={styles.menuLogoIcon}/>
            <div>绘画</div>
          </a>
          {userInfo && (
              <>
                <a
                    href="#"
                    className={`${styles.menuA} ${currentPage === "wrting" ? styles.active : ""}`}
                    onClick={() => handleMenuClick("writing")}
                >
                  <WiritingIcon className={styles.menuLogoIcon}/>
                  <div>写作</div>
                </a>
                <a
                    href="#"
                    className={`${styles.menuA} ${currentPage === "music" ? styles.active : ""}`}
                    onClick={() => handleMenuClick("music")}
                >
                  <AIMusicIcon className={styles.menuLogoIcon}/>
                  <div>AI音乐</div>
                </a>
              </>
          )}

          {/*<a*/}
          {/*    href="https://pay-chat.mafutura.top/" target={"_blank"}*/}
          {/*    className={`${styles.menuA} ${currentPage === "buy" ? styles.active : ""}`}*/}
          {/*>*/}
          {/*  <SubscribeIcon className={styles.menuLogoIcon}/>*/}
          {/*  <div>订阅</div>*/}
          {/*</a>*/}
          <a
              onClick={() => handleMenuClick("model")}
              className={`${styles.menuA} ${currentPage === "model" ? styles.active : ""}`}
          >
            <ModelPriceIcon className={styles.menuLogoIcon}/>
            <div>价格</div>
          </a>
          <a
              onClick={() => handleMenuClick("shuoming")}
              className={`${styles.menuA} ${currentPage === "shuoming" ? styles.active : ""}`}
          >
            <InstructionsIcon className={styles.menuLogoIcon}/>
            <div>说明</div>
          </a>



          {userInfo && !isActiveStatuView && (
              <div
                  onClick={() => handleMenuClick("userInfo")}
                  className={styles.userLogo}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
              >
                <Avatar
                    size={{ xs: 24, sm: 32, md: 40, lg: 64, xl: 64, xxl: 64 }}
                    className={styles.userAvatar} src={<img src={userInfo?.avatarUrl || ''} alt="个人中心" />} />

                <Button
                    onClick={async () => {
                      if (await showConfirm("确认退出吗？")){
                        accessStore.update(
                            (access) => (access.accessCode = ''),
                        );
                        // 跳转到首页*/}
                        window.location.href = '/';
                      }
                    }}
                    className={styles.userInfoLogout}
                    block>退出登录</Button>
                {/*<img className={styles.userAvatar} src={userInfo?.avatarUrl || ''} alt={"个人中心"}/>*/}
                {showLogoutButton && (
                    <div className={styles.logOutDiv}>
                      个人中心
                      {/*<a href="#" className={styles.logOut} onClick={async () => {*/}
                      {/*  if (await showConfirm("确认退出吗？")) {*/}
                      {/*    accessStore.update(*/}
                      {/*        (access) => (access.accessCode = ''),*/}
                      {/*    );*/}
                      {/*    // 跳转到首页*/}
                      {/*    window.location.href = '/';*/}
                      {/*  }*/}
                      {/*}}>退出</a>*/}
                    </div>
                )}

              </div>

          )}
          {!userInfo && (
              <div
                  className={styles.userLogo}
                  onClick={() => handleMenuClick("login")}
              >
                {/*<span className={styles.userAvatar_notlogin} >登录</span>*/}
                <Avatar
                    size={{ xs: 24, sm: 32, md: 40, lg: 64, xl: 64, xxl: 64 }}
                    style={{ backgroundColor: 'var(--primary)' }} icon={<UserOutlined />} />
                {/*<a href='#' className={styles.userAvatar_notlogin}>登录</a>*/}
                {/*<img className={styles.userAvatar} src='https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_web/WX20240315-143017.png'/>*/}
                {/*<Button className={styles.logOut} onClick={() => handleMenuClick("login")}>登录</Button>*/}
              </div>
          )}
          {showModal && showPrompt && (
              <div className={styles.modal}>
                <Modal
                    title="系统公告"
                    onClose={() => {
                      setModelhidden(); // 关闭模态窗口
                    }}
                    actions={[
                      <ListItem title={'今日不再提示🔔'}>
                        <input
                            type="checkbox"
                            checked={!showPrompt}
                            onChange={handleDismiss}
                        ></input>
                      </ListItem>,
                      <IconButton
                          key="reset"
                          icon={<CloseIcon />}
                          bordered
                          text={'关闭'}
                          onClick={async () => {
                            setModelhidden();
                          }}
                      />,
                    ]}
                >
                 <div>
                    <h1>欢迎使用 Futura AI</h1>
                    <span>通过每日签到可获🉐 1000 积分</span>
                     <p style={{textAlign:'left'}}>
                      本次更新点:
                     <li style={{ textDecoration: 'none'}}>📌1.全新UI样式更新，优化使用体验</li>
                     <li style={{ textDecoration: 'none'}}>📌2.写作模块、AI 音乐模块上线</li>
                   </p>
                   {/*<p>*/}
                   {/*  支持联网搜索，建议先查看模型价格及常见问题文档*/}
                   {/*</p>*/}
                   {/*<img src={xlPng.src} width={'100%'}/>*/}
                   {/*<img src={xhPng.src} width={'100%'}/>*/}
                   {/*<img src={zyPng.src} width={'100%'}/>*/}
                   {/*<img src={Case1Png.src} width={'100%'}/>*/}
                 </div>
                </Modal>
              </div>
          )}

        </div>


        {currentPage === "shuoming" && (
            <div style={{width:'80%',height:'90%',padding:'20px',margin:'auto',overflow: 'auto' }}>
              <Markdown
                  content={shuomingMarkdownContent}
              />
            </div>

        )}
        {currentPage === "model" && (
            <div style={{width:'80%',height:'90%',padding:'20px',margin:'auto',overflow: 'auto' }}>
              <Markdown
                  content={modelMarkdownContent}
              />
            </div>
        )}
      {currentPage === "home" && !isActiveStatuView && (
          <div className={styles.homeContainer} style={{ textAlign: "center" }}>
            <h1>Futura AI</h1>
            <h2>智能未来的世界欢迎您！</h2>
            <p>在这里，与人工智能一同探索无尽的可能性！</p>
            {/*<p>*/}
            {/*  近期上线计划：<br/><br/>*/}
            {/*    1.提示语-绘图功能*/}
            {/*    2.绘图广场*/}
            {/*    3.轻应用商店*/}
            {/*</p>*/}
            {/*<p>*/}
            {/*  长期上线计划：<br/><br/>*/}
            {/*    1.支持联网*/}
            {/*    2.支持插件功能*/}
            {/*    3.支持知识库系统*/}
            {/*</p>*/}
            {/*<p style={{width:'50%',margin:'auto',marginTop:'50px'}}>*/}
            {/*  接口的调用量按照token进行计算，和openai的token计算标准一致，一般来说每 1000token 约等于 500 个汉字 或 750个英文单词，*/}
            {/*  可以在openai提供的 <a href={'https://platform.openai.com/tokenizer'}>token计算器</a> 中进行模拟。*/}
            {/*  一次对话的token计算包含 请求 和 响应 中的总token数,其中发送的消息会附带上文的消息会更多的消耗积分，请注意⚠️*/}
            {/*</p>*/}
            <div style={{overflowY: 'auto',height: '100%'}}>
              <ul className={styles.showcaseList}>
                {data.map((item) => (
                    <li className={styles.card}>
                      <div className={styles.card__body}>
                        <div className={styles.showcaseCardHeader_Wgbd}>
                          <h4 className={styles.showcaseCardTitle}>
                            <a href={'#'}>{item.zh.title}</a>
                            <span className={styles.showcaseCardBody_fqoj}>🔥{formatNumber(item.weight)}</span>
                          </h4>
                          <div className={'ant-btn-group css-1qhpsh8'}>
                            <CopyIcon width={30} onClick={() => copyToClipboard(item.zh.description)} a/>
                          </div>
                        </div>
                        <p className={styles.showcaseCardBody_fqoj}>
                          👉 {item.zh.remark}
                        </p>
                        <p className={styles.showcaseCardBody_fqoj} style={{'cursor':'pointer'}}>
                          {item.zh.description}
                        </p>
                      </div>
                      <ul className={styles.card__footer}>
                        {item.tags.map((tag) => (
                            <li className={styles.tag}>
                              <span className={styles.textLabel}>{tag}</span>
                              <span className={styles.colorLabel} style={{backgroundColor: getRandomColor()}}/>
                            </li>
                        ))}

                      </ul>
                    </li>
                ))}

              </ul>
            </div>
            <p style={{position:'absolute',bottom: '5px',margin:'auto',width:'95%',color:'#898989',padding: '5px 5px',
              backgroundColor: 'aliceblue'}}>
              发送邮件到 futura_gpt@163.com 将获取最新访问地址。建议记录 <a href={'#'} onClick={handleQQClick}>联系客服</a>
            </p>
          </div>
      )}

        {currentPage === "userInfo" && !isActiveStatuView && (
            <div className={styles.userInfoContainer} style={{ textAlign: "center" }}>
              <div className={styles["userBaseInfo"]} >
                <div className={styles.userBaseInfo_view}>
                  {/*<Avatar*/}
                  {/*    size={{ xs: 24, sm: 32, md: 40, lg: 64, xl: 64, xxl: 64 }}*/}
                  {/*    className={styles.userAvatar} src={<img src={userInfo?.avatarUrl || ''} alt="个人中心" />} />*/}

                  <div style={{'width':'100%'}}>
                    <h2>用户基本信息</h2>
                    <div style={{
                      // 'marginLeft': '20px',
                      'display': 'flex',
                      'flexFlow': 'column',
                      'marginTop': '50px',
                      'alignItems': 'center'}}>
                      <ImgCrop
                          modalTitle={'裁剪头像'}
                            modalOk={'确定'}
                            modalCancel={'取消'}
                          rotationSlider>
                        <Upload
                            name="file"
                            listType="picture-circle"
                            className="avatar-uploader"
                            showUploadList={false}
                            headers={{ Token: accessStore.accessCode }}
                            action={uploadFileUrl}
                            beforeUpload={beforeUpload}
                            onChange={handleChange}
                        >
                          <Avatar
                              size={{ xs: 24, sm: 32, md: 40, lg: 64, xl: 64, xxl: 90 }}
                              className={styles.userAvatar} src={<img src={userInfo?.avatarUrl || ''} alt="个人中心" />} />
                        </Upload>
                      </ImgCrop>

                      {userInfo?.email && (
                          <span
                              style={{ backgroundColor: '#FFFFFF','marginTop':'10px','width':'50%' }}
                          >邮箱📮: {userInfo.email}</span>
                      )}
                      {!userInfo?.email && (
                          <span
                              style={{ backgroundColor: '#FFFFFF','marginTop':'10px','width':'50%' }}
                          >邮箱📮: <a href={'#'} onClick={()=> showBindEmailConf()}>去绑定</a></span>
                      )}

                      {userInfo?.openId && (
                          <div style={{'marginTop':'10px'}}>
                            微信: 已绑定
                          </div>
                      )}
                      {!userInfo?.openId && (
                          <div style={{'marginTop':'10px'}}>
                            微信: <a href={'#'} onClick={()=> showBindWxConf()}>去绑定</a>
                          </div>
                      )}

                      <input
                          type="text"
                          value={userName}
                          maxLength={10}
                          minLength={1}
                          onChange={handleUserNameChange}
                          placeholder="请输入用户名"
                          style={{ backgroundColor: '#FFFFFF','marginTop':'10px','width':'50%' }}
                      />
                      <Button
                          disabled={isUserInfoLoading}
                          danger
                          className={styles.userInfoSubButton}
                          type="default"
                          onClick={handleSubmit}
                      >
                        {isUserInfoLoading ? '提交中...' : '提交'}
                      </Button>

                      {showBindWx && (
                          <>
                          <Divider />
                          <div style={{textAlign:'center',marginTop:'10px'}}>
                            <h3>微信绑定</h3>
                            <img src={Qrcode.src} style={{width:'180px'}}/>
                            <p style={{marginTop:'-10px'}}><img src={Wechat.src} style={{width:'20px'}}/>关注公众号后 发送 "<span style={{color:'red'}}>绑定</span>" 获取验证码</p>
                            <input type="text" placeholder="请输入验证码" style={{marginBottom:'8px'}} value={wxBindVCode} maxLength={4}
                                   onChange={(e) => setWxBindVCode(e.currentTarget.value)}
                            />
                            <Button
                                style={{marginLeft:'4px'}}
                                type="default"
                                onClick={()=> wxBind()}>绑定</Button>
                          </div>
                          </>
                      )}

                      {showBindEmail && (
                          <>
                          <Divider />
                          <div style={{textAlign:'center',display:'flex',flexDirection:'column',width:'100%',alignItems: 'center',marginTop:'10px'}}>
                            <h3>邮箱绑定</h3>
                            <input type="text" placeholder="请输入邮箱" style={{marginBottom:'8px',width:'80%'}} value={bindEmail} maxLength={30}
                                   onChange={(e) => setBindEmail(e.currentTarget.value)}
                            />
                            <div style={{width:'100%'}}>
                              <input type="text" placeholder="请输入验证码" style={{marginBottom:'8px',width:'30%'}} value={emailBindVCode} maxLength={4}
                                     onChange={(e) => setEmailBindVCode(e.currentTarget.value)}
                              />
                              <CountdownButton buttonText='发送验证码' onClick={emailBindSendCode}></CountdownButton>
                            </div>

                            <Button
                                style={{marginLeft:'4px',width:'50%'}}
                                type="default"
                                onClick={()=> emailBind()}>绑定</Button>
                          </div>
                          </>
                      )}


                    </div>

                  </div>


                {/*</>*/}

                  {/*<img className={styles.userBaseInfo_userAvatar} src={userInfo?.avatarUrl || 'default-avatar.jpg'}/>*/}
                </div>

                <div style={{'position': 'absolute', 'bottom': '0%', 'left': '104px', 'width': '100%','color': 'var(--black)'
                ,'backgroundColor': 'var(--white)','zIndex': 1,'height':'130px','paddingLeft':'30px'}}>
                  {/* 展示积分信息 */}
                  <div style={{'textAlign': 'left'}}>
                    <h3 style={{'marginBottom': '10px'}}>积分信息</h3>
                    <div style={{'marginBottom': '5px',color:'#666464'}}>
                      <BrainIcon width={20} />
                      <span>剩余积分：{pointsBalanceTotal}</span>
                      <ResetIcon style={{'marginLeft':'10px','cursor':'pointer'}} onClick={() => getPoint(false)}/>
                      <br/>
                      {/*<BrainIcon width={20} />*/}
                      {/*<span>限免消耗💰：{pointsBalanceUseFreeTotal}</span>*/}

                    </div>
                    <SubscribePointIcon width={20} />
                    <a href={'https://pay-chat.mafutura.top/'} target="_blank"> 订阅积分</a>
                  </div>
                </div>
              </div>

              <Divider type="vertical"  style={{height:'100%'}}/>

              <div className={styles["userRecord"]} id={SlotID.AppBody}>
                <div className={styles.userBaseInfoEdit}>
                  <div style={{'width':'50%'}}>
                    <h2>签到</h2>
                    <IconButton
                        disabled={signToday}
                        className={styles.signCodeSubButton}
                        text={signToday ? '今日已签到...' : '签到'}
                        type="primary"
                        onClick={signClick}
                    />
                    <p style={{color:'cadetblue'}}>每日签到可获得 1000 积分</p>
                  </div>
                  <div style={{'width':'50%'}}>
                    <h2>积分兑换</h2>
                    <Input
                        style={{'marginTop':'50px','width':'50%'}}
                        className={styles['modal-input']}
                        value={inputValue}
                        maxLength={40}
                        onChange={(e) => setInputValue(e.currentTarget.value)}
                        placeholder="请输入兑换码"
                    />
                    <IconButton
                        disabled={isExhangeCodeLoading}
                        className={styles.exchangeCodeSubButton}
                        text={isExhangeCodeLoading ? '兑换中...' : '兑换'}
                        type="primary"
                        onClick={confirmExchange}
                    />
                  </div>
                </div>
                <div className={styles.userBaseBr}></div>
                <div className={styles.userRechargeRecord}>
                    <PaginationTable/>
                </div>
              </div>

            </div>
        )}


      {/*  {!userInfo && currentPage === "chat" && !isActiveStatuView && (*/}
      {/*    <AuthPage />*/}
      {/*)}*/}
        {currentPage === "login" && (
            <AuthPage />
        )}
        {currentPage === "draw" && (
            <Drawing />
        )}
        {currentPage === "music" && (
            <Music />
        )}
        {currentPage === "writing" && (
            <Writing />
        )}
        <Routes>
          <Route path={Path.Active} element={<Active />} />
        </Routes>
      {currentPage === "chat" && (
          <>
            {/*<div style={{    'color': '#938a8a',*/}
            {/*  'paddingTop': '10px',*/}
            {/*  'paddingLeft': '28px',*/}
            {/*  'height': '47px',*/}
            {/*  'backgroundColor': '#fffbfb',*/}
            {/*  'width': '295px',*/}
            {/*  'position': 'absolute',*/}
            {/*  'left': '102px',*/}
            {/*  'zIndex': '20',*/}
            {/*  'bottom': '1px'}}>*/}
            {/*  <BrainIcon width={20} />*/}
            {/*  <span>积分：{pointsBalance} / {pointsBalanceTotal}</span>*/}
            {/*  <ResetIcon style={{'marginLeft':'10px'}} onClick={() => getPoint()}/>*/}
            {/*</div>*/}
            <SideBar className={isHome ? styles["sidebar-show"] : ""} handleShowDismiss={handleShowDismiss}/>

            <div className={styles["window-content"]} id={SlotID.AppBody}>
              <Routes>
                <Route path={Path.Home} element={<Chat/>} />
                <Route path={Path.NewChat} element={<NewChat />} />
                <Route path={Path.Masks} element={<MaskPage />} />
                <Route path={Path.Chat} element={<Chat  />} />
                <Route path={Path.Settings} element={<Settings />} />
                <Route path={Path.Active} element={<Active />} />
              </Routes>
            </div>
            {/*右边的菜单*/}
            {/*<div className={styles.menuMinContainer}>*/}
            {/*  <a*/}
            {/*      href="#"*/}
            {/*      className={`${styles.menuMin} ${currentPage === "chat" ? styles.active : ""}`}*/}
            {/*      onClick={() => handleMenuClick("chat")}*/}
            {/*  >*/}
            {/*    <LiaotianIcon className={styles.menuLogoIcon}/>*/}
            {/*    <div>聊天</div>*/}
            {/*  </a>*/}
            {/*  <a*/}
            {/*      href="#"*/}
            {/*      className={`${styles.menuMin} ${currentPage === "draw" ? styles.active : ""}`}*/}
            {/*      onClick={() => handleMenuClick("draw")}*/}
            {/*  >*/}
            {/*    <DrawIcon className={styles.menuLogoIcon}/>*/}
            {/*    <div>写作</div>*/}
            {/*  </a>*/}
            {/*  <a*/}
            {/*      onClick={() => handleMenuClick("model")}*/}
            {/*      className={`${styles.menuMin} ${currentPage === "model" ? styles.active : ""}`}*/}
            {/*  >*/}
            {/*    <ModelPriceIcon className={styles.menuLogoIcon}/>*/}
            {/*    <div>翻译</div>*/}
            {/*  </a>*/}
            {/*</div>*/}
          </>

      )}
      </div>



      </div>

  );
}

export function useLoadData() {
  const config = useAppConfig();

  useEffect(() => {
    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  useSwitchTheme();
  useLoadData();
  useHtmlLang();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }
  // if (!useAccessStore.isAuthorized) {
  //   return <AuthPage />;
  // }
  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}

const CountdownButton = ({ buttonText, onClick }: { buttonText: string, onClick: () => Promise<Response>}) => {
  const [countdown, setCountdown] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);

  const startCountdown = () => {
    setCountdown(60);
    setIsDisabled(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setIsDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleButtonClick = () => {
    if (!isDisabled) {
      // 调用外部传入的点击事件处理函数
      onClick().then(response => response.json())
          .then(data => {
            // 处理响应数据
            if(!data.success){
              message.error(data.data)
              return false;
            }
            message.success(data.data);
            startCountdown()
            return true;
          })
          .catch((error) => {
            // 处理错误
            console.error(error);
            message.error(error)
          });
    }
  };

  return (
      <Button
          style={{ marginLeft: '4px',minWidth:'102px' }}
          type="default"
          onClick={handleButtonClick}
          disabled={isDisabled}
      >
        {isDisabled ? `${countdown}s` : buttonText}
      </Button>
  );
};

export default CountdownButton;
