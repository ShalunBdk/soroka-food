import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router';
import api from '../services/api';
import '../styles/Unsubscribe.css';

export default function Unsubscribe() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link');
      return;
    }

    handleUnsubscribe();
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      const result = await api.newsletter.unsubscribe(token!);
      setStatus('success');
      setMessage(result.message || 'You have been unsubscribed successfully');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Unsubscribe failed. The link may be invalid.');
    }
  };

  return (
    <div className="unsubscribe-page">
      <div className="unsubscribe-container">
        {status === 'loading' && (
          <div className="unsubscribe-loading">
            <div className="spinner"></div>
            <h2>Processing your request...</h2>
            <p>Please wait a moment</p>
          </div>
        )}

        {status === 'success' && (
          <div className="unsubscribe-success">
            <div className="success-icon">👋</div>
            <h2>Unsubscribed Successfully</h2>
            <p>{message}</p>
            <p className="info-text">
              We're sorry to see you go! You won't receive any more newsletter emails from us.
            </p>
            <p className="resubscribe-text">
              Changed your mind? You can always subscribe again on our homepage.
            </p>
            <Link to="/" className="btn-home">
              Go to Homepage
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="unsubscribe-error">
            <div className="error-icon">✗</div>
            <h2>Unsubscribe Failed</h2>
            <p>{message}</p>
            <div className="error-actions">
              <Link to="/" className="btn-home">
                Go to Homepage
              </Link>
              <p className="contact-text">
                If you continue to have problems, please contact us directly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
