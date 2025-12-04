# Post-Launch Monitoring Guide

This guide covers monitoring, optimization, and maintenance tasks after launching Confession Tip.

---

## 1. Error Monitoring (Sentry)

### Setup
Sentry is already configured in the project. After deployment:

1. Go to [sentry.io](https://sentry.io) and create a project
2. Add `SENTRY_DSN` to Vercel environment variables
3. Redeploy

### Key Alerts to Configure

| Alert | Condition | Action |
|-------|-----------|--------|
| High Error Rate | > 5% of requests | Investigate immediately |
| New Error Type | First occurrence | Review and categorize |
| Transaction Failures | Any blockchain error | Check wallet/network |
| Database Errors | Connection failures | Check Supabase status |

### Dashboard Views
- **Issues**: Group and prioritize errors
- **Performance**: Track slow transactions
- **Releases**: Compare error rates between deployments

---

## 2. Key Metrics to Track

### User Engagement
| Metric | Target | How to Track |
|--------|--------|--------------|
| DAU (Daily Active Users) | Growing | Supabase: unique users per day |
| Confession Count | 10+ per day | `/api/stats` endpoint |
| Tip Volume | Growing | Sum of tips per day |
| Retention Rate | > 20% D7 | Users returning after 7 days |

### Performance
| Metric | Target | How to Track |
|--------|--------|--------------|
| Page Load Time | < 2s | Vercel Analytics |
| API Response Time | < 500ms | Vercel Analytics |
| Error Rate | < 1% | Sentry |
| Uptime | > 99.9% | UptimeRobot |

### Blockchain
| Metric | Target | How to Track |
|--------|--------|--------------|
| Transaction Success Rate | > 95% | Sentry + logs |
| Average Tip Amount | Track trend | Database query |
| Gas Sponsorship Usage | Monitor | CDP Dashboard |

---

## 3. Database Monitoring

### Supabase Dashboard
- **Database Health**: CPU, memory, connections
- **Query Performance**: Slow query log
- **Storage**: Database size growth
- **Realtime**: Active connections

### Key Queries to Monitor

```sql
-- Daily confession count
SELECT DATE(created_at), COUNT(*) 
FROM confessions 
WHERE deleted_at IS NULL 
GROUP BY DATE(created_at) 
ORDER BY DATE(created_at) DESC 
LIMIT 30;

-- Daily tip volume
SELECT DATE(created_at), SUM(amount), COUNT(*) 
FROM tips 
GROUP BY DATE(created_at) 
ORDER BY DATE(created_at) DESC 
LIMIT 30;

-- Top tipped confessions (last 7 days)
SELECT id, text, total_tips, tip_count 
FROM confessions 
WHERE created_at > NOW() - INTERVAL '7 days' 
  AND deleted_at IS NULL 
ORDER BY total_tips DESC 
LIMIT 10;

-- User growth
SELECT DATE(created_at), COUNT(*) 
FROM users 
GROUP BY DATE(created_at) 
ORDER BY DATE(created_at) DESC 
LIMIT 30;

-- Slow queries (if pg_stat_statements enabled)
SELECT query, calls, mean_time, total_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Index Optimization
If queries are slow, consider adding indexes:

```sql
-- Already created in migrations, but verify:
CREATE INDEX IF NOT EXISTS idx_confessions_created_at 
ON confessions(created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_confessions_category 
ON confessions(category) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_confessions_total_tips 
ON confessions(total_tips DESC) WHERE deleted_at IS NULL;
```

---

## 4. Performance Optimization

### If Page Load is Slow
1. Check Vercel Analytics for slow pages
2. Review bundle size in build output
3. Consider lazy loading heavy components
4. Optimize images with Next.js Image

### If API is Slow
1. Check Supabase query performance
2. Add database indexes
3. Implement caching (already configured)
4. Consider edge functions for global users

### If Real-time is Laggy
1. Check Supabase Realtime connections
2. Reduce subscription scope
3. Implement debouncing on client

---

## 5. Base Reward Program

### Eligibility Requirements
- Active users (DAU)
- Transaction volume
- User retention
- App quality score

### Metrics Export
The `/api/stats` endpoint provides metrics compatible with Base requirements:

```json
{
  "totalConfessions": 1234,
  "totalTips": 567,
  "totalTipVolume": "1234.56",
  "totalUsers": 890,
  "activeUsers24h": 45
}
```

### Monitoring Dashboard
Track your eligibility at [base.org/build](https://base.org/build)

---

## 6. User Feedback Collection

### In-App Feedback
Consider adding:
- Feedback button in profile
- Rating prompt after first tip
- Bug report form

### External Channels
- Farcaster mentions (@confessiontip)
- Discord server (if created)
- Email support

### Feedback Categories
| Category | Priority | Action |
|----------|----------|--------|
| Bug Report | High | Fix immediately |
| Feature Request | Medium | Add to backlog |
| UX Issue | Medium | Investigate |
| Praise | Low | Share with team |

---

## 7. Security Monitoring

### Watch For
- Unusual tip patterns (potential abuse)
- High rate limit hits (potential attack)
- Failed authentication attempts
- Suspicious wallet addresses

### Rate Limit Monitoring
Check rate limit hits in logs:
```
grep "Rate limit exceeded" /var/log/app.log
```

### Wallet Blocklist
If needed, maintain a blocklist:
```typescript
const BLOCKED_WALLETS = [
  "0x...", // Reason: spam
];
```

---

## 8. Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | App down, data loss | Immediate |
| P1 | Major feature broken | < 1 hour |
| P2 | Minor feature broken | < 4 hours |
| P3 | Cosmetic issue | Next release |

### Rollback Procedure
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Verify app is working
5. Investigate root cause

### Communication
- Update status page (if exists)
- Post on Farcaster if major outage
- Email affected users if data issue

---

## 9. Weekly Review Checklist

- [ ] Check error rates in Sentry
- [ ] Review key metrics (DAU, tips, confessions)
- [ ] Check database performance
- [ ] Review user feedback
- [ ] Check Base reward eligibility
- [ ] Plan improvements for next week

---

## 10. Monthly Tasks

- [ ] Review and archive old errors
- [ ] Optimize slow queries
- [ ] Update dependencies
- [ ] Security audit
- [ ] Backup verification
- [ ] Cost review (Vercel, Supabase, OpenAI)

---

## Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Sentry Dashboard**: https://sentry.io
- **Base Builder**: https://base.org/build
- **CDP Dashboard**: https://portal.cdp.coinbase.com
- **OpenAI Usage**: https://platform.openai.com/usage
