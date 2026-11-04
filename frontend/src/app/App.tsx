import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { SessionProvider } from '../shared/http/session-context';
import { FoundationRouter } from './router';

export function App() {
  return (
    <ConfigProvider locale={viVN}>
      <SessionProvider>
        <FoundationRouter />
      </SessionProvider>
    </ConfigProvider>
  );
}
