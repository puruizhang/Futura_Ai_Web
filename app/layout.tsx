/* eslint-disable @next/next/no-page-custom-font */
import "./styles/globals.scss";
import "./styles/markdown.scss";
import "./styles/highlight.scss";
import { getClientConfig } from "./config/client";
import { type Metadata } from "next";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import {CommentOutlined, CustomerServiceOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import { FloatButton } from 'antd';

export const metadata: Metadata = {
  title: "Futura AI",
  description: "Futura AI是一款创新的人工智能技术，旨在为用户提供智能化的解决方案。它结合了先进的机器学习算法和自然语言处理技术，能够理解和生成自然语言，以及具备强大的推理和决策能力.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
  ],
  appleWebApp: {
    title: "Futura AI",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="config" content={JSON.stringify(getClientConfig())} />
        <link rel="manifest" href="/site.webmanifest"></link>
        <script src="/serviceWorkerRegister.js" defer></script>
      </head>
      <body>
      {/*<FloatButton icon={<QuestionCircleOutlined />} type="default" style={{ right: 24,bottom:150 }} />*/}

      <AntdRegistry>{children}</AntdRegistry></body>
    </html>
  );
}
