import React from "react";
import "./AdminTerms.css";

export default function AdminTerms() {
    return (
        <div className="admin-terms-page">
            <div className="admin-terms-card">

                <h1 className="terms-title">SS Fashion</h1>
                <p className="terms-subtitle">Admin Terms & Policies</p>

                <section>
                    <h2>1. Authorized Access</h2>
                    <p>
                        The SS Fashion Admin Panel is strictly restricted to authorized
                        administrators only. Login credentials must not be shared.
                        Unauthorized access attempts may result in permanent suspension.
                    </p>
                </section>

                <section>
                    <h2>2. Account Security</h2>
                    <p>
                        Admins are responsible for maintaining password confidentiality.
                        Any suspicious activity must be reported immediately. SS Fashion
                        is not liable for losses caused by compromised credentials.
                    </p>
                </section>

                <section>
                    <h2>3. Admin Responsibilities</h2>
                    <ul>
                        <li>Manage products, pricing, and stock accurately</li>
                        <li>Handle customer orders and payments responsibly</li>
                        <li>Upload only valid and authorized content</li>
                        <li>Ensure platform integrity at all times</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Customer Data Protection</h2>
                    <p>
                        All customer data is confidential. Downloading, sharing, or
                        misusing customer information is strictly prohibited and may
                        result in legal action.
                    </p>
                </section>

                <section>
                    <h2>5. Payments & Refunds</h2>
                    <p>
                        Refunds, cancellations, and payment updates must follow official
                        SS Fashion procedures. All admin actions are logged and audited.
                    </p>
                </section>

                <section>
                    <h2>6. Monitoring & Logs</h2>
                    <p>
                        Admin activity including logins, edits, and deletions may be
                        monitored for security and audit purposes.
                    </p>
                </section>

                <section>
                    <h2>7. Termination of Access</h2>
                    <p>
                        SS Fashion reserves the right to suspend or terminate admin access
                        at any time for policy violations or security risks.
                    </p>
                </section>

                <section>
                    <h2>8. Policy Updates</h2>
                    <p>
                        These terms may be updated periodically. Continued use of the
                        Admin Panel implies acceptance of updated policies.
                    </p>
                </section>

                <div className="terms-footer">
                    <p>
                        By using the SS Fashion Admin Panel, you agree to comply with all
                        admin terms and security policies.
                    </p>
                </div>

            </div>
        </div>
    );
}
