import React from 'react';

export const PrivacyPolicy: React.FC = () => (
  <>
    <p><strong>Effective Date:</strong> March 26, 2026</p>
    <p><strong>Last Updated:</strong> March 26, 2026</p>

    <p>
      Gatsby Glass, a brand operated by Horse Power Brands, LLC and its affiliated franchise entities
      (&ldquo;Gatsby Glass,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
      respects your privacy. This Privacy Policy explains how we collect, use, disclose, and
      safeguard your information when you use our GatsbyView AI-powered shower visualization tool
      (the &ldquo;Service&rdquo;), accessible at our website and through authorized franchise
      partner integrations. Please read this policy carefully. By accessing or using the Service,
      you acknowledge that you have read and understood this Privacy Policy.
    </p>

    <h3>1. Information We Collect</h3>

    <h4>A. Information You Provide Directly</h4>
    <ul>
      <li>
        <strong>Contact Information:</strong> When you submit a lead form to save your visualization
        or request a quote, we collect your full name, email address, phone number (optional or
        required depending on the request type), and ZIP code.
      </li>
      <li>
        <strong>Uploaded Photos:</strong> You may upload photographs of your bathroom or shower area
        and/or inspiration images. These photos are transmitted to a third-party AI service for
        processing (see Section 3) and are not permanently stored on our servers after your session,
        unless you submit a lead form.
      </li>
      <li>
        <strong>Design Preferences:</strong> The product configuration choices you make during the
        visualization process, including door type, glass style, hardware finish, handle style,
        shower shape, and framing preferences.
      </li>
      <li>
        <strong>Issue Reports:</strong> If you submit a report about a problem with the Service, we
        collect the text of your description along with associated session and visualization data.
      </li>
      <li>
        <strong>Team Login Credentials:</strong> Authorized franchise team members authenticate via
        email-based magic link. We collect and verify the email address against our franchise
        directory.
      </li>
    </ul>

    <h4>B. Information Collected Automatically</h4>
    <ul>
      <li>
        <strong>Session Identifier:</strong> We generate a random, anonymous identifier stored in
        your browser&rsquo;s local storage to associate your visualization history and enforce usage
        limits. This is not linked to your identity unless you voluntarily submit a lead form.
      </li>
      <li>
        <strong>IP Address:</strong> We collect your IP address for rate-limiting purposes and as
        evidence of consent when you provide your phone number via the lead form.
      </li>
      <li>
        <strong>User Agent String:</strong> When you provide TCPA consent (phone/SMS marketing
        consent), we record your browser&rsquo;s user agent string as evidence of the consent event.
      </li>
      <li>
        <strong>Authentication Cookies:</strong> If you log in as a franchise team member, we use
        session cookies managed by our authentication provider (Supabase) to maintain your
        authenticated session.
      </li>
    </ul>

    <h4>C. AI-Generated Content</h4>
    <p>
      When you use the visualization tool, the Service generates AI-rendered images based on your
      uploaded photos and design selections. These generated images, including watermarked versions,
      are stored in our systems for approximately 30 days and are accessible via a direct URL. If
      you submit a lead form, the associated visualization images may be retained beyond the default
      period to support your consultation.
    </p>

    <h3>2. How We Use Your Information</h3>
    <ul>
      <li>
        <strong>Service Delivery:</strong> To generate AI-powered visualizations of shower glass
        configurations based on your photos and preferences.
      </li>
      <li>
        <strong>Franchise Referral:</strong> To connect you with a local Gatsby Glass franchise
        professional in your area when you request a quote or save your visualization.
      </li>
      <li>
        <strong>Communication:</strong> To respond to your inquiries, send your saved visualizations
        via email, and, with your consent, contact you via phone or text message regarding your
        inquiry.
      </li>
      <li>
        <strong>Rate Limiting:</strong> To enforce fair-use limits on the visualization tool for
        non-authenticated users using your anonymous session identifier and IP address.
      </li>
      <li>
        <strong>Service Improvement:</strong> To review issue reports, monitor Service performance,
        and improve the accuracy and quality of AI-generated visualizations.
      </li>
      <li>
        <strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal
        processes, and to protect our rights, privacy, safety, or property.
      </li>
    </ul>

    <h3>3. Third-Party Services and Data Sharing</h3>
    <p>We share your information with the following categories of third parties:</p>
    <ul>
      <li>
        <strong>Google (Gemini AI):</strong> Your uploaded photographs and text-based design
        parameters are transmitted to Google&rsquo;s Gemini AI service to perform image validation
        and generate visualizations. Google may process and temporarily retain this data in
        accordance with its own privacy policies and terms of service. We encourage you to review{' '}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google&rsquo;s Privacy Policy
        </a>.
      </li>
      <li>
        <strong>Supabase:</strong> We use Supabase as our database, authentication, and file
        storage provider. Your data is stored on Supabase&rsquo;s infrastructure. Supabase acts as
        a data processor on our behalf.
      </li>
      <li>
        <strong>Vercel:</strong> Our Service is hosted on Vercel&rsquo;s platform. Standard web
        server logs (including IP addresses and request metadata) may be collected by Vercel in the
        ordinary course of hosting.
      </li>
      <li>
        <strong>Franchise Partners:</strong> When you submit a lead form, your contact information,
        design preferences, and visualization images are shared with the Gatsby Glass franchise
        location serving your area to facilitate your consultation.
      </li>
    </ul>
    <p>
      <strong>We do not sell your personal information to third parties.</strong> We do not share
      your personal information for cross-context behavioral advertising or targeted advertising
      purposes.
    </p>

    <h3>4. Cookies and Local Storage</h3>
    <p>The Service uses the following browser storage mechanisms:</p>
    <ul>
      <li>
        <strong>Authentication Cookies:</strong> Managed by Supabase to maintain authenticated
        sessions for franchise team members. These are strictly necessary for the login
        functionality.
      </li>
      <li>
        <strong>Local Storage (Anonymous Identifier):</strong> A randomly generated UUID stored in
        your browser&rsquo;s local storage to track your visualization history and usage count
        across visits. This identifier is not linked to your personal identity unless you
        voluntarily submit a lead form.
      </li>
    </ul>
    <p>
      We do not use third-party analytics cookies, advertising cookies, or tracking pixels. You can
      clear local storage and cookies through your browser settings at any time, though this may
      reset your visualization history and usage count.
    </p>

    <h3>5. Data Retention</h3>
    <ul>
      <li>
        <strong>Visualization Images:</strong> AI-generated images are retained for approximately 30
        days after creation, after which they are automatically deleted from our storage systems. If
        you submit a lead form, images associated with your consultation may be retained for longer
        to support the franchise engagement.
      </li>
      <li>
        <strong>Lead Information:</strong> Contact information and associated data submitted via lead
        forms are retained as long as necessary to fulfill the purpose of your inquiry, comply with
        legal obligations, and support legitimate business interests.
      </li>
      <li>
        <strong>Rate Limit Records:</strong> Anonymous usage records (session identifier and IP
        address) are retained to enforce monthly usage limits and may be periodically purged.
      </li>
      <li>
        <strong>TCPA Consent Records:</strong> Records of your phone/SMS consent, including
        timestamp, consent text, IP address, and user agent, are retained as legally required
        evidence of consent.
      </li>
    </ul>

    <h3>6. TCPA Disclosure</h3>
    <p>
      If you provide your phone number and consent to be contacted, you agree to receive calls
      and/or text messages from Gatsby Glass and its local franchisees at the phone number provided.
      Consent is not a condition of purchase. Message and data rates may apply. You may opt out at
      any time by replying STOP to any text message or by contacting us using the information below.
      We record your consent along with your IP address, browser user agent, timestamp, and the
      exact consent language you agreed to, as required for TCPA compliance.
    </p>

    <h3>7. Children&rsquo;s Privacy</h3>
    <p>
      The Service is not directed to children under the age of 13. We do not knowingly collect
      personal information from children under 13. If we become aware that we have collected
      personal information from a child under 13 without verifiable parental consent, we will take
      steps to delete that information. If you believe we may have collected information from a
      child under 13, please contact us using the information in Section 11.
    </p>

    <h3>8. Security</h3>
    <p>
      We implement reasonable administrative, technical, and physical safeguards to protect your
      personal information. These measures include encrypted data transmission (HTTPS/TLS), security
      headers to prevent common web vulnerabilities, restricted access to administrative functions
      and sensitive credentials, and server-side isolation of privileged database operations.
      However, no method of electronic transmission or storage is 100% secure, and we cannot
      guarantee absolute security.
    </p>

    <h3>9. Your Privacy Rights Under State Law</h3>
    <p>
      Depending on your state of residence, you may have certain rights regarding your personal
      information. We honor these rights for all qualifying residents as described below.
    </p>

    <h4>California Residents (CCPA/CPRA)</h4>
    <p>If you are a California resident, you have the right to:</p>
    <ul>
      <li>
        <strong>Know</strong> what personal information we collect, use, disclose, and sell (we do
        not sell personal information).
      </li>
      <li><strong>Delete</strong> personal information we hold about you, subject to certain exceptions.</li>
      <li><strong>Correct</strong> inaccurate personal information we maintain about you.</li>
      <li>
        <strong>Opt out</strong> of the sale or sharing of personal information. As stated above, we
        do not sell or share personal information for cross-context behavioral advertising.
      </li>
      <li>
        <strong>Non-discrimination</strong> for exercising your privacy rights.
      </li>
    </ul>
    <p>
      <strong>Categories of personal information collected in the preceding 12 months:</strong>{' '}
      Identifiers (name, email, phone, IP address), internet/electronic activity (session IDs,
      usage data), geolocation data (ZIP code), and sensory data (uploaded photographs). We collect
      this information for the business purposes described in Section 2.
    </p>

    <h4>Virginia Residents (VCDPA)</h4>
    <p>If you are a Virginia resident, you have the right to:</p>
    <ul>
      <li>Access your personal data and obtain a portable copy.</li>
      <li>Delete personal data we have collected from you.</li>
      <li>Correct inaccuracies in your personal data.</li>
      <li>Opt out of targeted advertising, sale of personal data, and profiling.</li>
    </ul>

    <h4>Colorado Residents (CPA)</h4>
    <p>If you are a Colorado resident, you have the right to:</p>
    <ul>
      <li>Access, correct, and delete your personal data.</li>
      <li>Obtain a portable copy of your data.</li>
      <li>Opt out of targeted advertising, sale of personal data, and profiling.</li>
    </ul>

    <h4>Connecticut Residents (CTDPA)</h4>
    <p>If you are a Connecticut resident, you have the right to:</p>
    <ul>
      <li>Access, correct, and delete your personal data.</li>
      <li>Obtain a portable copy of your data.</li>
      <li>Opt out of targeted advertising, sale of personal data, and profiling.</li>
    </ul>

    <h4>Utah Residents (UCPA)</h4>
    <p>If you are a Utah resident, you have the right to:</p>
    <ul>
      <li>Access and delete your personal data.</li>
      <li>Opt out of the sale of personal data and targeted advertising.</li>
    </ul>

    <h4>Other State Residents</h4>
    <p>
      Additional US states have enacted or may enact comprehensive consumer privacy laws. If you are
      a resident of a state with applicable privacy legislation, we will honor your rights as
      required by law. Please contact us to submit a request.
    </p>

    <h4>How to Exercise Your Rights</h4>
    <p>
      To exercise any of the rights described above, please contact us at{' '}
      <a href="mailto:privacy@horsepowerbrands.com">privacy@horsepowerbrands.com</a>. We will
      verify your identity before processing your request. You may also designate an authorized
      agent to submit requests on your behalf. We will respond to verified requests within the
      timeframe required by applicable law (generally 45 days). If we decline your request, you may
      appeal by contacting us at the same email address.
    </p>

    <h3>10. Changes to This Privacy Policy</h3>
    <p>
      We may update this Privacy Policy from time to time to reflect changes in our practices or
      applicable law. When we make material changes, we will update the &ldquo;Last Updated&rdquo;
      date at the top of this policy. Your continued use of the Service after any changes
      constitutes your acceptance of the updated policy. We encourage you to review this policy
      periodically.
    </p>

    <h3>11. Contact Us</h3>
    <p>
      If you have questions, concerns, or requests regarding this Privacy Policy or our data
      practices, please contact us at:
    </p>
    <p>
      <strong>Horse Power Brands, LLC</strong><br />
      Attn: Privacy<br />
      Email:{' '}
      <a href="mailto:privacy@horsepowerbrands.com">privacy@horsepowerbrands.com</a><br />
      Website:{' '}
      <a
        href="https://www.horsepowerbrands.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        www.horsepowerbrands.com
      </a>
    </p>
  </>
);
