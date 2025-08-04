# Sanavia Website

> A modern, interactive healthcare technology website built with Next.js, Prismic CMS, and advanced animations.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prismic](https://img.shields.io/badge/Prismic-CMS-5163BA?logo=prismic)](https://prismic.io/)

## 🚀 Overview

The Sanavia website is a cutting-edge web application showcasing healthcare technology solutions through interactive visualizations, physics-based animations, and dynamic content management. Built with modern web technologies, it delivers an engaging user experience while maintaining high performance and accessibility standards.

## ✨ Key Features

- **🎯 Interactive Physics Simulations** - Matter.js powered grid visualizations with real-time particle effects
- **🎨 Advanced Animations** - GSAP-powered scroll animations, intersection observers, and smooth transitions
- **📱 Responsive Design** - Optimized for all devices with adaptive layouts and touch interactions
- **⚡ Dynamic Content** - Prismic CMS integration with custom slice components
- **🎪 Rich Media Support** - Video components, image sliders, and interactive carousels
- **🎉 Celebration Effects** - Confetti animations and ripple effects for user engagement
- **🔧 Modern Architecture** - TypeScript, ESLint, Prettier for maintainable code

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.1.6** - React framework with App Router
- **React 19.0.0** - UI library with latest features
- **TypeScript 5.7.3** - Type-safe development

### Styling & UI
- **Tailwind CSS 4.1.3** - Utility-first CSS framework
- **PostCSS** - CSS processing and optimization

### Animation & Interactions
- **GSAP 3.12.7** - Professional animation library
- **Matter.js 0.20.0** - 2D physics engine for interactive elements
- **Splide.js 4.1.4** - Touch-friendly slider component

### Content Management
- **Prismic CMS** - Headless content management
  - `@prismicio/client` - API client
  - `@prismicio/react` - React components
  - `@prismicio/next` - Next.js integration

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting
- **Slice Machine** - Visual slice development
- **Concurrently** - Parallel script execution

## 📁 Project Structure

```
sanavia-website/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── [uid]/             # Dynamic page routes
│   │   ├── api/               # API endpoints (preview, revalidate)
│   │   ├── slice-simulator/   # Development slice preview
│   │   └── ...
│   ├── components/            # Reusable UI components
│   │   ├── Background.tsx     # Background component
│   │   ├── Header.tsx         # Navigation header
│   │   ├── Slider.tsx         # Media slider
│   │   ├── Modal.tsx          # Modal dialogs
│   │   └── ...
│   ├── slices/               # Prismic slice components
│   │   ├── Grid/             # Interactive physics grid
│   │   ├── PopText/          # Animated text sections
│   │   ├── Video/            # Video components
│   │   ├── Team/             # Team member displays
│   │   └── ...
│   ├── utils/                # Utility functions
│   │   ├── animations/       # Animation helpers
│   │   └── hooks/           # Custom React hooks
│   └── types/               # TypeScript definitions
├── customtypes/             # Prismic custom type definitions
├── public/                  # Static assets
└── ...
```

## 🎨 Component Architecture

### Interactive Slices
- **Grid** - Physics-based particle visualization with Matter.js
- **PopText** - Multi-layout text components with animations
- **Video/PopVideo** - Responsive video players with controls
- **Slider** - Touch-friendly content carousels
- **Team/TeamAdvanced** - Dynamic team member showcases

### Utility Components
- **Background** - Responsive background management
- **Navigation** - Mobile-responsive navigation system
- **Modal** - Accessible modal dialogs
- **Button variations** - Multiple button styles and interactions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Prismic repository access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sanavia-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Add your Prismic repository details
   # PRISMIC_REPOSITORY_NAME=sanavia-website
   # PRISMIC_ACCESS_TOKEN=your-access-token
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Website: `http://localhost:3000`
   - Slice Machine: `http://localhost:9999`

## 🛠️ Development Scripts

```bash
# Development with hot reload and Slice Machine
npm run dev

# Production build
npm run build

# Start production server  
npm start

# Code linting
npm run lint

# Code formatting
npm run format

# Slice Machine only
npm run slicemachine
```

## 🎯 Development Workflow

### Content Management
1. **Slice Development** - Use Slice Machine for visual component development
2. **Content Modeling** - Define custom types and slices in Prismic
3. **Preview System** - Real-time preview of draft content

### Code Quality
- **TypeScript** - Full type safety across the application
- **ESLint** - Automated code quality checks
- **Prettier** - Consistent code formatting
- **Git Hooks** - Pre-commit quality assurance

## 🚀 Deployment

The application is optimized for deployment on modern hosting platforms:

- **Vercel** (Recommended) - Zero-config deployment with Next.js optimization
- **Netlify** - Static site generation with serverless functions
- **AWS/Google Cloud** - Container-based deployment

### Build Optimization
- Automatic code splitting
- Image optimization with Next.js Image component
- CSS optimization and minification
- TypeScript compilation and checking

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use semantic commit messages
3. Ensure all tests pass before submission
4. Follow the established component patterns
5. Update documentation for new features

### Code Style
- Use Prettier for formatting
- Follow ESLint configurations
- Maintain component modularity
- Write descriptive component documentation

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prismic Documentation](https://prismic.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [GSAP Documentation](https://greensock.com/docs/)
- [Matter.js Documentation](https://brm.io/matter-js/docs/)

---

**Built with ❤️ for healthcare innovation**