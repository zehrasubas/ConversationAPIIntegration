import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333'
    }}>
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
      
      <h2>1. Information We Collect</h2>
      <p>When you use our Facebook Login feature, we collect:</p>
      <ul>
        <li>Your Facebook user ID</li>
        <li>Your name</li>
        <li>Your email address (if provided)</li>
        <li>Your public profile information</li>
        <li>Your travel preferences and interests (optional)</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Provide personalized travel recommendations</li>
        <li>Enable Facebook Messenger integration for travel support</li>
        <li>Improve our travel website functionality</li>
        <li>Communicate with you about travel opportunities</li>
        <li>Send travel updates and destination information</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in these circumstances:</p>
      <ul>
        <li>With Facebook/Meta as required for platform integration</li>
        <li>With trusted travel partners for booking services</li>
        <li>When required by law</li>
        <li>To protect our rights and safety</li>
      </ul>

      <h2>4. Facebook Integration</h2>
      <p>Our website integrates with Facebook Login and Messenger Platform. By using these features:</p>
      <ul>
        <li>You consent to Facebook's data policies</li>
        <li>Information may be shared between our service and Facebook</li>
        <li>You can revoke access at any time through your Facebook settings</li>
        <li>We may use your data to provide travel-related messaging</li>
      </ul>

      <h2>5. Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Withdraw consent at any time</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>We use cookies and similar technologies to enhance your browsing experience and enable Facebook integration features.</p>

      <h2>8. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at:</p>
      <p>Email: privacy@yourdomain.com<br/>
      Address: [Your Company Address]</p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Facebook Data Policy Compliance</h3>
        <p>This service complies with Facebook's Platform Policies and Data Policy. For more information about how Facebook handles your data, please review <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">Facebook's Privacy Policy</a>.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 