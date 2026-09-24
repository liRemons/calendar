import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.less';

/**
 * 深色模式：data-theme 为唯一开关。
 * 未显式设置 data-theme 时按系统 prefers-color-scheme 自动写入（宿主显式设置 dark/light 时不覆盖）；
 * 监听 data-theme 属性变化与系统偏好变化，联动 antd ConfigProvider algorithm。
 */
function useDarkTheme(): boolean {
  const apply = () => {
    const el = document.documentElement;
    // 仅在宿主未显式设置时按系统偏好写入 data-theme
    if (!el.hasAttribute('data-theme')) {
      el.setAttribute(
        'data-theme',
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      );
    }
    return el.getAttribute('data-theme') === 'dark';
  };

  const [dark, setDark] = useState(apply);

  useEffect(() => {
    const el = document.documentElement;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const observer = new MutationObserver(() => setDark(apply()));
    observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    const onChange = () => setDark(apply());
    mql.addEventListener('change', onChange);
    return () => {
      observer.disconnect();
      mql.removeEventListener('change', onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return dark;
}

function Main() {
  const dark = useDarkTheme();

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{ algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
