import { ConfigProvider, Typography } from 'antd';
import viVN from 'antd/locale/vi_VN';
import styles from './App.module.css';

export function App() {
  return (
    <ConfigProvider locale={viVN}>
      <main className={styles.shell}>
        <Typography.Title level={1}>Whistle-EPL</Typography.Title>
        <Typography.Title level={2}>Nền tảng quản trị giải đấu</Typography.Title>
        <Typography.Paragraph>Các chức năng đang được triển khai.</Typography.Paragraph>
      </main>
    </ConfigProvider>
  );
}
