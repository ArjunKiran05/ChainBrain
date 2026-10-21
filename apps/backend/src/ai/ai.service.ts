import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { ScanSummary } from '../common/interfaces/ScanSummary';
import { ScanResult } from '../common/interfaces/ScanResult';
import { Recommendation } from '../common/interfaces/Recommendation';
import { AiReport } from '../common/interfaces/AiReport';
import { ChatRequestDto } from './ai.controller';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly omniRouteUrl =
    process.env.OMNIROUTE_URL || 'http://127.0.0.1:20128/v1';

  private readonly aiModel = process.env.AI_MODEL || 'chainbrain-ai';

  /**
   * Authentication/configuration used for all OmniRoute API requests.
   *
   * The API key is read from the backend environment and is never exposed
   * in logs or returned to the frontend.
   */
  private getOmniRouteConfig() {
    const apiKey = process.env.OMNIROUTE_API_KEY;

    if (!apiKey) {
      throw new Error('OMNIROUTE_API_KEY is not configured');
    }

    return {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    };
  }

  async generateReport(data: {
    summary: ScanSummary;
    results: ScanResult[];
    recommendations: Recommendation[];
  }): Promise<AiReport> {
    const { summary, results, recommendations } = data;

    const vulnerablePackages = results
      .filter((pkg) => pkg.vulnerabilities && pkg.vulnerabilities.length > 0)
      .map((pkg) => ({
        package: pkg.package,
        version: pkg.version,
        vulnerabilityCount: pkg.vulnerabilities.length,
        severities: pkg.vulnerabilities.map(
          (v) =>
            v.database_specific?.severity ??
            v.ecosystem_specific?.severity ??
            'UNKNOWN',
        ),
      }));

    const prompt = `
You are ChainBrain AI.
ChainBrain is an enterprise Software Composition Analysis (SCA) platform similar to Snyk, GitHub Advanced Security and Mend.
You are acting as a Senior Principal Application Security Engineer preparing a dependency security assessment for engineering leadership before production deployment.

=========================================================
IMPORTANT
=========================================================
All numerical metrics below have ALREADY been calculated by the ChainBrain Risk Engine.
These metrics are authoritative.
DO NOT recalculate them.
DO NOT reinterpret them.
DO NOT invent additional metrics.
Your responsibility is to explain the findings and provide professional guidance.

=========================================================
PROJECT SUMMARY
=========================================================
Security Score: ${summary.securityScore}/100
Risk Score: ${summary.riskScore}/100
Risk Level: ${summary.riskLevel}
Packages Scanned: ${summary.totalPackages}
Secure Packages: ${summary.securePackages}
Vulnerable Packages: ${summary.vulnerablePackages}
Total Vulnerabilities: ${summary.totalVulnerabilities}

Severity Distribution:
Critical : ${summary.severityCounts?.critical ?? 0}
High : ${summary.severityCounts?.high ?? 0}
Medium : ${summary.severityCounts?.medium ?? 0}
Low : ${summary.severityCounts?.low ?? 0}

=========================================================
VULNERABLE PACKAGES
=========================================================
${JSON.stringify(vulnerablePackages, null, 2)}

=========================================================
TOP RECOMMENDED ACTIONS
=========================================================
${JSON.stringify(recommendations, null, 2)}

=========================================================
YOUR TASK
=========================================================
Produce a concise professional dependency security assessment.
Use ONLY the information supplied above.
Never invent package names.
Never invent vulnerability counts.
Never invent severities.
Never contradict the supplied Risk Engine metrics.
Keep the language suitable for a professional engineering dashboard.

=========================================================
RETURN FORMAT
=========================================================
Return ONLY valid JSON.
No markdown.
No explanations.
No code fences.

Return EXACTLY this schema:

{
  "overallAssessment": "...",
  "deploymentRecommendation": "SAFE | CAUTION | BLOCK",
  "keyFindings": ["...", "...", "..."],
  "recommendations": ["...", "...", "..."],
  "priorityPackages": [
    {
      "package": "...",
      "severity": "...",
      "reason": "..."
    }
  ],
  "conclusion": "..."
}
`;

    try {
      const response = await axios.post(
        `${this.omniRouteUrl}/chat/completions`,
        {
          model: this.aiModel,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: {
            type: 'json_object',
          },
        },
        this.getOmniRouteConfig(),
      );

      const text = response.data?.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('OmniRoute returned an empty response');
      }

      return JSON.parse(text) as AiReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      this.logger.warn(
        `OmniRoute report generation failed or unavailable: ${errorMessage}. Using fallback engine.`,
      );

      return this.generateFallbackReport(summary, results, recommendations);
    }
  }

  async chat(dto: ChatRequestDto): Promise<string> {
    const { message, history = [], context } = dto;

    if (!context || !context.results) {
      return this.chatWithoutContext(message, history);
    }

    const { summary, results, recommendations, projectName } = context;

    const vulnerablePackages = results.filter(
      (r) => r.vulnerabilities?.length > 0,
    );

    const contextPrompt = `
You are ChainBrain AI Assistant, an expert application security engineer and dependency vulnerability advisor.

You are helping a developer inspect and remediate vulnerabilities in their project:
"${projectName || 'Scanned Project'}".

================ PROJECT SCAN CONTEXT ================
- Security Score: ${summary?.securityScore ?? 'N/A'}/100
- Risk Level: ${summary?.riskLevel ?? 'N/A'} (Risk Score: ${
      summary?.riskScore ?? 'N/A'
    }/100)
- Total Dependencies: ${summary?.totalPackages ?? results.length}
- Vulnerable Packages: ${
      summary?.vulnerablePackages ?? vulnerablePackages.length
    }
- Total CVEs/Vulnerabilities: ${summary?.totalVulnerabilities ?? 0}
- Severity Breakdown:
  Critical (${summary?.severityCounts?.critical ?? 0}),
  High (${summary?.severityCounts?.high ?? 0}),
  Medium (${summary?.severityCounts?.medium ?? 0}),
  Low (${summary?.severityCounts?.low ?? 0})

Top Vulnerable Packages:
${
  vulnerablePackages
    .slice(0, 10)
    .map(
      (p) =>
        `- ${p.package}@${p.version}: ${p.vulnerabilities.length} vulnerabilities (${p.vulnerabilities
          .map(
            (v) =>
              v.id ||
              v.database_specific?.severity ||
              v.ecosystem_specific?.severity ||
              'UNKNOWN',
          )
          .join(', ')})`,
    )
    .join('\n') || 'None (Clean project)'
}

Recommended Actions:
${
  (recommendations || [])
    .slice(0, 5)
    .map(
      (rec) =>
        `- Upgrade ${rec.package} (${rec.version}): ${rec.fix} [Severity: ${rec.severity}] - Reason: ${rec.reason}`,
    )
    .join('\n') || 'No immediate fixes needed.'
}

================ INSTRUCTIONS ================
1. Answer the user's question clearly, concisely, and practically with security engineering expertise.
2. Provide exact bash commands (e.g. \`npm install <pkg>@latest\` or \`npm audit fix\`) whenever suggesting package upgrades or patches.
3. Be precise with CVE references and severities found in this project.
4. Format your response cleanly using GitHub-flavored Markdown (bolding, bullet points, code blocks).
`;

    const conversationPrompt = [
      contextPrompt,
      ...history.map(
        (h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`,
      ),
      `User: ${message}`,
      'Assistant:',
    ].join('\n\n');

    try {
      const response = await axios.post(
        `${this.omniRouteUrl}/chat/completions`,
        {
          model: this.aiModel,
          messages: [
            {
              role: 'user',
              content: conversationPrompt,
            },
          ],
        },
        this.getOmniRouteConfig(),
      );

      const text = response.data?.choices?.[0]?.message?.content;

      if (text) {
        return text.trim();
      }

      throw new Error('OmniRoute returned an empty response');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      this.logger.warn(
        `OmniRoute chat failed or unavailable: ${errorMessage}. Using heuristic fallback.`,
      );
    }

    return this.generateHeuristicChatReply(message, context);
  }

  private chatWithoutContext(
    message: string,
    history: Array<{ role: string; content: string }> = [],
  ): string {
    const lower = message.toLowerCase();

    if (
      lower.includes('hello') ||
      lower.includes('hi') ||
      lower.includes('help')
    ) {
      return `👋 **Hello! I'm ChainBrain AI Security Assistant.**

Upload a project ZIP to let me analyze your dependencies and help you detect CVEs, review risk levels, and guide you through secure upgrades.`;
    }

    if (history.length > 0 && lower.includes('thank')) {
      return `You're welcome! Let me know if you need any more dependency security or vulnerability analysis.`;
    }

    return `Please scan or upload a project first so I can provide customized security remediation advice and analyze your specific dependency tree.`;
  }

  private generateHeuristicChatReply(
    message: string,
    context: ChatRequestDto['context'],
  ): string {
    const lower = message.toLowerCase();

    const {
      summary,
      results = [],
      recommendations = [],
      projectName,
    } = context || {};

    const vulnerable = results.filter((r) => r.vulnerabilities?.length > 0);

    // 1. Is it safe to deploy?
    if (
      lower.includes('deploy') ||
      lower.includes('safe') ||
      lower.includes('production') ||
      lower.includes('release')
    ) {
      const isBlock =
        summary?.riskLevel === 'CRITICAL' || summary?.riskLevel === 'HIGH';

      const status = isBlock
        ? '🚨 **Deployment Block Recommended**'
        : summary?.riskLevel === 'MEDIUM'
          ? '⚠️ **Caution Recommended**'
          : '✅ **Safe to Deploy**';

      return `${status}

**Project Security Posture:**
- **Security Score:** \`${summary?.securityScore ?? 0}/100\`
- **Risk Level:** **${summary?.riskLevel ?? 'UNKNOWN'}**
- **Vulnerabilities:** ${
        summary?.totalVulnerabilities ?? 0
      } found across ${vulnerable.length} packages (${
        summary?.severityCounts?.critical ?? 0
      } Critical, ${summary?.severityCounts?.high ?? 0} High).

${
  isBlock
    ? `### Why deployment should be held:
You have **${
        (summary?.severityCounts?.critical ?? 0) +
        (summary?.severityCounts?.high ?? 0)
      }** high/critical vulnerabilities. Exploits in these dependencies could compromise runtime integrity or expose user data.

### Immediate Action Plan:
\`\`\`bash
# Apply prioritized fixes
${
  recommendations
    .slice(0, 3)
    .map((r) => `npm install ${r.package}@latest`)
    .join('\n') || 'npm audit fix'
}
\`\`\`
`
    : `Your dependency risk profile is within acceptable boundaries. Continue monitoring for newly disclosed CVEs.`
}`;
    }

    // 2. Explain top critical/high vulnerabilities
    if (
      lower.includes('critical') ||
      lower.includes('top') ||
      lower.includes('cve') ||
      lower.includes('explain') ||
      lower.includes('vulnerabilit')
    ) {
      if (vulnerable.length === 0) {
        return `🎉 **Great news!** No known vulnerable packages were detected in **${
          projectName || 'your project'
        }**. Your dependency tree scored **${
          summary?.securityScore ?? 100
        }/100**.`;
      }

      const topPkgs = vulnerable.slice(0, 4);

      let reply = `### 🔍 Analysis of Detected Vulnerabilities in **${
        projectName || 'this project'
      }**\n\n`;

      reply += `We detected **${
        summary?.totalVulnerabilities ?? 0
      }** total vulnerabilities across **${
        vulnerable.length
      }** dependencies.\n\n`;

      topPkgs.forEach((pkg, index) => {
        const severities = pkg.vulnerabilities
          .map(
            (v) =>
              v.database_specific?.severity ||
              v.ecosystem_specific?.severity ||
              'UNKNOWN',
          )
          .join(', ');

        const ids = pkg.vulnerabilities
          .map((v) => v.id)
          .filter(Boolean)
          .slice(0, 2)
          .join(', ');

        reply += `**${index + 1}. \`${pkg.package}@${pkg.version}\`**\n`;
        reply += `- **Severity:** \`${severities}\`\n`;

        if (ids) {
          reply += `- **Advisory IDs:** ${ids}\n`;
        }

        reply += `- **Recommendation:** Upgrade to a patched release using \`npm install ${pkg.package}@latest\`\n\n`;
      });

      return reply;
    }

    // 3. How to fix / remediation / upgrade commands
    if (
      lower.includes('fix') ||
      lower.includes('upgrade') ||
      lower.includes('patch') ||
      lower.includes('command') ||
      lower.includes('remediat')
    ) {
      if (recommendations.length === 0) {
        return `✅ **All dependencies are currently up-to-date and have no known security advisories!**`;
      }

      return `### 🛠️ Recommended Remediation Steps

Here are the prioritized commands to resolve the highest risk vulnerabilities in **${
        projectName || 'your project'
      }**:

\`\`\`bash
# 1. Update critical and high risk packages
${recommendations
  .map((r) => `npm install ${r.package}@latest  # ${r.fix}`)
  .join('\n')}

# 2. Run automated audit remediation
npm audit fix
\`\`\`

> 💡 **Tip:** Always run your test suite (\`npm test\`) after updating packages to ensure no breaking API changes were introduced.`;
    }

    // 4. Specific package query
    const matchedPkg = results.find((r) =>
      lower.includes(r.package.toLowerCase()),
    );

    if (matchedPkg) {
      if (
        !matchedPkg.vulnerabilities ||
        matchedPkg.vulnerabilities.length === 0
      ) {
        return `📦 **Package: \`${matchedPkg.package}@${matchedPkg.version}\`**

Status: ✅ **Secure** - No known vulnerabilities were reported for this package version.`;
      }

      return `📦 **Security Report for \`${matchedPkg.package}@${matchedPkg.version}\`**

- **Vulnerabilities Count:** ${matchedPkg.vulnerabilities.length}
- **Advisories:** ${matchedPkg.vulnerabilities
        .map(
          (v) =>
            `\`${v.id || 'Advisory'}\` (${
              v.database_specific?.severity ||
              v.ecosystem_specific?.severity ||
              'Severity N/A'
            })`,
        )
        .join(', ')}

**Recommended Action:**
\`\`\`bash
npm install ${matchedPkg.package}@latest
\`\`\`

Verify breaking changes in the package release notes before deploying.`;
    }

    // Generic helpful overview
    return `### 🧠 Security Summary for **${projectName || 'Current Project'}**

- **Overall Health Score:** **${
      summary?.securityScore ?? 'N/A'
    }/100** (Risk Level: \`${summary?.riskLevel ?? 'N/A'}\`)
- **Total Packages:** ${summary?.totalPackages ?? results.length}
- **Vulnerable Packages:** ${summary?.vulnerablePackages ?? vulnerable.length}

**Suggested Questions you can ask:**
- *"Is this project safe to deploy to production?"*
- *"Show me the commands to fix critical vulnerabilities"*
- *"Explain the vulnerabilities in top packages"*
- *"Give me a step-by-step remediation roadmap"*`;
  }

  private generateFallbackReport(
    summary: ScanSummary,
    results: ScanResult[],
    recommendations: Recommendation[],
  ): AiReport {
    const vulnerable = results.filter(
      (pkg) => pkg.vulnerabilities && pkg.vulnerabilities.length > 0,
    );

    const criticalCount = summary.severityCounts?.critical ?? 0;

    const highCount = summary.severityCounts?.high ?? 0;

    let deployRec: 'SAFE' | 'CAUTION' | 'BLOCK' = 'SAFE';

    if (
      criticalCount > 0 ||
      highCount > 0 ||
      summary.riskLevel === 'CRITICAL' ||
      summary.riskLevel === 'HIGH'
    ) {
      deployRec = 'BLOCK';
    } else if (summary.riskLevel === 'MEDIUM') {
      deployRec = 'CAUTION';
    }

    return {
      overallAssessment: `The scanned project has a Security Score of ${summary.securityScore}/100 with an overall ${summary.riskLevel} risk rating across ${summary.totalPackages} total dependencies.`,

      deploymentRecommendation: deployRec,

      keyFindings: [
        `Identified ${summary.vulnerablePackages} vulnerable package(s) containing ${summary.totalVulnerabilities} total known vulnerabilities.`,

        `Severity distribution: ${criticalCount} Critical, ${highCount} High, ${
          summary.severityCounts?.medium ?? 0
        } Medium, ${summary.severityCounts?.low ?? 0} Low advisories.`,

        vulnerable.length > 0
          ? `Highest risk exposure stems from ${vulnerable
              .slice(0, 2)
              .map((v) => v.package)
              .join(' and ')}.`
          : `All scanned packages currently meet baseline vulnerability hygiene standards.`,
      ],

      recommendations:
        recommendations.length > 0
          ? recommendations
              .slice(0, 3)
              .map(
                (r) =>
                  `Upgrade ${r.package}@${r.version} to patched version (${r.fix})`,
              )
          : [
              'Maintain continuous dependency scanning during CI/CD builds.',
              'Keep lockfiles pinned and automated dependency updates enabled.',
              'Regularly audit newly added third-party packages.',
            ],

      priorityPackages: recommendations.slice(0, 5).map((r) => ({
        package: r.package,
        severity: r.severity,
        reason:
          r.reason ||
          `Vulnerability detected in installed version ${r.version}.`,
      })),

      conclusion:
        'Review critical CVEs and upgrade identified vulnerable dependencies before promoting to production environments.',
    };
  }
}
