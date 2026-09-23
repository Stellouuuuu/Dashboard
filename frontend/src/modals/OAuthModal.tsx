import { Modal } from '../components/Modal';
import { IconCheck } from '../components/Icons';
import { useAppData } from '../context/AppDataContext';

export function OAuthModal() {
  const { modal, closeModal, connectGithub, githubLoading, githubError } =
    useAppData();
  const open = modal === 'oauth';

  return (
    <Modal open={open} onClose={closeModal} title="Autoriser Threshold">
      <p className="oauth-intro">
        Threshold souhaite accéder à ton compte GitHub pour :
      </p>
      <ul className="oauth-perms">
        <li>
          <IconCheck /> Lire la liste de tes dépôts
        </li>
        <li>
          <IconCheck /> Lire les commits et alertes de sécurité
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
        {githubLoading ? 'Autorisation…' : 'Autoriser'}
      </button>
    </Modal>
  );
}
