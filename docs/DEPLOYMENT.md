# Deployment Guide

This guide covers deployment options for the RehabAssist application.

## Prerequisites

- Node.js 18 or higher
- A Supabase account and project
- Domain/hosting service (for production deployment)

## Environment Setup

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a new Supabase project
2. Set up the required database tables (see `docs/DATABASE.md`)
3. Configure Row Level Security (RLS) policies
4. Get your project URL and anon key from the project settings

## Deployment Options

### Option 1: Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

```bash
npm install -g vercel
vercel
```

### Option 2: Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to Netlify
3. Configure environment variables in Netlify dashboard

### Option 3: Self-hosted

1. Build the project:
```bash
npm run build
```

2. Serve the `dist` folder using any static file server:
```bash
npx serve -s dist
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Supabase project set up with proper RLS policies
- [ ] Build completes without errors
- [ ] All tests passing
- [ ] Camera permissions configured for HTTPS
- [ ] Domain/SSL certificate configured
- [ ] CORS settings configured in Supabase

## Performance Considerations

- The app requires camera access (HTTPS required in production)
- MediaPipe models are loaded dynamically (~3MB)
- Consider CDN for faster asset delivery
- Enable gzip compression on your server

## Monitoring

- Monitor Supabase usage and limits
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor bundle size and performance

## Troubleshooting

### Common Issues

1. **Camera not working**: Ensure HTTPS is enabled
2. **MediaPipe loading failures**: Check network connectivity
3. **Supabase errors**: Verify environment variables and RLS policies