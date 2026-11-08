import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { SessionProvider } from '../shared/http/session-context';
import { FoundationRouter } from './router';

export function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#552cb6',
          fontFamily: "'Be Vietnam Pro', Arial, sans-serif",
          fontSize: 13.5,
          controlHeight: 40,
          borderRadius: 8,
          colorBorder: '#e3e7f2',
          colorTextPlaceholder: '#65718a',
        },
        components: {
          Select: {
            optionSelectedBg: '#eee7fb',
            optionSelectedColor: '#552cb6',
            optionActiveBg: '#f5f1fc',
          },
        },
      }}
    >
      <SessionProvider>
        <FoundationRouter />
      </SessionProvider>
    </ConfigProvider>
  );
}
