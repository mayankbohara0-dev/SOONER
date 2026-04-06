import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BankLink.css';

export default function BankLink() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState(null);

  const mockBanks = [
    { id: 'hdfc', name: 'HDFC Bank', color: '#0B2265', icon: '🏦' },
    { id: 'sbi', name: 'State Bank of India', color: '#0055A5', icon: '🏛️' },
    { id: 'icici', name: 'ICICI Bank', color: '#F16A28', icon: '🏢' },
    { id: 'chase', name: 'Chase Bank', color: '#117ACA', icon: '🔵' },
  ];

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setStep(2);
    setTimeout(() => {
      setStep(3);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }, 2500);
  };

  return (
    <div className="banklink-page animate-fade-in">
      <div className="bl-modal">
        {/* Header mimicking Plaid */}
        <div className="bl-header">
          <div className="bl-lock">🔒</div>
          <span>SOONER SecureLink™</span>
        </div>

        {step === 1 && (
          <div className="bl-step animate-slide-up-fluid">
            <h2>Select your institution</h2>
            <p>Connect your bank securely to start saving automatically.</p>
            
            <div className="bl-bank-grid">
              {mockBanks.map(bank => (
                <div 
                  key={bank.id} 
                  className="bl-bank-card hover-spring"
                  onClick={() => handleBankSelect(bank)}
                >
                  <div className="bank-icon" style={{ background: bank.color }}>{bank.icon}</div>
                  <span className="bank-name">{bank.name}</span>
                </div>
              ))}
            </div>

            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: '20px', width: '100%' }}>
              Skip for now
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bl-step bl-loading animate-scale">
            <div className="bl-spinner" style={{ borderColor: selectedBank.color }}></div>
            <h2>Connecting to {selectedBank.name}</h2>
            <p>Establishing a secure 256-bit encrypted connection...</p>
          </div>
        )}

        {step === 3 && (
          <div className="bl-step bl-success animate-pop">
            <div className="bl-success-circle">✓</div>
            <h2>Successfully Linked!</h2>
            <p>Your {selectedBank.name} account is now connected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
