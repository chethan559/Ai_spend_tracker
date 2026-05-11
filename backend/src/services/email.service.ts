import { Resend } from 'resend';
import { format, endOfWeek, subWeeks } from 'date-fns';

import { logger } from '../utils/logger';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? 'AI Spend Tracker <alerts@aispendtracker.com>';

// ---------------------------------------------------------------------------
// Shared HTML primitives
// ---------------------------------------------------------------------------

const baseStyles = `
  margin:0;padding:0;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
  background-color:#0f0f0f;
`;

function wrapEmail(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="${baseStyles.trim()}">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#0f0f0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#1a1a1a;border-radius:12px;
                    border:1px solid #2a2a2a;overflow:hidden;">
        ${bodyContent}
        <!-- footer -->
        <tr>
          <td style="padding:12px 40px;background:#111111;">
            <p style="margin:0;font-size:11px;color:#404040;text-align:center;">
              AI Spend Tracker &nbsp;·&nbsp; aispendtracker.com
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function headerRow(label: string, title: string): string {
  return `
  <tr>
    <td style="padding:32px 40px 24px;border-bottom:1px solid #2a2a2a;">
      <p style="margin:0;font-size:12px;color:#6366f1;font-weight:600;
                letter-spacing:0.08em;text-transform:uppercase;">${label}</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#f5f5f5;">
        ${title}
      </h1>
    </td>
  </tr>`;
}

function ctaRow(text: string, url: string): string {
  return `
  <tr>
    <td align="center" style="padding:32px 40px 0;">
      <a href="${url}"
         style="display:inline-block;background:#6366f1;color:#ffffff;
                text-decoration:none;font-size:14px;font-weight:600;
                padding:14px 36px;border-radius:8px;">
        ${text}
      </a>
    </td>
  </tr>`;
}

// ---------------------------------------------------------------------------
// sendBudgetAlert
// ---------------------------------------------------------------------------

export interface BudgetAlertParams {
  userEmail: string;
  userName: string;
  featureName: string;
  currentSpend: number;
  budgetLimit: number;
  percentUsed: number;
  threshold: number;
  dashboardUrl: string;
}

export async function sendBudgetAlert(params: BudgetAlertParams): Promise<void> {
  if (!resend) {
    logger.warn('RESEND_API_KEY not set — skipping budget alert email', {
      userEmail: params.userEmail,
    });
    return;
  }

  const {
    userEmail, featureName, currentSpend, budgetLimit,
    percentUsed, threshold, dashboardUrl,
  } = params;

  const remaining = Math.max(0, budgetLimit - currentSpend);
  const usedColor = percentUsed >= 100 ? '#ef4444' : '#f97316';

  const html = wrapEmail(`
    ${headerRow('AI Spend Tracker', '⚠️ Budget Alert')}
    <tr>
      <td style="padding:32px 40px 0;">
        <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;line-height:1.7;">
          <strong style="color:#f5f5f5;">${featureName}</strong> has used
          <strong style="color:${usedColor};">${percentUsed}%</strong>
          of its $${budgetLimit.toFixed(2)}/month budget.
        </p>

        <!-- stats table -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;">
          <tr style="background:#141414;">
            <td style="padding:13px 20px;font-size:13px;color:#737373;
                        border-bottom:1px solid #2a2a2a;">Current Spend</td>
            <td style="padding:13px 20px;font-size:14px;color:#f5f5f5;font-weight:600;
                        text-align:right;border-bottom:1px solid #2a2a2a;">
              $${currentSpend.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style="padding:13px 20px;font-size:13px;color:#737373;
                        border-bottom:1px solid #2a2a2a;">Budget Limit</td>
            <td style="padding:13px 20px;font-size:14px;color:#f5f5f5;font-weight:600;
                        text-align:right;border-bottom:1px solid #2a2a2a;">
              $${budgetLimit.toFixed(2)}
            </td>
          </tr>
          <tr style="background:#141414;">
            <td style="padding:13px 20px;font-size:13px;color:#737373;
                        border-bottom:1px solid #2a2a2a;">Used</td>
            <td style="padding:13px 20px;font-size:14px;font-weight:700;
                        color:${usedColor};text-align:right;
                        border-bottom:1px solid #2a2a2a;">
              ${percentUsed}%
            </td>
          </tr>
          <tr>
            <td style="padding:13px 20px;font-size:13px;color:#737373;">Remaining</td>
            <td style="padding:13px 20px;font-size:14px;font-weight:600;
                        color:#22c55e;text-align:right;">
              $${remaining.toFixed(2)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${ctaRow('View Dashboard', dashboardUrl)}
    <tr>
      <td style="padding:28px 40px 32px;">
        <p style="margin:0;font-size:12px;color:#525252;line-height:1.7;">
          You're receiving this because you set a budget alert at ${threshold}%.
          <a href="${dashboardUrl}" style="color:#6366f1;text-decoration:none;">
            Manage alerts in your dashboard.
          </a>
        </p>
      </td>
    </tr>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: `⚠️ AI Spend Alert: ${featureName} reached ${percentUsed}% of budget`,
      html,
    });
    logger.info('Budget alert email sent', { userEmail, featureName, percentUsed });
  } catch (error) {
    logger.error('Failed to send budget alert email', error as Error);
  }
}

// ---------------------------------------------------------------------------
// sendWeeklyDigest
// ---------------------------------------------------------------------------

export interface TopFeature {
  name: string;
  cost: number;
  requests: number;
}

export interface WeeklyDigestParams {
  userEmail: string;
  userName: string;
  weeklyTotal: number;
  previousWeekTotal: number;
  topFeatures: TopFeature[];
  biggestSpike: { name: string; percentIncrease: number } | null;
  dashboardUrl: string;
}

export async function sendWeeklyDigest(params: WeeklyDigestParams): Promise<void> {
  if (!resend) {
    logger.warn('RESEND_API_KEY not set — skipping weekly digest email', {
      userEmail: params.userEmail,
    });
    return;
  }

  const {
    userEmail, weeklyTotal, previousWeekTotal,
    topFeatures, biggestSpike, dashboardUrl,
  } = params;

  // Subject date = last Sunday (end of the reported week)
  const lastSunday = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  const dateStr = format(lastSunday, 'MMM d');

  const wowChange = previousWeekTotal > 0
    ? ((weeklyTotal - previousWeekTotal) / previousWeekTotal) * 100
    : null;

  const wowLabel = wowChange === null
    ? '<span style="color:#737373;">no prior data</span>'
    : wowChange >= 0
      ? `<span style="color:#ef4444;">+${wowChange.toFixed(1)}%</span>`
      : `<span style="color:#22c55e;">${wowChange.toFixed(1)}%</span>`;

  const topFeaturesRows = topFeatures
    .map((f, i) => {
      const bg = i % 2 === 0 ? '#141414' : 'transparent';
      return `
        <tr style="background:${bg};">
          <td style="padding:11px 20px;font-size:13px;color:#d4d4d4;
                      border-bottom:1px solid #2a2a2a;">${f.name}</td>
          <td style="padding:11px 20px;font-size:13px;color:#f5f5f5;font-weight:600;
                      text-align:right;border-bottom:1px solid #2a2a2a;">
            $${f.cost.toFixed(4)}
          </td>
          <td style="padding:11px 20px;font-size:13px;color:#737373;
                      text-align:right;border-bottom:1px solid #2a2a2a;">
            ${f.requests.toLocaleString()} req
          </td>
        </tr>`;
    })
    .join('');

  const spikeSection = biggestSpike
    ? `
      <tr>
        <td style="padding:0 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#1f1810;border:1px solid #3d2b0a;
                         border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0;font-size:12px;color:#f97316;font-weight:600;
                            text-transform:uppercase;letter-spacing:0.08em;">
                  📈 Biggest Spike
                </p>
                <p style="margin:6px 0 0;font-size:14px;color:#fcd34d;font-weight:600;">
                  ${biggestSpike.name}
                </p>
                <p style="margin:4px 0 0;font-size:13px;color:#d97706;">
                  +${biggestSpike.percentIncrease}% week-over-week
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const html = wrapEmail(`
    ${headerRow('Weekly Report', `📊 AI Spend — w/e ${dateStr}`)}
    <tr>
      <td style="padding:32px 40px 0;">
        <!-- total spend -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#141414;border:1px solid #2a2a2a;border-radius:8px;
                       overflow:hidden;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0;font-size:12px;color:#737373;text-transform:uppercase;
                          font-weight:600;letter-spacing:0.08em;">Total This Week</p>
              <p style="margin:6px 0 0;font-size:32px;font-weight:700;color:#f5f5f5;">
                $${weeklyTotal.toFixed(2)}
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:#737373;">
                vs last week: ${wowLabel}
                ${previousWeekTotal > 0
                  ? `<span style="color:#525252;"> ($${previousWeekTotal.toFixed(2)})</span>`
                  : ''}
              </p>
            </td>
          </tr>
        </table>

        ${topFeatures.length > 0 ? `
        <!-- top features -->
        <p style="margin:0 0 12px;font-size:13px;color:#737373;font-weight:600;
                    text-transform:uppercase;letter-spacing:0.08em;">Top Models</p>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;
                       margin-bottom:24px;">
          <tr style="background:#0f0f0f;">
            <th style="padding:10px 20px;font-size:11px;color:#525252;font-weight:600;
                        text-align:left;text-transform:uppercase;letter-spacing:0.06em;
                        border-bottom:1px solid #2a2a2a;">Model</th>
            <th style="padding:10px 20px;font-size:11px;color:#525252;font-weight:600;
                        text-align:right;text-transform:uppercase;letter-spacing:0.06em;
                        border-bottom:1px solid #2a2a2a;">Cost</th>
            <th style="padding:10px 20px;font-size:11px;color:#525252;font-weight:600;
                        text-align:right;text-transform:uppercase;letter-spacing:0.06em;
                        border-bottom:1px solid #2a2a2a;">Requests</th>
          </tr>
          ${topFeaturesRows}
        </table>` : ''}
      </td>
    </tr>
    ${spikeSection}
    ${ctaRow('View Full Dashboard', dashboardUrl)}
    <tr><td style="padding:32px 40px 0;"></td></tr>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: `📊 Your AI Spend Report — w/e ${dateStr}`,
      html,
    });
    logger.info('Weekly digest email sent', { userEmail });
  } catch (error) {
    logger.error('Failed to send weekly digest email', error as Error);
  }
}

// ---------------------------------------------------------------------------
// sendWelcomeEmail
// ---------------------------------------------------------------------------

export interface WelcomeEmailParams {
  userEmail: string;
  apiKey: string;
  dashboardUrl: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  if (!resend) {
    logger.warn('RESEND_API_KEY not set — skipping welcome email', {
      userEmail: params.userEmail,
    });
    return;
  }

  const { userEmail, apiKey, dashboardUrl } = params;

  const html = wrapEmail(`
    ${headerRow('AI Spend Tracker', 'Welcome 👋')}
    <tr>
      <td style="padding:32px 40px 0;">
        <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;line-height:1.7;">
          Your account is ready. Here's your API key — keep it secret,
          it authenticates all SDK calls.
        </p>

        <!-- API key box -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;
                       overflow:hidden;margin-bottom:32px;">
          <tr>
            <td style="padding:8px 20px 6px;">
              <p style="margin:0;font-size:11px;color:#525252;font-weight:600;
                          text-transform:uppercase;letter-spacing:0.08em;">Your API Key</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px 16px;">
              <code style="font-family:'Courier New',Courier,monospace;font-size:14px;
                            color:#6366f1;word-break:break-all;">${apiKey}</code>
            </td>
          </tr>
        </table>

        <!-- quickstart -->
        <p style="margin:0 0 16px;font-size:13px;color:#737373;font-weight:600;
                    text-transform:uppercase;letter-spacing:0.08em;">Quickstart</p>

        <!-- step 1 -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="margin-bottom:12px;">
          <tr>
            <td width="32" valign="top">
              <div style="width:24px;height:24px;background:#6366f1;border-radius:50%;
                           text-align:center;line-height:24px;font-size:12px;
                           font-weight:700;color:#fff;">1</div>
            </td>
            <td style="padding-left:12px;">
              <p style="margin:0 0 6px;font-size:13px;color:#a3a3a3;font-weight:600;">
                Install the SDK
              </p>
              <code style="display:block;background:#0a0a0a;border:1px solid #2a2a2a;
                            border-radius:6px;padding:10px 14px;font-family:'Courier New',
                            Courier,monospace;font-size:13px;color:#d4d4d4;">
                npm install @ai-spend/tracker
              </code>
            </td>
          </tr>
        </table>

        <!-- step 2 -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="margin-bottom:12px;">
          <tr>
            <td width="32" valign="top">
              <div style="width:24px;height:24px;background:#6366f1;border-radius:50%;
                           text-align:center;line-height:24px;font-size:12px;
                           font-weight:700;color:#fff;">2</div>
            </td>
            <td style="padding-left:12px;">
              <p style="margin:0 0 6px;font-size:13px;color:#a3a3a3;font-weight:600;">
                Initialize and wrap your AI calls
              </p>
              <code style="display:block;background:#0a0a0a;border:1px solid #2a2a2a;
                            border-radius:6px;padding:10px 14px;font-family:'Courier New',
                            Courier,monospace;font-size:13px;color:#d4d4d4;
                            white-space:pre-wrap;line-height:1.6;">
import { AISpendTracker } from '@ai-spend/tracker'

const tracker = new AISpendTracker('${apiKey}')
tracker.initOpenAI(process.env.OPENAI_API_KEY)

// Use tracker.openai instead of openai:
const response = await tracker.openai.chat({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }]
})
              </code>
            </td>
          </tr>
        </table>

        <!-- step 3 -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="margin-bottom:0;">
          <tr>
            <td width="32" valign="top">
              <div style="width:24px;height:24px;background:#6366f1;border-radius:50%;
                           text-align:center;line-height:24px;font-size:12px;
                           font-weight:700;color:#fff;">3</div>
            </td>
            <td style="padding-left:12px;">
              <p style="margin:0;font-size:13px;color:#a3a3a3;font-weight:600;">
                Watch your spend appear in the dashboard
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${ctaRow('Open Dashboard', dashboardUrl)}
    <tr><td style="padding:32px 40px 0;"></td></tr>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: 'Welcome to AI Spend Tracker — here\'s your API key',
      html,
    });
    logger.info('Welcome email sent', { userEmail });
  } catch (error) {
    logger.error('Failed to send welcome email', error as Error);
  }
}
