import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './Auth.module.css';

const strips = [
  ['Hồ sơ và đăng ký', 'Quản lý hồ sơ câu lạc bộ, cầu thủ và đăng ký tham gia từng mùa giải.'],
  [
    'Lịch thi đấu và kết quả',
    'Lập, điều chỉnh lịch thi đấu, ghi nhận và xác nhận kết quả trận đấu.',
  ],
  ['Thống kê và báo cáo', 'Tổng hợp bảng xếp hạng, thành tích cầu thủ và báo cáo mùa giải.'],
];
export function AuthLayout({
  children,
  change = false,
  action,
}: {
  children: ReactNode;
  change?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className={`${styles.page} ${change ? styles.change : ''}`}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src="/images/Whistle-EPL-Logo.png" alt="Whistle-EPL Logo" />
          <div>
            <strong>Whistle-EPL</strong>
            <small>HỆ THỐNG QUẢN LÝ GIẢI ĐẤU</small>
          </div>
        </div>
        {action ?? <Link to="/">← Quay lại trang tổng quan mùa giải</Link>}
      </header>
      <main className={styles.main}>
        <div className={styles.card}>
          <aside className={styles.visual}>
            <div className={styles.visualContent}>
              <div className={styles.brand}>
                <img src="/images/Whistle-EPL-Logo.png" alt="" />
                <div>
                  <strong>Whistle-EPL</strong>
                  <small>GIẢI BÓNG ĐÁ NGOẠI HẠNG ANH</small>
                </div>
              </div>
              <h1>HỆ THỐNG QUẢN LÝ GIẢI ĐẤU</h1>
              <p>
                Tập trung thông tin mùa giải, lịch thi đấu, kết quả và báo cáo trong một hệ thống
                duy nhất.
              </p>
              <div className={styles.strips}>
                {strips.map(([title, text]) => (
                  <div key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
          <section className={styles.formPanel}>{children}</section>
        </div>
      </main>
      <footer className={styles.footer}>
        © 2026 Whistle-EPL · Cổng thông tin và quản lý giải bóng đá Ngoại hạng Anh.
      </footer>
    </div>
  );
}
