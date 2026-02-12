import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import kuznexLogo from "@assets/image_1770554564085.png";

function LegalLayout({ title, description, slug, children }: { title: string; description?: string; slug?: string; children: React.ReactNode }) {
  const pageTitle = `${title} | Kuznex`;
  const pageDescription = description || `${title} for Kuznex Pvt Ltd crypto exchange platform.`;
  const canonicalUrl = slug ? `https://kuznex.in/legal/${slug}` : "https://kuznex.in/";
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <header className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <img src={kuznexLogo} alt="Kuznex" className="h-7 w-auto cursor-pointer" data-testid="link-logo" />
          </Link>
          <Link href="/">
            <Button variant="ghost" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8" data-testid="text-legal-title">{title}</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          {children}
        </div>
        <div className="mt-12 pt-8 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Kuznex Pvt Ltd. Mathura, Uttar Pradesh, India.
          </p>
        </div>
      </main>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" slug="privacy-policy" description="Kuznex Privacy Policy — how we collect, use, and protect your personal data on our crypto exchange platform.">
      <p className="text-sm text-muted-foreground italic">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
        <p>Kuznex Pvt Ltd ("Kuznex", "we", "us", "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use the Kuznex digital asset exchange platform and related services.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
        <p>We collect the following categories of personal data:</p>
        <ul className="list-disc pl-6 space-y-1.5 mt-2">
          <li><strong className="text-foreground">Identity Data:</strong> Full name, date of birth, PAN card number, Aadhaar details, and selfie photographs as part of our KYC verification process.</li>
          <li><strong className="text-foreground">Contact Data:</strong> Email address, phone number, and communication preferences.</li>
          <li><strong className="text-foreground">Financial Data:</strong> Cryptocurrency wallet addresses, transaction histories, INR bank account details (account number, IFSC code, bank name), and UPI identifiers.</li>
          <li><strong className="text-foreground">Technical Data:</strong> IP address, browser type, device information, login timestamps, and session identifiers.</li>
          <li><strong className="text-foreground">Usage Data:</strong> Trading history, swap operations, deposit and withdrawal records, and platform interaction logs.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>To verify your identity and comply with KYC/AML regulations.</li>
          <li>To process cryptocurrency and INR transactions, deposits, and withdrawals.</li>
          <li>To maintain the security of your account and detect fraudulent activity.</li>
          <li>To comply with Indian tax regulations, including TDS (Tax Deducted at Source) under Section 194S.</li>
          <li>To communicate important platform updates, security alerts, and support responses.</li>
          <li>To improve our platform and develop new features based on usage patterns.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Sharing & Disclosure</h2>
        <p>We do not sell your personal data. We may share information with:</p>
        <ul className="list-disc pl-6 space-y-1.5 mt-2">
          <li>Government and regulatory authorities as required by Indian law (including tax authorities for TDS compliance).</li>
          <li>Law enforcement agencies in response to valid legal requests.</li>
          <li>Third-party service providers who assist in operating our platform (e.g., blockchain analytics, payment processors), subject to strict confidentiality agreements.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Security</h2>
        <p>We implement industry-standard security measures including AES-256-GCM encryption for private keys, bcrypt password hashing, secure session management, and regular security audits. All data transmissions are encrypted via TLS.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">6. Data Retention</h2>
        <p>We retain your personal data for as long as your account remains active and for a minimum of 5 years after account closure to comply with regulatory requirements. Transaction records are retained in accordance with applicable Indian financial regulations.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">7. Your Rights</h2>
        <p>You have the right to access, correct, or request deletion of your personal data, subject to regulatory retention requirements. To exercise these rights, please contact us at support@Kuznex.in.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">8. Contact</h2>
        <p>For privacy-related queries, contact our Data Protection Officer at <a href="mailto:support@Kuznex.in" className="text-primary">support@Kuznex.in</a>.</p>
      </section>
    </LegalLayout>
  );
}

export function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service">
      <p className="text-sm text-muted-foreground italic">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
        <p>By accessing or using the Kuznex platform, you agree to be bound by these Terms of Service. If you do not agree to all terms, you must discontinue use of our services immediately. Kuznex Pvt Ltd reserves the right to modify these terms at any time. Continued use constitutes acceptance of updated terms.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">2. Eligibility</h2>
        <p>You must be at least 18 years of age and a resident of India to use Kuznex. You must provide accurate, current, and complete information during registration and keep your account details updated.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">3. Account Registration & KYC</h2>
        <p>All users must complete our Know Your Customer (KYC) verification before accessing trading, deposit, withdrawal, or swap services. KYC requires submission of valid government-issued identification (Aadhaar, PAN card) and a live selfie. Accounts failing KYC verification will have restricted access.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">4. Services Provided</h2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong className="text-foreground">Instant Swap:</strong> Exchange between supported cryptocurrencies at live market rates.</li>
          <li><strong className="text-foreground">Spot Trading:</strong> Market order execution on supported trading pairs.</li>
          <li><strong className="text-foreground">Crypto Deposits:</strong> Automated multichain deposits across 8 supported blockchain networks.</li>
          <li><strong className="text-foreground">Crypto Withdrawals:</strong> Manual admin-approved withdrawals to external wallets.</li>
          <li><strong className="text-foreground">INR Gateway:</strong> Fiat on-ramp and off-ramp via Indian banking channels.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">5. Fees & Charges</h2>
        <p>Kuznex charges fees for swap operations, spot trading, and withdrawals. All applicable fees are displayed transparently before transaction confirmation. Swap fees include a spread percentage. Spot trading incurs a 0.1% trading fee. Withdrawal fees vary by network. Fee structures may be updated with reasonable notice.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">6. Tax Compliance</h2>
        <p>In accordance with Section 194S of the Income Tax Act, a 1% TDS (Tax Deducted at Source) is applied on crypto-to-INR transactions and INR withdrawals. Users must have a verified PAN card for these operations. Kuznex provides TDS certificates and transaction records for tax filing purposes.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">7. Prohibited Activities</h2>
        <p>Users shall not use Kuznex for money laundering, terrorist financing, market manipulation, fraud, or any illegal activity. Kuznex reserves the right to freeze accounts, block transactions, and report suspicious activity to relevant authorities.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
        <p>Kuznex is not responsible for losses resulting from market volatility, blockchain network congestion or failure, user error (e.g., sending assets to incorrect addresses), or force majeure events. Digital assets are inherently volatile and users trade at their own risk.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">9. Account Termination</h2>
        <p>Kuznex reserves the right to suspend or terminate accounts that violate these terms, fail KYC verification, or are involved in suspicious activity. Users may request account closure by contacting support, subject to completion of pending transactions and regulatory hold periods.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">10. Governing Law</h2>
        <p>These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mathura, Uttar Pradesh.</p>
      </section>
    </LegalLayout>
  );
}

export function RiskDisclosure() {
  return (
    <LegalLayout title="Risk Disclosure">
      <p className="text-sm text-muted-foreground italic">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">1. General Risk Warning</h2>
        <p>Trading and investing in cryptocurrencies and virtual digital assets (VDAs) involves substantial risk. The value of digital assets can fluctuate significantly in short periods. You should only invest amounts you can afford to lose entirely. Past performance is not indicative of future results.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">2. Market Volatility</h2>
        <p>Cryptocurrency markets operate 24/7 and are subject to extreme volatility. Prices can change rapidly due to market sentiment, regulatory developments, technological changes, macroeconomic factors, and other unpredictable events. There is no guarantee that the value of your holdings will be maintained.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">3. Regulatory Risk</h2>
        <p>The regulatory environment for cryptocurrencies in India and globally is evolving. Changes in regulations, tax laws, or government policies may impact the value, legality, or availability of certain digital assets and services. Kuznex strives to comply with all applicable Indian regulations, including TDS requirements under Section 194S.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">4. Technology Risks</h2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong className="text-foreground">Blockchain risks:</strong> Transactions on blockchain networks are irreversible. Incorrect addresses, network congestion, or smart contract failures may result in permanent loss of assets.</li>
          <li><strong className="text-foreground">Cybersecurity risks:</strong> Despite our security measures, no system is completely immune to hacking, phishing, or other cyber threats.</li>
          <li><strong className="text-foreground">Network risks:</strong> Blockchain networks may experience forks, upgrades, or outages that affect deposits, withdrawals, or asset values.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">5. Liquidity Risk</h2>
        <p>Certain digital assets may have limited liquidity. You may not be able to sell or exchange assets at your desired price or time. Market depth and trading volumes fluctuate constantly.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">6. No Investment Advice</h2>
        <p>Kuznex does not provide investment, financial, legal, or tax advice. All trading decisions are made solely by the user. We recommend consulting qualified financial advisors before making investment decisions.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">7. Acknowledgement</h2>
        <p>By using Kuznex, you acknowledge that you have read and understood these risks. You accept full responsibility for your trading and investment decisions on the platform.</p>
      </section>
    </LegalLayout>
  );
}

export function AmlPolicy() {
  return (
    <LegalLayout title="Anti-Money Laundering Policy">
      <p className="text-sm text-muted-foreground italic">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">1. Commitment</h2>
        <p>Kuznex Pvt Ltd is committed to preventing money laundering, terrorist financing, and other financial crimes. We comply with the Prevention of Money Laundering Act (PMLA), 2002, and other applicable Indian regulations. Our AML program is designed to detect, prevent, and report suspicious activities.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">2. KYC Procedures</h2>
        <p>All users must complete our Know Your Customer process, which includes:</p>
        <ul className="list-disc pl-6 space-y-1.5 mt-2">
          <li>Verification of government-issued photo identification (Aadhaar card, PAN card).</li>
          <li>Live selfie capture for biometric matching.</li>
          <li>AI-powered document authenticity analysis using Google Gemini technology.</li>
          <li>Cross-referencing submitted data against watchlists and sanction lists.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">3. Transaction Monitoring</h2>
        <p>We continuously monitor all platform transactions for suspicious patterns, including:</p>
        <ul className="list-disc pl-6 space-y-1.5 mt-2">
          <li>Unusually large deposits or withdrawals relative to user profile.</li>
          <li>Rapid, high-frequency transactions with no apparent economic purpose.</li>
          <li>Transactions involving high-risk jurisdictions or flagged wallet addresses.</li>
          <li>Attempts to structure transactions to avoid reporting thresholds.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">4. Suspicious Activity Reporting</h2>
        <p>When suspicious activity is identified, Kuznex will file Suspicious Transaction Reports (STRs) with the Financial Intelligence Unit - India (FIU-IND). We may freeze or restrict accounts pending investigation. Users are prohibited from being informed of such reports.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">5. Record Keeping</h2>
        <p>In compliance with PMLA, we maintain records of all customer identification data, transaction records, and internal correspondence related to AML compliance for a minimum of 5 years from the date of the transaction or cessation of the business relationship.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">6. Staff Training</h2>
        <p>All Kuznex personnel involved in handling transactions or customer accounts receive regular training on AML procedures, red flag indicators, and reporting obligations.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">7. Contact</h2>
        <p>To report suspected money laundering or financial crimes, contact our Compliance Officer at <a href="mailto:support@Kuznex.in" className="text-primary">support@Kuznex.in</a>.</p>
      </section>
    </LegalLayout>
  );
}

export function TdsCompliance() {
  return (
    <LegalLayout title="TDS Compliance - Section 194S">
      <p className="text-sm text-muted-foreground italic">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">1. Overview</h2>
        <p>Effective July 1, 2022, the Government of India introduced Section 194S of the Income Tax Act, which mandates Tax Deducted at Source (TDS) on the transfer of Virtual Digital Assets (VDAs). Kuznex, as a facilitating exchange, complies with these provisions.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">2. Applicable Rate</h2>
        <p>A TDS of <strong className="text-foreground">1%</strong> is deducted on the following operations:</p>
        <ul className="list-disc pl-6 space-y-1.5 mt-2">
          <li><strong className="text-foreground">Crypto-to-INR Swaps:</strong> When you sell any cryptocurrency for Indian Rupees, 1% TDS is deducted from the gross INR amount before crediting your wallet.</li>
          <li><strong className="text-foreground">INR Withdrawals:</strong> When you withdraw INR from your Kuznex wallet to your bank account, 1% TDS is deducted from the withdrawal amount.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">3. PAN Card Requirement</h2>
        <p>To process crypto-to-INR transactions or INR withdrawals, users must have a verified PAN card on file. This is verified during the KYC process. Without a valid PAN, these operations will be restricted.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">4. How TDS is Calculated</h2>
        <p>For a crypto-to-INR swap of 10,000 INR gross value:</p>
        <ul className="list-disc pl-6 space-y-1.5 mt-2">
          <li>Gross Amount: 10,000 INR</li>
          <li>TDS (1%): 100 INR</li>
          <li>Net Amount Credited: 9,900 INR</li>
        </ul>
        <p className="mt-2">The TDS breakdown is displayed transparently on the swap and withdrawal confirmation screens before you authorize the transaction.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">5. TDS Certificate & Tax Filing</h2>
        <p>Kuznex deposits all deducted TDS with the government and issues TDS certificates. Users can download their TDS statements from their account for use during income tax filing. The deducted TDS is reflected in your Form 26AS and can be claimed as credit while filing your Income Tax Return (ITR).</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">6. Section 115BBH - Income Tax on VDA</h2>
        <p>In addition to TDS, profits from VDA transfers are taxed at a flat rate of 30% (plus cess and surcharge) under Section 115BBH. No deduction is allowed for any expense other than the cost of acquisition. Losses from one VDA cannot be set off against gains from another VDA or any other income.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">7. Disclaimer</h2>
        <p>This document is for informational purposes only and does not constitute tax advice. Users are advised to consult a qualified Chartered Accountant or tax advisor for personalized guidance on their tax obligations related to VDA transactions.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">8. Contact</h2>
        <p>For TDS-related queries, contact us at <a href="mailto:support@Kuznex.in" className="text-primary">support@Kuznex.in</a>.</p>
      </section>
    </LegalLayout>
  );
}

export function RefundPolicy() {
  return (
    <LegalLayout title="Refund & Cancellation Policy" slug="refund-policy" description="Kuznex Refund & Cancellation Policy — understand our policies on crypto transactions, INR deposits, and withdrawal reversals.">
      <p className="text-sm text-muted-foreground italic">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">1. Nature of Cryptocurrency Transactions</h2>
        <p>All cryptocurrency transactions executed on the Kuznex platform are processed on decentralized blockchain networks. Once a transaction is confirmed on-chain, it is <strong className="text-foreground">irreversible</strong> and cannot be cancelled, reversed, or refunded. This is a fundamental characteristic of blockchain technology and is not within the control of Kuznex or any centralized entity.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">2. Crypto Deposits</h2>
        <p>Cryptocurrency deposits made to your Kuznex wallet addresses are processed automatically upon receiving sufficient block confirmations. Once credited, deposits cannot be reversed. If you send assets to an incorrect address or on an unsupported network, Kuznex cannot guarantee recovery of those funds.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">3. Crypto Withdrawals</h2>
        <p>All crypto withdrawal requests undergo manual review by the Kuznex admin team before processing. Once a withdrawal is submitted on-chain and confirmed, it is final and non-refundable. Users are advised to double-check the destination wallet address and selected network before confirming any withdrawal request.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">4. Swap & Trading Operations</h2>
        <p>Instant swaps and spot trading orders are executed at prevailing market rates at the time of confirmation. Once an order is filled, it is considered final. Price fluctuations occurring after execution do not qualify for a refund or reversal. By confirming a swap or trade, you accept the quoted rate and associated fees.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">5. INR Transactions</h2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong className="text-foreground">INR Deposits (Buy USDT):</strong> INR deposits via bank transfer, UPI, or IMPS are subject to admin approval. If an INR deposit is rejected by our team (e.g., due to mismatched details or failed verification), the original amount will be refunded to the source bank account within 5-7 business days.</li>
          <li><strong className="text-foreground">INR Withdrawals (Sell USDT):</strong> Once an INR withdrawal is processed and sent to your bank account, it is considered final. TDS (1% under Section 194S) deducted during the process is non-refundable as it is remitted directly to the Government of India.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">6. Platform Errors & Exceptional Circumstances</h2>
        <p>In the rare event of a platform error, system malfunction, or incorrect credit/debit caused by a technical issue on our end, Kuznex will investigate and rectify the error. Appropriate adjustments or refunds will be made at the sole discretion of Kuznex management after thorough review.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">7. How to Request a Review</h2>
        <p>If you believe a transaction was processed incorrectly, you may submit a support request with complete details (transaction ID, date, amount, and a description of the issue) to <a href="mailto:support@Kuznex.in" className="text-primary">support@Kuznex.in</a> or via the <a href="/contact" className="text-primary">Contact Us</a> page. Our team will review your case within 48 hours.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">8. No Guarantee of Refund</h2>
        <p>Kuznex does not guarantee refunds for any transaction. Each case is reviewed individually. The decision of the Kuznex management team shall be final and binding. Users are encouraged to exercise caution and verify all transaction details before confirmation.</p>
      </section>
    </LegalLayout>
  );
}

export function AboutPage() {
  return (
    <LegalLayout title="About Kuznex" description="Learn about Kuznex - our mission to make crypto trading accessible, secure, and compliant for everyone in India.">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Our Mission</h2>
        <p>Kuznex is building the future of crypto trading in India. We believe that access to digital assets should be simple, secure, and available to everyone, not just the technically savvy. Our platform is designed from the ground up to remove the complexity of cryptocurrency while keeping you in full control of your assets.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">What We Do</h2>
        <p>Kuznex is a full-service digital asset exchange that enables users to buy, sell, trade, and manage cryptocurrencies with Indian Rupees. Our platform supports:</p>
        <ul className="list-disc pl-6 space-y-1.5 mt-2">
          <li><strong className="text-foreground">300+ Trading Pairs:</strong> Access a wide range of spot trading pairs with real-time market data powered by institutional-grade feeds.</li>
          <li><strong className="text-foreground">Instant Crypto Swaps:</strong> Convert between supported cryptocurrencies at live market rates with transparent fee breakdowns.</li>
          <li><strong className="text-foreground">Multichain Deposits:</strong> Receive crypto on 8 blockchain networks including Ethereum, BSC, Polygon, Arbitrum, Base, Optimism, Avalanche, and Fantom with automatic detection.</li>
          <li><strong className="text-foreground">INR On/Off Ramp:</strong> Seamlessly move between Indian Rupees and USDT through bank transfers, UPI, and IMPS.</li>
          <li><strong className="text-foreground">AI-Powered KYC:</strong> Fast, accurate identity verification using advanced AI technology to ensure regulatory compliance without sacrificing user experience.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Security First</h2>
        <p>Security is at the core of everything we build. Every private key is encrypted with AES-256-GCM, passwords are hashed with bcrypt, and all communications are secured with TLS encryption. Our withdrawal process includes manual admin review to add an extra layer of protection against unauthorized access.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Compliance</h2>
        <p>Kuznex operates in full compliance with Indian regulations. We adhere to KYC/AML requirements under the Prevention of Money Laundering Act (PMLA), 2002, and implement TDS deduction under Section 194S of the Income Tax Act on applicable crypto-to-INR transactions. Transparency and regulatory adherence are fundamental to how we operate.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Our Team</h2>
        <p>Kuznex Pvt Ltd is headquartered in Mathura, Uttar Pradesh, India. Our team brings together expertise in blockchain technology, financial services, cybersecurity, and user experience design. We are committed to building a platform that earns your trust through transparency, reliability, and continuous innovation.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Get in Touch</h2>
        <p>Have questions, feedback, or partnership inquiries? We would love to hear from you.</p>
        <ul className="list-disc pl-6 space-y-1.5 mt-2">
          <li><strong className="text-foreground">Email:</strong> <a href="mailto:support@Kuznex.in" className="text-primary">support@Kuznex.in</a></li>
          <li><strong className="text-foreground">Contact Form:</strong> <a href="/contact" className="text-primary">kuznex.in/contact</a></li>
        </ul>
      </section>
    </LegalLayout>
  );
}
