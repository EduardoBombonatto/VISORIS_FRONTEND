'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import styles from './AuthPage.module.css';

type Tab = 'login' | 'register';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<Tab>('login');

  return (
    <div className={styles.page}>
      <aside className={styles.banner}>
        <div className={styles.bannerLogo}>
          <span className={styles.logoMark}>EC</span>
          <span className={styles.brand}>EndoCloud</span>
        </div>

        <div className={styles.bannerContent}>
          <h1 className={styles.bannerTitle}>
            A maneira mais inteligente de gerenciar seus laudos médicos.
          </h1>
          <p className={styles.bannerText}>
            Junte-se a milhares de gastroenterologistas que abandonaram os softwares pesados e
            antigos e migraram para a agilidade da nuvem.
          </p>

          <div className={styles.socialProof}>
            <div className={styles.avatars}>
              <span className={styles.avatar}>M</span>
              <span className={styles.avatar}>J</span>
              <span className={styles.avatar}>A</span>
            </div>
            <p className={styles.socialText}>+ de 6.000 médicos aprovam</p>
          </div>
        </div>

        <p className={styles.bannerFooter}>© 2026 EndoCloud. Todos os direitos reservados.</p>
      </aside>

      <main className={styles.formArea}>
        <div className={styles.card}>
          <div className={styles.mobileLogo}>
            <span className={styles.logoMark}>EC</span>
            <span className={styles.brand}>EndoCloud</span>
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'login' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'register' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Criar Conta
            </button>
          </div>

          <div className={styles.formPanel} key={activeTab}>
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </main>
    </div>
  );
}
