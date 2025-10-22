# Contributing to Red Corner Stream Manager

This is a proprietary project for Red Corner's internal use and client deployments.

## Internal Development Guidelines

### Code Style
- Use clear, descriptive variable names
- Comment complex logic
- Follow existing code patterns
- Test thoroughly before committing

### Commit Messages
Format: `[Component] Brief description`

Examples:
- `[Channel] Fix overlay positioning bug`
- `[Dashboard] Add new destination controls`
- `[API] Update overlay endpoints`

### Testing
Before committing:
1. Test all 5 channels
2. Verify overlay system
3. Check destination streaming
4. Test dashboard UI
5. Review server logs for errors

### Branching Strategy
- `main` - Production-ready code
- `dev` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes

### Deployment
1. Test on staging server
2. Create backup of production
3. Deploy during low-traffic period
4. Monitor logs for 24 hours

## Contact

For development questions: brian@redcorner.com.au

---

**Red Corner - Live Sports Production**
