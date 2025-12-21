# OAuth 2.0 vs ADFS vs Azure AD vs IdentityServer vs Keycloak - A Junior Developer's Guide

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [What is OAuth 2.0?](#what-is-oauth-20)
3. [What is Microsoft ADFS?](#what-is-microsoft-adfs)
4. [What is Azure AD?](#what-is-azure-ad)
5. [What is IdentityServer?](#what-is-identityserver)
6. [What is Keycloak?](#what-is-keycloak)
7. [Key Differences at a Glance](#key-differences-at-a-glance)
8. [OAuth 2.0 Deep Dive](#oauth-20-deep-dive)
9. [ADFS Deep Dive](#adfs-deep-dive)
10. [Azure AD Deep Dive](#azure-ad-deep-dive)
11. [IdentityServer Deep Dive](#identityserver-deep-dive)
12. [Keycloak Deep Dive](#keycloak-deep-dive)
13. [When to Use Which?](#when-to-use-which)
14. [Real-World Scenarios](#real-world-scenarios)
15. [Technical Comparison](#technical-comparison)
16. [Migration Considerations](#migration-considerations)

---

## Executive Summary

**The Simple Answer:**
- **OAuth 2.0** is a **protocol** (a set of rules) for authorization - letting apps access your data without sharing passwords
- **ADFS** is a **product** (on-premises Microsoft software) for enterprise SSO using SAML, WS-Federation, and OAuth 2.0
- **Azure AD** is a **cloud service** (Microsoft's identity platform) providing authentication, SSO, and directory services without on-prem infrastructure
- **IdentityServer** is a **framework** (open-source .NET library) that you build into your app to become an OAuth 2.0/OpenID Connect provider
- **Keycloak** is a **platform** (open-source Java application) providing complete identity and access management out-of-the-box

**Think of it this way:**
- **OAuth 2.0** = The recipe (how to make a cake)
- **ADFS** = An on-premises bakery (you own the building, equipment, everything - Microsoft ecosystem)
- **Azure AD** = A cloud bakery service (Microsoft runs everything, you just order)
- **IdentityServer** = A baking kit (you build your own bakery using this .NET framework)
- **Keycloak** = A complete bakery-in-a-box (open-source, pre-built, ready to use on any platform)

---

## What is OAuth 2.0?

### The Problem OAuth Solves

Imagine you want to use a cool app called "PlaylistMaster" that creates Spotify playlists for you. The old, insecure way:

```
PlaylistMaster: "Give me your Spotify username and password"
You: "Here you go!" 🔓
PlaylistMaster: Now has FULL access to your Spotify account forever
```

**Problems:**
- PlaylistMaster can do ANYTHING with your account
- You can't revoke access without changing your password
- If PlaylistMaster gets hacked, your password is leaked
- You have to trust PlaylistMaster completely

### OAuth 2.0 Solution

```
PlaylistMaster: "I need permission to access your Spotify playlists"
You: Click "Authorize" on Spotify's website (not PlaylistMaster's!)
Spotify: Here's a temporary access token for PlaylistMaster
PlaylistMaster: Now has LIMITED access for a LIMITED time
```

**Benefits:**
- PlaylistMaster never sees your password
- You can revoke access anytime from Spotify settings
- Access is scoped (only playlists, not payment info)
- Token expires automatically

### OAuth 2.0 Key Concepts

```mermaid
graph TB
    A[Resource Owner<br/>You] -->|1. I want to use app| B[Client<br/>PlaylistMaster App]
    B -->|2. Redirect to authorize| C[Authorization Server<br/>Spotify OAuth]
    A -->|3. Login & approve| C
    C -->|4. Return auth code| B
    B -->|5. Exchange code for token| C
    C -->|6. Access token| B
    B -->|7. API call with token| D[Resource Server<br/>Spotify API]
    D -->|8. Your playlists| B

    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#ffe1e1
    style D fill:#e1ffe1
```

**Four Main Players:**
1. **Resource Owner**: You (the user with the data)
2. **Client**: The app wanting access (PlaylistMaster)
3. **Authorization Server**: Issues tokens (Spotify OAuth)
4. **Resource Server**: Holds your data (Spotify API)

---

## What is Microsoft ADFS?

### The Problem ADFS Solves

You work at BigCorp. You need to access:
- Email (Outlook)
- HR System (Workday)
- Customer Database (Salesforce)
- Time Tracking (Custom internal app)
- File Storage (SharePoint)

**Without ADFS:**
```
You: Log into Outlook (username + password)
You: Log into Workday (different username + password)
You: Log into Salesforce (another username + password)
You: Log into Time Tracker (yet another username + password)
You: Log into SharePoint (you get the idea...)
```

**Result:** Password fatigue, weak passwords, IT nightmare

### ADFS Solution: Single Sign-On (SSO)

```
You: Log into Windows at 9 AM (Active Directory credentials)
ADFS: "You're authenticated! Here are identity claims..."
You: Click Outlook → Automatically logged in
You: Click Workday → Automatically logged in
You: Click Salesforce → Automatically logged in
All apps trust ADFS as the identity authority
```

**One login = Access to everything**

### ADFS Architecture

```mermaid
graph TB
    User[Employee] -->|1. Login once| AD[Active Directory<br/>Corporate User Database]
    AD -->|2. Authenticated| ADFS[ADFS Server<br/>Federation Service]

    ADFS -->|3. SAML Token| App1[Outlook Web<br/>SAML]
    ADFS -->|4. WS-Fed Token| App2[SharePoint<br/>WS-Federation]
    ADFS -->|5. OAuth Token| App3[Custom App<br/>OAuth 2.0]
    ADFS -->|6. OIDC Token| App4[Salesforce<br/>OpenID Connect]

    style User fill:#e1f5ff
    style AD fill:#ffe1e1
    style ADFS fill:#fff4e1
    style App1 fill:#e1ffe1
    style App2 fill:#e1ffe1
    style App3 fill:#e1ffe1
    style App4 fill:#e1ffe1
```

**ADFS is like a passport office:**
- You prove your identity once (Active Directory)
- ADFS issues different "visas" (tokens) for different "countries" (apps)
- Each app accepts ADFS's authority

---

## What is Azure AD?

### The Problem Azure AD Solves

Your company is growing and facing challenges with ADFS:
- **Infrastructure burden**: Managing Windows servers, updates, certificates
- **Cloud adoption**: Moving to Office 365, Azure, SaaS apps
- **Remote work**: Employees need access from anywhere, not just corporate network
- **Mobile devices**: BYOD (Bring Your Own Device) policies
- **Security**: Need advanced features like MFA, conditional access, risk detection

**With on-premises ADFS:**
```
You manage:
- Windows Server infrastructure
- SSL certificates (manual renewal)
- High availability (load balancers)
- Backups and disaster recovery
- Security patches and updates
- Firewall rules
- VPN for remote access
```

### Azure AD Solution

```
Microsoft manages everything → You just configure users and policies →
Instant access from anywhere → Built-in security features
```

**Benefits:**
- No infrastructure to manage (fully cloud-based)
- Integrates seamlessly with Office 365 and Microsoft 365
- Built-in MFA, conditional access, and identity protection
- Supports modern protocols (OAuth 2.0, OIDC, SAML)
- Global scale and 99.99% SLA
- Pay per user (no hardware costs)

### Azure AD Architecture

```mermaid
graph TB
    subgraph "Cloud - Microsoft Azure"
        AAD[Azure AD<br/>Identity Service]
        O365[Office 365]
        Graph[Microsoft Graph API]
    end

    subgraph "On-Premises (Optional)"
        ADConnect[Azure AD Connect<br/>Sync Tool]
        OnPremAD[Active Directory]
        OnPremAD -->|Sync users| ADConnect
        ADConnect -->|Hybrid identity| AAD
    end

    User[Employee<br/>Any device, anywhere] -->|1. Login| AAD

    AAD -->|2. OAuth/OIDC| WebApp[Modern Web App]
    AAD -->|3. SAML| SaaS[SaaS Apps<br/>Salesforce, Workday]
    AAD -->|4. Integrated| O365
    AAD -->|5. Microsoft Graph| MobileApp[Mobile Apps]

    WebApp -->|6. Access| Graph
    MobileApp -->|7. Access| Graph

    style AAD fill:#fff4e1
    style User fill:#e1f5ff
    style OnPremAD fill:#ffe1e1
    style WebApp fill:#e1ffe1
    style SaaS fill:#e1ffe1
    style O365 fill:#e1ffe1
    style MobileApp fill:#e1ffe1
```

### Azure AD Editions

Microsoft offers different tiers based on features needed:

#### Azure AD Free (Included with Microsoft 365)
```
Features:
✓ User and group management
✓ Basic reports
✓ Self-service password change (cloud users)
✓ SSO to popular SaaS apps
✓ Up to 500,000 objects

Best for: Small businesses using Office 365
Cost: Free
```

#### Azure AD Premium P1 (~$6/user/month)
```
Features (Free +):
✓ Self-service password reset with on-prem writeback
✓ Azure AD Connect (sync on-prem AD to cloud)
✓ Dynamic groups
✓ Conditional access policies
✓ MFA
✓ Advanced security reports

Best for: Medium businesses with hybrid identity
Cost: $6/user/month
```

#### Azure AD Premium P2 (~$9/user/month)
```
Features (P1 +):
✓ Identity Protection (risk-based policies)
✓ Privileged Identity Management (PIM)
✓ Access reviews
✓ Advanced threat analytics

Best for: Large enterprises with security requirements
Cost: $9/user/month
```

#### Azure AD B2C (Business-to-Consumer)
```
Features:
✓ Customer identity management
✓ Social logins (Google, Facebook, etc.)
✓ Custom branding
✓ Millions of users supported
✓ Pay-per-authentication model

Best for: Consumer-facing apps
Cost: First 50,000 MAU free, then $0.00325/MAU
```

#### Azure AD B2B (Business-to-Business)
```
Features:
✓ Partner/guest access
✓ No additional cost
✓ Guests use their own identities
✓ Cross-organization collaboration

Best for: Partner portals, vendor access
Cost: Free with existing Azure AD subscription
```

### Azure AD Key Features

#### 1. Conditional Access

```javascript
// Example policy: Require MFA for access from outside corporate network
Policy: "Require MFA for External Access"
Conditions:
  - User location: NOT corporate network
  - Application: All cloud apps
Action:
  - Require multi-factor authentication
  - Block if device is not compliant
```

#### 2. Single Sign-On (SSO)

```
One login grants access to:
✓ Office 365 (Outlook, Teams, SharePoint)
✓ Azure Portal
✓ 3,000+ pre-integrated SaaS apps (Salesforce, Zoom, Slack)
✓ Custom applications (OAuth, SAML, header-based)
```

#### 3. Identity Protection

```
Risk detection:
- Atypical travel (login from unusual location)
- Anonymous IP address (Tor, VPN)
- Password spray attacks
- Leaked credentials (found on dark web)
- Unfamiliar sign-in properties

Automated response:
- Low risk: Allow with MFA
- Medium risk: Require password change
- High risk: Block access
```

#### 4. Hybrid Identity (Azure AD Connect)

```
Sync on-premises Active Directory to Azure AD:
- Users
- Groups
- Devices
- Passwords (optional)

Authentication options:
1. Cloud authentication (Password Hash Sync + SSO)
2. Pass-through authentication (validate against on-prem AD)
3. Federated authentication (use on-prem ADFS)
```

### Azure AD vs ADFS - Quick Comparison

| Aspect | ADFS (On-Prem) | Azure AD (Cloud) |
|--------|----------------|------------------|
| **Infrastructure** | You manage servers | Microsoft manages |
| **Availability** | Your responsibility | 99.99% SLA |
| **Scaling** | Manual (add servers) | Automatic (unlimited) |
| **Updates** | Manual patching | Automatic |
| **Cost Model** | Hardware + Windows Server license | Per-user subscription |
| **Remote Access** | VPN required | Internet access only |
| **MFA** | Third-party solution needed | Built-in |
| **Conditional Access** | Limited | Advanced (location, device, risk) |
| **Setup Time** | Weeks (infrastructure) | Hours (configuration) |
| **Best For** | On-prem requirements | Cloud-first organizations |

### When Azure AD Makes Sense

**Migration from ADFS:**
```
Before (ADFS):
- 2 Windows servers for high availability
- SSL certificate management
- VPN for remote access
- Third-party MFA solution
- Manual updates and patches

After (Azure AD):
- Zero servers
- Microsoft manages SSL
- Access from anywhere
- Built-in MFA
- Automatic updates
```

**Cost Example:**
```
ADFS (On-Premises):
- Windows Server licenses: $1,000/year × 2 = $2,000
- Server hardware/cloud VMs: $200/month = $2,400/year
- SSL certificates: $200/year
- IT admin time: 40 hours/year × $100/hour = $4,000
Total: ~$8,600/year (for 100 users)

Azure AD Premium P1:
- $6/user/month × 100 users = $600/month = $7,200/year
- No infrastructure
- No admin overhead for infrastructure
Total: $7,200/year (for 100 users)

Break-even: ~100 users
Below 100 users: Azure AD is cheaper
Above 100 users: Costs similar, but Azure AD offers better features
```

---

## What is IdentityServer?

### The Problem IdentityServer Solves

You're building a modern SaaS application with:
- A web app (React/Vue/Angular)
- A mobile app (iOS/Android)
- An API backend
- Multiple microservices
- Third-party integrations

**Without IdentityServer:**
```
Option 1: Build your own OAuth server from scratch
Problem: Complex, error-prone, security risks, takes months

Option 2: Use external provider (Auth0, Okta)
Problem: Monthly fees per user, vendor lock-in, data leaves your infrastructure

Option 3: Use ADFS
Problem: Requires Windows Server, complex setup, enterprise-focused
```

### IdentityServer Solution

```
Install IdentityServer package → Configure in your ASP.NET Core app →
You now have a certified OAuth 2.0/OpenID Connect server!
```

**Benefits:**
- Open-source and free for most scenarios (now Duende IdentityServer with licensing)
- Full control over authentication logic
- Runs in your infrastructure
- Integrates with any user database (SQL, MongoDB, etc.)
- Certified implementation of OAuth 2.0 and OpenID Connect

### IdentityServer Architecture

```mermaid
graph TB
    subgraph "Your Infrastructure"
        IS[IdentityServer<br/>ASP.NET Core App]
        UserDB[(User Database<br/>SQL/MongoDB/etc)]
        IS -->|Query users| UserDB
    end

    WebApp[Web App<br/>React SPA] -->|1. Login redirect| IS
    MobileApp[Mobile App<br/>iOS/Android] -->|2. OAuth flow| IS
    API[API Backend] -->|3. Validate tokens| IS

    IS -->|4. Issue tokens| WebApp
    IS -->|5. Issue tokens| MobileApp

    WebApp -->|6. API calls with token| API
    MobileApp -->|7. API calls with token| API

    style IS fill:#fff4e1
    style UserDB fill:#ffe1e1
    style WebApp fill:#e1ffe1
    style MobileApp fill:#e1ffe1
    style API fill:#e1f5ff
```

**Key Features:**
1. **Flexible User Store**: Connect to any database (Entity Framework, Dapper, MongoDB)
2. **Customizable UI**: Full control over login/logout pages
3. **Multi-tenancy**: Support multiple applications from one server
4. **Standards-Based**: Certified OAuth 2.0 and OpenID Connect
5. **Extensible**: Add custom logic for claims, consent, validation

### IdentityServer vs Building Your Own

**If you build from scratch:**
```javascript
// You need to implement:
- Token generation and validation (JWT signing)
- Authorization code flow with PKCE
- Refresh token rotation
- Consent screens
- Session management
- Token introspection endpoint
- Discovery document (.well-known/openid-configuration)
- CORS configuration
- Rate limiting
- Security best practices (CSRF, XSS protection)
// = Months of work, high risk of vulnerabilities
```

**With IdentityServer:**
```csharp
// In Startup.cs or Program.cs
services.AddIdentityServer()
    .AddInMemoryClients(Config.Clients)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddTestUsers(Config.TestUsers);
// = Production-ready OAuth server in hours
```

### IdentityServer Licensing (Important!)

**History:**
- **IdentityServer4** (2016-2022): Free and open-source
- **Duende IdentityServer** (2022-present): Commercial product with licensing

**Current Licensing (Duende):**
```
Free Tier:
✓ Development and testing
✓ Personal projects
✓ Companies with < $1M annual revenue
✓ Open-source projects

Business Edition ($1,800/year):
✓ Companies with > $1M revenue
✓ Production use
✓ Support included

Enterprise Edition ($6,800/year):
✓ Business Edition features
✓ Extended support
✓ Consulting hours
```

**Alternatives if licensing is an issue:**
- Use IdentityServer4 (legacy, no longer maintained)
- Use OpenIddict (free, open-source alternative)
- Use Keycloak (free, open-source, more feature-rich)
- Use cloud providers (Auth0, Okta, Azure AD B2C)

---

## What is Keycloak?

### The Problem Keycloak Solves

Similar challenges to IdentityServer, but with a different approach:
- You want to build/run your own identity provider (avoid vendor lock-in)
- You need enterprise features out-of-the-box (user federation, admin console, etc.)
- Your team doesn't use .NET (Node.js, Python, Java, Go, etc.)
- You want something free and truly open-source (no commercial licensing)
- You need SAML support alongside OAuth 2.0/OIDC

**Without Keycloak:**
```
Option 1: Build OAuth server from scratch
Problem: 6-12 months of development, high security risk

Option 2: IdentityServer
Problem: Requires .NET, commercial license for production

Option 3: Auth0/Okta
Problem: Per-user costs, vendor lock-in, data leaves infrastructure

Option 4: Azure AD
Problem: Tied to Microsoft ecosystem, expensive at scale
```

### Keycloak Solution

```
Download Keycloak → Deploy (Docker/Kubernetes/VM) → Configure via admin UI →
Production-ready OAuth/OIDC/SAML server in hours!
```

**Benefits:**
- 100% free and open-source (Apache 2.0 license)
- No commercial licensing restrictions (unlike Duende IdentityServer)
- Runs on any platform (Java-based, not .NET-specific)
- Feature-rich admin console (no code required for basic setup)
- Built-in user federation (LDAP, Active Directory, custom)
- Social login providers pre-configured (Google, Facebook, GitHub, etc.)
- Strong community (backed by Red Hat/IBM)

### Keycloak Architecture

```mermaid
graph TB
    subgraph "Keycloak Server (Java)"
        KC[Keycloak<br/>Standalone Server]
        AdminUI[Admin Console<br/>Web UI]
        DB[(Database<br/>PostgreSQL/MySQL)]
        KC -->|Manages| AdminUI
        KC -->|Stores| DB
    end

    subgraph "User Sources"
        LocalUsers[Local Users<br/>Keycloak DB]
        LDAP[LDAP/AD<br/>Federation]
        Social[Social Providers<br/>Google, GitHub]
    end

    subgraph "Applications"
        WebApp[Web App]
        MobileApp[Mobile App]
        API[REST API]
    end

    WebApp -->|OAuth/OIDC| KC
    MobileApp -->|OAuth/OIDC| KC
    API -->|Validate JWT| KC

    KC -->|Authenticate| LocalUsers
    KC -->|Federate| LDAP
    KC -->|Social Login| Social

    style KC fill:#fff4e1
    style DB fill:#ffe1e1
    style AdminUI fill:#e1ffe1
```

**Key Features:**

#### 1. Admin Console (Zero Code Setup)
```
Web-based admin interface:
- Create realms (isolated identity domains)
- Add users, groups, roles
- Configure clients (apps)
- Set up social logins
- Define authentication flows
- Manage sessions
- View audit logs

No programming required for basic setup!
```

#### 2. Realm Concept
```
Realm = Isolated identity domain

Examples:
- Realm: "production" → Your production users
- Realm: "staging" → Your staging users
- Realm: "customer-acme" → ACME Corp employees (multi-tenant)

Each realm has its own:
- Users and groups
- Clients (applications)
- Settings and themes
- Authentication flows
```

#### 3. User Federation
```
Keycloak can pull users from:
- LDAP (Lightweight Directory Access Protocol)
- Active Directory
- Custom user databases (via SPI)
- Other Keycloak instances

Benefits:
- No user migration required
- Single source of truth
- Transparent to applications
```

#### 4. Social Identity Providers (Pre-configured)
```
Built-in support for:
✓ Google
✓ Facebook
✓ GitHub
✓ Twitter
✓ LinkedIn
✓ Microsoft
✓ Instagram
✓ OpenID Connect (custom)
✓ SAML (custom)

Just enter client ID/secret → Ready!
```

#### 5. Protocol Support
```
Keycloak speaks multiple protocols:
- OAuth 2.0 (all grant types)
- OpenID Connect
- SAML 2.0
- WS-Federation (via extension)

Perfect for:
- Modern apps (OAuth/OIDC)
- Enterprise SaaS (SAML)
- Legacy apps (SAML/WS-Fed)
```

### Keycloak vs IdentityServer - Quick Comparison

| Aspect | Keycloak | IdentityServer |
|--------|----------|----------------|
| **Language** | Java | C# (.NET) |
| **Deployment** | Standalone server | Library (embedded) |
| **Admin UI** | Built-in (comprehensive) | None (code-based config) |
| **License** | 100% free (Apache 2.0) | Free tier / $1,800+/year |
| **Platform** | Any (JVM) | .NET only |
| **Setup** | GUI-based (hours) | Code-based (days) |
| **User Federation** | Built-in (LDAP, AD) | DIY (write code) |
| **Social Logins** | Pre-configured | DIY (write code) |
| **Customization** | Moderate (themes, SPIs) | Full (source code access) |
| **Learning Curve** | Low (admin UI) | High (coding required) |
| **Community** | Large (Red Hat backed) | Medium (commercial) |
| **Best For** | Non-.NET shops, quick setup | .NET shops, full control |

### When Keycloak Makes Sense

**Scenario 1: Non-.NET Stack**
```
Your tech stack:
- Backend: Node.js, Python, Java, Go
- Frontend: React, Vue, Angular
- Infrastructure: Docker, Kubernetes

Keycloak fits perfectly:
✓ Platform-agnostic (Java, runs anywhere)
✓ No .NET dependency
✓ Containerized deployment
✓ REST Admin API
```

**Scenario 2: Quick Setup Required**
```
Timeline: Need auth in 1-2 days

Keycloak approach:
Day 1:
  - Deploy Keycloak (Docker)
  - Create realm via admin UI
  - Add users
  - Register your app as client
Day 2:
  - Integrate app with OAuth endpoints
  - Test flows
  - Deploy to production

IdentityServer would take 3-5 days (writing code)
```

**Scenario 3: User Federation Needed**
```
Situation: Company has existing LDAP with 10,000 users

Keycloak:
1. Go to Admin Console → User Federation
2. Click "Add provider" → LDAP
3. Enter LDAP connection details
4. Test connection
5. Save
→ All 10,000 users can now log in (no migration!)

IdentityServer:
1. Write custom LDAP integration code
2. Implement IUserStore interface
3. Handle password validation
4. Test extensively
→ 2-3 days of development
```

**Scenario 4: Multi-Protocol Requirements**
```
Your customers need:
- Modern apps: OAuth 2.0/OIDC
- Legacy apps: SAML 2.0
- Partner integrations: Both

Keycloak:
✓ Native SAML 2.0 support
✓ Same user can access via OAuth or SAML
✓ Single admin console for both

IdentityServer:
✗ OAuth/OIDC only
✗ Need separate SAML library (Sustainsys.Saml2)
✗ More complexity
```

### Keycloak Deployment Options

#### Docker (Development)
```bash
# Quick start with Docker
docker run -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest \
  start-dev

# Access admin console
# http://localhost:8080/admin
# Login: admin / admin
```

#### Kubernetes (Production)
```yaml
# Helm chart deployment
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install keycloak bitnami/keycloak \
  --set auth.adminUser=admin \
  --set auth.adminPassword=supersecret \
  --set postgresql.enabled=true \
  --set service.type=LoadBalancer
```

#### Docker Compose (Team Development)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: password

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    command: start-dev
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: password
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
    depends_on:
      - postgres
```

### Keycloak Limitations

**Not as lightweight as IdentityServer:**
- Java runtime required (JVM overhead)
- Heavier resource usage (memory, CPU)
- Slower startup time

**Less customizable than IdentityServer:**
- Admin UI is opinionated
- Custom authentication flows require SPIs (Service Provider Interfaces)
- Theming has limitations

**Not a managed service:**
- You manage infrastructure (like IdentityServer)
- You're responsible for updates, backups, scaling
- No built-in CDN or DDoS protection

**Steeper infrastructure requirements:**
- Needs a database (PostgreSQL, MySQL, etc.)
- Requires more RAM (2-4 GB minimum)
- More complex deployment than IdentityServer

### Cost Analysis: Keycloak vs Alternatives

**Scenario: 50,000 users**

```
Keycloak (self-hosted):
- License: $0 (open-source)
- Infrastructure: $150/month (cloud VMs + DB) = $1,800/year
- Maintenance: ~30 hours/year × $100/hour = $3,000/year
Total: $4,800/year

IdentityServer (self-hosted):
- License: $1,800/year (Duende)
- Infrastructure: $100/month (lighter footprint) = $1,200/year
- Maintenance: ~20 hours/year × $100/hour = $2,000/year
Total: $5,000/year

Auth0:
- 50,000 MAU × $0.0175/MAU = $875/month = $10,500/year
Total: $10,500/year

Azure AD B2C:
- 50,000 MAU × $0.00325/MAU = $162.50/month = $1,950/year
Total: $1,950/year

Winner: Azure AD B2C (cheapest)
Runner-up: Keycloak (most features for the price)
```

**Key Insight:**
- Keycloak offers the best feature-to-cost ratio for self-hosted
- Azure AD B2C is cheaper but less flexible
- IdentityServer is similar cost but requires .NET and coding
- Auth0 is 2-5x more expensive

---

## Key Differences at a Glance

| Aspect | OAuth 2.0 | ADFS | Azure AD | IdentityServer | Keycloak |
|--------|-----------|------|----------|----------------|----------|
| **What is it?** | Authorization protocol | On-prem identity provider | Cloud identity platform | OAuth/OIDC framework | Complete IAM platform |
| **Type** | Specification/Standard | Commercial product | Cloud service (SaaS) | Open-source library (.NET) | Open-source server (Java) |
| **Primary Purpose** | Delegated access | Enterprise SSO (on-prem) | Cloud SSO + directory | Build your own provider | Out-of-box IAM solution |
| **Who uses it?** | Everyone (protocol) | Large on-prem enterprises | Microsoft 365 customers | .NET developers, SaaS companies | Non-.NET devs, enterprises |
| **Protocols** | OAuth 2.0 only | SAML, WS-Fed, OAuth, OIDC | OAuth 2.0, OIDC, SAML | OAuth 2.0, OIDC | OAuth 2.0, OIDC, SAML |
| **Implementation** | You implement spec | Install on Windows Server | Sign up + configure | Add NuGet to ASP.NET Core | Deploy standalone server |
| **Focus** | Authorization | Authentication (SSO) | Identity + SSO + directory | Authentication + authorization | Full IAM (all protocols) |
| **User Experience** | "Allow app access?" | "Login once at work" | "Login with Microsoft" | Customizable (you control) | Customizable (themes, UI) |
| **Token Format** | Usually JWT | SAML (XML) or JWT | JWT (JSON Web Token) | JWT (JSON Web Token) | JWT or SAML |
| **User Store** | Provider-dependent | Active Directory (required) | Azure AD (cloud directory) | Any (SQL, MongoDB, custom) | Any + LDAP/AD federation |
| **Admin Interface** | N/A | MMC snapins (GUI) | Azure Portal (web) | None (code-based) | Rich web console |
| **Infrastructure** | N/A | On-premises servers | Zero (fully managed) | Your infrastructure | Your infrastructure |
| **Customization** | N/A (protocol) | Limited (policies) | Moderate (branding, flows) | Full (source code access) | Moderate (SPIs, themes) |
| **Platform** | Platform-agnostic | Windows Server only | Cloud (any client) | .NET (Linux, Windows, macOS) | Any (JVM required) |
| **Open Source?** | Yes (spec) | No (Microsoft proprietary) | No (proprietary cloud) | Yes (with commercial license) | Yes (100% free, Apache 2.0) |
| **Cost** | Free (protocol) | ~$500-$6K (Windows Server) | $0-$9/user/month | Free tier / $1,800+/year | $0 (always free) |
| **Setup Time** | Medium | Weeks (infrastructure) | Hours (configuration) | Days (code + infrastructure) | Hours (GUI configuration) |
| **Learning Curve** | Medium | High (Windows admin + SAML) | Low-Medium (Azure portal) | Medium-High (.NET + OAuth) | Low-Medium (admin UI) |
| **Deployment** | N/A | On-premises | Microsoft cloud | Your cloud/on-prem | Your cloud/on-prem (Docker) |
| **Availability** | Provider-dependent | Your responsibility | 99.99% SLA (Microsoft) | Your responsibility | Your responsibility |
| **Scalability** | Provider-dependent | Moderate (manual scaling) | Unlimited (auto-scale) | High (stateless, containers) | High (clustered mode) |
| **MFA Built-in** | N/A | No (third-party needed) | Yes (SMS, app, FIDO2) | No (you implement) | Yes (OTP, WebAuthn) |
| **Social Logins** | N/A | No | Yes (limited) | No (you implement) | Yes (pre-configured) |
| **User Federation** | N/A | Via AD | Via Azure AD Connect | DIY (custom code) | Built-in (LDAP, AD, custom) |
| **Conditional Access** | N/A | Limited | Advanced (location, device, risk) | You implement | Via policies + SPIs |
| **Multi-tenancy** | Provider-dependent | Limited | Excellent (B2B, B2C) | Excellent (built-in) | Excellent (realms) |
| **Office 365 Integration** | N/A | Via federation | Native (same login) | Via OAuth/OIDC | Via SAML/OAuth |
| **Hybrid Identity** | N/A | Native (is on-prem) | Yes (Azure AD Connect) | No (cloud or custom only) | Yes (via user federation) |
| **SAML Support** | No | Yes (primary) | Yes | No (requires extension) | Yes (native) |
| **Best For** | Understanding standards | Legacy on-prem Windows | Microsoft 365 orgs, cloud-first | Custom SaaS, .NET shops | Non-.NET shops, quick IAM |

---

## OAuth 2.0 Deep Dive

### OAuth 2.0 Flow (Authorization Code Grant)

This is what our Spotify app uses!

```mermaid
sequenceDiagram
    participant User as User (You)
    participant App as Client App<br/>(PlaylistMaster)
    participant AuthServer as Authorization Server<br/>(Spotify OAuth)
    participant API as Resource Server<br/>(Spotify API)

    User->>App: 1. Click "Login with Spotify"
    App->>User: 2. Redirect to Spotify OAuth
    Note over User,AuthServer: User sees Spotify's login page

    User->>AuthServer: 3. Login & approve permissions
    AuthServer->>User: 4. Redirect with authorization code
    User->>App: 5. Browser follows redirect (code in URL)

    App->>AuthServer: 6. Exchange code for tokens<br/>(with client secret)
    AuthServer->>App: 7. Access token + Refresh token

    App->>API: 8. GET /playlists (with access token)
    API->>App: 9. Return playlist data
    App->>User: 10. Show playlists
```

### OAuth 2.0 Grant Types

OAuth 2.0 has different "recipes" for different situations:

#### 1. Authorization Code Grant (Most Secure)
**Use case:** Web apps with a backend (like our Spotify app)

```
Flow: User → OAuth page → App backend gets code → Exchange for token
Security: Client secret never exposed to browser
Token storage: Backend server (MongoDB in our case)
Example: Spotify, Google Drive, GitHub integrations
```

#### 2. Implicit Grant (Deprecated, avoid!)
**Use case:** Single-page apps (historically)

```
Flow: User → OAuth page → Token directly in URL fragment
Security: ❌ Token exposed in browser, no refresh token
Status: Deprecated - use PKCE instead
Example: Old JavaScript apps
```

#### 3. Client Credentials Grant
**Use case:** Server-to-server (no user involved)

```
Flow: App → OAuth server → Token
Security: Only for trusted apps with client secret
Token storage: Application backend
Example: Microservice A accessing Microservice B API
```

#### 4. Resource Owner Password Credentials (Avoid!)
**Use case:** Legacy apps, mobile apps (not recommended)

```
Flow: User gives username/password → App → OAuth server → Token
Security: ❌ App sees password (defeats OAuth purpose!)
Status: Only use for migration scenarios
Example: Legacy enterprise apps migrating to OAuth
```

#### 5. Authorization Code with PKCE (Modern best practice)
**Use case:** Mobile apps, single-page apps

```
Flow: Similar to auth code, but with cryptographic proof
Security: No client secret needed, resistant to code interception
Token storage: Secure mobile storage (Keychain, KeyStore)
Example: Modern mobile apps, SPAs
```

### OAuth 2.0 Scopes

Scopes define **what** the app can access:

```javascript
// Our Spotify app requests these scopes:
scopes: [
  'user-read-private',        // Read user profile
  'user-read-email',          // Read email address
  'playlist-read-private',    // Read private playlists
  'playlist-modify-public',   // Modify public playlists
  'playlist-modify-private',  // Modify private playlists
]

// User sees: "PlaylistMaster wants to:"
// ✓ View your Spotify account data
// ✓ View your email address
// ✓ Access your private playlists
// ✓ Manage your public playlists
// ✓ Manage your private playlists
```

**Principle of Least Privilege:** Only request scopes you actually need!

### OAuth 2.0 Tokens Explained

#### Access Token
```json
{
  "access_token": "BQDxK...xyz123",
  "token_type": "Bearer",
  "expires_in": 3600,  // 1 hour
  "scope": "playlist-modify-public user-read-private"
}
```

- **Purpose:** Prove authorization to access resources
- **Lifespan:** Short (1 hour typical)
- **Usage:** Sent in HTTP header: `Authorization: Bearer BQDxK...xyz123`
- **Security:** If leaked, expires quickly

#### Refresh Token
```json
{
  "refresh_token": "AQC9m...abc456",
  "expires_in": null  // Long-lived or no expiration
}
```

- **Purpose:** Get new access tokens without user re-login
- **Lifespan:** Long (months/years) or until revoked
- **Usage:** Sent to token endpoint to get new access token
- **Security:** Must be stored securely (backend only!)

---

## ADFS Deep Dive

### ADFS Core Concepts

```mermaid
graph LR
    A[Identity Provider<br/>ADFS] -->|Issues tokens| B[Relying Party<br/>Your App]
    C[Claims Provider<br/>Active Directory] -->|Provides identity| A

    style A fill:#fff4e1
    style B fill:#e1ffe1
    style C fill:#ffe1e1
```

**Three key terms:**

1. **Claims Provider**: Where user identities live (usually Active Directory)
   - Stores: username, email, department, groups, etc.

2. **Identity Provider (ADFS)**: Authenticates users and issues tokens
   - Validates credentials against Active Directory
   - Transforms identity into claims (statements about the user)

3. **Relying Party**: Your application that trusts ADFS
   - Receives and validates tokens
   - Makes authorization decisions based on claims

### ADFS with SAML 2.0 Flow

SAML (Security Assertion Markup Language) is the most common protocol ADFS uses for SSO.

```mermaid
sequenceDiagram
    participant User as Employee
    participant App as Web App<br/>(Relying Party)
    participant ADFS as ADFS Server<br/>(Identity Provider)
    participant AD as Active Directory<br/>(Claims Provider)

    User->>App: 1. Access protected page
    App->>App: 2. No session found
    App->>User: 3. Redirect to ADFS<br/>(SAML AuthnRequest)

    User->>ADFS: 4. Follow redirect

    alt Not logged in to Windows
        ADFS->>User: 5a. Show login form
        User->>ADFS: 5b. Enter username/password
    end

    ADFS->>AD: 6. Validate credentials
    AD->>ADFS: 7. User authenticated + attributes

    ADFS->>ADFS: 8. Generate SAML assertion<br/>(XML with claims)
    ADFS->>User: 9. Redirect to app<br/>(SAML Response in POST body)

    User->>App: 10. Submit SAML Response
    App->>App: 11. Validate signature<br/>Extract claims
    App->>App: 12. Create session
    App->>User: 13. Show protected page
```

### ADFS as OAuth 2.0 Provider

Yes, ADFS can also speak OAuth 2.0! (Since ADFS 3.0 / Windows Server 2012 R2)

```mermaid
sequenceDiagram
    participant User as Employee
    participant App as Mobile App<br/>(OAuth Client)
    participant ADFS as ADFS Server<br/>(OAuth Provider)
    participant AD as Active Directory

    User->>App: 1. Click "Login"
    App->>User: 2. Open browser to ADFS
    User->>ADFS: 3. Login with Windows creds

    ADFS->>AD: 4. Validate credentials
    AD->>ADFS: 5. User authenticated

    ADFS->>User: 6. Redirect with auth code
    User->>App: 7. Browser returns code

    App->>ADFS: 8. Exchange code for token<br/>(with client secret)
    ADFS->>App: 9. Access token (JWT)

    App->>ADFS: 10. Call /userinfo endpoint
    ADFS->>App: 11. User claims
```

**When does ADFS use OAuth 2.0?**
- Modern mobile apps that need to access corporate APIs
- Single-page applications (SPAs)
- REST APIs that need Windows AD authentication
- When you want JWT tokens instead of SAML

### SAML Assertion vs OAuth Token

#### SAML Assertion (XML)
```xml
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Issuer>http://adfs.bigcorp.com</saml:Issuer>
  <saml:Subject>
    <saml:NameID>john.doe@bigcorp.com</saml:NameID>
  </saml:Subject>
  <saml:AttributeStatement>
    <saml:Attribute Name="email">
      <saml:AttributeValue>john.doe@bigcorp.com</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="department">
      <saml:AttributeValue>Engineering</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="groups">
      <saml:AttributeValue>Developers</saml:AttributeValue>
      <saml:AttributeValue>Admins</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
  <saml:Signature>...</saml:Signature>
</saml:Assertion>
```

**Characteristics:**
- **Format:** XML (verbose, complex)
- **Size:** Large (2-10 KB typical)
- **Best for:** Browser-based SSO, enterprise apps
- **Claims:** Rich attribute statements
- **Signature:** XML digital signature

#### OAuth 2.0 JWT Token (JSON)
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "john.doe@bigcorp.com",
    "iss": "http://adfs.bigcorp.com",
    "aud": "myapp",
    "exp": 1640000000,
    "iat": 1639996400,
    "email": "john.doe@bigcorp.com",
    "department": "Engineering",
    "groups": ["Developers", "Admins"]
  },
  "signature": "..."
}
```

**Encoded JWT:**
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huLmRvZUBiaWdjb3JwLmNvbSIsImlzcyI6Imh0dHA6Ly9hZGZzLmJpZ2NvcnAuY29tIiwiYXVkIjoibXlhcHAiLCJleHAiOjE2NDAwMDAwMDAsImlhdCI6MTYzOTk5NjQwMCwiZW1haWwiOiJqb2huLmRvZUBiaWdjb3JwLmNvbSIsImRlcGFydG1lbnQiOiJFbmdpbmVlcmluZyIsImdyb3VwcyI6WyJEZXZlbG9wZXJzIiwiQWRtaW5zIl19.signature
```

**Characteristics:**
- **Format:** JSON (compact, modern)
- **Size:** Smaller (1-3 KB typical)
- **Best for:** APIs, mobile apps, microservices
- **Claims:** Simple key-value pairs
- **Signature:** Base64-encoded HMAC or RSA

---

## Azure AD Deep Dive

### Registering an Application in Azure AD

To use Azure AD for authentication, you must register your application in the Azure portal.

#### Step 1: Register App in Azure Portal

```
1. Go to Azure Portal → Azure Active Directory → App registrations
2. Click "New registration"
3. Enter details:
   - Name: "My SaaS App"
   - Supported account types:
     • Single tenant (your organization only)
     • Multi-tenant (any Azure AD)
     • Multi-tenant + personal Microsoft accounts
   - Redirect URI: https://yourapp.com/auth/callback
4. Click "Register"
```

#### Step 2: Configure Authentication

```
App registrations → Your app → Authentication

Platform configurations:
✓ Web: https://yourapp.com/auth/callback
✓ Single-page application: https://yourapp.com (for React/Vue/Angular)
✓ Mobile and desktop: myapp://callback (for iOS/Android)

Token configuration:
✓ ID tokens (for OpenID Connect)
✓ Access tokens (for OAuth 2.0)
```

#### Step 3: Get Credentials

```
App registrations → Your app → Overview

Copy these values:
- Application (client) ID: e.g., "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
- Directory (tenant) ID: e.g., "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7"

Create client secret:
Certificates & secrets → New client secret
- Description: "Production secret"
- Expires: 24 months
- Copy value immediately (won't be shown again!)
```

### Azure AD OAuth 2.0 Flow

```mermaid
sequenceDiagram
    participant User as User
    participant App as Your App
    participant AAD as Azure AD
    participant Graph as Microsoft Graph API

    User->>App: 1. Click "Login with Microsoft"
    App->>User: 2. Redirect to Azure AD

    User->>AAD: 3. Enter Microsoft credentials
    AAD->>AAD: 4. Validate user

    alt MFA Required
        AAD->>User: 5a. Request MFA (SMS/app)
        User->>AAD: 5b. Provide MFA code
    end

    alt Conditional Access Policy
        AAD->>AAD: 6a. Check device compliance
        AAD->>AAD: 6b. Check location
        AAD->>AAD: 6c. Check risk level
    end

    AAD->>User: 7. Redirect with auth code
    User->>App: 8. Browser follows redirect

    App->>AAD: 9. Exchange code for tokens<br/>(with client secret)
    AAD->>App: 10. Access token + ID token + Refresh token

    App->>Graph: 11. GET /me (with access token)
    Graph->>App: 12. User profile data
    App->>User: 13. Logged in
```

### Code Integration Examples

#### JavaScript SPA (React, Vue, Angular)

```javascript
// Install MSAL.js (Microsoft Authentication Library)
// npm install @azure/msal-browser

import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', // Your app ID
    authority: 'https://login.microsoftonline.com/your-tenant-id',
    redirectUri: 'http://localhost:3000'
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

// Login
async function login() {
  try {
    const loginResponse = await msalInstance.loginPopup({
      scopes: ['user.read', 'mail.read']
    });
    console.log('Logged in:', loginResponse.account);
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Get access token
async function getAccessToken() {
  const account = msalInstance.getAllAccounts()[0];
  const tokenRequest = {
    scopes: ['user.read'],
    account: account
  };

  try {
    const response = await msalInstance.acquireTokenSilent(tokenRequest);
    return response.accessToken;
  } catch (error) {
    // Token expired, acquire interactively
    const response = await msalInstance.acquireTokenPopup(tokenRequest);
    return response.accessToken;
  }
}

// Call Microsoft Graph
async function getUserProfile() {
  const accessToken = await getAccessToken();

  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  return await response.json();
}

// Logout
async function logout() {
  await msalInstance.logout();
}
```

#### ASP.NET Core Web App

```csharp
// Install packages:
// dotnet add package Microsoft.Identity.Web
// dotnet add package Microsoft.Identity.Web.UI

// Program.cs
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.UI;

var builder = WebApplication.CreateBuilder(args);

// Add Azure AD authentication
builder.Services.AddMicrosoftIdentityWebAppAuthentication(builder.Configuration, "AzureAd");

// Add authorization
builder.Services.AddAuthorization();

// Add MVC with Azure AD UI
builder.Services.AddControllersWithViews()
    .AddMicrosoftIdentityUI();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();

// appsettings.json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "Domain": "yourtenant.onmicrosoft.com",
    "TenantId": "your-tenant-id",
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret",
    "CallbackPath": "/signin-oidc"
  }
}

// Protected controller
[Authorize]
public class DashboardController : Controller
{
    public IActionResult Index()
    {
        var userName = User.Identity?.Name;
        var claims = User.Claims;
        return View();
    }
}
```

#### .NET API (Validate Azure AD tokens)

```csharp
// Install package:
// dotnet add package Microsoft.Identity.Web

// Program.cs
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// Add Azure AD Bearer token authentication
builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration);

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Protected endpoint
app.MapGet("/api/data", () => "Protected data")
    .RequireAuthorization();

app.Run();

// appsettings.json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "your-tenant-id",
    "ClientId": "your-api-client-id"
  }
}
```

### Azure AD B2C (Consumer Applications)

For customer-facing apps, use Azure AD B2C instead of regular Azure AD.

#### Key Differences

```
Azure AD (Workforce):
- For employees and business partners
- Tied to your organization
- Users need organizational accounts
- Cost: Per user ($0-$9/month)

Azure AD B2C (Consumer):
- For customers and end-users
- Public signup (anyone can register)
- Social logins (Google, Facebook, Apple)
- Custom branding
- Cost: Per authentication ($0.00325/MAU)
```

#### B2C Setup Example

```javascript
// B2C configuration
const msalConfig = {
  auth: {
    clientId: 'your-b2c-app-id',
    authority: 'https://yourtenant.b2clogin.com/yourtenant.onmicrosoft.com/B2C_1_signupsignin1',
    knownAuthorities: ['yourtenant.b2clogin.com'],
    redirectUri: 'http://localhost:3000'
  }
};

// User flows available in B2C:
// - Sign up and sign in
// - Password reset
// - Profile editing
// - Social account linking (Google, Facebook, GitHub, etc.)
```

### Microsoft Graph API

Azure AD tokens grant access to Microsoft Graph, a unified API for Microsoft 365 services.

```javascript
// Common Microsoft Graph endpoints

// User profile
GET https://graph.microsoft.com/v1.0/me
Response: { id, displayName, mail, jobTitle, officeLocation, ... }

// User's emails
GET https://graph.microsoft.com/v1.0/me/messages
Response: { value: [ { subject, from, receivedDateTime, ... } ] }

// User's calendar
GET https://graph.microsoft.com/v1.0/me/calendar/events
Response: { value: [ { subject, start, end, attendees, ... } ] }

// User's OneDrive files
GET https://graph.microsoft.com/v1.0/me/drive/root/children
Response: { value: [ { name, size, webUrl, ... } ] }

// Organization users (admin required)
GET https://graph.microsoft.com/v1.0/users
Response: { value: [ { id, displayName, mail, ... } ] }

// Teams (if Teams license)
GET https://graph.microsoft.com/v1.0/me/joinedTeams
Response: { value: [ { displayName, description, ... } ] }
```

### Conditional Access Policies

Azure AD's killer feature - control access based on conditions.

#### Example Policies

```
Policy 1: Require MFA from outside corporate network
Assignments:
  Users: All users
  Cloud apps: All apps
Conditions:
  Locations: Any location except trusted IPs
Access controls:
  Grant: Require multi-factor authentication

Policy 2: Block legacy authentication
Assignments:
  Users: All users
  Cloud apps: Office 365
Conditions:
  Client apps: Exchange ActiveSync, Other clients
Access controls:
  Block access

Policy 3: Require compliant device for sensitive apps
Assignments:
  Users: Finance department
  Cloud apps: Financial system
Conditions:
  Device state: Any device
Access controls:
  Grant: Require device to be marked as compliant
  Session: Sign-in frequency 1 hour

Policy 4: Risk-based access
Assignments:
  Users: All users
  Cloud apps: All apps
Conditions:
  Sign-in risk: High
Access controls:
  Block access
```

### Azure AD Pricing Comparison

**Scenario: 1,000 users**

```
Azure AD Free:
- Cost: $0
- Features: Basic SSO, user management
- Limitations: No MFA, no conditional access
Total: Free

Azure AD Premium P1:
- Cost: $6/user/month × 1,000 = $6,000/month = $72,000/year
- Features: MFA, conditional access, self-service password reset
Total: $72,000/year

Azure AD Premium P2:
- Cost: $9/user/month × 1,000 = $9,000/month = $108,000/year
- Features: P1 + Identity Protection, PIM
Total: $108,000/year

ADFS (on-premises equivalent):
- Windows Server: $6,000 (one-time)
- Server hardware: $10,000 (one-time)
- Admin time: 160 hours/year × $100 = $16,000/year
Year 1: $32,000
Year 2+: $16,000/year

Azure AD becomes more expensive at scale, but includes:
- Zero infrastructure management
- Built-in security features
- 99.99% SLA
- Automatic updates
```

**Scenario: 100,000 consumer users (B2C)**

```
Azure AD B2C:
- First 50,000 MAU: Free
- Next 50,000 MAU: $0.00325/MAU = $162.50/month
Total: ~$2,000/year

Auth0 equivalent:
- 100,000 MAU × $0.05/MAU = $5,000/month
Total: $60,000/year

Azure AD B2C is significantly cheaper for consumer apps!
```

---

## IdentityServer Deep Dive

### Setting Up IdentityServer

IdentityServer is an ASP.NET Core middleware that transforms your application into an OAuth 2.0/OpenID Connect server.

#### Step 1: Install the Package

```bash
# Install Duende IdentityServer (current version)
dotnet add package Duende.IdentityServer

# Or legacy IdentityServer4 (no longer maintained)
dotnet add package IdentityServer4
```

#### Step 2: Configure IdentityServer

```csharp
// Program.cs (ASP.NET Core 6+)
using Duende.IdentityServer.Models;

var builder = WebApplication.CreateBuilder(args);

// Add IdentityServer services
builder.Services.AddIdentityServer()
    .AddInMemoryClients(Config.Clients)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddTestUsers(Config.TestUsers)
    .AddDeveloperSigningCredential();  // For development only!

var app = builder.Build();

app.UseIdentityServer();  // Add OAuth endpoints
app.Run();
```

#### Step 3: Define Configuration

```csharp
// Config.cs
public static class Config
{
    // Define which apps can request tokens
    public static IEnumerable<Client> Clients => new[]
    {
        // JavaScript SPA
        new Client
        {
            ClientId = "spa-client",
            ClientName = "React SPA",
            AllowedGrantTypes = GrantTypes.Code,
            RequirePkce = true,
            RequireClientSecret = false,  // Public client
            RedirectUris = { "http://localhost:3000/callback" },
            PostLogoutRedirectUris = { "http://localhost:3000" },
            AllowedScopes = { "openid", "profile", "api1" },
            AllowedCorsOrigins = { "http://localhost:3000" }
        },

        // Mobile app
        new Client
        {
            ClientId = "mobile-app",
            ClientName = "iOS/Android App",
            AllowedGrantTypes = GrantTypes.Code,
            RequirePkce = true,
            RequireClientSecret = false,
            RedirectUris = { "myapp://callback" },
            AllowedScopes = { "openid", "profile", "api1", "offline_access" },
            AllowOfflineAccess = true  // Enable refresh tokens
        },

        // Backend service (server-to-server)
        new Client
        {
            ClientId = "service-client",
            ClientSecrets = { new Secret("secret".Sha256()) },
            AllowedGrantTypes = GrantTypes.ClientCredentials,
            AllowedScopes = { "api1", "api2" }
        }
    };

    // Define what resources can be accessed
    public static IEnumerable<ApiScope> ApiScopes => new[]
    {
        new ApiScope("api1", "My API"),
        new ApiScope("api2", "Another API")
    };

    // Define identity information that can be requested
    public static IEnumerable<IdentityResource> IdentityResources => new[]
    {
        new IdentityResources.OpenId(),
        new IdentityResources.Profile(),
        new IdentityResources.Email()
    };

    // Test users for development
    public static List<TestUser> TestUsers => new()
    {
        new TestUser
        {
            SubjectId = "1",
            Username = "alice",
            Password = "password",
            Claims = new[]
            {
                new Claim("name", "Alice Smith"),
                new Claim("email", "alice@example.com"),
                new Claim("role", "admin")
            }
        }
    };
}
```

### IdentityServer Flow (Authorization Code + PKCE)

```mermaid
sequenceDiagram
    participant User as User
    participant SPA as React SPA<br/>(Client)
    participant IS as IdentityServer<br/>(Your Auth Server)
    participant API as Your API<br/>(Resource Server)
    participant DB as User Database

    User->>SPA: 1. Click "Login"
    SPA->>SPA: 2. Generate PKCE code_verifier<br/>and code_challenge
    SPA->>User: 3. Redirect to IdentityServer
    User->>IS: 4. Follow redirect

    IS->>User: 5. Show login form
    User->>IS: 6. Enter username/password
    IS->>DB: 7. Validate credentials
    DB->>IS: 8. User found + claims

    IS->>User: 9. Redirect with authorization code
    User->>SPA: 10. Browser returns code

    SPA->>IS: 11. Exchange code for token<br/>(with code_verifier for PKCE)
    IS->>IS: 12. Validate code_challenge matches code_verifier
    IS->>SPA: 13. Access token + ID token + Refresh token

    SPA->>API: 14. GET /api/data (with access token)
    API->>IS: 15. Validate token (JWT signature)
    IS->>API: 16. Token valid
    API->>SPA: 17. Return protected data
```

### Customizing IdentityServer

#### Custom User Store (Entity Framework)

Instead of in-memory test users, connect to a real database:

```csharp
// Install packages
// dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
// dotnet add package Duende.IdentityServer.AspNetIdentity

// User entity
public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; }
    public DateTime DateOfBirth { get; set; }
}

// Database context
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }
}

// Configure in Program.cs
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddIdentityServer()
    .AddAspNetIdentity<ApplicationUser>()  // Use ASP.NET Core Identity
    .AddInMemoryClients(Config.Clients)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryIdentityResources(Config.IdentityResources);
```

#### Custom Login Page

Replace default UI with your own:

```csharp
// Controllers/AccountController.cs
[HttpGet]
public IActionResult Login(string returnUrl)
{
    var vm = new LoginViewModel { ReturnUrl = returnUrl };
    return View(vm);
}

[HttpPost]
public async Task<IActionResult> Login(LoginViewModel model)
{
    if (!ModelState.IsValid)
        return View(model);

    // Validate credentials
    var user = await _userManager.FindByNameAsync(model.Username);
    if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
    {
        // Sign in with IdentityServer cookie
        await _signInManager.SignInAsync(user, model.RememberMe);

        // Redirect back to client app
        return Redirect(model.ReturnUrl);
    }

    ModelState.AddModelError("", "Invalid username or password");
    return View(model);
}
```

#### Custom Claims

Add custom claims to tokens:

```csharp
// Profile service to customize claims
public class CustomProfileService : IProfileService
{
    private readonly IUserClaimsPrincipalFactory<ApplicationUser> _claimsFactory;
    private readonly UserManager<ApplicationUser> _userManager;

    public CustomProfileService(
        UserManager<ApplicationUser> userManager,
        IUserClaimsPrincipalFactory<ApplicationUser> claimsFactory)
    {
        _userManager = userManager;
        _claimsFactory = claimsFactory;
    }

    public async Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        var user = await _userManager.GetUserAsync(context.Subject);

        // Add custom claims
        var claims = new List<Claim>
        {
            new Claim("full_name", user.FullName),
            new Claim("subscription_level", GetSubscriptionLevel(user)),
            new Claim("department", GetDepartment(user))
        };

        // Add role claims
        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim("role", role)));

        context.IssuedClaims.AddRange(claims);
    }

    public async Task IsActiveAsync(IsActiveContext context)
    {
        var user = await _userManager.GetUserAsync(context.Subject);
        context.IsActive = user != null && !user.LockoutEnabled;
    }
}

// Register in Program.cs
builder.Services.AddTransient<IProfileService, CustomProfileService>();
```

### IdentityServer Endpoints

Once configured, IdentityServer exposes these standard endpoints:

```bash
# Discovery document (OpenID Connect)
GET https://your-identity-server.com/.well-known/openid-configuration

# Authorization endpoint (start OAuth flow)
GET https://your-identity-server.com/connect/authorize
  ?client_id=spa-client
  &redirect_uri=http://localhost:3000/callback
  &response_type=code
  &scope=openid profile api1
  &code_challenge=xyz...
  &code_challenge_method=S256

# Token endpoint (exchange code for tokens)
POST https://your-identity-server.com/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123...
&redirect_uri=http://localhost:3000/callback
&client_id=spa-client
&code_verifier=xyz...

# UserInfo endpoint (get user claims)
GET https://your-identity-server.com/connect/userinfo
Authorization: Bearer access_token_here

# Token introspection (validate tokens)
POST https://your-identity-server.com/connect/introspect
Authorization: Basic base64(client_id:client_secret)

token=access_token_here

# Revocation endpoint (revoke tokens)
POST https://your-identity-server.com/connect/revocation
Authorization: Basic base64(client_id:client_secret)

token=refresh_token_here
&token_type_hint=refresh_token
```

### Client Integration

#### JavaScript SPA (React)

```javascript
// Install oidc-client-ts
// npm install oidc-client-ts

import { UserManager } from 'oidc-client-ts';

const config = {
  authority: 'https://your-identity-server.com',
  client_id: 'spa-client',
  redirect_uri: 'http://localhost:3000/callback',
  response_type: 'code',
  scope: 'openid profile api1',
  post_logout_redirect_uri: 'http://localhost:3000',
};

const userManager = new UserManager(config);

// Login
async function login() {
  await userManager.signinRedirect();
}

// Handle callback
async function handleCallback() {
  const user = await userManager.signinRedirectCallback();
  console.log('User logged in:', user);
  return user;
}

// Call API with token
async function callApi() {
  const user = await userManager.getUser();
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${user.access_token}`
    }
  });
  return await response.json();
}

// Logout
async function logout() {
  await userManager.signoutRedirect();
}
```

#### .NET API (Validate tokens)

```csharp
// Install package
// dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer

// Program.cs
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.Authority = "https://your-identity-server.com";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false  // Or specify valid audiences
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ApiScope", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim("scope", "api1");
    });
});

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Protected endpoint
app.MapGet("/api/data", () => "Protected data")
    .RequireAuthorization("ApiScope");
```

### IdentityServer vs Managed Services

#### IdentityServer (Self-hosted)

**Pros:**
- ✅ Full control over authentication logic
- ✅ Data stays in your infrastructure (compliance)
- ✅ No per-user costs (fixed licensing)
- ✅ Customize UI, flows, claims
- ✅ Integrate with existing user database
- ✅ No vendor lock-in

**Cons:**
- ❌ You manage infrastructure (servers, scaling, backups)
- ❌ You're responsible for security updates
- ❌ Licensing costs for commercial use ($1,800+/year)
- ❌ Requires .NET expertise
- ❌ More setup and maintenance effort

#### Auth0 / Okta (Managed SaaS)

**Pros:**
- ✅ Zero infrastructure management
- ✅ Always up-to-date with security patches
- ✅ Built-in features (MFA, anomaly detection, bot protection)
- ✅ Easy integration (SDKs for all platforms)
- ✅ Free tier for getting started

**Cons:**
- ❌ Per-user or per-MAU (Monthly Active Users) pricing
- ❌ Data stored on third-party servers
- ❌ Less customization flexibility
- ❌ Vendor lock-in
- ❌ Costs scale with usage

#### Cost Comparison Example

**Scenario: 10,000 monthly active users**

```
IdentityServer:
- Duende license: $1,800/year
- Infrastructure: $100/month (cloud hosting) = $1,200/year
- Maintenance: Developer time (variable)
Total: ~$3,000/year + dev time

Auth0:
- Free tier: 0-7,000 MAU
- Essentials: $35/month + $0.0175 per MAU above 7,000
- 10,000 users: $35/month + (3,000 × $0.0175) = $87.50/month = $1,050/year
Total: ~$1,050/year

Okta:
- Workforce Identity: $2/user/month = $20,000/month = $240,000/year (ouch!)
- Customer Identity (CIC): $0.05/MAU = $500/month = $6,000/year
Total: $6,000/year (for customer identity)

Conclusion:
- For < 10K users: Auth0 is cheapest
- For > 100K users: IdentityServer becomes cost-effective
- For enterprise workforce: ADFS or Azure AD might be better
```

---

## Keycloak Deep Dive

### Setting Up Keycloak

Keycloak is a standalone Java application that runs as a server. Unlike IdentityServer (which is a library you embed), Keycloak is deployed as its own service.

#### Step 1: Deploy Keycloak

**Option A: Docker (Quickest for Development)**

```bash
# Run Keycloak with built-in H2 database (development only)
docker run -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest \
  start-dev

# Access admin console
# URL: http://localhost:8080/admin
# Username: admin
# Password: admin
```

**Option B: Docker Compose with PostgreSQL (Production-like)**

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - keycloak-network

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    command: start
    environment:
      KC_HOSTNAME: localhost
      KC_HOSTNAME_PORT: 8080
      KC_HOSTNAME_STRICT_BACKCHANNEL: false
      KC_HTTP_ENABLED: true
      KC_HOSTNAME_STRICT_HTTPS: false
      KC_HEALTH_ENABLED: true
      KC_METRICS_ENABLED: true
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: password
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - 8080:8080
    depends_on:
      - postgres
    networks:
      - keycloak-network

networks:
  keycloak-network:
    driver: bridge

volumes:
  postgres_data:
```

```bash
# Start Keycloak
docker-compose up -d

# View logs
docker-compose logs -f keycloak

# Wait for "Listening on: http://0.0.0.0:8080" message
```

#### Step 2: Create a Realm

A **realm** is an isolated identity domain. Think of it as a separate tenant with its own users, clients, and settings.

**Via Admin Console (GUI):**

1. Navigate to http://localhost:8080/admin
2. Login with `admin` / `admin`
3. Hover over "Master" in top-left corner
4. Click "Create Realm"
5. Enter realm name: `myrealm`
6. Click "Create"

**Via Admin REST API:**

```bash
# Get admin access token
ACCESS_TOKEN=$(curl -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# Create realm
curl -X POST http://localhost:8080/admin/realms \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "myrealm",
    "enabled": true,
    "displayName": "My Application Realm"
  }'
```

#### Step 3: Create a Client (Application)

A **client** represents your application (web app, mobile app, or API).

**Example: React SPA Client**

1. In admin console, select your realm (`myrealm`)
2. Navigate to "Clients" → "Create client"
3. Fill in:
   - **Client ID**: `react-app`
   - **Client type**: OpenID Connect
   - Click "Next"
4. Configure:
   - **Client authentication**: OFF (public client for SPA)
   - **Authorization**: OFF
   - **Standard flow**: ON (Authorization Code)
   - **Direct access grants**: OFF
   - Click "Next"
5. Configure URLs:
   - **Root URL**: `http://localhost:3000`
   - **Home URL**: `http://localhost:3000`
   - **Valid redirect URIs**: `http://localhost:3000/*`
   - **Valid post logout redirect URIs**: `http://localhost:3000/*`
   - **Web origins**: `http://localhost:3000`
6. Click "Save"

**Example: Node.js Backend API**

```bash
# Create client via REST API
curl -X POST http://localhost:8080/admin/realms/myrealm/clients \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "api-backend",
    "name": "Node.js API",
    "enabled": true,
    "publicClient": false,
    "bearerOnly": true,
    "standardFlowEnabled": false,
    "directAccessGrantsEnabled": false,
    "serviceAccountsEnabled": false
  }'
```

#### Step 4: Create Test Users

**Via Admin Console:**

1. Navigate to "Users" → "Add user"
2. Fill in:
   - **Username**: `testuser`
   - **Email**: `test@example.com`
   - **First name**: `Test`
   - **Last name**: `User`
3. Click "Create"
4. Go to "Credentials" tab
5. Click "Set password"
6. Enter password: `password123`
7. Toggle "Temporary" to OFF
8. Click "Save"

**Via REST API:**

```bash
# Create user
curl -X POST http://localhost:8080/admin/realms/myrealm/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password",
      "value": "password123",
      "temporary": false
    }]
  }'
```

### Keycloak OAuth 2.0 Flow

```mermaid
sequenceDiagram
    participant User as User Browser
    participant SPA as React App<br/>(Client)
    participant KC as Keycloak<br/>(Auth Server)
    participant API as Node.js API<br/>(Resource Server)
    participant DB as PostgreSQL<br/>(User DB)

    User->>SPA: 1. Click "Login"
    SPA->>SPA: 2. Generate PKCE code_verifier<br/>+ code_challenge
    SPA->>User: 3. Redirect to Keycloak

    User->>KC: 4. GET /realms/myrealm/protocol/openid-connect/auth<br/>?client_id=react-app&redirect_uri=...&code_challenge=...

    KC->>User: 5. Show login page
    User->>KC: 6. Submit username/password
    KC->>DB: 7. Validate credentials
    DB->>KC: 8. User found + claims

    KC->>User: 9. Redirect with authorization code<br/>http://localhost:3000/callback?code=abc123
    User->>SPA: 10. Browser follows redirect

    SPA->>KC: 11. POST /realms/myrealm/protocol/openid-connect/token<br/>code=abc123&code_verifier=xyz
    KC->>KC: 12. Validate PKCE (code_challenge matches code_verifier)
    KC->>SPA: 13. Return access_token + id_token + refresh_token

    SPA->>API: 14. GET /api/data<br/>Authorization: Bearer <access_token>
    API->>KC: 15. Validate JWT signature<br/>(using Keycloak public key)
    KC->>API: 16. Token valid
    API->>SPA: 17. Return protected data

    Note over SPA,KC: Token expires after 5 minutes (configurable)

    SPA->>KC: 18. POST /realms/myrealm/protocol/openid-connect/token<br/>grant_type=refresh_token&refresh_token=...
    KC->>SPA: 19. New access_token + refresh_token
```

### Code Integration Examples

#### Example 1: React SPA (Frontend)

**Install dependencies:**

```bash
npm install @react-keycloak/web keycloak-js
```

**Setup Keycloak provider:**

```jsx
// src/keycloak.js
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'myrealm',
  clientId: 'react-app'
});

export default keycloak;
```

```jsx
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keycloak';
import App from './App';

ReactDOM.render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={{
      onLoad: 'check-sso',
      pkceMethod: 'S256',  // Enable PKCE
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
    }}
  >
    <App />
  </ReactKeycloakProvider>,
  document.getElementById('root')
);
```

**Use in components:**

```jsx
// src/App.js
import React from 'react';
import { useKeycloak } from '@react-keycloak/web';

function App() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  const handleLogin = () => {
    keycloak.login();
  };

  const handleLogout = () => {
    keycloak.logout();
  };

  const fetchProtectedData = async () => {
    const response = await fetch('http://localhost:4000/api/data', {
      headers: {
        'Authorization': `Bearer ${keycloak.token}`
      }
    });
    const data = await response.json();
    console.log(data);
  };

  return (
    <div>
      {!keycloak.authenticated ? (
        <button onClick={handleLogin}>Login</button>
      ) : (
        <div>
          <p>Welcome, {keycloak.tokenParsed.preferred_username}!</p>
          <p>Email: {keycloak.tokenParsed.email}</p>
          <button onClick={fetchProtectedData}>Fetch Protected Data</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;
```

#### Example 2: Node.js API (Backend)

**Install dependencies:**

```bash
npm install express keycloak-connect express-session
```

**Setup Keycloak middleware:**

```javascript
// server.js
const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');

const app = express();

// Session store (required by keycloak-connect)
const memoryStore = new session.MemoryStore();
app.use(session({
  secret: 'some-secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Initialize Keycloak
const keycloak = new Keycloak({ store: memoryStore }, {
  realm: 'myrealm',
  'auth-server-url': 'http://localhost:8080',
  'ssl-required': 'none',
  resource: 'api-backend',
  'bearer-only': true,  // API doesn't redirect, just validates tokens
  'confidential-port': 0
});

app.use(keycloak.middleware());

// Public endpoint
app.get('/api/public', (req, res) => {
  res.json({ message: 'This is public' });
});

// Protected endpoint (requires valid token)
app.get('/api/data', keycloak.protect(), (req, res) => {
  // Extract user info from token
  const token = req.kauth.grant.access_token;
  const userId = token.content.sub;
  const username = token.content.preferred_username;
  const email = token.content.email;

  res.json({
    message: 'This is protected data',
    user: { userId, username, email }
  });
});

// Protected endpoint with role check
app.get('/api/admin', keycloak.protect('realm:admin'), (req, res) => {
  res.json({ message: 'Admin only data' });
});

app.listen(4000, () => {
  console.log('API running on http://localhost:4000');
});
```

#### Example 3: JWT Token Validation (Manual - Any Language)

If you don't want to use a Keycloak SDK, you can manually validate JWTs:

**Python example:**

```python
# pip install pyjwt cryptography requests

import jwt
import requests
from jwt.algorithms import RSAAlgorithm

# Fetch Keycloak public key (cache this in production!)
def get_keycloak_public_key():
    url = 'http://localhost:8080/realms/myrealm/protocol/openid-connect/certs'
    response = requests.get(url)
    jwks = response.json()

    # Get first key (usually only one)
    key_data = jwks['keys'][0]
    public_key = RSAAlgorithm.from_jwk(key_data)
    return public_key

# Validate token
def validate_token(token):
    try:
        public_key = get_keycloak_public_key()

        # Decode and verify
        decoded = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience='account',  # or your client ID
            issuer='http://localhost:8080/realms/myrealm'
        )

        print('Token is valid!')
        print(f"User: {decoded['preferred_username']}")
        print(f"Email: {decoded.get('email')}")
        print(f"Expires: {decoded['exp']}")
        return decoded

    except jwt.ExpiredSignatureError:
        print('Token expired')
    except jwt.InvalidTokenError as e:
        print(f'Invalid token: {e}')

# Usage
access_token = 'eyJhbGciOiJSUzI1NiIsInR5cCI...'
validate_token(access_token)
```

**Go example:**

```go
// go get github.com/golang-jwt/jwt/v5
// go get github.com/lestrrat-go/jwx/jwk

package main

import (
    "context"
    "fmt"
    "github.com/golang-jwt/jwt/v5"
    "github.com/lestrrat-go/jwx/jwk"
)

func main() {
    // Fetch JWKS from Keycloak
    set, err := jwk.Fetch(context.Background(),
        "http://localhost:8080/realms/myrealm/protocol/openid-connect/certs")
    if err != nil {
        panic(err)
    }

    tokenString := "eyJhbGciOiJSUzI1NiIsInR5cCI..."

    // Parse token
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        // Get key ID from token header
        kid, ok := token.Header["kid"].(string)
        if !ok {
            return nil, fmt.Errorf("kid header not found")
        }

        // Find matching public key
        key, ok := set.LookupKeyID(kid)
        if !ok {
            return nil, fmt.Errorf("key %s not found", kid)
        }

        var pubKey interface{}
        if err := key.Raw(&pubKey); err != nil {
            return nil, err
        }

        return pubKey, nil
    })

    if err != nil {
        panic(err)
    }

    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        fmt.Println("Token valid!")
        fmt.Printf("User: %s\n", claims["preferred_username"])
        fmt.Printf("Email: %s\n", claims["email"])
    }
}
```

### User Federation (LDAP Integration)

One of Keycloak's killer features: connect to existing LDAP/Active Directory without migrating users.

#### Setting Up LDAP Federation

**Via Admin Console:**

1. Navigate to "User Federation" in your realm
2. Click "Add provider" → "ldap"
3. Configure connection:

```
General Settings:
  Console Display Name: Corporate LDAP
  Priority: 0
  Enabled: ON

Connection and Authentication Settings:
  Connection URL: ldap://ldap.example.com:389
  Bind Type: simple
  Bind DN: cn=admin,dc=example,dc=com
  Bind Credential: admin-password

LDAP Searching and Updating:
  Edit Mode: READ_ONLY (users can't change LDAP data via Keycloak)
  Users DN: ou=users,dc=example,dc=com
  Username LDAP attribute: uid
  RDN LDAP attribute: uid
  UUID LDAP attribute: entryUUID
  User Object Classes: inetOrgPerson, organizationalPerson

Advanced:
  Pagination: ON
```

4. Click "Test connection" to verify LDAP connectivity
5. Click "Test authentication" to verify bind credentials
6. Click "Save"
7. Click "Synchronize all users" to import existing LDAP users

**Result:**
- All LDAP users can now log into your app via Keycloak
- Passwords are validated against LDAP (not stored in Keycloak)
- No user migration required!
- LDAP remains the source of truth

#### Mapper Configuration

Map LDAP attributes to Keycloak user attributes:

```
Navigate to your LDAP provider → Mappers tab

Examples:
1. Email Mapper:
   - Name: email
   - Mapper Type: user-attribute-ldap-mapper
   - User Model Attribute: email
   - LDAP Attribute: mail
   - Read Only: ON

2. Full Name Mapper:
   - Name: full name
   - Mapper Type: full-name-ldap-mapper
   - LDAP Full Name Attribute: cn
   - Read Only: ON

3. Group Mapper:
   - Name: groups
   - Mapper Type: group-ldap-mapper
   - LDAP Groups DN: ou=groups,dc=example,dc=com
   - Group Object Classes: groupOfNames
```

### Social Login Configuration

Keycloak comes pre-configured with social identity providers. Enable them in minutes!

#### Example: Google Login

1. **Create Google OAuth App:**
   - Go to https://console.cloud.google.com
   - Create new project (or select existing)
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8080/realms/myrealm/broker/google/endpoint`
   - Copy **Client ID** and **Client Secret**

2. **Configure in Keycloak:**
   - Navigate to "Identity Providers" in your realm
   - Click "Add provider" → "Google"
   - Fill in:
     - **Redirect URI**: (auto-filled, copy this to Google Console)
     - **Client ID**: (from Google Console)
     - **Client Secret**: (from Google Console)
   - Click "Save"

3. **Test:**
   - Go to your login page
   - You'll now see a "Sign in with Google" button
   - Click it → Redirects to Google → User approves → Redirects back
   - User is automatically created in Keycloak!

#### Supported Providers (Out-of-the-Box):

```
✓ Google
✓ Facebook
✓ GitHub
✓ GitLab
✓ Twitter (X)
✓ LinkedIn
✓ Microsoft
✓ Instagram
✓ Stack Overflow
✓ OpenID Connect (custom)
✓ SAML (custom)
```

### Multi-Tenancy with Realms

Keycloak's **realm** concept is perfect for multi-tenant SaaS applications.

#### Architecture: One Realm Per Customer

```
Keycloak Server
├─ Realm: master (admin realm)
├─ Realm: customer-acme
│  ├─ Users: acme-user1, acme-user2
│  ├─ Client: acme-webapp
│  └─ Theme: ACME branding
├─ Realm: customer-techcorp
│  ├─ Users: tech-user1, tech-user2
│  ├─ Client: techcorp-webapp
│  └─ Theme: TechCorp branding
└─ Realm: customer-startup
   ├─ Users: startup-user1
   ├─ Client: startup-webapp
   └─ Theme: Startup branding
```

#### Dynamic Realm Selection

**Option 1: Subdomain-based**

```javascript
// Determine realm from subdomain
// acme.myapp.com → realm: customer-acme
// techcorp.myapp.com → realm: customer-techcorp

function getRealmFromSubdomain() {
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  return `customer-${subdomain}`;
}

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: getRealmFromSubdomain(),
  clientId: 'webapp'
});
```

**Option 2: Database lookup**

```javascript
// User enters email → lookup tenant → redirect to correct realm

async function loginUser(email) {
  // Call your backend
  const response = await fetch('/api/lookup-tenant', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' }
  });

  const { realmName } = await response.json();
  // e.g., "customer-acme"

  const keycloak = new Keycloak({
    url: 'http://localhost:8080',
    realm: realmName,
    clientId: 'webapp'
  });

  keycloak.login();
}
```

#### Creating Realms Programmatically

```javascript
// Node.js example: Create realm when customer signs up

const axios = require('axios');

async function createCustomerRealm(customerId, customerName) {
  // Get admin token
  const tokenResponse = await axios.post(
    'http://localhost:8080/realms/master/protocol/openid-connect/token',
    new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: 'admin',
      password: 'admin'
    })
  );

  const adminToken = tokenResponse.data.access_token;

  // Create realm
  await axios.post(
    'http://localhost:8080/admin/realms',
    {
      realm: `customer-${customerId}`,
      enabled: true,
      displayName: `${customerName} Realm`,
      loginTheme: 'custom-theme',
      accountTheme: 'custom-theme',
      accessTokenLifespan: 300  // 5 minutes
    },
    {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );

  console.log(`Realm created for ${customerName}`);
}

// Usage
createCustomerRealm('acme', 'ACME Corporation');
```

### Advanced Features

#### Custom Authentication Flow

Keycloak allows you to customize the authentication process using flows.

**Example: Add Custom 2FA via SMS**

1. Navigate to "Authentication" → "Flows"
2. Copy "Browser" flow
3. Add execution: "SMS OTP"
4. Configure SMS provider (Twilio, etc.)
5. Set as default browser flow

#### Custom User Attributes

```bash
# Add custom attribute to users
curl -X PUT http://localhost:8080/admin/realms/myrealm/users/{userId} \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": {
      "department": ["Engineering"],
      "employeeId": ["E12345"],
      "subscriptionTier": ["premium"]
    }
  }'

# Access in token (add mapper)
# Navigate to Client → Client scopes → Dedicated scope → Add mapper
# Mapper type: User Attribute
# User Attribute: department
# Token Claim Name: department
# Claim JSON Type: String
```

#### Event Listeners & Webhooks

Keycloak can send events to external systems:

1. Navigate to "Realm Settings" → "Events"
2. Enable "Save Events"
3. Configure event listeners (requires custom SPI)

**Custom Event Listener (Java SPI):**

```java
// Send webhook when user logs in
public class WebhookEventListener implements EventListenerProvider {
    @Override
    public void onEvent(Event event) {
        if (event.getType() == EventType.LOGIN) {
            // Send HTTP request to your backend
            sendWebhook("https://myapp.com/webhooks/user-login", event);
        }
    }

    private void sendWebhook(String url, Event event) {
        // HTTP POST implementation
    }
}
```

### Keycloak in Production

#### Performance Tuning

```bash
# Increase connection pool
KC_DB_POOL_INITIAL_SIZE=20
KC_DB_POOL_MAX_SIZE=100
KC_DB_POOL_MIN_SIZE=10

# Enable caching
KC_CACHE=ispn
KC_CACHE_STACK=kubernetes  # For K8s deployments

# JVM tuning
JAVA_OPTS="-Xms2g -Xmx4g -XX:MetaspaceSize=512m"
```

#### High Availability Setup

```yaml
# Kubernetes deployment (3 replicas)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
spec:
  replicas: 3
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      containers:
      - name: keycloak
        image: quay.io/keycloak/keycloak:latest
        args: ["start", "--cache-stack=kubernetes"]
        env:
        - name: KC_DB
          value: postgres
        - name: KC_DB_URL
          value: jdbc:postgresql://postgres:5432/keycloak
        - name: KC_PROXY
          value: edge
        - name: KC_HOSTNAME_STRICT
          value: "false"
        - name: JAVA_OPTS
          value: "-Xms2g -Xmx4g"
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 60
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 90
```

#### Backup Strategy

```bash
# Backup PostgreSQL database
pg_dump -U keycloak -h localhost keycloak > keycloak-backup-$(date +%Y%m%d).sql

# Restore
psql -U keycloak -h localhost keycloak < keycloak-backup-20231215.sql

# Export realm configuration (for version control)
docker exec keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/export \
  --realm myrealm

# Import realm
docker exec keycloak /opt/keycloak/bin/kc.sh import \
  --dir /tmp/export \
  --override true
```

### Keycloak vs IdentityServer - When to Choose

| Choose Keycloak | Choose IdentityServer |
|-----------------|----------------------|
| ✅ Non-.NET tech stack | ✅ .NET-focused development |
| ✅ Need admin UI out-of-box | ✅ Need full customization |
| ✅ SAML required | ✅ Lightweight deployment |
| ✅ LDAP/AD federation needed | ✅ Want library (not separate server) |
| ✅ Quick setup (hours) | ✅ Source code access critical |
| ✅ Zero licensing cost | ✅ Lower resource usage |
| ✅ Multi-protocol (OAuth, SAML, OIDC) | ✅ OAuth/OIDC only |
| ✅ Java ecosystem | ✅ C# ecosystem |

### Cost Comparison: 100K Users

```
Keycloak (self-hosted):
- License: $0 (100% free)
- Infrastructure: $200/month (VMs, DB, load balancer) = $2,400/year
- Maintenance: ~40 hours/year × $100/hour = $4,000/year
- Total: $6,400/year

IdentityServer (self-hosted):
- License: $1,800/year (Duende Business Edition)
- Infrastructure: $150/month (lighter footprint) = $1,800/year
- Maintenance: ~30 hours/year × $100/hour = $3,000/year
- Total: $6,600/year

Auth0:
- 100,000 MAU × $0.0175/MAU = $1,750/month = $21,000/year

Azure AD B2C:
- 100,000 MAU × $0.00325/MAU = $325/month = $3,900/year

Winner: Azure AD B2C (cheapest)
Best self-hosted: Keycloak (most features, zero licensing)
```

---

## When to Use Which?

### Use OAuth 2.0 When...

✅ **Building consumer-facing applications**
```
Examples:
- Social media integrations (Twitter, Facebook)
- "Login with Google" buttons
- Third-party app marketplaces
- Mobile apps accessing user data
```

✅ **You need delegated access**
```
Scenario: App needs to access user's data without storing credentials
Example: Photo printing app accessing Google Photos
```

✅ **You want fine-grained permissions**
```
Scopes: read:photos, write:calendar, delete:messages
User sees exactly what app can do
```

✅ **You're building an API**
```
RESTful APIs with token-based authentication
Stateless, scalable, mobile-friendly
```

✅ **You have multiple identity providers**
```
Support login with:
- Google
- Facebook
- GitHub
- Spotify
(Each implements OAuth 2.0 independently)
```

### Use ADFS When...

✅ **Enterprise Single Sign-On (SSO)**
```
Employees log in once, access:
- SharePoint
- Outlook Web Access
- Salesforce
- Custom internal apps
```

✅ **You already have Active Directory**
```
Scenario: Company uses Windows, all users in AD
ADFS extends AD to web applications
```

✅ **You need to support legacy protocols**
```
SAML 2.0: Many enterprise SaaS apps (Salesforce, Workday)
WS-Federation: Older .NET applications
```

✅ **Federated identity across organizations**
```
Scenario: BigCorp employees need to access PartnerCorp apps
ADFS establishes trust between companies
```

✅ **Compliance and governance**
```
Requirements:
- Centralized audit logs
- Group-based access control
- Integrated with Windows security policies
- On-premises identity storage
```

✅ **You need claims-based authorization**
```
Claims: "Department=Engineering", "Clearance=Top Secret"
Apps make decisions based on claims, not just identity
```

### Use IdentityServer When...

✅ **Building a SaaS application with your own users**
```
Examples:
- Multi-tenant SaaS platform
- B2B application with custom user management
- Marketplace with buyer and seller accounts
- Project management tool with team collaboration
```

✅ **You need full control over authentication**
```
Requirements:
- Custom login UI matching your brand
- Specific password policies
- Custom MFA implementation
- Specialized user flows (onboarding, password reset)
```

✅ **Microservices architecture**
```
Scenario: Multiple services need to validate tokens
IdentityServer issues JWT tokens that services can validate independently
No central database lookups = better scalability
```

✅ **You want to avoid vendor lock-in**
```
Concerns:
- Don't want to depend on Auth0/Okta
- Need to migrate identity provider later
- Want flexibility to change infrastructure
```

✅ **Cost-sensitive at scale**
```
Break-even point:
- < 10K users: Managed services (Auth0) might be cheaper
- > 100K users: IdentityServer becomes cost-effective
- Fixed cost ($1,800/year) vs per-user pricing
```

✅ **Data sovereignty requirements**
```
Compliance needs:
- User data must stay in-country
- No third-party access to credentials
- Full audit trail control
- GDPR, HIPAA, or other regulations
```

✅ **You have .NET expertise**
```
Team skills:
- ASP.NET Core developers on staff
- Comfortable with C#
- Can manage infrastructure
```

### Don't Use IdentityServer When...

❌ **You're not using .NET**
```
IdentityServer is ASP.NET Core only
For Node.js/Python/Java, consider:
- node-oidc-provider (Node.js)
- Keycloak (Java, language-agnostic)
- Authlib (Python)
```

❌ **You need quick time-to-market**
```
Setup time:
- IdentityServer: Days to weeks (customization, infrastructure)
- Auth0/Okta: Hours (SDK integration)

If you need to launch fast, use managed service first,
migrate to IdentityServer later if needed.
```

❌ **Small team with no DevOps**
```
IdentityServer requires:
- Infrastructure management
- Security updates
- Monitoring and alerting
- Backup and disaster recovery

Without DevOps resources, use managed services.
```

❌ **You want advanced features out-of-the-box**
```
Features that require extra work with IdentityServer:
- Passwordless authentication (magic links, WebAuthn)
- Social logins (Google, Facebook, GitHub)
- Adaptive MFA (risk-based authentication)
- Bot detection
- Anomaly detection

Managed services include these features.
```

### Use Keycloak When...

✅ **You're not using .NET**
```
Tech stack:
- Backend: Node.js, Python, Java, Go, Ruby
- Need OAuth/OIDC server
- Want self-hosted solution

Keycloak works everywhere:
✓ Platform-agnostic (Java runs anywhere)
✓ No .NET runtime required
✓ Docker-friendly
```

✅ **You need features out-of-the-box**
```
Requirements:
- Admin console (GUI management)
- User federation (LDAP, Active Directory)
- Social logins (Google, Facebook, GitHub)
- MFA (OTP, WebAuthn)
- SAML support

Keycloak includes all of this built-in!
IdentityServer requires coding all of these.
```

✅ **Quick setup is priority**
```
Timeline: Need working auth in 1-2 days

Keycloak:
- Day 1: Deploy, configure via admin UI
- Day 2: Integrate and test
→ Production ready

IdentityServer:
- Day 1-3: Write configuration code
- Day 4-5: Integrate and test
→ More development time
```

✅ **Multi-protocol requirements**
```
Your customers need both:
- Modern apps: OAuth 2.0/OIDC
- Enterprise apps: SAML 2.0

Keycloak: Native support for both
IdentityServer: OAuth/OIDC only, need SAML extension
```

✅ **User federation is required**
```
Scenario: 10,000 users in LDAP/Active Directory

Keycloak:
- Configure via admin UI (no code)
- Federation works immediately
- No user migration needed

IdentityServer:
- Write custom integration
- Implement interfaces
- Test extensively
```

✅ **Truly free and open-source**
```
Budget: $0 for licensing

Keycloak: 100% free (Apache 2.0)
IdentityServer: $1,800+/year for commercial use

For startups and non-profits, this matters!
```

### Don't Use Keycloak When...

❌ **You're heavily invested in .NET**
```
If your team:
- Only knows C#/.NET
- All services are ASP.NET Core
- Want tight integration with .NET ecosystem

Use IdentityServer instead:
✓ Native .NET integration
✓ More C# customization options
✓ Lighter resource footprint
```

❌ **You want ultra-lightweight**
```
Keycloak requires:
- Java runtime (JVM overhead)
- External database (PostgreSQL/MySQL)
- 2-4 GB RAM minimum
- More complex deployment

IdentityServer:
- .NET runtime only
- Can use in-memory storage
- 512 MB RAM sufficient
- Simpler deployment
```

❌ **You need full customization**
```
Requirements:
- Highly custom authentication flows
- Specific token formats
- Deep integration with your code

Keycloak: Requires SPIs (Service Provider Interfaces)
IdentityServer: Direct code access, more flexible
```

❌ **You want managed service**
```
If you prefer:
- Zero infrastructure management
- Automatic updates
- Built-in DDoS protection
- 99.99% SLA

Use Auth0, Okta, or Azure AD B2C instead
```

---

## SaaS Identity Recommendations: API, Web, and Mobile

This section provides specific recommendations for SaaS developers building modern applications.

### TL;DR - Quick Recommendations

```
Building a SaaS product?

API-First SaaS:
→ Recommended: Keycloak (non-.NET) or IdentityServer (.NET) or Auth0/Azure AD B2C
→ Why: Stateless JWT validation, microservices-ready

Web Application:
→ Recommended: Keycloak (free, GUI) or Auth0 (quick launch) or IdentityServer (custom needs)
→ Why: OAuth 2.0/OIDC support, customizable UI

Mobile App:
→ Recommended: Auth0 or Azure AD B2C (best SDKs) or Keycloak (self-hosted)
→ Why: Native SDKs, PKCE support, biometric integration

Enterprise SaaS (B2B):
→ Recommended: Keycloak (if self-hosted + SAML) or Azure AD/Okta (managed)
→ Why: Support customer SSO (SAML + OAuth), enterprise features
```

---

### Scenario 1: Building an API-Based SaaS

**Your Situation:**
- You're building a RESTful API (e.g., project management, CRM, analytics platform)
- Multiple clients will access your API: web app, mobile apps, third-party integrations
- Need token-based authentication (stateless, scalable)

#### Recommended Solution: **IdentityServer** (if .NET) or **Auth0/Azure AD B2C** (otherwise)

**Architecture:**

```mermaid
graph TB
    subgraph "Identity Provider"
        IDP[IdentityServer<br/>or<br/>Auth0/Azure AD B2C]
    end

    subgraph "Clients"
        WebApp[Web App<br/>React/Vue/Angular]
        MobileApp[Mobile App<br/>iOS/Android]
        ThirdParty[Third-Party Apps<br/>API Keys]
    end

    subgraph "Your SaaS Backend"
        API[API Gateway<br/>Token Validation]
        MS1[Service: Users]
        MS2[Service: Projects]
        MS3[Service: Analytics]
    end

    WebApp -->|Access token| API
    MobileApp -->|Access token| API
    ThirdParty -->|API key → token| API

    API -->|Validate JWT| IDP
    API --> MS1
    API --> MS2
    API --> MS3

    style IDP fill:#fff4e1
    style API fill:#ffe1e1
```

**Why This Approach?**

✅ **Stateless Authentication**
```javascript
// Each API request includes JWT token
GET /api/projects
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

// API validates token locally (no database lookup!)
const decoded = jwt.verify(token, publicKey);
// decoded = { userId: "123", scopes: ["read:projects", "write:projects"] }
```

**Benefits:**
- No session database lookups → faster response times
- Horizontally scalable (add more API servers without shared state)
- Works across microservices (each service validates independently)

✅ **Multiple Client Support**
```
Same OAuth server supports:
- Web app (Authorization Code flow)
- Mobile app (Authorization Code + PKCE flow)
- Third-party apps (Client Credentials flow)
- Webhooks (Machine-to-machine tokens)
```

✅ **Scoped Permissions**
```javascript
// Different clients get different permissions
{
  "sub": "user-123",
  "scopes": [
    "read:projects",
    "write:projects",
    "read:analytics",
    "delete:project:owned"  // Fine-grained control
  ]
}

// API enforces scopes
app.get('/api/projects/:id', requireScope('read:projects'), getProject);
app.delete('/api/projects/:id', requireScope('delete:project:owned'), deleteProject);
```

#### Implementation Path

**Option A: IdentityServer (if .NET stack)**

```csharp
// Why IdentityServer for API-first SaaS:
// ✓ Built for OAuth 2.0/OIDC (perfect for APIs)
// ✓ JWT tokens with custom claims
// ✓ Microservices-ready (stateless validation)
// ✓ Cost-effective at scale ($1,800/year vs per-user pricing)

// Typical setup
builder.Services.AddIdentityServer()
    .AddAspNetIdentity<ApplicationUser>()
    .AddInMemoryApiScopes(new[] {
        new ApiScope("api.projects", "Projects API"),
        new ApiScope("api.analytics", "Analytics API")
    })
    .AddInMemoryClients(Config.Clients);

// API validation (separate service)
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer(options => {
        options.Authority = "https://auth.yoursaas.com";
        options.Audience = "api";
    });
```

**Pros:**
- Full control over token content and lifetimes
- Integrate with your existing user database
- No per-user costs (fixed $1,800/year)
- Customizable auth flows

**Cons:**
- You manage infrastructure (hosting, scaling, monitoring)
- Requires .NET expertise
- More initial setup time

**Option B: Auth0 (quick launch, any stack)**

```javascript
// Why Auth0 for API-first SaaS:
// ✓ Zero infrastructure management
// ✓ Works with Node.js, Python, Java, Go, etc.
// ✓ Built-in rate limiting, bot detection
// ✓ Quick setup (hours, not days)

// API validation (Node.js example)
const { auth } = require('express-oauth2-jwt-bearer');

const jwtCheck = auth({
  audience: 'https://api.yoursaas.com',
  issuerBaseURL: 'https://yoursaas.auth0.com',
});

app.use('/api', jwtCheck);  // Protect all API routes

app.get('/api/projects', (req, res) => {
  const userId = req.auth.sub;  // From JWT token
  // ...
});
```

**Pros:**
- Zero infrastructure (fully managed)
- Free tier: 7,000 active users
- Built-in features (MFA, social logins, anomaly detection)
- SDKs for all platforms

**Cons:**
- Per-user pricing ($35/month + $0.0175/MAU above 7K)
- Vendor lock-in (harder to migrate)
- Less customization flexibility

**Option C: Azure AD B2C (Microsoft ecosystem)**

```csharp
// Why Azure AD B2C for API-first SaaS:
// ✓ Very cheap for consumer apps ($0.00325/MAU)
// ✓ Custom branding and user flows
// ✓ Integrates with Microsoft Graph
// ✓ Built-in social logins

// API validation (.NET)
builder.Services.AddMicrosoftIdentityWebApiAuthentication(
    Configuration, "AzureAdB2C");

[Authorize]
[HttpGet("projects")]
public IActionResult GetProjects()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    // ...
}
```

**Pros:**
- Extremely cost-effective for consumer SaaS (first 50K MAU free!)
- Managed by Microsoft (99.99% SLA)
- Custom user flows (signup, password reset, etc.)

**Cons:**
- Tied to Azure ecosystem
- Less flexible than IdentityServer
- Complex configuration UI

#### Decision Matrix for API-Based SaaS

| Criteria | Keycloak | IdentityServer | Auth0 | Azure AD B2C |
|----------|----------|----------------|-------|--------------|
| **Best for** | Non-.NET, feature-rich | .NET shops, full control | Quick launch, any stack | Consumer SaaS, low cost |
| **Setup time** | 1-2 days | 2-5 days | 1-2 days | 1-3 days |
| **Infrastructure** | You manage | You manage | Zero | Zero |
| **Admin UI** | Yes (built-in) | No (code-based) | Yes (web-based) | Yes (Azure portal) |
| **SAML Support** | Yes (native) | No (extension needed) | Yes | Yes |
| **User Federation** | Yes (built-in) | No (custom code) | Yes (limited) | Via Azure AD Connect |
| **Cost (10K users)** | $2,400/year | $3,000/year | $1,050/year | $32.50/year |
| **Cost (100K users)** | $4,800/year | $5,600/year | $8,250/year | $325/year |
| **Cost (1M users)** | $4,800/year | $5,600/year | $52,500/year | $3,250/year |
| **Customization** | Moderate (SPIs) | Full (source code) | Moderate | Moderate |
| **Vendor lock-in** | No | No | Yes | Moderate |
| **Learning curve** | Low-Medium (GUI) | High (coding) | Low | Medium |
| **Platform** | Any (Java) | .NET only | Cloud | Cloud |

**Recommendation:**
- **Startup/MVP (non-.NET):** Keycloak or Auth0 (both fast setup)
- **Startup/MVP (.NET):** Auth0 (faster than IdentityServer)
- **Cost-sensitive + non-.NET:** Keycloak (free, feature-rich)
- **Cost-sensitive + .NET:** IdentityServer
- **Consumer SaaS at scale:** Azure AD B2C (cheapest)
- **Need full control + .NET:** IdentityServer
- **Need full control + any platform:** Keycloak
- **Need SAML + OAuth:** Keycloak (easiest)

---

### Scenario 2: Building a Web Application

**Your Situation:**
- You're building a web-based SaaS (e.g., dashboard, admin panel, collaboration tool)
- Users access via browser (React, Vue, Angular, or server-rendered)
- Need login, session management, and user profiles

#### Recommended Solution: **Auth0** (quick) or **IdentityServer** (custom)

**Why OAuth 2.0/OpenID Connect?**

```javascript
// Traditional session-based auth (old way)
User logs in → Server creates session → Store session ID in cookie
Every request → Look up session in database → Validate user

Problems:
- Database lookup on every request (slow)
- Hard to scale (sessions tied to server)
- Doesn't work for mobile apps or APIs

// OAuth 2.0/OIDC (modern way)
User logs in → OAuth server issues tokens → Store user ID in JWT
Every request → Validate JWT signature (no database!)

Benefits:
- Stateless (no session database)
- Scales horizontally
- Works for web, mobile, and APIs
```

**Architecture Pattern: Backend-for-Frontend (BFF)**

```mermaid
graph LR
    subgraph "Browser"
        SPA[React/Vue/Angular]
    end

    subgraph "Your Backend"
        BFF[BFF Server<br/>Node.js/ASP.NET]
        API[API Layer]
    end

    subgraph "Identity"
        IDP[Auth0/IdentityServer]
    end

    SPA -->|1. Redirect to login| IDP
    IDP -->|2. Auth code| BFF
    BFF -->|3. Exchange for tokens| IDP
    BFF -->|4. Store tokens server-side| BFF
    BFF -->|5. Set session cookie| SPA

    SPA -->|6. API calls with cookie| BFF
    BFF -->|7. Add access token| API

    style SPA fill:#e1ffe1
    style BFF fill:#fff4e1
    style IDP fill:#ffe1e1
```

**Why BFF Pattern?**
- Tokens never exposed to browser JavaScript (more secure)
- Refresh tokens stored server-side only
- CSRF protection via same-origin cookies

**Implementation: Auth0**

```javascript
// Express.js backend (BFF)
const { auth } = require('express-openid-connect');

app.use(auth({
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SESSION_SECRET,
  baseURL: 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: 'https://yoursaas.auth0.com'
}));

// Protected route
app.get('/dashboard', requiresAuth(), (req, res) => {
  const user = req.oidc.user;  // User profile from Auth0
  res.render('dashboard', { user });
});

// React frontend
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(setUser);
  }, []);

  if (!user) return <LoginButton />;
  return <Dashboard user={user} />;
}
```

**Why This Approach:**
- Quick setup (hours)
- Secure (tokens never in browser)
- Works with any frontend framework
- Auth0 handles password resets, email verification, etc.

---

### Scenario 3: Building a Mobile App

**Your Situation:**
- You're building iOS and/or Android apps
- Need native login experience
- Want biometric authentication (Face ID, fingerprint)

#### Recommended Solution: **Auth0** or **Azure AD B2C**

**Why These Over IdentityServer?**
- Native SDKs (Swift, Kotlin, React Native, Flutter)
- Built-in support for system browsers (more secure than WebView)
- Biometric authentication integration
- Refresh token rotation (security best practice)

**Architecture:**

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Browser as System Browser
    participant Auth as Auth0/Azure AD B2C
    participant API as Your API

    App->>Browser: 1. Open OAuth URL (PKCE)
    Browser->>Auth: 2. User enters credentials
    Auth->>Auth: 3. Validate + MFA
    Auth->>Browser: 4. Redirect with code
    Browser->>App: 5. Deep link callback
    App->>Auth: 6. Exchange code for tokens
    Auth->>App: 7. Access + Refresh tokens

    App->>App: 8. Store in secure storage<br/>(Keychain/KeyStore)

    App->>API: 9. API call with access token
    API->>App: 10. Response

    Note over App,Auth: Token expires
    App->>Auth: 11. Refresh token
    Auth->>App: 12. New access token
```

**Implementation: iOS (Swift) with Auth0**

```swift
// Install Auth0 SDK
// pod 'Auth0'

import Auth0

let auth = Auth0.webAuth()

// Login
func login() {
    auth
        .scope("openid profile email")
        .audience("https://api.yoursaas.com")
        .start { result in
            switch result {
            case .success(let credentials):
                // Store in Keychain
                saveCredentials(credentials)
                // Navigate to main app
                showDashboard()
            case .failure(let error):
                print("Login failed: \(error)")
            }
        }
}

// Call API with token
func fetchProjects() {
    guard let accessToken = getAccessToken() else { return }

    var request = URLRequest(url: URL(string: "https://api.yoursaas.com/projects")!)
    request.addValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

    URLSession.shared.dataTask(with: request) { data, response, error in
        // Handle response
    }.resume()
}

// Refresh token automatically
func getAccessToken() -> String? {
    let credentials = loadCredentials()

    if credentials.accessToken.isExpired {
        // Refresh token
        auth.renew(withRefreshToken: credentials.refreshToken) { result in
            // Save new credentials
        }
    }

    return credentials.accessToken
}
```

**Why Auth0/Azure AD B2C for Mobile:**

✅ **Native SDKs**
- Pre-built components for login UI
- Handle token storage automatically
- Refresh token rotation built-in

✅ **Security Best Practices**
- Uses system browser (not WebView) → more secure
- PKCE (Proof Key for Code Exchange) → prevents code interception
- Refresh token rotation → detect token theft

✅ **Biometric Integration**
```swift
// Auth0 + Biometrics
func loginWithBiometrics() {
    let context = LAContext()

    context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                          localizedReason: "Unlock Yoursaas") { success, error in
        if success {
            // User authenticated with Face ID/Touch ID
            // Retrieve stored refresh token from Keychain
            let refreshToken = Keychain.get("refresh_token")
            // Get new access token
            auth.renew(withRefreshToken: refreshToken) { ... }
        }
    }
}
```

✅ **Offline Support**
```swift
// Store user data locally
// Use access token when available, fallback to cached data
func syncData() {
    if isOnline && hasValidToken {
        fetchFromAPI()
    } else {
        loadFromLocalDatabase()
    }
}
```

**Why NOT IdentityServer for Mobile?**
- No official native SDKs (must use third-party libraries)
- More manual work for PKCE, refresh token rotation
- No built-in biometric support
- Better suited for web/API scenarios

---

### Scenario 4: Full-Stack SaaS (API + Web + Mobile)

**Your Situation:**
- Building a complete SaaS platform
- Web app (customer dashboard)
- Mobile apps (iOS + Android)
- Public API (for integrations)
- Admin portal

#### Recommended Solution: **Hybrid Approach**

**Option A: Auth0 for Everything** (easiest)

```
Auth0 as Central Identity Provider:
├─ Web app: express-openid-connect
├─ Mobile apps: Auth0 native SDKs
├─ API: express-oauth2-jwt-bearer
└─ Admin portal: Same Auth0 tenant, different app

Pros:
✓ Single source of truth
✓ Unified user management
✓ Fast setup
✓ Built-in features (MFA, social login, analytics)

Cons:
✗ Per-user costs scale with growth
✗ Vendor lock-in
✗ Less customization
```

**Option B: IdentityServer + Auth0** (best of both)

```
IdentityServer for your users (custom control):
├─ Web app: Custom-branded login
├─ API: Your microservices
└─ Mobile apps: Full control over flows

Auth0 for enterprise SSO (customer organizations):
├─ Customer A uses their ADFS
├─ Customer B uses their Azure AD
└─ Auth0 acts as broker (SAML → OAuth)

Why this works:
✓ Full control over your product's auth
✓ Support enterprise customer SSO requirements
✓ Best of both worlds
```

**Recommended Stack:**

```mermaid
graph TB
    subgraph "Your Users"
        Web[Web App]
        Mobile[Mobile App]
    end

    subgraph "Enterprise Customers"
        CorpA[BigCorp Employees]
        CorpB[TechCo Employees]
    end

    subgraph "Identity Layer"
        IS[IdentityServer<br/>Your users]
        A0[Auth0<br/>Enterprise SSO broker]
    end

    subgraph "Backend"
        API[API Gateway]
        MS[Microservices]
    end

    Web -->|OAuth| IS
    Mobile -->|OAuth| IS

    CorpA -->|SAML| A0
    CorpB -->|Azure AD| A0
    A0 -->|OAuth| API

    IS -->|JWT| API
    API --> MS

    style IS fill:#fff4e1
    style A0 fill:#ffe1e1
    style API fill:#e1ffe1
```

**Implementation:**

```javascript
// API validates tokens from BOTH sources
app.use('/api',
  validateToken({
    issuers: [
      'https://auth.yoursaas.com',      // IdentityServer (your users)
      'https://yoursaas.auth0.com'       // Auth0 (enterprise customers)
    ]
  })
);

// User identification
app.get('/api/projects', (req, res) => {
  const userId = req.user.sub;
  const source = req.user.iss;  // Which issuer?

  if (source.includes('auth0')) {
    // Enterprise customer (might have org ID in claims)
    const orgId = req.user.org_id;
  }

  // ...
});
```

**Cost Comparison (50,000 total users)**

```
Scenario: 45,000 direct users + 5,000 enterprise users

Option A: Auth0 only
- 50,000 users × $0.0175/MAU = $875/month = $10,500/year
Total: $10,500/year

Option B: IdentityServer + Auth0
- IdentityServer license: $1,800/year
- IdentityServer infrastructure: $2,400/year
- Auth0 (5,000 enterprise users): $87.50/month = $1,050/year
Total: $5,250/year (50% savings!)

Winner: Hybrid approach saves $5,250/year
```

---

### Summary: What Should You Choose?

#### For API-Based SaaS

| Your Stack | User Count | Budget | Recommendation |
|------------|------------|--------|----------------|
| .NET | Any | Cost-sensitive | **IdentityServer** |
| .NET | < 10K | Quick launch | **Auth0** |
| Any | > 100K | Cost-sensitive | **Azure AD B2C** |
| Any | < 10K | Quick launch | **Auth0** |
| Any | < 50K | Enterprise features | **Okta** |

#### For Web Applications

| Priority | Recommendation | Why |
|----------|----------------|-----|
| **Speed to market** | Auth0 | Setup in hours, free tier |
| **Custom branding** | IdentityServer | Full UI control |
| **Enterprise customers** | Okta or Azure AD | Built-in SSO support |
| **Budget-friendly** | Auth0 or Azure AD B2C | Free tiers, low cost |
| **Self-hosted, feature-rich** | Keycloak | Admin UI out-of-the-box, 100% free |
| **Non-.NET stack** | Keycloak | No .NET dependency, platform-agnostic |

#### For Mobile Applications

| Platform | Recommendation | Why |
|----------|----------------|-----|
| **iOS/Android** | Auth0 | Best native SDKs |
| **React Native** | Auth0 | Official React Native SDK |
| **Flutter** | Auth0 or Azure AD B2C | Community packages |
| **Consumer app** | Azure AD B2C | Very low cost, social logins |
| **Self-hosted needs** | Keycloak | Official adapters for iOS/Android, cost-free |
| **Enterprise mobile** | Keycloak or Azure AD | SAML support, user federation |

#### For Full-Stack SaaS

| Stage | Recommendation | Why |
|-------|----------------|-----|
| **MVP/Startup** | Auth0 for everything | Fast, easy, free tier |
| **Growing (10K-100K users)** | Keycloak for main + Auth0 for enterprise | Zero licensing cost, feature-rich admin UI |
| **Growing (.NET shop)** | IdentityServer for main + Auth0 for enterprise | Cost savings, full control |
| **Enterprise (100K+ users)** | Keycloak or Azure AD B2C | Zero cost (Keycloak) or lowest per-user cost (Azure) |
| **Enterprise (.NET shop)** | IdentityServer or Azure AD B2C | Full control or lowest cost at scale |

---

### Key Takeaways for SaaS Developers

1. **Start with managed services (Auth0, Azure AD B2C)**
   - Get to market faster
   - Prove product-market fit first
   - Migrate to self-hosted later if needed

2. **Use OAuth 2.0 + OpenID Connect**
   - Industry standard
   - Works for web, mobile, and APIs
   - Easy to integrate with any provider

3. **Don't build your own auth from scratch**
   - Security is hard (password hashing, token generation, CSRF, etc.)
   - OAuth frameworks exist for a reason
   - Focus on your core product

4. **Plan for scale**
   - Auth0: Great for < 10K users
   - Keycloak: Zero cost at any scale, best for non-.NET stacks
   - IdentityServer: Cost-effective for .NET shops at 100K+ users
   - Azure AD B2C: Best for consumer apps at any scale

5. **Consider hybrid approaches**
   - Keycloak/IdentityServer for your users
   - Auth0/Okta for enterprise SSO
   - Best of both worlds (cost control + enterprise features)

---

## Real-World Scenarios

### Scenario 1: Consumer Photo Printing App

**Requirements:**
- Users want to print photos from Google Photos
- App needs temporary access to user's photos
- Users must be able to revoke access easily

**Solution: OAuth 2.0**

```mermaid
graph LR
    A[User] -->|1. Login| B[PrintMyPhotos App]
    B -->|2. Request access| C[Google OAuth]
    C -->|3. Grant access| B
    B -->|4. Fetch photos| D[Google Photos API]
    D -->|5. Photo data| B
    B -->|6. Print| E[Printer]

    style B fill:#fff4e1
    style C fill:#ffe1e1
```

**Why OAuth 2.0?**
- ✅ User never shares Google password with app
- ✅ Scoped access (read photos, not emails)
- ✅ User can revoke from Google account settings
- ✅ Temporary tokens (expire after hours/days)

**Why not ADFS?**
- ❌ No Active Directory involved
- ❌ Not an enterprise scenario
- ❌ Google is the identity provider, not ADFS

### Scenario 2: Corporate Intranet Portal

**Requirements:**
- 10,000 employees need access
- All employees have Windows accounts (Active Directory)
- Access multiple internal apps (HR, timesheets, docs)
- Must support both modern and legacy apps

**Solution: ADFS**

```mermaid
graph TB
    A[Employee] -->|Login once| B[Windows Workstation]
    B -->|Authenticated| C[Active Directory]
    C -->|Identity| D[ADFS Server]

    D -->|SAML| E[SharePoint]
    D -->|WS-Fed| F[Legacy .NET App]
    D -->|OAuth/OIDC| G[Modern React SPA]
    D -->|SAML| H[Salesforce]

    style A fill:#e1f5ff
    style C fill:#ffe1e1
    style D fill:#fff4e1
    style E fill:#e1ffe1
    style F fill:#e1ffe1
    style G fill:#e1ffe1
    style H fill:#e1ffe1
```

**Why ADFS?**
- ✅ Seamless SSO (login to Windows = login to everything)
- ✅ Centralized user management (Active Directory)
- ✅ Supports multiple protocols (SAML, OAuth, WS-Fed)
- ✅ On-premises control (compliance requirement)

**Why not OAuth 2.0 alone?**
- ❌ Legacy apps need SAML/WS-Federation
- ❌ Need claims-based authorization (department, role)
- ❌ Active Directory integration required

### Scenario 3: Modern SaaS Application (Hybrid)

**Requirements:**
- B2B SaaS app serving multiple corporations
- Support "Login with Google" (consumer users)
- Support enterprise SSO (corporate users via ADFS/Azure AD)
- Mobile app + web app

**Solution: OAuth 2.0 + SAML (Multi-tenant identity)**

```mermaid
graph TB
    A[Your SaaS App] --> B{Identity Provider}

    B -->|Consumer users| C[Google OAuth]
    B -->|Consumer users| D[GitHub OAuth]
    B -->|BigCorp employees| E[ADFS<br/>SAML/OAuth]
    B -->|TechCo employees| F[Azure AD<br/>OAuth/OIDC]
    B -->|SmallBiz users| G[Username/Password<br/>Your DB]

    style A fill:#fff4e1
    style B fill:#e1f5ff
    style C fill:#e1ffe1
    style D fill:#e1ffe1
    style E fill:#ffe1e1
    style F fill:#ffe1e1
    style G fill:#e1ffe1
```

**Implementation:**
```javascript
// Your login page
function loginWithProvider(provider) {
  switch(provider) {
    case 'google':
      // OAuth 2.0 flow
      redirectToOAuth('https://accounts.google.com/o/oauth2/v2/auth');
      break;

    case 'github':
      // OAuth 2.0 flow
      redirectToOAuth('https://github.com/login/oauth/authorize');
      break;

    case 'bigcorp':
      // SAML flow to their ADFS
      redirectToSAML('https://adfs.bigcorp.com/saml');
      break;

    case 'techco':
      // OAuth 2.0/OIDC to Azure AD
      redirectToOAuth('https://login.microsoftonline.com/techco.com/oauth2/v2.0/authorize');
      break;

    default:
      // Traditional username/password
      showLoginForm();
  }
}
```

### Scenario 4: Multi-Service SaaS Platform (IdentityServer)

**Requirements:**
- Building a project management SaaS (like Asana, Jira)
- Web app, mobile apps (iOS/Android), public API
- Multiple microservices (projects, tasks, comments, files)
- Custom user database (PostgreSQL)
- Full branding control
- 50,000+ users expected

**Solution: IdentityServer**

```mermaid
graph TB
    subgraph "Your Infrastructure"
        IS[IdentityServer<br/>ASP.NET Core]
        UserDB[(PostgreSQL<br/>User Database)]
    end

    WebApp[Web App<br/>React]
    iOS[iOS App<br/>Swift]
    Android[Android App<br/>Kotlin]
    PublicAPI[Public API<br/>Third-party devs]

    subgraph "Microservices"
        MS1[Projects Service]
        MS2[Tasks Service]
        MS3[Files Service]
        MS4[Notifications Service]
    end

    WebApp -->|1. Login| IS
    iOS -->|2. Login| IS
    Android -->|3. Login| IS
    PublicAPI -->|4. API keys| IS

    IS -->|Validate| UserDB
    IS -->|JWT tokens| WebApp
    IS -->|JWT tokens| iOS
    IS -->|JWT tokens| Android
    IS -->|Access tokens| PublicAPI

    WebApp -->|API calls| MS1
    iOS -->|API calls| MS2
    Android -->|API calls| MS3
    PublicAPI -->|API calls| MS4

    MS1 -.->|Validate JWT| IS
    MS2 -.->|Validate JWT| IS
    MS3 -.->|Validate JWT| IS
    MS4 -.->|Validate JWT| IS

    style IS fill:#fff4e1
    style UserDB fill:#ffe1e1
    style WebApp fill:#e1ffe1
    style iOS fill:#e1ffe1
    style Android fill:#e1ffe1
    style MS1 fill:#e1f5ff
    style MS2 fill:#e1f5ff
    style MS3 fill:#e1f5ff
    style MS4 fill:#e1f5ff
```

**Why IdentityServer?**
- ✅ Single OAuth server for all clients (web, mobile, API)
- ✅ Microservices validate JWTs independently (no central auth calls)
- ✅ Custom user database (PostgreSQL, not Active Directory)
- ✅ Full UI customization (match your brand)
- ✅ Cost-effective at 50K+ users (fixed $1,800/year vs per-user pricing)
- ✅ Support multiple grant types (code, client credentials, refresh tokens)
- ✅ Team has .NET expertise (ASP.NET Core microservices)

**Why not Auth0/Okta?**
- ❌ 50,000 MAU × $0.05 = $2,500/month = $30,000/year (vs $1,800 IdentityServer)
- ❌ Vendor lock-in (hard to migrate later)
- ❌ Limited customization of auth flows
- ❌ User data leaves your infrastructure

**Why not ADFS?**
- ❌ No Active Directory (custom user database)
- ❌ Requires Windows Server (team uses Linux containers)
- ❌ Overkill for SaaS (designed for enterprise SSO)
- ❌ Limited OAuth 2.0 support (primarily SAML-focused)

**Implementation Highlights:**

```csharp
// IdentityServer configuration for this scenario
public static IEnumerable<Client> Clients => new[]
{
    // Web app (SPA)
    new Client
    {
        ClientId = "web-app",
        AllowedGrantTypes = GrantTypes.Code,
        RequirePkce = true,
        RequireClientSecret = false,
        AllowedScopes = { "openid", "profile", "api.projects", "api.tasks", "api.files" },
        AllowOfflineAccess = true
    },

    // Mobile apps
    new Client
    {
        ClientId = "mobile-app",
        AllowedGrantTypes = GrantTypes.Code,
        RequirePkce = true,
        RequireClientSecret = false,
        AllowedScopes = { "openid", "profile", "api.projects", "api.tasks", "offline_access" }
    },

    // Third-party API clients
    new Client
    {
        ClientId = "api-client",
        ClientSecrets = { new Secret("secret".Sha256()) },
        AllowedGrantTypes = GrantTypes.ClientCredentials,
        AllowedScopes = { "api.projects", "api.tasks" },
        Claims = { new ClientClaim("client_type", "third_party") }
    }
};

public static IEnumerable<ApiScope> ApiScopes => new[]
{
    new ApiScope("api.projects", "Projects API"),
    new ApiScope("api.tasks", "Tasks API"),
    new ApiScope("api.files", "Files API"),
    new ApiScope("api.notifications", "Notifications API")
};
```

**Cost Breakdown:**

```
Year 1:
- Duende IdentityServer license: $1,800
- Azure App Service (IdentityServer): $100/month = $1,200
- PostgreSQL database: $50/month = $600
- Development time (setup): 80 hours × $100/hour = $8,000
Total: $11,600

Year 2+:
- License: $1,800
- Infrastructure: $1,800
- Maintenance: ~20 hours/year × $100/hour = $2,000
Total: $5,600/year

Auth0 equivalent:
- 50,000 MAU × $0.05 = $2,500/month = $30,000/year

Break-even: After Year 1, save $24,400/year!
```

---

## Technical Comparison

### Token Validation

#### OAuth 2.0 Token Validation

```javascript
// Backend API validates access token
async function validateOAuthToken(accessToken) {
  // Option 1: Introspection endpoint (ask OAuth server)
  const response = await axios.post('https://oauth.spotify.com/api/token/introspect', {
    token: accessToken
  }, {
    auth: {
      username: CLIENT_ID,
      password: CLIENT_SECRET
    }
  });

  if (!response.data.active) {
    throw new Error('Token expired or revoked');
  }

  return response.data;  // { active: true, scope: '...', exp: ... }

  // Option 2: JWT validation (if token is a JWT)
  const decoded = jwt.verify(accessToken, PUBLIC_KEY, {
    algorithms: ['RS256'],
    issuer: 'https://accounts.spotify.com'
  });

  return decoded;
}
```

#### ADFS SAML Assertion Validation

```javascript
// Web app validates SAML response
async function validateSAMLAssertion(samlResponse) {
  // 1. Decode Base64
  const xml = Buffer.from(samlResponse, 'base64').toString('utf-8');

  // 2. Parse XML
  const doc = parseXML(xml);

  // 3. Validate signature using ADFS public certificate
  const cert = await getADFSCertificate();
  const isValid = validateXMLSignature(doc, cert);

  if (!isValid) {
    throw new Error('Invalid SAML signature');
  }

  // 4. Check assertion conditions
  const notBefore = doc.find('//saml:Conditions/@NotBefore');
  const notOnOrAfter = doc.find('//saml:Conditions/@NotOnOrAfter');
  const now = new Date();

  if (now < notBefore || now >= notOnOrAfter) {
    throw new Error('SAML assertion expired');
  }

  // 5. Extract claims
  const claims = {
    email: doc.find('//saml:Attribute[@Name="email"]/saml:AttributeValue/text()'),
    department: doc.find('//saml:Attribute[@Name="department"]/saml:AttributeValue/text()'),
    groups: doc.findAll('//saml:Attribute[@Name="groups"]/saml:AttributeValue/text()')
  };

  return claims;
}
```

**Complexity comparison:**
- OAuth 2.0 JWT: Simple JSON parsing + signature verification
- SAML: Complex XML parsing + signature verification + namespace handling

### Session Management

#### OAuth 2.0 Session Pattern

```javascript
// Store session after OAuth flow
async function handleOAuthCallback(code) {
  // Exchange code for tokens
  const tokens = await getAccessToken(code);

  // Get user info
  const user = await getUserProfile(tokens.access_token);

  // Create session in your database
  await sessionStore.create(user.id, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
  });

  // Set session cookie
  res.cookie('session_id', user.id, {
    httpOnly: true,
    secure: true,
    maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
  });
}

// Validate session on each request
async function authenticate(req, res, next) {
  const sessionId = req.cookies.session_id;
  const session = await sessionStore.get(sessionId);

  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = session;
  next();
}
```

#### ADFS SAML Session Pattern

```javascript
// Store session after SAML assertion
function handleSAMLResponse(samlResponse) {
  const claims = validateSAMLAssertion(samlResponse);

  // Create session with claims
  req.session.user = {
    email: claims.email,
    department: claims.department,
    groups: claims.groups,
    authenticatedAt: new Date(),
    sessionExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000)  // 8 hours
  };

  // Redirect to app
  res.redirect('/dashboard');
}

// Validate session on each request
function authenticate(req, res, next) {
  if (!req.session.user) {
    // Redirect to ADFS
    return res.redirect('/saml/login');
  }

  if (req.session.user.sessionExpiry < new Date()) {
    // Session expired, re-authenticate
    req.session.destroy();
    return res.redirect('/saml/login');
  }

  // Check authorization based on claims
  if (req.path.startsWith('/admin') && !req.session.user.groups.includes('Admins')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}
```

### Metadata Exchange

#### OAuth 2.0 Discovery

```bash
# OAuth 2.0 uses discovery documents (OpenID Connect)
GET https://accounts.google.com/.well-known/openid-configuration

Response:
{
  "issuer": "https://accounts.google.com",
  "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
  "token_endpoint": "https://oauth2.googleapis.com/token",
  "userinfo_endpoint": "https://openidconnect.googleapis.com/v1/userinfo",
  "jwks_uri": "https://www.googleapis.com/oauth2/v3/certs",
  "scopes_supported": ["openid", "email", "profile"],
  "response_types_supported": ["code", "token", "id_token"],
  ...
}
```

#### ADFS SAML Metadata

```bash
# ADFS publishes SAML metadata XML
GET https://adfs.bigcorp.com/FederationMetadata/2007-06/FederationMetadata.xml

Response:
<?xml version="1.0"?>
<EntityDescriptor entityID="http://adfs.bigcorp.com/adfs/services/trust">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <KeyInfo>
        <X509Data>
          <X509Certificate>MIIDdzCCAl+gAwIBAgIE...</X509Certificate>
        </X509Data>
      </KeyInfo>
    </KeyDescriptor>
    <SingleSignOnService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
      Location="https://adfs.bigcorp.com/adfs/ls/" />
    <SingleLogoutService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
      Location="https://adfs.bigcorp.com/adfs/ls/" />
  </IDPSSODescriptor>
</EntityDescriptor>
```

**Configuration:**
- OAuth: Copy/paste endpoints into config, programmatic discovery
- SAML: Import XML metadata, complex namespace handling

---

## Migration Considerations

### Migrating from ADFS to OAuth 2.0 (Azure AD)

Many organizations are moving from on-premises ADFS to cloud-based Azure AD with OAuth 2.0/OIDC.

```mermaid
graph LR
    A[Current State:<br/>On-Prem ADFS] -->|Migration| B[Future State:<br/>Azure AD]

    A -->|SAML| C[Legacy Apps]
    A -->|WS-Fed| D[Old .NET Apps]

    B -->|SAML| C
    B -->|OAuth 2.0/OIDC| E[Modern Apps]
    B -->|OAuth 2.0| F[Mobile Apps]
    B -->|Microsoft Graph| G[Office 365]

    style A fill:#ffe1e1
    style B fill:#e1ffe1
```

**Migration Steps:**

1. **Assessment Phase**
```javascript
// Inventory current apps
const apps = [
  { name: 'SharePoint', protocol: 'SAML', critical: true },
  { name: 'Legacy HR', protocol: 'WS-Federation', critical: true },
  { name: 'Time Tracker', protocol: 'WS-Federation', critical: false },
  { name: 'New Mobile App', protocol: 'None', critical: false }
];

// Azure AD supports all these protocols
```

2. **Hybrid Configuration**
```
Configure Azure AD to:
- Sync users from on-prem AD (Azure AD Connect)
- Support SAML for legacy apps
- Support OAuth 2.0/OIDC for new apps
- Maintain ADFS for apps that can't migrate yet
```

3. **Gradual Migration**
```
Phase 1: New apps use Azure AD OAuth 2.0
Phase 2: Migrate non-critical apps to Azure AD
Phase 3: Upgrade legacy apps to support OAuth 2.0
Phase 4: Decommission ADFS
```

**Benefits of migrating:**
- ✅ Reduced infrastructure (no on-prem servers)
- ✅ Modern protocols (OAuth 2.0, OIDC)
- ✅ Better mobile support
- ✅ Conditional access policies (MFA, location-based)
- ✅ Microsoft Graph API access

**Challenges:**
- ⚠️ Legacy app compatibility
- ⚠️ Learning curve for developers
- ⚠️ Network connectivity dependency (cloud)
- ⚠️ Compliance concerns (data sovereignty)

### Adding OAuth 2.0 to ADFS-backed Apps

You can use ADFS as an OAuth 2.0 provider!

```javascript
// Before: SAML-only app
app.use('/saml/callback', samlStrategy);

// After: Support both SAML and OAuth 2.0
app.use('/saml/callback', samlStrategy);  // For legacy clients
app.use('/oauth/callback', oauthStrategy);  // For mobile apps

// OAuth strategy pointing to ADFS
const oauthStrategy = new OAuth2Strategy({
  authorizationURL: 'https://adfs.bigcorp.com/adfs/oauth2/authorize',
  tokenURL: 'https://adfs.bigcorp.com/adfs/oauth2/token',
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  callbackURL: 'https://yourapp.com/oauth/callback'
}, (accessToken, refreshToken, profile, done) => {
  // Handle successful authentication
  return done(null, profile);
});
```

**Use case:** Build a mobile app for employees without changing infrastructure.

---

## Summary: Which Should You Choose?

### Choose OAuth 2.0 if...
- ✅ Building consumer apps (social logins)
- ✅ Mobile-first applications
- ✅ API-driven architecture
- ✅ Multiple identity providers
- ✅ Fine-grained permissions (scopes)
- ✅ Startup or SaaS company
- ✅ Modern tech stack

### Choose ADFS if...
- ✅ Enterprise with Active Directory
- ✅ Need SSO for legacy apps
- ✅ On-premises compliance requirements
- ✅ Support multiple protocols (SAML, WS-Fed)
- ✅ Claims-based authorization
- ✅ Federated identity with partners
- ✅ Already invested in Microsoft ecosystem

### Choose IdentityServer if...
- ✅ Building SaaS with custom user management
- ✅ .NET/ASP.NET Core stack
- ✅ Need full control (UI, flows, claims)
- ✅ Data sovereignty requirements
- ✅ Cost-sensitive at scale (> 100K users)
- ✅ Microservices architecture
- ✅ Avoid vendor lock-in

### Choose Multiple (Hybrid) if...
- ✅ B2B SaaS serving enterprises and consumers
- ✅ Migrating from legacy to modern
- ✅ Need flexibility for different client types
- ✅ Supporting acquisitions with different identity systems

---

## Quick Reference

### Decision Tree

```
Need authentication for your app?
│
├─ Consumer app? (social login, third-party access)
│  └─ Use OAuth 2.0 (Google, GitHub, Spotify, etc.)
│
├─ Enterprise Windows environment?
│  ├─ Yes, Active Directory + legacy apps
│  │  └─ Use ADFS
│  └─ No, but need enterprise SSO
│     └─ Use Azure AD or Okta
│
├─ Building your own SaaS?
│  ├─ Small team, quick launch needed?
│  │  └─ Use Auth0/Okta (managed service)
│  ├─ .NET stack, need customization, 100K+ users?
│  │  └─ Use IdentityServer
│  └─ Node.js/Python/Java stack?
│     └─ Use Keycloak or OpenIddict
│
└─ API-to-API communication?
   └─ Use OAuth 2.0 Client Credentials grant
```

### OAuth 2.0 Cheat Sheet

```javascript
// Authorization URL
https://oauth.provider.com/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/callback
  &response_type=code
  &scope=read:profile write:posts
  &state=RANDOM_STRING

// Token Exchange
POST https://oauth.provider.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE_FROM_CALLBACK
&redirect_uri=https://yourapp.com/callback
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET

// Use Token
GET https://api.provider.com/resource
Authorization: Bearer ACCESS_TOKEN
```

### ADFS SAML Cheat Sheet

```xml
<!-- SAML Request -->
<samlp:AuthnRequest
  ID="identifier_1"
  IssueInstant="2025-12-21T12:00:00Z"
  Destination="https://adfs.bigcorp.com/adfs/ls/">
  <saml:Issuer>https://yourapp.com</saml:Issuer>
</samlp:AuthnRequest>

<!-- SAML Response (simplified) -->
<samlp:Response>
  <saml:Assertion>
    <saml:Subject>
      <saml:NameID>john.doe@bigcorp.com</saml:NameID>
    </saml:Subject>
    <saml:AttributeStatement>
      <saml:Attribute Name="email">
        <saml:AttributeValue>john.doe@bigcorp.com</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>
```

### IdentityServer Cheat Sheet

```csharp
// Install
dotnet add package Duende.IdentityServer

// Minimal setup (Program.cs)
builder.Services.AddIdentityServer()
    .AddInMemoryClients(Config.Clients)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddTestUsers(Config.TestUsers)
    .AddDeveloperSigningCredential();

app.UseIdentityServer();

// Define a client (Config.cs)
new Client
{
    ClientId = "spa-client",
    AllowedGrantTypes = GrantTypes.Code,
    RequirePkce = true,
    RequireClientSecret = false,
    RedirectUris = { "http://localhost:3000/callback" },
    AllowedScopes = { "openid", "profile", "api1" }
}

// Authorize endpoint (auto-generated)
GET https://your-identityserver.com/connect/authorize
  ?client_id=spa-client
  &redirect_uri=http://localhost:3000/callback
  &response_type=code
  &scope=openid profile api1
  &code_challenge=xyz...
  &code_challenge_method=S256

// Token endpoint (auto-generated)
POST https://your-identityserver.com/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123...
&redirect_uri=http://localhost:3000/callback
&client_id=spa-client
&code_verifier=xyz...
```

---

## Further Reading

### OAuth 2.0 Resources
- **Official Spec:** [RFC 6749](https://tools.ietf.org/html/rfc6749)
- **OAuth 2.0 Playground:** [https://www.oauth.com/playground/](https://www.oauth.com/playground/)
- **Best Practices:** [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

### ADFS Resources
- **Microsoft Docs:** [ADFS Overview](https://docs.microsoft.com/en-us/windows-server/identity/active-directory-federation-services)
- **SAML 2.0 Spec:** [OASIS SAML 2.0](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- **Azure AD Migration:** [Moving from ADFS to Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/hybrid/migrate-from-federation-to-cloud-authentication)

### IdentityServer Resources
- **Duende IdentityServer Docs:** [https://docs.duendesoftware.com/identityserver/v6](https://docs.duendesoftware.com/identityserver/v6)
- **IdentityServer4 (legacy):** [https://identityserver4.readthedocs.io](https://identityserver4.readthedocs.io)
- **Quick Start Guide:** [Getting Started with IdentityServer](https://docs.duendesoftware.com/identityserver/v6/quickstarts/1_client_credentials/)
- **Community Support:** [IdentityServer GitHub Discussions](https://github.com/DuendeSoftware/IdentityServer/discussions)
- **OpenIddict (free alternative):** [https://github.com/openiddict/openiddict-core](https://github.com/openiddict/openiddict-core)

### Comparison Articles
- **OAuth vs SAML:** [https://www.okta.com/identity-101/saml-vs-oauth/](https://www.okta.com/identity-101/saml-vs-oauth/)
- **When to use SAML vs OAuth:** [Auth0 Blog](https://auth0.com/blog/how-saml-authentication-works/)
- **IdentityServer vs Auth0:** [Comparing Identity Solutions](https://www.red-gate.com/simple-talk/development/dotnet-development/identity-server-or-auth0-for-net-core-identity-management/)

---

## Common Questions & Misconceptions

**Q: Can I use OAuth 2.0 for SSO like ADFS?**
A: Yes! OAuth 2.0 combined with OpenID Connect (OIDC) provides SSO. Many companies use Auth0, Okta, Azure AD, or IdentityServer as OAuth providers for SSO.

**Q: Is SAML dead?**
A: No, but it's declining. Legacy enterprise apps still use SAML heavily. New apps prefer OAuth 2.0/OIDC for better mobile support and simpler implementation.

**Q: Can ADFS and OAuth 2.0 work together?**
A: Absolutely! ADFS can act as an OAuth 2.0 provider (since ADFS 3.0). Your app can support both SAML and OAuth clients simultaneously.

**Q: Which is more secure?**
A: All three are secure when implemented correctly. OAuth 2.0/OIDC is generally simpler (less complexity = fewer bugs), but SAML has been battle-tested in enterprises for decades. IdentityServer implements OAuth/OIDC with certified security.

**Q: Should I build my own OAuth provider from scratch?**
A: Generally no. Use established solutions:
- **Managed services:** Auth0, Okta, Azure AD B2C (zero infrastructure)
- **Self-hosted framework:** IdentityServer, Keycloak, OpenIddict (full control)
- **Never:** Build from scratch (complex, high security risk)

**Q: Is IdentityServer free?**
A: Partially. Duende IdentityServer (current version) has free tier for:
- Development and testing
- Personal projects
- Companies < $1M revenue
- Open-source projects

For commercial use with revenue > $1M, you need a license ($1,800+/year). IdentityServer4 (legacy) was fully free but is no longer maintained.

**Q: IdentityServer vs Auth0 - which should I choose?**
A: It depends:
- **Auth0 if:** Quick launch, small team, < 10K users, want zero infrastructure management
- **IdentityServer if:** .NET stack, > 100K users, need full customization, data sovereignty requirements, avoid per-user costs

**Q: Can I migrate from IdentityServer to Auth0 (or vice versa)?**
A: Yes, both implement OAuth 2.0/OIDC standards, but migration requires:
- Update client configurations (authorization URLs, endpoints)
- Migrate user database
- Update token validation in APIs
- Testing all authentication flows

Standardized protocols make migration easier than proprietary solutions.

**Q: Does IdentityServer work with non-.NET clients?**
A: Yes! IdentityServer is the OAuth/OIDC server (ASP.NET Core), but clients can be:
- JavaScript (React, Vue, Angular)
- Mobile (iOS Swift, Android Kotlin, React Native)
- Python, Java, Go, Ruby (any language with OAuth client library)

**Q: What's the difference between IdentityServer and ASP.NET Core Identity?**
A: They solve different problems:
- **ASP.NET Core Identity:** User management within your app (register, login, password reset) - think "membership system"
- **IdentityServer:** OAuth/OIDC server for issuing tokens to multiple apps - think "identity provider"

They work great together! IdentityServer can use ASP.NET Core Identity as its user store.

**Q: ADFS vs Azure AD - what's the difference?**
A: Azure AD is Microsoft's cloud-based evolution of ADFS:
- **ADFS:** On-premises, Windows Server, SAML-focused
- **Azure AD:** Cloud-based, SaaS, OAuth/OIDC-focused, broader integrations
- Many organizations use both (hybrid) during migration.

**Q: Can I use IdentityServer with MongoDB/PostgreSQL instead of SQL Server?**
A: Yes! IdentityServer supports any data store. You just need to implement the interfaces:
- `IClientStore` - Store client configurations
- `IResourceStore` - Store API scopes/resources
- `IPersistedGrantStore` - Store authorization codes, refresh tokens

Community packages exist for MongoDB, PostgreSQL, etc.
