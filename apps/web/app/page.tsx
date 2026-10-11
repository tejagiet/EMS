import { InstitutionalFooter } from "@/components/ui/InstitutionalHeader";
import { PORTAL_ROLE_DEFINITIONS } from "@ems/config";
import { INSTITUTIONAL_METADATA } from "@ems/ui";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Database,
  FileText,
  GitBranch,
  Layers,
  Lock,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

const featureCards = [
  {
    icon: Users,
    eyebrow: "People & structure",
    title: "One source of truth for employee records",
    description:
      "Keep profiles, employment status, branches, departments, designations, reporting lines, and history organized inside the right tenant.",
    accent: "blue",
  },
  {
    icon: Calendar,
    eyebrow: "Time & leave",
    title: "Make everyday workforce operations clear",
    description:
      "Support shifts, clock-in and clock-out records, attendance review, leave balances, requests, approvals, and calendars.",
    accent: "cyan",
  },
  {
    icon: Briefcase,
    eyebrow: "Talent lifecycle",
    title: "Connect hiring to onboarding",
    description:
      "Move from job openings and candidate pipelines through interviews, offers, onboarding checklists, and structured offboarding.",
    accent: "amber",
  },
  {
    icon: BarChart3,
    eyebrow: "Finance & insight",
    title: "Turn payroll work into an auditable workflow",
    description:
      "Manage salary structures, payroll review stages, payslips, operational reports, and the records that explain each decision.",
    accent: "violet",
  },
  {
    icon: Layers,
    eyebrow: "Assets & documents",
    title: "Keep the work around people connected",
    description:
      "Track IT equipment and allocations alongside verified documents, announcements, tasks, and performance workflows.",
    accent: "emerald",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Control & compliance",
    title: "Give every role the right view",
    description:
      "Use least-privilege permissions, organization boundaries, server-side checks, and a read-only auditor experience to protect the system.",
    accent: "rose",
  },
] as const;

const roleOverview = [
  { role: "super_admin" as const, icon: Building2 },
  { role: "org_admin" as const, icon: Building2 },
  { role: "hr_manager" as const, icon: Users },
  { role: "recruitment_manager" as const, icon: Briefcase },
  { role: "finance_payroll_manager" as const, icon: BarChart3 },
  { role: "manager" as const, icon: Users },
  { role: "dept_head" as const, icon: Layers },
  { role: "it_assets_manager" as const, icon: Database },
  { role: "employee" as const, icon: CheckCircle2 },
  { role: "auditor" as const, icon: Shield },
];

const teamMembers = [
  {
    name: "Teja",
    role: "Team Lead",
    responsibility:
      "Architecture, integration, authentication, RBAC, and the core employee module.",
    accent: "blue",
  },
  {
    name: "Ashok",
    role: "Module Lead",
    responsibility: "Attendance, shift scheduling, leave workflows, and approvals.",
    accent: "cyan",
  },
  {
    name: "Charan",
    role: "Module Lead",
    responsibility: "Payroll processing, reporting, and analytics workflows.",
    accent: "violet",
  },
  {
    name: "Kula Shekhar",
    role: "UI & UX Lead",
    responsibility: "Design system, dashboards, diagrams, and PowerPoint presentation.",
    accent: "amber",
  },
  {
    name: "Jahnavi",
    role: "Module Lead",
    responsibility: "Recruitment, onboarding, and performance management workflows.",
    accent: "emerald",
  },
  {
    name: "Afsar",
    role: "Documentation Lead",
    responsibility: "SRS, database design, API documentation, and the user manual.",
    accent: "rose",
  },
] as const;

export default function HomePage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link className="landing-brand" href="/" aria-label="EMS home">
            <span className="landing-brand-mark" aria-hidden="true" style={{ padding: 0, overflow: "hidden" }}>
              <img
                src="/logo.jpg"
                alt="EMS Logo"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
              />
            </span>
            <span className="landing-brand-copy">
              <strong>EMS</strong>
              <span>Employee Management System</span>
            </span>
          </Link>

          <nav className="landing-nav-links" aria-label="Primary navigation">
            <a href="#capabilities">Platform</a>
            <a href="#portals">Portals</a>
            <a href="#architecture">Architecture</a>
            <Link href="/about">About</Link>
          </nav>

          <Link className="btn btn-primary landing-nav-cta" href="/login">
            Sign in <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">
                <span className="landing-eyebrow-dot" aria-hidden="true" />
                Multi-tenant workforce operations
              </p>
              <h1 id="landing-hero-title">
                Make every <span>employee moment</span> easier to manage.
              </h1>
              <p className="landing-hero-lead">
                EMS brings employee records, attendance, leave, payroll, recruitment, onboarding,
                assets, documents, and reports into one role-aware platform built for secure
                organizational operations.
              </p>
              <div className="landing-hero-actions">
                <Link className="btn btn-primary btn-lg" href="/login">
                  Sign in to EMS <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link className="btn btn-secondary btn-lg" href="/about">
                  Explore project <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
              <div className="landing-hero-assurance">
                <ShieldCheck size={17} aria-hidden="true" />
                <span>Built around Supabase PostgreSQL, RBAC, and row-level security.</span>
              </div>
            </div>

            <div
              className="landing-hero-visual"
              role="img"
              aria-label="Illustration of the EMS operations platform"
            >
              <div className="landing-visual-orbit landing-visual-orbit-one" aria-hidden="true" />
              <div className="landing-visual-orbit landing-visual-orbit-two" aria-hidden="true" />
              <div className="landing-dashboard-preview">
                <div className="landing-preview-topline">
                  <span className="landing-preview-label">EMS / OPERATIONS</span>
                  <span className="landing-preview-status">
                    <span aria-hidden="true" /> Secure workspace
                  </span>
                </div>
                <div className="landing-preview-heading">
                  <div>
                    <p>Workforce control room</p>
                    <h2>Everything connected.</h2>
                  </div>
                  <div className="landing-preview-avatar" aria-hidden="true">
                    T1
                  </div>
                </div>
                <div className="landing-preview-pill-row" aria-label="Platform scope">
                  <span>People</span>
                  <span>Approvals</span>
                  <span>Reports</span>
                </div>
                <div className="landing-preview-board">
                  <div className="landing-preview-board-head">
                    <span>Employee lifecycle</span>
                    <span className="landing-preview-board-note">Role-aware view</span>
                  </div>
                  <div className="landing-preview-flow" aria-hidden="true">
                    <span className="is-active">Records</span>
                    <i />
                    <span>Workflows</span>
                    <i />
                    <span>Insights</span>
                  </div>
                  <div className="landing-preview-bars" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="landing-preview-bottom">
                  <div>
                    <span className="landing-preview-icon landing-preview-icon-blue">
                      <Users size={15} aria-hidden="true" />
                    </span>
                    <span>Organization-scoped</span>
                  </div>
                  <div>
                    <span className="landing-preview-icon landing-preview-icon-amber">
                      <Lock size={15} aria-hidden="true" />
                    </span>
                    <span>Least privilege</span>
                  </div>
                </div>
              </div>
              <div className="landing-floating-card landing-floating-card-top" aria-hidden="true">
                <span className="landing-floating-icon landing-floating-icon-green">
                  <CheckCircle2 size={16} />
                </span>
                <span>
                  <strong>One connected system</strong>
                  <small>For every employee journey</small>
                </span>
              </div>
              <div
                className="landing-floating-card landing-floating-card-bottom"
                aria-hidden="true"
              >
                <span className="landing-floating-icon landing-floating-icon-blue">
                  <Database size={16} />
                </span>
                <span>
                  <strong>PostgreSQL + RLS</strong>
                  <small>Data boundaries by design</small>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-proof-strip" aria-label="Project highlights">
          <div className="landing-container landing-proof-grid">
            <div className="landing-proof-item">
              <strong>10</strong>
              <span>role-based portals</span>
            </div>
            <div className="landing-proof-item">
              <strong>22</strong>
              <span>canonical permissions</span>
            </div>
            <div className="landing-proof-item">
              <strong>3</strong>
              <span>architecture tiers</span>
            </div>
            <div className="landing-proof-item">
              <strong>v1.0.0</strong>
              <span>documented project release</span>
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-capabilities"
          id="capabilities"
          aria-labelledby="capabilities-title"
        >
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-kicker">A complete employee lifecycle view</p>
              <h2 id="capabilities-title">The work around people, in one place.</h2>
              <p>
                EMS is an HR operations foundation for organizations that need reliable records,
                clear approvals, and the right context for every decision.
              </p>
            </div>

            <div className="landing-feature-grid">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article className="landing-feature-card" key={feature.title}>
                    <div className={`landing-feature-icon landing-feature-icon-${feature.accent}`}>
                      <Icon size={21} strokeWidth={2} aria-hidden="true" />
                    </div>
                    <p className="landing-feature-eyebrow">{feature.eyebrow}</p>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-portals"
          id="portals"
          aria-labelledby="portals-title"
        >
          <div className="landing-container landing-role-layout">
            <div className="landing-role-intro">
              <p className="landing-kicker">Role-aware by design</p>
              <h2 id="portals-title">Every portal has a job to do.</h2>
              <p>
                The same organization can support different teams without giving everyone the same
                access. EMS routes each active role to a focused workspace and permission set.
              </p>
              <div className="landing-role-callout">
                <Shield size={18} aria-hidden="true" />
                <span>
                  The auditor portal is read-only, while operational roles see the workflows they
                  are responsible for.
                </span>
              </div>
              <Link className="landing-text-link" href="/about">
                Read the project architecture <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="landing-role-grid">
              {roleOverview.map(({ role, icon: Icon }) => {
                const definition = PORTAL_ROLE_DEFINITIONS[role];
                return (
                  <article className="landing-role-card" key={role}>
                    <div className="landing-role-card-topline">
                      <span className="landing-role-icon">
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      <span className="landing-role-route">{definition.defaultPortalPath}</span>
                    </div>
                    <h3>{definition.name}</h3>
                    <p>{definition.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-architecture"
          id="architecture"
          aria-labelledby="architecture-title"
        >
          <div className="landing-container">
            <div className="landing-section-heading landing-section-heading-wide">
              <p className="landing-kicker">Designed for trust at every layer</p>
              <h2 id="architecture-title">A secure foundation for sensitive operations.</h2>
              <p>
                The documented architecture combines Next.js application delivery with Supabase
                services and PostgreSQL controls, so the platform can stay useful and accountable as
                an organization grows.
              </p>
            </div>

            <div className="landing-architecture-grid">
              <div className="landing-stack-card">
                <div className="landing-stack-label">THREE-TIER ARCHITECTURE</div>
                <div className="landing-stack-tier">
                  <span className="landing-stack-number">01</span>
                  <div>
                    <h3>Presentation & edge</h3>
                    <p>Next.js 15 App Router, React 19, responsive UI, and routing guards.</p>
                  </div>
                </div>
                <div className="landing-stack-connector" aria-hidden="true" />
                <div className="landing-stack-tier">
                  <span className="landing-stack-number">02</span>
                  <div>
                    <h3>Application & workflows</h3>
                    <p>Server Components, Server Actions, validation, and shared @ems packages.</p>
                  </div>
                </div>
                <div className="landing-stack-connector" aria-hidden="true" />
                <div className="landing-stack-tier">
                  <span className="landing-stack-number">03</span>
                  <div>
                    <h3>Data & persistence</h3>
                    <p>Supabase Auth, Storage, and PostgreSQL 15 with transactional triggers.</p>
                  </div>
                </div>
              </div>

              <div className="landing-security-grid">
                <article className="landing-security-card">
                  <span className="landing-security-icon">
                    <Lock size={19} aria-hidden="true" />
                  </span>
                  <h3>Tenant boundaries</h3>
                  <p>
                    Organization-scoped data access is reinforced with PostgreSQL Row-Level Security
                    and membership checks such as <code>is_org_member</code>.
                  </p>
                </article>
                <article className="landing-security-card">
                  <span className="landing-security-icon">
                    <ShieldCheck size={19} aria-hidden="true" />
                  </span>
                  <h3>Least privilege</h3>
                  <p>
                    Ten portal roles, canonical permission codes, server-side verification, and an
                    immutable audit experience keep access purposeful.
                  </p>
                </article>
                <article className="landing-security-card">
                  <span className="landing-security-icon">
                    <FileText size={19} aria-hidden="true" />
                  </span>
                  <h3>Traceable workflows</h3>
                  <p>
                    Prepared statements, Zod validation, secure session cookies, audit history, and
                    CSV formula neutralization are part of the documented safeguards.
                  </p>
                </article>
                <article className="landing-security-card">
                  <span className="landing-security-icon">
                    <Database size={19} aria-hidden="true" />
                  </span>
                  <h3>Honest product surface</h3>
                  <p>
                    Where later schemas are still pending, the current dashboard uses transparent
                    dependency notices instead of fabricated metrics.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-project"
          id="project"
          aria-labelledby="project-title"
        >
          <div className="landing-container landing-project-grid">
            <div className="landing-project-intro">
              <p className="landing-kicker">The project behind the platform</p>
              <h2 id="project-title">Built as an Industrial Training Project at GIET.</h2>
              <p>
                EMS is the work of Team T-1 from the Artificial Intelligence Department at GIET
                Polytechnic College, with a focus on practical enterprise engineering and
                responsible access design.
              </p>
              <Link className="landing-text-link" href="/about">
                Explore the full project brief <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="landing-facts-card">
              <div className="landing-facts-card-heading">
                <span className="landing-facts-mark" aria-hidden="true">
                  <Building2 size={18} />
                </span>
                <div>
                  <p>Institutional identity</p>
                  <h3>{INSTITUTIONAL_METADATA.projectName}</h3>
                </div>
              </div>
              <dl className="landing-facts-list">
                <div>
                  <dt>Institution</dt>
                  <dd>{INSTITUTIONAL_METADATA.institutionName}</dd>
                </div>
                <div>
                  <dt>Department & batch</dt>
                  <dd>
                    {INSTITUTIONAL_METADATA.departmentName} · {INSTITUTIONAL_METADATA.batch}
                  </dd>
                </div>
                <div>
                  <dt>Project & team</dt>
                  <dd>
                    {INSTITUTIONAL_METADATA.projectCategory} · {INSTITUTIONAL_METADATA.team}
                  </dd>
                </div>
                <div>
                  <dt>Publisher ID</dt>
                  <dd>
                    <code>{INSTITUTIONAL_METADATA.publisherId}</code>
                  </dd>
                </div>
              </dl>
              <div className="landing-team-line">
                <Users size={16} aria-hidden="true" />
                <span>
                  Team lead <strong>Teja</strong> · Ashok · Charan · Kula Shekhar · Jahnavi · Afsar
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-team" id="team" aria-labelledby="team-title">
          <div className="landing-container">
            <div className="landing-section-heading landing-section-heading-team">
              <p className="landing-kicker">The people behind EMS</p>
              <h2 id="team-title">Team T-1, building together.</h2>
              <p>
                Every part of the platform is a shared effort—from architecture and security to
                workforce modules, interface design, documentation, testing, and integration.
              </p>
            </div>

            <div className="landing-team-grid">
              {teamMembers.map((member, index) => (
                <article className="landing-member-card" key={member.name}>
                  <div className="landing-member-topline">
                    <span
                      className={`landing-member-avatar landing-member-avatar-${member.accent}`}
                    >
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <span className="landing-member-number">0{index + 1}</span>
                  </div>
                  <h3>{member.name}</h3>
                  <p className="landing-member-role">{member.role}</p>
                  <p className="landing-member-responsibility">{member.responsibility}</p>
                </article>
              ))}
            </div>

            <div className="landing-team-collaboration">
              <GitBranch size={18} aria-hidden="true" />
              <span>
                <strong>Shared responsibility:</strong> all members contribute to integration,
                testing, code review, deployment, and bug fixing.
              </span>
            </div>
          </div>
        </section>

        <section className="landing-final-cta" aria-labelledby="landing-final-title">
          <div className="landing-container landing-final-cta-inner">
            <div>
              <p className="landing-kicker">Ready when you are</p>
              <h2 id="landing-final-title">Bring clarity to every employee workflow.</h2>
              <p>Sign in to enter your authorized EMS portal or read the project story first.</p>
            </div>
            <div className="landing-final-actions">
              <Link className="btn btn-primary btn-lg" href="/login">
                Sign in to EMS <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="btn btn-secondary btn-lg" href="/about">
                About the project
              </Link>
            </div>
          </div>
        </section>
      </main>

      <InstitutionalFooter />
    </div>
  );
}
