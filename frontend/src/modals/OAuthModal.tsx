import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { IconCheck } from '../components/Icons';
import { useAppData } from '../context/AppDataContext';

export function OAuthModal() {
  const { t } = useTranslation();
  const { modal, closeModal, connectGithub, githubLoading, githubError } =
    useAppData();
  const open = modal === 'oauth';

  return (
    <Modal open={open} onClose={closeModal} title={t('oauthModal.title')}>
      <p className="oauth-intro">{t('oauthModal.intro')}</p>
      <ul className="oauth-perms">
        <li>
          <IconCheck /> {t('oauthModal.perm1')}
        </li>
        <li>
          <IconCheck /> {t('oauthModal.perm2')}
        </li>
      </ul>
      {githubError && (
        <div className="form-banner error" role="alert">
          {githubError}
        </div>
      )}
      <button
        type="button"
        className="btn btn-primary"
        style={{ width: '100%' }}
        disabled={githubLoading}
        onClick={() => void connectGithub()}
      >
        {githubLoading ? t('oauthModal.authorizing') : t('oauthModal.authorize')}
      </button>
    </Modal>
  );
}
