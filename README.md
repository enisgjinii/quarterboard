# 🏁 Quarterboard Designer

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.177.0-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

A modern, interactive 3D quarterboard customization tool built with Next.js, Three.js, and React Three Fiber. Design and customize quarterboards with real-time 3D preview, individual part coloring, and advanced text customization.

![Quarterboard Designer Demo](https://img.shields.io/badge/Demo-Coming_Soon-green?style=for-the-badge)

## ✨ Features

### 🎨 **Enhanced UI Design**
- **Clean Left Sidebar**: Organized controls with tabbed navigation
- **Collapsible Interface**: Sidebar can be collapsed for more 3D viewing space
- **Modern Glass Design**: Beautiful glassmorphism effects throughout
- **Responsive Layout**: Works perfectly on all screen sizes
- **Dark/Light Mode**: Seamless theme switching

### 🎯 **Individual Mesh Coloring**
- **Click to Select**: Click directly on model parts in the 3D view
- **Independent Colors**: Each mesh part can have its own color
- **Real-time Updates**: See color changes instantly in the 3D viewer
- **Color Picker**: Both visual color picker and hex input support
- **Mesh List**: Dropdown selector for precise part selection

### 📝 **Advanced 3D Text**
- **Click-to-Place**: Enable editing mode and click to position text
- **Multiple Fonts**: Choose from various professional fonts
- **Material Styles**: Standard, Glowing, and Engraved text options
- **Real-time Positioning**: Manual coordinate controls with live preview
- **Text Scaling**: Smooth scaling controls for perfect sizing
- **Visual Feedback**: Clear indicators when in text editing mode

### 📱 **Mobile & AR Support**
- **Mobile Optimized**: Touch-friendly interface with gesture controls
- **AR Integration**: Augmented Reality support for real-world placement
- **Performance Monitoring**: Real-time performance tracking
- **Haptic Feedback**: Tactile feedback for mobile interactions
- **Responsive Design**: Adaptive layout for all screen sizes

### ⚡ **Performance Optimization**
- **Auto Performance Mode**: Automatically detects device capabilities
- **FPS Monitoring**: Real-time frame rate display (development mode)
- **Quality Toggle**: Switch between performance and quality modes
- **Smart Rendering**: Optimized rendering pipeline for smooth experience

### 🛡️ **Error Handling**
- **Comprehensive Error System**: Full error capture and display
- **Mobile Error Overlays**: User-friendly error messages on mobile
- **Error Monitoring**: Developer tools for debugging
- **Graceful Degradation**: Fallback mechanisms for failed operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/quarterboard-designer.git
   cd quarterboard-designer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎛️ How to Use

### **Basic Model Selection**
1. Use the **Model** tab in the left sidebar
2. Select from available quarterboard models
3. Adjust the base model color

### **Individual Part Coloring**
1. Switch to the **Colors** tab
2. **Method 1**: Click directly on model parts in the 3D view
3. **Method 2**: Use the dropdown to select specific parts
4. Use the color picker to customize each part independently

### **3D Text Customization**
1. Go to the **Text** tab in the sidebar
2. Enter your desired text content
3. Choose font, color, and material style
4. **For positioning**:
   - Enable "click-to-place text" mode
   - Click anywhere on the model to position text
   - Use manual coordinates for precise placement

### **Mobile & AR Features**
- **Touch Controls**: Swipe to rotate, pinch to zoom
- **AR Mode**: Enable AR for real-world placement
- **Performance Mode**: Automatic optimization for slower devices
- **Gesture Feedback**: Haptic feedback for interactions

## 📋 Available Models

The application includes 12 professionally designed quarterboard models:

- **Quarterboard** (Base model)
- **Quarterboard_2** (Alternative design)
- **The Captain Ahab**
- **The Cisco Beach**
- **The Gaslight**
- **The Hilderbrand**
- **The Landbank**
- **The Madaket Millies**
- **The MarkFlow**
- **The Original**
- **The Sconset**
- **The Shangri-La**

## 🛠️ Tech Stack

### **Frontend Framework**
- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [React 19](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety

### **3D Graphics**
- [Three.js](https://threejs.org/) - 3D graphics library
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - React renderer for Three.js
- [@react-three/drei](https://github.com/pmndrs/drei) - Useful helpers for R3F

### **Styling & UI**
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible UI primitives
- [Lucide React](https://lucide.dev/) - Beautiful icons

### **Performance & Monitoring**
- Custom performance monitoring hooks
- Device capability detection
- FPS monitoring and optimization

## 📁 Project Structure

```
quarterboard-designer/
├── app/                    # Next.js app directory
│   ├── components/        # React components
│   │   ├── app-sidebar.tsx
│   │   ├── ar-viewer.tsx
│   │   ├── r3f-model-viewer.tsx
│   │   ├── mobile-*.tsx  # Mobile-specific components
│   │   └── error-*.tsx   # Error handling components
│   ├── globals.css       # Global styles
│   └── page.tsx          # Main application page
├── components/            # Shared UI components
│   └── ui/              # Radix UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── public/              # Static assets
│   ├── models/          # 3D model files (.glb)
│   └── fonts/           # Font files
└── styles/              # Additional stylesheets
```

## 🎯 Key Features

### **3D Capabilities**
- **GLTF Model Loading**: Supports complex 3D models with materials
- **Real-time Mesh Manipulation**: Live color changes and selections
- **Advanced Lighting**: Multi-light setup with shadows and reflections
- **Post-processing**: Tone mapping and visual enhancements

### **Performance Features**
- **Device Detection**: Automatic performance optimization
- **Lazy Loading**: Components load only when needed
- **Optimized Rendering**: Smart frame rate limiting
- **Memory Management**: Proper cleanup of 3D resources

### **Mobile Experience**
- **Touch Gestures**: Intuitive mobile controls
- **Performance Monitoring**: Real-time device optimization
- **Error Handling**: Comprehensive mobile error display
- **AR Support**: Augmented reality capabilities

## 🚀 Performance Tips

1. **Enable Performance Mode** on slower devices
2. **Close other browser tabs** for better performance
3. **Use latest browser version** for optimal WebGL support
4. **Ensure good GPU drivers** for best 3D performance

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🔧 Development

### **Available Scripts**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### **Environment Variables**
Create a `.env.local` file for local development:
```env
# Add any environment variables here
NEXT_PUBLIC_APP_NAME=Quarterboard Designer
```

## 🎨 Customization

The application is built with customization in mind:

- **Themes**: Easy to modify color schemes in Tailwind config
- **Models**: Add new .glb files to the `public/models` directory
- **Fonts**: Add new fonts to `public/fonts` and update font list
- **Animations**: Custom CSS animations in `globals.css`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) for 3D graphics capabilities
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) for React integration
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/quarterboard-designer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/quarterboard-designer/discussions)
- **Email**: your-email@example.com

---

**Built with ❤️ using modern web technologies for the best quarterboard customization experience.**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/quarterboard-designer?style=social)](https://github.com/yourusername/quarterboard-designer)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/quarterboard-designer?style=social)](https://github.com/yourusername/quarterboard-designer)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/quarterboard-designer)](https://github.com/yourusername/quarterboard-designer/issues)
[![GitHub license](https://img.shields.io/github/license/yourusername/quarterboard-designer)](https://github.com/yourusername/quarterboard-designer/blob/main/LICENSE)