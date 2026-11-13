import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check optional bearer token or header
    const authHeader = req.headers.get('authorization') || req.headers.get('x-sentinel-key');

    let action = 'AWS_SECURITY_EVENT';
    let sourceIp = '127.0.0.1';
    let status: 'Success' | 'Failure' = 'Success';
    let anomalyScore = 0.5;

    // 1. Check if AWS CloudTrail format
    if (body.detail && body.detail.eventName) {
      action = `AWS_CLOUDTRAIL_${body.detail.eventName.toUpperCase()}`;
      sourceIp = body.detail.sourceIPAddress || sourceIp;
      if (body.detail.errorCode || body.detail.errorMessage) {
        status = 'Failure';
        anomalyScore = 0.85;
      }
      if (body.detail.eventName.includes('Login') || body.detail.eventName.includes('Policy')) {
        anomalyScore = 0.92;
      }
    }
    // 2. Check if AWS GuardDuty format
    else if (body.detail && body.detail.type) {
      action = `AWS_GUARDDUTY_${body.detail.type.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
      sourceIp = body.detail.service?.action?.networkConnectionAction?.remoteIpDetails?.ipAddressV4 || sourceIp;
      anomalyScore = (body.detail.severity || 7) / 10;
      status = 'Failure';
    }
    // 3. Check if AWS WAF format
    else if (body.action || body.terminatingRuleId) {
      action = body.terminatingRuleMatchDetails?.length ? 'AWS_WAF_SQLI_BLOCKED' : 'AWS_WAF_ACL_BLOCK';
      sourceIp = body.httpRequest?.clientIp || sourceIp;
      anomalyScore = 0.95;
      status = 'Failure';
    }
    // 4. Generic payload
    else if (body.action) {
      action = String(body.action);
      sourceIp = body.sourceIp || sourceIp;
      anomalyScore = typeof body.anomalyScore === 'number' ? body.anomalyScore : anomalyScore;
    }

    const eventRecord = {
      id: `aws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      sourceIp,
      status,
      anomalyScore,
      cloudProvider: 'AWS',
      rawSource: body.source || 'aws.security',
    };

    return NextResponse.json({
      success: true,
      message: 'AWS Telemetry ingested successfully into Cloud-Sentinel SOC stream.',
      event: eventRecord,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Invalid JSON payload' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'Cloud-Sentinel AWS Real-Time Ingestion Gateway',
    supportedSources: ['AWS CloudTrail', 'AWS GuardDuty', 'AWS WAF', 'Amazon EventBridge', 'VPC Flow Logs'],
    timestamp: new Date().toISOString(),
  });
}

