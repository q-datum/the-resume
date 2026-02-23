import {Prose} from "@/components/ui/prose.tsx";
import {Container} from "@chakra-ui/react";

export const PrivacyPolicyPage = () => (
    <Container my="10">
        <Prose size="xl" baseColor="fg">
            <h1>Privacy Policy</h1>
            <p><strong>Last updated:</strong> 23.02.2026</p>

            <section aria-label="Plain English Summary">
                <h2>Plain English Summary</h2>
                <p>This AI chat is a personal portfolio project.</p>
                <p>Here is what you should know:</p>
                <ul>
                    <li>We do <strong>not</strong> require accounts.</li>
                    <li>We store the <strong>full text of your chat messages</strong>.</li>
                    <li>We keep a <strong>session ID in a cookie</strong> so the chat works properly.</li>
                    <li>We do <strong>not</strong> store your IP address, browser information, device details, timestamps, or metadata.</li>
                    <li>We use <strong>OpenAI</strong> to generate responses.</li>
                    <li>We use <strong>Google reCAPTCHA v3</strong> to prevent abuse.</li>
                    <li>Chat messages are stored <strong>indefinitely</strong> for session continuity and internal analytics.</li>
                    <li>Your data may be processed outside the EU (via OpenAI).</li>
                    <li>If you are under 16, you should use this service with parental consent.</li>
                </ul>
                <p>If you want details, please read the full policy below.</p>
            </section>

            <hr />

            <section>
                <h2>1. Data Controller</h2>
                <p>The data controller responsible for processing personal data is:</p>
                <p>
                    <strong>Alexander Muryshkin</strong><br />
                    Prague, Czech Republic<br />
                    Contact: <strong>q.datum@gmail.com</strong>
                </p>
            </section>

            <section>
                <h2>2. Overview of Data Processing</h2>
                <p>
                    The Website provides an AI-powered chat interface. Users do not create accounts.
                    Access to the chat is session-based.
                </p>
                <p>We process only the data necessary to operate the chat functionality.</p>
            </section>

            <section>
                <h2>3. Data We Collect and Store</h2>

                <h3>3.1 Chat Messages</h3>
                <p>We store the full content of messages submitted through the AI chat interface.</p>
                <p>This includes:</p>
                <ul>
                    <li>User prompts</li>
                    <li>AI responses</li>
                </ul>
                <p>These messages are stored indefinitely for:</p>
                <ul>
                    <li>Session continuity</li>
                    <li>Internal analytics and evaluation of the AI system</li>
                </ul>
                <p>Users should avoid submitting sensitive personal information.</p>

                <h3>3.2 Session Identifier (Cookies)</h3>
                <p>We store a session identifier in a browser cookie in order to:</p>
                <ul>
                    <li>Maintain chat session continuity</li>
                    <li>Associate messages with the correct session</li>
                </ul>
                <p>
                    This cookie does not contain personal data such as name, email, or IP address.
                </p>

                <h3>3.3 reCAPTCHA v3</h3>
                <p>
                    We use Google reCAPTCHA v3 to protect the Website from abuse and automated bots.
                </p>
                <p>reCAPTCHA may collect data such as:</p>
                <ul>
                    <li>Browser characteristics</li>
                    <li>Interaction data</li>
                </ul>
                <p>
                    This data is processed by Google in accordance with its own privacy policy.
                </p>
            </section>

            <section>
                <h2>4. Data We Do NOT Collect or Store</h2>
                <p>We explicitly do <strong>not</strong> store:</p>
                <ul>
                    <li>IP addresses</li>
                    <li>Browser information</li>
                    <li>Device identifiers</li>
                    <li>Geolocation data</li>
                    <li>Timestamps</li>
                    <li>User agent strings</li>
                    <li>Account information</li>
                    <li>Payment information</li>
                    <li>Any metadata beyond the raw chat message content</li>
                </ul>
                <p>
                    We do not perform profiling or automated decision-making based on user identity.
                </p>
            </section>

            <section>
                <h2>5. Third-Party Processors</h2>

                <h3>5.1 OpenAI</h3>
                <p>
                    Chat messages are transmitted to OpenAI for the purpose of generating AI responses.
                </p>
                <p>
                    OpenAI may process this data in accordance with its own privacy policy. Data may be
                    transferred outside the European Union.
                </p>

                <h3>5.2 Hosting Provider (VPS)</h3>
                <p>
                    Chat messages are stored on a Virtual Private Server (VPS). The hosting provider
                    processes data solely for infrastructure purposes.
                </p>

                <h3>5.3 Google reCAPTCHA</h3>
                <p>Used for abuse prevention. Operated by Google.</p>
            </section>

            <section>
                <h2>6. International Data Transfers</h2>
                <p>
                    Because OpenAI is based outside the European Union, chat messages may be transferred
                    to and processed in countries outside the EU.
                </p>
                <p>
                    Such transfers are performed under applicable data protection mechanisms in accordance
                    with GDPR.
                </p>
            </section>

            <section>
                <h2>7. Legal Basis for Processing (GDPR)</h2>
                <p>Under the General Data Protection Regulation (GDPR), the legal bases for processing are:</p>
                <ul>
                    <li><strong>Article 6(1)(b)</strong> – Processing necessary to provide the chat service.</li>
                    <li><strong>Article 6(1)(f)</strong> – Legitimate interest in maintaining service functionality and preventing abuse.</li>
                    <li><strong>Article 6(1)(a)</strong> – Consent via cookie use and continued use of the service.</li>
                </ul>
            </section>

            <section>
                <h2>8. Data Retention</h2>
                <p>Chat messages are stored indefinitely unless:</p>
                <ul>
                    <li>The service is discontinued, or</li>
                    <li>A user requests deletion of their session data (if identifiable via session ID).</li>
                </ul>
            </section>

            <section>
                <h2>9. Minors</h2>
                <p>The Website does not intentionally target children under 16 years of age.</p>
                <p>If you are under 16, you should use this service only with parental or guardian consent.</p>
            </section>

            <section>
                <h2>10. Your Rights Under GDPR</h2>
                <p>If you are located in the European Union, you have the right to:</p>
                <ul>
                    <li>Access your personal data</li>
                    <li>Request rectification</li>
                    <li>Request deletion</li>
                    <li>Restrict processing</li>
                    <li>Object to processing</li>
                    <li>Lodge a complaint with a supervisory authority</li>
                </ul>
                <p>
                    Because we do not collect identifying information (such as IP or accounts), we may only
                    be able to identify data associated with your session ID.
                </p>
                <p>Requests may be sent to: <strong>q.datum@gmail.com</strong></p>
            </section>

            <section>
                <h2>11. Data Security</h2>
                <p>
                    We implement reasonable technical and organizational measures to protect stored chat
                    messages from unauthorized access, disclosure, or alteration.
                </p>
            </section>

            <section>
                <h2>12. Changes to This Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. The updated version will be
                    published on this page with a revised date.
                </p>
            </section>
        </Prose>
    </Container>

);