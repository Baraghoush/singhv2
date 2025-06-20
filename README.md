# JSingh Law Clone

This is a React + Tailwind CSS starter site inspired by jsinghlaw.com.

## How to use

1. Run `npm install`
2. Set up environment variables (see Environment Variables section below)
3. Run `npm start`
4. Visit http://localhost:3000/

## Environment Variables

This project uses environment variables to keep sensitive credentials secure. Create a `.env` file in the root directory with the following variables:

```env
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
REACT_APP_GOOGLE_API_KEY=your_google_api_key_here
```

**Important:** 
- The `.env` file is already added to `.gitignore` to prevent committing sensitive data
- Never commit your actual credentials to version control
- Use `env.example` as a template for the required environment variables

## Customization

- Update `src/App.jsx` for content
- Configure your Formspree endpoint in the contact form
- Edit colors, text, or structure as needed
