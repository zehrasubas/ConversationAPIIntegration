import React from 'react';

const TermsOfService = () => {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333'
    }}>
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>

      <h2>2. Description of Service</h2>
      <p>Our service provides:</p>
      <ul>
        <li>Travel destination information and booking</li>
        <li>Travel experiences and tour recommendations</li>
        <li>Customer support through Facebook Login integration</li>
        <li>Messenger Platform connectivity for travel assistance</li>
        <li>Chat functionality for travel inquiries</li>
      </ul>

      <h2>3. User Obligations</h2>
      <p>You agree to:</p>
      <ul>
        <li>Provide accurate information for travel bookings</li>
        <li>Use the service responsibly and respect travel guidelines</li>
        <li>Comply with all applicable laws and travel regulations</li>
        <li>Respect other users' rights and travel experiences</li>
        <li>Not misuse our platform or provide false travel information</li>
      </ul>

      <h2>4. Facebook Integration</h2>
      <p>By using our Facebook Login and Messenger features:</p>
      <ul>
        <li>You agree to Facebook's Terms of Service</li>
        <li>You consent to data sharing between our service and Facebook</li>
        <li>You understand that Facebook's policies also apply</li>
        <li>Your travel preferences may be stored for better service</li>
      </ul>

      <h2>5. Privacy</h2>
      <p>Your privacy is important to us. Please review our <a href="/privacy" style={{ color: '#5DADE2' }}>Privacy Policy</a> for information about how we collect, use, and protect your travel data.</p>

      <h2>6. Prohibited Uses</h2>
      <p>You may not use our service to:</p>
      <ul>
        <li>Violate any laws or regulations</li>
        <li>Send spam or unsolicited messages</li>
        <li>Impersonate others</li>
        <li>Upload malicious content</li>
        <li>Interfere with our service operation</li>
      </ul>

      <h2>7. Intellectual Property</h2>
      <p>All content, trademarks, and intellectual property on this website are owned by us or our licensors and are protected by applicable laws.</p>

      <h2>8. Disclaimer of Warranties</h2>
      <p>This service is provided "as is" without warranties of any kind, either express or implied.</p>

      <h2>9. Limitation of Liability</h2>
      <p>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p>

      <h2>10. Modifications</h2>
      <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.</p>

      <h2>11. Termination</h2>
      <p>We may terminate or suspend your access to our service at any time, with or without cause.</p>

      <h2>12. Contact Information</h2>
      <p>If you have questions about these Terms of Service, please contact us at:</p>
      <p>Email: support@yourdomain.com<br/>
      Address: [Your Company Address]</p>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Facebook Platform Compliance</h3>
        <p>This service complies with Facebook's Platform Policies. For more information, please review <a href="https://developers.facebook.com/policy/" target="_blank" rel="noopener noreferrer">Facebook's Platform Policy</a>.</p>
      </div>
    </div>
  );
};

export default TermsOfService; 